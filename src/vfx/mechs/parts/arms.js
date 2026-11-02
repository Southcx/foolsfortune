// ---------------------------------------------------------------------------------------
// A MECH'S ARMS (the part library: progress/mechs/parts.js slot `arms`): a pair, each side built in three joints' frames (vfx/mechs/
// parts/kit.js): the shoulder (its gold ball, the pauldron, the upper arm with the elbow's cup at its foot), the elbow (its ball and the
// forearm, the wrist's cup at its foot), the hand (its ball, the palm, four fingers of two joints and the thumb, open, holding or
// clenched by the weapon in it). The limbs are lathed and tapered (a swell under the shoulder and at the forearm, narrowing to each
// joint), so they read round at 480 lines; the pauldron is where the stone shows.
//   clayArms    long arms whose big hands hang to the knee: a labradorite dome with two lames and two fins, a terracotta vambrace
//   strongArms  bulky: a layered pauldron of three stacked lames, gauntlets swelling to a bronze-ringed cuff, a huge fist
//   quickArms   slender and longest: a porcelain cap with one sleek swept fin of the stone, a narrow forearm, long fingers
// Prior art: Medabots' arm parts (each arm its own weapon and its own silhouette: Metabee's revolver arm, Rokusho's blade); Evangelion's
// long lean arms (Ikuto Yamashita); Giant Clank's fists; Gurren Lagann's and the Big O's gauntlets (the strong arms); the ball-jointed
// doll's hand.
//
//   ARM_LOOKS[id] = { upper, fore, palm (m), ball (the shoulder's), elbow, wrist (balls), shoulder(S, s), foreArm(S, s), hand(S, s, grip) }
//   grip: 'open' | 'hold' | 'fist'   gripAt(look) -> [x, y, z] in the hand's frame (the middle of a closed hand, where a haft sits)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell, plate, limb, seam, labTone, ball } from './kit.js';

const PI = Math.PI;
const CURL = { open: [0.3, 0.75], hold: [1.25, 1.35], fist: [1.55, 1.7] };

/** A hand, palm to +Z (the hand's joint turns it to face in): its ball, a palm, four fingers of two joints, the thumb. */
function hand(S, s, grip, { w, h, d, fl, fw, wr, c = L.bone }) {
  const { p, g } = S, curl = CURL[grip] || CURL.open;
  ball(g, wr);
  p.box(w, h, d, { at: [0, -wr * 0.6 - h / 2, 0], c }, Math.min(w, h, d) * 0.3);
  p.box(w * 1.03, 0.1, d * 1.04, { at: [0, -wr * 0.6 - h * 0.22, 0], c: L.umber }, 0.04); // (the groove round the palm's heel)
  const y0 = -wr * 0.6 - h, xs = [-0.375, -0.125, 0.125, 0.375].map((k) => k * w);
  xs.forEach((x, i) => {
    let at = new THREE.Vector3(x, y0, 0.04); ball(g, fw * 0.5, at.toArray());
    const len = [fl[0] * (i === 3 || i === 0 ? 0.9 : 1), fl[1]];
    for (let k = 0; k < 2; k++) {
      const a = curl[k] * (k ? 1 : 0.95), dir = new THREE.Vector3(0, -Math.cos(a + (k ? curl[0] : 0)), Math.sin(a + (k ? curl[0] : 0))), mid = at.clone().addScaledVector(dir, len[k] / 2 + fw * 0.3);
      p.box(fw, len[k], fw * 1.1, { at: mid.toArray(), rot: [-(a + (k ? curl[0] : 0)), 0, 0], c: k ? L.ivory : c }, fw * 0.38);
      at = at.clone().addScaledVector(dir, len[k] + fw * 0.55); if (k === 0) ball(g, fw * 0.42, at.toArray());
    }
  });
  const ta = grip === 'open' ? 0.6 : 1.1;
  ball(g, fw * 0.52, [s * w * 0.5, -wr * 0.6 - h * 0.3, d * 0.3]);
  p.box(fw * 1.1, fl[0] * 1.15, fw * 1.15, { at: [s * w * (grip === 'open' ? 0.56 : 0.3), -wr * 0.6 - h * 0.62, d * 0.62], rot: [-ta, 0, s * (grip === 'open' ? 0.25 : 0.9)], c: L.ivory }, fw * 0.4); // (the thumb)
}

export const ARM_LOOKS = {
  clayArms: {
    upper: 2.75, fore: 2.6, palm: 0.95, ball: 0.62, elbow: 0.5, wrist: 0.4,
    shoulder(S, s) {
      const { p, g, l } = S;
      ball(g, this.ball);
      l.geo(shell([[1.32, -0.15], [1.38, 0.28], [1.2, 0.76], [0.76, 1.06], [0.001, 1.16]], 32), { at: [s * 0.3, 0.12, 0], sc: [1, 0.82, 1.12], c: labTone(0.1) }); // (the dome)
      const t0 = (s > 0 ? PI / 2 : -PI / 2) - 1.6;
      for (let i = 0; i < 2; i++) l.geo(new THREE.CylinderGeometry(1.38 + i * 0.06, 1.46 + i * 0.07, 0.38, 32, 1, true, t0, 3.2), { at: [s * 0.3, -0.36 - i * 0.44, 0], sc: [1, 1, 1.1], c: labTone(0.28 + i * 0.15) }); // (the lames, a groove between)
      g.ring(1.33, 0.045, { at: [s * 0.3, -0.13, 0], sc: [1, 1, 1.12], c: L.gold }, 36, 4); // (the dome's gilt rim)
      for (const [z, hh, ph] of [[0.3, 1.35, 0.45], [-0.26, 1.0, 0.7]]) l.geo(plate([[0, 0], [0.4, 0], [0.18, hh], [0.04, hh * 0.92]], 0.1, 0.03), { at: [s * 0.85, 0.8, z], rot: [0, 0, -s * 0.4], c: labTone(ph, 0.26) });
      limb(p, [[0.42, -0.4], [0.62, -0.66], [0.68, -1.2], [0.6, -1.3], [0.6, -1.42], [0.66, -1.48], [0.6, -2.2], [0.48, -2.6]], L.bone, this.upper, this.elbow);
      p.geo(plate([[-0.34, -0.75], [0.34, -0.75], [0.28, -2.1], [-0.24, -2.2]], 0.14), { at: [s * 0.66, 0, 0], rot: [0, s * PI / 2, 0], c: L.ivory }); // (the outer plate)
    },
    foreArm(S, s) {
      ball(S.g, this.elbow);
      limb(S.p, [[0.38, -0.4], [0.52, -0.62], [0.66, -1.25], [0.7, -1.85], [0.62, -1.95], [0.62, -2.05], [0.64, -2.1], [0.46, -2.5]], L.bone, this.fore, this.wrist);
      S.p.geo(plate([[-0.42, -0.7], [0.42, -0.7], [0.5, -1.8], [0, -2.0], [-0.5, -1.8]], 0.16), { at: [s * 0.68, 0, 0], rot: [0, s * PI / 2, 0], c: L.terracotta }); // (the vambrace)
      seam(S.g, [[s * 0.77, -0.9, 0.24], [s * 0.78, -1.2, 0.04], [s * 0.79, -1.45, 0.16], [s * 0.77, -1.7, -0.08]], 0.028);
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.2, h: this.palm, d: 0.6, fl: [0.56, 0.44], fw: 0.26, wr: this.wrist }); },
  },
  strongArms: {
    upper: 2.45, fore: 2.45, palm: 1.15, ball: 0.68, elbow: 0.58, wrist: 0.5,
    shoulder(S, s) {
      const { p, g, l } = S;
      ball(g, this.ball);
      p.geo(shell([[1.25, -0.1], [1.3, 0.3], [1.1, 0.8], [0.6, 1.08], [0.001, 1.14]], 32), { at: [s * 0.3, 0.15, 0], sc: [1, 0.86, 1.1], c: L.ivory }); // (the cap)
      for (let i = 0; i < 3; i++) l.geo(new THREE.CylinderGeometry(1.3 + i * 0.1, 1.42 + i * 0.12, 0.42, 32, 1, false, 0, PI * 2), { at: [s * (0.32 + i * 0.05), -0.25 - i * 0.42, 0], sc: [1, 1, 1.08], c: labTone(0.2 + i * 0.12, 0.12) }); // (three stacked lames)
      for (let i = 0; i < 3; i++) g.ring(1.33 + i * 0.1, 0.035, { at: [s * (0.32 + i * 0.05), -0.04 - i * 0.42, 0], sc: [1, 1, 1.08], c: i === 1 ? L.gold : L.bronze }, 36, 4);
      limb(p, [[0.5, -0.4], [0.76, -0.66], [0.8, -1.2], [0.7, -1.28], [0.7, -1.4], [0.78, -1.46], [0.7, -2.05], [0.56, -2.45]], L.bone, this.upper, this.elbow);
    },
    foreArm(S, s) {
      ball(S.g, this.elbow);
      limb(S.p, [[0.46, -0.45], [0.66, -0.66], [0.9, -1.3], [1.02, -1.85], [0.98, -2.0], [0.62, -2.08], [0.55, -2.45]], L.ivory, this.fore, this.wrist);
      S.p.geo(shell([[1.0, -1.18], [1.08, -1.3], [1.08, -1.62], [1.0, -1.72]], 32), { c: L.terracotta }); // (the gauntlet's band)
      S.g.ring(1.05, 0.06, { at: [0, -1.96, 0], c: L.bronze }, 36, 5); // (the cuff)
      seam(S.g, [[s * 0.9, -1.85, 0.3], [s * 1.0, -1.55, 0.12], [s * 1.02, -1.3, 0.3]], 0.03);
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.5, h: this.palm, d: 0.78, fl: [0.6, 0.48], fw: 0.36, wr: this.wrist, c: L.ivory }); },
  },
  quickArms: {
    upper: 2.95, fore: 2.85, palm: 0.85, ball: 0.5, elbow: 0.4, wrist: 0.32,
    shoulder(S, s) {
      const { p, g, l } = S;
      ball(g, this.ball);
      p.geo(shell([[0.9, -0.2], [0.96, 0.2], [0.78, 0.6], [0.001, 0.8]], 32), { at: [s * 0.22, 0.05, 0], sc: [1, 0.8, 1.15], c: L.bone }); // (the cap)
      l.geo(plate([[0, 0], [0.5, -0.1], [1.9, 1.2], [1.6, 1.32], [0.1, 0.62]], 0.1, 0.03), { at: [s * 0.55, 0.3, 0.4], rot: [0, s * PI / 2 + s * 0.15, -s * 0.25], c: labTone(0.55, 0.2) }); // (the swept fin)
      g.ring(0.92, 0.035, { at: [s * 0.22, -0.18, 0], sc: [1, 1, 1.15], c: L.gold }, 36, 4);
      limb(p, [[0.34, -0.3], [0.48, -0.55], [0.5, -1.3], [0.44, -1.38], [0.44, -1.5], [0.48, -1.56], [0.42, -2.5], [0.36, -2.95]], L.bone, this.upper, this.elbow);
    },
    foreArm(S, s) {
      ball(S.g, this.elbow);
      limb(S.p, [[0.3, -0.32], [0.4, -0.55], [0.5, -1.3], [0.46, -2.2], [0.34, -2.85]], L.bone, this.fore, this.wrist);
      S.p.geo(plate([[-0.25, -0.6], [0.25, -0.6], [0.35, -2.1], [0, -2.4], [-0.35, -2.1]], 0.1), { at: [s * 0.48, 0, 0], rot: [0, s * PI / 2, 0], c: L.sand }); // (a narrow vane down its outside)
    },
    hand(S, s, grip) { hand(S, s, grip, { w: 1.0, h: this.palm, d: 0.48, fl: [0.72, 0.6], fw: 0.21, wr: this.wrist }); },
  },
};

/** Where a haft sits in a closed hand, in the hand's frame (palm to +Z, before its twist). */
export const gripAt = (A) => [0, -A.wrist * 0.6 - A.palm - 0.25, 0.42 + A.palm * 0.12];
