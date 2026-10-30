# From Dovina: the garden's seeds, slabs and scans (South's asks, by Calissa): the world side is yours

The rules, numbers and check are in (`docs/plans/SEEDS-SLABS-SCANS.md`; `progress/seeds.js`, `slabs.js`, `scans.js`;
`node scripts/gardengrowth.mjs`, all PASS). Myggdrasil is now given on the first visit (`ECON.myggdrasil.firing` 0): your
`gardenMycelium.give()` needs nothing more.

1. **The ring takes seeds** (orbit.js):
   - A seed is a predicate over the ledger. Tracking writes `seed.earn.<id>` once (`tracking/gardengrowth.js`). Give each one so
     written that is not yet placed: into the hand as now, or waiting in the shed.
   - Set `realm.orbit.seeds = true` when it does; the log only says a seed is earned once that flag exists.
   - It starts a moonlet (`SIZES[0]`). Feeding at the shed or by the hand's Pour grows it (`feedOf`, `sizeOf`; matter capped at
     `MATTER_FEED.dayCap` minutes a game day), and its tint comes from `tintOf`.
   - The seven moonlets (`SEEDS['moonlet.<f>']`, `inner: true`) go on an inner ring round the Dantian and are never fed.
   - Emit `seed.plant { seed, slot }` and `seed.grow { seed, size }`.
   - Retire the shed's sale, `BOUGHT`, `ECON.place.planetoids` and `ECON.place.planetoidFiring` (tell me and I drop the ECON rows).
   - Shapes beyond the sphere (`SHAPES[kind].body`) are yours to price; spheres first.
2. **The carving bench**:
   - A plate becomes a slab in the Pneuka Box (`newSlab({ kind, stars })`), in place of the Athanor's one-step awakening.
   - The bench meshes `slab.cells` (your `godhand/voxels.js`). Each tool out calls `carve(slab, verb, cell, dir)`.
   - The slab sets at `secondsOf(stars)`. Then `scoreOf` gives the score, and `spiritOf(score, stars)` the spirit's class, bond, stat
     share and rare look.
   - Emit `slab.make { kind, stars, from }` and `slab.carve { kind, score, bared, cracked, flawless }`.
3. **The scanner**:
   - On a phone, the camera (`BarcodeDetector`, or a small decoder; iOS has none) reads the code. On the desk, `/scan <digits>`.
   - `scanResult(text, { seen, today, met })` judges it. Keep `seen` (hash to times) and the game day's count in the save.
   - `met` is the kinds photographed. A sealed slab waits in the Box until its kind is met.
   - Emit `scan.read { what, kind, cls, sealed, again, own }`.
   - Whether you take a decoder dependency is yours.

Delete once built.
