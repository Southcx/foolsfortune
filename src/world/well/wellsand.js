// ---------------------------------------------------------------------------------------
// THE WELL'S SAND: the heights of one room's sand, as a grid of samples (pure: no three.js; wellkit.js makes the collider and the mesh
// from it). Sand to walk on is one collider a room from at most 32 by 32 samples (docs/plans/DUNEMAW.md, the gate's budget): a trimesh, not
// a heightfield, since every sample is swirled with the floor (wellkit.js) and a heightfield cannot bend.
// By floor (Calissa's numbers): floor 1 a ripple field with drifts against the walls; floor 2 dunes inside the rooms; floor 3 the rooms
// half buried. Where the Courier must pass, the sand lies low: in every doorway and round the pools, so the path is always walkable.
// A slope cell's sand is a ramp from one tier to the other, straight through. The dunes are scaled down until no part of them is
// steeper than 30 degrees, and the drifts against the walls stay under 35: anything a jelly can stand on, the Courier can reach.
//
// Prior art: Journey's sand (thatgamecompany, 2012: dunes, drifts and slopes to slide down), and any terrain built as a sum of a few
// waves (the dunes' own height function, world/dunes/dunes.js).
//
//   roomSand({ seed, floor, size, doors: [{ x, z }], pools: [{ x, z }], ramp?: { from: 'n'|'s'|'e'|'w', hFrom, hTo } }) ->
//     { n, size, step, heights (column-major, x rows: Rapier's), at(x, z) -> height }   (room-local metres, from the room's centre)
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';

export const SAMPLES = 32, BASE = 0.08, MAX_SLOPE = Math.tan((30 * Math.PI) / 180);
const LOOK = { // (by floor: dune height, drift height against the walls, ripple)
  1: { dune: 0, drift: 1.2, ripple: 0.2 },
  2: { dune: 2, drift: 1.8, ripple: 0.15 },
  3: { dune: 3, drift: 2.2, ripple: 0.12 },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function roomSand({ seed, floor, size, doors = [], pools = [], ramp = null }) {
  const R = seeded(seed >>> 0), L = LOOK[floor] || LOOK[3];
  const n = SAMPLES, span = size, step = span / (n - 1), half = size / 2, h0 = -span / 2; // (to the walls' middles: wellkit.js swirls every sample, so rooms meet edge to edge)
  // the dunes: a few long waves, each its own direction and phase
  const waves = [0, 1, 2].map(() => { const a = R() * Math.PI * 2, k = (Math.PI * 2) / (6 + R() * 5); return { kx: Math.cos(a) * k, kz: Math.sin(a) * k, p: R() * 6.28 }; });
  const ripA = R() * Math.PI * 2, ripK = (Math.PI * 2) / 3.2, ripP = R() * 6.28; // (3.2 m crest to crest: six samples a ripple, never finer than the field)
  const dune = (x, z) => waves.reduce((s, w) => s + Math.sin(w.kx * x + w.kz * z + w.p), 0) / 3 * 0.5 + 0.5; // (0..1)
  // where the sand must lie low: the doorways and the pools (a ramp's two ends are its doorways)
  const low = (x, z) => {
    let k = 1;
    for (const d of doors) k = Math.min(k, smooth(2.6, 4.6, Math.hypot(x - d.x, z - d.z)));
    for (const p of pools) k = Math.min(k, smooth(2.8, 4.4, Math.hypot(x - p.x, z - p.z)));
    return k;
  };
  const drift = (x, z) => Math.exp(-Math.max(0, half - Math.max(Math.abs(x), Math.abs(z))) / 3.2); // (3.2 m to fall to a third: 35 degrees at most against the wall, walkable)
  const rampAt = (x, z) => {
    if (!ramp) return 0;
    const t = Math.min(1, Math.max(0, { n: (z + half) / size, s: (half - z) / size, w: (x + half) / size, e: (half - x) / size }[ramp.from])); // (0 at its from side)
    return ramp.hFrom + (ramp.hTo - ramp.hFrom) * t;
  };
  // the whole surface, its dunes scaled down until nothing a Courier crosses (all but the drifts' last 2.5 m against the walls) passes 30 degrees
  const rest = (x, z) => BASE + rampAt(x, z) + low(x, z) * (L.drift * drift(x, z) * (ramp ? 0.4 : 1) + L.ripple * (0.5 + 0.5 * Math.sin((Math.cos(ripA) * x + Math.sin(ripA) * z) * ripK + ripP)));
  const dunesAt = (x, z, a) => a * dune(x, z) * low(x, z);
  let A = ramp ? 0 : L.dune;
  const inner = half - 2.5, st = step;
  for (let tries = 0; tries < 10 && A > 0; tries++) {
    let worst = 0;
    for (let x = -inner; x < inner; x += st) for (let z = -inner; z < inner; z += st) {
      const y = rest(x, z) + dunesAt(x, z, A);
      worst = Math.max(worst, Math.abs(rest(x + st, z) + dunesAt(x + st, z, A) - y) / st, Math.abs(rest(x, z + st) + dunesAt(x, z + st, A) - y) / st);
    }
    if (worst <= MAX_SLOPE) break;
    A *= 0.8;
  }
  const at = (x, z) => rest(x, z) + dunesAt(x, z, A);
  const heights = new Float32Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) heights[i * n + j] = at(h0 + i * step, h0 + j * step);
  return { n, size: span, step, heights, at, dune: A };
}
