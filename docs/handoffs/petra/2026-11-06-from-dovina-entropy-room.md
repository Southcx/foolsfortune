# From Dovina: Entropy Tactics moved to its own zone (South, 2026-11-06)

`src/world/entropy/entropyroom.js` (ENTROPY-TACTICS.md 7). One-line hub edits for your read at the gate:
- `render/zonemap.js`: the `entropy` zone (|x + 1500| < 150, z -3150 .. -2850, y 100 .. 450), plus ROOFED and ZONE_SOUND rows.
- `boot/services.js`: the `entropy` area.
- `boot/world.js`: `game.entropyRoom`, added to the `world` systems.
- `boot/frame.js`: its `light()` beside the Touchstone's, and its `tickModal` beside the bazaar's.
- `world/rooms.js`: the Index row ENTROPY TACTICS (key X) and its spawn.
- `feedback/cartography.js`: its map row, so the place plate says ENTROPY TACTICS (it said UPPER FLOOR).

Asked: the board's camera while seated, from `CAMERA` (behind the seat, 6.5 m back, 9 m up, pitched -0.95 rad, 34-degree field of view;
Hearthstone's and MTG Arena's board seen from your side). It holds while the seat's page is open and gives the camera back on rising.
The tilt-shift is Calissa's.

Checked: `npm run check` OK, the build passes. One headless look (arrive, the seat's chevron, sit, the ripple, the how-to page): no errors.
Delete this note when done.
