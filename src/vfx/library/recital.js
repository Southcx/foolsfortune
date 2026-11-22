// ---------------------------------------------------------------------------------------
// THE RECITAL'S EFFECTS (library entries: vfx/library.js spreads them in; vfx/recitallooks.js plays them on the combat recital's events,
// tools/crucibelle/recital.js and recitalplay.js). The stage of a live show at the Courier's scale, in the bell's palette (each note its
// degree's colour, `tint`; the chord gold; the feedback and the rockstar moment the film):
//   recital.note        a ring of sound off the amp's mouth as a note is played, in the note's colour, motes thrown out with it
//   recital.lick.fly    a lick's bolt while it flies (held, following it): a hot ball of sound in its note's colour and a short tail
//   recital.lick.hit    a lick landing: a four-point star and a ring popped, sparks in its colour
//   recital.strum       a strum's chord thrown down the aim: a curved wall of sound in gold sweeping out, its size the chain's step (`power`)
//   recital.windmill    the strum chain's fourth: the chord rung all round (a ring on the ground racing out), the pyro's two jets either side
//   recital.feedback    the feedback held (following the amp's mouth along the aim): a beam of sound in the film, streaks running out of it
//   recital.rockstar    the rockstar moment: two pyro columns either side and behind, a jet of sparks off each, confetti in the film, one lamp
//   recital.smoke       the amp smoking at fever: a puff of grey off its mouth
// NO FLICKER: each is one wash in and out; the pyro's lamp is one of the light budget's, held a moment and let go.
//
// Prior art: the arena show's kit (concert pyro: the gerb's fountain, the mine's burst, the confetti cannon on the drop), Guitar Hero's
// star power (the note highway lit blue), Brütal Legend's solos (the sound made visible as rings and bolts off the amp), Hi-Fi Rush's
// beat-locked bursts.
//
//   RECITAL_EFFECTS   (ctx: { pos, dir, tint, power, scale, follow })
// ---------------------------------------------------------------------------------------
const L = (o) => o;
const PYRO = [0xffd76a, 0xff9a3c, 0xffe8b0];

export const RECITAL_EFFECTS = {
  'recital.note': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.35, sizeEnd: 1.6, life: 0.4, color: 'tint', alpha: 0.95, powerCount: false }),
    L({ type: 'sprites', count: [4, 6], shape: 'soft', spawn: 'sphere', r: 0.1, dir: 'cone', cone: 40, speed: [1.5, 3], size: [0.05, 0.09], sizeEnd: 0, life: [0.3, 0.5], drag: 2, color: ['tint', 'white'], alpha: 1 }),
  ] },
  'recital.lick.fly': { layers: [
    L({ type: 'shape', form: 'sphere', ramp: 'tint', tint: 'tint', main: 'noise', tile: [3, 2], scroll: [0.6, 1.4], dur: Infinity, in: 20, out: 8, scale: 0.13, rim: -0.6, core: 0.9, glow: 2.2, erode: 0.05 }),
    L({ type: 'sprites', dur: Infinity, rate: 40, shape: 'soft', size: [0.1, 0.15], sizeEnd: 0, life: [0.18, 0.26], color: 'tint', colorEnd: 'white', alpha: 0.9 }),
    L({ type: 'sprites', dur: Infinity, rate: 10, shape: 'sparkle', spawn: 'sphere', r: 0.12, size: [0.06, 0.1], sizeEnd: 0, life: [0.25, 0.4], color: 'white', twinkle: 12 }),
  ] },
  'recital.lick.hit': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.8, sizeEnd: 0.1, life: 0.2, color: 'white', colorEnd: 'tint', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.3, life: 0.3, color: 'tint', alpha: 0.9, powerCount: false }),
    L({ type: 'sprites', count: [6, 8], shape: 'streak', dir: 'sphere', speed: [2.5, 4.5], size: [0.05, 0.08], sizeEnd: 0.02, life: [0.2, 0.32], stretch: 3, drag: 3, color: ['tint', 'white'] }),
  ] },
  'recital.strum': { layers: [
    L({ type: 'shape', form: 'wave', face: 'heading', ramp: 'gold', main: 'streaks', mainK: 0.6, tile: [5, 1], scroll: [0, 2.4], dur: 0.34, scale: [[0, 0.8], [1, 6]], stretch: [1, 0.32, 1], offset: [0, 1.0, 0], glow: 1.6, erode: [[0, 0.2], [0.25, 0.05], [1, 1]] }),
    L({ type: 'sprites', count: [10, 14], shape: 'streak', dir: 'cone', cone: 30, speed: [6, 10], size: [0.06, 0.1], sizeEnd: 0.02, life: [0.2, 0.35], stretch: 4, drag: 2, offset: [0, 1.1, 0], color: ['gold', 'white'] }),
  ] },
  'recital.windmill': { layers: [
    L({ type: 'shape', form: 'ring', ramp: 'gold', main: 'rays', tile: [12, 1], scroll: [0.3, 0], dur: 0.5, scale: [[0, 0.6], [1, 7]], offset: [0, 0.08, 0], glow: 1.8, erode: [[0, 0.15], [0.3, 0.05], [1, 1]] }),
    L({ type: 'shape', form: 'band', ramp: 'gold', main: 'streaks', tile: [10, 1], scroll: [0, 3], dur: 0.45, scale: [[0, 0.8], [1, 5.5]], stretch: [1, 0.25, 1], offset: [0, 0.9, 0], glow: 1.4, erode: [[0, 0.25], [0.3, 0.08], [1, 1]] }),
    L({ type: 'sprites', count: [16, 20], shape: 'streak', spawn: 'ring', r: 1.6, dir: 'cone', axis: 'up', cone: 12, speed: [7, 11], size: [0.06, 0.1], sizeEnd: 0.02, life: [0.5, 0.8], stretch: 4, gravity: 7, drag: 0.6, color: PYRO }),
    L({ type: 'shake', k: 0.15 }),
  ] },
  'recital.feedback': { layers: [
    L({ type: 'shape', form: 'beam', face: 'dir', ramp: 'film', main: 'streaks', tile: [3, 6], scroll: [0, -5], mask: 'noise', maskK: 0.5, maskScroll: [0, -2], dur: Infinity, in: 8, out: 6,
      scale: 10, stretch: [0.2, 0.2, 1], edgeV: [0.02, 0.4], rim: -0.6, core: 0.7, glow: 1.6, erode: 0.08 }),
    L({ type: 'sprites', dur: Infinity, rate: 6, shape: 'ringthin', size: 0.3, sizeEnd: 2, life: 0.45, color: 'film', alpha: 0.7 }),
    L({ type: 'sprites', dur: Infinity, rate: 30, shape: 'streak', dir: 'cone', cone: 6, speed: [14, 20], size: [0.05, 0.08], sizeEnd: 0.02, life: [0.3, 0.5], stretch: 5, color: ['film', 'white'] }),
  ] },
  'recital.rockstar': { layers: [
    ...[-2.2, 2.2].map((x) => L({ type: 'shape', form: 'pillar', ramp: 'ember', main: 'noise', tile: [2, 3], scroll: [0, 3], dur: 1.3, scale: 1, stretch: [3, 3.6, 3], offset: [x, 0, -1.2], glow: 2.2, erode: [[0, 0.5], [0.12, 0.05], [0.7, 0.1], [1, 1]] })),
    ...[-2.2, 2.2].map((x) => L({ type: 'sprites', rate: 70, dur: 1.1, shape: 'streak', spawn: 'disc', r: 0.25, offset: [x, 0.1, -1.2], dir: 'cone', axis: 'up', cone: 10, speed: [8, 12], size: [0.06, 0.1], sizeEnd: 0.02, life: [0.5, 0.8], stretch: 4, gravity: 6, drag: 0.5, color: PYRO })),
    L({ type: 'sprites', at: 0.15, count: [40, 50], shape: 'petal', spawn: 'sphere', r: 1.2, offset: [0, 3.2, 0], dir: 'sphere', speed: [1, 2.6], size: [0.08, 0.13], life: [1.4, 2], gravity: 1.4, drag: 1.2, spin: [-6, 6], color: ['film0', 'film1', 'film2', 'film3'] }),
    L({ type: 'light', color: 0xffb860, k: 26, range: 9, dur: 1.3, hold: 0.5, up: 2 }),
    L({ type: 'shake', k: 0.2 }),
  ] },
  'recital.smoke': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [1, 2], shape: 'puff', spawn: 'sphere', r: 0.1, dir: 'up', speed: [0.4, 0.8], size: [0.15, 0.22], sizeEnd: 0.6, life: [0.9, 1.3], drag: 1.2, gravity: -0.3, color: [0x8a8090, 0x6a6070], alpha: 0.45, spin: [-1, 1] }),
  ] },
};
