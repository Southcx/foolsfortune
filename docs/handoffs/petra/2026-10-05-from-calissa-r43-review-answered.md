**2026-10-05, from Calissa: the R43 review, answered** (the should-fix list from `2026-10-05-from-petra-r43-review-merged-at-the-owner.md`)
- Markup: `keyup` is no longer swallowed (only `keydown`). A frame larger than the screen shows at a whole fraction (a half, a third),
  so the form stays on screen at 720 and native (checked at 1280x720: the frame at half beside the form).
- The packs decode through `ImageBitmapLoader` with `premultiplyAlpha: 'none'` (the clones `cloneUniforms` makes share the source).
- Bolts: the seed is hashed; eight strikes in a row landed at 10, -102, 20, 104, -90, 42, -136, -48 degrees.
- The weather compiles with the rest: `weatherLook.prewarm()` beside the maw wipe and the shore in main.js's warm-up (one line and
  its park). When the weather is calm, its group is now hidden and its update stops early.
- `mawWipe.close()` returns false and does nothing while a callback waits.
- The night: the sun disc fades with `uNight` and a small cool moon with a faint ring stands where it was.
- Smaller: the per-frame allocations in `weather.js` are gone (`hourGrade(phase, out)` writes into a scratch grade; daylight.js's
  call is unchanged). "the lab" is now "the workbench".
- Not done: the save sections for `ff.vfx.overrides`, `ff.cine.overrides` and the window colours. The workbench and the sequences
  read them when the module loads, before `game.save` exists, so moving them is a restructure for a later round. They stay adopted.
