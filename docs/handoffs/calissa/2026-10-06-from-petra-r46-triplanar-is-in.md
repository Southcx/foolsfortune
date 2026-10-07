**2026-10-06, from Petra: the triplanar material is in, with your surfaces; the foot's interface for your models' skirts**

Your R46 branch is merged into main (the casebook's rule numbers: your 11 and 12 are 15 and 16 now, after my four).

1. **`src/render/triplanar.js`** (after GPU Gems 3 ch. 1, Ben Golus, Inigo Quilez's two-scale sample against tiling):
   - `triplanar(material, { side, top?, foot?, scale = 0.25, sharp = 4, strength = 1, mode = 'detail' })` patches a three.js material
     (onBeforeCompile, chained after any patch it already has; one program per set of options, `customProgramCacheKey`).
   - `surfaceTexture(name)`: your six, loaded once each (`sand`, `sand_packed`, `rock`, `clay_floor`, `plaster`, `stone_flags`).
   - `mode: 'detail'` divides the texture by its own mean (its smallest mip), so it brings only its light and shade and the colour
     stays the material's. You graded them to the game's colours, so `'albedo'` (the texture is the colour, material white) works too.
   - The uniforms are on `material.userData.triplanar` (`tpStrength`, `tpScale`, `tpSharp`), for tuning.
2. **Where it is on now:** the Dunes' terrain (`sand` on the tops, `sand_packed` on the steep faces, strength 0.8) and the Dunemaw's
   sand (your `K.sand`, chained after your patch from `wellkit.js`; strength 0.75). Programs: no new one.
3. **Your models' skirts:** `foot: { tex, height, y? }`. The band `height` metres above the ground takes `tex` as its colour, fading
   up into the material's. The ground is the object's own origin, so a model must stand on its origin. Level geometry, which is merged
   in world space, gives the world height `y` instead. For example: `triplanar(lecternMat, { side: surfaceTexture('plaster'),
   foot: { tex: surfaceTexture('clay_floor'), height: 0.25 } })`. Each distinct foot is one program variant; share one where you can.
4. Not done, and yours if you want it: `vfx/surfaces.js` could take the CC0 surfaces in place of its procedural patterns (through this
   module, or as it is).
5. `vfx/water.js` `waterGeometry`, for you to consider: it lays four vertices a metre over a volume's whole box. The tripled pond cost
   94k triangles. I drop the dry triangles in `courier/moves/env.js`, which brings the pond to about 100k (the dunes shot 340k to 291k). A coarser grid away from the
   shore would take it further, if the wave reads at two vertices a metre.
6. Your note on the bright sand at forced night: the Dunes' glints and rim light were constant. They now follow the sun's intensity
   (`uGlow`, `world/dunes/dunes.js`).
