// ---------------------------------------------------------------------------------------
// THE GRAB'S REACH: the rider's hand on the Solar Skiff's rail while a grab is held in the air (skiff.js: LMB the nose, RMB the tail,
// both the double; `techs.get('skiff').grab = { kind, t }`). The front hand (the left: the front foot is the left, the bow on the
// rider's left) takes the toe-side gunwale ahead of the front foot for the nose; the back hand (the right) the stern dome's lip behind
// the back foot for the tail; both, on the toe rail between the feet, for the double. The board's own tweak (skiff.js GRAB.tweak) turns
// the rider with it, so the grips are read off the hull's bone each frame and the hand finds the rail on the tweaked board as drawn.
//
//   UNDER     a clip, never a pose of its own: Skiff_Ollie's crouch (its frame 7, the rider's own suite: the feet on the deck, the hips
//             down) under UAL's Fixing_Kneeling (`kneel`: the upper body bent to work low in front of the knees), blended in by the
//             grab's weight. The boat's half is the same Skiff_Ollie frame (boatpose.js), so the feet stay on their spots.
//   THE LEAN  what the arm cannot reach from there (a short arm: 0.46 m, shoulder to wrist), the spine gives, toward the grip, at most
//             LEAN.max, spread over spine001 to spine003 (the reach's own share, as character.js reachHand's shoulder gives STRETCH)
//   THE HAND  two-bone IK (character.js reachHand) to the grip, solved whole and turned in from the clip's arm by the hand's weight;
//             the palm in against the rail's edge, the fingers on down the forearm's way and under it (the clip's own turn of the hand,
//             swung, then twisted at most REACH.twist), the elbow bent the way the clip bends it; the fingers curled about their hinges
//             and passed through rom.js (courier/anim/rom.js) there and then: the last word on them, as nothing after the techs' hands
//             touches a set hand's fingers (character.js: the wrists' ease, the hinge repair and the standoff leave them be), and rom.js
//             has no table for the arm or the spine. (Not the skiff's `limitsLast`: the ride's own fingers sit up to 9 degrees past
//             their limits, unclamped, and the whole table switched on with a grab snapped them)
//   WEIGHTS   each hand's own, eased in over the grab's first moments (REACH.in) and out on the let-go or the landing (REACH.out): a
//             nose grab turned into the double brings the second hand in on its own, never a snap
//
// Prior art: SSX's and Tony Hawk's grabs (a held air pose, the hand to the board's edge, the board tweaked under it), Unity's Animation
// Rigging Two Bone IK and Unreal's hand IK on a prop (a hand onto a handle, the animated pose kept under it), and the skiff's own ollie
// cut (rider.js: the crouch frame with its lift taken off the hips, casebook rule 19).
//
//   const G = new GrabReach(ch)   G.pose(rider, A, s, dt)  (in Rider.ride: the weights and the under-pose)
//   G.reach(ch, tech)  (in the skiff's hands(): the lean, the IK, the fingers)   G.gap(ch, tech)  palm to grip (m), each hand on the rail
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const damp = THREE.MathUtils.damp;
// the grips, in the skiff's frame (boat.js: +Z the bow, +X to the left, Y up, the deck at 0), measured on the hull's mesh at rest
// (Skiff_Hull: the toe-side gunwale runs at x -0.39, y 0.14 from z -0.63 to 0.66; the stern dome's lip at x -0.24, y 0.29, z -0.94;
// the rider's feet at z -0.04 and -0.77). `out`: across the rail, the way the fingers wrap over it
export const GRIPS = {
  L: { at: new THREE.Vector3(-0.39, 0.15, 0.18), out: new THREE.Vector3(-1, -0.35, 0.25).normalize() }, // the nose: ahead of the front foot
  R: { at: new THREE.Vector3(-0.25, 0.3, -0.93), out: new THREE.Vector3(-1, -0.2, -0.45).normalize() }, // the tail: the stern dome's lip
  // the double: both hands on the toe rail between the feet (the nose's and the tail's grips are 1.1 m apart, the shoulders 0.37: a
  // body leant to one wrung the other arm straight past its elbow, the pose audit's 70 degrees)
  double: {
    L: { at: new THREE.Vector3(-0.39, 0.15, -0.06), out: new THREE.Vector3(-1, -0.35, 0.1).normalize() },
    R: { at: new THREE.Vector3(-0.39, 0.15, -0.72), out: new THREE.Vector3(-1, -0.35, -0.35).normalize() },
  },
};
const HANDS = { nose: ['L'], tail: ['R'], double: ['L', 'R'] };
const UNDER = { legs: 'Skiff_Ollie', at: 0.23, arms: 'kneel', armsAt: 0.5 }; // (the ollie's crouch, rider.js OLLIE.crouch)
const REACH = { in: 14, out: 9, curl: 0.9, thumb: 0.35, palm: 0.025, wrap: 0.25, twist: 0.6, poleAt: 0.3, bent: 0.03, open: 0.6 };
// (rates per real second; curl rad; the palm this far out from the rail's edge, m; how far the fingers turn out over it; the most the hand
// turns about them, rad; the elbow's pole this far out (m), off the line where the elbow is this far off it (m), leaning out and back so much)
const LEAN = { passes: 3, max: 0.75, share: [['spine001', 0.3], ['spine002', 0.35], ['spine003', 0.35]], slack: 0.75 }; // (rad; the reach the lean aims for, of the arm's)
const smooth = (x) => x * x * (3 - 2 * x);
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _mg = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _fq = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1), _bend = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3(), _up = new THREE.Vector3(), _f = new THREE.Vector3(), _g = new THREE.Vector3(), _h = new THREE.Vector3(), _k = new THREE.Vector3();

export class GrabReach {
  constructor(ch) {
    this.ch = ch;
    this.w = { L: 0, R: 0 };
    this.under = 0;
    this.dbl = 0; // (how far the grips are the double's: eased, so a nose turned double slides the front hand along the rail)
    this.U = ch.clips.pose(); this.V = ch.clips.pose();
    this.upper = ch.clips.mask({ spine001: 1, spine002: 1, spine003: 1, spine004: 1, spine005: 1, head: 1, 'upper_arm*': 1, 'forearm*': 1, 'hand*': 1, 'f_*': 1, 'thumb*': 1 });
    // each hand's fingers and their limits (the Courier's own table, courier/anim/rom.js): curled about the hinge, clamped by it
    this.fingers = {};
    for (const s of ['L', 'R']) this.fingers[s] = (ch.limits?.list || []).filter((j) => ch.arm[s].fingers.includes(j.bone)).map((j) => ({ j, k: /^thumb/.test(j.bone.name) ? REACH.thumb : REACH.curl }));
  }

  /** The clip time of the crouch under the grab (boatpose.js plays the boat's half at it). */
  get at() { return UNDER.at; }

  /** The larger hand's weight. */
  get weight() { return Math.max(this.w.L, this.w.R); }

  /** In Rider.ride, after the ollie and the glide: each hand's weight eased, then the under-pose blended into A by the larger. */
  pose(R, A, s, dt) {
    const g = s.grab && s.air ? s.grab : null, want = g ? HANDS[g.kind] || [] : [];
    for (const side of ['L', 'R']) {
      const on = want.includes(side);
      this.w[side] = damp(this.w[side], on ? 1 : 0, on ? REACH.in : REACH.out, dt);
      if (this.w[side] < 1e-3 && !on) this.w[side] = 0;
    }
    this.dbl = damp(this.dbl, g?.kind === 'double' ? 1 : g ? 0 : this.dbl, REACH.in, dt); // (let go: the grips stay where they were)
    this.under = this.weight;
    if (this.under <= 0.01) return;
    const C = this.ch.clips, U = this.U;
    if (!C.clips[UNDER.legs]) return;
    C.sample(UNDER.legs, UNDER.at, U, false);
    U.p[1] -= R.lift(UNDER.legs, UNDER.at); // (the feet stay on the deck: rider.js, casebook rule 19)
    if (C.clips[UNDER.arms]) C.blend(U, C.sample(UNDER.arms, UNDER.armsAt, this.V, false), 1, this.upper, 0);
    C.blend(A, U, smooth(this.under));
  }

  /** The hull's frame now against its rest, so a point of the skiff's frame at rest lands where the hull is drawn: M (world). */
  frame(skiff, M) {
    const hull = skiff.bone?.hull, G = skiff.group;
    G.updateMatrixWorld(true);
    if (!hull || !skiff.P) return M.copy(G.matrixWorld);
    if (!this.hullRestInv) { // (the hull's rest in the group's frame: its bones' rest from boatpose.js, under the armature's own node)
      const chain = [];
      let b = hull;
      while (b && b.isBone) { chain.unshift(b); b = b.parent; }
      _m.copy(G.matrixWorld).invert().multiply(b.matrixWorld);
      const P = skiff.P;
      for (const x of chain) {
        const i = P.index[x.name];
        _a.fromArray(P.rest.p, i * 3); _q.fromArray(P.rest.q, i * 4); _b.fromArray(P.rest.s, i * 3);
        _m.multiply(_m2.compose(_a, _q, _b));
      }
      this.hullRestInv = _m.clone().invert();
    }
    hull.updateWorldMatrix(true, false);
    return M.multiplyMatrices(hull.matrixWorld, this.hullRestInv);
  }

  /** A hand's grip in the world: the point, the board's up, the way across the rail (into p, up, out); the double's by `dbl`. */
  grip(side, M, p, up, out) {
    const a = GRIPS[side], b = GRIPS.double[side], k = smooth(this.dbl);
    p.lerpVectors(a.at, b.at, k).applyMatrix4(M);
    up.set(0, 1, 0).transformDirection(M);
    out.lerpVectors(a.out, b.out, k).normalize().transformDirection(M);
  }

  /** In the skiff's hands(): the lean toward the grips, each hand onto its grip, its fingers over the rail. */
  reach(ch, tech) {
    const wMax = this.weight;
    if (wMax < 1e-3 || !tech.skiff?.group) return;
    const M = this.frame(tech.skiff, this._M ||= new THREE.Matrix4());
    const sides = ['L', 'R'].filter((s) => this.w[s] > 1e-3), B = ch.bones;
    ch.root.updateMatrixWorld(true);
    // the lean: the spine bent from the hips toward the grips by what the arms are short of them; for the double, toward the hand
    // further short the more (each side's shoulder and grip weighed by its shortfall), by the larger shortfall. In LEAN.passes, each
    // measured again from where the last left the shoulders (an arc of the shortfall's length closes less than the shortfall)
    this.lean = 0;
    for (let n = 0; n < LEAN.passes && this.lean < LEAN.max; n++) {
      const ang = Math.min(LEAN.max - this.lean, this.leanBy(ch, M, sides)) * smooth(Math.min(1, wMax));
      if (!(ang > 1e-3)) break;
      for (const [b, k] of LEAN.share) if (B[b]) { ch.rotW(B[b], _k, ang * k); B[b].updateMatrixWorld(true); }
      this.lean += ang;
    }
    // each hand: round the rail's edge as a hand takes a ledge in front of it (the palm turned in to the board, the fingers on down the
    // forearm's way and under the edge), the wrist where that puts the palm
    const fq = ch.root.getWorldQuaternion(_fq), side = _f, back = _g;
    for (const s of sides) {
      const arm = ch.arm[s], w = smooth(Math.min(1, this.w[s])), p = _a, up = _b, out = _c;
      this.grip(s, M, p, up, out);
      p.addScaledVector(out, REACH.palm);
      const S = arm.upper.getWorldPosition(_d), fingers = S.sub(p).negate().normalize().addScaledVector(out, REACH.wrap).normalize();
      // the hand's turn: the clip's own, swung (no twist) until the fingers run that way, then turned about them toward the palm in on
      // the rail by at most REACH.twist (a forearm turned much past the clip's own reads as a wrung wrist: the pose audit's supination)
      const q = arm.hand.getWorldQuaternion(_q3);
      q.premultiply(_q2.setFromUnitVectors(_e.set(0, 1, 0).applyQuaternion(q), fingers));
      const palmNow = _e.copy(arm.palmLocal).applyQuaternion(q), palmWant = _h.copy(out).negate().addScaledVector(fingers, out.dot(fingers)).normalize();
      palmNow.addScaledVector(fingers, -palmNow.dot(fingers)).normalize();
      const turn = Math.atan2(_k.crossVectors(palmNow, palmWant).dot(fingers), palmNow.dot(palmWant));
      q.premultiply(_q2.setFromAxisAngle(fingers, THREE.MathUtils.clamp(turn, -REACH.twist, REACH.twist)));
      arm.hand.getWorldScale(_s);
      const wrist = _e.copy(arm.palmPt).multiply(_s).applyQuaternion(q).negate().add(p);
      // the elbow's pole: the way the clip already bends it, off the line from the shoulder to the wrist (the kneel's: out and back),
      // turned a little out and back from the body, and only that where the arm hangs straight. Never reachHand's own, under the elbow:
      // a reach straight down has no side there (the pose audit: the elbow 70 degrees past straight)
      side.set(arm.side ?? (s === 'L' ? 1 : -1), 0, 0).applyQuaternion(fq); back.set(0, 0, -1).applyQuaternion(fq);
      const S2 = arm.upper.getWorldPosition(_h), E = arm.fore.getWorldPosition(_d), line = _k.copy(wrist).sub(S2).normalize();
      const bend = _bend.copy(E).sub(S2), along = bend.dot(line);
      bend.addScaledVector(line, -along);
      const open = _g.copy(side).add(back).normalize();
      if (bend.length() > REACH.bent) bend.normalize().lerp(open, REACH.open).normalize(); else bend.copy(open);
      const pole = E.addScaledVector(bend, REACH.poleAt);
      // solved whole, then each bone of the arm turned from the clip's toward the solution by the hand's weight (reachHand's own weight
      // lerps the target only, and re-solves the arm whole whatever it is: at a weight near nothing the elbow still jumped to the pole)
      const bones = [arm.upper, arm.fore, arm.hand], was = this.was ||= bones.map(() => new THREE.Quaternion()), at = this.at0 ||= new THREE.Vector3();
      bones.forEach((b, i) => was[i].copy(b.quaternion)); at.copy(arm.upper.position);
      ch.reachHand(s, wrist, q, 1, 0, pole);
      if (w < 1) {
        bones.forEach((b, i) => { _q.copy(b.quaternion); b.quaternion.copy(was[i]).slerp(_q, w); });
        arm.upper.position.lerpVectors(at, arm.upper.position, w);
        arm.upper.updateMatrixWorld(true);
      }
      // the fingers closed on the rail, through their limits at once (rom.js: the last to touch them)
      for (const { j, k } of this.fingers[s]) {
        j.bone.quaternion.multiply(_q.setFromAxisAngle(j.hinge, k * w));
        ch.limits.limit(j);
      }
      arm.hand.updateMatrixWorld(true);
    }
    // the sheet runs to the left hand (skiff.js afterPose draws it before the hands are set): drawn again to where that hand went
    if (this.w.L > 1e-3 && tech.skiff.rope?.visible) tech.skiff.drawRope(tech.game.scene, ch.arm.L.hand.getWorldPosition(_a));
  }

  /** How far to lean (rad) and about what (into _k, the world): from the hips, the shoulders toward the grips by their shortfall. */
  leanBy(ch, M, sides) {
    const hip = ch.bones.spine.getWorldPosition(_a), sh = _b.set(0, 0, 0), to = _c.set(0, 0, 0);
    let short = 0, sum = 0;
    for (const s of sides) {
      const arm = ch.arm[s], S = arm.upper.getWorldPosition(_d), reach = (arm.a + arm.b + this.palmLen(arm)) * LEAN.slack;
      this.grip(s, M, _e, _up, _f);
      const d = S.distanceTo(_e) - reach, k = Math.max(0.01, d) * this.w[s];
      short = Math.max(short, d);
      sh.addScaledVector(S, k); to.addScaledVector(_e, k); sum += k;
    }
    if (short <= 0) return 0;
    const r1 = sh.divideScalar(sum).sub(hip), r2 = to.divideScalar(sum).sub(hip);
    _k.crossVectors(r1, r2);
    if (_k.lengthSq() < 1e-8) return 0;
    _k.normalize();
    return Math.min(short / Math.max(0.2, r1.length()), r1.angleTo(r2));
  }

  /** The palm's reach past the wrist (m, the hand's own scale). */
  palmLen(arm) { arm.hand.getWorldScale(_s); return _g.copy(arm.palmPt).multiply(_s).length(); }

  /** Palm to grip now (m), for each hand on the rail (the pose audit's measure). */
  gap(ch, tech) {
    const out = {};
    if (!tech.skiff?.group) return out;
    const M = this.frame(tech.skiff, _mg);
    for (const s of ['L', 'R']) {
      if (this.w[s] < 0.5) continue;
      const arm = ch.arm[s];
      arm.hand.updateWorldMatrix(true, false);
      this.grip(s, M, _a, _b, _c);
      _a.addScaledVector(_c, REACH.palm);
      out[s] = _d.copy(arm.palmPt).applyMatrix4(arm.hand.matrixWorld).distanceTo(_a);
    }
    return out;
  }
}
