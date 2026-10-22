// ---------------------------------------------------------------------------------------
// THE COOL SETS: Rain Garden (Grief), Koi Pond (Dread) and Sound (docs/plans/GARDEN-COZY.md D3): a rain chain and a willow, a koi bridge
// and a mist stone, a wind chime and a music box. Muted, wet and gentle, never grim (the middle of the dial is never ugly, 2.6).
// Prior art: the Japanese kusari-doi (rain chain) and furin (wind bell), the yatsuhashi zigzag bridge over a koi pond, the Suzhou moon
// gate, Animal Crossing's gramophone and music box, Ghibli's rain-washed greys.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { K } from './kit.js';

const TAU = Math.PI * 2;

export const COOL = {
  // Grief: Rain Garden
  rainChain(p) {
    p.box(0.5, 0.06, 0.08, { at: [0, 1.4, -0.1], c: K.iron }, 0.02); p.rod([-0.22, 1.4, -0.1], [-0.22, 0.9, -0.1], 0.03, { c: K.woodD }, 5); p.rod([-0.22, 0.9, -0.1], [0, 1.4, -0.1], 0.025, { c: K.woodD }, 4);
    for (let i = 0; i < 4; i++) { const y = 1.3 - i * 0.27; p.lathe([[0, 0], [0.07, 0.02], [0.14, 0.17], [0.1, 0.18], [0.04, 0.05], [0, 0.04]], { at: [0.22, y - 0.16, -0.1], c: undefined }, 6); p.rod([0.22, y + 0.02, -0.1], [0.22, y - 0.06, -0.1], 0.008, { c: K.iron }, 3); }
    p.rod([0.22, 1.4, -0.1], [0.22, 1.28, -0.1], 0.01, { c: K.iron }, 3);
    p.cyl(0.4, 0.44, 0.1, { at: [0.22, 0, 0.1], sit: true, c: K.stone }, 9); p.cyl(0.32, 0.32, 0.02, { at: [0.22, 0.1, 0.1], c: K.water }, 9);
    for (const [x, z] of [[-0.3, 0.3], [0.62, 0.35], [0.55, -0.2]]) p.ball(0.1, { at: [x, 0.06, z], sc: [1, 0.7, 1], c: K.stoneD }, 5, 4);
  },
  willow(p) {
    p.rod([0, 0, 0.1], [0.05, 0.9, 0], 0.2, { c: K.woodD }, 7); p.rod([0.05, 0.9, 0], [-0.1, 1.9, -0.05], 0.15, { c: K.wood }, 7); p.rod([-0.1, 1.9, -0.05], [-0.7, 2.5, 0], 0.07, { c: K.wood }, 5); p.rod([-0.1, 1.9, -0.05], [0.6, 2.6, 0.1], 0.07, { c: K.wood }, 5);
    p.cyl(0.28, 0.4, 0.14, { at: [0, 0, 0.1], sit: true, c: K.woodD }, 7);
    p.ball(0.8, { at: [0, 2.85, 0], sc: [1.25, 0.65, 1.25] }, 9, 6);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU, r = i % 2 ? 1.15 : 0.85, h = 1.5 + ((i * 7) % 5) * 0.12, x = Math.cos(a) * r, z = Math.sin(a) * r;
      p.cone(0.12, h, { at: [x, 2.75 - h / 2, z], rot: [Math.PI, 0, 0], sc: [1, 1, 1] }, 5); p.rod([x * 0.6, 2.8, z * 0.6], [x, 2.7, z], 0.05, {}, 4);
    }
    p.ball(0.26, { at: [0.8, 0.1, 0.9], sc: [1.3, 0.55, 1], c: K.moss }, 6, 4); p.ball(0.22, { at: [-0.9, 0.1, 0.7], sc: [1.3, 0.5, 1], c: K.moss }, 6, 4);
    p.ball(0.3, { at: [1.1, 0.1, -0.6], sc: [1.1, 0.7, 1], c: K.stone }, 6, 4);
  },
  rainBarrel(p) {
    p.lathe([[0, 0], [0.32, 0], [0.4, 0.2], [0.42, 0.4], [0.4, 0.6], [0.34, 0.76], [0.3, 0.78], [0.3, 0.7], [0, 0.7]], { sit: false }, 9);
    p.cyl(0.29, 0.29, 0.02, { at: [0, 0.76, 0], c: K.water }, 9);
    for (const y of [0.14, 0.52]) p.ring(y < 0.3 ? 0.375 : 0.4, 0.022, { at: [0, y, 0], c: K.iron }, 12, 4);
    p.ring(0.33, 0.03, { at: [0, 0.77, 0], c: K.woodD }, 12, 4);
    p.cyl(0.04, 0.04, 0.5, { at: [0.55, 0.8, 0], rot: [0, 0, 0.9], c: K.stoneD }, 5);
    p.cone(0.08, 0.12, { at: [0.35, 0.82, 0], rot: [Math.PI, 0, 0], c: K.water }, 5);
  },
  windBell(p) {
    p.rod([-0.3, 0, -0.1], [-0.3, 1.5, -0.1], 0.045, { c: K.wood }, 6); p.rod([-0.3, 1.5, -0.1], [0.12, 1.5, -0.1], 0.035, { c: K.wood }, 6); p.cyl(0.14, 0.17, 0.08, { at: [-0.3, 0, -0.1], sit: true, c: K.stoneD }, 6);
    p.rod([0.12, 1.5, -0.1], [0.12, 1.3, -0.1], 0.01, { c: K.iron }, 3);
    p.lathe([[0, 0.2], [0.05, 0.2], [0.16, 0.17], [0.2, 0.05], [0.21, 0], [0.17, 0.0], [0.13, 0.05], [0.05, 0.1], [0, 0.1]], { at: [0.12, 1.08, -0.1] }, 10);
    p.rod([0.12, 1.2, -0.1], [0.12, 1.0, -0.1], 0.008, { c: K.iron }, 3); p.ball(0.03, { at: [0.12, 1.0, -0.1], c: K.brass }, 4, 3);
    p.rod([0.12, 1.0, -0.1], [0.12, 0.82, -0.1], 0.007, { c: K.iron }, 3); p.box(0.1, 0.22, 0.012, { at: [0.12, 0.7, -0.1], rot: [0, 0.4, 0.1], c: K.paper }, 0.004);
    p.ball(0.11, { at: [0.3, 0.1, 0.2], sc: [1.2, 0.7, 1], c: K.stoneD }, 5, 4);
  },
  rainPavilion(p) {
    p.cyl(1.95, 2.0, 0.3, { sit: true, c: K.stone }, 8); p.cyl(1.6, 1.6, 0.06, { at: [0, 0.3, 0], c: K.stoneL }, 8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { p.cyl(0.11, 0.13, 2.2, { at: [sx * 1.35, 0.3, sz * 1.35], sit: false, c: K.woodD }, 6); p.cyl(0.11, 0.13, 2.2, { at: [sx * 1.35, 1.4, sz * 1.35], c: K.woodD }, 6); p.cyl(0.2, 0.2, 0.1, { at: [sx * 1.35, 0.35, sz * 1.35], c: K.stone }, 6); }
    for (const [x, z, w, d] of [[0, -1.35, 2.7, 0.1], [0, 1.35, 2.7, 0.1], [-1.35, 0, 0.1, 2.7], [1.35, 0, 0.1, 2.7]]) p.box(w, 0.12, d, { at: [x, 2.2, z], c: K.wood }, 0.03);
    p.cone(3.0, 1.1, { at: [0, 2.95, 0], rot: [0, Math.PI / 4, 0] }, 4); p.cone(2.4, 0.4, { at: [0, 2.5, 0], rot: [0, Math.PI / 4, 0], c: K.woodD, t: 0.15 }, 4); p.ball(0.18, { at: [0, 3.6, 0], c: K.gold }, 6, 4);
    p.lathe([[0, 0], [0.55, 0], [0.62, 0.2], [0.6, 0.34], [0.5, 0.34], [0.5, 0.26], [0, 0.26]], { at: [0, 0.36, 0], c: K.stone }, 10); p.cyl(0.5, 0.5, 0.02, { at: [0, 0.6, 0], c: K.water }, 10);
    for (const [sx, sz] of [[-1, 1], [1, 1]]) { for (let i = 0; i < 5; i++) p.ball(0.07, { at: [sx * 1.55, 2.1 - i * 0.38, sz * 1.55], sc: [1, 1.2, 1], c: K.iron }, 5, 4); p.rod([sx * 1.55, 2.2, sz * 1.55], [sx * 1.55, 0.35, sz * 1.55], 0.01, { c: K.iron }, 3); }
    p.box(0.8, 0.14, 0.4, { at: [0, 0, 1.95], sit: true, c: K.stone }, 0.05);
  },
  // Dread: Koi Pond
  koiBridge(p) {
    p.cyl(1.45, 1.5, 0.16, { sit: true, c: K.stone }, 14); p.cyl(1.3, 1.3, 0.12, { at: [0, 0.08, 0], c: K.waterD }, 14); p.ring(1.38, 0.1, { at: [0, 0.15, 0], c: K.stoneD }, 16, 5);
    const seg = [[-1.0, 0.7, 0.0], [-0.3, 0.7, 0.0]]; // (a zigzag of three planks over the water, on short posts)
    p.box(1.0, 0.09, 0.62, { at: [-0.85, 0.5, -0.3], rot: [0, 0.0, 0] }, 0.03); p.box(0.62, 0.09, 1.0, { at: [-0.35, 0.5, 0.12], rot: [0, 0, 0] }, 0.03); p.box(1.0, 0.09, 0.62, { at: [0.2, 0.5, 0.45], rot: [0, 0, 0] }, 0.03); p.box(0.62, 0.09, 1.0, { at: [0.75, 0.5, 0.08], rot: [0, 0, 0] }, 0.03);
    for (const [x, z] of [[-1.15, -0.5], [-0.55, 0.45], [0.2, 0.7], [0.95, -0.3], [-0.4, -0.5], [0.6, 0.55]]) p.cyl(0.07, 0.08, 0.5, { at: [x, 0.1, z], c: K.woodD }, 5);
    for (const [x, z] of [[-1.35, -0.62], [1.1, -0.5]]) p.cyl(0.05, 0.05, 0.5, { at: [x, 0.5, z], c: K.woodD }, 5);
    p.ring(0.5, 0.03, { at: [-0.1, 0.17, -0.55], c: K.mist }, 10, 3);
    p.ball(0.17, { at: [-0.5, 0.2, -0.2], sc: [2.2, 0.38, 0.9], rot: [0, 0.6, 0], c: K.koi }, 7, 4); p.ball(0.12, { at: [0.4, 0.2, -0.45], sc: [2.2, 0.38, 0.9], rot: [0, 2.3, 0], c: K.white }, 7, 4);
    p.ball(0.1, { at: [0.0, 0.2, 0.3], sc: [2.2, 0.38, 0.9], rot: [0, -0.5, 0], c: K.koi }, 6, 4);
    p.ball(0.16, { at: [1.05, 0.18, 0.5], sc: [1, 0.35, 1], c: K.leaf }, 6, 3);
  },
  mistStone(p) {
    p.box(0.52, 1.3, 0.38, { sit: true, rot: [0, 0.3, 0.05] }, 0.15); p.ball(0.3, { at: [0.0, 1.28, 0], sc: [1, 0.8, 0.8] }, 7, 5);
    p.ball(0.12, { at: [0.16, 0.8, 0.2], sc: [1, 1, 0.5], c: K.moss }, 5, 4);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU, r = 0.38 + (i % 2) * 0.1; p.ball(0.17 + (i % 3) * 0.04, { at: [Math.cos(a) * r, 0.1, Math.sin(a) * r], sc: [1.3, 0.65, 1.3], c: K.mist }, 6, 4); }
    p.ball(0.22, { at: [0.1, 0.78, 0.2], sc: [1.3, 0.7, 1.2], c: K.mist, t: 0 }, 6, 4);
  },
  lilyPads(p) {
    p.cyl(0.46, 0.46, 0.05, { sit: true, c: K.waterD }, 12);
    for (const [x, z, r, a] of [[-0.18, -0.12, 0.26, 0.3], [0.2, 0.1, 0.22, 2.2], [-0.1, 0.28, 0.17, 4.0]]) p.geo(cylPad(r, a), { at: [x, 0.07, z], c: K.leaf });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; p.cone(0.07, 0.2, { at: [0.25 + Math.cos(a) * 0.07, 0.2, 0.0 + Math.sin(a) * 0.07], rot: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9] }, 4); }
    p.ball(0.045, { at: [0.25, 0.2, 0.0], c: K.gold }, 4, 3); p.rod([0.25, 0.05, 0], [0.25, 0.18, 0], 0.012, { c: K.leafD }, 3);
    p.ball(0.07, { at: [-0.3, 0.1, 0.3], c: K.white }, 5, 4);
  },
  stoneFrog(p) {
    p.cyl(0.4, 0.44, 0.1, { sit: true, c: K.stone }, 9); p.ball(0.3, { at: [0, 0.4, 0], sc: [1.1, 0.8, 1.2] }, 9, 6); p.ball(0.22, { at: [0, 0.48, 0.2], sc: [1, 0.8, 1] }, 8, 5);
    for (const s of [-1, 1]) { p.ball(0.09, { at: [s * 0.15, 0.68, 0.2] }, 6, 4); p.ball(0.04, { at: [s * 0.16, 0.7, 0.27], c: K.black }, 4, 3); p.ball(0.12, { at: [s * 0.26, 0.2, -0.1], sc: [0.7, 0.8, 1.5] }, 6, 4); p.ball(0.07, { at: [s * 0.14, 0.17, 0.4], sc: [1, 0.6, 1.4] }, 5, 4); }
    p.ball(0.09, { at: [-0.3, 0.14, 0.2], sc: [1.4, 0.3, 1], c: K.leaf }, 5, 3);
  },
  moonGate(p) {
    const s = new THREE.Shape(); s.moveTo(-1.9, 0); s.lineTo(1.9, 0); s.lineTo(1.9, 2.6); s.lineTo(-1.9, 2.6); s.lineTo(-1.9, 0);
    const h = new THREE.Path(); h.absarc(0, 1.2, 1.0, 0, TAU, true); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1, curveSegments: 16 }); g.translate(0, 0, -0.15);
    p.geo(g, {}); p.ring(1.0, 0.1, { at: [0, 1.2, 0], rot: [Math.PI / 2, 0, 0], c: K.stoneL }, 24, 5);
    for (const sx of [-1, 1]) { p.box(0.5, 0.2, 0.55, { at: [sx * 1.7, 0, 0], sit: true, c: K.stoneD }, 0.05); p.box(0.5, 0.2, 0.55, { at: [sx * 1.7, 2.6, 0], c: K.stoneD }, 0.05); }
    p.box(3.9, 0.14, 0.52, { at: [0, 2.7, 0], c: K.stoneD }, 0.04); p.box(3.7, 0.1, 0.46, { at: [0, 2.82, 0], c: K.stoneL }, 0.03);
    p.box(3.9, 0.2, 0.52, { at: [0, 0, 0], sit: true, c: K.stoneD }, 0.05); p.box(1.0, 0.1, 0.6, { at: [0, 0, 0], sit: true, c: K.stone }, 0.03);
    for (const sx of [-1, 1]) { p.box(0.22, 0.22, 0.22, { at: [sx * 1.5, 0.2, 0.55], sit: false, c: K.lamp, g: 1 }, 0.05); p.cyl(0.04, 0.05, 0.2, { at: [sx * 1.5, 0, 0.55], sit: true, c: K.stone }, 5); p.ball(0.34, { at: [sx * 1.0, 0.18, -0.4], sc: [1.3, 0.6, 1], c: K.moss }, 6, 4); }
    p.ball(0.4, { at: [0, 0.1, 0.55], sc: [1.4, 0.4, 1], c: K.mist }, 6, 4); p.ball(0.3, { at: [-0.5, 0.1, 0.65], sc: [1.4, 0.4, 1], c: K.mist }, 6, 4); p.ball(0.3, { at: [0.55, 0.1, 0.7], sc: [1.4, 0.4, 1], c: K.mist }, 6, 4);
  },
  // Sound
  windChime(p) {
    p.rod([-0.35, 0, 0], [-0.35, 1.45, 0], 0.04, { c: K.wood }, 6); p.rod([-0.35, 1.45, 0], [0.1, 1.45, 0], 0.035, { c: K.wood }, 6); p.cyl(0.14, 0.18, 0.08, { at: [-0.35, 0, 0], sit: true, c: K.stoneD }, 6);
    p.cyl(0.2, 0.2, 0.04, { at: [0.1, 1.2, 0], c: K.woodD }, 8); p.rod([0.1, 1.45, 0], [0.1, 1.22, 0], 0.01, { c: K.iron }, 3);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU, x = 0.1 + Math.cos(a) * 0.13, z = Math.sin(a) * 0.13, L = 0.45 + (i % 3) * 0.1; p.rod([x, 1.2, z], [x, 1.2 - L, z], 0.022, {}, 5); }
    p.ball(0.04, { at: [0.1, 0.78, 0], c: K.iron }, 4, 3); p.rod([0.1, 1.2, 0], [0.1, 0.8, 0], 0.006, { c: K.iron }, 3); p.box(0.12, 0.22, 0.01, { at: [0.1, 0.62, 0], rot: [0, 0.5, 0], c: K.paper }, 0.003);
    p.ball(0.12, { at: [0.3, 0.1, 0.25], sc: [1.2, 0.7, 1], c: K.stoneD }, 5, 4);
  },
  musicBox(p) {
    p.box(0.8, 0.34, 0.55, { sit: true, c: K.wood }, 0.07); p.box(0.7, 0.04, 0.46, { at: [0, 0.34, 0], c: K.brass }, 0.015);
    p.box(0.8, 0.06, 0.55, { at: [0, 0.54, -0.42], rot: [-1.1, 0, 0] }, 0.025); p.box(0.78, 0.05, 0.1, { at: [0, 0.34, 0.3], c: K.woodD }, 0.02);
    p.cyl(0.07, 0.07, 0.4, { at: [0, 0.4, 0], rot: [0, 0, Math.PI / 2], c: K.brass }, 6); for (let i = 0; i < 6; i++) p.slab(0.04, 0.012, 0.18, { at: [-0.25 + i * 0.1, 0.37, 0.12], c: K.gold });
    p.rod([0.4, 0.2, 0], [0.56, 0.2, 0], 0.025, { c: K.iron }, 4); p.ball(0.06, { at: [0.58, 0.2, 0], c: K.gold }, 5, 4); p.rod([0.58, 0.2, 0], [0.6, 0.2, 0.12], 0.015, { c: K.iron }, 3);
    p.cyl(0.07, 0.04, 0.18, { at: [-0.12, 0.43, -0.05], c: K.white }, 6); p.ball(0.05, { at: [-0.12, 0.65, -0.05], c: K.white }, 5, 4);
    for (const [x, y, z] of [[0.15, 0.95, 0.1], [-0.3, 0.8, 0.2], [0.3, 0.7, -0.2]]) p.ball(0.045, { at: [x, y, z], c: K.gold, t: 0.3 }, 4, 3);
  },
  gramophone(p) {
    p.box(1.1, 0.7, 0.9, { sit: true, c: K.wood }, 0.1); p.box(1.0, 0.07, 0.8, { at: [0, 0.7, 0], c: K.woodL }, 0.03);
    p.cyl(0.38, 0.38, 0.04, { at: [-0.1, 0.77, 0.05], c: K.black }, 14); p.cyl(0.08, 0.08, 0.05, { at: [-0.1, 0.81, 0.05], c: K.red }, 8);
    p.rod([0.38, 0.75, 0.3], [0.1, 0.9, 0.15], 0.025, { c: K.brass }, 4);
    p.rod([0.52, 0.8, -0.28], [0.52, 1.25, -0.28], 0.05, { c: K.brass }, 6);
    p.lathe([[0.04, 0], [0.1, 0.18], [0.22, 0.42], [0.42, 0.62], [0.72, 0.78], [0.76, 0.82], [0.68, 0.82], [0.4, 0.68], [0.18, 0.46], [0.07, 0.2], [0, 0.02]], { at: [0.0, 1.3, -0.3], rot: [-0.55, 0, 0.0], c: K.brass }, 14);
    p.rod([0.52, 1.28, -0.28], [0.3, 1.45, -0.32], 0.04, { c: K.brass }, 5);
    p.rod([-0.55, 0.4, 0.46], [-0.72, 0.4, 0.46], 0.03, { c: K.iron }, 4); p.ball(0.06, { at: [-0.75, 0.4, 0.46], c: K.gold }, 5, 4);
    p.box(0.22, 0.22, 0.22, { at: [0.7, 0, 0.7], sit: true, c: K.stoneD }, 0.06);
  },
};

function cylPad(r, a) { return new THREE.CylinderGeometry(r, r, 0.03, 10, 1, false, a, TAU - 0.9); }
