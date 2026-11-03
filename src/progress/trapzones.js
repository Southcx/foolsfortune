// ---------------------------------------------------------------------------------------
// THE SIX LATER TRAPS' GEOMETRY (docs/plans/TRACK-EDITOR.md 4; G305, 2026-11-03): where each of the antlion, boulder, hasten field, storm
// cell, ward gate and pot catapult is, and what it can touch, at any moment of its action. Pure: a trap's progress `k` (0..1 through its
// active stretch) and its lane in, a place and a reach out, in the trap's own frame (`a` metres past the trap along the line, `lat` metres
// right of it). The world's traps (world/raceway/traps.js and trapkinds.js) ask here; the proof (scripts/trapproof.mjs) asks here too.
// A lane is a third of the track's width: lane 0 at the left edge, as the pillars take them (lat = -W + 2W * (lane + 0.5) / 3).
//
// Prior art: Crash Team Racing's and Mario Kart's moving hazards (a hazard is a circle with a path); Fall Guys' obstacles (exposed
// timing, a safe lane); Star Fox's and Excitebike's rolling obstacles (a sphere on a line, hop it).
//
//   laneLat(lane, W)  laneOf(lat, W)  mawAt(K, k, lane, W)  boulderAt(K, k, lane, W)  stormMarks(K, lane, W) -> [{ a, lat, at }]
//   potAt(K, k, lane, W) -> { a, lat, h }  potLands(K, lane, W) -> { a, lat }  hitOf(kind, st, x, W, grow) -> bool
//   st = { k, lane, lat }  x = { a, lat, air }   (the storm and the catapult strike at moments, world/raceway/trapkinds.js asks them apart)
// ---------------------------------------------------------------------------------------
import { TRAPS } from './traps.js';

export const laneLat = (lane, W) => -W + (2 * W * (lane + 0.5)) / 3;
export const laneOf = (lat, W) => Math.max(0, Math.min(2, Math.floor(((lat + W) / (2 * W)) * 3)));

/** The antlion's maw: out of the sand `back` metres behind the trap, lunging `reach` past it across the stretch, in one lane. */
export function mawAt(K, k, lane, W) { const S = K.size; return { a: -S.back + (S.back + S.reach) * k, lat: laneLat(lane, W), r: S.r }; }
/** The boulder: from `reach` metres on, rolling back down the lane toward the riders and `tail` metres behind the trap. */
export function boulderAt(K, k, lane, W) { const S = K.size; return { a: S.reach - (S.reach + S.tail) * k, lat: laneLat(lane, W), r: S.r }; }
/** The storm's marks: three, at three depths, no two in a lane, the middle one in the lane chosen; each strikes at its `at` (a share of the
 *  active stretch), the first at a quarter, so the marks are read before the first. */
export function stormMarks(K, lane, W) {
  const S = K.size, n = S.bolts;
  return Array.from({ length: n }, (_, i) => ({ a: (i - (n - 1) / 2) * S.spread, lat: laneLat((lane + i + 2) % 3, W), at: (i + 1) / (n + 1) }));
}
/** The pot in flight (the arm lets go at k 0, the pot lands at k 1): a parabola from the catapult at the track's edge to the lane. */
export function potAt(K, k, lane, W) {
  const S = K.size, to = potLands(K, lane, W), from = { a: 0, lat: -(W + 4) };
  return { a: from.a + (to.a - from.a) * k, lat: from.lat + (to.lat - from.lat) * k, h: 2 + S.arc * 4 * k * (1 - k) };
}
export function potLands(K, lane, W) { return { a: K.size.range, lat: laneLat(lane, W) }; }

/** Whether a racer `x` (a metres past the trap, lat, in the air or not) is touched by the sweeping or standing traps at progress k: the
 *  antlion's maw and the boulder (on the sand: a hop clears them), the hasten field's patch and the ward's circle (flat on the sand: the
 *  air does not help). `grow` is a possessor's wrath. */
export function hitOf(kind, st, x, W, grow = 1) {
  const K = TRAPS[kind];
  if (kind === 'antlion') { const m = mawAt(K, st.k, st.lane, W); return !x.air && Math.abs(x.a - m.a) < m.r * grow && Math.abs(x.lat - m.lat) < m.r * grow; }
  if (kind === 'boulder') { const m = boulderAt(K, st.k, st.lane, W); return !x.air && Math.hypot(x.a - m.a, x.lat - m.lat) < m.r * grow + 0.4; }
  if (kind === 'hasten' || kind === 'ward') return Math.hypot(x.a, x.lat - st.lat) < K.size.r * grow;
  return false;
}
