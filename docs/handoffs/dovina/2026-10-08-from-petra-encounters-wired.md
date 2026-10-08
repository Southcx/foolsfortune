# From Petra (Main): your encounters and mycelium hooks, wired (2026-10-08)

**Done, in the default branch:**
- The four mycelium hooks: `realm.use`'s default asks `game.gardenMycelium.use(f)`; the realm's update calls its `update(raw)`; the
  Codex has a GRIMOIRE tab rendering `game.codexPages.grimoire`.
- Hook 4, the clay: kept until the planetoid comes. `realm.waiting` holds the saved clay and ground of any planetoid not yet adopted,
  and `adopt(P)` loads it. The dump carries it too, so a save made before the garden is entered keeps it. Nothing for you to fit.
  Not done: plots placed on such a planetoid (`plots.load`) are not held the same way. Say if a spore bed on Myggdrasil is lost on
  reload and I will hold them too.
- The double mend: the one in `offer()` is gone (casebook rule 97).
- `apply` is called from `offer()`, with `plan` on the trip state and `at` set to the encounter's waypoint. `offered(id, ship,
  { rutter, fuel })` picks the choices. Each Wreckers leg is begun with `strengthOf(state, w)`. The storm bonus: each leg's score at
  `legScore`, and `voyage.passage.storms = state.storms` before `stageResult`.

**The asks, as acted (triprun.js `act`):**

| ask | done |
|---|---|
| exact | said in the log (`passage.exact`: "Ahead lies ..."); the sea chart is not drawn at sea |
| casks | into the hold up to `ECON.ships[ship].hold`, manifest `{ from: 'convoy', paid: 0 }` |
| bounty | that waypoint marked; cleared, it pays `bountyPay(1)` (128 cubes). **Your number**: `bountyPay(3)` was 960 for one leg, two hours' aim |
| sellRutter | the rutter taken, the cubes earned |
| hiddenLeg | approximated: the **next fight leg** is sailed in the ask's form, its score times `pays`. A leg of its own needs the cue relaid mid-trip (with adrift: my next job) |
| crew | said and counted only. The extra mount needs a spare in the pier's loadout: next round |
| counter | `shops.open('purser', { factor: { sell, buy } })`, the cue held until `shop.close`. **Yours:** `open` ignores the second argument today |
| buyRutter | the cubes spent, a rutter of this passage (rank B, read 1, 5 real minutes) into the Pneuka Box |
| ghost | the leg's par is the day's best divided by the waypoints; `voyage.passage.race = { beat }` at the leg's end. **Yours:** `stageResult` does not read it yet: `raceRank` there |
| ostracon | `game.ostraca.fromSea('bottle')`: a word not yet found, drawn; `game.ostraca.left()` is your `wordsLeft` |

The log lines are mine, placeholders for Espada's (`feedback/tracking/passage.js`). Counted there: `passage.casks` (n),
`passage.bounty`, `rutter.sell`, `rutter.buy`, `passage.crew`, `passage.race.beat`. Move or rename them as the ledger wants.

**The pier:** the direct row is retired. Each open island is one row, "THE SEA CHART: <island>", which opens the chart.
`pier.sail(from, to)` stays as the handle for scripted crossings. Your emocean sweep's click still matches it.

**Checked:** `scripts/triptest.mjs`. A drafted calm, encounter and shoal are sailed. Each ask is done once: 2 casks aboard, a rutter
bought for 50 and sold for 77, a word found, a bounty posted, the portents said. 13 of 13 pass.

**Since (same day):**
- **The rail is a spline.** `world/emocean/railpath.js`. Each turn of the rail flies a figure: weave, crest, corkscrew or
  `verticalLoop` (glossary: "a figure"). The legs stay straight and level, so your schedules and patterns are unchanged.
- **Your sweeps:**
  - `game.emocean.figures` lists the figures of the crossing.
  - `/figure <id>` forces one figure for the next crossing.
  - `scripts/railpathtest.mjs` checks each figure. On every turn it checks the frame's shape, the camera's up, the ship above the sea,
    and the zone.
- **A row in your kit table:** `jetty` (by petra; tests T172 to T174), for the sea's QAIS tests. It holds 4 casks of mirth, one rutter
  and 3000 cubes. Its chest stands on the sand by the jetty's foot. The place is `debug.jetty`, the Index's DEBUG row 8.
- **Adrift is sailed** (`triprun.js driftOn`). When a leg closes, if `adrift(state, chart, id)` holds, the rest of the route is
  `drift`ed from there. If it differs from the drafted route, the legs ahead are relaid: the cue swaps in place (Wanda's
  `Arranger.follow`) and the rail is relaid with the turns already flown kept (`stage.relay`). The event is `passage.adrift`
  `{ at, types, relaid }`, counted as `passage.adrift`.
  - **Yours:** `voyage.sailing.passage.adrift` is true from then on. The rank cap at a C is `stageResult`'s to apply.
  - Bunkering at a calm clears `state.adrift`, but the route the current took stands.
  - Checked by `scripts/adrifttest.mjs` (seed 13: relaid; no jump of the rail point; the clock goes on; port made).
