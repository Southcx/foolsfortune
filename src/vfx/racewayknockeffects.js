// ---------------------------------------------------------------------------------------
// THE RACEWAY'S CLAY KNOCKS: the library's entries (vfx/library.js spreads them in) for clay struck at speed on the Raceway, on the
// shared particle pools (no mesh, no program). Data only: the numbers are the look. `power` (the context's) scales counts and sizes.
//   raceway.rival.bump       a clapperjar rival bumped (race.bump; vfx/racewayrivals.js plays it at `at`, `dir` from the Courier
//                            through it, `tint` its glaze, `power` by the impact): a clay knock, a pale flash, chips of its glaze and
//                            of bare clay, grit and a puff of dust
//   raceway.rival.takedown   one taken down (race.takedown): a big break, white-gold sparks, sherds of its glaze thrown wide and
//                            bouncing on the sand, a ring of dust out over it, a held beat (the house's hit-stop, vfx.js) and a shake
//   raceway.pot.plume        a pot of the pot smash ridden through (race.pot; vfx/racewayprops.js, `power` by the board's speed, `dir`
//                            the board's way and up): a fountain of sherds and clay chips thrown on ahead, a tall column of clay dust
//                            and a low puff; at speed it towers (the house's pot burst and raceway.pot.smash play beside it)
//
// Prior art: Burnout 3's takedown (sparks, a held frame, the wreck spun off), Mario Kart's bump (a spark and a shove, no more), Zelda's
// and Crash's pots and crates bursting in sherds, Vlambeer's "the art of screenshake" for the held beat; the house's own clay grammar
// (vfx/racewaypropseffects.js raceway.pot.smash, fx.shatterBurst).
// ---------------------------------------------------------------------------------------
const CLAY = [0xc9744a, 0xd9906a, 0xa8643a]; // (the kit's clays, world/props/pottery.js: a glaze's sherd shows its body at the break)
const DUST = 0xe6c49a;
const SAND = [0xc98a52, 0xb8834e, 0xf0c890];

export const RACEWAY_KNOCK_EFFECTS = {
  'raceway.rival.bump': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 1.6, sizeEnd: 0.3, life: 0.12, color: 'white', colorEnd: 0xffd8b0, powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.4, sizeEnd: 2.4, life: 0.2, color: 0xfff0dc, alphaEnd: 0, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'shard', spawn: 'sphere', r: 0.25, dir: 'cone', cone: 60, speed: [3, 7], size: [0.08, 0.16], sizeEnd: 0.07, life: [0.5, 0.8], gravity: 12, drag: 0.6, color: ['tint', 'tint', CLAY[0]], alpha: 1, alphaEnd: 0.85, spin: [-14, 14], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'chip', spawn: 'sphere', r: 0.25, dir: 'cone', cone: 75, speed: [2, 5], size: [0.04, 0.09], sizeEnd: 0.03, life: [0.35, 0.6], gravity: 10, drag: 0.8, color: CLAY, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.5, 1.2], size: [0.4, 0.6], sizeEnd: 1.6, life: [0.45, 0.7], drag: 2.2, color: DUST, alpha: 0.45, spin: [-1, 1] },
  ] },
  'raceway.rival.takedown': { layers: [
    { type: 'hitstop', dur: 0.07, scale: 0.06, release: 0.1 },
    { type: 'shake', k: 0.3 },
    { type: 'sprites', count: 1, shape: 'core', size: 3.6, sizeEnd: 0.6, life: 0.18, color: 'white', colorEnd: 'gold', powerCount: false },
    { type: 'sprites', count: 1, shape: 'star4', size: 3, sizeEnd: 0, life: 0.3, color: 'white', colorEnd: 0xffb37a, rot: 0, powerCount: false },
    { type: 'sprites', count: [18, 24], shape: 'streak', spawn: 'sphere', r: 0.3, dir: 'sphere', speed: [7, 14], size: [0.14, 0.24], sizeEnd: 0.02, life: [0.2, 0.4], stretch: 2, drag: 3, gravity: 8, color: 0xfff3d0, colorEnd: 0xff9a3c },
    { type: 'sprites', pool: 'alpha', count: [16, 22], shape: 'shard', spawn: 'sphere', r: 0.4, dir: 'cone', cone: 80, speed: [5, 11], size: [0.14, 0.3], sizeEnd: 0.12, life: [0.8, 1.3], gravity: 13, drag: 0.5, color: ['tint', 'tint', 'tint', CLAY[0], CLAY[2]], alpha: 1, alphaEnd: 0.9, spin: [-16, 16], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [18, 26], shape: 'chip', spawn: 'sphere', r: 0.4, dir: 'sphere', speed: [3, 8], size: [0.05, 0.12], sizeEnd: 0.03, life: [0.5, 0.9], gravity: 10, drag: 0.8, color: CLAY, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', spawn: 'disc', r: 0.8, dir: 'out', lift: 0.4, speed: [1.5, 3.5], size: [0.7, 1.1], sizeEnd: 2.8, life: [0.7, 1.1], drag: 2.4, gravity: -0.1, color: DUST, alpha: 0.5, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'disc', r: 0.6, dir: 'out', lift: 0.5, speed: [3, 6], size: [0.06, 0.12], life: [0.4, 0.7], gravity: 9, drag: 1, color: SAND, alpha: 0.9, alphaEnd: 0.5, spin: [-8, 8] },
    { type: 'decal', tex: 'shockring', dur: 0.4, scale: [[0, 1], [1, 5]], tint: 0xe8c8a0, glow: 0.8, offset: [0, -0.6, 0], k: [[0, 0.8], [1, 0]] },
    { type: 'light', color: 0xffc070, range: 8, k: 10, dur: 0.3, up: 0.6 },
  ] },
  'raceway.pot.plume': { layers: [
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'shard', spawn: 'sphere', r: 0.5, dir: 'cone', cone: 40, speed: [6, 12], size: [0.14, 0.28], sizeEnd: 0.12, life: [0.8, 1.2], gravity: 13, drag: 0.5, color: ['tint', 'tint', CLAY[1], CLAY[2]], alpha: 1, alphaEnd: 0.9, spin: [-14, 14], floor: 'ground' },
    { type: 'sprites', pool: 'alpha', count: [14, 20], shape: 'chip', spawn: 'sphere', r: 0.5, dir: 'cone', cone: 55, speed: [4, 9], size: [0.06, 0.12], sizeEnd: 0.03, life: [0.5, 0.9], gravity: 11, drag: 0.7, color: CLAY, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', spawn: 'column', r: 0.4, height: 1.2, dir: 'up', speed: [1.5, 4], size: [0.8, 1.2], sizeEnd: 3.4, life: [0.9, 1.4], drag: 1.8, gravity: -0.3, color: [DUST, 0xd9a878], alpha: 0.55, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'puff', spawn: 'disc', r: 0.6, dir: 'out', lift: 0.2, speed: [1.5, 3], size: [0.6, 0.9], sizeEnd: 2.4, life: [0.6, 1], drag: 2.6, color: DUST, alpha: 0.45, spin: [-1, 1] },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.6, sizeEnd: 3.2, life: 0.25, color: 0xfff0dc, alphaEnd: 0, powerCount: false },
  ] },
};
