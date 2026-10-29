// ---------------------------------------------------------------------------------------
// THE KIT'S DEMONSTRATIONS: three effects that prove the shape layer (vfx/shapes/layer.js) and show the next builders its idiom, each
// built in the three tiers of a readable effect and commented tier by tier:
//   PRIMARY    the hero: one shape with a clear silhouette, the brightest thing in it, there first (a dome, a band of rays, a wave);
//              a feeling's motif may be a thin one (Fury's cracks, Grief's streaks), so the hero lays it on a body (mainK 0.5)
//   SECONDARY  what supports it: rings, sweeps, sparks, the chant; quicker or thinner, never brighter than the hero
//   TERTIARY   what lingers: motes, dust, a ground glow, smoke; slow, faint, last to go
// Each is skinned by its caller's context: its ramps are 'feeling' (ctx.feeling's row), its main pattern 'motif' (the feeling's paint
// motif), its sprites 'feeling' (the same row's colour), so one definition serves all seven feelings; a class art's would read 'domain'.
// Seen with: node scripts/vfxgallery.mjs --match kit.demo --ctx '{"feeling":"fury"}'
//
// Prior art: Riot's VFX style guide for League of Legends (primary, secondary, tertiary: the silhouette first, the support, the
// ambience; value and saturation highest on the primary), the shape-language of a sixth-generation hit (vfx/library.js, docs/VFX.md).
//
//   KIT_DEMO_EFFECTS   'kit.demo.burst' (a one-shot)   'kit.demo.aura' (held: h.stop())   'kit.demo.wave' (a one-shot along ctx.dir)
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)

export const KIT_DEMO_EFFECTS = {
  // a burst out of the ground: a dome blooms, a ring races out, sparks fly, motes drift up after
  'kit.demo.burst': { layers: [
    // PRIMARY: a dome of the feeling's motif blooming up out of the ground, lit at its rim, breaking up through its noise as it cools
    L({ type: 'shape', form: 'dome', ramp: 'feeling', main: 'motif', mainK: 0.55, tile: [3, 2], scroll: [0, 0.7], mask: 'noise', maskTile: [2, 1], maskScroll: [0.1, 0.4],
      dur: 0.9, scale: [[0, 0.35], [0.3, 1.6], [1, 2]], stretch: [1, [[0, 0.45], [0.35, 1.05], [1, 0.9]], 1], erode: [[0, 0], [0.3, 0.04], [1, 1]],
      rampShift: [[0, 0.25], [0.3, 0.05], [1, -0.35]], rim: 0.7, glow: 2.2, core: 0.8, turn: 'random' }),
    // PRIMARY (its heart): a white-hot sphere at its middle, gone in a third of a second
    L({ type: 'shape', form: 'sphere', ramp: 'white', main: 'cells', tile: [2, 2], dur: 0.32, scale: [[0, 0.25], [1, 0.95]], offset: [0, 0.55, 0], rim: -0.6, glow: 2.6, erode: [[0, 0], [1, 1]], turn: 'random' }),
    // SECONDARY: a shock ring on the ground racing out, its streaks running outward
    L({ type: 'shape', form: 'ring', ramp: 'feeling', main: 'streaks', tile: [8, 1], scroll: [0, 1.6], dur: 0.5, scale: [[0, 0.4], [1, 3.4]], offset: [0, 0.04, 0],
      edgeV: [0.6, 0.15], erode: [[0, 0], [0.4, 0.1], [1, 1]], glow: 2, turn: 'random' }),
    // SECONDARY: sparks thrown out and up, in the feeling's colour, stretched along their flight
    L({ type: 'sprites', count: [18, 24], shape: 'streak', spawn: 'sphere', r: 0.3, offset: [0, 0.4, 0], dir: 'cone', axis: 'up', cone: 70, speed: [5, 10], size: [0.12, 0.2], sizeEnd: 0.03,
      life: [0.3, 0.55], drag: 4, gravity: 6, stretch: 1.8, color: 'white', colorEnd: 'feeling' }),
    // TERTIARY: motes drifting up after it, slow and faint
    L({ type: 'sprites', at: 0.1, count: [14, 18], shape: 'sparkle', spawn: 'disc', r: 1.4, dir: 'up', speed: [0.4, 1.1], size: [0.06, 0.12], sizeEnd: 0, life: [1.2, 1.8],
      drag: 1, gravity: -0.4, color: 'feeling', alpha: 0.85, twinkle: 12 }),
    // TERTIARY: a glow left on the ground, marbled, fading through its pattern
    L({ type: 'shape', form: 'disc', ramp: 'feeling', main: 'marble', tile: [2, 1], scroll: [0.05, 0.1], at: 0.05, dur: 1.6, scale: 2.2, offset: [0, 0.02, 0], glow: 0.9, core: 0,
      erode: [[0, 0.1], [0.4, 0.2], [1, 1]], rampShift: [[0, -0.05], [1, -0.3]], k: [[0, 0], [0.15, 0.7], [1, 0.7]], turn: 'random' }),
  ] },

  // an aura held round a body: a column of rays, a thinner one turning against it, the chant round the feet, a spiral rising, motes
  'kit.demo.aura': { layers: [
    // PRIMARY: a band of rays round the body, scrolled up, its top dissolving through a noise mask, shimmering in a flow
    L({ type: 'shape', form: 'band', ramp: 'feeling', main: 'rays', tile: [3, 1], scroll: [0.04, 0.5], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.7], flow: 'noise', flowK: 0.05,
      dur: Infinity, scale: 0.75, stretch: [1, 2.6, 1], edgeV: [0.04, 0.7], rim: -0.35, erode: 0.12, glow: 1.9, in: 4, out: 3 }),
    // PRIMARY (its inner wall): thinner, turning the other way, its streaks quicker
    L({ type: 'shape', form: 'band', ramp: 'feeling', main: 'streaks', tile: [4, 1], scroll: [0, 0.9], dur: Infinity, scale: 0.5, stretch: [1, 2.1, 1], spin: -0.9,
      edgeV: [0.05, 0.6], erode: 0.18, glow: 1.6, core: 0.4, in: 4, out: 3 }),
    // SECONDARY: the chant: the running hand scrolled round the feet on a ring
    L({ type: 'shape', form: 'ring', ramp: 'feeling', main: 'script', tile: [6, 0.25], scroll: [0.06, 0], dur: Infinity, scale: 1.25, offset: [0, 0.03, 0], edgeV: [0.2, 0.2],
      glow: 1.7, core: 0.3, in: 3, out: 3 }),
    // SECONDARY: a spiral ribbon rising and dissolving, then forming again every two real seconds
    L({ type: 'shape', form: 'spiral', ramp: 'feeling', main: 'noise', tile: [4, 1], scroll: [0.6, 0], dur: Infinity, loop: 2, scale: 0.9, stretch: [1, 2.3, 1], spin: 2.4,
      erode: [[0, 0.7], [0.3, 0.12], [0.7, 0.12], [1, 0.7]], rampShift: [[0, -0.1], [0.5, 0.1], [1, -0.1]], glow: 1.7, in: 3, out: 3 }),
    // TERTIARY: motes rising round it
    L({ type: 'sprites', rate: 16, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: 0.7, dir: 'up', speed: [0.5, 1.3], size: [0.05, 0.1], sizeEnd: 0, life: [1, 1.6],
      drag: 0.5, color: 'feeling', alpha: 0.9, twinkle: 10 }),
    // TERTIARY: a soft glow pooled on the ground under it
    L({ type: 'shape', form: 'disc', ramp: 'feeling', main: 'cells', tile: [3, 1], scroll: [0.03, 0.15], dur: Infinity, scale: 1.4, offset: [0, 0.02, 0], glow: 0.8, core: 0,
      erode: 0.1, rampShift: -0.15, in: 2, out: 2 }),
  ] },

  // a wave pushed out along the blow (ctx.dir): a wall of the motif, a crescent sweep under it, dust, smoke and motes left behind
  'kit.demo.wave': { layers: [
    // PRIMARY: a wall of the feeling's motif pushed forward, low and widening as it goes, flowing, eroding from its top
    L({ type: 'shape', form: 'wave', ramp: 'feeling', main: 'motif', mainK: 0.5, tile: [3, 1], scroll: [0, 1.2], mask: 'noise', maskScroll: [0, 0.8], flow: 'noise', flowK: 0.06,
      dur: 0.85, scale: [[0, 0.5], [1, 4.2]], stretch: [1, [[0, 1.5], [1, 0.45]], 1], erode: [[0, 0], [0.35, 0.05], [1, 1]], glow: 2.1, core: 0.7 }),
    // SECONDARY: a crescent swept flat on the ground under it, its cracks running out
    L({ type: 'shape', form: 'crescent', face: 'heading', ramp: 'feeling', main: 'noise', tile: [3, 1], scroll: [0, 0.6], mask: 'motif', maskK: 0.5, maskTile: [2, 1], dur: 0.6, scale: [[0, 0.6], [1, 4]], offset: [0, 0.03, 0],
      erode: [[0, 0], [0.3, 0.06], [1, 1]], glow: 1.8 }),
    // SECONDARY: dust thrown forward off the ground
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'puff', spawn: 'disc', r: 0.6, dir: 'cone', cone: 30, speed: [3, 6], size: [0.4, 0.6], sizeEnd: 1.2, life: [0.6, 0.9],
      drag: 3, gravity: -0.3, color: 0xcbb8a4, alpha: 0.4, spin: [-1, 1] }),
    // TERTIARY: a puff of ink drifting up where it began (an alpha-over shape: the ink ramp, add 0)
    L({ type: 'shape', form: 'quad', ramp: 'ink', add: 0, main: 'noise', tile: [1, 1], scroll: [0, 0.3], mask: 'noise', maskTile: [2, 2], maskScroll: [0.05, 0.2], dur: 1.4, scale: [[0, 0.8], [1, 2.2]], offset: [0, 0.9, 0],
      erode: [[0, 0.15], [0.5, 0.3], [1, 1]], rampShift: [[0, 0], [1, -0.2]], k: [[0, 0], [0.15, 0.55], [1, 0.4]], turn: 'random' }),
    // TERTIARY: motes left in its wake
    L({ type: 'sprites', at: 0.15, count: [12, 16], shape: 'soft', spawn: 'disc', r: 2, dir: 'up', speed: [0.2, 0.6], size: [0.05, 0.1], sizeEnd: 0, life: [1, 1.6], color: 'feeling', alpha: 0.8, twinkle: 8 }),
  ] },
};
