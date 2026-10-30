// ---------------------------------------------------------------------------------------
// THE COURTS OF CUPS' ARTS' LOOKS (feeling: a Page studies, a Knight charges, a Queen keeps, a King commands): each art its domain's
// grammar (docs/plans/art/VFX-LIBRARY.md 2) in the suit's water-blue (ramp 'cups'), weighed by its rank (section 4), built from the class
// arts' kit (kit.js) and played by vfx/classartlooks.js on Petra's events (courier/classarts/body.js):
//   Offering (Page, Manifestation, held 4 s)    a cup of light set down at the feet, a calm ring out to 6 m
//   Water Walk (Knight, Alteration, held 5 s)   rings at each footfall on the surface, a skim wake behind
//   Catch the Rain (Queen, Ouranurgy)           the sky poured down a thin column into the Lachrymato Bottle, soft
//   Still Waters (King, Possession)             a disc of still water spreading 6 m, tethers out to what it settles, its ripples laid flat
// and each reaction its action quietened on `art.react` (reactions.js): Kindness, Gallant (a ring of gold on the parry), Empath, Steady.
//
// Prior art: the kit's (Riot's tiers and ladder, FFT's reaction flash, Chrono Cross's colours); Super Mario Sunshine's skim and its
// rings on the water (Water Walk's footfalls); Okami's brush stilling water (Still Waters' laid ripples, Clover Studio, 2006).
//
//   CUPS_ART_EFFECTS   art.offering.use  art.offering.hold  art.tender.fire  art.wade.use  art.wade.hold  art.gallant.fire  art.wellUp.use
//                      art.empath.fire  art.stillWaters.use  art.steady.fire
// ---------------------------------------------------------------------------------------
import {
  RANK, own, weight, core, groundRing, rimRing, pool, lamp, skyColumn, starFall, mist, grains, sweepUp, shimmer, tether, spiralIn, haze, motesIn, sprites,
} from './kit.js';

const C = 'cups', { page: PAGE, knight: KNIGHT, queen: QUEEN, king: KING, whisper: HUSH } = RANK;
// (the cup: a short band of cells grown in at the feet, lit at its rim; and its liquid, a disc of ripples a hand under its lip)
const cup = (R, o) => own(C, R, { form: 'band', main: 'cells', tile: [6, 1], scroll: [0, 0.35], mask: 'noise', maskTile: [2, 1], maskScroll: [0.1, 0.3], scale: 0.3, stretch: [1, 1.05, 1],
  edgeV: [0.15, 0.25], rim: 0.6, core: 0.5, ...o });
const liquid = (R, o) => own(C, R, { form: 'disc', main: 'ripple', tile: [2, 1], scroll: [0.05, 0.4], scale: 0.28, offset: [0, 0.27, 0], core: 0.3, edgeV: [0, 0.2], ...o });
// (droplets: the suit's water thrown up and falling back)
const drops = (R, o) => sprites(R, { count: [10, 14], shape: 'drip', spawn: 'disc', r: 0.4, offset: [0, 0.1, 0], dir: 'cone', axis: 'up', cone: 40, speed: [2, 3.6], size: [0.06, 0.1], sizeEnd: 0.03,
  life: [0.5, 0.8], gravity: 9, floor: 'ground', color: 'white', colorEnd: 'suit' }, o);

export const CUPS_ART_EFFECTS = {
  // Offering (the Page of Cups; Manifestation): a cup of light set down at the feet, a calm ring spreading out to 6 m
  'art.offering.use': { layers: [
    // PRIMARY: the cup made: grown in from the ground (its erosion run backwards), lit at its rim
    cup(PAGE, { dur: 0.9, erode: [[0, 1], [0.3, 0.04], [0.75, 0.08], [1, 0.5]] }),
    // PRIMARY (its heart): the cup's liquid catching, warm for 0.1 s
    liquid(PAGE, { dur: 0.9, at: 0.15, erode: [[0, 0.4], [0.3, 0.05], [1, 0.5]] }),
    // SECONDARY: the calm ring spreading out to 6 m, soft
    groundRing(C, PAGE, { r: 6, dur: 1.1, main: 'ripple', tile: [6, 1], scroll: [0, 0.6], at: 0.12 }),
    // TERTIARY: droplets lifting off the cup, a faint pool on the ground round it
    drops(PAGE, { speed: [1, 2], count: [6, 8], at: 0.2 }), pool(C, PAGE, { r: 1, dur: 1.2, at: 0.1 }),
  ] },
  // Offering held (the calm's 4 s): the cup standing, its liquid stirring as creatures drink, a faint calm ring at its reach
  'art.offering.hold': { layers: [
    // PRIMARY: the cup standing, its rim breathing
    cup(PAGE, { hold: true, loop: 2.2, k: [[0, 0.75], [0.5, 1], [1, 0.75]], erode: 0.06 }),
    // SECONDARY: its liquid stirring, and the calm ring lying faint at 6 m
    liquid(PAGE, { hold: true, erode: 0.05 }), groundRing(C, PAGE, { hold: true, r: 6, main: 'ripple', tile: [6, 1], scroll: [0, 0.2], kmul: 0.35, erode: 0.2 }),
    // TERTIARY: motes drawn in to the cup (they drink)
    motesIn(PAGE, { rate: 6, dur: Infinity, r: 3, offset: [0, 0.5, 0], speed: [1.2, 2] }),
  ] },
  // Kindness (the Page of Cups' reaction): Offering quietened: a little calm ring at the feet, a drop lifting
  'art.tender.fire': { extends: 'art.react', layers: [
    // PRIMARY: a calm ring of ripples out to 1.5 m
    groundRing(C, HUSH, { r: 1.5, dur: 0.6, main: 'ripple', tile: [4, 1], kmul: 1.6 }),
    // SECONDARY: a few drops lifting off it
    drops(HUSH, { speed: [1, 2], count: [6, 8] }),
  ] },

  // Water Walk (the Knight of Cups; Alteration, held 5 s): the surface turned to a floor: a band up from the feet, a splash ring
  'art.wade.use': { layers: [
    // PRIMARY: a band swept up from the feet, the water's blue running cool across it
    sweepUp(C, KNIGHT, { r: 0.5, h: 1.6, dur: 0.6 }),
    // PRIMARY: a splash ring snapped out on the surface
    groundRing(C, KNIGHT, { r: 2, dur: 0.5, main: 'ripple', tile: [6, 1] }),
    // SECONDARY: droplets thrown up off it
    drops(KNIGHT, {}),
    // TERTIARY: a shimmer left round the body
    shimmer(C, KNIGHT, { r: 0.55, h: 1.6 }),
  ] },
  // Water Walk held: a ring at each footfall on the surface, a skim wake behind, spray off the heels
  'art.wade.hold': { layers: [
    // PRIMARY: the footfall's ring, thrown out and gone at every step (a loop of 0.42 s)
    own(C, KNIGHT, { hold: true, loop: 0.42, form: 'ring', main: 'ripple', tile: [5, 1], scroll: [0, 0.8], scale: [[0, 0.25], [1, 1.3]], offset: [0, 0.03, 0], edgeV: [0.6, 0.15],
      erode: [[0, 0.1], [0.6, 0.3], [1, 1]], rampShift: [[0, 0.15], [1, -0.25]] }),
    // SECONDARY: the skim's wake: a crescent of streaks trailing behind the heading
    own(C, KNIGHT, { hold: true, form: 'crescent', face: 'heading', rot: Math.PI, main: 'streaks', tile: [3, 1], scroll: [0, 1.2], mask: 'noise', maskTile: [2, 1], maskScroll: [0.3, 0],
      scale: 1.5, stretch: [0.6, 1, 1], offset: [0, 0.03, 0], erode: 0.15, kmul: 0.7 }),
    // TERTIARY: spray off the heels
    drops(KNIGHT, { rate: 14, dur: Infinity, r: 0.3, speed: [1, 2.2], cone: 50, life: [0.35, 0.55] }),
  ] },
  // Gallant (the Knight of Cups' reaction): a ring of gold on the parry: Water Walk's footfall ring stood up at the chest
  'art.gallant.fire': { extends: 'art.react', layers: [
    // PRIMARY: the footfall's ring in gold, stood up facing the view at the chest, thrown out
    own('gold', HUSH, { form: 'ring', face: 'camera', main: 'ripple', tile: [6, 1], scroll: [0, 1], scale: [[0, 0.2], [1, 1.1]], offset: [0, 1.15, 0], edgeV: [0.55, 0.12], dur: 0.4, kmul: 2 }),
    // SECONDARY: drops of gold flung off it
    drops(HUSH, { y: 1.1, dir: 'sphere', speed: [1.5, 3], color: 'gold', colorEnd: 'suit', count: [8, 10] }),
  ] },

  // Catch the Rain (the Queen of Cups; Ouranurgy): the sky poured down a thin column into the Lachrymato Bottle on the back; soft
  'art.wellUp.use': { layers: [
    // PRIMARY: the sky's column, thin, poured down onto the Bottle
    skyColumn(C, QUEEN, { r: 0.3, h: 8, y: 1.45, dur: 1.6, kmul: 1.8, g: 1.4 }),
    // PRIMARY: the rain falling down it
    sprites(QUEEN, { count: [18, 24], shape: 'drip', spawn: 'column', r: 0.22, height: 6, offset: [0, 2.2, 0], dir: 'up', speed: [-8, -5], size: [0.05, 0.09], sizeEnd: 0.03, life: [0.4, 0.7],
      stretch: 2, color: 'white', colorEnd: 'suit', delay: [0, 0.8] }),
    // SECONDARY: a ring drawn in round the Bottle as it fills
    own(C, QUEEN, { form: 'ring', main: 'ripple', tile: [5, 1], scroll: [0, -0.8], scale: [[0, 0.9], [1, 0.2]], offset: [0, 1.45, 0], edgeV: [0.1, 0.6], dur: 0.9, at: 0.3, kmul: 1.6 }),
    // TERTIARY: a cool mist at the feet and a few motes of the sky drifting down
    mist(QUEEN, { at: 0.4, alpha: 0.1, count: [3, 5] }), starFall(QUEEN, { r: 0.6, count: [8, 10], offset: [0, 2.4, 0] }),
  ] },
  // Empath (the Queen of Cups' reaction): Catch the Rain quietened: a thin stream of the sky falling to the chest
  'art.empath.fire': { extends: 'art.react', layers: [
    // PRIMARY: a thread of the sky's column falling to the chest
    skyColumn(C, HUSH, { r: 0.12, h: 3, y: 1.3, dur: 0.6, kmul: 1.5 }),
    // SECONDARY: a few drops down it
    sprites(HUSH, { count: [8, 10], shape: 'drip', spawn: 'column', r: 0.1, height: 2, offset: [0, 1.6, 0], dir: 'up', speed: [-6, -4], size: [0.05, 0.08], life: [0.3, 0.45], color: 'white', colorEnd: 'suit' }),
  ] },

  // Still Waters (the King of Cups; Possession): a disc of still water spreading 6 m, tethers reaching into what it settles, ripples laid flat
  'art.stillWaters.use': { layers: [
    // PRIMARY: the still water spreading to 6 m, its ripples laid flat as it goes
    pool(C, KING, { r: 6, dur: 1.6, kmul: 0.6, scroll: [0.01, 0.1] }),
    // PRIMARY: its front, a ring of ripples thrown out to 6 m
    groundRing(C, KING, { r: 6, dur: 0.9, main: 'ripple', tile: [8, 1], scroll: [0, 0.5] }),
    // PRIMARY (its heart): white at the chest for 0.1 s, held soft
    core(KING, { s: 1.2, y: 1.2 }),
    // SECONDARY: five tethers reaching out from the body into what it stills, their far ends fading
    ...[0, 1.26, 2.51, 3.77, 5.03].map((rot) => tether(C, KING, { len: 6, r: 0.05, y: 1, rot, scroll: [0, 2], dur: 1, at: 0.1, kmul: 0.7 })),
    // SECONDARY: a spiral drawn in round the body
    spiralIn(C, KING, { r: 1.2, h: 2.2, dur: 0.9 }),
    // TERTIARY: a haze breathing low, motes drawn in, a pale rim left at the reach
    haze(C, KING, { r: 3, dur: 1.8 }), motesIn(KING, { r: 4 }), rimRing(C, KING, { r: 6, dur: 1.8 }),
    // the screen's weight: a lamp, a soft wash of blue, the world held still a beat (no shake: it is a calm)
    lamp(KING, { k: 24, range: 10 }), ...weight(KING, { flash: 0.1, stop: 0.07 }),
  ] },
  // Steady (the King of Cups' reaction): Still Waters quietened: a small disc of still water at the feet
  'art.steady.fire': { extends: 'art.react', layers: [
    // PRIMARY: still water spreading 1.4 m at the feet
    pool(C, HUSH, { r: 1.4, dur: 0.8, kmul: 1.8 }),
    // TERTIARY: a few glints settling on it
    grains(HUSH, { r: 0.8, gravity: 0.4 }),
  ] },
};
