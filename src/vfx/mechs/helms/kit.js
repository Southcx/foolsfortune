// ---------------------------------------------------------------------------------------
// A MECH'S HELM'S KIT (plain name): the palette and the shapes every mech's helm is built from (the helms, vfx/mechs/helms.js and
// vfx/mechs/helms/historical.js), in head units: the bowl's radius R, its rim at y 0, the face +Z, +X the helm's left. Every bowl an
// icosahedron's dome (South, 2026-11-02: "icosahedron derived"), every horn a thick five-sided beam ending in a cut point, every lame
// flat; `orn` grows an ornament about its own root on the bowl (South, 2026-11-02: "increase the size of the ornamentation by about
// 30%"), so the head stays a head's size and nothing leaves the shell.
// Prior art: de Casteljau's curve (bez); the parts kit's plates (vfx/mechs/parts/kit.js `plate`); the Piece batches of the garden's
// decor (vfx/garden/decorpieces/kit.js).
//
//   HELM_LOOK (L)  R  bez  taper  rod  along  add  gem  facet  icoDome  bowl  shikoro  flat  fukigaeshi  teeth  orn(B, root, fn)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { plate } from '../parts/kit.js';

/** The colours: the shells' neutrals (bone, ivory, a warm grey, a dark lacquer), the trim's relative tones (the glaze is the colour),
 *  the terracotta the trim takes while the body has no trim program, the core's dark (and the neutral it is authored in where the core program carries its own colour), the gold; the plumes' earth tones. */
export const HELM_LOOK = {
  bone: 0xe6dccb, ivory: 0xd2c3a6, grey: 0x9a938a, dark: 0x3e3834, cord: 0x6a4a3a,
  trim: 0xffffff, trimD: 0xa8a8a8, trimDD: 0x6a6a6a, terracotta: 0xa45a3a, core: 0x1c1411, coreTone: 0x6a6662, gold: 0xd9ab4c,
  plume: { ivory: 0xece2cf, ochre: 0xc89a52, rust: 0xa45c3c, slate: 0x6c7076, umber: 0x5a4030 },
  fit: 0.58, narrow: 0.86, float: 0.42, bob: [0.06, 1.6], detail: 1, facets: 5, chunk: 1.4, orn: 1.3, // (a head's size; floated over the collar; the bob's height in the head's frame and its rate)
  gravity: 9.8, damping: 0.94, stiff: [0.32, 0.05],
};
export const L = HELM_LOOK, PI = Math.PI, V = THREE.Vector3;


export const R = 1.55;
const _Y = new V(0, 1, 0), _q = new THREE.Quaternion(), _eu = new THREE.Euler();
/** Points along a Bezier curve through control points (de Casteljau), n + 1 of them. */
export function bez(ctrl, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; let P = ctrl.map((c) => new V(...c)); while (P.length > 1) P = P.slice(1).map((b, j) => P[j].clone().lerp(b, t)); out.push(P[0].toArray()); }
  return out;
}
/** A tube tapering from r0 to r1 along points (a horn, a beam, a tusk), balls at its knees and a rounded tip. */
export function taper(P, pts, r0, r1, o = {}, seg = HELM_LOOK.facets) {
  const n = pts.length - 1; r0 *= HELM_LOOK.chunk; r1 *= HELM_LOOK.chunk; // (battle-ready: thick, few sides)
  for (let i = 0; i < n; i++) {
    const a = new V(...pts[i]), b = new V(...pts[i + 1]), d = b.clone().sub(a), len = d.length(); if (len < 1e-4) continue;
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
    _q.setFromUnitVectors(_Y, d.normalize()); _eu.setFromQuaternion(_q, 'XYZ');
    P.geo(new THREE.CylinderGeometry(rb, ra, len * 1.02, seg, 1), { ...o, at: a.clone().add(b).multiplyScalar(0.5).toArray(), rot: [_eu.x, _eu.y, _eu.z] });
    if (i > 0) P.geo(gem(ra), { ...o, at: pts[i] });
  }
  P.geo(new THREE.ConeGeometry(r1 * 1.15, r1 * 3, seg, 1).translate(0, r1 * 1.5, 0), { ...o, at: pts[n], rot: (() => { const d = new V(...pts[n]).sub(new V(...pts[n - 1])).normalize(); _q.setFromUnitVectors(_Y, d); _eu.setFromQuaternion(_q, 'XYZ'); return [_eu.x, _eu.y, _eu.z]; })() }); // (a cut point, not a bead)
}
/** A point a share t along a polyline. */
export const along = (pts, t) => { const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i; return new V(...pts[i]).lerp(new V(...pts[i + 1]), k).toArray(); };
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A faceted knuckle (a knee of a horn, a boss): an icosahedron, flat-shaded. */
export const gem = (r) => { const g = new THREE.IcosahedronGeometry(r, 0); g.computeVertexNormals(); return g; };
/** The helm's shell from an icosahedron (South, 2026-11-02: "a little too round, please make them icosahedron derived"): its upper
 *  half (the faces whose middles stand over the rim), stretched to radius r and height h, flat-shaded so every facet is a plate. */
export function icoDome(r, h, detail = HELM_LOOK.detail) {
  const g = new THREE.IcosahedronGeometry(1, detail), P = g.attributes.position.array, keep = [];
  for (let i = 0; i < P.length; i += 9) if ((P[i + 1] + P[i + 4] + P[i + 7]) / 3 > -0.12) for (let k = 0; k < 9; k += 3) keep.push(P[i + k] * r, Math.max(P[i + k + 1], -0.12) * h, P[i + k + 2] * r);
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); out.computeVertexNormals(); g.dispose();
  return out;
}
/** A bowl, radius r, height h, its rim at y 0: the icosahedron's dome; `ribs` lays every other facet in `ribC` (a suji-bachi's
 *  plates, here the facets themselves); `sc` stretches it. */
export function bowl(p, r, h, c, { ribs = 0, ribC = L.grey, sc = [1, 1, 1] } = {}) {
  const d = icoDome(r, h);
  if (!ribs) { p.geo(d, { c, sc }); return; }
  const P = d.attributes.position.array, A = [], B2 = []; // (every other facet in the second tone: the plates of a suji-bachi read as facets)
  for (let i = 0; i < P.length; i += 9) (((i / 9) % 2) ? B2 : A).push(...P.slice(i, i + 9));
  for (const [arr, col] of [[A, c], [B2, ribC]]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); p.geo(g, { c: col, sc }); }
  d.dispose();
}
/** The shikoro: `n` lames hanging from the rim, each wider and lower, open at the face (from -gap to gap round +Z). */
export function shikoro(p, r, n, drop, flare, cs, cord, gap = 1.05) {
  for (let i = 0; i < n; i++) {
    const Rr = r * (1.0 + i * flare), y = -i * drop, len = PI * 2 - gap * 2;
    p.geo(new THREE.CylinderGeometry(Rr, Rr + flare * r * 0.9, drop * 1.06, 10, 1, true, gap, len), { at: [0, y - drop / 2, 0], c: cs[i % cs.length] });
    p.geo(new THREE.TorusGeometry(Rr + flare * r * 0.9, 0.06, 4, 10, len).rotateX(PI / 2).rotateY(-(PI / 2 + gap)), { at: [0, y - drop, 0], c: cord });
  }
}
/** A flat outline (x, y) extruded thin and placed: a wing, an ear, a fukigaeshi. Mirrored for the right side by s. */
export function flat(P, pts, s, o, depth = 0.08) {
  const q = s < 0 ? pts.map(([x, y]) => [-x, y]).reverse() : pts;
  P.geo(plate(q, depth, 0.025), o);
}
/** The fukigaeshi: the top lames turned back at the temples, a wing each side, gold-rimmed. */
export function fukigaeshi(p, g, r, size = 1, c = L.dark) {
  for (const s of [-1, 1]) {
    const pts = [[0, 0.1], [0.7 * size, 0.35 * size], [0.85 * size, -0.25 * size], [0.1, -0.5 * size]];
    flat(p, pts, s, { at: [s * r * 0.9, 0.0, r * 0.38], rot: [0, s * 0.95, 0], c });
    g.rod([s * r * 0.9, 0.1, r * 0.38], [s * (r * 0.9 + 0.7 * size * Math.cos(0.95)), 0.35 * size, r * 0.38 - 0.7 * size * Math.sin(0.95)], 0.04, {}, 5);
  }
}
/** Teeth along a jaw's U: cones pointing up (dir 1) or down (-1). */
export function teeth(P, Rr, cz, y, arc, n, len, dir, o, sc = [1, 1], r = 0.075) {
  for (let i = 0; i < n; i++) {
    const a = PI / 2 - arc / 2 + (arc * (i + 0.5)) / n, big = Math.abs(i - (n - 1) / 2) > (n - 1) * 0.3 ? 1.35 : 1;
    P.cone(r * big, len * big, { ...o, at: [Math.cos(a) * Rr * sc[0], y + dir * len * big * 0.5, cz + Math.sin(a) * Rr * sc[1]], rot: [dir > 0 ? 0 : PI, 0, 0] }, 6);
  }
}

/** A bar from a to b, radius r (oriented in the order Piece.geo composes its rotation, XYZ, so it meets both ends). */
export function rod(P, a, b, r, o = {}, seg = 5) {
  const A = new V(...a), Bv = new V(...b), d = Bv.clone().sub(A), len = d.length(); if (len < 1e-5) return;
  _q.setFromUnitVectors(_Y, d.normalize()); _eu.setFromQuaternion(_q, 'XYZ');
  P.geo(new THREE.CylinderGeometry(r, r, len, seg, 1), { ...o, at: A.add(Bv).multiplyScalar(0.5).toArray(), rot: [_eu.x, _eu.y, _eu.z] });
}
/** A geometry flat-shaded: every face its own normal (a facet a plate). */
export const facet = (g) => { const q = g.index ? g.toNonIndexed() : g; q.computeVertexNormals(); return q; };
/** An ornament: what `fn` adds to the helm's pieces (and its plumes) grown by HELM_LOOK.orn about `root`, its seat on the bowl, so it
 *  stays seated where it was and only reaches further. */
export function orn(B, root, fn, k = L.orn) {
  const P = [B.p, B.t, B.g, B.lab, B.c, B.e], n0 = P.map((x) => x.pos.length), m0 = B.plumes.length;
  fn();
  P.forEach((x, j) => { const A = x.pos; for (let i = n0[j]; i < A.length; i += 3) for (let a = 0; a < 3; a++) A[i + a] = root[a] + (A[i + a] - root[a]) * k; });
  for (let i = m0; i < B.plumes.length; i++) { const s = B.plumes[i]; s.at = s.at.map((v, a) => root[a] + (v - root[a]) * k); s.len *= k; s.w *= k; }
}
