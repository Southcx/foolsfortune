// ---------------------------------------------------------------------------------------
// THE WRIST EASE: each wrist kept within what a wrist does, on the posed body, after the IK and the hinge repair, before the joint limits
// (character.js poseHands). The Courier's clips were retargeted bone by bone by direction (courier/anim/hinges.js), so a hand points
// where the capture's did but its palm faces wherever no turn left it: a hand raised to the chin bent 70 degrees toward the thumb, a
// fist turned 160 past the forearm's own turn (the pose audit, 2026-10-11: 73 emotes, every tool's idle). A wrist bends about 75 degrees
// toward the palm and 70 back, 20 toward the thumb and 35 toward the little finger, and the forearm turns about 90 either way of its
// middle (the AAOS ranges the pose audit holds them to: scripts/poseaudit.page.js); what is past that is eased back, two ways:
//   A FREE HAND   (nothing riding it, set on nothing): the palm turned about the fingers' own line (the hand points where it pointed),
//                 the forearm carrying that turn as a forearm does, to the turn that puts the bend in the wrist's range (a hand bent
//                 toward the thumb past 20 is, a quarter turn on, a hand bent back); a bend still past range after that is eased back
//                 toward the forearm's line
//   A BOUND HAND  (a tool rides it, or the IK set it on something: a haft, a pot, a wall): the hand stays exactly where it is, its turn
//                 too; the elbow swings about the line from the shoulder to the wrist (the swivel every arm IK has) to where the forearm
//                 meets the hand within range, never into the body (courier/anim/bodyproxies.js), within SWING of where it was
// The turn and the swing are chosen each frame by a search over candidates against the ranges, the last frame's choice preferred (so a
// pose never flips between two answers), and eased (no pop when a hand starts or stops being bound).
//
// Prior art: Final IK's TwistRelaxer (a twist between a bone's parent and child relaxed onto the bone between them), the swivel angle of
// the human arm's analytic IK (Tolani, Goswami and Badler, "Real-time inverse kinematics techniques for anthropomorphic limbs", 2000:
// the elbow's circle about the shoulder-to-wrist line, its angle chosen for the joint limits), and the AAOS's normal joint ranges.
//
//   const ease = new WristEase(ch, body)    ease.apply(dt, bound)   bound: { L, R } 0..1, how much of each hand's turn is someone's
//   ease.free(s) / ease.swing(s)             (degrees applied this frame, for a measure)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const DEG = Math.PI / 180;
/** The ranges eased to (degrees): inside the pose audit's (wrist flexion 75, extension 70, radial 20, ulnar 35, the forearm's turn 90 either
 *  way) by a margin, so what is eased reads within them. */
export const WRIST = { flex: 71, ext: 66, radial: 17, ulnar: 31, turn: 86 };
/** The most the elbow swings (rad); how fast the swing or the palm's turn follows its choice (rad/s: as fast as a clip turns a wrist, so a
 *  turn is never late to a pose, never a jump); how fast either lets go when nothing needs it (1/s). */
const SWING = 75 * DEG, RATE = 720 * DEG, FOLLOW = 18;
const BODY = ['chest', 'spine', 'pelvis', 'thighL', 'thighR'];
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion();
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _f = new THREE.Vector3(), _h = new THREE.Vector3(), _n0 = new THREE.Vector3(), _F = new THREE.Vector3(), _pw = new THREE.Vector3();
const _S = new THREE.Vector3(), _W = new THREE.Vector3(), _E = new THREE.Vector3(), _C = new THREE.Vector3(), _a = new THREE.Vector3(), _u0 = new THREE.Vector3(), _v0 = new THREE.Vector3(), _e = new THREE.Vector3(), _mid = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0), _M1 = new THREE.Matrix4(), _M2 = new THREE.Matrix4(), _t3 = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const perp = (v, ...axes) => { const o = v.clone(); for (const ax of axes) o.addScaledVector(ax, -o.dot(ax)); return o.normalize(); };

export class WristEase {
  constructor(ch, body = null) {
    this.ch = ch; this.body = body;
    const B = ch.bones, restW = (b) => ch.restCharQ.get(b), restP = (b) => ch.restPos.get(b);
    const inFrame = (b, wv) => wv.clone().applyQuaternion(restW(b).clone().invert());
    this.side = {};
    for (const s of ['L', 'R']) {
      const hand = B[`hand${s}`], fore = B[`forearm${s}`], arm = ch.arm[s];
      const palm = perp(arm.palmLocal.clone().normalize(), Y);
      const thumbW = restP(B[`thumb01${s}`]).clone().sub(restP(hand));
      const thumb = perp(inFrame(hand, thumbW), Y, palm), thumbF = perp(inFrame(fore, thumbW), Y);
      const hingeF = new THREE.Vector3().crossVectors(Y, thumbF).normalize();
      const palmW = arm.palmLocal.clone().applyQuaternion(restW(hand)), hingeFW = hingeF.clone().applyQuaternion(restW(fore));
      this.side[s] = { arm, hand, fore, upper: arm.upper, rest: ch.rest.get(hand).q.clone(), restInv: ch.rest.get(hand).q.clone().invert(), restFore: ch.rest.get(fore).q.clone(),
        flexAx: new THREE.Vector3().crossVectors(Y, palm).normalize(), devAx: new THREE.Vector3().crossVectors(Y, thumb).normalize(), hingeF, palmSign: Math.sign(palmW.dot(hingeFW)) || 1,
        // (in the upper arm's frame: the forearm's rest X, the axis the hinge repair squares, and the measured hinge, 5.7 degrees off it)
        sqL: perp(new THREE.Vector3(1, 0, 0).applyQuaternion(ch.rest.get(fore).q), Y), hL: hingeF.clone().applyQuaternion(ch.rest.get(fore).q),
        roll: 0, swing: 0, k: 0 };
    }
  }

  /** The wrist's bend (flexion +, deviation + toward the thumb: degrees) from the hand's turn in its forearm's frame (qh: local). */
  bend(S, qh, out) {
    _qa.copy(S.restInv).multiply(qh);
    if (_qa.w < 0) _qa.set(-_qa.x, -_qa.y, -_qa.z, -_qa.w);
    const tw = Math.atan2(_qa.y, _qa.w); _qb.set(0, -Math.sin(tw), 0, Math.cos(tw)).multiply(_qa); // (its twist about its length out)
    if (_qb.w < 0) _qb.set(-_qb.x, -_qb.y, -_qb.z, -_qb.w);
    const sv = Math.hypot(_qb.x, _qb.y, _qb.z), ang = 2 * Math.atan2(sv, _qb.w), k = sv > 1e-9 ? ang / sv : 0;
    _v.set(_qb.x * k, _qb.y * k, _qb.z * k);
    out.flex = _v.dot(S.flexAx) / DEG; out.dev = _v.dot(S.devAx) / DEG;
    return out;
  }
  /** The forearm's turn (degrees, + toward the way the elbow flexes) from the palm's way (H: the hand's world turn), the forearm's line f
   *  and the elbow's hinge h (world). */
  turn(S, H, f, h) {
    _pw.copy(S.arm.palmLocal).applyQuaternion(H); _pw.addScaledVector(f, -_pw.dot(f));
    _n0.copy(h).addScaledVector(f, -h.dot(f)).multiplyScalar(S.palmSign);
    _F.crossVectors(h, f); _F.addScaledVector(f, -_F.dot(f));
    if (_pw.lengthSq() < 1e-10 || _n0.lengthSq() < 1e-10 || _F.lengthSq() < 1e-10) return 0;
    return Math.atan2(_pw.dot(_F.normalize()), _pw.dot(_n0.normalize())) / DEG;
  }
  /** How far past the ranges (a cost: squared tens of degrees). */
  over(b, t) {
    const x = (v, lim) => (v > lim ? (v - lim) / 10 : 0);
    return x(b.flex, WRIST.flex) ** 2 + x(-b.flex, WRIST.ext) ** 2 + x(b.dev, WRIST.radial) ** 2 + x(-b.dev, WRIST.ulnar) ** 2 + x(Math.abs(t), WRIST.turn) ** 2;
  }
  /** The elbow's hinge (world) once the hinge repair has squared the arm: the upper arm turned about its line u until the forearm's rest X
   *  stands square to the plane the arm bends in (u, f), the bend being flexion; the hinge measured with the thumb (hingeF) carried by
   *  it. A near-straight arm keeps its upper bone's own turn. */
  hingeOf(S, u, f, out) {
    _n0.crossVectors(u, f);
    if (_n0.lengthSq() < 0.02) return out.copy(S.hL).applyQuaternion(S.upper.getWorldQuaternion(_q3));
    _n0.addScaledVector(u, -_n0.dot(u)).normalize(); _F.crossVectors(u, _n0);
    _M1.makeBasis(Y, S.sqL, _t3.crossVectors(Y, S.sqL)); _M2.makeBasis(u, _n0, _F);
    return out.copy(S.hL).applyMatrix4(_M2.multiply(_M1.transpose()));
  }

  apply(dt, bound = { L: 0, R: 0 }) {
    const ch = this.ch;
    ch.root.updateMatrixWorld(true);
    this.body?.place();
    for (const s of ['L', 'R']) {
      const S = this.side[s], k = THREE.MathUtils.clamp(bound[s] ?? 0, 0, 1);
      S.k = THREE.MathUtils.damp(S.k, k > 0.5 ? 1 : 0, 12, dt);
      if (S.k > 0.001) this.swingElbow(S, dt, S.k); else S.swing = THREE.MathUtils.damp(S.swing, 0, FOLLOW, dt);
    }
  }

  /** After the hinge repair: a free hand's palm turned about its fingers' line, and a bend past range eased back (bound: 0..1 per side). */
  relax(dt, bound = { L: 0, R: 0 }) {
    this.ch.root.updateMatrixWorld(true);
    for (const s of ['L', 'R']) {
      const S = this.side[s], free = 1 - THREE.MathUtils.clamp(bound[s] ?? 0, 0, 1);
      if (free > 0.001) this.rollPalm(S, dt, free); else S.roll = THREE.MathUtils.damp(S.roll, 0, FOLLOW, dt);
    }
  }

  // ---------------------------------------------------------------- a free hand: the palm turned about the fingers' line
  rollPalm(S, dt, w) {
    const hand = S.hand, fore = S.fore, b = {};
    const H = hand.getWorldQuaternion(new THREE.Quaternion()), qh0 = hand.quaternion.clone(), qf0 = fore.quaternion.clone();
    fore.getWorldQuaternion(_q2); _f.copy(Y).applyQuaternion(_q2);
    S.upper.getWorldQuaternion(_q3); _w.copy(Y).applyQuaternion(_q3);
    this.hingeOf(S, _w, _f, _h);
    const qh = new THREE.Quaternion(), Hr = new THREE.Quaternion(), RY = new THREE.Quaternion(), RYi = new THREE.Quaternion();
    const cost = (d) => {
      RY.setFromAxisAngle(Y, d); RYi.copy(RY).invert();
      qh.copy(RYi).multiply(qh0).multiply(RY); Hr.copy(H).multiply(RY);
      return this.over(this.bend(S, qh, b), this.turn(S, Hr, _f, _h));
    };
    const c0 = cost(0);
    let best = 0;
    if (c0 > 1e-6) {
      let bc = Infinity;
      const pick = (d) => { const c = cost(d) + 0.004 * Math.abs(d) / DEG + 0.006 * Math.abs(wrap(d - S.roll)) / DEG; if (c < bc) { bc = c; best = d; } };
      for (let d = -180; d < 180; d += 15) pick(d * DEG);
      const mid = best; for (let d = -12; d <= 12; d += 3) pick(mid + d * DEG);
    }
    S.roll = wrap(S.roll + THREE.MathUtils.clamp(wrap(best - S.roll), -RATE * dt, RATE * dt));
    const d = S.roll * w;
    if (Math.abs(d) > 1e-4) {
      RY.setFromAxisAngle(Y, d); RYi.copy(RY).invert();
      fore.quaternion.copy(qf0).multiply(RY);
      hand.quaternion.copy(RYi).multiply(qh0).multiply(RY);
    }
    // a bend still past range: eased back toward the forearm's line (the fingers' way moves; nothing rides this hand)
    this.bend(S, hand.quaternion, b);
    const fl = THREE.MathUtils.clamp(b.flex, -WRIST.ext, WRIST.flex), dv = THREE.MathUtils.clamp(b.dev, -WRIST.ulnar, WRIST.radial);
    if (Math.abs(fl - b.flex) + Math.abs(dv - b.dev) > 0.05) {
      // the bend's own rotation vector, its two shares clamped, put back on the twist it had (hand = rest · twist · bend)
      _qa.copy(S.restInv).multiply(hand.quaternion); if (_qa.w < 0) _qa.set(-_qa.x, -_qa.y, -_qa.z, -_qa.w);
      const tw = Math.atan2(_qa.y, _qa.w); _qc.set(0, Math.sin(tw), 0, Math.cos(tw));
      _qb.copy(_qc).invert().multiply(_qa);
      const sv = Math.hypot(_qb.x, _qb.y, _qb.z), ang = 2 * Math.atan2(sv, Math.abs(_qb.w)), kk = sv > 1e-9 ? (ang / sv) * Math.sign(_qb.w || 1) : 0;
      _v.set(_qb.x * kk, 0, _qb.z * kk); // (the bend: in the plane square to the hand's length)
      const a = _v.dot(S.flexAx), c = _v.dot(S.devAx);
      _v.addScaledVector(S.flexAx, (fl * DEG - a) * w).addScaledVector(S.devAx, (dv * DEG - c) * w);
      const L = _v.length();
      _qb.setFromAxisAngle(L > 1e-9 ? _w.copy(_v).divideScalar(L) : Y, L);
      hand.quaternion.copy(S.rest).multiply(_qc).multiply(_qb);
    }
    hand.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- a bound hand: the elbow swung about the shoulder-to-wrist line
  swingElbow(S, dt, w) {
    const ch = this.ch, arm = S.arm, b = {};
    arm.upper.getWorldPosition(_S); arm.hand.getWorldPosition(_W); arm.fore.getWorldPosition(_E);
    const H = arm.hand.getWorldQuaternion(new THREE.Quaternion()), F0 = arm.fore.getWorldQuaternion(new THREE.Quaternion());
    const f0 = new THREE.Vector3(0, 1, 0).applyQuaternion(F0);
    _a.subVectors(_W, _S); const dist = _a.length(); _a.divideScalar(dist || 1);
    const la = _E.distanceTo(_S), lb = _W.distanceTo(_E);
    const x = (la * la - lb * lb + dist * dist) / (2 * dist), r2 = la * la - x * x;
    if (!(r2 > 0.0004) || dist < 0.05) { S.swing = THREE.MathUtils.damp(S.swing, 0, FOLLOW, dt); return; } // (an arm too straight to swing)
    const r = Math.sqrt(r2);
    _C.copy(_S).addScaledVector(_a, x);
    _u0.subVectors(_E, _C); _u0.addScaledVector(_a, -_u0.dot(_a)).normalize(); _v0.crossVectors(_a, _u0);
    const qh = new THREE.Quaternion(), Fp = new THREE.Quaternion(), u = new THREE.Vector3(), f = new THREE.Vector3(), h = new THREE.Vector3();
    const at = (phi, out) => out.copy(_C).addScaledVector(_u0, r * Math.cos(phi)).addScaledVector(_v0, r * Math.sin(phi));
    const cost = (phi) => {
      at(phi, _e);
      f.subVectors(_W, _e).normalize(); u.subVectors(_e, _S).normalize();
      Fp.setFromUnitVectors(f0, f).multiply(F0);
      qh.copy(Fp).invert().multiply(H);
      let c = this.over(this.bend(S, qh, b), this.turn(S, H, f, this.hingeOf(S, u, f, h)));
      if (this.body) {
        _mid.copy(_e).lerp(_W, 0.5);
        for (const part of BODY) for (const px of this.body.of(part)) { const d = Math.max(this.body.depth(px, _e), this.body.depth(px, _mid)); if (d > 0) c += (d * 100) ** 2 * 4; }
      }
      return c;
    };
    const c0 = cost(0);
    let best = 0;
    if (c0 > 1e-6 || Math.abs(S.swing) > 1e-3) {
      let bc = c0 + 0.006 * Math.abs(S.swing) / DEG;
      const pick = (p) => { if (Math.abs(p) > SWING) return; const c = cost(p) + 0.003 * Math.abs(p) / DEG + 0.006 * Math.abs(p - S.swing) / DEG; if (c < bc) { bc = c; best = p; } };
      for (let p = -75; p <= 75; p += 7.5) pick(p * DEG);
      const mid = best; for (let p = -6; p <= 6; p += 2) pick(mid + p * DEG);
    }
    // (eased, as the swing is measured from where this frame's pose put the elbow: a choice, not a sum)
    S.swing += THREE.MathUtils.clamp(best - S.swing, -RATE * dt, RATE * dt);
    const phi = S.swing * w;
    if (Math.abs(phi) < 1e-4) return;
    at(phi, _e);
    const pole = _e.clone().addScaledVector(_e.clone().sub(_C).normalize(), 0.2);
    ch.solve2(arm.upper, arm.fore, arm.hand, arm.a, arm.b, _W.clone(), pole);
    ch.setWorldQuat(arm.hand, H);
    arm.hand.updateMatrixWorld(true);
  }
}
