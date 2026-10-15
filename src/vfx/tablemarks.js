// ---------------------------------------------------------------------------------------
// THE MARKS ON THE CLOTH (docs/handoffs/dovina/casino-clarity-art-brief.md section 2d; Calissa's casino clarity pass, task E): the
// table view's world marks, drawn on the cloth and carrying no words. The film (violet, teal, gold, magenta, walking) means only
// "now / you can / it matters"; the seat colour means only "whose", and always travels with its shape (a second cue for the
// colour-blind: Red circle, Yellow triangle, Green square, Blue diamond, Purple hexagon, Pink star, Black cross, White ring).
//   - THE TURN RING: round the acting seat (a bot's too), the seat's colour outside and a ring of film-lit arcs walking round inside.
//   - THE SEAT MARKER: the seat's shape lying on the cloth at its place, and a small copy of it at the corner of every piece it owns.
//   - A SEAT RIM: a thin band in the seat colour round each piece the seat owns (`seats[].owns`).
//   - A LEGAL RIM: a film-lit band, a hair proud of the cloth, round each piece you may take.
//   - THE CHOSEN: a wider white-gold rim, double banded, and a lift (`lift(id)`, 0.06 m) the table adds to the piece.
//   - THE DIM: no rim; a dark well in the felt round the piece, and `sink(id)` / `shade(id)` for the table to lower and darken it.
// Everything is one PieceBatch (vfx/bazaarpieces.js) of its own, so three draw calls however many marks. 0 new programs: its three
// materials are the stock MeshStandardMaterial with a map (the bazaar pieces' own parameters), told apart only by uniforms; the
// map is a 64 px atlas of flat cells (the eight seat colours, the film's base, white-gold, the well), drawn once. The lit
// material's emissive walks the film by `schillerInk` (vfx/oxidation.js), as the table's own lit pieces do: never a second iridescence.
//
// Prior art: Mahjong Soul's and Hearthstone's lit playable pieces, a poker client's acting-seat halo and fold-dim, Slay the Spire's
// glowing playable cards, Okabe-Ito's colour-blind palette plus a shape cue (the brief's hexes), Overcooked's turn rings.
//
//   const marks = new TableMarks(sceneOrGroup, { frame, clothY, seatLook })   frame: an Object3D whose world matrix the marks follow (the
//     table's piece mesh, so they sit in its frame); clothY: the cloth's height in that frame (default 0); seatLook: { Red: { hex, shape }, ... }
//     to use instead of the built-in eight (Calissa's seatlook.js at the merge).
//   marks.set({ turnSeat, seats: [{ seat, colour, at: Vector3, owns?: [pieceId] }], legal: [id], chosen: [id], dim: [id] },
//             pieceAt)   pieceAt(id) -> { pos: Vector3 (its place on the cloth; only x and z are read), size: number | { w, d }, yaw?, round? } | null
//   marks.update(dt)   marks.lift(id) -> metres to add to the piece   marks.sink(id) -> metres (negative) to add   marks.shade(id) -> 1..0.35
//   marks.dispose()    marks.mesh    SEAT_MARK_LOOK    markSeatShape(colour)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PieceBatch } from './bazaarpieces.js';
import { schillerInk } from './oxidation.js';

/** The brief's eight seat colours: hex, the shape cue, and the keyline that keeps it off the felt (Yellow and White dark, Black pale). */
export const SEAT_MARK_LOOK = {
  Red: { hex: 0xd55e00, shape: 'circle' }, Yellow: { hex: 0xf0e442, shape: 'triangle', keyline: 0x1a1420 }, Green: { hex: 0x009e73, shape: 'square' },
  Blue: { hex: 0x0072b2, shape: 'diamond' }, Purple: { hex: 0x7b4fa6, shape: 'hexagon' }, Pink: { hex: 0xcc79a7, shape: 'star' },
  Black: { hex: 0x1a1a1a, shape: 'cross', keyline: 0xd8d4dc }, White: { hex: 0xf2f2f2, shape: 'ring', keyline: 0x1a1420 },
};
const NAMES = Object.keys(SEAT_MARK_LOOK);
/** The shape a seat colour wears (a name 'Red', or a hex number). */
export const markSeatShape = (colour, look = SEAT_MARK_LOOK) => (typeof colour === 'number' ? Object.values(look).find((l) => l.hex === colour)?.shape : look[colour]?.shape) || 'circle';

/** The numbers (metres, real seconds): the turn ring's radius and band widths, the rims' reach and widths, the seat marker's radius,
 *  the chosen lift, the dim sink, how fast a mark comes or goes (per second) and the film's walk. */
export const MARKS = { turn: { r: 0.35, outer: 0.024, inner: 0.02, arcs: 12, spin: 0.35, pulse: 0.03 }, rim: 0.004, band: 0.005, legal: 0.005, chosen: 0.009,
  marker: 0.05, pip: 0.016, lift: 0.06, sink: -0.003, ease: 14, glint: 0.22, y: 0.004, shade: 0.35 };

// ------------------------------------------------------------------ the atlas: 8 columns of flat cells; a cell's colour read at its centre
const CELLS = 8, PX = 8;
const CELL = { film: 8, gold: 9, well: 10, dark: 11 }; // (seat colours are 0..7 in NAMES' order)
let ATLAS = null;
function atlas(look) {
  if (ATLAS) return ATLAS;
  const cv = document.createElement('canvas'); cv.width = cv.height = CELLS * PX; const g = cv.getContext('2d');
  const fill = (i, hex) => { g.fillStyle = `#${hex.toString(16).padStart(6, '0')}`; g.fillRect((i % CELLS) * PX, Math.floor(i / CELLS) * PX, PX, PX); };
  NAMES.forEach((n, i) => fill(i, look[n].hex)); fill(CELL.film, 0x2a2038); fill(CELL.gold, 0xfff0b8); fill(CELL.well, 0x07050b); fill(CELL.dark, 0x120d18);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.anisotropy = 4; // (as bazaarfaces.js's)
  return (ATLAS = { tex, uv: (i) => [((i % CELLS) + 0.5) / CELLS, 1 - (Math.floor(i / CELLS) + 0.5) / CELLS] });
}

// ------------------------------------------------------------------ templates: flat shapes in the xz plane facing up, y 0
const TPL = new Map();
const memo = (key, make) => { let t = TPL.get(key); if (!t) TPL.set(key, (t = make())); return t; };
function flat() {
  const pos = [], nrm = [], uv = [];
  return {
    /** A triangle, wound to face up whatever order it was given. */
    tri(a, b, c, y, u) { if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0) [b, c] = [c, b]; for (const p of [a, b, c]) { pos.push(p[0], y, p[1]); nrm.push(0, 1, 0); uv.push(u[0], u[1]); } },
    /** A closed outline (points [x,z]) as a band from its path out by `w` (or in, a negative w). */
    band(pts, w, y, u) {
      const n = pts.length, edge = (i) => { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dz / l, -dx / l]; };
      const off = pts.map((p, i) => { const e0 = edge((i + n - 1) % n), e1 = edge(i); let nx = e0[0] + e1[0], nz = e0[1] + e1[1]; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        const k = w / Math.max(0.5, nx * e1[0] + nz * e1[1]); return [p[0] + nx * k, p[1] + nz * k]; });
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.tri(pts[i], pts[j], off[j], y, u); this.tri(pts[i], off[j], off[i], y, u); }
    },
    fan(pts, y, u) { const n = pts.length; for (let i = 0; i < n; i++) this.tri([0, 0], pts[i], pts[(i + 1) % n], y, u); },
    done() { return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), uv: new Float32Array(uv), tris: pos.length / 9 }; },
  };
}
const ngon = (n, r, a0 = 0) => Array.from({ length: n }, (_, i) => [r * Math.cos(a0 + (i / n) * Math.PI * 2), r * Math.sin(a0 + (i / n) * Math.PI * 2)]);
const star = (r, k = 5) => Array.from({ length: k * 2 }, (_, i) => { const a = -Math.PI / 2 + (i / (k * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r; return [rr * Math.cos(a), rr * Math.sin(a)]; });
const crossPts = (r) => { const t = r * 0.36, p = [[t, -r], [t, -t], [r, -t], [r, t], [t, t], [t, r], [-t, r], [-t, t], [-r, t], [-r, -t], [-t, -t], [-t, -r]]; return p; };
/** A seat shape's outline at radius r. */
function shapePts(shape, r) {
  switch (shape) {
    case 'triangle': return ngon(3, r * 1.15, -Math.PI / 2); case 'square': return ngon(4, r * 1.2, Math.PI / 4); case 'diamond': return ngon(4, r * 1.25, 0);
    case 'hexagon': return ngon(6, r, 0); case 'star': return star(r * 1.1); case 'cross': return crossPts(r * 1.05); default: return ngon(20, r);
  }
}
/** A seat's marker: its shape filled in the seat colour over a keyline (a dark or pale halo where the cloth would swallow it); the ring a hollow band. */
function markerTpl(shape, r, cell, keyCell) {
  return memo(`marker:${shape}:${r}:${cell}:${keyCell}`, () => {
    const b = flat(), P = shapePts(shape, r);
    if (keyCell != null) b.fan(shapePts(shape, r * 1.28), 0, atlas().uv(keyCell));
    if (shape === 'ring') { b.band(ngon(20, r * 0.62), r * 0.38, 0.0008, atlas().uv(cell)); } else b.fan(P, 0.0008, atlas().uv(cell));
    return b.done();
  });
}
/** The turn ring: the seat's colour outside; inside, arcs of film-lit band (which turn, being their own template per slot). */
const turnOuterTpl = (cell) => memo(`turn:o:${cell}`, () => { const b = flat(), { r, outer } = MARKS.turn; b.band(ngon(64, r), outer, 0, atlas().uv(cell)); return b.done(); });
const turnArcsTpl = () => memo('turn:arcs', () => {
  const b = flat(), { r, inner, arcs } = MARKS.turn, u = atlas().uv(CELL.film);
  for (let k = 0; k < arcs; k++) { const a0 = (k / arcs) * Math.PI * 2, span = (Math.PI * 2 / arcs) * 0.62, pts = [], seg = 5;
    for (let s = 0; s <= seg; s++) { const a = a0 + (s / seg) * span; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
    for (let s = 0; s < seg; s++) { const p = pts[s], q = pts[s + 1], pi = [p[0] * (1 - inner / r), p[1] * (1 - inner / r)], qi = [q[0] * (1 - inner / r), q[1] * (1 - inner / r)]; b.tri(p, q, qi, 0.0012, u); b.tri(p, qi, pi, 0.0012, u); } }
  return b.done();
});
/** A rim round a footprint (a rounded rectangle w x d, or a circle of radius w/2), `n` bands wide, reaching `m` out. */
function rimTpl(w, d, round, m, width, cell, y = 0) {
  const q = (v) => Math.round(v * 1000);
  return memo(`rim:${q(w)}:${q(d)}:${round}:${q(m)}:${q(width)}:${cell}:${q(y)}`, () => {
    const b = flat(); let pts;
    if (round) pts = ngon(28, Math.max(w, d) / 2 + m);
    else pts = rectCorners(w / 2 + m, d / 2 + m, Math.min(0.012, Math.min(w, d) / 2 * 0.4));
    b.band(pts, width, y, atlas().uv(cell));
    return b.done();
  });
}
function rectCorners(x, z, c) { // (a rounded rectangle, counter-clockwise: four quarter arcs)
  const out = [];
  for (const [cx, cz, a0] of [[x - c, z - c, 0], [-(x - c), z - c, 0.5], [-(x - c), -(z - c), 1], [x - c, -(z - c), 1.5]]) for (let s = 0; s <= 3; s++) { const a = (a0 + (s / 3) * 0.5) * Math.PI; out.push([cx + c * Math.cos(a), cz + c * Math.sin(a)]); }
  return out;
}
/** A dark well in the felt: a dark band round the piece (so the sunk piece itself still reads, dimmed). */
function wellTpl(w, d, round, m) {
  const q = (v) => Math.round(v * 1000);
  return memo(`well:${q(w)}:${q(d)}:${round}:${q(m)}`, () => { const b = flat(), pts = round ? ngon(24, Math.max(w, d) / 2 + m) : rectCorners(w / 2 + m, d / 2 + m, Math.min(0.012, (Math.min(w, d) / 2 + m) * 0.4)); b.band(pts, 0.014, 0.0004, atlas().uv(CELL.well)); return b.done(); });
}

// ------------------------------------------------------------------ the marks
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _c = new THREE.Color();
const ease = (cur, to, k) => cur + (to - cur) * k;
const footprint = (info) => { const s = info.size; return typeof s === 'number' ? { w: s, d: s, round: !!info.round } : { w: s.w, d: s.d ?? s.w, round: !!info.round }; };

export class TableMarks {
  constructor(parent, opts = {}) {
    this.look = opts.seatLook || SEAT_MARK_LOOK; this.frame = opts.frame || null; this.clothY = opts.clothY ?? 0;
    const A = atlas(this.look), mk = (o) => new THREE.MeshStandardMaterial({ map: A.tex, ...o });
    // (the stock map material's parameters, as bazaarMaterials(): one program with the pieces)
    this.mats = { paper: mk({ name: 'marks-paper', roughness: 0.72, metalness: 0 }), glaze: mk({ name: 'marks-glaze', roughness: 0.22, metalness: 0.08 }),
      lit: mk({ name: 'marks-lit', roughness: 0.4, metalness: 0.05, emissive: 0x6a4a10, emissiveIntensity: 1 }) };
    this.batch = new PieceBatch(this.mats);
    const mesh = this.batch.mesh; mesh.name = 'bazaar-marks'; mesh.userData.zone = 'bazaar'; mesh.raycast = () => {}; mesh.renderOrder = 1; mesh.receiveShadow = false;
    parent.add(mesh); this.parent = parent; this.mesh = mesh;
    this.t = 0; this.state = { turnSeat: null, seats: [], legal: [], chosen: [], dim: [] }; this.pieceAt = () => null;
    this.k = new Map(); // id -> { legal, chosen, dim } eased 0..1
    this.turn = { seat: null, k: 0 };
    this.mats.lit.emissive.set(0x000000);
  }

  /** The state to show: the acting seat, the seats (colour name or hex, place on the cloth, the ids they own), the ids you may take, those picked, those out of play. */
  set(state, pieceAt) {
    this.state = { turnSeat: state.turnSeat ?? null, seats: state.seats || [], legal: state.legal || [], chosen: state.chosen || [], dim: state.dim || [] };
    if (pieceAt) this.pieceAt = pieceAt;
  }
  _cell(colour) { const n = typeof colour === 'number' ? NAMES.find((k) => this.look[k].hex === colour) : colour; const i = NAMES.indexOf(n); return i < 0 ? 0 : i; }
  _look(colour) { return this.look[NAMES[this._cell(colour)]]; }
  _e(id) { let e = this.k.get(id); if (!e) this.k.set(id, (e = { legal: 0, chosen: 0, dim: 0 })); return e; }
  /** How far a picked piece rises (metres; the table adds it to the piece's own lift). */
  lift(id) { return MARKS.lift * (this.k.get(id)?.chosen || 0); }
  /** How far a piece out of play sinks into the felt (metres, negative). */
  sink(id) { return MARKS.sink * (this.k.get(id)?.dim || 0); }
  /** How bright a piece out of play is (1 lit .. MARKS.shade): the table scales the piece's colour by it, where it can. */
  shade(id) { return 1 - (1 - MARKS.shade) * (this.k.get(id)?.dim || 0); }

  /** Every frame: ease each mark in or out, walk the film, and rebuild the batch (a few dozen small shapes). */
  update(dt) {
    this.t += dt; const S = this.state, k = 1 - Math.exp(-MARKS.ease * dt);
    if (this.frame) { this.frame.updateMatrixWorld?.(); this.mesh.matrixAutoUpdate = false; this.mesh.matrix.copy(this.frame.matrixWorld); this.mesh.matrixWorldNeedsUpdate = true; }
    const legal = new Set(S.legal), chosen = new Set(S.chosen), dim = new Set(S.dim), ids = new Set([...legal, ...chosen, ...dim, ...this.k.keys()]);
    for (const id of ids) { const e = this._e(id); e.legal = ease(e.legal, legal.has(id) && !chosen.has(id) ? 1 : 0, k); e.chosen = ease(e.chosen, chosen.has(id) ? 1 : 0, k); e.dim = ease(e.dim, dim.has(id) && !legal.has(id) && !chosen.has(id) ? 1 : 0, k);
      if (e.legal < 0.01 && e.chosen < 0.01 && e.dim < 0.01 && !legal.has(id) && !chosen.has(id) && !dim.has(id)) this.k.delete(id); }
    const B = this.batch, y0 = this.clothY + MARKS.y; B.clear();
    const add = (tpl, x, y, z, yaw, sc, slot, id) => { const m = new THREE.Matrix4(); m.compose(_p.set(x, y, z), _q.setFromAxisAngle(_y, yaw), _s.set(sc, 1, sc)); B.add(tpl, m, slot, id); };

    // the seats: their marker on the cloth, the turn ring round the acting one, a rim and a pip on what each owns
    const turn = S.seats.find((s) => s.seat === S.turnSeat); this.turn.k = ease(this.turn.k, turn ? 1 : 0, k);
    for (const s of S.seats) {
      const L = this._look(s.colour), cell = this._cell(s.colour), key = L.keyline != null ? (L.keyline === 0x1a1420 || L.keyline === 0x1a1a1a ? CELL.dark : CELL.gold) : null, at = s.at;
      if (at) add(markerTpl(L.shape, MARKS.marker, cell, key), at.x, y0, at.z, 0, 1, 1, `mk:seat:${s.seat}`);
      for (const id of s.owns || []) {
        const info = this.pieceAt(id); if (!info) continue; const f = footprint(info), yaw = info.yaw || 0;
        add(rimTpl(f.w, f.d, f.round, MARKS.rim, MARKS.band, cell), info.pos.x, y0 - 0.0006, info.pos.z, yaw, 1, 1, `mk:own:${id}`);
        const cx = f.round ? -f.w * 0.36 : -f.w / 2 + 0.012, cz = f.round ? f.d * 0.36 : f.d / 2 - 0.012, c = Math.cos(yaw), sn = Math.sin(yaw);
        add(markerTpl(L.shape, MARKS.pip, cell, key), info.pos.x + cx * c + cz * sn, y0 - 0.0006, info.pos.z - cx * sn + cz * c, 0, 1, 1, `mk:pip:${id}`);
      }
    }
    if (turn?.at && this.turn.k > 0.02) {
      const cell = this._cell(turn.colour), pulse = 1 + MARKS.turn.pulse * Math.sin(this.t * 3.2), sc = (0.6 + 0.4 * this.turn.k) * pulse;
      add(turnOuterTpl(cell), turn.at.x, y0, turn.at.z, 0, sc, 1, `mk:turn:${turn.seat}`);
      add(turnArcsTpl(), turn.at.x, y0, turn.at.z, -this.t * MARKS.turn.spin * Math.PI * 2, sc, 2, `mk:arcs:${turn.seat}`);
    }

    // the pieces: a legal rim (film), the chosen's white-gold double band, the dim's well
    for (const [id, e] of this.k) {
      const info = this.pieceAt(id); if (!info) continue; const f = footprint(info), yaw = info.yaw || 0, x = info.pos.x, z = info.pos.z;
      if (e.dim > 0.02) add(wellTpl(f.w, f.d, f.round, 0.006), x, y0 - 0.002, z, yaw, 1, 0, `mk:dim:${id}`);
      if (e.legal > 0.02) add(rimTpl(f.w, f.d, f.round, MARKS.rim * 2, MARKS.legal, CELL.film), x, y0, z, yaw, 1 + (1 - e.legal) * 0.12, 2, `mk:legal:${id}`);
      if (e.chosen > 0.02) {
        const sc = 1 + (1 - e.chosen) * 0.12;
        add(rimTpl(f.w, f.d, f.round, MARKS.rim * 2, MARKS.chosen, CELL.gold), x, y0 + 0.0004, z, yaw, sc, 2, `mk:chosen:${id}`);
        add(rimTpl(f.w, f.d, f.round, MARKS.rim * 2 + MARKS.chosen + 0.006, MARKS.legal, CELL.film), x, y0, z, yaw, sc, 2, `mk:halo:${id}`);
      }
    }
    B.write(); this.mesh.visible = B.list.length > 0;
    schillerInk(this.t * MARKS.glint, _c); this.mats.lit.emissive.copy(_c).multiplyScalar(0.75);
  }

  dispose() {
    this.parent?.remove(this.mesh); this.batch.geo.dispose(); for (const m of Object.values(this.mats)) m.dispose();
    this.k.clear(); this.batch.clear();
  }
}

export { NAMES as SEAT_MARK_COLOURS };
