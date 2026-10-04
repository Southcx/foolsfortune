import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { POLE } from '../anim/authored.js';

// Poles and ropes: walk (or jump) into one and you have it, arms and legs round it. W / S climb
// (Shift faster), A / D swing round it, C lets you slide (fast) and Space jumps off, away from
// it and a little toward where you look. A rope hangs from its top and sways under you; a pole
// stands. Both take the gun away only for the fast moves: at a walk you can aim one-handed.
const _o = new THREE.Vector3();

export class Pole extends Tech {
  constructor(mgr) {
    super(mgr, 'pole');
    this.overrides = 1;
    this.blendIn = 14;
    this.cool = 0;
    this.rushing = false;
    this.phase = 0;
  }

  get rig() { return this.game.rigging; }
  get handsBusy() { return this.rushing; }

  tick(dt) { this.cool -= dt; }

  canStart() {
    const P = this.P;
    if (this.cool > 0 || !this.rig || P.mantle || P.freeze) return false;
    const pole = this.rig.poleNear(P.pos, 0.5);
    if (!pole) return false;
    if (P.grounded) {
      this.rig.axisAt(pole, P.pos.y + 1.3, _o);
      const dx = _o.x - P.pos.x, dz = _o.z - P.pos.z, d = Math.hypot(dx, dz) || 1;
      const wish = P.wishDir();
      if ((wish.x * dx + wish.z * dz) / d < 0.5) return false; // on the ground: walk into it
    }
    this.pole = pole;
    return true;
  }

  start() {
    const P = this.P, pole = this.pole;
    P.endCore();
    P.setShape('stand');
    const axis = this.rig.axisAt(pole, P.pos.y + 1.3);
    this.ang = Math.atan2(P.pos.x - axis.x, P.pos.z - axis.z);
    this.hv = new THREE.Vector3(P.vel.x, 0, P.vel.z);
    P.vel.set(0, Math.max(-3, Math.min(P.vel.y, 2)) * 0.3, 0);
    this.snap = 0;
    this.phase = 0;
    this.cyc = 0.05;
    this.slideW = 0;
    this.spin = 0;
    this.vy = 0;
    this.rushing = false;
    if (pole.rope) this.rig.pushRope(pole, this.hv, 0.045);
    sfx.rung();
    this.game.events?.emit('pole.start', { rope: pole.rope });
  }

  out() { return _o.set(Math.sin(this.ang), 0, Math.cos(this.ang)); }

  update(dt) {
    const P = this.P, c = this.cfg, pole = this.pole, inp = P.input, M = T.movement;
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const ix = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    const out = this.out().clone();
    if (P.latch('Space')) {
      const look = P.lookDir();
      const sp = c.kickOut;
      P.vel.set(out.x * sp + look.x * 1.5, c.kickUp, out.z * sp + look.z * 1.5);
      P.grounded = false;
      this.rig.pushRope(pole, out.clone().negate(), 0.12);
      this.cool = 0.4;
      this.rushing = false;
      sfx.airJump();
      return false;
    }
    const fast = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    const base = pole.rope ? c.ropeSpeed : c.speed;
    let vy = iz * (fast ? base * 1.6 : base);
    const sliding = inp.isDown('KeyC') && this.t > 0.1;
    if (sliding) vy = -c.slide;
    this.rushing = sliding || (iz !== 0 && fast);
    this.vy = THREE.MathUtils.damp(this.vy, vy, sliding ? 4 : 12, dt);
    // (a slide down a pole squeaks; a rope just burns)
    this.spin = THREE.MathUtils.damp(this.spin, ix * c.spin * (pole.rope ? 0.6 : 1), 8, dt);
    this.ang += this.spin * dt;
    const chest = P.pos.y + 1.3;
    if (this.vy > 0 && chest >= pole.y1 - 0.05) this.vy = 0; // the top
    // a ledge at the top: step over onto it
    if (iz > 0 && chest > pole.y1 - 0.6 && P.tryMantle(M.mantleMin, 0)) { this.rushing = false; this.cool = 0.4; return false; }
    // hold the axis, at arm's length (a rope's swings with it)
    const axis = this.rig.axisAt(pole, chest);
    const off = pole.r + 0.3;
    const want = new THREE.Vector3(axis.x + Math.sin(this.ang) * off, 0, axis.z + Math.cos(this.ang) * off);
    this.snap = Math.min(1, this.snap + dt * 8);
    P.vel.set((want.x - P.pos.x) * 14 * this.snap, this.vy, (want.z - P.pos.z) * 14 * this.snap);
    P.move(dt);
    P.bodyYaw = Math.atan2(-Math.sin(this.ang), -Math.cos(this.ang));
    this.phase += Math.abs(this.vy) * dt;
    pole.load = 1;
    if (P.grounded && this.vy <= 0 && this.t > 0.2) { this.cool = 0.3; this.rushing = false; return false; }
    return true;
  }

  end() { if (this.pole) this.pole.load = 0; this.rushing = false; }

  faceYaw() { return Math.atan2(-Math.sin(this.ang), -Math.cos(this.ang)); }

  /** Only the gun arm aims; the other hand keeps its grip. */
  get aim() { return { arm: 'R', turn: 0.3 }; }

  // ---- animation: the authored climb, played by distance climbed ----
  animate(ch, base, dt) {
    const C = ch.clips;
    const up = C.clips.poleUp;
    if (this.active) {
      // (going still, the cycle eases to the nearest phase where every limb holds the pole)
      if (Math.abs(this.vy) < 0.15) {
        const k = 0.05, want = Math.round((this.cyc - k) * 2) / 2 + k; // (phases 0.05 and 0.55)
        this.cyc = THREE.MathUtils.damp(this.cyc, want, 6, dt);
      } else this.cyc += this.vy * dt / POLE.cycle;
    }
    this.slideW = THREE.MathUtils.damp(this.slideW || 0, this.active && this.vy < -3 ? 1 : 0, 10, dt);
    const pose = C.sample('poleUp', ((this.cyc % 1) + 1) % 1 * up.dur, ch.P.tmp, true);
    if (this.slideW > 0.001) C.blend(pose, C.sample('poleSlide', ch.time, ch.P.tmp2), this.slideW);
    C.blend(base, pose, this.w);
  }

  /** A light contact correction: hands and feet onto the pole's surface, wherever the clip has them. */
  hands(ch) {
    if (!this.active || this.w < 0.05) return;
    const pole = this.pole, w = this.w;
    const a = new THREE.Vector3(), d = new THREE.Vector3();
    const towards = (p, gap) => { // where the point p would sit gap off the pole's surface
      this.rig.axisAt(pole, p.y, a);
      d.set(p.x - a.x, 0, p.z - a.z);
      const l = d.length() || 1;
      return new THREE.Vector3(a.x, p.y, a.z).addScaledVector(d, (pole.r + gap) / l);
    };
    for (const s of ['L', 'R']) {
      if (!(s === 'R' && ch.gunHeld)) {
        const arm = ch.arm[s];
        const palm = arm.palmPt.clone().applyMatrix4(arm.hand.matrixWorld);
        const want = towards(palm, 0);
        const delta = want.sub(palm); if (delta.length() > 0.1) delta.setLength(0.1);
        const q = arm.hand.getWorldQuaternion(new THREE.Quaternion());
        ch.reachHand(s, arm.hand.getWorldPosition(new THREE.Vector3()).add(delta), q, w);
      }
      const leg = ch.leg[s];
      const foot = leg.foot.getWorldPosition(new THREE.Vector3());
      const want = towards(foot, 0.1); // (the ankle: the sole is a little nearer)
      const delta = want.sub(foot); if (delta.length() > 0.1) delta.setLength(0.1);
      const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
      const knee = leg.shin.getWorldPosition(new THREE.Vector3());
      ch.solveLeg(leg, foot.add(delta), knee);
      ch.setWorldQuat(leg.foot, fq);
    }
  }

  label() { return this.pole?.rope ? 'ROPE' : 'POLE'; }
}
