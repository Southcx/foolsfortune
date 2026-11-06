// ---------------------------------------------------------------------------------------
// THE SLOPE RIDE (plain name; South's ask, 2026-11-06: the Solar Skiff module "to encapsulate wave rider, snowboarding and surfing
// mechanics"; docs/ref/WAVE-RIDING.md section 3): with the sail furled on the park's slope (its face only: onSlope, world/raceway/surf/slope.js), the board rides as a
// snowboard. Every rule here is a modifier on the Solar Skiff's own ride (skiff.js keeps the sailing, the slope's gravity, the hop, the
// spin and the landing): off it, the board rides exactly as before (DESIGN.md 22: base change bad, modifiers good).
//
//   THE EDGE   A / D tip the board onto an edge (eased, never at once). The turn's radius is the board's sidecut over the edge's sine
//              (r = R / sin(edge): the sidecut model), so its heading turns at v / r. The edge holds while the turn's pull v^2 / r stays
//              under the grip, mu g cos(edge); past it the board SKIDS: the heading still turns as asked, the travel follows only the
//              grip's share of it, the rest scrubbed off as speed and thrown as spray (skiff.edge.skid { k, side, speed }, a few a real
//              second at most, for the look). At a crawl the board can still be pivoted round, as it can on the sand.
//   THE BUTTER W or S alone, on the ground under `butter.max` m/s: a nose or a tail press, the board's other end lifted; A / D pivot
//              it about the pressed end (skiff.butter { end, on, seconds }); W does not hoist the sail while it presses.
//   THE WIND   A / D held while Space charges the hop winds the body up: the launch carries a spin by how long it was wound, slowing
//              by itself, stopped sooner by the other key (SSX's pre-wind, the real one's counter-rotation).
//   LANDING    after a real air, graded by the board's yaw off its travel and its fall's angle against the slope's (Alto's: land with
//              the hill): clean keeps the speed and links into the trick combo; sketchy loses some and wobbles (a small link); past either
//              line it is the ride's own bail (skiff.slope.land { grade, yaw, pitch }).
//   skiff.slope { on } on entering and leaving.
//
// Prior art: SSX Tricky (pre-wound spins, landings that keep the run), Shaun White Snowboarding (the edge as the analog turn, a skid past
// the grip), the sidecut model of a carved turn (Lieu and Mote, "Mechanics of the turning snow ski"; r = R_sc cos / sin of the edge, the
// grip limit mu g cos(edge)), Alto's Adventure / Odyssey (a landing graded by its angle to the slope), Amplitude's and Steep's butters.
//
//   const R = new SlopeRide(skiff)   R.sail(wasL, keyW, keyS)   R.steer(steerEff, rate, dt, steerIn, sp2) -> steerEff   R.land(vyT) -> bailed
//   R.on   R.edge (rad, + right)   R.skid (0..1)   R.butter ('nose' | 'tail' | null)   R.press (0..1, eased)   R.wound (0..1)   R.grade
//   SLOPE_RIDE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { COMBO } from './combo.js';
import { SKIFF } from './boat.js';
import { onSlope } from '../../world/raceway/surf/slope.js';
import { RW } from '../../world/raceway/track.js';

const _n = new THREE.Vector3(); // (the ground's normal under a landing: the ride's own is the last step's before the air)

/** The numbers. `furl`: the sail's hoist under which the board can ride as a snowboard (`leaveL` over which it stops); `enter` and `leave`
 *  (degrees): the fall along the travel that begins it, the steepness under which it ends after `leaveT` real s on the ground.
 *  edge: its most (rad), its ease; the sidecut's radius (m); the grip's mu; the heading's fastest turn (rad/s); the crawl's pivot (rad/s,
 *  gone by `under` m/s). skid: the speed scrubbed (a real second, by k), the least k said, real s between its events. butter: under and
 *  over these m/s, its pivot (rad/s), the most it turns off the travel (rad), real s before it counts, its points. wind: real s to wind it
 *  fully, the launch spin then (rad/s), its own slowing and the other key's (a real second). land: the least air (real s), the clean
 *  yaw and pitch (rad), the pitch past which it bails, a sketchy landing's keep. carve: the edge a carve counts from, real s before it does. */
export const SLOPE_RIDE = {
  furl: 0.15, leaveL: 0.25, enter: 8, leave: 5, leaveT: 0.6,
  edge: { max: 0.95, ease: 6 }, sidecut: 9, mu: 1.15, turnCap: 3.2, pivot: 1.6, under: 6,
  skid: { drag: 1.4, min: 0.08, every: 0.15 },
  butter: { min: 1.2, max: 10, rate: 2.6, most: 1.4, count: 0.4 },
  wind: { full: 0.6, spin: 7, fade: 0.35, counter: 6 },
  land: { air: 0.4, yaw: 0.3, pitch: 0.5, bail: 0.95, keep: 0.85 }, // (pitch and bail widened after the headless play, 2026-11-06: a straight tap on a 26-degree pitch lands ~26 degrees steeper under the skiff's gravity)
  carve: { edge: 0.3, count: 1.0 },
};

const UP = new THREE.Vector3(0, 1, 0), D2R = Math.PI / 180;
const clamp = THREE.MathUtils.clamp, damp = THREE.MathUtils.damp;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class SlopeRide {
  constructor(S) { this.S = S; this.rideT = 0; this.reset(); }
  get game() { return this.S.game; }
  /** On the slope as a snowboard, while the ride is the ride. */
  get on() { return this._on && this.S.active && this.S.phase === 'ride'; }
  reset() {
    if (this._on) this.emit('skiff.slope', { on: false });
    this._on = false; this.flatT = 0; this.edge = 0; this.skid = 0; this.skidT = 0; this.butter = null; this.butterT = 0; this.press = 0;
    this.wind = 0; this.windDir = 0; this.spinRate = 0; this.wasAir = false; this.grade = null; this.carveT = 0;
  }
  emit(name, e) { this.game.events?.emit(name, { ...e, by: 'courier' }); }
  get wound() { return this.wind / SLOPE_RIDE.wind.full; }

  /** The ground's fall along the travel (tan: + falling away) and its steepness (tan), from the ride's normal. */
  fall(n = this.S.n) {
    const S = this.S, sp = S.v.length();
    const tx = sp > 1.5 ? S.v.x / sp : Math.sin(S.heading), tz = sp > 1.5 ? S.v.z / sp : Math.cos(S.heading), ny = Math.max(0.2, n.y);
    return { down: (n.x * tx + n.z * tz) / ny, steep: Math.sqrt(n.x * n.x + n.z * n.z) / ny, tx, tz };
  }
  /** On the park's slope? (park-local through the Raceway's frame; nowhere else, the Dunes included) */
  onDune() { const D = this.S.dunes, p = this.S.P.pos; return !!D?.surf && onSlope(p.x - RW.x, p.z - RW.z); }
  /** Into the slope ride or out of it (each step of the ride). */
  check(dt) {
    const S = this.S, R = SLOPE_RIDE, water = !!S.onWater || !!S.surf?.on;
    if ((S.rideT || 0) < this.rideT) this.reset(); // (a new ride)
    this.rideT = S.rideT || 0;
    let on = this._on;
    if (!on) on = !S.air && !water && S.L < R.furl && this.onDune() && this.fall().down > Math.tan(R.enter * D2R); // (only on the slope's face: elsewhere the board is as it was)
    else if (water || S.L > R.leaveL) on = false;
    else if (!S.air) { this.flatT = this.fall().steep < Math.tan(R.leave * D2R) ? this.flatT + dt : 0; if (this.flatT > R.leaveT) on = false; }
    if (on !== this._on) {
      if (!on) this.endButter(), this.endCarve();
      this._on = on; this.flatT = 0; this.edge = 0; this.skid = 0; this.emit('skiff.slope', { on });
    }
  }

  /** The sail's step (skiff.js, after W / S worked it): a butter's W presses the nose, it does not hoist. */
  sail(wasL, keyW, keyS) {
    const S = this.S, B = SLOPE_RIDE.butter, sp = S.v.length();
    const want = this._on && !S.air && keyW !== keyS && sp > B.min && sp < B.max && !S.rules?.manualOn ? (keyW ? 'nose' : 'tail') : null;
    if (want !== this.butter) { this.endButter(); if (want) { this.butter = want; this.butterT = 0; this.turned = 0; this.emit('skiff.butter', { end: want, on: true }); } }
    if (this.butter === 'nose' && S.L > wasL) { S.L = wasL; S.hoistDir = 0; }
  }
  endButter() {
    if (!this.butter) return;
    const end = this.butter, secs = this.butterT; this.butter = null;
    this.emit('skiff.butter', { end, on: false, seconds: +secs.toFixed(2) });
    if (secs >= SLOPE_RIDE.butter.count) this.S.combo.add('butter', COMBO.points.sloped.butter * Math.min(3, secs) * (1 + Math.min(1, this.turned / Math.PI)));
  }
  endCarve() {
    if (this.carveT >= SLOPE_RIDE.carve.count) this.S.combo.add('edge', COMBO.points.sloped.carve * Math.min(4, this.carveT));
    this.carveT = 0;
  }

  /** The turn (skiff.js, in place of the sand's, before the heading moves by steerEff x rate): the steerEff that turns the heading as the
   *  edge, the butter or the crawl asks; the travel turned with it by the grip's share. Off the slope: steerEff as it came. */
  steer(steerEff, rate, dt, steerIn, sp2) {
    const S = this.S, R = SLOPE_RIDE, P = S.P;
    this.check(dt);
    this.press = damp(this.press, this.butter ? 1 : 0, 10, dt);
    if (!this._on) return steerEff;
    // ---- the air: a pre-wound spin carried off the lip
    if (S.air) {
      if (!this.wasAir) {
        this.spinRate = R.wind.spin * clamp(this.wound, 0, 1); this.wind = 0; this.endCarve(); this.endButter();
        // a hop off the face keeps the way down it had (the sand's hop sets its rise alone: on a slope that pops the board off the face
        // and it lands steep; a snowboard's ollie rides the slope's line): the face's descent added to the launch, here only
        if (P.vel.y > 0) { const F = this.fall(); P.vel.y -= S.v.length() * Math.max(0, F.down); }
      }
      this.wasAir = true;
      if (this.spinRate > 0.05) {
        S.spin += -this.windDir * this.spinRate * dt;
        this.spinRate *= Math.exp(-(steerIn && Math.sign(steerIn) === -this.windDir ? R.wind.counter : R.wind.fade) * dt);
      }
      return steerEff;
    }
    if (this.wasAir) { this.wasAir = false; this.spinRate = 0; }
    if (sp2 && steerIn) { if (Math.sign(steerIn) !== this.windDir) this.wind = 0; this.windDir = Math.sign(steerIn); this.wind = Math.min(R.wind.full, this.wind + dt); }
    else if (!sp2) this.wind = Math.max(0, this.wind - dt * 2);
    if (S.carve) { this.edge = damp(this.edge, 0, R.edge.ease, dt); return steerEff; } // (Q / E's carve on the sand keeps its own turn)
    const v = S.v.length(), safe = Math.max(0.2, rate);
    // ---- the butter: pivoted about the pressed end, the travel left where it was
    if (this.butter) {
      this.butterT += dt; this.edge = damp(this.edge, 0, R.edge.ease, dt);
      const off = wrap(S.heading - Math.atan2(S.v.x, S.v.z)), dh0 = -steerIn * R.butter.rate * dt;
      const dh = Math.abs(off + dh0) > R.butter.most && Math.abs(off + dh0) > Math.abs(off) ? 0 : dh0; // (never past a quarter turn off the travel: the board does not ride switch)
      if (dh) {
        const e = (this.butter === 'nose' ? 1 : -1) * (SKIFF.half || 1.8) * 0.8, h0 = S.heading, h1 = h0 + dh;
        const x = P.pos.x + e * (Math.sin(h0) - Math.sin(h1)), z = P.pos.z + e * (Math.cos(h0) - Math.cos(h1));
        if (S.clearAt(x, P.pos.y, z)) { P.pos.x = x; P.pos.z = z; } // (the middle swung round the pressed end)
        this.turned += Math.abs(dh);
      }
      this.skid = 0;
      return -dh / (safe * dt);
    }
    // ---- the edge: the sidecut's turn, held by the grip, or skidded past it
    this.edge = damp(this.edge, steerIn * R.edge.max, R.edge.ease, dt);
    const ae = Math.abs(this.edge), dir = Math.sign(this.edge) || Math.sign(steerIn);
    let w = v * Math.sin(ae) / R.sidecut;
    w = Math.min(R.turnCap, Math.max(w, Math.abs(steerIn) * R.pivot * (1 - smooth(0, R.under, v))));
    const need = v * w, grip = R.mu * T.physics.gravity * Math.cos(ae) * (S.rules?.mult?.('grip') ?? 1);
    const share = need > grip ? grip / need : 1, k = v > 3 ? 1 - share : 0;
    const dh = -dir * w * dt;
    S.v.applyAxisAngle(UP, dh * share); // (the travel turned with the board, by what the edge holds)
    this.skid = damp(this.skid, k, 12, dt);
    if (k > 0.01) S.v.multiplyScalar(Math.exp(-R.skid.drag * k * dt));
    this.skidT -= dt;
    if (k > R.skid.min && this.skidT <= 0) { this.skidT = R.skid.every; this.emit('skiff.edge.skid', { k: +k.toFixed(2), side: dir, speed: +v.toFixed(1) }); }
    if (ae > R.carve.edge && k < 0.1 && v > 8) this.carveT += dt; else if (this.carveT) this.endCarve();
    return dir * w / safe;
  }

  /** A landing (skiff.js land(), first): graded on the slope after a real air; true when it bailed (the ride's own bail). */
  land(vyT) {
    const S = this.S, R = SLOPE_RIDE.land, P = S.P;
    this.spinRate = 0;
    if (!this._on || (S.airT || 0) < R.air) return false;
    const TAU = Math.PI * 2, near = Math.round(S.spin / TAU), yaw = Math.abs(S.spin - near * TAU);
    const vh = Math.max(0.1, S.v.length()), F = this.fall(S.dunes?.normalAt ? S.dunes.normalAt(P.pos.x, P.pos.z, _n) : S.n), pitch = Math.abs(Math.atan2(-P.vel.y, vh) - Math.atan(F.down));
    void vyT;
    const bail = yaw > 1.22 || pitch > R.bail, grade = bail ? 'bail' : yaw < R.yaw && pitch < R.pitch ? 'clean' : 'sketchy';
    this.grade = grade;
    this.emit('skiff.slope.land', { grade, yaw: +yaw.toFixed(2), pitch: +pitch.toFixed(2) });
    if (grade === 'clean') S.combo.add('clean', COMBO.points.sloped.clean);
    else if (grade === 'sketchy') { S.v.multiplyScalar(R.keep); S.landDip = 1; P.shake = Math.max(P.shake || 0, 0.2); S.combo.add('sketchy', COMBO.points.sloped.sketchy); }
    else if (pitch > R.bail && yaw <= 1.22 && S.canBail()) { S.bail('land'); return true; } // (flat onto the face: thrown, as a sheer drop is; broadside is the ride's own)
    return false;
  }
}
