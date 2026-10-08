**2026-10-08, from Calissa (Art): the storm warp and the Umbral are ready for your rail's runtime (RAIL-OVERHAUL.md sections 4 and 5)**

Two services, built in `main.js` and ticked in its fx line (one call each, after the glitch's). Their screen share rides the glitch's own
pass (`game.glitch.veil`), so no second screen pass and no change to `render/glow.js` or `render/present.js`.

```
game.stormWarp.set({ storm, weather, mind })   storm 0..1 (the leg's); weather 0..1 or { aspect, strength } (the waypoint's: weatherAt);
                                               mind -2..2 or 'Stoic'..'Prismatic' (omit it: the Courier's own, game.courierMind)
game.stormWarp.k                               the strength applied (eased over ~1 real second, times the setting visual.warp; 0 outside
                                               the rail's zone)
game.stormWarp.bend(worldPos, camera, out)     where a point of the ENVIRONMENT is drawn now (anchor a muzzle flash or a shot's first
                                               frame to a bent big object's part; the logic keeps reading unbent positions)
game.umbral.set({ below })                     0 above .. 1 below, in between during the surface crossing; null (the default) follows the
                                               eye: the camera against the sea's height under it. Geometry (the meniscus) always follows the
                                               real eye; `below` steers only the look (the grade, the deep's fog, the caustics, the motes)
game.umbral.splash(pos, { power, dive })       where the ship (or anything) goes through the surface: the ring, the crown, the bubbles
game.umbral.above(obj, { r, len })             a thing floating above whose belly darkens the meniscus from below (up to six)
```

The opt-ins, at build time (before the warm-up), for whatever you and the other builders make:
- `warpMaterial(mat)` (vfx/stormwarp.js): an environment material bends (the ambient geometry). Free for a material whose program is
  its own (a ShaderMaterial, a custom key); a plain built-in material comes through as one new shared program per kind: count them.
- `warpObject(root)`: a big object made of plain materials is SEATED (drawn whole where the storm draws the world at its place: no new
  program, its parts true to each other). I seat the False Light and Old Nobody in `stage.js build()`.
- `causticsOn(root)` (vfx/umbral.js): the deep's caustics over a foe or a part built of plain materials (one shared program for all;
  a draw a mesh, only while under). The sloop already has them.
- `keepTrue(mat)`: the danger (the shots, the reticles, the lock marks, the hurtbox mark) stays exactly where it is drawn under the
  veil's haze. Free on a transparent material, which yours are; call it once on each when you build them.

Never warp the shots, the hurtbox, the ship, the reticles or the lock marks: the storm bends the world, never the danger.

My crossings into your files (call sites only): `main.js` (construct, and the two updates in the fx line), `world/emocean/stage.js`
(seat the brig and Old Nobody and bend Old Nobody's sea shadow in `build()`; a stand-in `stormWarp.set` in `look()`: 0.45 in a set
piece, 0.2 otherwise, laid down in the breather, until each leg carries its own storm), `core/config.js` (`visual.warp: 1`),
`debug/tuned.js` (it is a setting), `debug/tuning.js` (its slider 0..1 and a placeholder label).

To see it now: `/workbench`, MODELS, the group THE CROSSING (the surface crossing on a loop; the storm swelling 0 to 1).
