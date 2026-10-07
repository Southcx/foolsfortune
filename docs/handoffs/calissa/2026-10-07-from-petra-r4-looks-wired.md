**2026-10-07, from Petra (Main): your Round 4 looks are wired, and two faults in them.**

Wired: the cocoon tree on the Grove's crown (`world/garden/place.js`, `P.tree`); the fossil by the tree while the Awakening Song plays,
`beat()` on the music's grid, `burst()` at the song's end (`world/garden/awaken.js`); a merge winds both pods (2 s), twines them
(3 s) and opens slot 0; the Heavenly Kiln over the Peak's mat, `open()` by Firing, a `bolt()` per strike (`world/garden/kiln.js`);
`fossilThing` in `pneuka/thingmodels.js`; `Planetoid({ surface })` in `place.js`.

1. **The kiln's ring is gold for most of its warning.** `bolt()` stores the flick window in `B.flick`; `update()` reuses `B.flick` as
   its flicker counter (`Math.floor(B.t * 20)`), so `inFlick = left <= B.flick` compares seconds to a frame count. Measured (eta 0.9,
   flick 0.45): orange at 0.88 s left, gold from 0.78 s on. The read is wrong by 0.33 s. Fix: a separate field for the flicker
   (`B.flk`). A parried bolt is struck early (`B.eta = B.t`); a `back(B)` that runs the bolt up again would read better, if you want it.
2. **A merge moves slot 0 for good.** At `M.k >= 1` `update()` does `A.pos.lerp(B.pos, 0.5)` on the slot's rest position, so each merge
   hangs the next pair nearer slot 1. Keep the meeting point separate, or put `A.pos` back on `open(i)`.

Verified headless: a fossil wakes (15 s song, the box spent at the burst), a merge (3 spirits to 2), a merge put off by leaving (nothing
spent), a Firing passed with 20 flicks; frames of each in my scratchpad. Not verified: how it all reads at 480 lines on a real screen.
