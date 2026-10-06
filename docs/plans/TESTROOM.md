# The Throwing Room: aim, recoil and Strawman, in one side room (the owner, 2026-10-06)

Kept by Dovina, for Petra, who builds the room and its bodies. The data is `src/progress/combat/testroom.js`, Strawman's is
`src/progress/combat/dunemaw.js` (`STRAWMAN`, `bout`), and the rules are `src/feedback/tracking/testroom.js` and `dunemaw.js`. The name is a
placeholder for Espada's.

> "pots should respawn only if in a designated testing area, not the whole workshop. Let's also move the target plates away from the
> Kiln to a side room, lump Strawman in there too. In fact, make it a whole thing with the calibration room/Index as a means of testing
> aim and recoil."

**The rule of the room: it measures, it never pays.** No cubes, curios or finds; its pots and Strawman never reach the ledger; a drill
run on a tuned game (`debug/tuned.js`) is said in the log, marked tuned, and never recorded. Records and medals are kept, as the
circuits' are, because a measure you can't beat is no use.

## (a) What it measures: four drills, begun at the Index

| drill | what | measure | medals (gold / silver / bronze) |
|---|---|---|---|
| **Flick** (aim) | 20 targets rise one at a time anywhere in a 120° arc, 4 to 14 m off; hit each within 1.5 s | mean time to hit, a miss counted as 1.5 s | 450 / 600 / 800 ms |
| **Track** (aim) | one target crosses the room at 3 to 6 m/s for 15 s, 6 to 12 m off | shots that hit, of shots fired | 80 / 65 / 50 % |
| **Spray** (recoil) | 20 shots held at the spray wall from 10 m | the group's radius (mean distance from its centre); its drift from the aim point is said too | 18 / 28 / 40 cm |
| **Recover** (recoil) | three bursts of five at three targets in a row (left, centre, right at 8 m) | shots on their target, of 15 | 87 / 73 / 60 % |

- **The spray wall:** soft clay, 4 by 3 m at 10 m, that keeps every dent for 30 real seconds (at most 60). The recoil pattern is read
  from the wall itself, with no numbers on it (Counter-Strike's spray practice); the log gives the group's radius and drift at the end.
- **The event** a drill's body emits: `drill.end { id, run: { hits, shots, times (ms), group: { radius, drift } }, tuned: [keys], by }`
  (`tuned` from `tuned().knobs`). The rule scores it (`score`, `medalOf`), says it in one line, and records it only if untuned.
- **Ledger:** `drill.<id>` (runs), `drill.<id>.best` (by its unit), `drill.<id>.<medal>`. **Achievements** (BATTLE, The Testing Room):
  each drill once; gold at Flick; gold at Spray; gold at all four.
- **A trial begun in its room:** each drill starts from the Index in the room, and ends when you leave the room.

## (b) Strawman

- **What it is:** a real creature that never falls. Statuses hold their real times, there is no friendly-fire tolerance, and the
  ledger never counts it.
- **What it reports:** one log line a **bout** (the blows until 4 real seconds pass without one), as `STRAWMAN` and `bout()` say; `/strawman`
  repeats it.
- **Modes:** F at Strawman cycles **still**, **guard** (blocks from the front) and **swing** (a slow swing every 3 sim s after a 0.8 s
  wind-up, which does no harm).
- **The fuller rig** (the owner's note): grain, mental state, affinities, presets that mirror real creatures. It is planned, not yet
  built (`docs/plans/DUNEMAW-SYSTEMS.md`, section 5).

## (c) The pots

- **Where they come back:** only the Throwing Room's 12 pots respawn, 8 sim seconds after breaking, in place. Every other pot in the
  Workshop breaks and stays broken.
- **What they give:** they pay nothing (`POTS.cubes` 0, `finds` 0). They give 2 baubles of Lachryma, so the psygun can keep firing.
- **The ledger:** they are `training`, so it never sees them, and they can't be farmed for anything.

## (d) The Index in the room

- **A page of its own:** the Index gains a **Testing** page here.
  - **The drills:** begin one.
  - **Each drill's best** and its medal.
  - **Tuning:** a line naming any tuned knob, with "runs are not recorded" while there is one.
  - **Strawman:** its last bout and its mode.
  - **Calibration:** the live movement values it shows today.
- **The room:** Petra sizes it to the drills. The longest throw is 14 m for Flick and the wall needs 10 m clear, so a room about 16 by
  20 m holds the Index at one end, the wall at the other, the targets' arc along one side and Strawman on the other.
