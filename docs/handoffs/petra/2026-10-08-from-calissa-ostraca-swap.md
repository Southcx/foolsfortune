**2026-10-08, from Calissa (Art): what the ostraca's second swap adds to your dig (branch `art-ostraca-swap-r-on-base`, reviewed, on the base that already has the first swap); crossings for your review**

The base already had the ostraca's and the stelae's looks in `world/ostraca.js` (the lazy looks made within 80 m, `parked()` for the
warm-up, `footOf`, the cavern's stele made once). This adds what that swap left out, at the same seams. Every event, ledger key, save
field and the dig's logic are as they were; `simRand()` is still drawn once a drop.

- **The plaster patch** is a `PlasterPatch` (vfx/plasterpatch.js), 3 cm proud of the wall as your box was. In `struck`, your three
  dispose calls became `look.break({ vfx, floorY: 0 })`: it leaves the scar and throws the flakes and dust (`plaster.break` and
  `plaster.land` in the library). `update` calls `p.look.update(dt)`.
- **An ostracon that falls** (from its plaster patch, from a pot's height of 0.35 m): `drop` keeps `s.from`, and the look's
  `arrive(t, from)` runs on your `s.t` clock (0.8 real seconds) in place of the climb out of the sand, which on the workshop's tiles was
  a mound of sand with the ostracon rising out of it. `tend` makes a late look with `arrive` too.
- **An ostracon in the Dunes, or by a column, lies on the slope** (casebook 64): `drop` keeps the normal of the ray it already casts,
  and `look.lieOn(normal, yaw)` lays the look on it. The buried six are laid on the sand that is drawn, point and normal from a ray in
  `build()` (not `heightAt`, which stood 15 cm above it at one dig: the veiled mound hung in the air and jumped down when the pick
  lifted it).
- **The sealed room** uses `sandstoneMaterial({ ashlar: true })`: `box()` lays each box with `layStone(geometry, its position)`, so
  the courses run on from box to box; the door slab is `sandstoneMaterial()`, one plain monolith. A textured standard material: no
  new program.
- **The sealed room's stele is drawn only once the door is open** (`sealedRoom()` hides it, `open()` shows it), so your `near()` guard
  on `look.group.visible` stops it being read through the back wall: it was drawn inside the shut walls and offered from 1.9 m behind.
- **A stele's face** carries Espada's sentence (`STELE_TEXT`), a clause to a row (the three words of `def.words` stay in `stele.read`).
  She is asked to confirm that is canon.
- **pneuka/thingmodels.js** gets `ostracon.<word>` to `ostraconThing(word)`, and **pneuka/icons.js** renders any `ostracon.*` id
  through it. No Pneuka Box item for an ostracon exists yet: if finding one should give an item, add `ITEMS['ostracon.<word>']` and
  the model and icon follow (tested with an injected item, not committed; 6 to 8 KB an icon).

**Programs.** Against this base the swap adds none: your `parked()` warms the ostracon's body and the sparkle at boot, and every
other new material is a stock textured standard material. One late program remains, as on the base before this swap: the shadow depth
of an unskinned caster with a map (the first mapped static caster: the ostraca's, the stelae's, now the flakes' and the sealed room's
blocks), compiled the first time one is drawn in the sun's shadow; `parked()` is under the world, outside the shadow's frustum. If
you want it warmed, one mapped caster parked inside the frustum for the prime draw does it.

**Seen while testing, yours, not touched:** a Great Dunemaw ostracon left lying when the Courier leaves the Well stays in `loose` for
the session, so its word is never dropped again (`drop` refuses a word that is loose) and it can be taken by standing where the floor
stood.

Delete this note when done.
