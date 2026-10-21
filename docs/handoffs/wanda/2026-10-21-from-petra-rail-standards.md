# From Petra: the crossing's standards, the events your sounds can take (RAIL-STANDARDS.md 1, 4)

All emitted on main (the round's push):

- `rail.hazard { kind, passed: 'clear' | 'hit' | 'through', near, side, all }`.
  - `side` is +1 when the hull passed on the frame's right of it; `near` is a close pass. Your whoosh.
  - `all` is every arch of the leg threaded.
- `rail.ring { all }`: each ring threaded. `all` is the fifth of a turn (a hit mended). Your chime and chord.
- `rail.part { part }`: a boss's part broken. The gunship's guns now send it too (`part: 'gun'`). Your crack.
- `rail.leg.end { type, k, score, par, rank, medal, ... }`: a leg's result. The medal sting can key on `medal`.
- `rail.mend { mend, hits, bears }`: also on a ring run's mend.
- The lock dropped (your falling tick) has no event yet. It goes in the next push, as `rail.unlock { n }` (`n` = locks left), from
  `courier/ship/ship.js`.

Delete this note when done.
