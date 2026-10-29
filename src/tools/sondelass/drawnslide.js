// ---------------------------------------------------------------------------------------
// THE DRAWN SLIDE: the core slide (C at speed: the core movement's, its speed, capsule and timing untouched) taken with the cutlass in the
// hand. Until now the blade's en garde was laid over the reclined slide, both arms held out before a body lying back; now the slide is
// the slide's own (its legs, its spine, its free hand trailing on the floor) and only the blade arm is the cutlass's: the hand low beside
// the right hip, the blade laid back behind them, its point trailing over the floor (stances.js `cutlassSlide`, baked over the slide's
// own loop). A pose only: the drawn slide's weight is the slide's own (player.slideBlend), and with it off (`DRAWN_SLIDE.on`) the
// Sondelass's layer is what it was. Owned by the Sondelass (sondelass.js animate and hands), as the drawn run is.
//
// The free hand on the floor is a light correction (CLAUDE.md, Animation): the clip already puts it there; where the floor under it is
// not the clip's (a slope, a step, the slide's drop-in), the palm is moved at most CORRECT metres up or down onto the ground under it, and
// only while the clip has it within NEAR of the floor. Its turn is the clip's. rom.js has the last word after (character/hands.js).
//
// Prior art: Strider Hiryu's slide and Zero's dash-slide (Mega Man X), the blade behind and low; Ghost of Tsushima's evade with the
// katana held low and back; the baseball slide's trailing hand (the suite's Trav_SlideLoop, as captured); the drawn run's own way
// (sondelass.js drawnRun: a stance baked over the core loop, sampled on its clock, laid under the strokes).
//
//   const slide = new DrawnSlide()
//   slide.pose(ch, base, layer, slideW, dt)   (in the Sondelass's animate, the cutlass form: the layer given the slide's body by its weight)
//   slide.hands(ch, ground)                   (in its hands, the cutlass held: the free hand's palm onto the floor)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** on: the drawn slide at all; OUT: how fast it lets go once the slide does (1/s; the drawn run takes the blade from it as fast, both
 *  laying it behind them: following the slide's own weight down, the blade swung forward through the hips into the en garde); CORRECT: the most the free hand is moved onto the floor (m); NEAR: the clip's palm within this of the
 *  floor for the correction to hold (m, full at NEAR[0], none past NEAR[1]); LIFT: the palm kept this far over the floor (m). */
export const DRAWN_SLIDE = { on: true, CORRECT: 0.12, NEAR: [0.14, 0.3], LIFT: 0.02, OUT: 12 };
const CLIP = 'stance:cutlassSlide';
const _p = new THREE.Vector3(), _h = new THREE.Vector3(), _f0 = new THREE.Vector3(), _f1 = new THREE.Vector3(), _q = new THREE.Quaternion(), _r = new THREE.Quaternion();

export class DrawnSlide {
  constructor() { this.w = 0; this.blade = null; this.buf = null; this.stance = null; }

  /** The layer's body made the slide's own (from `base`: the core slide as it is posed now), the blade arm the stance's, by the slide's
   *  weight. The blade arm's bones: the right arm, hand and fingers. */
  pose(ch, base, layer, slideW, dt) {
    const C = ch.clips;
    // (and through the slide's way up, the suite's Slide_Exit bridged under the run while ch.st.exitT runs, character.js: the drawn run's
    //  blade low beside the hip went through the rising thigh and the crouched hips, 6 to 8 cm, the pose audit; the slide's is held out
    //  wide of them until the body is up)
    const ex = ch.st?.exitT, up = ex !== undefined ? 1 - THREE.MathUtils.smoothstep(ex, 0.12, 0.4) : 0;
    const want = DRAWN_SLIDE.on && C.clips[CLIP] ? THREE.MathUtils.clamp(Math.max(slideW, up), 0, 1) : 0;
    this.w = want >= this.w ? want : Math.max(want, THREE.MathUtils.damp(this.w, 0, DRAWN_SLIDE.OUT, dt));
    if (this.w < 0.001) return;
    this.blade ||= C.bones.map((b, i) => (/R$/.test(b) && /arm|hand|f_|thumb/.test(b) ? i : -1)).filter((i) => i >= 0);
    const sT = ch.slideTrack, at = sT?.cur === 'slideLoop' ? sT.t : 0; // (the loop's own clock; in the drop-in, its first frame)
    const st = C.sample(CLIP, at, (this.stance ||= C.pose()));
    const P = (this.buf ||= C.pose());
    P.q.set(base.q); P.p.set(base.p);
    for (const b of this.blade) for (let k = 0; k < 4; k++) P.q[b * 4 + k] = st.q[b * 4 + k];
    C.blend(layer, P, this.w);
  }

  /** The free hand's palm onto the floor under it, by the slide's weight and how near the clip already has it. `ground(x, z, yTop)`:
   *  the floor's height there, or null. */
  hands(ch, ground) {
    if (this.w < 0.01 || !ground) return;
    const arm = ch.arm.L, D = DRAWN_SLIDE;
    arm.hand.getWorldQuaternion(_q);
    const palm = _p.copy(arm.palmPt).applyQuaternion(_q).add(arm.hand.getWorldPosition(_h));
    const gy = ground(palm.x, palm.z, palm.y + 0.4);
    if (gy == null) return;
    const over = palm.y - gy;
    const near = 1 - THREE.MathUtils.smoothstep(over, D.NEAR[0], D.NEAR[1]);
    if (near < 0.01) return;
    const dy = THREE.MathUtils.clamp(gy + D.LIFT - palm.y, -D.CORRECT, D.CORRECT);
    // (the hand carried with its forearm, the wrist as the clip bends it: held at its world turn while the arm moved, it bent the wrist
    //  45 degrees toward the thumb, the pose audit)
    _f0.copy(_h).sub(arm.fore.getWorldPosition(_p)).normalize();
    // (not marked as set on something: the wrist's ease still brings the clip's own bend back into range, as on the core slide; marked,
    //  the free wrist was left 36 degrees toward the thumb, the pose audit: character/hands.js, anim/wristease.js)
    const mark = ch.reachMark; ch.reachMark = false;
    ch.reachHand('L', _h.setY(_h.y + dy), _q, this.w * near);
    ch.reachMark = mark;
    _f1.copy(arm.hand.getWorldPosition(_h)).sub(arm.fore.getWorldPosition(_p)).normalize();
    ch.setWorldQuat(arm.hand, _r.setFromUnitVectors(_f0, _f1).multiply(_q));
    arm.hand.updateMatrixWorld(true);
  }
}
