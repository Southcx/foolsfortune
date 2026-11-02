// ---------------------------------------------------------------------------------------
// A MECH'S CRADLE MOUNT (plain name; South, 2026-11-02: "experiment with different mecha cradle options, the connection points to the
// upper back look a little off"): how the cradle's well (cores.js CRADLE: its thread, its gold collar and four tines, `cradleParts`,
// which the mount's cinematic turns, all the same in every mount) is housed where it meets the frame's back, one of five, chosen as a
// look (`F.cradle`, the body's `setCradle`, mechstyle.js `/mechstyle cradle <id>`). Built in the well's frame (its floor at the origin,
// +Y up the well's axis, +Z into the chest), so any core's back takes any mount; the seat stands where it stood.
//   boss    the first pass's: an octagonal boss on a trim flange the back's plates close on
//   sunk    the back dished down into the well: a broad trough rising to a rolled rim round the Jar, its contours shaded in (parts/sdf.js)
//   kiln    a raised kiln collar on four struts over a coiled tube, its foot a flange on the back (a coil pot's walls, a kiln's crown)
//   yoke    a backpack: a flat broad yoke from blade to blade, straps running up over the shoulders' roots, the well's housing at its
//           middle (an entry plug's hatch carried as a pack)
//   halo    a ring a metre across round the Jar's shoulders, its near arc just off the back, on four spokes, lit while sealed
// Prior art: Evangelion's entry plug and its insertion collar; Medabots' Medal slot in a tinpet's back; Armored Core's back units on
// a yoke; the Buddhist kōhai (a halo behind a figure); a coil pot and a climbing kiln's crown; the house's own boss (the first pass).
//
//   CRADLE_IDS   CRADLE_LOOK   cradleMount(S, id, C) (the housing, in the well's frame; C the well's sizes, cores.js CRADLE)
// Every mount but the boss lays a porcelain pad over the back's window round the well (any core's), so no dark shows behind it.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, shell } from './kit.js';
import { blend, carve, capsule, box, mirrorX } from './sdf.js';
import { sideSculpt, aoTone } from './arms.js';

const PI = Math.PI;
/** The mounts, in their choosing order (the first the default). */
export const CRADLE_IDS = ['boss', 'sunk', 'kiln', 'yoke', 'halo'];
/** Their numbers: the back's slope in the well's frame (the plates' face at z = slope y + face), the halo's ring (its radius, how far
 *  its centre stands out from the well's axis, its tube), the kiln's scale and struts, the cells (one for every sculpt). */
export const CRADLE_LOOK = { slope: 0.364, face: -0.09, halo: { r: 0.52, off: 0.34, tube: 0.07 }, kiln: { k: 1.4, struts: 4 }, cell: 0.065 };

const pts = (P, list, r, c, seg = 6) => { for (let i = 1; i < list.length; i++) P.rod(list[i - 1], list[i], r, { c }, seg); };
/** A point given as (x, up the well, out from the back's plates) in the well's frame: the back leans 20 degrees off the well's axis. */
const O = (x, y, o) => [x, y, CRADLE_LOOK.slope * y + CRADLE_LOOK.face - o];
/** A field read in (x, up, out) coordinates: f(x, y, o). */
const outward = (f) => (x, y, z) => f(x, y, CRADLE_LOOK.slope * y + CRADLE_LOOK.face - z);
/** A sculpt's tone with lines shaded in where `k(x, y, z)` (0..1) says: never cut, a groove two cells thin comes out jagged. */
const shade = (tone, k, ink = L.mid, amt = 0.5) => { const I = new THREE.Color(ink); return (x, y, z, nx, ny, nz) => { const c = tone(x, y, z, nx, ny, nz), t = k(x, y, z) * amt; return [c[0] + (I.r - c[0]) * t, c[1] + (I.g - c[1]) * t, c[2] + (I.b - c[2]) * t]; }; };
/** The back's pad: a porcelain plate laid over the back's window round the well (any core's, either form), so no dark shows there. */
const pad = (x, y, o) => box([0, 0.3, 0.02], [0.66, 0.78, 0.09], 0.08)(x, y, o);
const well = (R) => (x, y, z) => Math.max(Math.hypot(x, z) - R - 0.015, -y);
const key = (id, C) => `cradle.${id}|${C.r.toFixed(3)}|${C.depth.toFixed(3)}`;

const MOUNTS = {
  boss(S, C) {
    const { p, g } = S, R = C.r, D = C.depth, B = C.boss;
    p.geo(shell([[R, D], [B - 0.04, D], [B, D - 0.05], [B + 0.03, D - 0.2], [B + 0.06, -0.3]], 8, PI / 8), { c: L.pale }); // (the boss, an octagon)
    p.geo(shell([[B + 0.07, D - 0.26], [B + 0.08, D - 0.34]], 8, PI / 8), { c: L.dark }); // (a groove round it, incised)
    S.trim.geo(shell([[B + 0.04, 0.16], [B + 0.3, 0.02], [B + 0.42, -0.1], [B + 0.44, -0.22], [B + 0.05, -0.34]], 8, PI / 8), { c: L.trimM }); // (the flange the back's plates close on)
    g.geo(shell([[B + 0.43, -0.08], [B + 0.46, -0.13], [B + 0.43, -0.18]], 8, PI / 8), { c: L.gold });
  },
  /** The back dished down into the well: a broad trough of porcelain whose two flanks rise either side of the Jar and curve under its
   *  foot, so the well lies sunk in the back's own mass; its contours shaded in as grooves round the trough. */
  sunk(S, C) {
    const R = C.r;
    const dishO = (x, y) => { const q = Math.hypot(x / 1.05, (y - 0.32) / 0.95); return 0.5 * Math.min(1, q) ** 1.6 + 0.04 - 0.18 * (1 - Math.min(1, q)); }; // (the dish's height out, rising to its rim)
    let f = outward((x, y, o) => Math.max(o - dishO(x, y), -0.14 - o, Math.hypot(x / 1.08, (y - 0.32) / 0.98) - 1));
    f = blend(0.08, f, outward((x, y, o) => Math.hypot(Math.hypot(x / 1.08, (y - 0.32) / 0.98) - 1, o - 0.48) - 0.07)); // (its rim, rolled)
    f = carve(0.05, f, (x, y, z) => Math.max(Math.hypot(x, z) - R - 0.03, -y - 0.05)); // (the well, sunk in it)
    const rings = (x, y, z) => { const q = Math.hypot(x / 1.05, (y - 0.32) / 0.95); let k = 0; for (const c of [0.55, 0.72, 0.88]) k = Math.max(k, Math.max(0, 1 - Math.abs(q - c) / 0.04)); return k * k; };
    sideSculpt(S.p, f, [[-1.2, -0.75, -0.75], [1.2, 1.4, 0.7]], CRADLE_LOOK.cell, { key: key('sunk', C), tone: shade(aoTone(f, L.pale, L.mid, 0.1), rings) });
  },
  /** A raised kiln collar on four struts over a coiled tube, its foot a flange on the back; at 1.4 times the first cut. */
  kiln(S, C) {
    const { p, g } = S, R = C.r, D = C.depth, B = C.boss, K = CRADLE_LOOK.kiln, k = K.k;
    padOver(S, C);
    S.trim.geo(shell([[R + 0.06, 0.08], [B + 0.42 * k, -0.06], [B + 0.52 * k, -0.2], [B + 0.46 * k, -0.36], [R + 0.06, -0.4]], 28), { c: L.trimM }); // (the flange on the back)
    for (let y = 0.1, i = 0; y < D - 0.16; y += 0.13, i++) p.ring(R + 0.09, 0.07, { at: [0, y, 0], c: i % 2 ? L.mid : L.pale }, 28, 6); // (the coiled tube)
    S.trim.geo(shell([[R + 0.005, D + 0.05], [R + 0.2 * k, D + 0.07], [R + 0.32 * k, D - 0.04], [R + 0.3 * k, D - 0.22], [R + 0.1, D - 0.25]], 28), { c: L.trimL }); // (the collar, a kiln's crown)
    for (let n = 0; n < K.struts; n++) {
      const a = PI / 4 + (n / K.struts) * PI * 2, c = Math.cos(a), s = Math.sin(a);
      pts(p, [[s * (R + 0.26 * k), D - 0.2, c * (R + 0.26 * k)], [s * (B + 0.2 * k), D * 0.45, c * (B + 0.2 * k)], [s * (B + 0.4 * k), -0.16, c * (B + 0.4 * k)]], 0.065, L.mid);
      g.ball(0.07, { at: [s * (B + 0.4 * k), -0.16, c * (B + 0.4 * k)], c: L.bronze }, 10, 8); // (a bronze rivet at each strut's foot)
    }
  },
  /** A backpack: a flat broad yoke laid over the back from blade to blade, the housing round the well swelling out of its middle,
   *  two straps running up from its ends over the shoulders' roots. */
  yoke(S, C) {
    const R = C.r, D = C.depth;
    padOver(S, C);
    const plate = outward(mirrorX((x, y, o) => { const yb = 0.42 + 0.12 * (x / 1.7) ** 2; return box([0, 0, 0], [1.72, 0.36, 0.07], 0.07)(x, y - yb, o - 0.1 + 0.18 * (x / 1.72) ** 2); }));
    const straps = outward(mirrorX((x, y, o) => Math.min(capsule([1.35, 0.6, 0.12], [1.85, 0.95, -0.05], 0.15)(x, y, o * 1.6), capsule([1.85, 0.95, -0.05], [2.15, 1.02, -0.42], 0.13)(x, y, o * 1.6))));
    const housing = (x, y, z) => Math.max(Math.hypot(x, z) - R - 0.17, -0.25 - y, y - D + 0.02);
    let f = blend(0.12, plate, straps, housing);
    f = blend(0.04, f, (x, y, z) => Math.hypot(Math.hypot(x, z) - R - 0.12, y - D + 0.02) - 0.07); // (the hatch's lip)
    f = carve(0.03, f, well(R));
    const seams = (x, y, z) => { const ax = Math.abs(x); return Math.max(0, 1 - Math.abs(ax - 0.95) / 0.035) ** 2 + (ax > 1.3 && ax < 1.4 ? 0.6 : 0); };
    sideSculpt(S.p, f, [[-2.35, -0.4, -0.75], [2.35, 1.2, 0.95]], CRADLE_LOOK.cell, { key: key('yoke', C), tone: shade(aoTone(f, L.pale, L.mid, 0.08), seams) });
    for (const sx of [-1, 1]) S.trim.ring(0.16, 0.035, { at: O(sx * 1.6, 0.8, 0.2), rot: [-1.2, 0, sx * 0.6], c: L.trimM }, 20, 4); // (the straps' buckles)
  },
  /** A halo: a ring a metre across round the Jar's shoulders, its near arc just off the back, on four spokes from a socket, its
   *  inner edge lit while sealed. */
  halo(S, C) {
    const { p } = S, R = C.r, D = C.depth, B = C.boss, H = CRADLE_LOOK.halo;
    padOver(S, C);
    p.geo(shell([[B + 0.1, -0.34], [B + 0.13, -0.14], [B, 0.08], [R + 0.13, 0.3], [R + 0.08, D - 0.1], [R + 0.11, D - 0.02], [R + 0.03, D + 0.03], [R, D]], 32), { c: L.pale }); // (the socket and its slim lip)
    const yh = D - 0.06, at = [0, yh, -H.off]; // (round the Jar's shoulders, set out from the axis so its near arc just meets the back)
    S.trim.ring(H.r, H.tube, { at, c: L.trimL }, 64, 8); // (the halo)
    S.e.ring(H.r - H.tube * 0.9, H.tube * 0.3, { at: [0, yh + H.tube * 0.7, -H.off], c: 0xffffff }, 64, 4); // (its light, lit while sealed)
    for (let k = 0; k < 4; k++) {
      const a = PI / 4 + (k / 4) * PI * 2, tip = [Math.sin(a) * (H.r - H.tube), yh, -H.off + Math.cos(a) * (H.r - H.tube)];
      const foot = Math.cos(a) > 0 ? O(tip[0] * 0.9, yh - 0.35, -0.02) : [Math.sin(a) * (R + 0.1), yh - 0.3, Math.cos(a) * (R + 0.1)]; // (the near spokes into the back, the far into the lip)
      S.trim.rod(tip, foot, 0.04, { c: L.trimM }, 6);
    }
  },
};
/** The back's pad, laid where a mount would leave the back's window bare. */
function padOver(S, C) {
  const f = carve(0.03, outward(pad), well(C.r));
  sideSculpt(S.p, f, [[-0.8, -0.6, -0.4], [0.8, 1.2, 0.5]], CRADLE_LOOK.cell, { key: key('pad', C), tone: aoTone(f, L.pale, L.mid, 0.08) });
}

/** The housing of the cradle's well in mount `id` (the first pass's boss when unknown), in the well's frame. */
export function cradleMount(S, id, C) { (MOUNTS[id] || MOUNTS.boss)(S, C); }
