// ---------------------------------------------------------------------------------------
// THE SKID STOP: one of the suite's one-shot clips laid over the gait (character.js) where the core movement stops at speed (the owner,
// 2026-10-10). Only what is shown changes: player.js decides the speeds, the stop and the body's yaw.
//   THE SKID STOP  Loco_SprintStop when a sprint is let go: the ground speed falls under SKID.at m/s within SKID.within s of running at
//                  SKID.from or more, still heading within SKID.cone degrees of the way the sprint went (a stop, or a reversal on its
//                  way through zero; a hard cut sideways never falls that low: from a sprint into a run at right angles the least speed
//                  is 3.6 m/s). From its brace (SKID.t0) at SKID.rate, in place (casebook rule 180: the clip skids its hips 1.04 m
//                  ahead, the capsule stops in 0.17 s and 0.58 m, so the travel is the capsule's and the clip's braced foot slides with
//                  it), in over SKID.in, out as it stands (its clip seconds SKID.outFrom to outTo); cut over SKID.cut s when the move
//                  starts again (SKID.again m/s over its least), the ground is left, or a crouch, slide, mantle or dash takes over.
//   A REVERSAL     shows the body's own turn (player.js turns it toward the move) over the gait, as before the half turn: Loco_Turn180
//                  played over a reversal at speed was taken out (the owner, 2026-10-11: "it's slow and breaks flow"; casebook
//                  2026-10-11). A sprint reversed passes through the skid on its way to zero, cut as the run picks up again.
//   NOT IN FIRST PERSON  as the flip and the kick-off (airborne.js): the arms would sweep across the view
//
// Prior art: Super Mario 64's skid to a stop (the read: momentum shown, the stop never cut); Lyra's (Unreal) stop clips with distance
// matching, considered and not taken: the stop clip skids 1.04 m where the physics stops in 0.58 m, so a clip time matched to the distance
// left plays its stand-up at four times its pace.
//
//   const skid = new SkidStop(ch)
//   skid.pose(dt, s, speed, free, base)   lays the skid over base; free: the body is the gait's (grounded, no crouch, slide, mantle, dash
//                                         or tech's legs), 0..1. -> this
//   skid.w                                the clip's weight (the gait's running share, hip warp and footsteps give way by it)
//   skid.reset()                          forget the sprint and drop it (a teleport, a harness)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { inPlace } from './layers.js';

const DEG = Math.PI / 180;
/** The skid stop (m/s, s; clip seconds where said). Its frames: 2 the left foot reaching ahead, 4 to 13 the skid on it, 14 to 24 the
 *  right foot stepping up and the body rising over the left, 25 on standing. */
export const SKID = { clip: 'Loco_SprintStop', from: 5.6, within: 0.25, at: 4.0, cone: 20, t0: 0.07, rate: 1.15, in: 0.08, outFrom: 0.72, outTo: 0.95, cut: 0.12, again: 1.2,
  plants: [[0.13, 'L'], [0.8, 'R']] };

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const crossed = (plants, t0, t1) => plants.some(([t]) => t0 < t && t1 >= t);

export class SkidStop {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.p = this.C.pose();
    this.reset();
  }

  reset() {
    this.sprintT = 9; this.hx = 0; this.hz = 1; this.speedPrev = 0;
    this.skidT = null; this.skidOn = 0; this.skidMin = 0;
    this.w = 0;
  }

  pose(dt, s, speed, free, base) {
    const C = this.C, ch = this.ch, vx = s.velocity.x, vz = s.velocity.z;
    // ---- what the move has been doing: when it last sprinted, and which way ----
    if (speed >= SKID.from) { this.sprintT = 0; this.hx = vx / speed; this.hz = vz / speed; } else this.sprintT += dt;
    const falling = speed < this.speedPrev - 1e-4;
    this.speedPrev = speed;
    const on = free > 0.9 && !ch.fpMode;
    // ---- a sprint let go, still heading the way it went ----
    if (this.skidT === null && on && falling && this.sprintT <= SKID.within && speed < SKID.at
      && (speed < 0.3 || (vx * this.hx + vz * this.hz) / speed > Math.cos(SKID.cone * DEG))) {
      this.skidT = 0; this.skidOn = 1; this.skidMin = speed;
    }
    let w = 0;
    if (this.skidT !== null) {
      const t0 = SKID.t0 + this.skidT * SKID.rate;
      this.skidT += dt;
      this.skidMin = Math.min(this.skidMin, speed);
      if (!on || speed > this.skidMin + SKID.again) this.skidOn = Math.max(0, this.skidOn - dt / SKID.cut);
      const t = SKID.t0 + this.skidT * SKID.rate;
      if (t > SKID.outTo || this.skidOn <= 0) this.skidT = null;
      else {
        w = smooth(0, SKID.in, this.skidT) * (1 - smooth(SKID.outFrom, SKID.outTo, t)) * this.skidOn;
        if (w > 0.001) {
          const p = C.sample(SKID.clip, t, this.p, false);
          inPlace(C, p, SKID.clip, t, 'xz');
          C.blend(base, p, w);
        }
        if (w > 0.5 && crossed(SKID.plants, t0, t)) ch.onFootstep?.();
      }
    }
    this.w = w;
    return this;
  }
}
