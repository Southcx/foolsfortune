# From Calissa (cups): the cutlass's default string is faster; its power a second is yours to re-rate

South ruled 2026-11-16 (SONDELASS-FEEL.md 6.2): the string may get faster, and you re-rate the power to keep the fight's length.
Step 2 of that plan (the time warp and the on-hit cancel, `tools/movewarp.js`) is built on c1 .. c4. I moved only the `time` of your
rows, to the new on-hit press-to-press times; `power` is as it was.

| row | old time (real s) | new time (real s) | what the new one is |
| --- | --- | --- | --- |
| combo1 | 0.42 | 0.25 | c1's on-hit cancel (15 frames); on a whiff 0.40 |
| combo2 | 0.46 | 0.27 | c2's on-hit cancel (16 frames); on a whiff 0.42 |
| combo3 | 0.50 | 0.27 | c3's on-hit cancel (16 frames); on a whiff 0.42 |
| combo4 | 0.78 | 0.42 | c4's on-hit cancel, the free recovery cut into c1 (25 frames); on a whiff 0.60 |
| sum | 2.16 | 1.21 | |

Power over the four: 1.2 + 1.3 + 1.4 + 2.0 = 5.9 (unchanged).
- Power a second, before: 5.9 / 2.16 = **2.73** (your 2.7).
- Power a second, now, a string that connects and is pressed as fast as it takes: 5.9 / 1.21 = **4.88** (+79%).
- (Swung at air the string runs at 1.84 s, 3.2 a second, but a whiff deals nothing.)

The engine no longer gates a warped row by its `time`: its cancel frame does (`cancel: { hit, whiff }` on the row's `play`,
`sondelassloadout.js`). So the `time` in your rows is now a description of the pace, not its gate; if you lower `power` to bring it
back to 2.7 a second (x0.553 across the four: about 0.66, 0.72, 0.77, 1.11), nothing else needs to move. If you would rather keep
some of the faster string's extra worth (a reward for connecting), that is yours.

What I could not check: no script of yours tests the 15% rule (`SONDELASS-STRINGS.md` 7, the note in `sondelassloadout.js`); I found
none in `scripts/` or in `npm run check`, which passes. By that rule's own measure the default string is now 79% over, and every
catalogue normal's "within 15% of the string's" is measured against a string that is no longer 2.7. Both are yours.

The pause strings (t1 after c1, j1 after c2) open at the same moment as before: 0.25 to 0.8 real s after a move ends, and a move left
alone ends at about its old length (c1 46 frames, c2 49, c3 49 from 57, c4 98 from 102).

## Step 5 (2026-11-17): the rest of the cutlass's rows, the same way

Step 5 of `SONDELASS-FEEL.md` (its section 13) warped every other row the cutlass's engine plays: the catalogue's normals and specials,
the pause strings, the launcher, the two air cuts, the dash and the counter. As in step 2, only your rows' `time` moved (to each move's
new on-hit cancel, the press-to-press time on a connecting blow); no `power`, `cost` or `hits` was touched. `stats.time` in
`sondelassloadout.js` mirrors the catalogue's. Not converted, times as they were: the plunge, the charged slash (`charge`), the iaido,
the stinger and the Wave Cut (`special`).

Power a second here is the row's power (x its hits) over its time; "now" is a blow that connects pressed again at once. On a whiff the
cancel is the later "whiff" column. A special now opens a free cut into the string at its cancel frame (before, only the paid cut or
its end), so a special's "now" is how soon you act again after it; its Lachryma cost is unchanged.

| row | power (x hits) | old time | new time (on hit) | whiff | power/s before | power/s now | change |
| --- | --- | --- | --- | --- | --- | --- | --- |
| quickSlash | 1 | 0.34 | 0.24 | 0.28 | 2.94 | 4.17 | +42% |
| backhand | 1.1 | 0.38 | 0.25 | 0.3 | 2.89 | 4.40 | +52% |
| bodyBlow | 0.9 | 0.3 | 0.2 | 0.3 | 3.00 | 4.50 | +50% |
| straightPunch | 1.35 | 0.52 | 0.3 | 0.42 | 2.60 | 4.50 | +73% |
| hookPunch | 1.1 | 0.43 | 0.27 | 0.38 | 2.56 | 4.07 | +59% |
| lungeSlash | 1.4 | 0.5 | 0.28 | 0.34 | 2.80 | 5.00 | +79% |
| heavyChop | 2.4 | 0.92 | 0.45 | 0.6 | 2.61 | 5.33 | +104% |
| guardBreak | 1.1 | 0.42 | 0.3 | 0.42 | 2.62 | 3.67 | +40% |
| pushKick | 1.45 | 0.6 | 0.45 | 0.53 | 2.42 | 3.22 | +33% |
| lowSweep | 1.35 | 0.55 | 0.4 | 0.52 | 2.45 | 3.38 | +38% |
| frontKick | 1.45 | 0.58 | 0.4 | 0.52 | 2.50 | 3.62 | +45% |
| roundKick | 1.35 | 0.52 | 0.42 | 0.54 | 2.60 | 3.21 | +24% |
| sideKick | 1.3 | 0.5 | 0.38 | 0.5 | 2.60 | 3.42 | +32% |
| kneeStrike | 1.35 | 0.52 | 0.38 | 0.48 | 2.60 | 3.55 | +37% |
| lowKick | 1.6 | 0.63 | 0.4 | 0.52 | 2.54 | 4.00 | +57% |
| spinSlash | 0.85 x4 | 1.17 | 0.84 | 0.92 | 2.91 | 4.05 | +39% |
| powerSlash | 3 | 1.2 | 0.55 | 0.7 | 2.50 | 5.45 | +118% |
| risingCut | 2.3 | 0.9 | 0.45 | 0.55 | 2.56 | 5.11 | +100% |
| guardCrush | 2.8 | 1.11 | 0.5 | 0.65 | 2.52 | 5.60 | +122% |
| backstepSlash | 2.5 | 1 | 0.55 | 0.66 | 2.50 | 4.55 | +82% |
| flyingKick | 3.6 | 1.45 | 0.75 | 0.9 | 2.48 | 4.80 | +93% |
| tornadoKick | 3.6 | 1.45 | 0.6 | 0.75 | 2.48 | 6.00 | +142% |
| spinHeelKick | 3.8 | 1.55 | 0.75 | 0.9 | 2.45 | 5.07 | +107% |
| risingKick | 2.7 | 1.1 | 0.5 | 0.58 | 2.45 | 5.40 | +120% |
| flurry | 1 x3 | 1.05 | 0.74 | 0.82 | 2.86 | 4.05 | +42% |
| breakKick | 2.7 | 1.18 | 0.5 | 0.62 | 2.29 | 5.40 | +136% |
| launcher (up) | 0.8 | 0.55 | 0.38 | 0.5 | 1.45 | 2.11 | +45% |
| air1 (a1) | 0.9 | 0.35 | 0.28 | 0.36 | 2.57 | 3.21 | +25% |
| air2 (a2) | 1 | 0.38 | 0.41 | 0.5 | 2.63 | 2.44 | -7% |
| pause1 (t1 and j1) | 1 | 0.4 | 0.27 | t1 0.38, j1 0.4 | 2.50 | 3.70 | +48% |
| pause2 (j2) | 1 | 0.4 | 0.26 | 0.38 | 2.50 | 3.85 | +54% |
| pause3 (j3) | 2.6 | 0.9 | 0.45 | 0.6 | 2.89 | 5.78 | +100% |
| thrust2 (t2) | 0.9 x3 | 0.9 | 0.72 | 0.8 | 3.00 | 3.75 | +25% |
| dash | 1.6 | 0.5 | 0.36 | 0.5 | 3.20 | 4.44 | +39% |
| counter (spin) | 0.8 x4 | 1.7 | 0.96 | 1.05 | 1.88 | 3.33 | +77% |

- **air2 got slower** (0.38 to 0.41): its old chain window opened at 0.36, before its strike's end (0.375 clip s); the warp's cancel frame
  never opens before the strike's end and a frame, so 0.41 is the soonest it may be.
- **pause1 is shared** by t1 and j1; both were given the same on-hit cancel (0.27) so the one row stays true.
- The heavies and the specials gain the most because their windups were the slowest (heavyChop 31 frames to its strike, now 15; the
  kicks 20 to 56, now 12 to 28) and their old times sat near the clip's end. The faster ones keep their tells where those are the
  windup (the backstep's hop, the flying kick's run-up, the spinning heel's turn: SONDELASS-FEEL.md 13).
- Every catalogue normal was within 15% of the string's 2.7 a second. Now the normals run 3.2 to 5.3 a second against the default
  string's 4.9, so they no longer sit evenly round it: the kicks (3.2 to 3.6) are slower than the string, heavyChop and lungeSlash
  (5.3, 5.0) a little faster. One scale for all (x0.553, step 2's to bring the string back to 2.7) would put them at 1.8 to 2.9 a
  second, -34% to +9% of 2.7: past your 15% for the kicks. The kicks' windups could go quicker (they are at 12 to 13 frames, the
  heavy target's top); that is a feel call, and yours and South's before mine.
