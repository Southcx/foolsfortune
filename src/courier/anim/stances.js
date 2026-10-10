// ---------------------------------------------------------------------------------------
// STANCES: how they stand with each Lachryma tool out, so that a tool can be named from across a room by their silhouette alone. The
// owner's direction for the game's animation: exaggerated, whimsical and a little cartoonish, but grounded, as Monster Hunter's are
// (every weapon its own idle you know at a glance: the hammer on the shoulder, the horn slung, the lance behind its shield).
//
// A stance is a UAL clip (CC0) modified, baked once at load into a clip of its own (`stance:<tool>`), so a tool names it as its idle
// and the animator never knows the difference (CLAUDE.md: find a clip, blend it in; modify it rather than author one):
//   base         the UAL idle it starts from (its breathing, its weight shift: the life is the clip's); a list: the first the pack has
//   overlay      [clip, bones (a pattern)]: those bones taken from another clip at the same moment of the loop (the hand that holds
//                the tool from the clip whose fingers close on a haft, the rest of them from a freer idle)
//   exaggerate   how much further each joint swings from its own average over the loop (1: as captured; 1.5: half again): the
//                Disney principle, applied to a capture; [k, pattern] for only the bones the pattern names (below 1, a calmer swing)
//   rot          [bone, axis, degrees] turns, in the body's frame (x their left, y up, z forward), applied in order, parents first:
//                the pose of the stance, set on top of the clip's motion, the way a key pose is offset in a DCC's layer
//   reach        [side, [x, y, z], [pole x, y, z]?]: where a hand is to be in the key pose (body frame, metres from the feet), its arm
//                solved once here, at bake, as authored.js solves its key poses; the hand keeps its own turn, the clip's motion rides
//                on top. For a hand that has to be somewhere exact (at an ear, on a hip), which turns alone get to only by guesswork
//   nudge        [side, [x, y, z], [pole x, y, z]?]: a hand moved this far (body frame, metres) from where the clip has it, every
//                frame, its arm solved again as `reach` solves it: the clip's own motion kept, the hand held somewhere else
//   drop         the hips lowered (metres): a wider, readier stance
//   hold         0..1: one frame of the base held for the whole clip (a pose, not a loop)
//   closeLoop    frames at the base's end that jump to meet its start (a loop exported with a pop at its end): dropped, and the
//                difference left between its new last frame and its first spread over the whole clip, so it loops without a jump
// The hand that holds the tool keeps the tool (the tool rides the hand: tools/grip.js); a second hand on it is the light IK a hand
// closing on a haft is allowed.
//
// Prior art: Monster Hunter's weapon idles (a silhouette per weapon class), Ghibli and the Disney twelve (exaggeration, appeal,
// staging), the animation layer of every DCC (an additive offset over a captured cycle); closeLoop is Unity's Loop Pose (Mecanim's
// import option: the end's mismatch with the start spread over the clip).
//
//   bakeStances(ch)     once, after the clips are loaded (character.js)
//   bakeClip(C, S)      -> a clip of the base with S's hold, closeLoop, overlay and exaggerate (no skeleton needed: the Courier's
//                       standing idles are baked with it too, courier/anim/idlebreak.js); null if the base is not in the pack
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const STANCES = {
  // THE DREAMVANE: a pilgrim with their crook. The staff stands upright at their right, the right hand at their chest and the left high on
  // the haft above it (the dreamcatcher up over their head), weight sunk into the hips, the head cocked to listen to what it hears.
  dreamvane: {
    base: 'torchIdle', exaggerate: 1.35, drop: 0.03,
    rot: [
      ['spine', 'y', -12], ['spine002', 'z', 4], ['spine003', 'y', 8],
      ['upper_armR', 'z', -24], ['upper_armR', 'x', -14], ['forearmR', 'x', -34], ['handR', 'z', 6],
      ['head', 'z', -9], ['head', 'x', 4],
    ],
  },
  // THE CRUCIBELLE: the bell-ringer. The bell held up by their right ear, its mouth down, the elbow out; the other hand on their hip; them
  // head tipped toward it, listening for the note it is about to give.
  crucibelle: {
    base: 'idle', overlay: [['torchIdle', '(upper_arm|forearm|hand|f_|thumb).*R$']], exaggerate: 1.4,
    rot: [
      ['spine', 'y', 8], ['spine002', 'z', -5],
      ['upper_armR', 'z', -55], ['upper_armR', 'x', -30], ['forearmR', 'x', -70], ['handR', 'z', 10], ['handR', 'x', 45],
      ['upper_armL', 'z', 38], ['forearmL', 'y', 60], ['forearmL', 'z', -55],
      ['head', 'z', 12], ['head', 'y', -10],
    ],
  },
  // THE LOCKHEART (R40, the owner's direction): the coffin held gingerly in the LEFT hand, the head tipped down to it as to something that
  // might wake; the right hand free. The suite's own Lock_Idle, the left hand held further out and lower (the owner's v137: the coffin sat
  // against the belly, 7 cm off it, from the chest to the hips): out in front, where it hangs on its chain clear of the body.
  lockheart: {
    base: ['Lock_Idle', 'idle'],
    nudge: [['L', [-0.04, -0.1, 0.14]]],
  },
  // THE LOCKHEART'S CHANNEL (R40): FFXI's black magic cast, the arms out in front and the hands joined, thumbs and fingers making an
  // O; what it draws streams in through the O to the coffin floating behind it. One held frame of the push (its arms out), the hands
  // brought together (over the upright idle: the push leaned the whole body into a shove).
  lockheartChannel: {
    base: 'idle', hold: 0.5,
    rot: [['spine002', 'x', 3], ['head', 'x', 4]],
    reach: [['L', [0.04, 1.27, 0.62], [0.6, 1.05, 0.2]], ['R', [-0.04, 1.27, 0.62], [-0.6, 1.05, 0.2]]],
  },
  // THE SOUL BRUSH: Monster Hunter's hammer at rest. The great brush laid back over their right shoulder, the bristles up behind them,
  // the other hand on their hip: a painter between strokes, at their ease, chin up.
  soulbrush: {
    base: 'idle', overlay: [['swordIdle', '(upper_arm|forearm|hand|f_|thumb).*R$']], exaggerate: 1.4,
    rot: [['spine', 'y', 10], ['spine002', 'x', -4], ['handR', 'x', -100], ['handR', 'z', 18], ['head', 'x', -6], ['head', 'z', -5]],
    reach: [['R', [-0.2, 1.36, 0.14], [-0.45, 1.05, 0.1]], ['L', [0.2, 0.98, 0.0], [0.55, 1.1, -0.2]]], // (the brush hand at their shoulder; the other on their hip)
  },
  // (THE SONDELASS: no stance of its own. The cutlass is held in the UAL sword idle as captured, the rod in the torch idle: a real
  //  sword-ready stance reads better than any offset laid over it (R40: the en garde tried here crossed the blade over the waist and
  //  put the off-hand fist before the face).)
};

const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const _q = new THREE.Quaternion(), _m = new THREE.Quaternion(), _d = new THREE.Quaternion(), _share = new THREE.Quaternion(), _v = new THREE.Vector3(), _n = new THREE.Vector3();

/** q = mean * (mean⁻¹ q)^k: the joint's swing away from its average, scaled. */
function exaggerate(q, mean, k) {
  _d.copy(mean).invert().multiply(q);
  if (_d.w < 0) { _d.x = -_d.x; _d.y = -_d.y; _d.z = -_d.z; _d.w = -_d.w; }
  const a = 2 * Math.acos(Math.min(1, _d.w)), s = Math.sqrt(1 - _d.w * _d.w);
  if (a < 1e-5 || s < 1e-6) return q;
  _v.set(_d.x / s, _d.y / s, _d.z / s);
  _d.setFromAxisAngle(_v, a * k);
  return q.copy(mean).multiply(_d);
}

/** The clip arrays of a spec's base with its hold, closeLoop, overlay and exaggerate laid on (the parts that need no skeleton). */
export function bakeClip(C, S) {
  const src = C.clips[[].concat(S.base).find((b) => C.clips[b])], nb = C.nb, nb4 = nb * 4;
  if (!src) return null;
  let n = src.n, q = new Float32Array(src.q), p = new Float32Array(src.p);
  // (hold: one frame of the clip, the same for all of it: a pose held, not a loop)
  if (S.hold !== undefined) { const h = Math.round(S.hold * (n - 1)); for (let f = 0; f < n; f++) { q.copyWithin(f * nb4, h * nb4, (h + 1) * nb4); p.copyWithin(f * 3, h * 3, h * 3 + 3); } }
  // (closeLoop: the popping end dropped; each bone's last kept frame turned onto its first a share at a time, frame by frame)
  if (S.closeLoop > 0 && n - S.closeLoop > 2) {
    n -= S.closeLoop; q = q.slice(0, n * nb4); p = p.slice(0, n * 3);
    const L = n - 1;
    for (let b = 0; b < nb; b++) {
      _d.fromArray(q, L * nb4 + b * 4).invert().multiply(_q.fromArray(q, b * 4)); // (what the last frame lacks of the first, in the bone's own frame)
      for (let f = 1; f <= L; f++) _m.fromArray(q, f * nb4 + b * 4).multiply(_share.identity().slerp(_d, f / L)).toArray(q, f * nb4 + b * 4);
    }
    const dp = [0, 1, 2].map((k) => p[k] - p[L * 3 + k]);
    for (let f = 1; f <= L; f++) for (let k = 0; k < 3; k++) p[f * 3 + k] += dp[k] * (f / L);
  }
  for (const [clip, pattern] of S.overlay || []) {
    const o = C.clips[clip];
    if (!o) continue;
    const re = new RegExp(pattern), tmp = C.pose();
    for (let f = 0; f < n; f++) {
      C.sample(clip, (f / Math.max(1, n - 1)) * o.dur, tmp, true);
      for (let b = 0; b < nb; b++) if (re.test(C.bones[b])) for (let k = 0; k < 4; k++) q[(f * nb + b) * 4 + k] = tmp.q[b * 4 + k];
    }
  }
  // the exaggeration: each joint's average over the loop, and every frame pushed further from it
  const [ek, eOnly] = Array.isArray(S.exaggerate) ? [S.exaggerate[0], new RegExp(S.exaggerate[1])] : [S.exaggerate, null];
  if (ek && ek !== 1) {
    for (let b = 0; b < nb; b++) {
      if (eOnly && !eOnly.test(C.bones[b])) continue;
      _m.set(0, 0, 0, 0);
      for (let f = 0; f < n; f++) {
        const o = (f * nb + b) * 4;
        const sgn = (q[o] * q[b * 4] + q[o + 1] * q[b * 4 + 1] + q[o + 2] * q[b * 4 + 2] + q[o + 3] * q[b * 4 + 3]) < 0 ? -1 : 1;
        _m.x += q[o] * sgn; _m.y += q[o + 1] * sgn; _m.z += q[o + 2] * sgn; _m.w += q[o + 3] * sgn;
      }
      _m.normalize();
      const mean = _m.clone();
      for (let f = 0; f < n; f++) { const o = (f * nb + b) * 4; _q.fromArray(q, o); exaggerate(_q, mean, ek).toArray(q, o); }
    }
  }
  return { ...src, n, dur: n === src.n ? src.dur : (n - 1) / C.fps, q, p };
}

export function bakeStances(ch, table = STANCES) {
  const C = ch.clips, nb = C.nb, d = ch.driven, root = ch.root;
  const saveP = root.position.clone(), saveQ = root.quaternion.clone();
  root.position.set(0, 0, 0); root.quaternion.identity();
  for (const [id, S] of Object.entries(table)) {
    const c = bakeClip(C, S);
    if (!c) continue;
    const { n, q, p } = c;
    // the pose of the stance, over every frame
    const pose = C.pose();
    for (let f = 0; f < n; f++) {
      pose.q.set(q.subarray(f * nb * 4, (f + 1) * nb * 4)); pose.p.set(p.subarray(f * 3, f * 3 + 3));
      ch.resetPose(); ch.applyPose(pose); root.updateMatrixWorld(true);
      for (const [bone, axis, deg] of S.rot || []) {
        const b = ch.bones[bone];
        if (!b) continue;
        ch.rotW(b, AX[axis], (deg * Math.PI) / 180);
        b.updateMatrixWorld(true);
      }
      for (const [side, at, pole] of S.reach || []) {
        const arm = ch.arm[side], hq = arm.hand.getWorldQuaternion(new THREE.Quaternion());
        ch.reachHand(side, _v.set(...at), hq, 1, 0, pole ? new THREE.Vector3(...pole) : null);
        root.updateMatrixWorld(true);
      }
      for (const [side, by, pole] of S.nudge || []) {
        const arm = ch.arm[side], hq = arm.hand.getWorldQuaternion(new THREE.Quaternion());
        ch.reachHand(side, arm.hand.getWorldPosition(_v).add(_n.set(...by)), hq, 1, 0, pole ? new THREE.Vector3(...pole) : null);
        root.updateMatrixWorld(true);
      }
      for (let i = 0; i < d.length; i++) d[i].quaternion.toArray(q, (f * nb + i) * 4);
      p[f * 3 + 1] -= S.drop || 0;
    }
    C.clips[`stance:${id}`] = c;
  }
  ch.resetPose();
  root.position.copy(saveP); root.quaternion.copy(saveQ); root.updateMatrixWorld(true);
}
