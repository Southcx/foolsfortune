# Calissa's textures: the budget (the resolution pass, 2026-10-25)

The target is an iPhone XR (3 GB; Safari kills a tab long before that). The owner: "We can live with low resolution!" This page is every
texture Calissa's files make or load (`src/vfx/`, `src/ui/`, and the assets we paint: the skies, the atlases, the house deck, the
effect meshes' textures), what each costs on the GPU, and what the pass cut. Petra's textures (`src/render/`, `src/world/`, the
basement's labels) are listed in `docs/handoffs/petra/2026-10-25-from-calissa-textures.md`, and were not touched. The five biggest
visual cuts, before and after: `docs/plans/art/texture-cuts.jpg`.

## How it was measured

Headless Chromium (SwiftShader), the dev server, `?graphics=high` (and `low` for the second row), the clock held at perf's calm game
noon. A probe imported before the game's modules records each `THREE.Texture`'s creation stack, so its maker is the first frame in
`src/` that is not `render/bakedcanvas.js`. A hook on WebGL2's `texStorage2D`, `texImage2D`, `generateMipmap` and `deleteTexture`
records what the GPU actually allocated: width, height, internal format and every mip level. The bytes are exact: w x h x bytes a
texel, x 4/3 with mips, x 6 for a cube.

The route: the workshop, the basement's hub, the Throwing Room, the Dunes, the Raceway, Raku's Bazaar, the Great Dunemaw's third
floor, the Spirit Garden, the god hand in the Dunes, and the showcase crossing. At each place: 90 ticks and 30 draws, then every live
GL texture is read. A texture's zone is the render zone of every scene root whose materials hold it (`overlay` for the overlay's
scene). A texture held by nothing in a scene when it is read is marked with the place it was first uploaded at.

The probe is a scratch tool, not in the repo; it can come in under `scripts/` if Petra wants it at the gate. It measured the merge of
Petra's areas, stage 1 (to a2476c6), into `claude/calissa-art-cups`: before is that merge, after is this commit. One host, one run each.

## Totals (MB on the GPU, ours only)

| tier | every texture of ours made on the route (a render target made again counted once) | the route's union (made again, counted again) | the most alive at once (the worst place) |
| --- | --- | --- | --- |
| High | 114.06 -> **54.94** (-52%) | 117.18 -> 64.31 (-45%) | 90.59 (the bazaar) -> 45.82 (the crossing) (-49%) |
| Low | 114.10 -> **51.71** (-55%) | 116.27 -> 58.22 (-50%) | 91.59 -> 41.63 (-55%) |

### Alive at each place (ours High, ours Low, everything High), MB

| place | ours, High | ours, Low | all textures, High |
| --- | --- | --- | --- |
| workshop | 63.93 -> 37.36 | 64.93 -> 35.08 | 114.97 -> 88.40 |
| basement | 63.93 -> 37.36 | 64.93 -> 35.08 | 114.97 -> 88.40 |
| throwing room | 64.16 -> 37.59 | 65.16 -> 35.31 | 115.21 -> 88.64 |
| dunes | 70.09 -> 39.08 | 71.09 -> 36.80 | 127.98 -> 96.96 |
| raceway | 70.22 -> 39.21 | 71.22 -> 36.93 | 128.11 -> 97.09 |
| bazaar | 90.59 -> 41.57 | 91.59 -> 39.29 | 132.57 -> 83.56 |
| well | 90.46 -> 41.44 | 91.46 -> 39.16 | 132.48 -> 83.46 |
| garden | 69.93 -> 43.36 | 69.03 -> 39.17 | 105.34 -> 78.77 |
| godhand | 79.97 -> 39.97 | 79.06 -> 37.69 | 122.21 -> 82.21 |
| crossing | 78.39 -> 45.82 | 77.48 -> 41.63 | 113.80 -> 81.23 |

### By area (`game.areas.stats()`, the most MB an area had evicted along the route: Petra's estimate, textures and geometry)

| area | High | Low |
| --- | --- | --- |
| workshop | 29.6 -> 31.6 | 32.8 -> 30.1 |
| testroom | 4 -> 4 | 4 -> 4 |
| basement | 69.1 -> 69.1 | 29.4 -> 29.4 |
| circuits | 4.3 -> 4.3 | 1.2 -> 1.2 |
| dunes | 29.6 -> 21.2 | 28 -> 19.6 |
| raceway | 56.3 -> 56.3 | 56.3 -> 56.3 |
| bazaar | 37.2 -> 19.2 | 35 -> 17 |
| margarite | 0.2 -> 0.2 | 0.2 -> 0.2 |

The basement's and the Raceway's are Petra's labels and geometry. Our cuts there are the effect meshes and the overlay, which the area
pass does not count (the overlay is never evicted). The workshop at High reads 2 MB more after, and I have not traced why: its figure is
what was evicted when the probe stood elsewhere, and on Low it reads 2.7 MB less.

## The cuts (High, MB on the GPU; the biggest first)

| # | what | before | after | how |
| --- | --- | --- | --- | --- |
| 1 | the house atlas (`vfx/bazaarfaces.js`) | 24.00 | 6.00 | baked at half (1024 x 1152): a card painted in its 64 x 104 frame lands at 1x, not 2x. The reading table paints a card alone at full size (`cardFace`) instead of cropping the atlas, and no longer paints the whole atlas to crop one. |
| 2 | a feeling's sky (`vfx/sky.js`) | 16.00 (two loaded on the route, kept forever) | 2.00 | drawn at 1024 x 512, the owner's paintings' size; one kept: a sky faded out is let go, and loaded again if its weather falls again |
| 3 | the effect meshes' textures (`vfx/meshfx.js`, `src/assets/vfx/*.glb`) | 10.67 | 2.67 | eight 512s drawn at 256 at load (baked); the glTF's own texture let go |
| 4 | the stele and its stones (`vfx/ostracon.js`) | 11.39 | 2.86 | the ashlar 960 x 840 -> 480 x 420 (200 texels a metre), the stele's face 640 x 1120 -> 320 x 560, the sandstone tile 640 x 560 -> 320 x 280 (x2); all baked |
| 5 | the Sight (`vfx/sight.js`) | 11.07 | 2.95 | the discs' atlas and its bumps 1024 x 656 -> 512 x 328 (256 x 164 on Low); the dial, the phase plates and the rete 512 -> 256 |
| 6 | the glitch's history (`vfx/glitch.js`) | 6.25 always, once it had torn | 6.25 only while it tears or the veil is up | its two half-float targets let go after 3 real seconds still |
| 7 | the sky's PMREM (`vfx/sky.js`) | 6.00 | 1.50 | filtered from a 512-wide copy: a 128 face, not 256 |
| 8 | the Lachrimeter's tube and the instruments' env (`vfx/lachrimetertube.js`) | 5.13 | 1.85 | the still body's atlas 544 x 1024 -> 272 x 512; both instruments' PMREMs from a 256-wide copy (a 64 face) |
| 9 | the clay glaze (`vfx/cradlelook.js`: the cradle, the Shrine gate's clay and sill) | 4.00 | 1.00 | baked at 256 |
| 10 | the particles' atlas (`vfx/sprites.js`) | 2.67 | 2.67 (High), 0.67 (Low) | at the tier's `labelScale` |

### Tied to the graphics tier

The Sight's disc atlas and the particles' atlas read `T.visual.labelScale` (1 on High, 0.5 on Low and Minimum). Everything else is cut
on every tier: at the 480-line present, each still covers its lines at 1:1 or better (the numbers are below), so High gains nothing by
keeping more.

### Mipmaps

None was dropped. The overlay's instruments are 150 to 190 lines tall, so their textures are minified 2 to 8 times. Without mips they
would crawl, against the rule on aliasing. The tube's atlas already had none; at half size it minifies less, so it crawls less.

### Why each holds at 480 lines (the numbers)

- **The house atlas**: a card on the table view is about 80 lines tall; its cell is now 104. The reading view's orbiting cards are
  about 100. The Pneuka Box's reading table (the page, at device pixels) is painted alone at 128 x 208, as before.
- **A feeling's sky**: a 70-degree view across 853 columns wants 4,390 texels round the sky for 1:1. The 2048 painting was already
  magnified 2.1 times; at 1024 it is magnified 4.3 times, the same as the owner's own three paintings it comes in over.
- **The ashlar**: a wall a stride away shows about 160 lines a metre; 200 texels a metre still covers it.
- **The stele's face**: 0.8 x 1.4 m, read up close at most about 400 lines tall; the face is 560.
- **The Sight**: the dial is about 98 lines across (its texture 256), and a disc's face is about 60 (its cell 256 on High, 128 on Low).
- **The tube**: its scale plate covers about 120 lines; the plate's rows are now 512.

## Repainting (a baked canvas paints itself again when its area comes back, behind the load's cover)

Measured in the page: a baked canvas's pixels asked for again, timed, and let go again (real ms, headless, one run each).

| canvas | before | after |
| --- | --- | --- |
| the house atlas | 124.4 (2048 x 2304) | 98.7 (1024 x 1152) |
| the ashlar (newly baked) | (never repainted; its 960 x 840 canvas was kept) | 51.3 |
| your stones' atlas (`bazaarfaces.js` stoneAtlas, unchanged) | 2.1 to 5.6 | 12.1 (a noisy reading) |
| the stele's face (newly baked) | (kept) | 8.2 |
| the particles' atlas | 2.7 | 2.9 |
| the clay glaze (newly baked) | (kept) | 1.9 |

The house atlas's paint is bound by its drawing (78 cards of vector work), not its pixels: halving them saved a fifth of the time.
Petra's "about 3 real s" is not what this probe sees (0.1 s). Hers likely includes the upload and its mips, or a slower host. Newly
baked canvases trade the CPU copy they held (the ashlar's 3.2 MB, the stele's 2.9 MB) for a repaint on re-entry, the ashlar's 51 ms the
largest.

## Left as they are, and why

- **The urn crown's crack mask** (`vfx/urncrown.js`, 512, 1.33 MB): a 1-pixel crackle web; at half it would fade or alias on the
  Great Slip Jelly's crown, seen close.
- **The owner's three skies** (`sky.js`, 1024 x 512 each, 6 MB): the owner's paintings, already magnified 4 times at 480 lines.
- **The liquid packs, the water normal, the filigree, the Pneuka Jar's paint, the vfx PNG** (512 images, 1.33 MB each): shipped
  images, tiled in metres or worn on a body seen close. Cutting them means shipping copies; they were not worth it this round.
- **Your stones' atlas and its glow** (`bazaarfaces.js`, 512 each, 2.67 MB): cut from the house atlas the round before. At half, the
  flee's d20 thrown before the board would read soft.
- **The glitch's targets while it tears**: they are the frame's size; at half, the storm's veil would soften the whole frame.

## The inventory (ours, High; MB before and after, biggest first)

The maker's line is before the pass. "gone" means no texture of that file and role was alive after; "new" means one was not there
before.

| # | MB before | MB after | size | format | mips | kind | made by | zone |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 24.00 | 6.00 | 2048 x 2304 -> 1024 x 1152 | SRGB8_A8 | yes | baked | `src/vfx/bazaarfaces.js:157` | bazaar |
| 2 | 8.00 | 2.00 | 2048 x 1024 -> 1024 x 512 | SRGB8_A8 | no | image | `src/vfx/sky.js:107` | every zone |
| 3 | 6.00 | 1.50 | 768 x 1024 -> 384 x 512 | RGBA16F | no | target | `src/vfx/sky.js:138` | workshop, basement, bazaar .. |
| 4 | 4.10 | 1.03 | 960 x 840 -> 480 x 420 | SRGB8_A8 | yes | canvas | `src/vfx/ostracon.js:66` | dunes |
| 5 | 3.65 | 0.91 | 640 x 1120 -> 320 x 560 | SRGB8_A8 | yes | canvas | `src/vfx/ostracon.js:66` | dunes |
| 6 | 3.42 | 0.85 | 1024 x 656 -> 512 x 328 | SRGB8_A8 | yes | canvas | `src/vfx/sight.js:340` | overlay |
| 7 | 3.42 | 0.85 | 1024 x 656 -> 512 x 328 | RGBA8 | yes | canvas | `src/vfx/sight.js:357` | overlay |
| 8 | 3.12 | 3.12 | 853 x 480 | RGBA16F | no | target | `src/vfx/glitch.js:197` | (garden, not in a scene) |
| 9 | 2.67 | 2.67 | 1024 x 512 | RGBA8 | yes | baked | `src/vfx/sprites.js:100` | every zone |
| 10 | 2.13 | 0.53 | 544 x 1024 -> 272 x 512 | SRGB8_A8 | no | canvas | `src/vfx/lachrimetertube.js:69` | overlay |
| 11 | 2.00 | 2.00 | 1024 x 512 | SRGB8_A8 | no | image | `src/vfx/sky.js:118` | basement, dunes, raceway |
| 12 | 2.00 | 2.00 | 1024 x 512 | SRGB8_A8 | no | image | `src/vfx/sky.js:124` | every zone |
| 13 | 2.00 | 2.00 | 1024 x 512 | SRGB8_A8 | no | image | `src/vfx/sky.js:124` | every zone |
| 14 | 1.82 | 0.46 | 640 x 560 -> 320 x 280 | SRGB8_A8 | yes | canvas | `src/vfx/ostracon.js:351` | dunes |
| 15 | 1.82 | 0.46 | 640 x 560 -> 320 x 280 | SRGB8_A8 | yes | canvas | `src/vfx/ostracon.js:66` | dunes |
| 16 | 1.50 | 0.66 | 384 x 512 -> 336 x 256 | RGBA16F | no | target | `src/vfx/lachrimetertube.js:174` | overlay |
| 17 | 1.50 | 0.66 | 384 x 512 -> 336 x 256 | RGBA16F | no | target | `src/vfx/lachrimetertube.js:174` | overlay |
| 18 | 1.33 | 1.33 | 512 x 512 | SRGB8_A8 | yes | baked | `src/vfx/bazaarfaces.js:94` | basement, workshop, garden |
| 19 | 1.33 | 1.33 | 512 x 512 | SRGB8_A8 | yes | baked | `src/vfx/bazaarfaces.js:100` | basement |
| 20 | 1.33 | 1.33 | 512 x 512 | RGBA8 | yes | image | `src/vfx/filigree.js:32` | (boot, not in a scene) |
| 21 | 1.33 | 1.33 | 512 x 512 | SRGB8_A8 | yes | image | `src/vfx/vessoulpaint.js:26` | workshop, garden |
| 22 | 1.33 | 1.33 | 512 x 512 | RGBA8 | yes | image | `src/vfx/liquid.js:47` | dunes, well, workshop .. |
| 23 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement |
| 24 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement |
| 25 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement, workshop |
| 26 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement, workshop |
| 27 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement |
| 28 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement |
| 29 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement |
| 30 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/meshfx.js (src/assets/vfx/*.glb)` | basement |
| 31 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/cradlelook.js:49` | workshop, dunes, margarite |
| 32 | 1.33 | 1.33 | 512 x 512 | RGBA8 | yes | canvas | `src/vfx/urncrown.js:54` | (boot, not in a scene) |
| 33 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/cradlelook.js:49` | workshop, dunes, margarite |
| 34 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/cradlelook.js:49` | workshop, dunes, margarite .. |
| 35 | 1.33 | 1.33 | 512 x 512 | RGBA8 | yes | image | `src/vfx/water.js:197` | basement, dunes, raceway |
| 36 | 1.33 | 1.33 | 512 x 512 | RGBA8 | yes | image | `src/vfx/vfx.js:101` | (boot, not in a scene) |
| 37 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/sight.js:340` | overlay |
| 38 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/sight.js:340` | overlay |
| 39 | 1.33 | 0.33 | 512 x 512 -> 256 x 256 | RGBA8 | yes | baked | `src/vfx/sight.js:324` | overlay |
| 40 | 1.33 | 1.33 | 512 x 512 | RGBA8 | yes | image | `src/vfx/liquid.js:47` | dunes, well, workshop .. |
| 41 | 1.33 | 1.33 | 512 x 512 | SRGB8_A8 | yes | image | `src/vfx/vessoulpaint.js:26` | workshop, garden |
| 42 | 1.04 | 1.04 | 512 x 400 | SRGB8_A8 | yes | canvas | `src/vfx/ostracon.js:66` | basement |
| 43 | 0.67 | 0.67 | 512 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/flourishprints.js:76` | every zone |
| 44 | 0.67 | 0.67 | 512 x 256 | RGBA8 | yes | canvas | `src/vfx/figmenttelegraph/figmenttelegraphatlas.js:42` | basement |
| 45 | 0.33 | 0.33 | 256 x 256 | SRGB8_A8 | yes | image | `src/vfx/greytint.js:22` | workshop |
| 46 | 0.33 | 0.33 | 256 x 256 | RGBA8 | yes | canvas | `src/vfx/vfx.js:97` | basement, well |
| 47 | 0.33 | 0.33 | 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/combatwingkit.js:147` | testroom |
| 48 | 0.33 | 0.33 | 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/strawman.js:72` | testroom |
| 49 | 0.33 | 0.33 | 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/strawman.js:72` | testroom |
| 50 | 0.33 | 0.33 | 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/shrine.js:55` | workshop, dunes, margarite |
| 51 | 0.33 | 0.33 | 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/shrine.js:55` | workshop, dunes, margarite |
| 52 | 0.33 | 0.33 | 256 x 256 | RGBA8 | yes | canvas | `src/vfx/vfx.js:97` | dunes, well |
| 53 | 0.31 | 0.31 | 512 x 160 | SRGB8_A8 | no | canvas | `src/vfx/lachrimetertube.js:69` | overlay |
| 54 | 0.25 | 0.25 | 1024 x 64 | SRGB8_A8 | no | baked | `src/vfx/duelview/marks.js:81` | basement |
| 55 | 0.25 | 0.25 | 368 x 176 | SRGB8_A8 | no | canvas | `src/vfx/lachrimetertube.js:69` | overlay |
| 56 | 0.23 | 0.23 | 256 x 176 | SRGB8_A8 | yes | canvas | `src/vfx/plasterpatch.js:30` | workshop |
| 57 | 0.23 | 0.23 | 256 x 176 | SRGB8_A8 | yes | canvas | `src/vfx/plasterpatch.js:30` | workshop |
| 58 | 0.19 | 0.19 | 228 x 222 | SRGB8_A8 | no | canvas | `src/vfx/duelview/flee.js:45` | basement |
| 59 | 0.17 | 0.17 | 512 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/sight.js:340` | overlay |
| 60 | 0.17 | 0.17 | 512 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/spiritpress.js:117` | garden |
| 61 | 0.17 | 0.17 | 512 x 64 | RGBA8 | yes | data | `src/vfx/alchemy/seals.js:80` | garden |
| 62 | 0.17 | 0.17 | 256 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/combatwingkit.js:174` | testroom |
| 63 | 0.08 | 0.08 | 256 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/racewaylooks.js:157` | raceway |
| 64 | 0.08 | 0.08 | 256 x 256 | R8 | yes | data | `src/vfx/water.js:197` | basement, dunes, raceway |
| 65 | 0.08 | 0.08 | 256 x 256 | R8 | yes | data | `src/vfx/liquid.js:96` | dunes, well, workshop .. |
| 66 | 0.08 | 0.08 | 128 x 128 | RGBA8 | yes | data | `src/vfx/surfaces.js:132` | (boot, not in a scene) |
| 67 | 0.08 | 0.08 | 128 x 128 | RGBA8 | yes | data | `src/vfx/surfaces.js:202` | (boot, not in a scene) |
| 68 | 0.08 | 0.08 | 128 x 128 | RGBA8 | yes | canvas | `src/vfx/bracelet.js:89` | workshop, basement, garden |
| 69 | 0.08 | 0.08 | 128 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/testroomkit.js:139` | testroom |
| 70 | 0.08 | 0.08 | 128 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/strawman.js:82` | testroom |
| 71 | 0.08 | 0.08 | 128 x 128 | RGBA8 | yes | data | `src/vfx/clouds.js:40` | every zone |
| 72 | 0.08 | 0.08 | 128 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/paintpath.js:41` | workshop |
| 73 | 0.08 | 0.08 | 128 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/paintpath.js:41` | workshop |
| 74 | 0.08 | 0.08 | 128 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/spiritpress.js:102` | garden |
| 75 | 0.06 | 0.06 | 48 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/bracelet.js:78` | workshop, basement, testroom .. |
| 76 | 0.05 | 0.05 | 260 x 52 | SRGB8_A8 | no | canvas | `src/vfx/sight.js:474` | overlay |
| 77 | 0.04 | 0.04 | 168 x 66 | SRGB8_A8 | no | canvas | `src/vfx/duelview/flee.js:45` | basement |
| 78 | 0.04 | 0.04 | 256 x 32 | SRGB8_A8 | yes | canvas | `src/vfx/testroomkit.js:114` | testroom |
| 79 | 0.04 | 0.04 | 256 x 32 | SRGB8_A8 | yes | canvas | `src/vfx/shrine.js:55` | workshop, dunes, margarite |
| 80 | 0.04 | 0.04 | 64 x 128 | SRGB8_A8 | yes | canvas | `src/vfx/racewaycavern.js:108` | raceway |
| 81 | 0.04 | 0.04 | 128 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/spiritpress.js:128` | garden |
| 82 | 0.03 | 0.03 | 68 x 128 | RGBA8 | no | canvas | `src/vfx/lachrimetertube.js:294` | overlay |
| 83 | 0.02 | 0.02 | 40 x 40 | RGBA32F | no | data | `src/vfx/overhead.js:41` | every zone |
| 84 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/particles.js:33` | basement, workshop, bazaar .. |
| 85 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/aberrantlook.js:161` | dunes |
| 86 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/brig.js:104` | workshop |
| 87 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/lighthouselamp.js:45` | workshop |
| 88 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/blobshadow.js:37` | workshop, basement, testroom .. |
| 89 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/leviathan.js:173` | workshop |
| 90 | 0.02 | 0.02 | 64 x 64 | RGBA8 | yes | canvas | `src/vfx/vantageframes.js:66` | workshop |
| 91 | 0.02 | 0.02 | 64 x 64 | RGBA8 | yes | canvas | `src/vfx/vantageframes.js:66` | workshop |
| 92 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | yes | canvas | `src/vfx/sight.js:397` | overlay |
| 93 | 0.02 | 0.02 | 64 x 64 | RGBA8 | yes | canvas | `src/vfx/alchemy/huering.js:38` | garden |
| 94 | 0.02 | 0.02 | 32 x 32 | RGBA32F | no | data | `src/vfx/overhead.js:41` | every zone |
| 95 | 0.02 | 0.02 | 32 x 32 | RGBA32F | no | data | `src/vfx/overhead.js:41` | workshop |
| 96 | 0.02 | 0.02 | 64 x 64 | SRGB8_A8 | no | canvas | `src/vfx/lachrimetertube.js:69` | overlay |
| 97 | 0.01 | 0.01 | 64 x 40 | SRGB8_A8 | yes | canvas | `src/vfx/brig.js:104` | workshop |
| 98 | 0.01 | 0.01 | 64 x 32 | SRGB8_A8 | yes | canvas | `src/vfx/testroomkit.js:125` | testroom |
| 99 | 0.01 | 0.01 | 128 x 5 | RGBA32F | no | data | `src/vfx/nightsky.js:81` | every zone |
| 100 | 0.01 | 0.01 | 24 x 24 | RGBA32F | no | data | `src/vfx/overhead.js:41` | workshop |
| 101 | 0.01 | 0.01 | 32 x 64 | SRGB8_A8 | no | canvas | `src/vfx/buskermat.js:30` | dunes |
| 102 | 0.01 | 0.01 | 20 x 20 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 103 | 0.01 | 0.01 | 32 x 32 | RGBA8 | yes | canvas | `src/vfx/lighthouselamp.js:53` | workshop, basement |
| 104 | 0.01 | 0.01 | 32 x 32 | SRGB8_A8 | yes | canvas | `src/vfx/racewayedgestrings.js:63` | raceway |
| 105 | 0.01 | 0.01 | 32 x 32 | RGBA8 | yes | canvas | `src/vfx/garden/gardensky.js:112` | garden |
| 106 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 107 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 108 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 109 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 110 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 111 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 112 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 113 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 114 | 0.00 | 0.00 | 12 x 12 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 115 | 0.00 | 0.00 | 16 x 16 | RGBA16F | no | target | `src/vfx/caster/casterkit.js:58` | (boot, not in a scene) |
| 116 | 0.00 | 0.00 | 20 x 20 | RGBA8 | no | data | `src/vfx/duelview/board.js:81` | basement |
| 117 | 0.00 | 0.00 | 20 x 20 | RGBA8 | no | data | `src/vfx/duelview/board.js:82` | basement |
| 118 | 0.00 | 0.00 | 4 x 64 | RGBA8 | yes | canvas | `src/vfx/bracelet.js:84` | workshop, basement, testroom .. |
| 119 | 0.00 | 0.00 | 16 x 16 | SRGB8_A8 | yes | canvas | `src/vfx/debugchest.js:31` | basement, dunes, beach .. |
| 120 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 121 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 122 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 123 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 124 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 125 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 126 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 127 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 128 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 129 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 130 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 131 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 132 | 0.00 | 0.00 | 8 x 8 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 133 | 0.00 | 0.00 | 4 x 4 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 134 | 0.00 | 0.00 | 4 x 4 | RGBA32F | no | data | `src/vfx/caster/portal.js:119` | (boot, not in a scene) |
| 135 | 0.00 | 0.00 | 4 x 4 | RGBA8 | yes | canvas | `src/vfx/shelllooks/warmup.js:30` | basement |
| 136 | 0.00 | 0.00 | 7 x 3 | RGBA8 | no | data | `src/vfx/sight.js:434` | overlay |
| 137 | 0.00 | 0.00 | 3 x 3 | RGBA8 | no | data | `src/vfx/sight.js:434` | overlay |
| 138 | 0.00 | 0.00 | 1 x 1 | SRGB8_A8 | no | data | `src/vfx/pneukajar/dress.js:38` | workshop, garden |
| 139 | 0.00 | 0.00 | 1 x 1 | RGBA8 | no | data | `src/vfx/caster/corrupted.js:91` | (boot, not in a scene) |
| 140 | 0.00 | 0.00 | 1 x 1 | RGBA8 | no | data | `src/vfx/lachrimetertube.js:153` | overlay |
| new | - | 0.33 | 256 x 256 | SRGB8_A8 | yes | canvas | `src/vfx/glyphs.js:154` | workshop |
