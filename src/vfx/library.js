// ---------------------------------------------------------------------------------------
// THE VFX LIBRARY: every effect in the game, by the name of what happened (vfx/vfx.js reads it; the layer types and their numbers are
// documented there). This file is the one place the look is tuned: change a number here and every place that plays the effect follows.
// A name is found from the most particular to the least (`hit.slash.crystal` -> `hit.slash` -> `hit`), and `extends` gives a family a
// base. The house rules (docs/LOOK.md):
//   - LAYERED. An effect is several things at once at different sizes and speeds: a core flash, a shape, sparks, something that
//     lingers, something that drifts down; and screen weight (hitstop, shake, light) in proportion to what happened.
//   - THE MATERIAL SPEAKS. What flies off says what was struck: clay chips and dust, crystal shards and glints, jelly bubbles and goo.
//   - THE MIND IS LABRADORITE, LACHRYMA IS GOLD AND VIOLET, the clay is warm (the palette's named colours: gold, lach, ember, lab).
//   - NO FLICKER: a flash is one wash in and out; nothing large beats at a rate.
// ---------------------------------------------------------------------------------------
const L = (o) => o; // (a layer: only for readability)

export const LIBRARY = {
  // =============================================================================================== HITS (the start of combat's)
  // what every blow shows, whatever struck what: a hot core, a star, sparks thrown along the blow
  hit: { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: [0.55, 0.65], sizeEnd: 0.1, life: 0.12, color: 'white', alpha: 1, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.9, sizeEnd: 0.2, life: 0.16, color: 'tint', colorEnd: 'white', grow: 60 }),
    L({ type: 'sprites', count: [7, 10], shape: 'streak', dir: 'cone', cone: 55, speed: [5, 11], size: [0.14, 0.22], sizeEnd: 0.03, life: [0.14, 0.26], drag: 7, stretch: 1.6, color: 'white', colorEnd: 'tint' }),
    L({ type: 'hitstop', dur: 0.045 }),
    L({ type: 'shake', k: 0.12 }),
  ] },
  // a blunt blow: a ring knocked out flat, and dust
  'hit.blunt': { extends: 'hit', layers: [
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 1.4, life: 0.22, color: 'tint', alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', dir: 'cone', cone: 80, speed: [0.6, 1.6], size: [0.3, 0.45], sizeEnd: 0.8, life: [0.4, 0.6], drag: 3, gravity: -0.4, color: 0xd9b89a, alpha: 0.55, spin: [-1, 1] }),
  ] },
  // a cutting blow: a crescent along the cut, and sparks thrown wide either side of it
  'hit.slash': { extends: 'hit', layers: [
    L({ type: 'sprites', count: 1, shape: 'crescent', size: 1.1, sizeEnd: 1.5, life: 0.16, color: 'tint', colorEnd: 'white', spin: 6 }),
    L({ type: 'sprites', count: [8, 12], shape: 'glint', dir: 'cone', cone: 85, speed: [2, 5], size: [0.2, 0.35], sizeEnd: 0, life: [0.2, 0.35], drag: 5, color: 'white', twinkle: 30 }),
  ] },
  // what clay gives up: chips of it, falling, and a puff of its dust
  'hit.blunt.clay': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'chip', dir: 'cone', cone: 60, speed: [3, 6], size: [0.07, 0.13], life: [0.6, 0.9], gravity: 14, drag: 1, color: [0xb4603f, 0x8c4a33, 0xc46a45], alpha: 1, alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
  ] },
  'hit.slash.clay': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'chip', dir: 'cone', cone: 70, speed: [3, 6], size: [0.06, 0.1], life: [0.6, 0.9], gravity: 14, drag: 1, color: [0xb4603f, 0xc46a45], alpha: 1, alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
  ] },
  // crystal rings and splinters: shards and glints in the stone's colours
  'hit.blunt.crystal': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'shard', dir: 'cone', cone: 70, speed: [3, 7], size: [0.12, 0.22], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 8, drag: 1.5, color: 'lab', spin: [-10, 10] }),
    L({ type: 'sprites', count: [4, 6], shape: 'sparkle', spawn: 'sphere', r: 0.4, size: [0.2, 0.35], sizeEnd: 0, life: [0.4, 0.7], color: 'lab', twinkle: 18, delay: [0, 0.15] }),
  ] },
  'hit.slash.crystal': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'shard', dir: 'cone', cone: 80, speed: [3, 7], size: [0.12, 0.2], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 8, drag: 1.5, color: 'lab', spin: [-10, 10] }),
  ] },
  // jelly: bubbles that float off, drops of its goo that fall
  'hit.blunt.jelly': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'bubble', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.4, 1.2], size: [0.1, 0.22], sizeEnd: 0.28, life: [0.6, 1.1], drag: 1, color: 0xbfe8ff, alpha: 0.9 }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'soft', dir: 'cone', cone: 70, speed: [2, 4], size: [0.1, 0.16], life: [0.5, 0.8], gravity: 12, color: 0x8fd0ff, alpha: 0.9, alphaEnd: 0.6, floor: 'ground' }),
  ] },
  'hit.slash.jelly': { extends: 'hit.blunt.jelly' },

  // =============================================================================================== POOFS
  // a thing gone in a puff: smoke that swells and lifts, a ring, a few stars (cartoon's disappearance)
  poof: { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'sphere', r: 0.25, dir: 'out', speed: [0.8, 1.8], size: [0.35, 0.5], sizeEnd: 0.9, life: [0.5, 0.8], drag: 3.5, gravity: -0.5, color: 0xf3e6d8, alpha: 0.8, spin: [-1.5, 1.5] }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.6, life: 0.3, color: 'white' }),
    L({ type: 'sprites', count: 5, shape: 'star4', dir: 'sphere', speed: [1.5, 3], size: [0.14, 0.2], sizeEnd: 0, life: [0.4, 0.6], drag: 3, color: 'tint', twinkle: 20 }),
  ] },

  // =============================================================================================== CHESTS (vfx/chestfx.js)
  // the circle under a chest as it charges (held: its strength is the charge), the whirling mandala
  'chest.sigil': { layers: [
    L({ type: 'decal', tex: 'circle_swirl', dur: Infinity, scale: 2.4, tint: 'tint', lab: 0.1, glow: 1.5, spin: 0.8, offset: [0, 0.04, 0], in: 5, out: 2.5 }),
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 3.4, tint: 'tint', lab: 0.25, glow: 1.0, spin: -0.3, offset: [0, 0.035, 0], in: 4, out: 2.5 }),
  ] },

  // =============================================================================================== THE LOCKHEART'S OPENING
  // (lockheart/ultimate.js plays these; the owner's gold standard for a cinematic event: too much, on purpose)
  // the invocation, held while it lasts: the whirl on the ground, motes drawn in from all round, glints rising off the circle
  'ult.invoke': { layers: [
    // the circles the owner's wife drew (source_assets/circles/): the lotus mandala under the Courier, the whirling one inside it
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 7, tint: 'gold', lab: 0.15, glow: 0.7, spin: 0.22, offset: [0, 0.05, 0], in: 2.2, out: 2 }),
    L({ type: 'decal', tex: 'circle_swirl', dur: Infinity, scale: 4.2, tint: 'lach', lab: 0.85, glow: 0.8, spin: -0.7, offset: [0, 0.07, 0], in: 1.6, out: 2 }),
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 2, tint: 'white', lab: 0.4, glow: 0.6, spin: 1.4, offset: [0, 0.09, 0], in: 1.2, out: 2 }),
    L({ type: 'mesh', mesh: 'ult_vortex', dur: Infinity, scale: 1.25, tint: 'lach', lab: 0.6, opacity: 1.3, spin: -0.9, offset: [0, 0.06, 0], in: 2, out: 3 }),
    L({ type: 'sprites', rate: 70, dur: Infinity, shape: 'soft', spawn: 'ring', r: [3.5, 6.5], dir: 'in', speed: [3, 5], size: [0.08, 0.14], sizeEnd: 0.02, life: [0.8, 1.2], color: ['lab', 'gold', 'lach'], offset: [0, 0.3, 0] }),
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: [2.6, 3.2], dir: 'up', speed: [1, 2.5], size: [0.16, 0.28], sizeEnd: 0, life: [0.8, 1.4], color: 'gold', twinkle: 16 }),
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'diamond', spawn: 'ring', r: [1.2, 2.2], dir: 'swirl', lift: 1.2, speed: [1.5, 2.5], size: [0.18, 0.3], sizeEnd: 0.05, life: [1, 1.6], color: 'lab', spin: [-3, 3] }),
  ] },
  // a key plunged into the coffin: its colour (tint), loud
  'ult.key': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 1.4, sizeEnd: 0.2, life: 0.22, color: 'white' }),
    L({ type: 'sprites', count: 2, shape: 'star4', size: [1.0, 1.3], sizeEnd: 0.3, life: 0.35, color: 'tint', colorEnd: 'white', grow: 40, spin: [-2, 2] }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 3.2, life: 0.4, color: 'tint' }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 4.4, life: 0.55, color: 'white', at: 0.05 }),
    L({ type: 'sprites', count: 26, shape: 'streak', dir: 'sphere', speed: [5, 12], size: [0.18, 0.3], sizeEnd: 0.04, life: [0.25, 0.45], drag: 5, stretch: 1.8, color: 'white', colorEnd: 'tint' }),
    L({ type: 'sprites', count: 14, shape: 'sparkle', dir: 'sphere', speed: [1, 3], size: [0.2, 0.35], sizeEnd: 0, life: [0.5, 0.9], drag: 2, color: 'tint', twinkle: 22 }),
    L({ type: 'sprites', count: 8, shape: 'petal', dir: 'sphere', speed: [1, 2.5], size: [0.14, 0.22], life: [1, 1.6], drag: 1.5, gravity: 1.2, color: 'tint', spin: [-6, 6] }),
    L({ type: 'light', color: 'tint', k: 40, range: 9, dur: 0.45 }),
    L({ type: 'shake', k: 0.16 }),
  ] },
  // the coffin's ascent: rings stacked up the pillar's foot, a burst at the coffin's mouth
  'ult.ascend': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.3, life: 0.35, color: 'white' }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.8, scale: [[0, 0.6], [1, 4.5]], stretch: [1, [[0, 1.4], [1, 0.4]], 1], k: [[0, 1.5], [1, 0]], tint: 'gold', lab: 0.3 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, at: 0.12, scale: [[0, 0.5], [1, 3.4]], k: [[0, 1.3], [1, 0]], tint: 'lach', lab: 0.7, offset: [0, 0.8, 0] }),
    L({ type: 'sprites', count: 50, shape: 'streak', dir: 'cone', axis: 'up', cone: 25, speed: [8, 16], size: [0.2, 0.35], sizeEnd: 0.05, life: [0.4, 0.7], drag: 2, stretch: 2, color: 'white', colorEnd: 'gold' }),
    L({ type: 'flash', color: 0xfff0d8, k: 0.35, dur: 0.35 }),
    L({ type: 'light', color: 'gold', k: 70, range: 14, dur: 0.8, up: 1.5 }),
    L({ type: 'shake', k: 0.35 }),
  ] },
  // the pillar, held from the ascent to the end: a column of Lachryma to the sky, the great helix round it, streaks and sparkles
  // flowing up it, and motes orbiting
  'ult.pillar': { layers: [
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 1, tint: 'lach', lab: 0.8, opacity: 1.2, spin: 0.6, offset: [0, 4.5, 0], in: 4, out: 2.5 }),
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 0.55, tint: 'gold', lab: 0.1, opacity: 1.4, spin: -1.4, offset: [0, 4.5, 0], in: 5, out: 3 }),
    L({ type: 'mesh', mesh: 'ult_helix', dur: Infinity, scale: 1, tint: 'gold', lab: 0.45, opacity: 1.4, spin: 1.8, offset: [0, 4, 0], in: 3, out: 2 }),
    L({ type: 'sprites', rate: 90, dur: Infinity, shape: 'streak', spawn: 'disc', r: 0.9, dir: 'up', speed: [6, 12], size: [0.15, 0.28], sizeEnd: 0.04, life: [0.6, 1.0], stretch: 2.4, color: ['white', 'gold', 'lab'] }),
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'sparkle', spawn: 'column', r: [1.2, 2.2], height: 7, dir: 'swirl', lift: 0.6, speed: [1, 2], size: [0.2, 0.4], sizeEnd: 0, life: [0.7, 1.2], color: 'lab', twinkle: 14 }),
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'petal', spawn: 'column', r: [2, 3.5], height: 6, dir: 'swirl', lift: -0.3, speed: [1, 2], size: [0.16, 0.26], life: [1.5, 2.4], drag: 0.6, color: ['lab', 'gold'], spin: [-5, 5] }),
  ] },
  // round the coffin while it hangs open in the air: a crown of flame and a halo
  'ult.crown': { layers: [
    L({ type: 'mesh', mesh: 'ult_crown', dur: Infinity, scale: 1.3, tint: 'gold', lab: 0.25, opacity: 1.5, spin: 1.2, offset: [0, 0.3, 0], in: 6, out: 3 }),
    L({ type: 'mesh', mesh: 'ult_crown', dur: Infinity, scale: 1.0, tint: 'lach', lab: 0.8, opacity: 1.3, spin: -2, offset: [0, 0.2, 0], in: 6, out: 3 }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'ringthin', size: 0.6, sizeEnd: 2.4, life: 0.9, color: 'gold', alpha: 0.4, rot: 0 }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'glint', spawn: 'shell', r: 1.2, dir: 'out', speed: [0.5, 1.5], size: [0.3, 0.5], sizeEnd: 0, life: [0.4, 0.7], color: ['gold', 'white'], twinkle: 20 }),
  ] },
  // the wheel lands: everything at once
  'ult.land': { layers: [
    L({ type: 'decal', tex: 'circle_lotus', dur: 1.4, scale: [[0, 3], [1, 18]], k: [[0, 1.6], [0.4, 1], [1, 0]], tint: 'gold', lab: 0.3, spin: 0.6, offset: [0, -0.9, 0] }),
    L({ type: 'decal', tex: 'circle_swirl', dur: 1.0, face: 'camera', scale: [[0, 1], [1, 9]], k: [[0, 1.4], [1, 0]], tint: 'lach', lab: 0.9, spin: -2 }),
    L({ type: 'flash', color: 0xfff6e0, k: 0.85, dur: 0.6 }),
    L({ type: 'hitstop', dur: 0.14, scale: 0.02 }),
    L({ type: 'shake', k: 0.75 }),
    L({ type: 'smear', amt: 0.75, zoom: 0.01, spin: 0.004, dur: 0.9 }),
    L({ type: 'light', color: 'gold', k: 120, range: 22, dur: 1.2, up: 1.2 }),
    L({ type: 'light', color: 'lach', k: 80, range: 16, dur: 1.6, up: 3 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 0.5, life: 0.5, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 2, shape: 'star4', size: [5, 7], sizeEnd: 0.5, life: 0.6, color: 'gold', colorEnd: 'white', grow: 30, spin: [-1, 1], powerCount: false }),
    L({ type: 'mesh', mesh: 'ult_dome', dur: 1.3, scale: [[0, 0.5], [1, 9]], k: [[0, 1.6], [0.5, 0.9], [1, 0]], tint: 'gold', lab: 0.4, opacity: 1.2 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, scale: [[0, 1], [1, 12]], stretch: [1, [[0, 2], [1, 0.3]], 1], k: [[0, 1.8], [1, 0]], tint: 'white', lab: 0.2, offset: [0, -0.8, 0] }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.1, at: 0.1, scale: [[0, 1], [1, 9]], k: [[0, 1.5], [1, 0]], tint: 'lach', lab: 0.9, offset: [0, -0.7, 0] }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.3, at: 0.22, scale: [[0, 1], [1, 6]], k: [[0, 1.4], [1, 0]], tint: 'gold', offset: [0, -0.6, 0] }),
    L({ type: 'sprites', count: 140, shape: 'streak', dir: 'sphere', speed: [8, 22], size: [0.25, 0.45], sizeEnd: 0.05, life: [0.4, 0.9], drag: 3, stretch: 2.2, color: 'white', colorEnd: ['gold', 'lach'], powerCount: false }),
    L({ type: 'sprites', count: 60, shape: 'star4', dir: 'sphere', speed: [3, 9], size: [0.3, 0.6], sizeEnd: 0, life: [0.7, 1.3], drag: 2, gravity: 2, color: ['gold', 'white', 'lab'], spin: [-4, 4], twinkle: 12, powerCount: false }),
    L({ type: 'sprites', count: 80, shape: 'petal', dir: 'sphere', speed: [3, 8], size: [0.18, 0.3], life: [2, 3.2], drag: 1.6, gravity: 1.4, color: ['lab', 'gold', 'lach'], spin: [-6, 6], at: 0.05, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 24, shape: 'puff', spawn: 'ring', r: 0.8, dir: 'out', lift: 0.15, speed: [4, 8], size: [0.8, 1.2], sizeEnd: 2.4, life: [0.8, 1.3], drag: 3, color: 0xf3e6d8, alpha: 0.6, spin: [-1, 1], offset: [0, -0.8, 0], powerCount: false }),
    L({ type: 'sprites', count: 40, shape: 'sparkle', spawn: 'sphere', r: 5, size: [0.3, 0.5], sizeEnd: 0, life: [0.8, 1.6], color: 'lab', twinkle: 10, delay: [0.1, 0.9], powerCount: false }),
  ] },
};
