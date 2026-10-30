// ---------------------------------------------------------------------------------------
// THE FOOL'S, THE WORLD'S AND THE OTHER EIGHT MAJORS' ARTS' LOOKS: each art its domain's grammar (docs/plans/art/VFX-LIBRARY.md 2) in its
// Major's suit (progress/spreads.js MAJOR_SUIT: a planet's, and the Fool's, the film's 'wild'; the Hanged Man's Cups, Judgement's Wands),
// built from the class arts' kit (kit.js) and played by vfx/classartlooks.js on Petra's events (courier/classarts/body.js):
//   the Fool (wild, a Page's weight: the beginner)   Beginner's Luck (Divination: an iris and two dice flicked up; armed while it waits,
//                                                    and fired when a roll is thrown twice), Running on Empty (a slow ring of the film)
//   the World (the ultimate)                         Completion (all seven: an armillary of the seven domains' glazes turning, each
//                                                    domain's grammar in one beat; held 10 s), Wholeness
//   the Magician (wild)    Quick Swap (Alteration: a card flipped at the hand)
//   the Priestess (wild)   Veil (Possession: a veil of mist over you; `.mark` an eye closing on the creature)
//   the Empress (wild)     Overgrowth (Manifestation: the thicket's light rising at 6 m, petals; held 10 s: its briars the lasting look's)
//   the Wheel (wild)       Spin (Divination: a wheel of fortune turning over the head, its pip landing)
//   the Tower (wild)       Collapse (Psychokinesis: the ground falling in 4 m, stones from above)
//   the Sun (wild)         Daybreak (Ouranurgy: a sun disc, a ring of rays, a flash)
//   the Hanged Man (Cups)  Hang Time (Ouranurgy: a slow clock ring round the body, the air's motes hanging still, a halo under the
//                          feet; held while the hang holds)
//   Judgement (Wands)      Settle the Score (Spellscription: beams drawn in from all round, a verdict burst out to 12 m)
// and each reaction its action quietened on `art.react` (reactions.js).
//
// Prior art: the kit's (Riot's tiers and ladder, FFT's reaction flash, Chrono Cross's colours); the Rider-Waite-Smith deck's images (the
// Fool's leap, the Wheel of Fortune, the Tower's falling stones, the Sun's disc and rays, the Hanged Man's stillness, the Judgement's
// trumpet call); Chrono Trigger's and Final Fantasy's ultimates for the World's seven at once (one beat a school, layered).
//
//   ARCANA_ART_EFFECTS   art.<id>.use / .hold / .armed / .fire / .mark for beginnersLuck zero completion wholeness sleight will veil intuition
//                        bloom abundance spin fortune collapse upheaval daybreak radiance suspend surrender reckoning secondChance
// ---------------------------------------------------------------------------------------
import {
  RANK, own, weight, core, groundRing, rimRing, lamp, skyColumn, armillary, starFall, mist, crystal, dust, grains, lens, iris, blinkOut, specks, shock, chips, dustCurtain,
  tether, spiralIn, haze, lineMotes, sweepUp, crescents, flakes, shimmer, writtenRing, strokes, seal, inkMotes, sprites, growsIn, erodes,
} from './kit.js';

const F = 'wild', C = 'cups', W = 'wands', { page: PAGE, major: M, world: WORLD, whisper: HUSH } = RANK;
const DOMAINS = ['ouranurgy', 'manifestation', 'divination', 'psychokinesis', 'possession', 'alteration', 'spellscription'];
// (one sprite exactly, whatever the rank's counts: a die, a pip)
const one = (R, def) => ({ ...sprites(R, def), count: 1 });
// (the seven's armillary: a hoop a domain in its own glaze (a short band, so it reads from the side), stacked up the body, each turning its own way)
const seven = (R, o = {}, s = 1) => DOMAINS.map((d, i) => own(d, R, { form: 'band', main: i % 2 ? 'rays' : 'script', tile: i % 2 ? [16, 1] : [8, 0.35], scroll: [i % 2 ? 0.15 : -0.1, 0],
  scale: (1.3 - 0.06 * i) * s, stretch: [1, 0.1 / (1.3 - 0.06 * i), 1], offset: [0, (0.15 + i * 0.36) * s, 0], edgeV: [0.25, 0.25], rim: -0.2, spin: (i % 2 ? 1 : -1) * (0.8 + 0.15 * i), g: 1.3, ...o }));
// (a wheel stood facing the view over the head: spokes, a hub turning the other way)
const wheel = (R, o = {}, s = 1) => [
  own(F, R, { form: 'ring', face: 'camera', main: 'rays', tile: [8, 1], scroll: [0, 0.2], scale: [[0, 0.3 * s], [0.2, 0.9 * s], [1, 0.95 * s]], offset: [0, 2.6, 0], edgeV: [0.2, 0.15], spin: 9, ...o }),
  own(F, R, { form: 'disc', face: 'camera', main: 'rays', tile: [8, 1], scroll: [0, 0.1], scale: [[0, 0.2 * s], [0.2, 0.5 * s], [1, 0.5 * s]], offset: [0, 2.6, 0], edgeV: [0, 0.5], spin: -5, kmul: 0.6, ...o }),
];
// (the clock ring: twelve ticks laid round the waist)
const clock = (R, o = {}) => own(C, R, { form: 'ring', main: 'rays', tile: [12, 1], scroll: [0, 0.2], mask: 'noise', maskTile: [3, 1], maskScroll: [0.05, 0], scale: 1.1, offset: [0, 0.95, 0], edgeV: [0.55, 0.15], spin: 0.5, ...o });
// (the card: a quad of the film stood facing the view, its width closing to an edge and opening again)
const card = (R, o = {}) => own(F, R, { form: 'quad', main: 'cells', mainK: 0.4, tile: [2, 3], scroll: [0.05, 0.2], mask: 'stars', maskK: 0.3, maskTile: [1, 1.4], scale: 0.45, g: 1.4, stretch: [[[0, 1], [0.25, 0.04], [0.5, 1], [1, 1.05]], 1, 1.45],
  offset: [0, 1.25, 0], edgeV: [0.12, 0.12], edgeU: [0.12, 0.12], core: 0.6, ...o });

export const ARCANA_ART_EFFECTS = {
  // Beginner's Luck (the Fool; Divination): an iris opened at the hand, two dice flicked up off it, tumbling: the next roll is thrown twice
  'art.beginnersLuck.use': { layers: [
    // PRIMARY: the iris opened at the hand, in the film
    iris(F, PAGE, { r: 0.35, y: 1.2, dur: 0.6 }),
    // PRIMARY: two dice flicked up off the hand, tumbling
    { ...sprites(PAGE, { shape: 'die', offset: [0, 1.2, 0], dir: 'cone', axis: 'up', cone: 25, speed: [3, 4], size: [0.16, 0.2], life: [0.6, 0.7], gravity: 9, drag: 0.4, color: 'white', colorEnd: 'film', spin: [-10, 10] }), count: 2 },
    // SECONDARY: star spots blinking out round the hand; a lens ring thrown out at the feet
    blinkOut(PAGE, { r: 1, offset: [0, 1.2, 0] }), lens(F, PAGE, { r: 2.5, dur: 0.6 }),
    // TERTIARY: film specks hanging
    specks(PAGE, { r: 0.8, count: [8, 10] }),
  ] },
  // Beginner's Luck armed (while it waits for a roll, up to 30 s): a faint halo of stars turning over the head, a glint now and then
  'art.beginnersLuck.armed': { layers: [
    // PRIMARY: the halo: a ring of the film over the head, stood facing the view, turning slowly
    own(F, HUSH, { hold: true, form: 'ring', face: 'camera', main: 'noise', tile: [6, 1], scroll: [0.1, 0.2], mask: 'stars', maskK: 0.5, maskTile: [6, 1], maskScroll: [-0.05, 0], scale: 0.24,
      offset: [0, 2.2, 0], edgeV: [0.35, 0.25], spin: 0.8, kmul: 1.9, g: 1.4 }),
    // SECONDARY: a glint off it now and then
    sprites(HUSH, { rate: 3, dur: Infinity, shape: 'star4', spawn: 'ring', r: 0.32, offset: [0, 2.15, 0], dir: 'up', speed: 0.1, size: [0.1, 0.14], sizeEnd: 0, life: [0.3, 0.4], color: 'film' }),
    // TERTIARY: film motes drifting down off it
    sprites(HUSH, { rate: 4, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: 0.3, offset: [0, 2.1, 0], dir: 'up', speed: [-0.4, -0.2], size: [0.04, 0.06], sizeEnd: 0, life: [0.8, 1.2], color: 'film', alpha: 0.6 }),
  ] },
  // Beginner's Luck spent (a roll thrown twice): a die popped over the head and its glint: the better throw kept
  'art.beginnersLuck.fire': { extends: 'art.react', layers: [
    // PRIMARY: the die kept, popped up over the head
    one(HUSH, { shape: 'die', offset: [0, 2, 0], dir: 'up', speed: 1.4, size: 0.24, sizeEnd: 0.2, life: 0.5, drag: 3, color: 'white', colorEnd: 'film', spin: [-4, 4] }),
    // SECONDARY: its glint
    one(HUSH, { at: 0.2, shape: 'star4', offset: [0, 2.3, 0], speed: 0, size: 0.5, sizeEnd: 0, life: 0.3, color: 'white', colorEnd: 'film' }),
  ] },
  // Running on Empty (the Fool's reaction), armed while costs are off: Beginner's Luck's lens in a whisper, a slow ring of the film at the feet
  'art.zero.armed': { layers: [
    // PRIMARY: the slow ring of the film round the feet
    own(F, HUSH, { hold: true, form: 'ring', main: 'noise', tile: [6, 1], scroll: [0.08, 0.2], scale: 0.85, offset: [0, 0.04, 0], edgeV: [0.6, 0.15], spin: 0.8, kmul: 1.6, erode: 0.1 }),
    // SECONDARY: a fainter ring turning the other way inside it
    own(F, HUSH, { hold: true, form: 'ring', main: 'stars', tile: [8, 1], scroll: [-0.05, 0], scale: 0.6, offset: [0, 0.05, 0], edgeV: [0.4, 0.3], spin: -0.5, kmul: 1.1 }),
    // TERTIARY: film specks rising off it
    specks(HUSH, { rate: 5, dur: Infinity, r: 0.8, height: 0.3, dir: 'up', speed: [0.2, 0.5], color: 'film' }),
  ] },
  // Running on Empty fired (the pool ran dry): the slow ring of the film thrown out from the feet
  'art.zero.fire': { extends: 'art.react', layers: [
    // PRIMARY: the ring of the film thrown out 2.5 m, slow
    lens(F, HUSH, { r: 2.5, dur: 0.8, kmul: 1.8 }),
    // TERTIARY: film specks
    specks(HUSH, { r: 0.8, color: 'film' }),
  ] },

  // Completion (the World; all seven, the ultimate, held 10 s): an armillary of the seven domains' glazes turning, each domain's grammar in one beat
  'art.completion.use': { layers: [
    // PRIMARY: the seven's armillary, written in up the body, each ring turning its own way
    seven(WORLD, { dur: 1.6, erode: growsIn(0.25, 0.7) }),
    // PRIMARY (its heart): white at the chest for 0.1 s
    core(WORLD, { s: 2, y: 1.2 }),
    // SECONDARY: each domain's grammar in one beat at once: the sky's column, spikes, the lens, the shock, the spiral, the sweep, the circle
    skyColumn('ouranurgy', WORLD, { r: 0.9, h: 9, dur: 0.8 }), crystal('manifestation', WORLD, { r: 2.2, h: 1, dur: 0.9 }), lens('divination', WORLD, { r: 18, h: 0.25, dur: 1.2 }),
    shock('psychokinesis', WORLD, { r: 9, dur: 0.8 }), spiralIn('possession', WORLD, { r: 1.6, h: 2.6 }), sweepUp('alteration', WORLD, { r: 0.8, h: 2.6 }),
    writtenRing('spellscription', WORLD, { r: 3.2, dur: 1.4 }),
    // TERTIARY: motes of the film and of gold rising, a rim of the film left at the reach
    sprites(WORLD, { at: 0.2, count: [18, 24], shape: 'sparkle', spawn: 'disc', r: 2, offset: [0, 0.3, 0], dir: 'up', speed: [0.6, 1.8], size: [0.05, 0.1], sizeEnd: 0, life: [1.2, 1.8], drag: 0.6,
      color: 'film', alpha: 0.9, twinkle: 5 }),
    sprites(WORLD, { at: 0.3, count: [10, 14], shape: 'soft', spawn: 'disc', r: 1.2, offset: [0, 0.6, 0], dir: 'up', speed: [0.4, 1.2], size: [0.06, 0.1], sizeEnd: 0, life: [1, 1.5], color: 'gold' }),
    rimRing(F, WORLD, { r: 9, dur: 1.8 }),
    // the screen's weight: the ultimate's
    lamp(WORLD, { k: 40, range: 14, color: 'film' }), ...weight(WORLD, { flash: 0.2, shake: 0.28, stop: 0.08, color: 'film' }),
  ] },
  // Completion held: the seven's armillary turning round the body, softer; motes of the film rising
  'art.completion.hold': { layers: [
    // PRIMARY: the seven rings, held
    seven(WORLD, { hold: true, kmul: 0.45, erode: 0.08 }, 0.85),
    // SECONDARY: a band of the film turning inside them
    shimmer(F, WORLD, { hold: true, r: 0.55, h: 2.2, kmul: 0.5 }),
    // TERTIARY: motes of the film rising
    sprites(WORLD, { rate: 8, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: 1, offset: [0, 0.1, 0], dir: 'up', speed: [0.5, 1.2], size: [0.04, 0.08], sizeEnd: 0, life: [1, 1.6], color: 'film', alpha: 0.7 }),
  ] },
  // Wholeness (the World's reaction): Completion quietened: the seven rings flashed small at the feet
  'art.wholeness.fire': { extends: 'art.react', layers: [
    // PRIMARY: the seven rings, small and quick, stacked from the feet
    seven(HUSH, { dur: 0.6, kmul: 1.8, erode: growsIn(0.15, 0.5) }, 0.45),
    // TERTIARY: motes of the film
    specks(HUSH, { r: 0.6, color: 'film' }),
  ] },

  // Quick Swap (the Magician; Alteration): a card flipped at the hand
  'art.sleight.use': { layers: [
    // PRIMARY: the card flipped at the hand, its width closing to an edge and opening again
    card(M, { dur: 0.7, erode: [[0, 0], [0.6, 0.06], [1, 1]] }),
    // PRIMARY (its heart): the flip's flash, white, 0.1 s
    core(M, { s: 0.6, y: 1.25, at: 0.15 }),
    // SECONDARY: crescents turning round the hand; flakes of the film turning colour as they fall
    crescents(F, M, { r: 0.6, y: 1.05, dur: 0.6 }), flakes(M, { shape: 'diamond', r: 0.4, height: 0.6, offset: [0, 1, 0], count: [10, 12] }),
    // TERTIARY: a shimmer
    shimmer(F, M, { r: 0.45, h: 1.6, kmul: 0.5 }),
    lamp(M, { k: 16 }),
  ] },
  // Will (the Magician's reaction): Quick Swap quietened: a small card glint at the hand
  'art.will.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small card flipped
    card(HUSH, { scale: 0.28, dur: 0.45, kmul: 1.8 }),
    // TERTIARY: a few flakes of the film
    flakes(HUSH, { shape: 'diamond', r: 0.3, height: 0.4, offset: [0, 1.1, 0], count: [6, 8] }),
  ] },

  // Veil (the Priestess; Possession): a veil of mist drawn down over you (and `.mark`, an eye closing on the creature it blinds)
  'art.veil.use': { layers: [
    // PRIMARY: the veil drawn down over the body: a dome of marbled film lowered over them, its rim soft
    own(F, M, { form: 'dome', main: 'marble', tile: [3, 2], scroll: [0.03, -0.3], flow: 'noise', flowK: 0.08, scale: [[0, 0.5], [0.4, 1.1], [1, 1.15]], stretch: [1, [[0, 3.6], [0.4, 2], [1, 1.9]], 1],
      rim: 0.6, core: 0, dur: 1.2, erode: [[0, 0.3], [0.3, 0.06], [0.7, 0.1], [1, 1]] }),
    // PRIMARY: mist poured down it (alpha-over)
    mist(M, { r: 0.6, offset: [0, 1.6, 0], speed: [-0.6, -0.2], count: [10, 14], alpha: 0.35, at: 0 }),
    // SECONDARY: a spiral drawn in round the body; motes running the line to the one it blinds
    spiralIn(F, M, { r: 1, h: 2, kmul: 0.5 }), lineMotes(M, { count: [10, 12] }),
    // TERTIARY: a haze breathing low
    haze(F, M, { r: 1.4 }),
    lamp(M, { k: 14 }),
  ] },
  // Veil's mark (played at the creature): an eye over its head closing, a collar of mist round it
  'art.veil.mark': { layers: [
    // PRIMARY: the eye: a ring stood facing the view over its head, flattened shut; its iris a disc of stars
    own(F, M, { form: 'ring', face: 'camera', main: 'rays', tile: [16, 1], scroll: [0.1, 0], scale: 0.5, stretch: [1, 1, [[0, 1], [0.5, 0.12], [1, 0.02]]], offset: [0, 2.2, 0], edgeV: [0.3, 0.2], dur: 1 }),
    own(F, M, { form: 'disc', face: 'camera', main: 'stars', tile: [3, 1], scroll: [0, -0.3], scale: 0.32, stretch: [1, 1, [[0, 1], [0.5, 0.1], [1, 0.02]]], offset: [0, 2.2, 0], edgeV: [0, 0.4], dur: 1, kmul: 0.7 }),
    // SECONDARY: a band of mist closing round its head
    own(F, M, { form: 'band', main: 'marble', tile: [3, 1], scroll: [0.1, -0.2], flow: 'noise', flowK: 0.08, scale: [[0, 1.2], [1, 0.55]], stretch: [1, 0.6, 1], offset: [0, 1.6, 0], edgeV: [0.3, 0.4], rim: -0.4, dur: 1, kmul: 0.45 }),
    // TERTIARY: mist falling off it (alpha-over)
    mist(M, { r: 0.4, offset: [0, 1.8, 0], count: [4, 6], alpha: 0.3 }),
  ] },
  // Intuition (the Priestess' reaction): Veil quietened: an eye blinking at the eyes
  'art.intuition.fire': { extends: 'art.react', layers: [
    // PRIMARY: the eye opening and closing at the eyes
    iris(F, HUSH, { r: 0.35, dur: 0.5, kmul: 1.8, stretch: [1, 1, [[0, 0.1], [0.4, 1], [1, 0.05]]] }),
    // TERTIARY: a wisp of mist
    mist(HUSH, { count: [3, 4], r: 0.3, offset: [0, 1.5, 0] }),
  ] },

  // Overgrowth (the Empress; Manifestation, held 10 s): a thicket rising 6 m round, leaves thrown up and falling
  'art.bloom.use': { layers: [
    // PRIMARY: the thicket's light: two rings of spikes grown in at its reach, where the briars rise (classartlasting/thicket.js)
    crystal(F, M, { r: 6, h: 1.1, dur: 1.2 }), crystal(F, M, { r: 5.3, h: 1.4, dur: 1.2, at: 0.08, rot: 0.26 }),
    // PRIMARY (its heart): white as it bursts out of the ground, 0.1 s
    core(M, { s: 1.4, y: 0.6 }),
    // SECONDARY: leaves thrown up and falling, turning colour; a ring on the ground racing out to 6 m
    flakes(M, { shape: 'leaf', spawn: 'disc', r: 5, offset: [0, 0.6, 0], dir: 'cone', axis: 'up', cone: 40, speed: [2, 4], gravity: 2, count: [20, 26] }), groundRing(F, M, { r: 6, dur: 0.7 }),
    // TERTIARY: dust settling round it, grains
    dust(M, { r: 2.4, spawn: 'ring', count: [10, 14] }), grains(M, { r: 3 }),
    lamp(M, { k: 22 }), ...weight(M, { shake: 0.22, stop: 0.04 }),
  ] },
  // Overgrowth held: petals and leaves drifting off the briars at its edge, grains hanging in it (the briars are the lasting look's:
  // classartlasting/thicket.js)
  'art.bloom.hold': { layers: [
    // SECONDARY: wild-rose petals blown off the ring, drifting down and in
    flakes(M, { rate: 7, dur: Infinity, shape: 'petal', spawn: 'ring', r: 6, offset: [0, 1.4, 0], dir: 'in', speed: [0.2, 0.5], gravity: 0.35, drag: 1.2, life: [2.2, 3], size: [0.06, 0.1],
      color: 0xf3c4cf, colorEnd: 'film' }),
    // SECONDARY: a leaf now and then
    flakes(M, { rate: 3, dur: Infinity, shape: 'leaf', spawn: 'ring', r: 5.8, offset: [0, 1.2, 0], speed: [0.1, 0.4], gravity: 0.6, life: [1.6, 2.2] }),
    // TERTIARY: grains hanging in it
    grains(M, { rate: 4, dur: Infinity, r: 5, gravity: 0.2, alpha: 0.6 }),
  ] },
  // Abundance (the Empress' reaction): Overgrowth quietened: small spikes grown in at the feet, a few leaves
  'art.abundance.fire': { extends: 'art.react', layers: [
    // PRIMARY: a ring of small spikes at the feet
    crystal(F, HUSH, { r: 0.75, h: 0.4, dur: 0.55, kmul: 1.6 }),
    // SECONDARY: leaves thrown up
    flakes(HUSH, { shape: 'leaf', spawn: 'disc', r: 0.6, offset: [0, 0.3, 0], dir: 'cone', axis: 'up', cone: 40, speed: [1.5, 2.5], count: [8, 10] }),
  ] },

  // Spin (the Wheel; Divination): a wheel of fortune turning over the head, its pip landing in the hand
  'art.spin.use': { layers: [
    // PRIMARY: the wheel over the head, spokes and hub, turning against each other
    wheel(M, { dur: 1.4, erode: growsIn(0.15, 0.75) }),
    // PRIMARY: the pip landing: a die dropped from the wheel to the hand, and its flash
    one(M, { at: 1, shape: 'die', offset: [0, 2.4, 0], dir: 'up', speed: -2.5, size: 0.2, life: 0.4, gravity: 6, color: 'white', colorEnd: 'film', spin: [-6, 6] }), core(M, { s: 0.8, y: 1.3, at: 1.3 }),
    // SECONDARY: star spots blinking out round the wheel; a lens thrown out at the feet as the pip lands
    blinkOut(M, { r: 1.2, offset: [0, 2.6, 0] }), lens(F, M, { r: 4, at: 1.25, dur: 0.6 }),
    // TERTIARY: film specks
    specks(M, { r: 1.2 }),
    lamp(M, { k: 18, at: 1.3 }),
  ] },
  // Fortune (the Wheel's reaction): Spin quietened: a small wheel turning over the head and gone
  'art.fortune.fire': { extends: 'art.react', layers: [
    // PRIMARY: the wheel, small and quick
    wheel(HUSH, { dur: 0.6, kmul: 1.8, erode: growsIn(0.2, 0.6) }, 0.45),
    // TERTIARY: a few specks off it
    specks(HUSH, { r: 0.4, offset: [0, 2.4, 0], count: [5, 6] }),
  ] },

  // Collapse (the Tower; Psychokinesis): the ground falling in within 4 m, stones from above
  'art.collapse.use': { layers: [
    // PRIMARY: the ground falling in: a ring of cracks drawn in from 4 m to the middle, its inner edge the front
    own(F, M, { form: 'ring', main: 'cracks', tile: [8, 1], scroll: [0, -1.6], scale: [[0, 4.4], [1, 0.6]], offset: [0, 0.05, 0], edgeV: [0.08, 0.7], core: 0.6, dur: 0.6, erode: [[0, 0.15], [0.2, 0.04], [0.7, 0.1], [1, 1]] }),
    // PRIMARY: the ground darkening as it falls in (alpha-over ink cracks)
    own('ink', M, { form: 'disc', add: 0, main: 'cracks', tile: [4, 2], scroll: [0, -0.2], scale: [[0, 4.2], [0.4, 4], [1, 3.8]], offset: [0, 0.02, 0], core: 0, kmul: 0.6, dur: 1.6,
      erode: [[0, 0.5], [0.2, 0.1], [0.6, 0.15], [1, 1]], rampShift: 0, turn: 'random' }),
    // PRIMARY: stones from above falling onto it, and the impact's heart as they land
    sprites(M, { pool: 'alpha', count: [14, 18], shape: 'chip', spawn: 'column', r: 3.5, height: 2, offset: [0, 5, 0], dir: 'up', speed: [-6, -3], size: [0.16, 0.28], life: [0.8, 1.1], gravity: 14, floor: 'ground',
      color: 0x6a5e54, alpha: 1, spin: [-6, 6], delay: [0, 0.25] }),
    core(M, { s: 1.6, y: 0.3, at: 0.45 }),
    // SECONDARY: the shock thrown out as they land; chips torn up
    shock(F, M, { r: 5, dur: 0.5, at: 0.45 }), chips(M, { r: 3, at: 0.45, speed: [3, 6] }),
    // TERTIARY: a dust curtain, a pale rim at its reach
    dustCurtain(M, { r: 2.5, at: 0.5 }), rimRing(F, M, { r: 4.2, at: 0.6, kmul: 0.5 }),
    lamp(M, { k: 26, at: 0.45 }), ...weight(M, { flash: 0.1, shake: 0.42, stop: 0.07, at: 0.45 }),
  ] },
  // Upheaval (the Tower's reaction): Collapse quietened: a small ring falling in at the feet, a few chips
  'art.upheaval.fire': { extends: 'art.react', layers: [
    // PRIMARY: a ring of cracks drawn in from 1.4 m
    own(F, HUSH, { form: 'ring', main: 'cracks', tile: [6, 1], scroll: [0, -1.6], scale: [[0, 1.4], [1, 0.3]], offset: [0, 0.05, 0], edgeV: [0.08, 0.7], dur: 0.45, kmul: 1.8 }),
    // SECONDARY: a few chips
    chips(HUSH, { r: 0.6, speed: [2, 4] }),
  ] },

  // Daybreak (the Sun; Ouranurgy): a sun disc over the head, a ring of rays, a flash that blinds within 10 m
  'art.daybreak.use': { layers: [
    // PRIMARY: the sun disc swelling over the head, white at its heart
    own(F, M, { form: 'disc', face: 'camera', main: 'cells', tile: [3, 1], scroll: [0.05, 0.3], scale: [[0, 0.2], [0.15, 1.2], [1, 1.4]], offset: [0, 2.6, 0], edgeV: [0, 0.6], core: 0.9, coreAt: 0.5,
      dur: 1.4, erode: erodes(0.5), rampShift: [[0, 0.45], [0.1, 0.3], [1, -0.3]] }),
    // PRIMARY: the ring of rays round it, turning slow
    own(F, M, { form: 'ring', face: 'camera', main: 'rays', tile: [24, 1], scroll: [0, 0.6], scale: [[0, 0.5], [0.2, 2.6], [1, 3]], offset: [0, 2.6, 0], edgeV: [0.3, 0.5], spin: 0.4, dur: 1.4, erode: erodes(0.45) }),
    // PRIMARY (its heart): white for 0.1 s
    core(M, { s: 2, y: 2.6 }),
    // SECONDARY: a ring racing out along the ground to 10 m; rays rising round the body
    groundRing(F, M, { r: 10, dur: 0.7 }),
    own(F, M, { form: 'band', main: 'rays', tile: [10, 1], scroll: [0, 1.4], scale: 1.1, stretch: [1, 2.6, 1], edgeV: [0.1, 0.6], rim: -0.4, dur: 0.8, g: 0.8 }),
    // TERTIARY: warm motes falling slow out of it
    starFall(M, { r: 2, offset: [0, 2, 0], color: 'white', colorEnd: 'gold' }),
    lamp(M, { k: 50, range: 14, color: 'white' }), ...weight(M, { flash: 0.32, shake: 0.1, color: 'white' }),
  ] },
  // Radiance (the Sun's reaction): Daybreak quietened: a small sun glint over the head, its rays
  'art.radiance.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small sun disc over the head
    own(F, HUSH, { form: 'disc', face: 'camera', main: 'cells', tile: [3, 1], scale: [[0, 0.1], [0.3, 0.35], [1, 0.4]], offset: [0, 2.3, 0], edgeV: [0, 0.6], core: 0.8, coreAt: 0.5, dur: 0.5, kmul: 1.8 }),
    // SECONDARY: its rays
    own(F, HUSH, { form: 'ring', face: 'camera', main: 'rays', tile: [16, 1], scroll: [0, 0.6], scale: [[0, 0.2], [1, 0.8]], offset: [0, 2.3, 0], edgeV: [0.3, 0.5], dur: 0.5, kmul: 1.6 }),
  ] },

  // Hang Time (the Hanged Man, Cups; Ouranurgy, held 3 s): a slow clock ring round the body as time round it slows
  'art.suspend.use': { layers: [
    // PRIMARY: the clock ring round the waist, its ticks written in
    clock(M, { dur: 1, scale: [[0, 0.5], [0.3, 1.1], [1, 1.15]], erode: growsIn(0.25, 0.7) }),
    // PRIMARY: a thin column of the sky dropped onto it; its heart
    skyColumn(C, M, { r: 0.3, h: 6, dur: 0.6 }), core(M, { s: 1, y: 1 }),
    // SECONDARY: the armillary turning against the clock
    armillary(C, M, { r: 1.25, y: 0.95, dur: 1 }),
    // TERTIARY: star motes falling slow, a breath of mist; the air's motes round them caught and hanging still for the hang's 3 s
    starFall(M, { r: 1 }), mist(M, { count: [3, 5] }),
    sprites(M, { count: [26, 32], shape: 'sparkle', spawn: 'sphere', r: 2.6, offset: [0, 1, 0], dir: 'up', speed: 0, size: [0.04, 0.08], sizeEnd: 0.03, life: [3.1, 3.6], color: 'white',
      colorEnd: 'suit', alpha: 0.85, alphaEnd: 0.3, twinkle: 1.2, at: 0.1 }),
    lamp(M, { k: 18 }), ...weight(M, { stop: 0.08 }),
  ] },
  // Hang Time held: the clock ring turning slow round the waist, a ring stood up turning against it, motes falling slow, a halo under the feet
  'art.suspend.hold': { layers: [
    // PRIMARY: the clock ring
    clock(M, { hold: true, kmul: 0.75, erode: 0.08 }),
    // SECONDARY: a ring stood up facing the view, turning against it
    own(C, M, { hold: true, form: 'ring', face: 'camera', main: 'rays', tile: [12, 1], scroll: [-0.1, 0], scale: 1, offset: [0, 0.95, 0], edgeV: [0.8, 0.08], spin: -0.3, kmul: 0.5, erode: 0.1 }),
    // TERTIARY: star motes falling slow; a soft halo under the feet, what they hang on
    starFall(M, { rate: 5, dur: Infinity, r: 1, speed: [-0.4, -0.15] }),
    own(C, M, { hold: true, loop: 3, form: 'disc', main: 'ripple', tile: [3, 1], scroll: [0.02, -0.12], mask: 'noise', maskK: 0.4, maskTile: [2, 1], scale: [[0, 0.62], [0.5, 0.7], [1, 0.62]],
      offset: [0, -0.02, 0], edgeV: [0, 0.6], core: 0.3, kmul: 0.55, g: 1.2, erode: 0.08 }),
  ] },
  // Surrender (the Hanged Man's reaction): Hang Time quietened: the clock's tick, a small ring at the waist
  'art.surrender.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small clock ring at the waist, ticked once
    clock(HUSH, { dur: 0.5, scale: [[0, 0.4], [0.3, 0.7], [1, 0.72]], kmul: 1.8 }),
    // TERTIARY: a few star motes falling
    starFall(HUSH, { r: 0.5, count: [5, 6] }),
  ] },

  // Settle the Score (Judgement, Wands; Spellscription): beams drawn in from all round to the body, then the verdict's burst out to 12 m
  'art.reckoning.use': { layers: [
    // PRIMARY: six tethers of the running hand reaching in to the body from 10 m round, their script running inward
    ...[0, 1.05, 2.09, 3.14, 4.19, 5.24].map((rot) => tether(W, M, { len: 10, r: 0.08, y: 1.1, rot, main: 'script', tile: [2, 4], scroll: [0, -2.6], dur: 0.7, kmul: 0.8 })),
    // PRIMARY: the verdict's burst: a written ring thrown out to 12 m, and its heart
    own(W, M, { form: 'ring', main: 'script', tile: [24, 0.3], scroll: [0.04, 0.6], scale: [[0, 0.5], [1, 12]], offset: [0, 0.05, 0], edgeV: [0.8, 0.06], at: 0.45, dur: 0.8, erode: erodes(0.4) }),
    core(M, { s: 1.8, y: 1.2, at: 0.45 }),
    // SECONDARY: strokes written across the front, a seal stamped at the feet, the circle written under them
    strokes(W, M, { r: 1.4, y: 1.3, at: 0.45 }), seal(W, M, { r: 1.3, at: 0.45 }), writtenRing(W, M, { r: 2.2, dur: 1.2 }),
    // TERTIARY: ink motes, a faint ring of script left at the reach
    inkMotes(M, { r: 2, at: 0.6 }), rimRing(W, M, { r: 12, at: 0.8, main: 'script', tile: [24, 0.3] }),
    lamp(M, { k: 30, range: 14, at: 0.45 }), ...weight(M, { flash: 0.18, shake: 0.35, stop: 0.06, at: 0.45 }),
  ] },
  // Second Chance (Judgement's reaction): Settle the Score quietened: a small verdict ring at the chest, a seal
  'art.secondChance.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small written ring thrown open at the chest, facing the view
    own(W, HUSH, { form: 'ring', face: 'camera', main: 'script', tile: [6, 0.3], scroll: [0.04, 0.6], scale: [[0, 0.2], [1, 1.1]], offset: [0, 1.1, 0], edgeV: [0.6, 0.1], dur: 0.5, kmul: 1.8 }),
    // SECONDARY: a seal at the feet
    seal(W, HUSH, { r: 0.5, kmul: 1.5 }),
  ] },
};
