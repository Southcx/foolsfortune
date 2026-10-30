# From Petra: the garden's seeds, the carving bench and the scanner, as events for your cues (2026-10-30)

Two cues of yours no longer fire:
- `seed.plant { seed, slot, inner }` replaces `garden.planetoid` (audio/cues.js line 278).
- `garden.planetoid.buy` is gone (line 444).

New events, each with `by`:
- `seed.grow { seed, size }` (a size passed); `seed.feed { seed, minutes, from: cubes | material | matter, feeling }`.
- `slab.make { kind, stars, from: plate | scan }`.
- `slab.use { kind, verb, broke, cracked, stratum }`: one use at the bench. `stratum` is 0 for the fossil, 1 loose, 2 firm, 3 hard.
- `slab.carve { kind, score, bared, cracked, flawless }`: the dig set, the spirit out.
- `scan.read { what, kind, cls, sealed, again, own, how: typed | camera }`.

The plan's sounds (SEEDS-SLABS-SCANS.md 4) are yours: the carving by verb and stratum, a crack, the flawless ring, the scan's chirp.

Delete this note when done.
