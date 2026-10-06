**2026-10-06, from Calissa: handover, the glitch, the data drain, the Dunemaw's look, the playlist set** (head: the commit that adds
this note, on `claude/calissa-art-cups`, from main a414619; the owner's direct ask, 2026-10-06)

1. **Main merged in** (nothing new since a414619). No conflicts.
2. **The gate** (`npm run gate` at c06a1e8; the commit after it adds only this note):
   ```
   ok   check            check: OK (no new debt)
   ok   build            built in 7.86s
   ok   stress, seed 1   24 runs, 21600 ticks, seed 1: 0 violations
   ok   stress, seed 2   24 runs, 21600 ticks, seed 2: 0 violations
   ok   playtest well    playtest well, seed 1: 8/8 checks passed in 34 s
   ok   replay test      replay: the same state, exactly
   ok   qais test        qais: OK
   ok   contracts        contracts: 15/15 OK
   ok   perf             perf: OK
   ```
   Perf: dunes geos +1% (the spout's two meshes, the daturas' two instanced meshes), heap +1%, boot -20% (noise on a software GL).
   Programs after the warm-up: 2, was 2 (neither mine: an unnamed ShaderMaterial, a MeshDepthMaterial). The glitch is off at rest (no
   pass, no targets); while on it is one full-screen pass at 480 lines (your A/B).
3. **Outside my lane**, file by file:
   - `src/render/glow.js`: the screen hook you approved. One line in `render()` after the accumulation and one line in `compile()`,
     plus the header line. The pass runs before the bright-pass, on the light-linear frame (the deviation I named in my message).
   - `src/core/config.js`: `visual.glitch: true` (your condition). `src/debug/tuned.js`: `visual.glitch` in SETTINGS (your OK).
   - `src/world/well/dunemaw.js`: your landmark placeholders in `buildMouth` (the three standing stones and the violet beam) replaced
     by the spout (`new DunemawMouth({ radius: 3, spout: true })`), as your landmark note asked. The ring of fallen stones stays.
   - `src/cine/flythrough.js` (new) and `src/cine/overture.board.js`: the gate files `src/cine/` as yours. The overture and the
     sequences were mine (R25 to R27). The flythrough borrows the camera through `game.cinema.shot()`. The board gains glitch cuts at the
     trailer's drops and a smear on the dive. Tell me if `src/cine/` should be yours now, and I'll route through you.
   - `docs/plans/DUNEMAW.md` (new): the spec you asked for. The gate files `docs/plans/` as Dovina's; it's yours and mine.
   - `.gitignore`: `.scratch/` (my headless scripts, never committed).
4. **What you meet:**
   - `game.glitch` (vfx/glitch.js): `.pulse()`, `.drop()`, `.drain()`, `.moment()`, MOMENTS listening on `well.foe`,
     `lockheart.ultimate`, `courier.shatter`, `reprogram.run` and `slam.impact` (hard slams only); `post.screen = game.glitch`.
   - `game.dataDrain` (vfx/datadrain.js): plays on `reprogram.run` unless every function was refused. It blinks the creature's
     `root` and gives it back whole. `prewarm()` is in your warm-up, beside the weather.
   - `game.dunemawMood` (vfx/dunemawkit.js): the kit's shared MOOD uniforms, from `well.floor`, `well.foe` and `well.leave`.
     **New for your layout:** `K.sand` (the heightfields' material; mark it `userData.shared` with the others) and `Sandfall`
     (vfx/dunemaw.js: `update(t, 'open' | 'warn' | 'falling', rawDt)`, a curtain to stand in each shifting door).
   - `game.flythrough` (cine/flythrough.js): plays on `well.floor`, any key skips it. It reads `cur.path` when your floor carries it,
     else it finds the path through the doors.
   - `game.daturas` (vfx/datura.js): three clumps at the oasis pond's far shore (zoneFree, hidden off the Dunes). The Shrine Garden can
     take its own with `new Daturas(game, spots, { parent })`.
   - Chat: `/glitch <moment>` and `/glitch drop`. Glossary: the glitch, the drop-out, the data drain, the spout, a sandfall, a drift tide,
     the twist, the flythrough.
   - New programs, all compiled in the warm-up or made with their meshes at boot: glitch-screen; the data drain's cubes, beam and
     petals; dunemaw-spout and dunemaw-sandfall; datura-flower and datura-leaf. The Sandfall door (dunemaw-sandfall-door) and K.sand
     compile when your layout first uses them: put one in your floor prewarm.
5. **Read from other branches:** nothing.
6. **Rules:** CLAUDE.md gains one line under "Performance and the look": "The look reaches for the sixth and seventh generations (the
   owner, 2026-10-06: .hack's glitch, the frame accumulation, at the moments that earn them); the performance spec stays the sixth's."
   The owner said it in my thread today: "We're 6th-7th generation, I'm just a performance hardass and I figured it'd be easier to have
   hard 6th gen be the spec."

Not verified: any of it on a real GPU; the flythrough on your future layout; the aqua regia in the world (the press is not placed yet).
