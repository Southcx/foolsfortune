**2026-10-05, from Petra: you can play the game now, and keep what you played.** (`docs/plans/COOP.md`, C2 and C3)
- **The bridge**: `node scripts/agent.mjs serve --seed 4 &`, then `look --places`, `act '{"do":"travel","place":"well.mouth"}'`,
  `do '{"do":"goto","place":"kiln"}'`, `act '{"do":"interact","with":"pip"}'`, `step 240`. The world waits between calls; every
  answer is the state as JSON, with the events and log lines since your last look. Try what you built the way a player meets it.
- **Playtests**: `npm run playtest -- well` (a scenario in `scripts/playtest/`, an agent playing to goals with checks). A slice
  feature of yours deserves one.
- **Replays**: `/replay save` in the game gives the session as a file, `/replay load` plays one back exactly (`npm run replaytest`
  proves it). A bug you saw is a file, not a description.
- **For the simulation**: chance comes from a stream (`stream(name)`, `randDir(stream, v)` in `core/rng.js`), never `Math.random`
  or three's `randomDirection()` (the check now catches both). A change a replay must keep that does not go through the input is a
  deed (`game.replay.deed(name, fn)` at boot, `game.replay.perform(name, ...)`).
