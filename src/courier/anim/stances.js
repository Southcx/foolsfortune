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
//   steady       [side, k]: a hand's turn in the body frame drawn k of the way to its average over the loop (after `rot`, before `reach`
//                and `nudge`, which keep it): what it holds stays pointed where it points while the arm and the chest keep their swing
//   aim          [side, axis [x, y, z], dir [x, y, z]]: what the hand holds laid along `dir` (body frame), every frame after reach and
//                nudge: `axis` is its line in the hand's own frame (a tool's grip socket: tools/grip.js), and the hand turned so that line
//                points along dir with the hand's length as near its forearm's as that leaves (the wrist bends only by how far dir is off
//                square to the forearm, never folds; the turn about the forearm is the forearm's to carry, the hinge pass's). The arm is
//                placed (reach, nudge and their pole) so that dir comes out square to it: the shoulder and the elbow do the pointing
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

/** The cutlass's line in the right hand's own frame: the grip's socket +X (tools/grip.js measureGrip, from torchIdle), for `aim`. */
const CUTLASS_LINE = [-0.044, -0.0411, 0.9982];

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
  // THE CUTLASS'S EN GARDE (the owner, 2026-10-11: "the torso rotated approximately 20 degrees CCW ... more like a fencing pose"; "the
  // Sondelass should rest posed centerline with the main mass of the Courier"). The suite's Sond_Idle (its breathing, its grip) turned
  // side-on: the chest a fencer's, toward their left so the blade shoulder leads, spread up the spine (the lower spine a little, the chest
  // most: the upper-body mask takes 0.3, 0.65 and 1 of them), the neck giving some back so the head faces ahead; the blade hand brought
  // onto the centre line before the navel and the sternum, the point forward and up at what they face (the sabre's guard). Not R40's: the
  // blade never crosses the waist and the off hand stays clear of the face. The hand's turn solved in game from the blade's direction
  // (forward, 30 degrees up) and the elbow's swivel and the grip's roll about the haft searched for the wrist's ease (Calissa's probe:
  // the wrist 28 degrees toward the little finger, the forearm 81 turned, under the pose audit's 35 and 90; a lower point bent the wrist
  // past them), the hand's turn held 0.6 of the way to its average so the point stays on the line while the chest breathes. Measured
  // (docs/ART.md section 10): the chest 21 degrees toward their left, the head 2, the hips and feet square; the guard 2 cm and the tip
  // 2.5 cm off the hips' midline (at most 4 and 5.5), the blade 0.4 degrees off forward, 34 up. Prior art: the sabre's and the
  // smallsword's en garde (the blade shoulder and the point on the line, the guard before the body's middle); Monster Hunter's long sword
  // idle (one silhouette, the point on the line).
  cutlass: {
    base: 'Sond_Idle',
    rot: [['spine001', 'y', 6], ['spine002', 'y', 12], ['spine003', 'y', 20], ['spine004', 'y', -8], ['head', 'y', -10], ['handR', 'x', 18.1], ['handR', 'y', 31.3], ['handR', 'z', 8.1]],
    steady: [['R', 0.6]], nudge: [['R', [0.035, -0.044, -0.111], [-0.49, 1.1, 0.4]]],
  },
  // (THE ROD standing: the suite's Sond_CastIdle as captured.)
  // THE HOOK held: the UAL torch idle the grapnel's grip was measured from (tools/grip.js), its hand a little out and ahead of the hip:
  // where the torch idle holds it, the running thigh swung 7 cm through the hand and the grip (the pose audit, 2026-10-11).
  hookHeld: { base: 'torchIdle', nudge: [['R', [-0.07, 0.04, 0.14]]] },
  // THE CUTLASS'S DRAWN RUN (the owner, 2026-10-11; no blade run in the suite, UAL or CMU: sondelass.js drawnRun): the run's own loop, its
  // chest and its free arm as captured, the blade arm's swing calmed and the cutlass carried low and back, its point trailing: a
  // swordsman's run (Ghost of Tsushima's and Sekiro's drawn-blade run, Monster Hunter's sword-and-shield run with the weapon out). The
  // shoulder and the elbow do the pointing (the owner, 2026-10-11: "the wrist hyperflexed and arm clipping into the body"; casebook
  // 2026-10-11): a blade on the thumb's side of the fist points back only with the arm turned in at the shoulder and the forearm turned
  // palm-out, so the elbow is carried out to the side (the pole), the hand beside and ahead of the hip, the forearm hanging under the
  // elbow, and the blade laid back along `aim` square to it (the wrist 30 degrees toward the little finger at most, the forearm 78 turned,
  // where the hand turned to point it, with the hand pulled to the hip, folded the wrist 96 to 102 degrees and bent the elbow backward).
  // The blade arm's swing at 0.2 of the run's (0.15 sprinting).
  cutlassRun: {
    base: 'jog', exaggerate: [0.2, '^(upper_arm|forearm|hand)R$'],
    nudge: [['R', [0.063, -0.225, -0.144], [-0.7, 1.15, 0.35]]], aim: [['R', CUTLASS_LINE, [-0.03, -0.22, -0.97]]],
  },
  cutlassSprint: {
    base: 'sprint', exaggerate: [0.15, '^(upper_arm|forearm|hand)R$'],
    nudge: [['R', [0.062, -0.239, -0.103], [-0.7, 1.15, 0.35]]], aim: [['R', CUTLASS_LINE, [-0.03, -0.22, -0.97]]],
  },
  // THE CUTLASS'S DRAWN SLIDE (Calissa's, 2026-10-29; tools/sondelass/drawnslide.js): the drawn run's idiom carried into the core slide.
  // No blade slide in the suite, UAL or CMU (the suite's Trav_SlideKnee is the knee slide of a celebration, arms flung wide; its
  // Brush_BrushSlide is a board rider's, side-on); so the slide's own loop (Trav_SlideLoop: the baseball slide, reclined, the lead leg out,
  // the free hand already trailing on the floor beside the hip) with only the blade arm set: the hand out beside the right hip and low
  // (the elbow carried out to the side and back, the forearm hanging under it), the cutlass laid along `aim` behind them, back, a little
  // out and down, its point trailing over the floor a hand's width up (Strider's and Zero's slide with the blade behind; Ghost of
  // Tsushima's dodge-slide with the katana held low and back). The fingers Sond_Idle's (the grip); the arm's own swing at 0.3.
  cutlassSlide: {
    base: 'slideLoop', overlay: [['Sond_Idle', '^(f_|thumb).*R$']], exaggerate: [0.3, '^(upper_arm|forearm|hand)R$'],
    reach: [['R', [-0.34, 0.2, -0.12], [-0.8, 0.55, -0.1]]], aim: [['R', CUTLASS_LINE, [-0.22, -0.1, -0.97]]],
  },
  // (and the same over the slide's drop-in, Trav_SlideStart, played by the drawn slide while the slide's track plays it: the loop's
  //  first frame laid over the drop-in's chest, still upright and pitching back, carried the blade arm round with it and drove the point
  //  61 cm into the floor, the pose audit's probe; here the hand and the blade are set in the body's frame on each of its own frames)
  cutlassSlideStart: {
    base: 'slideStart', overlay: [['Sond_Idle', '^(f_|thumb).*R$']], exaggerate: [0.3, '^(upper_arm|forearm|hand)R$'],
    reach: [['R', [-0.34, 0.2, -0.12], [-0.8, 0.55, -0.1]]], aim: [['R', CUTLASS_LINE, [-0.22, -0.1, -0.97]]],
  },
  // THE IAIDO'S CHARGE (the owner, 2026-10-11: "an Iaido-like striking pose for the charge-up"; crouched, hold RMB: cutlass.js). No iaido
  // in the suite, UAL or CMU; the suite's own Gun_QuickDraw at its first frame is the nearest (low, the hand at the hip before the draw),
  // its fingers the cutlass's (Sond_Idle's grip). The battojutsu's hold laid over it, as a sheathed blade lies beside the left hip and not
  // through it (the owner, 2026-10-11: "the iaido charge, the Sondelass clips into the body"; it lay 7.7 cm into the crouched left thigh
  // and the guard 7.1 cm into the belly, the blade hand's elbow bent backward): the hilt before the belly's left, forward of the hip, the
  // blade back and out past the hip's side and over the thigh (0.5 out to their left, 0.12 down, 0.86 back in game), laid along `aim`
  // from the forearm that crosses the body palm-down (the wrist 13 degrees toward the thumb, the forearm 87 turned); the bake's line is
  // the game's turned by the crouch under the layer (solved in game, Calissa's probe). The chest coiled to their left for the cut that
  // sweeps back across, the head kept on what is ahead. The off hand takes the blade at its mouth, thumb toward the hilt (sondelass.js
  // offHand), its elbow out to their left. Laid over the crouch's legs as the cutlass's upper layer.
  cutlassIaido: {
    base: 'Gun_QuickDraw', hold: 0, overlay: [['Sond_Idle', '^(f_|thumb).*R$']],
    rot: [['spine002', 'y', 10], ['spine003', 'y', 12], ['spine003', 'x', 6], ['head', 'y', -18]],
    nudge: [['R', [0.298, 0.252, 0.171], [-0.45, 0.8, 0.3]]], aim: [['R', CUTLASS_LINE, [0.614, -0.44, -0.655]]],
  },
};

const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const _q = new THREE.Quaternion(), _m = new THREE.Quaternion(), _d = new THREE.Quaternion(), _share = new THREE.Quaternion(), _v = new THREE.Vector3(), _n = new THREE.Vector3();

const _f = new THREE.Vector3(), _b = new THREE.Vector3(), _h = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _z = new THREE.Vector3(), _bz = new THREE.Vector3();
const _ML = new THREE.Matrix4(), _MW = new THREE.Matrix4();
/** The hand's world turn that lays its held line (`axis`, hand frame) along `dir` (world) with its length (+Y) as near the forearm's as
 *  that leaves: the forearm's way made square to dir. */
function aimHand(arm, axis, dir) {
  _f.copy(arm.hand.getWorldPosition(_h)).sub(arm.fore.getWorldPosition(_x)).normalize();
  _b.set(...dir).normalize();
  _h.copy(_f).addScaledVector(_b, -_f.dot(_b)).normalize();
  _x.set(...axis); _x.addScaledVector(_y, -_x.dot(_y)).normalize(); _z.crossVectors(_x, _y);
  _bz.crossVectors(_b, _h);
  _ML.makeBasis(_x, _y, _z); _MW.makeBasis(_b, _h, _bz);
  return new THREE.Quaternion().setFromRotationMatrix(_MW.multiply(_ML.transpose()));
}

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
    const posed = (f) => {
      pose.q.set(q.subarray(f * nb * 4, (f + 1) * nb * 4)); pose.p.set(p.subarray(f * 3, f * 3 + 3));
      ch.resetPose(); ch.applyPose(pose); root.updateMatrixWorld(true);
      for (const [bone, axis, deg] of S.rot || []) {
        const b = ch.bones[bone];
        if (!b) continue;
        ch.rotW(b, AX[axis], (deg * Math.PI) / 180);
        b.updateMatrixWorld(true);
      }
    };
    // (steady: each hand's turn averaged over the loop first, as posed with `rot`; the same sign-aligned mean as the exaggeration's)
    const means = (S.steady || []).map(([side]) => {
      const m = new THREE.Quaternion(0, 0, 0, 0), h = new THREE.Quaternion(), first = new THREE.Quaternion();
      for (let f = 0; f < n; f++) {
        posed(f); ch.arm[side].hand.getWorldQuaternion(h); if (!f) first.copy(h);
        const sgn = h.dot(first) < 0 ? -1 : 1; m.x += h.x * sgn; m.y += h.y * sgn; m.z += h.z * sgn; m.w += h.w * sgn;
      }
      return m.normalize();
    });
    for (let f = 0; f < n; f++) {
      posed(f);
      (S.steady || []).forEach(([side, k], i) => {
        const hand = ch.arm[side].hand;
        ch.setWorldQuat(hand, hand.getWorldQuaternion(_q).slerp(means[i], k));
        hand.updateMatrixWorld(true);
      });
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
      for (const [side, axis, dir] of S.aim || []) {
        const arm = ch.arm[side];
        ch.setWorldQuat(arm.hand, aimHand(arm, axis, dir));
        arm.hand.updateMatrixWorld(true);
      }
      for (let i = 0; i < d.length; i++) d[i].quaternion.toArray(q, (f * nb + i) * 4);
      p[f * 3 + 1] -= S.drop || 0;
    }
    C.clips[`stance:${id}`] = c;
  }
  ch.resetPose();
  root.position.copy(saveP); root.quaternion.copy(saveQ); root.updateMatrixWorld(true);
}
