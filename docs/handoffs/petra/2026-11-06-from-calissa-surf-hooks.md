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

## After the headless play (2026-11-06)

- No new hooks in your files. In my own: the surf ride's rail grip on the face, the lip's wipeout by the wave's geometry, a refused
  wipeout's 0.8 s lock-out; the barrel cam now a `cinema.shot` (stood in the tube, let go to ease back) in place of a `frame`; the slope
  ride grading on the ground under a landing and adding the face's descent to its own hop. Casebook: 411.
- `scripts/surfplay.mjs` drives the barrel, the pump, the lip and the slope headless; `--phone` boots the phone's profile.
- The phone's black shots were not a fault: the first-draw budget (render/firstdraws.js) admits a few new materials a frame, and a
  headless shot from a manual frame or two draws almost nothing. `surfplay.mjs --phone` passes `?firstdraws=0` and the barrel renders
  at 896 x 414 @2x (scripts/wavepool-shot.mjs and other phone shots from a manual frame want the same). Nothing to fix on your side.
- The pool's buoy run (`surf/poolbuoys.js`) moves the Raceway's one buoy meter (`raceway.buoys.power`) and fires its `skiff.buoy`, judged
  as the board crosses a gate down the pool; buoys.js is untouched (Dovina told).
- One more line in skiff.js `hands(ch)`: after the grab's reach, `if (this.surf.drag.w > 0) this.surf.drag.reach(ch)` (the stall's
  hand in the wave's face, courier/skiff/handdrag.js; its weight is nothing off the wave pool), and `drag: this.surf.drag.w` in the rider's state (rider.js crouches by it as by the hop's charge). Stress after it: 8 runs, 0 violations.

**Added 2026-11-06 (late):** skiff.js, the height: `let want = ...` as before, then `if (this.surf.on) want = gy + SURF.seat;` (SURF.seat 0.35, surf.js). On the wave pool's water the deck sits 0.35 m over it, where it hovered 0.6: the board read as floating over the face and the stall's hand could not reach the water (now 0.44 m short, was 0.85). Off the pool `want` is unchanged. 0.15 was tried and broke the pump and the dive in the full playtest; 0.35 keeps all of them.
