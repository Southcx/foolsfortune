// ---------------------------------------------------------------------------------------
// THE SPIRITS AND THE FIRINGS: what a bound spirit is, how it grows, how two merge, and how far the soul has been refired
// (docs/plans/SPIRIT-GARDEN.md, sections 5 to 6; the owner, 2026-10-07). Data and pure functions; the garden as a place, the Pneuka
// Jar's hop and the god hand's verbs are Petra's (BUILD.md, rounds 2 to 4), the spirits' looks Calissa's, their names Espada's.
//
// A SPIRIT is a Figment bound to you (caught by the Lockheart or by the god hand: tools/lockheart/table.js CATCH; awakened from a
// plate; dug as a fossil; a visitor who settled; or two merged). It is bound until you release it: it never leaves, fades or dies (the
// owner: "Pokemon don't release themselves"). Five stats, one a feeling; fed by what the game already drops; aligned on the Law-Chaos
// line by the hand's pet and flick; maturing into a form by its strongest feeling and its alignment.
// THE FIRINGS (the owner's word: "can scale to any number"): the soul refired, read from the sum of the attributes' ranks (Soul
// Alchemy, ledger `alchemy.rank.<attribute>`) and crossed by the tribulation at the Meditation Peak. Never a level: a Firing opens
// places and verbs, never numbers on the Courier (DESIGN.md: no experience points, no levels).
//
// Prior art: Sonic Adventure's Chao (stats from food, alignment from treatment, forms by both), Monster Rancher (stats to 999 by
// drills that tire, combining two), Jade Cocoon (merging: the child's looks and powers from both parents), Spectrobes (minerals fed to
// evolve), Black & White (the hand that praises and scolds), and xianxia's cultivation stages (each crossed by a tribulation).
//
//   STATS   FEED[kind] -> stat   feed(spirit, item) -> changes   ALIGN   formOf(spirit) -> { feeling, side } | null   merge(a, b) -> child
//   FIRINGS (rank sums)   firingOf(ranks) -> n (1..)   ranksOf(L) -> sum   STRUGGLE (the god hand's catch: real seconds a class)
// ---------------------------------------------------------------------------------------

/** Five stats, one a feeling (the game's fives); each 0..999, Monster Rancher's ceiling. */
export const STATS = { mirth: 'speed', wonder: 'sight', desire: 'strength', grief: 'stamina', dread: 'will' };
export const MAX = 999;

/** What feeding raises (a Well's material by its kind: progress/econ/materials.js KINDS), by how much a tier (0..4) of the material.
 *  Finery and art raise the bond, not a stat: a gift, not a meal. A cask of crude shifts its feeling toward the cask's grade; a curio
 *  raises the bond by its tier. */
export const FEED = {
  stat: { mechanism: 'mirth', arcane: 'wonder', edge: 'desire', provision: 'grief', eldritch: 'dread', roe: 'grief' }, // (roe: slip roe, the Dunemaw's eggs)
  bond: ['finery', 'art'],
  perTier: [6, 10, 16, 24, 36], // (a common material +6 .. a tier-4 find +36: a hundred and fifty meals from nothing to the ceiling)
  feeling: 0.1, // (a cask moves the spirit's feeling a tenth of the way toward its grade)
  curioBond: [2, 4, 7, 12, 20],
};
/** Alignment on the Law-Chaos line (-1 Law .. +1 Chaos): a pet nudges it toward Law, a flick toward Chaos (Black & White), sparring at
 *  the Peak toward Chaos, tending its terrace toward Law. A form is Law past -1/3, Chaos past +1/3, else Neutral (Chao's three). */
export const ALIGN = { pet: -0.02, flick: 0.02, spar: 0.01, tend: -0.005, third: 1 / 3 };
/** Maturing: bond at 50 (of 100) and one stat at 300; the form is its strongest feeling and its side: 5 x 3 = 15 forms a kind. */
export const MATURE = { bond: 50, stat: 300 };

/** A fresh spirit of a kind, caught at a class (0 Guppy .. 4 Leviathan): a bigger catch begins stronger. */
export const fresh = (kind, cls = 0, feeling = 'wonder') => ({ kind, cls, feeling, bond: 0, align: 0, form: null,
  stats: Object.fromEntries(Object.keys(STATS).map((f) => [f, 20 + 30 * cls])) });

/** Feed it one thing: `item` = { kind?, tier?, grade?, curio? } (a material's kind and tier; a cask's grade; a curio's tier). */
export function feed(s, item = {}) {
  const t = Math.max(0, Math.min(4, item.tier ?? 0)), out = {};
  const stat = FEED.stat[item.kind];
  if (stat) { const was = s.stats[stat]; s.stats[stat] = Math.min(MAX, was + FEED.perTier[t]); out[stat] = s.stats[stat] - was; }
  if (FEED.bond.includes(item.kind)) { s.bond = Math.min(100, s.bond + FEED.perTier[t] / 2); out.bond = FEED.perTier[t] / 2; }
  if (item.curio != null) { const b = FEED.curioBond[t]; s.bond = Math.min(100, s.bond + b); out.bond = b; }
  if (item.grade && STATS[item.grade]) { s.lean = s.lean || {}; s.lean[item.grade] = (s.lean[item.grade] || 0) + FEED.feeling; out.feeling = item.grade; }
  return out;
}
/** Its form, once mature: the feeling of its strongest stat and its side of the line; null before. */
export function formOf(s) {
  const [top, v] = Object.entries(s.stats).sort((a, b) => b[1] - a[1])[0];
  if (s.bond < MATURE.bond || v < MATURE.stat) return null;
  return { feeling: top, side: s.align <= -ALIGN.third ? 'law' : s.align >= ALIGN.third ? 'chaos' : 'neutral' };
}
/** Merging (Jade Cocoon, Monster Rancher): the child keeps the stronger of each stat at three quarters, half again the bond of the
 *  closer pair, the kind of the more bonded parent and the feeling of the other (so its form can be one neither could reach). */
export function merge(a, b) {
  const first = a.bond >= b.bond ? a : b, second = first === a ? b : a;
  return { kind: first.kind, cls: Math.max(a.cls, b.cls), feeling: second.feeling, bond: Math.min(100, Math.round(Math.min(a.bond, b.bond) * 1.5)),
    align: (a.align + b.align) / 2, form: null, parents: [a.kind, b.kind],
    stats: Object.fromEntries(Object.keys(STATS).map((f) => [f, Math.round(Math.max(a.stats[f], b.stats[f]) * 0.75)])) };
}

/** THE FIRINGS: the sum of the attributes' ranks each one needs (the first is had from the start). Past the list, every 20 ranks
 *  more is another Firing: no ceiling (the owner). */
export const FIRINGS = [0, 7, 14, 24, 36, 50];
/** The first six Firings' names (Espada's, 2026-10-07: no potter has fired past an anagama, so the rest go by number); the tribulation
 *  is the Heavenly Kiln. */
export const FIRING_NAMES = ['Candling', 'Sinter', 'Lustre', 'Salt', 'Reduction', 'Anagama'];
export const ATTRS = ['willpower', 'focus', 'charisma', 'perception', 'dexterity', 'visualization', 'resilience'];
/** The sum of the attributes' ranks, from the ledger (alchemy.js fires them: `alchemy.rank.<attribute>`). */
export const ranksOf = (L) => ATTRS.reduce((n, a) => n + (L.best(`alchemy.rank.${a}`) || 0), 0);
/** The Firing a rank sum reaches (1-based). Crossing it is the tribulation's; this says which one is open to try. */
export function firingOf(ranks = 0) {
  let n = 0;
  for (const need of FIRINGS) if (ranks >= need) n++;
  const last = FIRINGS[FIRINGS.length - 1];
  return ranks > last ? n + Math.floor((ranks - last) / 20) : n;
}

/** THE GOD HAND'S CATCH (SPIRIT-GARDEN.md 5a): how long a stunned Figment struggles in the hand over the Pneuka Jar's mouth before it is
 *  drawn in: a real second a class (Guppy 1 .. Leviathan 5). Held through, the catch is certain; a stun that ends first frees it. */
export const STRUGGLE = { perClass: 1, base: 1 };
export const struggleOf = (cls = 0) => STRUGGLE.base + STRUGGLE.perClass * Math.max(0, Math.min(4, cls));
