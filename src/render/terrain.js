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
// a choice. Beyond the field, an OUTER ring of coarse grid carries the ground out to the edge of the draw distance.
//
// Prior art: geomipmapping (de Boer, 2000: a chunk grid with per-chunk levels chosen by distance), chunked LOD and skirts (Ulrich,
// 2002: vertical skirts rather than stitching to hide the cracks), and the console practice of the era (a PS2 terrain was a handful
// of patches at two or three densities, with fog doing the rest).
//
//   const t = new ChunkTerrain({ height: (x, z) => y, half: 520, step: 2.5, chunk: 32, outer: 900, outerStep: 20, material })
//   t.mesh              (in the field's local frame: place it)          t.update(camLocalX, camLocalZ)
//   t.heights, t.n      the samples, column-major (x rows), for a physics height field of (t.n - 1) x (t.n - 1) cells over 2 * half
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
    const skirtIdx = new Int32Array(N * N).fill(-1);
    let nSkirt = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (edge(i) || edge(j)) skirtIdx[j * N + i] = N * N + nSkirt++;
    const oN = outer > half ? Math.round((2 * outer) / outerStep) + 1 : 0;
    const total = N * N + nSkirt + oN * oN;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
    const H = (i, j) => hy[Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const o = (j * N + i) * 3;
      pos[o] = -half + i * step; pos[o + 1] = hy[j * N + i]; pos[o + 2] = -half + j * step;
      const nx = H(i - 1, j) - H(i + 1, j), nz = H(i, j - 1) - H(i, j + 1), ny = 2 * step, l = Math.hypot(nx, ny, nz);
      nor[o] = nx / l; nor[o + 1] = ny / l; nor[o + 2] = nz / l;
      const s = skirtIdx[j * N + i];
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
    // ---- the index lists: per chunk, per level, the surface and its four skirts
    this.lists = [];
    for (let cj = 0; cj < C; cj++) for (let ci = 0; ci < C; ci++) {
      const levels = [];
      for (let lv = 0; lv < 4; lv++) {
        const s = 1 << lv, idx = [];
        const i0 = ci * chunk, j0 = cj * chunk, i1 = i0 + chunk, j1 = j0 + chunk;
        for (let j = j0; j < j1; j += s) for (let i = i0; i < i1; i += s) {
          const a = j * N + i, b = a + s, c = a + s * N, d = c + s;
          idx.push(a, c, b, b, c, d);
        }
        // skirts: along each edge, a quad from the edge down to its lowered copy, facing out
        const side = (list, out) => { for (let k = 0; k < list.length - 1; k++) { const a = list[k], b = list[k + 1], a2 = skirtIdx[a], b2 = skirtIdx[b]; if (out) idx.push(a, a2, b, b, a2, b2); else idx.push(a, b, a2, b, b2, a2); } };
        const run = (fi, fj, n) => { const l = []; for (let k = 0; k <= n; k += s) l.push(fi(k) + fj(k) * N); return l; };
        side(run(() => i0, (k) => j0 + k, chunk), true); // west
        side(run(() => i1, (k) => j0 + k, chunk), false); // east
        side(run((k) => i0 + k, () => j0, chunk), false); // south
        side(run((k) => i0 + k, () => j1, chunk), true); // north
        levels.push(Uint32Array.from(idx));
      }
      const cx = -half + (ci + 0.5) * chunk * step, cz = -half + (cj + 0.5) * chunk * step;
      this.lists.push({ cx, cz, r: chunk * step * 0.5, levels, lv: -1 });
    }
    const geo = (this.geometry = new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    let max = this.outerIdx.length; for (const c of this.lists) max += c.levels[0].length;
    this.index = new THREE.BufferAttribute(new Uint32Array(max), 1);
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

  /** Choose the levels for a camera at (x, z) in the field's frame; rewrites the index only when a choice changed. */
  update(x, z, force = false) {
    if (!force && Math.hypot(x - this.last.x, z - this.last.y) < this.step * 3) return false;
    this.last.set(x, z);
    const [r0, r1, r2] = this.ranges, far = r2 * 1.35;
    let changed = force;
    for (const c of this.lists) {
      const d = Math.max(0, Math.hypot(c.cx - x, c.cz - z) - c.r);
      const lv = d > far ? 4 : d > r2 ? 3 : d > r1 ? 2 : d > r0 ? 1 : 0; // (4: beyond the draw distance, not drawn)
      if (lv !== c.lv) { c.lv = lv; changed = true; }
    }
    if (!changed) return false;
    const a = this.index.array;
    let n = 0;
    for (const c of this.lists) if (c.lv < 4) { a.set(c.levels[c.lv], n); n += c.levels[c.lv].length; }
    a.set(this.outerIdx, n); n += this.outerIdx.length;
    this.index.clearUpdateRanges(); this.index.addUpdateRange(0, n); this.index.needsUpdate = true;
    this.geometry.setDrawRange(0, n);
    this.triangles = n / 3;
    return true;
  }
}
