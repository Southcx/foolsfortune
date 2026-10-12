// ---------------------------------------------------------------------------------------
// THE FEELINGS' LAST THREE LOOKS (the caster shells TYPE-88 to 90: docs/plans/CASTER-SHELLS.md section 3): Agate, Calm and Prismatic.
// Rows for vfx/shelllooks.js, effects as data for vfx/library.js. Agate lands as the stronger of the two feelings last drunk, so its
// landing is that feeling's own look (shell.<feeling>.land); its round is banded in both colours (the agate's rule, GLOSSARY: the
// stronger is what happens, the weaker its colour). Calm's red beam is the runner's tracer; Prismatic's line too.
//
// Prior art: a banded agate's stone (two colours swirled, one ground); Outlaw Star's #3 and #5 (the dispel: the air left still); a
// prism's spectrum, the seven in DISPLAY_ORDER spiralled (progress/weather.js).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { COLOR, DISPLAY_ORDER } from '../../progress/weather.js';
import { L } from './kit.js';

const SEVEN = DISPLAY_ORDER.map((f) => COLOR[f]);
/** The two feelings last drunk, strongest first (the runner's Agate reads the same draught). */
const twoDrunk = (g) => {
  const d = Object.entries(g.draught || {}).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const a = d[0] || 'wonder', b = d[1] || d[0] || 'mirth';
  return [COLOR[a] ?? 0xffffff, COLOR[b] ?? 0xffffff];
};

export const LOOKS = {
  agate: { body: 'agate', fly: true, land: false, tints: twoDrunk },
  calm: { fire: 'aim', hold: () => 1.6 },
  prismatic: { fire: true },
};

export const EFFECTS = {
  // 88 Agate: a banded stone, its two colours swirling off it
  'shell.agate.fly': { layers: [
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'soft', spawn: 'shell', r: 0.1, dir: 'swirl', lift: 0, speed: [1, 2], size: [0.12, 0.16], sizeEnd: 0.02, life: 0.3, color: ['tint', 'tip'] }),
  ] },
  // 89 Calm: where the red beam falls, the air goes clear and still: a red ring laid out, dust settling straight down
  'shell.calm.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', offset: [0, 0.05, 0], size: 0.4, sizeEnd: 16, life: 0.7, color: 0xd04a3a, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 1.4, sizeEnd: 0.2, life: 0.25, color: 0xff8a7a, powerCount: false }),
    L({ type: 'sprites', rate: 16, dur: Infinity, shape: 'soft', spawn: 'disc', r: 6, offset: [0, 2.5, 0], dir: 'up', speed: [-0.4, -0.2], size: [0.05, 0.08], life: [1.6, 2.2], color: ['white', 0xe8e4dc], alpha: 0.7 }),
  ] },
  // 90 Prismatic: all seven out of the muzzle in a spiralling band
  'shell.prismatic.fire': { layers: [
    L({ type: 'sprites', count: 21, shape: 'streak', dir: 'cone', cone: 8, speed: [14, 26], size: [0.22, 0.32], sizeEnd: 0.04, life: 0.3, stretch: 2, color: SEVEN, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'swirl', size: 0.9, sizeEnd: 0.3, life: 0.3, spin: [10, 12], color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 14, shape: 'sparkle', dir: 'sphere', speed: [1, 2.5], size: [0.12, 0.2], sizeEnd: 0, life: 0.5, drag: 2, color: SEVEN, twinkle: 18, powerCount: false }),
  ] },
};
