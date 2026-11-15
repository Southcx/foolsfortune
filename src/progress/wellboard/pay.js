// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS PAY (docs/plans/WELL-BOARD.md 5): what the board pays in cubes, from the Well's own numbers (ECON.well:
// progress/econ/table.js), so the board is a second way to run a Well and never a second economy. A floor cleared pays that depth's
// floor of wellPay into the run's purse; the FOE's space pays the FOE's; a cache a little. The purse is spent at shops and robbed in
// duels, and what is left comes home as the run ended: walked up all of it, the Wake Whistle ECON.escape.keep, a fall nothing.
// A piece of haul is a material, sold or pressed like any other; its worth here is only for the standings.
//
// Tuned against scripts/wellboard.mjs so the default planning bot's run pays near the aim for its minutes; MINUTES is the model of
// a run's length the tuning stands on (a floor is 1 to 3 real minutes: ENDGAME.md 3.1; a turn on the board is a few real seconds).
//
// Prior art: the house's economy (docs/ECONOMY.md: one aim, every source a multiple of it), Mario Party's coins (earned on the
// board, spent on the board, counted at the end).
//
//   cubesFor(kind, depth) -> cubes into the purse   payOf(seat) -> cubes home   scoreOf(seat) -> the standings' score   MINUTES   PAY
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** `share`: a board floor against a whole floor of the Well as walked today. `trial`: a trial's cubes over a fight's. `cache`: a
 *  cache's cubes. `haul`: a material's worth at the standings, by tier. */
export const PAY = { share: 0.85, trial: 1.25, cache: 6, haul: [6, 10, 16, 24, 36] };
/** Real minutes: a floor played, and a turn taken on the board (the throw, the walk, the reading). */
export const MINUTES = { floor: 2, turn: 0.2 };

const KEEP = { up: 1, foe: 1, over: 1, whistle: ECON.escape.keep, fall: 0 };

export function cubesFor(kind, depth) {
  const W = ECON.well, floor = W.perFloor * Math.pow(W.deeper, depth) * ECON.perMinute;
  if (kind === 'foe') return Math.round(W.foe * floor);
  if (kind === 'cache') return PAY.cache;
  return Math.round(PAY.share * floor * (kind === 'genre' ? PAY.trial : 1));
}
/** What a seat brings home in cubes (a seat still on the board is counted as walking up). */
export const payOf = (seat) => Math.round((seat.cubes || 0) * (KEEP[seat.out] ?? 1));
/** A seat's score at the standings: its cubes and its haul as they would come home. */
export const scoreOf = (seat) => Math.round(((seat.cubes || 0) + seat.haul.reduce((a, h) => a + (PAY.haul[h.tier] ?? 6), 0)) * (KEEP[seat.out] ?? 1));
