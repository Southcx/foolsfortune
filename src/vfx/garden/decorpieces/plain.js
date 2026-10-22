// ---------------------------------------------------------------------------------------
// THE PLAIN SET: Garden Basics (progress/decor.js), the things every garden wants: paths, a fence, a gate, a bench, planters, a basin,
// rocks, a bridge and an arbor. Soft, chunky and toy-like; the body is white (the set colour x tint paints it), the accents fixed.
// Prior art: Animal Crossing's outdoor furniture, the Japanese garden's tsukubai and yatsuhashi, the Chao Garden's rocks.
// Each builder takes a Piece (kit.js) and stands on its origin, +Y up, front +Z, inside its size's cells (small 1, medium 2, large 3).
// ---------------------------------------------------------------------------------------
import { K } from './kit.js';

export const PLAIN = {
  pathStone(p) {
    p.box(0.62, 0.14, 0.5, { at: [-0.18, 0, -0.16], rot: [0, 0.25, 0], sit: true }, 0.05);
    p.box(0.55, 0.12, 0.48, { at: [0.22, 0, 0.24], rot: [0, -0.2, 0], sit: true }, 0.05);
    p.ball(0.07, { at: [0.3, 0.04, -0.3], sc: [1, 0.6, 1], c: K.stoneD }, 5, 4); p.ball(0.06, { at: [-0.35, 0.04, 0.32], sc: [1, 0.6, 1], c: K.stoneD }, 5, 4);
  },
  steppingStone(p) {
    p.cyl(0.36, 0.4, 0.2, { sit: true }, 9); p.ball(0.28, { at: [0, 0.2, 0], sc: [1, 0.22, 1], c: K.moss });
    p.cyl(0.14, 0.16, 0.1, { at: [0.5, 0, 0.4], sit: true, c: K.stone }, 6);
  },
  bambooFence(p) {
    for (let i = 0; i < 5; i++) { const h = 0.85 + (i % 2) * 0.1; p.cyl(0.055, 0.06, h, { at: [-0.4 + i * 0.2, 0, 0], sit: true }, 6); p.ball(0.06, { at: [-0.4 + i * 0.2, h, 0], sc: [1, 0.5, 1], c: K.bamboo }, 6, 3); }
    for (const y of [0.25, 0.6]) p.cyl(0.035, 0.035, 0.98, { at: [0, y, 0.07], rot: [0, 0, Math.PI / 2], c: K.rope }, 5);
    p.cyl(0.07, 0.08, 0.06, { at: [-0.5, 0, 0], sit: true, c: K.stoneD }, 6); p.cyl(0.07, 0.08, 0.06, { at: [0.5, 0, 0], sit: true, c: K.stoneD }, 6);
  },
  gardenGate(p) {
    for (const s of [-1, 1]) { p.box(0.2, 1.9, 0.2, { at: [s * 0.8, 0, 0], sit: true, c: K.woodD }, 0.05); p.box(0.3, 0.12, 0.3, { at: [s * 0.8, 0, 0], sit: true, c: K.stone }, 0.04); }
    p.box(2.1, 0.16, 0.34, { at: [0, 1.75, 0] }, 0.05); p.box(1.8, 0.1, 0.14, { at: [0, 1.5, 0], c: K.wood }, 0.03);
    p.box(2.4, 0.1, 0.5, { at: [0, 1.9, 0], rot: [0.0, 0, 0] }, 0.04);
    for (const s of [-1, 1]) { p.box(0.7, 1.05, 0.07, { at: [s * 0.4, 0.1, 0.02], sit: true, c: K.woodL }, 0.025); for (let i = 0; i < 3; i++) p.slab(0.05, 0.9, 0.04, { at: [s * 0.4 + (i - 1) * 0.18, 0.15, 0.07], sit: true, c: K.woodD }); }
  },
  bench(p) {
    p.box(1.5, 0.12, 0.55, { at: [0, 0.5, 0] }, 0.05); p.box(1.5, 0.45, 0.1, { at: [0, 0.85, -0.25], rot: [-0.12, 0, 0] }, 0.04);
    for (const s of [-1, 1]) { p.box(0.14, 0.5, 0.5, { at: [s * 0.62, 0, 0], sit: true, c: K.wood }, 0.04); p.box(0.12, 0.12, 0.5, { at: [s * 0.7, 0.62, 0], c: K.woodD }, 0.04); }
    p.slab(1.3, 0.04, 0.04, { at: [0, 0.3, 0.2], c: K.woodD });
  },
  planterBox(p) {
    p.box(0.9, 0.42, 0.55, { sit: true, c: K.wood }, 0.07); p.slab(0.78, 0.04, 0.43, { at: [0, 0.4, 0], c: K.soil });
    for (let i = 0; i < 4; i++) { p.ball(0.15, { at: [-0.33 + i * 0.22, 0.52, (i % 2) * 0.08 - 0.04], c: K.leaf }, 6, 4); p.ball(0.07, { at: [-0.33 + i * 0.22, 0.68, (i % 2) * 0.08 - 0.04], sc: [1, 0.8, 1] }, 6, 4); }
    p.box(0.94, 0.07, 0.59, { at: [0, 0.4, 0], c: K.woodL }, 0.03);
  },
  flowerPot(p) {
    p.lathe([[0, 0], [0.22, 0], [0.3, 0.32], [0.34, 0.36], [0.3, 0.38], [0, 0.34]], { c: K.clay }, 9).lathe([[0.26, 0.34], [0.26, 0.38], [0, 0.4]], { c: K.soil }, 9);
    for (let i = 0; i < 3; i++) { const a = i * 2.1, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12; p.rod([x * 0.4, 0.38, z * 0.4], [x, 0.7 + i * 0.05, z], 0.012, { c: K.leaf }, 4); p.ball(0.1, { at: [x, 0.74 + i * 0.05, z], sc: [1, 0.7, 1] }, 6, 4); p.ball(0.12, { at: [x * 0.5, 0.5, z * 0.5], c: K.leaf }, 5, 4); }
  },
  waterBasin(p) {
    p.cyl(0.36, 0.3, 0.42, { sit: true, c: K.stone }, 9); p.cyl(0.3, 0.3, 0.04, { at: [0, 0.42, 0], c: K.water }, 9); p.ring(0.3, 0.07, { at: [0, 0.42, 0] }, 11, 4);
    p.cyl(0.04, 0.04, 0.34, { at: [0.2, 0.55, -0.2], rot: [0.5, 0, -0.3], c: K.bamboo }, 5); p.cyl(0.05, 0.05, 0.12, { at: [0.4, 0, 0.4], sit: true, c: K.stoneD }, 6);
  },
  rock(p) {
    p.ball(0.4, { at: [0, 0, 0], sc: [1.1, 0.7, 0.9], rot: [0, 0.5, 0], sit: true }, 7, 5); p.ball(0.22, { at: [0.3, 0, 0.18], sc: [1, 0.7, 1], sit: true, c: K.stoneD }, 6, 4);
    p.ball(0.18, { at: [-0.1, 0.32, -0.05], sc: [1.3, 0.3, 1.1], c: K.moss }, 6, 3);
  },
  boulder(p) {
    p.ball(0.85, { sc: [1.1, 0.78, 0.95], rot: [0, 0.4, 0], sit: true }, 8, 6); p.ball(0.5, { at: [0.55, 0, 0.45], sc: [1, 0.7, 1], sit: true, rot: [0, 1, 0] }, 7, 5);
    p.ball(0.34, { at: [-0.65, 0, 0.5], sc: [1, 0.7, 1], sit: true, c: K.stoneD }, 6, 4);
    p.ball(0.5, { at: [-0.1, 0.62, -0.05], sc: [1.1, 0.28, 0.9], c: K.moss }, 7, 4); p.ball(0.2, { at: [0.5, 0.52, 0.4], sc: [1, 0.3, 1], c: K.moss }, 6, 3);
  },
  bridge(p) {
    const n = 7, L = 3.0, H = 0.7;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, x = (u - 0.5) * L, y = Math.sin(u * Math.PI) * H + 0.12, dy = Math.cos(u * Math.PI) * H * Math.PI / L, a = Math.atan(dy);
      p.box(L / n + 0.1, 0.1, 1.15, { at: [x, y, 0], rot: [0, 0, a] }, 0.04);
      if (i % 2 === 0) for (const s of [-1, 1]) p.box(0.1, 0.55, 0.1, { at: [x, y + 0.3, s * 0.52], c: K.woodD }, 0.03);
    }
    for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6, f = (u) => [(u - 0.5) * L, Math.sin(u * Math.PI) * H + 0.6, s * 0.52]; p.rod(f(u0), f(u1), 0.035, { c: K.wood }, 5); } p.ball(0.09, { at: [-L / 2, 0.62, s * 0.52], c: K.gold }, 5, 4); p.ball(0.09, { at: [L / 2, 0.62, s * 0.52], c: K.gold }, 5, 4); }
    for (const s of [-1, 1]) p.box(0.5, 0.2, 1.1, { at: [s * 1.6, 0, 0], sit: true, c: K.stone }, 0.06);
  },
  arbor(p) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.box(0.12, 2.1, 0.12, { at: [sx * 1.0, 0, sz * 0.55], sit: true, c: K.woodL }, 0.04);
    const rim = 7;     for (let i = 0; i < rim; i++) { const f = (j) => [Math.cos((j / rim) * Math.PI) * 1.0, 2.0 + Math.sin((j / rim) * Math.PI) * 0.45]; for (const sz of [-1, 1]) p.rod([f(i)[0], f(i)[1], sz * 0.55], [f(i + 1)[0], f(i + 1)[1], sz * 0.55], 0.06, { c: K.wood }, 5); }
    for (let i = 0; i < 4; i++) { const a = (i / 4 + 0.12) * Math.PI; p.rod([Math.cos(a) * 1.0, 2.0 + Math.sin(a) * 0.45, -0.55], [Math.cos(a) * 1.0, 2.0 + Math.sin(a) * 0.45, 0.55], 0.04, { c: K.woodL }, 4); }
    for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI, y = 2.0 + Math.sin(a) * 0.45; p.ball(0.19, { at: [Math.cos(a) * 1.0, y + 0.08, ((i % 3) - 1) * 0.5], sc: [1, 0.85, 1.1], c: i % 3 ? K.leaf : K.leafD }, 6, 4); if (i % 3 === 0) p.ball(0.07, { at: [Math.cos(a) * 1.0, y + 0.02, 0.58] }, 5, 4); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.ball(0.25, { at: [sx * 1.0, 0.25, sz * 0.62], sc: [1, 0.9, 1], c: K.leaf }, 6, 4);
  },
};
