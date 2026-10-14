// ---------------------------------------------------------------------------------------
// THE RACEWAY PROPS' EFFECTS: the library's entries (vfx/library.js spreads them in) for the round six props (vfx/racewayprops.js plays
// them) on the shared particle pools. Data only: the numbers are the look.
//   raceway.lane.drink     held under the board while it rides a vein lane (`follow`): Lachryma drawn up out of the sand into the hull,
//                          facets of Lachrymite kicked up behind, the film's glints
//   raceway.lane.enter     the board coming onto a vein lane (skiff.refill): a cold ring out over the sand, a flash
//   raceway.pot.smash      a pot of the pot smash ridden through: sherds of its body (`tint`) thrown on the way the board goes (`dir`),
//                          grit and a dust puff (the house's own shatterBurst plays beside it, vfx/particles.js)
//   raceway.antlion.spray  held behind the antlion chaser's maw (`follow`, `dir` up and back): sand thrown up in a rooster tail as it
//                          ploughs up the road, a haze after it
//   raceway.antlion.snap   its jaws closing: grit off the tips, a puff
//   raceway.patch.take     a City Trial patch taken: facets of its gem (`tint`) burst out, a ring, a flash
//
// Prior art: the house's own sand and plate grammar (vfx/racewayeffects.js, vfx/racewayparkeffects.js, vfx/racewaycaverneffects.js),
// F-Zero's pit strip (the energy drawn up into the craft while it is on it), Zelda's pots bursting in sherds, Kirby Air Ride's patches.
// ---------------------------------------------------------------------------------------
import { LACHRYMA_TINT } from './racewayeffects.js';

const SAND = [0xc98a52, 0xb8834e, 0xf0c890]; // (the Dunes' sand in its shade and crest, as vfx/racewayeffects.js throws it)
const DUST = 0xe6c49a;

export const RACEWAY_PROPS_EFFECTS = {
  'raceway.lane.drink': { layers: [
    { type: 'sprites', rate: 70, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 1.4, dir: 'up', speed: [1.5, 3.2], size: [0.1, 0.18], sizeEnd: 0, life: [0.35, 0.6], drag: 1.5, color: ['film', LACHRYMA_TINT, 'white'], twinkle: 20 },
    { type: 'sprites', rate: 26, dur: Infinity, shape: 'facet', spawn: 'disc', r: 1, dir: 'cone', cone: 35, speed: [2, 4], size: [0.07, 0.12], sizeEnd: 0.03, life: [0.35, 0.55], gravity: 9, drag: 1, color: [LACHRYMA_TINT, 'white'], spin: [-10, 10], floor: 'ground', inherit: 0.3 },
    { type: 'sprites', rate: 8, dur: Infinity, shape: 'core', size: [1.2, 1.6], sizeEnd: 2, life: 0.25, color: LACHRYMA_TINT, alpha: 0.18, alphaEnd: 0 },
  ] },
  'raceway.lane.enter': { layers: [
    { type: 'decal', tex: 'shockring', dur: 0.45, scale: [[0, 1.5], [1, 7]], tint: LACHRYMA_TINT, glow: 1.6, offset: [0, 0.1, 0], k: [[0, 1], [0.4, 0.7], [1, 0]] },
    { type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.5, life: 0.22, color: 'white', colorEnd: LACHRYMA_TINT, powerCount: false },
    { type: 'sprites', count: [10, 14], shape: 'glint', spawn: 'disc', r: 1.5, dir: 'up', speed: [2, 4], size: [0.16, 0.26], sizeEnd: 0, life: [0.3, 0.5], drag: 2, color: ['film', LACHRYMA_TINT], twinkle: 22 },
  ] },
  'raceway.pot.smash': { layers: [
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'shard', spawn: 'sphere', r: 0.35, dir: 'cone', cone: 55, speed: [4, 9], size: [0.12, 0.24], sizeEnd: 0.1, life: [0.6, 1], gravity: 12, drag: 0.6, color: ['tint', 'tint', 0x8a4a3a], alpha: 1, alphaEnd: 0.85, spin: [-12, 12], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [14, 20], shape: 'chip', spawn: 'sphere', r: 0.3, dir: 'cone', cone: 70, speed: [3, 7], size: [0.06, 0.12], sizeEnd: 0.03, life: [0.5, 0.8], gravity: 10, drag: 0.8, color: ['tint', 0xd9906a], alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'puff', spawn: 'sphere', r: 0.4, dir: 'up', speed: [0.6, 1.4], size: [0.6, 0.9], sizeEnd: 2.2, life: [0.6, 0.9], drag: 2, color: DUST, alpha: 0.5, spin: [-1, 1] },
  ] },
  'raceway.antlion.spray': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 160, dur: Infinity, shape: 'chip', spawn: 'disc', r: 2.6, dir: 'cone', cone: 35, speed: [5, 10], size: [0.12, 0.24], sizeEnd: 0.06, life: [0.6, 1], gravity: 9, drag: 0.9, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', rate: 30, dur: Infinity, shape: 'puff', spawn: 'disc', r: 2.8, dir: 'cone', cone: 45, speed: [2, 4], size: [1, 1.6], sizeEnd: 4.5, life: [0.9, 1.4], drag: 2, gravity: -0.2, color: DUST, alpha: 0.5, spin: [-1, 1] },
  ] },
  'raceway.antlion.snap': { layers: [
    { type: 'sprites', pool: 'alpha', count: [12, 16], shape: 'chip', spawn: 'disc', r: 1.2, dir: 'cone', axis: 'up', cone: 40, speed: [4, 8], size: [0.1, 0.18], sizeEnd: 0.05, life: [0.5, 0.8], gravity: 9, drag: 0.8, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'disc', r: 1, dir: 'up', speed: [1, 2], size: [0.8, 1.2], sizeEnd: 2.6, life: [0.6, 0.9], drag: 2, color: DUST, alpha: 0.45, spin: [-1, 1] },
  ] },
  'raceway.patch.take': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 2.2, sizeEnd: 0.4, life: 0.2, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.4, sizeEnd: 3, life: 0.3, color: 'tint', rot: 0 },
    { type: 'sprites', count: [12, 16], shape: 'facet', spawn: 'sphere', r: 0.3, dir: 'out', speed: [3, 6], size: [0.1, 0.18], sizeEnd: 0.03, life: [0.35, 0.6], gravity: 4, drag: 1.5, color: ['tint', 'white'], spin: [-12, 12] },
  ] },
};
