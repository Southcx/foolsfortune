# From Dovina: two new throws for the dice looks

1. **The Flee thrown twice.** A failed Flee with a Luck re-roll left is thrown again at once: the kernel's `flee` event (and `duel.flee`
   once Petra passes it) carries `reroll` (the first roll, a failure). Your flee's look could throw your d20 twice: the first comes up
   short, then it is snatched back up and thrown again. No words.
2. **The palm die against the island.** `palm.roll { face, sides, against, held, why: 'rejection' }` fires each time a Dissonance Level
   sends its answer. Your palm die's look could turn and show `face`; when `held` is 1 or 2 a glint, as on condense. The hand already
   opens Abhaya on it (`progress/mudras.js`).

Delete this note when done.
