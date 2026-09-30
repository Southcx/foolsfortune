import * as THREE from 'three';
import { Tech } from './techs.js';
import { T } from '../config.js';

// ---------------------------------------------------------------------------------------
// LAUNCH: being carried by momentum the core movement would not allow. The core caps the Courier's horizontal speed (14 m/s, so that
// every room can be measured against one number); a swing's release, a stinger's thrust and a blade-mode lunge all want more than
// that for a moment. This tech owns the step for that moment and nothing else about her: gravity (scaled), a little drag, a little
// steering, the controller for collisions; it gives the body back when the time is up, when she lands, or when a wall has taken the
// speed. Whatever asked for it can watch each step (`onStep`) and hear when it ends (`onEnd`).
//
//   techs.get('launch').go(velocity, { time, gravity, drag, steer, until: 'time' | 'ground', endSpeed, yaw, clip, clipMap, onStep, onEnd, tag })
//   `clip` is one of the baked clips, played over the whole body for the move; `clipMap(t)` says where in it (the thrust holds its lunge).
//
// Prior art: the "committed" moves of every action game (Devil May Cry's Stinger and Helm Breaker, Bayonetta's dodge offset, Titanfall's
// slide-hop launch): the move owns the body for its duration and its exit speed is a design number, not whatever is left.
// ---------------------------------------------------------------------------------------
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export class Launch extends Tech {
  constructor(mgr) {
    super(mgr, 'launch');
    this.o = null;
    this.clipO = null; this.clipT = 0; // (the pose outlives the move by a moment: it eases out)
    this.blendIn = 26;
  }
  /** A move with a clip of its own (the Stinger's lunge) is the whole body's pose; one without leaves the core's animation alone. */
  get overrides() { return this.clipO ? 1 : 0; }
  get enabled() { return true; }
  canStart() { return false; }
  get handsBusy() { return false; }
  label() { return this.o?.tag === 'stinger' ? 'STINGER' : 'FLIGHT'; }

  /** Take the step and carry the body with `vel`. */
  go(vel, o = {}) {
    this.o = { time: 0.3, gravity: 1, drag: 0.03, steer: 0, until: 'time', endSpeed: null, face: true, minAir: 0.12, jumpExit: false, onStep: null, onEnd: null, tag: 'launch', ...o };
    this.P.vel.copy(vel);
    if (vel.y > 0.5) { this.P.grounded = false; this.P.coyote = 0; }
    this.mgr.begin(this);
  }

  start() { this.P.endCore(); this.hit = false; this.clipO = this.o?.clip ? this.o : null; this.clipT = 0; }

  tick(dt) {
    if (this.clipO) { this.clipT += dt; if (!this.active && this.w < 0.02) this.clipO = null; }
  }

  animate(ch, base) {
    const o = this.clipO;
    if (!o) return;
    const C = ch.clips, t = o.clipMap ? o.clipMap(this.clipT) : this.clipT;
    C.blend(base, C.sample(o.clip, t, ch.P.tmp, false), this.w);
  }

  update(dt) {
    const P = this.P, o = this.o, M = T.movement;
    if (!o) return false;
    const v = _v.copy(P.vel);
    v.y -= M.gravity * o.gravity * dt;
    v.multiplyScalar(1 - o.drag * dt);
    if (o.steer > 0) { const w = P.wishDir(_w); if (w.lengthSq() > 0.01) v.addScaledVector(w, o.steer * dt); }
    const before = Math.hypot(v.x, v.z);
    P.vel.copy(v);
    P.move(dt);
    o.onStep?.(dt, this);
    // a wall took the speed (or she is on the floor again): that is the end of it
    const after = Math.hypot(P.vel.x, P.vel.z);
    const stopped = before > 6 && after < before * 0.35;
    if (o.until === 'time' ? this.t >= o.time : (this.t >= o.minAir && P.grounded) || this.t >= o.time) return this.finish();
    if (stopped && this.t > 0.05) return this.finish();
    // (a flung Courier may jump again in the air: the press goes to the core)
    if (o.jumpExit && this.t > 0.3 && P.latch('Space')) { P.jumpHeldLast = false; return this.finish(); }
    return true;
  }

  finish() {
    const P = this.P, o = this.o;
    if (o.endSpeed != null) { const h = Math.hypot(P.vel.x, P.vel.z); if (h > o.endSpeed) { const k = o.endSpeed / h; P.vel.x *= k; P.vel.z *= k; } }
    return false;
  }

  end() {
    const o = this.o;
    this.o = null;
    o?.onEnd?.(this);
  }

  /** Facing: the way she is going (or a fixed heading, for a thrust). */
  faceYaw() {
    const o = this.o, P = this.P;
    if (!o || !o.face) return null;
    if (o.yaw != null) return o.yaw;
    return Math.hypot(P.vel.x, P.vel.z) > 2 ? Math.atan2(P.vel.x, P.vel.z) : null;
  }
}
