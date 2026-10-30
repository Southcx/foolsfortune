// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S EFFECTS (library entries: vfx/library.js spreads them in, vfx/vfx.js plays them). On a planetoid "up" is the
// ground's own, so these throw along the caller's `normal` or `dir` and keep the world's gravity off:
//   garden.lotus.launch   a launch lotus flinging the Pneuka Jar (vfx/garden/launchlotus.js): its petals thrown up and out, pollen in
//                         gold and the film's colours shot along the up, motes of its heart's colour ('tint': where it throws to), a ring
//   garden.lotus.land     the lotus across catching it: a puff of pollen and a few petals
//   garden.smoke          held: a column of soft smoke rising along `dir` from a chimney's mouth (the Athanor's cap, the kiln's stack:
//                         vfx/garden/facilitylooks.js), slow, spreading, lavender grey
//   garden.seed.grow      a seed's planetoid grown a size (vfx/garden/seedlooks.js, at twelve points of its old surface): chips and dust of
//                         its own matter ('tint': its kind's colour) thrown off along `normal`, a few glints of the film
//   garden.seed.pour      held: the dust thrown up where the god hand's pour lands on a seed (vfx/garden/seedpour.js), in the matter's
//                         colour ('tint'), and grains skipping off it
//   garden.howto.ring     held: a how-to step's spot ringed on the ground along `dir` (vfx/garden/howtoring.js): a gold band at the rim
//                         turning slowly (a band, never a hairline: casebook 373), the running hand round inside it, the film's thinner hoop breathing outside it, a faint pillar standing up
//   garden.howto.sky      held: the same hoops hung in the open sky of the ring, no pillar
//
// Prior art: Super Mario Galaxy's launch star burst (sparkles shot along the flight) and its Hungry Luma bursting into a planet, the
// sacred lotus's shedding petals, the stack smoke of a wood-fired kiln seen across a valley (a slow, leaning column that thins as it
// rises), and sand poured onto a heap (a skirt of dust at its foot, grains bouncing off).
// ---------------------------------------------------------------------------------------
const L = (o) => o;
const PETALS = [0xffd2e0, 0xfff2f6, 0xf6a8c0, 0xf27fa3];
const SMOKE = [0x9a929e, 0xb4acb4, 0x857c88, 0xa89aa0];

export const GARDEN_EFFECTS = {
  // a launch lotus flinging the Pneuka Jar: petals thrown up and out, pollen in gold and the film shot along the up, motes of where it throws to, a ring
  'garden.lotus.launch': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 24, shape: 'petal', spawn: 'sphere', r: 0.9, dir: 'cone', axis: 'normal', cone: 75, speed: [2.6, 6], drag: 1.5, gravity: 0, size: [0.16, 0.26], life: [1.3, 2.0], color: PETALS, alpha: 1.3, spin: [-7, 7], twinkle: 3 }),
    L({ type: 'sprites', count: 42, shape: 'sparkle', spawn: 'sphere', r: 0.45, dir: 'cone', axis: 'normal', cone: 26, speed: [6, 13], drag: 2.2, gravity: 0, size: [0.07, 0.13], sizeEnd: 0, life: [0.8, 1.4], color: ['gold', 'film', 'film1', 'film2'], twinkle: 14 }),
    L({ type: 'sprites', count: 16, shape: 'soft', spawn: 'sphere', r: 1.1, dir: 'cone', axis: 'normal', cone: 85, speed: [0.5, 1.5], drag: 1, gravity: 0, size: [0.16, 0.26], sizeEnd: 0, life: [1.2, 2.0], color: 'tint', alpha: 0.85 }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.8, sizeEnd: 4.6, life: 0.45, color: 'tint', alpha: 0.9 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 2.2, sizeEnd: 0.4, life: 0.35, color: 'tint' }),
    L({ type: 'light', color: 'tint', k: 14, range: 7, dur: 0.6 }),
  ] },
  // the lotus across catching the Jar: a puff of pollen and a few petals
  'garden.lotus.land': { layers: [
    L({ type: 'sprites', count: 18, shape: 'sparkle', spawn: 'sphere', r: 0.5, dir: 'cone', axis: 'normal', cone: 70, speed: [1.2, 3], drag: 2.4, gravity: 0, size: [0.05, 0.1], sizeEnd: 0, life: [0.6, 1.1], color: ['gold', 'film', 'tint'], twinkle: 10 }),
    L({ type: 'sprites', pool: 'alpha', count: 7, shape: 'petal', spawn: 'sphere', r: 0.7, dir: 'cone', axis: 'normal', cone: 80, speed: [0.8, 2], drag: 1.4, gravity: 0, size: [0.14, 0.22], life: [1.0, 1.6], color: PETALS, alpha: 1.2, spin: [-5, 5] }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.6, sizeEnd: 3.2, life: 0.4, color: 'tint', alpha: 0.8 }),
  ] },
  // a seed's planetoid grown a size: chips and dust of its own matter thrown off its old surface, a few glints of the film
  'garden.seed.grow': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 11, shape: 'chip', spawn: 'sphere', r: 0.7, dir: 'cone', axis: 'normal', cone: 55, speed: [2.5, 6.5], drag: 1.6, gravity: 0, size: [0.12, 0.24], life: [0.8, 1.4], color: 'tint', alpha: 1, alphaEnd: 0.6, spin: [-8, 8] }),
    L({ type: 'sprites', pool: 'alpha', count: 5, shape: 'puff', spawn: 'sphere', r: 0.9, dir: 'cone', axis: 'normal', cone: 70, speed: [0.6, 1.6], drag: 1.2, gravity: 0, size: [0.5, 0.8], sizeEnd: [1.4, 2.0], life: [1.0, 1.6], color: 'tint', alpha: 0.4 }),
    L({ type: 'sprites', count: 5, shape: 'sparkle', spawn: 'sphere', r: 0.6, dir: 'cone', axis: 'normal', cone: 40, speed: [3, 7], drag: 2, gravity: 0, size: [0.06, 0.12], sizeEnd: 0, life: [0.6, 1.1], color: ['film', 'film1', 'gold'], twinkle: 12 }),
  ] },
  // held: the dust where the god hand's pour lands on a seed, in the matter's colour, and grains skipping off it
  'garden.seed.pour': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 12, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.45, dir: 'cone', axis: 'normal', cone: 75, speed: [0.3, 0.9], drag: 1.4, gravity: 0, size: [0.18, 0.3], sizeEnd: [0.6, 0.9], life: [0.7, 1.2], color: 'tint', alpha: 0.32, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', rate: 9, dur: Infinity, shape: 'chip', spawn: 'sphere', r: 0.35, dir: 'cone', axis: 'normal', cone: 65, speed: [1, 2.4], drag: 2, gravity: 0, size: [0.05, 0.09], life: [0.4, 0.7], color: 'tint', powerCount: false }),
  ] },
  // held: a chimney's smoke rising along `dir`, slow, spreading, lavender grey (the Athanor's cap, the kiln's stack)
  'garden.smoke': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.25, dir: 'cone', axis: 'dir', cone: 8, speed: [0.9, 1.4], drag: 0.08, gravity: 0, size: [0.7, 1.0], sizeEnd: [2.6, 3.6], life: [5.5, 7.5], color: SMOKE, alpha: 0.34, spin: [-0.35, 0.35], powerCount: false }),
  ] },
  // held: a how-to step's spot ringed on its ground (`dir` the ground's up, `scale` the ring's radius): a gold band turning at the rim and
  // the running hand round inside it (deep gold that covers the ground, `back`: on the garden's pale ground an added gold clips to white), the film's thinner hoop breathing outside it, and a faint pillar so it reads from across the sky
  'garden.howto.ring': { layers: [
    L({ type: 'shape', form: 'ring', face: 'dir', ramp: 'gold', main: 'streaks', tile: [6, 1], scroll: [0.05, 0], dur: Infinity, scale: 1, spin: 0.25, edgeV: [0.62, 0.1], glow: 1.1, core: 0, back: 0.95, in: 2.5, out: 3 }),
    L({ type: 'shape', form: 'ring', face: 'dir', ramp: 'gold', main: 'script', tile: [8, 0.25], scroll: [-0.03, 0], dur: Infinity, scale: 0.78, edgeV: [0.25, 0.25], glow: 1.1, core: 0, back: 0.9, in: 2.5, out: 3 }),
    L({ type: 'shape', form: 'hoop', face: 'dir', ramp: 'film', main: 'noise', tile: [4, 1], scroll: [0.1, 0], dur: Infinity, loop: 2.4, scale: [[0, 1.08], [0.5, 1.2], [1, 1.08]], spin: -0.4,
      erode: [[0, 0.35], [0.5, 0.1], [1, 0.35]], glow: 1.6, in: 2.5, out: 3 }),
    L({ type: 'shape', form: 'pillar', face: 'dir', ramp: 'gold', main: 'streaks', tile: [3, 1], scroll: [0, 0.4], dur: Infinity, scale: 1, stretch: [1, 3.5, 1], edgeV: [0, 0.85], rim: -0.6,
      glow: 1.1, core: 0, in: 2.5, out: 3 }),
  ] },
  // held: the open sky of the ring marked where a seed is let go: the same hoops hung in the air, no pillar
  'garden.howto.sky': { layers: [
    L({ type: 'shape', form: 'ring', face: 'dir', ramp: 'gold', main: 'streaks', tile: [8, 1], scroll: [0.05, 0], dur: Infinity, scale: 1, spin: 0.2, edgeV: [0.7, 0.08], glow: 1.1, core: 0, back: 0.95, in: 2.5, out: 3 }),
    L({ type: 'shape', form: 'ring', face: 'dir', ramp: 'gold', main: 'script', tile: [12, 0.25], scroll: [-0.03, 0], dur: Infinity, scale: 0.8, edgeV: [0.25, 0.25], glow: 1.1, core: 0, back: 0.9, in: 2.5, out: 3 }),
    L({ type: 'shape', form: 'hoop', face: 'dir', ramp: 'film', main: 'noise', tile: [6, 1], scroll: [0.1, 0], dur: Infinity, loop: 2.4, scale: [[0, 1.06], [0.5, 1.16], [1, 1.06]], spin: -0.3,
      erode: [[0, 0.35], [0.5, 0.1], [1, 0.35]], glow: 1.6, in: 2.5, out: 3 }),
  ] },
};
