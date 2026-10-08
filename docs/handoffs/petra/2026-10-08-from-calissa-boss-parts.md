**2026-10-08, from Calissa (Art): the legs' big objects as boss parts, for the rail's runtime (branch art-rail-bosses)** (delete in your
branch when done)

The False Light, Old Nobody and the Drowned Light now answer the runtime part by part (docs/plans/RAIL-OVERHAUL.md section 6). Nothing
in your files changed: `world/emocean/pirates.js` and `leviathan.js` drive the looks through the calls they always made, and the
emocean sweep's `back` and `leviathan` parts pass (30 and 30). What follows is the interface for the runtime you are building.

**One shape for every part** (`src/vfx/bossparts.js`, `BossPart`):
- `look.part(name)` returns `{ object, state, sealed, alive, open, pulse, windupK, telegraphAnchor }` with `hit(power = 1)` (a fifth of a
  real second of line and glow on the part, never a screen flash), `damage()`, `break()`, `set('intact' | 'damaged' | 'broken')`,
  `seal(on)`, `windup(k 0..1)` (the part's own body telegraph) and `world(out)` (the anchor's world point).
- `telegraphAnchor` is an Object3D on the part, `userData = { radius (m), part (name), facing (local Vector3) }`: the shrinking mark
  (another builder's) sits there. `windupK` is what it reads for its shrink.
- `look.parts.list(prefix)`, `look.parts.states()`, `look.reset()`. The look never decides a state: you do (one exception below).
- Each look's `update(rawDt, sea)` must run every frame it is shown (it eases the states and ticks the pulses).

**The False Light** (`vfx/brig.js`, `new BrigLook({ env, fx, flank = -1 })`):
- `'rigging.0'..'rigging.3'` (fore course, fore topsail, main course, main topsail), `'rigging'` (the whole rig: it follows its four
  slings, damaged at one, broken at four; broken, the topmasts fall, the colours strike and the lamp unseals: the one thing the look
  does on its own, and you may `seal()` again), `'gunport.0'..'gunport.5'` (on `flank`; `windup(k)` opens the lid and runs the gun out),
  `'keel'` (from below: the seams flare on its windup; broken, it snaps and the hold's gold pours out), `'lamp'` (the core: sealed until
  the rig breaks).
- The lamp's beam is the sweeping laser's look: `B.lamp.set({ yaw, pitch, warn 0..1, hot 0..1 })`, `B.lamp.beamPoint(d, out)`,
  `B.lamp.beamDir(out)` for your hit test along it; the lamp part's `windup(k)` is its warning line.
- The wreck field (`vfx/wreckfield.js`): `new WreckField({ length, width, count })`, `.spill(0..1)`, `.update(dt, sea)`,
  `.pieceWorld(i, out)`, `.way(z)` (the clear way through, field frame +Z). Built on demand: 1 instanced program shared with the barnacles.

**Old Nobody** (`vfx/leviathan.js`): `'gill.left.0'..3` (side 1, +X) and `'gill.right.0'..3` (side -1), wrapping from the flank down
under the chin, so they read from below; `'tooth.0'..'tooth.5'` (tusks on the snout's lip, 0..2 its left, front to back, seen from
above); `'eye'` (on its crown, from above; `windup` turns it gold); `'throat'` (`windup` swells its light). It quickens as its gills
break (`L.quicken`, or hold it with `set({ quicken })`). `L.vantage('above' | 'below' | 'flank' | 'ahead', out)`: where a rail
circling it sees the parts. `L.wake(k)`: its slick on the crude. `gillWorld(i, side)` still returns the slit's upper end, at the flank
(what your side view hits today); the part's anchor is mid-slit.

**The Drowned Light** (`vfx/drownedlighthouse.js`, new, not yet in the rail): `new DrownedLight({ env, fx })`, parts `'lamp'` and
`'window.0'..'window.5'`; `D.set({ wake, yaw, pitch, warn, hot, ghosts })`, `D.beamPoint(d, out)`, `D.hulls` and `D.ghosts` (Object3Ds
to put foes on). When the graveyard leg builds it, park `D.group` for the warm-up as the others are: its materials match programs the
game already warms (measured in the workbench: none new beyond the workbench's own lights).

**Costs** (draws counted on the visible objects; programs at boot from `renderer.info.programs`, the cache keys before and after):
programs at boot 163 before and after: every new material matches a program the game already warms, and `leviathan-shadow` is gone
(the shadow and the wake now draw with the basic map program and ride in the beast's group, warmed and hidden with it; casebook 89), so
one fewer compiles in play. The False Light 108 objects to 213 (151 drawn when whole), 4.2k to 7.2k triangles; Old Nobody
41 to 68 (57 drawn), 2.9k to 5.5k; the Drowned Light 61 to 67 drawn, 12.6k triangles. The line and glow is one draw a wire.

**Words**: the Drowned Light, the wreck field, the figurehead's lamp are in the glossary as placeholders for Espada.
