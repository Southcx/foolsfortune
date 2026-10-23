// ---------------------------------------------------------------------------------------
// THE READING VIEW (docs/plans/SPREADS.md 5.1.1, the owner's moneyshot): the Pneuka Box turned over is not a flat underside but a reading.
// The world goes to the title's dark, and the Courier hangs in it as in the title's fall ("they hang in the fall, cards turning round
// them", title/scene.js). The laid Major Arcana orbit them in the spread's own geometry, seen from the front: the Celtic Cross's cross
// at their heart (the Courier is the significator, the Fool being you; the Present over them, the Challenge across it, the Crown above
// the head, the Foundation below the feet, the Past and the Near future either side) and its staff a column beside them; the Horseshoe
// an arc over them; three cards in a row before them. Each turns slowly in place, its face to the camera; a reversed one hangs upside
// down. The grid is the cloth under their feet: the 8 by 7 cells as a floor of the dark, each lit in its suit's colour (the underside
// as you lay it, seen from above: the face's cells mirrored back, progress/spreads.js MIRROR).
//
// The scene and the camera are Petra's; the look is Calissa's (the materials here are plain stand-ins: an unlit card face, a cell's
// colour by suit); the rules it draws are Dovina's (progress/spreads.js), the state Petra's (progress/laidspread.js). It opens on
// `spread.flip { under: true }` while the Box's window is open, and closes on the flip back or the window closing: the camera rises
// through the cloth into the reading, and turns down through it again on the way back. The window's own flip side (the hand, the
// drag) draws over it and asks it where a card would go (`positionAt`, `cardAt`).
//
// Prior art: our title's fall; Persona's Velvet Room (a reading in a room outside the world); Kingdom Hearts' Dive to the Heart (a figure
// in the dark on a stained-glass floor); the Golden Dawn's diagram of the Celtic Cross.
//
//   game.readingView = new ReadingView(game)   .active   .update(rawDt)   .render()   .positionAt(x, y) -> position id | null
//   .cardAt(x, y) -> position id of a laid card | null   (x, y: client pixels)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SPREADS, COLS, ROWS, MIRROR, cellIndex } from '../progress/spreads.js';
import { cardArt } from '../tools/veritome/cards.js';

/** Where each position hangs, about the Courier (x right, y up, z toward the camera; metres): the spread's own shape, from the front. */
const AT = {
  one: { present: [0, 1.15, 0.9] },
  three: { past: [-1.5, 1.15, 0.6], present: [0, 1.15, 0.9], future: [1.5, 1.15, 0.6] },
  horseshoe: Object.fromEntries(['past', 'present', 'hidden', 'obstacles', 'others', 'advice', 'outcome'].map((id, i) => {
    const a = Math.PI * (0.95 - i * 0.15); return [id, [Math.cos(a) * 1.9, 1.0 + Math.sin(a) * 1.5, 0.5]]; })), // (an arc over them, left to right)
  celtic: {
    present: [0, 1.1, 0.6], challenge: [0, 1.1, 0.7], crownPosition: [0, 2.45, 0.5], foundation: [0, -0.25, 0.5],
    past: [-1.35, 1.1, 0.5], future: [1.35, 1.1, 0.5], self: [2.7, -0.15, 0.3], environment: [2.7, 0.8, 0.3], hopes: [2.7, 1.75, 0.3], outcome: [2.7, 2.7, 0.3],
  },
};
/** The cloth's cells: a stand-in palette by suit (Calissa's to replace) and its size. */
const SUIT_COL = { wands: new THREE.Color(0xff6a3a), cups: new THREE.Color(0x3a8cff), swords: new THREE.Color(0xf2e27a), pentacles: new THREE.Color(0x5ccf6a), wild: new THREE.Color(0xfff4dc) };
const CELL = 0.5, CLOTH_Y = -0.9, OPEN = 0.7; // (m a cell; the cloth's height under the feet; real s the camera takes through it)
const smooth = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const _c = new THREE.Color(), _m = new THREE.Matrix4(), _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();

export class ReadingView {
  constructor(game) {
    this.game = game; this.active = false; this.k = 0; this.dir = 0; this.t = 0; this.ch = null;
    const S = (this.scene = new THREE.Scene());
    S.background = new THREE.Color(0x0b0614); S.fog = new THREE.Fog(0x1a0f2a, 9, 30);
    this.camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.05, 80);
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); });
    S.add(new THREE.HemisphereLight(0x9a86c8, 0x1a0f2a, 1.1));
    const key = new THREE.DirectionalLight(0xffe2c0, 1.6); key.position.set(2, 4, 5); S.add(key);
    // the cloth: 56 cells, each a tile tinted by what lights it
    this.cloth = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL * 0.94, 0.04, CELL * 0.94), new THREE.MeshBasicMaterial({ color: 0xffffff }), COLS * ROWS);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      _m.makeTranslation((c - (COLS - 1) / 2) * CELL, CLOTH_Y, (r - (ROWS - 1) / 2) * CELL);
      this.cloth.setMatrixAt(cellIndex(c, r), _m); this.cloth.setColorAt(cellIndex(c, r), _c.set(0x221a2e));
    }
    S.add(this.cloth);
    // a card a position (a frame where it is empty: the drop target), and its face when laid
    this.cardGeo = new THREE.PlaneGeometry(0.56, 0.92);
    this.frameMat = new THREE.MeshBasicMaterial({ color: 0x8a76b8, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
    this.faces = new Map(); // card id -> material (its art, drawn once: tools/veritome/cards.js cardArt)
    this.slots = new Map(); // position id -> { mesh, at }
    this.built = null;
    game.events?.on?.('spread.flip', (e) => { if (e.under) this.open(); else this.close(); });
  }

  face(card) {
    let m = this.faces.get(card);
    if (!m) { const t = new THREE.CanvasTexture(cardArt(`arcana.${card}`, 120, 200)); t.colorSpace = THREE.SRGBColorSpace; m = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); this.faces.set(card, m); }
    return m;
  }
  /** The positions of the spread laid, built again when the spread changes. */
  build(spreadId) {
    for (const s of this.slots.values()) this.scene.remove(s.mesh);
    this.slots.clear();
    const A = AT[spreadId] || {};
    for (const p of SPREADS[spreadId].positions) {
      if (p.fixed === 'fool') continue; // (the significator is the Fool, and the Fool is you: the Courier hangs in its place)
      const mesh = new THREE.Mesh(this.cardGeo, this.frameMat), at = new THREE.Vector3(...(A[p.id] || [0, 1.1, 0.6]));
      mesh.position.copy(at); mesh.userData.position = p.id; mesh.userData.turn = p.turn ? Math.PI / 2 : 0;
      this.scene.add(mesh); this.slots.set(p.id, { mesh, at, phase: Math.random() * 6.28 });
    }
    this.built = spreadId;
  }

  /** The reading opens: the Courier borrowed from the title (the same model and clips, dressed as in the world), the camera up through the cloth. */
  open() {
    if (!this.game.pneukaUI?.open || this.dir > 0 || (this.active && this.dir === 0)) return;
    const ch = this.game.title?.scene?.ch;
    if (ch) { this.ch = ch; this.was = { p: ch.root.position.clone(), r: ch.root.rotation.clone() }; this.scene.add(ch.root); ch.root.position.set(0, 0, 0); ch.root.rotation.set(0, 0, 0); this.game.vessel?.dress?.(ch); }
    this.active = true; this.dir = 1; this.t = 0;
  }
  /** The flip back: the camera turns down through the cloth, then the world. */
  close() { if (this.active) this.dir = -1; }
  finish() {
    this.active = false; this.dir = 0; this.k = 0;
    const ch = this.ch; this.ch = null;
    if (ch) { this.game.vessel?.dressed?.delete?.(ch); const T = this.game.title?.scene; if (T?.scene) T.scene.add(ch.root); if (this.was) { ch.root.position.copy(this.was.p); ch.root.rotation.copy(this.was.r); } }
  }

  update(raw = 1 / 60) {
    if (!this.active) return;
    const L = this.game.laidSpread;
    if (!this.game.pneukaUI?.open && this.dir >= 0) { if (L?.under) L.flip(false); this.close(); } // (the window shut while turned over: the Box turns back with it)
    this.k = THREE.MathUtils.clamp(this.k + (this.dir || 0) * raw / OPEN, 0, 1);
    if (this.dir < 0 && this.k <= 0) { this.finish(); return; }
    if (this.dir > 0 && this.k >= 1) this.dir = 0;
    this.t += raw;
    if (L && this.built !== L.spread) this.build(L.spread);
    // the Courier hangs, as in the title's fall
    const ch = this.ch;
    if (ch) { ch.pose_ ||= ch.clips.pose(); ch.root.position.y = Math.sin(this.t * 0.8) * 0.05; ch.applyPose(ch.clips.sample(ch.clips.clips.jumpLoop ? 'jumpLoop' : 'idle', this.t * 0.35, ch.pose_, true)); }
    // the cards: laid ones show their faces, empty places a frame; each turns slowly in place, facing the camera
    for (const [id, s] of this.slots) {
      const P = SPREADS[this.built].positions.find((p) => p.id === id);
      const card = P?.fixed || (P?.pair ? (L?.pairCard && this.game.collection?.has(`arcana.${L.pairCard}`) ? L.pairCard : null) : L?.laid[id]?.card);
      const rev = !!L?.laid[id]?.reversed;
      s.mesh.material = card ? this.face(card) : this.frameMat;
      s.mesh.position.set(s.at.x, s.at.y + Math.sin(this.t * 0.9 + s.phase) * 0.04, s.at.z);
      s.mesh.rotation.set(0, Math.sin(this.t * 0.5 + s.phase) * 0.25, s.mesh.userData.turn + (rev ? Math.PI : 0));
    }
    // the cloth: the underside as laid, each cell in its suits' colours (dark where contrary suits meet)
    const cells = L?.cells || [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cell = cells[cellIndex(MIRROR ? COLS - 1 - c : c, r)];
      _c.set(0x221a2e);
      if (cell?.dark) _c.set(0x0e0a10);
      else if (cell) {
        const w = cell.wands + cell.cups + cell.swords + cell.pentacles + cell.wild;
        if (w > 0) { _c.setRGB(0, 0, 0); for (const s of ['wands', 'cups', 'swords', 'pentacles', 'wild']) if (cell[s] > 0) _c.r += SUIT_COL[s].r * cell[s] / w, _c.g += SUIT_COL[s].g * cell[s] / w, _c.b += SUIT_COL[s].b * cell[s] / w; _c.multiplyScalar(0.35 + 0.4 * Math.min(2, w)); }
      }
      this.cloth.setColorAt(cellIndex(c, r), _c);
    }
    this.cloth.instanceColor.needsUpdate = true;
    // the camera: up through the cloth into the reading (and down again on the way back)
    const e = smooth(this.k), C = this.camera;
    C.position.set(0, THREE.MathUtils.lerp(CLOTH_Y - 1.2, 1.9, e), THREE.MathUtils.lerp(0.4, 7.2, e));
    C.lookAt(0, THREE.MathUtils.lerp(CLOTH_Y - 3, 0.7, e), 0);
  }
  render() { this.game.post.render(this.scene, this.camera); }

  pickAt(x, y, laidOnly) {
    if (!this.active) return null;
    _ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.camera.updateMatrixWorld(); this.scene.updateMatrixWorld(); // (asked between frames: the cards where they hang now)
    _ray.setFromCamera(_ndc, this.camera);
    const hits = _ray.intersectObjects([...this.slots.values()].map((s) => s.mesh), false);
    for (const h of hits) { const id = h.object.userData.position; if (!laidOnly || this.game.laidSpread?.laid[id]) return id; }
    return null;
  }
  /** The position under a point of the screen (a drop target for a card from the hand). */
  positionAt(x, y) { return this.pickAt(x, y, false); }
  /** The position of a laid card under a point of the screen (to reverse it, or take it back). */
  cardAt(x, y) { return this.pickAt(x, y, true); }
}
