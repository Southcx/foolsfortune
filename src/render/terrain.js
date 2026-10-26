// ---------------------------------------------------------------------------------------
// CHUNKED TERRAIN: a height field drawn with its detail where the eye is. The dunes doubled in size, and a single grid fine enough
// for the sand near your feet would be a million triangles to the horizon; a grid coarse enough to draw everywhere would lose the
// crests. So the field is cut into square chunks, each with four levels of detail (every sample, every 2nd, 4th, 8th), and each
// frame the chunks near the camera use the fine one and the far ones the coarse ones. Where two chunks of different detail meet,
// the coarser edge would leave slivers of sky between the triangles; every chunk hangs a SKIRT (a strip of wall down from its
// edge) that fills them.
//
// Only what is drawn is on the card (the owner's iPhone, v283: the Raceway park's ground held every sample of its 2.6 km as one
// vertex buffer, 1.12 million vertices and 30.7 MB, and the phone took the graphics back a second after arriving). Each chunk at a
// drawn level takes a slot in a pool of that level's size and writes its own vertices there: its samples at the level's spacing,
// their normals from the full field (so the shading does not change when a chunk changes its level), and its skirts' feet. A chunk
// that changes level gives its slot back and writes a new one; only the slots written are sent to the card. The pools hold the most
// any camera draws, grown once if ever passed; the whole terrain is still one draw call, its index rewritten when a choice changes.
// The samples themselves stay (`heights`, the physics height field's), one float a sample.
// Beyond the field, an OUTER ring of coarse grid carries the ground out to the edge of the draw distance.
//
// Prior art: geomipmapping (de Boer, 2000: a chunk grid with per-chunk levels chosen by distance), chunked LOD and skirts (Ulrich,
// 2002: vertical skirts rather than stitching to hide the cracks), a streaming terrain's vertex cache of resident patches (the
// clipmap's idea, Losasso and Hoppe 2004: memory bound by what the view holds, not by the world), and the console practice of the era.
//
//   const t = new ChunkTerrain({ height: (x, z) => y, half: 520, step: 2.5, chunk: 32, outer: 900, outerStep: 20, material })
//   t.mesh              (in the field's local frame: place it)          t.update(camLocalX, camLocalZ)
//   t.heights, t.n      the samples, column-major (x rows), for a physics height field of (t.n - 1) x (t.n - 1) cells over 2 * half
//   t.setRegion(i0, j0, n, hs)   n x n samples rewritten from (i0, j0), drawn and sent to the card (the made track's build lot)
//   new ChunkTerrain({ ..., staged: true, at: [x, z] }) then t.steps()   the same build as a generator, a slice a yield (each well
//                       under 10 ms on a desk: the samples 128 rows a step, the first chunks 24 a step)
//   t.vertexBytes       the vertex pools' bytes (what the card holds for it, the index aside)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const LEVELS = 4;

export class ChunkTerrain {
  /** `staged`: nothing built yet; `steps()` builds it a slice a yield (a staged arrival under the seam's cover: render/seam.js), the
   *  mesh and the heights standing from the first. `at`: the field-frame point (x, z) the first levels are chosen for. */
  constructor(opts) {
    this.opts = opts;
    if (!opts.staged) for (const _ of this.steps());
  }

  /** The build as steps: the samples a band of rows a step, the outer ring, the pools, the first chunks a batch a step, the index. */
  *steps() {
    const { height, half, step, chunk = 32, outer = 0, outerStep = 20, material, ranges = [90, 200, 380], skirt = 8, at = [0, 0] } = this.opts;
    this.half = half; this.step = step; this.chunk = chunk; this.ranges = ranges; this.skirt = skirt;
    const cells = Math.round((2 * half) / step);
    if (cells % chunk) throw new Error('ChunkTerrain: the field must be a whole number of chunks');
    const N = (this.n = cells + 1), C = (this.chunks = cells / chunk);
    // ---- the samples (column-major: i along x the row)
    const heights = (this.heights = new Float32Array(N * N));
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false; this.geometry.setDrawRange(0, 0);
    for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) heights[i * N + j] = height(-half + i * step, -half + j * step); if (i % 128 === 127) yield 'heights'; }
    yield 'heights';
    // ---- the outer ring: a coarse grid with the field's square left out (its inner edge lies on the field's edge, a little lower)
    const oN = outer > half ? Math.round((2 * outer) / outerStep) + 1 : 0;
    this.outerN = oN;
    const outerPos = new Float32Array(oN * oN * 3), outerNor = new Float32Array(oN * oN * 3), outerIdx = [];
    if (oN) {
      const os = outerStep, oh = (oN - 1) / 2;
      const hAt = (x, z) => (Math.abs(x) <= half && Math.abs(z) <= half ? height(x, z) - 0.4 : height(x, z));
      for (let j = 0; j < oN; j++) {
        for (let i = 0; i < oN; i++) {
          const x = (i - oh) * os, z = (j - oh) * os, o = (j * oN + i) * 3;
          outerPos[o] = x; outerPos[o + 1] = hAt(x, z); outerPos[o + 2] = z;
          const e = os * 0.5, nx = hAt(x - e, z) - hAt(x + e, z), nz = hAt(x, z - e) - hAt(x, z + e), l = Math.hypot(nx, 2 * e, nz);
          outerNor[o] = nx / l; outerNor[o + 1] = (2 * e) / l; outerNor[o + 2] = nz / l;
        }
        if (j % 24 === 23) yield 'outer';
      }
      for (let j = 0; j < oN - 1; j++) for (let i = 0; i < oN - 1; i++) {
        const x0 = (i - oh) * os, z0 = (j - oh) * os;
        if (x0 >= -half && x0 + os <= half && z0 >= -half && z0 + os <= half) continue; // (inside the field)
        const a = j * oN + i, b = a + 1, c = a + oN, d = c + 1;
        outerIdx.push(a, c, b, b, c, d);
      }
    }
    this.outerPos = outerPos; this.outerNor = outerNor; this.outerIdxLocal = Uint32Array.from(outerIdx);
    yield 'outer';
    // ---- the chunks: where each stands, its level now and its slot
    this.lists = [];
    for (let cj = 0; cj < C; cj++) for (let ci = 0; ci < C; ci++) {
      const cx = -half + (ci + 0.5) * chunk * step, cz = -half + (cj + 0.5) * chunk * step;
      this.lists.push({ ci, cj, cx, cz, r: chunk * step * 0.5, lv: -1, slot: -1 });
    }
    // the most any camera draws, a level at a time and in indices: the levels repeat a chunk at a time away from the field's edge, so a
    // 9 x 9 lattice over the middle chunk finds it (81 cameras, not every chunk's centre and corner: 4.9 million level tests took
    // 178 MB of garbage on the way into the Raceway); a camera that wants more grows the pools once (update)
    const most = new Array(LEVELS).fill(0), per = new Array(LEVELS); let mostIdx = 0;
    const mid = (Math.floor(C / 2) + 0.5) * chunk * step - half, cs = chunk * step;
    for (let sj = 0; sj <= 8; sj++) for (let si = 0; si <= 8; si++) {
      const x = mid + (si / 8 - 0.5) * cs, z = mid + (sj / 8 - 0.5) * cs; per.fill(0); let n = 0;
      for (const c of this.lists) { const lv = this.levelAt(c, x, z); n += this.count(lv); if (lv < LEVELS) per[lv]++; }
      for (let l = 0; l < LEVELS; l++) most[l] = Math.max(most[l], per[l]);
      mostIdx = Math.max(mostIdx, n);
    }
    this.allocate(most.map((m) => Math.ceil(m * 1.15) + 2));
    this.index = new THREE.BufferAttribute(new Uint32Array(Math.ceil(mostIdx * 1.15) + this.outerIdxLocal.length), 1);
    this.index.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setIndex(this.index);
    const R = Math.max(half, outer) * 1.5;
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R);
    this.geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-R, -50, -R), new THREE.Vector3(R, 400, R));
    this.last = new THREE.Vector2(1e9, 1e9);
    this.triangles = 0;
    yield 'pools';
    // the first chunks filled a batch a step (update then finds them at their levels and writes only the index)
    let k = 0;
    for (const c of this.lists) {
      const lv = this.levelAt(c, at[0], at[1]);
      if (lv < LEVELS) { c.lv = lv; c.slot = this.free[lv].pop(); this.fillChunk(c); if (++k % 24 === 0) yield 'chunks'; }
    }
    this.update(at[0], at[1], true);
  }

  /** Vertices a chunk's slot holds at a level: its samples ((k + 1)^2) and its four skirts' feet (k + 1 each). */
  slotSize(lv) { const k = this.chunk >> lv; return (k + 1) * (k + 1) + 4 * (k + 1); }

  /** The pools laid out for `caps[lv]` slots a level, the outer ring after them, in one position and one normal buffer. Every chunk
   *  is written again (its slot is new). */
  allocate(caps) {
    this.caps = caps; this.base = []; this.free = [];
    let v = 0;
    for (let l = 0; l < LEVELS; l++) { this.base[l] = v; v += caps[l] * this.slotSize(l); this.free[l] = Array.from({ length: caps[l] }, (_, s) => caps[l] - 1 - s); }
    this.outerBase = v; v += this.outerN * this.outerN;
    const pos = new Float32Array(v * 3), nor = new Float32Array(v * 3);
    pos.set(this.outerPos, this.outerBase * 3); nor.set(this.outerNor, this.outerBase * 3);
    this.outerIdx = this.outerIdxLocal.map((i) => i + this.outerBase);
    for (const [k, a] of [['position', pos], ['normal', nor]]) {
      const A = new THREE.BufferAttribute(a, 3); A.setUsage(THREE.DynamicDrawUsage); // (written in play: never dehydrated, render/areas.js)
      this.geometry.setAttribute(k, A);
    }
    this.vertexBytes = pos.byteLength + nor.byteLength;
    for (const c of this.lists) { c.lv = -1; c.slot = -1; }
  }

  /** The level a chunk takes for a camera at (x, z): 0 the finest, 4 beyond the draw distance (not drawn). */
  levelAt(c, x, z) {
    const R = this.ranges, r2 = R[2], d = Math.max(0, Math.hypot(c.cx - x, c.cz - z) - c.r); // (indexed, not destructured: no iterator a call)
    return d > r2 * 1.35 ? 4 : d > r2 ? 3 : d > R[1] ? 2 : d > R[0] ? 1 : 0;
  }
  /** How many indices a chunk writes at a level: its quads and its four skirts' (six a quad). */
  count(lv) { if (lv >= LEVELS) return 0; const k = this.chunk >> lv; return 6 * (k * k + 4 * k); }

  /** A sample's height, clamped to the field. */
  h(i, j) { const N = this.n; return this.heights[Math.min(N - 1, Math.max(0, i)) * N + Math.min(N - 1, Math.max(0, j))]; }

  /** A chunk's vertices written into its slot: the samples at its level's spacing, the full field's normals, the skirts' feet. */
  fillChunk(c) {
    const lv = c.lv, k = this.chunk >> lv, s = 1 << lv, K = k + 1, G = K * K, st = this.step, half = this.half, sk = this.skirt;
    const v0 = this.base[lv] + c.slot * this.slotSize(lv), P = this.geometry.attributes.position.array, Nn = this.geometry.attributes.normal.array;
    const i0 = c.ci * this.chunk, j0 = c.cj * this.chunk;
    const put = (v, i, j, drop) => {
      const o = v * 3, y = this.h(i, j);
      P[o] = -half + i * st; P[o + 1] = y - drop; P[o + 2] = -half + j * st;
      const nx = this.h(i - 1, j) - this.h(i + 1, j), nz = this.h(i, j - 1) - this.h(i, j + 1), ny = 2 * st, l = Math.hypot(nx, ny, nz);
      Nn[o] = nx / l; Nn[o + 1] = ny / l; Nn[o + 2] = nz / l;
    };
    for (let b = 0; b < K; b++) for (let a = 0; a < K; a++) put(v0 + a + b * K, i0 + a * s, j0 + b * s, 0);
    for (let m = 0; m < K; m++) {
      put(v0 + G + m, i0, j0 + m * s, sk); put(v0 + G + K + m, i0 + this.chunk, j0 + m * s, sk); // (west, east)
      put(v0 + G + 2 * K + m, i0 + m * s, j0, sk); put(v0 + G + 3 * K + m, i0 + m * s, j0 + this.chunk, sk); // (south, north)
    }
    const n = this.slotSize(lv) * 3;
    for (const A of [this.geometry.attributes.position, this.geometry.attributes.normal]) { A.addUpdateRange(v0 * 3, n); A.needsUpdate = true; }
  }

  /** A chunk's surface and its four skirts, written into the index `a` from `n`; returns the new end. */
  writeChunk(c, a, n) {
    const k = this.chunk >> c.lv, K = k + 1, G = K * K, v0 = this.base[c.lv] + c.slot * this.slotSize(c.lv);
    for (let b = 0; b < k; b++) for (let x = 0; x < k; x++) {
      const p = v0 + x + b * K, r = p + 1, q = p + K, d = q + 1;
      a[n++] = p; a[n++] = q; a[n++] = r; a[n++] = r; a[n++] = q; a[n++] = d;
    }
    // skirts: along each edge, a quad from the edge down to its feet, facing out (west, east, south, north)
    const side = (grid, foot, out) => {
      for (let m = 0; m < k; m++) {
        const p = grid(m), b = grid(m + 1), p2 = foot + m, b2 = foot + m + 1;
        if (out) { a[n++] = p; a[n++] = p2; a[n++] = b; a[n++] = b; a[n++] = p2; a[n++] = b2; } else { a[n++] = p; a[n++] = b; a[n++] = p2; a[n++] = b; a[n++] = b2; a[n++] = p2; }
      }
    };
    side((m) => v0 + m * K, v0 + G, true); side((m) => v0 + k + m * K, v0 + G + K, false);
    side((m) => v0 + m, v0 + G + 2 * K, false); side((m) => v0 + m + k * K, v0 + G + 3 * K, true);
    return n;
  }

  /** Choose the levels for a camera at (x, z) in the field's frame; a chunk that changed level writes a new slot, and the index is
   *  rewritten only when a choice changed. */
  update(x, z, force = false) {
    if (!force && Math.hypot(x - this.last.x, z - this.last.y) < this.step * 3) return false;
    this.last.set(x, z);
    const want = this.lists.map((c) => this.levelAt(c, x, z));
    if (!force && want.every((lv, i) => lv === this.lists[i].lv)) return false;
    // the pools: grown once (every chunk written again) if this camera wants more slots of a level than they hold
    const need = new Array(LEVELS).fill(0); for (const lv of want) if (lv < LEVELS) need[lv]++;
    if (need.some((m, l) => m > this.caps[l])) this.allocate(this.caps.map((m, l) => Math.max(m, Math.ceil(need[l] * 1.25))));
    this.lists.forEach((c, i) => { if (c.lv !== want[i] && c.slot >= 0) { this.free[c.lv].push(c.slot); c.slot = -1; } });
    let nIdx = this.outerIdx.length;
    this.lists.forEach((c, i) => {
      const lv = want[i];
      if (c.lv !== lv || c.slot < 0) { c.lv = lv; if (lv < LEVELS) { c.slot = this.free[lv].pop(); this.fillChunk(c); } }
      nIdx += this.count(lv);
    });
    if (nIdx > this.index.array.length) { // (past the sampled most: a bigger index, once)
      this.index = new THREE.BufferAttribute(new Uint32Array(Math.ceil(nIdx * 1.15)), 1); this.index.setUsage(THREE.DynamicDrawUsage); this.geometry.setIndex(this.index);
    }
    const a = this.index.array;
    let n = 0;
    for (const c of this.lists) if (c.lv < LEVELS) n = this.writeChunk(c, a, n);
    a.set(this.outerIdx, n); n += this.outerIdx.length;
    this.index.clearUpdateRanges(); this.index.addUpdateRange(0, n); this.index.needsUpdate = true;
    this.geometry.setDrawRange(0, n);
    this.triangles = n / 3;
    return true;
  }

  /** Heights `hs` (n x n, column-major as `heights`: i along x) written from sample (i0, j0): the kept samples, then every drawn chunk
   *  they touch (a sample round, for the normals) written again into its slot and sent to the card. (Dovina's made track writes the
   *  build lot through it: world/raceway/madetrack.js.) */
  setRegion(i0, j0, n, hs) {
    const N = this.n, H = this.heights, C = this.chunk;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) H[(i0 + i) * N + (j0 + j)] = hs[i * n + j];
    const ca = Math.floor(Math.max(0, i0 - 1) / C), cb = Math.floor(Math.min(N - 1, i0 + n) / C), da = Math.floor(Math.max(0, j0 - 1) / C), db = Math.floor(Math.min(N - 1, j0 + n) / C);
    for (const c of this.lists) {
      if (c.lv >= LEVELS || c.slot < 0) continue;
      // (a chunk's samples run ci * C .. (ci + 1) * C: one on a boundary touches both chunks)
      if (c.ci >= ca - 1 && c.ci <= cb && c.cj >= da - 1 && c.cj <= db && (c.ci + 1) * C >= i0 - 1 && c.ci * C <= i0 + n && (c.cj + 1) * C >= j0 - 1 && c.cj * C <= j0 + n) this.fillChunk(c);
    }
  }
}
