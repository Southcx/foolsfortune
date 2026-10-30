# From Petra: the seeds, the carving bench and the scanner are in; their looks are yours (2026-10-30)

Dovina's plan, world side (docs/plans/SEEDS-SLABS-SCANS.md). Every look below is a stand-in of mine, for you to replace.

1. **The seeds' planetoids** (world/garden/orbit.js). A ring seed grows from a moonlet (5 m) to large (20 m) in place.
   `site.regrow(P, r)` makes a new `Planetoid` at the new radius.
   - Stand-ins: bone wears your `fossils` look, crystal `moon`, coral `koi` (your BOUGHT_LOOKS); clay, bowl and ring a palette over
     the plain ground; the inner ring's moonlets their feeling's colour (orbit.js `paint`).
   - Re-key `vfx/garden/boughtplanetoids.js` to the seeds' kinds (`SHAPES` in progress/seeds.js: clay, crystal, coral, bowl, ring,
     bone, moonlet) and drop `drills`. Then I delete STAND_IN.
   - A large planetoid's own moon is a small stand-in `Planetoid` (orbit.js `ownMoon`).
   - The pour of matter onto a seed (GRAB held) shows only the sculpt brush's ring. A stream of matter falling from the hand is
     yours. `realm.orbit.pouring` is `{ id, m3 }` while it pours.
2. **Your flowers after a growth.** I set `game.launchLotuses.count = -1` so they stand again on the new ground (realm.js `regrow`).
   Listen for `seed.grow` yourself and I drop that line.
3. **The carving bench** (world/garden/bench.js, below the plate shrine, `BENCH_AT` in place.js).
   - Stand-ins: the slab as cubes with vertex colours (clay, sand and sandstone strata; the fossil Lachrymite; cracks darker), the
     toll's see-through cubes, the outline on the top face, a gold wire cube on the cell under the cursor, a grey stone table.
   - Its window is a Brine frame in your Clay dress (classes `.cb`, `.cb-time`, `.cb-nums`, `.cb-keys`; the verbs your `slotRow`).
   - Events for the looks: `slab.use { verb, broke, cracked, stratum }`, `slab.carve { flawless }`.
   - A flawless dig's spirit carries `rare: true` on its bound entry: your shiny inversion.
4. **The scanner** (world/scanner.js) is an index page: a field, its row, and the camera's video where the browser reads codes.
   The moment of a scan (`scan.read`) is yours.
5. **Your two hide lines now find nothing.** place.js no longer builds the lotus cones or the torii (`mats.torii` is gone,
   `mats.lotus` stays for the seed in the hand). Drop the lines in LaunchLotuses and FacilityLooks when you pass.

The garden is at 228 programs of 228. None of the above adds one (measured), so a new look must share a program.

Delete this note when done.
