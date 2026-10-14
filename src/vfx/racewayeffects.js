// ---------------------------------------------------------------------------------------
// THE RACEWAY'S EFFECTS: the library's entries (vfx/library.js spreads them in) for the Solar Skiff's carve and the sun plates, played by
// the Raceway's looks (vfx/racewaylooks.js) on the shared particle pools. Data only: the numbers are the look.
//   skiff.carve.charge.1 / .2 / .3   held while a carve loads, at the board's outside edge: sand; gold sparks; white-gold sparks
//   skiff.carve.sail                 held at tier 3 round the sail: its glow and motes
//   skiff.carve.tier                 a tier reached: a ring and a spit of sparks in the tier's colour (`tint`)
//   skiff.carve.release              the carve let go: a flash, a ring, sand thrown back, sparks (`power` the tier's)
//   skiff.carve.wake                 the short sand wake after a release, held at the stern (0.5 to 1.1 real seconds by tier)
//   skiff.boost                      held at the stern while the board is pushed (skiff.boosting, `k`): Lachryma thrown back
//   skiff.pop.perfect / .late / .miss   the late pop nailed (the sun's glyph struck in Lachryma) / taken / let go too late (a dud)
//   skiff.combo.link / .step / .bank / .drop   the trick combo's moments (its gauge: vfx/skiffcombomarks.js)
//   raceway.plate / .dark            a sun plate ridden over: a ring of light out over the sand, a flash, glints rising, the push on up
//                                    the track (`power` and `tint` the sun's) / a dark plate (night): cold, dull, no push
//   raceway.lamp / raceway.gate      held on a lit countdown lamp / the next gate's marks: a soft glow (`k` its brightness)
//   raceway.lamp.go / raceway.gate.pass   GO's flare at each lamp / a gate passed
//   raceway.grind.on / .off          the keel locking onto a rail / letting go (`power`: more for a pop off)
//   raceway.grind.sparks             held at the board's contact while it grinds: sparks and sand thrown back off the rail
//   raceway.grind.streak             held there too: light left on the rail's top behind the board, a bright streak fading back
//   raceway.grind.hum                held under the board: a soft gold glow and motes, the keel's hum made light
//   raceway.ring.pass / .draw        a sun ring flown through: the flash at its heart / motes drawn in round its rim and out through it
//
// Prior art: Mario Kart's drift sparks and mini-turbo tiers (blue, orange, purple: ours are sand, gold, white), the rooster tail of
// Wave Race's and Jet Moto's craft (the sand thrown off the edge, the wake after), Tony Hawk's and Jet Set Radio's grind sparks
// (thrown back off the contact, the rail lit behind), Sonic Riders' rings (a flash and the air pulled through), F-Zero's dash plates (the flash and the ring as one
// is crossed), Mario Kart 8's boost flames and SSX's trick boost (the push worn on the craft), Tony Hawk's 'perfect' landing and
// Sonic Riders' trick rank (the nailed moment marked on the board), the library's own families (an `extends` chain: a tier adds to the one below).
// ---------------------------------------------------------------------------------------
/** Lachryma's colour, as the boost and every feat of the skiff's push wear it (Dovina's LACHRYMA_TINT, made the look's; the oil film's
 *  hue shift walks through it where a layer says 'film': vfx/oxidation.js featTint). */
export const LACHRYMA_TINT = 0x7fdcff;
/** The same, deep: blended over (the alpha pool, the combo's marks), so it still reads as Lachryma on noon sand, where the pale one
 *  added to the sand washes to white (measured headless, 2026-10-14). */
export const LACHRYMA_DEEP = 0x2a9ee6;
const SAND = [0xc98a52, 0xb8834e, 0xf0c890]; // (the Dunes' sand in its shade and its crest, world/ground/groundmarks.js: thrown grains read darker than the ground they leave)

export const RACEWAY_EFFECTS = {
  // ---- the carve as it loads (round 3, the owner after his first race: much bigger, clearly up a tier): tier 1 a rooster tail of sand
  // off the edge; tier 2 gold sparks over it and the tail taller; tier 3 a real spray: white-gold sparks, stars, a wall of sand, and
  // the load's Lachryma showing in the film's glints (the push it will be)
  'skiff.carve.charge.1': { layers: [
    { type: 'sprites', pool: 'alpha', rate: 220, dur: Infinity, shape: 'chip', dir: 'cone', cone: 30, speed: [4, 9], size: [0.1, 0.2], sizeEnd: 0.05, life: [0.4, 0.7], gravity: 9, drag: 1.1, color: SAND, alpha: 0.95, alphaEnd: 0.6, spin: [-8, 8], inherit: 0.5 },
    { type: 'sprites', pool: 'alpha', rate: 50, dur: Infinity, shape: 'puff', dir: 'cone', cone: 40, speed: [2, 4.5], size: [0.5, 0.8], sizeEnd: 2.4, life: [0.6, 0.95], drag: 2.6, gravity: -0.2, color: 0xf6dcb0, alpha: 0.5, spin: [-1, 1], inherit: 0.3 },
  ] },
  'skiff.carve.charge.2': { extends: 'skiff.carve.charge.1', layers: [
    { type: 'sprites', rate: 150, dur: Infinity, shape: 'streak', dir: 'cone', cone: 34, speed: [8, 14], size: [0.2, 0.32], sizeEnd: 0.04, life: [0.25, 0.45], stretch: 2, drag: 2.2, gravity: 5, color: 'gold', colorEnd: 0xff9a3c, inherit: 0.5 },
    { type: 'sprites', pool: 'alpha', rate: 120, dur: Infinity, shape: 'chip', dir: 'cone', cone: 22, speed: [7, 12], size: [0.14, 0.24], sizeEnd: 0.06, life: [0.5, 0.8], gravity: 9, drag: 0.9, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8], inherit: 0.5 },
  ] },
  'skiff.carve.charge.3': { extends: 'skiff.carve.charge.2', layers: [
    { type: 'sprites', rate: 200, dur: Infinity, shape: 'streak', dir: 'cone', cone: 28, speed: [11, 18], size: [0.24, 0.36], sizeEnd: 0.04, life: [0.25, 0.45], stretch: 2.4, drag: 2.6, gravity: 6, color: 0xfff3d0, colorEnd: 'gold', inherit: 0.5 },
    { type: 'sprites', rate: 60, dur: Infinity, shape: 'star4', dir: 'cone', cone: 45, speed: [4, 8], size: [0.4, 0.6], sizeEnd: 0, life: [0.18, 0.34], drag: 4, color: 'white', colorEnd: 'gold', spin: [-6, 6] },
    { type: 'sprites', pool: 'alpha', rate: 60, dur: Infinity, shape: 'puff', dir: 'cone', cone: 30, speed: [4, 8], size: [0.8, 1.2], sizeEnd: 3.5, life: [0.7, 1.1], drag: 2.2, gravity: -0.1, color: 0xf6dcb0, alpha: 0.55, spin: [-1, 1], inherit: 0.4 },
    { type: 'sprites', rate: 40, dur: Infinity, shape: 'glint', dir: 'cone', cone: 50, speed: [3, 7], size: [0.3, 0.45], sizeEnd: 0, life: [0.25, 0.45], drag: 3, color: 'film', colorEnd: LACHRYMA_TINT, twinkle: 18 },
  ] },
  'skiff.carve.sail': { layers: [ // (the sail's glow at tier 3: soft cores over each other, motes rising off it, the load's Lachryma in it)
    { type: 'sprites', rate: 30, dur: Infinity, shape: 'core', spawn: 'sphere', r: 0.6, size: [2.4, 3.0], sizeEnd: 3.6, life: 0.3, color: 'gold', alpha: 0.22, alphaEnd: 0 },
    { type: 'sprites', rate: 28, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 1.5, dir: 'up', speed: [0.5, 1.5], size: [0.14, 0.24], sizeEnd: 0, life: [0.4, 0.7], drag: 1, color: ['white', LACHRYMA_TINT], colorEnd: 'gold' },
  ] },
  'skiff.carve.tier': { layers: [ // (`power` the tier: a bigger ring and more sparks each step up)
    { type: 'sprites', count: 1, shape: 'ring', size: 0.5, sizeEnd: 3.2, life: 0.26, color: 'tint', alphaEnd: 0, rot: 0 },
    { type: 'sprites', count: 1, shape: 'core', size: 2.2, sizeEnd: 0.4, life: 0.16, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', count: 14, shape: 'streak', dir: 'cone', cone: 75, speed: [6, 11], size: [0.16, 0.24], sizeEnd: 0.03, life: [0.18, 0.3], stretch: 1.8, drag: 5, color: 'tint', colorEnd: 'white' },
  ] },
  // ---- the carve let go: a burst off the stern, the sand thrown back, and the push in Lachryma's colour (`power`: the tier, 1..3)
  'skiff.carve.release': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 2.4, sizeEnd: 0.3, life: 0.18, color: 'white', colorEnd: LACHRYMA_TINT, powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.5, sizeEnd: 4.2, life: 0.32, color: 'tint', alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.8, sizeEnd: 6, life: 0.4, color: LACHRYMA_TINT, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', pool: 'alpha', count: 16, shape: 'puff', dir: 'cone', cone: 50, speed: [2.5, 6], size: [0.5, 0.8], sizeEnd: 2.2, life: [0.7, 1.1], drag: 3, gravity: -0.3, color: 0xe8b070, alpha: 0.5, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: 30, shape: 'chip', dir: 'cone', cone: 40, speed: [5, 11], size: [0.07, 0.14], life: [0.45, 0.8], gravity: 9, drag: 1, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8] },
    { type: 'sprites', count: 12, shape: 'streak', dir: 'cone', cone: 35, speed: [8, 14], size: [0.16, 0.26], sizeEnd: 0.03, life: [0.2, 0.36], stretch: 1.8, drag: 3, color: 'tint', colorEnd: 'white' },
    { type: 'sprites', count: 10, shape: 'streak', dir: 'cone', cone: 14, speed: [14, 20], size: [0.2, 0.3], sizeEnd: 0.03, life: [0.25, 0.4], stretch: 2.6, drag: 2.5, color: LACHRYMA_TINT, colorEnd: 'film' },
    { type: 'sprites', pool: 'alpha', count: 10, shape: 'streak', dir: 'cone', cone: 18, speed: [12, 18], size: [0.22, 0.32], sizeEnd: 0.03, life: [0.25, 0.4], stretch: 2.4, drag: 2.5, color: LACHRYMA_DEEP, alpha: 0.9, alphaEnd: 0 },
    { type: 'light', color: LACHRYMA_TINT, range: 9, k: 12, dur: 0.35, up: 0.6 },
  ] },
  'skiff.carve.wake': { layers: [ // (held while `follow` says: longer for a higher tier)
    { type: 'sprites', pool: 'alpha', rate: 90, dur: Infinity, shape: 'puff', spawn: 'disc', r: 0.6, dir: 'up', speed: [0.6, 1.8], size: [0.4, 0.6], sizeEnd: 1.6, life: [0.6, 1.0], drag: 2.5, gravity: -0.1, color: 0xe8b070, alpha: 0.42, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', rate: 90, dur: Infinity, shape: 'chip', dir: 'cone', cone: 50, speed: [2.5, 5], size: [0.05, 0.1], life: [0.3, 0.55], gravity: 9, drag: 1, color: SAND, alpha: 0.9, alphaEnd: 0.5 },
    { type: 'sprites', rate: 30, dur: Infinity, shape: 'glint', spawn: 'disc', r: 0.4, dir: 'up', speed: [0.3, 1], size: [0.2, 0.3], sizeEnd: 0, life: [0.25, 0.4], color: LACHRYMA_TINT, colorEnd: 'film' },
  ] },
  // ---- every boost (Shift's flare, a carve's, a plate's, a ring's, the solar start's push: skiff.boosting), held at the stern with
  // `k` its strength: Lachryma thrown back off the hull, the oil film walking through it (`phase`), a soft glow at the engine
  'skiff.boost': { layers: [
    { type: 'sprites', rate: 70, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.3, dir: 'cone', cone: 10, speed: [6, 10], size: [0.16, 0.26], sizeEnd: 0.02, life: [0.18, 0.3], stretch: 2.2, drag: 3, color: LACHRYMA_TINT, colorEnd: 'film' },
    { type: 'sprites', rate: 40, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.5, dir: 'cone', cone: 30, speed: [1.5, 3.5], size: [0.12, 0.2], sizeEnd: 0, life: [0.3, 0.5], drag: 2, color: 'film', colorEnd: LACHRYMA_TINT },
    { type: 'sprites', rate: 26, dur: Infinity, shape: 'core', spawn: 'sphere', r: 0.15, size: [1.3, 1.7], sizeEnd: 2.1, life: 0.22, color: LACHRYMA_TINT, alpha: 0.3, alphaEnd: 0 },
    { type: 'sprites', pool: 'alpha', rate: 50, dur: Infinity, shape: 'streak', spawn: 'sphere', r: 0.35, dir: 'cone', cone: 12, speed: [5, 9], size: [0.2, 0.3], sizeEnd: 0.03, life: [0.2, 0.34], stretch: 2.2, drag: 3, color: LACHRYMA_DEEP, alpha: 0.85, alphaEnd: 0 },
  ] },
  // ---- the late pop (skiff.pop): a perfect one nailed is the sun's glyph struck in Lachryma on the board, rays out flat round it, a
  // ring on the sand, a star at its heart; a plain late pop a small ring; one let go too late (skiff.pop.miss) a dud puff of dust
  'skiff.pop.perfect': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 3.4, sizeEnd: 0.4, life: 0.2, color: 'white', colorEnd: LACHRYMA_TINT, powerCount: false },
    { type: 'sprites', count: 1, shape: 'star4', size: 3.2, sizeEnd: 0, life: 0.4, color: 'white', colorEnd: LACHRYMA_TINT, rot: 0, powerCount: false },
    { type: 'sprites', count: 1, shape: 'ring', size: 0.6, sizeEnd: 5, life: 0.34, color: LACHRYMA_TINT, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 20, shape: 'streak', spawn: 'ring', r: 0.5, dir: 'out', lift: 0, speed: [10, 14], size: [0.28, 0.4], sizeEnd: 0.04, life: [0.22, 0.32], stretch: 2.6, drag: 5, color: 'white', colorEnd: LACHRYMA_TINT },
    { type: 'sprites', pool: 'alpha', count: 16, shape: 'streak', spawn: 'ring', r: 0.6, dir: 'out', lift: 0, speed: [9, 12], size: [0.3, 0.42], sizeEnd: 0.05, life: [0.26, 0.36], stretch: 2.6, drag: 5, color: LACHRYMA_DEEP, alpha: 0.9, alphaEnd: 0 },
    { type: 'sprites', pool: 'alpha', count: 1, shape: 'ring', size: 0.8, sizeEnd: 5.4, life: 0.4, color: LACHRYMA_DEEP, alpha: 0.85, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 14, shape: 'sparkle', spawn: 'sphere', r: 0.8, dir: 'sphere', speed: [2, 4], size: [0.2, 0.32], sizeEnd: 0, life: [0.4, 0.7], drag: 2.5, color: 'film', colorEnd: 'white' },
    { type: 'decal', tex: 'shockring', dur: 0.45, scale: [[0, 1.5], [1, 7]], tint: LACHRYMA_TINT, glow: 1.5, offset: [0, -0.5, 0], k: [[0, 1], [0.4, 0.8], [1, 0]] },
    { type: 'light', color: LACHRYMA_TINT, range: 10, k: 18, dur: 0.4, up: 0.4 },
  ] },
  'skiff.pop.late': { layers: [
    { type: 'sprites', count: 1, shape: 'ringthin', size: 0.5, sizeEnd: 2.6, life: 0.24, color: 0xffe2a0, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 6, shape: 'glint', spawn: 'ring', r: 0.4, dir: 'out', lift: 0, speed: [4, 6], size: [0.18, 0.26], sizeEnd: 0, life: [0.2, 0.3], drag: 4, color: 'white', colorEnd: 'gold' },
  ] },
  'skiff.pop.miss': { layers: [
    { type: 'sprites', pool: 'alpha', count: 5, shape: 'puff', spawn: 'disc', r: 0.5, dir: 'out', lift: 0.3, speed: [0.5, 1.2], size: [0.4, 0.6], sizeEnd: 1.1, life: [0.5, 0.8], drag: 3, gravity: 0.4, color: 0xb8a48c, alpha: 0.45, spin: [-1, 1] },
    { type: 'sprites', pool: 'alpha', count: 4, shape: 'chip', dir: 'sphere', speed: [0.8, 1.8], size: [0.05, 0.08], life: [0.3, 0.5], gravity: 9, color: 0x8a7a66, alpha: 0.8, alphaEnd: 0.4 },
  ] },
  // ---- the trick combo's moments (vfx/skiffcombomarks.js is its gauge): a link, a step of the multiplier, a bank, a drop
  'skiff.combo.link': { layers: [
    { type: 'sprites', count: 1, shape: 'ringthin', size: 1, sizeEnd: 3.4, life: 0.24, color: LACHRYMA_TINT, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 5, shape: 'sparkle', spawn: 'ring', r: 2.3, dir: 'up', speed: [0.6, 1.4], size: [0.16, 0.24], sizeEnd: 0, life: [0.3, 0.5], drag: 2, color: 'film', colorEnd: LACHRYMA_TINT },
    { type: 'sprites', pool: 'alpha', count: 1, shape: 'ringthin', size: 1.2, sizeEnd: 3.6, life: 0.26, color: LACHRYMA_DEEP, alpha: 0.8, alphaEnd: 0, rot: 0, powerCount: false },
  ] },
  'skiff.combo.step': { layers: [ // (at the bow's pips: a multiplier's step taken)
    { type: 'sprites', count: 1, shape: 'star4', size: 1.8, sizeEnd: 0, life: 0.3, color: 'white', colorEnd: LACHRYMA_TINT, rot: 0, powerCount: false },
    { type: 'sprites', count: 6, shape: 'glint', spawn: 'sphere', r: 0.3, dir: 'up', speed: [1.5, 3], size: [0.2, 0.3], sizeEnd: 0, life: [0.25, 0.4], drag: 2, color: 'film', colorEnd: 'white' },
  ] },
  'skiff.combo.bank': { layers: [ // (the chain banked into flares: its light drawn in off the ring to the stern's suns)
    { type: 'sprites', count: 22, shape: 'glint', spawn: 'ring', r: 2.4, dir: 'in', speed: [3, 5], size: [0.22, 0.34], sizeEnd: 0, life: [0.4, 0.55], drag: 1, color: LACHRYMA_TINT, colorEnd: 'film' },
    { type: 'sprites', pool: 'alpha', count: 14, shape: 'diamond', spawn: 'ring', r: 2.4, dir: 'in', speed: [3, 5], size: [0.2, 0.3], sizeEnd: 0.05, life: [0.4, 0.55], drag: 1, color: LACHRYMA_DEEP, alpha: 0.9, alphaEnd: 0.2 },
    { type: 'sprites', count: 1, shape: 'ring', size: 4.8, sizeEnd: 0.6, life: 0.36, color: LACHRYMA_TINT, alpha: 0.8, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 1, shape: 'core', size: 2.6, sizeEnd: 0.6, life: 0.3, at: 0.25, color: 'white', colorEnd: LACHRYMA_TINT, powerCount: false },
    { type: 'light', color: LACHRYMA_TINT, range: 8, k: 10, dur: 0.45, up: 0.3 },
  ] },
  'skiff.combo.drop': { layers: [ // (the chain lost: the ring breaks into dull flakes that fall away, no light)
    { type: 'sprites', pool: 'alpha', count: 18, shape: 'chip', spawn: 'ring', r: 2.4, dir: 'out', lift: 0.6, speed: [1, 2.5], size: [0.08, 0.14], life: [0.5, 0.8], gravity: 9, drag: 1, color: [0x6a6478, 0x8a8070], alpha: 0.85, alphaEnd: 0.3, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: 6, shape: 'puff', spawn: 'ring', r: 2.2, dir: 'up', speed: [0.3, 0.8], size: [0.4, 0.6], sizeEnd: 1.2, life: [0.5, 0.8], drag: 2, color: 0x9a9088, alpha: 0.35 },
  ] },
  // ---- the start arch's lamps and the gates' marks: a glow held on each lit one (`k` its brightness), GO's flare, a gate passed
  'raceway.lamp': { layers: [
    { type: 'sprites', rate: 26, dur: Infinity, shape: 'core', size: [2.6, 3.2], sizeEnd: 3.6, life: 0.3, color: 0xffd27a, alpha: 0.3, alphaEnd: 0 },
  ] },
  'raceway.lamp.go': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 5, sizeEnd: 2, life: 0.4, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', count: 1, shape: 'ring', size: 1, sizeEnd: 5, life: 0.35, color: 0xfff4dc, alphaEnd: 0, rot: 0 },
    { type: 'sprites', count: 10, shape: 'sparkle', spawn: 'sphere', r: 0.8, dir: 'sphere', speed: [1.5, 3], size: [0.2, 0.3], sizeEnd: 0, life: [0.35, 0.6], drag: 3, color: 'white', colorEnd: 'gold' },
  ] },
  'raceway.gate': { layers: [
    { type: 'sprites', rate: 22, dur: Infinity, shape: 'core', size: [1.8, 2.3], sizeEnd: 2.6, life: 0.3, color: 0xffd27a, alpha: 0.3, alphaEnd: 0 },
  ] },
  'raceway.gate.pass': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 3.4, sizeEnd: 1, life: 0.3, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', count: 8, shape: 'glint', spawn: 'sphere', r: 0.6, dir: 'up', speed: [1.5, 3], size: [0.2, 0.3], sizeEnd: 0, life: [0.3, 0.5], drag: 2, color: 'white', colorEnd: 'gold' },
  ] },
  // ---- a sun plate ridden over: F-Zero's dash plate, a ring of light run out over the sand (`tint` and `power` the sun's: dimmer and
  // cooler toward dusk) and the push in Lachryma's colour thrown on up the track (`dir` the track's way); a dark plate (power 0, night)
  // answers cold and dull: a grey ring that hardly shows, dust, no light, no push
  'raceway.plate': { layers: [
    { type: 'decal', tex: 'shockring', dur: 0.55, scale: [[0, 2.5], [1, 10]], tint: 'tint', glow: 1.6, offset: [0, 0.15, 0], k: [[0, 1], [0.4, 0.8], [1, 0]] },
    { type: 'sprites', count: 1, shape: 'core', size: 3.6, sizeEnd: 1, life: 0.25, color: 'white', colorEnd: 'tint', powerCount: false },
    { type: 'sprites', count: [14, 18], shape: 'glint', spawn: 'disc', r: 2.2, dir: 'up', speed: [2, 5], size: [0.25, 0.4], sizeEnd: 0, life: [0.35, 0.6], drag: 2, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', count: 12, shape: 'streak', spawn: 'disc', r: 1.2, dir: 'cone', cone: 10, speed: [14, 20], size: [0.22, 0.32], sizeEnd: 0.03, life: [0.25, 0.4], stretch: 2.6, drag: 2.5, color: LACHRYMA_TINT, colorEnd: 'film' },
    { type: 'sprites', pool: 'alpha', count: 8, shape: 'streak', spawn: 'disc', r: 1.2, dir: 'cone', cone: 10, speed: [13, 18], size: [0.24, 0.34], sizeEnd: 0.04, life: [0.28, 0.42], stretch: 2.6, drag: 2.5, color: LACHRYMA_DEEP, alpha: 0.85, alphaEnd: 0 },
    { type: 'light', color: 0xffd27a, range: 12, k: 25, dur: 0.45, up: 1 },
  ] },
  'raceway.plate.dark': { layers: [
    { type: 'decal', tex: 'shockring', dur: 0.5, scale: [[0, 2], [1, 5]], tint: 0x4a5266, glow: 0.5, offset: [0, 0.15, 0], k: [[0, 0.6], [1, 0]] },
    { type: 'sprites', pool: 'alpha', count: 6, shape: 'puff', spawn: 'disc', r: 1.6, dir: 'up', speed: [0.3, 0.8], size: [0.4, 0.6], sizeEnd: 1.2, life: [0.5, 0.8], drag: 2, color: 0x9a948c, alpha: 0.35 },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 1, sizeEnd: 3, life: 0.3, color: 0x6e7a90, alpha: 0.5, alphaEnd: 0, rot: 0, powerCount: false },
  ] },
  // ---- the grind: the keel locked on a rail (skiff.grind .. skiff.grind.end), at the board's contact, `dir` back along the rail
  'raceway.grind.on': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 1.8, sizeEnd: 0.3, life: 0.16, color: 'white', colorEnd: 'gold', powerCount: false },
    { type: 'sprites', count: 14, shape: 'streak', dir: 'cone', cone: 75, speed: [5, 10], size: [0.12, 0.2], sizeEnd: 0.02, life: [0.15, 0.3], stretch: 1.6, drag: 4, gravity: 6, color: 'white', colorEnd: 'gold' },
  ] },
  'raceway.grind.sparks': { layers: [
    { type: 'sprites', rate: 110, dur: Infinity, shape: 'streak', dir: 'cone', cone: 30, speed: [6, 12], size: [0.1, 0.18], sizeEnd: 0.02, life: [0.18, 0.34], stretch: 1.8, drag: 2.5, gravity: 9, color: 0xfff3d0, colorEnd: 0xff9a3c, inherit: 0.4 },
    { type: 'sprites', rate: 40, dur: Infinity, shape: 'star4', dir: 'cone', cone: 50, speed: [1, 3], size: [0.14, 0.24], sizeEnd: 0, life: [0.08, 0.16], drag: 4, color: 'white', colorEnd: 'gold', spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', rate: 70, dur: Infinity, shape: 'chip', dir: 'cone', cone: 45, speed: [2, 5], size: [0.05, 0.1], sizeEnd: 0.03, life: [0.35, 0.6], gravity: 9, drag: 1.2, color: SAND, alpha: 0.95, alphaEnd: 0.5, spin: [-8, 8], inherit: 0.3 },
    { type: 'sprites', pool: 'alpha', rate: 18, dur: Infinity, shape: 'puff', dir: 'cone', cone: 50, speed: [0.6, 1.6], size: [0.3, 0.45], sizeEnd: 1.2, life: [0.4, 0.7], drag: 3, gravity: -0.2, color: 0xf6dcb0, alpha: 0.4, spin: [-1, 1] },
  ] },
  'raceway.grind.streak': { layers: [ // (still where they are born: a run of them left behind at speed reads as one streak along the rail's top)
    { type: 'sprites', rate: 120, dur: Infinity, shape: 'core', size: [0.26, 0.32], sizeEnd: 0.06, life: [0.35, 0.45], color: 'white', colorEnd: 'gold', alpha: 0.9 },
    { type: 'sprites', rate: 30, dur: Infinity, shape: 'glint', size: [0.3, 0.45], sizeEnd: 0, life: [0.2, 0.35], color: 'white', colorEnd: 'gold', twinkle: 20 },
  ] },
  'raceway.grind.hum': { layers: [
    { type: 'sprites', rate: 24, dur: Infinity, shape: 'core', spawn: 'sphere', r: 0.2, size: [1.4, 1.8], sizeEnd: 2.1, life: 0.3, color: 0xffd27a, alpha: 0.24, alphaEnd: 0 },
    { type: 'sprites', rate: 14, dur: Infinity, shape: 'sparkle', spawn: 'disc', r: 0.6, dir: 'up', speed: [0.3, 0.9], size: [0.08, 0.14], sizeEnd: 0, life: [0.3, 0.55], drag: 1, color: 'white', colorEnd: 'gold', inherit: 0.85 },
  ] },
  'raceway.grind.off': { layers: [
    { type: 'sprites', count: 1, shape: 'ring', size: 0.3, sizeEnd: 2.2, life: 0.24, color: 0xffe2a0, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 10, shape: 'streak', dir: 'sphere', speed: [4, 8], size: [0.1, 0.18], sizeEnd: 0.02, life: [0.15, 0.28], stretch: 1.4, drag: 4, gravity: 6, color: 'white', colorEnd: 'gold' },
    { type: 'sprites', pool: 'alpha', count: 8, shape: 'chip', dir: 'sphere', speed: [2, 4], size: [0.05, 0.09], life: [0.3, 0.5], gravity: 9, drag: 1, color: SAND, alpha: 0.9, alphaEnd: 0.5 },
  ] },
  // ---- a sun ring flown through: the flash at its heart, and the air's motes drawn in round its rim and out through it
  'raceway.ring.pass': { layers: [
    { type: 'sprites', count: 1, shape: 'core', size: 7, sizeEnd: 2, life: 0.3, color: 'white', colorEnd: 'gold', powerCount: false },
    { type: 'sprites', count: 1, shape: 'ringthin', size: 6.4, sizeEnd: 10, life: 0.4, color: 0xfff0c8, alphaEnd: 0, rot: 0, powerCount: false },
    { type: 'sprites', count: 12, shape: 'sparkle', spawn: 'sphere', r: 1.2, dir: 'sphere', speed: [1.5, 3.5], size: [0.22, 0.34], sizeEnd: 0, life: [0.4, 0.7], drag: 2.5, color: 'white', colorEnd: 'gold' },
    { type: 'light', color: 0xffd27a, range: 14, k: 22, dur: 0.4, up: 0 },
  ] },
  'raceway.ring.draw': { layers: [ // (played round the rim, upstream: `dir` the way in, through the heart)
    { type: 'sprites', count: [3, 4], shape: 'glint', spawn: 'sphere', r: 0.5, dir: 'cone', cone: 6, speed: [9, 13], size: [0.2, 0.3], sizeEnd: 0, life: [0.45, 0.6], drag: 1.6, color: 'gold', colorEnd: 'white' },
    { type: 'sprites', count: 2, shape: 'streak', spawn: 'sphere', r: 0.4, dir: 'cone', cone: 4, speed: [10, 14], size: [0.14, 0.2], sizeEnd: 0.02, life: [0.4, 0.55], stretch: 2, drag: 1.6, color: 'white', colorEnd: 'gold' },
  ] },
};
