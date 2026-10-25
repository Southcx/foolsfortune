// ---------------------------------------------------------------------------------------
// THE BONE HELPERS (part of courier/character.js): what the Character does to a bone, or to a chain of two, the maths every pose step
// shares. `rot` turns a bone about an axis given in the character's rest frame, `rotW` about a world axis through its own origin,
// `turnW` by a world rotation, `setWorldQuat` sets it to one; `aimBone` rotates a bone in the world so its child lands on a point;
// `solve2` is analytic two-bone IK (the middle joint bends toward a pole, never quite straight) and `solveLeg` is it for a leg;
// `handQuat` is the world rotation of a hand whose fingers point along a direction with its palm facing another; `holdNeck` holds the
// head's turn about its own length against the chest to what a neck does (NECK_TURN).
//
// Prior art: the analytic two-bone solve every rig has (the law of cosines, the bend chosen by a pole: the pole targets of Maya's and
// Blender's IK handles).
//
//   rot(ch, bone, axisChar, angle)   rotW(ch, bone, axisWorld, angle)   turnW(ch, bone, qWorld)   setWorldQuat(ch, bone, qWorld)
//   aimBone(ch, bone, child, point)   solve2(ch, upper, mid, end, a, b, target, pole)   solveLeg(ch, leg, target, pole)
//   handQuat(ch, arm, dirWorld, palmWorld) -> a Quaternion     holdNeck(ch)
//   (ch: the Character, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEG } from '../../core/config.js';
import { _v1, _q1, _q2 } from './scratch.js';

const NECK_TURN = 64 * DEG; // the most the head turns on the neck against the chest (a neck's own range is about 70 to 80: the pose audit holds it to 70)
const _s2S = new THREE.Vector3(), _s2T = new THREE.Vector3(), _s2P = new THREE.Vector3(), _s2E = new THREE.Vector3(); // (solve2's)
const _abP = new THREE.Vector3(), _abC = new THREE.Vector3(), _abT = new THREE.Vector3(), _abQ1 = new THREE.Quaternion(), _abQ2 = new THREE.Quaternion(), _abQ3 = new THREE.Quaternion(); // (aimBone's)

export function rot(ch, bone, axisChar, angle) {
  if (!angle) return;
  _v1.copy(axisChar).applyQuaternion(ch.restCharInv.get(bone));
  _q1.setFromAxisAngle(_v1.normalize(), angle);
  bone.quaternion.multiply(_q1);
}

/** Rotate a bone about a world-space axis through its own origin. */
export function rotW(ch, bone, axisWorld, angle) {
  if (!angle) return;
  bone.parent.getWorldQuaternion(_q1).invert();
  _v1.copy(axisWorld).applyQuaternion(_q1);
  bone.quaternion.premultiply(_q2.setFromAxisAngle(_v1.normalize(), angle));
}

/** Apply a world-space rotation to a bone (about its origin). */
export function turnW(ch, bone, qWorld) {
  bone.parent.getWorldQuaternion(_q1);
  const qp = _q2.copy(_q1).invert().multiply(qWorld).multiply(_q1);
  bone.quaternion.premultiply(qp);
}

export function setWorldQuat(ch, bone, qWorld) {
  bone.parent.getWorldQuaternion(_q1).invert();
  bone.quaternion.copy(_q1.multiply(qWorld));
}

/** The head's turn about its own length against the chest (spine003), from rest (the pose audit's neck measure), held to NECK_TURN by
 *  turning the head back about its own length: a look laid over a clip's own swing went to 88 degrees. */
export function holdNeck(ch) {
  const B = ch.bones;
  ch.root.updateMatrixWorld(true);
  ch._neckRest ||= ch.restCharQ.get(B.spine003).clone().invert().multiply(ch.restCharQ.get(B.head)).invert();
  B.spine003.getWorldQuaternion(_q1); B.head.getWorldQuaternion(_q2);
  _q1.invert().multiply(_q2).premultiply(ch._neckRest);
  if (_q1.w < 0) _q1.set(-_q1.x, -_q1.y, -_q1.z, -_q1.w);
  const turn = 2 * Math.atan2(_q1.y, _q1.w), over = Math.abs(turn) - NECK_TURN;
  if (over > 0) ch.rotW(B.head, _v1.set(0, 1, 0).applyQuaternion(_q2), -Math.sign(turn) * over); // (about the head's own length)
}

export function solveLeg(ch, leg, target, pole) { ch.solve2(leg.thigh, leg.shin, leg.foot, leg.a, leg.b, target, pole); }

// analytic two-bone IK: the mid joint bends toward `pole`
export function solve2(ch, upper, mid, end, a, b, target, pole) {
  const S = upper.getWorldPosition(_s2S);
  const toT = _s2T.subVectors(target, S);
  let d = toT.length();
  const dir = toT.divideScalar(d || 1);
  // (never fully straight: a limb at its full length has no bend direction, and hyperextends or flips on the next frame)
  d = THREE.MathUtils.clamp(d, Math.abs(a - b) + 1e-3, (a + b) * 0.99);
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const pv = _s2P.subVectors(pole, S);
  pv.addScaledVector(dir, -pv.dot(dir));
  if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0).addScaledVector(dir, dir.y);
  pv.normalize();
  const elbow = _s2E.copy(S).addScaledVector(dir, x).addScaledVector(pv, h);
  ch.aimBone(upper, mid, elbow);
  ch.aimBone(mid, end, _s2E.copy(S).addScaledVector(dir, d)); // (the elbow is set by now: its scratch reused for the end)
}

// rotate `bone` (in world space) so that `child` lands on `point`
export function aimBone(ch, bone, child, point) {
  bone.updateMatrixWorld(true);
  const p = bone.getWorldPosition(_abP);
  const c = child.getWorldPosition(_abC);
  const from = c.sub(p).normalize();
  const to = _abT.copy(point).sub(p).normalize();
  const swing = _abQ1.setFromUnitVectors(from, to);
  const wq = bone.getWorldQuaternion(_abQ2);
  const parentQ = bone.parent.getWorldQuaternion(_abQ3);
  bone.quaternion.copy(parentQ.invert().multiply(swing.multiply(wq)));
  bone.updateMatrixWorld(true);
}

/** World rotation for a hand whose fingers point along dirWorld with the palm facing palmWorld. */
export function handQuat(ch, arm, dirWorld, palmWorld) {
  const y1 = dirWorld.clone().normalize();
  const n1 = palmWorld.clone().addScaledVector(y1, -palmWorld.dot(y1)).normalize();
  const y0 = new THREE.Vector3(0, 1, 0);
  const n0 = arm.palmLocal.clone().addScaledVector(y0, -arm.palmLocal.dot(y0)).normalize();
  const M0 = new THREE.Matrix4().makeBasis(y0, n0, new THREE.Vector3().crossVectors(y0, n0));
  const M1 = new THREE.Matrix4().makeBasis(y1, n1, new THREE.Vector3().crossVectors(y1, n1));
  return new THREE.Quaternion().setFromRotationMatrix(M1.multiply(M0.transpose()));
}
