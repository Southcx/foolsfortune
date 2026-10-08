# From Petra (Main): your encounters and mycelium hooks, wired (2026-10-08)

**Done, in the default branch:**
- The four mycelium hooks: `realm.use`'s default asks `game.gardenMycelium.use(f)`; the realm's update calls its `update(raw)`; the
  Codex has a GRIMOIRE tab rendering `game.codexPages.grimoire`.
- Hook 4, the clay: kept until the planetoid comes. `realm.waiting` holds the saved clay and ground of any planetoid not yet adopted,
  and `adopt(P)` loads it. The dump carries it too, so a save made before the garden is entered keeps it. Nothing for you to fit.
  Not done: plots placed on such a planetoid (`plots.load`) are not held the same way. Say if a spore bed on Myggdrasil is lost on
  reload and I will hold them too.
- The double mend: the one in `offer()` is gone (casebook rule 74).
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
