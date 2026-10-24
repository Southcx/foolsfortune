// ---------------------------------------------------------------------------------------
// THE TEAHOUSE SET (proposed to Dovina, docs/handoffs/dovina/2026-10-24-from-calissa-decor-sets.md): the approach to a tea room, the
// roji, as a cosy garden builder's set of eight. Moss, weathered stone, split bamboo and a red felt bench; the body (white, so the set's
// sage x tint paints it) is the lantern's hat, the bench's parasol, the fence's poles and the moss, the stone and the water fixed.
// The water pipe's bamboo tips and knocks in the vertex shader (kit.js MOTION.tip), the snow-viewing lantern's panels light at dusk.
// Prior art: the roji of the chashitsu (tobi-ishi stepping stones and the rope-tied stop stone, sekimori-ishi; the tsukubai crouching
// basin with its kakehi spout and hishaku ladle; the yukimi-doro snow-viewing lantern; the yotsume-gaki four-eyed bamboo fence; the
// nodate parasol and the red mosen felt of an outdoor tea), the shishi-odoshi of Shisen-do in Kyoto, Animal Crossing's zen set, and
// Townscaper's chunky forms read from above. Each builder stands on its origin, +Y up, front +Z, inside its size's cells.
// ---------------------------------------------------------------------------------------
import { K, MOTION } from './kit.js';

const TAU = Math.PI * 2;
const IRIS = 0x7a62b8;

export const TEAHOUSE = {
  /** small: three round stones of the tea path, moss between, and the stop stone tied with black rope (the path goes no further). */
  teaPathStones(p) {
    for (const [x, z, r, h] of [[-0.24, -0.22, 0.17, 0.1], [0.04, 0.04, 0.19, 0.12], [0.27, 0.27, 0.15, 0.09]]) {
      p.cyl(r, r + 0.03, h, { at: [x, 0, z], sit: true, c: K.stone }, 9); p.cyl(r - 0.02, r, 0.025, { at: [x, h, z], c: K.stoneL }, 9);
    }
    p.ball(0.24, { at: [0.05, 0, -0.3], sc: [1.3, 0.28, 0.8], sit: true }, 7, 4); p.ball(0.2, { at: [-0.2, 0, 0.2], sc: [1.2, 0.3, 1], sit: true }, 7, 4);
    p.ball(0.1, { at: [-0.27, 0.14, 0.28], sc: [1, 0.9, 1], c: K.stoneD }, 7, 5); // (the stop stone)
    p.ring(0.085, 0.014, { at: [-0.27, 0.15, 0.28], rot: [Math.PI / 2, 0, 0], c: K.black }, 10, 3); p.ring(0.085, 0.014, { at: [-0.27, 0.15, 0.28], rot: [Math.PI / 2, Math.PI / 2, 0], c: K.black }, 10, 3);
    p.ball(0.03, { at: [-0.27, 0.24, 0.28], c: K.black }, 4, 3);
  },
  /** small: the crouching basin: a low round stone with water, the bamboo spout over it on a forked post, the ladle laid across. */
  crouchingBasin(p) {
    p.ball(0.24, { at: [0.2, 0, 0.18], sc: [1.4, 0.3, 1.1], sit: true }, 7, 4); // (moss round its foot)
    p.lathe([[0, 0], [0.26, 0], [0.31, 0.08], [0.3, 0.22], [0.26, 0.28], [0.17, 0.28], [0.16, 0.22], [0, 0.22]], { c: K.stone }, 10);
    p.cyl(0.16, 0.16, 0.02, { at: [0, 0.25, 0], c: K.water }, 10);
    p.rod([-0.36, 0, -0.32], [-0.36, 0.58, -0.32], 0.04, { c: K.woodD }, 5); p.rod([-0.36, 0.5, -0.32], [-0.42, 0.62, -0.32], 0.02, { c: K.woodD }, 4);
    p.rod([-0.36, 0.56, -0.32], [-0.06, 0.44, -0.06], 0.035, { c: K.bamboo }, 6); p.ring(0.037, 0.008, { at: [-0.22, 0.5, -0.2], rot: [0, 0, 0.6], c: K.bamboo }, 6, 3);
    p.rod([-0.05, 0.43, -0.05], [-0.03, 0.27, -0.03], 0.012, { c: K.water }, 4); // (the thread of water)
    p.rod([0.0, 0.3, 0.2], [0.24, 0.34, -0.2], 0.012, { c: K.bamboo }, 4); p.cyl(0.05, 0.045, 0.06, { at: [0.25, 0.36, -0.21], c: K.bamboo }, 6);
    p.box(0.26, 0.08, 0.18, { at: [0.0, 0, 0.36], sit: true, c: K.stoneD }, 0.03); // (the front stone, where one crouches)
  },
  /** medium: the snow-viewing lantern: three bowed legs, a six-sided firebox lit at dusk, a wide low hat (the body) and its finial. */
  snowViewingLantern(p) {
    p.ball(0.5, { at: [0.12, 0, 0.1], sc: [1.4, 0.22, 1.2], sit: true }, 9, 4);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.5, c = Math.cos(a), s = Math.sin(a);
      p.cyl(0.07, 0.09, 0.08, { at: [c * 0.55, 0, s * 0.55], sit: true, c: K.stoneD }, 6);
      p.rod([c * 0.55, 0.05, s * 0.55], [c * 0.5, 0.32, s * 0.5], 0.055, { c: K.stone }, 6); p.rod([c * 0.5, 0.32, s * 0.5], [c * 0.3, 0.5, s * 0.3], 0.05, { c: K.stone }, 6);
    }
    p.cyl(0.36, 0.3, 0.08, { at: [0, 0.52, 0], c: K.stone }, 6);
    p.cyl(0.2, 0.2, 0.3, { at: [0, 0.71, 0], c: K.lamp, g: 1 }, 6);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; p.box(0.06, 0.32, 0.06, { at: [Math.cos(a) * 0.24, 0.71, Math.sin(a) * 0.24], c: K.stoneD }, 0.015); }
    p.cyl(0.3, 0.3, 0.06, { at: [0, 0.89, 0], c: K.stone }, 6);
    p.cone(0.9, 0.34, { at: [0, 1.08, 0], rot: [0, Math.PI / 6, 0] }, 6); p.cyl(0.9, 0.88, 0.06, { at: [0, 0.92, 0], rot: [0, Math.PI / 6, 0] }, 6);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; p.ball(0.06, { at: [Math.cos(a) * 0.86, 0.96, Math.sin(a) * 0.86], sc: [1, 1.3, 1] }, 5, 4); } // (the hat's turned-up corners)
    p.cyl(0.08, 0.12, 0.1, { at: [0, 1.28, 0], c: K.stone }, 6); p.ball(0.09, { at: [0, 1.38, 0], sc: [1, 1.2, 1], c: K.stone }, 6, 4); p.cone(0.05, 0.1, { at: [0, 1.5, 0], c: K.stone }, 5);
    p.ball(0.12, { at: [-0.25, 1.02, 0.4], sc: [1.6, 0.4, 1.2], c: K.moss }, 5, 3);
  },
  /** small: the four-eyed bamboo fence: two stout posts, three rails, uprights before and behind, black rope at every crossing. */
  bambooLatticeFence(p) {
    for (const x of [-0.42, 0.42]) { p.cyl(0.06, 0.065, 1.0, { at: [x, 0, 0], sit: true }, 7); p.ball(0.065, { at: [x, 1.0, 0], sc: [1, 0.4, 1], c: K.bamboo }, 6, 3); }
    for (const y of [0.25, 0.55, 0.82]) p.cyl(0.032, 0.032, 0.92, { at: [0, y, 0], rot: [0, 0, Math.PI / 2] }, 6);
    for (let i = 0; i < 4; i++) {
      const x = -0.27 + i * 0.18, z = i % 2 ? -0.045 : 0.045;
      p.cyl(0.028, 0.03, 0.92, { at: [x, 0, z], sit: true }, 6); p.ball(0.03, { at: [x, 0.92, z], sc: [1, 0.4, 1], c: K.bamboo }, 5, 3);
      for (const y of [0.25, 0.55, 0.82]) p.ball(0.03, { at: [x, y, z * 1.7], sc: [1, 0.8, 0.6], c: K.black }, 4, 3);
    }
    for (const x of [-0.42, 0.42]) p.cyl(0.09, 0.1, 0.05, { at: [x, 0, 0], sit: true, c: K.stoneD }, 6);
    p.ball(0.12, { at: [0.25, 0, 0.18], sc: [1.4, 0.4, 1], sit: true, c: K.moss }, 5, 3);
  },
  /** medium: the slab bridge: one gently arched stone over a rill, its banks mossed, pebbles in the water. */
  slabBridge(p) {
    p.slab(1.86, 0.03, 0.5, { at: [0, 0.015, 0], c: K.water }); p.slab(1.86, 0.02, 0.28, { at: [0, 0.035, 0], c: K.waterD });
    for (const s of [-1, 1]) { p.box(1.9, 0.14, 0.5, { at: [0, 0, s * 0.62], sit: true }, 0.06); for (let i = 0; i < 5; i++) p.ball(0.09, { at: [-0.8 + i * 0.4, 0.06, s * 0.33], sc: [1.3, 0.6, 1], c: K.stoneD }, 5, 4); }
    const n = 5;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, z = (u - 0.5) * 1.6, y = 0.14 + Math.sin(u * Math.PI) * 0.16, a = -Math.cos(u * Math.PI) * 0.2; p.box(0.6, 0.11, 1.6 / n + 0.04, { at: [0, y, z], rot: [a, 0, 0], c: K.stone }, 0.03); }
    for (const s of [-1, 1]) { p.box(0.7, 0.18, 0.2, { at: [0, 0, s * 0.85], sit: true, c: K.stoneD }, 0.05); p.ball(0.2, { at: [s * 0.6, 0.12, s * 0.7], sc: [1.3, 0.5, 1], c: K.moss }, 6, 3); }
    for (const [x, z] of [[-0.55, 0.05], [0.6, -0.1], [0.75, 0.12]]) p.ball(0.08, { at: [x, 0.04, z], sc: [1.2, 0.6, 1], c: K.stoneL }, 5, 3);
  },
  /** medium: the waiting bench of a tea: a low bench in red felt, a tea bowl and a sweet on it, the big parasol (the body) over it. */
  teaBenchParasol(p) {
    p.box(1.4, 0.1, 0.5, { at: [0, 0.4, 0.1], c: K.wood }, 0.03); p.slab(1.32, 0.02, 0.56, { at: [0, 0.46, 0.1], c: K.red }); p.slab(1.32, 0.18, 0.02, { at: [0, 0.37, 0.39], c: K.red });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.box(0.08, 0.36, 0.08, { at: [sx * 0.6, 0, 0.1 + sz * 0.18], sit: true, c: K.woodD }, 0.02);
    p.cyl(0.08, 0.05, 0.07, { at: [-0.3, 0.505, 0.12], c: K.black }, 8); p.cyl(0.065, 0.065, 0.01, { at: [-0.3, 0.54, 0.12], c: K.leaf }, 8);
    p.cyl(0.1, 0.1, 0.015, { at: [0.15, 0.48, 0.15], c: K.white }, 8); p.ball(0.045, { at: [0.15, 0.51, 0.15], sc: [1, 0.7, 1], c: K.pink }, 6, 4);
    p.cyl(0.12, 0.15, 0.08, { at: [0.6, 0, -0.42], sit: true, c: K.stoneD }, 7); p.rod([0.6, 0.05, -0.42], [0.2, 1.95, -0.05], 0.03, { c: K.woodD }, 5);
    p.cone(0.86, 0.32, { at: [0.18, 2.05, -0.03] }, 14); p.cyl(0.86, 0.84, 0.03, { at: [0.18, 1.88, -0.03] }, 14);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; p.rod([0.18, 1.88, -0.03], [0.18 + Math.cos(a) * 0.8, 1.89, -0.03 + Math.sin(a) * 0.8], 0.01, { c: K.woodL }, 3); }
    p.ball(0.05, { at: [0.18, 2.23, -0.03], c: K.woodD }, 5, 3);
  },
  /** medium: the moss hillock: a domed bed of moss (the body) with a cloud-pruned pine leaning out of it and a stone at its foot. */
  mossHillock(p) {
    p.ball(0.9, { sc: [1.0, 0.42, 0.9], sit: true }, 12, 6); p.ball(0.42, { at: [0.55, 0, 0.45], sc: [1, 0.45, 1], sit: true }, 8, 4);
    p.ball(0.3, { at: [-0.5, 0.05, 0.55], sc: [1.3, 0.7, 1], c: K.stone }, 7, 5); p.ball(0.18, { at: [-0.25, 0.04, 0.72], sc: [1.2, 0.6, 1], c: K.stoneD }, 6, 4);
    p.rod([-0.1, 0.3, -0.15], [0.05, 0.75, -0.2], 0.07, { c: K.woodD }, 6); p.rod([0.05, 0.75, -0.2], [0.42, 1.05, -0.05], 0.05, { c: K.woodD }, 5); p.rod([0.05, 0.75, -0.2], [-0.3, 1.2, -0.3], 0.045, { c: K.woodD }, 5);
    for (const [x, y, z, r] of [[0.48, 1.12, -0.02, 0.26], [-0.34, 1.28, -0.3, 0.24], [0.08, 1.42, -0.22, 0.2], [0.1, 0.92, -0.25, 0.16]]) p.ball(r, { at: [x, y, z], sc: [1.4, 0.45, 1.2], c: K.leafD }, 8, 4);
    for (const [x, z] of [[0.3, -0.5], [-0.6, -0.2], [0.65, 0.05]]) p.ball(0.07, { at: [x, 0.3, z], sc: [1, 0.6, 1], c: K.leaf }, 5, 3);
  },
  /** centre: the water pipe (shishi-odoshi) at its pond: a spout feeds a bamboo pipe on an axle; it fills, tips, pours and knocks its
   *  back end on the stone (MOTION.tip about the axle, in the shader). Rocks, moss banks (the body) and an iris round the water. */
  bambooWaterPipe(p) {
    const PIV = [0, 0.55, 0.2], TIP = { m: [MOTION.tip, ...PIV] };
    p.cyl(0.85, 0.9, 0.06, { at: [0, 0, 0.82], sit: true, c: K.waterD }, 14); p.cyl(0.78, 0.78, 0.03, { at: [0, 0.05, 0.82], c: K.water }, 14);
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU, r = 0.9 + (i % 3) * 0.04; p.ball(0.15 + (i % 3) * 0.05, { at: [Math.cos(a) * r, 0.04, 0.82 + Math.sin(a) * r * 0.95], sc: [1.3, 0.65, 1.1], rot: [0, a, 0], c: i % 2 ? K.stone : K.stoneD }, 6, 4); }
    p.ball(0.8, { at: [-1.15, 0, -0.6], sc: [0.9, 0.4, 1.1], sit: true }, 10, 5); p.ball(0.7, { at: [1.15, 0, -0.5], sc: [0.9, 0.38, 1.1], sit: true }, 10, 5); p.ball(0.5, { at: [1.3, 0, 1.2], sc: [0.9, 0.35, 1.2], sit: true }, 8, 4);
    // the frame and the axle (still), the knock stone under the pipe's back end
    for (const sx of [-1, 1]) p.box(0.07, 0.62, 0.07, { at: [sx * 0.12, 0, 0.2], sit: true, c: K.woodD }, 0.02);
    p.rod([-0.16, 0.55, 0.2], [0.16, 0.55, 0.2], 0.02, { c: K.woodD }, 4);
    p.ball(0.2, { at: [0, 0, -0.33], sc: [1.1, 0.95, 1], sit: true, c: K.stoneD }, 7, 5);
    // the tipping pipe: built at rest (its open mouth up over the pond, its back end down on the stone), turned about the axle
    const ax = Math.PI / 2 - 0.25;
    p.cyl(0.065, 0.065, 1.1, { at: PIV, rot: [ax, 0, 0], c: K.bamboo, ...TIP }, 8);
    for (const d of [-0.32, 0.14]) p.cyl(0.072, 0.072, 0.03, { at: [0, PIV[1] + Math.sin(0.25) * d, PIV[2] + Math.cos(0.25) * d], rot: [ax, 0, 0], c: K.woodL, ...TIP }, 8);
    p.cyl(0.05, 0.05, 0.02, { at: [0, PIV[1] + Math.sin(0.25) * 0.55, PIV[2] + Math.cos(0.25) * 0.55], rot: [ax - 0.5, 0, 0], c: K.waterD, ...TIP }, 8); // (the mouth's dark inside)
    // the spout that fills it, on its post, and the thread of water
    p.rod([0.62, 0, 0.82], [0.62, 1.08, 0.82], 0.045, { c: K.woodD }, 5); p.rod([0.62, 1.0, 0.82], [0.02, 0.93, 0.74], 0.04, { c: K.bamboo }, 6);
    p.rod([0.02, 0.91, 0.74], [0.0, 0.76, 0.73], 0.012, { c: K.water }, 4);
    // an iris in the shallows, moss tufts, the stepping stone to it
    for (let i = 0; i < 6; i++) { const a = i * 1.1; p.cone(0.04, 0.55, { at: [-0.62 + Math.cos(a) * 0.08, 0.28, 1.45 + Math.sin(a) * 0.06], rot: [Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25], c: K.leaf }, 4); }
    for (const [x, z] of [[-0.6, 1.5], [-0.7, 1.38]]) p.ball(0.07, { at: [x, 0.62, z], sc: [1.2, 0.8, 1], c: IRIS }, 6, 4);
    p.cyl(0.25, 0.28, 0.08, { at: [0.55, 0, -1.25], sit: true, c: K.stone }, 9); p.cyl(0.22, 0.25, 0.08, { at: [-0.1, 0, -1.55], sit: true, c: K.stone }, 9);
    for (const [x, z] of [[-1.4, 0.3], [1.5, 0.35], [0.9, -1.4]]) p.ball(0.16, { at: [x, 0.04, z], sc: [1.3, 0.55, 1], c: K.moss }, 6, 3);
  },
};
