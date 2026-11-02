// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S ARMS (the part library's arms for the forms with `fem`, kit.js FORMS; asked for by arms.js `armLookOf`): the three
// arms parts built anew in each feminine form, on the same contract as the hero's (arms.js: the lengths and balls the parts body lays
// the joints out by, shoulder, foreArm, hand, and the default pauldron): sleek tapered limbs lathed in dense profiles, the balls small
// and sunk into the limbs' ends, a panel line or a band where one belongs, long slender hands (arms.js `hand`, at the form's size).
//   haydee (the `doll` form)
//     clayArms    slim, smooth, one panel line on each, a small rounded deltoid cap for the default pauldron
//     strongArms  the forearm swelling to a bell of a gauntlet's cuff, the cap fuller
//     quickArms   the slimmest and longest, a swept fin down the forearm
//   drossel
//     clayArms    a puffed sleeve at the shoulder (the default pauldron: a leg-of-mutton puff, ribbed, its band gilt), a slender upper arm,
//                 the forearm an opera glove in trim with its gold cuffs
//     strongArms  the glove flaring to a lace-cuffed gauntlet
//     quickArms   longest, a hanging sleeve's ribbon trailing off the elbow
// Prior art: Haydee (Haydee Interactive, 2016: the android's slim arms and long hands); Elemental Gearbolt (Alfa System, 1997);
// Drossel von Flügel of Fireball (Jinni's Animation Studios for Disney Japan, 2008: the duchess's slender arms); the Victorian
// gigot (leg-of-mutton) sleeve and the opera glove; the ball-jointed doll's arm; the hero arms' hands and layout (arms.js).
//
// The arms hang out over the broad hips (the pear, femlegs.js): splayed at the shoulder, the elbow barely turned back in (`bend`).
//
//   femArmLook(id, F) -> { splay (the arms' hang out from the body), bend (the elbow's turn back in), upper, fore, palm, ball, elbow, wrist, shoulder(S, s), foreArm(S, s), hand(S, s, grip), pauldron(S, s) }
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L, shell, plate, sculpt, ball, profAt } from './kit.js';
import { lathe } from './femlegs.js';
import { hand } from './arms.js';

const PI = Math.PI;
const line = (S, r, y) => S.core.ring(r, 0.02, { at: [0, y, 0], c: L.coreD }, 32, 4);
const core = (S, r, len) => S.core.lathe([[r, 0.05], [r, -len]], { c: L.core }, 18);
const sc = (prof, k) => prof.map(([r, y]) => [r * k, y]);

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
/** Drossel's puffed sleeve: a leg-of-mutton puff, ribbed, its band gilt and a small ruffle at its foot. */
const puff = (k) => (S, s) => {
  const ribs = (x, y, z) => { const a = Math.atan2(x, z), q = 1 + 0.07 * Math.cos(a * 10) * Math.sin(PI * Math.min(1, Math.max(0, (0.75 - y) / 1.5))); return [x * q, y, z * q]; };
  S.trim.geo(sculpt(shell([[0.001, 0.82], [0.62, 0.72], [0.96, 0.38], [1.04, 0.0], [0.9, -0.42], [0.58, -0.7], [0.4, -0.78]].map(([r, y]) => [r * k, y * k]), 40), ribs), { at: [s * 0.3, -0.15, 0], c: L.trimL });
  S.g.ring(0.42 * k, 0.045, { at: [s * 0.3, -0.15 - 0.76 * k, 0], c: L.gold }, 28, 4);
  S.trim.lathe([[0.4 * k, -0.8 * k], [0.56 * k, -0.95 * k], [0.46 * k, -1.02 * k]], { at: [s * 0.3, -0.15, 0], c: L.trimM }, 28);
};

export function femArmLook(id, F) {
  const A = ARMS[id] || ARMS.clayArms, D = F.fem === 'drossel', k = D ? 0.8 : 1, UP = sc(A.UP, k), FO = sc(A.FO, k);
  return {
    splay: D ? 0.46 : 0.48, bend: 0.08, upper: A.upper * (D ? 1.04 : 1), fore: A.fore * (D ? 1.04 : 1), palm: A.palm * (D ? 0.92 : 1), ball: A.ball, elbow: A.elbow, wrist: A.wrist,
    pauldron: D ? puff(id === 'strongArms' ? 1.12 : 1) : deltoid(id === 'strongArms' ? 1.18 : 1),
    shoulder(S, s) {
      ball(S.g, this.ball * F.joint); core(S, 0.2 * k, this.upper);
      lathe(S.p, UP, this.upper, L.pale);
      if (!D) line(S, profAt([...UP].reverse(), -0.55) * 1.0, -0.55 * this.upper);
    },
    foreArm(S, s) {
      ball(S.g, this.elbow * F.joint); core(S, 0.15 * k, this.fore);
      lathe(D ? S.trim : S.p, FO, this.fore, D ? L.trimM : L.pale);
      const r = (u) => profAt([...FO].reverse(), -u);
      if (D) { // (the opera glove's cuffs, and the gauntlet's lace or the hanging sleeve's ribbon)
        S.g.ring(r(0.08) + 0.02, 0.03, { at: [0, -0.08 * this.fore, 0], c: L.gold }, 28, 4);
        S.g.ring(r(0.92) + 0.015, 0.025, { at: [0, -0.92 * this.fore, 0], c: L.gold }, 28, 4);
        if (id === 'strongArms') S.trim.lathe([[r(0.8) + 0.02, -0.74 * this.fore], [r(0.8) + 0.16, -0.86 * this.fore], [r(0.88) + 0.04, -0.9 * this.fore]], { c: L.trimL }, 32);
        if (id === 'quickArms') S.trim.geo(plate([[0, 0], [0.3, 0], [0.18, -1.9], [0.0, -2.2], [-0.08, -1.7]], 0.05, 0.02), { at: [s * 0.18, 0.05, -0.2], rot: [0.12, s * PI / 2, 0], c: L.trimL });
      } else {
        line(S, r(0.45), -0.45 * this.fore);
        if (id === 'quickArms') S.trim.geo(plate([[0, 0], [0.16, 0], [0.04, -1.8], [-0.02, -1.82]], 0.06, 0.02), { at: [s * (r(0.2) - 0.02), -0.25, 0], rot: [0, s * PI / 2, -s * 0.06], c: L.trimM });
        if (id === 'strongArms') S.trim.lathe([[r(0.8) + 0.01, -0.7 * this.fore], [r(0.8) + 0.04, -0.8 * this.fore], [r(0.88) + 0.01, -0.86 * this.fore]], { c: L.trimM }, 32);
      }
    },
    hand(S, s, grip) { const H = A.hand; hand(S, s, grip, { w: H.w * (D ? 0.9 : 1), h: this.palm, d: H.d * (D ? 0.9 : 1), fl: H.fl, fw: H.fw * (D ? 0.88 : 1), wr: this.wrist }); },
  };
}
