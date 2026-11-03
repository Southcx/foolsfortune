// ---------------------------------------------------------------------------------------
// A WARPED POCKET'S MOMENTS (library entries: vfx/library.js spreads them in, vfx/wellwarp.js plays them round the warped artifact of a
// floor of the Great Dunemaw: Petra's world/well/finds.js). The place showing its data near thick Lachryma (DUNEMAW.md, "The warp"):
//   well.warp.rise   held at the pocket's foot: the sand falling UPWARD, grains lifting off the floor and speeding up as they climb,
//                    thinning out over the artifact; a few of the film's glints climbing with them
//   well.warp.let    the warp let go (`floor.shift`, the warped artifact taken): the sand that was climbing rains back down, dust thrown
//                    out along the floor, a ring of the film run out and gone
//   well.warp.pot    the floating pot dropped once the warp lets go, broken on the sand: clay chips and its dust
// Prior art: the house's earth effects (vfx/library/sentinel.js's sand and clay), Control's Altered World Events (objects hanging in the
// air round what is wrong), Prey's and Silent Hill's ash rising, the glitch's tear (vfx/glitch.js) kept on the objects.
//
//   WELL_WARP_EFFECTS   (ctx: { pos } the pocket's foot on the sand, or where the pot lands)
// ---------------------------------------------------------------------------------------
const L = (o) => o;
const SAND = [0xb8834e, 0xd8a868, 0xc99a62], CLAY = [0xb5653a, 0x9a4f2c, 0xd99a6c];

export const WELL_WARP_EFFECTS = {
  'well.warp.rise': { layers: [
    L({ type: 'sprites', pool: 'alpha', dur: Infinity, rate: 26, shape: 'chip', spawn: 'disc', r: 2.6, dir: 'up', speed: [0.1, 0.5], size: [0.04, 0.09], sizeEnd: 0.02, life: [2.4, 3.4], drag: 0, gravity: -1.6, color: SAND, alpha: 0.9, alphaEnd: 0, spin: [-3, 3] }),
    L({ type: 'sprites', pool: 'alpha', dur: Infinity, rate: 4, shape: 'puff', spawn: 'disc', r: 2.2, dir: 'up', speed: [0.2, 0.5], size: [0.4, 0.7], sizeEnd: 1.4, life: [2, 3], drag: 0.6, gravity: -0.4, color: SAND, alpha: 0.18, alphaEnd: 0, spin: [-0.5, 0.5] }),
    L({ type: 'sprites', dur: Infinity, rate: 5, shape: 'sparkle', spawn: 'disc', r: 1.8, dir: 'up', speed: [0.3, 0.8], size: [0.06, 0.1], sizeEnd: 0, life: [1.8, 2.6], gravity: -0.6, color: 'labradorite', alpha: 0.9, twinkle: 8 }),
  ] },
  'well.warp.let': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [30, 40], shape: 'chip', spawn: 'disc', r: 2.4, offset: [0, 3.2, 0], dir: 'up', speed: [0, 0.3], size: [0.04, 0.09], life: [0.9, 1.4], gravity: 9, floor: 'ground', color: SAND, spin: [-6, 6] }),
    L({ type: 'sprites', pool: 'alpha', count: [12, 16], shape: 'puff', spawn: 'ring', r: 1.2, dir: 'out', speed: [1.2, 2.6], size: [0.4, 0.7], sizeEnd: 1.6, life: [1.1, 1.6], drag: 2, gravity: 0.1, color: SAND, alpha: 0.35, spin: [-0.8, 0.8] }),
    L({ type: 'shape', form: 'ring', ramp: 'film', main: 'ripple', tile: [6, 1], dur: 0.8, scale: [[0, 0.5], [1, 3.4]], offset: [0, 0.05, 0], edgeV: [0.4, 0.4], glow: 1.6, core: 0.2 }),
  ] },
  'well.warp.pot': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [12, 16], shape: 'chip', spawn: 'sphere', r: 0.3, dir: 'cone', axis: 'up', cone: 70, speed: [1.6, 3.4], size: [0.06, 0.13], life: [0.6, 0.9], gravity: 9, floor: 'ground', color: CLAY, spin: [-12, 12] }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', spawn: 'ring', r: 0.3, dir: 'out', speed: [0.6, 1.4], size: [0.3, 0.5], sizeEnd: 1, life: [0.8, 1.2], drag: 1.6, color: CLAY.concat(SAND), alpha: 0.32 }),
  ] },
};
