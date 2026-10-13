// ---------------------------------------------------------------------------------------
// EMBER'S LOOKS (the caster shells TYPE-22 to 30 still without one: docs/plans/CASTER-SHELLS.md section 3): molten clay and crude, ember
// orange cooling to char, the oil film where crude is. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. Drawn already by
// the runner's parts, not drawn twice: the Lava Lamp's glob (shell.lavaLamp, S9), Bisque's skin (caster.bisque, S4), the Volcano's haze
// and cone (caster.heatHaze), the explosions (fx.explosion).
//
// Prior art: Ratchet & Clank's Lava Gun to Meteor Gun (a mark, then fire from the sky; the weapon too big for the screen, the ludicrous
// pass's rule), Final Fantasy's Meteor (the sky's own rock), the Pyrocitor's embers; glassblowing (sand
// fused green, its edge catching light); a volcano's cone throwing bombs (Strombolian bursts).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L, groundRing, scorch, debris } from './kit.js';

const SMOKE = [0x2a2420, 0x3a302a, 0x5b4c40];
const CHAR = [0x2a1e18, 0x4a3226, 0x8c4a33, 0xb4603f]; // (what a molten blow throws up: char and fired clay)

export const LOOKS = {
  // 22 Meteor (the owner, 2026-10-13): the three at `n.size` times the runner's rock, then the mega meteor at `n.mega.size`. Each look is
  // drawn at the size it was written for (3, and 5) and scaled by what the row says. The mega meteor is the runner's carrier kind `mega`.
  meteor: { fire: 'aim', hold: (row) => row.n.delay + (row.n.mega?.delay ?? 0) + 0.8, kinds: {
    meteor: { body: 'meteorite', fly: 'shell.meteor.fly', end: 'shell.meteor.end', ground: true, size: (row) => row.n.size ?? 1, scale: (row) => (row.n.size ?? 1) / 3 },
    mega: { body: 'megaMeteor', fly: 'shell.meteor.mega.fly', end: 'shell.meteor.mega.end', ground: true, size: (row) => row.n.mega?.size ?? 5, scale: (row) => (row.n.mega?.size ?? 5) / 5 },
  } },
  lavaLamp: { kinds: { lava: { body: 'hidden', fly: 'shell.lavaLamp.fly' }, lavaKid: { body: 'ember', fly: 'shell.lavaLamp.fly' } } },
  glassmaker: { kinds: { lobPart: { body: 'clod', fly: 'shell.glassmaker.fly', end: 'shell.glassmaker.land' } } },
  bisque: { body: 'bead', land: 'target', hold: () => 1.5 },
  volcano: { kinds: { lobPart: { body: 'clod', end: 'shell.volcano.land', hold: (row) => row.n.dur }, bomblet: { body: 'lavaBomb', fly: 'shell.volcano.fly', end: 'shell.volcano.splat', ground: true } } },
  slagRain: { kinds: { lobPart: { body: 'ember', fly: 'shell.cinder.fly', end: 'shell.slagRain.land', hold: (row) => row.n.dur }, slag: { body: 'ember', fly: 'shell.slagRain.fly', end: 'shell.slagRain.hiss' } } },
};

export const EFFECTS = {
  // 22 Meteor: the spot marked by ember rings closing on it on the ground until the sky answers, a wider red one for the mega meteor
  'shell.meteor.fire': { layers: [
    L({ type: 'decal', tex: 'shockring', dur: Infinity, loop: 0.7, scale: [[0, 9], [1, 2.5]], k: [[0, 0], [0.3, 1.2], [1, 0.4]], tint: 'ember', glow: 1.4, offset: [0, 0.07, 0], in: 8, out: 4 }),
    L({ type: 'decal', at: 1.1, tex: 'shockring', dur: Infinity, loop: 1.1, scale: [[0, 26], [1, 8]], k: [[0, 0], [0.3, 1], [1, 0.3]], tint: 0xff3a1a, glow: 1.4, offset: [0, 0.09, 0], in: 4, out: 3 }),
    L({ type: 'sprites', rate: 16, dur: Infinity, shape: 'glint', spawn: 'ring', r: 3.5, size: [0.4, 0.6], sizeEnd: 0, life: 0.35, color: ['ember', 0xffd08a], twinkle: 12 }),
  ] },
  // each of the three, written at size 3: a molten trail as wide as a person, smoke behind it
  'shell.meteor.fly': { layers: [
    L({ type: 'sprites', rate: 90, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.6, size: [1.1, 1.6], sizeEnd: 0.3, life: [0.25, 0.4], color: 0xffe0a0, colorEnd: [0xff7a2a, 0xc8401a] }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.8, dir: 'sphere', speed: [1, 3], size: [0.35, 0.5], sizeEnd: 0.05, life: [0.2, 0.35], stretch: 2, color: [0xffd08a, 'white'] }),
    L({ type: 'sprites', pool: 'alpha', rate: 30, dur: Infinity, shape: 'puff', size: [1.2, 1.8], sizeEnd: 3.6, life: [1, 1.5], drag: 1, color: SMOKE, alpha: 0.55, spin: [-1, 1] }),
  ] },
  // where each lands (size 3): a white-hot core, a ring of fire out along the ground, a scorch, molten drips and char that lie a while
  'shell.meteor.end': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 5.5, sizeEnd: 0.6, life: 0.28, color: 'white', colorEnd: 'ember', powerCount: false }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.7, scale: [[0, 1], [1, 8]], stretch: [1, [[0, 1], [1, 0.15]], 1], k: [[0, 1.8], [1, 0]], tint: 'ember', labradorite: 0.1 }),
    groundRing({ to: 18, from: 1, dur: 0.6, tint: 'ember' }),
    scorch({ size: 5.5, dur: 7 }),
    L({ type: 'sprites', count: 26, shape: 'drip', dir: 'cone', axis: 'up', cone: 60, speed: [5, 11], size: [0.25, 0.4], life: [0.7, 1.1], gravity: 14, color: [0xffd08a, 'ember'], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', count: 30, shape: 'streak', dir: 'cone', axis: 'up', cone: 75, speed: [10, 20], size: [0.3, 0.5], sizeEnd: 0.05, life: [0.4, 0.7], drag: 1.5, gravity: 8, stretch: 2, color: [0xffd08a, 'white'], colorEnd: 'ember', powerCount: false }),
    debris({ count: 26, speed: [5, 11], size: [0.2, 0.42], life: [4, 6], color: CHAR }),
    L({ type: 'sprites', pool: 'alpha', count: 12, shape: 'puff', spawn: 'disc', r: 1.5, dir: 'cone', axis: 'up', cone: 30, speed: [2, 5], drag: 1, size: [1.6, 2.2], sizeEnd: 4.5, life: [1.8, 2.6], color: SMOKE, alpha: 0.55, spin: [-0.6, 0.6], powerCount: false }),
    L({ type: 'sprites', rate: 12, dur: 4.5, shape: 'glint', spawn: 'disc', r: 2.4, size: [0.2, 0.34], sizeEnd: 0, life: 0.45, color: ['ember', 'labradorite'], twinkle: 10 }),
    L({ type: 'light', color: 'ember', k: 40, range: 14, dur: 0.6 }),
  ] },
  // the mega meteor (written at size 5): a falling hill of molten rock, a fire trail you could stand in, the air swimming round it
  'shell.meteor.mega.fly': { layers: [
    L({ type: 'caster', shader: 'heathaze', dur: Infinity, shape: 'sphere', radius: 4.5, strength: 10, warmth: 0.25, tint: 'ember', in: 4, out: 3 }),
    L({ type: 'sprites', rate: 150, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 1.6, size: [3, 4.5], sizeEnd: 0.8, life: [0.35, 0.55], color: 0xfff0c0, colorEnd: [0xff7a2a, 0xc8401a] }),
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'streak', spawn: 'shell', r: 2.4, dir: 'out', speed: [3, 7], size: [0.6, 0.9], sizeEnd: 0.1, life: [0.3, 0.5], stretch: 2.5, color: [0xffd08a, 'white'] }),
    L({ type: 'sprites', pool: 'alpha', rate: 45, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 1.2, size: [3, 4], sizeEnd: 9, life: [1.6, 2.4], drag: 0.6, color: SMOKE, alpha: 0.6, spin: [-0.6, 0.6] }),
  ] },
  // where it lands (size 5, its reach 7 m): the sky white for a breath, a ring of fire out past the screen's edge, a mushroom of fire and
  // smoke, a crater burnt black and glinting, rock and char raining back down and lying there, the air over it swimming for seconds
  'shell.meteor.mega.end': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 24, sizeEnd: 3, life: 0.45, color: 'white', colorEnd: 'ember', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'star4', size: 34, sizeEnd: 4, life: 0.3, color: 0xfff0c0, powerCount: false }),
    L({ type: 'flash', color: 0xffd8a0, k: 0.55, dur: 0.6 }),
    L({ type: 'light', color: 'ember', k: 140, range: 45, dur: 1.4 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.0, scale: [[0, 1.5], [1, 24]], stretch: [1, [[0, 1.6], [1, 0.12]], 1], k: [[0, 2], [1, 0]], tint: 'ember', labradorite: 0.1 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.8, scale: [[0, 1], [1, 15]], stretch: [1, [[0, 2.4], [1, 0.4]], 1], k: [[0, 1.2], [1, 0]], tint: 0xd9b89a }),
    groundRing({ to: 70, from: 3, dur: 1.1, tint: 'ember', k: 2 }),
    groundRing({ to: 40, from: 2, dur: 1.5, tint: 0xffd8a0, at: 0.12, k: 1.2 }),
    scorch({ size: 16, dur: 11 }),
    L({ type: 'caster', shader: 'heathaze', dur: 7, shape: 'sphere', radius: 6.5, strength: 9, warmth: 0.2, tint: 'ember', k: [[0, 1.4], [0.6, 1], [1, 0]] }),
    L({ type: 'sprites', count: 70, shape: 'soft', spawn: 'disc', r: 2.5, dir: 'cone', axis: 'up', cone: 18, speed: [8, 24], drag: 1.4, size: [2.5, 4], sizeEnd: 6, life: [0.7, 1.2], color: 'white', colorEnd: ['ember', 0xc8401a], powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 40, shape: 'puff', spawn: 'disc', r: 3, dir: 'cone', axis: 'up', cone: 24, speed: [6, 15], drag: 1.1, size: [3, 5], sizeEnd: 11, life: [3, 4.5], color: SMOKE, alpha: 0.65, spin: [-0.5, 0.5], powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 36, shape: 'puff', spawn: 'ring', r: 3, dir: 'out', lift: 0.08, speed: [14, 24], drag: 2.2, size: [2.5, 3.5], sizeEnd: 7.5, life: [1.8, 2.6], color: [0xd9b89a, 0xc9a27a], alpha: 0.6, spin: [-1, 1], powerCount: false }),
    L({ type: 'sprites', count: 80, shape: 'streak', dir: 'cone', axis: 'up', cone: 78, speed: [18, 38], drag: 1, gravity: 10, size: [0.5, 0.85], sizeEnd: 0.08, life: [0.7, 1.3], stretch: 2, color: [0xffd08a, 'white'], colorEnd: 'ember', powerCount: false }),
    debris({ pool: 'add', shape: 'drip', count: 50, speed: [8, 18], cone: 60, size: [0.4, 0.7], life: [3, 5], color: [0xffd08a, 'ember', 0xff5a1a] }),
    debris({ count: 90, speed: [8, 20], cone: 72, size: [0.35, 0.9], life: [6, 9], color: CHAR }),
    debris({ shape: 'facet', count: 24, speed: [6, 14], cone: 55, size: [0.9, 1.6], life: [7, 10], color: [0x2a1e18, 0x3a2a20, 0x5b3a2a] }),
    L({ type: 'sprites', rate: 26, dur: 8, shape: 'glint', spawn: 'disc', r: 6.5, size: [0.35, 0.6], sizeEnd: 0, life: 0.5, color: ['ember', 0xffd08a, 'labradorite'], twinkle: 9 }),
    L({ type: 'sprites', pool: 'alpha', rate: 5, dur: 8, shape: 'puff', spawn: 'disc', r: 4, dir: 'up', speed: [1, 2.2], size: [3, 4], sizeEnd: 8, life: [3, 4], drag: 0.4, color: SMOKE, alpha: 0.4, spin: [-0.4, 0.4] }),
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
  // 29 Volcano: the cone heaves up out of a ring of dust thrown out along the ground; its mouth throws a fountain of fire and a column of
  // smoke for as long as it lives, its foot burnt; each bomb a lump of lava with a trail, a splash of fire and a burnt spot where it falls
  'shell.volcano.land': { layers: [
    groundRing({ to: 16, from: 1, dur: 0.8, tint: 0xffb27a }),
    scorch({ size: 6, dur: 10 }),
    L({ type: 'sprites', pool: 'alpha', count: 28, shape: 'puff', spawn: 'ring', r: 1.2, dir: 'out', lift: 0.25, speed: [4, 9], size: [1.2, 1.8], sizeEnd: 3.4, life: [1, 1.6], drag: 2.5, color: [0xd9b89a, 0x8c4a33], alpha: 0.6, powerCount: false }),
    debris({ count: 28, speed: [4, 9], size: [0.18, 0.36], life: [5, 7], color: CHAR }),
    L({ type: 'sprites', rate: 34, dur: Infinity, shape: 'soft', offset: [0, 1.25, 0], dir: 'cone', axis: 'up', cone: 22, speed: [5, 11], size: [0.3, 0.5], sizeEnd: 0.05, life: [0.7, 1.1], gravity: 8, color: 0xffe0a0, colorEnd: 'ember' }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'core', offset: [0, 1.3, 0], size: [1.6, 2.2], sizeEnd: 0.6, life: 0.3, color: 0xffd08a, colorEnd: 'ember', alpha: 0.8 }),
    L({ type: 'sprites', pool: 'alpha', rate: 9, dur: Infinity, shape: 'puff', offset: [0, 1.5, 0], dir: 'up', speed: [2, 3.5], size: [1.2, 1.8], sizeEnd: 5, life: [2.5, 3.5], drag: 0.4, color: SMOKE, alpha: 0.5, spin: [-0.6, 0.6] }),
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'glint', spawn: 'disc', r: 2.6, size: [0.2, 0.3], sizeEnd: 0, life: 0.5, color: ['ember', 'labradorite'], twinkle: 10 }),
  ] },
  'shell.volcano.fly': { layers: [
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'soft', spawn: 'sphere', r: 0.15, size: [0.55, 0.75], sizeEnd: 0.1, life: 0.35, color: 0xffe0a0, colorEnd: 'ember' }),
    L({ type: 'sprites', pool: 'alpha', rate: 14, dur: Infinity, shape: 'puff', size: [0.6, 0.8], sizeEnd: 1.8, life: 0.9, drag: 1, color: SMOKE, alpha: 0.45 }),
  ] },
  'shell.volcano.splat': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 3, sizeEnd: 0.3, life: 0.22, color: 'white', colorEnd: 'ember', powerCount: false }),
    groundRing({ to: 7, from: 0.5, dur: 0.45, tint: 'ember' }),
    scorch({ size: 2.6, dur: 5 }),
    L({ type: 'sprites', count: 16, shape: 'drip', dir: 'cone', axis: 'up', cone: 70, speed: [3, 7], size: [0.18, 0.28], life: 0.8, gravity: 12, color: [0xffd08a, 'ember'], floor: 'ground', powerCount: false }),
    debris({ pool: 'add', shape: 'drip', count: 8, speed: [2, 5], size: [0.2, 0.3], life: [2.5, 3.5], color: ['ember', 0xff5a1a] }),
    debris({ count: 10, speed: [2, 6], size: [0.12, 0.24], life: [3, 4.5], color: CHAR }),
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
