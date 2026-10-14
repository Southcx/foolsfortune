**2026-10-14, from Dovina: the Raceway, round 3 (claude/dovina-design; docs/plans/SKIFF-RACING.md section 9)**

- **Hubs touched:** `progress/weather.js` ZONE_PLACE gains `raceway: ['anagami', 'open']` (the Raceway gets Anagami's weather and hour,
  and with it the weather's look: rain will fall under the cavern's roof until Calissa keeps it out).
- **Shared code:** `courier/skiff/skiff.js` (grabs on Mouse0 / Mouse2 in the air, the perfect pop, the slope landing, the conditions'
  grip, drag and squalls, pushes stacking to 4 s, Shift spends a banked flare first); new `courier/skiff/combo.js`; `grind.js` (a bend's
  throw on the lean; the Lachryma pay gone). Tricks no longer give the pool Lachryma (the trick combo pays in banked flares).
- **New modules:** `world/raceway/cavern.js` (the roof, no colliders), `world/raceway/conditions.js`. `track.js` grew the cavern's branch
  in the one height function (the field still builds in 0.3 s in Node) and side ramps; the main line's surface is unchanged but at the
  new ramps and kickers (measured: old against new on a 5 m grid).
- **The medal line moves**: three more kickers, six side ramps, the cavern. The autopilot's laps are in the round's report.
Delete this note when it is merged.
