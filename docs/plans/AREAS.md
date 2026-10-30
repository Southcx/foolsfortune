# Areas: the world as rooms of a walk, loaded on entry

**The ask.** Calissa relayed it from the owner (2026-10-25): split the Dunes into chunks. The owner is "more than okay with FFXII style
zone transitions and loading screens". Open worlds feel empty and irk completionists, so spend what is saved on dense, revisitable
chunks, and stop burning real time on perf runs. The floor is an iPhone XR.

**Who does what.**
- **Calissa** proposed the unit: built on entry, disposed on exit, with a short transition. The Courier, the tools and the overlay stay
  resident. The budgets and the perf test become per area.
- **Dovina (this plan):** what the areas are, how many the Dunes become, what must stay one piece, how the clock runs while one is
  away, and where a completionist's checklist lives.
- **Petra** owns the loader.

A plan, nothing built. Every name here is a plain one until the owner calls it settled (Espada names them then).

The player's goal at each scale:
- **The next thirty seconds:** the thing in view, never more than about 40 m off, in any area.
- **The session:** an area's checklist, its counts going up.
- **The week:** the reasons to come back to each area (a weather, a game hour, the night, a game day's reset), each written in the
  area's row below.

## 1. Prior art: what is taken, from where

- **Final Fantasy XII:** the regions (Dalmasca Estersand, Westersand, the Giza Plains, the Ogir-Yensa Sandsea) are cut into areas a
  minute or two's walk across, with edges at a gap you can see and a short load. We take the unit, its size and the seen edge.
  - The Giza Plains are dry or flooded by season, and the area changes with them. We take one condition per area that changes what it
    holds (section 5).
  - Rare game appears under a condition (zone in and out, a weather, a time). We take one condition-bound find per area.
  - Monsters do not follow you across an edge. We take that as it is (section 3, A6).
- **Monster Hunter (Freedom Unite, Tri):** numbered zones on one map, each with its gathering points and its own monster routes. We
  take the numbered map and the dense small zone.
- **Spyro the Dragon and Banjo-Kazooie:** each level shows its gems or notes as N of M, the total always shown. We take the totals on
  the checklist. Completionists want to know when they are done.
- **Xenoblade's Collectopedia and Ys VIII's map completion:** a region's list of slots, blank until found, and a reward for charting a
  region whole. We take the blank slot ("???") and an achievement for a region done. No cubes: the economy is not paid for walking.
- **Animal Crossing and Stardew Valley:** the clock runs while you are away, and the place is caught up when you return. We take the
  catch-up, so an unloaded area costs nothing and still grows.
- **What to avoid: the open world's map of icons** (the Ubisoft tower). A checklist gives counts, never positions. The Sight
  calibrates only to what you already know.

## 2. The unit: an area

An **area** is what is built on entry and disposed on exit. A **layer** (the Dunes) holds areas. A **room** (the map's named place,
said in the log as you near it) sits inside an area. The ledger's existing `time.area.<layer>` keys keep their meaning: time on a
layer. New per-area counts use `area.<id>.*` (section 6).

## 3. The rules

- **A1. Only drawing and physics are disposed.** An area holds meshes, colliders, creatures' bodies and lamps. Every state that must
  last belongs to its system (the save's sections, as today): a chest opened, a crystal's regrowth, a blot's size, a creation, the
  island's matter. Disposing an area loses nothing. This is the rule that keeps "dispose on exit" from turning into "forget on exit".
- **A2. Size:** a run across takes 60 to 120 real seconds (FFXII's). Nowhere in an area is more than about 40 m from a thing worth
  stopping for: a find, a creature, a station, a view (FIRST-HOUR.md's "always in view"). A script can measure this per area from the
  data (`scripts/areas.mjs`, Dovina's, once the areas exist).
- **A3. An edge is seen, and it carries your speed.** Every edge is a thing in the world: a crest, an arch, the barrier's gap, a
  sandfall, never an invisible wall. It works both ways. You arrive at the matching edge with the same heading and speed: running,
  sliding, on the skiff or in the glide. The transition covers the load (Calissa's look over `game.seam`). A carried pot comes with you.
- **A4. The clock never stops, and nothing ticks while away.** An area left behind is caught up on entry from the game clock: one
  catch-up call a system, given the real seconds and game hours away (table below).
- **A5. Some things stay one piece** (section 7). A run that must not be cut lives inside one area.
- **A6. Creatures do not follow across an edge** (FFXII's rule). A hunter waits where it was. Zoning out of a fight is allowed and
  counts for nothing. A puzzle duel's pocket already holds you in place.
- **A7. Fast travel lands at a door.** A Shrine, the Index and a start place (`?at=`) each set you down at an area's entry with its
  load.
- **A8. Budgets and the perf test are per area** (Petra's). `npm run perf` measures the area it is given, with the iPhone XR as the
  floor. Nothing in one area is paid for by another.

**The catch-up (A4)**, by system. Each is owned by the system's owner; the call is the same shape for all.

| system | while away | on entry |
| --- | --- | --- |
| crystals (`world/dunes/crystals.js`) | regrowth on its real-time timer | `regrowT` less the real seconds away |
| blots (`world/ground/stains.js`) | grow; a full-grown one gives up a blotling | grown by the time away; at most one blotling waiting per area |
| slicks, paint (`vfx/slicks.js`, the paint map) | oxidise and fade | faded by the time away (the paint map's cells keep their own clock) |
| a creation, the island's matter (`godhand/`) | crumbles over a game day; the mending | crumbled and mended by the game hours away |
| the weather, the herds, the Great Dunemaw's floors | island-wide or a game day's, already | nothing new |
| creatures | none: each is placed fresh by its spawner | placed by the game hour (the night's at night) |

Events: `area.enter { area, from, away, by }` and `area.leave { area, to, by }` (`area`, as `area.rare` and `area.done` carry it). `away` is real seconds since that area was last left, and
`by` is `courier`, or `environment` for a fall or a current. The log says the area once a visit ("You reach the ruins.") and the
room lines stay as they are. A rule in `feedback/tracking/place.js`.

## 4. The map as a graph

Most of the game is already split this way, and only the Dunes are one big ground. Today the Raceway park, the open sea, the Spirit
Garden and a Great Dunemaw floor are built on first entry. A floor and the park's ground are disposed on leaving (the inventory,
2026-10-25).

| layer | its areas | edges | built today |
| --- | --- | --- | --- |
| the workshop | the workshop (ground and upper floors, the Throwing Room) | the hole to the hub; the door to the Dunes, through the Index | at boot |
| the basement | the hub (the Index, the course, the lab, the lap circuits); the siege | the hole up; the Index to every room | at boot |
| the Dunes | five: section 5 | between neighbours; the Weir to all four | at boot, one ground of 1,040 m |
| the Great Dunemaw | the mouth (in the Gnomon flats); floors 1 to 3; the FOE's bowl | each floor's sandfall down; the way up | a floor at a time (built, disposed) |
| the Raceway | the park (one area: section 7) | the Index; the hub's race board | on entry, torn down after (stage 2, 2026-10-25: `raceway.teardown`); the ground is dropped after 10 s away |
| Raku's Bazaar | the bazaar | its gate on the Weir's north beach | on entry, torn down after (stage 2, 2026-10-25); the gate at boot with the Dunes |
| the Emocean | a crossing (one area); Margarite's dock; the open sea (one area) | the jetty's pier; the docks | the crossing at boot, hidden; the open sea on entry, torn down after (stage 2, 2026-10-25: the ship, the herds, the puzzles; the islets once their dressing can go too) |
| the Spirit Garden | the garden (one area) | a Shrine | on first entry |

**How a room tears down** (`world/areaown.js`): the world marked before its build; what is new after it is the build's own, and the
teardown takes exactly that away. A look laid over the room after its build comes and goes by its own build and teardown.

**To change:** the Dunes become five areas. Margarite and the parked crossing become built on entry and disposed on exit
like the rest. That is Petra's call, measured.

## 5. The Dunes as five areas

The cut goes by bearing round the oasis, in the Dunes' own frame (x east, the shore at bearing 0). The Weir is the hub, out to r 120.
Four field areas run from r 120 to the barrier (r 480), each a sector. Every field area meets the Weir and its two neighbours, so you
can go round. The sizes are 50 to 145 degrees of a ring 360 m deep: 200 to 550 m along the barrier, a minute or two on foot.

| area (plain name) | bearing | what is in it today | its edges | its reason to come back |
| --- | --- | --- | --- | --- |
| **the Weir** (the hub) | all, r < 120 | the oasis and pond, the Weir's pools and pier, the Weir's Well, the Float Shrine, the busker's mat, the bazaar's gate, the chest `dunes.1` (r 92), the test duel's Wisp, the Weir pier's vantage point | to each field area at its sector's mouth: a gap in the dunes ringing the oasis | the fish by weather and game hour; busking; the Shrine; Raku's gate |
| **the shore** | -25 to +25 | the beach and waterline, the jetty, the shore's vantage point, the pier to the crossing | the Weir; the crystal ridges and the ruins along the crests; the jetty's pier to the Emocean | the crossing begins here; the plume's weather comes in first from the sea |
| **the crystal ridges** | -25 to -125 | the crystals and slip geysers on this side (re-laid to fill it: A2) | the Weir, the shore, the Gnomon flats | crystals regrow; geyser chains; Fury's lightning leaves fulgurites; the geodes glow at night in the feeling in the air |
| **the Gnomon flats** | -125 to -215 | the Gnomon and its vantage point, the Solar Skiffing trial's rings, the Great Dunemaw's mouth and the Lamp Shrine, the open sand for the skiff | the Weir, the crystal ridges, the ruins; the mouth down | the trial's medals; a new Great Dunemaw each game day; the Gnomon's shadow keeps the game hours; Roll's 20 m drop off the Gnomon |
| **the ruins** | +145 to +25 (through 90) | the arches, obelisks and columns, the sealed room and its stele (bearing 129), ostraca; the Lantern Wisps at night | the Weir, the shore, the Gnomon flats | the night: the Wisps, and an aberrant one that drinks a blot; ostraca to gloss; the sealed room |

- **The contents follow the cut.** The ruins, crystals, geysers and ostraca are scattered by seed round the whole ring today. Each kind is
  re-laid inside the areas given above, at A2's density. The crystals, geysers and ostraca keep their counts (18, 10, 6). The
  ruins' 91 pieces gather in the ruins, with a few left as landmarks elsewhere.
- **Measured (`scripts/areas.mjs`, 2026-10-25, the game read headless; the areas as data in `src/progress/areas.js`):**

  | area | things today | ground over 40 m from any thing |
  | --- | --- | --- |
  | the Weir | 1 crystal, 2 columns, 5 places, 1 vantage, the Float Shrine | 50% |
  | the shore | 3 crystals, 1 geyser, 3 columns, 2 places | 74% |
  | the crystal ridges | 1 crystal, 3 geysers, 12 columns | 67% |
  | the Gnomon flats | 3 crystals, 4 geysers, 1 ostracon, 13 columns, the Gnomon, the mouth, the Lamp Shrine, 1 vantage | 49% |
  | the ruins | 10 crystals, 2 geysers, 2 ostraca, 18 columns | 54% |

  - **Half to three quarters of every area is empty ground** by A2's measure: the owner's "open worlds feel empty", in numbers.
  - **A2's target:** under 10% of each area's ground over 40 m from a thing.
  - **The seed's scatter disagrees with the cut.** The crystal ridges hold one crystal, and the ruins hold ten.
  - **The script undercounts the ruins.** It counts their 48 columns but not their obelisks and arches, whose positions are not kept, so
    the ruins' empty share reads high.
- **The Solar Skiffing trial's loop, moved (2026-10-30).** Its centre stood 200 m from the Gnomon toward the oasis, its 24 rings 12 in
  the Gnomon flats, 8 in the crystal ridges and 4 in the Weir. Now (`world/dunes/solar.js` LOOP):
  - its centre is r 300 at bearing -160 from the oasis, about 170 m from the Gnomon's foot;
  - its radius 130, with a wobble of 20.
  - Measured (`scripts/areas.mjs`): all 24 rings in the Gnomon flats. The lap is shorter by about a quarter, so the medals are x0.77
    (`SOLAR.medals` 46 / 55 / 65 real s, were 60 / 72 / 85), to be confirmed by a ridden lap.
- **Bigger later:** more Dunes are more areas past the barrier, never a bigger ground. The proposal in DUNES.md to make the one ground
  1,600 m across is withdrawn.
- **The condition-bound find (FFXII's rare game), one an area:** a creature or a thing met only under its condition, counted on the
  checklist, and once seen a bounty Letty Marque can post. The ruins' aberrant Wisp at night is the first, and it exists. The other
  four are for the owner's yes: Grief's rain filling a basin in the Gnomon flats, the shore at low light, the ridges in Fury's
  lightning, the Weir at dawn.

## 6. The completionist's checklist

Each area has a page in the map (M): its checklist.
- **One row a kind:** chests, vantage points, ostraca and steles, crystals sung at their sweet spot once, geyser chains, the
  condition-bound find, and the area's ground charted. Each row shows N of M, the total always shown (Spyro's).
- **Before you enter, the page is a title and "???".** After you enter, every kind's row is shown, the unfound as blanks
  (Xenoblade's).
- **Never a position.** The checklist counts; the Sight still points only at what you know.
- **The ledger:** `area.<id>.<kind>` counters, written by the same events that already count each thing (a chest's `chest.open` with its
  area added by the tracking rule). The totals are data: each area's list, written next to its contents.
- **Built (2026-10-29):** `progress/areachecklist.js` measures each area's checklist (the map's `rowsOf`) into the record `area.<id>.share` at the moments it can change; `progress/areaachievements.js` (da1 .. da10, da99) reads it.
- **The achievements are predicates over those counters.** For each area: half its checklist (Easy) and all of it (Hard). For each
  layer: every area whole (Elite), which gives a title (the one toast). They pay no cubes; walking is not a faucet.

## 7. What stays one piece

- **A race and the Raceway park:** one area, 2.64 km across. A lap never crosses an edge. The park stays sparse by nature: dressing
  only near the lines, which `vfx/raceway/` already builds on first need. A made track is laid on the build lot inside it.
- **The Solar Skiffing trial:** inside the Gnomon flats.
- **A Great Dunemaw run:** a floor is an area, and a sandfall is its edge. The haul still comes home only up the way up.
- **A crossing:** one area, from cast-off to the far dock.
- **The open sea:** one area. Sailing has no edge (Wind Waker's sea, not FFXII's), and islets are built near the helm.
- **A puzzle duel:** in the area where its aberrant was met. The pocket holds you there.
- **The Spirit Garden, the siege, Raku's tables:** one area each.
- **The god hand:** a power's reach is clipped at the area's edge, and the island's matter is kept per area by A1.
- **The story:** no story track is written yet. A story beat lives in one area, or across an edge as two beats. Anything later that
  must run unbroken across ground is added to this list first.

## 8. Asks

| who | ask | Dovina's pick |
| --- | --- | --- |
| the owner | the Dunes as five areas: the Weir as the hub, the shore, the crystal ridges, the Gnomon flats, the ruins | **ruled yes** (the owner, 2026-10-25, relayed by Calissa; the round is the map overhaul: `docs/plans/MAP.md`) |
| the owner | creatures do not follow across an edge (FFXII's) | yes |
| the owner | the checklist shows totals (N of M), never positions | yes |
| the owner | the open sea and the Raceway park stay one area each | yes |
| the owner | the four condition-bound finds still to make (section 5) | yes, one a round |
| Petra | the loader's unit as A1 (drawing and physics only), the edges as A3, the catch-up hook (A4), `area.enter` and `area.leave`, perf per area (A8) | |
| Calissa | the transition's look; each edge as a thing in the world; each area's dressing loaded and left with it | |
| Espada | the areas' names when the owner calls them settled; the log's line on reaching one | |
| Wanda | the ambience and the cue handed over at an edge, as the music clock allows | |
| Dovina | done: the per-area contents and checklist totals (`src/progress/areas.js`; `scripts/areas.mjs` measures it), the achievements, the trial's loop moved (2026-10-30). Waiting on stage 2: the catch-up for blots and crystals (stage 1 only evicts the GPU's copies, so everything still ticks; the table above is the call's spec) | |
