import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';

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

  animate(ch, base) {
    const p = ch.clips.sample('idle', 0.5, ch.P.tmp);
    ch.clips.blend(base, p, this.w);
  }

  hands(ch) {
    if (!this.active || this.w < 0.05) return;
    const P = this.P, pole = this.pole, w = this.w;
    const out = new THREE.Vector3(Math.sin(this.ang), 0, Math.cos(this.ang));
    const side = new THREE.Vector3(-out.z, 0, out.x); // (the body's left, facing the pole)
    const y = P.renderPos.y;
    const swing = Math.sin(this.phase * 5);
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1;
      // hands stacked on the pole, the pair trading places as it climbs
      const up = 1.72 + (s === 'L' ? 0.16 : -0.18) + swing * 0.07 * (s === 'L' ? 1 : -1);
      if (!(s === 'R' && ch.gunHeld)) {
        const at = this.rig.axisAt(pole, y + up, new THREE.Vector3()).addScaledVector(out, pole.r * 0.7).addScaledVector(side, sg * 0.05);
        const q = ch.handQuat(ch.arm[s], new THREE.Vector3(0, 1, 0).addScaledVector(side, sg * 0.35), out.clone().negate());
        at.sub(ch.arm[s].palmPt.clone().applyQuaternion(q));
        ch.reachHand(s, at, q, w);
      }
      // feet clamp it, one above the other
      const leg = ch.leg[s];
      const fy = y + 0.42 + (s === 'L' ? 0.14 : -0.1) - swing * 0.06 * (s === 'L' ? 1 : -1);
      const t = this.rig.axisAt(pole, fy, new THREE.Vector3()).addScaledVector(out, pole.r + 0.06).addScaledVector(side, sg * 0.09);
      t.y = fy - ch.ankleRest * 0.3;
      const cur = leg.foot.getWorldPosition(new THREE.Vector3());
      t.lerp(cur, 1 - w);
      const pl = leg.thigh.getWorldPosition(new THREE.Vector3()).addScaledVector(out, 0.7).addScaledVector(side, sg * 0.4);
      ch.solveLeg(leg, t, pl);
    }
  }

  label() { return this.pole?.rope ? 'ROPE' : 'POLE'; }
}
