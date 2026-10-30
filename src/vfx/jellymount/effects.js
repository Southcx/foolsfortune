// ---------------------------------------------------------------------------------------
// THE SLIP JELLY MOUNT'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the slip jelly mount's moments
// (vfx/jellymount/look.js plays them on Petra's events, courier/jellymount/jellymount.js), on the shared particle pools. Data only: the
// numbers are the look. The body is wet sand over Lachryma (creatures/jelly/deform.js, the melt): what flies off it is its wet slip and
// the sand it stood in, 'tint' the body's colour as it is now (a paint's feeling when it wears one: look.js hands it in).
//   jellymount.call    it wells up out of the ground (at the ground under the Courier, power 1): the sand pushed up and out in a ring
//                      as the puddle spreads, then wet drops thrown up off the crown as the body grows out of it, and a glint of the
//                      Lachryma in it
//   jellymount.hop     a hop's take-off (at the ground under it, `power` 1 + a third a link of the bounce chain): drops flicked out low
//                      round its foot, a skirt of sand dust
//   jellymount.land    its landing (power by the fall): the drops flatter, more dust
//   jellymount.hurt    a blow taken for the rider (at its middle): drops of its body knocked off and falling
//   jellymount.drink   crude drunk off a blot (at the ground under it): the crude's ink drawn in across the ground to its foot, the
//                      oil film's colours glinting on it as it goes
//   jellymount.slump   it melts back into the ground (at the ground): a few drops sliding off, a wet sigh of dust
//   jellymount.burst   its life at none: the body flung out in gobs of its colour and a fine spray, a low ring of drops racing out
//                      over the ground, sand dust, a small shake (a loss, short)
//
// Prior art: the wild slip jelly's own burst (creatures/jelly/slipjelly.js pop: gobs thrown high, a fine shower, sand puffs), the
// Dunes' sand (vfx/dunes/effects.js: its chips and dust colours), the Raceway's knock (vfx/racewayknockeffects.js: a ring of dust out of
// a landing), Slime Rancher's splats and Splatoon's ink bursts (a liquid body thrown in gobs that fall and lie).
// ---------------------------------------------------------------------------------------
const WET = [0x6e5236, 0x8a6a45, 0x7d5f3e], SAND = [0xc98a52, 0xb8834e, 0xf0c890], DUST = 0xe6c49a, PUFF = 0xc9a77a, INK = 0x0b0910;

export const JELLY_MOUNT_EFFECTS = {
  // the slip jelly mount welling up out of the ground: sand pushed up and out in a ring, wet drops thrown up off it, a glint of its Lachryma
  'jellymount.call': { layers: [
    { type: 'sprites', pool: 'alpha', count: [14, 18], shape: 'chip', spawn: 'ring', r: 0.75, dir: 'out', lift: 1.1, speed: [1.4, 2.8], size: [0.04, 0.08], sizeEnd: 0.03, life: [0.5, 0.8], delay: [0.04, 0.24], gravity: 9, drag: 0.6, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [8, 10], shape: 'puff', spawn: 'ring', r: 0.65, dir: 'out', lift: 0.15, speed: [0.9, 1.8], size: [0.3, 0.45], sizeEnd: 1.1, life: [0.8, 1.2], delay: [0.02, 0.2], drag: 2, gravity: -0.15, color: DUST, alpha: 0.34, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: [9, 12], shape: 'soft', spawn: 'disc', r: 0.35, dir: 'cone', axis: 'up', cone: 32, speed: [2.6, 4.6], size: [0.05, 0.09], sizeEnd: 0.05, life: [0.6, 0.9], delay: [0.3, 0.75], gravity: 14, drag: 0.3, color: [...WET, 'tint'], alpha: 1, alphaEnd: 0.85, floor: 'ground', offset: [0, 0.5, 0] },
    { type: 'sprites', count: [2, 3], shape: 'sparkle', spawn: 'disc', r: 0.4, dir: 'up', speed: [0.2, 0.5], size: [0.12, 0.18], sizeEnd: 0, life: [0.45, 0.7], delay: [0.5, 0.95], color: ['film0', 'film1', 'film2'], twinkle: 10, offset: [0, 0.9, 0], powerCount: false },
  ] },
  // its hop's take-off: drops flicked out low round its foot, a skirt of sand dust (power: the bounce chain)
  'jellymount.hop': { layers: [
    { type: 'sprites', pool: 'alpha', count: [7, 10], shape: 'soft', spawn: 'ring', r: 0.45, dir: 'out', lift: 0.7, speed: [1.8, 3.2], size: [0.04, 0.075], sizeEnd: 0.04, life: [0.45, 0.7], gravity: 13, drag: 0.4, color: [...WET, 'tint'], alpha: 1, alphaEnd: 0.8, floor: 'ground', offset: [0, 0.08, 0] },
    { type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', spawn: 'ring', r: 0.5, dir: 'out', lift: 0.1, speed: [0.8, 1.6], size: [0.25, 0.38], sizeEnd: 0.9, life: [0.6, 0.9], drag: 2.2, gravity: -0.1, color: DUST, alpha: 0.3, spin: [-1, 1] },
  ] },
  // its landing: the drops flatter, more dust (power: the fall)
  'jellymount.land': { layers: [
    { type: 'sprites', pool: 'alpha', count: [8, 11], shape: 'soft', spawn: 'ring', r: 0.55, dir: 'out', lift: 0.35, speed: [2, 3.4], size: [0.04, 0.07], sizeEnd: 0.04, life: [0.4, 0.6], gravity: 13, drag: 0.4, color: [...WET, 'tint'], alpha: 1, alphaEnd: 0.8, floor: 'ground', offset: [0, 0.06, 0] },
    { type: 'sprites', pool: 'alpha', count: [7, 9], shape: 'puff', spawn: 'ring', r: 0.6, dir: 'out', lift: 0.08, speed: [1.2, 2.2], size: [0.3, 0.42], sizeEnd: 1.1, life: [0.7, 1], drag: 2.4, gravity: -0.1, color: DUST, alpha: 0.34, spin: [-1, 1] },
  ] },
  // a blow taken for the rider: drops of its body knocked off and falling
  'jellymount.hurt': { layers: [
    { type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'soft', spawn: 'sphere', r: 0.3, dir: 'cone', axis: 'up', cone: 70, speed: [1.8, 3.6], size: [0.05, 0.09], sizeEnd: 0.05, life: [0.5, 0.8], gravity: 12, drag: 0.4, color: [...WET, 'tint'], alpha: 1, alphaEnd: 0.85, floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [3, 4], shape: 'puff', spawn: 'sphere', r: 0.25, dir: 'sphere', speed: [0.3, 0.7], size: [0.25, 0.35], sizeEnd: 0.7, life: [0.5, 0.7], drag: 2, color: PUFF, alpha: 0.3, spin: [-1, 1] },
  ] },
  // crude drunk off a blot: its ink drawn in across the ground to the foot, the oil film glinting on it
  'jellymount.drink': { layers: [
    { type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'soft', spawn: 'ring', r: [0.85, 1.25], dir: 'in', speed: [1.4, 2], size: [0.06, 0.1], sizeEnd: 0.03, life: [0.42, 0.6], gravity: -1.2, drag: 0.2, color: INK, alpha: 0.85, alphaEnd: 0.2, offset: [0, 0.05, 0] },
    { type: 'sprites', count: [3, 5], shape: 'glint', spawn: 'ring', r: [0.8, 1.2], dir: 'in', speed: [1.5, 2.1], size: [0.06, 0.1], sizeEnd: 0, life: [0.35, 0.55], gravity: -1.5, color: ['film0', 'film1', 'film2', 'film3'], twinkle: 8, offset: [0, 0.08, 0] },
  ] },
  // it melts back into the ground: a few drops sliding off, a wet sigh of dust
  'jellymount.slump': { layers: [
    { type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'soft', spawn: 'ring', r: 0.5, dir: 'out', lift: 0.25, speed: [0.6, 1.4], size: [0.04, 0.07], sizeEnd: 0.04, life: [0.4, 0.6], gravity: 10, drag: 0.6, color: [...WET, 'tint'], alpha: 1, alphaEnd: 0.8, floor: 'ground', offset: [0, 0.3, 0] },
    { type: 'sprites', pool: 'alpha', count: [4, 5], shape: 'puff', spawn: 'ring', r: 0.7, dir: 'out', lift: 0.05, speed: [0.4, 0.9], size: [0.3, 0.4], sizeEnd: 0.9, life: [0.8, 1.1], drag: 2.4, gravity: -0.08, color: DUST, alpha: 0.24, spin: [-0.8, 0.8] },
  ] },
  // its life at none: gobs of its body and a fine spray flung out in its colour, a low ring of drops, sand dust, a small shake
  'jellymount.burst': { layers: [
    { type: 'sprites', pool: 'alpha', count: 1, shape: 'soft', size: 1.5, sizeEnd: 2.6, life: 0.24, color: 'tint', alpha: 0.55, offset: [0, 0.7, 0], powerCount: false },
    { type: 'sprites', pool: 'alpha', count: [22, 28], shape: 'soft', spawn: 'sphere', r: 0.45, dir: 'cone', axis: 'up', cone: 78, speed: [3.6, 7.5], size: [0.1, 0.19], sizeEnd: 0.1, life: [0.8, 1.2], gravity: 14, drag: 0.35, color: [...WET, 'tint', 'tint'], alpha: 1, alphaEnd: 0.9, floor: 'ground', offset: [0, 0.7, 0] },
    { type: 'sprites', pool: 'alpha', count: [26, 32], shape: 'soft', spawn: 'sphere', r: 0.4, dir: 'cone', axis: 'up', cone: 60, speed: [5.5, 9.5], size: [0.025, 0.05], sizeEnd: 0.025, life: [0.7, 1.1], gravity: 12, drag: 0.5, color: [...WET, 'tint'], alpha: 0.95, alphaEnd: 0.7, floor: 'ground', offset: [0, 0.8, 0] },
    { type: 'sprites', pool: 'alpha', count: [18, 22], shape: 'soft', spawn: 'ring', r: 0.55, dir: 'out', lift: 0.18, speed: [4.5, 7], size: [0.05, 0.09], sizeEnd: 0.04, life: [0.35, 0.55], gravity: 10, drag: 1.2, color: [...WET, 'tint'], alpha: 1, alphaEnd: 0.75, floor: 'ground', offset: [0, 0.06, 0] },
    { type: 'sprites', pool: 'alpha', count: [10, 13], shape: 'puff', spawn: 'ring', r: 0.7, dir: 'out', lift: 0.12, speed: [2, 3.6], size: [0.4, 0.6], sizeEnd: 1.6, life: [0.9, 1.3], drag: 2.2, gravity: -0.15, color: [DUST, PUFF], alpha: 0.4, spin: [-1, 1] },
    { type: 'sprites', count: [4, 6], shape: 'sparkle', spawn: 'sphere', r: 0.5, dir: 'sphere', speed: [0.4, 1.2], size: [0.14, 0.22], sizeEnd: 0, life: [0.5, 0.8], delay: [0, 0.12], color: ['film0', 'film1', 'film2', 'film3'], twinkle: 10, offset: [0, 0.8, 0], powerCount: false },
    { type: 'shake', k: 0.22 },
  ] },
};
