import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { GROUPS } from '../physics.js';
import { T } from '../config.js';

// Grate climbing: walls and overhangs of openwork grating are climbed in any direction, for as
// long as you like. On a wall W / S go up and down and A / D sideways; reaching the top edge
// pulls you over it, and reaching an overhang above carries you onto it; on an overhang you hang
// by your hands and WASD crawls along it (the way you look). C lets go, Space kicks off a wall
// or hops off an overhang. Shift is a scramble (both hands: the gun goes away).
const DROP = 2.05; // feet this far below an overhang's underside
const DIRS = 8;

export class Grate extends Tech {
  constructor(mgr) {
    super(mgr, 'grate');
    this.overrides = 1;
    this.blendIn = 14;
    this.cool = 0;
    this.phase = 0;
    this.rushing = false;
    this.mode = 'wall';
  }

  get rig() { return this.game.rigging; }
  get handsBusy() { return this.rushing; }

  tick(dt) { this.cool -= dt; }

  isG = (c) => this.rig.grates.has(c.handle);

  /** The nearest grate wall around the chest: { dist, n, point } or null. */
  wallProbe(maxDist) {
    const P = this.P;
    let best = null;
    for (let i = 0; i < DIRS; i++) {
      const a = (i / DIRS) * Math.PI * 2;
      const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 1.1, z: P.pos.z }, d, maxDist, P.collider, GROUPS.controllerQuery, this.isG);
      if (!hit || Math.abs(hit.normal.y) > 0.3) continue;
      if (!best || hit.distance < best.dist) best = { dist: hit.distance, n: new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize(), point: hit.point };
    }
    return best;
  }

  /** The grate overhead: { y (its underside) } or null. */
  ceilProbe(reach = 1.6) {
    const P = this.P;
    let best = null;
    for (const [dx, dz] of [[0, 0], [0.22, 0], [-0.22, 0], [0, 0.22], [0, -0.22]]) {
      const hit = P.physics.raycast({ x: P.pos.x + dx, y: P.pos.y + 1.5, z: P.pos.z + dz }, { x: 0, y: 1, z: 0 }, reach, P.collider, GROUPS.controllerQuery, this.isG);
      if (!hit || hit.normal.y > -0.7) continue;
      if (!best || hit.point.y < best.y) best = { y: hit.point.y };
    }
    return best;
  }

  canStart() {
    const P = this.P;
    if (this.cool > 0 || !this.rig || !this.rig.grateList.length || P.mantle || P.freeze) return false;
    const wish = P.wishDir();
    const w = this.wallProbe(0.62);
    if (w) {
      const into = -(wish.x * w.n.x + wish.z * w.n.z);
      if ((P.grounded ? into > 0.5 : into > -0.2)) { this.mode = 'wall'; this.n = w.n.clone(); return true; }
    }
    if (!P.grounded && P.vel.y > -7 && P.airT > 0.05) {
      const c = this.ceilProbe(0.9);
      if (c && c.y - (P.pos.y + 1.7) < 0.5) { this.mode = 'ceil'; this.cy = c.y; this.n = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw)); return true; }
    }
    return false;
  }

  start() {
    const P = this.P;
    P.endCore();
    P.setShape('stand');
    P.vel.set(0, Math.max(P.vel.y, -3) * 0.3, 0);
    this.snap = 0;
    this.phase = 0;
    this.modeT = 1;
    this.basis = null;
    this.faceY = null;
    sfx.wallTouch?.();
    this.game.events?.emit('grate.start', { mode: this.mode });
  }

  update(dt) {
    const P = this.P, c = this.cfg, inp = P.input, M = T.movement;
    this.snap = Math.min(1, this.snap + dt * 8);
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const ix = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    const fast = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    this.rushing = fast && (iz !== 0 || ix !== 0);
    const sp = c.speed * (fast ? c.fast : 1);
    const wish = P.wishDir();

    if (inp.isDown('KeyC') && this.t > 0.15) {
      P.vel.set(this.mode === 'wall' ? this.n.x * 1.2 : 0, -1, this.mode === 'wall' ? this.n.z * 1.2 : 0);
      this.cool = 0.3; this.rushing = false;
      this.mgr.get('latch').cool = 0.6; // (a drop, not a latch on the wall)
      return false;
    }
    if (P.latch('Space')) {
      if (this.mode === 'wall') P.vel.set(this.n.x * c.kickOut, c.kickUp, this.n.z * c.kickOut);
      else P.vel.set(wish.x * 4, 2.5, wish.z * 4);
      P.grounded = false;
      P.jumpFx(0.5);
      sfx.airJump();
      this.cool = 0.35; this.rushing = false;
      return false;
    }

    const w = this.wallProbe(0.9);
    const cl = this.ceilProbe(2.6);
    // moving between a wall and an overhang (up a wall and on out under the roof it meets; or
    // along a roof and down the wall at its end)
    this.modeT += dt;
    const setMode = (m) => {
      if (m === 'ceil' && this.mode === 'wall') { this.basis = Math.atan2(this.n.x, this.n.z); this.basisAt = P.yaw; } // (on: away from the wall, until you look elsewhere)
      if (m === 'wall') this.basis = null;
      this.mode = m; this.modeT = 0;
    };
    if (this.mode === 'wall') {
      if (!w) {
        if (cl) setMode('ceil'); else { P.vel.set(this.n.x * 1.5, Math.min(P.vel.y, 0), this.n.z * 1.5); this.cool = 0.3; this.rushing = false; return false; }
      } else if (iz > 0 && cl && cl.y - (P.pos.y + 1.95) < 0.3 && this.modeT > 0.3) setMode('ceil');
    } else if (this.mode === 'ceil') {
      if (!cl) {
        if (w) { this.n = w.n.clone(); setMode('wall'); } else { P.vel.set(P.vel.x, -1, P.vel.z); this.cool = 0.4; this.rushing = false; return false; }
      } else if (w && this.modeT > 0.8 && !this.basis && -(wish.x * w.n.x + wish.z * w.n.z) > 0.5 && w.dist < 0.6) { this.n = w.n.clone(); setMode('wall'); }
    }
    if (this.mode === 'wall' && w) this.n.lerp(w.n, Math.min(1, 12 * dt)).normalize();
    if (this.mode === 'ceil' && cl) this.cy = cl.y;

    if (this.mode === 'wall') {
      const n = this.n, along = new THREE.Vector3(-n.z, 0, n.x);
      const vx = -ix * sp, vy = iz * sp;
      if (iz > 0 && P.tryMantle(M.mantleMin, 0)) { this.rushing = false; return false; } // (over the top edge)
      const pull = ((w ? w.dist : 0.42) - 0.02 - 0.42) * 10;
      P.vel.set(along.x * vx - n.x * pull, vy, along.z * vx - n.z * pull);
      P.move(dt);
      P.bodyYaw = Math.atan2(-n.x, -n.z);
      this.move = Math.hypot(vx, vy);
      this.phase += this.move * dt * 1.1;
      if (P.grounded && vy <= 0 && this.t > 0.25) { this.rushing = false; this.cool = 0.25; return false; }
      return true;
    }
    // hanging from an overhang: crawl any way, facing the way you look
    let yaw = P.yaw;
    if (this.basis != null) {
      let d = P.yaw - this.basisAt; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) < 0.5) yaw = this.basis; else this.basis = null;
    }
    const f = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), r = new THREE.Vector3(-f.z, 0, f.x).negate();
    const v = new THREE.Vector3().addScaledVector(f, iz).addScaledVector(r, ix);
    if (v.lengthSq() > 1) v.normalize();
    v.multiplyScalar(sp);
    const target = this.cy - DROP;
    P.vel.set(v.x, (target - P.pos.y) * 12 * this.snap, v.z);
    P.move(dt);
    P.bodyYaw = yaw;
    this.faceY = yaw;
    this.move = v.length();
    this.phase += this.move * dt * 1.1;
    this.mv = v;
    if (P.grounded && this.t > 0.3) { this.rushing = false; this.cool = 0.25; return false; }
    return true;
  }

  end() { this.rushing = false; }

  faceYaw() { return this.mode === 'wall' && this.n ? Math.atan2(-this.n.x, -this.n.z) : (this.faceY ?? this.P.yaw); }

  animate(ch, base) {
    const p = ch.clips.sample('jumpLoop', 0.35, ch.P.tmp);
    ch.clips.blend(base, p, this.w);
  }

  hands(ch) {
    if (!this.active || this.w < 0.05) return;
    const P = this.P, w = this.w, ph = this.phase * 3;
    const y = P.renderPos.y;
    const on = this.mode === 'wall' ? this.n : null;
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1, alt = Math.sin(ph + (s === 'L' ? 0 : Math.PI));
      if (!(s === 'R' && ch.gunHeld)) {
        let p, q;
        if (on) {
          const along = new THREE.Vector3(-on.z, 0, on.x);
          p = P.renderPos.clone().addScaledVector(on, -0.42).addScaledVector(along, sg * 0.24).setY(y + 1.6 + alt * 0.1);
          q = ch.handQuat(ch.arm[s], new THREE.Vector3(0, 1, 0), on.clone().negate());
        } else {
          const fy = this.faceY ?? P.yaw;
          const face = new THREE.Vector3(Math.sin(fy), 0, Math.cos(fy)), right = new THREE.Vector3(face.z, 0, -face.x);
          p = P.renderPos.clone().addScaledVector(right, -sg * 0.22).addScaledVector(face, alt * 0.14 * Math.min(1, (this.move || 0))).setY(this.cy - 0.09);
          q = ch.handQuat(ch.arm[s], face, new THREE.Vector3(0, -1, 0));
        }
        p.sub(ch.arm[s].palmPt.clone().applyQuaternion(q));
        ch.reachHand(s, p, q, w);
      }
      if (on) { // feet on the grate
        const along = new THREE.Vector3(-on.z, 0, on.x);
        const leg = ch.leg[s];
        const t = P.renderPos.clone().addScaledVector(on, -0.42).addScaledVector(along, sg * 0.14).setY(y + 0.35 - alt * 0.12 + (s === 'L' ? 0.1 : 0));
        t.y += ch.ankleRest * 0.5;
        t.lerp(leg.foot.getWorldPosition(new THREE.Vector3()), 1 - w);
        ch.solveLeg(leg, t, leg.thigh.getWorldPosition(new THREE.Vector3()).addScaledVector(on, -0.7));
      }
    }
  }

  label() { return this.mode === 'wall' ? 'GRATE' : 'GRATE · OVERHEAD'; }
}
