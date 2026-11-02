// ---------------------------------------------------------------------------------------
// A CREATURE'S DROP'S MOMENTS (library entries: vfx/library.js spreads them in; vfx/dropsprites.js's DropMoments plays them on Dovina's
// events, world/drops/creaturedrops.js). Looks only.
//   drop.rare   a rare drop (`drop.fall { rare: true }`) thrown out: a gold four-point star flashed on it and a few sparkles shed off
//               it as it flies, so the eye follows the one that matters
//   drop.take   a drop reaching the Box (`drop.take`) at the Courier's chest: a thin ring popped in the drop's colour and a pinch of
//               sparkles drawn in
// Prior art: Diablo II's and Path of Exile's rare-drop beam and sound (the eye told before the label), Kingdom Hearts' munny and orb
// pickups popping at the body, Animal Crossing's pickup sparkle.
//
//   DROP_EFFECTS   drop.rare (ctx: { pos })   drop.take (ctx: { pos, tint })
// ---------------------------------------------------------------------------------------
const L = (o) => o;

export const DROP_EFFECTS = {
  'drop.rare': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.2, sizeEnd: 0.75, life: 0.35, color: 'gold', alpha: 1, spin: [-3, 3], powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'glint', size: 0.5, sizeEnd: 0.1, life: 0.5, color: 'white', alpha: 1, powerCount: false }),
    L({ type: 'sprites', count: [6, 8], shape: 'sparkle', spawn: 'sphere', r: 0.15, dir: 'sphere', speed: [0.6, 1.4], size: [0.06, 0.1], sizeEnd: 0, life: [0.5, 0.9], drag: 2, gravity: 0.6, color: ['gold', 'white'], twinkle: 14, powerCount: false }),
  ] },
  'drop.take': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.15, sizeEnd: 0.7, life: 0.22, color: 'tint', alpha: 0.9, powerCount: false }),
    L({ type: 'sprites', count: [4, 5], shape: 'sparkle', spawn: 'shell', r: 0.3, dir: 'in', speed: [0.8, 1.4], size: [0.05, 0.08], sizeEnd: 0, life: [0.2, 0.3], drag: 1, gravity: 0, color: ['tint', 'white'], twinkle: 18, powerCount: false }),
  ] },
};
