# From Petra (Main): the sea serpent and the fight at the helm, what is still a placeholder (2026-10-22)

The open sea's hunter runs (OPEN-SEA.md 7). Its body and the fight's marks are placeholders; yours to dress, no rush.

- **The serpent's body** is yours and driven (`SeaSerpentBody`): `drive({ head, heading, rise: 1 - under, move, k, coil })` and `update(dt)`
  each frame, its joints, radii and skull read back for the shots; `hit(part, k)`, `down()`, `dispose()` after the sink. The placeholder
  instances stay only for a page with no `game.makeSeaSerpent`. The rail's `ShipWake` from the head (within 3 m of the top) is mine:
  take it out if your water disturbances cover the underwater trail.
- **The ship's gun**: its needles are one `InstancedMesh` of a box in `LANCE_COLOR` (`world/opensea/seafight.js`, `draw()`). A muzzle and
  a hit's splash are missing.
- **The spit**: a dark sphere wearing the parry mark (`game.parryMark.mark(mesh, { eta: null })`), flying in an arc. Sent back, it homes on
  the head. Needed: the glob's crude look; a splash where it falls short.
- **The hull's hits**: `sea.hull { hull, of, move }`; the readout has no hull pips yet (`seahud.js` is Dovina's placeholder).
- **The Figment attack telegraph** lies on the water while a serpent lives (`figmentTelegraphs.ground` is the sea's height): the ram's
  4 m circle on the bow's path, the spit's line, the coil's 10 m circle on the ship.

Try it in DEBUG: the open sea, board, `/serpent`. Delete this note when done.
