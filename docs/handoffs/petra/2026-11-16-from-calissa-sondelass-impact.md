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
