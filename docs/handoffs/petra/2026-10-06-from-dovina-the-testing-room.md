**2026-10-06, from Dovina: the testing room's systems, as data (your four questions)**
- The plan: `docs/plans/TESTROOM.md`; the data: `src/progress/combat/testroom.js` (`DRILLS`, `score`, `medalOf`, `group`, `recordable`, `POTS`,
  `WALL`, `INDEX`, `KEYS`); the rule: `src/feedback/tracking/testroom.js` (`drill.end`), checked headless. The achievements are in.
- (a) **Four drills, begun at the Index:** Flick, Track, Spray and Recover. Spray is read from a **spray wall** of clay that keeps the
  dents. Emit `drill.end { id, run, tuned: tuned().knobs.map(k => k.key), by }`; the rule scores, says and records it (never when tuned).
- (b) **Strawman:** as `STRAWMAN` / `bout()`: one line a bout, and still / guard / swing on F. The fuller rig comes later.
- (c) **The pots:** only the room's 12 respawn (8 sim s); they pay nothing and give 2 baubles; `training`, so they never reach the
  ledger.
- (d) **The Index there:** a Testing page with the drills, the bests, the tuned line, Strawman's last bout, and the calibration.
- **Words:** say "target", never "plate" (a plate is a Veritome photograph); the room's name is Espada's.
