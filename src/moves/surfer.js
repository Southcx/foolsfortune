import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';
import { Skiff, SKIFF } from '../skiff.js';
import { Wake } from '../wake.js';

// ---------------------------------------------------------------------------------------
// THE SOLAR SURFER, after the King of Red Lions in The Wind Waker, with a little acrobatics on top.
//
// How Wind Waker sails, and what was taken (see also skiff.js and wake.js):
//   - The boat is driven by the wind alone. A tailwind is fastest; against the wind it is slow and
//     hard; and you can raise the sail or put it away, so the boat can sit still. (Wind Waker HD's
//     "Swift Sail" turns the wind to where you face; here the wind is fixed and shown by an arrow in the
//     world beside the stern, as in the game.)
//   - The sail is a thing you manage: hoisted with a pull (A in the game), and "sail pumping", lowering
//     and raising it again, gives a burst of speed each time (about 70 units against 55 for plain sailing).
//   - The boom swings to leeward, wider the more the wind is behind you; the sail bellies and luffs.
//   - The wake: crisp white bubbles at the bow and a V of white lines and a paler band behind.
//
//   W (hold)  hoist the sail; it stays up. How far up is how much you sail: half up is half speed
//   S (hold)  let it down, and brake. Hoist again quickly and it is a PUMP: a burst of speed
//   A / D     steer (the board can turn on the spot, and carves at speed)
//   Space     hold to crouch the springs, release to hop. In the air A / D spin the whole skiff, rider and
//             all: land a whole turn square for a boost
//   Shift     solar flare: the emblem blazes and top speed and acceleration jump, for Lachryma
//   Y         stow / summon the board. The psygun is stowed while you ride.
//
// The rider and the skiff are one rigid unit: one quaternion (heading, then the sand's slope, then
// lean and spin) turns the skiff and, through character.js, the rider standing on it; the rider is
// animated with clips authored for it (surfclips.js) rather than solved onto the deck.
// ---------------------------------------------------------------------------------------
const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qC = new THREE.Quaternion(), qFace = new THREE.Quaternion().setFromAxisAngle(UP, -Math.PI / 2);
const clamp = THREE.MathUtils.clamp, damp = THREE.MathUtils.damp;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// how much of the wind's push the sail uses, by cos(angle between the heading and where the wind goes): 1 dead downwind .. -1 into it
const POLAR = [[-1, 0.28], [-0.6, 0.42], [-0.2, 0.7], [0.2, 0.92], [0.7, 1.0], [1, 1.0]];
const polar = (c) => {
  for (let i = 1; i < POLAR.length; i++) if (c <= POLAR[i][0]) { const [a, b] = [POLAR[i - 1], POLAR[i]]; return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); }
  return 1;
};

export class Surfer extends Tech {
  constructor(mgr) {
    super(mgr, 'surfer');
    this.overrides = 1;
    this.blendIn = 9;
    this.want = false;
    this.heading = 0;
    this.v = new THREE.Vector3(); // horizontal velocity
    this.air = false;
    this.L = 0; // how far the sail is hoisted
    this.hoistDir = 0; this.pumpReady = true; this.pumpFresh = true;
    this.steer = 0; this.roll = 0; this.spin = 0; this.spinRest = 0; this.charge = 0; this.spaceWas = false;
    this.boomSign = 1; this.boom = 0.6; this.fill = 0;
    this.boosting = 0; this.speed = 0; this.airT = 0; this.landDip = 0;
    this.mouseIdle = 0;
    this.n = UP.clone(); this.nS = UP.clone();
    this.time = 0; this.animT = 0;
    this.airW = 0; this.brakeW = 0; this.hoistW = 0;
    this.unit = null; // the rigid frame the rider is placed in: { pos, quat }
    this.poses = null;
    const game = mgr.game;
    this.skiff = new Skiff(game.scene);
    this.wake = new Wake(game.scene, game.fx);
  }

  get dunes() { return this.game.dunes; }
  /** Both hands are on the sheet: the psygun is stowed and cannot be fired while riding. */
  get handsBusy() { return true; }
  get blocksFire() { return true; }
  get riding() { return this.active; }

  mount() { this.want = true; }
  stow() { this.want = false; }

  canStart() {
    const P = this.P;
    if (!this.dunes.active || P.mantle || P.freeze) return false;
    if (P.peekLatch('KeyY')) { P.latch('KeyY'); this.want = !this.want; if (!this.want) return false; }
    return this.want;
  }

  start() {
    const P = this.P;
    P.endCore?.();
    P.setShape('stand');
    this.heading = P.yaw;
    this.v.set(P.vel.x, 0, P.vel.z);
    this.air = true; this.spin = 0; this.spinRest = 0; this.airT = 0;
    this.L = this.v.length() > 6 ? 0.6 : 0; // (mounted on the move, the sail is already out; from a stand it is furled)
    this.hoistDir = 0; this.pumpReady = true; this.pumpFresh = true; this.steer = 0; this.roll = 0;
    this.nS.copy(UP);
    this.animT = 0;
    this.skiff.visible = true;
    this.wake.clear();
    this.game.hud.el.cross && (this.game.hud.el.cross.style.display = 'none'); // (no gun, no reticle)
    this.sfxLoop = sfx.surfLoop?.();
    this.game.events?.emit('surf.start', {});
  }

  end() {
    this.skiff.visible = false;
    this.wake.clear();
    this.unit = null;
    this.game.hud.el.cross && (this.game.hud.el.cross.style.display = '');
    this.sfxLoop?.stop(); this.sfxLoop = null;
    const P = this.P;
    P.vel.x = this.v.x * 0.5; P.vel.z = this.v.z * 0.5;
  }

  // ------------------------------------------------------------------ the ride (fixed step)
  update(dt) {
    const g = this.game, P = this.P, c = this.cfg, inp = P.input, D = this.dunes, W = D.wind;
    if (!D.active) { this.want = false; return false; }
    if (P.latch('KeyY')) { this.want = false; return false; }
    const steerIn = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    const hoistKey = inp.isDown('KeyW'), furlKey = inp.isDown('KeyS');
    const flare = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    this.steer = damp(this.steer, steerIn, 10, dt);

    // ---- the sail: hoisted with W, lowered with S (which also brakes); it stays where you leave it
    const wasL = this.L;
    if (furlKey) this.L = Math.max(0, this.L - dt / c.furlTime);
    else if (hoistKey) this.L = Math.min(1, this.L + dt / c.hoistTime);
    this.hoistDir = Math.sign(this.L - wasL);
    // ---- pumping: run it back up from nearly down and it kicks, as in Wind Waker
    let pump = 0;
    if (this.L < 0.4) this.pumpReady = true;
    if (this.L >= 0.999 && wasL < 0.999) {
      if (this.pumpReady && this.pumpFresh) { pump = c.pump; this.pumpReady = false; sfx.hoist?.(); g.events?.emit('surf.pump', {}); }
      this.pumpFresh = false;
    }
    if (this.L < 0.5) this.pumpFresh = true;

    const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const r = _v2.set(-Math.cos(this.heading), 0, Math.sin(this.heading)); // (to the boat's right)
    let vf = this.v.dot(f), vl = this.v.dot(r);
    const wgo = _v3.set(W.dir.x, 0, W.dir.y); // where the wind goes
    const windF = polar(wgo.dot(f)) * W.gust; // (cos 1: running before it)

    // ---- speed: the sail sets where the boat settles; it gets there by the sail's pull, coasts down otherwise
    this.boosting = Math.max(0, this.boosting - dt * 2.2);
    let target = c.cruise * this.L * windF, accel = c.accel * (0.45 + 0.55 * this.L);
    if (flare && g.lachryma.drain(c.boostCost * dt, 'surf') > 0) { target = Math.max(target, c.cruise * 0.55) * c.boostMult; accel = c.boostAccel; this.boosting = 1; }
    else if (this.boosting > 0.05) { target *= 1 + (c.boostMult - 1) * this.boosting; accel = c.boostAccel * 0.6; }
    if (vf < target) vf = Math.min(target, vf + accel * dt);
    else vf = Math.max(target, vf - (c.coast + 0.012 * vf * vf) * dt);
    if (furlKey && vf > 0) vf = Math.max(0, vf - c.brake * dt);
    vf += pump;
    if (target === 0 && vf < 0.15 && !this.air) vf = 0;
    if (this.air) vf *= Math.exp(-0.015 * dt);
    vl *= Math.exp(-c.grip * dt * (this.air ? 0.1 : 1));
    if (Math.abs(vl) < 0.02 && !this.air) vl = 0;

    // ---- slopes: gravity along the ground
    const gy = D.heightAt(P.pos.x, P.pos.z);
    D.normalAt(P.pos.x, P.pos.z, this.n);
    if (!this.air) {
      const gt = _v3.set(0, -T.physics.gravity, 0);
      gt.addScaledVector(this.n, -gt.dot(this.n));
      vf += gt.dot(f) * c.slopeGain * dt;
      vl += gt.dot(r) * c.slopeGain * dt * 0.5;
    }
    this.v.set(0, 0, 0).addScaledVector(f, vf).addScaledVector(r, vl);

    // ---- steering: it turns on the spot, and carves once it is moving (less so the faster it goes)
    const sp0 = this.v.length(), speedFrac = clamp(sp0 / c.maxSpeed, 0, 1);
    const rate = c.turn * (0.35 + 0.65 * clamp(sp0 / 7, 0, 1)) * (1 - 0.4 * speedFrac) * (this.air ? 0.3 : 1);
    this.heading -= this.steer * rate * dt;
    if (this.air) this.spin += -this.steer * 8 * dt;

    // ---- hop: hold Space to crouch the springs (a tap is a hop), let go to launch
    const sp2 = inp.isDown('Space');
    if (sp2 && !this.air) this.charge = Math.min(1, this.charge + dt / c.hopTime);
    if (!sp2 && this.spaceWas && !this.air) {
      P.vel.y = c.hop + c.hopCharge * this.charge;
      this.v.addScaledVector(f, 1.2 + 2 * this.charge);
      this.air = true; this.spin = 0; this.airT = 0;
      sfx.airJump();
      g.events?.emit('surf.hop', {});
    }
    if (!sp2) this.charge = Math.max(0, this.charge - dt * 4);
    this.spaceWas = sp2;

    // ---- height: hover over the sand, follow it with a little lag (that is what makes a crest a launch)
    const want = gy + c.hover + 0.1;
    const gap = P.pos.y - want;
    const vyT = -(this.n.x * this.v.x + this.n.z * this.v.z) / Math.max(0.2, this.n.y);
    if (!this.air) {
      P.vel.y = damp(P.vel.y, vyT, c.follow, dt) - gap * 60 * dt;
      if (gap > 0.85 || (gap > 0.25 && P.vel.y > vyT + 5)) { this.air = true; this.spin = 0; this.airT = 0; }
    } else {
      P.vel.y -= c.gravity * dt;
      this.airT += dt;
      if (gap <= 0.12 && P.vel.y <= 0.5) this.land(vyT);
    }
    if (this.v.length() > c.maxSpeed) this.v.setLength(c.maxSpeed);
    P.vel.x = this.v.x; P.vel.z = this.v.z;

    // ---- go (walls and ruins stop it)
    const before = P.pos.clone();
    P.move(dt);
    const moved = _v3.set((P.pos.x - before.x) / dt, 0, (P.pos.z - before.z) / dt);
    if (moved.length() < this.v.length() * 0.55 && this.v.length() > 3) {
      if (this.v.length() > 8) { sfx.thunk?.(1.2, 3); g.fx?.impact?.(P.pos.clone().setY(P.pos.y), UP, { sparks: 8, dust: 12 }); P.shake = Math.max(P.shake, 0.25); }
      this.v.copy(moved).multiplyScalar(0.8);
    }
    const gy2 = D.heightAt(P.pos.x, P.pos.z);
    if (P.pos.y < gy2 + 0.35) { P.pos.y = gy2 + 0.35; if (P.vel.y < 0) P.vel.y = 0; }
    P.grounded = !this.air;
    P.bodyYaw = this.heading;

    // ---- the camera swings round behind where the board goes, unless you are looking about
    if (P.input.dx || P.input.dy) this.mouseIdle = 0; else this.mouseIdle += dt;
    if (this.mouseIdle > 0.5 && this.v.length() > 4) P.yaw += wrap(this.heading - P.yaw) * Math.min(1, dt * 3);

    this.speed = this.v.length();
    // (the lean: into the turn, and out of a slide; roll about the boat's own long axis)
    const wantRoll = clamp(this.steer * 0.42 * clamp(this.speed / 12, 0.15, 1), -0.5, 0.5) + (this.air ? 0 : clamp(-vl * 0.03, -0.2, 0.2));
    this.roll = damp(this.roll, wantRoll, 9, dt);
    if (this.sfxLoop) this.sfxLoop.set(clamp(this.speed / c.maxSpeed, 0, 1), this.boosting, this.air ? 1 : 0);
    g.events?.emit('surf.tick', { speed: this.speed });
    return true;
  }

  land(vyT) {
    const P = this.P, g = this.game;
    const impact = -P.vel.y;
    this.air = false;
    P.vel.y = vyT * 0.6;
    this.landDip = clamp(impact / 9, 0.25, 1);
    if (impact > 3) { sfx.thunk?.(0.6, 3); g.fx?.impact?.(P.pos.clone().setY(P.pos.y - 0.6), UP, { sparks: 0, dust: 12 }); }
    // a spin is a trick when it lands square: a whole turn (or two) give or take a quarter of one. Anything
    // else that got well round is a wobble; either way what is left over unwinds as it lands.
    const TAU = Math.PI * 2, near = Math.round(this.spin / TAU), off = Math.abs(this.spin - near * TAU);
    if (Math.abs(near) >= 1 && off < 0.9) {
      const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
      this.v.addScaledVector(f, 3 + 2 * Math.abs(near));
      g.events?.emit('surf.trick', { turns: Math.abs(near) });
      sfx.parry?.();
    } else if (Math.abs(this.spin) > 2.2) { this.v.multiplyScalar(0.75); g.events?.emit('surf.wobble', { spin: Math.abs(this.spin) }); }
    this.spinRest = this.spin - near * TAU;
    this.spin = 0;
  }

  faceYaw() { return this.heading; }

  // ------------------------------------------------------------------ per frame: one frame for skiff and rider
  tick(dt) {
    const P = this.P, D = this.dunes;
    this.time += dt;
    if (!this.active) { this.skiff.visible = false; return; }
    this.animT += dt;
    this.landDip = Math.max(0, this.landDip - dt * 2.8);
    this.spinRest = damp(this.spinRest, 0, 14, dt);
    // the sand under it (smoothed, so the skiff settles onto a slope rather than snapping to each facet)
    this.nS.lerp(this.air ? UP : this.n, 1 - Math.exp(-dt * (this.air ? 3 : 10))).normalize();
    const pos = P.renderPos;
    // ---- the wind and the sail: boom to leeward, wider with the wind behind; it fills or it luffs
    const W = D.wind, wgo = _v.set(W.dir.x, 0, W.dir.y);
    const f = _v2.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const lateral = wgo.dot(_v3.set(-f.z, 0, f.x)); // (+: the wind pushes to the boat's right)
    if (Math.abs(lateral) > 0.12) this.boomSign = lateral > 0 ? 1 : -1;
    const cosA = clamp(wgo.dot(f), -1, 1), ang = Math.acos(cosA); // 0: running before it, pi: into it
    const out = THREE.MathUtils.lerp(1.3, 0.2, ang / Math.PI) * (0.55 + 0.45 * this.L);
    this.boom = damp(this.boom, this.boomSign * out, 5, dt);
    const fill = clamp((polar(cosA) - 0.3) / 0.7, 0, 1);
    this.fill = damp(this.fill, this.L * (this.L > 0.7 ? 1 : 0.6) * (0.25 + 0.75 * fill), 4, dt);
    this.skiff.set({ sail: this.L, side: -Math.sign(this.boom || 1), fill: this.fill, boom: this.boom, glow: this.boosting, t: this.time, speed: this.speed });
    // ---- one quaternion for the whole unit: heading, then the slope, then the lean and the pitch, with the spin about its own up
    qA.setFromAxisAngle(UP, this.heading + this.spin + this.spinRest);
    qB.setFromUnitVectors(UP, this.nS);
    const unitQ = qB.multiply(qA);
    qC.setFromAxisAngle(Z, this.roll + Math.sin(this.time * 30) * 0.02 * this.landDip);
    unitQ.multiply(qC);
    qC.setFromAxisAngle(X, this.air ? -clamp(P.vel.y * 0.035, -0.45, 0.45) : 0);
    unitQ.multiply(qC);
    // hover bob at rest: slow, small and local
    const bob = Math.sin(this.time * 1.7) * 0.025 * (1 - clamp(this.speed / 6, 0, 1));
    this.skiff.group.position.set(pos.x, pos.y + bob, pos.z);
    this.skiff.group.quaternion.copy(unitQ);
    this.skiff.group.updateMatrixWorld(true);
    // the rider stands on the deck, facing out over the starboard side: a rigid child of the unit
    this.unit = this.unit || { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    this.unit.pos.set(0, SKIFF.deck, SKIFF.rider.z).applyQuaternion(unitQ).add(this.skiff.group.position);
    this.unit.quat.copy(unitQ).multiply(qFace);
    // the wind arrow beside the stern, and the wake from the bow
    const right = _v3.set(-f.z, 0, f.x);
    this.skiff.placeArrow(_v.copy(pos).addScaledVector(f, -1.9).addScaledVector(right, 1.5).setY(D.heightAt(pos.x, pos.z) + 1.5), W.dir, W.speed / 10, this.time);
    const bow = _v.copy(pos).addScaledVector(f, SKIFF.half + 0.2);
    this.wake.update(dt, { bow, fwd: f, right, speed: this.speed, air: this.air, glow: this.boosting, ground: (x, z) => D.heightAt(x, z) });
  }

  // ------------------------------------------------------------------ the rider (authored clips, blended by what the board does)
  animate(ch, base, dt) {
    const C = ch.clips;
    this.poses = this.poses || { a: C.pose(), b: C.pose() };
    const A = this.poses.a, B = this.poses.b, t = this.animT;
    const spd = this.speed;
    this.airW = damp(this.airW, this.air ? 1 : 0, this.air ? 12 : 9, dt);
    const braking = this.P.input.isDown('KeyS') && spd > 2;
    this.brakeW = damp(this.brakeW, braking ? 1 : 0, 8, dt);
    this.hoistW = damp(this.hoistW, this.hoistDir > 0 && this.L < 0.999 ? 1 : this.hoistDir < 0 ? 0.6 : 0, 10, dt);
    C.sample('surfIdle', t, A);
    C.blend(A, C.sample('surfRide', t, B), smooth(1.5, 14, spd));
    if (this.brakeW > 0.01) C.blend(A, C.sample('surfBrake', t, B), this.brakeW);
    const crouch = Math.max(this.charge, this.landDip * 0.9);
    if (crouch > 0.01) C.blend(A, C.sample('surfCrouch', t, B), clamp(crouch, 0, 1));
    if (this.airW > 0.01) C.blend(A, C.sample('surfAir', t, B), this.airW);
    if (this.hoistW > 0.01) C.blend(A, C.sample('surfHoist', this.L * 1.6, B), this.hoistW);
    C.blend(base, A, this.w);
  }

  /** Once the body is posed: the sheet runs from the boom's end to the rider's high hand. */
  afterPose(ch) {
    if (this.w < 0.05 || !this.active) return;
    this.skiff.drawRope(this.game.scene, ch.arm.L.hand.getWorldPosition(_v));
  }

  camera(fp, pivot) {
    if (!this.active || this.w < 0.05) return;
    // stand off further than on foot: the sail wants room
    _v.set(Math.sin(this.P.yaw), 0, Math.cos(this.P.yaw));
    pivot.addScaledVector(_v, (clamp((this.speed || 0) * 0.04, 0, 1.2) - 3.8) * this.w);
    pivot.y += 1.5 * this.w;
  }

  label() { return `SAIL ${Math.round(this.L * 100)}% · ${Math.round((this.speed || 0) * 3.6)} km/h${this.boosting > 0.3 ? ' · FLARE' : ''}`; }
}
