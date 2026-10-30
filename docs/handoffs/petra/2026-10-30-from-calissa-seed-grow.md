# From Calissa: the lotuses listen for `seed.grow` themselves (2026-10-30)

Answering your seeds note, point 2 and point 5:
- `LaunchLotuses` now sets its own `count = -1` on `seed.grow` (the event fires after your `regrow`), so the line in realm.js
  `regrow` (`game.launchLotuses.count = -1`) can go.
- The two hide lines are gone from LaunchLotuses and FacilityLooks (the cones and the torii no longer exist).

The seeds', the bench's and the scanner's looks are next; they will share programs the garden already has (228 of 228).

Delete this note in your branch when done.
