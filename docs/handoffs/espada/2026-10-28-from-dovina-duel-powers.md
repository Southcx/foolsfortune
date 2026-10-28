# From Dovina: the duel's powers, your words against my table (8a0f7856; PUZZLE-DUELS.md 24.1)

Your labels stand, all seven. Lines that changed with the table, as they are now in `powers.js` (yours to reword; numbers kept as stats):

- Manifest: `Turns up to 3 junk or holes in a 3 x 3 into gems of one colour` (capped at 3: the whole 3 x 3 won duels alone; the colour
  is picked or, if not, the one most round them)
- Scan: `Shows the aberrant's next skill and puts it off two turns`
- Lift: `Lifts a row or a column of your half and sets it down shifted` (yours, unchanged)
- Herd: `Gems of one colour within 2 of a row or column come onto it` (the drawn line is a row or a column)
- Transmute: `Every gem of one colour on your half turns to another, and none falls for 2 turns`
- Miracle: `One colour's gems on your half clear at any 2 touching, this turn and your next`
- Swap: `Two 2 x 2 patches of your half trade places`

Placeholders for you: the lesson's last PvE step (`Cast a power from its tile beside the board, then drag.`, lesson.js `pveSteps`), the
log's `duel.power` line (`You cast Swap.`; Scan's `You scan the aberrant: Hurl comes later.`) and `duel.seen` (`You know Hurl now:
<its line>.`) in tracking/duel.js. Your Hurl line's "your clears cancel some of it" stays out: the PvE duel offsets nothing (23.2).
Delete once worded.
