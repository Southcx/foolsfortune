// ---------------------------------------------------------------------------------------
// THE VFX LIBRARY: every effect in the game, by the name of what happened (vfx/vfx.js reads it; the layer types and their numbers are
// documented there). This file is the one place the look is tuned: change a number here and every place that plays the effect follows.
// A name is found from the most particular to the least (`hit.slash.crystal` -> `hit.slash` -> `hit`), and `extends` gives a family a
// base. The house rules (docs/LOOK.md):
//   - LAYERED. An effect is several things at once at different sizes and speeds: a core flash, a shape, sparks, something that
//     lingers, something that drifts down; and screen weight (hitstop, shake, light) in proportion to what happened.
//   - THE MATERIAL SPEAKS. What flies off says what was struck: clay chips and dust, crystal shards and glints, jelly bubbles and goo.
//   - THE MIND IS LABRADORITE, LACHRYMA IS GOLD AND VIOLET, the clay is warm (the palette's named colours: gold, lach, ember, labradorite).
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
    // (no hitstop or shake here: the weapons give their own weight; an effect that wants more adds it)
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
  // a shot: smaller, a ring stood along the shot, sparks back off the surface
  'hit.shot': { extends: 'hit', layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.15, sizeEnd: 0.8, life: 0.16, color: 'tint', rot: 0 }),
  ] },
  'hit.shot.clay': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'chip', dir: 'cone', cone: 50, speed: [2, 5], size: [0.05, 0.09], life: [0.5, 0.8], gravity: 14, color: [0xb4603f, 0xc46a45], alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', dir: 'cone', cone: 40, speed: [0.5, 1.2], size: 0.25, sizeEnd: 0.55, life: 0.45, drag: 3, color: 0xd9b89a, alpha: 0.5 }),
  ] },
  'hit.shot.crystal': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', count: [5, 8], shape: 'shard', dir: 'cone', cone: 60, speed: [3, 6], size: [0.1, 0.16], sizeEnd: 0.04, life: [0.4, 0.6], gravity: 8, color: 'labradorite', spin: [-10, 10] }),
  ] },
  'hit.shot.jelly': { extends: 'hit.blunt.jelly' },
  // a kill: what it was made of bursts, and a few stars of its colour go up (a finishing beat on top of its own death)
  'hit.blunt.clay.kill': { extends: 'hit.blunt.clay', layers: [
    L({ type: 'sprites', count: 6, shape: 'star4', dir: 'cone', axis: 'up', cone: 60, speed: [2, 4], size: [0.2, 0.3], sizeEnd: 0, life: [0.5, 0.8], drag: 2, gravity: 3, color: ['gold', 'white'], twinkle: 18 }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.4, sizeEnd: 2.2, life: 0.3, color: 'gold' }),
  ] },
  'hit.slash.clay.kill': { extends: 'hit.slash.clay', layers: [
    L({ type: 'sprites', count: 6, shape: 'star4', dir: 'cone', axis: 'up', cone: 60, speed: [2, 4], size: [0.2, 0.3], sizeEnd: 0, life: [0.5, 0.8], drag: 2, gravity: 3, color: ['gold', 'white'], twinkle: 18 }),
  ] },
  'hit.shot.clay.kill': { extends: 'hit.shot.clay', layers: [
    L({ type: 'sprites', count: 5, shape: 'star4', dir: 'cone', axis: 'up', cone: 60, speed: [2, 4], size: [0.18, 0.26], sizeEnd: 0, life: [0.5, 0.8], drag: 2, gravity: 3, color: ['gold', 'white'], twinkle: 18 }),
  ] },
  'hit.blunt.jelly.kill': { extends: 'hit.blunt.jelly', layers: [
    L({ type: 'sprites', pool: 'alpha', count: 14, shape: 'bubble', spawn: 'sphere', r: 0.5, dir: 'out', speed: [1, 3], size: [0.12, 0.28], sizeEnd: 0.35, life: [0.7, 1.2], drag: 1.5, gravity: -1, color: 0xbfe8ff, alpha: 0.9 }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.4, sizeEnd: 2.6, life: 0.35, color: 0x8fd0ff }),
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
    L({ type: 'sprites', count: [8, 12], shape: 'shard', dir: 'cone', cone: 70, speed: [3, 7], size: [0.12, 0.22], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 8, drag: 1.5, color: 'labradorite', spin: [-10, 10] }),
    L({ type: 'sprites', count: [4, 6], shape: 'sparkle', spawn: 'sphere', r: 0.4, size: [0.2, 0.35], sizeEnd: 0, life: [0.4, 0.7], color: 'labradorite', twinkle: 18, delay: [0, 0.15] }),
  ] },
  'hit.slash.crystal': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'shard', dir: 'cone', cone: 80, speed: [3, 7], size: [0.12, 0.2], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 8, drag: 1.5, color: 'labradorite', spin: [-10, 10] }),
  ] },
  // jelly: bubbles that float off, drops of its goo that fall
  'hit.blunt.jelly': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'bubble', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.4, 1.2], size: [0.1, 0.22], sizeEnd: 0.28, life: [0.6, 1.1], drag: 1, color: 0xbfe8ff, alpha: 0.9 }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'soft', dir: 'cone', cone: 70, speed: [2, 4], size: [0.1, 0.16], life: [0.5, 0.8], gravity: 12, color: 0x8fd0ff, alpha: 0.9, alphaEnd: 0.6, floor: 'ground' }),
  ] },
  'hit.slash.jelly': { extends: 'hit.blunt.jelly' },
  // wood: splinters and sawdust; stone: grey chips and a dust cloud; metal: a shower of hot sparks and a clang ring
  'hit.blunt.wood': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'shard', dir: 'cone', cone: 60, speed: [2, 5], size: [0.06, 0.12], life: [0.5, 0.8], gravity: 12, color: [0x8a5a34, 0xb07a4a], alphaEnd: 0.8, spin: [-16, 16], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 4, shape: 'puff', dir: 'cone', cone: 70, speed: [0.4, 1], size: 0.22, sizeEnd: 0.5, life: 0.5, drag: 3, color: 0xd9b88a, alpha: 0.45 }),
  ] },
  'hit.slash.wood': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'shard', dir: 'cone', cone: 80, speed: [2, 5], size: [0.05, 0.1], life: [0.5, 0.8], gravity: 12, color: [0xc8955c, 0xe0b880], alphaEnd: 0.8, spin: [-16, 16], floor: 'ground' }),
  ] },
  'hit.shot.wood': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'shard', dir: 'cone', cone: 45, speed: [2, 4], size: [0.04, 0.08], life: [0.4, 0.7], gravity: 12, color: [0x8a5a34, 0xb07a4a], spin: [-16, 16], floor: 'ground' }),
  ] },
  'hit.blunt.stone': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 9], shape: 'chip', dir: 'cone', cone: 60, speed: [2, 5], size: [0.04, 0.08], life: [0.5, 0.8], gravity: 14, color: [0x8e8680, 0xb0a89e], alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: [5, 7], shape: 'puff', dir: 'cone', cone: 80, speed: [0.5, 1.4], size: [0.3, 0.4], sizeEnd: 0.9, life: [0.6, 0.9], drag: 3, gravity: -0.3, color: 0xc8beb4, alpha: 0.5, spin: [-1, 1] }),
  ] },
  'hit.slash.stone': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [6, 9], shape: 'streak', dir: 'cone', cone: 70, speed: [4, 8], size: [0.06, 0.1], sizeEnd: 0.01, life: [0.15, 0.3], stretch: 1.5, gravity: 8, color: 'white', colorEnd: 'ember' }),
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'chip', dir: 'cone', cone: 60, speed: [2, 4], size: [0.03, 0.06], life: [0.5, 0.8], gravity: 14, color: [0x8e8680, 0xb0a89e], spin: [-14, 14], floor: 'ground' }),
  ] },
  'hit.shot.stone': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 5], shape: 'chip', dir: 'cone', cone: 45, speed: [2, 4], size: [0.03, 0.06], life: [0.4, 0.7], gravity: 14, color: [0x8e8680, 0xb0a89e], spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 3, shape: 'puff', dir: 'cone', cone: 40, speed: [0.4, 1], size: 0.22, sizeEnd: 0.5, life: 0.5, drag: 3, color: 0xc8beb4, alpha: 0.45 }),
  ] },
  'hit.blunt.metal': { extends: 'hit.blunt', layers: [
    L({ type: 'sprites', count: [14, 20], shape: 'streak', dir: 'cone', cone: 70, speed: [4, 10], size: [0.05, 0.09], sizeEnd: 0.01, life: [0.25, 0.5], stretch: 1.8, gravity: 10, drag: 1, color: 'white', colorEnd: 'ember', floor: 'ground' }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.1, life: 0.25, color: 'white', rot: 0 }),
  ] },
  'hit.slash.metal': { extends: 'hit.slash', layers: [
    L({ type: 'sprites', count: [16, 24], shape: 'streak', dir: 'cone', cone: 85, speed: [5, 11], size: [0.05, 0.08], sizeEnd: 0.01, life: [0.25, 0.5], stretch: 2, gravity: 10, drag: 1, color: 'white', colorEnd: 'gold', floor: 'ground' }),
  ] },
  'hit.shot.metal': { extends: 'hit.shot', layers: [
    L({ type: 'sprites', count: [8, 12], shape: 'streak', dir: 'cone', cone: 55, speed: [4, 9], size: [0.04, 0.07], sizeEnd: 0.01, life: [0.2, 0.4], stretch: 1.8, gravity: 10, color: 'white', colorEnd: 'ember', floor: 'ground' }),
  ] },

  // =============================================================================================== POOFS
  // =============================================================================================== DAMAGE LOOKS (vfx.hit's `type`)
  // what a blow is made of, laid over its hit (which says the tool and the material): one colour and one motif per damage type along the
  // Law-Chaos line, so the type reads with the HUD hidden and without colour vision (each has its own shape and lightness, not only
  // its hue). Lawful: geometric, crystalline, straight, still. Chaotic: fluid, iridescent, curling, never at rest. Prior art: Destiny's
  // damage types (Arc's forks, Solar's flares, Void's spheres: a shape per colour), Persona's affinity icons, the elemental hit sparks
  // of Monster Hunter; the colours follow docs/LOOK.md (lightness and saturation carry the feeling, the hue carries the world's meaning).
  //   IMPACT     lawful, physical: bone and gold; crystal facets thrown straight out, a square flash, chips. Fired clay struck.
  'damage.impact': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 1.05, sizeEnd: 0.2, life: 0.16, color: 0xf2e6c8, colorEnd: 'gold', rot: 0.785 }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.0, life: 0.18, color: 0xf2e6c8, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: [7, 10], shape: 'facet', dir: 'cone', cone: 65, speed: [3, 7], size: [0.1, 0.16], sizeEnd: 0.03, life: [0.3, 0.45], drag: 4, gravity: 6, color: 0xf2e6c8, colorEnd: 'gold', spin: [-8, 8] }),
  ] },
  //   EGO        lawful, mental: lapis; a hex lattice that opens and holds still, diamonds in an exact ring. A mind made rigid.
  'damage.ego': { layers: [
    L({ type: 'sprites', count: 1, shape: 'hex', size: 0.25, sizeEnd: 1.2, life: 0.3, color: 0xa8c0ff, colorEnd: 0x3a5fd9, alpha: 1, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: 1, shape: 'hex', size: 0.15, sizeEnd: 0.7, life: 0.36, delay: 0.05, color: 0x3a5fd9, rot: 0.5236 }),
    L({ type: 'sprites', count: 6, shape: 'diamond', spawn: 'ring', r: 0.25, dir: 'out', lift: 0, speed: 2.4, size: 0.12, sizeEnd: 0.03, life: 0.3, drag: 6, color: 0xa8c0ff, colorEnd: 0x3a5fd9, rot: 0 }),
  ] },
  //   INFLUENCE  neutral, social: rose and warm gold; ripples spread slow and even, petals drift out. What spreads from one to many.
  'damage.influence': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ripple', size: 0.3, sizeEnd: 1.6, life: 0.55, color: 0xf2a0b8, colorEnd: 0xffd7a8, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: 1, shape: 'ripple', size: 0.2, sizeEnd: 1.1, life: 0.55, delay: 0.12, color: 0xffd7a8, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', count: [5, 7], shape: 'petal', dir: 'swirl', spawn: 'ring', r: 0.2, lift: 0.3, speed: [0.8, 1.4], size: [0.07, 0.1], life: [0.6, 0.9], drag: 2, color: [0xf2a0b8, 0xffd7a8], spin: [-4, 4] }),
  ] },
  //   ILLUSION   chaotic, perceptual: the labradorite's flash; curls that turn, glints that will not hold still, a doubled sparkle.
  'damage.illusion': { layers: [
    L({ type: 'sprites', count: [3, 4], shape: 'swirl', spawn: 'sphere', r: 0.2, speed: [0.3, 0.7], size: [0.25, 0.4], sizeEnd: 0.6, life: [0.4, 0.6], color: 'labradorite', alphaEnd: 0, spin: [-7, 7] }),
    L({ type: 'sprites', count: [6, 9], shape: 'glint', spawn: 'sphere', r: 0.45, speed: [0.2, 0.6], size: [0.1, 0.18], sizeEnd: 0, life: [0.3, 0.6], color: 'labradorite', twinkle: 26 }),
    L({ type: 'sprites', count: 2, shape: 'sparkle', spawn: 'shell', r: 0.18, size: 0.4, sizeEnd: 0.05, life: 0.22, color: 'labradorite' }),
  ] },
  //   DELIRIUM   chaotic, entropic: ink and a sick violet-green; smoke that curls up, drips that fall, bubbles that burst. Things coming apart.
  'damage.delirium': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 4], shape: 'puff', spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.3, 0.6], size: [0.3, 0.4], sizeEnd: 0.8, life: [0.6, 0.9], drag: 2, color: 0x2a1438, alpha: 0.6, spin: [-1.5, 1.5] }),
    L({ type: 'sprites', count: [5, 7], shape: 'drip', spawn: 'sphere', r: 0.25, dir: 'cone', axis: 'up', cone: 70, speed: [0.5, 1.5], size: [0.06, 0.1], life: [0.5, 0.8], gravity: 7, color: [0xd04ac0, 0x8ae05a], colorEnd: 0x2a1438, floor: 'ground' }),
    L({ type: 'sprites', count: [3, 5], shape: 'bubble', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.2, 0.5], size: [0.06, 0.1], sizeEnd: 0.14, life: [0.5, 0.8], color: [0xd04ac0, 0x8ae05a], alphaEnd: 0 }),
  ] },
  // =============================================================================================== AURAS (held, on a creature: vfx/auras.js)
  // a status, shown round whatever has it, as long as it has it (`aura.<status>`, or `aura.<status>.<kind>` for one creature's own).
  // Centred on the creature, offsets and sizes in its height (feet: [0, -0.5, 0], head: [0, 0.5, 0]); quiet: an aura is read at a
  // glance across a fight, never a show of its own.
  'aura.sleep': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 2.5, shape: 'bubble', offset: [0.15, 0.55, 0], spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.25, 0.45], size: [0.07, 0.13], sizeEnd: 0.16, life: [1.4, 2], color: 0xd9c8ff, alpha: 0.85, alphaEnd: 0, drag: 0.6 }),
    L({ type: 'sprites', dur: Infinity, rate: 1.5, shape: 'soft', offset: [0, 0.3, 0], spawn: 'sphere', r: 0.5, speed: [0.05, 0.15], size: [0.12, 0.2], life: [1.2, 1.8], color: 0x7fb2ff, alpha: 0.35, gravity: -0.1 }),
  ] },
  'aura.halt': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 8, shape: 'diamond', spawn: 'shell', r: 0.55, size: [0.09, 0.16], sizeEnd: 0, life: [0.6, 1], color: [0xbfe6ff, 'white'], twinkle: 9, spin: [-2, 2] }),
    L({ type: 'sprites', dur: Infinity, rate: 0.9, shape: 'ringthin', offset: [0, -0.48, 0], size: 0.3, sizeEnd: 1.3, life: 1.1, color: 0xbfe6ff, alpha: 0.7, rot: 0 }),
  ] },
  'aura.slow': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 1.1, shape: 'ringthin', offset: [0, -0.48, 0], size: 0.25, sizeEnd: 1.1, life: 1.4, color: 'blue', alpha: 0.6, rot: 0 }),
    L({ type: 'sprites', dur: Infinity, rate: 3, shape: 'soft', spawn: 'sphere', r: 0.5, speed: [0.05, 0.1], size: [0.06, 0.1], life: [1, 1.6], color: 'blue', alpha: 0.5, gravity: 0.25 }),
  ] },
  'aura.melt': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 6, pool: 'alpha', shape: 'soft', offset: [0, 0.1, 0], spawn: 'sphere', r: 0.4, size: [0.06, 0.11], sizeEnd: 0.03, life: [0.5, 0.9], color: [0xd9a07a, 0xc47a55], alpha: 0.85, alphaEnd: 0.4, gravity: 5, floor: 'ground' }),
    L({ type: 'sprites', dur: Infinity, rate: 1, pool: 'alpha', shape: 'puff', offset: [0, 0.2, 0], spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.1, 0.3], size: 0.25, sizeEnd: 0.6, life: 1.2, color: 0xe8d2be, alpha: 0.3 }),
  ] },
  'aura.calm': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 2, shape: 'petal', spawn: 'ring', r: 0.6, dir: 'swirl', lift: 0.3, speed: [0.3, 0.5], size: [0.07, 0.11], life: [1.4, 2], color: [0xb8e6c8, 0xf2d8e6], alpha: 0.85, spin: [-3, 3], gravity: 0.1 }),
  ] },
  'aura.soft': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 2, pool: 'alpha', shape: 'puff', spawn: 'sphere', r: 0.45, speed: [0.05, 0.15], size: [0.2, 0.3], sizeEnd: 0.45, life: [0.9, 1.3], color: 0xf2c8d8, alpha: 0.4, spin: [-1, 1] }),
  ] },
  'aura.haste': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 14, shape: 'streak', offset: [0, -0.5, 0], spawn: 'column', r: 0.45, height: 0.9, dir: 'up', speed: [1.5, 2.6], size: [0.07, 0.11], sizeEnd: 0.01, life: [0.25, 0.4], stretch: 1.8, color: 'ember', colorEnd: 'gold' }),
  ] },
  'aura.empower': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 6, shape: 'sparkle', offset: [0, -0.5, 0], spawn: 'column', r: 0.5, height: 1, dir: 'up', speed: [0.4, 0.8], size: [0.07, 0.12], sizeEnd: 0, life: [0.7, 1.1], color: 'gold', twinkle: 10 }),
    L({ type: 'sprites', dur: Infinity, rate: 1.6, shape: 'soft', size: [0.9, 1.1], sizeEnd: 1.3, life: 0.8, color: 'ember', alpha: 0.18 }),
  ] },
  'aura.forget': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 2.2, shape: 'swirl', offset: [0, 0.55, 0], spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.1, 0.2], size: [0.15, 0.25], sizeEnd: 0.35, life: [1, 1.4], color: 'labradorite', alpha: 0.6, spin: [-3, 3] }),
  ] },
  // the four a damage type builds (progress/combat/types.js `builds`), each in its type's colour and motif (docs/ART.md: the damage types)
  'aura.doubt': { layers: [ // ego: lapis hexes standing still round the head, a lattice that holds and will not close
    L({ type: 'sprites', dur: Infinity, rate: 4, shape: 'hex', offset: [0, 0.35, 0], spawn: 'ring', r: 0.36, speed: 0, size: [0.14, 0.2], life: [1.2, 1.6], color: [0x3a6ae0, 0x6a96f0], alpha: 0.95, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', dur: Infinity, rate: 0.7, shape: 'ringthin', offset: [0, 0.5, 0], size: 0.45, sizeEnd: 0.5, life: 1.4, color: 0x2f5fd0, alpha: 0.5, alphaEnd: 0, rot: 0 }),
  ] },
  'aura.charm': { layers: [ // influence: rose ripples over the crown, warm petals drifting round
    L({ type: 'sprites', dur: Infinity, rate: 1.2, shape: 'ripple', offset: [0, 0.55, 0], size: 0.15, sizeEnd: 0.8, life: 1, color: 0xf08aa8, colorEnd: 'gold', alpha: 0.85, alphaEnd: 0, rot: 0 }),
    L({ type: 'sprites', dur: Infinity, rate: 4, shape: 'petal', offset: [0, 0.3, 0], spawn: 'ring', r: 0.5, dir: 'swirl', speed: [0.3, 0.5], size: [0.09, 0.13], life: [1.2, 1.8], color: [0xf4a6bc, 0xf2c86a], alpha: 0.9, spin: [-3, 3], gravity: 0.15 }),
  ] },
  'aura.blind': { layers: [ // illusion: a band of the labradorite's glints turning across the eyes, and an ink veil over them
    L({ type: 'sprites', dur: Infinity, rate: 20, shape: 'glint', offset: [0, 0.42, 0], spawn: 'ring', r: 0.36, dir: 'swirl', lift: 0, speed: [0.6, 0.9], size: [0.12, 0.2], sizeEnd: 0, life: [0.4, 0.7], color: ['labradorite', 'white'], twinkle: 14 }),
    L({ type: 'sprites', dur: Infinity, rate: 1.5, pool: 'alpha', shape: 'swirl', offset: [0, 0.5, 0], spawn: 'sphere', r: 0.12, speed: [0.02, 0.06], size: [0.3, 0.4], sizeEnd: 0.5, life: [1, 1.4], color: 'ink', alpha: 0.45, alphaEnd: 0, spin: [-2, 2] }),
  ] },
  'aura.confusion': { layers: [ // delirium: violet-green bubbles wandering round the head, drips falling off it
    L({ type: 'sprites', dur: Infinity, rate: 5, shape: 'bubble', offset: [0, 0.4, 0], spawn: 'ring', r: 0.3, dir: 'swirl', lift: 0.15, speed: [0.2, 0.45], size: [0.08, 0.13], sizeEnd: 0.17, life: [0.9, 1.4], color: [0x9a5ad0, 0x7ad08a], alpha: 0.85, alphaEnd: 0 }),
    L({ type: 'sprites', dur: Infinity, rate: 2, pool: 'alpha', shape: 'drip', offset: [0, 0.35, 0], spawn: 'sphere', r: 0.35, size: [0.05, 0.08], life: [0.6, 0.9], color: [0x6a3a90, 0x4a8a5a], alpha: 0.9, alphaEnd: 0.3, gravity: 3, floor: 'ground' }),
  ] },
  // =============================================================================================== TEMPER (held, on a creature: vfx/temper.js)
  // a creature's mental state and agitation shown with its body; quiet at the middle, only the ends and the heat have a look of their own
  'temper.stoic': { layers: [ // dry: flakes of a fired surface falling, a little dust at the feet
    L({ type: 'sprites', dur: Infinity, rate: 2.5, pool: 'alpha', shape: 'facet', spawn: 'shell', r: 0.45, speed: [0.05, 0.15], size: [0.05, 0.08], life: [0.8, 1.2], gravity: 2, color: [0xc8beb0, 0xa89e90], alphaEnd: 0.6, spin: [-3, 3], floor: 'ground' }),
    L({ type: 'sprites', dur: Infinity, rate: 0.8, pool: 'alpha', shape: 'puff', offset: [0, -0.48, 0], spawn: 'disc', r: 0.35, speed: [0.05, 0.15], dir: 'up', size: 0.2, sizeEnd: 0.45, life: 1.2, color: 0xd9cfc2, alpha: 0.35 }),
  ] },
  'temper.prismatic': { layers: [ // liquid: the surface runs with the labradorite's colours, drips fall from it
    L({ type: 'sprites', dur: Infinity, rate: 7, shape: 'glint', spawn: 'shell', r: 0.48, speed: [0, 0.1], size: [0.08, 0.14], sizeEnd: 0, life: [0.3, 0.6], color: 'labradorite', twinkle: 18 }),
    L({ type: 'sprites', dur: Infinity, rate: 2, shape: 'drip', spawn: 'shell', r: 0.4, speed: 0.05, size: [0.05, 0.08], life: [0.6, 0.9], gravity: 4, color: 'labradorite', floor: 'ground' }),
  ] },
  'temper.agitated': { layers: [ // heat: steam off the top, a shimmer of warm motes rising
    L({ type: 'sprites', dur: Infinity, rate: 3, pool: 'alpha', shape: 'puff', offset: [0, 0.4, 0], spawn: 'disc', r: 0.25, dir: 'up', speed: [0.4, 0.8], size: [0.15, 0.22], sizeEnd: 0.5, life: [0.7, 1], drag: 1, color: 0xf2ece4, alpha: 0.4, spin: [-1, 1] }),
    L({ type: 'sprites', dur: Infinity, rate: 6, shape: 'soft', spawn: 'shell', r: 0.45, dir: 'up', speed: [0.3, 0.6], size: [0.05, 0.08], sizeEnd: 0, life: [0.5, 0.8], color: 'ember', alpha: 0.8 }),
  ] },
  'temper.enraged': { layers: [ // rage: sparks thrown off, hard red-gold rings pulsing out from it
    L({ type: 'sprites', dur: Infinity, rate: 16, shape: 'streak', spawn: 'shell', r: 0.4, dir: 'out', lift: 0.6, speed: [2, 4], size: [0.05, 0.08], sizeEnd: 0.01, life: [0.25, 0.4], stretch: 1.6, gravity: 5, color: 'gold', colorEnd: 0xff3a1a }),
    L({ type: 'sprites', dur: Infinity, rate: 1.6, shape: 'ring', size: 0.4, sizeEnd: 1.4, life: 0.5, color: 0xff4a2a, colorEnd: 'gold', alphaEnd: 0, rot: 0 }),
  ] },
  // a cut through the air (the cutlass meeting something, the blade mode's planes, the god hand's slash): a seam of light along the
  // stroke, a hot core at its middle, glints thrown off it ('from' -> 'to' in the context: spawn 'line')
  cut: { layers: [
    L({ type: 'sprites', count: [14, 18], shape: 'streak', spawn: 'line', dir: 'line', speed: [0.6, 1.6], size: [0.12, 0.2], sizeEnd: 0.02, life: [0.14, 0.24], stretch: 2.2, drag: 6, color: 'white', colorEnd: 'tint' }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.5, sizeEnd: 0.1, life: 0.12, color: 'white', colorEnd: 'tint' }),
    L({ type: 'sprites', count: [10, 14], shape: 'glint', spawn: 'line', r: 0.1, speed: [0.5, 2], size: [0.08, 0.14], sizeEnd: 0, life: [0.2, 0.4], drag: 4, color: 'tint', twinkle: 28 }),
  ] },
  // a crystal formation struck with the pick: faceted shards of solid Lachryma knocked off, oxide-bright, and a hard glint
  'crystal.strike': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.8, sizeEnd: 0.15, life: 0.14, color: 'white', colorEnd: 'lach', rot: 0 }),
    L({ type: 'sprites', count: [8, 12], shape: 'facet', dir: 'cone', cone: 70, speed: [2.5, 6], size: [0.07, 0.13], sizeEnd: 0.03, life: [0.4, 0.7], gravity: 9, drag: 1, color: ['lach', 'labradorite', 'gold'], spin: [-10, 10], floor: 'ground' }),
    L({ type: 'sprites', count: [6, 9], shape: 'glint', spawn: 'sphere', r: 0.25, speed: [0.5, 1.5], size: [0.1, 0.16], sizeEnd: 0, life: [0.25, 0.45], color: 'labradorite', twinkle: 24 }),
  ] },
  // =============================================================================================== THE OLD BURSTS (Phase 2: folded in from vfx/particles.js)
  // played by the old names through their shims, so every caller is unchanged and each can now be directed here. 'tint' is the
  // caller's colour, 'tip' the hot one (PALETTE.hot); counts read the caller's own numbers (`sparks`, `dust`, `n`).
  impact: { layers: [ // a shot or a knock on a hard thing: hot sparks off it, a puff of its dust (and chips: particles.js, step 3)
    L({ type: 'sprites', count: 'sparks', shape: 'streak', dir: 'cone', axis: 'normal', cone: 70, speed: [4, 10], size: 0.05, sizeEnd: 0.01, life: [0.15, 0.35], stretch: 1.4, drag: 3, gravity: 9, color: 'tip', powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 'dust', shape: 'puff', dir: 'cone', axis: 'normal', cone: 60, speed: [1, 2.5], size: 0.08, sizeEnd: 0.5, life: [0.6, 1.2], drag: 3.5, gravity: -0.2, color: 'tint', alpha: 0.45, powerCount: false }),
  ] },
  embers: { layers: [ // what a lantern or a fire leaves in the air: embers rising, twinkling, falling back
    L({ type: 'sprites', count: 'n', shape: 'soft', dir: 'sphere', speed: [1, 3.5], size: 0.05, sizeEnd: 0.015, life: [0.8, 2], drag: 1.2, gravity: 4, color: ['tip', 'tint'], twinkle: 12, powerCount: false, offset: [0, 0.1, 0] }),
  ] },
  absorb: { layers: [ // a thing taken into the Courier: a quick sparkle where it went
    L({ type: 'sprites', count: 12, shape: 'glint', dir: 'sphere', speed: [1, 2.5], size: 0.06, sizeEnd: 0.008, life: [0.3, 0.5], drag: 3, color: ['tint', 'tip'], twinkle: 30, powerCount: false }),
  ] },
  implode: { layers: [ // something collapsing inward and bursting: a sphere of hot streaks and a flash of light
    L({ type: 'sprites', count: 70, shape: 'streak', dir: 'sphere', speed: [3, 12], size: 0.06, sizeEnd: 0.01, life: [0.4, 0.8], stretch: 1.2, drag: 2.5, color: ['tip', 'tint'], twinkle: 20, powerCount: false }),
    L({ type: 'light', color: 'tint', k: 90, range: 16, dur: 0.3, up: 0 }),
  ] },
  // =============================================================================================== SWINGS (held: vfx.swing(name))
  // what a thing leaves in the air as it sweeps: ribbons between its two ends (a wide one, a hot core near the tip), and motes shed along
  // the way, so many per metre the tip travels (vfx.js `swing`). 'tint' is the swing's colour, 'tip' its hot end.
  swing: { layers: [
    L({ type: 'trail', life: 0.3, color: 'tint', tip: 'tip', fade: 1.6 }),
    L({ type: 'trail', life: 0.12, span: [0.75, 1], color: 'white', tip: 'white', core: 2, fade: 1 }),
    L({ type: 'sprites', perM: 4, along: 'tip', shape: 'glint', size: [0.07, 0.12], sizeEnd: 0, life: [0.18, 0.3], color: 'tip', twinkle: 30, inherit: 0.12, drag: 4 }),
  ] },
  // the Sondelass's cutlass: ember to warm white, an afterglow of Lachryma behind, embers off the edge, glints off the point
  'swing.cutlass': { layers: [
    L({ type: 'trail', life: 0.45, span: [0.2, 1], color: 'lach', tip: 0x8a5cf0, fade: 2.6, core: 0, k: 0.7 }),
    L({ type: 'trail', life: 0.26, span: [0.15, 1], color: 'tint', tip: 'tip', fade: 2.2, core: 0.6, k: 0.42 }),
    L({ type: 'trail', life: 0.2, span: [0.9, 1.02], color: 'gold', tip: 'white', core: 3, fade: 1.2 }),
    L({ type: 'sprites', perM: 6, along: 'tip', shape: 'glint', size: [0.1, 0.18], sizeEnd: 0, life: [0.2, 0.35], color: 'tip', twinkle: 30, inherit: 0.15, drag: 4 }),
    L({ type: 'sprites', perM: 5, along: 'blade', shape: 'streak', dir: 'sphere', speed: [0.4, 1.2], size: [0.06, 0.1], sizeEnd: 0.01, life: [0.25, 0.5], stretch: 1.2, color: 'tint', colorEnd: 'ember', inherit: 0.25, drag: 3, gravity: 3 }),
    L({ type: 'sprites', perM: 2, along: 'blade', shape: 'sparkle', speed: [0.1, 0.4], size: [0.08, 0.13], sizeEnd: 0, life: [0.4, 0.7], color: ['lach', 'gold'], twinkle: 12, gravity: -0.6, drag: 2 }),
  ] },
  // the Dreamvane's pick brought down overhead: a heavy arc of Lachryma, gold at the head, stone chips and glints thrown off it
  'swing.dreamvane': { layers: [
    L({ type: 'trail', life: 0.4, span: [0.1, 1], color: 'lach', tip: 'gold', fade: 2.4, core: 0.4, k: 0.55 }),
    L({ type: 'trail', life: 0.16, span: [0.85, 1.05], color: 'gold', tip: 'white', core: 2.5, fade: 1.2 }),
    L({ type: 'sprites', perM: 4, along: 'tip', shape: 'glint', size: [0.1, 0.16], sizeEnd: 0, life: [0.2, 0.35], color: 'gold', twinkle: 24, inherit: 0.1, drag: 4 }),
    L({ type: 'sprites', perM: 3, along: 'tip', pool: 'alpha', shape: 'chip', speed: [0.3, 0.9], size: [0.03, 0.05], life: [0.4, 0.7], color: [0x9a8e8a, 0xc8b8a8], gravity: 9, spin: [-12, 12], inherit: 0.3, floor: 'ground' }),
  ] },
  // the Soul Brush's club: a warm wet arc of slip, a pale edge, droplets flung off the bristles
  'swing.brush': { layers: [
    L({ type: 'trail', life: 0.3, span: [0.3, 1], color: 0xc47a55, tip: 0xf2d8c0, fade: 2.2, core: 0.3, k: 0.45 }),
    L({ type: 'trail', life: 0.12, span: [0.85, 1.02], color: 0xf2e6d8, tip: 'white', core: 1.5, fade: 1.2, k: 0.8 }),
    L({ type: 'sprites', perM: 6, along: 'tip', pool: 'alpha', shape: 'soft', speed: [0.4, 1.4], size: [0.04, 0.07], sizeEnd: 0.03, life: [0.4, 0.7], color: [0xd9a07a, 0xc47a55], alpha: 0.9, alphaEnd: 0.6, gravity: 9, inherit: 0.35, floor: 'ground' }),
  ] },
  // a kick: a short pale arc and a puff of dust off the toe (a kick is quick: the ribbon is too)
  'swing.kick': { layers: [
    L({ type: 'trail', life: 0.2, color: 0xffc890, tip: 'white', fade: 1.8, core: 1.2, k: 0.85 }),
    L({ type: 'sprites', perM: 2.5, along: 'tip', pool: 'alpha', shape: 'puff', speed: [0.1, 0.4], size: [0.12, 0.18], sizeEnd: 0.35, life: [0.35, 0.5], color: 0xe8d2be, alpha: 0.35, drag: 3 }),
  ] },
  // a thing gone in a puff: smoke that swells and lifts, a ring, a few stars (cartoon's disappearance)
  poof: { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'sphere', r: 0.25, dir: 'out', speed: [0.8, 1.8], size: [0.35, 0.5], sizeEnd: 0.9, life: [0.5, 0.8], drag: 3.5, gravity: -0.5, color: 0xf3e6d8, alpha: 0.8, spin: [-1.5, 1.5] }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.6, life: 0.3, color: 'white' }),
    L({ type: 'sprites', count: 5, shape: 'star4', dir: 'sphere', speed: [1.5, 3], size: [0.14, 0.2], sizeEnd: 0, life: [0.4, 0.6], drag: 3, color: 'tint', twinkle: 20 }),
  ] },

  // =============================================================================================== CHESTS (vfx/chestfx.js)
  // the circle under a chest as it charges (held: its strength is the charge), the whirling mandala
  'chest.sigil': { layers: [
    L({ type: 'decal', tex: 'circle_swirl', dur: Infinity, scale: 2.4, tint: 'tint', labradorite: 0.1, glow: 1.5, spin: 0.8, offset: [0, 0.04, 0], in: 5, out: 2.5 }),
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 3.4, tint: 'tint', labradorite: 0.25, glow: 1.0, spin: -0.3, offset: [0, 0.035, 0], in: 4, out: 2.5 }),
  ] },

  // =============================================================================================== THE LOCKHEART'S OPENING
  // (tools/lockheart/ultimate.js plays these; the owner's gold standard for a cinematic event: too much, on purpose)
  // the invocation, held while it lasts: the whirl on the ground, motes drawn in from all round, glints rising off the circle
  'ult.invoke': { layers: [
    // the circles the owner's wife drew (source_assets/circles/): the lotus mandala under the Courier, the whirling one inside it
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 7, tint: 'gold', labradorite: 0.15, glow: 0.7, spin: 0.22, offset: [0, 0.05, 0], in: 2.2, out: 2 }),
    L({ type: 'decal', tex: 'circle_swirl', dur: Infinity, scale: 4.2, tint: 'lach', labradorite: 0.85, glow: 0.8, spin: -0.7, offset: [0, 0.07, 0], in: 1.6, out: 2 }),
    L({ type: 'decal', tex: 'circle_lotus', dur: Infinity, scale: 2, tint: 'white', labradorite: 0.4, glow: 0.6, spin: 1.4, offset: [0, 0.09, 0], in: 1.2, out: 2 }),
    L({ type: 'mesh', mesh: 'ult_vortex', dur: Infinity, scale: 1.25, tint: 'lach', labradorite: 0.6, opacity: 1.3, spin: -0.9, offset: [0, 0.06, 0], in: 2, out: 3 }),
    L({ type: 'sprites', rate: 70, dur: Infinity, shape: 'soft', spawn: 'ring', r: [3.5, 6.5], dir: 'in', speed: [3, 5], size: [0.08, 0.14], sizeEnd: 0.02, life: [0.8, 1.2], color: ['labradorite', 'gold', 'lach'], offset: [0, 0.3, 0] }),
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: [2.6, 3.2], dir: 'up', speed: [1, 2.5], size: [0.16, 0.28], sizeEnd: 0, life: [0.8, 1.4], color: 'gold', twinkle: 16 }),
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'diamond', spawn: 'ring', r: [1.2, 2.2], dir: 'swirl', lift: 1.2, speed: [1.5, 2.5], size: [0.18, 0.3], sizeEnd: 0.05, life: [1, 1.6], color: 'labradorite', spin: [-3, 3] }),
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
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.8, scale: [[0, 0.6], [1, 4.5]], stretch: [1, [[0, 1.4], [1, 0.4]], 1], k: [[0, 1.5], [1, 0]], tint: 'gold', labradorite: 0.3 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, at: 0.12, scale: [[0, 0.5], [1, 3.4]], k: [[0, 1.3], [1, 0]], tint: 'lach', labradorite: 0.7, offset: [0, 0.8, 0] }),
    L({ type: 'sprites', count: 50, shape: 'streak', dir: 'cone', axis: 'up', cone: 25, speed: [8, 16], size: [0.2, 0.35], sizeEnd: 0.05, life: [0.4, 0.7], drag: 2, stretch: 2, color: 'white', colorEnd: 'gold' }),
    L({ type: 'flash', color: 0xfff0d8, k: 0.35, dur: 0.35 }),
    L({ type: 'light', color: 'gold', k: 70, range: 14, dur: 0.8, up: 1.5 }),
    L({ type: 'shake', k: 0.35 }),
  ] },
  // the pillar, held from the ascent to the end: a column of Lachryma to the sky, the great helix round it, streaks and sparkles
  // flowing up it, and motes orbiting
  'ult.pillar': { layers: [
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 1, tint: 'lach', labradorite: 0.8, opacity: 1.2, spin: 0.6, offset: [0, 4.5, 0], in: 4, out: 2.5 }),
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 0.55, tint: 'gold', labradorite: 0.1, opacity: 1.4, spin: -1.4, offset: [0, 4.5, 0], in: 5, out: 3 }),
    L({ type: 'mesh', mesh: 'ult_helix', dur: Infinity, scale: 1, tint: 'gold', labradorite: 0.45, opacity: 1.4, spin: 1.8, offset: [0, 4, 0], in: 3, out: 2 }),
    L({ type: 'sprites', rate: 90, dur: Infinity, shape: 'streak', spawn: 'disc', r: 0.9, dir: 'up', speed: [6, 12], size: [0.15, 0.28], sizeEnd: 0.04, life: [0.6, 1.0], stretch: 2.4, color: ['white', 'gold', 'labradorite'] }),
    L({ type: 'sprites', rate: 50, dur: Infinity, shape: 'sparkle', spawn: 'column', r: [1.2, 2.2], height: 7, dir: 'swirl', lift: 0.6, speed: [1, 2], size: [0.2, 0.4], sizeEnd: 0, life: [0.7, 1.2], color: 'labradorite', twinkle: 14 }),
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'petal', spawn: 'column', r: [2, 3.5], height: 6, dir: 'swirl', lift: -0.3, speed: [1, 2], size: [0.16, 0.26], life: [1.5, 2.4], drag: 0.6, color: ['labradorite', 'gold'], spin: [-5, 5] }),
  ] },
  // round the coffin while it hangs open in the air: a crown of flame and a halo
  'ult.crown': { layers: [
    L({ type: 'mesh', mesh: 'ult_crown', dur: Infinity, scale: 1.3, tint: 'gold', labradorite: 0.25, opacity: 1.5, spin: 1.2, offset: [0, 0.3, 0], in: 6, out: 3 }),
    L({ type: 'mesh', mesh: 'ult_crown', dur: Infinity, scale: 1.0, tint: 'lach', labradorite: 0.8, opacity: 1.3, spin: -2, offset: [0, 0.2, 0], in: 6, out: 3 }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'ringthin', size: 0.6, sizeEnd: 2.4, life: 0.9, color: 'gold', alpha: 0.4, rot: 0 }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'glint', spawn: 'shell', r: 1.2, dir: 'out', speed: [0.5, 1.5], size: [0.3, 0.5], sizeEnd: 0, life: [0.4, 0.7], color: ['gold', 'white'], twinkle: 20 }),
  ] },
  // the wheel lands: everything at once
  'ult.land': { layers: [
    L({ type: 'decal', tex: 'circle_lotus', dur: 1.4, scale: [[0, 3], [1, 18]], k: [[0, 1.6], [0.4, 1], [1, 0]], tint: 'gold', labradorite: 0.3, spin: 0.6, offset: [0, -0.9, 0] }),
    L({ type: 'decal', tex: 'circle_swirl', dur: 1.0, face: 'camera', scale: [[0, 1], [1, 9]], k: [[0, 1.4], [1, 0]], tint: 'lach', labradorite: 0.9, spin: -2 }),
    L({ type: 'flash', color: 0xfff6e0, k: 0.85, dur: 0.6 }),
    L({ type: 'hitstop', dur: 0.14, scale: 0.02 }),
    L({ type: 'shake', k: 0.75 }),
    L({ type: 'smear', amt: 0.75, zoom: 0.01, spin: 0.004, dur: 0.9 }),
    L({ type: 'light', color: 'gold', k: 120, range: 22, dur: 1.2, up: 1.2 }),
    L({ type: 'light', color: 'lach', k: 80, range: 16, dur: 1.6, up: 3 }),
    L({ type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 0.5, life: 0.5, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 2, shape: 'star4', size: [5, 7], sizeEnd: 0.5, life: 0.6, color: 'gold', colorEnd: 'white', grow: 30, spin: [-1, 1], powerCount: false }),
    L({ type: 'mesh', mesh: 'ult_dome', dur: 1.3, scale: [[0, 0.5], [1, 9]], k: [[0, 1.6], [0.5, 0.9], [1, 0]], tint: 'gold', labradorite: 0.4, opacity: 1.2 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, scale: [[0, 1], [1, 12]], stretch: [1, [[0, 2], [1, 0.3]], 1], k: [[0, 1.8], [1, 0]], tint: 'white', labradorite: 0.2, offset: [0, -0.8, 0] }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.1, at: 0.1, scale: [[0, 1], [1, 9]], k: [[0, 1.5], [1, 0]], tint: 'lach', labradorite: 0.9, offset: [0, -0.7, 0] }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 1.3, at: 0.22, scale: [[0, 1], [1, 6]], k: [[0, 1.4], [1, 0]], tint: 'gold', offset: [0, -0.6, 0] }),
    L({ type: 'sprites', count: 140, shape: 'streak', dir: 'sphere', speed: [8, 22], size: [0.25, 0.45], sizeEnd: 0.05, life: [0.4, 0.9], drag: 3, stretch: 2.2, color: 'white', colorEnd: ['gold', 'lach'], powerCount: false }),
    L({ type: 'sprites', count: 60, shape: 'star4', dir: 'sphere', speed: [3, 9], size: [0.3, 0.6], sizeEnd: 0, life: [0.7, 1.3], drag: 2, gravity: 2, color: ['gold', 'white', 'labradorite'], spin: [-4, 4], twinkle: 12, powerCount: false }),
    L({ type: 'sprites', count: 80, shape: 'petal', dir: 'sphere', speed: [3, 8], size: [0.18, 0.3], life: [2, 3.2], drag: 1.6, gravity: 1.4, color: ['labradorite', 'gold', 'lach'], spin: [-6, 6], at: 0.05, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 24, shape: 'puff', spawn: 'ring', r: 0.8, dir: 'out', lift: 0.15, speed: [4, 8], size: [0.8, 1.2], sizeEnd: 2.4, life: [0.8, 1.3], drag: 3, color: 0xf3e6d8, alpha: 0.6, spin: [-1, 1], offset: [0, -0.8, 0], powerCount: false }),
    L({ type: 'sprites', count: 40, shape: 'sparkle', spawn: 'sphere', r: 5, size: [0.3, 0.5], sizeEnd: 0, life: [0.8, 1.6], color: 'labradorite', twinkle: 10, delay: [0.1, 0.9], powerCount: false }),
  ] },
};
