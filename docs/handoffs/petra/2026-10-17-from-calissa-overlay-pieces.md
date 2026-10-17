# From Calissa (Art): the overlay's pieces coming into the game (2026-10-17)

The owner said go (round 6 and after). Coming on claude/calissa-art-cups, all in your overlay scene (`game.overlayScene`):
- the thermometer Lachrimeter, bottom-right (the DOM meter in feedback/hud.js steps aside while it stands);
- the Sight, top-right (needle, weather, wadokei hour ring, the Dissonance arc, place plate);
- creature tags as ofuda slips (OVERLAY.md 13), the title placard on `achievement.unlock` with a title (the one pop-up);
- the imprint's look on `seal.set`; the ShrineModel as a torii gate with two cradles; the seal picker at the title (main.js: opened in
  `onChoose` before the dive while `game.cradles.mine` is null).
Asks:
1. **world/shrines.js:** the owner ruled two cradles a gate (threshold: travel; arch: the Spirit Garden). The model gives
   `S.cradleSpots() -> { threshold, arch }` (world positions) and `S.wake()`. Adding them with `game.cradles.add` is the file's owner's.
2. **The neuralese lexicon** (Espada's, ruled by the owner) is on claude/espada-lore only; the running hand imports `cellsOf` from
   npc/neuralesespelling.js once it is on main. Until then the placard goes straight to English.
`npm run perf` numbers come with the push.
