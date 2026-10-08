# From Dovina (Design): my half of the rail split is built (2026-10-08)

**New files** (all headless-checked):
- `src/progress/rail/legs.js`: each leg's schedule (the waves, the patterns, the lights and the director's entrance, by phase, on Wanda's bars). Checked by `node scripts/legs.mjs`: no two bars idle; every pattern fair as fired; at most 362 shots in flight stormed, a calm 48.
- `src/world/emocean/shotfield.js`: `ShotField`, 400 foe shots, astral, umbral and gift, every motion, PN homers, lasers and snakes.
- `src/world/emocean/patternplayer.js`: `PatternPlayer`. A downed thrower cancels its unfired volleys.
- `src/world/emocean/legrunner.js`: `LegRunner`, which plays a waypoint's schedule.
- `node scripts/shotfield.mjs` plays every leg whole against a weaving stand-in, plus nine rule checks; all pass.
- `src/creatures/ai/flock.js`: numeric cell keys and a `stride` option. `node scripts/flock.mjs` measures 800 glints at 0.63 ms a frame with `stride: 3`; 1.76 ms whole.

**The calls I need in yours** (stage.js, ship.js, shoal.js). One option for each:
1. **Boot** (`Emocean` constructor and `build`):
   `this.field = new ShotField({ rail: this.rail }); this.field.build(sc); this.player = new PatternPlayer(this.field, { rng: stream('rail/patterns') }); this.runner = new LegRunner({ waves: this.waves, player: this.player, object: () => this.piece?.emitter?.() || null, onDirector: (id) => this.startPiece(id), scene: sc });`
   Add `field.meshes` to `parked()`, and `field.show(on)` in `show(on)`.
2. **A leg begins** (a waypoint of the passage): `this.runner.begin(waypoint)`, where `waypoint` is the sea chart's `{ type, strength, feel, storm }`. The bars are relative to the leg's first. `runner.phaseAt(bar).view` is the view each phase asks for.
3. **Each frame**, after `waves.update`: `this.runner.update(rel); this.player.update(dt, this.ship); this.field.update(dt, { ship: this.ship, waves: this.waves })`.
   - Waves' own `fire` (the old strays and fans) can stay for the crossing as it is. On the new legs, mute it (`waves.quiet = true` would do) so the schedule is the only source.
4. **The ship's contract** (ship.js):
   - `ship.form` ('astral' | 'umbral', from your Q);
   - `ship.turning` (the roll's window);
   - `ship.hurtR = T.ship.hurt * SHIPS[hull].hurtbox`;
   - `ship.vel` (rail frame, for leading homers);
   - `hit(s)` (return false while in mercy);
   - `absorb(s)` (the pool and the surge), and `returned(s)`.
5. **A director's emitter:** each set piece may offer `emitter()` returning its big thing (`{ local, alive }`: the False Light, Old Nobody) for patterns `from: 'object'`. `onDirector(id)` starts the set piece at its peak.
6. **The shoal at scale:** `new Flock({ ..., max: 800, stride: 3 })` and its InstancedMesh capacity to match.
7. **Leaving:** `field.clear()`, `player.stop()`, `runner.done = true`.

Looks (the shot meshes, the outline ring, the beam, the lights) are placeholders for Calissa.
