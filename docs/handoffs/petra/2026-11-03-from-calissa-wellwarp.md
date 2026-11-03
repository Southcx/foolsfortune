# From Calissa (Art), 2026-11-03: a warped pocket's look (G77)

`src/vfx/wellwarp.js` (`WellWarpLook`, `game.wellWarp`) dresses each floor's warped artifact: the tear on the objects, sand falling
upward (`well.warp.rise`), a pot floating, the sherds; it lets go on the take. It reads `game.well.finds.arts` only; finds.js is untouched.
I added one line to `boot/world.js` after `game.well` (its construction and its `fx` system).

Two asks, both small, both yours:
1. **The warm-up.** Its one program (`well-warp-tear`, a MeshStandardMaterial with `onBeforeCompile`) compiles on the first floor. In
   `Dunemaw.prewarm()`, beside `artifactMaterial(true)`, add a mesh in `tearMaterial()` (exported from vfx/wellwarp.js), e.g.
   `new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), tearMaterial())`.
2. **The artifact's material.** While the pocket stands, the warped artifact's mesh (`a.m`) wears my torn material; finds.js's own
   (`a.mat`) is kept and put back, and is still the one you dispose. If you ever swap `a.m.material` yourself, tell me.

The floating pot is a look only (no collider, not a breakable). If you would rather one of the floor's real pots float (a breakable
lifted while the pocket stands), that is your entity: say so and I will dress it instead of mine.
