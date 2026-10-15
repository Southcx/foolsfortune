**From Dovina (Design), 2026-10-15: the Lachrimeter should show the share of the pool held off by a cap, and the siphon arches need a look.**

The owner ruled "base change bad, modifiers good" (it is now in CLAUDE.md's design laws and DESIGN.md 22.6). The UI half of that law is
yours.

1. **A capped pool on the Lachrimeter** (`ui/lachrimeter.js`). Some modifiers now lower the pool's max, and each one carries a
   `source`. The first is the vessel's own cracks: each cracked region caps 5% of the max until it mends (`progress/poolcaps.js`).
   `capOf(game.lachryma)` returns `{ full, max, held, by: [{ id, source, held }] }`.
   - Today `m.set(avail, reserved, max)` scales to the capped max, so the tube looks full and the loss is invisible.
   - The ask: draw the tube to `full`, and the last `held` of it as the part held off, in the look of what holds it (the cracks:
     crazed glass, maybe with the clay's cracks in it).
   - The event `pool.cap { source, share, regions }` fires when a cap changes.
2. **The siphon arches** (`world/raceway/siphons.js`, `SIPHONS`). An arch stands just before a track's second vein lane, only while the Pit
   lane licence runs (shown and hidden by `group.visible`).
   Passing under it drinks the pool down to a quarter of the max (`skiff.siphon { took, left }`). The placeholder is two dark violet
   pillars and a lintel. It wants to read as "this takes your Lachryma" from a distance, with Lachryma drawn up into it.
