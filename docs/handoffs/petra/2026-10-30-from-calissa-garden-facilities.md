**From Calissa (cups), 2026-10-30: the Spirit Garden's launch lotuses and facilities, dressed over your stand-ins**

South's ask: the jump pads and the facilities need a stronger identity. The looks are mine, in `src/vfx/garden/`; nothing in
`src/world/garden/` was edited.

- **What is hidden, not removed.** On `garden.enter` `LaunchLotuses` (`vfx/garden/launchlotus.js`) sets `visible = false` on the meshes in
  `site.group` that wear `site.mats.lotus` (the merged cones, and each bought planetoid's `garden-lotus`), never `garden-seed`. 
  `FacilityLooks` (`vfx/garden/facilitylooks.js`) hides the mesh that wears `site.mats.torii` (the gate's torii). The shed's stand-in box
  was mine (`vfx/garden/planetoid.js`) and is gone. The ask: drop the lotus cones and the torii from `place.js` `build()` and `link()`
  when you next pass through, so nothing draws them for nobody. `mats.lotus` stays for the hand's seed.
- **Where they stand.** `game.facilityLooks.spots` holds each one's frame (`kura`, `gate`, `athanor`, `mat`, `kiln` (5), `stack`). The
  Athanor's tower sits on the west shoulder at latitude 44 (it steps round if a plot or a lotus is within 5 m). The climbing kiln runs up
  the Chimney along longitude 140, latitude 10 to 45. The stack sits on the needle's summit platform. None of them has a body: the Jar
  and the camera pass through them as they pass through the hokora and the cocoon tree. If you want keep-outs, the frames are there.
- **The warm-up.** Both compile their own group under the seam's cover on the first `garden.enter`, the same way `realm.build()` does. A
  bought planetoid's lotuses rebuild the instances in `update`. If you would rather they were made inside `build()` before your compile,
  `new LaunchLotuses(game).build(realm)` and `FacilityLooks.dress(realm)` can be called from there.
- **Frame hub.** `boot/frame.js` calls `game.launchLotuses?.update(rawDt)` and `game.facilityLooks?.update(rawDt)` after
  `game.guestJars`. `boot/godhand.js` builds both after `game.gardenMood`.

New programs: the lotus's one (`garden-launch-lotus`) and the pollen arcs' one (`garden-pollen-arcs`). The facilities use the decor
pieces' program (`garden-decor-pieces`), on a plain mesh rather than the decor layer's batch.

Measured headless (SwiftShader, 1920 x 1080, every pass of a frame), the new looks shown against them hidden with the stand-ins shown,
in one session: at the Jar's view 154 to 162 draw calls and 110,635 to 190,097 triangles; wide over the garden 176 to 184 calls and
186,487 to 265,949 triangles. Most of the triangles are the lotuses' (about 4,100 each, 16 of them, shadows included). Not `npm run perf`.
