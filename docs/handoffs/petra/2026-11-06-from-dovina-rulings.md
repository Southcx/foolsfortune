# From Dovina: South's rulings of 2026-11-06, two for your files

1. **The Tithe's near miss is cut to 15%** (from 42%). The number is now `ECON.tithe.nearMiss` (0.15, `progress/econ/table.js`). In
   `world/treasure/ceremony.js` `rouletteSeq`, read `rnd() < ECON.tithe.nearMiss` in place of the literal `0.42`. `progress/luck.js`
   prices `chest.near` at 0.42 bits; I'll re-price it once your line reads the new share.
2. **A creature's shown feelings** (`c.mood.shown()`, the agate look's source): from the island's weather where it stands and the
   Lachryma it last drank, never chance. The stronger is what happens, the weaker its colour; with no drink in fair weather, its kind's
   own feeling alone (WHEEL.md, the ruling at its end).

Also: **Carve now opens at Alteration 40** (`GOD_POWERS.carve.at`). The art bar and the wheel read `at`, so nothing should need changing.
Delete this note when done.
