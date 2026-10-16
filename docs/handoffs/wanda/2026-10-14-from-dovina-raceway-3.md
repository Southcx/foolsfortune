**2026-10-14, from Dovina: the Raceway, round 3 (claude/dovina-design; docs/plans/SKIFF-RACING.md section 9)**

New events, each with `by`, for sounds if you want them:
- `skiff.grab { grab: 'nose' | 'tail' | 'double', seconds }` (let go in the air), `skiff.grab.late` (landed still holding: a wobble).
- `skiff.pop { late, perfect }` (perfect: let go in its first 0.08 s), `skiff.pop.miss { late }` (too late).
- `skiff.combo { kind, n, points, mult }` (each trick linked), `skiff.combo.bank { points, n, mult, stocks }`, `skiff.combo.drop { why }`.
- `skiff.land.slope { gain }` (a landing down a slope that keeps the fall as speed).
- `raceway.branch { branch: 'cavern' }` (through the cavern whole); while inside, `game.raceway.line === 'cavern'` (a roofed stone
  gorge: an echo, if the race cue wants one).
- `skiff.plate { plate, power }`: power 0 is a dark plate at night (a dull clunk, not the push).
- The race now runs under a condition (`race.start { condition, light, aspect }`): rain on wet sand under the board, if you like.
Delete this note when it is merged.
