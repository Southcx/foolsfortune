// ---------------------------------------------------------------------------------------
// THE HINGE REPAIR: knees and elbows put back on their hinge in the clips as they are decoded (suite.js), so a joint bends the way a
// body's does. The suite (and the UAL pack before it) was retargeted bone by bone by direction: each bone points where the capture's
// did, but turned about its own length by nothing (a thigh's and a shin's twist exactly 0 in Trav_WallJump, Loco_LandHard,
// Trav_LadderClimb), so wherever the capture's thigh or upper arm was turned, the shin or forearm reached its direction by bending
// sideways or backward off its hinge: of the 9,504 knee and elbow frames of the Loco_, Air_ and Trav_ clips, 2,123 more than 20 degrees
// sideways and 212 bent back past straight (Trav_WallJump's knees 125 and 131, the slide's left knee 86, the upright idle's right elbow
// 30 out and 26 back); repaired, 63 and 1 (casebook 2026-10-10).
//
// What it does, per frame, per limb (thigh > shin > foot, upper arm > forearm > hand), in the limb's parent's frame:
//   1. the upper bone is turned about its own length (the knee or elbow stays where it was) until the lower bone's hinge, its rest
//      local X, is square to the plane the limb bends in, the bend being flexion (the lower's rest X: the rig's knee and elbow hinge,
//      measured: the walk's knees and elbows turn about it, 2 to 113 degrees); the turn fades in with the bend over BEND (a straight
//      limb has no plane; the bend is from the upper bone's line, so a straight knee is never bent back), changes no faster than
//      TURN_SPEED, and is at most UPPER_TURN (a hip's or shoulder's own range)
//   2. the lower bone bends about that hinge to the same direction it had (the ankle or wrist stays where it was; in a clip past the
//      upper's range by OVER, it stays on its hinge and the ankle or wrist moves instead), then turns about its own length: a forearm by what keeps the hand's own turn as it was (pronation is the forearm's), a shin by its own turn as
//      it was, within its row of LIMBS (a shin 25 degrees, a forearm 100; a turn wanted past that is held at the end nearest the last
//      frame's, never flipped across the half turn)
//   3. the end bone keeps its orientation in the limb's frame (the sole on the ground, the palm where it faced)
// Every joint stays where the clip put it: the silhouette, the foot contacts and the hips' path do not change, only which way the knees
// and elbows face. The clips of the set being polished are repaired (HINGED: the core movement's, the owner's ask of 2026-10-10); the
// tools' sets join it as each is taken up (the owner: one set at a time).
// THE SAME, EVERY FRAME (LimbHinges): what IK and blending do after the clips (the feet put on the ground, a knee re-solved toward its
// pole, a hand on a wall, two clips' twists averaged) bends a limb off its hinge again (in game: the strafe's knees to 101 degrees, the
// wallrun's wall hand's elbow to 163), so the posed body is squared the same way last, before the joint limits (character.js poseHands),
// its joints always kept: the legs always (the core movement's own), the arms by a weight the caller gives (nothing in the hands: a
// tool's arms are its set's).
//
// Prior art: the swing-twist decomposition (Dobrowolski, "Swing-twist decomposition in Clifford algebra"; the rom.js pass); the pole
// vector of a two-bone IK solve (Blender's IK pole, Unreal's Two Bone IK and IK Retargeter's pole matching), which sets the upper bone's
// turn from the plane the limb bends in, here applied to the clip's own joint positions instead of a target; the twist correction
// retargeters add after a direction-only retarget (MotionBuilder's and HumanIK's roll handling).
//
//   repairHinges(q, n, bones, rest, limbs, loop, fps)   q: a clip's Float32Array (n frames x bones x 4, local), in place; rest: the
//                                     bones' rest quaternions (the pack's); loop: its seam kept; returns the limb frames turned over 1 degree
//   offHinge(q, n, bones, rest)        per limb frame: the lower bone's sideways swing off its hinge and its flexion, degrees
//   HINGED(name)                       whether a clip of that name is repaired
//   const lh = new LimbHinges(bones, restOf)   lh.apply(dt, legs = 1, arms = 1)   the posed bones squared, each pair by that weight
// ---------------------------------------------------------------------------------------

const DEG = Math.PI / 180;
/** The limbs: upper, lower, end; how far the lower may turn about its own length (rad); whether the end keeps its own turn (the hand)
 *  or the lower keeps its own (the shin). */
export const LIMBS = [
  ['thighL', 'shinL', 'footL', 25 * DEG, false], ['thighR', 'shinR', 'footR', 25 * DEG, false],
  ['upper_armL', 'forearmL', 'handL', 100 * DEG, true], ['upper_armR', 'forearmR', 'handR', 100 * DEG, true],
];
/** The bend (rad, between the upper bone's line and the lower's) over which the repair fades in: under BEND[0] the limb is
 *  near straight and its plane is noise. UPPER_TURN: the most a thigh or upper arm is turned about its length (a hip's and a shoulder's
 *  own range of rotation, about 90 degrees either way). */
export const BEND = [4 * DEG, 14 * DEG];
export const UPPER_TURN = { thigh: 90 * DEG, upper_arm: 100 * DEG };
/** How far past UPPER_TURN a clip's limb has to be before its wrist or ankle is let move (rad): the fade from keeping the joints to
 *  keeping the hinge. The posed body (LimbHinges) always keeps the joints: its hands and feet are on something. */
export const OVER = 25 * DEG;
const KEEP_TIME = 0.2;
/** The fastest the upper bone's turn may change (rad/s): where a clip swings a near-straight limb sideways, the plane it bends in wheels
 *  round faster than the swing (Loco_IdleMasc's left elbow: 13.5 degrees a frame raw, 54.8 squared unheld, 16.6 held at 360 a second);
 *  held, the rest of the way is the shortest arc for those frames. 360: no clip's fastest limb step grows by 5 degrees, and the sideways
 *  frames left are in the fastest one-shots (Loco_Roll 16, Trav_WallJump 18, Trav_LedgeClimbUp 14 of their limb frames). */
export const TURN_SPEED = 360 * DEG;
/** The same on the posed body, every frame (LimbHinges): faster, because what it squares (a hand put on a wall, a knee re-solved) moves
 *  faster than a clip's frame steps. */
export const TURN_SPEED_POSED = 720 * DEG;
/** The clips repaired: the core movement's (the suite's Loco_, Air_ and Trav_, and the old pack's swim and tread). */
const OLD = new Set(['swim', 'tread']);
export const HINGED = (name) => /^(Loco|Air|Trav)_/.test(name) || OLD.has(name);

// ---- quaternions [x, y, z, w] and vectors, plain (this runs over every frame of every clip it repairs, once) ----
const mul = (a, b, o = [0, 0, 0, 0]) => {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
  o[0] = aw * bx + ax * bw + ay * bz - az * by; o[1] = aw * by - ax * bz + ay * bw + az * bx;
  o[2] = aw * bz + ax * by - ay * bx + az * bw; o[3] = aw * bw - ax * bx - ay * by - az * bz;
  return o;
};
const inv = (a) => [-a[0], -a[1], -a[2], a[3]];
const rot = (q, v) => {
  const [x, y, z, w] = q, tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + y * tz - z * ty, v[1] + w * ty + z * tx - x * tz, v[2] + w * tz + x * ty - y * tx];
};
const aa = (ax, a) => { const s = Math.sin(a / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const nq = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
const X = [1, 0, 0], Y = [0, 1, 0];
const twistY = (q) => wrap(2 * Math.atan2(q[1], q[3])); // (either sign of q: the turn, not the turn plus a whole one)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
/** The shortest arc from unit a to unit b. */
const arc = (a, b) => { const c = cross(a, b), d = dot(a, b); return nq([c[0], c[1], c[2], 1 + d]); };
const signedAngle = (a, b, axis) => Math.atan2(dot(cross(a, b), axis), dot(a, b));
const get = (q, i) => [q[i], q[i + 1], q[i + 2], q[i + 3]];
const put = (q, i, v, ref) => { const s = v[0] * ref[0] + v[1] * ref[1] + v[2] * ref[2] + v[3] * ref[3] < 0 ? -1 : 1; for (let k = 0; k < 4; k++) q[i + k] = v[k] * s; };

/** The turn (rad) about the upper bone's own length that squares a limb to its hinge, the bend being flexion (qU, qL: the upper's and
 *  lower's local rotations; L: the limb's constants, limbOf), faded in with the bend (the caller holds it to the upper's range); 0 for
 *  a limb too straight to have a plane. */
function turnOf(qU, qL, L) {
  const u = rot(qU, Y), v = rot(mul(qU, qL), Y), h = rot(qU, L.hx);
  const w = smooth(BEND[0], BEND[1], Math.acos(clamp(dot(u, v), -1, 1)));
  if (w <= 0.001) return 0;
  // A cos(phi) + B sin(phi) + C = 0: v square to the turned hinge
  const hu = dot(h, u), hp = [h[0] - hu * u[0], h[1] - hu * u[1], h[2] - hu * u[2]], k2 = cross(u, hp);
  const A = dot(v, hp), B = dot(v, k2), C = hu * dot(v, u), R = Math.hypot(A, B);
  if (R < 1e-6) return 0;
  const psi = Math.atan2(B, A), a = Math.acos(clamp(-C / R, -1, 1));
  let best = null;
  for (const cand of [wrap(psi + a), wrap(psi - a)]) {
    // (the bend from the upper's own line, not from the lower's rest, which is bent already: a straight knee is not bent back)
    const th = signedAngle(u, v, rot(aa(u, cand), h));
    if (th >= -1e-3 && (best === null || Math.abs(cand) < Math.abs(best))) best = cand;
  }
  return best === null ? 0 : best * w;
}

/** The limb with its upper bone turned phi about its length: the lower bent about its hinge toward the direction it had, and the rest of
 *  the way, if phi falls short of square, by the shortest arc times `keep` (1: the joints stay where they were whatever phi is; 0: the
 *  lower on its hinge, the wrist or ankle moved); turned about its own length as LIMBS says; the end keeping its orientation in the limb's
 *  frame. prev: the lower's last turn (kept on the near side of a half turn). */
function turnBy(qU, qL, qE, L, phi, prev = null, keep = 1) {
  const u = rot(qU, Y), QL = mul(qU, qL), v = rot(QL, Y), E = mul(QL, qE);
  const qU2 = nq(mul(aa(u, phi), qU));
  const h2 = rot(qU2, L.hx), d2 = rot(qU2, L.dl);
  // the bend about the hinge: as far as it reaches toward v (keep 1: the arc does the rest), or the clip's whole bend, as flexion (keep 0)
  const thIn = signedAngle(d2, v, h2), thAll = Math.acos(clamp(dot(d2, v), -1, 1));
  const L0 = mul(aa(h2, thIn + (thAll - thIn) * (1 - keep)), mul(qU2, L.rL));
  const c = arc(norm(rot(L0, Y)), v), L1 = mul(keep >= 1 ? c : nq([c[0] * keep, c[1] * keep, c[2] * keep, 1 + (c[3] - 1) * keep]), L0);
  const qL1 = nq(mul(inv(qU2), L1));
  // its own turn: a forearm's keeps the hand's turn as it was; a shin keeps its own
  let tau = L.keepEnd ? wrap(twistY(mul(inv(L1), E)) - twistY(qE)) : twistY(mul(L.rLi, qL));
  // (past the half turn, the side nearest the last frame's: a turn wanted past the range is held at its end, never flipped to the other)
  if (prev && prev.tau !== undefined) tau += 2 * Math.PI * Math.round((prev.tau - tau) / (2 * Math.PI));
  if (prev) prev.tau = tau;
  const qL2 = nq(mul(qL1, aa(Y, clamp(tau, -L.lowerTurn, L.lowerTurn))));
  return [qU2, qL2, nq(mul(inv(mul(qU2, qL2)), E))];
}

/** phi stepped toward want by at most step, on the near side of a half turn and within the upper's range. */
const toward = (phi, want, step, max) => clamp(phi + clamp(wrap(want - phi), -step, step), -max, max);

/** A limb's constants from its row of LIMBS and the lower bone's rest rotation. */
function limbOf([un, , , lowerTurn, keepEnd], rL) {
  return { rL, rLi: inv(rL), hx: rot(rL, X), dl: rot(rL, Y), maxTurn: UPPER_TURN[un.replace(/[LR]$/, '')] ?? Math.PI, lowerTurn, keepEnd };
}

export function repairHinges(q, n, bones, rest, limbs = LIMBS, loop = false, fps = 30) {
  const nb = bones.length, step = TURN_SPEED / fps;
  let turned = 0;
  for (const row of limbs) {
    const iu = bones.indexOf(row[0]), il = bones.indexOf(row[1]), ie = bones.indexOf(row[2]);
    if (iu < 0 || il < 0 || ie < 0) continue;
    const L = limbOf(row, rest[il]), at = (f, i) => (f * nb + i) * 4;
    const want = Array.from({ length: n }, (_, f) => turnOf(get(q, at(f, iu)), get(q, at(f, il)), L));
    // the turn at most TURN_SPEED: held forward and held back, the two met halfway (no lag either way; round the loop twice for a loop)
    const fwd = want.slice(), bwd = want.slice(), laps = loop ? 2 : 1;
    for (let lap = 0; lap < laps; lap++) for (let f = loop ? 0 : 1; f < n; f++) fwd[f] = toward(fwd[(f + n - 1) % n], want[f], step, L.maxTurn);
    for (let lap = 0; lap < laps; lap++) for (let f = loop ? n - 1 : n - 2; f >= 0; f--) bwd[f] = toward(bwd[(f + 1) % n], want[f], step, L.maxTurn);
    const phi = fwd.map((a, f) => a + wrap(bwd[f] - a) / 2);
    if (loop) phi[n - 1] = phi[0];
    // past the upper's range, the clip's bend is not a body's: the lower kept on its hinge and the wrist or ankle let move, faded in over
    // OVER past the range (a hand hung beside the hip with the elbow bent back 26 degrees bends forward instead)
    const keep = want.map((x) => 1 - smooth(0, OVER, Math.abs(x) - L.maxTurn));
    // (and never faster than a whole in KEEP_TIME: the wrist or ankle let go and caught again over a few frames, not one)
    for (let lap = 0; lap < 2; lap++) for (let f = 1; f < n; f++) keep[f] = Math.max(keep[f], keep[f - 1] - 1 / (KEEP_TIME * fps)), keep[n - f - 1] = Math.max(keep[n - f - 1], keep[n - f] - 1 / (KEEP_TIME * fps));
    const prev = {};
    for (let f = 0; f < n; f++) {
      const qU = get(q, at(f, iu)), qL = get(q, at(f, il)), qE = get(q, at(f, ie));
      if (Math.abs(phi[f]) < 1e-5) { prev.tau = undefined; continue; }
      const r = turnBy(qU, qL, qE, L, phi[f], prev, keep[f]);
      if (Math.abs(phi[f]) > DEG) turned++;
      put(q, at(f, iu), r[0], qU); put(q, at(f, il), r[1], qL); put(q, at(f, ie), r[2], qE);
    }
  }
  return turned;
}

/** The same on a posed skeleton, every frame: bones by name, restOf(bone) its rest quaternion (a THREE.Quaternion). */
export class LimbHinges {
  constructor(bones, restOf, limbs = LIMBS) {
    this.limbs = [];
    for (const row of limbs) {
      const U = bones[row[0]], Lo = bones[row[1]], E = bones[row[2]];
      if (U && Lo && E) this.limbs.push({ U, Lo, E, arm: /arm/.test(row[0]), L: limbOf(row, restOf(Lo).toArray()), prev: {} });
    }
    this.turned = 0;
  }

  /** dt: the frame's (the turn's speed is held to TURN_SPEED_POSED); legs, arms: the weight of the upper's turn for each pair (0 leaves them
   *  as posed). */
  apply(dt, legs = 1, arms = 1) {
    this.turned = 0;
    const step = TURN_SPEED_POSED * Math.max(dt, 1e-3);
    for (const l of this.limbs) {
      const k = l.arm ? arms : legs, qU = l.U.quaternion.toArray(), qL = l.Lo.quaternion.toArray();
      l.phi = toward(l.phi ?? 0, k > 0.001 ? turnOf(qU, qL, l.L) * k : 0, step, l.L.maxTurn);
      if (Math.abs(l.phi) < 1e-5) { l.prev.tau = undefined; continue; }
      const r = turnBy(qU, qL, l.E.quaternion.toArray(), l.L, l.phi, l.prev);
      if (Math.abs(l.phi) > DEG) this.turned++;
      l.U.quaternion.fromArray(r[0]); l.Lo.quaternion.fromArray(r[1]); l.E.quaternion.fromArray(r[2]);
    }
  }
}

/** Per limb frame, the lower bone against its rest: its swing off the hinge (about its rest Z) and its flexion (about its rest X), degrees,
 *  twist (about its length) taken out first. */
export function offHinge(q, n, bones, rest, limbs = LIMBS) {
  const nb = bones.length, out = [];
  for (const [, ln] of limbs) {
    const il = bones.indexOf(ln);
    if (il < 0) continue;
    const ri = inv(rest[il]);
    for (let f = 0; f < n; f++) {
      let d = mul(ri, get(q, (f * nb + il) * 4));
      if (d[3] < 0) d = d.map((x) => -x);
      const t = nq([0, d[1], 0, d[3]]);
      let s = mul(d, inv(t));
      if (s[3] < 0) s = s.map((x) => -x);
      const sl = Math.hypot(s[0], s[1], s[2]), sa = 2 * Math.atan2(sl, s[3]);
      out.push({ limb: ln, f, side: sl > 1e-9 ? (s[2] / sl) * sa / DEG : 0, flex: sl > 1e-9 ? (s[0] / sl) * sa / DEG : 0 });
    }
  }
  return out;
}
