// ---------------------------------------------------------------------------------------
// THE VIEW MODEL: where a held tool is drawn in first person. The Courier's body is still drawn in first person, but her arms hang
// below the view, so a blade or a brush held in the animated hand is out of sight. In first person a held tool is placed in the
// camera's own frame instead: at rest low at the right of the view, pointing ahead and a little up and across, and swung along a
// named ARC (a cut from right to left, its return, an overhead) whose fastest part falls in the blow's hit window. The hit tests
// read the tool where it is drawn, so what is seen to strike is what strikes.
//
// Prior art: the view-model weapons of every first-person game (Half-Life's crowbar, Skyrim's swing arcs, Mirror's Edge's body seen
// below a separate arm rig), and Zelda's first-person item view: the item at the lower right of the view, raised to use.
//
//   fpToolMatrix(camera, { draw, arc, u, bob, lift }, out)    arc: null | 'r2l' | 'l2r' | 'over' | 'raise'      u: 0..1 through the arc
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const DEG = Math.PI / 180;
const _m = new THREE.Matrix4(), _p = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the rest: the grip low at the right, the tool forward, up and a little across the view (tool frame: +X along it, +Z the palm side)
const REST = { pos: new THREE.Vector3(0.33, -0.39, -0.46), yaw: 18 * DEG, pitch: 24 * DEG, roll: -12 * DEG };
// the arcs, as yaw / pitch / roll of the whole tool about the shoulder, at the start and the end of the swing
const ARCS = {
  r2l: { from: [-75, 8, -60], to: [70, -12, -100] }, // (yaw: + turns the tool to the left of the view)
  l2r: { from: [65, 10, 70], to: [-70, -10, 40] },
  over: { from: [5, 95, 0], to: [-5, -55, 0] },
  raise: { from: [0, 0, 0], to: [-8, 70, 0] }, // (held up: a charge, a cast held back)
};
const SHOULDER = new THREE.Vector3(0.22, -0.28, -0.12);

/** The tool's world matrix in first person. `draw`: 0 below the view .. 1 held; `u`: how far through `arc`; `bob`: a walking sway. */
export function fpToolMatrix(camera, { draw = 1, arc = null, u = 0, bob = 0, lift = 0 }, out) {
  let yaw = REST.yaw, pitch = REST.pitch, roll = REST.roll;
  if (arc && ARCS[arc]) {
    const A = ARCS[arc], k = arc === 'raise' ? u : smooth(0, 1, u);
    yaw += THREE.MathUtils.lerp(A.from[0], A.to[0], k) * DEG;
    pitch += THREE.MathUtils.lerp(A.from[1], A.to[1], k) * DEG;
    roll += THREE.MathUtils.lerp(A.from[2], A.to[2], k) * DEG;
  }
  // the tool turns about the shoulder; its grip is at the rest point, relative to that shoulder
  _e.set(pitch, yaw, roll, 'YXZ');
  _q.setFromEuler(_e);
  // (the tool's +X is along it; at zero angles it points straight ahead (-Z of the camera))
  const base = _p.makeBasis(_v.set(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  _m.compose(SHOULDER, _q, _one).multiply(new THREE.Matrix4().makeTranslation(REST.pos.x - SHOULDER.x, REST.pos.y - SHOULDER.y, REST.pos.z - SHOULDER.z)).multiply(base);
  // drawn up from below the view, and a little sway
  _m.premultiply(new THREE.Matrix4().makeTranslation(Math.sin(bob) * 0.012, -0.55 * (1 - draw) + Math.abs(Math.cos(bob)) * 0.01 + lift, 0));
  camera.updateMatrixWorld();
  return out.multiplyMatrices(camera.matrixWorld, _m);
}

/** The arc a blow plays, and how far through it, from a clip time and its hit window (the fastest part of the arc in the window). */
export function arcAt(t, hit, dur) {
  const a = Math.max(0, hit[0] - 0.12), b = Math.min(dur, hit[1] + 0.1);
  return THREE.MathUtils.clamp((t - a) / (b - a || 1), 0, 1);
}
