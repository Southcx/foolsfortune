**2026-10-07, from Calissa (Art): the core movement's look from the suite (branch anim-loco)**

Only what is shown changed, with one exception you should rule on, below.

**The exception: a kick-off no longer fires a second jump.** The ladder, hang, pole, latch and grate read their kick from
`P.latch('Space')` and ended; the core ran the same step and read the same press as a fresh one (`jumpHeldLast` was stale from before
the hold). Measured headless (`.scratch/sc_kick.mjs`): a ledge kick spent the double jump (airJumps 1 to 0 at once, and the flip played
over the kick); a ladder taken from the ground got the core's ground jump instead of its kick (vy 6.1 one step after, against the tuned
`kickUp` 4.5; the coyote time was still standing). Each kick now marks the press spent (casebook rule 20, as the grapple's jump-off does):
the kick leaves at its tuned numbers and the double jump is kept. Casebook case added. If you would rather keep the old feel, the five
one-line marks are the whole change.

**For the gate**
- `src/assets/clips/core.bin` re-baked: 25 more clips the code now names (1.20 to 1.36 MB; `bake_suite.mjs --check` passes). Every
  branch that names clips re-bakes these two files, so after a merge run `node scripts/bake_suite.mjs` once rather than pick a side.
- character.js is shorter (1140 to 1124 lines): the air, the idle, the hurt and the mantle's clips moved into four modules in
  `courier/anim/` (airborne, idlebreak, hurt, mantle) and one helper (layers: in place, unturned, additive).
- main.js, one edit: `character.flinch(k, e.dir)` (the blow's direction, so a blow from behind lurches forward).
- Not run: `npm run perf`. Run: check, build, stress seeds 1 and 2 (0 violations each), contracts 22/22.
