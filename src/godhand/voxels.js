// ---------------------------------------------------------------------------------------
// THE HAND'S CREATIONS, AS VOXELS (docs/plans/GODHAND.md section 7): a sparse grid of 16-cube chunks of 0.25 m voxels, each holding a
// density (0 empty, 1 full; the surface at 0.5), meshed by surface nets so a creation reads as hand-pressed clay, never cubes. A shape is
// stamped from a signed distance with a wide ramp (`ramp` metres from surface to full), so the mending can take it back from the outside
// in: every voxel loses the same density, the surface walks inward evenly, and thin parts go first. Pure: no three.js, no physics; the
// runtime (godhand/creations.js) draws and collides what this returns.
//
// Prior art: Gibson's surface nets (1998) and Mikola Lysenko's naive surface nets (0fps.net, 2012: one vertex a cell, at the mean of its
// edge crossings; one quad an edge crossing); From Dust's land that crumbles back; Dreams' and Claybook's SDF clay (a shape is a
// distance, stamped with a max).
//
//   const V = new VoxelGrid()   V.stamp(sdf, box) -> { cells, volume }   V.mesh(key) -> { pos, idx } | null   V.ebb(dk) -> keys changed
//   V.volume(key) -> m³   V.keys()   VOXEL = { n, size, ramp }
// ---------------------------------------------------------------------------------------

/** `n` voxels a chunk side; `size` metres a voxel; `ramp` metres over which density goes from the surface (0.5) to full (1). */
export const VOXEL = { n: 16, size: 0.25, ramp: 2 };

const N = VOXEL.n, N2 = N * N;

export class VoxelGrid {
  constructor() { this.chunks = new Map(); this.dirty = new Set(); }

  key(cx, cy, cz) { return `${cx},${cy},${cz}`; }
  keys() { return [...this.chunks.keys()]; }
  chunk(cx, cy, cz, make = false) {
    const k = this.key(cx, cy, cz);
    let c = this.chunks.get(k);
    if (!c && make) { c = { k, cx, cy, cz, d: new Float32Array(N * N2), vol: 0 }; this.chunks.set(k, c); }
    return c;
  }

  /** The density at a voxel's integer coordinates (world / size), across chunks. */
  at(x, y, z) {
    const cx = Math.floor(x / N), cy = Math.floor(y / N), cz = Math.floor(z / N);
    const c = this.chunks.get(this.key(cx, cy, cz));
    return c ? c.d[(x - cx * N) + (y - cy * N) * N + (z - cz * N) * N2] : 0;
  }

  /** Stamp a shape: `sdf(x, y, z)` in metres (negative inside), over the world box [x0, y0, z0, x1, y1, z1]. Density is the max of
   *  what was there and the shape's, so stamps union. Returns the voxels touched and the volume added (m³). */
  stamp(sdf, box) {
    const s = VOXEL.size, R = VOXEL.ramp;
    const i0 = Math.floor(box[0] / s) - 1, j0 = Math.floor(box[1] / s) - 1, k0 = Math.floor(box[2] / s) - 1;
    const i1 = Math.ceil(box[3] / s) + 1, j1 = Math.ceil(box[4] / s) + 1, k1 = Math.ceil(box[5] / s) + 1;
    let cells = 0, added = 0, c = null;
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const v = 0.5 - sdf((i + 0.5) * s, (j + 0.5) * s, (k + 0.5) * s) / R;
      if (v <= 0) continue;
      const cx = Math.floor(i / N), cy = Math.floor(j / N), cz = Math.floor(k / N);
      if (!c || c.cx !== cx || c.cy !== cy || c.cz !== cz) { c = this.chunk(cx, cy, cz, true); this.touch(c); }
      const at = (i - cx * N) + (j - cy * N) * N + (k - cz * N) * N2;
      const nv = Math.min(1, v), was = c.d[at];
      if (nv <= was) continue;
      if (was < 0.5 && nv >= 0.5) added++;
      c.d[at] = nv; cells++;
    }
    for (const k of this.dirty) this.measure(k);
    return { cells, volume: added * s * s * s };
  }

  /** A chunk changed: it, and the neighbours whose meshes read its low layer (a chunk meshes the cells from -1). */
  touch(c) {
    this.dirty.add(c.k); this.dirty.add(this.key(c.cx - 1, c.cy, c.cz)); this.dirty.add(this.key(c.cx, c.cy - 1, c.cz)); this.dirty.add(this.key(c.cx, c.cy, c.cz - 1));
  }

  measure(k) { const c = this.chunks.get(k); if (!c) return 0; let n = 0; for (const v of c.d) if (v >= 0.5) n++; c.vol = n * VOXEL.size ** 3; return c.vol; }
  volume(k) { return this.chunks.get(k)?.vol ?? 0; }

  /** The mending: every voxel loses `dk` of density; a chunk left empty is dropped. Returns [{ k, lost }] for the chunks whose solid
   *  volume fell (the runtime gives that volume back to the island's matter as clay). */
  ebb(dk, skip = null) {
    const out = [];
    for (const [k, c] of this.chunks) {
      if (skip?.(c)) continue; // (a set chunk: Set, godhand/powers/make.js)
      let any = false; const d = c.d;
      for (let i = 0; i < d.length; i++) if (d[i] > 0) { d[i] = Math.max(0, d[i] - dk); any = true; }
      if (!any) continue;
      const was = c.vol, now = this.measure(k);
      this.touch(c);
      if (now < was) out.push({ k, lost: was - now });
      if (!d.some((v) => v > 0)) this.chunks.delete(k);
    }
    return out;
  }

  /** Surface nets for one chunk: a vertex in every cell from -1 to n-1 whose corners straddle the surface, at the mean of its edge
   *  crossings; a quad for every crossing edge whose low corner lies in this chunk (so each edge is meshed once, and chunks meet without
   *  a seam). World positions in metres. Null when it has no surface. */
  mesh(k) {
    const c = this.chunks.get(k); if (!c && !this.near(k)) return null;
    const [cx, cy, cz] = k.split(',').map(Number), ox = cx * N, oy = cy * N, oz = cz * N, s = VOXEL.size;
    const M = N + 2, M2 = M * M, D = this.gather(cx, cy, cz), vid = new Int32Array(M * M2).fill(-1), pos = [], idx = [];
    const g = new Float32Array(8), at = (x, y, z) => D[(x + 1) + (y + 1) * M + (z + 1) * M2];
    // cells -1 .. N-1, corners -1 .. N (D holds -1 .. N on each axis)
    for (let z = -1; z < N; z++) for (let y = -1; y < N; y++) for (let x = -1; x < N; x++) {
      let mask = 0;
      for (let q = 0; q < 8; q++) { const v = at(x + (q & 1), y + ((q >> 1) & 1), z + ((q >> 2) & 1)) - 0.5; g[q] = v; if (v > 0) mask |= 1 << q; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of EDGES) {
        const va = g[a], vb = g[b];
        if ((va > 0) === (vb > 0)) continue;
        const t = va / (va - vb);
        sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; n++;
      }
      vid[(x + 1) + (y + 1) * M + (z + 1) * M * M] = pos.length / 3;
      // (a voxel's density sits at its centre: +0.5 a voxel)
      pos.push((ox + x + sx / n + 0.5) * s, (oy + y + sy / n + 0.5) * s, (oz + z + sz / n + 0.5) * s);
    }
    if (!pos.length) return null;
    const V = (x, y, z) => vid[(x + 1) + (y + 1) * M + (z + 1) * M * M];
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v0 = at(x, y, z) > 0.5;
      for (let ax = 0; ax < 3; ax++) {
        const v1 = at(x + (ax === 0), y + (ax === 1), z + (ax === 2)) > 0.5;
        if (v0 === v1) continue;
        // the four cells round this edge: offsets -1 in the other two axes
        const u = (ax + 1) % 3, w = (ax + 2) % 3, p = [x, y, z];
        const q = (du, dw) => { const r = p.slice(); r[u] -= du; r[w] -= dw; return V(r[0], r[1], r[2]); };
        const a = q(0, 0), b = q(1, 0), cc = q(1, 1), d = q(0, 1);
        if (a < 0 || b < 0 || cc < 0 || d < 0) continue;
        if (v0) idx.push(a, b, cc, a, cc, d); else idx.push(a, cc, b, a, d, cc);
      }
    }
    return idx.length ? { pos: new Float32Array(pos), idx: new Uint32Array(idx) } : null;
  }

  /** A chunk's densities with a layer of its neighbours' round it: (N+2)³, from -1 to N on each axis. */
  gather(cx, cy, cz) {
    const M = N + 2, M2 = M * M, D = new Float32Array(M * M2);
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = this.chunks.get(this.key(cx + dx, cy + dy, cz + dz)); if (!c) continue;
      // the range of this neighbour's voxels that fall in -1 .. N
      const r = (d) => (d < 0 ? [N - 1, N] : d > 0 ? [0, 1] : [0, N]);
      const [x0, x1] = r(dx), [y0, y1] = r(dy), [z0, z1] = r(dz);
      for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++)
        D[(x + dx * N + 1) + (y + dy * N + 1) * M + (z + dz * N + 1) * M2] = c.d[x + y * N + z * N2];
    }
    return D;
  }

  /** A chunk with no voxels may still mesh the faces of its neighbours above (it reads their low layer). */
  near(k) { const [x, y, z] = k.split(',').map(Number); return this.chunks.has(this.key(x + 1, y, z)) || this.chunks.has(this.key(x, y + 1, z)) || this.chunks.has(this.key(x, y, z + 1)); }

  /** A chunk's densities as runs, for the save: [value (0..255), count, ...]; and back. */
  pack(k) {
    const c = this.chunks.get(k); if (!c) return null;
    const out = []; let v = -1, n = 0;
    for (const x of c.d) { const q = Math.round(x * 255); if (q === v) n++; else { if (n) out.push(v, n); v = q; n = 1; } }
    out.push(v, n);
    return { k, d: out };
  }
  unpack({ k, d }) {
    const [cx, cy, cz] = k.split(',').map(Number), c = this.chunk(cx, cy, cz, true);
    let i = 0; for (let r = 0; r < d.length; r += 2) for (let n = 0; n < d[r + 1] && i < c.d.length; n++) c.d[i++] = d[r] / 255;
    this.measure(k); this.touch(c);
    return c;
  }

  takeDirty() { const d = [...this.dirty]; this.dirty.clear(); return d; }
}

// a cell's twelve edges, by corner index (bit 0 x, bit 1 y, bit 2 z)
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

/** The shapes Sculpt raises (GODHAND.md section 8, Manifestation), as signed distances in metres and their boxes. `a` and `b` are the
 *  stroke's ends on the ground ({x, y, z}). */
export const SHAPES = {
  /** A pillar at `a`, `h` high. */
  pillar(a, { r = 0.6, h = 3 } = {}) {
    return { box: [a.x - r, a.y - 0.5, a.z - r, a.x + r, a.y + h, a.z + r],
      sdf: (x, y, z) => Math.max(Math.hypot(x - a.x, z - a.z) - r, Math.max(a.y - 0.5 - y, y - (a.y + h))) };
  },
  /** An arch from `a` to `b`: a slab `w` wide, `t` thick, rising to `h` at its middle; long enough, it is a bridge. */
  arch(a, b, { w = 2, t = 0.6, h = 2 } = {}) {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
    const top = Math.max(a.y, b.y) + h + t;
    return { box: [Math.min(a.x, b.x) - w, Math.min(a.y, b.y) - 1, Math.min(a.z, b.z) - w, Math.max(a.x, b.x) + w, top, Math.max(a.z, b.z) + w],
      sdf: (x, y, z) => {
        const px = x - a.x, pz = z - a.z, along = px * ux + pz * uz, side = -px * uz + pz * ux, f = along / L;
        const mid = a.y + (b.y - a.y) * f + h * 4 * f * (1 - f);
        return Math.max(Math.abs(side) - w / 2, Math.abs(y - mid) - t / 2, -along, along - L);
      } };
  },
  /** A ramp from `a` (on the ground) up to `rise` over `b`, solid down to the ground. */
  ramp(a, b, { w = 2, rise = 2 } = {}) {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
    return { box: [Math.min(a.x, b.x) - w, Math.min(a.y, b.y) - 1, Math.min(a.z, b.z) - w, Math.max(a.x, b.x) + w, a.y + rise + 0.5, Math.max(a.z, b.z) + w],
      sdf: (x, y, z) => {
        const px = x - a.x, pz = z - a.z, along = px * ux + pz * uz, side = -px * uz + pz * ux, f = along / L;
        const top = a.y + rise * f, floor = Math.min(a.y, b.y) - 0.5;
        return Math.max(Math.abs(side) - w / 2, y - top, floor - y, -along, along - L);
      } };
  },
};
