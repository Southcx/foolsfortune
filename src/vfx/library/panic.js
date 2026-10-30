// ---------------------------------------------------------------------------------------
// PANIC'S EFFECTS (library entries: vfx/library.js spreads them in, vfx/panic.js plays them over a creature struck by a thrown thing,
// world/impacts.js `impact.hit { panic }`). The mark itself is a glyph (vfx/glyphs.js 'panic', 'panicHeavy': the startle lines and the
// sweat drops drawn); these are what flies off it, so the startle moves:
//   panic         the plewds flung: a few pale sky-blue drops thrown up and out off the head, falling, and a thin ring popped round it
//   panic.heavy   a flooring hit: more drops, thrown harder, the ring wider, and the squeans (Mort Walker's word: the little stars of a
//                 head knocked dizzy) spun off round it in gold and white
// Prior art: Dawn of Mana's panic over a struck foe (its burst of sweat and its stars), the comics' plewds and squeans (Mort Walker,
// The Lexicon of Comicana, 1980), the Looney Tunes knock's stars circling a head.
//
//   PANIC_EFFECTS   panic  panic.heavy   (ctx: { pos } the head's top)
// ---------------------------------------------------------------------------------------
const L = (o) => o;
const SWEAT = [0x9fd4ff, 0xc8e8ff, 0x7fbef0];

export const PANIC_EFFECTS = {
  // a creature struck by a thrown thing: its sweat flung off, a ring popped round its head
  panic: { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [3, 4], shape: 'drip', spawn: 'sphere', r: 0.15, dir: 'cone', axis: 'up', cone: 70, speed: [2.2, 3.4], size: [0.09, 0.13], sizeEnd: 0.06, life: [0.45, 0.65], gravity: 9, drag: 1, color: SWEAT, alpha: 1.1, alphaEnd: 0.4, powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ringthin', size: 0.3, sizeEnd: 1.4, life: 0.28, color: 'white', alpha: 0.85, powerCount: false }),
  ] },
  // a flooring hit: more sweat thrown harder, a wider ring, and the squeans spun off round the head
  'panic.heavy': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [6, 8], shape: 'drip', spawn: 'sphere', r: 0.2, dir: 'cone', axis: 'up', cone: 80, speed: [3, 4.6], size: [0.1, 0.15], sizeEnd: 0.06, life: [0.5, 0.75], gravity: 9, drag: 1, color: SWEAT, alpha: 1.1, alphaEnd: 0.4, powerCount: false }),
    L({ type: 'sprites', count: [5, 6], shape: 'star4', spawn: 'ring', r: 0.42, dir: 'swirl', lift: 0.15, speed: [2.2, 3.2], size: [0.16, 0.22], sizeEnd: 0, life: [0.6, 0.9], drag: 2.2, gravity: 0, color: ['gold', 'white'], twinkle: 16, spin: [-6, 6], powerCount: false }),
    L({ type: 'sprites', count: 1, shape: 'ring', size: 0.5, sizeEnd: 2.2, life: 0.32, color: 'white', alpha: 0.8, powerCount: false }),
  ] },
};
