**2026-10-07, from Petra: Round 1's bodies are in; what your looks can hang on**

The greybox stands; every piece is named or says itself on the bus. `/cavern` in the chat drops you straight into the bowl.
- **The bowl** (`src/world/well/bowl.js`, one group `well-bowl` at `BOWL_AT`): meshes `bowl-floor` (K.sand), `bowl-slip` (the rim shallows,
  `slipMaterial()`), `bowl-wall` (K.wall, roughened), `bowl-roof`, `bowl-ring` (the upper ring), `bowl-drapes` (the stalactites' rock roots),
  `lip-stone` (a stand-in for Round 2's Lip Stone). Pillars `pillar-1..6` (one mesh each: whole; `cracked` shrinks it 3%; fallen, the same
  mesh laid down as the log; rubble, a stump), stalactites `stal-1..8`, pools `pool-w0..w4` / `rim-w0..w4` (your DunemawMouth, small).
  Events: `bowl.spend { what: 'pillar' | 'log' | 'stal', state, i }` (a ram spent stone: your crack seams), `bowl.fall { what, i }`,
  `bowl.shake { i }` (a stalactite's 0.8 s shake before it drops), `bowl.pool { pool }` (the Courier put back out of a pool).
- **The FOE** (`src/creatures/jelly/greatjelly.js`): your urn crown on a class-2 slip jelly, cracked by `crack(stage)` and burst by
  `burst(dir)` on the real hits. The tell is `foe.scrape` (1 s; I lift the crown's `uFlash` toward 0.5 as it builds: replace with yours);
  then `foe.slam`, `foe.strike { move }`, `foe.sink { pool }`, `foe.rise { pool }` (1.2 s before it surfaces: the ring; `bowl.ring(i, s)`
  scales the pool's mouth meanwhile, a stand-in), `foe.surface`, `foe.break`, `foe.end { how }`.
- **The nursery** (`src/world/well/nursery.js`): a clutch is a group `clutch-<i>` of 3 to 6 egg spheres (`eggMaterial()`) on a slip dish;
  brood are slip jellies at 0.55 scale. Events `clutch.hatch`, `clutch.break`.
- **The finds** (`src/world/well/finds.js`): artifacts `artifact` / `artifact-warped` (an octahedron, `artifactMaterial(warped)`, spinning);
  the warp has a signature of kind `warp` for the Dreamvane.
- **The catch's looks**: the Lockheart's catch wheel is two sectors (free `0x5a4a62`, caught `0xb49be6`) put up over the Figment
  (`wheel.js` takes a `color` per rate now); the hand's catch (`src/godhand/catch.js`): `catch.grab`, `catch.free`, `spirit.bind`, and
  `god.catch.progress` (0..1 through the struggle) for the hand's grip and the Figment's look over the mouth.
- **The busker's mat** (`src/world/busk.js`, groups `busk-weir`, `busk-margarite`): a rug and an upturned hat, yours to make.
The warm-up compiles the rim's slip, an egg, an artifact and the urn crown (core and shards shown) with the floor prewarm.
Not verified: any of it on a GPU; the pillars' fallen pose at every bearing (driven at P1 and P2 only).
