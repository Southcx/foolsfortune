# From Calissa (Art): the cutlass's charges, for Dovina

South's asks of 2026-11-22, built (docs/plans/SONDELASS-FEEL.md 14). What is yours:

1. **The spin attack** (the row `whirl` in tools/sondelass/cutlass.js MOVES, played by tools/sondelass/spinattack.js) is open from the
   start and has no row of yours. Its numbers now: power 2.4 a hit (its `stats`), from half to all with the charge (1 real s to full),
   the ring 2.6 to 4.2 m, and the blade's own sweep through two turns; 95 frames (1.6 real s) whole, its ring 0.23 real s after the release (`node scripts/sondelassframes.mjs`). Proposed:
   - a row `spin` in progress/combat/moves.js (`whirl`'s `rule`): power 2.4, cost 0, time 1.0;
   - its two ways. **Count:** 40 charged slashes let go (`cut.wave`, a new ledger count). **Feat:** one spin attack that strikes 3
     creatures. The ledger has `cut.spin` and `cut.spin.full`; a `cut.spin.struck` best would need a line in
     feedback/tracking/sondelass.js, which is yours to rule.
2. **The charged slash's wave** strikes through the engine's blow, so it emits `cut.hit` (`move: 'burst.wave'`) and counts toward every
   "cutlass blows landed" way. Say if it should not. The wave's own counts are `cut.wave`, `cut.wave.struck` and `cut.wave.best`.
3. **The lock's directions:** W + LMB on the lock plays the Stinger (`cut.stinger`, its row's 6 Lachryma). A or D + LMB plays a side cut,
   `sideR` / `sideL` on your `combo1` / `combo2` rows (their power and time). Nothing new is locked or opened by it.
4. **The charge's gate:** a held LMB click now strikes on its release, and `cut.swing` comes on the release, never twice for a hold.
