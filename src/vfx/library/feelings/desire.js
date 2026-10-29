// ---------------------------------------------------------------------------------------
// DESIRE'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('desire', anchored on
// progress/weather.js COLOR.desire), its paint motif as the pattern (ripples), and its motion: DRAWN INWARD, A HEARTBEAT. Its shapes
// contract, then swell twice (lub, dub), its ribbons and motes are pulled toward the middle, and its held ones breathe to the same two
// beats. Six moments and its caster shell's landing (TYPE-83, the lure), each in three tiers as vfx/library/kitdemo.js lays them:
// PRIMARY the hero shape, SECONDARY what moves round it, TERTIARY what lingers.
//
// Prior art (a museum label): Einhänder (Square, 1997), its score multiplier's bar that flashes past a threshold: want at its
// brightest; Star Ocean: Till the End of Time (tri-Ace / Enix, 2003), the Bonus Battle Gauge, "excitement" kept and lost at once;
// Unlimited Saga (Square, 2002), the Reel: a want made a face (docs/ref/VFX-PRIOR-ART.md 1.15, 3.2). The two beats are a heart's.
//
//   DESIRE_EFFECTS   'feeling.desire.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.desire.land' (held)
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramp's own stops, vfx/shapes/ramps.js 'desire', as hex)
const ROSE = 0xe8506a, MID = COLOR.desire, HOT = 0xffb898;
// (the two beats: a one-shot's scale contracting, swelling, easing back, swelling bigger; a held one's breathing on its loop)
const BEAT = [[0, 1], [0.08, 0.62], [0.16, 1.25], [0.24, 0.9], [0.34, 1.45], [1, 1.6]];
const HEART = [[0, 1], [0.1, 1.1], [0.2, 0.97], [0.3, 1.08], [0.45, 1], [1, 1]];
const HEART_K = [[0, 0.85], [0.1, 1], [0.2, 0.9], [0.3, 1], [0.5, 0.85], [1, 0.85]];
/** A curve with its values times `s` (one beat at any size). */
const times = (c, s) => c.map(([t, v]) => [t, v * s]);
/** A ring of ripples out along the ground on a beat, `at` real s in, to `s` m. */
const beatRing = (at, s, dur = 0.55, k = 1) => L({ type: 'shape', form: 'ring', ramp: 'desire', main: 'ripple', tile: [8, 1], scroll: [0, 0.7], at, dur, scale: [[0, 0.5], [1, s]], offset: [0, 0.03, 0],
  edgeV: [0.5, 0.2], erode: [[0, 0], [0.4, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], k: [[0, 0.5 * k], [0.06, k], [1, k]], glow: 1.8, turn: 'random' });

export const DESIRE_EFFECTS = {
  // a burst of Desire: a dome of ripples that contracts, then swells on two beats, a ring out on each, ribbons pulled in to its heart
  'feeling.desire.burst': { layers: [
    // PRIMARY (its heart): the hot core on the first beat
    hotCore({ ramp: 'desire', at: 0.07, size: [0.3, 1], offset: [0, 0.5, 0] }),
    // PRIMARY: a dome of ripples drawn in, then swelling twice, its ripples running in toward its crown, eroding as it cools
    L({ type: 'shape', form: 'dome', ramp: 'desire', main: 'ripple', mainK: 0.6, tile: [4, 2], scroll: [0, -0.4], mask: 'noise', maskTile: [2, 1], maskScroll: [0.03, -0.2],
      dur: 0.9, scale: times(BEAT, 1.2), stretch: [1, [[0, 0.8], [0.16, 1.1], [1, 1]], 1], erode: [[0, 0], [0.45, 0.06], [1, 1]],
      rampShift: [[0, 0.05], [0.35, 0.05], [1, -0.32]], rim: 0.4, glow: 2, core: 0.6, turn: 'random' }),
    // SECONDARY: a ring of ripples out along the ground on each beat
    beatRing(0.12, 3, 0.5), beatRing(0.3, 3.8, 0.6, 0.85),
    // SECONDARY: ribbons pulled in toward its heart from all round
    L({ type: 'sprites', count: [16, 20], shape: 'streak', spawn: 'shell', r: 2.6, offset: [0, 0.6, 0], dir: 'in', speed: [5, 7], stretch: 1.6, life: [0.35, 0.42],
      size: [0.12, 0.2], sizeEnd: 0.04, color: [HOT, MID], colorEnd: ROSE }),
    // SECONDARY: a spiral of ripples drawn tight round it
    L({ type: 'shape', form: 'spiral', rim: -0.7, ramp: 'desire', main: 'ripple', tile: [6, 1], scroll: [-0.6, 0], dur: 0.6, scale: [[0, 2.4], [1, 0.4]], stretch: [1, 0.8, 1], spin: 3,
      erode: [[0, 0.3], [0.2, 0.06], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.7 }),
    // TERTIARY: warm motes hanging, drifting in slowly after it
    L({ type: 'sprites', at: 0.25, count: [14, 18], shape: 'soft', spawn: 'shell', r: 1.8, offset: [0, 0.8, 0], dir: 'in', speed: [0.2, 0.5], life: [1, 1.5],
      size: [0.06, 0.1], sizeEnd: 0, color: [HOT, MID], alpha: 0.85 }),
    // TERTIARY: a rose glow on the ground, its ripples drawn in to its middle
    L({ type: 'shape', form: 'disc', ramp: 'desire', main: 'ripple', mainK: 0.7, mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.05], tile: [3, 1], scroll: [0, -0.15], at: 0.05, dur: 1.6,
      scale: 2, offset: [0, 0.02, 0], glow: 0.9, core: 0, erode: [[0, 0.12], [0.5, 0.22], [1, 1]], rampShift: [[0, -0.05], [1, -0.32]], k: [[0, 0], [0.15, 0.65], [1, 0.65]], turn: 'random' }),
  ] },

  // Desire spilt: a pool that contracts and swells twice, a ripple out on each beat, droplets, motes drawn back into it
  'feeling.desire.splash': { layers: [
    // PRIMARY (its heart): the hot core on the first beat
    hotCore({ ramp: 'desire', at: 0.06, size: [0.25, 0.7], offset: [0, 0.15, 0] }),
    // PRIMARY: the pool, out, drawn in, out again bigger, its ripples running inward, eroding last
    L({ type: 'shape', form: 'disc', ramp: 'desire', main: 'noise', tile: [2, 1], scroll: [0, -0.2], mask: 'ripple', maskK: 0.6, maskTile: [5, 1], maskScroll: [0, -0.3], flow: 'noise', flowK: 0.04,
      dur: 2, scale: [[0, 0.4], [0.07, 1.1], [0.12, 0.85], [0.2, 1.3], [1, 1.4]], offset: [0, 0.02, 0], erode: [[0, 0], [0.5, 0.1], [1, 1]],
      rampShift: [[0, 0.05], [0.25, 0.04], [1, -0.32]], glow: 1.4, core: 0.3, turn: 'random' }),
    // SECONDARY: a ripple out over it on each beat
    beatRing(0.07, 1.6, 0.6), beatRing(0.25, 1.9, 0.7, 0.8),
    // SECONDARY: droplets thrown out a short way
    L({ type: 'sprites', count: [10, 14], shape: 'soft', dir: 'cone', axis: 'up', cone: 70, speed: [2, 3.2], gravity: 8, floor: 'ground', size: [0.06, 0.1], sizeEnd: 0.04, life: [0.5, 0.7], color: [HOT, MID] }),
    // TERTIARY: motes drawn back into the pool along the ground
    L({ type: 'sprites', at: 0.4, count: [10, 14], shape: 'soft', spawn: 'ring', r: 1.8, offset: [0, 0.15, 0], dir: 'in', speed: [0.6, 1], life: [1.1, 1.5],
      size: [0.06, 0.09], sizeEnd: 0, color: [HOT, MID], alpha: 0.85 }),
  ] },

  // Desire held round a body: a band of ripples breathing to a heartbeat (every 1.1 real s), a ring drawn in to the feet on the beat,
  // ribbons pulled in along the ground (calm: a slow pulse, never a flicker)
  'feeling.desire.aura': { layers: [
    // PRIMARY: a band of ripples round the body, breathing on the two beats, its ripples running down toward the ground
    L({ type: 'shape', form: 'band', ramp: 'desire', main: 'ripple', tile: [3, 2], scroll: [0, -0.25], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.3],
      dur: Infinity, loop: 1.1, scale: times(HEART, 0.72), stretch: [1, 2.2, 1], k: HEART_K, edgeV: [0.05, 0.65], rim: -0.6, erode: 0.14, glow: 1.5, core: 0.35, in: 3, out: 2 }),
    // SECONDARY: a ring drawn in to the feet on the beat
    L({ type: 'shape', form: 'ring', ramp: 'desire', main: 'ripple', tile: [10, 1], scroll: [0, -0.6], dur: Infinity, loop: 1.1, scale: [[0, 1.8], [0.3, 0.7], [1, 0.6]], offset: [0, 0.03, 0],
      k: [[0, 0], [0.1, 0.9], [0.3, 0.6], [0.5, 0], [1, 0]], erode: [[0, 0.1], [0.4, 0.2], [0.6, 0.8], [1, 1]], glow: 1.6, in: 3, out: 2 }),
    // SECONDARY: ribbons pulled in toward the feet along the ground
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'streak', spawn: 'ring', r: 2, offset: [0, 0.05, 0], dir: 'in', speed: [1.5, 2.2], stretch: 1.2, life: [0.8, 1],
      size: [0.08, 0.14], sizeEnd: 0.03, color: [HOT, MID] }),
    // TERTIARY: warm motes wrapping round the body, spiralling slowly down
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'soft', spawn: 'ring', r: 0.9, offset: [0, 1.1, 0], dir: 'swirl', lift: -0.3, speed: [0.3, 0.6], life: [1, 1.4],
      size: [0.05, 0.08], sizeEnd: 0, color: [HOT, MID], alpha: 0.85 }),
    // TERTIARY: a rose glow on the ground under it, its ripples drawn in
    L({ type: 'shape', form: 'disc', ramp: 'desire', main: 'ripple', mainK: 0.7, mask: 'noise', maskScroll: [0.02, 0.05], tile: [3, 1], scroll: [0, -0.12], dur: Infinity, scale: 1.2,
      offset: [0, 0.02, 0], glow: 0.7, core: 0, erode: 0.12, rampShift: -0.12, in: 2, out: 2 }),
  ] },

  // Desire held on a moving thing: a heart of ripples beating at its head, its wake drawn in after it, ripples left on the beat
  'feeling.desire.trail': { layers: [
    // PRIMARY: a heart of ripples at its head, beating twice every 0.9 real s
    L({ type: 'shape', form: 'sphere', ramp: 'desire', main: 'ripple', tile: [3, 2], scroll: [0, -0.5], dur: Infinity, loop: 0.9, scale: times(HEART, 0.16), k: HEART_K,
      rim: -0.5, glow: 2, core: 0.6, erode: 0.08, in: 8, out: 4 }),
    // SECONDARY: its wake drawn in toward the line it took
    L({ type: 'sprites', rate: 22, dur: Infinity, shape: 'soft', spawn: 'shell', r: 0.7, dir: 'in', speed: [1.2, 1.8], life: [0.35, 0.5], size: [0.05, 0.09], sizeEnd: 0.02, color: [HOT, MID] }),
    // SECONDARY: ripples left in the air behind it
    L({ type: 'sprites', rate: 2.4, dur: Infinity, shape: 'ringthin', size: 0.08, sizeEnd: 0.5, life: 0.4, color: MID, alpha: 0.85 }),
    // TERTIARY: warm motes hanging where it passed
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.2, dir: 'sphere', speed: [0.03, 0.1], life: [1, 1.4], size: [0.04, 0.07], sizeEnd: 0, color: HOT, alpha: 0.7 }),
  ] },

  // Desire awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): ribbons and a spiral pulled in from far off, then a
  // column of ripples that contracts and swells on two beats round the Courier, a ring out on each, and the heart beating twice again
  'feeling.desire.rise': { layers: [
    // SECONDARY (its gathering): ribbons pulled in from far off along the chest's height
    L({ type: 'sprites', count: [40, 48], shape: 'streak', spawn: 'ring', r: 5, offset: [0, 1.2, 0], dir: 'in', speed: [13, 15], stretch: 2, life: [0.3, 0.34],
      size: [0.15, 0.24], sizeEnd: 0.05, color: [HOT, MID, ROSE] }),
    // SECONDARY (its gathering): a spiral of ripples wound in round them
    L({ type: 'shape', form: 'spiral', rim: -0.7, ramp: 'desire', main: 'ripple', tile: [6, 1], scroll: [-0.8, 0], dur: 0.4, scale: [[0, 3.5], [1, 0.7]], stretch: [1, 2.6, 1], spin: 4,
      erode: [[0, 0.3], [0.2, 0.06], [1, 0.6]], rampShift: [[0, 0], [1, 0.05]], glow: 1.7 }),
    // PRIMARY (its heart): the hot core on the first beat
    hotCore({ ramp: 'desire', at: 0.3, size: [0.5, 1.6], offset: [0, 1, 0] }),
    // PRIMARY: a column of ripples round them that contracts, then swells on two beats, rising, its ripples running down it
    L({ type: 'shape', form: 'band', ramp: 'desire', main: 'ripple', tile: [3, 2], scroll: [0, -0.3], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.3], flow: 'noise', flowK: 0.04,
      at: 0.28, dur: 2.5, scale: [[0, 1.4], [0.04, 0.6], [0.08, 1.25], [0.12, 0.85], [0.17, 1.5], [1, 1.6]], stretch: [1, [[0, 1], [0.08, 3], [1, 4.4]], 1],
      edgeV: [0.03, 0.65], rim: -0.6, erode: [[0, 0], [0.45, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.2, 0.05], [1, -0.35]], glow: 2, core: 0.5 }),
    // PRIMARY: a dome breathing the two beats round their feet
    L({ type: 'shape', form: 'dome', ramp: 'desire', main: 'ripple', mainK: 0.6, tile: [5, 2], scroll: [0, -0.4], at: 0.28, dur: 1.6, scale: times(BEAT, 2.2),
      erode: [[0, 0], [0.4, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.32]], rim: 0.4, glow: 1.8, turn: 'random' }),
    // SECONDARY: a ring out across the ground on each beat, and the heart beating twice again, quieter, a second later
    beatRing(0.32, 6, 0.8), beatRing(0.52, 7, 0.9, 0.85), beatRing(1.3, 4, 0.8, 0.55), beatRing(1.48, 4.6, 0.9, 0.45),
    // SECONDARY: its light and a soft wash of its colour (the screen weight a rise earns, inside the budgets)
    L({ type: 'light', at: 0.3, color: MID, k: 26, range: 9, dur: 1.8, up: 1.4 }),
    L({ type: 'flash', at: 0.3, k: 0.15, color: HOT, dur: 0.5 }),
    // TERTIARY: warm motes drawn slowly in to them from all round
    L({ type: 'sprites', at: 0.6, count: [36, 44], shape: 'soft', spawn: 'ring', r: 3.2, offset: [0, 1.2, 0], dir: 'in', speed: [0.5, 1], life: [1.6, 2.2],
      size: [0.06, 0.1], sizeEnd: 0, color: [HOT, MID], alpha: 0.85 }),
    // TERTIARY: a rose haze on the ground round them, its ripples drawn in
    L({ type: 'shape', form: 'disc', ramp: 'desire', main: 'ripple', mainK: 0.7, mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.05], tile: [4, 1], scroll: [0, -0.12], at: 0.3, dur: 2.6,
      scale: 3, offset: [0, 0.02, 0], glow: 0.8, core: 0, erode: [[0, 0.15], [0.5, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.32]], k: [[0, 0], [0.12, 0.6], [1, 0.6]], turn: 'random' }),
  ] },

  // Desire drunk (at the Courier's chest: vfx/feelinglooks.js): ribbons and motes pulled in, a ring of ripples closing round them, taken
  // in on two beats
  'feeling.desire.drink': { layers: [
    // SECONDARY (its gathering): ribbons pulled in from all round, and motes after them
    L({ type: 'sprites', count: [16, 20], shape: 'streak', spawn: 'shell', r: 2.4, dir: 'in', speed: [4.5, 5.5], stretch: 1.5, life: [0.42, 0.48], size: [0.1, 0.16], sizeEnd: 0.03, color: [HOT, MID] }),
    L({ type: 'sprites', at: 0.08, count: [10, 14], shape: 'soft', spawn: 'shell', r: 1.8, dir: 'in', speed: [3, 3.6], life: [0.46, 0.52], size: [0.06, 0.1], sizeEnd: 0.02, color: [HOT, ROSE] }),
    // PRIMARY: a ring of ripples closing round them, facing the eye
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'desire', main: 'ripple', tile: [8, 1], scroll: [0, -0.8], dur: 0.5, scale: [[0, 1.6], [1, 0.28]],
      edgeV: [0.35, 0.35], erode: [[0, 0.25], [0.25, 0.05], [0.8, 0.1], [1, 1]], rampShift: [[0, -0.1], [0.8, 0.05], [1, -0.1]], glow: 1.6, turn: 'random' }),
    // PRIMARY (taken in): the hot core as it reaches them
    hotCore({ ramp: 'desire', at: 0.48, size: [0.35, 0.2], offset: [0, 0, 0] }),
    // TERTIARY: the glow it leaves in them, beating twice
    L({ type: 'shape', form: 'sphere', ramp: 'desire', main: 'ripple', tile: [3, 2], scroll: [0, -0.4], at: 0.5, dur: 0.55, scale: [[0, 0.2], [0.15, 0.42], [0.3, 0.3], [0.45, 0.48], [1, 0.4]],
      rim: -0.5, glow: 1.4, erode: [[0, 0.1], [0.5, 0.15], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], turn: 'random' }),
    // TERTIARY: warm motes drawn in after it
    L({ type: 'sprites', at: 0.6, count: [6, 8], shape: 'soft', spawn: 'sphere', r: 0.6, dir: 'in', speed: [0.2, 0.4], life: [0.7, 0.9], size: [0.04, 0.07], sizeEnd: 0, color: HOT, alpha: 0.8 }),
  ] },

  // 83 Desire, the lure (vfx/shelllooks.js: at the point, held for its dur, `r` its pull): Desire's burst where it lands, then rings
  // drawn in along the ground to a heartbeat, a dome of ripples breathing at the point, motes pulled in from its reach
  'shell.desire.land': { extends: 'feeling.desire.burst', layers: [
    // PRIMARY (held): the lure's heart, a dome of ripples breathing on the two beats every 1.2 real s
    L({ type: 'shape', form: 'dome', ramp: 'desire', main: 'ripple', mainK: 0.65, tile: [4, 2], scroll: [0, -0.35], mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, -0.15],
      dur: Infinity, loop: 1.2, scale: times(HEART, 1.1), k: HEART_K, erode: 0.14, rim: 0.4, glow: 1.5, core: 0.3, in: 3, out: 1.5 }),
    // SECONDARY (held): rings drawn in along the ground from its reach, two a beat apart, each every 1.2 real s
    ...[0, 0.6].map((at) => L({ type: 'shape', form: 'ring', ramp: 'desire', main: 'ripple', tile: [24, 1], scroll: [0, -0.8], at, dur: Infinity, loop: 1.2, scale: [[0, 7], [0.6, 0.8], [1, 0.5]],
      offset: [0, 0.04, 0], edgeV: [0.4, 0.2], k: [[0, 0], [0.12, 1], [0.6, 0.8], [0.8, 0], [1, 0]], erode: [[0, 0.1], [0.7, 0.2], [1, 1]], glow: 1.6, in: 3, out: 1.5 })),
    // TERTIARY: motes pulled in from its reach
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', spawn: 'shell', r: 'r', dir: 'in', speed: [3, 5], size: [0.1, 0.16], sizeEnd: 0.04, life: [1, 1.4], color: [MID, HOT], alpha: 0.8 }),
  ] },
};
