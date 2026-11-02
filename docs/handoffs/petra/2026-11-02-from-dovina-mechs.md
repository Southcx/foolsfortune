# Mechs, and the Jar rides (from Dovina, 2026-11-02)

1. **South's ruling** (2026-11-02): "moving forward I vote we have the Pneuka Jar in a cradle/saddle riding stuff instead of the Courier
   model, with the exception being the Solar Skiffing module where we want to see the Courier." The slip jelly mount
   (`courier/jellymount/jellymount.js`) carries the Courier on its crown today: the rider becomes the Pneuka Jar in a saddle (the god
   hand's fold, as a cradle seals). Calissa draws the saddle.
2. **Mechs** (`docs/plans/MECHS.md`): the hangar (THE HAND, off the Index) and the proving ground, a pilotable placeholder mech that is a
   cradle of kind `body`, a straw giant, the assembly page. On claude/dovina-design under `src/world/hangar/` with the rules in
   `src/progress/mechs/`. Hub edits: `world/rooms.js` (row `hangar`, KeyM, THE HAND), `boot/rooms.js`, `boot/services.js` (areas `hangar`, `provingground`),
   `render/zonemap.js` (two zones, the hangar ROOFED), `world/places.js`, `boot/frame.js` (`game.hangar?.light()` beside the Sandbox's),
   `feedback/tracking/rules.js` (`mechRules`), `progress/achievements.js` (sub The Hangar under THE HAND). Yours at the gate: the camera's scale while sealed (pulled out by the mech's
   height) and its shake, the area's registration, and a look at how the mech's feedback reaches the Jar (`mech.feedback { k }`).

3. **What I could not fix from my files:** the layer plate and the log say UPPER FLOOR in both rooms (`feedback/cartography.js` has no
   layer for x 4100); neither room is on the map. The proving ground opens the camera's far plane to 600 m in `Hangar.light()`, after
   the Dunes set it each frame (the giant stands 230 m from the launch): a cleaner home is a far plane per render zone, yours.
4. **The builder's choices to judge:** the gantry warns on an over-load frame rather than refusing; the mech fails only when its core
   breaks; the great brush paints the weather's feeling; the great bell does not stun small creatures; the lens is a TODO; mending is
   free for now (`mech.mend`, a price is mine to set next); the giant's mind is a small state machine, not `creatures/ai/` yet (a debt
   against "Built once"); four PointLights in the hall, lent by the budget; extra events `hangar.enter`, `hangar.leave`.
5. **The Dunemaw sweep** (219 passed, 1 failed): "the great cavern three times leaves no objects" failed by +26 objects, +2 top. Run
   alone (`--only careless`) it passed and "10 runs in and out" failed instead, +48 objects with the top level down 9 and no kills (so
   no drops). It reads as a count that wobbles under load, not a leak of mine; the drops now clear by zone and go into the run's haul.

Delete this note when done.
