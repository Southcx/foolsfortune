// ---------------------------------------------------------------------------------------
// A MECH PART'S SCULPT: shapes modelled as one signed distance field and meshed whole, so a part is a body with its own concave and
// convex surfaces flowing into each other (a socket cut into a pelvis, a rump swelling out of a thigh's root, a palm's hollow, a
// ribcage's arch over the waist ball), never a stack of primitives (South, 2026-11-02: "something I notice when you draw with code is
// that its often a lot of stacked primitive shapes, and that the geometry doesn't feature pieces with novel multiple concave and
// convex surfaces"). The part library's other shapes (kit.js) stay for hard plates; this is the clay.
//
//   THE FIELD   a function (x, y, z) -> signed distance (negative inside), composed from primitives (`sphere`, `ellipsoid`, `capsule`,
//               `cone` (a capsule with two radii), `box` (rounded), `torus`) by the smooth operators (`blend` k: a smooth union whose
//               fillet is k m wide, `carve` k: a smooth subtraction, `meet` k: a smooth intersection), moved by `at`, `turn`, `mirrorX`,
//               and shaped by `shell` (a skin th thick), `swell` (a bulge where a weight function says) and `grooves` (a panel line cut).
//   THE MESH    the field sampled on a grid of `cell` m over its bounds and meshed by naive surface nets (a vertex a cell where the field
//               crosses, at the mean of its edges' crossings, one quad an edge crossing), relaxed once toward its neighbours' mean, its
//               normals the field's own gradient (so a fillet shades as a fillet); cached by key, so a frame built twice meshes once.
//   THE COLOUR  each vertex's colour from an optional `tone(x, y, z, n)` (the porcelain's light and shade, a groove's dark, a seam).
//
// Prior art: Inigo Quilez's distance functions and smooth minimum (iquilezles.org, "distance functions", "smooth minimum", 2008-2013);
// Media Molecule's Dreams (2020: a whole game's art sculpted from signed distance edits); Gibson's surface nets (1998) and Lysenko's
// naive surface nets (0fps.net, 2012), as godhand/voxels.js and garden/slabmesh.js mesh their clay; ZBrush's DynaMesh (a sculpt
// remeshed whole, so a join is a surface, not a seam).
//
//   sphere(c, r) ellipsoid(c, [rx, ry, rz]) capsule(a, b, r) cone(a, b, ra, rb) box(c, [hx, hy, hz], round) torus(c, R, r, axis)
//   blend(k, ...fs) carve(k, f, ...cuts) meet(k, f, g) at(f, [x, y, z]) turn(f, axis, ang) mirrorX(f) shell(f, th) swell(f, w, amt)
//   grooves(f, planes, w, depth)   mesh(f, bounds, cell, { key, tone, relax }) -> BufferGeometry (position, normal, color)
//   sculptPiece(P, f, bounds, cell, o) (the mesh pushed into a Piece, o its Piece options)   SDF_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The grid (m a cell at a part's default), the relaxation's share, the cache's size. */
export const SDF_LOOK = { cell: 0.045, relax: 0.35, cache: 96, band: 1.6, trueNormals: true };

const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

// ------------------------------------------------------------------ the primitives
export const sphere = ([cx, cy, cz], r) => (x, y, z) => len3(x - cx, y - cy, z - cz) - r;
/** An ellipsoid's distance, bound-corrected (Quilez's): good near its surface, which is all a mesh asks. */
export const ellipsoid = ([cx, cy, cz], [a, b, c]) => (x, y, z) => {
  const px = (x - cx) / a, py = (y - cy) / b, pz = (z - cz) / c, k0 = len3(px, py, pz), k1 = len3(px / a, py / b, pz / c);
  return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(a, b, c);
};
export const capsule = (A, B, r) => cone(A, B, r, r);
/** A capsule tapering from radius ra at a to rb at b (a round cone). */
export function cone([ax, ay, az], [bx, by, bz], ra, rb) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, L2 = dx * dx + dy * dy + dz * dz || 1e-9;
  return (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az, h = clamp01((px * dx + py * dy + pz * dz) / L2);
    return len3(px - dx * h, py - dy * h, pz - dz * h) - (ra + (rb - ra) * h);
  };
}
/** A box of half sizes [hx, hy, hz], its edges rounded by `round`. */
export const box = ([cx, cy, cz], [hx, hy, hz], round = 0) => (x, y, z) => {
  const qx = Math.abs(x - cx) - hx + round, qy = Math.abs(y - cy) - hy + round, qz = Math.abs(z - cz) - hz + round;
  return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - round;
};
/** A torus of ring radius R and tube r round `axis` ('y' default: lying flat). */
export const torus = ([cx, cy, cz], R, r, axis = 'y') => (x, y, z) => {
  const px = x - cx, py = y - cy, pz = z - cz;
  const [u, v, w] = axis === 'x' ? [py, pz, px] : axis === 'z' ? [px, py, pz] : [px, pz, py];
  return len3(Math.sqrt(u * u + v * v) - R, w, 0) - r;
};

// ------------------------------------------------------------------ the operators
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = clamp01(0.5 + (0.5 * (b - a)) / k); return b + (a - b) * h - k * h * (1 - h); };
/** A smooth union: every field joined, each join filleted k m wide. */
export const blend = (k, ...fs) => (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k); return d; };
/** A smooth subtraction: the cuts taken out of f, their edges rounded k m (a socket, a hollow, a groove). */
export const carve = (k, f, ...cuts) => (x, y, z) => { let d = f(x, y, z); for (const c of cuts) d = -smin(-d, c(x, y, z), k); return d; };
/** A smooth intersection: only where both are. */
export const meet = (k, f, g) => (x, y, z) => -smin(-f(x, y, z), -g(x, y, z), k);
export const at = (f, [ox, oy, oz]) => (x, y, z) => f(x - ox, y - oy, z - oz);
/** A field turned by `ang` rad round 'x', 'y' or 'z'. */
export const turn = (f, axis, ang) => {
  const c = Math.cos(-ang), s = Math.sin(-ang);
  if (axis === 'x') return (x, y, z) => f(x, y * c - z * s, y * s + z * c);
  if (axis === 'y') return (x, y, z) => f(x * c + z * s, y, -x * s + z * c);
  return (x, y, z) => f(x * c - y * s, x * s + y * c, z);
};
/** The field's +X half mirrored onto -X (a frame's left made its right). */
export const mirrorX = (f) => (x, y, z) => f(Math.abs(x), y, z);
/** A skin of the field th thick (a cup, a plate with a back to it). */
export const shell = (f, th) => (x, y, z) => Math.abs(f(x, y, z) + th / 2) - th / 2;
/** The field pushed out by amt where w(x, y, z) (0..1) says: a muscle's swell, a cheek. */
export const swell = (f, w, amt) => (x, y, z) => f(x, y, z) - amt * w(x, y, z);
/** Panel lines: each plane [nx, ny, nz, d] (unit normal, offset) cut as a groove `w` m wide and `depth` deep into f's surface. */
export const grooves = (f, planes, w = 0.02, depth = 0.025) => (x, y, z) => {
  let d = f(x, y, z);
  for (const [nx, ny, nz, o] of planes) { const cut = Math.max(Math.abs(nx * x + ny * y + nz * z - o) - w, -d - depth); d = Math.max(d, -cut); }
  return d;
};

// ------------------------------------------------------------------ the mesh
const CACHE = new Map();
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
/** The field meshed by naive surface nets over bounds [[x0, y0, z0], [x1, y1, z1]] at `cell` m: a BufferGeometry with position, normal
 *  (the field's gradient) and color (white, or `tone(x, y, z, nx, ny, nz)` -> hex or [r, g, b]); cached by `key` when given. */
export function mesh(f, [[x0, y0, z0], [x1, y1, z1]], cell = SDF_LOOK.cell, { key = null, tone = null, relax = SDF_LOOK.relax } = {}) {
  if (key && CACHE.has(key)) return CACHE.get(key);
  const pad = cell * 1.5; x0 -= pad; y0 -= pad; z0 -= pad; x1 += pad; y1 += pad; z1 += pad;
  const nx = Math.max(2, Math.ceil((x1 - x0) / cell) + 1), ny = Math.max(2, Math.ceil((y1 - y0) / cell) + 1), nz = Math.max(2, Math.ceil((z1 - z0) / cell) + 1);
  const V = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k);
  // the narrow band: the field asked once a block of B cells at its centre; a block the surface cannot reach (its distance past the
  // block's half diagonal, with a margin for the smooth operators' loose bounds) is filled with that one value, only the rest sampled
  const B = 4, hb = (B * cell) / 2, reach = SDF_LOOK.band > 0 ? (hb * 1.732 + cell) * SDF_LOOK.band : Infinity;
  for (let bk = 0; bk < nz; bk += B) for (let bj = 0; bj < ny; bj += B) for (let bi = 0; bi < nx; bi += B) {
    const ek = Math.min(nz, bk + B), ej = Math.min(ny, bj + B), ei = Math.min(nx, bi + B);
    const d = f(x0 + (bi + hb / cell) * cell, y0 + (bj + hb / cell) * cell, z0 + (bk + hb / cell) * cell);
    if (Math.abs(d) > reach) { for (let k = bk; k < ek; k++) for (let j = bj; j < ej; j++) for (let i = bi; i < ei; i++) V[I(i, j, k)] = d; continue; }
    for (let k = bk; k < ek; k++) for (let j = bj; j < ej; j++) for (let i = bi; i < ei; i++) V[I(i, j, k)] = f(x0 + i * cell, y0 + j * cell, z0 + k * cell);
  }
  // a vertex a cell the surface crosses, at the mean of its edges' crossings
  const vid = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), C = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [], cor = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let m = 0;
    for (let c = 0; c < 8; c++) { const v = V[I(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; cor[c] = v; if (v < 0) m |= 1 << c; }
    if (m === 0 || m === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      const va = cor[a], vb = cor[b]; if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; n++;
    }
    vid[C(i, j, k)] = pos.length / 3; pos.push(x0 + (i + sx / n) * cell, y0 + (j + sy / n) * cell, z0 + (k + sz / n) * cell);
  }
  // a quad for each grid edge the surface crosses, between the four cells round it, wound by which way the field rises
  const quads = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) quads.push(a, b, c, d); else quads.push(a, d, c, b); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = V[I(i, j, k)], b = V[I(i + 1, j, k)]; if ((a < 0) === (b < 0)) continue;
    quad(vid[C(i, j - 1, k - 1)], vid[C(i, j, k - 1)], vid[C(i, j, k)], vid[C(i, j - 1, k)], a < 0);
  }
  for (let k = 1; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const a = V[I(i, j, k)], b = V[I(i, j + 1, k)]; if ((a < 0) === (b < 0)) continue;
    quad(vid[C(i - 1, j, k - 1)], vid[C(i - 1, j, k)], vid[C(i, j, k)], vid[C(i, j, k - 1)], a < 0);
  }
  for (let k = 0; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const a = V[I(i, j, k)], b = V[I(i, j, k + 1)]; if ((a < 0) === (b < 0)) continue;
    quad(vid[C(i - 1, j - 1, k)], vid[C(i, j - 1, k)], vid[C(i, j, k)], vid[C(i - 1, j, k)], a < 0);
  }
  // relaxed once toward the neighbours' mean, then pulled back onto the surface along the gradient (a smoother skin, no shrinking)
  // the field read back off the grid (trilinear), its gradient by differences of that: no call to f per vertex (a big field's cost)
  const G = (x, y, z) => {
    let u = (x - x0) / cell, v = (y - y0) / cell, w = (z - z0) / cell;
    u = Math.min(nx - 1.001, Math.max(0, u)); v = Math.min(ny - 1.001, Math.max(0, v)); w = Math.min(nz - 1.001, Math.max(0, w));
    const i = u | 0, j = v | 0, k = w | 0, a = u - i, b = v - j, c = w - k, o = I(i, j, k), sx = 1, sy = nx, sz = nx * ny;
    const l00 = V[o] + (V[o + sx] - V[o]) * a, l10 = V[o + sy] + (V[o + sy + sx] - V[o + sy]) * a, l01 = V[o + sz] + (V[o + sz + sx] - V[o + sz]) * a, l11 = V[o + sz + sy] + (V[o + sz + sy + sx] - V[o + sz + sy]) * a;
    const m0 = l00 + (l10 - l00) * b, m1 = l01 + (l11 - l01) * b; return m0 + (m1 - m0) * c;
  };
  const nv = pos.length / 3, grad = (x, y, z, out) => { const e = cell * 0.5; out[0] = G(x + e, y, z) - G(x - e, y, z); out[1] = G(x, y + e, z) - G(x, y - e, z); out[2] = G(x, y, z + e) - G(x, y, z - e); const l = len3(out[0], out[1], out[2]) || 1; out[0] /= l; out[1] /= l; out[2] /= l; return out; };
  // the shading's normals off the field itself (Quilez's tetrahedral gradient: four calls), so a sculpt shades smooth, not as the grid's facets
  const gradF = (x, y, z, out) => {
    const e = cell * 0.3, a = f(x + e, y - e, z - e), b = f(x - e, y - e, z + e), c = f(x - e, y + e, z - e), d = f(x + e, y + e, z + e);
    out[0] = a - b - c + d; out[1] = -a - b + c + d; out[2] = -a + b - c + d; const l = len3(out[0], out[1], out[2]) || 1; out[0] /= l; out[1] /= l; out[2] /= l; return out;
  };
  const g = [0, 0, 0];
  if (relax > 0) {
    const acc = new Float32Array(nv * 3), cnt = new Uint16Array(nv);
    for (let q = 0; q < quads.length; q += 4) for (let e = 0; e < 4; e++) { const a = quads[q + e], b = quads[q + ((e + 1) & 3)]; for (let c = 0; c < 3; c++) { acc[a * 3 + c] += pos[b * 3 + c]; acc[b * 3 + c] += pos[a * 3 + c]; } cnt[a]++; cnt[b]++; }
    for (let v = 0; v < nv; v++) {
      if (!cnt[v]) continue;
      for (let c = 0; c < 3; c++) pos[v * 3 + c] += relax * (acc[v * 3 + c] / cnt[v] - pos[v * 3 + c]);
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], d = G(x, y, z); grad(x, y, z, g);
      pos[v * 3] -= g[0] * d; pos[v * 3 + 1] -= g[1] * d; pos[v * 3 + 2] -= g[2] * d;
    }
  }
  // triangles, normals from the field, colours from the tone
  const P = new Float32Array((quads.length / 4) * 18), N = new Float32Array(P.length), K = new Float32Array(P.length), col = new THREE.Color();
  const vn = new Float32Array(nv * 3), vc = new Float32Array(nv * 3);
  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2]; (SDF_LOOK.trueNormals ? gradF : grad)(x, y, z, g); vn.set(g, v * 3);
    const t = tone ? tone(x, y, z, g[0], g[1], g[2]) : 0xffffff;
    if (Array.isArray(t)) vc.set(t, v * 3); else { col.set(t); vc[v * 3] = col.r; vc[v * 3 + 1] = col.g; vc[v * 3 + 2] = col.b; }
  }
  let o = 0;
  for (let q = 0; q < quads.length; q += 4) for (const e of [0, 1, 2, 0, 2, 3]) {
    const v = quads[q + e]; for (let c = 0; c < 3; c++) { P[o + c] = pos[v * 3 + c]; N[o + c] = vn[v * 3 + c]; K[o + c] = vc[v * 3 + c]; } o += 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.BufferAttribute(K, 3));
  geo.computeBoundingSphere();
  if (key) { if (CACHE.size >= SDF_LOOK.cache) CACHE.delete(CACHE.keys().next().value); CACHE.set(key, geo); }
  return geo;
}

/** The field meshed and pushed into a Piece with its own per-vertex colours (o: the Piece's at / rot / sc; `c` overrides the tone). */
export function sculptPiece(P, f, bounds, cell, o = {}) {
  const g = mesh(f, bounds, cell, o);
  const before = P.col.length; P.geo(g, { at: o.at, rot: o.rot, sc: o.sc, c: o.c ?? 0xffffff, t: o.t, m: o.m });
  if (o.c == null) { const K = g.attributes.color.array; for (let i = 0; i < K.length; i++) P.col[before + i] = K[i]; }
  return g;
}
