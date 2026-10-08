// ---------------------------------------------------------------------------------------
// A PLANETOID'S MESH: the sphere a planetoid look (vfx/garden/planetoid.js) is drawn on, made to follow the god hand's clay
// (world/garden/clay.js: a grid of 128 by 64 heights and grounds over latitude and longitude) at the clay's own fineness, and redrawn
// only where a stroke changed it.
//
//   THE SPHERE    one indexed icosphere per detail, built once and shared by every planetoid at that detail: its unit directions, its
//                 triangles, and (asked for: sphereTangents) an east and a north tangent a vertex (the clay's longitude and latitude:
//                 what the water's flow is laid along). Built straight as an indexed mesh (the 12 corners, the 30 edges' points, each face's inside), never as
//                 IcosahedronGeometry and mergeVertices (56 ms at detail 24, measured). Detail 24 (6,252 vertices, 12,500 triangles) for
//                 every planetoid whatever its radius: an icosphere edge is about 1.1R/(d+1) and a clay cell 2 pi R/128, so the two
//                 match at d 22 to 24 for any R (Calissa's survey, 2026-10-08: the drawn ground within 0.3 m of the clay's, sculpted)
//   THE MAPS      built with the sphere and shared too: each vertex's four clay cells and its bilinear weights (the very sum
//                 Clay.heightAt makes, so a drawn vertex stands exactly on the clay's ground), each cell's vertices, and each vertex's
//                 faces (compressed rows: CSR)
//   THE REFRESH   refreshFromClay(look, clay): the cells whose height or ground changed since the look last saw the clay (8,192
//                 compares), their vertices' heights, positions, colours and ground weights, the normals of their one-ring (area-weighted,
//                 the same sum three.js's computeVertexNormals makes, in the same face order, so a partial refresh equals a full one), the
//                 reach and the bounding sphere (the heart, the farthest ground); the buffers are sent up only over the runs that moved
//   THE GROUNDS   two attributes a vertex, aGroundA (moss, ash, loam) and aGroundB (slate, silt), the bilinear share of each ground
//                 over the four cells in bytes (bare is what is left): what vfx/garden/gardengrounds.js blends the five grounds by
//   THE WET       aWet a vertex (bytes): how wet the ground is (1 under water, drying to 0 over 20 real seconds) and the water's depth
//                 over it (in units of 1.5 m), written by the water's look (vfx/garden/gardenwater.js) and read by the grounds
//
// Prior art: the icosphere as a subdivided icosahedron (three.js's PolyhedronGeometry; Kevin Kaiser's "icosphere" with shared edge
// vertices), the dirty-region refresh of every terrain editor (a brush rebuilds the chunks it touched: Unity's and Unreal's landscape
// tools, From Dust's sculpted sphere), and compressed sparse rows for the adjacency (any mesh library's vertex-face table).
//
//   const S = unitSphere(24)   S.n   S.dir (Float32Array, xyz a vertex)   S.index   sphereTangents(S) -> { east, north }   sphereMaps(S)
//   const geo = sphereGeometry(S)   (position, normal, color, aGroundA, aGroundB; its own index over the shared triangles)
//   vertexNormals(geo, S)   refreshFromClay(look, clay) -> { cells, moved, normals, painted }   (look: { R, h, base, geo, sphere, colourOf(i, C) })
//   tracked(attr) (sent up whole until its first upload, then by runs)   sendRuns(attr, list, count, n)   sendWhole(attr)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { NX, NY, uvOf } from '../../world/garden/clay.js';

/** The detail every planetoid is drawn at unless told otherwise (the clay's fineness: see THE SPHERE above). */
export const DETAIL = 24;
const SPHERES = new Map();

/** The unit icosphere at a detail (shared: one per detail, built on first need). */
export function unitSphere(detail = DETAIL) {
  if (SPHERES.has(detail)) return SPHERES.get(detail);
  const t = (1 + Math.sqrt(5)) / 2, m = detail + 1; // (three.js's icosahedron, its corners and faces in the same order and winding)
  const C = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];
  const F = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  const n = 10 * m * m + 2, dir = new Float32Array(n * 3), P = new Float64Array(n * 3);
  const put = (v, x, y, z) => { const l = Math.hypot(x, y, z); P[v * 3] = x / l; P[v * 3 + 1] = y / l; P[v * 3 + 2] = z / l; };
  for (let c = 0; c < 12; c++) put(c, C[c * 3], C[c * 3 + 1], C[c * 3 + 2]);
  // the edges' points, each edge once (from its lower corner to its higher), so the faces either side share them
  const edges = new Map(); let next = 12;
  for (let f = 0; f < 20; f++) for (let e = 0; e < 3; e++) {
    const a = Math.min(F[f * 3 + e], F[f * 3 + (e + 1) % 3]), b = Math.max(F[f * 3 + e], F[f * 3 + (e + 1) % 3]), key = a * 12 + b;
    if (edges.has(key)) continue;
    edges.set(key, next);
    for (let k = 1; k < m; k++, next++) { const s = k / m; put(next, C[a * 3] + (C[b * 3] - C[a * 3]) * s, C[a * 3 + 1] + (C[b * 3 + 1] - C[a * 3 + 1]) * s, C[a * 3 + 2] + (C[b * 3 + 2] - C[a * 3 + 2]) * s); }
  }
  const onEdge = (a, b, k) => (a < b ? edges.get(a * 12 + b) + k - 1 : edges.get(b * 12 + a) + (m - k) - 1); // (the k-th of m steps from a toward b)
  const index = new (n < 65536 ? Uint16Array : Uint32Array)(20 * m * m * 3); let q = 0;
  const grid = new Int32Array((m + 1) * (m + 1));
  for (let f = 0; f < 20; f++) {
    const A = F[f * 3], B = F[f * 3 + 1], Cc = F[f * 3 + 2];
    // the face's lattice: i steps toward B, j toward C (barycentric), corners and edges shared, the inside its own
    for (let j = 0; j <= m; j++) for (let i = 0; i + j <= m; i++) {
      let v;
      if (i === 0 && j === 0) v = A; else if (i === m) v = B; else if (j === m) v = Cc;
      else if (j === 0) v = onEdge(A, B, i); else if (i === 0) v = onEdge(A, Cc, j); else if (i + j === m) v = onEdge(B, Cc, j);
      else { v = next++; const s = i / m, u = j / m; put(v, C[A * 3] + (C[B * 3] - C[A * 3]) * s + (C[Cc * 3] - C[A * 3]) * u, C[A * 3 + 1] + (C[B * 3 + 1] - C[A * 3 + 1]) * s + (C[Cc * 3 + 1] - C[A * 3 + 1]) * u, C[A * 3 + 2] + (C[B * 3 + 2] - C[A * 3 + 2]) * s + (C[Cc * 3 + 2] - C[A * 3 + 2]) * u); }
      grid[j * (m + 1) + i] = v;
    }
    for (let j = 0; j < m; j++) for (let i = 0; i + j < m; i++) {
      const g = (ii, jj) => grid[jj * (m + 1) + ii];
      index[q++] = g(i, j); index[q++] = g(i + 1, j); index[q++] = g(i, j + 1);
      if (i + j < m - 1) { index[q++] = g(i + 1, j); index[q++] = g(i + 1, j + 1); index[q++] = g(i, j + 1); }
    }
  }
  dir.set(P);
  const S = { detail, n, faces: index.length / 3, dir, index, maps: null, tangents: null };
  SPHERES.set(detail, S); sphereMaps(S); // (the maps with it, at boot: the first stroke never pays for them, 11 to 24 ms)
  return S;
}

/** The clay's east (along its longitude) and north (along its latitude) at each vertex (shared, worked out the first time asked). */
export function sphereTangents(S) {
  if (S.tangents) return S.tangents;
  const n = S.n, dir = S.dir, east = new Float32Array(n * 3), north = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) {
    const x = dir[v * 3], y = dir[v * 3 + 1], z = dir[v * 3 + 2]; let ex = z, ez = -x, l = Math.hypot(ex, ez);
    if (l < 1e-6) { ex = 1; ez = 0; l = 1; } // (at a pole east is any way: one is chosen)
    ex /= l; ez /= l; east[v * 3] = ex; east[v * 3 + 2] = ez;
    north[v * 3] = y * ez; north[v * 3 + 1] = z * ex - x * ez; north[v * 3 + 2] = -y * ex; // (dir x east)
  }
  return (S.tangents = { east, north });
}

/** The sphere's maps onto the clay's grid and its own adjacency (shared, built once with the sphere: 11 to 24 ms at detail 24). */
export function sphereMaps(S) {
  if (S.maps) return S.maps;
  const n = S.n, D = S.dir, cells = new Int32Array(n * 4), fu = new Float64Array(n), fv = new Float64Array(n), v3 = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    // Clay.heightAt's own steps, on the same float directions: a vertex's height is the clay's there to the last bit
    const [u, w] = uvOf(v3.set(D[i * 3], D[i * 3 + 1], D[i * 3 + 2])), i0 = Math.floor(u), j0 = THREE.MathUtils.clamp(Math.floor(w), 0, NY - 1), j1 = Math.min(NY - 1, j0 + 1);
    const i1 = (i0 + 1) % NX;
    fu[i] = u - i0; fv[i] = THREE.MathUtils.clamp(w - j0, 0, 1);
    cells[i * 4] = j0 * NX + i0; cells[i * 4 + 1] = j0 * NX + i1; cells[i * 4 + 2] = j1 * NX + i0; cells[i * 4 + 3] = j1 * NX + i1;
  }
  const N = NX * NY, cOff = new Int32Array(N + 1);
  for (let q = 0; q < n * 4; q++) cOff[cells[q] + 1]++;
  for (let k = 0; k < N; k++) cOff[k + 1] += cOff[k];
  const c2v = new Int32Array(n * 4), fillC = cOff.slice(0, N);
  for (let q = 0; q < n * 4; q++) c2v[fillC[cells[q]]++] = q >> 2;
  const idx = S.index, vOff = new Int32Array(n + 1);
  for (let q = 0; q < idx.length; q++) vOff[idx[q] + 1]++;
  for (let i = 0; i < n; i++) vOff[i + 1] += vOff[i];
  const v2f = new Int32Array(idx.length), fillV = vOff.slice(0, n);
  for (let q = 0; q < idx.length; q++) v2f[fillV[idx[q]]++] = (q / 3) | 0; // (each vertex's faces in rising order: the order the full sum adds them)
  S.maps = { cells, fu, fv, cOff, c2v, vOff, v2f, gen: 0, seenM: new Int32Array(n), seenP: new Int32Array(n), seenR: new Int32Array(n),
    moved: new Int32Array(n), ring: new Int32Array(n), painted: new Int32Array(n), changed: new Int32Array(N), flags: new Uint8Array(N), acc: new Float64Array(n * 3) };
  return S.maps;
}

/** A planetoid's own geometry over the shared sphere: its positions, normals, colours and ground weights (all to be filled). */
export function sphereGeometry(S) {
  const g = new THREE.BufferGeometry(), n = S.n;
  g.setIndex(new THREE.BufferAttribute(S.index, 1)); // (its own attribute over the shared array: taking one planetoid down never frees another's buffer)
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aGroundA', new THREE.BufferAttribute(new Uint8Array(n * 3), 3, true)); // (a share in a byte: 1/255 is finer than any border shows)
  g.setAttribute('aGroundB', new THREE.BufferAttribute(new Uint8Array(n * 2), 2, true));
  g.setAttribute('aWet', new THREE.BufferAttribute(new Uint8Array(n * 2), 2, true)); // (wet, and the water's depth over it / 1.5 m: vfx/garden/gardenwater.js writes it)
  for (const a of Object.values(g.attributes)) tracked(a);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  return g;
}

/** Normals, area-weighted over each vertex's faces: all of them, or the `count` vertices listed. */
export function vertexNormals(geo, S, list = null, count = 0) {
  const P = geo.attributes.position.array, N = geo.attributes.normal.array, idx = S.index;
  const face = (f, out) => { // (twice the face's area along its normal: (B - A) x (C - A))
    const a = idx[f * 3] * 3, b = idx[f * 3 + 1] * 3, c = idx[f * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    out[0] = uy * vz - uz * vy; out[1] = uz * vx - ux * vz; out[2] = ux * vy - uy * vx;
  };
  const write = (i, x, y, z) => { const l = Math.sqrt(x * x + y * y + z * z) || 1; N[i * 3] = x / l; N[i * 3 + 1] = y / l; N[i * 3 + 2] = z / l; };
  if (!list) {
    const M = sphereMaps(S), A = M.acc; A.fill(0);
    for (let f = 0; f < S.faces; f++) { face(f, _f); for (let e = 0; e < 3; e++) { const v = idx[f * 3 + e] * 3; A[v] += _f[0]; A[v + 1] += _f[1]; A[v + 2] += _f[2]; } }
    for (let i = 0; i < S.n; i++) write(i, A[i * 3], A[i * 3 + 1], A[i * 3 + 2]);
    return;
  }
  const M = sphereMaps(S);
  for (let a = 0; a < count; a++) {
    const i = list[a]; let x = 0, y = 0, z = 0;
    for (let q = M.vOff[i]; q < M.vOff[i + 1]; q++) { face(M.v2f[q], _f); x += _f[0]; y += _f[1]; z += _f[2]; }
    write(i, x, y, z);
  }
}

/** The look brought up to the clay: only what changed since it last looked (the first time, everything). See THE REFRESH above. */
export function refreshFromClay(L, clay) {
  const S = L.sphere, M = sphereMaps(S), H = clay.h, G = clay.ground, N = H.length, geo = L.geo;
  let seen = L.claySeen;
  if (!seen || seen.clay !== clay) {
    // a look still as it was made (flat, bare) shows a flat, bare clay already: only what differs is redrawn, so a planetoid's first stroke
    // costs what any stroke does; a look shaped otherwise takes every cell (NaN equals nothing)
    const blank = L.h.every((v) => v === 0) && geo.attributes.aGroundA.array.every((v) => v === 0) && geo.attributes.aGroundB.array.every((v) => v === 0);
    seen = L.claySeen = { clay, h: blank ? new Float32Array(N) : new Float32Array(N).fill(NaN), g: blank ? new Uint8Array(N) : new Uint8Array(N).fill(255) }; // (255 is no ground's number)
  }
  const sh = seen.h, sg = seen.g, changed = M.changed, flags = M.flags; let nc = 0;
  for (let k = 0; k < N; k++) {
    const dh = H[k] !== sh[k], dg = G[k] !== sg[k];
    if (dh || dg) { flags[k] = (dh ? 1 : 0) | (dg ? 2 : 0); changed[nc++] = k; sh[k] = H[k]; sg[k] = G[k]; }
  }
  if (!nc) return { cells: 0, moved: 0, normals: 0, painted: 0 };
  // the vertices those cells reach: moved (a height changed under them) and painted (a ground changed)
  const gen = ++M.gen, sm = M.seenM, sp = M.seenP, moved = M.moved, painted = M.painted; let nm = 0, np = 0;
  for (let c = 0; c < nc; c++) {
    const k = changed[c], f = flags[k];
    for (let q = M.cOff[k]; q < M.cOff[k + 1]; q++) {
      const i = M.c2v[q];
      if ((f & 1) && sm[i] !== gen) { sm[i] = gen; moved[nm++] = i; }
      if ((f & 2) && sp[i] !== gen) { sp[i] = gen; painted[np++] = i; }
    }
  }
  const Rr = L.R, D = S.dir, h = L.h, base = L.base, cells = M.cells, fu = M.fu, fv = M.fv, pos = geo.attributes.position, col = geo.attributes.color;
  const Pa = pos.array;
  for (let a = 0; a < nm; a++) {
    const i = moved[a], s = i * 4, u = fu[i], w = fv[i];
    h[i] = ((H[cells[s]] * (1 - u) + H[cells[s + 1]] * u) * (1 - w) + (H[cells[s + 2]] * (1 - u) + H[cells[s + 3]] * u) * w) / Rr; // (Clay.heightAt's sum, in its order)
    const r = Rr * (base[i] + h[i]); Pa[i * 3] = D[i * 3] * r; Pa[i * 3 + 1] = D[i * 3 + 1] * r; Pa[i * 3 + 2] = D[i * 3 + 2] * r;
    L.colourOf(i, col);
  }
  let nr = 0;
  if (nm) {
    // the one-ring: every vertex of a face that touches a moved vertex takes a new normal
    const sr = M.seenR, ring = M.ring, idx = S.index;
    for (let a = 0; a < nm; a++) { const i = moved[a]; for (let q = M.vOff[i]; q < M.vOff[i + 1]; q++) { const f = M.v2f[q] * 3; for (let e = 0; e < 3; e++) { const j = idx[f + e]; if (sr[j] !== gen) { sr[j] = gen; ring[nr++] = j; } } } }
    vertexNormals(geo, S, ring, nr);
    bounds(L);
    sendRuns(pos, moved, nm, S.n); sendRuns(col, moved, nm, S.n); sendRuns(geo.attributes.normal, ring, nr, S.n);
  }
  if (np) {
    const A = geo.attributes.aGroundA, B = geo.attributes.aGroundB, Aa = A.array, Ba = B.array;
    for (let a = 0; a < np; a++) {
      const i = painted[a], s = i * 4, u = fu[i], w = fv[i]; _g.fill(0);
      _g[G[cells[s]]] += (1 - u) * (1 - w); _g[G[cells[s + 1]]] += u * (1 - w); _g[G[cells[s + 2]]] += (1 - u) * w; _g[G[cells[s + 3]]] += u * w; // (slot 0 is bare)
      Aa[i * 3] = Math.round(_g[1] * 255); Aa[i * 3 + 1] = Math.round(_g[2] * 255); Aa[i * 3 + 2] = Math.round(_g[3] * 255); Ba[i * 2] = Math.round(_g[4] * 255); Ba[i * 2 + 1] = Math.round(_g[5] * 255);
    }
    sendRuns(A, painted, np, S.n); sendRuns(B, painted, np, S.n);
  }
  return { cells: nc, moved: nm, normals: nr, painted: np };
}

/** The reach (its farthest ground from the heart, its crown's props over it) and the bounding sphere, from the heights. */
export function bounds(L) {
  let far = 0; const h = L.h, base = L.base;
  for (let i = 0; i < h.length; i++) { const r = base[i] + h[i]; if (r > far) far = r; }
  L.geo.boundingSphere.center.set(0, 0, 0); L.geo.boundingSphere.radius = L.R * far;
  L.reach = L.R * far + 0.6;
}

/** An attribute that is sent up whole until its first upload, and after that only over the runs it is told of (sendRuns). */
export function tracked(attr) { attr.setUsage(THREE.DynamicDrawUsage); attr.whole = true; attr.onUpload(sentWhole); return attr; }
/** Send an attribute up over the runs of the listed vertices only (sorted, near runs joined), added to whatever runs are still owed
 *  since the last upload (two refreshes before one frame); past a third of the mesh, or too scattered, the whole of it. The list's
 *  first `count` entries are sorted in place. */
export function sendRuns(attr, list, count, n) {
  if (!count) return;
  attr.needsUpdate = true;
  if (attr.whole) return; // (a whole upload is owed already: it carries these too)
  if (count > n / 3) { attr.clearUpdateRanges(); attr.whole = true; return; }
  const L = list.subarray(0, count).sort(), k = attr.itemSize; let a = L[0], b = L[0];
  for (let q = 1; q <= count; q++) {
    const i = q < count ? L[q] : -1;
    if (q < count && i - b <= 24) { b = i; continue; } // (a gap of a few vertices costs less sent than another call)
    attr.addUpdateRange(a * k, (b - a + 1) * k);
    a = b = i;
  }
  if (attr.updateRanges.length > 64) { attr.clearUpdateRanges(); attr.whole = true; } // (scattered: one upload is cheaper than many small ones)
}
/** Owed whole until its first upload, and after each upload owed nothing (three.js clears the runs it sent). */
function sentWhole() { this.whole = false; }
/** The whole attribute sent up at the next draw (a full rebuild). */
export function sendWhole(attr) { attr.clearUpdateRanges(); attr.whole = true; attr.needsUpdate = true; }

const _f = new Float64Array(3), _g = new Float64Array(6);
