**2026-10-08, from Calissa (Art): the ostraca's looks are in your dig (branch `art-ostraca-swap-r`, reviewed); six crossings for your review**

The stand-ins in `world/ostraca.js` are swapped at their seams only. Every event, ledger key, save field and the dig's logic are as
they were; `simRand()` is still drawn once a drop.

- **An ostracon** is an `Ostracon` of its word (`drop`). `look.arrive(t, from)` runs on your `s.t` clock: dug out of the sand in the Dunes
  (buried 1 to 0, a mound round it), falling from where its plaster patch was in the workshop, falling from a pot's height (0.35 m)
  in the Great Dunemaw. `take` disposes the look. A buried ostracon draws nothing until it is revealed: the dowse's shiver is still the
  only sign of it. The sparkle shows only during the rise, never while it is veiled. (Review: an ostracon dug in the Dunes keeps the sand's
  normal from the ray `drop` already casts and `look.lieOn(normal, yaw)` lays it on the slope: casebook 64; `simRand()` still once.)
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
- **Update** reads `g.rawDt` for the looks' clocks and updates the loose ostraca, the patches and the stelae.
- **pneuka/thingmodels.js** gets `ostracon.<word>` to `ostraconThing(word)`, and **pneuka/icons.js** renders any `ostracon.*` id
  through it. No Pneuka Box item for an ostracon exists yet. If finding one should give an item, add `ITEMS['ostracon.<word>']` and
  the model and icon follow. I tested this with an injected item and did not commit it.

**Seen while testing, yours:**
- An ostracon dropped on a floor of the Great Dunemaw is added to `g.scene` and is never taken down when the floor goes, so it stays
  wherever that floor stood. Your stand-in did the same.
- `near()` checks only horizontal distance and height, so the sealed stele could be read from outside the back wall while the door was
  shut: the stele stands 0.8 m inside a 0.4 m wall, well within REACH 2.2. **Closed in review** (one more crossing, in your file): `near()`
  offers a stele only while it is drawn (`st.mesh.visible`), and the sealed one is drawn once the door is open.
- Pre-existing, not touched: the Great Dunemaw's ostracon, left lying when the Courier leaves the Well, stays in `loose` for the session, so
  its word is never dropped again (`drop` refuses a word that is loose) and it can be taken by standing where the floor stood.

**Programs (corrected in review): the swap adds three the perf does not see.** `npm run perf` reads the workshop, the Dunes and a Well
hall, and no ostracon is in view at any of them, so it says 160 / 160 / 157 as on the base. Measured with the real warm-up (the prime
draw on), in the Dunes at 160 after boot and three late: standing at a ruins ostracon the page compiles **two** more (`ostracon`, the
potsherd's one shader; and a shadow depth program for an unskinned caster with a map, shared by the ostracon, the flakes, the stele
and the sealed room's blocks, none of which existed before), and the first buried ostracon to rise compiles **one** more (the sparkle's
`ShaderMaterial`). 163 alive in a session that has seen them, 3 compiled mid-play on first sight, none in the warm-up. The first
version (162) had a box-mapped shader and a transparent bank; those are gone.
Your call (ARCHITECTURE.md: "raised only by a commit that names the looks and the reason"): either raise `BUDGET.programs` in
`scripts/perf.mjs` and the Budgets row to 163, naming the ostracon, the mapped caster's depth and the sparkle, and park one of each in
the warm-up so they compile with the rest (`game.solar?.parked()` is the pattern: `Ostraca.parked()` returning a hidden ostracon with
its sparkle shown and a stele, added to `gardenLooks` in `main.js`); or tell me which to give up (the sparkle can be a stock
additive sprite driven from `onBeforeRender`; the ostracon's shader can be three stock materials without the black's sheen). Rule for
the gate: a look is measured where it is first seen, not where the perf stands.

Delete this note when done.
