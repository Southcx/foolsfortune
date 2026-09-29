import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';
import { GROUPS } from '../physics.js';

// Hanging: a body move (always yours). Airborne beside a ledge just above mantle height, or
// under an overhead bar, and you catch it with both hands and hang. A / D shimmy along a ledge
// (W / S go hand over hand along a bar); W pulls up onto a ledge; C or S lets go; Space kicks off
// (a bar: swings you out along it). A slanted cable is a zipline: it takes you down, hanging. Hanging leaves a hand free: the gun stays out and you can
// aim and fire one-handed while you hang.
const UP = new THREE.Vector3(0, 1, 0);
const DROP = 2.05; // feet this far below the grip: the hands just reach
const solid = (c) => !c.isSensor() && !c.parent()?.isDynamic();

export class Hang extends Tech {
  constructor(mgr) {
    super(mgr, 'hang');
    this.overrides = 1;
    this.blendIn = 14;
    this.cool = 0;
    this.phase = 0;
  }

  tick(dt) { this.cool -= dt; }

  get rig() { return this.game.rigging; }

  // ---- finding something to hang from ----
  /** A ledge in front: just above the reach of a mantle, with a wall under it. */
  probeLedge() {
    const P = this.P, c = this.cfg, M = T.movement;
    const f = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    const wish = P.wishDir();
    const dir = wish.lengthSq() > 0.1 && wish.dot(f) > 0.3 ? wish.clone().normalize() : f;
    for (const h of [1.3, 1.9]) {
      const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + h, z: P.pos.z }, dir, 0.3 + c.reach, P.collider, GROUPS.controllerQuery, solid);
      if (!hit || Math.abs(hit.normal.y) > 0.25) continue;
      const n = new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize();
      if (-dir.dot(n) < 0.6) continue;
      // the top of that wall, a little way in from the face
      const top = P.physics.raycast({ x: hit.point.x - n.x * 0.15, y: P.pos.y + c.maxTop + 0.3, z: hit.point.z - n.z * 0.15 }, { x: 0, y: -1, z: 0 }, c.maxTop + 0.3 - c.minTop + 0.05, P.collider, GROUPS.controllerQuery, solid);
      if (!top || top.normal.y < 0.85) continue;
      const rise = top.point.y - P.pos.y;
      if (rise < Math.max(c.minTop, M.mantleMax + 0.02) || rise > c.maxTop) continue;
      if (Math.abs(top.point.y - (P.pos.y + 1.95)) > c.handTol) continue; // (the hands have to be able to reach it)
      return { kind: 'ledge', n, edge: new THREE.Vector3(hit.point.x, top.point.y, hit.point.z), topY: top.point.y };
    }
    return null;
  }

  /** An overhead bar just above the hands' reach. */
  probeBar() {
    const P = this.P, c = this.cfg;
    if (!this.rig) return null;
    const hand = new THREE.Vector3(P.pos.x, P.pos.y + 1.95, P.pos.z);
    const hit = this.rig.barNear(hand, c.barReach);
    if (!hit) return null;
    return { kind: 'bar', bar: hit.bar, along: hit.along, s: hit.s, topY: hit.bar.a.y };
  }

  canStart() {
    const P = this.P, c = this.cfg;
    if (this.cool > 0 || P.grounded || P.mantle || P.freeze || P.airT < 0.06) return false;
    if (P.vel.y > c.maxRise || P.vel.y < -c.maxFall) return false;
    // (the hang is caught when reaching for it: W toward a ledge, or under a bar)
    let g = P.input.isDown('KeyW') ? this.probeLedge() : null;
    if (!g) g = this.probeBar();
    if (!g) return false;
    this.grip = g;
    return true;
  }

  start() {
    const P = this.P, g = this.grip;
    P.endCore();
    P.setShape('stand');
    P.vel.set(0, 0, 0);
    this.snap = 0;
    this.phase = 0;
    this.pull = 0;
    this.shim = 0;
    if (g.kind === 'ledge') {
      this.face = g.n.clone().negate();
      this.target = g.edge.clone().addScaledVector(g.n, 0.34).setY(g.topY - DROP);
    } else {
      // face along the bar the way we were heading
      const f = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
      const al = g.along.clone().setY(0).normalize();
      // (a zipline runs one way: down)
      this.face = g.bar.zip || al.dot(f) >= 0 ? al : al.negate();
      this.target = null;
      this.shim = g.bar.zip ? Math.max(2, Math.hypot(P.vel.x, P.vel.z) * 0.6) : 0;
    }
    sfx.rung();
    this.game.events?.emit('hang.start', { kind: g.kind });
  }

  update(dt) {
    const P = this.P, c = this.cfg, g = this.grip, inp = P.input, M = T.movement;
    this.snap = Math.min(1, this.snap + dt * 9);
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const ix = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);

    // let go
    if (inp.isDown('KeyC') && this.t > 0.15) { this.release(0, -1); this.mgr.get('latch').cool = 0.6; return false; } // (a drop, not a latch on the wall)

    if (g.kind === 'ledge') {
      // Space: kick off backwards
      if (P.latch('Space')) {
        const out = g.n.clone().multiplyScalar(c.kickOut);
        P.vel.set(out.x, c.kickUp, out.z);
        P.grounded = false;
        this.cool = 0.4;
        sfx.airJump();
        return false;
      }
      // W: pull up onto it (after a beat, so a catch doesn't vault by itself)
      if (iz > 0 && this.t > c.grace) {
        const to = g.edge.clone().addScaledVector(g.n, -0.45).setY(g.topY + 0.02);
        if (P.fits(to, true)) {
          P.mantle = { from: P.pos.clone(), to, t: 0, dur: M.mantleTime * 1.15, exit: 2.2, edge: g.edge.clone(), right: new THREE.Vector3(g.n.z, 0, -g.n.x) };
          P.bodyYaw = Math.atan2(this.face.x, this.face.z);
          sfx.mantle();
          this.game.events?.emit('hang.pullup', {});
          return false;
        }
      }
      // shimmy along the ledge
      const along = new THREE.Vector3(-g.n.z, 0, g.n.x); // (the body's left, facing the wall)
      const want = -ix * c.shimmy; // D = to the right = -along
      let vs = want;
      if (vs !== 0) {
        const probe = g.edge.clone().addScaledVector(along, vs * 0.06 + Math.sign(vs) * 0.25);
        if (!this.ledgeAt(probe, g)) vs = 0;
      }
      this.shim = THREE.MathUtils.damp(this.shim, vs, 14, dt);
      g.edge.addScaledVector(along, this.shim * dt);
      this.phase += Math.abs(this.shim) * dt * 1.6;
      this.target = g.edge.clone().addScaledVector(g.n, 0.34).setY(g.topY - DROP);
      // hold the spot (the controller slides us to it, so walls in the way still count)
      P.vel.set((this.target.x - P.pos.x) * 12 * this.snap, (this.target.y - P.pos.y) * 12 * this.snap, (this.target.z - P.pos.z) * 12 * this.snap);
      P.move(dt);
      P.bodyYaw = Math.atan2(this.face.x, this.face.z);
      if (P.grounded && P.pos.y - (g.topY - DROP) < 0.05 && this.t > 0.3) return false; // feet found the floor
      return true;
    }

    // ---- a bar: hand over hand along it ----
    const bar = g.bar;
    if (P.latch('Space')) {
      // swing out along it
      const sp = bar.zip ? this.shim * 0.9 : Math.max(0, this.shim) * 1.1 + c.barKick;
      P.vel.set(this.face.x * sp, c.kickUp + (bar.zip ? Math.max(0, bar.dir.y * this.shim) : 0), this.face.z * sp);
      P.grounded = false;
      this.cool = 0.4;
      sfx.airJump();
      return false;
    }
    if (bar.zip) this.shim = Math.min(c.zipSpeed, this.shim + c.zipAccel * dt); // the trolley runs downhill
    else this.shim = THREE.MathUtils.damp(this.shim, iz > 0 ? c.brachiate : iz < 0 ? -c.brachiate * 0.55 : 0, 10, dt);
    g.s += (this.shim * dt) * (bar.zip || this.face.dot(g.along) >= 0 ? 1 : -1);
    this.phase += Math.abs(this.shim) * dt * 1.3;
    const len = bar.a.distanceTo(bar.b);
    if (g.s < 0 || g.s > len) { // off the end: let go with the momentum
      const sp = Math.max(0, this.shim);
      if (bar.zip) P.vel.copy(bar.dir).multiplyScalar(sp).add(new THREE.Vector3(0, 1.5, 0));
      else P.vel.set(this.face.x * sp, -1, this.face.z * sp);
      this.cool = 0.5;
      return false;
    }
    const at = bar.a.clone().addScaledVector(g.along, g.s);
    this.target = new THREE.Vector3(at.x, at.y - DROP, at.z);
    P.vel.set((this.target.x - P.pos.x) * 12 * this.snap, (this.target.y - P.pos.y) * 12 * this.snap, (this.target.z - P.pos.z) * 12 * this.snap);
    P.move(dt);
    P.bodyYaw = Math.atan2(this.face.x, this.face.z);
    return true;
  }

  /** Is there still a ledge at this point (the same height, with a wall under it)? */
  ledgeAt(p, g) {
    const P = this.P;
    const top = P.physics.raycast({ x: p.x - g.n.x * 0.15, y: g.topY + 0.4, z: p.z - g.n.z * 0.15 }, { x: 0, y: -1, z: 0 }, 0.6, P.collider, GROUPS.controllerQuery, solid);
    if (!top || top.normal.y < 0.85 || Math.abs(top.point.y - g.topY) > 0.1) return false;
    const wall = P.physics.raycast({ x: p.x + g.n.x * 0.3, y: g.topY - 0.3, z: p.z + g.n.z * 0.3 }, g.n.clone().negate(), 0.6, P.collider, GROUPS.controllerQuery, solid);
    return !!wall;
  }

  release(vx, vy) {
    const P = this.P;
    P.vel.set(vx, vy, 0);
    this.cool = 0.4;
  }

  end() {
    this.grip = null;
  }

  faceYaw() { return this.face ? Math.atan2(this.face.x, this.face.z) : null; }

  // ---- pose: a dangling body (the jump-loop legs), both hands on the grip ----
  animate(ch, base) {
    const p = ch.clips.sample('jumpLoop', 0.35, ch.P.tmp);
    ch.clips.blend(base, p, this.w);
  }

  hands(ch) {
    if (!this.active || !this.grip || this.w < 0.05) return;
    const g = this.grip, P = this.P;
    const face = this.face.clone(), right = new THREE.Vector3(face.z, 0, -face.x); // the body's right
    let center;
    if (g.kind === 'ledge') center = g.edge.clone().addScaledVector(g.n, -0.06);
    else center = g.bar.a.clone().addScaledVector(g.along, g.s);
    if (g.kind === 'bar' && g.bar.zip) this.phase = 0;
    // the body hangs a little behind the grip while it moves; hands alternate as it shimmies
    for (const side of ['L', 'R']) {
      if (side === 'R' && ch.gunHeld) continue; // (the gun hand stays on the gun: hang one-handed)
      const sg = side === 'L' ? -1 : 1;
      const alt = Math.sin(this.phase * Math.PI * 2 + (side === 'L' ? 0 : Math.PI)) * 0.08 * Math.min(1, Math.abs(this.shim));
      const q = ch.handQuat(ch.arm[side], face, new THREE.Vector3(0, -1, 0));
      const p = center.clone().addScaledVector(right, sg * 0.22 + (g.kind === 'bar' ? 0 : alt)).addScaledVector(face, g.kind === 'bar' ? 0 : 0.06);
      if (g.kind === 'bar') p.addScaledVector(face, alt);
      p.sub(ch.arm[side].palmPt.clone().applyQuaternion(q)).add(new THREE.Vector3(0, 0.03, 0));
      ch.reachHand(side, p, q, this.w);
    }
  }

  label() { return 'HANG'; }
}
