# From Calissa: the duel's open moved, and the tsuitate now builds itself (2026-10-30)

South asked for three things: the tsuitate assembling itself before the gems are seeded, a bigger board, and the cut-ins staggered
"for more cinematic effect". Your numbers mirror mine in three places, and all three moved. The new ones are below.

**The tsuitate's assembly** (`vfx/duelview/assembly.js`, `ASSEMBLY`). It plays at every open and lasts 1.9 real s. The posts rise, the
rails slide in along them and clack, the feet set, the panes crystallise across each half, the grid is scribed in, and the Line lights
last. A new optional hook fires at each beat: `sfx.duelAssemble?.(beat, i)`.

| beat | i | real s into it |
| --- | --- | --- |
| `'post'` | 0 yours, 1 the foe's | 0, 0.06 |
| `'clack'` | 0 the top rail, 1 the foot rail | 0.64, 0.72 |
| `'crystal'` | (the panes begin) | 0.92 |
| `'feet'` | (the frame lands on them) | 1.0 |
| `'etch'` | (the grid begins) | 1.2 |
| `'line'` | (the seam lit) | 1.84 |
| `'done'` | (the seeding deals 0.05 s later) | 1.9 |

**The VS open** (`duelshow.js SHOW.vs`, from its start as the wipe clears). It is now 0.15 / 0.95 / 1.5 / 1.95 / 4.0. Your `VS` in
`audio/duelcasts.js` wants:
- `jar` 0.95 (was 0.75)
- `hit` 1.5 (was 1.05)
- `out` 1.95 (was 1.55). Both bands leave together here.
- `seed` 3.7 (was 1.45). The assembly starts at 1.75, as the bands leave, so the camera pulls out onto the build; it ends at 3.65,
  and the deal begins at 3.7. (Its beats above, from 1.75: the posts at 1.75, the clacks 2.39 and 2.47, the crystal 2.67, the feet
  2.75, the etch 2.95, the Line 3.59.)

`foe` and `name` are unchanged.

**A duel without the VS** (classic, practice). The deal now begins about 2.15 real s after the open, not at your `SEED.other` 0.45.
It starts later still if the encounter's wipe is covering the screen. The steadiest fix is to call `duelSeed(0.05)` from the `'done'`
beat and drop the guess.

**The cut-ins:**
- After a skill's band has gone, the screen holds for a beat before its cast lands (`CUT_IN.lead` 0.2; the limit break's
  `limitLead` 0.25). In `puzzleduel.js`:
  - `CUT_IN.gesture` 0.8 becomes 1.0.
  - `JAR_CUT.cast` 0.92 becomes 1.12.
  - `JAR_CUT.limitCast` 1.75 becomes 2.0.
- The turn's band now waits 0.3 s after a play's last beat (`CUT_IN.turn.settle`). Its event still arrives with the band, so
  `TURN_CUT_IN` is right as it is.
