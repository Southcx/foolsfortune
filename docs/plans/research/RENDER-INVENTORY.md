# Render inventory: shaders, passes, levers (the junk-laptop goal)

> Measured 2026-10-19 for the deep clean (the owner: "junk laptop-certified"), by Petra's agent; headless SwiftShader, so ratios not milliseconds. What landed: the graphics tiers and dynamic resolution (`src/render/graphics.js`), the warm-up's parallel batch first.

For Petra (Main). Read-only study: no source edited. Tree: worktree of `7ffdd20`, three r170. 2026-10-19.
Method: one runtime capture in the way `scripts/perf.mjs` opens the game (scratch copy, port 5192), plus four small stock-three.js micro-benches for the per-pixel questions, plus a static read.

## 0. How far to trust the numbers

- **Counts are exact** (programs, passes, draws, triangles, render-target sizes, bytes). **Times are not**: SwiftShader is a CPU rasteriser, and for the whole capture (about 14 real minutes) and the first two micro-benches another agent's SwiftShader run (`measure.mjs`, port 5191) shared the same 4 cores (load average 5 to 12; 1.6 for the last two micro-benches). In the frame-time variants, "base" and "base (again)" of the same run differ by 6 to 12%, and the timed pass trace ran 920 ms and 3,345 ms on the same frame. Treat any frame-time difference under about 15% as noise. Ratios between variants are the thing to read, not milliseconds.
- **This browser does not expose `KHR_parallel_shader_compile`** (`getSupportedExtensions()` lacks it; three logs "extension not supported"). Everything below about compile is therefore the *serial* path: `compileAsync` had nothing to poll (0 `COMPLETION_STATUS_KHR` queries in the whole boot) and resolved after its 10 ms timer. On Chrome with ANGLE over D3D11 or Metal the extension is normally there (not verified here) and the batch below really compiles in parallel.
- **SwiftShader pays for a program at its first draw** (the per-program bench: 6% in link, 94% in the first draw); ANGLE over D3D11 pays at link (HLSL plus the driver). Rank by size should carry over (Pearson r = 0.69 between fragment-source bytes and bench ms, 176 programs), absolute milliseconds will not. I give "bench ms" as a size measure, not a prediction.
- **Not measured**: a real iGPU; Firefox; the title scene's programs (the manual harness skips the title, see 2.6); the Spirit Garden's own programs (`lateProgs` 17 in the baseline: I did not enter it); any state with a tool drawn (the per-frame instrument canvases are read from code, not captured); the workshop's draw count *settled* (my trace ran about 10 ticks after boot: 757 draws against `perf-baseline.json`'s 431, probably the prop batches not yet merged; the Dunes agree: 233 against 230).
- Files, all in `/tmp/claude-0/-home-user-foolsfortune/7ddd9ef9-14a1-57fc-9770-50b98014ffca/scratchpad/clean/`: `capture.mjs` (the capture), `capture.json` (everything it saw), `progsrc/<id>.vs|fs.glsl` (the 182 programs' final GLSL), `keys.txt` (one line a program), `inv2.txt` (groups and near-duplicates), `static-materials.txt` (every material class site, file:line), `microbench{,2,3,4}.json`, `sidetest.json`. The directory is shared with another agent's files (`measure.*`, `census.*`, `experiments*`...); I touched none of them.

## 1. The short list

**Top 5 consolidation moves** (detail and risk in 2.4):

1. **Fold the toggle-flag twins**: 69 of the 182 programs are the same GLSL as another with a `#define` flipped; unifying fog, opaque, vertex colour and map alone removes **36** (fog 15, opaque 15, vertex colour 14, map 18 each alone; they overlap). Always bind a white map and white vertex colour (the Lachrimeter tube already does: `OVERLAY_WHITE`), give every main-scene material the same `fog`, stop `transparent` flipping on the outline hulls. Up to **-36 programs, about -5.8 s bench**. Risk low to medium.
2. **`forceSinglePass = true` on transparent, double-sided stock materials.** r170 gives these two programs and two draws each (verified: `sidetest.json`; ShaderMaterial is exempt, it defaults to single pass). 8 twin pairs today (weather-bolt, duel glyph and flee plates, the Well's pools and sandfall stand-ins, chest glaze, the sloop's sail); about 170 materials hold the back-side half of these pairs, #80 alone 115. **-8 programs, -1.1 s bench, and those meshes draw once, not twice.** Risk low (additive and flat-coloured quads cannot tell).
3. **Standard to Lambert where the surface is matte**: 28 programs in the plain-Standard family (the level, pots, props, folk, duel pieces: 605 materials; the ones I read in code are roughness 0.82 to 0.92, metalness 0) and up to 49 of the 58 Standard programs carry no env map, clearcoat or PBR map. Per lit pixel Lambert is 0.5 to 0.7 of Standard (micro-bench), and a program compiles in 144 ms against 357 ms. **0 programs, -6.3 s bench for the 28 (up to -10 s for 49), -30 to -50% on the pixels that are lit.** Risk medium (surfaces.js and the paintmap patch read `roughnessFactor`; metalness is a uniform, so each material needs a look).
4. **The Courier's six finish kinds into one program** (`fin-glaze|skin|gem|hair`, with `kin`, `filigree`, `fade`, `fphide`): 6 vessel programs of 86 to 98 KB at 0.3 to 1.0 s each. One program with a `uFinKind` uniform. **-5 programs, about -2.7 s bench.** Risk medium (one bigger shader on a small part of the screen).
5. **Physical down to Standard** for the curios, cubes, Lantern Wisp and the overlay's instrument bodies: 10 programs, 3.9 s bench; clearcoat plus iridescence plus env is **4.5 times** a Standard pixel (micro-bench). **-0 to -3 programs, about -1.5 s bench, -55% on those pixels.** Risk medium (the look of the curios).

Not a consolidation, and bigger than all five for boot on a parallel-compile browser: **compile everything in one batch.** 82 of the 182 programs (45%) are linked one at a time, each waited on at once, because the warm-up draws the whole scene (the Portal's first look, `vfx/shelllooks/warmup.js`) *before* its single `compileAsync` (2.6). Move that draw after the batch.

**Top 5 per-frame savings** (basis in 3 and 5; "SS" is SwiftShader and noisy):

1. **Internal resolution 480 to 360 lines**: **-33% (workshop) and -33% (Dunes)** of the frame (SS, both places). One entry in `RESOLUTIONS`. No recompile.
2. **Point-light slots 8 to 4 (to 2)**: every lit pixel runs all 8 unrolled lamps even at intensity 0 (`lit: 0` at the workshop and the Dunes spawn). Micro-bench, Standard, 12 layers of 853x480: 8 lamps 990 to 1,150 ms, 4 lamps 670 to 700, 2 lamps 470 to 560, none 300 to 380. **-30% (to -50%)** of each lit pixel. The knob exists (`visual.lightSlots`, read once at boot, before the warm-up). A zero-colour skip (`if (directLight.visible)`) did **not** help in SwiftShader (`microbench3.json`: 10 to 25% slower); it may on a real GPU, unverified.
3. **MSAA off or 2x on the scene buffer, canvas `antialias:false`**: **-37% (workshop), -42% (Dunes)** in SS; an upper bound (SS charges per sample; micro-bench: +35% on a cheap shader, none on a heavy one). On an iGPU it is bandwidth: 853x480x(8+4 B)x4 samples is 19.7 MB a full-screen layer (estimate: 1 to 3 ms). Hard-coded today (`antialias: true`, `samples: 4`).
4. **Outline hulls**: 36% of the workshop's main-pass draws (259 of 711, unsettled) and 18% of the Dunes' (36 of 203). Draw-call CPU is the junk laptop's cost (the architecture note: about 26 µs a call on the owner's Firefox). Skip them for statics and props beyond N metres, or entirely.
5. **The sun shadow**: the pass is 337 of 1,087 GL draws in the workshop (31%) and 69 of 295 in the Dunes (23%), and the gate's draw count does not see them (`info.autoReset` clears after the shadow pass). Micro-bench: the pass about +7 to 12% (300 casters), receiving through PCF **+12 to 25%** per lit pixel; Basic filter, a 512 map, or every second frame each cuts it. Shadows off is best a boot-time choice (a runtime toggle is expected to recompile the lit programs).

Next in line: glow and grade off, **-13% (workshop), -19% (Dunes)** (SS; boot-time, it changes the target the programs are keyed to); the Standard to Lambert move above (-30 to -50% on lit pixels); far plane and terrain LOD ranges.

## 2. A. Shader programs

### 2.1 Static inventory

(All sites with file:line: appendix B. Material classes: appendix A and `static-materials.txt`.)

- **ShaderMaterial: 82 `new` sites in 67 files** (vfx 75, world 2, title 2, tools 2, render 1). **RawShaderMaterial: 0.** 11 are transparent plus DoubleSide on one line; 2 set `forceSinglePass` explicitly (it is the ShaderMaterial default in r170, so they are exempt from the double draw).
- **`onBeforeCompile` assignments: 43** (vfx 32, render 4, world 4, courier 2, creatures 1). **10 wrappers chain** the previous one (stormwarp, paintmap, surfaces, filigree, chestglaze, finish, coat, triplanar, outline `withFade`, kintsugi), so a vessel part's key is a sentence: `fphide-region.body-fade-region.body-fin-glaze-kin`.
- **`customProgramCacheKey` assignments: 42** (vfx 32, render 4, world 3, courier 2, creatures 1). A material without one is keyed by `onBeforeCompile.toString()` (the default): 128 of the 182 programs show `onBeforeCompile() { }` as their key tail, i.e. they are keyed by three's own defaults only.
- **A global patch**: `render/toon.js` rewrites `ShaderChunk.lights_physical_pars_fragment`, `lights_lambert_pars_fragment` (the toon ramp, both families) and `emissivemap_fragment` (the rim, behind `#define RIM`). It is why Lambert would look the same as Standard on matte surfaces: the ramp is applied to both.
- **Material classes** (sites / files): MeshStandard 304 / 149, MeshBasic 236 / 119, SpriteMaterial 29 / 28, LineBasic 24 / 21, PointsMaterial 8 / 7, MeshLambert 8 / 3 (five in the workbench), MeshPhysical 6 / 6, MeshNormal 1 (workbench), MeshDepth 1 (`vfx/shrine.js` CASTER), LineDashed 1. **Zero** Phong, Toon, Matcap, Distance, Shadow, Raw.
- **At runtime**: 3,950 mesh-material slots in the scene and overlay (a slot is one mesh's material; 1,736 Standard, 1,611 Basic, 287 Shader, 63 Physical, 63 Sprite, 6 Lambert, 3 Line, 2 Points, 1 LineDashed) share **182 programs** (22 to 1). Every slot had a program when the capture ended. The material objects behind them are fewer (a program's `usedTimes` counts them: the outline hull is one material on 818 meshes).

### 2.2 The program groups (runtime, after `__ready`)

182 programs alive; 188 were linked in the boot (6 replaced). "Bench ms" is the isolated compile-plus-first-draw in a fresh context (SwiftShader, relative). Owners follow CLAUDE.md "Threads".

| Family | Programs | Bench ms | Mean fs KB | Material objects on them | Owner |
| --- | ---: | ---: | ---: | ---: | --- |
| Outline hulls (MeshBasic, back faces, `render/outline.js`) | 9 | 735 | 14 | 9 (the shared hull material is on 818 meshes) | Petra |
| Unlit MeshBasic / Line / Points / Sprite (VFX meshes, marks, decals, sprites) | 28 | 1,650 | 13 | about 800 | Calissa (vfx/), Petra (world/) |
| Lit Standard, plain (level statics, props, pots, folk, duel pieces, bazaar) | 28 | 10,356 | 80 | about 605 | Petra (world/, render/triplanar), Calissa (surfaces.js, duelview) |
| Lit Standard plus one place's own patch (cave, crude sea, shore swash, dunes sand, dunemaw wall and sand, urn, ostracon, sloop sail, chest glaze, jelly, lectern, bracelet, datura) | 19 | 7,600 | 81 | 35 | Calissa (vfx/), Petra (creatures/jelly, world/ground) |
| The Courier and the God Hand (Standard plus fphide, fade, finish, kintsugi, filigree) | 11 | 4,761 | 85 | 12 | Calissa (finish.js, filigree.js), Petra (courier/vessel, render/outline.js) |
| MeshPhysical (clearcoat, iridescence: curios, cubes, bismuth, Lantern Wisp, overlay bodies) | 10 | 3,935 | 78 | 40 | Petra (world/treasure), Calissa (bismuth, oxidation, lachrimetertube) |
| MeshLambert | 1 | 144 | 44 | 1 | Calissa |
| Shadow depth (MeshDepthMaterial variants three makes itself) | 9 | 1,004 | 12 | 11 | three; Petra (shadowtrim), Calissa (shrine.js CASTER) |
| Screen passes (glow x4, glitch, aberrant wipe, lensing, time grade, maw wipe) | 9 | 695 | 5 | 9 | Petra (glow.js), Calissa (vfx/) |
| Caster shaders (corrupted x2, hologram x2, frost x2, bubble, heat haze, lightning, molten, portal) | 11 | 1,874 | 5 | 11 | Calissa (vfx/caster/) |
| Sky, weather, sea (dome, clouds, halo/bow, aurora, rain, motes, caustics, wake, shoal x2) | 10 | 1,380 | 4 | 20 | Calissa |
| Liquids and the Dunes' looks (water, bottles, pools, dunemaw sand-fall and spout, barrier, Raceway sandfall, slip geyser) | 10 | 1,107 | 7 | 50 | Calissa; Petra (world/dunes/barrier.js) |
| Overlay instruments: the Lachrimeter tube and its family share **one** program (#169) | 1 | 867 | 14 | 101 (142 mesh slots) | Calissa |
| Other ShaderMaterial marks and ribbons (beams, trails, rings, telegraphs, compass, reticles) | 26 | 2,717 | 5 | 186 | Calissa; Petra (tools/sondelass, world/ground/trailmap) |
| **Total** | **182** | **about 38,800** (36,600 measured, 6 BatchedMesh programs sized from their twins) | | | |

What the table says in four lines:
- **69% of the compile cost is 68 PBR programs** (Standard 58 plus Physical 10): 24.6 s of 36.6 s bench. A Standard fragment shader is 77 to 100 KB of GLSL with 8 point lights, a directional light, a hemisphere light and PCF shadow unrolled; a Basic one is 14 KB; a typical ShaderMaterial 2 to 10 KB.
- The ShaderMaterial side is already folded where it was easy: the weather's halo, bow, dogs and glow are one program (`uMode`), water and Lachryma-water one (`uLachryma`), the Dunemaw's spout and sandfall one (`uFall`), the Lachrimeter's whole family one. One near-duplicate pair remains among the 67 (#137 urn-core and #141 cave-egg, both labradorite-based).
- `surfaces.js` `dress()` already gives every level colour the same program ("a palette colour has no glaze, cover 0"); one program carries up to 249 materials (#18) and 196 (#29).
- Of 182 programs only 113 are different GLSL once `#define` lines are dropped: **69 are define permutations of another** (2.3).

### 2.3 What makes programs differ

Distinct (vertex, fragment) pairs after dropping `#define` lines: 113 of 182. The 69 others differ only in these flags (from the source, not the key):

| Flag | Programs involved | If unified alone | Bench ms freed | Forced by |
| --- | ---: | ---: | ---: | --- |
| side (FLIP / DOUBLE) | 28 FLIP + 50 DOUBLE | -24 | 5,159 | outline hulls are genuinely BackSide; 8 pairs are the transparent double-sided split (2.4 move 2); 7 of the 9 depth programs are FLIP (shadowSide) |
| map (USE_MAP) | 26 twins | -18 | 3,479 | a material with or without a map; a white 1x1 map unifies |
| fog | 15 | -15 | 2,678 | `fog: false` on some, default true on the rest; 7 pairs listed below |
| opaque (OPAQUE) | 15 | -15 | 2,520 | `transparent` or blending flipped; 3 pairs are the **outline hull** (#3/#99, #4/#86, #5/#85) |
| vertex colour | 14 | -14 | 3,849 | USE_COLOR; white default unifies |
| skinning | 28 programs | -18 | 3,780 | a geometry feature: a SkinnedMesh needs it. Not removable |
| instancing | 17 programs | -15 | 3,764 | a geometry feature. Not removable |
| BatchedMesh (USE_BATCHING) | 6 | -6 | about 2,300 est | #4, #9, #19, #20, #86, #180: the same material drawn through a prop batch and as a Mesh |
| flat shading, alpha test | 5 and 5 | -10 and -10 | 2,657, 2,618 | two flat-shaded duel materials; one alpha-tested leaf |

Combined (skinning and instancing kept, they are geometry): fog + opaque + map + vertex colour -> **-36 programs, 5.8 s**; plus flat and alpha test -> **-40**; plus side -> **-51**. Fog pairs: #73/#11, #15/#28, #45/#80, #46/#81, #50/#96 (Sprite), #56/#74, #57/#75. Opaque pairs: the outline x3, #81/#11, #113+#153 / #29+#79 (Standard), #46/#73, #57/#149.

### 2.4 Ranked consolidation moves

Ranked by programs saved times (1 minus risk), with boot time and per-pixel effect beside. "Bench ms" is the SwiftShader size measure of the programs removed or cheapened. Nothing here changes a base rule (CLAUDE.md, "Base change bad, modifiers good"): each is a material-parameter or shader-text change with the same look.

| # | Move | Programs saved | Bench ms saved | Per-frame effect | Risk | Owner |
| ---: | --- | ---: | ---: | --- | --- | --- |
| 1 | Toggle-flag twins: one `fog` for every main-scene material, white 1x1 map and white vertex colour as defaults (as `OVERLAY_WHITE`), `transparent` not flipped on outline hulls, `OPAQUE` consistent | up to 36 (fog+opaque 21 of them) | up to 5,800 (3,028) | none; fewer state changes | low-medium: a faded-out look at distance if fog flips; white defaults are exact | Calissa (vfx/ materials), Petra (outline.js, world/) |
| 2 | `forceSinglePass = true` on every transparent DoubleSide MeshBasic/Standard/Physical (8 twin pairs: #45/#46, #56/#57, #74/#75, #80/#81, #107/#108, #150/#151, #154/#155, #156/#113) | 8 | 1,104 | **halves their draws**: about 170 materials hold the back-side half (#80 alone 115) | low: order inside one mesh is lost; additive and flat quads are unaffected | Calissa (weather bolt, duel marks), Petra (Well's pools and sandfall stand-ins, chest glaze, sloop) |
| 3 | Standard to Lambert for matte surfaces: the 28 plain-family programs first (#18 x249 materials, #29 x196, #93, #16, #113, #79 ...), up to 49 | 0 now; fewer later | 6,300 for 28 (up to 9,900 for 49; 357 -> 144 ms a program) | **-30 to -50% on lit pixels** (0.5 to 0.7 of Standard, micro-bench), halves the fragment GLSL | medium: `surfaces.js`, `paintmap.js`, `coat.js`, `finish.js` read `roughnessFactor`; the glaze's gloss needs a cheap specular of its own; metalness per material | Petra (render/triplanar, world/ground), Calissa (surfaces.js, finish.js) |
| 4 | The vessel's finish kinds as one program (`uFinKind`) | 5 (of 6) | about 2,700 | none | medium: one 100 KB shader on at most 15% of the pixels; branch is per draw | Calissa (finish.js, filigree.js); Petra (courier/vessel/kintsugi.js) |
| 5 | Physical to Standard (fake the sheen with the existing rim): curios, cubes, wisp, overlay bodies (#168 x17 materials in the overlay) | 0 to 3 | about 1,500 | **-55% on those pixels** (Physical with clearcoat + iridescence + env is 4.5 times Standard) | medium: the cubes' and curios' look | Petra (world/treasure), Calissa (bismuth, oxidation, lachrimetertube) |
| 6 | BatchedMesh twins: do not draw one material both ways | 6 | about 2,300 | none | low | Petra (render/propbatch.js, shardbatch.js) |
| 7 | Per-place Standard patches (19 programs: cave, crude sea, shore, dunemaw, urn, ostracon, sloop ...) as patch slots in one uber Standard, **or** compile each place's set behind the seam on first entry | 0 to 15 | up to 7,600 | none | high as an uber shader; low as a deferred compile (a place's programs compile at its seam, not at boot) | Calissa (vfx/), Petra (world/) |
| 8 | Shadow depth variants: 9 -> about 5 by giving every caster the same `shadowSide` | 4 | about 400 | none | medium: acne or peter-panning | Petra |

Where the programs are now: the 17 programs the Spirit Garden compiles on first entry are *not* in the 182 (`lateProgs` 17 in the baseline: gardengrounds, gardenwater, strains, leafcanopy, plants, lekythos, cascade, rain, sky) and compile in play, on a seam. The title scene's own programs are not warmed either (2.6).

### 2.5 Standard, Lambert, Basic: per-pixel evidence

Stock three.js r170, 12 overdrawn full-screen layers at 853x480 (4.9 M fragments), sun + hemisphere + ambient, SwiftShader. The load average was 5 to 8 for `microbench.json` and `microbench2.json` and 1.6 for `microbench3/4.json`; the repeats in `microbench2.json` show the spread (about +/-20%). Ratios are within one run; milliseconds are a size.

| Case | Frame ms (4.9 M fragments) | Ratio, same run |
| --- | ---: | ---: |
| Basic, canvas | 125 to 200 | |
| Lambert, 0 point lights | 140 to 147 (quiet), 213 to 295 (loaded) | |
| Lambert, 8 point lights | 490 to 650 (quiet), 380 to 990 (loaded) | |
| Standard r0.9, 0 point lights | 194 to 247 (quiet), 300 to 380 (loaded) | |
| Standard, 2 / 4 / 8 point | 466 to 586 / 672 to 758 / 778 to 1,150 | 8 -> 4 lamps -30 to -40%, 8 -> 2 -50%, 0 -> 8 lamps x3 to x4 |
| **Lambert / Standard, same lamps** | | **0.5 to 0.65 at 8 lamps (quiet), 0.6 to 0.75 at 0** |
| Standard + 8 point + PCF 1024 shadow | 1,274 to 1,735 | +12 to +50% over no shadow |
| Lambert + 8 point + PCF 1024 shadow | 1,056 | |
| Standard metalness 0.9 + env + 8 point | 2,563 | x2.6 of Standard + 8 point |
| Physical clearcoat + iridescence + env + 8 point | 4,450 | **x4.5** |
| Standard + 8 point, lamps unlit (intensity 0) | 778 to 1,017 | the same as lit: a lamp costs the same lit or unlit |
| Same with `if (directLight.visible)` around `RE_Direct` | 990 to 1,258 | 10 to 25% *slower* in SwiftShader; not tested on a GPU |
| Shadow, 300 casters: none / PCF 1024 / Basic 1024 / PCF 512 / PCF receive only / pass skipped | 989 to 1,084 / 1,204 to 1,265 / 815 to 836 / 1,132 to 1,166 / 1,119 to 1,133 / 1,096 to 1,100 | pass +7 to 12%, PCF receive +10 to 15%; Basic no worse than none |
| MSAA, Basic into a half-float target: none / 2x / 4x | 85 to 128 / 120 to 218 / 113 to 217 | +35 to +90% on a cheap shader |
| MSAA, Standard + 8 point: none / 2x / 4x | 706 to 1,135 / 1,150 to 1,307 / 990 to 1,149 | inside the noise |

Reading: a lamp costs the same lit or unlit; Lambert is cheaper per lit pixel by a third to a half; the toon ramp is in both families; PCF receiving is a real tax and a Basic filter is not; MSAA is a tax on cheap, overdraw-heavy frames and invisible on heavy shaders in a software rasteriser (a real GPU differs: it is bandwidth).

### 2.6 The warm-up: how boot spends its time

Timeline (SwiftShader, dev server, shared box; page milliseconds). Page to `__ready`: **141 s**; of that the stage `shaders` (warm-up) is **89.8 s** (64%), `main` (module load) 16.9 s, `sky` 25.4 s.

| Window | What | Programs | Bench ms |
| --- | --- | ---: | ---: |
| 51.3 to 57.0 s | building the prewarm objects (no program yet) | 0 | |
| 57.0 to 81.9 s (**24.9 s**) | **linked one at a time, each waited on at once** (median gap 274 ms): the Portal's first look (`vfx/shelllooks/warmup.js` `a.refresh(renderer, scene)` renders the whole scene) and the other prewarm draws | **72** | 16,115 |
| 83.7 s (0.26 s) | **`renderer.compileAsync(scene, camera)`**: one `compile()` links the rest in a burst | **90** | 17,708 |
| 83.9 to 94.9 s | constructing the tube, link, cylinder, reticle, scope, guard, reliquary, desk, sight, tags, placard, seal picker (CPU only) | 0 | |
| 94.9 s | `overlayScene.compile()` and `post.compile()` (sync `compile`, never waited on) | 10 | 1,758 |
| 97.6 to 99.2 s | the 9 shadow depth programs: three makes them in the shadow pass, so `compile()` never sees them | 9 | 1,004 |
| 94.9 to 141 s (**`primeDraw` 46.0 s**) | draws everything once into a 16 px target; where the 90 + 10 queued programs are finally waited on (`getProgramInfoLog` blocked 75.5 s in all) | 1 (#187 shrine door, at 124.9 s) | |

Answers:
- **Is `renderer.compileAsync` used?** Yes: once for the world (`main.js:1041`, in a try/catch), in `courier/skiff/boat.js:141` for the skiff and in `vfx/titleplacard.js:713` for the placard. **Is KHR_parallel_shader_compile used?** Only through three: `compileAsync` polls `COMPLETION_STATUS_KHR` when the extension exists, and three's program `isReady()` does the same. Nothing in `src/` touches the extension itself. **Is a plain `renderer.compile` used?** Yes: `post.compile()` -> `Glow.compile` (4 passes, each against its own target, `glow.js:126`), `overlayScene.compile()` (`overlayscene.js:97`), the screen volumes' `compile` (glitch, lensing, time grade, aberrant wipe), and the Spirit Garden's `R.compile(this.site.group, ...)` at `world/garden/realm.js:111`. `compile()` only issues the links; what blocks is the first use. `renderer.debug.checkShaderErrors` stays `true` (three's default): the first use of each program runs `getProgramInfoLog` and `LINK_STATUS`, which wait for the link.
- **Why the 72 are serial** is inferred, not traced (I did not stack-trace each `linkProgram`): their ids run in scene-traversal order inside 57.0 to 81.9 s, each is checked 66 to 1,655 ms after its link (the batch's are checked 16 to 57 s after), and `prewarmShellLooks` is awaited *before* `compileAsync` and ends by drawing the whole scene into a Portal's target (`a.refresh(renderer, scene)`, `caster/portal.js:107`), a render that compiles whatever it meets one program at a time.
- **The finding**: with the extension present, only the 90-program batch overlaps. The 72 early programs still block one by one, and so do the 9 depth programs and #187. That is **82 of 182, 45% of the programs and 47% of the bench ms (17.2 s of 36.6 s)** that cannot use the parallel compiler. Fix: put the batch first. Park every prewarm object in the scene, call `compileAsync` once, then do the Portal's draw, the shadow pass (`renderer.shadowMap.needsUpdate` render of one frame) and `primeDraw`. Owners: Petra (`main.js`), Calissa (`shelllooks/warmup.js`, `caster/portal.js`).
- **Programs are keyed by the render target.** Switching glow and grade off at run time (the frame then goes straight to the canvas, where three bakes tone mapping and the colour space into every lit program) added **70 programs** to `info.programs` in my variants run (182 -> 252; I did not attribute them one by one, and the variants also changed resolution, MSAA and zones, none of which key a program). The same goes for the shadow toggle (`sun.castShadow` changes the lights state hash: expected from three's keying, not separately measured). So the low-spec choices that change the program set (glow/grade, shadows, light slots) must be made **before** the warm-up, or applied behind a seam.
- **The title scene is outside all of this.** It is a second `THREE.Scene` (`title/scene.js`), built before the warm-up and not in `compileAsync(scene, ...)`; the manual harness never draws it. Statically it carries a sky ShaderMaterial, two PointsMaterials, a SpriteMaterial, flat-shaded Standard for rock, moss, bark, leaf and jars, a mapped DoubleSide Standard, the chess board's ShaderMaterial and three Standard materials: about 5 to 8 programs not shared with the world, compiled in the first title frames (unmeasured). On a slow laptop that is the first hitch the player sees.

## 3. B. Frame passes

Window 960x540, `ps2` resolution: the drawing buffer is **853x480** (`present.js`: `ratio = min(dpr, lines / innerHeight)`), the browser scales it to the window with a bilinear filter. A 1920x1080 window gets the same 853x480. Everything in the chain is at that size or below it. No pass runs at the device resolution unless the setting is `native`.

### 3.1 The standing chain (every frame)

| # | Pass | Target | Size (480 lines) | Format | Draws / triangles, workshop* | Draws / triangles, Dunes | SS time, workshop (run B) | What it is |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| 1 | Sun shadow (`WebGLShadowMap`, PCF) | shadow map | 1024 x 1024 (+ depth renderbuffer 1024^2) | RGBA8, packed depth | 337 / 25.1 k | 69 / 23.7 k | 11.8 ms | ortho +/-17 m (workshop), +/-32 m following the Courier in 4 m steps (Dunes); updated **every frame** (`autoUpdate` true); casters under 6 cm trimmed at boot (`trimShadows`) |
| 2 | Scene | `post.scene` | 853 x 480 | RGBA16F, **4x MSAA** (4 x 8 B + 4 x 4 B depth a pixel: 19.7 MB) | 711 / 52.9 k | 203 / 218.5 k | 885 ms | everything drawn once; zones cull other places (zones off: +82% workshop in SS) |
| 3 | MSAA resolve (`blitFramebuffer`) | resolve texture | 853 x 480 | RGBA16F (+ depth RBO) | 0 | 0 | 0.2 ms | |
| 4 | Bright pass + 4-tap down | `half` | 426 x 240 | RGBA16F | 1 | 1 | ~0 | threshold with soft knee |
| 5 | Down | `q[0]` | 213 x 120 | RGBA16F | 1 | 1 | ~0 | |
| 6 to 7 | Blur H, blur V | `q[1]`, `q[0]` | 213 x 120 | RGBA16F | 2 | 2 | ~0 | 9 taps in 5 fetches |
| 8 | Down | `e[0]` | 106 x 60 | RGBA16F | 1 | 1 | ~0 | |
| 9 to 10 | Blur H, blur V | `e[1]`, `e[0]` | 106 x 60 | RGBA16F | 2 | 2 | ~0 | |
| 11 | Composite + tone map + sRGB + grade | **canvas** | 853 x 480, **4x MSAA default framebuffer** (`antialias: true`) | RGBA8 | 1 | 1 | in 15.8 ms with 12 | NaN guard on every pixel (`bad(c)`), rings of 8 taps only on a bad one |
| 12 | Overlay scene (own camera, own lights) | canvas | 853 x 480 | | 38 / 26.5 k | 22 / 24.0 k | in 15.8 ms with 11 | the Lachrimeter tube, Sight, cylinder, reticle, tags, placard; `clearDepth` first; Physical bodies |

\* The workshop figures are from about 10 ticks after boot; settled, `perf-baseline.json` says 431 draws against my 757 (Dunes: 230 against 233). Treat the workshop's draw split as an upper bound; the shape holds.

In SS the scene pass is 97 to 99% of the timed frame; the post chain is 7 small passes whose pixels sum to about half of one 853x480 target (plus the full-size composite). The `scene hidden` variant (post chain + overlay only) still read 429 to 834 ms: that is mostly the fixed cost of the 1-pixel sync read off the multisampled canvas, not the chain (the timed trace puts the chain and overlay at 2 to 16 ms). On an iGPU the chain's real cost is the composite (853x480, 3 texture reads, tone curve, the range checks) plus the resolve: well under 1 ms each by arithmetic (unmeasured).

### 3.2 Passes that run only sometimes

| Pass | When | Target | Cost note |
| --- | --- | --- | --- |
| Frame accumulation (`post.acc`) | `accum.amt > 0.001`: the vessel's shatter | 853 x 480 RGBA16F x2 (allocated on first use) | one full-screen pass |
| Screen volumes: lensing, time grade, aberrant wipe | while their `on` | 853 x 480 RGBA16F, lazily | one full-screen pass each, chained |
| Glitch screen pass | at big moments | its history pair, lazily | one pass |
| Heat haze `sceneGrab` | while a haze lives | a copy of the scene target, 853 x 480 | a blit of the frame |
| **Trail map** (`world/ground/trailmap.js`) | **every frame in the Dunes** | 512 x 512 RGBA16F, ping-pong | one fullscreen triangle with a loop of up to 24 stamped segments, even with none stamped (decay only): a candidate for half-rate or skip-when-empty |
| Ripple tank (`vfx/ripples.js`) | 6 real seconds after a touch | 128 x 128 RGBA16F x2, 60 Hz steps | cheap |
| Sparring mirror | inside the Throwing Room bales | 120 lines x glass aspect, RGBA16F, 4x MSAA | the room redrawn, every other frame under 45 fps |
| Portal view (`caster/portal.js`) | live portals at `liveHz` | `res` pair, RGBA16F + depth | **the whole world drawn again per portal** (refresh renders the scene) |
| Title placard | while shown | 4x MSAA colour + a half-size glow target | its own scene |
| Creature tag mesh sample (`creaturetags.js sampleMesh`) | first sight of a kind | 128 x 128 + `readRenderTargetPixels` | a GPU read-back (a stall) |
| Icon bake (`pneuka/icons.js`) | on need | a small target + read-back | a stall |

### 3.3 What I looked for and found

- **Full-device-resolution pass: none** at `ps2`/`540`/`720`; `native` is the only way (the setting exists). The canvas CSS-scaled by the browser is the one step at the display's size; it is the compositor's.
- **Canvas uploaded as a texture every frame**: **none in the captured idle states** (25 real seconds, 6 frames in the Dunes: `bumped: []`, `canvas2d: {}`; the only uploads are about 28 small typed-array `texSubImage2D` calls a frame, 0.6 to 6.4 KB each: data textures such as bone matrices and the overhead-cover texture, not identified one by one). **By code, while shown, these redraw and re-upload their whole canvas in `update()` with no dirty test I could find**: psygun reticle 160 x 160 (102 KB, `psygunreticle.js:89`), the Carbine's scope 536 x 536 (1.15 MB, `psygunscope.js:76`), Soul Brush desk 464 x 368 (683 KB, `soulbrushdesk.js:273`), Lockheart reliquary 448 x 464 (832 KB, `lockheartreliquary.js:257`). On change only: Sight plates, the Lachrimeter's count and cost plates, creature tags, the Sondelass's guard text. These are the per-frame uploads of a tool in hand; I did not capture one.
- **DOM work per frame**: **zero** in the idle state (MutationObserver: 0 mutations; `getBoundingClientRect` 0; `getComputedStyle` 0; no 2D canvas operation), and `OverlayScene.place()` never uses `el:` (no slot follows a DOM rect). A tool in hand and the HUD were not captured.
- **Real-time reflections, cube cameras, planar reflection of the scene**: none. The water samples the sky texture (`sky.texture`, a PMREM copy for glossy things). Extra whole-scene renders exist only for the portal (live portals), the sparring mirror (inside its room) and the warm-up's portal draw.
- **Shadow map**: 1024^2, one sun, PCF (`PCFShadowMap`), every frame, ortho 34 m (workshop) or 64 m (Dunes) across: 6 cm a texel in the Dunes. Not static, not half-rate. 337 of the workshop's 1,087 GL draws.
- **Render target memory at 480 lines**: about 47 MB (scene 19.7 + resolve 3.3 + depth 1.6, shadow 8.4, canvas MSAA 13, chain 1.3), and 4.2 more for the trail map in the Dunes.
- **The gate's draw count misses the shadow pass.** `info.autoReset` resets after `shadowMap.render` inside `render()`, so `perf.mjs` (and the 450 budget) count the scene, the 7 chain passes and the overlay, not the 337 depth draws. At the owner's 26 µs a call that is 8.8 ms in the workshop.

## 4. C. The quality levers that exist today

| Lever | Where | Range / default | When applied | Player-facing? | Notes |
| --- | --- | --- | --- | --- | --- |
| Internal resolution | `T.visual.resolution`, `present.js RESOLUTIONS` | `ps2` 480 (default), `540`, `720`, `native` | run time, no recompile (RT reallocation) | yes (SETTINGS) | **nothing below 480** |
| Upscale filter | `T.visual.upscale` | bilinear, pixel | run time | yes | no cost difference |
| Shadows on/off | `T.visual.shadows` -> `sun.castShadow` (`main.js:708`) | true | run time; three keys the lit programs by the shadow count, so expect a recompile of the lit set (not measured on its own) | yes | the only player-facing performance choice with a cost |
| Shadow map size | `T.visual.shadowRes` | 1024 (256 to 2048) | run time (`present.apply`) | no (developer knob) | PCF filter fixed |
| Point-light slots | `T.visual.lightSlots` -> `LightBudget` | 8 (2 to 16) | **boot only** (compile-time constant) | no (developer knob) | the lamps are scored each frame; `lit: 0` at the workshop and the Dunes spawn |
| Glow, grade | `T.visual.glow` 0.45, `grade` 1 | 0 to 1.5, 0 to 1 | run time | Look section of the Tab panel, not a SETTING | both 0 -> `post.on` false: scene straight to the canvas (recompile) |
| Toon ramp | `T.visual.toon` | 0 to 1 | run time, recompiles | no | |
| Outline thickness | `T.visual.outline` | 0.006 | run time | no | thickness only: the hulls are still drawn at 0 |
| Fog density | `T.visual.fog` 0.018; the Dunes lerp their own | | run time | no | |
| Camera far | `camera.far` 200; the Dunes lerp 200 -> 420 | | `dunes.js update()` | no | |
| Terrain LOD | `ChunkTerrain ranges [90, 200, 380]`, four levels, an outer ring | | build | no | the only geometry LOD besides Myggdrasil's `THREE.LOD` and `shoal.lod` |
| Zones | `render/zones.js` | | every 0.25 s | no | other places hidden: +82% frame with zones off (workshop, SS) |
| Glitch, storm warp | `T.visual.glitch`, `warp` | | run time | yes | screen passes only while firing |
| Particle caps | `Sprites` pools 16,384 x2 (+2,048 x2), `Chips` 400, `T.shatter.maxShards` 420, `maxChunk` | | build | no | GPU-stateless sprites: cost is overdraw |
| Shadow casters | `trimShadows(scene, 0.06)` | 6 cm | boot | no | |
| AI level of detail | `creatures/ai/brain.js` near/mid/far thinking | | per frame | n/a | CPU only |
| MSAA | none | **hard-coded**: `antialias: true` canvas, `samples: 4` scene buffer | | no | |
| Pixel ratio cap | `min(dpr, 2)` then `lines / innerHeight` | | resize | no | |
| GPU detection | one precedent: `leafcanopy.js coverageTrusted()` tests the renderer string for `swiftshader|llvmpipe|software` | | first use | n/a | and `debug/diag.js` already reads `EXT_disjoint_timer_query_webgl2` for its display |

**Gaps** (what a low-spec tier needs and does not have):
1. No quality tier, no auto-detection, no frame-time controller, no stored "graphics" choice.
2. Nothing below 480 lines; no MSAA control; the canvas `antialias` is fixed at context creation.
3. Light slots and glow/grade change the program set, so they cannot be switched in play without a recompile (observed +70 programs); the settings that do are not marked boot-only.
4. Outline hulls cannot be culled by distance or switched off (they are separate meshes added by `addOutline`; 259 of the workshop's 711 main draws).
5. Shadow: no static or half-rate update, no filter choice (Basic), no caster-size knob (`trimShadows` 0.06 fixed).
6. No cap on instrument canvas redraw rate; no dirty test on the four per-frame canvases.
7. The trail map ticks every frame in the Dunes even with nothing stamped.
8. No mesh LOD for props, creatures or the Courier; no draw-distance setting; terrain LOD ranges are fixed.
9. The warm-up cannot say which places' programs a weak machine may skip until entered.

## 5. A proposed low-spec tier

Plain names (CLAUDE.md "Plain names until settled"): "graphics: auto, high, low, minimum". Three tiers. Each row is one existing or small new knob; savings are from section 1 and 2.5 and are labelled **measured** (SS or micro-bench), **derived** (arithmetic from counts) or **estimate** (reasoned, a real iGPU needed to confirm).

| Setting | High (today) | Low | Minimum | Expected saving | When it can change | Basis | Detected by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Internal resolution | 480 lines | 400 | 360 | 480 -> 360: **-33%** frame | run time | measured (SS, 2 places) | live controller (4) first; probe (3); renderer string (1) |
| Scene buffer MSAA / canvas antialias | 4x / on | 2x / off | off / off | **-37% to -42%** (SS upper bound); iGPU 1 to 3 ms | scene samples: run time (RT realloc); canvas flag: context creation | measured (SS), estimate (iGPU) | caps (1: `MAX_SAMPLES`, renderer string); probe (3) |
| Point-light slots | 8 | 4 | 2 | 8 -> 4 **-30%**, -> 2 **-50%** of each lit pixel (a smaller shader to compile too, not measured) | **boot** | measured (micro-bench) | tier from (1), (2), (3); boot only |
| Sun shadow | 1024 PCF, every frame | 512, Basic filter, every second frame, casters >= 15 cm | off | pass 7 to 12% + receive 12 to 25% per lit pixel; draws -31% (workshop), -23% (Dunes); half rate halves the pass | off and the filter: **boot** (both key the programs); map size and rate: run time | measured (micro-bench), derived (draws) | tier from (1), (3); the filter and off at boot |
| Glow, grade | on (7 small passes + HDR target) | on, half-size chain only (skip the 426x240 stage) | off (scene straight to the canvas, tone mapped in the materials) | off: **-13% / -19%** (SS) | **boot** (keys the programs) | measured (SS) | (1): no `EXT_color_buffer_float` forces off; tier at boot |
| Outline hulls | all | characters, creatures and props within 25 m | characters only | **-18% (Dunes) to -36% (workshop)** of main draws; the hull's triangles too | run time (`visible` on `userData.isOutline`) | derived (trace) | live controller (4), by distance |
| Camera far, fog, terrain LOD | 200 (Dunes 420), `ranges [90, 200, 380]` | 140 (300), `[65, 140, 260]`, fog x1.3 | 100 (200), `[45, 100, 190]`, fog x1.7 | fewer chunks and draws in the Dunes (218 k triangles there); unmeasured | run time | estimate | live controller (4) |
| Particle pools | 16,384 / 2,048, 420 shards | 6,000 / 1,000, 200 | 2,000 / 500, 100 | only in bursts: a fight's overdraw spike | build | estimate | live controller (4) on a burst that drops frames |
| Materials | Standard / Physical | Lambert for the 28 plain-family programs (up to 49); no env on glossy | + Physical bodies to Standard | **-30 to -50% on lit pixels** (Lambert), -55% on Physical pixels; **-6 to -10 s** bench compile | boot (a different program set) | measured (micro-bench) | tier from (1), (2), (3); boot only |
| Instrument canvases | redraw every update | 30 Hz, only when changed | same | removes up to 1.15 MB a frame per instrument shown | run time | derived | tier; the controller (4) lowers the rate |
| Far effects | every frame | trail map and ripples at 30 Hz, skip when empty | same | one 512^2 pass in two | run time | derived | live controller (4) |
| Anisotropy, mip bias | 4 to 16 on a few textures | 2 | 1 | small | boot | estimate | caps (1) |

**Order of application.** Boot-time choices first (they change the program set, so they decide before `main.js`'s warm-up): light slots, shadows on/off, glow on/off, the Lambert switch, canvas `antialias`. Run-time steps after, in the order that costs the least look: resolution -> MSAA samples -> shadow rate/filter -> outline distance -> far plane and LOD -> particle caps. A step that needs a recompile is never taken in play without a seam.

**How to detect it** (cheapest first; the tier is a guess that the probe corrects):
1. **Before `new WebGLRenderer`**, in a throwaway context as `leafcanopy.js coverageTrusted()` already does: `WEBGL_debug_renderer_info` UNMASKED_RENDERER. `/swiftshader|llvmpipe|software|basic render/i` -> minimum. `/Intel.*(HD|UHD|Iris(?! Xe)|Graphics [0-9]{3,4})/i`, `/Radeon.*(Vega [0-9]\b|Graphics$)/i`, `/Mali|Adreno|PowerVR/i` -> low. Also read `MAX_SAMPLES`, and the presence of `EXT_color_buffer_float` (no HDR target -> minimum), `KHR_parallel_shader_compile` (absent -> hide the compile behind the title and expect long boots).
2. **Cheap hints**: `navigator.hardwareConcurrency <= 4`, `navigator.deviceMemory <= 4` (Chromium only), `screen` size against dpr (a 4K panel behind a weak GPU gains most from fewer lines). Firefox buckets the GPU name (the architecture note: an RTX 3060 Ti reads as a GTX 980), so the string alone is not enough there.
3. **A frame-time probe in the loading screen**, after the warm-up and before the title: draw the real scene (zones on, the workshop) 8 times into the post target with the 1-pixel `readPixels` sync `perf.mjs` uses, take the median; or the calibrated pattern of `microbench.page.js` (12 layers of Standard + 8 lamps, about 4.9 M fragments: 1.0 s in SwiftShader; calibrate on the owner's real laptop). Under 8 ms stay high; 8 to 16 ms low; over 16 ms minimum. About 0.2 to 1 s of the loading screen, only when step 1 or 2 left a doubt.
4. **A live controller** (the consoles' dynamic resolution): median of 120 frame intervals above 20 ms for 3 real seconds -> one tier down on the run-time steps; never up again within the session without a 60-second quiet; `EXT_disjoint_timer_query_webgl2` (which `diag.js` already reads) gives the GPU's own time where the browser offers it, else the rAF delta.
5. **Remember it**: write the tier to the settings scope (`foolsfortune.tuning`) so the next boot starts there (CLAUDE.md: nothing touches `localStorage` itself; go through `game.save`), and show it as a player setting "graphics: auto / high / low / minimum" next to resolution and shadows.

## 6. Not done, and what would settle it

- A run on the owner's junk laptop (Chrome and Firefox): compile wall time with the extension present, the 82 serial programs, the real cost of MSAA and the composite, the iGPU light-skip branch (2.5).
- The title scene's programs and the Spirit Garden's 17, counted by entering them.
- A tool-in-hand capture (psygun drawn, Soul Brush, Lockheart): the per-frame canvas uploads, DOM writes, the overlay's draw count.
- The outline twins (#3/#99, #4/#86, #5/#85): something flips `transparent` on a shared outline hull; I did not trace what.
- Settled workshop draw counts.

## Appendix A. Material classes (sites in `src/`, `new THREE.<Class>(`; every file:line is in `static-materials.txt`)

| Class | Sites | Files | By top directory | Biggest files |
| --- | ---: | ---: | --- | --- |
| MeshStandardMaterial | 304 | 149 | vfx 147, world 59, tools 32, workbench 27, godhand 10, title 9, courier 9, creatures 7, npc 3, pneuka 1 | workbench/stages.js 9; vfx/testroomkit.js 9; vfx/shrine.js 9 |
| MeshBasicMaterial | 236 | 119 | vfx 114, world 46, tools 39, workbench 18, godhand 7, courier 4, creatures 2, feedback 2, render 2, pneuka 1, npc 1 | vfx/particles.js 7; tools/sondelass/angling/weir.js 7; tools/sondelass/angling/fishmesh.js 7 |
| MeshLambertMaterial | 8 | 3 | workbench 5, vfx 3 | workbench/figmenttelegraphstage.js 5; vfx/dizzy.js 2; vfx/duelview/marks.js 1 |
| MeshPhysicalMaterial | 6 | 6 | vfx 4, world 2 | world/treasure/curiomodel.js 1; world/treasure/cubes.js 1; vfx/bismuth.js 1 |
| MeshPhongMaterial | 0 | 0 | - | - |
| MeshToonMaterial | 0 | 0 | - | - |
| MeshMatcapMaterial | 0 | 0 | - | - |
| MeshNormalMaterial | 1 | 1 | workbench 1 | workbench/workbench.js 1 |
| MeshDepthMaterial | 1 | 1 | vfx 1 | vfx/shrine.js 1 |
| MeshDistanceMaterial | 0 | 0 | - | - |
| PointsMaterial | 8 | 7 | vfx 5, title 2, tools 1 | title/scene.js 2; vfx/cavekit.js 1; vfx/garden/gardensky.js 1 |
| LineBasicMaterial | 24 | 21 | vfx 10, workbench 6, godhand 2, world 2, tools 2, debug 1, courier 1 | workbench/animstage.js 3; vfx/brig.js 2; workbench/workbench.js 1 |
| LineDashedMaterial | 1 | 1 | tools 1 | tools/psygun/specials.js 1 |
| SpriteMaterial | 29 | 28 | vfx 11, tools 9, world 5, godhand 2, title 1, pneuka 1 | tools/psygun/shells.js 2; godhand/jar.js 1; godhand/godhand.js 1 |
| ShadowMaterial | 0 | 0 | - | - |
| RawShaderMaterial | 0 | 0 | - | - |
| ShaderMaterial | 82 | 67 | vfx 75, world 2, title 2, tools 2, render 1 | vfx/dunemaw.js 5; vfx/weather.js 4; vfx/titleplacard.js 3 |

Also: `THREE.ShaderChunk` rewritten once in `src/render/toon.js:22-24, 45` (lights_physical_pars_fragment, lights_lambert_pars_fragment, emissivemap_fragment). Outside the game proper (`src/workbench/`) are 27 Standard, 18 Basic and 5 Lambert sites that never reach a player.

## Appendix B. ShaderMaterial sites (82, all `new THREE.ShaderMaterial`; RawShaderMaterial: none)

file:line, the material's `name` when given on that line, and what that line says about transparency and sides (the options often continue on the next line).

- `src/world/ground/trailmap.js:76`
- `src/world/dunes/barrier.js:46`
- `src/vfx/ribbonlight.js:153`  (transparent DoubleSide)
- `src/vfx/aberrantwipe.js:156` 'aberrant-wipe' (DoubleSide)
- `src/vfx/foelook.js:86` 'foe-shell' (transparent additive)
- `src/vfx/cavekit.js:125` 'cave-warped' (transparent)
- `src/vfx/cavekit.js:190` 'cave-egg' (transparent DoubleSide)
- `src/vfx/titleplacard.js:645`  (transparent additive)
- `src/vfx/titleplacard.js:648`  (transparent)
- `src/vfx/titleplacard.js:654`  (transparent additive)
- `src/vfx/figmenttelegraph/figmenttelegraphshader.js:241`
- `src/vfx/weather.js:288` 'weather-rain'
- `src/vfx/weather.js:329` 'weather-motes'
- `src/vfx/weather.js:468` `weather-${['halo', 'bow', 'dogs', 'glow'][mode]}`
- `src/vfx/weather.js:480` 'weather-aurora'
- `src/vfx/meshfx.js:79`
- `src/vfx/garden/gardensky.js:61` 'garden-dome'
- `src/vfx/garden/tribulation.js:44` 'kiln-vortex' (transparent DoubleSide)
- `src/vfx/garden/gardencascade.js:91` 'garden-cascade' (transparent DoubleSide forceSinglePass)
- `src/vfx/garden/gardenrain.js:96` 'garden-rain' (transparent)
- `src/vfx/pulse.js:47`
- `src/vfx/urncrown.js:109`
- `src/vfx/mawwipe.js:33` 'maw-wipe'
- `src/vfx/racewaysandfall.js:201`
- `src/vfx/beam.js:39`
- `src/vfx/railgeometry.js:140`
- `src/vfx/solarring.js:18` 'solar-ring'
- `src/vfx/glitch.js:133`
- `src/vfx/ripples.js:70` 'ripple-step'
- `src/vfx/caster/molten.js:96` 'caster-molten'
- `src/vfx/caster/lensing.js:99` 'caster-lensing'
- `src/vfx/caster/corrupted.js:97` 'caster-corrupted' (DoubleSide)
- `src/vfx/caster/hologram.js:74` 'caster-hologram' (transparent)
- `src/vfx/caster/frostbisque.js:110`
- `src/vfx/caster/portal.js:83`
- `src/vfx/caster/lightning.js:61`
- `src/vfx/caster/heathaze.js:56`
- `src/vfx/caster/timegrade.js:74` 'caster-timegrade'
- `src/vfx/caster/bubble.js:115`
- `src/vfx/shoal.js:182` 'shoal-glints'
- `src/vfx/shoal.js:191` 'shoal-boil' (transparent)
- `src/vfx/labradorite.js:93`
- `src/vfx/labradorite.js:102`
- `src/vfx/sky.js:212` 'sky-env'
- `src/vfx/sky.js:231` 'sky-dome'
- `src/vfx/spiritpress.js:248` 'spirit-fume' (transparent DoubleSide)
- `src/vfx/dunemaw.js:109`
- `src/vfx/dunemaw.js:152` 'dunemaw-sandfall-door' (transparent DoubleSide)
- `src/vfx/dunemaw.js:200` 'dunemaw-pit' (transparent)
- `src/vfx/dunemaw.js:264`  (transparent)
- `src/vfx/dunemaw.js:270`  (transparent)
- `src/vfx/bottle.js:67` 'bottle-lachryma' (DoubleSide)
- `src/vfx/bottle.js:71` 'bottle-glass' (transparent)
- `src/vfx/lachrimetertube.js:144`  (transparent DoubleSide forceSinglePass)
- `src/vfx/rail.js:56` 'ship-wake' (transparent DoubleSide)
- `src/vfx/railmark.js:200`
- `src/vfx/water.js:189`
- `src/vfx/bowl.js:76` 'pool-ring' (transparent)
- `src/vfx/sprites.js:134`
- `src/vfx/paintpath.js:63`
- `src/vfx/stains.js:73` 'stain' (transparent)
- `src/vfx/catch.js:47` 'catch-mouth' (transparent DoubleSide additive)
- `src/vfx/ostracon.js:225` 'ostracon-sparkle' (transparent additive)
- `src/vfx/vfx.js:118`  (transparent DoubleSide)
- `src/vfx/vfx.js:347`  (transparent DoubleSide)
- `src/vfx/parrymark.js:105` 'parry-mark' (transparent)
- `src/vfx/alchemy/bath.js:128` 'press-bath'
- `src/vfx/alchemy/marks.js:165` 'press-marks' (transparent)
- `src/vfx/clouds.js:55` 'clouds'
- `src/vfx/hudring.js:153`
- `src/vfx/wirecompass.js:85`
- `src/vfx/shrine.js:139`  (transparent)
- `src/vfx/duelview/domains.js:163`
- `src/vfx/trail.js:40`
- `src/vfx/portrait.js:58`
- `src/vfx/umbral.js:61` 'umbral-caustics' (transparent additive)
- `src/vfx/slipgeyser.js:45` 'slip-geyser-ring' (transparent)
- `src/title/scene.js:58`
- `src/title/board.js:133`
- `src/render/glow.js:113`
- `src/tools/sondelass/blade.js:52`
- `src/tools/sondelass/angling/reticle.js:100`

## Appendix C. `onBeforeCompile` assignments (43)

The ten that chain the previous one (`const prev = ...onBeforeCompile`): `vfx/stormwarp.js:108`, `world/ground/paintmap.js:366`, `vfx/surfaces.js:288`, `vfx/filigree.js:74`, `vfx/chestglaze.js:38`, `vfx/finish.js:195`, `vfx/coat.js:20`, `render/triplanar.js:90`, `render/outline.js:100` (`withFade`), `courier/vessel/kintsugi.js:42`.

- `src/creatures/jelly/deform.js:49`
- `src/world/ground/paintmap.js:366`
- `src/world/treasure/chestmodel.js:51`
- `src/world/treasure/cubes.js:43`
- `src/world/dunes/dunes.js:173`
- `src/vfx/crystalfrets.js:41`
- `src/vfx/shore.js:72`
- `src/vfx/bismuth.js:52`
- `src/vfx/cavekit.js:41`
- `src/vfx/cavekit.js:168`
- `src/vfx/garden/gardengrounds.js:188`
- `src/vfx/garden/gardenwater.js:173`
- `src/vfx/garden/strains.js:103`
- `src/vfx/garden/lekythos.js:62`
- `src/vfx/garden/leafcanopy.js:182`
- `src/vfx/garden/gardenplants.js:87`
- `src/vfx/margarite.js:34`
- `src/vfx/stormwarp.js:108`
- `src/vfx/urncrown.js:84`
- `src/vfx/sloop.js:106`
- `src/vfx/datura.js:56`
- `src/vfx/dunemawkit.js:40`
- `src/vfx/dunemawkit.js:76`
- `src/vfx/dunemawkit.js:102`
- `src/vfx/oxidation.js:90`
- `src/vfx/surfaces.js:288`
- `src/vfx/spiritpress.js:158`
- `src/vfx/chestglaze.js:38`
- `src/vfx/greytint.js:50`
- `src/vfx/greytint.js:61`
- `src/vfx/finish.js:195`
- `src/vfx/bowl.js:29`
- `src/vfx/bracelet.js:177`
- `src/vfx/ostracon.js:152`
- `src/vfx/crudesea.js:76`
- `src/vfx/filigree.js:74`
- `src/vfx/coat.js:20`
- `src/render/triplanar.js:90`
- `src/render/outline.js:15`
- `src/render/outline.js:100`
- `src/render/outline.js:141`
- `src/courier/character.js:128`
- `src/courier/vessel/kintsugi.js:42`

## Appendix D. `customProgramCacheKey` assignments (42)

- `src/creatures/jelly/deform.js:101` `(melt ? 'jelly-melt2' : 'jelly2')`
- `src/world/ground/paintmap.js:383` `'pm|${before}'`
- `src/world/treasure/chestmodel.js:60` `'chest-prism'`
- `src/world/treasure/cubes.js:65` `'oil-slick'`
- `src/vfx/crystalfrets.js:69` `'crystalfrets'`
- `src/vfx/shore.js:94` `'shore-swash'`
- `src/vfx/bismuth.js:76` `'bismuth'`
- `src/vfx/cavekit.js:57` `'cave-seamed-${seam}'`
- `src/vfx/cavekit.js:182` `'cave-slip'`
- `src/vfx/garden/gardengrounds.js:196` `KEY`
- `src/vfx/garden/gardenwater.js:183` `KEY`
- `src/vfx/garden/strains.js:110` `KEY`
- `src/vfx/garden/lekythos.js:63` `MAT_KEY`
- `src/vfx/garden/leafcanopy.js:194` `KEY`
- `src/vfx/garden/gardenplants.js:92` `KEY`
- `src/vfx/margarite.js:40` `'nacre'`
- `src/vfx/stormwarp.js:135` `'${prevKey ? prevKey() : prevText}|storm1'`
- `src/vfx/urncrown.js:99` `'urn-crown'`
- `src/vfx/sloop.js:120` `'sloop-sail'`
- `src/vfx/datura.js:77` `'datura-flower'`
- `src/vfx/dunemawkit.js:70` `'dunemaw-wall'`
- `src/vfx/dunemawkit.js:93` `'dunemaw-floor'`
- `src/vfx/dunemawkit.js:116` `'dunemaw-sand'`
- `src/vfx/oxidation.js:100` `'bauble-ox'`
- `src/vfx/surfaces.js:297` `'surf|${key ? key() : ''}'`
- `src/vfx/spiritpress.js:168` `'spirit-bath'`
- `src/vfx/chestglaze.js:70` `'${prevKey ? prevKey() : ''}-cglaze${goldOnly ? 'g' : ''}'`
- `src/vfx/greytint.js:51`
- `src/vfx/greytint.js:62`
- `src/vfx/finish.js:207` `'${prevKey ? prevKey() : ''}-fin-${kind}'`
- `src/vfx/bowl.js:49` `'bowl-sand'`
- `src/vfx/bracelet.js:186` `'bracelet-body'`
- `src/vfx/ostracon.js:162` `'ostracon'`
- `src/vfx/crudesea.js:176` `'crude-sea-5'`
- `src/vfx/filigree.js:82` `'filigree|${key ? key() : ''}'`
- `src/vfx/coat.js:44` `'${prevKey ? prevKey() : ''}-coat'`
- `src/render/triplanar.js:143` `key`
- `src/render/outline.js:22` `(fpHide ? 'outline-fphide' : 'outline')`
- `src/render/outline.js:129` `'${prevKey ? prevKey() : ''}-fade-${key}'`
- `src/render/outline.js:147` `(xray ? 'glow-xray' : 'glow-outline')`
- `src/courier/character.js:129` `'fphide-${key}'`
- `src/courier/vessel/kintsugi.js:70` `'${prevKey ? prevKey() : ''}-kin'`

## Appendix E. The 182 programs after `__ready` (from `renderer.info.programs`)

id, three type, `name`, the flags in its GLSL (`FOG` = USE_FOG, `FLIP`/`DOUBLE` the side, `OPAQUE`, `SKIN`, `INST`, `COLOR`, `MAP`, `FLAT`, `ALPHA`), the tail of its cache key (the `customProgramCacheKey`, or `(default)`), `usedTimes` (material objects), the first materials and meshes that use it (found by walking the scene and the overlay), fragment KB, bench ms (`~` = estimated, the program would not link in the fresh context). The full cache key and the GLSL are in `capture.json` and `progsrc/`.

| id | type | name | flags | key tail | used | materials (mesh slots) | meshes | fs KB | bench ms |
| ---: | --- | --- | --- | --- | ---: | --- | --- | ---: | ---: |
| 2 | Shader |  | OPAQUE | onBeforeCompile() { } | 1 |  |  | 3 | 66 |
| 3 | MeshBasic |  | SKIN FOG FLIP OPAQUE | outline | 1 |  |  | 14 | 105 |
| 4 | MeshBasic |  | FOG FLIP OPAQUE | outline | 1 |  |  | 14 | ~60 |
| 5 | MeshBasic |  | FOG FLIP OPAQUE | outline | 1 |  |  | 14 | 213 |
| 6 | MeshBasic |  | SKIN FOG FLIP OPAQUE | outline-fphide-fade-ol-fphide | 1 | MeshBasic ×4 | SkinnedMesh | 15 | 92 |
| 7 | MeshBasic |  | SKIN FOG DOUBLE OPAQUE | onBeforeCompile() { } | 1 |  |  | 14 | 62 |
| 8 | MeshStandard |  | SKIN FOG DOUBLE OPAQUE | onBeforeCompile() { } | 1 |  |  | 77 | 231 |
| 9 | MeshStandard |  | COLOR FOG OPAQUE | onBeforeCompile() { } | 4 | MeshStandard ×381 | shards, Mesh, BatchedMesh | 77 | ~250 |
| 10 | MeshStandard |  | INST FOG OPAQUE | onBeforeCompile() { } | 7 | MeshStandard ×139; MeshStandard strawman×1 | InstancedMesh, Mesh | 77 | 228 |
| 11 | MeshBasic |  | FOG OPAQUE | onBeforeCompile() { } | 126 | MeshBasic ×303 | Mesh, brig-scorch, brig-match | 14 | 62 |
| 12 | MeshStandard |  | INST COLOR FOG OPAQUE | crystalfrets | 2 | MeshStandard ×9 | duel-ap, duel-wonder, duel-mirth | 78 | 262 |
| 13 | MeshStandard | duel-clay | INST COLOR FOG OPAQUE | onBeforeCompile() { } | 3 | MeshStandard duel-clay×4; MeshStandard ×2 | duel-junk, duel-stone, duel-bomb | 77 | 310 |
| 14 | MeshStandard |  | COLOR FOG OPAQUE | onBeforeCompile() { } | 8 | MeshStandard ×11; MeshStandard roly-poly-lit×1 | duel-frame, duel-floorlip, Mesh | 77 | 192 |
| 15 | MeshBasic | duel-glow | INST COLOR OPAQUE | onBeforeCompile() { } | 4 | MeshBasic duel-glow×4; MeshBasic spawnlook-blocks×1 | duel-orb, duel-pip, duel-craze | 14 | 110 |
| 16 | MeshStandard | bazaar-glaze | MAP FOG OPAQUE | onBeforeCompile() { } | 22 | MeshStandard bazaar-glaze×3; MeshStandard bazaar-paper×2 | Mesh, bazaar-cloths, bazaar-pieces | 77 | 228 |
| 17 | MeshPhysical |  | INST FOG OPAQUE | bismuth | 1 | MeshPhysical ×1 | InstancedMesh | 78 | 460 |
| 18 | MeshStandard |  | FOG OPAQUE | pm\|surf\|(patch chain) | 249 | MeshStandard ×248 | Mesh | 97 | 1095 |
| 19 | MeshStandard |  | FOG OPAQUE | pm\|surf\|(patch chain) | 1 | MeshStandard ×21 | Mesh, BatchedMesh | 97 | ~900 |
| 20 | MeshStandard |  | COLOR FOG OPAQUE | pm\|surf\|(patch chain) | 1 | MeshStandard ×26 | Mesh, BatchedMesh | 97 | ~900 |
| 21 | MeshStandard |  | SKIN MAP FOG OPAQUE | greytint | 6 | MeshStandard ×6 | Clapper | 77 | 289 |
| 22 | MeshStandard |  | SKIN MAP FOG OPAQUE | filigree\|fphide-region.body-fade-region.body-fin-gla... | 1 | MeshStandard ×1 | Polygon_ID29006 | 98 | 962 |
| 23 | MeshStandard |  | SKIN FOG OPAQUE | fphide-region.trim-fade-region.trim-fin-glaze | 1 | MeshStandard ×1 | Polygon_ID29006_1 | 93 | 950 |
| 24 | MeshStandard |  | SKIN MAP FOG OPAQUE | fphide-region.mask-fade-region.mask-fin-glaze-kin | 1 | MeshStandard ×1 | Courier_Mask | 95 | 801 |
| 25 | MeshStandard |  | SKIN FOG OPAQUE | fphide-region.skin-fade-region.skin-fin-skin | 1 | MeshStandard ×1 | Courier_Skin_Core | 87 | 296 |
| 26 | MeshStandard |  | SKIN FOG OPAQUE | fphide-region.stones-fade-region.stones-fin-gem | 1 | MeshStandard ×1 | Courier_Stones | 87 | 328 |
| 27 | MeshStandard |  | SKIN FOG OPAQUE | fphide-region.hair-fade-region.hair-fin-hair | 1 | MeshStandard ×1 | Kiritohair | 87 | 320 |
| 28 | MeshBasic |  | INST COLOR FOG OPAQUE | onBeforeCompile() { } | 2 | MeshBasic ×2 | InstancedMesh | 14 | 213 |
| 29 | MeshStandard |  | FOG OPAQUE | onBeforeCompile() { } | 196 | MeshStandard duel-brass×3; MeshStandard duel-kintsugi×1 | Mesh, shore-sea, urn-flesh | 77 | 502 |
| 30 | MeshPhysical | LW_Body | SKIN MAP FOG DOUBLE OPAQUE | onBeforeCompile() { } | 3 | MeshPhysical LW_Body×3 | LanternWisp_Mesh_1 | 77 | 305 |
| 31 | MeshPhysical | LW_Glow | SKIN MAP FOG DOUBLE OPAQUE | onBeforeCompile() { } | 3 | MeshPhysical LW_Glow×3 | LanternWisp_Mesh_2 | 77 | 254 |
| 32 | MeshPhysical | LW_Flame | SKIN MAP FOG DOUBLE OPAQUE ALPHA | onBeforeCompile() { } | 3 | MeshPhysical LW_Flame×3 | LanternWisp_Mesh_3 | 77 | 259 |
| 33 | MeshStandard |  | INST COLOR FOG OPAQUE FLAT | crystalfrets | 1 |  |  | 78 | 284 |
| 34 | MeshStandard |  | SKIN FOG OPAQUE FLAT | onBeforeCompile() { } | 6 |  |  | 77 | 313 |
| 35 | MeshStandard | cave-slip | FOG OPAQUE | cave-slip | 2 | MeshStandard cave-slip×2 | Mesh, foe-flood | 82 | 315 |
| 36 | MeshStandard | crude-sea | FOG OPAQUE | crude-sea-5\|storm1 | 3 | MeshStandard crude-sea×3 | Mesh, whirlpool | 89 | 752 |
| 37 | Shader | bottle-lachryma | DOUBLE OPAQUE | onBeforeCompile() { } | 2 | Shader bottle-lachryma×2 | Mesh | 3 | 100 |
| 38 | Shader | caster-corrupted | SKIN DOUBLE OPAQUE | onBeforeCompile() { } | 1 |  |  | 5 | 175 |
| 39 | Shader | caster-corrupted | DOUBLE OPAQUE | onBeforeCompile() { } | 1 |  |  | 5 | 64 |
| 40 | Shader | caster-molten | FLIP | onBeforeCompile() { } | 1 |  |  | 6 | 129 |
| 41 | MeshStandard |  | COLOR MAP FOG OPAQUE | bracelet-body | 4 | MeshStandard ×4 | Bracelet.body | 76 | 207 |
| 42 | MeshPhysical |  | FOG OPAQUE | bauble-ox | 1 | MeshPhysical ×1 | Mesh | 79 | 222 |
| 43 | Shader | duel-clash | DOUBLE | onBeforeCompile() { } | 2 | Shader duel-slab×1; Shader duel-clash×1 | duel-slab, duel-clash | 13 | 329 |
| 44 | Shader | datadrain-beam | DOUBLE | onBeforeCompile() { } | 17 | Shader shine-ring×6; Shader shine-star×6 | shine-ring, shine-star, paint-reticle | 14 | 195 |
| 45 | MeshBasic | weather-bolt | FLIP | onBeforeCompile() { } | 34 |  |  | 14 | 34 |
| 46 | MeshBasic | weather-bolt |  | onBeforeCompile() { } | 36 | MeshBasic duel-cast×1; MeshBasic duel-dry×1 | Mesh, beam | 14 | 34 |
| 47 | MeshBasic |  | INST FOG | onBeforeCompile() { } | 1 | MeshBasic ×1 | calf-threads | 14 | 37 |
| 48 | Shader | caster-hologram | SKIN DOUBLE | onBeforeCompile() { } | 1 |  |  | 3 | 89 |
| 49 | Shader | caster-hologram | DOUBLE | onBeforeCompile() { } | 1 |  |  | 3 | 59 |
| 50 | Sprite |  | MAP | onBeforeCompile() { } | 4 | Sprite ×4 | Sprite | 10 | 38 |
| 51 | MeshStandard |  | SKIN FOG | fphide-CourierEnergyShell-fade-CourierEnergyShell | 1 | MeshStandard ×1 | Courier_Skin | 78 | 251 |
| 52 | Shader | parry-mark | FLIP | onBeforeCompile() { } | 3 | Shader parry-mark×15 | Mesh | 2 | 54 |
| 53 | Shader | raceway-sandfall | FOG DOUBLE | onBeforeCompile() { } | 1 | Shader raceway-sandfall×1 | sandfall | 8 | 200 |
| 54 | MeshStandard | shore-swash | FOG | shore-swash | 1 | MeshStandard shore-swash×1 | Mesh | 78 | 330 |
| 55 | Shader | bottle-glass |  | onBeforeCompile() { } | 2 | Shader bottle-glass×2 | Mesh | 3 | 54 |
| 56 | MeshBasic |  | MAP FLIP | onBeforeCompile() { } | 8 |  |  | 14 | 40 |
| 57 | MeshBasic |  | MAP | onBeforeCompile() { } | 15 | MeshBasic duel-glyph×6; MeshBasic duel-flee-plate×2 | Mesh | 14 | 75 |
| 58 | Shader | weather-halo | DOUBLE | onBeforeCompile() { } | 9 | Shader weather-halo×1; Shader weather-bow×2 | Mesh | 3 | 117 |
| 59 | Shader | weather-aurora | FLIP | onBeforeCompile() { } | 1 | Shader weather-aurora×1 | Mesh | 3 | 204 |
| 60 | Shader |  | DOUBLE | onBeforeCompile() { } | 1 | Shader ×1 | Mesh | 4 | 72 |
| 61 | Shader | weather-rain |  | onBeforeCompile() { } | 1 | Shader weather-rain×1 | LineSegments | 2 | 98 |
| 62 | Shader | weather-motes |  | onBeforeCompile() { } | 2 | Shader weather-motes×2 | Points | 4 | 348 |
| 63 | Shader |  |  | onBeforeCompile() { } | 1 | Shader ×1 | Mesh | 10 | 281 |
| 64 | LineDashed |  | FOG | onBeforeCompile() { } | 1 | LineDashed ×1 | Line | 9 | 49 |
| 65 | Shader | caster-frostbisque |  | onBeforeCompile() { } | 1 |  |  | 6 | 366 |
| 66 | Shader | caster-frostbisque-skinned | SKIN | onBeforeCompile() { } | 1 |  |  | 6 | 382 |
| 67 | Shader |  | DOUBLE | onBeforeCompile() { } | 8 | Shader ×8 | Mesh | 4 | 69 |
| 68 | Shader | caster-bubble | DOUBLE | onBeforeCompile() { } | 1 | Shader caster-bubble×1 | caster-bubble | 10 | 179 |
| 69 | Shader | caster-heathaze | DOUBLE | onBeforeCompile() { } | 1 |  |  | 4 | 104 |
| 70 | Shader |  | DOUBLE | onBeforeCompile() { } | 1 | Shader ×1 | Mesh | 4 | 73 |
| 71 | Shader | caster-lightning | DOUBLE | onBeforeCompile() { } | 1 |  |  | 3 | 92 |
| 72 | Shader | maw-wipe |  | onBeforeCompile() { } | 1 | Shader maw-wipe×1 | Mesh | 5 | 61 |
| 73 | MeshBasic | duel-emo | OPAQUE | onBeforeCompile() { } | 3 | MeshBasic duel-emo×2; MeshBasic ×2 | Mesh | 14 | 44 |
| 74 | MeshBasic |  | MAP FOG FLIP | onBeforeCompile() { } | 9 |  |  | 14 | 101 |
| 75 | MeshBasic |  | MAP FOG | onBeforeCompile() { } | 197 | MeshBasic ×200 | Mesh, lantern-glass | 14 | 64 |
| 76 | Shader |  | DOUBLE | onBeforeCompile() { } | 71 | Shader ×71 | Mesh, LineSegments, index-dial-print | 4 | 76 |
| 77 | MeshLambert |  | FOG OPAQUE | onBeforeCompile() { } | 1 | MeshLambert ×6 | Mesh | 44 | 144 |
| 78 | Shader |  | DOUBLE | onBeforeCompile() { } | 9 | Shader ×9 | Mesh | 3 | 41 |
| 79 | MeshStandard |  | FOG OPAQUE | onBeforeCompile() { } | 21 | MeshStandard ×34 | Mesh, well-ceil, well-arch | 77 | 397 |
| 80 | MeshBasic |  | FOG FLIP | onBeforeCompile() { } | 115 |  |  | 14 | 37 |
| 81 | MeshBasic |  | FOG | onBeforeCompile() { } | 166 | MeshBasic ×173; MeshBasic well-sandfall-standin×2 | Mesh, pool-up, rim-up | 14 | 32 |
| 82 | MeshStandard |  | FOG OPAQUE | pm\|tpt\|(patch) | 1 | MeshStandard ×1 | Mesh | 99 | 1010 |
| 83 | Shader | sky-dome | FLIP OPAQUE | onBeforeCompile() { }\|storm1 | 1 | Shader sky-dome×1 | Mesh | 10 | 134 |
| 84 | Shader | clouds | FLIP | onBeforeCompile() { }\|storm1 | 1 | Shader clouds×1 | Mesh | 3 | 69 |
| 85 | MeshBasic |  | FOG FLIP | outline | 1 | MeshBasic ×818 | Mesh, BatchedMesh, SkinnedMesh | 14 | 41 |
| 86 | MeshBasic |  | FOG FLIP | outline | 1 |  |  | 14 | ~60 |
| 87 | Shader |  | DOUBLE | onBeforeCompile() { } | 4 | Shader ×4 | Mesh | 3 | 40 |
| 88 | MeshStandard |  | MAP FOG DOUBLE OPAQUE | onBeforeCompile() { } | 4 | MeshStandard ×13 | Mesh, brig-sail, brig-flag | 77 | 184 |
| 89 | MeshBasic |  | COLOR FOG DOUBLE OPAQUE | onBeforeCompile() { } | 7 | MeshBasic ×8 | Mesh | 14 | 66 |
| 90 | MeshStandard | datura-flower | INST FOG DOUBLE OPAQUE | datura-flower | 1 | MeshStandard datura-flower×1 | InstancedMesh | 77 | 355 |
| 91 | MeshStandard | datura-leaf | INST FOG DOUBLE OPAQUE | onBeforeCompile() { } | 1 | MeshStandard datura-leaf×1 | InstancedMesh | 77 | 314 |
| 92 | Shader |  |  | onBeforeCompile() { } | 4 | Shader ×4 | Mesh, pool-down, rim-down | 5 | 95 |
| 93 | MeshStandard | prince-crown | FOG DOUBLE OPAQUE | onBeforeCompile() { } | 26 | MeshStandard prince-crown×15; MeshStandard ×26 | Mesh, calf-sherd | 77 | 299 |
| 94 | Shader | figmentTelegraph | DOUBLE | onBeforeCompile() { } | 7 | Shader figmentTelegraph×7 | figmentTelegraph.mark.0, figmentTelegraph.mark.1, figmentTelegraph.mark.2 | 15 | 292 |
| 95 | MeshStandard | wing-mirror-reflection | MAP FOG OPAQUE | onBeforeCompile() { } | 1 | MeshStandard wing-mirror-reflection×1 | combat-wing-mirror | 77 | 196 |
| 96 | Sprite |  | MAP FOG | onBeforeCompile() { } | 59 | Sprite ×59 | Sprite | 10 | 58 |
| 97 | Shader | liquid-water | FOG DOUBLE | onBeforeCompile() { } | 2 | Shader liquid-water×2; Shader liquid-lachryma×1 | Mesh | 19 | 143 |
| 98 | MeshStandard |  | COLOR FOG OPAQUE | pm\|surf\|(patch chain) | 1 |  |  | 97 | 735 |
| 99 | MeshBasic |  | SKIN FOG FLIP | outline | 1 |  |  | 14 | 63 |
| 100 | MeshStandard |  | FOG OPAQUE | (patch chain) | 1 | MeshStandard ×1 | Plane002 | 78 | 203 |
| 101 | MeshBasic |  | FOG FLIP OPAQUE | outline-fade-ol-char | 1 | MeshBasic ×29 | Mesh | 15 | 55 |
| 102 | MeshStandard |  | FOG OPAQUE | (patch chain) | 1 | MeshStandard ×1 | Plane002_1 | 78 | 196 |
| 103 | MeshStandard |  | FOG OPAQUE | (patch chain) | 1 | MeshStandard ×3 | Mesh | 78 | 176 |
| 104 | MeshBasic |  | FOG OPAQUE | (patch chain) | 1 | MeshBasic ×1 | Mesh | 15 | 47 |
| 105 | Shader |  |  | onBeforeCompile() { } | 2 | Shader ×2 | Mesh | 2 | 58 |
| 106 | Shader |  | DOUBLE | onBeforeCompile() { } | 10 | Shader ×10 | Mesh | 2 | 45 |
| 107 | MeshBasic |  | COLOR FOG FLIP | onBeforeCompile() { } | 1 |  |  | 14 | 45 |
| 108 | MeshBasic |  | COLOR FOG | onBeforeCompile() { } | 1 | MeshBasic ×1 | Mesh | 14 | 46 |
| 109 | Shader |  | DOUBLE | onBeforeCompile() { } | 2 | Shader ×2 | Mesh | 2 | 28 |
| 110 | Shader |  |  | onBeforeCompile() { } | 2 | Shader ×2 | Mesh | 7 | 70 |
| 111 | Points |  | MAP FOG | onBeforeCompile() { } | 1 | Points ×1 | Points | 9 | 50 |
| 112 | Shader |  | DOUBLE | onBeforeCompile() { } | 2 | Shader ×2 | Mesh | 2 | 131 |
| 113 | MeshStandard |  | FOG | onBeforeCompile() { } | 22 | MeshStandard ×22; MeshStandard bowl-slip×2 | Mesh, brood-cap | 77 | 175 |
| 114 | Shader |  |  | onBeforeCompile() { } | 27 | Shader ×30 | LineSegments | 5 | 60 |
| 115 | Shader | rail-mark |  | onBeforeCompile() { } | 9 | Shader rail-mark×9 | lockheart-reach, carry-throw-arc, lob-arc | 9 | 142 |
| 116 | MeshStandard | Courier_Godhand | SKIN MAP FOG OPAQUE | (patch chain) | 2 | MeshStandard Courier_Godhand×1; MeshStandard Courier_PneukaJar×1 | GodHand, Cylinder | 78 | 278 |
| 117 | MeshStandard |  | SKIN FOG OPAQUE | onBeforeCompile() { } | 1 | MeshStandard ×1 | Cylinder_1 | 77 | 244 |
| 118 | MeshBasic |  | INST MAP FOG | onBeforeCompile() { } | 3 | MeshBasic ×3 | InstancedMesh | 14 | 65 |
| 119 | Shader | dunemaw-spout | DOUBLE | onBeforeCompile() { } | 22 | Shader dunemaw-spout×11; Shader dunemaw-sandfall×11 | dunemaw-spout, dunemaw-sandfall | 9 | 86 |
| 120 | Shader | slip-geyser-ring |  | onBeforeCompile() { } | 11 | Shader slip-geyser-ring×11 | Mesh | 4 | 70 |
| 121 | LineBasic |  | COLOR FOG | onBeforeCompile() { } | 1 | LineBasic ×1 | LineSegments | 14 | 59 |
| 122 | MeshPhysical |  | INST FOG OPAQUE | oil-slick | 8 | MeshPhysical ×8 | InstancedMesh, busker-tips | 78 | 617 |
| 123 | MeshStandard |  | FOG DOUBLE OPAQUE | (patch chain) | 6 | MeshStandard ×12 | Mesh | 80 | 292 |
| 124 | MeshStandard |  | FOG DOUBLE OPAQUE | onBeforeCompile() { } | 6 | MeshStandard ×12 | Mesh | 77 | 336 |
| 125 | MeshStandard |  | FOG OPAQUE | (patch chain) | 6 | MeshStandard ×6 | Mesh | 80 | 274 |
| 126 | MeshPhysical |  | INST FOG OPAQUE | oil-slick-cglazeg | 1 |  |  | 80 | 620 |
| 127 | MeshPhysical |  | FOG OPAQUE | oil-slick-cglazeg | 1 | MeshPhysical ×12 | InstancedMesh, Mesh | 80 | 497 |
| 128 | MeshBasic |  | COLOR FOG DOUBLE OPAQUE | chest-prism | 1 | MeshBasic ×4 | Mesh | 14 | 47 |
| 129 | MeshStandard | lectern-wood | FOG OPAQUE | tpf\|onBeforeCompile() { } | 1 | MeshStandard lectern-wood×1 | Mesh | 78 | 294 |
| 130 | MeshStandard |  | FOG OPAQUE | jelly-melt2 | 3 | MeshStandard ×3 | Mesh | 80 | 294 |
| 131 | Shader | catch-mouth | DOUBLE | onBeforeCompile() { } | 1 | Shader catch-mouth×1 | Mesh | 3 | 45 |
| 132 | MeshStandard |  | SKIN FOG OPAQUE | onBeforeCompile() { } | 6 | MeshStandard ×6 | Clapper | 77 | 261 |
| 133 | MeshStandard |  | FOG OPAQUE | dunemaw-wall | 1 | MeshStandard ×8 | well-wall, well-deco | 79 | 403 |
| 134 | MeshStandard | dunemaw-sand | FOG OPAQUE | pm\|tpt\|dunemaw-sand | 1 | MeshStandard dunemaw-sand×4 | well-sand | 100 | 961 |
| 135 | Shader | dunemaw-sandfall-door | DOUBLE | onBeforeCompile() { } | 1 | Shader dunemaw-sandfall-door×1 | sandfall | 8 | 96 |
| 136 | MeshStandard | urn-crown | FOG DOUBLE OPAQUE | urn-crown | 1 | MeshStandard urn-crown×1 | urn-crown | 79 | 287 |
| 137 | Shader | urn-core |  | onBeforeCompile() { } | 1 | Shader urn-core×1 | urn-core | 4 | 58 |
| 138 | MeshStandard | bowl-sand | FOG OPAQUE | bowl-sand | 1 | MeshStandard bowl-sand×1 | Mesh | 78 | 280 |
| 139 | MeshStandard |  | FOG OPAQUE | cave-seamed-1 | 2 | MeshStandard ×3 | cave-pillar, cave-pillar-rubble, stalactite-brittle | 79 | 241 |
| 140 | Points |  | FOG OPAQUE | onBeforeCompile() { } | 1 | Points ×1 | stalactite-grit | 9 | 41 |
| 141 | Shader | cave-egg | DOUBLE | onBeforeCompile() { } | 1 | Shader cave-egg×4 | Mesh | 4 | 70 |
| 142 | Shader | pool-ring |  | onBeforeCompile() { } | 1 | Shader pool-ring×1 | Mesh | 5 | 223 |
| 143 | Shader | foe-shell |  | onBeforeCompile() { } | 1 | Shader foe-shell×1 | Mesh | 5 | 60 |
| 144 | MeshBasic |  | SKIN FOG OPAQUE | onBeforeCompile() { } | 1 |  |  | 14 | 63 |
| 145 | Shader | caster-portal | DOUBLE | onBeforeCompile() { } | 1 |  |  | 8 | 236 |
| 146 | Shader | solar-ring | OPAQUE | onBeforeCompile() { } | 1 | Shader solar-ring×1 | solar-ring | 2 | 33 |
| 147 | MeshStandard | ostracon | MAP FOG OPAQUE | ostracon | 1 | MeshStandard ostracon×1 | Mesh | 77 | 385 |
| 148 | Shader | ostracon-sparkle |  | onBeforeCompile() { } | 1 | Shader ostracon-sparkle×1 | Mesh | 3 | 47 |
| 149 | MeshBasic | debug-chest | MAP OPAQUE | onBeforeCompile() { } | 1 | MeshBasic debug-chest×2 | Mesh | 14 | 36 |
| 150 | MeshStandard |  | FOG FLIP | (patch chain) | 1 |  |  | 79 | 400 |
| 151 | MeshStandard |  | FOG | (patch chain) | 1 | MeshStandard ×1 | Mesh | 79 | 404 |
| 152 | Shader | umbral-caustics |  | onBeforeCompile() { } | 1 | Shader umbral-caustics×15 | Mesh | 3 | 64 |
| 153 | MeshStandard |  | FOG | onBeforeCompile() { } | 1 | MeshStandard ×1 | Mesh | 77 | 315 |
| 154 | MeshStandard |  | FOG FLIP | sloop-sail | 2 |  |  | 77 | 200 |
| 155 | MeshStandard |  | FOG | sloop-sail | 2 | MeshStandard ×2 | Mesh | 77 | 194 |
| 156 | MeshStandard |  | FOG FLIP | onBeforeCompile() { } | 1 |  |  | 77 | 247 |
| 157 | Shader | shoal-glints | INST OPAQUE | onBeforeCompile() { } | 1 | Shader shoal-glints×1 | InstancedMesh | 6 | 253 |
| 158 | Shader | shoal-boil |  | onBeforeCompile() { } | 1 | Shader shoal-boil×1 | Mesh | 3 | 61 |
| 159 | MeshStandard |  | COLOR FOG DOUBLE OPAQUE | onBeforeCompile() { } | 1 | MeshStandard ×1 | Mesh | 77 | 392 |
| 160 | LineBasic |  | FOG OPAQUE | onBeforeCompile() { } | 2 | LineBasic ×2 | LineSegments | 14 | 40 |
| 161 | MeshPhysical |  | FOG DOUBLE OPAQUE | oil-slick | 2 | MeshPhysical ×32 | Mesh | 78 | 445 |
| 162 | Shader | ship-wake | DOUBLE | onBeforeCompile() { } | 2 | Shader ship-wake×2 | Mesh | 3 | 34 |
| 163 | Shader | mind-geometry | INST DOUBLE | onBeforeCompile() { }\|storm1 | 2 | Shader mind-geometry×2 | InstancedMesh | 8 | 253 |
| 168 | MeshPhysical |  | MAP | onBeforeCompile() { } | 17 | MeshPhysical ×36 | Mesh | 72 | 257 |
| 169 | Shader |  | DOUBLE | onBeforeCompile() { } | 101 | Shader ×142 | Mesh, spiritualLink, Points | 14 | 867 |
| 170 | Shader | glow-down | OPAQUE | onBeforeCompile() { } | 1 | Shader glow-down×1 | post | 3 | 35 |
| 171 | Shader | glow-blur | OPAQUE | onBeforeCompile() { } | 1 | Shader glow-blur×1 | post | 2 | 94 |
| 172 | Shader | glow-accum | OPAQUE | onBeforeCompile() { } | 1 | Shader glow-accum×1 | post | 2 | 56 |
| 173 | Shader | glow-comp | OPAQUE | onBeforeCompile() { } | 1 | Shader glow-comp×1 | post | 7 | 44 |
| 174 | Shader | glitch-screen | OPAQUE | onBeforeCompile() { } | 1 | Shader glitch-screen×1 | screen | 7 | 80 |
| 175 | Shader | aberrant-wipe | DOUBLE OPAQUE | onBeforeCompile() { } | 1 | Shader aberrant-wipe×1 | volume | 8 | 178 |
| 176 | Shader | caster-lensing | OPAQUE | onBeforeCompile() { } | 1 | Shader caster-lensing×1 | volume | 6 | 96 |
| 177 | Shader | caster-timegrade | OPAQUE | onBeforeCompile() { } | 1 | Shader caster-timegrade×1 | volume | 4 | 53 |
| 178 | MeshDepth |  | FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 41 |
| 179 | MeshDepth |  | INST FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 49 |
| 180 | MeshDepth |  | FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | ~100 |
| 181 | MeshDepth |  | SKIN MAP FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 94 |
| 182 | MeshDepth |  | SKIN MAP DOUBLE OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 163 |
| 183 | MeshDepth |  | SKIN MAP DOUBLE OPAQUE ALPHA | onBeforeCompile() { } | 3 |  |  | 12 | 229 |
| 184 | MeshDepth |  | INST COLOR FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 64 |
| 185 | MeshDepth |  | SKIN FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 105 |
| 186 | MeshDepth |  | MAP FLIP OPAQUE | onBeforeCompile() { } | 1 |  |  | 12 | 159 |
| 187 | Shader | shrine-door | FOG | onBeforeCompile() { } | 3 |  |  | 4 | 69 |

Programs with no material listed are the other half of a pair (the back-side program of a double-sided transparent material, a skinned or batched twin) or belong to a material that is not in the scene or overlay (shadow depth programs are made by three itself).
