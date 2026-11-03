// ---------------------------------------------------------------------------------------
// A MECH'S HELM'S KIT (plain name): the palette and the shapes every mech's helm is built from (the helms, vfx/mechs/helms.js and
// vfx/mechs/helms/historical.js), in head units: the bowl's radius R, its rim at y 0, the face +Z, +X the helm's left. Every bowl an
// icosahedron's dome (South, 2026-11-02: "icosahedron derived"), every horn a thick five-sided beam ending in a cut point, every lame
// flat; `orn` grows an ornament about its own root on the bowl (South, 2026-11-02: "increase the size of the ornamentation by about
// 30%"), so the head stays a head's size and nothing leaves the shell.
// Prior art: de Casteljau's curve (bez); the parts kit's plates (vfx/mechs/parts/kit.js `plate`); the Piece batches of the garden's
// decor (vfx/garden/decorpieces/kit.js).
//
//   HELM_LOOK (L)  R  bez  taper  rod  along  add  gem  facet  icoDome  bowl  shikoro  flat  fukigaeshi  teeth  orn(B, root, fn)  stage  edge
//   the magitech (South, 2026-11-02: "that sci-fantasy magitech flare"): onBowl  trace  circuits  crystal  halo  plaque(B, n, at, rot)
//   (gold inlay run over the bowl as a bus and its pins, Lachrymite crystals, a ring floating apart from the bowl, the Arcana's number in
//   neuralese numerals on a stone plaque; numeralOf, npc/neuralesespelling.js: a bar five, two dots joined two, a dot one, a ring zero)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { plate } from '../parts/kit.js';
import { numeralOf } from '../../../npc/neuralesespelling.js';

/** The colours: the shells' neutrals (bone, ivory, a warm grey, a dark lacquer), the trim's relative tones (the glaze is the colour),
 *  the terracotta the trim takes while the body has no trim program, the core's dark (and the neutral it is authored in where the core program carries its own colour), the gold; the plumes' earth tones. */
export const HELM_LOOK = {
  bone: 0xe6dccb, ivory: 0xd2c3a6, grey: 0x9a938a, dark: 0x3e3834, cord: 0x6a4a3a,
  trim: 0xffffff, trimD: 0xa8a8a8, trimDD: 0x6a6a6a, terracotta: 0xa45a3a, core: 0x1c1411, coreTone: 0x6a6662, gold: 0xd9ab4c,
  plume: { ivory: 0xece2cf, ochre: 0xc89a52, rust: 0xa45c3c, slate: 0x6c7076, umber: 0x5a4030 },
  fit: 0.58, narrow: 0.86, float: 0.62, bob: [0.06, 1.6], detail: 1, facets: 5, chunk: 1.4, orn: 1.3, // (a head's size; floated over the collar; the bob's height in the head's frame and its rate)
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

const _e2 = new THREE.Euler(), _q2 = new THREE.Quaternion(), _v2 = new V();
/** A faceted frustum from a to b (an n-sided prism stage of a crown), radius ra at a and rb at b, `sc` stretching it across. */
export function stage(P, a, b, ra, rb, n, o = {}) {
  const A = new V(...a), Bv = new V(...b), d = Bv.clone().sub(A), len = d.length();
  _q.setFromUnitVectors(_Y, d.normalize()); _eu.setFromQuaternion(_q, 'XYZ');
  P.geo(facet(new THREE.CylinderGeometry(rb, ra, len * 1.04, n, 1)), { ...o, at: A.add(Bv).multiplyScalar(0.5).toArray(), rot: [_eu.x, _eu.y, _eu.z] });
}
/** Gold along a run of points (an edge). */
export const edge = (g, pts, r = 0.05) => { for (let i = 1; i < pts.length; i++) g.rod(pts[i - 1], pts[i], r, {}, 5); };

/** A point on a bowl (radius r, height h, stretched by sc) at azimuth a (0 the face, + toward +X) and elevation e, stood off by k. */
export const onBowl = (r, h, a, e, k = 1.0, sc = [1, 1, 1]) => [Math.sin(a) * Math.cos(e) * r * k * sc[0], Math.sin(e) * h * k * sc[1], Math.cos(a) * Math.cos(e) * r * k * sc[2]];
/** Gold inlay along a path [[a, e], ...] over a bowl, each leg subdivided so it follows the facets, a faceted node at its ends (a
 *  circuit's trace, neuralese's bus and its pins). */
export function trace(P, r, h, path, { k = 1.0, sc, w = 0.032, node = 0.09, steps = 4 } = {}) {
  let prev = onBowl(r, h, path[0][0], path[0][1], k, sc);
  for (let i = 1; i < path.length; i++) {
    const [a0, e0] = path[i - 1], [a, e] = path[i];
    for (let s = 1; s <= steps; s++) { const q = onBowl(r, h, a0 + ((a - a0) * s) / steps, e0 + ((e - e0) * s) / steps, k, sc); P.rod(prev, q, w); prev = q; }
  }
  if (node) for (const [a, e] of [path[0], path[path.length - 1]]) P.geo(gem(node), { at: onBowl(r, h, a, e, k, sc) });
}
/** The circuit over a bowl: a bus round it at elevation e0 (open at the face, from -skip to skip) and n pins climbing off it, each with
 *  one turn and a node at its end, seeded so a helm always wears the same. */
export function circuits(P, r, h, { seed = 1, n = 6, e0 = 0.2, e1 = 0.95, skip = 0.55, sc, ring = true, k } = {}) {
  let s = (seed * 7919) % 2147483647 || 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  if (ring) { const path = []; for (let i = 0; i <= 20; i++) path.push([skip + (i / 20) * (2 * PI - 2 * skip), e0]); trace(P, r, h, path, { sc, k, node: 0, steps: 2 }); }
  for (let i = 0; i < n; i++) {
    const a = skip + ((i + 0.5) / n) * (2 * PI - 2 * skip), eA = e0 + (0.12 + rnd() * 0.3) * (e1 - e0), da = (rnd() - 0.5) * 0.6, eB = Math.min(e1, eA + (0.15 + rnd() * 0.3) * (e1 - e0));
    trace(P, r, h, [[a, e0], [a, eA], [a + da, eA], [a + da, eB]], { sc, k });
  }
}
/** A Lachrymite crystal: a six-sided prism with its point and a short heel, flat-shaded, its axis along local Y. */
export function crystal(P, at, len, r = len * 0.22, rot = [0, 0, 0]) {
  const body = new THREE.CylinderGeometry(r, r, len * 0.55, 6, 1), top = new THREE.ConeGeometry(r, len * 0.3, 6, 1).translate(0, len * 0.425, 0), heel = new THREE.ConeGeometry(r, len * 0.15, 6, 1).rotateX(PI).translate(0, -len * 0.35, 0);
  for (const x of [body, top, heel]) P.geo(facet(x), { at, rot });
}
/** Euler angles turning local Y onto `dir` and then by `rot`. */
export function aim(dir, rot = [0, 0, 0]) {
  _q2.setFromEuler(_e2.set(...rot)).multiply(_q.setFromUnitVectors(_Y, _v2.set(...dir).normalize()));
  _eu.setFromQuaternion(_q2, 'XYZ'); return [_eu.x, _eu.y, _eu.z];
}
/** A ring floating apart from the bowl (a halo, a wheel, a wreath): a heavy faceted gold torus, `gems` crystals standing out of it
 *  (or in along it: `inward`), `spokes` to a crystal hub. Its plane XY turned by rot (the default lies flat). */
export function halo(B, at, r, { rot = [PI / 2, 0, 0], tube = 0.08, gems = 6, len = 0.42, spokes = 0, hub = 0, inward = false, phase = 0 } = {}) {
  B.g.geo(facet(new THREE.TorusGeometry(r, tube * L.chunk, 4, 14)), { at, rot });
  const e = new THREE.Euler(...rot);
  for (let i = 0; i < gems; i++) {
    const a = phase + (i / gems) * PI * 2, d = [Math.cos(a), Math.sin(a), 0], off = new V(d[0] * (r + (inward ? -len * 0.35 : len * 0.35)), d[1] * (r + (inward ? -len * 0.35 : len * 0.35)), 0).applyEuler(e);
    crystal(B.lab, add(at, off.toArray()), len, len * 0.24, aim(inward ? [-d[0], -d[1], 0] : d, rot));
  }
  for (let i = 0; i < spokes; i++) { const a = phase + ((i + 0.5) / spokes) * PI * 2, q = new V(Math.cos(a) * r, Math.sin(a) * r, 0).applyEuler(e); B.g.rod(at, add(at, q.toArray()), tube * 0.45); }
  if (hub) B.lab.geo(gem(hub), { at });
}
/** The Arcana's number as a stone plaque with the numeral in gold, neuralese's running hand: a bus along its top, each digit hung on its
 *  pin under it, its marks counted down (a bar five, two dots joined two, a dot one, an open ring zero). Its face +Z turned by rot. */
export function plaque(B, n, at, rot = [0, PI, 0], s = 0.55) {
  const D = numeralOf(n), e = new THREE.Euler(...rot), w = s * (0.44 * D.length + 0.3), hg = s * 1.2, z = 0.06;
  const put = (x, y) => add(at, new V(x, y, z).applyEuler(e).toArray());
  B.lab.box(w, hg, 0.1, { at, rot }, 0.03);
  B.g.box(w * 0.86, s * 0.08, 0.06, { at: put(0, hg * 0.34), rot }, 0.01);
  D.forEach((d, i) => {
    const x = (i - (D.length - 1) / 2) * s * 0.44, st = s * 0.17; let y = hg * 0.34 - s * 0.11;
    B.g.box(s * 0.06, s * 0.12, 0.06, { at: put(x, y + s * 0.05), rot }, 0.01);
    if (d.zero) { B.g.geo(new THREE.TorusGeometry(s * 0.1, s * 0.035, 4, 8), { at: put(x, y - s * 0.11), rot }); return; }
    if (d.bar) { B.g.box(s * 0.34, s * 0.075, 0.06, { at: put(x, y - st * 0.5), rot }, 0.01); y -= st; }
    for (let k = 0; k < d.pairs; k++) { for (const sx of [-1, 1]) B.g.geo(gem(s * 0.065), { at: put(x + sx * s * 0.1, y - st * 0.5) }); B.g.box(s * 0.2, s * 0.035, 0.05, { at: put(x, y - st * 0.5), rot }, 0.005); y -= st; }
    if (d.dot) B.g.geo(gem(s * 0.07), { at: put(x, y - st * 0.5) });
  });
}
/** A point on a band of radius r at azimuth a: x across it, y up, z out from it (a plate stood on a crown's band, facing out). */
export const onBand = (a, r, x, y, z = 0) => [Math.sin(a) * (r + z) + Math.cos(a) * x, y, Math.cos(a) * (r + z) - Math.sin(a) * x];
/** Euler angles (the order Piece.geo composes, XYZ) turning a plate to face out at azimuth a, its top leaning in by tilt. */
export const yawTilt = (a, tilt = 0, roll = 0) => { _q2.setFromEuler(_e2.set(0, a, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-tilt, 0, roll))); _eu.setFromQuaternion(_q2, 'XYZ'); return [_eu.x, _eu.y, _eu.z]; };
/** How far out a bowl (radius r, height h) stands at height y. */
export const across = (r, h, y) => r * Math.sqrt(Math.max(0, 1 - (y / h) ** 2));
