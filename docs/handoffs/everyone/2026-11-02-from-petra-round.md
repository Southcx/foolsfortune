# The round, from Petra (2026-11-02, 01:45 UTC)

From each sister's answer to "what have you got unbuilt, and what would you improve next?". One task each, no two on one file.

| who | the task | files |
|---|---|---|
| Calissa | The arc's dress over the driver: square glazed tiles on the grid, A rimmed, F ringed, the stack's stepped rim, the ribbons while a tile flips, the radials, a glyph for `top.fold`. Style by `data-slot` (A..G, PICK, BELT) and `data-fold` ('folded', 'flipping', 'open') on `.tt`; `.arc-stack` is my placeholder, replace it. Then the layout editor's snap to whole cells. | `ui/touch/` (tile.js, radial.js's look, a new dress file); not arc.js's logic |
| Wanda | The tablitas' clack on `touch.fold { state, tiles }` (on main since a36aa57), then the Great Dunemaw's `foe.*` blows. | `audio/touchfold.js`, `audio/dunemaw.js` |
| Espada | Dovina's Spirit Cooking words and the depth rungs' words, as one note back to her; then the help pages' old mood words. | strings in her files by note; `feedback/help/pages.js` |
| Dovina | G1: the clapperjar as the Mirth aberrant (its secret on the Crucibelle's time), then G36 and G13. The arc's two rulings still open (A on foot with nothing to use; USE with a tool drawn). | `progress/duel/`, `progress/` |
| Petra | The hangar at the gate: done the layer plate, the map, the far plane per zone (`ZONE_FAR`); to do the camera's scale and shake while sealed, the area's registration, `mech.feedback`. Then the arc's next context once South has played foot and tool. | `render/`, `ui/touch/arc.js`, `boot/` |

## The next round (04:20 UTC, v397)

Done since 01:45:
- Calissa: the arc's dress, then the mech's parts body worn in the hangar (South handed her the mech module).
- Dovina: G1 and mech v2.
- Petra: the hangar's feedback, shake and quake; the arc's two rulings; a world clapperjar going wrong in Mirth.
- Espada: the lectern's and the touch row's words.

| who | the task | files |
|---|---|---|
| Wanda | Mech v2's sounds as one bank: `city.break`, `.felled`, `.land`, the ring's `bout.*`, and Calissa's `mech.mount { beat }`. Then the clapperjar duel's beats (`secret.step` carries `beat`), then the crossing's `rail.*` moments. | `audio/` (a new mechs file) |
| Espada | Dovina's Spirit Cooking words and the depth rungs' words, as one note back to her; then the help pages' old wording. | strings by note; `feedback/help/pages.js` |
| Calissa | The duel view's fallback elite (today any aberrant without its own is dressed as the Wisp, and its close wrote to `foe.look`); the clapperjar's own elite; a `touch.kick` glyph for the arc's A. The hangar is yours. | `vfx/duelview/`, `ui/icons/`, `world/hangar/` |
| Dovina | G36 and G13; the arc's contexts are ruled (skiff, mech, Arena, crossing, helm, carrying). | `progress/` |
| Petra | The arc's next context, the Solar Skiff; then the Pneuka Jar riding the slip jelly mount in a saddle (South's ruling); SOLID slice 2 onward. | `ui/touch/arc.js`, `courier/jellymount/`, `boot/` |

## The next round (05:30 UTC, v399)

Done since 04:20:
- Calissa: the duel view's fallback dresses nothing; the clapperjar's elite; the kick's touch glyph; helms and the doll's form.
- Espada: the cooking and depth words to Dovina; the help pages.
- Dovina: three mimicry puzzles, the flat stage, centrepieces, briar visitors, Auto-Cook, Gall and Fury in the garden's rules.
- Wanda: mech v2's sounds, the clapperjar's beats, the crossing (v398).
- Petra: the Pneuka Jar rides the slip jelly mount in a saddle (South's ruling).

| who | the task | files |
|---|---|---|
| Calissa | The saddle's look on `game.jellyMount.rider.saddle` (a Group, a placeholder clay ring today); then Dovina's flat stage and mimicry looks notes (the ghost hides `game.mimicry.veiled()`'s cells). | `vfx/jellymount/`, `vfx/strawmanwell/`, `vfx/mimicry/` |
| Wanda | Dovina's flat stage note (the galop on `flatstage`), then her clapperjar note. | `audio/`, `music/choose.js` |
| Espada | Dovina's clapperjar note's words; the garden's scorch line (`garden.scorch`, a placeholder in `tracking/garden.js`). | strings by note |
| Dovina | Grain's species key (`wisp`: Petra reads `c.kind`); then her own next. | `progress/` |
| Petra | Dovina's hooks (Bite Sense, the thermometer, the aberrant Wisp's state, briar visitors, grain at spawn, the flat stage's chain, Gall and Fury in the garden), then the three mimicry families; the arc's skiff context after. | `tools/`, `world/garden/`, `world/mimicry/`, `creatures/` |
