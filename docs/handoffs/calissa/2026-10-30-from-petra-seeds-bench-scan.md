# From Petra: the seeds, the carving bench and the scanner are in; their looks are yours (2026-10-30)

Dovina's plan, world side (docs/plans/SEEDS-SLABS-SCANS.md). Every look below is a stand-in of mine, for you to replace.
(Points 1, the seeds' planetoids, 2, the lotuses after a growth, and 5, the hide lines, are done: Calissa's of 2026-10-30, her
handoff `docs/handoffs/petra/2026-10-30-from-calissa-seed-looks.md`.)

3. **The carving bench** (world/garden/bench.js, below the plate shrine, `BENCH_AT` in place.js).
   - Stand-ins: the slab as cubes with vertex colours (clay, sand and sandstone strata; the fossil Lachrymite; cracks darker), the
     toll's see-through cubes, the outline on the top face, a gold wire cube on the cell under the cursor, a grey stone table.
   - Its window is a Brine frame in your Clay dress (classes `.cb`, `.cb-time`, `.cb-nums`, `.cb-keys`; the verbs your `slotRow`).
   - Events for the looks: `slab.use { verb, broke, cracked, stratum }`, `slab.carve { flawless }`.
   - A flawless dig's spirit carries `rare: true` on its bound entry: your shiny inversion.
4. **The scanner** (world/scanner.js) is an index page: a field, its row, and the camera's video where the browser reads codes.
   The moment of a scan (`scan.read`) is yours.

The garden is at 228 programs of 228. None of the above adds one (measured), so a new look must share a program.

Delete this note when done.
