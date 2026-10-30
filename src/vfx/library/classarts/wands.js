// ---------------------------------------------------------------------------------------
// THE COURTS OF WANDS' ARTS' LOOKS (will: a Page studies, a Knight charges, a Queen keeps, a King commands): each art its domain's
// grammar (docs/plans/art/VFX-LIBRARY.md 2) in the suit's ember (ramp 'wands'), weighed by its rank (section 4), built from the class
// arts' kit (kit.js) and played by vfx/classartlooks.js on Petra's events (courier/classarts/body.js):
//   Spark (Page, Manifestation)        an ember flicked along the line, landing in a small bloom that burns away a blot
//   Onrush (Knight, Psychokinesis)     a wave along the dash's line, chips thrown off its sides
//   Stoke (Queen, Alteration, held)    a heartbeat of embers at the chest, rising sparks, soft
//   Roar (King, Psychokinesis)         a shockwave ring 8 m, its front stood up, a dust curtain, windups snapped
// and each reaction its action quietened on `art.react` (reactions.js): First Strike, Momentum (armed and fired), Afterglow, Rally.
//
// Prior art: the kit's (Riot's tiers and ladder, FFT's reaction flash, Chrono Cross's colours); Dark Souls' "next attack" glow on the armed
// Momentum; the shockwave of every fighting game's super (the ring, its front, the dust: Street Fighter III's parry flash read wide).
//
//   WANDS_ART_EFFECTS   art.spark.use  art.eager.fire  art.charge.use  art.momentum.armed  art.momentum.fire  art.kindleHeart.use
//                       art.kindleHeart.hold  art.warmth.fire  art.command.use  art.rally.fire
// ---------------------------------------------------------------------------------------
import {
  RANK, own, weight, core, groundRing, rimRing, lamp, crystal, bloomDome, embers, smoke, dust, waveWall, shock, shockFront, chips, dustCurtain, lineMotes,
  motesIn, sweepUp, crescents, shimmer, sprites,
} from './kit.js';

const W = 'wands', { page: PAGE, knight: KNIGHT, queen: QUEEN, king: KING, whisper: HUSH } = RANK;

export const WANDS_ART_EFFECTS = {
  // Spark (the Page of Wands; Manifestation): an ember flicked from the hand along the line, landing in a small bloom that burns away a blot (played where it lands)
  'art.spark.use': { layers: [
    // PRIMARY: the bloom where it lands: a little dome of ember cells grown up out of the ground, lit at its rim
    bloomDome(W, PAGE, { r: 0.55, h: 0.9, dur: 0.6, at: 0.1 }),
    // PRIMARY (its heart): white for 0.1 s as it lands
    core(PAGE, { s: 0.8, y: 0.3, at: 0.1 }),
    // SECONDARY: the ember's flight: sparks running the line from the hand to where it lands
    lineMotes(PAGE, { count: [16, 20], speed: [1, 2.5] }),
    // SECONDARY: a few ember spikes set round the bloom, grown in
    crystal(W, PAGE, { r: 0.5, h: 0.45, dur: 0.55, at: 0.12 }),
    // TERTIARY: the blot burnt away: a dark disc on the ground eaten through its noise (alpha-over ink)
    own('ink', PAGE, { form: 'disc', add: 0, main: 'noise', tile: [3, 1], scroll: [0.02, 0.15], scale: [[0, 0.9], [1, 0.7]], offset: [0, 0.02, 0], core: 0, kmul: 0.7, dur: 1, at: 0.08,
      erode: [[0, 0.05], [0.2, 0.1], [1, 1]], rampShift: 0, turn: 'random' }),
    // TERTIARY: embers and a curl of smoke where it burnt
    embers(PAGE, { at: 0.14 }), smoke(PAGE, { at: 0.2 }),
  ] },
  // First Strike (the Page of Wands' reaction): Spark quietened: an ember's bloom at the hand on the fight's first blow
  'art.eager.fire': { extends: 'art.react', layers: [
    // PRIMARY: a spark of a bloom at the hand, grown and gone
    bloomDome(W, HUSH, { r: 0.28, h: 1, y: 1, dur: 0.4, kmul: 1.8 }),
    // SECONDARY: embers flicked off it
    embers(HUSH, { y: 1.05, count: [8, 10], speed: [1.5, 3] }),
  ] },

  // Onrush (the Knight of Wands; Psychokinesis): a wave thrown along the dash's line, 8 m, chips thrown off its sides
  'art.charge.use': { layers: [
    // PRIMARY: a wave wall thrown along the dash, narrow so it reads as a line, its front hot
    waveWall(W, KNIGHT, { r: 8, h: 1.6, w: 0.32, dur: 0.5 }),
    // PRIMARY (its heart): white at the start for 0.1 s
    core(KNIGHT, { s: 1, y: 0.9 }),
    // SECONDARY: a crescent of streaks swept forward under it on the ground
    own(W, KNIGHT, { form: 'crescent', face: 'heading', main: 'streaks', tile: [3, 1], scroll: [0, 1.4], mask: 'noise', maskTile: [2, 1], maskScroll: [0.2, 0], dur: 0.45,
      scale: [[0, 1], [1, 4.5]], stretch: [0.45, 1, 1], offset: [0, 0.04, 0], erode: [[0, 0], [0.3, 0.06], [1, 1]] }),
    // SECONDARY: the dash's line burning: ember streaks along it; chips thrown off its sides
    lineMotes(KNIGHT, { count: [18, 24], life: [0.25, 0.45] }),
    chips(KNIGHT, { dir: 'cone', axis: 'up', cone: 70, speed: [3, 6] }),
    // TERTIARY: dust left where it set off, and a few embers
    dust(KNIGHT, { r: 0.7 }), embers(KNIGHT, { count: [8, 10], at: 0.1 }),
  ] },
  // Momentum (the Knight of Wands' reaction), armed: an ember band turning at the hips while the next blow waits (Onrush in a whisper)
  'art.momentum.armed': { layers: [
    // PRIMARY: a band of ember streaks at the hips, turning, its edges soft
    own(W, HUSH, { hold: true, form: 'band', main: 'noise', tile: [4, 1], scroll: [0.6, 0.2], mask: 'streaks', maskK: 0.5, maskTile: [8, 1], maskScroll: [-0.4, 0], flow: 'noise', flowK: 0.04,
      scale: 0.48, stretch: [1, 0.6, 1], offset: [0, 0.72, 0], edgeV: [0.3, 0.3], rim: -0.2, spin: 3, erode: 0.05, rampShift: 0.12, g: 1.8, kmul: 2 }),
    // SECONDARY: embers shed off it as the body runs
    embers(HUSH, { rate: 10, dur: Infinity, spawn: 'ring', r: 0.45, y: 0.75, speed: [0.3, 0.8], life: [0.4, 0.7] }),
    // TERTIARY: a faint ember glow on the ground under it
    own(W, HUSH, { hold: true, form: 'disc', main: 'noise', tile: [3, 1], scroll: [0.05, 0.2], scale: 0.7, offset: [0, 0.03, 0], core: 0, edgeV: [0, 0.5], erode: 0.15, rampShift: -0.15, g: 0.6 }),
  ] },
  // Momentum's blow: the band let go as a small Onrush wave thrown forward off the blow
  'art.momentum.fire': { extends: 'art.react', layers: [
    // PRIMARY: a short wave wall thrown forward 2.5 m, low
    waveWall(W, HUSH, { r: 2.5, h: 1, w: 0.6, dur: 0.4, kmul: 1.6 }),
    // SECONDARY: embers burst forward off it
    embers(HUSH, { y: 0.9, dir: 'cone', axis: 'dir', cone: 40, speed: [3, 6], count: [12, 14], gravity: 4 }),
  ] },

  // Stoke (the Queen of Wands; Alteration, held 6 s): a heartbeat of embers at the chest, rising sparks; soft enough to stand beside play
  'art.kindleHeart.use': { layers: [
    // PRIMARY: a band swept up the body, the ember running cool across it
    sweepUp(W, QUEEN, { r: 0.55, h: 2, dur: 0.8 }),
    // PRIMARY (its heart): the first beat at the chest, warm, not white: lub, dub
    own(W, QUEEN, { form: 'sphere', main: 'cells', tile: [3, 2], scroll: [0, 0.4], scale: [[0, 0.1], [0.15, 0.32], [0.3, 0.2], [0.45, 0.3], [1, 0.24]], offset: [0, 1.2, 0], rim: -0.6, dur: 0.7, g: 1.4 }),
    // SECONDARY: crescents turning round the chest
    crescents(W, QUEEN, { r: 0.7, y: 1, dur: 0.8 }),
    // TERTIARY: sparks rising off it
    embers(QUEEN, { y: 1.1, count: [10, 14] }),
  ] },
  // Stoke held: the heart beating at the chest, a shimmer round the body, sparks rising
  'art.kindleHeart.hold': { layers: [
    // PRIMARY: the heart at the chest, beating lub-dub every 0.9 s
    own(W, QUEEN, { hold: true, loop: 0.9, form: 'sphere', main: 'cells', tile: [3, 2], scroll: [0, 0.5], flow: 'noise', flowK: 0.04, offset: [0, 1.2, 0], rim: -0.6, g: 1.5,
      scale: [[0, 0.2], [0.1, 0.3], [0.2, 0.22], [0.32, 0.28], [0.5, 0.2], [1, 0.2]], k: [[0, 0.6], [0.1, 1], [0.25, 0.7], [0.32, 0.95], [0.55, 0.6], [1, 0.6]], erode: 0.12 }),
    // SECONDARY: a faint shimmer turning round the body
    shimmer(W, QUEEN, { hold: true, r: 0.6, h: 1.9 }),
    // TERTIARY: sparks rising off the chest
    embers(QUEEN, { rate: 8, dur: Infinity, y: 1.15, r: 0.25, speed: [0.6, 1.6] }),
  ] },
  // Afterglow (the Queen of Wands' reaction): Stoke quietened: one heartbeat at the chest and a few sparks
  'art.warmth.fire': { extends: 'art.react', layers: [
    // PRIMARY: one beat of the heart at the chest
    own(W, HUSH, { form: 'sphere', main: 'cells', tile: [3, 2], scroll: [0, 0.4], scale: [[0, 0.1], [0.2, 0.26], [0.4, 0.18], [0.55, 0.24], [1, 0.2]], offset: [0, 1.2, 0], rim: -0.6, dur: 0.6, kmul: 1.6 }),
    // TERTIARY: sparks rising off it
    embers(HUSH, { y: 1.15, count: [8, 10] }),
  ] },

  // Roar (the King of Wands; Psychokinesis): a shockwave ring out to 8 m, its front stood up, a dust curtain, every windup in it snapped
  'art.command.use': { layers: [
    // PRIMARY: the roar's shock thrown out along the ground to 8 m, its front hot, its back dragging
    shock(W, KING, { r: 8, dur: 0.7 }),
    // PRIMARY: the shock's front stood up as a low wall for its first metres, warped (gone before it reaches the camera)
    shockFront(W, KING, { r: 4.5, h: 0.7, dur: 0.45, kmul: 0.7 }),
    // PRIMARY (its heart): white at the chest for 0.1 s
    core(KING, { s: 1.5, y: 1.3 }),
    // SECONDARY: a second ring trailing the first, thinner; chips torn up and thrown
    groundRing(W, KING, { r: 5.5, dur: 0.6, at: 0.08, g: 0.8 }),
    chips(KING, { r: 1.2, speed: [4, 9] }),
    // SECONDARY: the windups snapped: glints breaking off all round the ring as it passes
    sprites(KING, { at: 0.12, count: [10, 14], shape: 'star4', spawn: 'ring', r: 5, offset: [0, 1, 0], dir: 'out', lift: 1, speed: [1, 2.5], size: [0.16, 0.26], sizeEnd: 0, life: [0.25, 0.4],
      drag: 2, color: 'white', colorEnd: 'suit' }),
    // TERTIARY: a dust curtain where the front passed, a pale rim left lying at its reach, embers drifting
    dustCurtain(KING, { r: 2.6, sizeEnd: 1.3 }), rimRing(W, KING, { r: 8, dur: 1.6 }), embers(KING, { r: 2.5, spawn: 'disc', count: [12, 16], at: 0.2 }),
    // the screen's weight: a lamp, a wash of ember, a shake, the world held a beat
    lamp(KING, { k: 30, range: 12 }), ...weight(KING, { flash: 0.12, shake: 0.3, stop: 0.05 }),
  ] },
  // Rally (the King of Wands' reaction): Roar quietened and run backwards: a ring drawn in to the Courier, motes from the downed into them
  'art.rally.fire': { extends: 'art.react', layers: [
    // PRIMARY: a shock ring drawn in from 3 m to the feet, its inner edge the front
    own(W, HUSH, { form: 'ring', main: 'streaks', tile: [12, 1], scroll: [0, -2], scale: [[0, 3], [1, 0.4]], offset: [0, 0.05, 0], edgeV: [0.06, 0.8], dur: 0.45, kmul: 1.6,
      erode: [[0, 0.2], [0.2, 0.05], [1, 1]], turn: 'random' }),
    // SECONDARY: motes drawn in to the body from round about
    motesIn(HUSH, { r: 3, count: [14, 18] }),
  ] },
};
