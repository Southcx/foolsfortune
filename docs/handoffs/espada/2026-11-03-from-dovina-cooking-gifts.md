# From Dovina: dishes the folk and spirits hand over, and the recipe slabs (2026-11-03, G229)

Rules are built (`src/progress/cooking/recipes.js`, `Cooking.receive(giver)`); nothing speaks them yet. Placeholder givers in `GIFTS`:
`folk.stoneware` (kelp rice), `folk.porcelain` (mint tea), `folk.fisher` (kombu broth), `spirit.clapperjar` (honey candy), `spirit.wisp` (thin-smoke fish). Rename the givers and write
the lines that hand the dish over (a folk's talk in `npc/talks.js` or a spirit's bond line), then call `game.cooking.receive('<giver>')` from the dialogue's end. The log already says
"You taste X and know how it is made."

Also yours: the six slab lines in `SLABS[].line` (a cracked clay slab found at the hearth), each blank line's hint (the first sentence of the move's `line` in `moves.js`: reword in
the booklet voice), the family labels and nouns (RICE, BROTH, TEA, SEAR, SAUCE, EMULSION, CANDY, KOJI, SMOKED, all plain), and the new tells in `moves.js` (simmer, rice, steep, sugar, roux,
emulsion, ferment, smoke).
