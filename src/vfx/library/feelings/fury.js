// ---------------------------------------------------------------------------------------
// FURY'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('fury', anchored on
// progress/weather.js COLOR.fury), its paint motif as the pattern (cracks), and its motion: FAST, OUTWARD, JAGGED. A hard white core,
// spikes thrown out before the eye has found them, cracks racing across the ground, embers thrown hard and falling, and a short sharp
// shake on the burst and the rise (inside the shake budget: vfx/vfx.js BUDGETS). Six moments and its caster shell's landing (TYPE-84,
// the berserk), each in three tiers as vfx/library/kitdemo.js lays them: PRIMARY the hero shape, SECONDARY what moves round it,
// TERTIARY what lingers.
//
// Prior art (a museum label): Chrono Cross (Square, 1999), its Red element, fire and magma; Vagrant Story (Square, 2000; Yasumi
// Matsuno, Hiroshi Minagawa), Risk: a heat that builds and costs; Final Fantasy IX (Square, 2000), Trance and the Mist that "stimulates
// the fighting instinct": rage changes the verb (docs/ref/VFX-PRIOR-ART.md 1.1, 1.2, 1.11, 3.2).
//
//   FURY_EFFECTS   'feeling.fury.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.fury.land' (held)
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramp's own stops, vfx/shapes/ramps.js 'fury', as hex)
const DEEP = 0x5a0008, MID = COLOR.fury, ORANGE = 0xff5a10, EMBERS = [0xff5a10, 0xffc060, 0xff9a5c], SMOKE = 0x3a1a18;
/** A shock ring of cracks thrown out fast along the ground, `at` real s in, to `s` m in `dur`. */
const shock = (at, s, dur = 0.32, k = 1) => L({ type: 'shape', form: 'ring', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [10, 1], scroll: [0, 2.4], at, dur, scale: [[0, 0.4], [1, s]], offset: [0, 0.04, 0],
  edgeV: [0.6, 0.12], erode: [[0, 0], [0.4, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.35]], k: [[0, k], [1, k]], glow: 2.2, turn: 'random' });

export const FURY_EFFECTS = {
  // a burst of Fury: a hard white core, jagged spikes and a dome of cracks thrown out fast, a shock ring, cracks racing over the ground,
  // sparks and embers thrown hard, a short sharp shake
  'feeling.fury.burst': { layers: [
    // PRIMARY (its heart): the hot core, hard, a tenth of a second
    hotCore({ ramp: 'fury', size: [0.5, 1.4], offset: [0, 0.5, 0], dur: 0.1 }),
    // PRIMARY: spikes of cracks thrown out of it at once, jagged, cooling from white through red to dark
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'fury', main: 'cracks', mainK: 0.5, tile: [1, 3], scroll: [0, 1.6], dur: 0.45, scale: [[0, 0.4], [0.2, 1.7], [1, 1.9]],
      stretch: [1, [[0, 0.3], [0.2, 1.2], [1, 1.1]], 1], erode: [[0, 0], [0.25, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.2, 0.05], [1, -0.4]], glow: 2.4, core: 0.8, turn: 'random' }),
    // PRIMARY: a dome of cracks thrown out fast, its cracks racing up it
    L({ type: 'shape', form: 'dome', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [5, 2], scroll: [0, -1.2], mask: 'noise', maskTile: [2, 1], maskScroll: [0.1, 0.6],
      dur: 0.5, scale: [[0, 0.3], [0.25, 2], [1, 2.4]], stretch: [1, 0.8, 1], erode: [[0, 0], [0.3, 0.08], [1, 1]], rampShift: [[0, 0.05], [0.25, 0.05], [1, -0.4]], rim: 0.5, glow: 2.2, turn: 'random' }),
    // SECONDARY: a shock ring out fast along the ground
    shock(0, 4.2),
    // SECONDARY: cracks racing out across the ground, red-hot, cooling to dark
    L({ type: 'shape', form: 'disc', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [4, 1], scroll: [0, 1.4], mask: 'noise', maskTile: [2, 1], maskScroll: [0.05, 0.3], dur: 0.7,
      scale: [[0, 0.6], [0.3, 2.6], [1, 2.8]], offset: [0, 0.02, 0], erode: [[0, 0], [0.35, 0.1], [1, 1]], rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.45]], glow: 1.8, core: 0.4, turn: 'random' }),
    // SECONDARY: sparks thrown hard, white to orange
    L({ type: 'sprites', count: [20, 26], shape: 'streak', spawn: 'sphere', r: 0.2, offset: [0, 0.5, 0], dir: 'cone', axis: 'up', cone: 80, speed: [10, 18], drag: 6, gravity: 6, stretch: 2.2,
      size: [0.12, 0.2], sizeEnd: 0.02, life: [0.22, 0.38], color: 0xffffff, colorEnd: ORANGE }),
    // SECONDARY: a short sharp shake (its motion character: inside the budget)
    L({ type: 'shake', k: 0.12 }),
    // TERTIARY: embers thrown hard up and out, coming down and lying a breath
    L({ type: 'sprites', count: [14, 18], shape: 'soft', dir: 'cone', axis: 'up', cone: 70, speed: [5, 9], drag: 2, gravity: 9, floor: 'ground',
      size: [0.05, 0.09], sizeEnd: 0.02, life: [0.8, 1.3], color: EMBERS, colorEnd: DEEP }),
    // TERTIARY: a breath of heat smoke rising off it
    L({ type: 'sprites', pool: 'alpha', at: 0.1, count: [5, 7], shape: 'puff', spawn: 'sphere', r: 0.3, offset: [0, 0.3, 0], dir: 'up', speed: [0.6, 1.2], size: [0.4, 0.6], sizeEnd: 1.1,
      life: [0.8, 1.1], color: SMOKE, alpha: 0.35, spin: [-0.6, 0.6] }),
  ] },

  // Fury spilt: a molten spill slammed out flat, its cracks glowing and cooling, a jagged crown, droplets flung far, embers rising
  'feeling.fury.splash': { layers: [
    // PRIMARY (its heart): the hot core where it struck
    hotCore({ ramp: 'fury', size: [0.35, 1], offset: [0, 0.15, 0], dur: 0.1 }),
    // PRIMARY: the spill, out at once, its cracks glowing white then cooling through red to dark, eroding from its rim
    L({ type: 'shape', form: 'disc', ramp: 'fury', main: 'noise', tile: [2, 1], scroll: [0.02, 0.4], mask: 'cracks', maskK: 0.8, maskTile: [4, 1], maskScroll: [0, 0.2],
      dur: 1.6, scale: [[0, 0.3], [0.08, 1.3], [1, 1.45]], offset: [0, 0.02, 0], erode: [[0, 0], [0.4, 0.1], [1, 1]], rampShift: [[0, 0.05], [0.15, 0.05], [1, -0.45]], glow: 1.8, core: 0.5, turn: 'random' }),
    // PRIMARY (its crown): spikes of it thrown up low and jagged round the strike
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'fury', main: 'cracks', mainK: 0.5, tile: [1, 3], scroll: [0, 1.6], dur: 0.35, scale: 1, stretch: [1, [[0, 0.2], [0.15, 0.6], [1, 0.4]], 1],
      erode: [[0, 0], [0.3, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.4]], glow: 2.2, turn: 'random' }),
    // SECONDARY: droplets flung hard and far
    L({ type: 'sprites', count: [14, 18], shape: 'soft', dir: 'cone', axis: 'up', cone: 70, speed: [5, 8], gravity: 14, drag: 0.5, floor: 'ground',
      size: [0.06, 0.1], sizeEnd: 0.04, life: [0.6, 0.9], color: EMBERS, colorEnd: MID }),
    // TERTIARY: embers rising off the cooling spill
    L({ type: 'sprites', at: 0.2, count: [10, 14], shape: 'soft', spawn: 'disc', r: 1.2, dir: 'up', speed: [0.8, 1.6], gravity: -0.5, size: [0.04, 0.07], sizeEnd: 0, life: [0.5, 0.9], color: EMBERS }),
    // TERTIARY: heat smoke off it
    L({ type: 'sprites', pool: 'alpha', at: 0.15, count: [4, 6], shape: 'puff', spawn: 'disc', r: 0.8, offset: [0, 0.2, 0], dir: 'up', speed: [0.5, 1], size: [0.4, 0.6], sizeEnd: 1,
      life: [0.8, 1.1], color: SMOKE, alpha: 0.32, spin: [-0.6, 0.6] }),
  ] },

  // Fury held round a body: a band of cracks racing up it, rays turning fast inside, a ring of cracks spinning at the feet, embers thrown
  // off hard (fast, never a flicker: its speed is the scroll's, its light steady)
  'feeling.fury.aura': { layers: [
    // PRIMARY: a band of cracks round the body racing up, its top torn by a noise mask racing faster, its heat shimmering
    L({ type: 'shape', form: 'band', ramp: 'fury', main: 'cracks', mainK: 0.6, tile: [4, 2], scroll: [0.12, 1.3], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 1.6], flow: 'noise', flowK: 0.05, flowScroll: [0, 1],
      dur: Infinity, scale: 0.7, stretch: [1, 2.3, 1], edgeV: [0.05, 0.6], rim: -0.6, erode: 0.16, glow: 1.7, core: 0.45, in: 4, out: 2.5 }),
    // PRIMARY (its inner wall): rays racing up, turning fast
    L({ type: 'shape', form: 'band', rim: -0.6, ramp: 'fury', main: 'rays', tile: [6, 1], scroll: [0, 1.8], dur: Infinity, scale: 0.5, stretch: [1, 2, 1], spin: 1.4,
      edgeV: [0.05, 0.6], erode: 0.2, glow: 1.4, core: 0.3, in: 4, out: 2.5 }),
    // SECONDARY: a ring of cracks spinning fast at the feet
    L({ type: 'shape', form: 'ring', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [8, 1], scroll: [0.2, 0.6], dur: Infinity, scale: 1.15, spin: 1.5, offset: [0, 0.03, 0], edgeV: [0.3, 0.3],
      erode: 0.15, glow: 1.5, in: 4, out: 2.5 }),
    // SECONDARY: embers thrown off the body hard
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'soft', spawn: 'ring', r: 0.55, offset: [0, 0.6, 0], dir: 'out', lift: 0.8, speed: [2, 4], drag: 2, gravity: 4,
      size: [0.04, 0.07], sizeEnd: 0.01, life: [0.4, 0.7], color: EMBERS }),
    // TERTIARY: sparks of heat rising off it
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'streak', spawn: 'ring', r: 0.5, offset: [0, 1, 0], dir: 'up', speed: [1.5, 3], gravity: -1, stretch: 1.2,
      size: [0.06, 0.1], sizeEnd: 0.01, life: [0.4, 0.7], color: EMBERS }),
    // TERTIARY: a glow of cracks on the ground under it
    L({ type: 'shape', form: 'disc', ramp: 'fury', main: 'cracks', mainK: 0.55, mask: 'noise', maskScroll: [0.05, 0.2], tile: [3, 1], scroll: [0, 0.4], dur: Infinity, scale: 1.2,
      offset: [0, 0.02, 0], glow: 0.8, core: 0, erode: 0.12, rampShift: -0.1, in: 2, out: 2 }),
  ] },

  // Fury held on a moving thing: a hard hot head of cracks, sparks thrown sideways hard, embers falling from its wake
  'feeling.fury.trail': { layers: [
    // PRIMARY: a hard hot head, its cracks racing round it
    L({ type: 'shape', form: 'sphere', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [3, 2], scroll: [0.4, 1.2], dur: Infinity, scale: 0.16, rim: -0.5, glow: 2.4, core: 0.8, erode: 0.06, in: 10, out: 5 }),
    // SECONDARY: sparks thrown off it hard, every way
    L({ type: 'sprites', rate: 26, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.12, dir: 'sphere', speed: [3, 6], drag: 5, gravity: 3, stretch: 1.6,
      size: [0.08, 0.14], sizeEnd: 0.02, life: [0.18, 0.32], color: 0xffffff, colorEnd: ORANGE }),
    // TERTIARY: embers falling from its wake and lying a breath
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.1, dir: 'sphere', speed: [0.4, 1.2], gravity: 8, floor: 'ground',
      size: [0.04, 0.06], sizeEnd: 0.02, life: [0.6, 1], color: EMBERS, colorEnd: DEEP }),
    // TERTIARY: heat smoke behind it
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.1, dir: 'up', speed: [0.2, 0.5], size: [0.2, 0.3], sizeEnd: 0.6, life: [0.6, 0.8], color: SMOKE, alpha: 0.3 }),
  ] },

  // Fury awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): sparks snapped in, then at once spikes erupting, a pillar of
  // cracking fire shot up round the Courier, shock rings out twice, cracks racing over the ground, embers raining down
  'feeling.fury.rise': { layers: [
    // SECONDARY (its gathering): sparks snapped in from all round, a sixth of a second
    L({ type: 'sprites', count: [30, 36], shape: 'streak', spawn: 'ring', r: 3.5, offset: [0, 1, 0], dir: 'in', speed: [20, 24], stretch: 2.2, life: [0.13, 0.15],
      size: [0.15, 0.25], sizeEnd: 0.05, color: 0xffffff, colorEnd: ORANGE }),
    // SECONDARY (its gathering): a ring of cracks snapping shut on their feet
    L({ type: 'shape', form: 'ring', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [10, 1], scroll: [0, -2], dur: 0.15, scale: [[0, 3.2], [1, 0.5]], offset: [0, 0.03, 0],
      edgeV: [0.3, 0.3], erode: [[0, 0.2], [0.4, 0.05], [1, 0.3]], rampShift: [[0, 0], [1, 0.05]], glow: 1.9, turn: 'random' }),
    // PRIMARY (its heart): the hot core, hard
    hotCore({ ramp: 'fury', at: 0.15, size: [0.6, 2], offset: [0, 1, 0], dur: 0.1 }),
    // PRIMARY: spikes erupting round them, huge and jagged
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'fury', main: 'cracks', mainK: 0.5, tile: [1, 3], scroll: [0, 1.4], at: 0.15, dur: 1.2, scale: [[0, 0.8], [0.12, 2.6], [1, 2.8]],
      stretch: [1, [[0, 0.3], [0.12, 1.6], [1, 1.5]], 1], erode: [[0, 0], [0.4, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.15, 0.05], [1, -0.42]], glow: 2.4, core: 0.7, turn: 'random' }),
    // PRIMARY: a pillar of cracking fire shot up round them, its cracks racing up it
    L({ type: 'shape', form: 'band', ramp: 'fury', main: 'cracks', mainK: 0.6, tile: [4, 3], scroll: [0.1, 2], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 1.6], flow: 'noise', flowK: 0.05,
      at: 0.15, dur: 1.6, scale: [[0, 0.6], [0.06, 1.1], [1, 1.25]], stretch: [1, [[0, 0.3], [0.1, 6.5], [1, 7.5]], 1], edgeV: [0.03, 0.6], rim: -0.6,
      erode: [[0, 0], [0.35, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.15, 0.05], [1, -0.42]], glow: 2.4, core: 0.6 }),
    // SECONDARY: shock rings out fast along the ground, twice
    shock(0.15, 7, 0.35), shock(0.3, 5.5, 0.4, 0.75),
    // SECONDARY: cracks racing out across the ground round them, red-hot, cooling to dark
    L({ type: 'shape', form: 'disc', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [5, 1], scroll: [0, 1.2], mask: 'noise', maskTile: [2, 1], maskScroll: [0.05, 0.3], at: 0.15, dur: 1.4,
      scale: [[0, 1], [0.2, 4.5], [1, 4.8]], offset: [0, 0.02, 0], erode: [[0, 0], [0.35, 0.1], [1, 1]], rampShift: [[0, 0.05], [0.25, 0.05], [1, -0.45]], glow: 1.8, core: 0.3, turn: 'random' }),
    // SECONDARY: sparks thrown hard
    L({ type: 'sprites', at: 0.15, count: [40, 50], shape: 'streak', spawn: 'sphere', r: 0.4, offset: [0, 0.8, 0], dir: 'cone', axis: 'up', cone: 80, speed: [12, 22], drag: 6, gravity: 6, stretch: 2.4,
      size: [0.14, 0.22], sizeEnd: 0.02, life: [0.3, 0.5], color: 0xffffff, colorEnd: ORANGE }),
    // SECONDARY: its light, a soft wash of its colour, a short sharp shake (the screen weight a rise earns, inside the budgets)
    L({ type: 'light', at: 0.15, color: ORANGE, k: 34, range: 10, dur: 1.2, up: 1.4 }),
    L({ type: 'flash', at: 0.15, k: 0.2, color: ORANGE, dur: 0.35 }),
    L({ type: 'shake', at: 0.15, k: 0.18 }),
    // TERTIARY: embers thrown up and raining down round them, lying a breath
    L({ type: 'sprites', at: 0.18, count: [40, 50], shape: 'soft', dir: 'cone', axis: 'up', cone: 60, speed: [6, 11], drag: 1.5, gravity: 9, floor: 'ground',
      size: [0.05, 0.09], sizeEnd: 0.02, life: [1.4, 2.2], color: EMBERS, colorEnd: DEEP }),
    // TERTIARY: heat smoke rising round them
    L({ type: 'sprites', pool: 'alpha', at: 0.3, count: [10, 14], shape: 'puff', spawn: 'disc', r: 1.2, offset: [0, 0.3, 0], dir: 'up', speed: [0.8, 1.6], size: [0.6, 0.9], sizeEnd: 1.8,
      life: [1.6, 2.2], color: SMOKE, alpha: 0.32, spin: [-0.5, 0.5] }),
  ] },

  // Fury drunk (at the Courier's chest: vfx/feelinglooks.js): sparks snapped in fast, a ring of cracks snapping shut round them, a hard
  // pulse as it is taken in, embers popping off them
  'feeling.fury.drink': { layers: [
    // SECONDARY (its gathering): sparks snapped in fast, jagged
    L({ type: 'sprites', count: [18, 22], shape: 'streak', spawn: 'shell', r: 2.6, dir: 'in', speed: [9, 11], stretch: 2, life: [0.24, 0.27], size: [0.1, 0.16], sizeEnd: 0.03, color: 0xffffff, colorEnd: ORANGE }),
    // PRIMARY: a ring of cracks snapping shut round them, facing the eye
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [8, 1], scroll: [0, -2], dur: 0.26, scale: [[0, 1.8], [1, 0.25]],
      edgeV: [0.35, 0.35], erode: [[0, 0.2], [0.3, 0.05], [0.85, 0.1], [1, 1]], rampShift: [[0, 0], [0.85, 0.05], [1, -0.1]], glow: 1.8, turn: 'random' }),
    // PRIMARY (taken in): the hot core, and a hard pulse of cracks out of it
    hotCore({ ramp: 'fury', at: 0.25, size: [0.45, 0.3], offset: [0, 0, 0], dur: 0.1 }),
    L({ type: 'shape', form: 'sphere', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [3, 2], scroll: [0.3, 1], at: 0.27, dur: 0.28, scale: [[0, 0.25], [0.3, 0.55], [1, 0.6]], rim: -0.4, glow: 2,
      erode: [[0, 0], [0.3, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.35]], turn: 'random' }),
    // TERTIARY: embers popping off them
    L({ type: 'sprites', at: 0.28, count: [8, 10], shape: 'soft', dir: 'sphere', speed: [2, 4], drag: 3, gravity: 4, size: [0.04, 0.06], sizeEnd: 0.01, life: [0.4, 0.6], color: EMBERS }),
  ] },

  // 84 Fury, the berserk (vfx/shelllooks.js: held on the creature it struck for its dur): Fury's burst on it, then a band of cracks
  // racing up round its body, a hard ring pulsing out of it, shards of red thrown off
  'shell.fury.land': { extends: 'feeling.fury.burst', layers: [
    // PRIMARY (held): a band of cracks racing up round the body from its feet (the look is held at its middle)
    L({ type: 'shape', form: 'band', ramp: 'fury', main: 'cracks', mainK: 0.6, tile: [4, 2], scroll: [0.12, 1.4], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 1.6],
      dur: Infinity, scale: 0.6, stretch: [1, 1.5, 1], offset: [0, -0.6, 0], edgeV: [0.05, 0.6], rim: -0.6, erode: 0.18, glow: 1.6, core: 0.4, in: 5, out: 2.5 }),
    // SECONDARY (held): a hard ring pulsing out of it every 0.7 real s
    L({ type: 'shape', form: 'ring', ramp: 'fury', main: 'cracks', mainK: 0.55, tile: [10, 1], scroll: [0, 1.6], dur: Infinity, loop: 0.7, scale: [[0, 0.3], [1, 1.8]],
      k: [[0, 1], [0.6, 0.6], [1, 0]], erode: [[0, 0], [0.6, 0.2], [1, 0.9]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.9, in: 6, out: 2.5 }),
    // SECONDARY: shards of red thrown off the body
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'shard', spawn: 'sphere', r: 0.5, dir: 'out', speed: [1, 2], size: [0.1, 0.18], sizeEnd: 0.04, life: 0.4, color: [MID, ORANGE], spin: [-6, 6] }),
    // TERTIARY: sparks of heat rising off it
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.4, dir: 'up', speed: [1.5, 3], gravity: -1, stretch: 1.2, size: [0.06, 0.1], sizeEnd: 0.01, life: [0.4, 0.6], color: EMBERS }),
  ] },
};
