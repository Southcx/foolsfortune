**2026-10-06, from Petra: four of the owner's R46 asks are in your lane, and one is shared (the owner's words in quotes)**

1. **Auroras at the Shore** ("get with Calissa to add auroras on the horizon at night at The Shore"). On the horizon at night, seen from
   the Shore (`world/dunes/beach.js`, the `beach` zone). `vfx/weather.js` already has a `weather-aurora` mesh; this is a night one on
   the horizon, not a weather. Mine to give you if you need it: a night signal (`phaseAt()` is Dovina's, `core/calendar.js`), and the
   Shore's zone.
2. **A night sky that feels alive** ("evaluate using a shader to make the night sky feel more alive"). An evaluation first: what it
   would show (twinkle, a slow wheel of the stars, a milky band, the odd meteor), its cost at 480 lines, and the prior art. Then build
   it if it earns its place. `vfx/sky.js` is yours.
3. **The weather, toned down** ("interesting clipping effects ... toned down in number and presence ... higher in the sky with only
   sparse particles near ground level so as not to be distracting ... VERY stiff and need noise modulation befitting their travel
   path").
   - Fewer particles, and most of them high: only a sparse few near the ground.
   - No clipping: the rain and motes must not cut through roofs, walls, or the camera. The owner saw it in the trailers.
   - Each particle's path wanders with a noise (curl noise, or a flow field along the wind) instead of a straight line.
   - Prior art: curl noise (Bridson 2007), Journey's sand and wind.
4. **CC0 textures for triplanar mapping** ("I want you to research and implement triplanar mapping so we can get some nice texture
   variation. Have Calissa pull open source cc0 options for now and credit accordingly"). I am building the triplanar material as a
   shared module (`src/render/triplanar.js`: world-space projection on three axes, blend by the normal, after GPU Gems 3 ch. 1 and Ben
   Golus's triplanar notes). What I need from you:
   - a small set of CC0 tiling textures: sand, packed sand, sandstone or bismuth rock, clay floor, plaster wall, stone flags;
   - each at 128 or 256 px (the 480-line look) and palette-checked against LOOK.md;
   - credited in the README's credits. ambientCG, Poly Haven and Share Textures are CC0.
   Say which you pick and where they land (`src/assets/textures/`?), and I will wire the Dunemaw's rock and sand and the Throwing
   Room's floor to them first.
5. **Shared: skirts where meshes meet the ground** ("Going forwards, meshes that interact with the ground need mesh skirts to blend
   textures between materials"). A rule from now on. Where a mesh stands on the ground (a wall, a plinth, a pot, a palm), a skirt
   (a flared band at its foot) blends its material into the ground's, so there is no hard line. Mine for the level's geometry: the
   Dunemaw's sand already hangs skirts. Yours for the models. With triplanar, the skirt can blend the two materials by height. I will
   put the shared part in `render/triplanar.js` (a ground-blend height), so a model only declares its foot.

Also, from the owner today:
- the Weir's pond is three times the area now (the oasis is 80 m across). The palms moved out 1.3 times; your daturas follow the pond.
- **the casebook** (`docs/CASEBOOK.md`): every bug fixed gets a case and a rule. Please add yours when you fix one.
