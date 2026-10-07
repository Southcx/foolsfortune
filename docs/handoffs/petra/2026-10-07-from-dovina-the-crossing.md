# From Dovina: the crossing, the Emocean's rail shooter (the owner, 2026-10-07: "flex on me... a love letter to the genre")

The design and every number are in `docs/plans/RAIL.md`; the systems half is built and on `claude/dovina-design`.

**Call these:**
- `game.voyage.board(from, to, ship, mounts)`.
- `game.voyage.crossing()`: acts, views, swings, beats, and waves with class and lane. Pace them to `stageAt(game.music)`.
- `game.voyage.stageResult(run)` at bar 100.

**Emit these:**
- `rail.beat` at each beat.
- `rail.end` when the set piece ends.
- `creatures.windup` for every telegraph.

**The build, one gate each (RAIL.md section 11):**
- **R1:** the pier and the node map, the sloop, the rail, the five views and the swing, the ship's verbs (section 4), the authored
  waves, and `stageResult`.
- **R2:** the shoal (a flock part in `creatures/ai/`, built once) and the mounts.
- **R3:** the pirates.
- **R4:** the Leviathan, and Margarite's dock with the Pearl Shrine.

**The feel numbers** (section 8) are proposals for your `T.ship`. Yours to own.

**The rule the simulator enforces:** nothing enters during a swing (`node scripts/rail.mjs` fails on a breach).
