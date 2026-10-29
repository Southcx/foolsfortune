// ---------------------------------------------------------------------------------------
// THE STATUS AURAS: a status shown round whatever has it, as long as it has it (`aura.<status>`, or `aura.<status>.<kind>` for one
// creature's own; held and sized by vfx/auras.js: centred on the creature, `scale` its height, `k` the status's strength fading out as it
// runs down). Offsets and sizes are in that height (feet: [0, -0.5, 0], head: [0, 0.5, 0]; a shape's with `offsetScale`). Quiet: an aura is
// read at a glance across a fight, never a show of its own, and many are held at once. Refreshed in the library's three tiers
// (docs/plans/art/VFX-LIBRARY.md 1 and 5):
//   PRIMARY    ONE shape a status, in a pattern of its own, scrolling slowly: sleep's breathing haze of cells at the head, halt's band
//              of frost all but still, slow's ripples crawling in at the feet, melt's and soaked's streaks running down, calm's still
//              water, soft's cushion lit at its edge, haste's speed lines, empower's gold rays rising, forget's words dissolving, doubt's
//              lattice that will not close, charm's ripples over the crown, blind's veil of ink at the eyes, confusion's wobbling curds
//   SECONDARY  the old stock's sprites that move (bubbles, diamonds, petals, streaks, swirls, hexes, glints)
//   TERTIARY   the old stock's sprites that linger (motes, drips, puffs, sparkles), no rate higher than it was
// Calm: low glow, soft edges (edgeV, a rim), eased in and out; a held shape erodes only a little (its pattern's faint parts clear), or
// breathes on a slow loop. The four a damage type builds (doubt, charm, blind, confusion) wear their type's colour and motif (docs/ART.md).
//
// Prior art: the status auras of Final Fantasy XIV and World of Warcraft (a looping effect on the target per buff and debuff, named by
// the status), Kingdom Hearts' sleep bubbles and stop-frost, Monster Hunter's status particles over a monster; Riot's ladder (a held,
// defensive look is the quietest: lower saturation and opacity, docs/ref/VFX-PRIOR-ART.md 2).
//
//   AURA_EFFECTS   'aura.<sleep|halt|slow|melt|calm|soft|haste|empower|forget|doubt|charm|blind|confusion|soaked>'
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)
const HELD = { dur: Infinity, offsetScale: true, in: 3, out: 2 }; // (every aura's shape: held, its offset in the creature's height, eased)

export const AURA_EFFECTS = {
  // a status, shown round whatever has it, as long as it has it: asleep, a drowsy haze breathing at the head, bubbles rising off it
  'aura.sleep': { layers: [
    // PRIMARY: a soft sphere of lilac cells at the head, breathing (its erosion rising and falling every 3.2 real s)
    L({ type: 'shape', form: 'sphere', ramp: 'tint', tint: 0xb8a8ff, main: 'cells', tile: [3, 2], scroll: [0.02, 0.12], mask: 'noise', maskK: 0.5, maskTile: [2, 1], maskScroll: [0, 0.1],
      ...HELD, loop: 3.2, scale: 0.3, offset: [0.05, 0.42, 0], rim: -0.6, erode: [[0, 0.38], [0.5, 0.16], [1, 0.38]], glow: 1.1, core: 0, in: 2 }),
    // SECONDARY: bubbles rising off it
    L({ type: 'sprites', dur: Infinity, rate: 2.5, shape: 'bubble', offset: [0.15, 0.55, 0], spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.25, 0.45], size: [0.07, 0.13], sizeEnd: 0.16, life: [1.4, 2], color: 0xd9c8ff, alpha: 0.85, alphaEnd: 0, drag: 0.6 }),
  ] },
  // halted: a band of frost standing round the body, all but still, frost diamonds glinting on it
  'aura.halt': { layers: [
    // PRIMARY: the band of frost, its needles creeping up a few centimetres a second (stopped, not frozen still)
    L({ type: 'shape', form: 'band', ramp: 'tint', tint: 0xbfe6ff, main: 'frost', tile: [3, 1], scroll: [0, 0.04], mask: 'noise', maskK: 0.45, maskTile: [2, 1], maskScroll: [0.02, 0],
      ...HELD, scale: 0.48, stretch: [1, 2, 1], offset: [0, -0.5, 0], edgeV: [0.08, 0.55], rim: -0.4, erode: 0.12, glow: 1.3, core: 0.3 }),
    // SECONDARY: diamonds of frost glinting on its shell
    L({ type: 'sprites', dur: Infinity, rate: 8, shape: 'diamond', spawn: 'shell', r: 0.55, size: [0.09, 0.16], sizeEnd: 0, life: [0.6, 1], color: [0xbfe6ff, 'white'], twinkle: 9, spin: [-2, 2] }),
  ] },
  // slowed: time dragging at its feet, motes sinking
  'aura.slow': { layers: [
    // PRIMARY: a ring at the feet, its ripples crawling inward, blue
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0x7fb2ff, main: 'ripple', tile: [4, 1], scroll: [0.03, -0.18], mask: 'noise', maskK: 0.4, maskScroll: [-0.02, 0],
      ...HELD, scale: 0.62, offset: [0, -0.48, 0], edgeV: [0.35, 0.35], erode: 0.08, glow: 1.3, core: 0.2 }),
    // TERTIARY: motes sinking slowly round it
    L({ type: 'sprites', dur: Infinity, rate: 3, shape: 'soft', spawn: 'sphere', r: 0.5, speed: [0.05, 0.1], size: [0.06, 0.1], life: [1, 1.6], color: 'blue', alpha: 0.5, gravity: 0.25 }),
  ] },
  // melting: the body's lower half running, drips falling off it, a breath of steam
  'aura.melt': { layers: [
    // PRIMARY: a band of streaks sliding down the lower body, wet clay, half stain and half sheen (add 0.35)
    L({ type: 'shape', form: 'band', ramp: 'tint', tint: 0xd9a07a, add: 0.35, main: 'streaks', tile: [5, 1], scroll: [0, -0.35], mask: 'noise', maskK: 0.5, maskTile: [2, 1], maskScroll: [0, -0.15],
      ...HELD, scale: 0.46, stretch: [1, 1.3, 1], offset: [0, -0.5, 0], edgeV: [0.1, 0.4], erode: 0.15, glow: 1.1, core: 0 }),
    // TERTIARY: drips falling to the ground, and a breath of steam
    L({ type: 'sprites', dur: Infinity, rate: 6, pool: 'alpha', shape: 'soft', offset: [0, 0.1, 0], spawn: 'sphere', r: 0.4, size: [0.06, 0.11], sizeEnd: 0.03, life: [0.5, 0.9], color: [0xd9a07a, 0xc47a55], alpha: 0.85, alphaEnd: 0.4, gravity: 5, floor: 'ground' }),
    L({ type: 'sprites', dur: Infinity, rate: 1, pool: 'alpha', shape: 'puff', offset: [0, 0.2, 0], spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.1, 0.3], size: 0.25, sizeEnd: 0.6, life: 1.2, color: 0xe8d2be, alpha: 0.3 }),
  ] },
  // calmed: still water at its feet, petals drifting round
  'aura.calm': { layers: [
    // PRIMARY: a ring of ripples at the feet spreading slowly outward, pale green
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0xb8e6c8, main: 'ripple', tile: [4, 1], scroll: [0.02, 0.12], mask: 'noise', maskK: 0.35, maskScroll: [0.03, 0],
      ...HELD, scale: 0.7, offset: [0, -0.48, 0], edgeV: [0.35, 0.35], erode: 0.08, glow: 1.2, core: 0.2 }),
    // SECONDARY: petals drifting round it
    L({ type: 'sprites', dur: Infinity, rate: 2, shape: 'petal', spawn: 'ring', r: 0.6, dir: 'swirl', lift: 0.3, speed: [0.3, 0.5], size: [0.07, 0.11], life: [1.4, 2], color: [0xb8e6c8, 0xf2d8e6], alpha: 0.85, spin: [-3, 3], gravity: 0.1 }),
  ] },
  // softened (the next blow doubled): a cushion round it, its pink puffs drifting
  'aura.soft': { layers: [
    // PRIMARY: a cushion of pink cloud round the body, lit at its edge (never over its middle), breathing every 2.6 real s
    L({ type: 'shape', form: 'sphere', ramp: 'tint', tint: 0xf2c8d8, add: 0.4, main: 'noise', tile: [3, 2], scroll: [0.03, 0.15], mask: 'cells', maskK: 0.4, maskTile: [2, 2], maskScroll: [0, 0.08],
      ...HELD, loop: 2.6, scale: 0.55, rim: 0.7, erode: [[0, 0.3], [0.5, 0.16], [1, 0.3]], glow: 1, core: 0 }),
    // TERTIARY: puffs of it drifting
    L({ type: 'sprites', dur: Infinity, rate: 1.2, pool: 'alpha', shape: 'puff', spawn: 'sphere', r: 0.45, speed: [0.05, 0.15], size: [0.2, 0.3], sizeEnd: 0.45, life: [0.9, 1.3], color: 0xf2c8d8, alpha: 0.4, spin: [-1, 1] }),
  ] },
  // hasted: speed lines racing up the body, ember to gold
  'aura.haste': { layers: [
    // PRIMARY: a band of speed lines racing up the body (rays, broken by a noise running up faster)
    L({ type: 'shape', form: 'band', ramp: 'ember', main: 'rays', tile: [4, 2], scroll: [0, 1.6], mask: 'noise', maskK: 0.5, maskTile: [3, 1], maskScroll: [0, 1.2],
      ...HELD, scale: 0.42, stretch: [1, 2.2, 1], offset: [0, -0.5, 0], edgeV: [0.1, 0.5], erode: 0.2, glow: 1.4, core: 0.3 }),
    // SECONDARY: streaks thrown up off it
    L({ type: 'sprites', dur: Infinity, rate: 8, shape: 'streak', offset: [0, -0.5, 0], spawn: 'column', r: 0.45, height: 0.9, dir: 'up', speed: [1.5, 2.6], size: [0.07, 0.11], sizeEnd: 0.01, life: [0.25, 0.4], stretch: 1.8, color: 'ember', colorEnd: 'gold' }),
  ] },
  // empowered: a column of gold rays rising round it, sparkles going up
  'aura.empower': { layers: [
    // PRIMARY: the column of gold rays, rising slowly
    L({ type: 'shape', form: 'band', ramp: 'gold', main: 'rays', tile: [3, 1], scroll: [0.03, 0.35], mask: 'noise', maskK: 0.45, maskTile: [2, 1], maskScroll: [0, 0.25],
      ...HELD, scale: 0.5, stretch: [1, 2.1, 1], offset: [0, -0.5, 0], edgeV: [0.05, 0.6], rim: -0.3, erode: 0.15, glow: 1.4, core: 0.3 }),
    // SECONDARY: gold sparkles going up it
    L({ type: 'sprites', dur: Infinity, rate: 6, shape: 'sparkle', offset: [0, -0.5, 0], spawn: 'column', r: 0.5, height: 1, dir: 'up', speed: [0.4, 0.8], size: [0.07, 0.12], sizeEnd: 0, life: [0.7, 1.1], color: 'gold', twinkle: 10 }),
  ] },
  // forgetting: the Mind's words turning over its head, dissolving and forming again
  'aura.forget': { layers: [
    // PRIMARY: a ring of the running hand over the head in the film, its words dissolving and forming again every 3 real s
    L({ type: 'shape', form: 'ring', ramp: 'film', main: 'script', tile: [5, 0.25], scroll: [0.05, 0], ...HELD, loop: 3, scale: 0.42, offset: [0, 0.55, 0], edgeV: [0.25, 0.25],
      erode: [[0, 0.55], [0.4, 0.1], [0.7, 0.1], [1, 0.55]], glow: 1.4, core: 0.2 }),
    // SECONDARY: the labradorite's swirls rising off it
    L({ type: 'sprites', dur: Infinity, rate: 2.2, shape: 'swirl', offset: [0, 0.55, 0], spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.1, 0.2], size: [0.15, 0.25], sizeEnd: 0.35, life: [1, 1.4], color: 'labradorite', alpha: 0.6, spin: [-3, 3] }),
  ] },
  // the four a damage type builds (progress/combat/types.js `builds`), each in its type's colour and motif (docs/ART.md: the damage types)
  'aura.doubt': { layers: [ // ego: a lapis lattice standing still round the head, that holds and will not close
    // PRIMARY: a ring of the lattice (cells) round the head, holding still (only its mask moves), a gap where its two ends fade
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0x3a6ae0, main: 'cells', tile: [10, 1], scroll: [0, 0], mask: 'noise', maskK: 0.4, maskTile: [3, 1], maskScroll: [0.04, 0],
      ...HELD, scale: 0.45, offset: [0, 0.42, 0], edgeV: [0.25, 0.25], edgeU: [0.12, 0.12], erode: 0.1, glow: 1.4, core: 0.3 }),
    // SECONDARY: hexes of it standing on the ring, coming and going
    L({ type: 'sprites', dur: Infinity, rate: 4, shape: 'hex', offset: [0, 0.35, 0], spawn: 'ring', r: 0.36, speed: 0, size: [0.14, 0.2], life: [1.2, 1.6], color: [0x3a6ae0, 0x6a96f0], alpha: 0.95, alphaEnd: 0, rot: 0 }),
  ] },
  'aura.charm': { layers: [ // influence: rose ripples over the crown, warm petals drifting round
    // PRIMARY: a ring of rose ripples over the crown, running out
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0xf08aa8, main: 'ripple', tile: [4, 1], scroll: [0, 0.3], mask: 'noise', maskK: 0.35, maskScroll: [0.04, 0],
      ...HELD, scale: 0.4, offset: [0, 0.58, 0], edgeV: [0.35, 0.35], erode: 0.08, glow: 1.4, core: 0.3 }),
    // SECONDARY: warm petals drifting round
    L({ type: 'sprites', dur: Infinity, rate: 4, shape: 'petal', offset: [0, 0.3, 0], spawn: 'ring', r: 0.5, dir: 'swirl', speed: [0.3, 0.5], size: [0.09, 0.13], life: [1.2, 1.8], color: [0xf4a6bc, 0xf2c86a], alpha: 0.9, spin: [-3, 3], gravity: 0.15 }),
  ] },
  'aura.blind': { layers: [ // illusion: a veil of ink over the eyes, the labradorite's glints turning across it
    // PRIMARY: a narrow band of marbled ink (alpha over) at the eyes, turning slowly round the head
    L({ type: 'shape', form: 'band', ramp: 'ink', add: 0, main: 'marble', tile: [2, 1], scroll: [0.08, 0.05], flow: 'noise', flowK: 0.06, mask: 'noise', maskK: 0.35, maskTile: [3, 1], maskScroll: [-0.05, 0],
      ...HELD, scale: 0.36, stretch: [1, 0.55, 1], offset: [0, 0.3, 0], edgeV: [0.35, 0.35], spin: 0.6, erode: 0.1, glow: 1, core: 0 }),
    // SECONDARY: the labradorite's glints turning across it
    L({ type: 'sprites', dur: Infinity, rate: 14, shape: 'glint', offset: [0, 0.42, 0], spawn: 'ring', r: 0.36, dir: 'swirl', lift: 0, speed: [0.6, 0.9], size: [0.12, 0.2], sizeEnd: 0, life: [0.4, 0.7], color: ['labradorite', 'white'], twinkle: 14 }),
  ] },
  'aura.confusion': { layers: [ // delirium: violet curds wobbling round the head, bubbles wandering, drips falling off it
    // PRIMARY: a ring of violet curds round the head, pushed about by a flow, turning one way while its pattern runs the other
    L({ type: 'shape', form: 'ring', ramp: 'tint', tint: 0x9a5ad0, main: 'curds', tile: [5, 1], scroll: [-0.15, 0.1], flow: 'noise', flowK: 0.1, flowScroll: [0.2, 0.5],
      ...HELD, scale: 0.38, offset: [0, 0.45, 0], edgeV: [0.3, 0.3], spin: 0.8, erode: 0.15, glow: 1.4, core: 0.2 }),
    // SECONDARY: violet-green bubbles wandering round; TERTIARY: drips falling off it
    L({ type: 'sprites', dur: Infinity, rate: 5, shape: 'bubble', offset: [0, 0.4, 0], spawn: 'ring', r: 0.3, dir: 'swirl', lift: 0.15, speed: [0.2, 0.45], size: [0.08, 0.13], sizeEnd: 0.17, life: [0.9, 1.4], color: [0x9a5ad0, 0x7ad08a], alpha: 0.85, alphaEnd: 0 }),
    L({ type: 'sprites', dur: Infinity, rate: 2, pool: 'alpha', shape: 'drip', offset: [0, 0.35, 0], spawn: 'sphere', r: 0.35, size: [0.05, 0.08], life: [0.6, 0.9], color: [0x6a3a90, 0x4a8a5a], alpha: 0.9, alphaEnd: 0.3, gravity: 3, floor: 'ground' }),
  ] },
  'aura.soaked': { layers: [ // soaked (the next hit doubled): wet through, water running off it and a cold sheen over it, its glyph's teal
    // PRIMARY: a band of streaks running down the body, a cold teal sheen
    L({ type: 'shape', form: 'band', ramp: 'tint', tint: 0x8fd0c8, main: 'streaks', tile: [6, 1], scroll: [0, -0.5], mask: 'noise', maskK: 0.45, maskTile: [2, 1], maskScroll: [0, -0.2],
      ...HELD, scale: 0.47, stretch: [1, 2.05, 1], offset: [0, -0.5, 0], edgeV: [0.08, 0.3], rim: -0.3, erode: 0.15, glow: 1.2, core: 0.2 }),
    // TERTIARY: drops running off it, and glints of its sheen
    L({ type: 'sprites', dur: Infinity, rate: 5, pool: 'alpha', shape: 'drip', offset: [0, 0.1, 0], spawn: 'sphere', r: 0.42, size: [0.05, 0.08], life: [0.5, 0.8], color: [0x8fd0c8, 0x5fa8b0], alpha: 0.9, alphaEnd: 0.4, gravity: 4, floor: 'ground' }),
    L({ type: 'sprites', dur: Infinity, rate: 3, shape: 'glint', offset: [0, 0.25, 0], spawn: 'shell', r: 0.4, size: [0.07, 0.11], sizeEnd: 0, life: [0.4, 0.6], color: [0xd8f4f0, 'white'], twinkle: 10 }),
  ] },
};
