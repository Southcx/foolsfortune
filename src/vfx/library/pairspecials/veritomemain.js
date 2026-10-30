// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS WITH THE VERITOME AS THE MAIN: the photograph is the hero (the Flash's rays and the shutter's iris closing, in the
// main's Swords steel and the Flash's warm white) and the sub's lent verb rides it in the sub's colour (kit.js). Played by
// vfx/pairspeciallooks.js on Petra's events (tools/pairspecials.js), authored at the feet of what it is on, heights in metres up:
//   IX    Illumined Page (+ the Soul Brush, Cups)   .use the photograph of a sigil, its strokes caught before the lens   .hit the sigil
//         written on what was photographed: its circle, its strokes, a seal
//   XII   Held Plate (+ the Lockheart, Cups)   .use the photograph, the coffin's chain thrown along the line to it   .hold on the creature
//         held still in time: a shell of cells that does not move, a clock ring, the chain in three still bands
//
// Prior art: the kit's; Fatal Frame's Camera Obscura (a photograph that binds), Okami's Brush strokes (a sigil written), the Hanged Man's
// Rider-Waite card (a moment held upside down in time), JoJo's The World (time stopped: everything in the frame held still).
//
//   VERITOME_MAIN_EFFECTS   pair.9.use .hit   pair.12.use .hold
// ---------------------------------------------------------------------------------------
import {
  K, HOLD, fx, pairSides, own, sprites, weight, core, lamp, specks, collar, writtenRing, strokes, scriptBand, seal, inkMotes, flashBurst, shutter,
  chainLinks,
} from './kit.js';

const P9 = pairSides(9), P12 = pairSides(12), WARM = 0xfff4e6; // (the Flash's own white: tools/veritome/flash.js)

export const VERITOME_MAIN_EFFECTS = {
  // ---- IX Illumined Page: photograph a sigil and it is written on what you photographed -------------------------------------------
  // (at the Courier) the photograph of the sigil
  'pair.9.use': fx(
    // PRIMARY: the Flash's rays, the shutter closing, its heart
    flashBurst(P9.A.r, K, { r: 1.1, y: 1.3 }), shutter(P9.A.r, K, { r: 0.8, y: 1.3 }), core(K, { s: 0.9, y: 1.3 }),
    // SECONDARY: the sigil's strokes caught in the air before the lens (the brush's, in its blue)
    strokes(P9.B.r, K, { r: 1, y: 1.3, at: 0.05 }),
    // TERTIARY: steel specks hanging
    specks(K, { r: 1.2, height: 1.6, count: [8, 10], color: P9.A.c }),
    lamp(K, { color: WARM, k: 20, up: 1.3 }), weight(K, { flash: 0.08, color: WARM }),
  ),
  // (on what was photographed) the sigil written on it
  'pair.9.hit': fx(
    // PRIMARY: the sigil's circle written round it on the ground (the brush's), its strokes at its chest (the plate's), a seal at its feet, its heart
    writtenRing(P9.B.r, K, { r: 1.6 }), strokes(P9.A.r, K, { r: 0.8, y: 1.1 }), seal(P9.B.r, K, { r: 0.6 }), core(K, { s: 0.8, y: 1 }),
    // SECONDARY: a band of the running hand circling its chest
    scriptBand(P9.B.r, K, { r: 0.6, y: 0.9 }),
    // TERTIARY: ink motes in the brush's blue drifting down
    inkMotes(K, { r: 0.8, color: P9.B.c }),
    lamp(K, { color: P9.B.c, k: 16 }), weight(K, { stop: 0.04 }),
  ),

  // ---- XII Held Plate: a photograph holds a creature still in time for a moment ----------------------------------------------------
  // (at the Courier, its line to the creature) the photograph, the coffin's chain thrown along it
  'pair.12.use': fx(
    // PRIMARY: the Flash's rays, the shutter closing, its heart
    flashBurst(P12.A.r, K, { r: 1.1, y: 1.3 }), shutter(P12.A.r, K, { r: 0.8, y: 1.3 }), core(K, { s: 0.9, y: 1.3 }),
    // SECONDARY: the coffin's chain thrown along the line to what it holds
    chainLinks(K, P12.B.c),
    // TERTIARY: steel specks hanging
    specks(K, { r: 1, height: 1.6, count: [6, 8], color: P12.A.c }),
    lamp(K, { color: WARM, k: 20, up: 1.3 }), weight(K, { flash: 0.08, stop: 0.05, color: WARM }),
  ),
  // (held on the creature while it is held) still in time
  'pair.12.hold': fx(
    // PRIMARY: a shell of cells round it that does not move (its time stopped), lit at its rim; a clock ring of ticks at its feet, turning slow
    own(P12.A.r, HOLD, { hold: true, form: 'sphere', main: 'cells', tile: [5, 3], scroll: [0, 0], scale: 0.95, offset: [0, 0.95, 0], rim: 0.85, rimPow: 2, core: 0.2, kmul: 0.8 }),
    own(P12.B.r, HOLD, { hold: true, form: 'ring', main: 'rays', tile: [12, 1], scroll: [0, 0], scale: 1.1, offset: [0, 0.04, 0], edgeV: [0.55, 0.15], spin: 0.25 }),
    // SECONDARY: the coffin's chain in three still bands round it
    [0.45, 0.95, 1.45].map((y) => collar(P12.B.r, HOLD, { hold: true, r: 0.62, h: 0.06, y, spin: 0 })),
    // TERTIARY: specks hung motionless round it
    sprites(HOLD, { rate: 4, dur: Infinity, shape: 'sparkle', spawn: 'column', r: 0.8, height: 1.8, dir: 'up', speed: 0, size: [0.05, 0.08], sizeEnd: 0, life: [1, 1.6],
      color: 'white', colorEnd: P12.A.c, twinkle: 2 }),
  ),
};
