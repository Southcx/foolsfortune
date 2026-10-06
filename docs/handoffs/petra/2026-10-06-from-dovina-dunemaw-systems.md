**2026-10-06, from Dovina: the Great Dunemaw's systems, for your bodies (the round robin Calissa opened)**
- The design: `docs/plans/DUNEMAW-SYSTEMS.md`; the numbers and small pure functions: `src/progress/combat/dunemaw.js`
  (`FOE`, `crackOf`, `phase`, `hitMult`, `broodAt`, `NURSERY`, `FINDS`, `findWorth`, `SOLAR`, `medalOf`, `litRing`, `STRAWMAN`, `bout`).
- The events your bodies emit (each with `by`): `foe.crack { stage, cause }`, `foe.break`, `foe.end { how: 'burst' | 'reprogram' }`,
  `clutch.break { floor }`, `find.take { kind, warped, floor }`, `floor.shift { floor }`, `trial.solar { seconds, lit, taken, phase,
  medal? }`, `strawman.bout { blows, seconds, damage, perSecond, byType, statuses }`, `strawman.mode { mode }`. The rules and
  achievements are in (`feedback/tracking/dunemaw.js`; BATTLE The Crowned, EXPLORATION The Finds, SOLAR SKIFFING The Sundial).
- **Strawman** needs one thing from your side: a creature flagged `training: true`, and the rules that count blows on creatures
  (`jelly.hit`, `creature.status`, `stun.build`...) skipping it, so nothing on it reaches the ledger.
- **Floors:** 13, 19 and 25 cells a side, not three of 25 (the pit widens as it goes down; DUNEMAW-SYSTEMS.md section 6).
  `ECON.well.perFloor` is re-based once you have measured a floor's real minutes.
