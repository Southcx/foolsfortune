// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS PAY (docs/plans/WELL-BOARD.md 5): what a run on the board is worth in cubes, from the Well's own numbers
// (ECON.well: progress/econ/table.js), so the board is a second way to run a Well and never a second economy. A floor cleared pays
// as a share of that depth's floor in wellPay; the FOE's space pays the FOE's; a piece of haul is a material, sold or pressed like
// any other (its worth is the materials', not counted here). How the run ended scales the cubes as it does today: walked up all of
// it, the Wake Whistle ECON.escape.keep, a fall nothing.
//
// Tuned against scripts/wellboard.mjs so the default planning bot's run pays near the aim for its minutes; MINUTES is the model of
// a run's length the tuning stands on (a floor is 1 to 3 real minutes: ENDGAME.md 3.1; a turn on the board is a few real seconds).
//
// Prior art: the house's economy (docs/ECONOMY.md: one aim, every source a multiple of it), Slay the Spire's gold by room kind.
//
//   payOf(seatResult) -> cubes   MINUTES { floor, turn }   PAY { share }
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** `share`: a board floor against a whole floor of the Well as walked today (a Dunemaw floor is several rooms; a space is one). */
export const PAY = { share: 1 };
/** Real minutes: a floor played, and a turn taken on the board (the throw, the walk, the reading). */
export const MINUTES = { floor: 2, turn: 0.2 };

const KEEP = { up: 1, foe: 1, whistle: ECON.escape.keep, fall: 0 };

export function payOf(seat) {
  const W = ECON.well; let v = 0;
  for (const h of seat.haul) if (h.why === 'fight' || h.why === 'genre') v += PAY.share * W.perFloor * Math.pow(W.deeper, h.depth);
  for (const h of seat.haul) if (h.why === 'foe') v += W.foe * W.perFloor * Math.pow(W.deeper, h.depth);
  return Math.round(v * ECON.perMinute * (KEEP[seat.out] ?? 0));
}
