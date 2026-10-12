// ---------------------------------------------------------------------------------------
// EMBER'S LOOKS (the caster shells TYPE-22 to 30 still without one: docs/plans/CASTER-SHELLS.md section 3): molten clay and crude, ember
// orange cooling to char, the oil film where crude is. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. Drawn already by
// the runner's parts, not drawn twice: the Lava Lamp's glob (shell.lavaLamp, S9), Bisque's skin (caster.bisque, S4), the Volcano's haze
// and cone (caster.heatHaze), the explosions (fx.explosion).
//
// Prior art: Ratchet & Clank's Lava Gun to Meteor Gun (a mark, then fire from the sky), the Pyrocitor's embers; glassblowing (sand
// fused green, its edge catching light); a volcano's cone throwing bombs (Strombolian bursts).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L } from './kit.js';

const SMOKE = [0x2a2420, 0x3a302a, 0x5b4c40];

export const LOOKS = {
  meteor: { fire: 'aim', hold: (row) => row.n.delay + 0.6, kinds: { meteor: { body: 'meteorite', fly: 'shell.meteor.fly', end: 'shell.meteor.end' } } },
  lavaLamp: { kinds: { lava: { body: 'hidden', fly: 'shell.lavaLamp.fly' }, lavaKid: { body: 'ember', fly: 'shell.lavaLamp.fly' } } },
  glassmaker: { kinds: { lobPart: { body: 'clod', fly: 'shell.glassmaker.fly', end: 'shell.glassmaker.land' } } },
  bisque: { body: 'bead', land: 'target', hold: () => 1.5 },
  volcano: { kinds: { lobPart: { body: 'clod', end: 'shell.volcano.land', hold: (row) => row.n.dur }, bomblet: { body: 'ember', fly: 'shell.volcano.fly', end: 'shell.volcano.splat' } } },
  slagRain: { kinds: { lobPart: { body: 'ember', fly: 'shell.cinder.fly', end: 'shell.slagRain.land', hold: (row) => row.n.dur }, slag: { body: 'ember', fly: 'shell.slagRain.fly', end: 'shell.slagRain.hiss' } } },
};

export const EFFECTS = {
  // 22 Meteor: the spot marked in ember rings until the sky answers; each meteor a molten trail and smoke, a hot pool where it falls
  'shell.meteor.fire': { layers: [
    L({ type: 'sprites', rate: 3, dur: Infinity, shape: 'ringthin', offset: [0, 0.05, 0], size: 2.6, sizeEnd: 0.6, life: 0.5, color: 'ember', alpha: 0.9, rot: 0 }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'glint', spawn: 'ring', r: 1.2, size: [0.15, 0.25], sizeEnd: 0, life: 0.3, color: ['ember', 0xffd08a], twinkle: 12 }),
  ] },
  'shell.meteor.fly': { layers: [
    L({ type: 'sprites', rate: 70, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.25, size: [0.4, 0.55], sizeEnd: 0.1, life: [0.2, 0.35], color: 0xffd08a, colorEnd: [0xff7a2a, 0xc8401a] }),
    L({ type: 'sprites', pool: 'alpha', rate: 24, dur: Infinity, shape: 'puff', size: [0.4, 0.6], sizeEnd: 1.2, life: [0.8, 1.2], drag: 1, color: SMOKE, alpha: 0.5, spin: [-1, 1] }),
  ] },
  'shell.meteor.end': { layers: [
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.6, scale: [[0, 0.4], [1, 3]], stretch: [1, [[0, 0.8], [1, 0.15]], 1], k: [[0, 1.6], [1, 0]], tint: 'ember', labradorite: 0.1 }),
    L({ type: 'sprites', count: 12, shape: 'drip', dir: 'cone', axis: 'up', cone: 60, speed: [3, 6], size: [0.1, 0.16], life: [0.5, 0.8], gravity: 12, color: [0xffd08a, 'ember'], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', rate: 10, dur: 3, shape: 'glint', spawn: 'disc', r: 1.2, size: [0.12, 0.2], sizeEnd: 0, life: 0.4, color: ['ember', 'labradorite'], twinkle: 10 }),
  ] },
  // 23 Lava Lamp: drops of its wax falling as it drifts (the glob itself is S9's, the runner's)
  'shell.lavaLamp.fly': { layers: [
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'drip', spawn: 'sphere', r: 0.25, size: [0.08, 0.12], life: 0.6, gravity: 8, color: [0xffb060, 0xff7a2a], floor: 'ground' }),
  ] },
  // 26 Glassmaker: a lump of sand streaming grains; where it lands the sand flashes white-hot and cools green, glinting
  'shell.glassmaker.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 30, dur: Infinity, shape: 'soft', size: [0.05, 0.08], life: 0.4, gravity: 6, color: [0xe8d6b0, 0xd9c296], alpha: 0.9 }),
  ] },
  'shell.glassmaker.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 2.2, sizeEnd: 0.4, life: 0.35, color: 'white', colorEnd: 0x7fc4a0, powerCount: false }),
    L({ type: 'sprites', count: 18, shape: 'facet', spawn: 'disc', r: 1.6, dir: 'up', speed: [0.4, 1.2], size: [0.12, 0.2], sizeEnd: 0.04, life: [0.8, 1.3], drag: 2, color: [0x7fc4a0, 0xbfe8d0, 'white'], spin: [-4, 4], powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'puff', spawn: 'disc', r: 1.4, dir: 'up', speed: [0.4, 0.9], size: [0.6, 0.9], sizeEnd: 1.4, life: 1.2, drag: 1, color: 0xf0ece4, alpha: 0.35, powerCount: false }),
  ] },
  // 27 Bisque: terracotta dust off the body as the bisque spreads (the skin is S4's, the runner's)
  'shell.bisque.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'sphere', r: 0.4, dir: 'out', speed: [0.5, 1.2], size: [0.3, 0.45], sizeEnd: 0.8, life: 0.8, drag: 2, color: [0xc46a45, 0xd9a07a], alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'glint', spawn: 'shell', r: 0.5, size: [0.12, 0.18], sizeEnd: 0, life: 0.25, color: 0xffb27a, twinkle: 12 }),
  ] },
  // 29 Volcano: the cone heaves up out of a ring of dust; its mouth spits sparks while it lives; each bomb a lava trail and a splash
  'shell.volcano.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 16, shape: 'puff', spawn: 'ring', r: 0.9, dir: 'out', lift: 0.2, speed: [2, 4], size: [0.5, 0.8], sizeEnd: 1.4, life: [0.8, 1.2], drag: 3, color: [0xd9b89a, 0x8c4a33], alpha: 0.55, powerCount: false }),
    L({ type: 'sprites', rate: 14, dur: Infinity, shape: 'soft', offset: [0, 1.25, 0], dir: 'cone', axis: 'up', cone: 25, speed: [2, 4], size: [0.08, 0.12], sizeEnd: 0, life: [0.5, 0.8], gravity: 6, color: 0xffd08a, colorEnd: 'ember' }),
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'puff', offset: [0, 1.3, 0], dir: 'up', speed: [0.6, 1.2], size: [0.4, 0.6], sizeEnd: 1.4, life: [1.4, 2], drag: 0.5, color: SMOKE, alpha: 0.4, spin: [-0.6, 0.6] }),
  ] },
  'shell.volcano.fly': { layers: [
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'soft', size: [0.18, 0.26], sizeEnd: 0.04, life: 0.3, color: 0xffd08a, colorEnd: 'ember' }),
    L({ type: 'sprites', pool: 'alpha', rate: 10, dur: Infinity, shape: 'puff', size: [0.2, 0.3], sizeEnd: 0.6, life: 0.8, drag: 1, color: SMOKE, alpha: 0.4 }),
  ] },
  'shell.volcano.splat': { layers: [
    L({ type: 'sprites', count: 8, shape: 'drip', dir: 'cone', axis: 'up', cone: 70, speed: [2, 4], size: [0.08, 0.13], life: 0.6, gravity: 12, color: [0xffd08a, 'ember'], floor: 'ground', powerCount: false }),
  ] },
  // 30 Slag Rain: thrown up in a hiss; the drops fall as glowing streaks, steam where each lands
  'shell.slagRain.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 6, life: 0.5, color: 'ember', rot: 0, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: Infinity, shape: 'puff', spawn: 'disc', r: 4, offset: [0, 7, 0], size: [1, 1.4], sizeEnd: 1.8, life: [1.2, 1.6], color: SMOKE, alpha: 0.35, spin: [-0.4, 0.4] }),
  ] },
  'shell.slagRain.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'streak', size: [0.22, 0.3], sizeEnd: 0.08, stretch: 2.4, life: 0.12, color: 0xffd08a, colorEnd: 'ember' }),
  ] },
  'shell.slagRain.hiss': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', dir: 'up', speed: [0.8, 1.4], size: [0.15, 0.22], sizeEnd: 0.5, life: 0.6, drag: 2, color: 0xe8e4dc, alpha: 0.45, powerCount: false }),
    L({ type: 'sprites', count: 3, shape: 'soft', dir: 'cone', axis: 'up', cone: 60, speed: [1, 2.5], size: 0.06, life: 0.3, gravity: 8, color: 'ember', powerCount: false }),
  ] },
};
