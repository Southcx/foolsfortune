// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S EFFECTS (library entries: vfx/library.js spreads them in, vfx/vfx.js plays them). On a planetoid "up" is the
// ground's own, so these throw along the caller's `normal` or `dir` and keep the world's gravity off:
//   garden.lotus.launch   a launch lotus flinging the Pneuka Jar (vfx/garden/launchlotus.js): its petals thrown up and out, pollen in
//                         gold and the film's colours shot along the up, motes of its heart's colour ('tint': where it throws to), a ring
//   garden.lotus.land     the lotus across catching it: a puff of pollen and a few petals
//   garden.smoke          held: a column of soft smoke rising along `dir` from a chimney's mouth (the Athanor's cap, the kiln's stack:
//                         vfx/garden/facilitylooks.js), slow, spreading, lavender grey
//
// Prior art: Super Mario Galaxy's launch star burst (sparkles shot along the flight), the sacred lotus's shedding petals, and the
// stack smoke of a wood-fired kiln seen across a valley (a slow, leaning column that thins as it rises).
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
  // held: a chimney's smoke rising along `dir`, slow, spreading, lavender grey (the Athanor's cap, the kiln's stack)
  'garden.smoke': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.25, dir: 'cone', axis: 'dir', cone: 8, speed: [0.9, 1.4], drag: 0.08, gravity: 0, size: [0.7, 1.0], sizeEnd: [2.6, 3.6], life: [5.5, 7.5], color: SMOKE, alpha: 0.34, spin: [-0.35, 0.35], powerCount: false }),
  ] },
};
