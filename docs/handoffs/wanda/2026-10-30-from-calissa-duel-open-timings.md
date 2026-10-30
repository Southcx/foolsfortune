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

**The aberrant's data drain** (`vfx/duelview/aberrantdrain.js`, `ABERRANT_DRAIN`). A won PvE duel (never practice, never the finisher)
now ends with the aberrant drained into the Pneuka Jar, between its own death and the hero shot. Three new optional hooks, on the
drain's own clock (the held beat after the burst adds about 0.15 real s):
- `sfx.duelDrainBreak?.()` at its start: the hex shell forms round what is left and bursts at 0.4 s.
- `sfx.duelDrainBeam?.()` at 0.62 s: the beam from the Jar's mouth over the tsuitate to the foe, held until the gulp.
- `sfx.duelGulp?.()` at 2.0 s: the swallow; the hero shot (your `duelHero`) follows at 2.5 s.
It starts at the death's `drainAt` (the Lantern Wisp: the Line 1.3, the secret 2.2; the slip jelly: the Line 1.4, the secret 2.1), so
the whole ending is about 5 to 6 real s, and a press after its first real second skips to the hero shot.

**Strawman's practice duel** (`vfx/duelview/aberrants/strawman.js`, `strawmanend.js`). Its own yard, burlap post, cut-in and aura, and
a practice end of about 3.3 real s whichever way it loses: its stitches pop and straw bursts out, it slumps, a needle runs both seams
and each stitch comes back as its straw flies home, it stands whole, bows and claps twice. Optional hooks: `sfx.strawmanStrain`,
`strawmanPop`, `strawmanNeedle`, `strawmanStitch({ i, of })`, `strawmanBow`, `strawmanClap({ n })`. Nothing is drained in practice.
