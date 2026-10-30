// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS WITH THE DREAMVANE AS THE MAIN: the dowse's sweep and the fork (its spun arc as it is thrown, its ringing where it
// flies and sticks) are the hero in the main's Pentacles gold, and the sub's lent verb rides them in the sub's colour (kit.js). Played by
// vfx/pairspeciallooks.js on Petra's events (tools/pairspecials.js), authored at the feet of what it is on (the Courier, the fork, a
// hidden signature), heights in metres up, a line from the caller's `from` to its `to`:
//   II     Revelation (+ the Veritome, Swords)   .use the Flash and the dowse at once   .mark held on each hidden signature shown (seen
//          through walls: a column of the vane's gold, the Flash's iris over it)
//   VII    Slingshot (+ the Sondelass, Swords)   .use the fork thrown far, the hook's line paid out after it   .hold the air torn past
//          the Courier while flung (its dir the flight's)   .hit the claws biting the fork
//   XVI    Lightning Rod (+ the psygun, Wands)   .use the fork thrown with the gun's spark   .mark the bolt gathering on the fork (0.6 s)
//          .hit the bolt down onto it (lightning from the caller's `from`, the sky, to `to`, the fork)
//   XVII   Painted Lure (+ the Soul Brush, Cups; the paint the brush's load's feeling)   .use the paint let go from the fork in flight
//          .hold riding the fork while it paints: the stream of paint falling from it   .mark a stamp's splash where the paint lands
//   XVIII  Singing Mirage (+ the Crucibelle, Wands)   .use the fork thrown ringing   .hit the mirage rising where it lands   .hold the
//          singing decoy: the bell's ring once a beat, the song's reach on the ground
//
// Prior art: the kit's; Splatoon's ink trail off a thrown sub weapon (the Painted Lure), Metroid Prime's scan visor and Batman: Arkham's
// detective mode (Revelation's marks through walls), Kid Icarus and Ratchet & Clank's swingshot (the Slingshot's fling), Ben Franklin's
// kite and Zeus's bolt (the Lightning Rod), the Sirens' song and Okami's Konohana (the Singing Mirage).
//
//   DREAMVANE_MAIN_EFFECTS   pair.2.use .mark   pair.7.use .hold .hit   pair.16.use .mark .hit   pair.17.use .hold .mark   pair.18.use .hit .hold
// ---------------------------------------------------------------------------------------
import {
  K, HOLD, RIM, RING_OUT, fx, pairSides, own, sprites, weight, core, groundRing, lamp, skyColumn, mist, dust, smoke, lens, iris, blinkOut, specks, shock, chips,
  dustCurtain, motesIn, sweepUp, shimmer, muzzle, bite, steelLine, tollRing, tollGround, tollSmoke, flashBurst, inkStroke, paintSplash, paintDrops,
  forkArc, forkRing,
} from './kit.js';

const P2 = pairSides(2), P7 = pairSides(7), P16 = pairSides(16), P17 = pairSides(17), P18 = pairSides(18);
/** SECONDARY: sparks thrown along the throw (a cone round the dir), white cooling to `c`. */
const thrown = (R, c, o = {}) => sprites(R, { count: [8, 10], shape: 'sparkle', spawn: 'point', dir: 'cone', axis: 'dir', cone: 25, speed: [3, 6], size: [0.06, 0.1], sizeEnd: 0,
  life: [0.3, 0.5], drag: 2, color: 'white', colorEnd: c }, { offset: [0, 1.2, 0], ...o });

export const DREAMVANE_MAIN_EFFECTS = {
  // ---- II Revelation: the Flash and the dowse at once: every hidden signature near you shown and tagged ---------------------------
  // (at the Courier) the Flash and the dowse's sweep together
  'pair.2.use': fx(
    // PRIMARY: the Flash's rays at the chest (the Veritome's), the dowse's sweep racing out on the ground (the vane's), its heart
    flashBurst(P2.B.r, K, { r: 1.2, y: 1.3 }), lens(P2.A.r, K, { r: 12, dur: 1 }), core(K, { s: 1, y: 1.3 }),
    // SECONDARY: a second sweep in the Flash's steel just behind it; the iris opened at the eyes
    lens(P2.B.r, K, { r: 9, dur: 0.9, at: 0.12, kmul: 0.6 }), iris(P2.B.r, K, { r: 0.45, y: 1.6 }),
    // TERTIARY: specks of both left hanging, stars blinking out from the middle
    specks(K, { r: 3, height: 2, color: P2.A.c }), blinkOut(K, { r: 5, color: 'white', colorEnd: P2.B.c }),
    lamp(K, { color: P2.B.c, k: 22 }), weight(K, { flash: 0.12, color: 0xfff4e6 }),
  ),
  // (held on a hidden signature while it is shown; the looks draw it through walls) a column of the vane's gold, tagged
  'pair.2.mark': fx(
    // PRIMARY: a thin column of the vane's gold stood on it, its foot a ring on the ground
    own(P2.A.r, HOLD, { hold: true, form: 'pillar', main: 'noise', tile: [2, 2], scroll: [0, 0.8], mask: 'streaks', maskK: 0.5, maskTile: [3, 2], maskScroll: [0, 1.4], scale: 1,
      stretch: [1, 2.4, 1], edgeV: [0.05, 0.6], rim: -0.3 }),
    groundRing(P2.A.r, HOLD, { hold: true, r: 0.6 }),
    // SECONDARY: the Flash's iris over it, turning: it is tagged
    iris(P2.B.r, HOLD, { hold: true, r: 0.3, y: 1.4 }),
    // TERTIARY: specks rising off it
    sprites(HOLD, { rate: 4, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 0.3, dir: 'up', speed: [0.3, 0.7], size: [0.05, 0.09], sizeEnd: 0, life: [0.8, 1.2],
      color: 'white', colorEnd: P2.A.c, twinkle: 4 }),
  ),

  // ---- VII Slingshot: throw the fork far and hook to it, flung through the air ----------------------------------------------------
  // (at the Courier, its line to the fork) the fork thrown, the hook's line paid out after it
  'pair.7.use': fx(
    // PRIMARY: the fork's spun arc at the hand (the vane's), its heart; the hook's steel line out to it
    forkArc(P7.A.r, K, { r: 0.9 }), core(K, { s: 0.7, y: 1.2 }), steelLine(K, P7.B.c),
    // SECONDARY: the hook's claws snapping shut on the line at the hand; sparks thrown along the throw
    bite(P7.B.r, K, { r: 0.35, y: 1.2, dur: 0.25 }), thrown(K, P7.A.c),
    // TERTIARY: dust at the feet
    dust(K, { count: [3, 4], alpha: 0.25 }),
    lamp(K, { color: P7.A.c, k: 14, up: 1.2 }),
  ),
  // (riding the Courier while flung; its dir the way they fly) the air torn past
  'pair.7.hold': fx(
    // PRIMARY: a band of streaks round the body scrolling back (the hook's steel)
    own(P7.B.r, HOLD, { hold: true, form: 'band', main: 'streaks', tile: [6, 1], scroll: [0, -2.4], mask: 'noise', maskTile: [3, 1], maskScroll: [0.2, -1], scale: 0.6, stretch: [1, 3, 1],
      offset: [0, 0.1, 0], edgeV: [0.3, 0.3], rim: -0.5, kmul: 0.9 }),
    // SECONDARY: wind streaks rushing back past the body, against the flight
    sprites(HOLD, { rate: 40, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 1, offset: [0, 1, 0], dir: 'cone', axis: 'dir', cone: 12, speed: [-9, -6], size: [0.08, 0.12], sizeEnd: 0.03,
      life: [0.15, 0.25], stretch: 5, color: 'white', colorEnd: P7.B.c, alpha: 0.7 }),
    // TERTIARY: the vane's motes left hanging where the body passed
    sprites(HOLD, { rate: 14, dur: Infinity, shape: 'soft', spawn: 'column', r: 0.25, height: 1.6, offset: [0, 0.2, 0], dir: 'sphere', speed: [0, 0.3], size: [0.04, 0.08], sizeEnd: 0,
      life: [0.5, 0.8], drag: 1, color: 'white', colorEnd: P7.A.c }),
  ),
  // (at the fork where the hook bites it) the claws on the fork, the fork ringing
  'pair.7.hit': fx(
    // PRIMARY: the claws biting the fork (the steel), the fork ringing (the vane's), its heart
    bite(P7.B.r, K, { r: 0.5, y: 0.3 }), forkRing(P7.A.r, K, { r: 0.9, y: 0.3 }), core(K, { s: 0.8, y: 0.3 }),
    // SECONDARY: a ring thrown on the ground, chips torn up
    groundRing(P7.A.r, K, { r: 1.8 }), chips(K, { count: [6, 8] }),
    // TERTIARY: dust settling
    dust(K, { count: [4, 6], alpha: 0.25 }),
    lamp(K, { color: P7.A.c, k: 14, up: 0.4 }), weight(K, { shake: 0.1, color: P7.A.c }),
  ),

  // ---- XVI Lightning Rod: where the fork sticks, a bolt comes down ------------------------------------------------------------------
  // (at the Courier) the fork thrown with the gun's spark on it
  'pair.16.use': fx(
    // PRIMARY: the fork's spun arc (the vane's), the gun's cone of fire along the throw, its heart
    forkArc(P16.A.r, K, { r: 0.9 }), muzzle(P16.B.r, K, { r: 0.16, len: 0.6, y: 1.2 }), core(K, { s: 0.6, y: 1.2 }),
    // SECONDARY: the gun's sparks thrown along the throw
    thrown(K, P16.B.c),
    // TERTIARY: smoke at the hand
    smoke(K, { offset: [0, 1.2, 0], count: [2, 3] }),
    lamp(K, { color: P16.B.c, k: 12, up: 1.2 }),
  ),
  // (at the fork where it sticks) the bolt gathering, 0.6 real s
  'pair.16.mark': fx(
    // PRIMARY: a ring closing on the fork along the ground (the vane's), the gun's sparks drawn in to it
    own(P16.A.r, K, { form: 'hoop', main: 'noise', tile: [10, 1], scroll: [0.3, 0], scale: [[0, 2.6], [1, 0.25]], offset: [0, 0.05, 0], dur: 0.6, core: 0.5, coreAt: 0.4,
      erode: [[0, 0.5], [0.3, 0.06], [0.85, 0.1], [1, 1]], turn: 'random' }),
    motesIn(K, { r: 1.6, offset: [0, 0.4, 0], count: [12, 16], color: 'white', colorEnd: P16.B.c }),
    // SECONDARY: the fork ringing faster, glints climbing it
    forkRing(P16.A.r, K, { r: 0.5, y: 0.3, dur: 0.5 }),
    sprites(K, { count: [6, 8], shape: 'glint', spawn: 'column', r: 0.08, height: 0.8, dir: 'up', speed: [0.5, 1], size: [0.1, 0.16], sizeEnd: 0, life: [0.25, 0.4], delay: [0, 0.4],
      color: 'white', colorEnd: P16.B.c }),
  ),
  // (at the fork, its line from the sky down to it) the bolt
  'pair.16.hit': fx(
    // PRIMARY: the bolt: lightning from the sky to the fork in the gun's colour, a column dropped with it, its heart
    { type: 'caster', shader: 'lightning', dur: 0.45, branches: 4, rate: 20, tint: P16.B.c, k: [[0, 1.6], [0.15, 0.7], [0.3, 1.2], [0.5, 0.6], [1, 0]] },
    skyColumn(P16.B.r, K, { r: 0.35, h: 12, dur: 0.35 }), core(K, { s: 1.6, y: 0.4 }),
    // SECONDARY: the strike's shock run out on the ground (the vane's), chips thrown up
    shock(P16.A.r, K, { r: 4.5 }), chips(K, { count: [12, 16], dir: 'cone', axis: 'up', cone: 45, speed: [4, 8] }),
    // TERTIARY: smoke curling up, a dust curtain
    smoke(K, { count: [2, 3] }), dustCurtain(K, { r: 2, count: [6, 8], alpha: 0.22 }),
    lamp(K, { color: 0xfff2ea, k: 50, range: 18 }), weight(K, { flash: 0.15, shake: 0.3, stop: 0.05, color: 0xfff4e6 }),
  ),

  // ---- XVII Painted Lure: the lure thrown leaves a stream of paint behind it --------------------------------------------------------
  // (at the fork in flight, its first stamp) the paint let go
  'pair.17.use': fx(
    // PRIMARY: the fork ringing (the vane's gold), a burst of the paint's drops out of it, its heart
    forkRing(P17.A.r, K, { r: 0.8 }), core(K, { s: 0.6, y: 0 }),
    sprites(K, { count: [12, 16], shape: 'drip', spawn: 'sphere', r: 0.1, dir: 'sphere', speed: [1.5, 3], size: [0.06, 0.1], sizeEnd: 0.04, life: [0.5, 0.8], gravity: 9, drag: 0.5,
      floor: 'ground', color: 'feeling' }),
    // SECONDARY: the brush's flick: a stroke of sumi spun off it
    inkStroke(K, { r: 0.6, y: 0, dur: 0.4 }),
    // TERTIARY: the brush's blue motes
    sprites(K, { count: [6, 8], shape: 'soft', spawn: 'sphere', r: 0.3, dir: 'sphere', speed: [0.2, 0.5], size: [0.04, 0.07], sizeEnd: 0, life: [0.6, 0.9], drag: 1, color: P17.B.c }),
    lamp(K, { color: P17.A.c, k: 10, up: 0 }),
  ),
  // (riding the fork while it flies and paints; the looks keep its floor under it) the stream of paint falling from it
  'pair.17.hold': fx(
    // PRIMARY: the paint falling from the fork to the ground in drops of its feeling
    sprites(HOLD, { rate: 50, dur: Infinity, shape: 'drip', spawn: 'sphere', r: 0.08, dir: 'up', speed: [-2, -1], size: [0.06, 0.1], sizeEnd: 0.05, life: [0.6, 1], gravity: 9,
      floor: 'ground', color: 'feeling', alpha: 1 }),
    // SECONDARY: the fork's ring pulsing as it flies (its tone, the vane's gold); its sparkles trailing behind
    forkRing(P17.A.r, HOLD, { hold: true, r: 0.5 }),
    sprites(HOLD, { rate: 30, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.1, dir: 'sphere', speed: [0, 0.2], size: [0.05, 0.09], sizeEnd: 0, life: [0.3, 0.5],
      color: 'white', colorEnd: P17.A.c }),
    // TERTIARY: the brush's blue mist hanging along its path
    sprites(HOLD, { rate: 6, dur: Infinity, pool: 'alpha', shape: 'puff', spawn: 'sphere', r: 0.15, dir: 'sphere', speed: [0, 0.2], size: [0.2, 0.3], sizeEnd: 0.6, life: [0.6, 0.9],
      color: P17.B.c, alpha: 0.18 }),
  ),
  // (on the ground where a stamp of paint lands) its splash
  'pair.17.mark': fx(
    // PRIMARY: a small splash in the paint's motif, its crown of drops
    paintSplash(K, { r: 0.7, dur: 0.5 }), paintDrops(HOLD, { count: [4, 6], speed: [1, 2.2], y: 0.05 }),
    // SECONDARY: a ripple of the brush's blue run out
    own(P17.B.r, HOLD, { ...RIM, main: 'noise', tile: [6, 1], scroll: [0.2, 0], scale: [[0, 0.25], [1, 1]], offset: [0, 0.04, 0], dur: 0.4, erode: RING_OUT, turn: 'random' }),
  ),

  // ---- XVIII Singing Mirage: a decoy rises where the fork lands, singing so creatures go to it --------------------------------------
  // (at the Courier) the fork thrown ringing with the bell's song
  'pair.18.use': fx(
    // PRIMARY: the fork's spun arc (the vane's), the bell's ring at the hand, its heart
    forkArc(P18.A.r, K, { r: 0.9 }), tollRing(P18.B.r, K, { r: 1.2, y: 1.2, dur: 0.4 }), core(K, { s: 0.6, y: 1.2 }),
    // SECONDARY: the song's sparkles thrown along the throw
    thrown(K, P18.B.c),
    // TERTIARY: smoke rings off the bell
    tollSmoke(K, P18.B.c, { count: [2, 3] }),
    lamp(K, { color: P18.B.c, k: 12, up: 1.2 }),
  ),
  // (where the fork lands) the mirage rising
  'pair.18.hit': fx(
    // PRIMARY: the mirage rising out of the ground (a band swept up through the vane's gold), the bell's ring, its heart
    sweepUp(P18.A.r, K, { r: 0.5, h: 2 }), tollRing(P18.B.r, K, { r: 1.6, y: 1 }), core(K, { s: 0.8, y: 0.8 }),
    // SECONDARY: the song's hoop run out on the ground (the reach creatures will come from), its sparkles rising
    tollGround(P18.B.r, K, { r: 4 }),
    sprites(K, { count: [10, 14], shape: 'sparkle', spawn: 'column', r: 0.5, height: 1.6, dir: 'up', speed: [0.5, 1.2], size: [0.06, 0.1], sizeEnd: 0, life: [0.8, 1.2],
      color: 'white', colorEnd: P18.A.c, twinkle: 4 }),
    // TERTIARY: a mist breathed out round its foot
    mist(K, { count: [2, 3], alpha: 0.12 }),
    lamp(K, { color: P18.A.c, k: 16 }),
  ),
  // (held where the decoy stands, its life) the singing decoy
  'pair.18.hold': fx(
    // PRIMARY: the mirage's body: a band swept up through the vane's gold, a shimmer over it
    sweepUp(P18.A.r, HOLD, { hold: true, r: 0.45, h: 1.9 }), shimmer(P18.A.r, HOLD, { hold: true, r: 0.5, h: 2, kmul: 1.4 }),
    // SECONDARY: the song: the bell's ring thrown out from it once a beat, its hoop on the ground to the song's reach
    tollRing(P18.B.r, HOLD, { hold: true, r: 1.4, y: 1, loop: 0.8 }), tollGround(P18.B.r, HOLD, { hold: true, r: 3.5, loop: 1.6 }),
    // TERTIARY: the song's sparkles rising off it
    sprites(HOLD, { rate: 6, dur: Infinity, shape: 'sparkle', spawn: 'column', r: 0.4, height: 1.8, dir: 'up', speed: [0.3, 0.8], size: [0.05, 0.09], sizeEnd: 0, life: [0.8, 1.2],
      color: 'white', colorEnd: P18.B.c, twinkle: 4 }),
  ),
};
