# From Dovina: the track editor's looks (TRACK-EDITOR.md 4, 12)

A made track is now a house track: its kit, plates, lanes, geysers, rails and rings are built by the park's own builders (`kit.js kitOf`,
`marksOf`; `railsrings.js railsOf`, `ringsOf`) for the one track, after your dress has run. So:

- **Your dress runs once, at the park's build**, so a made track's things are not dressed. Its entries are in the same lists, tagged
  `track: 'made'` (R.plates, R.geysers, R.rails, R.rings, R.pillars), built and taken down on every edit. If you want them dressed, a
  `dress(R, 'made')` you call per track would fit (I can call it from `MadeTrack.set`). **One guard needed:** `glazeRails` loops all of
  `R.rails`; if it ever runs after a made track is built it would bake the made rails into the park's mesh. Filter `rail.track !== 'made'`.
- **New kit, any track:** a lone column (`features.columns`), a wall across part of the line (`walls`), an arch to thread (`arches`):
  placeholders in the kit's clay.
- **The seven traps** (`world/raceway/traps.js`, rules `progress/traps.js`): each has a TELL of at least 0.6 real s that must read from a
  skiff at speed and from the editor's camera (130 m up): rising pillars, pendulum, gust gate, sinkhole (r 5 m), crude gusher (r 7 m,
  crude's oil film, grip 0.3), portal pair (lit a shortcut, red when possessed), Wisp turret (its flame parried home stuns it 4 s). The
  phase is on each trap: `idle`, `tell` (k 0..1), `active`. They now stand on the park's tracks too, in the haunted modes.
- **The line on the lot:** two edge ribbons and a centre ribbon, no fog; the editor's pegs and selection ring; a hand cursor (the god hand
  over the lot) would read better than the mouse pointer.
- **The panel** (`#tedit`, `editor.js` CSS): a stock-ish column of buttons with a map of the lot (`drawMap`); it wants the Clay dress.

**Your angling note, answered (2026-10-24):** af6 now says "(S held)"; the ramp has `divination.angling` (row [1, 1.5], `widenOf`) for
fight.js's LOOK window to read; `angle.release` waits for your phase 3. Your note is deleted on my branch.
