// ---------------------------------------------------------------------------------------
// THE HAND IN THE FACE (plain name; docs/ref/WAVE-RIDING.md 2 and 4): the stall's hand, the rider's trailing hand dragged in the wave's
// face to brake under the lip, and laid there through the barrel. A light correction only (CLAUDE.md "Animation": IK is a hand on a
// surface, never a whole pose): the arm on the face's side (the shoulder nearer the wall of water) is reached by the house's two-bone
// reach (character.js reachHand) to a point on the face beside the hip and a little behind, at the water's own height there, its weight
// eased in with the stall and the cover and out again; the hand keeps the turn the clip gave it. Where the hand meets the water a sheet
// of spray is thrown back off it (the look's rail spray, vfx/waves/effects.js `wave.rail.spray`, held while it drags).
//
// Prior art: every surf film's barrel (the hand trailing the face, the spray off the fingers), the tube in Treyarch's Kelly Slater game
// (2002; the stall as a hand in the wall), the grab's reach (courier/skiff/grabreach.js: the house's hand on a surface).
//
//   const H = new HandDrag(surf)   H.ease(dt) (surf.frame: the weight)   H.reach(ch) (skiff.hands(): the IK and the spray)   HAND_DRAG
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** in / out: the weight's rates (/s); w: the most it takes; reach: metres up the face (against the wave's travel) from the hip; back:
 *  metres behind along the crest; dip: metres into the water; spray: its strength at full weight; from: the cover that lays it there
 *  with no stall held; lean: the spine bent from the hips toward the water by what the arm is short of it (rad at most, in passes, over
 *  the torso's length, spread as the grab's lean is: grabreach.js LEAN). */
export const HAND_DRAG = { in: 7, out: 4, w: 0.9, reach: 0.5, back: 0.35, dip: 0.05, spray: 0.9, from: 0.55, lean: { max: 0.95, passes: 3, torso: 0.55, share: [['spine001', 0.3], ['spine002', 0.35], ['spine003', 0.35]] } };

const _t = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _d = new THREE.Vector3();

export class HandDrag {
  constructor(surf) { this.surf = surf; this.w = 0; this.side = null; this.spray = null; this.at = new THREE.Vector3(); }
  /** Each frame (real time): the weight toward the stall or the cover, and the spray let go when it is gone. */
  ease(dt) {
    const S = this.surf, want = S.sk.active && S.sk.phase === 'ride' && !S.sk.air && (S.stall || (S.tube && S.cover > HAND_DRAG.from));
    this.w += ((want ? HAND_DRAG.w : 0) - this.w) * (1 - Math.exp(-(want ? HAND_DRAG.in : HAND_DRAG.out) * dt));
    if (this.w < 0.02) { this.w = 0; this.side = null; if (this.spray) { this.spray.stop?.(); this.spray = null; } }
  }
  /** In the skiff's hands() (after the clips and the grab's reach): the face's arm onto the water. */
  reach(ch) {
    const S = this.surf, sk = S.sk, P = sk.P, R = sk.dunes, pool = S.pool;
    if (this.w <= 0 || !pool || !R?.rideHeight || !ch?.arm) return;
    const f = pool.frame(P.pos.x, P.pos.z); if (!f) return;
    // the point: up the face from the hip (against the wave's travel), a little behind along the crest, at the water there
    const H = HAND_DRAG, x = P.pos.x - f.travel.x * H.reach - f.crest.x * H.back, z = P.pos.z - f.travel.z * H.reach - f.crest.z * H.back;
    _t.set(x, R.rideHeight(x, z) - H.dip, z);
    // the arm on the face's side: the shoulder nearer the point, chosen once a drag and kept
    if (!this.side) { const dL = ch.arm.L.upper.getWorldPosition(_a).distanceToSquared(_t), dR = ch.arm.R.upper.getWorldPosition(_b).distanceToSquared(_t); this.side = dL < dR ? 'L' : 'R'; }
    // the lean: an upright rider's arm stops well short of the water, so the spine bends toward it from the hips (about the axis across
    // the way to the point), by the shortfall over the torso's length, in passes, as the grab's lean does (grabreach.js)
    const arm = ch.arm[this.side], B = ch.bones, L = H.lean, len = (arm.a + arm.b) * 1.02;
    ch.root?.updateMatrixWorld?.(true);
    for (let n = 0, bent = 0; n < L.passes && bent < L.max; n++) {
      const Sh = arm.upper.getWorldPosition(_a), short = Sh.distanceTo(_t) - len; if (!(short > 0.01)) break;
      const ang = Math.min(L.max - bent, short / L.torso) * this.w;
      _d.set(_t.x - Sh.x, 0, _t.z - Sh.z); if (_d.lengthSq() < 1e-6) break; _d.normalize();
      _b.set(_d.z, 0, -_d.x); // (the axis: up crossed with the way to the point, so the top of the body tips toward it)
      for (const [bn, k] of L.share) if (B?.[bn]) { ch.rotW(B[bn], _b, ang * k); B[bn].updateMatrixWorld(true); }
      bent += ang;
    }
    arm.hand.getWorldQuaternion(_q);
    ch.reachHand(this.side, _t, _q, this.w);
    // the spray off the fingers, thrown back down the crest and up off the face
    const V = S.game?.vfx; this.at.copy(ch.arm[this.side].hand.getWorldPosition(_a)); this.gap = this.at.distanceTo(_t); this.at.lerp(_t, 0.6); // (the spray where the fingers meet the face: toward the water's point)
    if (V && this.w > 0.3) {
      _d.set(-f.crest.x * 0.9 - f.travel.x * 0.3, 0.6, -f.crest.z * 0.9 - f.travel.z * 0.3).normalize();
      if (!this.spray) this.spray = V.play?.('wave.rail.spray', { pos: this.at.clone(), dir: _d.clone() }) || null;
      if (this.spray) { this.spray.pos?.copy?.(this.at); this.spray.dir?.copy?.(_d); this.spray.k = H.spray * this.w; }
    }
  }
}
