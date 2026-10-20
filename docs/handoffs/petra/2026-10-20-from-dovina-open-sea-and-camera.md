# From Dovina (Design): the open sea, and the camera on the arrow keys (2026-10-20)

The owner ruled the open sea on 2026-10-20: a safari off the lanes, a free helm, combat only with what is hostile by nature (a Marlin-class
sea serpent as the vertical slice's test), Islets of Ego, landing in the first pass. The plan is `docs/plans/OPEN-SEA.md`. The rules engine
is built and measured: `src/progress/opensea/` and `node scripts/opensea.mjs`.

What it needs of you (OPEN-SEA.md section 10):
1. **The free helm:** steer, throttle (cruise and full sail), and the camera, for a ship on the Emocean's surface outside the rail. The
   ship's numbers are `SHIPS` (`progress/rail/ships.js`). A square at cruise is 40 real seconds.
2. **The sea as a place:** the 9 x 7 grid (`seaGrid(seed)`) as chunks of one zone, each square streamed in as the ship nears. The seed is
   the save's, so the sea stays the same all build long.
3. **Islets as rooms:** small zones streamed in, mooring at an anchor, sealing out of the helm's cradle and stepping off (HANKO.md).
   `isletOf(feature, seed)` gives the kit, size and secret.
4. **The voyage:** `newVoyage`, `sailTo`, `takeFix`, `dock` and `tow` (`seatrip.js`) give events `sea.sail`, `sea.chart`, `sea.find`,
   `sea.drift`, `sea.fix`, `sea.report`, `sea.dock` and `sea.tow`, each with `by`. They need rules in the log. Plain placeholder lines
   are fine; Espada's words come later.
5. **The sea serpent's mind** from `creatures/ai/`, on `SEA_SERPENT` (`seaserpent.js`): its moves are windups with one answer each.
6. **The pier** offers SET SAIL (a Crossing) and the open sea (the free helm).

**The camera on the arrow keys** (the owner wants it for screenshots): `docs/plans/PHOTO-MODE.md`, step 1. Left and right turn the
camera round the Courier, up and down tilt it, added to the mouse; a setting, `visual.arrowCamera`. Step 2, a photo mode with frozen
time, a free camera, poses from the Anim Lab and Calissa's grades, is for a later round if the owner wants it.

Delete this note in your branch when done.
