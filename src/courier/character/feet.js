// ---------------------------------------------------------------------------------------
// THE FEET (part of courier/character.js): the legs corrected on the posed body, the light IK of CLAUDE.md (Animation): a foot on a
// surface, never the whole pose. `footIK`, once a frame after the pose: stride warping (a foot reaches further along the move), ground
// contact (slopes and stairs: the hips drop for the lower foot and for a leg's reach, sprung), foot locking (a foot the cycle says is
// planted stays where it landed until the cycle lifts it, or the body gets too far from it, so nothing skates while speeding up,
// turning or blending) and the sole kept on the floor (the skin's lowest point of each foot, read by rigmeasure.js `measureSoles`,
// raised to the ground under it); each leg is then solved to its target with the knee bending toward the state's pole
// (world/props/poles.js). `guardKnees`, the last look: a knee that has ended up too far to the outside of the hip-to-foot line is bent
// back in.
//
// Prior art: stride warping and foot locking against skating (Unreal Engine 5's Stride Warping; the footskate cleanup of Kovar,
// Schreiner and Gleicher, 2002) and the pelvis lowered for the lower foot, as every foot-placement IK does.
//
//   footIK(ch, dt, s, planted, stretch, speed, gaitW)     guardKnees(ch, k)
//   (ch: the Character, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { LR, _v1, _v2, _v3, _v4, _v5, _v6 } from './scratch.js';

// foot placement's springs (1/s): a foot's ground offset, the hips' drop for the stance foot, the hips' drop for a leg's reach
const FOOT_FOLLOW = 20, PELVIS_FOLLOW = 10, REACH_FOLLOW = 12;
const SOLE_MAX = 0.06; // m: the most the sole is raised onto the ground under it (footIK)
// m: the same while a tech kneels (st.footDown): the stoop blended into the kneel puts the back toe up to 10.6 cm under the floor on
// the way down and up (the carry's set-down, measured)
const SOLE_KNEEL = 0.14;
const POLE_REST = { fwd: 0.1, out: 0, up: 0 }; // (the knees' resting pole, made once: a literal in a loop is an object a frame)

/**
 * Feet: stride warping (reach further along the move), ground contact (slopes,
 * stairs: the hips drop for the lower foot), and foot locking - a foot the cycle
 * says is planted stays where it landed until the cycle lifts it (or the body gets
 * too far away), so nothing skates while speeding up, turning or blending.
 */
export function footIK(ch, dt, s, planted, stretch, speed, gaitW) {
  const root = ch.root, st = ch.st;
  const K = (ch.fk ||= { mdir: new THREE.Vector3(), F: { L: new THREE.Vector3(), R: new THREE.Vector3() }, off: { L: new THREE.Vector3(), R: new THREE.Vector3() }, off0: { L: new THREE.Vector3(), R: new THREE.Vector3() }, t: { L: new THREE.Vector3(), R: new THREE.Vector3() }, v: new THREE.Vector3(), pole: new THREE.Vector3(), fq: new THREE.Quaternion(), offs: {}, offs0: {}, d: { L: 0, R: 0 }, anim: {}, tgt: {} }); // (the foot IK's own objects, kept: it runs every frame, and made a dozen a frame)
  const mdir = K.mdir.set(s.velocity.x, 0, s.velocity.z);
  const doStride = Math.abs(stretch) > 0.01 && speed > 0.3;
  if (doStride) mdir.normalize();
  const offs = K.offs, offs0 = K.offs0, d = K.d, anim = K.anim; d.L = 0; d.R = 0;
  for (const k of LR) {
    const leg = ch.leg[k];
    const F = leg.foot.getWorldPosition(K.F[k]);
    const off = K.off[k].set(0, 0, 0);
    if (doStride) off.addScaledVector(mdir, _v1.subVectors(F, s.pos).dot(mdir) * stretch);
    if (planted > 0.05 && s.ground) {
      const gy = s.ground(F.x + off.x, F.z + off.z, s.pos.y + 0.6);
      if (gy !== null) d[k] = THREE.MathUtils.clamp(gy - s.pos.y, -0.45, 0.45) * planted;
    }
    // (the ground under a foot, smoothed over time: a ray at a swinging foot jumps as the foot crosses a step, a ripple or a
    // triangle's edge, and the raw jump went straight into the leg. A slope reads the same, just without the jolts)
    const fd = (st.footD ||= { L: 0, R: 0 });
    fd[k] = THREE.MathUtils.damp(fd[k], d[k], FOOT_FOLLOW, dt); d[k] = fd[k];
    offs[k] = off;
    offs0[k] = K.off0[k].copy(off);
    anim[k] = F.add(off);
  }
  // foot locks (world space); a teleport drops them
  if (st.lockPos && st.lockPos.distanceToSquared(s.pos) > 1) for (const k of LR) { ch.lock[k].on = false; ch.lock[k].w = 0; }
  (st.lockPos = st.lockPos || new THREE.Vector3()).copy(s.pos);
  const lockable = T.anim.footLock && planted > 0.9 && gaitW > 0.25;
  for (const k of LR) {
    const L = ch.lock[k];
    if (L.on && s.groundVel) L.p.addScaledVector(s.groundVel, dt); // (a locked foot rides its platform)
    const want = lockable && st.contact[k] > 0.6;
    if (!want) L.lost = false;
    if (want && !L.on && !L.lost) { L.on = true; L.p.copy(anim[k]); L.w = 1; } // (locks where the foot is: no pop)
    // (let go when the body has run 0.35 m off it, a start or a turn outrunning the cycle: eased off, and not caught again until the
    //  cycle lifts that foot. Caught again at once, it jumped to the clip's foot in one frame: 30 to 38 cm in a start, casebook 2026-10-10)
    if (L.on && (!want || (L.p.x - anim[k].x) ** 2 + (L.p.z - anim[k].z) ** 2 > 0.35 * 0.35)) { L.on = false; L.lost = want; }
    L.w = THREE.MathUtils.damp(L.w, L.on ? 1 : 0, L.on ? 30 : 16, dt);
    if (L.w > 0.001) { offs[k].x += (L.p.x - anim[k].x) * L.w; offs[k].z += (L.p.z - anim[k].z) * L.w; }
  }
  // absolute targets, then drop the hips for the lower foot and for reach (a long
  // stride with the hips at clip height would straighten the legs and drag the feet)
  const tgt = K.tgt;
  for (const k of LR) { const t = (tgt[k] = K.t[k].copy(anim[k])); t.x += offs[k].x - offs0[k].x; t.y += d[k]; t.z += offs[k].z - offs0[k].z; } // (the clip's foot, less its stride offset, plus the offset as locked and the ground)
  // the sole kept on the floor: the skin's lowest point of each foot (its posed turn kept through the leg's IK, so its place against the
  // ankle is the clip's) raised to the ground under that point when the clip and the offsets above would put it under, by `planted`
  // and at most SOLE_MAX (a toe over a stair's nose is not stood on the step). The ground under the ankle is not the ground under a
  // heel struck toe-up or a toe on a slope: walking up a ramp the toes went 3.8 cm into it, down it the heels 5.8 (CASEBOOK
  // 215)
  if (ch.soles && planted > 0.05 && s.ground) {
    for (const k of LR) {
      const F = ch.leg[k].foot.getWorldPosition(_v1);
      let lo = null;
      const S = ch.soles[k];
      for (let i = 0; i < S.length; i++) { const w = _v2.copy(S[i][1]).applyMatrix4(S[i][0].matrixWorld); if (!lo || w.y < lo.y) lo = (ch._soleLo ||= new THREE.Vector3()).copy(w); } // (by index: a pair destructured is an iterator a vertex)
      if (!lo) continue;
      const x = tgt[k].x + lo.x - F.x, z = tgt[k].z + lo.z - F.z, y = tgt[k].y + lo.y - F.y;
      const gy = s.ground(x, z, s.pos.y + 0.6);
      if (gy === null) continue;
      if (gy > y) tgt[k].y += Math.min(st.footDown > 0 ? SOLE_KNEEL : SOLE_MAX, gy - y) * planted;
      // (and let down on to it while a tech kneels, by how much of the body is the kneel's (st.footDown: the carry's set-down): a clip
      //  that kneels in the air on this rig, 7 to 9 cm up, measured)
      else if (st.footDown > 0) tgt[k].y -= Math.min(SOLE_MAX, y - gy) * planted * st.footDown;
    }
  }
  // the hips drop for the lower foot it stands on: weighted by each foot's stance (the clip's contact), so the swinging foot over a
  // lower patch of ground does not pull the hips down mid-stride; then sprung, not snapped (the alternating feet on a slope made the
  // hips jump a few centimetres every step: Petra measured 20 mm a frame on a Dunemaw ramp at a run, R46)
  const wL = 0.3 + 0.7 * (st.contact?.L ?? 1), wR = 0.3 + 0.7 * (st.contact?.R ?? 1);
  st.pelvis = THREE.MathUtils.damp(st.pelvis || 0, -Math.min(0, d.L * wL, d.R * wR), PELVIS_FOLLOW, dt);
  let drop = st.pelvis - (st.prowlLift || 0); // (the prowl's hips raised over its clip's squat: PROWL.lift)
  let reach = 0;
  for (const k of LR) {
    const leg = ch.leg[k];
    const v = leg.thigh.getWorldPosition(K.v).sub(tgt[k]);
    v.y -= drop;
    const R = (leg.a + leg.b) * 0.985, l2 = v.lengthSq();
    if (l2 > R * R) {
      const disc = v.y * v.y - (l2 - R * R);
      reach = Math.max(reach, disc > 0 ? v.y - Math.sqrt(disc) : 0.12);
    }
  }
  st.reachDrop = THREE.MathUtils.damp(st.reachDrop || 0, Math.min(0.12, reach) * (1 - (st.crawlW || 0)), REACH_FOLLOW, dt); // (a crawl's legs lie straight behind: its clip's, not a reach) // (one rate both ways: 40 down and 10 up pumped the hips once a stride)
  drop += st.reachDrop;
  if (drop !== 0) { root.position.y -= drop; root.updateMatrixWorld(true); }
  const fwd = _v4.set(0, 0, 1).applyQuaternion(root.quaternion);
  const left = _v5.set(1, 0, 0).applyQuaternion(root.quaternion), rootUp = _v6.set(0, 1, 0).applyQuaternion(root.quaternion);
  for (const k of LR) {
    const leg = ch.leg[k];
    const target = tgt[k];
    if (target.distanceToSquared(leg.foot.getWorldPosition(_v1)) < 1e-6) continue;
    // the knee bends toward the state's own pole (poles.js): forward, and never flared out
    const PF = st.pole || POLE_REST;
    const pole = leg.shin.getWorldPosition(K.pole).addScaledVector(fwd, PF.fwd).addScaledVector(left, PF.out * (k === 'L' ? 1 : -1)).addScaledVector(rootUp, PF.up);
    const fq = leg.foot.getWorldQuaternion(K.fq);
    ch.solveLeg(leg, target, pole);
    ch.setWorldQuat(leg.foot, fq);
    leg.foot.updateMatrixWorld(true);
  }
}

/**
 * The last look at the knees: a knee that has ended up further to the outside of the hip-to-foot line than the state allows
 * (poles.js) is bent back in by re-solving the leg with its pole pulled across. Rig-independent: it measures where the knee
 * is. `k` is how much of the pose is the body's own (0 when a tech has taken the body over: a ladder, a hang, the skiff).
 */
export function guardKnees(ch, k) {
  const PF = ch.st.pole;
  if (!PF || k < 0.05) return;
  const root = ch.root;
  const left = _v5.set(1, 0, 0).applyQuaternion(root.quaternion);
  for (const side of LR) {
    const leg = ch.leg[side];
    root.updateMatrixWorld(true);
    const hip = leg.thigh.getWorldPosition(_v1), knee = leg.shin.getWorldPosition(_v2), foot = leg.foot.getWorldPosition(_v3);
    const ab = _v4.subVectors(foot, hip), t = THREE.MathUtils.clamp(_v6.subVectors(knee, hip).dot(ab) / Math.max(1e-6, ab.lengthSq()), 0, 1);
    const dev = _v6.copy(knee).sub(hip).addScaledVector(ab, -t); // (from the line to the knee)
    const out = dev.dot(left) * (side === 'L' ? 1 : -1);
    const over = out - PF.maxOut;
    if (over <= 0.005) continue;
    const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
    const pole = knee.clone().addScaledVector(left, -(side === 'L' ? 1 : -1) * over * 1.6 * k);
    const tgt = foot.clone();
    ch.solveLeg(leg, tgt, pole);
    ch.setWorldQuat(leg.foot, fq);
    leg.foot.updateMatrixWorld(true);
  }
}
