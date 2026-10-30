// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S LAYOUT: where every part of its look stands (vfx/garden/myggdrasil.js and its parts in this folder). Heights are metres
// over its ground at the trunk's foot, distances metres out from its axis, bearings degrees round it (0 toward +Z, 90 toward +X, the
// tree's own frame: its heart the planetoid's, its axis +Y). A table and a few pure helpers: no three.js object is made at import.
//
//   THE TRUNK    a knot of braided roots, its axis-distance `trunkR(y)`: the bole (0 .. 7 m) wide and closed round a dark hollow, the
//                trunk itself (7 .. 22 m) woven open, a lattice you see through, the column (22 .. 42 m) the four strands that rise on to the Crown
//   THE MOUTH    MOUTH: the arch between the two strands that part at the bole's foot (bearing 90), where the world's F stands
//   THE CAPS     CAP_SITES: the ten fruiting bodies on the Tree of Life's places (Espada's sephiroth, Dovina's CAPS order, root up)
//   THE BRANCHES BRANCH_PATHS: the twenty-two paths between them (the Golden Dawn's attribution, Dovina's BRANCHES by their trump)
//
// Prior art: the Kabbalists' Tree of Life and the Golden Dawn's paths (the caps and branches, kept from the World Mushroom before it),
// the strangler fig's lattice trunk (Ficus aurea round its host) and Laputa's great tree (roots knotted round a core and gripping a
// world), for the trunk's proportions.
//
//   import { MYGG, CAP_SITES, BRANCH_PATHS, MOUTH, trunkR, treeFrame, lcg, angDiff, noise3, D2R } from './layout.js'
//   const F = treeFrame(radius, surface)   F.at(az, rho, y, out)   F.ground(az, s, lift, out)   F.groundR(p)   F.up(az, s)   F.y0   F.R
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Its numbers: height (m, the ground to the Crown's top), the far body's distance (m), a cap's opening (real seconds), the caps open when
 *  the state says nothing, the most fruit drawn, the caps' lean to the tincture (0..1), the spores' reach (m from the eye: none drawn past
 *  it), the glow's scale (the emissive at night per unit of a part's glow). */
export const MYGG = { height: 48, lodFar: 95, openSeconds: 2.6, defaultCaps: 3, fruitMax: 30, tintMax: 0.46, sporesNear: 110, glow: 2.4 };

/** The ten caps, root up (Dovina's CAPS order: the Kingdom .. the Crown): height of the cap's heart over the ground (m), how far out
 *  (0: round the column), its bearing (degrees), its radius (m), where its limb leaves the trunk (m; `stalk`: it rises from the ground
 *  among the roots on a stalk of its own). The side pillars spiral on coral limbs peeled off the trunk, Wisdom 0, Mercy 60, Victory 120
 *  (the right), Understanding 180, Severity 240, Splendour 300 (the left), the highest farthest out; Beauty rings the column where the
 *  limbs have left it; the Crown is the great cap on the column's top. */
export const CAP_SITES = [
  { id: 'kingdom', y: 3.6, out: 11.2, az: 200, r: 3.3, stalk: true },
  { id: 'foundation', y: 12.2, out: 9.4, az: 20, r: 3.9, arm: 8.5 },
  { id: 'splendour', y: 20, out: 13.2, az: 300, r: 4.8, arm: 14.5 },
  { id: 'victory', y: 20, out: 13.2, az: 120, r: 4.8, arm: 14.5 },
  { id: 'beauty', y: 29.2, out: 0, az: 0, r: 8.2, ring: true },
  { id: 'severity', y: 31, out: 15.6, az: 240, r: 5.4, arm: 21 },
  { id: 'mercy', y: 31, out: 15.6, az: 60, r: 5.4, arm: 21 },
  { id: 'understanding', y: 36, out: 18.6, az: 180, r: 5.2, arm: 22.5 },
  { id: 'wisdom', y: 36, out: 18.6, az: 0, r: 5.2, arm: 22.5 },
  { id: 'crown', y: 42.4, out: 0, az: 0, r: 15, top: true },
];
/** The twenty-two branches: each trump's path between two caps (indices into CAP_SITES, the lower first), the Golden Dawn's
 *  attribution of paths 11 to 32 (the Fool Kether to Chokmah .. the World Yesod to Malkuth). */
export const BRANCH_PATHS = {
  fool: [8, 9], magician: [7, 9], priestess: [4, 9], empress: [7, 8], emperor: [4, 8], hierophant: [6, 8], lovers: [4, 7], chariot: [5, 7],
  strength: [5, 6], hermit: [4, 6], wheel: [3, 6], justice: [4, 5], hanged: [2, 5], death: [3, 4], temperance: [1, 4], devil: [2, 4],
  tower: [2, 3], star: [1, 3], moon: [0, 3], sun: [1, 2], judgement: [0, 2], world: [0, 1],
};
/** The roots' mouth: its bearing, how far out along the ground the F stands (inside the arch's threshold), lifted (m); the arch's half
 *  width at the bole's foot (degrees each way) and the height its two strands meet over it (m). */
export const MOUTH = { az: 90, s: 5.4, lift: 0.35, spread: 33, top: 7.4 };
/** The trunk's axis-distance by height (m): the bole, the trunk, the column. */
const TRUNK = [[-1.5, 6.2], [0, 5.8], [2, 5.2], [4.5, 4.7], [7, 4.45], [11, 4.3], [15, 4.2], [19, 4.3], [21, 4.4], [23, 3.4], [26, 2.95], [32, 2.7], [38, 2.45], [42, 2.25], [44, 1.6]];
/** Where the trunk gives way to the column (m): above it the strands not peeled off as limbs pull in. */
export const COLUMN = { from: 21.5, to: 41.2 };

/** The trunk's axis-distance at a height over the ground (m). */
export function trunkR(y) {
  if (y <= TRUNK[0][0]) return TRUNK[0][1];
  for (let i = 1; i < TRUNK.length; i++) if (y <= TRUNK[i][0]) { const [y0, r0] = TRUNK[i - 1], [y1, r1] = TRUNK[i], k = (y - y0) / (y1 - y0); return r0 + (r1 - r0) * k * k * (3 - 2 * k); }
  return TRUNK[TRUNK.length - 1][1];
}

export const D2R = Math.PI / 180;
/** The tree's frame on its planetoid: `at` a point over the ground's level at the foot, `ground` a point on the ground itself along the
 *  planetoid's curve (s metres from the trunk, lifted along the ground's up), `y0` the ground's radius under the trunk. */
export function treeFrame(radius, surface) {
  const S = surface || (() => radius), d = new THREE.Vector3(), y0 = S(d.set(0, 1, 0)), cache = new Map();
  // the ground's radius on a lattice (4 degrees round by 1 m along the ground), each cell asked of the surface once, bilinear between
  const cell = (ai, si) => {
    if (si <= 0) return y0;
    const a4 = ((ai % 90) + 90) % 90, key = a4 * 512 + si; let v = cache.get(key);
    if (v === undefined) { const a = a4 * 4 * D2R, phi = si / radius; v = S(d.set(Math.sin(phi) * Math.sin(a), Math.cos(phi), Math.sin(phi) * Math.cos(a))); cache.set(key, v); }
    return v;
  };
  const lattice = (az, s) => {
    const fa = (((az % 360) + 360) % 360) / 4, fs = Math.max(0, s), a0 = Math.floor(fa), s0 = Math.floor(fs), ka = fa - a0, ks = fs - s0;
    return (cell(a0, s0) * (1 - ka) + cell(a0 + 1, s0) * ka) * (1 - ks) + (cell(a0, s0 + 1) * (1 - ka) + cell(a0 + 1, s0 + 1) * ka) * ks;
  };
  return {
    R: radius, y0,
    at(az, rho, y, out = new THREE.Vector3()) { return out.set(Math.sin(az * D2R) * rho, y0 + y, Math.cos(az * D2R) * rho); },
    ground(az, s, lift = 0, out = new THREE.Vector3()) {
      const a = az * D2R, phi = s / radius; out.set(Math.sin(phi) * Math.sin(a), Math.cos(phi), Math.sin(phi) * Math.cos(a));
      return out.multiplyScalar(lattice(az, s) + lift);
    },
    /** The ground's radius in the direction of p (m from the heart), from the same lattice (a painter asks it for every vertex). */
    groundR(p) { return lattice(Math.atan2(p.x, p.z) / D2R, Math.atan2(Math.hypot(p.x, p.z), p.y) * radius); },
    /** The ground's up at (az, s): out from the planetoid's heart. */
    up(az, s, out = new THREE.Vector3()) { const a = az * D2R, phi = s / radius; return out.set(Math.sin(phi) * Math.sin(a), Math.cos(phi), Math.sin(phi) * Math.cos(a)); },
  };
}

/** A seeded stream of 0..1. */
export function lcg(seed) { let a = Math.floor(Math.abs(seed) * 1000) % 2147483647 || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }
/** The signed turn from bearing a to bearing b (degrees, -180 .. 180). */
export const angDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
const h3 = (i, j, k) => { const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
/** Smooth value noise in 0..1 (three axes). */
export function noise3(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = x - X, v = y - Y, w = z - Z, s = (t) => t * t * (3 - 2 * t), su = s(u), sv = s(v), sw = s(w), l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h3(X, Y, Z), h3(X + 1, Y, Z), su), l(h3(X, Y + 1, Z), h3(X + 1, Y + 1, Z), su), sv), l(l(h3(X, Y, Z + 1), h3(X + 1, Y, Z + 1), su), l(h3(X, Y + 1, Z + 1), h3(X + 1, Y + 1, Z + 1), su), sv), sw);
}
export const smooth01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
