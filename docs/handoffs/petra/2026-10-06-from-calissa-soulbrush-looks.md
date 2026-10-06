**2026-10-06, from Calissa: the Soul Brush's looks (the owner's, through Dovina; SUNSHINE-SYSTEMS.md section 4), ready for your mechanics to drive**

Nothing below decides anything. Each piece is a look with a small interface, driven from the brush's mechanics.

1. **The Lachrymato Bottle** (`vfx/bottle.js`, the workbench's "the Soul Brush" group).
   - Make one: `new LachrymatoBottle({ size: 'small' | 'medium' | 'large' })`.
   - Put it on: `B.mount(game.character)` puts it on the spine's top bone, between the shoulders and above the tools worn across the back. I checked this from the back and the side with the psygun and the Sondelass worn.
   - Each frame: `B.set({ fill: 0..1, crack })` and `B.update(rawDt, accelWorld)`. The surface leans against the acceleration on a spring.
   - The dimensions are `BOTTLE_SHAPES`. What each holds stays Dovina's `BOTTLES`.
   - Cost: 5 meshes, two small programs of their own.
2. **Stains** (`vfx/stains.js`).
   - Make one: `new Stain({ feeling, seed })`. Place its group, then call `S.drape(heightAt)` once so it lies over uneven ground 1.5 cm up (rule 1).
   - Each frame: `S.set({ stage: 0..3, amount: 0..1 })` and `S.update(rawDt)`. The stage eases, so it spreads rather than jumps. The amount is what the mop has left.
   - Cost: one mesh, one program shared by every stain.
   - If your paint map should draw stains itself instead, this shader's look is yours to lift.
3. **Coated folk** (`vfx/coat.js`): `coat(n.mat, { height: 0.8 * n.scale, feeling })` returns `{ set(k) }`. k runs 0..1, the coat's reach down from the top; the mop lowers it.
   - Patch every folk's material at build, so no program compiles mid-play. All coated folk share one program.
4. **The load** (`game.brushLoad`, `vfx/brushload.js`), each frame while the brush is out:
   - `update(rawDt, { model, mode, saturate, working, aim, from, feeling })`. `model` is the brush's `BrushModel`. `saturate` is 0..1 over `T.charge.time`. `working` is true once it sprays or drinks. `aim` is the spray direction. `from` is what the mop drinks.
   - It drives `setInk` and `setWet` on the model, the drops drawn up while it saturates, the spray (paint) and the spiralling stream (mop).
5. **The slide on wet ground:** `game.brushLoad.slide(rawDt, { pos, vel, surface: 'water' | 'paint' | null, feeling })`, each frame of a Brush Slide. It gives twin rooster tails of spray and, on water, the ripple tank's wake.

Verified headless:
- the bottles at three fills, with the slosh and the crack, and mounted;
- four stains across the stages, draped on a dune;
- a coated folk (saggar);
- the brush saturating, painting and mopping;
- the slide's spray on the Weir's pond.

Not verified: any of it driven by the real mechanics. Those aren't built yet.
