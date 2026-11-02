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
// Haydee's thighs set closer (South, 2026-11-02: the thigh gap "by about 12%", then "another 10%": hipX 1.5, 1.44, 1.30; the thighs'
// size kept, "perfect"), and her pelvis seats the waist column's lower ball in an ivory socket (femcores.js `spine`). The pelvis is a
// violin's lower bout (South, 2026-11-02: "a bit more of a bottom half of a violin-shape with high hipbones"): its widest round and
// full, its shoulder convex, then the C-bout's concave curve in to the waist column; the iliac crests (`CREST`) raised plates high on
// its sides just under the waist, flaring out over the curve, gilt on their lip. Every ball the skin's (kit.js `jointBall`).
//   haydee (the `doll` form)
//     clayLegs    a sculpted pelvis (the bout, the crests, a leotard's panel line, the seat's two swells), thick thighs tapering to the
//                 knee, a strong calf's swell, armoured high-heeled feet: the arch, the foot on its toe, a real heel under the ankle
//     springLegs  the reverse joint as a high heel made whole: a thick thigh, a strong calf, the metatarsal a heel's pylon, a pointed shoe
//     crabLegs    four long dancer's legs off a broad, low pelvis, each tapering to a stiletto point with its spur
//     treadLegs   two pods under smooth rounded hulls, a panel band round each, the broad pelvis on its wide turret ring
// (Drossel's form is retired, 2026-11-02: her gowns are the hip pieces, parts/hips.js, worn over any of these; her en-pointe toes and
// spider legs gave way to the doll's own set, which already carries the heel and the stiletto points.)
// Prior art: the Venus of Willendorf (c. 25,000 BC) and of Hohle Fels (c. 38,000 BC), the Cucuteni-Trypillia goddess figurines and the
// Jomon dogu (the weight read as mass in the hips and thighs, the top narrow); Haydee (Haydee Interactive, 2016: the white android's
// high-heeled armoured feet and sparse panel lines); the violin's lower bout and C-bouts (Stradivari's outline: the luthier's mould);
// the iliac crest as the sculptor's high hipbone; Elemental Gearbolt's mechanical girls (Alfa System, 1997); the Spider Tank and the
// Tachikoma (the tetrapod's reach); the hero legs' rig and walks (legs.js).
//
//   FEM_LEGS[id](ctx) -> { pose({ gait, walk, kneel, travel }), drop(kneel) }   (ctx as legs.js's)
//   lathe(P, prof, len, c, fn?, seg?) (a limb lathed down -Y from [[r m, y in lengths]], sculpted by fn(x, y, z, u))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { MECH_LOOK as L, sidePlate, shell, cup, ball, jointBall, band, profAt, curved, panel, sculpt, aimOf, tube } from './kit.js';

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
/** The pelvis's profile (r m, y m): a violin's lower bout, round and full at its widest, its shoulder convex, then the C-bout's concave
 *  curve in to the waist column's socket. */
const BOUT = [[0.001, -0.94], [0.55, -0.92], [1.1, -0.76], [1.42, -0.5], [1.5, -0.2], [1.47, 0.06], [1.37, 0.26], [1.15, 0.43], [0.82, 0.53],
  [0.58, 0.61], [0.47, 0.71], [0.44, 0.79], [0.001, 0.82]];
/** The iliac crests: a raised plate each side, high on the bout just under the waist (y0..y1), round the side from the front (a0) to
 *  the back (a1, rad off the side), standing `lift` m off the bout at its foot and `flare` at its lip; its lip gilt. */
const CREST = { y0: 0.16, y1: 0.46, a0: -0.95, a1: 0.55, lift: 0.04, flare: 0.2, th: 0.08 };
/** Haydee's pelvis: the violin's lower bout pressed in at the crotch, the seat's two swells behind, cut as a leotard (a front panel, the
 *  hips, the seat), the iliac crests high on its sides, its waist ring in trim; the panel lines are real grooves over the core. */
function haydeePelvis(S, sx = 1.72) {
  const prof = band(BOUT, -0.94, 0.82, 1, 40);
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
  S.p.lathe([[0.37, 0.68], [0.46, 0.72], [0.49, 0.8], [0.44, 0.86], [0.37, 0.89]], { c: L.ivory }, 32); // (the socket the waist column's ball sits in)
  const C = CREST, base = (y) => profAt(BOUT, y), ym = (C.y0 + C.y1) / 2;
  const cr = [[base(C.y0) + C.lift, C.y0], [base(ym) + C.lift + C.flare * 0.35, ym], [base(C.y1 - 0.05) + C.flare, C.y1]];
  for (const s of [1, -1]) {
    const a0 = s > 0 ? PI / 2 + C.a0 : -PI / 2 - C.a1, a1 = s > 0 ? PI / 2 + C.a1 : -PI / 2 - C.a0, span = a1 - a0;
    const taper = (x, y, z) => { const e = Math.sin(PI * Math.min(1, Math.max(0, (Math.atan2(x, z) - a0) / span))) ** 0.55; return fn(x, ym + (y - ym) * e, z); };
    S.p.geo(sculpt(curved(cr, C.th, a0, a1, 22), taper), { c: L.pale }); // (the crest)
    const lip = []; for (let i = 1; i < 12; i++) { const a = a0 + (span * i) / 12, e = Math.sin((PI * i) / 12) ** 0.55, r = cr[2][0] + 0.02; lip.push(fn(Math.sin(a) * r, ym + (C.y1 - ym) * e, Math.cos(a) * r)); }
    tube(S.g, lip, 0.03, L.gold, 24); // (its gilt lip)
  }
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
// ------------------------------------------------------------------ the bipeds
const BIPED = {
  haydee: { hipX: 1.3, A: [-0.14, 0.27, -0.13], toe: -0.1, FH: 1.55, pelvis: (S) => haydeePelvis(S),
    TH: [[0.66, 0.14], [1.08, 0.04], [1.2, -0.12], [1.12, -0.36], [0.9, -0.62], [0.66, -0.86], [0.5, -1.0], [0.44, -1.04]],
    SH: [[0.42, 0.06], [0.52, -0.04], [0.6, -0.2], [0.63, -0.34], [0.53, -0.56], [0.38, -0.8], [0.29, -0.95], [0.26, -1.03]] },
};
/** The kneecap: a rounded plate over the knee's ball. */
const kneecap = (S) => S.p.geo(shell([[0.001, 0.22], [0.24, 0.17], [0.32, 0.0], [0.26, -0.2], [0.001, -0.26]], 20, -1.0, 2.0), { at: [0, 0, 0.3], sc: [1.1, 1, 0.8], c: L.pale });
function bipedLegs(ctx) {
  const { H, F, joint, put, ballAt } = ctx, B = BIPED[F.fem] || BIPED.haydee, { A, FH, hipX } = B, j = F.joint;
  const len = (H - 0.35 - FH - 0.1) / (Math.cos(A[0]) + Math.cos(A[0] + A[1])), T = len, Sh = len;
  const calf = (x, y, z, u) => [x, y, z * (z < 0 ? 1 + 0.35 * bump(u, 0.04, 0.62) : 0.92)];
  put(ctx.pelvis, B.pelvis);
  const legs = {};
  for (const [s, k] of SIDES) {
    const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * B.toe]);
    const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
    const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, -s * B.toe]);
    put(hip, (S) => { jointBall(S, 0.52 * j); coreOf(S, 0.3, T); lathe(S.p, B.TH, T, L.pale); line(S, 1.12, -0.36 * T); tube(S.core, [[s * 1.2, -0.05 * T, -0.15], [s * 1.12, -0.38 * T, 0.05], [s * 0.85, -0.7 * T, 0.32]], 0.02, L.coreD, 14); });
    put(knee, (S) => { jointBall(S, 0.44 * j); coreOf(S, 0.18, Sh); lathe(S.p, B.SH, Sh, L.pale, calf); kneecap(S); line(S, 0.56, -0.5 * Sh); });
    put(ankle, (S) => { jointBall(S, 0.38 * j); haydeeFoot(S, FH); });
    ballAt(`hip${k}`, hip, 0.52 * j);
    legs[k] = { hip, knee, ankle };
  }
  return {
    drop: (kn) => kn * H * 0.42,
    pose({ gait, walk, kneel }) {
      const sw = 0.36 * walk * Math.sin(PI * gait);
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
  const { H, F: FF, joint, put, ballAt } = ctx, F = 0.36, A = [-0.65, 1.45, -1.05], T = 2.3, M = 1.9, hipX = 1.35, j = FF.joint;
  const Sh = (H - 0.35 - F - 0.09 - T * Math.cos(A[0]) - M * Math.cos(A[0] + A[1] + A[2])) / Math.cos(A[0] + A[1]);
  const { TH, SH } = BIPED.haydee;
  put(ctx.pelvis, (S) => haydeePelvis(S));
  const legs = {};
  for (const [s, k] of SIDES) {
    const hip = joint(`hip${k}`, ctx.pelvis, [s * hipX, -0.35, 0], [A[0], 0, s * 0.02]);
    const knee = joint(`knee${k}`, hip, [0, -T, 0], [A[1], 0, 0]);
    const ankle = joint(`ankle${k}`, knee, [0, -Sh, 0], [A[2], 0, 0]);
    const toe = joint(`toe${k}`, ankle, [0, -M, 0], [-(A[0] + A[1] + A[2]), 0, -s * 0.02]);
    put(hip, (S) => { jointBall(S, 0.52 * j); coreOf(S, 0.3, T); lathe(S.p, TH, T, L.pale); line(S, 1.1, -0.4 * T); });
    put(knee, (S) => {
      jointBall(S, 0.44 * j); coreOf(S, 0.18, Sh);
      lathe(S.p, SH, Sh, L.pale, (x, y, z, u) => [x, y, z * (z > 0 ? 1 + 0.3 * bump(u, 0.04, 0.6) : 0.95)]); // (the calf's swell faces forward: the shin runs back)
      S.g.cyl(0.04, 0.04, Sh * 0.6, { at: [0, -Sh * 0.45, 0.2], c: L.gold }, 8); // (the piston, sunk in the calf)
      line(S, 0.54, -0.55 * Sh);
    });
    put(ankle, (S) => {
      jointBall(S, 0.36 * j); coreOf(S, 0.14, M);
      lathe(S.p, [[0.32, 0.06], [0.38, -0.08], [0.34, -0.45], [0.24, -0.85], [0.21, -1.02]], M, L.mid);
      line(S, 0.34, -0.4 * M);
    });
    put(toe, (S) => {
      jointBall(S, 0.3 * j);
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
  const { H, F, joint, put, ballAt } = ctx, j = F.joint;
  const hy = -0.3, up = [0.9, 1.7], out = 2.75, rr = 0.46;
  put(ctx.pelvis, (S) => {
    haydeePelvis(S, 1.95);
    S.g.ring(1.1, 0.04, { at: [0, 0.5, 0], sc: [1.2, 1, 0.85], c: L.gold }, 36, 4);
  });
  const legs = [];
  for (const [s, k] of SIDES) {
    const side = joint(`hip${k}`, ctx.pelvis, [0, 0, 0]);
    for (const f of [1, -1]) {
      const at = [s * 1.7, hy, f * 1.0], yaw = Math.atan2(at[0], at[2]), nm = `${k}${f > 0 ? 'F' : 'B'}`;
      const root = joint(`leg${nm}`, side, at, [0, yaw, 0]);
      const Lu = Math.hypot(...up), a1 = aimOf(up[0], up[1]);
      const upper = joint(`upper${nm}`, root, [0, 0, 0], [a1, 0, 0]);
      const kneeY = H + hy + up[0], dz = out - up[1], Ll = Math.hypot(kneeY - 0.25, dz), a2 = aimOf(-(kneeY - 0.25), dz);
      const lower = joint(`lower${nm}`, upper, [0, -Lu, 0], [a2 - a1, 0, 0]);
      put(root, (S) => { S.p.geo(cup(0.4).rotateX(-PI / 2), { at: [0, 0, -0.08], c: L.ivory }); });
      put(upper, (S) => {
        jointBall(S, 0.42 * j); coreOf(S, 0.22, Lu);
        lathe(S.p, [[rr, 0.1], [rr * 1.35, -0.08], [rr * 1.3, -0.45], [rr * 1.05, -0.85], [rr * 0.95, -1.02]], Lu, L.pale);
        line(S, rr * 1.3, -0.5 * Lu);
      });
      put(lower, (S) => {
        jointBall(S, 0.38 * j); coreOf(S, 0.15, Ll - 0.6);
        const pr = [[rr * 0.9, 0.06], [rr * 1.2, -0.12], [rr * 1.15, -0.35], [rr * 0.75, -0.7], [rr * 0.4, -0.9], [0.08, -0.97], [0.001, -1.0]];
        lathe(S.p, pr, Ll, L.pale, (x, y, z, u) => [x, y, z * (z < 0 ? 1 + 0.3 * bump(u, 0.05, 0.5) : 1)]);
        line(S, rr * 1.12, -0.32 * Ll); S.p.geo(sidePlate([[-0.05, 0], [-0.45, -0.55], [-0.12, -0.5]], 0.12, 0.03), { at: [0, -Ll + 0.75, -0.1], c: L.mid }); // (the stiletto's spur)
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
  const { H, joint, put, ballAt, mats, owned } = ctx;
  const len = 5.4, R = 1.15, w = 1.3, podX = 2.45, podY = R + 0.05 - H, wy = -R * 0.46, wr = R * 0.42;
  put(ctx.pelvis, (S) => {
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
      // the hull: a smooth rounded shell over the top and sides, a panel band round it, a trim stripe
      const hull = new THREE.SphereGeometry(1, 40, 20, 0, PI * 2, 0, PI * 0.6);
      S.p.geo(hull, { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.pale });
      S.core.geo(new THREE.SphereGeometry(1.012, 40, 2, 0, PI * 2, PI * 0.3, PI * 0.02), { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.coreD });
      S.trim.geo(new THREE.SphereGeometry(1.01, 40, 2, 0, PI * 2, PI * 0.47, PI * 0.04), { at: [0, R * 0.25, 0], sc: [w / 2 + 0.34, R * 1.2, len / 2 + 0.15], c: L.trimM });
      jointBall(S, 0.36, [-s * 0.5, R * 1.1, 0]); S.core.cyl(0.3, 0.3, 0.8, { at: [-s * 0.6, R * 1.2, 0], rot: [0, 0, PI / 2], c: L.core }, 16);
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
