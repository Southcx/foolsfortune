import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';
import { GROUPS } from '../physics.js';

// Wall climb: jump into a wall head-on with W held and run up it for a moment
// (Mirror's Edge's wall run-up). A ledge within reach on the way up is a mantle;
// Space kicks off the wall, back the way you came. Once per airtime.
export class WallClimb extends Tech {
  constructor(mgr) {
    super(mgr, 'wallclimb');
    this.overrides = 1;
    this.used = false;
  }

  probe(len) {
    const P = this.P;
    const f = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 1.0, z: P.pos.z }, f, len, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (!hit || Math.abs(hit.normal.y) > 0.25) return null;
    const n = new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize();
    return { hit, n, face: -f.dot(n) };
  }

  // once per airtime, and only off the ground: after a wallrun or a wall jump the core's
  // wall moves own the air (a run-up is a Mirror's Edge move, not a wallrun chain)
  tick() {
    const P = this.P;
    if (P.grounded) this.used = false;
    else if (P.wallrun) this.used = true;
  }

  canStart() {
    const P = this.P, c = this.cfg;
    if (this.used || P.grounded || P.wallrun || P.mantle || P.airT < 0.05 || P.airT > c.window || P.vel.y < -c.maxFall) return false;
    if (!P.input.isDown('KeyW')) return false;
    const pr = this.probe(0.3 + c.reach);
    if (!pr || pr.face < Math.cos(c.maxAngle * Math.PI / 180)) return false;
    // running into it, not drifting past
    const into = -(P.vel.x * pr.n.x + P.vel.z * pr.n.z);
    if (into < c.minSpeed) return false;
    // a ledge the core can mantle takes priority
    const M = T.movement;
    const top = { x: pr.hit.point.x - pr.n.x * 0.3, y: P.pos.y + M.mantleMax + 0.15, z: pr.hit.point.z - pr.n.z * 0.3 };
    const down = P.physics.raycast(top, { x: 0, y: -1, z: 0 }, M.mantleMax + 0.15, P.collider, GROUPS.controllerQuery, (col) => !col.isSensor());
    if (down && down.normal.y > 0.7) return false;
    this.n = pr.n;
    return true;
  }

  start() {
    const P = this.P;
    P.endCore();
    this.used = true;
    this.phase = 0;
    sfx.climbStep();
  }

  update(dt) {
    const P = this.P, c = this.cfg, M = T.movement;
    const k = this.t / c.time;
    if (P.latch('Space')) {
      // kick off: out and up, back the way we came
      P.vel.set(this.n.x * c.kickOut, c.kickUp, this.n.z * c.kickOut);
      P.grounded = false;
      P.jumpFx(0.5);
      sfx.airJump();
      return false;
    }
    const vy = c.speed * Math.max(0, 1 - k * k);
    P.vel.set(-this.n.x * 1.5, vy, -this.n.z * 1.5); // (pressed into the wall)
    P.move(dt);
    this.phase += dt * c.steps;
    if (Math.floor(this.phase) !== Math.floor(this.phase - dt * c.steps)) sfx.climbStep();
    // a ledge came within reach: pull up onto it
    if (P.tryMantle(M.mantleMin, 0)) return false;
    const pr = this.probe(0.3 + c.reach + 0.2);
    if (pr) this.n.copy(pr.n);
    if (!pr || !P.input.isDown('KeyW') || k >= 1 || P.grounded) {
      P.vel.set(this.n.x * 1.2, Math.min(vy, 1), this.n.z * 1.2);
      return false;
    }
    return true;
  }

  // legs run up the wall (a fast sprint cycle, the body leaning back off it)
  animate(ch, base) {
    const C = ch.clips, g = ch.gait.sprint;
    const p = C.sample('sprint', ((this.phase * 0.5 + g.off) % 1) * g.dur, ch.P.tmp);
    C.blend(base, p, this.w);
  }

  afterPose(ch) {
    if (!this.active) return;
    const rightW = new THREE.Vector3(-1, 0, 0).applyQuaternion(ch.root.quaternion);
    ch.rotW(ch.bones.spine, rightW, 0.25 * this.w); // lean back off the wall
  }

  // hands reach up the wall, alternating
  hands(ch) {
    if (!this.active || this.w < 0.05) return;
    const P = this.P, n = this.n;
    for (const side of ['L', 'R']) {
      if (side === 'R' && ch.gunHeld) continue;
      const sg = side === 'L' ? 1 : -1;
      const up = (Math.sin(this.phase * Math.PI + (side === 'L' ? 0 : Math.PI)) * 0.5 + 0.5);
      const left = new THREE.Vector3(-n.z, 0, n.x); // the character's left, along the wall
      const p = P.renderPos.clone().addScaledVector(n, -0.02 + 0.3).add(new THREE.Vector3(0, 1.35 + up * 0.35, 0));
      // snap onto the wall surface
      const hit = P.physics.raycast(p, n.clone().negate(), 1.2, P.collider, GROUPS.controllerQuery);
      const at = hit ? new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z).addScaledVector(n, 0.02) : p;
      at.addScaledVector(left, sg * 0.2);
      const q = ch.handQuat(ch.arm[side], new THREE.Vector3(0, 1, 0), n.clone().negate());
      at.sub(ch.arm[side].palmPt.clone().applyQuaternion(q));
      ch.reachHand(side, at, q, this.w * (0.6 + 0.4 * up));
    }
  }

  label() { return 'WALL CLIMB'; }
}
