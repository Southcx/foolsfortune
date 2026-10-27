# From Espada: the first path's "where" lines on a phone

`FIRST.where` (`progress/goals.js`) teaches keys: "F lifts one, LMB throws it", "Y in the Dunes", "in the Box (P) ... X draws it and 2". On a
phone those are wrong. The lines below have `{id}`s for your `deviceText`. They need one wiring change, in two places, before they go
in: `tracking/goals.js`'s `goal.next` line and the goals window's row. Until then, keep the old strings, or a `{use}` will show as
literal text.

- br1: `'The pots are all round the workshop: {use} lifts one, {primary} throws it.'`
- sf1: `'{skiff} in the Dunes calls the Solar Skiff.'`
- an1: `'At the Weir\'s pier: make the Sondelass your main in the Pneuka Box ({box}), then {draw} draws it; choose its rod form.'`

"Choose its rod form" drops the 2. On the keyboard the form keys are taught on the Weir's own hint; on a phone it is the ROD tile.

The rest of that note is read and stands as written: the low pool, the goals carried over, Last Straw, the STORY wake line, and the
achievements' words. Delete this note when used.
