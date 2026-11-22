// ---------------------------------------------------------------------------------------
// THE BLUE HOLE'S SHAFT (plain name; South, 2026-11-22: "turn The Weir into a proper Blue Hole + Cenote + Dave the Diver fishing
// extravaganza module ... go wild with the procedural generation of psychedelic seaweed and warped coral walls"): the one shape the
// blue hole is made of, in its own frame (y 0 the water's surface, metres; the room places it). A lathe about the y axis, top to
// bottom: the cenote's cliff open to the sky (CLIFF m over the water), the undercut just under the surface where a cenote's roof fell
// in, the throat, the bell (the wide dark room a blue hole opens into below its throat), and the bowl of its floor. Every ring is
// pushed in and out by a domain-warped noise and a few vertical ribs, so the wall reads as grown (coral and flowstone) and never as a
// turned pot. The same triangles are drawn (vfx/bluehole/) and collided (a trimesh: world/bluehole/bluehole.js).
//
// Prior art: Dean's Blue Hole and the Great Blue Hole (the narrow throat over a wide bell), the Yucatan's cenotes (Ik Kil's cliff and
// hanging roots, Dos Ojos' undercut), Deep Dive Dubai (a dive pool sunk as a shaft, a city at its floor); abyssal-garden (Maksymilian
// Dendura, MIT, github.com/Noniv/abyssal-garden: its meshLathe, profile rings lumped by fbm and ribbed, taken here as the shaft's
// method, and its absorption colours, taken by the look); Inigo Quilez's domain warping (fbm of fbm) for the wall's flow.
//
//   PROFILE (the radius's stations)   radiusAt(y) (the profile alone)   wallAt(theta, y) (with the warp)   noise3(x, y, z)
//   shaftMesh() -> { pos, idx, nTheta, nY, ys, top: [i...] (the top ring's vertices) }   CLIFF   FLOOR
// ---------------------------------------------------------------------------------------

/** How high the cliff stands over the water, and how deep the floor lies under it (m). */
export const CLIFF = 8, FLOOR = 62;
/** The profile: [y, radius] stations, top to bottom, eased between (smoothstep). */
export const PROFILE = [[CLIFF, 12.5], [3, 12.5], [0, 13], [-5, 13.5], [-11, 9], [-18, 6.5], [-24, 8], [-32, 17], [-42, 22], [-52, 19], [-58, 12], [-FLOOR + 1.2, 4], [-FLOOR, 0.01]];

// ---- noise: a hashed value noise in 3D, smooth, and fbm over it (no dependency; the same everywhere, so the look and the collider agree)
const fract = (x) => x - Math.floor(x);
const hash = (x, y, z) => fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
const fade = (t) => t * t * (3 - 2 * t);
/** Value noise in -1..1. */
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  const v = L(L(L(c(0, 0, 0), c(1, 0, 0), xf), L(c(0, 1, 0), c(1, 1, 0), xf), yf), L(L(c(0, 0, 1), c(1, 0, 1), xf), L(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
  return v * 2 - 1;
}
export function fbm(x, y, z, oct = 4) { let a = 0.5, s = 0; for (let i = 0; i < oct; i++) { s += a * noise3(x, y, z); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; } return s; }

/** The profile's radius at height y (no warp). */
export function radiusAt(y) {
  const P = PROFILE;
  if (y >= P[0][0]) return P[0][1];
  for (let i = 0; i < P.length - 1; i++) {
    const [y0, r0] = P[i], [y1, r1] = P[i + 1];
    if (y <= y0 && y >= y1) { const t = (y0 - y) / (y0 - y1); return r0 + (r1 - r0) * fade(t); }
  }
  return 0.01;
}

/** The wall's radius at an angle and height: the profile pushed by a domain-warped fbm (flowstone), ribs (coral buttresses) and, deep
 *  down, slow folds (the bell's warp). */
export function wallAt(th, y) {
  const base = radiusAt(y); if (base < 0.05) return base;
  const cx = Math.cos(th) * 3, cz = Math.sin(th) * 3, yy = y * 0.11;
  const wx = fbm(cx + 4.1, yy, cz, 3), wz = fbm(cx, yy + 7.3, cz - 2.2, 3); // (the warp: fbm of fbm)
  const n = fbm(cx + wx * 1.6, yy + wz * 1.2, cz + wx, 4);
  const ribs = Math.pow(Math.abs(Math.sin(th * 9 + y * 0.05 + wx * 2)), 6) * 0.9;
  const fold = Math.sin(th * 3 + y * 0.17 + wz * 3) * (y < -20 ? 1.6 : 0.4);
  const k = Math.min(1, base / 6) * (y > 0 ? 0.45 : 1); // (the bowl's bottom tightens to a point, unwarped; the cliff over the dock is calmer, so a camera fits)
  return Math.max(0.05, base + (n * 2.4 - ribs + fold) * k);
}

/** The shaft as triangles: nTheta columns by nY rings, faces turned in (it is seen from inside). */
export function shaftMesh(nTheta = 96, nY = 132) {
  const ys = []; for (let j = 0; j < nY; j++) { const t = j / (nY - 1); ys.push(CLIFF - t * (CLIFF + FLOOR)); }
  const pos = new Float32Array(nTheta * nY * 3), idx = new Uint32Array((nTheta) * (nY - 1) * 6);
  for (let j = 0; j < nY; j++) for (let i = 0; i < nTheta; i++) {
    const th = (i / nTheta) * Math.PI * 2, r = wallAt(th, ys[j]), k = (j * nTheta + i) * 3;
    pos[k] = Math.cos(th) * r; pos[k + 1] = ys[j]; pos[k + 2] = Math.sin(th) * r;
  }
  let q = 0;
  for (let j = 0; j < nY - 1; j++) for (let i = 0; i < nTheta; i++) {
    const a = j * nTheta + i, b = j * nTheta + ((i + 1) % nTheta), d = a + nTheta, e = b + nTheta;
    idx.set([a, d, b, b, d, e], q); q += 6; // (wound to face the axis: (d - a) x (b - a) points in)
  }
  const top = []; for (let i = 0; i < nTheta; i++) top.push(i);
  return { pos, idx, nTheta, nY, ys, top };
}
