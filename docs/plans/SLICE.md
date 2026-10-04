# The vertical slice: one Well, one island fight, one Emocean hop

The smallest build that proves the three layers weave (`docs/DESIGN.md`, section 11): **one Courier, one purse, one ledger, the same
seven tools in every layer**. Kept by Dovina. Phases E1 to E5 of `docs/plans/SYSTEMS.md`, cut to what the slice needs. Every number and
rule below already exists in `src/progress/econ/` and is simulated (`node scripts/economy.mjs`). What is missing is the places and the
verbs, which are Petra's to build (Calissa's to dress, Wanda's to score, Espada's to word).

**Status, 2026-10-04:**
- **The island layer is in.** It has damage types, statuses, the mental state, EmO, busking, keys that wear, curio decks, and arts
  that unlock through achievements.
- **No Well and no Emocean exist yet.** Petra's estimate (R57): 4 to 6 rounds, one gated build each: E1a (the mouth, its zone, three
  floors, the events, losing), E1b (jellies and the FOE, pay, materials, charting, the Cogitomap), E4a (the pier, the node map, the
  sloop, the rail, fuel, the hold), E4b (the stage's enemies, pass and fail, Margarite's dock). Everything is built in placeholder
  geometry first, so nothing waits on another division.
- **Dovina's data is in** (R57): the node map and the stage (`src/progress/econ/emocean.js`), the EXP sources for a floor and a
  stage (`domains.js`), and the slice's achievements (`achievements.js`, below). They read nothing yet, so they wait on the events.

## The loop the slice must play in about twenty minutes

1. On Anagami Island, a **Well mouth** opens in the Dunes (a Lachryma distortion: a spinning dark pool, a signature the Dreamvane can
   dowse).
2. **Into the Well:** three floors, a FOE on the last. Fight with any tool, chart it with the Dreamvane and the Veritome, and come out
   with cubes, materials and, if it is charted well enough, a **Cogitomap**.
3. **At the pier:** the Courier takes the ship's form (a **sloop** for the slice) and **hops** to Margarite, one rail-shooter stage of
   about two minutes, carrying crude bought on Anagami.
4. **At Margarite's dock:** sell the crude to a trader at Margarite's price. Read the bounty board (Letty), and **hop home**.
5. **The seam is the test:** the purse, the ledger, the domains' EXP and the achievements all moved in all three layers, and nothing
   anywhere had its own currency, levels or gear.

## E1, the Well (Petra's room; Dovina's numbers)

| What | How | Hook |
|---|---|---|
| The mouth | a prop in the Dunes with a signature; F to enter; a zone of its own (`render/zones.js`) | `well.enter { well, seed, by }` |
| The seed | `hash(wellId, day)`: the Well drifts daily; a Cogitomap carries its seed and day | `src/progress/econ/islands.js` (add `wellSeed` when wiring) |
| Floors | three rooms from a small kit (`level.box`), laid out from the seed; one exit down, one back up | `well.floor { floor, by }` |
| Creatures | slip jellies, as on the island (EmO, statuses: phase B); a FOE on the last floor: a jelly of a bigger class (poise and EmO rise scaled by class) | `creatures.add`, `combat/emo.js` |
| Pay | `islandRun('anagami', skill).pay` pro rata by floors reached; FOE bonus; the Well's fill falls by `drawWell` | `cubes.earn(n, 'well')`, `well.leave { floors, foes, by }` |
| Materials | each floor's clear draws a material from a deck (`deckDraw`, `makeMaterial(kind, seed, tier)`) | `item.get` |
| Charting | the share of the floors' cells charted (`cartography.js`); at 80% or more, a **Cogitomap** item carrying `{ well, seed, day, charted }` | `cogitomapWorth()` |
| Losing | shattered in a Well: back to the mouth, the run's pay lost (the purse is not touched) | `courier.shatter` |

**Measure:** `well.leave` counts by floors; the F3 econ line shows `well`; a middling run should pay about 1.0x the aim (ECONOMY.md).

## E4, the Emocean hop (Petra's; Dovina's numbers)

| What | How | Hook |
|---|---|---|
| The node map | three nodes: Anagami, Margarite, Entra Polearis (the last can be locked in the slice); opened at the pier | `emocean.open` |
| The ship | the Vessoul's ship form: a **sloop** (`ECON.ships.sloop`). The psygun is its gun, and the Solar Skiff's handling is the base of its feel (the core movement is untouched) | `ship.board { ship }` |
| A stage | a rail shooter of about two minutes: Egregores and Figments in the crude sea; a stage failed is a hit that empties the shield, and loses cargo (`ECON.emocean.lose`; crude can spill: `spillChance`) | `emocean.stage { passed, by }` |
| Fuel | paid at departure: `fuel(distance)` | `cubes.spend(n, 'fuel')` |
| Cargo | crude by grade, bought and sold at `demand(island, grade, day)`; the sloop's hold of 8 | `crude.buy`, `crude.sell` |
| Arrival | a dock zone on Margarite: a trader (crude, materials), Letty's board (`bountyPay`) | `npc` (Espada's words) |

**Measure:** a clean hop with a sloop of grief or dread should net a small profit (`crudeRun`); a failed stage should hurt. The F3 econ
line shows `fuel` as a drain.

## The node map and the stage (Dovina's, `src/progress/econ/emocean.js`; printed by `node scripts/economy.mjs`)

- **Nodes:** one an island, at its place on the Law-Chaos line (`ECON.islands[id].law`); a hop's distance is 2 a step of the line
  (Anagami to Margarite is 4, King to Queen 8). Entra Polearis is locked in the slice (`NODES.entra.locked`). `hop(from, to, ship)` gives
  `{ distance, fuel, seconds, danger }`: a sloop to Margarite burns 14 cubes and its stage runs 120 s.
- **The stage** is authored once (`STAGE.waves`, ten waves, 45 Figments) with its waves keyed to the fraction of the stage (0 .. 1), so
  Petra paces the rail to Wanda's cue, not to seconds. Its shape is Star Fox 64's: a calm opening, schools that teach the gun, darters
  that teach the dodge, a breather at 0.50 to 0.62, a mixed push, a heavy at 0.84 with an escort.
- **Roles, not creatures:** each wave is a `school`, a `darter` or a `heavy`; the route fills each with a Figment class from its danger.
  The Margarite run is Guppy schools, Barracuda darters and one Marlin; an Entra run is a class up throughout. `stagePlan(from, to, day)`
  gives every wave with its class, count, formation and lane; the day moves the lanes, never the order or the counts.
- **What it bears:** six hits (`STAGE.bears`; "shield" is the Courier's Lachryma pool, a different thing). Failing loses a quarter of the
  cargo and may spill crude. A stage pays no cubes: the travel layer is a drain and a risk, and it pays at the other end.

**A hole, said plainly:** on the slice's route the crude barely pays. A sloop of crude from Anagami to Margarite nets -10 to +1 cubes
(with the sloop's light `burn` of 0.3: at the tanker's rate it lost 25 to 35). The spread is Entra to Margarite, and Entra is locked. So
in the slice the hop must pay through **what comes up out of the Well** (the Cogitomap and the materials, sold at Margarite's dock) and
**Letty's board**, and the crude market is the lesson that points to Entra. Selling a Cogitomap at Margarite's dock is the line that
ties E1 to E4, which is the seam the slice exists to prove.

## The contract: events and ledger keys (tracking.js rules; every event carries `by`)

| Event | Payload | Ledger (counters, records) |
|---|---|---|
| `well.enter` | `{ well, seed, day, by }` | `well.enter` |
| `well.floor` | `{ well, floor, charted (0..1 of that floor), by }` | `well.floor`; record `well.depth` = floor |
| `well.foe` | `{ well, cls, by }` | `well.foe` |
| `well.leave` | `{ well, floors, foes, pay, charted (0..1 of the run), shattered, fill, by }` | `well.out` when not shattered; record `well.charted` = charted x 100; `well.dry` when `fill` reaches 0 |
| `cogitomap.get` | `{ well, seed, day, charted, by }` | `cogitomap.get` |
| `emocean.hop` | `{ from, to, ship, fuel, by }` | `emocean.hop`; `emocean.port.<to>` |
| `emocean.stage` | `{ from, to, passed, hits, bears, downed, spawned, lost, spilled, by }` | `emocean.stage.passed`; `emocean.stage.clean` when hits is 0; `crude.spill` when spilled |
| `crude.buy` | `{ island, grade, units, price, by }` | `crude.bought` (units) |
| `crude.sell` | `{ island, grade, units, price, from, profit, by }` | `crude.sold.<island>` (units); record `crude.profit`; `crude.route.<from>.<island>` |

Cubes go through `game.cubes` with the reasons `well`, `fuel`, `crude`, `bounty`, `cogitomap`. EXP: `emocean.stage` is Ouranurgy and
`well.floor` is Divination, each worth as many ordinary acts as the minutes it takes (`acts` in `domains.js`, so the pace to 99 is
unchanged), weighed by how clean it was (`stageQuality`; the floor's charted share).

**The slice's achievements** (in the game now, as placeholders at 0 until the events exist; names Espada's, LORE.md section 8):
EXPLORATION, The Wells: Downward Spiral, Rock Bottom, Face It, Mind Map, Every Nook and Cranium, Bounce Back, A Well Healed (hidden).
THE EMOCEAN, Sailing: Cast Off, Weathered It, Not a Scratch, Ports of Call; Crude: Black Gold, Gusher, Toxic Symbiosis (hidden), Slick
(hidden). The Well in the Dunes is **the Swallow**; crude is counted in **casks**; the dock trader is **the purser**.

## The seams to check before calling it done

- **One purse:** every cube in or out goes through `game.cubes` with a `why` (`well`, `crude`, `fuel`, `bounty`).
- **One ledger:** every new event carries `by` and gets a tracking rule.
- **Retroactive achievements:** the slice's achievements (first Well, first Cogitomap, first hop, first sale at Margarite) are
  predicates over the ledger.
- **The domains' EXP:** a clean Well floor is Divination EXP if it is charted, a stage passed is Ouranurgy EXP. Their quality is how
  clean it was.
- **The same seven tools in the Well and on the ship.** No new currency, level or gear anywhere.

## Order

1. E1, a Well of three floors.
2. E4, one hop to Margarite and back.
3. The Cogitomap and the bounty board.

Each step ships on its own, gated by Petra as usual.
