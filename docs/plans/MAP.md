# The map, overhauled

**The ask.** The owner's "map overhaul" round (2026-10-25, relayed by Calissa): revamp the map with Dovina and Petra. Better visuals,
less needless menu information, in line with the recent UI work.

**Who does what.**
- **Dovina (this plan):** what the map must say and what goes, the levels it has, and what is counted per area. Built on
  `docs/plans/AREAS.md`; the five Dunes areas are ruled yes.
- **Calissa:** the board for the look, before anything is built.
- **Petra:** the map's engine.

A plan, nothing built. Plain names throughout.

The player's goal at each scale:
- **The next thirty seconds:** where you are and which way to go.
- **The session:** what is left in this area (its checklist).
- **The week:** which areas are done and which are not (the island's level).

## 1. Prior art: what is taken, from where

- **Final Fantasy XII:** a region map of named areas, each opening on its own area map, the unvisited ones blank. We take the two
  levels and the blanks.
- **Metroid Prime:** areas with their completion. Each area's doors are drawn, and floors stack inside a building. We take the floor
  stack and one number per area at the top level.
- **Hollow Knight:** the map is drawn as you walk, and a place has no name until you have been there. We take names only once
  charted; the charting by walking and surveying is already ours (`feedback/cartography.js`).
- **Breath of the Wild:** one pin that drives the compass. We take one waypoint, the Sight's, never two.
- **Okami:** the map in the house's own hand, never a stock panel (CLAUDE.md: "the UI is never stock"). The look is Calissa's.
- **What to avoid:** the icon-strewn open-world map. Counts, never positions (AREAS.md 6).

## 2. The levels

- **The island (the top level).** Anagami's places as a graph:
  - the nodes: the workshop, the basement, the Dunes (its five areas as one cluster round the Weir), the Great Dunemaw, the Raceway
    park, Raku's Bazaar;
  - the sea to the east, with Margarite's dock and the open sea;
  - the edges are the ways between: the hole, the jetty, the Great Dunemaw's mouth, the bazaar's gate, and the Index as a dotted spoke
    from the hub.
  - **Drawing:** a visited node is its ground's silhouette and one number, its checklist's N of M summed. An unvisited node next to a
    visited one is "???". Anything further off is not drawn.
  - **Answers** "what is left, and where" at a glance.
- **An area (the page the map opens on).**
  - Its ground as charted, you, your thread, its places, your plates, the Sight's waypoint.
  - Its checklist beside the ground (section 4).
  - Zooming out past the area's edge goes up to the island. Tapping a node on the island goes into it.
- **Floors.** Only inside a building (the workshop's ground and upper floors, the basement below) does a small stack of floors stand at
  the page's side (F2, F1, B1), the floor you are on lit. It is the one switch the old row of layer buttons was good for.

## 3. Everything on the map now, kept or cut

(`feedback/cartography.js`, `drawMap` and `buildMap`, as of 2026-10-25.)

| on screen now | verdict | why |
| --- | --- | --- |
| the title "MAP" | cut | the window shows what it is; the area's name is the title |
| nine layer buttons (the Great Dunemaw, the Dunes, the basement, the two floors, the Raceway, the open sea, Margarite's dock, the bazaar) | cut | nine words before any map, and they name places not yet found (a spoiler). The island's level and the floor stack replace them |
| CLOSE (M) | kept, as the house's close mark | one way out, said in the device's words (M, or the mark on touch) |
| the cells by tier (sensed, charted, understood) | kept, drawn in the house's look | the god hand's law: an art needs a tier of ground (`godhand/arts.js`). Without the tiers, the hand's refusals have no second avenue (the veil on the ground is the first) |
| walls, dark with a lit edge | kept | the ground's shape |
| a named place's dot and name | kept, the name only once its room is charted; before that, the dot alone | a name before you have charted it is the map telling you, not you charting it (Hollow Knight) |
| the Raceway's tracks and their names | kept | a course map |
| the plates' brass frames | kept, smaller, on the area's page only | your own record (the Veritome's) |
| the map's own waypoint (a click sets a diamond, a right click clears it; it drives the wire compass) | cut as a second waypoint. A click or long press on charted ground calibrates the Sight to that point instead | two waypoints with two needles is one too many. The Sight takes a point (`progress/sight.js`, Dovina's: `calibrate({ point })`), and the wire compass reads the Sight |
| Ariadne's Thread | kept | a knack you chose |
| you (the arrow) | kept | |
| the Pneuka Jar's tether ring | kept, in the god hand only (as now) | |
| the side panel's layer name and "you are here" | the area's name stays; "you are here" is cut | the arrow says it |
| up to nine rooms with their % bars | cut, and folded into the checklist's charted row (rooms charted, N of M). The room list opens on tapping that row | a percentage per room is noise; one count per area answers it |
| TRACK beside a charted room | kept (the Sight's calibrate button) | the one way a found room becomes where you are going |
| "N cells charted, M understood" | cut | a cell is the code's unit, not the player's |
| "nothing charted here yet" | cut | the blank slots say it |
| the legend (the three tiers, the waypoint) | the three tiers kept, shown while the god hand is on and on the map's first opening; the waypoint key cut | the tiers matter to the hand; one waypoint needs no key |
| the controls line (drag, wheel, click, the Dreamvane's survey, the touch gestures) | cut from the page | to the pause menu's help, with the device's words shown once on the first opening |

## 4. The checklist, per area

The checklist is AREAS.md 6, drawn on the area's page.
- **Its rows:** one a kind the area holds, N of M with the total shown. "???" before you have entered the area.
- **The kinds:**
  - chests;
  - vantage points;
  - ostraca and steles;
  - crystals sung at their sweet spot once;
  - geyser chains;
  - the condition-bound find;
  - rooms charted: the old room list and its % bars, as one count.
  - A kind the area holds none of is left off its page.
- **The Raceway park:** its own rows, its tracks' gold medals, N of M.
- **A Great Dunemaw floor has no checklist.** It is laid fresh each game day, and its charting is cleared on every run (`clear('well')`).
  Its page shows the run's floors only.
- **Each Dunes area's page** (`AREA_PAGE` and `CHECKLIST_ROWS`, `src/progress/areas.js`): its rows in order, its totals as the ground
  holds them today (`scripts/areas.mjs`, 2026-10-25, before the re-lay; "live" means counted from the world when the page opens), and
  its line to come back for (placeholder words, Espada's to rule).

  | area | rows, in order (total today) | its line to come back for |
  | --- | --- | --- |
  | the Weir | rooms charted (live), fish caught (23), vantage points (1), chests (1), Shrines (1), crystals sung (1) | Different fish rise in different weather and at different hours. |
  | the shore | rooms charted, vantage points (1), crystals sung (3), geysers ridden (1) | The sea's weather reaches the shore first, and the crossings leave from its jetty. |
  | the crystal ridges | rooms charted, crystals sung (1), geysers ridden (3) | Struck crystals grow back, and Fury's lightning leaves glass in the sand. |
  | the Gnomon flats | rooms charted, trial medals (3), vantage points (1), Shrines (1), crystals sung (3), geysers ridden (4), ostraca (1) | The Great Dunemaw lays out new floors every game day. |
  | the ruins | rooms charted, ostraca (2), crystals sung (10), geysers ridden (2), night find (1) | Wisps drift through the ruins at night, and one of them may go wrong. |

- **The ledger:** each row reads one key per thing, set once that thing is done (`room.<id>`, `vantage.<id>`, `chest.<id>`,
  `shrine.found.<id>`, `ostracon.<word>`, `fish.kg.<species>`, `trial.medal.<medal>`). Three keys are not written yet:
  - crystals sung: `crystal.sweet.at.<id>`, which needs an id on `crystal.harvest`;
  - geysers ridden: `geyser.ride.<id>`, which needs the geyser's id and the rider on `geyser.launch`;
  - the night find: its event.
- **The totals will move** when the Dunes' things are re-laid to the cut (AREAS.md 5): ten crystals in the ruins and one in the ridges
  is the seed's accident, not the design.
- **The achievements:** half of an area and all of it; for a layer, every area whole (AREAS.md 6).

## 5. Per layer or per area

- **Stored per layer, as now.** One grid of cells a layer. The god hand reads it, and its save key is kept, so nothing charted is lost
  in the change.
- **Read per area.** Everything the player is shown is counted per area: the checklist, the rooms charted, the finds. Each is counted
  from the layer's cells and the area's bounds (`areaAt`, `progress/areas.js`).
- **Floors are areas.** A building's floors are each an area (Petra's order puts the workshop's rooms last).

## 6. Asks

| who | ask |
| --- | --- |
| Calissa | the board: the island's level, an area's page, the floor stack, the checklist's rows, the tiers' look, the Sight's waypoint on the map |
| Petra | the map's engine: the page by area, the island graph's nodes and edges, the floor stack, the old waypoint retired, the wire compass reading the Sight |
| Dovina (next) | `calibrate({ point })` in `progress/sight.js`; each area's checklist kinds and totals as data; the `area.<id>.<kind>` counts and the per-area achievements |
| Espada | the checklist rows' labels, plain until ruled |
