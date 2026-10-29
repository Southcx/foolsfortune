// ---------------------------------------------------------------------------------------
// THE DAMAGE LOOKS: what a blow is made of, laid over its hit (vfx.hit's `type`: the hit says the tool and the material, this says the
// damage type), one colour and one motif per type along the Law-Chaos line, so the type reads with the HUD hidden and without colour
// vision (each has its own shape and lightness, not only its hue). Lawful: geometric, crystalline, straight, still. Chaotic: fluid,
// iridescent, curling, never at rest. The colours follow docs/ART.md section 1 (lightness and saturation carry the feeling, the hue the
// world's meaning). Refreshed in the library's three tiers (docs/plans/art/VFX-LIBRARY.md 1 and 5): each type's PRIMARY is one shape in
// its own pattern (impact's crazed diamond, ego's lattice ring, influence's ripples, illusion's curling film, delirium's curdled blot),
// its SECONDARY and TERTIARY the old stock's sprites (facets, diamonds, petals, glints, drips), the counts no higher than they were. A
// typed blow is its hit and this together: one shape here beside the hit's one (two on a kill).
//
// Prior art: Destiny's damage types (Arc's forks, Solar's flares, Void's spheres: a shape per colour), Persona's affinity icons, the
// elemental hit sparks of Monster Hunter; Riot's layering (a primary that reads in silhouette: docs/ref/VFX-PRIOR-ART.md 2).
//
//   DAMAGE_EFFECTS   'damage.impact' 'damage.ego' 'damage.influence' 'damage.illusion' 'damage.delirium'
//   DAMAGE_TINT      each type's colour, for a look that wears it beside its own motif (a blow's ring: vfx/blowfeel.js)
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)

export const DAMAGE_TINT = { impact: 0xf2e6c8, ego: 0xa8c0ff, influence: 0xf2a0b8, illusion: 0x38c78c, delirium: 0xd04ac0 };

export const DAMAGE_EFFECTS = {
  // IMPACT     lawful, physical: bone and gold; a square flash on its corner crazed like fired clay struck, facets thrown straight out
  'damage.impact': { layers: [
    // PRIMARY: the square flash stood to the eye on its corner, bone to gold, crazed through with cracks as it cools; held square, no turn
    L({ type: 'shape', form: 'quad', ramp: 'gold', main: 'cracks', mainK: 0.55, tile: [2, 2], scroll: [0, 0.4], mask: 'noise', maskK: 0.5, maskTile: [2, 2], maskScroll: [0.2, 0],
      dur: 0.2, scale: [[0, 0.3], [0.3, 0.95], [1, 1.1]], powerScale: true, rot: 0.785, edgeV: [0.32, 0.32], edgeU: [0.32, 0.32], erode: [[0, 0.2], [0.35, 0.22], [1, 1]],
      rampShift: [[0, 0.3], [0.4, 0.04], [1, -0.3]], core: 0.6, coreAt: 0.8, glow: 2 }),
    // SECONDARY: a thin ring out, and facets thrown straight out (cooling bone to gold)
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.0, life: 0.18, color: 0xf2e6c8, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: [7, 10], shape: 'facet', dir: 'cone', cone: 65, speed: [3, 7], size: [0.1, 0.16], sizeEnd: 0.03, life: [0.3, 0.45], drag: 4, gravity: 6, color: 0xf2e6c8, colorEnd: 'gold', spin: [-8, 8] }),
  ] },
  // EGO        lawful, mental: lapis; a hex lattice that opens and holds still, diamonds in an exact ring. A mind made rigid.
  'damage.ego': { layers: [
    // PRIMARY: a ring of the lattice (cells) opening at once and then holding still, lapis; only its mask moves, the cells dimming out
    // one by one through it
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'tint', tint: 0x6a8ef0, main: 'cells', tile: [12, 1], scroll: [0, 0], mask: 'noise', maskK: 0.6, maskTile: [3, 1], maskScroll: [0.25, 0],
      dur: 0.36, scale: [[0, 0.15], [0.22, 0.62], [1, 0.66]], powerScale: true, edgeV: [0.2, 0.2], erode: [[0, 0.2], [0.5, 0.1], [1, 1]], rampShift: [[0, 0.25], [0.3, 0], [1, -0.25]],
      core: 0.5, coreAt: 0.85, glow: 1.9 }),
    // SECONDARY: the lattice's heart, a hex opening, and diamonds thrown in an exact ring
    L({ type: 'sprites', count: 1, shape: 'hex', size: 0.25, sizeEnd: 1.2, life: 0.3, color: 0xa8c0ff, colorEnd: 0x3a5fd9, alpha: 1, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: 6, shape: 'diamond', spawn: 'ring', r: 0.25, dir: 'out', lift: 0, speed: 2.4, size: 0.12, sizeEnd: 0.03, life: 0.3, drag: 6, color: 0xa8c0ff, colorEnd: 0x3a5fd9, rot: 0 }),
  ] },
  // INFLUENCE  neutral, social: rose and warm gold; ripples spread slow and even, petals drift out. What spreads from one to many.
  'damage.influence': { layers: [
    // PRIMARY: a ring of ripples spreading slow and even, rose, its ripples running out with it
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'tint', tint: 0xf2a0b8, main: 'ripple', tile: [4, 1], scroll: [0, 0.8], mask: 'noise', maskK: 0.4, maskScroll: [0.1, 0.3],
      dur: 0.6, scale: [[0, 0.15], [1, 0.95]], powerScale: true, edgeV: [0.35, 0.35], erode: [[0, 0.2], [0.45, 0.22], [1, 1]], rampShift: [[0, 0.2], [1, -0.3]], core: 0.4, coreAt: 0.85, glow: 1.7 }),
    // SECONDARY: a second ripple behind it, warm gold; TERTIARY: petals drifting out
    L({ type: 'sprites', count: 1, shape: 'ripple', size: 0.2, sizeEnd: 1.1, life: 0.55, delay: 0.12, color: 0xffd7a8, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: [5, 7], shape: 'petal', dir: 'swirl', spawn: 'ring', r: 0.2, lift: 0.3, speed: [0.8, 1.4], size: [0.07, 0.1], life: [0.6, 0.9], drag: 2, color: [0xf2a0b8, 0xffd7a8], spin: [-4, 4] }),
  ] },
  // ILLUSION   chaotic, perceptual: the labradorite's flash; curls that turn, glints that will not hold still, a doubled sparkle.
  'damage.illusion': { layers: [
    // PRIMARY: a disc of the film's flash curling: its marbled bands warped by a flow and turning, never at rest
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'film', main: 'marble', tile: [2, 1], scroll: [0.6, -0.4], flow: 'noise', flowK: 0.14, flowTile: [2, 2], flowScroll: [0.3, 0.6], mask: 'noise', maskK: 0.4,
      dur: 0.42, scale: [[0, 0.2], [0.3, 0.55], [1, 0.7]], powerScale: true, spin: 6, edgeV: [0, 0.6], erode: [[0, 0.2], [0.4, 0.22], [1, 1]], rampShift: [[0, 0.15], [1, -0.3]],
      core: 0.3, coreAt: 0.9, glow: 1.9, turn: 'random' }),
    // SECONDARY: glints that will not hold still; a doubled sparkle
    L({ type: 'sprites', count: [6, 9], shape: 'glint', spawn: 'sphere', r: 0.45, speed: [0.2, 0.6], size: [0.1, 0.18], sizeEnd: 0, life: [0.3, 0.6], color: 'labradorite', twinkle: 26 }),
    L({ type: 'sprites', count: 2, shape: 'sparkle', spawn: 'shell', r: 0.18, size: 0.4, sizeEnd: 0.05, life: 0.22, color: 'labradorite' }),
  ] },
  // DELIRIUM   chaotic, entropic: ink and a sick violet-green; smoke that curls up, drips that fall, bubbles that burst. Things coming apart.
  'damage.delirium': { layers: [
    // PRIMARY: a curdled blot of violet coming apart, half light and half stain (add 0.5), wobbled by a flow, eroding fast
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'tint', tint: 0xd04ac0, add: 0.5, main: 'curds', tile: [2, 1], scroll: [0.2, 0.5], flow: 'noise', flowK: 0.12, flowScroll: [0.2, 0.7], mask: 'noise', maskK: 0.5,
      dur: 0.5, scale: [[0, 0.2], [0.3, 0.55], [1, 0.75]], powerScale: true, edgeV: [0, 0.55], erode: [[0, 0.2], [0.3, 0.22], [1, 1]], rampShift: [[0, 0.1], [1, -0.3]],
      core: 0.2, coreAt: 0.9, glow: 1.6, turn: 'random' }),
    // SECONDARY: drips of it falling; TERTIARY: ink curling up, bubbles bursting
    L({ type: 'sprites', count: [5, 7], shape: 'drip', spawn: 'sphere', r: 0.25, dir: 'cone', axis: 'up', cone: 70, speed: [0.5, 1.5], size: [0.06, 0.1], life: [0.5, 0.8], gravity: 7, color: [0xd04ac0, 0x8ae05a], colorEnd: 0x2a1438, floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.3, 0.6], size: [0.3, 0.4], sizeEnd: 0.8, life: [0.6, 0.9], drag: 2, color: 0x2a1438, alpha: 0.6, spin: [-1.5, 1.5] }),
    L({ type: 'sprites', count: [3, 5], shape: 'bubble', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.2, 0.5], size: [0.06, 0.1], sizeEnd: 0.14, life: [0.5, 0.8], color: [0xd04ac0, 0x8ae05a], alphaEnd: 0 }),
  ] },
};
