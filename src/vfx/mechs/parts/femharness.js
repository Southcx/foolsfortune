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
//   P { f, at(q), surf (femlegs.js surfAt), open(q) (true where a point is in the hip ball's opening) }
//   C { on(phi, y, k), top, choker (Vector3), shoulder [x, y] }   B { s, r, z0, rim(a, k), local(v), choker }   T { s, len, rAt(y) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, tube } from './kit.js';

const PI = Math.PI;
const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
/** A gold line along points (a fine tube in the gold piece). */
const gilt = (S, pts, r = 0.024, n = 0) => { if (pts.length > 2) tube(S.g, pts, r, L.gold, n || pts.length * 3); };
/** A trim line along points (the trim piece's bead). */
const trim = (S, pts, r = 0.018, c = L.trimM, n = 0) => { if (pts.length > 2) tube(S.trim, pts, r, c, n || pts.length * 3); };

/** Points on the pelvis's surface along a path [[phi, y], ...] (phi round the pelvis's axis from the front, + toward +X), each a ray
 *  from the axis at that height; a sample dropped where it falls into the hip ball's opening or jumps off its neighbours (a crease, a
 *  cleft), so a line never dives. `lift` pushes it a hair off the surface. */
function onPelvis(P, path, lift = 0.006) {
  const raw = path.map(([phi, y]) => { const d = [Math.sin(phi), 0, Math.cos(phi)], q = P.surf(P.f, [0, y, 0], d); return q && !P.open(q) ? [q[0] + d[0] * lift, q[1], q[2] + d[2] * lift] : null; });
  const r = raw.map((q) => (q ? Math.hypot(q[0], q[2]) : null)), out = [];
  for (let i = 0; i < raw.length; i++) {
    if (!raw[i]) continue;
    const near = [r[i - 1], r[i + 1]].filter((v) => v != null), m = near.length ? near.reduce((a, b) => a + b, 0) / near.length : r[i];
    if (Math.abs(r[i] - m) < 0.18) out.push(P.at(raw[i]));
  }
  return out;
}
/** A path [[phi, y]] sampled along phi from a to b by y(phi). */
const path = (a, b, y, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const p = a + ((b - a) * i) / n; return [p, y(p)]; });
const mirror = (pts) => pts.map(([x, y, z]) => [-x, y, z]);
/** A line laid on both sides of the pelvis (the +X half's path, mirrored). */
const both = (P, pth, draw) => { const q = onPelvis(P, pth); draw(q); draw(mirror(q)); return q; };

/** The high-cut leg line: from the crotch's front up over the crest (`top` at phi 1.45) and down under the cheek behind. */
const legLine = (top = 0.42, front = -0.78, back = -1.02) => (phi) => phi < 1.45
  ? front + (top - front) * Math.sin((PI / 2) * smooth((phi - 0.1) / 1.35)) ** 1.3
  : back + (top - back) * Math.cos((PI / 2) * smooth((phi - 1.45) / 1.6)) ** 1.15;
/** A slung belt's line: low at the front, over the crest at the side, at the sacrum behind. */
const beltLine = (front = -0.12, side = 0.34, back = 0.12) => (phi) => phi < 1.6 ? front + (side - front) * Math.sin((PI / 2) * (phi / 1.6)) ** 1.5 : back + (side - back) * Math.cos((PI / 2) * ((phi - 1.6) / (PI - 1.6)));

/** The plates' gold rims (the bezel's ring round the tank: B.rim), whole. */
const plateRim = (S, B, r = 0.03) => gilt(S, Array.from({ length: 41 }, (_, i) => B.rim((i / 40) * PI * 2)), r, 64);
/** A line from a point on a plate's rim to a point in the chest's frame (the gorget's, a shoulder's), lifted over the chest on its way. */
const strap = (S, B, from, to, r = 0.03, lift = 0.12, c = null) => {
  const C = B.local(to), pts = [0, 0.35, 0.7, 1].map((k) => { const m = new THREE.Vector3(...from).lerp(C, k); m.z += lift * Math.sin(PI * k); return m.toArray(); });
  if (c == null) gilt(S, pts, r, 16); else trim(S, pts, r, c, 16);
};
/** A plate's underwire from its outer top round its foot to its inner top (the halter's), its two ends returned. */
function underwire(S, B, r = 0.035) {
  const s = B.s, out = s > 0 ? 0 : PI, inA = s > 0 ? PI : 0, a0 = out + (s > 0 ? 0.95 : -0.95), a1 = inA + (s > 0 ? -1.15 : 1.15);
  const sweep = (s > 0 ? -1 : 1) * (2 * PI - Math.abs(a1 - a0)), wire = [];
  for (let i = 0; i <= 24; i++) wire.push(B.rim(a0 + sweep * (i / 24)));
  gilt(S, wire, r, 40); return [wire[0], wire[wire.length - 1], (a) => B.rim(a0 + sweep * a)];
}
/** A small gold coin standing on a surface at q facing out along n (a flat disc). */
const _qa = new THREE.Quaternion(), _ea = new THREE.Euler(), _up = new THREE.Vector3(0, 1, 0), _nv = new THREE.Vector3();
const coin = (S, q, n, r = 0.05) => { _qa.setFromUnitVectors(_up, _nv.set(...n).normalize()); _ea.setFromQuaternion(_qa); S.g.cyl(r, r, 0.014, { at: q, rot: [_ea.x, _ea.y, _ea.z], c: L.gold }, 10); };
/** The outward normal of the pelvis's surface at its point q (the ray's own direction, near enough for a coin). */
const outOf = (q) => { const l = Math.hypot(q[0], q[2]) || 1; return [q[0] / l, -0.25, q[2] / l]; };
/** A spiral in (phi, y) round a centre, from radius r0 in to r1 over `turns`. */
const spiral = (pc, yc, r0, r1, turns, a0 = 0, kphi = 1, n = 30) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = a0 + t * turns * PI * 2, r = r0 + (r1 - r0) * t; return [pc + Math.cos(a) * r * kphi, yc + Math.sin(a) * r]; });

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
export const HARNESS_IDS = Object.keys(HARNESSES);
export const harnessOf = (F) => HARNESSES[F?.harness] || HARNESSES.halter;
