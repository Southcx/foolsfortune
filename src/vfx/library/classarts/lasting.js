// ---------------------------------------------------------------------------------------
// THE LASTING LOOKS' EFFECTS: the library's part of what a class art leaves running (vfx/classartlasting.js plays these over its own
// meshes: the slab, the lantern, the smoke Courier, the ward, the thicket, the reins, the ghost of a strike). Each in its art's grammar
// (docs/plans/art/VFX-LIBRARY.md 2 and 4: a domain's form and motion in its suit's colour), held while its thing stands or played once
// at its moment; no words, no lamps of their own (the Lamp's light is Petra's).
//   art.stronghold.crumble   a pinch of loose earth off the slab's top edge, in the ground's colour (`tint`), falling to its foot
//   art.stronghold.dust      dust rolled along the slab's foot from end to end (`from` -> `to`) as it rises and as it sinks
//   art.lantern.glow         held at the lantern: a soft halo of its light, moths flitting at it, motes falling off it
//   art.lantern.throw        held on the ground under it: its warm pool, ribbed by the frame's shadows
//   art.mirageStep.smoke     held at the smoke Courier: wisps rising off it, threads of the Moon's light unravelling up
//   art.mirageStep.unravel   the smoke let go: a puff of it torn up and outward, its threads thrown off
//   art.sanctum.turn         where a creature is set back at the ward's rim: the wall flared there, a seal stamped, sparks thrown back
//   art.ride.dust            puffs off a ridden creature's feet (the ground's `tint`, scaled by its size)
//   art.echo.arc             Encore's strike again: the move's arc swept twice at the chest in its tool's suit, a seal at the feet
//   art.wish.sky             held at Starlight's patch (scaled by its radius / 40 m): a disc of stars brightened 60 m over it, a faint
//                            aurora curtain standing at its edge (Wonder's ramp)
//   art.wish.motes           held round the Courier while they stand in the patch: Wonder's starlight falling slowly through the air
//
// Prior art: the kit's (Riot's primary, secondary and tertiary; FFT's colours); the chōchin's ribbed light on the ground (the Lamp); ink
// in water (the smoke); the protective circle's flare where something presses it (the Sanctum); Northern lights seen as a curtain over a
// clearing, and the Perseids' slow motes (Starlight); the PlayStation 2's frame feedback (Encore).
//
//   LASTING_ART_EFFECTS (spread into CLASS_ART_EFFECTS: index.js)
// ---------------------------------------------------------------------------------------
import { RANK, own, sprites, core, seal, inkMotes, strokes } from './kit.js';

const { king: K, major: M, queen: Q } = RANK;

export const LASTING_ART_EFFECTS = {
  // ---- Earth Wall (the King of Pentacles; Manifestation): the slab's ground falling off it ------------------------------------------
  'art.stronghold.crumble': { layers: [
    // SECONDARY: clods and grains off the edge, tumbling down its face to the foot
    sprites(K, { pool: 'alpha', count: [2, 4], shape: 'chip', spawn: 'sphere', r: 0.06, dir: 'cone', axis: 'up', cone: 75, speed: [0.3, 1.1], size: [0.04, 0.08], life: [0.8, 1.2], gravity: 9,
      floor: 'ground', color: 'tint', alpha: 1, spin: [-8, 8] }),
    // TERTIARY: a breath of dust where it broke off
    sprites(K, { pool: 'alpha', count: [1, 2], shape: 'puff', dir: 'up', speed: [-0.4, -0.15], size: [0.12, 0.2], sizeEnd: 0.5, life: [0.9, 1.3], drag: 1.2, color: 'tint', alpha: 0.28, spin: [-1, 1] }),
  ] },
  'art.stronghold.dust': { layers: [
    // PRIMARY: a curtain of dust rolled out along the foot, low and thick
    sprites(K, { pool: 'alpha', count: [16, 20], shape: 'puff', spawn: 'line', r: 0.2, dir: 'cone', axis: 'up', cone: 60, speed: [0.5, 1.4], size: [0.45, 0.75], sizeEnd: 1.5, life: [1.2, 1.9],
      drag: 2, gravity: -0.15, color: 'tint', alpha: 0.34, spin: [-0.8, 0.8] }),
    // SECONDARY: clods kicked up off the ground as it heaves
    sprites(K, { pool: 'alpha', count: [8, 12], shape: 'chip', spawn: 'line', r: 0.15, dir: 'cone', axis: 'up', cone: 45, speed: [1.5, 3.2], size: [0.05, 0.1], life: [0.6, 0.9], gravity: 9,
      floor: 'ground', color: 'tint', spin: [-10, 10] }),
  ] },

  // ---- Lamp (the Hermit, Pentacles; Manifestation): the lantern's light, and what it draws -------------------------------------------
  'art.lantern.glow': { layers: [
    // PRIMARY: the soft halo of the light round the paper, breathing (a volume, soft at its edge)
    own('pentacles', Q, { hold: true, loop: 3.5, form: 'sphere', main: 'noise', tile: [2, 2], scroll: [0.02, 0.1], flow: 'noise', flowK: 0.05, scale: [[0, 0.42], [0.5, 0.46], [1, 0.42]],
      rim: -1, rimPow: 1.2, core: 0, kmul: 0.55, g: 1.1, back: 0, erode: 0.08 }),
    // SECONDARY: moths flitting at the light, each a short dart round it and gone
    sprites(M, { pool: 'alpha', rate: 2.2, dur: Infinity, shape: 'moth', spawn: 'shell', r: 0.3, dir: 'swirl', lift: 0.35, speed: [0.45, 0.85], size: [0.06, 0.09], sizeEnd: 0.05,
      life: [0.6, 1], drag: 0.6, color: 0xeadfc6, alpha: 0.9, alphaEnd: 0, spin: [-4, 4] }),
    // TERTIARY: motes of its warm light falling off it slowly
    sprites(M, { rate: 3, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.14, dir: 'up', speed: [-0.25, -0.08], size: [0.03, 0.05], sizeEnd: 0, life: [1.4, 2.2], drag: 0.8, color: 'white',
      colorEnd: 'suit', alpha: 0.85, twinkle: 3 }),
  ] },
  'art.lantern.throw': { layers: [
    // PRIMARY: its warm pool on the ground, ribbed by the frame's shadows (the chōchin's spokes of light)
    own('pentacles', Q, { hold: true, form: 'disc', main: 'rays', mainK: 0.22, tile: [14, 1], scroll: [0.004, 0], mask: 'noise', maskK: 0.3, maskTile: [3, 1], maskScroll: [0.01, 0.02],
      scale: 2.1, offset: [0, 0.02, 0], edgeV: [0, 0.65], core: 0, kmul: 0.13, g: 0.45, back: 0.15, rampShift: -0.18, erode: 0.04 }), // (soft: a lantern's pool at night, never a starburst; the first firing read too strong at 896 x 414)
  ] },

  // ---- Vanish (the Moon, Cups; Alteration): the smoke Courier -------------------------------------------------------------------------
  'art.mirageStep.smoke': { layers: [
    // SECONDARY: wisps of ink smoke rising off it
    sprites(M, { pool: 'alpha', rate: 7, dur: Infinity, shape: 'puff', spawn: 'column', r: 0.24, height: 1.6, offset: [0, 0.15, 0], dir: 'up', speed: [0.25, 0.6], size: [0.22, 0.36], sizeEnd: 0.9,
      life: [1.2, 1.8], drag: 0.8, gravity: -0.15, color: 0x231d34, alpha: 0.3, spin: [-0.6, 0.6] }),
    // SECONDARY: threads of the Moon's light unravelling up off its edges
    sprites(M, { rate: 5, dur: Infinity, shape: 'streak', spawn: 'column', r: 0.3, height: 1.7, offset: [0, 0.1, 0], dir: 'up', speed: [0.4, 0.8], size: [0.05, 0.08], sizeEnd: 0.01,
      life: [0.6, 0.9], stretch: 2.5, color: 'suit', colorEnd: 'film', alpha: 0.45 }),
  ] },
  'art.mirageStep.unravel': { layers: [
    // PRIMARY: the smoke torn up and outward, in its own shape's height
    sprites(M, { pool: 'alpha', count: [16, 20], shape: 'puff', spawn: 'column', r: 0.3, height: 1.7, offset: [0, 0.1, 0], dir: 'out', lift: 0.7, speed: [0.5, 1.4], size: [0.35, 0.55], sizeEnd: 1.4,
      life: [1, 1.6], drag: 1.4, gravity: -0.3, color: 0x221c32, alpha: 0.36, spin: [-1, 1] }),
    // SECONDARY: its threads thrown off, the Moon's blue cooling to the film's
    sprites(M, { count: [10, 14], shape: 'streak', spawn: 'column', r: 0.25, height: 1.7, dir: 'sphere', speed: [1, 2.2], size: [0.05, 0.09], sizeEnd: 0.01, life: [0.4, 0.7], stretch: 2, drag: 2,
      color: 'suit', colorEnd: 'film', alpha: 0.6 }),
  ] },

  // ---- Sanctum (the Hierophant, Pentacles; Spellscription): a creature turned back at the rim ---------------------------------------
  'art.sanctum.turn': { layers: [
    // PRIMARY: the ward's wall flared where it pressed: a short stood band of the running hand, bright, eroding up
    own('pentacles', M, { form: 'band', main: 'script', tile: [3, 0.6], scroll: [0, 0.8], mask: 'streaks', maskK: 0.6, maskTile: [4, 1], maskScroll: [0, 1.5], scale: [[0, 0.3], [0.2, 0.55], [1, 0.6]],
      stretch: [1, 2.6, 1], offset: [0, 0, 0], edgeV: [0.05, 0.6], rim: -0.4, core: 0.5, dur: 0.6, g: 1.3 }),
    // PRIMARY (its heart): white for 0.1 s at the press
    core(M, { s: 0.7, y: 0.7 }),
    // SECONDARY: a seal stamped where it held, sparks thrown back the way it came
    seal('pentacles', M, { r: 0.5, dur: 0.45 }),
    sprites(M, { count: [8, 12], shape: 'streak', spawn: 'sphere', r: 0.2, offset: [0, 0.6, 0], dir: 'cone', axis: 'dir', cone: 40, speed: [2.5, 5], size: [0.06, 0.1], sizeEnd: 0.01, life: [0.25, 0.4],
      stretch: 2, drag: 2, color: 'white', colorEnd: 'suit' }),
    // TERTIARY: ink motes settling
    inkMotes(M, { r: 0.4, count: [6, 8] }),
  ] },

  // ---- Ride (the Chariot, Cups; Possession): the ridden creature's dust --------------------------------------------------------------
  'art.ride.dust': { layers: [
    // TERTIARY: dust off its feet, in the ground's colour (its size the creature's: ctx.scale)
    sprites(M, { pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'disc', r: 0.35, offset: [0, 0.08, 0], dir: 'cone', axis: 'up', cone: 55, speed: [0.3, 0.8], size: [0.3, 0.45], sizeEnd: 1,
      life: [0.8, 1.2], drag: 2, gravity: -0.1, color: 'tint', alpha: 0.3, spin: [-1, 1] }),
  ] },

  // ---- Encore (the Lovers, Swords; Spellscription): the strike again, in its tool's suit ---------------------------------------------
  'art.echo.arc': { layers: [
    // PRIMARY: the move's arc swept again across the front at the chest, written in, its edge hot
    strokes('suit', M, { r: 1.5, y: 1.05, dur: 0.5 }),
    // PRIMARY: a second, lower, trailing it the other way
    strokes('suit', M, { r: 1.25, y: 0.75, rot: Math.PI, spin: -2.6, at: 0.06, dur: 0.5, kmul: 0.7 }),
    // PRIMARY (its heart): white as it strikes
    core(M, { s: 0.9, y: 1, at: 0.05 }),
    // SECONDARY: a seal stamped at the feet where it was made; sparks off the arc
    seal('suit', M, { r: 0.7, at: 0.05 }),
    sprites(M, { count: [10, 14], shape: 'streak', spawn: 'ring', r: 1.3, offset: [0, 1, 0], dir: 'swirl', lift: 0.1, speed: [2, 4], size: [0.05, 0.08], sizeEnd: 0.01, life: [0.25, 0.4], stretch: 2,
      drag: 1.5, color: 'white', colorEnd: 'suit' }),
    // TERTIARY: the frame's echo, soft (the PlayStation 2's feedback)
    { type: 'smear', at: 0.04, amt: 0.25, dur: 0.4 },
  ] },

  // ---- Starlight (the Star, Swords; Ouranurgy): the patch of sky turned to Wonder ------------------------------------------------------
  'art.wish.sky': { layers: [
    // PRIMARY: a disc of the sky over the patch, its stars brightened (60 m up, its radius the patch's: ctx.scale x 40)
    own('wonder', M, { hold: true, form: 'disc', main: 'stars', tile: [28, 7], scroll: [0.002, 0], mask: 'noise', maskK: 0.55, maskTile: [5, 2], maskScroll: [0.004, 0.01], scale: 40,
      offset: [0, 60, 0], edgeV: [0, 0.55], core: 0.6, coreAt: 0.7, kmul: 0.75, g: 1.6, back: 0, erode: 0.05 }),
    // SECONDARY: a faint aurora curtain standing at the patch's edge, its folds drifting round
    own('wonder', M, { hold: true, form: 'band', main: 'streaks', tile: [24, 1], scroll: [0.006, 0.12], mask: 'noise', maskK: 0.7, maskTile: [6, 1], maskScroll: [-0.01, 0.02], flow: 'noise',
      flowK: 0.06, flowScroll: [0.01, 0.1], scale: 40, stretch: [1, 0.6, 1], offset: [0, 8, 0], edgeV: [0.35, 0.55], rim: -0.3, core: 0, kmul: 0.32, g: 1.2, back: 0, erode: 0.1 }),
    // TERTIARY: a second, higher and fainter, so the curtain has depth
    own('wonder', M, { hold: true, form: 'band', main: 'streaks', tile: [18, 1], scroll: [-0.004, 0.09], mask: 'noise', maskK: 0.7, maskTile: [5, 1], maskScroll: [0.012, 0.03], scale: 38,
      stretch: [1, 0.9, 1], offset: [0, 18, 0], edgeV: [0.4, 0.5], rim: -0.3, core: 0, kmul: 0.16, g: 1, back: 0, erode: 0.12 }),
  ] },
  'art.wish.motes': { layers: [
    // TERTIARY: Wonder's starlight falling slowly round the Courier, twinkling as it comes down
    sprites(M, { rate: 12, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 11, offset: [0, 8, 0], dir: 'up', speed: [-0.9, -0.45], size: [0.05, 0.1], sizeEnd: 0.02, life: [7, 10], drag: 0.2,
      color: 'white', colorEnd: 'ramp:wonder', alpha: 0.9, alphaEnd: 0.2, twinkle: 2.5 }),
  ] },
};
