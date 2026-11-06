# From Calissa (cups): the surf ride's hooks in your files (South's ask, 2026-11-06; docs/ref/WAVE-RIDING.md 1, 2, 4)

The wave pool's ride is modifiers on the Solar Skiff (DESIGN.md 22): off the pool every hook answers nothing and the board rides as before.
Each hook is a line with a comment; the rules live in `courier/skiff/surf.js` (`SurfRide`), `courier/skiff/barrelcam.js` (`BarrelCam`)
and `world/raceway/surf/surfpool.js` (`SurfPool`, `raceway.surf`).

- `courier/skiff/skiff.js`
  - import and `this.surf = new SurfRide(this)` in the constructor (beside the slope ride's).
  - `hoistKey` gains `&& !this.surf.ownsW`: on the wave's face W is the pump, not the hoist (the sail furls itself there).
  - on water, `this.n` takes `D.waterNormal?.(x, z, this.n)` when it answers (the wave's normal), else UP as before: the board's own slope
    code does the drop down the face.
  - `vyT` adds `this.surf.rise()`: the surface's own rise under the water's carry (dh/dt + slope . carry), so the height follow rides a moving
    face instead of lagging it. Zero off the pool.
  - `this.surf.step(dt)` after the board has moved (before `gy2`): it moves the board's place by the water's carry (never folded into `v`),
    adds the pocket's push, the pump, reads turns as tricks into the combo, the tube and its balance, the submarine; a wipeout is your
    `bail('lip' | 'closeout')`.
- `world/raceway/raceway.js`: `this.surf = new SurfPool(this)`; `update` advances `this.surf.update(dt)` first (the pool's clock, game time);
  `rideHeight` takes the pool's moving surface (`surf.rideY`) in place of the park's still water inside the basin; `waterNormal(x, z, out)`
  and `carry(x, z, out)` answer for the board (null / zero off the basin).
- `world/raceway/park.js`: `heightAt` takes the basin's bed inside the pool (`wavePool().bedAt`), so the terrain, the physics field and
  `scripts/raceway/map.mjs` all have the hole; `waterAt` says the still level there. The map shows it clear of every track (centre -500, 790).
- `world/places.js`: `game.raceway?.surf?.place(P)`: the place `wavepool` (/goto): the Raceway arrived at as the Index does it, then set
  down on the beach facing the water.
- `feedback/tracking/rules.js`: `surfRules(ctx)` (tracking/surf.js: lines only). `feedback/tracking/moves.js` BAIL_SAYS gains `lip` and
  `closeout`.
- Time: the lip passing over asks `game.time.pulse('surf.lip', 0.55, 0.22, { release: 0.3 })` once a tube. The barrel cam is a
  `game.cinema.frame('barrel', ...)` freed on the way out (and `barrel.spit`, ttl 0.5 s), run each frame from the `fx` phase (`surfRide`).

Measured: `npm run check` (only the look builder's two orphans in `vfx/waves/` while it is wired), `npm run build`, the stress test
(8 runs x 600 ticks, 0 violations; it never reaches the pool). A headless ride: placed on the face in the pocket, stalled, into the tube at
1.6 s, covered 1.0, the cam's FOV to +11.6; it slid out of the front with no steering. Not verified: the feel (South's), the pump's numbers,
the turns' thresholds, a wipeout and a made tube in play.
