// ---------------------------------------------------------------------------------------
// THE MELEE LOADOUT'S WORDS (placeholders, Espada's to write): what the loadout editor (loadouteditor.js) and the log call a move of the
// Sondelass's catalogue when its row carries no words of its own (sondelassloadout.js: a row's `label` and `does`; docs/plans/CLARITY.md
// sections 3 and 4: a genre-word label, one line of effect, verb first, at most 8 words, every number with its unit). A row's own words
// always win; these stand in for today's five until the rows carry theirs. Also the effects' keywords (ui/keywords.js), the specials'
// three slots, and the slots' ordinals for the log's line.
//
// Prior art: God Hand's technique list (a short name and one line for every technique), Hades' boon cards (a label and a line), and
// CLARITY.md's two names (the label the UI shows; the lore name kept for the Codex and the world).
// A data module: it imports nothing (docs/ARCHITECTURE.md, Imports), so a Node script reads it as the game does.
//
//   labelOf(row) -> the label   lineOf(row) -> its one line   effectKeyword(row) -> a keyword id (ui/keywords.js) | null
//   numbersOf(row, rule) -> { power, reach, speed, cost } (each a number or undefined)   SPECIAL_SLOTS   ordinal(n)
// ---------------------------------------------------------------------------------------

/** Today's five, until their rows carry `label` and `does` (placeholders for Espada's). `reach`: m from the feet to the blade's tip at
 *  its farthest in the strike (the step in left out), measured from the clips headless 2026-10-11 (tools/melee.js measureSwing: c1 1.52,
 *  c2 1.74, c3 1.56, c4 2.11); the stinger's is its lunge (8.4 m measured, nothing locked, in the open) and the 2 m its point reaches
 *  past the body. */
export const PLACEHOLDER = {
  c1: { label: 'Flat Cut', does: 'Cuts flat across, right to left.', reach: 1.5 },
  c2: { label: 'Rising Cut', does: 'Cuts upward, left to right.', reach: 1.7 },
  c3: { label: 'Hop Cut', does: 'Hops in with a fast flat cut.', reach: 1.6 },
  c4: { label: 'Leap Chop', does: 'Leaps in and chops straight down.', reach: 2.1 },
  stinger: { label: 'Stinger', does: 'Lunges 8 m, piercing all in line.', reach: 10.4 },
};

/** A move's effect on a body (its row's `effect`) as the keyword the card shows (ui/keywords.js: placeholders for Espada's). */
export const EFFECT_KEYWORD = { stagger: 'stagger', knock: 'knockback', launch: 'launch', guardBreak: 'guardbreak' };

/** The specials' three slots, in the slot row's order: what each is called and the keys that fire it. */
export const SPECIAL_SLOTS = [
  { dir: 'tap', word: 'Tap', key: 'RMB', said: 'RMB' },
  { dir: 'forward', word: 'Forward', key: 'W+RMB', said: 'W + RMB' },
  { dir: 'back', word: 'Back', key: 'S+RMB', said: 'S + RMB' },
];

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
/** 1 -> 'first' ... 8 -> 'eighth' (the log's "Your string's third blow"). */
export const ordinal = (n) => ORD[n - 1] || `${n}th`;

const titled = (id) => String(id || '').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

/** The label: the row's, else today's placeholder, else its id made readable (never blank, never a throw). */
export function labelOf(row) {
  if (!row) return '';
  return row.label || row.name || PLACEHOLDER[row.id]?.label || titled(row.id);
}

/** The one line of effect: the row's (`does`, or `line`), else today's placeholder, else nothing. A row's `effect` is the body's word
 *  (stagger, knock ...), shown as its keyword, never as the line. */
export function lineOf(row) {
  if (!row) return '';
  return row.does || row.line || PLACEHOLDER[row.id]?.does || '';
}

/** The keyword its effect is shown as (null for an effect with none). */
export const effectKeyword = (row) => EFFECT_KEYWORD[row?.effect] || null;

/** The card's numbers. The row's own `numbers` (or `stats`) first; then its row of progress/combat/moves.js (`rule`: what the engine
 *  plays: power times hits, `time` the real seconds a blow takes, `cost` Lachryma); then the row's play and its special's own. `speed` is
 *  real seconds a blow takes (moves.js `time`): lower is faster. */
export function numbersOf(row, rule = null) {
  if (!row) return {};
  const N = row.numbers || row.stats || {}, S = row.sting || {};
  const num = (...v) => v.find((x) => typeof x === 'number' && Number.isFinite(x));
  return {
    power: num(N.power, rule && rule.power * (rule.hits || 1), S.power, row.play?.hit?.power),
    reach: num(N.reach, PLACEHOLDER[row.id]?.reach),
    speed: num(N.speed, N.time, rule?.time),
    cost: num(N.cost, rule?.cost, S.cost, row.play?.cost) || undefined, // (a free move shows no cost chip)
  };
}
