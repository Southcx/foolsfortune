// ---------------------------------------------------------------------------------------
// WONDER'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('wonder', anchored on
// progress/weather.js COLOR.wonder), its paint motif as the pattern (frost), and its motion: SLOW, RISING, HUSHED. Needles of frost grow
// at an edge, everything lifts a little slower than the other six, and the diamond dust outlives every burst (glints go last). Six
// moments and its caster shell's landing (TYPE-81, the vantage), each in three tiers as vfx/library/kitdemo.js lays them: PRIMARY the
// hero shape, SECONDARY what moves round it, TERTIARY what lingers.
//
// Prior art (a museum label): Chrono Cross (Square, 1999; art direction Yasuyuki Honne), its White element, light and cosmos, set
// across the wheel from Black; Bahamut Lagoon (Square, 1996), Sasaki's floating lagoons from a flight over Izu: a vantage first, height
// before particles, so the rise is a column; Kevin Leroy's fade order for a hit (Riot; 80.lv, 2017): the flare first, sparks next, the
// glints last (docs/ref/VFX-PRIOR-ART.md 1.1, 1.16, 2.2, 3.2).
//
//   WONDER_EFFECTS   'feeling.wonder.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.wonder.land' (held)
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramp's own stops, vfx/shapes/ramps.js 'wonder', as hex: a sprite cannot read a ramp by name)
const DEEP = 0x0e6a78, MID = COLOR.wonder, HOT = 0x9ff2ff, DUST = [0xffffff, 0xe4faff, 0xbfe8ff];

export const WONDER_EFFECTS = {
  // a burst of Wonder: a dome of frost blooming slowly up, needles growing at its edge, a hushed ring, and diamond dust that stays
  'feeling.wonder.burst': { layers: [
    // PRIMARY (its heart): the hot core, a tenth of a second
    hotCore({ ramp: 'wonder', size: [0.3, 0.9], offset: [0, 0.5, 0] }),
    // PRIMARY: a dome of frost blooming slowly up and out of the ground, the frost creeping toward its crown, eroding through it as it cools
    L({ type: 'shape', form: 'dome', ramp: 'wonder', main: 'frost', mainK: 0.6, tile: [4, 2], scroll: [0.02, -0.25], mask: 'noise', maskTile: [2, 1], maskScroll: [0, -0.15],
      dur: 1.1, scale: [[0, 0.5], [0.35, 1.5], [1, 1.9]], stretch: [1, [[0, 0.4], [0.4, 1.1], [1, 1.25]], 1], erode: [[0, 0], [0.4, 0.05], [1, 1]],
      rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.35]], rim: 0.4, glow: 1.9, core: 0.5, turn: 'random' }),
    // PRIMARY (its edge): crystalline needles growing up round it, slowly, from the ground
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'wonder', main: 'frost', mainK: 0.5, tile: [1, 2], scroll: [0, 0.4], dur: 1.2, scale: 1.25,
      stretch: [1, [[0, 0.05], [0.45, 0.8], [1, 0.9]], 1], erode: [[0, 0], [0.55, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.7, turn: 'random' }),
    // SECONDARY: a hushed ring sliding out along the ground, its frost running outward
    L({ type: 'shape', form: 'ring', ramp: 'wonder', main: 'frost', tile: [8, 1], scroll: [0, 0.5], dur: 0.9, scale: [[0, 0.6], [1, 2.8]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.2], erode: [[0, 0], [0.4, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.6, turn: 'random' }),
    // SECONDARY: glints lifted slowly off it, rising as they slow
    L({ type: 'sprites', count: [14, 18], shape: 'sparkle', spawn: 'sphere', r: 0.5, offset: [0, 0.5, 0], dir: 'cone', axis: 'up', cone: 65, speed: [1, 2.5], drag: 2.5, gravity: -0.6,
      size: [0.1, 0.18], sizeEnd: 0.02, life: [0.6, 1], color: [HOT, 0xffffff], colorEnd: MID, twinkle: 6 }),
    // TERTIARY: diamond dust hanging in the air, last to go: it outlives the burst by twice its length
    L({ type: 'sprites', at: 0.15, count: [26, 32], shape: 'glint', spawn: 'sphere', r: 1.6, offset: [0, 0.9, 0], dir: 'up', speed: [0.05, 0.25], gravity: -0.12, drag: 0.6,
      size: [0.1, 0.2], sizeEnd: 0, life: [1.8, 2.8], color: DUST, alpha: 0.9, twinkle: 5 }),
    // TERTIARY: a cold breath laid on the ground, its frost eroding last
    L({ type: 'shape', form: 'disc', ramp: 'wonder', main: 'frost', mainK: 0.7, mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.05], tile: [3, 1], scroll: [0.01, 0.06], at: 0.1, dur: 2.2,
      scale: 1.9, offset: [0, 0.02, 0], glow: 0.8, core: 0, erode: [[0, 0.15], [0.5, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.32]], k: [[0, 0], [0.2, 0.6], [1, 0.6]], turn: 'random' }),
  ] },

  // Wonder spilt: a pool that spreads and freezes over, a crown of it, frost needles round its rim, and glints rising off it
  'feeling.wonder.splash': { layers: [
    // PRIMARY (its heart): the hot core where it struck the ground
    hotCore({ ramp: 'wonder', size: [0.25, 0.7], offset: [0, 0.15, 0] }),
    // PRIMARY: the pool spreading, the frost growing over its liquid, eroding last from its rim
    L({ type: 'shape', form: 'disc', ramp: 'wonder', main: 'noise', tile: [2, 1], scroll: [0.03, 0.1], mask: 'frost', maskK: 0.6, maskTile: [4, 2], maskScroll: [0, 0.02], flow: 'noise', flowK: 0.04,
      dur: 2.4, scale: [[0, 0.3], [0.12, 1.1], [0.3, 1.35], [1, 1.45]], offset: [0, 0.02, 0], erode: [[0, 0], [0.5, 0.12], [1, 1]],
      rampShift: [[0, 0.05], [0.25, 0.02], [1, -0.32]], glow: 1.4, core: 0.3, turn: 'random' }),
    // PRIMARY (its crown): a low wall of it thrown up round the strike and settling, its streaks running up
    L({ type: 'shape', form: 'band', rim: -0.6, ramp: 'wonder', main: 'streaks', mainK: 0.55, tile: [10, 1], scroll: [0, 1], dur: 0.55, scale: [[0, 0.3], [1, 1.2]], stretch: [1, [[0, 0.05], [0.3, 0.45], [1, 0.1]], 1],
      edgeV: [0.05, 0.7], erode: [[0, 0], [0.3, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.8, turn: 'random' }),
    // SECONDARY: droplets thrown low and slow, landing round it
    L({ type: 'sprites', count: [12, 16], shape: 'soft', dir: 'cone', axis: 'up', cone: 60, speed: [2, 3.5], gravity: 7, drag: 0.8, floor: 'ground',
      size: [0.06, 0.1], sizeEnd: 0.04, life: [0.7, 1], color: [HOT, MID], alpha: 0.95 }),
    // SECONDARY: needles of frost crystallising round the pool's rim
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'wonder', main: 'frost', mainK: 0.5, tile: [1, 2], scroll: [0, 0.2], at: 0.2, dur: 1.6, scale: 1.25,
      stretch: [1, [[0, 0], [0.5, 0.35], [1, 0.35]], 1], erode: [[0, 0], [0.6, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.5, turn: 'random' }),
    // TERTIARY: glints rising off the frozen pool, slow
    L({ type: 'sprites', at: 0.3, count: [10, 14], shape: 'sparkle', spawn: 'disc', r: 1.2, dir: 'up', speed: [0.1, 0.35], gravity: -0.1,
      size: [0.08, 0.15], sizeEnd: 0, life: [1.4, 2.2], color: DUST, alpha: 0.9, twinkle: 5 }),
  ] },

  // Wonder held round a body: a slow wall of frost lifting, a crown of needles at the feet, diamond dust rising (calm: it stands beside play)
  'feeling.wonder.aura': { layers: [
    // PRIMARY: a band of frost round the body, lifting slowly, its top dissolving through a noise mask, a breath of shimmer in it
    L({ type: 'shape', form: 'band', ramp: 'wonder', main: 'frost', mainK: 0.65, tile: [3, 1], scroll: [0.015, 0.18], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.3], flow: 'noise', flowK: 0.03,
      dur: Infinity, scale: 0.72, stretch: [1, 2.3, 1], edgeV: [0.05, 0.7], rim: -0.6, erode: 0.14, glow: 1.4, core: 0.3, in: 3, out: 2 }),
    // PRIMARY (its inner wall): thin rays, slower, turning the other way
    L({ type: 'shape', form: 'band', rim: -0.6, ramp: 'wonder', main: 'rays', tile: [5, 1], scroll: [-0.02, 0.12], dur: Infinity, scale: 0.52, stretch: [1, 1.9, 1], spin: -0.25,
      edgeV: [0.05, 0.6], erode: 0.2, glow: 1.2, core: 0.2, in: 3, out: 2 }),
    // SECONDARY: a crown of frost needles at the feet, turning barely
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'wonder', main: 'frost', tile: [1, 2], scroll: [0, 0.1], dur: Infinity, scale: 0.75, stretch: [1, 0.32, 1], spin: 0.08,
      erode: 0.25, glow: 1.3, in: 2, out: 2 }),
    // TERTIARY: diamond dust rising slowly round it
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'glint', spawn: 'ring', r: 0.8, dir: 'up', speed: [0.15, 0.4], gravity: -0.1,
      size: [0.08, 0.14], sizeEnd: 0, life: [1.6, 2.4], color: DUST, alpha: 0.85, twinkle: 4 }),
    // TERTIARY: a cold glow pooled on the ground under it
    L({ type: 'shape', form: 'disc', ramp: 'wonder', main: 'frost', mainK: 0.6, mask: 'noise', maskScroll: [0.02, 0.06], tile: [3, 1], scroll: [0.01, 0.05], dur: Infinity, scale: 1.2,
      offset: [0, 0.02, 0], glow: 0.7, core: 0, erode: 0.12, rampShift: -0.12, in: 2, out: 2 }),
  ] },

  // Wonder held on a moving thing: a cold star at its head, frost motes left hanging and lifting, diamond dust in its wake
  'feeling.wonder.trail': { layers: [
    // PRIMARY: a small star of frost at its head
    L({ type: 'shape', form: 'sphere', ramp: 'wonder', main: 'frost', tile: [3, 2], scroll: [0.1, 0.3], dur: Infinity, scale: 0.16, rim: -0.5, glow: 2, core: 0.6, erode: 0.08, in: 8, out: 4 }),
    // SECONDARY: frost motes shed as it goes, barely moving, lifting as they are left
    L({ type: 'sprites', rate: 24, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.12, dir: 'sphere', speed: [0.1, 0.4], drag: 1.5, gravity: -0.25,
      size: [0.06, 0.12], sizeEnd: 0.01, life: [0.7, 1.1], color: [HOT, MID], twinkle: 5 }),
    // TERTIARY: diamond dust hanging in its wake, long after it has passed
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'glint', spawn: 'sphere', r: 0.25, dir: 'up', speed: [0.03, 0.12], gravity: -0.06,
      size: [0.07, 0.12], sizeEnd: 0, life: [1.6, 2.4], color: DUST, alpha: 0.8, twinkle: 4 }),
    // TERTIARY: a breath of cold mist behind it
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.1, dir: 'sphere', speed: [0.05, 0.15], size: [0.3, 0.45], sizeEnd: 0.8,
      life: [0.8, 1.2], color: MID, colorEnd: DEEP, alpha: 0.18 }),
  ] },

  // Wonder awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): motes gathered in, then a column of frost lifting out of
  // the ground round the Courier, slow, needles growing round their feet, rings drifting out, and the dust hanging longest of all
  'feeling.wonder.rise': { layers: [
    // SECONDARY (its gathering): motes drawn in from all round, a third of a second before it lifts
    L({ type: 'sprites', count: [36, 44], shape: 'sparkle', spawn: 'shell', r: 3.6, offset: [0, 1.1, 0], dir: 'in', speed: [8, 9], life: [0.3, 0.36],
      size: [0.09, 0.15], sizeEnd: 0.04, color: [HOT, 0xffffff], colorEnd: MID }),
    // SECONDARY (its gathering): a ring of frost closing on their feet
    L({ type: 'shape', form: 'ring', ramp: 'wonder', main: 'frost', tile: [8, 1], scroll: [0, -0.6], dur: 0.36, scale: [[0, 3.8], [1, 0.5]], offset: [0, 0.03, 0],
      edgeV: [0.3, 0.3], erode: [[0, 0.3], [0.3, 0.05], [1, 0.4]], rampShift: [[0, -0.1], [1, 0.05]], k: [[0, 0], [0.3, 1], [1, 1]], glow: 1.6, turn: 'random' }),
    // PRIMARY (its heart): the hot core as it lifts
    hotCore({ ramp: 'wonder', at: 0.34, size: [0.5, 1.6], offset: [0, 1, 0] }),
    // PRIMARY: the column of frost lifting slowly out of the ground, taller than a house by its end, the frost running up it
    L({ type: 'shape', form: 'band', ramp: 'wonder', main: 'frost', mainK: 0.6, tile: [3, 1], scroll: [0.02, 0.35], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.4], flow: 'noise', flowK: 0.04,
      at: 0.32, dur: 2.6, scale: [[0, 0.5], [0.15, 1], [1, 1.25]], stretch: [1, [[0, 0.2], [0.35, 4.5], [1, 6]], 1], edgeV: [0.03, 0.7], rim: -0.6,
      erode: [[0, 0], [0.4, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.2, 0.05], [1, -0.35]], glow: 2, core: 0.5 }),
    // PRIMARY (its edge): needles of frost growing tall round their feet, slowly
    L({ type: 'shape', form: 'spikes', rim: -0.45, ramp: 'wonder', main: 'frost', mainK: 0.5, tile: [1, 2], scroll: [0, 0.3], at: 0.34, dur: 2.4, scale: 1.9,
      stretch: [1, [[0, 0], [0.25, 1.1], [1, 1.25]], 1], erode: [[0, 0], [0.5, 0.06], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.8, turn: 'random' }),
    // SECONDARY: a spiral of frost unwinding up the column
    L({ type: 'shape', form: 'spiral', rim: -0.7, ramp: 'wonder', main: 'frost', tile: [6, 1], scroll: [0.25, 0], at: 0.4, dur: 2, scale: 1.6, stretch: [1, [[0, 1], [1, 4]], 1], spin: 0.9,
      erode: [[0, 0.5], [0.2, 0.08], [0.7, 0.15], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.7 }),
    // SECONDARY: a hushed ring sliding out along the ground, and a second hung at the chest drifting after it
    L({ type: 'shape', form: 'ring', ramp: 'wonder', main: 'frost', tile: [10, 1], scroll: [0, 0.4], at: 0.36, dur: 1.2, scale: [[0, 0.8], [1, 5.5]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.15], erode: [[0, 0], [0.4, 0.08], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.7, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'wonder', main: 'frost', tile: [10, 1], scroll: [0, 0.3], at: 0.6, dur: 1.4, scale: [[0, 0.6], [1, 4]], offset: [0, 1.6, 0],
      edgeV: [0.5, 0.2], erode: [[0, 0], [0.4, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.32]], glow: 1.4, turn: 'random' }),
    // SECONDARY: the column's light and a soft wash of its colour (the screen weight a rise earns, inside the budgets)
    L({ type: 'light', at: 0.34, color: MID, k: 26, range: 9, dur: 1.6, up: 1.4 }),
    L({ type: 'flash', at: 0.34, k: 0.16, color: HOT, dur: 0.5 }),
    // TERTIARY: motes lifted off the column as it rises
    L({ type: 'sprites', at: 0.4, count: [30, 36], shape: 'sparkle', spawn: 'ring', r: 1.1, dir: 'up', speed: [0.8, 1.6], gravity: -0.3, drag: 0.6,
      size: [0.07, 0.12], sizeEnd: 0.01, life: [1, 1.6], color: [HOT, MID], twinkle: 5 }),
    // TERTIARY: diamond dust filling the column, hanging longest of all
    L({ type: 'sprites', at: 0.4, count: [60, 70], shape: 'glint', spawn: 'column', r: [0.3, 2.2], height: 3.2, dir: 'up', speed: [0.06, 0.25], gravity: -0.1, drag: 0.4,
      size: [0.1, 0.2], sizeEnd: 0, life: [2, 2.8], color: DUST, alpha: 0.9, twinkle: 4 }),
    // TERTIARY: a cold breath laid on the ground round them
    L({ type: 'shape', form: 'disc', ramp: 'wonder', main: 'frost', mainK: 0.7, mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.05], tile: [4, 1], scroll: [0.01, 0.05], at: 0.3, dur: 2.9,
      scale: 3, offset: [0, 0.02, 0], glow: 0.8, core: 0, erode: [[0, 0.15], [0.5, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.32]], k: [[0, 0], [0.15, 0.6], [1, 0.6]], turn: 'random' }),
  ] },

  // Wonder drunk (played at the Courier's chest: vfx/feelinglooks.js): motes drawn in slowly, a ring of frost closing round them, taken in
  // and glowing a breath, a few glints left (Takai's Cure: gathered, made visible, absorbed, then glowing)
  'feeling.wonder.drink': { layers: [
    // SECONDARY (its gathering): motes drawn in slowly from all round, gone as they reach them
    L({ type: 'sprites', count: [18, 24], shape: 'sparkle', spawn: 'shell', r: 2.2, dir: 'in', speed: [2.8, 3.4], life: [0.6, 0.7],
      size: [0.07, 0.12], sizeEnd: 0.03, color: [HOT, 0xffffff], colorEnd: MID, twinkle: 5 }),
    // PRIMARY: a ring of frost closing round them, facing the eye
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'wonder', main: 'frost', tile: [8, 1], scroll: [0, -0.5], dur: 0.62, scale: [[0, 1.6], [1, 0.25]],
      edgeV: [0.35, 0.35], erode: [[0, 0.25], [0.25, 0.05], [0.8, 0.1], [1, 1]], rampShift: [[0, -0.1], [0.8, 0.05], [1, -0.1]], glow: 1.5, turn: 'random' }),
    // PRIMARY (taken in): the hot core as it reaches them
    hotCore({ ramp: 'wonder', at: 0.56, size: [0.35, 0.2], offset: [0, 0, 0] }),
    // TERTIARY: the glow it leaves in them, frost turning in it, eroding slowly
    L({ type: 'shape', form: 'sphere', ramp: 'wonder', main: 'frost', tile: [3, 2], scroll: [0.08, 0.2], at: 0.6, dur: 0.55, scale: 0.45, rim: -0.6, glow: 1.3,
      erode: [[0, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], turn: 'random' }),
    // TERTIARY: a few glints left round them, last to go
    L({ type: 'sprites', at: 0.62, count: [6, 9], shape: 'glint', spawn: 'sphere', r: 0.5, dir: 'up', speed: [0.05, 0.2], life: [0.9, 1.4],
      size: [0.08, 0.13], sizeEnd: 0, color: DUST, twinkle: 5 }),
  ] },

  // 81 Wonder, the vantage (vfx/shelllooks.js: at the point, held for its dur): Wonder's burst where it lands, then an aurora hung
  // overhead, the ground frosted under it, glints on the ground and dust falling slowly out of the sky
  'shell.wonder.land': { extends: 'feeling.wonder.burst', layers: [
    // PRIMARY (held): an aurora's curtain hung overhead round the point, its rays drifting, its folds flowing
    L({ type: 'shape', form: 'band', ramp: 'wonder', main: 'rays', tile: [4, 1], scroll: [0.03, 0.15], mask: 'noise', maskTile: [2, 1], maskScroll: [0.05, 0.1], flow: 'noise', flowK: 0.06,
      dur: Infinity, scale: 5, stretch: [1, 0.55, 1], offset: [0, 6, 0], edgeV: [0.3, 0.6], rim: -0.6, erode: 0.15, glow: 1.3, core: 0.2, in: 2, out: 1.5 }),
    // SECONDARY (held): the ground frosted under it
    L({ type: 'shape', form: 'disc', ramp: 'wonder', main: 'frost', mainK: 0.8, mask: 'noise', maskTile: [2, 1], maskScroll: [0.02, 0.04], tile: [6, 1], scroll: [0.01, 0.04],
      dur: Infinity, scale: 4, offset: [0, 0.02, 0], glow: 0.9, core: 0, erode: 0.15, rampShift: -0.1, in: 1.2, out: 1 }),
    // TERTIARY: glints on the frosted ground
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 4, offset: [0, 0.1, 0], dir: 'up', speed: [0.05, 0.2],
      size: [0.08, 0.15], sizeEnd: 0, life: [0.9, 1.4], color: DUST, twinkle: 5 }),
    // TERTIARY: dust falling slowly out of the aurora
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'glint', spawn: 'disc', r: 5, offset: [0, 5.5, 0], dir: 'up', speed: [-0.4, -0.2],
      size: [0.1, 0.16], sizeEnd: 0, life: [2, 3], color: DUST, alpha: 0.7, twinkle: 4 }),
  ] },
};
