// ---------------------------------------------------------------------------------------
// THE CAVERN'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the Raceway's cavern (vfx/racewaycavern.js plays
// them) on the shared particle pools. Data only: the numbers are the look.
//   raceway.vein     a crystal vein ridden over (skiff.plate on a vein): Lachryma's flash and a ring along the stone, shards of
//                    Lachrymite kicked up, motes in the oil film's colours running the race's way (`dir`), a short cold light
//
// Prior art: the sun plate's own ring (vfx/racewayeffects.js raceway.plate: the same grammar, in Lachryma's colour, not the sun's),
// F-Zero's dash plates (the push said by a flash running the way to go), and the house's crystal strike (vfx/library.js: the facets
// of Lachrymite thrown off a struck formation).
// ---------------------------------------------------------------------------------------
const LACH = 0x7fdcff; // (Lachryma's colour: the boost's and the perfect pop's, courier/skiff/skiff.js LACHRYMA_TINT)

export const RACEWAY_CAVERN_EFFECTS = {
  'raceway.vein': { layers: [
    { type: 'decal', tex: 'shockring', dur: 0.5, scale: [[0, 2], [1, 9]], tint: LACH, glow: 1.8, offset: [0, 0.12, 0], k: [[0, 1], [0.4, 0.7], [1, 0]] },
    { type: 'sprites', count: 1, shape: 'core', size: 3.2, sizeEnd: 0.6, life: 0.24, color: 'white', colorEnd: LACH, powerCount: false },
    { type: 'sprites', count: [10, 14], shape: 'facet', spawn: 'disc', r: 1.6, dir: 'up', speed: [2.5, 5], size: [0.08, 0.14], sizeEnd: 0.03, life: [0.4, 0.7], gravity: 9, drag: 1, color: [LACH, 'white', 'film'], spin: [-10, 10], floor: 'ground' },
    { type: 'sprites', count: [16, 20], shape: 'sparkle', spawn: 'disc', r: 1.2, dir: 'cone', cone: 25, speed: [6, 11], size: [0.12, 0.2], sizeEnd: 0, life: [0.3, 0.5], drag: 2.5, color: ['film', LACH, 'white'] },
    { type: 'light', color: LACH, range: 12, k: 22, dur: 0.5, up: 1 },
  ] },
};
