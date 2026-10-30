// ---------------------------------------------------------------------------------------
// THE DUNES' DRESSING'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the dust devils and the fulgurites
// (vfx/dunes/), on the shared particle pools. Data only: the numbers are the look.
//   dunes.devil.scuff        held at a dust devil's foot while it lives (it follows): dust skirting out over the sand and grit flicked
//                            round, its `power` the devil's strength
//   dunes.fulgurite.strike   where Fury's lightning came down on the sand: a white-hot core, a lamp's bloom (the light budget's), fused
//                            grit thrown up glowing, and smoke rising after
//   dunes.fulgurite.glint    the sun catching a fulgurite's glass: one four-pointed star, in and out
//   dunes.fulgurite.hot      held off the ridges' fulgurite while it can be dug (hotfulgurite.js; it follows): embers lifting off the hot
//                            glass and a thin smoke rising, a column to find it by in a storm's dark, its `power` the heat left
//   dunes.fulgurite.dig      the ridges' fulgurite dug out: the sand thrown up round its hole, glass glints, a last puff of its heat
//
// Prior art: the house's own sand (vfx/racewayeffects.js and racewayparkeffects.js: the Dunes' colours thrown), its glints
// (library.js star4), a real dust devil's skirt and a lightning strike on sand (the fused grains glow as they are thrown).
// ---------------------------------------------------------------------------------------
const SAND = [0xc98a52, 0xb8834e, 0xf0c890], DUST = 0xe6c49a;

export const DUNES_DRESS_EFFECTS = {
  'dunes.devil.scuff': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 12, dur: Infinity, shape: 'puff', spawn: 'ring', r: 2.2, dir: 'out', lift: 0.4, speed: [1.2, 2.6], size: [0.9, 1.5], sizeEnd: 3.2, life: [1.2, 1.9], drag: 1.2, gravity: -0.2, color: DUST, alpha: 0.32, spin: [-1.5, 1.5] },
    { type: 'sprites', pool: 'alpha', rate: 26, dur: Infinity, shape: 'chip', spawn: 'disc', r: 2.6, dir: 'cone', axis: 'up', cone: 55, speed: [1.5, 4], size: [0.05, 0.1], sizeEnd: 0.03, life: [0.5, 0.9], gravity: 7, drag: 0.6, color: SAND, alpha: 0.85, alphaEnd: 0.3, spin: [-6, 6] },
  ] },
  'dunes.fulgurite.strike': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.4, life: 0.35, color: 'white', colorEnd: 0xffd9a0 },
    { type: 'light', color: 0xfff2ea, k: 60, range: 18, dur: 0.5, up: 1 },
    { type: 'sprites', count: [20, 28], shape: 'chip', spawn: 'disc', r: 0.6, dir: 'cone', axis: 'up', cone: 45, speed: [4, 9], size: [0.08, 0.16], sizeEnd: 0.04, life: [0.6, 1], gravity: 9, drag: 0.5, color: [0xffe6b0, 0xff9a4a], alpha: 1, alphaEnd: 0.4, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'puff', spawn: 'disc', r: 0.8, dir: 'up', speed: [0.6, 1.4], size: [0.8, 1.2], sizeEnd: 2.8, life: [1.8, 2.8], delay: [0.1, 0.4], drag: 0.6, gravity: -0.4, color: [0x8a7a70, 0xb09a88], alpha: 0.45, spin: [-0.6, 0.6] },
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'puff', spawn: 'ring', r: 0.5, dir: 'out', lift: 0.2, speed: [3, 6], size: [0.6, 1], sizeEnd: 2.2, life: [0.8, 1.3], drag: 2, color: DUST, alpha: 0.5, spin: [-1, 1] },
  ] },
  'dunes.fulgurite.hot': { layers: [
    { type: 'sprites', rate: 9, dur: Infinity, shape: 'core', spawn: 'disc', r: 0.35, dir: 'up', speed: [0.6, 1.5], size: [0.06, 0.12], sizeEnd: 0.02, life: [0.9, 1.6], drag: 0.4, gravity: -0.6, color: [0xffd9a0, 0xff8a3a], colorEnd: 0xc8381c, alpha: 1, alphaEnd: 0 },
    { type: 'sprites', pool: 'alpha', rate: 2.2, dur: Infinity, shape: 'puff', spawn: 'disc', r: 0.3, dir: 'up', speed: [0.9, 1.5], size: [0.5, 0.8], sizeEnd: 2.4, life: [2.6, 3.6], drag: 0.3, gravity: -0.5, color: [0x6e625c, 0x8a7a70], alpha: 0.28, alphaEnd: 0, spin: [-0.4, 0.4] },
  ] },
  'dunes.fulgurite.dig': { layers: [
    { type: 'sprites', count: [22, 30], shape: 'chip', spawn: 'disc', r: 0.5, dir: 'cone', axis: 'up', cone: 40, speed: [3, 6.5], size: [0.06, 0.12], sizeEnd: 0.03, life: [0.6, 1], gravity: 9, drag: 0.5, color: SAND, alpha: 1, alphaEnd: 0.4, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [8, 11], shape: 'puff', spawn: 'ring', r: 0.4, dir: 'out', lift: 0.3, speed: [2, 4], size: [0.6, 0.9], sizeEnd: 2, life: [0.8, 1.2], drag: 2, color: DUST, alpha: 0.5, spin: [-1, 1] },
    { type: 'sprites', count: [4, 6], shape: 'star4', spawn: 'sphere', r: 0.4, dir: 'up', speed: [0.4, 1], size: [0.28, 0.4], sizeEnd: 0.04, life: [0.35, 0.55], delay: [0, 0.25], color: 'white', colorEnd: 0xd8f0c8, spin: [-1, 1], powerCount: false },
    { type: 'sprites', count: 1, shape: 'core', size: 1.2, sizeEnd: 0.2, life: 0.3, color: 0xffd9a0, colorEnd: 0xc8381c },
  ] },
  'dunes.fulgurite.glint': { layers: [
    { type: 'sprites', count: 1, shape: 'star4', size: [0.32, 0.45], sizeEnd: 0.05, life: 0.42, color: 'white', colorEnd: 0xd8f0c8, spin: [-1, 1], powerCount: false },
  ] },
};
