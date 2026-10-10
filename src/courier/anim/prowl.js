// ---------------------------------------------------------------------------------------
// THE PROWL: the crouch on the move (the owner, 2026-10-10: "a hunting, predatory sort of movement, like a lion prowling. Note that
// felines have a very still head"). What is shown only: player.js keeps the crouch's 2.2 m/s and its 1.35 m capsule.
//   THE LOOP   Loco_CrouchWalk (PROWL.clip), low on bent knees, the back level, the arms hanging forward and working with the steps;
//              its own depth (the hips 0.37 to 0.42 m), so the foot IK lets nothing down (PROWL.lift: what it raises or lowers). Played
//              at the crouch's speed over its own (0.61 m/s): its strides to PROWL.stride times its own, the rest cadence. Chosen over
//              the others rendered at 2.2 m/s (docs/ART.md section 10): Loco_SneakWalk (the loop before it: an upright tiptoe at 4.8 times
//              its cadence, let down 0.38 m by the foot IK; its head swings 56 cm side to side, 19 up and down, 1,450 degrees a second)
//              and Loco_CreepSideR (a sidestep, its head 38 cm across).
//   THE HEAD   a cat's: held level and steady in the world while the body works under it, the neck taking the bob and the sway.
//              After the clip, a light correction, weighted by the crouch: (1) the head's turn in the body's heading frame is followed
//              slowly (PROWL.head.turn, 1/s) and levelled toward a gaze PROWL.head.gaze below the horizon (PROWL.head.level of the way;
//              the clip looks at the ground at its feet), spread up the neck (spine004, spine005, the head, PROWL.head.share), before the
//              aim's look is laid on; (2) after the feet, the head's place relative to the capsule is followed slowly (PROWL.head.follow)
//              and the neck's base (spine004) swung to keep the head there, PROWL.head.hold of the way, the head's turn kept. Each bone's
//              share is capped (PROWL.head.cap) off the pose as animated: rom.js holds no neck limits (its table is the fingers'), so
//              the cap is what keeps the neck where a neck goes; rom.js's pass still runs last.
//
// Prior art: a cat's head stabilisation (the vestibulo-collic reflex: the head held steady in space while the trunk moves, the neck
// absorbing the motion; the same in birds' head-bobbing hold phase); the predator stalks of Shadow of the Colossus's and Ghost of
// Tsushima's animals and Red Dead Redemption 2's cougars (low, deliberate, the shoulders working and the head fixed on the prey); the
// look-at with a damped target of Unreal's and Unity's head aim (a low-passed goal, the turn shared down the neck, each bone capped).
//
//   const prowl = new Prowl(ch)
//   prowl.gaze(dt, s, w)     the head's turn held and levelled (after the clip and the hips' warp, before the aim's look); w: 0..1
//   prowl.steady(dt, s, w)   the head's place held by the neck (after the foot IK)
//   PROWL                    the table (read each frame: moved live from the tuning panel or a harness)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const DEG = Math.PI / 180;
/** The prowl: its loop, the foot IK's lift of the hips (m: + raised, - let down), its strides at most this times its own; the head's
 *  hold. Measured in game at 2.2 m/s, every tool off (docs/ART.md section 10). */
export const PROWL = {
  clip: 'Loco_CrouchWalk',
  lift: 0.14, // (m: the hips over the clip's squat, 0.51 to 0.56 m: its long low steps read as a stalk, the trailing knee kept 25 cm off the ground, not a lunge's 13)
  stride: 1.4, // (1.71 m a stride, 1.29 a second: 2.6 steps a second, where 1.15 was 3.1, a scurry, and 1.45 reached 83 cm between the feet)
  head: {
    turn: 2.5, // 1/s: how fast the held turn follows the clip's (the steps' nod and roll come 2.6 times a second: about a seventh of them gets through)
    follow: 2.0, // 1/s: how fast the held place follows the head's own (relative to the capsule)
    level: 0.8, // of the way from the clip's turn to the level gaze
    gaze: 10 * DEG, // below the horizon
    hold: 0.85, // of the way from the head's place to the held one, by the neck's swing
    share: { spine004: 0.25, spine005: 0.3 }, // (the head takes the rest)
    cap: { spine004: 22 * DEG, spine005: 20 * DEG, head: 30 * DEG },
  },
};

const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1), ID = new THREE.Quaternion();
const _h = new THREE.Quaternion(), _hi = new THREE.Quaternion(), _w = new THREE.Quaternion(), _r = new THREE.Quaternion(), _l = new THREE.Quaternion();
const _d = new THREE.Quaternion(), _p = new THREE.Quaternion(), _k = new THREE.Quaternion(), _s = new THREE.Quaternion(), _i = new THREE.Quaternion(), _e = new THREE.Euler();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _j = new THREE.Vector3(), _t = new THREE.Vector3(), _v = new THREE.Vector3();

/** q's angle capped at max (radians), in place. */
function cap(q, max) {
  if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
  const a = 2 * Math.acos(Math.min(1, q.w));
  if (a > max) q.slerp(ID, 1 - max / a);
  return q;
}

/** Turn a bone by a world rotation (about its own joint): its subtree follows. */
function turnW(bone, q) {
  bone.getWorldQuaternion(_k);
  bone.parent.getWorldQuaternion(_p).invert();
  bone.quaternion.copy(_p.multiply(q).multiply(_k));
  bone.updateMatrixWorld(true);
}

export class Prowl {
  constructor(ch) {
    this.ch = ch;
    this.turn = new THREE.Quaternion(); this.place = new THREE.Vector3(); this.held = false; this.placed = false;
    this.headInv = ch.restCharInv.get(ch.bones.head); this.headRest = ch.restCharQ.get(ch.bones.head);
  }

  /** The body's heading: the yaw alone (the head is held level whatever the hips' lean and the slope's tilt). */
  heading(s) { _h.setFromAxisAngle(UP, s.yaw); _hi.copy(_h).invert(); }

  gaze(dt, s, w) {
    const B = this.ch.bones, H = PROWL.head;
    this.heading(s);
    B.head.getWorldQuaternion(_w);
    const R = _r.copy(_hi).multiply(_w).multiply(this.headInv); // (the head's turn from its rest, in the heading frame)
    if (w < 0.001 || !this.held) { this.turn.copy(R); this.held = w >= 0.001; if (w < 0.001) return; }
    this.turn.slerp(R, 1 - Math.exp(-H.turn * dt));
    // the gaze: the held turn's yaw, its pitch the gaze's, no roll
    const f = _v.copy(FWD).applyQuaternion(this.turn);
    _l.setFromEuler(_e.set(H.gaze, Math.atan2(f.x, f.z), 0, 'YXZ'));
    const T = _l.slerp(this.turn, 1 - H.level); // (level of the way from the held turn to the gaze)
    // the world turn wanted, and the change to it from the pose: shared up the neck, each bone capped
    const want = _d.copy(_h).multiply(T).multiply(this.headRest).multiply(_i.copy(_w).invert());
    want.slerp(ID, 1 - w);
    let left = 1;
    for (const [n, sh] of Object.entries(H.share)) {
      const part = cap(_s.copy(ID).slerp(want, sh / left), H.cap[n]);
      turnW(B[n], part);
      want.multiply(part.invert()); // (what is left of it)
      if (want.w < 0) want.set(-want.x, -want.y, -want.z, -want.w);
      left -= sh;
    }
    turnW(B.head, cap(want, H.cap.head));
  }

  steady(dt, s, w) {
    const B = this.ch.bones, H = PROWL.head;
    this.heading(s);
    const hp = B.head.getWorldPosition(_a);
    const rel = _t.copy(hp).sub(s.pos).applyQuaternion(_hi);
    if (w < 0.001 || !this.placed) { this.place.copy(rel); this.placed = w >= 0.001; if (w < 0.001) return; }
    this.place.lerp(rel, 1 - Math.exp(-H.follow * dt));
    // where the head is held: the followed place, back in the world, hold of the way by the weight
    const to = _b.copy(this.place).applyQuaternion(_h).add(s.pos).sub(hp).multiplyScalar(H.hold * w).add(hp);
    const J = B.spine004.getWorldPosition(_j);
    _a.sub(J).normalize(); to.sub(J).normalize();
    const swing = cap(_d.setFromUnitVectors(_a, to), H.cap.spine004);
    B.head.getWorldQuaternion(_w); // (the head's turn, kept through the swing)
    turnW(B.spine004, swing);
    B.head.parent.getWorldQuaternion(_i).invert();
    B.head.quaternion.copy(_i.multiply(_w)); B.head.updateMatrixWorld(true);
  }
}
