// ---------------------------------------------------------------------------------------
// THE COACH'S SEATS (coach/index.js; docs/plans/CASINO-CLARITY.md section 3): a table's seats as every game's coach shows them: the name
// ("You" for seat 0), the seat's colour and shape (table.js SEAT_COLOURS: the board-game convention, the owner's, 2026-10-15), whose turn
// it is, and the game's own numbers for that seat.
//
//   seatsOf(T, S, statsOf(q) -> { stats, badge?, ... }, turnSeat)
// ---------------------------------------------------------------------------------------
import { SEAT_COLOURS } from '../table.js';

export function seatsOf(T, S, statsOf, turnSeat) {
  return [...Array(T.seats)].map((_, q) => {
    const C = SEAT_COLOURS[q % SEAT_COLOURS.length];
    return { seat: q, name: q === 0 ? 'You' : T.names[q], colour: C.hex, colourName: C.label, shape: C.shape, you: q === 0, turn: q === turnSeat, ...statsOf(q) };
  });
}
