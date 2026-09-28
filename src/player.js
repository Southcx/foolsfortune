import * as THREE from 'three';
import { RAPIER, GROUPS } from './physics.js';
import { T, DEG } from './config.js';
import { sfx } from './audio.js';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const HALF = 0.55, RADIUS = 0.3; // standing capsule: 1.7 m tall
const LOW_HALF = 0.25; // crouched / sliding: 1.1 m
const STAND_SHAPE = new RAPIER.Capsule(HALF, RADIUS - 0.02);
const QF = RAPIER.QueryFilterFlags;

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const hlen = (v) => Math.hypot(v.x, v.z);

/**
 * Kinematic character controller. The rigid body sits at the feet and the
 * capsule is offset above it, so crouching just shortens the capsule.
 *
 * Movement set (Titanfall-flavoured): walk/sprint (any direction but back),
 * crouch, slide (with a boost on a cooldown), jump + one air jump, wallrun and
 * wall jump, mantle, and a Lachryma air dash. Momentum above run speed is never
 * thrown away by steering, only by friction and walls.
 */
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
    this.airT = 0;
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
    this.low = false; // short capsule
    this.sliding = false;
    this.slideT = 0;
    this.slideCd = 0;
    this.slideBoostCd = 0;
    this.crouching = false;
    this.mantle = null; // { from, to, t }
    this.wallrun = null; // { n, side, t, lost, handle }
    this.wallCd = 0;
    this.lastWall = -1;
    this.airJumps = 0;
    this.dashT = 0;
    this.dashCharges = 0;
    this.slideBuf = 0;
    this.dashBuf = 0;
    this.shove = new THREE.Vector3(); // soft push from critters, applied through the controller
    this.slideBlend = 0;
    this.mantleBlend = 0;
    this.dashBlend = 0;
    this.crouchBlend = 0;
    this.wallBlend = 0; // signed: + wall on the right
    this.roll = 0;
    this.headRel = null; // posed head position relative to the feet (from the character, last frame)
    this.game = null; // set by main (Lachryma, fx, clappers)

    // recoil / shake
    this.punch = new THREE.Vector2(); // x = pitch, y = yaw (radians)
    this.punchV = new THREE.Vector2();
    this.shake = 0;
    this.fovPunch = 0;
    this.bobPhase = 0;

    const w = physics.world;
    this.body = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(this.pos.x, this.pos.y, this.pos.z));
    this.collider = w.createCollider(RAPIER.ColliderDesc.capsule(HALF, RADIUS).setTranslation(0, HALF + RADIUS, 0)
      .setCollisionGroups(GROUPS.player).setFriction(0), this.body);
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
  get height() { return (this.low ? LOW_HALF : HALF) * 2 + RADIUS * 2; }
  forward(target = new THREE.Vector3()) { return target.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  right(target = new THREE.Vector3()) { return target.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); }

  place() {
    this.body.setTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z }, true);
    this.physics.world.propagateModifiedBodyPositionsToColliders();
  }

  respawn() {
    this.pos.copy(this.spawn);
    this.prevPos.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.yaw = this.bodyYaw = 0;
    this.pitch = 0;
    this.wallrun = null;
    this.mantle = null;
    this.sliding = false;
    this.place();
  }

  look(dt, adsT) {
    const inp = this.input;
    const k = 0.0022 * T.camera.sensitivity * THREE.MathUtils.lerp(1, T.camera.adsSensMult, adsT);
    this.yaw -= inp.dx * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - inp.dy * k, -85 * DEG, 85 * DEG);
    this.lookDX = inp.dx; this.lookDY = inp.dy;

    if (inp.wasPressed('KeyV')) this.view = this.fp ? 'tp' : 'fp';
    // edge-triggered actions are latched here (per frame) and consumed by the fixed step
    if (inp.wasPressed('KeyC')) this.slideBuf = T.movement.slideBuffer;
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

  // ---- capsule height ------------------------------------------------------------
  setLow(low) {
    if (low === this.low) return;
    this.low = low;
    const half = low ? LOW_HALF : HALF;
    this.collider.setHalfHeight(half);
    this.collider.setTranslationWrtParent({ x: 0, y: half + RADIUS, z: 0 });
  }

  canStand() {
    const hit = this.physics.world.intersectionWithShape(
      { x: this.pos.x, y: this.pos.y + HALF + RADIUS + 0.03, z: this.pos.z }, { x: 0, y: 0, z: 0, w: 1 }, STAND_SHAPE,
      QF.EXCLUDE_SENSORS | QF.EXCLUDE_DYNAMIC, GROUPS.controllerQuery, this.collider);
    return !hit;
  }

  // ---- the fixed step -------------------------------------------------------------
  fixedUpdate(dt, { adsT, wantsFire }) {
    const M = T.movement, inp = this.input;
    this.prevPos.copy(this.pos);
    this.slideBuf -= dt;
    this.dashBuf -= dt;
    this.slideCd -= dt;
    this.slideBoostCd -= dt;
    this.wallCd -= dt;
    this.landT = (this.landT || 0) - dt;
    this.airT = this.grounded ? 0 : this.airT + dt;

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
    const crouchKey = live && inp.isDown('KeyC');
    const sprintKey = live && (inp.isDown('ShiftLeft') || inp.isDown('ShiftRight'));

    // ---- slide: crouch while moving fast on the ground ----
    // Starts above slideMinSpeed, or from a sprint that's still spinning up (so a
    // quick sprint-crouch never falls into a plain crouch). The boost is on a cooldown.
    const wantSlide = this.slideBuf > 0 || (crouchKey && this.landT > 0);
    const fast = hs > M.slideMinSpeed || (sprintKey && hs > M.walkSpeed * 0.8);
    if (!this.sliding && wantSlide && this.grounded && fast && this.slideCd <= 0) {
      this.sliding = true;
      this.slideT = 0;
      this.slideBuf = 0;
      if (hs > 1e-3) {
        if (this.slideBoostCd <= 0) { hv.setLength(Math.max(hs + M.slideBoost, M.slideSpeed)); this.slideBoostCd = M.slideBoostCooldown; }
        else hv.setLength(Math.max(hs, M.sprintSpeed));
      }
      sfx.slide();
    }

    // capsule: low while sliding or crouching (and while there's no headroom to stand)
    const wantLow = this.sliding || (crouchKey && this.grounded) || (this.low && crouchKey);
    if (wantLow) this.setLow(true);
    else if (this.low && this.canStand()) this.setLow(false);
    this.crouching = this.low && !this.sliding && this.grounded;
    // sprint in any direction except backwards
    this.sprinting = sprintKey && iz >= 0 && (iz > 0 || ix !== 0) && adsT < 0.3 && !wantsFire && !this.low;

    // ---- jumps: ground (with coyote time), wall jump, air jump ----
    let jumped = false;
    this.coyote = this.grounded ? M.coyoteTime : this.coyote - dt;
    this.jumpBuf = live && inp.isDown('Space') && this.jumpHeldLast !== true ? M.jumpBuffer : this.jumpBuf - dt;
    this.jumpHeldLast = inp.isDown('Space');
    if (this.grounded) { this.airJumps = M.airJumps; this.dashCharges = M.dashCharges; }
    if (this.jumpBuf > 0) {
      if (this.wallrun) {
        this.wallJump(hv, wishDir);
        jumped = true;
      } else if (this.coyote > 0) {
        if (iz > 0 && this.tryMantle(M.mantleJumpMin)) return;
        this.vel.y = M.jumpVelocity;
        this.coyote = 0;
        jumped = true;
        if (this.sliding) {
          // slide-hop keeps (and slightly boosts) the momentum
          hv.multiplyScalar(M.slideJumpBoost).clampLength(0, M.maxSpeed);
          this.sliding = false;
          this.slideCd = M.slideCooldown;
        }
      } else if (this.airJumps > 0 && this.airT > 0.05) {
        // jump-kit air jump: pops you up and swings your momentum toward the stick
        this.airJumps--;
        this.vel.y = Math.max(this.vel.y, M.jumpVelocity * M.airJumpMult);
        if (wishDir.lengthSq() > 0.01) hv.copy(wishDir).normalize().multiplyScalar(Math.max(hs, M.walkSpeed));
        this.jumpFx(0.6);
        sfx.airJump();
        jumped = true;
      }
      if (jumped) { this.jumpBuf = 0; this.grounded = false; }
    }

    // ---- wallrun ----
    if (this.wallrun && !jumped) this.stepWallrun(dt, hv, iz);
    else if (!this.grounded && !jumped && !this.wallrun && iz > 0 && this.wallCd <= 0 && this.airT > 0.06) this.tryWallrun(hv);

    // ---- horizontal velocity ----
    if (this.wallrun) {
      // handled by stepWallrun
    } else if (this.sliding) {
      this.slideT += dt;
      // friction, plus gravity along the ground slope (ramps and stairs speed you up)
      const n = this.groundNormal();
      const slope = new THREE.Vector3(n.x, 0, n.z).multiplyScalar(M.slideSlopeAccel);
      hv.add(slope.multiplyScalar(dt));
      const sp = hv.length();
      const downhill = slope.lengthSq() > 0.5 && slope.dot(hv) > 0;
      const nsp = Math.max(0, sp - (downhill ? M.slideFriction * 0.2 : M.slideFriction) * dt);
      if (sp > 1e-3) hv.multiplyScalar(nsp / sp);
      if (wishDir.lengthSq() > 0 && nsp > 0.1) {
        const want = wishDir.clone().multiplyScalar(nsp);
        hv.lerp(want, Math.min(1, M.slideSteer * dt)).setLength(nsp);
      }
      const release = !crouchKey && this.slideT > 0.2;
      // (a brief loss of ground, like a stair nose, doesn't end it)
      if (nsp < M.crouchSpeed + 0.3 || (this.slideT > M.slideMaxTime && !downhill) || release || this.airT > 0.15) {
        this.sliding = false;
        this.slideCd = M.slideCooldown;
      }
    } else if (this.dashT > 0) {
      this.dashT -= dt; // the dash owns the velocity for its duration
    } else {
      let speed = this.crouching ? M.crouchSpeed : this.sprinting ? M.sprintSpeed * (iz > 0 ? 1 : M.strafeSprintMult) : M.walkSpeed;
      speed *= THREE.MathUtils.lerp(1, M.adsSpeedMult, adsT);
      speed *= THREE.MathUtils.lerp(1, T.charge.moveMult, this.chargeLevel || 0);
      const before = hv.length();
      if (this.grounded && before > speed + 0.1 && wish.lengthSq() > 0.01) {
        // landed with extra speed (hops, slides): steer freely, but bleed it off over a
        // moment instead of snapping to run speed, so a quick hop keeps it
        const dir = hv.clone().divideScalar(before).lerp(wishDir.clone().normalize(), Math.min(1, M.groundSteer * dt)).normalize();
        hv.copy(dir).multiplyScalar(Math.max(speed, before - M.overspeedDecel * dt));
      } else {
        const target = wish.multiplyScalar(speed);
        const accel = this.grounded ? (target.lengthSq() > 0.01 ? M.groundAccel : M.groundDecel) : M.airAccel;
        const diff = target.sub(hv);
        const maxStep = accel * dt;
        if (diff.length() > maxStep) diff.setLength(maxStep);
        hv.add(diff);
        // in the air, steering never throws away momentum above run speed
        if (!this.grounded && before > speed) {
          const keep = Math.max(hv.length(), before - M.airDrag * dt);
          if (hv.lengthSq() > 1e-6) hv.setLength(keep);
        }
      }
    }

    // ---- air dash: Shift in the air, paid in Lachryma ----
    if (!this.grounded && !jumped && !this.wallrun && this.dashBuf > 0 && this.dashT <= 0) {
      this.dashBuf = 0;
      const pool = this.game?.lachryma;
      if (this.dashCharges > 0 && (!pool || pool.spend(M.dashCost, 'dash'))) {
        this.dashCharges--;
        const d = wishDir.lengthSq() > 0.01 ? wishDir.normalize() : this.forward(new THREE.Vector3());
        hv.copy(d).multiplyScalar(Math.max(M.dashSpeed, hs));
        this.vel.y = Math.max(this.vel.y, M.dashUp);
        this.dashT = M.dashTime;
        this.fovPunch = Math.max(this.fovPunch, 7);
        sfx.dash();
        this.dashFx(d);
      } else {
        sfx.fizzle();
        this.game?.hud?.lachrymaPulse(false);
      }
    }
    hv.clampLength(0, M.maxSpeed);
    this.vel.x = hv.x; this.vel.z = hv.z;

    // ---- vertical ----
    if (this.wallrun) { /* stepWallrun set it */ }
    else if (this.dashT > 0) this.vel.y = Math.max(this.vel.y - M.gravity * 0.15 * dt, 0);
    else if (!this.grounded || jumped) this.vel.y -= M.gravity * dt;
    else this.vel.y = 0; // grounded: no push into the floor (snap-to-ground keeps us down)

    // falling/jumping at a ledge while pushing forward: pull up onto it
    if (!this.grounded && !this.wallrun && iz > 0 && this.vel.y < M.mantleRiseMax && this.tryMantle(M.mantleMin)) return;

    // slides and dashes bowl clapperjars over; otherwise they just jostle
    this.critters(hv);

    this.move(dt);
  }

  /** Run the controller, then keep only the velocity walls actually took away. */
  move(dt) {
    const want = { x: this.vel.x * dt + this.shove.x, y: this.vel.y * dt, z: this.vel.z * dt + this.shove.z };
    this.shove.set(0, 0, 0);
    const opts = [QF.EXCLUDE_SENSORS, GROUPS.controllerQuery];
    this.ctrl.computeColliderMovement(this.collider, want, ...opts);
    let mv = this.ctrl.computedMovement();
    const walls = this.wallHits();
    // Rapier's controller occasionally returns zero motion for a capsule resting in
    // its contact margin on flat ground (that was the periodic walking hitch). If only
    // the floor "blocked" us, retry the move flat.
    const wantH = Math.hypot(want.x, want.z);
    let gotH = Math.hypot(mv.x, mv.z);
    if (wantH > 1e-4 && gotH < wantH * 0.5) {
      this.ctrl.computeColliderMovement(this.collider, { x: want.x, y: Math.max(0, want.y), z: want.z }, ...opts);
      mv = this.ctrl.computedMovement();
      gotH = Math.hypot(mv.x, mv.z);
    }
    this.stuck = wantH > 1e-4 && gotH < wantH * 0.15 ? (this.stuck || 0) + 1 : 0;
    const wasGrounded = this.grounded;
    this.grounded = this.ctrl.computedGrounded();
    if (this.vel.y > 0 && mv.y < want.y * 0.5) this.vel.y = 0; // bonk
    const fallSpeed = -this.vel.y;
    if (this.grounded && !wasGrounded) {
      this.landT = 0.15;
      if (fallSpeed > 3) { this.landed = fallSpeed; sfx.land(fallSpeed); }
      if (this.wallrun) this.endWallrun(false);
    }
    if (this.grounded && this.vel.y < 0) this.vel.y = 0;
    // walls remove only the velocity pointing into them (a glancing hit keeps its speed)
    for (const n of walls) {
      const d = this.vel.x * n.x + this.vel.z * n.z;
      if (d < 0) { this.vel.x -= n.x * d; this.vel.z -= n.z * d; }
    }
    if (walls.length && this.stuck > 1) { this.vel.x = mv.x / dt; this.vel.z = mv.z / dt; } // really wedged in a corner

    this.pos.x += mv.x; this.pos.y += mv.y; this.pos.z += mv.z;
    if (this.pos.y < -30) this.respawn();
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z });
  }

  /** Horizontal normals of the steep things the last move touched. */
  wallHits() {
    const out = [];
    for (let i = 0; i < this.ctrl.numComputedCollisions(); i++) {
      const c = this.ctrl.computedCollision(i);
      const n = c.normal1;
      if (Math.abs(n.y) > 0.7) continue;
      const l = Math.hypot(n.x, n.z);
      if (l > 1e-3) out.push({ x: n.x / l, z: n.z / l });
    }
    return out;
  }

  groundNormal() {
    const hit = this.physics.raycast({ x: this.pos.x, y: this.pos.y + 0.15, z: this.pos.z }, { x: 0, y: -1, z: 0 }, 0.5, this.collider, GROUPS.controllerQuery);
    return hit ? hit.normal : UP;
  }

  // ---- critters ----------------------------------------------------------------
  critters(hv) {
    const cl = this.game?.clappers;
    if (!cl) return;
    const M = T.movement;
    const bowl = this.sliding || this.dashT > 0;
    for (const c of cl.list) {
      if (!c.alive) continue;
      const dx = this.pos.x - c.pos.x, dz = this.pos.z - c.pos.z;
      const d = Math.hypot(dx, dz);
      const reach = RADIUS + 0.26 * T.clappers.scale;
      if (d > reach + 0.15 || Math.abs(c.pos.y - this.pos.y) > 1) continue;
      if (bowl && c.state !== 'knocked' && d < reach + 0.15) { cl.knock(c, hv.clone().multiplyScalar(0.9).setY(4)); continue; }
      if (d >= reach) continue;
      // they're small: overlap mostly moves them, and only nudges you
      const k = (reach - d) / Math.max(d, 1e-3);
      this.shove.x += dx * k * M.critterPush;
      this.shove.z += dz * k * M.critterPush;
      cl.bump?.(c, -dx * k * (1 - M.critterPush), -dz * k * (1 - M.critterPush));
    }
  }

  // ---- wallrun -------------------------------------------------------------------
  probeWall(dir, len) {
    const solid = (c) => !c.isSensor() && !c.parent()?.isDynamic();
    const hit = this.physics.raycast({ x: this.pos.x, y: this.pos.y + 1.0, z: this.pos.z }, dir, len, this.collider, GROUPS.controllerQuery, solid);
    return hit && Math.abs(hit.normal.y) < 0.25 ? hit : null;
  }

  tryWallrun(hv) {
    const M = T.movement;
    if (hlen(hv) < M.wallrunMinSpeed * 0.6) return;
    // too close to the ground to bother
    if (this.physics.raycast({ x: this.pos.x, y: this.pos.y + 0.1, z: this.pos.z }, { x: 0, y: -1, z: 0 }, M.wallrunMinHeight, this.collider, GROUPS.controllerQuery)) return;
    const r = this.right(new THREE.Vector3()), f = this.forward(new THREE.Vector3());
    const reach = RADIUS + T.movement.wallrunReach;
    const probes = [[r, 1, reach], [r.clone().negate(), -1, reach],
      [r.clone().add(f).normalize(), 1, reach + 0.2], [r.clone().negate().add(f).normalize(), -1, reach + 0.2]];
    for (const [dir, side, len] of probes) {
      const hit = this.probeWall(dir, len);
      if (!hit) continue;
      const n = new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize();
      if (hit.collider.handle === this.lastWall && this.wallCd > -0.35) continue; // same wall again: needs a moment
      const along = hv.clone().addScaledVector(n, -hv.dot(n));
      if (along.length() < M.wallrunMinSpeed * 0.6 || hv.dot(n) > 1) continue;
      this.wallrun = { n, side, t: 0, lost: 0, handle: hit.collider.handle, dir: along.normalize() };
      this.airJumps = M.airJumps;
      this.dashCharges = M.dashCharges;
      this.sliding = false;
      this.dashT = 0;
      this.vel.y = THREE.MathUtils.clamp(this.vel.y, M.wallrunStartUp, M.wallrunStartUp * 1.6);
      sfx.wallTouch?.();
      return;
    }
  }

  stepWallrun(dt, hv, iz) {
    const M = T.movement, w = this.wallrun;
    w.t += dt;
    const hit = this.probeWall(w.n.clone().negate(), RADIUS + T.movement.wallrunReach + 0.2);
    if (hit) { w.n.set(hit.normal.x, 0, hit.normal.z).normalize(); w.lost = 0; } else w.lost += dt;
    // run along the wall, speeding up toward wallrunSpeed
    const along = hv.clone().addScaledVector(w.n, -hv.dot(w.n));
    if (along.lengthSq() > 0.01) w.dir.copy(along).normalize();
    else w.dir.addScaledVector(w.n, -w.dir.dot(w.n)).normalize();
    let sp = along.length();
    if (sp < M.wallrunSpeed) sp = Math.min(M.wallrunSpeed, sp + M.wallrunAccel * dt);
    hv.copy(w.dir).multiplyScalar(sp).addScaledVector(w.n, -1.2); // hug the wall
    // gravity comes back in slowly
    const g = w.t < M.wallrunHold ? M.gravity * 0.3 : M.wallrunGravity;
    this.vel.y = Math.max(-M.wallrunMaxFall, this.vel.y - g * dt);
    if (w.lost > 0.08 || w.t > M.wallrunMaxTime || iz <= 0) this.endWallrun(true);
  }

  endWallrun(push) {
    const w = this.wallrun;
    if (!w) return;
    if (push) { this.vel.x += w.n.x * 1.2; this.vel.z += w.n.z * 1.2; }
    this.lastWall = w.handle;
    this.wallCd = 0.2;
    this.wallrun = null;
  }

  wallJump(hv, wishDir) {
    const M = T.movement, w = this.wallrun;
    const along = hv.clone().addScaledVector(w.n, -hv.dot(w.n));
    hv.copy(along).multiplyScalar(M.wallJumpKeep).addScaledVector(w.n, M.wallJumpOut);
    if (wishDir.lengthSq() > 0.01) hv.addScaledVector(wishDir.clone().normalize(), 1.5);
    this.vel.y = M.wallJumpUp;
    this.endWallrun(false);
    this.wallCd = 0.25;
    this.jumpFx(0.4);
    sfx.airJump();
  }

  // ---- mantle ---------------------------------------------------------------------
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
    // headroom above the ledge (crouch height is enough), and over our own head for the climb
    const up = { x: down.point.x, y: down.point.y + 0.05, z: down.point.z };
    if (this.physics.raycast(up, UP, LOW_HALF * 2 + RADIUS * 2 - 0.05, this.collider, GROUPS.controllerQuery, solid)) return false;
    if (this.physics.raycast({ x: P.x, y: P.y + this.height - 0.1, z: P.z }, UP, h + 0.1, this.collider, GROUPS.controllerQuery, solid)) return false;
    const to = new THREE.Vector3(down.point.x, down.point.y + 0.02, down.point.z).addScaledVector(f, 0.15);
    const speed = hlen(this.vel);
    this.mantle = { from: P.clone(), to, t: 0, dur: M.mantleTime * THREE.MathUtils.lerp(0.75, 1.1, h / M.mantleMax), exit: Math.max(2.5, speed * 0.6) };
    this.sliding = false;
    this.dashT = 0;
    this.wallrun = null;
    this.vel.set(0, 0, 0);
    this.jumpBuf = 0;
    this.coyote = 0;
    sfx.mantle();
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
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z });
    if (k >= 1) {
      this.mantle = null;
      this.grounded = true;
      this.landed = 3.5;
      // if the ledge is low-ceilinged, stay crouched
      if (!this.canStand()) this.setLow(true);
      const f = this.forward(new THREE.Vector3());
      this.vel.set(f.x * m.exit, 0, f.z * m.exit); // come out of it still moving
    }
  }

  // ---- fx ------------------------------------------------------------------------
  dashFx(dir) {
    const fx = this.game?.fx;
    if (!fx) return;
    const c = new THREE.Color(0xf3c9a8);
    for (let i = 0; i < 18; i++) {
      const p = this.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * 0.5));
      fx.alpha.emit({ pos: p, vel: dir.clone().multiplyScalar(-2 - Math.random() * 3), life: 0.35 + Math.random() * 0.2, size: 0.1, sizeEnd: 0.4, color: c, alpha: 0.3, drag: 4 });
    }
  }

  jumpFx(k = 1) {
    const fx = this.game?.fx;
    if (!fx) return;
    const c = new THREE.Color(0xf3c9a8);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      fx.alpha.emit({ pos: this.pos.clone().setY(this.pos.y + 0.1), vel: new THREE.Vector3(Math.cos(a) * 2.5, -0.5, Math.sin(a) * 2.5).multiplyScalar(k), life: 0.4, size: 0.08, sizeEnd: 0.35, color: c, alpha: 0.3 * k, drag: 5 });
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
    const C = T.camera, M = T.movement;
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
    this.slideBlend = THREE.MathUtils.damp(this.slideBlend, this.sliding ? 1 : 0, 14, dt);
    this.mantleBlend = THREE.MathUtils.damp(this.mantleBlend, this.mantle ? 1 : 0, 16, dt);
    this.dashBlend = THREE.MathUtils.damp(this.dashBlend, this.dashT > 0 ? 1 : 0, this.dashT > 0 ? 25 : 6, dt);
    this.crouchBlend = THREE.MathUtils.damp(this.crouchBlend, this.crouching ? 1 : 0, 12, dt);
    this.wallBlend = THREE.MathUtils.damp(this.wallBlend, this.wallrun ? this.wallrun.side : 0, 10, dt);

    const sh = this.shake * this.shake;
    const pitch = this.pitch + this.punch.x + (Math.random() - 0.5) * sh * 0.02;
    const yaw = this.yaw + this.punch.y + (Math.random() - 0.5) * sh * 0.02;
    const cam = this.camera;
    // camera roll: tilt away from the wall while wallrunning, a touch into slides
    const rollWant = this.wallBlend * M.wallrunTilt * DEG * (1 - 0.6 * tb) + this.slideBlend * 4 * DEG * (1 - tb);
    this.roll = rollWant;
    cam.rotation.set(pitch, yaw + Math.PI, this.roll + (Math.random() - 0.5) * sh * 0.01, 'YXZ');
    cam.updateMatrixWorld();

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);

    // first person eye
    const hs = Math.hypot(this.vel.x, this.vel.z);
    const onFeet = this.grounded || !!this.wallrun;
    if (onFeet) this.bobPhase += hs * dt * 2.4;
    const bobAmt = C.fpHeadBob * Math.min(1, hs / 5) * (1 - adsT * 0.8) * (onFeet && !this.sliding ? 1 : 0);
    const fpPos = this.renderPos.clone();
    fpPos.y += C.eyeHeight + Math.abs(Math.sin(this.bobPhase)) * 0.03 * bobAmt;
    fpPos.addScaledVector(this.forward(_v), 0.1);
    fpPos.addScaledVector(this.right(_v), Math.sin(this.bobPhase) * 0.015 * bobAmt);
    // crouching, sliding and mantling: ride the posed head (last frame) so the eye never
    // ends up inside the body, then sit a little in front of it
    const posture = Math.max(this.slideBlend, this.crouchBlend, this.mantleBlend);
    if (this.headRel && posture > 0.001) {
      const head = this.renderPos.clone().add(this.headRel).addScaledVector(this.forward(_v), 0.14);
      head.y += 0.04;
      fpPos.lerp(head, posture);
    }

    // third person over-the-shoulder with collision
    const pivot = this.renderPos.clone();
    const drop = this.slideBlend * 0.55 + this.crouchBlend * 0.35;
    pivot.y += C.tpPivotHeight - drop;
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
    // speed widens the view a little (sprint, slides, wallruns, big hops)
    const speedFov = THREE.MathUtils.clamp((hs - M.walkSpeed) / (M.maxSpeed - M.walkSpeed), 0, 1) * C.speedFov;
    this.sprintFov = THREE.MathUtils.damp(this.sprintFov || 0, speedFov, 6, dt);
    cam.fov = baseFov + this.fovPunch + this.sprintFov - 4 * (this.chargeLevel || 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    this.fpWeight = 1 - tb;
    this.landedOut = this.landed;
    this.landed = 0;
  }
}
