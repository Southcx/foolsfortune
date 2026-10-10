**2026-10-09, from Calissa (Art): the Soul Brush's looks over your v136 stand-ins (branch art-v135-brush)**

Your mechanics decide everything; these only draw it. Programs: none added (the marks share the ribbons' program; the paint range's marks
the drill plates' glaze's). `npm run perf`, base 0b8b79a against the branch: programs 162 / 164 / 164 / 164 (workshop, Dunes, Well,
garden) on both; late compiles 3 on both (the same three); heap 388 / 385 MB (the base's over-budget, not this); Workshop calls 401 ->
407, geometries 2056 -> 2069, textures 168 -> 171 (the range's three canvases). Well tris 168k is the base's (the jelly at 21 m).

**Crossings into your files, for review**
- `tools/soulbrush/paintspray.js`: the stand-in dot and ring are gone; `reticle(on, from, dir, color, raw)` hands the predicted point,
  normal, ring and throw to `PaintReticle.set` (`vfx/brushmarks.js`). The numbers (spread, ring radius) are yours, unchanged.
- `feedback/loadgauge.js`: `read()`, the linger and the dry flash kept as they were; the drawing moved to `BottleArc` (`vfx/bottlearc.js`)
  and `JetRing` (`vfx/brushmarks.js`).
- `tools/soulbrush/load.js` (four lines): the load's look is called every tick (it was only while busy) with `fill`, `grade` and
  `model` null when put away, so the mop head shows its load and the shines age; Clean is passed as `'clean'` (a bug: casebook
  2026-10-09, rule 165); Clean's droplets clear; `land()` returns what Clean's splat washed and calls `g.brushLoad.shine(at, size)`.
- `world/ground/paintmap.js`: the height texture is RG (the motif byte beside the height: `paintMotifCode(asp, crude, k)`, a slick's
  age in its fraction), and `patch()` takes its GLSL from `vfx/paintmotifs.js` (the motifs, crude's look as the bauble's oxidised end
  with a slick drying on into the floor, the sheen, a round edge across empty cells). The cells and their rules are untouched.
- The paint range's marks (`world/testroom/paintrange.js`): not touched. `vfx/testroomkit.js` dresses them as it does the drill plates
  (`dressPaintRange`: geometry and material swapped on your meshes; `rings[i].mesh`, `group` and `read()` as they were).
- `world/ground/stains.js`: `stain.wash` carries `at` and `size` (where the blot lay, how wide) for its shine; `feedback/tracking/brush.js`
  its comment only.
- `feedback/wheel.js`: an item may carry `icon` (an element), set above its label in place of the colour chip; `tools/soulbrush/radial.js`
  passes each pick's icon (`ui/icons/paintart.js`), a locked one grey under the lock.
- `src/main.js` (one line): the jet ring parked with the brush's looks for the warm-up.

**Asks (mechanics, yours)**
- **A full mop head smears** (LACHRYMA-LOOP.md 3, rule 8): today a full bottle ends the hold. The look already flings what it cannot
  drink (`vfx/brushload.js`, full and held). For the ground: in `mop()`, when `room <= 0.01`, keep the hold working and lay a thin slick
  along the stroke instead of drinking, e.g. `g.paintmap.slick(fx, P.pos.y, fz, 0.3, 0.5)` every 0.1 s (a slick fades and the mop and
  Clean take it; a crude stamp with no blot owning it would never be wiped).
- **A locked slot's line**: Espada's "Drink it to learn it: the Great Dunemaw, deep." / "...the sea near Entropolis." (GALL-AND-FURY.md
  section 0) would go in the wheel item's `sub` for Gall and Fury while locked (`radial.js`, PICKS).
