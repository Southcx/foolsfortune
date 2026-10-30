// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS WITH THE PSYGUN AS THE MAIN: the shot is the hero (its muzzle's cone, its line, its star where it struck: the main's
// Wands) and the sub's lent verb rides it in the sub's colour (kit.js). Played by vfx/pairspeciallooks.js on Petra's events
// (tools/pairspecials.js); authored at the feet of what it is on (the Courier, a creature, a point on the ground), heights in metres up,
// a line from the caller's `from` to its `to` (the Courier's hand to what was struck):
//   I    Hooked Shot (+ the Sondelass, Swords)   .use the shot carrying the hook's line   .hit the round's star and the claws biting, the
//        line laid back to you   .hold its wake while it is hauled in
//   IV   On the Beat (+ the Crucibelle: Wands too, so the bell's gold)   .use the bell's ring at the hand and six glints, the chambers
//        .hold the beat on the ground while the six go   .hit a round's star in the toll's gold ring, staggering
//   XV   Chain Shot (+ the Lockheart, Cups)   .use the shot uncoiling the chain   .hit the collar snapped on   .hold the chain held
//        between the two (from one to the other, laid each frame)
//   XIX  The Mark (+ the Veritome, Swords)   .use the Flash's rays on what it marked, the reticle closing   .mark held on it while the
//        mark holds (its strength the rounds left)   .hit a homing round's star, the mark's ring snapped shut on it, its line from the muzzle
//   XXI  Full Circle (+ the Soul Brush, Cups; the paint the caller's feeling)   .use the shot trailing paint and gold   .hit the paint's
//        splash and the enso written round it (the circle closed)
//
// Prior art: the kit's; Hookshot's chain from Zelda (the line paid out behind the round), Scorpion's "Get over here!" (Mortal Kombat,
// 1992: a spear that hauls its catch back), the Crucible's and Guitar Hero's beat rings (the shot kept time), Destiny's Tether (a shot
// that binds two), Okami's Brush (the enso, the circle closed).
//
//   PSYGUN_MAIN_EFFECTS   pair.1.use .hit .hold   pair.4.use .hold .hit   pair.15.use .hit .hold   pair.19.use .mark .hit   pair.21.use .hit
// ---------------------------------------------------------------------------------------
import {
  K, HOLD, RIM, fx, pairSides, own, sprites, weight, core, groundRing, rimRing, lamp, smoke, specks, chips, tether, shellClose, collar, inkMotes,
  muzzle, tracer, shotStar, bite, steelLine, tollRing, tollGround, tollSmoke, flashBurst, shutter, paintSplash, paintDrops, enso, chainLinks,
} from './kit.js';

const P1 = pairSides(1), P4 = pairSides(4), P15 = pairSides(15), P19 = pairSides(19), P21 = pairSides(21);
/** SECONDARY: sparks thrown on along the shot, white cooling to `c`. */
const sparks = (R, c, o = {}) => sprites(R, { count: [8, 12], shape: 'streak', spawn: 'point', dir: 'cone', axis: 'dir', cone: 30, speed: [4, 8], size: [0.05, 0.09], sizeEnd: 0.01,
  life: [0.15, 0.3], drag: 1.5, stretch: 3, color: 'white', colorEnd: c }, o);
/** SECONDARY: gold glints rising off a line, what it passed mended (kintsugi's gold). */
const mendGlints = (R, o = {}) => sprites(R, { count: [8, 10], shape: 'glint', spawn: 'line', r: 0.1, dir: 'up', speed: [0.2, 0.5], size: [0.1, 0.16], sizeEnd: 0, life: [0.5, 0.8],
  delay: [0, 0.2], color: 'white', colorEnd: 'gold', twinkle: 6 }, o);

export const PSYGUN_MAIN_EFFECTS = {
  // ---- I Hooked Shot: a shot that drags what it hits to you -------------------------------------------------------------------
  // (at the Courier, its line to what it hit) the shot leaves carrying the hook's line
  'pair.1.use': fx(
    // PRIMARY: the muzzle's cone (the gun's), its heart; the round's line with the hook's steel riding it
    muzzle(P1.A.r, K), core(K, { s: 0.7, y: 1.3 }), tracer(K, P1.A.c), steelLine(K, P1.B.c, { count: [12, 16] }),
    // SECONDARY: sparks thrown on along the shot
    sparks(K, P1.A.c, { offset: [0, 1.3, 0] }),
    // TERTIARY: smoke at the muzzle
    smoke(K, { offset: [0, 1.3, 0], count: [3, 4] }),
    lamp(K, { color: P1.A.c, k: 14, up: 1.3 }),
  ),
  // (on the creature it struck) the round's star, the claws biting, the line laid back to you
  'pair.1.hit': fx(
    // PRIMARY: the round's star, the hook's claws closing on it, its heart
    shotStar(K, P1.A.c, { y: 1 }), bite(P1.B.r, K, { r: 0.6, y: 1 }), core(K, { s: 1, y: 1 }),
    // SECONDARY: two lines laid back toward the Courier (its dir points from them to it); chips torn off
    [-0.12, 0.12].map((d) => tether(P1.B.r, K, { len: 3, r: 0.05, y: 1, rot: Math.PI + d, dur: 0.7 })), chips(K, { count: [6, 8] }),
    // TERTIARY: steel specks hanging, a pale rim at its feet
    specks(K, { r: 0.6, height: 1.4, count: [8, 10], color: P1.B.c }), rimRing(P1.A.r, K, { r: 1.4 }),
    lamp(K, { color: P1.B.c, k: 18 }), weight(K, { shake: 0.12, stop: 0.05, color: P1.A.c }),
  ),
  // (held on the creature while it is hauled in) the line's collar on it and its wake
  'pair.1.hold': fx(
    // PRIMARY: the line's collar on it, its tether laid back toward the Courier
    collar(P1.B.r, HOLD, { hold: true, r: 0.5, y: 1 }), tether(P1.B.r, HOLD, { hold: true, len: 2.4, r: 0.05, y: 1, rot: Math.PI }),
    // SECONDARY: its wake: streaks shed where it is as it is hauled (they keep where they fell)
    sprites(HOLD, { rate: 30, dur: Infinity, shape: 'streak', spawn: 'column', r: 0.3, height: 1.4, offset: [0, 0.3, 0], dir: 'up', speed: [0, 0.2], size: [0.05, 0.08], sizeEnd: 0.01,
      life: [0.2, 0.35], color: 'white', colorEnd: P1.A.c, alpha: 0.8 }),
    // TERTIARY: dust kicked up at its feet
    sprites(HOLD, { rate: 8, dur: Infinity, pool: 'alpha', shape: 'puff', spawn: 'disc', r: 0.3, offset: [0, 0.1, 0], dir: 'up', speed: [0.3, 0.8], size: [0.3, 0.5], sizeEnd: 0.9,
      life: [0.5, 0.8], drag: 2, color: 0xcbb8a4, alpha: 0.3 }),
  ),

  // ---- IV On the Beat: six shots fired on the bell's beat, each one staggering -------------------------------------------------------
  // (at the Courier) the bell's ring at the gun hand, the six chambers on it
  'pair.4.use': fx(
    // PRIMARY: the toll's ring at the hand (the bell's gold), the muzzle (the gun's), its heart
    tollRing(P4.B.r, K, { r: 1.8, y: 1.3 }), muzzle(P4.A.r, K), core(K, { s: 0.9, y: 1.3 }),
    // SECONDARY: the toll on the ground; six glints turning round the chest, one a shot to come
    tollGround(P4.B.r, K, { r: 3.2 }),
    { type: 'sprites', count: 6, powerCount: false, shape: 'diamond', spawn: 'ring', r: 0.7, offset: [0, 1.2, 0], dir: 'swirl', lift: 0.2, speed: [0.6, 0.9], size: 0.14, sizeEnd: 0.05,
      life: 0.7, color: 'white', colorEnd: P4.A.c, spin: [-4, 4] },
    // TERTIARY: smoke rings off the bell
    tollSmoke(K, P4.B.c),
    lamp(K, { color: P4.B.c, k: 18, up: 1.3 }), weight(K, { shake: 0.1, color: P4.B.c }),
  ),
  // (held at the Courier while the six go) the beat kept on the ground
  'pair.4.hold': fx(
    // PRIMARY: a gold hoop out from the feet once a beat (0.5 real s: 120 bpm until the runtime says the beat)
    tollGround(P4.B.r, HOLD, { hold: true, r: 1.8, loop: 0.5 }),
    // SECONDARY: embers turning at the hip, the gun's
    sprites(HOLD, { rate: 8, dur: Infinity, shape: 'soft', spawn: 'ring', r: 0.6, offset: [0, 1.1, 0], dir: 'swirl', lift: 0.3, speed: [0.5, 1], size: [0.04, 0.07], sizeEnd: 0,
      life: [0.5, 0.8], color: 'white', colorEnd: P4.A.c }),
  ),
  // (on the creature a beat's shot staggers) the round's star in the toll's gold ring
  'pair.4.hit': fx(
    // PRIMARY: the round's star, the toll's gold ring round it, its heart
    shotStar(K, P4.A.c, { y: 1 }), tollRing(P4.B.r, K, { r: 1.1, y: 1, dur: 0.4 }), core(K, { s: 0.8, y: 1 }),
    // SECONDARY: the stagger's hoop on the ground, sparks thrown on
    tollGround(P4.B.r, K, { r: 1.5, dur: 0.45 }), sparks(K, P4.A.c, { offset: [0, 1, 0], count: [6, 8] }),
    // TERTIARY: a smoke ring rising
    tollSmoke(K, P4.B.c, { y: 1.1, count: [1, 2] }),
    weight(K, { stop: 0.03 }),
  ),

  // ---- XV Chain Shot: a shot that chains two creatures together where they stand --------------------------------------------------
  // (at the Courier, its line to what it hit) the shot uncoiling the coffin's chain
  'pair.15.use': fx(
    // PRIMARY: the muzzle, its heart, the round's line with the chain's links along it
    muzzle(P15.A.r, K), core(K, { s: 0.7, y: 1.3 }), tracer(K, P15.A.c), chainLinks(K, P15.B.c),
    // SECONDARY: links shaken off at the hand
    sprites(K, { count: [5, 7], shape: 'ringthin', spawn: 'sphere', r: 0.2, offset: [0, 1.3, 0], dir: 'sphere', speed: [1, 2], size: [0.1, 0.14], life: [0.3, 0.5], drag: 2,
      color: 'white', colorEnd: P15.B.c, spin: [-4, 4] }),
    // TERTIARY: smoke at the muzzle
    smoke(K, { offset: [0, 1.3, 0], count: [3, 4] }),
    lamp(K, { color: P15.A.c, k: 14, up: 1.3 }),
  ),
  // (on the first creature struck) the chain's collar snapped on
  'pair.15.hit': fx(
    // PRIMARY: the round's star, the collar snapped on, its heart
    shotStar(K, P15.A.c, { y: 1 }), collar(P15.B.r, K, { r: 0.55, y: 1 }), core(K, { s: 1, y: 1 }),
    // SECONDARY: links burst off the collar, the coffin's shell closing quick over it
    sprites(K, { count: [8, 10], shape: 'ringthin', spawn: 'ring', r: 0.5, offset: [0, 1, 0], dir: 'out', lift: 0.4, speed: [2, 4], size: [0.1, 0.15], life: [0.3, 0.5], drag: 3,
      color: 'white', colorEnd: P15.B.c, spin: [-5, 5] }),
    shellClose(P15.B.r, K, { r: 0.65, y: 0.9, dur: 0.45 }),
    // TERTIARY: a pale rim at its feet
    rimRing(P15.A.r, K, { r: 1.3 }),
    lamp(K, { color: P15.B.c, k: 16 }), weight(K, { shake: 0.12, stop: 0.05, color: P15.A.c }),
  ),
  // (held on the first creature, its line to the second, laid each frame) the chain between them
  'pair.15.hold': fx(
    // PRIMARY: the chain's links along the line, shed where it lies now
    sprites(HOLD, { rate: 100, dur: Infinity, shape: 'ringthin', spawn: 'line', r: 0.02, dir: 'line', speed: [0, 0.1], size: [0.17, 0.21], sizeEnd: 0.14, life: [0.3, 0.4],
      color: P15.B.c, alpha: 0.9, spin: [-2, 2] }),
    // SECONDARY: the collar on the one it is placed on
    collar(P15.B.r, HOLD, { hold: true, r: 0.5, y: 1 }),
    // TERTIARY: the gun's glints running down it
    sprites(HOLD, { rate: 6, dur: Infinity, shape: 'glint', spawn: 'line', dir: 'line', speed: [1, 2], size: [0.1, 0.16], sizeEnd: 0, life: [0.3, 0.5], color: 'white', colorEnd: P15.A.c }),
  ),

  // ---- XIX The Mark: the Flash marks a creature, and every chamber homes on the mark ---------------------------------------------
  // (on what the lent Flash marked) the Flash's rays, the gun's reticle closing on it
  'pair.19.use': fx(
    // PRIMARY: the Flash's rays at its chest (the Veritome's), the reticle's iris closing onto it (the gun's), its heart
    flashBurst(P19.B.r, K, { r: 1, y: 1 }), shutter(P19.A.r, K, { r: 0.8, y: 1, dur: 0.45 }), core(K, { s: 1.1, y: 1 }),
    // SECONDARY: six streaks drawn in onto it, one a chamber; a ring thrown out at its feet
    { type: 'sprites', count: 6, powerCount: false, shape: 'streak', spawn: 'shell', r: 1.6, offset: [0, 1, 0], dir: 'in', speed: [5, 7], size: 0.1, sizeEnd: 0.03, life: 0.24,
      stretch: 3, color: 'white', colorEnd: P19.A.c },
    groundRing(P19.A.r, K, { r: 1.4 }),
    // TERTIARY: steel specks hanging round it
    specks(K, { r: 0.8, height: 1.6, count: [8, 10], color: P19.B.c }),
    lamp(K, { color: P19.B.c, k: 18 }), weight(K, { flash: 0.06, stop: 0.04, color: P19.B.c }),
  ),
  // (held on the marked creature while the mark holds; the looks set its strength by the rounds left) the mark
  'pair.19.mark': fx(
    // PRIMARY: the mark: a ring of ticks stood facing the view over its chest, turning slowly, the gun's; a steel hoop round it
    own(P19.A.r, HOLD, { hold: true, form: 'ring', face: 'camera', main: 'rays', tile: [6, 1], scroll: [0.05, 0], mask: 'noise', maskTile: [2, 1], maskScroll: [0.1, 0], scale: 0.55,
      offset: [0, 1.05, 0], edgeV: [0.35, 0.2], spin: 0.8, core: 0.3, glow: 2.2 }),
    own(P19.B.r, HOLD, { hold: true, ...RIM, face: 'camera', main: 'noise', tile: [6, 1], scroll: [0.2, 0], scale: 0.72, offset: [0, 1.05, 0], spin: -0.5, kmul: 0.7 }),
    // SECONDARY: a hoop at its feet, turning the other way
    groundRing(P19.A.r, HOLD, { hold: true, r: 0.9, spin: -0.4 }),
    // TERTIARY: a glint now and then on the mark
    sprites(HOLD, { rate: 3, dur: Infinity, shape: 'glint', spawn: 'ring', r: 0.55, offset: [0, 1.05, 0], dir: 'up', speed: [0, 0.1], size: [0.12, 0.18], sizeEnd: 0, life: [0.3, 0.5],
      color: 'white', colorEnd: P19.B.c }),
  ),
  // (on the marked creature, its line from the muzzle to where the round struck) a homing round landing on the mark
  'pair.19.hit': fx(
    // PRIMARY: the round's star, the mark's ring snapped shut on it, its heart
    shotStar(K, P19.A.c, { y: 1 }),
    own(P19.B.r, K, { ...RIM, face: 'camera', main: 'noise', tile: [6, 1], scroll: [0.4, 0], scale: [[0, 0.9], [1, 0.12]], offset: [0, 1, 0], dur: 0.22, core: 0.6,
      erode: [[0, 0.24], [0.2, 0.05], [1, 0.7]] }),
    core(K, { s: 0.8, y: 1 }),
    // SECONDARY: the homing line from the muzzle, sparks thrown on through it
    tracer(K, P19.A.c, { count: [12, 16] }), sparks(K, P19.A.c, { offset: [0, 1, 0] }),
    // TERTIARY: steel specks
    specks(K, { r: 0.4, height: 0.6, offset: [0, 0.8, 0], count: [6, 8], color: P19.B.c }),
    lamp(K, { color: P19.A.c, k: 10 }), weight(K, { stop: 0.03 }),
  ),

  // ---- XXI Full Circle: a shot that paints where it lands and mends what it passes ----------------------------------------------
  // (at the Courier, its line to where it lands) the shot trailing paint and gold
  'pair.21.use': fx(
    // PRIMARY: the muzzle, its heart, the round's line
    muzzle(P21.A.r, K), core(K, { s: 0.7, y: 1.3 }), tracer(K, P21.A.c),
    // SECONDARY: a ribbon of the feeling's paint along the shot, gold glints rising off it (what it passed, mended)
    sprites(K, { count: [16, 20], shape: 'soft', spawn: 'line', r: 0.08, dir: 'line', speed: [0.2, 0.6], size: [0.08, 0.13], sizeEnd: 0.03, life: [0.4, 0.7], gravity: 2,
      color: 'feeling', alpha: 0.9 }),
    mendGlints(K),
    // TERTIARY: smoke at the muzzle
    smoke(K, { offset: [0, 1.3, 0], count: [2, 3] }),
    lamp(K, { color: P21.A.c, k: 14, up: 1.3 }),
  ),
  // (where it lands) the paint's splash and the enso written round it: the circle closed
  'pair.21.hit': fx(
    // PRIMARY: the paint's splash in its motif, the enso written round it in the brush's blue over its sumi, the round's star, its heart
    paintSplash(K, { r: 1.6 }), enso(P21.B.r, K, { r: 2.1 }), shotStar(K, P21.A.c, { y: 0.4 }), core(K, { s: 0.9, y: 0.4 }),
    // SECONDARY: drops thrown up, gold glints rising
    paintDrops(K), mendGlints(K, { spawn: 'disc', r: 1.4, offset: [0, 0.2, 0] }),
    // TERTIARY: ink motes in the brush's colour
    inkMotes(K, { r: 1.2, color: P21.B.c }),
    lamp(K, { color: P21.B.c, k: 16 }), weight(K, { shake: 0.1, stop: 0.03, color: P21.A.c }),
  ),
};
