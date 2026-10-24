// ---------------------------------------------------------------------------------------
// THE FLOURISHES' EFFECTS: what each of the Courier's flourishes (vfx/flourishes.js) throws into the air, as library entries
// (vfx/library.js spreads them in; vfx/vfx.js plays them). One family a slot, one entry an option, named `flourish.<slot>.<id>`:
//   flourish.step.<id>      a footprint's little extra (the print itself is vfx/flourishprints.js's)
//   flourish.dash.<id>      shed along a dash or a blink, every so many centimetres of the way
//   flourish.shatter.<id>   the vessel bursting (in place of courier/vessel/death.js's stock burst)
//   flourish.whole.<id>     the pieces coming home as the Courier is made whole (the body built up from the feet beside it)
//   flourish.aura.<id>      a held stream round a Courier standing still (subtle: off by default)
//   flourish.arrive.<id>    the gate-out's end and a Shrine's rest
// The colours come from the caller: 'tint' the option's main colour (the soul colour or a glaze, vfx/flourishes.js COLOURS), 'tip'
// its second. Everything is the sprite pools (vfx/sprites.js: the talisman, moth, leaf, die and comb cells were drawn for these) and
// the library's lamps: no program of its own.
//
// Prior art: Okami's brush flourishes and petal bursts (a body's every act trailing its own small weather), Kingdom Hearts' and
// Final Fantasy XIV's cosmetic "aura" and footstep glamours, Fortnite's contrails and emote-wraps (a cosmetic slot, an effect each),
// Diablo and Path of Exile's microtransaction footprints and portals (the arrival as a slot of its own), kintsugi and Jingdezhen's
// blue-and-white porcelain (the shatters), and the onmyoji's ofuda (the talismans).
// ---------------------------------------------------------------------------------------
import { COLOR } from '../progress/weather.js';

const L = (o) => o;
const FEELINGS = Object.values(COLOR); // (the seven feelings' colours, the one table: progress/weather.js)
const COBALT = [0x2a4fa0, 0x1d3a7e, 0x3a64b8]; // (Jingdezhen's underglaze blue)
const PORCELAIN = [0xf6f4ee, 0xeef0f2, 0xfbfaf6];
const INK = 0x140c1e;
const LEAVES = [0xc8642a, 0xd8a03a, 0x9a3a22, 0x7a8a3a, 0xe0b048];
const PETALS = [0xf6c6d2, 0xf2a8bc, 0xfbe4ea, 0xf7d3dc];
const PAPER = [0xf6efdc, 0xf2d36b, 0xf6efdc];
const GOLD = 'gold';

// (a burst that comes home: born on a shell of `r` m round the body's middle, flying in to it at a speed that arrives at `t`)
const home = (o, r, t) => L({ spawn: 'shell', r, dir: 'in', speed: r / t, life: t * 0.96, drag: 0, alphaEnd: 0.4, ...o });

export const FLOURISH_EFFECTS = {
  // ============================================================================================ FOOTPRINTS (a print's small extra)
  'flourish.step.blossom': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 2, shape: 'petal', spawn: 'disc', r: 0.12, dir: 'up', speed: [0.4, 0.8], gravity: 1.6, drag: 1.5, size: [0.05, 0.08], life: [0.6, 0.9], color: PETALS, alpha: 0.9, spin: [-6, 6], floor: 'ground' }),
  ] },
  'flourish.step.scorch': { layers: [
    L({ type: 'sprites', count: 3, shape: 'soft', spawn: 'disc', r: 0.1, dir: 'up', speed: [0.3, 0.8], gravity: -0.5, drag: 1, size: [0.03, 0.05], sizeEnd: 0, life: [0.5, 0.9], color: 0xffb060, colorEnd: 0xc8401a, twinkle: 16 }),
    L({ type: 'sprites', pool: 'alpha', count: 1, shape: 'puff', dir: 'up', speed: 0.3, size: 0.14, sizeEnd: 0.32, life: 0.7, drag: 2, color: 0x6a625c, alpha: 0.35 }),
  ] },
  'flourish.step.comb': { layers: [
    L({ type: 'sprites', count: 1, shape: 'glint', dir: 'up', speed: 0.2, size: 0.16, sizeEnd: 0, life: 0.3, color: 'tint' }),
  ] },
  'flourish.step.puddle': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 3, shape: 'soft', spawn: 'disc', r: 0.08, dir: 'cone', axis: 'up', cone: 50, speed: [0.6, 1.2], gravity: 9, size: [0.03, 0.05], life: [0.3, 0.5], color: 'tint', alpha: 0.9, floor: 'ground' }),
  ] },

  // ============================================================================================ DASH / BLINK (shed along the way)
  'flourish.dash.shards': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 2, shape: 'shard', spawn: 'sphere', r: 0.35, dir: 'sphere', speed: [0.4, 1.2], gravity: 7, drag: 1, size: [0.08, 0.13], life: [0.5, 0.8], color: 'tint', colorEnd: 'tip', alpha: 1.6, spin: [-12, 12], floor: 'ground' }),
    L({ type: 'sprites', count: 1, shape: 'glint', spawn: 'sphere', r: 0.4, size: [0.12, 0.2], sizeEnd: 0, life: 0.25, color: 'white' }),
  ] },
  'flourish.dash.ribbon': { layers: [ // (the ribbon itself is a weapon trail's: vfx/trail.js, fed by vfx/flourishes.js; these are its motes)
    L({ type: 'sprites', count: 1, shape: 'soft', spawn: 'sphere', r: 0.3, dir: 'up', speed: [0.1, 0.4], drag: 2, size: [0.06, 0.1], sizeEnd: 0, life: [0.4, 0.7], color: 'tint', twinkle: 8 }),
  ] },
  'flourish.dash.talismans': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 1, shape: 'talisman', spawn: 'sphere', r: 0.35, dir: 'sphere', speed: [0.3, 1], gravity: 1.1, drag: 2.4, size: [0.16, 0.22], life: [0.9, 1.3], color: PAPER, alpha: 1.5, spin: [-4, 4], twinkle: 5, floor: 'ground' }),
  ] },
  'flourish.dash.feelings': { layers: [
    L({ type: 'sprites', count: 3, shape: 'star4', spawn: 'sphere', r: 0.4, dir: 'sphere', speed: [0.3, 0.9], drag: 2, size: [0.06, 0.11], sizeEnd: 0, life: [0.4, 0.75], color: FEELINGS, twinkle: 12 }),
  ] },
  'flourish.dash.dice': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 1, shape: 'die', spawn: 'sphere', r: 0.3, dir: 'cone', axis: 'up', cone: 60, speed: [1, 2], gravity: 9, drag: 0.5, size: [0.1, 0.14], life: [0.6, 0.9], color: 'tint', colorEnd: 'tip', alpha: 1.5, spin: [-14, 14], floor: 'ground' }),
  ] },

  // ============================================================================================ THE SHATTER (the burst)
  'flourish.shatter.porcelain': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 44, shape: 'shard', spawn: 'sphere', r: 0.45, dir: 'sphere', speed: [2.5, 6.5], gravity: 9, drag: 0.6, size: [0.1, 0.2], life: [1.6, 2.4], color: PORCELAIN, alpha: 1.8, spin: [-14, 14], floor: 'ground', powerCount: false }),
    L({ type: 'sprites', pool: 'alpha', count: 26, shape: 'swirl', spawn: 'sphere', r: 0.45, dir: 'sphere', speed: [2, 6], gravity: 9, drag: 0.6, size: [0.08, 0.15], life: [1.6, 2.4], color: COBALT, alpha: 1.8, spin: [-10, 10], floor: 'ground' }),
    L({ type: 'sprites', count: 10, shape: 'glint', spawn: 'sphere', r: 0.6, size: [0.3, 0.5], sizeEnd: 0, life: [0.3, 0.5], color: 'white', delay: [0, 0.2] }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.4, sizeEnd: 3.2, life: 0.45, color: 0x7fa0e8 }),
    L({ type: 'light', color: 0x9fb8ff, k: 40, range: 9, dur: 0.6 }),
  ] },
  'flourish.shatter.kintsugi': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 40, shape: 'shard', spawn: 'sphere', r: 0.45, dir: 'sphere', speed: [2.5, 6], gravity: 9, drag: 0.6, size: [0.1, 0.19], life: [1.6, 2.4], color: ['tint', 'tint', 'tip'], alpha: 1.8, spin: [-14, 14], floor: 'ground' }),
    L({ type: 'sprites', count: 30, shape: 'streak', spawn: 'sphere', r: 0.3, dir: 'sphere', speed: [4, 9], drag: 3, stretch: 2, size: [0.1, 0.18], sizeEnd: 0.02, life: [0.35, 0.6], color: GOLD, colorEnd: 'white' }),
    L({ type: 'sprites', count: 16, shape: 'sparkle', spawn: 'sphere', r: 0.8, size: [0.15, 0.28], sizeEnd: 0, life: [0.6, 1], color: GOLD, twinkle: 18, delay: [0, 0.3] }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.4, sizeEnd: 3, life: 0.4, color: GOLD }),
    L({ type: 'light', color: 0xffd76a, k: 45, range: 9, dur: 0.7 }),
  ] },
  'flourish.shatter.ink': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 34, shape: 'drip', spawn: 'sphere', r: 0.4, dir: 'sphere', speed: [2, 6], gravity: 10, drag: 0.8, size: [0.1, 0.22], life: [1.2, 1.9], color: INK, alpha: 1.6, floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 12, shape: 'puff', spawn: 'sphere', r: 0.5, dir: 'out', speed: [0.6, 1.6], drag: 1.5, size: [0.6, 0.9], sizeEnd: 1.8, life: [1.3, 1.9], color: INK, alpha: 0.85, spin: [-1, 1] }),
    L({ type: 'sprites', pool: 'alpha', count: 10, shape: 'disc', spawn: 'sphere', r: 0.5, dir: 'sphere', speed: [1.5, 3.5], gravity: 10, size: [0.06, 0.12], life: [1, 1.6], color: 0xc8321e, alpha: 1.4, floor: 'ground' }), // (a few drops of the seal's vermilion in it)
    L({ type: 'sprites', count: 8, shape: 'soft', spawn: 'sphere', r: 0.5, size: [0.2, 0.35], sizeEnd: 0, life: [0.5, 0.8], color: 'tint' }),
  ] },
  'flourish.shatter.moths': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 38, shape: 'moth', spawn: 'sphere', r: 0.55, dir: 'sphere', speed: [1.5, 4], gravity: -1.2, drag: 1.6, size: [0.14, 0.22], life: [2.2, 3.2], color: [0xf2ead8, 0xe8dcc0, 'tint'], alpha: 1.6, spin: [-2, 2], twinkle: 26 }),
    L({ type: 'sprites', count: 24, shape: 'soft', spawn: 'sphere', r: 0.6, dir: 'up', speed: [0.2, 0.8], drag: 1, size: [0.04, 0.08], sizeEnd: 0, life: [1.2, 2], color: GOLD, twinkle: 9 }),
    L({ type: 'light', color: 0xf2ead8, k: 25, range: 7, dur: 0.6 }),
  ] },
  'flourish.shatter.leaves': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 44, shape: 'leaf', spawn: 'sphere', r: 0.55, dir: 'sphere', speed: [2, 4.5], gravity: 2.2, drag: 1.8, size: [0.13, 0.2], life: [2.6, 3.6], color: LEAVES, alpha: 1.6, spin: [-5, 5], twinkle: 7, floor: 'ground' }),
    L({ type: 'sprites', pool: 'alpha', count: 6, shape: 'puff', spawn: 'sphere', r: 0.4, dir: 'out', speed: [0.6, 1.2], drag: 2, size: 0.5, sizeEnd: 1.2, life: 1, color: 0xb89a6a, alpha: 0.5 }),
  ] },

  // ============================================================================================ MADE WHOLE (the pieces coming home)
  'flourish.whole.porcelain': { layers: [
    home({ type: 'sprites', pool: 'alpha', count: 30, shape: 'shard', size: [0.1, 0.17], color: PORCELAIN, alpha: 1, spin: [-8, 8] }, 1.6, 0.75),
    home({ type: 'sprites', pool: 'alpha', count: 16, shape: 'swirl', size: [0.08, 0.13], color: COBALT, alpha: 1, spin: [-8, 8] }, 1.6, 0.75),
    L({ type: 'sprites', at: 0.72, count: 8, shape: 'glint', spawn: 'column', r: 0.25, height: 1.8, offset: [0, -0.9, 0], size: [0.2, 0.32], sizeEnd: 0, life: 0.4, color: 'white' }),
  ] },
  'flourish.whole.kintsugi': { layers: [
    home({ type: 'sprites', pool: 'alpha', count: 30, shape: 'shard', size: [0.1, 0.17], color: ['tint', 'tint', 'tip'], alpha: 1, spin: [-8, 8] }, 1.7, 0.8),
    home({ type: 'sprites', count: 18, shape: 'streak', stretch: 1.5, size: [0.1, 0.16], color: GOLD }, 1.4, 0.8),
    L({ type: 'sprites', at: 0.78, count: 18, shape: 'sparkle', spawn: 'column', r: 0.28, height: 1.8, offset: [0, -0.9, 0], size: [0.12, 0.22], sizeEnd: 0, life: [0.6, 1], color: GOLD, twinkle: 18 }),
    L({ type: 'light', at: 0.75, color: 0xffd76a, k: 30, range: 6, dur: 0.8 }),
  ] },
  'flourish.whole.ink': { layers: [
    home({ type: 'sprites', pool: 'alpha', count: 28, shape: 'drip', size: [0.1, 0.18], color: INK, alpha: 1 }, 1.5, 0.7),
    L({ type: 'sprites', pool: 'alpha', count: 6, shape: 'puff', spawn: 'sphere', r: 0.4, size: [1.2, 1.5], sizeEnd: 0.2, life: 0.8, color: INK, alpha: 0.7, spin: [-2, 2] }),
  ] },
  'flourish.whole.moths': { layers: [
    home({ type: 'sprites', pool: 'alpha', count: 32, shape: 'moth', size: [0.14, 0.2], color: [0xf2ead8, 0xe8dcc0, 'tint'], alpha: 1, twinkle: 26 }, 2.6, 1),
    L({ type: 'sprites', at: 0.95, count: 14, shape: 'soft', spawn: 'column', r: 0.3, height: 1.8, offset: [0, -0.9, 0], dir: 'up', speed: 0.4, size: [0.05, 0.09], sizeEnd: 0, life: 0.9, color: GOLD, twinkle: 9 }),
  ] },
  'flourish.whole.leaves': { layers: [
    home({ type: 'sprites', pool: 'alpha', count: 34, shape: 'leaf', size: [0.13, 0.19], color: LEAVES, alpha: 1, spin: [-6, 6] }, 2.2, 0.95),
  ] },

  // ============================================================================================ THE IDLE AURA (held; subtle)
  'flourish.aura.motes': { layers: [
    L({ type: 'sprites', rate: 5, dur: Infinity, spawn: 'disc', r: 0.55, dir: 'up', speed: [0.15, 0.4], drag: 0.4, size: [0.04, 0.08], sizeEnd: 0, life: [2.4, 3.4], color: 'tint', alpha: 0.7, twinkle: 3 }),
  ] },
  'flourish.aura.comb': { layers: [
    L({ type: 'sprites', rate: 2, dur: Infinity, spawn: 'ring', r: 0.75, dir: 'swirl', lift: 0.04, speed: 0.14, size: [0.12, 0.16], sizeEnd: 0.1, life: 3.5, color: 'tint', alpha: 0.45, rot: 0 }),
  ] },
  'flourish.aura.embers': { layers: [
    L({ type: 'sprites', rate: 6, dur: Infinity, spawn: 'disc', r: 0.4, dir: 'up', speed: [0.5, 1], gravity: -0.4, drag: 0.6, size: [0.025, 0.05], sizeEnd: 0, life: [1.4, 2.2], color: 0xffb060, colorEnd: 0xc8401a, twinkle: 14 }),
    L({ type: 'sprites', pool: 'alpha', rate: 0.7, dur: Infinity, spawn: 'disc', r: 0.3, dir: 'up', speed: 0.35, drag: 0.8, size: 0.18, sizeEnd: 0.5, life: 2.2, color: 0x7a706a, alpha: 0.18, spin: [-0.5, 0.5] }),
  ] },
  'flourish.aura.die': { layers: [ // (h.pos walked round the Courier by vfx/flourishes.js: the die is its head, the stream its tail)
    L({ type: 'sprites', rate: 26, dur: Infinity, shape: 'die', size: 0.12, sizeEnd: 0.04, life: 0.32, color: 'tint', alpha: 0.55, rot: 0 }),
    L({ type: 'sprites', rate: 0.5, dur: Infinity, shape: 'glint', size: 0.22, sizeEnd: 0, life: 0.3, color: 'tip' }),
  ] },

  // ============================================================================================ THE ARRIVAL (at the feet)
  'flourish.arrive.column': { layers: [
    L({ type: 'sprites', count: 40, shape: 'streak', spawn: 'disc', r: 0.45, dir: 'up', speed: [3, 5.5], drag: 1.5, stretch: 2.2, size: [0.12, 0.2], sizeEnd: 0.02, life: [0.5, 0.9], color: 'tint', colorEnd: 'white' }),
    L({ type: 'sprites', count: 1, shape: 'core', offset: [0, 0.1, 0], size: 1.4, sizeEnd: 0.4, life: 0.5, color: 'tint' }),
    L({ type: 'sprites', count: 1, shape: 'ring', offset: [0, 0.05, 0], size: 0.3, sizeEnd: 2.2, life: 0.45, color: 'tint' }),
    L({ type: 'light', color: 'tint', k: 26, range: 7, dur: 0.7, up: 1 }),
  ] },
  'flourish.arrive.petals': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 52, shape: 'petal', spawn: 'column', r: 1.1, height: 2.2, dir: 'swirl', lift: -0.3, speed: [1.6, 2.6], drag: 0.8, gravity: 0.8, size: [0.07, 0.11], life: [1.6, 2.4], color: PETALS, alpha: 1.4, spin: [-6, 6], twinkle: 6, floor: 'ground' }),
  ] },
  'flourish.arrive.talismans': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: 14, shape: 'talisman', spawn: 'disc', r: 1, offset: [0, 2.6, 0], gravity: 1.4, drag: 1.2, size: [0.18, 0.24], life: [1.6, 2.2], color: PAPER, alpha: 1.6, spin: [-3, 3], twinkle: 4, floor: 'ground' }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', offset: [0, 0.05, 0], size: 0.4, sizeEnd: 2.4, life: 0.5, color: 0xc8321e }),
  ] },
  'flourish.arrive.smoke': { layers: [ // (the kiln's door opened on them)
    L({ type: 'sprites', pool: 'alpha', count: 14, shape: 'puff', spawn: 'disc', r: 0.6, dir: 'out', lift: 0.4, speed: [1, 2], drag: 2, size: [0.5, 0.7], sizeEnd: 1.4, life: [1, 1.4], color: [0x8a807a, 0x6a625c], alpha: 0.55, spin: [-1, 1] }),
    L({ type: 'sprites', count: 18, shape: 'soft', spawn: 'disc', r: 0.5, dir: 'up', speed: [0.8, 1.8], gravity: -0.5, drag: 0.8, size: [0.03, 0.06], sizeEnd: 0, life: [0.8, 1.4], color: 0xffb060, colorEnd: 0xc8401a, twinkle: 14 }),
    L({ type: 'light', color: 0xff9a5c, k: 18, range: 6, dur: 0.6 }),
  ] },
};
