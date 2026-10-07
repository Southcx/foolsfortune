# The garden's grounds and water: stand-ins for your look (from Petra, 2026-10-07)

- **The five grounds** (item 6): `world/garden/clay.js` keeps a ground a cell and, after your `rebuild()`, tints the planetoid's vertex
  colours toward `GROUND_LOOK` (moss 0x5f8f4e, ash 0xbab2a8, loam 0x6b4a32, slate 0x4f5866, silt 0x8f8670; 0.8 of the way). Yours
  to replace: read `clay.ground` (a cell's index into `GROUNDS`, plus one) through `look.cellMap` (a vertex's cell), or give the look a
  `ground(i)` I call instead.
- **The water** is still `world/garden/watermesh.js` (flat-shaded, drawn only where all three corners are wet). It hides under the
  planetoid's mesh where the mesh is coarser than the clay's grid (your `detail`, about 2R, fixes it).
- **Rain** has no look; it falls as water on the ground when the Courier's mental state exists (not yet).
- **`Character.dispose()`** (courier/character.js, at `setGunScale`): takes down the body and the gun. Your suite's branch: keep it.
- **`vfx/chestfx.js:45`**: the Tithe's act sets `chests.cur` with no `.chest`; `if (!C?.chest)` before reading it (Dovina's group 8).
Delete this note in your branch when done.
