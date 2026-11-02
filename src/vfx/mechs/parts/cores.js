// ---------------------------------------------------------------------------------------
// A MECH'S CORES (the part library: progress/mechs/parts.js slot `core`): the chest each frame is built round, and the cradle every
// core carries in its back. A chest is sculpted, never a box: one lathed profile (the ribcage swelling out of a narrow waist to a
// broad shoulder line) pressed into its plan (`planOf`: an oval wider than deep, a keel ridge down the front so the plan comes to a
// heater shield's point, two pectoral swells that curve back into the flanks, the back flatter), then cut into curved porcelain
// panels over the interstitial's barrel inside it, so the gaps between the panels are real grooves with the core lit in them. Its
// sockets (the neck's cup, the shoulders' cups facing out) are ivory, so any head and any arms seat in any core. The back's panels
// close round the cradle's boss: a narrow window cut only where the boss stands, its trim flange laid over the cut.
//   clayCore   heroic: broad shoulders, a strong keel, the breastplate split at it into two pectorals, a flank and a shoulder blade a
//              side, the abdomen in three wrapped bands narrowing to the waist, a kintsugi crack across the left pectoral
//   kilnCore   fired twice: deeper and rounder (a bottle kiln's shoulders), banded in trim, its firing holes bricked open on the core
//   lightCore  bisque thin: slim, its flanks cut to narrow ribs over the lit core, a sternum plate and hoops
// In the doll form (kit.js FORMS) each is the same core made a doll's: a narrow ribcage pinched to a wasp waist, one smooth shell
// across the front with a soft bust, fewer grooves; its personality kept in its bands and ribs.
// THE CRADLE (South, 2026-11-02, via the coordinator: Evangelion's entry plug): in the back, between the shoulder blades, a well
// tilted back 20 degrees from upright, at the Pneuka Jar's own size (vfx/pneukajar/shape.js JAR_ANATOMY: the Jar 1.2 m, its foot
// 0.257 round), so the Jar goes in base first and screws down until its shoulder line (0.82 up it) is flush with the lip, the head
// and face left showing. A screw thread cut round the inside at a pitch of two full turns over that depth, a gold collar on the lip,
// an octagonal boss round it (the cradle's look's octagon and four bronze tines, vfx/cradlelook.js), the well's floor lit while sealed.
// Prior art: Medabots' tinpet (the frame the parts hang on, the Medal in its back: the Jar is the Medal); Evangelion's entry plug;
// the Milanese cuirass and the muscle cuirass (the keel and the pectorals); Kunio Okawara's and Hajime Katoki's chest blocks read as
// sculpted volumes; the bottle kilns of Stoke-on-Trent (the kiln core); bisque ware's openwork (the light core); Elemental
// Gearbolt's and Haydee's doll torsos; Gundam's panel lines.
//
//   coreLook(id, F) -> { mounts: { neck [y, z], shoulder [x, y], back [y, z], gen [y, z], boost [y, z, x], plug [y, z], cradleZ }, chest(S), waist(S) }
//   CORE_LOOKS[id] (the cores' numbers)   cradle(S) (the boss, the thread, the floor's glow)   cradleParts(mats) -> { collar, tines, bore }
//   CRADLE (the well's sizes: r, depth, turns, pitch, tilt, at [y, z] on the chest)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { JAR_ANATOMY } from '../../pneukajar/shape.js';
import { MECH_LOOK as L, FORMS, band, profAt, panel, cup, seam, ball, threadGeometry, shell, sculpt } from './kit.js';

const PI = Math.PI;
/** The well: its radius (the Jar's foot and a hand's width of room), its depth (to the Jar's shoulder line), two turns, its tilt back,
 *  and where its floor sits on the chest (the seat: 1.8 over the chest's base, so 3 m over the hip). */
export const CRADLE = { r: JAR_ANATOMY.footR + 0.035, depth: JAR_ANATOMY.shoulderY, turns: 2, tilt: 0.35, at: [L.cradleY, -1.02], boss: 0.52 };
CRADLE.pitch = CRADLE.depth / CRADLE.turns;
const WIN = [1.32, 2.82]; // (the back's window round the boss, in the chest's height)
const G = 0.035; // (a groove's half-width in phi)
const bump = (y, a, b) => (y <= a || y >= b ? 0 : Math.sin((PI * (y - a)) / (b - a)));

/** The cores' numbers: the profile [[r, y], ...], the plan (w across, d ahead, back behind, the keel's and the pectorals' swell), the
 *  shoulder's height, the waist's colour. */
export const CORE_LOOKS = {
  clayCore: { prof: [[0.82, 0], [0.92, 0.5], [1.3, 1.05], [1.74, 1.75], [1.96, 2.35], [1.86, 2.85], [1.36, 3.2], [0.5, 3.36]], w: 1.28, d: 0.6, back: 0.5, keel: 0.32, pec: 0.16, shoulderY: 2.45, cup: 0.6 },
  kilnCore: { prof: [[1.0, 0], [1.16, 0.45], [1.6, 1.0], [1.98, 1.7], [2.1, 2.3], [1.98, 2.8], [1.5, 3.2], [0.6, 3.42]], w: 1.24, d: 0.68, back: 0.55, keel: 0.16, pec: 0.08, shoulderY: 2.4, cup: 0.66 },
  lightCore: { prof: [[0.7, 0], [0.8, 0.5], [1.1, 1.1], [1.48, 1.8], [1.64, 2.35], [1.52, 2.8], [1.08, 3.06], [0.42, 3.2]], w: 1.3, d: 0.62, back: 0.52, keel: 0.24, pec: 0.1, shoulderY: 2.4, cup: 0.52 },
};

/** A doll's profile: the waist pinched, the ribcage kept. */
const dollProf = (prof) => prof.map(([r, y]) => [r * (1 - 0.34 * bump(y, -0.6, 1.7)), y]);
/** The chest's plan as a vertex function (a lathe's x, y, z to the sculpted chest's). */
function planOf(C, F) {
  const doll = F.id === 'doll', w = C.w * F.chest[0], d = C.d * F.chest[2], bk = C.back * F.chest[2];
  const keel = (y) => (doll ? 0.06 : C.keel) * bump(y, 0.5, 3.0), pec = (y) => (doll ? 0.2 : C.pec) * bump(y, doll ? 1.9 : 1.75, doll ? 3.0 : 3.15);
  const sig = doll ? 0.035 : 0.06, at = doll ? 0.42 : 0.5;
  return (x, y, z) => {
    const r = Math.hypot(x, z); if (r < 1e-5) return [x, y, z];
    const c = z / r, sx = Math.abs(x) / r, f = Math.max(0, c);
    let zz = z > 0 ? z * d : z * bk;
    zz += r * d * (keel(y) * f ** 4 + pec(y) * f * Math.exp(-((sx - at) ** 2) / sig));
    return [x * w * (1 - 0.06 * f * bump(y, 0.9, 2.2)), y, zz];
  };
}

/** A core made for a form: its mounts read off its own sculpted surface, its chest and waist builders. */
export function coreLook(id, F = FORMS.hero) {
  const C = CORE_LOOKS[id] || CORE_LOOKS.clayCore, doll = F.id === 'doll', P = doll ? dollProf(C.prof) : C.prof, W = planOf(C, F);
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
      if (doll) {
        panels(S, [[1.0, top - 0.1, -1.5, 1.5, L.pale], [0.06, 0.92, -PI + 0.2, PI - 0.2, L.mid, 1.04]]);
        backPlates(S, 1.0, top - 0.2, 1.5 + 2 * G);
        hoop(S, 0.98, 0.04, 1.06);
      } else {
        panels(S, [[1.9, top - 0.08, G, 1.0, L.pale], [1.05, 1.82, G, 1.0, L.mid], [1.05, top - 0.2, 1.0 + 2 * G, 1.95, L.mid], // (pectorals, the ribs under them, the flanks)
          [0.06, 0.34, G, PI - 0.2, L.dark, 1.05], [0.4, 0.68, G, PI - 0.2, L.mid, 1.05], [0.74, 0.99, G, PI - 0.2, L.pale, 1.05]]); // (the abdomen's three bands)
        backPlates(S, 1.05, top - 0.25, 1.95 + 2 * G);
        hoop(S, 1.86, 0.035, 1.05, L.trimD); // (a trim rim under the pectorals)
        S.trim.geo(sculpt(panel(band(P, 0.9, top - 0.1, 1.07, 12), -0.05, 0.05, 6), W), { c: L.trimL }); // (the keel's ridge)
        seam(S.g, [on(0.12, 3.0), on(0.32, 2.75), on(0.42, 2.4), on(0.7, 2.15), on(0.82, 1.95)]);
      }
      gorget(S, top - 0.1); sockets(S);
    },
    kilnCore(S) {
      inner(S);
      if (doll) panels(S, [[1.0, top - 0.1, -1.6, 1.6, L.mid], [0.06, 0.92, -PI + 0.2, PI - 0.2, L.dark, 1.04]]);
      else panels(S, [[1.05, 2.0, G, 1.15, L.mid], [2.1, top - 0.1, G, 1.15, L.mid], [1.05, top - 0.2, 1.15 + 2 * G, 2.0, L.dark], [0.06, 0.95, G, PI - 0.2, L.dark, 1.05]]);
      backPlates(S, doll ? 1.0 : 1.05, top - 0.25, doll ? 1.6 + 2 * G : 2.0 + 2 * G, L.dark);
      for (const y of doll ? [1.0, 2.05] : [1.0, 2.05, 3.0]) hoop(S, y, doll ? 0.03 : 0.055, 1.07, y === 2.05 ? L.trimL : L.trimD);
      if (!doll) for (let k = 0; k < 4; k++) { const a = -0.5 + k / 3; S.core.box(0.26, 0.4, 0.3, { at: on(a, 1.5, 1.0), rot: [0, a, 0], c: L.coreD }, 0.06); }
      gorget(S, top - 0.1, L.trimD); sockets(S);
      seam(S.g, [on(-0.2, 3.0), on(-0.4, 2.6), on(-0.32, 2.25), on(-0.5, 1.85)]);
    },
    lightCore(S) {
      inner(S);
      const ribs = doll ? 4 : 7, r0 = doll ? 1.25 : 0.06;
      if (doll) panels(S, [[1.0, top - 0.1, -1.2, 1.2, L.pale]]);
      for (let i = 0; i < ribs; i++) { const a = r0 + (i / ribs) * (PI - gap - 0.1 - r0); panels(S, [[1.0, 3.0, a, a + (doll ? 0.08 : 0.12), L.mid]]); } // (the ribs)
      for (const [y, c] of doll ? [[1.02, L.trimM]] : [[1.05, L.trimL], [2.0, L.trimM], [2.9, L.trimL], [0.5, L.trimM]]) hoop(S, y, 0.07, 1.06, c);
      if (!doll) panels(S, [[1.6, 2.7, -0.42, 0.42, L.pale, 1.07]]); // (the sternum's one plate)
      panels(S, [[1.0, WIN[0], PI - gap - G, PI - G, L.mid], [WIN[1], top - 0.15, PI - gap - G, PI - G, L.mid]]);
      gorget(S, top - 0.08, L.trimL); sockets(S);
      seam(S.g, [on(0, 1.65, 1.09), on(0, 2.65, 1.09)], 0.03);
    },
  };
  const tone = id === 'kilnCore' ? L.dark : id === 'lightCore' ? L.mid : L.pale, k = doll ? 0.8 : 1;
  return {
    mounts, prof: P, plan: W,
    chest: build[id] || build.clayCore,
    waist(S) {
      ball(S.g, 0.5 * F.joint);
      S.core.cyl(0.5 * k, 0.56 * k, L.chestBase + 0.2, { at: [0, L.chestBase / 2, 0], c: L.core }, 20);
      for (let i = 0; i < (doll ? 1 : 2); i++) (i ? S.trim : S.p).lathe([[0.66, 0], [0.76, 0.05], [0.76, 0.2], [0.66, 0.25]], { at: [0, 0.12 + i * 0.3, 0], sc: [k, 1, 0.85 * k], c: i ? L.trimM : tone }, 28);
    },
  };
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
