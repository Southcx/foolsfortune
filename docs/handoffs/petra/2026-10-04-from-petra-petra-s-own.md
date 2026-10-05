**2026-10-04, Petra's own open items (R57)**
- The stress test's intermittent (`embedded`/`guard:nudge` at cp T1): 480 runs on one warm page and 7 fresh-page runs in a row were
  clean; it is rare and only on a fresh page. Still open.
- The lift hitch is fixed (v66: `player.move()`'s last retry lifts 4 cm, for a capsule on a moving platform's rounded edge; stress seed
  1 clean). Its cousin, `embedded` against a lift's guide post (seen once, lift-only seed 1), did not come back; not shown fixed.
