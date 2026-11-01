// ---------------------------------------------------------------------------------------
// A SENTINEL'S MOMENTS (library entries: vfx/library.js spreads them in, vfx/sentinellook.js plays them on Petra's sentinel.* events). The
// island's antibody (vfx/sentinelbody.js, a fired-clay haniwa) as the island working as meant: every moment of the island's own sand and
// clay and the kiln's warm light, never the film's violet, never a data bug's magenta.
//   sentinel.wake    risen out of the island: the sand heaved up round it in a ring, clods kicked off the mound, a warm ring laid flat
//   sentinel.slam    its shield brought down (`sentinel.cast`): a shock of sand rolled out along the ground, clods and dust thrown, a short shake
//   sentinel.crack   a blow taken: terracotta chips struck off its chest, a puff of its clay's dust
//   sentinel.mend    a creation worn back into the island: the kiln's breath, gold motes lifting slow off the ground and a ring settling
//   sentinel.fall    crumbled down: the sand slumping round it, a low dust rolled out and settling
// Prior art: the house's earth effects (classarts/lasting.js, Earth Wall's dust and clods), haniwa's terracotta and the anagama's ember
// glow; Shadow of the Colossus's guardians stepping in their dust.
//
//   SENTINEL_EFFECTS   (ctx: { pos } its feet, or its chest for a crack)
// ---------------------------------------------------------------------------------------
const L = (o) => o;
const SAND = [0xd9b98a, 0xc9a674, 0xe6cfa4], CLAY = [0xb5653a, 0x9a4f2c, 0xd99a6c], KILN = [0xffd38a, 0xffb85c, 0xfff1dc];

export const SENTINEL_EFFECTS = {
  'sentinel.wake': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [14, 18], shape: 'puff', spawn: 'ring', r: 0.8, dir: 'cone', axis: 'up', cone: 55, speed: [1, 2.2], size: [0.5, 0.8], sizeEnd: 1.6, life: [1.2, 1.8], drag: 1.6, gravity: -0.1, color: SAND, alpha: 0.4, spin: [-0.8, 0.8] }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'ring', r: 0.6, dir: 'cone', axis: 'up', cone: 40, speed: [2, 4], size: [0.06, 0.12], life: [0.7, 1], gravity: 9, floor: 'ground', color: SAND.concat(CLAY), spin: [-10, 10] }),
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0xffc46a, main: 'ripple', tile: [6, 1], dur: 0.9, scale: [[0, 0.4], [1, 2.2]], offset: [0, 0.04, 0], edgeV: [0.4, 0.4], glow: 1.4, core: 0.2 }),
  ] },
  'sentinel.slam': { layers: [
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0xd9b98a, main: 'ripple', tile: [6, 1], dur: 0.45, scale: [[0, 0.3], [1, 2.8]], offset: [0, 0.04, 0], edgeV: [0.4, 0.4], glow: 0.9, core: 0.2 }),
    L({ type: 'sprites', pool: 'alpha', count: [16, 22], shape: 'puff', spawn: 'ring', r: 0.6, dir: 'out', speed: [3, 5.5], size: [0.4, 0.7], sizeEnd: 1.4, life: [0.7, 1.1], drag: 3, gravity: -0.2, color: SAND, alpha: 0.42, spin: [-1, 1] }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'sphere', r: 0.4, dir: 'cone', axis: 'up', cone: 60, speed: [2.5, 5], size: [0.06, 0.13], life: [0.6, 0.9], gravity: 9, floor: 'ground', color: SAND.concat(CLAY), spin: [-12, 12] }),
    L({ type: 'shake', at: 0, k: 0.08 }),
  ] },
  'sentinel.crack': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'chip', spawn: 'sphere', r: 0.25, dir: 'cone', axis: 'up', cone: 80, speed: [1.8, 3.4], size: [0.05, 0.1], life: [0.5, 0.8], gravity: 9, floor: 'ground', color: CLAY, spin: [-12, 12] }),
    L({ type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', dir: 'up', speed: [0.3, 0.8], size: [0.2, 0.3], sizeEnd: 0.7, life: [0.6, 0.9], drag: 1.5, color: CLAY, alpha: 0.3 }),
  ] },
  'sentinel.mend': { layers: [
    L({ type: 'sprites', count: [12, 16], shape: 'soft', spawn: 'ring', r: 1.4, dir: 'up', speed: [0.4, 1.1], size: [0.08, 0.14], sizeEnd: 0, life: [1.4, 2.2], drag: 0.6, gravity: -0.3, color: KILN, alpha: 0.9, twinkle: 6 }),
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0xffd38a, main: 'ripple', tile: [6, 1], dur: 1.1, scale: [[0, 1.8], [1, 0.4]], offset: [0, 0.04, 0], edgeV: [0.4, 0.4], glow: 1.5, core: 0.2 }),
    L({ type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'puff', spawn: 'ring', r: 1.2, dir: 'up', speed: [0.2, 0.6], size: [0.35, 0.55], sizeEnd: 1, life: [1.2, 1.6], drag: 1.2, color: SAND, alpha: 0.28 }),
  ] },
  'sentinel.fall': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [18, 24], shape: 'puff', spawn: 'ring', r: 0.5, dir: 'out', speed: [0.8, 2], size: [0.5, 0.8], sizeEnd: 1.8, life: [1.6, 2.4], drag: 1.4, gravity: 0.2, color: SAND.concat(CLAY), alpha: 0.38, spin: [-0.6, 0.6] }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'sphere', r: 0.5, dir: 'cone', axis: 'up', cone: 70, speed: [1, 2.6], size: [0.06, 0.12], life: [0.7, 1.1], gravity: 9, floor: 'ground', color: CLAY, spin: [-10, 10] }),
  ] },
};
