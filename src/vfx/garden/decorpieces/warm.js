// ---------------------------------------------------------------------------------------
// THE WARM SETS: Moss and Stone (Wonder), Festival (Mirth) and Tea Garden (Desire): stone lanterns and moss, paper lanterns and a drum,
// a tea table and cushions (docs/plans/GARDEN-COZY.md D3). A lamp's face is `g: 1` (lit at dusk), its paper warm.
// Prior art: the toro and the karesansui (Ryoan-ji's raked gravel), the Japanese matsuri (taiko, chochin, pinwheels, a bandstand's bunting),
// the chashitsu and the nodate parasol, Animal Crossing's lanterns and Chao Garden's toy stage.
// ---------------------------------------------------------------------------------------
import { K } from './kit.js';

const TAU = Math.PI * 2;

export const WARM = {
  // Wonder: Moss and Stone
  stoneLantern(p) {
    p.cyl(0.46, 0.5, 0.14, { sit: true, c: K.stone }, 8); p.cyl(0.15, 0.2, 0.62, { at: [0, 0.45, 0], c: K.stone }, 7); p.cyl(0.34, 0.26, 0.1, { at: [0, 0.81, 0], c: K.stone }, 8);
    p.box(0.46, 0.4, 0.46, { at: [0, 1.06, 0], c: K.stoneD }, 0.05); for (const [x, z, r] of [[0, 0.231, 0], [0.231, 0, 1], [0, -0.231, 2], [-0.231, 0, 3]]) p.slab(0.26, 0.26, 0.03, { at: [x, 1.06, z], rot: [0, r * Math.PI / 2, 0], c: K.lamp, g: 1 });
    p.cone(0.58, 0.42, { at: [0, 1.47, 0], rot: [0, Math.PI / 4, 0] }, 4); p.ball(0.09, { at: [0, 1.74, 0], c: K.stone }, 6, 4);
    p.ball(0.22, { at: [0.3, 0.14, 0.3], sc: [1.2, 0.5, 1], c: K.moss }, 6, 3);
  },
  mossMound(p) {
    p.ball(0.46, { sc: [1.1, 0.62, 1], sit: true }, 9, 6); p.ball(0.26, { at: [0.3, 0, 0.25], sc: [1, 0.6, 1], sit: true, c: K.moss }, 7, 4);
    p.ball(0.18, { at: [-0.28, 0, 0.3], sc: [1, 0.6, 1], sit: true, c: K.leaf }, 6, 4);
    for (const [x, z, h] of [[-0.12, -0.12, 0.2], [0.05, -0.2, 0.14], [-0.25, 0.0, 0.12]]) { p.cyl(0.02, 0.03, h, { at: [x, 0.25, z], c: K.paper }, 5); p.ball(0.07, { at: [x, 0.25 + h, z], sc: [1, 0.55, 1], c: K.red }, 6, 3); }
  },
  gravelBed(p) {
    p.box(1.9, 0.12, 1.9, { at: [0, 0, 0], sit: true, c: K.stoneL }, 0.04);
    for (let i = 0; i < 7; i++) p.slab(1.6, 0.03, 0.05, { at: [0, 0.12, -0.7 + i * 0.23], c: K.white });
    for (const [x, z, w, d] of [[0, -0.95, 1.9, 0.14], [0, 0.95, 1.9, 0.14], [-0.95, 0, 0.14, 1.9], [0.95, 0, 0.14, 1.9]]) p.box(w, 0.2, d, { at: [x, 0, z], sit: true, c: K.stoneD }, 0.05);
    p.ball(0.34, { at: [0.35, 0.1, 0.1], sc: [1.1, 0.8, 0.9], c: K.stone }, 7, 5); p.ball(0.18, { at: [-0.1, 0.1, 0.25], sc: [1, 0.7, 1], c: K.stoneD }, 6, 4);
    p.ball(0.2, { at: [0.35, 0.4, 0.1], sc: [1.2, 0.3, 1], c: K.moss }, 6, 3);
  },
  bonsaiStand(p) {
    for (const [x, z] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]) p.box(0.08, 0.34, 0.08, { at: [x, 0, z], sit: true, c: K.woodD }, 0.025);
    p.box(0.72, 0.08, 0.55, { at: [0, 0.34, 0], c: K.wood }, 0.03);
    p.cyl(0.2, 0.15, 0.14, { at: [0, 0.38, 0], sit: false }, 8); p.cyl(0.17, 0.17, 0.03, { at: [0, 0.53, 0], c: K.soil }, 8);
    p.rod([0, 0.52, 0], [0.04, 0.8, 0], 0.035, { c: K.woodD }, 5); p.rod([0.04, 0.8, 0], [-0.1, 0.95, 0], 0.025, { c: K.woodD }, 4);
    p.ball(0.19, { at: [0.0, 0.98, 0], sc: [1.3, 0.7, 1.1], c: K.leaf }, 6, 4); p.ball(0.14, { at: [-0.22, 0.88, 0.04], sc: [1.2, 0.6, 1], c: K.leafD }, 6, 4); p.ball(0.13, { at: [0.2, 0.8, 0.0], sc: [1.2, 0.6, 1], c: K.leaf }, 6, 4);
  },
  moonDeck(p) {
    p.cyl(1.9, 1.95, 0.34, { sit: true }, 10); p.ring(1.75, 0.06, { at: [0, 0.34, 0], c: K.woodD }, 20, 4); p.ring(1.1, 0.04, { at: [0, 0.35, 0], c: K.woodD }, 16, 4);
    for (let i = 0; i < 5; i++) p.slab(3.0, 0.02, 0.05, { at: [0, 0.35, -1.0 + i * 0.5], c: K.woodD });
    p.cyl(1.2, 1.28, 0.1, { at: [0, 0.34, 0], c: K.woodL }, 10);
    for (let i = 0; i < 4; i++) { const a = (i / 4 + 0.125) * TAU, x = Math.cos(a) * 1.55, z = Math.sin(a) * 1.55; p.cyl(0.08, 0.1, 0.8, { at: [x, 0.34, z], sit: false, c: K.stone }, 6); p.cyl(0.08, 0.1, 0.8, { at: [x, 0.74, z], c: K.stone }, 6); p.box(0.26, 0.24, 0.26, { at: [x, 1.26, z], c: K.lamp, g: 1 }, 0.06); p.cone(0.24, 0.2, { at: [x, 1.48, z], rot: [0, Math.PI / 4, 0], c: K.stoneD }, 4); }
    p.cyl(0.42, 0.5, 0.4, { at: [0, 0.4, 0], sit: false, c: K.stone }, 8); p.cyl(0.42, 0.5, 0.4, { at: [0, 0.62, 0], c: K.stone }, 8); p.ball(0.36, { at: [0, 1.15, 0], c: K.paper, g: 0.5 }, 9, 7);
    p.ball(0.17, { at: [0.8, 0.45, 0.8], sc: [1.2, 0.8, 1], c: K.moss }, 6, 4); p.ball(0.16, { at: [-0.9, 0.45, 0.75], sc: [1.2, 0.8, 1], c: K.moss }, 6, 4);
  },
  // Mirth: Festival
  lanternString(p) {
    for (const s of [-1, 1]) { p.cyl(0.04, 0.05, 1.4, { at: [s * 0.45, 0, 0], sit: true, c: K.wood }, 6); p.ball(0.07, { at: [s * 0.45, 1.42, 0], c: K.gold }, 6, 4); p.cyl(0.1, 0.12, 0.06, { at: [s * 0.45, 0, 0], sit: true, c: K.stoneD }, 6); }
    const f = (u) => [(u - 0.5) * 0.9, 1.4 - Math.sin(u * Math.PI) * 0.22, 0];
    for (let i = 0; i < 8; i++) p.rod(f(i / 8), f((i + 1) / 8), 0.012, { c: K.rope }, 3);
    for (let i = 0; i < 4; i++) { const [x, y] = f((i + 0.5) / 4 * 0.9 + 0.05); p.ball(0.11, { at: [x, y - 0.17, 0], sc: [1, 1.15, 1], g: 0.8 }, 6, 4); p.cyl(0.05, 0.05, 0.03, { at: [x, y - 0.04, 0], c: K.black }, 5); p.ball(0.03, { at: [x, y - 0.3, 0], c: K.red }, 4, 3); }
  },
  festivalDrum(p) {
    for (const s of [-1, 1]) p.box(0.14, 0.8, 0.9, { at: [s * 0.7, 0, 0], sit: true, c: K.wood }, 0.04);
    p.box(1.6, 0.1, 0.18, { at: [0, 0.78, 0], c: K.woodD }, 0.03);
    p.lathe([[0, 0], [0.5, 0], [0.62, 0.15], [0.68, 0.38], [0.62, 0.6], [0.5, 0.76], [0, 0.76]], { at: [0, 0.2, 0], rot: [0, 0, Math.PI / 2], sit: false }, 12);
    // (the skins: the drum lies on its side, its heads to the left and right)
    for (const s of [-1, 1]) { p.cyl(0.5, 0.5, 0.04, { at: [s * 0.4, 0.58, 0], rot: [0, 0, Math.PI / 2], c: K.paper }, 12); p.ring(0.5, 0.025, { at: [s * 0.4, 0.58, 0], rot: [0, 0, Math.PI / 2], c: K.gold }, 12, 4); }
    p.cyl(0.02, 0.02, 0.8, { at: [0.2, 0.9, 0.6], rot: [0.0, 0.5, 1.2], c: K.woodL }, 5); p.cyl(0.02, 0.02, 0.8, { at: [-0.2, 0.9, 0.6], rot: [0.0, -0.5, 1.9], c: K.woodL }, 5);
  },
  pinwheel(p) {
    p.cyl(0.025, 0.03, 1.1, { sit: true, c: K.wood }, 5);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; p.box(0.3, 0.26, 0.02, { at: [Math.cos(a) * 0.17, 1.15 + Math.sin(a) * 0.17, 0.05], rot: [0, 0, a + 0.5], c: i % 2 ? K.white : undefined, t: i % 2 ? 0 : 1 }, 0.008); }
    p.ball(0.06, { at: [0, 1.15, 0.08], c: K.gold }, 6, 4); p.cyl(0.1, 0.13, 0.08, { at: [0, 0, 0], sit: true, c: K.stoneD }, 6);
  },
  streamerPole(p) {
    p.cyl(0.04, 0.06, 1.7, { sit: true, c: K.wood }, 6); p.ball(0.09, { at: [0, 1.72, 0], c: K.gold }, 6, 4); p.cyl(0.12, 0.16, 0.1, { sit: true, c: K.stoneD }, 7);
    for (let k = 0; k < 4; k++) { const y = 1.55 - k * 0.07, dz = k % 2 ? -0.06 : 0.06, col = k === 1 ? K.white : k === 3 ? K.gold : undefined, tt = col ? 0 : 1;
      p.slab(0.5, 0.05, 0.015, { at: [0.28 + k * 0.03, y - k * 0.12, dz], rot: [0, 0, -0.35 - k * 0.1], c: col, t: tt }); p.slab(0.4, 0.05, 0.015, { at: [0.55 + k * 0.03, y - k * 0.12 - 0.25, dz], rot: [0, 0, 0.3], c: col, t: tt }); }
    for (const s of [-1, 1]) p.ball(0.07, { at: [s * 0.2, 0.14, 0.15], sc: [1, 0.6, 1], c: K.moss }, 5, 3);
  },
  bandstand(p) {
    p.cyl(1.85, 1.95, 0.4, { sit: true, c: K.wood }, 12); p.ring(1.85, 0.06, { at: [0, 0.4, 0], c: K.woodD }, 18, 4);
    p.cyl(1.5, 1.5, 0.05, { at: [0, 0.4, 0], c: K.woodL }, 12); for (let i = 0; i < 4; i++) p.slab(2.8, 0.02, 0.04, { at: [0, 0.44, -1.0 + i * 0.66], c: K.woodD });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, x = Math.cos(a) * 1.45, z = Math.sin(a) * 1.45; p.cyl(0.07, 0.08, 2.0, { at: [x, 0.4, z], sit: false, c: K.woodD }, 6); p.cyl(0.07, 0.08, 2.0, { at: [x, 1.4, z], c: K.woodD }, 6);
      p.ball(0.1, { at: [x, 1.7, z], c: K.lamp, g: 1 }, 6, 4); }
    p.cone(1.95, 1.0, { at: [0, 2.9, 0], rot: [0, Math.PI / 8, 0] }, 12); p.ball(0.13, { at: [0, 3.5, 0], c: K.gold }, 6, 4); p.cyl(1.8, 1.9, 0.12, { at: [0, 2.42, 0], c: K.woodD }, 12);
    for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * TAU; p.cone(0.14, 0.3, { at: [Math.cos(a) * 1.75, 2.22, Math.sin(a) * 1.75], rot: [Math.PI, 0, 0], c: i % 2 ? K.white : undefined, t: i % 2 ? 0 : 1 }, 4); }
    p.cyl(0.4, 0.45, 0.5, { at: [0, 0.4, -0.6], sit: false }, 10); p.cyl(0.38, 0.38, 0.03, { at: [0, 0.91, -0.6], c: K.paper }, 10);
    p.box(0.3, 0.5, 0.3, { at: [0.7, 0.4, -0.2], sit: false, c: K.red }, 0.06); p.cone(0.15, 0.3, { at: [-0.8, 0.8, -0.3], c: K.gold }, 6);
  },
  // Desire: Tea Garden
  teaTable(p) {
    p.cyl(0.8, 0.78, 0.12, { at: [0, 0.38, 0] }, 12); p.ring(0.78, 0.04, { at: [0, 0.42, 0], c: K.woodD }, 14, 4);
    for (let i = 0; i < 4; i++) { const a = (i / 4 + 0.125) * TAU; p.box(0.14, 0.38, 0.14, { at: [Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55], sit: true, c: K.woodD }, 0.04); }
    p.slab(0.5, 0.012, 0.16, { at: [0, 0.445, 0.05], c: K.red });
    p.ball(0.15, { at: [-0.25, 0.6, -0.1], sc: [1, 0.85, 1], c: K.white }, 8, 6); p.cyl(0.04, 0.04, 0.06, { at: [-0.25, 0.77, -0.1], c: K.white }, 5); p.ball(0.03, { at: [-0.4, 0.55, -0.1], c: K.white }, 4, 3);
    for (const [x, z] of [[0.18, 0.18], [0.35, -0.1], [0.05, 0.38]]) p.cyl(0.065, 0.045, 0.08, { at: [x, 0.5, z], c: K.white }, 7);
    p.ball(0.12, { at: [0.35, 0.5, 0.35], sc: [1.3, 0.5, 1], c: K.moss }, 5, 3);
  },
  floorCushion(p) {
    p.box(0.85, 0.2, 0.85, { sit: true }, 0.09); p.ball(0.07, { at: [0, 0.19, 0], sc: [1, 0.5, 1], c: K.gold }, 6, 3);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { p.ball(0.045, { at: [x * 0.42, 0.1, z * 0.42], c: K.gold }, 5, 4); p.cone(0.03, 0.12, { at: [x * 0.45, 0.04, z * 0.45], rot: [Math.PI, 0, 0], c: K.gold }, 4); }
    p.slab(0.5, 0.012, 0.05, { at: [0, 0.2, 0.3], rot: [0, 0, 0], c: K.paper }); p.ball(0.12, { at: [0.45, 0, 0.45], sc: [1, 0.8, 1], sit: true, c: K.paper }, 5, 4);
  },
  parasol(p) {
    p.cyl(0.55, 0.62, 0.12, { sit: true, c: K.stone }, 9); p.cyl(0.04, 0.05, 1.9, { at: [0, 0.12, 0], sit: false, c: K.woodD }, 6);
    p.cyl(0.04, 0.05, 1.9, { at: [0, 1.07, 0], c: K.woodD }, 6);
    p.cone(1.35, 0.55, { at: [0, 2.15, 0] }, 12); p.cone(0.72, 0.3, { at: [0, 2.32, 0.0], c: K.paper, t: 0.2 }, 12); p.ball(0.08, { at: [0, 2.5, 0], c: K.gold }, 5, 4);
    p.ring(1.33, 0.035, { at: [0, 1.9, 0], c: K.woodL }, 18, 4);
    p.box(0.6, 0.3, 0.6, { at: [0.55, 0, 0.5], rot: [0, 0.4, 0], sit: true, c: K.wood }, 0.07); p.cyl(0.1, 0.07, 0.1, { at: [0.55, 0.3, 0.5], c: K.white }, 6);
  },
  teaKettle(p) {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.cyl(0.04, 0.03, 0.2, { at: [x * 0.22, 0, z * 0.22], sit: true, c: K.iron }, 5);
    p.cyl(0.3, 0.26, 0.22, { at: [0, 0.2, 0], c: K.iron }, 8); p.cyl(0.24, 0.24, 0.03, { at: [0, 0.42, 0], c: K.ember, g: 0.35 }, 8);
    p.ball(0.26, { at: [0, 0.6, 0], sc: [1, 0.85, 1] }, 9, 6); p.cyl(0.1, 0.12, 0.06, { at: [0, 0.82, 0], c: K.iron }, 7); p.ball(0.045, { at: [0, 0.88, 0], c: K.gold }, 5, 4);
    p.cone(0.07, 0.26, { at: [0.33, 0.66, 0], rot: [0, 0, -1.1], c: K.iron }, 6);
    p.arc(0.27, 0.025, { at: [0, 0.8, 0], rot: [0, 0, 0], c: K.iron }, Math.PI);
  },
  teaHouse(p) {
    p.box(3.6, 0.22, 3.0, { at: [0, 0, -0.1], sit: true, c: K.stone }, 0.06); p.box(3.1, 0.18, 2.5, { at: [0, 0.22, -0.2], c: K.woodL }, 0.05);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.box(0.16, 1.7, 0.16, { at: [sx * 1.35, 0.4, -0.2 + sz * 1.0], c: K.woodD }, 0.04);
    p.box(2.7, 1.45, 0.1, { at: [0, 0.4, -1.2], c: K.paper }, 0.03); p.box(0.1, 1.45, 2.0, { at: [-1.35, 0.4, -0.2], c: K.paper }, 0.03); p.box(0.1, 1.45, 2.0, { at: [1.35, 0.4, -0.2], c: K.paper }, 0.03);
    for (const x of [-0.9, 0, 0.9]) p.slab(0.04, 1.4, 0.05, { at: [x, 0.42, -1.14], c: K.woodD }); p.slab(2.6, 0.04, 0.05, { at: [0, 1.1, -1.14], c: K.woodD });
    p.ring(0.32, 0.04, { at: [1.28, 1.0, -0.2], rot: [0, 0, Math.PI / 2], c: K.woodD }, 12, 4);
    p.box(2.2, 0.1, 0.1, { at: [0, 1.95, 0.8], c: K.woodD }, 0.03); p.box(0.1, 1.5, 0.1, { at: [-0.5, 0.45, 0.78], c: K.woodD }, 0.03);
    p.cone(2.75, 1.25, { at: [0, 2.55, -0.2], rot: [0, Math.PI / 4, 0], sc: [1.0, 1, 0.85] }, 4); p.ball(0.45, { at: [0, 2.35, -0.2], sc: [3.0, 0.4, 2.2], c: K.rope }, 8, 3);
    p.cyl(0.12, 0.14, 0.4, { at: [-0.9, 3.0, -0.6], c: K.stoneD }, 6); p.ball(0.15, { at: [0, 3.2, -0.2], c: K.gold }, 6, 4);
    p.box(0.9, 0.12, 0.7, { at: [0, 0, 1.55], sit: true, c: K.stone }, 0.05); p.box(0.6, 0.1, 0.5, { at: [0.5, 0, 1.95], sit: true, c: K.stoneD }, 0.04);
    p.box(0.26, 0.26, 0.26, { at: [1.5, 0.9, 1.2], c: K.lamp, g: 1 }, 0.06); p.cyl(0.04, 0.05, 0.9, { at: [1.5, 0, 1.2], sit: true, c: K.woodD }, 5); p.cone(0.24, 0.16, { at: [1.5, 1.14, 1.2], rot: [0, Math.PI / 4, 0] }, 4);
    p.box(1.2, 0.04, 1.0, { at: [0, 0.42, -0.2], c: K.moss, t: 0.2 }, 0.02); p.cyl(0.18, 0.14, 0.12, { at: [0, 0.48, -0.1], c: K.white }, 7);
  },
};
