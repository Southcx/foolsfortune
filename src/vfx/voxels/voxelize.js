// ---------------------------------------------------------------------------------------
// VOXELIZE: a mesh or a Group baked to a voxel set, the cubes a body breaks into when the voxel batch throws it apart (vfx/voxels/
// voxelbatch.js). Its surfaces are sampled (points spread over each triangle by its area, and every triangle's middle so a thin mast or
// a fin is never lost), snapped to a grid of one cell and deduped; a cell takes the mean colour of the points in it (the vertex colour
// times the material's colour, in the working linear space) and the most glow of any (the rail foes' accent weight, the first channel of
// their `fx` attribute: vfx/railfoes/kit.js; or a material's emissive). Over the cap, the cell grows and the points are snapped again, so
// a body keeps its whole silhouette in fewer, bigger cubes rather than losing pieces. Pure (three.js maths only, no renderer), the same
// every time (its own small random stream), and cached by a key: a role is baked once, at its first death.
//
// What is skipped: the glows (an additive or depth-write-free material: halos, tethers, bubbles); an InstancedMesh's copies (the first
// copy only). Hidden meshes are kept (a boss part hides its skins just before it throws them: vfx/bossparts.js).
//
// Prior art: surface voxelization by point sampling (the "dart throwing" of Turk's re-tiling, 1992, and every MagicaVoxel importer's
// triangle sampler), the area-weighted triangle pick (Osada et al., "Shape Distributions", 2002: sqrt(r1) barycentrics), Resogun's and
// Nex Machina's foes that are their voxels (Housemarque), the god hand's grid (godhand/voxels.js) as this one's dense cousin.
//
//   const set = voxelize(object, { key?, cell?, cap = 160, cells = 10 })   (cell in the object's own units; cells: cells along its
//                                                                            longest side when no cell is given)
//   set = { positions: Float32Array (xyz, local), colours: Float32Array (rgb linear), glow: Float32Array, size (the cell), count,
//           radius (of the set round its origin), key }
//   voxelSetOf(key) -> the cached set | undefined    clearVoxelSets()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const CACHE = new Map();
const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const _ab = new THREE.Vector3(), _ac = new THREE.Vector3(), _col = new THREE.Color(), _emi = new THREE.Color();

/** A small random stream (mulberry32): the same body bakes the same every time. */
function stream(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** A glow is not a solid: additive, or drawn without writing depth. */
const isGlow = (mat) => !mat || mat.blending === THREE.AdditiveBlending || (mat.transparent && mat.depthWrite === false);

/** The points on the object's surfaces: { p: Float32Array xyz, c: rgb, g: glow, n } in the object's own frame. */
function sample(object, cellGuess, rnd) {
  object.updateWorldMatrix(true, true);
  _inv.copy(object.matrixWorld).invert();
  const tris = [];
  let area = 0;
  object.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (isGlow(mat)) return;
    const g = o.geometry, P = g.attributes.position, C = mat?.vertexColors !== false ? g.attributes.color : null, FX = g.attributes.fx || null;
    const I = g.index, n = I ? I.count : P.count;
    _m.multiplyMatrices(_inv, o.matrixWorld);
    if (o.isInstancedMesh) { const im = new THREE.Matrix4(); o.getMatrixAt(0, im); _m.multiply(im); }
    const base = mat?.color ? _col.copy(mat.color) : _col.setRGB(1, 1, 1);
    const br = base.r, bg = base.g, bb = base.b;
    const emi = mat?.emissive ? _emi.copy(mat.emissive).multiplyScalar(mat.emissiveIntensity ?? 1) : _emi.setRGB(0, 0, 0);
    const glow0 = Math.min(1, Math.max(emi.r, emi.g, emi.b));
    for (let t = 0; t + 2 < n; t += 3) {
      const i0 = I ? I.getX(t) : t, i1 = I ? I.getX(t + 1) : t + 1, i2 = I ? I.getX(t + 2) : t + 2;
      _a.fromBufferAttribute(P, i0).applyMatrix4(_m); _b.fromBufferAttribute(P, i1).applyMatrix4(_m); _c.fromBufferAttribute(P, i2).applyMatrix4(_m);
      const A = _ab.subVectors(_b, _a).cross(_ac.subVectors(_c, _a)).length() * 0.5;
      const col = [br, bg, bb];
      if (C) { col[0] *= (C.getX(i0) + C.getX(i1) + C.getX(i2)) / 3; col[1] *= (C.getY(i0) + C.getY(i1) + C.getY(i2)) / 3; col[2] *= (C.getZ(i0) + C.getZ(i1) + C.getZ(i2)) / 3; }
      const glow = Math.max(glow0, FX ? Math.min(1, (FX.getX(i0) + FX.getX(i1) + FX.getX(i2)) / 3) : 0);
      tris.push([_a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _c.x, _c.y, _c.z, A, col, glow]);
      area += A;
    }
  });
  // two points a cell's area, spread by area (the leftover carried, so the count is exact), and every triangle's middle
  const want = Math.min(24000, Math.max(tris.length, Math.ceil((area / (cellGuess * cellGuess)) * 2)));
  const p = [], c = [], gl = [];
  let carry = 0;
  for (const T of tris) {
    const push = (u, v) => { const w = 1 - u - v; p.push(T[0] * w + T[3] * u + T[6] * v, T[1] * w + T[4] * u + T[7] * v, T[2] * w + T[5] * u + T[8] * v); c.push(T[10][0], T[10][1], T[10][2]); gl.push(T[11]); };
    push(1 / 3, 1 / 3);
    carry += area > 0 ? (T[9] / area) * want : 0;
    for (; carry >= 1; carry -= 1) { const r1 = Math.sqrt(rnd()), r2 = rnd(); push(r1 * (1 - r2), r1 * r2); } // (uniform on the triangle)
  }
  return { p: new Float32Array(p), c: new Float32Array(c), g: new Float32Array(gl), n: gl.length };
}

/** The points snapped to cells of `cell`, deduped: a Map of cell key -> [sum r, g, b, count, glow, ix, iy, iz]. */
function snap(S, cell) {
  const M = new Map(), P = S.p;
  for (let i = 0; i < S.n; i++) {
    const ix = Math.floor(P[i * 3] / cell), iy = Math.floor(P[i * 3 + 1] / cell), iz = Math.floor(P[i * 3 + 2] / cell);
    const k = ((ix + 512) & 1023) * 1048576 + ((iy + 512) & 1023) * 1024 + ((iz + 512) & 1023);
    let e = M.get(k);
    if (!e) M.set(k, (e = [0, 0, 0, 0, 0, ix, iy, iz]));
    e[0] += S.c[i * 3]; e[1] += S.c[i * 3 + 1]; e[2] += S.c[i * 3 + 2]; e[3]++; e[4] = Math.max(e[4], S.g[i]);
  }
  return M;
}

export function voxelize(object, { key = null, cell = null, cap = 160, cells = 10 } = {}) {
  if (key != null && CACHE.has(key)) return CACHE.get(key);
  const box = new THREE.Box3();
  object.updateWorldMatrix(true, true);
  _inv.copy(object.matrixWorld).invert();
  object.traverse((o) => {
    if (!o.isMesh || !o.geometry || isGlow(Array.isArray(o.material) ? o.material[0] : o.material)) return;
    o.geometry.boundingBox || o.geometry.computeBoundingBox();
    box.union(new THREE.Box3().copy(o.geometry.boundingBox).applyMatrix4(_m.multiplyMatrices(_inv, o.matrixWorld)));
  });
  const ext = box.isEmpty() ? 1 : Math.max(1e-3, ...box.getSize(_a).toArray());
  let size = cell || ext / cells;
  const S = sample(object, size, stream(0x5eed));
  let M = snap(S, size);
  for (let tries = 0; M.size > cap && tries < 8; tries++) { size *= Math.sqrt(M.size / cap) * 1.04; M = snap(S, size); } // (a surface's cells go as 1 / cell²)
  const count = M.size, positions = new Float32Array(count * 3), colours = new Float32Array(count * 3), glow = new Float32Array(count);
  let i = 0, radius = 0;
  for (const e of M.values()) {
    const x = (e[5] + 0.5) * size, y = (e[6] + 0.5) * size, z = (e[7] + 0.5) * size;
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    colours[i * 3] = e[0] / e[3]; colours[i * 3 + 1] = e[1] / e[3]; colours[i * 3 + 2] = e[2] / e[3]; glow[i] = e[4];
    radius = Math.max(radius, Math.hypot(x, y, z)); i++;
  }
  const set = { positions, colours, glow, size, count, radius, key };
  if (key != null) CACHE.set(key, set);
  return set;
}
export const voxelSetOf = (key) => CACHE.get(key);
export const clearVoxelSets = () => CACHE.clear();
