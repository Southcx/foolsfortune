# Where the CPU time of one frame goes: the tick in four places, and the draw's CPU side

> Measured 2026-10-19 for the deep clean, by Petra's agent. What landed (Petra's files): items 1, 3, 4 (wisps, clapperjars), 5 (4 Hz), 6, 10, and the fins' single pass. Open: 2 (the fish's shader swim), 7, 8, 9 (Calissa's), the smaller ones in section 4.

For Petra (Main): the owner's goal is that the game runs smoothly on a junk laptop. Measured on `7ffdd20` (this worktree), no source edited. Everything here was measured by scripts in `/tmp/claude-0/-home-user-foolsfortune/7ddd9ef9-14a1-57fc-9770-50b98014ffca/scratchpad/clean/` (section 7).

Stonemason's summary first, then the numbers.

## 0. The short version

| | workshop | Dunes (oasis) | Great Dunemaw, bottom floor (hall) | Spirit Garden (gate) |
|---|---|---|---|---|
| **tick, median of 300, no draws** | **9.40 ms** | **10.60 ms** | **7.60 ms** | **4.30 ms** |
| mean / p99 / max | 10.4 / 20.0 / 49.5 | 12.9 / 60.1 / 100.2 | 8.2 / 21.7 / 77.8 | 5.7 / 41.7 / 84.8 |
| tick right after a synced draw (the way `scripts/perf.mjs` times it, median of 60) | 14.1 | 14.3 | 11.7 | 8.4 |
| baseline in `scripts/perf-baseline.json` (build 7bd3018) | 14.2 | 13.3 | 15.3 | 9.8 |
| tick with the JIT fully warm (the A/B base rows, section 4) | 5.8 to 7.4 | 8.0 to 11.5 | 7.2 to 9.2 | 4.2 to 5.9 |
| the same ticks under my per-system timers / under the CPU profiler | 8.3 / 12.7 | 10.3 / 16.4 | 7.6 / 10.8 | 4.4 / 5.8 |
| **draw, CPU side only** (`G.draw()` timed before the GPU sync) | 27 ms (23 to 31) | 20 to 43 ms (it moved 2x between probes) | not measured | not measured |
| draw calls in one `G.draw()` (shadow pass and overlay included) | 679 | 509 (338 without the 16 Weir fish) | not measured | not measured |

What the numbers say, in order of how much I would act on them:

1. **The draw's CPU side is roughly two to four times the tick** in this environment (30 to 40 us a draw call, about 680 calls in the workshop, 510 in the Dunes). A junk laptop spends more of its frame in `renderer.render` than in `tick`. The tick is still the part with the cheap wins.
2. **The single largest waste in the tick is Rapier's JS bookkeeping after each physics step**: `World.step` ends in `mapNewSoftBodies()`, which walks all 1,860 colliders and 828 bodies through wasm-to-JS callbacks and does nothing for this game. It costs **1.3 to 1.5 ms a tick in every place (measured by patching it out: about 15 to 25% of the tick, 12 to 35% depending on which median you divide by), twice what the physics step itself costs**, and it is 29 to 45% of all the garbage the tick makes. At 30 fps the fixed loop runs 2 steps a frame (3 at 20 fps; the dt clamp is main.js:1089, the loop main.js:1214), so it doubles or triples there.
3. **Whatever world you are not in is still simulated.** In the Spirit Garden the garden's own update is 0.42 ms of the 4.4 ms tick, while the world's physics step and sync, 298 pots, 6 clappers, 4 wisps, spawn blocks, light budget, zones and interact cost about 3.2 ms (73%); a patch that stops only the creatures, props and a few updaters there takes the tick from 4.2 to 2.4 ms. The Dunes' own systems early-out properly when you are away (`dunes.js:410`); the creatures, props and clappers have no such gate.
4. **The Weir's 16 fish are the Dunes' biggest feature cost**: 1.2 ms of tick, plus **172 draw calls (338 -> 510)**, of which 55 are fin triangles that three.js draws twice and re-resolves the shader program for, twice, every frame.
5. Everything else is a long flat tail of 0.1 to 0.6 ms items (section 3 and 4). No O(n^2) loop larger than about 10 x 10 turned up; the loops that hurt are linear over big lists (5,300 scene objects, 2,688 Rapier handles, 477 synced bodies, 298 pots, 87 lamps).

### How to read the numbers

* Environment: this container (4 cores), headless Chromium (playwright 1.56.1's `chromium-1194`) with SwiftShader GL, 960 x 540, vite dev server (unminified, readable names), `?clock=1791160275000`, 1 vite server on 127.0.0.1:5191, set up as `scripts/perf.mjs` does. The game runs in **DEBUG mode with the whole kit** (`game.mode ||= 'debug'`, main.js:1401), so all seven tools are worn; a STORY player early on wears fewer, and `poseHands` is correspondingly cheaper.
* "Tick" is `G.tick(1/60)` alone, 300 times in a row with no draws between them, after a 60-tick warm-up (6 draws in it) and the 70-iteration perf-style pass (70 more draws). That is the number you asked for. It is **JIT-cold-ish**: later passes in the same page ran 10 to 30% faster (the "JIT warm" row). A tick that follows a draw (perf.mjs's way) costs about 50% more here, probably because SwiftShader's rasteriser has just thrashed the caches; on a real GPU I would expect the plain number, not the perf-style one.
* Percentages in the function tables are shares of the profiled tick. The profiler (100 us request, about 240 us actually delivered) adds roughly 30% (12.7 ms profiled against 9.4 plain in the workshop). Ranks are trustworthy; absolute ms are ~30% high. The per-system timers (section 3 and 4) and the A/B patches have less overhead and are the numbers I quote as "ms".
* The A/B patches (section 4) are monkey-patches in the page, five rounds of 100 ticks each side, baseline alternated with patched. Resolution is about +/- 0.4 ms on a median; where an effect is smaller than that I say "not resolved" rather than give a number. The draw-side A/B is worse (+/- 3 ms; the draw CPU moves 2x between runs), so I lean on the profile and the call census there.
* The GPU side is SwiftShader (1.4 to 5 s a draw) and says nothing about a junk laptop's GPU. I report only the CPU side of the draw.
* One of the six unsynced draws in the census probe blocked 3.8 s inside the call (the software GPU's command queue backing up); I left it out of the 27 ms. On a real GPU that does not happen.
* `m.ticks`, `evaluate` and `(program)` rows in the profiles are my harness loop and native time; ignore them.

## 1 and 2. Per place: tick median, the top 25 functions by self time, the module rollup

How to read a row: *self %* is the function's own time as a share of the profiled tick, *incl. %* the time with everything it called. A function V8 inlined into another is charged to the caller (`tick`'s own 5 to 7% is mostly `physics.sync`, `breakables.update` and the fx updates inlined: position ticks at main.js:1235, :1324, :1355). The module rollup has two columns: *module (self)* is where the time is spent; *owner* charges three.js, Rapier and native time to the nearest `src/` function that called it, which is the view that says whose code to change.

### The workshop

Tick: **median 9.40 ms**, mean 10.38, p90 14.1, p99 20.0, max 49.5 (300 ticks, no draws, no profiler). Under the profiler the same ticks cost 12.67 ms (percentages below are shares of that).

| # | self % of tick | ms/tick (profiled) | incl. % | function | file:line | what it does |
|---|---|---|---|---|---|---|
| 1 | 7.7% | 0.972 | 10.2% | `updateMatrixWorld` | node_modules/.vite/deps/chunk-G7K22NUO.js:4766 | three Object3D.updateMatrixWorld: recompose the local matrix and multiply down to every child. In the tick it is the Courier rig (`root.updateMatrixWorld(true)` after each pose/IK step in character.js animate, standoff.apply, each tool's hands(), footIK, aimBone) and light/physics code |
| 2 | 5.0% | 0.632 | 96.2% | `tick` | src/main.js:1163 | the frame's simulation step; its self time is small functions V8 inlined into it (position ticks: line 1235 physics.sync, 1324 breakables.update, 1355 the fx updates, 1260 techs.tick) |
| 3 | 3.2% | 0.402 | 3.9% | `updateWorldMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4785 | three Object3D.updateWorldMatrix: what getWorldPosition/Quaternion/Direction call; walks up the parent chain re-multiplying. The rig code calls it hundreds of times a tick (footIK, holdNeck, guardKnees, aimBone, LightBudget.update) |
| 4 | 2.5% | 0.315 | 2.5% | `stale` | src/render/propbatch.js:108 | PropBatch.stale: per parked pot per tick, compares material, geometry, the attribute-version sum (gver) and position/quaternion/scale to see if it changed since it was parked (called by Breakables.rest, 244-257 of 298 pots parked) |
| 5 | 2.4% | 0.306 | 2.4% | `multiplyMatrices` | node_modules/.vite/deps/chunk-G7K22NUO.js:3768 | three Matrix4.multiplyMatrices: the multiply under the two above |
| 6 | 2.4% | 0.300 | 2.4% | `update` | src/render/propbatch.js:141 | InstancePool.update: every rope segment (136) gets updateMatrix + setMatrixAt each tick and the whole instanceMatrix is flagged for upload (Breakables.ropeDraw) |
| 7 | 2.3% | 0.291 | 2.3% | `deepest` | src/courier/anim/bodyproxies.js:100 | BodyProxies.deepest: the hand-vs-body test of standoff.apply (keeps hands out of the torso): every hand/forearm point against every body proxy, each depth() allocating; run twice per poseHands |
| 8 | 2.3% | 0.288 | 6.4% | `wasm-to-js` | (native) | V8 wasm-to-JS call trampoline: the cost of Rapier's wasm calling the JS callbacks above, ~1,860 + 828 times per step |
| 9 | 2.3% | 0.287 | 8.6% | `update` | src/world/props/breakables.js:887 | Breakables.update: for every one of the 298 pots (all zones): settle() + rest() (isValid/isDynamic/isSleeping Rapier calls, stale() for parked ones), plus the rope, slice and shard lists |
| 10 | 2.1% | 0.269 | 2.1% | `(garbage collector)` | (native) | V8 scavenges / marking; see section 5 |
| 11 | 2.0% | 0.251 | 5.7% | `wasm-function[1174]` | wasm://wasm/00bc1dde:1 | Rapier wasm: forEachColliderHandle, the loop that calls mapNewColliders' JS callback for each of the ~1,860 colliders (more in the Well) (the post-step bookkeeping, not the physics) |
| 12 | 1.8% | 0.227 | 1.8% | `blocksUpdate` | src/vfx/spawnlook.js:301 | SpawnLook.blocksUpdate: 192 instanced pixel blocks rewritten (setMatrixAt scale 0, setColorAt) and flagged for upload every tick with no spawn effect running |
| 13 | 1.7% | 0.217 | 4.7% | `sync` | src/core/physics.js:110 | Physics.sync: for each of the 477 synced bodies (counted in the workshop and Dunes), translation() + rotation() from Rapier (2 wasm calls, 2 allocated objects) and mesh.position.set/quaternion.set, asleep or awake |
| 14 | 1.3% | 0.170 | 1.4% | `wasm-function[61]` | wasm://wasm/00bc1dde:1 | Rapier wasm: a solver/island routine inside the pipeline step |
| 15 | 1.2% | 0.151 | 1.5% | `(anonymous)` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6571 | rapier-compat mapNewColliders' per-collider callback (`forEachColliderHandle`), called from wasm once per collider (~1,860) after every World.step |
| 16 | 1.2% | 0.148 | 3.5% | `update` | node_modules/.vite/deps/chunk-G7K22NUO.js:29680 | three AnimationMixer.update: advances every action of a mixer (6 clappers, 4 wisps, jellies, folk, the unmet siblings' rigs) |
| 17 | 1.2% | 0.147 | 2.2% | `onQuaternionChange` | node_modules/.vite/deps/chunk-G7K22NUO.js:4486 | three Euler callback fired by every `mesh.quaternion.set(...)`: Euler.setFromQuaternion again (physics.sync does it for 477 bodies a tick, wisps, resetPose) |
| 18 | 1.1% | 0.146 | 11.0% | `animate` | src/courier/character.js:588 | Character.animate: the Courier's gait blend, clip sampling, layers and the passes after (footIK, resetPose, techs); callee hot spots are listed on their own |
| 19 | 1.1% | 0.138 | 1.7% | `evaluate` | node_modules/.vite/deps/chunk-G7K22NUO.js:25004 | three Interpolant.evaluate: samples one keyframe track for a mixer (under the line above) |
| 20 | 1.0% | 0.130 | 1.0% | `setFromRotationMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4308 | three Euler.setFromRotationMatrix: the work inside onQuaternionChange |
| 21 | 1.0% | 0.128 | 97.3% | `m.ticks` | (native) | the measuring loop itself plus whatever V8 inlined into it |
| 22 | 1.0% | 0.121 | 2.4% | `update` | src/render/lightbudget.js:63 | LightBudget.update: scores all 87 lamp proxies (114 in the Well) every tick (getWorldPosition, parent-chain visibility walk, zone test, a candidate object + position clone each), sorts, builds a Set and a Map, copies the best 8 onto the pooled lights |
| 23 | 0.8% | 0.103 | 1.2% | `unmapRemovedColliders` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6578 | rapier-compat ColliderSet.unmapRemovedColliders: after every World.step, loops all ~1,860 colliders asking wasm `contains(handle)` |
| 24 | 0.8% | 0.100 | 4.5% | `footIK` | src/courier/character.js:867 | Character.footIK: feet on the ground (4 ground raycasts a tick through main.js groundAt), stride warp, foot locks, soles; allocates Vector3s per call |
| 25 | 0.8% | 0.098 | 0.8% | `wasm-function[1647]` | wasm://wasm/00bc1dde:1 | Rapier wasm: a body query (isSleeping / isValid / isDynamic / linvel) called from Breakables settle / rest / preStep |

Module rollup, top 20 (self time; "owner" = time charged to the nearest `src/` frame, so three.js / Rapier / native time is charged to the game code that called it):

| # | module (self) | self % | self ms/tick | incl. % |  | owner (src frame) | owner % | owner ms/tick |
|---|---|---|---|---|---|---|---|---|
| 1 | three.js (chunk-G7K22NUO.js) | 22.2% | 2.817 | 22.4% | | core/physics.js | 22.1% | 2.797 |
| 2 | rapier (wasm) | 13.6% | 1.720 | 19.9% | | courier/character.js | 10.6% | 1.339 |
| 3 | rapier-compat JS glue | 8.2% | 1.036 | 22.5% | | main.js tick body / harness | 6.5% | 0.829 |
| 4 | src/main.js | 5.3% | 0.676 | 96.2% | | render/propbatch.js | 4.9% | 0.615 |
| 5 | src/render/propbatch.js | 4.8% | 0.614 | 4.9% | | world/props/breakables.js | 4.4% | 0.554 |
| 6 | (native) | 3.7% | 0.465 | 97.4% | | creatures/clappers.js | 3.8% | 0.485 |
| 7 | src/courier/character.js | 3.1% | 0.397 | 24.2% | | courier/anim/bodyproxies.js | 2.9% | 0.366 |
| 8 | src/world/props/breakables.js | 3.0% | 0.385 | 9.2% | | courier/moves/techs.js | 2.6% | 0.335 |
| 9 | src/courier/anim/bodyproxies.js | 2.8% | 0.350 | 2.9% | | world/props/movers.js | 2.3% | 0.291 |
| 10 | src/courier/moves/techs.js | 2.6% | 0.335 | 12.8% | | render/lightbudget.js | 2.2% | 0.283 |
| 11 | (garbage collector) | 2.1% | 0.269 | 2.1% | | tools/heldtool.js | 2.2% | 0.281 |
| 12 | src/core/physics.js | 1.9% | 0.241 | 22.1% | | (garbage collector) | 2.1% | 0.269 |
| 13 | src/vfx/spawnlook.js | 1.9% | 0.241 | 1.9% | | creatures/wisp/lanternwisp.js | 2.1% | 0.261 |
| 14 | src/world/props/movers.js | 1.5% | 0.186 | 2.4% | | courier/player.js | 2.0% | 0.259 |
| 15 | src/render/lightbudget.js | 1.1% | 0.145 | 2.4% | | vfx/spawnlook.js | 1.9% | 0.241 |
| 16 | src/render/zones.js | 0.9% | 0.117 | 1.5% | | courier/anim/standoff.js | 1.8% | 0.233 |
| 17 | src/tools/heldtool.js | 0.7% | 0.092 | 2.9% | | tools/sondelass/sondelass.js | 1.5% | 0.189 |
| 18 | src/courier/player.js | 0.7% | 0.082 | 5.3% | | render/zones.js | 1.5% | 0.186 |
| 19 | src/creatures/clappers.js | 0.5% | 0.069 | 4.2% | | courier/anim/wristease.js | 1.0% | 0.127 |
| 20 | src/tools/belt.js | 0.5% | 0.064 | 0.5% | | tools/soulbrush/soulbrush.js | 0.8% | 0.107 |

The tick's steps seen from the profile alone (direct callees of `tick`, profiled ms/tick):

| ms/tick | % of tick | callee |
|---|---|---|
| 1.841 | 15.1% | step core/physics.js:94 |
| 1.661 | 13.6% | poseHands courier/character.js:1092 |
| 1.094 | 9.0% | update world/props/breakables.js:887 |
| 0.795 | 6.5% | update coop/meeting.js:44 |
| 0.639 | 5.2% | animate courier/character.js:588 |
| 0.632 | 5.2% | (tick body itself) |
| 0.598 | 4.9% | sync core/physics.js:110 |
| 0.488 | 4.0% | tick courier/moves/techs.js:105 |
| 0.482 | 4.0% | fixedUpdate courier/player.js:373 |
| 0.312 | 2.6% | update creatures/wisp/lanternwisp.js:187 |
| 0.302 | 2.5% | update render/lightbudget.js:63 |
| 0.279 | 2.3% | fixedUpdate creatures/clappers.js:233 |
| 0.248 | 2.0% | update creatures/clappers.js:563 |
| 0.241 | 2.0% | update vfx/spawnlook.js:200 |
| 0.179 | 1.5% | update render/zones.js:105 |
| 0.165 | 1.4% | pre world/props/movers.js:433 |
| 0.123 | 1.0% | update courier/interact.js:30 |
| 0.094 | 0.8% | update npc/folk.js:216 |

### The Dunes (G.course.toDunes(), at the oasis)

Tick: **median 10.60 ms**, mean 12.90, p90 18.3, p99 60.1, max 100.2 (300 ticks, no draws, no profiler). Under the profiler the same ticks cost 16.44 ms (percentages below are shares of that).

| # | self % of tick | ms/tick (profiled) | incl. % | function | file:line | what it does |
|---|---|---|---|---|---|---|
| 1 | 6.6% | 1.090 | 8.5% | `updateMatrixWorld` | node_modules/.vite/deps/chunk-G7K22NUO.js:4766 | three Object3D.updateMatrixWorld: recompose the local matrix and multiply down to every child. In the tick it is the Courier rig (`root.updateMatrixWorld(true)` after each pose/IK step in character.js animate, standoff.apply, each tool's hands(), footIK, aimBone) and light/physics code |
| 2 | 5.4% | 0.884 | 95.6% | `tick` | src/main.js:1163 | the frame's simulation step; its self time is small functions V8 inlined into it (position ticks: line 1235 physics.sync, 1324 breakables.update, 1355 the fx updates, 1260 techs.tick) |
| 3 | 3.6% | 0.590 | 3.6% | `shape` | src/tools/sondelass/angling/fishmesh.js:68 | a Weir fish's body: rewrites all 273 vertices of a sphere (pow, cos, sin per vertex) each tick and flags the position attribute; 16 fish near the oasis |
| 4 | 2.9% | 0.481 | 2.9% | `(garbage collector)` | (native) | V8 scavenges / marking; see section 5 |
| 5 | 2.6% | 0.425 | 3.6% | `update` | src/world/props/breakables.js:887 | Breakables.update: for every one of the 298 pots (all zones): settle() + rest() (isValid/isDynamic/isSleeping Rapier calls, stale() for parked ones), plus the rope, slice and shard lists |
| 6 | 2.3% | 0.385 | 2.9% | `updateWorldMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4785 | three Object3D.updateWorldMatrix: what getWorldPosition/Quaternion/Direction call; walks up the parent chain re-multiplying. The rig code calls it hundreds of times a tick (footIK, holdNeck, guardKnees, aimBone, LightBudget.update) |
| 7 | 2.1% | 0.351 | 2.1% | `toArray` | node_modules/.vite/deps/chunk-G7K22NUO.js:4223 | three Matrix4.toArray: what `InstancedMesh.setMatrixAt` ends in; here SpawnLook.blocksUpdate's 192 blocks (0.18 to 0.29 ms of it) and the Weir reeds |
| 8 | 1.9% | 0.307 | 1.9% | `multiplyMatrices` | node_modules/.vite/deps/chunk-G7K22NUO.js:3768 | three Matrix4.multiplyMatrices: the multiply under the two above |
| 9 | 1.8% | 0.296 | 1.8% | `deepest` | src/courier/anim/bodyproxies.js:100 | BodyProxies.deepest: the hand-vs-body test of standoff.apply (keeps hands out of the torso): every hand/forearm point against every body proxy, each depth() allocating; run twice per poseHands |
| 10 | 1.5% | 0.242 | 4.1% | `wasm-function[1174]` | wasm://wasm/00bc1dde:1 | Rapier wasm: forEachColliderHandle, the loop that calls mapNewColliders' JS callback for each of the ~1,860 colliders (more in the Well) (the post-step bookkeeping, not the physics) |
| 11 | 1.4% | 0.232 | 4.7% | `wasm-to-js` | (native) | V8 wasm-to-JS call trampoline: the cost of Rapier's wasm calling the JS callbacks above, ~1,860 + 828 times per step |
| 12 | 1.3% | 0.216 | 2.0% | `onQuaternionChange` | node_modules/.vite/deps/chunk-G7K22NUO.js:4486 | three Euler callback fired by every `mesh.quaternion.set(...)`: Euler.setFromQuaternion again (physics.sync does it for 477 bodies a tick, wisps, resetPose) |
| 13 | 1.2% | 0.202 | 3.4% | `update` | node_modules/.vite/deps/chunk-G7K22NUO.js:29680 | three AnimationMixer.update: advances every action of a mixer (6 clappers, 4 wisps, jellies, folk, the unmet siblings' rigs) |
| 14 | 1.2% | 0.199 | 3.2% | `sync` | src/core/physics.js:110 | Physics.sync: for each of the 477 synced bodies (counted in the workshop and Dunes), translation() + rotation() from Rapier (2 wasm calls, 2 allocated objects) and mesh.position.set/quaternion.set, asleep or awake |
| 15 | 1.1% | 0.183 | 2.6% | `update` | src/render/lightbudget.js:63 | LightBudget.update: scores all 87 lamp proxies (114 in the Well) every tick (getWorldPosition, parent-chain visibility walk, zone test, a candidate object + position clone each), sorts, builds a Set and a Map, copies the best 8 onto the pooled lights |
| 16 | 1.1% | 0.174 | 1.2% | `(anonymous)` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6571 | rapier-compat mapNewColliders' per-collider callback (`forEachColliderHandle`), called from wasm once per collider (~1,860) after every World.step |
| 17 | 1.0% | 0.157 | 7.0% | `animate` | src/courier/character.js:588 | Character.animate: the Courier's gait blend, clip sampling, layers and the passes after (footIK, resetPose, techs); callee hot spots are listed on their own |
| 18 | 0.9% | 0.154 | 1.1% | `wasm-function[61]` | wasm://wasm/00bc1dde:1 | Rapier wasm: a solver/island routine inside the pipeline step |
| 19 | 0.9% | 0.143 | 1.4% | `evaluate` | node_modules/.vite/deps/chunk-G7K22NUO.js:25004 | three Interpolant.evaluate: samples one keyframe track for a mixer (under the line above) |
| 20 | 0.9% | 0.141 | 1.7% | `update` | src/courier/interact.js:30 | Interact.update: every 0.08 s (each 5th tick) calls every F-source function (walks lists of pots, chests, folk): a periodic burst |
| 21 | 0.8% | 0.133 | 6.2% | `update` | src/tools/sondelass/angling/weir.js:279 | Weir.update: when near the oasis, steps the shoal (16 fish: swim, senses, shape), reeds, the tide lamp, spawn timer |
| 22 | 0.8% | 0.129 | 4.3% | `update` | src/creatures/jelly/slipjelly.js:289 | SlipJellies.update: per jelly its mind (brain.update), move, ground probe raycasts (7 a tick in the Dunes), pose/deform; a jelly 150 m away still gets brain.update |
| 23 | 0.8% | 0.124 | 3.3% | `wasm-function[2664]` | wasm://wasm/00bc1dde:1 | Rapier wasm: the physics pipeline step proper (under stepWithEvents) |
| 24 | 0.7% | 0.122 | 0.7% | `setFromRotationMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4308 | three Euler.setFromRotationMatrix: the work inside onQuaternionChange |
| 25 | 0.7% | 0.115 | 96.4% | `m.ticks` | (native) | the measuring loop itself plus whatever V8 inlined into it |

Module rollup, top 20 (self time; "owner" = time charged to the nearest `src/` frame, so three.js / Rapier / native time is charged to the game code that called it):

| # | module (self) | self % | self ms/tick | incl. % |  | owner (src frame) | owner % | owner ms/tick |
|---|---|---|---|---|---|---|---|---|
| 1 | three.js (chunk-G7K22NUO.js) | 21.9% | 3.605 | 22.6% | | core/physics.js | 16.7% | 2.752 |
| 2 | rapier (wasm) | 11.9% | 1.956 | 16.6% | | courier/character.js | 6.9% | 1.131 |
| 3 | rapier-compat JS glue | 6.4% | 1.059 | 19.1% | | main.js tick body / harness | 6.4% | 1.058 |
| 4 | src/main.js | 5.5% | 0.907 | 95.6% | | creatures/clappers.js | 4.3% | 0.709 |
| 5 | src/tools/sondelass/angling/fishmesh.js | 4.1% | 0.677 | 4.2% | | tools/sondelass/angling/fishmesh.js | 4.2% | 0.699 |
| 6 | src/world/props/breakables.js | 3.4% | 0.553 | 4.3% | | world/props/breakables.js | 3.8% | 0.627 |
| 7 | (native) | 3.0% | 0.497 | 96.5% | | (garbage collector) | 2.9% | 0.481 |
| 8 | (garbage collector) | 2.9% | 0.481 | 2.9% | | courier/moves/techs.js | 2.8% | 0.467 |
| 9 | src/courier/moves/techs.js | 2.8% | 0.467 | 12.1% | | creatures/wisp/lanternwisp.js | 2.7% | 0.448 |
| 10 | src/courier/anim/bodyproxies.js | 2.4% | 0.392 | 2.5% | | courier/player.js | 2.7% | 0.439 |
| 11 | src/courier/character.js | 2.3% | 0.386 | 18.2% | | courier/anim/bodyproxies.js | 2.5% | 0.403 |
| 12 | src/core/physics.js | 1.4% | 0.236 | 16.9% | | render/lightbudget.js | 2.3% | 0.373 |
| 13 | src/render/lightbudget.js | 1.2% | 0.201 | 2.6% | | world/ground/trailmap.js | 2.2% | 0.367 |
| 14 | src/world/props/movers.js | 1.2% | 0.191 | 1.6% | | vfx/spawnlook.js | 1.9% | 0.309 |
| 15 | src/creatures/jelly/slipjelly.js | 1.1% | 0.184 | 4.3% | | tools/heldtool.js | 1.8% | 0.298 |
| 16 | src/tools/sondelass/angling/weir.js | 1.0% | 0.165 | 6.3% | | world/props/movers.js | 1.5% | 0.252 |
| 17 | src/courier/player.js | 1.0% | 0.160 | 6.2% | | tools/sondelass/angling/weir.js | 1.5% | 0.250 |
| 18 | src/world/ground/paintmap.js | 1.0% | 0.156 | 1.0% | | courier/anim/standoff.js | 1.5% | 0.248 |
| 19 | src/courier/interact.js | 0.9% | 0.141 | 1.7% | | creatures/jelly/slipjelly.js | 1.3% | 0.210 |
| 20 | src/creatures/ai/brain.js | 0.7% | 0.116 | 2.5% | | tools/veritome/veritome.js | 1.2% | 0.192 |

The tick's steps seen from the profile alone (direct callees of `tick`, profiled ms/tick):

| ms/tick | % of tick | callee |
|---|---|---|
| 1.834 | 11.7% | poseHands courier/character.js:1092 |
| 1.729 | 11.0% | step core/physics.js:94 |
| 1.027 | 6.5% | update tools/sondelass/angling/weir.js:279 |
| 0.884 | 5.6% | (tick body itself) |
| 0.789 | 5.0% | fixedUpdate courier/player.js:373 |
| 0.738 | 4.7% | animate courier/character.js:588 |
| 0.703 | 4.5% | update creatures/jelly/slipjelly.js:289 |
| 0.675 | 4.3% | update creatures/wisp/lanternwisp.js:187 |
| 0.622 | 4.0% | tick courier/moves/techs.js:105 |
| 0.590 | 3.8% | update world/props/breakables.js:887 |
| 0.521 | 3.3% | sync core/physics.js:110 |
| 0.504 | 3.2% | fixedUpdate creatures/clappers.js:233 |
| 0.447 | 2.8% | update coop/meeting.js:44 |
| 0.426 | 2.7% | update render/lightbudget.js:63 |
| 0.408 | 2.6% | update world/dunes/dunes.js:398 |
| 0.309 | 2.0% | update vfx/spawnlook.js:200 |
| 0.275 | 1.7% | update courier/interact.js:30 |
| 0.252 | 1.6% | update creatures/clappers.js:563 |

### The Great Dunemaw's bottom floor (in a hall)

Tick: **median 7.60 ms**, mean 8.21, p90 10.0, p99 21.7, max 77.8 (300 ticks, no draws, no profiler). Under the profiler the same ticks cost 10.78 ms (percentages below are shares of that).

| # | self % of tick | ms/tick (profiled) | incl. % | function | file:line | what it does |
|---|---|---|---|---|---|---|
| 1 | 6.9% | 0.749 | 8.8% | `updateMatrixWorld` | node_modules/.vite/deps/chunk-G7K22NUO.js:4766 | three Object3D.updateMatrixWorld: recompose the local matrix and multiply down to every child. In the tick it is the Courier rig (`root.updateMatrixWorld(true)` after each pose/IK step in character.js animate, standoff.apply, each tool's hands(), footIK, aimBone) and light/physics code |
| 2 | 6.0% | 0.650 | 94.5% | `tick` | src/main.js:1163 | the frame's simulation step; its self time is small functions V8 inlined into it (position ticks: line 1235 physics.sync, 1324 breakables.update, 1355 the fx updates, 1260 techs.tick) |
| 3 | 3.3% | 0.355 | 8.1% | `wasm-function[1174]` | wasm://wasm/00bc1dde:1 | Rapier wasm: forEachColliderHandle, the loop that calls mapNewColliders' JS callback for each of the ~1,860 colliders (more in the Well) (the post-step bookkeeping, not the physics) |
| 4 | 2.6% | 0.276 | 2.6% | `(garbage collector)` | (native) | V8 scavenges / marking; see section 5 |
| 5 | 2.3% | 0.243 | 2.3% | `deepest` | src/courier/anim/bodyproxies.js:100 | BodyProxies.deepest: the hand-vs-body test of standoff.apply (keeps hands out of the torso): every hand/forearm point against every body proxy, each depth() allocating; run twice per poseHands |
| 6 | 2.1% | 0.232 | 2.6% | `updateWorldMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4785 | three Object3D.updateWorldMatrix: what getWorldPosition/Quaternion/Direction call; walks up the parent chain re-multiplying. The rig code calls it hundreds of times a tick (footIK, holdNeck, guardKnees, aimBone, LightBudget.update) |
| 7 | 2.1% | 0.229 | 7.5% | `wasm-to-js` | (native) | V8 wasm-to-JS call trampoline: the cost of Rapier's wasm calling the JS callbacks above, ~1,860 + 828 times per step |
| 8 | 2.0% | 0.216 | 5.7% | `update` | src/world/props/breakables.js:887 | Breakables.update: for every one of the 298 pots (all zones): settle() + rest() (isValid/isDynamic/isSleeping Rapier calls, stale() for parked ones), plus the rope, slice and shard lists |
| 9 | 2.0% | 0.216 | 2.0% | `toArray` | node_modules/.vite/deps/chunk-G7K22NUO.js:4223 | three Matrix4.toArray: what `InstancedMesh.setMatrixAt` ends in; here SpawnLook.blocksUpdate's 192 blocks (0.18 to 0.29 ms of it) and the Weir reeds |
| 10 | 1.8% | 0.196 | 2.1% | `(anonymous)` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6571 | rapier-compat mapNewColliders' per-collider callback (`forEachColliderHandle`), called from wasm once per collider (~1,860) after every World.step |
| 11 | 1.7% | 0.184 | 1.7% | `multiplyMatrices` | node_modules/.vite/deps/chunk-G7K22NUO.js:3768 | three Matrix4.multiplyMatrices: the multiply under the two above |
| 12 | 1.5% | 0.165 | 2.3% | `unmapRemovedColliders` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6578 | rapier-compat ColliderSet.unmapRemovedColliders: after every World.step, loops all ~1,860 colliders asking wasm `contains(handle)` |
| 13 | 1.5% | 0.157 | 4.1% | `sync` | src/core/physics.js:110 | Physics.sync: for each of the 477 synced bodies (counted in the workshop and Dunes), translation() + rotation() from Rapier (2 wasm calls, 2 allocated objects) and mesh.position.set/quaternion.set, asleep or awake |
| 14 | 1.4% | 0.152 | 96.1% | `m.ticks` | (native) | the measuring loop itself plus whatever V8 inlined into it |
| 15 | 1.2% | 0.132 | 2.0% | `stale` | src/render/propbatch.js:108 | PropBatch.stale: per parked pot per tick, compares material, geometry, the attribute-version sum (gver) and position/quaternion/scale to see if it changed since it was parked (called by Breakables.rest, 244-257 of 298 pots parked) |
| 16 | 1.2% | 0.130 | 1.3% | `wasm-function[61]` | wasm://wasm/00bc1dde:1 | Rapier wasm: a solver/island routine inside the pipeline step |
| 17 | 1.1% | 0.118 | 3.1% | `update` | node_modules/.vite/deps/chunk-G7K22NUO.js:29680 | three AnimationMixer.update: advances every action of a mixer (6 clappers, 4 wisps, jellies, folk, the unmet siblings' rigs) |
| 18 | 1.1% | 0.117 | 2.0% | `onQuaternionChange` | node_modules/.vite/deps/chunk-G7K22NUO.js:4486 | three Euler callback fired by every `mesh.quaternion.set(...)`: Euler.setFromQuaternion again (physics.sync does it for 477 bodies a tick, wisps, resetPose) |
| 19 | 1.0% | 0.113 | 6.2% | `animate` | src/courier/character.js:588 | Character.animate: the Courier's gait blend, clip sampling, layers and the passes after (footIK, resetPose, techs); callee hot spots are listed on their own |
| 20 | 1.0% | 0.112 | 2.9% | `update` | src/render/lightbudget.js:63 | LightBudget.update: scores all 87 lamp proxies (114 in the Well) every tick (getWorldPosition, parent-chain visibility walk, zone test, a candidate object + position clone each), sorts, builds a Set and a Map, copies the best 8 onto the pooled lights |
| 21 | 1.0% | 0.104 | 1.0% | `setFromRotationMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4308 | three Euler.setFromRotationMatrix: the work inside onQuaternionChange |
| 22 | 0.9% | 0.095 | 1.4% | `evaluate` | node_modules/.vite/deps/chunk-G7K22NUO.js:25004 | three Interpolant.evaluate: samples one keyframe track for a mixer (under the line above) |
| 23 | 0.8% | 0.087 | 0.8% | `wasm-function[1786]` | wasm://wasm/00bc1dde:1 | Rapier wasm: `contains(handle)` under unmapRemovedColliders (the bookkeeping) |
| 24 | 0.8% | 0.085 | 0.8% | `gver` | src/render/propbatch.js:21 | sums the version of every attribute of a pot's geometry (for-in over attributes), inside stale() |
| 25 | 0.8% | 0.084 | 2.8% | `footIK` | src/courier/character.js:867 | Character.footIK: feet on the ground (4 ground raycasts a tick through main.js groundAt), stride warp, foot locks, soles; allocates Vector3s per call |

Module rollup, top 20 (self time; "owner" = time charged to the nearest `src/` frame, so three.js / Rapier / native time is charged to the game code that called it):

| # | module (self) | self % | self ms/tick | incl. % |  | owner (src frame) | owner % | owner ms/tick |
|---|---|---|---|---|---|---|---|---|
| 1 | three.js (chunk-G7K22NUO.js) | 20.2% | 2.175 | 20.2% | | core/physics.js | 25.0% | 2.690 |
| 2 | rapier (wasm) | 14.9% | 1.604 | 22.3% | | main.js tick body / harness | 8.3% | 0.891 |
| 3 | rapier-compat JS glue | 9.8% | 1.052 | 25.8% | | courier/character.js | 6.2% | 0.664 |
| 4 | src/main.js | 6.5% | 0.703 | 94.6% | | world/props/breakables.js | 3.9% | 0.416 |
| 5 | (native) | 3.9% | 0.418 | 96.2% | | creatures/clappers.js | 3.6% | 0.389 |
| 6 | src/world/props/breakables.js | 3.2% | 0.344 | 6.2% | | courier/anim/bodyproxies.js | 3.0% | 0.327 |
| 7 | src/courier/anim/bodyproxies.js | 2.9% | 0.315 | 3.0% | | render/lightbudget.js | 2.6% | 0.282 |
| 8 | (garbage collector) | 2.6% | 0.276 | 2.6% | | (garbage collector) | 2.6% | 0.276 |
| 9 | src/courier/character.js | 2.5% | 0.270 | 19.2% | | courier/player.js | 2.4% | 0.264 |
| 10 | src/render/propbatch.js | 2.3% | 0.252 | 2.3% | | render/propbatch.js | 2.3% | 0.252 |
| 11 | src/courier/moves/techs.js | 2.3% | 0.245 | 12.2% | | courier/moves/techs.js | 2.3% | 0.245 |
| 12 | src/core/physics.js | 1.8% | 0.191 | 25.0% | | creatures/wisp/lanternwisp.js | 2.2% | 0.240 |
| 13 | src/world/props/movers.js | 1.4% | 0.146 | 2.0% | | vfx/spawnlook.js | 2.2% | 0.235 |
| 14 | src/render/lightbudget.js | 1.3% | 0.145 | 2.9% | | tools/heldtool.js | 1.9% | 0.210 |
| 15 | src/courier/player.js | 0.8% | 0.089 | 5.6% | | world/props/movers.js | 1.9% | 0.201 |
| 16 | src/render/zones.js | 0.8% | 0.084 | 1.4% | | courier/anim/standoff.js | 1.6% | 0.170 |
| 17 | src/world/ground/paintmap.js | 0.7% | 0.074 | 0.7% | | render/zones.js | 1.3% | 0.144 |
| 18 | src/creatures/jelly/slipjelly.js | 0.7% | 0.071 | 2.8% | | tools/sondelass/sondelass.js | 1.3% | 0.138 |
| 19 | src/vfx/weather.js | 0.5% | 0.059 | 0.6% | | tools/veritome/veritome.js | 1.2% | 0.125 |
| 20 | src/world/raceway/track.js | 0.5% | 0.054 | 0.5% | | tools/lockheart/lockheart.js | 0.9% | 0.100 |

The tick's steps seen from the profile alone (direct callees of `tick`, profiled ms/tick):

| ms/tick | % of tick | callee |
|---|---|---|
| 1.874 | 18.4% | step core/physics.js:94 |
| 1.391 | 13.6% | poseHands courier/character.js:1092 |
| 0.672 | 6.6% | animate courier/character.js:588 |
| 0.650 | 6.4% | (tick body itself) |
| 0.612 | 6.0% | update world/props/breakables.js:887 |
| 0.443 | 4.4% | fixedUpdate courier/player.js:373 |
| 0.442 | 4.3% | sync core/physics.js:110 |
| 0.402 | 3.9% | tick courier/moves/techs.js:105 |
| 0.314 | 3.1% | update render/lightbudget.js:63 |
| 0.290 | 2.8% | update creatures/jelly/slipjelly.js:289 |
| 0.284 | 2.8% | update creatures/wisp/lanternwisp.js:187 |
| 0.249 | 2.4% | fixedUpdate creatures/clappers.js:233 |
| 0.235 | 2.3% | update vfx/spawnlook.js:200 |
| 0.171 | 1.7% | update creatures/clappers.js:563 |
| 0.133 | 1.3% | update render/zones.js:105 |
| 0.127 | 1.2% | update courier/interact.js:30 |
| 0.089 | 0.9% | pre world/props/movers.js:433 |
| 0.075 | 0.7% | updateCamera courier/player.js:1027 |

### The Spirit Garden (at the gate)

Tick: **median 4.30 ms**, mean 5.70, p90 8.7, p99 41.7, max 84.8 (300 ticks, no draws, no profiler). Under the profiler the same ticks cost 5.83 ms (percentages below are shares of that).

| # | self % of tick | ms/tick (profiled) | incl. % | function | file:line | what it does |
|---|---|---|---|---|---|---|
| 1 | 7.3% | 0.428 | 94.1% | `tick` | src/main.js:1163 | the frame's simulation step; its self time is small functions V8 inlined into it (position ticks: line 1235 physics.sync, 1324 breakables.update, 1355 the fx updates, 1260 techs.tick) |
| 2 | 3.8% | 0.222 | 3.8% | `toArray` | node_modules/.vite/deps/chunk-G7K22NUO.js:4223 | three Matrix4.toArray: what `InstancedMesh.setMatrixAt` ends in; here SpawnLook.blocksUpdate's 192 blocks (0.18 to 0.29 ms of it) and the Weir reeds |
| 3 | 3.6% | 0.212 | 9.6% | `wasm-to-js` | (native) | V8 wasm-to-JS call trampoline: the cost of Rapier's wasm calling the JS callbacks above, ~1,860 + 828 times per step |
| 4 | 2.7% | 0.159 | 2.7% | `(garbage collector)` | (native) | V8 scavenges / marking; see section 5 |
| 5 | 2.7% | 0.158 | 7.5% | `wasm-function[1174]` | wasm://wasm/00bc1dde:1 | Rapier wasm: forEachColliderHandle, the loop that calls mapNewColliders' JS callback for each of the ~1,860 colliders (more in the Well) (the post-step bookkeeping, not the physics) |
| 6 | 2.3% | 0.134 | 7.9% | `update` | src/world/props/breakables.js:887 | Breakables.update: for every one of the 298 pots (all zones): settle() + rest() (isValid/isDynamic/isSleeping Rapier calls, stale() for parked ones), plus the rope, slice and shard lists |
| 7 | 2.1% | 0.121 | 2.1% | `setFromRotationMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4308 | three Euler.setFromRotationMatrix: the work inside onQuaternionChange |
| 8 | 2.0% | 0.116 | 2.3% | `wasm-function[61]` | wasm://wasm/00bc1dde:1 | Rapier wasm: a solver/island routine inside the pipeline step |
| 9 | 1.8% | 0.107 | 2.9% | `stale` | src/render/propbatch.js:108 | PropBatch.stale: per parked pot per tick, compares material, geometry, the attribute-version sum (gver) and position/quaternion/scale to see if it changed since it was parked (called by Breakables.rest, 244-257 of 298 pots parked) |
| 10 | 1.7% | 0.097 | 95.9% | `m.ticks` | (native) | the measuring loop itself plus whatever V8 inlined into it |
| 11 | 1.6% | 0.092 | 2.0% | `updateWorldMatrix` | node_modules/.vite/deps/chunk-G7K22NUO.js:4785 | three Object3D.updateWorldMatrix: what getWorldPosition/Quaternion/Direction call; walks up the parent chain re-multiplying. The rig code calls it hundreds of times a tick (footIK, holdNeck, guardKnees, aimBone, LightBudget.update) |
| 12 | 1.4% | 0.080 | 3.4% | `onQuaternionChange` | node_modules/.vite/deps/chunk-G7K22NUO.js:4486 | three Euler callback fired by every `mesh.quaternion.set(...)`: Euler.setFromQuaternion again (physics.sync does it for 477 bodies a tick, wisps, resetPose) |
| 13 | 1.4% | 0.079 | 2.4% | `evaluate` | node_modules/.vite/deps/chunk-G7K22NUO.js:25004 | three Interpolant.evaluate: samples one keyframe track for a mixer (under the line above) |
| 14 | 1.3% | 0.074 | 6.1% | `sync` | src/core/physics.js:110 | Physics.sync: for each of the 477 synced bodies (counted in the workshop and Dunes), translation() + rotation() from Rapier (2 wasm calls, 2 allocated objects) and mesh.position.set/quaternion.set, asleep or awake |
| 15 | 1.0% | 0.061 | 1.0% | `gver` | src/render/propbatch.js:21 | sums the version of every attribute of a pot's geometry (for-in over attributes), inside stale() |
| 16 | 1.0% | 0.059 | 1.4% | `(anonymous)` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6571 | rapier-compat mapNewColliders' per-collider callback (`forEachColliderHandle`), called from wasm once per collider (~1,860) after every World.step |
| 17 | 1.0% | 0.059 | 6.6% | `wasm-function[2664]` | wasm://wasm/00bc1dde:1 | Rapier wasm: the physics pipeline step proper (under stepWithEvents) |
| 18 | 1.0% | 0.057 | 1.8% | `unmapRemovedColliders` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:6578 | rapier-compat ColliderSet.unmapRemovedColliders: after every World.step, loops all ~1,860 colliders asking wasm `contains(handle)` |
| 19 | 1.0% | 0.057 | 1.0% | `slerpFlat` | node_modules/.vite/deps/chunk-G7K22NUO.js:2019 | three Quaternion.slerpFlat: animation-track interpolation under a mixer update |
| 20 | 0.9% | 0.050 | 0.9% | `wasm-function[1786]` | wasm://wasm/00bc1dde:1 | Rapier wasm: `contains(handle)` under unmapRemovedColliders (the bookkeeping) |
| 21 | 0.8% | 0.045 | 3.6% | `_update` | node_modules/.vite/deps/chunk-G7K22NUO.js:29200 | three AnimationAction._update: one action's clip time and weight inside a mixer |
| 22 | 0.8% | 0.044 | 0.8% | `traverse` | node_modules/.vite/deps/chunk-G7K22NUO.js:4740 | three Object3D.traverse: LightBudget.scan() walking the whole scene once a second for new lamps (render/lightbudget.js:50) |
| 23 | 0.7% | 0.043 | 3.8% | `__wbg_call_187d372bd5fdd4aa` | node_modules/.vite/deps/@dimforge_rapier3d-compat.js:4262 | wasm-bindgen glue: wasm calling a JS closure with one argument (the per-body / per-collider callbacks above); also where their garbage is allocated |
| 24 | 0.7% | 0.042 | 3.2% | `rest` | src/world/props/breakables.js:826 | Breakables.rest: the per-pot parked-in-batch state machine (3 Rapier calls and stale()) |
| 25 | 0.7% | 0.042 | 0.7% | `(program)` | (native) | native code outside JS (DOM, WebGL entry points) |

Module rollup, top 20 (self time; "owner" = time charged to the nearest `src/` frame, so three.js / Rapier / native time is charged to the game code that called it):

| # | module (self) | self % | self ms/tick | incl. % |  | owner (src frame) | owner % | owner ms/tick |
|---|---|---|---|---|---|---|---|---|
| 1 | rapier (wasm) | 17.5% | 1.021 | 27.0% | | core/physics.js | 26.8% | 1.565 |
| 2 | three.js (chunk-G7K22NUO.js) | 16.9% | 0.987 | 17.0% | | main.js tick body / harness | 9.6% | 0.562 |
| 3 | rapier-compat JS glue | 9.3% | 0.544 | 29.6% | | creatures/clappers.js | 7.7% | 0.452 |
| 4 | src/main.js | 7.8% | 0.454 | 94.1% | | world/props/breakables.js | 5.0% | 0.293 |
| 5 | (native) | 5.8% | 0.339 | 96.0% | | creatures/wisp/lanternwisp.js | 3.8% | 0.222 |
| 6 | src/world/props/breakables.js | 3.9% | 0.228 | 8.5% | | render/propbatch.js | 3.5% | 0.203 |
| 7 | src/render/propbatch.js | 3.5% | 0.203 | 3.5% | | vfx/spawnlook.js | 3.4% | 0.196 |
| 8 | (garbage collector) | 2.7% | 0.159 | 2.7% | | render/lightbudget.js | 2.9% | 0.171 |
| 9 | src/core/physics.js | 1.4% | 0.080 | 26.8% | | (garbage collector) | 2.7% | 0.159 |
| 10 | src/world/props/movers.js | 1.1% | 0.067 | 2.3% | | world/props/movers.js | 2.1% | 0.125 |
| 11 | src/render/zones.js | 1.1% | 0.062 | 2.2% | | render/zones.js | 2.0% | 0.117 |
| 12 | src/render/lightbudget.js | 0.9% | 0.054 | 3.1% | | world/garden/realm.js | 0.9% | 0.052 |
| 13 | src/world/garden/realm.js | 0.8% | 0.048 | 9.0% | | vfx/alchemy/marks.js | 0.9% | 0.051 |
| 14 | src/courier/moves/techs.js | 0.8% | 0.044 | 0.8% | | courier/moves/carry.js | 0.8% | 0.049 |
| 15 | (program) | 0.7% | 0.042 | 0.7% | | courier/moves/techs.js | 0.8% | 0.044 |
| 16 | src/progress/achievements.js | 0.7% | 0.039 | 0.9% | | (program) | 0.7% | 0.042 |
| 17 | src/vfx/alchemy/huering.js | 0.6% | 0.037 | 0.7% | | vfx/alchemy/huering.js | 0.7% | 0.041 |
| 18 | src/courier/anim/rom.js | 0.6% | 0.037 | 0.6% | | progress/achievements.js | 0.7% | 0.039 |
| 19 | src/courier/moves/carry.js | 0.6% | 0.036 | 1.2% | | courier/anim/rom.js | 0.6% | 0.037 |
| 20 | src/creatures/clappers.js | 0.6% | 0.035 | 8.3% | | vfx/weather.js | 0.6% | 0.036 |

The tick's steps seen from the profile alone (direct callees of `tick`, profiled ms/tick):

| ms/tick | % of tick | callee |
|---|---|---|
| 1.208 | 22.0% | step core/physics.js:94 |
| 0.463 | 8.4% | update world/props/breakables.js:887 |
| 0.459 | 8.4% | update world/garden/realm.js:272 |
| 0.428 | 7.8% | (tick body itself) |
| 0.355 | 6.5% | sync core/physics.js:110 |
| 0.320 | 5.8% | fixedUpdate creatures/clappers.js:233 |
| 0.252 | 4.6% | update creatures/wisp/lanternwisp.js:187 |
| 0.196 | 3.6% | update vfx/spawnlook.js:200 |
| 0.179 | 3.3% | update render/lightbudget.js:63 |
| 0.165 | 3.0% | update creatures/clappers.js:563 |
| 0.116 | 2.1% | update render/zones.js:105 |
| 0.116 | 2.1% | update courier/interact.js:30 |
| 0.065 | 1.2% | pre world/props/movers.js:433 |
| 0.056 | 1.0% | update creatures/jelly/slipjelly.js:289 |
| 0.053 | 1.0% | tick progress/achievements.js:718 |
| 0.044 | 0.8% | fixed world/garden/realm.js:256 |
| 0.042 | 0.8% | update vfx/vfx.js:273 |
| 0.040 | 0.7% | render world/props/movers.js:512 |

### The four places side by side: top 20 modules by self time (share of each place's tick)

| # | module | workshop | Dunes | Well floor | Garden |
|---|---|---|---|---|---|
| 1 | three.js (chunk-G7K22NUO.js) | 22.2% | 21.9% | 20.2% | 16.9% |
| 2 | rapier (wasm) | 13.6% | 11.9% | 14.9% | 17.5% |
| 3 | rapier-compat JS glue | 8.2% | 6.4% | 9.8% | 9.3% |
| 4 | src/main.js | 5.3% | 5.5% | 6.5% | 7.8% |
| 5 | (native) | 3.7% | 3.0% | 3.9% | 5.8% |
| 6 | src/world/props/breakables.js | 3.0% | 3.4% | 3.2% | 3.9% |
| 7 | src/render/propbatch.js | 4.8% | 0.5% | 2.3% | 3.5% |
| 8 | (garbage collector) | 2.1% | 2.9% | 2.6% | 2.7% |
| 9 | src/courier/moves/techs.js | 2.6% | 2.8% | 2.3% | 0.8% |
| 10 | src/courier/anim/bodyproxies.js | 2.8% | 2.4% | 2.9% | 0.0% |
| 11 | src/courier/character.js | 3.1% | 2.3% | 2.5% | 0.0% |
| 12 | src/core/physics.js | 1.9% | 1.4% | 1.8% | 1.4% |
| 13 | src/world/props/movers.js | 1.5% | 1.2% | 1.4% | 1.1% |
| 14 | src/render/lightbudget.js | 1.1% | 1.2% | 1.3% | 0.9% |
| 15 | src/tools/sondelass/angling/fishmesh.js | 0.0% | 4.1% | 0.0% | 0.0% |
| 16 | src/render/zones.js | 0.9% | 0.6% | 0.8% | 1.1% |
| 17 | src/courier/player.js | 0.7% | 1.0% | 0.8% | 0.0% |
| 18 | src/vfx/spawnlook.js | 1.9% | 0.1% | 0.2% | 0.2% |
| 19 | src/creatures/clappers.js | 0.5% | 0.5% | 0.5% | 0.6% |
| 20 | src/creatures/jelly/slipjelly.js | 0.2% | 1.1% | 0.7% | 0.1% |



## 3. What runs every frame though nothing there needs it

Costs are the per-system timers (inclusive ms a tick, no profiler; workshop / Dunes / Well / Garden). A dash means the system does not run there. The full timer table is in 7.2.

| system | ms a tick W / D / Wl / G | why nothing needs it | code |
|---|---|---|---|
| **Rapier's JS bookkeeping after every step** (`mapNewColliders`, `mapNewBodies`, `unmapRemovedColliders`, `unmapRemovedBodies`) | 1.3 / 1.1 / 1.4 / 0.8 (profiled; 1.5 / 1.3 / 1.5 / 1.5 measured by patching it out) | `createRigidBody` and `createCollider` put the new handle in the JS map at once (`@dimforge_rapier3d-compat.js:4860`), `removeRigidBody` unmaps its own colliders and joints (`:4866`), the game never builds soft bodies or takes a snapshot (grep: none), so the post-step walk over 1,860 colliders and 828 bodies, one wasm-to-JS callback each, finds nothing, every step | `src/core/physics.js:99` (`this.world.step`) -> rapier-compat `World.step` -> `mapNewSoftBodies` (`:5838`), `mapNewColliders` (`:6570`), `unmapRemovedColliders` (`:6578`), `unmapRemovedBodies` (`:4875`) |
| The whole Rapier world stepped and synced wherever you are | step 1.3 / 1.6 / 1.4 / 1.1, sync 0.40 / 0.45 / 0.33 / 0.29 | 828 bodies, 1,860 colliders, 477 synced to meshes, only 27 to 54 awake; the Garden steps it too (its own `realm.fixed` is 0.03 ms) | `main.js:1227` (`physics.step`), `:1235` (`physics.sync`), `core/physics.js:110` (a Set loop, `translation()` + `rotation()` per body, asleep or not) |
| **Breakables over every pot in every zone** | 0.79 / 0.65 / 0.46 / 0.37 (+ `preStep` 0.07 / 0.06 / 0.05 / 0.04) | 298 pots, 244 to 257 parked and asleep; each costs `settle` (isValid, isDynamic, isSleeping: three wasm calls) + `rest` (the same three again) + `PropBatch.stale` (3 vector equals + a for-in over attributes) every tick; 136 rope segments get `updateMatrix` + `setMatrixAt` and the whole instance buffer is flagged for upload every tick | `world/props/breakables.js:887` (`update`), `:863` (`settle`), `:826` (`rest`), `render/propbatch.js:108` (`stale`), `:141` (`InstancePool.update`), `:21` (`gver`) |
| **Unmet siblings' full rigs** | 0.63 / 0.40 / 0.02 / - | Petra and Calissa (workshop), Wanda (Dunes) stand idle "turned toward you", yet `rig.animate` runs the whole 65-bone Courier blend for each, every tick, within 30 m; the draw then skins them too (9 skinned meshes each, 2 draws each with the shadow pass, a bone texture each) | `coop/meeting.js:44` (`update`), `:65` (`W.rig.animate`), hide/let-go distances `:20` (NEAR 30, FAR 150) |
| **Clappers anywhere** | fixed 0.23 / 0.27 / 0.18 / 0.25, update 0.18 / 0.26 / 0.14 / 0.14 | six clappers live in the workshop; the loops have no zone or distance gate, so a mixer, a squash spring, a kinematic Rapier move and bone writes run in the Dunes, the Well and the Garden | `creatures/clappers.js:233` (`fixedUpdate`, loop `:235`), `:563` (`update`, loop `:566`, `mixer.update` `:582`) |
| **Wisps' mixers when far** | 0.22 / 0.40 / 0.19 / 0.17 | `c.mixer.update(dt)` runs before the `far` test, so a wisp 400 m away (the Dunes from the workshop: the 60 m height test) still animates; far wisps also run `brain.update` | `creatures/wisp/lanternwisp.js:190` (mixer), `:198`-`:199` (the far test) |
| Jellies when far | 0.06 / 0.42 / 0.37 / 0.04 | a far jelly skips its body but still runs `brain.update` (the mind's own level of detail then thins it); the Dunes and Well numbers are mostly near jellies, which is right | `creatures/jelly/slipjelly.js:313`-`:314` |
| **SpawnLook's 192 blocks** | 0.21 / 0.22 / 0.18 / 0.17 | nothing is spawning; each tick still writes 192 matrices (scale 0) and 192 colours and flags two instance buffers for upload | `vfx/spawnlook.js:208` (call), `:301` (`blocksUpdate`) |
| **Light budget** | 0.24 / 0.39 / 0.28 / 0.16 | scores all 87 lamp proxies every tick (a `getWorldPosition` each, a parent-chain visibility walk, a zone test, an object and a position clone per candidate, a sort, a Set and a Map), to pick 8; only 2 to 8 are ever lit. Once a second `scan()` traverses all 5,300 objects: **a 4.1 ms spike** (Dunes tick 270 of the spike probe) | `render/lightbudget.js:63` (`update`), `:65` (`scanT = 1`), `:50` (`scan`) |
| Zones pass | 0.15 / 0.15 / 0.13 / 0.12 | every 0.25 s places every top-level scene object in a zone: **a 2.5 to 3.4 ms spike** (workshop ticks 380, 220; Dunes 0, 272); the avg is the per-tick visibility sets | `render/zones.js:105`, `:116`-`:118` |
| Interact sources | 0.14 / 0.12 / 0.11 / 0.10 | every 0.08 s (each fifth tick) every F-source function runs; 1 to 2 ms on its tick | `courier/interact.js:30` |
| **Grate wall probe** | ~0.1 profiled | `canStart()` is asked every fixed step of an idle tech; the grate tech passes its guard because the world has 2 grates somewhere (`rig.grateList.length`), then casts **8 rays** around the chest, every tick, in every place | `courier/moves/grate.js:62`-`:64`, `:35`-`:41` |
| Tools' `hands()` while stowed | ~0.5 profiled (matrix updates alone) | `techs.hands` runs each worn tool's `hands()` (`t.w > 0`), and `HeldTool.hands` begins with `ch.root.updateMatrixWorld(true)` (the Sondelass, Veritome, Soul Brush and Lockheart `hands()` show the same matrix-update time in the profile): five tools, about five whole-rig matrix updates a tick, though none is drawn | `courier/moves/techs.js:125`-`:126`, `tools/heldtool.js:135`-`:137`, `tools/sondelass/sondelass.js:233`, `tools/veritome/veritome.js:328`, `tools/soulbrush/soulbrush.js:288`, `tools/lockheart/lockheart.js:433` |
| Hand-vs-body standoff | 0.3 profiled (`deepest` alone, 2.3 to 2.9%) | every hand and forearm point against every body proxy, twice per `poseHands`; the first distance test rejects most pairs, the rest allocate a section object and a `Math.hypot` | `courier/anim/standoff.js:29`, `courier/anim/bodyproxies.js:100` |
| **Weir fish** (Dunes at the oasis only) | weir.update 1.17 | 16 fish each rewrite all 273 vertices of their body every tick (`pow`, `cos`, `sin` per vertex) and flag the attribute; they are drawn as 172 calls | `tools/sondelass/angling/weir.js:279`, `fishmesh.js:68`-`:76` |
| Trails | ~0.05 | ten `Trail.update` per tick rebuild arrays (two `Vector3` and a closure each) and flag four attributes with nothing to draw (`mesh.visible = false`, so no upload) | `vfx/trail.js:68`-`:102` |

**Raycasts a tick** (Rapier `castRayAndGetNormal`): the main run counted 18.6 in the workshop and 34.3 in the Dunes; the census run (a separate boot, 120 ticks, by caller) counted 21.1 and 35.4: workshop Grate.wallProbe 8, groundAt (foot IK) 4, Cartography.sees 3.05, Player.groundNormal 2, Balance.beamUnder 1, moverUnder 1, updateCamera 1, computeAimPoint 1; Dunes wallProbe 8, SlipJellies.probe 7.3, Cartography.sees 5.4, LanternWisps.ground 4, groundAt 4, groundNormal 2, singles. Together 0.25 to 0.41 ms a tick (`game.physics.raycast`, 18.7 and 28.5 calls). Each also allocates a `Ray`, two `Vector3`s and a result object (`physics.js:120`). Cartography's rays (`sees`, `cartography.js:250`) come with its 0.16 s passive charting (`:184`); the rest are every tick.

**DOM and canvas each frame: nothing worth having.** Counted by call site over 120 ticks: `Hud.update` writes 5 style properties and toggles one class every tick (`feedback/hud.js:44`-`:51`, values mostly unchanged), `GameLog.tick` calls `classList.add('idle')` every tick after 9 s (`feedback/gamelog.js:274`), the Weir's board redraws its 2D canvas 0.1 times a tick (`weir.js:228`), the paint map re-uploads its texture 0.13 times a tick (`world/ground/paintmap.js:358`). No `innerHTML`, no `drawImage`, no `getImageData`, no element creation per frame. There are no WebGL uploads in the tick at all (they happen in the draw: 28 `texSubImage2D` a draw, all bone textures and batch textures).

**Per-frame allocations**: section 5. The biggest are Rapier's bookkeeping (240 KB a tick), `Physics.sync` (91 to 104 KB), the foot IK and standoff (`Math.hypot`, iterators), the fish.

**O(n^2)**: none above about 10 x 10 (hand points x body proxies). The linear ones that hurt are the loops over 5,300 scene objects (`updateMatrixWorld` in the draw), 2,688 Rapier handles (post-step bookkeeping), 477 synced bodies, 298 pots, 87 lamps.

**The fixed loop is a trap on a slow machine.** `main.js:1089` clamps the frame to 50 ms and `:1214` runs up to 4 fixed steps a frame, each one `player.fixedUpdate` + `clappers.fixedUpdate` + `shells.fixedUpdate` + `breakables.preStep` + `physics.step` (+ the bookkeeping). At 30 fps that is 2 steps, at 20 fps 3. The cost of the physics part of the tick therefore grows exactly when frames get slow. Not measured by a run (the harness steps at 1/60), but it follows from the loop.

## 4. Ranked optimizations

Savings are ms of CPU per tick unless "draw". "Measured" means the A/B patch in section 7 (medians of 500 ticks each side, +/- 0.4 ms); "timer" means the per-system timer's cost of the thing removed (an upper bound on the saving); "profile" means a profile-attributed cost (about 30% high in absolute ms); "census" means call counts times about 30 us a call.

| # | change | workshop | Dunes | Well | Garden | evidence | risk |
|---|---|---|---|---|---|---|---|
| 1 | skip Rapier's post-step bookkeeping | **1.5** | **1.3** | **1.5** | **1.5** | measured; -240 KB/tick of garbage | low |
| 2 | Weir fish: `forceSinglePass` on the fins, then fewer calls / GPU swim | - | tick 0.6 to 1.0; draw ~5 (fins), up to ~10 (all 172 calls) | - | - | profile + census | low (a), medium (b) |
| 3 | the Garden stops the world's creatures, props and updaters | - | - | - | **1.8** (+0.7 more after #1 if the Rapier world is paused) | measured | medium |
| 4 | gate clappers, wisps, jellies by distance / zone | 0.2 | 0.5 | 0.5 | 0.6 (inside #3) | timer; A/B 1.2 / 1.2 / 0.9 includes creatures that are near | low-medium |
| 5 | unmet siblings: animate near and on screen only, hide the rest | 0.6; draw 3 to 7 | 0.3; draw 1 | 0 | 0 | measured (tick); draw A/B noisy | low |
| 6 | no matrix updates for zone-hidden subtrees (draw) | draw 1.4 | draw 6.3 | n/m | n/m | A/B noisy; profile says up to 5.9 | medium |
| 7 | shadow pass: fewer casters / every other frame | draw 5.3 (161 calls) | draw 0.2 (69 calls) | n/m | n/m | A/B | medium (look) |
| 8 | merge the static level's outline passes (draw) | draw ~4 (148 calls) | ~1 (37 calls) | n/m | n/m | census | low-medium (Calissa's) |
| 9 | `SpawnLook.blocksUpdate` early-out | 0.4 | 0.4 | 0.5 | ~0.2 | measured | very low |
| 10 | light budget at 10 Hz, positions cached, no per-second scan | 0.2 to 0.6 | 0.2 to 0.4 | 0.1 to 0.3 | 0.15 | timer; A/B only in the workshop; removes a 4 ms spike | low |
| 11 | breakables: awake and unparked pots only; ropes only when awake | 0.3 to 0.5 | 0.3 to 0.6 | 0.2 to 0.4 | 0.2 to 0.35 | timer; A/B not resolved | low-medium |
| 12 | `Physics.sync` for awake bodies only | <= 0.4 | <= 0.4 | <= 0.9 | <= 0.4 | A/B inconsistent; **-91 to -104 KB/tick of garbage** | low |
| 13 | grate wall probe only near a grate | 0.1 | 0.1 | 0.1 | 0 | profile; 8 rays a tick | very low |
| 14 | stowed tools' models follow the holster bone, no `hands()` | 0.2 to 0.4 | 0.2 to 0.4 | 0.2 to 0.4 | 0 | profile; A/B not resolved | medium |
| 15 | standoff: sphere test before `depth`, `Math.sqrt` for `Math.hypot` | 0.2 | 0.2 | 0.2 | 0 | profile | low |
| 16 | cap the catch-up to 2 steps and slow the game instead of spiralling | structural | | | | follows from the loop | design call |

If 1, 3, 4, 5, 9, 10, 11 land the tick should go from 9.4 to about 6.0 ms in the workshop (-3.4), 10.6 to about 7.3 in the Dunes (-3.3, and about -1 more with the fish fixed), 7.6 to about 4.8 in the Well (-2.8), and 4.3 to somewhere between 1 and 2 in the Garden (#1 and #3 are independent there); a third of every tick, more in the Garden. On the draw side 2, 5, 6, 7, 8 together are worth something like 10 to 15 ms of the workshop's 27 and 8 to 12 of the Dunes' 20 to 43, which on a junk laptop is more than the whole tick.

**Tried and not worth doing:** freezing static objects (`matrixAutoUpdate = false` on the 4,200 to 4,300 objects whose world matrix did not move in 90 ticks plus 3 draws, the scene root included) made **no measurable difference**: workshop draw 24.0 -> 23.8 ms, tick 8.0 -> 7.2; Dunes draw 23.1 -> 23.3, tick 9.7 -> 10.3. The cost of `updateMatrixWorld` is the walk over 5,300 objects, not the compose and multiply, so skipping hidden subtrees (#6) is the lever, freezing is not.

### The details

**1. Skip Rapier's post-step bookkeeping.** `src/core/physics.js:48` creates the world; `:99` steps it. After the pipeline step (0.46 to 0.58 ms profiled, a third of the cost) rapier-compat's `World.step` calls `mapNewSoftBodies()`, which loops every collider and every body through a wasm-to-JS callback (`forEachColliderHandle` `:560`, `forEachRigidBodyHandle` `:1998`) and then every cached wrapper through `raw.contains(handle)` (`:6578`, `:4875`). It costs 1.26 / 1.14 / 1.40 / 0.80 ms profiled (workshop / Dunes / Well / Garden) against 0.57 / 0.58 / 0.46 / 0.40 for the step itself, and all of `Physics.step`'s allocation (240 KB a tick) is in it. Change, in `Physics.init` after `:48`: `const w = this.world, full = w.mapNewSoftBodies.bind(w); let n = 0; w.mapNewSoftBodies = () => { if (++n % 600 === 0) full(); };` (a safety pass every ten seconds; or set a dirty flag in wrappers of `createRigidBody` / `removeRigidBody` and run it only then). The JS maps stay right without it: creation maps at once, `remove()` unmaps the body's own colliders and joints. Measured by patching exactly that: median tick 6.7 -> 5.2 (workshop), 9.2 -> 7.9 (Dunes), 8.3 -> 6.8 (Well), 5.9 -> 4.4 ms (Garden), five rounds each. Risk: low; run the stress test once since it touches physics. It is also worth most where frames are slow: every catch-up step pays it.

**2. Weir fish.** 16 fish near the oasis: `Weir.update` 1.17 ms a tick (`weir.js:279`; `fishmesh.js:68` `shape` is 0.59 ms profiled by itself, 52 KB a tick of garbage, 16 position-buffer uploads a draw), and a draw of **510 calls instead of 338** (`main | Group` 218 against 45). 55 of the fish's fin triangles use the material at `fishmesh.js:91`, `MeshBasicMaterial({ transparent: true, side: DoubleSide, depthWrite: false })`; three.js draws a transparent DoubleSide material in two passes (back, then front) and sets `material.needsUpdate = true` before each (`chunk-G7K22NUO.js:17949`-`:17955`), so each of the 55 fins costs 2 calls and 2 full program resolutions per frame: `getProgram` + `getParameters` + `getProgramCacheKey` are **6.2 ms of the Dunes' 43.8 ms profiled draw**. (a) Add `forceSinglePass: true` to the fin material (depth write is already off, so the only change is the order of a fin's two faces): -55 calls and the 6.2 ms; (b) drive the swim from a vertex shader (one geometry and one draw per species) or merge a fish's parts: -110 more calls and the 273-vertex rewrite; (c) update shapes at 30 Hz, and only for fish in view. Calissa's look: (a) is invisible, (b) and (c) need her eye.

**3. The Garden stops the world.** `main.js:1196` already has `aboard` (a crossing, the Garden, a duel) for the Courier's systems; the world's creatures, props and updaters are not behind it. Patching out wisps, jellies, clappers (both loops), breakables (update + preStep), spawnLook, interact, chests, testroom while the Garden is active: tick 4.2 -> 2.4 ms (-43%), measured. The Rapier step and sync (1.4 ms there) are not in that figure; the Garden has its own `realm.fixed` (0.03 ms) so the world's step may be skippable too, but I did not check what in the Garden uses the shared Rapier world. Risk: medium: whatever must keep running while you are in the Garden (timers on the game clock, regrowth, weather) has to be listed; the day clock does not live in these updaters as far as I read.

**4. Gate the creatures.** `clappers.js:235` / `:566`: skip the clapper if `zones.whole` differs from the clapper's, and keep a 4 Hz heartbeat for its job state. `lanternwisp.js:190`: move `c.mixer.update(dt)` below the far test (`:198`) and let far wisps run their brain only. Same pattern as `dunes.js:410`. Saved per the timers: 0.2 (workshop, wisps), 0.5 (Dunes, clappers), 0.5 (Well), 0.6 (Garden, inside #3).

**5. Unmet siblings.** `meeting.js:65` runs `W.rig.animate` every tick for each waiting sibling inside 30 m (0.3 ms each). Animate at 4 Hz past 12 m or off screen (the pose is an idle), and hide the rig (`hide(W, true)`, defined `:77`) when it is occluded or off screen so its 9 skinned meshes are not drawn: with the two waiting rigs hidden the workshop draw lost 36 calls and 7.1 ms, the Dunes 18 calls and 1.1 ms (noisy, same sign). `Skeleton.update` alone is 2.3 ms of the Dunes' profiled draw (30 skeletons, 65 bones each, `toArray` 1.8 ms); the Courier's, the wisps' and the clappers' are in that figure too.

**6. Hidden subtrees.** The scene holds 5,300 objects; 80% (workshop) to 84% (Dunes) are hidden by zone, and `scene.updateMatrixWorld()` still composes and multiplies all of them every draw (`chunk-G7K22NUO.js:4766`; 5.9 ms of the 43.8 profiled in the Dunes, 14%). In `Zones.update` (`zones.js:116`-`:125`; `zoneOff` is set at `:125`) when a top-level object's `zoneOff` turns true set `o.updateMatrixWorld = noop` (and on turning false `delete` it, set `matrixWorldNeedsUpdate = true`, call it once with `force`). A/B: -1.4 ms (workshop), -6.3 ms (Dunes) of draw CPU, noisy. Risk: medium. Code that reads `.matrixWorld` of a hidden object directly (not through `getWorldPosition`, which recomputes) sees stale numbers until it is shown again.

**7. Shadow pass.** 161 of the workshop's 679 calls (24%) and 5.3 ms of draw CPU are the sun's shadow pass (136 mesh + 14 skinned + 9 batched + 2 instanced calls); the Dunes has 69 to 77 calls but 0.2 ms. `main.js:1351` re-renders the shadow map every frame. Options: `castShadow = false` on small and distant props, shadow only what is within ~25 m of the Courier, or refresh the map every other frame while the sun target has not snapped (`dunes.js:449`-`:452` snaps it to 4 m). Risk: medium, it changes what the owner sees.

**8. Outlines.** 148 of the workshop's main-scene calls (22% of 679) are inverted-hull outline meshes, one per merged static mesh (`render/outline.js:60`, `render/merge.js`); the Dunes has 37. They share `OUTLINE_MAT` and never move: bake each zone's static outlines into one or a few meshes (the pots' outlines already are batched, `propbatch.js`). -140 calls is about 4 ms.

**9. SpawnLook.** `spawnlook.js:301`: `if (!B.length && this.clean) return;` and set `clean` after the zeroing pass. Also stops two instance-buffer uploads a draw. Measured +0.4 / +0.4 / +0.5 ms.

**10. Light budget.** Rescore at ~10 Hz, cache a static lamp's world position, and make `adopt` event-driven so the once-a-second `scene.traverse` (a 4.1 ms hitch in the spike probe) goes. Keep the per-frame `s.k` fade. A/B showed 0.6 ms in the workshop and nothing resolved elsewhere; the timers say 0.16 to 0.39.

**11 to 16** are small; the cite and the change are in the table and in section 3.

## 5. GC pressure

The profile shows `(garbage collector)` at **2.1% (workshop), 2.9% (Dunes), 2.6% (Well), 2.7% (Garden) of the tick**, 0.27 / 0.48 / 0.28 / 0.16 ms a tick, and the Dunes profile has ten stops of 4 ms or more attributed to it (56 ms in 300 ticks). Allocation is steady and high: **826 / 811 / 803 / 539 KB a tick** from the heap sampler (16 KB interval, garbage included), 890 / 787 / 817 / 544 KB from the heap-size growth between ticks; **about 50 MB a second at 60 fps**. V8 ran a scavenge in 130 / 114 / 121 / 76 of 300 ticks (every 2 to 4 ticks). This is churn, not growth (the heap saw-tooths: a drop in 76 to 130 of 300 ticks; I did not look for leaks), and on a junk laptop with a small young generation it means a scavenge every 40 to 70 ms.

Top sampled sites, charged to the nearest `src/` frame (KB a tick, share of all garbage), with the allocator underneath:

| site | workshop | Dunes | Well | Garden | what allocates |
|---|---|---|---|---|---|
| `Physics.step` `core/physics.js:94` | 241 (29%) | 238 (29%) | 334 (42%) | 241 (45%) | **all of it the post-step bookkeeping**: `__wbg_call_187d...` (the 1-arg wasm callbacks) 178 KB, `mapNewSoftBodies` 31, `unmapRemovedColliders` 20, `unmapRemovedBodies` 9 |
| `Physics.sync` `physics.js:110` | 95 (11%) | 96 (12%) | 103 (13%) | 104 (19%) | `translation()` and `rotation()` build a wrapper object each, per synced body (477) per tick |
| `Character.footIK` `character.js:867` | 74 (9%) | 51 (6%) | 24 (3%) | - | `new Vector3` x ~10 per call, `for..of` iterators (`next` 19 KB), `{}` records |
| `BodyProxies.deepest` `bodyproxies.js:100` | 58 (7%) | 81 (10%) | 63 (8%) | - | `Math.hypot` (22 to 30 KB, a boxed number per call) and the `section()` object in `depth()` |
| `standoff.apply` `standoff.js:29` | 36 (4%) | 19 (2%) | 19 (2%) | - | `push` into fresh arrays |
| `fishmesh.shape` `fishmesh.js:68` | - | 52 (6%) | - | - | `toArray`, per-vertex temporaries |
| `animator.sample` `anim/animator.js:25` | 17 | 12 | 7 | - | `Math.hypot` |
| `LanternWisps.update` `lanternwisp.js:187` | 14 | 16 | 13 | 14 | `AnimationMixer` `Interpolant.evaluate` results |
| `Temper.update` `vfx/temper.js:58` | 14 | 6 | 6 | 6 | `Object.entries` |
| `Physics.raycast` `physics.js:120` | 10 | 15 | 18 | - | a `Ray`, two `Vector3`s and a result per cast |
| `carry.find` `moves/carry.js:124` | 10 | 10 | 9 | 7 | iterators, candidate arrays |

Fixing #1 and #12 removes 336 to 437 KB a tick of the 540 to 830 (41 to 64%), and #15 plus swapping `Math.hypot` for `Math.sqrt(x*x+y*y)` in `animator.js:25`, `rom.js:54` and `bodyproxies.js` another 40 to 60 KB. The sampler's per-site numbers are estimates (16 KB interval); the ranking is solid, the third digit is not.

## 6. The draw's CPU side (Dunes), what it is made of

**The draw's CPU side in the Dunes** (30 `G.draw()` calls, each followed by a 1-pixel readPixels; the wait inside readPixels is removed)

43.8 ms of CPU per draw with the profiler on. Unprofiled, the same call (`G.draw()` alone, timed before the sync) came to 27.0 ms in the workshop and 43.1 ms in the Dunes in one probe (6 draws each, range 23 to 31 and 26 to 61), and 20 to 27 ms in the Dunes in the A/B probe: this number moves 2x between runs, so read it as "20 to 45 ms, 3 to 4 times the tick". The readPixels wait, the software rasteriser finishing, was 6,125 ms a draw and is not CPU.

| # | self % of the draw's CPU | ms/draw (profiled) | incl. % | function | file:line | what it does |
|---|---|---|---|---|---|---|
| 1 | 12.5% | 5.484 | 14.3% | `updateMatrixWorld` | node_modules/.vite/deps/chunk-G7K22NUO.js:4766 | scene.updateMatrixWorld(): recompose and re-multiply the matrix of every one of the 5,300 objects (80% of them hidden by zone) down the scene graph |
| 2 | 9.0% | 3.959 | 9.3% | `getParameters` | node_modules/.vite/deps/chunk-G7K22NUO.js:12426 | WebGLPrograms.getParameters: rebuilds a material's shader parameter object; runs on every material.needsUpdate, i.e. twice a frame for each of the 55 transparent DoubleSide fish fins (three draws those back faces then front faces) |
| 3 | 5.5% | 2.391 | 55.1% | `WebGLRenderer.renderBufferDirect` | node_modules/.vite/deps/chunk-G7K22NUO.js:17515 | the per-draw-call body: state, binding, draw |
| 4 | 4.6% | 2.028 | 4.6% | `toArray` | node_modules/.vite/deps/chunk-G7K22NUO.js:4223 | Matrix4.toArray under Skeleton.update: 65 bone matrices for every skinned mesh in view (30 skeletons: the Courier, the unmet siblings, wisps, clappers) |
| 5 | 4.5% | 1.991 | 17.2% | `renderObject` | node_modules/.vite/deps/chunk-G7K22NUO.js:13682 | the shadow pass's recursive walk of the scene graph (WebGLShadowMap.renderObject), submitting every caster again |
| 6 | 4.1% | 1.805 | 9.5% | `projectObject` | node_modules/.vite/deps/chunk-G7K22NUO.js:17794 | frustum culling and render-list building: another full walk of the scene graph |
| 7 | 3.0% | 1.306 | 40.2% | `setProgram` | node_modules/.vite/deps/chunk-G7K22NUO.js:18051 | per call: checks whether the material's program is still the right one, then uploads uniforms |
| 8 | 2.9% | 1.288 | 2.9% | `multiplyMatrices` | node_modules/.vite/deps/chunk-G7K22NUO.js:3768 | the multiply under updateMatrixWorld and Skeleton.update |
| 9 | 2.9% | 1.251 | 2.9% | `(garbage collector)` | (native) | V8 garbage collection during the draw |
| 10 | 2.5% | 1.092 | 2.5% | `bindVertexArray` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 11 | 2.5% | 1.077 | 2.5% | `uniformMatrix4fv` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 12 | 2.2% | 0.952 | 2.8% | `getProgramCacheKey` | node_modules/.vite/deps/chunk-G7K22NUO.js:12641 | builds the program cache key string for a material (again for every needsUpdate) |
| 13 | 2.0% | 0.873 | 2.0% | `getBindingState` | node_modules/.vite/deps/chunk-G7K22NUO.js:9280 | finds the vertex-array binding for a geometry + program per draw call |
| 14 | 1.9% | 0.830 | 14.1% | `getProgram` | node_modules/.vite/deps/chunk-G7K22NUO.js:17962 | program lookup after a needsUpdate (the fish fins) |
| 15 | 1.9% | 0.829 | 2.9% | `setValue` | node_modules/.vite/deps/chunk-G7K22NUO.js:11628 | WebGLUniforms: one uniform set |
| 16 | 1.2% | 0.525 | 3.8% | `setValueM4` | node_modules/.vite/deps/chunk-G7K22NUO.js:11175 | WebGLUniforms: a mat4 uniform |
| 17 | 1.2% | 0.513 | 1.2% | `update` | node_modules/.vite/deps/chunk-G7K22NUO.js:8279 | WebGLAttributes.update: buffer version check/upload |
| 18 | 1.1% | 0.464 | 10.3% | `upload` | node_modules/.vite/deps/chunk-G7K22NUO.js:11681 | WebGLUniforms.upload: all of a program's material uniforms for a draw |
| 19 | 0.9% | 0.409 | 0.9% | `bindTexture` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 20 | 0.9% | 0.382 | 0.9% | `uniform4fv` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 21 | 0.8% | 0.368 | 0.8% | `get` | node_modules/.vite/deps/chunk-G7K22NUO.js:12865 | WebGLProperties.get (per-object property lookup) |
| 22 | 0.8% | 0.349 | 0.8% | `texSubImage2D` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 23 | 0.8% | 0.345 | 1.3% | `refreshUniformsCommon` | node_modules/.vite/deps/chunk-G7K22NUO.js:16685 | material uniform refresh (colour, opacity, maps) |
| 24 | 0.8% | 0.344 | 2.5% | `refreshMaterialUniforms` | node_modules/.vite/deps/chunk-G7K22NUO.js:16642 | material uniform refresh |
| 25 | 0.8% | 0.335 | 0.8% | `needsUpdate` | node_modules/.vite/deps/chunk-G7K22NUO.js:9321 | WebGLBindingStates.needsUpdate |
| 26 | 0.8% | 0.332 | 0.8% | `drawElements` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 27 | 0.7% | 0.328 | 51.3% | `renderScene` | node_modules/.vite/deps/chunk-G7K22NUO.js:17852 | the main scene's render-list pass |
| 28 | 0.7% | 0.326 | 1.4% | `setValueV3f` | node_modules/.vite/deps/chunk-G7K22NUO.js:11109 | WebGLUniforms: a vec3 uniform |
| 29 | 0.7% | 0.320 | 0.7% | `useProgram` | (native) | native GL entry point (a WebGL call serialised to the GPU process) |
| 30 | 0.7% | 0.298 | 1.2% | `onBeforeRender` | node_modules/.vite/deps/chunk-G7K22NUO.js:20366 | BatchedMesh.onBeforeRender: culling and sorting of the batch's instances, plus the indirect texture upload (13 batches) |



**Where the draw's calls come from** (one `G.draw()`, counted in `renderBufferDirect`):

| | workshop | Dunes (16 fish) |
|---|---|---|
| main scene, plain meshes | 288 | 304 (218 of them the fish) |
| main scene, **outline passes** | **148** | 37 |
| main scene, batched (pots) / skinned / instanced | 16 / 14 / 6 | 8 / 27 / 10 |
| **sun shadow pass** | **161** | 77 |
| overlay scene (Calissa's UI: the Lachrimeter tube 16, 22 groups, 8 meshes) | 46 | 46 |
| **total** | **679** (680 to 733 across my probes; perf.mjs's own gate said 431 for the 07:16 baseline: I did not reconcile the two counts, mine sums one `G.draw()` including the shadow and overlay passes) | **509** (338 in a probe taken before the fish had spawned) | |

Three whole-scene walks per draw: `updateMatrixWorld` (all 5,300 objects, 5.9 ms profiled), `projectObject` (visible ones, 4.0), and the shadow pass's `renderObject` recursion (7.7 including its submissions). Plus `Skeleton.update` for every skinned mesh in view (2.3), the overlay scene's own `renderer.render` (2.2), and 14 ms in `setProgram` of which 6.2 is the fins' repeated program lookups.

A/B on the draw (each condition vs its neighbours, `G.draw()` CPU only; +/- 3 ms; ms saved, calls before -> after):

| patch | workshop | Dunes |
|---|---|---|
| hide the unmet siblings' rigs | 7.1 ms, 733 -> 697 | 1.1 ms, 323 -> 305 |
| sun shadow map off | 5.3 ms, 733 -> 564 | 0.2 ms, 323 -> 254 |
| overlay scene off | 3.7 ms, 703 -> 667 | 1.8 ms, 323 -> 287 |
| matrix updates skipped for hidden top-level objects | 1.4 ms | 6.3 ms |
| `forceSinglePass` on the materials my hook found (it missed the fins, see below) | 1.1 ms | 4.4 ms |
| freeze 4,200 static objects | 0.1 ms | -0.2 ms |

(The `forceSinglePass` row did not test what I meant: the hook saw `side === DoubleSide` only on materials that three had not already flipped to a back-face pass, so it set the flag on 34 / 3 other materials and left the fins alone. The 4.4 ms in the Dunes is therefore noise or an unrelated material; the fins' share is the 6.2 ms profile figure in #2.)

## 7. Raw data and scripts

All under `/tmp/claude-0/-home-user-foolsfortune/7ddd9ef9-14a1-57fc-9770-50b98014ffca/scratchpad/clean/`.

* `measure.mjs` the measurement (copy of `perf.mjs`'s setup; port 5191): per place a perf-style pass, 300 plain ticks (with `diag.phase` deltas), a CPU profile of 300 ticks, 300 ticks under per-system timers, a heap sampling run, a DOM / canvas / texture / raycast call census; the Dunes also a 30-draw profile. Log `measure.log`; raw in `raw/` (`<place>.tick.cpuprofile`, `dunes.draw.cpuprofile`, `<place>.heap.json`, `<place>.instr.json`, `<place>.counts.json`, `<place>.plain.json`, `summary.json`). Run once, no page errors.
* `census.mjs` (scene census, raycasts by caller, 600-tick spike probe, unsynced draw CPU), `experiments.mjs` and `experiments_draw.mjs` (the A/B patches; the first draw run threw on a null scene in my census hook and was run again with the hook fixed), `callprobe.mjs`, `meshprobe.mjs`, `outlineprobe.mjs` (draw-call composition). Outputs `raw/census.json`, `raw/experiments.json`, `raw/experiments_draw.json`, `raw/callprobe.json`, `raw/outlineprobe.json`.
* `analyze.mjs`, `analyze2.mjs`, `heap.mjs`, `lines.mjs`, `instr_table.mjs`, `gen.mjs` turn the raw into the tables above (`tables.md`, `instr_table.md`, `heap_tables.txt`).

### 7.1 Counts that matter (`raw/census.json`)

5,307 scene objects (1,081 visible in the workshop, 848 in the Dunes), 3,858 meshes, 74 skinned meshes (47 visible in the workshop), 98 lights of which 87 lamp proxies and 8 lent; 828 Rapier bodies, 1,860 colliders, 477 synced, 54 awake in the workshop and 27 in the Dunes; 298 pots (244 and 257 parked), 136 rope segments, 6 clappers, 4 wisps, 3 jellies, 19 creatures; 5,294 of 5,307 objects have `matrixAutoUpdate` on. Rapier events a tick: 0.07 (workshop), 0.01 (Dunes). Slowest ticks of 600 with their systems (`raw/census.json`, `spikes`): workshop 22 ms (techs.tick 2.1, interact 1.9, poseHands 1.9), 21 (poseHands 4.1, breakables 3.7), 18 (poseHands 4.0, animate 3.3), zones.update 2.5 to 3.4 in four of them; Dunes 28.4 ms (**lights.scan 4.1**), 21.2 (breakables 5.7, **dunes.update 5.6**), 20.6 (zones 3.2), 20.6 (physics.step 7.7), 17.9 (lockheart.tick 3.6). The first-300-ticks run saw 60 and 100 ms ticks in the Dunes (and 78 and 85 in the Well and Garden) that the 600-tick probe did not reproduce (worst 28 ms); the profile's longest stops in the Dunes are GC (ten stops, 56 ms in all) and single samples inside interact, the Weir and the clappers' kinematic moves, but I did not catch one tick in the act.

### 7.2 Per-system timers, inclusive ms a tick (`instr_table.md`)

tick under timers (median/mean): workshop 8.30/9.38  dunes 10.30/12.69  well 7.60/8.14  garden 4.40/4.69

| system (wrapped entry point) | workshop incl (excl) | dunes incl (excl) | well incl (excl) | garden incl (excl) | calls/tick |
|---|---|---|---|---|---|
| game.physics.step | 1.295 (1.295) | 1.567 (1.567) | 1.397 (1.397) | 1.093 (1.093) | 1.0 |
| game.character.poseHands | 1.344 (1.344) | 1.433 (1.433) | 1.137 (1.137) | - | 1.0 |
| game.weir.update | 0.027 (0.027) | 1.174 (1.174) | 0.014 (0.014) | 0.018 (0.018) | 1.0 |
| game.breakables.update | 0.785 (0.785) | 0.645 (0.645) | 0.458 (0.458) | 0.366 (0.366) | 1.0 |
| game.meetings.update | 0.630 (0.630) | 0.395 (0.395) | 0.024 (0.024) | - | 1.0 |
| game.character.animate | 0.568 (0.503) | 0.624 (0.579) | 0.451 (0.405) | - | 1.0 |
| game.techs.tick | 0.394 (0.207) | 0.507 (0.299) | 0.322 (0.166) | - | 1.0 |
| game.player.fixedUpdate | 0.318 (0.133) | 0.455 (0.211) | 0.323 (0.151) | - | 1.0 |
| game.physics.sync | 0.404 (0.404) | 0.445 (0.445) | 0.333 (0.333) | 0.289 (0.289) | 1.0 |
| game.jellies.update | 0.058 (0.058) | 0.422 (0.313) | 0.373 (0.232) | 0.040 (0.040) | 1.0 |
| game.physics.raycast | 0.252 (0.245) | 0.414 (0.400) | 0.341 (0.318) | 0.001 (0.001) | 18.7 |
| game.realm.update | 0.004 (0.004) | 0.000 (0.000) | 0.001 (0.001) | 0.396 (0.394) | 1.0 |
| game.wisps.update | 0.222 (0.222) | 0.395 (0.342) | 0.185 (0.185) | 0.173 (0.173) | 1.0 |
| game.lights.update | 0.235 (0.235) | 0.391 (0.391) | 0.276 (0.276) | 0.156 (0.156) | 1.0 |
| game.present.update | 0.087 (0.087) | 0.265 (0.265) | 0.063 (0.063) | 0.061 (0.061) | 1.0 |
| game.clappers.fixedUpdate | 0.232 (0.229) | 0.265 (0.264) | 0.184 (0.184) | 0.255 (0.254) | 1.0 |
| game.clappers.update | 0.180 (0.180) | 0.263 (0.263) | 0.140 (0.140) | 0.139 (0.139) | 1.0 |
| game.dunes.update | 0.007 (0.007) | 0.260 (0.113) | 0.008 (0.008) | 0.005 (0.005) | 1.0 |
| game.spawnLook.update | 0.206 (0.206) | 0.215 (0.215) | 0.178 (0.178) | 0.166 (0.166) | 1.0 |
| game.techs.step | 0.147 (0.081) | 0.208 (0.118) | 0.132 (0.078) | - | 1.0 |
| game.paintmap.update | 0.004 (0.004) | 0.113 (0.113) | 0.202 (0.202) | 0.005 (0.005) | 1.0 |
| game.zones.update | 0.148 (0.148) | 0.154 (0.154) | 0.133 (0.133) | 0.121 (0.121) | 1.0 |
| game.renderer.render | - | 0.147 (0.147) | - | - | 1.0 |
| game.interact.update | 0.142 (0.142) | 0.118 (0.118) | 0.105 (0.105) | 0.098 (0.098) | 1.0 |
| game.veritome.tick | 0.062 (0.062) | 0.096 (0.096) | 0.068 (0.068) | - | 1.0 |
| game.movers.pre | 0.084 (0.084) | 0.087 (0.087) | 0.058 (0.058) | 0.051 (0.051) | 1.0 |
| game.player.updateCamera | 0.061 (0.042) | 0.084 (0.039) | 0.087 (0.053) | - | 1.0 |
| game.chests.update | 0.049 (0.049) | 0.082 (0.082) | 0.038 (0.038) | 0.030 (0.030) | 1.0 |
| game.breakables.preStep | 0.073 (0.073) | 0.055 (0.055) | 0.048 (0.048) | 0.037 (0.037) | 1.0 |
| game.temper.update | 0.032 (0.032) | 0.071 (0.071) | 0.023 (0.023) | 0.021 (0.021) | 1.0 |
| game.vfx.update | 0.056 (0.044) | 0.069 (0.048) | 0.052 (0.036) | 0.053 (0.043) | 1.0 |
| game.weapon.update | 0.060 (0.060) | 0.069 (0.069) | 0.043 (0.043) | - | 1.0 |
| game.dreamvane.tick | 0.069 (0.069) | 0.039 (0.039) | 0.038 (0.038) | - | 1.0 |
| game.movers.render | 0.055 (0.055) | 0.069 (0.069) | 0.044 (0.044) | 0.030 (0.030) | 1.0 |
| game.testroom.update | 0.067 (0.067) | 0.068 (0.068) | 0.034 (0.034) | 0.030 (0.030) | 1.0 |
| game.achievements.tick | 0.038 (0.038) | 0.068 (0.068) | 0.046 (0.046) | 0.038 (0.038) | 1.0 |
| game.weatherLook.update | 0.043 (0.043) | 0.029 (0.029) | 0.062 (0.062) | 0.035 (0.035) | 1.0 |
| game.folk.update | 0.062 (0.062) | 0.057 (0.057) | 0.011 (0.011) | 0.010 (0.010) | 1.0 |
| game.movers.post | 0.042 (0.042) | 0.057 (0.057) | 0.031 (0.031) | 0.022 (0.022) | 1.0 |
| game.shells.update | 0.035 (0.035) | 0.057 (0.057) | 0.032 (0.032) | 0.030 (0.030) | 1.0 |
| game.ostraca.update | 0.012 (0.012) | 0.049 (0.049) | 0.008 (0.008) | 0.009 (0.009) | 1.0 |
| game.tracking.update | 0.026 (0.026) | 0.042 (0.042) | 0.037 (0.037) | 0.031 (0.031) | 1.0 |
| game.cartography.update | 0.035 (0.027) | 0.038 (0.031) | 0.040 (0.030) | 0.002 (0.002) | 1.0 |
| game.crucibelleHud.update | 0.020 (0.020) | 0.038 (0.038) | 0.020 (0.020) | 0.015 (0.015) | 1.0 |
| game.weapon.computeAimPoint | 0.036 (0.004) | 0.026 (0.006) | 0.020 (0.001) | - | 1.0 |


### 7.3 Heap sampling in full (`heap_tables.txt`)

```
workshop: 253.7 MB sampled over 300 ticks = 826 KB/tick (garbage included)

charged to the nearest src/ frame:
| 1 | 240.8 KB/tick | 29.2% | step core/physics.js:94 |
| 2 | 94.5 KB/tick | 11.4% | sync core/physics.js:110 |
| 3 | 74.3 KB/tick | 9.0% | footIK courier/character.js:867 |
| 4 | 57.8 KB/tick | 7.0% | deepest courier/anim/bodyproxies.js:100 |
| 5 | 36.1 KB/tick | 4.4% | apply courier/anim/standoff.js:29 |
| 6 | 17.6 KB/tick | 2.1% | update render/propbatch.js:141 |
| 7 | 17.1 KB/tick | 2.1% | sample courier/anim/animator.js:25 |
| 8 | 14.4 KB/tick | 1.7% | update vfx/temper.js:58 |
| 9 | 13.7 KB/tick | 1.7% | update creatures/wisp/lanternwisp.js:187 |
| 10 | 10.2 KB/tick | 1.2% | find courier/moves/carry.js:124 |

split by the allocating (non-src) callee:
| 1 | 177.9 KB/tick | step core/physics.js:94  <- __wbg_call_187d372bd5fdd4aa |
| 2 | 31.4 KB/tick | step core/physics.js:94  <- mapNewSoftBodies |
| 3 | 21.6 KB/tick | deepest courier/anim/bodyproxies.js:100  <- hypot |
| 4 | 20.2 KB/tick | step core/physics.js:94  <- unmapRemovedColliders |
| 5 | 19.1 KB/tick | footIK courier/character.js:867  <- next |
| 6 | 12.4 KB/tick | update creatures/wisp/lanternwisp.js:187  <- evaluate |
| 7 | 9.0 KB/tick | sample courier/anim/animator.js:25  <- hypot |
| 8 | 8.8 KB/tick | step core/physics.js:94  <- unmapRemovedBodies |
| 9 | 8.0 KB/tick | apply courier/anim/standoff.js:29  <- push |
| 10 | 5.8 KB/tick | update world/props/breakables.js:887  <- next |

dunes: 249.2 MB sampled over 300 ticks = 811 KB/tick (garbage included)

charged to the nearest src/ frame:
| 1 | 237.6 KB/tick | 29.3% | step core/physics.js:94 |
| 2 | 96.3 KB/tick | 11.9% | sync core/physics.js:110 |
| 3 | 81.0 KB/tick | 10.0% | deepest courier/anim/bodyproxies.js:100 |
| 4 | 51.9 KB/tick | 6.4% | shape tools/sondelass/angling/fishmesh.js:68 |
| 5 | 50.5 KB/tick | 6.2% | footIK courier/character.js:867 |
| 6 | 19.3 KB/tick | 2.4% | apply courier/anim/standoff.js:29 |
| 7 | 16.2 KB/tick | 2.0% | update creatures/wisp/lanternwisp.js:187 |
| 8 | 15.3 KB/tick | 1.9% | raycast core/physics.js:120 |
| 9 | 11.5 KB/tick | 1.4% | sample courier/anim/animator.js:25 |
| 10 | 9.6 KB/tick | 1.2% | find courier/moves/carry.js:124 |

split by the allocating (non-src) callee:
| 1 | 172.0 KB/tick | step core/physics.js:94  <- __wbg_call_187d372bd5fdd4aa |
| 2 | 32.8 KB/tick | step core/physics.js:94  <- mapNewSoftBodies |
| 3 | 29.9 KB/tick | deepest courier/anim/bodyproxies.js:100  <- hypot |
| 4 | 19.6 KB/tick | step core/physics.js:94  <- unmapRemovedColliders |
| 5 | 13.0 KB/tick | footIK courier/character.js:867  <- next |
| 6 | 12.2 KB/tick | update creatures/wisp/lanternwisp.js:187  <- evaluate |
| 7 | 10.3 KB/tick | step core/physics.js:94  <- unmapRemovedBodies |
| 8 | 8.0 KB/tick | apply courier/anim/standoff.js:29  <- push |
| 9 | 5.6 KB/tick | sample courier/anim/animator.js:25  <- hypot |
| 10 | 5.1 KB/tick | (anon) tools/sondelass/angling/weir.js:195  <- toArray |

well: 246.8 MB sampled over 300 ticks = 803 KB/tick (garbage included)

charged to the nearest src/ frame:
| 1 | 334.1 KB/tick | 41.6% | step core/physics.js:94 |
| 2 | 102.8 KB/tick | 12.8% | sync core/physics.js:110 |
| 3 | 63.4 KB/tick | 7.9% | deepest courier/anim/bodyproxies.js:100 |
| 4 | 24.2 KB/tick | 3.0% | footIK courier/character.js:867 |
| 5 | 18.6 KB/tick | 2.3% | apply courier/anim/standoff.js:29 |
| 6 | 18.0 KB/tick | 2.2% | raycast core/physics.js:120 |
| 7 | 13.3 KB/tick | 1.7% | update creatures/wisp/lanternwisp.js:187 |
| 8 | 9.4 KB/tick | 1.2% | near creatures/creatures.js:79 |
| 9 | 9.3 KB/tick | 1.2% | find courier/moves/carry.js:124 |
| 10 | 8.6 KB/tick | 1.1% | limit courier/anim/rom.js:54 |

split by the allocating (non-src) callee:
| 1 | 242.7 KB/tick | step core/physics.js:94  <- __wbg_call_187d372bd5fdd4aa |
| 2 | 43.3 KB/tick | step core/physics.js:94  <- mapNewSoftBodies |
| 3 | 33.0 KB/tick | step core/physics.js:94  <- unmapRemovedColliders |
| 4 | 24.4 KB/tick | deepest courier/anim/bodyproxies.js:100  <- hypot |
| 5 | 12.6 KB/tick | step core/physics.js:94  <- unmapRemovedBodies |
| 6 | 12.0 KB/tick | update creatures/wisp/lanternwisp.js:187  <- evaluate |
| 7 | 7.8 KB/tick | apply courier/anim/standoff.js:29  <- push |
| 8 | 5.6 KB/tick | footIK courier/character.js:867  <- next |
| 9 | 4.3 KB/tick | raycast core/physics.js:120  <- castRayAndGetNormal |
| 10 | 4.0 KB/tick | limit courier/anim/rom.js:54  <- hypot |

garden: 165.7 MB sampled over 300 ticks = 539 KB/tick (garbage included)

charged to the nearest src/ frame:
| 1 | 241.4 KB/tick | 44.8% | step core/physics.js:94 |
| 2 | 104.0 KB/tick | 19.3% | sync core/physics.js:110 |
| 3 | 17.0 KB/tick | 3.2% | fixedUpdate creatures/clappers.js:233 |
| 4 | 14.1 KB/tick | 2.6% | update creatures/wisp/lanternwisp.js:187 |
| 5 | 10.8 KB/tick | 2.0% | pull world/raceway/track.js:307 |
| 6 | 8.3 KB/tick | 1.5% | dump world/garden/clay.js:130 |
| 7 | 7.2 KB/tick | 1.3% | find courier/moves/carry.js:124 |
| 8 | 6.6 KB/tick | 1.2% | update creatures/clappers.js:563 |
| 9 | 6.5 KB/tick | 1.2% | update vfx/temper.js:58 |
| 10 | 6.5 KB/tick | 1.2% | heightAt world/raceway/park.js:62 |

split by the allocating (non-src) callee:
| 1 | 179.4 KB/tick | step core/physics.js:94  <- __wbg_call_187d372bd5fdd4aa |
| 2 | 30.8 KB/tick | step core/physics.js:94  <- mapNewSoftBodies |
| 3 | 20.1 KB/tick | step core/physics.js:94  <- unmapRemovedColliders |
| 4 | 12.2 KB/tick | update creatures/wisp/lanternwisp.js:187  <- evaluate |
| 5 | 11.7 KB/tick | fixedUpdate creatures/clappers.js:233  <- __wbg_call_187d372bd5fdd4aa |
| 6 | 8.7 KB/tick | step core/physics.js:94  <- unmapRemovedBodies |
| 7 | 8.3 KB/tick | sync core/physics.js:110  <- translation |
| 8 | 8.2 KB/tick | sync core/physics.js:110  <- rotation |
| 9 | 5.5 KB/tick | dump world/garden/clay.js:130  <- next |
| 10 | 4.8 KB/tick | sync core/physics.js:110  <- next |


```

## Verified and not verified

Verified: the four tick medians and tables above (one run, no page errors); that the Rapier bookkeeping is 68 to 75% of `Physics.step`, redundant for this game's API use, and worth 1.3 to 1.5 ms a tick when patched out in all four places; the allocation rates and sites; the draw's call composition and that the fins are drawn twice; the Garden's world-asleep saving; that freezing static matrices does nothing measurable.

Not verified: any real GPU or browser other than headless Chromium on SwiftShader (Firefox's per-call cost is the owner's 26 us); what in the Spirit Garden uses the shared Rapier world (so whether #3 can also skip the step); the draw-side A/B magnitudes (they move 2x run to run, only the signs and the profile shares are firm); `forceSinglePass` on the fins and the hidden-subtree matrix skip as actual code (I patched around them, I did not write them); the 60 to 100 ms ticks in the Dunes' first 300 ticks (not reproduced in the 600-tick probe); the STORY-mode kit (all of this is the DEBUG kit with every tool worn, which overstates `poseHands` early in a real game); and whether `npm run perf`'s 431-call gate figure for the workshop counts the same set as my 679.
