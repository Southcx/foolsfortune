// ---------------------------------------------------------------------------------------
// THE DUEL'S MARKS (the duel's view: vfx/duelview.js): what is laid over a puzzle duel's board that is not a piece. No words: the only
// type is a number where one is read (CLAUDE.md: the overlay may carry numbers in the System's own type), in Jersey 15 (the count face,
// src/ui/theme.js), drawn once into a glyph atlas (digits, the arrows, x and +) and set as quads.
//   A CELL RIM      the god hand's hover and its selection: a square of the film's light round a cell (the Mind's line, vfx/labradorite.js)
//   A DUEL'S CHAIN  its step's numeral popping from the middle of its clear and rising 0.7 of a cell, the Courier's in the film's colour,
//                   the foe's in its feeling (Puyo's chain voice, Panel de Pon's counter on the panels)
//   THE JUNK COUNTS on the Line's head: what waits to land on each side, an arrow toward the side it will land on, in the sender's colour
//   THE STARS       a buckled side's gold stars wheeling round its figurine, one a stun depth (vfx/dizzy.js's star and gold)
//
// Prior art: Puyo Puyo's chain counter, Tetris 99's incoming-garbage meter (the waiting count by the well), Panel de Pon's chain number
// over the panels that made it; the stunned stars of the cartoon, as vfx/dizzy.js.
//
//   const K = new DuelMarks(parent)   K.layout(board)   K.hover(cell | null)   K.select(cells)   K.numeral(text, local, hex)
//   K.counts(toCourier, toFoe, courierHex, foeHex, faint?)   K.stars(side, depth, local | null)   K.label(text, hex) -> a Label   K.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial } from '../labradorite.js';
import { starGeometry } from '../dizzy.js';
import { FONT } from '../../ui/theme.js';
import { DUEL_VIEW, cellLocal, ease, clamp01 } from './layout.js';

const GLYPHS = '0123456789<>x+-!', G = 64, COUNT = (px) => `${px}px 'Jersey 15', ${FONT.sys}`;
const _v = new THREE.Vector3();

/** The atlas: each glyph in a 64 px cell, pale with an ink keyline, drawn once (and again when the count face has loaded). */
function makeAtlas() {
  const c = document.createElement('canvas'); c.width = G * GLYPHS.length; c.height = G;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const draw = () => {
    const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.font = COUNT(58); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    for (let i = 0; i < GLYPHS.length; i++) { const cx = i * G + G / 2; x.lineWidth = 9; x.strokeStyle = '#17111f'; x.strokeText(GLYPHS[i], cx, G / 2 + 3); x.fillStyle = '#ffffff'; x.fillText(GLYPHS[i], cx, G / 2 + 3); }
    tex.needsUpdate = true;
  };
  draw(); document.fonts?.load?.(COUNT(58)).then(draw, () => {});
  return tex;
}

/** A row of glyph quads (one material a glyph and colour, shared). */
class Label {
  constructor(owner) { this.owner = owner; this.group = new THREE.Group(); this.quads = []; this.text = null; this.hex = null; }
  set(text, hex) {
    text = String(text); if (text === this.text && hex === this.hex) return this;
    this.text = text; this.hex = hex;
    for (const q of this.quads) q.visible = false;
    const n = text.length;
    for (let i = 0; i < n; i++) {
      let q = this.quads[i]; if (!q) { q = new THREE.Mesh(this.owner.quad, null); q.renderOrder = 6; this.group.add(q); this.quads[i] = q; }
      q.material = this.owner.glyph(text[i], hex); q.visible = true; q.position.set((i - (n - 1) / 2) * 0.62, 0, 0);
    }
    return this;
  }
}

export class DuelMarks {
  constructor(parent) {
    this.group = new THREE.Group(); this.group.name = 'duel-marks'; parent.add(this.group);
    this.atlas = null; this.mats = new Map(); this.quad = new THREE.PlaneGeometry(1, 1);
    // the cell rims: a square frame of the film's light (unit cell)
    const s = new THREE.Shape([new THREE.Vector2(-0.5, -0.5), new THREE.Vector2(0.5, -0.5), new THREE.Vector2(0.5, 0.5), new THREE.Vector2(-0.5, 0.5)]);
    s.holes.push(new THREE.Path([new THREE.Vector2(-0.4, -0.4), new THREE.Vector2(-0.4, 0.4), new THREE.Vector2(0.4, 0.4), new THREE.Vector2(0.4, -0.4)]));
    this.rimGeo = new THREE.ShapeGeometry(s); this.rimMat = mindLineMaterial({ opacity: 1, depthTest: true, bright: 1.6 }); this.selMat = mindLineMaterial({ opacity: 0.85, depthTest: true, bright: 1.1 });
    this.hoverRim = new THREE.Mesh(this.rimGeo, this.rimMat); this.hoverRim.visible = false; this.hoverRim.renderOrder = 5; this.group.add(this.hoverRim);
    this.selRims = [];
    this.pops = []; this.free = [];
    this.countL = [this.label(), this.label()]; for (const L of this.countL) this.group.add(L.group);
    // the stars: gold, lit facets over a glow (vfx/dizzy.js's gold)
    this.starMat = new THREE.MeshLambertMaterial({ color: 0x8a5a0c, emissive: 0xd99a22, toneMapped: false });
    this.starSets = [0, 1].map(() => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(new THREE.Mesh(starGeometry(0.05), this.starMat)); g.visible = false; this.group.add(g); return { g, depth: 0, k: 0, at: new THREE.Vector3(), t: 0 }; });
    this.board = { w: 20, h: 20 };
  }

  layout(board) { this.board = { w: board.w, h: board.h }; this.lineCol = board.line; }

  /** One material a glyph and colour (sRGB hex): the atlas's cell for it. */
  glyph(ch, hex) {
    const key = ch + '|' + hex; let m = this.mats.get(key); if (m) return m;
    this.atlas ||= makeAtlas();
    const i = Math.max(0, GLYPHS.indexOf(ch)), map = this.atlas.clone(); map.repeat.set(1 / GLYPHS.length, 1); map.offset.set(i / GLYPHS.length, 0); map.needsUpdate = true;
    m = new THREE.MeshBasicMaterial({ name: 'duel-glyph', map, color: hex, transparent: true, depthWrite: false, fog: false, toneMapped: false });
    this.mats.set(key, m); return m;
  }
  label() { return new Label(this); }

  /** The god hand's hover: a rim round one cell (null: none). */
  hover(cell) {
    const r = this.hoverRim; r.visible = !!cell; if (!cell) return;
    cellLocal(cell.x, cell.y, this.board, r.position); r.position.z += 0.012; r.scale.setScalar(DUEL_VIEW.cs);
  }
  /** The god hand's selection: a rim round each cell given. */
  select(cells = []) {
    cells = cells || [];
    while (this.selRims.length < cells.length) { const m = new THREE.Mesh(this.rimGeo, this.selMat); m.renderOrder = 5; this.group.add(m); this.selRims.push(m); }
    this.selRims.forEach((m, i) => { const c = cells[i]; m.visible = !!c; if (!c) return; cellLocal(c.x ?? c[0], c.y ?? c[1], this.board, m.position); m.position.z += 0.01; m.scale.setScalar(DUEL_VIEW.cs * 0.86); });
  }

  /** A number popping from a point (the board's frame) and rising 0.7 of a cell over 0.9 real s: a duel's chain step. */
  numeral(text, local, hex, { dur = 0.9, size = 1.6 } = {}) {
    const L = this.free.pop() || this.label(); L.set(text, hex); L.group.visible = true; this.group.add(L.group);
    this.pops.push({ L, at: local.clone(), age: 0, dur, size });
  }

  /** The junk waiting on the Line's head: toward the Courier (the foe's, left of the head) and toward the foe (the Courier's, right). */
  counts(toCourier, toFoe, courierHex, foeHex, faint = false) {
    const { cs, base, border: b, lip } = DUEL_VIEW, x = ((this.lineCol ?? 10) - this.board.w / 2) * cs, y = base + this.board.h * cs + b * 1.6;
    const [A, B] = this.countL;
    A.group.visible = toCourier > 0; if (toCourier > 0) { A.set('<' + toCourier, foeHex); A.group.position.set(x - cs * (0.9 + 0.35 * String(toCourier).length), y, lip + 0.02); }
    B.group.visible = toFoe > 0; if (toFoe > 0) { B.set(toFoe + '>', courierHex); B.group.position.set(x + cs * (0.9 + 0.35 * String(toFoe).length), y, lip + 0.02); }
    for (const L of this.countL) L.group.scale.setScalar(cs * (faint ? 1.1 : 1.5));
  }
  setLine(col) { this.lineCol = col; }

  /** A side's stun stars (depth 0: none) round a point of the board (its figurine's head). */
  stars(side, depth, local = null) { const S = this.starSets[side]; S.depth = depth; if (local) S.at.copy(local); }

  update(dt) {
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]; p.age += dt; const u = p.age / p.dur;
      if (u >= 1) { p.L.group.visible = false; this.free.push(p.L); this.pops.splice(i, 1); continue; }
      const s = DUEL_VIEW.cs * p.size * ease(clamp01(u / 0.18), 2.4) * (u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1);
      p.L.group.position.copy(p.at).add(_v.set(0, 0.7 * DUEL_VIEW.cs * Math.min(1, u * 1.4), 0.04)); p.L.group.scale.setScalar(Math.max(1e-4, s));
    }
    for (const S of this.starSets) {
      S.k = Math.max(0, Math.min(1, S.k + (S.depth > 0 ? dt / 0.35 : -dt / 0.35))); S.t += dt * 5.5;
      S.g.visible = S.k > 0.01; if (!S.g.visible) continue;
      S.g.position.copy(S.at);
      S.g.children.forEach((m, i) => {
        const a = S.t + (i / 3) * Math.PI * 2, R = DUEL_VIEW.cs * 0.62; m.visible = i < Math.max(1, S.depth);
        m.position.set(Math.cos(a) * R, Math.sin(a * 0.5 + i) * 0.015, Math.sin(a) * R * 0.45 + 0.06); m.rotation.y += dt * 9;
        m.scale.setScalar(ease(S.k, 2) * 0.9);
      });
    }
  }
}
