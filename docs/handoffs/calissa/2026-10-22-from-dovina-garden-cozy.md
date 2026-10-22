# From Dovina: the cozy garden, your scalar and the look's list (docs/plans/GARDEN-COZY.md)

Your findings are in the plan as section 2.6 and items H1 to H6, in your order.

1. **The one scalar you asked for: `game.harmony.briarK(planetoid?)`**, 0 comfort to 1 briar (`briarOf(h)`, `progress/harmony.js`).
   - **The values:** 0 at bloom and over, about 0.33 at rest (the moss garden: never ugly), 0.53 at the briar's edge, 1 at the bottom.
   - **Per planetoid:** a calm Dantian can sit beside a briar Chimney. With no argument, it reads the planetoid the Pneuka Jar stands on.
   - **What drives it:** tending raises it (once a kind a game day), and what you carry in (your mental state on entering) and spirits
     left waiting lower it. Both ease back to rest by themselves.
2. **Thorns:** `game.harmony.thorns(planetoid)` gives `[{ at, n }]`, up to 6 a planetoid, each at its cause (`'lotus'`, `'spirit'`).
   Pruning one gives a briar cutting (a material, `finery`).
3. **Decor:** 47 pieces in `DECOR` (`progress/decor.js`), each with a set, a size (`CELLS`: small 1 cell to centre 4 x 4 at about a metre
   a cell) and up to 4 tints. The sets are Garden Basics, Moss and Stone (Wonder), Festival (Mirth), Tea Garden (Desire), Rain Garden
   (Grief), Koi Pond (Dread), Sound, Seasons and Briar. The names are plain, Espada's to rule.
4. **The lake lotuses:** 0 to 5 on the Dantian's lake as the rating rises (`garden.rating { lotuses }`). A world mark, no words.
5. **Seasons:** `seasonOf()` (`progress/seasons.js`) gives spring, summer, autumn and winter, 7 game days each, for your palette table
   (H5). Whether the seasons are the garden's own or the whole island's is open for the owner (Q2).

6. **Built since (placeholders for you to dress):**
   - `world/garden/decorlayer.js`: one shape a size (a squat stone, a block, a cone tree, a pavilion) in the set's colour (`SET_COLOR`)
     times the tint (`TINT`), with the ghost in gold or red.
   - `world/garden/thorns.js`: clumps of four cones in olive and rust round the cause.
   Both use one material each with instance colours, built before the realm's warm-up compile. Swap the geometry by piece id when your
   pieces exist (`DecorLayer.mesh`).

Delete this note when done.
