// ---------------------------------------------------------------------------------------
// THE COURIER'S BODY: the core movement, the gold standard (CLAUDE.md: techs and arts never change it). A kinematic capsule on Rapier's
// character controller: walk, sprint, crouch, slide, jump and double jump, the dash, mantle and step-over, coyote time and jump buffering,
// carried momentum off moving ground, the camera (first person and over the shoulder) and its look, and the guard that puts the body back
// when it is embedded. The place may add its own pull and drag (`drift`, `wade`), zero and one leaving the core untouched. The techs
// (courier/moves/) take over from it while they run and hand it back exactly.
//
// This file keeps the Player (its state, in the constructor) and the fixed step, the order of the core movement's steps: the keys read,
// the slide, the posture, the jumps, the wall run, the velocity on the ground or in the air, the dash, gravity, the mantle, the move.
// Every other job is a part, a module in courier/player/ that takes the Player first; the class keeps a method of each name, a line that
// hands itself to its part (the techs, the tools, the siblings and the stress test call them):
//   capsule.js   the capsule's shapes, the posture (stand, crouch, prone), what the body fits in and is inside of
//   ground.js    the controller's move over the ground, what is under the feet, the clapperjars' shove
//   air.js       the wall run and the wall jump, the puffs a jump and a dash leave
//   mantle.js    the mantle and the step-over
//   view.js      the look, the body's facing, the camera
//   rescue.js    the guard
//
// Prior art: Quake's and Source's air control and strafe-jumping feel kept gentle, Titanfall's slide-hop and wallrun, Celeste's coyote
// time and buffered jumps, Mario 64's step-over, Rapier's kinematic character controller.
//
//   const P = new Player(...)   P.fixedUpdate(dt, opts)   P.look(dt, ads)   P.updateCamera(...)   P.impulse(v, why)   P.guard()   P.pos   P.vel
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../core/physics.js';
import { T, DEG } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { HALF, RADIUS, HALVES, setShape, canStand, fits, embedded, embeddedBy, setPosture, cyclePosture, crawlReach } from './player/capsule.js';
import { guard } from './player/rescue.js';
import { move, moverUnder, wallHits, underfoot, floorBelow, groundNormal, critters } from './player/ground.js';
import { probeWall, inWater, tryWallrun, stepWallrun, endWallrun, wallJump, dashFx, jumpFx } from './player/air.js';
import { tryMantle, stepMantle } from './player/mantle.js';
import { look, updateBody, updateCamera } from './player/view.js';

const _v = new THREE.Vector3();
/** A creature's blow among the outside pushes (player.impulse's `why`): what Unshaken holds against (a class's art, courier/classarts/body.js). */
const STAGGERS = new Set(['jelly', 'foe', 'lobber', 'strawman']);
/** A move axis: a stick's push where the input gives one (core/input.js `axis`; on keys exactly -1, 0 or 1, as ever), else the two keys (a
 *  sibling's VirtualKeys: coop/sibling.js). The core movement reads the same numbers from the keyboard as before (MOBILE.md 10). */
const moveAxis = (inp, id, neg, pos) => (inp.axis ? inp.axis(id) : (inp.isDown(pos) ? 1 : 0) - (inp.isDown(neg) ? 1 : 0));
const _v2 = new THREE.Vector3();

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
    this.isPlayer = true; this.kind = 'courier'; // (what they are to the creatures: creatures/ai/ecology.js)
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
    this.shape = 'stand'; // stand | low | blob | prone
    this.posture = 'stand'; // stand | crouch | prone: what C chose (C cycles them; the shape follows where it fits)
    this.postureBuf = 0; // (a C press made on the ground, kept for the fixed step)
    this.postureT = 0; // (getting down or up: the crawl's enter and exit clips play out, the body held still)
    this.prone = false; // (flat on the belly and on the ground: the crawl's look reads it)
    this.proneBlend = 0;
    this.latches = {}; // edge presses, buffered for the fixed step: code -> seconds left
    this.techs = null; // optional movement techs (set by main)
    this.sliding = false;
    this.slideT = 0;
    this.slideCd = 0;
    this.slideBoostCd = 0;
    this.crouching = false;
    this.mantle = null; // { from, to, t }
    this.wallrun = null; // { n, side, t, lost, handle }
    this.camFx = { yaw: 0, pitch: 0, dist: 1, fov: 0, roll: 0, shoulder: 0, lift: 0 };
    this.camShot = null; // (a scripted camera blended over this one: see vfx/cinema.js)
    this.lookScale = { lock: 1, blade: 1, brush: 1, lens: 1 }; // (how much of the mouse the camera gets: a lock-on quiets it, blade mode gives it to the blade)
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
    this.sfx = sfx; // (its sounds: a sibling's body is given its own, coop/sibling.js)
    this.invuln = 0; // seconds of invulnerability left (a dodge's first frames): read by damage, when there is any
    this.platform = null; // the moving platform under the feet (src/world/props/movers.js)
    this.carry = new THREE.Vector3(); // its displacement under us this step
    this.groundVel = new THREE.Vector3(); // ... as a velocity (the animation moves locked feet with it)
    // the ground's own pull and drag, set by the place that has them and put back by it when the Courier leaves (zero and one: the core
    // movement exactly): sand sliding under the feet (`drift`, m/s, carried like a platform's move), shallows that slow a walk (`wade`)
    this.drift = new THREE.Vector3(); this.wade = 1;
    this.airPeak = 0; // highest point since the feet last touched down
    this.killY = -100; // below this the world has ended
    this.safe = { pos: this.pos.clone(), t: 0 }; // last place we stood without being embedded
    this.wedged = 0; // consecutive steps embedded in something

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
  get height() { return HALVES[this.shape] * 2 + RADIUS * 2; }
  forward(target = new THREE.Vector3()) { return target.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  right(target = new THREE.Vector3()) { return target.set(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); }

  place() {
    this.body.setTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z }, true);
    this.physics.world.propagateModifiedBodyPositionsToColliders();
  }

  /** Set down on their feet: a respawn or a teleport arrives standing, whatever posture was left behind (shattered on the belly, made
   *  whole at the workshop still prone: the verifier, 2026-10-11). The shape's own check lowers them again where there is no headroom. */
  standUp() { this.posture = 'stand'; this.postureT = 0; this.postureBuf = 0; this.prone = false; this.setShape('stand'); }

  /** Somewhere we know is clear (the guard's fallback): after a teleport, where we are now. */
  markSafe() { this.safe.pos.copy(this.pos); this.safe.shape = this.shape; this.safe.t = 0; }
  /** Moved in play, not set down (CASEBOOK move-is-not-set-down): the body sent to `v` with its state, its ride and its tools kept, its fall
   *  and its safe spot taken from there (a portal's warp, a sibling's catch-up). Setting the Courier down is `course.teleport`. */
  moveTo(v, vel = null) { this.pos.copy(v); this.prevPos.copy(v); this.renderPos.copy(v); if (vel) this.vel.copy(vel); this.airPeak = v.y; this.airT = 0; this.place(); this.markSafe(); }

  respawn(why = 'fall') {
    this.ev('courier.respawn', { why });
    this.pos.copy(this.spawn);
    this.prevPos.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.yaw = this.bodyYaw = 0;
    this.pitch = 0;
    this.wallrun = null;
    this.mantle = null;
    this.sliding = false;
    this.invuln = 0;
    this.platform = null;
    this.carry.set(0, 0, 0); this.drift.set(0, 0, 0); this.wade = 1;
    this.wedged = 0;
    this.techs?.reset();
    this.standUp();
    this.game?.character?.setHidden(false);
    this.place();
    this.markSafe();
  }

  /** Movement keys as a world direction (length 0..1). */
  wishDir(target = new THREE.Vector3()) {
    const inp = this.input;
    const ix = moveAxis(inp, 'moveX', 'KeyA', 'KeyD'), iz = moveAxis(inp, 'moveY', 'KeyS', 'KeyW');
    target.copy(this.forward(_v)).multiplyScalar(iz).addScaledVector(this.right(_v2), ix);
    if (target.lengthSq() > 1) target.normalize();
    return target;
  }

  /** Where the camera looks (world, unit). */
  lookDir(target = new THREE.Vector3()) {
    return target.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
  }

  /** Consume a buffered key press (for techs). */
  latch(code) {
    if (!(this.latches[code] > 0)) return false;
    this.latches[code] = 0;
    return true;
  }
  peekLatch(code) { return this.latches[code] > 0; }

  /** End the core's own states (a tech is taking over). */
  endCore() {
    this.sliding = false;
    if (this.wallrun) this.endWallrun(false);
    this.dashT = 0;
    this.mantle = null;
    this.jumpBuf = 0;
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

  get invulnerable() { return this.invuln > 0; }

  /** Report to the event bus (the System, tests). */
  ev(name, data) { this.game?.events?.emit(name, data); }

  /**
   * An outside push (explosion, kick, vent, parry): adds velocity through one door so nothing
   * has to reach into `vel` itself. Upward pushes lift us off the ground.
   */
  impulse(v, why = 'push') {
    if (STAGGERS.has(why) && this.game?.classArtsRun?.unshaken?.()) { // (Unshaken, a class's art: ground held through the windup, the blow pushes nothing; it still lands)
      const mag = v.length(); this.game.classArtsRun.fire?.('dominion');
      this.ev('courier.impulse', { why, mag, dir: mag > 1e-4 ? [v.x / mag, v.y / mag, v.z / mag] : null, held: true });
      return;
    }
    this.vel.add(v);
    if (v.y > 0.5) { this.grounded = false; this.coyote = 0; }
    const mag = v.length();
    this.ev('courier.impulse', { why, mag, dir: mag > 1e-4 ? [v.x / mag, v.y / mag, v.z / mag] : null });
  }

  // ---- the fixed step -------------------------------------------------------------
  fixedUpdate(dt, { adsT, wantsFire }) {
    const M = T.movement, inp = this.input;
    this.prevPos.copy(this.pos);
    this.slideBuf -= dt;
    this.postureBuf -= dt;
    this.postureT = this.postureT - dt > 1e-6 ? this.postureT - dt : 0; // (no float residue: 0.4 s less 24 frames of 1/60 left 1e-17, a frame more of the get-up that ate a press)
    this.dashBuf -= dt;
    this.slideCd -= dt;
    this.slideBoostCd -= dt;
    this.wallCd -= dt;
    this.landT = (this.landT || 0) - dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.airT = this.grounded ? 0 : this.airT + dt;
    this.airPeak = this.grounded ? this.pos.y : Math.max(this.airPeak, this.pos.y);
    for (const k in this.latches) this.latches[k] -= dt;
    // (riding a moving platform: move() carries us along with it; our own velocity stays ours)
    this.carry.set(0, 0, 0);
    this.groundVel.set(0, 0, 0);

    if (this.techs && !this.freeze) this.techs.passives(dt);
    if (this.mantle) { this.stepMantle(dt); return; }
    // an active movement tech owns the step (or an idle one claims it)
    if (this.techs && !this.freeze && this.techs.step(dt)) return;
    if (this.shape === 'blob') this.setShape(this.canStand() ? 'stand' : 'low'); // (a tech left us small)
    if (this.freeze) { this.jumpBuf = this.slideBuf = this.dashBuf = 0; this.jumpHeldLast = true; } // trial countdown
    const live = this.freeze ? 0 : 1;
    // a fight on the line (or anything else that takes the movement keys for its own use): the keys steer the fight, not the feet.
    // Crouch is left alone (it is the brace), and what the body was doing carries on with what it had.
    const locked = this.techs?.moveLock ? 1 : 0;
    if (locked) { this.jumpBuf = this.slideBuf = this.dashBuf = 0; this.jumpHeldLast = true; }
    const liveMove = live * (1 - locked);

    const f = this.forward(_v), r = this.right(_v2);
    const ix = liveMove * moveAxis(inp, 'moveX', 'KeyA', 'KeyD');
    const iz = liveMove * moveAxis(inp, 'moveY', 'KeyS', 'KeyW');
    const wish = new THREE.Vector3().addScaledVector(f, iz).addScaledVector(r, ix);
    if (wish.lengthSq() > 1) wish.normalize();
    const wishDir = wish.clone();

    const hv = new THREE.Vector3(this.vel.x, 0, this.vel.z);
    const hs = hv.length();
    const crouchKey = live && inp.isDown('KeyC');
    const sprintKey = liveMove && (inp.isDown('ShiftLeft') || inp.isDown('ShiftRight')) && !this.techs?.noSprint;
    this.walking = live && (inp.isDown('AltLeft') || inp.isDown('AltRight')); // hold to walk

    // ---- slide: crouch while moving fast on the ground ----
    // Starts above slideMinSpeed, or from a sprint that's still spinning up (so a
    // quick sprint-crouch never falls into a plain crouch). The boost is on a cooldown.
    const wantSlide = !locked && (this.slideBuf > 0 || (crouchKey && this.landT > 0)); // (a brace is not a slide)
    const fast = hs > M.slideMinSpeed || (sprintKey && hs > M.walkSpeed * 0.8);
    if (!this.sliding && wantSlide && this.grounded && fast && this.slideCd <= 0) {
      this.sliding = true;
      this.slideT = 0;
      this.slideDist = 0;
      this.slideBuf = 0;
      this.ev('slide.start', { speed: hs });
      if (hs > 1e-3) {
        if (this.slideBoostCd <= 0) { hv.setLength(Math.max(hs + M.slideBoost, M.slideSpeed)); this.slideBoostCd = M.slideBoostCooldown; }
        else hv.setLength(Math.max(hs, M.sprintSpeed));
      }
      this.sfx.slide();
    }

    // ---- posture: C cycles stand, crouch, prone (the owner, 2026-10-11: "C becomes a crouch toggle, and prone joins the cycle"). C while
    // fast is still the slide (above: it spends the press); held, C still keeps them low (out of a slide) as it did. Sprint stands up out
    // of the crouch (the Roll art, when it is theirs, takes the press first: techs run before this); off the ground the belly gives way.
    if (this.sliding) this.postureBuf = 0;
    else if (this.postureBuf > 0 && this.grounded && this.postureT <= 0) { this.postureBuf = 0; this.slideBuf = 0; this.cyclePosture(locked || !!this.techs?.get('carry')?.item); } // (CROSSING, Calissa, 2026-10-11: a pot in the hands keeps them off the belly, stand and crouch only as on the line: lying down with one, or set down on the way, read as a flop; tools/proneholster.js)
    if (this.posture === 'crouch' && sprintKey && iz > 0 && this.grounded && this.canStand()) this.setPosture('stand');
    if (this.posture === 'prone' && !this.grounded && this.airT > 0.2) { this.posture = 'crouch'; this.postureT = 0; }
    // capsule: low while sliding or crouching (and while there's no headroom to stand), flat while prone and while getting up from it
    const wantLow = this.sliding || this.posture !== 'stand' || (crouchKey && this.grounded) || (this.low && crouchKey);
    const wantShape = !this.sliding && (this.posture === 'prone' || (this.postureT > 0 && this.shape === 'prone')) ? 'prone' : wantLow ? 'low' : 'stand';
    if (wantShape !== this.shape && this.shape !== 'blob' && (HALVES[wantShape] < HALVES[this.shape] || this.fits(this.pos, wantShape))) this.setShape(wantShape);
    else if (wantShape === 'stand' && this.shape === 'prone' && this.fits(this.pos, 'low')) this.setShape('low'); // (no room to stand: as far up as there is)
    this.crouching = this.low && !this.sliding && this.grounded;
    this.prone = this.posture === 'prone';
    // sprint in any direction except backwards
    this.sprinting = sprintKey && !this.walking && iz >= 0 && (iz > 0 || ix !== 0) && adsT < 0.3 && !wantsFire && !this.low;

    // ---- jumps: ground (with coyote time), wall jump, air jump ----
    let jumped = false;
    this.coyote = this.grounded ? M.coyoteTime : this.coyote - dt;
    this.jumpBuf = liveMove && inp.isDown('Space') && this.jumpHeldLast !== true ? M.jumpBuffer : this.jumpBuf - dt;
    this.jumpHeldLast = inp.isDown('Space');
    if (this.grounded) { this.airJumps = M.airJumps; this.dashCharges = M.dashCharges; }
    const rising = this.postureT > 0 && this.posture !== 'prone'; // (getting up off the belly: Space now waits in its buffer for the end, not eaten)
    if (this.jumpBuf > 0 && !rising && (this.shape === 'prone' || this.postureT > 0)) { if (this.posture === 'prone' && this.postureT <= 0) this.setPosture(this.fits(this.pos, 'low') ? 'crouch' : 'prone'); this.jumpBuf = 0; } // (from the belly, Space gets up to the crouch: no jump)
    if (this.jumpBuf > 0 && !rising) {
      if (this.wallrun) {
        this.wallJump(hv, wishDir);
        jumped = true;
        this.ev('move.jump', { kind: 'wall' });
      } else if (this.coyote > 0) {
        if (iz > 0 && this.tryMantle(M.mantleJumpMin, M.jumpVelocity)) return;
        this.vel.y = M.jumpVelocity;
        this.coyote = 0;
        jumped = true;
        this.ev('move.jump', { kind: this.sliding ? 'slide' : 'ground', speed: hs });
        if (this.sliding) {
          this.ev('slide.end', { dur: this.slideT, dist: this.slideDist || 0, why: 'jump' });
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
        this.sfx.airJump();
        this.airJumpPulse = true; // (the animation reads and clears it)
        jumped = true;
        this.ev('move.jump', { kind: 'air' });
      }
      if (jumped) { this.jumpBuf = 0; this.grounded = false; if (this.posture === 'crouch' && this.canStand()) this.setPosture('stand'); } // (a jump from the crouch stands them up, where there is room)
    }

    // ---- wallrun ----
    if (this.wallrun && !jumped) this.stepWallrun(dt, hv, iz);
    else if (!this.grounded && !jumped && !this.wallrun && iz > 0 && this.wallCd <= 0 && this.airT > 0.06) this.tryWallrun(hv);

    // ---- horizontal velocity ----
    if (this.wallrun) {
      // handled by stepWallrun
    } else if (this.sliding) {
      this.slideT += dt;
      this.slideDist = (this.slideDist || 0) + hs * dt;
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
      // (the time limit only applies once you're down to sprint speed: a fast slide lasts)
      const timedOut = this.slideT > M.slideMaxTime && !downhill && nsp < M.sprintSpeed + 0.5;
      if (nsp < M.crouchSpeed + 0.3 || timedOut || release || this.airT > 0.15) {
        this.ev('slide.end', { dur: this.slideT, dist: this.slideDist || 0, why: release ? 'release' : timedOut ? 'time' : 'speed' });
        this.sliding = false;
        this.slideCd = M.slideCooldown;
      }
    } else if (this.dashT > 0) {
      this.dashT -= dt; // the dash owns the velocity for its duration
    } else {
      let speed = this.shape === 'prone' ? (this.postureT > 0 ? 0 : M.proneSpeed) : this.crouching ? M.crouchSpeed : this.sprinting ? M.sprintSpeed * (iz > 0 ? 1 : M.strafeSprintMult) : this.walking ? M.walkSlowSpeed : M.walkSpeed;
      speed *= THREE.MathUtils.lerp(1, M.adsSpeedMult, adsT);
      speed *= this.techs?.speedMult ?? 1;
      speed *= this.wade; // (the place's: world/well/bowl.js's rim shallows)
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
      if (this.shape === 'prone' && this.grounded) this.crawlReach(hv); // (the body ahead meets a wall before the capsule does)
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
        this.sfx.dash();
        this.ev('move.dash', { speed: hv.length() });
        this.dashFx(d);
      } else {
        this.sfx.fizzle();
        this.game?.lachrimeterTube?.pulse();
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
    if (!this.grounded && !this.wallrun && iz > 0 && this.vel.y < M.mantleRiseMax && this.tryMantle(M.mantleMin, this.vel.y)) return;
    // walking or running into a low wall (above what the feet step up by themselves): step over it without stopping
    // (and pinned against a lip the controller's own autostep should have taken but did not, 0.08 m up: an eighth of a second pinned, the
    // owner's R6 at a 0.23 m step in the basement, v132; the step-over is the same move, so the core movement is unchanged elsewhere)
    this.pinT = this.grounded && !this.sliding && iz > 0 && hs < 0.4 * M.walkSpeed ? (this.pinT || 0) + dt : 0; // (pushing on, getting nowhere: the walls take the speed, and the body only shivers in place)
    if (this.grounded && !jumped && !this.sliding && iz > 0 && (hs > 0.8 || this.pinT > 0.12) && this.tryMantle(this.pinT > 0.12 ? 0.08 : M.stepHeight - 0.02, 0, true)) return;

    // slides and dashes bowl clapperjars over; otherwise they just jostle
    this.critters(hv);

    this.move(dt);
  }

  // ---- the parts (courier/player/) ------------------------------------------------
  // Each method below hands this Player to its part, the module that holds its body. The class keeps every name: the techs, the tools, the
  // siblings (coop/sibling.js builds a Player of its own and replaces `respawn`) and the stress test (which wraps `move`) call them, and the
  // parts call each other through them.
  // the capsule and the posture: capsule.js
  setLow(low) { this.setShape(low ? 'low' : 'stand'); }
  setShape(kind) { setShape(this, kind); }
  canStand() { return canStand(this); }
  fits(p, low) { return fits(this, p, low); }
  embedded() { return embedded(this); }
  embeddedBy() { return embeddedBy(this); }
  setPosture(to) { setPosture(this, to); }
  cyclePosture(locked) { cyclePosture(this, locked); }
  crawlReach(hv) { crawlReach(this, hv); }
  // the rescue: rescue.js
  guard() { guard(this); }
  // the ground and the step: ground.js
  move(dt) { move(this, dt); }
  moverUnder() { return moverUnder(this); }
  wallHits() { return wallHits(this); }
  underfoot() { return underfoot(this); }
  floorBelow(x, z, yTop) { return floorBelow(this, x, z, yTop); }
  groundNormal() { return groundNormal(this); }
  critters(hv) { critters(this, hv); }
  // the air: air.js
  probeWall(dir, len) { return probeWall(this, dir, len); }
  inWater() { return inWater(this); }
  tryWallrun(hv) { tryWallrun(this, hv); }
  stepWallrun(dt, hv, iz) { stepWallrun(this, dt, hv, iz); }
  endWallrun(push) { endWallrun(this, push); }
  wallJump(hv, wishDir) { wallJump(this, hv, wishDir); }
  dashFx(dir) { dashFx(this, dir); }
  jumpFx(k = 1) { jumpFx(this, k); }
  // the mantle and the step-over: mantle.js
  tryMantle(minH, vy = 0, stepOnly = false) { return tryMantle(this, minH, vy, stepOnly); }
  stepMantle(dt) { stepMantle(this, dt); }
  // the look and the view: view.js
  look(dt, adsT) { look(this, dt, adsT); }
  updateBody(dt, combat) { updateBody(this, dt, combat); }
  updateCamera(dt, alpha, adsT, exclude) { updateCamera(this, dt, alpha, adsT, exclude); }
}
