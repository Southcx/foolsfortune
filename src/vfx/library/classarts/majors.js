// ---------------------------------------------------------------------------------------
// THE ZODIAC MAJORS' ARTS' LOOKS (CLASSES.md 2: a Major read from two suits, its element and its modality): each art its domain's grammar
// (docs/plans/art/VFX-LIBRARY.md 2) in its Major's suit (progress/spreads.js MAJOR_SUIT: the shapes' ramp named, the sprites the caller's
// ctx.suit), at a game changer's weight (RANK.major: the brightest, more of everything, earned screen weight), built from the class arts'
// kit (kit.js) and played by vfx/classartlooks.js on Petra's events (courier/classarts/body.js):
//   fire (Wands)       Ram (the Emperor: a wave wall 10 m), Tame (Strength: tethers and a collar, held 15 s), Blink Mark (Temperance: a
//                      thrown eye where you will blink)
//   water (Cups)       Ride (the Chariot: reins of light, held 8 s), Reap (Death: a scythe's crescent, what it downs dims), Vanish (the
//                      Moon: the body eroding into mist, held 3 s)
//   air (Swords)       Payback (Justice: a balanced ring of script, held 4 s; `.fire` the beam back to the striker), Starlight (the Star:
//                      a column of night sky), Encore (the Lovers: a written ghost replaying)
//   earth (Pentacles)  Shackle (the Devil: chain links of script, held 5 s), Sanctum (the Hierophant: a circle 5 m drawn, a faint dome,
//                      held 8 s), Lamp (the Hermit: a lamp made, its light out to 8 m, held 20 s)
// and each reaction its action quietened on `art.react` (reactions.js). An art that acts on a creature (Tame, Ride, Shackle, Payback's
// return) is played at it, its tethers laid back toward the Courier (its dir points from the Courier to it). What Ride, Vanish, Starlight,
// Encore, Sanctum and Lamp leave running (the reins, the smoke Courier, the patch of sky, the echo, the ward, the lantern) is the lasting
// looks' (vfx/classartlasting.js, its effects lasting.js): the holds here carry only what those do not draw.
//
// Prior art: the kit's (Riot's tiers and ladder, FFT's reaction flash, Chrono Cross's colours); the Rider-Waite-Smith deck's images (Death's
// scythe, Strength's lion led by a garland, the Chariot's reins, Justice's scales, the Star's night, the Hermit's lantern); Shadow of the
// Colossus's grip and Pokemon's capture tethers (Tame, Ride); the PlayStation 2's frame feedback for Encore's echo (render/glow.js).
//
//   MAJOR_ART_EFFECTS   art.<id>.use / .hold / .fire for ram dominion tame courage arrowOfTime moderation ride reins reap rebirth mirageStep
//                       tides weigh due wish hope echo choice bind temptation sanctum teaching lantern solitude
// ---------------------------------------------------------------------------------------
import {
  RANK, own, weight, core, groundRing, rimRing, pool, lamp, skyColumn, skyDrop, armillary, starFall, mist, shardsIn, dust, grains, waveWall, chips, tether,
  spiralIn, shellClose, collar, haze, motesIn, lineMotes, crescents, flakes, shimmer, writtenRing, strokes, scriptBand, seal, inkMotes, sprites,
} from './kit.js';

const W = 'wands', C = 'cups', S = 'swords', P = 'pentacles', { major: M, whisper: HUSH } = RANK;
// (a ribbon arc stood up and swept round at the waist: the scythe's, Reap's; a wave thinned, so it faces a camera behind)
const scythe = (R, o) => own(C, R, { form: 'wave', main: 'noise', tile: [4, 1], scroll: [1.4, 0], mask: 'streaks', maskK: 0.4, maskTile: [6, 1], maskScroll: [2.2, 0],
  scale: [[0, 2.2], [1, 3.1]], stretch: [1, 0.14, 1], offset: [0, 0.75, 0], edgeV: [0.35, 0.35], spin: 8, rot: -1, core: 0.8, coreAt: 0.75, dur: 0.42, erode: [[0, 0.2], [0.12, 0.03], [0.5, 0.08], [1, 1]], ...o });
// (the thrown eye: a small portal stood facing the view, its rim of noise and its iris of stars)
const eye = (S0, R, o, r = 0.55) => [
  own(S0, R, { form: 'ring', face: 'camera', main: 'noise', tile: [6, 1], scroll: [0.3, 0.2], scale: [[0, 0.05 * r], [0.12, r], [0.85, 0.92 * r], [1, 0.1 * r]], offset: [0, 1.1, 0], edgeV: [0.4, 0.12],
    spin: 1.5, erode: [[0, 0.3], [0.1, 0.03], [0.85, 0.08], [1, 1]], ...o }),
  own(S0, R, { form: 'disc', face: 'camera', main: 'stars', tile: [3, 1], scroll: [0.05, -0.3], scale: [[0, 0.03 * r], [0.12, 0.62 * r], [0.85, 0.58 * r], [1, 0.05 * r]], offset: [0, 1.1, 0],
    edgeV: [0, 0.4], core: 0.3, kmul: 0.8, erode: [[0, 0.2], [0.12, 0.05], [0.85, 0.1], [1, 1]], ...o }),
];

export const MAJOR_ART_EFFECTS = {
  // Ram (the Emperor, Wands; Psychokinesis): a wave wall of force thrown 10 m ahead, cracks riding it
  'art.ram.use': { layers: [
    // PRIMARY: the wave wall thrown 10 m ahead, tall, its front hot, cracks riding it
    waveWall(W, M, { r: 10, h: 2.4, w: 0.85, dur: 0.75, mask: 'cracks', maskK: 0.5, maskTile: [3, 1], maskScroll: [0, 0.6] }),
    // PRIMARY (its heart): white at the body for 0.1 s
    core(M, { s: 1.5, y: 1.1 }),
    // SECONDARY: a crescent of streaks swept flat under it; chips torn up and thrown ahead
    own(W, M, { form: 'crescent', face: 'heading', main: 'streaks', tile: [3, 1], scroll: [0, 1.4], mask: 'cracks', maskK: 0.5, maskTile: [2, 1], dur: 0.6, scale: [[0, 1], [1, 7]],
      stretch: [0.7, 1, 1], offset: [0, 0.04, 0], erode: [[0, 0], [0.3, 0.06], [1, 1]] }),
    chips(M, { dir: 'cone', axis: 'dir', cone: 40, lift: 0, speed: [5, 10], count: [14, 18] }),
    // TERTIARY: dust thrown ahead, a pale rim at the feet
    dust(M, { dir: 'cone', axis: 'dir', cone: 35, speed: [2, 5], count: [12, 16], r: 1 }), rimRing(W, M, { r: 2.2 }),
    // the screen's weight
    lamp(M, { k: 30, range: 12 }), ...weight(M, { flash: 0.12, shake: 0.35, stop: 0.06 }),
  ] },
  // Unshaken (the Emperor's reaction): Ram quietened: a short wave wall pushed out a step ahead, a pale rim at the feet
  'art.dominion.fire': { extends: 'art.react', layers: [
    // PRIMARY: the wave wall a step ahead
    waveWall(W, HUSH, { r: 1.6, h: 1.4, w: 0.8, dur: 0.4, kmul: 1.6 }),
    // TERTIARY: a pale rim at the feet
    rimRing(W, HUSH, { r: 1, dur: 0.8, kmul: 1.5 }),
  ] },

  // Tame (Strength, Wands; Possession, held 15 s): tethers into the creature, a collar ring (played at it)
  'art.tame.use': { layers: [
    // PRIMARY: three tethers reaching in from the Courier's side to its chest
    ...[-0.22, 0, 0.22].map((d) => tether(W, M, { len: 3, r: 0.06, y: 1, rot: Math.PI + d, dur: 0.9 })),
    // PRIMARY: a spiral drawn inward round it, closing; its heart as it takes hold
    spiralIn(W, M, { r: 1.3, h: 2 }), core(M, { s: 1, y: 1, at: 0.15 }),
    // SECONDARY: a shell closing over it, the collar tightening at its neck, motes running the line from the Courier
    shellClose(W, M, { r: 0.9, at: 0.1 }), collar(W, M, { r: 0.5, y: 1.3, at: 0.2 }), lineMotes(M, {}),
    // TERTIARY: a haze breathing round its feet, motes drawn in
    haze(W, M, { r: 1.8 }), motesIn(M, {}),
    // the screen's weight
    lamp(M, { k: 22 }), ...weight(M, { shake: 0.12, stop: 0.05 }),
  ] },
  // Tame held: the collar on the tamed creature, turning; a faint shell; motes drawn in
  'art.tame.hold': { layers: [
    // PRIMARY: the collar ring at its neck
    collar(W, M, { hold: true, r: 0.5, y: 1.3, kmul: 0.8 }),
    // SECONDARY: a faint shell round it
    shellClose(W, M, { hold: true, r: 0.95, kmul: 0.25 }),
    // TERTIARY: motes drawn in to it
    motesIn(M, { rate: 5, dur: Infinity, r: 1.6, speed: [1, 1.8] }),
  ] },
  // Courage (Strength's reaction): Tame quietened: a spiral drawn in at the chest, a collar flashed
  'art.courage.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small spiral drawn in round the body
    spiralIn(W, HUSH, { r: 0.8, h: 1.8, dur: 0.5, kmul: 1.6 }),
    // SECONDARY: a collar flashed at the neck
    collar(W, HUSH, { r: 0.4, dur: 0.45, kmul: 1.6 }),
  ] },

  // Blink Mark (Temperance, Wands; Ouranurgy): a thrown eye, a small portal, where you will blink (played at the mark; held its 1.5 s window)
  'art.arrowOfTime.use': { layers: [
    // PRIMARY: the eye opened at the mark, stood facing the view
    eye(W, M, { dur: 1.5 }),
    // PRIMARY: a thin column of the sky dropped onto the spot, and its ring on the ground
    skyColumn(W, M, { r: 0.25, h: 6, dur: 0.6 }), groundRing(W, M, { r: 1.4, dur: 0.5, at: 0.05 }),
    // SECONDARY: the armillary turning round the eye; motes running the throw's line from the hand
    armillary(W, M, { r: 0.8, y: 1.1, dur: 1.5 }), lineMotes(M, { count: [12, 16] }),
    // TERTIARY: star motes falling slow, a breath of mist
    starFall(M, { r: 0.6, count: [10, 14] }), mist(M, { count: [3, 5] }),
    lamp(M, { k: 20, dur: 1.2 }),
  ] },
  // Spillover (Temperance's reaction): Blink Mark quietened: a small eye at the Lachrymato Bottle on the back as it tops up
  'art.moderation.fire': { extends: 'art.react', layers: [
    // PRIMARY: the eye, small, at the Bottle
    eye(W, HUSH, { dur: 0.6, offset: [0, 1.45, 0], kmul: 1.6 }, 0.3),
    // SECONDARY: a drop falling into it
    sprites(HUSH, { count: [3, 4], shape: 'drip', offset: [0, 2.1, 0], dir: 'up', speed: [-3, -2], size: [0.06, 0.08], life: 0.25, color: 'white', colorEnd: 'suit' }),
  ] },

  // Ride (the Chariot, Cups; Possession, held 8 s): reins of light to the creature (played at it)
  'art.ride.use': { layers: [
    // PRIMARY: the reins: two tethers from the Courier's side to its shoulders
    ...[-0.18, 0.18].map((d) => tether(C, M, { len: 3.2, r: 0.05, y: 1.2, rot: Math.PI + d, dur: 1 })),
    // PRIMARY: the collar set at its neck, and its heart as it takes the reins
    collar(C, M, { r: 0.55, y: 1.25 }), core(M, { s: 1, y: 1.1, at: 0.1 }),
    // SECONDARY: a shell closing over it, a spiral drawn in, motes running the line
    shellClose(C, M, { r: 1, at: 0.08 }), spiralIn(C, M, { r: 1.2, h: 1.8, at: 0.05 }), lineMotes(M, {}),
    // TERTIARY: a haze at its feet, motes drawn in
    haze(C, M, { r: 1.6 }), motesIn(M, { r: 1.8 }),
    lamp(M, { k: 22 }), ...weight(M, { shake: 0.15, stop: 0.05 }),
  ] },
  // Ride held: a haze breathing at its feet (its reins, bridle and calmed eyes are the lasting look's: classartlasting/reins.js)
  'art.ride.hold': { layers: [
    // TERTIARY: a haze breathing at its feet
    haze(C, M, { hold: true, r: 1.2, kmul: 0.5 }),
  ] },
  // Reins (the Chariot's reaction): Ride quietened: a collar ring flashed at the hips, motes drawn in
  'art.reins.fire': { extends: 'art.react', layers: [
    // PRIMARY: a collar ring at the hips, tightening
    collar(C, HUSH, { r: 0.55, y: 0.8, dur: 0.45, kmul: 1.6 }),
    // TERTIARY: motes drawn in
    motesIn(HUSH, { r: 1.4 }),
  ] },

  // Reap (Death, Cups; Alteration): a scythe's crescent swept 3 m round; what it downs dims
  'art.reap.use': { layers: [
    // PRIMARY: the scythe's arc swept round at the waist to 3 m, its edge hot
    scythe(M, {}),
    // PRIMARY (its heart): white for 0.1 s at the stroke
    core(M, { s: 1.2, y: 0.9 }),
    // SECONDARY: a second arc trailing it, lower and dimmer; flakes falling and dimming to ink
    scythe(M, { at: 0.05, scale: [[0, 1.8], [1, 2.6]], offset: [0, 0.4, 0], spin: 6.5, rot: -1.4, kmul: 0.55 }),
    flakes(M, { colorEnd: 'ink', spawn: 'disc', r: 2.5, offset: [0, 1, 0], count: [16, 20] }),
    // TERTIARY: an ink haze settling low (alpha-over): what it downs dims; a pale rim at its reach
    own('ink', M, { form: 'disc', add: 0, main: 'marble', tile: [2, 1], scroll: [0.03, 0.08], flow: 'noise', flowK: 0.06, scale: [[0, 1.5], [1, 3.4]], offset: [0, 0.03, 0], core: 0, kmul: 0.6,
      dur: 1.6, at: 0.1, erode: [[0, 0.15], [0.4, 0.2], [1, 1]], rampShift: 0, turn: 'random' }),
    rimRing(C, M, { r: 3 }),
    lamp(M, { k: 24 }), ...weight(M, { flash: 0.08, shake: 0.2, stop: 0.06 }),
  ] },
  // Rebirth (Death's reaction): a kintsugi burst: the shatter turned aside, gold cracks flung open round the body and drawn shut
  'art.rebirth.fire': { extends: 'art.react', layers: [
    // PRIMARY: a sphere of gold cracks flung open round the body
    own('gold', HUSH, { form: 'sphere', main: 'cracks', tile: [4, 2], scroll: [0.05, 0.2], scale: [[0, 0.5], [0.3, 1.2], [1, 1.35]], offset: [0, 1, 0], rim: 0.6, dur: 0.7, kmul: 2.2 }),
    // SECONDARY: gold shards thrown and drawn back; Reap's crescent in a whisper
    sprites(HUSH, { count: [14, 18], shape: 'shard', spawn: 'sphere', r: 0.4, offset: [0, 1, 0], dir: 'sphere', speed: [3, 5], size: [0.1, 0.16], life: [0.4, 0.6], drag: 5, color: 'white', colorEnd: 'gold', spin: [-6, 6] }),
    scythe(HUSH, { scale: [[0, 0.8], [1, 1.2]], dur: 0.35, kmul: 1.4 }),
  ] },

  // Vanish (the Moon, Cups; Alteration, held 3 s): the body eroding into mist, a decoy left (the decoy is the runtime's)
  'art.mirageStep.use': { layers: [
    // PRIMARY: the body eroding into mist: a band round it eaten away upward through its noise
    own(C, M, { form: 'band', main: 'noise', tile: [5, 2], scroll: [0, 0.8], mask: 'streaks', maskTile: [6, 1], maskScroll: [0, 1.4], flow: 'noise', flowK: 0.08, scale: 0.5, stretch: [1, 3.8, 1],
      edgeV: [0.05, 0.3], rim: 0.5, dur: 0.9, erode: [[0, 0], [0.15, 0.04], [1, 1]] }),
    // PRIMARY: mist poured off it
    mist(M, { count: [10, 14], spawn: 'column', r: 0.4, height: 1.6, offset: [0, 0.2, 0], speed: [0.3, 0.9], alpha: 0.35, at: 0 }),
    // SECONDARY: crescents turning round the body; flakes changing colour as they fall
    crescents(C, M, { r: 0.8, y: 0.9 }), flakes(M, { shape: 'hex' }),
    // TERTIARY: a shimmer left where it stood
    shimmer(C, M, { r: 0.55 }),
    lamp(M, { k: 16 }),
  ] },
  // Vanish held (unseen): a faint shimmer where the body is, a wisp of mist now and then
  'art.mirageStep.hold': { layers: [
    // PRIMARY: the shimmer round the body, faint
    shimmer(C, M, { hold: true, r: 0.5, h: 1.9, kmul: 0.45 }),
    // SECONDARY: wisps of mist off it
    mist(M, { rate: 3, dur: Infinity, spawn: 'column', r: 0.35, height: 1.6, offset: [0, 0.2, 0], alpha: 0.18 }),
    // TERTIARY: a few motes of the Moon's blue
    sprites(M, { rate: 3, dur: Infinity, shape: 'sparkle', spawn: 'column', r: 0.5, height: 1.8, dir: 'up', speed: [0.1, 0.3], size: [0.04, 0.07], sizeEnd: 0, life: [0.8, 1.2], color: 'suit', alpha: 0.5 }),
  ] },
  // Tides (the Moon's reaction): Vanish quietened: a shimmer flashed round the body, a wisp of mist
  'art.tides.fire': { extends: 'art.react', layers: [
    // PRIMARY: a band eaten away upward, faint
    own(C, HUSH, { form: 'band', main: 'noise', tile: [4, 2], scroll: [0, 0.8], flow: 'noise', flowK: 0.08, scale: 0.45, stretch: [1, 4, 1], edgeV: [0.05, 0.3], rim: 0.5, dur: 0.6, kmul: 1.5 }),
    // TERTIARY: a wisp of mist
    mist(HUSH, { count: [3, 4], r: 0.3, offset: [0, 1, 0] }),
  ] },

  // Payback (Justice, Swords; Spellscription, held 4 s): a balanced ring of script at the feet and over the head, the blow's return waiting
  'art.weigh.use': { layers: [
    // PRIMARY: the balance: two rings of the running hand, laid at the feet and stood over the head, counter-turning, written in
    writtenRing(S, M, { r: 1.1, y: 0.05 }), writtenRing(S, M, { r: 0.6, y: 2.3, face: 'camera', spin: -0.3 }),
    // PRIMARY: strokes written across the front; its heart
    strokes(S, M, { r: 1.1, y: 1.2 }), core(M, { s: 1, y: 1.2 }),
    // SECONDARY: a band of script circling the chest, a seal stamped at the feet
    scriptBand(S, M, { r: 0.8, y: 1.05 }), seal(S, M, { r: 0.9, at: 0.05 }),
    // TERTIARY: ink motes, a faint written ring left
    inkMotes(M, {}), writtenRing(S, M, { r: 1.6, dur: 1.8, at: 0.25, kmul: 0.35, g: 0.6 }),
    lamp(M, { k: 20 }), ...weight(M, { shake: 0.12, stop: 0.04 }),
  ] },
  // Payback held: the two rings of the balance turning, faint, a thin band at the chest
  'art.weigh.hold': { layers: [
    // PRIMARY: the balance's two rings
    writtenRing(S, M, { hold: true, r: 1.1, y: 0.05, kmul: 0.6 }), writtenRing(S, M, { hold: true, r: 0.6, y: 2.3, face: 'camera', spin: -0.3, kmul: 0.6 }),
    // SECONDARY: a thin band of script at the chest
    scriptBand(S, M, { hold: true, r: 0.75, h: 0.18, kmul: 0.4 }),
    // TERTIARY: ink motes drifting between them
    inkMotes(M, { rate: 4, dur: Infinity }),
  ] },
  // Payback's return (played at the striker): the beam of script back into it, a seal stamped on it
  'art.weigh.fire': { layers: [
    // PRIMARY: the beam back to the striker: a tether of the running hand from the Courier's side into it
    tether(S, M, { len: 4, r: 0.1, y: 1.1, main: 'script', tile: [2, 2], scroll: [0, -3], dur: 0.6 }),
    // PRIMARY (its heart): white as it strikes, 0.1 s
    core(M, { s: 1.1, y: 1.1 }),
    // SECONDARY: a seal stamped on it, motes running the line
    seal(S, M, { r: 0.8 }), lineMotes(M, {}),
    // TERTIARY: ink motes
    inkMotes(M, { r: 0.6 }),
    ...weight(M, { shake: 0.2, stop: 0.05 }),
  ] },
  // Grudge (Justice's reaction): Payback quietened: a small written ring at the chest, a seal
  'art.due.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small ring of script at the chest
    writtenRing(S, HUSH, { r: 0.55, y: 1.1, dur: 0.6, kmul: 1.8 }),
    // SECONDARY: a small seal at the feet
    seal(S, HUSH, { r: 0.45, kmul: 1.5 }),
  ] },

  // Starlight (the Star, Swords; Ouranurgy): a column of the night sky poured down where you stand, star motes falling
  'art.wish.use': { layers: [
    // PRIMARY: the column of night: dark (alpha-over ink), and the stars poured down inside it; both soft to nothing at their sides (a
    // wide rim: a hard-sided column of ink reads as a box)
    own('ink', M, { form: 'band', add: 0, main: 'noise', tile: [3, 2], scroll: [0, -0.4], scale: 2.2, stretch: [1, 5.5, 1], edgeV: [0.05, 0.5], rim: -1, rimPow: 1.3, core: 0, dur: 2.6, kmul: 0.55,
      erode: [[0, 0.5], [0.15, 0.1], [0.7, 0.15], [1, 1]], rampShift: 0 }),
    own(S, M, { form: 'band', main: 'stars', tile: [6, 4], scroll: [0, -0.6], mask: 'noise', maskTile: [2, 2], maskScroll: [0.03, -0.2], scale: 2.1, stretch: [1, 5.7, 1], edgeV: [0.05, 0.5],
      rim: -0.85, rimPow: 1.5, dur: 2.6, kmul: 0.6, erode: [[0, 0.4], [0.12, 0.05], [0.7, 0.1], [1, 1]] }),
    // PRIMARY (its heart): a streak of the sky dropped on the spot, white as it lands
    skyDrop(M, {}), core(M, { s: 1.4, y: 0.6, at: 0.2 }), groundRing(S, M, { r: 3, dur: 0.7, at: 0.2 }),
    // SECONDARY: the armillary turning in the column
    armillary(S, M, { r: 1.8, y: 1.4, dur: 2.2, kmul: 0.6 }),
    // TERTIARY: star motes falling slow through it, a cool mist
    starFall(M, { r: 2, height: 5, offset: [0, 1, 0], count: [24, 30] }), mist(M, { r: 1.6 }),
    lamp(M, { k: 30, range: 12, dur: 1.6 }), ...weight(M, { flash: 0.1 }),
  ] },
  // Hope (the Star's reaction): made whole with a pool's glow: Starlight quietened, a soft column and a pool of light at the feet
  'art.hope.fire': { extends: 'art.react', layers: [
    // PRIMARY: a soft column of the sky, briefly
    skyColumn(S, HUSH, { r: 0.6, h: 4, dur: 0.8, main: 'stars', tile: [4, 3], kmul: 1.6 }),
    // SECONDARY: a pool of light spreading at the feet
    pool(S, HUSH, { r: 1.4, dur: 1, kmul: 1.8 }),
    // TERTIARY: star motes falling
    starFall(HUSH, { r: 0.6, count: [8, 10] }),
  ] },

  // Encore (the Lovers, Swords; Spellscription): a written ghost of you replaying the last move where you stood
  'art.echo.use': { layers: [
    // PRIMARY: the written ghost: a body-sized shell of the running hand, lit at its rim, replaying, then eroding
    own(S, M, { form: 'band', main: 'noise', mainK: 0.6, tile: [2, 2], scroll: [0, 0.4], mask: 'script', maskK: 0.6, maskTile: [3, 1.2], maskScroll: [0.05, 0.3], scale: 0.42, stretch: [1, 4.3, 1],
      edgeV: [0.05, 0.15], rim: 0.9, rimPow: 2, dur: 1.3, g: 1.4, erode: [[0, 0.6], [0.2, 0.04], [0.7, 0.1], [1, 1]] }),
    // PRIMARY: strokes written in the air as the move replays
    strokes(S, M, { r: 1.3, y: 1.1, at: 0.3 }), strokes(S, M, { r: 1, y: 1.5, rot: Math.PI, spin: -2.6, at: 0.4 }),
    // SECONDARY: a circle written on the ground, a seal stamped
    writtenRing(S, M, { r: 1.2 }), seal(S, M, { r: 0.7, at: 0.3 }),
    // TERTIARY: ink motes; the frame's echo (the PlayStation 2's frame feedback), soft
    inkMotes(M, {}), { type: 'smear', at: 0.3, amt: 0.35, dur: 0.5 },
    lamp(M, { k: 18, at: 0.3 }),
  ] },
  // Choice (the Lovers' reaction): Encore quietened: a small written ghost ring at the hand
  'art.choice.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small band of the running hand round the hand
    scriptBand(S, HUSH, { r: 0.3, h: 0.3, y: 1.05, dur: 0.6, kmul: 1.8 }),
    // SECONDARY: a stroke written past it
    strokes(S, HUSH, { r: 0.6, y: 1.1, dur: 0.4, kmul: 1.6 }),
  ] },

  // Shackle (the Devil, Pentacles; Spellscription, held 5 s): chain links of script round the creature (played at it)
  'art.bind.use': { layers: [
    // PRIMARY: three links of the running hand, hoops at its knee, waist and chest, tightening, written in, turning against each other
    ...[0.3, 0.85, 1.4].map((y, i) => scriptBand(P, M, { r: 0.7, h: 0.16, y, dur: 1, scale: [[0, 1.6], [0.3, 0.75], [1, 0.7]], stretch: [1, [[0, 0.1], [0.3, 0.21], [1, 0.23]], 1],
      spin: i % 2 ? -0.8 : 0.8, at: i * 0.05 })),
    // PRIMARY: a stroke written across it; its heart as it binds
    strokes(P, M, { r: 1, y: 1 }), core(M, { s: 1.1, y: 1, at: 0.1 }),
    // SECONDARY: a seal stamped on the ground under it
    seal(P, M, { r: 1.1, at: 0.08 }),
    // TERTIARY: ink motes, a faint written ring left on the ground
    inkMotes(M, {}), writtenRing(P, M, { r: 1.5, dur: 1.8, at: 0.25, kmul: 0.35, g: 0.6 }),
    lamp(M, { k: 22 }), ...weight(M, { shake: 0.18, stop: 0.06 }),
  ] },
  // Shackle held: the three links tight round it, turning, faint; a written ring at its feet
  'art.bind.hold': { layers: [
    // PRIMARY: the chain's links, hoops tight round it
    ...[0.3, 0.85, 1.4].map((y, i) => scriptBand(P, M, { hold: true, r: 0.68, h: 0.14, y, spin: i % 2 ? -0.5 : 0.5, kmul: 0.6 })),
    // SECONDARY: a written ring at its feet
    writtenRing(P, M, { hold: true, r: 1.1, kmul: 0.35 }),
    // TERTIARY: ink motes falling off the links
    inkMotes(M, { rate: 4, dur: Infinity, r: 0.6 }),
  ] },
  // Excess (the Devil's reaction): Shackle quietened: a ring of script tightening at the waist
  'art.temptation.fire': { extends: 'art.react', layers: [
    // PRIMARY: one link, a hoop tightening at the waist
    scriptBand(P, HUSH, { r: 0.6, h: 0.14, y: 0.85, dur: 0.6, scale: [[0, 1.2], [0.4, 0.62], [1, 0.6]], stretch: [1, [[0, 0.12], [0.4, 0.23], [1, 0.23]], 1], kmul: 1.8 }),
    // TERTIARY: ink motes off it
    inkMotes(HUSH, { r: 0.5, count: [6, 8] }),
  ] },

  // Sanctum (the Hierophant, Pentacles; Spellscription, held 8 s): a circle 5 m across drawn on the ground, a faint dome over it
  'art.sanctum.use': { layers: [
    // PRIMARY: the circle drawn on the ground, 5 m across, written in; an inner ring written the other way
    writtenRing(P, M, { r: 2.5, dur: 1.4, g: 1.2 }), writtenRing(P, M, { r: 1.8, dur: 1.4, spin: -0.35, at: 0.1 }),
    // SECONDARY: the faint dome rising over it, lit only at its rim; a band of script circling at chest height
    own(P, M, { form: 'dome', main: 'script', mainK: 0.4, tile: [8, 2], scroll: [0.03, 0.1], scale: [[0, 1], [0.4, 2.5], [1, 2.55]], rim: 0.9, rimPow: 3, core: 0, dur: 1.4, kmul: 0.5,
      erode: [[0, 0.2], [0.4, 0.12], [1, 1]] }),
    scriptBand(P, M, { r: 1.1, y: 1.1 }),
    // TERTIARY: a seal set at its middle, ink motes
    seal(P, M, { r: 0.8, at: 0.3 }), inkMotes(M, { r: 2 }),
    lamp(M, { k: 20 }), ...weight(M, { flash: 0.06, stop: 0.04 }),
  ] },
  // Sanctum held: the faint dome over the circle, motes drifting up inside it (the circle itself, the ward, is the lasting look's:
  // classartlasting/sanctum.js)
  'art.sanctum.hold': { layers: [
    // SECONDARY: the faint dome, lit at its rim
    own(P, M, { hold: true, form: 'dome', main: 'script', mainK: 0.4, tile: [8, 2], scroll: [0.02, 0.06], scale: 2.5, rim: 0.9, rimPow: 3, core: 0, kmul: 0.22, erode: 0.12 }),
    // TERTIARY: motes drifting up inside it
    sprites(M, { rate: 5, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 2.3, offset: [0, 0.2, 0], dir: 'up', speed: [0.2, 0.5], size: [0.04, 0.07], sizeEnd: 0, life: [1.2, 1.8], color: 'suit', alpha: 0.6 }),
  ] },
  // Teaching (the Hierophant's reaction): Sanctum quietened: a small circle written at the feet
  'art.teaching.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small circle of script written at the feet
    writtenRing(P, HUSH, { r: 0.8, dur: 0.7, kmul: 1.8 }),
    // TERTIARY: ink motes
    inkMotes(HUSH, { r: 0.5, count: [6, 8] }),
  ] },

  // Lamp (the Hermit, Pentacles; Manifestation, held 20 s): a lamp made over the shoulder, its soft light out to 8 m
  'art.lantern.use': { layers: [
    // PRIMARY: the lamp made over the shoulder: a sphere of cells crystallising in, white at its heart
    own(P, M, { form: 'sphere', main: 'cells', tile: [3, 2], scroll: [0, 0.3], scale: [[0, 0.05], [0.3, 0.24], [1, 0.22]], offset: [0, 2.1, 0], rim: -0.5, core: 0.9, coreAt: 0.6, dur: 1,
      erode: [[0, 0.8], [0.3, 0.03], [1, 0.4]] }),
    core(M, { s: 0.8, y: 2.1, at: 0.25 }),
    // SECONDARY: shards drawn in to it; its light running out along the ground to 8 m
    shardsIn(M, { r: 1.4, offset: [0, 2.1, 0] }), groundRing(P, M, { r: 8, dur: 1, main: 'noise', tile: [8, 1], at: 0.25, g: 0.7 }),
    // TERTIARY: glowing grains falling off the lamp
    grains(M, { r: 0.3, offset: [0, 2, 0] }),
    lamp(M, { k: 22, dur: 1.2, up: 2.1 }), ...weight(M, { flash: 0.06 }),
  ] },
  // Lamp held: its reach a faint ring on the ground at 8 m (the lantern, its moths and its throw are the lasting look's:
  // classartlasting/lantern.js, art.lantern.glow, art.lantern.throw)
  'art.lantern.hold': { layers: [
    // SECONDARY: its reach: a faint ring on the ground at 8 m
    groundRing(P, M, { hold: true, r: 8, main: 'noise', tile: [8, 1], scroll: [0.02, 0.1], kmul: 0.22 }),
  ] },
  // Solitude (the Hermit's reaction): Lamp quietened: a small lamp's glint over the shoulder
  'art.solitude.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small lamp lit over the shoulder and let go
    own(P, HUSH, { form: 'sphere', main: 'cells', tile: [3, 2], scroll: [0, 0.3], scale: [[0, 0.05], [0.3, 0.16], [1, 0.14]], offset: [0, 2, 0], rim: -0.5, core: 0.8, dur: 0.6, kmul: 2,
      erode: [[0, 0.6], [0.3, 0.04], [1, 1]] }),
    // TERTIARY: a few grains off it
    grains(HUSH, { r: 0.2, offset: [0, 2, 0], count: [5, 6] }),
  ] },
};
