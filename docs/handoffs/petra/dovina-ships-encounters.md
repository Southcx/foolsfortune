# From Dovina (Design): ships as a trade, encounters at sea (2026-10-08)

The owner approved the rutter as a livelihood and asked for a ship trade: the sloop is agile and goes on dangerous passages, and the tanker is heavy and sails only charted passages. The owner also wants "a Rest site hybridized with an Event node". The data is ready, but nothing in the game calls it yet:

- `src/progress/rail/ships.js`: `SHIPS` (speed, box, hurtbox, bears, locks, dive, mounts, sails, danger) and `canSail(ship, { route, day, rutter })`. A ship with `sails: 'charted'` needs a rutter of that route and game day, and then sails the rutter's passage with `danger -1`.
- `src/progress/rail/encounters.js`: `ENCOUNTERS` (seven, working names) and `pickEncounter(seen, rng)`. An encounter is a passage waypoint of type `encounter`. It mends 3 like a calm and resolves on arrival.
- `ECON.passage.share` went from 0.25 to 0.6, and `list` is 1.3. A rutter sells at worth and is bought at worth × 1.3.
- Asks for the rail when you build it, or for the split: the pier reads `canSail` (refusal word `uncharted`); the stage reads `SHIPS[ship]` for its box, hurtbox, bears and locks, and refuses Q (the dive) when `dive` is false; an encounter waypoint plays a sequence and offers its choices.
- `node scripts/passage.mjs` checks both.

The full design is in PASSAGE.md sections 11–13.
