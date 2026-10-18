// ---------------------------------------------------------------------------------------
// FAMILIARITY (working name, Espada's and the owner's to rule; docs/plans/OVERLAY.md section 13): how well the Courier knows a kind of
// creature, and so how much of it the overlay may read out. The owner, 2026-10-16: "if you've never encountered a creature before, how
// would you know how much you've damaged it? The granularity of information you have on something is directly proportional to your
// experience with said thing." A damage number is not banned; it is earned, kind by kind.
//
// Two avenues to it, as the design laws ask (skill skips grind; grind closes the gap): the Veritome's understanding of the kind
// (photographs of it doing things: bestiary.js, the ledger's `bestiary.u.<kind>`, 0 to 4) skips ahead; fighting it (the ledger's
// `creature.<kind>.down`, counted by tracking/familiarity.js from `creature.struck`) closes the gap. The level is the better of the two.
// It is a predicate over the ledger, never a flag: a new build forgets every creature, as it forgets everything else.
//
//   level 0 UNKNOWN    a tag of ??? (a known unknown: the Veritome's prompt); a blow shows only on the body. No number at all.
//   level 1 GLIMPSED   a tag with its name; health as a bar in quarters; a blow as a mark of its size (a graze, a wound, a maul)
//   level 2 OBSERVED   a blow's number rounded to its leading figure (~10, ~200); health in eighths; its EmO as a band (low, optimal, hot)
//   level 3 STUDIED    a blow's number exact; health as a bar; its statuses' build-up named
//   level 4 UNDERSTOOD health as numbers (34 / 60); a blow's multiplier and why (×2: weak to Ego); its EmO's value and its grain
//
// Prior art: Darkest Dungeon (a foe's stats and resistances revealed as you fight that kind), Monster Hunter's Hunter's Notes (weakness
// stars filled in by hunting and by capturing), Final Fantasy's Scan and Libra, Shin Megami Tensei's Analyze (a demon's affinities known
// only once met), Pokémon's Pokédex (seen, then caught), the Souls games' silence on a boss's health numbers.
//
//   FAMILIARITY { downs, names }   familiarityOf(L, kind) -> { level, name, photo, fights, next }
//   readBlow(level, dmg, maxHp, why?) -> { mark, text } | null    readHealth(level, hp, maxHp) -> { bar, text } | null
//   READS[level] -> what that level shows (the overlay asks, never the creature's kind)
// ---------------------------------------------------------------------------------------

export const FAMILIARITY = {
  /** Downs of a kind for each level by fighting alone (1, 5, 20, 60): the first down names it; sixty is a hunter's knowledge.
   *  A photograph of the right moment is worth far more than a down (the bestiary's facts are rare moments; skill skips grind). */
  downs: [0, 1, 5, 20, 60],
  names: ['UNKNOWN', 'GLIMPSED', 'OBSERVED', 'STUDIED', 'UNDERSTOOD'],
};

/** What each level lets the overlay read out (a tag's lines, a blow's readout). */
export const READS = [
  { tag: true, name: false, health: null, blow: null, statuses: false, multiplier: false, emo: false, grain: false }, // (the tag says ???)
  { tag: true, name: true, health: 'quarters', blow: 'mark', statuses: false, multiplier: false, emo: false, grain: false },
  { tag: true, name: true, health: 'eighths', blow: 'rounded', statuses: false, multiplier: false, emo: 'band', grain: false },
  { tag: true, name: true, health: 'bar', blow: 'exact', statuses: true, multiplier: false, emo: 'band', grain: false },
  { tag: true, name: true, health: 'numbers', blow: 'exact', statuses: true, multiplier: true, emo: 'value', grain: true },
];

const get = (L, k) => (L?.get?.(k) || 0);

/** How well the Courier knows this kind: the better of the photographs' understanding and the fights' downs. `next` says what the
 *  next level asks by fighting (a down count), or null at the top. */
export function familiarityOf(L, kind) {
  const photo = Math.min(4, get(L, `bestiary.u.${kind}`)), downs = get(L, `creature.${kind}.down`);
  let fights = 0; for (let i = FAMILIARITY.downs.length - 1; i >= 0; i--) if (downs >= FAMILIARITY.downs[i]) { fights = i; break; }
  const level = Math.max(photo, fights);
  return { level, name: FAMILIARITY.names[level], photo, fights, downs, next: level < 4 ? FAMILIARITY.downs[level + 1] : null };
}

/** A blow's readout at this level: a mark of its size (graze under a tenth of its health, maul over a third), a number rounded to its
 *  leading figure, the number, or the number with its multiplier's reason (`why`: { k, because }). Null at level 0: the body shows it. */
export function readBlow(level, dmg, maxHp = 0, why = null) {
  const R = READS[level]?.blow; if (!R || !(dmg > 0)) return null;
  const share = maxHp > 0 ? dmg / maxHp : 0.2, mark = share < 0.1 ? 'graze' : share > 1 / 3 ? 'maul' : 'wound';
  if (R === 'mark') return { mark, text: null };
  if (R === 'rounded') return { mark, text: `~${leading(dmg)}` };
  const n = Math.max(1, Math.round(dmg));
  return { mark, text: READS[level].multiplier && why?.k && why.k !== 1 ? `${n} ×${+why.k.toFixed(2)} ${why.because || ''}`.trim() : `${n}` };
}

/** Health's readout at this level: the bar's fill snapped to quarters or eighths, the bar, or the numbers. Null at level 0. */
export function readHealth(level, hp, maxHp) {
  const R = READS[level]?.health; if (!R || !(maxHp > 0)) return null;
  const k = Math.max(0, Math.min(1, hp / maxHp));
  if (R === 'quarters') return { bar: Math.ceil(k * 4) / 4, text: null };
  if (R === 'eighths') return { bar: Math.ceil(k * 8) / 8, text: null };
  if (R === 'bar') return { bar: k, text: null };
  return { bar: k, text: `${Math.ceil(hp)} / ${Math.round(maxHp)}` };
}

/** A number rounded to its leading figure (7 -> 7, 13 -> 10, 268 -> 300). */
function leading(n) { const p = 10 ** Math.floor(Math.log10(Math.max(1, n))); return Math.round(n / p) * p; }
