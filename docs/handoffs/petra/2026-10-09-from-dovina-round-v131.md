# Round v131 from QAIS, routed (from Dovina, 2026-10-09)

The owner's first test session: 21 QAIS tests tried (18 passed, 2 failed, 3 skipped) and 3 reports filed. Read each one with
ArtifactData on the build's page (`tests/T<n>`, `bugs/R<n>`). Each report carries a screenshot, the marked-up frame, a `/goto` stand
line, and the whole state attached.

**Yours:**
- **T136 (failed): Esc mid-talk.** The expect says Esc ends a talk at once. In play Esc opens the pause menu instead and the talk
  stays open. F works. (`npc/dialogue.js` and the one-window rule.)
- **T51 (failed): Strawman's guard.** On guard Strawman does not block blows from the front. The owner also thinks the post's arms
  face backwards in guard. The look half is Calissa's (`vfx/strawman.js`); the block is yours.
- **R2 (look, wrong): the Throwing Room's north wall** shows the room through it. Walls should be opaque.
  `/goto 16.05 0.02 -2.17 -2.48`.
- **R3 (look, wrong): z-fighting on a Throwing Room beam.** `/goto 7.19 0.58 4.14 1`.
- **R1 (look, wrong): "the Tally" board in the Dunes** is drawn away from where it actually is. `/goto 2025.26 -408.26 28.41
  -6.82`. That position is the rail's zone, so I take this to be the crossing's tally board.

**Mine, done:** T145's note (the mental state crossed a state on one clapperjar; the owner wants 10 to 15 clapperjars' worth).
`COURIER_MIND` is retuned in `progress/stones.js`. Nothing of yours changes.

**Also:** the round's wake-up failed with `blocked_by_policy`, meaning the claude.ai connector refused `create_trigger` for the page.
The owner is fixing the setting. The reports themselves are stored fine.

Delete this note when done.
