// ---------------------------------------------------------------------------------------
// THE SIPHONS' EFFECTS: the library's entries (vfx/library.js spreads them in) for the siphon arches (vfx/racewaysiphons.js plays them)
// on the shared particle pools. Data only: the numbers are the look.
//   raceway.siphon.draw    held at an arch's mouth (`pos`, the keystone's middle): Lachryma drawn up off the sand under the arch in
//                          streaks into the mouth (born on the ground by `offset`, flying at the mouth), motes from all round it pulled
//                          in, a dark breath with them
//   raceway.siphon.drink   the pool drunk (skiff.siphon), at the board, `dir` at the mouth: Lachryma pulled off it in streaks up into
//                          the arch, glints of the film, a cold flash leaving it (`power` the share taken)
//   raceway.siphon.ring    on the sand under the board: a ring collapsing in on it (the scale runs large to small)
//   raceway.siphon.gulp    at the mouth: it swallows, motes crushed in, a ring closing, a dark puff
//
// Prior art: Kirby's inhale and Luigi's Mansion's Poltergust (streaks drawn toward a mouth), the Dementors' drain (the light pulled up
// out of a body), the house's vein lanes' drink (vfx/racewaypropseffects.js), which this is the reverse of.
// ---------------------------------------------------------------------------------------
import { LACHRYMA_TINT, LACHRYMA_DEEP } from './racewayeffects.js';

const DUSK = 0x1a0a2a; // (the arch's dark breath: the soot violet of its stone)
const MOUTH = 9 + 1.8 + 2.8; // (the mouth above the sand under the arch, m: SIPHON.height + the lintel + the keystone's lift, vfx/racewaysiphons.js)

export const RACEWAY_SIPHON_EFFECTS = {
  'raceway.siphon.draw': { layers: [
    { type: 'sprites', rate: 34, dur: Infinity, shape: 'streak', spawn: 'disc', r: 9, offset: [0, -MOUTH, 0], dir: 'in', speed: [8.5, 10.5], size: [0.14, 0.22], sizeEnd: 0.05, life: [1.2, 1.4], stretch: 2.2, color: ['film', LACHRYMA_TINT, LACHRYMA_DEEP], colorEnd: 'white' },
    { type: 'sprites', rate: 22, dur: Infinity, shape: 'glint', spawn: 'shell', r: 5.5, dir: 'in', speed: [3.5, 5], size: [0.2, 0.32], sizeEnd: 0, life: [0.9, 1.1], color: ['film', LACHRYMA_TINT], twinkle: 16 },
    { type: 'sprites', pool: 'alpha', rate: 5, dur: Infinity, shape: 'puff', spawn: 'shell', r: 5, dir: 'in', speed: [2.5, 3.5], size: [1.1, 1.6], sizeEnd: 0.3, life: [1.2, 1.5], color: DUSK, alpha: 0.55, alphaEnd: 0.2, spin: [-1.5, 1.5] },
  ] },
  'raceway.siphon.drink': { layers: [
    { type: 'sprites', count: [34, 44], shape: 'streak', spawn: 'sphere', r: 1.1, dir: 'cone', cone: 9, speed: [13, 19], size: [0.18, 0.28], sizeEnd: 0.05, life: [0.55, 0.8], stretch: 2.6, drag: 0.3, color: ['film', LACHRYMA_TINT, 'white'], colorEnd: LACHRYMA_DEEP },
    { type: 'sprites', count: [14, 20], shape: 'glint', spawn: 'sphere', r: 1.2, dir: 'cone', cone: 18, speed: [6, 11], size: [0.2, 0.32], sizeEnd: 0, life: [0.5, 0.8], drag: 0.6, color: ['film', LACHRYMA_TINT], twinkle: 20 },
    { type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.4, life: 0.3, color: LACHRYMA_TINT, colorEnd: LACHRYMA_DEEP, powerCount: false },
  ] },
  'raceway.siphon.ring': { layers: [
    { type: 'decal', tex: 'shockring', dur: 0.5, scale: [[0, 8], [1, 0.8]], tint: LACHRYMA_DEEP, glow: 1.3, offset: [0, 0.1, 0], k: [[0, 0.2], [0.3, 1], [1, 0]] },
  ] },
  'raceway.siphon.gulp': { layers: [
    { type: 'sprites', count: 1, shape: 'ringthin', size: 7, sizeEnd: 0.6, life: 0.45, color: LACHRYMA_TINT, at: 0.35 },
    { type: 'sprites', count: [16, 22], shape: 'glint', spawn: 'shell', r: 4, dir: 'in', speed: [7, 10], size: [0.24, 0.36], sizeEnd: 0, life: [0.4, 0.55], color: ['film', 'white'], twinkle: 22, at: 0.3 },
    { type: 'sprites', count: 1, shape: 'core', size: 4.2, sizeEnd: 1, life: 0.35, color: 'white', colorEnd: LACHRYMA_TINT, powerCount: false, at: 0.6 },
    { type: 'sprites', pool: 'alpha', count: [3, 4], shape: 'puff', spawn: 'sphere', r: 1.5, dir: 'out', speed: [1, 2], size: [1.4, 2], sizeEnd: 3.4, life: [0.7, 1], drag: 2, color: DUSK, alpha: 0.6, spin: [-1, 1], at: 0.6 },
  ] },
};
