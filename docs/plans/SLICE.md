# The vertical slice: one Well, one island fight, one Emocean hop

Kept by Dovina. **Built.** The smallest build that proves the three layers weave (`docs/DESIGN.md`, section 11): **one Courier, one
purse, one ledger, the same seven tools in every layer**. Phases E1 and E4 of `docs/plans/SYSTEMS.md`; the numbers are in
`src/progress/econ/` and simulated by `node scripts/economy.mjs`.

**The loop (about twenty minutes of play):** a Well mouth in the Dunes (the Great Dunemaw) → three floors and the FOE, charted with the
Dreamvane and the Veritome, out with cubes, materials and perhaps a Cogitomap → at the pier, the sloop hops to Margarite (one rail
stage: `RAIL.md`) carrying casks of crude bought on Anagami → at Margarite's dock, sell to the Purser, read Letty's bounty board, hop
home. The seam is the test: purse, ledger, domains' EXP and achievements all moved in all three layers, and nothing had its own
currency, levels or gear.

**Where the code is:** the Well `src/world/well/` (`dunemaw.js` carries its events and loop in its header); the voyage
`src/progress/voyage.js` (`game.voyage`); the node map and the stage data `src/progress/econ/emocean.js`; Well pay, Cogitomap worth,
demand, fuel `src/progress/econ/islands.js`; the pier and Margarite's dock `src/world/emocean/pier.js`, `margarite.js`; the traders
`src/progress/shop/catalogue.js`; the log's rules `src/feedback/tracking/wells.js`, `voyage.js`.

## The owner's rulings

- **Jellies for now** (R57): slip jellies stand in for the Egregores in the Well; the Egregore's own body and mind come after the slice.
- **The Purser buys Cogitomaps** (R57; `purserPrice`, `ECON.islands[id].maps`): Law wants its minds charted, so Margarite pays dear; a
  map of Anagami's Well is worth little on Anagami. A good, fresh map nets about 20 cubes more at Margarite than at home after the
  sloop's fuel; a middling one is better sold at home. Skill decides whether the Well feeds the boat.
- **Divination charts the course** between the islands (R57): the reckoning, below.
- **Get it all working first** (R57): the Wells and the Emocean each get a deep dive with the owner after the slice. Parked for it:
  the FOE as Etrian Odyssey's (a visible threat that patrols and can be routed round, its route shown by Divination); and (2026-10-05)
  **Wells of radically different types**: action combat (the Dunemaw) beside, say, a JRPG board game.
- **Raku buys anything** (R58) at half its worth, so a Cogitomap has a lowball price at home and a dear one at Margarite's dock.
- **A Cogitomap is worth what its Well still holds** (R58: no decay by the clock): its worth times the Well's yield at the fill it has
  now. Farming a Well cheapens its maps; letting it fill restores them.

## The numbers, with their reasons

- **Well pay is `wellPay(deepest, foes) x wellYield(fill)`**: three floors and the FOE at full fill pay 139 cubes, the aim (1.0x) for a
  run of about 17 minutes of play. If timed runs come in much faster, the cut is `ECON.well.perFloor`, nowhere else.
- **Material tier = floor - 1, +1 on a hit of the deck `well.rare` (1 in 4), +1 if the FOE fell to the Courier, capped at 4**: depth
  and the FOE are skill, the deck keeps the luck honest.
- **Divination EXP on `well.charted`**: standing about charts 0.27 of a floor (rote, 0.4x), a survey pulse a room 0.91 (about 4x).
- **Nodes** sit on the Law-Chaos line (`ECON.islands[id].law`); a hop's distance is 2 a step (Anagami to Margarite 4, King to Queen 8).
  `hop(from, to, ship)` gives `{ distance, fuel, seconds, danger }`: a sloop to Margarite burns 14 cubes; the stage runs 150 real seconds,
  the length of Wanda's cue. The sloop's hold is 8 casks (a hold is how many may cross, never a second inventory).
- **The stage bears six hits** (`STAGE.bears`; not "shield", which is the Courier's Lachryma pool). Failing loses a quarter of the cargo
  and may spill crude (`ECON.emocean.lose`, `spillChance`). A stage pays no cubes: the travel layer is a drain and a risk. Waves are
  roles (`school`, `darter`, `heavy`); the route's danger picks the Figment class; the day moves the lanes, never the order or counts.

**A hole, said plainly:** a sloop of crude from Anagami to Margarite nets -10 to +1 cubes (the sloop's `burn` 0.3; at the tanker's it
lost 25 to 35); the spread is Entropolis to Margarite. So the hop pays through the Well's haul (Cogitomaps, materials) and Letty's
board, and the crude market is the lesson that points to Entropolis.

## Not yet built

- **The reckoning (Divination):** how much of a crossing the Courier has divined, 0 to 1, for that game day (the lanes drift daily). It
  grows by a Dreamvane survey of the sea from the pier (Petra's verb; its quality `q` is how well it was dowsed) and by reading the
  waves under way. It buys knowledge, never numbers: each wave's lane is marked ahead by a glyph pop on the rail, `reckonLead(r)` real
  seconds early (up to 3, two bars, at full reckoning). A locked node opens for good once a route to it is reckoned to 0.6 from the
  pier (`opensNode`): Entropolis is found by divining the way there. The data is in (`RECKON`, `reckonLead`, `opensNode` in
  `econ/emocean.js`; `game.voyage.reckon(from, to, share, q)`, `game.voyage.reckoning(from, to)`, widened by
  `game.psyche.widen('divination.reckon')`); the survey verb and the lane marks are not wired.
- **A ship's tempo as its feel** (Wanda, `stageCue(seconds)`), once there is a second ship: a sloop at 1.25x hardcore-fast, a galleon at 0.8x stately.

## The contract: events and ledger keys (every event carries `by`)

| Event | Payload | Ledger (counters, records) |
|---|---|---|
| `well.enter` | `{ well, seed, day }` | `well.enter` |
| `well.floor` | `{ well, floor, charted }` | `well.floor`; record `well.depth` = floor |
| `well.charted` | `{ well, floor, charted }` (on leaving a floor) | Divination EXP |
| `well.foe` | `{ well, floor, cls }` | `well.foe` |
| `well.leave` | `{ well, floors, foes, pay, charted (0..1 of the run), shattered, fill }` | `well.out` when not shattered; record `well.charted` = charted x 100; `well.dry` when `fill` reaches 0 |
| `cogitomap.get` | `{ well, charted, worth }` | `cogitomap.get` |
| `cogitomap.sell` | `{ island, well, worth, price }` | `cogitomap.sold`; `cogitomap.sold.<island>` |
| `emocean.hop` | `{ from, to, ship, fuel }` | `emocean.hop`; `emocean.port.<to>` |
| `emocean.stage` | `{ from, to, passed, hits, bears, downed, spawned, lost, spilled }` (and `RAIL.md`'s additions) | `emocean.stage.passed`; `emocean.stage.clean` when hits is 0; `crude.spill` when spilled |
| `emocean.reckon` | `{ from, to, day, reckoning (0..1 after it), q }` | record `emocean.reckon.<route>` and `emocean.reckon.best` = reckoning x 100 |
| `emocean.found` | `{ node, from }` | `emocean.found.<node>` |
| `crude.buy` | `{ island, grade, units, price }` | `crude.bought` (units) |
| `crude.sell` | `{ island, grade, units, price, from, profit }` | `crude.sold.<island>` (units); record `crude.profit`; `crude.route.<from>.<island>` |

Cubes go through `game.cubes` with the reasons `well`, `fuel`, `crude`, `bounty`, `cogitomap`. EXP: `emocean.stage` is Ouranurgy;
`well.charted` and `emocean.reckon` are Divination, each worth as many ordinary acts as the minutes of play it takes (`acts` in
`domains.js`, so the pace to 99 is unchanged), weighed by how clean it was (`stageQuality`; the floor's charted share).

**The slice's achievements** (names Espada's, LORE.md section 8): EXPLORATION, The Wells: Downward Spiral, Rock Bottom, Face It, Mind
Map, Every Nook and Cranium, Bounce Back, A Well Healed (hidden), Cartographer's Cut (a placeholder name, R57). THE EMOCEAN, Sailing:
Cast Off, Weathered It, Not a Scratch, Ports of Call, Dead Reckoning (a placeholder name, R57); Crude: Black Gold, Gusher, Toxic
Symbiosis (hidden), Slick (hidden).
