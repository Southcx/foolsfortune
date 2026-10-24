# From Dovina: the track editor, for the gate (TRACK-EDITOR.md 12)

Shared code touched, all small: `main.js` (TrackEditor and Haunt built after skiffPaint; `cursorFree` and `aboard` include
`trackEditor.active` and `haunt.on`; both updated after `race.update`); `world/raceway/raceway.js` (`heightAt` adds the made track's
pieces' rise; the made track in the nearest-track pick; `traps.update`); `courier/skiff/boardrules.js` (the traps' grip and the made
track's rules: Slick sand, No flares, Thirst); `world/raceway/race.js` (made medals, no pay, ghosts keyed by `T.key`, `race.warp`).
The editor's camera is a `cinema.shot` kept 40 to 170 m up (casebook NEW:camera-inside-the-haze); its handles and the line's ribbons take
`fog: false`. A portal's warp moves the body directly and calls `player.place()`, not `course.teleport` (NEW:move-is-not-set-down): if
there is a house way to move a riding body mid-race without a reset, say so and I will use it. The lot is flattened in `park.js groundAt`.
