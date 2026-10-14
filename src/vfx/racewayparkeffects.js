// ---------------------------------------------------------------------------------------
// THE RACEWAY PARK'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the park's dress (vfx/racewaypark.js plays
// them) on the shared particle pools. Data only: the numbers are the look.
//   raceway.pit.snap    the antlion's maw snapped on a board (raceway.pit): a column of dust out of the throat, sand and grit thrown
//                       up and falling back, the stones of its ring knocked loose
//   raceway.pit.slide   played at points round the cone after the snap (`dir` down the slope to the maw): the sand giving way and
//                       running down to the throat, a low haze after it (the angle of repose failing: the antlion's trick)
//
// Prior art: the house's own sand (vfx/racewayeffects.js: the carve's chips and puffs in the Dunes' colours) and the Great Dunemaw's
// sand slides; the real antlion, which flicks sand up at what clings to its pit's wall so the slope fails under it; Star Wars' Sarlacc.
// ---------------------------------------------------------------------------------------
const SAND = [0xc98a52, 0xb8834e, 0xf0c890]; // (the Dunes' sand in its shade and crest, as vfx/racewayeffects.js throws it)
const DUST = 0xe6c49a;

export const RACEWAY_PARK_EFFECTS = {
  'raceway.pit.snap': { layers: [
    { type: 'sprites', pool: 'alpha', count: [16, 22], shape: 'puff', spawn: 'disc', r: 2.2, dir: 'cone', axis: 'up', cone: 30, speed: [3, 7], size: [1.2, 2], sizeEnd: 5.5, life: [1, 1.6], drag: 2, gravity: -0.3, color: DUST, alpha: 0.6, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: [30, 40], shape: 'chip', spawn: 'disc', r: 1.8, dir: 'cone', axis: 'up', cone: 40, speed: [5, 11], size: [0.12, 0.22], sizeEnd: 0.06, life: [0.7, 1.1], gravity: 9, drag: 0.8, color: SAND, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'shard', spawn: 'ring', r: 2.8, dir: 'out', lift: 1.4, speed: [2, 4], size: [0.25, 0.4], sizeEnd: 0.2, life: [0.7, 1], gravity: 9, drag: 0.5, color: [0xa8643a, 0x8a4a3a], alpha: 1, alphaEnd: 0.8, spin: [-6, 6] },
  ] },
  'raceway.pit.slide': { layers: [
    { type: 'sprites', pool: 'alpha', count: [14, 20], shape: 'chip', spawn: 'disc', r: 2.5, dir: 'cone', cone: 12, speed: [3, 6], size: [0.1, 0.18], sizeEnd: 0.05, life: [1, 1.6], delay: [0, 0.35], gravity: 1.5, drag: 0.6, color: SAND, alpha: 0.9, alphaEnd: 0.4, spin: [-4, 4] },
    { type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'puff', spawn: 'disc', r: 2, dir: 'cone', cone: 20, speed: [1.5, 3], size: [1, 1.6], sizeEnd: 3, life: [1.2, 1.8], delay: [0.1, 0.5], drag: 1.5, color: DUST, alpha: 0.4, spin: [-1, 1] },
  ] },
};
