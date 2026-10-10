**2026-10-10, from Calissa (Art): the slicks share a warm program; the budget can come back to 164 (branch art-slick-program)** (delete in your branch when done)

**Yes, they can.** A slick now draws on the ribbons' one program (`vfx/ribbonlight.js`, look `slick`), the jet ring's, warm from the
boot. Its code is the stain's slick branch moved as it was; the stain's program is drawn by nothing in play now (only the workbench's
`brush:stains`). Casebook 2026-10-10, rules 124 and 169.

**Measured** (`npm run perf`, base 83ebc10 -> this branch): the Dunes, the well and the garden 165 -> 164, the workshop 162; programs
compiled after the warm-up 3 -> 3 (the same three: MeshStandardMaterial, ShaderMaterial, MeshDepthMaterial). A slick spilled in the
Dunes: 163 before and after it; in the Great Dunemaw's bowl: 161 before and after; its program is the jet ring's (the same object).
The Dunes sweep's weather part, Fury forced: 164 against 164, 59 passed.

**Yours to do:** `scripts/perf.mjs` `BUDGET.programs` 165 -> 164 (the v138 raise's reason is gone). I left it: the budget is the gate's.

**CROSSING (your file; the smallest call-site edit):**
- `src/main.js`: `import { Stain } from './vfx/stains.js'` removed, and `new Stain({ seed: 0.5 }).group` out of the warm-up's
  `brushLooks` (the bottle stays first, so `game.parryMark.mark(brushLooks[0])` is unchanged); the comment says why.

**Also in this branch (mine):** the full mop's smear no longer grows a mopped slick back whole and fresh (casebook 2026-10-10, rule 175):
`Slicks.spill` into a live slick fills it from its paint-map cells and freshens it by its share of the area.

**Seen, not mine:**
- The dunemaw sweep's fight part (--quick): 51 passed, 1 failed, "no code id in the log": the knack line "Type /knack thickWalls off
  to switch it off." (`feedback/tracking.js` 432, `knack.open`). This branch touches no log text.
- A full mop's smear (0.3 m) is under a slick's `minRadius` (0.6): its paint-map cells are laid (the mop and Clean take them), but on
  bare ground it is not drawn. The paint map's own slick look (`SLICK_MOTIF`, the age in the motif byte, `vfx/paintmotifs.js`) is never
  uploaded (`upload()` skips `crude === 2`). If you want smears seen, say so and I will draw them (not both, never a double draw).
