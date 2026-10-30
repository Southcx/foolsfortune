// ---------------------------------------------------------------------------------------
// SEEDS: how the Spirit Garden gains planetoids (South, 2026-10-30, by Calissa: "evaluate the module as far as how you could acquire more
// planetoids/their variance in size. Prior art was Super Mario Galaxy, but how can we take their systems and make them much more our
// own?"; docs/plans/SEEDS-SLABS-SCANS.md section 1). A planetoid is never bought. A SEED is earned by an act, once (the act's keepsake,
// as a Grand Star opens a dome); carried up by the god hand into a free slot of the ring (world/garden/orbit.js), it starts as a
// moonlet; FED (cubes, materials, the island's matter poured on by the hand), it grows a size at a time, and the player stops it where
// they like: its size is a choice, never a price list. Its kind gives its shape; what it was fed gives its tint. The seven feelings'
// moonlets are the exception: one at each awakening, tiny, on an inner ring close round the Dantian, never fed.
// Why: the garden is the world inside your Pneuka Jar, so its cosmos is built from what you lived (the acts) and shaped by your own
// hand (the feeding); Galaxy hands you planets, here you grow them. Skill skips grind (an act, not a sum), grind closes the gap (feeding
// is the sink, and pays for any size).
//
// Prior art: Super Mario Galaxy (the Comet Observatory's domes opened by Grand Stars; a Hungry Luma fed Star Bits becomes a planet; planets
// of every size and shape, a donut among them), Spore's solar system, Katamari Damacy's growth by what is rolled up, accretion (planets form
// by what they gather), Animal Crossing's house extended a room at a time.
//
//   SEEDS[id] = { kind, inner?, key, n, line }   seedsEarned(L) -> [id]   SHAPES[kind] = { body, line }   SIZES [{ id, r, plots, at }]
//   feedOf(item) -> { minutes, feeling }   (one feeding's worth)    MATTER_FEED (the hand's pour: minutes a cubic metre, a game day's cap)
//   sizeOf(minutes) -> { i, size, next, toNext }                    tintOf(fed { feeling: minutes }) -> { feeling, share } | null
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { STATS, FEED } from './spirits.js';

/** The seeds and the act that earns each (a ledger counter reaching `n`; once). `kind` is its shape. The six of the ring take a free slot
 *  of ORBIT (progress/realm.js); the seven moonlets stand on the inner ring and are never fed. Names placeholders, Espada's. */
export const SEEDS = {
  clay:    { kind: 'clay',    key: 'garden.enter',            n: 1,  line: 'Anagami gives a clay seed the first time you enter your garden.' },
  crystal: { kind: 'crystal', key: 'well.foe',                n: 1,  line: "A FOE's core, the first time one is beaten in a Well." },
  coral:   { kind: 'coral',   key: 'sea.square.done',         n: 1,  line: 'The first square of the open sea completed.' },
  bowl:    { kind: 'bowl',    key: 'spirit.wish.done',        n: 5,  line: "A spirit's dream of a home, at the fifth wish you answer." },
  ring:    { kind: 'ring',    key: 'god.mimic.perfect',       n: 5,  line: "The System's own ring, at the fifth mimicry puzzle copied for three stars." },
  bone:    { kind: 'bone',    key: 'slab.flawless',           n: 1,  line: 'The first slab carved flawless.' },
  // (the seven moonlets, one an awakening: the inner ring, never fed, a keepsake you can stand on)
  ...Object.fromEntries(['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'].map((f) => [`moonlet.${f}`,
    { kind: 'moonlet', inner: true, feeling: f, key: `feeling.known.${f}`, n: 1, line: `Awakening to ${f[0].toUpperCase() + f.slice(1)}.` }])),
};
/** The seeds the ledger has earned (the world side gives each once: a seed placed or waiting in the shed). */
export const seedsEarned = (L) => Object.keys(SEEDS).filter((id) => (L?.get?.(SEEDS[id].key) || 0) >= SEEDS[id].n);

/** A seed's kind and the body it grows (`body`: PlanetBody's shape; every kind is a sphere until Petra builds its own, `sphere` the
 *  fallback), with the line its card shows. */
export const SHAPES = {
  clay:    { body: 'sphere',  line: 'Round, all clay: the garden as it began.' },
  crystal: { body: 'faceted', line: 'Faceted; past medium it splits open like a geode and you can stand inside.' },
  coral:   { body: 'reef',    line: 'Grows branching reef arms out from a round heart.' },
  bowl:    { body: 'bowl',    line: 'A hemisphere, lived in from the inside.' },
  ring:    { body: 'torus',   line: 'A ring, walked on its inside and its outside (Galaxy\'s donut).' },
  bone:    { body: 'sphere',  line: 'Round, its clay full of Lachrymite fossils to dig.' },
  moonlet: { body: 'sphere',  line: 'Tiny, round, in its feeling\'s colour; hopped round in a second.' },
};

/** The sizes, by minutes of play fed (cumulative from the moonlet: 60, 120 and 240 more, the old planetoid prices' ladder, so a full set
 *  of large ones costs what the four bought did and more). `r` metres (a moonlet hopped round in seconds as Galaxy's tiny worlds; large
 *  the size of the first six's biggest), `plots` what it opens (SPIRIT-GARDEN.md: 4 to 8 for the planetoids that were bought). Past
 *  medium a planetoid keeps a moonlet of its own in close orbit, so size reads at a glance. */
export const SIZES = [
  { id: 'moonlet', r: 5,  plots: 1, at: 0 },
  { id: 'small',   r: 9,  plots: 4, at: 60 },
  { id: 'medium',  r: 14, plots: 6, at: 180 },
  { id: 'large',   r: 20, plots: 8, at: 420, moon: true },
];
export function sizeOf(minutes = 0) {
  let i = 0; while (i + 1 < SIZES.length && minutes >= SIZES[i + 1].at) i++;
  const next = SIZES[i + 1] || null;
  return { i, size: SIZES[i], next, toNext: next ? next.at - minutes : 0 };
}

/** The hand's pour of the island's matter onto a seed: minutes of growth a cubic metre (a full scoop, 20 m3, is 5 minutes), capped a
 *  game day so the free matter never outruns the sink (six scoops a game day; cubes and materials are never capped). */
export const MATTER_FEED = { perM3: 0.25, dayCap: 30 };
const FEELING_OF_KIND = Object.fromEntries(Object.entries(FEED.stat).map(([kind, stat]) => [kind, Object.keys(STATS).find((f) => STATS[f] === stat)]));
FEELING_OF_KIND.finery = 'gall'; FEELING_OF_KIND.art = 'fury'; // (Gall's and Fury's kinds: GALL-AND-FURY.md 10)
/** One feeding: `{ cubes }`, `{ material: { kind, tier }, worth }` or `{ matter: m3 }` -> the minutes of growth it gives and the feeling it
 *  tints toward (a material its kind's feeling; matter and cubes none). */
export function feedOf(item = {}) {
  if (item.cubes) return { minutes: item.cubes / ECON.perMinute, feeling: null };
  if (item.material) return { minutes: (item.worth || 0) / ECON.perMinute, feeling: FEELING_OF_KIND[item.material.kind] || null };
  if (item.matter) return { minutes: item.matter * MATTER_FEED.perM3, feeling: null };
  return { minutes: 0, feeling: null };
}
/** What a planetoid was fed, as its tint: the feeling fed most, if it is a third or more of all that was fed (else none: clay's own). */
export function tintOf(fed = {}) {
  let total = 0, top = null; for (const [f, m] of Object.entries(fed)) { total += m; if (f !== 'none' && (!top || m > fed[top])) top = f; }
  return top && fed[top] / total >= 1 / 3 ? { feeling: top, share: +(fed[top] / total).toFixed(2) } : null;
}
