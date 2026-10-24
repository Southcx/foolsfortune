// ---------------------------------------------------------------------------------------
// THE SAFARI'S EGREGORES, THE SMALLER FIVE: each species' body as built on the egregore kit (vfx/opensea/egregorekit.js) and how it
// lives (its idle, its habits), for vfx/opensea/egregorebodies.js. The great ones are in egregoreshapes2.js. A shape is built in metres
// at its own length `L` (its EGREGORES `size`), +Z its head, +Y up, the waterline at y 0, centred along Z so its middle bends round a turn.
//   sealFolk    the selkie: a grey seal bottling upright in the swell, big wet eyes, its rosettes and the seam at its neck where the
//               skin comes off lit in Grief (the Orkney and Faroe tales: the seal-wife whose skin is hidden)
//   seaLights   St Elmo's fire, corposants: seven pale flames hanging over the water, flickering, their light ringed on the sea
//   horseHerd   the hippocamp: a horse's head, arched neck and paddling forelegs with webbed fins for hooves, a fish's tail curling
//               up behind, its crest a fish's dorsal fin in Mirth (the Greek mosaics of Poseidon's team, the Trevi Fountain's horses)
//   fishPeople  the ningyo: a koi's body under a pale human head and shoulders, long black hair down its back, its fins trailing
//               in Desire (Edo-period ningyo prints and the mummified ningyo of the temples)
//   wolfWhale   the akhlut: an orca's body, tall dorsal and white saddle, ending in a wolf's head with its ruff in Fury (the Yup'ik
//               and Inupiat orca-wolf, which comes out of the sea as a wolf and leaves tracks into the water)
// A shape: { L, wave: [height, waves a length, vertical share], waveW (its weight), fin: [rate, size, slow rate, slow size], depth
// (how far it dives), build(k, col, rng), idle(t, o), habits: { name: [real seconds, (k, o, e) => ...] } }. `o` is the carriage asked
// this frame: { y, rx (nose down +), ry, rz, sxz, glow, show, vanish, wave, fin }; `e` the habit's envelope (0 .. 1 .. 0).
//
// Prior art: the myths named above; the rail's Egregores (vfx/railfoes/egregores.js: the Brine dress); real animals' anatomy for the
// silhouettes (a grey seal's Roman nose, an orca's saddle patch, a horse's crest and a carp's fins), because a plate has to read.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { loft, limb, fin, flat } from './egregorekit.js';
import { noise2 } from './isletkits/kit.js';

const PI = Math.PI;
/** The Brine dress (sRGB hex): the wet grey-blue hide, its dark, the pale belly, pearl, ink, an orca's white and its saddle. */
export const B = { hide: 0x4a5a66, hideD: 0x2c363e, belly: 0xc8ccc4, pearl: 0xe8eef0, ink: 0x15181c, white: 0xe6e8e2, saddle: 0x7a8288, mouth: 0x1a1418, tooth: 0xd8d2c0, barn: 0xb4ae9c };
export const ball = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
export const cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n);
export const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** Countershaded: the hide above a line, the belly under it, a dapple of the dark in the hide. */
export const shade = (line, top = B.hide, under = B.belly, dap = 0) => (x, y, z) => (y < line ? under : dap && noise2(x * dap + 3, z * dap + y * dap) > 0.62 ? B.hideD : top);

export const SHAPES_SMALL = {
  sealFolk: {
    L: 2, wave: [0.12, 3.5, 0], waveW: (x, y, z) => clamp01((-z - 0.2) / 0.8) ** 1.5, fin: [2.2, 1, 0.55, 1], depth: 1.4,
    build(k, col, rng) {
      k.add(loft([[-0.98, 0.03, 0.025, -0.02], [-0.85, 0.11, 0.08, -0.05], [-0.6, 0.22, 0.18, -0.07], [-0.25, 0.3, 0.26, -0.06], [0.1, 0.31, 0.27, -0.04], [0.36, 0.24, 0.22, 0.02], [0.52, 0.16, 0.16, 0.13], [0.62, 0.13, 0.13, 0.26], [0.7, 0.12, 0.12, 0.34]], 14), { c: shade(-0.14, B.hide, B.belly, 7) });
      const head = (x, y) => [(y - 0.2) * 0.22, 0, 0, 100]; // (the head turning to look about: the slow channel)
      k.add(ball(1, 14, 10), { c: shade(0.3, B.hide, B.belly, 9), p: [0, 0.37, 0.72], s: [0.15, 0.14, 0.18], fin: head });
      k.add(ball(1, 12, 8), { c: shade(0.3, B.hide, B.belly), p: [0, 0.335, 0.88], s: [0.085, 0.078, 0.12], fin: head }); // (the Roman nose)
      k.add(ball(0.03, 6, 4), { c: B.ink, p: [0, 0.35, 1.0], fin: head });
      for (const s of [-1, 1]) {
        k.add(ball(0.036, 8, 6), { c: B.ink, p: [s * 0.095, 0.41, 0.83], fin: head });
        k.add(ball(0.011, 4, 3), { c: B.pearl, glow: 0.9, p: [s * 0.1, 0.425, 0.86], fin: head }); // (the wet catchlight)
        for (let i = 0; i < 3; i++) k.add(new THREE.BoxGeometry(0.16, 0.004, 0.004), { c: B.pearl, p: [s * 0.1, 0.31 - i * 0.012, 0.93], r: [0, s * 0.25, s * (i - 1) * 0.12], fin: head });
        k.add(flat([[0, 0.06], [s * 0.2, -0.04], [s * 0.25, -0.15], [s * 0.04, -0.12]], 0.025), { c: B.hideD, p: [s * 0.22, -0.1, 0.32], r: [0, 0, s * 0.45], fin: (x) => [0, (Math.abs(x) - 0.22) * 0.5, 0.05, s > 0 ? 0 : PI] });
        k.add(flat([[0, 0], [s * 0.14, -0.22], [s * 0.04, -0.3], [s * -0.03, -0.2]], 0.02), { c: B.hideD, p: [s * 0.03, -0.02, -0.92], r: [0, s * 0.25, 0], mark: 0.25 });
      }
      k.add(new THREE.TorusGeometry(0.15, 0.012, 4, 20), { c: B.pearl, mark: 1, p: [0, 0.2, 0.56], r: [-0.95, 0, 0] }); // (the seam where the skin comes off)
      for (let i = 0; i < 11; i++) k.add(ball(1, 6, 4), { c: B.hideD, mark: 1, p: [rng.range(-0.14, 0.14), 0.2, rng.range(-0.55, 0.3)], s: [0.04, 0.012, 0.05] }); // (the rosettes)
    },
    idle(t, o) { o.y = 0.035 * Math.sin(t * 1.1); o.rz = 0.07 * Math.sin(t * 0.7); o.rx = -0.03 + 0.03 * Math.sin(t * 1.1 + 1); o.wave = 0.5; },
    habits: {
      bask: [6, (k, o, e) => { o.rz += 0.75 * e; o.rx -= 0.08 * e; o.fin = 0.4; }],
      shed: [5, (k, o, e) => { o.glow += 1.6 * e; o.y += 0.1 * e; o.rx -= 0.25 * e; }],
    },
  },

  seaLights: {
    L: 1, wave: [0.05, 9, 0], waveW: 0, fin: [6, 1, 0.8, 1], depth: 0,
    build(k, col, rng) {
      const pale = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.45).getHex();
      for (let i = 0; i < 7; i++) {
        const a = rng() * PI * 2, d = rng.range(0.05, 0.42), x = Math.cos(a) * d, z = Math.sin(a) * d, y = rng.range(0.6, 1.8), r = rng.range(0.06, 0.12);
        const drift = [rng.range(-0.15, 0.15), rng.range(0.08, 0.2), rng.range(-0.15, 0.15), 100 + rng() * 6.28];
        const g = ball(r, 10, 8), P = g.attributes.position.array; // (a flame: a drop drawn up into a tongue)
        for (let j = 0; j < P.length; j += 3) if (P[j + 1] > 0) { const h = P[j + 1] / r; P[j + 1] *= 2.6; P[j] *= 1 - 0.75 * h; P[j + 2] *= 1 - 0.75 * h; }
        g.computeVertexNormals();
        k.add(g, { c: col, glow: 1.2, mark: 0.6, p: [x, y, z], fin: drift, wave: (xx, yy) => clamp01((yy - y) / (r * 2.4)) });
        k.add(ball(r * 0.45, 6, 4), { c: pale, glow: 1.6, p: [x, y, z], fin: drift });
      }
      for (let i = 0; i < 12; i++) k.add(new THREE.IcosahedronGeometry(0.015, 0), { c: col, glow: 1.4, p: [rng.range(-0.5, 0.5), rng.range(0.3, 2.2), rng.range(-0.5, 0.5)], fin: [rng.range(-0.2, 0.2), rng.range(0.1, 0.35), rng.range(-0.2, 0.2), 100 + rng() * 6.28] });
      k.add(new THREE.TorusGeometry(0.45, 0.025, 3, 28), { c: col, glow: 0.5, mark: 1, p: [0, 0.02, 0], r: [PI / 2, 0, 0] }); // (their light on the water)
      k.add(new THREE.TorusGeometry(0.22, 0.015, 3, 20), { c: col, glow: 0.4, mark: 1, p: [0, 0.02, 0], r: [PI / 2, 0, 0] });
    },
    idle(t, o) { o.ry = t * 0.12; o.y = 0.08 * Math.sin(t * 0.8); o.glow = 0.15 * Math.sin(t * 1.3); },
    habits: { gather: [6, (k, o, e) => { o.sxz = 1 - 0.55 * e; o.glow += 1.4 * e; o.y += 0.3 * e; }] },
  },

  horseHerd: {
    L: 3, wave: [0.2, 4, 1], waveW: (x, y, z) => clamp01(-z / 1.3) ** 1.4, fin: [2.4, 1, 0.9, 1], depth: 1.6,
    build(k, col, rng) {
      k.add(loft([[-1.3, 0.04, 0.05, 0.55], [-1.15, 0.07, 0.08, 0.34], [-0.95, 0.1, 0.12, 0.06], [-0.65, 0.14, 0.16, -0.14], [-0.3, 0.2, 0.22, -0.15], [0, 0.27, 0.3, -0.03], [0.35, 0.3, 0.36, 0.12], [0.62, 0.27, 0.36, 0.28], [0.78, 0.18, 0.26, 0.42]], 14), { c: shade(-0.12, B.hide, B.belly, 6) });
      k.add(fin([[-1.28, 0.52], [-1.58, 0.98], [-1.46, 0.62], [-1.62, 0.28], [-1.3, 0.44]], 0.03), { c: B.hideD, mark: 0.9 }); // (the tail's fork, standing)
      k.add(fin([[-0.15, 0.1], [-0.35, 0.32], [-0.6, 0.12], [-0.75, 0.0], [-0.5, -0.02]], 0.025), { c: B.hideD, mark: 0.8 }); // (a dorsal on the fish's back)
      const N0 = new THREE.Vector3(0, 0.45, 0.7), N1 = new THREE.Vector3(0, 0.88, 0.84), N2 = new THREE.Vector3(0, 1.14, 0.98);
      k.add(limb([N0.toArray(), N1.toArray(), N2.toArray()], 0.21, 0.12, 10, 9), { c: B.hide, s: [0.75, 1, 1], p: [0, 0, 0] });
      const head = loft([[-0.03, 0.06, 0.07, 0], [0.05, 0.1, 0.13, 0], [0.2, 0.095, 0.12, -0.02], [0.38, 0.072, 0.09, -0.05], [0.5, 0.068, 0.075, -0.06], [0.57, 0.04, 0.04, -0.06]], 10);
      k.add(head, { c: shade(-0.08, B.hide, B.hideD), p: [0, 1.22, 1.0], r: [1.0, 0, 0] });
      for (const s of [-1, 1]) {
        k.add(cone(0.035, 0.15, 5), { c: B.hideD, p: [s * 0.05, 1.35, 0.97], r: [-0.3, 0, s * -0.2] }); // (the ears)
        k.add(ball(0.028, 6, 4), { c: col, glow: 1, p: [s * 0.085, 1.21, 1.1] });
        k.add(ball(0.016, 4, 3), { c: B.ink, p: [s * 0.035, 0.77, 1.31] }); // (the nostrils)
        const legFin = (x, y, z) => { const w = clamp01((z - 0.7) / 0.45); return [0, 0.14 * w, 0.18 * w, s > 0 ? 0 : PI]; };
        k.add(limb([[s * 0.16, 0.22, 0.72], [s * 0.17, 0.16, 0.98], [s * 0.17, -0.04, 1.1]], 0.075, 0.042, 8, 6), { c: B.hide, fin: legFin });
        k.add(flat([[0, 0.02], [s * 0.1, 0.1], [s * 0.04, 0.2], [s * -0.05, 0.1]], 0.015), { c: B.hideD, mark: 0.9, p: [s * 0.17, -0.06, 1.1], fin: legFin }); // (a webbed fin for a hoof)
      }
      // the crest: a fish's dorsal fin down the arched neck, scalloped (the mane)
      const back = new THREE.Vector3(0, 0.41, -0.91), out = [], tips = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6, a = N0.clone().lerp(N1, Math.min(1, t * 2)).lerp(N2, Math.max(0, t * 2 - 1)); out.push([a.z + back.z * 0.08, a.y + back.y * 0.08]); tips.push([a.z + back.z * (0.3 - 0.1 * t) + 0.03, a.y + back.y * (0.3 - 0.1 * t)]); }
      const crest = [...out, [1.05, 1.32]]; for (let i = 6; i >= 0; i--) { crest.push(tips[i]); if (i) crest.push([(tips[i][0] + out[i - 1][0]) / 2 - 0.02, (tips[i][1] + out[i - 1][1]) / 2]); }
      k.add(fin(crest, 0.03), { c: B.hideD, mark: 1, fin: (x, y) => [0.08 * clamp01(y - 0.5), 0, 0, 100] });
      for (let i = 0; i < 8; i++) k.add(ball(1, 5, 4), { c: B.pearl, mark: 1, p: [rng.range(-0.1, 0.1) + (i % 2 ? 0.17 : -0.17), rng.range(-0.08, 0.06), rng.range(-0.85, -0.1)], s: [0.012, 0.025, 0.035] });
    },
    idle(t, o) { o.rx = 0.07 * Math.sin(t * 2.4); o.y = 0.05 * Math.sin(t * 2.4 + 1); },
    habits: {
      gallop: [4, (k, o, e) => { o.fin = 1 + 0.9 * e; o.wave = 1 + 0.8 * e; o.y += 0.1 * e; o.rx += 0.06 * e * Math.sin(k * 40); }],
      rear: [3, (k, o, e) => { o.rx -= 0.55 * e; o.y += 0.35 * e; o.fin = 1 + 1.2 * e; }],
    },
  },

  fishPeople: {
    L: 1.5, wave: [0.06, 4.5, 0], waveW: (x, y, z) => clamp01((0.1 - z) / 0.72) ** 1.3, fin: [3, 1, 0.9, 1], depth: 1.2,
    build(k, col, rng) {
      const koi = (x, y, z) => (y < -0.1 ? 0xeee8dc : noise2(z * 7 + 1, x * 7 + y * 4) > 0.55 ? 0xb84a32 : 0xd8cfb8); // (kohaku: red patches on white)
      const patch = (x, y, z) => (y >= -0.1 && noise2(z * 7 + 1, x * 7 + y * 4) > 0.55 ? 1 : 0);
      k.add(loft([[-0.62, 0.02, 0.035, 0.0], [-0.5, 0.06, 0.09, 0.0], [-0.3, 0.11, 0.17, -0.03], [-0.05, 0.14, 0.2, -0.05], [0.15, 0.15, 0.19, -0.04], [0.3, 0.12, 0.14, -0.01], [0.4, 0.08, 0.09, 0.02]], 12), { c: koi, mark: patch });
      k.add(fin([[-0.58, 0], [-0.84, 0.2], [-0.77, 0.02], [-0.86, -0.18]], 0.012), { c: 0xe8dcc8, mark: 0.8 });
      k.add(fin([[0.05, 0.12], [-0.05, 0.24], [-0.4, 0.13], [-0.42, 0.07]], 0.01), { c: 0xe8dcc8, mark: 0.7 });
      for (const s of [-1, 1]) k.add(flat([[0, 0.03], [s * 0.2, -0.12], [s * 0.16, -0.2], [s * 0.02, -0.05]], 0.008), { c: 0xe8dcc8, mark: 0.8, p: [s * 0.12, -0.08, 0.17], fin: (x) => [0, (Math.abs(x) - 0.12) * 0.6, 0, s > 0 ? 0 : 1.2] });
      // the human part: shoulders, a neck, a pale face, its long black hair; its body swaying as it sings (the slow channel)
      const sway = (x, y) => [clamp01(y) * 0.12, 0, 0, 100];
      k.add(ball(1, 12, 8), { c: B.pearl, p: [0, 0.14, 0.33], s: [0.17, 0.12, 0.1], fin: sway });
      k.add(cyl(0.04, 0.045, 0.14, 8), { c: B.pearl, p: [0, 0.29, 0.34], fin: sway });
      k.add(ball(1, 14, 10), { c: B.pearl, p: [0, 0.43, 0.36], s: [0.085, 0.1, 0.09], fin: sway });
      k.add(ball(1, 12, 8), { c: B.ink, p: [0, 0.47, 0.34], s: [0.092, 0.095, 0.085], fin: sway }); // (the hair over the crown)
      for (const s of [-1, 1]) {
        k.add(ball(0.014, 6, 4), { c: col, glow: 1.2, p: [s * 0.032, 0.44, 0.44], fin: sway });
        k.add(limb([[s * 0.15, 0.17, 0.33], [s * 0.21, 0.06, 0.42], [s * 0.12, 0.01, 0.52]], 0.028, 0.02, 8, 5), { c: B.pearl, fin: sway });
      }
      k.add(new THREE.BoxGeometry(0.03, 0.008, 0.01), { c: col, glow: 0.6, p: [0, 0.395, 0.445], fin: sway }); // (the lips)
      for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 1.6; k.add(new THREE.BoxGeometry(0.04, 0.008, 0.46), { c: B.ink, mark: 0.2, p: [Math.sin(a) * 0.06, 0.29 - Math.abs(a) * 0.03, 0.2], r: [-0.9, a * 0.25, 0], fin: [rng.range(-0.04, 0.04), 0.02, 0, 100 + i * 0.5] }); }
      for (let i = 0; i < 6; i++) k.add(ball(1, 5, 4), { c: B.pearl, mark: 1, p: [(i % 2 ? 1 : -1) * 0.13, -0.02, -0.35 + i * 0.1], s: [0.008, 0.012, 0.02] });
    },
    idle(t, o) { o.y = 0.02 * Math.sin(t * 1.3); o.rz = 0.03 * Math.sin(t * 0.9); o.wave = 0.6; },
    habits: {
      sing: [5, (k, o, e) => { o.glow += 1.3 * e * (0.7 + 0.3 * Math.sin(k * 30)); o.rx -= 0.08 * e; o.fin = 1.5; }],
      dive: [2.5, (k, o, e) => { o.rx += 0.9 * e; o.y -= 0.5 * e; o.wave = 2; }],
    },
  },

  wolfWhale: {
    L: 8, wave: [0.5, 3, 1], waveW: (x, y, z) => clamp01((-z - 0.5) / 3) ** 1.6, fin: [1.6, 1, 0.5, 1], depth: 4,
    build(k, col, rng) {
      const orca = (x, y, z) => (y < -0.4 ? B.white : z < -0.5 && z > -2.6 && y < 0.15 && y > -0.45 && Math.abs(x) > 0.45 ? B.white : z < -0.3 && z > -1.5 && y > 0.85 ? B.saddle : B.ink);
      const whiteMark = (x, y, z) => (orca(x, y, z) === B.white ? 0.3 : 0);
      k.add(loft([[-3.55, 0.1, 0.08, 0.1], [-3.0, 0.3, 0.35, 0.05], [-2.2, 0.6, 0.7, 0.0], [-1.0, 1.0, 1.1, 0.0], [0.3, 1.15, 1.25, 0.05], [1.4, 1.05, 1.15, 0.1], [2.2, 0.85, 0.95, 0.28], [2.75, 0.7, 0.78, 0.55]], 16), { c: orca, mark: whiteMark });
      k.add(fin([[0.1, 0.95], [-0.42, 3.0], [-0.68, 2.95], [-1.15, 0.95]], 0.12), { c: B.ink, mark: (x, y) => (y > 1.6 ? 0.5 : 0) });
      k.add(flat([[0, 0], [1.15, -0.6], [1.25, -0.95], [0.3, -0.62], [0, -0.75], [-0.3, -0.62], [-1.25, -0.95], [-1.15, -0.6]], 0.08), { c: B.ink, mark: 0.35, p: [0, 0.1, -3.45] });
      for (const s of [-1, 1]) k.add(flat([[0, 0.25], [s * 0.85, -0.3], [s * 0.6, -0.55], [0, -0.2]], 0.06), { c: B.ink, p: [s * 0.9, -0.45, 1.5], r: [0, 0, s * -0.45], fin: (x) => [0, (Math.abs(x) - 0.9) * 0.4, 0, s > 0 ? 0 : PI] });
      // the wolf: a broad skull, its long muzzle, the jaw a little open on its fangs, tall ears, the ruff round its neck
      const howl = (x, y, z) => [0, clamp01(z - 2.2) * 0.12, 0, 100];
      k.add(ball(1, 16, 12), { c: shade(0.95, B.hide, B.belly, 3), p: [0, 1.25, 3.0], s: [0.62, 0.58, 0.72], fin: howl });
      k.add(loft([[3.2, 0.36, 0.34, 1.12], [3.6, 0.25, 0.24, 1.03], [3.95, 0.18, 0.16, 1.0], [4.15, 0.1, 0.1, 1.0]], 10), { c: B.hide, fin: howl });
      k.add(loft([[3.1, 0.3, 0.16, 0.8], [3.6, 0.2, 0.1, 0.76], [4.0, 0.12, 0.06, 0.8]], 10), { c: B.belly, fin: howl });
      k.add(new THREE.BoxGeometry(0.34, 0.1, 0.8), { c: B.mouth, p: [0, 0.9, 3.6], fin: howl });
      k.add(ball(0.07, 6, 4), { c: B.ink, p: [0, 1.04, 4.22], fin: howl });
      for (const s of [-1, 1]) {
        k.add(ball(0.07, 8, 6), { c: col, glow: 1.4, p: [s * 0.3, 1.36, 3.42], fin: howl });
        k.add(cone(0.17, 0.62, 5), { c: B.hideD, p: [s * 0.32, 1.85, 2.8], r: [-0.25, 0, s * -0.25], fin: howl });
        for (const [z, y, r] of [[3.85, 0.92, PI], [3.8, 0.84, 0]]) k.add(cone(0.035, 0.15, 4), { c: B.tooth, p: [s * 0.13, y, z], r: [r, 0, 0], fin: howl });
      }
      for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; if (Math.sin(a) < -0.6) continue; k.add(cone(0.16, 0.65, 4), { c: B.hideD, mark: 0.6, p: [Math.cos(a) * 0.72, 1.1 + Math.sin(a) * 0.62, 2.45], r: [PI / 2 - 0.5, 0, -a + PI / 2], fin: howl }); }
      for (let i = 0; i < 12; i++) k.add(ball(1, 5, 4), { c: B.pearl, glow: 0.2, mark: 1, p: [(i % 2 ? 1 : -1) * rng.range(0.85, 1.05), rng.range(0.1, 0.5), rng.range(-2.0, 1.6)], s: [0.04, 0.06, 0.09] });
    },
    idle(t, o) { o.y = -0.55 + 0.12 * Math.sin(t * 0.9); o.rx = 0.02 * Math.sin(t * 0.9 + 1); },
    habits: {
      breach: [3.2, (k, o) => { const a = Math.sin(PI * k); o.y += 6.5 * a; o.rx = -0.9 * (1 - 2 * k) * a; o.wave = 2; o.rz += 0.3 * a; }],
      howl: [3.5, (k, o, e) => { o.rx -= 0.32 * e; o.y += 0.8 * e; o.glow += 1.6 * e; }],
    },
  },
};
