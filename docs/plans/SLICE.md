# The vertical slice: one Well, one island fight, one Emocean hop

The smallest build that proves the three layers weave (`docs/DESIGN.md`, section 11): **one Courier, one purse, one ledger, the same
seven tools in every layer**. Kept by Dovina. Phases E1 to E5 of `docs/plans/SYSTEMS.md`, cut to what the slice needs. Every number and
rule below already exists in `src/progress/econ/` and is simulated (`node scripts/economy.mjs`). What is missing is the places and the
verbs, which are Petra's to build (Calissa's to dress, Wanda's to score, Espada's to word).

**Status, 2026-10-04:**
- **The island layer is in.** It has damage types, statuses, the mental state, EmO, busking, keys that wear, curio decks, and arts
  that unlock through achievements.
- **No Well and no Emocean exist yet.**

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
