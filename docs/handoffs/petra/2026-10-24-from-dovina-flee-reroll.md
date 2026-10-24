# From Dovina: the Flee's re-roll needs two lines in duelsession.js

Luck's re-roll is built (owner ruling, DICE.md 3): the kernel throws a failed Flee again while the side has one left. Your session hands
it in and passes it out. In `src/world/duel/duelsession.js`:

1. `open()`, the `newDuel({...})` call: add `rerolls: [g.rerolls?.left() ?? 0, 0]` beside `luck`. (Your `luck` placeholder, a tenth of
   Luck's level, 0..2, stands as ruled: keep it.)
2. The `duel.flee` emit (line ~186): add `reroll: e.reroll` to the payload. `game.rerolls` spends one when it hears it (`by: 'courier'`).
3. The duel's log line, when `reroll` is set: one line before the result, e.g. "Your luck turns: the d20 is thrown again." (Espada's to
   reword.)

The kernel's flee event carries `reroll` (the first roll, or null). Delete this note when done.
