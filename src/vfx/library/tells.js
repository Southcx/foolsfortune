// ---------------------------------------------------------------------------------------
// THE TELLS' EFFECTS (library entries: vfx/library.js spreads them in). Small marks that teach a rule in play without a word:
//   stealth.step     a footstep while sneaking (vfx/stealthmarks.js, on `move.step`): a faint hoop of the film run out over the ground to
//                    the step's noise radius (`scale`, m: progress/stealth.js stepNoise) and gone; quieter steps fainter (the caller's
//                    handle `k`). Mark of the Ninja's noise rings, drawn as thin as the film's own hoops
//   tell.trump       a blow whose damage type trumps the body it struck (vfx/typetells.js, from vfx.hit; progress/combat/types.js TRUMPS
//                    against constitution.js's affinity): a small sharp star in the type's colour (`tint`), a cracked-glass star stood
//                    to the eye behind it, a few splinters thrown out straight and a thin white ring. The duel's WEAK (vfx/duelview/
//                    juice.js: the sharp spark and the cracked-glass star) brought into the world, without the word
//   tell.resist      a blow the body turns aside by its type (the same, when the type chart's multiplier is under 1): a dull grey
//                    deflect, its chips falling off, a small grey ring and the resist mark (the ward glyph) dim. The duel's RESIST
//   lockheart.recoil the Overload's recoil on the world's coffin (vfx/lockheartreliquary.js, on `lockheart.recoil`): the pressure let
//                    out, white-gold cracks of light shot from it, the Mind's violet vented as steam, a ring and sherds of its lacquer;
//                    `power` its tolls (1 or 2)
//
// Prior art: Mark of the Ninja's sound rings; Persona 5's WEAK and RESIST pop-ups (the duel's juice is the house's own form of them);
// Pokemon's "it's super effective" spark; a pressure vessel's burst (a boiler's steam venting through its seams).
//
//   TELL_EFFECTS   stealth.step  tell.trump  tell.resist  lockheart.recoil
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)
const DULL = 0x8a8478, VIOLET = 0x7f5cf0;

export const TELL_EFFECTS = {
  // a footstep while sneaking: one hoop of the film run out to the noise radius, faint
  'stealth.step': { layers: [
    L({ type: 'shape', form: 'hoop', ramp: 'film', main: 'none', dur: 0.75, scale: [[0, 0.3], [0.55, 0.92], [1, 1]], offset: [0, 0.04, 0],
      k: [[0, 0], [0.12, 0.6], [0.6, 0.35], [1, 0]], erode: 0, rampShift: [[0, 0.05], [1, -0.25]], glow: 0.8, core: 0.3, turn: 'random' }),
  ] },
  // a trump: the sharp spark, the cracked-glass star behind it, splinters out straight, a thin ring
  'tell.trump': { layers: [
    L({ type: 'shape', form: 'quad', face: 'camera', ramp: 'tint', main: 'cracks', mainK: 0.6, tile: [2, 2], scroll: [0, 0], mask: 'noise', maskK: 0.45, maskTile: [2, 2],
      dur: 0.3, scale: [[0, 0.25], [0.2, 0.7], [1, 0.78]], powerScale: true, rot: 0.785, edgeV: [0.34, 0.34], edgeU: [0.34, 0.34], erode: [[0, 0.15], [0.4, 0.18], [1, 1]],
      rampShift: [[0, 0.35], [0.3, 0.05], [1, -0.3]], core: 0.7, coreAt: 0.8, glow: 2.2 }),
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.62, sizeEnd: 0.05, life: 0.14, color: 'white', alphaEnd: 0, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.42, sizeEnd: 0, life: 0.2, color: 'tint', alphaEnd: 0, rot: 0.4, powerCount: false }),
    L({ type: 'sprites', count: [5, 6], shape: 'streak', dir: 'cone', axis: 'normal', cone: 80, speed: [5, 8], size: [0.12, 0.18], sizeEnd: 0.02, life: [0.12, 0.2], drag: 7, color: 'tint', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.18, sizeEnd: 0.85, life: 0.16, color: 'white', alpha: 0.9, alphaEnd: 0, powerCount: false }),
  ] },
  // a resist: a dull grey deflect, chips falling off it, a small grey ring, the resist mark dim
  'tell.resist': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'chip', dir: 'cone', axis: 'normal', cone: 70, speed: [1.2, 2.4], size: [0.04, 0.07], life: [0.4, 0.6], gravity: 10, drag: 1, color: DULL, alpha: 0.85, alphaEnd: 0.2, spin: [-10, 10], powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.15, sizeEnd: 0.5, life: 0.22, color: DULL, alpha: 0.6, alphaEnd: 0, powerCount: false }),
    L({ type: 'glyph', kind: 'ward', color: DULL, size: 0.32, up: 0.15, burst: false, ring: false }),
  ] },
  // the Overload's recoil on the coffin: cracks of light shot from it, the violet vented, a ring, sherds of lacquer
  'lockheart.recoil': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.9, sizeEnd: 0.2, life: 0.22, color: 'white', alphaEnd: 0, powerCount: false }),
    L({ type: 'sprites', count: [9, 12], shape: 'streak', spawn: 'sphere', r: 0.12, dir: 'out', speed: [6, 11], size: [0.18, 0.3], sizeEnd: 0.02, life: [0.18, 0.3], drag: 6, color: ['white', 'gold'] }),
    L({ type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'puff', spawn: 'sphere', r: 0.15, dir: 'out', speed: [1.5, 3], size: [0.25, 0.4], sizeEnd: 0.9, life: [0.7, 1.1], drag: 3, gravity: -0.6, color: [VIOLET, 0xb49be6], alpha: 0.5, alphaEnd: 0, spin: [-1, 1] }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 2.4, life: 0.3, color: 'gold', alpha: 0.85, alphaEnd: 0, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'shard', dir: 'cone', axis: 'up', cone: 90, speed: [2, 4.5], size: [0.05, 0.09], life: [0.5, 0.8], gravity: 11, drag: 1, color: [0x2a1a14, 0x4a2a20, 0xd9b048], spin: [-12, 12] }),
    L({ type: 'shake', k: 0.22 }),
  ] },
};
