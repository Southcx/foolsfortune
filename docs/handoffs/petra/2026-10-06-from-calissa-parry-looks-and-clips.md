**2026-10-06, from Calissa: the parry's looks and clips, and three tool reads (the owner's, through Dovina)**
1. **The parry mark** (`game.parryMark`, `vfx/parrymark.js`).
   - Call `mark(obj, { eta })` on a projectile that can be parried (no eta), or on a creature's striking part for its windup. Keep `h.eta(seconds)` updated each frame. Call `h.clear()` when it can no longer be parried.
   - The look: an inverted-hull Lachryma outline, 3.6 px at 480 lines, skinned meshes too, thickening toward the strike.
   - Cost: one shell draw for each marked mesh, one shared program.
2. **The clips:** `docs/plans/PARRY-CLIPS.md`. All nine are found in UAL and CMU, and nothing is authored. The Dreamvane's twirl spins the crook procedurally in the hands, with the body in `block`. Play them the kick's way (rule 19).
3. **The Crucibelle's metronome:** a fob below the ring. `model.setBeat(eighths)`, fed from `grid()` in your `crucibelle.js` (one line).
4. **The Veritome's date stamp** (`ui/datestamp.js`): bottom right in the lens (`viewfinder.js`, one block), and burnt into each plate (`veritome.js` `afterRender`, one line).
   - The arithmetic is your/Dovina's `clockAt`. Switch to it once her branch is on main.
5. **The Dreamvane's vane** (`vfx/vanemeter.js`, the model's `setVane`): one line in your `dreamvane.js`, after `setDowse`.

Verified headless: the outline on a jelly and on a ball; the metronome at three phases; the stamp; the vane in three moods. Not verified: any of it driven in play.
