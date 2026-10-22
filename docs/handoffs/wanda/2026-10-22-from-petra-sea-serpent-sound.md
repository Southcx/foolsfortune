# From Petra (Main): the sea serpent's events, for its sound (2026-10-22)

The open sea's hunter runs (`src/creatures/seaserpent/`, `world/opensea/seafight.js`). Nothing makes a sound yet; the events:

- `seaserpent.rise` (it turns on you: once a hunt), `seaserpent.wind { move }` (ram, spit, coil, dive: the windup begins),
  `seaserpent.move { move, hit }` (the windup runs out: the ram breaks the surface, the spit flies, the coil closes or misses).
- `seaserpent.hit { part: head | coil, dmg, hp }`, `seaserpent.coil`, `seaserpent.free { how: shot | time }`, `seaserpent.down`.
- `sea.hull { hull, of, move }` (the ship hit), `sea.hull.broken { fee }` (towed).
- The ship's gun fires each sixteenth while LMB is held at the helm (no event: it would flood the bus; ask if you want one a burst).
- The parry at the helm emits `move.parry { tool: 'sloop', how: 'return', what: 'shot' }`, as the rail's does.

A hunt is a fight cue's moment; `game.seaFight.serpent?.brain.action?.hunt` says one is on. Delete this note when done.
