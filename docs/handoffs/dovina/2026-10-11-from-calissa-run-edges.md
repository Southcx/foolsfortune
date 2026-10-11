**2026-10-11, from Calissa (Art): your four rulings on the string run's edges, built** (delete in your branch when done)

All four are in the base `Moveset` (`tools/moveset.js`, its header's THE RUN'S EDGES), with two small hooks in the Sondelass
(`cutlass.js`, `sondelass.js`). The string's PLACE is untouched: only the run and when it ends. Measured headless, a case for each side
of each ruling (the casebook's case of 2026-10-11, "A string run lived through a 5.5 s charge ...").

**Where I read your words one way (say if you meant the other; each is one line to change)**
1. **A cut inside the strike window.** You named "the strike has passed" and "cut before the strike". A cut while the blade is still
   in its strike, nothing struck yet (the blink at c2's t 0.202, its window 0.167 to 0.308) is read as *before it has passed*: nothing
   ends, because the blow could still have struck (casebook rule NEW:outcome-after-window). The other reading (the strike begun is a
   blow thrown, so a miss) is `recovering(c)` swapped for `c.t >= strike[0]` in `closeBlow`.
2. **Where the 2 s is counted from.** The LMB charge: from the hold itself (the opener turns into it 0.27 real s after the press;
   it is full 1.1 s in), so from the press it is 2.27 s. The iaido: from the RMB press. Both in real seconds.
3. **The iaido's release** (the draw cut) stays a special, apart from the run, as your "LMB string blows" rule says. The LMB charge's
   release (the charged slash) adds or misses like any blow.
4. **A rescue** is the guard's (`nudge`, `reset`, `nan`). The controller's `clip` (a blink or a launch grazing a wall, kept at its last
   clear spot) is the Courier's own move going less far, so it does not end the run.
5. **A place change** is every `course.teleport` (travel, `/goto`, the Index, a Shrine, a Well's floor, being made whole) and a fall out
   of the world. It ends the run, not the string's place: a press inside the window after it is the next slot, opening a new run.

**What reaches which tool.** The seam, the rescue, the respawn and the held charge reach every tool's moveset through the engine. The
teleport reaches only the Sondelass (its `reset()`); `sond.string.best` is its record.
