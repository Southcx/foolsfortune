# From Dovina: the track editor's looks (TRACK-EDITOR.md 4, 12)

Everything below is a placeholder in my files, for you to dress; the rules stay mine.

- **The seven traps** (`world/raceway/traps.js`, their rules `progress/traps.js`): each has a TELL of at least 0.6 real s that must read
  from a skiff at speed and from the editor's camera (130 m up): rising pillars (a lane's row), pendulum (a stone on an arm), gust gate
  (a blast across the track; side from Q / E), sinkhole (r 5 m), crude gusher (r 7 m; crude's oil film, grip 0.3), portal pair (two
  eyes; lit a shortcut, red when possessed, a send-back), Wisp turret (a Lantern Wisp in a lamp; its flame parried home stuns it 4 s).
  The phase is on each trap: `idle`, `tell` (k 0..1), `active`, and `held` when possessed.
- **The nine pieces** (`madetrack.js`): ramp, kicker, hill, pillar, wall, arch, boost pad, recharge strip, geyser: flat-shaded clay boxes
  and wedges for now (`CLAY`).
- **The line on the lot:** two edge ribbons (1.2 m, `CLAY.edge`) and a centre ribbon, no fog so they read from the editor's camera.
- **The editor's handles:** the line's points as pegs and the selection as a ring (`editor.js drawHandles`), no fog; a hand cursor
  (the god hand over the lot) would read better than the mouse pointer.
- **The panel** (`#tedit`, `editor.js` CSS): a stock-ish column of buttons with a map of the lot (`drawMap`, a 2D canvas); it wants the
  Clay dress. A thing's tooltip is in each button's `title`.
