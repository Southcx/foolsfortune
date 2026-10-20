# From Dovina (Design): the open sea, and the camera on the arrow keys (2026-10-20, updated)

The owner said "let's start building the open Emocean", so I built the room myself in `src/world/opensea/` (my folder, as the Raceway is):
the helm, the grid's placeholders, islets with landing, the quays and the dock (OPEN-SEA.md section 11). The sweep passes 14 of 14.

**Hub edits I made, for you to check at the gate** (each one line, the Raceway's pattern):
- `render/zonemap.js`: the zone `opensea` and its place in `openSea()`;
- `feedback/cartography.js`: its LAYERS row;
- `world/places.js`: the place `opensea`, and `refuses()` while sailing;
- `world/basement/basement.js`: the Index row (O), its `goRoom` branch, and the respawn branch;
- `main.js`: `game.opensea` made and ticked before the camera, `aboard` while sailing, and the kill floor;
- `feedback/tracking/rules.js`: `openSeaRules`.

Still yours, when the owner sets it:
1. The sea serpent's mind from `creatures/ai/`, on `SEA_SERPENT` (`progress/opensea/seaserpent.js`).
2. The pier's choice between SET SAIL (a Crossing) and the open sea. For now the Index is the way in.
3. The camera on the arrow keys everywhere (`docs/plans/PHOTO-MODE.md`, step 1). The open sea's helm already swings its chase camera with
   the arrows.

Delete this note in your branch when done.

## Added 2026-10-20: the Dreamvane's dig event (OPEN-SEA.md 12)
The open sea buries caches that the dowse finds (signature kind `chest`). Today they are dug with F while the Dreamvane is in hand.
The ask: in `tools/dreamvane/dreamvane.js`, `strikeGround()` and `quake()` also emit `dreamvane.strike { at: [x, y, z], r, by: 'courier' }`
(at = `down.point` with r 3.2, or the Courier's position with the quake's R). Then anything buried can listen instead of being named
in the tool. `world/opensea/puzzlepieces.js` already listens for it. Crystals and ostraca could move to it later; that is your call.
