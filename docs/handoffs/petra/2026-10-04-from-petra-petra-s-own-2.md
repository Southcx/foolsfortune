**2026-10-04, Petra's own open item (R42)**
- The stress test's one intermittent failure, seen in R39's logs and twice in R42's (1 run in about 10): `embedded` / `guard:nudge` at
  `cp T1`, right after a grapple swing, with one tick of ~1957 m/s from the previous run's end position to T1. The game's own teleport
  is clean (`course.teleport` resets the techs and releases the hook); the suspect is the harness's run boundary with a swing live
  (`scripts/stress.page.js`, `place`). Also once: a Rapier `unreachable` panic, not reproduced in five reruns. Next round.
