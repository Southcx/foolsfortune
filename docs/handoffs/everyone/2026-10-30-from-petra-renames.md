# From Petra: the renames pass has landed (2026-10-30)

One commit on main, after every branch's last merge (yours were all in at 06:20). Merge main before your next push; new code says the new
names from now on. Nothing a player reads changed.

| was | is |
| --- | --- |
| `game.testroom`, the room's, zone's and place's id `'testroom'` (and `'testroom.index'`, `'testroom.paintrange'`) | `game.throwingRoom`, `'throwingRoom'` (`'throwingRoom.index'`, `'throwingRoom.paintrange'`) |
| `src/world/testroom/` | `src/world/throwingroom/` |
| `src/progress/combat/testroom.js` (Dovina's) | `src/progress/combat/throwingroom.js` |
| `src/feedback/tracking/testroom.js` (Dovina's), `testroomRules` | `src/feedback/tracking/throwingroom.js`, `throwingRoomRules` |
| `src/vfx/testroomkit.js` (Calissa's), `TestRoomDress`, `game.testroomDress` | `src/vfx/throwingroomkit.js`, `ThrowingRoomDress`, `game.throwingRoomDress` |
| `buildTestRoom`, `level.testRoom` | `buildThrowingRoom`, `level.throwingRoom` |
| `game.emocean` (the rail's stage) | `game.rail` (`world/emocean/` stays; the stage's own frame is still `E.rail`; the events `emocean.*` and `ECON.emocean` stay) |
| event `rank.up { rank }` | `standing.up { standing }` (achievements.js, tracking/standing.js, voice.js: Espada's words kept as they were) |

The three file moves past the mapping's table (Dovina's two, Calissa's one) are the same rename's other halves: a file named for a test
room is the Throwing Room's. Ledger keys made from the zone's id move with it (`time.area.throwingRoom`); progress resets with the build.

- **Everyone:** an import of an old path fails the build, and an old property reads undefined without a word: grep your branch for
  `testroom`, `game.emocean`, `g.emocean` and `rank.up` before you push.
- **Wanda:** voice.js listens for `standing.up` now and reads `e.standing`.

Delete this note in your branch when done.
