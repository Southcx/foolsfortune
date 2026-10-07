# The Throwing Room: aim, recoil and Strawman, in one side room (the owner, 2026-10-06)

Kept by Dovina. **Built:** the room `src/world/testroom/` (room.js, layout.js, drills.js), the data `src/progress/combat/testroom.js`
(DRILLS with their medals, `score`, `medalOf`, `group`, `recordable`, POTS, WALL, INDEX), Strawman's `STRAWMAN` and `bout` in
`src/progress/combat/dunemaw.js`, the rules `src/feedback/tracking/testroom.js` and `dunemaw.js`, the achievements tx1 to tx4
(BATTLE, The Throwing Room). The name is a placeholder for Espada's.

> "pots should respawn only if in a designated testing area, not the whole workshop. Let's also move the target plates away from the
> Kiln to a side room, lump Strawman in there too. In fact, make it a whole thing with the calibration room/Index as a means of testing
> aim and recoil." (the owner, 2026-10-06)

## Rulings

- **It measures, it never pays.** No cubes, curios or finds; its pots and Strawman never reach the ledger; a drill run on a tuned game
  (`debug/tuned.js`) is said in the log, marked tuned, and never recorded. Records and medals are kept, because a measure you can't
  beat is no use.
- **Four drills, begun at the Index in the room**, ended when you leave it: Flick and Track (aim), Spray and Recover (recoil). The
  spray wall keeps every dent for 30 real seconds (at most 60): the pattern is read from the wall itself, with no numbers on it
  (Counter-Strike's spray practice); the log gives the group's radius and drift at the end.
- **Strawman** never falls: statuses hold their real times, no friendly-fire tolerance, never counted. One log line a bout (the blows
  until 4 real seconds pass without one); `/strawman` repeats it. F cycles still, guard (blocks from the front) and swing (harmless).
- **The pots:** only the room's 12 respawn (8 sim seconds after breaking, in place); every other Workshop pot stays broken. They pay
  nothing and give 2 baubles of Lachryma so the psygun can keep firing; they are `training`, so the ledger never sees them.
- **The Index's Testing page:** begin a drill; each drill's best and medal; a line naming any tuned knob ("runs are not recorded");
  Strawman's last bout and mode; the live movement values.

## Event contract

`drill.end { id, run: { hits, shots, times (ms), group: { radius, drift } }, tuned: [keys], by }` (`tuned` from `tuned().knobs`).
Ledger: `drill.<id>` (runs), `drill.<id>.best` (by its unit), `drill.<id>.<medal>`.

## Open

- Strawman's fuller rig (the owner's note): grain, mental state, affinities, presets that mirror real creatures
  (`docs/plans/DUNEMAW-SYSTEMS.md`, section 5).
