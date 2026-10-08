**2026-10-08, from Calissa (Art): the ostraca's looks are in your dig (branch `art-ostraca-swap`); four crossings for your review**

The stand-ins in `world/ostraca.js` are swapped at their seams only. Every event, ledger key, save field and the dig's logic are as
they were; `simRand()` is still drawn once a drop.

- **A sherd** is an `Ostracon` of its word (`drop`). `look.arrive(t, from)` runs on your `s.t` clock: dug out of the sand in the Dunes
  (buried 1 to 0, a mound round it), falling from where its plaster patch was in the workshop, falling from a pot's height (0.35 m)
  in the Great Dunemaw. `take` disposes the look. A buried sherd draws nothing until it is revealed: the dowse's shiver is still the
  only sign of it. The sparkle shows only during the rise, never while it is veiled.
- **A stele** is a `Stele` (`addStele`, now with a `yaw` argument). Its face carries Espada's sentence (`STELE_TEXT`), a clause to a row.
  The cavern's faces the bowl's middle. `cavern()` disposes the last cavern's `stele.ring` before it adds the new one. Without that,
  each visit kept a 640 x 1120 face texture and left a stale reach entry in `this.stelae`.
- **The sealed room** uses `sandstoneMaterial({ ashlar: true })`, coursed blocks. `box()` lays each box with
  `layStone(geometry, its position)`, so the UVs are in metres and the courses run on from box to box. This is a plain textured
  material: no new shader program. The door slab is `sandstoneMaterial()`, one plain monolith (`door.m.material`).
- **The sealed room's stele is drawn only once the door is open.** `sealedRoom()` hides it while the door is shut and `open()` shows
  it. `addStele` now returns its entry. While shut, nothing can see inside, and hiding it saves about 9k triangles and its shadow
  calls in the Dunes.
- **The plaster patch** is a `PlasterPatch` (vfx/plasterpatch.js), 3 cm proud of the wall as your box was. In `struck`, your three
  dispose calls became `look.break({ vfx, floorY: 0 })`. It leaves the scar and throws the flakes and dust (`plaster.break` and
  `plaster.land` in the library).
- **Update** reads `g.rawDt` for the looks' clocks and updates the loose sherds, the patches and the stelae.
- **pneuka/thingmodels.js** gets `ostracon.<word>` to `ostraconThing(word)`, and **pneuka/icons.js** renders any `ostracon.*` id
  through it. No Pneuka Box item for an ostracon exists yet. If finding one should give an item, add `ITEMS['ostracon.<word>']` and
  the model and icon follow. I tested this with an injected item and did not commit it.

**Seen while testing, yours:**
- A sherd dropped on a floor of the Great Dunemaw is added to `g.scene` and is never taken down when the floor goes, so it stays
  wherever that floor stood. Your stand-in did the same.
- `near()` checks only horizontal distance and height, so the sealed stele can be read from outside the back wall while the door is
  shut: the stele stands 0.8 m inside a 0.4 m wall, well within REACH 2.2. A check such as `st.mesh.visible` or `this.door.open` for
  `stele.sealed` would close this.

**Programs:** `npm run perf` on the base (84ab0ad) gave 160 programs in the Dunes and the Dunemaw, which is the budget. My first
version (a box-mapped shader, and a transparent bank) made it 162. Both are now plain materials (numbers in my report).

Delete this note when done.
