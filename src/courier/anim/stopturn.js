// ---------------------------------------------------------------------------------------
// THE SKID STOP AND THE HALF TURN: two of the suite's one-shot clips laid over the gait (character.js) where the core movement changes
// its mind at speed (the owner, 2026-10-10). Only what is shown changes: player.js decides the speeds, the stop and the body's yaw.
//   THE SKID STOP  Loco_SprintStop when a sprint is let go: the ground speed falls under SKID.at m/s within SKID.within s of running at
//                  SKID.from or more, still heading within SKID.cone degrees of the way the sprint went (a stop, or a reversal on its
//                  way through zero; a hard cut sideways never falls that low: from a sprint into a run at right angles the least speed
//                  is 3.6 m/s). From its brace (SKID.t0) at SKID.rate, in place (casebook rule 180: the clip skids its hips 1.04 m
//                  ahead, the capsule stops in 0.17 s and 0.58 m, so the travel is the capsule's and the clip's braced foot slides with
//                  it), in over SKID.in, out as it stands (its clip seconds SKID.outFrom to outTo); cut over SKID.cut s when the move
//                  starts again (SKID.again m/s over its least), the ground is left, or a crouch, slide, mantle or dash takes over.
//   THE HALF TURN  Loco_Turn180, a turn on the left foot (the hips 0 to 180 degrees between its frames 1 and 16), when the move reverses
//                  at speed: the move behind the body by more than TURN.behind degrees, having run at TURN.speed m/s or more and
//                  dropped under TURN.slow within TURN.within s (a reversal passes near zero, a cut of up to 137 degrees from a run never
//                  does, nor running on backward as a combat stance ends), and the body turning toward it at TURN.turning rad/s or more
//                  (player.js turns it; in a combat stance it never turns, so it never plays). Time-warped onto the body's own turn: the
//                  frame is the one whose hips have turned as far as the body has since it last ran (never backward, never slower than TURN.minRate of the clip's pace,
//                  at its own pace once the body has finished), in place and unturned (rule 180: its travel out in its own frame, then
//                  its turn, which the game's yaw does instead), mirrored for a turn to the right (the clip turns left). Its last frame
//                  (22) is its first again, a pop: played to TURN.last at most. The skid gives way to it.
//   FEET           the turn's planted feet (measured from its frames: TURN.feet) take the place of the gait's by its weight, while the
//                  move is slow enough for a foot to stay (TURN.still); each clip's footfalls (`plants`) are its footsteps, the gait's
//                  give way to them
//   NOT IN FIRST PERSON  as the flip and the kick-off (airborne.js): the arms would sweep across the view
//
// Prior art: Super Mario 64's skid to a stop and its turnaround skid (the read: momentum shown, the stop never cut); Lyra's (Unreal) stop
// and pivot clips with distance matching, considered and not taken: the stop clip skids 1.04 m where the physics stops in 0.58 m, so a
// clip time matched to the distance left plays its stand-up at four times its pace; Paragon's and Lyra's turn in place, whose root-yaw
// curve turns the capsule from the clip, read here the other way round (the body's yaw picks the clip's frame); the mantle's and the
// flip's time warp onto a physics arc (mantle.js, airborne.js).
//
//   const stopTurn = new StopTurn(ch)
//   stopTurn.pose(dt, s, speed, free, base, contact)   lays the skid and the turn over base; free: the body is the gait's (grounded, no
//                                                      crouch, slide, mantle, dash or tech's legs), 0..1; contact: the gait's planted
//                                                      feet, replaced by the turn's by its weight. -> this
//   stopTurn.w, stopTurn.turnW                          the two clips' weight together, the turn's alone (the gait's lean, hip warp and
//                                                      footsteps give way by them)
//   stopTurn.reset()                                    forget the sprint and drop both (a teleport, a harness)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { inPlace, unturn, turnOf } from './layers.js';

const DEG = Math.PI / 180;
/** The skid stop (m/s, s; clip seconds where said). Its frames: 2 the left foot reaching ahead, 4 to 13 the skid on it, 14 to 24 the
 *  right foot stepping up and the body rising over the left, 25 on standing. */
export const SKID = { clip: 'Loco_SprintStop', from: 5.6, within: 0.25, at: 4.0, cone: 20, t0: 0.07, rate: 1.15, in: 0.08, outFrom: 0.72, outTo: 0.95, cut: 0.12, again: 1.2,
  plants: [[0.13, 'L'], [0.8, 'R']] };
/** The half turn (m/s, s, rad/s; clip seconds where said). Out from 0.42 (the hips at 166 degrees) by 0.58 (the left foot down at 0.53):
 *  the run takes the legs back as soon as the body faces the move. feet: when each foot is planted (the left pivots until 0.27, lands
 *  again at 0.53; the right lifts at 0.03 and lands at 0.23: measured from the ankles' heights and speeds, frame by frame), and only
 *  while the move is under still[0] m/s, gone by still[1]: the capsule is back at a run 0.08 s after a reversal passes zero, long before
 *  the turn is round, so a foot locked there was dragged 0.35 m and let go (measured: 1.6 to 2.3 m of planted slide a turn); unlocked,
 *  the turn rides the capsule as the gait would. */
export const TURN = { clip: 'Loco_Turn180', behind: 100, speed: 3.0, slow: 1.5, within: 0.3, turning: 1.5, minRate: 0.5, in: 0.06, last: 0.7, outFrom: 0.42, outTo: 0.58, cut: 0.1, still: [1, 3],
  feet: { L: [[0, 0.27], [0.53, 9]], R: [[0, 0.03], [0.23, 9]] }, plants: [[0.23, 'R'], [0.53, 'L']] };

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const planted = (spans, t) => spans.some(([a, b]) => t >= a && t <= b) ? 1 : 0;
const crossed = (plants, t0, t1) => plants.some(([t]) => t0 < t && t1 >= t);

export class StopTurn {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.p = this.C.pose(); this.m = this.C.pose();
    this.reset();
  }

  reset() {
    this.sprintT = 9; this.fastT = 9; this.yawFast = 0; this.slowT = 9; this.hx = 0; this.hz = 1; this.speedPrev = 0; this.yawPrev = null;
    this.skidT = null; this.skidOn = 0; this.skidMin = 0; this.turnT = null; this.turnOn = 0; this.turnAge = 0; this.turned = 0; this.sign = 1;
    this.w = 0; this.turnW = 0;
  }

  pose(dt, s, speed, free, base, contact) {
    const C = this.C, ch = this.ch, vx = s.velocity.x, vz = s.velocity.z;
    // ---- what the move has been doing: when it last sprinted (and which way), ran, was slow; the body's own turn this frame ----
    if (speed >= SKID.from) { this.sprintT = 0; this.hx = vx / speed; this.hz = vz / speed; } else this.sprintT += dt;
    if (speed >= TURN.speed) { this.fastT = 0; this.yawFast = s.yaw; } else this.fastT += dt;
    this.slowT = speed < TURN.slow ? 0 : this.slowT + dt;
    const dYaw = this.yawPrev === null ? 0 : wrap(s.yaw - this.yawPrev), yawRate = dt > 0 ? dYaw / dt : 0;
    this.yawPrev = s.yaw;
    const falling = speed < this.speedPrev - 1e-4;
    this.speedPrev = speed;
    const on = free > 0.9 && !ch.fpMode;

    // ---- the half turn: the move reversed behind the body, the body turning to it ----
    const theta = speed > 0.4 ? wrap(Math.atan2(vx, vz) - s.yaw) : 0;
    if (this.turnT === null && on && Math.abs(theta) > TURN.behind * DEG && this.fastT <= TURN.within && this.slowT <= TURN.within
      && Math.sign(yawRate) === Math.sign(theta) && Math.abs(yawRate) > TURN.turning) {
      this.turnT = 0; this.turnAge = 0; this.turnOn = 1; this.sign = Math.sign(theta);
      this.turned = Math.abs(wrap(s.yaw - this.yawFast)); // (how far the body has turned since it last ran: the clip's frame begins there)
    }
    // ---- the skid stop: a sprint let go, still heading the way it went ----
    if (this.skidT === null && this.turnT === null && on && falling && this.sprintT <= SKID.within && speed < SKID.at
      && (speed < 0.3 || (vx * this.hx + vz * this.hz) / speed > Math.cos(SKID.cone * DEG))) {
      this.skidT = 0; this.skidOn = 1; this.skidMin = speed;
    }

    let wSkid = 0, wTurn = 0;
    if (this.skidT !== null) {
      const t0 = SKID.t0 + this.skidT * SKID.rate;
      this.skidT += dt;
      this.skidMin = Math.min(this.skidMin, speed);
      if (!on || speed > this.skidMin + SKID.again || this.turnT !== null) this.skidOn = Math.max(0, this.skidOn - dt / (this.turnT !== null ? TURN.in : SKID.cut));
      const t = SKID.t0 + this.skidT * SKID.rate;
      if (t > SKID.outTo || this.skidOn <= 0) this.skidT = null;
      else {
        wSkid = smooth(0, SKID.in, this.skidT) * (1 - smooth(SKID.outFrom, SKID.outTo, t)) * this.skidOn;
        if (wSkid > 0.001) {
          const p = C.sample(SKID.clip, t, this.p, false);
          inPlace(C, p, SKID.clip, t, 'xz');
          C.blend(base, p, wSkid);
        }
        if (wSkid > 0.5 && crossed(SKID.plants, t0, t)) ch.onFootstep?.();
      }
    }
    if (this.turnT !== null) {
      const curve = turnOf(ch, TURN.clip), t0 = this.turnT;
      this.turnAge += dt;
      this.turned += dYaw * this.sign;
      // (the clip's frame whose hips have turned as far as the body: searched on from the last, never back)
      let f = Math.floor(t0 * C.fps);
      while (f < curve.length - 2 && curve[f + 1] <= this.turned) f++;
      const fAt = f + THREE.MathUtils.clamp((this.turned - curve[f]) / Math.max(1e-4, curve[f + 1] - curve[f]), 0, 1);
      const done = Math.abs(yawRate) < 1;
      this.turnT = Math.min(TURN.last, Math.max(t0 + dt * (done ? 1 : TURN.minRate), fAt / C.fps));
      if (!on) this.turnOn = Math.max(0, this.turnOn - dt / TURN.cut);
      const t = this.turnT;
      if ((t >= TURN.last && t0 >= TURN.last) || this.turnOn <= 0) this.turnT = null;
      else {
        wTurn = smooth(0, TURN.in, this.turnAge) * (1 - smooth(TURN.outFrom, TURN.outTo, t)) * this.turnOn;
        if (wTurn > 0.001) {
          let p = C.sample(TURN.clip, t, this.p, false);
          inPlace(C, p, TURN.clip, t, 'xz');
          unturn(ch, p, TURN.clip, t);
          if (this.sign < 0) p = ch.mirrorPose(p, this.m); // (to the right: the clip's left turn mirrored)
          C.blend(base, p, wTurn);
          const still = 1 - smooth(TURN.still[0], TURN.still[1], speed);
          for (const k of ['L', 'R']) contact[k] += (planted(TURN.feet[this.sign < 0 ? (k === 'L' ? 'R' : 'L') : k], t) * still - contact[k]) * wTurn;
        }
        if (wTurn > 0.5 && crossed(TURN.plants, t0, t)) ch.onFootstep?.();
      }
    }
    this.w = Math.min(1, wSkid + wTurn);
    this.turnW = wTurn;
    return this;
  }
}
