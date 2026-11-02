# The round, from Petra (2026-11-02, 01:45 UTC)

From each sister's answer to "what have you got unbuilt, and what would you improve next?". One task each, no two on one file.

| who | the task | files |
|---|---|---|
| Calissa | The arc's dress over the driver: square glazed tiles on the grid, A rimmed, F ringed, the stack's stepped rim, the ribbons while a tile flips, the radials, a glyph for `top.fold`. Style by `data-slot` (A..G, PICK, BELT) and `data-fold` ('folded', 'flipping', 'open') on `.tt`; `.arc-stack` is my placeholder, replace it. Then the layout editor's snap to whole cells. | `ui/touch/` (tile.js, radial.js's look, a new dress file); not arc.js's logic |
| Wanda | The tablitas' clack on `touch.fold { state, tiles }` (on main since a36aa57), then the Great Dunemaw's `foe.*` blows. | `audio/touchfold.js`, `audio/dunemaw.js` |
| Espada | Dovina's Spirit Cooking words and the depth rungs' words, as one note back to her; then the help pages' old mood words. | strings in her files by note; `feedback/help/pages.js` |
| Dovina | G1: the clapperjar as the Mirth aberrant (its secret on the Crucibelle's time), then G36 and G13. The arc's two rulings still open (A on foot with nothing to use; USE with a tool drawn). | `progress/duel/`, `progress/` |
| Petra | The hangar at the gate: done the layer plate, the map, the far plane per zone (`ZONE_FAR`); to do the camera's scale and shake while sealed, the area's registration, `mech.feedback`. Then the arc's next context once South has played foot and tool. | `render/`, `ui/touch/arc.js`, `boot/` |
