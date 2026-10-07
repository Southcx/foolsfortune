// Balance: walk onto a beam and you slow to a careful step, arms out. The beam is only as wide
// as your boots: A / D (across it) step off, W / S walk along it, Shift is a trot that wobbles
// you off the middle so it takes steering back. Space hops off. (No falling damage, no timer:
// the beam is the challenge, the drop below is what steers you.)
import * as THREE from 'three';
import { Tech } from './techs.js';
import { T } from '../../core/config.js';

const _v = new THREE.Vector3();

export class Balance extends Tech {
  constructor(mgr) {
    super(mgr, 'balance');
    this.overrides = 0;
    this.cool = 0;
    this.sway = 0;
    this.lean = 0;
    this.sp = 0;
  }

  get rig() { return this.game.rigging; }
  tick(dt) { this.cool -= dt; }

  /** The beam under the feet (three rays across it, so being off-centre still counts). */
  beamUnder(dir = this.beam?.dir) {
    const P = this.P;
    if (!this.rig?.beams.size) return null;
    const perp = dir ? _v.set(-dir.z, 0, dir.x) : null;
    for (const k of dir ? [0, 0.16, -0.16] : [0]) {
      const o = { x: P.pos.x + (perp ? perp.x * k : 0), y: P.pos.y + 0.3, z: P.pos.z + (perp ? perp.z * k : 0) };
      const hit = P.physics.raycast(o, { x: 0, y: -1, z: 0 }, 0.7, P.collider, undefined, (c) => this.rig.beams.has(c.handle));
      if (hit) return this.rig.beams.get(hit.collider.handle);
    }
    return null;
  }

  canStart() {
    const P = this.P;
    if (this.cool > 0 || !P.grounded || P.sliding || P.mantle || P.freeze || P.vel.y > 1) return false;
    const b = this.beamUnder(null);
    if (!b) return false;
    this.beam = b;
    return true;
  }

  start() {
    const P = this.P, b = this.beam;
    P.endCore();
    if (P.low && P.canStand()) P.setLow(false);
    this.sp = P.vel.x * b.dir.x + P.vel.z * b.dir.z;
    this.sway = 0;
    this.spaceHeld = P.input.isDown('Space');
    this.phase = 0;
    this.game.events?.emit('balance.start', {});
  }

  update(dt) {
    const P = this.P, c = this.cfg, inp = P.input, M = T.movement;
    const b = this.beamUnder();
    if (!b) { this.cool = 0.25; return false; }
    this.beam = b;
    // hop off
    if (inp.isDown('Space') && !this.spaceHeld) { this.cool = 0.3; return false; }
    this.spaceHeld = inp.isDown('Space');
    if (inp.isDown('KeyC')) { this.cool = 0.5; return false; }
    const trot = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    const wish = P.wishDir();
    const dir = b.dir, perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const along = wish.dot(dir), across = wish.dot(perp);
    const top = trot ? c.trot : c.speed;
    this.sp = THREE.MathUtils.damp(this.sp, THREE.MathUtils.clamp(along, -1, 1) * top, 9, dt);
    // where on the beam are we (across it)?
    const rel = _v.set(P.pos.x - b.a.x, 0, P.pos.z - b.a.z);
    const off = rel.dot(perp);
    // the wobble: a slow lean that pushes you off the middle; walking it hardly moves you, a trot a lot
    const k = Math.abs(this.sp) / c.speed;
    const t = this.t;
    this.sway = (Math.sin(t * 1.9) * 0.6 + Math.sin(t * 3.1 + 1.3) * 0.4) * (0.35 + 0.65 * Math.min(1, k)) * (trot ? 1.6 : 1);
    const drift = this.sway * (trot ? c.trotDrift : c.drift);
    // walking, you settle on the middle by yourself; trotting, you steer it
    const settle = trot ? 0 : -off * 4;
    const lat = across * c.step + drift + settle;
    this.lean = THREE.MathUtils.damp(this.lean, this.sway, 8, dt);
    P.vel.set(dir.x * this.sp + perp.x * lat, P.grounded ? 0 : P.vel.y - M.gravity * dt, dir.z * this.sp + perp.z * lat);
    P.move(dt);
    this.phase += Math.abs(this.sp) * dt;
    if (Math.abs(this.sp) > 0.3) this.heading = Math.atan2(dir.x * Math.sign(this.sp), dir.z * Math.sign(this.sp));
    if (!P.grounded && this.t > 0.2) { this.cool = 0.25; return false; }
    // off the end of the beam onto whatever is there: the core takes over when the beam is gone
    return true;
  }

  faceYaw() { return this.heading ?? null; }

  hands(ch) {
    if (!this.active || this.w < 0.05) return;
    const P = this.P, w = this.w;
    const yaw = P.bodyYaw;
    const fwd = _v.set(Math.sin(yaw), 0, Math.cos(yaw)).clone(), left = new THREE.Vector3(fwd.z, 0, -fwd.x);
    for (const s of ['L', 'R']) {
      if (s === 'R' && ch.gunHeld) continue;
      const sg = s === 'L' ? 1 : -1;
      const sh = ch.shoulder(s, new THREE.Vector3());
      // arms out and a little down, elbows soft, tipping against the lean like a tightrope walker's;
      // the hands ride a slow figure of eight of their own so nothing holds perfectly still
      const bob = Math.sin(this.t * 2.3 + (s === 'L' ? 0 : 1.7)) * 0.03;
      const p = sh.clone().addScaledVector(left, sg * 0.5).add(new THREE.Vector3(0, -0.13 - sg * this.lean * 0.2 + bob, 0)).addScaledVector(fwd, 0.1 + bob * 0.8);
      const q = ch.handQuat(ch.arm[s], left.clone().multiplyScalar(sg).addScaledVector(fwd, 0.35).add(new THREE.Vector3(0, -0.25, 0)), new THREE.Vector3(0, -1, 0.2));
      p.sub(ch.arm[s].palmPt.clone().applyQuaternion(q));
      ch.reachHand(s, p, q, w * 0.9);
    }
    // the feet on the beam's line, one nearly in front of the other (a stride wide as the boots)
    const b = this.beam;
    if (!b) return;
    const perp = new THREE.Vector3(-b.dir.z, 0, b.dir.x);
    for (const s of ['L', 'R']) {
      const leg = ch.leg[s], sg = s === 'L' ? 1 : -1;
      const foot = leg.foot.getWorldPosition(new THREE.Vector3());
      const off = _v.set(foot.x - b.a.x, 0, foot.z - b.a.z).dot(perp);
      const shift = sg * 0.04 * perp.dot(left) - off * 0.92;
      if (Math.abs(shift) < 0.005) continue;
      const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
      const knee = leg.shin.getWorldPosition(new THREE.Vector3());
      const to = foot.clone().addScaledVector(perp, shift * w);
      knee.addScaledVector(perp, shift * w * 0.5);
      ch.solveLeg(leg, to, knee.addScaledVector(fwd, 0.2));
      ch.setWorldQuat(leg.foot, fq);
    }
  }

  label() { return 'BALANCE'; }
}
