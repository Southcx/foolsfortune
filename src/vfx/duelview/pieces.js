// ---------------------------------------------------------------------------------------
// THE DUEL'S PIECES (the duel's view: vfx/duelview.js): every piece on a puzzle duel's board as one instance of its family's mesh
// (CLAUDE.md: many copies of a prop are a batch), so a full board of 400 is about ten draws. Each piece the view shows is a VISUAL
// (`v`): its kind, colour and side, the cell it is drawn at (fractional while it moves), and what a beat does to it (a squash, a lift,
// a flash, a flip, a spin, a scale). `cells` is the view's own copy of the board (where each visual will be once the beat in hand is
// done), so the beats (vfx/duelview/beats.js) can follow an event that names only a cell. The bodies are two figurines, not instances:
// the Courier's in white clay with a ring of the film turning round it, the foe's idol in its feeling with its data bug's magenta cast
// slid off it (vfx/databug.js's 'cast', drawn here as the mock drew it). An ember (Dread's junk) is a coal of glazed clay, its count in
// glowing pips, its glaze dimming a step each turn it burns down; a teardrop is a drop in the film's own flash (never a gem's colour).
// Dread's fog hides what stands on hidden ground (`fogAt`: the view's, from dread.js visibleTo); the bodies are never hidden.
//
// Materials: the gems and the beads are Lachrymite (vfx/crystalfrets.js crystalFretMaterial, the Dunes' crystals' and the City Trial's
// gems' program, its frets left undrawn); junk, stone and the bomb are clay (one lit standard program, instanced); the teardrops are
// unlit (the data drain's cubes' program); the film ring is the Mind's line (vfx/labradorite.js).
//
// Prior art: three.js's InstancedMesh (one draw a family), Puyo Puyo's squash on landing, Panel de Pon's flicker as a panel converts
// (here the pinch's flip, an Othello disc turned).
//
//   const P = new DuelPieces(parent)   P.build(kernelBoard, foeAspect)   P.at(x, y)   P.byId(id)   P.add(kind, props, x, y) -> v
//   P.move(v, x, y) (the model only)   P.remove(v)   P.hideBody(side, hidden)   P.bodyAt(side) -> v   P.update(dt)   P.list
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { crystalFretMaterial, CrystalFrets } from '../crystalfrets.js';
import { mindLineMaterial } from '../labradorite.js';
import { featTint } from '../oxidation.js';
import { DUEL_VIEW, FEELING_ORDER, cellLocal, feelColour, hash } from './layout.js';
import { gemGeometry, emberGeometry, pipGeometry, junkGeometry, stoneGeometry, bombGeometry, teardropGeometry, courierFigurine, foeIdol, ledgeGeometry } from './piecemodels.js';

const CLAY = { junk: 0x93552f, stone: 0x4c4856, bomb: 0x2c2224 };
const EMBER = [0x3a2a24, 0x6a3020, 0xb0401c, 0xff5a1e], PIP = 0xffb24a; // (an ember's glaze by its count, cooling to its last: 0 cold .. 3 fresh)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _w = new THREE.Color(1, 1, 1), _t = new THREE.Vector3(), _o = new THREE.Vector3();

/** The Lachrymite of the gems and beads (one program with the crystals'), and the clay's. Module-wide: made once, never disposed. */
let MATS = null;
export function duelMaterials() {
  if (MATS) return MATS;
  MATS = {
    gem: crystalFretMaterial({ color: 0xffffff, emissive: 0x2a1a48, emissiveIntensity: 0.45, roughness: 0.22, metalness: 0.15, flatShading: true }, 0xffffff),
    clay: new THREE.MeshStandardMaterial({ name: 'duel-clay', color: 0xffffff, roughness: 0.86, metalness: 0, flatShading: true }),
    clayVc: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true }), // (racewayprops' clay: the frame and the figurines)
    glow: new THREE.MeshBasicMaterial({ name: 'duel-glow', fog: false, toneMapped: false }),
  };
  return MATS;
}

export class DuelPieces {
  constructor(parent) {
    const M = duelMaterials(), N = DUEL_VIEW.maxPieces;
    this.group = new THREE.Group(); this.group.name = 'duel-pieces'; parent.add(this.group);
    this.fam = {};
    const fam = (key, geo, mat, n = N) => {
      const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0; mesh.name = `duel-${key}`;
      if (mat === M.gem) new CrystalFrets(mesh); // (its frets' attributes, never drawn: the gem is its colour)
      this.group.add(mesh); this.fam[key] = mesh; return mesh;
    };
    for (const a of FEELING_ORDER) fam(a, gemGeometry(a), M.gem);
    fam('junk', junkGeometry(), M.clay); fam('stone', stoneGeometry(), M.clay, 64); fam('bomb', bombGeometry(), M.clay, 64);
    fam('teardrop', teardropGeometry(), M.glow, 64); fam('ember', emberGeometry(), M.clay); fam('pip', pipGeometry(), M.glow, 3 * N);
    // the bodies: two figurines
    const cs = DUEL_VIEW.cs;
    this.courier = new THREE.Group(); this.courier.add(new THREE.Mesh(courierFigurine(), M.clayVc));
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.48, 28), mindLineMaterial({ opacity: 0.9, depthTest: true }));
    this.courier.add(this.ring);
    this.foeMat = new THREE.MeshStandardMaterial({ name: 'duel-idol', color: 0xc80018, roughness: 0.5, metalness: 0.1, flatShading: true });
    this.castMat = new THREE.MeshBasicMaterial({ name: 'duel-cast', color: 0xd0207a, transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false });
    const idol = foeIdol();
    this.foe = new THREE.Group(); this.foe.add(new THREE.Mesh(idol, this.foeMat), new THREE.Mesh(ledgeGeometry(), M.clayVc));
    const cast = new THREE.Mesh(idol, this.castMat); cast.position.set(0.07, 0.02, -0.03); this.foe.add(cast);
    const eye = new THREE.BoxGeometry(0.08, 0.05, 0.02), eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff3e0, fog: false, toneMapped: false });
    for (const x of [-0.08, 0.08]) { const e = new THREE.Mesh(eye, eyeMat); e.position.set(x, 0.04, 0.1); this.foe.add(e); }
    for (const b of [this.courier, this.foe]) { b.scale.setScalar(cs); b.visible = false; this.group.add(b); }
    this.list = []; this.cells = []; this.ids = new Map(); this.board = { w: 20, h: 20 }; this.t = 0; this.bodyHidden = [false, false];
  }

  /** The view's board from the kernel's (at open, and to settle up after a play). */
  build(board, foeAspect = 'fury') {
    this.board = { w: board.w, h: board.h };
    this.list.length = 0; this.ids.clear(); this.cells = new Array(board.w * board.h).fill(null);
    feelColour(foeAspect, this.foeMat.color);
    board.each((p, x, y) => this.add(p.kind, { id: p.id, colour: p.colour, side: p.side, count: p.count }, x, y));
  }

  idx(x, y) { return y * this.board.w + x; }
  in(x, y) { return x >= 0 && y >= 0 && x < this.board.w && y < this.board.h; }
  at(x, y) { return this.in(x, y) ? this.cells[this.idx(x, y)] : null; }
  byId(id) { return id != null ? this.ids.get(id) || null : null; }
  bodyAt(side) { return this.list.find((v) => v.kind === 'body' && v.side === side) || null; }

  /** A new visual at a cell (and in the model there). */
  add(kind, { id = null, colour = null, side = null, count = null } = {}, x = 0, y = 0) {
    const v = { id, kind, colour, side, count, cool: 0, x, y, cx: x, cy: y, s: 1, sx: 1, sy: 1, lift: 0, flash: 0, flip: 0, spin: 0, dx: 0, dy: 0, hidden: false, seed: hash(id ?? x * 31 + y, 4.7) };
    this.list.push(v); if (id != null) this.ids.set(id, v);
    if (this.in(x, y)) { this.cells[this.idx(x, y)] = v; v.cx = x; v.cy = y; }
    return v;
  }
  /** The model's move (where it will be): the drawn place (`x`, `y`) is the beat's to animate. */
  move(v, x, y) {
    if (!v) return;
    if (this.in(v.cx, v.cy) && this.cells[this.idx(v.cx, v.cy)] === v) this.cells[this.idx(v.cx, v.cy)] = null;
    v.cx = x; v.cy = y; if (this.in(x, y)) this.cells[this.idx(x, y)] = v;
  }
  remove(v) {
    if (!v) return;
    if (this.in(v.cx, v.cy) && this.cells[this.idx(v.cx, v.cy)] === v) this.cells[this.idx(v.cx, v.cy)] = null;
    const i = this.list.indexOf(v); if (i >= 0) this.list.splice(i, 1);
    if (v.id != null && this.ids.get(v.id) === v) this.ids.delete(v.id);
  }
  adopt(v, id) { if (v && id != null && v.id !== id) { if (v.id != null) this.ids.delete(v.id); v.id = id; this.ids.set(id, v); } }
  hideBody(side, hidden) { this.bodyHidden[side] = hidden; }

  /** Each frame: every visual to its family's instance (real seconds). */
  update(dt) {
    this.t += dt;
    const cs = DUEL_VIEW.cs, n = {}, B = this.board;
    for (const k in this.fam) n[k] = 0;
    this.courier.visible = this.foe.visible = false;
    for (const v of this.list) {
      if (v.hidden) continue;
      cellLocal(v.x + v.dx, v.y + v.dy, B, _p); _p.z += v.lift * cs;
      if (v.kind === 'body') {
        const b = v.side === 0 ? this.courier : this.foe; if (this.bodyHidden[v.side]) continue;
        b.visible = true; b.position.copy(_p); b.scale.set(cs * v.s * v.sx, cs * v.s * v.sy, cs * v.s);
        if (v.side === 0) this.ring.rotation.z = this.t * 0.6; else b.rotation.z = Math.sin(this.t * 1.3 + v.seed * 6) * 0.08;
        continue;
      }
      if (this.fogAt && this.fogAt(Math.round(v.x + v.dx), Math.round(v.y + v.dy)) > 0.5) continue; // (on hidden ground: Dread's fog)
      let key = v.kind;
      if (v.kind === 'gem') key = this.fam[v.colour] ? v.colour : 'fury';
      if (v.kind === 'teardrop') { _p.y += Math.sin(this.t * 2.4 + v.seed * 6.28) * 0.1 * cs; _p.z += 0.03; }
      const mesh = this.fam[key]; if (!mesh || n[key] >= mesh.instanceMatrix.count) continue;
      const i = n[key]++;
      _e.set(0, v.flip, v.spin + (v.kind === 'teardrop' ? Math.sin(this.t * 1.7 + v.seed * 9) * 0.15 : 0)); _q.setFromEuler(_e);
      const big = v.kind === 'teardrop' ? 1.2 : 1; _s.set(cs * v.s * v.sx * big, cs * v.s * v.sy * big, cs * v.s * big);
      mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
      if (v.kind === 'gem') feelColour(v.colour, _c); else if (v.kind === 'teardrop') featTint(this.t * 0.3 + v.seed, _c, { bright: 1.9 }); // (the film's flash, walking)
      else if (v.kind === 'ember') { const k = Math.max(0, Math.min(3, v.count ?? 3)); _c.setHex(EMBER[k]).multiplyScalar(1 + 0.15 * Math.sin(this.t * 3 + v.seed * 9) * (k / 3)); }
      else _c.setHex(CLAY[v.kind] ?? CLAY.junk);
      if (v.cool) { v.cool = Math.max(0, v.cool - dt / 0.5); _c.lerp(_w, v.cool * 0.6); }
      if (v.flash) _c.lerp(_w, Math.min(1, v.flash));
      mesh.setColorAt(i, _c);
      if (v.kind === 'ember') { const pips = this.fam.pip, k = Math.max(0, Math.min(3, v.count ?? 3)); // (its count: pips across its face, glowing)
        for (let j = 0; j < k && n.pip < pips.instanceMatrix.count; j++) { const o = (j - (k - 1) / 2) * 0.24 * cs * v.s;
          _e.set(0, 0, v.spin); _q.setFromEuler(_e); const pp = _t.copy(_p).add(_o.set(o, -0.02 * cs, 0.24 * cs * v.s));
          pips.setMatrixAt(n.pip, _m.compose(pp, _q, _s.setScalar(cs * v.s))); pips.setColorAt(n.pip++, _c.setHex(PIP).multiplyScalar(1.1 + 0.4 * Math.sin(this.t * 4 + j + v.seed * 7))); } }
    }
    for (const k in this.fam) { const m = this.fam[k]; m.count = n[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
}
