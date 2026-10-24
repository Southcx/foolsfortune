# Phone readiness audit: rendering, memory, audio, save, loading

Read-only fact-finding for Dovina's mobile plan. Repo `/home/user/foolsfortune`, HEAD `4fa4652e` (2026-10-24), three r170, Vite 6.
Nothing here was run on a phone. Every phone figure is either (a) read from code, (b) measured on this container's headless Chromium
with SwiftShader (a CPU rasteriser: counts and sizes are exact, times are only comparable with themselves), or (c) my inference,
marked "inferred". "Not measured" means nobody has measured it in this repo and I did not either.

What I ran: read the source; `node scratchpad/tier.mjs` (the real `tierFor` from `render/graphics.js` fed fake phone machines);
`dist/` (built 2026-10-24 13:15, one src commit older than HEAD: `4fa4652e`, a UI preview change, so sizes are current to within
noise) served by `vite preview`, opened by playwright as a 844 x 390, devicePixelRatio 3, touch, Pixel-7-UA context
(`scratchpad/phone.mjs`), booted with `?graphics=auto`, a DEBUG kit and 12 s of ticks, `localStorage` read back.
Temporary servers were stopped; no tracked file was touched (the `git status` changes listed are another session's).

---

## 1. Rendering

### 1.1 The pipeline, with file:line

| piece | what it is | where |
| --- | --- | --- |
| Internal resolution | `lines` fixed (480 default), `ratio = min(min(dpr,2), lines / innerHeight)`, `setPixelRatio`, `setSize(innerWidth, innerHeight)`, upscale by the browser's bilinear (or `image-rendering: pixelated`) | `src/render/present.js:64-76` (ratio at :68), `RESOLUTIONS` :23 |
| Boot renderer | `new WebGLRenderer({ antialias: T.visual.antialias, powerPreference: 'high-performance' })`, `setPixelRatio(min(dpr,2))`, ACES tone mapping | `src/main.js:382-390` |
| Scene buffer | `WebGLRenderTarget`, `HalfFloatType`, depth, `samples: T.visual.msaa` (4 at High). The whole scene is always drawn into it; there is no direct-to-canvas path | `src/render/glow.js:102,107` |
| Post chain | MSAA resolve, bright pass at 1/2, down to 1/4 and 1/8, two separable blurs, then one composite (tone curve, sRGB, grade, a NaN-repair loop of up to 40 taps only on bad pixels) into the canvas. 7 small passes + composite. Glow off (Minimum) skips the 7 passes; the composite and the half-float target stay | `glow.js:20-100, 144-186` |
| Overlay scene | a second 3D layer (Lachrimeter tube, Sight, tags...) drawn into the canvas after the composite, Physical-material bodies | `render/overlayscene.js`, `glow.js:185` |
| Shadow | one sun, `DirectionalLight`, ortho +/-17 m (workshop) and +/-32 m following the Courier (Dunes), `PCFShadowMap`, map 1024 (`T.visual.shadowRes`), redrawn every frame at High | `main.js:402-409`, `present.js:73-74`, `core/config.js:357-358` |
| Outline hulls | inverted-hull MeshBasic copy of every character and prop (one shared material on ~818 meshes in the render inventory capture); cheap per pixel, but 36% of the workshop's main-pass draw calls (259 of 711, unsettled) and 18% of the Dunes' | `src/render/outline.js`, `docs/plans/research/RENDER-INVENTORY.md` section 1 item 4 |
| Light budget | 8 pooled `PointLight`s lent to the best-scored lamps, every lit pixel runs all 8 unrolled lamps lit or not | `src/render/lightbudget.js:28-36`, slots set from `T.visual.lightSlots` |
| Camera | near 0.03, far 200, `FogExp2` 0.018 | `main.js:396,~385` |
| Zones | only the zone the camera is in (and what it sees into) is drawn; but every zone is built at boot and stays resident | `src/render/zones.js:1-16` |
| Toon ramp | global patch of three's Lambert/Physical light chunks plus a rim | `src/render/toon.js` (per RENDER-INVENTORY 2.1) |
| WebGL2 only | `getContext('webgl2')`; no WebGL1 path anywhere | `graphics.js:52`; three r170 is WebGL2 only |

Float and WebGL2-only features in use (all core WebGL2 or EXT_color_buffer_float class):
- `HalfFloatType` render targets for the scene, the whole glow chain, frame accumulation, the glitch history, the aberrant wipe, the sparring mirror (with `samples: 4`), the trail map (512 x 512, ping-pong, every frame in the Dunes), the ripple tank (128 x 128 x2). `glow.js:102`, `world/ground/trailmap.js:68-69`, `vfx/glitch.js:197`, `vfx/aberrantwipe.js:261`, `vfx/sparringmirror.js:56`.
- Multisampled half-float renderbuffers: needs `EXT_color_buffer_float` (or the half-float equivalent) on the device. `detectMachine` reads it (`graphics.js:56`) but only to drop to Minimum (`graphics.js:68`); **Minimum still draws into a half-float target** (grade is kept on: `graphics.js:90`, `glow.js:120 get on`). So there is no fallback path if half-float render targets are missing. Common on WebGL2 Android; iOS Safari support for the float/half-float colour-buffer extensions I would verify on a device (not verified).
- `FloatType` data textures: paint map `RGFormat` float 256 x 256 sampled NEAREST (`world/ground/paintmap.js:94`, wall charts `paintwalls.js:35`). Nearest-sampled float textures are core in WebGL2: no `OES_texture_float_linear` needed.
- Skinned meshes use bone textures (vertex texture fetch; core in WebGL2).
- `KHR_parallel_shader_compile`: used only through three's `compileAsync` (`main.js:1125,1137`). Not present in this headless Chromium (`hasParallel: false`, "THREE.WebGLRenderer: KHR_parallel_shader_compile extension not supported" in the log), so the boot measured here is the serial path. Chrome on Android normally has it; Safari: not verified.

### 1.2 Tiers (`src/render/graphics.js:37-41`)

| knob | High | Low | Minimum |
| --- | --- | --- | --- |
| lines (dynamic-res floor) | 480 (400) | 400 (320) | 360 (270) |
| scene MSAA samples | 4 | 2 | 0 |
| canvas `antialias` | true | false | false |
| light slots | 8 | 4 | 2 |
| sun shadow | on, 1024, PCF, every frame | on, 512, basic, every 2nd frame | **off** |
| glow (bloom chain) | on | on | **off** (grade composite and half-float target stay) |
| outline hulls on props beyond | all | 30 m | 15 m (characters' always drawn) |

Which things only change at the next start (program set depends on them): light slots, shadows on/off and filter, glow on/off, canvas
antialias, MSAA (`graphics.js:15-17`). Resolution, shadow size/rate, outline reach change live.

Not in any tier row: draw-call count, triangle count, particle caps, far plane/LOD, trail-map and ripple rates, instrument-canvas rates
(RENDER-INVENTORY.md section 7 lists these as unbuilt levers, "Far effects", "Instrument canvases").

Dynamic resolution (`graphics.js:46,141-157`): median frame interval over a 2 s window against the best interval seen (the display's
refresh); a step down (LINE_STEPS 480, 440, 400, 360, 320, 270) after 3 s of missing it by 25% **and** slower than 18 ms; a step up after
10 s of making it, never within 30 s of a step down. Never below the tier's floor.

### 1.3 What auto-detect reads, and what it would pick on a phone

`detectMachine()` (`graphics.js:49-63`) opens a throwaway WebGL2 context and reads: `UNMASKED_RENDERER_WEBGL` (falls back to
`RENDERER`), `navigator.hardwareConcurrency`, `navigator.deviceMemory`, `EXT_color_buffer_float`, `MAX_SAMPLES`. `tierFor` (`:67-71`):
- Minimum if software GL (swiftshader|llvmpipe|softpipe|software|basic render), or no float targets, or cores <= 2, or deviceMemory <= 2.
- Low if the renderer string matches `intel|mali|adreno|powervr|videocore|radeon vega/graphics|uhd|iris` (and not Arc), or cores <= 4, or deviceMemory <= 4.
- else High.

It does **not** read `devicePixelRatio`, screen size, touch capability, battery/low-power, or `navigator.connection`.

I ran the real `tierFor` over invented machines (`scratchpad/tier.mjs`; the strings and core counts are what I believe each platform
reports, **inferred, not verified on devices**):

| machine | tier |
| --- | --- |
| iPhone 12/13/14/15 Safari (renderer "Apple GPU", 6 cores, no `deviceMemory`) | **high** |
| iPhone SE 2 Safari (same strings) | **high** |
| old iPhone (2 cores) | minimum |
| Pixel 7 / Galaxy A54 / Redmi (Mali, Adreno via ANGLE; 8 cores; deviceMemory 4 or 8) | low |
| Android with deviceMemory 2 | minimum |

So: Android mid-range lands on **Low** (400 lines, MSAA 2, 4 lamps, 512 basic shadow every 2nd frame, outlines 30 m). **An iPhone
lands on High** (480 lines, MSAA 4 scene + a 4x MSAA canvas, 8 lamps, 1024 PCF shadow every frame, all outlines): "Apple GPU" does not
match the integrated-GPU regex, Safari gives no `deviceMemory`, and iPhones report 6 cores. In High the floor for dynamic resolution
is 400 lines.

Measured in this container (844 x 390 CSS px, dpr 3, `?graphics=auto`): the machine read as SwiftShader, so `tier: minimum`,
`resolution: 360`, `msaa: 0`, `shadows: false`, `lightSlots: 2`, `glow: 0`, `outlineReach: 15`; drawing buffer **779 x 360**
(`pixelRatio 0.923`). By the formula a High phone landscape 844 x 390 is `ratio = min(2, 480/390) = 1.23` -> **1039 x 480**;
portrait (390 x 844) is `480/844 = 0.57` -> 222 x 480 (the game has no portrait layout). Phone GPU limits are not testable here
(SwiftShader reports MAX_TEXTURE_SIZE 8192, uniforms 4096, MAX_SAMPLES 4, 30 extensions).

Resize cost: `Presentation` re-applies on every `resize` (`present.js:60,64`), calling `renderer.setSize`; `Glow.resize()` then reallocates
every target (incl. the MSAA one) when the drawing buffer changes (`glow.js:116-127`). On mobile `innerHeight` changes as the browser
bar collapses and on rotation. Not measured; flagged as a hitch source (inferred).

### 1.4 Shaders and warm-up

- Programs alive: **177 workshop, 178 Dunes/Well, 198 Garden/crossing/spectacle** (`scripts/perf-baseline.json`); budget 200 (`ARCHITECTURE.md` Budgets). This container's phone-viewport boot: 173 at ready (Minimum tier).
- 21 programs compile after the warm-up (`lateProgs: 21`, baseline), the Spirit Garden's own; every other room is compiled behind the loading screen.
- Everything is compiled at boot, blocking: `main.js:1086-1150` parks one copy of every room's looks, calls `compileAsync` twice, `post.compile()`, `overlayScene.compile()` and `primeDraw` (:350, :1147). The loading page says only "FIRING THE KILN..." (`index.html:57`); there is no progress.
- Boot time, SwiftShader (CPU), at the phone viewport, built game: **59.1 s to ready**, of which the shader stage was **~22 s** (marks: `weir+treasure+ach` 36.97 s -> `shaders` 59.09 s). The perf baseline says the same (`bootS: 59.1`). A software rasteriser pays at first draw, so this is not a prediction for a phone GPU, only a size of the work.
- Shader size: lit Standard programs average ~80 KB of fragment source, 28 plain-Standard programs (RENDER-INVENTORY 2.2), with 8 unrolled point lights, PCF shadow receiving, the toon ramp and (on world surfaces) the paint map patch. Per lit pixel, Standard costs 1.5 to 2x Lambert (micro-bench, SwiftShader). The "Standard to Lambert" move is a proposed lever, not built.
- Shaders are keyed by render target and light/shadow state: switching glow, shadows or lamp count after boot would add ~70 programs (RENDER-INVENTORY 2.6), which is why the tier is a boot-time choice.
- Phone GPU compile times: not measured.

### 1.5 Render-target and texture memory (GPU side, from the render inventory, 853 x 480)

~47 MB of render targets at 480 lines: scene 19.7 (RGBA16F x 4 MSAA + depth), resolve 3.3, depth 1.6, shadow 8.4, canvas MSAA 13, chain 1.3, +4.2
for the Dunes' trail map (`RENDER-INVENTORY.md` section 4, line 205). Scaled to a High phone landscape buffer (1039 x 480, x1.22) that is about 57 MB,
inferred. Minimum drops the scene MSAA, the canvas MSAA and the shadow (about 31 MB of the 47 at 853 x 480, arithmetic).
Texture memory is **not measured** (info.memory.textures 207 to 268 objects; the biggest known canvases: house-deck atlas 2048 x 2048
`vfx/bazaarfaces.js:43`, logofire 2048 x 512, Sight atlas 1024 x 656; the paint-map and glaze atlases are 256 x 256 and 128 x 128 `world/ground/paintmap.js:32`). `PAINT.md:34` budgets "+16 to 64 MB GPU" for paint.

---

## 2. Measured budgets

### 2.1 The gate (`docs/ARCHITECTURE.md:108-130`, `scripts/perf.mjs`)

| measure | budget | latest baseline (`scripts/perf-baseline.json`, build `a0a7697`, 2026-10-23) |
| --- | --- | --- |
| draw calls a frame | 450 (desktop RTX 3060 Ti on Firefox ~26 us a call on the CPU: 177 calls = 4.68 ms) | workshop **418**, Dunes 213, Well 76 (own budget 88), Garden 198, crossing 45, spectacle 49 |
| triangles a frame | 1,000,000 (raised from 350k "get a lil crazy") | workshop 178k, Dunes 264k, Well 141k, Garden 117k, crossing 106k |
| shader programs | 200 | 177 / 178 / 178 / 198 / 198 / 198 |
| JS heap, built game | 320 MB | **294 MB** (workshop + Dunes + a Dunemaw hall, gc'd) |
| JS heap, dev server | 600 MB | 475 MB; 493 MB with the Garden |
| tick / draw time | none (relative, +25%) | workshop tick 8.3 ms (p95 12.1, max 12.8), draw 894 ms (SwiftShader) |
| module size | 800 lines | baseline only falls |

`npm run perf` measures: draw calls and triangles (every pass), programs/geometries/textures alive, CPU tick (60 frames: median, p95,
max), draw time up to a 1-pixel readback sync, JS heap (dev, and built game via `vite preview`), boot seconds, programs compiled after
the warm-up, big things no zone hides. It uses headless Chromium + SwiftShader at 960 x 540. **It does not measure**: GPU time, GPU or
texture memory, wasm (Rapier) memory, typed-array/external memory (`usedJSHeapSize` omits it), any mobile CPU, or the Raceway.

### 2.2 CPU facts that matter most for a phone

- Tick (simulation + animation, no draw), desktop-class container core: workshop 9.4 ms, Dunes 10.6, Well hall 7.6, Garden 4.3 ms median (`docs/plans/research/TICK-PROFILE.md` section 0; later baseline 8.3 / 7.7 / 7.0 / 4.0). Fixed 1/60 s physics steps, up to 4 a frame (`main.js:1314-1317`); at 30 fps each frame runs 2 steps, at 20 fps 3, and `dt` is clamped to 0.05 (`main.js:1187`), so a slow device runs the world in slow motion rather than skipping.
- Draw CPU side: **27 ms workshop (23 to 31), 20 to 43 ms Dunes** at 679 GL draw calls in the workshop (shadow pass and overlay included) and 509 in the Dunes, ~30 to 40 us a call (TICK-PROFILE section 0). The tick and the draw's CPU side together are over a 16.7 ms frame on this machine in the workshop; the owner's desktop shows 177 calls at 4.68 ms.
- No mobile CPU number exists. As arithmetic only (inferred, not measured): a mid-range phone core is commonly 3 to 5x slower than a server core at this kind of JS/WASM work, which would put the workshop's tick plus draw submission in the order of 100+ ms a frame before the GPU. This is the single biggest unknown.
- The budgets are calibrated to a desktop (450 calls, 1M triangles). There is no mobile budget row.
- The shadow pass is 337 of the workshop's 1,087 real GL draws (31%) and is not in the gate's call count (`info.autoReset` clears after it); outline hulls add 36% to the main pass (RENDER-INVENTORY 3.1, 3.3).

### 2.3 Memory

- Built game JS heap: **294 MB baseline; 273 to 282 MB measured in this run** at the workshop right after boot (gc'd after the kit). Budget 320 MB.
- Dev heap 475-493 MB (includes source text and maps; not a player's).
- The Raceway: `src/world/raceway/raceway.js:12-14`, casebook 2026-10-15 (`docs/CASEBOOK-CASES.md:3104-3118`): built game 290 MB at boot, **452 to 467 MB inside**; the park's terrain is 108 MB on a 1,057 x 1,057 grid (positions+normals 29, chunk index lists 42, index buffer 31, heights 4.5) plus 5 for its physics height field; "the ground is lent": `releaseGround()` after 10 real seconds away gives it back, `buildGround()` rebuilds in 0.74 s built. After leaving: **364 MB** (not back to 295; the kit, rails and dressing stay). Raceway peak is not in the gate.
- The Spirit Garden is built on first entry (`world/garden/realm.js:70`, ~10 MB); 493 vs 475 MB dev heap with it. A planetoid's water is 0.8 MB each. Lekythos paintings ~5 MB each (`vfx/garden/lekythos.js:20`).
- No other per-room memory figures exist. Everything else (workshop, basement, Dunes, a Well floor, the Emocean's crossing, bazaar) is built at boot and stays resident (no unloading; zones only hide). `geos 2042-2210`, `tex 234-268` objects.
- Not in any number: Rapier's wasm memory (the physics world has ~1,860 colliders, 828 bodies in the workshop per TICK-PROFILE), canvas/ImageBitmap decoded pixels (casebook rule at `CASEBOOK.md:317`, `CASEBOOK-CASES.md:1477` "216 MB of pixels" once), GPU memory, the 13 MB of script text V8 holds.
- Phone memory ceilings (inferred, from general knowledge, not tested): iOS Safari kills a tab by jetsam well before total RAM, and 3 GB iPhones have far less headroom than 6 GB; Android background tabs are discarded freely. A 300 MB JS heap plus ~60+ MB render targets plus textures plus wasm is plausible on a 6 GB phone and is the kind of figure that gets a 3 to 4 GB phone's tab killed. Unknown without a device.

---

## 3. Build size and loading

`npm run build` was not needed: `dist/` is current (built 13:15 today; HEAD is one UI-only commit later). `dist/` total **30,831,517 bytes (30.8 MB)**.

| file | raw | gzip -9 (computed here) | loaded |
| --- | ---: | ---: | --- |
| `game.js` (all game code + base64-inlined models, textures, fonts, UI pngs, `anims.bin`) | 13,285,389 | 6,345,333 | at start |
| `rapier-*.js` (Rapier with its wasm inlined as base64) | 4,334,395 | 1,651,734 | at start (modulepreload) |
| `three-*.js` | 768,225 | 197,529 | at start (modulepreload) |
| `core-*.bin` (the Courier's core clip pack, 3.0 MB int16) | 3,004,786 | 2,290,152 | fetched before the Courier is built (`courier/anim/suite.js:26`) |
| `lantern_wisp-*.js` (model, `await import` in boot, `main.js:850`) | 1,551,325 | 541,715 | at start |
| `ground_pack-*.webp` | 180,210 | 180,284 | at start |
| `chess-*.bin` (title pieces) | 408,224 | 82,581 | title |
| `psygun_first-*.js` | 121,261 | 24,545 | at start (in the measured request list); the other three variants load on equip (`vfx/psygunmodels.js:28-31`) |
| `social-*.bin` (emotes, dances; 5.4 MB) | 5,449,328 | 3,950,629 | **lazy**: first emote (`suite.js:10-13`) |
| `solarskiff-*.js` (1.1 MB model) | 1,130,017 | 430,424 | lazy: first skiff (`courier/skiff/boat.js:130`) |
| `psygun_bombardier/carbine/pepperbox` | 141k+126k+156k | ~83k | lazy on equip |
| `stages-*.js`, `cardsheet-*.js` | 175k | 66k | workbench only |
| `index.html` | 6,134 | ~2.5k | |

- Measured requests in this run (cold, to ready): **7** (`game.js` 13.3 MB, rapier 4.3, core.bin 3.0, wisp 1.55, three 0.77, psygun_first 0.12, index). Body sizes before gzip; `vite preview` serves gzip, a production host's compression is not known (the .bin and .webp barely compress).
- **Boot path ~23.5 MB raw, ~11.3 MB if the host gzips** (sum of the "at start" rows incl. chess.bin). Lazy extras ~7.3 MB raw / ~4.6 MB gz.
- `game.js` is 79% of the publish host's 16 MiB-a-file limit (`vite.config.js:25-26` comments: three.js and Rapier were split out when it went over). Source is 13.76 MB across 1,169 files before minify; ~4 to 5 MB of `game.js` is base64 assets (inlined: `anims.bin` 0.9 MB, `courier.glb` 0.4, `godhand.glb` 0.43, `liquid_pack*.webp` 1.0, textures, fonts, the Courier's pngs). A phone must download, parse and compile one 13.3 MB script, plus decode the base64 (`core/base64.js` notes its decode was made fast, 6 to 7 ms for 1.5 MB). Parse/compile time on a phone: not measured.
- Dev-only code ships too: `src/workbench/` (355 KB source) is imported statically (`main.js:189,941`) and QAIS (`debug/qais/`) unless built `VITE_PUBLIC=1` (`main.js:342`); `diag.js` (F3) too.
- Per-room lazy loading: **no**. All rooms, props and tools are built in the one scene at boot; only the Raceway's ground, the Garden realm (first entry), a Well floor (on entry), the social clip pack, the skiff, three psygun variants and the workbench are deferred. There is no service worker, no manifest, no offline cache.
- Network resilience: pack fetches have no retry/progress UI that I found (not audited in depth).

---

## 4. Audio

- **Everything is synthesized**: no .mp3/.ogg/.wav/.m4a anywhere in the repo or `dist/`; no `decodeAudioData`, no `<audio>`, no `AudioWorklet`. The music is live FM/subtractive synthesis scheduled ahead of the audio clock (`music/player.js:1-20`, `arranger.js`, `band.js`); sounds are noise/oscillator bursts built per call (`audio/core.js`); the System's voice is a formant synthesizer (`audio/voice/speech/synth.js`). 93 files under `src/audio` and `src/music`, ~860 KB of source. Zero audio bytes to download.
- **Unlock**: `Sfx.unlock()` creates the `AudioContext` (`window.AudioContext || webkitAudioContext`, no options, so default latency hint and device sample rate) and resumes a suspended one (`audio/core.js:15-17`). Called from the first gesture only: the overlay BEGIN click `main.js:1010-1011` and the title's start/menu handlers `title/ui.js:64,68`. Correct for iOS and Android autoplay rules. No `statechange` listener, no handling of iOS's `interrupted` state (call, Siri, backgrounding) beyond the next `unlock()`; no `visibilitychange` resume. `voice.js:50` drops lines while `document.hidden`. iOS's ringer switch muting Web Audio is a platform behaviour, not handled (and cannot be in code).
- **Graph (always on once unlocked)** (`core.js:18-46`): master/main gains, 2 lowpass filters (fog, under) + slow-time lowpass, one `DynamicsCompressor`, **two `ConvolverNode`s** (1.4 s stereo noise impulse each, sharing a buffer), loop bus. Music adds **a compressor and a 3.2 s convolver** in the arranger (`arranger.js:40,47`), **a 3.6 s convolver** in the player (`player.js:108`, plus a 3.4 s per-voice-group one at :84), and the Crucibelle a 2.6 s one (`tools/crucibelle/crucibelle.js:110`). So up to ~5 convolvers and ~3 compressors can be live at once, each a reverb of seconds on a stereo impulse at the device sample rate (44.1 or 48 kHz; impulses are filled with `Math.random` at creation: ~350k samples for the longest, trivial).
- **Voices**: no global cap. Only a per-key rate limiter `allow(key, perSec)` (`core.js:87`) and a queue of 4 for the System's voice (`voice.js:35`). Each sound spawns its own oscillator/filter/gain nodes that stop themselves. Music: the band schedules notes ahead from a `setInterval` of 50 ms (`arranger.js:77`, `player.js:134`); other loops run on their own intervals (ambience, garden 71, opensea 36, puzzleduel 236, seachart 64, angling song 49, raceway wet 100 ms / grind 90 ms). Count of simultaneous oscillators/buffer sources, and audio-thread CPU: **not measured**.
- Heavy DSP, in order of likely phone cost (inferred): the convolvers; FM music with reverb and a dotted echo; many short noise bursts each with a biquad. Chrome Android runs Web Audio on a separate thread; Safari iOS less predictably. If the main thread stalls (a 100 ms compile or GC), the 50 ms lookahead scheduler can underrun.
- Background: timers throttle (Chrome mobile ~1 Hz, iOS pauses) while the audio clock may run or suspend; the lookahead scheduler has no visibility handling. Not audited beyond reading.

---

## 5. Save

- `game.save` (`src/core/save.js`) = **`window.localStorage`** only (`save.js:44-47` constructor; `try`/`catch` around every access, `null` store tolerated). No IndexedDB, no `navigator.storage.persist()`, no service worker. The `check` rule bars new `localStorage` outside `save.js` (the ADOPTED list: `save.js:36-42`; a grep finds 35 other lines outside `save.js`, `debug/` and `workbench/` that still touch `localStorage`, e.g. the voice and music settings `foolsfortune.voice.v2`, `foolsfortune.music.v1`, `audio/voice/voice.js:36,41`).
- Format: three records, `foolsfortune.save.{player,world,settings}`, each the whole scope as one JSON text, written whole when any section is dirty; `main.js:1343` calls `save.flush()` once a frame. Writes are synchronous `setItem` on the main thread; a whole scope is `JSON.stringify`ed each time anything in it changes (the ledger debounces itself 5 s: `progress/stats.js:78-84`). On a `setItem` failure (quota, private mode, iOS eviction) `write()` returns false and **nothing tells the player** (`save.js:60`).
- Size measured: **a fresh DEBUG save with the whole kit and ~12 game seconds of ticks: `save.player` 4,199 chars, `save.world` 1,006, plus 5 small adopted keys: 5,866 chars total; `export()` 7,062 chars; the paste-able code (`code()`) 9,430 chars.** A long session's ledger and Codex will be bigger; **not measured** (I did not play one). The 5 MB class quota is nowhere near for this shape; the 5 s debounce is the exposure.
- Progress (`player`, `world`) is wiped on every new build (`save.boot`, `save.js:73-85`); settings are kept. A STORY and a DEBUG shelf live in the same storage (`shelve/unshelve`).
- **Loss paths on a phone** (inferred from platform behaviour, the code has no mitigation): no `pagehide`/`visibilitychange`/`beforeunload` handler anywhere in `src/` (grep: none) so the ledger's pending <=5 s and anything written by an adopted writer are lost if iOS kills a backgrounded tab (the per-frame `flush` writes sections that were marked dirty, so most state is current); iOS Safari's 7-day script-writable-storage cap (ITP) applies to pages not installed to the Home Screen, and there is no manifest/PWA path; the page runs as a published artifact (own origin per artifact; whether it is inside an iframe on a given surface is not in the repo; iframe storage is partitioned/blocked on some mobile browsers). Private browsing: `localStorage` can throw; the game falls back to no saving without saying so.
- Backup exists: `save.export()`/`code()` ("FFS2." + base64 + checksum, the Codex's EXPORT CODE) and `fromCode()`. Cloud sync: none.

---

## 6. Platform

| item | state | where |
| --- | --- | --- |
| viewport meta | `width=device-width, initial-scale=1` only. No `viewport-fit=cover` (no notch/safe-area handling: no `env(safe-area-inset-*)` anywhere), no `maximum-scale`/`user-scalable=no`, no `theme-color`, no Apple web-app metas | `index.html:5` |
| touch | **none**: no `touchstart/touchmove`, `maxTouchPoints`, gamepad, virtual stick. Input is keyboard + mouse with pointer lock (`core/input.js:1-80`). Only a few UI canvases use `pointerdown` (windows, seal picker with `touch-action:none` at `ui/sealpicker.js:102`, bug markup, score ceremony). No `touch-action`/`overscroll-behavior` on the canvas or body (only on `#overlay .card`), so pinch/double-tap zoom and pull-to-refresh are not blocked | `input.js`, `index.html:9-11,26` |
| pointer lock | needed for look; refused in iframes/some mobile browsers -> a "free-cursor look" fallback exists (`input.js:1-2,54-58`, `index.html:68` warning) | |
| fullscreen | **not used** (no `requestFullscreen`) | grep none |
| orientation | **no lock, no portrait layout**; the 480-line buffer would be 222 x 480 portrait | |
| wake lock | none | |
| backgrounding | no `visibilitychange`/`pagehide` handler. rAF stops by itself when hidden; the loop clamps `dt` to 0.05 (`main.js:1187`) so there is no catch-up burst; the calendar is the wall clock (`core/calendar.js:12-13`) so the world's "game day" and weather turn regardless. Only `voice.js:50` and `graphics.js:131` test `document.hidden` | |
| window blur | `input.down.clear()` only (`input.js:34`) | |
| devicePixelRatio | main canvas capped at 2 (`main.js:384`, `present.js:67`), then limited by `lines / innerHeight` so a phone never exceeds ~1.23 at 480 lines. Several DOM/2D canvases use the raw `devicePixelRatio` (seachart `ui/seachart/seachart.js:283,315`, `ui/mountviews.js:81,98`, `ui/icons/icons.js:87`, `ui/pixel.js:69,139`) or cap at 2 (`garagesheet.js:137`, `cartography.js:498`, `celestialtargets.js:56`) | |
| WebGL context lost | the game has **no** `webglcontextlost/restored` listener. three r170 registers its own (calls `preventDefault`, reinitialises state and re-uploads on restore), so a restore should happen, but: every program (177-198) would have to recompile (the boot's ~22 s on SwiftShader), render targets are recreated blank, and the game neither pauses nor tells the player. Phone GPUs lose contexts on backgrounding/memory pressure more often than desktops (inferred). Untested | |
| error handling | `error` / `unhandledrejection` print a red box at the top-left, once per message (`main.js:1163-1178`) | |
| `renderer.debug.checkShaderErrors` | off in the built game (no blocking link-log read per program) | `main.js:383` |
| shadow cost trims | casters under 6 cm dropped at boot (`trimShadows`) | `main.js:1095` |
| console noise seen in this run | 404 (one missing resource), repeated "authored ladderUp / poleSlide: contacts out of reach" animation warnings | headless log |

---

## Top risks for phones, ranked

1. **CPU frame cost is the wall, and it has never been measured on a phone.** The desktop numbers already put tick (4 to 10 ms) plus draw submission (20 to 43 ms CPU side, 679 GL calls in the workshop incl. the uncounted shadow pass and 259 outline-hull draws) near or over 16.7 ms on a server core; the gate's budgets (450 calls, 1M triangles) are desktop-calibrated; no tier lowers the call count; a 30 fps phone doubles the physics steps per frame. Needs a real-device number before any plan sets a target.
2. **Boot: ~23.5 MB (~11.3 MB gz) before the first frame, one 13.3 MB script, and all 177-198 shader programs compiled behind a text-only loading screen** (~22 s of a 59 s boot on SwiftShader; a phone GPU's figure unknown; Safari's parallel-compile support unverified). One lost context re-pays it.
3. **No touch (or gamepad) input at all, pointer lock required, no portrait/safe-area/fullscreen/orientation handling.** The game cannot be played on a phone as it stands; this is a build, not a tuning, problem (outside render/audio/save but it gates every test above).
4. **Memory headroom is thin for 3 to 4 GB phones**: 273 to 294 MB JS heap + ~57 MB render targets at High + uncounted textures/wasm/V8 script text; Raceway 452 to 467 MB inside, 364 after; all rooms resident. Unmeasured on device (iOS jetsam limits are not in the repo).
5. **Auto-detect picks High for iPhones** ("Apple GPU" matches no rule, no `deviceMemory`, 6 cores), with a 400-line dynamic-resolution floor, 4x MSAA on the scene and on the canvas, 8 lamps, PCF shadows every frame; and Android lands on Low, whose own floor (320 lines, MSAA 2) is untested. The detector ignores dpr/screen/touch/low-power mode.
6. **Hard dependency on half-float (and multisampled half-float) render targets**: a device without `EXT_color_buffer_float`-class support gets Minimum, which still renders into a half-float target (no direct-to-canvas path), so the "fallback" would not draw. iOS support unverified.
7. **Save loss on backgrounding and silent write failure**: synchronous whole-scope localStorage writes, 5 s ledger debounce, no `pagehide`/`visibilitychange` flush, no `storage.persist()`, no write-failure notice, iOS 7-day eviction for non-installed pages; the data itself is tiny (5.9 KB fresh).
8. **Audio resilience**: AudioContext is unlocked correctly, but no `interrupted`/`statechange`/visibility recovery, 50 ms `setInterval` schedulers that background throttling stalls, ~5 live convolvers + 3 compressors + uncapped voices (cost on phone audio threads unmeasured), and the iOS ringer switch.
9. **Resize/URL-bar/rotation hitches**: every `resize` re-runs `setSize` and reallocates the whole glow chain (incl. MSAA) (`present.js:60,64`, `glow.js:116`).
10. **Dev code in the shipped bundle**: workbench (355 KB source), QAIS and diag are in `game.js` unless built `VITE_PUBLIC=1`.

## Already in good shape

- **Fixed internal resolution** (480 lines whatever the window) decouples fill cost from the screen: a phone gets ~0.5 MP (1039 x 480), 3 to 4 MP physical pixels are never shaded; the DPR is capped at 2; the buffer is not resized by a 3x phone dpr.
- **Tiers and dynamic resolution already exist** as boot-time rows: Low and Minimum already turn off MSAA, shadows (Minimum), the glow chain (Minimum), cut lamps to 4/2, thin the outline hulls, and step lines down to 320/270; Minimum for deviceMemory <= 2 or <= 2 cores, Low for Mali/Adreno/Intel strings; `?graphics=` overrides for tests.
- **No mid-play shader hitches**: everything is compiled in the warm-up (21 late programs, the Garden's, a known list); shaders cut by folds to stay under 200; `checkShaderErrors` off in the build.
- **Frame-cost hygiene is policed**: perf gate with budgets and baselines; propbatches, rest bakes, mergeStatic; zones hide other places; light budget keeps the lamp count constant; shadow casters under 6 cm trimmed; big arrays lent back (Raceway ground).
- **Audio is zero download and synthesized**, unlocked on a gesture, with rate limits and a 4-deep voice queue; `document.hidden` guards the System's voice.
- **Save design is robust and small**: sectioned, versioned, migrated, checked, written whole per scope, `try/catch` everywhere, 5.9 KB for a fresh full-kit DEBUG save, an export/import code exists; `localStorage` is fenced into one file.
- **Time is the wall clock and `dt` is clamped**, so backgrounding cannot produce a catch-up burst or a lost day.
- **WebGL2 only, no exotic extensions**: nearest-sampled float data textures, half-float linear filtering core in WebGL2; `KHR_parallel_shader_compile` used when present.
- **Lazy fetches already exist** for the biggest optional blobs (social clips 5.4 MB, skiff, psygun variants) and the clip data is decoded lazily on first sample.
- **The game says when a script error happens** (red box) instead of freezing silently.
