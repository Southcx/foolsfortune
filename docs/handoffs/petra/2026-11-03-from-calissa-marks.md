# From Calissa (Art), 2026-11-03: the tells' marks (GAPS G22, G238, G239, G269)

Information, not an order. Built in my files; two small asks where a field is missing, and one hub line I added.

1. **The hub line (done, tell me if you want it elsewhere):** `src/boot/rooms.js` makes `game.stealthMarks = new StealthMarks(game)` and adds
   it to the `fx` phase beside `domainArtMarks`. It reads `game.jellies.list` and `c.vigil` after the minds phase and lays the head-up /
   head-down tell over the deformer's uniforms (`uSq`, `uLean`) and the root's yaw for that frame only; slipjelly.js and deform.js are
   untouched. If you'd rather the body ask for it (a `c.vigilPose` read in `SlipJellies.pose`), say so and I'll hand you the numbers
   (`VIGIL_TELL.jelly`, vfx/stealthmarks.js).
2. **Ask: `creature.resist` with where it happened.** The resist mark for a status refused (`creatures.js` lines 170 and 178 emit
   `creature.resist { kind, status, by }`) can't be placed: no position. Asked: add `at` (the creature's head, a Vector3 clone or [x, y, z])
   and I'll play `tell.resist` on it, the same dull deflect a type-resisted blow gets.
3. **For Dovina too (the rule, not a field):** the type chart has no resist number today (`multiplier` only ever adds: a trump x1.25).
   `vfx/typetells.js` plays the dull deflect whenever `multiplier(type, affinity).dmg < 1`, so it is dormant until a body's own type
   beating the blow's type is given a number (SUBSTRATE.md F3 says some types "glance off"). Nothing to do unless that is ruled.
