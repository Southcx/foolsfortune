// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S LEGS (the part library's legs for the forms with `fem`, kit.js FORMS; the parts body asks here in place of legs.js
// LEG_LOOKS): every leg type built anew in each feminine form, on the same joints as the hero's (hipL/R, kneeL/R, ankleL/R, toeL/R,
// the tetrapod's legs and the tank's pods) and the same rule: the hip at the part's own height, the feet on the ground, so the seat
// stands 3 m over the hip. The balls small and sunk into the limbs' ends (the joint shows as the interstitial in the gap), the limbs
// lathed in dense smooth profiles, sculpted (a calf's swell behind, a knee's cap), a panel line where Haydee has one.
// THE WEIGHT LOW (South, 2026-11-02: "accentuate the proportions by approximately 40%, we're looking to capture almost fertility idol
// vibes, which is all in the hips and thighs. pear shape over hourglass. It needs to read like the complement to the male mecha"):
// the pelvis about 40% broader than the first pass and widest low, at the thighs' roots; the thighs thick and tapering to the knee,
// the calves strong; the tetrapod's pelvis and the tank's hulls and gown broad and low. Mass and silhouette, stylised, never detail.
// Haydee's thighs set closer (South, 2026-11-02: the thigh gap "by about 12%", then "another 10%": hipX 1.5, 1.44, 1.30; the thighs'
// size kept, "perfect"), and her pelvis seats the waist column's lower ball in an ivory socket (femcores.js `spine`). The pelvis is a
// violin's lower bout (South, 2026-11-02: "a bit more of a bottom half of a violin-shape with high hipbones"): its widest round and
// full, its shoulder convex, then the C-bout's concave curve in to the waist column; the iliac crests (`CREST`) raised plates high on
// its sides just under the waist, flaring out over the curve, gilt on their lip. Every ball the skin's (kit.js `jointBall`).
// THE SCULPT (South, 2026-11-02: "the geometry doesn't feature pieces with novel multiple concave and convex surfaces"): the pelvis
// (PELVIS) and the feet (FOOT) are signed distance sculpts (parts/sdf.js) with the hip, waist and ankle sockets cut into them; the
// limbs stay lathed, the panel lines interstitial tubes laid on the sculpt's surface (`surfAt`), the crests' lips gilt: a mix.
// The helpers here (aoTone, surfAt, ringCut, halfSpace, bounded, sculptSide) are shared by femcores.js and femlimbs.js.
//   haydee (the `doll` form)
//     clayLegs    a sculpted pelvis (the bout, the crests, a leotard's panel line, the seat's two swells), thick thighs tapering to the
//                 knee, a strong calf's swell, armoured high-heeled feet: the arch, the foot on its toe, a real heel under the ankle
//     springLegs  the reverse joint as a high heel made whole: a thick thigh, a strong calf, the metatarsal a heel's pylon, a pointed shoe
//     crabLegs    four long dancer's legs off a broad, low pelvis, each tapering to a stiletto point with its spur
//     treadLegs   two pods under smooth rounded hulls, a panel band round each, the broad pelvis on its wide turret ring
// (Drossel's form is retired, 2026-11-02: her gowns are the hip pieces, parts/hips.js, worn over any of these; her en-pointe toes and
// spider legs gave way to the doll's own set, which already carries the heel and the stiletto points.)
// Prior art: the Venus of Willendorf (c. 25,000 BC) and of Hohle Fels (c. 38,000 BC), the Cucuteni-Trypillia goddess figurines and the
// Jomon dogu (the weight read as mass in the hips and thighs, the top narrow); Haydee (Haydee Interactive, 2016: the white android's
// high-heeled armoured feet and sparse panel lines); the violin's lower bout and C-bouts (Stradivari's outline: the luthier's mould);
// the iliac crest as the sculptor's high hipbone; Elemental Gearbolt's mechanical girls (Alfa System, 1997); the Spider Tank and the
// Tachikoma (the tetrapod's reach); the hero legs' rig and walks (legs.js).
//
//   FEM_LEGS[id](ctx) -> { pose({ gait, walk, kneel, travel }), drop(kneel) }   (ctx as legs.js's)
//   lathe(P, prof, len, c, fn?, seg?) (a limb lathed down -Y from [[r m, y in lengths]], sculpted by fn(x, y, z, u))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { MECH_LOOK as L, sidePlate, shell, cup, ball, jointBall, band, profAt, curved, panel, sculpt, aimOf, tube } from './kit.js';
import { sphere, ellipsoid, cone, blend, carve, meet, mirrorX, mesh } from './sdf.js';

const PI = Math.PI, SIDES = [[1, 'L'], [-1, 'R']];
const bump = (y, a, b) => (y <= a || y >= b ? 0 : Math.sin((PI * (y - a)) / (b - a)));
const clamp = (x) => Math.max(0, Math.min(1, x));
/** A limb lathed down -Y: profile [[r m, y in lengths]] at `len`, dense, sculpted by fn(x, y, z, u) (u 0 at the top, 1 at the foot). */
export function lathe(P, prof, len, c, fn = null, seg = 36) {
  const pts = band(prof.map(([r, y]) => [r, y * len]).reverse(), prof[prof.length - 1][1] * len, prof[0][1] * len, 1, 28);
  let g = shell(pts, seg); if (fn) g = sculpt(g, (x, y, z) => fn(x, y, z, -y / len));
  P.geo(g, { c });
}
/** A panel line round a limb (a ring of the interstitial sunk in its shell) at height y, radius r. */
/** A raised bead along points on a surface (a panel's line read as a fine trim-coloured bead, never a black tube). */
export const bead = (S, pts, r = 0.017, c = L.trimM, n = 0) => tube(S.trim, pts, r, c, n || pts.length * 3);
/** A socket's profile (r, y) round a ball of radius R at y 0, as a lathe: `under` (the limb below's: the cup opening up round the ball's
 *  foot) or `over` (the limb above's, mirrored), joining its limb at (rJ, yJ). From inside out: the concave cup the ball sits in, a low
 *  rolled lip `lip` of the radius off the equator on the cup's side (negative: past the equator), and a slow curved flare from the lip
 *  into the limb (a convex shoulder where the limb is the wider, a long taper where it is the narrower): a curved cup, never a flange. */
export function socketProf(R, rJ, yJ, under = true, lip = 0.3) {
  const y0 = -lip * R, ri = Math.sqrt(Math.max(0, R * R - y0 * y0)) + 0.04 * R, pts = [];
  for (const [r, y] of [[0.001, -1.03], [0.55, -0.9], [0.84, -0.66], [0.97, -0.42]]) if (y * R < y0 - 0.12 * R) pts.push([r * R * 1.03, y * R]);
  pts.push([ri, y0 - 0.07 * R], [ri + 0.04 * R, y0 + 0.01 * R], [ri + 0.1 * R, y0 - 0.0 * R], [ri + 0.14 * R, y0 - 0.07 * R]); // (the lip rolled over)
  const p0 = [ri + 0.16 * R, y0 - 0.18 * R], c = rJ >= p0[0] ? [rJ, p0[1] + (yJ - p0[1]) * 0.2] : [p0[0] * 0.98, p0[1] + (yJ - p0[1]) * 0.6];
  pts.push(p0); for (let i = 1; i <= 6; i++) { const t = i / 6, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * rJ, u * u * p0[1] + 2 * u * t * c[1] + t * t * yJ]); }
  return under ? pts : pts.map(([r, y]) => [r, -y]);
}
/** A limb lathed down -Y between two sockets (South, 2026-11-02: "sculpting just around the sockets"): its profile [[r m, y in lengths]]
 *  at `len`, `top` the ball over it at y 0 (its lip under that ball), `bot` the ball under it at -len (its cup over that one), each a
 *  socketProf flowing out of the limb; `fn(x, y, z, u)` the limb's sculpt; `grooves` (shares of len) incised shallow round it, each
 *  with a trim inlay in its floor (its rings dense only through a groove, so it reads and stays cheap). */
export function socketLimb(S, prof, len, { top = 0, bot = 0, fn = null, c = L.pale, grooves = [], seg = 30, lip = 0.3 } = {}) {
  const Pm = prof.map(([r, y]) => [r, y * len]).reverse(), y0 = top ? -top * 0.95 : prof[0][1] * len, y1 = bot ? -len + bot * 0.95 : prof[prof.length - 1][1] * len;
  const G = grooves.map((u) => -u * len), dip = (y) => G.reduce((d, g) => d + 0.028 * Math.max(0, Math.cos(Math.min(PI / 2, (Math.abs(y - g) / 0.05) * PI / 2))) ** 2, 0);
  const ys = new Set(); for (let i = 0; i <= 30; i++) ys.add(y1 + ((y0 - y1) * i) / 30); // (rings sparse along the limb, dense through each groove)
  for (const g of G) for (let i = -4; i <= 4; i++) ys.add(g + i * 0.0125);
  const pts = [...ys].filter((y) => y >= y1 && y <= y0).sort((a, b) => a - b).map((y) => [profAt(Pm, y) - dip(y), y]);
  const put = (q) => { let g = new THREE.LatheGeometry(q.map(([r, y]) => new THREE.Vector2(r, y)), seg); if (fn) g = sculpt(g, (x, y, z) => fn(x, y, z, -y / len)); S.p.geo(g, { c }); };
  put(pts); // (the limb, its sockets below sculpted as it is, so a flattened back runs on through the lip)
  if (top) put(socketProf(top, profAt(Pm, y0), y0, true, lip));
  if (bot) put(socketProf(bot, profAt(Pm, y1), -(y1 + len), false, lip).map(([r, y]) => [r, y - len]));
  for (const gy of G) { // (the inlay: a fine trim ring lying in the groove's floor)
    const r = profAt(Pm, gy) - 0.02; let t = new THREE.TorusGeometry(r, 0.014, 5, 48).rotateX(PI / 2).translate(0, gy, 0); if (fn) t = sculpt(t, (x, y, z) => fn(x, y, z, -y / len));
    S.trim.geo(t, { c: L.trimM });
  }
}
/** The interstitial's column inside a limb, from `from` m down to `len` m: kept out of the glass balls at its ends (it showed through them). */
const coreOf = (S, r, len, from = 0.05) => S.core.lathe([[r, -from], [r, -len]], { c: L.core }, 20);

// ------------------------------------------------------------------ the sculpt's helpers (shared by femcores.js and femlimbs.js)
const _tc = new THREE.Color(), _ta = new THREE.Color(), _tb = new THREE.Color();
/** A sculpt's tone: its porcelain shade baked by how open the surface is (a cheap ambient occlusion, the field sampled a small and a
 *  larger step out along the normal: a groove's floor and a crease go dark, a swell stays pale), `pick(x, y, z)` choosing the light
 *  tone by region where one is given. */
export function aoTone(f, lo = L.dark, hi = L.pale, pick = null) {
  _ta.set(lo);
  return (x, y, z, nx, ny, nz) => {
    const a = Math.min(1, Math.max(0, f(x + nx * 0.05, y + ny * 0.05, z + nz * 0.05) / 0.05)), b = Math.min(1, Math.max(0, f(x + nx * 0.2, y + ny * 0.2, z + nz * 0.2) / 0.2));
    _tb.set(pick ? pick(x, y, z) : hi); return _tc.copy(_ta).lerp(_tb, Math.min(1, 0.15 + 0.85 * (a * 0.55 + b * 0.45) ** 1.3));
  };
}
/** Where a field's outer surface is along a ray from a point (marched in from `max` m out, then bisected): the point, or null if the
 *  ray never meets the body within `max`. */
export function surfAt(f, [x, y, z], [dx, dy, dz], max = 3) {
  const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
  let b = max, a = max - 0.025; while (a > 0 && f(x + dx * a, y + dy * a, z + dz * a) >= 0) { b = a; a -= 0.025; }
  if (a <= 0) return null;
  for (let i = 0; i < 16; i++) { const m = (a + b) / 2; if (f(x + dx * m, y + dy * m, z + dz * m) < 0) a = m; else b = m; }
  return [x + dx * a, y + dy * a, z + dz * a];
}
/** A ring round an axis `dir` through c (radius R, tube r): a groove's cutter round a finger's joint or a limb. */
export function ringCut([cx, cy, cz], [dx, dy, dz], R, r) {
  const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
  return (x, y, z) => { const px = x - cx, py = y - cy, pz = z - cz, h = px * dx + py * dy + pz * dz, q = Math.hypot(px - h * dx, py - h * dy, pz - h * dz) - R; return Math.hypot(q, h) - r; };
}
/** A sub-field skipped where it cannot matter: far outside its bound (a field never above the sub-field's own, a sphere round it)
 *  by more than m (past every blend's or carve's reach) only the bound is read. The sculpts' speed (South's budget: a frame's first
 *  build under ~700 ms). */
export const bounded = (f, bound, m = 0.2) => (x, y, z) => { const b = bound(x, y, z); return b > m ? b : f(x, y, z); };
const FLIPS = new Map();
/** sculptPiece made cheap (its arrays appended straight into the piece) with an optional mirror (`flip`: the field's x negated read from the one mesh, its winding reversed), so a left and a
 *  right hand are meshed once between them. */
export function sculptSide(P, f, bounds, cell, o) {
  const g0 = mesh(f, bounds, cell, o); let g = g0;
  if (o.flip) {
    g = FLIPS.get(g0);
    if (!g) {
      g = g0.clone(); const pos = g.attributes.position.array, nor = g.attributes.normal.array, col = g.attributes.color.array;
      for (let i = 0; i < pos.length; i += 3) { pos[i] = -pos[i]; nor[i] = -nor[i]; }
      for (let t = 0; t < pos.length; t += 9) for (const A of [pos, nor, col]) for (let c = 0; c < 3; c++) { const a = A[t + 3 + c]; A[t + 3 + c] = A[t + 6 + c]; A[t + 6 + c] = a; }
      FLIPS.set(g0, g); if (FLIPS.size > 32) FLIPS.delete(FLIPS.keys().next().value);
    }
  }
  // appended straight into the piece (no clone, no matrix: a sculpt is meshed in its piece's own frame), pressed by `sc` if given
  const pos = g.attributes.position.array, nor = g.attributes.normal.array, col = g.attributes.color.array, n = pos.length, [sx, sy, sz] = o.sc || [1, 1, 1];
  const p0 = P.pos.length, t0 = P.tint.length, m0 = P.mot.length; P.pos.length += n; P.nor.length += n; P.col.length += n; P.tint.length += n / 3; P.glow.length += n / 3; P.mot.length += (n / 3) * 4;
  for (let i = 0; i < n; i += 3) {
    P.pos[p0 + i] = pos[i] * sx; P.pos[p0 + i + 1] = pos[i + 1] * sy; P.pos[p0 + i + 2] = pos[i + 2] * sz;
    let a = nor[i] / sx, b = nor[i + 1] / sy, c = nor[i + 2] / sz; const l = Math.hypot(a, b, c) || 1;
    P.nor[p0 + i] = a / l; P.nor[p0 + i + 1] = b / l; P.nor[p0 + i + 2] = c / l;
    P.col[p0 + i] = col[i]; P.col[p0 + i + 1] = col[i + 1]; P.col[p0 + i + 2] = col[i + 2];
  }
  P.tint.fill(0, t0); P.glow.fill(0, t0); P.mot.fill(0, m0);
  return g;
}
/** The solid side of a plane: n . p > o is outside (a sole's floor, a cut). */
export const halfSpace = ([nx, ny, nz], o) => { const l = Math.hypot(nx, ny, nz); return (x, y, z) => (nx * x + ny * y + nz * z) / l - o; };

// ------------------------------------------------------------------ the pelvises
/** The sculpted pelvis (South, 2026-11-02: "reshape the feminine mech's hip joint ... making the sockets for the thighs and waist
 *  sphere joints a part of the geometry ... that galatea-tier rump"): one body in the signed distance field, never a stack. The lower
 *  bout broad and low (`bout`), the C-bout's waist drawn up out of it by a wide fillet, a soft belly under the navel; the iliac crests
 *  ridges blended out of the sides (`crest`, gilt on their lips); behind, the two gluteal masses full and lifted (`glute`), the cleft
 *  between them, the lumbar's hollow over them and the two sacral dimples; under each, the thigh's own shape carved out a hand clear
 *  of it (`thigh`), which is the gluteal fold where the rump meets the thigh's back; at each hip a spherical socket cut into the body
 *  over the ball, its front and outer side ending in one rounded rim just over the ball's equator (`thigh.cut`), a crescent of the
 *  ball showing between it and the thigh's own lip; on top the
 *  dantian's socket, open at the front and back. The leotard's panel lines are fine trim beads laid
 *  on its surface. Sizes in m, the pelvis's frame. */
/** The waist column's lower ball, the dantian (South, 2026-11-02: "the dantian should double in size"): where it sits in the waist's
 *  frame and its radius; the pelvis's socket and the waist drum (femcores.js) seat it, the parts body registers it from femcores' spine. */
export const DANTIAN = { lo: 0.13, r: 0.76 };
/** The doll's figures (South, 2026-11-02: "Really make the female mecha a fertility goddess and pull out all the stops on 'appeal' ...
 *  an A, B and C option"): one set of proportions each, read from the form as `F.figure` (a, b or c). The silhouette rule for all
 *  three (South's back-view sketch): from the waist out and straight down into the thigh's outside in one curve, widest low at the
 *  thighs' upper third, then in to the knee; the pelvis no wider than the thighs' tops (`bout` x <= 1.3 + `thigh.r0`), so the thighs
 *  carry the hip's mass and no lobe of the pelvis hangs over them. Joint heights and the seat rule are the same in every figure.
 *    bout, waist, belly, glute   the pelvis's masses (ellipsoids: at, r)
 *    thigh { r0, max, at, p }    the thigh's radius at the hip, its widest, where (a share of its length) and the fall to the knee
 *                                (p under 1 full and round, over 1 a straight cone)
 *    calf { k, swell }           the shin's girth and the calf's swell behind
 *    bust { r, h, amp, y }       the chest plates (femcores.js TORSO.bust)
 *    waistK                      the torso's girth at the wasp waist (1 as drawn), eased out to 1 up the ribs
 *  Prior art: A the Venus of Willendorf and the Jomon dogu (mass low and heaviest); B the Callipygian Venus and Canova's Venus
 *  Italica (the classical ideal: a high round rump, long thighs, the narrowest waist); C the Cucuteni-Trypillia figures and the Venus
 *  of Hohle Fels stylised (an amphora's flare at the hips, tapering cone legs, the most graphic). */
export const FIGURES = {
  a: { id: 'a', label: 'the Venus',
    bout: { at: [0, -0.3, 0.02], r: [2.04, 0.84, 1.18] }, waist: { at: [0, 0.5, -0.05], r: [1.1, 0.58, 0.8] }, belly: { at: [0, -0.02, 0.58], r: [0.98, 0.54, 0.68] },
    glute: { at: [0.82, -0.5, -0.9], r: [1.0, 0.86, 0.8] }, thigh: { r0: 0.74, max: 1.26, at: 0.3, p: 0.75 }, calf: { k: 1.08, swell: 0.42 },
    bust: { r: 0.72, h: 0.72, amp: 0.32, y: 1.96 }, waistK: 1.06 },
  b: { id: 'b', label: 'the Galatea',
    bout: { at: [0, -0.26, 0.02], r: [1.92, 0.78, 1.04] }, waist: { at: [0, 0.5, -0.05], r: [0.94, 0.58, 0.72] }, belly: { at: [0, 0.04, 0.46], r: [0.72, 0.42, 0.5] },
    glute: { at: [0.74, -0.3, -0.94], r: [0.9, 0.8, 0.84] }, thigh: { r0: 0.62, max: 1.1, at: 0.42, p: 0.95 }, calf: { k: 0.92, swell: 0.3 },
    bust: { r: 0.54, h: 0.56, amp: 0.24, y: 2.1 }, waistK: 0.86 },
  c: { id: 'c', label: 'the goddess of the harvest',
    bout: { at: [0, -0.22, 0.02], r: [2.2, 0.72, 1.06] }, waist: { at: [0, 0.5, -0.05], r: [0.9, 0.56, 0.7] }, belly: { at: [0, 0.02, 0.5], r: [0.84, 0.46, 0.6] },
    glute: { at: [0.8, -0.4, -0.86], r: [0.92, 0.76, 0.72] }, thigh: { r0: 0.9, max: 1.2, at: 0.16, p: 1.4 }, calf: { k: 0.84, swell: 0.12 },
    bust: { r: 0.76, h: 0.78, amp: 0.34, y: 2.02 }, waistK: 0.86 },
};
export const figureOf = (F) => FIGURES[F?.figure] || FIGURES.a;
/** A figure's thigh as a lathe profile [[r m, y in lengths]]: from r0 at the hip swelling to its widest at `at`, then falling to the knee. */
function thighProf({ r0, max, at, p }) {
  const rk = 0.44, end = 1.04, pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = -0.01 + ((end + 0.01) * i) / 16, v = Math.max(0, u);
    const r = v <= at ? r0 + (max - r0) * Math.sin((PI / 2) * (v / at)) : rk + (max - rk) * Math.cos((PI / 2) * Math.min(1, (v - at) / (end - at))) ** p;
    pts.push([r, -u]);
  }
  return pts;
}
const PELVIS = {
  bout: { at: [0, -0.24, 0.02], r: [2.34, 0.82, 1.1] }, waist: { at: [0, 0.5, -0.05], r: [1.04, 0.58, 0.76] }, belly: { at: [0, 0.02, 0.5], r: [0.82, 0.48, 0.58] },
  glute: { at: [0.78, -0.42, -0.86], r: [0.92, 0.8, 0.72] }, crest: { y0: 0.18, y1: 0.44, a0: -1.0, a1: 0.6, r0: 0.08, r1: 0.11 },
  thigh: { gap: 0.05, back: 0.86, top: 0.25 }, hood: { lip: 0.22, reach: 0.95 },
  k: { body: 0.34, glute: 0.3, crest: 0.12, hood: 0.13, thigh: 0.2, socket: 0.07 }, cell: 0.07, far: 0.3, hooded: false,
};
/** The thigh's axis down from the hip at its rest rotation [x, 0, z] (Euler XYZ of -Y). */
const axisOf = (rx, rz) => [Math.sin(rz), -Math.cos(rz) * Math.cos(rx), -Math.cos(rz) * Math.sin(rx)];
/** The pelvis's field (its +X half: mirrored). o: { hip: [x, y, z], axis, R (the hip ball), thighR(t) (the thigh's radius t m down its
 *  axis), holes (the legs' sockets and openings: a biped's) }. */
function pelvisField(o) {
  const fig = o.fig || FIGURES.a, P = { ...PELVIS, bout: fig.bout, waist: fig.waist, belly: fig.belly, glute: fig.glute }, k = P.k;
  const glute = ellipsoid(P.glute.at, P.glute.r);
  let body = blend(k.body, ellipsoid(P.bout.at, P.bout.r), ellipsoid(P.waist.at, P.waist.r), ellipsoid(P.belly.at, P.belly.r));
  body = blend(k.glute, body, glute);
  // the iliac crest: a ridge run round the side on the bout's surface, its middle highest and proudest
  const C = P.crest, ridge = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, a = Math.PI / 2 + C.a0 + (C.a1 - C.a0) * u, y = C.y0 + (C.y1 - C.y0) * Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 0.8;
    const q = surfAt(body, [0, y, 0], [Math.sin(a), 0, Math.cos(a)]); if (q) ridge.push({ q, a, r: C.r0 + (C.r1 - C.r0) * Math.sin(Math.PI * u) });
  }
  const bars = []; for (let i = 1; i < ridge.length; i++) bars.push(cone(ridge[i - 1].q, ridge[i].q, ridge[i - 1].r, ridge[i].r));
  const crestBound = (x, y, z) => Math.max(Math.abs(y - (C.y0 + C.y1) / 2) - 0.32, Math.abs(Math.hypot(x, z) - 1.4) - 0.95); // (a ring round the crests' height)
  body = blend(k.crest, body, bounded(blend(0, ...bars), crestBound, P.far)); // (exact: past P.far the bars are past every blend's reach)
  // behind: the cleft between the cheeks
  const cleft = ellipsoid([0, -0.48, -1.5], [0.09, 0.62, 0.42]);
  body = carve(0.1, body, cleft); // (the sacral dimples dropped: under 2 of the mesh's cells they pitted the surface)
  // the dantian's socket (the waist column's lower ball, twice the others' size): a cup round its foot, open at the front and back
  // its top ended in a rounded rim a little over the ball's equator (never thin walls of the waist's mass torn by the carve), the
  // cup holding the ball's lower half, its upper half and heart seen whole
  const dy = L.waist + DANTIAN.lo;
  body = meet(0.16, body, (x, y, z) => y - (dy + 0.1));
  body = carve(0.1, body, sphere([0, dy, 0], DANTIAN.r + 0.04));
  if (o.holes) {
    const [hx, hy, hz] = o.hip, [ax, ay, az] = o.axis, T = P.thigh, Hd = P.hood, ss = (e0, e1, v) => { const u = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return u * u * (3 - 2 * u); };
    const socket = sphere(o.hip, o.R + 0.05);
    // the thigh's room: its own shape a hand clear of it (`gap`) up into the socket: inside (the crotch) and behind (the rump's gluteal
    // fold over the thigh's back) this is all
    const thigh = (x, y, z) => {
      const qx = x - hx, qy = y - hy, qz = z - hz, t = qx * ax + qy * ay + qz * az;
      const px = qx - t * ax, py = qy - t * ay; let pz = qz - t * az; if (pz < 0) pz /= T.back;
      const rc = t < 0 ? o.R + 0.06 : o.thighR(t) + T.gap;
      return Math.max(Math.hypot(px, py, pz) - rc, -(t + T.top)) * T.back;
    };
    // the hood (South, 2026-11-02: "the pelvis seating two hip balls"): round the ball's front and outer side the pelvis ends in a lip
    // that follows the ball, a latitude of it `lip` of the radius over its equator, rising off the ball toward the crotch and the rump
    // (where it opens into the thigh's room above); only within `reach` of the ball, so the bout's silhouette stands
    const hood = (x, y, z) => {
      const qx = x - hx, qy = y - hy, qz = z - hz, r = Math.hypot(qx, qy, qz) || 1e-6, t = qx * ax + qy * ay + qz * az;
      const hx2 = qx - t * ax, hz2 = qz - t * az, h = Math.hypot(hx2, hz2) || 1e-6;
      const w = Math.max(ss(-0.3, 0.45, hz2 / h), ss(-0.1, 0.6, hx2 / h)); // (1 front or outer, 0 inside or behind)
      const s0 = -Hd.lip + 1.6 * (1 - w); // (the lip's latitude: low round the front and outside, past the ball's top where w is 0)
      return Math.max(s0 * r - t, r - (o.R + Hd.reach));
    };
    body = carve(k.thigh, PELVIS.hooded ? carve(k.hood, body, hood) : body, thigh); void socket; // (the hood's cut left winged shelves, and the hip ball's own socket tore thin walls at the pelvis's upper corners: both off, the ball seated inside the thigh's room)
  }
  const env = blend(0, ...[P.bout, P.waist, P.glute, P.belly].map((e) => ellipsoid(e.at, e.r.map((r) => r + 0.12))), (x, y, z) => crestBound(x, y, z) + 0.05);
  return mirrorX(bounded(body, env, P.far)); // (exact: the body never stands past the envelope, so past P.far only its sign is read)
}
/** Haydee's pelvis sculpted (PELVIS): a biped's with its legs' sockets and openings, any other leg type's closed and pressed out to its
 *  width (sx against the biped's), the waistband in trim and the crests' gilt lips laid on its surface. */
function haydeePelvis(S, o = {}) {
  const holes = !!o.hip, sx = o.sx || 1, fig = o.fig || FIGURES.a;
  const key = (holes ? `fem.pelvis.${o.hip.map((v) => v.toFixed(2))}.${o.axis.map((v) => v.toFixed(3))}.${o.R.toFixed(2)}.${o.key || ''}` : 'fem.pelvis.closed') + `.${fig.id}`;
  const f = pelvisField({ ...o, holes });
  sculptSide(S.p, f, [[-2.6, -1.4, -1.86], [2.6, 1.14, 1.3]], PELVIS.cell, { key, tone: aoTone(f), sc: [sx, 1, 1] });
  const at = (q) => [q[0] * sx, q[1], q[2]]; // (the waistband dropped: the dantian's socket opens the pelvis's top front and back)
  // the leotard's panel lines, read as fine trim beads: the front panel's two edges, the seat's
  for (const phi of [0.6, 2.42]) for (const s of [1, -1]) {
    const line = []; let last = null;
    for (let y = 0.2; y > -1.1; y -= 0.08) {
      const q = surfAt(f, [0, y, 0], [Math.sin(phi), 0, Math.cos(phi)]); if (!q) break;
      const r = Math.hypot(q[0], q[2]); if (last != null && Math.abs(r - last) > 0.22) break; last = r;
      line.push(at([s * q[0] * 0.997, q[1], q[2] * 0.997]));
    }
    if (line.length > 3) bead(S, line, 0.018);
  }
  const C = PELVIS.crest;
  for (const s of [1, -1]) {
    const lip = [];
    for (let i = 1; i < 12; i++) {
      const u = i / 12, a = Math.PI / 2 + C.a0 + (C.a1 - C.a0) * u, y = C.y0 + (C.y1 - C.y0) * Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 0.8;
      const q = surfAt(f, [0, y + 0.06, 0], [Math.sin(a), 0.55, Math.cos(a)]); if (q) lip.push(at([s * q[0], q[1], q[2]]));
    }
    if (lip.length > 4) tube(S.g, lip, 0.026, L.gold, 24);
  }
}
// ------------------------------------------------------------------ the feet
/** Haydee's armoured high-heeled foot, sculpted (South, 2026-11-02: "15% smaller feet and large spherical ankle joints"): drawn at
 *  `FOOT.k` of its first size, the ankle's ball sitting in a seat cut into the foot's top (its rim under the ball's equator), the
 *  instep falling from it to a pointed toe on the ground, the arch's hollow under it, a stiletto heel under the seat; a strap's groove
 *  over the instep. In the ankle's frame (+Z the toe), its size unscaled (the field read at p / k). */
const FOOT = { k: 0.85, fh: 1.55, ball: 0.6, wide: 1.1, cell: 0.045 };
function footField(R) {
  const fh = FOOT.fh, W = FOOT.wide;
  // the foot 10% wider across than its first cut (South, 2026-11-02), the seat left slim, the instep lighter
  let rest = blend(0.12,
    cone([0, -0.46, 0.24], [0, -fh + 0.36, 0.98], 0.2, 0.13), // (the instep)
    ellipsoid([0, -fh + 0.13, 1.2], [0.18, 0.14, 0.44])); // (the toe)
  rest = blend(0.08, rest, cone([0, -0.52, -0.1], [0, -fh + 0.04, -0.2], 0.13, 0.05)); // (the stiletto)
  const narrow = (g) => (x, y, z) => g(x / ((1 - 0.4 * Math.min(1, Math.max(0, z / 1.7))) * W), y, z);
  let f = blend(0.16, ellipsoid([0, -0.25, 0.02], [0.6, 0.44, 0.6]), narrow(rest)); // (the seat round the ball, slim)
  f = meet(0.02, f, (x, y, z) => -fh - y); // (the sole on the ground)
  f = meet(0.08, f, (x, y, z) => y + 0.2); // (the seat's rim a flat annulus under the ball's equator: a thick lip, never a sliver)
  f = carve(0.1, f, ellipsoid([0, -fh - 0.22, 0.48], [0.5 * W, 0.42, 0.42]), sphere([0, 0, 0], R + 0.04)); // (the arch's hollow; the seat)
  return f;
}
function haydeeFoot(S, R) {
  const k = FOOT.k, f0 = footField(R / k), f = (x, y, z) => k * f0(x / k, y / k, z / k);
  const heel = (x, y, z) => (z < 0.02 && y < -0.5 ? L.mid : L.pale);
  for (const sx of [1, -1]) { // (a panel line down each side of the arch)
    const line = [[0, -0.5, 0.3], [0, -0.85, 0.62], [0, -1.15, 0.98]].map(([x, y, z]) => surfAt(f, [0, y * k, z * k], [sx, 0, 0])).filter(Boolean);
    if (line.length === 3) bead(S, line.map(([x, y, z]) => [x * 1.0, y, z]), 0.015, L.trimM, 12);
  }
  sculptSide(S.p, f, [[-0.62, -FOOT.fh * k, -0.6], [0.62, 0.02, 1.42]], FOOT.cell, { key: `fem.foot.${R.toFixed(3)}.${FOOT.wide}`, tone: aoTone(f, L.dark, L.pale, heel) });
}
// ------------------------------------------------------------------ the bipeds
/** Haydee's legs, each limb lathed between its two sockets (socketLimb): the thigh's top a lip under the hip's ball, its foot a cup
 *  over the knee's; the shin's top a lip under the knee's, its foot a cup over the ankle's; the thigh's back flattened under the rump
 *  (`flat`); a shallow groove with a trim inlay where a panel line reads. Balls: the hip's 0.88, the knee's 0.62, the ankle's 0.6
 *  (x the form's `joint`). */
const BIPED = { // (the thigh is the figure's, FIGURES `thigh`)
  haydee: { hipX: 1.3, A: [-0.14, 0.27, -0.13], toe: -0.1, FH: FOOT.fh * FOOT.k, hipBall: 0.88, kneeBall: 0.62, ankleBall: FOOT.ball,
    SH: [[0.42, 0.06], [0.52, -0.04], [0.6, -0.2], [0.63, -0.34], [0.53, -0.56], [0.4, -0.78], [0.36, -0.86]] },
};
/** The thigh's back pressed in under the rump near its top (the pelvis carves it the same, PELVIS.thigh.back). */
const flat = (x, y, z, u) => [x, y, z < 0 ? z * (1 - (1 - PELVIS.thigh.back) * bump(u, -0.05, 0.5)) : z];
/** The thigh's radius t m down its axis (for the pelvis's carve). */
const thighROf = (TH, T) => { const P = TH.map(([r, y]) => [r, y * T]).reverse(); return (t) => profAt(P, -t); };
function bipedLegs(ctx) {
  const { H, F, joint, put, ballAt } = ctx, B = BIPED[F.fem] || BIPED.haydee, { A, FH, hipX } = B, j = F.joint, fig = figureOf(F);
  const len = (H - 0.35 - FH - 0.1) / (Math.cos(A[0]) + Math.cos(A[0] + A[1])), T = len, Sh = len;
  const TH = thighProf(fig.thigh), SH = B.SH.map(([r, y]) => [r * fig.calf.k, y]); // (the figure's thigh and calf)
  const calf = (x, y, z, u) => [x, y, z * (z < 0 ? 1 + fig.calf.swell * bump(u, 0.04, 0.62) : 0.92)];
  const RH = B.hipBall * j, RK = B.kneeBall * j, RA = B.ankleBall * j;
  put(ctx.pelvis, (S) => haydeePelvis(S, { hip: [hipX, -0.35, 0], axis: axisOf(A[0], B.toe), R: RH, thighR: thighROf(TH, T), key: T.toFixed(2), fig }));
  const legs = {};
  for (const [s, k] of SIDES) {
    const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * B.toe]);
    const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
    const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, -s * B.toe]);
    put(hip, (S) => {
      jointBall(S, RH); coreOf(S, 0.3, T - RK * 1.1, RH * 1.05); socketLimb(S, TH, T, { bot: RK, fn: flat }); // (no top lip, no groove: the hip ball sits up in the pelvis, and rings stacked on the thigh read as tyres)
      bead(S, [[s * 1.18, -0.12 * T, -0.15], [s * 1.12, -0.38 * T, 0.05], [s * 0.86, -0.68 * T, 0.32]].map(([x, y, z]) => { const r = Math.hypot(x, z), R0 = profAt(TH.map(([a, b]) => [a, b * T]).reverse(), y) * 1.004; return [(x / r) * R0, y, (z / r) * R0]; }), 0.016);
    });
    put(knee, (S) => { jointBall(S, RK); coreOf(S, 0.18, Sh - RA * 1.1, RK * 1.05); socketLimb(S, SH, Sh, { top: RK, bot: RA, fn: calf, grooves: [0.52] }); });
    put(ankle, (S) => { jointBall(S, RA); haydeeFoot(S, RA); });
    ballAt(`hip${k}`, hip, RH); ballAt(`knee${k}`, knee, RK); ballAt(`ankle${k}`, ankle, RA);
    legs[k] = { hip, knee, ankle };
  }
  return {
    drop: (kn) => kn * H * 0.42,
    pose({ gait, walk, kneel }) {
      const sw = 0.36 * walk * Math.sin(PI * gait);
      for (const [s, k] of SIDES) {
        const { hip, knee, ankle } = legs[k], phase = s > 0 ? sw : -sw, lead = s > 0 ? 1 : 0;
        hip.rotation.x = A[0] - phase - kneel * (lead ? 1.1 : 0.3);
        knee.rotation.x = A[1] + Math.max(0, phase) * 0.9 + kneel * (lead ? 1.5 : 1.9);
        ankle.rotation.x = A[2] - Math.max(0, phase) * 0.3 - kneel * (lead ? 0.4 : 0.6);
      }
    },
  };
}

// ------------------------------------------------------------------ the reverse joint
function springLegs(ctx) {
  const { H, F: FF, joint, put, ballAt } = ctx, F = 0.36 * FOOT.k, A = [-0.65, 1.45, -1.05], T = 2.3, M = 1.9, hipX = 1.35, j = FF.joint;
  const Sh = (H - 0.35 - F - 0.09 - T * Math.cos(A[0]) - M * Math.cos(A[0] + A[1] + A[2])) / Math.cos(A[0] + A[1]);
  const { hipBall } = BIPED.haydee, fig = figureOf(FF), TH = thighProf(fig.thigh), SH = BIPED.haydee.SH.map(([r, y]) => [r * fig.calf.k, y]), RH = hipBall * j, RK = 0.5 * j, RN = 0.4 * j, RT = 0.44 * j;
  put(ctx.pelvis, (S) => haydeePelvis(S, { hip: [hipX, -0.35, 0], axis: axisOf(A[0], 0.02), R: RH, thighR: thighROf(TH, T), key: 'spring', fig }));
  const legs = {};
  for (const [s, k] of SIDES) {
    const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.02]);
    const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
    const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, 0]);
    const toe = joint(`toe${k}`, ankle, [0, -M, 0], [-(A[0] + A[1] + A[2]), 0, -s * 0.02]);
    put(hip, (S) => { jointBall(S, RH); coreOf(S, 0.3, T - RK * 1.1, RH * 1.05); socketLimb(S, TH, T, { top: RH, bot: RK, fn: flat, grooves: [0.4] }); });
    put(knee, (S) => {
      jointBall(S, RK); coreOf(S, 0.18, Sh - RN * 1.1, RK * 1.05);
      socketLimb(S, SH, Sh, { top: RK, bot: RN, fn: (x, y, z, u) => [x, y, z * (z > 0 ? 1 + 0.3 * bump(u, 0.04, 0.6) : 0.95)], grooves: [0.55] }); // (the calf's swell faces forward: the shin runs back)
      S.g.cyl(0.04, 0.04, Sh * 0.6, { at: [0, -Sh * 0.45, 0.2], c: L.gold }, 8); // (the piston, sunk in the calf)
    });
    put(ankle, (S) => {
      jointBall(S, RN); coreOf(S, 0.14, M - RT * 1.1, RN * 1.05);
      socketLimb(S, [[0.32, 0.06], [0.38, -0.08], [0.34, -0.45], [0.24, -0.85], [0.21, -1.02]], M, { top: RN, bot: RT, c: L.mid, grooves: [0.4] });
    });
    put(toe, (S) => {
      jointBall(S, RT); // (the toe's ball, large, in a seat lathed into the shoe's top: South, 2026-11-02)
      const q = FOOT.k, narrow = (x, y, z) => [x * (1 - 0.45 * clamp(z / (1.3 * q))), y, z], sc = (pts) => pts.map(([z, y]) => [z * q, y * q]);
      S.p.geo(sculpt(sidePlate(sc([[-0.34, -0.22], [0.26, -0.2], [0.8, -0.3], [1.28, -0.36 + 0.04], [1.36, -0.36], [-0.1, -0.36], [-0.36, -0.3]]), 0.44 * q * FOOT.wide, 0.08), narrow), { c: L.pale }); // (the pointed shoe)
      S.p.lathe([[0.001, -RT - 0.04], [RT * 0.7, -RT * 0.92], [RT * 1.08, -RT * 0.45], [RT * 1.12, -RT * 0.1], [RT * 1.04, -RT * 0.06]], { c: L.ivory }, 32); // (the seat)
      S.p.geo(sidePlate(sc([[-0.2, -0.05], [-0.62, -0.36 + 0.02], [-0.5, -0.36], [-0.06, -0.2]]), 0.16 * q, 0.04), { c: L.mid }); // (the spur, a heel's tip)
    });
    ballAt(`hip${k}`, hip, RH); ballAt(`knee${k}`, knee, RK); ballAt(`ankle${k}`, ankle, RN); ballAt(`toe${k}`, toe, RT);
    legs[k] = { hip, knee, ankle, toe };
  }
  return {
    drop: (kn) => kn * H * 0.35,
    pose({ gait, walk, kneel }) {
      const sw = 0.3 * walk * Math.sin(PI * gait);
      for (const [s, k] of SIDES) {
        const { hip, knee, ankle, toe } = legs[k], ph = s > 0 ? sw : -sw;
        hip.rotation.x = A[0] - ph - kneel * 0.5;
        knee.rotation.x = A[1] + Math.max(0, ph) * 0.6 + kneel * 0.6;
        ankle.rotation.x = A[2] - Math.max(0, ph) * 0.4 - kneel * 0.3;
        toe.rotation.x = -(hip.rotation.x + knee.rotation.x + ankle.rotation.x);
      }
    },
  };
}

// ------------------------------------------------------------------ the tetrapod
function crabLegs(ctx) {
  const { H, F, joint, put, ballAt } = ctx, j = F.joint;
  const hy = -0.3, up = [0.9, 1.7], out = 2.75, rr = 0.46;
  put(ctx.pelvis, (S) => {
    haydeePelvis(S, { sx: 1.95 / 1.72, fig: figureOf(F) });
    S.g.ring(1.1, 0.04, { at: [0, 0.5, 0], sc: [1.2, 1, 0.85], c: L.gold }, 36, 4);
  });
  const legs = [];
  for (const [s, k] of SIDES) {
    const side = joint(`hip${k}`, ctx.pelvis, [0, 0, 0]);
    for (const f of [1, -1]) {
      const at = [s * 1.7, hy, f * 1.0], yaw = Math.atan2(at[0], at[2]), nm = `${k}${f > 0 ? 'F' : 'B'}`;
      const root = joint(`leg${nm}`, side, at, [0, yaw, 0]);
      const Lu = Math.hypot(...up), a1 = aimOf(up[0], up[1]);
      const upper = joint(`upper${nm}`, root, [0, 0, 0], [a1, 0, 0]);
      const kneeY = H + hy + up[0], dz = out - up[1], Ll = Math.hypot(kneeY - 0.25, dz), a2 = aimOf(-(kneeY - 0.25), dz);
      const lower = joint(`lower${nm}`, upper, [0, -Lu, 0], [a2 - a1, 0, 0]);
      put(root, (S) => { S.p.geo(cup(0.4).rotateX(-PI / 2), { at: [0, 0, -0.08], c: L.ivory }); });
      put(upper, (S) => {
        jointBall(S, 0.42 * j); coreOf(S, 0.22, Lu - 0.38 * j * 1.1, 0.42 * j * 1.05);
        socketLimb(S, [[rr, 0.1], [rr * 1.35, -0.08], [rr * 1.3, -0.45], [rr * 1.05, -0.85], [rr * 0.95, -1.02]], Lu, { top: 0.42 * j, bot: 0.38 * j, grooves: [0.5] });
      });
      put(lower, (S) => {
        jointBall(S, 0.38 * j); coreOf(S, 0.15, Ll - 0.6, 0.38 * j * 1.05);
        const pr = [[rr * 0.9, 0.06], [rr * 1.2, -0.12], [rr * 1.15, -0.35], [rr * 0.75, -0.7], [rr * 0.4, -0.9], [0.08, -0.97], [0.001, -1.0]];
        socketLimb(S, pr, Ll, { top: 0.38 * j, fn: (x, y, z, u) => [x, y, z * (z < 0 ? 1 + 0.3 * bump(u, 0.05, 0.5) : 1)], grooves: [0.32] });
        S.p.geo(sidePlate([[-0.05, 0], [-0.45, -0.55], [-0.12, -0.5]], 0.12, 0.03), { at: [0, -Ll + 0.75, -0.1], c: L.mid }); // (the stiletto's spur)
      });
      ballAt(`hip${k}`, upper, 0.42 * j); ballAt(`knee${nm}`, lower, 0.38 * j);
      legs.push({ root, upper, lower, yaw, a1, a2, pair: (s > 0) === (f > 0) ? 0 : 1 });
    }
  }
  return {
    drop: (kn) => kn * 0.8,
    pose({ gait, walk, kneel }) {
      const ph = Math.sin(PI * gait);
      for (const Lg of legs) {
        const w = (Lg.pair ? ph : -ph) * walk;
        Lg.root.rotation.y = Lg.yaw + 0.2 * w;
        Lg.upper.rotation.x = Lg.a1 - 0.2 * Math.max(0, w) + kneel * 0.15;
        Lg.lower.rotation.x = Lg.a2 - Lg.a1 + 0.1 * Math.max(0, w) - kneel * 0.1;
      }
    },
  };
}

// ------------------------------------------------------------------ the tank
function treadLegs(ctx) {
  const { H, joint, put, ballAt, mats, owned } = ctx;
  const len = 5.4, R = 1.15, w = 1.3, podX = 2.45, podY = R + 0.05 - H, wy = -R * 0.46, wr = R * 0.42;
  put(ctx.pelvis, (S) => {
    haydeePelvis(S, { sx: 1.9 / 1.72, fig: figureOf(ctx.F) });
    S.g.ring(1.95, 0.06, { at: [0, -0.62, 0], c: L.gold }, 40, 5); // (the turret ring)
    S.p.lathe([[0.001, -1.05], [1.75, -0.95], [2.05, -0.72], [1.85, -0.5]], { c: L.mid }, 36);
  });
  const wheel = new Piece();
  wheel.cyl(wr, wr, 0.2, { rot: [0, 0, PI / 2], c: L.gold }, 20); wheel.cyl(wr * 0.4, wr * 0.4, 0.3, { rot: [0, 0, PI / 2], c: L.bronze }, 12);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; wheel.slab(0.24, 0.05, wr * 1.3, { at: [0.11, 0, 0], rot: [a, 0, 0], c: L.bronze }); }
  const wg = wheel.done(), pods = [], WZ = [-0.36, -0.18, 0, 0.18, 0.36].map((z) => z * len);
  for (const [s, k] of SIDES) {
    const pod = joint(`hip${k}`, ctx.pelvis, [s * podX, podY, 0]);
    const stad = [];
    for (let i = 0; i <= 12; i++) { const a = -PI / 2 + (i / 12) * PI; stad.push([len / 2 - R + Math.cos(a) * R, Math.sin(a) * R]); }
    for (let i = 0; i <= 12; i++) { const a = PI / 2 + (i / 12) * PI; stad.push([-len / 2 + R + Math.cos(a) * R, Math.sin(a) * R]); }
    put(pod, (S) => {
      S.core.geo(sidePlate(stad, w, 0.1), { c: L.coreD }); // (the tread)
      S.p.geo(sidePlate(stad.map(([z, y]) => [z * 0.95, y * 0.9]), w + 0.08, 0.04), { c: L.dark });
      // the hull: a smooth rounded shell over the top and sides, a panel band round it, a trim stripe
      const hull = new THREE.SphereGeometry(1, 40, 20, 0, PI * 2, 0, PI * 0.6);
      S.p.geo(hull, { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.pale });
      S.trim.geo(new THREE.SphereGeometry(1.012, 40, 2, 0, PI * 2, PI * 0.3, PI * 0.02), { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.trimM }); // (a fine trim bead, no black band)
      S.trim.geo(new THREE.SphereGeometry(1.01, 40, 2, 0, PI * 2, PI * 0.47, PI * 0.04), { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.trimM });
      jointBall(S, 0.36, [-s * 0.5, R * 1.1, 0]); S.core.cyl(0.3, 0.3, 0.8, { at: [-s * 0.6, R * 1.2, 0], rot: [0, 0, PI / 2], c: L.core }, 16);
    });
    const inst = new THREE.InstancedMesh(wg, mats.g, WZ.length); inst.castShadow = true; inst.name = `mech.wheels${k}`; pod.add(inst); owned.push(inst);
    ballAt(`hip${k}`, pod, 0.36, [-s * 0.5, R * 1.1, 0]);
    pods.push({ s, inst });
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), one = new THREE.Vector3(1, 1, 1), at = new THREE.Vector3();
  const spin = (a) => { for (const P of pods) { WZ.forEach((z, i) => { m.compose(at.set(P.s * (w / 2 + 0.1), wy, z), q.setFromAxisAngle(X, a), one); P.inst.setMatrixAt(i, m); }); P.inst.instanceMatrix.needsUpdate = true; } };
  spin(0);
  return { drop: () => 0, pose({ travel = 0 }) { spin(travel / wr); } };
}

export const FEM_LEGS = { clayLegs: bipedLegs, springLegs, crabLegs, treadLegs };
