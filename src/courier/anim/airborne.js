// ---------------------------------------------------------------------------------------
// THE AIR: the Courier's body from leaving the ground to landing on it, played from the suite's clips over the physics the core movement
// already does. Only what is shown changes: player.js decides when they jump, how high, how fast they fall.
//   TAKE-OFF       Air_JumpStart (`jumpStart`) from its spring, then the air loop; walking off a ledge goes straight to the loop
//   THE FALL       a real fall (falling faster than FALL.vy after FALL.after s in the air) crossfades the loop into Air_FallLoop
//   THE DOUBLE JUMP  Air_DoubleJump, a front flip, time-warped (FLIP.rate) so it is upright 0.42 s after the air jump (the air jump is back
//                  at its take-off height 0.55 s after), then as captured and handed to the loop. Its hips' rise is kept: it is the turn
//                  about the body's centre of mass, 0.25 m above the hip joint, not a second jump (measured: 0.49 m up when upside down)
//   THE KICK-OFF   a jump off a ladder, a ledge, a pole or a wall held by the latch or a grate: Trav_WallJump's push from the wall,
//                  unturned (the game turns the body toward the way it goes) and in place, over the air loop; faded out on a landing
//                  (KICK.land), and not shown in first person (like the flip, it would sweep the arms and the worn tools across the view)
//   THE AIR DASH   Air_AirDash / Air_AirDashL / Air_AirDashR / Air_AirDashBack by the dash's direction against the body (blended between
//                  the two nearest as the body turns into the dash): in fast, its middle held through the dash, then out at its own pace
//                  as the dash's weight eases off. Each clip carries its own pitch (the 38 degree lean of the old frozen frame is gone)
//   LANDINGS       Air_JumpLand (`jumpLand`), weighted by the fall as before; past HARD.from m/s Loco_LandHard (a hand to the ground)
//                  comes in over it, faster than captured, faded while control is already back: it never holds the Courier
//
// Prior art: Super Mario 64's and Sunshine's air states (jump, flip, fall, each its own pose); Jak and Daxter's flip jump; Devil May Cry's
// and Bayonetta's air dash by direction; a captured clip time-warped onto a fixed physics arc, as Uncharted 4's traversal and the motion-
// matching talks do (the clip bends to the move, never the move to the clip); Spider-Man's (PS4) superhero landing for the hard one.
//
//   const air = new Airborne(ch)
//   air.land(dt, s, gs, footed, base)       the landing layers (before the air)
//   air.air(dt, s, footed, w, base)         the air track and the kick-off, at weight w (the body's airborne weight)
//   air.dash(dt, s, da, vLocal, base)       the air dash's clips, at weight da
//   air.flipping                            true while the flip is turning
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { Track } from './animator.js';
import { inPlace, unturn } from './layers.js';

// (the timings are the clip's seconds unless said; speeds m/s. Measured on the clips: .scratch curves, front and side sheets)
/** A real fall: falling faster than vy after `after` s of air. -5 m/s: a jump on flat ground lands at -6.4, so it shows the fall loop for
 *  its last 0.07 s at most (under a fifth of the crossfade); a drop of 2 m or more shows it whole. */
export const FALL = { clip: 'Air_FallLoop', vy: -5, after: 0.45, fade: 0.35 };
/** The flip: from its anticipation (0.07), 1.25x until it is upright (0.6), then as captured; to the loop at 0.82 (its last frame is the
 *  loop's pose to 3 degrees on average). */
export const FLIP = { clip: 'Air_DoubleJump', from: 0.07, rate: 1.25, upright: 0.6, out: 0.82, fade: 0.2 };
/** The dash: from 0.1 (just before the lean), 1.5x through the dash (horizontal by 0.2), then as captured (upright again by 0.73). */
export const DASH = { ahead: 'Air_AirDash', left: 'Air_AirDashL', back: 'Air_AirDashBack', right: 'Air_AirDashR', from: 0.1, rate: 1.5 };
/** The hard landing: in from a fall of HARD.from m/s (a 1.9 m drop), whole at HARD.full (2.9 m); from its impact frame at 1.5x (the hand
 *  down by 0.05 s, rising from 0.45 s), faded out between fadeFrom and fadeTo s, and mostly gone as soon as they move. */
export const HARD = { clip: 'Loco_LandHard', from: 9, full: 11, at: 0.03, rate: 1.5, fadeFrom: 0.4, fadeTo: 0.7, moving: 0.85 };
/** The kick-off: Trav_WallJump from the push (0.13), in over 0.06 s, out between 0.35 and 0.6 s, for a jump up faster than vy; landed
 *  before it is out, gone over `land` s (a kick from a ladder's foot lands at 0.38 s: cut there, a fingertip jumped 1.57 m in a frame). */
export const KICK = { clip: 'Trav_WallJump', at: 0.13, rate: 1.1, fadeIn: 0.06, outFrom: 0.35, outTo: 0.6, vy: 1.5, land: 0.1 };
/** What a kick-off is a kick-off from: the techs that hold the Courier facing a wall, a ladder, a pole (a bar's swing-out is not one). */
const HOLDS = { ladder: () => true, pole: () => true, latch: () => true, hang: (t) => t.grip?.kind === 'ledge', grate: (t) => t.mode === 'wall' };

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Airborne {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.track = new Track(this.C, new Set(['jumpLoop', FALL.clip]));
    this.wasFooted = true; this.airTime = 0;
    this.landW = 0; this.landT = 9; this.hard = 0; this.hardT = 9;
    this.kickT = null; this.kickOn = 1; this.holder = null; this.held = false;
    this.dashT = null; this.daPrev = 0; this.dashA = 0; this.dashP = this.C.pose();
  }

  get flipping() { return this.track.cur === FLIP.clip && this.track.t < FLIP.upright; }

  land(dt, s, gs, footed, base) {
    const A = T.anim, C = this.C, tmp = this.ch.P.tmp;
    if (s.landed) {
      this.landW = THREE.MathUtils.clamp(s.landed / 7, 0.3, 1); this.landT = A.landFrom;
      this.hard = smooth(HARD.from, HARD.full, s.landed); this.hardT = 0;
    }
    this.landT += dt; this.hardT += dt;
    const moving = THREE.MathUtils.clamp(gs / s.walkSpeed, 0, 1), on = footed ? 1 : 0;
    const lw = this.landW * (1 - smooth(0.12, 0.5, this.landT)) * (1 - 0.7 * moving) * on;
    if (lw > 0.001) C.blend(base, C.sample('jumpLand', this.landT, tmp, false), lw);
    const hw = this.hard * (1 - smooth(HARD.fadeFrom, HARD.fadeTo, this.hardT)) * (1 - HARD.moving * moving) * on;
    // (the gun in the right hand stays off the ground: the hand that goes down is the clip's right)
    const keep = this.ch.gunHeld ? (this.noArmR ||= Float32Array.from(this.ch.MASK_ARM.R, (v) => 1 - v)) : null;
    if (hw > 0.001) C.blend(base, C.sample(HARD.clip, HARD.at + this.hardT * HARD.rate, tmp, false), hw, keep);
  }

  air(dt, s, footed, w, base) {
    const A = T.anim, C = this.C, tr = this.track, vy = s.vy || 0;
    this.airTime = footed ? 0 : this.airTime + dt;
    if (!footed && this.wasFooted && (s.mantle || 0) < 0.5) {
      if (vy > 1) tr.play('jumpStart', A.jumpFrom, 0.06);
      else tr.play('jumpLoop', 0.5, 0.25);
    }
    if (s.airJump) tr.play(this.ch.fpMode ? 'jumpLoop' : FLIP.clip, this.ch.fpMode ? 0.4 : FLIP.from, 0.08); // (in first person no flip: the hands would wheel round the eye)
    if (!tr.cur) tr.play('jumpLoop', 0.5);
    tr.update(dt);
    if (tr.cur === FLIP.clip && tr.t < FLIP.upright) tr.t = Math.min(FLIP.upright, tr.t + dt * (FLIP.rate - 1)); // (the flip's own pace)
    const falling = vy < FALL.vy && this.airTime > FALL.after, loop = falling ? FALL.clip : 'jumpLoop', from = falling ? 0 : 0.4;
    if (tr.cur === 'jumpStart' && tr.t > 0.9) tr.play(loop, from, 0.3);
    else if (tr.cur === FLIP.clip && tr.t > FLIP.out) tr.play(loop, from, FLIP.fade);
    else if (tr.cur === 'jumpLoop' && falling) tr.play(FALL.clip, 0, FALL.fade);
    else if (tr.cur === FALL.clip && vy > 1) tr.play('jumpLoop', 0.4, FALL.fade); // (carried up again: a geyser, a jet)
    // a kick-off: the tech that held them to a wall has just let them go upward
    const a = s.techs?.active || null;
    if (a !== this.holder) {
      if (this.holder && !a && this.held && !footed && vy > KICK.vy) { this.kickT = 0; this.kickOn = 1; }
      this.holder = a;
    }
    this.held = !!(a && HOLDS[a.id]?.(a));
    this.wasFooted = footed;
    if (w > 0.001) C.blend(base, tr.sample(this.ch.P.air), w);
    if (this.kickT === null) return;
    this.kickT += dt;
    // (landed while it is still on: faded over KICK.land, never cut in one frame, casebook rule 46; it does not come back on the next jump)
    if (footed) this.kickOn = Math.max(0, this.kickOn - dt / KICK.land);
    if (this.kickT > KICK.outTo || this.kickOn <= 0) { this.kickT = null; return; }
    // (in first person no kick: the arms and the worn tools would sweep across the view, as the flip's would)
    const kw = this.ch.fpMode ? 0 : smooth(0, KICK.fadeIn, this.kickT) * (1 - smooth(KICK.outFrom, KICK.outTo, this.kickT)) * w * this.kickOn;
    if (kw <= 0.001) return;
    const t = KICK.at + this.kickT * KICK.rate, p = C.sample(KICK.clip, t, this.ch.P.tmp, false);
    unturn(this.ch, p, KICK.clip, t);
    inPlace(C, p, KICK.clip, t, 'xz');
    C.blend(base, p, kw);
  }

  dash(dt, s, da, vLocal, base) {
    const C = this.C, span = T.movement.dashTime;
    if (da > this.daPrev + 1e-4 && (this.dashT === null || this.dashT > span + 0.05)) this.dashT = 0; // (a new dash: its weight rising)
    this.daPrev = da;
    if (this.dashT === null) return;
    this.dashT += dt;
    if (da < 0.005) { this.dashT = null; return; }
    if (Math.hypot(vLocal.x, vLocal.z) > 1) this.dashA = Math.atan2(vLocal.x, vLocal.z); // (+: toward their left)
    const t = DASH.from + Math.min(this.dashT, span) * DASH.rate + Math.max(0, this.dashT - span);
    // the two nearest of the four, by the dash's angle against the body (the body turns into the dash as it goes: the pose rolls with it)
    const ring = [DASH.ahead, DASH.left, DASH.back, DASH.right, DASH.ahead];
    const u = (((this.dashA / (Math.PI / 2)) % 4) + 4) % 4, i = Math.floor(u), f = smooth(0, 1, u - i);
    const p = C.sample(ring[i], t, this.dashP, false);
    if (f > 0.001) C.blend(p, C.sample(ring[i + 1], t, this.ch.P.tmp, false), f);
    C.blend(base, p, da);
  }
}
