import * as THREE from 'three';
import { RAPIER, GROUPS } from './physics.js';
import { T, DEG } from './config.js';
import { sfx } from './audio.js';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const HALF = 0.55, RADIUS = 0.3; // capsule: 1.7 m tall
const CENTER_Y = HALF + RADIUS;

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Player {
  constructor(physics, camera, input) {
    this.physics = physics;
    this.camera = camera;
    this.input = input;
    this.spawn = new THREE.Vector3(0, 0, -11.5);

    this.pos = this.spawn.clone(); // feet
    this.prevPos = this.pos.clone();
    this.renderPos = this.pos.clone();
    this.vel = new THREE.Vector3();
    this.yaw = 0; // view yaw; forward = (sin yaw, 0, cos yaw)
    this.pitch = 0;
    this.bodyYaw = 0;
    this.grounded = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.landed = 0;
    this.sprinting = false;

    this.view = 'tp';
    this.tpBlend = 1; // 1 = third person, 0 = first person
    this.shoulder = 1;
    this.shoulderBlend = 1;
    this.combatTimer = 0;
    this.camDist = T.camera.tpDistance;

    // movement actions
    this.sliding = false;
    this.slideT = 0;
    this.slideCd = 0;
    this.crouching = false;
    this.mantle = null; // { from, to, t }
    this.dashT = 0;
    this.dashCharges = 0;
    this.slideBuf = 0;
    this.dashBuf = 0;
    this.eyeDrop = 0;
    this.slideBlend = 0;
    this.mantleBlend = 0;
    this.dashBlend = 0;
    this.game = null; // set by main (Lachryma, fx, clappers)

    // recoil / shake
    this.punch = new THREE.Vector2(); // x = pitch, y = yaw (radians)
    this.punchV = new THREE.Vector2();
    this.shake = 0;
    this.fovPunch = 0;
    this.bobPhase = 0;

    const w = physics.world;
    this.body = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(this.pos.x, this.pos.y + CENTER_Y, this.pos.z));
    this.collider = w.createCollider(RAPIER.ColliderDesc.capsule(HALF, RADIUS).setCollisionGroups(GROUPS.player).setFriction(0), this.body);
    this.physics.register(this.collider, { type: 'player' });
    this.ctrl = w.createCharacterController(0.02);
    this.ctrl.setUp({ x: 0, y: 1, z: 0 });
    this.ctrl.setApplyImpulsesToDynamicBodies(true);
    this.ctrl.setCharacterMass(80);
    this.ctrl.enableSnapToGround(0.3);
    this.applyTuning();
  }

  applyTuning() {
    this.ctrl.enableAutostep(T.movement.stepHeight, 0.15, false);
    this.ctrl.setMaxSlopeClimbAngle(T.movement.maxSlope * DEG);
    this.ctrl.setMinSlopeSlideAngle((T.movement.maxSlope + 4) * DEG);
  }

  get fp() { return this.view === 'fp'; }
  forward(target = new THREE.Vector3()) { return target.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  right(target = new THREE.Vector3()) { return target.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); }

  respawn() {
    this.pos.copy(this.spawn);
    this.prevPos.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.yaw = this.bodyYaw = 0;
    this.pitch = 0;
    this.body.setTranslation({ x: this.pos.x, y: this.pos.y + CENTER_Y, z: this.pos.z }, true);
  }

  look(dt, adsT) {
    const inp = this.input;
    const k = 0.0022 * T.camera.sensitivity * THREE.MathUtils.lerp(1, T.camera.adsSensMult, adsT);
    this.yaw -= inp.dx * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - inp.dy * k, -85 * DEG, 85 * DEG);
    this.lookDX = inp.dx; this.lookDY = inp.dy;

    if (inp.wasPressed('KeyV')) this.view = this.fp ? 'tp' : 'fp';
    // edge-triggered actions are latched here (per frame) and consumed by the fixed step
    if (inp.wasPressed('KeyC')) this.slideBuf = 0.12;
    if (inp.wasPressed('ShiftLeft') || inp.wasPressed('ShiftRight')) this.dashBuf = 0.1;
    if (inp.wasPressed('KeyQ')) this.shoulder *= -1;
  }

  addRecoil(pitchDeg, yawDeg) {
    const perm = T.recoil.permanent;
    this.pitch = Math.min(85 * DEG, this.pitch + pitchDeg * DEG * perm);
    this.yaw += yawDeg * DEG * perm;
    this.punchV.x += pitchDeg * DEG * (1 - perm) * T.recoil.recoverSpeed * Math.E; // peak ≈ kick
    this.punchV.y += yawDeg * DEG * (1 - perm) * T.recoil.recoverSpeed * Math.E; // peak ≈ kick
    this.shake = Math.max(this.shake, T.recoil.shake);
    this.fovPunch = T.recoil.fovPunch;
  }

  fixedUpdate(dt, { adsT, wantsFire }) {
    const M = T.movement, inp = this.input;
    this.prevPos.copy(this.pos);
    this.slideBuf -= dt;
    this.dashBuf -= dt;
    this.slideCd -= dt;
    this.landT = (this.landT || 0) - dt;

    if (this.mantle) { this.stepMantle(dt); return; }
    if (this.freeze) { this.jumpBuf = this.slideBuf = this.dashBuf = 0; this.jumpHeldLast = true; } // trial countdown
    const live = this.freeze ? 0 : 1;

    const f = this.forward(_v), r = this.right(_v2);
    const ix = live * ((inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0));
    const iz = live * ((inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0));
    const wish = new THREE.Vector3().addScaledVector(f, iz).addScaledVector(r, ix);
    if (wish.lengthSq() > 1) wish.normalize();
    const wishDir = wish.clone();

    const hv = new THREE.Vector3(this.vel.x, 0, this.vel.z);
    const hs = hv.length();
    const crouchKey = inp.isDown('KeyC');

    // ---- slide: C while moving fast on the ground ----
    // (landing with C held and speed to spare chains straight into another slide)
    const wantSlide = this.slideBuf > 0 || (crouchKey && this.landT > 0);
    if (!this.sliding && wantSlide && this.grounded && hs > M.slideMinSpeed && this.slideCd <= 0) {
      this.sliding = true;
      this.slideT = 0;
      this.slideBuf = 0;
      hv.setLength(Math.max(hs, M.slideSpeed));
      sfx.slide?.();
    }
    this.crouching = crouchKey && this.grounded && !this.sliding;
    this.sprinting = inp.isDown('ShiftLeft') && iz > 0 && adsT < 0.3 && !wantsFire && !this.crouching;

    let jumped = false;
    // jumping with coyote time + input buffer (a ledge in reach turns the jump into a mantle)
    this.coyote = this.grounded ? M.coyoteTime : this.coyote - dt;
    this.jumpBuf = inp.isDown('Space') && this.jumpHeldLast !== true ? M.jumpBuffer : this.jumpBuf - dt;
    this.jumpHeldLast = inp.isDown('Space');
    if (this.jumpBuf > 0 && this.coyote > 0) {
      if (iz > 0 && this.tryMantle(M.mantleJumpMin)) return;
      this.vel.y = M.jumpVelocity;
      this.jumpBuf = 0;
      this.coyote = 0;
      this.grounded = false;
      jumped = true;
      if (this.sliding) {
        // slide-jump keeps (and slightly boosts) the momentum
        hv.multiplyScalar(M.slideJumpBoost).clampLength(0, M.slideSpeed * 1.25);
        this.sliding = false;
        this.slideCd = M.slideCooldown;
      }
    }

    if (this.sliding) {
      this.slideT += dt;
      // friction, plus gravity along the ground slope (ramps and stairs speed you up)
      const n = this.groundNormal();
      const slope = new THREE.Vector3(n.x, 0, n.z).multiplyScalar(M.slideSlopeAccel);
      hv.add(slope.multiplyScalar(dt));
      const sp = hv.length();
      const downhill = slope.lengthSq() > 0.5 && slope.dot(hv) > 0;
      const nsp = Math.max(0, sp - (downhill ? M.slideFriction * 0.25 : M.slideFriction) * dt);
      if (sp > 1e-3) hv.multiplyScalar(nsp / sp);
      // a little steering
      if (wishDir.lengthSq() > 0 && nsp > 0.1) {
        const want = wishDir.clone().multiplyScalar(nsp);
        hv.lerp(want, Math.min(1, M.slideSteer * dt)).setLength(nsp);
      }
      const release = !crouchKey && this.slideT > 0.2;
      if (nsp < M.crouchSpeed + 0.4 || (this.slideT > M.slideMaxTime && !downhill) || release || !this.grounded) {
        this.sliding = false;
        this.slideCd = M.slideCooldown;
      }
    } else if (this.dashT > 0) {
      this.dashT -= dt; // the dash owns the velocity for its duration
    } else {
      let speed = this.crouching ? M.crouchSpeed : this.sprinting ? M.sprintSpeed : M.walkSpeed;
      speed *= THREE.MathUtils.lerp(1, M.adsSpeedMult, adsT);
      speed *= THREE.MathUtils.lerp(1, T.charge.moveMult, this.chargeLevel || 0);
      const target = wish.multiplyScalar(speed);
      const accel = this.grounded ? (target.lengthSq() > 0.01 ? M.groundAccel : M.groundDecel) : M.airAccel;
      const before = hv.length();
      const diff = target.sub(hv);
      const maxStep = accel * dt;
      if (diff.length() > maxStep) diff.setLength(maxStep);
      hv.add(diff);
      // in the air, steering never throws away momentum above run speed (slide-jumps, dashes)
      if (!this.grounded && before > speed) {
        const keep = Math.max(hv.length(), before - M.airDrag * dt);
        if (hv.lengthSq() > 1e-6) hv.setLength(keep);
      }
    }

    // ---- air dash: Shift in the air, paid in Lachryma ----
    if (this.grounded) this.dashCharges = M.dashCharges;
    if (!this.grounded && !jumped && this.dashBuf > 0 && this.dashT <= 0) {
      this.dashBuf = 0;
      const pool = this.game?.lachryma;
      if (this.dashCharges > 0 && (!pool || pool.spend(M.dashCost, 'dash'))) {
        this.dashCharges--;
        const d = wishDir.lengthSq() > 0.01 ? wishDir.normalize() : this.forward(new THREE.Vector3());
        hv.copy(d).multiplyScalar(M.dashSpeed);
        this.vel.y = Math.max(this.vel.y, M.dashUp);
        this.dashT = M.dashTime;
        this.fovPunch = Math.max(this.fovPunch, 7);
        sfx.dash?.();
        this.dashFx(d);
      } else {
        sfx.fizzle();
        this.game?.hud?.lachrymaPulse(false);
      }
    }

    this.vel.x = hv.x; this.vel.z = hv.z;
    if (this.dashT > 0) this.vel.y = Math.max(this.vel.y - M.gravity * 0.15 * dt, 0);
    else this.vel.y -= M.gravity * dt;
    if (this.grounded && this.vel.y < 0) this.vel.y = -2;

    // falling/jumping at a ledge while pushing forward: pull up onto it
    if (!this.grounded && iz > 0 && this.vel.y < M.mantleRiseMax && this.tryMantle(M.mantleMin)) return;

    // slides and dashes bowl clapperjars over
    if ((this.sliding || this.dashT > 0) && this.game?.clappers) {
      for (const c of this.game.clappers.list) {
        if (!c.alive || c.state === 'knocked') continue;
        if (Math.hypot(c.pos.x - this.pos.x, c.pos.z - this.pos.z) < 0.75 && Math.abs(c.pos.y - this.pos.y) < 1) {
          this.game.clappers.knock(c, hv.clone().multiplyScalar(0.9).setY(4));
        }
      }
    }

    const desired = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.ctrl.computeColliderMovement(this.collider, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, GROUPS.controllerQuery);
    const mv = this.ctrl.computedMovement();
    const wasGrounded = this.grounded;
    this.grounded = this.ctrl.computedGrounded();
    if (this.vel.y > 0 && mv.y < desired.y * 0.5) this.vel.y = 0; // bonk
    const fallSpeed = -this.vel.y;
    if (this.grounded && !wasGrounded) this.landT = 0.15;
    if (this.grounded && !wasGrounded && fallSpeed > 3) {
      this.landed = fallSpeed;
      sfx.land(fallSpeed);
    }
    if (this.grounded && this.vel.y < 0) this.vel.y = 0;
    this.vel.x = mv.x / dt; this.vel.z = mv.z / dt;

    this.pos.x += mv.x; this.pos.y += mv.y; this.pos.z += mv.z;
    if (this.pos.y < -10) this.respawn();
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y + CENTER_Y, z: this.pos.z });
  }

  groundNormal() {
    const hit = this.physics.raycast({ x: this.pos.x, y: this.pos.y + 0.15, z: this.pos.z }, { x: 0, y: -1, z: 0 }, 0.5, this.collider, GROUPS.controllerQuery);
    return hit ? hit.normal : UP;
  }

  /** A ledge in front between minH and mantleMax above the feet, with room to stand? */
  tryMantle(minH) {
    const M = T.movement;
    const f = this.forward(new THREE.Vector3());
    const solid = (c) => !c.isSensor() && !c.parent()?.isDynamic();
    const P = this.pos;
    // something in front at chest height or below the ledge
    const wall = this.physics.raycast({ x: P.x, y: P.y + Math.max(minH, 0.35), z: P.z }, f, RADIUS + M.mantleReach, this.collider, GROUPS.controllerQuery, solid);
    if (!wall || Math.abs(wall.normal.y) > 0.5) return false;
    const reach = wall.distance + 0.3;
    const top = { x: P.x + f.x * reach, y: P.y + M.mantleMax + 0.15, z: P.z + f.z * reach };
    const down = this.physics.raycast(top, { x: 0, y: -1, z: 0 }, M.mantleMax + 0.15 - minH, this.collider, GROUPS.controllerQuery, solid);
    if (!down || down.normal.y < 0.7) return false;
    const h = down.point.y - P.y;
    if (h < minH || h > M.mantleMax) return false;
    // headroom above the ledge, and over our own head for the climb
    const up = { x: down.point.x, y: down.point.y + 0.05, z: down.point.z };
    if (this.physics.raycast(up, UP, HALF * 2 + RADIUS * 2 - 0.05, this.collider, GROUPS.controllerQuery, solid)) return false;
    if (this.physics.raycast({ x: P.x, y: P.y + 1.6, z: P.z }, UP, h + 0.1, this.collider, GROUPS.controllerQuery, solid)) return false;
    const to = new THREE.Vector3(down.point.x, down.point.y + 0.02, down.point.z).addScaledVector(f, 0.15);
    this.mantle = { from: P.clone(), to, t: 0, dur: M.mantleTime * THREE.MathUtils.lerp(0.75, 1.1, h / M.mantleMax) };
    this.sliding = false;
    this.dashT = 0;
    this.vel.set(0, 0, 0);
    this.jumpBuf = 0;
    this.coyote = 0;
    sfx.mantle?.();
    return true;
  }

  stepMantle(dt) {
    const m = this.mantle;
    m.t += dt / m.dur;
    const k = Math.min(1, m.t);
    const ky = 1 - (1 - k) * (1 - k); // up first...
    const kx = k * k; // ...then over
    this.pos.set(
      THREE.MathUtils.lerp(m.from.x, m.to.x, kx),
      THREE.MathUtils.lerp(m.from.y, m.to.y, ky),
      THREE.MathUtils.lerp(m.from.z, m.to.z, kx),
    );
    this.grounded = false;
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y + CENTER_Y, z: this.pos.z });
    if (k >= 1) {
      this.mantle = null;
      this.grounded = true;
      this.landed = 3.5;
      const f = this.forward(new THREE.Vector3());
      this.vel.set(f.x * 2.5, 0, f.z * 2.5);
    }
  }

  dashFx(dir) {
    const fx = this.game?.fx;
    if (!fx) return;
    const c = new THREE.Color(0xf3c9a8);
    for (let i = 0; i < 18; i++) {
      const p = this.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * 0.5));
      fx.alpha.emit({ pos: p, vel: dir.clone().multiplyScalar(-2 - Math.random() * 3), life: 0.35 + Math.random() * 0.2, size: 0.1, sizeEnd: 0.4, color: c, alpha: 0.3, drag: 4 });
    }
  }

  // body facing: FP locks to view; TP turns toward movement unless in combat stance
  updateBody(dt, combat) {
    if (combat) this.combatTimer = T.movement.combatStanceTime;
    else this.combatTimer -= dt;
    const inCombat = this.combatTimer > 0;
    const hs = Math.hypot(this.vel.x, this.vel.z);
    let target = this.bodyYaw;
    let rate = T.movement.tpTurnSpeed;
    if (this.fp || inCombat) { target = this.yaw; rate *= 2.2; }
    else if (hs > 0.5) target = Math.atan2(this.vel.x, this.vel.z);
    if (this.fp) this.bodyYaw = this.yaw;
    else {
      // eased turn with a speed cap and angular acceleration, so a 180 doesn't whip the upper body
      const err = wrap(target - this.bodyYaw);
      const maxW = (inCombat ? 2 : 1) * T.movement.tpMaxTurn * DEG;
      const wantW = THREE.MathUtils.clamp(err * rate, -maxW, maxW);
      const accel = maxW * 12 * dt;
      this.turnW = (this.turnW || 0) + THREE.MathUtils.clamp(wantW - (this.turnW || 0), -accel, accel);
      this.bodyYaw += Math.abs(this.turnW * dt) > Math.abs(err) ? err : this.turnW * dt;
    }
    this.aimYawOffset = THREE.MathUtils.clamp(wrap(this.yaw - this.bodyYaw), -80 * DEG, 80 * DEG);
    this.inCombat = inCombat || this.fp;
  }

  updateCamera(dt, alpha, adsT, exclude) {
    const C = T.camera;
    this.renderPos.lerpVectors(this.prevPos, this.pos, alpha);

    // recoil punch spring (critically damped toward 0)
    const w = T.recoil.recoverSpeed;
    for (const c of ['x', 'y']) {
      const a = -w * w * this.punch[c] - 2 * w * this.punchV[c];
      this.punchV[c] += a * dt;
      this.punch[c] += this.punchV[c] * dt;
    }
    this.shake = Math.max(0, this.shake - dt * 3);
    this.fovPunch = THREE.MathUtils.damp(this.fovPunch, 0, 12, dt);

    const targetBlend = this.fp ? 0 : 1;
    const step = dt / Math.max(0.01, C.viewBlendTime);
    // (exact equality must hold still: the old ternary stepped away from 1 and back every frame)
    if (targetBlend > this.tpBlend) this.tpBlend = Math.min(1, this.tpBlend + step);
    else if (targetBlend < this.tpBlend) this.tpBlend = Math.max(0, this.tpBlend - step);
    this.shoulderBlend = THREE.MathUtils.damp(this.shoulderBlend, this.shoulder, 10, dt);
    const tb = this.tpBlend * this.tpBlend * (3 - 2 * this.tpBlend);

    // posture blends (also read by the character animation)
    const drop = this.sliding ? T.movement.slideEyeDrop : this.crouching ? T.movement.crouchEyeDrop : 0;
    this.eyeDrop = THREE.MathUtils.damp(this.eyeDrop, drop, 12, dt);
    this.slideBlend = THREE.MathUtils.damp(this.slideBlend, this.sliding ? 1 : 0, 14, dt);
    this.mantleBlend = THREE.MathUtils.damp(this.mantleBlend, this.mantle ? 1 : 0, 16, dt);
    this.dashBlend = THREE.MathUtils.damp(this.dashBlend, this.dashT > 0 ? 1 : 0, this.dashT > 0 ? 25 : 6, dt);
    this.crouchBlend = THREE.MathUtils.damp(this.crouchBlend || 0, this.crouching ? 1 : 0, 12, dt);

    const sh = this.shake * this.shake;
    const pitch = this.pitch + this.punch.x + (Math.random() - 0.5) * sh * 0.02;
    const yaw = this.yaw + this.punch.y + (Math.random() - 0.5) * sh * 0.02;
    const cam = this.camera;
    const roll = this.slideBlend * 4 * DEG * (1 - this.tpBlend) + (Math.random() - 0.5) * sh * 0.01;
    cam.rotation.set(pitch, yaw + Math.PI, roll, 'YXZ');
    cam.updateMatrixWorld();

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);

    // first person eye
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded) this.bobPhase += hs * dt * 2.4;
    const bobAmt = C.fpHeadBob * Math.min(1, hs / 5) * (1 - adsT * 0.8) * (this.grounded ? 1 : 0);
    const fpPos = this.renderPos.clone();
    fpPos.y += C.eyeHeight - this.eyeDrop + Math.abs(Math.sin(this.bobPhase)) * 0.03 * bobAmt;
    fpPos.addScaledVector(this.forward(_v), 0.1);
    fpPos.addScaledVector(this.right(_v), Math.sin(this.bobPhase) * 0.015 * bobAmt);

    // third person over-the-shoulder with collision
    const pivot = this.renderPos.clone();
    pivot.y += C.tpPivotHeight - this.eyeDrop * 0.7;
    const dist = THREE.MathUtils.lerp(C.tpDistance, C.tpAdsDistance, adsT);
    const shoulder = THREE.MathUtils.lerp(C.tpShoulder, C.tpAdsShoulder, adsT) * this.shoulderBlend;
    const off = new THREE.Vector3().addScaledVector(right, shoulder).addScaledVector(camUp, C.tpLift).addScaledVector(fwd, -dist);
    const offLen = off.length();
    const dir = off.clone().divideScalar(offLen);
    const hit = this.physics.raycast(pivot, dir, offLen + C.collisionRadius, exclude, GROUPS.controllerQuery);
    let allowed = offLen;
    if (hit) allowed = Math.max(0.15, hit.distance - C.collisionRadius);
    this.camDist = allowed < this.camDist ? allowed : THREE.MathUtils.damp(this.camDist, allowed, 6, dt);
    const tpPos = pivot.addScaledVector(dir, this.camDist);

    cam.position.lerpVectors(fpPos, tpPos, tb);
    const baseFov = THREE.MathUtils.lerp(THREE.MathUtils.lerp(C.fpFov, C.fpAdsFov, adsT), THREE.MathUtils.lerp(C.tpFov, C.tpAdsFov, adsT), tb);
    const sprintFov = this.sprinting ? 4 : this.sliding ? 7 : 0;
    this.sprintFov = THREE.MathUtils.damp(this.sprintFov || 0, sprintFov, 6, dt);
    cam.fov = baseFov + this.fovPunch + this.sprintFov - 4 * (this.chargeLevel || 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    this.fpWeight = 1 - tb;
    this.landedOut = this.landed;
    this.landed = 0;
  }
}
