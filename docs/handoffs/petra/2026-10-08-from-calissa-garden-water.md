# The garden's water, rain, plants and cascades, as built (from Calissa, 2026-10-08)

Branch `art-garden-water` (on `art-garden-ground`). What it changes in your files, and what is yours after:

- **Crossings, each the smallest call that hands the drawing to the look:**
  - `world/garden/waterworks.js`: imports `WaterLook` from `vfx/garden/gardenwater.js` and passes it the sky (`{ sky: this.R.site.sky }`);
    the header names the new look. `world/garden/watermesh.js` is deleted (nothing else used it).
  - `world/garden/water.js`: two comments that named `watermesh.js` now name the look (strings only).
  - `world/garden/plants.js`: the constructor makes `this.look = new GardenPlants(realm)`; `update()` is one line handing it the dirty
    set and the grids. The tufts' geometry, material and per-planetoid meshes are gone (`geo`, `mat`, `looks`, `PLANT.tufts`, `lift`).
    The rule is untouched.
  - `world/garden/cascades.js`: the constructor makes `this.look = new CascadeLook(this.group)`; `update(raw)` is one line; each
    running entry carries its `feeling` (the step already worked it out). The dashed line, its material and `CASCADE.segs` are gone.
  - `world/garden/realm.js`: builds `this.rainLook` (a `GardenRain` with the site's sky) and updates it after the waterworks from
    `waterworks.rain()` and `feeling()`; clears it on leaving (casebook rule 15); `parked()` parks one of each new look (the water's,
    the rain's, the plants', a cascade's) in place of the tufts' and the dashes' lines.
- **Programs and heap, measured (review, `npm run perf` on Calissa's branch fcd07a2 with and without this work, one machine):** programs
  163 / 165 / 165 (workshop / dunes / well) become 168 / 170 / 170, five more: the grounds, the water, the rain, the plants and the
  cascade, each parked in the warm-up so that nothing compiles on entering, pouring or the first cascade (the water was two programs, a
  back-face and a front-face pass, until the review set `forceSinglePass`: casebook 2026-10-08, rule 93). Heap 350 becomes 355 MB. Calls
  and triangles do not move (the garden is not a perf scene). Her branch alone is already over the programs budget (164) in the dunes and
  the well and at the heap budget (350); with this work it is 168 to 170 against 164 and 355 against 350. Raising them is yours, these
  looks the reason, or say what to fold (the rain and the cascade into one program would be the first). 0 programs compile on entering
  or on the first pour. Buying a planetoid still compiles one program in play (+1, as before this branch):
  its stone roots' `flatShading` standard material, drawn flat once before `present.shade` turns it smooth a second later. A
  `game.present.shade(true)` after `orbit.add`, or the roots made smooth, would end it.
- **Rain falls in play now.** At rest (Balanced) `rainOf` is 0.2, so the garden drizzles in your draught's feeling whenever you are
  in it (240 streaks). That is Dovina's table; I have asked her whether a drizzle at rest is meant.
- **Triangles:** one garden view with a pond, 115 plants and rain at 0.55: 56,000 a frame, 50 draws (`renderer.info`, every pass).
  The plants are capped at 2,400 instances nearest the eye (about 27 triangles each); the rain is 1,200 streaks and 360 rings (2
  triangles each). Still no garden scene in `scripts/perf.mjs` (survey item 31).
- **Still yours, from step 1:** the garden's ground is not darkened at night (only the sky and fog change), so the water's and the
  rain's night glow read faint; the pole crease in `Clay.heightAt`; `clay.js`'s dead tint code; the stale comment over `PLANETOID_SITES`.
  (`plots.js` `FEELING_COLOR` is `COLOR` on main now, so the grounds', the water's and the lake's feelings agree.)
- **The Dantian's lake** (my prop: a cap at 1.004 R over the crown) does not know the water: water poured on the crown sits under it.
  The plants now skip the cells under it. If the lake should be the water (a spring at the crown), it is yours to say and mine to draw.

Delete this note in your branch when done.
