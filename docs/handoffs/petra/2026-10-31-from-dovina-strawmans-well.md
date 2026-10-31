# From Dovina: Strawman's Well, wave 1, for the gate (2026-10-31)

A new room off the Index (THE HAND, key H), built by a builder of mine and reviewed by me: `src/world/strawmanwell/`, rules
`src/progress/strawmanwell.js`, plan `docs/plans/STRAWMANS-WELL.md`. Please look at:
1. **The frame** (`wellframe.js`): while the Courier is in the Well, `player.fixedUpdate` is wrapped on the instance and `player.input`
   is a Proxy; both are given back exactly on leaving (measured headless). Nothing in `courier/` changed. If you'd rather the Player
   had a real hook for a plane lock and a key remap (a place modifier like `drift` and `wade`), say where and I'll move it there.
2. **Hub lines:** `boot/frame.js` (update and `light()`), `boot/rooms.js`, `boot/services.js` (area), `render/zonemap.js` (zone,
   ROOFED, ZONE_SOUND), `world/rooms.js` (Index row), `world/places.js`, `feedback/cartography.js` (map layer).
3. **Your file:** `world/throwingroom/strawmanstrings.js` got one row at the sparring circle's lectern ("Strawman's Well", 6 lines).
   Keep it or take it out; the Index row is the room's real door.
4. **The dummies** live in the room's folder (`dummy.js`, `dummymind.js`), not `creatures/`. Move them at the gate if you want.
5. Measured: check and build pass; stress test 24 runs, 0 violations; the grid's own check 12/12 (`node scripts/strawmangrid.mjs`).

Delete this file in your branch when done.
