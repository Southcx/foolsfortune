// ---------------------------------------------------------------------------------------
// THE KILN-YARD SET (proposed to Dovina, docs/handoffs/dovina/2026-10-24-from-calissa-decor-sets.md): a country potter's yard of eight,
// the house's own clay come out into the garden. Split wood, fireclay saggars, greenware drying, a clay pit, a kick wheel turning (kit.js
// MOTION.turn), a heap of sherds and a bucket of glaze; its centrepiece the tunnel kiln, a long earthen mound whose firebox mouth and
// stoke holes glow at dusk and waver (MOTION.flicker). The body (white, so the set's terracotta x tint paints it) is the fired clay: the
// kiln's skin, the saggars, the pots, the clay in its pit and the glaze in its bucket; wood, ash and stone fixed.
// Prior art: the anagama (the single-chamber tunnel kiln of Bizen and Shigaraki, climbing its slope, its stoke ports along the side),
// Mashiko's and Onta's potters' yards (wood stacked under a little roof, greenware drying on boards in racks, the kick wheel), the
// shard heaps of Jingdezhen, Animal Crossing's DIY workbench props, and the Workshop's own kiln (src/world/).
// ---------------------------------------------------------------------------------------
import { K, MOTION } from './kit.js';

const TAU = Math.PI * 2;
const ASH = 0x9a9668, CELADON = 0x93b8a0, TENMOKU = 0x4a2c1e, FIRECLAY = 0xb89a7a, GREEN = 0xd9c7a8;

/** A thrown pot's profile (radius, height) for the lathe: a little jar, its belly and lip. */
const JAR = (s = 1) => [[0, 0], [0.07 * s, 0], [0.11 * s, 0.06 * s], [0.12 * s, 0.13 * s], [0.08 * s, 0.2 * s], [0.06 * s, 0.22 * s], [0.07 * s, 0.24 * s], [0, 0.23 * s]];
const BOWL = (s = 1) => [[0, 0], [0.05 * s, 0], [0.06 * s, 0.02 * s], [0.13 * s, 0.07 * s], [0.14 * s, 0.09 * s], [0, 0.06 * s]];

export const KILNYARD = {
  /** small: split firewood stacked between two stakes under a little tiled roof (the body). */
  woodPile(p) {
    for (let row = 0; row < 4; row++) for (let i = 0; i < 4 - (row === 3 ? 1 : 0); i++) {
      const x = 0, y = 0.08 + row * 0.14, z = -0.24 + i * 0.16 + (row % 2) * 0.04 + (row === 3 ? 0.08 : 0);
      p.cyl(0.07, 0.07, 0.76, { at: [x, y, z], rot: [0, 0, Math.PI / 2], c: (row + i) % 3 ? K.wood : K.woodD }, 6);
      for (const s of [-1, 1]) p.cyl(0.062, 0.062, 0.01, { at: [s * 0.385, y, z], rot: [0, 0, Math.PI / 2], c: K.woodL }, 6);
    }
    for (const s of [-1, 1]) p.box(0.06, 0.7, 0.06, { at: [s * 0.42, 0, 0.0], sit: true, c: K.woodD }, 0.015);
    p.box(0.94, 0.05, 0.7, { at: [0, 0.74, 0], rot: [0.18, 0, 0] }, 0.02);
    for (let i = 0; i < 5; i++) p.cyl(0.045, 0.045, 0.7, { at: [-0.36 + i * 0.18, 0.79, 0], rot: [Math.PI / 2 + 0.18, 0, 0] }, 6);
    p.ball(0.08, { at: [0.3, 0.02, 0.36], sc: [1.4, 0.4, 1], c: K.woodL }, 5, 3);
  },
  /** small: saggars, the fireclay boxes a pot is fired in, stacked three high with wadding between, one opened beside with its pot. */
  saggarStack(p) {
    for (let i = 0; i < 3; i++) { const y = i * 0.25; p.cyl(0.22, 0.22, 0.22, { at: [-0.1, y, -0.08], sit: true }, 10); p.ring(0.22, 0.02, { at: [-0.1, y + 0.23, -0.08], c: K.white }, 12, 3); }
    p.cyl(0.24, 0.24, 0.05, { at: [-0.1, 0.75, -0.08], sit: true, c: FIRECLAY }, 10);
    p.lathe([[0.18, 0], [0.18, 0.18], [0.16, 0.18], [0.16, 0.02], [0, 0.02]], { at: [0.22, 0, 0.24] }, 10); p.cyl(0.18, 0.18, 0.02, { at: [0.22, 0, 0.24], sit: true, c: FIRECLAY }, 10);
    p.lathe(JAR(0.9), { at: [0.22, 0.02, 0.24], c: CELADON }, 9);
    p.ball(0.06, { at: [-0.12, 0.42, 0.15], sc: [1.5, 0.4, 1], c: ASH }, 5, 3); p.ball(0.05, { at: [0.0, 0.18, 0.13], sc: [1, 1.6, 0.6], c: ASH }, 5, 3); // (the ash glaze's drips)
  },
  /** centre: the tunnel kiln: a long earthen mound (the body) climbing its slope to a brick chimney, its firebox mouth and three stoke
   *  holes lit at dusk and wavering; split wood stacked by the mouth, an ash scatter, the stoking board. */
  tunnelKiln(p) {
    const FL = { m: [MOTION.flicker, 0, 0, 0] };
    p.ball(1.6, { at: [0, 0, 1.1], sc: [1.15, 0.12, 0.5], sit: true, c: ASH }, 10, 4); // (the ash on the ground before the mouth)
    p.ball(1, { at: [0, 0, -0.1], sc: [0.88, 0.8, 1.55], rot: [0.12, 0, 0], sit: true }, 12, 8);
    p.ball(0.5, { at: [0, 1.4, -0.9], sc: [1.2, 0.4, 1.4], c: ASH }, 8, 4); // (the ash fallen on its back from the last firing)
    // the firebox mouth: an arch of brick, the dark, the fire in it
    p.box(0.9, 0.62, 0.3, { at: [0, 0, 1.38], sit: true, c: K.clay }, 0.08);
    p.cyl(0.28, 0.28, 0.06, { at: [0, 0.3, 1.54], rot: [Math.PI / 2, 0, 0], c: K.black }, 10); p.slab(0.56, 0.3, 0.06, { at: [0, 0.15, 1.54], c: K.black });
    p.cyl(0.22, 0.22, 0.04, { at: [0, 0.26, 1.58], rot: [Math.PI / 2, 0, 0], c: K.ember, g: 1, ...FL }, 10); p.slab(0.44, 0.2, 0.04, { at: [0, 0.12, 1.58], c: K.ember, g: 1, ...FL });
    p.ball(0.1, { at: [0, 0.1, 1.6], sc: [2, 0.6, 0.6], c: K.lamp, g: 1, ...FL }, 6, 3);
    // the stoke holes along the side, plugged with a brick each but for their glow
    for (const z of [-0.65, -0.05, 0.55]) { p.ball(0.08, { at: [0.82, 0.48, z], sc: [0.5, 1, 1], c: K.ember, g: 1, ...FL }, 6, 4); p.box(0.1, 0.07, 0.16, { at: [0.88, 0.36, z + 0.14], c: K.clay }, 0.02); }
    // the chimney at the top end
    p.box(0.55, 1.5, 0.5, { at: [0, 0, -1.62], sit: true, c: K.clay }, 0.06);
    for (let i = 0; i < 6; i++) p.slab(0.57, 0.02, 0.52, { at: [0, 0.25 + i * 0.25, -1.62], c: K.stoneD });
    p.cyl(0.15, 0.15, 0.02, { at: [0, 1.51, -1.62], c: K.black }, 8);
    // wood stacked by the mouth, the stoking board
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) p.cyl(0.07, 0.07, 0.7, { at: [-1.25 + i * 0.15 + row * 0.075, 0.07 + row * 0.13, 1.25], rot: [Math.PI / 2, 0, 0], c: (i + row) % 2 ? K.wood : K.woodD }, 6);
    p.box(0.6, 0.04, 0.24, { at: [1.1, 0, 1.4], sit: true, rot: [0, 0.4, 0], c: K.woodL }, 0.015); p.rod([0.85, 0.05, 1.2], [1.5, 0.32, 1.65], 0.025, { c: K.woodD }, 4);
    for (const [x, z] of [[1.4, -0.9], [-1.3, -0.6], [1.5, 0.3]]) p.ball(0.12, { at: [x, 0.04, z], sc: [1.3, 0.6, 1], c: K.stoneD }, 5, 4);
  },
  /** medium: a rack of boards with greenware drying on it, pots and bowls in a row (the body), and two more on the ground. */
  potDryingRack(p) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.box(0.06, 1.25, 0.06, { at: [sx * 0.8, 0, sz * 0.22], sit: true, c: K.woodD }, 0.015);
    for (const [k, y] of [0.12, 0.55, 0.98].entries()) {
      p.box(1.66, 0.04, 0.5, { at: [0, y, 0], c: K.woodL }, 0.012);
      for (let i = 0; i < 5; i++) { const x = -0.64 + i * 0.32, jar = (i + k) % 2 === 0; p.lathe(jar ? JAR(1.25) : BOWL(1.3), { at: [x, y + 0.02, (i % 2) * 0.06 - 0.03] }, 7); }
    }
    p.slab(1.7, 0.02, 0.06, { at: [0, 1.25, -0.22], c: K.woodD }); p.slab(1.7, 0.02, 0.06, { at: [0, 1.25, 0.22], c: K.woodD });
    p.lathe(JAR(1.6), { at: [0.55, 0, 0.6], c: GREEN }, 9); p.lathe(BOWL(1.5), { at: [0.2, 0, 0.65], c: GREEN }, 9);
  },
  /** medium: the clay pit: wet clay (the body) in a plank-rimmed pit, a spade stood in it, a wedged lump on its board, a water pail. */
  clayPit(p) {
    p.box(1.5, 0.12, 1.3, { at: [0, 0, -0.05], sit: true }, 0.05);
    for (const [x, z, s] of [[-0.3, -0.2, 0.3], [0.25, 0.1, 0.26], [0.0, -0.45, 0.2], [-0.45, 0.25, 0.2]]) p.ball(s, { at: [x, 0.1, z], sc: [1.3, 0.38, 1.1] }, 7, 4);
    for (const [x, z, w, d] of [[0, -0.75, 1.7, 0.12], [0, 0.65, 1.7, 0.12], [-0.8, -0.05, 0.12, 1.5], [0.8, -0.05, 0.12, 1.5]]) p.box(w, 0.2, d, { at: [x, 0, z], sit: true, c: K.wood }, 0.03);
    p.rod([0.3, 0.12, -0.2], [0.45, 0.95, -0.35], 0.025, { c: K.woodL }, 5); p.box(0.18, 0.24, 0.03, { at: [0.28, 0.16, -0.18], rot: [0.15, 0.6, -0.15], c: K.iron }, 0.01); p.rod([0.4, 0.95, -0.3], [0.52, 0.95, -0.42], 0.022, { c: K.woodD }, 4);
    p.box(0.42, 0.05, 0.3, { at: [-0.45, 0.2, 0.62], c: K.woodL }, 0.015); p.box(0.22, 0.15, 0.17, { at: [-0.45, 0.28, 0.62], rot: [0, 0.3, 0] }, 0.07);
    p.lathe([[0, 0], [0.14, 0], [0.17, 0.26], [0.15, 0.26], [0.15, 0.03], [0, 0.03]], { at: [0.62, 0.0, 0.78], c: K.woodD }, 9); p.cyl(0.14, 0.14, 0.01, { at: [0.62, 0.22, 0.78], c: K.water }, 9); p.ring(0.165, 0.012, { at: [0.62, 0.1, 0.78], c: K.iron }, 10, 3);
  },
  /** small: a kick wheel: its frame and seat plank, the flywheel below and the head above turning with the pot thrown on it (TURN). */
  pottersWheel(p) {
    const TURN = { m: [MOTION.turn, 0.05, 0, 0] };
    p.box(0.7, 0.05, 0.7, { at: [0, 0, 0], sit: true, c: K.woodD }, 0.02);
    for (const [x, z] of [[-0.25, -0.25], [0.35, -0.25], [-0.25, 0.25], [0.35, 0.25]]) p.box(0.05, 0.5, 0.05, { at: [x, 0.05, z], sit: true, c: K.wood }, 0.012);
    p.box(0.7, 0.04, 0.12, { at: [0.05, 0.42, -0.28], c: K.wood }, 0.012); p.box(0.7, 0.04, 0.12, { at: [0.05, 0.42, 0.28], c: K.wood }, 0.012);
    p.box(0.24, 0.05, 0.6, { at: [-0.33, 0.36, 0], c: K.woodL }, 0.015); // (the seat plank)
    p.cyl(0.3, 0.3, 0.07, { at: [0.05, 0.12, 0], c: K.woodL, ...TURN }, 12); p.ring(0.28, 0.02, { at: [0.05, 0.16, 0], c: K.woodD, ...TURN }, 12, 3);
    p.cyl(0.025, 0.025, 0.5, { at: [0.05, 0.38, 0], c: K.iron, ...TURN }, 5);
    p.cyl(0.16, 0.15, 0.04, { at: [0.05, 0.62, 0], c: K.woodL, ...TURN }, 10); p.slab(0.24, 0.005, 0.02, { at: [0.05, 0.645, 0], c: K.woodD, ...TURN });
    p.lathe(JAR(1.1), { at: [0.05, 0.64, 0], ...TURN }, 10); p.ring(0.075, 0.008, { at: [0.05, 0.84, 0], c: K.white, ...TURN }, 8, 3); // (the wet lip catching the light)
    p.ball(0.08, { at: [0.3, 0.46, 0.18], sc: [1, 0.6, 1] }, 6, 4); // (a ball of clay waiting on the rail)
  },
  /** small: the sherd heap: a mound of broken pots, the house's clay (the body) and its glazes, a pot's foot and a broken bowl on top. */
  potShardHeap(p) {
    p.ball(0.38, { sc: [1.1, 0.42, 1], sit: true, c: K.soil }, 9, 5);
    const cols = [undefined, CELADON, undefined, TENMOKU, K.white, undefined, ASH, CELADON, undefined, K.white, TENMOKU, undefined, undefined, K.white];
    for (let i = 0; i < cols.length; i++) {
      const a = i * 2.39996, r = 0.08 + (i % 5) * 0.06, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.14 - r * 0.3 + (i % 3) * 0.02;
      p.box(0.14 + (i % 3) * 0.04, 0.025, 0.1 + (i % 2) * 0.04, { at: [x, y, z], rot: [Math.sin(i) * 0.6, a, Math.cos(i * 1.7) * 0.5], c: cols[i] }, 0.008);
    }
    p.cyl(0.07, 0.06, 0.05, { at: [0.05, 0.22, -0.02], rot: [0.5, 0, 0.3], c: CELADON }, 8);
    p.lathe(BOWL(1.4), { at: [-0.14, 0.13, 0.08], rot: [0.9, 0.4, 0] }, 8);
  },
  /** small: a bucket of glaze (the glaze is the body: each tint a glaze), drips down its staves, a ladle and a test tile on its rim. */
  glazeDipBucket(p) {
    p.lathe([[0, 0], [0.2, 0], [0.24, 0.42], [0.22, 0.42], [0.18, 0.03], [0, 0.03]], { c: K.wood }, 12);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; p.slab(0.006, 0.4, 0.01, { at: [Math.cos(a) * 0.222, 0.21, Math.sin(a) * 0.222], rot: [0, -a, 0.09 * Math.cos(0)], c: K.woodD }); }
    for (const y of [0.1, 0.33]) p.ring(0.205 + y * 0.09, 0.012, { at: [0, y, 0], c: K.iron }, 12, 3);
    p.cyl(0.215, 0.215, 0.02, { at: [0, 0.4, 0] }, 12);
    for (const [a, l] of [[0.4, 0.14], [1.9, 0.09], [3.6, 0.18], [5.0, 0.07]]) p.ball(0.028, { at: [Math.cos(a) * 0.235, 0.41 - l / 2, Math.sin(a) * 0.235], sc: [1, l / 0.05, 0.6], rot: [0, -a, 0] }, 5, 3);
    p.rod([-0.05, 0.42, 0.05], [-0.36, 0.72, 0.18], 0.016, { c: K.bamboo }, 4); p.lathe([[0, 0], [0.06, 0.01], [0.07, 0.05], [0, 0.04]], { at: [0.0, 0.36, 0.02], c: K.woodL }, 8);
    p.box(0.1, 0.14, 0.015, { at: [0.2, 0.47, -0.12], rot: [0, 0.6, 0.1], c: FIRECLAY }, 0.004); p.slab(0.1, 0.07, 0.018, { at: [0.2, 0.5, -0.12], rot: [0, 0.6, 0.1] });
    p.ball(0.1, { at: [0.3, 0, 0.25], sc: [1.4, 0.15, 1], sit: true }, 6, 3); // (a spill)
  },
};
