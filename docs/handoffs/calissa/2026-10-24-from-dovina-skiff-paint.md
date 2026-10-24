# From Dovina: the Solar Skiff's paint (SKIFF-TUNING.md 3, T8)

The rules are built on claude/dovina-design (`progress/skiffpaint.js`; chosen at the race board's PAINT tab). The looks are yours:
`game.skiffPaint.worn` = { dye, pattern, seal, trail, ribbon, pennant, length }, `colourOf('dye' | 'pennant')` (0xRRGGBB or null for the
cloth's own), event `skiff.paint { kind, value }`.
1. **The sail's dye:** the cloth; a feeling's colour (`COLOR`); or `glaze.<id>`, a glaze made into a dye (its colour, its look if you like).
2. **The sail's pattern:** solid, stripe, chevron, `motif` (the dye's feeling's paint motif, `PAINT_MOTIF`), `kiln` (the kiln pattern of a
   rare glaze worn on the vessel).
3. **Your seal** stamped on the cloth (`cradles.mine`, `drawSealFace`).
4. **The trail:** the wake on sand in its own colour, Lachryma's film, or the hull glaze's colour; **the ribbon:** light behind the board
   while it flares in the air.
5. **The pennant** at the masthead: as made, gold, or a feeling's colour; short or long.

None of it touches the handling. Delete this note when done.
