# From Dovina (design): Strawman's Well, the verbs added 2026-11-03 (GAPS G250 to G254, G25/G80)

Everything below is a plain placeholder box or mesh; the rules are built and run. Dress each by its name (`mesh.name` / `group.name`), looks only.
Rules: `docs/plans/STRAWMANS-WELL.md` 4 and `src/progress/strawmanwell.js` (ROPE, POGO, GRAB, PULLEY, FLOAT, GUIDE, TURRET).

| placeholder (name) | where | what it is |
|---|---|---|
| `wellPulleyPlatform` (x2), `wellPulleyRope` (x2), `wellPulleyWheel` | The Machine, x 76 to 90 | two platforms on one rope over a wheel; the heavier side falls and lifts the other (`machinepulley.js`). The ropes are thin boxes scaled each frame from the wheel to the platform. The crate on the high platform is the level's crate |
| `wellOnBlock` (the solid set), `wellOffBlock` (the ghost set), `wellToggleSwitch` | The Machine, x 99 to 117 | Mario Maker's switch blocks: red set solid and green set ghost, swapped each time the pad is stepped onto (`machineonoff.js`). A ghost block is already translucent (opacity 0.22, no depth write); the name swaps as it flips |
| `wellTurretLantern` | The Machine, the cannon (x 64) | the cannon is now the Lantern Wisp's turret: its lamp (dark while stunned) and its ball, which is the Wisp's own ember (`wisps.look.bolt`) with the parry mark. The Raceway's turret (`racewayTraps`) is the prior art; dress it as that |
| `wellPossibilikey` | The Machine, the key (x 11) | the key's mesh, coloured from the Possibilikey row `key.brass` (`tools/lockheart/table.js` KEYS). A brass Possibilikey in the Lockheart's look is wanted |
| `wellGuideGhost` | every stage but the Arena's, while the guide or the rival runs | a Strawman model at 0.7 scale, its materials cloned and thinned to opacity 0.4. Wanted: a ghost of straw (loose straw, a faint outline, the Mimicry ghost's film), the rival a shade warmer than the guide so they read apart in the Pit |
| the held dummy | The Brawl | a straw dummy lifted over the Courier's head (the dummy's own model, hanging); wanted: the hanging pose and a squash when thrown or slammed |
| the rope's launch | The Climb, the rope at x 45 and the `LAUNCH` shelf at x 51 to 55 | no mesh of its own; a rope pumped by A and D and let go of. A trail on the Courier at launch speed would read (`events: well.verb ropeLaunch`) |
| pogo | The Pit's spikes, the Brawl's dummies | no mesh; a bounce flash where a downward blow lands (`well.pogo { on: 'dummy' \| 'spike' }`), the Shovel Knight spark |
| the floating crate and the raised clay | The Flood | the crate is the level's crate; the stepping stones are grid cells (`gridlook.js`) raised at the new RAISE lectern (x 7.4 on the Flood's lane). Nothing new to dress but the RAISE lectern's sign, a clay mound |
| `strawmanRigConsole` | the Throwing Room's combat wing, beside the sparring circle at (14.4, -8.2) | the tunable Strawman's console, the same plain lectern as the Index's: it opens a page of rows (the Index's `showPage`, classes `grp`, `rooms`, `room`); dress the lectern and the rows in the Clay dress |
