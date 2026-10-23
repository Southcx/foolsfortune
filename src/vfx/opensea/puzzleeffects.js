// ---------------------------------------------------------------------------------------
// THE ISLETS' PUZZLES' EFFECTS: the library's entries (vfx/library.js spreads them in) for the dig's moment (vfx/opensea/puzzlelooks.js
// plays them) on the shared particle pools. Data only: the numbers are the look.
//   sea.dig        the cache dug: sand thrown up out of the hole and falling back round it, a low breath of its dust
//   sea.dig.find   the chest up and its lid open: a find's glint, gold motes rising out of it, a short warm light
//
// Prior art: the house's own sand (vfx/racewayparkeffects.js: chips and puffs in the sand's colours); Animal Crossing's dig (a spray of
// soil, then the thing up out of the hole) and Zelda's chest (the light out of the lid before the thing is seen).
// ---------------------------------------------------------------------------------------
const SAND = [0xe8dcb8, 0xc4b28c, 0xf2e8cc]; // (the islets' sand, dry, wet and bleached: isletkits/kit.js PAL)
const DUST = 0xe6dcc0;

export const PUZZLE_EFFECTS = {
  'sea.dig': { layers: [
    { type: 'sprites', pool: 'alpha', count: [26, 34], shape: 'chip', spawn: 'disc', r: 0.4, dir: 'cone', axis: 'up', cone: 38, speed: [3, 6], size: [0.05, 0.1], sizeEnd: 0.03, life: [0.7, 1.1], gravity: 11, drag: 0.6, color: SAND, alpha: 0.95, alphaEnd: 0.7, spin: [-9, 9], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'puff', spawn: 'disc', r: 0.5, dir: 'cone', axis: 'up', cone: 60, speed: [0.6, 1.6], size: [0.3, 0.5], sizeEnd: 1.4, life: [0.9, 1.4], drag: 2.5, gravity: -0.2, color: DUST, alpha: 0.5, spin: [-1, 1] },
  ] },
  'sea.dig.find': { layers: [
    { type: 'sprites', count: 1, shape: 'star4', size: 0.9, sizeEnd: 0.15, life: 0.35, color: 0xfff2c8, colorEnd: 'gold', rot: 0.785 },
    { type: 'sprites', count: [10, 14], shape: 'glint', spawn: 'disc', r: 0.25, dir: 'cone', axis: 'up', cone: 25, speed: [0.6, 1.6], size: [0.06, 0.1], sizeEnd: 0.01, life: [0.7, 1.2], drag: 1.5, gravity: -0.4, color: ['gold', 0xf0cc6a], twinkle: 14 },
    { type: 'light', color: 0xf0cc6a, k: 22, range: 6, dur: 0.7, up: 0.3 },
  ] },
};
