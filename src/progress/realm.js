// ---------------------------------------------------------------------------------------
// THE INNER REALM AS A PLACE, IN NUMBERS: the planetoids and their plots, the features and their costs, the formation (Wu Xing on the
// five feelings), the spirits' drills, the visitors' wants and the tribulation's pace (docs/plans/SPIRIT-GARDEN.md; BUILD.md rounds 3
// and 4). Data and pure functions; the place, the Pneuka Jar's hop and the god hand's verbs are Petra's; prices are ECON.place.
//
// Prior art: Dark Cloud 2's Georama (a place built piece by piece against what its people want), Viva Pinata (visitors drawn by the
// garden's conditions, who settle when more are met), Monster Rancher's drills (one stat up, fatigue up, rest down), feng shui and Wu
// Xing (the generating and overcoming cycles, here on the game's five feelings: Espada's mapping, LORE.md), and xianxia's heavenly
// tribulation (lightning that grows with the stage being crossed).
//
//   PHASE[feeling]   GENERATES[f] -> f   OVERCOMES[f] -> f   formation(feature, neighbours, onVein) -> multiplier
//   PLANETOID_PLOTS[id] = { radius, plots }   FEATURES[id] = { size, job, does, firing }   costOf(feature, feeling) -> { cubes, material }
//   DRILLS[id] = { stat, gain }   drillGain(stat now, fatigue) -> points   FATIGUE   VISITORS[kind] = { wants, settle }   wantsMet(kind, garden) -> 0..1
//   TRIBULATION   strikesOf(firing) -> { strikes, every, outlined, may }
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';

// ---- the five feelings as the five phases (Espada, 2026-10-07: grief metal, dread water; the generating cycle runs in the shown order)
export const PHASE = { wonder: 'wood', mirth: 'fire', desire: 'earth', grief: 'metal', dread: 'water' };
export const GENERATES = { wonder: 'mirth', mirth: 'desire', desire: 'grief', grief: 'dread', dread: 'wonder' };
export const OVERCOMES = { wonder: 'desire', desire: 'dread', dread: 'mirth', mirth: 'grief', grief: 'wonder' };

/** A feature's multiplier from its neighbours (features in adjoining plots) and whether a spirit vein runs under its plot: each neighbour
 *  that generates it adds ECON.place.formation, each that overcomes it takes it away; a vein doubles the whole (ECON.place.vein). Never
 *  below half: a bad layout is weak, never dead. */
export function formation(feeling, neighbours = [], onVein = false) {
  const F = ECON.place.formation;
  let m = 1;
  for (const n of neighbours) { if (GENERATES[n] === feeling) m += F; else if (OVERCOMES[n] === feeling) m -= F; }
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
