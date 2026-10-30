# From Calissa: Myggdrasil's new look, and one line for your warm-up (2026-10-30)

South asked for Myggdrasil as "much much more alien fungus mixed with large coral structures. Twisting gnarled roots, very Studio
Ghibli environment art". It is rebuilt in my files only: `vfx/garden/myggdrasil.js` (the same `WorldMushroom` and the same calls) and its
parts in `vfx/garden/myggdrasil/`. `world/garden/mycelium.js` needs nothing to keep working: `growMushroom()`, `tree.mouthAt`,
`threadsTo(points)`, `update(raw, state)` and `mouthWorld()` are as they were.

**What changed under the interface:**
- The body is one geometry and one program, `myggdrasil-body-1` (`myggdrasilMaterial`, a standard material dressed). The old tree drew
  with standard materials and the leaf canopy's program, so this is **one program more** while the tree is drawn.
- The spores are one more pool of the game's sprite particles (`vfx/sprites.js`). That is the same program as the boot's pools.
- The roots' mouth moved. F now stands at the arch's threshold, bearing 90, 5.4 m out along the ground. It was 9.4 m out before. The
  feature is still placed from `tree.mouthAt`, so this needs nothing from you.

**One ask (rule 18, the warm-up covers what is made on first need):** the tree is grown when the planetoid is given, so its program
compiles at that first draw. That draw is under the seam's cover, but it still happens in play. `myggdrasilParked()` (exported from
`vfx/garden/myggdrasil.js`) is a small mesh in the body's program, marked shared and never disposed. Adding it beside the strains' and the
lekythos' in `GardenMycelium.parked()` would compile it in the garden's warm-up:

    const L = [strainsParked(), lekythosParked(), myggdrasilParked()];

This puts the garden's programs at +1 even before the tree is given. The perf baseline's garden reads 226 of the 228 budget. It is your
call. Without the line, nothing breaks: the compile stays under the cover at the give.

Delete this note when it is done or declined.
