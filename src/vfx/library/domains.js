// ---------------------------------------------------------------------------------------
// THE SEVEN DOMAINS' EFFECTS (docs/plans/art/VFX-LIBRARY.md section 2): a domain is a GRAMMAR, a form and a motion, so each of the seven
// is told from the others by its shape and the way it moves alone, in greyscale (Riot's silhouette test), and each wears its own glaze's
// ramp by name (vfx/shapes/ramps.js: never a feeling's hue). Four moments a domain:
//   domain.<id>.cast    the act, anticipation to dissipation, 1 to 2 real s         domain.<id>.hold   held (h.stop()): a channel or a ward, calm
//   domain.<id>.hit     where it lands on a thing, small, about 0.5 real s          domain.<id>.level  the domain's level-up at the Courier, the biggest
// The grammars:
//   ouranurgy       FALLS FROM ABOVE: a pillar called down out of the sky onto a ground ring, an armillary of graduated hoops turning at
//                   two tilts (each a ring in the camera's plane, squashed and opened as a hoop turning on its axis is seen), stars falling
//   manifestation   GROWS UP OUT OF THE GROUND: spikes and a cone crystallising in through their cells (erosion run backwards), shards
//                   drawn in to them, the kiln's orange flash as they set, dust settling
//   divination      THIN RINGS SWEPT OUT FLAT: sonar pings one after another, an iris narrowing then opening (its pupil tenmoku black with
//                   star spots, part alpha-over), a scan line climbing the body
//   psychokinesis   THROWN OUT: a shockwave wall pushed out all round (its front bright, its back dragging), lifted debris swirled and
//                   falling, a dust curtain, a pale rim left
//   possession      DRAWN IN: tethers reeled in, a spiral wound tight round the target, a shell closing over it, a collar tightening
//   alteration      A BAND SWEPT THROUGH ITS RAMP: a curtain rising with its leading edge white-hot and the flambe running red to purple to
//                   blue down its trail, crescents turning against each other, flakes changing colour as they fall
//   spellscription  WRITTEN: strokes of script flicked into the air, a circle drawn on the ground by a brush racing round it, a seal (the
//                   one square of the seven) stamped at its heart, a band of script at the chest, ink left on the ground (alpha-over)
// Each is built in the three tiers (vfx/library/kitdemo.js), commented layer by layer; every shape erodes through its pattern and cools
// down its ramp, scrolls its pattern if it lives past 0.2 real s, and has a white-hot heart of about 0.1 real s at its impact. Screen
// weight (a flash, a lamp, a shake) only on the level-ups, inside the budgets (vfx.js BUDGETS). Sprites take fixed colours from the
// domain's glaze (ui/domainlook.js) and its ramp's stops, so a domain's look never follows its caller's ctx.domain.
// Played by vfx/domainlooks.js (`game.domainLooks`): a level-up at the Courier, a god power's act beside its mark.
// Seen with: node scripts/vfxgallery.mjs --match domain.ouranurgy (--phone)
//
// Prior art, as a museum label:
//   Final Fantasy XII (Square Enix, 2006): the Quickening's rule that cost, level and spectacle rise together (each level-up the grammar's
//     whole set at once, with the screen's weight its casts never carry).
//   Vagrant Story (Square, 2000) and Parasite Eve (Square, 1998): the range sphere drawn before the act (Divination's lens and iris).
//   Terranigma (Quintet / Enix, 1995): Magirocks that turn back into stone after a cast (Manifestation's crystal crumbling into its grains).
//   Treasure of the Rudras (Square Osaka, 1996): a spell built from written words (Spellscription's strokes of the running hand).
//   Final Fantasy VII Remake (Square Enix, 2020; Takai): energy gathered, made visible, then emitting light (every anticipation is a pull-in).
//   Kingdom Hearts and Final Fantasy X's summons (Square, 2001 to 2002): the pillar of light called down on its spot (Ouranurgy).
//   Riot's VFX style guide for League of Legends (2017): primary, secondary, tertiary; importance by size, value and opacity.
//   Kevin Leroy (80.lv, 2017): the hit frame of 0.1 s, the fade order (the flare first, sparks next, the dots last).
//
//   DOMAIN_EFFECTS   'domain.<id>.cast' | '.hit' | '.level' (one-shots)   'domain.<id>.hold' (held: h.stop())
// ---------------------------------------------------------------------------------------
import { DOMAIN_LOOK } from '../../ui/domainlook.js';

const L = (o) => o; // (a layer: only for readability)
const hex = (d, k) => parseInt(DOMAIN_LOOK[d].colours[k].slice(1), 16);
// the sprites' colours: each domain's glaze (DOMAIN_LOOK) and its ramp's pale and deep stops (vfx/shapes/ramps.js RAMP_STOPS)
const O = { body: hex('ouranurgy', 'body'), hi: 0xd8eee6, star: 0xf4fbff };
const M = { body: hex('manifestation', 'body'), flash: hex('manifestation', 'accent'), deep: 0xa04a1e, dust: 0xcbb8a4 };
const D = { spot: hex('divination', 'accent'), edge: hex('divination', 'edge'), silver: 0xf2f0ff };
const P = { body: hex('psychokinesis', 'body'), hi: 0xd88a7a, pale: 0xf6e0d8, clay: [0x7a4a36, 0x9a5a40], dust: 0xc8b4a0 };
const Po = { body: hex('possession', 'body'), splash: hex('possession', 'accent'), hi: 0xbcc8e8 };
const A = { red: hex('alteration', 'body'), blue: hex('alteration', 'accent'), hi: 0xe88a7a };
const S = { body: hex('spellscription', 'body'), hi: 0x8aa4dc, white: hex('spellscription', 'ground'), ink: 0x1a3478 };

// the curves every one-shot shares
const OUT = [[0, 0], [0.45, 0.05], [1, 1]];                   // whole, then broken up through its pattern
const IN_OUT = [[0, 0.88], [0.16, 0.04], [0.7, 0.08], [1, 1]]; // grown in through its pattern (erosion run backwards), held, gone
const COOL = [[0, 0.22], [0.25, 0.06], [1, -0.36]];            // white-hot, its glaze, then dark and clear
const HOOP = [[0, 0.04], [0.6, 0.12], [1, 1]];                  // a thin hoop (its geometry the line), kept whole, then gone                   // a climbing band kept to its top edge (a scan line), then gone
const HELD = { dur: Infinity, in: 3, out: 2.5 };
/** The white-hot heart of an impact, in the domain's ramp (its hot end): about 0.1 real s, then cooled into the glaze and gone. */
const core = (ramp, at, scale = [[0, 0.3], [1, 0.9]], o = {}) => L({ type: 'shape', form: 'sphere', ramp, main: 'cells', tile: [2, 2], at, dur: 0.14, scale,
  rim: -0.6, glow: 2.6, core: 1, coreAt: 0.5, erode: [[0, 0], [1, 1]], rampShift: [[0, 0.6], [1, 0.1]], turn: 'random', ...o });
/** A hoop of the armillary: a graduated ring in the camera's plane at a tilt (`rot`), its squash (`sz`, a curve) a hoop turning on its axis. */
const hoop = (o) => L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'ouranurgy', main: 'rays', tile: [48, 1], mainK: 0.6, scroll: [0.2, 0],
  edgeV: [0.44, 0.44], glow: 1.9, core: 0.3, ...o, stretch: [1, 1, o.sz] });
/** A stroke written in the air (Spellscription): a crescent of the running hand stood along the caller's way (up, with none), turned about
 *  it by `rot`, flicked round and written in through its script (erosion run backwards), then gone. */
const stroke = (at, rot, s = 1.1) => L({ type: 'shape', form: 'crescent', face: 'dir', ramp: 'spellscription', main: 'script', tile: [3, 0.5], mainK: 0.6, scroll: [1.5, 0],
  at, dur: 0.55, scale: [[0, s * 0.45], [1, s]], offset: [0, 1.3, 0], rot, spin: 2.5, erode: [[0, 0.7], [0.25, 0.05], [0.6, 0.1], [1, 1]], rampShift: [[0, 0.25], [1, -0.3]], glow: 2, core: 0.5 });

export const DOMAIN_EFFECTS = {
  // =============================================================================================== OURANURGY (Ru celadon): falls from above
  // the sky's act: a ring closes, a pillar falls on the spot under two turning hoops, stars fall after it
  'domain.ouranurgy.cast': { layers: [
    // SECONDARY (anticipation): the ground ring closing on the spot, its graduations turning, warming as it closes, gone as the pillar lands
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [36, 1], scroll: [0.25, 0], dur: 0.28, scale: [[0, 2.8], [1, 1.1]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.2], erode: [[0, 0.3], [0.35, 0.04], [0.8, 0.1], [1, 1]], rampShift: [[0, -0.1], [1, 0.2]], glow: 1.8, turn: 'random' }),
    // PRIMARY: the pillar called down out of the sky (a column grown downward from 7 m), its falling end bright, its streaks streaming down;
    // it lands at 0.2 s and erodes from its sky end
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'streaks', tile: [3, 2], scroll: [0, 2.4], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.9], at: 0.06, dur: 0.85,
      offset: [0, 7, 0], stretch: [3.4, [[0, -0.4], [0.17, -7], [1, -7]], 3.4], edgeV: [0.55, 0.02], rim: -0.45, erode: [[0, 0], [0.3, 0.03], [1, 1]],
      rampShift: [[0, 0.3], [0.25, 0.08], [1, -0.4]], glow: 2.4, core: 0.8, turn: 'random' }),
    // PRIMARY (its heart): white-hot where it lands, flattened on the ground
    core('ouranurgy', 0.2, [[0, 0.4], [1, 1.2]], { offset: [0, 0.25, 0], stretch: [1, 0.55, 1] }),
    // SECONDARY: the ring knocked out along the ground where it lands, graduated like an astrolabe's limb, turning as it goes
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [36, 1], scroll: [0.35, 0], mask: 'noise', maskTile: [3, 1], maskScroll: [0.1, 0.3], at: 0.2, dur: 0.65,
      scale: [[0, 1.1], [1, 3.6]], offset: [0, 0.03, 0], edgeV: [0.55, 0.12], erode: OUT, rampShift: COOL, glow: 2.1, turn: 'random' }),
    // SECONDARY: the armillary: two graduated hoops at two tilts over the spot, each turning on its axis, grown in and eroded out
    hoop({ at: 0.04, dur: 1.25, scale: 1.25, offset: [0, 1.5, 0], rot: 0.5, sz: [[0, 0.9], [0.3, 0.2], [0.6, 0.85], [1, 0.25]], erode: [[0, 0.5], [0.15, 0.04], [0.6, 0.08], [1, 1]], rampShift: [[0, 0.1], [1, -0.35]] }),
    hoop({ at: 0.08, dur: 1.2, scale: 0.95, offset: [0, 1.5, 0], rot: -0.85, scroll: [-0.3, 0], sz: [[0, 0.2], [0.3, 0.9], [0.6, 0.25], [1, 0.8]], erode: [[0, 0.5], [0.15, 0.04], [0.6, 0.08], [1, 1]], rampShift: [[0, 0.1], [1, -0.35]] }),
    // TERTIARY: star motes falling slow through where it stood
    L({ type: 'sprites', at: 0.18, count: [16, 22], shape: 'star4', spawn: 'column', r: 1.5, height: 3.4, offset: [0, 0.4, 0], dir: 'up', speed: [-0.55, -0.2], drag: 0.3,
      size: [0.07, 0.13], sizeEnd: 0.02, life: [1, 1.6], color: O.star, colorEnd: O.body, alpha: 0.9, twinkle: 5 }),
    // TERTIARY: a cool column of mist left standing on the spot, drifting down and thinning
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'noise', tile: [2, 1], scroll: [0.04, -0.3], mask: 'noise', maskTile: [3, 2], maskScroll: [-0.03, -0.15], flow: 'noise', flowK: 0.06,
      at: 0.18, dur: 1.3, stretch: [8, [[0, 3], [0.3, 4.6], [1, 5]], 8], edgeV: [0.08, 0.6], rim: -0.8, erode: [[0, 0.35], [0.3, 0.22], [1, 1]],
      rampShift: [[0, -0.12], [1, -0.4]], glow: 0.9, core: 0, k: [[0, 0], [0.2, 0.7], [1, 0.7]], turn: 'random' }),
  ] },
  // held: the armillary turning over a graduated ground ring, stars falling through a cool column
  'domain.ouranurgy.hold': { layers: [
    // PRIMARY: the armillary over the spot: two graduated hoops at two tilts, each turning on its axis on a six-second loop, out of step
    hoop({ ...HELD, loop: 6, scale: 1.2, offset: [0, 1.45, 0], rot: 0.5, scroll: [0.08, 0], mainK: 0.55, glow: 1.6, erode: 0.06, sz: [[0, 1], [0.25, 0.18], [0.5, 1], [0.75, 0.18], [1, 1]] }),
    hoop({ ...HELD, loop: 6, scale: 0.92, offset: [0, 1.45, 0], rot: -0.9, scroll: [-0.1, 0], mainK: 0.55, glow: 1.5, erode: 0.06, sz: [[0, 0.18], [0.25, 1], [0.5, 0.18], [0.75, 1], [1, 0.18]] }),
    // SECONDARY: the ground ring, its limb turning slowly
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [36, 1], scroll: [0.04, 0], mask: 'noise', maskTile: [2, 1], maskScroll: [0.03, 0.1], ...HELD, scale: 1.35, offset: [0, 0.03, 0],
      spin: 0.2, edgeV: [0.5, 0.2], erode: 0.12, glow: 1.4, core: 0.2 }),
    // TERTIARY: star motes falling through the column
    L({ type: 'sprites', rate: 7, dur: Infinity, shape: 'star4', spawn: 'column', r: 1.2, height: 2.6, offset: [0, 0.8, 0], dir: 'up', speed: [-0.35, -0.15], size: [0.05, 0.09], sizeEnd: 0.01,
      life: [1.2, 1.8], color: O.star, colorEnd: O.body, alpha: 0.8, twinkle: 4 }),
    // TERTIARY: the cool column of mist, faint, drifting down
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'noise', tile: [2, 1], scroll: [0.03, -0.18], mask: 'noise', maskTile: [3, 2], maskScroll: [-0.02, -0.1], ...HELD, stretch: [7, 3.4, 7],
      edgeV: [0.12, 0.6], rim: -0.85, erode: 0.28, rampShift: -0.25, glow: 0.7, core: 0, k: 0.55 }),
  ] },
  // a thin shaft dropped on the point, a graduated ring knocked out and one hoop turning
  'domain.ouranurgy.hit': { layers: [
    // PRIMARY: a thin shaft dropped onto the point from above, its end bright, landing at 0.1 s
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'streaks', tile: [2, 1], scroll: [0, 3], dur: 0.42, offset: [0, 2.4, 0], stretch: [1.8, [[0, -0.2], [0.24, -2.4], [1, -2.4]], 1.8],
      edgeV: [0.55, 0.02], rim: -0.45, erode: [[0, 0], [0.35, 0.04], [1, 1]], rampShift: COOL, glow: 2.3, core: 0.8, turn: 'random' }),
    // PRIMARY (its heart)
    core('ouranurgy', 0.09, [[0, 0.25], [1, 0.6]]),
    // SECONDARY: a graduated ring knocked out round the point
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [24, 1], scroll: [0.4, 0], at: 0.09, dur: 0.4, scale: [[0, 0.4], [1, 1.5]], edgeV: [0.55, 0.12], erode: OUT, rampShift: COOL, glow: 2, turn: 'random' }),
    // SECONDARY: one hoop turning over it
    hoop({ at: 0.05, dur: 0.45, scale: [[0, 0.5], [1, 0.8]], offset: [0, 0.5, 0], rot: 0.6, sz: [[0, 1], [0.5, 0.2], [1, 0.7]], erode: [[0, 0.2], [0.2, 0.04], [1, 1]], rampShift: COOL }),
    // TERTIARY: a few star motes falling
    L({ type: 'sprites', at: 0.1, count: [6, 9], shape: 'star4', spawn: 'sphere', r: 0.5, offset: [0, 0.6, 0], dir: 'up', speed: [-0.5, -0.2], size: [0.05, 0.09], sizeEnd: 0, life: [0.5, 0.8], color: O.star, colorEnd: O.body, twinkle: 5 }),
  ] },
  // the level-up: a pillar from twelve metres, three hoops opening out round the Courier, the sky laid at the feet
  'domain.ouranurgy.level': { layers: [
    // SECONDARY (anticipation): a wide ring closing on the Courier as the sky gathers
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [48, 1], scroll: [0.3, 0], dur: 0.36, scale: [[0, 4], [1, 1.3]], offset: [0, 0.03, 0], edgeV: [0.5, 0.2],
      erode: [[0, 0.3], [0.4, 0.04], [0.85, 0.1], [1, 1]], rampShift: [[0, -0.1], [1, 0.22]], glow: 2, turn: 'random' }),
    // PRIMARY: the pillar called down on the Courier from twelve metres up, wider than they are, landing at 0.3 s
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'streaks', tile: [4, 3], scroll: [0, 2.6], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.8], at: 0.06, dur: 1.2,
      offset: [0, 12, 0], stretch: [5.5, [[0, -0.5], [0.2, -12], [1, -12]], 5.5], edgeV: [0.5, 0.02], rim: -0.4, erode: [[0, 0], [0.3, 0.03], [1, 1]],
      rampShift: [[0, 0.32], [0.25, 0.1], [1, -0.42]], glow: 2.6, core: 0.85, turn: 'random' }),
    // PRIMARY (its heart): white-hot where it lands
    core('ouranurgy', 0.3, [[0, 0.6], [1, 1.8]], { offset: [0, 0.6, 0], stretch: [1, 0.7, 1], dur: 0.16 }),
    // PRIMARY: the armillary opening out round the Courier: three graduated hoops at three tilts, turning
    hoop({ at: 0.1, dur: 1.9, scale: [[0, 0.6], [0.25, 1.9], [1, 2.1]], offset: [0, 1.1, 0], rot: 0.45, sz: [[0, 1], [0.25, 0.2], [0.5, 0.9], [0.75, 0.2], [1, 0.8]], erode: [[0, 0.4], [0.18, 0.04], [0.65, 0.08], [1, 1]], rampShift: [[0, 0.15], [1, -0.35]], glow: 2.1 }),
    hoop({ at: 0.14, dur: 1.85, scale: [[0, 0.5], [0.25, 1.5], [1, 1.65]], offset: [0, 1.1, 0], rot: -0.8, scroll: [-0.3, 0], sz: [[0, 0.2], [0.25, 0.9], [0.5, 0.2], [0.75, 0.9], [1, 0.3]], erode: [[0, 0.4], [0.18, 0.04], [0.65, 0.08], [1, 1]], rampShift: [[0, 0.15], [1, -0.35]] }),
    hoop({ at: 0.18, dur: 1.8, scale: [[0, 0.4], [0.25, 1.15], [1, 1.25]], offset: [0, 1.1, 0], rot: 1.6, scroll: [0.4, 0], sz: [[0, 0.6], [0.3, 1], [0.6, 0.15], [1, 0.7]], erode: [[0, 0.4], [0.18, 0.04], [0.65, 0.08], [1, 1]], rampShift: [[0, 0.15], [1, -0.35]] }),
    // SECONDARY: the ring knocked out along the ground, graduated
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [48, 1], scroll: [0.4, 0], mask: 'noise', maskTile: [3, 1], maskScroll: [0.1, 0.3], at: 0.3, dur: 0.8,
      scale: [[0, 1.3], [1, 5.2]], offset: [0, 0.03, 0], edgeV: [0.55, 0.12], erode: OUT, rampShift: COOL, glow: 2.2, turn: 'random' }),
    // SECONDARY: the screen's weight: a pale celadon flash, a lamp in the column, the ground's small shake
    L({ type: 'flash', at: 0.3, color: O.hi, k: 0.22, dur: 0.5 }),
    L({ type: 'light', at: 0.3, color: O.body, k: 28, range: 9, dur: 1.3, hold: 0.25, up: 1.5 }),
    L({ type: 'shake', at: 0.3, k: 0.12 }),
    // TERTIARY: the sky laid at the Courier's feet: a disc of stars on the ground, turning slowly, fading
    L({ type: 'shape', form: 'disc', ramp: 'ouranurgy', main: 'stars', tile: [3, 2], scroll: [0.03, 0.05], at: 0.3, dur: 1.9, scale: 2.6, offset: [0, 0.02, 0], spin: 0.15,
      erode: [[0, 0.2], [0.5, 0.25], [1, 1]], rampShift: [[0, 0.05], [1, -0.3]], glow: 1.4, core: 0.3, k: [[0, 0], [0.15, 0.9], [1, 0.9]], turn: 'random' }),
    // TERTIARY: star motes falling slow all round, and the cool column of mist
    L({ type: 'sprites', at: 0.28, count: [30, 36], shape: 'star4', spawn: 'column', r: 2.4, height: 4.5, offset: [0, 0.4, 0], dir: 'up', speed: [-0.6, -0.2], drag: 0.3,
      size: [0.07, 0.14], sizeEnd: 0.02, life: [1.4, 2.2], color: O.star, colorEnd: O.body, alpha: 0.9, twinkle: 5 }),
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'noise', tile: [2, 1], scroll: [0.04, -0.3], mask: 'noise', maskTile: [3, 2], maskScroll: [-0.03, -0.15], flow: 'noise', flowK: 0.06,
      at: 0.3, dur: 1.9, stretch: [12, [[0, 4], [0.3, 6], [1, 6.5]], 12], edgeV: [0.08, 0.6], rim: -0.8, erode: [[0, 0.35], [0.3, 0.22], [1, 1]],
      rampShift: [[0, -0.12], [1, -0.4]], glow: 0.9, core: 0, k: [[0, 0], [0.2, 0.7], [1, 0.7]], turn: 'random' }),
  ] },

  // =============================================================================================== MANIFESTATION (fire-flashed shino): grows up out of the ground
  // made: shards drawn in, spikes and a cone crystallising up out of the ground, the kiln's orange flash, dust settling
  'domain.manifestation.cast': { layers: [
    // SECONDARY (anticipation): shards drawn in along the ground to the spot, cream turning to the flash's orange as they arrive at 0.25 s
    L({ type: 'sprites', count: [12, 16], shape: 'shard', spawn: 'ring', r: 2.2, offset: [0, 0.15, 0], dir: 'in', speed: [7.5, 9], life: [0.24, 0.28], size: [0.12, 0.2], sizeEnd: 0.06,
      stretch: 1.2, color: M.body, colorEnd: M.flash }),
    // SECONDARY (anticipation): the ground gathering where it will rise: a disc of cells drawn to its middle, grown in through them
    L({ type: 'shape', form: 'disc', ramp: 'manifestation', main: 'cells', tile: [4, 1], scroll: [0, -0.6], dur: 0.4, scale: 1.3, offset: [0, 0.02, 0], erode: [[0, 0.9], [0.55, 0.15], [1, 1]],
      rampShift: [[0, -0.1], [0.6, 0.1], [1, -0.2]], glow: 1.4, core: 0, turn: 'random' }),
    // PRIMARY: the spikes crystallising up out of the ground: grown in through their cells, springing past their height and settling, then
    // fired (the ramp cools from white through the shino's cream to its flashed orange) and crumbling
    L({ type: 'shape', form: 'spikes', ramp: 'manifestation', main: 'cells', tile: [2, 3], scroll: [0, 0.12], mask: 'cracks', maskK: 0.35, maskTile: [2, 2], at: 0.22, dur: 1.25,
      scale: 1.1, stretch: [1, [[0, 0.05], [0.16, 1.55], [0.3, 1.3], [1, 1.3]], 1], erode: IN_OUT, rampShift: [[0, 0.4], [0.18, 0.14], [0.6, 0], [1, -0.36]], rim: 0.3, glow: 2.2, core: 0.7, turn: 'random' }),
    // PRIMARY: the cone at their heart, rising higher
    L({ type: 'shape', form: 'cone', ramp: 'manifestation', main: 'cells', tile: [6, 3], scroll: [0, 0.1], at: 0.24, dur: 1.2, scale: 0.65, stretch: [1, [[0, 0.05], [0.18, 2.6], [0.32, 2.3], [1, 2.3]], 1],
      erode: IN_OUT, rampShift: [[0, 0.4], [0.18, 0.14], [0.6, 0], [1, -0.36]], rim: 0.4, glow: 2.3, core: 0.75, turn: 'random' }),
    // PRIMARY (its heart)
    core('manifestation', 0.24, [[0, 0.35], [1, 1]], { offset: [0, 0.35, 0] }),
    // SECONDARY: the firing's flash: a ring of shino orange thrown out along the ground as it sets
    L({ type: 'shape', form: 'ring', ramp: 'manifestation', main: 'noise', tile: [6, 1], scroll: [0, 1.2], at: 0.26, dur: 0.5, scale: [[0, 0.5], [1, 2.7]], offset: [0, 0.03, 0], edgeV: [0.5, 0.15],
      erode: OUT, rampShift: [[0, -0.3], [1, -0.5]], glow: 2.2, turn: 'random' }),
    // SECONDARY: the set shards: glints held a beat on its facets, and a few chips of crystal thrown off and falling
    L({ type: 'sprites', at: 0.32, count: [6, 9], shape: 'glint', spawn: 'sphere', r: 0.9, offset: [0, 0.9, 0], speed: 0, life: [0.4, 0.6], size: [0.3, 0.45], sizeEnd: 0, color: 0xfff8ee }),
    L({ type: 'sprites', at: 0.25, count: [8, 10], shape: 'facet', spawn: 'sphere', r: 0.5, offset: [0, 0.7, 0], dir: 'out', speed: [0.6, 1.4], drag: 3, gravity: 1.2, life: [0.7, 1], size: [0.1, 0.16],
      sizeEnd: 0.05, color: M.body, colorEnd: M.flash, spin: [-3, 3], floor: 'ground' }),
    // TERTIARY: dust off the ground settling round it
    L({ type: 'sprites', pool: 'alpha', at: 0.24, count: [8, 12], shape: 'puff', spawn: 'disc', r: 1, dir: 'out', lift: 0.4, speed: [0.8, 1.6], drag: 2.5, gravity: 0.4, life: [1, 1.5],
      size: [0.4, 0.6], sizeEnd: 1.2, color: M.dust, alpha: 0.4, spin: [-1, 1] }),
    // TERTIARY: a few grains still glowing in the flash's orange, settling
    L({ type: 'sprites', at: 0.4, count: [10, 14], shape: 'soft', spawn: 'disc', r: 1.4, dir: 'up', speed: [0.2, 0.6], gravity: 0.5, drag: 0.5, life: [1.1, 1.7], size: [0.04, 0.07], sizeEnd: 0.02,
      color: M.flash, colorEnd: M.deep, floor: 'ground', twinkle: 3 }),
  ] },
  // held: a low stand of crystal breathing, shards orbiting it, grains rising and settling
  'domain.manifestation.hold': { layers: [
    // PRIMARY: a low stand of crystal, breathing through its cells on a four-second loop (it never quite crumbles)
    L({ type: 'shape', form: 'spikes', ramp: 'manifestation', main: 'cells', tile: [2, 3], scroll: [0, 0.06], mask: 'noise', maskK: 0.5, maskScroll: [0.02, 0.1], ...HELD, loop: 4, scale: 0.85,
      stretch: [1, 0.75, 1], erode: [[0, 0.18], [0.5, 0.06], [1, 0.18]], rampShift: [[0, -0.05], [0.5, 0.06], [1, -0.05]], rim: 0.3, glow: 1.4, core: 0.4, in: 2, out: 2 }),
    // SECONDARY: shards orbiting the stand slowly, set and glinting
    L({ type: 'sprites', rate: 3, dur: Infinity, shape: 'facet', spawn: 'ring', r: 0.95, offset: [0, 0.25, 0], dir: 'swirl', lift: 0.25, speed: [0.3, 0.5], drag: 0.2, life: [1.6, 2.2],
      size: [0.08, 0.12], sizeEnd: 0.04, color: M.body, colorEnd: M.flash, spin: [-2, 2] }),
    // SECONDARY: the ground fired under it: a disc of cells in the shino's orange, slow
    L({ type: 'shape', form: 'disc', ramp: 'manifestation', main: 'cells', tile: [4, 1], scroll: [0.02, 0.08], ...HELD, scale: 1.3, offset: [0, 0.02, 0], erode: 0.15, rampShift: -0.25, glow: 0.9, core: 0 }),
    // TERTIARY: grains rising and settling round it
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'soft', spawn: 'disc', r: 1.1, dir: 'up', speed: [0.2, 0.5], gravity: 0.25, life: [1.2, 1.8], size: [0.03, 0.06], sizeEnd: 0.01,
      color: M.flash, colorEnd: M.deep, alpha: 0.8, twinkle: 3 }),
    // TERTIARY: a little dust at its foot
    L({ type: 'sprites', pool: 'alpha', rate: 1.5, dur: Infinity, shape: 'puff', spawn: 'disc', r: 0.9, dir: 'out', speed: [0.2, 0.4], life: [1.2, 1.6], size: [0.3, 0.45], sizeEnd: 0.9,
      color: M.dust, alpha: 0.18, spin: [-0.6, 0.6] }),
  ] },
  // a cluster of crystal punched out of the struck point along the blow
  'domain.manifestation.hit': { layers: [
    // SECONDARY (anticipation): a few shards drawn in to the point a beat before it sets
    L({ type: 'sprites', count: [5, 7], shape: 'shard', spawn: 'shell', r: 0.8, dir: 'in', speed: [7, 8], life: [0.1, 0.12], size: [0.08, 0.12], sizeEnd: 0.04, stretch: 1, color: M.body, colorEnd: M.flash }),
    // PRIMARY: a cluster of crystal punched out of the struck point along the blow (up, with none), springing out and crumbling
    L({ type: 'shape', form: 'spikes', face: 'dir', ramp: 'manifestation', main: 'cells', tile: [2, 2], scroll: [0, 0.2], at: 0.08, dur: 0.48, scale: 0.42,
      stretch: [1, [[0, 0.05], [0.22, 1.5], [0.4, 1.25], [1, 1.25]], 1], erode: [[0, 0.85], [0.2, 0.04], [0.55, 0.1], [1, 1]], rampShift: [[0, 0.4], [0.25, 0.1], [1, -0.36]], glow: 2.3, core: 0.8, turn: 'random' }),
    // PRIMARY (its heart)
    core('manifestation', 0.08, [[0, 0.2], [1, 0.55]]),
    // SECONDARY: the firing's orange ring round the point
    L({ type: 'shape', form: 'ring', face: 'dir', ramp: 'manifestation', main: 'noise', tile: [6, 1], scroll: [0, 1.4], at: 0.1, dur: 0.35, scale: [[0, 0.3], [1, 1.2]], edgeV: [0.5, 0.15],
      erode: OUT, rampShift: [[0, -0.3], [1, -0.5]], glow: 2.1, turn: 'random' }),
    // TERTIARY: grains glowing orange, falling
    L({ type: 'sprites', at: 0.1, count: [6, 8], shape: 'soft', spawn: 'sphere', r: 0.3, dir: 'cone', cone: 60, speed: [0.8, 1.8], gravity: 3, drag: 1, life: [0.4, 0.6], size: [0.04, 0.07],
      sizeEnd: 0.02, color: M.flash, colorEnd: M.deep, floor: 'ground' }),
  ] },
  // the level-up: two rings of crystal crystallising up round the Courier and fired in the kiln's orange
  'domain.manifestation.level': { layers: [
    // SECONDARY (anticipation): shards drawn in from four metres to the Courier's feet, and the ground gathering under them
    L({ type: 'sprites', count: [22, 28], shape: 'shard', spawn: 'ring', r: 3.6, offset: [0, 0.2, 0], dir: 'in', speed: [10, 12], life: [0.3, 0.34], size: [0.14, 0.22], sizeEnd: 0.06,
      stretch: 1.4, color: M.body, colorEnd: M.flash }),
    L({ type: 'shape', form: 'disc', ramp: 'manifestation', main: 'cells', tile: [5, 1], scroll: [0, -0.7], dur: 0.5, scale: 2.2, offset: [0, 0.02, 0], erode: [[0, 0.9], [0.55, 0.15], [1, 1]],
      rampShift: [[0, -0.1], [0.6, 0.12], [1, -0.2]], glow: 1.5, core: 0, turn: 'random' }),
    // PRIMARY: a ring of crystal crystallising up round the Courier, grown in through its cells, past its height and settled, then fired and crumbling
    L({ type: 'shape', form: 'spikes', ramp: 'manifestation', main: 'cells', tile: [2, 3], scroll: [0, 0.12], mask: 'cracks', maskK: 0.35, maskTile: [2, 2], at: 0.3, dur: 1.7,
      scale: 2.2, stretch: [1, [[0, 0.05], [0.12, 1.6], [0.24, 1.35], [1, 1.35]], 1], erode: [[0, 0.88], [0.12, 0.04], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.4], [0.14, 0.14], [0.6, 0], [1, -0.36]], rim: 0.3, glow: 2.3, core: 0.7, turn: 'random' }),
    // PRIMARY: an inner ring, smaller and taller, turned against the first
    L({ type: 'shape', form: 'spikes', ramp: 'manifestation', main: 'cells', tile: [2, 3], scroll: [0, 0.15], mask: 'cracks', maskK: 0.35, maskTile: [2, 2], at: 0.34, dur: 1.6,
      scale: 1.35, stretch: [1, [[0, 0.05], [0.14, 2.2], [0.26, 1.9], [1, 1.9]], 1], erode: [[0, 0.88], [0.14, 0.04], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.4], [0.16, 0.14], [0.6, 0], [1, -0.36]], rim: 0.3, glow: 2.2, core: 0.7, turn: 'random' }),
    // PRIMARY (its heart)
    core('manifestation', 0.3, [[0, 0.6], [1, 1.6]], { offset: [0, 0.5, 0], dur: 0.16 }),
    // SECONDARY: the firing: a ring of shino orange out along the ground, a second behind it
    L({ type: 'shape', form: 'ring', ramp: 'manifestation', main: 'noise', tile: [8, 1], scroll: [0, 1.2], at: 0.32, dur: 0.7, scale: [[0, 1], [1, 4.6]], offset: [0, 0.03, 0], edgeV: [0.5, 0.15],
      erode: OUT, rampShift: [[0, -0.3], [1, -0.5]], glow: 2.3, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'manifestation', main: 'cells', tile: [10, 1], scroll: [0, 0.8], at: 0.45, dur: 0.8, scale: [[0, 0.8], [1, 3.4]], offset: [0, 0.03, 0], edgeV: [0.6, 0.15],
      erode: OUT, rampShift: [[0, -0.2], [1, -0.5]], glow: 1.8, turn: 'random' }),
    // SECONDARY: the screen's weight: the kiln's flash of orange, a lamp low in the crystal, a small shake as it breaks the ground
    L({ type: 'flash', at: 0.3, color: M.flash, k: 0.2, dur: 0.5 }),
    L({ type: 'light', at: 0.3, color: M.flash, k: 30, range: 8, dur: 1.4, hold: 0.2, up: 0.8 }),
    L({ type: 'shake', at: 0.3, k: 0.14 }),
    // SECONDARY: glints held on the crystal's facets, chips thrown off it
    L({ type: 'sprites', at: 0.45, count: [10, 14], shape: 'glint', spawn: 'sphere', r: 2, offset: [0, 1.3, 0], speed: 0, life: [0.5, 0.8], size: [0.35, 0.55], sizeEnd: 0, color: 0xfff8ee }),
    L({ type: 'sprites', at: 0.32, count: [14, 18], shape: 'facet', spawn: 'ring', r: 1.5, offset: [0, 0.8, 0], dir: 'out', lift: 0.6, speed: [1.2, 2.4], drag: 2, gravity: 2.5, life: [0.9, 1.3],
      size: [0.12, 0.2], sizeEnd: 0.05, color: M.body, colorEnd: M.flash, spin: [-3, 3], floor: 'ground' }),
    // TERTIARY: dust settling round it, grains still glowing in the orange
    L({ type: 'sprites', pool: 'alpha', at: 0.3, count: [14, 18], shape: 'puff', spawn: 'disc', r: 2, dir: 'out', lift: 0.4, speed: [0.8, 1.8], drag: 2.5, gravity: 0.4, life: [1.2, 1.8],
      size: [0.5, 0.75], sizeEnd: 1.5, color: M.dust, alpha: 0.38, spin: [-1, 1] }),
    L({ type: 'sprites', at: 0.5, count: [20, 26], shape: 'soft', spawn: 'disc', r: 2.4, dir: 'up', speed: [0.2, 0.7], gravity: 0.5, drag: 0.5, life: [1.3, 2], size: [0.04, 0.08], sizeEnd: 0.02,
      color: M.flash, colorEnd: M.deep, floor: 'ground', twinkle: 3 }),
  ] },

  // =============================================================================================== DIVINATION (yohen tenmoku): thin rings swept out flat
  // seeing: thin sonar rings swept out flat, an iris narrowing then opening, a scan line climbing
  'domain.divination.cast': { layers: [
    // PRIMARY: the sonar: three thin rings swept out flat along the ground one after another, each front white-hot, each fainter
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [8, 1], scroll: [0.3, 0], at: 0.12, dur: 0.75, scale: [[0, 0.3], [1, 5]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.25], [1, -0.3]], glow: 2.3, core: 0.9, coreAt: 0.85, turn: 'random' }),
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [8, 1], scroll: [0.3, 0], at: 0.3, dur: 0.75, scale: [[0, 0.3], [1, 4.4]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.2], [1, -0.3]], glow: 2, core: 0.8, coreAt: 0.85, kmul: 0.75, turn: 'random' }),
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [8, 1], scroll: [0.3, 0], at: 0.48, dur: 0.75, scale: [[0, 0.3], [1, 3.8]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.15], [1, -0.3]], glow: 1.8, core: 0.7, coreAt: 0.85, kmul: 0.5, turn: 'random' }),
    // PRIMARY (its heart): the ping's white point
    core('divination', 0.12, [[0, 0.15], [1, 0.5]], { offset: [0, 0.08, 0], stretch: [1, 0.35, 1] }),
    // SECONDARY: the iris at eye height, in the camera's plane: a ring of fibres (its rays) narrowing a beat, then opening wide
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'divination', main: 'rays', tile: [40, 1], scroll: [0, 0.3], mask: 'noise', maskK: 0.4, maskTile: [3, 1], dur: 0.95,
      scale: [[0, 0.6], [0.13, 0.22], [1, 1.5]], offset: [0, 1.55, 0], edgeV: [0.15, 0.45], erode: [[0, 0.2], [0.12, 0.03], [0.55, 0.07], [1, 1]], rampShift: COOL, glow: 2, core: 0.6, turn: 'random' }),
    // SECONDARY: its pupil, tenmoku black with its star spots (part alpha-over: the dark shows on a bright ground), opening with it
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'ink', add: 0, main: 'stars', mainK: 0.3, tile: [2, 2], scroll: [0.02, 0.05], dur: 0.95,
      scale: [[0, 0.33], [0.13, 0.12], [1, 0.85]], offset: [0, 1.55, 0], edgeV: [0, 0.35], erode: [[0, 0.1], [0.6, 0.12], [1, 1]], rampShift: [[0, -0.05], [1, -0.25]], glow: 1.6, core: 0.4, turn: 'random' }),
    // SECONDARY: the scan line climbing the body, a thin hoop
    L({ type: 'shape', form: 'band', ramp: 'divination', main: 'noise', mainK: 0.06, tile: [6, 1], scroll: [0.6, 0], at: 0.14, dur: 0.75, scale: 0.75, stretch: [1, 0.07, 1], offset: [0, [[0, 0.05], [1, 2.3]], 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.2], [1, -0.2]], glow: 2.1, core: 0.4, coreAt: 0.85, turn: 'random' }),
    // SECONDARY: star spots blinking out from the centre and hanging
    L({ type: 'sprites', at: 0.12, count: [12, 16], shape: 'star4', spawn: 'disc', r: 0.25, offset: [0, 0.1, 0], dir: 'out', speed: [2.5, 4.5], drag: 3.5, life: [0.6, 1], size: [0.08, 0.14],
      sizeEnd: 0.02, color: D.spot, colorEnd: D.edge, twinkle: 6 }),
    // TERTIARY: violet-silver specks hanging in the air where it looked, slowly going
    L({ type: 'sprites', at: 0.3, count: [14, 18], shape: 'sparkle', spawn: 'column', r: 1.8, height: 2.2, speed: 0, life: [1, 1.5], size: [0.04, 0.08], sizeEnd: 0, color: D.silver, colorEnd: D.edge,
      alpha: 0.8, twinkle: 4 }),
    // TERTIARY: the lens on the ground: a faint pool of ripples running out under it
    L({ type: 'shape', form: 'disc', ramp: 'divination', main: 'ripple', tile: [1, 3], scroll: [0, 0.45], at: 0.12, dur: 1.2, scale: 2.6, offset: [0, 0.02, 0], erode: [[0, 0.2], [0.5, 0.25], [1, 1]],
      rampShift: [[0, 0], [1, -0.25]], glow: 0.9, core: 0, k: [[0, 0], [0.15, 0.35], [1, 0.3]], turn: 'random' }),
  ] },
  // held: a sonar sweep every 2.4 real s, a scan line, a small iris, specks hanging
  'domain.divination.hold': { layers: [
    // PRIMARY: the sweep: a thin ring swept out flat every 2.4 real seconds, and a second half a sweep behind it
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [8, 1], scroll: [0.2, 0], ...HELD, loop: 2.4, scale: [[0, 0.4], [1, 4.2]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.12], [1, -0.3]], glow: 1.6, core: 0.6, coreAt: 0.85 }),
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [8, 1], scroll: [0.2, 0], ...HELD, at: 1.2, loop: 2.4, scale: [[0, 0.4], [1, 4.2]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.12], [1, -0.3]], glow: 1.6, core: 0.6, coreAt: 0.85 }),
    // SECONDARY: the scan line climbing the body on its own beat
    L({ type: 'shape', form: 'band', ramp: 'divination', main: 'noise', mainK: 0.06, tile: [6, 1], scroll: [0.4, 0], ...HELD, loop: 3, scale: 0.75, stretch: [1, 0.07, 1], offset: [0, [[0, 0.05], [1, 2.2]], 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, glow: 1.5, core: 0.5, coreAt: 0.85 }),
    // SECONDARY: the iris held open at eye height, small and faint, its fibres turning slowly round its dark pupil
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'divination', main: 'rays', tile: [40, 1], scroll: [0, 0.12], ...HELD, scale: 0.6, offset: [0, 1.55, 0], spin: 0.15,
      edgeV: [0.15, 0.45], erode: 0.1, glow: 1.3, core: 0.3, k: 0.5 }),
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'ink', add: 0, main: 'stars', mainK: 0.3, tile: [2, 2], scroll: [0.02, 0.04], ...HELD, scale: 0.33, offset: [0, 1.55, 0],
      edgeV: [0, 0.35], erode: 0.1, rampShift: -0.1, glow: 1.2, core: 0.3, k: 0.5 }),
    // TERTIARY: specks hanging in the air round it
    L({ type: 'sprites', rate: 5, dur: Infinity, shape: 'sparkle', spawn: 'column', r: 1.6, height: 2.2, speed: 0, life: [1, 1.5], size: [0.04, 0.07], sizeEnd: 0, color: D.silver, colorEnd: D.edge,
      alpha: 0.75, twinkle: 4 }),
  ] },
  // a thin ring pinged out flat round the point, an iris snapping open over it
  'domain.divination.hit': { layers: [
    // PRIMARY: a thin ring pinged out flat round the struck point, its front white-hot
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [6, 1], scroll: [0.4, 0], dur: 0.42, scale: [[0, 0.15], [1, 1.6]], edgeV: [0.5, 0.5],
      erode: HOOP, soft: 0.08, rampShift: COOL, glow: 2.4, core: 0.9, coreAt: 0.85, turn: 'random' }),
    // PRIMARY (its heart)
    core('divination', 0, [[0, 0.15], [1, 0.45]], { dur: 0.12 }),
    // SECONDARY: an iris snapping open over the point, in the camera's plane, its pupil dark
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'divination', main: 'rays', tile: [32, 1], scroll: [0, 0.5], dur: 0.4, scale: [[0, 0.15], [1, 0.75]], edgeV: [0.15, 0.45],
      erode: [[0, 0], [0.5, 0.06], [1, 1]], rampShift: COOL, glow: 2, core: 0.6, turn: 'random' }),
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'ink', add: 0, main: 'stars', mainK: 0.3, tile: [2, 2], scroll: [0.02, 0.06], dur: 0.4, scale: [[0, 0.08], [1, 0.42]],
      edgeV: [0, 0.35], erode: [[0, 0.1], [0.5, 0.12], [1, 1]], rampShift: [[0, -0.05], [1, -0.25]], glow: 1.5, core: 0.4, turn: 'random' }),
    // SECONDARY: star spots blinking out from it
    L({ type: 'sprites', count: [6, 8], shape: 'star4', spawn: 'sphere', r: 0.1, dir: 'out', speed: [2, 3], drag: 4, life: [0.35, 0.5], size: [0.06, 0.1], sizeEnd: 0.01, color: D.spot, colorEnd: D.edge, twinkle: 6 }),
    // TERTIARY: a few specks hanging after it
    L({ type: 'sprites', at: 0.1, count: [5, 7], shape: 'sparkle', spawn: 'sphere', r: 0.6, speed: 0, life: [0.5, 0.7], size: [0.03, 0.06], sizeEnd: 0, color: D.silver, colorEnd: D.edge, alpha: 0.8, twinkle: 4 }),
  ] },
  // the level-up: four sonar rings to seven metres, the iris opened over the head, two scan lines
  'domain.divination.level': { layers: [
    // PRIMARY: the sonar: four thin rings swept out flat to seven metres, one after another
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [10, 1], scroll: [0.3, 0], at: 0.2, dur: 1, scale: [[0, 0.4], [1, 7]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.25], [1, -0.3]], glow: 2.4, core: 0.9, coreAt: 0.85, turn: 'random' }),
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [10, 1], scroll: [0.3, 0], at: 0.38, dur: 1, scale: [[0, 0.4], [1, 6.2]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.22], [1, -0.3]], glow: 2.2, core: 0.8, coreAt: 0.85, kmul: 0.8, turn: 'random' }),
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [10, 1], scroll: [0.3, 0], at: 0.56, dur: 1, scale: [[0, 0.4], [1, 5.4]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.18], [1, -0.3]], glow: 2, core: 0.7, coreAt: 0.85, kmul: 0.6, turn: 'random' }),
    L({ type: 'shape', form: 'hoop', ramp: 'divination', main: 'noise', mainK: 0.25, tile: [10, 1], scroll: [0.3, 0], at: 0.74, dur: 1, scale: [[0, 0.4], [1, 4.6]], offset: [0, 0.03, 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.15], [1, -0.3]], glow: 1.8, core: 0.6, coreAt: 0.85, kmul: 0.45, turn: 'random' }),
    // PRIMARY (its heart)
    core('divination', 0.2, [[0, 0.3], [1, 1]], { offset: [0, 0.1, 0], stretch: [1, 0.4, 1], dur: 0.16 }),
    // PRIMARY: the iris over the Courier's head: narrowed to a point (the anticipation), then opened wide, its fibres turning
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'divination', main: 'rays', tile: [56, 1], scroll: [0, 0.3], mask: 'noise', maskK: 0.4, maskTile: [3, 1], dur: 2,
      scale: [[0, 1], [0.1, 0.3], [0.35, 2.2], [1, 2.5]], offset: [0, 2.3, 0], spin: 0.25, edgeV: [0.15, 0.45], erode: [[0, 0.2], [0.1, 0.03], [0.65, 0.08], [1, 1]],
      rampShift: [[0, 0.2], [0.3, 0.06], [1, -0.36]], glow: 2.2, core: 0.6, turn: 'random' }),
    // PRIMARY: its pupil, tenmoku black with star spots, opening with it
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'ink', add: 0, main: 'stars', mainK: 0.3, tile: [3, 3], scroll: [0.02, 0.05], dur: 2,
      scale: [[0, 0.5], [0.1, 0.15], [0.35, 1.2], [1, 1.35]], offset: [0, 2.3, 0], edgeV: [0, 0.35], erode: [[0, 0.1], [0.65, 0.12], [1, 1]], rampShift: [[0, -0.05], [1, -0.25]], glow: 1.7, core: 0.4, turn: 'random' }),
    // SECONDARY: two scan lines climbing the body, one after the other
    L({ type: 'shape', form: 'band', ramp: 'divination', main: 'noise', mainK: 0.06, tile: [6, 1], scroll: [0.6, 0], at: 0.2, dur: 0.9, scale: 0.85, stretch: [1, 0.07, 1], offset: [0, [[0, 0.05], [1, 2.6]], 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.2], [1, -0.2]], glow: 2.1, core: 0.8, coreAt: 0.85, turn: 'random' }),
    L({ type: 'shape', form: 'band', ramp: 'divination', main: 'noise', mainK: 0.06, tile: [6, 1], scroll: [-0.5, 0], at: 0.5, dur: 0.9, scale: 0.7, stretch: [1, 0.07, 1], offset: [0, [[0, 0.05], [1, 2.4]], 0],
      edgeV: [0.5, 0.5], erode: HOOP, soft: 0.08, rampShift: [[0, 0.15], [1, -0.2]], glow: 1.9, core: 0.7, coreAt: 0.85, kmul: 0.7, turn: 'random' }),
    // SECONDARY: the screen's weight: a silver flash, a cool violet lamp (no shake: seeing is quiet)
    L({ type: 'flash', at: 0.2, color: D.silver, k: 0.18, dur: 0.45 }),
    L({ type: 'light', at: 0.2, color: D.spot, k: 24, range: 9, dur: 1.4, hold: 0.25, up: 2 }),
    // SECONDARY: star spots blinking out from the centre
    L({ type: 'sprites', at: 0.2, count: [22, 28], shape: 'star4', spawn: 'disc', r: 0.3, offset: [0, 0.1, 0], dir: 'out', speed: [3, 6], drag: 3, life: [0.8, 1.3], size: [0.08, 0.15],
      sizeEnd: 0.02, color: D.spot, colorEnd: D.edge, twinkle: 6 }),
    // TERTIARY: specks hanging all round, and the lens pooled on the ground
    L({ type: 'sprites', at: 0.35, count: [26, 32], shape: 'sparkle', spawn: 'column', r: 3, height: 3, speed: 0, life: [1.2, 1.8], size: [0.04, 0.09], sizeEnd: 0, color: D.silver, colorEnd: D.edge,
      alpha: 0.8, twinkle: 4 }),
    L({ type: 'shape', form: 'disc', ramp: 'divination', main: 'ripple', tile: [1, 4], scroll: [0, 0.45], at: 0.2, dur: 2, scale: 4.5, offset: [0, 0.02, 0], erode: [[0, 0.2], [0.5, 0.25], [1, 1]],
      rampShift: [[0, 0], [1, -0.25]], glow: 1, core: 0, k: [[0, 0], [0.15, 0.7], [1, 0.7]], turn: 'random' }),
  ] },

  // =============================================================================================== PSYCHOKINESIS (oxblood): thrown out
  // the push: a shockwave wall thrown out all round, debris lifted and swirled, a dust curtain
  'domain.psychokinesis.cast': { layers: [
    // SECONDARY (anticipation): a ring snapped in to the spot, the ground's breath drawn before the push
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'streaks', tile: [10, 1], scroll: [0, -2], dur: 0.15, scale: [[0, 1.8], [1, 0.45]], offset: [0, 0.03, 0], edgeV: [0.4, 0.3],
      erode: [[0, 0.3], [0.4, 0.05], [0.85, 0.15], [1, 1]], rampShift: [[0, 0], [1, 0.25]], glow: 1.8, turn: 'random' }),
    // PRIMARY: the shockwave thrown out: a wall of force pushed out all round, its front bright and tall, sinking as it spreads, its streaks
    // racing up it, the air in it warped
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'noise', tile: [6, 1], scroll: [0, 0.9], mask: 'streaks', maskTile: [8, 1], maskScroll: [0, 1.6], maskK: 0.5, flow: 'noise', flowK: 0.05,
      at: 0.12, dur: 0.7, scale: [[0, 0.5], [1, 4.8]], stretch: [1, [[0, 1.3], [0.4, 0.7], [1, 0.22]], 1], edgeV: [0.02, 0.7], rim: -0.3, erode: [[0, 0], [0.35, 0.05], [1, 1]],
      rampShift: [[0, 0.32], [0.25, 0.1], [1, -0.4]], glow: 2.4, core: 0.8, turn: 'random' }),
    // PRIMARY (its heart)
    core('psychokinesis', 0.12, [[0, 0.4], [1, 1.1]], { offset: [0, 0.3, 0], stretch: [1, 0.6, 1] }),
    // SECONDARY: the wave's back dragging behind it, lower and dimmer, its streaks running back
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'streaks', tile: [10, 1], scroll: [0, -0.6], flow: 'noise', flowK: 0.08, at: 0.15, dur: 0.8, scale: [[0, 0.4], [1, 3.7]],
      stretch: [1, [[0, 0.8], [1, 0.14]], 1], edgeV: [0.05, 0.6], erode: [[0, 0.1], [0.3, 0.12], [1, 1]], rampShift: [[0, 0.05], [1, -0.4]], glow: 1.4, core: 0.3, turn: 'random' }),
    // SECONDARY: the ground's shock ring racing out under it
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'streaks', tile: [12, 1], scroll: [0, 1.8], at: 0.12, dur: 0.55, scale: [[0, 0.45], [1, 5.2]], offset: [0, 0.03, 0], edgeV: [0.75, 0.1],
      erode: OUT, rampShift: COOL, glow: 2.2, turn: 'random' }),
    // SECONDARY: the debris lifted: chips of the ground thrown up and swirled round before they fall
    L({ type: 'sprites', pool: 'alpha', at: 0.12, count: [10, 14], shape: 'chip', spawn: 'disc', r: 1.3, dir: 'swirl', lift: 1.4, speed: [2.5, 4], gravity: 4, drag: 1, life: [0.9, 1.3],
      size: [0.07, 0.13], color: P.clay, alphaEnd: 0.8, spin: [-9, 9], floor: 'ground' }),
    // SECONDARY: streaks thrown out flat with the front
    L({ type: 'sprites', at: 0.12, count: [14, 18], shape: 'streak', spawn: 'ring', r: 0.5, offset: [0, 0.2, 0], dir: 'out', lift: 0.05, speed: [9, 13], drag: 5, life: [0.25, 0.4],
      size: [0.14, 0.22], sizeEnd: 0.03, stretch: 2, color: P.pale, colorEnd: P.hi }),
    // TERTIARY: the dust curtain it raises
    L({ type: 'sprites', pool: 'alpha', at: 0.15, count: [10, 14], shape: 'puff', spawn: 'ring', r: 1.2, dir: 'out', lift: 0.6, speed: [2, 3.5], drag: 2.5, gravity: -0.2, life: [1, 1.5],
      size: [0.5, 0.8], sizeEnd: 1.8, color: P.dust, alpha: 0.35, spin: [-1, 1] }),
    // TERTIARY: a pale rim ring left lingering where the front stopped
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'noise', tile: [6, 1], scroll: [0.05, 0.15], at: 0.38, dur: 1, scale: [[0, 3.4], [1, 4.3]], offset: [0, 0.03, 0], edgeV: [0.6, 0.3],
      erode: [[0, 0.15], [0.5, 0.2], [1, 1]], rampShift: [[0, 0.15], [1, -0.2]], glow: 1, core: 0.3, k: [[0, 0], [0.2, 0.6], [1, 0.6]], turn: 'random' }),
  ] },
  // held: the lift: warped air round the body, a push breathing out, debris orbiting
  'domain.psychokinesis.hold': { layers: [
    // PRIMARY: the lift: a band of warped air round the body, its noise flowing up and round it, shimmering in its flow
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'noise', tile: [4, 1], scroll: [0.2, 0.45], mask: 'streaks', maskTile: [6, 1], maskScroll: [0, 0.9], maskK: 0.45,
      flow: 'noise', flowK: 0.1, flowScroll: [0, 0.6], ...HELD, scale: 0.95, stretch: [1, 1.7, 1], edgeV: [0.1, 0.65], rim: -0.4, erode: 0.22, glow: 1.4, core: 0.3 }),
    // SECONDARY: the push breathing out along the ground: a ring thrown out every 1.6 real seconds
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'streaks', tile: [10, 1], scroll: [0, 1], ...HELD, loop: 1.6, scale: [[0, 0.6], [1, 2.6]], offset: [0, 0.03, 0], edgeV: [0.7, 0.15],
      erode: [[0, 0], [0.6, 0.08], [1, 1]], rampShift: [[0, 0.15], [1, -0.3]], glow: 1.5 }),
    // SECONDARY: the debris lifted and orbiting, rising slowly round it
    L({ type: 'sprites', pool: 'alpha', rate: 6, dur: Infinity, shape: 'chip', spawn: 'ring', r: 1.05, offset: [0, 0.2, 0], dir: 'swirl', lift: 0.6, speed: [1.2, 1.8], gravity: -0.25, drag: 0.6,
      life: [1.4, 2], size: [0.06, 0.11], color: P.clay, alphaEnd: 0.6, spin: [-6, 6] }),
    // TERTIARY: a little dust stirred at the feet
    L({ type: 'sprites', pool: 'alpha', rate: 2, dur: Infinity, shape: 'puff', spawn: 'disc', r: 1, dir: 'out', speed: [0.3, 0.6], life: [1, 1.4], size: [0.4, 0.55], sizeEnd: 1.1, color: P.dust,
      alpha: 0.18, spin: [-0.6, 0.6] }),
    // TERTIARY: the pale rim lingering on the ground
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'noise', tile: [6, 1], scroll: [0.03, 0.1], ...HELD, scale: 1.6, offset: [0, 0.03, 0], edgeV: [0.6, 0.3], erode: 0.2, rampShift: 0.1,
      glow: 0.8, core: 0.2, k: 0.6 }),
  ] },
  // a wave of force thrown along the blow, chips knocked off
  'domain.psychokinesis.hit': { layers: [
    // PRIMARY: a wave of force thrown along the blow (its heading), its front bright, sinking as it goes
    L({ type: 'shape', form: 'wave', ramp: 'psychokinesis', main: 'noise', tile: [3, 1], scroll: [0, 1.4], mask: 'streaks', maskTile: [5, 1], maskScroll: [0, 2], maskK: 0.5, flow: 'noise', flowK: 0.05,
      dur: 0.42, scale: [[0, 0.3], [1, 1.9]], stretch: [1, [[0, 1.2], [1, 0.35]], 1], erode: [[0, 0], [0.35, 0.05], [1, 1]], rampShift: COOL, glow: 2.4, core: 0.8 }),
    // PRIMARY (its heart)
    core('psychokinesis', 0, [[0, 0.2], [1, 0.55]], { dur: 0.12 }),
    // SECONDARY: a small shock ring round the point
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'streaks', tile: [10, 1], scroll: [0, 2], dur: 0.35, scale: [[0, 0.3], [1, 1.6]], edgeV: [0.7, 0.12], erode: OUT, rampShift: COOL, glow: 2.1, turn: 'random' }),
    // SECONDARY: chips knocked off along the blow
    L({ type: 'sprites', pool: 'alpha', count: [5, 8], shape: 'chip', dir: 'cone', cone: 45, speed: [3, 6], gravity: 9, drag: 1, life: [0.4, 0.6], size: [0.05, 0.09], color: P.clay, alphaEnd: 0.8,
      spin: [-12, 12], floor: 'ground' }),
    // TERTIARY: a puff of dust after it
    L({ type: 'sprites', pool: 'alpha', at: 0.05, count: [3, 4], shape: 'puff', dir: 'cone', cone: 60, speed: [0.6, 1.4], drag: 3, gravity: -0.3, life: [0.5, 0.7], size: [0.3, 0.45], sizeEnd: 0.9,
      color: P.dust, alpha: 0.35, spin: [-1, 1] }),
  ] },
  // the level-up: two shockwave walls, debris lifted high, a dust curtain, a shake
  'domain.psychokinesis.level': { layers: [
    // SECONDARY (anticipation): a ring snapped in to the Courier's feet, the breath before the push
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'streaks', tile: [12, 1], scroll: [0, -2.4], dur: 0.24, scale: [[0, 3], [1, 0.6]], offset: [0, 0.03, 0], edgeV: [0.4, 0.3],
      erode: [[0, 0.3], [0.4, 0.05], [0.85, 0.15], [1, 1]], rampShift: [[0, 0], [1, 0.25]], glow: 2, turn: 'random' }),
    // PRIMARY: two shockwave walls thrown out one after the other, the second taller
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'noise', tile: [8, 1], scroll: [0, 0.9], mask: 'streaks', maskTile: [10, 1], maskScroll: [0, 1.6], maskK: 0.5, flow: 'noise', flowK: 0.05,
      at: 0.22, dur: 0.85, scale: [[0, 0.6], [1, 7]], stretch: [1, [[0, 1.6], [0.4, 0.9], [1, 0.25]], 1], edgeV: [0.02, 0.7], rim: -0.3, erode: [[0, 0], [0.35, 0.05], [1, 1]],
      rampShift: [[0, 0.32], [0.25, 0.1], [1, -0.4]], glow: 2.5, core: 0.8, turn: 'random' }),
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'noise', tile: [8, 1], scroll: [0, 1.1], mask: 'streaks', maskTile: [10, 1], maskScroll: [0, 1.8], maskK: 0.5, flow: 'noise', flowK: 0.05,
      at: 0.42, dur: 0.85, scale: [[0, 0.5], [1, 5.5]], stretch: [1, [[0, 2.1], [0.4, 1.1], [1, 0.3]], 1], edgeV: [0.02, 0.7], rim: -0.3, erode: [[0, 0], [0.35, 0.05], [1, 1]],
      rampShift: [[0, 0.3], [0.25, 0.08], [1, -0.4]], glow: 2.3, core: 0.7, kmul: 0.85, turn: 'random' }),
    // PRIMARY (its heart)
    core('psychokinesis', 0.22, [[0, 0.6], [1, 1.7]], { offset: [0, 0.4, 0], stretch: [1, 0.6, 1], dur: 0.16 }),
    // SECONDARY: the wave's back dragging, and the ground's shock ring racing out under it
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'streaks', tile: [12, 1], scroll: [0, -0.6], flow: 'noise', flowK: 0.08, at: 0.26, dur: 1, scale: [[0, 0.5], [1, 5.6]],
      stretch: [1, [[0, 1], [1, 0.16]], 1], edgeV: [0.05, 0.6], erode: [[0, 0.1], [0.3, 0.12], [1, 1]], rampShift: [[0, 0.05], [1, -0.4]], glow: 1.5, core: 0.3, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'streaks', tile: [14, 1], scroll: [0, 1.8], at: 0.22, dur: 0.7, scale: [[0, 0.6], [1, 7.5]], offset: [0, 0.03, 0], edgeV: [0.75, 0.1],
      erode: OUT, rampShift: COOL, glow: 2.3, turn: 'random' }),
    // SECONDARY: the screen's weight: a pale flash, a lamp in the oxblood's pale, the push felt as a shake
    L({ type: 'flash', at: 0.22, color: P.pale, k: 0.22, dur: 0.45 }),
    L({ type: 'light', at: 0.22, color: P.hi, k: 30, range: 9, dur: 1.1, hold: 0.15, up: 1 }),
    L({ type: 'shake', at: 0.22, k: 0.18 }),
    // SECONDARY: the debris lifted high round the Courier, orbiting and falling; streaks thrown out flat with the front
    L({ type: 'sprites', pool: 'alpha', at: 0.22, count: [20, 26], shape: 'chip', spawn: 'disc', r: 2, dir: 'swirl', lift: 1.6, speed: [3, 5], gravity: 3.5, drag: 0.9, life: [1.2, 1.7],
      size: [0.08, 0.15], color: P.clay, alphaEnd: 0.8, spin: [-9, 9], floor: 'ground' }),
    L({ type: 'sprites', at: 0.22, count: [22, 28], shape: 'streak', spawn: 'ring', r: 0.6, offset: [0, 0.25, 0], dir: 'out', lift: 0.05, speed: [11, 16], drag: 4.5, life: [0.3, 0.5],
      size: [0.16, 0.26], sizeEnd: 0.03, stretch: 2.2, color: P.pale, colorEnd: P.hi }),
    // TERTIARY: the dust curtain it raises, and the pale rim left where the front stopped
    L({ type: 'sprites', pool: 'alpha', at: 0.25, count: [16, 20], shape: 'puff', spawn: 'ring', r: 1.6, dir: 'out', lift: 0.7, speed: [2.5, 4.5], drag: 2.2, gravity: -0.2, life: [1.2, 1.8],
      size: [0.6, 0.9], sizeEnd: 2.2, color: P.dust, alpha: 0.35, spin: [-1, 1] }),
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'noise', tile: [8, 1], scroll: [0.05, 0.15], at: 0.6, dur: 1.4, scale: [[0, 5], [1, 6.4]], offset: [0, 0.03, 0], edgeV: [0.6, 0.3],
      erode: [[0, 0.15], [0.5, 0.2], [1, 1]], rampShift: [[0, 0.15], [1, -0.2]], glow: 1.1, core: 0.3, k: [[0, 0], [0.2, 0.6], [1, 0.6]], turn: 'random' }),
  ] },

  // =============================================================================================== POSSESSION (Jun ware): drawn in
  // reaching in: tethers reeled in, a spiral wound tight, a shell closing, a collar tightening
  'domain.possession.cast': { layers: [
    // SECONDARY (anticipation): tethers reeled in along the ground from all round to the target, arriving as the spiral closes
    L({ type: 'sprites', count: [14, 18], shape: 'streak', spawn: 'ring', r: 3.2, offset: [0, 0.1, 0], dir: 'in', speed: [10, 12], life: [0.27, 0.31], size: [0.22, 0.3], sizeEnd: 0.05,
      stretch: 3.5, color: Po.splash, colorEnd: Po.hi }),
    // PRIMARY: the spiral drawn in: a ribbon wound round the target, tightening from wide and low to close and tall as it turns
    L({ type: 'shape', form: 'spiral', ramp: 'possession', main: 'noise', tile: [4, 1], scroll: [-0.9, 0], mask: 'streaks', maskTile: [6, 1], maskK: 0.4, dur: 0.8, scale: [[0, 2.6], [1, 0.55]],
      stretch: [1, [[0, 0.25], [1, 1.9]], 1], spin: 4.5, erode: [[0, 0.45], [0.25, 0.05], [0.7, 0.08], [1, 1]], rampShift: [[0, -0.05], [0.55, 0.22], [1, -0.3]], glow: 2.1, core: 0.6, turn: 'random' }),
    // PRIMARY: the shell closing over the target, from wide to its body, its cells flowing down as it shuts at 0.34 s
    L({ type: 'shape', form: 'dome', ramp: 'possession', main: 'cells', tile: [6, 2], scroll: [0, -0.35], mask: 'noise', maskTile: [2, 1], maskScroll: [0.05, -0.2], at: 0.24, dur: 1,
      scale: [[0, 2.4], [0.1, 1], [1, 0.95]], stretch: [1, [[0, 0.6], [0.1, 1.9], [1, 1.9]], 1], rim: 0.8, erode: [[0, 0.35], [0.1, 0.04], [0.7, 0.08], [1, 1]],
      rampShift: [[0, 0], [0.1, 0.22], [1, -0.32]], glow: 1.9, core: 0.6, turn: 'random' }),
    // PRIMARY (its heart): white-hot as the shell shuts
    core('possession', 0.34, [[0, 0.3], [1, 0.8]], { offset: [0, 0.9, 0] }),
    // SECONDARY: the collar on it, tightening at the neck
    L({ type: 'shape', form: 'band', ramp: 'possession', main: 'rays', tile: [16, 1], scroll: [0.3, 0], at: 0.3, dur: 0.9, scale: [[0, 1.3], [0.3, 0.42], [1, 0.4]], stretch: [1, 0.09, 1],
      offset: [0, 1.4, 0], edgeV: [0.3, 0.3], erode: [[0, 0.3], [0.25, 0.04], [0.7, 0.08], [1, 1]], rampShift: COOL, glow: 2.2, core: 0.6, turn: 'random' }),
    // TERTIARY: the purple haze breathing round it
    L({ type: 'shape', form: 'sphere', ramp: 'possession', main: 'noise', tile: [2, 2], scroll: [0.05, 0.2], flow: 'noise', flowK: 0.07, at: 0.34, dur: 1.1, scale: [[0, 1.6], [0.5, 1.1], [1, 1.3]],
      offset: [0, 0.9, 0], rim: -0.8, erode: [[0, 0.3], [0.5, 0.3], [1, 1]], rampShift: [[0, -0.1], [1, -0.35]], glow: 0.8, core: 0, k: [[0, 0], [0.2, 0.6], [1, 0.5]], turn: 'random' }),
    // TERTIARY: motes drawn in to it after
    L({ type: 'sprites', at: 0.3, count: [16, 20], shape: 'soft', spawn: 'shell', r: 2, offset: [0, 1, 0], dir: 'in', speed: [1.2, 2], drag: 0.6, life: [0.9, 1.3], size: [0.05, 0.09], sizeEnd: 0,
      color: Po.body, colorEnd: Po.splash, alpha: 0.85 }),
  ] },
  // held: a spiral drawn in over and over, a collar breathing, a faint shell, motes drawn in
  'domain.possession.hold': { layers: [
    // PRIMARY: the spiral drawn in, over and over: a ribbon wound in from wide to the body every 2.2 real seconds
    L({ type: 'shape', form: 'spiral', ramp: 'possession', main: 'noise', tile: [4, 1], scroll: [-0.6, 0], ...HELD, loop: 2.2, scale: [[0, 1.9], [1, 0.6]], stretch: [1, [[0, 0.4], [1, 1.7]], 1],
      spin: 2, erode: [[0, 0.75], [0.25, 0.1], [0.7, 0.1], [1, 0.85]], rampShift: [[0, -0.1], [0.6, 0.15], [1, -0.2]], glow: 1.5, core: 0.4 }),
    // SECONDARY: the collar, breathing at the neck
    L({ type: 'shape', form: 'band', ramp: 'possession', main: 'rays', tile: [12, 1], scroll: [0.15, 0], ...HELD, loop: 1.8, scale: 0.42, stretch: [1, 0.08, 1], offset: [0, 1.38, 0], spin: 1,
      edgeV: [0.3, 0.3], k: [[0, 0.6], [0.5, 1], [1, 0.6]], glow: 1.8, core: 0.4 }),
    // SECONDARY: the shell, faint, its cells running down
    L({ type: 'shape', form: 'dome', ramp: 'possession', main: 'cells', tile: [6, 2], scroll: [0, -0.12], ...HELD, scale: 0.95, stretch: [1, 1.9, 1], rim: 0.9, erode: 0.35, glow: 0.9, core: 0.2, k: 0.6 }),
    // TERTIARY: motes drawn in
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'soft', spawn: 'shell', r: 1.8, offset: [0, 1, 0], dir: 'in', speed: [0.9, 1.4], life: [1.1, 1.4], size: [0.04, 0.08], sizeEnd: 0,
      color: Po.body, colorEnd: Po.splash, alpha: 0.8 }),
    // TERTIARY: the haze breathing round it
    L({ type: 'shape', form: 'sphere', ramp: 'possession', main: 'noise', tile: [2, 2], scroll: [0.04, 0.15], flow: 'noise', flowK: 0.07, ...HELD, loop: 3, scale: [[0, 1.1], [0.5, 1.3], [1, 1.1]],
      offset: [0, 0.9, 0], rim: -0.85, erode: 0.35, rampShift: -0.25, glow: 0.6, core: 0, k: 0.5 }),
  ] },
  // a small shell snapping shut on the point, tethers and a spiral drawn in
  'domain.possession.hit': { layers: [
    // SECONDARY (anticipation): a few tethers reeled in to the point
    L({ type: 'sprites', count: [6, 8], shape: 'streak', spawn: 'shell', r: 1.3, dir: 'in', speed: [9, 11], life: [0.12, 0.14], size: [0.14, 0.2], sizeEnd: 0.04, stretch: 3, color: Po.splash, colorEnd: Po.hi }),
    // PRIMARY: a small shell snapping shut on the point
    L({ type: 'shape', form: 'dome', ramp: 'possession', main: 'cells', tile: [5, 2], scroll: [0, -0.5], at: 0.08, dur: 0.42, scale: [[0, 1.1], [0.3, 0.35], [1, 0.32]], rim: 0.8,
      erode: [[0, 0.3], [0.3, 0.04], [1, 1]], rampShift: [[0, 0], [0.3, 0.25], [1, -0.3]], glow: 2.1, core: 0.6, turn: 'random' }),
    // PRIMARY (its heart)
    core('possession', 0.12, [[0, 0.15], [1, 0.45]], { dur: 0.12 }),
    // SECONDARY: a little spiral wound in round it
    L({ type: 'shape', form: 'spiral', ramp: 'possession', main: 'noise', tile: [3, 1], scroll: [-1.2, 0], dur: 0.4, scale: [[0, 1], [1, 0.25]], stretch: [1, [[0, 0.3], [1, 1]], 1], offset: [0, -0.2, 0],
      spin: 7, erode: [[0, 0.4], [0.3, 0.05], [1, 1]], rampShift: COOL, glow: 2, turn: 'random' }),
    // TERTIARY: motes drawn in after it
    L({ type: 'sprites', at: 0.1, count: [5, 7], shape: 'soft', spawn: 'shell', r: 0.9, dir: 'in', speed: [1, 1.6], life: [0.4, 0.6], size: [0.04, 0.07], sizeEnd: 0, color: Po.body, colorEnd: Po.splash }),
  ] },
  // the level-up: two spirals wound against each other, a shell closing over the Courier
  'domain.possession.level': { layers: [
    // SECONDARY (anticipation): tethers reeled in from five metres to the Courier, low along the ground
    L({ type: 'sprites', count: [24, 30], shape: 'streak', spawn: 'ring', r: 4.5, offset: [0, 0.1, 0], dir: 'in', speed: [13, 15], life: [0.3, 0.34], size: [0.24, 0.32], sizeEnd: 0.05,
      stretch: 4, color: Po.splash, colorEnd: Po.hi }),
    // PRIMARY: two spirals drawn in round the Courier, wound against each other
    L({ type: 'shape', form: 'spiral', ramp: 'possession', main: 'noise', tile: [5, 1], scroll: [-0.9, 0], mask: 'streaks', maskTile: [8, 1], maskK: 0.4, dur: 1.1, scale: [[0, 3.6], [1, 0.75]],
      stretch: [1, [[0, 0.3], [1, 2.4]], 1], spin: 4, erode: [[0, 0.45], [0.2, 0.05], [0.7, 0.08], [1, 1]], rampShift: [[0, -0.05], [0.4, 0.22], [1, -0.3]], glow: 2.2, core: 0.6, turn: 'random' }),
    L({ type: 'shape', form: 'spiral', ramp: 'possession', main: 'noise', tile: [5, 1], scroll: [0.9, 0], mask: 'streaks', maskTile: [8, 1], maskK: 0.4, at: 0.05, dur: 1.1, scale: [[0, 3], [1, 0.65]],
      stretch: [1, [[0, 0.35], [1, 2.2]], 1], spin: -4.5, erode: [[0, 0.45], [0.2, 0.05], [0.7, 0.08], [1, 1]], rampShift: [[0, -0.05], [0.4, 0.2], [1, -0.3]], glow: 2, core: 0.5, turn: 'random' }),
    // PRIMARY: the shell closing over them from wide, shut at 0.42 s
    L({ type: 'shape', form: 'dome', ramp: 'possession', main: 'cells', tile: [8, 3], scroll: [0, -0.35], mask: 'noise', maskTile: [2, 1], maskScroll: [0.05, -0.2], at: 0.22, dur: 1.6,
      scale: [[0, 3.4], [0.12, 1.3], [1, 1.25]], stretch: [1, [[0, 0.5], [0.12, 1.7], [1, 1.7]], 1], rim: 0.8, erode: [[0, 0.35], [0.12, 0.04], [0.7, 0.08], [1, 1]],
      rampShift: [[0, 0], [0.12, 0.24], [1, -0.34]], glow: 2, core: 0.6, turn: 'random' }),
    // PRIMARY (its heart)
    core('possession', 0.42, [[0, 0.4], [1, 1.2]], { offset: [0, 1, 0], dur: 0.16 }),
    // SECONDARY: the collar at the chest, tightening
    L({ type: 'shape', form: 'band', ramp: 'possession', main: 'rays', tile: [20, 1], scroll: [0.3, 0], at: 0.35, dur: 1.4, scale: [[0, 2], [0.25, 0.55], [1, 0.52]], stretch: [1, 0.09, 1],
      offset: [0, 1.25, 0], edgeV: [0.3, 0.3], erode: [[0, 0.3], [0.2, 0.04], [0.7, 0.08], [1, 1]], rampShift: COOL, glow: 2.3, core: 0.6, turn: 'random' }),
    // SECONDARY: the screen's weight: a purple flash, a lamp in Jun blue, a small shake as the shell shuts
    L({ type: 'flash', at: 0.42, color: Po.splash, k: 0.2, dur: 0.5 }),
    L({ type: 'light', at: 0.42, color: Po.body, k: 26, range: 8, dur: 1.5, hold: 0.25, up: 1 }),
    L({ type: 'shake', at: 0.42, k: 0.08 }),
    // TERTIARY: the haze breathing round them, motes drawn in after
    L({ type: 'shape', form: 'sphere', ramp: 'possession', main: 'noise', tile: [2, 2], scroll: [0.05, 0.2], flow: 'noise', flowK: 0.07, at: 0.42, dur: 1.6, scale: [[0, 2.4], [0.5, 1.6], [1, 1.8]],
      offset: [0, 1, 0], rim: -0.8, erode: [[0, 0.3], [0.5, 0.3], [1, 1]], rampShift: [[0, -0.1], [1, -0.35]], glow: 0.9, core: 0, k: [[0, 0], [0.2, 0.6], [1, 0.5]], turn: 'random' }),
    L({ type: 'sprites', at: 0.4, count: [26, 32], shape: 'soft', spawn: 'shell', r: 3, offset: [0, 1, 0], dir: 'in', speed: [1.6, 2.6], drag: 0.6, life: [1, 1.5], size: [0.05, 0.1], sizeEnd: 0,
      color: Po.body, colorEnd: Po.splash, alpha: 0.85 }),
  ] },

  // =============================================================================================== ALTERATION (flambe): a band swept through its ramp
  // turned: a band swept up the body through the flambe, crescents turning, flakes changing colour as they fall
  'domain.alteration.cast': { layers: [
    // SECONDARY (anticipation): two crescents turning in round the feet, closing on the body
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [1.4, 0], dur: 0.3, scale: [[0, 1.8], [1, 0.9]], offset: [0, 0.1, 0], spin: 7,
      erode: [[0, 0.3], [0.3, 0.05], [0.85, 0.1], [1, 1]], rampShift: [[0, 0.3], [1, 0.05]], glow: 2, turn: 'random' }),
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [1.4, 0], dur: 0.3, scale: [[0, 1.6], [1, 0.8]], offset: [0, 0.1, 0], spin: -7,
      erode: [[0, 0.3], [0.3, 0.05], [0.85, 0.1], [1, 1]], rampShift: [[0, -0.1], [1, 0.1]], glow: 2, turn: 'random' }),
    // PRIMARY: the band swept up the body: a curtain whose leading edge is white-hot and whose trail runs down through the flambe (its value
    // laid along its height: salmon, copper red, purple, blue, clear at the ground), the whole of it cooling toward the blue as it goes
    L({ type: 'shape', form: 'band', ramp: 'alteration', main: 'streaks', mainK: 0.85, tile: [6, 1], scroll: [0, 1.5], mask: 'noise', maskK: 0.85, maskTile: [3, 1], maskScroll: [0.1, 0.6],
      flow: 'noise', flowK: 0.05, at: 0.12, dur: 0.9, scale: 0.85, stretch: [1, [[0, 0.05], [0.45, 2.5], [1, 2.7]], 1], edgeV: [0.8, 0.12], rim: 0.45, erode: [[0, 0.04], [0.45, 0.08], [1, 1]],
      rampShift: [[0, 0.28], [0.4, 0.1], [1, -0.42]], glow: 2.8, core: 0.8, coreAt: 0.85, turn: 'random' }),
    // PRIMARY (its heart): where it began, white-hot at the feet
    core('alteration', 0.12, [[0, 0.3], [1, 0.9]], { offset: [0, 0.15, 0], stretch: [1, 0.5, 1] }),
    // SECONDARY: crescents turning round the body at two heights against each other, the ramp running through them as they go
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [1.2, 0], at: 0.18, dur: 0.9, scale: 1.05, offset: [0, 0.7, 0], spin: 6,
      erode: OUT, rampShift: [[0, 0.32], [1, -0.4]], glow: 2, turn: 'random' }),
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [-1.2, 0], at: 0.22, dur: 0.85, scale: 0.8, offset: [0, 1.45, 0], spin: -7,
      erode: OUT, rampShift: [[0, 0.32], [1, -0.4]], glow: 2, turn: 'random' }),
    // SECONDARY: flakes turning from red to blue as they fall
    L({ type: 'sprites', at: 0.3, count: [14, 18], shape: 'petal', spawn: 'column', r: 1, height: 2.2, offset: [0, 0.4, 0], dir: 'out', lift: 0.2, speed: [0.4, 0.9], gravity: 0.9, drag: 1.4,
      life: [0.9, 1.4], size: [0.1, 0.16], sizeEnd: 0.06, spin: [-4, 4], color: A.hi, colorEnd: A.blue, floor: 'ground' }),
    // TERTIARY: the shimmer it leaves where it passed: the ground's light bent in a slow flow
    L({ type: 'shape', form: 'disc', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [0.1, 0.2], flow: 'noise', flowK: 0.12, flowScroll: [0.1, 0.5], at: 0.4, dur: 1.2, scale: 1.6,
      offset: [0, 0.02, 0], erode: [[0, 0.2], [0.5, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.35]], glow: 0.8, core: 0, k: [[0, 0], [0.2, 0.6], [1, 0.6]], turn: 'random' }),
    // TERTIARY: a few motes in the blue it cooled to, drifting up
    L({ type: 'sprites', at: 0.6, count: [8, 10], shape: 'soft', spawn: 'column', r: 0.8, height: 2, dir: 'up', speed: [0.15, 0.4], life: [1, 1.4], size: [0.04, 0.07], sizeEnd: 0, color: A.blue, alpha: 0.8 }),
  ] },
  // held: the band swept up every 2.4 real s, two crescents turning against each other
  'domain.alteration.hold': { layers: [
    // PRIMARY: the band swept up the body every 2.4 real seconds, the flambe running down its trail
    L({ type: 'shape', form: 'band', ramp: 'alteration', main: 'streaks', mainK: 0.85, tile: [6, 1], scroll: [0, 1], mask: 'noise', maskK: 0.85, maskTile: [3, 1], maskScroll: [0.1, 0.5],
      flow: 'noise', flowK: 0.04, ...HELD, loop: 2.4, scale: 0.82, stretch: [1, [[0, 0.05], [1, 2.3]], 1], edgeV: [0.8, 0.12], rim: 0.45, erode: [[0, 0.03], [0.7, 0.06], [1, 1]],
      rampShift: [[0, 0.12], [1, -0.32]], glow: 1.6, core: 0.6, coreAt: 0.85 }),
    // SECONDARY: a crescent turning round the middle, its colour running red to blue and back
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [0.6, 0], ...HELD, loop: 4, scale: 1, offset: [0, 0.9, 0], spin: 1.6, erode: 0.12,
      rampShift: [[0, 0.15], [0.5, -0.2], [1, 0.15]], glow: 1.4 }),
    // SECONDARY: a wider one turning the other way at the feet, its colour against the first's
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [-0.6, 0], ...HELD, loop: 4, scale: 1.25, offset: [0, 0.08, 0], spin: -1.1, erode: 0.12,
      rampShift: [[0, -0.2], [0.5, 0.15], [1, -0.2]], glow: 1.3 }),
    // TERTIARY: flakes turning colour as they fall
    L({ type: 'sprites', rate: 4, dur: Infinity, shape: 'petal', spawn: 'column', r: 0.9, height: 2, offset: [0, 0.4, 0], dir: 'out', speed: [0.2, 0.4], gravity: 0.6, drag: 1.4, life: [1, 1.4],
      size: [0.08, 0.13], sizeEnd: 0.05, spin: [-3, 3], color: A.hi, colorEnd: A.blue, floor: 'ground' }),
    // TERTIARY: the shimmer at its feet
    L({ type: 'shape', form: 'disc', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [0.08, 0.15], flow: 'noise', flowK: 0.12, flowScroll: [0.1, 0.4], ...HELD, scale: 1.3, offset: [0, 0.02, 0],
      erode: 0.25, rampShift: -0.25, glow: 0.6, core: 0, k: 0.55 }),
  ] },
  // a short band wiped up across the point, a crescent flicked round it
  'domain.alteration.hit': { layers: [
    // PRIMARY: a short band wiped up across the struck point, hot at its leading edge, the flambe running down behind it
    L({ type: 'shape', form: 'band', ramp: 'alteration', main: 'streaks', mainK: 0.85, tile: [5, 1], scroll: [0, 2], mask: 'noise', maskK: 0.85, maskTile: [2, 1], dur: 0.42, offset: [0, -0.1, 0],
      scale: 0.4, stretch: [1, [[0, 0.05], [0.5, 1], [1, 1.1]], 1], edgeV: [0.8, 0.12], erode: [[0, 0], [0.4, 0.05], [1, 1]], rampShift: COOL, glow: 2.4, core: 0.8, coreAt: 0.85, turn: 'random' }),
    // PRIMARY (its heart)
    core('alteration', 0, [[0, 0.2], [1, 0.5]], { dur: 0.12 }),
    // SECONDARY: a crescent flicked round it, its colour run from red to blue
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [2, 1], scroll: [1.5, 0], dur: 0.38, scale: [[0, 0.6], [1, 1.05]], offset: [0, 0.05, 0], spin: 9, erode: OUT,
      rampShift: [[0, 0.3], [1, -0.4]], glow: 2, turn: 'random' }),
    // TERTIARY: flakes turning red to blue as they fall
    L({ type: 'sprites', count: [6, 8], shape: 'petal', spawn: 'sphere', r: 0.35, dir: 'out', speed: [0.8, 1.6], gravity: 2, drag: 2, life: [0.5, 0.7], size: [0.07, 0.11], sizeEnd: 0.04,
      spin: [-5, 5], color: A.hi, colorEnd: A.blue }),
  ] },
  // the level-up: the band swept past the head, crescents at three heights, a ring of the ramp run out
  'domain.alteration.level': { layers: [
    // SECONDARY (anticipation): three crescents turning in to the Courier's feet
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [1.4, 0], dur: 0.32, scale: [[0, 2.6], [1, 1.1]], offset: [0, 0.1, 0], spin: 8,
      erode: [[0, 0.3], [0.3, 0.05], [0.85, 0.1], [1, 1]], rampShift: [[0, 0.3], [1, 0.05]], glow: 2.1, turn: 'random' }),
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [-1.4, 0], dur: 0.32, scale: [[0, 2.2], [1, 0.95]], offset: [0, 0.1, 0], spin: -8,
      erode: [[0, 0.3], [0.3, 0.05], [0.85, 0.1], [1, 1]], rampShift: [[0, -0.1], [1, 0.1]], glow: 2.1, turn: 'random' }),
    // PRIMARY: the band swept up past the Courier's head, its leading edge white-hot and the whole flambe running down its trail
    L({ type: 'shape', form: 'band', ramp: 'alteration', main: 'streaks', mainK: 0.85, tile: [8, 1], scroll: [0, 1.5], mask: 'noise', maskK: 0.85, maskTile: [3, 1], maskScroll: [0.1, 0.6],
      flow: 'noise', flowK: 0.04, at: 0.25, dur: 1.4, scale: 1.05, stretch: [1, [[0, 0.05], [0.4, 3.4], [1, 3.6]], 1], edgeV: [0.8, 0.12], rim: 0.45, erode: [[0, 0], [0.45, 0.04], [1, 1]],
      rampShift: [[0, 0.28], [0.4, 0.1], [1, -0.42]], glow: 2.9, core: 0.8, coreAt: 0.85, turn: 'random' }),
    // PRIMARY: an inner band a beat behind, its streaks falling the other way
    L({ type: 'shape', form: 'band', ramp: 'alteration', main: 'streaks', mainK: 0.85, tile: [6, 1], scroll: [0, -1.2], mask: 'noise', maskK: 0.85, maskTile: [3, 1], maskScroll: [-0.1, 0.5],
      flow: 'noise', flowK: 0.04, at: 0.38, dur: 1.3, scale: 0.7, stretch: [1, [[0, 0.05], [0.4, 2.9], [1, 3]], 1], edgeV: [0.8, 0.12], rim: 0.7, erode: [[0, 0], [0.45, 0.04], [1, 1]],
      rampShift: [[0, 0.05], [1, -0.45]], glow: 2, core: 0.6, coreAt: 0.85, kmul: 0.8, turn: 'random' }),
    // PRIMARY (its heart)
    core('alteration', 0.25, [[0, 0.5], [1, 1.4]], { offset: [0, 0.2, 0], stretch: [1, 0.5, 1], dur: 0.16 }),
    // SECONDARY: crescents turning at three heights, the ramp running through them
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [1.2, 0], at: 0.3, dur: 1.3, scale: 1.5, offset: [0, 0.4, 0], spin: 5,
      erode: OUT, rampShift: [[0, 0.32], [1, -0.4]], glow: 2.1, turn: 'random' }),
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [-1.2, 0], at: 0.34, dur: 1.25, scale: 1.2, offset: [0, 1.2, 0], spin: -6,
      erode: OUT, rampShift: [[0, 0.32], [1, -0.4]], glow: 2, turn: 'random' }),
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'alteration', main: 'noise', tile: [3, 1], scroll: [1.2, 0], at: 0.38, dur: 1.2, scale: 0.95, offset: [0, 2, 0], spin: 7,
      erode: OUT, rampShift: [[0, 0.32], [1, -0.4]], glow: 2, turn: 'random' }),
    // SECONDARY: a ring of the ramp run out along the ground, hot inside and blue at its edge
    L({ type: 'shape', form: 'ring', ramp: 'alteration', main: 'noise', mainK: 0.3, tile: [8, 1], scroll: [0.2, 0.6], at: 0.25, dur: 0.9, scale: [[0, 0.8], [1, 4.4]], offset: [0, 0.03, 0],
      edgeV: [0.05, 0.85], erode: OUT, rampShift: COOL, glow: 2, turn: 'random' }),
    // SECONDARY: the screen's weight: a flash of the flambe's salmon, a lamp in its copper red, a small shake
    L({ type: 'flash', at: 0.25, color: A.hi, k: 0.2, dur: 0.5 }),
    L({ type: 'light', at: 0.25, color: A.red, k: 28, range: 8, dur: 1.5, hold: 0.25, up: 1.4 }),
    L({ type: 'shake', at: 0.25, k: 0.07 }),
    // SECONDARY: petals turning from red to blue as they fall
    L({ type: 'sprites', at: 0.4, count: [24, 30], shape: 'petal', spawn: 'column', r: 1.8, height: 3.2, offset: [0, 0.4, 0], dir: 'out', lift: 0.2, speed: [0.4, 1], gravity: 0.8, drag: 1.4,
      life: [1.2, 1.8], size: [0.11, 0.18], sizeEnd: 0.06, spin: [-4, 4], color: A.hi, colorEnd: A.blue, floor: 'ground' }),
    // TERTIARY: the shimmer left on the ground, and motes in the blue it cooled to
    L({ type: 'shape', form: 'disc', ramp: 'alteration', main: 'noise', tile: [4, 1], scroll: [0.1, 0.2], flow: 'noise', flowK: 0.12, flowScroll: [0.1, 0.5], at: 0.5, dur: 1.7, scale: 2.6,
      offset: [0, 0.02, 0], erode: [[0, 0.2], [0.5, 0.25], [1, 1]], rampShift: [[0, -0.05], [1, -0.35]], glow: 0.9, core: 0, k: [[0, 0], [0.2, 0.6], [1, 0.6]], turn: 'random' }),
    L({ type: 'sprites', at: 0.8, count: [14, 18], shape: 'soft', spawn: 'column', r: 1.4, height: 3, dir: 'up', speed: [0.15, 0.45], life: [1.2, 1.7], size: [0.04, 0.08], sizeEnd: 0, color: A.blue, alpha: 0.8 }),
  ] },

  // =============================================================================================== SPELLSCRIPTION (cobalt on white): written
  // written: strokes in the air, a circle drawn by a racing brush, a seal stamped at its heart, ink left
  'domain.spellscription.cast': { layers: [
    // SECONDARY (anticipation): three strokes written in the air over the spot, each a crescent of the running hand flicked into being
    stroke(0, 0.4), stroke(0.07, 1.6), stroke(0.14, 2.8),
    // PRIMARY: the circle drawn on the ground: the brush racing round it once, its script white-hot
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'spellscription', main: 'script', tile: [3, 0.5], scroll: [2, 0], at: 0.15, dur: 0.45, scale: 1.6, offset: [0, 0.04, 0], spin: 14,
      erode: [[0, 0], [0.6, 0.05], [1, 1]], rampShift: [[0, 0.3], [1, -0.2]], glow: 2.4, core: 0.8, turn: 'random' }),
    // PRIMARY: the ring of script written in behind the brush (erosion run backwards), held, then gone; and its inner rim, graduated
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'script', tile: [8, 0.35], scroll: [0.05, 0], at: 0.15, dur: 1.3, scale: 1.55, offset: [0, 0.03, 0], edgeV: [0.3, 0.3],
      erode: [[0, 0.85], [0.3, 0.04], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.3], [0.3, 0.1], [1, -0.3]], glow: 2, core: 0.5, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'rays', tile: [56, 1], mainK: 0.6, scroll: [-0.05, 0], at: 0.2, dur: 1.25, scale: 1.15, offset: [0, 0.03, 0], edgeV: [0.44, 0.44],
      erode: [[0, 0.85], [0.3, 0.04], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.25], [0.3, 0.08], [1, -0.3]], glow: 1.8, turn: 'random' }),
    // PRIMARY: the seal stamped at its heart as the circle closes (the one square of the seven): pressed down hard, white-hot a beat, then cobalt
    L({ type: 'shape', form: 'quad', face: 'ground', ramp: 'spellscription', main: 'script', tile: [2, 2], mainK: 0.5, scroll: [0, 0.1], at: 0.45, dur: 0.7, scale: [[0, 1.4], [0.12, 0.75], [1, 0.75]],
      offset: [0, 0.05, 0], edgeU: [0.12, 0.12], edgeV: [0.12, 0.12], erode: [[0, 0], [0.4, 0.05], [1, 1]], rampShift: [[0, 0.4], [0.15, 0.1], [1, -0.3]], glow: 2.4, core: 0.9, coreAt: 0.75, turn: 'random' }),
    // PRIMARY (its heart)
    core('spellscription', 0.45, [[0, 0.3], [1, 0.8]], { offset: [0, 0.15, 0], stretch: [1, 0.4, 1] }),
    // SECONDARY: a band of script circling at chest height, written in and turning
    L({ type: 'shape', form: 'band', ramp: 'spellscription', main: 'script', tile: [5, 1], scroll: [0.25, 0], at: 0.3, dur: 1.1, scale: 0.9, stretch: [1, 0.22, 1], offset: [0, 1.15, 0], spin: 0.8,
      edgeV: [0.3, 0.3], erode: [[0, 0.8], [0.25, 0.05], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.3], [0.3, 0.12], [1, -0.3]], glow: 2.4, turn: 'random' }),
    // SECONDARY: talismans lifted off the circle as the seal comes down, porcelain going cobalt
    L({ type: 'sprites', at: 0.45, count: [5, 7], shape: 'talisman', spawn: 'ring', r: 1.5, offset: [0, 0.2, 0], dir: 'up', speed: [0.6, 1.2], drag: 0.8, life: [0.8, 1.1], size: [0.18, 0.26],
      sizeEnd: 0.12, spin: [-2, 2], color: S.white, colorEnd: S.body }),
    // TERTIARY: ink motes rising off it (dark, alpha-over) and porcelain specks
    L({ type: 'sprites', pool: 'alpha', at: 0.45, count: [12, 16], shape: 'soft', spawn: 'disc', r: 1.6, dir: 'up', speed: [0.2, 0.5], gravity: -0.1, life: [1, 1.5], size: [0.05, 0.09], sizeEnd: 0.02,
      color: S.ink, alpha: 0.6 }),
    // TERTIARY: a faint ring of script left on the ground in ink (mostly alpha-over: cobalt laid on what is there)
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', add: 0.25, main: 'script', tile: [8, 0.35], scroll: [0.02, 0], at: 0.6, dur: 1.2, scale: 1.55, offset: [0, 0.02, 0], edgeV: [0.3, 0.3],
      erode: [[0, 0.15], [0.5, 0.2], [1, 1]], rampShift: [[0, -0.05], [1, -0.2]], glow: 0.8, core: 0, k: [[0, 0], [0.2, 0.7], [1, 0.7]], turn: 'random' }),
  ] },
  // held: the written circle turning, a brush tracing it, a band of script at the chest
  'domain.spellscription.hold': { layers: [
    // PRIMARY: the written circle on the ground, its line of script turning slowly round
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'script', tile: [8, 0.35], scroll: [0.04, 0], ...HELD, scale: 1.5, offset: [0, 0.03, 0], spin: 0.12, edgeV: [0.3, 0.3],
      erode: 0.08, glow: 1.7, core: 0.3 }),
    // PRIMARY: its inner rim, graduated, counter-turning
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'rays', tile: [56, 1], mainK: 0.6, scroll: [-0.03, 0], ...HELD, scale: 1.15, offset: [0, 0.03, 0], spin: -0.2, edgeV: [0.44, 0.44],
      erode: 0.1, glow: 1.4 }),
    // SECONDARY: the brush tracing round it on a three-second loop, written in and lifted
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'spellscription', main: 'script', tile: [3, 0.5], scroll: [1, 0], ...HELD, loop: 3, scale: 1.55, offset: [0, 0.04, 0], spin: 2.1,
      erode: [[0, 0.65], [0.2, 0.1], [0.8, 0.1], [1, 0.65]], glow: 2, core: 0.5 }),
    // SECONDARY: the band of script circling at chest height
    L({ type: 'shape', form: 'band', ramp: 'spellscription', main: 'script', tile: [5, 1], scroll: [0.2, 0], ...HELD, scale: 0.85, stretch: [1, 0.22, 1], offset: [0, 1.15, 0], spin: 0.5,
      edgeV: [0.3, 0.3], erode: 0.12, rampShift: 0.1, glow: 2 }),
    // TERTIARY: ink motes rising off the circle, and porcelain specks
    L({ type: 'sprites', pool: 'alpha', rate: 4, dur: Infinity, shape: 'soft', spawn: 'ring', r: 1.5, dir: 'up', speed: [0.2, 0.45], life: [1.2, 1.6], size: [0.05, 0.08], sizeEnd: 0.02, color: S.ink, alpha: 0.55 }),
    L({ type: 'sprites', rate: 3, dur: Infinity, shape: 'sparkle', spawn: 'ring', r: 1.5, dir: 'up', speed: [0.3, 0.6], life: [1, 1.4], size: [0.04, 0.07], sizeEnd: 0, color: S.white, colorEnd: S.hi,
      alpha: 0.7, twinkle: 3 }),
  ] },
  // a seal stamped on the point in the camera's plane, a circle written round it
  'domain.spellscription.hit': { layers: [
    // SECONDARY (anticipation): the circle written round the point first, in the camera's plane, its script grown in
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'spellscription', main: 'script', tile: [5, 0.35], scroll: [0.4, 0], dur: 0.48, scale: [[0, 0.35], [0.3, 0.6], [1, 0.7]], edgeV: [0.3, 0.3],
      erode: [[0, 0.8], [0.2, 0.04], [0.6, 0.08], [1, 1]], rampShift: COOL, glow: 2, core: 0.5, turn: 'random' }),
    // PRIMARY: the seal stamped on the struck point in the camera's plane, pressed down hard, its script white-hot then cobalt
    L({ type: 'shape', form: 'quad', face: 'camera', ramp: 'spellscription', main: 'script', tile: [2, 2], mainK: 0.5, scroll: [0, 0.1], at: 0.06, dur: 0.45, scale: [[0, 0.9], [0.15, 0.45], [1, 0.45]],
      edgeU: [0.12, 0.12], edgeV: [0.12, 0.12], erode: [[0, 0], [0.4, 0.05], [1, 1]], rampShift: [[0, 0.4], [0.2, 0.1], [1, -0.3]], glow: 2.4, core: 0.9, coreAt: 0.75, turn: 'random' }),
    // PRIMARY (its heart)
    core('spellscription', 0.06, [[0, 0.2], [1, 0.45]], { dur: 0.12 }),
    // SECONDARY: strokes in the air: the brush's crescents flicked off it
    L({ type: 'sprites', count: [3, 4], shape: 'crescent', spawn: 'sphere', r: 0.3, speed: [0.4, 0.8], life: [0.25, 0.35], size: [0.35, 0.5], sizeEnd: 0.2, spin: [-8, 8], color: S.white, colorEnd: S.body }),
    // TERTIARY: ink motes after it
    L({ type: 'sprites', pool: 'alpha', at: 0.1, count: [5, 7], shape: 'soft', spawn: 'sphere', r: 0.4, dir: 'up', speed: [0.2, 0.5], life: [0.5, 0.8], size: [0.04, 0.07], sizeEnd: 0.02, color: S.ink, alpha: 0.6 }),
  ] },
  // the level-up: five strokes, a circle drawn round the Courier, the seal stamped at the feet, two bands of script
  'domain.spellscription.level': { layers: [
    // SECONDARY (anticipation): five strokes written in the air round the Courier, each a crescent of the running hand flicked into being
    stroke(0, 0.3, 1.5), stroke(0.06, 1.55, 1.5), stroke(0.12, 2.8, 1.5), stroke(0.18, 4.05, 1.5), stroke(0.24, 5.3, 1.5),
    // PRIMARY: the circle drawn on the ground round them: the brush racing round once, the ring of script written in behind it, its rim graduated
    L({ type: 'shape', form: 'crescent', face: 'ground', ramp: 'spellscription', main: 'script', tile: [4, 0.5], scroll: [2, 0], at: 0.25, dur: 0.5, scale: 2.4, offset: [0, 0.04, 0], spin: 13,
      erode: [[0, 0], [0.6, 0.05], [1, 1]], rampShift: [[0, 0.3], [1, -0.2]], glow: 2.5, core: 0.8, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'script', tile: [12, 0.35], scroll: [0.05, 0], at: 0.25, dur: 2, scale: 2.35, offset: [0, 0.03, 0], edgeV: [0.3, 0.3],
      erode: [[0, 0.85], [0.18, 0.04], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.3], [0.2, 0.1], [1, -0.3]], glow: 2.1, core: 0.5, turn: 'random' }),
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'rays', tile: [72, 1], mainK: 0.6, scroll: [-0.05, 0], at: 0.3, dur: 1.95, scale: 1.8, offset: [0, 0.03, 0], edgeV: [0.44, 0.44],
      erode: [[0, 0.85], [0.18, 0.04], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.25], [0.2, 0.08], [1, -0.3]], glow: 1.9, turn: 'random' }),
    // PRIMARY: the seal stamped at the Courier's feet as the circle closes: pressed down hard, white-hot a beat
    L({ type: 'shape', form: 'quad', face: 'ground', ramp: 'spellscription', main: 'script', tile: [3, 3], mainK: 0.5, scroll: [0, 0.1], at: 0.7, dur: 1.2, scale: [[0, 2.2], [0.08, 1.15], [1, 1.15]],
      offset: [0, 0.05, 0], edgeU: [0.12, 0.12], edgeV: [0.12, 0.12], erode: [[0, 0], [0.4, 0.05], [1, 1]], rampShift: [[0, 0.4], [0.1, 0.1], [1, -0.3]], glow: 2.5, core: 0.9, coreAt: 0.75, turn: 'random' }),
    // PRIMARY (its heart)
    core('spellscription', 0.7, [[0, 0.6], [1, 1.6]], { offset: [0, 0.15, 0], stretch: [1, 0.4, 1], dur: 0.16 }),
    // SECONDARY: two bands of script circling the body, at the chest and at the knee, against each other
    L({ type: 'shape', form: 'band', ramp: 'spellscription', main: 'script', tile: [6, 1], scroll: [0.25, 0], at: 0.35, dur: 1.7, scale: 1, stretch: [1, 0.24, 1], offset: [0, 1.2, 0], spin: 0.7,
      edgeV: [0.3, 0.3], erode: [[0, 0.8], [0.2, 0.05], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.3], [0.3, 0.12], [1, -0.3]], glow: 2.4, turn: 'random' }),
    L({ type: 'shape', form: 'band', ramp: 'spellscription', main: 'script', tile: [6, 1], scroll: [-0.3, 0], at: 0.4, dur: 1.65, scale: 1.1, stretch: [1, 0.2, 1], offset: [0, 0.45, 0], spin: -0.8,
      edgeV: [0.3, 0.3], erode: [[0, 0.8], [0.2, 0.05], [0.7, 0.08], [1, 1]], rampShift: [[0, 0.3], [0.3, 0.12], [1, -0.3]], glow: 2.3, turn: 'random' }),
    // SECONDARY: the screen's weight: a porcelain flash, a cobalt lamp, the stamp's small shake
    L({ type: 'flash', at: 0.7, color: S.white, k: 0.2, dur: 0.45 }),
    L({ type: 'light', at: 0.7, color: S.hi, k: 24, range: 8, dur: 1.3, hold: 0.2, up: 1 }),
    L({ type: 'shake', at: 0.7, k: 0.08 }),
    // SECONDARY: talismans rising off the circle
    L({ type: 'sprites', at: 0.7, count: [10, 12], shape: 'talisman', spawn: 'ring', r: 2.3, offset: [0, 0.2, 0], dir: 'up', speed: [0.6, 1.3], drag: 0.7, life: [1, 1.4], size: [0.2, 0.3],
      sizeEnd: 0.12, spin: [-2, 2], color: S.white, colorEnd: S.body }),
    // TERTIARY: ink motes rising, and the written ring left on the ground in ink
    L({ type: 'sprites', pool: 'alpha', at: 0.7, count: [20, 26], shape: 'soft', spawn: 'disc', r: 2.4, dir: 'up', speed: [0.2, 0.55], gravity: -0.1, life: [1.2, 1.8], size: [0.05, 0.1], sizeEnd: 0.02,
      color: S.ink, alpha: 0.6 }),
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', add: 0.25, main: 'script', tile: [12, 0.35], scroll: [0.02, 0], at: 1.1, dur: 1.5, scale: 2.35, offset: [0, 0.02, 0], edgeV: [0.3, 0.3],
      erode: [[0, 0.15], [0.5, 0.2], [1, 1]], rampShift: [[0, -0.05], [1, -0.2]], glow: 0.8, core: 0, k: [[0, 0], [0.2, 0.7], [1, 0.7]], turn: 'random' }),
  ] },
};
