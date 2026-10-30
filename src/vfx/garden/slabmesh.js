// ---------------------------------------------------------------------------------------
// A SPIRIT SLAB'S MESH (docs/plans/SEEDS-SLABS-SCANS.md 2; Dovina's kernel progress/slabs.js, Petra's bench world/garden/bench.js; Calissa's
// concept sheet of six slabs, 2026-10-30): the kernel's cells drawn as carved stone, never a pile of cubes. Voxel truth is kept (a cell
// cleared is gone, a cell struck and not cleared is pared back and paler) and what is left is smoothed. Pure geometry: the look that
// draws it is vfx/garden/slablook.js, the program the matter look's (vfx/godhand/matterlook.js, roles 'slab' and 'toll').
//
//   THE STONE      the stone cells' field (a cell's density its hp over its stratum's, so a struck cell shrinks a little; a cleared one 0;
//                  the fossil's cells 0, a bed it lies in), padded with air, sampled twice a cell by trilinear interpolation and meshed
//                  by surface nets (a vertex a cell where the field crosses, at the mean of its edges' crossings: godhand/voxels.js's
//                  way), so carved edges come out chamfered and a pit rounded. Then its edges and corners are chipped inward by a noise
//                  fixed in the slab's own space (so a re-mesh after a blow never moves what the blow did not touch) and its faces get a
//                  faint wobble. Each vertex takes the colour of the stratum of the solid cell it belongs to (Anagami's clay over sand over
//                  sandstone, two laminae each), paler where struck, a fresher pale where the dig has opened the stone. Class 0 (stone).
//   THE FOSSIL     the bone cells as Lachrymite crystal: a hexagonal bipyramid a cell, laid along its bones, joined to its neighbours by
//                  hexagonal prisms along the tree that spans them (Kruskal's: a skeleton, never a web); faceted. A cracked cell carries
//                  its crack (`aMl.z` 0.6, drawn by the look's cell net); a broken one is three dark shards, its prisms snapped short.
//                  Class 1 (Lachrymite).
//   THE FOOTPRINT  the fossil seen from above, blurred into a small texture: the silhouette's outline (the matter look's `mlGhostMap`).
//
// Prior art: Gibson's surface nets (1998) and Lysenko's naive surface nets (0fps.net, 2012), as godhand/voxels.js meshes the hand's clay;
// Kruskal's minimum spanning tree (1956) for the bones; Spectrobes: Origins' and Fossil Fighters' cleaning rocks (a block of strata, a
// fossil in it that shows a little at a time); Calissa's concept sheet (the strata slab: a hewn block, its edges knocked round, its pit
// paler, its fossil a crystal); the opalised fossils of Coober Pedy (bone turned to a gem with a play of colour).
//
//   slabGeometry(S, orig, { cell, top, seed }) -> { stone, bone }   BufferGeometry in the bench's frame (metres x SLAB_MESH.grain)
//   footprint(S, orig, tex?) -> DataTexture (the fossil from above, 0..1)   ghostBox(S, cell) -> [x0, z0, 1/w, 1/d] (the map's box)
//   SLAB_MESH   STRATA_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** `res` samples a cell; `grain` units a metre the geometry is built in (the mesh scaled back by its inverse, so the matter look's
 *  atlas, a tile a unit, has a tile every 25 cm and its grit is a slab's, not a wall's); `chip` cells an edge is knocked in at most,
 *  `edge` the edginess over which it starts (0 a face, 0.29 a 45-degree edge, 0.42 a corner), `wobble` cells a face moves. */
export const SLAB_MESH = { res: 2, grain: 4, chip: 0.26, edge: [0.06, 0.26], wobble: 0.05, shrink: 0.38, footPx: 4 };

/** The strata by hp from the top (the kernel's STRATA: loose, firm, hard), each two laminae; dust where struck, fresh where opened; the
 *  fossil by its integrity (broken, cracked, whole). Anagami's: clay over sand over sandstone (progress/slabs.js). */
export const STRATA_LOOK = {
  1: [0xb0653f, 0xc47c52], 2: [0xdcbf86, 0xcaa872], 3: [0x8e5034, 0x7a4430],
  dust: 0xf0dcc0, fresh: 0xf3e2c4, worn: 0.42, rough: [0.88, 0.95, 0.2],
  bone: [0x1e1828, 0x4a3a7c, 0x7a64c4], crack: [1, 0.6, 0],
};

const hash3 = (x, y, z, s) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1103515245) ^ Math.imul(s | 0, 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const sm = (t) => t * t * (3 - 2 * t);
/** Value noise in 3D, 0..1, fixed in space by its seed. */
function noise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = sm(x - xi), fy = sm(y - yi), fz = sm(z - zi);
  const L = (a, b, t) => a + (b - a) * t, c = (i, j, k) => hash3(xi + i, yi + j, zi + k, s);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), fx), L(c(0, 1, 0), c(1, 1, 0), fx), fy), L(L(c(0, 0, 1), c(1, 0, 1), fx), L(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
}
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _c = new THREE.Color(), _d = new THREE.Color();

/** The slab's two geometries: its stone and its fossil, in the bench's frame (x right, y up from the table, z north), times `grain`. */
export function slabGeometry(S, orig, { cell = 0.05, top = 0.55, seed = 1 } = {}) {
  const K = SLAB_MESH.grain, toLocal = (gx, gy, gz, out) => { out[0] = (gx - S.w / 2) * cell * K; out[1] = (top + (S.h - gy) * cell) * K; out[2] = (gz - S.d / 2) * cell * K; return out; };
  return { stone: stoneGeometry(S, orig, toLocal, seed), bone: boneGeometry(S, orig, toLocal, seed) };
}

// ------------------------------------------------------------------ the stone
function stoneGeometry(S, orig, toLocal, seed) {
  const { w, h, d } = S, W = w + 2, H = h + 2, D = d + 2, R = SLAB_MESH.res;
  const Ci = (x, y, z) => x + w * (y + h * z);
  // the coarse field, padded with air: a stone cell's density its hp over its stratum's (pared back when struck), the fossil's cells and cleared ones air
  const coarse = new Float32Array(W * H * D), at = (X, Y, Z) => X + W * (Y + H * Z);
  for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = Ci(x, y, z), v = S.cells[i];
    if (v > 0) coarse[at(x + 1, y + 1, z + 1)] = 1 - SLAB_MESH.shrink * (1 - v / Math.max(1, orig[i]));
  }
  // sampled R times a cell (trilinear between the coarse centres)
  const nx = W * R, ny = H * R, nz = D * R, axis = (n, N) => { const k = new Int32Array(n), f = new Float32Array(n); for (let i = 0; i < n; i++) { const X = (i + 0.5) / R - 0.5; let k0 = Math.floor(X), t = X - k0; if (k0 < 0) { k0 = 0; t = 0; } if (k0 > N - 2) { k0 = N - 2; t = 1; } k[i] = k0; f[i] = t; } return { k, f }; };
  const ax = axis(nx, W), ay = axis(ny, H), az = axis(nz, D), field = new Float32Array(nx * ny * nz), F = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x0 = ax.k[i], y0 = ay.k[j], z0 = az.k[k], fx = ax.f[i], fy = ay.f[j], fz = az.f[k];
    const c = (a, b, e) => coarse[at(x0 + a, y0 + b, z0 + e)];
    const v = ((c(0, 0, 0) * (1 - fx) + c(1, 0, 0) * fx) * (1 - fy) + (c(0, 1, 0) * (1 - fx) + c(1, 1, 0) * fx) * fy) * (1 - fz)
      + ((c(0, 0, 1) * (1 - fx) + c(1, 0, 1) * fx) * (1 - fy) + (c(0, 1, 1) * (1 - fx) + c(1, 1, 1) * fx) * fy) * fz;
    field[F(i, j, k)] = v;
  }
  // surface nets: a vertex in each cell the surface crosses, at the mean of its edges' crossings (in fine index units)
  const ISO = 0.5, cx = nx - 1, cy = ny - 1, cz = nz - 1, vid = new Int32Array(cx * cy * cz).fill(-1), V = [];
  const CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const g = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let m = 0; for (let q = 0; q < 8; q++) { g[q] = field[F(i + CO[q][0], j + CO[q][1], k + CO[q][2])]; if (g[q] >= ISO) m |= 1 << q; }
    if (m === 0 || m === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of ED) {
      if ((g[a] >= ISO) === (g[b] >= ISO)) continue;
      const t = (ISO - g[a]) / (g[b] - g[a]);
      sx += CO[a][0] + (CO[b][0] - CO[a][0]) * t; sy += CO[a][1] + (CO[b][1] - CO[a][1]) * t; sz += CO[a][2] + (CO[b][2] - CO[a][2]) * t; n++;
    }
    vid[i + cx * (j + cy * k)] = V.length / 3; V.push(i + sx / n, j + sy / n, k + sz / n);
  }
  // a quad for each sample edge the surface crosses, joining the four cells round it; `out` the way out of the stone along the edge
  const tris = [], outs = [], dims = [nx, ny, nz], cdims = [cx, cy, cz];
  const C = (p) => (p[0] < 0 || p[1] < 0 || p[2] < 0 || p[0] >= cx || p[1] >= cy || p[2] >= cz ? -1 : vid[p[0] + cx * (p[1] + cy * p[2])]);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const p = [i, j, k], v0 = field[F(i, j, k)] >= ISO;
    for (let a = 0; a < 3; a++) {
      if (p[a] + 1 >= dims[a]) continue;
      const q = p.slice(); q[a]++;
      if ((field[F(q[0], q[1], q[2])] >= ISO) === v0) continue;
      const b = (a + 1) % 3, c = (a + 2) % 3; if (p[b] < 1 || p[c] < 1 || p[b] > cdims[b] - 1 || p[c] > cdims[c] - 1) continue;
      const q0 = p.slice(), q1 = p.slice(), q3 = p.slice(); q0[b]--; q0[c]--; q1[c]--; q3[b]--;
      const A = C(q0), B = C(q1), Cc = C(p), Dd = C(q3); if (A < 0 || B < 0 || Cc < 0 || Dd < 0) continue;
      const o = [0, 0, 0]; o[a] = v0 ? 1 : -1;
      tris.push(A, B, Cc, A, Cc, Dd); outs.push(o, o);
    }
  }
  // in slab grid units (x right, y DOWN from the top, z north), then each vertex's stratum from the solid cell it belongs to
  const nv = V.length / 3, G = new Float32Array(nv * 3);
  for (let v = 0; v < nv; v++) for (let a = 0; a < 3; a++) G[v * 3 + a] = (V[v * 3 + a] + 0.5) / R - 1;
  // provisional normals (area-weighted, oriented outward in grid space), for the chips
  const N = new Float32Array(nv * 3), tri = (t) => [tris[t * 3], tris[t * 3 + 1], tris[t * 3 + 2]];
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t < tris.length / 3; t++) {
    let [a, b, c] = tri(t);
    e1.set(G[b * 3] - G[a * 3], G[b * 3 + 1] - G[a * 3 + 1], G[b * 3 + 2] - G[a * 3 + 2]); e2.set(G[c * 3] - G[a * 3], G[c * 3 + 1] - G[a * 3 + 1], G[c * 3 + 2] - G[a * 3 + 2]);
    fn.crossVectors(e1, e2); const o = outs[t];
    if (fn.x * o[0] + fn.y * o[1] + fn.z * o[2] < 0) { tris[t * 3 + 1] = c; tris[t * 3 + 2] = b; fn.negate(); [b, c] = [c, b]; }
    for (const v of [a, b, c]) { N[v * 3] += fn.x; N[v * 3 + 1] += fn.y; N[v * 3 + 2] += fn.z; }
  }
  // the chips and the wobble (in cells, inward along the normal), fixed in the slab's space by the seed
  const L = STRATA_LOOK, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 4), ml = new Float32Array(nv * 4), o3 = [0, 0, 0];
  for (let v = 0; v < nv; v++) {
    let x = G[v * 3], y = G[v * 3 + 1], z = G[v * 3 + 2]; const l = Math.hypot(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]) || 1;
    const n0 = N[v * 3] / l, n1 = N[v * 3 + 1] / l, n2 = N[v * 3 + 2] / l, edgy = 1 - Math.max(Math.abs(n0), Math.abs(n1), Math.abs(n2));
    const chip = SLAB_MESH.chip * smoothstep(SLAB_MESH.edge[0], SLAB_MESH.edge[1], edgy) * Math.pow(noise3(x * 1.7, y * 1.7, z * 1.7, seed), 1.4);
    const dv = chip + SLAB_MESH.wobble * (noise3(x * 3.1 + 7, y * 3.1, z * 3.1, seed + 1) - 0.5);
    x -= n0 * dv; y -= n1 * dv; z -= n2 * dv;
    toLocal(x, y, z, o3); pos[v * 3] = o3[0]; pos[v * 3 + 1] = o3[1]; pos[v * 3 + 2] = o3[2];
    // its stratum: the solid coarse cell nearest it with the most stone; struck (worn) and opened (fresh) from the cells round it
    const gx = G[v * 3], gy = G[v * 3 + 1], gz = G[v * 3 + 2];
    let best = -1, bw = -1, open = 0;
    for (let a = -1; a <= 0; a++) for (let b = -1; b <= 0; b++) for (let c = -1; c <= 0; c++) {
      const X = Math.floor(gx + 0.5) + a, Y = Math.floor(gy + 0.5) + b, Z = Math.floor(gz + 0.5) + c;
      if (X < 0 || Y < 0 || Z < 0 || X >= w || Y >= h || Z >= d) continue;
      const i = Ci(X, Y, Z);
      if (orig[i] > 0 && S.cells[i] === 0) open = 1;
      if (S.cells[i] <= 0) continue;
      const wt = (1 - Math.abs(gx - X - 0.5)) * (1 - Math.abs(gy - Y - 0.5)) * (1 - Math.abs(gz - Z - 0.5)) * S.cells[i];
      if (wt > bw) { bw = wt; best = i; }
    }
    const hp = best >= 0 ? orig[best] : 1, worn = best >= 0 ? 1 - S.cells[best] / Math.max(1, orig[best]) : 0;
    const lam = Math.floor(gy * 2 + (noise3(gx * 0.6, 3, gz * 0.6, seed + 2) - 0.5) * 1.2) & 1, pair = L[hp] || L[3];
    _c.setHex(pair[lam]);
    _c.multiplyScalar(0.92 + 0.16 * noise3(gx * 0.8, gy * 0.8, gz * 0.8, seed + 3));
    if (worn > 0) _c.lerp(_d.setHex(L.dust), L.worn * worn);
    if (open) _c.lerp(_d.setHex(L.fresh), 0.22);
    col[v * 4] = _c.r; col[v * 4 + 1] = _c.g; col[v * 4 + 2] = _c.b; col[v * 4 + 3] = 1;
    ml[v * 4] = 0; ml[v * 4 + 1] = open ? L.rough[1] : L.rough[0]; ml[v * 4 + 2] = 0; ml[v * 4 + 3] = 0;
  }
  // the grid's y runs down: in the bench's frame the winding is mirrored, so each triangle turns over
  for (let t = 0; t < tris.length; t += 3) { const b = tris[t + 1]; tris[t + 1] = tris[t + 2]; tris[t + 2] = b; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); geo.setAttribute('aMl', new THREE.BufferAttribute(ml, 4));
  geo.setIndex(tris); geo.computeVertexNormals(); geo.computeBoundingSphere();
  return geo;
}

// ------------------------------------------------------------------ the fossil
/** The bone cells, and the tree that spans them (Kruskal's, by distance, neighbours only): [{ i, x, y, z }], [[a, b]]. */
export function bonesOf(S, orig) {
  const cells = [];
  for (let z = 0; z < S.d; z++) for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) { const i = x + S.w * (y + S.h * z); if (orig[i] < 0) cells.push({ i, x, y, z }); }
  const edges = [];
  for (let a = 0; a < cells.length; a++) for (let b = a + 1; b < cells.length; b++) {
    const A = cells[a], B = cells[b], dx = Math.abs(A.x - B.x), dy = Math.abs(A.y - B.y), dz = Math.abs(A.z - B.z);
    if (dx <= 1 && dy <= 1 && dz <= 1) edges.push([dx * dx + dy * dy + dz * dz, a, b]);
  }
  edges.sort((p, q) => p[0] - q[0]);
  const up = cells.map((_, k) => k), root = (k) => (up[k] === k ? k : (up[k] = root(up[k]))), tree = [];
  for (const [, a, b] of edges) { const ra = root(a), rb = root(b); if (ra !== rb) { up[ra] = rb; tree.push([a, b]); } }
  return { cells, tree };
}

function boneGeometry(S, orig, toLocal, seed) {
  const { cells, tree } = bonesOf(S, orig), L = STRATA_LOOK, pos = [], col = [], ml = [];
  const state = (c) => Math.max(0, Math.min(2, S.bone[c.i])), o = [0, 0, 0], T = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], core = new THREE.Vector3();
  const loc = (p, out) => { toLocal(p.x, p.y, p.z, o); return out.set(o[0], o[1], o[2]); };
  const put = (p, st) => { pos.push(p.x, p.y, p.z); _c.setHex(L.bone[st]); col.push(_c.r, _c.g, _c.b, 1); ml.push(0, L.rough[2], L.crack[st], 1); };
  /** One facet, in the bench's frame, turned to face away from `c` (the point it wraps: the frame mirrors the grid, so it is found here). */
  const tri = (a, b, c, st, around) => {
    loc(a, T[0]); loc(b, T[1]); loc(c, T[2]); loc(around, core);
    e1.subVectors(T[1], T[0]); e2.subVectors(T[2], T[0]); fn.crossVectors(e1, e2);
    const out = e1.copy(T[0]).add(T[1]).add(T[2]).multiplyScalar(1 / 3).sub(core);
    if (fn.dot(out) < 0) { put(T[0], st); put(T[2], st); put(T[1], st); } else { put(T[0], st); put(T[1], st); put(T[2], st); }
  };
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  const centre = (c) => new THREE.Vector3(c.x + 0.5, c.y + 0.5, c.z + 0.5);
  const frame = (ax) => { const a = new THREE.Vector3(Math.abs(ax.y) < 0.9 ? 0 : 1, Math.abs(ax.y) < 0.9 ? 1 : 0, 0).cross(ax).normalize(); return [a, new THREE.Vector3().crossVectors(ax, a)]; };
  /** A hexagonal prism from p to q (radius r, its ends tapering by `taper`), its sides only (its ends sit inside a node). */
  const prism = (p, q, r, st, taper = 0.8) => {
    const ax = q.clone().sub(p), len = ax.length(); if (len < 1e-4) return; ax.normalize(); const [u, v] = frame(ax);
    const ring = (c, rr) => Array.from({ length: 6 }, (_, k) => c.clone().addScaledVector(u, Math.cos(k * Math.PI / 3) * rr).addScaledVector(v, Math.sin(k * Math.PI / 3) * rr));
    const A = ring(p, r * taper), B = ring(q, r * taper), M = ring(p.clone().lerp(q, 0.5), r), lo = p.clone().lerp(q, 0.25), hi = p.clone().lerp(q, 0.75);
    for (let k = 0; k < 6; k++) { const n = (k + 1) % 6; tri(A[k], M[k], M[n], st, lo); tri(A[k], M[n], A[n], st, lo); tri(M[k], B[k], B[n], st, hi); tri(M[k], B[n], M[n], st, hi); }
  };
  /** A hexagonal bipyramid round c along ax (a crystal), twisted by its seed. */
  const node = (c, ax, r, hl, st, tw) => {
    const [u, v] = frame(ax), ring = Array.from({ length: 6 }, (_, k) => c.clone().addScaledVector(u, Math.cos(tw + k * Math.PI / 3) * r).addScaledVector(v, Math.sin(tw + k * Math.PI / 3) * r));
    const t0 = c.clone().addScaledVector(ax, hl), t1 = c.clone().addScaledVector(ax, -hl);
    for (let k = 0; k < 6; k++) { const n = (k + 1) % 6; tri(t0, ring[k], ring[n], st, c); tri(t1, ring[n], ring[k], st, c); }
  };
  const nbr = cells.map(() => []); for (const [a, b] of tree) { nbr[a].push(b); nbr[b].push(a); }
  cells.forEach((c, k) => {
    const p = centre(c), st = state(c), h = hash3(c.x, c.y, c.z, seed + 9);
    const ax = new THREE.Vector3(); for (const j of nbr[k]) { const dv = centre(cells[j]).sub(p); if (ax.lengthSq() && dv.dot(ax) < 0) dv.negate(); ax.add(dv); }
    if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize();
    if (st > 0) node(p, ax, 0.3 + 0.06 * h, 0.44 + (nbr[k].length === 1 ? 0.08 : 0), st, h * 6.28);
    else for (let s = 0; s < 3; s++) { // (broken: three dark shards where it was)
      const q = p.clone().add(new THREE.Vector3(hash3(c.x, s, c.z, seed) - 0.5, hash3(s, c.y, c.z, seed) - 0.5, hash3(c.x, c.y, s, seed) - 0.5).multiplyScalar(0.42));
      node(q, new THREE.Vector3(hash3(s, 1, c.x, seed) - 0.5, 1, hash3(s, 2, c.z, seed) - 0.5).normalize(), 0.1, 0.17, 0, s * 2.1);
    }
  });
  for (const [a, b] of tree) {
    const A = cells[a], B = cells[b], sa = state(A), sb = state(B), pa = centre(A), pb = centre(B);
    if (sa > 0 && sb > 0) prism(pa, pb, 0.17, Math.min(sa, sb));
    else if (sa > 0 || sb > 0) { const [p, q, s] = sa > 0 ? [pa, pb, sa] : [pb, pa, sb]; prism(p, p.clone().lerp(q, 0.38), 0.17, Math.min(s, 1), 0.5); } // (snapped short at the broken end)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); geo.setAttribute('aMl', new THREE.Float32BufferAttribute(ml, 4));
  geo.computeVertexNormals(); geo.computeBoundingSphere(); // (not indexed: each facet its own normal, a crystal's)
  return geo;
}

// ------------------------------------------------------------------ the silhouette's footprint
/** The fossil from above (its tree in x and z), blurred: 1 on a bone, 0.45 about half a cell out (the outline the look draws). */
export function footprint(S, orig, tex = null) {
  const P = SLAB_MESH.footPx, W = S.w * P, D = S.d * P, { cells, tree } = bonesOf(S, orig), data = new Uint8Array(W * D * 4);
  const segs = tree.map(([a, b]) => [cells[a].x + 0.5, cells[a].z + 0.5, cells[b].x + 0.5, cells[b].z + 0.5]).concat(cells.map((c) => [c.x + 0.5, c.z + 0.5, c.x + 0.5, c.z + 0.5]));
  for (let v = 0; v < D; v++) for (let u = 0; u < W; u++) {
    const x = (u + 0.5) / P, z = (v + 0.5) / P; let best = 9;
    for (const [ax, az, bx, bz] of segs) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0; best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); }
    const k = Math.max(0, Math.min(1, 1 - best / 0.95)), o = (v * W + u) * 4;
    data[o] = data[o + 1] = data[o + 2] = Math.round(k * 255); data[o + 3] = 255;
  }
  if (tex && tex.image.width === W && tex.image.height === D) { tex.image.data.set(data); tex.needsUpdate = true; return tex; }
  const t = new THREE.DataTexture(data, W, D); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; t.name = 'slab-footprint';
  return t;
}
/** The footprint's box in the stone's own space (matterlook.js `mlGhostBox`: x0, z0, then 1 over the width and the depth). */
export const ghostBox = (S, cell = 0.05) => { const K = SLAB_MESH.grain, X = S.w * cell * K, Z = S.d * cell * K; return [-X / 2, -Z / 2, 1 / X, 1 / Z]; };
