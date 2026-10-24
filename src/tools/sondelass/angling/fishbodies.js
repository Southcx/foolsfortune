// ---------------------------------------------------------------------------------------
// THE TWELVE BODIES of the Weir's fish, refired to be held up a metre from the camera (docs/plans/ANGLING.md section 3, "The fish, made
// worth holding up"). Each is laid out on the fish kit (fishgeometry.js) at unit length, nose +X, and coloured from its feeling's one
// colour (progress/weather.js COLOR): the back darkened, the flank the colour, the belly paled, the fins the colour lightened to their
// edge. No other colour comes in; the legend wears the five feelings it answers to in bands. Each silhouette is a real family's, so it
// reads at a glance and none is mistaken for another:
//   carp       Pale Regret      a common carp: deep body, the long dorsal, a forked tail, two barbels, big scales
//   minnow     Tin Mirth        a bleak: slim, a deep fork, the bright stripe down its flank, big-eyed
//   puff       Bellows Carp     a pufferfish: round and spined, the little fins at the back, a beak, the pectorals sculling fast
//   ribbon     Widow's Thread   an oarfish: a ribbon with a crest the whole length rippling, the plume on its head, the long pelvic oars
//   comet      Quiet Comet      a flying fish: squarish body, wings of pectorals and pelvics, the lower lobe of the tail long
//   ray        Wonder Ray       a manta: a disc of wings that flaps, the horns at its face, a whip of a tail, pale shoulder marks
//   eel        Hollow Hunger    a gulper eel: a pouch of a mouth bigger than its body, a whip tail ending in a light
//   angler     Lantern Dread    an anglerfish: all head and teeth, the lure lit on its stalk
//   catfish    Mother Hush      a wels catfish: flat-headed, mottled, the long anal fin rippling, long barbels
//   leviathan  Drowned Lachryma a sturgeon: rows of scutes, a pointed snout and its barbels, the upper lobe long; in bands of five feelings
//   sculpin    Sour Grudge      a sculpin: flat head, fan pectorals, two dorsals, its skin CURDLED (Gall's paint motif, vfx/paintmotifs.js)
//   pike       Short Fuse       a pike: duckbill, the fins far back, its skin CHARRED and split by CRACKS of light (Fury's motif)
// Prior art: the families above (FishBase's outlines for proportions), Animal Crossing's fish (a toy's silhouette first, one colour, the
// eye big and bright), Okami's ink lines that sit on a body and move with it (the curds and cracks ride the same sweep as the skin).
//   const b = fishBody(bodyKey, feel, bands)   b.geo (shared: never disposed by a fish), b.motion { amp, wl, freq, fin, finRate, scaleN }, b.crackW
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FishKit } from './fishgeometry.js';

// how each one swims: the wave (amp, wavelength, beats a second at speed 1), the fins' flutter (amp scale, rate against the beat), the
// scales' rows a body length; and its profile (half height h and half width w along it, the middle's rise yo, the section's power sq)
export const BODIES = {
  carp: { h: [0.12, 0.19, 0.215, 0.2, 0.15, 0.09, 0.05], w: [0.08, 0.11, 0.12, 0.11, 0.08, 0.05, 0.03], yo: [0, 0.012, 0.016, 0.01, 0, 0, 0], amp: 0.05, wl: 0.9, freq: 5, fin: 1, finRate: 0.8, scaleN: 22, scales: 1 },
  minnow: { h: [0.1, 0.14, 0.15, 0.12, 0.08, 0.04], w: [0.06, 0.08, 0.08, 0.06, 0.04, 0.025], amp: 0.07, wl: 1.0, freq: 11, fin: 1, finRate: 0.7, scaleN: 32, scales: 0.6 },
  puff: { h: [0.3, 0.36, 0.33, 0.2, 0.08], w: [0.28, 0.34, 0.3, 0.18, 0.07], rings: 28, sides: 20, amp: 0.03, wl: 0.8, freq: 3.5, fin: 1.6, finRate: 2.6, scaleN: 0, scales: 0 },
  ribbon: { h: [0.05, 0.055, 0.052, 0.05, 0.046, 0.042, 0.036, 0.03, 0.022, 0.014], w: [0.016, 0.02, 0.02, 0.02, 0.019, 0.018, 0.016, 0.013, 0.01, 0.006], rings: 60, sides: 10, amp: 0.1, wl: 1.6, freq: 4.5, fin: 1, finRate: 1.4, scaleN: 0, scales: 0 },
  comet: { h: [0.1, 0.13, 0.13, 0.11, 0.08, 0.05, 0.03], w: [0.08, 0.1, 0.1, 0.08, 0.06, 0.04, 0.025], sq: 2.4, amp: 0.03, wl: 1.0, freq: 14, fin: 0.6, finRate: 0.4, scaleN: 30, scales: 0.7 },
  ray: { h: [0.05, 0.07, 0.075, 0.07, 0.05, 0.03, 0.015], w: [0.2, 0.7, 0.9, 0.75, 0.4, 0.12, 0.03], len: 0.55, rings: 28, sides: 20, amp: 0.015, wl: 1.0, freq: 2.2, fin: 1, finRate: 1, scaleN: 0, scales: 0 },
  eel: { h: [0.04, 0.05, 0.05, 0.045, 0.04, 0.035, 0.03, 0.025, 0.02, 0.015, 0.01, 0.006], w: [0.036, 0.045, 0.045, 0.04, 0.036, 0.032, 0.027, 0.022, 0.018, 0.013, 0.009, 0.005], rings: 50, sides: 10, amp: 0.09, wl: 1.3, freq: 5, fin: 1, finRate: 1.2, scaleN: 0, scales: 0 },
  angler: { h: [0.3, 0.36, 0.3, 0.18, 0.1, 0.05], w: [0.3, 0.34, 0.26, 0.14, 0.07, 0.035], yo: [0.02, 0.02, 0.01, 0, 0, 0], rings: 28, sides: 18, amp: 0.03, wl: 0.9, freq: 3, fin: 1.2, finRate: 1, scaleN: 0, scales: 0 },
  catfish: { h: [0.08, 0.12, 0.13, 0.12, 0.1, 0.075, 0.05, 0.03], w: [0.2, 0.2, 0.16, 0.12, 0.09, 0.065, 0.045, 0.025], yo: [-0.02, -0.01, 0, 0, 0, 0, 0, 0], sq: 2.6, rings: 32, amp: 0.04, wl: 1.0, freq: 2.6, fin: 1, finRate: 1.3, scaleN: 0, scales: 0 },
  leviathan: { h: [0.04, 0.08, 0.11, 0.12, 0.115, 0.1, 0.085, 0.07, 0.055, 0.04, 0.03, 0.02], w: [0.04, 0.09, 0.12, 0.12, 0.11, 0.1, 0.085, 0.07, 0.055, 0.04, 0.03, 0.02], rings: 48, amp: 0.06, wl: 1.5, freq: 1.4, fin: 1, finRate: 0.8, scaleN: 0, scales: 0 },
  sculpin: { h: [0.13, 0.15, 0.13, 0.1, 0.065, 0.035], w: [0.24, 0.21, 0.15, 0.09, 0.05, 0.025], yo: [-0.03, -0.02, -0.01, 0, 0, 0], sq: 2.4, amp: 0.035, wl: 0.9, freq: 3, fin: 1.2, finRate: 1.1, scaleN: 0, scales: 0 },
  pike: { h: [0.04, 0.07, 0.095, 0.105, 0.1, 0.09, 0.075, 0.055, 0.035], w: [0.05, 0.06, 0.07, 0.075, 0.07, 0.06, 0.05, 0.035, 0.02], rings: 32, amp: 0.06, wl: 1.1, freq: 7, fin: 1, finRate: 0.8, scaleN: 40, scales: 0.5 },
};
/** The order the legend's bands run, head to tail: the five feelings it answers to, most positive first (GLOSSARY, DISPLAY_ORDER). */
export const LEGEND_BANDS = ['wonder', 'mirth', 'desire', 'grief', 'dread'];

/** A small hash for where a mark goes: a look, not the simulation's chance, so a body is marked the same every time. */
const markHash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const W = [1, 1, 1];
const ss = THREE.MathUtils.smoothstep;
const rgba = (c, a = 1) => [c[0], c[1], c[2], a];

/** The skin's shade at (u, a) of a colour: the back darkened, the belly paled (countershading, as every open-water fish wears it). */
function counter(c, a, back = 0.4, belly = 0.6) {
  const up = Math.cos(a);
  return up > 0 ? mix(c, mul(c, back), ss(up, 0.05, 0.9)) : mix(c, mix(c, W, belly), ss(-up, 0.1, 0.85));
}

/** A fin's two colours: root deeper, edge lightened, the edge more see-through. */
const finCols = (c, light = 0.35, a0 = 0.92, a1 = 0.6) => ({ c0: rgba(mul(c, 0.85), a0), c1: rgba(mix(c, W, light), a1) });

// ---- the fins every body is made of
function lineAlong(k, u0, u1, a, n, lift = 0.97) { const out = []; for (let i = 0; i < n; i++) out.push(k.surf(u0 + ((u1 - u0) * i) / (n - 1), a, lift)); return out; }
/** A fin standing on the back (a = 0) or hanging from the belly (a = PI), its height along it shaped by `shape(t)`. */
function median(k, c, u0, u1, hgt, o = {}) {
  const belly = !!o.belly, n = o.n || 6, root = lineAlong(k, u0, u1, belly ? Math.PI : 0, n, 0.9);
  const shape = o.shape || ((t) => Math.sin(Math.PI * Math.min(1, t * 1.25 + 0.05)) * (1 - 0.35 * t));
  const edge = root.map((p, i) => { const t = i / (n - 1); return [p[0] - hgt * (o.rake ?? 0.5), p[1] + (belly ? -1 : 1) * hgt * Math.max(0.08, shape(t)), p[2]]; });
  k.strip(root, edge, { ...finCols(c, o.light ?? 0.35), axis: [0, 0, 1], amp: (o.amp ?? 0.02), offU: o.offU ?? 0, rays: o.rays ?? 0.25, off: o.off || 0 });
}
/** A pair of fins (pectorals, pelvics) at u on the flank at angle a: reaching back `len`, out `spread`, from a root `rootLen` long. */
function pair(k, c, u, a, len, spread, o = {}) {
  for (const s of [1, -1]) {
    const n = o.n || 4, rootLen = o.rootLen ?? 0.06, root = [], edge = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = k.surf(u + rootLen * t, s > 0 ? a : -a, 0.95);
      const reach = Math.sin(Math.PI * (0.2 + 0.8 * t)) ** (o.round ?? 0.6);
      root.push(p);
      edge.push([p[0] - len * (0.55 + 0.45 * t) * (o.back ?? 1), p[1] - (o.drop ?? 0.3) * spread * reach, p[2] + s * spread * reach]);
    }
    k.strip(root, edge, { ...finCols(c, o.light ?? 0.35), axis: o.axis || [0, 1, 0], amp: o.amp ?? 0.035, off: s > 0 ? 0 : Math.PI * (o.alt ?? 0), rays: o.rays ?? 0.25 });
  }
}
/** The tail: forked, a fan, heterocercal (the upper lobe long) or hypocercal (the lower), `len` back and `spread` tall. */
function caudal(k, c, type, len, spread, o = {}) {
  const n = 9, root = [], edge = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = 1 - 2 * t; // (top to bottom)
    root.push([-0.47, k.at(k.B.yo, 0.97) + y * k.at(k.B.h, 0.97) * k.pinch(0.97) * 0.9, 0]);
    const f = type === 'fork' ? 0.4 + 0.6 * Math.abs(y) ** 1.3 : type === 'fan' ? 1 - 0.18 * y * y : type === 'hetero' ? (y > 0 ? 0.35 + 0.65 * y ** 1.2 * 1.35 : 0.35 + 0.4 * (-y) ** 1.4) : 0.35 + (y < 0 ? 0.65 * (-y) ** 1.2 * 1.3 : 0.6 * y ** 1.3);
    const ys = type === 'hetero' && y > 0 ? 1.15 : type === 'hypo' && y < 0 ? 1.15 : 1;
    edge.push([-0.47 - len * f, root[i][1] + y * spread * ys, 0]);
  }
  k.strip(root, edge, { ...finCols(c, o.light ?? 0.4), axis: [0, 0, 1], amp: o.amp ?? 0.025, rays: o.rays ?? 0.3, off: 0.4 });
}
/** Both eyes at (u, a), radius r: the pupil dark, the iris the feeling lightened, a ring of the skin round it. */
function eyes(k, c, u, a, r, o = {}) {
  for (const s of [1, -1]) {
    const p = k.surf(u, s > 0 ? a : -a, 1), yo = k.at(k.B.yo, u);
    const out = new THREE.Vector3(0, p[1] - yo, p[2]).normalize();
    if (o.forward) out.x += o.forward, out.normalize();
    const cen = [p[0] + out.x * r * 0.15, p[1] + out.y * r * 0.15, p[2] + out.z * r * 0.15];
    const iris = mix(c, W, o.iris ?? 0.55), pupil = mul(c, 0.05), lid = mul(c, 0.3);
    k.ball(cen, [r, r, r], 2, (n) => { const d = n[0] * out.x + n[1] * out.y + n[2] * out.z; return rgba(d > 0.82 ? pupil : d > 0.45 ? iris : lid); }, null, 10, 8);
  }
}
/** The mouth: a dark slit across the nose, below the middle (cos a between lo and hi), back to u. */
const mouth = (u0, lo, hi) => (u, a, col) => (u < u0 && Math.cos(a) > lo && Math.cos(a) < hi ? mul(col, 0.12) : col);

// ---- the bodies
const BUILD = {
  carp(k, c) {
    const m = mouth(0.05, -0.55, -0.05);
    k.skin((u, a) => rgba(m(u, a, counter(c, a))), 1);
    median(k, c, 0.28, 0.64, 0.12, { n: 9, shape: (t) => (t < 0.15 ? t / 0.15 : 1 - 0.55 * (t - 0.15)), rays: 0.3 });
    median(k, c, 0.7, 0.8, 0.08, { belly: true });
    pair(k, c, 0.2, 2.2, 0.1, 0.07, { axis: [0, 1, 0.5] });
    pair(k, c, 0.47, 2.6, 0.09, 0.05);
    caudal(k, c, 'fork', 0.24, 0.13);
    eyes(k, c, 0.1, 1.2, 0.022);
    for (const s of [1, -1]) k.rod([k.surf(0.02, s * 2.2), [0.5, -0.07, s * 0.03], [0.48, -0.1, s * 0.04]], 0.006, 0.003, rgba(mix(c, W, 0.3)), 0, { axis: [0, 1, 0], amp: 0.01 });
  },
  minnow(k, c) {
    const m = mouth(0.035, -0.4, 0.1);
    k.skin((u, a) => {
      let col = counter(c, a, 0.35, 0.7);
      const stripe = 1 - ss(Math.abs(Math.cos(a) - 0.1), 0.08, 0.22); // (the flank's bright stripe, a little above the middle)
      col = mix(col, mix(c, W, 0.6), stripe * ss(u, 0.1, 0.25) * (1 - ss(u, 0.85, 0.97)));
      return rgba(m(u, a, col));
    }, 0.6);
    median(k, c, 0.44, 0.56, 0.1, { rake: 0.4 });
    median(k, c, 0.62, 0.74, 0.06, { belly: true });
    pair(k, c, 0.2, 2.1, 0.08, 0.05);
    pair(k, c, 0.48, 2.7, 0.06, 0.04);
    caudal(k, c, 'fork', 0.28, 0.15);
    eyes(k, c, 0.09, 1.25, 0.032);
  },
  puff(k, c) {
    const m = mouth(0.04, -0.5, 0.2);
    k.skin((u, a) => rgba(m(u, a, counter(c, a, 0.45, 0.75))));
    for (let i = 0; i < 44; i++) { // (its spines, raised all over: the puffed one)
      const u = 0.12 + 0.66 * markHash(i, 1), a = (markHash(i, 2) - 0.5) * Math.PI * 1.9, p = k.surf(u, a, 0.97), yo = k.at(k.B.yo, u);
      k.cone(p, [0.25, p[1] - yo, p[2]], 0.012, 0.035 + 0.02 * markHash(i, 3), rgba(mix(counter(c, a, 0.45, 0.75), W, 0.35)), 0, 3);
    }
    median(k, c, 0.72, 0.82, 0.09, { rake: 0.2 });
    median(k, c, 0.72, 0.82, 0.08, { belly: true, rake: 0.2 });
    pair(k, c, 0.26, 1.55, 0.08, 0.07, { axis: [1, 0, 0.6], amp: 0.05, drop: 0.1 });
    caudal(k, c, 'fan', 0.16, 0.11);
    k.ball([0.5, -0.02, 0], [0.025, 0.04, 0.06], 0, () => rgba(mix(c, W, 0.75))); // (the beak)
    eyes(k, c, 0.15, 0.95, 0.05);
  },
  ribbon(k, c) {
    k.skin((u, a) => {
      const col = counter(c, a, 0.5, 0.75);
      return rgba(mix(col, mul(c, 0.45), 0.35 * ss(Math.sin(u * 70), 0.6, 0.95) * (1 - ss(Math.abs(Math.cos(a)), 0, 0.6)))); // (the oarfish's dark flank streaks)
    });
    median(k, c, 0.03, 0.98, 0.035, { n: 32, shape: () => 1, rake: 0.1, offU: 18, amp: 0.025, light: 0.55, rays: 0.4 });
    for (let i = 0; i < 6; i++) { // (the plume on its head: the crest's first rays, long)
      const u = 0.025 + i * 0.009, p = k.surf(u, 0, 0.95), L = 0.16 - i * 0.018;
      k.rod([p, [p[0] - L * 0.25, p[1] + L * 0.6, 0], [p[0] - L * 0.7, p[1] + L * 0.9, 0]], 0.004, 0.0015, rgba(mix(c, W, 0.5)), 0, { axis: [0, 0, 1], amp: 0.02, off: i });
    }
    for (const s of [1, -1]) { // (the long pelvic oars, each ending in a paddle)
      const p = k.surf(0.08, s * 2.6, 0.95), q = [p[0] - 0.22, p[1] - 0.05, p[2] + s * 0.02];
      k.rod([p, [p[0] - 0.1, p[1] - 0.04, p[2] + s * 0.015], q], 0.003, 0.0015, rgba(mix(c, W, 0.5)), 0, { axis: [0, 1, 0], amp: 0.03 });
      k.ball(q, [0.012, 0.005, 0.007], 1, () => rgba(mix(c, W, 0.5), 0.85), [0, 0.03, 0, 2]);
    }
    eyes(k, c, 0.02, 1.2, 0.012);
  },
  comet(k, c) {
    const m = mouth(0.04, -0.3, 0.1);
    k.skin((u, a) => rgba(m(u, a, counter(c, a, 0.3, 0.75))), 0.7);
    for (const s of [1, -1]) { // (the wings: the pectorals, spread)
      const root = [], edge = [];
      for (let i = 0; i < 6; i++) {
        const t = i / 5, p = k.surf(0.18 + 0.1 * t, s * 1.25, 0.95);
        root.push(p); edge.push([p[0] - 0.08 - 0.42 * t, p[1] + 0.015, p[2] + s * (0.12 + 0.42 * (1 - t * t * 0.7))]);
      }
      k.strip(root, edge, { ...finCols(c, 0.5, 0.9, 0.55), axis: [0, 1, 0], amp: 0.03, rays: 0.45 });
    }
    pair(k, c, 0.52, 2.0, 0.16, 0.18, { drop: 0.15, rays: 0.4, light: 0.5 });
    median(k, c, 0.6, 0.72, 0.05);
    caudal(k, c, 'hypo', 0.26, 0.13);
    eyes(k, c, 0.08, 1.2, 0.032);
  },
  ray(k, c) {
    k.skin((u, a) => {
      const up = Math.cos(a), p = k.surf(u, a), wing = Math.abs(p[2]);
      let col = up > 0 ? mul(c, 0.35) : mix(c, W, 0.7);
      if (up > 0) col = mix(col, mix(c, W, 0.55), ss(wing, 0.12, 0.2) * (1 - ss(wing, 0.35, 0.5)) * ss(u, 0.18, 0.26) * (1 - ss(u, 0.34, 0.42))); // (the pale shoulder marks)
      return rgba(col);
    }, 0, (u, a, p) => [0, Math.abs(p[2]) ** 1.4 * 0.35, 0, -u * 2.5]);
    for (const s of [1, -1]) { // (the horns at its face: the cephalic fins, curled forward)
      const r0 = k.surf(0.03, s * 1.35, 1), r1 = k.surf(0.07, s * 1.45, 1);
      k.strip([r0, r1], [[0.56, r0[1] - 0.01, s * 0.12], [0.54, r1[1] - 0.03, s * 0.16]], { ...finCols(c, 0.3), axis: [0, 1, 0], amp: 0.02, rays: 0 });
    }
    median(k, c, 0.78, 0.86, 0.06, { rake: 0.4 });
    k.rod([[-0.47, 0, 0], [-0.7, 0, 0], [-0.95, 0, 0], [-1.15, 0, 0]], 0.014, 0.002, rgba(mul(c, 0.35)), 0, { axis: [0, 1, 0.5], amp: 0.06 });
    eyes(k, c, 0.06, 1.48, 0.02);
  },
  eel(k, c) {
    k.skin((u, a) => rgba(counter(mul(c, 0.55), a, 0.4, 0.4)));
    for (const s of [1, -1]) { // (the pouch: the jaws far bigger than the body, the skin between them)
      const root = [], edge = [];
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        root.push([0.42 + 0.22 * t, 0.03 - 0.012 * t, s * 0.01]);
        edge.push([0.42 + 0.2 * t, -0.035 - 0.13 * Math.sin(Math.PI * t * 0.85), s * (0.012 + 0.06 * Math.sin(Math.PI * t))]);
      }
      k.strip(root, edge, { c0: rgba(mul(c, 0.35), 0.95), c1: rgba(mix(c, W, 0.2), 0.8), axis: [0, 0, 1], amp: 0.012, rays: 0.15 });
      k.rod(edge, 0.006, 0.004, rgba(mix(c, W, 0.35)));
    }
    k.rod([[0.42, 0.035, 0], [0.53, 0.03, 0], [0.64, 0.02, 0]], 0.009, 0.005, rgba(mix(c, W, 0.35)));
    median(k, c, 0.35, 0.98, 0.016, { n: 14, shape: () => 1, rake: 0.1, offU: 10 });
    median(k, c, 0.5, 0.98, 0.014, { n: 10, shape: () => 1, rake: 0.1, offU: 10, belly: true });
    k.rod([[-0.47, 0, 0], [-0.6, 0, 0], [-0.75, 0, 0], [-0.88, 0, 0]], 0.006, 0.002, rgba(mul(c, 0.4)));
    k.ball([-0.89, 0, 0], 0.012, 3, () => rgba(mix(c, W, 0.45))); // (the light at its tail's end)
    eyes(k, c, 0.035, 1.0, 0.009, { iris: 0.7 });
  },
  angler(k, c) {
    const m = mouth(0.12, -0.75, 0.05);
    k.skin((u, a) => rgba(m(u, a, counter(c, a, 0.5, 0.45))));
    for (const sd of [1, -1]) for (let j = 0; j < 4; j++) { // (the teeth: along both lips, long, leaning in)
      const u = 0.015 + 0.028 * j, up = k.surf(u, sd * 1.5, 1), lo = k.surf(u, sd * 2.42, 1), L = 0.075 - 0.01 * j;
      k.cone(up, [0.25, -1, -sd * 0.35], 0.012, L, rgba(mix(c, W, 0.75)), 0, 3);
      k.cone(lo, [0.25, 1, -sd * 0.35], 0.011, L * 0.85, rgba(mix(c, W, 0.75)), 0, 3);
    }
    const stalk = [k.surf(0.14, 0, 1), [0.42, 0.48, 0], [0.55, 0.56, 0], [0.66, 0.5, 0]];
    k.rod(stalk, 0.012, 0.006, rgba(mul(c, 0.6)), 0, { axis: [0, 1, 0.4], amp: 0.03 });
    k.ball([0.68, 0.47, 0], 0.05, 3, () => rgba(mix(c, W, 0.7)), [0, 0.03, 0.012, 2]); // (the lure, lit)
    pair(k, c, 0.4, 1.9, 0.1, 0.09, { rays: 0.45, round: 0.4 });
    median(k, c, 0.68, 0.82, 0.08, { rays: 0.4 });
    median(k, c, 0.7, 0.82, 0.07, { belly: true, rays: 0.4 });
    caudal(k, c, 'fan', 0.16, 0.12, { rays: 0.45 });
    eyes(k, c, 0.17, 0.75, 0.025, { iris: 0.3 });
  },
  catfish(k, c) {
    const m = mouth(0.05, -0.35, 0.05);
    k.skin((u, a) => {
      const blot = Math.sin(u * 37 + Math.sin(a * 3) * 2) * Math.sin(a * 5 + u * 11); // (the wels's mottle)
      return rgba(m(u, a, mul(counter(c, a, 0.45, 0.6), 0.85 + 0.2 * (Math.cos(a) > -0.3 ? blot : 0))));
    });
    median(k, c, 0.28, 0.34, 0.05);
    median(k, c, 0.45, 0.96, 0.05, { n: 16, belly: true, shape: (t) => Math.min(1, t * 6) * (1 - 0.3 * t), rake: 0.15, offU: 10, amp: 0.025 });
    pair(k, c, 0.17, 2.3, 0.11, 0.08, { axis: [0, 1, 0.3] });
    pair(k, c, 0.44, 2.7, 0.07, 0.05);
    caudal(k, c, 'fan', 0.11, 0.07);
    for (const s of [1, -1]) {
      k.rod([[0.47, 0.03, s * 0.1], [0.42, 0.04, s * 0.22], [0.3, 0.02, s * 0.32], [0.16, -0.02, s * 0.36], [0.04, -0.05, s * 0.36]], 0.008, 0.002, rgba(mul(c, 0.4)), 0, { axis: [0, 1, 0], amp: 0.06, off: s });
      for (const z of [0.03, 0.07]) k.rod([[0.45, -0.07, s * z], [0.42, -0.12, s * z * 1.2], [0.37, -0.15, s * z * 1.4]], 0.004, 0.0015, rgba(mix(c, W, 0.35)), 0, { axis: [0, 0, 1], amp: 0.02, off: z * 40 });
    }
    eyes(k, c, 0.08, 0.85, 0.015);
  },
  leviathan(k, c, bands) {
    const at = (u) => { const f = THREE.MathUtils.clamp(u * bands.length - 0.5, 0, bands.length - 1), i = Math.min(bands.length - 2, Math.floor(f)), t = ss(f - i, 0.3, 0.7); return { col: mix(bands[i], bands[i + 1], t), seam: 1 - Math.abs(t - 0.5) * 2 }; };
    k.skin((u, a) => { const b = at(u); return rgba(mul(counter(b.col, a, 0.4, 0.55), 1 + 0.5 * b.seam * ss(u, 0.1, 0.2))); }); // (its seams lit where one feeling gives on to the next)
    const bone = (u) => rgba(mix(at(u).col, W, 0.6));
    for (const [a, n, s] of [[0, 13, 0.024], [1.6, 16, 0.017], [-1.6, 16, 0.017], [2.4, 12, 0.014], [-2.4, 12, 0.014]]) for (let i = 0; i < n; i++) {
      const u = 0.12 + (0.72 * i) / (n - 1), p = k.surf(u, a, 0.97), yo = k.at(k.B.yo, u);
      k.cone(p, [0.25, p[1] - yo, p[2]], s, s * 1.2, bone(u), 0, 4);
    }
    k.cone([0.46, -0.005, 0], [1, -0.08, 0], 0.035, 0.14, rgba(counter(bands[0], 0.3, 0.6, 0.6)), 0, 6); // (the snout)
    for (const z of [-0.025, -0.008, 0.008, 0.025]) k.rod([[0.53, -0.02, z], [0.52, -0.06, z * 1.2], [0.5, -0.09, z * 1.3]], 0.004, 0.002, bone(0), 0, { axis: [0, 0, 1], amp: 0.015, off: z * 90 });
    pair(k, bands[1], 0.2, 2.2, 0.12, 0.09);
    pair(k, bands[3], 0.62, 2.6, 0.07, 0.05);
    median(k, bands[4], 0.78, 0.88, 0.07);
    median(k, bands[4], 0.8, 0.88, 0.06, { belly: true });
    caudal(k, bands[4], 'hetero', 0.24, 0.1);
    eyes(k, bands[0], 0.1, 1.1, 0.014);
  },
  sculpin(k, c) {
    const m = mouth(0.05, -0.5, 0.15);
    k.skin((u, a) => rgba(m(u, a, counter(c, a, 0.5, 0.5))));
    const pale = rgba(mix(c, W, 0.72), 0.95), dark = rgba(mul(c, 0.35));
    for (let i = 0; i < 16; i++) { // Gall's curds: a dark bump of every size with a pale skin on it (the paint's curd and its skin)
      const u = 0.1 + 0.68 * markHash(i, 1), a = (markHash(i, 2) - 0.5) * Math.PI * 1.7, r = 0.014 + 0.026 * markHash(i, 3) ** 1.6;
      const p = k.surf(u, a, 0.97), yo = k.at(k.B.yo, u), o = new THREE.Vector3(0, p[1] - yo, p[2]).normalize();
      k.ball(p, r, 0, () => dark, null, 6, 4);
      k.ball([p[0], p[1] + o.y * r * 0.55, p[2] + o.z * r * 0.55], r * 0.55, 0, () => pale, null, 6, 4);
    }
    pair(k, c, 0.2, 2.0, 0.14, 0.27, { n: 6, rootLen: 0.14, rays: 0.4, drop: 0.12, round: 0.45, back: 0.7 });
    median(k, c, 0.2, 0.38, 0.07, { rays: 0.5 });
    median(k, c, 0.42, 0.76, 0.06, { n: 8, shape: (t) => Math.min(1, t * 5) });
    median(k, c, 0.5, 0.76, 0.05, { n: 7, belly: true, shape: (t) => Math.min(1, t * 5) });
    caudal(k, c, 'fan', 0.14, 0.1);
    eyes(k, c, 0.1, 0.55, 0.028, { iris: 0.45 });
  },
  pike(k, c) {
    const char = mul(c, 0.45), m = mouth(0.05, -0.3, 0.1); // (Fury's skin is charred: its cracks of light below)
    k.skin((u, a) => rgba(m(u, a, counter(char, a, 0.45, 0.35))), 0.5);
    median(k, char, 0.66, 0.8, 0.09, { rake: 0.3 });
    median(k, char, 0.68, 0.8, 0.07, { belly: true, rake: 0.3 });
    pair(k, char, 0.22, 2.3, 0.08, 0.05);
    pair(k, char, 0.5, 2.7, 0.07, 0.045);
    caudal(k, char, 'fork', 0.2, 0.12);
    eyes(k, c, 0.12, 1.0, 0.022, { iris: 0.6 });
    // Fury's cracks: ribbons of light laid on the charred skin, a few zigzags each branching once (kind 4: faded below a pixel)
    const Wd = 0.022, hot = rgba(mix(c, W, 0.55), 0.9);
    const rAt = (u) => Math.max(1e-3, (k.at(k.B.h, u) + k.at(k.B.w, u)) * 0.5 * k.pinch(u));
    const walk = (u, a, hd, steps, seg, id) => {
      const L = [], Rr = [];
      for (let s = 0; s <= steps; s++) {
        const r = rAt(u), du = -Math.sin(hd) * Wd * 0.5, da = (Math.cos(hd) * Wd * 0.5) / r;
        L.push(k.v(k.surf(u - du, a - da, 1.04), hot, null, 4, 0, k.surf(u, a, 1).map((x, j) => (j ? x : 0))));
        Rr.push(k.v(k.surf(u + du, a + da, 1.04), hot, null, 4, 0, k.surf(u, a, 1).map((x, j) => (j ? x : 0))));
        hd += (markHash(id, s + 7) - 0.5) * 1.6;
        u = THREE.MathUtils.clamp(u + Math.cos(hd) * seg, 0.08, 0.86); a += (Math.sin(hd) * seg) / r;
      }
      for (let s = 0; s < steps; s++) { k.tri(L[s], L[s + 1], Rr[s]); k.tri(Rr[s], L[s + 1], Rr[s + 1]); }
    };
    for (let i = 0; i < 7; i++) {
      const u0 = 0.14 + 0.62 * markHash(i, 11), a0 = (markHash(i, 12) - 0.5) * Math.PI * 2, hd = markHash(i, 13) * Math.PI * 2;
      walk(u0, a0, hd, 4, 0.05, i);
      walk(u0, a0, hd + 1.9, 2, 0.04, i + 31);
    }
  },
};
BUILD.pike.crackW = 0.022;

const CACHE = new Map();
/** A species' body: built once for its body and feeling, its geometry shared by every copy (never disposed by a fish). feel: a THREE.Color;
 *  bands: the legend's five (THREE.Colors), head to tail. */
export function fishBody(key, feel, bands = null) {
  const B = BODIES[key] ? key : 'carp', id = `${B}:${feel.getHexString()}`;
  if (CACHE.has(id)) return CACHE.get(id);
  const k = new FishKit(BODIES[B]), c = [feel.r, feel.g, feel.b];
  BUILD[B](k, c, (bands || [feel]).map((b) => [b.r, b.g, b.b]).concat(bands ? [] : [c, c, c, c]));
  const out = { geo: k.geometry(), motion: BODIES[B], crackW: BUILD[B].crackW || 0, key: B };
  CACHE.set(id, out);
  return out;
}
