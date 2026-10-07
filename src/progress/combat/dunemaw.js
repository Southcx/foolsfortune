// ---------------------------------------------------------------------------------------
// THE GREAT DUNEMAW'S RULES AS DATA (docs/plans/DUNEMAW-SYSTEMS.md; the owner, 2026-10-06: "a killer dungeon"): the crowned FOE's fight,
// the nursery's breeding, the finds and the warp, the Solar Skiffing trial, and Strawman. Numbers and small pure functions only: the
// bodies and minds are Petra's (creatures/), the look Calissa's, the words Espada's. Every number is in blows of power 1 (a plain shot:
// a slip jelly bursts at 8), in sim seconds (the game's own clock, which a pause stops and a replay sees), or in minutes of play
// (`ECON.perMinute`), and says why.
//
// Prior art: Monster Hunter's part breaks (a part with its own health, broken for a reward and a topple); Kirby's and Metroid's armour
// first, then the weak point; Zelda's Dodongo and the bullfight (the boss's own charge turned against it); Hollow Knight's stagger
// window; Etrian Odyssey's FOEs; Pilotwings' rings and Mario Kart's medals and ghosts; WoW's training dummies and a fighting game's
// training mode (infinite health, a readout per bout, switchable behaviour).
//
//   FOE  crackOf(type, cause) -> crack points   phase(foe) -> 'crown' | 'reel' | 'bare'   hitMult(phase, part, type) -> damage x
//   broodAt(hpShare, lastShare, clutchesLeft) -> brood to call   pay(end) -> { floors, items }
//   ARENA (the bowl's measures)   NURSERY   FINDS   findWorth(kind, floor, warped?) -> minutes of play   SOLAR  medalOf(seconds) -> 'gold' | 'silver' | 'bronze' | null
//   litRing(sunUp, shaded, weather) -> bool   STRAWMAN  bout(hits) -> { blows, seconds, damage, perSecond, byType, statuses }
// ---------------------------------------------------------------------------------------

/** THE CROWNED FOE. The urn is a pot: what breaks pots breaks it (Impact, the slam, its own ram into stone); everything else rings off
 *  it (the resist mark) for a chip. Three crack stages, then the core is bare. */
export const FOE = {
  cls: 2, halfWidth: 1.0, // (the Great Slip Jelly at class 2: a slip jelly's 0.5 m radius x1.6, squashed wider at a ram, crown included)
  hp: 48, // (six slip jellies' worth: the bare phase is about 24 plain blows, 12 on the core, a real minute or two of a fight)
  crown: {
    stage: 6, stages: 3, // (crack points a stage: 18 in all, about 12 heavy Impact blows, or three rams, or a mix)
    crack: { impact: 1.5, slam: 3, other: 0.25 }, // (a pot breaks to a blow, not to a feeling: the other four types only chip it)
    ram: 6, // (its own ram into a pillar or a stalactite: one whole stage; the bullfight is the clever way, the hammer the honest one)
    bodyChip: 0.25, // (blows to its sides while crowned: the slip takes them, a quarter lands)
  },
  ram: { telegraph: 1.0, speed: 11, range: 24, turn: 20, wallStun: 1, aim: 0 }, // (a 1 s scrape, then 11 m/s: faster than a sprint, slower than a
                                                                       //  dash, so it is sidestepped, never outrun; 24 m at most, 20° a second;
                                                                       //  `aim`: the aim is taken at this share of the scrape, 0 its start
                                                                       //  (Petra measured: aimed at the charge's start, the sidestep fails)
  slam: { within: 5, radius: 3 }, // (close in, it rears and slams a ring 6 m across)
  reel: { seconds: 4, mult: 3 }, // (the break: it reels, and every blow lands three times over; Hollow Knight's window, short on purpose)
  core: { mult: 2, body: 0.5 }, // (bare: the core takes double, the body half; the core moves with it, so aim is the skill)
  sink: { every: 12, seconds: 3, telegraph: 1.2 }, // (bare: it sinks every 12 sim s for 3 and surfaces with a slam, the slip's ring 1.2 s before)
  slide: { speed: 0.8, low: 1.5, lowAt: 0.33 }, // (the arena slides toward it in m/s, faster below a third: the mouth's antlion, inside)
  brood: { at: [0.66, 0.33], each: 3, hp: 2 }, // (it calls brood at two thirds and one third: three a call, from the clutches still whole)
  reprogramAt: 0.2, // (below a fifth of its health and reeling or stunned: the data drain can take it)
  pay: {
    burst: { floors: 2, items: [] }, // (ECON.well.foe floors' worth; the crown shard withdrawn, the owner 2026-10-07: cosmetics drop by achievement, DUNEMAW-EXTREME.md)
    reprogram: { floors: 1, items: [], nursery: true }, // (half the pay now; the nursery becomes the Spirit Garden's)
  },
};
const CRACK_TYPES = new Set(['impact']);
/** Crack points one blow of power 1 puts into the crown: Impact cracks, the slam cracks hard, its own ram a whole stage, the rest chip. */
export function crackOf(type, cause = '') {
  if (cause === 'ram') return FOE.crown.ram;
  if (cause === 'slam') return FOE.crown.crack.slam;
  return CRACK_TYPES.has(type) ? FOE.crown.crack.impact : FOE.crown.crack.other;
}
/** Which phase the FOE is in, from its crack points and the time since the break (sim seconds; null before it). */
export function phase({ crack = 0, sinceBreak = null } = {}) {
  if (crack < FOE.crown.stage * FOE.crown.stages) return 'crown';
  return sinceBreak != null && sinceBreak < FOE.reel.seconds ? 'reel' : 'bare';
}
/** What a blow's damage is multiplied by: the crown keeps the body behind it, the reel opens it, bare the core is the target. */
export function hitMult(ph, part = 'body', type = 'impact') {
  if (ph === 'crown') return part === 'crown' ? 0 : FOE.crown.bodyChip; // (a blow to the crown cracks it and does no harm through it)
  if (ph === 'reel') return FOE.reel.mult;
  return part === 'core' ? FOE.core.mult : FOE.core.body;
}
/** The brood it calls as its health falls past a mark: three a call, never more than the clutches still whole can give. */
export function broodAt(hpShare, lastShare, clutchesLeft) {
  let n = 0;
  for (const at of FOE.brood.at) if (lastShare > at && hpShare <= at) n += FOE.brood.each;
  return Math.min(n, clutchesLeft * NURSERY.clutch.brood);
}
export const pay = (end) => FOE.pay[end] || null;

/** THE ARENA (docs/plans/DUNEMAW-ARENA.md, Petra's to build): the bowl's measures in metres, bearings from north clockwise. */
export const ARENA = {
  radius: 28, roof: 30, dish: 4, // (degrees of the floor's slope to the centre)
  rim: { from: 22, depth: 0.4, wade: 0.7 }, upper: { from: 24, y: 4, bearings: [90, 270] }, ledge: { z: [26, 34], y: 6, width: 12 },
  pillars: { r: 18, bearings: [30, 90, 150, 210, 270, 330], width: 3, height: 12, cracks: 2 }, // (a pillar takes two rams: cracked, then fallen)
  stalactites: { r: 12, bearings: [0, 45, 90, 135, 180, 225, 270, 315], y: [14, 18] },
  pools: { centre: 6, ring: { r: 16, bearings: [0, 90, 180, 270], width: 4 }, depth: 2 },
  clutches: { r: 25, perQuadrant: 2, clear: 3 }, // (3 m or more from any pillar)
  wake: 20, // (the FOE wakes when the Courier is on the floor within 20 m of it)
};

/** THE NURSERY. The slip jellies breed in the slip; a clutch is part of the floor's seeded layout, so it comes back with the next game
 *  day's layout, never sooner (a run is a place in time: what is broken stays broken). */
export const NURSERY = {
  clutches: [1, 3, 8], // (a floor: one on the first as a hint, three on the second, eight in the great cavern round the FOE)
  clutch: { eggs: [3, 6], brood: 2, hatchSeconds: 20, cap: 3, hp: 3 }, // (eggs a clutch; brood it can give; one hatches every 20 sim s while
                                                                       //  a guard lives and the Courier is within 20 m, at most 3 out)
  guard: { radius: 12, leash: 10, alarm: 15 }, // (jellies within 12 m guard it, held 10 m to it; breaking it is an alarm heard at 15 m)
  roe: 0.3, roeItem: 'roe.slip', // (each egg broken leaves slip roe at this chance: the item roe.slip (pneuka/items.js), which a Spirit Garden bed grows)
};

/** THE FINDS. Pots are the town's (breakables, some holding a find); artifacts glint in the walls (the Dreamvane hears them). A warped
 *  artifact is worth three, and taking it shifts the floor: a risk that pays, read before it is taken (see DUNEMAW-SYSTEMS.md). */
export const FINDS = {
  pots: [12, 16, 20], holds: 0.25, // (pots a floor; the share that hold a find: the rest are just the satisfying break)
  potFind: { minutes: [0.5, 1.5] }, // (what a pot's find is worth: a few cubes, a curio from the deck, or a material)
  artifacts: [2, 3, 4], artifactMinutes: 4, // (in the walls a floor; each worth four minutes of play, deeper finds more by ECON.well.deeper)
  warped: { perFloor: 1, mult: 3, brood: 2 }, // (one warped artifact a floor, worth three; taking it shifts the floor and wakes two brood)
};
export function findWorth(kind, floor = 1, warped = false, deeper = 1.25) {
  const depth = deeper ** Math.max(0, floor - 1);
  if (kind === 'pot') return ((FINDS.potFind.minutes[0] + FINDS.potFind.minutes[1]) / 2) * depth;
  return FINDS.artifactMinutes * depth * (warped ? FINDS.warped.mult : 1);
}

/** THE SOLAR SKIFFING TRIAL. Rings of light across the dunes, charged by the sun: a ring in shade (a dune's shadow, the long rain, the
 *  pall) is dark and does not count. The course is the same all game day, and the sun makes three of it: noon all lit, the long shadows
 *  of dawn and dusk the hard one; at night the gnomon casts no shadow and the trial is closed. */
export const SOLAR = {
  rings: 24, limit: 90, // (rings on the course; the gnomon's shadow sweeps the dial once in 90 real seconds: the clock)
  missed: 2, // (seconds added for a lit ring missed; a dark ring costs nothing and pays nothing)
  medals: { gold: 60, silver: 72, bronze: 85 }, // (finishing times, with the penalties, in real seconds: Petra measures the line first)
  pay: { bronze: 3, silver: 6, gold: 10, allLit: 4 }, // (minutes of play, once a medal ever; and once for every lit ring taken at dawn or dusk)
  dim: ['grief', 'dread'], // (the long rain and the pall dim every ring: the trial is a fair-weather sport)
};
export const medalOf = (seconds) => (seconds <= SOLAR.medals.gold ? 'gold' : seconds <= SOLAR.medals.silver ? 'silver' : seconds <= SOLAR.medals.bronze ? 'bronze' : null);
/** Whether a ring is lit: the sun is up (dawn, daytime or dusk), the ring is not in a dune's shadow, and the weather does not dim it. */
export const litRing = (sunUp, shaded, aspect = null) => !!sunUp && !shaded && !SOLAR.dim.includes(aspect);

/** STRAWMAN. A creature like any other (hurtable, registered, struck through creatures.strike, so every weapon's path is the real path)
 *  whose health never falls, whose statuses hold their real times, which tires of nothing (no friendly-fire tolerance), and which the
 *  ledger never counts (`training`). It speaks once a bout: the log's one line when the blows stop. */
export const STRAWMAN = {
  boutGap: 4, // (real seconds without a blow end a bout, and the log says it)
  modes: ['still', 'guard', 'swing'], // (F at Strawman cycles: stands; blocks from the front; swings slowly every 3 s, telegraphed, for no harm)
  swing: { every: 3, telegraph: 0.8, harm: 0 },
};
/** A bout's sum from its blows ({ at (s), dmg, type, status? }): the readout, in place of floating numbers. */
export function bout(hits) {
  if (!hits.length) return null;
  const byType = {}, statuses = {};
  let damage = 0;
  for (const h of hits) { damage += h.dmg; byType[h.type] = (byType[h.type] || 0) + h.dmg; if (h.status) statuses[h.status] = (statuses[h.status] || 0) + 1; }
  const seconds = Math.max(0.1, hits[hits.length - 1].at - hits[0].at);
  return { blows: hits.length, seconds: +seconds.toFixed(1), damage: +damage.toFixed(1), perSecond: +(damage / seconds).toFixed(1), byType, statuses };
}
