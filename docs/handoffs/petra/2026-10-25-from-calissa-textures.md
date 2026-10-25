# From Calissa (Art): the resolution pass, your textures as I saw them, and one ask

The pass is in `docs/plans/art/texture-budget.md`: ours at High went from 114.1 to 54.9 MB (-52%), and at Low from 114.1 to 51.7 MB
(-55%). The sheet is `docs/plans/art/texture-cuts.jpg`. Measured headless at High, with every GL allocation hooked (exact levels and
formats), over the workshop, the hub, the Throwing Room, the Dunes, the Raceway, the bazaar, the Dunemaw's third floor, the garden, the
god hand and the showcase crossing. The base was your a2476c6 merged into my branch. None of the files below was touched.

## Yours, seen on the route (High, MB on the GPU, biggest first; 74.6 MB in all, the GLTF effect textures excluded: those were mine)

| MB | count | made by | size, format | zone |
| --- | --- | --- | --- | --- |
| 20.42 | 49 | `world/basement/basement.js` (the labels, baked) | 512 x 160 RGBA8, mips | basement, workshop, dunes, bazaar |
| 9.37 | 3 | `render/glow.js` | 853 x 480 RGBA16F | (targets) |
| 5.33 | 1 | `courier/character/bodymaterials.js` (the Courier's body) | 1024 x 1024 sRGB, mips | everywhere the Courier is |
| 4.41 | 1 | `tools/sondelass/angling/weir.js` | 1400 x 620 RGBA8, mips | dunes |
| 4.00 | 2 | `world/ground/trailmap.js` | 512 x 512 RGBA16F | (targets) |
| 4.00 | 1 | `world/ground/paintwalls.js` | 1024 x 1024 RGBA8 | (data) |
| 4.00 | 1 | `world/ground/paintwalls.js` | 1024 x 1024 R32F | (data) |
| 4.00 | 1 | `boot/warmup.js` (a 1024 target, kept after the warm-up) | 1024 x 1024 RGBA8 | (target) |
| 3.33 | 1 | `world/basement/course.js` | 1024 x 640 RGBA8, mips | basement |
| 1.33 | 1 | `courier/character/bodymaterials.js` | 512 x 512 sRGB, mips | everywhere the Courier is |
| 1.00 | 3 | `render/triplanar.js` | 256 x 256 sRGB, mips | |
| 0.78, 0.39, 0.10 | 5 | `render/glow.js` (the bloom chain) | 426 x 240 .. 106 x 60 RGBA16F | |
| 0.50 | 1 | `world/ground/paintmap.js` | 256 x 256 RG32F | |
| 0.33 | 1 | the Lantern Wisp's atlas (glTF) | 256 x 256 sRGB, mips | dunes |
| 0.25 | 1 | `world/ground/paintmap.js` | 256 x 256 RGBA8 | |
| 0.23 | 26 | `render/propbatch.js` | 24 x 24 RGBA32F | |
| under 0.1 each | about 30 | `render/shardbatch.js`, `world/level.js`, `world/props/*`, `world/garden/*`, `feedback/cartography.js` | | |

Three that look like cuts, for you to judge. Not measured beyond their bytes:
- `boot/warmup.js:63`, a 1024 x 1024 RGBA8 target (4 MB) still alive at the crossing. If it is only the warm-up's, it can go after it.
- `paintwalls.js`: the R32F half at 1024 x 1024 (4 MB). An R16F, or 512, would halve or quarter it.
- `weir.js:203`: a 1400 x 620 canvas with mips (4.4 MB) in the Dunes. At half it is 1.1 MB.

## The ask: a knob for textures, not only labels

I read `T.visual.labelScale` in three of mine as the tier's texture fraction: the Sight's disc atlas (`vfx/sight.js discScale`), the
particles' atlas (`vfx/sprites.js`), and nothing else. Its name and its comment in `render/graphics.js` say "baked labels". Either widen
its comment to "baked canvases' and atlases' resolution", or add a `textureScale` beside it (High 1, Low 0.5, Minimum 0.5) and I will
read that instead. I did not edit graphics.js. Both are read once at build, as `labelScale` is.

## What the areas pass should know

- `game.areas.stats()` before and after, at High: the bazaar's 37.2 -> 19.2 MB, the Dunes' 29.6 -> 21.2. The basement's and the
  Raceway's are unchanged (69.1, 56.3): they are your labels and geometry. The workshop's reads 29.6 -> 31.6 at High (on Low 32.8 ->
  30.1). I have not traced that +2.
- **Newly baked**, so repainted when their area comes back: the ashlar (51 ms headless), the stele's face (8 ms), the sandstone
  tile, the clay glaze (2 ms), the effect meshes' textures and a feeling's sky (a drawImage each). The house atlas's repaint went from
  124 to 99 ms. Its cost is the drawing, not the pixels. I did not see your 3 s: this probe times the paint alone, not the upload and
  its mips.
- **The glitch** now lets its two 853 x 480 half-float targets go after 3 real seconds still, and makes them again at the next tear (6.25
  MB). In the crossing the storm's veil keeps them.
- **A feeling's sky** that has faded out is disposed, and loaded again (its module is cached) if its weather falls again.

Verified: `npm run check` and `npm run build`; the route above boots and walks without a page error at High and Low (the console shows
one 404 for a resource, not traced). Not verified: a real phone; the reading table's DOM cards by eye (painted by `cardFace` now, the
same painter at the same size); the instrument skins' raku and wood layers on the smaller disc atlas (drawn in the 1024 atlas's units
now, so their scale is kept), not looked at.
