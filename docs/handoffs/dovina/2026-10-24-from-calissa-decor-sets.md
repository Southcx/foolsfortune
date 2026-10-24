# From Calissa (Art): three decor sets for the Spirit Garden, their looks built, their rows yours

The owner wants the art to flow, and the garden's decor to grow by sets. Twenty-four pieces are built in three sets of eight:
`src/vfx/garden/decorpieces/teahouse.js`, `kilnyard.js`, `stargazer.js`, registered in `decorpieces.js` (so `decorGeometry(id)` returns
each). None is in `DECOR` yet, so the decor layer does not draw them and the shed does not sell them: the rows below are proposals, yours
to rule, price and source. The sheet: `docs/plans/art/decor-sets.jpg` (each set on a planetoid at game noon and at dusk).

## What to add (four things)

1. **The sets** in `SETS` (`progress/decor.js`): `teahouse: { name: 'Teahouse' }`, `kilnyard: { name: 'Kiln Yard' }`,
   `stargazer: { name: 'Stargazer' }`. Each has one `centre` piece, so the set-finished bonus works as for the five feelings' sets.
2. **The rows** in `DECOR` (below).
3. **The set colours** in `SET_COLOR` (`world/garden/decorlayer.js`, Petra's file, or a `color` on each row if you would rather not touch
   it): `teahouse: 0x8fa070` (sage), `kilnyard: 0xc07848` (terracotta), `stargazer: 0x4f5d9a` (night indigo). The body takes the colour,
   the four `TINT`s vary it; stone, wood, brass and lamps keep their own.
4. Nothing else: the batch builds a geometry for every `DECOR` id at construction, so a row is enough for it to be placed and drawn.

## The rows (prices at `priceOf`: small 8, medium 24, centre 160 cubes, from `ECON.decor` x 8 a minute)

| id | set | label (plain; Espada's to rule) | line | size | cubes | opens (from) |
| --- | --- | --- | --- | --- | --- | --- |
| `teaPathStones` | teahouse | Tea Path Stones | Three stones and the rope-tied stop stone: the path goes no further. | small | 8 | shop, gift |
| `crouchingBasin` | teahouse | Crouching Basin | A low stone basin, a bamboo spout and a ladle. | small | 8 | shop, gift |
| `snowViewingLantern` | teahouse | Snow-Viewing Lantern | A wide-hatted lantern on three legs. Lit at dusk. | medium | 24 | shop, visitor |
| `bambooLatticeFence` | teahouse | Lattice Fence | Split bamboo in a lattice, tied in black rope. | small | 8 | shop, gift |
| `slabBridge` | teahouse | Slab Bridge | One arched stone over a rill. | medium | 24 | shop, wish |
| `teaBenchParasol` | teahouse | Tea Bench | A red-felt bench under a big parasol, tea set out. | medium | 24 | shop, visitor |
| `mossHillock` | teahouse | Moss Hillock | A domed bed of moss with a pruned pine. | medium | 24 | gift, wish |
| `bambooWaterPipe` | teahouse | Water Pipe | A bamboo pipe that fills, tips and knocks at its pond. | centre | 160 | lotus, wish |
| `woodPile` | kilnyard | Wood Pile | Split firewood under a little tiled roof. | small | 8 | shop, gift |
| `saggarStack` | kilnyard | Saggar Stack | Fireclay boxes stacked for the firing, one opened. | small | 8 | shop, gift |
| `tunnelKiln` | kilnyard | Tunnel Kiln | A long earthen kiln. Its mouth and stoke holes glow at night. | centre | 160 | lotus, wish |
| `potDryingRack` | kilnyard | Drying Rack | Boards of greenware drying in rows. | medium | 24 | shop, visitor |
| `clayPit` | kilnyard | Clay Pit | Wet clay, a spade, a wedged lump and a pail. | medium | 24 | shop, wish |
| `pottersWheel` | kilnyard | Potter's Wheel | A kick wheel, its head turning with a pot on it. | small | 8 | gift, wish |
| `potShardHeap` | kilnyard | Shard Heap | A heap of broken pots in every glaze. | small | 8 | shop, gift |
| `glazeDipBucket` | kilnyard | Glaze Bucket | A bucket of glaze, drips down its staves. | small | 8 | shop, visitor |
| `armillarySphere` | stargazer | Armillary Sphere | Brass rings turning slowly about the pole. | medium | 24 | shop, wish |
| `brassTelescope` | stargazer | Telescope | A brass refractor on a wooden tripod. | small | 8 | shop, gift |
| `gardenSundial` | stargazer | Sundial | A stone pillar with a brass dial. | small | 8 | shop, gift |
| `starChartTable` | stargazer | Star-Chart Table | A chart spread under a lantern. Its stars light at dusk. | medium | 24 | shop, visitor |
| `crescentMoonGate` | stargazer | Crescent Gate | A round gate with a crescent moon hung in it. Lit at dusk. | medium | 24 | gift, wish |
| `glassOrbStakes` | stargazer | Glass Orbs | Glass orbs on iron stakes. Lit at dusk. | small | 8 | shop, gift |
| `meteorStone` | stargazer | Meteor Stone | A fallen stone, its cracks still warm. Glows at dusk. | small | 8 | gift, visitor |
| `constellationPavement` | stargazer | Constellation Pavement | A round paving inlaid with a star chart. Its stars light at dusk. | centre | 160 | lotus, wish |

Each set costs 160 + 24 x n(medium) + 8 x n(small): Teahouse 280, Kiln Yard 248, Stargazer 264 cubes; 792 for all three (99 minutes of
play at the aim). Whether that sits with the catalogue's three-hour target (`scripts/garden-cozy.mjs` prints it) is your call.

## Things to rule or know

- **Names that brush the glossary.** "Teahouse" sits beside Tea Garden (desire) and its Tea House piece, and the desire set already has a
  stone lantern, moss mound and floor cushion: the owner asked for a teahouse set by name, so I kept the ids distinct (`snowViewingLantern`,
  `mossHillock`, `bambooLatticeFence`, `slabBridge`), but a set name other than "Teahouse" (Tea Path? Roji, once lore is allowed) would read
  better. `tunnelKiln` qualifies "kiln" (the kiln is the workshop's); `potShardHeap` qualifies "shard"; `glazeDipBucket`'s label "Glaze
  Bucket" uses "glaze" in its everyday sense (the Courier's glaze is a homonym): Espada's to rule. `crescentMoonGate` avoids the Koi Pond's
  Moon Gate.
- **What moves** (kit.js `MOTION`, in the shared decor material's vertex shader, no new program, no new light): the Water Pipe tips and
  knocks every 6 real seconds; the Potter's Wheel's head turns; the Armillary Sphere's inner rings turn on the pole. **What glows** (the
  lamps' dusk path, `gardenMood.now.lamps`): the lantern, the kiln (wavering), the chart's stars, the gate's crescent, the orbs, the
  meteor's cracks, the pavement's stars. A sound for the knock, the wheel and the kiln is Wanda's, if you want one (`decor.place` carries
  the id).
- **Until the rows land**, there is no `/decor` chat command to place a piece in the DEBUG save (grep found none). The quickest test: add
  the rows, then `game.decor.give('tunnelKiln')` in the console, and place it from the shed in PLACE (9, R to decor). A DEBUG
  `game.chat.add('decor', { debug: true, run: ([id]) => game.decor.give(id, 'gift') })` in `main.js` would do it for the owner.
- **Triangles**: the new pieces average 916 a piece (the 47 before, 545); the largest, the drying rack at 1850 and the pavement at 1952,
  under one draw call with the rest. Measured at the gate if it matters.
