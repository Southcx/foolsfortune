// ---------------------------------------------------------------------------------------
// A MECH'S CRADLE MOUNT (plain name; South, 2026-11-02: "experiment with different mecha cradle options, the connection points to the
// upper back look a little off"): how the cradle's well (cores.js CRADLE: its thread, its gold collar and four tines, `cradleParts`,
// which the mount's cinematic turns, all the same in every mount) is housed where it meets the frame's back, one of five, chosen as a
// look (`F.cradle`, the body's `setCradle`, mechstyle.js `/mechstyle cradle <id>`). Built in the well's frame (its floor at the origin,
// +Y up the well's axis, +Z into the chest), so any core's back takes any mount; the seat stands where it stood.
//   boss    the first pass's: an octagonal boss on a trim flange the back's plates close on
//   sunk    a socket: a low, wide dish sunk into the back's plates round the well, its rim rolled and barely proud (parts/sdf.js)
//   kiln    a raised kiln collar on four struts over a coiled tube, its foot a flange on the back (a coil pot's walls, a kiln's crown)
//   yoke    a backpack: a flat broad yoke from blade to blade, straps running up over the shoulders' roots, the well's housing at its
//           middle (an entry plug's hatch carried as a pack)
//   halo    a nimbus on the back's plates behind the Jar, facing the viewer, gold rays round it, its inner edge lit while sealed
// Prior art: Evangelion's entry plug and its insertion collar; Medabots' Medal slot in a tinpet's back; Armored Core's back units on
// a yoke; the Buddhist kōhai (a halo behind a figure); a coil pot and a climbing kiln's crown; the house's own boss (the first pass).
//
//   CRADLE_IDS   CRADLE_LOOK   cradleMount(S, id, C) (the housing, in the well's frame; C the well's sizes, cores.js CRADLE)
// Every mount but the hero's boss lays a porcelain pad over the back's window round the well (any core's), so no dark shows behind it.
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
export const CRADLE_LOOK = { slope: 0.364, face: -0.09, halo: { r: 0.7, y: 1.05, off: 0.08, tube: 0.06, rays: 24 }, sunk: { rx: 0.95, ry: 0.85, cy: 0.42, deep: 0.16, rimO: 0.05, rim: 0.045 }, kiln: { k: 1.4, struts: 4 }, cell: 0.065 };

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
    if (S.F?.fem) padOver(S, C); // (the doll's back window: its dark strip above the flange covered)
    p.geo(shell([[R, D], [B - 0.04, D], [B, D - 0.05], [B + 0.03, D - 0.2], [B + 0.06, -0.3]], 8, PI / 8), { c: L.pale }); // (the boss, an octagon)
    p.geo(shell([[B + 0.07, D - 0.26], [B + 0.08, D - 0.34]], 8, PI / 8), { c: L.dark }); // (a groove round it, incised)
    S.trim.geo(shell([[B + 0.04, 0.16], [B + 0.3, 0.02], [B + 0.42, -0.1], [B + 0.44, -0.22], [B + 0.05, -0.34]], 8, PI / 8), { c: L.trimM }); // (the flange the back's plates close on)
    g.geo(shell([[B + 0.43, -0.08], [B + 0.46, -0.13], [B + 0.43, -0.18]], 8, PI / 8), { c: L.gold });
  },
  /** The back dished down into the well: a low, wide dish sunk into the back's plates, its floor falling in toward the well and a
   *  rolled rim standing barely proud of the plates round it, so it reads as a socket; two shaded contour lines inside it. */
  sunk(S, C) {
    const R = C.r, W = CRADLE_LOOK.sunk, q = (x, y) => Math.hypot(x / W.rx, (y - W.cy) / W.ry);
    const dishO = (x, y) => -W.deep + (W.deep + W.rimO) * Math.min(1, q(x, y)) ** 2.2; // (the floor's height out from the plates)
    let f = outward((x, y, o) => Math.max(o - dishO(x, y), -W.deep - 0.16 - o, q(x, y) - 1));
    f = blend(0.06, f, outward((x, y, o) => Math.hypot((q(x, y) - 1) * Math.min(W.rx, W.ry), o - W.rimO) - W.rim)); // (its rim, rolled)
    f = carve(0.04, f, (x, y, z) => Math.max(Math.hypot(x, z) - R - 0.03, -y - 0.05)); // (the well, sunk in it)
    const rings = (x, y) => { const u = q(x, y); let k = 0; for (const c of [0.62, 0.82]) k = Math.max(k, Math.max(0, 1 - Math.abs(u - c) / 0.05)); return k * k; };
    sideSculpt(S.p, f, [[-W.rx - 0.15, W.cy - W.ry - 0.15, -0.6], [W.rx + 0.15, W.cy + W.ry + 0.15, 0.6]], CRADLE_LOOK.cell, { key: key('sunk2', C), tone: shade(aoTone(f, L.pale, L.mid, 0.1), rings, L.mid, 0.4) });
    S.g.ring(R + 0.05, 0.022, { at: [0, 0.02, 0], c: L.gold }, 32, 4); // (a gold thread where the well meets the dish)
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
  /** A halo: a nimbus standing on the back's plates behind the Jar, turned to face whoever looks at the back (its axis the plates'
   *  normal), so the Jar is seen framed in it: a trim ring, its inner edge lit while sealed, gold rays round its outside, three spokes
   *  down into the back. */
  halo(S, C) {
    const { p } = S, R = C.r, D = C.depth, B = C.boss, H = CRADLE_LOOK.halo, sl = CRADLE_LOOK.slope;
    padOver(S, C);
    p.geo(shell([[B + 0.1, -0.34], [B + 0.13, -0.14], [B, 0.08], [R + 0.13, 0.3], [R + 0.08, D - 0.1], [R + 0.11, D - 0.02], [R + 0.03, D + 0.03], [R, D]], 32), { c: L.pale }); // (the socket and its slim lip)
    const tilt = -Math.atan2(1, sl), at = O(0, H.y, H.off), n = [0, sl / Math.hypot(1, sl), -1 / Math.hypot(1, sl)]; // (its axis: the plates' outward normal)
    const on = (a, rr, lift = 0) => { const u = [Math.cos(a) * rr, Math.sin(a) * rr]; return [u[0], at[1] + u[1] / Math.hypot(1, sl) + n[1] * lift, at[2] + (u[1] * sl) / Math.hypot(1, sl) + n[2] * lift]; };
    S.trim.ring(H.r, H.tube, { at, rot: [tilt, 0, 0], c: L.trimL }, 64, 8); // (the nimbus)
    S.e.ring(H.r - H.tube * 1.1, H.tube * 0.32, { at: on(0, 0, 0.03), rot: [tilt, 0, 0], c: 0xffffff }, 64, 4); // (its light, lit while sealed)
    S.e.ring(H.r * 0.62, 0.02, { at: on(0, 0, -0.02), rot: [tilt, 0, 0], c: 0xffffff }, 48, 4);
    for (let k = 0; k < H.rays; k++) { const a = (k / H.rays) * PI * 2, long = k % 2 ? 0.1 : 0.2; S.g.rod(on(a, H.r + H.tube), on(a, H.r + H.tube + long), k % 2 ? 0.018 : 0.026, { c: L.gold }, 5); } // (the rays)
    for (const a of [-PI / 2, -PI / 2 + 2.1, -PI / 2 - 2.1]) S.trim.rod(on(a, H.r - H.tube), O(Math.cos(a) * 0.45, H.y + Math.sin(a) * 0.45 * 0.94, 0.0), 0.035, { c: L.trimM }, 6); // (the spokes into the plates)
  },
};
/** The back's pad, laid where a mount would leave the back's window bare. */
function padOver(S, C) {
  const f = carve(0.03, outward(pad), well(C.r));
  sideSculpt(S.p, f, [[-0.8, -0.6, -0.4], [0.8, 1.2, 0.5]], CRADLE_LOOK.cell, { key: key('pad', C), tone: aoTone(f, L.pale, L.mid, 0.08) });
}

/** The housing of the cradle's well in mount `id` (the first pass's boss when unknown), in the well's frame. */
export function cradleMount(S, id, C) { (MOUNTS[id] || MOUNTS.boss)(S, C); }
