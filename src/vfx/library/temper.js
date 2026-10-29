// ---------------------------------------------------------------------------------------
// TEMPER'S LOOKS: a creature's mental state and agitation shown with its body, never in words (held by vfx/temper.js on the creature:
// centred on it, `scale` its height, `k` how far it is into that state). Quiet at the middle; only the ends (Stoic, Prismatic) and the
// heat (agitated, enraged) have a look of their own. Offsets in the creature's height (a shape's with `offsetScale`). Refreshed in the
// library's three tiers (docs/plans/art/VFX-LIBRARY.md 1 and 5):
//   PRIMARY    one shape on the body: Stoic's dry crazing, all but still; Prismatic's film running down it like oil on water; agitated's
//              heat shimmer rising off it; enraged's hard rings pulsing out from its feet (one every 0.62 real s, as the old rings did)
//   SECONDARY  the old stock's sprites that move (flakes, glints, sparks, steam)
//   TERTIARY   the old stock's sprites that linger (dust, drips, motes), no rate higher than it was
//
// Prior art: Shadow of the Colossus's and Monster Hunter's tells (a monster shows its rage with its body: steam, glow, posture, never a
// bar), Okami's and Ico's restraint, the iridescent "oil on water" of Lisa Frank over Moebius for the liquid end (vfx/temper.js); the
// shape layer's held band and pulsing ring (vfx/library/kitdemo.js).
//
//   TEMPER_EFFECTS   'temper.stoic' 'temper.prismatic' 'temper.agitated' 'temper.enraged'
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)
const HELD = { dur: Infinity, offsetScale: true, in: 3, out: 2 }; // (each look's shape: held, its offset in the creature's height, eased)

export const TEMPER_EFFECTS = {
  // a creature's mental state and agitation shown with its body; quiet at the middle, only the ends and the heat have a look of their own
  'temper.stoic': { layers: [ // dry: the surface crazed and chalky, flakes of it falling, a little dust at the feet
    // PRIMARY: a band of crazing on a chalky film over the body, half stain (add 0.3), all but still
    L({ type: 'shape', form: 'band', ramp: 'tint', tint: 0xd9cfc2, add: 0.3, main: 'cracks', tile: [4, 1], scroll: [0, -0.02], mask: 'noise', maskK: 0.45, maskTile: [2, 1], maskScroll: [0.02, 0],
      ...HELD, scale: 0.5, stretch: [1, 2, 1], offset: [0, -0.5, 0], edgeV: [0.1, 0.4], erode: 0.1, glow: 0.9, core: 0 }),
    // SECONDARY: flakes of the fired surface falling; TERTIARY: a little dust at the feet
    L({ type: 'sprites', dur: Infinity, rate: 2.5, pool: 'alpha', shape: 'facet', spawn: 'shell', r: 0.45, speed: [0.05, 0.15], size: [0.05, 0.08], life: [0.8, 1.2], gravity: 2, color: [0xc8beb0, 0xa89e90], alphaEnd: 0.6, spin: [-3, 3], floor: 'ground' }),
    L({ type: 'sprites', dur: Infinity, rate: 0.8, pool: 'alpha', shape: 'puff', offset: [0, -0.48, 0], spawn: 'disc', r: 0.35, speed: [0.05, 0.15], dir: 'up', size: 0.2, sizeEnd: 0.45, life: 1.2, color: 0xd9cfc2, alpha: 0.35 }),
  ] },
  'temper.prismatic': { layers: [ // liquid: the surface runs with the labradorite's colours, drips fall from it
    // PRIMARY: a band of the film's marbling running down the body, wobbling in a flow, lit at its silhouette like a wet sheen
    L({ type: 'shape', form: 'band', ramp: 'film', main: 'marble', tile: [2, 1], scroll: [0.02, -0.15], flow: 'noise', flowK: 0.08, flowScroll: [0, -0.3], mask: 'noise', maskK: 0.4, maskTile: [2, 1],
      ...HELD, scale: 0.5, stretch: [1, 2, 1], offset: [0, -0.5, 0], edgeV: [0.08, 0.5], rim: 0.5, erode: 0.2, glow: 1.3, core: 0.2 }),
    // SECONDARY: the labradorite's glints on its surface; TERTIARY: drips of colour falling off it
    L({ type: 'sprites', dur: Infinity, rate: 7, shape: 'glint', spawn: 'shell', r: 0.48, speed: [0, 0.1], size: [0.08, 0.14], sizeEnd: 0, life: [0.3, 0.6], color: 'labradorite', twinkle: 18 }),
    L({ type: 'sprites', dur: Infinity, rate: 2, shape: 'drip', spawn: 'shell', r: 0.4, speed: 0.05, size: [0.05, 0.08], life: [0.6, 0.9], gravity: 4, color: 'labradorite', floor: 'ground' }),
  ] },
  'temper.agitated': { layers: [ // heat: a shimmer rising off it, steam off the top, warm motes
    // PRIMARY: heat off the body, a faint band of ember shimmer rising (a noise wobbled by a flow, masked by streaks running up)
    L({ type: 'shape', form: 'band', ramp: 'ember', main: 'noise', tile: [3, 1], scroll: [0, 0.6], flow: 'noise', flowK: 0.1, mask: 'streaks', maskK: 0.5, maskTile: [4, 1], maskScroll: [0, 0.9],
      ...HELD, scale: 0.48, stretch: [1, 2.4, 1], offset: [0, -0.2, 0], edgeV: [0.15, 0.7], erode: 0.3, glow: 1.1, core: 0 }),
    // SECONDARY: steam off the top; TERTIARY: warm motes rising
    L({ type: 'sprites', dur: Infinity, rate: 3, pool: 'alpha', shape: 'puff', offset: [0, 0.4, 0], spawn: 'disc', r: 0.25, dir: 'up', speed: [0.4, 0.8], size: [0.15, 0.22], sizeEnd: 0.5, life: [0.7, 1], drag: 1, color: 0xf2ece4, alpha: 0.4, spin: [-1, 1] }),
    L({ type: 'sprites', dur: Infinity, rate: 6, shape: 'soft', spawn: 'shell', r: 0.45, dir: 'up', speed: [0.3, 0.6], size: [0.05, 0.08], sizeEnd: 0, life: [0.5, 0.8], color: 'ember', alpha: 0.8 }),
  ] },
  'temper.enraged': { layers: [ // rage: hard red-gold rings pulsing out from it, sparks thrown off
    // PRIMARY: a ring of rays out from the feet, ember cooling to red, one every 0.62 real s, gone through its rays before the next
    L({ type: 'shape', form: 'ring', ramp: 'ember', main: 'rays', tile: [1, 1], scroll: [0.2, 0.8], mask: 'noise', maskK: 0.4, maskTile: [3, 1],
      ...HELD, loop: 0.62, scale: [[0, 0.3], [1, 1.25]], offset: [0, -0.48, 0], edgeV: [0.3, 0.35], erode: [[0, 0.2], [0.5, 0.15], [1, 1]], rampShift: [[0, 0.2], [1, -0.25]], glow: 1.8, core: 0.4 }),
    // SECONDARY: sparks thrown off it, gold cooling to red
    L({ type: 'sprites', dur: Infinity, rate: 12, shape: 'streak', spawn: 'shell', r: 0.4, dir: 'out', lift: 0.6, speed: [2, 4], size: [0.05, 0.08], sizeEnd: 0.01, life: [0.25, 0.4], stretch: 1.6, gravity: 5, color: 'gold', colorEnd: 0xff3a1a }),
  ] },
};
