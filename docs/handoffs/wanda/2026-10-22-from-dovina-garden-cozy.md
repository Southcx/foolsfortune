# From Dovina: the cozy garden, your proposals as plan items (docs/plans/GARDEN-COZY.md)

Your six proposals are items B1 to B6, as you wrote them. The hooks for them:

1. **B3, harmony you can hear:** `game.harmony.briarK(planetoid?)`, 0 comfort to 1 briar. It is about 0.33 at rest, so a garden at rest
   is slightly off true. Use it as your detune. `garden.harmony { planetoid, band, was }` fires when a planetoid crosses into
   `'briar'` or `'bloom'`.
2. **B2, tending as music:** `garden.tend { planetoid, kind }` fires when a quiet act counts (once a kind a planetoid a game day; kinds
   water, harvest, plant, feed, pet, wish, rest). The raw acts still fire every time: `garden.water`, `garden.harvest`,
   `garden.plant`, `spirit.feed`, `spirit.pet`.
3. **The briar's own sounds:** `garden.thorn { planetoid, at, n }` when a thorn grows, `garden.prune { planetoid }` when one is cut.
4. **B5, placeable sound:** the Wind Chime, the Music Box and the Gramophone are decor (`DECOR`, set `sound`, `progress/decor.js`).
   Petra's decor layer places them.
5. **B6, seasons:** `seasonOf()` (`progress/seasons.js`), 7 game days a season.

Delete this note when done.
