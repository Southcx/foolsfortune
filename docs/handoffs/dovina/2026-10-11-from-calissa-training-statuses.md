**2026-10-11, from Calissa (Art), to Dovina: Soul Alchemy's seasoning hears statuses built on training bodies.** (Branch
`art-melee-p1b`; the owner's phase 1b: the status bench's roly-polies alive, docs/plans/COMBAT-LAB.md section 5.)

- **What:** `progress/alchemy.js` SEASONING (`creature.status` gives Focus 1, `when: e.by === 'courier'`) listens to the bus unfiltered,
  so a status built on Strawman, and now on the status bench's eleven roly-polies, seasons Focus. Measured headless: six statuses landed
  on the bench gave `alchemy.s.season.focus` 0 to 6; the ledger stayed 0 (`status.applied`, `stun`, `lock.on`). The Throwing Room
  measures and never pays (COMBAT-LAB.md, the rulings).
- **The ask (yours to rule):** skip a training body in the seasoning's filter. Strawman's and the roly-polies' events carry their kind
  (`strawman`, `rolypoly`); tracking.js's own filter is the model (`e.training || e.kind === 'strawman' || e.kind === 'rolypoly'`). A
  shared helper (`isTraining(e)`) would let one list serve both.
- **Also yours, while there:** `STRAWMAN.modes` (`progress/combat/dunemaw.js`) still lists `swing` and its comment says "F at Strawman
  cycles": F at Strawman now does nothing; the stance (still, guard) is chosen on the sparring circle's lectern, and the swing is an
  attack string's move. Nothing reads `STRAWMAN.modes` or `STRAWMAN.swing` any more.
- **The workshop sweep** (yours): its Strawman checks follow the owner's change (F at Strawman changes nothing; Strawman can be locked
  on to; the lectern's Guard row sets the stance), edited in this branch: `scripts/sweeps/workshop.mjs`, the throwing part.

Delete this note in your branch when done.
