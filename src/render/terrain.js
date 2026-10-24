// ---------------------------------------------------------------------------------------
// CHUNKED TERRAIN: a height field drawn with its detail where the eye is. The dunes doubled in size, and a single grid fine enough
// for the sand near your feet would be a million triangles to the horizon; a grid coarse enough to draw everywhere would lose the
// crests. So the field is cut into square chunks, each with four levels of detail (every sample, every 2nd, 4th, 8th), and each
// frame the chunks near the camera use the fine one and the far ones the coarse ones. Where two chunks of different detail meet,
// the coarser edge would leave slivers of sky between the triangles; every chunk hangs a SKIRT (a strip of wall down from its
// edge) that fills them.
//
// All the levels share one vertex buffer: a coarse level is only a sparser choice of the same grid points (so the normals are the
// fine field's everywhere, and the shading does not change when a chunk changes its level). The chosen levels are written into one
// index buffer: the whole terrain is one draw call, and the buffer is rebuilt only when the camera has moved far enough to change
// a choice. A chunk's indices are a regular grid, so they are written when chosen, never kept per chunk and level (73 MB in the
// Raceway's park when they were: Dovina, 2026-10-15), and the buffer holds the most any camera draws, not every chunk at full detail.
// Beyond the field, an OUTER ring of coarse grid carries the ground out to the edge of the draw distance.
//
// Prior art: geomipmapping (de Boer, 2000: a chunk grid with per-chunk levels chosen by distance), chunked LOD and skirts (Ulrich,
// 2002: vertical skirts rather than stitching to hide the cracks), and the console practice of the era (a PS2 terrain was a handful
// of patches at two or three densities, with fog doing the rest).
//
//   const t = new ChunkTerrain({ height: (x, z) => y, half: 520, step: 2.5, chunk: 32, outer: 900, outerStep: 20, material })
//   t.mesh              (in the field's local frame: place it)          t.update(camLocalX, camLocalZ)
//   t.heights, t.n      the samples, column-major (x rows), for a physics height field of (t.n - 1) x (t.n - 1) cells over 2 * half
//   t.setRegion(i0, j0, n, hs)   n x n samples rewritten from (i0, j0), drawn and sent to the card (the made track's build lot)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class ChunkTerrain {
  constructor({ height, half, step, chunk = 32, outer = 0, outerStep = 20, material, ranges = [90, 200, 380], skirt = 8 }) {
    this.half = half; this.step = step; this.chunk = chunk; this.ranges = ranges;
    const cells = Math.round((2 * half) / step);
    if (cells % chunk) throw new Error('ChunkTerrain: the field must be a whole number of chunks');
    const N = (this.n = cells + 1), C = (this.chunks = cells / chunk);
    // ---- the samples
    const heights = (this.heights = new Float32Array(N * N));
    const hy = new Float32Array(N * N); // (row-major: j along z, i along x)
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const y = height(-half + i * step, -half + j * step);
      hy[j * N + i] = y; heights[i * N + j] = y;
    }
    // ---- vertices: the grid, then one lowered copy of every chunk-edge point (the skirts' feet), then the outer ring
    const edge = (k) => k % chunk === 0;
    // a chunk-edge point's lowered copy, numbered in row order after the grid: every point of an edge row, C + 1 of any other row
    const skirtAt = (this.skirtAt = (i, j) => { const F = Math.ceil(j / chunk), w = edge(j) ? i : Math.ceil(i / chunk); return N * N + F * N + (j - F) * (C + 1) + w; });
    const nSkirt = (C + 1) * N + (N - C - 1) * (C + 1);
    const oN = outer > half ? Math.round((2 * outer) / outerStep) + 1 : 0;
    const total = N * N + nSkirt + oN * oN;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
    const H = (i, j) => hy[Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const o = (j * N + i) * 3;
      pos[o] = -half + i * step; pos[o + 1] = hy[j * N + i]; pos[o + 2] = -half + j * step;
      const nx = H(i - 1, j) - H(i + 1, j), nz = H(i, j - 1) - H(i, j + 1), ny = 2 * step, l = Math.hypot(nx, ny, nz);
      nor[o] = nx / l; nor[o + 1] = ny / l; nor[o + 2] = nz / l;
      const s = edge(i) || edge(j) ? skirtAt(i, j) : -1;
      if (s >= 0) { pos.set([pos[o], pos[o + 1] - skirt, pos[o + 2]], s * 3); nor.set([nor[o], nor[o + 1], nor[o + 2]], s * 3); }
    }
    // ---- the outer ring: a coarse grid with the field's square left out (its inner edge lies on the field's edge, a little lower)
    const outerIdx = [];
    if (oN) {
      const base = N * N + nSkirt, os = outerStep, oh = (oN - 1) / 2;
      const hAt = (x, z) => (Math.abs(x) <= half && Math.abs(z) <= half ? height(x, z) - 0.4 : height(x, z));
      for (let j = 0; j < oN; j++) for (let i = 0; i < oN; i++) {
        const x = (i - oh) * os, z = (j - oh) * os, o = (base + j * oN + i) * 3;
        pos[o] = x; pos[o + 1] = hAt(x, z); pos[o + 2] = z;
        const e = os * 0.5, nx = hAt(x - e, z) - hAt(x + e, z), nz = hAt(x, z - e) - hAt(x, z + e), l = Math.hypot(nx, 2 * e, nz);
        nor[o] = nx / l; nor[o + 1] = (2 * e) / l; nor[o + 2] = nz / l;
      }
      for (let j = 0; j < oN - 1; j++) for (let i = 0; i < oN - 1; i++) {
        const x0 = (i - oh) * os, z0 = (j - oh) * os;
        if (x0 >= -half && x0 + os <= half && z0 >= -half && z0 + os <= half) continue; // (inside the field)
        const a = base + j * oN + i, b = a + 1, c = a + oN, d = c + 1;
        outerIdx.push(a, c, b, b, c, d);
      }
    }
    this.outerIdx = Uint32Array.from(outerIdx);
    // ---- the chunks: where each stands and its level now (its indices are written by writeChunk when chosen)
    this.lists = [];
    for (let cj = 0; cj < C; cj++) for (let ci = 0; ci < C; ci++) {
      const cx = -half + (ci + 0.5) * chunk * step, cz = -half + (cj + 0.5) * chunk * step;
      this.lists.push({ ci, cj, cx, cz, r: chunk * step * 0.5, lv: -1 });
    }
    const geo = (this.geometry = new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    // the most any camera draws: sampled at every chunk's centre and corner, with a margin (update grows it if ever passed)
    let most = 0;
    for (let sj = 0; sj <= 2 * C; sj++) for (let si = 0; si <= 2 * C; si++) {
      const x = -half + (si / 2) * chunk * step, z = -half + (sj / 2) * chunk * step; let n = 0;
      for (const c of this.lists) n += this.count(this.levelAt(c, x, z));
      most = Math.max(most, n);
    }
    this.index = new THREE.BufferAttribute(new Uint32Array(Math.ceil(most * 1.15) + this.outerIdx.length), 1);
    this.index.setUsage(THREE.DynamicDrawUsage);
    geo.setIndex(this.index);
    const R = Math.max(half, outer) * 1.5;
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R);
    geo.boundingBox = new THREE.Box3(new THREE.Vector3(-R, -50, -R), new THREE.Vector3(R, 400, R));
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.frustumCulled = false;
    this.last = new THREE.Vector2(1e9, 1e9);
    this.triangles = 0;
    this.update(0, 0, true);
  }

  /** The level a chunk takes for a camera at (x, z): 0 the finest, 4 beyond the draw distance (not drawn). */
  levelAt(c, x, z) {
    const [r0, r1, r2] = this.ranges, far = r2 * 1.35, d = Math.max(0, Math.hypot(c.cx - x, c.cz - z) - c.r);
    return d > far ? 4 : d > r2 ? 3 : d > r1 ? 2 : d > r0 ? 1 : 0;
  }
  /** How many indices a chunk writes at a level: its quads and its four skirts' (six a quad). */
  count(lv) { if (lv >= 4) return 0; const k = this.chunk >> lv; return 6 * (k * k + 4 * k); }
  /** A chunk's surface and its four skirts at a level, written into `a` from `n`; returns the new end. */
  writeChunk(c, lv, a, n) {
    const N = this.n, chunk = this.chunk, s = 1 << lv, sk = this.skirtAt;
    const i0 = c.ci * chunk, j0 = c.cj * chunk, i1 = i0 + chunk, j1 = j0 + chunk;
    for (let j = j0; j < j1; j += s) for (let i = i0; i < i1; i += s) {
      const p = j * N + i, b = p + s, q = p + s * N, d = q + s;
      a[n++] = p; a[n++] = q; a[n++] = b; a[n++] = b; a[n++] = q; a[n++] = d;
    }
    // skirts: along each edge, a quad from the edge down to its lowered copy, facing out (west, east, south, north)
    const side = (fi, fj, out) => {
      for (let k = 0; k < chunk; k += s) {
        const ia = fi(k), ja = fj(k), ib = fi(k + s), jb = fj(k + s), p = ja * N + ia, b = jb * N + ib, p2 = sk(ia, ja), b2 = sk(ib, jb);
        if (out) { a[n++] = p; a[n++] = p2; a[n++] = b; a[n++] = b; a[n++] = p2; a[n++] = b2; } else { a[n++] = p; a[n++] = b; a[n++] = p2; a[n++] = b; a[n++] = b2; a[n++] = p2; }
      }
    };
    side(() => i0, (k) => j0 + k, true); side(() => i1, (k) => j0 + k, false);
    side((k) => i0 + k, () => j0, false); side((k) => i0 + k, () => j1, true);
    return n;
  }

  /** Choose the levels for a camera at (x, z) in the field's frame; rewrites the index only when a choice changed. */
  update(x, z, force = false) {
    if (!force && Math.hypot(x - this.last.x, z - this.last.y) < this.step * 3) return false;
    this.last.set(x, z);
    let changed = force, need = this.outerIdx.length;
    for (const c of this.lists) { const lv = this.levelAt(c, x, z); if (lv !== c.lv) { c.lv = lv; changed = true; } need += this.count(lv); }
    if (!changed) return false;
    if (need > this.index.array.length) { // (past the sampled most: a bigger buffer, once)
      this.index = new THREE.BufferAttribute(new Uint32Array(Math.ceil(need * 1.15)), 1); this.index.setUsage(THREE.DynamicDrawUsage); this.geometry.setIndex(this.index);
    }
    const a = this.index.array;
    let n = 0;
    for (const c of this.lists) if (c.lv < 4) n = this.writeChunk(c, c.lv, a, n);
    a.set(this.outerIdx, n); n += this.outerIdx.length;
    this.index.clearUpdateRanges(); this.index.addUpdateRange(0, n); this.index.needsUpdate = true;
    this.geometry.setDrawRange(0, n);
    this.triangles = n / 3;
    return true;
  }

  /** Heights `hs` (n x n, column-major as `heights`: i along x) written from sample (i0, j0): the kept samples, the drawn vertices (a
   *  chunk edge's skirt foot following, as deep as it hung), the normals one sample round, and only those rows sent to the card. The
   *  ranges add to any already pending (the renderer clears them once uploaded), so two writes in one frame both land. (Dovina's made
   *  track writes the build lot through it: world/raceway/madetrack.js.) */
  setRegion(i0, j0, n, hs) {
    const N = this.n, C = this.chunk, H = this.heights, pos = this.geometry.attributes.position, nor = this.geometry.attributes.normal;
    const P = pos.array, Nn = nor.array, sk = this.skirtAt, edge = (I, J) => I % C === 0 || J % C === 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const I = i0 + i, J = j0 + j, y = hs[i * n + j], o = (J * N + I) * 3, was = P[o + 1];
      H[I * N + J] = y; P[o + 1] = y;
      if (edge(I, J)) { const s = sk(I, J) * 3 + 1; P[s] = y - (was - P[s]); }
    }
    const Hc = (I, J) => H[Math.min(N - 1, Math.max(0, I)) * N + Math.min(N - 1, Math.max(0, J))];
    const Ia = Math.max(0, i0 - 1), Ib = Math.min(N - 1, i0 + n), Ja = Math.max(0, j0 - 1), Jb = Math.min(N - 1, j0 + n);
    for (let J = Ja; J <= Jb; J++) for (let I = Ia; I <= Ib; I++) {
      const nx = Hc(I - 1, J) - Hc(I + 1, J), nz = Hc(I, J - 1) - Hc(I, J + 1), ny = 2 * this.step, l = Math.hypot(nx, ny, nz), o = (J * N + I) * 3;
      Nn[o] = nx / l; Nn[o + 1] = ny / l; Nn[o + 2] = nz / l;
      if (edge(I, J)) Nn.set([Nn[o], Nn[o + 1], Nn[o + 2]], sk(I, J) * 3);
    }
    // the skirt feet are numbered in row order: one run from the first chunk edge at or before (Ia, Ja) to the last at or after (Ib, Jb)
    const s0 = sk(Ia - (Ia % C), Ja), s1 = sk(Math.min(N - 1, Ib + ((C - (Ib % C)) % C)), Jb);
    for (const A of [pos, nor]) {
      for (let J = Ja; J <= Jb; J++) A.addUpdateRange((J * N + Ia) * 3, (Ib - Ia + 1) * 3);
      A.addUpdateRange(s0 * 3, (s1 - s0 + 1) * 3); A.needsUpdate = true;
    }
  }
}
