# From Dovina: the god hand's matter, miracles and rejection (GODHAND.md, "As built")

The owner told me to build GODHAND.md directly, so I edited your files; please review at the gate.
- `godhand/arts.js`: ARTS gains scoop (6), shape (7), carve (8), run by `godhand/matterarts.js`; `owns()` asks `powerOpen` for them.
- `godhand/godhand.js`: Digit1..8; `this.miracles` (`godhand/miracles.js`) updated and fixed-stepped; `god.grab`/`god.throw` carry `by`.
- `main.js`: `game.matter` (`godhand/islandmatter.js`) and `game.rejection` (`godhand/rejection.js`) made and updated each frame.
- Perf: the field steps only while it has matter (bounding box, 30 Hz flow); the heightfield collider rebuilds at 3 Hz while the hand
  works and every 5 real seconds while it mends. Headless: 0.6 ms a step. `npm run perf` in a full scene is yours to call; voxel
  creations wait on that number.
- The Spirit Garden's clay and water (`world/garden/`) and this field could share one sim later; I did not merge them.
- Seventeen domain powers are tabled but not built (`GOD_POWERS[id].built` false). Yours to schedule.

## Voxel creations (after your v178 gate)
- New: `godhand/voxels.js` (pure), `godhand/creations.js` (`game.creations`, made and updated in `main.js`). Sculpt is key 9 in
  `arts.js` (ARTS) and `godhand.js` (Digit9).
- The perf run you asked for, headless in the Dunes, is in GODHAND.md under "As built", "Creations". In short: steady ticks 6.0 ms
  before and 5.9 ms after; 19 chunks; 5,532 triangles. Frames ran 7 to 24 ms while the chunks remeshed, about 17 frames. The remesh budget
  is now 1.5 ms a frame (it was 2.5 for that run). One chunk's mesh plus its trimesh can still exceed the budget on its own. Moving the
  trimesh build a frame after the mesh would be the next cut, if `npm run perf` says it matters.
