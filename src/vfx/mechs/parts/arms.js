// ---------------------------------------------------------------------------------------
// A MECH'S ARMS (the part library: progress/mechs/parts.js slot `arms`): a pair, each side built in three joints' frames (vfx/mechs/
// parts/kit.js): the shoulder (its gold ball, the upper arm with the elbow's cup at its foot), the elbow (its ball and the forearm, the
// wrist's cup at its foot), the hand (its ball, the palm, four long fingers of two joints and the thumb, open, holding or clenched by
// the weapon in it; clenched, a knuckle guard of trim over the fingers' backs with a gold stud a knuckle). The limbs are lathed and
// tapered (a swell under the shoulder and at the forearm, narrowing to each joint) over the interstitial's column, their outer plates
// curved round them, so they read round at 480 lines. Each arms part also has its own pauldron (`pauldron`), worn when the frame's
// pauldron is `default` (vfx/mechs/parts/pauldrons.js, the body's setPauldron): in trim, the colour the Courier's trim glaze.
//   clayArms    long arms whose big hands hang to the knee: a dome with two lames and two fins, a trim vambrace
//   strongArms  bulky: a layered pauldron of three stacked lames, gauntlets swelling to a bronze-ringed cuff, a huge fist
//   quickArms   slender and longest: a cap with one sleek swept fin, a narrow forearm, long fingers
// In the doll form the same arms slender (kit.js FORMS: the limbs' radii, the hands smaller, the joints finer), a doll's small
// rounded cap for the default pauldron.
// Prior art: Medabots' arm parts (each arm its own weapon and its own silhouette); Evangelion's long lean arms (Ikuto Yamashita);
// Giant Clank's fists; Gurren Lagann's and the Big O's gauntlets (the strong arms); the ball-jointed doll's hand; the gauntlet's
// knuckle plate (a Gothic gauntlet's gadlings, here gold studs); Elemental Gearbolt's and Haydee's slender arms.
//
//   ARM_LOOKS[id] = { upper, fore, palm (m), ball (the shoulder's), elbow, wrist (balls), shoulder(S, s), foreArm(S, s), hand(S, s, grip), pauldron(S, s) }
//   grip: 'open' | 'hold' | 'fist'   gripAt(look) -> [x, y, z] in the hand's frame (the middle of a closed hand, where a haft sits)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, plate, limb, seam, ball, band, curved } from './kit.js';

const PI = Math.PI;
const CURL = { open: [0.3, 0.75], hold: [1.25, 1.35], fist: [1.55, 1.7] };
const up = (prof) => [...prof].reverse(); // (a limb's profile runs down -Y: band() wants it up)
/** A plate curved round a limb on its outer side (phi s*PI/2), between heights y0 and y1, k out from the limb's own profile. */
const armPlate = (P, prof, y0, y1, half, s, c, F, k = 1.1, th = 0.09) => P.geo(curved(band(up(prof), y0, y1, k, 6), th, s * PI / 2 - half, s * PI / 2 + half, 12), { sc: [F.limb, 1, F.limb], c });

/** A hand, palm to +Z (the hand's joint turns it to face in): its ball, a palm, four fingers of two joints, the thumb; a fist's
 *  knuckle guard. */
function hand(S, s, grip, { w, h, d, fl, fw, wr, c = L.pale }) {
  const { p, g } = S, F = S.F, curl = CURL[grip] || CURL.open, k = F.hand;
  w *= k; d *= k; fw *= k; fl = fl.map((x) => x * k); wr *= F.joint;
  ball(g, wr);
  p.box(w, h, d, { at: [0, -wr * 0.6 - h / 2, 0], c }, Math.min(w, h, d) * 0.3);
  S.core.box(w * 0.9, 0.12, d * 0.9, { at: [0, -wr * 0.6 - h * 0.22, 0], c: L.core }, 0.04); // (the palm's heel, in its groove)
  p.box(w * 1.03, h * 0.18, d * 1.04, { at: [0, -wr * 0.6 - h * 0.1, 0], c: L.mid }, 0.05); // (the cuff of the palm)
  const y0 = -wr * 0.6 - h, xs = [-0.375, -0.125, 0.125, 0.375].map((q) => q * w);
  xs.forEach((x, i) => {
    let at = new THREE.Vector3(x, y0, 0.04); ball(g, fw * 0.5, at.toArray());
    const len = [fl[0] * (i === 3 || i === 0 ? 0.88 : 1), fl[1] * (i === 3 ? 0.85 : 1)];
    for (let n = 0; n < 2; n++) {
      const a = curl[n] * (n ? 1 : 0.95) + (n ? curl[0] : 0), dir = new THREE.Vector3(0, -Math.cos(a), Math.sin(a)), mid = at.clone().addScaledVector(dir, len[n] / 2 + fw * 0.3);
      p.box(fw, len[n], fw * 1.1, { at: mid.toArray(), rot: [-a, 0, 0], c: n ? L.mid : c }, fw * 0.4);
      at = at.clone().addScaledVector(dir, len[n] + fw * 0.55); if (n === 0) ball(g, fw * 0.42, at.toArray());
    }
  });
  const ta = grip === 'open' ? 0.6 : 1.1;
  ball(g, fw * 0.52, [s * w * 0.5, -wr * 0.6 - h * 0.3, d * 0.3]);
  p.box(fw * 1.1, fl[0] * 1.15, fw * 1.15, { at: [s * w * (grip === 'open' ? 0.56 : 0.3), -wr * 0.6 - h * 0.62, d * 0.62], rot: [-ta, 0, s * (grip === 'open' ? 0.25 : 0.9)], c: L.mid }, fw * 0.4); // (the thumb)
  if (grip === 'fist') { // (the knuckle guard over the proximal phalanges' backs, a gold stud a knuckle)
    const R = w * 0.75, th = fw * 0.34, ay = y0 - fw * 0.6 + R - th, z1 = fl[0] + fw * 0.5, half = Math.asin(Math.min(0.95, (w * 0.56) / R));
    S.trim.geo(curved([[R, -0.12], [R + fw * 0.12, z1 * 0.5], [R, z1]], th, -half, half, 10).rotateX(PI / 2), { at: [0, ay, 0.04], c: L.trimM });
    for (const x of xs) g.ball(fw * 0.24, { at: [x, ay - R - fw * 0.1, 0.04 + z1 * 0.55], c: L.gold }, 10, 8);
  }
}

export const ARM_LOOKS = {
  clayArms: {
    upper: 2.75, fore: 2.6, palm: 0.95, ball: 0.62, elbow: 0.5, wrist: 0.4,
    UP: [[0.42, -0.4], [0.62, -0.66], [0.68, -1.2], [0.6, -1.3], [0.6, -1.42], [0.66, -1.48], [0.6, -2.2], [0.48, -2.6]],
    FO: [[0.38, -0.4], [0.52, -0.62], [0.66, -1.25], [0.7, -1.85], [0.62, -1.95], [0.62, -2.05], [0.64, -2.1], [0.46, -2.5]],
    pauldron(S, s) {
      const { g, trim } = S;
      trim.geo(shell([[1.32, -0.15], [1.38, 0.28], [1.2, 0.76], [0.76, 1.06], [0.001, 1.16]], 32), { at: [s * 0.3, 0.12, 0], sc: [1, 0.82, 1.12], c: L.trimL }); // (the dome)
      const t0 = (s > 0 ? PI / 2 : -PI / 2) - 1.6;
      for (let i = 0; i < 2; i++) trim.geo(curved([[1.38 + i * 0.06, -0.19], [1.46 + i * 0.07, 0.19]], 0.08, t0, t0 + 3.2, 10), { at: [s * 0.3, -0.36 - i * 0.44, 0], sc: [1, 1, 1.1], c: i ? L.trimD : L.trimM }); // (the lames)
      g.ring(1.33, 0.045, { at: [s * 0.3, -0.13, 0], sc: [1, 1, 1.12], c: L.gold }, 36, 4); // (the dome's gilt rim)
      for (const [z, hh] of [[0.3, 1.35], [-0.26, 1.0]]) trim.geo(plate([[0, 0], [0.4, 0], [0.18, hh], [0.04, hh * 0.92]], 0.1, 0.03), { at: [s * 0.85, 0.8, z], rot: [0, 0, -s * 0.4], c: L.trimM });
    },
    shoulder(S, s) {
      const { p, g } = S, F = S.F;
      ball(g, this.ball * F.joint);
      limb(p, this.UP, L.pale, this.upper, this.elbow * F.joint, [F.limb, 1, F.limb], S.core);
      if (F.grooves) armPlate(p, this.UP, -2.15, -0.75, 0.75, s, L.mid, F);
    },
    foreArm(S, s) {
      const F = S.F;
      ball(S.g, this.elbow * F.joint);
      limb(S.p, this.FO, L.pale, this.fore, this.wrist * F.joint, [F.limb, 1, F.limb], S.core);
      armPlate(S.trim, this.FO, -1.85, -0.7, F.grooves ? 0.9 : 0.6, s, L.trimM, F, 1.08); // (the vambrace)
      if (F.grooves) seam(S.g, [[s * 0.77, -0.9, 0.24], [s * 0.78, -1.2, 0.04], [s * 0.79, -1.45, 0.16], [s * 0.77, -1.7, -0.08]], 0.028);
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.35, h: this.palm, d: 0.64, fl: [0.8, 0.62], fw: 0.3, wr: this.wrist }); },
  },
  strongArms: {
    upper: 2.45, fore: 2.45, palm: 1.15, ball: 0.68, elbow: 0.58, wrist: 0.5,
    UP: [[0.5, -0.4], [0.76, -0.66], [0.8, -1.2], [0.7, -1.28], [0.7, -1.4], [0.78, -1.46], [0.7, -2.05], [0.56, -2.45]],
    FO: [[0.46, -0.45], [0.66, -0.66], [0.9, -1.3], [1.02, -1.85], [0.98, -2.0], [0.62, -2.08], [0.55, -2.45]],
    pauldron(S, s) {
      const { g, trim } = S;
      trim.geo(shell([[1.25, -0.1], [1.3, 0.3], [1.1, 0.8], [0.6, 1.08], [0.001, 1.14]], 32), { at: [s * 0.3, 0.15, 0], sc: [1, 0.86, 1.1], c: L.trimL }); // (the cap)
      for (let i = 0; i < 3; i++) trim.geo(curved([[1.3 + i * 0.1, -0.21], [1.42 + i * 0.12, 0.21]], 0.09, 0, PI * 2, 6), { at: [s * (0.32 + i * 0.05), -0.25 - i * 0.42, 0], sc: [1, 1, 1.08], c: [L.trimM, L.trimD, L.trimM][i] }); // (three stacked lames)
      for (let i = 0; i < 3; i++) g.ring(1.33 + i * 0.1, 0.035, { at: [s * (0.32 + i * 0.05), -0.04 - i * 0.42, 0], sc: [1, 1, 1.08], c: i === 1 ? L.gold : L.bronze }, 36, 4);
    },
    shoulder(S, s) {
      const { p, g } = S, F = S.F;
      ball(g, this.ball * F.joint);
      limb(p, this.UP, L.pale, this.upper, this.elbow * F.joint, [F.limb, 1, F.limb], S.core);
      if (F.grooves) armPlate(p, this.UP, -1.95, -0.7, 0.85, s, L.mid, F);
    },
    foreArm(S, s) {
      const F = S.F;
      ball(S.g, this.elbow * F.joint);
      limb(S.p, this.FO, L.mid, this.fore, this.wrist * F.joint, [F.limb, 1, F.limb], S.core);
      S.trim.geo(curved([[1.04, -1.72], [1.1, -1.5], [1.04, -1.18]], 0.1, 0, PI * 2, 6), { sc: [F.limb, 1, F.limb], c: L.trimM }); // (the gauntlet's band)
      S.g.ring(1.05, 0.06, { at: [0, -1.96, 0], sc: [F.limb, 1, F.limb], c: L.bronze }, 36, 5); // (the cuff)
      if (F.grooves) seam(S.g, [[s * 0.9, -1.85, 0.3], [s * 1.0, -1.55, 0.12], [s * 1.02, -1.3, 0.3]], 0.03);
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.65, h: this.palm, d: 0.82, fl: [0.82, 0.64], fw: 0.4, wr: this.wrist, c: L.mid }); },
  },
  quickArms: {
    upper: 2.95, fore: 2.85, palm: 0.85, ball: 0.5, elbow: 0.4, wrist: 0.32,
    UP: [[0.34, -0.3], [0.48, -0.55], [0.5, -1.3], [0.44, -1.38], [0.44, -1.5], [0.48, -1.56], [0.42, -2.5], [0.36, -2.95]],
    FO: [[0.3, -0.32], [0.4, -0.55], [0.5, -1.3], [0.46, -2.2], [0.34, -2.85]],
    pauldron(S, s) {
      const { g, trim } = S;
      trim.geo(shell([[0.9, -0.2], [0.96, 0.2], [0.78, 0.6], [0.001, 0.8]], 32), { at: [s * 0.22, 0.05, 0], sc: [1, 0.8, 1.15], c: L.trimL }); // (the cap)
      trim.geo(plate([[0, 0], [0.5, -0.1], [1.9, 1.2], [1.6, 1.32], [0.1, 0.62]], 0.1, 0.03), { at: [s * 0.55, 0.3, 0.4], rot: [0, s * PI / 2 + s * 0.15, -s * 0.25], c: L.trimM }); // (the swept fin)
      g.ring(0.92, 0.035, { at: [s * 0.22, -0.18, 0], sc: [1, 1, 1.15], c: L.gold }, 36, 4);
    },
    shoulder(S, s) {
      const { p, g } = S, F = S.F;
      ball(g, this.ball * F.joint);
      limb(p, this.UP, L.pale, this.upper, this.elbow * F.joint, [F.limb, 1, F.limb], S.core);
    },
    foreArm(S, s) {
      const F = S.F;
      ball(S.g, this.elbow * F.joint);
      limb(S.p, this.FO, L.pale, this.fore, this.wrist * F.joint, [F.limb, 1, F.limb], S.core);
      armPlate(S.trim, this.FO, -2.3, -0.6, 0.35, s, L.trimM, F, 1.1, 0.07); // (a narrow vane down its outside)
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.1, h: this.palm, d: 0.5, fl: [0.9, 0.74], fw: 0.24, wr: this.wrist }); },
  },
};

/** Where a haft sits in a closed hand, in the hand's frame (palm to +Z, before its twist). */
export const gripAt = (A) => [0, -A.wrist * 0.6 - A.palm - 0.25, 0.42 + A.palm * 0.12];
