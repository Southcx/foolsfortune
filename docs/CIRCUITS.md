# The lap circuits

Timed laps through the gymnasium's pieces, built (`src/world/basement/circuits.js` the runner, `circuitrooms.js` the rooms; the README's
Lap circuits says how to play them). Each takes two or three of the gaps below and makes them the point, reuses existing pieces, and is
a lap: run again at once, with splits, a clean-run bonus (no reset) and a par table. Gaps are sized at about 85% of what the controller
can clear (`RUBRIC` in `world/basement/basement.js`, `T.movement` and `T.tech` in `core/config.js`).

| circuit | the point |
|---|---|
| **The Spindle** | chaining verbs without floor between, and descent: losing height without losing speed |
| **The Mill Race** | timing on moving ground: late at the first mover ruins the third |
| **The Braid** | precision at low speed: a pole, a beam, a bar, the floor a reset pit |
| The Sandbar | superseded by the Solar Skiffing trial (`world/dunes/solar.js`) |

**The gaps the gymnasium leaves** (what a new circuit should ask): chaining; carried speed (nothing punishes shedding it); timing under
motion; descent; precision at low speed; route choice (shortcuts, risk and reward); aim while moving; pacing Lachryma and the dash's
charges; curved and banked ground; whole-run feedback (where the time went, a ghost of the best run).

**The runner's contract**: `Circuit { id, name, layer, gates[], forks[], par: { gold, silver, bronze }, resets[] }`, `Gate { at, radius |
zone, order, route?, minSpeed? }`. A missed `minSpeed` costs a second (the run goes on); each circuit is a start for the stress test.
