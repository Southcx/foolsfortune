import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { GROUPS } from '../physics.js';
import { T } from '../config.js';

// Wall latch (a Movement Art): in the air beside any wall, hold C and you cling to it, feet against
// the wall and one hand on it, the other free for the gun. WASD crawls along the wall (any
// direction, up too), Space kicks off, letting go of C drops. It doesn't last: a couple of seconds
// a jump, then you start to slide, and you get the time back on the ground. (Looking well down
// is the slam's.)
const solid = (c) => !c.isSensor() && !c.parent()?.isDynamic();
const DIRS = 8;

export class Latch extends Tech {
  constructor(mgr) {
    super(mgr, 'latch');
    this.overrides = 1;
    this.blendIn = 16;
    this.left = this.cfg.budget;
    this.phase = 0;
    this.cool = 0;
  }

  tick(dt) {
    this.cool -= dt;
    if (this.P.grounded) this.left = this.cfg.budget;
  }

  reset() { this.left = this.cfg.budget; }

  /** The nearest wall around the chest, within reach: { n, point } or null. */
  wallAround(from = this.P.pos, maxDist = this.cfg.reach + 0.3) {
    const P = this.P;
    let best = null;
    for (let i = 0; i < DIRS; i++) {
      const a = (i / DIRS) * Math.PI * 2;
      const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const hit = P.physics.raycast({ x: from.x, y: from.y + 1.1, z: from.z }, d, maxDist, P.collider, GROUPS.controllerQuery, solid);
      if (!hit || Math.abs(hit.normal.y) > 0.25) continue;
      if (!best || hit.distance < best.dist) best = { dist: hit.distance, n: new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize(), point: hit.point };
    }
    return best;
  }

  canStart() {
    const P = this.P, c = this.cfg;
    if (this.cool > 0 || this.left <= 0.05 || P.grounded || P.mantle || P.freeze || P.airT < 0.1) return false;
    if (!P.input.isDown('KeyC') || P.pitch < -0.52) return false; // (C looking down is the slam)
    const w = this.wallAround();
    if (!w) return false;
    this.wall = w;
    return true;
  }

  start() {
    const P = this.P;
    P.endCore();
    P.latch('KeyC');
    P.slideBuf = 0;
    P.setShape('stand');
    P.vel.set(0, 0, 0);
    this.n = this.wall.n.clone();
    this.snap = 0;
    this.phase = 0;
    this.move = new THREE.Vector2();
    sfx.wallTouch?.();
    this.game.events?.emit('latch.start', {});
  }

  update(dt) {
    const P = this.P, c = this.cfg, inp = P.input, M = T.movement;
    this.snap = Math.min(1, this.snap + dt * 9);
    if (!inp.isDown('KeyC') && this.t > 0.12) { P.vel.set(this.n.x * 1.2, 0, this.n.z * 1.2); this.cool = 0.25; return false; }
    if (P.latch('Space')) {
      P.vel.set(this.n.x * c.kickOut, c.kickUp, this.n.z * c.kickOut);
      P.grounded = false;
      P.jumpFx(0.5);
      sfx.airJump();
      this.cool = 0.35;
      return false;
    }
    // re-find the wall under our hands (it can bend, or end)
    const w = this.wallAround(P.pos, 0.85);
    if (!w) { P.vel.set(this.n.x * 1.5, Math.min(P.vel.y, 0), this.n.z * 1.5); this.cool = 0.3; return false; }
    this.n.lerp(w.n, Math.min(1, 12 * dt)).normalize();
    // the budget runs while we cling; empty, we slide down and come off
    this.left -= dt;
    const out = this.left > 0;
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const ix = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    const along = new THREE.Vector3(-this.n.z, 0, this.n.x); // the body's left, facing the wall
    let vx = out ? -ix * c.speed : 0, vy = out ? iz * c.speed : -c.slide;
    // a ledge to reach: pull up onto it
    if (iz > 0 && out && P.tryMantle(M.mantleMin, 0)) return false;
    this.move.set(vx, vy);
    // hold the wall at arm's length (the controller slides us to it)
    const dist = w.dist - 0.02;
    const pull = (dist - 0.42) * 10;
    P.vel.set(along.x * vx + -this.n.x * pull, vy, along.z * vx + -this.n.z * pull);
    P.move(dt);
    P.bodyYaw = Math.atan2(-this.n.x, -this.n.z);
    this.phase += Math.hypot(vx, vy) * dt * 1.2;
    if (P.grounded && vy <= 0) return false; // reached the floor
    if (!out && this.left < -1.2) { P.vel.set(this.n.x * 1.5, -1, this.n.z * 1.5); this.cool = 0.6; return false; } // slid long enough
    return true;
  }

  faceYaw() { return this.n ? Math.atan2(-this.n.x, -this.n.z) : null; }

  animate(ch, base) {
    const p = ch.clips.sample('jumpLoop', 0.35, ch.P.tmp);
    ch.clips.blend(base, p, this.w);
  }

  hands(ch) {
    if (!this.active || this.w < 0.05) return;
    const P = this.P, n = this.n;
    const along = new THREE.Vector3(-n.z, 0, n.x);
    const wall = (p, dy) => {
      const o = P.renderPos.clone().add(new THREE.Vector3(0, dy, 0)).addScaledVector(p, 0);
      const hit = P.physics.raycast({ x: o.x + n.x * 0.5, y: o.y, z: o.z + n.z * 0.5 }, n.clone().negate(), 1.2, P.collider, GROUPS.controllerQuery, solid);
      return hit ? hit.point.clone().addScaledVector(n, 0.03) : o.addScaledVector(n, -0.4);
    };
    // the wall hand (the left; the right holds the gun when it's out, else both cling)
    for (const side of ['L', 'R']) {
      if (side === 'R' && ch.gunHeld) continue;
      const sg = side === 'L' ? 1 : -1;
      const reach = 1.55 + (side === 'L' ? 0.15 : 0) + Math.sin(this.phase * 3 + (side === 'L' ? 0 : Math.PI)) * 0.06 * Math.min(1, Math.hypot(this.move.x, this.move.y) / 2);
      const q = ch.handQuat(ch.arm[side], new THREE.Vector3(0, 1, 0), n.clone().negate());
      const p = wall(along, reach).addScaledVector(along, sg * 0.22);
      p.sub(ch.arm[side].palmPt.clone().applyQuaternion(q));
      ch.reachHand(side, p, q, this.w);
    }
    // both feet on the wall, knees out toward it
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? 1 : -1;
      const leg = ch.leg[side];
      const t = wall(along, 0.45 + (side === 'L' ? 0.2 : 0) + Math.sin(this.phase * 3 + (side === 'L' ? Math.PI : 0)) * 0.05).addScaledVector(along, sg * 0.14);
      t.y += ch.ankleRest * 0.5;
      const cur = leg.foot.getWorldPosition(new THREE.Vector3());
      t.lerp(cur, 1 - this.w);
      const pole = leg.thigh.getWorldPosition(new THREE.Vector3()).addScaledVector(n, -0.7);
      ch.solveLeg(leg, t, pole);
    }
  }

  label() { return this.left > 0 ? 'LATCH' : 'LATCH · SLIPPING'; }
}
