# The rail crossing: the owner's four reports, diagnosed (2026-10-20)

For Calissa (Art), read-only. Nothing in the repo was edited.

**How this was measured:** the game was booted headless on a dev server with no reload (`vite.noreload.mjs`, HMR off, so another
division's edits could not restart the page; the first try was cut short by exactly that). A drafted passage was sailed whole, with
the waypoint types forced. Probe 1 (`probe.mjs`) sailed wreckers, leviathan and shoal: 352 bars, 10 swings, 109 pattern plays, 5,767
emitted shots, 3,147 ship samples. Probe 2 (`probe2.mjs`) sailed shoal, wreckers and shoal: 320 bars, 9 swings, 7,147 reticle
samples. The window was 960 x 540 and the seed 3. The raw data is in `log.json`, `ret.json` and `plan.json`, read by `analyse.mjs`, all
in this folder.

The ship was kept from breaking with `E.wound = () => {}` and never shot back. As a result no hit-stop fired, and the stage had no cue
(headless audio).

**The frame convention used throughout:** rail-local +x is the chase view's screen right. `stage.rail.toWorld` maps local x to world -x
(stage.js:68). The probe confirmed it: local -x lands on the left of the screen in the chase and free views.

---

## Report 1: "an unusual limitation to the range of motion of the ship"

**Cause:** one box in metres for every view, `T.ship.box = { x: 7, yLo: 1.2, yHi: 7, z: 7 }` (core/config.js:381), clamped in
`Ship.update` (courier/ship/ship.js:139-140). The cameras, however, stand at very different distances (courier/ship/views.js:32-38):
7.5 m behind in chase, 10 m in free, 30 m up in above and 24 m abeam in side. Each camera also follows a share of the ship's offset
(`follow` 0.1 to 0.35), which shrinks the on-screen travel further. No view's clamp is derived from its camera.

**Measured:** the ship driven to all four corners of its box in every view. NDC runs from -1 to 1, so ±1 is the screen edge.

| view | local reach (m) | screen reach: NDC x | screen reach: NDC y | share of the screen the ship can reach |
|---|---|---|---|---|
| chase | x ±7, y 1.2..7 | -0.49..0.49 | -0.57..0.14 | about 49% of width, 36% of height; the top 43% can never be reached |
| free | x ±7, y 1.2..7 | -0.37..0.36 | -0.35..0.19 | 37% x 27% |
| astern | x ±7, y 1.2..7 | -0.38..0.38 | -0.46..0.08 | 38% x 27% |
| above | x ±7, z ±7 | -0.19..0.19 | -0.64..-0.03 | **19% x 31%, all in the lower half** |
| side | z ±7, y 1.2..7 | -0.35..0.12 | -0.14..0.21 | **23% x 17%**: a postage stamp left of centre |

The Umbral form shrinks the box to 0.8 (`FORM.umbral.box`, ship.js:55), and so does a heavier hull (`hull.box`).

**Proposed fix (minimal; Petra's: ship.js, views.js, config.js):** give each view its own box, sized from its rig to reach about 0.8
NDC. Either add a `box` to each `VIEW_RIGS` row and clamp with it in `Ship.update`, or compute the box once per view at `begin` by
unprojecting ±0.8 NDC at the ship's depth for that rig.

Read off the measured slopes, roughly: chase x ±11.5 and yHi 12; free x ±15 and yHi 13.5; astern x ±14.5 and yHi 14.5; above x ±29.5
and z -10.5..+26; side z -20..+27 and yHi 17. yLo stays at 1.2 (over the sea).

There is a cheaper alternative: bring the above camera (30 m) and the side camera (24 m) in to about 12 m. Then the 7 m box fills
those screens, at the cost of seeing less ahead.

**Hand-off:** Dovina must re-check the pattern fairness box (`fair(..., box = 12)`, patterns.js:163) and the waves' lanes (`L * 6`,
waves.js PATHS) once the reach grows.

---

## Report 2: "the targeting reticle breaks/becomes locked when changing perspectives"

There are four separate causes, all in `Ship.aimAt` (courier/ship/ship.js:183-206). In the free views at rest, the aim itself is sound:
the far reticle sits under the cursor with a median error of 0.005 NDC (n 3,252) and a p95 of 0.022, through the corkscrews and loops
too (n 157, max 0.023).

1. **The reticle is locked to the scroll line for every above and side phase, and snaps there at the swing's midpoint.** `RET` is only
   `{ chase, free, astern }` (ship.js:52), so in above and side the far reticle is `nose + forward * 36`, whatever the mouse does. This
   is by design (views.js header, "a shmup's honesty"), but nothing tells the player.
   - Measured at the chase>above swing: the reticle stays on the cursor (0.4, -0.3) until k 0.41. At k 0.54 it jumps to (0, 0.44),
     then runs up to (0, 0.85) and stays there for the whole phase, 36 bars (54 real s), with an error of about 1.2 NDC.
   - Chase>side behaves the same: it moves to (1.27, -0.03), past the right edge of the screen, because the scroll line is 36 m ahead
     of the nose on the side view's +z, the screen's right.

2. **The hidden cursor keeps integrating the mouse during those phases, so the reticle comes back pinned at the edge.**
   `C.x += I.dx ...` (ship.js:188) runs whether or not the view uses the cursor.
   - Measured: probe 2 kept the mouse moving gently during the scroll phases (`dx` = 4 px a frame). Over one above phase the hidden
     cursor went from 0.40 to 1.00, the clamp.
   - At the above>free swing's k 0.54 the reticle reappeared at (1.01, -0.32): stuck on the right edge until the mouse is dragged back.
   - Probe 1 moved the mouse a little each frame. The cursor sat at the clamp (1, 1) for 3,128 of its 3,147 samples. This is the
     "becomes locked".

3. **In the first half of a swing out of the side view, the reticle flies off the screen.** The aim keeps the old view's way (`view`
   flips only at k 0.5, stage.js:181-182) while the camera has already turned.
   - Measured at side>astern: far NDC (1.51, -0.05) at k 0.14, (3.43, -0.20) at k 0.28 and (-3.31, 0.42) at k 0.41, then (1.06, -0.32)
     at k 0.54.

4. **When the gun's way points away from the camera, the ray-plane test fails and falls back to an off-screen point.** On the swing
   from astern to chase, the view turns to chase at k 0.5 (gun +z) while the camera still faces mostly astern. The plane 36 m ahead is
   then behind the eye: `t <= 0`, and the fallback is `nose + f * 36` (ship.js:193-194).
   - Measured: far (0, 1.33) at k 0.54, error 1.67, against 0.02 a frame either side.

5. **Minor: `reaim()` uses last frame's camera, despite its comment** (stage.js:195, "through this frame's camera"). main.js runs
   `game.emocean.update` at line 1284 and places the camera after it, in `player.updateCamera` at line 1292.
   - Measured: an error of 0.02 to 0.05 NDC during swings, against 0.005 at rest.
   - Right after a swing ends, the cinema's ease (`ease: 40`) adds a frame or two of 0.38 (free, bar 184.63).

**Proposed fix (Petra's; ship.js, stage.js, main.js order):**
- Integrate the mouse into `C` only while the view uses the cursor (`free` in aimAt). Better still, also keep showing the cursor in the
  scroll views as a dim mark, so the player sees the lock.
- During a swing, choose the aim by the camera actually used, not by the half of the swing. Ease the reticle from its cursor place to
  its scroll place across the swing's bar instead of snapping at k 0.5.
- When `t <= 0`, put the far reticle on the cursor's ray at `d2` metres from the camera, never at `nose + f * 36`.
- Re-aim after `player.updateCamera` (a hook main.js calls after the camera), or build the ray from `_sh` (the rig this frame) rather
  than from `game.camera`.

**Also broken:** the existing check `scripts/railaimtest.mjs` judges the view from `E.plan.acts`, which is `[]` on a drafted passage
(stage.js:142). On every trip its "free views" filter is empty, so it measures nothing on the crossing the game actually sails now.

---

## Report 3: "the emission of bullet patterns ... desynchronized and often appearing from no clear source"

### No clear source (measured)

**Cause 1: most patterns are thrown from a bare point 60 m up the rail.** The point is `AHEAD = [0, 4, 60]` (world/emocean/legrunner.js:20
and :56; patternplayer.js:44 falls back to it too). **84 of 109 plays (77%) had no thrower.**

| view | shots | spawned more than 4 m from any body | spawned off the screen |
|---|---|---|---|
| free | 1,535 | 1,534 | — |
| side | 1,191 | 792 | 1,159 (97%; NDC x about +3 to +4, beyond the right edge) |
| above | 2,840 | 1,389 | 1,782 |

**Cause 2: `from: 'object'` always resolves to nothing.** The trip asks `S.piece?.emitter?.()` (triprun.js:60), but **no set piece
defines `emitter()`**: a grep of src/ finds the word only in that call.

So every "object" pattern also comes from the bare point:
- the Wreckers' peak (`stackFan` and `splitShell`, legs.js:70-71);
- Old Nobody's peak (`rose` and `sweepBeam`, legs.js:82-83).

Meanwhile the bodies are elsewhere. The brig sits at local x -17 (`ABEAM`, pirates.js:33) and Old Nobody at x -24 (leviathan.js:32), on
the far flank. In the free view that is the left of the screen, nowhere near (0, 4, 60).

**Cause 3: a role thrower is "the newest live foe of that role"** (legrunner.js:55), with no care for where it is. In a formation the
newest is always the last member: the rightmost of a line or vee, the +x flank of a pincer. Measured:
- `frenzyDash from=school` fired from a pincer fish at x -42.5, off the left of the screen.
- `multiSpiral` and `rotatingRing` from a heavy at z 74 (still arriving) and z 129 (already leaving, off the screen).
- `aimedBurst` and `homingSalvo` from a darter on the very frame it spawned (always the same point, [-12.8, 4, 37]).
- In the shoal's peak the fish are role `glint` (shoal.js:130), so `from: 'school'` (legs.js:58-59) finds only stragglers or nothing.
  10 of the 11 frenzyDash plays came from the bare point.

**Cause 4: a pattern has no tell.** Only the brig's ports (pirates.js:125) and Old Nobody's fin and throat (leviathan.js:174) put up a
telegraph mark. A pattern from a foe fires on the bar its event lands, with no windup on the thrower.

### Desynchronised (measured and read)

**The volleys run on seconds of frame dt, not on the music's grid.** A pattern starts on its bar, then `r.t += dt` (patternplayer.js:42)
against `every` values in plain seconds (patterns.js:50-105): 0.08, 0.1, 0.12, 0.15, 0.35, 0.6, 1, 1.2, 2.5, ... A sixteenth is
1.5 / 16 = 0.09375 s.

Measured share of emissions more than a quarter of a sixteenth off the grid:

| pattern | off the grid |
|---|---|
| rose | 67% |
| multiSpiral, doubleHelix | 57% |
| gapWall, splitShell, offsetTwins, sweepBeam | 50% |
| aimedBurst | 43% |
| sineCurtain, accelRain | 40% |
| stackFan, rotatingRing, cageRing | 0% (their `every` happens to be on the beat) |

The waves of old fired on the sixteenth (waves.js:128-131), but they are `quiet` on a trip (stage.js:144).

**The pattern clock is the wrong clock** (read; not exercised headless). `PatternPlayer.update` gets the game's scaled `dt`
(triprun.js:148), while the bar is raw time slewed to the cue (`stage.clock`, stage.js:236-245).
- Every hit-stop (`rail.down` 0.05x for 0.04 to 0.08 s plus release; the parry pulse 0.05x for 0.08 s plus 0.2 s release) leaves every
  running pattern about 0.1 to 0.17 s (1 to 2 sixteenths) late against the beat. The lag accumulates.
- When the stage clock jumps or slews to the cue (`d > 3`, or the slew), the patterns do not follow.
- Measured with no hit-stop and no cue: a constant one-frame offset (-0.017 s), as expected.

**Proposed fix:**
- Dovina, `progress/rail/patterns.js` and `legs.js`:
  - express `every` and `gap` in sixteenths (or quantise them at emit: `at = round(at / (BAR_S / 16)) * BAR_S / 16`);
  - give 'object' and the roles a fallback that is a body, or drop 'ahead' for a visible carrier: Rez's emitters were always bodies.
- Petra (or Dovina), `world/emocean/patternplayer.js` and `legrunner.js`:
  - drive each run by the stage clock: `r.t = (stage.bar - r.bar0) * BAR_S`, never by `dt`;
  - choose a role thrower that is alive and in frame (`local.z` in 10..70, projected on the screen), else skip the play rather than
    fire from the bare point;
  - put a telegraph mark on the thrower a half-bar before its first volley (`shots.telegraphs.mark`, as pirates.js:125), and move the
    play back by that lead.
- Petra, set pieces: give `PiratesPiece`, `LeviathanPiece`, `ShoalPiece` and `Charybdis` an `emitter()` that returns a part
  `{ local, alive }`: the brig's hull or bow, Old Nobody's throat or `at`, the Conductor (role `caller`).

---

## Report 4: "Many of the emitters are also offset, aiming at the left region of the screen where they will never hit the ship"

There are two causes, one for the chase and free views and one for the side view.

### Chase and free: the cone mode tilts every shot 20 degrees to the left

**Cause:** in cone mode, `dirOf` (progress/rail/patterns.js:38-45) always tilts the aim by `cone` = 0.35 rad (20 degrees). It tilts
toward `u cos(deg) + v sin(deg)`. The basis is `u = cross(up, f)` (patterns.js:33). With the layout aim of `[0, 0, -1]` used by the
player (patternplayer.js:28), that gives `u = (-1, 0, 0)`: local -x, the left of the screen in chase and free.

So a shot at `deg 0`, the one meant to be "aimed", leaves 20 degrees to the left. Every fan of arc 50 to 70 degrees centred on 0 lies
wholly on the left half of the cone. `legs.js:183` (`modeOf`) puts every chase and free pattern in cone mode.

**Measured, from `emit` with the player's layout aim:**
- Every fan and aimed pattern has **100% of its shots tilted left and 0% within 3 degrees of the aim**, mean `dir.x` -0.34
  (= sin 0.35). That covers evenFan, oddFan, aimedBurst, offsetTwins, stackFan, gapWall, sineCurtain, accelRain, stratRain, crossGate,
  splitShell, snakeLaser, frenzyDash ("dash straight at where you are"), homingSalvo, itano, curving, decelBurst, mixed and sweepBeam.
- The rings and spirals are symmetric about the aim (mean 0), but none is within 3 degrees of it.
- In play (chase), the angle between a shot's heading and the ship had a median of 20.1 degrees (p90 28). 92 of 201 chase shots were
  more than 0.3 NDC left of the ship one second on.
- At 60 m, 20 degrees is about 22 m to the left at the ship's depth. The box is ±7 m, so those shots cannot hit.

### Side: plane patterns fan out in depth

**Cause:** plane mode uses `up = [0, 1, 0]` always, so the pattern's plane is the horizontal (x, z). The player never passes `ctx.up`
(patternplayer.js:28). The side view's camera looks along x, and its ship is pinned at x = 0 (the wall plane, ship.js:136). So a fan,
a wall or a ring there spreads in depth, toward and away from the camera, not across the screen. Only the shot on the aim line can
ever cross the ship's plane.

**Measured:** in the side view, 1,064 of 1,191 shots were heading left on the screen, and 1,159 spawned off its right edge. They read
as streams that fly in from nowhere on the right and pass the ship into the left of the screen.

**A smaller leftward pull:** the bodies of the set pieces stand on the far flank, at local -x: the brig at x -17 and Old Nobody at
x -24. That is screen left in the chase and free views, where the trip shows the Old Nobody peak (legs.js:74, peak 'free'). Their own
shots (pirates.js:121, leviathan.js:177) are aimed correctly at the ship.

**Proposed fix (Dovina's: `progress/rail/patterns.js`, with the player's call in `patternplayer.js`):**
- In cone mode, give `deg` the meaning it has in plane mode, an angle off the aim: `dir = f cos(a) + s sin(a)`, with `s` the sideways
  axis on the screen (u). Keep the azimuthal cone only for the ring-type patterns (ring, rotatingRing, spiral, multiSpiral,
  doubleHelix, accelSpiral, rose, fragmentRing), behind a flag on those rows (`cone: true`). The minimal one-line version: `cone = 0`
  when `deg` is 0 and the pattern is not ring-type.
- Pass the view's plane to `emit` instead of the fixed up: `up` = the view's camera axis in the rail frame (side: local +x; above:
  local +y). Emit with the true aim each volley, rather than laying the pattern on `[0, 0, -1]` and turning it with
  `setFromUnitVectors`, whose twist about the aim is not defined.
- Fix `fair()` to judge in the view's plane, or this passes the checker: it never asks where a cone shot actually goes.

---

## Anything else found on the way

- **`cageRing` closes on the wrong point.** It closes on a point `ctx.range || 30` m along the aim (patterns.js:123), but the player
  throws it from 60 m (AHEAD). The ring closes 30 m in front of the ship, never round it. Pass the distance to the ship as `range`.
  (Dovina)
- **The set pieces' choreography was written for the old script's views.** Old Nobody's breach is meant for above and his flank for
  side, but the trip shows its peak in 'free' (legs.js:74). Its body sits at local x -24, mostly off the left edge of the free view.
  Either the trip's peak view should be the director's, or the director should be told the view. (Dovina for legs.js, Petra for
  leviathan.js)
- **A swing clears only the shot field.** `field.clear()` runs at a swing (triprun.js:147), but a run still queued in the
  `PatternPlayer` keeps emitting into the new view. `legs.js` keeps new plays out of the 3 bars before a swing (`SWING_CLEAR`), and the
  longest runs are 4 to 5 s (multiSpiral and doubleHelix, 40 volleys at 0.1 s). Call `player.stop()` with the clear. (Petra or Dovina)
- **Release shots sub-frame.** `PatternPlayer.update` fires every shot due this frame at the thrower's current place and does not
  advance a shot by its overshoot `r.t - s.at`. At 0.08 s spacing, a 60 Hz frame lumps spirals in pairs. Minor. (Dovina)
- **Tracking is wrong for trips.** `stage.look` reads `this.plan.acts` for the breather calm (stage.js:302), which is always empty on
  a trip. Harmless, but the same mismatch as `railaimtest`.

## Owners at a glance

| fix | owner |
|---|---|
| reach per view, reticle (aimAt, reaim order), `emitter()` on the set pieces | Petra (courier/ship/, world/emocean/ stage, pirates, leviathan, shoal, charybdis, main.js) |
| `dirOf` cone, the plane's `up`, `every` on the grid, cageRing range, `fair()`, legs' throwers and peak views | Dovina (progress/rail/patterns.js, legs.js) |
| the pattern player and leg runner's clock, thrower choice, tell lead, stop at a swing | per their headers, the shot runtime is Dovina's (the split of 2026-10-08), though the files sit in world/ (Petra's by CLAUDE.md): settle at the gate |
| a visible carrier for 'ahead' patterns, the reticle's look in the scroll views and during swings | Calissa (the look) once the rules above exist |

**Verified:** everything in the tables above, headless on the noted seed. **Not verified:** the hit-stop and cue-slew drift of the
pattern clock (read from the code; no hit-stop or audio ran headless), and the feel of any proposed box size.
