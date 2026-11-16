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
