// ---------------------------------------------------------------------------------------
// THE READING VIEW'S LOOK (docs/plans/SPREADS.md 5.1.1; the owner, 2026-10-23: "the character model orbited by cards against a dark
// background, similar to the title screen ... that screen is a moneyshot in and of itself"). The reading view's scene, camera and
// places are Petra's (render/readingview.js, `game.readingView`); this is what they are dressed in:
//   A CARD        the house deck's own face (the bazaar's atlas, vfx/bazaarfaces.js), one texture for every card; behind it an edge of
//                 light in its suit's colour, breathing (a planet's, `wild`, in the film's slow schiller), so the reading's suits read
//                 from across the dark before a face does
//   A PLACE       empty: a faint frame of light, its suit unknown (still the drop target: the view picks the plane it is drawn on)
//   THE CLOTH     the 8 x 7 grid as a floor of the dark under the feet, seen from above (so the underside: the face is its mirror,
//                 SPREADS.md 5.1): a velvet ground, gold thread between the cells, a lit cell glowing in its suits' colours by their
//                 strength (a ring where counted double), a wild cell in the film's schiller, a dark cell cracked open with its light
//                 gone out, a hidden cell left unlit; the Fool's cell a small gold mark. It is drawn over the view's stand-in tiles,
//                 which it hides.
//   THE FALL      a few house cards drifting far behind and the motes rising, as on the title (title/scene.js), so the dark has depth.
// A world mark of the System's: no words (a position's name is the window's).
//
// Prior art: the house's own title (title/scene.js: "they hang in the fall, cards turning round them"); Persona's Velvet Room; Kingdom
// Hearts' Dive to the Heart (a figure in the dark over a stained-glass floor); the suits' elements as the Rider-Waite deck paints them
// (Wands' fire, Cups' water, Swords' air, Pentacles' earth and gold).
//
//   game.readingLook = new ReadingLook(game)
//   .faceMaterial(card) -> a card's face (the view asks it for a laid card)   .frameMaterial() -> an empty place's
//   .update(rawDt, view) (once a frame after the view's own, while it is active)   READING_LOOK (the numbers)   SUIT_LOOK (the colours)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bazaarAtlas } from './bazaarfaces.js';
import { COLS, ROWS, FOOL_CELL, suitOf } from '../progress/spreads.js';

export const READING_LOOK = {
  card: { w: 0.56, h: 0.92 },          // (m: the view's card, which the edge is sized to)
  edge: 0.035,                         // (m of light round a laid card)
  cloth: { cell: 0.5, y: -0.9, lift: 0.025, glow: 1.6 }, // (the view's cloth: m a cell, its height; m over the tiles; the lit cells' glow)
  fall: 14, motes: 160,
};
const V = READING_LOOK;

/** The suits' colours (the Rider-Waite deck's elements: Wands fire, Cups water, Swords air, Pentacles earth and its gold). */
export const SUIT_LOOK = { wands: 0xff6a2a, cups: 0x3fa8d8, swords: 0xcfd8ff, pentacles: 0xe0b040 };

/** The Majors by their number (Rider-Waite: Strength VIII, Justice XI), as the house deck's atlas lays them (0..21). */
const MAJORS = ['fool', 'magician', 'priestess', 'empress', 'emperor', 'hierophant', 'lovers', 'chariot', 'strength', 'hermit', 'wheel',
  'justice', 'hanged', 'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement', 'world'];
const ATLAS = { w: 128, h: 208, cols: 16, back: 78, size: 2048 };

const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; return t; };

export class ReadingLook {
  constructor(game) {
    this.game = game; this.t = 0; this.film = 0; this.dressed = null;
    this.faces = new Map(); this.cardOf = new Map(); this.edges = new Map();
  }

  // ---------------------------------------------------------------- what the view asks for
  /** One cell of the house deck's atlas as a texture (the atlas's canvas shared, its window moved). */
  cellTex(i) {
    this.atlas ||= tex(bazaarAtlas().canvas);
    const t = this.atlas.clone(), S = ATLAS.size;
    t.repeat.set(ATLAS.w / S, ATLAS.h / S);
    t.offset.set(((i % ATLAS.cols) * ATLAS.w) / S, 1 - ((Math.floor(i / ATLAS.cols) + 1) * ATLAS.h) / S);
    t.needsUpdate = true; return t;
  }
  /** A laid card's face: the house deck's (made once a card). */
  faceMaterial(card) {
    let m = this.faces.get(card);
    if (!m) {
      const i = Math.max(0, MAJORS.indexOf(card));
      m = new THREE.MeshBasicMaterial({ map: this.cellTex(i), side: THREE.DoubleSide, toneMapped: false });
      this.faces.set(card, m); this.cardOf.set(m, card);
    }
    return m;
  }
  /** An empty place: a thin frame of light round a faint pane (drawn once). */
  frameMaterial() {
    if (this.frame) return this.frame;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 104;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(232,220,255,.06)'; g.fillRect(0, 0, 64, 104);
    g.strokeStyle = 'rgba(232,220,255,.9)'; g.lineWidth = 2; g.strokeRect(2, 2, 60, 100);
    g.strokeStyle = 'rgba(232,220,255,.35)'; g.lineWidth = 1; g.strokeRect(7.5, 7.5, 49, 89);
    this.frame = new THREE.MeshBasicMaterial({ map: tex(cv), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, forceSinglePass: true });
    return this.frame;
  }

  // ---------------------------------------------------------------- the dress, once into the view's scene
  dress(view) {
    this.dressed = view;
    const S = view.scene;
    // the cloth over the stand-in tiles
    const C = V.cloth, cv = (this.clothCanvas = document.createElement('canvas'));
    cv.width = COLS * 32; cv.height = ROWS * 32; this.clothCtx = cv.getContext('2d'); this.clothTex = tex(cv);
    this.clothMat = new THREE.MeshStandardMaterial({ map: this.clothTex, emissiveMap: this.clothTex, emissive: 0xffffff, emissiveIntensity: C.glow, roughness: 0.95, metalness: 0 });
    const m = (this.cloth = new THREE.Mesh(new THREE.PlaneGeometry(COLS * C.cell, ROWS * C.cell), this.clothMat));
    m.rotation.x = -Math.PI / 2; m.position.y = C.y + C.lift; S.add(m);
    // the fall, far behind, and the motes
    const backMat = new THREE.MeshBasicMaterial({ map: this.cellTex(ATLAS.back), side: THREE.DoubleSide, toneMapped: false });
    const geo = new THREE.PlaneGeometry(V.card.w * 0.8, V.card.h * 0.8);
    this.fall = [];
    for (let i = 0; i < V.fall; i++) {
      const c = new THREE.Mesh(geo, backMat);
      c.userData = { a: (i / V.fall) * Math.PI * 2, r: 5 + (i % 4) * 2.2, y: -4 + ((i * 7.3) % 12), spin: 0.2 + (i % 5) * 0.12 };
      S.add(c); this.fall.push(c);
    }
    const p = new Float32Array(V.motes * 3);
    for (let i = 0; i < V.motes; i++) p.set([Math.sin(i * 12.9) * 9, -6 + ((i * 3.7) % 14), -2 - Math.abs(Math.cos(i * 7.1)) * 10], i * 3);
    const g = (this.moteGeo = new THREE.BufferGeometry()); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    S.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe9c8, size: 0.06, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })));
    this.edgeGeo = new THREE.PlaneGeometry(V.card.w + V.edge * 2, V.card.h + V.edge * 2);
  }

  /** A slot's edge of light (a child of its card, just behind it: the view picks only the card). */
  edgeOf(id, mesh) {
    let e = this.edges.get(id);
    if (!e || e.parent !== mesh) {
      e?.parent?.remove(e); e?.material.dispose();
      e = new THREE.Mesh(this.edgeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, forceSinglePass: true }));
      e.position.z = -0.004; e.raycast = () => {}; mesh.add(e); this.edges.set(id, e);
    }
    return e;
  }

  // ---------------------------------------------------------------- time
  update(dt, view) {
    if (!view?.active) return;
    if (this.dressed !== view) this.dress(view);
    this.t += dt; this.film += dt * 0.05;
    if (view.cloth) view.cloth.visible = false;
    const L = this.game.laidSpread;
    let i = 0;
    for (const [id, s] of view.slots || []) {
      const card = this.cardOf.get(s.mesh.material), e = this.edgeOf(id, s.mesh); i++;
      if (!card) { e.visible = false; continue; }
      const suit = suitOf(card, !!L?.laid?.[id]?.reversed);
      e.visible = true;
      if (suit === 'wild') e.material.color.setHSL((this.film + i * 0.13) % 1, 0.75, 0.62);
      else e.material.color.setHex(SUIT_LOOK[suit] ?? 0xffffff);
      e.material.opacity = (suit ? 0.55 + 0.35 * Math.sin(this.t * 2.2 + i) : 0.25) * (view.k ?? 1);
    }
    for (const c of this.fall) { // (the title's fall, far behind)
      const U = c.userData; U.y -= dt * 0.35; if (U.y < -6) U.y = 8; U.a += dt * 0.03;
      c.position.set(Math.cos(U.a) * U.r, U.y, -Math.abs(Math.sin(U.a)) * U.r - 3); c.rotation.x += dt * U.spin; c.rotation.y += dt * U.spin * 0.7;
    }
    const mp = this.moteGeo.attributes.position;
    for (let k = 0; k < mp.count; k++) { let y = mp.getY(k) + dt * (0.25 + (k % 5) * 0.08); if (y > 8) y = -6; mp.setY(k, y); }
    mp.needsUpdate = true;
    // the cloth again when what lights it changes, and at 10 Hz while a wild cell's schiller walks
    const cells = L?.cells || [];
    const sig = cells.map((c) => (c ? `${c.dark ? 'd' : ''}${c.hidden ? 'h' : ''}${c.wands}${c.cups}${c.swords}${c.pentacles}${c.wild}` : '-')).join();
    this.filmT = (this.filmT || 0) + dt;
    if (sig !== this.sig || (this.clothWild && this.filmT > 0.1)) { this.sig = sig; this.filmT = 0; this.drawCloth(cells); }
  }

  /** The cloth: the underside seen from above, so the face's cells drawn mirrored. */
  drawCloth(cells) {
    const g = this.clothCtx, s = 32;
    g.fillStyle = '#120a16'; g.fillRect(0, 0, COLS * s, ROWS * s);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cell = cells[r * COLS + (COLS - 1 - c)], x = c * s, y = r * s; // (the face's column COLS-1-c: the cloth is the underside)
      const gr = g.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, s * 0.7); gr.addColorStop(0, '#2a1830'); gr.addColorStop(1, '#140a18');
      g.fillStyle = gr; g.fillRect(x + 1, y + 1, s - 2, s - 2); // (the velvet: a faint nap, darker at the edge)
      if (!cell || cell.hidden) continue;
      if (cell.dark) { // (contrary suits met: the light gone out, the cloth cracked)
        g.strokeStyle = 'rgba(255,190,140,.55)'; g.lineWidth = 1.2; g.beginPath();
        g.moveTo(x + 5, y + 6); g.lineTo(x + 14, y + 15); g.lineTo(x + 11, y + 22); g.lineTo(x + 20, y + 27); g.moveTo(x + 14, y + 15); g.lineTo(x + 25, y + 11); g.stroke();
        continue;
      }
      let R = 0, G = 0, B = 0, sum = 0;
      for (const k of ['wands', 'cups', 'swords', 'pentacles']) {
        const v = cell[k] || 0; if (!v) continue; const col = SUIT_LOOK[k];
        R += ((col >> 16) & 255) * v; G += ((col >> 8) & 255) * v; B += (col & 255) * v; sum += v;
      }
      if (sum > 0) {
        g.fillStyle = `rgba(${(R / sum) | 0},${(G / sum) | 0},${(B / sum) | 0},${Math.min(1, 0.45 + 0.35 * sum)})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
        if (sum >= 2) { g.strokeStyle = 'rgba(255,248,230,.7)'; g.lineWidth = 1; g.strokeRect(x + 4.5, y + 4.5, s - 9, s - 9); } // (counted double)
      }
      if (cell.wild > 0) { // (a planet's: the film's schiller, walking slowly)
        const h = (this.film * 360 + (c + r) * 22) % 360, a = Math.min(1, cell.wild), w = g.createLinearGradient(x, y, x + s, y + s);
        w.addColorStop(0, `hsla(${h},80%,62%,${0.25 + 0.35 * a})`); w.addColorStop(0.5, `hsla(${(h + 90) % 360},80%,68%,${0.15 + 0.3 * a})`);
        w.addColorStop(1, `hsla(${(h + 180) % 360},80%,62%,${0.25 + 0.35 * a})`);
        g.fillStyle = w; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      }
    }
    g.strokeStyle = 'rgba(212,165,60,.55)'; g.lineWidth = 1; // (the gold thread between the cells)
    for (let c = 0; c <= COLS; c++) { g.beginPath(); g.moveTo(c * s + 0.5, 0); g.lineTo(c * s + 0.5, ROWS * s); g.stroke(); }
    for (let r = 0; r <= ROWS; r++) { g.beginPath(); g.moveTo(0, r * s + 0.5); g.lineTo(COLS * s, r * s + 0.5); g.stroke(); }
    const [fc, fr] = FOOL_CELL.under; // (the Fool's mark)
    g.fillStyle = 'rgba(255,211,106,.85)'; g.beginPath(); g.arc(fc * s + s / 2, fr * s + s / 2, 2.5, 0, Math.PI * 2); g.fill();
    this.clothTex.needsUpdate = true;
    this.clothWild = cells.some((c) => c && c.wild > 0 && !c.dark && !c.hidden);
  }
}
