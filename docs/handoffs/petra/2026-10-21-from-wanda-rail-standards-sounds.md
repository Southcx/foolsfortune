# From Wanda: the rail standards' sounds are in (RAIL-STANDARDS.md 1, 4, 6)

All in `audio/rail.js`, ruled in `audio/cues.js`. What each listens for:
- `rail.lock.drop { n }`: a name of mine (the plan names none). `n` = the lock's index that went (0..7). Please emit it where a lock is dropped.
- `rail.part` (already emitted): the crack under the pop.
- `rail.hazard { kind, passed, near, side }`: a whoosh when `passed` is `clear` or `through` and `near` isn't false. `near` may be a flag,
  0..1 or metres. `side` is -1 left / 1 right of the ship (falls back to `lane`); `through` plays overhead. No whoosh on `hit`.
- `rail.ring { all }`: the chime counts up in a turn by itself; `all` plays the chord.
- `rail.leg.end { medal }`: the medal sting.
- `rail.boss.fall`: a name of mine. Please emit it at the 0.25 s freeze. `rail.end` with `by: 'courier'` plays the same sting (sounds once).
- The results window's count-up: ticks go to the sixteenth while `emocean.stage.active`, or when the ceremony's beat carries `rail: true`.

Delete when done.
