// ---------------------------------------------------------------------------------------
// DREAD'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('dread', mostly dark,
// anchored on progress/weather.js COLOR.dread) beside the ink ramp's, its paint motif as the pattern (marbling), and its motion:
// CREEPING, CONTRACTING, DARK. It is alpha-over ink smoke (`add: 0`): it closes IN rather than out, its shapes shrinking on their middle,
// its tendrils creeping in along the ground, and the light goes: one bright source (a pale green core) that shrinks and goes out. No
// flash (a wash can only brighten); its one lamp is that source, dying. Six moments and its caster shell's landing (TYPE-87, the dark),
// each in three tiers as vfx/library/kitdemo.js lays them: PRIMARY the hero shape, SECONDARY what moves round it, TERTIARY what lingers.
//
// Prior art (a museum label): Vagrant Story (Square, 2000), Mouri's dungeons kept "quite dark and dim" against one bright source, so
// the dark is read at all; Parasite Eve II (Square, 1999), its fixed views: dread as control taken away a little; Chrono Cross (Square,
// 1999), its Black element, darkness and gravity, the one that pulls in; the PlayStation's blend that subtracts as well as adds
// (docs/ref/VFX-PRIOR-ART.md 1.1, 1.2, 1.4, 2.3, 3.2).
//
//   DREAD_EFFECTS   'feeling.dread.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.dread.land'
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramps' own stops, vfx/shapes/ramps.js 'dread' and 'ink', as hex)
const INK = 0x140c1e, DARK = 0x0a120c, DEEP = 0x1f3a28, MID = COLOR.dread, LIGHT = 0x7aa088, SMOKE = [INK, DARK];
/** Ink laid over the light: an alpha-over shape of the ink ramp (or Dread's own), marbled, its marbling pushed slowly about. */
const ink = (o) => L({ type: 'shape', ramp: 'ink', add: 0, main: 'marble', mainK: 0.75, flow: 'noise', flowK: 0.08, flowScroll: [0, 0.15], rim: -0.35, glow: 1, core: 0, rampShift: [[0, 0], [1, -0.25]], ...o });
/** Smoke of ink drifting (the sprites' alpha pool). */
const smoke = (o) => L({ type: 'sprites', pool: 'alpha', shape: 'puff', color: SMOKE, alpha: 0.45, spin: [-0.5, 0.5], ...o });
/** Tendrils of it creeping in toward the middle. */
const tendrils = (o) => L({ type: 'sprites', pool: 'alpha', shape: 'swirl', dir: 'in', color: SMOKE, alpha: 0.6, spin: [-1.5, 1.5], ...o });
/** The light going out: pale green motes shrinking and dimming as they are drawn in. */
const lightGoing = (o) => L({ type: 'sprites', shape: 'soft', dir: 'in', size: [0.06, 0.1], sizeEnd: 0, color: LIGHT, colorEnd: DEEP, alpha: 0.8, ...o });

export const DREAD_EFFECTS = {
  // a burst of Dread: one pale light at its heart going out, ink closing in over it from all round, tendrils creeping in, a ring of ink
  // closing on the ground, the dark left lying there
  'feeling.dread.burst': { layers: [
    // PRIMARY (the one bright source): the hot core, shrinking as the light goes, a tenth of a second
    hotCore({ ramp: 'dread', size: [0.35, 0.12], offset: [0, 0.6, 0] }),
    // PRIMARY: ink closing in over it from all round, gathered out of nothing, then eaten away through its marbling
    ink({ form: 'dome', tile: [3, 2], scroll: [0.03, -0.2], mask: 'noise', maskTile: [2, 1], maskScroll: [0, -0.1], dur: 1.1, scale: [[0, 2.8], [0.5, 1.2], [1, 0.6]], stretch: [1, 0.85, 1],
      erode: [[0, 0.35], [0.15, 0.05], [0.7, 0.15], [1, 1]], rampShift: [[0, -0.1], [0.4, 0], [1, -0.2]], k: [[0, 0], [0.15, 0.9], [1, 0.9]], turn: 'random' }),
    // PRIMARY (its inner shell): Dread's own marbling, a beat behind, closing tighter
    ink({ form: 'dome', ramp: 'dread', tile: [4, 2], scroll: [-0.03, -0.15], at: 0.08, dur: 1, scale: [[0, 2.2], [1, 0.5]], erode: [[0, 0.3], [0.2, 0.06], [1, 1]],
      rampShift: [[0, 0], [1, -0.2]], k: [[0, 0], [0.15, 0.85], [1, 0.85]], turn: 'random' }),
    // SECONDARY: tendrils of ink creeping in to it
    tendrils({ count: [10, 14], spawn: 'shell', r: 2.6, offset: [0, 0.6, 0], speed: [3, 4], life: [0.6, 0.8], size: [0.4, 0.6], sizeEnd: 0.2 }),
    // SECONDARY: a ring of ink closing on the ground
    ink({ form: 'ring', tile: [6, 1], scroll: [0, -0.4], dur: 0.9, scale: [[0, 3.4], [1, 0.4]], offset: [0, 0.03, 0], edgeV: [0.3, 0.4], erode: [[0, 0.2], [0.2, 0.05], [1, 1]],
      k: [[0, 0], [0.12, 0.9], [1, 0.9]], turn: 'random' }),
    // TERTIARY: the light going out, a few pale motes drawn in and dimming
    lightGoing({ count: [8, 10], spawn: 'shell', r: 1.4, offset: [0, 0.7, 0], speed: [0.5, 0.9], life: [0.7, 1.1] }),
    // TERTIARY: the dark left lying on the ground, still closing as it is eaten away
    ink({ form: 'disc', ramp: 'dread', tile: [2, 1], scroll: [0.02, -0.05], at: 0.3, dur: 1.8, scale: [[0, 2.2], [1, 1.2]], offset: [0, 0.02, 0],
      erode: [[0, 0.1], [0.4, 0.2], [1, 1]], rampShift: [[0, 0], [1, -0.2]], k: [[0, 0], [0.15, 0.8], [1, 0.8]], turn: 'random' }),
  ] },

  // Dread spilt: an ink pool creeping wider, its one pale light dying at its heart, tendrils closing at its edge, drops of ink, smoke
  'feeling.dread.splash': { layers: [
    // PRIMARY (the one bright source): the hot core where it struck, and a faint green heart dying in the pool
    hotCore({ ramp: 'dread', size: [0.3, 0.12], offset: [0, 0.15, 0] }),
    L({ type: 'shape', form: 'disc', ramp: 'dread', main: 'marble', tile: [2, 1], scroll: [0.02, -0.08], dur: 0.9, scale: [[0, 0.7], [1, 0.3]], offset: [0, 0.03, 0],
      erode: [[0, 0], [0.4, 0.1], [1, 1]], rampShift: [[0, 0], [1, -0.2]], glow: 1.2, core: 0.2, turn: 'random' }),
    // PRIMARY: the ink pool, creeping wider slowly, its marbling pushed about, eaten away last
    ink({ form: 'disc', ramp: 'dread', tile: [2, 1], scroll: [0.02, -0.06], dur: 2.6, scale: [[0, 0.3], [0.15, 1.1], [1, 1.5]], offset: [0, 0.02, 0],
      erode: [[0, 0], [0.5, 0.12], [1, 1]], rampShift: [[0, 0], [1, -0.2]], k: [[0, 0], [0.1, 0.95], [1, 0.95]], turn: 'random' }),
    // SECONDARY: tendrils of ink closing in at its edge
    ink({ form: 'ring', tile: [6, 1], scroll: [0, -0.3], dur: 1.6, scale: [[0, 2.2], [1, 1.2]], offset: [0, 0.03, 0], edgeV: [0.35, 0.35], erode: [[0, 0.2], [0.2, 0.05], [1, 1]],
      k: [[0, 0], [0.15, 0.85], [1, 0.85]], turn: 'random' }),
    // SECONDARY: drops of ink thrown a little way
    L({ type: 'sprites', pool: 'alpha', count: [8, 10], shape: 'drip', dir: 'cone', axis: 'up', cone: 50, speed: [1.5, 2.5], gravity: 9, floor: 'ground', stretch: 0.4,
      size: [0.07, 0.1], sizeEnd: 0.07, life: [0.6, 0.8], color: INK, alpha: 0.9 }),
    // TERTIARY: smoke rising slowly off it
    smoke({ at: 0.2, count: [5, 7], spawn: 'disc', r: 1, dir: 'up', speed: [0.1, 0.3], size: [0.5, 0.8], sizeEnd: 1.4, life: [1.6, 2.2] }),
  ] },

  // Dread held round a body: ink round it, marbled, alpha-over; the dark closing in on the feet over and over; wisps creeping in; one dim
  // light inside it; smoke rising (it creeps, never strobes: every loop is slow)
  'feeling.dread.aura': { layers: [
    // PRIMARY: ink round the body, alpha-over, its marbling turning slowly
    ink({ form: 'band', tile: [3, 1], scroll: [0.03, 0.1], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.15], dur: Infinity, scale: 0.7, stretch: [1, 2.1, 1], edgeV: [0.05, 0.55],
      rim: -0.6, erode: 0.2, k: 0.8, in: 1.5, out: 1.2 }),
    // PRIMARY (the dark closing in): a ring of ink closing on the feet, every 2.6 real s
    ink({ form: 'ring', tile: [8, 1], scroll: [0, -0.3], dur: Infinity, loop: 2.6, scale: [[0, 2.4], [1, 0.6]], offset: [0, 0.03, 0], k: [[0, 0], [0.2, 0.85], [0.8, 0.85], [1, 0]],
      erode: [[0, 0.3], [0.2, 0.1], [0.8, 0.15], [1, 0.6]], in: 1.5, out: 1.2 }),
    // SECONDARY: wisps of ink creeping in toward the feet
    tendrils({ rate: 5, dur: Infinity, spawn: 'ring', r: 1.8, offset: [0, 0.3, 0], speed: [0.8, 1.2], life: [1.2, 1.6], size: [0.3, 0.45], sizeEnd: 0.15, alpha: 0.5 }),
    // SECONDARY: the one dim light inside it
    L({ type: 'shape', form: 'band', rim: -0.6, ramp: 'dread', main: 'marble', tile: [3, 1], scroll: [-0.02, 0.08], dur: Infinity, scale: 0.45, stretch: [1, 1.6, 1], edgeV: [0.1, 0.5],
      erode: 0.3, glow: 1.1, core: 0.1, k: 0.6, in: 1.5, out: 1.2 }),
    // TERTIARY: smoke rising off it
    smoke({ rate: 3, dur: Infinity, spawn: 'ring', r: 0.5, offset: [0, 1.2, 0], dir: 'up', speed: [0.2, 0.4], size: [0.4, 0.6], sizeEnd: 1, life: [1.4, 2], color: INK, alpha: 0.35 }),
    // TERTIARY: ink pooled at the feet
    ink({ form: 'disc', ramp: 'dread', tile: [2, 1], scroll: [0.01, -0.03], dur: Infinity, scale: 1.2, offset: [0, 0.02, 0], erode: 0.15, k: 0.75, in: 1.5, out: 1.2 }),
  ] },

  // Dread held on a moving thing: a head of ink with a dim green light in it, ink smoke left behind it swelling, wisps drawn back in
  'feeling.dread.trail': { layers: [
    // PRIMARY: a head of ink, marbled, alpha-over, and the one dim light inside it
    ink({ form: 'sphere', tile: [3, 2], scroll: [0.1, 0.2], dur: Infinity, scale: 0.2, rim: -0.5, erode: 0.08, k: 0.9, in: 8, out: 3 }),
    L({ type: 'shape', form: 'sphere', ramp: 'dread', main: 'marble', tile: [2, 2], scroll: [0.2, 0.3], dur: Infinity, scale: 0.09, rim: -0.6, glow: 1.4, core: 0.3, erode: 0.05, in: 8, out: 3 }),
    // SECONDARY: ink smoke left behind it, swelling as it is left
    smoke({ rate: 12, dur: Infinity, spawn: 'sphere', r: 0.1, dir: 'sphere', speed: [0.05, 0.2], size: [0.2, 0.3], sizeEnd: 0.7, life: [0.8, 1.2], alpha: 0.55 }),
    // TERTIARY: wisps drawn back in toward its line
    tendrils({ rate: 4, dur: Infinity, spawn: 'shell', r: 0.6, speed: [0.4, 0.6], life: [0.8, 1], size: [0.2, 0.3], sizeEnd: 0.08, alpha: 0.45 }),
    // TERTIARY: pale motes dying in its wake
    L({ type: 'sprites', rate: 4, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.15, dir: 'sphere', speed: [0.05, 0.15], size: [0.05, 0.08], sizeEnd: 0, life: [0.6, 0.9], color: LIGHT, colorEnd: DEEP, alpha: 0.75 }),
  ] },

  // Dread awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): tendrils creeping in along the ground round the Courier
  // and a ring of ink closing, then the one bright source at their heart going out as a dome of ink closes down over them, ink spiralling
  // in, smoke rising, the last pale motes drawn in and dying, the dark left pooled last
  'feeling.dread.rise': { layers: [
    // SECONDARY (its gathering): tendrils creeping in along the ground from far off, half a real second
    tendrils({ count: [20, 26], spawn: 'ring', r: 5.5, offset: [0, 0.1, 0], speed: [8, 9], life: [0.52, 0.56], size: [0.5, 0.8], sizeEnd: 0.3 }),
    // SECONDARY (its gathering): a ring of ink closing on their feet
    ink({ form: 'ring', tile: [10, 1], scroll: [0, -0.5], dur: 0.5, scale: [[0, 5], [1, 1]], offset: [0, 0.03, 0], edgeV: [0.3, 0.35], erode: [[0, 0.3], [0.3, 0.05], [1, 0.3]],
      k: [[0, 0], [0.3, 0.9], [1, 0.9]], turn: 'random' }),
    // PRIMARY (the one bright source): the hot core at their heart, shrinking as the light goes, and its lamp, dying
    hotCore({ ramp: 'dread', at: 0.5, size: [0.7, 0.2], offset: [0, 1.1, 0] }),
    L({ type: 'light', at: 0.5, color: LIGHT, k: 18, range: 6, dur: 1.6, up: 1.1 }),
    // PRIMARY: a dome of ink closing down over them, marbled, eaten away last (the far-off closing is the tendrils' and the ring's: a dome
    // wider than the camera's 3 m passes through the near plane as a hard edge)
    ink({ form: 'dome', tile: [4, 2], scroll: [0.02, -0.15], mask: 'noise', maskTile: [2, 1], maskScroll: [0, -0.1], at: 0.45, dur: 2.5, scale: [[0, 2.7], [0.35, 2.1], [1, 1.9]],
      stretch: [1, [[0, 0.6], [0.35, 1.05], [1, 1]], 1], erode: [[0, 0.4], [0.12, 0.06], [0.75, 0.15], [1, 1]], rampShift: [[0, 0], [0.4, 0], [1, -0.2]], k: [[0, 0], [0.12, 0.9], [1, 0.9]], turn: 'random' }),
    // PRIMARY (its inner shell): Dread's own marbling contracting on them
    ink({ form: 'dome', ramp: 'dread', tile: [4, 2], scroll: [-0.02, -0.12], at: 0.5, dur: 2, scale: [[0, 2.6], [1, 0.9]], erode: [[0, 0.3], [0.2, 0.06], [0.8, 0.15], [1, 1]],
      rampShift: [[0, 0], [1, -0.2]], k: [[0, 0], [0.15, 0.8], [1, 0.8]], turn: 'random' }),
    // SECONDARY: ink spiralling in round them
    ink({ form: 'spiral', rim: -0.95, rimPow: 1.6, tile: [6, 1], scroll: [-0.4, 0], at: 0.5, dur: 1.6, scale: [[0, 1.8], [1, 0.7]], stretch: [1, 2.3, 1], spin: -1.8, erode: [[0, 0.4], [0.2, 0.08], [0.7, 0.15], [1, 1]],
      k: [[0, 0], [0.15, 0.8], [1, 0.8]] }),
    // SECONDARY: smoke rising slowly round them
    smoke({ at: 0.6, count: [16, 20], spawn: 'ring', r: 2, dir: 'up', speed: [0.3, 0.6], size: [0.7, 1], sizeEnd: 1.8, life: [1.6, 2.2] }),
    // TERTIARY: the last pale motes drawn in to them and dying
    lightGoing({ at: 0.55, count: [20, 26], spawn: 'shell', r: 2.2, offset: [0, 1, 0], speed: [0.6, 1.2], life: [1, 1.6] }),
    // TERTIARY: the dark left pooled on the ground round them, still closing, eaten away last
    ink({ form: 'disc', ramp: 'dread', tile: [3, 1], scroll: [0.02, -0.05], at: 0.4, dur: 2.6, scale: [[0, 4], [1, 2.2]], offset: [0, 0.02, 0],
      erode: [[0, 0.1], [0.4, 0.2], [1, 1]], rampShift: [[0, 0], [1, -0.2]], k: [[0, 0], [0.12, 0.85], [1, 0.85]], turn: 'random' }),
  ] },

  // Dread drunk (at the Courier's chest: vfx/feelinglooks.js): wisps of ink drawn in, a ring of ink closing round them, the pale light
  // going into them and out, a breath of smoke off them after
  'feeling.dread.drink': { layers: [
    // SECONDARY (its gathering): wisps of ink drawn in from all round
    tendrils({ count: [10, 12], spawn: 'shell', r: 2.2, speed: [3, 3.6], life: [0.6, 0.7], size: [0.3, 0.45], sizeEnd: 0.1, alpha: 0.55 }),
    // PRIMARY: a ring of ink closing round them, facing the eye
    ink({ form: 'ring', face: 'camera', tile: [8, 1], scroll: [0, -0.5], dur: 0.6, scale: [[0, 1.6], [1, 0.25]], edgeV: [0.35, 0.35], erode: [[0, 0.25], [0.25, 0.05], [0.85, 0.1], [1, 1]],
      k: [[0, 0], [0.15, 0.85], [1, 0.85]], turn: 'random' }),
    // PRIMARY (taken in): the pale light going into them and out
    hotCore({ ramp: 'dread', at: 0.58, size: [0.3, 0.08], offset: [0, 0, 0] }),
    L({ type: 'sprites', at: 0.6, count: 1, shape: 'glint', size: 0.6, sizeEnd: 0, life: 0.3, color: LIGHT }),
    // TERTIARY: a breath of ink smoke off them after
    smoke({ at: 0.6, count: [4, 6], spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.1, 0.3], size: [0.3, 0.45], sizeEnd: 0.8, life: [0.8, 1.2], color: INK, alpha: 0.4 }),
  ] },

  // 87 Dread, the dark (vfx/shelllooks.js: at the point, once, `r` its reach): Dread's burst where it lands, then the dark thrown wide over
  // the ground and closing again, shadows creeping in from its edge, marbling turning in them
  'shell.dread.land': { extends: 'feeling.dread.burst', layers: [
    // PRIMARY: the dark thrown wide over the ground, then closing back in on the point, eaten away
    ink({ form: 'disc', tile: [4, 1], scroll: [0.02, -0.08], dur: 2.4, scale: [[0, 2], [0.2, 7], [1, 3]], offset: [0, 0.02, 0], erode: [[0, 0.1], [0.5, 0.18], [1, 1]],
      k: [[0, 0], [0.1, 0.85], [1, 0.85]], turn: 'random' }),
    // SECONDARY: shadows creeping in along the ground from its edge
    smoke({ count: 30, spawn: 'ring', r: 6, dir: 'in', speed: [2, 3], size: [1, 1.4], sizeEnd: 0.6, life: [1.6, 2.2], alpha: 0.6, spin: [-0.4, 0.4], powerCount: false }),
    // TERTIARY: Dread's marbling turning in the shadow
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'swirl', spawn: 'disc', r: 3, size: [1, 1.6], life: [1.8, 2.4], color: [MID, DEEP], alpha: 0.5, spin: [-0.6, 0.6], powerCount: false }),
  ] },
};
