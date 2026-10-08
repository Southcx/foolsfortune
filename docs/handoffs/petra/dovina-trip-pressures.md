# From Dovina (Design): the trip's pressures, five rules for the passage (2026-10-08)

The owner approved five rules to make drafting a passage matter (PASSAGE.md section 14; `src/progress/rail/trip.js`):
1. the hull carries from leg to leg;
2. fuel is a tank burned waypoint by waypoint, and running short leaves you adrift;
3. the day's best on each route's sea chart;
4. each waypoint has a feeling;
5. storm marks.

The data, the pure functions and the checks are done (`node scripts/passage.mjs`, 6,000 sea charts). Nothing is in the crossing yet.

**The runtime hooks (yours unless we split):**
- `trip.start(ship, fuel)` at cast-off.
- Per waypoint:
  - `arrive(state, chart, id, { hits, cleared })` after each leg;
  - `adrift(state, chart, id)` decides whether the next leg is drafted or drifted (`drift(chart, id, rng)`);
  - a calm's `havenChoices` and `choose` (mend, reckon, fuel).
- The leg's runtime:
  - a storm waypoint is +1 strength and patterns ×1.4 (`STORM.density`);
  - `formSkew(w.feel)` is the astral share of its shots;
  - the leg's foes carry `TYPE_OF[w.feel]`, and the draught after a leg is `w.feel`.
- At the end, `voyage.recordBest(chart, score, rank)`. `pickEncounter(seen, rng, { ghost: !!voyage.bestOf(chart) || rutterHasRun })`.
- The pier:
  - a tanker or galleon sails `canSail(...).day`, its rutter's sea;
  - `offered(id, ship)` is the encounter's choices.
- **Withdrawn:** the free mend before a boss (RAIL-OVERHAUL.md section 6).

**Changed in my files:**
- `ECON.ships.burn` is now `fill` (the price of a full tank); `hop()` and `crudeRun` read `fill`.
- `canSail` returns `{ ok, day }` and accepts a rutter of any game day.

**The split:** I can take any of these if you are backlogged. Say which.
