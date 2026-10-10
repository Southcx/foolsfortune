// ---------------------------------------------------------------------------------------
// CLIP LAYERS: three ways of laying one of the suite's clips over the Courier that a plain sample and blend (animator.js) lack.
//   IN PLACE   the clip's travel taken out of its hips (casebook rule 19: re-root): the hips' offset from the clip's own first frame
//              is subtracted on the axes asked for, so a clip that leaps or climbs plays on a body the physics is already moving.
//   UNTURNED   the clip's turn taken out of its hips: a clip that turns the body round (Trav_WallJump's half turn) plays facing
//              ahead, because the game owns the body's yaw (player.js turns it toward the way it goes).
//   ADDITIVE   the clip's change from one of its own frames, laid over whatever is playing on the masked bones (a recoil over any
//              stance): each bone's delta from the reference frame, scaled by the weight, multiplied onto the pose underneath.
//
// Prior art: Unreal's additive animation (local space: delta = inverse(reference) * pose, applied as pose * delta) and Unity's additive
// layers, the standard way hit reacts and breathing ride over a stance; root-motion extraction as both engines do it (the hips' travel
// from the clip's first frame taken out, and given to the capsule instead). Uncharted 2's GDC talk on re-rooting traversal clips.
//
//   inPlace(C, pose, name, t, axes = 'xz')            pose is name sampled at t; its hips' travel since frame 0 removed on those axes
//   unturn(ch, pose, name, t)                          the hips' yaw since frame 0 taken out of pose (and of its hips' offset)
//   turnOf(ch, name)                                   per frame, how far the clip's hips have turned since frame 0 (rad, + toward
//                                                      the body's left, unwrapped; measured once a clip)
//   additive(C, base, name, t, t0, w, mask, flip)      base *= w x (name at t relative to name at t0) on the masked bones; flip
//                                                      reverses the delta (a blow from behind lurches forward instead of back)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Hips' position at time t of a clip (one-shot clamp), into out (3 numbers). */
function hipsAt(c, fps, t, out) {
  const n = c.n, f = Math.min(Math.max(t, 0) * fps, n - 1), i = Math.min(Math.floor(f), Math.max(0, n - 2)), a = n > 1 ? f - i : 0, j = Math.min(n - 1, i + 1);
  for (let k = 0; k < 3; k++) out[k] = c.p[i * 3 + k] + (c.p[j * 3 + k] - c.p[i * 3 + k]) * a;
  return out;
}
const _h = [0, 0, 0];

export function inPlace(C, pose, name, t, axes = 'xz') {
  const c = C.clips[name];
  if (!c) return pose;
  hipsAt(c, C.fps, t, _h);
  if (axes.includes('x')) pose.p[0] -= _h[0] - c.p[0];
  if (axes.includes('y')) pose.p[1] -= _h[1] - c.p[1];
  if (axes.includes('z')) pose.p[2] -= _h[2] - c.p[2];
  return pose;
}

const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _P = new THREE.Quaternion(), _f = new THREE.Vector3(), _y = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
/** The body-space yaw of the hips for a local hips rotation q (P: the hips' parent, rest: the hips' rest rotation in body space). */
function yawOf(q, P, restInv) {
  _f.set(0, 0, 1).applyQuaternion(_q1.copy(P).multiply(q).multiply(restInv));
  return Math.atan2(_f.x, _f.z);
}

export function unturn(ch, pose, name, t) {
  const C = ch.clips, c = C.clips[name], i = C.index.spine;
  if (!c || i === undefined) return pose;
  _P.copy(ch.mir[i].parentRest);
  const restInv = ch.restCharInv.get(ch.bones.spine);
  const y0 = yawOf(_q0.fromArray(c.q, i * 4), _P, restInv);
  const y1 = yawOf(_q0.fromArray(pose.q, i * 4), _P, restInv);
  const d = y1 - y0;
  // (turn the hips back about the body's up, expressed in their parent's frame: P^-1 * Ry(-d) * P * q)
  _y.setFromAxisAngle(UP, -d);
  _q1.copy(_P).invert().multiply(_y).multiply(_P).multiply(_q0.fromArray(pose.q, i * 4)).normalize();
  _q1.toArray(pose.q, i * 4);
  // (the hips' offset turns with them)
  const x = pose.p[0], z = pose.p[2], cs = Math.cos(-d), sn = Math.sin(-d);
  pose.p[0] = x * cs + z * sn; pose.p[2] = -x * sn + z * cs;
  return pose;
}

const turns = new WeakMap();
export function turnOf(ch, name) {
  const C = ch.clips, c = C.clips[name], i = C.index.spine;
  if (!c || i === undefined) return null;
  if (turns.has(c)) return turns.get(c);
  _P.copy(ch.mir[i].parentRest);
  const restInv = ch.restCharInv.get(ch.bones.spine), y0 = yawOf(_q0.fromArray(c.q, i * 4), _P, restInv), out = new Float32Array(c.n);
  for (let f = 1; f < c.n; f++) { const d = yawOf(_q0.fromArray(c.q, (f * C.nb + i) * 4), _P, restInv) - y0 - out[f - 1]; out[f] = out[f - 1] + Math.atan2(Math.sin(d), Math.cos(d)); }
  turns.set(c, out);
  return out;
}

const bufs = new WeakMap();
export function additive(C, base, name, t, t0, w, mask, flip = false) {
  if (w <= 0.001 || !C.clips[name]) return base;
  let b = bufs.get(C);
  if (!b) bufs.set(C, (b = { r: C.pose(), p: C.pose() }));
  C.sample(name, t0, b.r, false);
  C.sample(name, t, b.p, false);
  const o = base.q, r = b.r.q, p = b.p.q;
  for (let k = 0, i = 0; k < C.nb; k++, i += 4) {
    const m = mask ? mask[k] * w : w;
    if (m <= 0.001) continue;
    // delta = inverse(ref) * pose (unit quaternions: the inverse is the conjugate)
    const rx = -r[i], ry = -r[i + 1], rz = -r[i + 2], rw = r[i + 3];
    const px = p[i], py = p[i + 1], pz = p[i + 2], pw = p[i + 3];
    let dx = rw * px + rx * pw + ry * pz - rz * py;
    let dy = rw * py - rx * pz + ry * pw + rz * px;
    let dz = rw * pz + rx * py - ry * px + rz * pw;
    let dw = rw * pw - rx * px - ry * py - rz * pz;
    if (flip) { dx = -dx; dy = -dy; dz = -dz; }
    if (dw < 0) { dx = -dx; dy = -dy; dz = -dz; dw = -dw; }
    // scaled toward identity by the weight (nlerp: the deltas are small)
    dx *= m; dy *= m; dz *= m; dw = 1 + (dw - 1) * m;
    const l = 1 / (Math.hypot(dx, dy, dz, dw) || 1);
    dx *= l; dy *= l; dz *= l; dw *= l;
    // base = base * delta
    const ax = o[i], ay = o[i + 1], az = o[i + 2], aw = o[i + 3];
    o[i] = aw * dx + ax * dw + ay * dz - az * dy;
    o[i + 1] = aw * dy - ax * dz + ay * dw + az * dx;
    o[i + 2] = aw * dz + ax * dy - ay * dx + az * dw;
    o[i + 3] = aw * dw - ax * dx - ay * dy - az * dz;
  }
  return base;
}
