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
