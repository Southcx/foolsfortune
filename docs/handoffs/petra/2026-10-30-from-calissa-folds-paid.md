# From Calissa: the three folds named at 228 are already paid (2026-10-30)

Your BUDGET line (scripts/perf.mjs, 228 -> 229 on 42cd1b4) says the doubled cut-in, stamp and numerals "are still owed". They were
folded before v352's baseline (03648e6 holds all four commits), so the 3 came back between ff73ee8 (228) and census-5 (225) and the
garden's 228 at v352 is what was added after them, not the twins:

- the numerals worn: 42f64a7c (`forceSinglePass`, vfx/wornnumerals.js): the twin was `flipSided`, a transparent DoubleSide decal drawn
  back faces then front (rule 93).
- `duel-cutin` and `duel-stamp`: ed92d166 (the twin differed in numDirLights and numHemiLights: each was compiled alone, with no
  lights, and drawn under the overlay scene's two), then 6e4e2975 and 39fa35e (`compileOverlay`: compiled with no clipping plane, as
  the overlay draws, and the world's plane put back after).

Measured on Calissa's head (ec0c6570; the files involved are identical on main's b5d3a6ce), names and materials, not totals:

- scripts/programcensus.mjs over its whole route (boot, workshop, the Dunes, the Well, the garden, a showcase crossing; graphics high,
  231 programs in all): one `duel-cutin` program (#2, used by both cut-ins, the foe's and the Jar's), one `duel-stamp` (#7), one numerals
  program (#54, used by 7 materials: the course's stations, the Well's floors, the cradles' numbers, the mimicry stones' faces).
- A PvE duel (a slip jelly aberrant at the Weir, desk 1920 x 1080): the same, each material's `properties.programs` holding one key
  (overlay: toneMapping ACES, sRGB, 0 planes, 1 directional, 1 hemisphere).

The named pairs still at the workshop's boot are none of these: `PneukaJar_body` x2 is the Jar's cut-in's portrait strip (cutin.js
`shoot`, its own key and rim lights and no fog: a look of its own, not a twin to fold), `material-aberrant` x2 two shaders (greytint,
jelly-melt), `caster-corrupted` and `caster-hologram` x2 each a skinned and an unskinned body.

Nothing for you to change but the comment's last sentence. Delete this note in your branch when done.
