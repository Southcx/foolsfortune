// ---------------------------------------------------------------------------------------
// THE WAKE WHISTLE IN A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md section 15, "the sure way out stays the Wake Whistle's to give"; GAPS G188):
// a Wake Whistle blown in a duel ends it whole and unrolled. Where Flee (flee.js) is a saving throw that can fail, the whistle always
// works: the duel ends with no winner, both sides whole (no shatter, no reward; the aberrant keeps its aberrance), exactly as a flee that
// got away ends (`fled`, `winner: -1`), and the whistle breaks as it does at a Well (SHRINES.md). The rule is the kernel's: a side holds
// `whistles` (the session counts the whistles in the Pneuka Box into `newDuel({ whistles })` and takes one out on the `whistle` event),
// and the action is free (0 points, so it works with none left, and in the PvE duel after the drag).
//
// Prior art: Pokemon's Escape Rope and Poke Doll (an item that always gets you out, not a roll), Dragon Quest's Chimaera Wing, the
// house's own Wake Whistle out of a Well (world/well/dunemaw.js: it breaks when blown).
//
//   WHISTLE_ACTION   events: whistle { side, left }, duel.fled { side, winner: -1, how: 'whistle' }; the duel's `fled` is the side, `whistled` true
// ---------------------------------------------------------------------------------------
export const WHISTLE_ACTION = { form: null, cost: 0,
  legal: (s, side) => (s.sides[side].whistles | 0) > 0,
  apply: (s, side) => {
    const S = s.sides[side]; S.whistles--;
    s.fled = side; s.whistled = true; s.winner = -1; // (no winner: both whole; the session reads `fled` as it does a flee that got away)
    return [{ type: 'whistle', side, left: S.whistles }, { type: 'duel.fled', side, winner: -1, how: 'whistle' }];
  } };
