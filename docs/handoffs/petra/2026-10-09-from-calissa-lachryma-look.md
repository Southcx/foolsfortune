**2026-10-09, from Calissa (Art): Lachryma's look on every feat and every slick (branch art-v135-lachryma)** (delete in your branch when done)

**Built (mine):** `vfx/oxidation.js` (the oxidation ramp: `OXIDATION`, `oxidationAt`, the bauble's `oxidationMaterial`, `OXIDATION_GLSL`
with `oxFilm` and `slickColour`, `filmColour`, `featTint`), `vfx/slicks.js` (`game.slicks`: a slick drawn where it lies, oxidising and
soaking away, drawn with the blots' program, `vfx/stains.js` `uSlick`), the library's `shock` (every `fx.shockwave`), the slip schiller
(`vfx/labradorite.js` `SLIP_SCHILLER`), the Courier's paint on `vfx/paintpath.js` (`tint`), the Overflow's flood as crude
(`vfx/foelook.js`), a gusher's `onSpill` (`vfx/slipgeyser.js`), and the workbench stage `lachryma:ramp`. No new shader program: the bauble
keeps 'bauble-ox', a slick is the parked stain's program, the paint path, the jelly's melt and the cave slip keep theirs, the shock is the
sprite pools'.

**CROSSING (your files; each the smallest call-site edit, listed so you can keep, move or drop it):**
- `courier/lachryma.js`: the bauble's `OX` and its material come from `vfx/oxidation.js` (`OXIDATION`, `oxidationMaterial`): the same
  numbers and the same material, the old `oxMaterial` moved there (the ramp rendered at seven steps: pixel-identical to the base, max 0).
- `courier/moves/env.js` `SlipField.addDisc`: `onLay` is passed the disc's `life` (fifth argument).
- `main.js`: `game.slicks = new Slicks(game)`; `onLay` lays a slick's look beside the paint map's slick (`game.slicks.spill(c, r, life,
  { normal: n })`, anyone's but the Courier's); `game.slicks?.update(dt)` after the paint map's update.
- `world/ground/paintmap.js` `upload()`: a slick's cells (`crude === 2`) are not drawn by the map (vfx/slicks.js draws them where they lie;
  the map's flat stand-in, "Calissa's" in its comment, showed under the slick and outlived it). The cells, the mop's wipe and Clean are
  as they were: a slick's look shrinks from its rim as they are taken.
- `world/dunes/geysers.js`: `look.onSpill = () => game.slicks?.spill(pos, LAUNCH.r * 1.3, 24)` (a gusher's spill, look only).
- `creatures/jelly/deform.js` (the melt): includes `LAB_GLSL` and `SLIP_SCHILLER_GLSL` and adds `slipSchiller(...)` to the emissive, with
  the shared uniforms `uMindT` and `uSlipSchiller` (key 'jelly-melt2' unchanged).
- `courier/moves/blink.js`, `slam.js`, `jets.js`: the afterimage, its streak and its arrival burst, the slam's ring (the brush's slam throws
  the same ring), and the jets' thrust (`colorEnd`) wear `featTint`; each module's look chance is its own stream (`<module>.fx`), so
  `simRand` draws exactly as before.
- `tools/soulbrush/soulbrush.js`: the slide trail's PaintPath takes `tint: () => this.load?.aspect` (the slide trail and the wash in the
  brush's feeling) and the slide's mist takes `this.paint.tintNow`.
- `tools/psygun/spatter.js`: a cold spill's colour is the Courier's paint in the brush's feeling (`loadAspect`, `ASPECT_COLOR`), drying
  darker; `slip: 'crude'` is anyone else's, ink drying to a sheen, and its disc is laid as the creature's (`by` 'creature': a slick, not the
  Courier's paint). The burst barrel's spill (`spill()`) is crude.
- `creatures/jelly/slipjelly.js` (five calls) and `world/well/nursery.js` (one): the jellies' spatter passes `'crude'` for `true`.

**Asks (yours):**
1. **The rim shallows are still slip.** `world/well/bowl.js` `slipMaterial()` (the 'bowl-slip' stand-in, 0x6b5236) is "the bowl's pools
   and rim shallows" that LACHRYMA-LOOP.md section 0 rules crude. `vfx/cavekit.js` `slipMaterial()` with `color.setHex(0x1a1420)` is the
   Overflow's crude (ink with the Lachryma's ribbons, the same program as the cave slip): swap it in, or say and I will.
2. **A gusher's spill is look only.** It lays no paint-map cells, so the mop and Clean cannot take it. If it should be crude for the mop,
   call `game.paintmap.slick(pos.x, pos.y, pos.z, LAUNCH.r * 1.3, 0.8)` beside the `spill`.
3. **The blots' crude in the paint map is still the flat stand-in** (`FLAT`, the feeling at 0.42). The film (`OXIDATION_GLSL`
   `slickColour`) can go into `patch()` the day the map carries a cell's kind to the shader; a later round (it changes your patch).
4. **A slick laid only with `paintmap.slick()` is now unseen.** Every call today goes through `onLay`, which lays both; a new caller should
   call `game.slicks.spill` beside it.
