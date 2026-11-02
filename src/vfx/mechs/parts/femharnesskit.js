// ---------------------------------------------------------------------------------------
// THE DOLL'S HARNESS'S KIT (plain name; femharness.js and femharness2.js draw with it): the lines a harness lays on the doll's plates.
// Round lines (`gilt`, `trim`: a tube in the gold or the trim piece), laid on the pelvis's sculpt by rays from its axis (`onPelvis`,
// `both`), on a chest plate's rim (`plateRim`, `underwire`) or strapped from a plate to the chest (`strap`); and since 2026-11-02 the
// flat ones (South: "more experimentation with the varying of thickness of the gold lines, maybe more ribbon-like motifs"): a
// ribbon (`ribbon`: a flat strip of a width and a hair's thickness whose face turns with the surface's normal under it, tapered and
// twisted along its length, gilt on its two edges if asked), a bow (`bow`: two looped ribbons and two tails off a knot), a rope
// (`rope`: two strands wound round its line), and beads strung on a sagging thread (`beads`).
// Prior art: ribbon and bias-tape trims; the Rococo bow and the obi's knot; kinbaku's hemp rope and its knots; the showgirl's swag
// of beads (the Folies Bergere); Mucha's ribbons, which turn their two faces as they fall (the 1890s posters).
//
//   ribbon(piece, pts, nrm, { w, th, twist, c, gild })   bow(S, at, n, up, { size, c })   rope(S, pts, { r, c, twist })   beads(S, a, b, { sag, r, n })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, tube } from './kit.js';

export const PI = Math.PI;
export const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
/** A gold line along points (a fine tube in the gold piece). */
export const gilt = (S, pts, r = 0.024, n = 0) => { if (pts.length > 2) tube(S.g, pts, r, L.gold, n || pts.length * 3); };
/** A trim line along points (the trim piece's bead). */
export const trim = (S, pts, r = 0.018, c = L.trimM, n = 0) => { if (pts.length > 2) tube(S.trim, pts, r, c, n || pts.length * 3); };

/** Points on the pelvis's surface along a path [[phi, y], ...] (phi round the pelvis's axis from the front, + toward +X), each a ray
 *  from the axis at that height; a sample dropped where it falls into the hip ball's opening or jumps off its neighbours (a crease, a
 *  cleft), so a line never dives. `lift` pushes it a hair off the surface. */
export function onPelvis(P, path, lift = 0.006) {
  const raw = path.map(([phi, y]) => { const d = [Math.sin(phi), 0, Math.cos(phi)], q = P.surf(P.f, [0, y, 0], d); return q && !P.open(q) ? [q[0] + d[0] * lift, q[1], q[2] + d[2] * lift] : null; });
  const r = raw.map((q) => (q ? Math.hypot(q[0], q[2]) : null)), out = [];
  for (let i = 0; i < raw.length; i++) {
    if (!raw[i]) continue;
    const near = [r[i - 1], r[i + 1]].filter((v) => v != null), m = near.length ? near.reduce((a, b) => a + b, 0) / near.length : r[i];
    if (Math.abs(r[i] - m) < 0.18) out.push(P.at(raw[i]));
  }
  return out;
}
/** A path [[phi, y]] sampled along phi from a to b by y(phi). */
export const path = (a, b, y, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const p = a + ((b - a) * i) / n; return [p, y(p)]; });
export const mirror = (pts) => pts.map(([x, y, z]) => [-x, y, z]);
/** A line laid on both sides of the pelvis (the +X half's path, mirrored). */
export const both = (P, pth, draw) => { const q = onPelvis(P, pth); draw(q); draw(mirror(q)); return q; };

/** The high-cut leg line: from the crotch's front up over the crest (`top` at phi 1.45) and down under the cheek behind. */
export const legLine = (top = 0.42, front = -0.78, back = -1.02) => (phi) => phi < 1.45
  ? front + (top - front) * Math.sin((PI / 2) * smooth((phi - 0.1) / 1.35)) ** 1.3
  : back + (top - back) * Math.cos((PI / 2) * smooth((phi - 1.45) / 1.6)) ** 1.15;
/** A slung belt's line: low at the front, over the crest at the side, at the sacrum behind. */
export const beltLine = (front = -0.12, side = 0.34, back = 0.12) => (phi) => phi < 1.6 ? front + (side - front) * Math.sin((PI / 2) * (phi / 1.6)) ** 1.5 : back + (side - back) * Math.cos((PI / 2) * ((phi - 1.6) / (PI - 1.6)));

/** The plates' gold rims (the bezel's ring round the tank: B.rim), whole. */
export const plateRim = (S, B, r = 0.03) => gilt(S, Array.from({ length: 41 }, (_, i) => B.rim((i / 40) * PI * 2)), r, 64);
/** A line from a point on a plate's rim to a point in the chest's frame (the gorget's, a shoulder's), lifted over the chest on its way. */
export const strap = (S, B, from, to, r = 0.03, lift = 0.12, c = null) => {
  const C = B.local(to), pts = [0, 0.35, 0.7, 1].map((k) => { const m = new THREE.Vector3(...from).lerp(C, k); m.z += lift * Math.sin(PI * k); return m.toArray(); });
  if (c == null) gilt(S, pts, r, 16); else trim(S, pts, r, c, 16);
};
/** A plate's underwire from its outer top round its foot to its inner top (the halter's), its two ends returned. */
export function underwire(S, B, r = 0.035) {
  const s = B.s, out = s > 0 ? 0 : PI, inA = s > 0 ? PI : 0, a0 = out + (s > 0 ? 0.95 : -0.95), a1 = inA + (s > 0 ? -1.15 : 1.15);
  const sweep = (s > 0 ? -1 : 1) * (2 * PI - Math.abs(a1 - a0)), wire = [];
  for (let i = 0; i <= 24; i++) wire.push(B.rim(a0 + sweep * (i / 24)));
  gilt(S, wire, r, 40); return [wire[0], wire[wire.length - 1], (a) => B.rim(a0 + sweep * a)];
}
/** A small gold coin standing on a surface at q facing out along n (a flat disc). */
const _qa = new THREE.Quaternion(), _ea = new THREE.Euler(), _up = new THREE.Vector3(0, 1, 0), _nv = new THREE.Vector3();
export const coin = (S, q, n, r = 0.05) => { _qa.setFromUnitVectors(_up, _nv.set(...n).normalize()); _ea.setFromQuaternion(_qa); S.g.cyl(r, r, 0.014, { at: q, rot: [_ea.x, _ea.y, _ea.z], c: L.gold }, 10); };
/** The outward normal of the pelvis's surface at its point q (the ray's own direction, near enough for a coin). */
export const outOf = (q) => { const l = Math.hypot(q[0], q[2]) || 1; return [q[0] / l, -0.25, q[2] / l]; };
/** A spiral in (phi, y) round a centre, from radius r0 in to r1 over `turns`. */
export const spiral = (pc, yc, r0, r1, turns, a0 = 0, kphi = 1, n = 30) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = a0 + t * turns * PI * 2, r = r0 + (r1 - r0) * t; return [pc + Math.cos(a) * r * kphi, yc + Math.sin(a) * r]; });


// ------------------------------------------------------------------ the flat lines
const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3();
/** A field's outward normal at p (its gradient, central differences). */
export const gradN = (f, [x, y, z], e = 0.02) => { const g = [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)], l = Math.hypot(...g) || 1; return g.map((v) => v / l); };
/** A ribbon along points: a flat strip of width w(u) (a number or a function of u, 0..1 along it) and thickness th, its face turned
 *  to the normal nrm(p, u) (the surface's under it) and twisted about its line by twist(u) radians; `gild` lays a fine gold tube on
 *  each edge (a sash's gilt border). Smoothed through the points (a Catmull-Rom curve), n samples. In `P` (a piece: S.g, S.trim). */
export function ribbon(P, pts, nrm, { w = 0.06, th = 0.012, twist = null, c = L.gold, n = 0, gild = null, lift = 0.004 } = {}) {
  if (pts.length < 2) return;
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), N = n || Math.max(12, pts.length * 4);
  const W = typeof w === 'function' ? w : () => w, rings = [], edges = [[], []];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = curve.getPoint(u); curve.getTangent(u, _t);
    _n.set(...nrm(p.toArray(), u)); _n.addScaledVector(_t, -_n.dot(_t)).normalize(); // (the face's normal, square to the line)
    _b.crossVectors(_t, _n).normalize();
    const a = twist ? twist(u) : 0, ca = Math.cos(a), sa = Math.sin(a);
    const Wd = _b.clone().multiplyScalar(ca).addScaledVector(_n, sa), O = _n.clone().multiplyScalar(ca).addScaledVector(_b, -sa); // (the width's axis and the face, turned)
    const hw = Math.max(0.002, W(u)) / 2, ht = th / 2, c0 = p.clone().addScaledVector(_n, lift + ht);
    const at = (sw, so) => c0.clone().addScaledVector(Wd, sw * hw).addScaledVector(O, so * ht);
    rings.push({ C: [at(1, 1), at(-1, 1), at(-1, -1), at(1, -1)], N: [O, O.clone().negate(), Wd.clone().negate(), Wd] });
    if (gild) { edges[0].push(c0.clone().addScaledVector(Wd, hw).toArray()); edges[1].push(c0.clone().addScaledVector(Wd, -hw).toArray()); }
  }
  // the strip's four sides, each flat-shaded on its own (top 0-1, bottom 2-3, the -w edge 1-2, the +w edge 3-0): never a tube's round
  const pos = [], nor = [], push = (v, m) => { pos.push(v.x, v.y, v.z); nor.push(m.x, m.y, m.z); };
  for (let i = 0; i < N; i++) {
    const A = rings[i], B = rings[i + 1];
    [[0, 1, 0], [2, 3, 1], [1, 2, 2], [3, 0, 3]].forEach(([p, q, f]) => {
      push(A.C[p], A.N[f]); push(B.C[p], B.N[f]); push(A.C[q], A.N[f]);
      push(A.C[q], A.N[f]); push(B.C[p], B.N[f]); push(B.C[q], B.N[f]);
    });
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  P.geo(g, { c });
  if (gild) for (const e of edges) tube(gild.piece, e, gild.r ?? 0.012, gild.c ?? L.gold, N);
}
/** Taper shapes for a ribbon's width: full at a knot (u 0), fine at the end; full in the middle, fine at both ends. */
export const taper = (w0, w1 = w0 * 0.2, p = 1) => (u) => w0 + (w1 - w0) * u ** p;
export const swell = (w0, w1 = w0 * 0.2) => (u) => w1 + (w0 - w1) * Math.sin(PI * u);
/** A frame at a point on a surface: its normal n and an up u, the side s = u x n. */
const frame = (n, up) => { const N = new THREE.Vector3(...n).normalize(), U = new THREE.Vector3(...up); U.addScaledVector(N, -U.dot(N)).normalize(); return [N, U, new THREE.Vector3().crossVectors(U, N)]; };
/** A bow tied at `at` on a surface facing n: two looped ribbons out to the sides and two tapered tails falling below, a knot over
 *  them (a gold drop); `size` its loops' reach in m. In the piece given (gold, or trim with a colour). */
export function bow(S, at, n, up = [0, 1, 0], { size = 0.22, w = 0.07, c = L.gold, piece = S.g, tails = 1, knot = L.gold } = {}) {
  const [N, U, Sd] = frame(n, up), A = new THREE.Vector3(...at), pt = (x, y, z) => A.clone().addScaledVector(Sd, x).addScaledVector(U, y).addScaledVector(N, z).toArray();
  const face = () => N.toArray();
  for (const s of [1, -1]) {
    const loop = Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * PI * 2; return pt(s * size * 0.5 * (1 - Math.cos(a)), size * 0.32 * Math.sin(a), 0.03 + 0.05 * Math.sin(a / 2)); });
    ribbon(piece, loop, face, { w: (u) => w * (0.45 + 0.55 * Math.sin(PI * u)), th: 0.01, c, n: 36, twist: (u) => s * 0.35 * Math.sin(PI * 2 * u) });
    if (tails) ribbon(piece, [pt(0, 0, 0.02), pt(s * size * 0.18, -size * 0.45, 0.03), pt(s * size * 0.32, -size * 1.05 * tails, 0.015)], face, { w: taper(w * 0.9, w * 0.25), th: 0.01, c, n: 20, twist: (u) => s * 0.6 * u });
  }
  S.g.ball(w * 0.55, { at: pt(0, 0, 0.05), sc: [1.1, 1, 0.6], c: knot }, 12, 8);
}
/** A rope along points: two strands wound round its line (kinbaku's two-strand hemp), r the rope's radius. */
export function rope(S, pts, { r = 0.02, c = 0xa8402e, twist = 22, piece = S.trim } = {}) {
  if (pts.length < 2) return;
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), len = curve.getLength(), N = Math.max(24, Math.ceil(len * twist * 2.5));
  const ref = new THREE.Vector3(0, 0, 1);
  for (const ph of [0, PI]) {
    const s = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = curve.getPoint(u); curve.getTangent(u, _t); _b.crossVectors(_t, Math.abs(_t.z) > 0.9 ? _up2 : ref).normalize(); _n.crossVectors(_t, _b);
      const a = ph + u * len * twist; s.push(p.clone().addScaledVector(_b, Math.cos(a) * r * 0.55).addScaledVector(_n, Math.sin(a) * r * 0.55).toArray());
    }
    tube(piece, s, r * 0.55, c, N);
  }
}
const _up2 = new THREE.Vector3(0, 1, 0);
/** Beads strung from a to b on a thread sagging `sag` m under the line between them (a catenary near enough), n beads of radius r. */
export function beads(S, a, b, { sag = 0.12, r = 0.022, n = 9, c = L.gold, out = null } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), O = out ? new THREE.Vector3(...out).multiplyScalar(0.04) : new THREE.Vector3();
  for (let i = 0; i <= n; i++) { const u = i / n, p = A.clone().lerp(B, u); p.y -= sag * 4 * u * (1 - u); p.addScaledVector(O, 4 * u * (1 - u)); S.g.ball(r * (i % 2 ? 0.8 : 1), { at: p.toArray(), c }, 8, 6); }
}
