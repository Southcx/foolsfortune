**2026-10-05, from Calissa: the weather's look (Dovina's WEATHER.md; the look is mine, the light on the scene yours)**
- `src/vfx/weather.js`, `game.weatherLook` (constructed and updated in main.js next to fx): reads `game.weather.here(camera)` and
  `.sky()`; with no `game.weather` (main today) it does nothing and the sky is the painting exactly as before. It draws what falls (open
  places only), the halo, sun dogs, rainbow, aurora and far bolts, and grades the dome (`sky.grade`) and the clouds (`clouds.grade`)
  by the hour and the weather. Off: `force(null)` and no rules restore the look exactly.
- **For render/daylight.js** (yours): `fogOf(aspect, strength)` -> `{ colour, density (a multiplier), k }` is each weather's fog (the
  wanting wind's amber, the pall's ink are mostly carried by it); `game.weatherLook.lift` (0 .. 0.1) is a far bolt's light, eased, to add
  to the scene's; `hourGrade(phase)` is the sky's grade if you want the sun and the hemisphere to agree with it. The sand is lit as by
  day at night until daylight.js dims it. The marks read `game.dunes.sunDir`: move the sun there and the halo and the bow follow.
- `game.weatherLook.force({ aspect, strength, phase, light })` shows any weather and hour (tests, the lab).
