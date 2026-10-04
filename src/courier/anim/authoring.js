import * as THREE from 'three';

// Authored clips: the moves the free libraries don't cover (ladders, hangs, poles, grates...)
// are built once at startup, on the Courier itself, from key poses solved with two-bone IK
// in body space (root at the feet, facing +Z, Y up, the character's left is +X), then stored
// like any other clip. At runtime they play like clips do; the IK was done here, once, where
// the hand and foot positions are exactly the ones the level's geometry gives them, so the
// game only ever corrects a contact by a few centimetres instead of solving a whole limb.
//
//   const A = new Author(character);
//   A.clip('ladderUp', { dur: 1.2, loop: true, base: 'idle', build(u, ctx) { ... } });
//
// build() runs per frame with the skeleton at the base pose; it moves the hips, bends the spine,
// and puts hands and feet on targets. `u` is the phase 0..1 (a loop's last frame is its first again).

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);
export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const lerp = THREE.MathUtils.lerp;
export const clamp = THREE.MathUtils.clamp;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** Ease in and out through a triangle wave: 0 at u=0, 1 at u=.5, back to 0 at 1. */
export const tri = (u) => 1 - Math.abs(((u % 1) + 1) % 1 * 2 - 1);
const DEG = Math.PI / 180;

export class Author {
  constructor(ch) {
    this.ch = ch;
    this.B = ch.bones;
    this.tmp = ch.clips.pose();
    this.tmp2 = ch.clips.pose();
    this.miss = {}; // worst miss per contact, for the clip being built (a limb that can't reach its target)
  }

  /** Build a clip and add it to the character's clips. build(u, ctx) is called per frame. */
  clip(name, { dur = 1, loop = true, base = null, baseT = 0, build }) {
    const ch = this.ch, C = ch.clips, nb = C.nb;
    const frames = Math.max(2, Math.round(dur * C.fps));
    const n = frames + 1; // (frame `frames` is the end pose, or a loop's first frame again, so sampling can lerp across the seam)
    const q = new Float32Array(n * nb * 4), p = new Float32Array(n * 3);
    const saveP = ch.root.position.clone(), saveR = ch.root.rotation.clone();
    for (let f = 0; f < n; f++) {
      const u = f / frames;
      this.begin(base, base ? (typeof baseT === 'function' ? baseT(u) : baseT) : 0);
      build.call(this, u, { f, n, frames });
      ch.root.updateMatrixWorld(true);
      for (let i = 0; i < nb; i++) ch.driven[i].quaternion.toArray(q, (f * nb + i) * 4);
      ch.bones.spine.position.toArray(p, f * 3);
    }
    // keep quaternions on one hemisphere from frame to frame
    for (let f = 1; f < n; f++) for (let i = 0; i < nb; i++) {
      const a = ((f - 1) * nb + i) * 4, b = (f * nb + i) * 4;
      if (q[a] * q[b] + q[a + 1] * q[b + 1] + q[a + 2] * q[b + 2] + q[a + 3] * q[b + 3] < 0) for (let k = 0; k < 4; k++) q[b + k] = -q[b + k];
    }
    C.clips[name] = { name, dur: frames / C.fps, n, q, p, authored: true, loop };
    const bad = Object.entries(this.miss).filter(([, d]) => d > 0.02).map(([k, d]) => `${k} ${(d * 100).toFixed(0)}cm`);
    if (bad.length) console.warn(`authored ${name}: contacts out of reach: ${bad.join(', ')}`);
    this.miss = {};
    ch.root.position.copy(saveP); ch.root.rotation.copy(saveR);
    ch.resetPose();
    return C.clips[name];
  }

  /** Start a frame: the base pose (or rest), the body at the origin facing +Z. */
  begin(base, baseT = 0) {
    const ch = this.ch;
    ch.resetPose();
    ch.root.position.set(0, 0, 0);
    ch.root.rotation.set(0, 0, 0);
    if (base) ch.applyPose(ch.clips.sample(base, baseT, this.tmp));
    ch.root.updateMatrixWorld(true);
  }

  // ---- body ----
  /** Move the hips by (x, y, z) metres from where the base pose has them. */
  hips(x, y, z) {
    const B = this.B, sp = B.spine;
    _v.set(x, y, z);
    sp.parent.updateMatrixWorld(true);
    // (a world-space offset, expressed in the pelvis bone's parent frame)
    const w = sp.getWorldPosition(_v2).add(_v);
    sp.parent.worldToLocal(w);
    sp.position.copy(w);
    sp.updateMatrixWorld(true);
  }

  /** Rotate a bone about a world axis through its origin. `axis` is a name: 'x' (pitch, + = lean forward), 'y' (turn left), 'z' (roll). */
  turn(bone, axis, deg) {
    const ch = this.ch;
    const a = axis === 'x' ? _v.set(1, 0, 0) : axis === 'y' ? _v.set(0, 1, 0) : _v.set(0, 0, 1);
    ch.rotW(typeof bone === 'string' ? this.B[bone] : bone, a.clone(), deg * DEG);
    ch.root.updateMatrixWorld(true);
  }

  /** Distribute a rotation down a chain of bones: [[bone, weight], ...]. */
  chain(list, axis, deg) { for (const [b, w] of list) this.turn(b, axis, deg * w); }

  // ---- limbs ----
  /**
   * A foot: the ankle goes to `ankle` (body space), the knee bends toward `pole`, and the sole
   * is set from `fwd` (the direction the toes point) and `pitch` (degrees, + toes up).
   */
  foot(side, ankle, pole, fwd = FWD, pitch = 0) {
    const ch = this.ch, leg = ch.leg[side];
    ch.solveLeg(leg, ankle, pole);
    const q = new THREE.Quaternion().setFromRotationMatrix(this.footBasis(fwd, pitch));
    // the foot bone's rest orientation has toes along +Z (in body space) and the sole down
    ch.setWorldQuat(leg.foot, q.multiply(ch.restCharQ.get(leg.foot)));
    ch.root.updateMatrixWorld(true);
    this.note(`foot${side}`, leg.foot.getWorldPosition(new THREE.Vector3()).distanceTo(ankle));
  }

  footBasis(fwd, pitch) {
    const f = fwd.clone().normalize();
    const r = new THREE.Vector3().crossVectors(UP, f).normalize();
    const u = new THREE.Vector3().crossVectors(f, r).normalize();
    const m = new THREE.Matrix4().makeBasis(r, u, f);
    return m.multiply(new THREE.Matrix4().makeRotationX(-pitch * DEG));
  }

  /**
   * A hand: the palm centre goes to `palm`; the fingers point along `dir` and the palm faces
   * `face` (both world / body space). The elbow bends toward `pole`.
   */
  hand(side, palm, pole, dir, face, w = 1) {
    const ch = this.ch, arm = ch.arm[side];
    const q = ch.handQuat(arm, dir, face);
    const wrist = palm.clone().sub(arm.palmPt.clone().applyQuaternion(q));
    ch.reachHand(side, wrist, q, w, 0, pole);
    ch.root.updateMatrixWorld(true);
    this.note(`hand${side}`, arm.palmPt.clone().applyMatrix4(arm.hand.matrixWorld).distanceTo(palm));
  }

  note(key, d) { if (d > (this.miss[key] || 0)) this.miss[key] = d; }

  /** Curl a hand's fingers (0 open .. 1 closed around something). */
  curl(side, k) {
    const ch = this.ch, arm = ch.arm[side];
    if (k <= 0) return;
    const hq = arm.hand.getWorldQuaternion(_q);
    const palm = new THREE.Vector3(0, -1, 0).applyQuaternion(_q2.copy(hq).multiply(ch.restCharQ.get(arm.hand).clone().invert()));
    for (const f of arm.fingers) {
      // each finger bone bends toward the palm about the axis across the finger
      const isThumb = f.name.startsWith('thumb');
      const child = f.children.find((c) => c.isBone);
      const d = child ? child.getWorldPosition(new THREE.Vector3()).sub(f.getWorldPosition(new THREE.Vector3())).normalize() : null;
      if (!d) continue;
      const axis = new THREE.Vector3().crossVectors(d, palm).normalize();
      if (axis.lengthSq() < 0.5) continue;
      const ang = (isThumb ? 35 : 62) * DEG * k * (f.name.endsWith('03L') || f.name.endsWith('03R') ? 0.8 : 1);
      ch.rotW(f, axis, ang);
    }
    ch.root.updateMatrixWorld(true);
  }

  worldOf(bone) { return (typeof bone === 'string' ? this.B[bone] : bone).getWorldPosition(new THREE.Vector3()); }
}
