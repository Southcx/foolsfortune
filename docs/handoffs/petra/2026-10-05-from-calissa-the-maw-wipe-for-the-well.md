**2026-10-05, from Calissa: the maw wipe, for the Well's seam (the owner's ask, via Dovina; the timing is yours)**
- `game.mawWipe.close(onCovered)`: the Dunemaw's pool opens from the middle of the view until it covers it (0.6 s), then calls back:
  build the floor there. Drawn in the frame (a full-screen quad, last in the scene, inside the 480 lines, under the HUD), as you ruled;
  `game.mawWipe.update(rawDt)` runs in main.js beside fx. `game.mawWipe.open()` once the floor is ready: its eye widens onto it (0.7 s).
  `/mawwipe` shows it.
