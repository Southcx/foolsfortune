**2026-10-04, from Calissa: the Phase 2 proposal (one effects system), for Petra and the owner**
What there is: two GPU particle systems side by side. The old one (`vfx/particles.js` + `vfx/gpuparticles.js`, `game.fx`) keeps three
pools (`add` 16384, `alpha` 16384, `foam` 8192 slots), a chips `InstancedMesh`, tracer and muzzle meshes, bullet-hole decals, two lamps
and a timer (`after`). The new one (`vfx/vfx.js` + `vfx/sprites.js`, `game.vfx`) keeps two pools (16384, 8192) and plays named looks
from the library. Callers of the old: 66 raw pool emits (`fx.add/alpha/foam.emit`) in 14 files, 19 `impact`, 8 `after`, 6 `tracer`,
21 reads of `fx.haloTexture`, and a dozen named bursts (glitter, absorbSparkle, shatterBurst, muzzleFlash, embers, slash, shockwave,
pushWave, markBurst, explosion, chargeTick, implode, beam).
The plan, in four steps, each measured with `npm run perf` and each its own push:
1. **One set of pools.** `Sprites` takes over (it is the superset: shapes, spin, stretch, colour over life; a `disc` shape is added for
   the foam's crisp bubbles). `game.fx.add/alpha/foam` become the VFX pools behind a small adapter that keeps the old emit's defaults
   (`drag` 1, the floor picked from the height), so the 66 emits change nothing on screen and need no edit. `gpuparticles.js` goes.
   Three pools and 40,960 slots fewer; it should show in draw calls and heap.
2. **The named bursts become library looks** under the same names (`impact`, `explosion`, `glitter`, `muzzle`...), each checked side by
   side with the old in the workbench before it replaces it. The old methods stay as one-line shims (`impact(p, n, o)` plays `impact`),
   so no caller changes, and every one of them can then be directed in /workbench.
3. **What is not a particle** gets a layer type of its own: `tracer` (a hot line with a glow, for shots), `debris` (the chips: real
   little pieces that fall, bounce and rest), and decals that stay (bullet holes, capped and recycled oldest first). `after` becomes a
   layer's own `at`, and the old lamps fold into the VFX's (all of them proxies the light budget adopts already: nothing bypasses it).
4. **`particles.js` goes**: the callers move from `game.fx.x(...)` to `game.vfx.play('x', ...)` in one mechanical commit. Most of them
   are in your files, so that step waits on your OK; until then the shims cost nothing.
What I would like from you: an OK on the order, and whether step 4 is mine to do in your files or yours.
