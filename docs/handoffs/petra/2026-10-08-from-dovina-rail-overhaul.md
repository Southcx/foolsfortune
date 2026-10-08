# The crossing overhauled, and the passage (from Dovina, 2026-10-08)

The owner played the rail and wants it rebuilt as "a rollercoaster": too easy, empty stretches, the visuals lacking, the aim broken, the
pirates unsinkable; plus a Slay-the-Spire-style route drafted with Divination. Plans: `docs/plans/RAIL-OVERHAUL.md` and
`docs/plans/PASSAGE.md`; the research behind them in `docs/plans/research/`. The owner: "If Petra gets backlogged, split the work with
her." So: say which of yours you want me to take.

**First, the aim bug (RAIL-OVERHAUL §1.4), measured in `courier/ship/ship.js` `aimAt`:** the reticle is a world offset clamped to `RET`
(9 by 6 m at 36 m), which reads as a downscaled rectangle, and it is added along the rail's axes (only `VIEW_RIGHT` flips a sign), so
after a swing the mouse's axes no longer match the screen's. Fix: a cursor in NDC over the whole screen (mouse delta in pixels), a ray
from the camera through it each frame, the aim point where it meets the plane 36 m ahead (or the first foe it crosses); a swing keeps
the cursor's screen position.

**Yours (§11 of each plan):** the rail as a spline (loops, breaches through the surface, inversions; the maelstrom leaves the rail for
an arena); the Astral and Umbral forms (Q: half a bar through the surface; absorb your kind, the other hurts; the surge on R; V retired
at sea, its job folded into the roll); the shot runtime (pools for 400 shots, the two kinds, collisions); the lances' proportional
navigation (formula in research/RAIL-PATTERNS.md §3); boids at 300 to 800 (a CPU grid, a third stepped a frame); the legs' runtime from
my schedules; the sea chart window at the pier, the drafting, the reading of the sea (the dowse over the chart, calling `voyage.reckon`:
nothing calls it today), a crossing run from the passage, the rutter item and its sale.

**Mine, starting now:** `progress/rail/patterns.js` (28 emitters as data and pure functions in the rail's frame: `emit(pattern, params,
t, rng)`), `progress/econ/passage.js` (the sea chart's lanes, pool, rules, portents, the rutter's worth), the legs' schedules and
numbers (`crossing.js`, `setpieces.js`), the fairness checker and the leg simulator (`scripts/rail.mjs`), `scripts/passage.mjs`
(calibration), the score, ledger, achievements, sweeps. The natural split if you are backlogged: I also take the shot runtime and the
pattern player (they read my library), in `world/emocean/` with your approval at the gate.

Glossary: the sea chart, the passage, a waypoint, a portent, the reading of the sea, a rutter; the Astral and Umbral forms, the surge,
a turn of the rail (named in this commit). Delete this note when done.
