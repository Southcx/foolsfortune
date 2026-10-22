// ---------------------------------------------------------------------------------------
// WHAT OF THE MELEE LOADOUT IS OPEN (docs/plans/MELEE-LOADOUT.md section 2, Dovina's earning; docs/plans/MELEE-LOADOUT-EARNING.md): how
// many of the string's slots the Courier has, which moves of the catalogue they know, and what lends them in DEBUG. It reads the ledger
// (game.ledger) and the lends (game.lend) and never writes either; the loadout kept (loadoutchosen.js) and the loadout editor
// (loadouteditor.js) ask here.
//
//   THE SLOTS   4 to start, 8 at most. Slots 5 to 8 open at 300, 1,000, 3,000 and 8,000 cutlass hits (the ledger's `cut.hit`), or sooner
//               by an unbroken string run of 8, 10, 12 or 14 blows (the record `sond.string.best`, kept from `move.string.end` by
//               feedback/tracking/moves.js; a save without it reads 0)
//   THE MOVES   known from the start: today's four normals and the stinger (the launcher, the air string, the pause string and the dash
//               are the fixed grammar, never slotted). Any other row is known when Dovina's `unlocked('sondelass', id, L)`
//               (progress/combat/moves.js) says so, asked only where her table has a row for it with an `unlock` (none yet: her earning
//               is coming on main); until then every row not in STARTERS stays locked in STORY, and its card says only that, with its
//               parent marked as to come (casebook 209: no way to learn it is promised that does not exist)
//   THE LEND    in the DEBUG save, the lend panel's `moves` row lends every move and all 8 slots (progress/lend.js); a lent one is shown
//               with the hollow mark (ui/lendpanel.js), never as earned
//
// Prior art: God Hand's Combo Tree growing as you go (its chain lengthened by play), Old School RuneScape's two ways to an unlock (a
// count anyone reaches, or a feat that proves the skill), and Monster Hunter's weapon trees (a branch opens from the one before it).
//
//   SLOTS { start, most }   SLOT_OPENS [{ slot, hits, run }]   STARTERS
//   slotsOpen(game) -> { n, earned, lent }   slotOpening(slot) -> its one line ('300 hits, or 8 in a row': both ways)
//   moveStatus(game, row) -> { known, earned, lent }   moveOpening(row, catalogue) -> its one line ('Locked. Learned from Backhand
//   (to come).')
// ---------------------------------------------------------------------------------------
import { labelOf } from './loadoutwords.js';
import * as RULES from '../../progress/combat/moves.js';

export const SLOTS = { start: 4, most: 8 };
/** Slots 5 to 8: the count way (cutlass hits, `cut.hit`) and the feat way (an unbroken string run, `sond.string.best`). Dovina's. */
export const SLOT_OPENS = [
  { slot: 5, hits: 300, run: 8 },
  { slot: 6, hits: 1000, run: 10 },
  { slot: 7, hits: 3000, run: 12 },
  { slot: 8, hits: 8000, run: 14 },
];
/** Known from the start (MELEE-LOADOUT-EARNING.md section 2): nothing anyone has today is taken away. */
export const STARTERS = ['c1', 'c2', 'c3', 'c4', 'stinger'];

const HITS = 'cut.hit', RUN = 'sond.string.best';
const lentMoves = (game) => !!game?.lend?.has?.('moves');
const count = (L, key) => { try { return +L?.get?.(key) || 0; } catch { return 0; } };
const record = (L, key) => { try { return +L?.best?.(key) || 0; } catch { return 0; } }; // (a record not yet kept reads as 0)

/** How many string slots are open: `earned` by the ledger, `n` with the lend (all 8 in DEBUG with `moves` lent). */
export function slotsOpen(game) {
  const L = game?.ledger, hits = count(L, HITS), run = record(L, RUN);
  let earned = SLOTS.start;
  for (const o of SLOT_OPENS) if (hits >= o.hits || run >= o.run) earned = Math.max(earned, o.slot);
  const lent = lentMoves(game) && earned < SLOTS.most;
  return { n: lent ? SLOTS.most : earned, earned, lent };
}

/** What opens a closed slot, in one line (words placeholders for Espada's): the count way and the feat way, both kept by the ledger. */
export function slotOpening(slot) {
  const o = SLOT_OPENS.find((x) => x.slot === slot);
  return o ? `${o.hits.toLocaleString('en-GB')} hits, or ${o.run} in a row` : '';
}

/** Dovina's earning, where the game has it: `unlocked(tool, move, L)` asked for a row her table (progress/combat/moves.js MOVES) holds
 *  with an `unlock`; null where it has none (the catalogue's new moves today), so nothing is earned by a row she has not written. */
function earnedByRules(row, L) {
  const has = typeof RULES.unlocked === 'function' && typeof RULES.MOVES?.sondelass?.[row.id]?.unlock === 'function';
  if (!has) return null;
  try { return !!RULES.unlocked('sondelass', row.id, L); } catch { return false; }
}

/** Whether the Courier knows a move: `earned` (one of today's, or Dovina's `unlocked` says so: earnedByRules), `lent` (DEBUG's lend
 *  and not earned), `known` either. A check that throws is a move not yet earned. */
export function moveStatus(game, row) {
  if (!row) return { known: false, earned: false, lent: false };
  let earned = STARTERS.includes(row.id);
  if (!earned) earned = !!earnedByRules(row, game?.ledger);
  const lent = !earned && lentMoves(game);
  return { known: earned || lent, earned, lent };
}

/** A locked move's one line: that it is locked, and the move it grows from (its parent), marked as to come: until Dovina's earning is
 *  in, no way to learn it exists, so none is promised (casebook 209). Words placeholders for Espada's. */
export function moveOpening(row, catalogue) {
  if (!row) return '';
  const parent = row.parent && catalogue?.[row.parent];
  return parent ? `Locked. Learned from ${labelOf(parent)} (to come).` : 'Locked.';
}
