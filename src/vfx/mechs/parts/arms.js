// ---------------------------------------------------------------------------------------
// A MECH'S ARMS (the part library: progress/mechs/parts.js slot `arms`): a pair, each side built in three joints' frames (vfx/mechs/
// parts/kit.js): the shoulder (its gold ball, the upper arm with the elbow's cup at its foot), the elbow (its ball and the forearm, the
// wrist's cup at its foot), the hand (its ball, the palm, four long fingers of two joints and the thumb, open, holding or clenched by
// the weapon in it; clenched, a knuckle guard of trim over the fingers' backs with a gold stud a knuckle). The limbs are lathed and
// tapered (a swell under the shoulder and at the forearm, narrowing to each joint) over the interstitial's column, their outer plates
// curved round them, so they read round at 480 lines. Each arms part also has its own pauldron (`pauldron`), worn when the frame's
// pauldron is `default` (vfx/mechs/parts/pauldrons.js, the body's setPauldron): in trim, the colour the Courier's trim glaze.
// On the hero the gauntlets (forearms and hands) are 12% larger (kit.js FORMS `gauntlet`; South, 2026-11-02), their lengths kept.
// THE REFIRE (South, 2026-11-02: "the geometry doesn't feature pieces with novel multiple concave and convex surfaces"; the hero's focal
// points the hands, chest, forearms and head): every hand is sculpted (parts/sdf.js): a palm with a real hollow under a thenar swell and
// a hypothenar, a crease ridge at its foot, the thumb's web blended into the index's root, tendon ridges and knuckles on its back, each
// finger's segments armoured plates with a concave flute down their backs, the thumb two tapered segments; its joints the Courier's skin
// under a clear shell (kit.js `jointBall`; the knuckles a small one, `knuckle`). The clay arms' forearm is a sculpted vambrace: a
// muscular belly under the elbow waisting to the wrist, the extensor and flexor masses blended in, two flutes down its front, panel lines
// as grooves, its outer plate a trim shell laid over the muscle. Hard plates (the pauldrons, the other forearms' bands) stay plates.
// A sculpt is built once on the frame's left (+X) and mirrored for the right (`sideSculpt`), so a pair meshes once.
//   clayArms    long arms whose big hands hang to the knee: a dome with two lames and two fins, a trim vambrace
//   strongArms  bulky: a layered pauldron of three stacked lames, gauntlets swelling to a bronze-ringed cuff, a huge fist
//   quickArms   slender and longest: a cap with one sleek swept fin, a narrow forearm, long fingers
// The feminine forms' arms are their own (femlimbs.js, by `armLookOf`), their hands this file's `hand` at their size.
// Prior art: Medabots' arm parts (each arm its own weapon and its own silhouette); Evangelion's long lean arms (Ikuto Yamashita);
// Giant Clank's fists; Gurren Lagann's and the Big O's gauntlets (the strong arms); the ball-jointed doll's hand; the gauntlet's
// knuckle plate (a Gothic gauntlet's gadlings, here gold studs).
//
//   ARM_LOOKS[id] = { upper, fore, palm (m), ball (the shoulder's), elbow, wrist (balls), shoulder(S, s), foreArm(S, s), hand(S, s, grip), pauldron(S, s) }
//   grip: 'open' | 'hold' | 'fist'   gripAt(look, F?) -> [x, y, z] in the hand's frame (the middle of a closed hand, where a haft sits)
//   armLookOf(id, F) (the look for a form)   hand(S, s, grip, { w, h, d, fl, fw, wr, c }) (a hand at any size)
//   sideSculpt(P, f, bounds, cell, { key, s, tone, at, rot }) (a sculpt in a Piece, mirrored when s < 0)   aoTone(f, light, dark)
//   onto(f, p) (a point pushed onto a field's surface)   knuckle(S, r, at) (a small skin ball under its clear shell)   boundsOf(pts, pad)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, plate, limb, seam, jointBall, band, curved, cup } from './kit.js';
import { mesh, blend, carve, meet, ellipsoid, capsule, cone, box, grooves, sphere } from './sdf.js';
import { femArmLook } from './femlimbs.js';

const PI = Math.PI;
const CURL = { open: [0.3, 0.75], hold: [1.25, 1.35], fist: [1.55, 1.7] };
const up = (prof) => [...prof].reverse(); // (a limb's profile runs down -Y: band() wants it up)
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const r3 = (v) => Math.round(v * 1000) / 1000;

// ------------------------------------------------------------------ the sculpt's helpers (the hero's four files share them)
const MIRRORED = new Map();
/** A meshed sculpt mirrored across x 0 (positions and normals, each triangle's winding turned back), cached by its key. */
function mirrorGeo(g, key) {
  if (key && MIRRORED.has(key)) return MIRRORED.get(key);
  const m = g.clone(), P = m.attributes.position.array, N = m.attributes.normal.array, K = m.attributes.color.array;
  for (let i = 0; i < P.length; i += 3) { P[i] = -P[i]; N[i] = -N[i]; }
  for (let t = 0; t < P.length; t += 9) for (const A of [P, N, K]) for (let c = 0; c < 3; c++) { const a = A[t + 3 + c]; A[t + 3 + c] = A[t + 6 + c]; A[t + 6 + c] = a; }
  m.computeBoundingSphere();
  if (key) { if (MIRRORED.size > 64) MIRRORED.delete(MIRRORED.keys().next().value); MIRRORED.set(key, m); }
  return m;
}
/** A field built on the frame's left (+X) meshed into P with its vertex tones, mirrored onto the right when s < 0 (one mesh a pair). */
export function sideSculpt(P, f, bounds, cell, { key, s = 1, tone = null, at, rot } = {}) {
  let g = mesh(f, bounds, cell, { key, tone });
  if (s < 0) g = mirrorGeo(g, key && `${key}|m`);
  const before = P.col.length; P.geo(g, { at, rot, c: 0xffffff });
  const K = g.attributes.color.array; for (let i = 0; i < K.length; i++) P.col[before + i] = K[i];
  return g;
}
/** A porcelain tone from the field itself: light on the open surface, toward `dark` where the surface folds in on itself (a hollow,
 *  a groove, the crease under a swell: the field read a step `e` out along the normal, an ambient occlusion baked in). */
export function aoTone(f, light, dark, e = 0.09) {
  const A = new THREE.Color(light), B = new THREE.Color(dark), c = new THREE.Color();
  return (x, y, z, nx, ny, nz) => { const k = clamp01(f(x + nx * e, y + ny * e, z + nz * e) / e); c.copy(B).lerp(A, k * k * (3 - 2 * k)); return [c.r, c.g, c.b]; };
}
/** A point pushed onto a field's surface along its gradient (a seam or a stud laid on a sculpt), `lift` m out. */
export function onto(f, [x, y, z], lift = 0) {
  const e = 0.01;
  for (let i = 0; i < 6; i++) {
    const d = f(x, y, z) - lift, gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e), l = Math.hypot(gx, gy, gz) || 1;
    x -= (gx / l) * d; y -= (gy / l) * d; z -= (gz / l) * d;
  }
  return [x, y, z];
}
/** The box round points, padded. */
export function boundsOf(pts, pad = 0) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], p[c] - pad); hi[c] = Math.max(hi[c], p[c] + pad); }
  return [lo, hi];
}
/** A small joint (a knuckle): the skin's ball under its clear shell, no band. */
export function knuckle(S, r, at) { S.core.ball(r * 0.9, { at, c: 0xffffff }, 10, 7); S.j.ball(r, { at, c: 0xffffff }, 12, 9); }

/** The form a forearm is built in: its limbs' girth times the gauntlets' scale (the hero's 1.12; the forearm's length kept, so the
 *  layout and the grip stand). */
const gauntlet = (F) => (F.gauntlet && F.gauntlet !== 1 ? { ...F, limb: F.limb * F.gauntlet } : F);
/** A plate curved round a limb on its outer side (phi s*PI/2), between heights y0 and y1, k out from the limb's own profile. */
const armPlate = (P, prof, y0, y1, half, s, c, F, k = 1.1, th = 0.09) => P.geo(curved(band(up(prof), y0, y1, k, 6), th, s * PI / 2 - half, s * PI / 2 + half, 12), { sc: [F.limb, 1, F.limb], c });

/** An armoured finger segment from A along unit D, L long: a rounded plate hw wide and hd deep (each a half), tapering by `taper`
 *  toward its end, its back (away from the palm's normal N) fluted by a concave channel down its length, its end capped round. */
function phalanx(A, D, N, L, hw, hd, taper = 0.15) {
  const nd = N[0] * D[0] + N[1] * D[1] + N[2] * D[2], N0 = [N[0] - nd * D[0], N[1] - nd * D[1], N[2] - nd * D[2]], nl = Math.hypot(...N0) || 1;
  N = N0.map((v) => v / nl);
  const X = [D[1] * N[2] - D[2] * N[1], D[2] * N[0] - D[0] * N[2], D[0] * N[1] - D[1] * N[0]], k = 0.025;
  return (x, y, z) => {
    const px = x - A[0], py = y - A[1], pz = z - A[2];
    const u = px * D[0] + py * D[1] + pz * D[2], w = px * N[0] + py * N[1] + pz * N[2], v = px * X[0] + py * X[1] + pz * X[2];
    const t = clamp01(u / L), hwT = hw * (1 - taper * t), hdT = hd * (1 - taper * 0.6 * t), rr = Math.min(hwT, hdT) * 0.32;
    const qx = Math.abs(v) - hwT + rr, qy = Math.abs(u - L / 2) - L / 2 + rr, qz = Math.abs(w + hdT * 0.08 * Math.sin(PI * t)) - hdT + rr;
    let d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - rr;
    const fl = Math.hypot(v, w + hdT * 1.5) - hdT * 0.8; // (the flute down its back)
    const h = clamp01(0.5 - (0.5 * (fl + d)) / k); d = d + (-fl - d) * h + k * h * (1 - h); // (a smooth subtraction)
    return d;
  };
}

const _m4 = new THREE.Matrix4(), _eu = new THREE.Euler(), _vx = new THREE.Vector3(), _vy = new THREE.Vector3(), _vz = new THREE.Vector3();
/** An armoured segment meshed once in its own frame (from the origin down -Y, its palm side +Z) and laid at A along D, palm side N,
 *  mirrored onto the right when s < 0 (the segment is symmetric across its own x, so a mirror is only where it lies). */
function placePhalanx(P, A, D, N, len, hw, hd, taper, s, cell, light, dark) {
  const f = phalanx([0, 0, 0], [0, -1, 0], [0, 0, 1], len, hw, hd, taper), key = `phalanx|${[len, hw, hd, taper, cell].map(r3).join(',')}|${light}`;
  const g = mesh(f, [[-hw, -len, -hd * 1.1], [hw, 0, hd * 1.1]], cell, { key, tone: aoTone(f, light, dark, 0.05) });
  _vy.set(-D[0] * s, -D[1], -D[2]).normalize(); _vz.set(N[0] * s, N[1], N[2]); _vz.addScaledVector(_vy, -_vz.dot(_vy)).normalize(); _vx.crossVectors(_vy, _vz);
  _eu.setFromRotationMatrix(_m4.makeBasis(_vx, _vy, _vz));
  const before = P.col.length; P.geo(g, { at: [A[0] * s, A[1], A[2]], rot: [_eu.x, _eu.y, _eu.z], c: 0xffffff });
  const K = g.attributes.color.array; for (let i = 0; i < K.length; i++) P.col[before + i] = K[i];
}

/** A hand, palm to +Z (the hand's joint turns it to face in): its ball, a sculpted palm (the hollow, the thenar's swell, the web, the
 *  knuckles and tendons on its back: one mesh for every grip, mirrored for the right), four fingers of two armoured segments and the
 *  thumb's two (each segment meshed once and laid along its curl); a fist's knuckle guard. */
export function hand(S, s, grip, { w, h, d, fl, fw, wr, c = L.pale }) {
  const { g } = S, F = S.F, curl = CURL[grip] || CURL.open, G = F.gauntlet || 1, k = F.hand * G;
  w *= k; d *= k; fw *= k; h *= G; fl = fl.map((x) => x * k); wr *= F.joint * G;
  jointBall(S, wr);
  const yb = -wr * 0.6, y0 = yb - h, xs = [-0.375, -0.125, 0.125, 0.375].map((q) => q * w), key = [w, h, d, fw, wr].map(r3).join(',') + `|${c}`;
  const cell = Math.max(0.04, fw * 0.18);
  // the thumb (on +X, the side built): its root, its knuckle, its tip, along the first pass's pose so a grip still closes on the haft
  const ta = grip === 'open' ? 0.6 : 1.1, rz = grip === 'open' ? 0.25 : 0.9, Lt = fl[0] * 1.15;
  const tu = new THREE.Vector3(0, -1, 0).applyEuler(new THREE.Euler(-ta, 0, rz)), tc = new THREE.Vector3(w * (grip === 'open' ? 0.56 : 0.3), yb - h * 0.62, d * 0.62);
  const T0 = [w * 0.46, yb - h * 0.32, d * 0.22], TJ = tc.clone().addScaledVector(tu, -Lt * 0.08).toArray();
  // the palm: a block narrowing to the wrist, swells blended in, the hollow carved out, a cuff line and a line round the back plate
  const block = box([0, yb - h / 2, 0], [w / 2, h / 2, d / 2], Math.min(w, h, d) * 0.3);
  const narrow = (x, y, z) => { const sx = 0.84 + 0.16 * clamp01((yb - y) / h); return block(x / sx, y, z) * sx; };
  const TR = [w * 0.56, yb - h * 0.42, d * 0.36];
  const swells = [
    ellipsoid([w * 0.27, yb - h * 0.42, d * 0.36], [w * 0.22, h * 0.34, d * 0.24]), // (the thenar)
    ellipsoid([-w * 0.36, yb - h * 0.56, d * 0.34], [w * 0.13, h * 0.36, d * 0.17]), // (the hypothenar)
    capsule([-w * 0.4, y0 + h * 0.1, d * 0.36], [w * 0.36, y0 + h * 0.1, d * 0.36], d * 0.13), // (the crease ridge at the fingers' roots)
    cone(T0, TR, fw * 0.6, fw * 0.5), // (the thumb's root, swelling out of the thenar)
    capsule(T0, [w * 0.3, y0 + fw * 0.35, d * 0.12], d * 0.1), // (the web to the index)
  ];
  const back = [ // (the back: a knuckle a finger and its tendon ridge)
    ...xs.map((x) => sphere([x, y0 + fw * 0.12, -d * 0.36], fw * 0.4)),
    ...xs.map((x) => capsule([x * 0.7, yb - h * 0.28, -d * 0.47], [x, y0 + fw * 0.3, -d * 0.45], fw * 0.15)),
  ];
  let palm = blend(0.1, narrow, ...swells);
  palm = blend(0.05, palm, ...back);
  palm = carve(0.08, palm, ellipsoid([-w * 0.06, yb - h * 0.58, d * 0.5 + d * 0.16], [w * 0.3, h * 0.28, d * 0.34])); // (the hollow)
  palm = grooves(palm, [[0, 1, 0, yb - h * 0.15], [0, 0.6, -0.8, (yb - h * 0.5) * 0.6 + d * 0.28]], 0.014, 0.03);
  const rootF = swells[3];
  const palmF = (x, y, z) => { const q = Math.min(narrow(x, y, z), rootF(x, y, z)); return q > 0.22 ? q : palm(x, y, z); }; // (far from it all: the cheap shapes only)
  sideSculpt(S.p, palmF, boundsOf([[-w / 2, yb, -d / 2], [w / 2, y0, d / 2], TR], fw * 0.6), Math.max(0.045, fw * 0.19), { key: `hand.palm|${key}`, s, tone: aoTone(palmF, c, L.dark, 0.07) });
  // the thumb's two segments: the root's to its knuckle, then the tip along the pose
  const tp = [TJ[0] - T0[0], TJ[1] - T0[1], TJ[2] - T0[2]], tl = Math.hypot(...tp), tN = [0, Math.sin(ta), Math.cos(ta)];
  placePhalanx(S.p, T0, tp.map((v) => v / tl), tN, tl, fw * 0.56, fw * 0.52, 0.12, s, cell, L.mid, L.dark);
  placePhalanx(S.p, tc.clone().addScaledVector(tu, -Lt * 0.08 + fw * 0.28).toArray(), tu.toArray(), tN, Lt * 0.58, fw * 0.5, fw * 0.48, 0.25, s, cell, L.mid, L.dark);
  // the fingers: two armoured segments each, the little finger the shortest
  const joints = [], LEN = [[0.82, 0.8], [0.97, 0.95], [1, 1], [0.94, 0.92]];
  xs.forEach((x, i) => {
    let at = new THREE.Vector3(x, y0, 0.04); joints.push([at.toArray(), fw * 0.5]);
    for (let n = 0; n < 2; n++) {
      const a = curl[n] * (n ? 1 : 0.95) + (n ? curl[0] : 0), D = [0, -Math.cos(a), Math.sin(a)], N = [0, Math.sin(a), Math.cos(a)], len = fl[n] * LEN[i][n];
      placePhalanx(S.p, at.clone().addScaledVector(new THREE.Vector3(...D), fw * 0.3).toArray(), D, N, len, fw * 0.5, fw * 0.55, n ? 0.28 : 0.1, s, cell, L.mid, L.dark);
      at = at.clone().addScaledVector(new THREE.Vector3(...D), len + fw * 0.55); if (n === 0) joints.push([at.toArray(), fw * 0.42]);
    }
  });
  for (const [p, r] of joints) knuckle(S, r, [p[0] * s, p[1], p[2]]);
  knuckle(S, fw * 0.5, [T0[0] * s, T0[1], T0[2]]); knuckle(S, fw * 0.42, [TJ[0] * s, TJ[1], TJ[2]]);
  if (grip === 'fist') { // (the knuckle guard over the proximal phalanges' backs, a gold stud a knuckle)
    const R = w * 0.75, th = fw * 0.34, ay = y0 - fw * 0.6 + R - th, z1 = fl[0] + fw * 0.5, half = Math.asin(Math.min(0.95, (w * 0.56) / R));
    S.trim.geo(curved([[R, -0.12], [R + fw * 0.12, z1 * 0.5], [R, z1]], th, -half, half, 10).rotateX(PI / 2), { at: [0, ay, 0.04], c: L.trimM });
    for (const x of xs) g.ball(fw * 0.24, { at: [x, ay - R - fw * 0.1, 0.04 + z1 * 0.55], c: L.gold }, 10, 8);
  }
}

/** The clay arms' forearm sculpted (the hero's focal point): a vambrace whose belly swells under the elbow and waists to the wrist, the
 *  extensor mass on its outside and the flexor on its inside blended in, two flutes down its front and one behind, its plate lines
 *  grooves; and its outer plate, a trim shell laid over the muscle. Built on the left (+X outside), mirrored for the right. */
function sculptForearm(S, s, A, F, G) {
  const lk = F.limb, R = [[0.36, -0.3], [0.6, -0.62], [0.72, -0.95], [0.68, -1.3], [0.58, -1.7], [0.5, -2.0], [0.5, -2.2], [0.56, -2.32], [0.48, -2.5]];
  const rad = (y) => { if (y >= R[0][1]) return R[0][0]; for (let i = 1; i < R.length; i++) if (y >= R[i][1]) { const t = (y - R[i - 1][1]) / (R[i][1] - R[i - 1][1]); const e = t * t * (3 - 2 * t); return R[i - 1][0] + (R[i][0] - R[i - 1][0]) * e; } return R[R.length - 1][0]; };
  const y0 = -0.32, y1 = -A.fore + 0.06;
  const barrel = (x, y, z) => {
    const r = rad(y) * lk, ex = 1.0, ez = 0.9, q = Math.hypot(x / ex, z / ez) - r;
    return Math.max(q * 0.92, y - y0, y1 - y);
  };
  const base = blend(0.18, barrel,
    ellipsoid([0.42 * lk, -1.0, -0.12], [0.32 * lk, 0.55, 0.36 * lk]), // (the extensor mass, outside)
    ellipsoid([-0.3 * lk, -1.05, 0.26 * lk], [0.3 * lk, 0.5, 0.32 * lk])); // (the flexor mass, inside front)
  let arm = (x, y, z) => base(x, y, z);
  const zf = (y) => rad(y) * lk * 0.9;
  arm = carve(0.05, arm,
    cone([0.2 * lk, -1.2, zf(-1.2) + 0.05], [0.16 * lk, -2.05, zf(-2.05) + 0.04], 0.09, 0.06), // (the flutes)
    cone([-0.22 * lk, -1.3, zf(-1.3) + 0.06], [-0.16 * lk, -2.05, zf(-2.05) + 0.04], 0.08, 0.06),
    cone([0.05 * lk, -1.25, -zf(-1.25) - 0.05], [0.04 * lk, -1.95, -zf(-1.95) - 0.04], 0.08, 0.05));
  arm = grooves(arm, [[0, 1, 0, -0.66], [0, 1, 0, -2.1], [0.35, 1, 0, -1.34]].map(([a, b, c, o]) => { const l = Math.hypot(a, b, c); return [a / l, b / l, c / l, o / l]; }), 0.016, 0.035);
  const bounds = [[-0.95 * lk, y1 - 0.02, -0.9 * lk], [0.95 * lk, y0 + 0.02, 0.9 * lk]], key = `forearm.clay|${r3(lk)}|${r3(A.fore)}`;
  const armF = (x, y, z) => { const b = barrel(x, y, z); return b > 0.45 ? b - 0.2 : arm(x, y, z); }; // (far off: the barrel alone)
  sideSculpt(S.p, armF, bounds, 0.08, { key, s, tone: aoTone(armF, L.pale, L.dark, 0.1) });
  // the outer plate: the skin between the muscle's surface and that surface lifted 0.1, kept to the outside between two heights
  const plateF = meet(0.04, (x, y, z) => Math.max(base(x, y, z) - 0.1, -base(x, y, z)), (x, y, z) => Math.max(0.34 * lk - x, y + 0.74, -1.8 - y));
  sideSculpt(S.trim, plateF, [[0.2 * lk, -1.88, -0.95 * lk], [1.06 * lk, -0.66, 0.95 * lk]], 0.065, { key: `${key}|plate`, s, tone: aoTone(plateF, L.trimL, L.trimD, 0.06) });
  if (F.grooves) seam(S.g, [[0.6, -0.85, 0.3], [0.72, -1.12, 0.05], [0.72, -1.38, 0.2], [0.66, -1.66, -0.1]].map((p) => onto(base, [p[0] * lk, p[1], p[2] * lk], 0.11)).map(([x, y, z]) => [x * s, y, z]), 0.028);
  p_cup(S, A, F, G);
}
const p_cup = (S, A, F, G) => {
  S.p.geo(cup(A.wrist * F.joint * G), { at: [0, -A.fore, 0], c: L.ivory });
  const r = 0.34 * F.limb; S.core.lathe([[r, -0.3], [r, -A.fore]], { c: L.core }, 18);
};

export const ARM_LOOKS = {
  clayArms: {
    upper: 2.75, fore: 2.6, palm: 0.95, ball: 0.62, elbow: 0.5, wrist: 0.4,
    UP: [[0.42, -0.4], [0.62, -0.66], [0.68, -1.2], [0.6, -1.3], [0.6, -1.42], [0.66, -1.48], [0.6, -2.2], [0.48, -2.6]],
    FO: [[0.38, -0.4], [0.52, -0.62], [0.66, -1.25], [0.7, -1.85], [0.62, -1.95], [0.62, -2.05], [0.64, -2.1], [0.46, -2.5]],
    pauldron(S, s) {
      const { g, trim } = S;
      trim.geo(shell([[1.32, -0.15], [1.38, 0.28], [1.2, 0.76], [0.76, 1.06], [0.001, 1.16]], 32), { at: [s * 0.3, 0.12, 0], sc: [1, 0.82, 1.12], c: L.trimL }); // (the dome)
      const t0 = (s > 0 ? PI / 2 : -PI / 2) - 1.6;
      for (let i = 0; i < 2; i++) trim.geo(curved([[1.38 + i * 0.06, -0.19], [1.46 + i * 0.07, 0.19]], 0.08, t0, t0 + 3.2, 10), { at: [s * 0.3, -0.36 - i * 0.44, 0], sc: [1, 1, 1.1], c: i ? L.trimD : L.trimM }); // (the lames)
      g.ring(1.33, 0.045, { at: [s * 0.3, -0.13, 0], sc: [1, 1, 1.12], c: L.gold }, 36, 4); // (the dome's gilt rim)
      for (const [z, hh] of [[0.3, 1.35], [-0.26, 1.0]]) trim.geo(plate([[0, 0], [0.4, 0], [0.18, hh], [0.04, hh * 0.92]], 0.1, 0.03), { at: [s * 0.85, 0.8, z], rot: [0, 0, -s * 0.4], c: L.trimM });
    },
    shoulder(S, s) {
      const { p } = S, F = S.F;
      jointBall(S, this.ball * F.joint);
      limb(p, this.UP, L.pale, this.upper, this.elbow * F.joint, [F.limb, 1, F.limb], S.core);
      if (F.grooves) armPlate(p, this.UP, -2.15, -0.75, 0.75, s, L.mid, F);
    },
    foreArm(S, s) {
      const F = gauntlet(S.F), G = F.gauntlet || 1;
      jointBall(S, this.elbow * F.joint);
      sculptForearm(S, s, this, F, G); // (the sculpted vambrace and its outer plate)
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.35, h: this.palm, d: 0.64, fl: [0.8, 0.62], fw: 0.3, wr: this.wrist }); },
  },
  strongArms: {
    upper: 2.45, fore: 2.45, palm: 1.15, ball: 0.68, elbow: 0.58, wrist: 0.5,
    UP: [[0.5, -0.4], [0.76, -0.66], [0.8, -1.2], [0.7, -1.28], [0.7, -1.4], [0.78, -1.46], [0.7, -2.05], [0.56, -2.45]],
    FO: [[0.46, -0.45], [0.66, -0.66], [0.9, -1.3], [1.02, -1.85], [0.98, -2.0], [0.62, -2.08], [0.55, -2.45]],
    pauldron(S, s) {
      const { g, trim } = S;
      trim.geo(shell([[1.25, -0.1], [1.3, 0.3], [1.1, 0.8], [0.6, 1.08], [0.001, 1.14]], 32), { at: [s * 0.3, 0.15, 0], sc: [1, 0.86, 1.1], c: L.trimL }); // (the cap)
      for (let i = 0; i < 3; i++) trim.geo(curved([[1.3 + i * 0.1, -0.21], [1.42 + i * 0.12, 0.21]], 0.09, 0, PI * 2, 6), { at: [s * (0.32 + i * 0.05), -0.25 - i * 0.42, 0], sc: [1, 1, 1.08], c: [L.trimM, L.trimD, L.trimM][i] }); // (three stacked lames)
      for (let i = 0; i < 3; i++) g.ring(1.33 + i * 0.1, 0.035, { at: [s * (0.32 + i * 0.05), -0.04 - i * 0.42, 0], sc: [1, 1, 1.08], c: i === 1 ? L.gold : L.bronze }, 36, 4);
    },
    shoulder(S, s) {
      const { p } = S, F = S.F;
      jointBall(S, this.ball * F.joint);
      limb(p, this.UP, L.pale, this.upper, this.elbow * F.joint, [F.limb, 1, F.limb], S.core);
      if (F.grooves) armPlate(p, this.UP, -1.95, -0.7, 0.85, s, L.mid, F);
    },
    foreArm(S, s) {
      const F = gauntlet(S.F), G = F.gauntlet || 1;
      jointBall(S, this.elbow * F.joint);
      limb(S.p, this.FO, L.mid, this.fore, this.wrist * F.joint * G, [F.limb, 1, F.limb], S.core);
      S.trim.geo(curved([[1.04, -1.72], [1.1, -1.5], [1.04, -1.18]], 0.1, 0, PI * 2, 6), { sc: [F.limb, 1, F.limb], c: L.trimM }); // (the gauntlet's band)
      S.g.ring(1.05, 0.06, { at: [0, -1.96, 0], sc: [F.limb, 1, F.limb], c: L.bronze }, 36, 5); // (the cuff)
      if (F.grooves) seam(S.g, [[s * 0.9 * G, -1.85, 0.3 * G], [s * 1.0 * G, -1.55, 0.12 * G], [s * 1.02 * G, -1.3, 0.3 * G]], 0.03);
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.65, h: this.palm, d: 0.82, fl: [0.82, 0.64], fw: 0.4, wr: this.wrist, c: L.mid }); },
  },
  quickArms: {
    upper: 2.95, fore: 2.85, palm: 0.85, ball: 0.5, elbow: 0.4, wrist: 0.32,
    UP: [[0.34, -0.3], [0.48, -0.55], [0.5, -1.3], [0.44, -1.38], [0.44, -1.5], [0.48, -1.56], [0.42, -2.5], [0.36, -2.95]],
    FO: [[0.3, -0.32], [0.4, -0.55], [0.5, -1.3], [0.46, -2.2], [0.34, -2.85]],
    pauldron(S, s) {
      const { g, trim } = S;
      trim.geo(shell([[0.9, -0.2], [0.96, 0.2], [0.78, 0.6], [0.001, 0.8]], 32), { at: [s * 0.22, 0.05, 0], sc: [1, 0.8, 1.15], c: L.trimL }); // (the cap)
      trim.geo(plate([[0, 0], [0.5, -0.1], [1.9, 1.2], [1.6, 1.32], [0.1, 0.62]], 0.1, 0.03), { at: [s * 0.55, 0.3, 0.4], rot: [0, s * PI / 2 + s * 0.15, -s * 0.25], c: L.trimM }); // (the swept fin)
      g.ring(0.92, 0.035, { at: [s * 0.22, -0.18, 0], sc: [1, 1, 1.15], c: L.gold }, 36, 4);
    },
    shoulder(S, s) {
      const { p } = S, F = S.F;
      jointBall(S, this.ball * F.joint);
      limb(p, this.UP, L.pale, this.upper, this.elbow * F.joint, [F.limb, 1, F.limb], S.core);
    },
    foreArm(S, s) {
      const F = gauntlet(S.F), G = F.gauntlet || 1;
      jointBall(S, this.elbow * F.joint);
      limb(S.p, this.FO, L.pale, this.fore, this.wrist * F.joint * G, [F.limb, 1, F.limb], S.core);
      armPlate(S.trim, this.FO, -2.3, -0.6, 0.35, s, L.trimM, F, 1.1, 0.07); // (a narrow vane down its outside)
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.1, h: this.palm, d: 0.5, fl: [0.9, 0.74], fw: 0.24, wr: this.wrist }); },
  },
};

/** Where a haft sits in a closed hand, in the hand's frame (palm to +Z, before its twist), at the form's gauntlet scale. */
export const gripAt = (A, F = null) => { const G = F?.gauntlet || 1, j = F?.joint ?? 1; return [0, -A.wrist * j * 0.6 * G - A.palm * G - 0.25 * G, (0.42 + A.palm * 0.12) * G]; };
/** An arms part's look in a form: the feminine forms' are their own. */
export const armLookOf = (id, F) => (F?.fem ? femArmLook(id, F) : ARM_LOOKS[id] || ARM_LOOKS.clayArms);
