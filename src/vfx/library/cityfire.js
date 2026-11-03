// ---------------------------------------------------------------------------------------
// THE CITY'S FIRE'S MOMENTS (library entries: vfx/library.js spreads them in; vfx/mechs/fire/ plays them on Dovina's events, the
// fire's rules progress/mechs/fire.js and her runtime world/hangar/cityfire.js), written at the toy city's scale (a cell a metre, a
// building 8 to 34 m, a mech 14 m), so every speed and size is the street's, never the Courier's played big:
//   city.fire.ignite   a cell catching (`city.ignite`): a white-hot pop, a burst of flame tongues and sparks, a curl of first smoke
//   city.fire.char     cells charred through (`city.char`): sparks spat, black flakes and a soot puff
//   city.fire.douse    a fire put out (`city.douse`): a hiss of white steam swelling up, spray drops and a few spat embers
//   city.glass.burst   glass gone in the heat or shattered with its frame (`city.break` cause 'heat', a steel frame's shatter): a
//                      shower of glinting panes falling and skittering, a ring of glints
//   city.fire.felled   a building the fire brought down (`city.felled` cause 'fire'): an ember storm thrown up and turning, black
//                      smoke rolled out low, a heave of brick dust
//   city.chunk.split   a chunk landing hard and splitting (`city.land`): chips and a squat ring of dust
//   city.dust.hang     after any collapse: a wide low cloud of dust that hangs in the street for ten real seconds and more
//   giant.straw.burn   the straw giant ablaze (`giant.burn`, held, `k` its strength): burning straw flung from its seams, ash
//   giant.vitrify.crack  the dune colossus glazed (`giant.vitrify`): glassy clay flakes cracking off and falling, a glint
//   mech.flamer.fire   the flamer's cone (held while G is held): heat haze down the cone, flame and sparks thrown along it, smoke at its end
// Drawn as a cartoon's in Fury (South, 2026-11-03): flames as the atlas's cel tongues (vfx/sprites.js 'tongue', its bands and keyline),
// smoke, steam and the flamer's fireballs as its cel clouds ('cloud'), embers and sparks as four-point stars, every fire colour a stop
// of Fury's ramp (vfx/shapes/ramps.js 'fury', as vfx/library/feelings/fury.js names them), an ignite opening on the feelings' hot core.
// Prior art: The Wind Waker's fire and smoke balls, Okami's and Hades' flame tongues, Red Faction Guerrilla's and Battlefield's Levolution's held dust, the Godzilla films' miniature fires and their ember
// storms, Far Cry 2's steam on a doused fire, the house's grammars (vfx/library/mechs.js: a dark alpha core under the light).
//
//   CITY_FIRE_EFFECTS
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../progress/weather.js';
import { hotCore } from './feelings/kit.js';

const L = (o) => o;
// (Fury's ramp's own stops, vfx/shapes/ramps.js 'fury', as hex: as vfx/library/feelings/fury.js takes them)
const DEEP = 0x5a0008, CRIMSON = COLOR.fury, ORANGE = 0xff5a10, GOLD = 0xffc060;
const FIRE = [ORANGE, 0xff7a2a, 0xff9a5c], EMBER = [ORANGE, GOLD, 0xff9a5c];
const SOOT = [0x2e2224, 0x3a2c2c, 0x4a3a38], STEAM = [0xffffff, 0xf2f4f8, 0xe4e8ee];
/** A cel cloud held whole, then eroded from its edge (an alpha past 1 holds it: vfx/sprites.js). */
const CEL = { shape: 'cloud', rot: [-0.3, 0.3], spin: [-0.12, 0.12] };
const BRICK = [0xb0603e, 0x8c4a30, 0xcbb8a4, 0xb9a48e], GLASS = [0xc8e4f2, 0xe8f6ff, 0x9cc4d8];
const STRAW = [0xe3c66a, 0xb08a3a, 0xf0dc90];
const HELD = { dur: Infinity };

export const CITY_FIRE_EFFECTS = {
  'city.fire.ignite': { layers: [
    hotCore({ ramp: 'fury', size: [0.6, 2.2], offset: [0, 0.6, 0], dur: 0.12 }),
    L({ type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'tongue', rot: [-0.35, 0.35], spawn: 'sphere', r: 0.9, dir: 'cone', axis: 'up', cone: 55, speed: [2, 5], size: [1.2, 2], sizeEnd: 0.4, life: [0.45, 0.8], drag: 1.4, gravity: -3, color: FIRE, colorEnd: CRIMSON, alpha: 1.6, grow: 14 }),
    L({ type: 'sprites', count: [14, 20], shape: 'star4', spawn: 'sphere', r: 0.6, dir: 'sphere', speed: [5, 11], size: [0.34, 0.5], sizeEnd: 0.04, life: [0.4, 0.8], stretch: 1.4, gravity: 9, color: 0xffffff, colorEnd: ORANGE }),
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], ...CEL, spawn: 'sphere', r: 0.8, dir: 'up', speed: [1.5, 3], size: [1.6, 2.4], sizeEnd: 4.5, life: [1.6, 2.4], drag: 0.8, gravity: -0.3, color: SOOT, alpha: 1.6, grow: 4 }),
  ] },
  'city.fire.char': { layers: [
    L({ type: 'sprites', count: [10, 16], shape: 'star4', spawn: 'sphere', r: 1.2, dir: 'sphere', speed: [4, 9], size: [0.3, 0.46], sizeEnd: 0.04, life: [0.4, 0.8], stretch: 1.4, gravity: 9, color: GOLD, colorEnd: CRIMSON }),
    L({ type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'chip', spawn: 'sphere', r: 1.2, dir: 'cone', axis: 'up', cone: 80, speed: [2, 5], size: [0.24, 0.46], life: [1.4, 2.4], gravity: 3, drag: 1.4, color: [0x141012, 0x221a1a], spin: [-6, 6] }),
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], ...CEL, spawn: 'sphere', r: 1, dir: 'up', speed: [1, 2.5], size: [2, 3], sizeEnd: 5.5, life: [2, 3], drag: 0.8, gravity: -0.3, color: SOOT, alpha: 1.7, grow: 3 }),
  ] },
  'city.fire.douse': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [20, 28], ...CEL, spawn: 'disc', r: 3, dir: 'cone', axis: 'up', cone: 40, speed: [3, 8], size: [2.4, 3.6], sizeEnd: 8.5, life: [2, 3.2], drag: 1.1, gravity: -0.6, color: STEAM, alpha: 1.7, grow: 3 }),
    L({ type: 'sprites', count: [14, 20], shape: 'drip', spawn: 'disc', r: 2.5, dir: 'cone', axis: 'up', cone: 60, speed: [4, 9], size: [0.2, 0.32], life: [0.6, 1], gravity: 14, floor: 'ground', color: [0xd8eef8, 0xb8d8ea] }),
    L({ type: 'sprites', count: [5, 8], shape: 'star4', spawn: 'disc', r: 2, dir: 'sphere', speed: [3, 6], size: [0.24, 0.34], sizeEnd: 0.03, life: [0.3, 0.5], stretch: 1.2, gravity: 6, color: GOLD, colorEnd: ORANGE }),
  ] },
  'city.glass.burst': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 2.4, sizeEnd: 0, life: 0.22, color: 0xffffff, rot: 0.3 }),
    L({ type: 'sprites', pool: 'alpha', count: [28, 38], shape: 'facet', spawn: 'sphere', r: 1.6, dir: 'cone', axis: 'up', cone: 110, speed: [3, 8], size: [0.3, 0.7], life: [1.1, 1.8], gravity: 16, floor: 'ground', color: GLASS, alpha: 0.75, spin: [-12, 12] }),
    L({ type: 'sprites', count: [16, 24], shape: 'glint', spawn: 'sphere', r: 1.6, dir: 'sphere', speed: [2, 6], size: [0.3, 0.6], sizeEnd: 0, life: [0.5, 1.1], gravity: 10, color: [0xffffff, 0xe8f6ff], twinkle: 14 }),
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'white', main: 'none', dur: 0.35, scale: [[0, 0.6], [1, 4.5]], erode: [[0, 0.04], [0.6, 0.14], [1, 1]], glow: 1.4 }),
  ] },
  'city.fire.felled': { layers: [
    L({ type: 'sprites', count: [90, 120], shape: 'star4', spawn: 'disc', r: 8, dir: 'cone', axis: 'up', cone: 55, speed: [6, 16], size: [0.32, 0.6], sizeEnd: 0, life: [2.4, 4.2], drag: 0.7, gravity: -0.8, color: EMBER, colorEnd: DEEP, twinkle: 6, spin: [-4, 4] }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'tongue', rot: [-0.3, 0.3], spawn: 'disc', r: 6, dir: 'up', speed: [3, 7], size: [3, 5], sizeEnd: 1, life: [0.7, 1.1], drag: 1.2, gravity: -2, color: FIRE, colorEnd: CRIMSON, alpha: 1.5, grow: 10 }),
    L({ type: 'sprites', pool: 'alpha', count: [24, 32], ...CEL, spawn: 'disc', r: 9, dir: 'out', lift: 0.35, speed: [5, 11], size: [4.5, 7], sizeEnd: 12, life: [3, 4.6], drag: 1.1, gravity: -0.4, color: SOOT, alpha: 1.6, grow: 3 }),
    L({ type: 'sprites', pool: 'alpha', count: [30, 40], shape: 'puff', spawn: 'disc', r: 10, dir: 'out', lift: 0.2, speed: [6, 13], size: [4, 6], sizeEnd: 12, life: [2.4, 3.6], drag: 1.4, color: BRICK, alpha: 0.48 }),
    L({ type: 'shake', at: 0, k: 0.35 }),
  ] },
  'city.chunk.split': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [18, 26], shape: 'chip', spawn: 'sphere', r: 1.5, dir: 'cone', axis: 'up', cone: 70, speed: [4, 10], size: [0.3, 0.8], life: [0.9, 1.5], gravity: 16, floor: 'ground', color: BRICK, spin: [-10, 10] }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], ...CEL, spawn: 'ring', r: 2, dir: 'out', lift: 0.15, speed: [3, 7], size: [2.2, 3.4], sizeEnd: 6, life: [1.2, 1.9], drag: 1.6, color: BRICK.slice(2), alpha: 1.5, grow: 4 }),
  ] },
  'city.dust.hang': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [20, 28], shape: 'puff', spawn: 'disc', r: 12, dir: 'out', lift: 0.08, speed: [0.6, 2], size: [7, 11], sizeEnd: [16, 24], life: [10, 15], drag: 0.5, gravity: -0.03, color: [0xcbb8a4, 0xb9a48e, 0xa89482], alpha: 0.3, spin: [-0.15, 0.15] }),
  ] },
  'giant.straw.burn': { layers: [
    L({ type: 'sprites', ...HELD, rate: 24, shape: 'streak', spawn: 'sphere', r: 4.5, dir: 'cone', axis: 'up', cone: 80, speed: [3, 8], size: [0.34, 0.6], sizeEnd: 0.05, life: [0.8, 1.4], stretch: 4, gravity: 6, color: STRAW, colorEnd: ORANGE }),
    L({ type: 'sprites', ...HELD, pool: 'alpha', rate: 10, shape: 'tongue', rot: [-0.35, 0.35], spawn: 'sphere', r: 4.6, dir: 'up', speed: [2, 4], size: [1.6, 2.6], sizeEnd: 0.5, life: [0.5, 0.8], drag: 1.2, gravity: -2, color: FIRE, colorEnd: CRIMSON, alpha: 1.5, grow: 12 }),
    L({ type: 'sprites', ...HELD, rate: 30, shape: 'star4', spawn: 'sphere', r: 4.5, dir: 'up', speed: [2, 6], size: [0.3, 0.5], sizeEnd: 0, life: [1.6, 2.8], drag: 0.6, gravity: -0.6, color: EMBER, colorEnd: DEEP, twinkle: 6, spin: [-4, 4] }),
    L({ type: 'sprites', ...HELD, pool: 'alpha', rate: 6, ...CEL, spawn: 'sphere', r: 3.5, dir: 'up', speed: [3, 5], size: [3, 4.6], sizeEnd: 10, life: [4, 6], drag: 0.4, gravity: -0.2, color: SOOT, alpha: 1.7, grow: 2 }),
  ] },
  'giant.vitrify.crack': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'facet', spawn: 'sphere', r: 1.6, dir: 'cone', axis: 'up', cone: 100, speed: [2, 5], size: [0.5, 1.1], life: [1.2, 1.9], gravity: 14, floor: 'ground', color: [0x6f7a52, 0x8a6a3e, 0xa88a5a, 0x4e5a3c], spin: [-8, 8] }),
    L({ type: 'sprites', count: [4, 7], shape: 'glint', spawn: 'sphere', r: 1.4, dir: 'sphere', speed: [1, 3], size: [0.5, 0.9], sizeEnd: 0, life: [0.4, 0.8], color: [0xffffff, 0xe8f0d0], twinkle: 12 }),
    L({ type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'sphere', r: 1, dir: 'sphere', speed: [0.4, 1.2], size: [1.6, 2.4], sizeEnd: 4, life: [1.2, 1.8], drag: 1.2, color: [0xd9b98a, 0xc9a674], alpha: 0.3 }),
  ] },
  'mech.flamer.fire': { layers: [
    L({ type: 'caster', shader: 'heathaze', ...HELD, shape: 'cone', radius: 5, length: 18, strength: 8, warmth: 0.3, tint: 'ember' }),
    // a cartoon's flamethrower: a stream of cel fireballs, born white-gold at the nozzle, Fury's orange down the cone, crimson at its end
    L({ type: 'sprites', ...HELD, pool: 'alpha', rate: 48, ...CEL, dir: 'cone', cone: 11, speed: [22, 30], size: [0.9, 1.3], sizeEnd: 4.6, life: [0.45, 0.7], drag: 1.4, gravity: -2, color: GOLD, colorEnd: [CRIMSON, ORANGE], alpha: 1.5, grow: 20 }),
    L({ type: 'sprites', ...HELD, rate: 26, shape: 'star4', dir: 'cone', cone: 18, speed: [24, 34], size: [0.3, 0.46], sizeEnd: 0.04, life: [0.4, 0.7], stretch: 1.4, gravity: 4, color: 0xffffff, colorEnd: ORANGE }),
    L({ type: 'sprites', ...HELD, pool: 'alpha', rate: 7, ...CEL, dir: 'cone', cone: 20, speed: [14, 20], size: [2, 3], sizeEnd: 8, life: [1.4, 2.2], drag: 1.6, gravity: -1, color: SOOT, alpha: 1.6, grow: 3 }),
  ] },
};
