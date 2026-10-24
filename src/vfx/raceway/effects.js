// ---------------------------------------------------------------------------------------
// THE RACEWAY'S LIVING DRESSING'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the race's fireworks and the
// Raceway lanterns (vfx/raceway/), on the shared particle pools. Data only: the numbers are the look.
//   raceway.firework.rise    a shell going up from behind the start arch: a bright head and a falling trail of sparks in its colour
//   raceway.firework.burst   its peony at the apex: a white core, a sphere of stars in its colour (`tint`) falling and twinkling out,
//                            gold glitter after (the crackle), a lamp's bloom lent by the light budget
//   raceway.lantern.light    a Raceway lantern catching at dusk: one soft warm puff of light, in and out
//
// Prior art: a peony shell (the lift, the trail, the break of stars, the crackle's glitter), the house's own bursts (library.js's gold
// star bursts and lamps), and a paper lantern's wick catching.
// ---------------------------------------------------------------------------------------
export const RACEWAY_DRESS_EFFECTS = {
  'raceway.firework.rise': { layers: [
    { type: 'sprites', count: 1, shape: 'core', dir: 'up', speed: [28, 32], size: 0.7, sizeEnd: 0.5, life: 0.85, gravity: 9, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', rate: 60, dur: 0.8, shape: 'sparkle', spawn: 'sphere', r: 0.2, dir: 'up', speed: [22, 30], size: [0.12, 0.2], sizeEnd: 0, life: [0.35, 0.6], gravity: 12, drag: 1.5, color: ['tint', 'gold'], twinkle: 14, powerCount: false },
  ] },
  'raceway.firework.burst': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 7, sizeEnd: 1, life: 0.3, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'light', color: 'tint', k: 80, range: 40, dur: 0.9, up: 0 },
    { type: 'sprites', count: [70, 90], shape: 'star4', dir: 'sphere', speed: [9, 14], size: [0.5, 0.8], sizeEnd: 0.05, life: [1.3, 1.9], drag: 1.4, gravity: 3.5, color: ['tint', 'tint', 'white'], colorEnd: 'tint', twinkle: 8, spin: [-3, 3] },
    { type: 'sprites', count: [30, 40], shape: 'streak', dir: 'sphere', speed: [12, 18], size: [0.35, 0.5], sizeEnd: 0, stretch: 2.5, life: [0.5, 0.8], drag: 2.2, gravity: 2, color: 'tint' },
    { type: 'sprites', at: 0.7, count: [40, 60], shape: 'sparkle', spawn: 'sphere', r: 8, dir: 'sphere', speed: [0.5, 2], size: [0.2, 0.32], sizeEnd: 0, life: [0.7, 1.2], gravity: 4, drag: 1, color: ['gold', 'white'], twinkle: 22 },
  ] },
  'raceway.lantern.light': { layers: [
    { type: 'sprites', count: 1, shape: 'soft', size: 1.4, sizeEnd: 0.6, life: 0.6, color: 0xffd090, colorEnd: 0xffb45a, alpha: 0.8, powerCount: false },
    { type: 'sprites', count: 3, shape: 'glint', dir: 'sphere', speed: [0.4, 1], size: [0.12, 0.2], sizeEnd: 0, life: [0.4, 0.7], color: 0xffe2a8, twinkle: 10, powerCount: false },
  ] },
};
