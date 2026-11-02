// ---------------------------------------------------------------------------------------
// A MECH'S CLIP MAP, RETARGETED (plain name: a mech's clip map; South, 2026-11-02: "retarget Courier animations or build from scratch?
// Both?"): the Courier's own clips (their suite, the UAL and CMU packs: courier/anim/suite.js loadClips, `game.clipPack`) played on a
// mech's joint tree (vfx/mechs/partsbody.js). Each mech joint follows one of the Courier's bones (BONE_MAP), rigidly offset from it
// by its rest-offset (O = Wr^-1 Mr: the bone's model-space turn in the reference pose against the joint's at its rest), so the
// reference pose (REF, the masculine idle's first frame) is the mech's rest exactly and every clip's change from it is the mech's:
//   M_joint(t) = W_bone(t) O_joint        local_joint = M_parent^-1 M_joint = O_parent^-1 W_parentBone^-1 W_bone O_joint
// The two rigs share model space (+Y up, +Z the front, +X the left: courier.glb's armature has no turn of its own), so no axis table is
// needed. The clips are read, never written: sampled straight out of the pack's frames (lazily decoded, the Courier's own), nothing
// renamed or cloned, nothing touched on the Courier's animator.
// Prior art: Unity's Humanoid (a bone map and the muscle space's rest offsets), Unreal's IK Retargeter (a chain a joint, retargeted in
// model space from a matched reference pose), the Courier's own decode (courier/anim/animator.js Clips.sample: the same nlerp a frame).
//
//   BONE_MAP   COURIER_PARENT   REF   const R = new MechRetarget(pack)   R.has(name)   R.sample(slot, name, t, loop) (into slot)
//   R.blend(into, from, w)   R.bind(joints) (the rest-offsets, once a build)   R.apply(pose, joints, weights) (slerps each joint)
//   R.rootY(slot) (the hips' height over the reference's, m at the Courier's scale)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The Courier's bones a mech reads, in parent-first order, each with its parent (courier.glb's tree: the arms off spine.003, the legs off spine). */
export const COURIER_PARENT = {
  spine: null, spine001: 'spine', spine002: 'spine001', spine003: 'spine002', spine004: 'spine003', spine005: 'spine004', head: 'spine005',
  upper_armL: 'spine003', forearmL: 'upper_armL', handL: 'forearmL', upper_armR: 'spine003', forearmR: 'upper_armR', handR: 'forearmR',
  thighL: 'spine', shinL: 'thighL', footL: 'shinL', thighR: 'spine', shinR: 'thighR', footR: 'shinR',
};
const BONES = Object.keys(COURIER_PARENT);
/** The mech joint -> [the Courier's bone it follows, the mech joint it hangs from (null: the body)]. The wrist follows the hand (the
 *  mech's hand joint holds the grip's twist at rest); the chest the bone the arms hang from, so arm and chest agree. */
export const BONE_MAP = {
  pelvis: ['spine', null], waist: ['spine002', 'pelvis'], chest: ['spine003', 'waist'], neck: ['spine005', 'chest'], head: ['head', 'neck'],
  shoulderL: ['upper_armL', 'chest'], elbowL: ['forearmL', 'shoulderL'], wristL: ['handL', 'elbowL'],
  shoulderR: ['upper_armR', 'chest'], elbowR: ['forearmR', 'shoulderR'], wristR: ['handR', 'elbowR'],
  hipL: ['thighL', 'pelvis'], kneeL: ['shinL', 'hipL'], ankleL: ['footL', 'kneeL'],
  hipR: ['thighR', 'pelvis'], kneeR: ['shinR', 'hipR'], ankleR: ['footR', 'kneeR'],
};
export const MECH_JOINTS = Object.keys(BONE_MAP);
/** The reference pose: where every mech joint stands at its rest (the masculine idle's first frame: upright, arms down, feet under). */
export const REF = { clip: 'Loco_IdleMasc', frame: 0 };

const NB = BONES.length, PIDX = BONES.map((b) => BONES.indexOf(COURIER_PARENT[b])), _a = new THREE.Quaternion(), _b = new THREE.Quaternion();

/** One sampled pose: a quaternion a bone (BONES order) and the hips' height. */
export const newSlot = () => ({ q: new Float32Array(NB * 4), y: 0 });

export class MechRetarget {
  constructor(pack) {
    this.pack = pack; this.idx = BONES.map((b) => pack.bones.indexOf(b)); this.nb = pack.bones.length; this.fps = pack.fps || 30;
    this.ref = newSlot(); this.W = BONES.map(() => new THREE.Quaternion()); this.Wr = BONES.map(() => new THREE.Quaternion());
    this.O = {}; this.Oi = {}; this.tgt = new THREE.Quaternion(); this.bound = null;
    this.sample(this.ref, REF.clip, REF.frame / this.fps, false); this.world(this.ref, this.Wr); this.refY = this.ref.y;
  }
  has(name) { return !!this.pack.clips[name]; }
  /** A clip at time t (s) into a slot (a missing clip leaves the slot as it was and says false). */
  sample(slot, name, t, loop = true) {
    const c = this.pack.clips[name]; if (!c) return false;
    const n = c.n, q = c.q, p = c.p, nb = this.nb, o = slot.q;
    let f = loop ? ((((t % c.dur) + c.dur) % c.dur) * this.fps) : Math.min(Math.max(t, 0) * this.fps, n - 1);
    let i0 = Math.floor(f); if (i0 >= n - 1) i0 = n - 2; if (i0 < 0) i0 = 0;
    const a = Math.min(1, Math.max(0, f - i0)), b0 = i0 * nb * 4, b1 = (i0 + 1) * nb * 4;
    for (let k = 0; k < NB; k++) {
      const bi = this.idx[k] * 4, d = k * 4;
      if (bi < 0) { o[d] = 0; o[d + 1] = 0; o[d + 2] = 0; o[d + 3] = 1; continue; }
      const x0 = q[b0 + bi], y0 = q[b0 + bi + 1], z0 = q[b0 + bi + 2], w0 = q[b0 + bi + 3];
      let x1 = q[b1 + bi], y1 = q[b1 + bi + 1], z1 = q[b1 + bi + 2], w1 = q[b1 + bi + 3];
      if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
      const x = x0 + (x1 - x0) * a, y = y0 + (y1 - y0) * a, z = z0 + (z1 - z0) * a, w = w0 + (w1 - w0) * a, l = 1 / (Math.sqrt(x * x + y * y + z * z + w * w) || 1);
      o[d] = x * l; o[d + 1] = y * l; o[d + 2] = z * l; o[d + 3] = w * l;
    }
    slot.y = p[i0 * 3 + 1] + (p[(i0 + 1) * 3 + 1] - p[i0 * 3 + 1]) * a;
    return true;
  }
  /** into = nlerp(into, from, w), bone by bone (a layer's weight). */
  blend(into, from, w) {
    if (w <= 0) return into; if (w >= 1) { into.q.set(from.q); into.y = from.y; return into; }
    const A = into.q, B = from.q;
    for (let d = 0; d < NB * 4; d += 4) {
      const s = A[d] * B[d] + A[d + 1] * B[d + 1] + A[d + 2] * B[d + 2] + A[d + 3] * B[d + 3] < 0 ? -1 : 1;
      const x = A[d] + (s * B[d] - A[d]) * w, y = A[d + 1] + (s * B[d + 1] - A[d + 1]) * w, z = A[d + 2] + (s * B[d + 2] - A[d + 2]) * w, ww = A[d + 3] + (s * B[d + 3] - A[d + 3]) * w;
      const l = 1 / (Math.sqrt(x * x + y * y + z * z + ww * ww) || 1); A[d] = x * l; A[d + 1] = y * l; A[d + 2] = z * l; A[d + 3] = ww * l;
    }
    into.y += (from.y - into.y) * w; return into;
  }
  /** The model-space turn of every bone of a slot (parents first). */
  world(slot, out) {
    for (let k = 0; k < NB; k++) {
      const pa = PIDX[k], d = k * 4; _a.set(slot.q[d], slot.q[d + 1], slot.q[d + 2], slot.q[d + 3]);
      if (pa < 0) out[k].copy(_a); else out[k].copy(out[pa]).multiply(_a);
    }
    return out;
  }
  /** The rest-offsets of a built frame (its joints' rest turns in model space against the reference's bones). */
  bind(joints) {
    const Mr = {};
    for (const j of MECH_JOINTS) {
      const o = joints[j]; if (!o) continue; const [bone, par] = BONE_MAP[j];
      Mr[j] = new THREE.Quaternion().setFromEuler(o.userData.rest || o.rotation); if (par && Mr[par]) Mr[j].premultiply(Mr[par]);
      this.O[j] = this.Wr[BONES.indexOf(bone)].clone().invert().multiply(Mr[j]); this.Oi[j] = this.O[j].clone().invert();
    }
    this.bound = joints; this.pi = Object.fromEntries(MECH_JOINTS.map((j) => [j, BONES.indexOf(BONE_MAP[j][0])]));
    this.ppi = Object.fromEntries(MECH_JOINTS.map((j) => [j, BONE_MAP[j][1] ? BONES.indexOf(BONE_MAP[BONE_MAP[j][1]][0]) : -1]));
  }
  /** Each bound joint slerped from what it holds toward the slot's pose by its weight (weights[joint], 0 leaves it). */
  apply(slot, joints, weights) {
    const W = this.world(slot, this.W);
    for (const j of MECH_JOINTS) {
      const w = weights[j] ?? 0, o = joints[j], O = this.O[j]; if (!(w > 0) || !o || !O) continue;
      const par = BONE_MAP[j][1], pi = this.ppi[j];
      if (par === null) this.tgt.copy(W[this.pi[j]]).multiply(O);
      else this.tgt.copy(this.Oi[par]).multiply(_b.copy(W[pi]).invert()).multiply(W[this.pi[j]]).multiply(O);
      o.quaternion.slerp(this.tgt, Math.min(1, w));
    }
  }
  rootY(slot) { return slot.y - this.refY; }
}
