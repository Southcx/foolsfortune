// ---------------------------------------------------------------------------------------
// THE BESTIARY: what lives in the Weir. Psychospiritual entities: the shapes feelings take when they pool and have nowhere to go.
// They are drawn to the Courier's own mind, projected on the Sondelass's lure as an ASPECT, and each is drawn to some aspects
// more than others. Every entry says what it is, where it lives (depth band), when it comes (the tide), how it bites and how it
// fights. Sizes and weights are rolled per fish; the records are kept in the ledger.
//
// Prior art, and what was taken:
//  - Final Fantasy XIV's Fish Guide: a fish belongs to a place, a bait and a window of time; the tide here is the weather/time
//    window; the aspect is the bait; the entries stay unknown ("???") until caught; the bite itself is graded by how it feels
//    (a nibble, a tug, a gulp: FFXIV's ! / !! / !!!) and the hook set has to answer it.
//  - Final Fantasy XI's fishing: a fish has a stamina bar that the fight wears down, and a pull it tries to take you with.
//  - Old School RuneScape's Fishing / Collection Log: one slot per species, records by size, everything counted.
//  - Animal Crossing / Zelda: the silhouette in the water tells you roughly how big it is before it bites.
//  - Dredge: the fish are the horror. They are a little wrong; the deep ones more so.
// ---------------------------------------------------------------------------------------
export const ASPECTS = [
  { id: 'dread', name: 'DREAD', glyph: '◐', color: 0x8a6ad0, hint: 'the cold that comes before a shape' },
  { id: 'wonder', name: 'WONDER', glyph: '✦', color: 0xffd76a, hint: 'the held breath at the top of a stair' },
  { id: 'grief', name: 'GRIEF', glyph: '☂', color: 0x8fc4ff, hint: 'a room kept exactly as it was' },
  { id: 'desire', name: 'DESIRE', glyph: '◍', color: 0xff7a4a, hint: 'wanting, with nothing yet in mind' },
  { id: 'mirth', name: 'MIRTH', glyph: '♪', color: 0x9be36a, hint: 'a laugh that has lost its joke' },
];
export const ASPECT_IDX = Object.fromEntries(ASPECTS.map((a, i) => [a.id, i]));
/** The order the five are shown in, most positive to most negative (the owner's ruling: GLOSSARY, DISPLAY_ORDER), as indices into
 *  ASPECTS. ASPECTS keeps its own order: every species' `aff` and every lure's profile is indexed by it. */
export const SHOWN = ['wonder', 'mirth', 'desire', 'grief', 'dread'].map((id) => ASPECT_IDX[id]);

/** The Weir's tide: four windows, each 80 s. Species come at some of them. */
export const TIDES = [
  { id: 'low', name: 'LOW', lamp: 0x7a4a3a },
  { id: 'rising', name: 'RISING', lamp: 0xffb27a },
  { id: 'high', name: 'HIGH', lamp: 0xfff0d0 },
  { id: 'falling', name: 'FALLING', lamp: 0xb46aa0 },
];
export const TIDE_LEN = 80;

// style: how it fights (fight.js): drift | dart | thrash | run | sweep | leap | anchor | legend
// mooch: what it is drawn to when the lure carries the echo of a fish just landed (FFXIV's mooching: a small catch is bait for a large one)
// needsEcho: it will not come to anything less (the Drowned Lachryma wants the echo of something large)
// bite: what the bite feels like, in the order it escalates (nibble < tug < gulp)
// aff: how much each aspect draws it (dread, wonder, grief, desire, mirth: ASPECTS' order)
export const SPECIES = [
  {
    id: 'regret', name: 'Pale Regret', blurb: 'A translucent carp that turns to look back at where it has just been. It rings faintly when it swims.',
    tier: 1, aff: [0.1, 0.2, 1.0, 0.3, 0.05], depth: [0.4, 2.6], tides: [0, 1, 3], size: [26, 62], kg: 2.4, rarity: 12, color: 0xd9e6ff,
    style: 'drift', pull: 0.34, stamina: 9, thrash: 0.1, bite: ['nibble', 'tug'], window: 1.25, inspect: [2.5, 6], sense: 8, lach: 8, shy: 0.15, mooch: ['comet'], mooch: ['mirth', 'thread'], mooch: ['mirth', 'regret'], body: 'carp',
  },
  {
    id: 'mirth', name: 'Tin Mirth', blurb: 'A shoal-fish, a hand long, that laughs in a voice like a spoon on a cup. Bites before it has decided to.',
    tier: 1, aff: [0.05, 0.3, 0.05, 0.25, 1.0], depth: [0.2, 1.8], tides: [1, 2, 3], size: [9, 24], kg: 0.6, rarity: 16, color: 0xe6f7a0,
    style: 'dart', pull: 0.24, stamina: 5, thrash: 0.05, bite: ['nibble', 'nibble', 'tug'], window: 0.7, inspect: [0.8, 2.4], sense: 7, lach: 4, shy: 0.4, body: 'minnow',
  },
  {
    id: 'bellows', name: 'Bellows Carp', blurb: 'Round, patient and enormous of mouth. It fills with whatever you offer it, and then keeps going.',
    tier: 1, aff: [0.15, 0.2, 0.2, 1.0, 0.55], depth: [0.6, 3.2], tides: [0, 1, 2], size: [24, 58], kg: 3.4, rarity: 13, color: 0xffc38a,
    style: 'anchor', pull: 0.46, stamina: 11, thrash: 0.18, bite: ['tug', 'gulp'], window: 1.4, inspect: [2, 5], sense: 8, lach: 9, shy: 0.1, body: 'puff',
  },
  {
    id: 'thread', name: "Widow's Thread", blurb: 'A ribbon of a fish, all length. It takes the line for a relation and goes to see the others.',
    tier: 2, aff: [0.55, 0.15, 0.85, 0.1, 0.1], depth: [1.2, 4.2], tides: [0, 3], size: [70, 150], kg: 1.6, rarity: 8, color: 0xc7a6ff,
    style: 'sweep', pull: 0.5, stamina: 12, thrash: 0.15, bite: ['tug', 'tug'], window: 1.0, inspect: [3, 7], sense: 9, lach: 15, shy: 0.25, mooch: ['mirth'], body: 'ribbon',
  },
  {
    id: 'comet', name: 'Quiet Comet', blurb: 'It crosses the pool in one stroke and leaps clear of it, and for a moment the room is very still.',
    tier: 2, aff: [0.1, 1.0, 0.1, 0.2, 0.5], depth: [0.2, 2.0], tides: [2, 1], size: [18, 44], kg: 0.9, rarity: 7, color: 0xfff1a8,
    style: 'leap', pull: 0.42, stamina: 8, thrash: 0.3, bite: ['tug'], window: 0.6, inspect: [1.2, 3], sense: 10, lach: 14, shy: 0.5, body: 'comet',
  },
  {
    id: 'wonder', name: 'Wonder Ray', blurb: 'A slow wing of light, sailing over the deep the way a hand passes over a face. Almost too gentle to hook.',
    tier: 3, aff: [0.05, 1.0, 0.35, 0.05, 0.3], depth: [1.6, 5.0], tides: [1, 2], size: [60, 140], kg: 2.2, rarity: 5, color: 0xffe7a0,
    style: 'drift', pull: 0.58, stamina: 16, thrash: 0.2, bite: ['nibble', 'nibble', 'gulp'], window: 1.1, inspect: [4, 9], sense: 11, lach: 26, shy: 0.3, body: 'ray',
  },
  {
    id: 'hunger', name: 'Hollow Hunger', blurb: 'An eel with a very long throat and nothing at the end of it. It does not take the lure. It takes the direction.',
    tier: 3, aff: [0.4, 0.05, 0.1, 1.0, 0.05], depth: [2.4, 5.4], tides: [0, 3, 1], size: [90, 190], kg: 3.2, rarity: 5, color: 0xff9a70,
    style: 'run', pull: 0.72, stamina: 20, thrash: 0.25, bite: ['tug', 'gulp'], window: 0.9, inspect: [2, 5], sense: 10, lach: 30, shy: 0.2, body: 'eel',
  },
  {
    id: 'dread', name: 'Lantern Dread', blurb: 'It hangs a small warm light in front of its face, so you will come close. Every part of you knows not to.',
    tier: 3, aff: [1.0, 0.1, 0.3, 0.35, 0.0], depth: [3.0, 6.0], tides: [0, 3], size: [50, 120], kg: 4.0, rarity: 4, color: 0xb59aff,
    style: 'thrash', pull: 0.66, stamina: 15, thrash: 0.6, bite: ['gulp'], window: 0.55, inspect: [3, 8], sense: 12, lach: 34, shy: 0.35, body: 'angler',
  },
  {
    id: 'hush', name: 'Mother Hush', blurb: 'Vast, flat and very old. She does not fight. She simply does not come, and you find you are the one being reeled.',
    tier: 4, aff: [0.35, 0.1, 1.0, 0.2, 0.0], depth: [3.6, 6.4], tides: [0], size: [150, 270], kg: 5.4, rarity: 2, color: 0x9fb3c8,
    style: 'anchor', pull: 0.82, stamina: 34, thrash: 0.12, bite: ['nibble', 'nibble', 'gulp'], window: 1.3, inspect: [6, 12], sense: 13, lach: 80, shy: 0.05, mooch: ['regret', 'bellows'], body: 'catfish',
  },
  {
    id: 'lachryma', name: 'The Drowned Lachryma', blurb: 'What the workshop weeps, all in one place, given a shape it did not ask for. It has been waiting for someone with a mind worth borrowing.',
    tier: 5, aff: [1, 1, 1, 1, 1], depth: [5.0, 9.0], tides: [2], size: [640, 930], kg: 3.0, rarity: 0, color: 0xffb27a, legend: true,
    style: 'legend', pull: 0.9, stamina: 70, thrash: 0.4, bite: ['nibble', 'nibble', 'gulp'], window: 1.6, inspect: [8, 14], sense: 18, lach: 400, shy: 0, needsEcho: true, mooch: ['hush', 'dread', 'hunger', 'wonder'], body: 'leviathan',
  },
];
export const BY_SPECIES = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

/** How the size reads: a class name for the log and the ledger. */
export function sizeClass(sp, cm) {
  const k = (cm - sp.size[0]) / Math.max(1, sp.size[1] - sp.size[0]);
  return k > 0.92 ? 'giant' : k > 0.68 ? 'large' : k > 0.3 ? 'fine' : 'small';
}
export const weightOf = (sp, cm) => +(sp.kg * Math.pow(cm / ((sp.size[0] + sp.size[1]) / 2), 3)).toFixed(2);
