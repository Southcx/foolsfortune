// ---------------------------------------------------------------------------------------
// THE PAIR SPECIAL WITH THE CRUCIBELLE AS THE MAIN: the toll is the hero (its ring of sound stood facing the view and run out on the
// ground, the main's Wands) and the sub's lent verb rides it in the sub's colour (kit.js). Played by vfx/pairspeciallooks.js on Petra's
// events (tools/pairspecials.js), authored at the feet of what it is on, heights in metres up:
//   V   Rite (+ the Veritome, Swords)   .use a toll that reads: the bell's ring, the rite's circle written round you, the book's script
//       .mark on each creature the toll read: a scan climbing it, the lens's iris over its head
//
// Prior art: the kit's; bell and book (the Hierophant's Rider-Waite card: the rite, the teaching), Metroid Prime's scan and Persona's
// Analyze (a creature known better by what reached it), the Tibetan singing bowl's ring.
//
//   CRUCIBELLE_MAIN_EFFECTS   pair.5.use .mark
// ---------------------------------------------------------------------------------------
import { K, fx, pairSides, weight, core, lamp, iris, scan, specks, writtenRing, strokes, scriptBand, tollRing, tollGround, tollSmoke, flashBurst } from './kit.js';

const P5 = pairSides(5);

export const CRUCIBELLE_MAIN_EFFECTS = {
  // ---- V Rite: a toll that reads every creature it reaches, knowing it better -------------------------------------------------------
  // (at the Courier) the toll that reads
  'pair.5.use': fx(
    // PRIMARY: the toll's ring stood facing the view (the bell's), its hoop run out on the ground to its reach, its heart
    tollRing(P5.A.r, K, { r: 2.4, y: 1.3 }), tollGround(P5.A.r, K, { r: 6 }), core(K, { s: 1, y: 1.3 }),
    // PRIMARY: the rite's circle written round the Courier (the book's script)
    writtenRing(P5.B.r, K, { r: 2.6 }),
    // SECONDARY: the Flash's rays faint at the chest, a band of script circling it
    flashBurst(P5.B.r, K, { r: 0.9, y: 1.3, kmul: 0.5 }), scriptBand(P5.B.r, K, { r: 0.8, y: 1.1 }),
    // TERTIARY: smoke rings off the bell, the book's specks hanging
    tollSmoke(K, P5.A.c), specks(K, { r: 2, height: 2, color: P5.B.c }),
    lamp(K, { color: P5.A.c, k: 22 }), weight(K, { flash: 0.06, shake: 0.12, color: P5.A.c }),
  ),
  // (on each creature the toll read) it is known better
  'pair.5.mark': fx(
    // PRIMARY: a scan climbing its body (the book's steel), the toll's ring round it
    scan(P5.B.r, K, { r: 0.55, h: 1.9 }), tollRing(P5.A.r, K, { r: 0.9, y: 1, dur: 0.4 }),
    // SECONDARY: the lens's iris over its head, a page's stroke written beside it
    iris(P5.B.r, K, { r: 0.3, y: 2 }), strokes(P5.B.r, K, { r: 0.6, y: 1.3, at: 0.1 }),
    // TERTIARY: specks hanging
    specks(K, { r: 0.6, height: 1.6, count: [6, 8], color: P5.B.c }),
  ),
};
