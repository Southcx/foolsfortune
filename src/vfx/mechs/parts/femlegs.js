// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S LEGS (the part library's legs for the forms with `fem`, kit.js FORMS; the parts body asks here in place of legs.js
// LEG_LOOKS): every leg type built anew in each feminine form, on the same joints as the hero's (hipL/R, kneeL/R, ankleL/R, toeL/R,
// the tetrapod's legs and the tank's pods) and the same rule: the hip at the part's own height, the feet on the ground, so the seat
// stands 3 m over the hip. The balls small and sunk into the limbs' ends (the joint shows as the interstitial in the gap), the limbs
// lathed in dense smooth profiles, sculpted (a calf's swell behind, a knee's cap), a panel line where Haydee has one.
// THE WEIGHT LOW (South, 2026-11-02: "accentuate the proportions by approximately 40%, we're looking to capture almost fertility idol
// vibes, which is all in the hips and thighs. pear shape over hourglass. It needs to read like the complement to the male mecha"):
// the pelvis about 40% broader than the first pass and widest low, at the thighs' roots; the thighs thick and tapering to the knee,
// the calves strong; the tetrapod's pelvis and the tank's hulls and gown broad and low. Mass and silhouette, stylised, never detail.
// Haydee's thighs set closer (South, 2026-11-02: "reduce the thigh gap on the haydee chassis by about 12%": hipX 1.5 to 1.44, the
// pelvis as broad), and her pelvis seats the waist column's lower ball in an ivory socket (femcores.js `spine`).
//   haydee (the `doll` form)
//     clayLegs    a sculpted pelvis (broad rounded hips, a leotard's panel line, the seat's two swells), thick thighs tapering to the knee, a strong calf's
//                 swell, armoured high-heeled feet: the arch, the foot on its toe, a real heel under the ankle; knees drawn together
//     springLegs  the reverse joint as a high heel made whole: a thick thigh, a strong calf, the metatarsal a heel's pylon, a pointed shoe
//     crabLegs    four long dancer's legs off a broad, low pelvis, each tapering to a stiletto point with its spur
//     treadLegs   two pods under smooth rounded hulls, a panel band round each, the broad pelvis on its wide turret ring
//   drossel
//     clayLegs    a crinoline of plates as wide as the hips (a bell of twelve open at the front, ruffled in trim, its hem gilt, a bustle behind), long
//                 legs thick in the thigh, a garter, a brooch at each knee, buttoned boots in trim on stiletto heels
//     springLegs  the same gown on reverse joints, the boots long, the toes en pointe
//     crabLegs    a gown with spider's legs: a wide bell, four long booted legs reaching out from under its hem, en pointe
//     treadLegs   a full ball gown down to the ground, three tiers of ruffles, the treads peeping out under its hem
// Prior art: the Venus of Willendorf (c. 25,000 BC) and of Hohle Fels (c. 38,000 BC), the Cucuteni-Trypillia goddess figurines and the
// Jomon dogu (the weight read as mass in the hips and thighs, the top narrow); Haydee (Haydee Interactive, 2016: the white android's
// high-heeled armoured feet and sparse panel lines);
// Elemental Gearbolt's mechanical girls (Alfa System, 1997); Drossel von Flügel of Fireball (Jinni's Animation Studios for Disney
// Japan, 2008: the bell of a skirt-like hip armour and the long stiletto legs); the Victorian crinoline, bustle and button boot; the
// ballet's pointe shoe; the Spider Tank and the Tachikoma (the tetrapod's reach); the Dalek and the Victorian automaton dolls on wheels
// (the gown over the treads); the hero legs' rig and walks (legs.js).
//
//   FEM_LEGS[id](ctx) -> { pose({ gait, walk, kneel, travel }), drop(kneel) }   (ctx as legs.js's)
//   lathe(P, prof, len, c, fn?, seg?) (a limb lathed down -Y from [[r m, y in lengths]], sculpted by fn(x, y, z, u))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { MECH_LOOK as L, sidePlate, shell, cup, ball, band, profAt, curved, panel, sculpt, aimOf, labTone, tube } from './kit.js';

const PI = Math.PI, SIDES = [[1, 'L'], [-1, 'R']];
const bump = (y, a, b) => (y <= a || y >= b ? 0 : Math.sin((PI * (y - a)) / (b - a)));
const clamp = (x) => Math.max(0, Math.min(1, x));
/** A limb lathed down -Y: profile [[r m, y in lengths]] at `len`, dense, sculpted by fn(x, y, z, u) (u 0 at the top, 1 at the foot). */
export function lathe(P, prof, len, c, fn = null, seg = 36) {
  const pts = band(prof.map(([r, y]) => [r, y * len]).reverse(), prof[prof.length - 1][1] * len, prof[0][1] * len, 1, 28);
  let g = shell(pts, seg); if (fn) g = sculpt(g, (x, y, z) => fn(x, y, z, -y / len));
  P.geo(g, { c });
}
/** A panel line round a limb (a ring of the interstitial sunk in its shell) at height y, radius r. */
const line = (S, r, y) => S.core.ring(r, 0.022, { at: [0, y, 0], c: L.coreD }, 36, 4);
const coreOf = (S, r, len) => S.core.lathe([[r, 0.05], [r, -len]], { c: L.core }, 20);

// ------------------------------------------------------------------ the pelvises
/** Haydee's pelvis: broad rounded hips pressed in at the crotch, the seat's two swells behind, cut as a leotard (a front panel, the
 *  hips, the seat), its waist ring in trim; the panel lines are real grooves over the core. */
function haydeePelvis(S, sx = 1.72) {
  const prof = band([[0.001, -0.92], [0.5, -0.9], [1.05, -0.72], [1.38, -0.44], [1.46, -0.14], [1.3, 0.2], [0.95, 0.42], [0.6, 0.58], [0.44, 0.76], [0.001, 0.8]], -0.92, 0.8, 1, 36);
  const fn = (x, y, z) => {
    const r = Math.hypot(x, z) || 1, f = Math.max(0, -z / r), ax = Math.abs(x) * sx;
    const nip = 1 - 0.42 * clamp((-y - 0.25) / 0.55) * Math.max(0, z / r + 0.2); // (the crotch drawn in at the front)
    let zz = z * (z > 0 ? 0.8 : 0.86) - f * 0.3 * bump(y, -0.9, 0.2) * Math.exp(-((ax - 0.8) ** 2) / 0.3); // (the seat)
    return [x * sx * nip, y, zz];
  };
  const G = 0.03, cut = (a0, a1, c = L.pale) => S.p.geo(sculpt(panel(prof, a0, a1, 24), fn), { c });
  S.core.geo(sculpt(shell(prof.map(([r, y]) => [r * 0.95, y]), 40), fn), { c: L.core });
  cut(-0.78, 0.78); for (const s of [1, -1]) { const [a, b] = s > 0 ? [0.78 + 2 * G, 2.25] : [-2.25, -0.78 - 2 * G]; cut(a, b); }
  cut(2.25 + 2 * G, PI - G); cut(-PI + G, -2.25 - 2 * G);
  S.trim.lathe([[0.42, 0.66], [0.48, 0.7], [0.42, 0.74]], { sc: [sx, 1, 0.8], c: L.trimL }, 32);
  S.p.lathe([[0.34, 0.68], [0.44, 0.72], [0.47, 0.8], [0.42, 0.86], [0.34, 0.88]], { c: L.ivory }, 32); // (the socket the waist column's ball sits in)
}
const BELL = { short: [[1.0, 0.5], [1.38, 0.22], [1.98, -0.3], [2.62, -0.9], [3.05, -1.5], [3.25, -1.95]],
  wide: [[1.0, 0.5], [1.38, 0.22], [2.0, -0.3], [2.7, -0.95], [3.2, -1.55], [3.4, -1.95]],
  gown: [[1.0, 0.55], [1.4, 0.28], [2.05, -0.15], [2.75, -0.65], [3.25, -1.3], [3.5, -2.0], [3.6, -2.42]] };
/** Drossel's hips and her crinoline: a small rounded hip shell, then a bell of plates (open at the front unless `closed`), each plate
 *  ruffled in trim at its tiers and gilt at its hem, a petticoat of the interstitial inside, the waistband and its brooch, a bustle. */
function drosselPelvis(S, bell = BELL.short, { closed = false, n = 12, tiers = 2 } = {}) {
  const { p, g } = S;
  p.lathe([[0.001, -0.7], [0.77, -0.64], [1.2, -0.34], [1.26, 0.02], [0.98, 0.38], [0.56, 0.55], [0.001, 0.56]], { sc: [1.05, 1, 0.86], c: L.pale }, 32);
  p.geo(cup(0.34), { at: [0, 0.45, 0], c: L.ivory });
  const open = closed ? 0 : 0.62, gap = 0.035, asc = [...bell].reverse(), prof = band(asc, bell[bell.length - 1][1], bell[0][1], 1, 18), last = bell[bell.length - 1];
  const yT = (t) => bell[0][1] + (last[1] - bell[0][1]) * t;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * PI * 2 + gap - PI, a1 = ((i + 1) / n) * PI * 2 - gap - PI, mid = (a0 + a1) / 2;
    if (Math.abs(Math.atan2(Math.sin(mid), Math.cos(mid))) < open) continue;
    p.geo(curved(prof, 0.07, a0, a1, 12), { sc: [1, 1, 0.92], c: i % 2 ? L.pale : L.mid });
    S.core.geo(curved(prof.map(([r, y]) => [r * 0.93, y]), 0.04, a0 - gap, a1 + gap, 12), { sc: [1, 1, 0.92], c: L.coreD }); // (the petticoat)
    for (let k = 1; k <= tiers; k++) { const y = yT(k / (tiers + 1)), r = profAt(asc, y); S.trim.geo(curved([[r + 0.02, y - 0.09], [r + 0.11, y], [r + 0.03, y + 0.08]], 0.06, a0, a1, 12), { sc: [1, 1, 0.92], c: L.trimM }); }
    S.trim.geo(curved([[last[0] + 0.0, last[1] - 0.02], [last[0] + 0.12, last[1] + 0.06], [last[0] + 0.02, last[1] + 0.16]], 0.07, a0, a1, 12), { sc: [1, 1, 0.92], c: L.trimL }); // (the hem's ruffle)
    g.geo(curved([[last[0] + 0.01, last[1] - 0.05], [last[0] + 0.04, last[1] + 0.0]], 0.04, a0, a1, 12), { sc: [1, 1, 0.92], c: L.gold });
  }
  S.trim.lathe([[0.94, 0.32], [1.02, 0.4], [0.98, 0.56], [0.88, 0.62]], { sc: [1, 1, 0.92], c: L.trimL }, 36); // (the waistband)
  g.ring(1.0, 0.03, { at: [0, 0.32, 0], sc: [1, 1, 0.92], c: L.gold }, 40, 4);
  g.ring(0.16, 0.035, { at: [0, 0.46, 0.96], rot: [PI / 2, 0, 0], c: L.gold }, 20, 4); S.l.ball(0.12, { at: [0, 0.46, 1.0], sc: [1, 1, 0.5], c: labTone(0.6, 0.2) }, 16, 10);
  S.trim.ball(0.72, { at: [0, 0.05, -1.3], sc: [1.4, 0.7, 0.75], c: L.trimL }, 28, 16); // (the bustle)
  for (const s of [-1, 1]) S.trim.ball(0.34, { at: [s * 0.42, 0.42, -1.48], sc: [1.3, 0.7, 0.5], rot: [0, 0, s * 0.35], c: L.trimM }, 20, 12); // (its bow)
  g.ball(0.12, { at: [0, 0.42, -1.55], c: L.gold }, 12, 8);
}

// ------------------------------------------------------------------ the feet
/** Haydee's armoured high-heeled foot: the instep's arch falling to the toe on the ground, a real heel under the ankle, the cuff. */
function haydeeFoot(S, fh) {
  const narrow = (x, y, z) => [x * (1 - 0.42 * clamp(z / 1.7)), y, z];
  S.p.geo(sculpt(sidePlate([[-0.3, 0.12], [0.24, 0.14], [0.46, -0.3], [0.8, -0.86], [1.1, -fh + 0.28], [1.52, -fh + 0.12], [1.66, -fh], [0.96, -fh], [0.66, -fh + 0.38], [0.18, -0.74], [-0.24, -0.44]], 0.4, 0.1), narrow), { c: L.pale });
  S.p.geo(sculpt(sidePlate([[-0.3, -0.36], [0.06, -0.5], [-0.1, -fh + 0.06], [-0.26, -fh + 0.06]], 0.26, 0.05), narrow), { c: L.mid }); // (the heel)
  S.trim.geo(sidePlate([[-0.11, -fh + 0.08], [-0.25, -fh + 0.08], [-0.24, -fh], [-0.1, -fh]], 0.2, 0.02), { c: L.trimD }); // (its tip)
  for (const x of [1, -1]) tube(S.core, [[x * 0.29, -0.05, 0.3], [x * 0.27, -0.6, 0.62], [x * 0.22, -fh + 0.3, 1.15]], 0.022, L.coreD, 12); // (a panel line down each side of the arch)
  S.p.lathe([[0.3, 0.16], [0.34, 0.0], [0.3, -0.16]], { c: L.pale }, 28); // (the ankle's cuff)
}
/** Drossel's buttoned boot: a slender pointed toe, the arch, a stiletto heel in gold, all in trim. */
function drosselFoot(S, fh) {
  const narrow = (x, y, z) => [x * (1 - 0.6 * clamp(z / 1.8)), y, z];
  S.trim.geo(sculpt(sidePlate([[-0.24, 0.12], [0.2, 0.14], [0.36, -0.36], [0.76, -0.96], [1.12, -fh + 0.24], [1.62, -fh + 0.08], [1.78, -fh], [0.98, -fh], [0.62, -fh + 0.4], [0.12, -0.8], [-0.2, -0.46]], 0.38, 0.08), narrow), { c: L.trimM });
  S.g.cyl(0.035, 0.07, fh - 0.4, { at: [0, -0.4 - (fh - 0.4) / 2, -0.17], rot: [0.06, 0, 0], c: L.gold }, 10); // (the stiletto)
  S.g.ring(0.16, 0.025, { at: [0, -0.02, 0.02], c: L.gold }, 24, 4);
}
/** A pointe: the toe standing straight down onto the ground (the ankle frame's -Y), a ribbon band round it. */
function pointe(S, h, piece = 'trim') {
  S[piece].lathe([[0.001, -h], [0.08, -h + 0.02], [0.17, -h + 0.25], [0.2, -0.1], [0.16, 0.14]], { c: piece === 'trim' ? L.trimM : L.pale }, 24);
  S.g.ring(0.19, 0.025, { at: [0, -0.12, 0], c: L.gold }, 24, 4);
}

// ------------------------------------------------------------------ the bipeds
const BIPED = {
  haydee: { hipX: 1.44, A: [-0.14, 0.27, -0.13], toe: -0.1, FH: 1.55, pelvis: (S) => haydeePelvis(S),
    TH: [[0.66, 0.14], [1.08, 0.04], [1.2, -0.12], [1.12, -0.36], [0.9, -0.62], [0.66, -0.86], [0.5, -1.0], [0.44, -1.04]],
    SH: [[0.42, 0.06], [0.52, -0.04], [0.6, -0.2], [0.63, -0.34], [0.53, -0.56], [0.38, -0.8], [0.29, -0.95], [0.26, -1.03]] },
  drossel: { hipX: 0.95, A: [-0.1, 0.2, -0.1], toe: -0.06, FH: 1.8, pelvis: (S) => drosselPelvis(S),
    TH: [[0.48, 0.12], [0.68, 0.02], [0.72, -0.25], [0.62, -0.62], [0.44, -0.95], [0.38, -1.03]],
    SH: [[0.36, 0.05], [0.44, -0.05], [0.48, -0.25], [0.42, -0.5], [0.28, -0.82], [0.21, -0.97], [0.2, -1.03]] },
};
function thighDress(S, B, T, s) {
  if (B === BIPED.drossel) { // (the garter: a trim band and a gold bead ring)
    S.trim.lathe([[0.7, -0.18 * T], [0.75, -0.22 * T], [0.7, -0.26 * T]], { c: L.trimM }, 32); S.g.ring(0.72, 0.02, { at: [0, -0.27 * T, 0], c: L.gold }, 32, 4);
  } else { line(S, 1.12, -0.36 * T); tube(S.core, [[s * 1.2, -0.05 * T, -0.15], [s * 1.12, -0.38 * T, 0.05], [s * 0.85, -0.7 * T, 0.32]], 0.02, L.coreD, 14); }
}
function kneeDress(S, B) {
  if (B === BIPED.drossel) { S.g.ring(0.15, 0.03, { at: [0, 0.02, 0.33], rot: [PI / 2, 0, 0], c: L.gold }, 20, 4); S.l.ball(0.11, { at: [0, 0.02, 0.36], sc: [1, 1, 0.5], c: labTone(0.2, 0.2) }, 14, 10); }
  else S.p.geo(shell([[0.001, 0.22], [0.24, 0.17], [0.32, 0.0], [0.26, -0.2], [0.001, -0.26]], 20, -1.0, 2.0), { at: [0, 0, 0.3], sc: [1.1, 1, 0.8], c: L.pale }); // (the kneecap)
}
function shinDress(S, B, Sh, s) {
  if (B === BIPED.drossel) { for (let i = 0; i < 6; i++) { const u = 0.15 + i * 0.13, r = profAt([...B.SH].reverse(), -u); S.g.ball(0.045, { at: [s * (r + 0.02), -u * Sh, 0.06], c: L.gold }, 8, 6); } S.g.ring(0.35, 0.025, { at: [0, -0.04 * Sh, 0], c: L.gold }, 28, 4); }
  else line(S, 0.56, -0.5 * Sh);
}
function bipedLegs(ctx) {
  const { H, F, joint, put, ballAt } = ctx, B = BIPED[F.fem] || BIPED.haydee, { A, FH, hipX } = B, j = F.joint, D = B === BIPED.drossel;
  const len = (H - 0.35 - FH - 0.1) / (Math.cos(A[0]) + Math.cos(A[0] + A[1])), T = len, Sh = len;
  const calf = (x, y, z, u) => [x, y, z * (z < 0 ? 1 + 0.35 * bump(u, 0.04, 0.62) : 0.92)];
  put(ctx.pelvis, B.pelvis);
  const legs = {};
  for (const [s, k] of SIDES) {
    const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * B.toe]);
    const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
    const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, -s * B.toe]);
    put(hip, (S) => { ball(S.g, 0.52 * j); coreOf(S, 0.3, T); lathe(S.p, B.TH, T, L.pale); thighDress(S, B, T, s); });
    put(knee, (S) => { ball(S.g, 0.44 * j); coreOf(S, 0.18, Sh); lathe(D ? S.trim : S.p, B.SH, Sh, D ? L.trimM : L.pale, calf); kneeDress(S, B); shinDress(S, B, Sh, s); });
    put(ankle, (S) => { ball(S.g, 0.38 * j); (D ? drosselFoot : haydeeFoot)(S, FH); });
    ballAt(`hip${k}`, hip, 0.52 * j);
    legs[k] = { hip, knee, ankle };
  }
  return {
    drop: (kn) => kn * H * 0.42,
    pose({ gait, walk, kneel }) {
      const sw = (D ? 0.3 : 0.36) * walk * Math.sin(PI * gait);
      for (const [s, k] of SIDES) {
        const { hip, knee, ankle } = legs[k], phase = s > 0 ? sw : -sw, lead = s > 0 ? 1 : 0;
        hip.rotation.x = A[0] - phase - kneel * (lead ? 1.1 : 0.3);
        knee.rotation.x = A[1] + Math.max(0, phase) * 0.9 + kneel * (lead ? 1.5 : 1.9);
        ankle.rotation.x = A[2] - Math.max(0, phase) * 0.3 - kneel * (lead ? 0.4 : 0.6);
      }
    },
  };
}

// ------------------------------------------------------------------ the reverse joint
function springLegs(ctx) {
  const { H, F: FF, joint, put, ballAt } = ctx, D = FF.fem === 'drossel', F = 0.36, A = [-0.65, 1.45, -1.05], T = 2.3, M = 1.9, hipX = D ? 0.98 : 1.5, j = FF.joint;
  const Sh = (H - 0.35 - F - 0.09 - T * Math.cos(A[0]) - M * Math.cos(A[0] + A[1] + A[2])) / Math.cos(A[0] + A[1]);
  const TH = D ? BIPED.drossel.TH : BIPED.haydee.TH, SH = D ? BIPED.drossel.SH : BIPED.haydee.SH;
  put(ctx.pelvis, D ? (S) => drosselPelvis(S) : (S) => haydeePelvis(S));
  const legs = {};
  for (const [s, k] of SIDES) {
    const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.02]);
    const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
    const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, 0]);
    const toe = joint(`toe${k}`, ankle, [0, -M, 0], [-(A[0] + A[1] + A[2]), 0, -s * 0.02]);
    put(hip, (S) => { ball(S.g, 0.52 * j); coreOf(S, 0.3, T); lathe(S.p, TH, T, L.pale); if (D) thighDress(S, BIPED.drossel, T, s); else line(S, 1.1, -0.4 * T); });
    put(knee, (S) => {
      ball(S.g, 0.44 * j); coreOf(S, 0.18, Sh);
      lathe(D ? S.trim : S.p, SH, Sh, D ? L.trimM : L.pale, (x, y, z, u) => [x, y, z * (z > 0 ? 1 + 0.3 * bump(u, 0.04, 0.6) : 0.95)]); // (the calf's swell faces forward: the shin runs back)
      S.g.cyl(0.04, 0.04, Sh * 0.6, { at: [0, -Sh * 0.45, 0.2], c: L.gold }, 8); // (the piston, sunk in the calf)
      if (D) kneeDress(S, BIPED.drossel); else line(S, 0.54, -0.55 * Sh);
    });
    put(ankle, (S) => {
      ball(S.g, 0.36 * j); coreOf(S, 0.14, M);
      lathe(D ? S.trim : S.p, [[0.32, 0.06], [0.38, -0.08], [0.34, -0.45], [0.24, -0.85], [0.21, -1.02]], M, D ? L.trimM : L.mid);
      if (D) for (let i = 0; i < 4; i++) S.g.ball(0.04, { at: [s * 0.36, -(0.2 + i * 0.18) * M, 0.0], c: L.gold }, 8, 6);
      else line(S, 0.34, -0.4 * M);
    });
    put(toe, (S) => {
      ball(S.g, 0.3 * j);
      if (D) { pointe(S, F); return; }
      const narrow = (x, y, z) => [x * (1 - 0.45 * clamp(z / 1.3)), y, z];
      S.p.geo(sculpt(sidePlate([[-0.32, 0.18], [0.22, 0.2], [0.8, -0.12], [1.28, -F + 0.04], [1.36, -F], [-0.1, -F], [-0.34, -0.12]], 0.44, 0.1), narrow), { c: L.pale }); // (the pointed shoe)
      S.p.geo(sidePlate([[-0.2, -0.05], [-0.62, -F + 0.02], [-0.5, -F], [-0.06, -0.2]], 0.16, 0.04), { c: L.mid }); // (the spur, a heel's tip)
    });
    ballAt(`hip${k}`, hip, 0.52 * j);
    legs[k] = { hip, knee, ankle, toe };
  }
  return {
    drop: (kn) => kn * H * 0.35,
    pose({ gait, walk, kneel }) {
      const sw = 0.3 * walk * Math.sin(PI * gait);
      for (const [s, k] of SIDES) {
        const { hip, knee, ankle, toe } = legs[k], ph = s > 0 ? sw : -sw;
        hip.rotation.x = A[0] - ph - kneel * 0.5;
        knee.rotation.x = A[1] + Math.max(0, ph) * 0.6 + kneel * 0.6;
        ankle.rotation.x = A[2] - Math.max(0, ph) * 0.4 - kneel * 0.3;
        toe.rotation.x = -(hip.rotation.x + knee.rotation.x + ankle.rotation.x);
      }
    },
  };
}

// ------------------------------------------------------------------ the tetrapod
function crabLegs(ctx) {
  const { H, F, joint, put, ballAt } = ctx, D = F.fem === 'drossel', j = F.joint;
  const hy = D ? -1.8 : -0.3, up = D ? [-0.45, 1.5] : [0.9, 1.7], out = D ? 2.6 : 2.75, rr = D ? 0.4 : 0.46;
  put(ctx.pelvis, (S) => {
    if (D) { drosselPelvis(S, BELL.wide, { closed: true, n: 14, tiers: 3 }); return; }
    haydeePelvis(S, 1.95);
    S.g.ring(1.1, 0.04, { at: [0, 0.5, 0], sc: [1.2, 1, 0.85], c: L.gold }, 36, 4);
  });
  const legs = [];
  for (const [s, k] of SIDES) {
    const side = joint(`hip${k}`, ctx.pelvis, [0, 0, 0]);
    for (const f of [1, -1]) {
      const at = [s * (D ? 1.3 : 1.7), hy, f * (D ? 1.0 : 1.0)], yaw = Math.atan2(at[0], at[2]), nm = `${k}${f > 0 ? 'F' : 'B'}`;
      const root = joint(`leg${nm}`, side, at, [0, yaw, 0]);
      const Lu = Math.hypot(...up), a1 = aimOf(up[0], up[1]);
      const upper = joint(`upper${nm}`, root, [0, 0, 0], [a1, 0, 0]);
      const kneeY = H + hy + up[0], dz = out - up[1], Ll = Math.hypot(kneeY - 0.25, dz), a2 = aimOf(-(kneeY - 0.25), dz);
      const lower = joint(`lower${nm}`, upper, [0, -Lu, 0], [a2 - a1, 0, 0]);
      put(root, (S) => { if (!D) S.p.geo(cup(0.4).rotateX(-PI / 2), { at: [0, 0, -0.08], c: L.ivory }); });
      put(upper, (S) => {
        ball(S.g, 0.42 * j); coreOf(S, 0.22, Lu);
        lathe(S.p, [[rr, 0.1], [rr * 1.35, -0.08], [rr * 1.3, -0.45], [rr * 1.05, -0.85], [rr * 0.95, -1.02]], Lu, L.pale);
        if (D) S.g.ring(rr * 1.32, 0.025, { at: [0, -0.3 * Lu, 0], c: L.gold }, 28, 4); else line(S, rr * 1.3, -0.5 * Lu);
      });
      put(lower, (S) => {
        ball(S.g, 0.38 * j); coreOf(S, 0.15, Ll - 0.6);
        const pr = [[rr * 0.9, 0.06], [rr * 1.2, -0.12], [rr * 1.15, -0.35], [rr * 0.75, -0.7], [rr * 0.4, -0.9], [0.08, -0.97], [0.001, -1.0]];
        lathe(D ? S.trim : S.p, pr, Ll, D ? L.trimM : L.pale, (x, y, z, u) => [x, y, z * (z < 0 ? 1 + 0.3 * bump(u, 0.05, 0.5) : 1)]);
        if (D) { S.g.ring(rr * 1.1, 0.025, { at: [0, -0.06 * Ll, 0], c: L.gold }, 28, 4); for (let i = 0; i < 4; i++) S.g.ball(0.04, { at: [0, -(0.18 + i * 0.12) * Ll, -rr * 1.12], c: L.gold }, 8, 6); }
        else { line(S, rr * 1.12, -0.32 * Ll); S.p.geo(sidePlate([[-0.05, 0], [-0.45, -0.55], [-0.12, -0.5]], 0.12, 0.03), { at: [0, -Ll + 0.75, -0.1], c: L.mid }); } // (the stiletto's spur)
      });
      ballAt(`hip${k}`, upper, 0.42 * j);
      legs.push({ root, upper, lower, yaw, a1, a2, pair: (s > 0) === (f > 0) ? 0 : 1 });
    }
  }
  return {
    drop: (kn) => kn * 0.8,
    pose({ gait, walk, kneel }) {
      const ph = Math.sin(PI * gait);
      for (const Lg of legs) {
        const w = (Lg.pair ? ph : -ph) * walk;
        Lg.root.rotation.y = Lg.yaw + 0.2 * w;
        Lg.upper.rotation.x = Lg.a1 - 0.2 * Math.max(0, w) + kneel * 0.15;
        Lg.lower.rotation.x = Lg.a2 - Lg.a1 + 0.1 * Math.max(0, w) - kneel * 0.1;
      }
    },
  };
}

// ------------------------------------------------------------------ the tank
function treadLegs(ctx) {
  const { H, F, joint, put, ballAt, mats, owned } = ctx, D = F.fem === 'drossel';
  const len = D ? 5.4 : 5.4, R = D ? 1.0 : 1.15, w = D ? 1.0 : 1.3, podX = D ? 1.6 : 2.45, podY = R + 0.05 - H, wy = -R * 0.46, wr = R * 0.42;
  put(ctx.pelvis, (S) => {
    if (D) { drosselPelvis(S, BELL.gown, { closed: true, n: 16, tiers: 3 }); return; }
    haydeePelvis(S, 1.9);
    S.g.ring(1.95, 0.06, { at: [0, -0.62, 0], c: L.gold }, 40, 5); // (the turret ring)
    S.p.lathe([[0.001, -1.05], [1.75, -0.95], [2.05, -0.72], [1.85, -0.5]], { c: L.mid }, 36);
  });
  const wheel = new Piece();
  wheel.cyl(wr, wr, 0.2, { rot: [0, 0, PI / 2], c: L.gold }, 20); wheel.cyl(wr * 0.4, wr * 0.4, 0.3, { rot: [0, 0, PI / 2], c: L.bronze }, 12);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; wheel.slab(0.24, 0.05, wr * 1.3, { at: [0.11, 0, 0], rot: [a, 0, 0], c: L.bronze }); }
  const wg = wheel.done(), pods = [], WZ = [-0.36, -0.18, 0, 0.18, 0.36].map((z) => z * len);
  for (const [s, k] of SIDES) {
    const pod = joint(`hip${k}`, ctx.pelvis, [s * podX, podY, 0]);
    const stad = [];
    for (let i = 0; i <= 12; i++) { const a = -PI / 2 + (i / 12) * PI; stad.push([len / 2 - R + Math.cos(a) * R, Math.sin(a) * R]); }
    for (let i = 0; i <= 12; i++) { const a = PI / 2 + (i / 12) * PI; stad.push([-len / 2 + R + Math.cos(a) * R, Math.sin(a) * R]); }
    put(pod, (S) => {
      S.core.geo(sidePlate(stad, w, 0.1), { c: L.coreD }); // (the tread)
      S.p.geo(sidePlate(stad.map(([z, y]) => [z * 0.95, y * 0.9]), w + 0.08, 0.04), { c: L.dark });
      if (D) { // (a lacquered drum cover each side, gilt, under the gown)
        S.trim.geo(sidePlate(stad.map(([z, y]) => [z * 0.8, y * 0.7]), w + 0.2, 0.06), { c: L.trimM });
        for (const x of [-1, 1]) S.g.ring(R * 0.5, 0.03, { at: [x * (w / 2 + 0.12), 0, 0], rot: [0, 0, PI / 2], c: L.gold }, 24, 4);
        return;
      }
      // the hull: a smooth rounded shell over the top and sides, a panel band round it, a trim stripe
      const hull = new THREE.SphereGeometry(1, 40, 20, 0, PI * 2, 0, PI * 0.6);
      S.p.geo(hull, { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.pale });
      S.core.geo(new THREE.SphereGeometry(1.012, 40, 2, 0, PI * 2, PI * 0.3, PI * 0.02), { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.coreD });
      S.trim.geo(new THREE.SphereGeometry(1.01, 40, 2, 0, PI * 2, PI * 0.47, PI * 0.04), { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.trimM });
      ball(S.g, 0.36, [-s * 0.5, R * 1.1, 0]); S.core.cyl(0.3, 0.3, 0.8, { at: [-s * 0.6, R * 1.2, 0], rot: [0, 0, PI / 2], c: L.core }, 16);
    });
    const inst = new THREE.InstancedMesh(wg, mats.g, WZ.length); inst.castShadow = true; inst.name = `mech.wheels${k}`; pod.add(inst); owned.push(inst);
    ballAt(`hip${k}`, pod, 0.36, [-s * 0.5, R * 1.1, 0]);
    pods.push({ s, inst });
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), one = new THREE.Vector3(1, 1, 1), at = new THREE.Vector3();
  const spin = (a) => { for (const P of pods) { WZ.forEach((z, i) => { m.compose(at.set(P.s * (w / 2 + 0.1), wy, z), q.setFromAxisAngle(X, a), one); P.inst.setMatrixAt(i, m); }); P.inst.instanceMatrix.needsUpdate = true; } };
  spin(0);
  return { drop: () => 0, pose({ travel = 0 }) { spin(travel / wr); } };
}

export const FEM_LEGS = { clayLegs: bipedLegs, springLegs, crabLegs, treadLegs };
