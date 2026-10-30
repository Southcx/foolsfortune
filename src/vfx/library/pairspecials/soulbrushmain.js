// ---------------------------------------------------------------------------------------
// THE PAIR SPECIAL WITH THE SOUL BRUSH AS THE MAIN: the paint is the hero (a splash of the feeling's paint in its motif, the brush's
// Cups blue) and the sub's lent verb rides it in the sub's colour (kit.js). Played by vfx/pairspeciallooks.js on Petra's events
// (tools/pairspecials.js), authored at the feet of what it is on, heights in metres up:
//   XIV   Healing Song (+ the Crucibelle, Wands)   .use paint laid on the beat: the bell's hoop run across the paint   .hit the Courier's
//         cracks mended: gold cracks swept up the body (kintsugi)
//
// Prior art: the kit's; Temperance's Rider-Waite card (water poured between two cups), kintsugi (the mend in gold), Okami's Bloom and
// Final Fantasy's Cure (a light rising up the body), Crypt of the NecroDancer (the act on the beat paid more).
//
//   SOULBRUSH_MAIN_EFFECTS   pair.14.use .hit
// ---------------------------------------------------------------------------------------
import { K, fx, pairSides, own, core, lamp, grains, motesIn, sweepUp, inkMotes, tollRing, tollGround, tollSmoke, paintSplash, paintDrops } from './kit.js';

const P14 = pairSides(14);

export const SOULBRUSH_MAIN_EFFECTS = {
  // ---- XIV Healing Song: paint laid on the beat mends your cracks -------------------------------------------------------------------
  // (where the paint is laid on the beat) the bell's hoop across the paint
  'pair.14.use': fx(
    // PRIMARY: a splash of the paint laid (its feeling, its motif), the bell's hoop run out across it, its heart
    paintSplash(K, { r: 1.4 }), tollGround(P14.B.r, K, { r: 2.4 }), core(K, { s: 0.7, y: 0.3 }),
    // SECONDARY: the bell's ring stood over it, drops thrown up
    tollRing(P14.B.r, K, { r: 1, y: 0.8, dur: 0.4 }), paintDrops(K),
    // TERTIARY: smoke rings rising, the brush's motes
    tollSmoke(K, P14.B.c, { y: 0.6, count: [2, 3] }), inkMotes(K, { r: 0.8, color: P14.A.c }),
    lamp(K, { color: P14.B.c, k: 14, up: 0.5 }),
  ),
  // (on the Courier) the cracks mended
  'pair.14.hit': fx(
    // PRIMARY: the mend: gold cracks swept up the body and a shell of them flung round it and drawn shut (kintsugi), its heart
    sweepUp('gold', K, { r: 0.55, h: 2, main: 'cracks', mainK: 0.5, tile: [3, 2], g: 1.3 }),
    own('gold', K, { form: 'sphere', main: 'cracks', mainK: 0.6, tile: [4, 2], scroll: [0.05, 0.2], scale: [[0, 0.5], [0.3, 1.05], [1, 0.8]], offset: [0, 1, 0], rim: 0.6, dur: 0.7,
      erode: [[0, 0.3], [0.2, 0.06], [0.6, 0.1], [1, 1]] }),
    core(K, { s: 0.7, y: 1.1 }),
    // SECONDARY: the brush's blue drawn in to the body, the bell's ring pulsed once round the chest
    motesIn(K, { r: 1.6, color: P14.A.c }), tollRing(P14.B.r, K, { r: 1, y: 1.1, dur: 0.4, kmul: 0.7 }),
    // TERTIARY: gold grains falling
    grains(K, { r: 0.5, offset: [0, 1.2, 0], color: 'gold' }),
    lamp(K, { color: 'gold', k: 16 }),
  ),
};
