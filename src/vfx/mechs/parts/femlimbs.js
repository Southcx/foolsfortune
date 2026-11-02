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
import { MECH_LOOK as L, shell, plate, jointBall, profAt } from './kit.js';
import { aoTone, bounded, sculptSide, socketLimb } from './femlegs.js';
import { sphere, ellipsoid, box, cone, blend, carve, meet } from './sdf.js';

const PI = Math.PI;
/** The interstitial's column inside a limb, from `from` m down to `len` m: kept out of the glass balls at its ends. */
const core = (S, r, len, from = 0.05) => S.core.lathe([[r, -from], [r, -len]], { c: L.core }, 18);

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

/** How a hand closes (the curl of each finger's three joints, rad), as arms.js's hand closes (CURL), so a haft sits where gripAt says. */
const CURL = { open: [0.3, 0.42, 0.33], hold: [1.25, 0.72, 0.63], fist: [1.55, 0.9, 0.8] };
const HAND_CELL = 0.036;
/** Haydee's hand, sculpted (South, 2026-11-02: "the feminine mecha hands"): one body in the signed distance field, the wrist's ball
 *  seated in a cup at its heel; the palm narrow at the wrist and broadening to the knuckles, its hollow cut between the thumb's mound
 *  (the thenar) and the little finger's (the hypothenar); the back's four tendons raised toward the knuckles' swells; the four fingers
 *  long and tapered in three phalanges, each joint a slight swell, splayed a little when open; the thumb out of its mound. In the
 *  hand's frame (palm to +Z, the thumb to s), at the sizes arms.js's hand takes (so the grip stands where gripAt puts it). */
function handField(s, grip, { w, h, d, fl, fw, wr }) {
  const curl = CURL[grip] || CURL.open, y0 = -wr * 0.6, yb = y0 - h, ym = (y0 + yb) / 2, pts = [];
  const taper = (g) => (x, y, z) => g(x / (0.74 + 0.26 * Math.min(1, Math.max(0, (y0 - y) / h))), y, z);
  let f = taper(box([0, ym, 0], [w * 0.47, h / 2, d * 0.38], Math.min(0.12, d * 0.3)));
  f = blend(0.1, f, ellipsoid([0, y0 + 0.02, 0], [w * 0.3, wr * 0.75, d * 0.42]), // (the wrist's root)
    ellipsoid([s * w * 0.3, y0 - h * 0.34, d * 0.24], [w * 0.2, h * 0.3, d * 0.3]), // (the thenar)
    ellipsoid([-s * w * 0.33, y0 - h * 0.58, d * 0.2], [w * 0.14, h * 0.32, d * 0.26])); // (the hypothenar)
  const xs = [-0.375, -0.125, 0.125, 0.375].map((q) => q * w), parts = [], bnds = [], nails = [], pinky = s > 0 ? 0 : 3;
  const shut = grip !== 'open';
  xs.forEach((x, i) => {
    const own = [], o = Math.abs(i - pinky); // (0 the little finger .. 3 the index)
    const ky = yb + [0.07, 0, -0.03, 0][o] * h, kz = -0.03 * (o === 0 || o === 3 ? 1 : 0); // (the knuckles' arch: the little finger's set higher)
    own.push(cone([x * 0.35, y0 - 0.1, -d * 0.34], [x, ky + 0.08, -d * 0.36], 0.028, 0.034)); // (a tendon on the back)
    own.push(sphere([x, ky + 0.04, -d * 0.06 + kz], fw * 0.6)); // (its knuckle)
    const lens = [fl[0] * [0.84, 0.97, 1, 0.92][o], fl[1] * 0.56 * [0.84, 0.97, 1, 0.95][o], fl[1] * 0.46 * [0.84, 0.97, 1, 0.95][o]];
    const rad = [fw * 0.48, fw * 0.44, fw * 0.4, fw * 0.34, fw * 0.27].map((r) => r * (o === 0 ? 0.9 : 1));
    const more = shut ? [1.14, 1.06, 1.0, 0.92][o] : 1; // (a closing hand's fingers curl in a fan, the little finger most)
    let at = [x, ky, 0.02 + kz], a = 0; const splay = grip === 'open' ? (x / w) * 0.22 : (x / w) * 0.05;
    for (let n = 0; n < 3; n++) {
      a += curl[n] * more; const dir = [splay, -Math.cos(a), Math.sin(a)], l = Math.hypot(...dir), L1 = lens[n];
      const to = [at[0] + (dir[0] / l) * L1, at[1] + (dir[1] / l) * L1, at[2] + (dir[2] / l) * L1];
      own.push(cone(at, to, rad[n], rad[n + 1] * (n === 2 ? 0.85 : 1))); if (n < 2) own.push(sphere(to, rad[n + 1] * 1.1)); // (a phalanx; its joint's swell)
      if (n === 2) { // (the nail: a plate raised on the last phalanx's back)
        const bk = [0, -Math.sin(a), -Math.cos(a)], on = (u, k) => [at[0] + (dir[0] / l) * L1 * u + bk[0] * rad[2] * k, at[1] + (dir[1] / l) * L1 * u + bk[1] * rad[2] * k, at[2] + (dir[2] / l) * L1 * u + bk[2] * rad[2] * k];
        const n0 = on(0.38, 0.7), n1 = on(0.9, 0.55); own.push(cone(n0, n1, rad[2] * 0.42, rad[2] * 0.36)); nails.push([n0, n1, rad[2] * 0.62]);
      }
      pts.push(to); at = to;
    }
    const ps = [[x * 0.35, y0 - 0.1, -d * 0.34], [x, ky, 0], ...pts.slice(-3)], mid = [0, 1, 2].map((c) => ps.reduce((t, q) => t + q[c], 0) / ps.length);
    const reach = Math.max(...ps.map((q) => Math.hypot(q[0] - mid[0], q[1] - mid[1], q[2] - mid[2]))) + fw * 0.7 + 0.05;
    const bs = sphere(mid, reach); bnds.push(bs); parts.push(bounded(blend(0.016, ...own), bs, 0.1)); // (the finger read only near it)
  });
  // the thumb, out of its mound: across the palm toward the fingers when the hand closes, out to the side when open
  const t0 = [s * w * 0.4, y0 - h * 0.38, d * 0.3], open = grip === 'open';
  const d1 = open ? [s * 0.55, -0.72, 0.42] : [-s * 0.18, -0.62, 0.76], d2 = open ? [s * 0.25, -0.9, 0.35] : [-s * 0.62, -0.5, 0.6];
  const go = (p, v, len) => { const l = Math.hypot(...v); return [p[0] + (v[0] / l) * len, p[1] + (v[1] / l) * len, p[2] + (v[2] / l) * len]; };
  const t1 = go(t0, d1, fl[0] * 0.62), t2 = go(t1, d2, fl[0] * 0.55); pts.push(t1, t2);
  parts.push(cone(t0, t1, fw * 0.6, fw * 0.5), sphere(t1, fw * 0.54), cone(t1, t2, fw * 0.5, fw * 0.36));
  f = blend(0.035, f, blend(0, ...parts)); // (the fingers and thumb into the palm smoothly; to each other never, so they part)
  f = carve(0.08, f, ellipsoid([-s * 0.04, ym - 0.06, d * 0.5 + 0.1], [w * 0.28, h * 0.3, 0.16])); // (the palm's hollow)
  f = meet(0.05, carve(0.04, f, sphere([0, 0, 0], wr + 0.03)), (x, y, z) => y + 0.3 * wr); // (the cup the wrist's ball sits in, its lip under the equator)
  const env = blend(0, box([0, ym + 0.05, 0], [w * 0.62, h / 2 + wr * 0.6, d * 0.75], 0.05), sphere(t1, fl[0] * 0.75 + fw), ...bnds);
  f = bounded(f, env, 0.1); // (exact: the hand never stands past its envelope, so past 0.1 m only the sign is read)
  const lo = [-w * 0.6, yb, -d * 0.6], hi = [w * 0.6, wr * 0.3, d * 0.6];
  for (const q of pts) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], q[c] - fw * 0.6); hi[c] = Math.max(hi[c], q[c] + fw * 0.6); }
  return { f, bounds: [lo, hi], nails };
}
/** The hand at the form's size (arms.js's sizes), the wrist's ball in its cup. */
function femHand(S, s, grip, { w, h, d, fl, fw, wr }, id) {
  const F = S.F, k = F.hand * (F.gauntlet || 1), G = F.gauntlet || 1;
  const o = { w: w * k, h: h * G, d: d * k, fl: fl.map((x) => x * k), fw: fw * k, wr: wr * F.joint * G };
  jointBall(S, o.wr);
  const { f, bounds, nails } = handField(1, grip, o); // (the left hand's field, the right's its mirror: one mesh between them)
  const nail = (x, y, z) => { for (const [a, b, r] of nails) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; if (Math.hypot(x - m[0], y - m[1], z - m[2]) < r * 1.5) return L.ivory; } return L.pale; };
  sculptSide(S.p, f, bounds, HAND_CELL, { key: `fem.hand.${id}.${grip}.${k.toFixed(3)}.n`, tone: aoTone(f, L.dark, L.pale, nail), flip: s < 0 });
}

/** Haydee's deltoid cap (the default pauldron), fuller on the strong arms. */
const deltoid = (k) => (S, s) => {
  S.trim.geo(shell([[0.64 * k, -0.28], [0.68 * k, 0.08], [0.58 * k, 0.44], [0.32 * k, 0.66], [0.001, 0.7]], 36), { at: [s * 0.2, 0.05, 0], sc: [1, 0.9, 1.06], c: L.trimL });
  S.g.ring(0.64 * k, 0.03, { at: [s * 0.2, 0.05 - 0.25 * 0.9, 0], sc: [1, 1, 1.06], c: L.gold }, 36, 4);
};
export function femArmLook(id, F) {
  const A = ARMS[id] || ARMS.clayArms, UP = A.UP, FO = A.FO;
  return {
    splay: 0.48, bend: 0.08, slope: 0.22, upper: A.upper, fore: A.fore, palm: A.palm, ball: A.ball, elbow: A.elbow * 1.4, wrist: A.wrist,
    pauldron: deltoid(id === 'strongArms' ? 1.18 : 1),
    shoulder(S, s) {
      // the upper arm lathed between its sockets: a lip under the shoulder's ball, a cup over the elbow's (femlegs.js socketLimb)
      const rs = this.ball * F.joint, rb = this.elbow * F.joint;
      jointBall(S, rs); core(S, 0.2, this.upper - rb * 1.1, rs * 1.05); socketLimb(S, UP, this.upper, { top: rs, bot: rb, grooves: [0.55] });
    },
    foreArm(S, s) {
      const rb = this.elbow * F.joint, rw = this.wrist * F.joint * (F.gauntlet || 1);
      jointBall(S, rb); core(S, 0.15, this.fore - rw * 1.1, rb * 1.05); socketLimb(S, FO, this.fore, { top: rb, bot: rw, grooves: [0.45] });
      const r = (u) => profAt([...FO].reverse(), -u);
      if (id === 'quickArms') S.trim.geo(plate([[0, 0], [0.16, 0], [0.04, -1.8], [-0.02, -1.82]], 0.06, 0.02), { at: [s * (r(0.2) - 0.02), -0.25, 0], rot: [0, s * PI / 2, -s * 0.06], c: L.trimM });
      if (id === 'strongArms') S.trim.lathe([[r(0.8) + 0.01, -0.7 * this.fore], [r(0.8) + 0.04, -0.8 * this.fore], [r(0.88) + 0.01, -0.86 * this.fore]], { c: L.trimM }, 32);
    },
    /** The wrist's ball's radius for the parts body's registry (it sits at the hand joint's origin). */
    get wristBall() { return this.wrist * F.joint * (F.gauntlet || 1); },
    hand(S, s, grip) { const H = A.hand; femHand(S, s, grip, { w: H.w, h: this.palm, d: H.d, fl: H.fl, fw: H.fw, wr: this.wrist }, id); },
  };
}
