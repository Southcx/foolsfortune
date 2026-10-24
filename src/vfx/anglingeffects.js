// ---------------------------------------------------------------------------------------
// ANGLING'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the rod's moments, played by the angler
// (tools/sondelass/angling/catchlift.js) on the shared particle pools. Data only: the numbers are the look.
//   angle.lift.splash   the catch leaving the water: the water's own crown of drops and mist (skiff.water.enter's, extended), and a
//                       spray of its feeling's Lachryma (`tint`) thrown up with it, glints of the film in it
//
// Prior art: Animal Crossing's and Sega Bass Fishing's catch out of the water (a splash flung up as the line takes it), the Worthington
// crown the water's own splash already is (vfx/waterfx.js).
// ---------------------------------------------------------------------------------------
export const ANGLING_EFFECTS = {
  'angle.lift.splash': { extends: 'skiff.water.enter', layers: [
    { type: 'sprites', pool: 'alpha', count: 26, shape: 'soft', spawn: 'disc', r: 0.35, dir: 'cone', axis: 'up', cone: 28, speed: [3.5, 7.5], size: [0.1, 0.2], sizeEnd: 0.05, life: [0.6, 1], gravity: 10, drag: 0.7, color: ['tint', 0xffffff], alpha: 0.95, alphaEnd: 0.35 },
    { type: 'sprites', count: 12, shape: 'glint', spawn: 'disc', r: 0.4, dir: 'cone', axis: 'up', cone: 40, speed: [2, 5], size: [0.14, 0.22], sizeEnd: 0, life: [0.35, 0.6], drag: 2, gravity: 4, color: 'film', colorEnd: 'tint' },
    { type: 'sprites', count: 1, shape: 'soft', size: 1.6, sizeEnd: 2.6, life: 0.35, color: 'tint', alpha: 0.4, alphaEnd: 0, powerCount: false },
  ] },
};
