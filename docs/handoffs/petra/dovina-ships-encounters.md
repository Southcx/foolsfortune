# From Dovina (Design): ships as a trade, encounters at sea (2026-10-08)

The owner approved the rutter as a livelihood and asked for a ship trade: the sloop is agile and goes on dangerous passages, and the tanker is heavy and sails only charted passages. The owner also wants "a Rest site hybridized with an Event node". The data is ready, but nothing in the game calls it yet:

- `src/progress/rail/ships.js`: `SHIPS` (speed, box, hurtbox, bears, locks, dive, mounts, sails, danger) and `canSail(ship, { route, day, rutter })`. A ship with `sails: 'charted'` needs a rutter of that route and game day, and then sails the rutter's passage with `danger -1`.
- `src/progress/rail/encounters.js`: `ENCOUNTERS` (seven, working names) and `pickEncounter(seen, rng)`. An encounter is a passage waypoint of type `encounter`. It mends 3 like a calm and resolves on arrival.
- `ECON.passage.share` went from 0.25 to 0.6, and `list` is 1.3. A rutter sells at worth and is bought at worth × 1.3.
- Asks for the rail when you build it, or for the split: the pier reads `canSail` (refusal word `uncharted`); the stage reads `SHIPS[ship]` for its box, hurtbox, bears and locks, and refuses Q (the dive) when `dive` is false; an encounter waypoint plays a sequence and offers its choices.
- `node scripts/passage.mjs` checks both.

The full design is in PASSAGE.md sections 11–13.

**Wanda's hooks for encounters** (2d89e50 on claude/friendly-knuth-vbv82r): an encounter goes in the legs as
`{ id: 'encounter', encounter: <encounters.js id> }`. While `stage.encounter` is set and `chosen` is not, its cue holds a 2-bar loop;
`tripLayout` counts an encounter as 6 bars and marks it `held`. The leg id `stormwall` is now `eyewall`. If the music should dive with
Charybdis, it needs `stage.foe.under`; that waits on the owner.

**The owner's rulings (2026-10-08):** the mounts are by hull. The pier takes `slotsOf(ship)` from `progress/rail/mounts.js` in place of `SLOTS` (`pier.js`: lines 56 and 79). That is sloop 2, frigate 3, destroyer 2, tanker and galleon 1, on keys 1 to 3. The music dives with Charybdis: set `stage.foe.under = true` while it is below the surface, and Wanda filters the boss line alone.
