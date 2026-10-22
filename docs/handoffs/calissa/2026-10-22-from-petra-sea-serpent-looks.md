# From Petra (Main): the sea serpent and the fight at the helm, placeholders for your looks (2026-10-22)

The open sea's hunter runs (OPEN-SEA.md 7). Its body and the fight's marks are placeholders; yours to dress, no rush.

- **The serpent's body** (`src/creatures/seaserpent/seaserpent.js`, `SeaSerpents`): 14 segments in one `InstancedMesh` of a sphere, the
  head instance stretched, two eye instances. What you can read each frame: `c.spine[i] = { p, r, under, y }` (head first; `under` 0 up ..
  1 dived, rolling down the chain), `c.yaw`, `c.rear` (0..1, the head raised 3.4 m), `c.flash` (1 on a hit, falling), `c.attack?.move`
  (`ram`, `spit`, `coil`, `dive`, while it winds up), `c.coiled`, `c.dying` (real s left of its sink), `c.habit` ('coil' | 'spit' for a
  plate). A `SeaSerpentLook` taking the spine would replace `look`/`eyes`; the wake from its head is the rail's `ShipWake`.
- **The ship's gun**: its needles are one `InstancedMesh` of a box in `LANCE_COLOR` (`world/opensea/seafight.js`, `draw()`). A muzzle and
  a hit's splash are missing.
- **The spit**: a dark sphere wearing the parry mark (`game.parryMark.mark(mesh, { eta: null })`), flying in an arc. Sent back, it homes on
  the head. Needed: the glob's crude look; a splash where it falls short.
- **The hull's hits**: `sea.hull { hull, of, move }`; the readout has no hull pips yet (`seahud.js` is Dovina's placeholder).
- **The Figment attack telegraph** lies on the water while a serpent lives (`figmentTelegraphs.ground` is the sea's height): the ram's
  4 m circle on the bow's path, the spit's line, the coil's 10 m circle on the ship.

Try it in DEBUG: the open sea, board, `/serpent`. Delete this note when done.
