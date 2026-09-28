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

    const f = this.forward(_v), r = this.right(_v2);
    const ix = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const wish = new THREE.Vector3().addScaledVector(f, iz).addScaledVector(r, ix);
    if (wish.lengthSq() > 1) wish.normalize();

    this.sprinting = inp.isDown('ShiftLeft') && iz > 0 && adsT < 0.3 && !wantsFire;
    let speed = this.sprinting ? M.sprintSpeed : M.walkSpeed;
    speed *= THREE.MathUtils.lerp(1, M.adsSpeedMult, adsT);

    const target = wish.multiplyScalar(speed);
    const hv = new THREE.Vector3(this.vel.x, 0, this.vel.z);
    const accel = this.grounded ? (target.lengthSq() > 0.01 ? M.groundAccel : M.groundDecel) : M.airAccel;
    const diff = target.sub(hv);
    const maxStep = accel * dt;
    if (diff.length() > maxStep) diff.setLength(maxStep);
    hv.add(diff);
    this.vel.x = hv.x; this.vel.z = hv.z;

    // jumping with coyote time + input buffer
    this.coyote = this.grounded ? M.coyoteTime : this.coyote - dt;
    this.jumpBuf = inp.isDown('Space') && this.jumpHeldLast !== true ? M.jumpBuffer : this.jumpBuf - dt;
    this.jumpHeldLast = inp.isDown('Space');
    if (this.jumpBuf > 0 && this.coyote > 0) {
      this.vel.y = M.jumpVelocity;
      this.jumpBuf = 0;
      this.coyote = 0;
      this.grounded = false;
    }
    this.vel.y -= M.gravity * dt;
    if (this.grounded && this.vel.y < 0) this.vel.y = -2;

    const desired = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.ctrl.computeColliderMovement(this.collider, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, GROUPS.controllerQuery);
    const mv = this.ctrl.computedMovement();
    const wasGrounded = this.grounded;
    this.grounded = this.ctrl.computedGrounded();
    if (this.vel.y > 0 && mv.y < desired.y * 0.5) this.vel.y = 0; // bonk
    const fallSpeed = -this.vel.y;
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

    const sh = this.shake * this.shake;
    const pitch = this.pitch + this.punch.x + (Math.random() - 0.5) * sh * 0.02;
    const yaw = this.yaw + this.punch.y + (Math.random() - 0.5) * sh * 0.02;
    const cam = this.camera;
    cam.rotation.set(pitch, yaw + Math.PI, (Math.random() - 0.5) * sh * 0.01, 'YXZ');
    cam.updateMatrixWorld();

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);

    // first person eye
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded) this.bobPhase += hs * dt * 2.4;
    const bobAmt = C.fpHeadBob * Math.min(1, hs / 5) * (1 - adsT * 0.8) * (this.grounded ? 1 : 0);
    const fpPos = this.renderPos.clone();
    fpPos.y += C.eyeHeight + Math.abs(Math.sin(this.bobPhase)) * 0.03 * bobAmt;
    fpPos.addScaledVector(this.forward(_v), 0.1);
    fpPos.addScaledVector(this.right(_v), Math.sin(this.bobPhase) * 0.015 * bobAmt);

    // third person over-the-shoulder with collision
    const pivot = this.renderPos.clone();
    pivot.y += C.tpPivotHeight;
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
    const sprintFov = this.sprinting ? 4 : 0;
    this.sprintFov = THREE.MathUtils.damp(this.sprintFov || 0, sprintFov, 6, dt);
    cam.fov = baseFov + this.fovPunch + this.sprintFov;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    this.fpWeight = 1 - tb;
    this.landedOut = this.landed;
    this.landed = 0;
  }
}
