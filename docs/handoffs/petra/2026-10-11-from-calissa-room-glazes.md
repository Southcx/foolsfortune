**2026-10-11, from Calissa (Art): the room glazes, what crosses your room files, and one ask** (delete in your branch when done)

The workshop's kilns, plinths and stand, the showroom's ware, the hub's walls and the Index's pedestal are fired with real glazes now
(`vfx/roomglazes.js`, the table `ROOM_SURFACES`; drawn by the room glaze atlas in `vfx/surfaces.js`, inside the built surfaces' one
program). What crosses your files, one token each:

- `world/level.js`: an import; the two kiln domes and the kiln's lintel `C.dark`/`C.deep` -> `RG.kiln`; the two chimneys `C.dark` ->
  `RG.chimney`; the gallery's plinths and bases `C.dark`/`C.mid` -> `RG.plinth`; the stand's three tiers `C.mid`/`C.wood` -> `RG.stand`;
  the showroom tables' and the stand's pots take a sixth argument, `wareFor(place, i)` (a colour, or nothing). No new `simRand` draw: the
  seeded layout is the same pot for pot.
- `world/basement/basement.js`: an import; the hub's four walls take `RG.hubWall` (their backs, the course's inner walls, turn grey with
  them); the Index's pedestal is `this.game.level.mat(RG.index)` in place of its own undressed material.
- `world/props/breakables.js`: an import; a pot whose colour is a glossy room glaze's ware goes on `glazeMat`, whatever its body
  (`wareGlossy(color)`), so an oxblood jar shines like an oxblood vase.

**To ask: the dip.** A glazed pot's foot was wiped bare before firing, so the clay shows below a line a finger or two up. In
`world/props/pottery.js` `buildPotGeometry` that is the vertex colour under a height (about 0.08 of the pot's) set to the body's clay
(`MATERIALS[mat].fracture` is near enough) when the pot's colour is a room glaze's ware. Yours if you want it; nothing of mine waits on it.

Numbers, headless (SwiftShader, seed 1, game noon; before is 9ee4b1b, the same seven views as the scout's and the same frames):
programs 163 -> 163 at boot, in every view and at the end, 0 compiled after the warm-up (the glaze is inside the built surfaces'
`pm|surf|` program, which the pedestal now shares too). Calls a view +3 to +8 (the new batches
and their outlines: spawn 470 -> 476, the kiln 188 -> 194, the benches 483 -> 491, the showroom 410 -> 416, the gallery 166 -> 174, the
hub 163 -> 167, the ladder 128 -> 131); triangles within 0.5%; textures +1 (the atlas, 128 x 128 with mips, about 87 KB); geometries
+8 at boot. Draw time not comparable (CPU submit on a machine at load 37 to 56). Every palette colour draws as before: in the views with
no glazed surface the only pixels that differ are the Courier's pose, a folk figure and the motes. Crawl, a quarter pixel of camera slide
a frame, the second difference of luminance inside the glazed surface away from its edges (mean / 99th percentile, levels of 255): the
hub wall 0.11 / 0.93 -> 0.42 / 2.0 (its floor 0.24 / 1.0), the kiln 0.20 / 1.0 -> 0.30 / 1.64, the plinths and the stand no higher.
Not run: `npm run perf`, the stress test, a sweep.
