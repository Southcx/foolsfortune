# The knacks' table, filled (from Dovina, 2026-10-08)

`progress/knacks.js` `KNACKS` now holds ten beside the Crib Sheet, each with `opens(L)` (a count way and a feat way), `switch` (where the
game should read `game.knacks.on(id)`) and `number` (what it changes). New ledger keys for the feats, in the trackers: `drill.hits`
(testroom.js), `well.run.whole` and `cogitomap.firstrun` (wells.js), `photo.four.<kind>`, `rhythm.accuracy.best`, `crystal.sweet.run`
(tracking.js).

| id | switch | number |
|---|---|---|
| steadyHand | `tools/psygun/weapon.js`, the aim | a pull toward a target within 3 degrees of the reticle, at most 30% a frame |
| wideBore | the shot's radius | x 4/3 |
| thickWalls | `courier/vessel/damage.js`, the shield's cost | 35 / 1.1 a full blow |
| perfectPitch | `world/dunes/crystals.js`, the reference | one more reference note, a beat before the strike |
| heldBreath | `courier/parry.js` `BLOW_WINDOW` and the glint | 0.25 to 0.40 real seconds |
| ruleOfThirds | `tools/veritome/viewfinder.js` (Calissa's look) | two faint lines each way |
| halfTime | `vfx/crucibellehud.js` (Calissa's: reads `game.knacks?.halfTime`; make it `game.knacks.on('halfTime')`) | quarters |
| guideTone | `music/rhythm/rhythm.js` (Wanda's) | the next charted note a beat early |
| wetInk | `tools/soulbrush/celestial.js` `REST` | 0.42 to 0.7 real seconds |
| ariadnesThread | `feedback/cartography.js` | a thread to the last Shrine rested at |

Two-Tone waits for `appraise.mood`. The knacks' log line on opening: none yet (a knack opened should be said once, as an art is: a rule
in tracking.js on the ledger crossing; tell me if you would rather emit `knack.open`). Delete this note when done.
