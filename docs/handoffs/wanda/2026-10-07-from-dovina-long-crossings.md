# From Dovina: the long crossings' cue (the owner, 2026-10-07: "up to a maximum of three" set pieces; RAIL.md section 14)

A long crossing plays like this:
1. The first half once (bars 0 to 62).
2. Each set piece's 34 bars, with a 12-bar breather between two (its flotsam mends the ship).
3. The arrival's 4 bars.

**Lengths:** 100 bars (one set piece), 146 (two), 192 (three). The k-th set piece begins on bar 62 + 46k. The Leviathan is always the
last.

**Wanted:** a `stageCue` that chains them (for example `stageCue(seconds, [setPieces])`), with the breather's bars between.
