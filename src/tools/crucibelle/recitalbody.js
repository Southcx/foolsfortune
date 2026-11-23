// ---------------------------------------------------------------------------------------
// THE CONCERT BODY (plain name; South, 2026-11-22: "improving the animations to make it feel like a live concert and jamming out"): the
// Courier's body while the combat recital is on (tools/crucibelle/recital.js), laid as small additive turns over whatever the clips
// pose, every one a smooth function of the music's beat (the bell's clock: grid(), now()), never a stepped key (South retired those as
// choppy, 2026-11-15):
//   - the head nodding a little after each beat, the chest dipping with it, and the knees giving on the beat while they stand (the
//     hips let down a few centimetres; the foot IK bends the knees to keep the soles on the floor: courier/character/feet.js);
//   - the body swaying with the bar (a roll and a twist over four beats);
//   - the guitar's neck lifted while the upper register plays (keys 6 to 0), and the body leaning back into a held note (the feedback)
//     and further into the rockstar moment;
//   - the strumming arm's windmill on the strum chain's fourth: the upper arm swung a whole turn about the shoulder, down, back, over the
//     head and down onto the strings, the hand let go of the guitar while it flies;
//   - the rockstar moment's knees: the kneel (the carry's set-down clip, courier/moves/carry.js) on the legs where they stand, eased in
//     and out. The capsule never moves: the core movement is untouched, and so is the run (every turn here is weighted by the recital's
//     weight, the bounce and the kneel by how still the Courier stands).
// Every turn is laid before the hands are reached and before the joint limits (rom.js has the last word: courier/character/hands.js
// applies them after the tools' hands), so the hands stay on the guitar whatever the body does. Not in the first person.
//
// Prior art: the procedural "groove" layers of rhythm games (Hi-Fi Rush's Chai bobbing to the track, Rock Band's band animating to the
// chart's beat), additive animation layers (Unreal's additive anim, Naughty Dog's procedural lean), Pete Townshend's windmill, Chuck
// Berry's and Angus Young's knee slides, and every guitarist's head bob a hair behind the kick.
//
//   new RecitalBody(recital)   .pose(ch, base, dt) (the tool's animate, after its layer)   .turn(ch, dt) (placed, before the hands)
//   .lift (0..1, the neck raised)   .reachR (the strumming hand's share)   CONCERT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The concert body's sizes (radians, metres; a beat's share where it says `lag`). */
export const CONCERT = {
  nod: 0.17, nodLag: 0.07, chest: 0.05, dip: 0.035, sway: 0.07, twist: 0.06,
  lean: { feedback: 0.55, rockstar: 1, spine: 0.13, chest: 0.15, head: 0.14 },
  lift: { up: 0.32, ease: 6, hold: 2 }, wind: 0.5, kneelAt: 1.6, kneelSink: 0.025,
  slide: { lean: 1.25, shin: 0.55, sink: 0.04, head: 0.35 }, // (the knee slide: its lean as a share of the rockstar's, the thighs swung back to lay the shins along the floor, the head thrown back)
};
const C_ = CONCERT, TAU = Math.PI * 2;
const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const pulse = (f) => Math.pow(0.5 + 0.5 * Math.cos(TAU * f), 3); // (1 on the beat, falling smoothly away between)
const _f = new THREE.Vector3(), _l = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _q = new THREE.Quaternion();

export class RecitalBody {
  constructor(recital) {
    this.r = recital; this.tool = recital.tool;
    this.e = 0; this.act = 0; this.lift = 0; this.liftT = 0; this.lean = 0; this.kneel = 0; this.stand = 0; this.reachR = 1;
  }
  /** Something was played: the body livens. `high`: the upper register (the neck lifted). */
  played(high = false) { this.act = 1; if (high) this.liftT = C_.lift.hold; }
  /** The beat now, in beats (its fraction the phase). */
  beats() { const T = this.tool, G = T.grid(); return (T.now() - G.t0) / G.spb; }

  /** Before the hands: the turns laid on the posed body. */
  turn(ch, dt) {
    const T = this.tool, P = T.P, play = this.r.play, w = this.r.w;
    this.act = Math.max(0, this.act - dt * 0.6); this.liftT -= dt;
    this.e = THREE.MathUtils.damp(this.e, 0.45 + 0.4 * this.act + 0.25 * T.fever, 3, dt);
    this.lift = THREE.MathUtils.damp(this.lift, this.liftT > 0 ? 1 : 0, C_.lift.ease, dt);
    this.slide = P.fp ? 0 : (P.slideBlend || 0) * w; // (the knee slide's weight: the core slide's own)
    const leanWant = Math.max(play.rockT > 0 ? C_.lean.rockstar : play.feedbackOn ? C_.lean.feedback : 0, C_.slide.lean * (P.slideBlend || 0));
    this.lean = THREE.MathUtils.damp(this.lean, leanWant, 7, dt);
    this.reachR = 1;
    if (P.fp || w < 0.01) return;
    const B = ch.bones, b = this.beats(), f = b - Math.floor(b), k = w * this.e;
    const q = ch.root.getWorldQuaternion(_q); _f.set(0, 0, 1).applyQuaternion(q).setY(0).normalize(); _l.set(1, 0, 0).applyQuaternion(q).setY(0).normalize();
    const p = pulse(f), ph = pulse(f - C_.nodLag), sway = Math.sin((Math.PI * b) / 2), L = this.lean * w;
    // (a turn about the body's left axis, positive, tips it forward; about its forward axis, a roll; about up, a twist)
    ch.rotW(B.spine001, _f, C_.sway * k * sway);
    ch.rotW(B.spine002, _l, C_.chest * k * p - C_.lean.spine * L);
    ch.rotW(B.spine003, _u, C_.twist * k * sway);
    ch.rotW(B.spine003, _l, -C_.lean.chest * L);
    ch.rotW(B.head, _l, C_.nod * k * ph - C_.lean.head * L - C_.slide.head * this.slide);
    // the windmill: the strumming arm a whole turn about the shoulder (down, back, over the head, down onto the strings)
    if (play.windT > 0) {
      const u = Math.min(1, play.windT / C_.wind);
      ch.rotW(B.upper_armR, _l, TAU * sm(u)); // (a whole turn: identity at both ends, so the arm leaves and comes home without a jump)
      this.reachR = 1 - Math.pow(Math.sin(Math.PI * u), 0.6);
    }
    this.slideLegs(ch);
    ch.root.updateMatrixWorld(true);
  }

  /** The tool's animate, after its own layer: the knees' bounce and the rockstar's kneel, while they stand; the knee slide, sliding. */
  pose(ch, base, dt) {
    const T = this.tool, P = T.P, w = this.r.w, Cl = ch.clips;
    this.kneeSlide(ch, base);
    const still = P.grounded ? 1 - THREE.MathUtils.smoothstep(Math.hypot(P.vel.x, P.vel.z), 0.3, 1.2) : 0;
    this.stand = THREE.MathUtils.damp(this.stand, still, 8, dt);
    const rk = this.r.play.rockT, env = rk > 0 ? sm(rk / 0.2) * (1 - sm((rk - 1.2) / 0.3)) : 0;
    this.kneel = THREE.MathUtils.damp(this.kneel, env, 14, dt);
    if (P.fp || w < 0.01 || this.stand < 0.01) return;
    const unit = 1 / (ch.bones.spine.parent?.getWorldScale(_v).y || 1); // (the pelvis's units: its parent's)
    const b = this.beats(), dip = C_.dip * pulse(b - Math.floor(b)) * this.e * w * this.stand * (1 - this.kneel);
    base.p[1] -= dip * unit;
    const kw = this.kneel * this.stand * w;
    if (kw > 0.01 && Cl.clips.kneel) {
      const kp = Cl.sample('kneel', C_.kneelAt, (this.kp ||= Cl.pose()), false); kp.p[1] -= C_.kneelSink;
      this.lower ||= Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
      Cl.blend(base, kp, kw, this.lower, 1);
      ch.st.footDown = Math.max(ch.st.footDown || 0, Math.min(1, kw));
    }
  }

  /** The knee slide: the slide's legs given the kneel's, both knees down, the shins laid back along the floor. */
  kneeSlide(ch, base) {
    const sw = this.slide || 0, Cl = ch.clips;
    if (sw < 0.01 || !Cl.clips.kneel) return;
    const kp = Cl.sample('kneel', C_.kneelAt, (this.kp2 ||= Cl.pose()), false); kp.p[1] -= C_.slide.sink;
    this.lower ||= Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
    Cl.blend(base, kp, sw, this.lower, 1);
    ch.st.footDown = Math.max(ch.st.footDown || 0, Math.min(1, sw));
  }
  /** After the clips are posed (turn): both thighs swung back so the knees lead and the shins trail (the kneel kneels on one). */
  slideLegs(ch) {
    const sw = this.slide || 0, B = ch.bones; if (sw < 0.01 || !B.thighL) return;
    for (const t of [B.thighL, B.thighR]) ch.rotW(t, _l, -C_.slide.shin * sw * 0.5);
  }
}
