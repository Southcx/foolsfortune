// ---------------------------------------------------------------------------------------
// A MECH'S CORES (the part library: progress/mechs/parts.js slot `core`): the chest each frame is built round, and the cradle every
// core carries in its back. A chest is sculpted, never a box: one lathed profile (the ribcage swelling out of a narrow waist to a
// broad shoulder line) pressed into its plan (`planOf`: an oval wider than deep, a keel ridge down the front so the plan comes to a
// heater shield's point, two pectoral swells that curve back into the flanks, the back flatter), then cut into curved porcelain
// panels over the interstitial's barrel inside it, so the gaps between the panels are real grooves with the core lit in them. Its
// sockets (the neck's cup, the shoulders' cups facing out) are ivory, so any head and any arms seat in any core. The back's panels
// close round the cradle's boss: a narrow window cut only where the boss stands, its trim flange laid over the cut.
//   clayCore   heroic: broad shoulders; the front one sculpted cuirass (parts/sdf.js, South, 2026-11-02: the chest a focal point):
//              two pectoral masses undercut at their foot, a sternal valley between them, the costal arch running down from the
//              sternum's foot as a groove round the abdomen's plastron (two rectus masses, the linea alba and its tendinous lines),
//              serratus ribs on the flanks; the plastron's foot arched over the waist ball; a flank and a shoulder blade a side and
//              the abdomen's three bands round the sides and back as plates; a kintsugi crack across the left pectoral. Its base is
//              analytic (an elliptic section through the chest's own profile, as splines), the forms few and strong
// THE DANTIAN (South, 2026-11-02: "Think of the waist joint like the dantian. Its a target point!"): the hero's waist ball a little
// larger than the rest, its heart the glow (lit while sealed, seen through the clear shell), crossed by a gold equator and meridian
// like a reticle, sitting in the pelvis's socket (its lip a gold ring) under the plastron's arch, seen whole from the front.
//   kilnCore   fired twice: deeper and rounder (a bottle kiln's shoulders), banded in trim, its firing holes bricked open on the core
//   lightCore  bisque thin: slim, its flanks cut to narrow ribs over the lit core, a sternum plate and hoops
// The feminine forms' cores are their own (femcores.js, by the same `coreLook`).
// THE CRADLE (South, 2026-11-02, via the coordinator: Evangelion's entry plug): in the back, between the shoulder blades, a well
// tilted back 20 degrees from upright, at the Pneuka Jar's own size (vfx/pneukajar/shape.js JAR_ANATOMY: the Jar 1.2 m, its foot
// 0.257 round), so the Jar goes in base first and screws down until its shoulder line (0.82 up it) is flush with the lip, the head
// and face left showing. A screw thread cut round the inside at a pitch of two full turns over that depth, a gold collar on the lip,
// an octagonal boss round it (the cradle's look's octagon and four bronze tines, vfx/cradlelook.js), the well's floor lit while sealed.
// Prior art: Medabots' tinpet (the frame the parts hang on, the Medal in its back: the Jar is the Medal); Evangelion's entry plug;
// the Milanese cuirass and the muscle cuirass (the keel and the pectorals); Kunio Okawara's and Hajime Katoki's chest blocks read as
// sculpted volumes; the bottle kilns of Stoke-on-Trent (the kiln core); bisque ware's openwork (the light core); Elemental
// Gundam's panel lines.
//
//   coreLook(id, F) -> { mounts: { neck [y, z], shoulder [x, y], back [y, z], gen [y, z], boost [y, z, x], plug [y, z], cradleZ }, chest(S), waist(S) }
//   CORE_LOOKS[id] (the cores' numbers)   cradle(S) (the boss, the thread, the floor's glow)   cradleParts(mats) -> { collar, tines, bore }
//   CRADLE (the well's sizes: r, depth, turns, pitch, tilt, at [y, z] on the chest)   DANTIAN (the hero's waist ball: r)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { JAR_ANATOMY } from '../../pneukajar/shape.js';
import { MECH_LOOK as L, FORMS, band, profAt, panel, cup, seam, ball, threadGeometry, shell, sculpt } from './kit.js';
import { blend, carve, meet, ellipsoid } from './sdf.js';
import { sideSculpt, aoTone, onto } from './arms.js';
import { femCoreLook } from './femcores.js';

const PI = Math.PI;
/** The well: its radius (the Jar's foot and a hand's width of room), its depth (to the Jar's shoulder line), two turns, its tilt back,
 *  and where its floor sits on the chest (the seat: 1.8 over the chest's base, so 3 m over the hip). */
export const CRADLE = { r: JAR_ANATOMY.footR + 0.035, depth: JAR_ANATOMY.shoulderY, turns: 2, tilt: 0.35, at: [L.cradleY, -1.02], boss: 0.52 };
CRADLE.pitch = CRADLE.depth / CRADLE.turns;
const WIN = [1.32, 2.82]; // (the back's window round the boss, in the chest's height)
const G = 0.035; // (a groove's half-width in phi)
const bump = (y, a, b) => (y <= a || y >= b ? 0 : Math.sin((PI * (y - a)) / (b - a)));
/** The hero's waist ball, the dantian: a little larger than the shoulders' (0.62). */
export const DANTIAN = { r: 0.64 };

/** A Catmull-Rom through [[v, y], ...] read at y (a profile made smooth: no shelf at a knot). */
function spline(pts) {
  return (y) => {
    const n = pts.length; if (y <= pts[0][1]) return pts[0][0]; if (y >= pts[n - 1][1]) return pts[n - 1][0];
    let i = 1; while (pts[i][1] < y) i++;
    const p0 = pts[Math.max(0, i - 2)][0], p1 = pts[i - 1][0], p2 = pts[i][0], p3 = pts[Math.min(n - 1, i + 1)][0], t = (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1]);
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
}

/** The clay core's cuirass: the chest's front (phi within +-PH) sculpted as one plate. Its base is analytic and calm (an elliptic
 *  section whose half width and depth run as splines through the chest's own profile, its plan's keel and swells added, so it meets the
 *  flanks' panels and covers the core), with a few strong forms blended on: the two pectoral masses, the plastron's two rectus masses; the sternal valley carved
 *  between the pectorals; the costal arch and the lines cut as clean grooves; its foot arched over the dantian. */
const PH = 1.0;
function cuirassField(P, W, top, C, F) {
  const wk = C.w * F.chest[0] * 1.03, dk = C.d * F.chest[2] * 1.03, r = spline(P);
  const A = (y) => r(y) * wk, B = (y) => r(y) * dk + 0.03; // (the half width and the front's depth)
  const ARCH = [0, 1.0, 0.86, 0.95], archE = (x, y) => Math.hypot(x / ARCH[2], (y - ARCH[1]) / ARCH[3]); // (the costal arch: 1 on it)
  // the plan's own keel and pectoral swells, read analytically at the front (so the plate stays over the core's barrel there)
  const lift = (x, y) => { const a = A(y), u = Math.min(1, Math.abs(x) / a), f = Math.sqrt(1 - u * u); return r(y) * dk * (C.keel * bump(y, 0.5, 3.0) * f ** 4 + C.pec * bump(y, 1.75, 3.15) * f * Math.exp(-((u - 0.5) ** 2) / 0.06)); };
  const base = (x, y, z) => { const a = A(y), b = B(y); return (Math.hypot(x / a, (z > 0 ? z - lift(x, y) : z) / b) - 1) * Math.min(a, b) * 0.95; };
  const pz = (x, y, k) => B(y) * Math.sqrt(Math.max(0, 1 - (x / A(y)) ** 2)) + lift(x, y) - k; // (a point k under the base's front at x, y)
  const forms = [
    ellipsoid([0.7, 2.42, pz(0.7, 2.42, 0.3)], [0.62, 0.48, 0.4]), ellipsoid([-0.7, 2.42, pz(0.7, 2.42, 0.3)], [0.62, 0.48, 0.4]), // (the pectorals)
    ellipsoid([0.26, 0.92, pz(0.26, 0.92, 0.12)], [0.22, 0.62, 0.18]), ellipsoid([-0.26, 0.92, pz(0.26, 0.92, 0.12)], [0.22, 0.62, 0.18]), // (the rectus masses)
  ];
  let solid = blend(0.22, base, forms[0], forms[1]);
  solid = blend(0.14, solid, forms[2], forms[3]);
  solid = carve(0.14, solid, ellipsoid([0, 2.5, pz(0, 2.5, -0.25)], [0.14, 0.6, 0.31])); // (the sternal valley, cut into the keel)
  const near = (x, y, z) => { const d = base(x, y, z); return d > 0.5 || d < -0.7 ? d : solid(x, y, z); }; // (far off: the base alone)
  const phiOf = (x, z) => Math.atan2(x / wk, Math.max(z, -1) / dk);
  let plateF = meet(0.04, (x, y, z) => { const d = near(x, y, z); return Math.max(d, -(d + 0.2)); },
    (x, y, z) => Math.max((Math.abs(phiOf(x, z)) - PH - G * 0.9) * A(y) * 0.8, y - (top - 0.08), 0.06 - y, -z));
  plateF = carve(0.06, plateF, ellipsoid([0, -0.12, 1.4], [0.5, 0.5, 1.4])); // (the plastron's arch over the dantian)
  // the lines: the costal arch round the plastron, the linea alba and its tendinous lines inside it, the abdomen's bands outside it
  const lines = (x, y, z) => {
    let d = plateF(x, y, z); if (d > 0.06) return d;
    const e = archE(x, y), inArch = e < 1 && y > 0.05, cuts = [];
    if (y > 0.05) cuts.push(Math.abs(e - 1) * ARCH[2] - 0.02); // (the costal arch)
    if (inArch) { cuts.push(Math.abs(x) - 0.016); if (y < 1.75) cuts.push(Math.abs(y - 0.66) - 0.015, Math.abs(y - 1.18) - 0.015); }
    else if (y < 1.05) cuts.push(Math.abs(y - 0.37) - 0.018, Math.abs(y - 0.71) - 0.018, Math.abs(y - 1.02) - 0.018);
    for (const c of cuts) d = Math.max(d, -Math.max(c, -d - 0.03));
    return d;
  };
  let X = 0; for (let y = 0; y <= top; y += 0.1) X = Math.max(X, A(y) * Math.sin(PH + 0.15) + 0.1);
  let Z = 0; for (let y = 0; y <= top; y += 0.1) Z = Math.max(Z, B(y) + lift(0, y) + 0.35);
  return { f: lines, solid: near, bounds: [[-X, 0.02, 0.0], [X, top, Z]] };
}

/** The cores' numbers: the profile [[r, y], ...], the plan (w across, d ahead, back behind, the keel's and the pectorals' swell), the
 *  shoulder's height, the waist's colour. */
export const CORE_LOOKS = {
  clayCore: { prof: [[0.82, 0], [0.92, 0.5], [1.3, 1.05], [1.74, 1.75], [1.96, 2.35], [1.86, 2.85], [1.36, 3.2], [0.5, 3.36]], w: 1.28, d: 0.6, back: 0.5, keel: 0.32, pec: 0.16, shoulderY: 2.45, cup: 0.6 },
  kilnCore: { prof: [[1.0, 0], [1.16, 0.45], [1.6, 1.0], [1.98, 1.7], [2.1, 2.3], [1.98, 2.8], [1.5, 3.2], [0.6, 3.42]], w: 1.24, d: 0.68, back: 0.55, keel: 0.16, pec: 0.08, shoulderY: 2.4, cup: 0.66 },
  lightCore: { prof: [[0.7, 0], [0.8, 0.5], [1.1, 1.1], [1.48, 1.8], [1.64, 2.35], [1.52, 2.8], [1.08, 3.06], [0.42, 3.2]], w: 1.3, d: 0.62, back: 0.52, keel: 0.24, pec: 0.1, shoulderY: 2.4, cup: 0.52 },
};

/** The chest's plan as a vertex function (a lathe's x, y, z to the sculpted chest's). */
function planOf(C, F) {
  const w = C.w * F.chest[0], d = C.d * F.chest[2], bk = C.back * F.chest[2];
  const keel = (y) => C.keel * bump(y, 0.5, 3.0), pec = (y) => C.pec * bump(y, 1.75, 3.15);
  const sig = 0.06, at = 0.5;
  return (x, y, z) => {
    const r = Math.hypot(x, z); if (r < 1e-5) return [x, y, z];
    const c = z / r, sx = Math.abs(x) / r, f = Math.max(0, c);
    let zz = z > 0 ? z * d : z * bk;
    zz += r * d * (keel(y) * f ** 4 + pec(y) * f * Math.exp(-((sx - at) ** 2) / sig));
    return [x * w * (1 - 0.06 * f * bump(y, 0.9, 2.2)), y, zz];
  };
}

/** A core made for a form: its mounts read off its own sculpted surface, its chest and waist builders (a feminine form's: femcores.js). */
export function coreLook(id, F = FORMS.hero) {
  if (F.fem) return femCoreLook(id, F);
  const C = CORE_LOOKS[id] || CORE_LOOKS.clayCore, P = C.prof, W = planOf(C, F);
  const top = P[P.length - 1][1], depth = (y) => profAt(P, y) * C.back * F.chest[2], wide = (y) => profAt(P, y) * C.w * F.chest[0];
  const gap = Math.asin(Math.min(0.9, 0.5 / (profAt(P, 2.1) * C.w * F.chest[0])));
  const mounts = {
    neck: [top - 0.06, 0.1], shoulder: [wide(C.shoulderY) * 0.97 + 0.06, C.shoulderY], back: [1.05, -(depth(1.05) + 0.5)], gen: [0.62, -(depth(0.62) + 0.55)],
    boost: [0.32, -(depth(0.32) + 0.55), Math.max(0.6, wide(0.32) * 0.75)], plug: [0.4, -(depth(0.4) + 0.65)], cradleZ: -depth(L.cradleY) + 0.06,
  };
  /** A point on the chest's surface at phi, height y, k out. */
  const on = (phi, y, k = 1.04) => { const r = profAt(P, y) * k; return W(Math.sin(phi) * r, y, Math.cos(phi) * r); };
  /** Panels: [y0, y1, a0, a1, tone, k], mirrored when a0 > 0; the back's spine strip cut round the window. */
  const panels = (S, list, piece = S.p) => {
    for (const [y0, y1, a0, a1, c, k = 1.03] of list) {
      const one = (b0, b1) => piece.geo(sculpt(panel(band(P, y0, y1, k, 10), b0, b1, 14), W), { c });
      one(a0, a1); if (a0 > 0) one(-a1, -a0);
    }
  };
  const inner = (S) => S.core.geo(sculpt(shell(band(P, P[0][1], top, 0.95, 16), 32), W), { c: L.core });
  /** The back from phi a to the spine: a blade either side of the window, the spine's strips above and below it. */
  const backPlates = (S, y0, y1, a, c = L.mid) => panels(S, [[y0, y1, a, PI - gap - G, c], [y0, WIN[0], PI - gap - G, PI - G, c], [WIN[1], y1, PI - gap - G, PI - G, c]]);
  const sockets = (S) => {
    S.p.geo(cup(0.4 * F.joint).rotateX(PI), { at: [0, mounts.neck[0], mounts.neck[1]], c: L.ivory });
    for (const s of [-1, 1]) S.p.geo(cup(C.cup * F.joint).rotateZ(s * PI / 2), { at: [s * mounts.shoulder[0], mounts.shoulder[1], 0], c: L.ivory });
  };
  const gorget = (S, y, c = L.trimM) => S.trim.geo(sculpt(shell([[0.36, y], [profAt(P, y) * 0.9, y + 0.01], [profAt(P, y) * 0.96, y + 0.14], [0.5, y + 0.26]], 28), W), { c });
  const hoop = (S, y, h, k = 1.06, c = L.trimM, piece = S.trim) => piece.geo(sculpt(shell(band(P, y - h, y + h, k, 2), 36), W), { c });
  const build = {
    clayCore(S) {
      inner(S);
      if (!F.fem && F.id === 'hero') {
        const Cu = cuirassField(P, W, top, C, F);
        sideSculpt(S.p, Cu.f, Cu.bounds, 0.06, { key: `core.cuirass|${id}|${F.chest.join(',')}`, tone: aoTone(Cu.f, L.pale, L.mid, 0.06) });
        panels(S, [[1.05, top - 0.2, PH + 2 * G, 1.95, L.mid], // (the flanks)
          [0.06, 0.34, PH + 2 * G, PI - 0.2, L.dark, 1.05], [0.4, 0.68, PH + 2 * G, PI - 0.2, L.mid, 1.05], [0.74, 0.99, PH + 2 * G, PI - 0.2, L.pale, 1.05]]); // (the abdomen's bands round the sides)
        panels(S, [[1.82, 1.9, PH + 2 * G, PI - G, L.trimD, 1.05]], S.trim); // (the trim rim under the pectorals, round the sides and back)
        backPlates(S, 1.05, top - 0.25, 1.95 + 2 * G);
        seam(S.g, [on(0.12, 3.0), on(0.32, 2.75), on(0.42, 2.4), on(0.7, 2.15), on(0.82, 1.95)].map((p) => onto(Cu.solid, p, 0.015)));
        gorget(S, top - 0.1); sockets(S);
        return;
      }
      panels(S, [[1.9, top - 0.08, G, 1.0, L.pale], [1.05, 1.82, G, 1.0, L.mid], [1.05, top - 0.2, 1.0 + 2 * G, 1.95, L.mid], // (pectorals, the ribs under them, the flanks)
        [0.06, 0.34, G, PI - 0.2, L.dark, 1.05], [0.4, 0.68, G, PI - 0.2, L.mid, 1.05], [0.74, 0.99, G, PI - 0.2, L.pale, 1.05]]); // (the abdomen's three bands)
      backPlates(S, 1.05, top - 0.25, 1.95 + 2 * G);
      hoop(S, 1.86, 0.035, 1.05, L.trimD); // (a trim rim under the pectorals)
      S.trim.geo(sculpt(panel(band(P, 0.9, top - 0.1, 1.07, 12), -0.05, 0.05, 6), W), { c: L.trimL }); // (the keel's ridge)
      seam(S.g, [on(0.12, 3.0), on(0.32, 2.75), on(0.42, 2.4), on(0.7, 2.15), on(0.82, 1.95)]);
      gorget(S, top - 0.1); sockets(S);
    },
    kilnCore(S) {
      inner(S);
      panels(S, [[1.05, 2.0, G, 1.15, L.mid], [2.1, top - 0.1, G, 1.15, L.mid], [1.05, top - 0.2, 1.15 + 2 * G, 2.0, L.dark], [0.06, 0.95, G, PI - 0.2, L.dark, 1.05]]);
      backPlates(S, 1.05, top - 0.25, 2.0 + 2 * G, L.dark);
      for (const y of [1.0, 2.05, 3.0]) hoop(S, y, 0.055, 1.07, y === 2.05 ? L.trimL : L.trimD);
      for (let k = 0; k < 4; k++) { const a = -0.5 + k / 3; S.core.box(0.26, 0.4, 0.3, { at: on(a, 1.5, 1.0), rot: [0, a, 0], c: L.coreD }, 0.06); }
      gorget(S, top - 0.1, L.trimD); sockets(S);
      seam(S.g, [on(-0.2, 3.0), on(-0.4, 2.6), on(-0.32, 2.25), on(-0.5, 1.85)]);
    },
    lightCore(S) {
      inner(S);
      const ribs = 7, r0 = 0.06;
      for (let i = 0; i < ribs; i++) { const a = r0 + (i / ribs) * (PI - gap - 0.1 - r0); panels(S, [[1.0, 3.0, a, a + 0.12, L.mid]]); } // (the ribs)
      for (const [y, c] of [[1.05, L.trimL], [2.0, L.trimM], [2.9, L.trimL], [0.5, L.trimM]]) hoop(S, y, 0.07, 1.06, c);
      panels(S, [[1.6, 2.7, -0.42, 0.42, L.pale, 1.07]]); // (the sternum's one plate)
      panels(S, [[1.0, WIN[0], PI - gap - G, PI - G, L.mid], [WIN[1], top - 0.15, PI - gap - G, PI - G, L.mid]]);
      gorget(S, top - 0.08, L.trimL); sockets(S);
      seam(S.g, [on(0, 1.65, 1.09), on(0, 2.65, 1.09)], 0.03);
    },
  };
  const tone = id === 'kilnCore' ? L.dark : id === 'lightCore' ? L.mid : L.pale, k = 1;
  return {
    mounts, prof: P, plan: W,
    chest: build[id] || build.clayCore,
    waist(S) {
      if (F.id === 'hero') { dantian(S); return; }
      ball(S.g, 0.5 * F.joint);
      S.core.cyl(0.5 * k, 0.56 * k, L.chestBase + 0.2, { at: [0, L.chestBase / 2, 0], c: L.core }, 20);
      for (let i = 0; i < 2; i++) (i ? S.trim : S.p).lathe([[0.66, 0], [0.76, 0.05], [0.76, 0.2], [0.66, 0.25]], { at: [0, 0.12 + i * 0.3, 0], sc: [k, 1, 0.85 * k], c: i ? L.trimM : tone }, 28);
    },
  };
}

/** The hero's waist: the dantian (a glass ball, its Lachryma standing round a heart that glows while sealed, a gold equator and
 *  meridian crossing at its front as a reticle), the column up into the chest and a trim collar where it meets the ball's crown; the
 *  pelvis's socket below is its lip (legs.js), the plastron's arch above. */
function dantian(S) {
  const r = DANTIAN.r;
  S.j.ball(r, { c: 0xffffff }, 32, 22);
  S.e.ball(r * 0.3, { c: 0xffffff }, 18, 12); S.e.ring(r * 0.42, 0.018, { rot: [PI / 2, 0, 0], at: [0, 0, r * 0.62], c: 0xffffff }, 32, 4); // (the heart lit, a ring before it)
  S.g.ring(r * 1.006, r * 0.06, { c: L.gold }, 40, 5); S.g.ring(r * 1.006, r * 0.045, { rot: [0, 0, PI / 2], c: L.gold }, 40, 5); // (the equator and the meridian)
  for (const a of [0, PI / 2, PI, PI * 1.5]) S.g.ball(0.035, { at: [Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, Math.sqrt(r * r * 1.02 - r * r * 0.25)], c: L.gold }, 8, 6); // (the reticle's studs)
  S.core.cyl(0.46, 0.5, 0.42, { at: [0, 0.82, 0], c: L.core }, 20); // (the column up into the chest, clear of the heart)
  S.trim.lathe([[0.44, 0.6], [0.58, 0.64], [0.6, 0.72], [0.5, 0.78]], { c: L.trimM }, 32); // (a collar where the column meets the ball's crown)
}

/** The cradle's porcelain and glow, in the well's frame (its floor at the origin, +Y up the well's axis out of the back): the
 *  octagonal boss, the thread cut round the inside, the floor's ring lit while sealed. */
export function cradle(S) {
  const { p, g, e } = S, R = CRADLE.r, D = CRADLE.depth, B = CRADLE.boss;
  p.geo(shell([[R, D], [B - 0.04, D], [B, D - 0.05], [B + 0.03, D - 0.2], [B + 0.06, -0.3]], 8, PI / 8), { c: L.pale }); // (the boss, an octagon)
  S.core.geo(shell([[B + 0.07, D - 0.26], [B + 0.08, D - 0.34]], 8, PI / 8), { c: L.core }); // (a groove round it)
  S.trim.geo(shell([[B + 0.04, 0.16], [B + 0.3, 0.02], [B + 0.42, -0.1], [B + 0.44, -0.22], [B + 0.05, -0.34]], 8, PI / 8), { c: L.trimM }); // (the flange the back's plates close on)
  g.geo(shell([[B + 0.43, -0.08], [B + 0.46, -0.13], [B + 0.43, -0.18]], 8, PI / 8), { c: L.gold });
  g.geo(threadGeometry(R - 0.03, CRADLE.turns, CRADLE.pitch, 0.03).rotateX(-PI / 2), { at: [0, D - 0.02, 0], c: L.gold });
  e.ring(R * 0.7, 0.03, { at: [0, 0.01, 0], c: 0xffffff }, 32, 4);
}
/** The cradle's own meshes: its gold collar on the lip and its four tines (each its own mesh, for the runtime's cinematic), the bore
 *  (the dark of the well seen from inside: its own program, drawn on its back faces). */
export function cradleParts(mats) {
  const R = CRADLE.r, D = CRADLE.depth;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.05, 8, 40).rotateX(PI / 2).translate(0, D + 0.01, 0), mats.g);
  const tg = [];
  for (let k = 0; k < 4; k++) {
    const a = PI / 4 + (k / 4) * PI * 2, c = Math.cos(a), s = Math.sin(a);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * (R + 0.12), D - 0.05, c * (R + 0.12)), new THREE.Vector3(s * (R + 0.16), D + 0.3, c * (R + 0.16)), new THREE.Vector3(s * (R - 0.02), D + 0.38, c * (R - 0.02)));
    tg.push(new THREE.TubeGeometry(curve, 8, 0.04, 6, false));
  }
  const tines = tg.map((t) => { const m = new THREE.Mesh(t, mats.g); m.castShadow = true; return m; });
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(R, R, D, 32, 1, false).translate(0, D / 2, 0), mats.bore);
  collar.castShadow = true; bore.receiveShadow = true;
  return { collar, tines, bore };
}
