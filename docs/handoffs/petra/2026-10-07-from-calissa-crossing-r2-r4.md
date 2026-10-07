**2026-10-07, from Calissa: the crossing's set pieces, R2 to R4 (RAIL.md section 7; names from Dovina's glossary on `claude/dovina-design`)**

All three ride on `game.railLook` beside R1's parts. Each has its own frame (+Z forward, Y up). You move it; these are its looks, and each part answers to a call. Placeholders, built from primitives.

**R2, the shoal** (`new ShoalLook({ max: 192 })`, `vfx/shoal.js`): one instanced draw for the glints.
- `set(i, pos, quat, roll)`, then `count = n`. `roll` 0..1 is the silver turn: ease it to 1 over the quarter-bar before a strike group (the frenzy) strikes. The glint rolls onto its side and its flank goes silver. The flash is a motion, never a light.
- `conductor(pos, quat, alive)`: the shoal's caller. Twice the size, with a breathing Lachryma glow.
- `boil(pos, radius, k, sea)`: the surface over the bait ball, draped on the swells. Rings where glints break it, plus froth.
- **The crude is opaque.** A glint even a hand under the surface cannot be seen, so the flock keeps the bait ball at `sea.heightAt + 0.0..0.3`. Draws: 3.

**R3, the False Light** (`new BrigLook({ env, fx })`, `vfx/brig.js`): 18 m, two masts, her lure lantern at the bowsprit's end.
- `port(i 0..5, { side 1|-1, open 0..1, gone })`: open a port a bar before a volley. The lid swings up and the gun runs out. Then `fire(i, side)` gives the flash, the recoil and the smoke.
  - Side 1 is +X, her port side as seen from astern.
- `rigging(i 0..3, cut)`: the four rigging points are the slings of her yards (0 fore course, 1 fore topsail, 2 main course, 3 main topsail). Cut one and its yard drops and its sail spills its wind.
- Targets: `riggingWorld(i)` and `portWorld(i, side)` give their world positions.
- `strike(k)`: her colours hauled down. `hurt(k)`: her hull scorches and her deck smokes. `sink(k)`: bow down and under.
- `set({ heel, pitch })`, then `update(rawDt)`.
- **Boarders** (`new BoarderLook()`): `set({ pos, face, rope, t })`, where `rope` is the world point on her main yard (null once aboard). On a rope, both arms are up it; aboard, the cutlass is up.
- Cost: about 30 draws after the merge (the ports and yards move, so they stay apart).

**R4, Old Nobody** (`new LeviathanLook({ env, fx })`, `vfx/leviathan.js`): 40 m.
- The hide is crude: the oil film from `oilMaterial`. Barnacles of solid Lachryma in every feeling's colour. A blank face with one milky blind eye.
- `set({ swim 0..1, bend })`: its swim wave and its turn. `update(rawDt, sea)` also throws the breach spray, wherever its body crosses the surface fast.
- `gill(i 0..3, { side, open, gone })` or `breathe(k)`: four gills a flank. Their lips part over glowing red flesh, the place to shoot. A gill shot out stays open and dark.
- `maw(k)`: the jaw drops. `tooth(i 0..5, gone)`: six ivory teeth, a lance each. `throat(k)`: the light that swells before a spit.
- `fin(side, k)`: the pectorals. Raise one to 1 as a sweep's warning; 0 is at rest.
- `shadow(pos, yaw, k, sea)`: when it sounds, a dark shape draped on the swells, growing under you.
- Targets: `gillWorld`, `toothWorld`, `throatWorld`, `eyeWorld`.
- Its hide is re-shaped on the CPU each frame (41 rings × 18). Cost: about 30 draws.

**The .hack glitch at each set piece's first beat** is the existing `post` glitch, so you fire it from the director. I added nothing for it.

**Verified headless, stills only:**
- The shoal from above, chase and close.
- The brig side-on, bow-on, from the quarter, and at her ports (four open, one shot away, one sling cut, colours half struck, a boarder on his rope).
- Old Nobody alongside with its gills open, face to face with the maw open, in a breach, and its shadow from 80 m.

**Not verified:**
- Any of it in motion: a silver turn easing in, a port opening, a yard dropping, the swim wave over time, the breach spray.
- The fx smoke.
