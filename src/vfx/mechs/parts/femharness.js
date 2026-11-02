// ---------------------------------------------------------------------------------------
// THE DOLL'S HARNESS (plain names; South, 2026-11-02: "draft up five more modular body sets, focusing on the ornamental body harness,
// flashy swimsuit-like? I think much like the halter fix, the pelvis ornamentation marks should accentuate the curves"): the gold and
// trim lines laid over the doll's plates (the `doll` form, femcores.js and femlegs.js) like a swimsuit's, one set worn at a time
// (`F.harness`, the parts body's `setHarness`). Each line is a fine bead riding the sculpt's surface (femlegs.js `surfAt`), drawn in
// the frame of the plate it lies on, so a line on a chest plate rides the plate's spring (partsbody.js BUST_SPRING) and a garter rides
// its thigh. The pelvis's lines follow its curves: cut high over the iliac crest, run round under the gluteal masses, never straight
// across them. Looks only.
//   halter    (the first, the default) the plates' gold underwires run up to a gorget's point at the collar; the pelvis's two
//             leotard panel lines down its front and seat
//   highcut   a racing one-piece: the leg line cut high over the crest and down under each cheek, doubled in gold and trim, a plunge
//             from the gorget to the ribs' foot between the plates, the plates' rims gilt
//   coins     a belly dancer's coin belt slung low on the hips, rising over each crest, dipping to a medallion under the navel, a
//             fringe of gold coins hung off it, and coins along each plate's underwire
//   cords     a kumihimo cord net: a braided cord belt and leg line, a diamond net of cords between them knotted in gold, the plates'
//             rims corded and crossed to the gorget
//   nouveau   Mucha's filigree: whiplash scrolls of gold out of the crests down over the hips, a spiral round each cheek, a
//             medallion at the sacrum and the gorget, a curl at each plate's outer rim
//   garters   a sash and garters: a sash of trim slung across the hips from one crest to the other hip's front, knotted in gold,
//             a trim band and gold clasp round each thigh, the plates' straps up to the shoulders
// Prior art: the halter top and the gorget (the first set, femcores.js); the competition one-piece's high-cut leg (Speedo's racer
// back, 1970s-90s); the Egyptian raqs sharqi hip scarf and its coin fringe; kumihimo, the Japanese braided cord (and the samurai
// armour's odoshi lacing it ties); Alphonse Mucha's whiplash scrolls and medallions (Art Nouveau, the 1890s posters); the garter
// belt and the Order of the Garter's sash; Haydee's and Elemental Gearbolt's suits read as panel lines.
//
//   HARNESSES[id] = { label, pelvis(S, P), chest(S, C), bust(S, B), thigh(S, T) }   (each optional)   HARNESS_IDS   harnessOf(F)
//   P { f, at(q), surf (femlegs.js surfAt), open(q) (true where a point is in the hip ball's opening), nrm(q) }
//   C { on(phi, y, k), top, choker (Vector3), shoulderY, under, nrm(p) }   B { s, r, z0, zb, rim(a, k), local(v), choker, shoulder, nrm(p) }   T { s, len, rAt(y) }
// The second sets, drawn with the flat lines (ribbons, bows, rope, beads), are femharness2.js's; the drawing kit is femharnesskit.js.
// ---------------------------------------------------------------------------------------
import { MECH_LOOK as L } from './kit.js';
import { MORE_HARNESSES } from './femharness2.js';
import { smooth, gilt, trim, onPelvis, path, mirror, both, legLine, beltLine, plateRim, strap, underwire, coin, outOf, spiral, PI } from './femharnesskit.js';

export const HARNESSES = {
  halter: { label: 'halter',
    pelvis(S, P) { // (the leotard's two panel lines down the front and the seat)
      for (const phi of [0.6, 2.42]) both(P, Array.from({ length: 17 }, (_, i) => [phi, 0.2 - i * 0.08]), (q) => trim(S, q));
    },
    bust(S, B) { const [a, b] = underwire(S, B); for (const end of [a, b]) strap(S, B, end, B.choker); S.g.ball(0.07, { at: B.local(B.choker).toArray(), c: L.gold }, 12, 8); },
  },
  highcut: { label: 'high cut',
    pelvis(S, P) {
      const leg = legLine(); both(P, path(0.1, 3.05, leg, 40), (q) => gilt(S, q, 0.026));
      both(P, path(0.1, 3.05, (p) => leg(p) - 0.09, 40), (q) => trim(S, q, 0.016)); // (the trim's second line under the gold)
      both(P, path(2.55, PI, () => 0.32, 6), (q) => gilt(S, q, 0.022)); // (the racer back's band over the sacrum, between the crests)
    },
    chest(S, C) { // the plunge: from the gorget down between the plates to the ribs' top
      const pts = [0, 1, 2, 3, 4, 5].map((i) => C.on(0, C.top - 0.2 - i * 0.22, 1.05)); gilt(S, [C.choker.toArray(), ...pts.slice(1)], 0.026);
    },
    bust(S, B) { plateRim(S, B); const s = B.s; strap(S, B, B.rim(s > 0 ? PI - 0.9 : 0.9), B.choker, 0.028); S.g.ball(0.06, { at: B.local(B.choker).toArray(), c: L.gold }, 12, 8); },
  },
  coins: { label: 'coin belt',
    pelvis(S, P) {
      const belt = beltLine(), dip = (p) => belt(p) - 0.32 * Math.max(0, 1 - p / 0.55) ** 2; // (dipping to a point under the navel)
      const top = both(P, path(0, PI, dip, 36), (q) => gilt(S, q, 0.03));
      both(P, path(0, PI, (p) => dip(p) - 0.075, 36), (q) => gilt(S, q, 0.022));
      const fringe = onPelvis(P, path(0.05, PI - 0.05, (p) => dip(p) - 0.15, 22));
      for (const q of fringe) for (const s of [1, -1]) coin(S, [s * q[0], q[1], q[2]], outOf([s * q[0], q[1], q[2]]), 0.055);
      const m = top[0]; if (m) { S.g.ball(0.09, { at: [0, m[1] - 0.06, m[2] + 0.02], sc: [1, 1, 0.45], c: L.gold }, 14, 10); }
    },
    bust(S, B) {
      const [a, b, along] = underwire(S, B, 0.032); for (const end of [a, b]) strap(S, B, end, B.choker, 0.026);
      for (let i = 1; i < 9; i++) { const q = along(i / 9), n = [q[0], q[1], 0.6]; coin(S, [q[0] * 1.02, q[1] * 1.02 - 0.05, q[2] + 0.02], n, 0.045); }
    },
  },
  cords: { label: 'cord net',
    pelvis(S, P) {
      const belt = beltLine(-0.05, 0.4, 0.2), leg = legLine(0.3, -0.8, -1.0), N = 9, lo = 0.12, hi = 1.95;
      both(P, path(0, PI, belt, 36), (q) => trim(S, q, 0.024, L.trimD));
      both(P, path(0.1, 3.05, leg, 40), (q) => trim(S, q, 0.024, L.trimD));
      const yAt = (p, v) => leg(p) + (belt(p) - leg(p)) * v;
      for (let i = 0; i <= N; i++) for (const dir of [1, -1]) { // (the net's diagonals between the belt and the leg line)
        const p0 = lo + ((hi - lo) * i) / N, pts = Array.from({ length: 9 }, (_, k) => { const v = k / 8; return [p0 + dir * v * ((hi - lo) / N) * 2, yAt(p0 + dir * v * ((hi - lo) / N) * 2, v)]; });
        both(P, pts.filter(([p]) => p >= lo - 0.05 && p <= hi + 0.05), (q) => trim(S, q, 0.014, L.trimM));
      }
      const D = (hi - lo) / N, knots = []; // (a gold knot where two cords cross, and where each meets the belt and the leg line)
      for (let i = 0; i <= N; i++) { knots.push([lo + i * D, yAt(lo + i * D, 0)], [lo + i * D, yAt(lo + i * D, 1)]); if (i < N) knots.push([lo + (i + 0.5) * D, yAt(lo + (i + 0.5) * D, 0.25)]); }
      for (const q of onPelvis(P, knots)) for (const s of [1, -1]) S.g.ball(0.03, { at: [s * q[0], q[1], q[2]], c: L.gold }, 8, 6);
    },
    bust(S, B) {
      trim(S, Array.from({ length: 41 }, (_, i) => B.rim((i / 40) * PI * 2)), 0.026, L.trimD, 64);
      const s = B.s, top = B.rim(PI / 2), foot = B.rim(-PI / 2); // (two cords crossed over the tank, knotted in gold at the middle)
      for (const [a, b] of [[B.rim(PI / 2 + s * 0.7), B.rim(-PI / 2 - s * 0.7)], [B.rim(PI / 2 - s * 0.7), B.rim(-PI / 2 + s * 0.7)]]) {
        const pts = [0, 0.25, 0.5, 0.75, 1].map((k) => { const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, rr = Math.hypot(x, y); return [x, y, B.z0 + Math.sqrt(Math.max(0, B.r * B.r - rr * rr)) + 0.012]; });
        trim(S, pts, 0.014, L.trimM, 20);
      }
      S.g.ball(0.035, { at: [0, 0, B.z0 + B.r + 0.015], c: L.gold }, 10, 8);
      strap(S, B, top, B.choker, 0.02, 0.12, L.trimD); void foot;
    },
  },
  nouveau: { label: 'nouveau scrolls',
    pelvis(S, P) {
      // the whiplash: from the crest's top down over the hip's front, curling in on the belly
      const whip = [...path(1.5, 0.75, (p) => 0.42 - 0.75 * smooth((1.5 - p) / 0.75) + 0.08 * Math.sin((1.5 - p) * 6), 18), ...spiral(0.5, -0.38, 0.22, 0.04, 1.1, 0.4, 1.1, 22).slice(1)];
      both(P, whip, (q) => gilt(S, q, 0.024));
      both(P, spiral(2.42, -0.55, 0.42, 0.05, 1.35, PI / 2, 1.0, 40), (q) => gilt(S, q, 0.022)); // (a spiral round each cheek)
      both(P, path(1.55, PI, (p) => 0.36 - 0.28 * smooth((p - 1.55) / 1.6), 20), (q) => gilt(S, q, 0.02)); // (from the crest round to the sacrum)
      const sac = onPelvis(P, [[PI, 0.06]])[0]; if (sac) { S.g.ball(0.1, { at: sac, sc: [1, 1.25, 0.4], c: L.gold }, 16, 10); S.trim.ring(0.13, 0.016, { at: sac, rot: [PI / 2, 0, 0], c: L.trimL }, 28, 5); }
    },
    chest(S, C) { const m = C.on(0, C.top - 0.62, 1.06); S.g.ball(0.09, { at: m, sc: [1, 1.2, 0.45], c: L.gold }, 14, 10); },
    bust(S, B) {
      plateRim(S, B, 0.026); const s = B.s, o = s > 0 ? 0 : PI;
      const c0 = B.rim(o + s * 0.6, 1.16), curl = Array.from({ length: 21 }, (_, i) => { const t = i / 20, a = o + s * (0.6 + PI + t * 4.2); return [c0[0] + Math.cos(a) * 0.15 * (1 - 0.8 * t), c0[1] + Math.sin(a) * 0.15 * (1 - 0.8 * t), c0[2]]; }); // (a curl out of the rim's outer top)
      gilt(S, curl, 0.022, 40);
      strap(S, B, B.rim(s > 0 ? PI - 1.0 : 1.0), B.choker, 0.024); S.g.ball(0.08, { at: B.local(B.choker).toArray(), sc: [1, 1.3, 0.5], c: L.gold }, 12, 8);
    },
  },
  garters: { label: 'sash and garters',
    pelvis(S, P) {
      // the sash: across from the left crest's top to the right hip's front, three trim lines read as one band, a gold knot at its end
      const sash = (dy) => path(-1.6, 1.0, (p) => 0.42 - 0.95 * smooth((p + 1.6) / 2.6) + dy, 30);
      for (const dy of [-0.05, 0, 0.05]) trim(S, onPelvis(P, sash(dy)), 0.022, L.trimL);
      const end = onPelvis(P, [[1.0, -0.53]])[0]; if (end) { S.g.ball(0.07, { at: end, c: L.gold }, 12, 8); for (const k of [-1, 1]) S.g.ball(0.05, { at: [end[0] + 0.07, end[1] - 0.1, end[2] + k * 0.08], sc: [0.6, 1.6, 0.6], c: L.gold }, 8, 6); }
      both(P, path(0.1, 3.05, legLine(0.1, -0.82, -1.04), 36), (q) => trim(S, q, 0.016)); // (a plain bikini line under it)
    },
    thigh(S, T) { // a band and a gold clasp round the thigh a third of the way down
      const y = -0.3 * T.len, r = T.rAt(y) + 0.012; S.trim.ring(r, 0.028, { at: [0, y, 0], c: L.trimM }, 48, 6); S.trim.ring(r + 0.01, 0.012, { at: [0, y + 0.06, 0], c: L.trimL }, 48, 4);
      S.g.ball(0.06, { at: [0, y, r + 0.02], sc: [1, 1.3, 0.5], c: L.gold }, 12, 8);
    },
    bust(S, B) { plateRim(S, B); const s = B.s; strap(S, B, B.rim(PI / 2 + s * 0.6), B.shoulder, 0.028); },
  },
};
Object.assign(HARNESSES, MORE_HARNESSES); // (the second sets: femharness2.js)
export const HARNESS_IDS = Object.keys(HARNESSES);
export const harnessOf = (F) => HARNESSES[F?.harness] || HARNESSES.halter;
