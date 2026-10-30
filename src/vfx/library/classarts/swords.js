// ---------------------------------------------------------------------------------------
// THE COURTS OF SWORDS' ARTS' LOOKS (mind: a Page studies, a Knight charges, a Queen keeps, a King commands): each art its domain's
// grammar (docs/plans/art/VFX-LIBRARY.md 2) in the suit's steel-pale (ramp 'swords'), weighed by its rank (section 4), built from the class
// arts' kit (kit.js) and played by vfx/classartlooks.js on Petra's events (courier/classarts/body.js):
//   Scout (Page, Divination, held 6 s)            a sonar ring out to 40 m, an iris at the eyes, a slow pulse while it lasts
//   Riposte Rush (Knight, Psychokinesis)          a crescent cut behind the one parried (played at it), a core, chips (the blink's
//                                                 afterimage is the blink's own: vfx/afterimage.js)
//   Clear Sight (Queen, Divination, held 8 s)     an iris opened at the eyes, a faint lens dome, soft
//   Mark for Death (King, Spellscription, held 8 s)  a written ring over the marked one's head, tightening, a seal stamped under it
// and each reaction its action quietened on `art.react` (reactions.js): Quick Study, Edge (a gold glint), Cut Through, Judge.
//
// Prior art: the kit's (Riot's tiers and ladder, FFT's reaction flash, Chrono Cross's colours); Metal Gear Solid's soliton radar sweep and
// a submarine's sonar ping (Scout); Vagrant Story's wire dome on the target (Square, 2000: Clear Sight's lens); Death Note's written name
// over a head (Mark for Death's ring).
//
//   SWORDS_ART_EFFECTS   art.scout.use  art.scout.hold  art.quickStudy.fire  art.ripostRush.use  art.edge.fire  art.clearSight.use
//                        art.clearSight.hold  art.cutThrough.fire  art.verdict.use  art.verdict.hold  art.judge.fire
// ---------------------------------------------------------------------------------------
import {
  RANK, own, weight, core, groundRing, rimRing, lamp, lens, iris, scan, blinkOut, specks, chips, writtenRing, strokes, scriptBand, seal, inkMotes, sprites,
} from './kit.js';

const S = 'swords', { page: PAGE, knight: KNIGHT, queen: QUEEN, king: KING, whisper: HUSH } = RANK;
// (the cut: a flat crescent of streaks swept fast round the far side at the waist)
const cut = (R, o) => own(S, R, { form: 'wave', main: 'noise', tile: [3, 1], scroll: [1.4, 0], mask: 'streaks', maskK: 0.4, maskTile: [6, 1], maskScroll: [2, 0],
  scale: [[0, 0.9], [1, 1.7]], stretch: [1, 0.22, 1], offset: [0, 0.9, 0], edgeV: [0.35, 0.35], spin: 7, core: 0.8, coreAt: 0.75, dur: 0.32, erode: [[0, 0.2], [0.15, 0.03], [0.5, 0.08], [1, 1]], ...o });
// (the lens dome: a hemisphere of slow ripples lit at its rim, faint)
const lensDome = (R, o) => own(S, R, { form: 'dome', main: 'ripple', tile: [4, 2], scroll: [0.02, 0.15], mask: 'stars', maskK: 0.5, maskTile: [4, 2], maskScroll: [0.01, 0.05],
  scale: 4.5, stretch: [1, 0.7, 1], rim: 0.9, rimPow: 3, core: 0, ...o });

export const SWORDS_ART_EFFECTS = {
  // Scout (the Page of Swords; Divination): a sonar ring racing out to 40 m, steel-pale, every source in it tagged for 6 s
  'art.scout.use': { layers: [
    // PRIMARY: the sonar's ring racing out to 40 m, its front a thin bright line, a long gradient behind
    lens(S, PAGE, { r: 40, h: 0.3, dur: 1.4 }),
    // PRIMARY: an iris opened at the eyes as it goes
    iris(S, PAGE, { r: 0.4, dur: 0.5 }),
    // SECONDARY: a second sweep trailing it, fainter; star spots blinking out from the middle
    lens(S, PAGE, { r: 24, h: 0.2, dur: 1.1, at: 0.18, kmul: 0.55 }), blinkOut(PAGE, { r: 6 }),
    // TERTIARY: specks left hanging round the body
    specks(PAGE, {}),
  ] },
  // Scout held: a slow sonar pulse every 1.6 s from the feet, faint, while the tags hold
  'art.scout.hold': { layers: [
    // PRIMARY: the pulse: the lens's thin front thrown out to 14 m each loop, fading through its noise
    own(S, PAGE, { hold: true, loop: 1.6, form: 'band', main: 'noise', tile: [12, 1], scroll: [0.05, 0.6], scale: [[0, 1], [1, 14]], stretch: [1, [[0, 0.15], [1, 0.012]], 1], edgeV: [0.1, 0.6],
      rim: -0.2, erode: [[0, 0.1], [0.7, 0.3], [1, 1]], kmul: 0.6 }),
    // SECONDARY: the iris held small at the eyes
    iris(S, PAGE, { hold: true, r: 0.3, kmul: 0.5 }),
    // TERTIARY: specks drifting round the body
    specks(PAGE, { rate: 5, dur: Infinity }),
  ] },
  // Quick Study (the Page of Swords' reaction): Scout quietened: an iris at the eyes and a sweep 3 m
  'art.quickStudy.fire': { extends: 'art.react', layers: [
    // PRIMARY: the iris opened at the eyes
    iris(S, HUSH, { r: 0.35, dur: 0.45, kmul: 1.8 }),
    // SECONDARY: one sweep of the lens out to 3 m
    lens(S, HUSH, { r: 3, dur: 0.5, kmul: 1.6 }),
  ] },

  // Riposte Rush (the Knight of Swords; Psychokinesis): a crescent cut behind the one parried (played at it, facing away from the Courier)
  'art.ripostRush.use': { layers: [
    // PRIMARY: the cut: a ribbon arc swept fast round its far side at the waist, its edge hot
    cut(KNIGHT, { at: 0.08 }),
    // PRIMARY (its heart): white as it lands, 0.1 s
    core(KNIGHT, { s: 0.9, y: 1, at: 0.08 }),
    // SECONDARY: a thinner crescent counter-swept over it, and a shock ring at the feet
    cut(KNIGHT, { at: 0.12, scale: [[0, 0.7], [1, 1.3]], offset: [0, 1.3, 0], spin: -5, rot: 0.6, kmul: 0.6 }), groundRing(S, KNIGHT, { r: 2.2, dur: 0.4, at: 0.08 }),
    // SECONDARY: chips thrown off it
    chips(KNIGHT, { at: 0.08, r: 0.5, count: [8, 10] }),
    // TERTIARY: steel motes trailing, a pale rim left
    specks(KNIGHT, { r: 1, count: [10, 12], at: 0.12 }), rimRing(S, KNIGHT, { r: 2, dur: 1 }),
  ] },
  // Edge (the Knight of Swords' reaction): Riposte Rush quietened: a gold glint on the weak point
  'art.edge.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small crescent glint in gold at the chest
    own('gold', HUSH, { form: 'wave', main: 'noise', tile: [2, 1], scroll: [1.6, 0], scale: [[0, 0.4], [1, 0.8]], stretch: [1, 0.25, 1], offset: [0, 1.1, 0], edgeV: [0.35, 0.35], spin: 6, dur: 0.3, kmul: 2 }),
    // SECONDARY: the glint itself, a gold star
    sprites(HUSH, { count: 2, shape: 'star4', offset: [0, 1.3, 0], dir: 'up', speed: 0.2, size: [0.4, 0.5], sizeEnd: 0, life: 0.3, color: 'white', colorEnd: 'gold' }),
  ] },

  // Clear Sight (the Queen of Swords; Divination, held 8 s): an iris opened at the eyes, a faint lens dome; soft
  'art.clearSight.use': { layers: [
    // PRIMARY: the iris opened wide at the eyes
    iris(S, QUEEN, { r: 0.55, dur: 0.8 }),
    // PRIMARY: the lens dome rising round the body, faint
    lensDome(QUEEN, { dur: 1.2, scale: [[0, 1], [0.5, 4.5], [1, 4.7]], erode: [[0, 0.1], [0.5, 0.15], [1, 1]] }),
    // SECONDARY: scan lines climbing round the body
    scan(S, QUEEN, { r: 0.55, h: 2 }),
    // TERTIARY: specks hanging
    specks(QUEEN, {}),
  ] },
  // Clear Sight held: the lens dome round them, faint; the iris held small at the eyes; specks drifting
  'art.clearSight.hold': { layers: [
    // PRIMARY: the lens dome, its ripples slow, lit only at its rim
    lensDome(QUEEN, { hold: true, kmul: 0.6, erode: 0.12 }),
    // SECONDARY: the iris held at the eyes
    iris(S, QUEEN, { hold: true, r: 0.32 }),
    // TERTIARY: specks drifting in the dome
    specks(QUEEN, { rate: 4, dur: Infinity, r: 3 }),
  ] },
  // Cut Through (the Queen of Swords' reaction): Clear Sight quietened: the iris blinking open at the eyes
  'art.cutThrough.fire': { extends: 'art.react', layers: [
    // PRIMARY: the iris, opened and closed
    iris(S, HUSH, { r: 0.4, dur: 0.5, kmul: 1.8 }),
    // TERTIARY: a few specks off it
    specks(HUSH, { r: 0.6, offset: [0, 1.4, 0], count: [6, 8] }),
  ] },

  // Mark for Death (the King of Swords; Spellscription, held 8 s): a written ring over the marked one's head, tightening (played at it)
  'art.verdict.use': { layers: [
    // PRIMARY: the ring written over its head, stood facing the view, tightening from 1.4 m to 0.55
    writtenRing(S, KING, { r: 1, y: 2.4, dur: 1.1, face: 'camera', scale: [[0, 1.4], [0.35, 0.7], [1, 0.55]], g: 1.2 }),
    // PRIMARY: two strokes written across it, crossing
    strokes(S, KING, { r: 1.1, y: 1.2 }), strokes(S, KING, { r: 0.9, y: 1.6, rot: Math.PI, spin: -2.4, at: 0.08 }),
    // PRIMARY (its heart): white at the chest for 0.1 s
    core(KING, { s: 1.1, y: 1.2, at: 0.1 }),
    // SECONDARY: a band of the running hand round its chest, and a seal stamped on the ground under it
    scriptBand(S, KING, { r: 0.7, y: 1 }), seal(S, KING, { r: 1, at: 0.1 }),
    // TERTIARY: ink motes drifting down, a faint written ring left on the ground
    inkMotes(KING, {}), writtenRing(S, KING, { r: 1.4, dur: 1.8, at: 0.2, kmul: 0.4, g: 0.6 }),
    // the screen's weight: a lamp, a small shake, the world held a beat
    lamp(KING, { k: 24, up: 2 }), ...weight(KING, { shake: 0.18, stop: 0.05 }),
  ] },
  // Mark for Death held: the written ring turning tight over its head, a thin band at its chest, ink falling slowly
  'art.verdict.hold': { layers: [
    // PRIMARY: the ring over the head, tight, turning
    writtenRing(S, KING, { hold: true, r: 0.55, y: 2.4, face: 'camera', spin: 0.6, kmul: 0.8 }),
    // SECONDARY: a thin band of the running hand at its chest
    scriptBand(S, KING, { hold: true, r: 0.65, h: 0.2, kmul: 0.45 }),
    // TERTIARY: ink motes falling off the ring
    inkMotes(KING, { rate: 4, dur: Infinity, r: 0.5, offset: [0, 2.2, 0], height: 0.2, gravity: 0.6 }),
  ] },
  // Judge (the King of Swords' reaction): Mark for Death quietened: a small ring written over the head
  'art.judge.fire': { extends: 'art.react', layers: [
    // PRIMARY: a small written ring over the head
    writtenRing(S, HUSH, { r: 0.45, y: 2.2, face: 'camera', dur: 0.6, kmul: 1.8 }),
    // SECONDARY: a seal stamped small at the feet
    seal(S, HUSH, { r: 0.45, kmul: 1.5 }),
  ] },
};
