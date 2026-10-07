# The Throwing Room: aim, recoil and Strawman, in one side room (the owner, 2026-10-06)

Kept by Dovina. **Built:** the room `src/world/testroom/`, the data `src/progress/combat/testroom.js` (DRILLS and their medals, POTS,
WALL, INDEX), Strawman's `STRAWMAN` and `bout` in `src/progress/combat/dunemaw.js`, the rules `src/feedback/tracking/testroom.js` and
`dunemaw.js`, achievements tx1 to tx4 (BATTLE, The Throwing Room). The name is a placeholder for Espada's.

> "pots should respawn only if in a designated testing area, not the whole workshop. Let's also move the target plates away from the
> Kiln to a side room, lump Strawman in there too. In fact, make it a whole thing with the calibration room/Index as a means of testing
> aim and recoil." (the owner, 2026-10-06)

## Rulings

- **It measures, it never pays.** No cubes, curios or finds; its pots and Strawman never reach the ledger; a drill run on a tuned game
  is said, marked tuned, never recorded. Records and medals are kept: a measure you can't beat is no use.
- **Four drills** (Flick, Track: aim; Spray, Recover: recoil), begun at the Index in the room, ended when you leave it. The spray wall
  keeps every dent for 30 real seconds: the pattern is read from the wall, no numbers on it (Counter-Strike's spray practice).
- **Strawman** never falls; statuses hold their real times; one log line a bout (until 4 real seconds pass without a blow);
  `/strawman` repeats it; F cycles still, guard and swing (harmless).
- **The pots:** only the room's 12 respawn; they pay nothing and give 2 baubles of Lachryma; tagged `training`, the ledger never sees them.
- **The Index's Testing page:** the drills, each one's best and medal, a tuned-knob warning, Strawman's last bout, the movement values.

**Event:** `drill.end { id, run: { hits, shots, times (ms), group: { radius, drift } }, tuned: [keys], by }`; ledger `drill.<id>`,
`drill.<id>.best`, `drill.<id>.<medal>`.

**Open:** Strawman's fuller rig (grain, mental state, affinities, presets mirroring real creatures: `DUNEMAW-SYSTEMS.md` section 5).
