**2026-10-07, from Calissa (Art): the numbers I set for the new moves, for you to rule on** (the cutlass and the Solar Skiff; the bell,
coffin and book are in the builders' own note beside this one)

Every number below is a row in a table, so a ruling is a one-line change. I set them by measure, so each one comes with its reason.

**The cutlass** (`src/tools/sondelass/cutlass.js`, MOVES; power is `creatures.strike`'s, times k 1.4; dmg times 62 on a pot)

| move | input | power | dmg | knock (push / lift m/s) | cost | why |
|---|---|---|---|---|---|---|
| strokes 1-3 | LMB | 1.2 / 1.3 / 1.5 | 1.0 / 1.1 / 1.3 | | | today's strokes A, B, and a third between B and the old overhead |
| stroke 4 (whole body, a leap) | 4th LMB | 2.0 | 1.9 | 6 / 0 | | today's overhead finisher |
| thrust, its follow | LMB after a pause at stroke 1 | 1.5 / 1.8 | 1.3 / 1.6 | 4 / 7 | | a thrust's reach (1.9 m) for a slower press |
| JRPG arcs 1-3 | LMB after a pause at stroke 2 | 1.3 / 1.4 / 2.2 | 1.2 / 1.3 / 2.0 | 7 / 3 on the last | | the same total as the string, spread wider |
| launcher | S + LMB | 1.4 | 1.1 | 1 / 9.5 | | 9.5 m/s lifts a creature about 2 m, level with the Courier's 0.92 m rise |
| air cuts 1-2 | LMB in the air | 1.2 / 1.3 | 1.0 / 1.1 | 1.5-2 / 4 | | 4 m/s up keeps a launched creature in the air |
| plunge | 3rd LMB in the air | 2.2 | 2.0 | 7 / 5 (a 2.6 m ring) | | the air string's payoff |
| dash slash | LMB while sprinting | 1.9 | 1.8 | 8 / 0 | | the stinger's lunge without its Lachryma or its lock |
| charged slash | hold LMB, let go | 1.6 × (1 + charge) | 1.6 | 9 / 0 | | full charge (1.1 s) doubles it |
| counter spin | LMB with the guard up | 1.4 | 1.2 | 6 / 0 | | a guard's answer, not a parry's |
| Tidecutter | R | 3.0 | 3.0 | 12 / 4 (a 4.2 m ring) | 12 Lachryma | twice the stinger's cost for a ring where the stinger is a line |

**The Solar Skiff's bail** (`src/courier/skiff/skiff.js`, BAIL): thrown off on a wall struck above 14 m/s (today's thunk is above 8),
on a landing faster than 17 m/s down, or on a spin landed more than 3.6 rad off square (today a spin past 2.2 rad only costs a quarter of
the speed). After a bail the board is parked where it slides to a stop, and it can be mounted again (F).

**New events and ledger keys** (all with `by`):
- `combo.move` -> `combo.<kind>`, `combo.<tool>.<move>`
- `combo.juggle` -> `combo.juggle`, `combo.juggle.best` (hi)
- `skiff.summon / .mount / .recall / .park` -> counts
- `skiff.bail` -> `skiff.bail`, `skiff.bail.<why>`, `skiff.bail.speed` (hi)

Achievements are yours if you want them. Ideas: a five-hit juggle; a plunge off a geyser; a bail above 30 m/s.

**Open:**
- Should the specials (R) be the System's to unlock, or open from the start?
- Is the Tidecutter's 12 right against the Psygun's fan (8, the builder's)?
- Should the kick now hurt creatures? (The unarmed builder proposes a modest yes.)
