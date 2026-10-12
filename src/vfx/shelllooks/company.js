// ---------------------------------------------------------------------------------------
// COMPANY'S LOOKS (the caster shells TYPE-71 to 80 still without one: docs/plans/CASTER-SHELLS.md section 3): summons and things set
// down, terracotta and faience. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. The bodies set down are the runner's
// (shelldeployables.js: the shabti, the drones, the turret, the golem, the mines), as are the Holowall's hard light and hex (S8, S2), the
// Barrier's dome (S2) and the Marionette's strings (S3); these are their arrivals and what crawls on them.
//
// Prior art: Ratchet & Clank's Synthenoids, Drone Device, Mini-Turret Glove, Mine Glove and Spitting Hydra (six heads out of the
// muzzle); the shabti of Egypt in blue faience; the Tesla Barrier (arcs crawling on a dome); a golem heaved up out of the ground.
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L } from './kit.js';

const FAIENCE = 0x2a8ab0, TERRA = 0xc46a45, DUST = [0xd9b89a, 0xc9a27a];

export const LOOKS = {
  shabti: { kinds: { lobPart: { body: 'clod', end: 'shell.shabti.land' } } },
  droneHalo: { fire: 'courier', hold: (row) => row.n.dur },
  turret: { kinds: { lobPart: { body: 'clod', end: 'shell.turret.land' } } },
  hydra: { fire: true, kinds: { lance: { body: 'lance', fly: 'shell.hydra.fly' } } },
  holowall: { fire: 'courierAt' },
  barrier: { fire: 'courier', hold: (row) => row.n.dur },
  golem: { kinds: { lobPart: { body: 'clod', end: 'shell.golem.land' } } },
  minefield: { kinds: { lobPart: { body: 'clod', end: 'shell.minefield.land' } } },
  marionette: { body: 'bead', land: 'point' },
};

export const EFFECTS = {
  // 71 Shabti: blue faience dust where the little servants climb out
  'shell.shabti.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 12, shape: 'puff', spawn: 'ring', r: 0.5, dir: 'out', lift: 0.3, speed: [1, 2], size: [0.3, 0.45], sizeEnd: 0.8, life: 0.8, drag: 3, color: [...DUST, 0x7ab0c8], alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', count: 10, shape: 'glint', spawn: 'disc', r: 0.8, dir: 'up', speed: [0.5, 1.5], size: [0.14, 0.22], sizeEnd: 0, life: 0.6, color: [FAIENCE, 0x8ad0e8, 'gold'], twinkle: 12, powerCount: false }),
  ] },
  // 73 Drone Halo: the kilns' glowing mouths leave embers in their orbit over you
  'shell.droneHalo.fire': { layers: [
    L({ type: 'sprites', rate: 14, dur: Infinity, shape: 'soft', spawn: 'ring', r: 1.1, offset: [0, 2, 0], dir: 'swirl', lift: 0, speed: [1.5, 2.2], size: [0.06, 0.1], sizeEnd: 0, life: 0.6, color: [0xffb27a, 'ember'] }),
  ] },
  // 74 Turret: set down in a ring of dust and clay chips
  'shell.turret.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'ring', r: 0.4, dir: 'out', lift: 0.2, speed: [1.5, 2.5], size: [0.3, 0.45], sizeEnd: 0.8, life: 0.7, drag: 3, color: DUST, alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'chip', dir: 'cone', axis: 'up', cone: 60, speed: [2, 4], size: [0.05, 0.09], life: 0.6, gravity: 12, color: [TERRA, 0xb4603f], alphaEnd: 0.8, spin: [-12, 12], floor: 'ground', powerCount: false }),
  ] },
  // 75 Hydra: six heads uncoiling out of the muzzle, each lance a gold tail
  'shell.hydra.fire': { layers: [
    L({ type: 'sprites', count: 6, shape: 'crescent', dir: 'cone', cone: 50, speed: [3, 5], size: [0.4, 0.55], sizeEnd: 0.2, life: 0.3, drag: 4, color: 'gold', colorEnd: TERRA, spin: [-12, 12], powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.8, sizeEnd: 0.1, life: 0.12, color: 'white', powerCount: false }),
  ] },
  'shell.hydra.fly': { layers: [
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'soft', size: [0.12, 0.16], sizeEnd: 0.02, life: 0.25, color: 'gold', colorEnd: TERRA }),
  ] },
  // 76 Holowall: hard light thrown up from your feet as the wall stands (the wall is S8's and S2's)
  'shell.holowall.fire': { layers: [
    L({ type: 'sprites', count: 10, shape: 'hex', spawn: 'disc', r: 0.6, dir: 'up', speed: [1, 2.5], size: [0.2, 0.3], sizeEnd: 0, life: 0.5, color: 0x9fd8ff, alpha: 0.8, powerCount: false }),
  ] },
  // 77 Barrier: arcs crawling over the dome (the glass is S2's)
  'shell.barrier.fire': { layers: [
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'streak', spawn: 'shell', r: 2, offset: [0, 0.2, 0], dir: 'swirl', lift: 0.4, speed: [2, 4], size: [0.16, 0.26], sizeEnd: 0.02, life: [0.08, 0.14], stretch: 2, color: [0x9fd0ff, 'white'] }),
  ] },
  // 78 Golem: the ground heaves up into a body: a great ring of dust, clods thrown, the ground shaking
  'shell.golem.land': { layers: [
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.7, scale: [[0, 0.5], [1, 4]], stretch: [1, [[0, 1.2], [1, 0.3]], 1], k: [[0, 1.4], [1, 0]], tint: 0xd9b89a, labradorite: 0.05 }),
    L({ type: 'sprites', pool: 'alpha', count: 20, shape: 'puff', spawn: 'ring', r: 1, dir: 'out', lift: 0.3, speed: [2, 5], size: [0.7, 1], sizeEnd: 1.8, life: [1, 1.4], drag: 3, color: DUST, alpha: 0.55, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 16, shape: 'chip', dir: 'cone', axis: 'up', cone: 50, speed: [4, 8], size: [0.1, 0.18], life: [0.8, 1.1], gravity: 14, color: [0x8c4a33, TERRA], alphaEnd: 0.8, spin: [-10, 10], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', at: 0.3, count: 2, shape: 'core', offset: [0, 2.6, 0], spawn: 'disc', r: 0.25, size: 0.35, sizeEnd: 0.2, life: 1.2, color: 0xffb060 }),
    L({ type: 'shake', k: 0.4 }),
  ] },
  // 79 Minefield: the mines thrown out in a scatter of dust and glints
  'shell.minefield.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'puff', spawn: 'ring', r: 2.5, size: [0.3, 0.4], sizeEnd: 0.7, life: 0.6, drag: 2, color: DUST, alpha: 0.45, powerCount: false }),
    L({ type: 'sprites', count: 6, shape: 'glint', spawn: 'ring', r: 2.5, offset: [0, 0.2, 0], size: [0.2, 0.3], sizeEnd: 0, life: 0.5, color: 'gold', twinkle: 12, powerCount: false }),
  ] },
  // 80 Marionette: threads of light let down from the sky to where it struck
  'shell.marionette.land': { layers: [
    L({ type: 'sprites', count: 14, shape: 'streak', spawn: 'disc', r: 0.5, offset: [0, 3, 0], dir: 'up', speed: [-9, -6], size: [0.3, 0.45], sizeEnd: 0.1, stretch: 3, life: 0.35, color: ['white', 'gold'], powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.4, life: 0.3, color: 'gold', powerCount: false }),
  ] },
};
