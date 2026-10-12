// ---------------------------------------------------------------------------------------
// EDGE'S LOOKS (the caster shells TYPE-13 to 20 still without one: docs/plans/CASTER-SHELLS.md section 3, the look column): rows for the
// look table (vfx/shelllooks.js reads `LOOKS` by shell id) and their effects as data (vfx/library.js takes `EFFECTS`). Edge is Impact,
// things that cut and strike: white and bone, gold on what is fired. The Piercer's glass tube is the runner's (caster.heatHaze.tube).
//
// Prior art: the Flux and Splitter Rifles' chromatic needle, Zodiac's petals (Ratchet & Clank), the Bouncer's roll, Trigun's Cross
// Punisher (a stake that nails); a smear of chromatic aberration as the sixth generation drew speed.
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L } from './kit.js';

export const LOOKS = {
  splitter: { body: 'needle', fly: true, touch: true, land: false, kinds: { shard: { body: 'thread', fly: 'shell.splitter.thread' } } },
  piercer: { fire: true },
  cartwheel: { touch: true, kinds: { wheel: { body: 'cartwheel', fly: 'shell.cartwheel.fly' } } },
  petalRain: { kinds: { lobPart: { body: 'bead', end: 'shell.petalRain.bloom' }, petal: { body: 'petal', fly: 'shell.petalRain.fly', end: 'shell.petalRain.touch' } } },
  stake: { body: 'stake', fly: true, land: 'target', hold: () => 1.2 },
};

export const EFFECTS = {
  // 13 Splitter: a white needle split into its colours, seven threads at the wall
  'shell.splitter.fly': { layers: [
    L({ type: 'sprites', rate: 60, dur: Infinity, shape: 'streak', size: [0.3, 0.4], sizeEnd: 0.05, life: 0.12, stretch: 2, color: [0xff4a6a, 0x4ae0ff, 'white'], alpha: 0.85 }),
  ] },
  'shell.splitter.thread': { layers: [
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'streak', size: [0.14, 0.2], sizeEnd: 0.02, life: 0.1, stretch: 1.8, color: [0x9fe8ff, 'white'] }),
  ] },
  'shell.splitter.touch': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.9, sizeEnd: 0.1, life: 0.14, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 7, shape: 'streak', dir: 'cone', axis: 'normal', cone: 50, speed: [8, 12], size: [0.2, 0.3], sizeEnd: 0.03, life: 0.18, drag: 4, stretch: 2, color: [0xff4a6a, 0x4ae0ff, 'white'], powerCount: false }),
  ] },
  // 15 Piercer: a white core at the muzzle and a spray along the line (the glass tube is the runner's heat haze)
  'shell.piercer.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.7, sizeEnd: 0.1, life: 0.12, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 12, shape: 'streak', dir: 'cone', cone: 6, speed: [20, 34], size: [0.2, 0.32], sizeEnd: 0.03, life: 0.22, stretch: 2.2, color: ['white', 0xbfe8ff], powerCount: false }),
  ] },
  // 17 Cartwheel: a clay wheel rolling, a skirt of dust behind it; the creature it runs over flattened in a burst of dust
  'shell.cartwheel.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 18, dur: Infinity, shape: 'puff', offset: [0, -0.2, 0], size: [0.2, 0.3], sizeEnd: 0.6, life: 0.5, drag: 2, gravity: -0.3, color: 0xd9b89a, alpha: 0.45 }),
  ] },
  'shell.cartwheel.touch': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'ring', r: 0.4, dir: 'out', lift: 0.1, speed: [1.5, 3], size: [0.35, 0.5], sizeEnd: 0.9, life: 0.6, drag: 3, color: [0xd9b89a, 0xc9a27a], alpha: 0.55, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 1.4, life: 0.2, color: 0xc46a45, rot: 0, powerCount: false }),
  ] },
  // 19 Petal Rain: it hangs, then blooms: a ring of glazed petals out of it, each falling in a slow spiral and ringing where it lands
  'shell.petalRain.bloom': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 1.4, sizeEnd: 0.2, life: 0.22, color: 'white', colorEnd: 'gold', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 4, life: 0.4, color: 'gold', powerCount: false }),
    L({ type: 'sprites', count: 24, shape: 'petal', dir: 'swirl', spawn: 'ring', r: 0.4, lift: 0, speed: [2, 4], size: [0.12, 0.18], life: [0.6, 0.9], drag: 2, color: [0x2f6db5, 0x4f9a7a, 0xe0b030, 0xc84a3a, 0xf3efe6, 0x6a4a9a], spin: [-6, 6], powerCount: false }),
  ] },
  'shell.petalRain.fly': { layers: [
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'sparkle', size: [0.08, 0.12], sizeEnd: 0, life: 0.3, color: ['white', 'gold'], twinkle: 14 }),
  ] },
  'shell.petalRain.touch': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.1, sizeEnd: 0.5, life: 0.2, color: 'gold', powerCount: false }),
  ] },
  // 20 Stake: a ceramic stake, gold kintsugi seams on it; where it bites, gold cracks spider out
  'shell.stake.fly': { layers: [
    L({ type: 'sprites', rate: 24, dur: Infinity, shape: 'glint', size: [0.12, 0.2], sizeEnd: 0, life: 0.14, color: 'gold', twinkle: 24 }),
  ] },
  'shell.stake.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 1, sizeEnd: 0.1, life: 0.16, color: 'white', colorEnd: 'gold', powerCount: false }),
    L({ type: 'sprites', count: 10, shape: 'streak', dir: 'sphere', speed: [3, 6], size: [0.16, 0.26], sizeEnd: 0.03, life: [0.2, 0.3], drag: 6, stretch: 2, color: 'gold', powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'chip', dir: 'sphere', speed: [2, 4], size: [0.05, 0.09], life: [0.5, 0.8], gravity: 12, color: [0xf3efe6, 0xe6dccb], alphaEnd: 0.8, spin: [-14, 14], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'glint', spawn: 'shell', r: 0.4, size: [0.12, 0.2], sizeEnd: 0, life: 0.3, color: 'gold', twinkle: 12 }),
  ] },
};
