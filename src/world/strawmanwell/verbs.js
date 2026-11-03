// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S AIR VERBS: the rope's swing launch and the pogo (docs/plans/STRAWMANS-WELL.md 3.2 and 3.3; GAPS G250), the two verbs the
// core movement has no part for, each a modifier laid over what the Courier already does, run beside the fixed step through the frame's
// `pre` and `post` hooks (wellframe.js). The core is untouched: the rope is the house's (courier/moves/pole.js, rigging.js), the blows are
// the tools' own.
//   the rope's swing   on a rope, A and D pump it (its sway, `pushRope`); let go with Space and the speed of the rope at the hands is added to
//                      the kick, along the swing (Bionic Commando's swing and release, Donkey Kong Country's rope)
//   the pogo           a downward blow in the air (S held, or falling hard) over a foe's head or a row of spikes throws you up again and gives
//                      the air jump back: the stage's foes (dummy.js) and any rect a stage registers with `surface` (the Pit's spikes)
//                      (Shovel Knight's down-thrust, Hollow Knight's nail, DuckTales' cane)
//
// Prior art: Bionic Commando and Donkey Kong Country (the swing's release), Shovel Knight, Hollow Knight and DuckTales (the pogo).
//
//   const V = new WellVerbs(well)   V.surface(rect, label)   V.clearSurfaces()   V.pre(dt)   V.post(dt)   V.listen(on)   V.clear()
//   rect: { x0, x1, y1 } world metres, the top the pogo bounces off   events: well.pogo { stage, on: 'dummy' | 'spike', by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ROPE, POGO } from '../../progress/strawmanwell.js';

const _up = new THREE.Vector3();

export class WellVerbs {
  constructor(well) { this.well = well; this.game = well.game; this.surfaces = []; this.offs = []; this.rope = null; this.cd = 0; }

  get P() { return this.game.player; }
  /** A top the pogo may bounce off (a row of spikes): { x0, x1, y1 } in world metres, and what it is for the event. */
  surface(rect, on = 'spike') { this.surfaces.push({ ...rect, on, z: this.well.kit?.z ?? null }); }
  clearSurfaces() { this.surfaces = []; }

  /** The blows the Courier throws, heard while in the Well. */
  listen(on) {
    for (const off of this.offs) off(); this.offs = [];
    if (!on) return;
    const ev = this.game.events;
    this.offs.push(ev.on('move.blow', () => this.blow()), ev.on('kick.hit', () => this.blow()));
  }

  /** Before the step: a rope pumped, and the rope's speed at the hands kept for the release. */
  pre(dt) {
    const P = this.P, F = this.well.frame, R = F.realInput; this.cd -= dt;
    if (this.rope && (this.rope.age += dt) > 0.15) this.rope = null; // (not let go of in the air soon enough: no launch)
    if (!R || F.tech !== 'pole') return;
    const pole = P.techs?.active?.pole; if (!pole?.rope) return;
    const a = (R.isDown('KeyD') ? 1 : 0) - (R.isDown('KeyA') ? 1 : 0);
    if (a) pole.thv.x += a * ROPE.pump * dt;
    const hang = Math.max(0, pole.y1 - (P.pos.y + 1.3));
    this.rope = { vx: pole.thv.x * hang, age: 0 }; // (kept a moment after the tech lets go)
  }

  /** After the step: the rope let go of in the air carries the swing with it. */
  post() {
    const P = this.P, r = this.rope; if (!r || this.well.frame.tech === 'pole') return; // (still on it)
    this.rope = null;
    if (P.grounded || P.mantle || P.vel.y < 1) return; // (off it some other way: the Space kick sends you up)
    const add = THREE.MathUtils.clamp(r.vx * ROPE.launch, -ROPE.cap, ROPE.cap);
    P.vel.x += add;
    if (Math.abs(add) >= ROPE.min) this.well.verb('ropeLaunch');
  }

  /** A blow thrown in the air: over a foe or spikes under it, with S held or falling hard, it is a pogo. */
  blow() {
    const W = this.well, P = this.P, F = W.frame, R = F.realInput;
    if (!W.here || !F.on || P.grounded || this.cd > 0 || !R) return;
    if (!(R.isDown('KeyS') || P.vel.y < -4)) return;
    const feet = P.pos.y;
    let on = null;
    for (const c of W.dummies.list) {
      if (!c.alive || c.out > 0 || c.held || Math.abs(c.pos.z - P.pos.z) > 2) continue;
      const rise = feet - (c.pos.y + c.height);
      if (Math.abs(P.pos.x - c.pos.x) < POGO.side + c.radius && rise > -0.3 && rise < POGO.reach) { on = 'dummy'; break; }
    }
    if (!on) for (const S of this.surfaces) {
      if (S.z != null && Math.abs(S.z - P.pos.z) > 2) continue;
      const rise = feet - S.y1;
      if (P.pos.x > S.x0 - POGO.side && P.pos.x < S.x1 + POGO.side && rise > -0.3 && rise < POGO.reach) { on = S.on; break; }
    }
    if (!on) return;
    this.cd = POGO.cd;
    P.vel.y = 0; P.impulse(_up.set(0, POGO.speed, 0), 'spring'); P.airJumps = Math.max(P.airJumps, 1);
    W.verb('pogo');
    this.game.events?.emit('well.pogo', { stage: W.stage?.id ?? null, on, by: 'courier' });
  }

  clear() { this.listen(false); this.surfaces = []; this.rope = null; }
}
