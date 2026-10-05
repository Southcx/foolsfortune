**2026-10-05, from Calissa: handover, the R43 review fixes** (the head is the commit that adds this note, on `claude/calissa-art-cups`, from main 241ada1)

1. **Main merged in.** The one conflict was `docs/HANDOFFS.md`: I took main's. My answer to the R43 review is
   `2026-10-05-from-calissa-r43-review-answered.md` in this folder, and the review note in mine is deleted.
2. **The gate** (`npm run gate`, at fa1f66a; the commit after it only adds this note):
   ```
   ok   check            check: OK (no new debt)
   ok   build            built in 12.92s
   ok   stress, seed 1   24 runs, 21600 ticks, seed 1: 0 violations
   ok   stress, seed 2   24 runs, 21600 ticks, seed 2: 0 violations
   ok   playtest well    playtest well, seed 1: 8/8 checks passed in 35 s
   ok   replay test      replay: the same state, exactly
   ok   contracts        contracts: 13/13 OK
   ok   perf             perf: OK
   lanes: 12 files changed, all in Calissa's lane or the hubs
   ```
   Perf moves: programs +4% (+4) in both places, and that is the weather look now compiled in the warm-up, not on the first weather.
   bootS -17% and the dunes' tick and draw times dropped (earlier run: -36%): partly the weather idling while calm (its group hidden,
   its update returned early), the rest probably noise from a software GL.
   **Programs compiled after the warm-up: 5, none of them mine.** Every art material now has a `name` (`weather-*`, `maw-wipe`,
   `shore-swash`, `crude-sea`, `liquid-water`, `liquid-lachryma`, `sky-dome`, `sky-env`, `clouds`), and none is on the list. The four
   unnamed ShaderMaterials are `render/glow.js`'s passes: three share one vertex shader, one writes sRGB, they are not in the scene,
   so `compileAsync(scene)` never sees them. A probe walking the scene found no owner for them. The fifth is a MeshDepthMaterial.
   Yours: name them, and compile the passes in the warm-up (render them once into the target).
3. **Outside my lane:** `src/main.js`, two lines in the warm-up: `const parkWeather = game.weatherLook?.prewarm?.()` beside the maw
   wipe and the shore, and `parkWeather?.()` after the prime.
4. **What others meet:**
   - `weatherLook.prewarm()`: it makes the weather's meshes and shows them for the compile, then returns what hides them.
   - `hourGrade(phase, out?)` takes an optional grade to write into; `render/daylight.js`'s call is unchanged.
   - `mawWipe.close(cb)` now returns true or false (false while a callback waits, and then it does nothing).
   - The sky dome draws a moon by night where the sun was (`uNight`). No new events, save sections, chat commands or glossary words.
5. **Read from other branches:** nothing.
6. **Rules:** no change to CLAUDE.md or ARCHITECTURE.md.

Not done: the save sections for `ff.vfx.overrides`, `ff.cine.overrides` and the window colours (they are read when the module loads,
before `game.save` exists); they stay adopted.
