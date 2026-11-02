# From Calissa (cups): the mech's skate, its call sites in mechpilot.js

`src/world/hangar/mechskate.js` (`MechSkate`, `MECH_FEEL`, `feelOf`, `SKATE`, `installMechFeel`) is the skating kit. It is pure: it reads the pilot's own fields and writes only `p.vel` (while it skates) and `p.shake` (on a landing). It pays the booster's share of `fire` through `p.spend(kJ)`. I haven't edited `mechpilot.js`. These are the hunks for you to wire in. Its numbers are modifiers over Dovina's `frame.js`/`rules.js`, and none of hers change.

## The hunks

1. **Import and construct**
   - `import { MechSkate } from './mechskate.js';`
   - In the constructor: `this.skate = new MechSkate(this.game);`.
   - In `resetRun()`: `this.skate?.reset();`.

2. **`drive(dt)`: the turn.** After `wish`, `moving`, `top` and `loadK` are known, and before `let want = ...`:
   ```js
   const sk = this.skate.drive(this, { wx: wish.x, wz: wish.z, moving, out, legK, loadK, dt });
   ```
   Then replace the turn:
   - `let want = sk.want ?? (moving ? Math.atan2(wish.x, wish.z) : null);`. `faceT` still overrides it, as now.
   - The rate: `sk.rate * (this.faceT > 0 ? 2 : 1)`. This replaces `PILOT.turn` / `PILOT.tankTurn`. `sk.rate` is already 1.4 or 2 (tank) times the feel's multiplier.

3. **`drive(dt)`: the quick boost.**
   - Gate it with `if (!this.assault && S.qb > 0 && this.skate.canQuick())`.
   - Before her Δv, cancel the opposing motion and take the lock: `const lock = this.skate.quick(this, d.x, d.z);`, where `d` is the normalised `dir`.
   - Then `this.vel.addScaledVector(d, S.qb * out); this.boostT = lock;` in place of `QB.t`.

4. **`drive(dt)`: the assault let go.** Where `this.assault = false; this.shiftT = -1;` runs on Shift's release (and after the charge), add `this.skate.light();`.

5. **`drive(dt)`: the walk's velocity.**
   - Run today's `else { ... coast / walk accel ... }` branch only when `!sk.on`. While the skate is on, it has written `this.vel` itself.
   - Call `this.stride(dt, wish, moving)` only when `!sk.on` too. Skating takes no steps.
   - **Ask for Dovina:** sync is then fed only by blows and settling while skating. Should a skate stroke on the beat count?

6. **`move(dt)`: the landing.**
   - Keep the fall speed before it is zeroed: `const vyIn = this.vy;` at the top.
   - In the landed branch, after `this.tech.landed(fall)`: `this.skate.landed(this, vyIn);`. This says `mech.land { k }` and adds the shake.

7. **`pose()`: the animator's input.** Add `anim: this.skate.anim(this)` to the object passed to `this.mech.pose({...})`.
   - Everything else stays: `walk` and `gait` are still read when there's no `anim`, so the ring bout's own posing is untouched.
   - The parts body then plays the Courier's clips and the mech's keys (`vfx/mechs/anim/`), and aims the boosters.
   - It also needs `this.battery`, `this.assault`, `this.boostT`, `this.camYaw`, `this.vy`, `this.grounded`, `this.gait`, `this.speed` and `this.stats`. All of these already exist.

8. **`camera(dt)`.** At the top: `const SK = this.skate.camera(this, dt);`. Then:
   - `back = h * C.back * SK.back`;
   - `ease: SK.ease` in place of `C.ease`, in the field's shot;
   - `fov: SK.fov` in the shot's spec;
   - the shake's magnitude `* SK.shake`.

9. **`/mechfeel`.** Already installed: `installMechFeel(game)` is called from `src/main.js` (one line, after `bootChatCommands`). Nothing to wire here.
   - It adds the save section `mechFeel` (scope settings) and the chat command `/mechfeel <0..1>`.
   - It emits `mech.feel { k, by }`. No ledger rule is needed: it's a setting.
   - The tuning panel's knobs come only from `core/config.js` (yours), so there's no panel knob. If you want one, `MECH_FEEL.k` is the value to mirror.

## Keys and phone verbs

- **No new key.** The skate is lit by Shift's tap (the quick boost) or by letting go of the assault boost, and kept while a way is held. The boost hop is the jump (Space) while skating. All are in CLAIM already.
- **No new phone verb.** The arc's mech context already has BOOST, and that covers it.

## Events (all `by: 'courier'`)

- `mech.skate { k }` every 0.5 real s while skating;
- `mech.land { k }`;
- `mech.turn { k, pivot }`;
- `mech.feel { k }`;
- `mech.boost { kind }` stays yours.

**For Wanda:** `mech.skate`, `mech.land` and `mech.turn` are new sounds to hear.

Delete this note once it's wired in.
