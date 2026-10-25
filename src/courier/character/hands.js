// ---------------------------------------------------------------------------------------
// THE HANDS (part of courier/character.js): what the Character does with its hands and the gun after `animate`. `poseHands` is the
// pass: the draw (the hand reaches back to the holster at the small of the back, grabs, and whips the gun round the right side up to
// where the animation holds it), the chest turned so the barrel lines up with the crosshair, the gun arm alone swung to the aim when
// something pins the body, the gun placed (first person: the view-model's pose, the gun rising out of the holster as it is drawn), both
// hands on it, a hand flat on a wall or two on a ledge, then the hands and forearms kept out of the body (anim/standoff.js), each wrist
// within its range (anim/wristease.js), the hinges squared (anim/hinges.js) and the joint limits last (anim/rom.js: CLAUDE.md,
// Animation). `reachHand` sets a hand on a world pose by two-bone IK, the shoulder giving what the arm cannot reach; `handFromGun` and
// `heldGun` say where a hand has to be for the gun, and where the gun is for the hands.
//
// Prior art: two-hand weapon IK (a socket on the dominant hand, the support hand IK'd to the weapon's grip: the standard of third-person
// shooters) and a shoulder that gives toward a reach, as a posed figure's ball joint does.
//
//   reachHand(ch, side, pos, quat, w, shift, poleOverride)     handFromGun(ch, M, kind, pos, quat)     heldGun(ch, h, out) -> out
//   poseHands(ch, o)     (o: main.js handContext)       (ch: the Character, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, DEG } from '../../core/config.js';
import { GUN_POINTS } from './gunpoints.js';
import { UP, LR, _v1, _v2, _v3, _v4, _q1, _m1, smooth } from './scratch.js';

const STRETCH = 0.16; // how far a shoulder joint may travel toward a reach the arm alone cannot make
const _rhQ = new THREE.Quaternion(), _rhP = new THREE.Vector3(), _rhT = new THREE.Vector3(), _rhPole = new THREE.Vector3(), _rhS = new THREE.Vector3(), _rhSh = new THREE.Vector3(); // (reachHand's own: it runs a hand or two every frame, and made six objects a call)

/**
 * Reach a hand toward a world pose with weight w. The elbow bends toward where the
 * animation had it (a little down), so the solution stays on the animated side.
 * `shift` moves the shoulder onto the first-person camera rig (view-model arms) -
 * only in first person, where nothing but the hands is drawn.
 */
export function reachHand(ch, side, pos, quat, w, shift = 0, poleOverride = null) {
  if (w <= 0.001) return;
  if (ch.reachMark) ch.reached[side] = Math.max(ch.reached[side], w); // (a hand set on something this frame: the wrist's ease leaves its turn alone)
  const arm = ch.arm[side];
  const hq = arm.hand.getWorldQuaternion(_rhQ);
  const hp = arm.hand.getWorldPosition(_rhP);
  const target = _rhT.copy(hp).lerp(pos, w);
  const pole = poleOverride ? _rhPole.copy(poleOverride) : arm.fore.getWorldPosition(_rhPole).add(_v1.set(0, -0.12, 0));
  if (shift > 0 && ch.fpCam) {
    // first person: view-model arms. The shoulders hang off the camera, not the animated
    // body, so the hands never inherit the run cycle; only the hands are drawn anyway.
    const cq = ch.fpCam.quaternion;
    const S = _v1.set(-arm.side * 0.2, -0.3, 0.06).applyQuaternion(cq).add(ch.fpCam.position);
    const cur = arm.upper.getWorldPosition(_rhS);
    const sh = _rhSh.copy(S).sub(cur).multiplyScalar(shift);
    arm.upper.parent.getWorldQuaternion(_q1).invert();
    arm.upper.position.add(sh.applyQuaternion(_q1));
    arm.upper.updateMatrixWorld(true);
    pole.copy(S).add(_v3.set(-arm.side * 0.45, -0.35, 0).applyQuaternion(cq));
  }
  // the shoulder's ball joint: what the arm can't reach, the shoulder gives (up to STRETCH), the way
  // a posed figure's shoulder is pushed toward the reach
  if (!(shift > 0 && ch.fpCam)) {
    const S = arm.upper.getWorldPosition(_rhS);
    const d = S.distanceTo(target), L = (arm.a + arm.b) * 0.96;
    if (d > L) {
      const give = Math.min(d - L, STRETCH);
      const sh = _rhSh.copy(target).sub(S).normalize().multiplyScalar(give);
      arm.upper.parent.getWorldQuaternion(_q1).invert();
      arm.upper.position.add(sh.applyQuaternion(_q1));
      arm.upper.updateMatrixWorld(true);
    }
  }
  ch.solve2(arm.upper, arm.fore, arm.hand, arm.a, arm.b, target, pole);
  ch.setWorldQuat(arm.hand, hq.slerp(quat, w));
  arm.hand.updateMatrixWorld(true);
}

/**
 * Where a hand has to be for the gun at world matrix M. kind: 'R' right hand holding,
 * 'L' left hand supporting, 'LH' left hand holding, 'RS' right hand supporting.
 */
export function handFromGun(ch, M, kind, pos, quat) {
  const S = kind === 'R' ? ch.socketRInv : kind === 'L' ? ch.socketL : kind === 'LH' ? ch.socketLHInv : ch.socketRS;
  _m1.multiplyMatrices(M, S).decompose(pos, quat, _v4);
}

/** The gun as held: in the right hand, the left, or on its way between them (h 0..1). */
export function heldGun(ch, h, out) {
  const B = ch.bones;
  if (h <= 0.001) return out.multiplyMatrices(B.handR.matrixWorld, ch.socketR);
  if (h >= 0.999) return out.multiplyMatrices(B.handL.matrixWorld, ch.socketLH);
  const a = new THREE.Matrix4().multiplyMatrices(B.handR.matrixWorld, ch.socketR);
  const b = new THREE.Matrix4().multiplyMatrices(B.handL.matrixWorld, ch.socketLH);
  const pa = new THREE.Vector3(), qa = new THREE.Quaternion(), pb = new THREE.Vector3(), qb = new THREE.Quaternion();
  a.decompose(pa, qa, _v4); b.decompose(pb, qb, _v4);
  const k = smooth(0, 1, h);
  return out.compose(pa.lerp(pb, k), qa.slerp(qb, k), _v4.set(1, 1, 1));
}

/**
 * Hands and gun, after animate(). o: {
 *   drawT: 0 holstered .. 1 in hand (the hand reaches the hip first, then the gun comes up),
 *   upper: pistol layer weight, fw: first-person weight, fpPos/fpQ: first-person gun pose,
 *   aimPoint, reloading, leftOverride/leftBlend (first-person reload: support hand to the belt),
 *   wallPoint/wallNormal/wallSide, ledge {point, right}, mantleT
 * }
 */
export function poseHands(ch, o) {
  if (!ch.socketR) ch.computeSockets();
  if (!ch.holsterLocal) ch.computeHolster();
  const B = ch.bones, st = ch.st, root = ch.root;
  const HOLD = T.weapon.drawGrab;
  const inHand = o.drawT > HOLD;
  ch.reached.L = ch.reached.R = 0;
  const Mg = new THREE.Matrix4(), gp = new THREE.Vector3(), gq = new THREE.Quaternion();
  const hp = new THREE.Vector3(), hq = new THREE.Quaternion();
  const rq = root.quaternion;
  const C = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(rq); // char-space direction -> world
  // the draw: reach back to the small of the back (the shoulder turns back to help),
  // grab, and whip the gun round the right side up to where the animation holds it
  const reachW = inHand ? 0 : smooth(0, HOLD, o.drawT);
  const whipU = inHand ? smooth(HOLD, 1, o.drawT) : 0; // 0 at the holster .. 1 in the animated hand
  const twist = inHand ? Math.sin(Math.PI * Math.min(1, whipU * 1.3)) * 0.6 + (1 - whipU) * 0.4 : reachW;
  if (twist > 0.001 && o.drawT < 1) {
    const upW = _v3.set(0, 1, 0);
    ch.rotW(B.spine001, upW, -T.weapon.drawTwist * DEG * 0.5 * twist);
    ch.rotW(B.spine003, upW, -T.weapon.drawTwist * DEG * 0.5 * twist);
    ch.rotW(B.spine001, C(-1, 0, 0), -8 * DEG * twist); // lean back a touch into the reach
    root.updateMatrixWorld(true);
  }
  const holster = _m1.multiplyMatrices(B.spine.matrixWorld, ch.holsterLocal).clone();
  const hs = inHand ? st.hand : 0; // which hand holds it (0 right .. 1 left)
  const shR = ch.shoulder('R', new THREE.Vector3());
  const drawPole = shR.clone().add(C(-0.5, -0.25, -0.35)); // elbow out and back

  // 1) turn the chest so the barrel lines up with the crosshair
  const wAim = (o.upper || 0) * (inHand ? 1 : 0) * (o.reloading ? 0.3 : 1) * (1 - (o.fw || 0)) * (o.aimTurn ?? 1);
  if (wAim > 0.01 && o.aimPoint) {
    for (let it = 0; it < 2; it++) {
      ch.heldGun(hs, Mg).decompose(gp, gq, _v4);
      const bar = new THREE.Vector3(1, 0, 0).applyQuaternion(gq);
      const muzzle = GUN_POINTS.muzzle.clone().multiplyScalar(ch.gunScale).applyMatrix4(Mg);
      const want = o.aimPoint.clone().sub(muzzle);
      if (want.length() < 0.8) break;
      want.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(bar, want);
      const ang = 2 * Math.acos(THREE.MathUtils.clamp(q.w, -1, 1));
      const lim = 55 * DEG;
      const k = wAim * (ang > lim ? lim / ang : 1);
      ch.turnW(B.spine003, new THREE.Quaternion().slerp(q, k));
      root.updateMatrixWorld(true);
    }
  }

  // 1b) pinned to something (a ladder, a ledge): the gun arm alone swings to the aim, the torso stays
  if (o.aimArm === 'R' && inHand && (o.fw || 0) < 0.5 && o.aimPoint) {
    const k = smooth(HOLD, 1, o.drawT) * (o.upper || 0);
    if (k > 0.02) {
      const sh = ch.shoulder('R', new THREE.Vector3());
      const dir = o.aimPoint.clone().sub(sh).normalize();
      const pos = sh.clone().addScaledVector(dir, 0.66).addScaledVector(UP, -0.05); // (arm out straight: the shoulder gives what the arm can't)
      const x = dir.clone(), y = UP.clone().addScaledVector(dir, -UP.dot(dir)).normalize();
      const G = new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
      G.setPosition(pos);
      ch.handFromGun(G, 'R', hp, hq);
      ch.reachHand('R', hp, hq, k);
    }
  }

  // 2) the right hand: to the holster to draw / put away, else wherever the animation has it
  if (reachW > 0.001) {
    ch.handFromGun(holster, 'R', hp, hq);
    ch.reachHand('R', hp, hq, reachW, 0, drawPole);
  } else if (inHand && whipU < 1) {
    // the whip: a curve from the holster grip, out round the right hip, to the animated hand
    const gpos = new THREE.Vector3(), gquat = new THREE.Quaternion();
    ch.handFromGun(holster, 'R', gpos, gquat);
    const apos = B.handR.getWorldPosition(new THREE.Vector3()), aquat = B.handR.getWorldQuaternion(new THREE.Quaternion());
    const side = root.position.clone().add(C(-0.5, 1.05, -0.05));
    const u = whipU, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    const p = gpos.multiplyScalar(a).addScaledVector(side, b).addScaledVector(apos, c);
    const q = gquat.slerp(aquat, smooth(0.15, 0.85, u));
    ch.reachHand('R', p, q, 1, 0, drawPole.lerp(B.forearmR.getWorldPosition(new THREE.Vector3()).add(_v1.set(0, -0.12, 0)), u));
  }
  if (inHand) ch.heldGun(hs, Mg);
  else Mg.copy(holster);
  Mg.decompose(gp, gq, _v4);
  // first person: the view-model pose (the gun rises out of the holster as it's drawn)
  const fwG = (o.fw || 0) * (inHand ? smooth(HOLD, 0.9, o.drawT) : 0);
  if (fwG > 0 && o.fpPos) { gp.lerp(o.fpPos, fwG); gq.slerp(o.fpQ, fwG); }
  ch.gun.position.copy(gp);
  ch.gun.quaternion.copy(gq);
  ch.gun.updateMatrixWorld(true);

  // 3) hands on the gun wherever it went (a no-op in third person, where it's already in the hand)
  const shift = (o.fw || 0) > 0.5 ? 1 : 0;
  ch.fpCam = o.camera;
  // holding: the right hand while hs < 0.5, the left after; mid-swap both are on it
  const holdR = inHand ? 1 - smooth(0.55, 0.85, hs) : 0, holdL = inHand ? smooth(0.15, 0.45, hs) : 0;
  const swapping = hs > 0.001 && hs < 0.999;
  if (holdR > 0.001 && (fwG > 0.001 || swapping)) {
    ch.handFromGun(ch.gun.matrixWorld, 'R', hp, hq);
    ch.reachHand('R', hp, hq, holdR, shift);
  }
  if (holdL > 0.001 && (fwG > 0.001 || swapping)) {
    ch.handFromGun(ch.gun.matrixWorld, 'LH', hp, hq);
    ch.reachHand('L', hp, hq, holdL, shift);
  }
  // the support hand: on the grip when aiming, off it for reloads and contacts
  const supSide = hs < 0.5 ? 'L' : 'R';
  let wL = Math.max(o.upper || 0, fwG) * (inHand ? smooth(HOLD, 1, o.drawT) : 0) * Math.abs(1 - 2 * hs) * (o.aimArm ? 0 : 1); // (one-handed: the other hand is holding on)
  if (o.reloading && fwG < 0.5) wL = 0; // the reload clip drives it
  let contactL = 0, contactR = 0;
  // wall: the wall-side hand flat on the wall, a little ahead (unless it's holding the gun)
  const wallSide = o.wallSide > 0 ? 'R' : 'L';
  const wallW = st.aw * (o.wallPoint ? 1 : 0) * (1 - (wallSide === 'R' ? holdR : holdL));
  if (wallW > 0.01) {
    const n = o.wallNormal;
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
    const dir = fwd.clone().addScaledVector(UP, 0.8).addScaledVector(n, -fwd.dot(n)).normalize();
    const q = ch.handQuat(ch.arm[wallSide], dir, n.clone().negate());
    const p = o.wallPoint.clone().addScaledVector(n, 0.02).sub(ch.arm[wallSide].palmPt.clone().applyQuaternion(q));
    ch.reachHand(wallSide, p, q, wallW);
    if (wallSide === 'L') contactL = wallW; else contactR = wallW;
    // and the wall-side foot, while the run's cycle has it down, set on the wall (a light correction: a sole put on the surface it
    // is near, never more than a hand's breadth away; the sprint cycle is what moves the legs)
    const leg = ch.leg[wallSide], ck = smooth(0.45, 0.8, st.contact?.[wallSide] ?? 0) * st.aw * (o.wallPoint ? 1 : 0);
    if (ck > 0.01) {
      leg.foot.updateMatrixWorld(true);
      const F = leg.foot.getWorldPosition(_v1), off = _v2.subVectors(F, o.wallPoint).dot(n) - 0.07;
      if (Math.abs(off) < 0.22) {
        const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
        const tgt = F.clone().addScaledVector(n, -off * ck);
        const pole = leg.shin.getWorldPosition(new THREE.Vector3()).addScaledVector(n, 0.25).addScaledVector(fwd, 0.1);
        ch.solveLeg(leg, tgt, pole);
        ch.setWorldQuat(leg.foot, fq);
        leg.foot.updateMatrixWorld(true);
      }
    }
  }
  // ledge: both hands plant on the lip during the first part of the vault
  const ledgeW = (o.ledge ? st.mn : 0) * (1 - smooth(0.45, 0.75, o.mantleT ?? 1));
  if (ledgeW > 0.01) {
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
    for (const side of LR) {
      if ((side === 'R' ? holdR : holdL) > 0.5) continue;
      const sg = side === 'L' ? 1 : -1;
      const q = ch.handQuat(ch.arm[side], fwd, new THREE.Vector3(0, -1, 0));
      const p = o.ledge.point.clone().addScaledVector(o.ledge.right, -sg * 0.22).addScaledVector(fwd, 0.08)
        .sub(ch.arm[side].palmPt.clone().applyQuaternion(q)).add(new THREE.Vector3(0, 0.02, 0));
      ch.reachHand(side, p, q, ledgeW);
      if (side === 'L') contactL = Math.max(contactL, ledgeW); else contactR = Math.max(contactR, ledgeW);
    }
  }
  wL *= 1 - (supSide === 'L' ? contactL : contactR);
  if (wL > 0.001) {
    ch.handFromGun(ch.gun.matrixWorld, supSide === 'L' ? 'L' : 'RS', hp, hq);
    if (o.leftBlend > 0 && o.leftOverride) hp.lerp(o.leftOverride, o.leftBlend);
    ch.reachHand(supSide, hp, hq, wL, shift);
  }
  // flat fingers on a surface
  for (const [side, k] of [['L', contactL], ['R', contactR]]) {
    if (k <= 0.01) continue;
    for (const f of ch.arm[side].fingers) f.quaternion.slerp(ch.rest.get(f).q, k * 0.85);
  }
  ch.gunHeld = holdR > 0.5; // (techs leave a hand that's holding the gun alone)
  // the hands and forearms out of the body before what they hold is placed from them (anim/standoff.js): a hand holding the gun or set
  // on something by now (the draw, a wall, a ledge, the gun's support) stays where it is. Not in first person (the view-model's arms)
  const tp = (o.fw || 0) < 0.5, dtA = st.dt ?? 1 / 60;
  const tool = o.techs?.game?.belt?.inHand, tt = tool && tool.id !== 'psygun' ? o.techs.get?.(tool.id) : null, rides = tt && (tt.drawT ?? 0) > 0.02 ? (tt.ridesHand === undefined ? 'R' : tt.ridesHand) : null;
  if (tp) { ch.reachMark = false; ch.standoff.apply({ L: Math.max(ch.reached.L, holdL), R: Math.max(ch.reached.R, holdR) }); ch.reachMark = true; }
  o.techs?.hands(ch, o);
  if (!o.techs?.unitFrame?.()) ch.guardKnees((1 - Math.min(1, o.techs?.override || 0)) * (1 - (st.crawlW || 0)));
  // (each wrist within its range, anim/wristease.js: a hand something rides or the IK set (the tool's hand, the gun's, a hand on a haft, a
  //  pot or a wall) keeps its place and turn and the elbow swings for it; then the knees and elbows back on their hinge, the joints
  //  where they are, the legs and the arms always (anim/hinges.js: every clip set is repaired); then a free hand's palm turned about its
  //  fingers' line and a bend past range eased back, and that free hand kept out of the body once more, its fingers moved)
  const bound = { L: Math.max(ch.reached.L, holdL, rides === 'L' ? 1 : 0), R: Math.max(ch.reached.R, holdR, rides === 'R' ? 1 : 0) };
  if (tp) ch.wrists.apply(dtA, bound);
  ch.hinges.apply(dtA, 1, 1);
  if (tp) {
    ch.wrists.relax(dtA, bound);
    ch.reachMark = false; ch.standoff.apply(bound); ch.reachMark = true;
  }
  // (the limits last, after the knee guard: CLAUDE.md. A tech that owns the body, a ladder, a pole, has posed the hands to its own
  //  handholds, and keeps them; one whose hands are a tool's, `limitsLast` (the hook's line: tools/sondelass/grapple.js), does not.
  //  CROSSING, Calissa's: the hang's fingers were 5 to 42 degrees past their range, unclamped)
  if ((o.techs?.override || 0) < 0.5 || o.techs?.active?.limitsLast) ch.limits.apply();
  root.updateMatrixWorld(true);
}
