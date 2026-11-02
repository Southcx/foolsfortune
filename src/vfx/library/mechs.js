// ---------------------------------------------------------------------------------------
// A PART'S SPECIAL'S EFFECTS (library entries: vfx/library.js spreads them in; vfx/mechs/speciallooks.js plays them on `mech.special`):
// each kind of special (progress/mechs/specials.js PART_SPECIALS, world/hangar/mechspecials.js) drawn in its domain's grammar
// (vfx/library/domains.js) at the frame's own scale: a 14 to 16 m frame, so every shape is written in metres for it (5 to 40 times
// the Courier's), never the Courier's effect played big (a sprite's speed is not scaled with its size). `scale` (the context's) is
// the special's strength (specialK, 1 .. 1.6 at a domain's level 99), so an amplified special reads wider; `power` its count.
//   mech.scan.iris     Divination's iris opened at the head's lens, a sonar hoop pinged out flat in the camera's plane
//   mech.scan.sweep    a cone of thin rings swept from the head to the giant (played at the giant, `dir` back to the head, `scale` its length)
//   mech.scan.mark     held on the giant's weak point while it is marked: the iris over it, two hoops turning, a ring of ticks, specks
//   mech.ward.cast     Spellscription's: strokes written in the air round the frame, the circle drawn on the ground, the seal stamped
//   mech.ward.hold     held while the barrier lasts: the written circle turning, a band of script, its ink (the bubble itself is
//                      vfx/caster/bubble.js's, the looks module's)
//   mech.hasten.hold   held on the frame: Ouranurgy's graduated hoops falling over it, one after another, stars through them
//   mech.hasten.halo   held at the head: the clock's ring of hours behind it, its hand sweeping
//   mech.sunder.edge   Alteration's band run along the clay blade (`scale` its length, `dir` its line)
//   mech.sunder.crumble  the blade crumbling (`from`, `to` its line): clay chips and dust falling off it, a flambe glint along it
//   mech.gust.cone     Psychokinesis's cone of wind (played at its far end, `dir` back to the chest, `scale` its reach)
//   mech.gust          its push: the wave thrown out along the ground, dust driven ahead, debris lifted and flung
//   mech.quake         the ground heaved round the feet (`scale` its ring's radius / 12 m): a shock ring, a wall of dust, clods thrown
//   mech.blink.step    at each end of the portal: Ouranurgy's ring closing and a shaft dropped (the eyes are vfx/caster/portal.js's)
//   mech.pull.tether   Psychokinesis's tether from the hand to what it draws (`scale` its length, `dir` to the thing), its motes
//                      running in along it (`from` the thing, `to` the hand)
//   mech.pull.snap     where the thing was taken from: dust and chips left behind, a ring
//   mech.ready         a part's special rested: a gold glint and a thin ring on the part
// Prior art: the house's domain grammars (vfx/library/domains.js: Riot's primary, secondary and tertiary; Kevin Leroy's 0.1 s hit frame),
// Gundam's and Zone of the Enders' sub-weapons drawn at the frame's weight, Pacific Rim's and Evangelion's AT Field (a barrier that
// rings where it is struck), Shadow of the Colossus's dust off a giant's step.
//
//   MECH_SPECIAL_EFFECTS
// ---------------------------------------------------------------------------------------
import { DOMAIN_LOOK } from '../../ui/domainlook.js';

const L = (o) => o;
const hex = (d, k) => parseInt(DOMAIN_LOOK[d].colours[k].slice(1), 16);
const D = { accent: hex('divination', 'accent'), edge: hex('divination', 'edge'), silver: 0xf2f0ff };
const S = { body: hex('spellscription', 'body'), hi: 0x8aa4dc, white: hex('spellscription', 'ground') };
const O = { body: hex('ouranurgy', 'body'), star: 0xf4fbff };
const P = { body: hex('psychokinesis', 'body'), hi: 0xd88a7a, pale: 0xf6e0d8 };
const A = { red: hex('alteration', 'body'), blue: hex('alteration', 'accent') };
const CLAY = [0xb5653a, 0x9a4f2c, 0xd99a6c], SAND = [0xd9b98a, 0xc9a674, 0xe6cfa4], DUST = [0xcbb8a4, 0xb9a48e];
const HELD = { dur: Infinity, in: 3, out: 2.5 };
const OUT = [[0, 0], [0.45, 0.05], [1, 1]];
const COOL = [[0, 0.22], [0.25, 0.06], [1, -0.36]];

export const MECH_SPECIAL_EFFECTS = {
  // =============================================================================================== SCAN (the head's: Divination)
  'mech.scan.iris': { layers: [
    // PRIMARY: the iris at the lens, narrowing then opening wide, its pupil's rays turning
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'divination', main: 'rays', tile: [28, 1], scroll: [0.4, 0], dur: 0.9,
      scale: [[0, 3.2], [0.3, 1.1], [0.7, 3], [1, 3.4]], edgeV: [0.2, 0.3], erode: [[0, 0.2], [0.2, 0.04], [0.7, 0.1], [1, 1]], rampShift: COOL, glow: 2.4, core: 0.6 }),
    // SECONDARY: a sonar hoop pinged out from it, flat in the camera's plane
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'divination', main: 'none', at: 0.22, dur: 0.7, scale: [[0, 1.5], [1, 9]], erode: [[0, 0.04], [0.6, 0.12], [1, 1]], glow: 2.2 }),
    L({ type: 'sprites', at: 0.2, count: [10, 14], shape: 'star4', spawn: 'sphere', r: 2.2, dir: 'sphere', speed: [0.5, 1.5], size: [0.35, 0.6], sizeEnd: 0, life: [0.5, 0.9], color: [D.accent, D.silver], twinkle: 6 }),
  ] },
  'mech.scan.sweep': { layers: [
    // PRIMARY: a cone of thin rings from the head (its tip) widening to the giant (its base), swept out once
    L({ type: 'shape', form: 'cone', face: 'dir', ramp: 'divination', main: 'ripple', tile: [1, 10], scroll: [0, 3], mask: 'noise', maskTile: [2, 2], dur: 0.85, stretch: [0.22, 1, 0.22],
      edgeV: [0.05, 0.25], rim: -0.5, erode: [[0, 0.5], [0.15, 0.06], [0.6, 0.12], [1, 1]], rampShift: COOL, glow: 1.6, core: 0.2, add: 1, back: 0.2 }),
    L({ type: 'shape', form: 'cone', face: 'dir', ramp: 'divination', main: 'rays', tile: [24, 1], scroll: [0.3, 0], at: 0.08, dur: 0.6, stretch: [0.12, 1, 0.12],
      edgeV: [0.05, 0.4], rim: -0.6, erode: [[0, 0.4], [0.2, 0.08], [1, 1]], glow: 1.8, core: 0.3 }),
  ] },
  'mech.scan.mark': { layers: [
    // PRIMARY: the iris held over the weak point, breathing
    L({ type: 'shape', form: 'disc', face: 'camera', ramp: 'divination', main: 'rays', tile: [20, 1], scroll: [0.15, 0], ...HELD, loop: 2.4,
      scale: [[0, 1.7], [0.5, 2.2], [1, 1.7]], edgeV: [0.25, 0.3], erode: 0.08, glow: 2, core: 0.5 }),
    // SECONDARY: two hoops turning against each other round it, and a graduated ring of ticks
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'divination', main: 'none', ...HELD, scale: 3.4, stretch: [1, 1, 0.35], rot: 0.5, spin: 0.9, glow: 2 }),
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'divination', main: 'none', ...HELD, scale: 3, stretch: [1, 1, 0.35], rot: -0.8, spin: -0.7, glow: 2 }),
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'divination', main: 'rays', tile: [36, 1], mainK: 0.8, ...HELD, scale: 4.4, spin: 0.25, edgeV: [0.6, 0.15], glow: 1.7 }),
    // SECONDARY: a ping out from it every 1.6 real s
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'divination', main: 'none', ...HELD, loop: 1.6, scale: [[0, 2], [1, 7]], k: [[0, 1], [0.7, 0.4], [1, 0]], glow: 2 }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'star4', spawn: 'sphere', r: 3, dir: 'sphere', speed: [0.2, 0.6], size: [0.25, 0.45], sizeEnd: 0, life: [0.6, 1.1], color: [D.accent, D.silver], twinkle: 5 }),
  ] },
  // =============================================================================================== WARD (the core's: Spellscription)
  'mech.ward.cast': { layers: [
    // PRIMARY: the circle drawn round the frame's feet by a racing brush (written in through its script), its seal at the heart
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'script', tile: [10, 1], scroll: [0.6, 0], dur: 1.1, scale: [[0, 6], [0.25, 11], [1, 11.5]], offset: [0, 0.1, 0],
      edgeV: [0.3, 0.2], erode: [[0, 0.9], [0.3, 0.04], [0.75, 0.1], [1, 1]], rampShift: COOL, glow: 2.2, core: 0.4, turn: 'random' }),
    L({ type: 'shape', form: 'hoop', ramp: 'spellscription', main: 'none', dur: 1.0, scale: [[0, 2], [0.3, 12.5], [1, 12.8]], offset: [0, 0.12, 0], erode: [[0, 0.04], [0.7, 0.1], [1, 1]], glow: 2.4 }),
    L({ type: 'shape', form: 'disc', ramp: 'spellscription', main: 'script', tile: [4, 3], at: 0.35, dur: 0.8, scale: [[0, 6], [0.15, 3.6], [1, 3.7]], offset: [0, 0.15, 0], // (its seal stamped at the heart)
      erode: [[0, 0], [0.5, 0.06], [1, 1]], glow: 2, core: 0.8 }),
    // SECONDARY: strokes flicked up round the frame, at three heights
    ...[[3, 0.6], [7, -1.4], [11, 2.4]].map(([y, rot], i) => L({ type: 'shape', form: 'crescent', face: 'camera', ramp: 'spellscription', main: 'script', tile: [3, 0.5], mainK: 0.6, scroll: [1.5, 0],
      at: 0.05 + i * 0.09, dur: 0.6, scale: [[0, 3], [1, 7.5]], offset: [0, y, 0], rot, spin: 2.2, erode: [[0, 0.7], [0.25, 0.05], [0.6, 0.1], [1, 1]], rampShift: COOL, glow: 2, core: 0.5 })),
    L({ type: 'sprites', at: 0.1, count: [14, 20], shape: 'talisman', spawn: 'ring', r: 9, dir: 'up', speed: [2, 5], size: [0.8, 1.3], sizeEnd: 0.3, life: [0.9, 1.5], drag: 1, color: [S.white, S.hi], spin: [-3, 3] }),
    L({ type: 'shake', at: 0.35, k: 0.12 }),
  ] },
  'mech.ward.hold': { layers: [
    L({ type: 'shape', form: 'ring', ramp: 'spellscription', main: 'script', tile: [10, 1], scroll: [0.08, 0], ...HELD, scale: 11.5, offset: [0, 0.1, 0], spin: 0.15, edgeV: [0.3, 0.2], erode: 0.1, glow: 1.8, core: 0.25 }),
    L({ type: 'shape', form: 'hoop', ramp: 'spellscription', main: 'none', ...HELD, scale: 12.8, offset: [0, 0.12, 0], glow: 2 }),
    L({ type: 'shape', form: 'band', ramp: 'spellscription', main: 'script', tile: [12, 1], scroll: [-0.1, 0], ...HELD, scale: 1, stretch: [10.5, 1.6, 10.5], offset: [0, 1.2, 0],
      edgeV: [0.25, 0.35], rim: -0.4, erode: 0.15, glow: 1.6, core: 0.2 }),
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'talisman', spawn: 'ring', r: 11, dir: 'up', speed: [0.8, 1.8], size: [0.6, 1], sizeEnd: 0.2, life: [1.2, 1.8], color: [S.white, S.hi], spin: [-2, 2] }),
  ] },
  // =============================================================================================== HASTEN (the core's: Ouranurgy)
  'mech.hasten.hold': { layers: [
    // PRIMARY: graduated hoops falling over the frame from above its helm to its feet, one after another
    ...[0, 0.37, 0.73].map((at) => L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [40, 1], mainK: 0.7, scroll: [0.5, 0], ...HELD, at, loop: 1.1,
      scale: 6.2, offset: [0, [[0, 19], [1, 0.5]], 0], k: [[0, 0], [0.12, 1], [0.85, 1], [1, 0]], edgeV: [0.55, 0.12], glow: 2.1, core: 0.3 })),
    L({ type: 'sprites', rate: 26, dur: Infinity, shape: 'star4', spawn: 'column', r: 5, height: 17, dir: 'up', speed: [-9, -5], size: [0.3, 0.55], sizeEnd: 0.05, life: [0.5, 0.9], stretch: 2, color: [O.star, O.body], twinkle: 6 }),
    L({ type: 'sprites', rate: 10, dur: Infinity, shape: 'streak', spawn: 'column', r: 4.5, height: 15, dir: 'up', speed: [-14, -9], size: [0.25, 0.4], life: [0.25, 0.4], stretch: 4, color: O.body }),
  ] },
  'mech.hasten.halo': { layers: [
    L({ type: 'shape', form: 'ring', face: 'camera', ramp: 'ouranurgy', main: 'rays', tile: [12, 1], mainK: 0.85, ...HELD, scale: 3.6, edgeV: [0.62, 0.1], glow: 2.2, core: 0.3 }),
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'ouranurgy', main: 'none', ...HELD, scale: 4.1, glow: 2 }),
    L({ type: 'shape', form: 'quad', face: 'camera', ramp: 'ouranurgy', main: 'none', ...HELD, scale: 1, stretch: [0.32, 6.4, 1], spin: -7, glow: 2.6, core: 0.6 }), // (the hand: a sweep a real second)
    L({ type: 'shape', form: 'quad', face: 'camera', ramp: 'ouranurgy', main: 'none', ...HELD, scale: 1, stretch: [0.5, 4.4, 1], spin: -0.6, glow: 2.2, core: 0.5 }), // (the hour hand, slower)
  ] },
  // =============================================================================================== SUNDER (the arms': Alteration)
  'mech.sunder.edge': { layers: [
    // PRIMARY: the band swept down the blade's length through the flambe, white-hot at its leading edge
    L({ type: 'shape', form: 'beam', ramp: 'alteration', main: 'streaks', tile: [1, 6], scroll: [0, -4], dur: 0.7, stretch: [0.09, 0.09, 1], rim: -0.5,
      erode: [[0, 0.6], [0.12, 0.04], [0.55, 0.1], [1, 1]], rampShift: [[0, 0.3], [0.3, 0.05], [1, -0.4]], glow: 2.6, core: 0.8 }),
    L({ type: 'shape', form: 'beam', ramp: 'white', main: 'none', dur: 0.18, stretch: [0.05, 0.05, 1], erode: [[0, 0], [1, 1]], glow: 3, core: 1 }),
  ] },
  'mech.sunder.crumble': { layers: [
    L({ type: 'sprites', pool: 'alpha', count: [26, 34], shape: 'chip', spawn: 'line', r: 0.8, dir: 'sphere', speed: [1, 4], size: [0.25, 0.55], life: [1, 1.6], gravity: 14, floor: 'ground', color: CLAY, spin: [-8, 8] }),
    L({ type: 'sprites', pool: 'alpha', count: [16, 22], shape: 'puff', spawn: 'line', r: 1, dir: 'up', speed: [0.4, 1.4], size: [2, 3.4], sizeEnd: 5, life: [1.2, 2], drag: 1.4, gravity: 0.6, color: DUST.concat(CLAY[2]), alpha: 0.4, spin: [-0.6, 0.6] }),
    L({ type: 'sprites', count: [14, 18], shape: 'sparkle', spawn: 'line', dir: 'up', speed: [0.5, 2], size: [0.35, 0.6], sizeEnd: 0, life: [0.4, 0.8], color: [A.red, A.blue, 0xffe2c8], twinkle: 10 }),
  ] },
  // =============================================================================================== GUST (the arms': Psychokinesis)
  'mech.gust.cone': { layers: [
    L({ type: 'shape', form: 'cone', face: 'dir', ramp: 'psychokinesis', main: 'streaks', tile: [6, 2], scroll: [0, -3.5], mask: 'noise', maskTile: [3, 2], maskScroll: [0, -1.2], dur: 0.75,
      stretch: [0.55, 1, 0.55], edgeV: [0.08, 0.3], rim: -0.7, erode: [[0, 0.6], [0.2, 0.15], [0.6, 0.25], [1, 1]], rampShift: COOL, glow: 1.1, core: 0, add: 1, back: 0.15 }),
  ] },
  'mech.gust': { layers: [
    // SECONDARY: the wave thrown out along the ground along the gust (curved wall: Psychokinesis's front)
    L({ type: 'shape', form: 'wave', face: 'heading', ramp: 'psychokinesis', main: 'streaks', tile: [4, 1], scroll: [0, 1.5], dur: 0.7, scale: [[0, 6], [1, 40]], stretch: [1, 0.18, 1],
      edgeV: [0.05, 0.4], erode: OUT, rampShift: COOL, glow: 1.6, core: 0.3 }),
    // TERTIARY: dust driven ahead and debris lifted and flung along the gust
    L({ type: 'sprites', pool: 'alpha', count: [26, 34], shape: 'puff', spawn: 'disc', r: 5, offset: [0, -4, 0], dir: 'cone', cone: 18, speed: [22, 36], size: [3, 4.5], sizeEnd: 7, life: [0.9, 1.4], drag: 1.6, color: SAND.concat(DUST), alpha: 0.38, spin: [-1, 1] }),
    L({ type: 'sprites', pool: 'alpha', count: [18, 24], shape: 'chip', spawn: 'disc', r: 6, offset: [0, -6, 0], dir: 'cone', cone: 25, speed: [18, 30], size: [0.3, 0.7], life: [1, 1.5], gravity: 10, drag: 0.5, color: CLAY.concat(SAND), spin: [-12, 12] }),
    L({ type: 'sprites', count: [16, 22], shape: 'streak', spawn: 'sphere', r: 3, dir: 'cone', cone: 14, speed: [40, 55], size: [0.35, 0.55], life: [0.3, 0.5], stretch: 5, drag: 1, color: [P.pale, P.hi] }),
  ] },
  // =============================================================================================== QUAKE (the legs': the ground heaved)
  'mech.quake': { layers: [
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'cracks', tile: [8, 1], mainK: 0.8, dur: 0.9, scale: [[0, 3], [1, 12]], offset: [0, 0.15, 0], edgeV: [0.5, 0.15],
      erode: OUT, rampShift: COOL, glow: 1.6, core: 0.3, turn: 'random' }),
    L({ type: 'shape', form: 'band', ramp: 'psychokinesis', main: 'noise', tile: [6, 1], scroll: [0, 0.8], dur: 0.8, scale: [[0, 3], [1, 12]], stretch: [1, 0.35, 1],
      edgeV: [0.05, 0.6], rim: -0.6, erode: OUT, rampShift: COOL, glow: 1, core: 0, add: 0.6 }),
    L({ type: 'shape', form: 'disc', ramp: 'ink', main: 'cracks', tile: [5, 2], mainK: 0.7, dur: 2.2, scale: 9, offset: [0, 0.08, 0], erode: [[0, 0.5], [0.08, 0.1], [0.7, 0.2], [1, 1]], glow: 0.6, add: 0, turn: 'random' }),
    L({ type: 'sprites', pool: 'alpha', count: [30, 40], shape: 'puff', spawn: 'ring', r: 6, dir: 'out', lift: 0.25, speed: [6, 12], size: [3, 4.5], sizeEnd: 7, life: [1.3, 2], drag: 1.8, gravity: -0.2, color: SAND.concat(DUST), alpha: 0.42, spin: [-0.8, 0.8] }),
    L({ type: 'sprites', pool: 'alpha', count: [26, 34], shape: 'chip', spawn: 'disc', r: 9, dir: 'cone', axis: 'up', cone: 35, speed: [8, 16], size: [0.4, 0.9], life: [1.1, 1.6], gravity: 14, floor: 'ground', color: CLAY.concat(SAND), spin: [-10, 10] }),
    L({ type: 'shake', at: 0, k: 0.35 }),
  ] },
  // =============================================================================================== BLINK (the legs': Ouranurgy's portal)
  'mech.blink.step': { layers: [
    L({ type: 'shape', form: 'ring', ramp: 'ouranurgy', main: 'rays', tile: [36, 1], scroll: [0.3, 0], dur: 0.5, scale: [[0, 14], [1, 5]], offset: [0, 0.1, 0], edgeV: [0.5, 0.2],
      erode: [[0, 0.3], [0.35, 0.04], [0.8, 0.1], [1, 1]], glow: 2, turn: 'random' }),
    L({ type: 'shape', form: 'pillar', ramp: 'ouranurgy', main: 'streaks', tile: [3, 2], scroll: [0, 2.4], at: 0.05, dur: 0.8, offset: [0, 30, 0], stretch: [26, [[0, -1], [0.2, -30], [1, -30]], 26],
      edgeV: [0.5, 0.02], rim: -0.45, erode: [[0, 0], [0.3, 0.03], [1, 1]], rampShift: [[0, 0.3], [0.25, 0.08], [1, -0.4]], glow: 2.3, core: 0.8, turn: 'random' }),
    L({ type: 'sprites', at: 0.15, count: [20, 26], shape: 'star4', spawn: 'column', r: 5, height: 16, dir: 'up', speed: [-3, -1], size: [0.35, 0.6], sizeEnd: 0.05, life: [0.8, 1.3], color: [O.star, O.body], twinkle: 5 }),
  ] },
  // =============================================================================================== PULL (the arms': Psychokinesis)
  'mech.pull.tether': { layers: [
    L({ type: 'shape', form: 'beam', ramp: 'psychokinesis', main: 'streaks', tile: [2, 8], scroll: [0, -5], dur: 0.7, stretch: [[[0, 0.02], [0.2, 0.035], [1, 0.01]], [[0, 0.02], [0.2, 0.035], [1, 0.01]], 1],
      rim: -0.5, erode: [[0, 0.4], [0.15, 0.04], [0.7, 0.1], [1, 1]], rampShift: COOL, glow: 2.2, core: 0.6 }),
  ] },
  'mech.pull.motes': { layers: [
    L({ type: 'sprites', count: [26, 34], shape: 'streak', spawn: 'line', r: 0.6, dir: 'line', speed: [0.5, 1], size: [0.3, 0.5], life: [0.3, 0.6], stretch: 3, color: [P.pale, P.hi, P.body] }),
    L({ type: 'sprites', count: [10, 14], shape: 'soft', spawn: 'line', r: 0.8, dir: 'sphere', speed: [0.3, 1], size: [0.6, 1], sizeEnd: 0, life: [0.4, 0.7], color: [P.pale, P.hi] }),
  ] },
  'mech.pull.snap': { layers: [
    L({ type: 'shape', form: 'ring', ramp: 'psychokinesis', main: 'ripple', tile: [6, 1], dur: 0.6, scale: [[0, 1], [1, 5]], offset: [0, 0.1, 0], edgeV: [0.4, 0.3], erode: OUT, rampShift: COOL, glow: 1.6 }),
    L({ type: 'sprites', pool: 'alpha', count: [12, 16], shape: 'puff', spawn: 'ring', r: 1.5, dir: 'out', lift: 0.4, speed: [3, 6], size: [1.6, 2.4], sizeEnd: 3.8, life: [0.8, 1.3], drag: 2, color: SAND.concat(DUST), alpha: 0.38 }),
    L({ type: 'sprites', pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'disc', r: 1.5, dir: 'cone', axis: 'up', cone: 40, speed: [4, 8], size: [0.25, 0.5], life: [0.8, 1.2], gravity: 14, floor: 'ground', color: CLAY, spin: [-10, 10] }),
  ] },
  // =============================================================================================== READY (any part's)
  'mech.ready': { layers: [
    L({ type: 'sprites', count: 1, shape: 'star4', size: 2.6, sizeEnd: 0, life: 0.45, color: 0xffe9a8, rot: 0.4 }),
    L({ type: 'shape', form: 'hoop', face: 'camera', ramp: 'gold', main: 'none', dur: 0.45, scale: [[0, 0.6], [1, 3.2]], erode: [[0, 0.04], [0.6, 0.12], [1, 1]], glow: 2.2 }),
    L({ type: 'sprites', count: [5, 7], shape: 'glint', spawn: 'sphere', r: 1.2, dir: 'sphere', speed: [0.5, 1.5], size: [0.25, 0.4], sizeEnd: 0, life: [0.3, 0.5], color: [0xffe9a8, 0xffffff], twinkle: 10 }),
  ] },
};
