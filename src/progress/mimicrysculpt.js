// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES' CREATIONS (docs/plans/MIMICRY.md section 7, GAPS G142): Manifestation's puzzle. The System raises a creation on
// the patch with Sculpt (a pillar, an arch), takes it down, and you raise it again; the copy is compared voxel to voxel against the
// System's, over the creations' own grid (godhand/voxels.js: 0.25 m voxels), never the matter field (a creation stands over the ground
// and is not in it). Both grids are softened over half a metre first, so a pillar set down half a metre off still mostly stands in its
// target, and the score is the same Dice of the two changes the matter puzzles use (progress/mimicry.js matchOf).
// What it teaches without saying so (DESIGN.md 22): a stroke's length decides what Sculpt raises (under 1.5 m a pillar, longer an
// arch, its height 0.3 of its span), so an arch is copied by reading its span off its height.
//
// Pure: no three.js. The shapes are godhand/voxels.js SHAPES, sized as the hand sizes them (godhand/matterarts.js `sculpt`, at the
// toolkit's scale 1), and stamped on a VoxelGrid of the puzzle's own for the target; the runtime (world/mimicry/mimicry.js, Petra's)
// snaps the island's own grid (game.creations.grid) to judge the copy.
//
// Prior art: Minecraft's build battles and structure blocks (a build judged block by block against a saved one); Islands of Insight's
// Matchbox (two things made alike); the Dice coefficient (Dice, 1945), as the matter puzzles score; a box blur standing in for a Gaussian.
//
//   SCULPT = { pillar, w, t, arch, archK, ramp, rampK }   VOX = { half, down, up, soft, floor, enough }
//   sculptOf(step, groundAt, at) -> { shape, a, b, opts, est }   (a step's creation in world metres, as the hand would raise it)
//   voxelSnap(grid, at) -> { i0, j0, k0, nx, ny, nz, d }   restoreVoxels(grid, S) -> keys touched   voxelMatchOf(now, target, start) -> 0..1
// ---------------------------------------------------------------------------------------
import { VOXEL } from '../godhand/voxels.js';

/** Sculpt's numbers at the toolkit's scale 1, as the hand reads them (godhand/matterarts.js VERBS.sculpt: a stroke under `pillar` metres
 *  raises a pillar; an arch rises `archK` of its span, between `arch[0]` and `arch[1]` metres; a ramp `rampK` of it, `ramp` at most). */
export const SCULPT = { pillar: 1.5, w: 2, t: 0.6, arch: [1.5, 5], archK: 0.3, ramp: 4, rampK: 0.4, pillarR: 0.6, pillarH: 3 };
/** The compared box round the patch's middle: `half` metres each way across (the patch's 6), `down` under its ground and `up` over it
 *  (the tallest arch, 5 m and its thickness, on ground up to 2 m over the patch's middle). `coarse`: voxels a side of the compared cell
 *  (2: 0.5 m cells holding each one's solid share, as the matter's own cell). `soft`: compared cells a box pass reaches (1: half a metre). `floor`: the least change judged against (m³), as MIMIC.floor. `enough`: the share of the asked volume a copy must raise
 *  before it can be whole (as MIMIC.enough: one of two creations is not a copy). */
export const VOX = { half: 6, down: 2, up: 8, coarse: 2, soft: 1, floor: 1, enough: 0.8 };

/** A step `{ op: 'sculpt', a, b?, shape? }` (patch-local metres) as the hand would raise it on this ground: the stroke's ends set on the
 *  ground (`groundAt(x, z)`, world), its shape by its length (or `shape: 'ramp'`, the hand's Shift), its sizes, and what it would cost
 *  made from nothing (`est`, m³: the hand's own estimate). */
export function sculptOf(step, groundAt, at = { x: 0, z: 0 }) {
  const S = SCULPT, pa = step.a, pb = step.b || step.a;
  const ax = at.x + pa[0], az = at.z + pa[1], bx = at.x + pb[0], bz = at.z + pb[1];
  const a = { x: ax, y: groundAt(ax, az), z: az }, b = { x: bx, y: groundAt(bx, bz), z: bz }, len = Math.hypot(bx - ax, bz - az);
  const shape = len < S.pillar ? 'pillar' : step.shape === 'ramp' ? 'ramp' : 'arch';
  const opts = shape === 'pillar' ? { r: S.pillarR, h: S.pillarH } : shape === 'ramp' ? { w: S.w, rise: Math.min(S.ramp, len * S.rampK) }
    : { w: S.w, t: S.t, h: Math.max(S.arch[0], Math.min(S.arch[1], len * S.archK)) };
  const est = shape === 'pillar' ? Math.PI * opts.r * opts.r * (opts.h + 0.5) : shape === 'ramp' ? opts.w * len * (opts.rise / 2 + 0.5) : opts.w * opts.t * len * 1.2;
  return { shape, a, b, opts, est };
}

// ---- the grid, boxed
const N = VOXEL.n, N2 = N * N;
const boxOf = (at) => {
  const s = VOXEL.size, i0 = Math.floor((at.x - VOX.half) / s), k0 = Math.floor((at.z - VOX.half) / s), j0 = Math.floor(((at.y || 0) - VOX.down) / s);
  return { i0, j0, k0, nx: Math.round((VOX.half * 2) / s), ny: Math.round((VOX.down + VOX.up) / s), nz: Math.round((VOX.half * 2) / s) };
};
/** Each chunk the box crosses, and the box's voxels inside it: fn(chunk | null, cx, cy, cz, [x0, x1, y0, y1, z0, z1] in grid voxels). */
function eachChunk(grid, B, make, fn) {
  for (let cz = Math.floor(B.k0 / N); cz <= Math.floor((B.k0 + B.nz - 1) / N); cz++)
    for (let cy = Math.floor(B.j0 / N); cy <= Math.floor((B.j0 + B.ny - 1) / N); cy++)
      for (let cx = Math.floor(B.i0 / N); cx <= Math.floor((B.i0 + B.nx - 1) / N); cx++) {
        const c = grid.chunk(cx, cy, cz, make);
        fn(c, cx, cy, cz, [Math.max(B.i0, cx * N), Math.min(B.i0 + B.nx, cx * N + N), Math.max(B.j0, cy * N), Math.min(B.j0 + B.ny, cy * N + N), Math.max(B.k0, cz * N), Math.min(B.k0 + B.nz, cz * N + N)]);
      }
}
/** The creations' densities over the patch's box, a copy (chunk by chunk: one lookup a chunk, never one a voxel, so it is cheap enough
 *  to read every half second while a puzzle is open). */
export function voxelSnap(grid, at) {
  const B = boxOf(at), d = new Float32Array(B.nx * B.ny * B.nz);
  if (grid) eachChunk(grid, B, false, (c, cx, cy, cz, [x0, x1, y0, y1, z0, z1]) => {
    if (!c) return;
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++)
      d[(x - B.i0) + (y - B.j0) * B.nx + (z - B.k0) * B.nx * B.ny] = c.d[(x - cx * N) + (y - cy * N) * N + (z - cz * N) * N2];
  });
  return { ...B, d };
}
/** Write a snapshot back over the box (the runtime takes the System's demonstration down; the target is stamped over the start on a
 *  grid of its own). Chunks are made only where there is density to write. Returns the keys it touched; the grid's own `dirty` holds
 *  them too (the runtime hands them to game.creations for remeshing, as `raise` does). */
export function restoreVoxels(grid, S) {
  const touched = [];
  eachChunk(grid, S, false, (c0, cx, cy, cz, [x0, x1, y0, y1, z0, z1]) => {
    let c = c0;
    if (!c) { let any = false; for (let z = z0; z < z1 && !any; z++) for (let y = y0; y < y1 && !any; y++) for (let x = x0; x < x1; x++) if (S.d[(x - S.i0) + (y - S.j0) * S.nx + (z - S.k0) * S.nx * S.ny] > 0) { any = true; break; } if (!any) return; c = grid.chunk(cx, cy, cz, true); }
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++)
      c.d[(x - cx * N) + (y - cy * N) * N + (z - cz * N) * N2] = S.d[(x - S.i0) + (y - S.j0) * S.nx + (z - S.k0) * S.nx * S.ny];
    grid.touch(c); grid.measure(c.k); touched.push(c.k);
  });
  return touched;
}

/** The solids' bounds in a snapshot's voxels, [x0, x1, y0, y1, z0, z1] (ends exclusive), or null when nothing stands. */
function solidBox(S) {
  const { nx, ny, nz } = S, XY = nx * ny; let b = null;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0, o = y * nx + z * XY; x < nx; x++, o++) {
    if (S.d[o] < 0.5) continue;
    if (!b) b = [x, x + 1, y, y + 1, z, z + 1];
    else { if (x < b[0]) b[0] = x; if (x >= b[1]) b[1] = x + 1; if (y < b[2]) b[2] = y; if (y >= b[3]) b[3] = y + 1; if (z < b[4]) b[4] = z; if (z >= b[5]) b[5] = z + 1; }
  }
  return b;
}
/** Solid or not (the surface at 0.5, as the mesh has it) over the sub-box `B` of the snapshot, softened over `soft` voxels on each axis,
 *  twice (a Gaussian's cheap stand-in), each line a running sum. Only the solids' bounds and the reach of the two passes round them are
 *  worked (outside it all is 0), at the coarse cell: measured, about 1 ms a score on a desk (the matter's matchOf 1.3), against 13 ms over the whole box voxel by voxel. */
function softOcc(S, B) {
  const key = B.join(); if (S._softKey === key) return S._soft; // (the target's and the start's kept while the bounds hold)
  const [x0, x1, y0, y1, z0, z1] = B, C = VOX.coarse, nx = Math.ceil((x1 - x0) / C), ny = Math.ceil((y1 - y0) / C), nz = Math.ceil((z1 - z0) / C), R = VOX.soft, XY = nx * ny;
  const a = new Float32Array(nx * ny * nz), t = new Float32Array(a.length), share = 1 / (C * C * C), SX = S.nx, SXY = S.nx * S.ny;
  for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) { // (each voxel's solid share into its coarse cell)
    const row = ((y - y0) / C | 0) * nx + ((z - z0) / C | 0) * XY, src = y * SX + z * SXY;
    for (let x = x0; x < x1; x++) if (S.d[src + x] >= 0.5) a[row + ((x - x0) / C | 0)] += share;
  }
  const line = (src, dst, base, stride, n) => { // (a box of 2R+1 along one line, its ends averaged over what lies inside)
    let s = 0; for (let i = 0; i < Math.min(R, n); i++) s += src[base + i * stride];
    for (let i = 0; i < n; i++) {
      if (i + R < n) s += src[base + (i + R) * stride];
      if (i - R - 1 >= 0) s -= src[base + (i - R - 1) * stride];
      dst[base + i * stride] = s / (Math.min(n - 1, i + R) - Math.max(0, i - R) + 1);
    }
  };
  for (let p = 0; p < 2; p++) {
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) line(a, t, y * nx + z * XY, 1, nx);
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) line(t, a, x + z * XY, nx, ny);
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) line(a, t, x + y * nx, XY, nz);
    a.set(t);
  }
  S._softKey = key; S._soft = a;
  return a;
}
/** How near the creations now are to the target, 0 .. 1: matchOf's Dice of the two changes (start to target, start to now) over the
 *  softened solids, times how much of the asked volume was raised, up to `enough`. Nothing raised is 0, the System's own 1. Worked over
 *  the three snapshots' solids' bounds, padded by the softening's reach (the box's edge stands in for the patch's, as the layers' do). */
export function voxelMatchOf(now, target, start) {
  const pad = (VOX.soft * 2 + 1) * VOX.coarse, boxes = [now, target, start].map((S) => (S._box ??= solidBox(S))).filter(Boolean);
  if (!boxes.length) return 0;
  const B = [0, 2, 4].flatMap((i) => [Math.max(0, Math.min(...boxes.map((b) => b[i])) - pad), Math.min([target.nx, target.ny, target.nz][i / 2], Math.max(...boxes.map((b) => b[i + 1])) + pad)]);
  const Nn = softOcc(now, B), T = softOcc(target, B), S0 = softOcc(start, B), v = (VOXEL.size * VOX.coarse) ** 3;
  let diff = 0, change = 0, asked = 0, moved = 0;
  for (let o = 0; o < T.length; o++) {
    const dt = Math.abs(T[o] - S0[o]), dn = Math.abs(Nn[o] - S0[o]);
    diff += Math.abs(Nn[o] - T[o]); change += dt + dn; asked += dt; moved += dn;
  }
  const dice = Math.max(0, Math.min(1, 1 - (diff * v) / Math.max(VOX.floor, change * v)));
  return dice * Math.min(1, moved / Math.max(1e-6, VOX.enough * asked));
}
