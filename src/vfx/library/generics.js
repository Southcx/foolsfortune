// ---------------------------------------------------------------------------------------
// THE GENERICS: the old stock's bursts every system borrows by name (most through the old particles' shims, vfx/particles.js: `impact`,
// `embers`, `absorb`, `implode`, `shock`, `cut`; and `poof`, `crystal.strike`), so every caller is unchanged and each is directed here.
// 'tint' is the caller's colour, 'tip' the hot one (PALETTE.hot); counts read the caller's own numbers (`sparks`, `dust`, `n`); `shock`
// takes its reach as `scale`. Refreshed in the library's three tiers (docs/plans/art/VFX-LIBRARY.md 1 and 5):
//   PRIMARY    one shape each where a sprite stood in for it (or where nothing did): impact's flash of rays out of the surface, the
//              shock's ring of the film, the poof's ball of smoke, absorb's ring closing in, implode's sphere drawn in and thrown open,
//              the embers' breath of heat, the cut's hot star at its middle, a crystal's oxide-bright glint
//   SECONDARY  the old stock's sparks, streaks, glints and facets, moving
//   TERTIARY   dust, wisps, motes and embers, lingering
// Each shape erodes through its own pattern as its ramp cools, never a plain fade, and no sprite count is higher than the old stock's.
//
// Prior art: the house's own bursts before the refresh (Phase 2's fold of vfx/particles.js into the library), Riot's three reads and
// Leroy's hit frame (docs/ref/VFX-PRIOR-ART.md 2: the hot point first, sparks next, motes last), the cartoon's disappearing puff.
//
//   GENERIC_EFFECTS   impact  shock  poof  absorb  implode  embers  cut  'crystal.strike'
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)

export const GENERIC_EFFECTS = {
  // a shot or a knock on a hard thing: a flash of rays out of the surface, hot sparks off it, a puff of its dust (and chips: particles.js)
  impact: { layers: [
    // PRIMARY: a shallow cone of rays stood out of the surface along its normal (its base on the surface, faded, so it never fights the
    // wall's depth), white-hot at its point cooling to ember, gone in a fifth of a second
    L({ type: 'shape', form: 'cone', face: 'dir', ramp: 'ember', main: 'rays', tile: [1, 1], scroll: [0.4, 0], mask: 'noise', maskK: 0.45, maskTile: [2, 1],
      dur: 0.18, scale: [[0, 0.06], [0.3, 0.26], [1, 0.32]], stretch: [1, 0.4, 1], edgeV: [0.55, 0], erode: [[0, 0.2], [0.3, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.45, 0], [1, -0.3]],
      core: 0.9, coreAt: 0.6, glow: 2.2, turn: 'random' }),
    // SECONDARY: hot sparks off it
    L({ type: 'sprites', count: 'sparks', shape: 'streak', dir: 'cone', axis: 'normal', cone: 70, speed: [4, 10], size: 0.05, sizeEnd: 0.01, life: [0.15, 0.35], stretch: 1.4, drag: 3, gravity: 9, color: 'tip', powerCount: false }),
    // TERTIARY: a puff of its dust, lingering
    L({ type: 'sprites', pool: 'alpha', count: 'dust', shape: 'puff', dir: 'cone', axis: 'normal', cone: 60, speed: [1, 2.5], size: 0.08, sizeEnd: 0.5, life: [0.6, 1.2], drag: 3.5, gravity: -0.2, color: 'tint', alpha: 0.45, powerCount: false }),
  ] },
  // a shockwave out of a feat of the Courier's power (the parry, a dive's landing, a charge's end, a bomb's pop, the Opening: fx.shockwave):
  // Lachryma's ring, not a white one. The oil film's hues banded across a ring running out, a band of crude's ink at its edge, one thin
  // ring walking its hue ('film0'..'film1': vfx/oxidation.js featTint, turned by the caller's `phase`, so successive shocks differ), and
  // a few motes of the film thrown off. `scale` is the reach in metres (the shape's outer edge reaches it; a thin ring's line sits at
  // 0.45 of its size, a ring's at 0.39: these sizes put both at the reach).
  shock: { layers: [
    // PRIMARY: the film's ring, its hues banded across it, its streaks running out as it reaches, eroding through them
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'film', main: 'streaks', tile: [10, 1], scroll: [0, 2], mask: 'noise', maskK: 0.45, maskTile: [4, 1], maskScroll: [0.1, 0.6],
      dur: 0.34, scale: [[0, 0.12], [0.5, 0.85], [1, 1.02]], edgeV: [0.4, 0.3], erode: [[0, 0.2], [0.4, 0.22], [1, 1]], rampShift: [[0, 0.2], [1, -0.3]], core: 0.4, coreAt: 0.85, glow: 2 }),
    // SECONDARY: crude's ink band at its edge (alpha over), and one thin ring of the film walking its hue
    L({ type: 'sprites', pool: 'alpha', count: 1, shape: 'ring', size: 2.6, life: 0.36, grow: 11, color: 'ink', alpha: 0.5, alphaEnd: 0, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 2.15, life: 0.3, grow: 12, color: 'film0', colorEnd: 'film1', alpha: 1, alphaEnd: 0, rot: 0, powerCount: false }),
    // TERTIARY: motes of the film thrown off, drifting to a stop
    L({ type: 'sprites', count: [6, 9], shape: 'sparkle', spawn: 'shell', r: 0.55, dir: 'out', speed: [1.5, 3], size: [0.12, 0.2], sizeEnd: 0, life: [0.35, 0.7], drag: 3.5, color: 'film', twinkle: 20, powerCount: false }),
  ] },
  // a thing gone in a puff: smoke that swells and lifts, a ring, a few stars (cartoon's disappearance)
  poof: { layers: [
    // PRIMARY: the puff itself, a ball of cream smoke (alpha over, soft at its edge) swelling, breaking up through its noise as it thins
    L({ type: 'shape', form: 'sphere', ramp: 'tint', tint: 0xf3e6d8, add: 0, main: 'noise', tile: [3, 2], scroll: [0.1, 0.5], mask: 'noise', maskK: 0.7, maskTile: [2, 2], maskScroll: [0, 0.3],
      dur: 0.65, scale: [[0, 0.2], [0.3, 0.6], [1, 0.85]], rim: -0.95, rimPow: 1.6, erode: [[0, 0.2], [0.35, 0.22], [1, 1]], rampShift: [[0, 0.1], [1, -0.2]], core: 0, glow: 1,
      k: [[0, 0], [0.08, 0.8], [1, 0.8]], turn: 'random' }),
    // SECONDARY: a ring out, and a few stars of the caller's colour
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.6, life: 0.3, color: 'white' }),
    L({ type: 'sprites', count: 5, shape: 'star4', dir: 'sphere', speed: [1.5, 3], size: [0.14, 0.2], sizeEnd: 0, life: [0.4, 0.6], drag: 3, color: 'tint', twinkle: 20 }),
    // TERTIARY: wisps of it lifting off
    L({ type: 'sprites', pool: 'alpha', count: 6, shape: 'puff', spawn: 'sphere', r: 0.25, dir: 'out', speed: [0.8, 1.8], size: [0.3, 0.45], sizeEnd: 0.9, life: [0.6, 0.9], drag: 3.5, gravity: -0.5, color: 0xf3e6d8, alpha: 0.7, spin: [-1.5, 1.5] }),
  ] },
  // a thing taken into the Courier: a ring closing in on where it went, its sparkle drawn in after it
  absorb: { layers: [
    // PRIMARY: a ring of the caller's colour closing in, its streaks drawn inward, brightening as it closes (the gather)
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'tint', main: 'streaks', tile: [8, 1], scroll: [0, -2.4], mask: 'noise', maskK: 0.4, maskScroll: [0.2, 0],
      dur: 0.26, scale: [[0, 0.42], [1, 0.04]], edgeV: [0.4, 0.35], erode: [[0, 0.2], [0.6, 0.22], [1, 1]], rampShift: [[0, -0.05], [0.7, 0.2], [1, 0.3]], core: 0.8, coreAt: 0.7, glow: 2 }),
    // SECONDARY: the sparkle, drawn in to the point from round it
    L({ type: 'sprites', count: 12, shape: 'glint', spawn: 'shell', r: 0.35, dir: 'in', speed: [1, 1.6], size: 0.06, sizeEnd: 0.008, life: [0.2, 0.32], drag: 1, color: ['tint', 'tip'], twinkle: 30, powerCount: false }),
  ] },
  // something collapsing inward and bursting: a sphere drawn in then thrown open, hot streaks out of it, a flash of light
  implode: { layers: [
    // PRIMARY: a sphere of heat drawn in (the gather, an eighth of a real second) then thrown open, white at its heart, eroding as it goes
    L({ type: 'shape', form: 'sphere', ramp: 'ember', main: 'noise', tile: [3, 2], scroll: [0, 1.2], mask: 'cells', maskK: 0.5, maskTile: [2, 2],
      dur: 0.6, scale: [[0, 1.1], [0.2, 0.12], [0.32, 0.9], [1, 1.6]], rim: 0.6, erode: [[0, 0.1], [0.2, 0.05], [0.35, 0.05], [1, 1]],
      rampShift: [[0, -0.1], [0.2, 0.35], [0.4, 0.1], [1, -0.35]], core: 0.8, coreAt: 0.75, glow: 2.4 }),
    // SECONDARY: the hot streaks of the burst, and its light, as it opens
    L({ type: 'sprites', at: 0.12, count: 70, shape: 'streak', dir: 'sphere', speed: [3, 12], size: 0.06, sizeEnd: 0.01, life: [0.4, 0.8], stretch: 1.2, drag: 2.5, color: ['tip', 'tint'], twinkle: 20, powerCount: false }),
    L({ type: 'light', at: 0.12, color: 'tint', k: 90, range: 16, dur: 0.3, up: 0 }),
  ] },
  // what a lantern or a fire leaves in the air: a breath of heat, embers rising out of it, twinkling, falling back
  embers: { layers: [
    // PRIMARY: the breath of heat they come off, a soft ball of ember light (soft at its edge, wobbling) swelling and going
    L({ type: 'shape', form: 'sphere', ramp: 'ember', main: 'noise', tile: [2, 2], scroll: [0, 0.8], flow: 'noise', flowK: 0.1, mask: 'noise', maskK: 0.4, maskTile: [3, 2], maskScroll: [0, 0.5],
      dur: 0.35, scale: [[0, 0.1], [0.3, 0.35], [1, 0.45]], offset: [0, 0.1, 0], rim: -0.7, erode: [[0, 0.2], [1, 1]], rampShift: [[0, 0.2], [1, -0.35]], core: 0.6, coreAt: 0.8, glow: 1.8 }),
    // SECONDARY and TERTIARY: the embers, thrown up and falling back, twinkling as they go
    L({ type: 'sprites', count: 'n', shape: 'soft', dir: 'sphere', speed: [1, 3.5], size: 0.05, sizeEnd: 0.015, life: [0.8, 2], drag: 1.2, gravity: 4, color: ['tip', 'tint'], twinkle: 12, powerCount: false, offset: [0, 0.1, 0] }),
  ] },
  // a cut through the air (the cutlass meeting something, the blade mode's planes, the god hand's slash): a seam of light along the
  // stroke, a hot star at its middle, glints thrown off it ('from' -> 'to' in the context: spawn 'line')
  cut: { layers: [
    // PRIMARY: the hot star at its middle, a disc of rays stood to the eye, white cooling to the caller's colour in a tenth of a second
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'tint', main: 'rays', tile: [1, 1], scroll: [0.5, 0], mask: 'noise', maskK: 0.4, maskTile: [2, 1],
      dur: 0.16, scale: [[0, 0.15], [0.3, 0.4], [1, 0.48]], edgeV: [0, 0.55], erode: [[0, 0.2], [0.35, 0.22], [1, 1]], rampShift: [[0, 0.3], [0.5, 0], [1, -0.3]],
      core: 1, coreAt: 0.5, glow: 2.4, turn: 'random' }),
    // SECONDARY: the seam of light along the stroke, streaks running along it
    L({ type: 'sprites', count: [14, 18], shape: 'streak', spawn: 'line', dir: 'line', speed: [0.6, 1.6], size: [0.12, 0.2], sizeEnd: 0.02, life: [0.14, 0.24], stretch: 2.2, drag: 6, color: 'white', colorEnd: 'tint' }),
    // TERTIARY: glints thrown off it, twinkling out
    L({ type: 'sprites', count: [10, 14], shape: 'glint', spawn: 'line', r: 0.1, speed: [0.5, 2], size: [0.08, 0.14], sizeEnd: 0, life: [0.25, 0.45], drag: 4, color: 'tint', twinkle: 28 }),
  ] },
  // a crystal formation struck with the pick: a hard glint, faceted shards of solid Lachryma knocked off, oxide-bright, glints after
  'crystal.strike': { layers: [
    // PRIMARY: the strike's glint, a star of rays in the film (Lachrymite's oxide-bright colours) crazed through with cracks, white for
    // its first tenth of a second
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'film', main: 'rays', tile: [1, 1], scroll: [0.3, 0], mask: 'cracks', maskK: 0.35, maskTile: [2, 1],
      dur: 0.2, scale: [[0, 0.15], [0.3, 0.5], [1, 0.6]], powerScale: true, edgeV: [0, 0.5], erode: [[0, 0.2], [0.35, 0.22], [1, 1]], rampShift: [[0, 0.35], [0.45, 0.05], [1, -0.3]],
      core: 0.9, coreAt: 0.55, glow: 2.4, turn: 'random' }),
    // SECONDARY: the facets knocked off, falling to the ground
    L({ type: 'sprites', count: [8, 12], shape: 'facet', dir: 'cone', cone: 70, speed: [2.5, 6], size: [0.07, 0.13], sizeEnd: 0.03, life: [0.4, 0.7], gravity: 9, drag: 1, color: ['lach', 'labradorite', 'gold'], spin: [-10, 10], floor: 'ground' }),
    // TERTIARY: the labradorite's glints hanging after it
    L({ type: 'sprites', count: [6, 9], shape: 'glint', spawn: 'sphere', r: 0.25, speed: [0.5, 1.5], size: [0.1, 0.16], sizeEnd: 0, life: [0.3, 0.55], color: 'labradorite', twinkle: 24 }),
  ] },
};
