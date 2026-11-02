// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S ARMS (the part library's arms for the forms with `fem`, kit.js FORMS; asked for by arms.js `armLookOf`): the three
// arms parts built anew for the doll, on the same contract as the hero's (arms.js: the lengths and balls the parts body lays
// the joints out by, shoulder, foreArm, hand, and the default pauldron): sleek tapered limbs lathed in dense profiles, the balls small
// and sunk into the limbs' ends, a panel line or a band where one belongs, long slender hands (arms.js `hand`, at the form's size).
//   haydee (the `doll` form)
//     clayArms    slim, smooth, one panel line on each, a small rounded deltoid cap for the default pauldron
//     strongArms  the forearm swelling to a bell of a gauntlet's cuff, the cap fuller
//     quickArms   the slimmest and longest, a swept fin down the forearm
// (Drossel's puffed sleeve is a pauldron now, parts/pauldrons.js `puff`.) Every ball is the form's (kit.js `jointBall`: the skin).
// Prior art: Haydee (Haydee Interactive, 2016: the android's slim arms and long hands); Elemental Gearbolt (Alfa System, 1997); the
// ball-jointed doll's arm; the hero arms' hands and layout (arms.js).
//
// The arms hang out over the broad hips (the pear, femlegs.js): splayed at the shoulder, the elbow barely turned back in (`bend`).
// Haydee's (South, 2026-11-02): an exposed ball and socket at each elbow (the ball in the skin, the upper arm's ivory cup over it, the
// forearm's lip under it, `elbow` its size), and the caps tilted down off a falling shoulder line (`slope`, rad).
//
//   femArmLook(id, F) -> { splay (the arms' hang out from the body), slope (the cap's tilt down), bend (the elbow's turn back in), upper, fore, palm, ball, elbow, wrist, shoulder(S, s), foreArm(S, s), hand(S, s, grip), pauldron(S, s) }
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, shell, plate, jointBall, profAt, cup } from './kit.js';
import { lathe } from './femlegs.js';
import { hand } from './arms.js';

const PI = Math.PI;
const line = (S, r, y) => S.core.ring(r, 0.02, { at: [0, y, 0], c: L.coreD }, 32, 4);
const core = (S, r, len) => S.core.lathe([[r, 0.05], [r, -len]], { c: L.core }, 18);

/** The arms: lengths (m), balls, and the profiles (r m, y in lengths). */
const ARMS = {
  clayArms: { upper: 2.45, fore: 2.35, palm: 0.85, ball: 0.55, elbow: 0.42, wrist: 0.36,
    UP: [[0.36, 0.1], [0.46, -0.05], [0.47, -0.3], [0.42, -0.62], [0.33, -0.92], [0.3, -1.03]],
    FO: [[0.28, 0.06], [0.34, -0.06], [0.37, -0.25], [0.3, -0.65], [0.22, -0.95], [0.2, -1.03]],
    hand: { w: 1.02, h: 0.82, d: 0.46, fl: [0.86, 0.7], fw: 0.22 } },
  strongArms: { upper: 2.35, fore: 2.3, palm: 0.98, ball: 0.62, elbow: 0.5, wrist: 0.44,
    UP: [[0.4, 0.1], [0.52, -0.05], [0.53, -0.3], [0.46, -0.65], [0.36, -0.92], [0.33, -1.03]],
    FO: [[0.3, 0.06], [0.36, -0.06], [0.42, -0.3], [0.55, -0.64], [0.6, -0.8], [0.44, -0.88], [0.26, -0.96], [0.24, -1.03]],
    hand: { w: 1.15, h: 0.95, d: 0.52, fl: [0.86, 0.68], fw: 0.26 } },
  quickArms: { upper: 2.7, fore: 2.55, palm: 0.8, ball: 0.5, elbow: 0.38, wrist: 0.32,
    UP: [[0.32, 0.1], [0.4, -0.05], [0.41, -0.3], [0.36, -0.65], [0.28, -0.92], [0.26, -1.03]],
    FO: [[0.24, 0.06], [0.3, -0.06], [0.32, -0.25], [0.26, -0.65], [0.19, -0.95], [0.17, -1.03]],
    hand: { w: 0.92, h: 0.76, d: 0.42, fl: [0.94, 0.78], fw: 0.19 } },
};

/** Haydee's deltoid cap (the default pauldron), fuller on the strong arms. */
const deltoid = (k) => (S, s) => {
  S.trim.geo(shell([[0.64 * k, -0.28], [0.68 * k, 0.08], [0.58 * k, 0.44], [0.32 * k, 0.66], [0.001, 0.7]], 36), { at: [s * 0.2, 0.05, 0], sc: [1, 0.9, 1.06], c: L.trimL });
  S.g.ring(0.64 * k, 0.03, { at: [s * 0.2, 0.05 - 0.25 * 0.9, 0], sc: [1, 1, 1.06], c: L.gold }, 36, 4);
};
/** A forearm's profile begun under its elbow's ball (radius rb): its top a rim that holds the ball from below, the rest the profile. */
function socketTop(FO, rb, len) {
  const yr = (-rb * 0.72) / len, rim = rb * 0.72, below = FO.filter(([, y]) => y < yr - 0.08);
  return [[rim, yr], [Math.max(rim + 0.06, profAt([...FO].reverse(), yr - 0.06)), yr - 0.06], ...below];
}

export function femArmLook(id, F) {
  const A = ARMS[id] || ARMS.clayArms, UP = A.UP, FO = A.FO;
  return {
    splay: 0.48, bend: 0.08, slope: 0.22, upper: A.upper, fore: A.fore, palm: A.palm, ball: A.ball, elbow: A.elbow * 1.4, wrist: A.wrist,
    pauldron: deltoid(id === 'strongArms' ? 1.18 : 1),
    shoulder(S, s) {
      jointBall(S, this.ball * F.joint); core(S, 0.2, this.upper);
      // (the upper arm stops short of the elbow's ball and closes over it in an ivory socket)
      const rb = this.elbow * F.joint, len = (this.upper - rb * 0.95) / 1.03;
      lathe(S.p, UP, len, L.pale); S.p.geo(cup(rb), { at: [0, -this.upper, 0], c: L.ivory });
      line(S, profAt([...UP].reverse(), -0.55) * 1.0, -0.55 * this.upper);
    },
    foreArm(S, s) {
      const rb = this.elbow * F.joint;
      jointBall(S, rb); core(S, 0.15, this.fore);
      lathe(S.p, socketTop(FO, rb, this.fore), this.fore, L.pale);
      S.p.lathe([[rb * 0.72, -rb * 0.66], [rb * 0.86, -rb * 0.76], [rb * 0.8, -rb * 0.9]], { c: L.ivory }, 28); // (its lip under the ball)
      const r = (u) => profAt([...FO].reverse(), -u);
      line(S, r(0.45), -0.45 * this.fore);
      if (id === 'quickArms') S.trim.geo(plate([[0, 0], [0.16, 0], [0.04, -1.8], [-0.02, -1.82]], 0.06, 0.02), { at: [s * (r(0.2) - 0.02), -0.25, 0], rot: [0, s * PI / 2, -s * 0.06], c: L.trimM });
      if (id === 'strongArms') S.trim.lathe([[r(0.8) + 0.01, -0.7 * this.fore], [r(0.8) + 0.04, -0.8 * this.fore], [r(0.88) + 0.01, -0.86 * this.fore]], { c: L.trimM }, 32);
    },
    hand(S, s, grip) { const H = A.hand; hand(S, s, grip, { w: H.w, h: this.palm, d: H.d, fl: H.fl, fw: H.fw, wr: this.wrist }); },
  };
}
