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

**Since (the sisters' answers, 2026-10-08):**
- **Wanda reads these fields:**
  - on each leg: `legs[k].feeling` (null is fair) and `legs[k].storm`;
  - on the stage: `stage.fuel` (0..1), `stage.adrift` and `stage.campfire { chosen }`.
  - Fill them from the trip's state:
    - `feeling` is the waypoint's `feel` and `storm` its `storm`;
    - `stage.fuel` is `state.fuel / SHIPS[ship].tank`;
    - `stage.adrift` is `state.adrift`;
    - `stage.campfire` is open at a calm until `choose` is called.
- **Espada's words** (shown to the player; the code names stay):
  - the bunker (`tank`), and bunkering when it is filled;
  - heaving to (`campfire`): "Caulk the hull." (`mend`) or "Reckon the sea." (`reckon`);
  - high water (`best`);
  - a following sea (`draughtTrump`);
  - a squall (`storm`).
- **Calissa's look:** a feeling shows as a halo around the portent's silhouette, never as a fill.

## The encounters' effects and the storm bonus (2026-10-08, your split)

**`apply(state, encounterId, choice, ctx)`** is in `progress/rail/encounters.js`. It returns `{ state, asks }`.
- Pure. `node scripts/passage.mjs` checks every choice of every encounter on 60 seas.
- **`ctx`** is `{ chart, rng, rutter, minutes, ghost, wordsLeft }`:
  - `rutter`: the carried rutter's worth today, or 0;
  - `ghost`: the day's best run of this sea chart (`voyage.bestOf(chart)`), or null;
  - `wordsLeft`: the ostraca still to find.
- Put `plan: [...the passage's ids]` on the trip state at `start`, so that "ahead" means the drafted path. Without it, `apply` takes
  every waypoint after the current one.
- **The asks, for your `offer()` to act on:**

| ask | when | what to do |
|---|---|---|
| `exact { waypoints }` | follow the convoy, the bottle | those portents shown as they are |
| `casks { n, grade }` | loot the convoy | crude into the hold, up to its limit |
| `bounty { waypoint }` | Letty's bounty | sail that waypoint as a bounty leg, its feeling kept |
| `sellRutter { cubes }` | sell to Letty | take the rutter, pay the cubes |
| `hiddenLeg { form, pays, after }` | follow the whale | a leg after this one, in that form, its score times `pays`; never asked of a ship that cannot dive |
| `crew { slots, legs }` | rescue the castaway | a mount slot more for that many legs; the measure of fuel is already off `state.fuel` |
| `counter { sell, buy }` | trade at the barge | the Purser's counter at those factors of the posted price |
| `buyRutter { route, day, cubes }` | the barge's rutter | offer today's rutter at list |
| `ghost { legs }` | race the mirror | the ghost sails beside you; at the leg's end, `raceRank(rank, beat)` |
| `ostracon {}` | the bottle | a word found |

- **Offering:** use `offered(id, ship, { rutter, fuel: state.fuel })`. It hides Letty's sale with no rutter aboard, and the castaway with
  less than a measure of fuel.
- **The Wreckers drawn by a loot:** schedule each Wreckers leg with `strength: strengthOf(state, w)`, not `w.strength`.
- **A double mend:** `trip.js arrive()` already mends an encounter (`LEG.mend`), and `offer()` adds `enc.mend` again. Keep the one in
  `arrive` (the rule's) and drop the one in `offer`. Or tell me, and I'll zero `mend` in ENCOUNTERS.

**The storm bonus:**
- At each leg's close, score the leg as `legScore(score, w)` from `trip.js` (a squall cleared pays ×1.25, `STORM.pays`). `arrive(...,
  { cleared })` already counts `state.storms`.
- At the passage's end, set `voyage.passage.storms = state.storms` before `stageResult`. The rutter's worth then counts them:
  `voyage.js` reads `P.storms`, mine, done.
