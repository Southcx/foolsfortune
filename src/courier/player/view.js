// ---------------------------------------------------------------------------------------
// THE COURIER'S VIEW (part of courier/player.js): the look, the body's facing and the camera. The look: the mouse and the arrow keys turn
// the view (the touch camera's follow is courier/camfollow.js), Z takes first person and back, O the other shoulder, and the frame's
// presses (the slide, the posture, the dash, the latches the techs consume) are kept for the fixed step. The body's facing: first person
// locks it to the view, third person turns it toward the move, eased, unless in a combat stance. The camera, each frame: the recoil
// punch spring, the blend between first person and over the shoulder, the posture blends the animation reads, the eye (first person's
// bob, or the posed head crouched, sliding and mantling), the over-the-shoulder arm with its collision, the field of view, a scripted
// shot blended over (vfx/cinema.js) and the Veritome's lens.
//
// Prior art: the over-the-shoulder camera with a collision probe; the arrow keys' camera is docs/plans/PHOTO-MODE.md step 1.
//
//   look(P, dt, adsT)   updateBody(P, dt, combat)   updateCamera(P, dt, alpha, adsT, exclude)
//   (P: the Player, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../../core/physics.js';
import { T, DEG, shakeOf } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { camFollow } from '../camfollow.js';

const simRand = stream('courier/player'); // (the simulation's chance: core/rng.js, the same twice; the Player's one stream, whichever part asks)
const _v = new THREE.Vector3();
const _shotM = new THREE.Matrix4(), _shotQ = new THREE.Quaternion(), _shotR = new THREE.Quaternion(), _shotUp = new THREE.Vector3(0, 1, 0), _shotZ = new THREE.Vector3(0, 0, 1);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** The arrow keys' camera (PHOTO-MODE.md step 1): rad a real s turned and tilted, and the ease in (real s). */
const ARROWS = { yaw: 90 * DEG, pitch: 60 * DEG, ease: 0.15 };

export function look(P, dt, adsT) {
  const inp = P.input;
  const k = 0.0022 * T.camera.sensitivity * THREE.MathUtils.lerp(1, T.camera.adsSensMult, adsT) * P.lookScale.lock * P.lookScale.blade * (P.lookScale.brush ?? 1) * (P.lookScale.lens ?? 1) * (P.lookScale.shot ?? 1) * (P.lookScale.wheel ?? 1); // (wheel: the party's orders, held: coop/party.js)
  P.yaw -= inp.dx * k;
  P.pitch = THREE.MathUtils.clamp(P.pitch - inp.dy * k, -85 * DEG, 85 * DEG);
  // the arrow keys turn and tilt the camera as well as the mouse (docs/plans/PHOTO-MODE.md step 1; the setting visual.arrowCamera): left
  // and right 90 degrees a real second, up and down 60, each eased in over 0.15 s so a tap is a small pan
  const ar = T.visual.arrowCamera !== false && !P.game?.log?.typing ? ARROWS : null, ek = Math.min(1, dt / ARROWS.ease);
  const ax = ar ? (inp.isDown('ArrowLeft') ? 1 : 0) - (inp.isDown('ArrowRight') ? 1 : 0) : 0, ay = ar ? (inp.isDown('ArrowUp') ? 1 : 0) - (inp.isDown('ArrowDown') ? 1 : 0) : 0;
  P.arrowYaw = (P.arrowYaw ?? 0) + (ax - (P.arrowYaw ?? 0)) * ek; P.arrowPitch = (P.arrowPitch ?? 0) + (ay - (P.arrowPitch ?? 0)) * ek;
  if (Math.abs(P.arrowYaw) > 1e-4 || Math.abs(P.arrowPitch) > 1e-4) {
    P.yaw += P.arrowYaw * ARROWS.yaw * dt;
    P.pitch = THREE.MathUtils.clamp(P.pitch + P.arrowPitch * ARROWS.pitch * dt, -85 * DEG, 85 * DEG);
  }
  P.lookDX = inp.dx; P.lookDY = inp.dy;
  camFollow(P, dt, adsT); // (on touch, the view eases back behind a running Courier once the look thumb lifts: courier/camfollow.js)

  if (inp.wasPressed('KeyZ') && (P.game?.belt?.allows('firstPerson') ?? true)) P.view = P.fp ? 'tp' : 'fp'; // (every tool has its first person; lock-on is the middle button)
  // edge-triggered actions are latched here (per frame) and consumed by the fixed step
  if (inp.wasPressed('KeyC')) { P.slideBuf = T.movement.slideBuffer; if (P.grounded) P.postureBuf = T.movement.slideBuffer; }
  if (inp.wasPressed('ShiftLeft') || inp.wasPressed('ShiftRight')) P.dashBuf = 0.1;
  if (inp.wasPressed('KeyO')) P.shoulder *= -1; // (over-the-shoulder side)
  for (const code of ['KeyE', 'KeyC', 'Space', 'KeyG', 'KeyF', 'KeyV', 'Mouse0', 'KeyY']) if (inp.wasPressed(code)) P.latches[code] = 0.15;
  // Sprint pressed while crouched is a dodge (the Roll art reads the latch)
  if (inp.wasPressed('ShiftLeft') || inp.wasPressed('ShiftRight')) P.latches.Dodge = 0.2;
}

// body facing: FP locks to view; TP turns toward movement unless in combat stance
export function updateBody(P, dt, combat) {
  if (combat) P.combatTimer = T.movement.combatStanceTime;
  else P.combatTimer -= dt;
  const inCombat = P.combatTimer > 0;
  const hs = Math.hypot(P.vel.x, P.vel.z);
  let target = P.bodyYaw;
  let rate = T.movement.tpTurnSpeed;
  if (P.fp || inCombat) { target = P.yaw; rate *= 2.2; }
  else if (hs > 0.5) target = Math.atan2(P.vel.x, P.vel.z);
  const lock = P.techs?.faceYaw(); // (a ladder faces its ladder, a roll its roll)
  if (lock != null && !P.fp) P.bodyYaw = lock;
  else if (P.fp) P.bodyYaw = P.yaw;
  else {
    // eased turn with a speed cap and angular acceleration, so a 180 doesn't whip the upper body
    const err = wrap(target - P.bodyYaw);
    const maxW = (inCombat ? 2 : 1) * T.movement.tpMaxTurn * DEG;
    const wantW = THREE.MathUtils.clamp(err * rate, -maxW, maxW);
    const accel = maxW * 12 * dt;
    P.turnW = (P.turnW || 0) + THREE.MathUtils.clamp(wantW - (P.turnW || 0), -accel, accel);
    P.bodyYaw += Math.abs(P.turnW * dt) > Math.abs(err) ? err : P.turnW * dt;
  }
  P.aimYawOffset = THREE.MathUtils.clamp(wrap(P.yaw - P.bodyYaw), -80 * DEG, 80 * DEG);
  P.inCombat = inCombat || P.fp;
}

export function updateCamera(P, dt, alpha, adsT, exclude) {
  const C = T.camera, M = T.movement;
  P.renderPos.lerpVectors(P.prevPos, P.pos, alpha);

  // recoil punch spring (critically damped toward 0)
  const w = T.recoil.recoverSpeed;
  for (const c of ['x', 'y']) {
    const a = -w * w * P.punch[c] - 2 * w * P.punchV[c];
    P.punchV[c] += a * dt;
    P.punch[c] += P.punchV[c] * dt;
  }
  P.shake = Math.max(0, P.shake - dt * 3);
  P.fovPunch = THREE.MathUtils.damp(P.fovPunch, 0, 12, dt);

  const targetBlend = P.fp ? 0 : 1;
  const step = dt / Math.max(0.01, C.viewBlendTime);
  // (exact equality must hold still: the old ternary stepped away from 1 and back every frame)
  if (targetBlend > P.tpBlend) P.tpBlend = Math.min(1, P.tpBlend + step);
  else if (targetBlend < P.tpBlend) P.tpBlend = Math.max(0, P.tpBlend - step);
  P.shoulderBlend = THREE.MathUtils.damp(P.shoulderBlend, P.shoulder, 10, dt);
  const tb = P.tpBlend * P.tpBlend * (3 - 2 * P.tpBlend);

  // posture blends (also read by the character animation)
  P.slideBlend = THREE.MathUtils.damp(P.slideBlend, P.sliding ? 1 : 0, 14, dt);
  P.mantleBlend = THREE.MathUtils.damp(P.mantleBlend, P.mantle ? 1 : 0, 16, dt);
  P.dashBlend = THREE.MathUtils.damp(P.dashBlend, P.dashT > 0 ? 1 : 0, P.dashT > 0 ? 25 : 6, dt);
  P.crouchBlend = THREE.MathUtils.damp(P.crouchBlend, P.crouching ? 1 : 0, 12, dt);
  P.proneBlend = THREE.MathUtils.damp(P.proneBlend, P.shape === 'prone' ? 1 : 0, 6, dt);
  P.wallBlend = THREE.MathUtils.damp(P.wallBlend, P.wallrun ? P.wallrun.side : 0, 10, dt);

  const sh = P.shake * P.shake * shakeOf(); // (the setting visual.shake)
  const cf = P.camFx; // (what a cinematic asks of the camera: see vfx/cinema.js; all zero/one when nothing does)
  const pitch = P.pitch + P.punch.x + cf.pitch + (simRand() - 0.5) * sh * 0.02;
  const yaw = P.yaw + P.punch.y + cf.yaw + (simRand() - 0.5) * sh * 0.02;
  const cam = P.camera;
  // camera roll: tilt away from the wall while wallrunning, a touch into slides
  const rollWant = P.wallBlend * M.wallrunTilt * DEG * (1 - 0.6 * tb) + P.slideBlend * 4 * DEG * (1 - tb);
  P.roll = rollWant + cf.roll;
  cam.rotation.set(pitch, yaw + Math.PI, P.roll + (simRand() - 0.5) * sh * 0.01, 'YXZ');
  cam.updateMatrixWorld();

  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);

  // first person eye
  const hs = Math.hypot(P.vel.x, P.vel.z);
  const onFeet = P.grounded || !!P.wallrun;
  if (onFeet) P.bobPhase += hs * dt * 2.4;
  const bobAmt = C.fpHeadBob * Math.min(1, hs / 5) * (1 - adsT * 0.8) * (onFeet && !P.sliding ? 1 : 0);
  const fpPos = P.renderPos.clone();
  fpPos.y += C.eyeHeight + Math.abs(Math.sin(P.bobPhase)) * 0.03 * bobAmt;
  fpPos.addScaledVector(P.forward(_v), 0.1);
  fpPos.addScaledVector(P.right(_v), Math.sin(P.bobPhase) * 0.015 * bobAmt);
  // crouching, sliding and mantling: ride the posed head (last frame) so the eye never
  // ends up inside the body, then sit a little in front of it
  const posture = Math.max(P.slideBlend, P.crouchBlend, P.mantleBlend);
  if (P.headRel && posture > 0.001) {
    const head = P.renderPos.clone().add(P.headRel).addScaledVector(P.forward(_v), 0.14);
    head.y += 0.04;
    fpPos.lerp(head, posture);
  }

  // third person over-the-shoulder with collision
  const pivot = P.renderPos.clone();
  const drop = P.slideBlend * 0.55 + P.crouchBlend * 0.35 + P.proneBlend * 0.45; // (flat on the belly: the pivot 0.7 m up, by the body's top)
  pivot.y += C.tpPivotHeight - drop;
  P.techs?.camera(fpPos, pivot, dt);
  const dist = THREE.MathUtils.lerp(C.tpDistance, C.tpAdsDistance, adsT) * cf.dist;
  const shoulder = THREE.MathUtils.lerp(C.tpShoulder, C.tpAdsShoulder, adsT) * P.shoulderBlend + (cf.shoulder || 0); // (a big thing framed moves the camera aside: vfx/cinema.js)
  const off = new THREE.Vector3().addScaledVector(right, shoulder).addScaledVector(camUp, C.tpLift + (cf.lift || 0)).addScaledVector(fwd, -dist);
  const offLen = off.length();
  const dir = off.clone().divideScalar(offLen);
  const hit = P.physics.raycast(pivot, dir, offLen + C.collisionRadius, exclude, GROUPS.controllerQuery);
  let allowed = offLen;
  if (hit) allowed = Math.max(0.15, hit.distance - C.collisionRadius);
  P.camDist = allowed < P.camDist ? allowed : THREE.MathUtils.damp(P.camDist, allowed, 6, dt);
  const tpPos = pivot.addScaledVector(dir, P.camDist);
  // (against what it met: the eye kept a collision radius off the surface along its normal, not only along the ray; a ray grazing the
  // floor left the eye centimetres over it, the ground at eye height: Calissa measured 0.26 m in the Great Slip Jelly's frame)
  if (hit && P.camDist >= hit.distance - C.collisionRadius - 0.05) tpPos.addScaledVector(hit.normal, C.collisionRadius * (1 - Math.abs(dir.dot(hit.normal))));

  cam.position.lerpVectors(fpPos, tpPos, tb);
  const baseFov = THREE.MathUtils.lerp(THREE.MathUtils.lerp(C.fpFov, C.fpAdsFov, adsT), THREE.MathUtils.lerp(C.tpFov, C.tpAdsFov, adsT), tb);
  // speed widens the view a little (sprint, slides, wallruns, big hops)
  const speedFov = THREE.MathUtils.clamp((hs - M.walkSpeed) / (M.maxSpeed - M.walkSpeed), 0, 1) * C.speedFov;
  P.sprintFov = THREE.MathUtils.damp(P.sprintFov || 0, speedFov, 6, dt);
  cam.fov = baseFov / (P.scopeZoom || 1) + P.fovPunch + P.sprintFov - 4 * (P.chargeLevel || 0) + cf.fov; // (a scope narrows it: the Carbine's, tools/psygun/variantplay.js)
  // a scripted shot (a ceremony's camera): blended over the one above
  const cs = P.camShot;
  if (cs && cs.k > 0.001) {
    const k = cs.k * cs.k * (3 - 2 * cs.k);
    _shotM.lookAt(cs.pos, cs.look, _shotUp);
    _shotQ.setFromRotationMatrix(_shotM).multiply(_shotR.setFromAxisAngle(_shotZ, cs.roll));
    cam.position.lerp(cs.pos, k);
    cam.quaternion.slerp(_shotQ, k);
    cam.fov += cs.fov * k;
  }
  // the Veritome's lens: its zoom, eased in
  if (P.lens?.k > 0) cam.fov = THREE.MathUtils.lerp(cam.fov, P.lens.fov, P.lens.k);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  P.fpWeight = 1 - tb;
  P.landedOut = P.landed;
  P.landed = 0;
}
