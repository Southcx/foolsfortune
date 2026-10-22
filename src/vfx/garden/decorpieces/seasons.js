// ---------------------------------------------------------------------------------------
// THE SEASON AND BRIAR SETS: Seasons (a blossom tree, a reed screen, a pumpkin and a snow lantern) and Briar (a bramble hedge, a thorn
// arch, the briar throne), docs/plans/GARDEN-COZY.md D3, E and A6. The briar's forms are the dial run backwards: the same soft toy
// shapes, but spiked, olive and rust, with berries and a red rose or two so even the briar is still beautiful.
// Prior art: Sakura at Animal Crossing's spring, Halloween's jack-o'-lantern, the yukimi-doro (snow-viewing lantern), the yoshizu reed
// screen, Sleeping Beauty's briar wall, Hollow Knight's Queen's Gardens, Ori's overgrowth.
// ---------------------------------------------------------------------------------------
import { K } from './kit.js';

const TAU = Math.PI * 2;
const thorns = (p, pts, n = 1) => { for (const [x, y, z, rx, rz] of pts) for (let i = 0; i < n; i++) p.cone(0.04, 0.17, { at: [x, y, z], rot: [rx, 0, rz], c: K.thorn }, 4); };

export const SEASONS = {
  blossomTree(p) {
    p.rod([0, 0, 0.05], [0.05, 1.0, 0], 0.17, { c: K.woodD }, 6); p.rod([0.05, 1.0, 0], [-0.4, 1.8, 0.1], 0.1, { c: K.woodD }, 5); p.rod([0.05, 1.0, 0], [0.55, 1.9, -0.1], 0.1, { c: K.woodD }, 5); p.cyl(0.26, 0.4, 0.12, { at: [0, 0, 0.05], sit: true, c: K.woodD }, 7);
    for (const [x, y, z, r] of [[0, 2.5, 0, 0.8], [-0.7, 2.15, 0.2, 0.6], [0.75, 2.3, -0.1, 0.65], [0.1, 2.0, 0.65, 0.5], [-0.15, 2.1, -0.65, 0.5], [0.3, 2.95, 0.1, 0.45]]) p.ball(r, { at: [x, y, z], sc: [1.1, 0.85, 1.1] }, 8, 5);
    for (let i = 0; i < 6; i++) p.ball(0.1, { at: [Math.cos(i * 1.3) * (0.7 + (i % 3) * 0.4), 0.05, Math.sin(i * 1.3) * (0.6 + (i % 2) * 0.5)], sc: [1.3, 0.25, 1], c: K.pink }, 5, 3);
    p.ball(0.2, { at: [-1.0, 0.1, 0.8], sc: [1.3, 0.5, 1], c: K.moss }, 5, 3);
  },
  reedScreen(p) {
    for (const s of [-1, 1]) { p.box(0.14, 1.6, 0.14, { at: [s * 0.95, 0, 0], sit: true, c: K.woodD }, 0.04); p.box(0.3, 0.1, 0.5, { at: [s * 0.95, 0, 0], sit: true, c: K.wood }, 0.03); }
    for (let i = 0; i < 15; i++) { const x = -0.84 + i * 0.12, h = 1.35 + (i % 4) * 0.05; p.cyl(0.04, 0.05, h, { at: [x, 0.15, 0], sit: false, rot: [0, 0, 0] }, 5); p.cyl(0.04, 0.05, h, { at: [x, 0.15 + h / 2, 0], t: 1 }, 5); }
    for (const y of [0.4, 0.9, 1.35]) p.slab(1.85, 0.06, 0.1, { at: [0, y, 0.05], c: K.rope });
    p.box(2.0, 0.1, 0.16, { at: [0, 1.58, 0], c: K.woodD }, 0.03);
    p.ball(0.18, { at: [1.1, 0.12, 0.5], sc: [1.3, 0.6, 1], c: K.moss }, 5, 4);
  },
  pumpkinLantern(p) {
    p.ball(0.4, { at: [0, 0.34, 0], sc: [1.1, 0.85, 1.1] }, 8, 6); p.ball(0.4, { at: [0, 0.34, 0], sc: [0.8, 0.85, 1.12], rot: [0, 1.05, 0] }, 7, 6); p.ball(0.4, { at: [0, 0.34, 0], sc: [0.8, 0.85, 1.12], rot: [0, -1.05, 0] }, 7, 6);
    p.cyl(0.05, 0.07, 0.14, { at: [0, 0.7, 0], rot: [0, 0, 0.2], c: K.leafD }, 5); p.rod([0.04, 0.72, 0], [0.2, 0.62, 0.0], 0.012, { c: K.leaf }, 3);
    p.cone(0.07, 0.12, { at: [-0.14, 0.44, 0.41], rot: [Math.PI / 2, 0, 0], c: K.lamp, g: 1 }, 3); p.cone(0.07, 0.12, { at: [0.14, 0.44, 0.41], rot: [Math.PI / 2, 0, 0], c: K.lamp, g: 1 }, 3);
    p.box(0.3, 0.1, 0.06, { at: [0, 0.22, 0.4], c: K.lamp, g: 1 }, 0.02); p.slab(0.07, 0.07, 0.05, { at: [-0.1, 0.27, 0.4], c: K.lamp, g: 1 }); p.slab(0.07, 0.07, 0.05, { at: [0.1, 0.27, 0.4], c: K.lamp, g: 1 });
    p.ball(0.12, { at: [0.45, 0.06, 0.2], sc: [1, 0.5, 1], c: K.leaf }, 4, 3);
  },
  snowLantern(p) {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.3; p.rod([Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28], [Math.cos(a) * 0.14, 0.34, Math.sin(a) * 0.14], 0.045, { c: K.stone }, 5); p.ball(0.06, { at: [Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3], c: K.stoneD }, 4, 3); }
    p.cyl(0.2, 0.15, 0.06, { at: [0, 0.35, 0], c: K.stoneD }, 8); p.ball(0.19, { at: [0, 0.56, 0], c: K.lamp, g: 1, sc: [1, 0.95, 1] }, 8, 6);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + Math.PI / 4; p.rod([Math.cos(a) * 0.2, 0.4, Math.sin(a) * 0.2], [Math.cos(a) * 0.2, 0.74, Math.sin(a) * 0.2], 0.012, { c: K.stoneD }, 3); }
    p.cone(0.52, 0.28, { at: [0, 0.88, 0] }, 9); p.ball(0.42, { at: [0, 1.0, 0], sc: [1, 0.32, 1], c: K.snow }, 9, 5); p.ball(0.07, { at: [0, 1.15, 0], c: K.snow }, 5, 4);
    p.ball(0.2, { at: [0.45, 0.05, 0.3], sc: [1.3, 0.5, 1], c: K.snow }, 6, 4);
  },
  // Briar
  brambleHedge(p) {
    for (const [x, y, z, r] of [[-0.3, 0.3, 0, 0.3], [0.05, 0.38, -0.05, 0.34], [0.35, 0.3, 0.05, 0.28], [-0.05, 0.3, 0.2, 0.25]]) p.ball(r, { at: [x, y, z], sc: [1, 0.85, 1] }, 7, 5);
    for (let i = 0; i < 5; i++) { const a = i * 1.7, x = Math.cos(a) * 0.4, z = Math.sin(a) * 0.3; p.rod([x * 0.5, 0.2, z * 0.5], [x * 1.1, 0.5 + (i % 3) * 0.12, z * 1.1], 0.02, { c: K.thorn }, 4); }
    thorns(p, [[0.35, 0.5, 0.2, 0.9, -0.6], [-0.4, 0.45, 0.2, 0.9, 0.7], [0.0, 0.7, 0.0, 0, 0], [0.4, 0.3, -0.3, -0.9, -0.6], [-0.3, 0.3, -0.3, -0.9, 0.5], [0.1, 0.5, 0.35, 1.2, 0.1]]);
    for (const [x, y, z] of [[0.2, 0.52, 0.25], [-0.25, 0.4, 0.28], [0.4, 0.4, -0.2]]) p.ball(0.055, { at: [x, y, z], c: K.red }, 4, 3);
  },
  thornArch(p) {
    const f = (u) => [Math.cos(u * Math.PI) * 0.85, 0.2 + Math.sin(u * Math.PI) * 1.75];
    for (let i = 0; i < 8; i++) { const a = f(i / 8), b = f((i + 1) / 8); p.rod([a[0], a[1], 0], [b[0], b[1], 0], 0.09, {}, 6); p.rod([a[0] * 0.98, a[1] + 0.05, 0.09], [b[0] * 0.98, b[1] + 0.04, 0.12], 0.04, { c: K.thorn }, 4); }
    for (const s of [-1, 1]) { p.ball(0.3, { at: [s * 0.85, 0.15, 0], sc: [1.1, 0.6, 1.1], c: K.leafD }, 6, 4); p.ball(0.25, { at: [s * 0.85, 0.12, 0.35], sc: [1.1, 0.6, 1.1], c: K.thorn }, 6, 4); }
    for (let i = 0; i < 10; i++) { const u = (i + 0.5) / 10, a = f(u), nx = Math.cos(u * Math.PI), ny = Math.sin(u * Math.PI); p.cone(0.04, 0.2, { at: [a[0] + nx * 0.1, a[1] + ny * 0.1, i % 2 ? 0.08 : -0.08], rot: [0, 0, -Math.atan2(nx, ny)], c: K.thorn }, 4); }
    p.ball(0.12, { at: [0, 1.98, 0.1], c: K.red }, 5, 4); p.ball(0.07, { at: [0.5, 1.7, 0.1], c: K.red }, 4, 3);
    p.ball(0.28, { at: [0.2, 1.95, -0.05], sc: [1.4, 0.6, 1], c: K.leaf }, 6, 4);
  },
  briarThrone(p) {
    p.cyl(1.7, 1.8, 0.2, { sit: true, c: K.thorn }, 10); p.box(1.4, 0.5, 1.2, { at: [0, 0.2, 0] }, 0.14); p.box(1.2, 0.2, 1.0, { at: [0, 0.7, 0.05], c: K.leaf, t: 0.25 }, 0.08);
    p.box(1.3, 1.8, 0.28, { at: [0, 0.7, -0.5], rot: [-0.08, 0, 0] }, 0.12); p.ball(0.62, { at: [0, 2.55, -0.55], sc: [1.1, 1, 0.38] }, 8, 6);
    for (const s of [-1, 1]) { p.box(0.28, 0.5, 1.0, { at: [s * 0.72, 0.7, 0.05] }, 0.1); p.rod([s * 0.72, 1.18, 0.5], [s * 0.72, 0.4, 0.5], 0.06, { c: K.thorn }, 5); }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI, x = Math.cos(a) * 0.95, y = 1.7 + Math.sin(a) * 0.95; p.ball(0.1, { at: [x, y + 0.1, -0.55], c: K.thorn }, 5, 4); if (i < 8) { const b = ((i + 1) / 9) * Math.PI; p.rod([x, y + 0.1, -0.55], [Math.cos(b) * 0.95, 1.7 + Math.sin(b) * 0.95 + 0.1, -0.55], 0.065, { c: K.thorn }, 5); } p.cone(0.045, 0.28, { at: [x * 1.12, y * 1.0 + 0.2, -0.55], rot: [0, 0, -Math.atan2(Math.cos(a), Math.sin(a))], c: K.thorn }, 4); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = 1.45 + (i % 3) * 0.2; p.ball(0.22 + (i % 2) * 0.08, { at: [Math.cos(a) * r, 0.25, Math.sin(a) * r * 0.9], sc: [1.1, 0.9, 1.1], c: i % 2 ? K.leafD : K.thorn }, 6, 4); p.cone(0.05, 0.3, { at: [Math.cos(a) * r, 0.55, Math.sin(a) * r * 0.9], rot: [Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7], c: K.thorn }, 4); }
    for (const [x, y, z] of [[0.6, 0.85, 0.5], [-0.8, 0.5, 1.2], [1.4, 0.4, 0.6], [0, 2.5, -0.18], [-1.2, 0.45, -0.6]]) { p.ball(0.12, { at: [x, y, z], c: K.red }, 5, 4); p.ball(0.07, { at: [x, y + 0.03, z], c: K.pink }, 4, 3); }
  },
};
