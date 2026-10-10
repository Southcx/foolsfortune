**2026-10-10, from Calissa (Art): the combat wing crosses your files, and a frame over budget to rule on** (delete in your branch when done)

The owner put me alone on the Throwing Room's combat look and ruled that this covers its geometry (docs/plans/COMBAT-LAB.md). The room's
south wall is now an arcade into a hall of five stations (`world/testroom/combatwing.js`, measures `TR.wing` in `layout.js`). What it
touched of yours, each small:

- `world/testroom/room.js`: the south wall's one `level.box` is `buildCombatWing(level)`; that wall's wainscot entry left the list (the
  arcade keeps it on its piers); two header lines. Strawman moved to the sparring circle's centre (`TR.strawman`; the place follows it).
- `render/zonemap.js`: the testroom zone has a second box for the wing (to 10.5 m up, 36.7 south), so the hall is drawn with the room.
- `world/basement/basement.js`: the ceiling slab goes round `TR.wing.z0` as it goes round the room.
- `world/places.js`: five places for the stations. `debug/debugchest.js`: the default case reads `TR.wing.chests`.
- `scripts/sweeps/workshop.mjs` (Dovina's): the Strawman check stands 1.3 m in front of Strawman wherever he is.

**To rule on: a frame over 450 calls, and it was there before the wing.** The testroom draws the whole Workshop zone whenever the
Workshop's door is in the frustum within 40 m (`zones.js seesDoor`), and from much of the room a sliver of the doorway is. Measured,
one presented frame, every pass counted as perf.mjs counts:

| pose | base (d1b12d2) | this branch |
|---|---|---|
| room, facing the Workshop's door from x 26 | 465 calls | 455 |
| room's far corner, facing the door | 468 | 456 |
| the wing's far end (z -34), facing the arcade: the door seen through the west bay | (no wing) | 497 |
| the wing's stations, each from its stand | (no wing) | 85 to 98 |

The fix is yours to choose: an occlusion test for the doorway (a few rays from the camera through the door's opening against the static
colliders: the arcade's piers and the room's walls stop most of them), or a portal backdrop (one plane in the doorway drawn when the
Workshop is not: a sixth-generation trick), or a shorter `seesDoor` range from the wing with the backdrop. I changed none of it.

Verified: check, build, the station shots (scratchpad), the workshop sweep. Not verified: the stress test (the core movement and the
physics are untouched: no collider moved except the room's south wall, now the arcade).
