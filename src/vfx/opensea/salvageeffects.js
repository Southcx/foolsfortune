// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S SALVAGE AND BOTTLES, THEIR EFFECTS: the library's entries (vfx/library.js spreads them in) for the haul's moment and the
// drift bottle's glint (vfx/opensea/salvagelooks.js and bottlelooks.js play them) on the shared particle pools. Data only.
//   sea.salvage.rise          a crate breaking the surface: a ring on the crude, its dark drops thrown up and falling back
//   sea.salvage.drip          the crude running off it as it swings up to the deck (played every few tenths of a second on the way)
//   sea.salvage.land          set down on the deck: splinters and a breath of spray
//   sea.salvage.open.<tier>   its lid bursting open: the tier's light out of it (common the Lachryma's pale, uncommon teal, rare gold,
//                             legend the film's violet with a ring of its colours), motes rising, a short lamp
//   sea.salvage.part          a ship's part in it: gold shards turning up out of the light
//   sea.bottle.glint          the sun caught on a drift bottle's glass (a world mark: played every few real seconds, scaled by distance)
//   sea.bottle.cork           the cork drawn: a pop of spray and a glint
//
// Prior art: the house's dig (vfx/opensea/puzzleeffects.js: the find's glint, the warm light out of the lid); Zelda's chest; Sea of
// Thieves' loot light; a heliograph's flash off glass at sea.
// ---------------------------------------------------------------------------------------
const CRUDE = [0x1c1a24, 0x2a2638, 0x3a3450]; // (the crude's dark and its sheen, as it runs off)
const open = (color, more = []) => ({ layers: [
  { type: 'sprites', count: 1, shape: 'star4', size: 2.2, sizeEnd: 0.3, life: 0.4, color: 0xffffff, colorEnd: color, rot: 0.785 },
  { type: 'sprites', count: 1, shape: 'ringthin', size: 0.6, sizeEnd: 4.2, life: 0.5, color },
  { type: 'sprites', count: [16, 22], shape: 'glint', spawn: 'disc', r: 0.5, dir: 'cone', axis: 'up', cone: 30, speed: [1.2, 3.2], size: [0.1, 0.2], sizeEnd: 0.02, life: [0.9, 1.5], drag: 1.2, gravity: -0.6, color: [color, 0xffffff], twinkle: 12 },
  { type: 'light', color, k: 28, range: 14, dur: 0.9, up: 0.8 },
  ...more,
] });

export const SALVAGE_EFFECTS = {
  'sea.salvage.rise': { layers: [
    { type: 'sprites', count: 1, shape: 'ringthin', size: 1, sizeEnd: 5, life: 0.7, color: 0x6a6088 },
    { type: 'sprites', pool: 'alpha', count: [22, 30], shape: 'drip', spawn: 'disc', r: 0.8, dir: 'cone', axis: 'up', cone: 40, speed: [2.5, 5.5], size: [0.12, 0.24], life: [0.7, 1.1], gravity: 10, drag: 0.5, color: CRUDE, alpha: 1.2 },
    { type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'puff', spawn: 'disc', r: 0.8, dir: 'cone', axis: 'up', cone: 60, speed: [0.5, 1.2], size: [0.5, 0.8], sizeEnd: 1.8, life: [0.6, 1], drag: 2, color: 0x8a86a0, alpha: 0.35 },
  ] },
  'sea.salvage.drip': { layers: [
    { type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'drip', spawn: 'sphere', r: 0.6, dir: 'cone', axis: 'up', cone: 170, speed: [0, 0.4], size: [0.08, 0.16], life: [0.5, 0.8], gravity: 9, color: CRUDE, alpha: 1.1 },
  ] },
  'sea.salvage.land': { layers: [
    { type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'disc', r: 0.6, dir: 'cone', axis: 'up', cone: 60, speed: [1.5, 3.5], size: [0.05, 0.1], life: [0.5, 0.8], gravity: 10, drag: 0.6, color: [0x6a4428, 0x4a2e1a], spin: [-9, 9] },
    { type: 'sprites', pool: 'alpha', count: [8, 12], shape: 'drip', spawn: 'disc', r: 0.7, dir: 'cone', axis: 'up', cone: 70, speed: [1, 2.5], size: [0.08, 0.14], life: [0.5, 0.8], gravity: 10, color: CRUDE, alpha: 1 },
  ] },
  'sea.salvage.open.common': open(0x9fe8f0),
  'sea.salvage.open.uncommon': open(0x40d0c0),
  'sea.salvage.open.rare': open(0xf0cc6a),
  'sea.salvage.open.legend': open(0xb070d0, [
    { type: 'sprites', count: [18, 24], shape: 'sparkle', spawn: 'sphere', r: 0.6, dir: 'sphere', speed: [2, 4.5], size: [0.12, 0.22], sizeEnd: 0.02, life: [0.8, 1.3], drag: 2, color: [0x4c0eb3, 0x0a8cbf, 0xf2b82e, 0xd91a80], twinkle: 10 },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.8, sizeEnd: 6, life: 0.7, delay: 0.1, color: 0x0a8cbf },
  ]),
  'sea.salvage.part': { layers: [
    { type: 'sprites', count: [8, 12], shape: 'shard', spawn: 'disc', r: 0.3, dir: 'cone', axis: 'up', cone: 25, speed: [2, 3.5], size: [0.18, 0.3], sizeEnd: 0.08, life: [1, 1.4], drag: 1.5, gravity: -0.3, color: ['gold', 0xf0cc6a], spin: [-4, 4] },
    { type: 'sprites', count: 1, shape: 'star4', size: 3, sizeEnd: 0.4, life: 0.5, delay: 0.15, color: 0xfff2c8, colorEnd: 'gold', rot: 0 },
  ] },
  'sea.bottle.glint': { layers: [
    { type: 'sprites', count: 1, shape: 'star4', size: 0.5, sizeEnd: 0.05, life: 0.32, color: 0xffffff, colorEnd: 0xb8f0c8, rot: 0.3, powerSize: false },
    { type: 'sprites', count: 1, shape: 'soft', size: 0.35, sizeEnd: 0.1, life: 0.3, color: 0xd8ffe0, powerSize: false },
  ] },
  'sea.bottle.cork': { layers: [
    { type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'drip', dir: 'cone', axis: 'up', cone: 30, speed: [0.6, 1.4], size: [0.012, 0.025], life: [0.4, 0.6], gravity: 6, color: 0xc8e8d8, alpha: 0.9 },
    { type: 'sprites', count: 1, shape: 'star4', size: 0.12, sizeEnd: 0.01, life: 0.25, color: 0xffffff, colorEnd: 'gold', powerSize: false },
  ] },
};
