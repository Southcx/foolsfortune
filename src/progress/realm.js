// ---------------------------------------------------------------------------------------
// THE INNER REALM AS A PLACE, IN NUMBERS: the planetoids and their plots, the features and their costs, the formation (Wu Xing on the
// five feelings), the spirits' drills, the visitors' wants and the tribulation's pace (docs/plans/SPIRIT-GARDEN.md; BUILD.md rounds 3
// and 4). Data and pure functions; the place, the Pneuka Jar's hop and the god hand's verbs are Petra's; prices are ECON.place.
//
// Prior art: Dark Cloud 2's Georama (a place built piece by piece against what its people want), Viva Pinata (visitors drawn by the
// garden's conditions, who settle when more are met), Monster Rancher's drills (one stat up, fatigue up, rest down), feng shui and Wu
// Xing (the generating and overcoming cycles, here on the game's five feelings: Espada's mapping, LORE.md), xianxia's heavenly
// tribulation (lightning that grows with the stage being crossed), From Dust (ground and water as the god's paint), feng shui's dragon
// veins (they run along ridges), the Chao Garden's races, Super Mario Galaxy's observatory (planetoids ringed round a hub), and Animal
// Crossing's visitors (they look and leave a gift; they do not dig).
//
//   PHASE[feeling]   GENERATES[f] -> f   OVERCOMES[f] -> f   formation(feature, neighbours, onVein) -> multiplier
//   PLANETOID_PLOTS[id] = { radius, plots }   FEATURES[id] = { size, job, does, firing }   costOf(feature, feeling) -> { cubes, material }
//   DRILLS[id] = { stat, gain }   drillGain(stat now, fatigue) -> points   FATIGUE   VISITORS[kind] = { wants, settle }   wantsMet(kind, garden) -> 0..1
//   TRIBULATION   strikesOf(firing) -> { strikes, every, outlined, may }
//   GROUND[material]   GROWTH   WATERS   mixWater(a, b) -> { feeling, volume }   VEIN   veinEnd(heights) -> index   RACE   raceSpeed(spirit, stretch, done)
//   SPAR   SETTLE   ORBIT   orbitSlot(n) -> { angle, radius, tilt }   RAIN   rainOf(state) -> 0..1   GUEST (the rules for SPIRIT-GARDEN.md's list)
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';

// ---- the five feelings as the five phases (Espada, 2026-10-07: grief metal, dread water; the generating cycle runs in the shown order)
export const PHASE = { wonder: 'wood', mirth: 'fire', desire: 'earth', grief: 'metal', dread: 'water' };
export const GENERATES = { wonder: 'mirth', mirth: 'desire', desire: 'grief', grief: 'dread', dread: 'wonder' };
export const OVERCOMES = { wonder: 'desire', desire: 'dread', dread: 'mirth', mirth: 'grief', grief: 'wonder' };

/** A feature's multiplier from its neighbours (features in adjoining plots) and whether a spirit vein runs under its plot: each neighbour
 *  that generates it adds ECON.place.formation, each that overcomes it takes it away; a vein doubles the whole (ECON.place.vein). Never
 *  below half: a bad layout is weak, never dead. */
export function formation(feeling, neighbours = [], onVein = false, { ground = null, water = null } = {}) {
  const F = ECON.place.formation;
  let m = 1;
  // (the ground a feature stands on and the water that reaches it count as one neighbour each: GROUND and WATERS below)
  for (const n of [...neighbours, GROUND_FEELING[ground], water].filter(Boolean)) { if (GENERATES[n] === feeling) m += F; else if (OVERCOMES[n] === feeling) m -= F; }
  return Math.max(0.5, m) * (onVein ? ECON.place.vein : 1);
}

/** The first planetoids (SPIRIT-GARDEN.md section 3): radius in metres, plots to place features in, and what is fixed there. The
 *  bought ones (ECON.place.planetoids) are 8 to 16 m with 4 to 8 plots, chosen by the player's sculpting. */
export const PLANETOID_PLOTS = {
  dantian:   { radius: 20, plots: 6, fixed: ['arrival lotus', 'the Lachryma lake', 'the Pneuka Box shed'] },
  terraces:  { radius: 12, plots: 6, fixed: [] },
  athanor:   { radius: 10, plots: 3, fixed: ['the spirit press', 'the plate shrine'] },
  pavilions: { radius: 14, plots: 5, fixed: [] },
  mulberryGrove: { radius: 16, plots: 8, fixed: ['the cocoon tree'] },
  chimney:   { radius: 8, plots: 2, fixed: ['the meditation mat'] },
};

/** The features: what each is for, its size (ECON.place.features prices it), and its job's number (before formation). A feature is
 *  placed with a feeling, chosen at placing, and costs one material of that feeling's kind (progress/spirits.js FEED.stat, read back).
 *  `firing`: the Firing that opens it (progress/spirits.js FIRINGS; the PLACE page lists only what is open). The first Firing gives
 *  the first visit something to do with its hands (a bed, water, light: Animal Crossing's first day is a tent, a fruit tree and a
 *  river); the second the formation's play (stones, incense) and the dividend's slot, once an encounter can have been mastered; the
 *  third room for more spirits, once a few are caught; the fourth the drills, once there are spirits worth training (Monster
 *  Rancher opens its harder drills late). Never a number on the Courier: a Firing opens verbs. */
export const FEATURES = {
  terrace:    { size: 'medium', job: 'grow',    does: 'a bed: a material planted grows more of its kind', n: 1, firing: 1 },
  pavilion:   { size: 'large',  job: 'work',    does: 'a dividend slot: a mastered encounter works it', n: 1, firing: 2 },
  spiritHouse:{ size: 'medium', job: 'shelter', does: 'room for two more spirits', n: 2, firing: 3 },
  pond:       { size: 'medium', job: 'water',   does: 'a pond of Lachryma; visitors drink; led downhill by sculpting', n: 1, firing: 1 },
  lantern:    { size: 'small',  job: 'light',   does: 'light: the moonflower blooms in it, visitors of the night come to it', n: 1, firing: 1 },
  incense:    { size: 'small',  job: 'calm',    does: 'the draught settles faster while the Jar rests near it (a tenth of a game hour sooner a burner)', n: 0.1, firing: 2 },
  stone:      { size: 'small',  job: 'empower', does: 'a formation stone: its neighbours count it twice in their formation', n: 2, firing: 2 },
  drillYard:  { size: 'large',  job: 'drill',   does: 'the spirits drill here (DRILLS)', n: 1, firing: 4 },
  sporebed:   { size: 'small',  job: 'transmute', does: 'a spore bed: a strain of fungus works what you set in it (progress/sporebeds.js); placed in a feeling you hold spores of, it takes that strain', n: 1, firing: 1 },
};
const KIND_OF = { mirth: 'mechanism', wonder: 'arcane', desire: 'edge', grief: 'provision', dread: 'eldritch' };
/** What placing a feature costs: cubes by its size, and one material of its feeling's kind. */
export const costOf = (feature, feeling = 'wonder') => ({ cubes: Math.round((ECON.place.features[FEATURES[feature]?.size] || 0) * ECON.perMinute), material: KIND_OF[feeling] || null });

// ---- the spirits' drills (Monster Rancher): a drill raises one stat, by less the higher it is, and tires the spirit; rest restores it
export const DRILLS = {
  sprint: { stat: 'mirth', gain: 18 }, scout: { stat: 'wonder', gain: 18 }, haul: { stat: 'desire', gain: 18 },
  swim: { stat: 'grief', gain: 18 }, sit: { stat: 'dread', gain: 18 },
};
/** Fatigue: each drill adds `perDrill`; past `fail` a drill does nothing (the spirit sulks); rest takes `perHour` a game hour away. */
export const FATIGUE = { perDrill: 20, fail: 80, perHour: 10 };
/** The points a drill gives at a stat now (0..999) and a fatigue now (0..100): the gain shrinks as the stat climbs (the square root of
 *  what is left), and halves past half fatigue. From 0 to 999 takes about 100 drills: a few game weeks of a spirit's training. */
export function drillGain(stat = 0, fatigue = 0, gain = 18) {
  if (fatigue >= FATIGUE.fail) return 0;
  return Math.max(1, Math.round(gain * Math.sqrt(1 - Math.min(999, stat) / 999) * (fatigue > 50 ? 0.5 : 1)));
}

// ---- visitors (Viva Pinata): a wild Figment of a kind visits when the garden has what it wants, settles after `settle` visits
export const VISITORS = {
  slipjelly: { wants: { feature: { pond: 1 }, feeling: { grief: 2 } }, settle: 3, does: 'slip jellies come to a pond in a grieving garden' },
  clapperjar: { wants: { feature: { lantern: 2 }, feeling: { mirth: 2 } }, settle: 3, does: 'clapperjars come to lights in a merry garden' },
  glint: { wants: { feature: { pond: 2 }, feeling: { wonder: 2 } }, settle: 4, does: 'glints come to deep water in a wondering garden' },
  lobber: { wants: { feature: { drillYard: 1 }, feeling: { desire: 2 } }, settle: 3, does: 'lobbers come to a drill yard in a wanting garden' },
};
/** How far the garden meets a kind's wants, 0..1: `garden` = { features: { id: n }, feelings: { f: n } } (features placed, by feeling).
 *  At 1 the kind visits once a game day; each visit while met counts toward settling. */
export function wantsMet(kind, garden = {}) {
  const W = VISITORS[kind]?.wants;
  if (!W) return 0;
  const parts = [...Object.entries(W.feature || {}).map(([f, n]) => Math.min(1, (garden.features?.[f] || 0) / n)), ...Object.entries(W.feeling || {}).map(([f, n]) => Math.min(1, (garden.feelings?.[f] || 0) / n))];
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
}

// ---- the tribulation (the Heavenly Kiln): lightning outlined where it will land, parried by the hand's flick or dodged by a hop
export const TRIBULATION = { base: 12, more: 4, every: 1.2, faster: 0.9, may: 3 };
/** A Firing's tribulation: how many strikes, how far apart (real seconds), and how many may land before it is failed. The first is 16
 *  strikes 1.08 s apart (about 17 real seconds); the sixth 36 strikes 0.64 s apart (about 23 real seconds, and fierce). Every strike is
 *  outlined (PARRY.md): the skill is reading, not luck. */
export const strikesOf = (firing = 1) => ({ strikes: TRIBULATION.base + TRIBULATION.more * firing, every: +(TRIBULATION.every * TRIBULATION.faster ** firing).toFixed(2), outlined: true, may: TRIBULATION.may });

// ---- THE FEATURE LIST'S RULES (SPIRIT-GARDEN.md, "The feature list", 2026-10-07: Petra's draft, the owner's order)

/** 6. The ground's materials, one a phase, painted by the god hand. Free: the ground is yours, and sculpting is play, not a sink (From
 *  Dust); what costs is what is placed on it. A feature counts its ground as one neighbour in its formation; a bed on its own feeling's
 *  ground grows GROWTH.ground times as fast; plants spread only onto ground that `spreads` (15 in the list). */
export const GROUND = {
  moss: { phase: 'wood', feeling: 'wonder', spreads: true }, ash: { phase: 'fire', feeling: 'mirth', spreads: false },
  loam: { phase: 'earth', feeling: 'desire', spreads: true }, slate: { phase: 'metal', feeling: 'grief', spreads: false },
  silt: { phase: 'water', feeling: 'dread', spreads: true },
};
/** A bed grows `ground` times as fast on its own feeling's ground and `water` times watered with it (both: their product). */
export const GROWTH = { ground: 1.25, water: 1.25 };
const GROUND_FEELING = Object.fromEntries(Object.entries(GROUND).map(([k, g]) => [k, g.feeling]));

/** 11. Water keeps a feeling: the Dantian's lake the draught you entered with, a spring the feeling chosen when it is placed (a feature
 *  of its own: costs as a small one), rain the garden's weather (RAIN). Water reaching a feature counts as one neighbour in its formation;
 *  a bed watered with its own feeling grows GROWTH.water times as fast; a spirit that drinks its stat's
 *  feeling gains `drink` points a game hour (as a feed, never past FEED's cap). Opposite feelings mixed cancel to fair water (the glossary:
 *  opposites never make an agate); otherwise the larger volume's feeling holds. */
export const WATERS = { drink: 1, opposite: { wonder: 'grief', grief: 'wonder', mirth: 'dread', dread: 'mirth', desire: null } };
export function mixWater(a = {}, b = {}) {
  const volume = (a.volume || 0) + (b.volume || 0);
  if (!a.feeling || !b.feeling) return { feeling: a.feeling || b.feeling || null, volume };
  if (WATERS.opposite[a.feeling] === b.feeling) return { feeling: Math.abs((a.volume || 0) - (b.volume || 0)) > volume * 0.5 ? ((a.volume || 0) > (b.volume || 0) ? a.feeling : b.feeling) : null, volume };
  return { feeling: (a.volume || 0) >= (b.volume || 0) ? a.feeling : b.feeling, volume };
}

/** 13. A spirit vein runs between two planetoids and ends, on each, at the highest ground within `cone` degrees of the direction to the
 *  other (feng shui: dragon veins run along ridges). So sculpting moves it: raise a ridge and the vein's end follows it; water never
 *  moves it. A feature within `reach` metres of a vein's end is on the vein (formation's x2). Recomputed when a stroke ends. */
export const VEIN = { cone: 35, reach: 3 };
/** The index of the cell a vein ends at: `cells` = [{ height, angle }] (angle in degrees off the direction to the other planetoid). */
export const veinEnd = (cells = []) => cells.reduce((best, c, i) => (c.angle <= VEIN.cone && (best < 0 || c.height > cells[best].height) ? i : best), -1);

/** 17. Races (the Chao Garden's): a track is a carved groove that closes on itself (at least `minLength` metres) on one planetoid; up to
 *  four spirits run it. Each stretch is read from a stat: flat by mirth (speed), climbs by desire (strength), water by dread (will),
 *  length by grief (stamina: the last third slows without it), and wonder (sight) finds the inside line. Races pay no cubes (no currency
 *  but cubes, and none from play inside you): the ledger's records and their achievements, and bond. */
export const RACE = { minLength: 40, runners: 4, bond: 2, base: 4, per999: 3 };
/** Metres a real second for a spirit on a kind of stretch ('flat' | 'climb' | 'water'), and the share of the track left when it tires. */
export function raceSpeed(spirit, stretch = 'flat', done = 0) {
  const st = spirit?.stats || {}, by = { flat: 'mirth', climb: 'desire', water: 'dread' }[stretch] || 'mirth';
  const v = RACE.base + RACE.per999 * (st[by] || 0) / 999, line = 1 + 0.1 * (st.wonder || 0) / 999;
  const tired = done > 2 / 3 ? 0.7 + 0.3 * (st.grief || 0) / 999 : 1;
  return +(v * line * tired).toFixed(3);
}
/** Sparring at the Chimney: two of your spirits (or yours and a guest's), nobody hurt: each gains `gain` points in its strongest stat,
 *  `fatigue` fatigue (FATIGUE), and alignment toward Chaos (ALIGN.spar, progress/spirits.js). Ends at the first to tire or `seconds`. */
export const SPAR = { gain: 6, fatigue: 25, seconds: 45 };
/** Settling: a visitor whose wants are met (wantsMet = 1) on a visit counts it; after VISITORS[kind].settle such visits it settles and is
 *  bound, free (no catch), if a spirit house has room; else it keeps visiting. A visit missed does not reset the count (Viva Pinata is
 *  patient); a want lost for `lapse` game days does. */
export const SETTLE = { lapse: 3 };

/** 19. Where a bought planetoid sits: a ring round the Dantian (Galaxy's observatory: domes round a hub). The god hand carries the
 *  planetoid's seed into the sky and lets go; it takes the nearest free slot of `slots`, at `radius` metres from the Dantian's heart and
 *  `tilt` degrees above or below its equator by turn, and grows launch lotuses to its two nearest neighbours and a vein to each. */
export const ORBIT = { slots: 10, radius: 95, tilt: 12 };
export const orbitSlot = (n = 0) => ({ angle: +((360 / ORBIT.slots) * (n % ORBIT.slots)).toFixed(1), radius: ORBIT.radius, tilt: n % 2 ? -ORBIT.tilt : ORBIT.tilt });

/** 20. The garden's weather is you: the draught's feeling falls as rain inside the Jar, as hard as your mental state is liquid (Stoic
 *  and Resolved dry, Balanced a drizzle, Fluid rain, Prismatic a storm), so drinking Lachryma in the world waters the garden, and
 *  meditating at the Chimney (settling you) clears it. Brimming adds `brim`. Rain is a water source of the draught's feeling (WATERS). */
export const RAIN = { Stoic: 0, Resolved: 0, Balanced: 0.2, Fluid: 0.5, Prismatic: 0.9, brim: 0.1 };
export const rainOf = ({ state = 'Balanced', brimming = false } = {}) => Math.min(1, (RAIN[state] ?? 0) + (brimming ? RAIN.brim : 0));

/** 21. A guest in your garden (over the room, COOP.md): their Pneuka Jar on your planetoids, hopping and looking; their god hand may pet
 *  your spirits (bond to both), spar one of theirs with one of yours at the Chimney, and leave `gifts` material a visit in the shed's
 *  gift slot. It never sculpts, paints, places, waters, catches, releases or takes (Animal Crossing's visitors do not dig): your inner
 *  world is yours. Nothing a guest does moves the economy beyond the gift. */
export const GUEST = { gifts: 1, may: ['hop', 'look', 'pet', 'spar', 'gift'] };
