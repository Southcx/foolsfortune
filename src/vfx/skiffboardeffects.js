// ---------------------------------------------------------------------------------------
// THE BOARD'S STAKES' EFFECTS: the library's entries (vfx/library.js spreads them in) for the Solar Skiff's round-six rules (courier/
// skiff/boardrules.js) and the buoys, played by vfx/skiffboardlooks.js and vfx/racewaybuoys.js on the shared particle pools. Data only.
//   skiff.scorch.heat    held at the sail while the scorch runs high (`k` the heat): embers rising off the cloth, a warm haze
//   skiff.scorch         the sail scorched (skiff.scorch): a cough of dark smoke, ember flakes, a short orange core and light
//   skiff.luff.smoke     held at the sail while it luffs: smoke trailing off the cloth, a fleck of ember in it
//   skiff.hull.hit       a hit on the hull (skiff.hull; `power` by the damage): a white-hot core, chips of the hull's glaze and clay,
//                        grit and a spit of sparks
//   skiff.hull.worn      held under the hull while the pool runs low (`k` the wear): flakes of glaze and dust shed as it rides
//   skiff.wreck          the board breaking (skiff.wreck): a flash, Lachryma's ring out of it, dust and sand, glints (its shards are
//                        vfx/skiffboardlooks.js's own)
//   skiff.wreck.mend     the shards home and the board whole: gold through every join (kintsugi), a ring, sparkles
//   skiff.manual.drag    held at the stern while the manual stands the board on its tail: sand and a little dust off the tail
//   raceway.buoy.pass / .miss   a buoy passed on its side (`tint` the float's glaze): a ring and glints / missed: a dull puff
//
// Prior art: the house's own sand and Lachryma (vfx/racewayeffects.js), Excitebike's overheat (the smoke), F-Zero's sparks off a hit
// hull, Wave Race 64's buoy chime made light, the Courier's shatter and kintsugi (courier/vessel/death.js) for the wreck and its mend.
// ---------------------------------------------------------------------------------------
import { LACHRYMA_TINT, LACHRYMA_DEEP } from './racewayeffects.js';

const SAND = [0xc98a52, 0xb8834e, 0xf0c890]; // (the Dunes' sand, as vfx/racewayeffects.js throws it)
const EMBER = 0xff6a2a, SMOKE = [0x4a4038, 0x5e544a], GLAZE = [0xb4603f, 0xe8d6b0, 0x8a4a3a], CLAY = 0xc9a07a, GOLD = 0xffd27a;

export const SKIFF_BOARD_EFFECTS = {
  'skiff.scorch.heat': { layers: [
    { type: 'sprites', rate: 22, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.9, dir: 'up', speed: [0.6, 1.6], size: [0.08, 0.14], sizeEnd: 0, life: [0.4, 0.8], drag: 1, color: [EMBER, 0xffb050], colorEnd: 0xff3a10, inherit: 0.6 },
    { type: 'sprites', rate: 10, dur: Infinity, shape: 'core', spawn: 'sphere', r: 0.6, size: [1.4, 1.9], sizeEnd: 2.2, life: 0.3, color: EMBER, alpha: 0.16, alphaEnd: 0, inherit: 0.9 },
  ] },
  'skiff.scorch': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.6, life: 0.22, color: 0xffd0a0, colorEnd: EMBER, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'sphere', r: 0.8, dir: 'up', speed: [0.8, 2], size: [0.6, 0.9], sizeEnd: 2.4, life: [0.8, 1.3], drag: 1.6, gravity: -0.6, color: SMOKE, alpha: 0.6, spin: [-1, 1], inherit: 0.5 },
    { type: 'sprites', count: 16, shape: 'sparkle', spawn: 'sphere', r: 0.9, dir: 'sphere', speed: [1.5, 3.5], size: [0.1, 0.18], sizeEnd: 0, life: [0.4, 0.8], drag: 2, gravity: 2, color: [EMBER, 0xffb050], colorEnd: 0xff3a10, inherit: 0.5 },
    { type: 'light', color: EMBER, range: 7, k: 8, dur: 0.35, up: 0.2 },
  ] },
  'skiff.luff.smoke': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 16, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.7, dir: 'up', speed: [0.4, 1.2], size: [0.5, 0.8], sizeEnd: 2.2, life: [0.9, 1.4], drag: 1.4, gravity: -0.5, color: SMOKE, alpha: 0.42, spin: [-1, 1], inherit: 0.35 },
    { type: 'sprites', rate: 8, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.8, dir: 'up', speed: [0.4, 1.2], size: [0.07, 0.12], sizeEnd: 0, life: [0.3, 0.6], drag: 1, color: EMBER, colorEnd: 0xff3a10, inherit: 0.5 },
  ] },
  'skiff.hull.hit': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 2.2, sizeEnd: 0.4, life: 0.14, color: 'white', colorEnd: 0xffe2a0, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 7, shape: 'shard', spawn: 'sphere', r: 0.6, dir: 'sphere', speed: [2.5, 5], size: [0.12, 0.22], sizeEnd: 0.1, life: [0.5, 0.8], gravity: 14, drag: 0.6, color: GLAZE, alpha: 1, alphaEnd: 0.7, spin: [-10, 10], inherit: 0.4 },
    { type: 'sprites', pool: 'alpha', count: 6, shape: 'chip', spawn: 'sphere', r: 0.5, dir: 'sphere', speed: [2, 4], size: [0.06, 0.1], life: [0.4, 0.6], gravity: 14, drag: 0.8, color: CLAY, alpha: 0.95, alphaEnd: 0.5, spin: [-10, 10], inherit: 0.4 },
    { type: 'sprites', count: 8, shape: 'streak', spawn: 'sphere', r: 0.4, dir: 'sphere', speed: [5, 9], size: [0.1, 0.16], sizeEnd: 0.02, life: [0.12, 0.24], stretch: 1.6, drag: 4, gravity: 6, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', spawn: 'sphere', r: 0.5, dir: 'up', speed: [0.4, 1], size: [0.4, 0.6], sizeEnd: 1.3, life: [0.5, 0.8], drag: 2.5, color: 0xd8c0a0, alpha: 0.4, spin: [-1, 1] },
  ] },
  'skiff.hull.worn': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 5, dur: Infinity, shape: 'shard', spawn: 'sphere', r: 0.9, dir: 'up', speed: [0.2, 0.6], size: [0.06, 0.1], sizeEnd: 0.05, life: [0.5, 0.8], gravity: 10, color: GLAZE, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8], inherit: 0.7 },
    { type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.8, size: [0.25, 0.4], sizeEnd: 0.9, life: [0.4, 0.7], drag: 2, color: 0xc8b49a, alpha: 0.3, spin: [-1, 1], inherit: 0.6 },
  ] },
  'skiff.wreck': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 4.2, sizeEnd: 0.6, life: 0.24, color: 'white', colorEnd: LACHRYMA_TINT, powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.8, sizeEnd: 6, life: 0.4, color: LACHRYMA_TINT, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 1, shape: 'ring', size: 1, sizeEnd: 6.4, life: 0.45, color: LACHRYMA_DEEP, alpha: 0.85, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 14, shape: 'puff', spawn: 'disc', r: 1.4, dir: 'up', speed: [1, 3], size: [0.8, 1.2], sizeEnd: 3, life: [0.8, 1.3], drag: 2, gravity: -0.2, color: 0xe6c49a, alpha: 0.55, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: 30, shape: 'chip', spawn: 'sphere', r: 1, dir: 'sphere', speed: [4, 9], size: [0.08, 0.16], life: [0.5, 0.9], gravity: 12, drag: 0.8, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8] },
    { type: 'sprites', count: 16, shape: 'glint', spawn: 'sphere', r: 1, dir: 'sphere', speed: [2, 5], size: [0.2, 0.32], sizeEnd: 0, life: [0.4, 0.7], drag: 2, color: 'film', colorEnd: LACHRYMA_TINT },
    { type: 'light', color: LACHRYMA_TINT, range: 10, k: 14, dur: 0.45, up: 0.5 },
  ] },
  'skiff.wreck.mend': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 3.2, sizeEnd: 0.6, life: 0.3, color: 'white', colorEnd: GOLD, powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.8, sizeEnd: 4.4, life: 0.36, color: GOLD, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 18, shape: 'sparkle', spawn: 'disc', r: 1.6, dir: 'up', speed: [0.8, 2], size: [0.14, 0.24], sizeEnd: 0, life: [0.5, 0.9], drag: 1.5, color: ['white', GOLD], colorEnd: 'gold' },
    { type: 'light', color: GOLD, range: 7, k: 8, dur: 0.4, up: 0.4 },
  ] },
  'skiff.manual.drag': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 70, dur: Infinity, shape: 'chip', dir: 'cone', cone: 40, speed: [2, 4.5], size: [0.05, 0.1], life: [0.3, 0.55], gravity: 9, drag: 1, color: SAND, alpha: 0.9, alphaEnd: 0.5, spin: [-8, 8], inherit: 0.4 },
    { type: 'sprites', pool: 'alpha', rate: 16, dur: Infinity, shape: 'puff', dir: 'cone', cone: 50, speed: [0.6, 1.4], size: [0.3, 0.5], sizeEnd: 1.4, life: [0.5, 0.8], drag: 2.5, gravity: -0.1, color: 0xe8c8a0, alpha: 0.4, spin: [-1, 1], inherit: 0.3 },
    { type: 'sprites', rate: 12, dur: Infinity, shape: 'streak', dir: 'cone', cone: 30, speed: [4, 7], size: [0.08, 0.14], sizeEnd: 0.02, life: [0.12, 0.22], stretch: 1.6, drag: 3, gravity: 6, color: 'white', colorEnd: 'gold', inherit: 0.4 },
  ] },
  'raceway.buoy.pass': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.6, life: 0.24, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 1, sizeEnd: 4.2, life: 0.32, color: 'tint', alphaEnd: 0, powerCount: false },
    { type: 'sprites', count: 10, shape: 'glint', spawn: 'sphere', r: 0.6, dir: 'up', speed: [1.5, 3.5], size: [0.2, 0.3], sizeEnd: 0, life: [0.35, 0.55], drag: 2, color: 'white', colorEnd: GOLD },
    { type: 'light', color: GOLD, range: 8, k: 8, dur: 0.3, up: 0 },
  ] },
  'raceway.buoy.miss': { layers: [
    { type: 'sprites', pool: 'alpha', count: 5, shape: 'puff', spawn: 'sphere', r: 0.5, dir: 'up', speed: [0.3, 0.8], size: [0.4, 0.6], sizeEnd: 1.3, life: [0.5, 0.8], drag: 2, color: 0x8a8070, alpha: 0.45, spin: [-1, 1] },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 1, sizeEnd: 2.6, life: 0.3, color: 0x6e7a90, alpha: 0.5, alphaEnd: 0, powerCount: false },
  ] },
};
