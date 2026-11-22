// ---------------------------------------------------------------------------------------
// THE CUTLASS'S CHARGES' LOOKS (plain names; docs/plans/SONDELASS-FEEL.md 14): the charged slash's wave and the spin attack, in the house's
// shape grammar (docs/plans/art/VFX-LIBRARY.md 2: a primary that reads in silhouette, a secondary that supports it, a tertiary that
// lingers), built from the class arts' kit (classarts/kit.js), on the tint ramp so each wears the blow's damage type's colour as the
// cutlass's trail does (vfx/cutlasstrail.js DAMAGE_TINT, passed as `tint` by tools/sondelass/slashwave.js and spinattack.js). Inked under
// where it must read on the noon sand (casebook 352: additive bone white is lost on pale ground). The held ones fade in at once (`in`:
// the kit's held default, 3, left the wave, alive half a second, still fading in when it struck).
//   cut.wave.fly    held, following the wave: a crescent of streaks standing on the ground along its heading, a hot thinner edge over its
//                   front, motes shed behind it; `scale` its width over 1.73 (the wave form's 120 degrees at radius 1)
//   cut.wave.hit    at each thing it cuts: a small crescent, a core, chips
//   cut.wave.end    where it is spent or stopped by a wall: the crescent breaking up in motes
//   cut.spin.charge held, at the blade's tip while the spin charges: a glint and motes drawn in, `k` the charge (brighter as it fills)
//   cut.spin.full   once, at the blade's tip when the charge is full: a star and a ring
//   cut.spin.ring   at the hips as the spin cuts all round: a flat ring of streaks thrown out to its reach, a ground ring, chips, dust;
//                   `scale` its reach over 3.5 m
//
// Prior art: Ragnarok's and Monster Hunter's sword beams, Zelda's sword beam and spin attack (Ocarina of Time: the blade's glow as the
// spin charges, a ring of light at the waist as it lets go); Riot's layering (the kit's).
// ---------------------------------------------------------------------------------------
import { RANK, own, inked, core, groundRing, rimRing, chips, sprites, weight } from './classarts/kit.js';

const T = 'tint', { knight: KNIGHT, king: KING, page: PAGE } = RANK;

export const CUTLASS_CHARGE_EFFECTS = {
  'cut.wave.fly': { layers: [
    // PRIMARY: the crescent stood on the ground, streaks racing along it, inked under so it holds on pale sand
    ...inked(own(T, KNIGHT, { hold: true, in: 40, form: 'wave', face: 'heading', main: 'streaks', tile: [5, 1], scroll: [2.2, 0], mask: 'noise', maskK: 0.5, maskTile: [3, 1], maskScroll: [0.6, 0],
      scale: 1, stretch: [1, 1.1, 1], offset: [0, 0.15, 0], edgeV: [0.12, 0.45], core: 0.7, coreAt: 0.6, back: 0.7, erode: 0.08 }), 0.5),
    // PRIMARY (its edge): a thinner, hotter crescent just ahead, low
    own(T, KNIGHT, { hold: true, in: 40, form: 'wave', face: 'heading', main: 'streaks', tile: [8, 1], scroll: [3, 0], scale: 1.08, stretch: [1, 0.55, 1], offset: [0, 0.35, 0], edgeV: [0.3, 0.3], core: 1, coreAt: 0.5, glow: 2.6, back: 0.6, erode: 0.05 }),
    // SECONDARY: motes shed behind it, in the blow's colour to white
    sprites(KNIGHT, { rate: 60, dur: Infinity, in: 40, shape: 'streak', spawn: 'disc', r: 0.6, offset: [0, 0.7, 0], dir: 'up', speed: [0.4, 1.2], size: [0.12, 0.22], sizeEnd: 0, life: [0.25, 0.45], color: 'tint', colorEnd: 'white' }),
  ] },
  'cut.wave.hit': { layers: [
    own(T, KNIGHT, { form: 'crescent', face: 'dir', main: 'streaks', tile: [3, 1], scroll: [0, 2], scale: [[0, 0.5], [1, 1.2]], offset: [0, 0, 0], dur: 0.28, glow: 2.4, back: 0.6 }),
    core(KNIGHT, { s: 0.8, y: 0 }),
    chips(KNIGHT, { r: 0.3, count: [6, 9], offset: [0, -0.6, 0] }),
  ] },
  'cut.wave.end': { layers: [
    own(T, PAGE, { form: 'wave', face: 'heading', main: 'noise', tile: [4, 1], scroll: [0.6, 0], scale: [[0, 1], [1, 1.25]], offset: [0, 0.15, 0], dur: 0.35, edgeV: [0.12, 0.45] }),
    sprites(PAGE, { count: [10, 14], shape: 'soft', spawn: 'disc', r: 0.8, offset: [0, 0.6, 0], dir: 'up', speed: [0.5, 1.5], size: [0.15, 0.3], sizeEnd: 0, life: [0.3, 0.5], color: 'tint', colorEnd: 'white' }),
  ] },
  'cut.spin.charge': { layers: [
    // PRIMARY: a glint at the tip, swelling with the charge (the handle's k)
    sprites(KNIGHT, { rate: 30, dur: Infinity, in: 20, shape: 'glint', spawn: 'point', speed: 0, size: [0.25, 0.4], sizeEnd: 0.1, life: [0.12, 0.2], color: 'white', colorEnd: 'tint' }),
    // SECONDARY: motes drawn in to the blade
    sprites(KNIGHT, { rate: 24, dur: Infinity, in: 20, shape: 'soft', spawn: 'sphere', r: 0.7, dir: 'in', speed: [1.2, 2.2], size: [0.08, 0.14], sizeEnd: 0, life: [0.3, 0.45], color: 'tint', colorEnd: 'white' }),
  ] },
  'cut.spin.full': { layers: [
    sprites(KING, { count: 2, shape: 'star4', speed: 0, size: [0.7, 0.9], sizeEnd: 0, life: 0.3, color: 'white', colorEnd: 'tint' }),
    own(T, PAGE, { form: 'ring', face: 'camera', main: 'none', scale: [[0, 0.1], [1, 0.6]], dur: 0.3, glow: 2.4 }),
  ] },
  'cut.spin.ring': { layers: [
    // PRIMARY: the flat ring of the cut thrown out at the hips to its reach, inked under
    ...inked(own(T, KING, { form: 'ring', main: 'streaks', tile: [12, 1], scroll: [3, 0], mask: 'noise', maskK: 0.5, maskTile: [4, 1], scale: [[0, 0.4], [0.35, 1], [1, 1.08]], offset: [0, 0.95, 0],
      edgeV: [0.55, 0.15], dur: 0.42, glow: 2.6, back: 0.7, turn: 'random' }), 0.45),
    // PRIMARY (its heart): white for a beat at the hips
    core(KING, { s: 1.1, y: 0.95 }),
    // SECONDARY: a ring on the ground under it and chips thrown out
    ...groundRing(T, KNIGHT, { r: 3.5, dur: 0.5 }),
    chips(KNIGHT, { r: 1.2, count: [10, 14] }),
    // TERTIARY: a pale rim left at the reach
    rimRing(T, PAGE, { r: 3.5 }),
    ...weight(KING, { shake: 0.25, light: 0.8, color: 'tint' }),
  ] },
};
