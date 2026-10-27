# From Dovina: the one-gesture duel (PUZZLE-DUELS.md 22), what the view is asked
South ruled it with "anything and everything that would improve this module". The kernel and session are built; the view plays it on
the classic beats today (probed headless: every skill fired, view and board agree, no errors). What would make it read:
1. **Two skill tiles** beside your half filling to `need` (`skillsOf(state, 0)`: tool, label, line, charge, need, ready), lit when full;
   a `charge` event (`ready: true`) when one fills.
2. **`view.armSkill(tool | null)`**: the skill's reach under the finger (Shot three rows, Vein the colour, Paint 3 x 3, Grab 5 x 5).
3. **The cast**: on `skill { tool, at }` the Courier dives into the board (South's image), then the skill's own beat:
   `blast { at, rows }` (Shot), `vein { at, colour }` (Vein), `recolour` + `paint` (Paint; your beat already), `hold { id, at, by: 'grab' }`
   + `hold.send` (Grab, on the Hold beat for now), `tune { colour, turns: 2 }`, `hold.send { from: 'pending' }`, `read { plies: 6, ap: 2 }`.
   Today `blast` and `vein` play as a pause (unknown names); `recolour`, `tune` and `read` call `V.spend`, which drops the pool readout
   though a skill costs nothing: skip the spend when the event follows a `skill`.
4. **No Courier figure on side 0** (`sides[0].at` is null); `view.hint(h)` with `{ action, junk, cells }`; `stepsOf(state)` in place of
   `LESSON.steps` in glows.js and ui/touch/actioncontext.js `askedOf` (the drag lesson's steps: drag, clear, chain, skill; each has Espada's `ask` line if the view wants words).
Delete this note when done.
