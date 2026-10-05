// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S LUCK: what can come out of a Lockheart, how likely each is, and what the Possibilikeys do to the odds. Data only: the
// tool (tools/lockheart/lockheart.js) spins it, the outcomes are done in tools/lockheart/outcomes.js, and the Codex and the box read it to say it.
//
// A LOCKHEART (the coffin on the chain; there are several, and the one fitted to the chain is the wheel) has a TABLE of outcomes with
// weights. A POSSIBILIKEY opens it, and is used up; up to four may be on the ring, and each, in the order they were put on, does its
// work to the table (INVERT turns it upside down: the likeliest becomes the rarest, by rank, so 99 to 1 becomes 1 to 99) or to what
// comes out (TWIN spins twice, WIDE reaches twice as far, ECHO happens again). How FULL the coffin was when it was opened is how hard it
// comes out (a full coffin is a big bet: power 1; one filled twice over, 2).
//
// Prior art: the gacha banner (a table of rates that is published, a pull that spends what you saved, pity), Slay the Spire's relics
// and Balatro's jokers (modifiers that stack, in order, on the same roll), and the loot boxes they all come from, made a weapon.
//
//   OUTCOMES[id]    HEARTS[id] = { name, table: { outcome: weight }, fill, examine }    KEYS[id] = { name, does, table?(t), mods?(m) }
//   oddsOf(heartId, keyIds) -> { table, mods }   (no jackpot likelier than ECON.lockheart.jackpotCap)
//   rates(table) -> [{ id, p }]        spin(table) -> id        keyBreaks(id, uses) -> bool (a fancy key wears; brass is spent)
// ---------------------------------------------------------------------------------------

import { ECON } from '../../progress/econ/table.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/lockheart/table'); // (the default draw when a caller passes none: core/rng.js, the same twice)

/** What can come out. `color` is its sector on the wheel; `rank` how good (0 a dud .. 4 a jackpot): the wheel is ordered by it. */
export const OUTCOMES = {
  dud:    { label: 'DUD', color: 0x5a4a62, rank: 0, does: 'Nothing. A moth flies out.' },
  bite:   { label: 'BITE', color: 0x8a2a3a, rank: 0, does: 'It bites back: it drinks from you instead.' },
  spill:  { label: 'SPILL', color: 0xe8d7b6, rank: 1, does: 'It spills what it held, and a little more.' },
  cubes:  { label: 'CUBES', color: 0x9fe6ff, rank: 1, does: 'A fountain of cubes.' },
  mend:   { label: 'MEND', color: 0xb8f2a6, rank: 2, does: 'Your Lachryma full, and quick to come back for a while.' },
  daze:   { label: 'DAZE', color: 0xffd76a, rank: 2, does: 'A ring of light: everything near is stunned.' },
  hush:   { label: 'HUSH', color: 0x9ab8ff, rank: 2, does: 'Everything near falls asleep.' },
  kin:    { label: 'KIN', color: 0xff9ad5, rank: 3, does: 'Everything near takes you for its own kind, for a while.' },
  spirit: { label: 'SPIRITS', color: 0xb49be6, rank: 3, does: 'Smoke spirits stand up out of it, on your side.' },
  chest:  { label: 'CHEST', color: 0xffb27a, rank: 3, does: 'A treasure chest falls out of the air.' },
  nuke:   { label: 'SLIP NUKE', color: 0xff5ad0, rank: 4, does: 'Everything near is drowned in slip and burst.' },
};

/** The coffins. The one on the chain is the wheel. */
export const HEARTS = {
  'heart.plain':   { mode: 'casting', name: 'THE PLAIN LOCKHEART', fill: 40, color: 0x6a4a3a, trim: 0xd9b48a, table: { spill: 40, cubes: 25, mend: 15, daze: 12, hush: 7, nuke: 1 },
    examine: 'A plain coffin of dark wood and brass. Mostly it gives back what you put in.' },
  'heart.gambler': { mode: 'casting', name: "THE GAMBLER'S LOCKHEART", fill: 30, color: 0x2a1a22, trim: 0xd94a5a, table: { dud: 99, nuke: 1 },
    examine: 'Lacquered black, an ace on the lid. Almost always nothing. Almost.' },
  'heart.shepherd': { mode: 'casting', name: "THE SHEPHERD'S LOCKHEART", fill: 50, color: 0x3a5a3a, trim: 0xe8d7b6, table: { kin: 35, spirit: 30, hush: 20, chest: 10, bite: 5 },
    examine: 'Green as a hillside, a crook on the lid. What comes out of it is for the flock.' },
};

/** The coffin worn sets the Lockheart's MODE (docs/plans/SYSTEMS.md, C1): CASTING spins its table of outcomes (all three coffins today);
 *  SUMMONING catches a critically stunned Figment and lets it out again on your side (CATCH, below); CONVERSION turns the Lachryma it
 *  drank into cubes (CONVERT, below). The summoning and conversion coffins come with their mechanics (SYSTEMS.md, C2 to C4). */
export const MODES = ['casting', 'summoning', 'conversion'];

/** THE CATCH (summoning; SYSTEMS.md C2): the wheel is the catch, and its odds are the odds shown. They come from the Figment's class
 *  (Guppy .. Leviathan: `base`), how cleanly it was laid low (`clean`, 0..1: the stun's hold), and where its EmO sits (combat/emo.js
 *  catchFactor). A Possibilikey augments them: LOADED by half again, EVEN halfway to a coin toss, TWIN and ECHO a second try. The chance
 *  is never above `cap`, and it is drawn from a deck (econ/deck.js: a 1-in-N catch is certain within N tries at that Figment's kind).
 *  Prior art: Pokemon's catch rate (status and weakness raise it), Shin Megami Tensei's negotiation, the gacha's published rate. */
export const CATCH = {
  base: [0.6, 0.4, 0.25, 0.12, 0.05], cap: 0.95,
  keys: { 'key.brass': (p) => p, 'key.loaded': (p) => p * 1.5, 'key.even': (p) => (p + 0.5) / 2,
    'key.twin': (p) => 1 - (1 - p) ** 2, 'key.echo': (p) => 1 - (1 - p) ** 2 },
};
/** The chance one opening catches a Figment of class `cls` (0 Guppy .. 4 Leviathan). */
export function catchOdds({ cls = 0, clean = 1, emoFactor = 1, keys = [] } = {}) {
  let p = (CATCH.base[cls] ?? CATCH.base[0]) * Math.max(0, Math.min(1, clean)) * emoFactor;
  for (const k of keys) p = (CATCH.keys[k] || CATCH.keys['key.brass'])(p);
  return Math.min(CATCH.cap, Math.max(0, p));
}

/** CONVERSION (SYSTEMS.md C4): a full coffin (power 1) turns into ECON.lockheart.cubes cubes (the CUBES outcome's worth, made certain), a
 *  brimming one (power 2) twice that: so a conversion pays for its brass key only when the coffin was filled to brimming (played well).
 *  The keys gamble the yield: each is a list of [chance, multiplier]. Simulated in scripts/economy.mjs before it is built. */
export const CONVERT = {
  'key.brass':  [[1, 1]],
  'key.loaded': [[0.5, 2.4], [0.5, 0.2]],
  'key.echo':   [[0.7, 1.6], [0.3, 0.6]],
};

/** The keys. `table(t)` changes the odds (a fresh copy is passed); `mods(m)` what comes out. */
export const KEYS = {
  'key.brass':  { name: 'BRASS KEY', color: 0xd9b048, does: 'Opens it. Nothing more.' },
  'key.invert': { name: 'INVERTED KEY', color: 0x8a90a8, does: 'Turns its odds upside down: the likeliest becomes the rarest.',
    table: (t) => { const w = Object.values(t), hi = Math.max(...w), lo = Math.min(...w); for (const k of Object.keys(t)) t[k] = hi + lo - t[k]; } },
  'key.even':   { name: 'EVEN KEY', color: 0xc8d2d8, does: 'Every outcome as likely as any other.', table: (t) => { for (const k of Object.keys(t)) t[k] = 1; } },
  'key.loaded': { name: 'LOADED KEY', color: 0xf2f2e6, does: 'The rarest outcome five times as likely.',
    table: (t) => { const lo = Math.min(...Object.values(t)); for (const k of Object.keys(t)) if (t[k] === lo) t[k] *= 5; } },
  'key.twin':   { name: 'TWIN KEY', color: 0xe8a0c8, does: 'It spins twice, and both happen.', mods: (m) => { m.spins += 1; } },
  'key.wide':   { name: 'WIDE KEY', color: 0x8ad0b0, does: 'Whatever comes out reaches twice as far.', mods: (m) => { m.reach *= 2; } },
  'key.echo':   { name: 'ECHO KEY', color: 0xb49be6, does: 'Whatever comes out happens again, a moment later.', mods: (m) => { m.echo += 1; } },
};
export const MAX_KEYS = 4;

/** Does a Possibilikey that has opened the coffin `uses` times (this time included) break now? Brass always does (it is spent); the
 *  others wear: ECON.lockheart.keyWear. The chance alone is `keyBreakChance`; `keyLife` is the mean number of openings a key lasts. */
export function keyBreakChance(id, uses = 1) {
  if (id === 'key.brass') return 1;
  const W = ECON.lockheart.keyWear;
  return Math.min(1, W.start + W.perUse * Math.max(0, uses - 1));
}
export const keyBreaks = (id, uses = 1, r = simRand()) => r < keyBreakChance(id, uses);
export function keyLife(id) {
  let alive = 1, mean = 0;
  for (let u = 1; alive > 1e-9 && u < 100; u++) { mean += alive; alive *= 1 - keyBreakChance(id, u); }
  return mean;
}

/** The odds a heart has with these keys on the ring (in order), and what is done to what comes out. */
export function oddsOf(heartId, keyIds = []) {
  const H = HEARTS[heartId] || HEARTS['heart.plain'];
  const table = { ...H.table }, mods = { spins: 1, reach: 1, echo: 0 };
  for (const id of keyIds) { const K = KEYS[id]; K?.table?.(table); K?.mods?.(mods); }
  capJackpot(table);
  return { table, mods };
}
/** No jackpot (rank 4) likelier than ECON.lockheart.jackpotCap once the keys have done their work: the jackpots' weight is scaled
 *  down together until they hold exactly the cap (the rest keep their shares). A table of nothing but jackpots is left alone. */
function capJackpot(table) {
  const cap = ECON.lockheart.jackpotCap, ids = Object.keys(table);
  const J = ids.filter((k) => OUTCOMES[k]?.rank === 4).reduce((a, k) => a + table[k], 0), R = ids.reduce((a, k) => a + table[k], 0) - J;
  if (!(J > 0 && R > 0) || J / (J + R) <= cap) return;
  const f = (cap * R / (1 - cap)) / J;
  for (const k of ids) if (OUTCOMES[k]?.rank === 4) table[k] *= f;
}

/** The table as chances (0..1), best last (the wheel's order). */
export function rates(table) {
  const sum = Object.values(table).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(table).map(([id, w]) => ({ id, p: w / sum })).sort((a, b) => (OUTCOMES[a.id]?.rank ?? 0) - (OUTCOMES[b.id]?.rank ?? 0));
}
export function spin(table, r = simRand()) {
  const R = rates(table);
  for (const x of R) { if ((r -= x.p) <= 0) return x.id; }
  return R[R.length - 1].id;
}
