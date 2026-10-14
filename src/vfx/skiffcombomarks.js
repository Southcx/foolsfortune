// ---------------------------------------------------------------------------------------
// THE TRICK COMBO'S MARKS (docs/plans/SKIFF-RACING.md section 9; Dovina's handoff, 2026-10-14, item 5): the Solar Skiff's trick combo
// (courier/skiff/combo.js) read off the board itself, in Lachryma's colour, with no words and no numbers. Three marks, one mesh:
//   - THE LINK RING: a ring of light round the hull, a little under the deck. While the chain is live (in the air, on a rail, in a
//     carve) it is whole; on the sand it closes in from the stern up both sides as the link's clock (`combo.t` of COMBO.link) runs out,
//     and is gone at the bow when the chain banks. A trick linked fills it again with a flash.
//   - THE STEP PIPS: a stack of six chevrons on the centreline aft of the stern, pointing to the bow, each bigger than the one before it;
//     lit from the stern back, one a step of the multiplier (`combo.mult`, a step of COMBO.kinds: x1.5, x2 ... x4), so a higher
//     multiplier is a longer, bigger stack (the owner asked what the old diamonds were: more must read as more at a glance, with no
//     numbers); the unlit ones a faint socket, so the ladder's top shows; a step taken flashes its chevron, and the whole gauge warms
//     from Lachryma's blue toward gold as the stack climbs.
//   - THE BANKED FLARES: three little suns further aft, past the stack (the owner, 2026-10-14: "everything on the front end gets occluded by the skiff
//     itself": the chase camera sees the back), filled left to right as seen from behind, each a pie by its share of `combo.stocks`
//     (0..3); Shift's flare drains them as it spends one. A bank flashes them; a drop dulls the ring a moment as it breaks (the effects' moments are the
//     library's: skiff.combo.bank / .drop, played by vfx/racewaylooks.js).
// One merged mesh, one draw call, on the plates' glow material's program (a mapped basic: the strength of each vertex is read off the
// glow atlas's gradient by its u, so no vertex colours and no new program). Blended over, not added: unlit, its deep Lachryma reads
// on noon sand as well as at night, where an added glow washed to white (measured headless); its geometry is built once and only its
// u is written each frame.
//
// Prior art: SSX Tricky's boost meter and Tony Hawk's combo multiplier (the chain and its step), Mario Kart's item roulette ring and
// Splatoon's ink tank worn on the body (a gauge on the thing, not the screen), Dead Space's diegetic spine meter, Crash Team Racing's
// reserve pips (banked boost counted, never numbered), a rank's stacked chevrons and Mario Kart's mini-turbo going blue to orange (the
// step pips: more stripes, bigger, warmer, is more), Sonic Riders' air tank; the sun's glyph (vfx/racewaylooks.js) for the stocks.
//
//   const M = new SkiffComboMarks({ map })   M.attach(group)   M.update(dt, combo, t)   M.link(mult)   M.bank()   M.drop()   M.dispose()
//   COMBO_MARKS (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COMBO } from '../courier/skiff/combo.js';
import { featTint } from './oxidation.js';
import { LACHRYMA_DEEP } from './racewayeffects.js';

/** The numbers, in the board's own frame (+Z the bow, Y up; m and rad): the marks' height under the deck; the link ring (radius, band
 *  width, segments); the step pips (how many; the first chevron's distance aft and the gap between them; the first's half width and
 *  how much each next one grows; its depth by its width; an arm's thickness and its growth a step); the warmth the gauge climbs to; the banked flares (radius out,
 *  rad apart round the stern, a sun's radius, its segments); where the pips and flares sit (rad from the bow: PI, the stern); brightness lit and as an empty socket; the flashes' real seconds; the
 *  drop's dull colour; how fast the whole fades in and out. */
export const COMBO_MARKS = {
  y: -0.3,
  ring: { r: 2.4, w: 0.28, segs: 56 },
  pips: { n: 6, r: 2.8, gap: 0.22, w: 0.28, grow: 1.16, depth: 0.5, thick: 0.1, thickGrow: 0.012 },
  stocks: { r: 5.0, apart: 0.3, size: 0.55, segs: 18 },
  warm: 0xe8901c, warmMax: 0.6,
  aft: Math.PI,
  lit: 0.95, socket: 0.14, flash: { link: 0.35, step: 0.5, bank: 0.7, drop: 0.55 },
  dull: 0x6a6478, fade: { in: 12, out: 3 },
};

// the glow atlas's gradient (vfx/racewaylooks.js glowAtlas: its left half, alpha by u), and its inverse: the u that gives a brightness
const GRAD = [[0, 0.95], [0.145, 0.5], [0.3145, 0.15], [0.484, 0]];
function uOf(b) {
  const a = Math.max(0, Math.min(1, b)) * 0.95;
  for (let i = 1; i < GRAD.length; i++) {
    const [u0, a0] = GRAD[i - 1], [u1, a1] = GRAD[i];
    if (a >= a1) return u0 + (u1 - u0) * ((a0 - a) / Math.max(1e-6, a0 - a1));
  }
  return GRAD[GRAD.length - 1][0];
}
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const _c = new THREE.Color(), _f = new THREE.Color(), LACH = new THREE.Color(LACHRYMA_DEEP), DULL = new THREE.Color(COMBO_MARKS.dull), WARM = new THREE.Color(COMBO_MARKS.warm);

/** The marks' geometry: triangles, each vertex with a cell (which mark and part it belongs to) and a weight (its share of the cell's
 *  brightness: a band's edges soft, its middle whole). Position, uv; the cells and weights kept on the side. */
function build() {
  const C = COMBO_MARKS, pos = [], cell = [], wt = [];
  const v = (x, z, c, w) => { pos.push(x, C.y, z); cell.push(c); wt.push(w); };
  const at = (a, r) => [Math.sin(a) * r, Math.cos(a) * r]; // (a from the bow, round to the left)
  // the link ring: segment j its own cell, a band in two strips (inner edge, middle, outer edge)
  const R = C.ring, r0 = R.r - R.w / 2, r1 = R.r + R.w / 2;
  for (let j = 0; j < R.segs; j++) {
    const a0 = (j / R.segs) * Math.PI * 2, a1 = ((j + 1) / R.segs) * Math.PI * 2, c = j;
    for (const [ra, rb, wa, wb] of [[r0, R.r, 0, 1], [R.r, r1, 1, 0]]) {
      const [p0x, p0z] = at(a0, ra), [p1x, p1z] = at(a1, ra), [q0x, q0z] = at(a0, rb), [q1x, q1z] = at(a1, rb);
      v(p0x, p0z, c, wa); v(p1x, p1z, c, wa); v(q1x, q1z, c, wb);
      v(p0x, p0z, c, wa); v(q1x, q1z, c, wb); v(q0x, q0z, c, wb);
    }
  }
  // the step pips: a stack of chevrons on the centreline aft of the stern, pointing to the bow, each bigger than the last (a bright
  // front edge, its back edge softer), cells after the ring's
  const P = C.pips, pip0 = R.segs;
  for (let i = 0; i < P.n; i++) {
    const w = P.w * Math.pow(P.grow, i), h = w * P.depth, th = P.thick + P.thickGrow * i, z = -(P.r + P.gap * i); // (z: aft is -Z)
    const A = [0, z + h / 2], Lf = [-w, z - h / 2], Rt = [w, z - h / 2], A2 = [0, z + h / 2 - th], L2 = [-w, z - h / 2 - th], R2 = [w, z - h / 2 - th];
    for (const [o, e, o2, e2] of [[A, Lf, A2, L2], [A, Rt, A2, R2]]) { // (each arm a quad: the front edge whole, the back edge soft, its tip softer)
      v(o[0], o[1], pip0 + i, 1); v(e[0], e[1], pip0 + i, 0.7); v(e2[0], e2[1], pip0 + i, 0.45);
      v(o[0], o[1], pip0 + i, 1); v(e2[0], e2[1], pip0 + i, 0.45); v(o2[0], o2[1], pip0 + i, 0.6);
    }
  }
  // the banked flares: little suns aft of the pips (the first on the left as the chase camera sees it), each a fan of wedges (a wedge its own cell, for the pie) and eight short rays
  const S = C.stocks, sun0 = pip0 + P.n;
  for (let i = 0; i < 3; i++) {
    const a = C.aft + (i - 1) * S.apart, [cx, cz] = at(a, S.r); // (i 0 at +X: the board's left, the left as seen from behind)
    for (let k = 0; k < S.segs; k++) {
      const b0 = (k / S.segs) * Math.PI * 2, b1 = ((k + 1) / S.segs) * Math.PI * 2, c = sun0 + i * (S.segs + 1) + k;
      v(cx, cz, c, 1); v(cx + Math.sin(b1) * S.size, cz + Math.cos(b1) * S.size, c, 0.85); v(cx + Math.sin(b0) * S.size, cz + Math.cos(b0) * S.size, c, 0.85);
    }
    const rc = sun0 + i * (S.segs + 1) + S.segs; // (the rays: one cell, lit when the sun is whole)
    for (let k = 0; k < 8; k++) {
      const b = (k / 8) * Math.PI * 2, w = 0.16, ra = S.size * 1.12, rb = S.size * (k % 2 ? 1.5 : 1.8);
      v(cx + Math.sin(b - w) * ra, cz + Math.cos(b - w) * ra, rc, 0.8); v(cx + Math.sin(b + w) * ra, cz + Math.cos(b + w) * ra, rc, 0.8); v(cx + Math.sin(b) * rb, cz + Math.cos(b) * rb, rc, 0);
    }
  }
  // (each triangle wound to face up: one side drawn, as the plates' glow is, so the program is theirs; upside down in a flip it is unseen)
  for (let i = 0; i < cell.length; i += 3) {
    const A = i * 3, Bq = A + 3, Cq = A + 6, ny = (pos[Bq + 2] - pos[A + 2]) * (pos[Cq] - pos[A]) - (pos[Bq] - pos[A]) * (pos[Cq + 2] - pos[A + 2]);
    if (ny < 0) { for (let k = 0; k < 3; k++) [pos[Bq + k], pos[Cq + k]] = [pos[Cq + k], pos[Bq + k]]; [cell[i + 1], cell[i + 2]] = [cell[i + 2], cell[i + 1]]; [wt[i + 1], wt[i + 2]] = [wt[i + 2], wt[i + 1]]; }
  }
  const n = cell.length, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2).fill(0.49), 2).setUsage(THREE.DynamicDrawUsage));
  return { g, cell: Int16Array.from(cell), wt: Float32Array.from(wt), cells: sun0 + 3 * (S.segs + 1), pip0, sun0 };
}

export class SkiffComboMarks {
  /** `map`: the plates' glow atlas (vfx/racewaylooks.js), so the material is the plates' glow's program. */
  constructor({ map }) {
    const B = (this.B = build());
    this.mat = new THREE.MeshBasicMaterial({ name: 'skiff-combo-marks', map, color: LACHRYMA_DEEP, transparent: true, depthWrite: false });
    this.mesh = new THREE.Mesh(B.g, this.mat);
    this.mesh.name = 'skiff-combo-marks'; this.mesh.frustumCulled = false; this.mesh.renderOrder = 4; this.mesh.visible = false;
    this.b = new Float32Array(B.cells);
    this.show = 0; this.linkT = 0; this.stepT = 0; this.stepPip = -1; this.bankT = 0; this.dropT = 0; this.steps = 0; this.lastRing = 0;
  }
  /** Worn by a board (its group: the marks ride it, in its frame). */
  attach(group) { if (this.mesh.parent !== group) { this.mesh.parent?.remove(this.mesh); group?.add(this.mesh); } }
  /** A trick linked (skiff.combo): the ring fills with a flash; a step of the multiplier lights its pip. */
  link(mult) {
    this.linkT = 1;
    const steps = Math.min(COMBO_MARKS.pips.n, Math.round((Math.max(1, mult ?? 1) - 1) / COMBO.kinds));
    if (steps > this.steps) { this.stepT = 1; this.stepPip = steps - 1; }
    this.steps = steps;
  }
  bank() { this.bankT = 1; this.dropT = 0; this.steps = 0; }
  drop() { this.dropT = 1; this.steps = 0; }

  /** Each frame: `combo` the skiff's live combo (n, t, mult, stocks) or null; `t` real seconds (the film's walk). */
  update(dt, combo, t) {
    const C = COMBO_MARKS, B = this.B, b = this.b;
    const n = combo?.n || 0, stocks = combo?.stocks || 0, live = n > 0;
    for (const k of ['linkT', 'stepT', 'bankT', 'dropT']) this[k] = Math.max(0, this[k] - dt / C.flash[k.slice(0, -1)]);
    const want = live || stocks > 0.01 || this.dropT > 0 || this.bankT > 0 ? 1 : 0;
    this.show = damp(this.show, want, want ? C.fade.in : C.fade.out, dt);
    this.mesh.visible = this.show > 0.01 && !!this.mesh.parent;
    if (!this.mesh.visible) return;
    if (live) this.steps = Math.min(C.pips.n, Math.round((Math.max(1, combo.mult ?? 1) - 1) / COMBO.kinds));
    // the link ring: lit where it is within the clock's share of the half-turn either side of the bow (a stern-first close)
    const f = live ? Math.max(0, Math.min(1, (combo.t ?? COMBO.link) / COMBO.link)) : 0, R = C.ring.segs;
    const ringK = live ? C.lit * (1 + 0.6 * this.linkT) : C.lit * 0.8 * this.dropT; // (dropped: what was lit dims out, dull)
    if (live) this.lastRing = f; else if (!this.dropT) this.lastRing = 0;
    const shown = live ? f : this.lastRing;
    for (let j = 0; j < R; j++) {
      const mid = ((j + 0.5) / R) * Math.PI * 2, off = Math.min(mid, Math.PI * 2 - mid) / Math.PI; // (0 at the bow, 1 at the stern)
      const fill = Math.max(0, Math.min(1, (shown - off) * R / 2 + 0.5));
      b[j] = live || this.dropT ? Math.max(live ? C.socket : 0, ringK * fill) : 0;
    }
    // the pips: the stack lit from the stern back, the newest flashing
    const P = C.pips;
    for (let i = 0; i < P.n; i++) { const on = i < this.steps; b[B.pip0 + i] = live ? (on ? C.lit * (1 + (i === this.stepPip ? 1.2 * this.stepT : 0)) : C.socket) : 0; }
    // the banked flares: each sun filled as a pie by its share, its rays out when whole; a bank flashes them
    const S = C.stocks, any = live || stocks > 0.01;
    for (let i = 0; i < 3; i++) {
      const share = Math.max(0, Math.min(1, stocks - i)), base = B.sun0 + i * (S.segs + 1), k = C.lit * (1 + 0.8 * this.bankT);
      for (let s = 0; s < S.segs; s++) b[base + s] = any ? (s + 0.5 < share * S.segs ? k : C.socket) : 0;
      b[base + S.segs] = share >= 0.999 ? k * (0.75 + 0.25 * Math.sin(t * 4 + i)) : 0;
    }
    // into the uv: each vertex its cell's brightness by its weight, the whole by how shown
    const uv = B.g.attributes.uv, a = uv.array, sh = this.show;
    for (let i = 0, m = B.cell.length; i < m; i++) a[i * 2] = uOf(b[B.cell[i]] * B.wt[i] * sh);
    uv.needsUpdate = true;
    // the colour: Lachryma's, the oil film walking through it slowly, warming toward gold as the stack climbs (one material: the whole
    // gauge warms, so the step pips' heat reads at a glance); a drop turns it dull a moment
    this.warmK = damp(this.warmK || 0, live ? this.steps / P.n : 0, 6, dt);
    this.mat.color.copy(LACH).lerp(featTint(t * 0.12, _f, { bright: 1 }), 0.15).lerp(WARM, this.warmK * C.warmMax).lerp(_c.copy(DULL), this.dropT * (live ? 0 : 0.85));
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.B.g.dispose(); this.mat.dispose(); }
}
