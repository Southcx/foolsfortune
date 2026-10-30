// ---------------------------------------------------------------------------------------
// GALL'S EFFECTS: one of the seven feelings' skins (docs/plans/art/VFX-LIBRARY.md section 3): its ramp by name ('gall': its feeling's
// violet at the heart, olive and bile at its two ends, vfx/shapes/ramps.js, anchored on progress/weather.js COLOR.gall), its paint motif
// as the pattern (curds), and its motion: VISCOUS, DRIPPING, CORRODING. Its shapes swell slowly and sag, their patterns pushed about by
// a strong flow (a liquid's wobble), an alpha-over film of bile lies over them and on the ground eating away through its curds, drips fall
// and splat where they land, and bubbles rise and burst. Six moments and its caster shell's landing (TYPE-85, nausea), each in three
// tiers as vfx/library/kitdemo.js lays them: PRIMARY the hero shape, SECONDARY what moves round it, TERTIARY what lingers.
//
// Prior art (a museum label): Final Fantasy Crystal Chronicles (Square Enix, 2003), the Miasma: a hazard in the air held off by what
// you carry; Parasite Eve (Square, 1998), the orange mass grown into a wall round Eve: body horror as a skin on matter; Battlefront II
// and Divinity: Original Sin 2 as Simon Trümpler reads them, a liquid's layer over a body's and its UVs pushed about by a noise
// (docs/ref/VFX-PRIOR-ART.md 1.4, 1.9, 2.1, 2.3, 3.2).
//
//   GALL_EFFECTS   'feeling.gall.burst' | .splash | .aura (held) | .trail (held) | .rise | .drink   'shell.gall.land' (held)
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../../progress/weather.js';
import { L, hotCore } from './kit.js';

// (the sprites' colours: the ramp's own stops, vfx/shapes/ramps.js 'gall', as hex: olive film, the violet, lilac and bile)
const FILM = 0x6a7a3a, MID = COLOR.gall, LIGHT = 0xc0a8ec, BILE = 0xeef0a8, MIST = [0x6a7a3a, 0xa08ad0], GOO = [COLOR.gall, 0x6a7a3a, 0xc0a8ec];
// (a slow swell that sags: x and z widening as y slumps)
const SAG_XZ = [[0, 0.8], [0.35, 1.05], [1, 1.3]], SAG_Y = [[0, 1.4], [0.35, 1.05], [1, 0.55]];
/** The alpha-over film of bile: a shape's curds laid dark and violet over the light (add 0), wobbling as a liquid does. */
const film = (o) => L({ type: 'shape', ramp: 'gall', add: 0, main: 'curds', mainK: 0.8, flow: 'noise', flowK: 0.1, flowScroll: [0, 0.2], rim: -0.25, glow: 1, core: 0, rampShift: [[0, 0], [1, -0.25]], ...o });
/** Drips that fall and stop on the ground where they land (the splat is their own layer). */
const drips = (o) => L({ type: 'sprites', pool: 'alpha', shape: 'drip', gravity: 9, floor: 'ground', stretch: 0.4, size: [0.08, 0.12], sizeEnd: 0.09, color: GOO, alpha: 0.95, ...o });
/** Splats where the drips land: a blob of the film on the ground, spreading and going. */
const splats = (o) => L({ type: 'sprites', pool: 'alpha', shape: 'puff', offset: [0, 0.03, 0], size: 0.06, sizeEnd: 0.3, life: 0.4, color: FILM, alpha: 0.7, ...o });
/** Bubbles rising (alpha-over glass), and the pops where they burst. */
const bubbles = (o) => L({ type: 'sprites', pool: 'alpha', shape: 'bubble', dir: 'up', gravity: -0.5, size: [0.08, 0.16], sizeEnd: 0.22, color: LIGHT, alpha: 0.9, ...o });
const pops = (o) => L({ type: 'sprites', shape: 'ringthin', size: 0.05, sizeEnd: 0.3, life: 0.16, color: BILE, alpha: 0.8, ...o });

export const GALL_EFFECTS = {
  // a burst of Gall: a blob of curds swelling slowly and sagging under a film of bile, drips thrown up that fall and splat, bubbles
  // rising and bursting, the film left on the ground eating away
  'feeling.gall.burst': { layers: [
    // PRIMARY (its heart): the hot core, violet to white, a tenth of a second
    hotCore({ ramp: 'gall', size: [0.35, 1.1], offset: [0, 0.45, 0] }),
    // PRIMARY: a blob of curds swelling and sagging, its curds slumping down it, wobbling, eroding as it cools
    L({ type: 'shape', form: 'dome', ramp: 'gall', main: 'curds', mainK: 0.65, tile: [4, 2], scroll: [0.02, 0.12], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.1], flow: 'noise', flowK: 0.12, flowScroll: [0, 0.25],
      dur: 1.1, scale: [[0, 0.5], [0.35, 1.4], [1, 1.6]], stretch: [SAG_XZ, SAG_Y, SAG_XZ], erode: [[0, 0], [0.45, 0.06], [1, 1]],
      rampShift: [[0, 0.05], [0.3, 0.05], [1, -0.32]], rim: 0.3, glow: 1.8, core: 0.4, turn: 'random' }),
    // PRIMARY (its film): the bile laid over it, alpha-over, sagging with it
    film({ form: 'dome', tile: [3, 2], scroll: [0, 0.08], dur: 1.2, scale: [[0, 0.55], [0.35, 1.5], [1, 1.7]], stretch: [SAG_XZ, SAG_Y, SAG_XZ],
      erode: [[0, 0.1], [0.5, 0.2], [1, 1]], rampShift: [[0, -0.05], [1, -0.3]], k: [[0, 0], [0.15, 0.7], [1, 0.7]], turn: 'random' }),
    // SECONDARY: drips thrown up out of it that fall and stop where they land ...
    drips({ count: [12, 16], spawn: 'sphere', r: 0.3, offset: [0, 0.6, 0], dir: 'cone', axis: 'up', cone: 60, speed: [2.5, 4], drag: 0.6, life: [0.7, 1] }),
    // ... and splat there
    splats({ at: 0.45, count: [8, 12], spawn: 'disc', r: 1.4, delay: [0, 0.35] }),
    // SECONDARY: bubbles rising out of it, and bursting
    bubbles({ at: 0.15, count: [8, 11], spawn: 'sphere', r: 0.8, offset: [0, 0.4, 0], speed: [0.4, 0.9], life: [0.7, 1.1] }),
    pops({ at: 0.85, count: [6, 9], spawn: 'sphere', r: 0.9, offset: [0, 1.3, 0], delay: [0, 0.4] }),
    // TERTIARY: the film left on the ground, eating away through its curds
    film({ form: 'disc', tile: [3, 1], scroll: [0.01, 0.04], flowK: 0.06, at: 0.15, dur: 2.2, scale: [[0, 0.6], [0.2, 1.7], [1, 1.9]], offset: [0, 0.02, 0],
      erode: [[0, 0.1], [0.4, 0.2], [1, 1]], rampShift: [[0, 0], [1, -0.25]], k: [[0, 0], [0.12, 0.75], [1, 0.75]], turn: 'random' }),
    // TERTIARY: a sickly mist low over it
    L({ type: 'sprites', pool: 'alpha', at: 0.2, count: [5, 7], shape: 'puff', spawn: 'disc', r: 1, offset: [0, 0.2, 0], dir: 'up', speed: [0.1, 0.3], size: [0.6, 0.9], sizeEnd: 1.4,
      life: [1.4, 2], color: MIST, alpha: 0.3, spin: [-0.4, 0.4] }),
  ] },

  // Gall spilt: a thick pool spreading slowly under its film, strings thrown that fall, bubbles welling out of it and popping, mist over it
  'feeling.gall.splash': { layers: [
    // PRIMARY (its heart): the hot core where it struck
    hotCore({ ramp: 'gall', size: [0.25, 0.7], offset: [0, 0.15, 0] }),
    // PRIMARY: the pool spreading slowly (it is thick), wobbling, its curds turning, eroding last
    L({ type: 'shape', form: 'disc', ramp: 'gall', main: 'noise', tile: [2, 1], scroll: [0.02, 0.06], mask: 'curds', maskK: 0.7, maskTile: [4, 1], maskScroll: [0, 0.03], flow: 'noise', flowK: 0.1,
      dur: 2.8, scale: [[0, 0.3], [0.2, 1.1], [0.5, 1.35], [1, 1.45]], offset: [0, 0.02, 0], erode: [[0, 0], [0.5, 0.1], [1, 1]],
      rampShift: [[0, 0.05], [0.2, 0.02], [1, -0.3]], glow: 1.3, core: 0.3, turn: 'random' }),
    // PRIMARY (its film): the bile over the pool, alpha-over, a little wider
    film({ form: 'disc', tile: [3, 1], scroll: [0.01, 0.04], dur: 3, scale: [[0, 0.35], [0.2, 1.2], [0.5, 1.45], [1, 1.55]], offset: [0, 0.025, 0],
      erode: [[0, 0.1], [0.5, 0.2], [1, 1]], rampShift: [[0, 0], [1, -0.25]], k: [[0, 0], [0.1, 0.7], [1, 0.7]], turn: 'random' }),
    // SECONDARY: strings of it thrown slowly, falling back
    drips({ count: [8, 12], dir: 'cone', axis: 'up', cone: 50, speed: [1.5, 2.5], life: [0.6, 0.8] }),
    // SECONDARY: bubbles welling out of the pool, and popping
    bubbles({ at: 0.3, count: [10, 14], spawn: 'disc', r: 1, speed: [0.2, 0.5], delay: [0, 1.2], size: [0.06, 0.12], sizeEnd: 0.16, life: [0.5, 0.8] }),
    pops({ at: 0.8, count: [8, 10], spawn: 'disc', r: 1, offset: [0, 0.3, 0], delay: [0, 1.4] }),
    // TERTIARY: a sickly mist over it
    L({ type: 'sprites', pool: 'alpha', at: 0.4, count: [4, 6], shape: 'puff', spawn: 'disc', r: 0.9, offset: [0, 0.2, 0], dir: 'up', speed: [0.05, 0.2], size: [0.6, 0.9], sizeEnd: 1.4,
      life: [1.6, 2.2], color: MIST, alpha: 0.28, spin: [-0.4, 0.4] }),
  ] },

  // Gall held round a body: a film of bile round it sagging slowly down (alpha-over), its violet sheen inside, drips falling off it and
  // splatting at the feet, bubbles rising and popping
  'feeling.gall.aura': { layers: [
    // PRIMARY: the film of bile round the body, alpha-over, its curds sagging down, wobbling
    film({ form: 'band', tile: [3, 2], scroll: [0.01, -0.12], flowScroll: [0, -0.2], mask: 'noise', maskTile: [2, 1], maskScroll: [0, -0.15], dur: Infinity, scale: 0.68, stretch: [1, 2.1, 1],
      edgeV: [0.05, 0.55], rim: -0.6, erode: 0.18, k: 0.75, in: 2, out: 1.5 }),
    // PRIMARY (its sheen): a thin violet light inside it, sagging the other way round
    L({ type: 'shape', form: 'band', rim: -0.6, ramp: 'gall', main: 'curds', tile: [4, 1], scroll: [0, -0.18], flow: 'noise', flowK: 0.08, dur: Infinity, scale: 0.55, stretch: [1, 1.8, 1], spin: 0.2,
      edgeV: [0.05, 0.6], erode: 0.22, glow: 1.3, core: 0.3, in: 2, out: 1.5 }),
    // SECONDARY: drips falling off the body, and splatting at the feet
    drips({ rate: 6, dur: Infinity, spawn: 'ring', r: 0.5, offset: [0, 1.3, 0], dir: 'up', speed: [-0.2, 0], gravity: 8, size: [0.07, 0.11], life: [0.7, 0.9] }),
    splats({ rate: 5, dur: Infinity, spawn: 'disc', r: 0.6, size: 0.05, sizeEnd: 0.25, life: 0.35, alpha: 0.65 }),
    // TERTIARY: bubbles rising round it, and popping
    bubbles({ rate: 4, dur: Infinity, spawn: 'ring', r: 0.6, offset: [0, 0.3, 0], speed: [0.3, 0.6], gravity: -0.3, size: [0.06, 0.12], sizeEnd: 0.16, life: [1, 1.4], alpha: 0.85 }),
    // TERTIARY: the film pooled at the feet
    film({ form: 'disc', tile: [3, 1], scroll: [0.01, 0.03], flowK: 0.06, dur: Infinity, scale: 1.1, offset: [0, 0.02, 0], erode: 0.15, k: 0.7, in: 2, out: 1.5 }),
  ] },

  // Gall held on a moving thing: a wobbling blob of curds, drips falling from it, bubbles left rising, a breath of bile in its wake
  'feeling.gall.trail': { layers: [
    // PRIMARY: a blob of curds at its head, wobbling as a liquid does
    L({ type: 'shape', form: 'sphere', ramp: 'gall', main: 'curds', tile: [3, 2], scroll: [0.1, 0.2], flow: 'noise', flowK: 0.15, dur: Infinity, scale: 0.17, rim: -0.4, glow: 1.7, core: 0.4, erode: 0.08, in: 8, out: 4 }),
    // SECONDARY: drips falling from it and lying where they land
    drips({ rate: 10, dur: Infinity, spawn: 'sphere', r: 0.12, dir: 'up', speed: [-0.2, 0.1], size: [0.06, 0.1], sizeEnd: 0.08, life: [0.5, 0.8] }),
    // SECONDARY: bubbles left rising behind it
    bubbles({ rate: 5, dur: Infinity, spawn: 'sphere', r: 0.15, speed: [0.3, 0.6], size: [0.05, 0.1], sizeEnd: 0.14, life: [0.8, 1.2] }),
    // TERTIARY: a breath of bile mist in its wake
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.1, dir: 'sphere', speed: [0.05, 0.15], size: [0.25, 0.4], sizeEnd: 0.8,
      life: [0.8, 1.2], color: MIST, alpha: 0.25, spin: [-0.4, 0.4] }),
  ] },

  // Gall awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): its film welling up round the Courier's feet and its blobs
  // drawn in, slowing, then a column of curds welling up slow and sagging under its film, drips raining off it and splatting, bubbles
  // rising and bursting, miasma drifting, the film eaten away last
  'feeling.gall.rise': { layers: [
    // SECONDARY (its gathering): the film welling out round their feet
    film({ form: 'disc', tile: [3, 1], scroll: [0.01, 0.05], dur: 0.6, scale: [[0, 0.4], [1, 2.4]], offset: [0, 0.02, 0], erode: [[0, 0.3], [0.5, 0.12], [1, 0.2]], k: [[0, 0], [0.4, 0.75], [1, 0.75]], turn: 'random' }),
    // SECONDARY (its gathering): blobs of it drawn in toward them, slowing as they come (it is thick)
    L({ type: 'sprites', count: [20, 26], shape: 'soft', spawn: 'ring', r: 3, offset: [0, 1, 0], dir: 'in', speed: [5, 6], drag: 2.2, life: [0.4, 0.45], size: [0.12, 0.18], sizeEnd: 0.06, color: [MID, LIGHT] }),
    bubbles({ count: [12, 16], spawn: 'disc', r: 1.6, speed: [0.2, 0.5], delay: [0, 0.3], size: [0.06, 0.12], sizeEnd: 0.14, life: [0.4, 0.6] }),
    // PRIMARY (its heart): the hot core as it wells up
    hotCore({ ramp: 'gall', at: 0.36, size: [0.5, 1.5], offset: [0, 1, 0] }),
    // PRIMARY: a column of curds welling up round them, slow, rising then sagging, wobbling, its curds climbing it
    L({ type: 'shape', form: 'band', ramp: 'gall', main: 'curds', mainK: 0.7, tile: [3, 2], scroll: [0.02, 0.18], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.2], flow: 'noise', flowK: 0.12,
      at: 0.33, dur: 2.6, scale: [[0, 0.5], [0.15, 1.15], [1, 1.35]], stretch: [1, [[0, 0.2], [0.3, 3.8], [0.6, 3.4], [1, 2.6]], 1], edgeV: [0.03, 0.6], rim: -0.6,
      erode: [[0, 0], [0.45, 0.06], [1, 1]], rampShift: [[0, 0.05], [0.2, 0.05], [1, -0.32]], glow: 1.8, core: 0.4 }),
    // PRIMARY (its film): the bile over the column, alpha-over, sagging with it
    film({ form: 'band', rim: -0.6, tile: [3, 2], scroll: [0.01, -0.1], at: 0.36, dur: 2.7, scale: [[0, 0.55], [0.15, 1.25], [1, 1.45]], stretch: [1, [[0, 0.2], [0.3, 3.6], [0.6, 3.2], [1, 2.4]], 1],
      edgeV: [0.04, 0.6], erode: [[0, 0.1], [0.45, 0.2], [1, 1]], rampShift: [[0, 0], [1, -0.25]], k: [[0, 0], [0.12, 0.7], [1, 0.7]] }),
    // PRIMARY: a blob swelling and sagging round their feet
    L({ type: 'shape', form: 'dome', ramp: 'gall', main: 'curds', mainK: 0.65, tile: [5, 2], scroll: [0.02, 0.12], flow: 'noise', flowK: 0.12, at: 0.35, dur: 1.6, scale: [[0, 0.6], [0.3, 2], [1, 2.3]],
      stretch: [SAG_XZ, SAG_Y, SAG_XZ], erode: [[0, 0], [0.4, 0.06], [1, 1]], rampShift: [[0, -0.1], [0.3, -0.08], [1, -0.36]], rim: 0.3, glow: 1.15, core: 0.2, turn: 'random' }),
    // SECONDARY: drips raining off the column, and splatting round them
    drips({ at: 0.5, count: [30, 36], spawn: 'column', r: [0.6, 1.3], height: 3, offset: [0, 0.5, 0], dir: 'up', speed: [-0.3, 0.2], delay: [0, 1.2], life: [0.7, 1] }),
    splats({ at: 0.8, count: [16, 20], spawn: 'disc', r: 1.6, delay: [0, 1.4] }),
    // SECONDARY: bubbles rising up the column, and bursting
    bubbles({ at: 0.4, count: [16, 20], spawn: 'disc', r: 1.5, speed: [0.6, 1.2], delay: [0, 0.8], size: [0.1, 0.18], sizeEnd: 0.24, life: [1, 1.6] }),
    pops({ at: 1.2, count: [10, 14], spawn: 'sphere', r: 1.3, offset: [0, 1.8, 0], delay: [0, 1.2] }),
    // SECONDARY: its light and a soft wash of its colour (the screen weight a rise earns, inside the budgets)
    L({ type: 'light', at: 0.36, color: MID, k: 20, range: 8, dur: 1.6, up: 1.4 }),
    L({ type: 'flash', at: 0.36, k: 0.12, color: LIGHT, dur: 0.5 }),
    // TERTIARY: miasma drifting low round them
    L({ type: 'sprites', pool: 'alpha', at: 0.6, count: [10, 14], shape: 'puff', spawn: 'disc', r: 2, offset: [0, 0.4, 0], dir: 'up', speed: [0.1, 0.3], size: [0.8, 1.2], sizeEnd: 2,
      life: [2, 2.6], color: MIST, alpha: 0.28, spin: [-0.4, 0.4] }),
    // TERTIARY: the film left on the ground round them, eaten away last
    film({ form: 'disc', tile: [4, 1], scroll: [0.01, 0.04], flowK: 0.06, at: 0.3, dur: 2.9, scale: [[0, 1], [0.2, 2.8], [1, 3]], offset: [0, 0.02, 0],
      erode: [[0, 0.1], [0.4, 0.2], [1, 1]], rampShift: [[0, 0], [1, -0.25]], k: [[0, 0], [0.12, 0.75], [1, 0.75]], turn: 'random' }),
  ] },

  // Gall drunk (at the Courier's chest: vfx/feelinglooks.js): blobs and bubbles drawn in, slowing as they come, a ring closing sluggishly,
  // taken in with a wobble, a few drips falling off them after
  'feeling.gall.drink': { layers: [
    // SECONDARY (its gathering): blobs drawn in, slowing as they reach them (it is thick)
    L({ type: 'sprites', count: [14, 18], shape: 'soft', spawn: 'shell', r: 2, dir: 'in', speed: [4.5, 5.2], drag: 1.4, life: [0.66, 0.74], size: [0.08, 0.13], sizeEnd: 0.04, color: [MID, LIGHT] }),
    bubbles({ count: [6, 8], spawn: 'shell', r: 1.8, dir: 'in', speed: [4, 4.6], drag: 1.4, gravity: 0, size: [0.06, 0.1], sizeEnd: 0.05, life: [0.66, 0.74] }),
    // PRIMARY: a ring of curds closing round them, sluggish, facing the eye, wobbling
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'gall', main: 'curds', tile: [8, 1], scroll: [0, -0.4], flow: 'noise', flowK: 0.1, dur: 0.66, scale: [[0, 1.5], [0.6, 0.5], [1, 0.3]],
      edgeV: [0.35, 0.35], erode: [[0, 0.25], [0.25, 0.05], [0.85, 0.12], [1, 1]], rampShift: [[0, -0.1], [0.85, 0.05], [1, -0.1]], glow: 1.5, turn: 'random' }),
    // PRIMARY (taken in): the hot core as it reaches them
    hotCore({ ramp: 'gall', at: 0.62, size: [0.35, 0.2], offset: [0, 0, 0] }),
    // TERTIARY: the glow it leaves in them, wobbling, eating away
    L({ type: 'shape', form: 'sphere', ramp: 'gall', main: 'curds', tile: [3, 2], scroll: [0.05, 0.15], flow: 'noise', flowK: 0.15, at: 0.64, dur: 0.55, scale: 0.42, rim: -0.5, glow: 1.3,
      erode: [[0, 0.1], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], turn: 'random' }),
    // TERTIARY: a few drips falling off them after
    drips({ at: 0.7, count: [4, 6], spawn: 'sphere', r: 0.35, dir: 'up', speed: [-0.3, 0], gravity: 8, size: [0.06, 0.09], sizeEnd: 0.07, life: [0.5, 0.7] }),
  ] },

  // 85 Gall, nausea (vfx/shelllooks.js: at the point, held for its dur, `r` its cloud): Gall's burst where it lands, then a curdled cloud
  // turning over the place, its film lying under it, bubbles rising through it
  'shell.gall.land': { extends: 'feeling.gall.burst', layers: [
    // PRIMARY (held): the curdled cloud turning over the place
    L({ type: 'sprites', pool: 'alpha', rate: 10, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 'r', dir: 'swirl', lift: 0.1, speed: [0.2, 0.5], size: [0.8, 1.1], sizeEnd: 1.6,
      life: [1.5, 2.2], color: [MID, ...MIST], alpha: 0.42, spin: [-0.5, 0.5] }),
    // SECONDARY (held): the film of bile lying under it, its curds turning
    film({ form: 'disc', tile: [5, 1], scroll: [0.02, 0.03], flowK: 0.08, dur: Infinity, scale: 3, offset: [0, 0.02, 0], erode: 0.15, k: 0.7, in: 1.5, out: 1 }),
    // TERTIARY: bubbles rising through it, and bursting
    bubbles({ rate: 6, dur: Infinity, spawn: 'sphere', r: 'r', speed: [0.1, 0.3], gravity: -0.2, size: [0.1, 0.2], sizeEnd: 0.24, life: [1, 1.5], alpha: 0.8 }),
    pops({ rate: 3, dur: Infinity, spawn: 'sphere', r: 'r', offset: [0, 0.8, 0] }),
  ] },
};
