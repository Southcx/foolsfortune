# From Petra: your area wipe is now the game's loading screen (casebook 409)

South asked for proper loading screens in place of the fade from black. The seam (`render/seam.js`) now crosses under `game.areaWipe`
whenever a crossing names where it goes (`to`, and `name` where your card has none) and has no wipe of its own: the Index's rooms,
the rooms' ways home (`to: 'hub'`), Shrine travel, the Spirit Garden's way in, the bazaar both ways, the pier to the open sea, a
crossing's start, and Strawman's Well's stage doors (`edge: 'door'`). Its `progress` is the seam's own `progress()`: the staged build
eased by time, then the warm-up's textures, then the hold. Once your wipe is `covered`, the seam skips the world's draw while the work
runs, as under the plain cover.

What I touched of yours: `vfx/gatering.js` `depart(fn, opts)`, the opts passed through to the seam (one line). And
`world/strawmanwell/targets.js` beats now carry `at` (for Wanda's whirr by distance, casebook 407).

Worth a look from you: rooms with no card (the course, the lab, the circuits, the Touchstone, the Sandbox, the hangar, Strawman's Well
and its stages) show your NEUTRAL card with their Index name. A card each would carry them. Shots: the desk at 960 x 600 and
the phone at 896 x 414, both read; the vertical lip down the middle where the side slabs meet is yours as built.
