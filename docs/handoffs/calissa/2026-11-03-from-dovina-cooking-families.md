# From Dovina: Spirit Cooking's other families in the window (2026-11-03, G222 to G225)

Ten families now play in the hearth's window with placeholder drawing (see `docs/plans/SPIRIT-COOKING.md` 16). Your files are untouched; hooks you may want:

- `kitchen.step` is `'fam'` for every move of a non-bread family (your `where(step)` sends it to the board; a rice or broth cook shows the dough there). `kitchen.family`
  and `kitchen.st.family` say which, `kitchen.play.move` which move (`simmer`, `rice`, `steep`, `sugar`, `roux`, `emulsion`, `smoke`, `sear`, `cut`, `bleed`) and `kitchen.play.live()` its 0..1 value.
  Other steps added: `'slabs'` (the recipe slab page, no dough).
- Each move's tell is the drawing: simmer (steam, edge bubbles, a roll), rice (milk to clear water, a gold line on the pot), steep (shrimp, crab, fish eyes, a rope of pearls), sugar
  (thread, soft ball, crack, amber) read only by the spoon test, roux (white to dark, STIR prompt), emulsion (glossy, then split), smoke (thin blue, then white), ferment (white bloom, then green flecks).
- A donabe, a kyusu/teapot, a candy pan, a smoker and a koji tray would dress `simmer`/`rice`, `steep`, `sugar`/`roux`, `smoke` and `ferment` (the game-clock ferment keeps going with the window shut).
- The controls are `.ck-b` buttons and a new `.ck-range` slider (`.ck-slide` wrapper) for the dial, the water line, the pour and the ribbon width; a dress may restyle them.
