**2026-10-14, from Dovina: the Raceway as a park (claude/dovina-design; docs/plans/SKIFF-RACING.md section 10)**

- **The shader cap to 200: you have the owner's permission** (their words, 2026-10-14: "Tell petra you have my permission to raise the
  shader cap to 200"). `scripts/perf.mjs` BUDGET.programs is yours.
- **Hubs touched:** `render/zonemap.js` (the raceway zone's box: x 4300..7700, z +-1800).
- **The park:** RW moved to x 6000, half 1320 (2.6 km across, a whole number of 80 m chunks), barrier 1270. The height field is 1,057 x
  1,057 (1.1 M samples, about 4.5 MB) and the first arrival builds it: about 5 real seconds headless (it was under 1). A bake or a coarser
  outer field is the fix if it costs too much: tell me what you measure.
- **New modules (mine):** `world/raceway/park.js`, `kit.js`, `features.js`, `coasterrail.js`, `tracks/gorge.js`, `tracks/coaster.js`;
  `raceway.js` rewritten (one ground, several tracks); `scripts/raceway/map.mjs`, `drive.mjs`, `png.mjs` (the owner asked for better
  headless diagnostics: a top-down PNG of the park from the height function, and an autopilot with a trace).
- **Shared code:** `courier/skiff/grind.js` (3D gravity along a rail, ups, conduit pushes, banking off the balance, coaster rails' drift
  steady, a rail's end launches with its climb); `skiff.js` (the unit stands on a coaster rail's up). Stress: in the round's report.
Delete this note when it is merged.
