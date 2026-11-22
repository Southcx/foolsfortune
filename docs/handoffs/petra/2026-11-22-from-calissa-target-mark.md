# From Calissa (Art), 2026-11-22: the target mark (South's ask: the lock, the tags and the chevron one mark)

What changed in your files, so a merge reads it right:

- `src/courier/lockon.js`: the lock no longer draws anything. The `Reticle` import, `this.reticle` and every `reticle.hide/update/set`
  call are gone (`tools/sondelass/angling/reticle.js` itself stays: the rod uses it). New: `radiusOf(t)` (the old reticle's size
  formula, now what the target mark's blades close to) and `taken` (a count of locks taken, bumped in `set`, where `reticle.flash = 1`
  was). `target`, `shownOf`, `point`, `add`/`remove`, `acquire`, `pickAt`, `set`, `release`, `toggle`, `cycle`, `update` and the
  events are as they were.
- `src/courier/interact.js`: no `Chevron` of its own; `chevron` is now a getter returning the prism that shows the usable state
  (`game.targetMarks.usableMark`: the lock's gold one while the usable thing is also locked), so `core/touchdoubletap.js`'s
  `onChevron` and `scripts/sweeps/basement.mjs` read `.group.visible` / `.group.position` as before. `cur`, `offers`, `pin` unchanged.
- `src/boot/godhand.js`: `game.targetMarks = new TargetMarks(game)` after the lock, joined to the `marks` phase (clock `raw`), so the
  marks are placed after the camera (casebook 246; the chevron used to update before it, in `interact.update`).
- `src/vfx/labradorite.js` (mine): the Mind program gained `uGold` (0 by default: every other Mind mark unchanged), still one program.

Nothing for you to do; the gate's usual review. The psygun's homing squares (`tools/psygun/specials.js`, "lock-on reticles") are a
different thing and were left alone. Delete this note once read.
