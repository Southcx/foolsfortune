// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S LOAD, THE LACHRYMATO BOTTLES AND THE STAINS (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md): the Soul Brush is
// the tool of ENVIRONMENTAL Lachryma (the Lockheart drains it from enemies). It has two modes, as the Sondelass has forms:
//   PAINT  hold LMB: the brush SATURATES with Lachryma (as long as the psygun takes to charge fully), then sprays it: a feeling laid on
//          the ground (the bottle's grade if it holds one, else the draught: progress/stones.js). A short click is still the club.
//   MOP    hold LMB: the brush saturates, then drinks: environmental Lachryma (a stain of spilled crude, a puddle, a coated folk) is
//          scrubbed up into the LACHRYMATO BOTTLE. Out and in: paint spends the bottle, the mop fills it.
// A Lachrymato Bottle is worn against the upper back (its own place, not the tools' back): a reserve that feeds the pool and the brush.
// It is glass: a broken shield can crack it and spill it, and the spill is a stain where you stood. A full one gives off a signature.
// So a "tanky" build carries more and risks more; the core movement is never touched (CLAUDE.md).
// Stains are spilled crude, graded by feeling (the voyage's spills come ashore at the Shore). Left alone a stain grows by the game day,
// and a grown stain spawns an aberrant Figment (the bounties' quarry: Letty Marque). Cleaning is a Courier helping the place.
//
// Prior art: Super Mario Sunshine (FLUDD's tank and spray, the goop that spawns Piranha Plants and is cleaned for access, Shadow Mario
// painting it on), Splatoon (ink tank on the back, ink as territory, refill by swimming), Luigi's Mansion 3's Poltergust (suck and
// blow, one tool), PowerWash Simulator (a stain coming off as its own reward), Fallout's and Dark Souls' equip weight (a carried
// reserve as a trade, here paid in risk rather than speed).
//
//   BRUSH = { modes, saturate }   saturateTime(T) -> s   BOTTLES[id] = { capacity, feed, crack, spill, price }   STAINS   CLEAN
//   bottleFeed(bottle, held, poolShare, dt) -> Lachryma into the pool   crack(bottle, roll) -> spilled share | 0   stainStage(ageDays) -> 0..3
// ---------------------------------------------------------------------------------------

/** The brush's two modes (1 and 2 with the brush out, as the Sondelass's forms), and the saturation: the psygun's full charge time. */
export const BRUSH = {
  modes: ['paint', 'mop'],
  click: 0.13, // (a press shorter than this is a club blow, whatever the tank holds: the psygun's tap window)
  spray: { cost: 6, reach: 7, width: 1.2 }, // (paint: Lachryma a second from the bottle, else the pool; metres of throw; metres of stroke)
  mop: { rate: 12, reach: 2.4 }, // (mop: Lachryma a second drunk from a stain into the bottle; metres of reach)
};
/** How long the brush takes to saturate: the psygun's full charge (`T.charge.time`, Petra's feel), so the two tools share one rhythm. */
export const saturateTime = (T) => T?.charge?.time ?? 0.85;

/** The Lachrymato Bottles: aquarium glass on the upper back. Bigger holds more, cracks more easily, and spills more when it does. */
export const BOTTLES = {
  'bottle.small':  { capacity: 40,  feed: 6,  crack: 0.1,  spill: 0.3, price: 10 }, // (price: minutes of play, ECON.goods)
  'bottle.medium': { capacity: 80,  feed: 8,  crack: 0.2,  spill: 0.4, price: 25 },
  'bottle.large':  { capacity: 120, feed: 10, crack: 0.35, spill: 0.5, price: 50 },
};
// feed: Lachryma a second the bottle gives the pool while the pool is below half and regenerating (a reserve, not a second pool);
// crack: the chance a broken shield (vessel.shieldbreak) cracks it; spill: the share of what it holds that pours out as a stain.

/** What the bottle gives the pool this tick: only while the pool is below half, at the bottle's feed rate, never more than it holds. */
export function bottleFeed(bottle, held, poolShare, dt) {
  const B = BOTTLES[bottle];
  if (!B || held <= 0 || poolShare >= 0.5) return 0;
  return Math.min(held, B.feed * dt);
}
/** A broken shield's blow to the bottle: `roll` in [0, 1) from the simulation's stream; returns the share spilled, or 0. */
export const crack = (bottle, roll) => { const B = BOTTLES[bottle]; return B && roll < B.crack ? B.spill : 0; };

/** STAINS: spilled crude, graded by feeling. Left alone a stain grows a stage each game day; at the last stage it spawns an aberrant
 *  Figment (once, then it holds). Mopped up, its crude goes into the bottle (its grade colours what is painted next). */
export const STAINS = {
  stages: 3, perDay: 1, // (a stage a game day: a stain left for three game days spawns)
  crude: [10, 20, 35, 50], // (Lachryma it holds at each stage, 0..3: what the mop drinks)
  spawn: { at: 3, kind: 'slipjelly', aberrant: true }, // (the aberrant: a slip jelly gone wrong, a bounty's quarry)
  shore: 2, // (stains a crossing's spill puts on the Shore, beside the voyage's spill: progress/voyage.js)
};
export const stainStage = (ageDays) => Math.max(0, Math.min(STAINS.stages, Math.floor(ageDays * STAINS.perDay)));

/** CLEANING as pay: what a stain hid (access, a find) and the crude itself (into the bottle); about half the aim as a loop. */
export const CLEAN = { findChance: 0.25, aim: 0.5 }; // (the share of stains hiding a find, a pot's worth; the loop's pay x the aim)
