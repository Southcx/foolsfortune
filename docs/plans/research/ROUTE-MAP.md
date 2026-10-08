# Research: a map you draft a path through, and a forecast that fades with depth (2026-10-08)

Gathered for the passage (`docs/plans/PASSAGE.md`) by a research agent for Dovina. No decompiled Slay the Spire source was reachable:
details marked [recalled] are from memory of `MapGenerator`, unverified.

## Slay the Spire's map

Sources: https://steamcommunity.com/sharedfiles/filedetails/?id=2830078257 (the guide), https://slaythespire.wiki.gg/wiki/Map_Generation,
https://slaythespire.wiki.gg/wiki/Map_Locations. Re-implementations: https://github.com/silverua/slay-the-spire-map-in-unity,
https://github.com/OrangeSensei06/SlayTheSpireMapGeneration.
- A 7-wide, 15-floor grid. **Six passes**, each from a random floor-1 room walking up to one of the three nearest rooms above (the first
  two starts differ); paths may merge, **never cross**; rooms off every path removed; all top rooms link to the boss.
- Fixed floors: 1 monsters, 9 treasure, 15 rest, 16 boss.
- **A budgeted pool, not a roll per room:** monster 53%, elite 8% (16% from Ascension 1), rest 12%, merchant 5%, unknown 22%; shuffled,
  then assigned under local rules (a broken rule rerolls): no elite or rest below floor 6; elite, merchant and rest never twice in a row
  (child unlike parent); a room with two or more exits leads to rooms of different types (siblings unlike); no rest on floor 14.
- "?" rooms resolve on entry; each type's chance rises while unseen. The whole map is a function of the seed. The burning elite carries
  a key (selection logic not found).
- What carries over: lanes that merge but never cross read as a graph at a glance; wide early, convergent late; fixed rows as pacing
  anchors; local rules plus a budget make a balanced map by construction. Its real skill is route reading.

```
for i in 0..5: start = rand column (the second unlike the first); walk up to one of x-1, x, x+1 (no crossing), link the top to the boss
drop unlinked rooms
fixed rows; pool = counts by share of the live rooms; shuffle; for each room: first legal type in the pool, else the common type
legal: floor minimums; unlike parent; unlike siblings
```

## The others

- **FTL:** a global pressure (the Rebel fleet) advances only when you jump, so every jump spends time or knowledge; long-range scanners
  show one jump ahead (detail unverified).
- **Inscryption:** every node's icon names its verb, and some show their parameter (a blood cost).
- **Hades:** each door shows the next room's reward with certainty, one step ahead; icons are a learned legend.
- **Darkest Dungeon:** scouting reveals nearby rooms; **known-empty is drawn unlike unknown** (a third state worth paying for).
- **Sunless Sea / Skies:** knowledge is a sellable good that **depreciates** (the Admiralty stops paying for the commonplace); a chart
  carried from a past life spoils the discoverer's surprise; fog is a cost (terror) and a reward (fragments).
- **Into the Breach:** shown information is true; uncertainty may be shown only if it is calibrated.
- **The hurricane cone:** people read its width as size and its edge as a wall, and treat everything outside as safe; animated ensembles
  fix it. **Never draw a crisp edge where a forecast ends: fade it.** (https://natsci.source.colostate.edu/no-more-cone-psychology-researchers-offer-better-tool-for-visualizing-hurricane-danger/)

## Showing uncertainty

- Visual variables: transparency, crispness and resolution; fog reads intuitively (MacEachren et al. 2012).
- **Counts beat percentages:** quantile dotplots and hypothetical outcome plots let people count outcomes and decide better
  (https://mucollective.northwestern.edu/project/when-ish-is-my-bus, https://mucollective.northwestern.edu/project/hops).
- Game-ready: a shortlist of candidates that narrows as confidence grows (Hades' two boons on a door, extended); blur by depth with the
  silhouette class kept crisp; a known-empty state; a slow, player-held cycle through candidates (check against the no-flicker rule);
  confidence as a line's weight, never a boundary; depth a gradient, not tiers. No numbers or words on world marks.

## What the repo has (read 2026-10-08)

- `progress/econ/emocean.js`: `NODES` are three islands on the Law-Chaos line (a line, not a constellation); `LEG`, `legsOf` (1 to 3),
  `barsOf`, `hop()`, `STAGE` (10 authored waves), `stagePlan` (the day moves lanes, never the order), `RECKON { lead: 3, open: 0.6 }`,
  `reckonLead`, `opensNode`.
- `progress/voyage.js`: `reckoning(from, to)`, `reckon(from, to, share, q)` keeps the day's best; **nothing in `src/` calls `reckon()`**
  (the survey verb is unwired). `board()` draws the Leviathan's deck at the pier.
- `progress/rail/crossing.js`: `setPiecesOf` (pirates by the day's dice against the hold; the Leviathan the last leg if drawn), `script()`:
  a crossing is already a pure function of (route, day, casks, the deck's draw, weather), so a forecast can be computed from it.
- Weather: `stageWx(island)` (dread shortens the lead x0.6, wonder lengthens x1.25); `weather.forecast(place, hours)` is the one
  "further is less known" mechanism, a hard cutoff.
- Cogitomap: only for a Well; worth `runPay x 0.3 x charted`; priced by island demand (Margarite 0.95, Anagami 0.25, Entropolis 0.15);
  `demandKey` routes every `kind: 'map'` to the Cogitomap's curve, so a new map kind needs its own key; `spellscription.copy` declared.
