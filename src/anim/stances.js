// ---------------------------------------------------------------------------------------
// STANCES: how she stands with each Lachryma tool out, so that a tool can be named from across a room by her silhouette alone. The
// owner's direction for the game's animation: exaggerated, whimsical and a little cartoonish, but grounded, as Monster Hunter's are
// (every weapon its own idle you know at a glance: the hammer on the shoulder, the horn slung, the lance behind its shield).
//
// A stance is a UAL clip (CC0) modified, baked once at load into a clip of its own (`stance:<tool>`), so a tool names it as its idle
// and the animator never knows the difference (CLAUDE.md: find a clip, blend it in; modify it rather than author one):
//   base         the UAL idle it starts from (its breathing, its weight shift: the life is the clip's)
//   overlay      [clip, bones (a pattern)]: those bones taken from another clip at the same moment of the loop (the hand that holds
//                the tool from the clip whose fingers close on a haft, the rest of her from a freer idle)
//   exaggerate   how much further each joint swings from its own average over the loop (1: as captured; 1.5: half again): the
//                Disney principle, applied to a capture
//   rot          [bone, axis, degrees] turns, in the body's frame (x her left, y up, z forward), applied in order, parents first:
//                the pose of the stance, set on top of the clip's motion, the way a key pose is offset in a DCC's layer
//   reach        [side, [x, y, z], [pole x, y, z]?]: where a hand is to be in the key pose (body frame, metres from the feet), its arm
//                solved once here, at bake, as authored.js solves its key poses; the hand keeps its own turn, the clip's motion rides
//                on top. For a hand that has to be somewhere exact (at an ear, on a hip), which turns alone get to only by guesswork
//   drop         the hips lowered (metres): a wider, readier stance
// The hand that holds the tool keeps the tool (the tool rides the hand: tools/grip.js); a second hand on it is the light IK a hand
// closing on a haft is allowed.
//
// Prior art: Monster Hunter's weapon idles (a silhouette per weapon class), Ghibli and the Disney twelve (exaggeration, appeal,
// staging), the animation layer of every DCC (an additive offset over a captured cycle).
//
//   bakeStances(ch)     once, after the clips are loaded (character.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const STANCES = {
  // THE DREAMVANE: a pilgrim with her crook. The staff stands upright at her right, the right hand at her chest and the left high on
  // the haft above it (the dreamcatcher up over her head), weight sunk into the hips, the head cocked to listen to what it hears.
  dreamvane: {
    base: 'torchIdle', exaggerate: 1.35, drop: 0.03,
    rot: [
      ['spine', 'y', -12], ['spine002', 'z', 4], ['spine003', 'y', 8],
      ['upper_armR', 'z', -24], ['upper_armR', 'x', -14], ['forearmR', 'x', -34], ['handR', 'z', 6],
      ['head', 'z', -9], ['head', 'x', 4],
    ],
  },
  // THE CRUCIBELLE: the bell-ringer. The bell held up by her right ear, its mouth down, the elbow out; the other hand on her hip; her
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
  // THE LOCKHEART: the coffin held to her ear on its chain, the way a child listens to a pocket watch, the other hand cupped up
  // under the elbow; she leans into it, as if something in it were ticking.
  lockheart: {
    base: 'idle', overlay: [['torchIdle', '(upper_arm|forearm|hand|f_|thumb).*R$']], exaggerate: 1.4,
    rot: [['spine', 'z', 6], ['spine002', 'z', -8], ['head', 'z', 16], ['head', 'x', 6]],
    reach: [['R', [-0.17, 1.52, 0.07], [-0.55, 1.2, -0.05]], ['L', [-0.2, 1.24, 0.14], [0.25, 1.0, 0.1]]], // (the right hand at her ear; the left cupped under that elbow)
  },
  // THE SOUL BRUSH: Monster Hunter's hammer at rest. The great brush laid back over her right shoulder, the bristles up behind her,
  // the other hand on her hip: a painter between strokes, at her ease, chin up.
  soulbrush: {
    base: 'idle', overlay: [['swordIdle', '(upper_arm|forearm|hand|f_|thumb).*R$']], exaggerate: 1.4,
    rot: [['spine', 'y', 10], ['spine002', 'x', -4], ['handR', 'x', -100], ['handR', 'z', 18], ['head', 'x', -6], ['head', 'z', -5]],
    reach: [['R', [-0.2, 1.36, 0.14], [-0.45, 1.05, 0.1]], ['L', [0.2, 0.98, 0.0], [0.55, 1.1, -0.2]]], // (the brush hand at her shoulder; the other on her hip)
  },
  // THE SONDELASS, CUTLASS: a fencer's guard, low and sideways. The blade forward and low, the body turned to put it toward the foe,
  // the free hand up behind her for balance, as a duellist holds it.
  cutlass: {
    base: 'swordIdle', exaggerate: 1.45,
    rot: [['spine', 'y', -22], ['spine002', 'x', 6], ['head', 'y', 18]],
    reach: [['L', [0.38, 1.42, -0.22], [0.35, 1.05, -0.4]]],
  },
  // THE SONDELASS, ROD AND HOOK: an angler on the bank. The rod up and out over the water, the butt at her hip, leaning in to watch
  // the line, the other hand loose at the reel.
  rod: {
    base: 'idle', overlay: [['torchIdle', '(upper_arm|forearm|hand|f_|thumb).*R$']], exaggerate: 1.35,
    rot: [['spine002', 'x', 9], ['spine003', 'x', 4], ['handR', 'x', 25], ['head', 'x', 8]],
    reach: [['R', [-0.18, 1.05, 0.3], [-0.5, 1.0, -0.1]], ['L', [-0.04, 0.98, 0.3], [0.4, 0.95, 0.0]]],
  },
};

const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const _q = new THREE.Quaternion(), _m = new THREE.Quaternion(), _d = new THREE.Quaternion(), _v = new THREE.Vector3();

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

export function bakeStances(ch, table = STANCES) {
  const C = ch.clips, nb = C.nb, d = ch.driven, root = ch.root;
  const saveP = root.position.clone(), saveQ = root.quaternion.clone();
  root.position.set(0, 0, 0); root.quaternion.identity();
  for (const [id, S] of Object.entries(table)) {
    const src = C.clips[S.base];
    if (!src) continue;
    const n = src.n, q = new Float32Array(src.q), p = new Float32Array(src.p);
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
    if (S.exaggerate && S.exaggerate !== 1) {
      for (let b = 0; b < nb; b++) {
        _m.set(0, 0, 0, 0);
        for (let f = 0; f < n; f++) {
          const o = (f * nb + b) * 4;
          const sgn = (q[o] * q[b * 4] + q[o + 1] * q[b * 4 + 1] + q[o + 2] * q[b * 4 + 2] + q[o + 3] * q[b * 4 + 3]) < 0 ? -1 : 1;
          _m.x += q[o] * sgn; _m.y += q[o + 1] * sgn; _m.z += q[o + 2] * sgn; _m.w += q[o + 3] * sgn;
        }
        _m.normalize();
        const mean = _m.clone();
        for (let f = 0; f < n; f++) { const o = (f * nb + b) * 4; _q.fromArray(q, o); exaggerate(_q, mean, S.exaggerate).toArray(q, o); }
      }
    }
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
      for (let i = 0; i < d.length; i++) d[i].quaternion.toArray(q, (f * nb + i) * 4);
      p[f * 3 + 1] -= S.drop || 0;
    }
    C.clips[`stance:${id}`] = { ...src, q, p };
  }
  ch.resetPose();
  root.position.copy(saveP); root.quaternion.copy(saveQ); root.updateMatrixWorld(true);
}
