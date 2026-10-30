// ---------------------------------------------------------------------------------------
// GRIEF'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('grief', anchored on
// progress/weather.js COLOR.grief), its paint motif as the pattern (streaks), and its motion: SLOW, FALLING, SINKING. Its streaks run
// down like rain on glass, its shapes settle low as they die, its drops fall, and what it leaves lingers longest of anything in the
// library (four real seconds and more: mist pooled low, motes sinking). Six moments and its caster shell's landing (TYPE-86, the
// weeping), each in three tiers as vfx/library/kitdemo.js lays them: PRIMARY the hero shape, SECONDARY what moves round it, TERTIARY
// what lingers.
//
// Prior art (a museum label): Final Fantasy X (Square, 2001), the unsent: the dead not sent on linger and "come to envy the living",
// so what is left stays longest; Chrono Cross (Square, 1999), its Blue element, water and ice; Kevin Leroy's fade order (Riot; 80.lv,
// 2017): the last thing to leave is the quietest (docs/ref/VFX-PRIOR-ART.md 1.1, 2.2, 3.2).
//
//   GRIEF_EFFECTS   'feeling.grief.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.grief.land' (held)
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramp's own stops, vfx/shapes/ramps.js 'grief', as hex)
const DEEP = 0x2a3a78, MID = COLOR.grief, LIGHT = 0xc4cee2, PALE = 0xeef0f4, CLOUD = [0x4a5a7a, 0x5a6a8a];
// (a thing settling low as it dies: a stretch's y over its life)
const SINK = [[0, 1], [0.3, 0.85], [1, 0.3]];
/** Motes sinking slowly, the last of it to go (its tertiary everywhere). */
const sinking = (o) => L({ type: 'sprites', shape: 'soft', dir: 'up', speed: [-0.12, -0.04], gravity: 0.06, drag: 0.4, floor: 'ground', size: [0.05, 0.08], sizeEnd: 0, color: [LIGHT, PALE], alpha: 0.75, ...o });
/** Mist pooled low on the ground, eroding slowly through its streaks (the longest dissipation in the library). */
const mist = (o) => L({ type: 'shape', form: 'disc', ramp: 'grief', main: 'noise', tile: [2, 1], scroll: [0.01, 0.04], mask: 'streaks', maskK: 0.5, maskTile: [6, 1], maskScroll: [0, 0.08],
  offset: [0, 0.02, 0], glow: 0.8, core: 0, erode: [[0, 0.12], [0.6, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.32]], k: [[0, 0], [0.1, 0.7], [1, 0.7]], turn: 'random', ...o });

export const GRIEF_EFFECTS = {
  // a burst of Grief: a dome of streaks that runs down and settles flat, rain falling round it, tears, a ring spreading slowly, and mist
  // and motes left longest of all
  'feeling.grief.burst': { layers: [
    // PRIMARY (its heart): the hot core, pale, a tenth of a second
    hotCore({ ramp: 'grief', size: [0.3, 1], offset: [0, 0.5, 0] }),
    // PRIMARY: a dome of streaks, its streaks running down it, settling low as it dies, eroding as it cools
    L({ type: 'shape', form: 'dome', ramp: 'grief', main: 'streaks', mainK: 0.7, tile: [6, 1], scroll: [0, 0.8], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.2],
      dur: 1.2, scale: [[0, 0.6], [0.25, 1.6], [1, 1.8]], stretch: [1, [[0, 1.2], [0.3, 1], [1, 0.25]], 1], erode: [[0, 0], [0.5, 0.06], [1, 1]],
      rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.32]], rim: 0.3, glow: 1.8, core: 0.5, turn: 'random' }),
    // SECONDARY: rain falling round it
    L({ type: 'sprites', count: [24, 30], shape: 'streak', spawn: 'disc', r: 1.6, offset: [0, 2.4, 0], dir: 'up', speed: [-5, -3], gravity: 2, stretch: 2, delay: [0, 0.4], floor: 'ground',
      size: [0.1, 0.16], sizeEnd: 0.08, life: [0.5, 0.8], color: [LIGHT, MID], alpha: 0.9 }),
    // SECONDARY: a ring spreading slowly along the ground
    L({ type: 'shape', form: 'ring', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [12, 1], scroll: [0, 0.3], dur: 1.4, scale: [[0, 0.5], [1, 3]], offset: [0, 0.03, 0],
      edgeV: [0.4, 0.2], erode: [[0, 0], [0.4, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.5, turn: 'random' }),
    // SECONDARY: tears falling from it
    L({ type: 'sprites', count: [8, 10], shape: 'drip', spawn: 'sphere', r: 0.4, offset: [0, 1, 0], dir: 'up', speed: [-0.5, 0], gravity: 6, floor: 'ground', stretch: 0.4,
      size: [0.07, 0.1], sizeEnd: 0.06, life: [0.7, 1], color: LIGHT }),
    // TERTIARY: mist pooled low on the ground, eroding slowly, the longest of any burst's
    mist({ at: 0.2, dur: 4.2, scale: [[0, 1], [0.2, 2.2], [1, 2.5]] }),
    // TERTIARY: motes sinking slowly, last to go
    sinking({ at: 0.4, count: [16, 20], spawn: 'sphere', r: 1.4, offset: [0, 1.2, 0], life: [3, 4] }),
  ] },

  // Grief spilt: a pool running out slowly, a crown of it sinking back, drops falling back into it, rings slow on it, mist hanging over it
  'feeling.grief.splash': { layers: [
    // PRIMARY (its heart): the hot core where it struck
    hotCore({ ramp: 'grief', size: [0.25, 0.7], offset: [0, 0.15, 0] }),
    // PRIMARY: the pool running out slowly, its streaks running, eroding last
    L({ type: 'shape', form: 'disc', ramp: 'grief', main: 'noise', tile: [2, 1], scroll: [0.01, 0.12], mask: 'streaks', maskK: 0.6, maskTile: [6, 1], maskScroll: [0, 0.25], flow: 'noise', flowK: 0.05,
      dur: 4, scale: [[0, 0.3], [0.15, 1], [0.5, 1.35], [1, 1.5]], offset: [0, 0.02, 0], erode: [[0, 0], [0.6, 0.12], [1, 1]],
      rampShift: [[0, 0.05], [0.2, 0.03], [1, -0.32]], glow: 1.3, core: 0.3, turn: 'random' }),
    // PRIMARY (its crown): a low wall of it thrown up and sinking back, its streaks running down
    L({ type: 'shape', form: 'band', rim: -0.6, ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [10, 1], scroll: [0, -1.2], dur: 0.6, scale: [[0, 0.3], [1, 1]], stretch: [1, [[0, 0.4], [0.3, 0.35], [1, 0.05]], 1],
      edgeV: [0.05, 0.7], erode: [[0, 0], [0.3, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.6, turn: 'random' }),
    // SECONDARY: drops thrown a little way, falling back
    L({ type: 'sprites', count: [10, 14], shape: 'soft', dir: 'cone', axis: 'up', cone: 40, speed: [2, 3], gravity: 9, floor: 'ground', size: [0.06, 0.09], sizeEnd: 0.04, life: [0.6, 0.8], color: [LIGHT, MID] }),
    // TERTIARY: a ring spreading slowly over it, a while after
    L({ type: 'shape', form: 'ring', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [10, 1], scroll: [0, 0.2], at: 0.3, dur: 2, scale: [[0, 0.5], [1, 2.4]], offset: [0, 0.03, 0],
      edgeV: [0.4, 0.2], erode: [[0, 0], [0.5, 0.1], [1, 1]], rampShift: [[0, 0], [1, -0.3]], k: [[0, 0.6], [1, 0.6]], glow: 1.3, turn: 'random' }),
    // TERTIARY: mist hanging low over it, longest
    mist({ at: 0.2, dur: 4.4, scale: [[0, 0.8], [0.2, 1.8], [1, 2]] }),
  ] },

  // Grief held round a body: a curtain of streaks running down round it, drips falling off it slowly, a ring spreading at its feet again
  // and again, mist pooled low (it settles; its out is slow: a long dissipation)
  'feeling.grief.aura': { layers: [
    // PRIMARY: a curtain of streaks round the body, running down like rain on glass
    L({ type: 'shape', form: 'band', ramp: 'grief', main: 'streaks', mainK: 0.7, tile: [5, 1], scroll: [0, -0.45], mask: 'noise', maskTile: [2, 1], maskScroll: [0, -0.2],
      dur: Infinity, scale: 0.72, stretch: [1, 2.2, 1], edgeV: [0.04, 0.6], rim: -0.6, erode: 0.14, glow: 1.3, core: 0.25, k: 0.9, in: 2, out: 1.2 }),
    // SECONDARY: drips falling off the body, slowly
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'drip', spawn: 'ring', r: 0.5, offset: [0, 1.5, 0], dir: 'up', speed: [-0.4, -0.1], gravity: 4, floor: 'ground', stretch: 0.4,
      size: [0.06, 0.09], sizeEnd: 0.05, life: [1, 1.4], color: LIGHT, alpha: 0.9 }),
    // SECONDARY: a ring spreading slowly at the feet, again every 2.4 real s
    L({ type: 'shape', form: 'ring', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [10, 1], scroll: [0, 0.2], dur: Infinity, loop: 2.4, scale: [[0, 0.5], [1, 1.6]], offset: [0, 0.03, 0],
      k: [[0, 0], [0.15, 0.8], [1, 0]], erode: [[0, 0.05], [0.6, 0.2], [1, 0.9]], glow: 1.3, in: 2, out: 1.2 }),
    // TERTIARY: mist pooled low under it
    L({ type: 'shape', form: 'disc', ramp: 'grief', main: 'noise', tile: [2, 1], scroll: [0.01, 0.04], mask: 'streaks', maskK: 0.5, maskTile: [6, 1], maskScroll: [0, 0.08], dur: Infinity, scale: 1.3,
      offset: [0, 0.02, 0], glow: 0.7, core: 0, erode: 0.12, rampShift: -0.12, k: 0.8, in: 2, out: 1 }),
    // TERTIARY: motes sinking slowly round it
    sinking({ rate: 6, dur: Infinity, spawn: 'ring', r: 0.8, offset: [0, 1.6, 0], speed: [-0.15, -0.05], size: [0.04, 0.07], life: [2, 3], alpha: 0.7 }),
  ] },

  // Grief held on a moving thing: a head of streaks running down, drips falling straight from it, streaks shed, motes left sinking longest
  'feeling.grief.trail': { layers: [
    // PRIMARY: a head of streaks, its streaks running down it
    L({ type: 'shape', form: 'sphere', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [4, 1], scroll: [0, -0.6], dur: Infinity, scale: 0.16, rim: -0.5, glow: 1.6, core: 0.5, erode: 0.08, in: 8, out: 3 }),
    // SECONDARY: drips falling straight down from it, lying where they land
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'drip', spawn: 'sphere', r: 0.1, dir: 'up', speed: [-0.3, 0], gravity: 7, floor: 'ground', stretch: 0.4,
      size: [0.05, 0.08], sizeEnd: 0.05, life: [0.6, 1], color: LIGHT }),
    // SECONDARY: streaks shed behind it, running down
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.12, dir: 'up', speed: [-1.5, -0.8], stretch: 1.6, size: [0.08, 0.12], sizeEnd: 0.04, life: [0.4, 0.6], color: MID }),
    // TERTIARY: motes left sinking in its wake, the longest of any trail's
    sinking({ rate: 6, dur: Infinity, spawn: 'sphere', r: 0.2, speed: [-0.08, -0.02], gravity: 0.05, size: [0.04, 0.06], life: [2.5, 3.5], alpha: 0.7 }),
  ] },

  // Grief awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): the sky falling in round the Courier, then a curtain of
  // streaks running down round them, a dome settling flat, rain for two seconds, rings spreading slowly, and mist and motes left longest
  'feeling.grief.rise': { layers: [
    // SECONDARY (its gathering): streaks falling in round them out of the sky
    L({ type: 'sprites', count: [40, 48], shape: 'streak', spawn: 'disc', r: 3.5, offset: [0, 6, 0], dir: 'up', speed: [-16, -14], stretch: 2.4, life: [0.36, 0.4],
      size: [0.16, 0.24], sizeEnd: 0.06, color: [PALE, LIGHT] }),
    // SECONDARY (its gathering): a ring closing in on their feet
    L({ type: 'shape', form: 'ring', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [12, 1], scroll: [0, -0.6], dur: 0.4, scale: [[0, 3.5], [1, 0.8]], offset: [0, 0.03, 0],
      edgeV: [0.3, 0.3], erode: [[0, 0.3], [0.3, 0.05], [1, 0.4]], rampShift: [[0, -0.1], [1, 0.05]], k: [[0, 0], [0.3, 1], [1, 1]], glow: 1.5, turn: 'random' }),
    // PRIMARY (its heart): the hot core as the sky lands
    hotCore({ ramp: 'grief', at: 0.4, size: [0.5, 1.5], offset: [0, 1, 0] }),
    // PRIMARY: a curtain of streaks running down round them, settling lower as it dies
    L({ type: 'shape', form: 'band', ramp: 'grief', main: 'streaks', mainK: 0.7, tile: [6, 1], scroll: [0, -0.7], mask: 'noise', maskTile: [2, 1], maskScroll: [0, -0.25], at: 0.38, dur: 3,
      scale: [[0, 1.6], [0.1, 1.9], [1, 2.1]], stretch: [1, [[0, 4.5], [0.15, 4], [1, 2.2]], 1], edgeV: [0.04, 0.55], rim: -0.6,
      erode: [[0, 0], [0.5, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.2, 0.05], [1, -0.32]], glow: 1.9, core: 0.45 }),
    // PRIMARY: a dome settling flat over them, its streaks running down
    L({ type: 'shape', form: 'dome', ramp: 'grief', main: 'streaks', mainK: 0.7, tile: [8, 1], scroll: [0, 0.6], at: 0.38, dur: 1.8, scale: 2.6, stretch: [1, [[0, 1.6], [0.3, 1], [1, 0.3]], 1],
      erode: [[0, 0], [0.45, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.32]], rim: 0.3, glow: 1.6, turn: 'random' }),
    // SECONDARY: rain falling round them for two real seconds
    L({ type: 'sprites', at: 0.4, count: [60, 70], shape: 'streak', spawn: 'disc', r: 2.6, offset: [0, 4.5, 0], dir: 'up', speed: [-6, -4], gravity: 2, stretch: 2, delay: [0, 1.8], floor: 'ground',
      size: [0.1, 0.16], sizeEnd: 0.08, life: [0.7, 1], color: [LIGHT, MID], alpha: 0.85 }),
    // SECONDARY: rings spreading slowly along the ground, the second quieter
    L({ type: 'shape', form: 'ring', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [12, 1], scroll: [0, 0.3], at: 0.42, dur: 2, scale: [[0, 0.8], [1, 5]], offset: [0, 0.03, 0],
      edgeV: [0.45, 0.2], erode: [[0, 0], [0.45, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.6, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [12, 1], scroll: [0, 0.25], at: 1.1, dur: 2.2, scale: [[0, 0.6], [1, 4]], offset: [0, 0.03, 0],
      edgeV: [0.45, 0.2], erode: [[0, 0], [0.45, 0.1], [1, 1]], rampShift: [[0, 0], [1, -0.32]], k: [[0, 0.6], [1, 0.6]], glow: 1.4, turn: 'random' }),
    // SECONDARY: its light and a soft wash of its colour (the screen weight a rise earns, inside the budgets)
    L({ type: 'light', at: 0.4, color: MID, k: 22, range: 9, dur: 2, up: 1.4 }),
    L({ type: 'flash', at: 0.4, k: 0.12, color: LIGHT, dur: 0.6 }),
    // TERTIARY: mist pooled low round them, last but one to go
    mist({ at: 0.35, dur: 3.6, scale: [[0, 1.5], [0.15, 3.2], [1, 3.6]], tile: [3, 1] }),
    // TERTIARY: motes sinking slowly round them, last of all
    sinking({ at: 0.6, count: [30, 36], spawn: 'column', r: [0.4, 2.2], height: 3, speed: [-0.15, -0.05], life: [2.4, 3] }),
  ] },

  // Grief drunk (at the Courier's chest: vfx/feelinglooks.js): streaks drawn in, sinking as they come, a ring closing slowly round them,
  // taken in and settling, drops falling off them after
  'feeling.grief.drink': { layers: [
    // SECONDARY (its gathering): streaks drawn in from all round, sinking as they come
    L({ type: 'sprites', count: [16, 20], shape: 'streak', spawn: 'shell', r: 2.2, dir: 'in', speed: [2.6, 3], gravity: 1.6, stretch: 1.4, life: [0.7, 0.78], size: [0.08, 0.13], sizeEnd: 0.03, color: [PALE, LIGHT] }),
    // PRIMARY: a ring of streaks closing slowly round them, facing the eye
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [8, 1], scroll: [0, -0.5], dur: 0.7, scale: [[0, 1.5], [1, 0.3]],
      edgeV: [0.35, 0.35], erode: [[0, 0.25], [0.25, 0.05], [0.85, 0.1], [1, 1]], rampShift: [[0, -0.1], [0.85, 0.05], [1, -0.1]], glow: 1.4, turn: 'random' }),
    // PRIMARY (taken in): the hot core as it reaches them
    hotCore({ ramp: 'grief', at: 0.66, size: [0.35, 0.2], offset: [0, 0, 0] }),
    // TERTIARY: the glow it leaves in them, settling low as it goes
    L({ type: 'shape', form: 'sphere', ramp: 'grief', main: 'streaks', mainK: 0.55, tile: [4, 1], scroll: [0, -0.4], at: 0.68, dur: 0.8, scale: 0.42, stretch: [1, SINK, 1], rim: -0.5, glow: 1.2,
      erode: [[0, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.32]], turn: 'random' }),
    // TERTIARY: drops falling off them after, slowly
    L({ type: 'sprites', at: 0.75, count: [5, 7], shape: 'drip', spawn: 'sphere', r: 0.35, dir: 'up', speed: [-0.2, 0], gravity: 5, floor: 'ground', stretch: 0.4,
      size: [0.05, 0.08], sizeEnd: 0.05, life: [0.8, 1.2], color: LIGHT }),
  ] },

  // 86 Grief, the weeping (vfx/shelllooks.js: held over the head of the creature it struck for its dur): Grief's burst there, then one
  // cloud over its head, alpha-over and dark, raining on it
  'shell.grief.land': { extends: 'feeling.grief.burst', layers: [
    // PRIMARY (held): the cloud's body, alpha-over, its noise turning slowly
    L({ type: 'shape', form: 'sphere', ramp: 'grief', add: 0, main: 'noise', tile: [2, 1], scroll: [0.05, 0.1], mask: 'noise', maskTile: [3, 2], maskScroll: [-0.04, 0.06],
      dur: Infinity, scale: 0.55, stretch: [1.3, 0.55, 1.3], offset: [0, 0.25, 0], rim: -0.7, erode: 0.25, rampShift: -0.15, k: 0.75, glow: 1, core: 0, in: 2, out: 1 }),
    // SECONDARY: puffs of it turning over its head
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.4, offset: [0, 0.3, 0], speed: [0.05, 0.15], size: [0.5, 0.7], sizeEnd: 0.9, life: 1.2,
      color: CLOUD, alpha: 0.55, spin: [-0.3, 0.3] }),
    // SECONDARY: raining on it
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'streak', spawn: 'disc', r: 0.4, dir: 'up', speed: [-7, -5], size: 0.14, sizeEnd: 0.1, stretch: 2, life: 0.28, color: [LIGHT, DEEP], alpha: 0.85 }),
    // TERTIARY: motes sinking out of the cloud
    sinking({ rate: 3, dur: Infinity, spawn: 'disc', r: 0.5, life: [1.6, 2.2], alpha: 0.6 }),
  ] },
};
