import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T, PALETTE } from '../config.js';
import { addOutline } from '../outline.js';

// ---------------------------------------------------------------------------------------
// THE SOLAR SURFER. A hover-board with a light-sail (after the one in Treasure Planet): you stand
// on it sideways, hold the boom, and the wind does the rest. It rides a little above the sand,
// follows the dunes, and leaves them at the crests.
//
//   A / D   steer (quick at low speed, calmer at high)
//   W / S   trim the sail in (a faster cruise) / let it out and brake
//   Shift   solar flare: the sail blazes, top speed and acceleration jump, for Lachryma
//   Space   hold to crouch the springs, release to hop. In the air A / D spin the board: land a
//           spin for a burst of speed
//   C       drift: hold it in a turn, and a long one pays out as a burst when you let go
//   (the psygun is stowed while you ride)
//   Y       stow / summon the board (in the dunes only). You are on it when you arrive.
//
// The wind (dunes.wind, which wanders and gusts) shapes the speed the board settles at by a sailing
// polar: across it is quickest, dead upwind slowest, but you never stall. Gravity does its own
// work on the slopes: down a lee face is the fastest anything goes here.
// The board itself, the sail cloth and the rider's stance are all built here.
// ---------------------------------------------------------------------------------------
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
const clamp = THREE.MathUtils.clamp;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const POLAR = [[-1, 0.1], [-0.78, 0.2], [-0.45, 0.6], [0, 1.0], [0.5, 0.95], [1, 0.72]]; // efficiency by cos(angle between heading and where the wind goes)
const polar = (c) => {
  for (let i = 1; i < POLAR.length; i++) if (c <= POLAR[i][0]) { const [a, b] = [POLAR[i - 1], POLAR[i]]; return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); }
  return POLAR[POLAR.length - 1][1];
};
const SAIL_W = 15, SAIL_H = 12;

export class Surfer extends Tech {
  constructor(mgr) {
    super(mgr, 'surfer');
    this.overrides = 1;
    this.blendIn = 9;
    this.want = false;
    this.heading = 0;
    this.v = new THREE.Vector3(); // horizontal velocity
    this.air = false;
    this.roll = 0; this.pitch = 0; this.lean = 0;
    this.trim = 0.6; this.sailA = 0.6;
    this.n = UP.clone();
    this.spin = 0; this.charge = 0; this.spaceWas = false;
    this.steer = 0; this.drift = 0; this.driftT = 0; this.driftDir = 1;
    this.mouseIdle = 0;
    this.boosting = 0; this.speed = 0; this.airT = 0;
    this.buildBoard();
    this.buildVane();
  }

  get dunes() { return this.game.dunes; }
  /** Both hands are on the boom: the psygun is stowed and cannot be fired while riding. */
  get handsBusy() { return true; }
  get blocksFire() { return true; }

  /** A small wind vane on the HUD: the arrow is where the wind goes, against the way you face; the ring is how full the sail is. */
  buildVane() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 120;
    Object.assign(cv.style, { position: 'fixed', left: '24px', bottom: '116px', width: '60px', height: '60px', pointerEvents: 'none', display: 'none', zIndex: 5 });
    document.body.appendChild(cv);
    this.vane = cv;
  }

  drawVane() {
    const cv = this.vane, c = cv.getContext('2d'), W = this.dunes.wind;
    c.clearRect(0, 0, 120, 120);
    const eff = eff01(this);
    c.lineWidth = 6; c.strokeStyle = 'rgba(60,30,20,0.55)';
    c.beginPath(); c.arc(60, 60, 50, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = eff > 0.6 ? '#ffd28a' : eff > 0.3 ? '#e8ab86' : '#b86a5a';
    c.beginPath(); c.arc(60, 60, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.03, eff)); c.stroke();
    // the arrow: up = the way we face; it points where the wind goes
    const a = wrap(Math.atan2(W.dir.x, W.dir.y) - this.heading); // 0 = following wind
    c.save(); c.translate(60, 60); c.rotate(-a);
    c.fillStyle = '#fff1dc'; c.beginPath(); c.moveTo(0, -30); c.lineTo(13, 6); c.lineTo(0, -2); c.lineTo(-13, 6); c.closePath(); c.fill();
    c.restore();
  }

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
    this.air = true; this.spin = 0;
    this.board.visible = true;
    this.vane.style.display = 'block';
    this.game.hud.el.cross && (this.game.hud.el.cross.style.display = 'none'); // (no gun, no reticle)
    this.sfxLoop = sfx.surfLoop?.();
    this.game.events?.emit('surf.start', {});
  }

  end() {
    this.board.visible = false;
    this.vane.style.display = 'none';
    this.game.hud.el.cross && (this.game.hud.el.cross.style.display = '');
    this.sfxLoop?.stop(); this.sfxLoop = null;
    const P = this.P;
    P.vel.x = this.v.x * 0.5; P.vel.z = this.v.z * 0.5;
  }

  // ------------------------------------------------------------------ the ride
  // Feel, after what arcade riders and karts do (Sonic Riders: acceleration is automatic and the
  // meter is for boosts, tricks pay back; the sphere-and-body arcade vehicles: speed-scaled steering,
  // grip you can loosen to drift, side slip handed back as forward speed when the drift ends;
  // Wipeout-style brakes). The wind still matters, but as a modifier of the speed you settle at
  // (a beam reach is quickest, dead upwind is slowest), never as something that can stall you.
  update(dt) {
    const g = this.game, P = this.P, c = this.cfg, inp = P.input, D = this.dunes, W = D.wind;
    if (!D.active) { this.want = false; return false; }
    if (P.latch('KeyY')) { this.want = false; return false; }
    const steerIn = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    const trimIn = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const flare = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    this.steer = THREE.MathUtils.damp(this.steer, steerIn, c.steerRamp, dt);
    const steer = this.steer;

    const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const r = _v2.set(-Math.cos(this.heading), 0, Math.sin(this.heading));
    let vf = this.v.dot(f), vl = this.v.dot(r);
    const speed0 = Math.hypot(vf, vl);

    // ---- the sail sets the speed the board settles at
    this.trim = THREE.MathUtils.damp(this.trim, clamp(0.62 + trimIn * 0.38, 0.06, 1), 5, dt);
    const wgo = _v3.set(W.dir.x, 0, W.dir.y); // where the wind goes
    const ang = wrap(Math.atan2(wgo.x, wgo.z) - this.heading); // 0 = it blows the way we face
    const windF = c.windLo + (c.windHi - c.windLo) * polar(Math.cos(ang)) * (0.85 + 0.15 * W.gust);
    const trimF = trimIn > 0 ? c.trimIn : trimIn < 0 ? c.trimOut : 1;
    this.boosting = Math.max(0, this.boosting - dt * 2.5); // (a drift boost fades out; the flare holds it up)
    let target = c.cruise * windF * trimF;
    let accel = c.accel;
    if (flare && g.lachryma.drain(c.boostCost * dt, 'surf') > 0) { target *= c.boostMult; accel = c.boostAccel; this.boosting = 1; }
    else if (this.boosting > 0.05) { target *= 1 + (c.boostMult - 1) * this.boosting * 0.5; accel = c.boostAccel * 0.6; }
    if (vf < target) vf = Math.min(target, vf + accel * dt);
    else vf = Math.max(target, vf - (trimIn < 0 ? c.brake : c.coast) * dt); // (speed from a slope is kept a while)
    if (this.air) vf *= Math.exp(-0.015 * dt);

    // ---- drift: hold C while steering. The keel lets go, the turn tightens, and a long enough
    // drift pays out as a burst when you let go.
    const drifting = !this.air && inp.isDown('KeyC') && Math.abs(steer) > 0.25 && speed0 > c.driftMinSpeed;
    if (drifting) { this.driftT += dt; this.driftDir = Math.sign(steer); }
    else if (this.driftT > 0) {
      if (this.driftT >= c.driftMin) {
        const gain = c.driftBoost * Math.min(1.5, this.driftT / c.driftMin);
        vf += gain + Math.abs(vl) * 0.5; vl *= 0.3;
        this.boosting = 1;
        g.hud.popup('DRIFT BOOST');
        g.events?.emit('surf.drift', { t: this.driftT });
        sfx.parry?.();
      }
      this.driftT = 0;
    }
    this.drift = THREE.MathUtils.damp(this.drift, drifting ? 1 : 0, 12, dt);
    const grip = THREE.MathUtils.lerp(c.grip, c.driftGrip, this.drift) * (this.air ? 0.15 : 1);
    vl *= Math.exp(-grip * dt);
    vl += wgo.dot(r) * W.speed * 0.03 * dt; // (a little leeway)

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

    // ---- steering: a quick turn that eases off with speed (the drift turns tighter still)
    const speedFrac = clamp(this.v.length() / c.maxSpeed, 0, 1);
    const rate = THREE.MathUtils.lerp(c.turn, c.turnFast, speedFrac) * (1 + (c.driftTurn - 1) * this.drift) * (this.air ? 0.55 : 1);
    if (!this.air || Math.abs(steer) > 0.05) this.heading -= steer * rate * dt;
    if (this.air) this.spin += -steer * 7.5 * dt; else this.spin *= Math.exp(-6 * dt);
    if (this.v.length() > c.maxSpeed) this.v.setLength(c.maxSpeed);

    // ---- hop: hold Space to crouch the springs (a tap is a hop), let go to launch
    const sp2 = inp.isDown('Space');
    if (sp2 && !this.air) this.charge = Math.min(1, this.charge + dt / c.hopTime);
    if (!sp2 && this.spaceWas && !this.air) {
      P.vel.y = c.hop + c.hopCharge * this.charge;
      this.v.addScaledVector(f, 1.5 + 2 * this.charge);
      this.air = true; this.spin = 0; this.airT = 0;
      sfx.airJump();
      g.events?.emit('surf.hop', {});
    }
    if (!sp2) this.charge = Math.max(0, this.charge - dt * 4);
    this.spaceWas = sp2;

    // ---- height: hover over the sand, follow it with a little lag (that is what makes a crest a launch)
    const target2 = gy + c.hover + 0.1;
    const gap = P.pos.y - target2;
    const vyT = -(this.n.x * this.v.x + this.n.z * this.v.z) / Math.max(0.2, this.n.y);
    if (!this.air) {
      // (follow the slope's own rise, and let the hover spring pull the gap shut)
      P.vel.y = THREE.MathUtils.damp(P.vel.y, vyT, c.follow, dt) - gap * 60 * dt;
      if (gap > 0.85 || (gap > 0.25 && P.vel.y > vyT + 5)) { this.air = true; this.spin = 0; this.airT = 0; }
    } else {
      P.vel.y -= c.gravity * dt;
      this.airT += dt;
      if (gap <= 0.12 && P.vel.y <= 0.5) this.land(vyT);
    }
    if (this.v.length() > c.maxSpeed) this.v.setLength(c.maxSpeed); // (hops, tricks and boosts all end up under the same cap)
    P.vel.x = this.v.x; P.vel.z = this.v.z;

    // ---- go (walls and ruins stop it)
    const before = P.pos.clone();
    P.move(dt);
    const moved = _v3.set((P.pos.x - before.x) / dt, 0, (P.pos.z - before.z) / dt);
    if (moved.length() < this.v.length() * 0.55 && this.v.length() > 3) {
      if (this.v.length() > 8) { sfx.thunk?.(1.2, 3); g.fx?.impact?.(P.pos.clone().setY(P.pos.y), UP, { sparks: 8, dust: 12 }); P.shake = Math.max(P.shake, 0.25); }
      this.v.copy(moved).multiplyScalar(0.8);
    }
    // never below the sand
    const gy2 = D.heightAt(P.pos.x, P.pos.z);
    if (P.pos.y < gy2 + 0.35) { P.pos.y = gy2 + 0.35; if (P.vel.y < 0) P.vel.y = 0; }
    P.grounded = !this.air;
    P.bodyYaw = this.faceYaw();

    // ---- the camera swings round behind where the board goes, unless you are looking about
    if (P.input.dx || P.input.dy) this.mouseIdle = 0; else this.mouseIdle += dt;
    if (this.mouseIdle > 0.45 && this.v.length() > 4) P.yaw += wrap(this.heading - P.yaw) * Math.min(1, dt * 3.2);

    // lean of the board itself: into the turn, and out of a drift
    const speed = this.v.length();
    const wantRoll = clamp(-steer * 0.5 * clamp(speed / 14, 0.25, 1), -0.55, 0.55) + (this.air ? 0 : -vl * 0.03) - this.driftDir * this.drift * 0.15;
    this.roll = THREE.MathUtils.damp(this.roll, wantRoll, 9, dt);
    this.speed = speed;
    if (this.sfxLoop) this.sfxLoop.set(clamp(speed / c.maxSpeed, 0, 1), this.boosting, this.air ? 1 : 0);
    this.emitFx(dt);
    g.events?.emit('surf.tick', { speed });
    return true;
  }

  land(vyT) {
    const P = this.P, g = this.game, c = this.cfg;
    const impact = -P.vel.y;
    this.air = false;
    P.vel.y = vyT * 0.6;
    if (impact > 3) { sfx.thunk?.(0.6, 3); g.fx?.impact?.(P.pos.clone().setY(P.pos.y - 0.6), UP, { sparks: 0, dust: 12 }); }
    // a landed spin is a trick
    const turns = Math.abs(this.spin) / (Math.PI * 2);
    if (Math.abs(this.spin) > 2.6 && Math.abs(Math.sin(this.spin / 2)) < 0.45 + 0.4) {
      const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
      this.v.addScaledVector(f, 3 + 2 * turns);
      g.hud.popup(turns > 1.4 ? 'DOUBLE SPIN' : 'SPIN');
      g.events?.emit('surf.trick', { turns });
      sfx.parry?.();
    }
    this.spin = 0;
  }

  /** The engine's glow: warm motes off the stern (the sand spray and the trail are marks.js). */
  emitFx(dt) {
    const fx = this.game.fx, P = this.P;
    if (!fx) return;
    const sp = this.speed, f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    if (Math.random() < dt * (10 + this.boosting * 30 + this.drift * 20)) {
      const hot = this.boosting > 0.3 || this.drift > 0.5;
      fx.add.emit({ pos: P.pos.clone().addScaledVector(f, -1.1).setY(P.pos.y - 0.3), vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.2 + Math.random(), (Math.random() - 0.5) * 0.8).addScaledVector(f, -sp * 0.1), life: 0.5, size: 0.06, sizeEnd: 0.01, color: new THREE.Color(hot ? 0xfff0c0 : 0xffc65c), drag: 1.5 });
    }
  }

  faceYaw() { return this.heading - 1.05; }

  // ------------------------------------------------------------------ the board itself
  buildBoard() {
    const board = new THREE.Group();
    board.name = 'SolarSurfer';
    // deck: a long lens with turned-up ends
    const shape = new THREE.Shape();
    const L = 1.15, Wd = 0.34;
    shape.moveTo(-L, 0);
    shape.bezierCurveTo(-L * 0.7, Wd * 1.05, L * 0.4, Wd * 1.15, L, 0);
    shape.bezierCurveTo(L * 0.4, -Wd * 1.15, -L * 0.7, -Wd * 1.05, -L, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 2, curveSegments: 14 });
    geo.rotateX(-Math.PI / 2); // (the shape's x is length, its y becomes -z; extruded upward)
    geo.rotateY(Math.PI / 2); // (length along +z)
    geo.translate(0, -0.06, 0);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xf3c9a8, roughness: 0.55, flatShading: true });
    const deck = new THREE.Mesh(geo, deckMat);
    deck.castShadow = true;
    addOutline(deck);
    board.add(deck);
    // a stripe and the up-turned nose
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 1.9), new THREE.MeshStandardMaterial({ color: PALETTE.mid, roughness: 0.6 }));
    stripe.position.set(0, 0.098, 0);
    board.add(stripe);
    // the emitter: a glow under it
    const emitMat = new THREE.MeshBasicMaterial({ color: 0xffc65c, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const emit = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), emitMat);
    emit.rotation.x = -Math.PI / 2; emit.position.y = -0.13; emit.scale.set(0.9, 1.6, 1);
    board.add(emit);
    this.emit = emit;
    // the rig: mast at the nose end of the deck; the sail turns about it
    const rig = new THREE.Group();
    rig.position.set(0, 0.1, 0.5);
    const mastMat = new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.6, flatShading: true });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 3.2, 6), mastMat);
    mast.position.y = 1.6;
    mast.castShadow = true;
    addOutline(mast);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.9, 6), mastMat);
    boom.rotation.x = Math.PI / 2; boom.position.set(0, 1.05, -0.95);
    boom.castShadow = true;
    rig.add(mast, boom);
    // the sail: a lateen of gold light
    const sg = new THREE.PlaneGeometry(1, 1, SAIL_W, SAIL_H);
    const sailMat = new THREE.MeshBasicMaterial({ color: 0xffd69a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, vertexColors: true });
    const cols = new Float32Array(sg.attributes.position.count * 3);
    sg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const sail = new THREE.Mesh(sg, sailMat);
    sail.frustumCulled = false;
    sail.renderOrder = 4;
    rig.add(sail);
    this.sail = sail; this.sailMat = sailMat;
    // the ribs, a few thin lines of light along it
    const ribGeo = new THREE.BufferGeometry();
    ribGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 2 * 5), 3));
    const ribs = new THREE.LineSegments(ribGeo, new THREE.LineBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, fog: false }));
    ribs.frustumCulled = false;
    rig.add(ribs);
    this.ribs = ribs;
    board.add(rig);
    this.rig = rig;
    board.visible = false;
    this.game.scene.add(board);
    this.board = board;
    this.sailT = 0;
    this.sailPts = new Float32Array(sg.attributes.position.count * 3);
  }

  /** Per frame: the board's own pose and the sail cloth (the rider follows it). */
  tick(dt) {
    const P = this.P, D = this.dunes;
    this.sailT += dt;
    if (!this.board.visible) return;
    this.drawVane();
    const c = this.cfg, W = D.wind;
    // frame: heading, terrain normal, roll
    const pos = P.renderPos;
    const n = this.air ? UP.clone().lerp(this.n, 0.3).normalize() : this.n;
    const fwdFlat = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = _v2.crossVectors(n, fwdFlat).normalize();
    const fwd = _v3.crossVectors(right, n).normalize();
    // (crossVectors(n, fwd) = the board's right when looking down; keep a right-handed basis: x = right of travel)
    const bx = right.clone().negate(), by = n.clone(), bz = fwd.clone();
    _m.makeBasis(bx, by, bz);
    const q = _q.setFromRotationMatrix(_m);
    // roll (lean into the turn) about the forward axis, and the spin
    const rq = new THREE.Quaternion().setFromAxisAngle(bz, this.roll);
    const sq = new THREE.Quaternion().setFromAxisAngle(UP, this.spin);
    const pitchAir = this.air ? clamp(-P.vel.y * 0.03, -0.5, 0.5) : 0;
    const pq = new THREE.Quaternion().setFromAxisAngle(bx, pitchAir);
    this.board.quaternion.copy(sq).multiply(rq).multiply(pq).multiply(q);
    const crouch = this.charge * 0.18;
    this.board.position.set(pos.x, pos.y - 0.14 - crouch * 0.4, pos.z);
    this.emit.material.opacity = 0.35 + 0.25 * Math.min(1, (this.speed || 0) / 20) + this.boosting * 0.4 + (this.air ? -0.15 : 0);
    // the sail turns out to leeward and fills
    const wgo = _v.set(W.dir.x, 0, W.dir.y);
    const ang = wrap(Math.atan2(wgo.x, wgo.z) - this.heading);
    const lateral = wgo.dot(_v2.set(-Math.cos(this.heading), 0, Math.sin(this.heading))); // + = the wind pushes to the board's right
    const side = lateral >= 0 ? 1 : -1;
    const out = THREE.MathUtils.lerp(1.3, 0.16, Math.pow(Math.min(1, Math.abs(ang) / Math.PI), 0.8)) * (0.35 + 0.65 * (1 - this.trim));
    this.sailA = THREE.MathUtils.damp(this.sailA, side * out, 6, dt);
    this.rig.rotation.y = this.sailA; // (rotates the boom out from dead aft)
    // the cloth: a lateen triangle, billowing away from the wind
    this.updateSail(dt, side, Math.min(1, eff01(this)));
    this.sailMat.opacity = 0.42 + 0.2 * (this.trim) + this.boosting * 0.3;
    this.sailMat.color.setHex(this.boosting ? 0xfff0c8 : 0xffd69a);
  }

  updateSail(dt, side, fill) {
    const g = this.sail.geometry, pos = g.attributes.position, col = g.attributes.color;
    const t = this.sailT, flap = 1 - fill * 0.8;
    const belly = (0.12 + 0.5 * fill) * (this.boosting ? 1.3 : 1);
    let i = 0;
    const foot = 0.25, height = 2.8;
    for (let jy = 0; jy <= SAIL_H; jy++) {
      const v = jy / SAIL_H;
      const chord = 1.9 * Math.pow(1 - v, 0.85) + 0.06; // (the boom is the foot; the sail narrows to the head)
      for (let ix = 0; ix <= SAIL_W; ix++, i++) {
        const u = ix / SAIL_W;
        const x = 0.0, yy = foot + 0.8 + v * height * 0.95;
        // the luff along the mast (u = 0), the leech aft (u = 1); the belly bulges to leeward
        const zAft = -u * chord;
        const bulge = Math.sin(Math.PI * u) * belly * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, v * 1.25))) * side;
        const ripple = (Math.sin(t * 9 + u * 7 + v * 5) * 0.03 + Math.sin(t * 5.3 + u * 4) * 0.02) * (0.3 + flap) * u;
        pos.setXYZ(i, bulge * 0.55 + ripple * side, yy - 0.75 - (1 - Math.min(1, v * 2)) * 0.0, zAft);
        const edge = Math.min(u, 1 - u, v, 1 - v);
        const b = 0.45 + 0.55 * (1 - Math.min(1, edge * 6)) ;
        col.setXYZ(i, b, b * 0.92, b * 0.78);
      }
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    // ribs
    const rp = this.ribs.geometry.attributes.position;
    for (let k = 0; k < 5; k++) {
      const v = (k + 1) / 6, chord = 1.9 * Math.pow(1 - v, 0.85) + 0.06, yy = foot + 0.8 + v * height * 0.95 - 0.75;
      rp.setXYZ(k * 2, 0, yy, 0);
      rp.setXYZ(k * 2 + 1, belly * 0.55 * 0.5 * side, yy, -chord * 0.98);
    }
    rp.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the rider
  animate(ch, base, dt) {
    const C = ch.clips;
    // a low, sideways stance: the crouch, sunk a little more with the springs
    const crouch = C.sample('crouchIdle', 0.3, ch.P.tmp);
    C.blend(base, crouch, this.w * clamp(0.4 + 0.3 * this.drift + 0.3 * this.charge, 0, 1));
  }

  /** Lean the body into the turn and with the slope. */
  afterPose(ch) {
    if (this.w < 0.01) return;
    const B = ch.bones;
    const f = _v.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const lean = this.roll * 0.9 * this.w;
    for (const [b, k] of [['spine001', 0.3], ['spine002', 0.35], ['spine003', 0.35]]) ch.rotW(B[b], f, lean * k);
    ch.root.updateMatrixWorld(true);
  }

  /** Feet on the deck, one ahead of the other; a hand on the boom (the gun hand stays with the gun). */
  hands(ch) {
    if (!this.active || this.w < 0.05 || !this.board.visible) return;
    const w = this.w;
    this.board.updateMatrixWorld(true);
    const dir = (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(this.board.matrixWorld);
    // feet: the clip's own stance, only set down onto the deck along the board's up (a correction, not a pose)
    const up = dir(0, 1, 0), origin = _v3.set(0, 0, 0).applyMatrix4(this.board.matrixWorld).clone();
    for (const s of ['L', 'R']) {
      const leg = ch.leg[s];
      const cur = leg.foot.getWorldPosition(new THREE.Vector3());
      const off = cur.clone().sub(origin).dot(up) - (0.13 + ch.ankleRest * 0.55);
      if (Math.abs(off) < 1e-3) continue;
      const knee = leg.shin.getWorldPosition(new THREE.Vector3());
      ch.solveLeg(leg, cur.addScaledVector(up, -off * w), knee);
    }
    // hands on the boom: the boom runs aft from the mast, swung out by the sail
    this.rig.updateMatrixWorld(true);
    const boomAt = (d) => _v3.set(0, 1.05, -d).applyMatrix4(this.rig.matrixWorld).clone();
    for (const [s, d] of [['L', 0.5], ['R', 1.15]]) {
      const arm = ch.arm[s];
      const q = ch.handQuat(arm, dir(0, 0, -1), new THREE.Vector3(0, 1, 0));
      const p = boomAt(d).sub(arm.palmPt.clone().applyQuaternion(q));
      ch.reachHand(s, p, q, w);
    }
  }

  camera(fp, pivot) {
    if (!this.active || this.w < 0.05) return;
    // look a little ahead of where the board goes
    // (and stand off further than on foot: the sail wants room)
    _v.set(Math.sin(this.P.yaw), 0, Math.cos(this.P.yaw));
    pivot.addScaledVector(_v, (clamp((this.speed || 0) * 0.04, 0, 1.2) - 3.2) * this.w);
    pivot.y += 0.75 * this.w;
  }

  label() { return `SURF ${Math.round((this.speed || 0) * 3.6)} km/h${this.boosting ? ' · FLARE' : ''}`; }
}

/** How full the sail is: the polar's efficiency at the current heading and trim (for the cloth). */
function eff01(s) {
  const W = s.dunes.wind;
  const wgo = new THREE.Vector3(W.dir.x, 0, W.dir.y);
  const ang = wrap(Math.atan2(wgo.x, wgo.z) - s.heading);
  return polar(Math.cos(ang)) * (0.4 + 0.6 * s.trim);
}
