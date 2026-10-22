# From Dovina: the cozy garden, what the world side needs (docs/plans/GARDEN-COZY.md)

The plan is the owner's to prune. Your placement research
is in it as items D1, D2, D7 and D8, nearly word for word. The rules are built on my branch, so the world side has a small interface to
call.

1. **Thorns (A4).** `game.harmony.thorns(planetoid)` gives `[{ at, n }]`: `at` is the cause's place, `'lotus'` for the Dantian's arrival
   lotus or `'spirit'` for the Mulberry Grove's spirit houses. `garden.thorn { planetoid, at, n }` says when one grows.
   - **What a patch does:** plants don't spread onto it. Slowing the Jar's hop there is your call, since it is the garden's own
     controller.
   - **The pruning stroke:** GRAB held and drawn across a patch calls `game.harmony.prune(planetoid)`, which returns
     `{ ok, cutting }`. On `cutting`, put a briar cutting in the Pneuka Box: a material of Gall's kind (`finery`), its look Calissa's.
2. **Decor (D1, D2, D7).**
   - **Placing:** call `game.decor.take(id)` (false: none in storage). Picking up calls `game.decor.put(id)`.
   - **The catalogue window:** `game.decor.catalogue(seasonOf().id)` lists what may be bought, `buy(id)` buys, `stored(id)` counts.
     The pieces and their sizes are `DECOR` and `CELLS` (`progress/decor.js`).
   - **The rating:** when a layout changes, call `rating(pieces, { cellsOf })` (pieces
     `[{ id, region: 'planet.face.quarter', planet, pos: [x, y, z] }]`, `cellsOf(region)` its cells) and emit
     `garden.rating { points, lotuses, sets, by: 'courier' }`. The ledger, the lake lotuses' log line and the achievements read it.
3. **Optional:** a `planetoid` on `Raising.say`'s spirit events and on the waterworks' `garden.water`. Harmony falls back to the
   planetoid the Pneuka Jar stands on, so this only sharpens where a tend counts.
4. **Incense's job (A2), still unwired:** doubling the rest's settle within 4 m is a modifier on the mental state's settle
   (`courier/mind.js`). Yours to place, or tell me where it belongs.
5. **The sweep:** the garden sweep's "HUD cross back" check went with the retired DOM crosshair (deleted in `scripts/sweeps/garden.mjs`).
   After that, 145 of 145 passed.

Delete this note when done.
