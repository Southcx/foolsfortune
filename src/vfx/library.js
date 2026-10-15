// ---------------------------------------------------------------------------------------
// THE VFX LIBRARY: every effect in the game, by the name of what happened (vfx/vfx.js reads it; the layer types and their numbers are
// documented there). This file is the one place the look is tuned: change a number here and every place that plays the effect follows.
// A name is found from the most particular to the least (`hit.slash.crystal` -> `hit.slash` -> `hit`), and `extends` gives a family a
// base. The house rules (docs/VFX.md, docs/ART.md):
//   - LAYERED. An effect is several things at once at different sizes and speeds: a core flash, a shape, sparks, something that
//     lingers, something that drifts down; and screen weight (hitstop, shake, light) in proportion to what happened.
//   - THE MATERIAL SPEAKS. What flies off says what was struck: clay chips and dust, crystal shards and glints, jelly bubbles and goo.
//   - THE MIND IS LABRADORITE, LACHRYMA IS GOLD AND VIOLET, the clay is warm (the palette's named colours: gold, lach, ember, labradorite).
//   - NO FLICKER: a flash is one wash in and out; nothing large beats at a rate.
// ---------------------------------------------------------------------------------------
import { SHELL_EFFECTS } from './shelllooks/index.js'; // (the caster shells' looks, batches 2 to 4: one module a family)
import { groundRing, scorch, debris } from './shelllooks/kit.js'; // (the ludicrous ten's ground rings, scorches and debris)
import { RACEWAY_EFFECTS } from './racewayeffects.js'; // (the carve's sparks by tier and the sun plate's ring: vfx/racewaylooks.js plays them)
import { RACEWAY_CAVERN_EFFECTS } from './racewaycaverneffects.js'; // (a crystal vein ridden: vfx/racewaycavern.js plays it)
import { RACEWAY_PROPS_EFFECTS } from './racewaypropseffects.js'; // (the vein lanes, the pots, the antlion chaser, the patches: vfx/racewayprops.js plays them)
import { RACEWAY_PARK_EFFECTS } from './racewayparkeffects.js'; // (the antlion's maw snapping: vfx/racewaypark.js plays it)
import { SKIFF_BOARD_EFFECTS } from './skiffboardeffects.js'; // (the board's stakes: the scorch, the hull, a wreck, the manual; the buoys: vfx/skiffboardlooks.js, vfx/racewaybuoys.js)
import { RACEWAY_SIPHON_EFFECTS } from './racewaysiphoneffects.js'; // (the siphon arches' draw, drink and gulp: vfx/racewaysiphons.js plays them)
const L = (o) => o; // (a layer: only for readability)
const GLAZES = [0x2f6db5, 0x4f9a7a, 0xe0b030, 0xc84a3a, 0xf3efe6, 0x6a4a9a, 0x2a8ab0]; // (the glazes' own colours: the Hailstorm's shards)

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
  // a plaster patch knocked off the workshop's wall (vfx/plasterpatch.js: its own flakes fall with it): grit of the skim, and its dust
  // falling slowly and spreading, the colour of the wall's lime (`floor`: the caller's floor, where the grit stops)
  'plaster.break': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [9, 13], shape: 'chip', dir: 'cone', axis: 'normal', cone: 55, speed: [1, 3], size: [0.02, 0.045], life: [0.6, 1], gravity: 12, drag: 1, color: [0xb98a72, 0xa66f58, 0xd1ad96], alphaEnd: 0.8, spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'puff', dir: 'cone', axis: 'normal', cone: 70, speed: [0.3, 0.9], size: [0.18, 0.28], sizeEnd: 0.75, life: [1.1, 1.7], drag: 2.5, gravity: 0.35, color: 0xc9a28c, alpha: 0.42, spin: [-0.8, 0.8] }),
  ] },
  'plaster.land': { layers: [ // (one of its flakes landing on the floor: a breath of the same dust)
    L({ type: 'sprites', pool: 'alpha', count: [2, 3], shape: 'puff', spawn: 'disc', r: 0.06, dir: 'up', speed: [0.1, 0.3], size: [0.08, 0.12], sizeEnd: 0.32, life: [0.6, 0.9], drag: 2, color: 0xc9a28c, alpha: 0.3 }),
  ] },
  // =============================================================================================== DAMAGE LOOKS (vfx.hit's `type`)
  // what a blow is made of, laid over its hit (which says the tool and the material): one colour and one motif per damage type along the
  // Law-Chaos line, so the type reads with the HUD hidden and without colour vision (each has its own shape and lightness, not only
  // its hue). Lawful: geometric, crystalline, straight, still. Chaotic: fluid, iridescent, curling, never at rest. Prior art: Destiny's
  // damage types (Arc's forks, Solar's flares, Void's spheres: a shape per colour), Persona's affinity icons, the elemental hit sparks
  // of Monster Hunter; the colours follow docs/ART.md section 1 (lightness and saturation carry the feeling, the hue carries the world's meaning).
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
  'aura.soaked': { layers: [ // soaked (the next hit doubled): wet through, drops running off it and a cold sheen over it, its glyph's teal
    L({ type: 'sprites', dur: Infinity, rate: 5, pool: 'alpha', shape: 'drip', offset: [0, 0.1, 0], spawn: 'sphere', r: 0.42, size: [0.05, 0.08], life: [0.5, 0.8], color: [0x8fd0c8, 0x5fa8b0], alpha: 0.9, alphaEnd: 0.4, gravity: 4, floor: 'ground' }),
    L({ type: 'sprites', dur: Infinity, rate: 3, shape: 'glint', offset: [0, 0.25, 0], spawn: 'shell', r: 0.4, size: [0.07, 0.11], sizeEnd: 0, life: [0.4, 0.6], color: [0xd8f4f0, 'white'], twinkle: 10 }),
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
  // a shockwave out of a feat of the Courier's power (the parry, a dive's landing, a charge's end, a bomb's pop, the Opening: fx.shockwave):
  // Lachryma's ring, not a white one. A band of crude's ink, the oil film's three thin bands just inside it, each walking its hue as it
  // goes out ('film0'..'film3': vfx/oxidation.js featTint, turned by the caller's `phase`), and a few motes of the film thrown off.
  // `scale` is the reach in metres (a ring's line sits at 0.39 of its size, a thin ring's at 0.45: these sizes put both at the reach).
  shock: { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 1, shape: 'ring', size: 2.6, life: 0.36, grow: 11, color: 'ink', alpha: 0.5, alphaEnd: 0, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 2.15, life: 0.3, grow: 12, color: 'film0', colorEnd: 'film1', alpha: 1, alphaEnd: 0, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 1.95, life: 0.32, grow: 11, color: 'film1', colorEnd: 'film2', alpha: 0.9, alphaEnd: 0, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 1.75, life: 0.34, grow: 10, color: 'film2', colorEnd: 'film3', alpha: 0.8, alphaEnd: 0, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: [6, 9], shape: 'sparkle', spawn: 'shell', r: 0.55, dir: 'out', speed: [1.5, 3], size: [0.12, 0.2], sizeEnd: 0, life: [0.25, 0.45], drag: 3, color: 'film', twinkle: 20, powerCount: false }),
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
  // (the circle and mandala under a charging chest are gone, the owner's, R45: the chest's glaze tells the charge, vfx/chestglaze.js)

  // =============================================================================================== THE OVERTURE'S TRAILER (cine/overture.js)
  // the CLIMB's ring: the Mind's labradorite wound round the Courier as the tools are drawn, faster and brighter to the snare roll
  'overture.ring': { layers: [
    L({ type: 'mesh', mesh: 'ult_vortex', dur: Infinity, scale: 0.55, tint: 'labradorite', labradorite: 0.9, opacity: 1.1, spin: 2.4, offset: [0, 0.1, 0], in: 4, out: 3 }),
    L({ type: 'sprites', dur: Infinity, rate: 60, shape: 'streak', spawn: 'ring', r: 1.1, offset: [0, 0.6, 0], dir: 'swirl', lift: 0.25, speed: [3, 5], size: [0.06, 0.1], sizeEnd: 0.01, stretch: 2, life: [0.3, 0.5], color: ['labradorite', 'gold'] }),
    L({ type: 'sprites', dur: Infinity, rate: 18, shape: 'sparkle', spawn: 'column', r: 1.0, height: 1.8, offset: [0, -0.4, 0], dir: 'up', speed: [0.6, 1.2], size: [0.1, 0.16], sizeEnd: 0, life: [0.5, 0.8], color: 'white', twinkle: 14 }),
  ] },
  // a tool drawn on the half bar: a flash of the Mind at the hand, a ring out
  'overture.draw': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.6, life: 0.35, color: 'labradorite' }),
    L({ type: 'sprites', count: 10, shape: 'glint', dir: 'sphere', speed: [1.5, 3], size: [0.08, 0.14], sizeEnd: 0, life: [0.3, 0.5], drag: 3, color: ['labradorite', 'white'], twinkle: 16 }),
    L({ type: 'flash', size: 1.2, life: 0.12, color: 'white' }),
  ] },
  // the FUSE: the mend's gold breaking across the dark, a crack of light
  'overture.crack': { layers: [
    L({ type: 'sprites', count: 14, shape: 'streak', spawn: 'line', dir: 'line', speed: [0.2, 0.6], size: [0.04, 0.07], sizeEnd: 0, stretch: 2.5, life: [0.6, 1.0], color: 'gold' }),
    L({ type: 'sprites', count: 6, shape: 'sparkle', spawn: 'line', size: [0.08, 0.14], sizeEnd: 0, life: [0.5, 0.9], color: ['gold', 'white'], twinkle: 12 }),
  ] },

  // =============================================================================================== THE EMOCEAN (the slice: docs/plans/SLICE.md)
  // Divination's lane mark: where a wave will come, up to 3 s before it does (held; the caller raises its strength `k` from 0 to 1 as the
  // wave nears). It must read at speed over the black crude: a column of the Mind's labradorite standing up out of the sea, a whirl
  // laid on the surface, and rings going out on the beat of its approach. No words, no numbers (a mark, not a sign).
  'lane.mark': { layers: [
    L({ type: 'decal', tex: 'circle_swirl', dur: Infinity, scale: 3.2, tint: 'labradorite', labradorite: 0.9, glow: 1.4, spin: 1.6, offset: [0, 0.08, 0], in: 6, out: 4 }),
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 0.16, tint: 'labradorite', labradorite: 1, opacity: 1.3, spin: 1.2, offset: [0, 3.2, 0], in: 6, out: 4 }),
    L({ type: 'sprites', dur: Infinity, rate: 50, shape: 'streak', spawn: 'disc', r: 0.8, dir: 'up', speed: [5, 8], size: [0.22, 0.34], sizeEnd: 0.04, stretch: 3, life: [0.6, 0.9], color: ['labradorite', 'white'] }),
    L({ type: 'sprites', dur: Infinity, rate: 1.6, shape: 'ringthin', offset: [0, 0.1, 0], size: 0.6, sizeEnd: 4.5, life: 0.8, color: 'labradorite', alpha: 0.8, rot: 0 }),
  ] },

  // the Great Dunemaw's mouth (vfx/dunemaw.js draws the pool): motes of the dunes' Lachryma drawn in toward it, and a breath of dark over it
  // the Pneuka Jar's mouth breathing the soul colour after a true firing, as the press view is left (docs/plans/SOUL-ALCHEMY.md 4.13)
  'jar.breath': { layers: [
    L({ type: 'sprites', pool: 'alpha', dur: 3, rate: 14, shape: 'soft', spawn: 'disc', r: 0.12, dir: 'up', speed: [0.35, 0.7], size: [0.16, 0.3], sizeEnd: 0.04, life: [1.1, 1.6], drag: 1, color: 'tint', alpha: 0.85 }),
  ] },
  'dunemaw.motes': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 24, shape: 'soft', spawn: 'ring', r: [5, 8], dir: 'in', speed: [1.2, 2.2], size: [0.06, 0.1], sizeEnd: 0.02, life: [2.2, 3.2], color: ['labradorite', 'gold'], offset: [0, 0.4, 0] }),
    L({ type: 'sprites', dur: Infinity, rate: 3, pool: 'alpha', shape: 'swirl', spawn: 'disc', r: 2.5, dir: 'up', speed: [0.2, 0.5], size: [0.8, 1.2], sizeEnd: 2, life: [2, 3], color: 'ink', alpha: 0.3, alphaEnd: 0, spin: [-1, 1] }),
  ] },

  // =============================================================================================== THE LANTERN WISP (vfx/lanternwisplook.js)
  // its cast leaving the lantern: a puff of the flame and a spark; its ember in flight (held, following the ember): a short hot tail, a
  // halo, sparks shed and falling; put out (when the Death clip ends): the wick's smoke, its last embers and its Lachryma rising as motes
  'wisp.cast': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.5, sizeEnd: 0.1, life: 0.14, color: 'white', colorEnd: 'ember' }),
    L({ type: 'sprites', count: [5, 7], shape: 'soft', dir: 'cone', cone: 40, speed: [1, 2.5], size: [0.06, 0.1], sizeEnd: 0, life: [0.2, 0.35], drag: 4, color: 'ember', colorEnd: 'gold' }),
  ] },
  'wisp.cast.flight': { layers: [
    L({ type: 'sprites', dur: Infinity, rate: 120, shape: 'core', spawn: 'sphere', r: 0.03, size: [0.26, 0.32], sizeEnd: 0.03, life: 0.11, color: 'gold', colorEnd: 'ember', alpha: 0.9 }),
    L({ type: 'sprites', dur: Infinity, rate: 40, shape: 'soft', size: 0.55, sizeEnd: 0.4, life: 0.05, color: 'ember', alpha: 0.45 }),
    L({ type: 'sprites', dur: Infinity, rate: 22, shape: 'soft', spawn: 'sphere', r: 0.08, dir: 'sphere', speed: [0.3, 0.9], size: [0.04, 0.07], sizeEnd: 0, life: [0.3, 0.5], drag: 2, gravity: 2, color: ['ember', 'gold'] }),
  ] },
  'wisp.snuff': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 0.4, sizeEnd: 0.05, life: 0.18, color: 'gold', colorEnd: 'ember', powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'puff', spawn: 'sphere', r: 0.15, dir: 'up', speed: [0.4, 0.9], size: [0.25, 0.35], sizeEnd: 0.9, life: [1.2, 1.8], drag: 1.2, color: [0x4a403c, 0x6a5e56], alpha: 0.6, spin: [-1, 1] }),
    L({ type: 'sprites', count: [10, 14], shape: 'soft', spawn: 'sphere', r: 0.2, dir: 'cone', axis: 'up', cone: 50, speed: [0.6, 1.6], size: [0.07, 0.11], sizeEnd: 0, life: [0.8, 1.3], drag: 1.5, gravity: -0.6, color: ['ember', 'gold'] }),
    L({ type: 'sprites', count: [14, 18], shape: 'sparkle', spawn: 'sphere', r: 0.45, dir: 'up', speed: [0.3, 0.8], size: [0.1, 0.15], sizeEnd: 0, life: [1.6, 2.4], drag: 0.6, gravity: -0.4, color: ['lach', 'film', 'gold'], twinkle: 8, delay: [0, 0.4] }),
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

  // =============================================================================================== THE CASTER SHELLS' SHADERS (S1 to S5)
  // (docs/plans/CASTER-SHELLS.md section 1: the looks the shells are built from, each a `caster` layer of its module in vfx/caster/;
  // a shell's own effect `extends` one and adds its sparks, sound and weight)
  // heat haze: hot air over a place (the Volcano's cone), the Flamer's cone along the blow with ash drifting up, the Piercer's glass tube
  'caster.heatHaze': { layers: [
    L({ type: 'caster', shader: 'heathaze', dur: Infinity, shape: 'sphere', radius: 1.4, strength: 6, warmth: 0.08 }),
  ] },
  'caster.heatHaze.flame': { layers: [
    L({ type: 'caster', shader: 'heathaze', dur: Infinity, shape: 'cone', radius: 1.3, length: 4.5, strength: 8, warmth: 0.3, tint: 'ember' }),
    L({ type: 'sprites', pool: 'alpha', rate: 14, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.8, dir: 'up', speed: [0.4, 1.1], size: [0.05, 0.09], life: [1.2, 2], drag: 0.6, gravity: -0.6, color: [0x3a302a, 0x5b4c40], alpha: 0.7 }),
  ] },
  'caster.heatHaze.tube': { layers: [
    L({ type: 'caster', shader: 'heathaze', dur: 2, shape: 'tube', radius: 0.18, strength: 5, warmth: 0, glass: 0.8, k: [[0, 1.2], [0.6, 1], [1, 0]] }),
  ] },
  // the bubble: Stasis's sphere (glass, the Mind's schiller), the Barrier's glass dome, the Holowall's hex wall in your glaze colour
  'caster.bubble.stasis': { layers: [
    L({ type: 'caster', shader: 'bubble', dur: Infinity, shape: 'sphere', radius: 4, pattern: 'clear', tint: 0xc9d8ff, film: 0.7, labradorite: 0.35, grow: 0.35 }),
  ] },
  'caster.bubble.barrier': { layers: [
    L({ type: 'caster', shader: 'bubble', dur: Infinity, shape: 'dome', radius: 2.2, pattern: 'crackle', tint: 0xbfe8ff, film: 0.5, grow: 0.25 }),
  ] },
  'caster.bubble.wall': { layers: [
    L({ type: 'caster', shader: 'bubble', dur: Infinity, shape: 'wall', width: 4, height: 2.4, cell: 0.3, pattern: 'hex', tint: 'tint', film: 0.25 }),
  ] },
  // lightning: one strike from `from` to `to` (a return stroke that flickers twice), and an arc held between them
  'caster.lightning': { layers: [
    L({ type: 'caster', shader: 'lightning', dur: 0.45, branches: 4, rate: 20, k: [[0, 1.5], [0.15, 0.7], [0.3, 1.2], [0.5, 0.6], [1, 0]] }),
    L({ type: 'light', color: 0x9cc8ff, k: 40, range: 12, dur: 0.35 }),
  ] },
  'caster.lightning.arc': { layers: [
    L({ type: 'caster', shader: 'lightning', dur: Infinity, branches: 2, rate: 14, width: 0.03 }),
  ] },
  // frost and bisque, over the context's `target` from the hit: fired to bisque, frosted, crazed dry
  'caster.bisque': { layers: [
    L({ type: 'caster', shader: 'frostbisque', mode: 'bisque', dur: 5, spread: 0.9, k: [[0, 1], [0.92, 1], [1, 0]] }),
  ] },
  'caster.frost': { layers: [
    L({ type: 'caster', shader: 'frostbisque', mode: 'frost', dur: 5, spread: 1.4, k: [[0, 1], [0.9, 1], [1, 0]] }),
  ] },
  'caster.craze': { layers: [
    L({ type: 'caster', shader: 'frostbisque', mode: 'craze', dur: 4, spread: 3.5, k: [[0, 1], [0.9, 1], [1, 0]] }),
  ] },
  // the portal: a rift on the ground, opening as an eye and closing over its life
  'caster.rift': { layers: [
    L({ type: 'caster', shader: 'portal', mode: 'rift', dur: 6, width: 2.4, height: 1.6, k: [[0, 1], [1, 1]] }),
  ] },
  // =============================================================================================== CASTER SHELLS: S6 TO S10 (vfx/caster/: docs/plans/CASTER-SHELLS.md)
  // (each a `caster` layer: its module's look, placed, scaled and faded as a mesh is; the runner's other layers go beside them)
  'shell.insideOut': { layers: [ // (94: a black hole three times the size it was, the world bent round a dot of nothing, its ring turning;
    // grown, held, gone; the dust and light round it drawn in. What it does to the ground is shell.insideOut.land, vfx/shelllooks/caster.js)
    L({ type: 'caster', shader: 'lensing', dur: 3.2, size: 1.05, scale: 1, k: [[0, 0], [0.12, 1], [0.8, 1], [1, 0]], tint: 0xfff0c8 }),
    L({ type: 'sprites', rate: 50, dur: 2.5, shape: 'glint', spawn: 'shell', r: 7, dir: 'in', speed: [5.5, 7], size: [0.3, 0.5], sizeEnd: 0, life: [1, 1.2], color: ['lach', 'white', 'labradorite'], twinkle: 12 }),
    L({ type: 'sprites', pool: 'alpha', rate: 26, dur: 2.5, shape: 'puff', spawn: 'ring', r: 6, dir: 'swirl', lift: -0.1, speed: [5, 7], drag: 0.5, size: [1.4, 2], sizeEnd: 0.3, life: [1.1, 1.4], color: [0xd9b89a, 0x8a7aff], alpha: 0.5, spin: [-3, 3] }),
    L({ type: 'sprites', at: 2.6, count: 70, shape: 'streak', dir: 'sphere', speed: [22, 36], size: [0.5, 0.8], sizeEnd: 0.05, life: [0.35, 0.55], drag: 2, stretch: 2.5, color: ['white', 'lach', 0x8a7aff], powerCount: false }),
    L({ type: 'sprites', at: 2.6, count: 1, shape: 'ring', size: 2, sizeEnd: 16, life: 0.45, color: 'lach', powerCount: false }),
  ] },
  'shell.stasis': { layers: [ // (51: a sphere of stopped time, its colour drained and its grain frozen)
    L({ type: 'caster', shader: 'timegrade', dur: 5, radius: 2.6, drain: 0.95, grain: 0.55, rim: 0.7, k: [[0, 0], [0.04, 1], [0.92, 1], [1, 0]] }),
  ] },
  'shell.stopMotion': { layers: [ // (58: the zone drawn at twelve frames a real second, half drained)
    L({ type: 'caster', shader: 'timegrade', dur: 8, radius: 4, drain: 0.45, grain: 0.35, rim: 0.4, hold: 12, k: [[0, 0], [0.03, 1], [0.94, 1], [1, 0]] }),
  ] },
  'shell.holowall': { layers: [ // (76: a hex wall of hard light; the caller's tint is your glaze's)
    L({ type: 'caster', shader: 'hologram', dur: 6, hex: 1, k: [[0, 0], [0.05, 1], [0.9, 1], [1, 0]] }),
  ] },
  'shell.lavaLamp': { layers: [ // (23: a glob of molten clay, crusting over as it goes)
    L({ type: 'caster', shader: 'molten', dur: 5, size: 0.5, blobs: 5, crust: 0.1, crustEnd: 0.85, heat: 0.9, offset: [0, 0.5, 0], k: [[0, 0], [0.08, 1], [0.9, 1], [1, 0]] }),
  ] },
  'shell.corrupt': { layers: [ // (97: the body hit drawn as broken data, then drained into the point it was shot from; ctx.target the body)
    L({ type: 'caster', shader: 'corrupted', dur: 6, tear: 0.7, crush: 0.7, k: [[0, 0], [0.05, 1], [1, 1]] }),
  ] },
  // =============================================================================================== CASTER SHELLS, BATCH 1: THEIR LOOKS
  // (docs/plans/CASTER-SHELLS.md section 3's look column; vfx/shelllooks.js plays them by shell id: `fly` while its round is in the air,
  // `touch` at each bounce, `land` where it lands, `fire` at the muzzle, `set` on a thing set down. A held one (dur Infinity) is followed
  // and stopped by shelllooks.js at the shell's own `dur`; `r` is the context's (the shell's reach). No words, no numbers.)
  'shell.trail': { layers: [ // (any round with no tail of its own: a short one in its family's colour)
    L({ type: 'sprites', rate: 40, dur: Infinity, shape: 'soft', size: [0.12, 0.16], sizeEnd: 0.02, life: 0.22, color: 'tint', alpha: 0.9 }),
  ] },
  'shell.land': { layers: [ // (where any of them lands without a look of its own: a ring and a glint of its colour)
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.1, life: 0.22, color: 'tint', rot: 0 }),
    L({ type: 'sprites', count: 5, shape: 'sparkle', spawn: 'sphere', r: 0.3, size: [0.15, 0.25], sizeEnd: 0, life: [0.25, 0.45], color: ['tint', 'white'], twinkle: 16 }),
  ] },
  // 11 Ricochet Saw: a fired-clay throwing wheel, its gold rim, a smear of motion; sparks at each bounce
  'shell.ricochetSaw.fly': { layers: [
    L({ type: 'sprites', rate: 36, dur: Infinity, shape: 'crescent', size: [0.4, 0.5], sizeEnd: 0.3, life: 0.12, color: 0xc46a45, colorEnd: 'gold', alpha: 0.7, spin: [14, 22] }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'glint', spawn: 'shell', r: 0.18, size: [0.14, 0.22], sizeEnd: 0, life: 0.18, color: 'gold', twinkle: 24 }),
  ] },
  'shell.ricochetSaw.touch': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.7, sizeEnd: 0.1, life: 0.14, color: 'white', colorEnd: 'gold' }),
    L({ type: 'sprites', count: [9, 13], shape: 'streak', dir: 'cone', axis: 'normal', cone: 70, speed: [4, 9], size: [0.12, 0.2], sizeEnd: 0.02, life: [0.18, 0.3], drag: 5, stretch: 1.8, gravity: 6, color: ['gold', 'white'], colorEnd: 'ember' }),
  ] },
  // 12 Skipstone: a flat Lachrymite stone glinting, a ring laid on the ground at each skip (on crude, its oil film)
  'shell.skipstone.fly': { layers: [
    L({ type: 'sprites', rate: 14, dur: Infinity, shape: 'sparkle', size: [0.1, 0.16], sizeEnd: 0, life: 0.3, color: 'labradorite', twinkle: 18 }),
  ] },
  'shell.skipstone.touch': { layers: [
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.55, scale: [[0, 0.12], [1, 0.75]], stretch: [1, [[0, 0.6], [1, 0.15]], 1], k: [[0, 1.4], [1, 0]], tint: 'tint', labradorite: 0.6 }),
    L({ type: 'sprites', pool: 'alpha', count: [4, 6], shape: 'puff', spawn: 'ring', r: 0.25, dir: 'out', lift: 0.4, speed: [0.6, 1.4], size: [0.2, 0.3], sizeEnd: 0.5, life: [0.4, 0.6], drag: 3, color: 0xd9b89a, alpha: 0.45 }),
    L({ type: 'sprites', count: [4, 6], shape: 'soft', dir: 'cone', axis: 'up', cone: 40, speed: [2, 3.5], size: 0.07, life: [0.35, 0.5], gravity: 9, color: 'tint' }),
  ] },
  'shell.skipstone.touch.crude': { extends: 'shell.skipstone.touch', layers: [
    L({ type: 'sprites', count: 6, shape: 'ripple', spawn: 'disc', r: 0.3, size: [0.3, 0.5], sizeEnd: 1.1, life: [0.4, 0.6], color: ['film0', 'film1', 'film2', 'film3'], alpha: 0.6 }),
  ] },
  // 14 Hailstorm (refired at twice the size): thirty-two shards in the glazes' colours out of the muzzle at once in a ring of white and a
  // spray of frost; where the cone lands, a white star, a ring out along the ground, the ground frost-bitten, shards stuck in it glinting
  'shell.hailstorm.fire': { layers: [
    L({ type: 'sprites', count: 1, shape: 'core', size: 4.4, sizeEnd: 0.4, life: 0.12, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.8, sizeEnd: 6.4, life: 0.22, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 32, shape: 'shard', dir: 'cone', cone: 13, speed: [26, 40], size: [0.64, 1], sizeEnd: 0.36, life: [0.24, 0.4], color: GLAZES, spin: [-20, 20], powerCount: false }),
    L({ type: 'sprites', count: 24, shape: 'glint', dir: 'cone', cone: 16, speed: [18, 30], size: [0.6, 1], sizeEnd: 0, life: [0.2, 0.32], color: 'white', twinkle: 20, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', dir: 'cone', cone: 18, speed: [10, 18], drag: 3, size: [0.8, 1.2], sizeEnd: 2.6, life: [0.4, 0.6], color: [0xf3efe6, 0xdfe8f0], alpha: 0.5, powerCount: false }),
  ] },
  'shell.hailstorm.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 9, sizeEnd: 0.5, life: 0.22, color: 'white', powerCount: false }),
    groundRing({ to: 18, from: 1, dur: 0.5, tint: 0xf3efe6, k: 1.4 }),
    scorch({ size: 7, dur: 6, tint: 0x6a5a48 }),
    L({ type: 'sprites', count: 40, shape: 'star4', spawn: 'disc', r: 4.8, size: [1, 1.8], sizeEnd: 0, life: [0.14, 0.24], color: 'white', powerCount: false }),
    debris({ shape: 'shard', count: 48, spawn: 'disc', r: 4.8, speed: [3, 8], cone: 50, size: [0.44, 0.76], life: [4, 5.5], color: GLAZES, pool: 'add' }),
    L({ type: 'sprites', pool: 'alpha', count: 20, shape: 'puff', spawn: 'disc', r: 4.4, dir: 'up', speed: [1.2, 2.8], size: [1.2, 1.8], sizeEnd: 3.2, life: [0.9, 1.3], drag: 2, color: [0xd9b89a, 0xf3efe6], alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', rate: 22, dur: 4, shape: 'glint', spawn: 'disc', r: 4.8, size: [0.5, 0.8], sizeEnd: 0, life: 0.4, color: ['white', 'labradorite'], twinkle: 12 }),
  ] },
  // 16 Mallet: the clay head that bloomed in flight slams down: a ring along the floor, a cake of dust, chips
  'shell.mallet.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 14, dur: Infinity, shape: 'puff', size: [0.5, 0.7], sizeEnd: 1.3, life: 0.5, drag: 2, color: 0xd9b89a, alpha: 0.4 }),
  ] },
  'shell.mallet.land': { layers: [ // (the head three times its old size: its ring out along the floor past the room, a dent pressed in, the floor's
    // chips and clods thrown up and lying there; the shake and hitstop it always had, nothing more)
    L({ type: 'sprites', count: 1, shape: 'core', size: 4.5, sizeEnd: 0.5, life: 0.2, color: 'white', colorEnd: 0xf3e6d8, powerCount: false }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.7, scale: [[0, 1], [1, 10]], stretch: [1, [[0, 1.4], [1, 0.3]], 1], k: [[0, 1.8], [1, 0]], tint: 0xf3e6d8, labradorite: 0.1 }),
    groundRing({ to: 26, from: 1.5, dur: 0.65, tint: 0xf3e6d8 }),
    scorch({ size: 5.5, dur: 6, tint: 0x8a8e96 }),
    L({ type: 'sprites', pool: 'alpha', count: 30, shape: 'puff', spawn: 'ring', r: 1.6, dir: 'out', lift: 0.12, speed: [6, 13], size: [1.4, 2], sizeEnd: 4, life: [0.9, 1.4], drag: 2.6, color: [0xd9b89a, 0xc9a27a], alpha: 0.6, spin: [-1, 1], powerCount: false }),
    debris({ count: 40, speed: [5, 12], size: [0.15, 0.35], life: [4, 6] }),
    debris({ shape: 'facet', count: 10, speed: [4, 8], cone: 50, size: [0.4, 0.7], life: [5, 7], color: [0xb4603f, 0x8c4a33] }),
    L({ type: 'shake', k: 0.5 }),
    L({ type: 'hitstop', dur: 0.06 }),
  ] },
  // 18 Pinball: chrome, its tail reddening with its speed (shelllooks.js turns the tint); each wall rings like a bumper
  'shell.pinball.fly': { layers: [
    L({ type: 'sprites', rate: 70, dur: Infinity, shape: 'soft', size: [0.16, 0.2], sizeEnd: 0.02, life: 0.25, color: 'tint', alpha: 0.85 }),
  ] },
  'shell.pinball.touch': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 1.5, life: 0.2, color: 'tint', rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.8, sizeEnd: 0.1, life: 0.12, color: 'white', powerCount: false }),
    L({ type: 'sprites', count: 6, shape: 'glint', dir: 'cone', axis: 'normal', cone: 80, speed: [2, 4], size: [0.15, 0.25], sizeEnd: 0, life: 0.2, drag: 4, color: ['white', 'tint'], twinkle: 24 }),
  ] },
  // 21 Flamer: heat haze over an orange-to-white flame along the aim, ash drifting up (held for its dur at the muzzle)
  'shell.flamer.fire': { extends: 'caster.heatHaze.flame', layers: [
    L({ type: 'sprites', rate: 80, dur: Infinity, shape: 'soft', dir: 'cone', cone: 14, speed: [6, 9], size: [0.1, 0.16], sizeEnd: 0.5, life: [0.35, 0.55], drag: 1.6, gravity: -1.5, color: 'white', colorEnd: [0xff7a2a, 0xe0401a], alpha: 0.9 }),
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'streak', dir: 'cone', cone: 20, speed: [7, 11], size: [0.12, 0.2], sizeEnd: 0.03, life: [0.2, 0.3], stretch: 1.6, color: 0xffd08a, colorEnd: 'ember' }),
  ] },
  // 24 Napalm: the slick (the paint map's oil film, its labradorite flash) catches a second later and burns
  'shell.napalm.land': { layers: [
    L({ type: 'sprites', count: 10, shape: 'drip', dir: 'cone', axis: 'up', cone: 60, speed: [2, 4], size: [0.1, 0.16], life: [0.4, 0.6], gravity: 12, color: ['film0', 'film1', 'film2', 'film3'], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', at: 1, rate: 45, dur: Infinity, shape: 'soft', spawn: 'disc', r: 'r', dir: 'up', speed: [1, 2.4], size: [0.3, 0.42], sizeEnd: 0.05, life: [0.5, 0.8], gravity: -1.5, color: 0xffd08a, colorEnd: [0xff7a2a, 0xc8401a], alpha: 0.9 }),
    L({ type: 'sprites', at: 1, rate: 12, dur: Infinity, shape: 'glint', spawn: 'disc', r: 'r', size: [0.14, 0.24], sizeEnd: 0, life: [0.3, 0.5], color: 'labradorite', twinkle: 10 }),
    L({ type: 'sprites', at: 1, pool: 'alpha', rate: 6, dur: Infinity, shape: 'puff', spawn: 'disc', r: 'r', dir: 'up', speed: [0.8, 1.4], size: [0.4, 0.6], sizeEnd: 1.3, life: [1.2, 1.8], drag: 0.6, color: [0x2a2420, 0x3a302a], alpha: 0.4, spin: [-0.6, 0.6] }),
    L({ type: 'light', at: 1, color: 'ember', k: 30, range: 7, dur: 1.2 }),
  ] },
  // 25 Detonator: a putty lump with a glaze bead (its body: shelllooks.js); a red spark trailing it
  'shell.detonator.fly': { layers: [
    L({ type: 'sprites', rate: 24, dur: Infinity, shape: 'soft', size: 0.08, sizeEnd: 0.01, life: 0.16, color: 0xff3a2a }),
  ] },
  // 28 Cinder: one ember and its ribbon of smoke
  'shell.cinder.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 26, dur: Infinity, shape: 'puff', size: [0.05, 0.07], sizeEnd: 0.2, life: [0.8, 1.1], drag: 1.2, gravity: -0.5, color: [0x3a302a, 0x5b4c40], alpha: 0.45, spin: [-1, 1] }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'soft', size: 0.05, sizeEnd: 0, life: [0.2, 0.4], dir: 'sphere', speed: [0.2, 0.6], color: 0xffb060, colorEnd: 0xff5a1a }),
  ] },
  // 35 Lightning Rod: a copper glint on the body that holds it
  'shell.lightningRod.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.8, sizeEnd: 0.1, life: 0.2, color: 0xf0c090, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.2, life: 0.25, color: 0xd99a5a, rot: 0, powerCount: false }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'sparkle', spawn: 'shell', r: 0.45, size: [0.12, 0.2], sizeEnd: 0, life: [0.4, 0.6], color: [0xd99a5a, 0xf0c090], twinkle: 10 }),
  ] },
  // 38 Static Cling: sparks where the props meet the body, crackling in to it
  'shell.staticCling.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 0.9, sizeEnd: 0.1, life: 0.16, color: 0xbfe0ff, powerCount: false }),
    L({ type: 'sprites', rate: 16, dur: Infinity, shape: 'streak', spawn: 'shell', r: 0.7, dir: 'in', speed: [2, 4], size: [0.1, 0.16], sizeEnd: 0.02, life: [0.12, 0.2], stretch: 1.6, color: [0xbfe0ff, 'white'] }),
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'glint', spawn: 'shell', r: 0.4, size: [0.15, 0.25], sizeEnd: 0, life: 0.15, color: 0x9fd0ff, twinkle: 30 }),
  ] },
  // 41 Inhaler: a vortex at the muzzle drawing in (held while it draws; the clods it spits fly as clods)
  'shell.inhaler.fire': { layers: [
    L({ type: 'sprites', rate: 70, dur: Infinity, shape: 'soft', spawn: 'shell', r: 1.4, dir: 'in', speed: [3, 4.5], size: [0.05, 0.09], sizeEnd: 0.02, life: 0.32, color: [0xd9c8b0, 'lach'], alpha: 0.85 }),
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'swirl', size: 0.7, sizeEnd: 0.2, life: 0.35, spin: [8, 10], color: 'lach', alpha: 0.7 }),
  ] },
  'shell.clod.fly': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 12, dur: Infinity, shape: 'puff', size: [0.12, 0.18], sizeEnd: 0.3, life: 0.35, drag: 2, color: 0xb89a7a, alpha: 0.4 }),
  ] },
  // 46 Balloon: the body bobbing on the air, light bubbles rising from under it
  'shell.balloon.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'puff', spawn: 'sphere', r: 0.4, dir: 'out', speed: [0.6, 1.2], size: [0.3, 0.45], sizeEnd: 0.8, life: 0.6, drag: 3, color: [0xffd6e6, 0xd6ecff], alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'bubble', spawn: 'sphere', r: 0.5, offset: [0, -0.4, 0], dir: 'up', speed: [0.4, 0.9], size: [0.1, 0.2], sizeEnd: 0.25, life: [1, 1.4], color: [0xffc0d8, 0xc0e0ff, 0xfff0a0], alpha: 0.85 }),
  ] },
  // 47 Leadweight: the ground dimples under it; dust settling
  'shell.leadweight.land': { layers: [
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.5, scale: [[0, 0.2], [1, 1.5]], stretch: [1, [[0, 0.5], [1, 0.1]], 1], k: [[0, 1.2], [1, 0]], tint: 0x8a6a4a, offset: [0, -0.5, 0] }),
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'puff', spawn: 'ring', r: 0.5, offset: [0, -0.5, 0], dir: 'out', lift: 0.3, speed: [1.5, 3], size: [0.3, 0.45], sizeEnd: 0.8, life: [0.8, 1.1], drag: 3, gravity: 1.2, color: 0xc9a27a, alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', rate: 3, dur: Infinity, shape: 'puff', spawn: 'ring', r: 0.4, offset: [0, -0.5, 0], dir: 'out', speed: [0.2, 0.5], size: 0.25, sizeEnd: 0.5, life: 1, gravity: 0.6, color: 0xbfa080, alpha: 0.35 }),
  ] },
  // 56 Weather Away: crazing spreads over the clay hit (S4's craze) and dry flakes fall off it
  'shell.weatherAway.land': { extends: 'caster.craze', layers: [
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'puff', spawn: 'sphere', r: 0.3, speed: [0.3, 0.8], size: [0.25, 0.35], sizeEnd: 0.6, life: 0.7, drag: 2, color: 0xe0c8a8, alpha: 0.5, powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: 4, shape: 'chip', spawn: 'sphere', r: 0.45, speed: [0.1, 0.4], size: [0.04, 0.08], life: [0.8, 1.2], gravity: 6, color: [0xe0c8a8, 0xc9a27a], alphaEnd: 0.6, spin: [-8, 8], floor: 'ground' }),
  ] },
  // 61 Infector: a green glow, a sickly bubbling round the body (held while it is infected)
  'shell.infector.land': { layers: [
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'soft', size: [0.7, 0.9], sizeEnd: 0.5, life: 0.6, color: 0x5a9a3a, alpha: 0.35 }),
    L({ type: 'sprites', pool: 'alpha', rate: 12, dur: Infinity, shape: 'bubble', spawn: 'sphere', r: 0.45, dir: 'up', speed: [0.3, 0.8], size: [0.06, 0.14], sizeEnd: 0.18, life: [0.5, 0.8], color: [0x8ad06a, 0xb8f070, 0x5a9a3a], alpha: 0.9 }),
    L({ type: 'sprites', pool: 'alpha', rate: 3, dur: Infinity, shape: 'drip', spawn: 'sphere', r: 0.35, size: [0.06, 0.1], life: 0.6, gravity: 8, color: 0x7ab85a, alpha: 0.9 }),
  ] },
  // 62 Taunt Doll: the painted doll spinning where it was set down; its bell's ring seen as a ring going out from it
  'shell.tauntDoll.fly': { layers: [
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'sparkle', size: [0.1, 0.16], sizeEnd: 0, life: 0.3, color: 'gold', twinkle: 18 }),
  ] },
  'shell.tauntDoll.set': { layers: [
    L({ type: 'sprites', rate: 1.6, dur: Infinity, shape: 'ringthin', offset: [0, 0.8, 0], size: 0.2, sizeEnd: 1.4, life: 0.5, color: 'gold', alpha: 0.8, rot: 0 }),
    L({ type: 'sprites', rate: 4, dur: Infinity, shape: 'glint', offset: [0, 0.8, 0], spawn: 'sphere', r: 0.12, size: [0.15, 0.25], sizeEnd: 0, life: 0.25, color: ['gold', 'white'], twinkle: 20 }),
  ] },
  // 64 Pottify: a puff of slip (the pot's body is M7's, later)
  'shell.pottify.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 16, shape: 'puff', spawn: 'sphere', r: 0.4, dir: 'sphere', speed: [1, 2.4], size: [0.4, 0.55], sizeEnd: 1, life: [0.6, 0.9], drag: 3, color: [0xe8d6c0, 0xd9c2a5], alpha: 0.8, spin: [-1, 1], powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'drip', dir: 'cone', axis: 'up', cone: 70, speed: [1.5, 3], size: [0.08, 0.12], life: 0.6, gravity: 10, color: 0xe8d6c0, floor: 'ground', powerCount: false }),
    L({ type: 'glyph', kind: 'bang1', color: 0xe8d6c0, size: 0.45, up: 0.9 }),
  ] },
  // 66 Stage Fright: a spotlight from nowhere on each one frozen, motes hanging in its beam
  'shell.stageFright.land': { layers: [
    L({ type: 'mesh', mesh: 'ult_pillar', dur: Infinity, scale: 0.32, tint: 0xfff4d6, labradorite: 0, opacity: 0.9, spin: 0, offset: [0, 1.2, 0], in: 8, out: 3 }),
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'soft', spawn: 'column', r: [0.1, 0.6], height: 3, offset: [0, -0.4, 0], dir: 'up', speed: [0.05, 0.15], size: [0.04, 0.07], life: [1.2, 1.8], color: 0xfff4d6, alpha: 0.6 }),
    L({ type: 'light', color: 0xfff4d6, k: 30, range: 6, dur: 0.8, up: 2.5 }),
  ] },
  // 67 Paranoia: question marks popping over it as its eyes dart
  'shell.paranoia.land': { layers: [
    L({ type: 'glyph', kind: 'ask', color: 0xc8a0e0, size: 0.45, up: 0.7 }),
    L({ type: 'glyph', kind: 'ask', at: 1.6, color: 0xc8a0e0, size: 0.35, up: 0.8, burst: false }),
    L({ type: 'glyph', kind: 'ask', at: 3.4, color: 0xc8a0e0, size: 0.35, up: 0.7, burst: false }),
    L({ type: 'glyph', kind: 'ask', at: 5.4, color: 0xc8a0e0, size: 0.35, up: 0.8, burst: false }),
  ] },
  // 68 Lullaby: a cloud of drifting notes (the notes themselves are Wanda's, in the music's scale)
  'shell.lullaby.land': { layers: [
    L({ type: 'glyph', kind: 'note', color: 0xbcd6ff, size: 0.45, up: 0.6 }),
    L({ type: 'glyph', kind: 'note', at: 1.5, color: 0xd6c8ff, size: 0.35, up: 1.1, burst: false }),
    L({ type: 'glyph', kind: 'note', at: 3, color: 0xbcd6ff, size: 0.35, up: 0.8, burst: false }),
    L({ type: 'glyph', kind: 'note', at: 4.5, color: 0xd6c8ff, size: 0.35, up: 1.2, burst: false }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 'r', dir: 'swirl', lift: 0.2, speed: [0.2, 0.5], size: [0.12, 0.2], sizeEnd: 0, life: [1.4, 2], color: [0xbcd6ff, 0xe0d0ff, 'white'], twinkle: 4 }),
    L({ type: 'sprites', pool: 'alpha', rate: 3, dur: Infinity, shape: 'puff', spawn: 'disc', r: 'r', dir: 'swirl', lift: 0, speed: [0.2, 0.4], size: [1, 1.5], sizeEnd: 2, life: [2, 3], color: 0xc8d8f0, alpha: 0.18, spin: [-0.3, 0.3] }),
  ] },
  // 70 Forget Me: a grey fog over the Courier (how it sees you now), a breath of it where it struck
  'shell.forgetMe.land': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 8, shape: 'puff', spawn: 'sphere', r: 0.3, speed: [0.3, 0.8], size: [0.3, 0.45], sizeEnd: 0.8, life: 0.8, drag: 2, color: 0x9a9aa0, alpha: 0.5, powerCount: false }),
  ] },
  'shell.forgetMe.courier': { layers: [
    L({ type: 'sprites', pool: 'alpha', rate: 5, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.5, offset: [0, 1, 0], speed: [0.1, 0.3], size: [0.5, 0.7], sizeEnd: 1, life: [1, 1.4], color: [0x9a9aa0, 0xb0b0b8], alpha: 0.22, spin: [-0.4, 0.4] }),
  ] },
  // 72 Agents: tiny clappers with fuse tails, sputtering
  'shell.agents.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', offset: [0, 0.12, 0], size: 0.06, sizeEnd: 0, life: 0.15, dir: 'up', speed: [0.5, 1.5], color: 0xffd08a, colorEnd: 'ember' }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'glint', offset: [0, 0.12, 0], size: [0.1, 0.16], sizeEnd: 0, life: 0.12, color: 'gold', twinkle: 30 }),
  ] },
  // 53 Overdrive: a gold tick going out from the hands on the beat, the tools' haste in the air round them
  'shell.overdrive.fire': { layers: [
    L({ type: 'sprites', rate: 2, dur: Infinity, shape: 'ringthin', offset: [0, 1.1, 0], size: 0.4, sizeEnd: 1.3, life: 0.35, color: 0xe8d080, alpha: 0.8, rot: 0 }),
    L({ type: 'sprites', rate: 12, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.45, offset: [0, 1.1, 0], dir: 'up', speed: [1, 2], size: [0.1, 0.16], sizeEnd: 0.02, life: 0.3, stretch: 1.4, color: [0xe8d080, 'white'] }),
  ] },
  // 81 to 87, the Feelings: each its feeling's colour (the context's tint) and its paint motif
  'shell.wonder.land': { layers: [ // (an aurora overhead, frost glinting on the ground)
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.5, sizeEnd: 5, life: 0.5, color: 'tint', rot: 0, powerCount: false }),
    L({ type: 'sprites', rate: 16, dur: Infinity, shape: 'streak', spawn: 'disc', r: 6, offset: [0, 7, 0], dir: 'up', speed: [0.2, 0.5], size: [1.4, 2.2], sizeEnd: 1.6, stretch: 3, life: [1.6, 2.6], color: ['tint', 0x7af0c0, 0xb49be6], alpha: 0.5 }),
    L({ type: 'sprites', rate: 26, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 4, offset: [0, 0.1, 0], size: [0.1, 0.2], sizeEnd: 0, life: [0.8, 1.2], color: ['white', 0xbfe8ff], twinkle: 6 }),
  ] },
  'shell.mirth.land': { layers: [ // (confetti in Mirth's dots)
    L({ type: 'sprites', count: 1, shape: 'star4', size: 1.4, sizeEnd: 0.2, life: 0.2, color: 'tint', powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 70, shape: 'disc', dir: 'cone', axis: 'up', cone: 55, speed: [4, 8], size: [0.07, 0.11], life: [1.6, 2.4], drag: 1.4, gravity: 5, color: ['tint', 0xfff0c0, 0xff8ab0, 0x8ad0ff, 0x9ae070], spin: [-6, 6], floor: 'ground', powerCount: false }),
  ] },
  'shell.desire.land': { layers: [ // (rings drawing in along the ground, a warm pull of light)
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, scale: [[0, 3.5], [1, 0.3]], stretch: [1, 0.25, 1], k: [[0, 0], [0.3, 1.2], [1, 0]], tint: 'tint', labradorite: 0.2 }),
    L({ type: 'mesh', mesh: 'chest_shock', dur: 0.9, at: 0.45, scale: [[0, 3.5], [1, 0.3]], stretch: [1, 0.25, 1], k: [[0, 0], [0.3, 1.2], [1, 0]], tint: 'tint', labradorite: 0.2 }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', spawn: 'shell', r: 'r', dir: 'in', speed: [3, 5], size: [0.1, 0.16], sizeEnd: 0.04, life: [1, 1.4], color: ['tint', 0xffc080], alpha: 0.8 }),
  ] },
  'shell.fury.land': { layers: [ // (cracks of red thrown off the body, a hard ring pulsing out of it)
    L({ type: 'sprites', count: 1, shape: 'star4', size: 1, sizeEnd: 0.1, life: 0.16, color: 'tint', powerCount: false }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'shard', spawn: 'sphere', r: 0.5, dir: 'out', speed: [1, 2], size: [0.1, 0.18], sizeEnd: 0.04, life: 0.4, color: ['tint', 0xff4020], spin: [-6, 6] }),
    L({ type: 'sprites', rate: 1.5, dur: Infinity, shape: 'ring', size: 0.3, sizeEnd: 1.6, life: 0.3, color: 0xff3020, rot: 0 }),
  ] },
  'shell.gall.land': { layers: [ // (a curdled cloud)
    L({ type: 'sprites', pool: 'alpha', rate: 10, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 'r', dir: 'swirl', lift: 0.1, speed: [0.2, 0.5], size: [0.8, 1.1], sizeEnd: 1.6, life: [1.5, 2.2], color: ['tint', 0x6a7a3a, 0xa08ad0], alpha: 0.42, spin: [-0.5, 0.5] }),
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: Infinity, shape: 'bubble', spawn: 'sphere', r: 'r', speed: [0.1, 0.3], size: [0.1, 0.2], sizeEnd: 0.05, life: [1, 1.5], color: 0xd0c8a0, alpha: 0.8 }),
  ] },
  'shell.grief.land': { layers: [ // (one cloud over its head, raining on it)
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: Infinity, shape: 'puff', spawn: 'sphere', r: 0.4, offset: [0, 0.7, 0], speed: [0.05, 0.15], size: [0.5, 0.7], sizeEnd: 0.9, life: 1.2, color: [0x4a5a7a, 0x5a6a8a], alpha: 0.6, spin: [-0.3, 0.3] }),
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'streak', spawn: 'disc', r: 0.4, offset: [0, 0.5, 0], dir: 'up', speed: [-7, -5], size: 0.14, sizeEnd: 0.1, stretch: 2, life: 0.28, color: 'tint', alpha: 0.85 }),
  ] },
  'shell.dread.land': { layers: [ // (shadows spreading along the ground, Dread's marbling in them)
    L({ type: 'sprites', pool: 'alpha', count: 30, shape: 'puff', spawn: 'disc', r: 1, dir: 'out', lift: 0, speed: [3, 6], size: [1, 1.4], sizeEnd: 2.6, life: [1.6, 2.4], drag: 1.5, color: [0x140c1e, 0x1f2a22], alpha: 0.6, spin: [-0.4, 0.4], powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'swirl', spawn: 'disc', r: 3, size: [1, 1.6], life: [1.8, 2.4], color: ['tint', 0x2a3a2a], alpha: 0.5, spin: [-0.6, 0.6], powerCount: false }),
  ] },
  // (batches 2 to 4, each family's effects in its own module: vfx/shelllooks/<family>.js)
  ...SHELL_EFFECTS,
  ...RACEWAY_EFFECTS,
  ...RACEWAY_CAVERN_EFFECTS,
  ...RACEWAY_PARK_EFFECTS,
  ...SKIFF_BOARD_EFFECTS,
  ...RACEWAY_PROPS_EFFECTS,
  ...RACEWAY_SIPHON_EFFECTS,
};
