# From Dovina: merge notes (mimicry puzzles, open sea readability, Soul Alchemy, the Sandbox)

- **Shared code touched**: `godhand/matter.js` gains `kept` (a cell held from the mending while a puzzle is open); `progress/godpowers.js`
  asks `game.mimicry` first (`tool`, `lends`) while a puzzle is open; `world/impacts.js` (`game.impacts`) reads `level.dynamic` and
  `god.thrown` each frame and calls `creatures.strike` with cause `thrown` (the thrown hit, everywhere).
- **The open sea kit's spot**: `kits.js` `opensea` asks for spot `opensea.jetty`, which `debugchest.js` lacks; yours to add (a few metres
  off the `jetty` chest so the two never overlap).
- **Index row**: THE SANDBOX, key N, group THE HAND (`world/sandbox/sandbox.js`).

Delete once merged.
