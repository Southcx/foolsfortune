// ---------------------------------------------------------------------------------------
// MIRTH'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('mirth', anchored on
// progress/weather.js COLOR.mirth), its paint motif as the pattern (dots), and its motion: BOUNCY, POPPING, IN STEPS. Its rings pop out
// one after another, its shapes squash and stretch as they land, and its small things hop (gravity and a hop) and hop again where they
// come down. Six moments and its caster shell's landing (TYPE-82, the pratfall), each in three tiers as vfx/library/kitdemo.js lays
// them: PRIMARY the hero shape, SECONDARY what moves round it, TERTIARY what lingers.
//
// Prior art (a museum label): Legend of Mana (Square, 1999; battle and effects Hiroshi Takai), Matsumoto's "more colorful and cheerful
// touch": colour and squash on the small parts, not more particles; Chrono Cross (Square, 1999), the jokes put in its techniques to set
// it apart; The World Ends with You (Jupiter / Square Enix, 2007), Ohdachi's psych pins mixing pop art and tribal: dots with a graphic
// edge, not confetti (docs/ref/VFX-PRIOR-ART.md 1.1, 1.7, 1.13, 3.2).
//
//   MIRTH_EFFECTS   'feeling.mirth.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.mirth.land'
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramp's own stops, vfx/shapes/ramps.js 'mirth', as hex; the dots in its golds and creams, never another feeling's)
const MID = COLOR.mirth, HOT = 0xfff0c0, DOTS = [COLOR.mirth, 0xfff0c0, 0xffd76a, 0xffb040];
// (a squash and stretch as a thing lands: wide and low, then tall, then settled; x and z, then y)
const SQ_XZ = [[0, 0.5], [0.12, 1.3], [0.24, 0.92], [0.36, 1.08], [0.5, 1], [1, 1.05]], SQ_Y = [[0, 1.6], [0.12, 0.6], [0.24, 1.15], [0.36, 0.92], [0.5, 1], [1, 0.95]];
/** A ring of dots popping out once, `at` real s in, to `s` m: its steps are several of these one after another. */
const popRing = (at, s, k = 1) => L({ type: 'shape', form: 'ring', ramp: 'mirth', main: 'dots', tile: [12, 1], scroll: [0, 0.8], at, dur: 0.3, scale: [[0, s * 0.4], [0.35, s * 1.05], [1, s * 1.15]],
  offset: [0, 0.03, 0], edgeV: [0.4, 0.4], erode: [[0, 0], [0.5, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.25]], k: [[0, 0.5 * k], [0.06, k], [1, k]], glow: 1.8, turn: 'random' });
/** The hop a dot makes where it came down: a short one up from the ground round the first hop's reach, `at` real s in. */
const reHop = (at, r, n) => L({ type: 'sprites', at, count: n, shape: 'disc', spawn: 'disc', r, delay: [0, 0.15], dir: 'cone', axis: 'up', cone: 25, speed: [1.8, 2.6], gravity: 14,
  floor: 'ground', size: [0.07, 0.11], life: [0.35, 0.45], color: DOTS });

export const MIRTH_EFFECTS = {
  // a burst of Mirth: a dome of dots that lands with a squash and a stretch, rings popping out in steps, dots hopping out and hopping again
  'feeling.mirth.burst': { layers: [
    // PRIMARY (its heart): the hot core, a tenth of a second
    hotCore({ ramp: 'mirth', size: [0.3, 1], offset: [0, 0.45, 0] }),
    // PRIMARY: a dome of dots that pops up squashed, springs tall, and settles, eroding through its dots as it cools
    L({ type: 'shape', form: 'dome', ramp: 'mirth', main: 'dots', mainK: 0.6, tile: [6, 3], scroll: [0.05, -0.3], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.2],
      dur: 0.8, scale: [[0, 0.6], [0.15, 1.4], [1, 1.6]], stretch: [SQ_XZ, SQ_Y, SQ_XZ], erode: [[0, 0], [0.45, 0.06], [1, 1]],
      rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.32]], rim: 0.4, glow: 2, core: 0.6, turn: 'random' }),
    // SECONDARY: rings of dots popping out in three steps, each wider
    popRing(0, 1.2), popRing(0.11, 2), popRing(0.22, 2.8, 0.8),
    // SECONDARY: dots thrown up in a hop, coming down round it ...
    L({ type: 'sprites', count: [16, 20], shape: 'disc', dir: 'cone', axis: 'up', cone: 55, speed: [4, 6.5], gravity: 14, drag: 0.3, floor: 'ground',
      size: [0.08, 0.13], life: [0.75, 1], color: DOTS }),
    // ... and hopping again, smaller, where they landed
    reHop(0.42, 2.2, [12, 16]),
    // TERTIARY: little pops in the air after it
    L({ type: 'sprites', at: 0.2, count: [6, 9], shape: 'ringthin', spawn: 'sphere', r: 1.1, offset: [0, 0.8, 0], delay: [0, 0.5], size: 0.05, sizeEnd: 0.45, life: 0.22, color: HOT, alpha: 0.9 }),
    // TERTIARY: dots bubbling up off the ground, shrinking away
    L({ type: 'sprites', at: 0.3, count: [10, 14], shape: 'disc', spawn: 'disc', r: 1.2, dir: 'up', speed: [0.6, 1.2], gravity: -0.4,
      size: [0.04, 0.07], sizeEnd: 0, life: [0.9, 1.3], color: HOT, alpha: 0.8 }),
  ] },

  // Mirth spilt: a pool that wobbles as it lands, droplets hopping out and again, pops on its surface one after another
  'feeling.mirth.splash': { layers: [
    // PRIMARY (its heart): the hot core where it struck
    hotCore({ ramp: 'mirth', size: [0.25, 0.7], offset: [0, 0.15, 0] }),
    // PRIMARY: the pool, bouncing out to its size and settling, its dots drifting, eroding last from its rim
    L({ type: 'shape', form: 'disc', ramp: 'mirth', main: 'dots', mainK: 0.55, tile: [5, 2], scroll: [0.03, 0.15], mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.08],
      dur: 1.8, scale: [[0, 0.3], [0.1, 1.25], [0.2, 0.95], [0.3, 1.12], [0.42, 1.02], [1, 1.1]], offset: [0, 0.02, 0], erode: [[0, 0], [0.5, 0.1], [1, 1]],
      rampShift: [[0, 0.05], [0.25, 0.04], [1, -0.32]], glow: 1.5, core: 0.3, turn: 'random' }),
    // SECONDARY: a ring popping off its edge as it lands
    popRing(0.05, 1.6),
    // SECONDARY: droplets hopping out of it, and hopping again
    L({ type: 'sprites', count: [10, 14], shape: 'disc', dir: 'cone', axis: 'up', cone: 60, speed: [3, 4.5], gravity: 14, floor: 'ground', size: [0.07, 0.11], life: [0.6, 0.8], color: DOTS }),
    reHop(0.35, 1.4, [8, 10]),
    // TERTIARY: pops on its surface, one after another
    L({ type: 'sprites', at: 0.15, count: [8, 12], shape: 'ringthin', spawn: 'disc', r: 1, offset: [0, 0.05, 0], delay: [0, 1], size: 0.05, sizeEnd: 0.35, life: 0.25, color: HOT, alpha: 0.85 }),
  ] },

  // Mirth held round a body: a band of dots bobbing on a spring, a ring popping at the feet, dots hopping off and landing (calm enough)
  'feeling.mirth.aura': { layers: [
    // PRIMARY: a band of dots round the body, bobbing a little on a spring every 0.7 real s, its top dissolving through a noise mask
    L({ type: 'shape', form: 'band', ramp: 'mirth', main: 'dots', tile: [6, 2], scroll: [0.04, 0.35], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.4],
      dur: Infinity, loop: 0.7, scale: 0.72, stretch: [[[0, 1], [0.15, 1.06], [0.3, 0.98], [0.45, 1.02], [1, 1]], [[0, 2.2], [0.15, 2.05], [0.3, 2.3], [0.45, 2.18], [1, 2.2]], [[0, 1], [0.15, 1.06], [0.3, 0.98], [0.45, 1.02], [1, 1]]],
      edgeV: [0.05, 0.65], rim: -0.6, erode: 0.14, glow: 1.5, core: 0.3, in: 3, out: 2 }),
    // SECONDARY: a ring of dots popping out at the feet, once every 1.2 real s
    L({ type: 'shape', form: 'ring', ramp: 'mirth', main: 'dots', tile: [10, 1], scroll: [0, 0.5], dur: Infinity, loop: 1.2, scale: [[0, 0.5], [0.12, 1.1], [0.3, 1.2], [1, 1.25]], offset: [0, 0.03, 0],
      k: [[0, 0], [0.08, 1], [0.35, 0.5], [0.6, 0], [1, 0]], erode: [[0, 0], [0.3, 0.1], [0.6, 0.6], [1, 1]], glow: 1.6, in: 3, out: 2 }),
    // SECONDARY: dots hopping up off the body and landing round the feet
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'disc', spawn: 'ring', r: 0.55, offset: [0, 0.3, 0], dir: 'cone', axis: 'up', cone: 35, speed: [2, 3], gravity: 9, floor: 'ground',
      size: [0.05, 0.09], life: [0.55, 0.75], color: DOTS }),
    // TERTIARY: little dots bubbling up round it, shrinking away
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'disc', spawn: 'ring', r: 0.7, dir: 'up', speed: [0.4, 0.8], gravity: -0.3, size: [0.04, 0.06], sizeEnd: 0, life: [1, 1.4], color: HOT, alpha: 0.8 }),
    // TERTIARY: a warm glow pooled on the ground under it
    L({ type: 'shape', form: 'disc', ramp: 'mirth', main: 'dots', mainK: 0.7, mask: 'noise', maskScroll: [0.02, 0.05], tile: [4, 1], scroll: [0.02, 0.1], dur: Infinity, scale: 1.1,
      offset: [0, 0.02, 0], glow: 0.7, core: 0, erode: 0.12, rampShift: -0.12, in: 2, out: 2 }),
  ] },

  // Mirth held on a moving thing: a head of dots bobbing as it goes, dots hopping off its path, pops left behind
  'feeling.mirth.trail': { layers: [
    // PRIMARY: a ball of dots at its head, squashing and stretching every half a real second
    L({ type: 'shape', form: 'sphere', ramp: 'mirth', main: 'dots', tile: [4, 2], scroll: [0.2, 0.3], dur: Infinity, loop: 0.5, scale: 0.16,
      stretch: [[[0, 1], [0.25, 1.15], [0.5, 0.92], [1, 1]], [[0, 1], [0.25, 0.85], [0.5, 1.1], [1, 1]], [[0, 1], [0.25, 1.15], [0.5, 0.92], [1, 1]]], rim: -0.5, glow: 2, core: 0.5, erode: 0.08, in: 8, out: 4 }),
    // SECONDARY: dots hopping off its path and landing behind it
    L({ type: 'sprites', rate: 18, dur: Infinity, shape: 'disc', spawn: 'sphere', r: 0.1, dir: 'cone', axis: 'up', cone: 50, speed: [1.5, 2.8], gravity: 10, floor: 'ground',
      size: [0.05, 0.09], life: [0.5, 0.8], color: DOTS }),
    // SECONDARY: pops left in the air behind it
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'ringthin', spawn: 'sphere', r: 0.15, size: 0.04, sizeEnd: 0.3, life: 0.25, color: HOT, alpha: 0.85 }),
    // TERTIARY: small dots bubbling up in its wake
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'disc', spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.3, 0.7], gravity: -0.3, size: 0.04, sizeEnd: 0, life: [0.8, 1.1], color: HOT, alpha: 0.8 }),
  ] },

  // Mirth awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): rings closing in three steps, then a column of dots
  // springing up in four steps round the Courier, a dome bouncing, rings popping out one after another, dots hopping and hopping again
  'feeling.mirth.rise': { layers: [
    // SECONDARY (its gathering): rings popping in on their feet in three steps
    ...[[0, 3.4], [0.1, 2.4], [0.2, 1.4]].map(([at, s]) => L({ type: 'shape', form: 'ring', ramp: 'mirth', main: 'dots', tile: [12, 1], scroll: [0, -0.8], at, dur: 0.14, scale: [[0, s], [1, s * 0.55]],
      offset: [0, 0.03, 0], edgeV: [0.4, 0.4], erode: [[0, 0], [0.6, 0.1], [1, 0.7]], rampShift: [[0, 0], [1, 0.05]], glow: 1.7, turn: 'random' })),
    // SECONDARY (its gathering): dots drawn in along the ground
    L({ type: 'sprites', count: [18, 24], shape: 'disc', spawn: 'ring', r: 3, offset: [0, 0.1, 0], dir: 'in', speed: [9, 10], life: [0.24, 0.28], size: [0.08, 0.12], color: DOTS }),
    // PRIMARY (its heart): the hot core as it springs up
    hotCore({ ramp: 'mirth', at: 0.3, size: [0.5, 1.6], offset: [0, 1, 0] }),
    // PRIMARY: a column of dots springing up round them in four steps, each a pop, held at its height, eroding through its dots
    L({ type: 'shape', form: 'band', ramp: 'mirth', main: 'dots', tile: [5, 3], scroll: [0.05, 0.5], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.4], at: 0.3, dur: 2.4,
      scale: [[0, 0.5], [0.06, 1.1], [1, 1.2]], stretch: [1, [[0, 0.3], [0.06, 1.4], [0.14, 1.4], [0.2, 2.6], [0.28, 2.6], [0.34, 3.8], [0.42, 3.8], [0.48, 5], [1, 5.3]], 1],
      edgeV: [0.03, 0.6], rim: -0.6, erode: [[0, 0], [0.45, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.2, 0.05], [1, -0.35]], glow: 2, core: 0.5 }),
    // PRIMARY: a dome of dots bouncing out round their feet, squashed, sprung, settled
    L({ type: 'shape', form: 'dome', ramp: 'mirth', main: 'dots', mainK: 0.6, tile: [8, 3], scroll: [0.05, -0.3], at: 0.3, dur: 1.4, scale: [[0, 0.8], [0.12, 2.2], [1, 2.6]],
      stretch: [SQ_XZ, SQ_Y, SQ_XZ], erode: [[0, 0], [0.4, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.32]], rim: 0.4, glow: 1.8, turn: 'random' }),
    // SECONDARY: rings of dots popping out in four steps, each wider
    popRing(0.32, 2), popRing(0.46, 3), popRing(0.6, 4, 0.85), popRing(0.74, 5, 0.7),
    // SECONDARY: dots thrown up in a hop, and hopping again where they come down
    L({ type: 'sprites', at: 0.32, count: [30, 36], shape: 'disc', dir: 'cone', axis: 'up', cone: 50, speed: [5, 8], gravity: 14, floor: 'ground', size: [0.08, 0.13], life: [0.9, 1.1], color: DOTS }),
    reHop(0.85, 3, [20, 26]),
    // SECONDARY: its light and a soft wash of its colour (the screen weight a rise earns, inside the budgets)
    L({ type: 'light', at: 0.3, color: MID, k: 24, range: 9, dur: 1.4, up: 1.4 }),
    L({ type: 'flash', at: 0.3, k: 0.16, color: HOT, dur: 0.45 }),
    // TERTIARY: dots drifting down round them like confetti, landing and lying a breath
    L({ type: 'sprites', at: 0.5, count: [30, 40], shape: 'disc', spawn: 'disc', r: 2.5, offset: [0, 3.5, 0], dir: 'up', speed: [-0.6, -0.3], drag: 0.5, gravity: 0.6, floor: 'ground',
      size: [0.05, 0.08], life: [1.6, 2.3], color: DOTS, alpha: 0.9 }),
    // TERTIARY: dots bubbling up off the ground, shrinking away
    L({ type: 'sprites', at: 0.6, count: [16, 20], shape: 'disc', spawn: 'disc', r: 1.5, dir: 'up', speed: [0.6, 1.2], gravity: -0.4, size: [0.04, 0.07], sizeEnd: 0, life: [1.2, 1.8], color: HOT, alpha: 0.8 }),
    // TERTIARY: a warm glow of dots pooled on the ground round them
    L({ type: 'shape', form: 'disc', ramp: 'mirth', main: 'dots', mainK: 0.7, mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.05], tile: [6, 1], scroll: [0.02, 0.08], at: 0.3, dur: 2.6,
      scale: 2.5, offset: [0, 0.02, 0], glow: 0.8, core: 0, erode: [[0, 0.15], [0.5, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.32]], k: [[0, 0], [0.12, 0.6], [1, 0.6]], turn: 'random' }),
  ] },

  // Mirth drunk (at the Courier's chest: vfx/feelinglooks.js): dots hopping in toward them in three steps, a ring closing in steps,
  // taken in with a pop and a bounce, a couple of dots hopping off after
  'feeling.mirth.drink': { layers: [
    // SECONDARY (its gathering): dots hopping in, a wave a step, each nearer
    ...[[0, 2.2], [0.17, 1.5], [0.34, 0.9]].map(([at, r]) => L({ type: 'sprites', at, count: [8, 10], shape: 'disc', spawn: 'shell', r, dir: 'in', speed: 3.8, life: 0.16, size: [0.07, 0.11], color: DOTS })),
    // PRIMARY: a ring of dots closing round them in steps, facing the eye
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'mirth', main: 'dots', tile: [10, 1], scroll: [0, -0.6], dur: 0.52,
      scale: [[0, 1.7], [0.1, 1.7], [0.3, 1.15], [0.4, 1.15], [0.62, 0.6], [0.72, 0.6], [1, 0.3]], edgeV: [0.35, 0.35], erode: [[0, 0.2], [0.2, 0.05], [0.85, 0.1], [1, 1]],
      rampShift: [[0, -0.05], [0.85, 0.05], [1, -0.1]], glow: 1.6, turn: 'random' }),
    // PRIMARY (taken in): the hot core as it reaches them, and a pop out of it
    hotCore({ ramp: 'mirth', at: 0.52, size: [0.4, 0.2], offset: [0, 0, 0] }),
    L({ type: 'sprites', at: 0.55, count: 1, shape: 'ringthin', size: 0.1, sizeEnd: 0.8, life: 0.2, color: HOT }),
    // TERTIARY: the glow it leaves in them, bouncing once
    L({ type: 'shape', form: 'sphere', ramp: 'mirth', main: 'dots', tile: [4, 2], scroll: [0.1, 0.2], at: 0.56, dur: 0.45, scale: [[0, 0.5], [0.25, 0.32], [0.5, 0.42], [1, 0.38]],
      rim: -0.5, glow: 1.4, erode: [[0, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], turn: 'random' }),
    // TERTIARY: a couple of dots hopping off them after
    L({ type: 'sprites', at: 0.6, count: [5, 7], shape: 'disc', dir: 'cone', axis: 'up', cone: 40, speed: [1.5, 2.2], gravity: 9, floor: 'ground', size: [0.05, 0.08], life: 0.5, color: DOTS }),
  ] },

  // 82 Mirth, the pratfall (vfx/shelllooks.js: at the point, once): Mirth's burst where it lands, its rings stepping out wider, and
  // confetti of its dots thrown up over everything it stuns
  'shell.mirth.land': { extends: 'feeling.mirth.burst', layers: [
    // SECONDARY: two more rings stepping out to the edge of its reach
    popRing(0.33, 4.5, 0.8), popRing(0.44, 6, 0.6),
    // TERTIARY: confetti in Mirth's dots, thrown up and coming down over it
    L({ type: 'sprites', pool: 'alpha', count: 60, shape: 'disc', dir: 'cone', axis: 'up', cone: 55, speed: [4, 8], size: [0.07, 0.11], life: [1.6, 2.4], drag: 1.4, gravity: 5,
      color: DOTS, spin: [-6, 6], floor: 'ground', powerCount: false }),
  ] },
};
