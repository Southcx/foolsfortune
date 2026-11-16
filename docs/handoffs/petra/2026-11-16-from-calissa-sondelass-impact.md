# From Calissa (cups): the Sondelass's impact, step 1 of SONDELASS-FEEL.md (South's leave, 2026-11-16)

What changed in your files, and why (South: the hitstop "oftentimes was applied too liberally"):

- `tools/moveset.js`: `impact()` is one line now; its body moved to `tools/moveimpact.js` (moveset was at 796 lines). `STOP_BY_WEIGHT`
  moved there too and is re-exported from moveset. New spec option `impact: 'held'`; without it (every tool but the cutlass) the pulse is
  exactly as before (casebook 210). With it: no world pulse on light, heavy or launcher blows; `blow()` calls `heldStrike` after a
  creature is struck (its hitlag); a heavy or launcher blow holds the Courier's drawn pose 2 frames, a finisher 4 (`character.hold`, once
  a blow's part; the move's clock and strike window run on, so nothing is skipped or struck twice); the world's pulse only on a finisher
  that downs the last hurtable creature within 8 m. The numbers: `IMPACT`, `HITLAG`, `EARNED` in moveimpact.js.
- `creatures/creatures.js`: `hitlag(c, frames, { dir, type, weight, by })` and `lagK(c)`. A kind that honours it sets `c.lags` and
  multiplies its sim step by `lagK(c)` (slipjelly.js, lanternwisp.js: one factor each, the Wisp's mixer and one-shot too); the registry
  then holds that creature's windup clock with it (casebook 184), and only then. Event `creature.hitlag`.
- `boot/creatures.js`: `game.hitFlinch` (vfx/hitflinch.js, `fx` phase).
- The stinger's own pulse (cutlass.js), the parry's and the first stun's (stun.js STUN_STOP) are untouched: a light cut that stuns still
  pulses through stun.js. Say if you want that one moved under the held way too.

## The stress test (for the gate)

With this change: `24 runs, 21600 ticks, seed 1: 7 violations`, all one incident in run #18 (the Courier pushed into the floor by a
freight mover: `mover.push`, `courier.rescue`). On the commit before it (8d37ed3, none of this change): 54 violations, seed 1. So the
mover's embedding is on main already and is not this change's; it is yours to look at.

Also mine, after the builder: while the cutlass's pose is held on a heavy blow or a finisher, its move's clock waits too
(`moveset.js`, the line that advances `c.t`), so the pose never jumps ahead when the hold lets go.

## Step 2 (the time warp and the cancel frame), what changed in moveset.js

All opt-in by a row's `warp` (and its `cancel`); a row without them plays as before (casebook 210). Only c1 .. c4 have them
(`sondelass/sondelassloadout.js`). The rules are in a sibling, `tools/movewarp.js`; moveset.js is at 798 lines.

- `c.t` stays CLIP time, so every existing reader (the pose, sweep, parts, legs, the hips' travel, the ribbon, the fade, fpArc, spent,
  recovering) reads the warped clip time unchanged. A warped move adds `c.mt` (its own time, game s), `c.W` (the warp), `c.t0`, and
  advances `c.t = c.W.clip(c.mt += dt)` where an unwarped one does `c.t += dt * rate` (the held way's hold stops both alike).
- Read in move time on a warped move: the launch's length (`carry`: `c.W.total`), the travel's speed (`drive`: `c.W.clip(c.mt + dt)`),
  `takenAfter`, the charge's hold test (`c.mt` against HOLD), the pose's fade-in.
- `chainOpen` and `freeCutOpen` on a warped move ask `cancelOpen(c)` (the row's `cancel.hit` once anything was struck, else `.whiff`,
  never before the strike's end + a frame) in place of `chain[0]` / the row's `time` / the strike's end.
- A press in a warped move's startup or strike sets `c.queued` (taken at the cancel frame, never lost to BUFFER); a recovery press
  within `PAID_AHEAD` (0.07 s) of the cancel frame waits too; earlier in the recovery it is the paid cut as before.
- `cut()` is free from a warped move's cancel frame (the guard, RMB's specials); new `canCancel()`; cutlass.js's guard line also lets a
  held V take a warped move at its cancel frame.
- `jumpCancel`: a Space latch at or after the cancel frame lets the move go (a whole-body one's launch ended, the core given the jump
  through `jumpBuf`). Before it, an upper move's jump is the core's as ever (it always was free; the swing plays on in the air).
- `trackStartup`: a warped move turns toward the lock's point, else the magnet's pick (`c.aim`), at 12 rad/s until its strike begins;
  an upper move's horizontal velocity is turned with it (its lunge), a whole-body move's launch `o.yaw` and its travel (`drive` now reads
  `c.yaw`, which only a warped move ever changes).
- `sweep()` on a warped move sub-steps the strike's sweep by a 60th of clip time, so a fast clock never jumps a strike's sector; an
  unwarped row sweeps once a frame as before.
- movephases.js reads the warp (frames on the warped clock, `cancel` the whiff's, `cancelHit`); the Anim Lab's phase bar draws the on-hit
  cancel in green.
