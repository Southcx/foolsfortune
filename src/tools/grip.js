// ---------------------------------------------------------------------------------------
// GRIP: where a held tool sits in a hand, measured once from an animation rather than guessed. The CC0 Universal Animation Library's
// one-handed poses (Sword_Idle, the torch idle) close the hand around a haft that lies along the knuckle line, so a tool glued to the
// hand in THAT frame rides every UAL sword and club clip without any IK. Measured here from the clip itself, for both hands (the left
// by mirroring the pose), as a socket: the tool's frame in the hand bone's frame.
//
// The tool's frame: +X along the haft (forward and up in the ready stance), +Z the way the palm faces, origin at the palm's centre a
// finger's thickness off it. Every held tool is modelled in that frame (the Sondelass, the Soul Brush).
//
// Prior art: the weapon sockets of every engine (Unreal's hand_r socket, Source's attachment points), measured here from the pose
// instead of placed by hand, and Zelda's one grip shared by every one-handed item.
//
//   const g = measureGrip(character)          g.R / g.RInv / g.L / g.LInv     (Matrix4: hand -> tool, and back)
//   handFromTool(g, M, 'R', outPos, x, y, z, outQuat)    the hand's world pose that puts the tool at world matrix M (the hand at x,y,z along it)
//   easeGrip(pos, quat, at, axis, fore)      a hand on a haft (or a knob) turned about the haft's axis through `at`, so the hand's length
//                                            meets the forearm's way (`fore`, world): a hand closing on a handle takes it from the side
//                                            its arm comes from, never with the wrist folded over (the pose audit, 2026-10-11: the off hand
//                                            on the cutlass's guard, the hook's shaft and the rod's crank had their wrists bent 85 to 115
//                                            degrees, the grip taken as the blade hand's socket). In place; -> the turn (rad)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();

export function measureGrip(ch, clip = 'torchIdle') {
  const B = ch.bones, C = ch.clips;
  const saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
  ch.root.position.set(0, 0, 0); ch.root.quaternion.identity();
  const frame = (mirror) => {
    ch.resetPose();
    const pose = C.sample(clip, 0, ch.P.tmp);
    ch.applyPose(mirror ? ch.mirrorPose(pose, ch.P.tmp2) : pose);
    ch.root.updateMatrixWorld(true);
    const s = mirror ? 'L' : 'R', arm = ch.arm[s];
    const hand = arm.hand, hm = hand.matrixWorld.clone();
    const hq = hand.getWorldQuaternion(new THREE.Quaternion()), hp = hand.getWorldPosition(new THREE.Vector3());
    const fing = B[`f_middle01${s}`].getWorldPosition(new THREE.Vector3()).sub(hp).normalize();
    const pn = arm.palmLocal.clone().applyQuaternion(hq);
    const X = new THREE.Vector3().crossVectors(fing, pn).normalize();
    if (X.z + X.y * 0.5 < 0) X.negate(); // (the haft lies forward and up in the ready stance, either hand)
    const Z = pn.clone().addScaledVector(X, -pn.dot(X)).normalize();
    if (mirror) Z.negate(); // (the left palm faces the tool from the other side)
    const Y = new THREE.Vector3().crossVectors(Z, X).normalize();
    const origin = arm.palmPt.clone().applyMatrix4(hm).addScaledVector(pn, 0.03);
    const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(origin);
    return hm.invert().multiply(G);
  };
  const R = frame(false), L = frame(true);
  ch.resetPose();
  ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ);
  ch.root.updateMatrixWorld(true);
  return { R, RInv: R.clone().invert(), L, LInv: L.clone().invert() };
}

/** A hand's world pose for a tool at world matrix M, the hand taking the tool at (x, y, z) in the tool's frame. */
export function handFromTool(grip, M, side, out, x = 0, y = 0, z = 0, quatOut = null) {
  _m2.copy(side === 'R' ? grip.RInv : grip.LInv);
  _m1.makeTranslation(x, y, z);
  _m1.premultiply(M).multiply(_m2);
  _m1.decompose(out, quatOut || _q, _s);
  return out;
}

const _a = new THREE.Vector3(), _h = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Quaternion();
/** A hand on a handle turned about the handle's axis (world unit `axis`, through world point `at`) until the hand's length (its local +Y)
 *  is as near the forearm's way (`fore`, world unit) as a turn about that axis brings it: the light IK of a hand closing on a haft. */
export function easeGrip(pos, quat, at, axis, fore) {
  _a.copy(axis).normalize();
  _h.set(0, 1, 0).applyQuaternion(quat); _h.addScaledVector(_a, -_h.dot(_a));
  _f.copy(fore); _f.addScaledVector(_a, -_f.dot(_a));
  if (_h.lengthSq() < 1e-8 || _f.lengthSq() < 1e-8) return 0;
  _h.normalize(); _f.normalize();
  const ang = Math.atan2(_s.crossVectors(_h, _f).dot(_a), _h.dot(_f));
  _r.setFromAxisAngle(_a, ang);
  quat.premultiply(_r);
  pos.sub(at).applyQuaternion(_r).add(at);
  return ang;
}
