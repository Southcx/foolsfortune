import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';

// Landing roll: hold C (or tap it just before) as a hard landing hits and you roll
// out of it, the fall turned into forward speed - where the core would slide if
// you were already fast, a roll carries a drop from standing speed.
export class Roll extends Tech {
  constructor(mgr) {
    super(mgr, 'roll');
    this.overrides = 1;
    this.blendIn = 25;
    this.pending = false;
  }

  onLand(fallSpeed) {
    const P = this.P, c = this.cfg, M = T.movement;
    if (this.active || fallSpeed < c.minFall) return;
    const crouch = P.input.isDown('KeyC') || P.peekLatch('KeyC');
    if (!crouch || Math.hypot(P.vel.x, P.vel.z) > M.slideMinSpeed) return; // (fast: the core slides instead)
    this.pending = fallSpeed;
  }

  canStart() {
    if (!this.pending) return false;
    const P = this.P;
    const ok = P.grounded;
    this.fall = this.pending;
    this.pending = false;
    return ok;
  }

  start() {
    const P = this.P, c = this.cfg;
    P.endCore();
    P.latch('KeyC');
    P.slideBuf = 0;
    const wish = P.wishDir();
    this.dir = wish.lengthSq() > 0.01 ? wish.normalize() : new THREE.Vector3(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    const hs = Math.hypot(P.vel.x, P.vel.z);
    this.speed = Math.max(hs, c.speed + (this.fall - c.minFall) * c.speedPerFall);
    P.setLow(true);
    P.bodyYaw = Math.atan2(this.dir.x, this.dir.z); // roll the way you're going
    sfx.roll();
    P.shake = Math.max(P.shake, 0.15);
  }

  update(dt) {
    const P = this.P, c = this.cfg, M = T.movement;
    const k = this.t / c.time;
    // a roll-jump out of the back half
    if (k > 0.55 && P.latch('Space')) {
      P.vel.set(this.dir.x * this.speed, M.jumpVelocity, this.dir.z * this.speed);
      P.grounded = false;
      return false;
    }
    const sp = this.speed * (1 - 0.25 * k);
    P.vel.set(this.dir.x * sp, P.grounded ? 0 : P.vel.y - M.gravity * dt, this.dir.z * sp);
    P.move(dt);
    P.bodyYaw = Math.atan2(this.dir.x, this.dir.z);
    if (k >= 1) return false;
    return true;
  }

  end() {
    const P = this.P;
    if (P.canStand()) P.setLow(false);
  }

  animate(ch, base) {
    const c = this.cfg;
    const k = THREE.MathUtils.clamp(this.t / c.time, 0, 1);
    const p = ch.clips.sample('roll', THREE.MathUtils.lerp(c.clipFrom, c.clipTo, this.active ? k : 1), ch.P.tmp, false);
    ch.clips.blend(base, p, this.w);
  }

  faceYaw() { return Math.atan2(this.dir.x, this.dir.z); }

  label() { return 'ROLL'; }
}
