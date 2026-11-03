// ---------------------------------------------------------------------------------------
// A MECH'S RULES IN PLAY (docs/plans/MECHS.md 4.2, 4.4 to 4.8): sync, the battery and the cable, the barrier, stagger, the berserk. Pure:
// each takes a state and returns the next, so the hangar's runtime (world/hangar/) and the simulator (scripts/mechs.mjs) read one rule.
//
//   SYNC     Evangelion's sync ratio, read from play: up when you step on the frame's stride beat (its pendulum, frame.js), down when you
//            fight it or are hit; its ceiling your mental state's calm (game.courierMind.v, 0.5 at rest); it multiplies the mech's output
//            (0.5 + sync) and how much of its cracks echo into your Pneuka Jar (0.3 x sync).
//   ENERGY   Evangelion's umbilical cable and five minutes: on the cable the battery refills at the generator's output; off it, the battery,
//            then the pool (POOL_KJ a point of the pool), then the mech fails.
//   BARRIER  the AT Field: a giant's barrier stops blows until yours presses on it within reach (V held), falling over `press` real s
//            while your own shield is down; down for `down` real s. The big gun's charged beam pierces it at `pierce`.
//   STAGGER  Armored Core 6's ACS: a giant's gauge filled by blows, ebbing after a quiet spell; full, it staggers for `for` real s, every
//            blow x2, a heavy blow a critical x3.
//   BERSERK  Unit-01: a mech that would fail at sync 0.8 or more may instead (one chance in three, on your dice) run on its own.
//
// Prior art: Neon Genesis Evangelion (sync ratio, the cable, the AT Field and its neutralising, the berserk), Armored Core 6 (stagger and
// the critical), Sekiro's posture (a second bar, ebbing), the pendulum (a walk in step costs least).
//
//   SYNC   syncCeiling(mindV, brimming)   beatOf(phase, window?) -> 'beat' | 'fought' | null   syncStep(sync, { dt, beat, stroke, fought, hitK, staggerHit, low, ceiling })
//   outputK(sync)   feedbackK(sync)   ENERGY   POOL_KJ   energyStep(state, stats, { dt, cable, boosting, spentKJ }) -> { battery, poolKJ, dry }
//   BARRIER   barrierStep(b, { dt, pressing, near })   STAGGER   staggerStep(s, { dt, add })   blowMult(s, heavy)   BERSERK   berserkRoll(sync, rand)
// ---------------------------------------------------------------------------------------

/** Sync's numbers: where it starts on sealing and rests; its moves a step, a blow, a stagger hit; its settling (a real s); the beat's
 *  window (a share of the step either side of its start); the floor of the ceiling when agitated. */
export const SYNC = { start: 0.3, rest: 0.4, settle: 0.02, beat: 0.04, fought: 0.06, hit: 0.05, staggerHit: 0.03, low: 0.01, window: 0.2, floor: 0.6, skate: 0.03 };
/** The skate (world/hangar/mechskate.js: the boosters' glide, no steps) keeps sync's one rule, the frame's rhythm (Dovina's ruling,
 *  2026-11-03, on Calissa's question): a quick boost started on the stride's beat (beatOf, read off the frame's pendulum, which keeps
 *  swinging while it glides) is a stroke on the beat and raises sync `skate` (three quarters of a step's: a glide asks less of the body
 *  than a step); a quick boost off the beat costs nothing (a boost does not fight the swing as a step against it does), and the glide
 *  between strokes only settles. So the skater who boosts in time keeps the walker's sync, and one who mashes neither gains nor loses
 *  (Jet Set Radio's and the speed skater's stroke on the count; Evangelion's sync as rhythm, never as button rate). */

/** Sync's ceiling from the Courier's mental state (`courierMind.v`: 0.5 at rest, 1 at its most stirred) and overflow: calm, 1; stirred to
 *  the top or brimming, `floor`. A dish served before a launch settles it (Spirit Cooking's draught): a reason to cook. */
export const syncCeiling = (v = 0.5, brimming = false) => (brimming ? SYNC.floor : Math.max(SYNC.floor, 1 - (1 - SYNC.floor) * Math.max(0, (v - 0.5) / 0.5)));

/** Was a step started on the stride's beat? `phase` is where in its step the frame stood (0 a step's start .. 1 its end): near either
 *  end it is the beat, in the middle it fights the swing. */
export function beatOf(phase, window = SYNC.window) {
  const d = Math.min(phase, 1 - phase);
  return d <= window ? 'beat' : d >= 0.5 - window ? 'fought' : null;
}

/** The next sync from this frame's moments. */
export function syncStep(sync, { dt = 0, beat = false, stroke = false, fought = false, hitK = 0, staggerHit = false, low = false, ceiling = 1 } = {}) {
  let s = sync + (SYNC.rest - sync) * Math.min(1, SYNC.settle * dt);
  if (beat) s += SYNC.beat;
  if (stroke) s += SYNC.skate; // (a quick boost on the beat while skating: the ruling above)
  if (fought) s -= SYNC.fought;
  if (hitK) s -= SYNC.hit * hitK;
  if (staggerHit) s += SYNC.staggerHit;
  if (low) s -= SYNC.low * dt;
  return Math.max(0, Math.min(ceiling, s));
}
/** What sync multiplies the mech's output by (its walk, thrust, blows): half at none, x1.5 at full. */
export const outputK = (sync) => 0.5 + sync;
/** The share of each of the mech's cracks echoed into your Pneuka Jar (Evangelion's feedback): high sync is strong and it hurts. */
export const feedbackK = (sync) => 0.3 * sync;

/** The cable's reach (m) from its socket, and the jolt (a blow, k) when it pulls free; the pool backs the battery at POOL_KJ a point. */
export const ENERGY = { cable: 60, jolt: 0.15, low: 0.15 };
export const POOL_KJ = 600;

/** The battery a frame later: on the cable it refills at the output; it pays the parts' draw, the booster's fire and what was spent; past
 *  empty, the pool pays (`poolKJ` to drain, in kJ); `dry` when there is neither. */
export function energyStep(battery, stats, { dt = 0, cable = false, boosting = false, spentKJ = 0, pool = Infinity } = {}) {
  const inKJ = cable ? stats.output * dt : 0;
  const outKJ = (stats.draw + (boosting ? stats.fire : 0)) * dt + spentKJ;
  let b = Math.min(stats.capacity, battery + inKJ - outKJ), poolKJ = 0;
  if (b < 0) { poolKJ = -b; b = 0; }
  return { battery: b, poolKJ, dry: b <= 0 && poolKJ / POOL_KJ >= pool };
}

/** The barrier: a giant's falls under your press within `reach` (m) over `press` real s, stays down `down` real s; the charged beam lands
 *  through it at `pierce`. */
export const BARRIER = { reach: 40, press: 2, down: 12, pierce: 1 / 3 };
/** The barrier a frame later: `b` { up (0..1, 1 whole), downT (real s left down) }. */
export function barrierStep(b, { dt = 0, pressing = false, near = false } = {}) {
  if (b.downT > 0) { const downT = b.downT - dt; return downT > 0 ? { up: 0, downT } : { up: 1, downT: 0, rose: true }; }
  const up = pressing && near ? b.up - dt / BARRIER.press : Math.min(1, b.up + dt / (BARRIER.press * 2));
  return up <= 0 ? { up: 0, downT: BARRIER.down, fell: true } : { up, downT: 0 };
}

/** Stagger: the gauge's top, its ebb (a real s) after `quiet` real s without a blow, how long a stagger lasts, a blow's multiplier on a
 *  staggered giant and a heavy blow's (a critical). */
export const STAGGER = { full: 100, ebb: 8, quiet: 2, for: 3, mult: 2, crit: 3 };
/** The gauge a frame later: `s` { v, quietT, staggerT }; `add` a blow's stagger. */
export function staggerStep(s, { dt = 0, add = 0 } = {}) {
  if (s.staggerT > 0) { const staggerT = s.staggerT - dt; return { v: 0, quietT: 0, staggerT: Math.max(0, staggerT), ended: staggerT <= 0 }; }
  let v = s.v + add, quietT = add > 0 ? 0 : s.quietT + dt;
  if (quietT > STAGGER.quiet) v -= STAGGER.ebb * dt;
  v = Math.max(0, v);
  return v >= STAGGER.full ? { v: 0, quietT: 0, staggerT: STAGGER.for, staggered: true } : { v, quietT, staggerT: 0 };
}
/** A blow's multiplier on a giant by its stagger: x2 staggered, x3 a heavy blow then (a critical). */
export const blowMult = (s, heavy = false) => (s.staggerT > 0 ? (heavy ? STAGGER.crit : STAGGER.mult) : 1);

/** The berserk: at or past `sync`, a mech that would fail runs on its own `for` real s, one chance in `odds` (thrown on your dice). */
export const BERSERK = { sync: 0.8, odds: 3, for: 12 };
export const berserkRoll = (sync, rand) => sync >= BERSERK.sync && rand() < 1 / BERSERK.odds; // (rand: the caller's stream: thrown on your dice)
