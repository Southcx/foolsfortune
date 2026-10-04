// ---------------------------------------------------------------------------------------
// THE OPEN HOLD: the Veritome held open in both hands, as a tablet is held to read it or to take a picture with its rear camera. One
// pose, shared: the Veritome uses it while it is out (reading low at the chest; raised to the eye for the lens), and the Survey
// (cartography.js, N) uses it in third person, the Courier reading the ground off the open book while the pulse goes out.
//
// The arms come from a clip (castIdle: both forearms forward at the waist, from the Universal Animation Library), and the hands are
// then CLOSED ON THE EDGES of the open book (a light IK correction, as CLAUDE.md allows: a hand set on a handle): each palm behind its
// half, fingers round toward the spine, the thumb over the page. Where the book is comes first (bookFrame), the hands follow it.
//
// Prior art: holding an iPad up to photograph (both hands on the edges, the screen toward the eye, elbows in), the reading pose of
// every JRPG's menu-book idle (Dark Cloud 2's Max with his photo album, Ni no Kuni's Wizard's Companion), and FFXIV's Scholar, whose
// grimoire is held open in one hand and read from while it works.
//
//   bookFrame(ch, P, camera, { mode: 'read' | 'raise', k, fp }, out) -> out (Matrix4: the open book's world matrix)
//   holdBook(ch, model, w, { fp })        both hands onto the model's edges, weight w (the model already placed)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Vector3();
const lerp = THREE.MathUtils.lerp;

/** Where the open book is. 'read': low before the chest, tipped up to the eyes. 'raise' (k 0..1 of the way): up before the eyes. */
export function bookFrame(ch, P, camera, { mode = 'read', k = 0, fp = false } = {}, out = new THREE.Matrix4()) {
  const raise = mode === 'raise' ? k : 0;
  if (fp) {
    // in the camera's frame: low in the view, tipped toward the eye; raised, square before it
    camera.updateMatrixWorld();
    _x.set(1, 0, 0); _z.set(0, lerp(0.6, 0.05, raise), 1).normalize(); _y.crossVectors(_z, _x);
    const local = new THREE.Matrix4().makeBasis(_x, _y, _z).setPosition(0, lerp(-0.25, -0.02, raise), lerp(-0.5, -0.3, raise));
    return out.multiplyMatrices(camera.matrixWorld, local);
  }
  const yaw = P.bodyYaw ?? P.yaw;
  _f.set(Math.sin(yaw), 0, Math.cos(yaw));
  _r.set(-Math.cos(yaw), 0, Math.sin(yaw)); // (their right)
  ch.chestPoint(_c);
  _p.copy(_c).addScaledVector(_f, lerp(0.36, 0.34, raise)).addScaledVector(UP, lerp(-0.16, 0.28, raise));
  // the pages face them (+Z back toward them and up), the right half on their right
  _z.copy(_f).negate().addScaledVector(UP, lerp(0.95, 0.12, raise)).normalize();
  _x.copy(_r); _y.crossVectors(_z, _x).normalize(); _x.crossVectors(_y, _z);
  return out.makeBasis(_x, _y, _z).setPosition(_p);
}

const _e = new THREE.Vector3(), _in = new THREE.Vector3(), _palm = new THREE.Vector3(), _fing = new THREE.Vector3(), _q = new THREE.Quaternion(), _m3 = new THREE.Matrix3();

/** Both hands closed on the open book's outer edges (weight w), the fingers curled round behind it. */
export function holdBook(ch, model, w, { fp = false } = {}) {
  if (w <= 0.001) return;
  model.group.updateMatrixWorld(true);
  _m3.setFromMatrix4(model.group.matrixWorld);
  const bx = new THREE.Vector3(1, 0, 0).applyMatrix3(_m3).normalize(), by = new THREE.Vector3(0, 1, 0).applyMatrix3(_m3).normalize(), bz = new THREE.Vector3(0, 0, 1).applyMatrix3(_m3).normalize();
  for (const s of ['L', 'R']) {
    const sg = s === 'L' ? -1 : 1, arm = ch.arm[s];
    model.edgeWorld(s, _e);
    // palm behind the half, facing the reader (+Z); the fingers pointing in toward the spine and a little down
    _palm.copy(bz);
    _in.copy(bx).multiplyScalar(-sg);
    _fing.copy(_in).multiplyScalar(0.8).addScaledVector(by, -0.35).normalize();
    const q = ch.handQuat(arm, _fing, _palm);
    const at = _e.clone().addScaledVector(bz, -0.03).sub(arm.palmPt.clone().applyQuaternion(q));
    ch.reachHand(s, at, q, w, fp ? 1 : 0);
    // the fingers curl round the cover's edge
    for (const f of arm.fingers) f.quaternion.slerp(ch.rest.get(f).q, w * 0.35);
  }
}
