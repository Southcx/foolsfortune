// Push and pull: facing a heavy crate, hold F and you take hold of it. Then W pushes it away
// from you and S pulls it toward you, along the way you're facing and no other (it can't be
// turned); letting go of F (or jumping) lets go. Crates too heavy to lift are meant for this:
// steps to build, a plug to shove into a hole, a block to drag to a wall.
import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();

export class Push extends Tech {
  constructor(mgr) {
    super(mgr, 'push');
    this.overrides = 0;
    this.cool = 0;
    this.moved = 0;
  }

  get carry() { return this.mgr.get('carry'); }
  tick(dt) { this.cool -= dt; }

  /** A heavy crate within reach in front of us. */
  canGrab() { return this.carry?.find(true) || null; }

  canStart() {
    const P = this.P;
    if (this.cool > 0 || !P.grounded || P.sliding || P.mantle || P.freeze || this.carry?.item) return false;
    if (!P.peekLatch('KeyF')) return false;
    const e = this.canGrab();
    if (!e) return false;
    P.latch('KeyF');
    this.crate = e;
    return true;
  }

  start() {
    const P = this.P, e = this.crate, body = e.body;
    P.endCore();
    if (P.low && P.canStand()) P.setLow(false);
    P.vel.set(0, 0, 0);
    // the crate's face nearest us: its own axis (a crate can sit at any angle)
    const t = body.translation(), r = body.rotation();
    const q = new THREE.Quaternion(r.x, r.y, r.z, r.w);
    const to = new THREE.Vector3(P.pos.x - t.x, 0, P.pos.z - t.z).normalize();
    let best = null, bd = -2;
    for (const ax of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)]) {
      const a = ax.applyQuaternion(q).setY(0).normalize();
      const d = a.dot(to);
      if (d > bd) { bd = d; best = a.clone(); }
    }
    this.a = best; // from the crate out toward us
    this.half = e.half?.[0] ?? 0.5;
    this.dist = this.half + 0.42;
    const rel = new THREE.Vector3(P.pos.x - t.x, 0, P.pos.z - t.z);
    this.perp = new THREE.Vector3(-this.a.z, 0, this.a.x);
    this.lat = THREE.MathUtils.clamp(rel.dot(this.perp), -this.half * 0.8, this.half * 0.8);
    this.snap = 0;
    this.spaceHeld = P.input.isDown('Space');
    this.moved = 0;
    this.speed = 0;
    body.setEnabledRotations(false, false, false, true); // (it slides; it doesn't tumble)
    body.setLinearDamping(4);
    sfx.thunk?.(1, 3);
    this.game.events?.emit('push.start', {});
  }

  update(dt) {
    const P = this.P, c = this.cfg, inp = P.input, e = this.crate, body = e.body;
    if (!inp.isDown('KeyF') || (inp.isDown('Space') && !this.spaceHeld) || !body.isValid() || !P.grounded) { this.cool = 0.25; return false; }
    this.spaceHeld = inp.isDown('Space');
    const t = body.translation();
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const push = this.a.clone().negate(); // toward the crate
    // (the way you're facing is the way you push; W = toward it)
    const m = iz;
    const sp = m > 0 ? c.speed : c.pullSpeed;
    this.speed = THREE.MathUtils.damp(this.speed, m * sp, 8, dt);
    const v = push.clone().multiplyScalar(this.speed);
    const lv = body.linvel();
    body.setLinvel({ x: v.x, y: lv.y, z: v.z }, true);
    // we're tied to it: stand where a hand can hold it, at the same lateral spot
    const want = new THREE.Vector3(t.x + this.a.x * this.dist + this.perp.x * this.lat, P.pos.y, t.z + this.a.z * this.dist + this.perp.z * this.lat);
    this.snap = Math.min(1, this.snap + dt * 7);
    const k = 16 * this.snap;
    P.vel.set((want.x - P.pos.x) * k, P.grounded ? 0 : P.vel.y - T.movement.gravity * dt, (want.z - P.pos.z) * k);
    P.move(dt);
    P.bodyYaw = Math.atan2(push.x, push.z);
    // too far from it: it got away (a wall in the way behind us, or it fell)
    if (Math.hypot(P.pos.x - t.x, P.pos.z - t.z) > this.dist + 0.9 || Math.abs(t.y - P.pos.y) > 1.6) { this.cool = 0.4; return false; }
    const d = Math.abs(this.speed) * dt;
    this.moved += d;
    if (this.moved >= 1) { this.game.events?.emit('push.move', { dist: this.moved }); this.moved = 0; }
    return true;
  }

  end() {
    const e = this.crate;
    if (e?.body?.isValid()) { e.body.setEnabledRotations(true, true, true, true); e.body.setLinearDamping(0); }
    if (this.moved > 0.2) this.game.events?.emit('push.move', { dist: this.moved });
    this.moved = 0;
  }

  faceYaw() { return this.a ? Math.atan2(-this.a.x, -this.a.z) : null; }

  /** Pushing: the pushing clip (UAL Push_Loop: leaning into it, knees bent), played on as it goes; still, it holds its first leaning
   *  frame. Pulling: the walk backwards under the pushing clip's arms (the hands stay on the crate), the body leaning back against
   *  it (afterPose): pulling is not pushing played in reverse, which leaned them into a crate they were walking away from. */
  animate(ch, base, dt) {
    const C = ch.clips, clip = C.clips.push;
    if (!clip) return;
    if (this.active) this.pt = (this.pt || 0) + Math.abs(this.speed || 0) * dt * 0.7;
    this.pullK = THREE.MathUtils.damp(this.pullK || 0, (this.speed || 0) < -0.05 ? 1 : 0, 8, dt);
    const t = ((this.pt || 0) % clip.dur + clip.dur) % clip.dur;
    const pushT = (this.speed || 0) >= 0 ? t : 0;
    C.blend(base, C.sample('push', pushT, ch.P.tmp, true), this.w * (1 - this.pullK));
    if (this.pullK > 0.001) {
      // (the walk run backwards: its cycle at the pace they are backing; the arms the push's, reaching for the crate)
      C.blend(base, C.sample('walk', -(this.pt || 0) * 1.1, ch.P.tmp, true), this.w * this.pullK);
      this.armMask ||= C.mask(Object.fromEntries(C.bones.filter((n) => /^(upper_arm|forearm|hand|f_|thumb)/.test(n)).map((n) => [n, 1])));
      C.blend(base, C.sample('push', 0.15, ch.P.tmp, true), this.w * this.pullK, this.armMask);
    }
  }

  /** Leaning back against the pull (a small correction on the spine over the clips, not the pose of the action). */
  afterPose(ch) {
    const k = (this.pullK || 0) * this.w;
    if (k < 0.01) return;
    const yaw = this.P.bodyYaw, left = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const a = -0.22 * k; // (about 12 degrees back, spread up the spine)
    for (const [b, f] of [['spine001', 0.4], ['spine002', 0.35], ['spine003', 0.25]]) ch.rotW(ch.bones[b], left, a * f);
    ch.root.updateMatrixWorld(true);
  }

  hands(ch) {
    if (!this.active || this.w < 0.05 || !this.crate) return;
    const P = this.P, w = this.w, e = this.crate;
    const t = e.body.translation();
    const face = new THREE.Vector3(t.x, 0, t.z).addScaledVector(this.a, this.half); // the near face
    const push = this.a.clone().negate();
    for (const s of ['L', 'R']) {
      if (s === 'R' && ch.gunHeld) continue;
      const sg = s === 'L' ? 1 : -1;
      const side = new THREE.Vector3(push.z, 0, -push.x);
      const at = face.clone().addScaledVector(side, sg * 0.22).addScaledVector(this.a, 0.02);
      at.y = t.y + 0.05;
      const q = ch.handQuat(ch.arm[s], push.clone().addScaledVector(UP, 0.5), push.clone());
      at.sub(ch.arm[s].palmPt.clone().applyQuaternion(q));
      ch.reachHand(s, at, q, w);
    }
  }

  label() { return this.speed < -0.2 ? 'PULL' : 'PUSH'; }
}
