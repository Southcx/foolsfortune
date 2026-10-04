// ---------------------------------------------------------------------------------------
// LUCK: not bought, not pressed at the Shrine: it rises from living through the statistically unlikely, good or bad (the owner's design
// document v0.1, section 5.5.2: "more likely to encounter the unusual"). Each unlikely thing counts by how surprising it was, its
// information in bits (-log2 of its chance: a one-in-a-hundred event is 6.6 bits, a coin toss 1), so a prismatic chest weighs more than
// a near miss and a lifetime of small oddities still adds up. It is a predicate over the ledger (stats.js), like the achievements: it
// needs no flag and is the same after a reload.
//
// What Luck sways is chance only (a critical, a deck on the margin), never a skill (docs/DESIGN.md, section 9). Nothing reads it yet
// (docs/plans/SYSTEMS.md, B6).
//
// Prior art: v0.1's Luck as "probabilistic stability"; Shannon's surprisal; the Fool's Journey, where fortune is what happens to you on
// the road; the Luck stat of Persona and Etrian Odyssey (it bends chance and nothing else).
//
//   UNLIKELY[key] = chance (the ledger counter of an unlikely event, and how likely it is)   luckOf(ledger) -> { bits, level }
// ---------------------------------------------------------------------------------------

/** The unlikely things the ledger already counts, each with its chance (from the tables: treasure.js, lockheart/table.js, ECON). */
export const UNLIKELY = {
  'chest.open.prismatic': 0.013,  // a prismatic chest (the Tithe's rate as met: progress/econ/odds.js)
  'chest.open.epic': 0.038,
  'chest.near': 0.42,             // a near miss on a sealed chest (bad luck counts too)
  'lockheart.out.nuke': 0.01,     // the jackpot out of a plain coffin
  'lockheart.out.bite': 0.05,     // the Shepherd's coffin biting back
  'fish.legend': 0.03,            // the legend of the Well
  'crystal.sweet.fragile': 0.15,  // a fragile formation opened at its sweet spot
};

/** Luck from the ledger: `bits` of surprise lived through, and a `level` (0 .. 99) that grows with the square root of it, so the first
 *  oddities count for more than the hundredth. */
export function luckOf(L) {
  let bits = 0;
  for (const [key, p] of Object.entries(UNLIKELY)) bits += (L.get(key) || 0) * -Math.log2(p);
  return { bits, level: Math.min(99, Math.floor(Math.sqrt(bits))) };
}
