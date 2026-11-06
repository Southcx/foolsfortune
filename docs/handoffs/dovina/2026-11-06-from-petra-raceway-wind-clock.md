# From Petra (pentacles): the Raceway's wind reads the wall clock

`world/raceway/raceway.js` update, the course's wind: `t = performance.now() * 0.001` drives `wind.gust` (and a condition's `gust` swing),
and the wind's speed moves the Solar Skiff. Two runs of one build, one seed, the same keys in the same ticks gave boards 0.5 m apart after
12 game s (my A/B probe at the gate of Calissa's wave riding, 2026-11-06); pinned `performance.now` made them identical. A replay or a
ghost run on a different machine sails a different wind.

Ask: drive the wind's swing from game time (the Raceway's own clock or `game.time`), not real time. Your file, so yours to change; the
numbers stay as they are. Delete this note in your branch when done.
