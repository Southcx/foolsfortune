// ---------------------------------------------------------------------------------------
// THE DRAW: how a worn tool comes into the hand, shared by every tool that is worn (the Sondelass across the back, the Soul Brush at
// the hip). The first part of the draw (up to `hold`) the hand REACHES for the grip where the tool is worn (a light IK: the hand goes
// to a point, the elbow bends toward a pole), the shoulders turning to help; then the tool is taken and WHIPPED round to where the
// animation holds it, along a curve through a point beside the body (a quadratic bezier), the hand's turn eased from the holster's to
// the clip's. Putting it away is the same, backwards. Past the draw, the tool simply rides the animated hand (tools/grip.js).
//
// Prior art: the holster draws of third-person shooters (Uncharted, Gears: a reach, a grab, a whip into the ready pose, all in about a
// quarter of a second) and the katana draws of Sekiro and Ghost of Tsushima (the cross-draw from the left hip).
//
//   const phase = drawHands(ch, grip, holsterWorld, drawT, { hold, twist, lean, via, pole, out })
//       -> 'worn' | 'reach' | 'whip' | 'held'      `out` (Matrix4) is where the tool is this frame ('held': in the hand)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { handFromTool } from './grip.js';

const DEG = Math.PI / 180;
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _g = new THREE.Vector3(), _gq = new THREE.Quaternion(), _a = new THREE.Vector3(), _aq = new THREE.Quaternion();

/**
 * @param holster  the tool's world matrix where it is worn
 * @param o.hold   share of the draw spent reaching (0..1)
 * @param o.twist  how far the shoulders turn to reach it (deg, + to the character's right: a reach behind the back is negative)
 * @param o.lean   how far the chest bends toward it (deg)
 * @param o.via    the whip's middle point, in body space (+X the character's left, +Z forward)
 * @param o.pole   where the elbow points while reaching, in body space from the right shoulder
 */
export function drawHands(ch, grip, holster, drawT, { hold = 0.4, twist = -19, lean = 8, via = [-0.5, 1.05, -0.05], pole = [-0.5, -0.25, -0.35], out }) {
  const B = ch.bones, root = ch.root;
  const C = (x, y, z) => _v.set(x, y, z).applyQuaternion(root.quaternion);
  if (drawT <= 0.001) { out.copy(holster); return 'worn'; }
  const inHand = drawT > hold;
  const reachW = inHand ? 0 : smooth(0, hold, drawT);
  const whipU = inHand ? smooth(hold, 1, drawT) : 0;
  if (drawT < 1) {
    const k = inHand ? Math.sin(Math.PI * Math.min(1, whipU * 1.3)) * 0.6 + (1 - whipU) * 0.4 : reachW;
    if (k > 0.001) {
      const up = new THREE.Vector3(0, 1, 0);
      ch.rotW(B.spine001, up, twist * DEG * k);
      ch.rotW(B.spine003, up, twist * DEG * k);
      ch.rotW(B.spine001, C(-1, 0, 0).clone(), -lean * DEG * k);
      root.updateMatrixWorld(true);
    }
  }
  const polePt = ch.shoulder('R', new THREE.Vector3()).add(C(pole[0], pole[1], pole[2]));
  if (reachW > 0.001) {
    handFromTool(grip, holster, 'R', _p, 0, 0, 0, _q);
    ch.reachHand('R', _p, _q, reachW, 0, polePt);
    out.copy(holster);
    return 'reach';
  }
  if (whipU < 1) {
    handFromTool(grip, holster, 'R', _g, 0, 0, 0, _gq);
    B.handR.getWorldPosition(_a); B.handR.getWorldQuaternion(_aq);
    const side = root.position.clone().add(C(via[0], via[1], via[2]));
    const u = whipU, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    const p = _g.multiplyScalar(a).addScaledVector(side, b).addScaledVector(_a, c);
    const q = _gq.slerp(_aq, smooth(0.15, 0.85, u));
    ch.reachHand('R', p, q, 1, 0, polePt.lerp(B.forearmR.getWorldPosition(new THREE.Vector3()).add(_v.set(0, -0.12, 0)), u));
    out.multiplyMatrices(B.handR.matrixWorld, grip.R);
    return 'whip';
  }
  out.multiplyMatrices(B.handR.matrixWorld, grip.R);
  return 'held';
}
