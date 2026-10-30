// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS WITH THE LOCKHEART AS THE MAIN: the coffin is the hero (its gulp, its wheel of odds, its Opening's burst, in the
// main's Cups blue and Lachryma's film) and the sub's lent verb rides it in the sub's colour (kit.js). Played by vfx/pairspeciallooks.js
// on Petra's events (tools/pairspecials.js), authored at the feet of what it is on, heights in metres up:
//   III   Coffin's Mop (+ the Soul Brush: Cups too, so the paint's own feeling; crude's film where it is crude)   .use the first sip
//         gulped (at the receiver: the coffin's mouth, or the Lachrymato Bottle when the brush wears one; heights 0)   .hold the paint
//         drawn up its line into the receiver (the line from the ground being drunk, laid each frame)   .mark held on the ground where
//         the hoover drinks: the paint swirled in to its middle
//   X     Turn of Weather (+ the Dreamvane, Pentacles)   .use the wheel of odds spun overhead with the vane   .hit the weather turned
//         where you stand, falling in its feeling (the caller's ctx.feeling)
//   XX    Last Call (+ the Crucibelle, Wands)   .use the toll opening the coffin: all it drank burst out as a wave (ctx.power its fill)
//         .hit the wave's blow on each creature it strikes
//
// Prior art: the kit's; Luigi's Mansion 3's Poltergust drinking paint and Splatoon's ink (the Coffin's Mop), the Wheel of Fortune's
// Rider-Waite card and Final Fantasy X's slot reels (Turn of Weather's wheel and its pip), Pandora's jar and the Last Judgement's
// trumpet (Last Call), Final Fantasy XII's Quickening shockwaves (a wave whose size is what was banked).
//
//   LOCKHEART_MAIN_EFFECTS   pair.3.use .hold .mark   pair.10.use .hit   pair.20.use .hit
// ---------------------------------------------------------------------------------------
import {
  K, HOLD, fx, pairSides, own, sprites, weight, core, groundRing, lamp, inked, growsIn, skyColumn, armillary, starFall, mist, bloomDome, chips,
  shock, shockFront, dustCurtain, spiralIn, motesIn, tollRing, tollGround, tollSmoke, coffinGulp,
} from './kit.js';

const P3 = pairSides(3), P10 = pairSides(10), P20 = pairSides(20);

export const LOCKHEART_MAIN_EFFECTS = {
  // ---- III Coffin's Mop: the coffin drinks spilled paint and crude as it passes, and the brush pours it back as paint ---------------
  // (at the receiver, the first sip of a hold) the gulp
  'pair.3.use': fx(
    // PRIMARY: the coffin's gulp on the receiver (its ink shell, the cups' rim closing), its heart
    coffinGulp(P3.A.r, K, { r: 0.45, y: 0, dur: 0.4 }), core(K, { s: 0.6, y: 0, at: 0.15 }),
    // SECONDARY: a spiral of the paint drawn in round it
    spiralIn('feeling', K, { r: 0.6, h: 0.8, y: -0.4, dur: 0.6 }),
    // TERTIARY: the paint's motes drawn in
    motesIn(K, { r: 1.2, offset: [0, 0, 0], color: 'feeling' }),
    lamp(K, { color: P3.A.c, k: 12, up: 0 }),
  ),
  // (held at the receiver while the hoover drinks paint; its line from the ground being drunk, laid each frame) the paint drawn up
  'pair.3.hold': fx(
    // PRIMARY: the paint drawn up the line into the receiver: streaks of its feeling running in
    sprites(HOLD, { rate: 80, dur: Infinity, shape: 'streak', spawn: 'line', r: 0.12, dir: 'in', speed: [4.5, 6.5], size: [0.09, 0.13], sizeEnd: 0.03, life: [0.3, 0.45], stretch: 2.5,
      color: 'feeling', colorEnd: P3.A.c, alpha: 0.95 }),
    // SECONDARY: a small whirl turning at the mouth (the coffin's blue)
    spiralIn(P3.A.r, HOLD, { hold: true, r: 0.35, h: 0.5, y: -0.25, kmul: 0.8 }),
    // TERTIARY: drops of it falling back where they missed
    sprites(HOLD, { rate: 6, dur: Infinity, shape: 'drip', spawn: 'line', r: 0.1, dir: 'up', speed: [-1, 0], size: [0.05, 0.08], life: [0.4, 0.6], gravity: 9, floor: 'ground',
      color: 'feeling' }),
  ),
  // (held on the ground where the hoover drinks) the paint swirled in to its middle
  'pair.3.mark': fx(
    // PRIMARY: the paint being drunk: a disc of its motif turning, its pattern flowing in to the middle
    own('feeling', HOLD, { hold: true, form: 'disc', main: 'motif', mainK: 0.55, tile: [3, 1], scroll: [0.15, -0.6], mask: 'noise', maskTile: [2, 1], maskScroll: [0.1, -0.4], flow: 'noise', flowK: 0.06,
      scale: 1.1, offset: [0, 0.04, 0], edgeV: [0.1, 0.5], spin: 1.2, core: 0.3, kmul: 1.3 }),
    // SECONDARY: a hoop on the ground closing in over and over (the hoover's draw, the coffin's blue), inked under
    inked(own(P3.A.r, HOLD, { hold: true, form: 'hoop', main: 'noise', tile: [8, 1], scroll: [0.3, 0], scale: [[0, 1.4], [1, 0.2]], offset: [0, 0.05, 0], loop: 0.7,
      erode: [[0, 0.5], [0.3, 0.08], [0.8, 0.1], [1, 1]], k: [[0, 0], [0.15, 1], [1, 1]] }), 0.35),
    // TERTIARY: drops of it lifted off the ground toward the mouth
    sprites(HOLD, { rate: 10, dur: Infinity, shape: 'drip', spawn: 'disc', r: 0.9, offset: [0, 0.05, 0], dir: 'up', speed: [0.6, 1.4], size: [0.05, 0.08], sizeEnd: 0.02, life: [0.4, 0.6],
      drag: 1, color: 'feeling' }),
  ),

  // ---- X Turn of Weather: spin the wheel of odds to turn the weather where you stand for a game hour ------------------------------
  // (at the Courier) the wheel of odds spun overhead, the vane turning against it
  'pair.10.use': fx(
    // PRIMARY: the wheel of odds stood facing the view over the head (the coffin's blue), turning fast; its heart
    own(P10.A.r, K, { form: 'ring', face: 'camera', main: 'rays', tile: [12, 1], scroll: [0.6, 0], mask: 'noise', maskTile: [3, 1], scale: [[0, 0.4], [0.2, 1.1], [1, 1.15]], offset: [0, 2.6, 0],
      edgeV: [0.25, 0.15], spin: 9, dur: 1, core: 0.5, erode: [[0, 0.3], [0.15, 0.05], [0.7, 0.1], [1, 1]] }),
    core(K, { s: 1, y: 2.6 }),
    // PRIMARY (its end): the pip landing at the wheel's top
    { type: 'sprites', count: 1, powerCount: false, shape: 'star4', offset: [0, 3.75, 0], size: 0.7, sizeEnd: 0.1, life: 0.4, delay: 0.6, color: 'white', colorEnd: P10.B.c },
    // SECONDARY: the vane's ring laid flat over the head, turning against it; the chain's links swung round
    own(P10.B.r, K, { form: 'ring', main: 'rays', tile: [8, 1], scroll: [0.3, 0], scale: [[0, 0.6], [0.25, 1.4], [1, 1.5]], offset: [0, 2.3, 0], edgeV: [0.6, 0.1], spin: -3, dur: 1,
      erode: growsIn(0.2, 0.6) }),
    sprites(K, { count: [6, 8], shape: 'ringthin', spawn: 'ring', r: 1, offset: [0, 2.4, 0], dir: 'swirl', lift: 0.1, speed: [2, 3], size: [0.1, 0.14], life: [0.6, 0.9], drag: 0.5,
      color: 'white', colorEnd: P10.A.c, spin: [-4, 4] }),
    // TERTIARY: motes of the vane falling from it
    starFall(K, { color: 'white', colorEnd: P10.B.c, offset: [0, 2.2, 0], height: 1 }),
    lamp(K, { color: P10.A.c, k: 18, up: 2.4 }),
  ),
  // (where you stand; the caller's feeling the weather turned to) the weather falling in its feeling
  'pair.10.hit': fx(
    // PRIMARY: the sky's column falling onto you in the weather's feeling, its ring on the ground, its heart
    skyColumn('feeling', K, { r: 0.9, h: 9, dur: 0.9 }), groundRing('feeling', K, { r: 3, at: 0.05 }), core(K, { s: 1.4, y: 1.2, at: 0.05 }),
    // SECONDARY: the vane's armillary turning round you, the feeling's motes falling out of the sky
    armillary(P10.B.r, K, { r: 1.3, y: 1.4 }), starFall(K, { color: 'white', colorEnd: 'feeling', r: 2, height: 4, offset: [0, 1.5, 0] }),
    // TERTIARY: mist settling
    mist(K, { r: 1.5, count: [3, 4], alpha: 0.12 }),
    lamp(K, { color: 'feeling', k: 24 }), weight(K, { flash: 0.1, shake: 0.12, color: 'feeling' }),
  ),

  // ---- XX Last Call: the toll opens the coffin: all it drank bursts out as a wave ----------------------------------------------------
  // (at the Courier; ctx.power its fill) the coffin opened by the toll, the wave
  'pair.20.use': fx(
    // PRIMARY: the wave: a shockwave ring run out on the ground (the coffin's blue), its front stood up as a wall near the body only (a
    // wall run past 3 m goes through the third-person camera), its heart white
    shock(P20.A.r, K, { r: 9, dur: 0.8 }), shockFront(P20.A.r, K, { r: 2.8, h: 1.2, dur: 0.45 }), core(K, { s: 1.6, y: 1.2 }),
    // PRIMARY: the toll that opened it: the bell's ring stood facing the view
    tollRing(P20.B.r, K, { r: 2, y: 1.3, dur: 0.55 }),
    // SECONDARY: the coffin's burst at the chest (a dome of its Lachryma, inside 1.3 m), the bell's hoop behind the wave, shards of all it drank
    bloomDome('film', K, { r: 1.1, h: 1.2, dur: 0.55 }), tollGround(P20.B.r, K, { r: 6, at: 0.06 }),
    sprites(K, { count: [16, 22], shape: 'shard', spawn: 'sphere', r: 0.4, offset: [0, 1.2, 0], dir: 'out', lift: 0.3, speed: [5, 9], size: [0.08, 0.14], life: [0.4, 0.7], drag: 2,
      color: 'white', colorEnd: 'film', spin: [-6, 6] }),
    // TERTIARY: a dust curtain lifted where the wave passed; smoke rings off the bell
    dustCurtain(K, { r: 3.5, count: [6, 8], alpha: 0.22 }), tollSmoke(K, P20.B.c, { count: [3, 4] }),
    lamp(K, { color: P20.A.c, k: 40, range: 14 }), weight(K, { flash: 0.14, shake: 0.4, stop: 0.07, color: P20.A.c }),
  ),
  // (on each creature the wave strikes) its blow
  'pair.20.hit': fx(
    // PRIMARY: a burst of the coffin's blue on it, the bell's ring round it, its heart
    own(P20.A.r, K, { form: 'sphere', main: 'cells', tile: [4, 2], scroll: [0.05, 0.6], scale: [[0, 0.3], [0.4, 0.75], [1, 0.85]], offset: [0, 1, 0], rim: 0.7, dur: 0.35,
      erode: [[0, 0.3], [0.3, 0.06], [1, 1]] }),
    tollRing(P20.B.r, K, { r: 1, y: 1, dur: 0.35 }), core(K, { s: 0.8, y: 1 }),
    // SECONDARY: shards of its Lachryma thrown on with the wave
    sprites(K, { count: [6, 8], shape: 'shard', spawn: 'sphere', r: 0.2, offset: [0, 1, 0], dir: 'cone', axis: 'dir', cone: 40, speed: [3, 5], size: [0.07, 0.12], life: [0.3, 0.5], drag: 2,
      color: 'white', colorEnd: 'film', spin: [-6, 6] }),
    // TERTIARY: chips knocked off
    chips(K, { count: [4, 6] }),
    weight(K, { stop: 0.03 }),
  ),
};
