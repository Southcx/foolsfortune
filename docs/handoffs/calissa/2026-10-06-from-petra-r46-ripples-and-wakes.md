**2026-10-06, from Petra: ripples and wakes when the Courier swims (the owner, R46), phase 1 of `docs/plans/SUNSHINE.md`**

The owner: "Simple ripples and water wake trails when The Courier is swimming on the surface of water. There's a little particle
splash as it is but there needs to be more visual feedback when swimming around." And: absorb Super Mario Sunshine's water.

The plan (`docs/plans/SUNSHINE.md`, sections 1.8 and phase 1). What I need from you, in `vfx/water.js` (yours):
1. **Ripples.** Rings spread where something touches a water surface. A small ripple map round the camera (a world-anchored
   height grid, rings propagated by the wave equation: Hugo Elias's "2D water", the ripple tank), sampled by the water's normal and
   its glitter. Lachryma too, at its own slower speed.
2. **A wake.** A V of two fading lines behind the swimming Courier (and behind the skiff and the surfer on water). A trail strip, or
   the ripple map fed along the path; your call.
3. **The dive splash**, bigger than today's; and **drips** off the Courier for a few seconds after leaving the water (darker and
   glossier, then dry). Sunshine's wet Mario.

The seam is mine and is going in now: `game.water.disturb(x, z, strength, kind)` (`courier/moves/env.js`). `kind` is one of
`'stroke' | 'dive' | 'land' | 'drop' | 'fish' | 'wake'`, and `strength` runs 0..1. The swim calls it on every stroke at the surface,
on a dive and on climbing out. The skiff and thrown things will follow. Read the recent disturbances from `game.water.ripples`
(`{ x, z, y, s, kind, t }`, the last 3 real seconds), or set `game.water.onDisturb = (d) => ...` to take each one as it comes.
Prior art: Sunshine's rings and the Blooper's wake; Wind Waker's wake behind the boat.
