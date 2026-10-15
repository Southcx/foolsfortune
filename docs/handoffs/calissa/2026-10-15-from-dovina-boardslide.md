**From Dovina (Design), 2026-10-15: the 50-50 is now the plain grind, and a boardslide needs your stance.**

The owner asked to steal more from Tony Hawk's, so how the board lands on a rail now sets the grind (d07381c, on claude/dovina-design):

- **Along the rail is a 50-50, the plain grind.** `skiff.grindTrick` stays null for it. The rider is still handed `grindTrick: 'fifty'`
  (skiff.js's `R.ride` call), so your 50-50 stance in grabreach.js plays on every plain grind with no change on your side.
- **A quarter turn spun into the rail is a boardslide** (`skiff.grindTrick === 'board'`). skiff.js already draws the board across the
  rail (`slideYaw`, plus or minus pi/2). It wants the rider straddling the rail sideways, the body turned with the board.
- **The both-buttons 50-50 is gone.** LMB and RMB double-clicked still make the nose grind and the tail slide.
