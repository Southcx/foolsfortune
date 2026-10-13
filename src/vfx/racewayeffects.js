// ---------------------------------------------------------------------------------------
// THE RACEWAY'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the Solar Skiff's carve and the sun plates, played by
// the Raceway's looks (vfx/racewaylooks.js) on the shared particle pools. Data only: the numbers are the look.
//   skiff.carve.charge.1 / .2 / .3   held while a carve loads, at the board's outside edge: sand; gold sparks; white-gold sparks
//   skiff.carve.sail                 held at tier 3 round the sail: its glow and motes
//   skiff.carve.tier                 a tier reached: a ring and a spit of sparks in the tier's colour (`tint`)
//   skiff.carve.release              the carve let go: a flash, a ring, sand thrown back, sparks (`power` the tier's)
//   skiff.carve.wake                 the short sand wake after a release, held at the stern for 0.6 real seconds
//   raceway.plate                    a sun plate ridden over: a ring of light out over the sand, a flash, glints rising
//   raceway.lamp / raceway.gate      held on a lit countdown lamp / the next gate's marks: a soft glow (`k` its brightness)
//   raceway.lamp.go / raceway.gate.pass   GO's flare at each lamp / a gate passed
//
// Prior art: Mario Kart's drift sparks and mini-turbo tiers (blue, orange, purple: ours are sand, gold, white), the rooster tail of
// Wave Race's and Jet Moto's craft (the sand thrown off the edge, the wake after), F-Zero's dash plates (the flash and the ring as one
// is crossed), the library's own families (an `extends` chain: a tier adds to the one below).
// ---------------------------------------------------------------------------------------
const SAND = [0xc98a52, 0xb8834e, 0xf0c890]; // (the Dunes' sand in its shade and its crest, world/ground/groundmarks.js: thrown grains read darker than the ground they leave)

export const RACEWAY_EFFECTS = {
  // ---- the carve as it loads: tier 1 sand off the edge, tier 2 gold sparks with it, tier 3 white-gold sparks too
  'skiff.carve.charge.1': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 130, dur: Infinity, shape: 'chip', dir: 'cone', cone: 28, speed: [3, 7], size: [0.08, 0.15], sizeEnd: 0.04, life: [0.35, 0.6], gravity: 9, drag: 1.2, color: SAND, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8], inherit: 0.5 },
    { type: 'sprites', pool: 'alpha', rate: 32, dur: Infinity, shape: 'puff', dir: 'cone', cone: 40, speed: [1.5, 3.5], size: [0.35, 0.55], sizeEnd: 1.6, life: [0.5, 0.8], drag: 3, gravity: -0.2, color: 0xf6dcb0, alpha: 0.5, spin: [-1, 1], inherit: 0.3 },
  ] },
  'skiff.carve.charge.2': { extends: 'skiff.carve.charge.1', layers: [
    { type: 'sprites', rate: 70, dur: Infinity, shape: 'streak', dir: 'cone', cone: 32, speed: [6, 11], size: [0.14, 0.22], sizeEnd: 0.03, life: [0.22, 0.4], stretch: 1.6, drag: 2.5, gravity: 5, color: 'gold', colorEnd: 0xff9a3c, inherit: 0.5 },
  ] },
  'skiff.carve.charge.3': { extends: 'skiff.carve.charge.2', layers: [
    { type: 'sprites', rate: 60, dur: Infinity, shape: 'streak', dir: 'cone', cone: 26, speed: [8, 14], size: [0.16, 0.24], sizeEnd: 0.03, life: [0.22, 0.4], stretch: 1.8, drag: 3, gravity: 6, color: 0xfff3d0, colorEnd: 'gold', inherit: 0.5 },
    { type: 'sprites', rate: 30, dur: Infinity, shape: 'star4', dir: 'cone', cone: 40, speed: [3, 6], size: [0.24, 0.36], sizeEnd: 0, life: [0.15, 0.3], drag: 4, color: 'white', colorEnd: 'gold', spin: [-6, 6] },
  ] },
  'skiff.carve.sail': { layers: [ // (the sail's glow at tier 3: soft cores over each other, motes rising off it)
    { type: 'sprites', rate: 26, dur: Infinity, shape: 'core', spawn: 'sphere', r: 0.5, size: [2.0, 2.6], sizeEnd: 3.0, life: 0.28, color: 'gold', alpha: 0.2, alphaEnd: 0 },
    { type: 'sprites', rate: 20, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 1.3, dir: 'up', speed: [0.4, 1.2], size: [0.1, 0.18], sizeEnd: 0, life: [0.4, 0.7], drag: 1, color: 'white', colorEnd: 'gold' },
  ] },
  'skiff.carve.tier': { layers: [
    { type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 1.8, life: 0.22, color: 'tint', alphaEnd: 0, rot: 0 },
    { type: 'sprites', count: 10, shape: 'streak', dir: 'cone', cone: 70, speed: [5, 9], size: [0.12, 0.18], sizeEnd: 0.02, life: [0.15, 0.25], stretch: 1.4, drag: 5, color: 'tint', colorEnd: 'white', powerCount: false },
  ] },
  // ---- the carve let go: a burst off the stern and the sand thrown back (`power`: the tier, so a tier 3 throws the most)
  'skiff.carve.release': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 1.6, sizeEnd: 0.2, life: 0.15, color: 'white', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.4, sizeEnd: 3.2, life: 0.3, color: 'tint', alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 12, shape: 'puff', dir: 'cone', cone: 50, speed: [2, 5], size: [0.4, 0.6], sizeEnd: 1.5, life: [0.6, 1.0], drag: 3, gravity: -0.3, color: 0xe8b070, alpha: 0.5, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: 24, shape: 'chip', dir: 'cone', cone: 40, speed: [4, 9], size: [0.05, 0.1], life: [0.4, 0.7], gravity: 9, drag: 1, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8] },
    { type: 'sprites', count: 10, shape: 'streak', dir: 'cone', cone: 35, speed: [7, 12], size: [0.12, 0.2], sizeEnd: 0.02, life: [0.18, 0.32], stretch: 1.5, drag: 3, color: 'tint', colorEnd: 'white' },
    { type: 'light', color: 'tint', range: 8, k: 14, dur: 0.3, up: 0.6 },
  ] },
  'skiff.carve.wake': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 70, dur: 0.6, shape: 'puff', spawn: 'disc', r: 0.5, dir: 'up', speed: [0.5, 1.5], size: [0.3, 0.45], sizeEnd: 1.2, life: [0.6, 1.0], drag: 2.5, gravity: -0.1, color: 0xe8b070, alpha: 0.42, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', rate: 60, dur: 0.6, shape: 'chip', dir: 'cone', cone: 50, speed: [2, 4], size: [0.04, 0.08], life: [0.3, 0.5], gravity: 9, drag: 1, color: SAND, alpha: 0.9, alphaEnd: 0.5 },
  ] },
  // ---- the start arch's lamps and the gates' marks: a glow held on each lit one (`k` its brightness), GO's flare, a gate passed
  'raceway.lamp': { layers: [
    { type: 'sprites', rate: 26, dur: Infinity, shape: 'core', size: [2.6, 3.2], sizeEnd: 3.6, life: 0.3, color: 0xffd27a, alpha: 0.3, alphaEnd: 0 },
  ] },
  'raceway.lamp.go': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 2, life: 0.4, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', count: 1, shape: 'ring', size: 1, sizeEnd: 5, life: 0.35, color: 0xfff4dc, alphaEnd: 0, rot: 0 },
    { type: 'sprites', count: 10, shape: 'sparkle', spawn: 'sphere', r: 0.8, dir: 'sphere', speed: [1.5, 3], size: [0.2, 0.3], sizeEnd: 0, life: [0.35, 0.6], drag: 3, color: 'white', colorEnd: 'gold' },
  ] },
  'raceway.gate': { layers: [
    { type: 'sprites', rate: 22, dur: Infinity, shape: 'core', size: [1.8, 2.3], sizeEnd: 2.6, life: 0.3, color: 0xffd27a, alpha: 0.3, alphaEnd: 0 },
  ] },
  'raceway.gate.pass': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 3.4, sizeEnd: 1, life: 0.3, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', count: 8, shape: 'glint', spawn: 'sphere', r: 0.6, dir: 'up', speed: [1.5, 3], size: [0.2, 0.3], sizeEnd: 0, life: [0.3, 0.5], drag: 2, color: 'white', colorEnd: 'gold' },
  ] },
  // ---- a sun plate ridden over: F-Zero's dash plate, a ring of light run out over the sand
  'raceway.plate': { layers: [
    { type: 'decal', tex: 'shockring', dur: 0.55, scale: [[0, 2.5], [1, 10]], tint: 0xffe2a0, glow: 1.6, offset: [0, 0.15, 0], k: [[0, 1], [0.4, 0.8], [1, 0]] },
    { type: 'sprites', count: 1, shape: 'core', size: 3.6, sizeEnd: 1, life: 0.25, color: 'white', colorEnd: 'gold', powerCount: false },
    { type: 'sprites', count: [14, 18], shape: 'glint', spawn: 'disc', r: 2.2, dir: 'up', speed: [2, 5], size: [0.25, 0.4], sizeEnd: 0, life: [0.35, 0.6], drag: 2, color: 'white', colorEnd: 'gold' },
    { type: 'light', color: 0xffd27a, range: 12, k: 25, dur: 0.45, up: 1 },
  ] },
};
