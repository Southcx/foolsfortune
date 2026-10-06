**2026-10-06, from Calissa: your R46 asks (sky, weather, textures, skirts)**
1. **The textures for triplanar** (`src/assets/textures/`, 256 px JPG, tiling, 7 to 26 KB each). They are six ambientCG CC0 sets, credited in the README, and `scripts/bake_textures.py` rebuilds them:
   - `sand` (Ground080)
   - `sand_packed` (Ground079S)
   - `rock` (Rock061, layered sandstone)
   - `clay_floor` (Tiles144, terracotta tiles)
   - `plaster` (Plaster001)
   - `stone_flags` (PavingStones128)

   They are **graded to the colour each surface already has in the game**:
   - the Dunes' sand #e8b070
   - the Dunemaw's #d9a066
   - oxide rock #9a5a40
   - PALETTE.wall #8c4a33 for the clay floor
   - warm plaster #d8b896
   - warm grey flags #a48a72

   Each keeps its light and shade, with the occlusion map folded in. So use them with the material's colour white; tinting them again doubles the hue. Only colour maps for now. Say if you want the normal maps at 256 too.
2. **The weather** (`vfx/weather.js`, and `vfx/overhead.js`, new).
   - Fewer particles: rain 3000 -> 2000, motes 1400 -> 800.
   - The column now runs from 4 m under the eye to 26 m over it. Only 18 % reach near the ground (the sirocco 30 %), and nothing is drawn within 3.5 m of the eye.
   - **Nothing under a roof, through a wall's top or below the ground.** `overhead.js` keeps a world-anchored map (32x32 cells of 1.75 m) of the topmost static collider over each spot. It costs 48 physics rays a frame, only while something falls, and no draw call.
   - Each path wanders on a curl noise.
   - Measured on grief over the Dunes, 4 frames: 8426 px changed before (2031 in the lower half), about 1800 after (69).
3. **The night alive** (`vfx/sky.js` NIGHT_GLSL, `vfx/nightsky.js`): our own stars on a wheel, meteors, and the Shore's aurora (by night, zone `beach`, over the sea at `SHORE.angle`).
   - All of it is in the dome's own shader: no draw call and no new program.
   - The evaluation is in ART.md, "The night sky". I left the milky band out, because the owner's night painting already has its swirls.
   - Noticed, not mine: at forced night the Dunes' sand still renders bright (the scene light didn't follow `weatherLook.force` in my headless test). It may just be the force.
4. **Skirts:** the rule and my list of models are in ART.md ("Skirts where a model meets the ground"). I'll declare each model's foot once your ground blend is in `render/triplanar.js`; tell me its interface.
5. **CASEBOOK:** my two cases (the trailer-skip fade, the rolled-back mask face) and rules 11 and 12.

Gate: check OK, build OK, stress 0 violations.
