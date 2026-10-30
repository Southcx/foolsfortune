// ---------------------------------------------------------------------------------------
// THE COURTS OF PENTACLES' ARTS' LOOKS (matter: a Page studies, a Knight charges, a Queen keeps, a King commands): each art its domain's
// grammar (docs/plans/art/VFX-LIBRARY.md 2) in the suit's gold (ramp 'pentacles'), weighed by its rank (section 4), built from the class
// arts' kit (kit.js) and played by vfx/classartlooks.js on Petra's events (courier/classarts/body.js):
//   Prospect (Page, Divination)                  a ping thrown 30 m ahead, low and narrow; `.mark` a marker at the strongest source
//   Bulwark (Knight, Manifestation, held 3 s)    a braced shell of hard light with gold rims, spikes driven in at the feet
//   Harvest (Queen, Alteration)                  a ripening burst, leaves turning, gold motes rising, soft
//   Earth Wall (King, Manifestation, held 6 s)   the wall's light rising ahead, 4 m wide and 2.5 m high, spikes and dust, cracks
// and each reaction its action quietened on `art.react` (reactions.js): Thrift, Steadfast (armed: a gold ring at the feet; fired: Bulwark's
// shell in a whisper, the ward's pale), Hearth, Dividend.
//
// Prior art: the kit's (Riot's tiers and ladder, FFT's reaction flash, Chrono Cross's colours); a dowsing rod's ping and Zelda's Lens of
// Truth (Prospect); Monster Hunter's guard and Mantle shells (Bulwark, Capcom); Legend of Mana's Land Make, a thing made glowing from within
// (Square, 1999: Earth Wall and Bulwark's grown light).
//
//   PENTACLES_ART_EFFECTS   art.prospect.use  art.prospect.mark  art.thrift.fire  art.bulwark.use  art.bulwark.hold  art.steadfast.armed
//                           art.steadfast.fire  art.harvest.use  art.hearth.fire  art.stronghold.use  art.stronghold.hold  art.dividend.fire
// ---------------------------------------------------------------------------------------
import {
  RANK, own, weight, core, groundRing, rimRing, lamp, crystal, shardsIn, dust, grains, iris, blinkOut, specks, waveWall, chips, lineMotes, sweepUp, crescents, flakes,
  shimmer, sprites, inked,
} from './kit.js';

const P = 'pentacles', { page: PAGE, knight: KNIGHT, queen: QUEEN, king: KING, whisper: HUSH } = RANK;
// (Bulwark's shell: a band of hard light round the body, its cells crawling, lit at its rim; it covers most of what is behind it where it
// is lit, so it reads on the noon sand)
const shell = (R, o) => own(P, R, { form: 'band', main: 'cells', tile: [8, 3], scroll: [0.04, 0.12], mask: 'noise', maskK: 0.6, maskTile: [3, 2], maskScroll: [-0.05, 0.2],
  scale: 0.66, stretch: [1, 2.9, 1], edgeV: [0.04, 0.12], rim: 0.8, rimPow: 2, core: 0.3, back: 0.85, ...o });
// (its gold rims: a thin ring at its foot and one at its crown, inked under)
const rims = (R, o) => [0.04, 1.9].flatMap((y) => inked(own('gold', R, { form: 'ring', main: 'rays', tile: [20, 1], scroll: [0.15, 0], scale: y < 1 ? 0.74 : 0.7, offset: [0, y, 0], edgeV: [0.7, 0.15], ...o }), 0.5));
// (Earth Wall's light: a wave wall 2 m ahead, a third of a circle wide there (4 m), 2.5 m high, its cracks crawling)
const wall = (R, o) => own(P, R, { form: 'wave', main: 'cracks', mainK: 0.6, tile: [5, 2], scroll: [0, 0.2], mask: 'noise', maskTile: [3, 1], maskScroll: [0.05, 0.3], scale: 2,
  stretch: [1.15, 1.25, 1], edgeV: [0.04, 0.3], rim: 0.4, core: 0.5, ...o });

export const PENTACLES_ART_EFFECTS = {
  // Prospect (the Page of Pentacles; Divination): a ping thrown 30 m ahead, as the dowse does, low and narrow
  'art.prospect.use': { layers: [
    // PRIMARY: the ping's front racing 30 m ahead, a low arc of light along the ground
    waveWall(P, PAGE, { r: 30, h: 0.5, w: 0.55, dur: 1, main: 'noise', tile: [6, 1], scroll: [0, 0.6], edgeV: [0.02, 0.6] }),
    // PRIMARY: an iris opened at the hand
    iris(P, PAGE, { r: 0.3, y: 1.15, dur: 0.45 }),
    // SECONDARY: gold motes running the line to the source; star spots blinking out round the feet
    lineMotes(PAGE, { count: [14, 18], life: [0.4, 0.7] }), blinkOut(PAGE, { r: 2 }),
    // TERTIARY: specks hanging
    specks(PAGE, { r: 1.2, count: [10, 12] }),
  ] },
  // Prospect's mark: where the strongest Lachryma lies (played at the event's `at`): a thin pillar of gold, a ring, a glint
  'art.prospect.mark': { layers: [
    // PRIMARY: a thin pillar of gold standing on the source
    own(P, PAGE, { form: 'pillar', main: 'noise', tile: [2, 2], scroll: [0, 1.2], mask: 'streaks', maskK: 0.5, maskTile: [2, 2], maskScroll: [0, 0.8], scale: 3, stretch: [1.2, 1, 1.2], dur: 1.6, kmul: 1.5,
      erode: [[0, 0.3], [0.15, 0.04], [0.6, 0.1], [1, 1]] }),
    // SECONDARY: a ring laid round its foot, and its glint
    groundRing(P, PAGE, { r: 0.9, dur: 0.6 }), sprites(PAGE, { count: 2, shape: 'star4', offset: [0, 1.4, 0], dir: 'up', speed: 0.2, size: [0.35, 0.45], sizeEnd: 0, life: 0.4, color: 'white', colorEnd: 'gold' }),
    // TERTIARY: motes rising off the source
    grains(PAGE, { r: 0.4, gravity: -0.4 }),
  ] },
  // Thrift (the Page of Pentacles' reaction): Prospect quietened: a small ping ahead and the iris at the hand
  'art.thrift.fire': { extends: 'art.react', layers: [
    // PRIMARY: a ping thrown 2.5 m ahead
    waveWall(P, HUSH, { r: 2.5, h: 0.4, w: 0.55, dur: 0.45, main: 'noise', tile: [4, 1], kmul: 1.6 }),
    // SECONDARY: the iris at the hand
    iris(P, HUSH, { r: 0.25, y: 1.15, dur: 0.4, kmul: 1.6 }),
  ] },

  // Bulwark (the Knight of Pentacles; Manifestation, held 3 s): a braced shell of hard light with gold rims, spikes driven in at the feet
  'art.bulwark.use': { layers: [
    // PRIMARY: the shell made: grown in round the body (its erosion run backwards), lit at its rim
    shell(KNIGHT, { dur: 0.6, erode: [[0, 1], [0.25, 0.03], [0.7, 0.08], [1, 0.6]] }),
    // PRIMARY: its gold rims snapped on, at the foot and the crown
    rims(KNIGHT, { dur: 0.6, erode: [[0, 1], [0.2, 0.03], [1, 0.5]] }),
    // PRIMARY (its heart): white for 0.1 s as it braces
    core(KNIGHT, { s: 1.2, y: 1 }),
    // SECONDARY: spikes driven into the ground round the feet; shards drawn in to the shell and set
    crystal(P, KNIGHT, { r: 0.85, h: 0.5, dur: 0.6 }), shardsIn(KNIGHT, { r: 1.4 }),
    // TERTIARY: dust settling round the feet, a few gold grains
    dust(KNIGHT, { r: 0.8 }), grains(KNIGHT, {}),
  ] },
  // Bulwark held (braced): the shell of hard light, its cells crawling, the gold rims, a cap over the crown, glints running up it
  'art.bulwark.hold': { layers: [
    // PRIMARY: the shell, breathing
    shell(KNIGHT, { hold: true, loop: 1.4, k: [[0, 0.7], [0.5, 1], [1, 0.7]], erode: 0.06 }),
    // PRIMARY: the gold rims and a cap of hard light over the crown
    rims(KNIGHT, { hold: true, spin: 0.6 }),
    own(P, KNIGHT, { hold: true, form: 'dome', main: 'cells', tile: [6, 1], scroll: [0.05, 0.1], scale: 0.66, stretch: [1, 0.3, 1], offset: [0, 1.9, 0], rim: 0.7, kmul: 0.6, erode: 0.1 }),
    // SECONDARY: glints running up the shell
    sprites(KNIGHT, { rate: 6, dur: Infinity, shape: 'glint', spawn: 'ring', r: 0.66, offset: [0, 0.1, 0], dir: 'up', speed: [0.8, 1.6], size: [0.08, 0.14], sizeEnd: 0, life: [0.6, 1],
      color: 'white', colorEnd: 'gold', alpha: 0.8 }),
    // TERTIARY: a faint glow of gold on the ground under it
    own(P, KNIGHT, { hold: true, form: 'disc', main: 'cells', tile: [4, 1], scroll: [0.02, 0.1], scale: 0.9, offset: [0, 0.03, 0], core: 0, edgeV: [0, 0.5], erode: 0.15, rampShift: -0.15, g: 0.5 }),
  ] },
  // Steadfast (the Knight of Pentacles' reaction), armed: Bulwark's shell in a whisper: a gold ring at the feet, a low band of hard light
  'art.steadfast.armed': { layers: [
    // PRIMARY: the gold ring set in the ground at the feet
    own('gold', HUSH, { hold: true, form: 'ring', main: 'cells', tile: [12, 1], scroll: [0.06, 0], scale: 0.6, offset: [0, 0.03, 0], edgeV: [0.4, 0.3], spin: 0.4, kmul: 1.8, erode: 0.08 }),
    // SECONDARY: the shell's whisper: a low band of hard light at the ankles
    shell(HUSH, { hold: true, scale: 0.6, stretch: [1, 0.55, 1], edgeV: [0.05, 0.7], kmul: 0.8, erode: 0.12 }),
    // TERTIARY: a glint now and then climbing it
    sprites(HUSH, { rate: 3, dur: Infinity, shape: 'glint', spawn: 'ring', r: 0.6, offset: [0, 0.05, 0], dir: 'up', speed: [0.4, 0.8], size: [0.06, 0.1], sizeEnd: 0, life: [0.5, 0.8], color: 'gold' }),
  ] },
  // Steadfast fired (the blow turned aside: vessel.ward): Bulwark's shell flashed in a whisper, in the ward's pale
  'art.steadfast.fire': { extends: 'art.react', layers: [
    // PRIMARY: the shell flashed round the body in the ward's pale, eroding at once
    shell(HUSH, { ramp: 'tint', tint: 0xa8d4f4, dur: 0.45, kmul: 2, erode: [[0, 0], [0.3, 0.06], [1, 1]] }),
    // SECONDARY: the rims flashed gold
    rims(HUSH, { dur: 0.4, kmul: 2 }),
  ] },

  // Harvest (the Queen of Pentacles; Alteration): a ripening burst: a band of gold up the body, leaves turning, gold motes rising; soft
  'art.harvest.use': { layers: [
    // PRIMARY: the ripening: a band swept up the body, gold running cool across it
    sweepUp(P, QUEEN, { r: 0.7, h: 2, dur: 0.9 }),
    // SECONDARY: crescents turning round it; leaves turning colour as they fall
    crescents(P, QUEEN, { r: 1, y: 0.9, dur: 0.9 }), flakes(QUEEN, { shape: 'leaf', count: [14, 18] }),
    // TERTIARY: gold motes rising, a shimmer left
    sprites(QUEEN, { at: 0.15, count: [16, 20], shape: 'sparkle', spawn: 'disc', r: 1, offset: [0, 0.3, 0], dir: 'up', speed: [0.6, 1.6], size: [0.05, 0.1], sizeEnd: 0, life: [1, 1.6],
      drag: 0.6, color: 'gold', alpha: 0.9, twinkle: 5 }),
    shimmer(P, QUEEN, { r: 0.7 }),
  ] },
  // Hearth (the Queen of Pentacles' reaction): Harvest quietened: a faint band of gold and a few motes rising
  'art.hearth.fire': { extends: 'art.react', layers: [
    // PRIMARY: a faint band swept up the body
    sweepUp(P, HUSH, { r: 0.6, h: 1.6, dur: 0.6, kmul: 1.4 }),
    // TERTIARY: gold motes rising
    sprites(HUSH, { count: [8, 10], shape: 'sparkle', spawn: 'disc', r: 0.6, offset: [0, 0.4, 0], dir: 'up', speed: [0.5, 1.2], size: [0.05, 0.08], sizeEnd: 0, life: [0.8, 1.2], color: 'gold' }),
  ] },

  // Earth Wall (the King of Pentacles; Manifestation, held 6 s): the wall's light rising ahead (4 m wide, 2.5 m high), spikes and dust, cracks
  'art.stronghold.use': { layers: [
    // PRIMARY: the wall's light rising ahead out of the ground, grown in (its erosion run backwards), its cracks hot
    wall(KING, { dur: 1, stretch: [1.15, [[0, 0.1], [0.35, 1.25], [1, 1.25]], 1], erode: [[0, 0.6], [0.3, 0.03], [0.75, 0.1], [1, 1]] }),
    // PRIMARY: spikes erupting round the body as the ground answers
    crystal(P, KING, { r: 2.4, h: 1.1, dur: 0.9 }),
    // SECONDARY: cracks run out on the ground; chips thrown up toward the wall
    own(P, KING, { form: 'disc', main: 'cracks', tile: [5, 2], scroll: [0, 0.4], scale: [[0, 0.8], [0.3, 3], [1, 3.2]], offset: [0, 0.03, 0], edgeV: [0, 0.4], core: 0.4, dur: 1.2,
      erode: [[0, 0.2], [0.3, 0.06], [1, 1]] }),
    chips(KING, { dir: 'cone', axis: 'dir', cone: 45, lift: 0, speed: [3, 7], count: [14, 18] }),
    // TERTIARY: dust thrown up along the wall's foot, gold grains hanging
    dust(KING, { dir: 'cone', axis: 'dir', cone: 50, speed: [1, 3], count: [12, 16], r: 1.2 }), grains(KING, { r: 2 }),
    // the screen's weight: a lamp, a shake as the ground heaves, the world held a beat
    lamp(KING, { k: 26, range: 10 }), ...weight(KING, { shake: 0.32, stop: 0.04, flash: 0.08 }),
  ] },
  // Earth Wall held: the wall's light standing ahead, faint, dust drifting at its foot
  'art.stronghold.hold': { layers: [
    // PRIMARY: the wall's light, its cracks crawling slow
    wall(KING, { hold: true, kmul: 0.35, erode: 0.12 }),
    // SECONDARY: a seam of gold along its foot on the ground
    own(P, KING, { hold: true, form: 'wave', main: 'streaks', tile: [6, 1], scroll: [0.1, 0.6], scale: 2, stretch: [1.15, 0.08, 1], offset: [0, 0.02, 0], edgeV: [0.1, 0.4], kmul: 0.6 }),
    // TERTIARY: dust drifting off its foot
    dust(KING, { rate: 4, dur: Infinity, dir: 'cone', axis: 'dir', cone: 60, speed: [0.4, 1], r: 1.5, alpha: 0.25 }),
  ] },
  // Dividend (the King of Pentacles' reaction): Earth Wall quietened: small spikes grown in at the feet, a glint of gold
  'art.dividend.fire': { extends: 'art.react', layers: [
    // PRIMARY: a ring of small spikes grown in round the feet
    crystal(P, HUSH, { r: 0.7, h: 0.35, dur: 0.5, kmul: 1.6 }),
    // SECONDARY: gold glints off them
    sprites(HUSH, { count: [5, 6], shape: 'glint', spawn: 'ring', r: 0.6, offset: [0, 0.3, 0], dir: 'up', speed: [0.6, 1.2], size: [0.1, 0.16], sizeEnd: 0, life: [0.4, 0.6], color: 'gold' }),
  ] },
};
