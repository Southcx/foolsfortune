// ---------------------------------------------------------------------------------------
// FRIENDLY FIRE: what a blow does to an ally (another player's Courier, a division's clay folk form in co-op). The owner, 2026-10-05:
// friendly fire is on, at a fifth of the damage; statuses land on allies too, but an ally's TOLERANCE to a status rises very fast, so a
// status put on a friend is a trick once, not a lock. Data and pure functions; creatures.strike (or the co-op layer) reads it when the
// target is an ally. (Allied creatures, the spirits, are a different case: the Courier's blows pass through them, CLAUDE.md.)
//
// Tolerance: each time an ally takes a status from an ally, the next one of that status needs `buildMult` times the build-up and holds
// `durMult` of the time; the `immuneAt`th within the window is shrugged off; `windowSec` without one resets it.
//
// Prior art: Monster Hunter's status tolerance (every application raises the next threshold), World of Warcraft's diminishing returns
// (full, half, quarter, immune, reset after 18 s), and the co-op shooters' attenuated friendly fire (Left 4 Dead's normal difficulty,
// Helldivers' honesty in reverse: here it stings, it does not kill).
//
//   FRIENDLY = { damage, buildMult, durMult, immuneAt, windowSec }      friendlyDamage(dmg) -> dmg      tolerance(n) -> { build, dur } | null
// ---------------------------------------------------------------------------------------

export const FRIENDLY = { damage: 0.2, buildMult: 2, durMult: 0.5, immuneAt: 3, windowSec: 20 };

/** What a blow deals to an ally. */
export const friendlyDamage = (dmg) => dmg * FRIENDLY.damage;

/** The `n`th status of one kind from allies within the window (0 the first): how much more build-up it needs and how long it holds,
 *  or null when the ally now shrugs it off. 0: x1 / x1; 1: x2 / x0.5; 2: immune. */
export function tolerance(n = 0) {
  if (n >= FRIENDLY.immuneAt - 1) return null;
  return { build: Math.pow(FRIENDLY.buildMult, n), dur: Math.pow(FRIENDLY.durMult, n) };
}
