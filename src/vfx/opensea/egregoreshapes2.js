// ---------------------------------------------------------------------------------------
// THE SAFARI'S EGREGORES, THE GREAT SIX: as egregoreshapes.js (its header has the shape's form), for the ones a plate takes from far off.
//   seaSerpent    the sea serpent: humps running down a long body through the surface, a horse's long skull with horns and a mane
//                 (Olaus Magnus' Carta Marina, 1539; the Loch Ness photographs' humps); its fight is SeaSerpentBody's (seaserpentbody.js)
//   seaMonk       the umibozu: a vast smooth black head and shoulders risen out of a calm sea, two round pale eyes ringed in Dread,
//                 the sea running off it (Toriyama Sekien's Konjaku Hyakki Shūi, 1781)
//   islandWhale   the aspidochelone: a whale whose back is an islet, sand, turf, palms and rocks on it, its eye low at the water, its
//                 throat grooves lit in Wonder, its fluke behind and its spout (the Physiologus, Sinbad's first voyage, St Brendan's Jasconius)
//   ghostShip     the Flying Dutchman: a pale hull and three masts of tattered sails lit faintly in Grief, its stern lantern; it
//                 vanishes when it is neared (the legend after 1795, Wagner's Der fliegende Holländer)
//   bigSquid      the kraken: a red mantle reared out of the sea, its great eyes at the water, eight arms and two long tentacles arched
//                 round it, writhing, their suckers pale; it inks (Pontoppidan's Natural History of Norway, 1752; Olaus Magnus)
//   worldSerpent  Jormungandr: humps the size of islets running through the sea, a horned dragon's head, a crest down its back in Gall
//                 (the Prose Edda: the serpent that girdles Midgard)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { loft, limb, fin, flat } from './egregorekit.js';
import { hull } from '../railfoes/kit.js';
import { noise2 } from './isletkits/kit.js';
import { B, ball, cone, cyl, clamp01, sm, shade } from './egregoreshapes.js';

const PI = Math.PI;

/** A serpent's head (the sea serpent's and Jormungandr's): a horse's long skull, horns swept back, the jaw open a little, at scale `u`. */
function serpentHead(k, at, u, col, { hide = B.hide, horn = B.hideD, mane = true, bob = null } = {}) {
  const P = (x, y, z) => [at[0] + x * u, at[1] + y * u, at[2] + z * u];
  k.add(ball(1, 14, 10), { c: shade(at[1] - 0.2 * u, hide, B.belly), p: P(0, 0.1, 0.5), s: [0.74 * u, 0.64 * u, 0.9 * u], fin: bob });
  k.add(loft([[0.9, 0.42, 0.36, 0.05], [1.6, 0.32, 0.26, 0.0], [2.3, 0.26, 0.2, -0.04], [2.7, 0.18, 0.15, -0.04]].map(([z, rx, ry, y]) => [at[2] + z * u, rx * u, ry * u, at[1] + y * u]), 10), { c: hide, fin: bob });
  k.add(loft([[0.8, 0.36, 0.14, -0.38], [1.6, 0.26, 0.1, -0.42], [2.4, 0.15, 0.07, -0.36]].map(([z, rx, ry, y]) => [at[2] + z * u, rx * u, ry * u, at[1] + y * u]), 10), { c: B.belly, fin: bob });
  k.add(new THREE.BoxGeometry(0.42 * u, 0.12 * u, 1.6 * u), { c: B.mouth, p: P(0, -0.26, 1.65), fin: bob });
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) k.add(cone(0.05 * u, 0.2 * u, 4), { c: B.tooth, p: P(s * (0.26 - i * 0.03), -0.22, 1.2 + i * 0.28), r: [PI, 0, 0], fin: bob });
  for (const s of [-1, 1]) {
    k.add(ball(0.12 * u, 8, 6), { c: col, glow: 1.4, p: P(s * 0.48, 0.34, 1.0), fin: bob });
    k.add(ball(1, 8, 4), { c: B.hideD, p: P(s * 0.45, 0.44, 0.98), s: [0.2 * u, 0.08 * u, 0.26 * u], fin: bob });
    k.add(limb([P(s * 0.3, 0.55, 0.3), P(s * 0.45, 1.1, -0.3), P(s * 0.5, 1.4, -1.1)], 0.13 * u, 0.02 * u, 8, 6), { c: horn, fin: bob });
    k.add(cone(0.06 * u, 0.6 * u, 5), { c: horn, p: P(s * 0.62, 0.12, 0.25), r: [-1.2, 0, s * 1.0], fin: bob });
  }
  if (mane) k.add(fin([[0.4, 0.6], [-0.7, 1.6], [-0.3, 0.7], [-1.1, 1.05], [-0.8, 0.35], [-1.6, 0.6], [-1.3, 0.05]].map(([z, y]) => [at[2] + z * u, at[1] + y * u]), 0.06 * u), { c: horn, mark: 1, fin: bob });
}

/** A serpent's back: a long loft lying just under the sea (the humps are the vertical wave), its ridge of spines and its spot line. */
function serpentTrunk(k, { z0, z1, r, y, col, rng, spines, top = B.hide, under = B.belly, dap = 0 }) {
  const st = []; for (let i = 0; i <= 10; i++) { const t = i / 10, z = z0 + (z1 - z0) * t, w = (0.25 + 0.75 * sm(0, 0.5, t)) * (t > 0.92 ? 1 - (t - 0.92) * 3 : 1); st.push([z, r * w * 0.9, r * w, y]); }
  k.add(loft(st, 12, 2), { c: shade(y - r * 0.2, top, under, dap) });
  for (let z = z0 + (z1 - z0) * 0.12; z < z1 - r; z += spines) { const w = clamp01((z - z0) / ((z1 - z0) * 0.5)); k.add(cone(r * 0.22 * (0.4 + 0.6 * w), r * 0.9 * (0.4 + 0.6 * w), 4), { c: B.hideD, mark: 0.7, p: [0, y + r * (0.25 + 0.75 * w) * 0.95, z], r: [-0.5, 0, 0], s: [0.35, 1, 1] }); }
  for (let z = z0 + (z1 - z0) * 0.08; z < z1; z += spines * 0.6) for (const s of [-1, 1]) { const w = 0.25 + 0.75 * sm(0, 0.5, (z - z0) / (z1 - z0)); k.add(ball(1, 5, 4), { c: B.pearl, glow: 0.25, mark: 1, p: [s * r * w * 0.86, y + r * w * 0.15, z + rng.range(-0.2, 0.2) * spines], s: [r * 0.05, r * 0.09, r * 0.14] }); }
  void col;
}

/** The island whale's girth along it (its stations), for things set on its hide. */
const WHALE = [[-58, 1.5, 1.2, 0.5], [-50, 4, 3.5, -1], [-38, 10, 7, -3], [-20, 17, 10, -4], [0, 20, 11, -4], [20, 19, 10.5, -4], [38, 15, 8.5, -3.5], [50, 10, 6, -2.5], [57, 4, 3, -1.5]];
const whaleAt = (z) => { for (let i = 0; i < WHALE.length - 1; i++) { const a = WHALE[i], b = WHALE[i + 1]; if (z <= b[0]) { const t = (z - a[0]) / (b[0] - a[0]); return a.map((v, j) => v + (b[j] - v) * t); } } return WHALE[WHALE.length - 1]; };
const TOP = 4.6; // (the islet's level on its back: the hide above it flattened into a plateau)

export const SHAPES_GREAT = {
  seaSerpent: {
    L: 30, wave: [2.2, 13.8, 1], waveW: (x, y, z) => 1 - sm(4.5, 7.5, z), fin: [1.2, 1, 0.45, 1], depth: 7,
    build(k, col, rng) {
      serpentTrunk(k, { z0: -15, z1: 7.5, r: 1.05, y: -1.1, col, rng, spines: 1.1, dap: 0.6 });
      const bob = (x, y) => [0, clamp01((y - 0.5) / 4) * 0.35, 0, 100];
      k.add(limb([[0, -0.9, 6.6], [0, 1.6, 9.4], [0, 3.9, 11.4]], 0.9, 0.62, 12, 10), { c: shade(1.2), fin: bob, wave: (x, y, z) => 1 - sm(5, 8, z) });
      serpentHead(k, [0, 4.3, 11.2], 1.05, col, { bob });
      for (let i = 0; i < 8; i++) { const a = i * 2.3, r = 0.2 + (i % 3) * 0.13; k.add(cone(0.06, 0.09, 5), { c: B.barn, p: [Math.cos(a) * r, 4.95 - r * 0.3, 11.8 + Math.sin(a) * r * 1.4], fin: bob }); }
    },
    idle(t, o) { o.wave = 1; o.y = 0.15 * Math.sin(t * 0.6); },
    habits: {
      coil: [4, (k, o, e) => { o.wave = 1 + 0.7 * e; o.glow += 0.8 * e; }],
      spit: [2.5, (k, o, e) => { o.rx -= 0.18 * e; o.y += 0.6 * e; o.glow += 1.6 * e; }],
    },
  },

  seaMonk: {
    L: 12, wave: [0, 0, 0], waveW: 0, fin: [0.4, 1, 0.3, 1], depth: 10,
    build(k, col, rng) {
      const breathe = (x, y, z) => [x * 0.025, clamp01(y / 6) * 0.25, z * 0.02, 100];
      const skin = (x, y, z) => (y > 4.8 && noise2(x * 0.6, z * 0.6) > 0.5 ? B.hideD : B.ink);
      k.add(ball(1, 28, 18), { c: skin, p: [0, 1.2, 0], s: [4.2, 5.4, 3.9], fin: breathe });
      k.add(ball(1, 24, 10), { c: B.ink, p: [0, -1.2, -0.4], s: [6.4, 2.2, 4.3], fin: breathe }); // (its shoulders at the water)
      for (const s of [-1, 1]) {
        k.add(ball(1, 14, 10), { c: B.pearl, glow: 0.7, p: [s * 1.55, 3.3, 3.25], s: [0.95, 0.95, 0.45], fin: breathe });
        k.add(ball(1, 10, 8), { c: B.ink, p: [s * 1.55, 3.25, 3.62], s: [0.36, 0.42, 0.14], fin: breathe });
        k.add(new THREE.TorusGeometry(0.66, 0.1, 4, 20), { c: col, glow: 0.6, mark: 1, p: [s * 1.55, 3.3, 3.58], fin: breathe });
      }
      k.add(new THREE.TorusGeometry(1.6, 0.07, 4, 18, PI * 0.7), { c: B.mouth, p: [0, 2.05, 3.52], r: [0, 0, PI * 1.15], s: [1, 0.35, 1], fin: breathe }); // (a thin, wide mouth)
      for (let i = 0; i < 16; i++) { // (the sea running off it: wet runs down the dome, lit in the film)
        const a = rng.range(-1.2, 1.2) + (i % 2 ? PI : 0) * 0, el = rng.range(0.2, 1.1), x = Math.sin(a) * Math.cos(el) * 4.25, y = 1.2 + Math.sin(el) * 5.45, z = Math.cos(a) * Math.cos(el) * 3.95;
        k.add(cyl(0.05, 0.03, rng.range(1.6, 3.4), 4), { c: B.pearl, mark: 0.8, glow: 0.05, p: [x, y - 1.2, z], r: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5], fin: breathe });
      }
    },
    idle(t, o) { o.y = -1.8 + 0.35 * Math.sin(t * 0.33); o.rz = 0.03 * Math.sin(t * 0.27); o.ry = 0.05 * Math.sin(t * 0.19); },
    habits: {
      rise: [7, (k, o, e) => { o.y += 3.6 * e; o.glow += 0.4 * e; }],
      stare: [4, (k, o, e) => { o.glow += 2 * e; o.rx -= 0.06 * e; }],
    },
  },

  islandWhale: {
    L: 120, wave: [2.6, 2.4, 1], waveW: (x, y, z) => clamp01((-z - 20) / 38) ** 2, fin: [0.25, 1, 0.12, 1], depth: 16,
    build(k, col, rng) {
      const g = loft(WHALE, 24, 3), P = g.attributes.position.array;
      for (let i = 1; i < P.length; i += 3) if (P[i] > TOP) P[i] = TOP + (P[i] - TOP) * 0.18 + noise2(P[i - 1] * 0.15, P[i + 1] * 0.15) * 0.8; // (the back worn flat into an islet)
      g.computeVertexNormals();
      const ground = (x, y, z) => (y > TOP + 0.25 ? (noise2(x * 0.09, z * 0.09) > 0.42 ? 0x6a7448 : 0xe0d2a8) : y > TOP - 1.2 ? 0xe0d2a8 : y > -1.5 && noise2(x * 0.3 + 5, z * 0.3) > 0.55 ? B.barn : y < -6 ? B.belly : B.hide);
      k.add(g, { c: ground });
      k.add(flat([[0, 0], [16, -8], [25, -14], [11, -10.5], [0, -12], [-11, -10.5], [-25, -14], [-16, -8]], 1.0), { c: B.hide, mark: (x, y, z) => (z < -66 ? 0.6 : 0), p: [0, 0.6, -56] });
      for (const s of [-1, 1]) {
        for (let i = 0; i < 9; i++) { const z = 26 + i * 2.8, [, rx, ry, yc] = whaleAt(z); for (let j = 0; j < 3; j++) { const b = 0.4 + j * 0.13 + (i % 3) * 0.02; k.add(new THREE.BoxGeometry(0.5, 0.5, 6), { c: B.belly, mark: 1, p: [s * rx * Math.cos(b) * 1.01, yc + ry * Math.sin(b) * 1.01, z], r: [0, s * -0.12, 0] }); } } // (the grooves along its jaw, above the water)
        const [, rx, ry, yc] = whaleAt(44);
        k.add(ball(1.4, 10, 8), { c: B.pearl, glow: 0.5, p: [s * rx * 0.86, yc + ry * 0.5, 44] });
        k.add(ball(0.75, 8, 6), { c: col, glow: 1.5, p: [s * rx * 0.9, yc + ry * 0.5, 44.4] }); // (its eye, low at the water: the islet looks back)
        k.add(flat([[0, 6], [s * 16, -4], [s * 14, -9], [0, -3]], 0.8), { c: B.hide, p: [s * 16, -6, 20], r: [0, 0, s * -0.35], fin: [0, s * 0.6, 0, 0] });
      }
      for (const [x, z, h, lean] of [[-6, 10, 10, 0.25], [4, 16, 12, -0.2], [1, -8, 9, 0.15], [-3, 24, 8, -0.3]]) { // (palms)
        k.add(limb([[x, TOP, z], [x + lean * h * 0.4, TOP + h * 0.55, z], [x + lean * h, TOP + h, z + 0.5]], 0.5, 0.28, 8, 6), { c: 0x6a5a48 });
        for (let i = 0; i < 7; i++) { const a = (i / 7) * PI * 2; k.add(cone(0.8, 5.5, 3), { c: 0x55603a, p: [x + lean * h + Math.cos(a) * 2.4, TOP + h - 0.6, z + 0.5 + Math.sin(a) * 2.4], r: [Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9], s: [1, 1, 0.2], fin: [0.15, 0.1, 0.15, 100 + i] }); }
      }
      for (let i = 0; i < 5; i++) k.lump(rng.range(1.2, 2.8), rng, { c: 0x7a7066, p: [rng.range(-9, 9), TOP + 0.4, rng.range(-24, 28)], s: [1, 0.6, 1] });
      for (let i = 0; i < 9; i++) k.add(cone(rng.range(0.8, 1.8), rng.range(5, 11), 5), { c: B.pearl, glow: 0.35, mark: 0.6, show: 1, fin: [0, TOP + 0.5, 36], p: [rng.range(-1, 1), TOP + 4 + i * 1.6, 36 + rng.range(-1, 1)], r: [PI, 0, 0] }); // (the spout)
      for (let i = 0; i < 30; i++) { const z = rng.range(-40, 34), [, rx, ry, yc] = whaleAt(z), a = rng.range(0.38, 0.62); k.add(ball(1, 5, 4), { c: B.pearl, glow: 0.3, mark: 1, p: [(i % 2 ? 1 : -1) * rx * Math.cos(a) * 1.01, yc + ry * Math.sin(a), z], s: [0.3, 0.45, 0.7] }); } // (its spots along the flank, above the water)
    },
    idle(t, o) { o.y = 0.4 * Math.sin(t * 0.12); o.rx = 0.008 * Math.sin(t * 0.1); o.wave = 0.6; },
    habits: {
      surface: [10, (k, o, e) => { o.y -= 5 * e; o.rx += 0.03 * e * Math.sin(k * PI * 2); o.wave = 1.4; }],
      spout: [4, (k, o) => { o.show = Math.min(1, k * 5) * (1 - sm(0.45, 1, k)); }],
    },
  },

  ghostShip: {
    L: 40, wave: [0, 0, 0], waveW: 0, fin: [1.3, 1, 0.5, 1], depth: 0, vanishes: true,
    build(k, col, rng) {
      const pale = 0x8a9a96, paleD = 0x55625e;
      k.add(hull({ L: 30, B: 7.2, D: 4.4, bow: 0.32, stern: 0.6, sheer: 1.3, segs: 14, ring: 10 }), { c: (x, y) => (y < 0.2 ? 0x3a4441 : paleD), glow: 0.06, mark: 0.15, p: [0, 3.4, 0] });
      k.add(new THREE.BoxGeometry(7.0, 3.4, 6.5), { c: paleD, glow: 0.06, p: [0, 5.5, -11.5] });
      k.add(new THREE.BoxGeometry(6.2, 1.8, 4.5), { c: paleD, glow: 0.06, p: [0, 4.6, 11] });
      k.add(limb([[0, 5.2, 14.5], [0, 7.2, 21.5]], 0.35, 0.18, 4, 6), { c: 0x3a3430 });
      for (let i = 0; i < 6; i++) k.add(new THREE.BoxGeometry(0.7, 0.9, 0.2), { c: col, glow: 0.8, p: [i % 2 ? 3.52 : -3.52, 6.0, -13.5 + (i >> 1) * 2] }); // (the stern windows, lit)
      for (const [z, h] of [[9, 22], [-1, 28], [-9.5, 20]]) {
        k.add(cyl(0.3, 0.45, h, 6), { c: 0x3a3430, p: [0, 3.4 + h / 2, z] });
        for (const [y, w] of [[0.42, 11], [0.72, 8.5]]) {
          const yy = 3.4 + h * y, sh = h * 0.27;
          k.add(cyl(0.16, 0.16, w + 1, 5), { c: 0x3a3430, p: [0, yy + sh / 2, z], r: [0, 0, PI / 2] });
          const strips = 8; // (a sail in tatters: strips of cloth, each torn off at its own length)
          for (let j = 0; j < strips; j++) {
            const sw = w / strips, len = sh * (rng.chance(0.2) ? rng.range(0.2, 0.5) : rng.range(0.7, 1)), x = -w / 2 + sw * (j + 0.5);
            const g = new THREE.PlaneGeometry(sw * 0.94, len, 1, 4).translate(0, -len / 2, 0), P = g.attributes.position.array;
            for (let q = 0; q < P.length; q += 3) P[q + 2] = Math.sin(((x + P[q]) / w + 0.5) * PI) * 1.0 * (0.3 + 0.7 * clamp01(-P[q + 1] / sh));
            g.computeVertexNormals();
            k.add(g, { c: pale, glow: 0.18, mark: 0.55, p: [x, yy + sh / 2, z + 0.25], fin: (xx, y2) => [0, 0, 0.9 * clamp01((yy + sh / 2 - y2) / sh), x * 0.3] });
          }
        }
        for (const s of [-1, 1]) k.add(limb([[0, 3.4 + h * 0.95, z], [s * 3.6, 5.6, z - 1.5]], 0.05, 0.05, 2, 3), { c: 0x2a2826 }); // (the shrouds)
      }
      k.add(ball(0.75, 8, 6), { c: col, glow: 2, p: [0, 8.2, -15.2] }); // (the stern lantern)
      k.add(ball(0.5, 8, 6), { c: col, glow: 1.6, p: [0, 7.0, 17] });
      for (let i = 0; i < 14; i++) k.add(ball(1, 5, 4), { c: col, glow: 0.9, mark: 1, p: [rng.range(-3.7, 3.7), rng.range(1.5, 4.5), rng.range(-13, 13)], s: [0.18, 0.18, 0.18] }); // (corpse-light on the hull)
    },
    idle(t, o) { o.rx = 0.03 * Math.sin(t * 0.5); o.rz = 0.05 * Math.sin(t * 0.37); o.y = 0.3 * Math.sin(t * 0.5); o.glow = 0.2 + 0.1 * Math.sin(t * 1.1); },
    habits: {
      hail: [4, (k, o, e) => { o.glow += 1.6 * e; }],
      vanish: [5, (k, o, e) => { o.vanish = Math.max(o.vanish, e); o.glow += 0.6 * e; }],
    },
  },

  bigSquid: {
    L: 50, wave: [0, 0, 0], waveW: 0, fin: [0.7, 1, 0.35, 1], depth: 14,
    build(k, col, rng) {
      const red = 0x6a3640, pale = 0xb89a9a, breathe = (x, y, z) => [x * 0.02, 0, z * 0.02, 100];
      const mantle = loft([[-18, 0.4, 0.4, 0], [-15, 3, 3, 0], [-10, 5, 5, 0], [-4, 5.6, 5.6, 0], [0, 4.8, 4.8, 0]], 16);
      k.add(mantle, { c: (x, y, z) => (noise2(x * 0.3, y * 0.3 + z * 0.2) > 0.6 ? 0x5a2c36 : red), mark: (x, y, z) => (noise2(x * 0.5 + 4, y * 0.5) > 0.7 ? 0.7 : 0), p: [0, 2.5, -1], r: [1.15, 0, 0], fin: breathe });
      for (const s of [-1, 1]) k.add(flat([[0, 0], [s * 6, -2], [s * 2, -6]], 0.4), { c: red, mark: 0.6, p: [s * 1.5, 18.4, -8.4], r: [1.15 - PI / 2, 0, 0] });
      k.add(ball(1, 16, 10), { c: red, p: [0, 1.4, 2.4], s: [5.0, 3.4, 4.4] });
      for (const s of [-1, 1]) {
        k.add(ball(1.5, 12, 10), { c: B.pearl, glow: 0.4, p: [s * 4.3, 2.2, 3.4], s: [0.6, 1, 1] });
        k.add(ball(1.1, 10, 8), { c: col, glow: 1.4, p: [s * 4.75, 2.2, 3.5], s: [0.4, 0.9, 0.9] });
        k.add(ball(0.5, 8, 6), { c: B.ink, p: [s * 5.05, 2.2, 3.55], s: [0.3, 1.2, 0.5] });
      }
      const arms = [];
      for (let i = 0; i < 8; i++) arms.push({ a: PI * (-0.15 + 1.3 * (i / 7)), reach: rng.range(15, 20), h: rng.range(8, 15), r0: 1.5, tent: false });
      for (const s of [-1, 1]) arms.push({ a: PI / 2 + s * 0.35, reach: 30, h: 18, r0: 0.9, tent: true });
      arms.forEach(({ a, reach, h, r0, tent }, i) => {
        const cx = Math.cos(a), cz = Math.sin(a), at = (d, y) => [cx * d, y, cz * d + 3];
        const pts = tent ? [at(3, 0.5), at(reach * 0.45, h), at(reach * 0.8, h * 0.85), at(reach, h * 0.4), at(reach * 1.05, h * 0.55)] : [at(3, 0.5), at(reach * 0.5, h), at(reach * 0.85, h * 0.5), at(reach, -0.5), at(reach * 1.08, 1.8)];
        const writhe = (x, y, z) => { const t = clamp01((Math.hypot(x, z - 3) - 3) / reach); return [-cz * 1.6 * t ** 1.4, 0.8 * t ** 1.4, cx * 1.6 * t ** 1.4, i * 1.3 - t * 4]; };
        k.add(limb(pts, r0, tent ? 0.25 : 0.2, 22, 8), { c: shade(-99, red, pale), fin: writhe });
        if (tent) k.add(ball(1, 8, 6), { c: red, mark: 0.5, p: pts[pts.length - 1], s: [1.4, 0.8, 2.2], fin: writhe }); // (the club)
        const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
        for (let j = 2; j < 16; j++) { const t = j / 16, p = curve.getPointAt(t), r = r0 + ((tent ? 0.25 : 0.2) - r0) * t; k.add(ball(1, 5, 4), { c: pale, mark: 0.9, p: [p.x, p.y - r * 0.85, p.z], s: [r * 0.35, r * 0.2, r * 0.35], fin: writhe }); }
      });
      k.add(ball(1, 20, 6), { c: 0x0a090c, mark: 0.4, show: 1, fin: [0, 0, 3], p: [0, 0.2, 3], s: [22, 0.6, 22] }); // (its ink on the water)
    },
    idle(t, o) { o.y = 0.3 * Math.sin(t * 0.4); o.ry = 0.04 * Math.sin(t * 0.2); },
    habits: {
      grasp: [4, (k, o, e) => { o.fin = 1 + 1.4 * e; o.rx -= 0.1 * e; o.glow += 0.9 * e; }],
      ink: [6, (k, o) => { o.show = Math.min(1, k * 3) * (1 - sm(0.6, 1, k)); }],
    },
  },

  worldSerpent: {
    L: 400, wave: [24, 15.7, 1], waveW: (x, y, z) => 1 - sm(120, 150, z), fin: [0.5, 1, 0.2, 1], depth: 50,
    build(k, col, rng) {
      const scale = 0x4a5a3a;
      serpentTrunk(k, { z0: -200, z1: 145, r: 11, y: -13, col, rng, spines: 9, top: scale, under: 0xb8c0a0, dap: 0.05 });
      const bob = (x, y) => [0, clamp01((y - 10) / 40) * 3, 0, 100];
      k.add(limb([[0, -10, 132], [0, 18, 156], [0, 40, 172]], 9.5, 7.5, 12, 12), { c: shade(10, scale, 0xb8c0a0), fin: bob, wave: (x, y, z) => 1 - sm(125, 150, z) });
      serpentHead(k, [0, 42, 170], 11.5, col, { hide: scale, horn: B.pearl, bob });
      for (let i = 0; i < 9; i++) k.add(cone(2.2, 9, 4), { c: B.hideD, mark: 0.8, p: [0, 22 + i * 2.5, 150 + i * 2.6], r: [-0.9, 0, 0], s: [0.3, 1, 1], fin: bob }); // (the crest down its neck)
    },
    idle(t, o) { o.wave = 1; o.y = 1.5 * Math.sin(t * 0.2); },
    habits: {
      circle: [8, (k, o, e) => { o.wave = 1 + 0.5 * e; o.glow += 0.7 * e; }],
      rise: [6, (k, o, e) => { o.y += 16 * e; o.rx -= 0.04 * e; o.glow += 1.2 * e; }],
    },
  },
};
