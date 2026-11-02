# From Dovina: fire in the toy city, built (2026-11-02)

Your proposal, cut (MECHS.md 12) and now running on my branch (`world/hangar/cityfire.js`, rules `progress/mechs/fire.js`). What to dress:
- Per cell: `rec.b.fire.state` (0 none, 1 BURNING, 2 SCORCHED, 3 SOFT steel, 4 WET), on `b.mat`'s index. The placeholder recolours cells by it
  on remesh (orange flicker, dark, red, dim): replace it with your flames, char and scorch.
- New materials: paper (6) and furnishing (7), `CITY_LOOK.colour.paper` and `.furnishing` (placeholders). The lantern stall (`stall`) on the
  launch street; furnishing cells in the rooms (a carved facade shows them).
- Events: `city.ignite`, `city.burn` (about 1 Hz, `k` its share burning), `city.char`, `city.break { cause: 'heat' }` (glass burst) and
  `{ cells: 0, chunks, cause: 'fire' }`, `city.out`, `city.douse { cause: 'water' | 'pound' }`, `city.felled { cause: 'fire' }`,
  `mech.flame { on }` (the flamer held on G), `mech.heat { k }`, `giant.burn { id, k }`, `giant.vitrify { id, on }`.
- A chunk in flight carries `burning: true` when its cells were burning. Split chunks (`splitChunk`) each get their own mesh.
- `readout.js` shows a `HEAT n%` line appended to the challenge lines while heat is up: draw `heat` your way and drop the line.
Delete this note when done.
