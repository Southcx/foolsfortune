// ---------------------------------------------------------------------------------------
// THE COACH'S SEATS (coach/index.js; docs/plans/CASINO-CLARITY.md section 3): a table's seats as every game's coach shows them: the name
// ("You" for seat 0), the seat's colour and shape (table.js SEAT_COLOURS: the board-game convention, the owner's, 2026-10-15), whose turn
// it is, and the game's own numbers for that seat.
//
//   seatsOf(T, S, statsOf(q) -> { stats: [{ label, value, kind: 'score' | 'money' | 'lives' | 'count', big? }], badge?, ... }, turnSeat)
//   colourOf(T, q) -> SEAT_COLOURS row   PERSON_COLOURS
// ---------------------------------------------------------------------------------------
import { SEAT_COLOURS } from '../table.js';

/** A colour per person, the same at every table (Calissa's ask: Raku the house's Black): you Red (the convention's first player), then
 *  each of the folk their own. Anyone else takes the first colour no one at the table wears. */
export const PERSON_COLOURS = { you: 'red', Raku: 'black', Clink: 'yellow', Celadon: 'green', Crock: 'blue' };
export function colourOf(T, q) {
  const want = PERSON_COLOURS[q === 0 ? 'you' : T.names[q]], taken = new Set(T.names.map((n, k) => PERSON_COLOURS[k === 0 ? 'you' : n]).filter(Boolean));
  return SEAT_COLOURS.find((c) => c.id === want) || SEAT_COLOURS.filter((c) => !taken.has(c.id))[q % 4];
}
export function seatsOf(T, S, statsOf, turnSeat) {
  return [...Array(T.seats)].map((_, q) => {
    const C = colourOf(T, q);
    return { seat: q, name: q === 0 ? 'You' : T.names[q], colour: C.hex, colourId: C.id, colourName: C.label, shape: C.shape, you: q === 0, turn: q === turnSeat, ...statsOf(q) };
  });
}
