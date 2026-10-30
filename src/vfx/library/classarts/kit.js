// ---------------------------------------------------------------------------------------
// THE CLASS ARTS' KIT: the pieces the 76 class arts' looks are built from (vfx/library/classarts/: docs/plans/art/VFX-LIBRARY.md 4). A
// class art is its DOMAIN's grammar (the plan's section 2: what the act does, its form and motion) in its SUIT's colour (a shape's ramp
// named by the suit, a wild Major's the film's 'wild'; its sprites `color: 'suit'`, the caller's ctx.suit: vfx/classartlooks.js passes
// the art's own), weighed by its RANK on the ladder (RANK below). Each piece is one tier of an effect, named for its job in its grammar:
//   PRIMARY    the hero: what happened, its silhouette, the brightest, there first (a column, spikes, a lens, a wave, a tether, a band)
//   SECONDARY  how it moved and where it went: rings, chips, shards, crescents, a band of script; quicker or thinner, never brighter
//   TERTIARY   what it leaves: motes, dust, mist, haze, a faint ring; slow and faint, the last to go
// The law of section 1 is in every piece's defaults: gradient transparency (edges and the ramp's own alpha, no hard edge), UV scrolling
// on anything that lives past 0.2 s, erosion through its pattern (never a plain fade), the ramp cooling over its life (`cools`: white-hot
// for about 0.1 real s, then down the suit's row), and the impact's hot core (`core`) about 0.1 s. No new program, no new texture: the
// shape layer (vfx/shapes/layer.js) and the sprites (vfx/sprites.js) only. A data module: it imports nothing.
//
// A piece's numbers, over its defaults: r a radius (m), h a height (m), w a width's share, len a length (m), y how high it stands, s a size,
// g its glow over the rank's, dur its life (real s, before the rank's pace), hold (held: dur Infinity, its fade in and out vfx.js's, its
// life looped every `loop` real s); any other field is the layer's own and wins (rot, spin, main, at, k ...). A sprite piece takes y (its
// offset) and the sprite layer's fields.
//
// THE RANK LADDER (Riot's importance by size, saturation and opacity: VFX-PRIOR-ART.md 2.1 and 4): a Page's small and quick, a Knight's a
// clear strike, a Queen's held and soft (its opacity halved, its ramp read toward the pale end: less saturated), a King's and a Major's a
// game changer (the brightest, more of everything, and screen weight: `weight`), the World's the ultimate; a reaction's own image is its
// class's action in a whisper (HUSH), on the shared base `art.react` (reactions.js).
//
// Prior art: Riot's League of Legends VFX style guide (Jin Yang, 2017: primary, secondary, tertiary; the ladder from an idle particle to
// an ultimate), Final Fantasy Tactics' reaction abilities (Square, 1997: a reaction announces itself, one shared flash), Chrono Cross's
// innate colours (Square, 1999: a character's colour carried on everything they do), the Dragon Quest and Parasite Eve II spell families
// (a hundred spells as a dozen shapes in rungs), Kevin Leroy's hit frame of 0.1 s (80.lv, 2017).
//
//   RANK   piece(S, R, o, def, build) / own(S, R, o) a shape layer   sprites(R, def, o)   weight(R, o) the screen's   cools erodes growsIn
//   every domain: core groundRing rimRing pool lamp
//   Ouranurgy: skyColumn skyDrop armillary starFall mist          Manifestation: crystal bloomDome shardsIn dust grains embers smoke
//   Divination: lens iris scan blinkOut specks                     Psychokinesis: waveWall shock shockFront chips orbitChips dustCurtain
//   Possession: tether spiralIn shellClose collar haze motesIn lineMotes      Alteration: sweepUp crescents flakes shimmer
//   Spellscription: writtenRing strokes scriptBand seal inkMotes
// ---------------------------------------------------------------------------------------

/** The rank ladder: k the opacity (the layer's kmul, a sprite's alpha), glow the HDR lift, n the counts, life the pace of a one-shot,
 *  pale how far its ramp is read toward the pale end, weight the screen's (flash, shake, a held beat) a game changer earns. */
export const RANK = {
  page: { k: 0.85, glow: 1.6, n: 0.6, life: 0.8 },
  knight: { k: 1, glow: 2, n: 1, life: 1 },
  queen: { k: 0.5, glow: 1.2, n: 0.6, life: 1.3, pale: 0.1 },
  king: { k: 1, glow: 2.4, n: 1.4, life: 1.15, weight: 1 },
  major: { k: 1, glow: 2.4, n: 1.4, life: 1.15, weight: 1 },
  world: { k: 1, glow: 2.8, n: 1.8, life: 1.3, weight: 1.3 },
  whisper: { k: 0.5, glow: 1.4, n: 0.45, life: 0.75, pale: 0.06 },
};

/** A one-shot's ramp over its life: white-hot for about 0.1 real s (the impact's core), then cooling down the row and clearing. */
export const cools = (dur, hot = 0.3) => [[0, hot], [Math.min(0.45, 0.1 / Math.max(0.12, dur)), 0.06], [1, -0.32]];
/** Erosion out through the pattern: whole until `from` of its life, then eaten away. */
export const erodes = (from = 0.45) => [[0, 0], [from, 0.06], [1, 1]];
/** Erosion run backwards, then out: it grows in (crystallises, is written) by `inAt`, stands, and breaks up after `outAt`. */
export const growsIn = (inAt = 0.25, outAt = 0.6) => [[0, 1], [inAt, 0.04], [outAt, 0.1], [1, 1]];

const GEO = new Set(['r', 'h', 'w', 'len', 'y', 's', 'g', 'hold', 'dur']);
const shiftBy = (c, d) => (Array.isArray(c) ? c.map(([t, v]) => [t, v + d]) : (c ?? 0) + d);

/** A shape layer: the piece's numbers read (`def` under the caller's `o`), its tier's fields from `build(p, held)`, the rank over it
 *  (its glow, its opacity, its pace, its paleness) and the caller's other fields over everything. */
export function piece(S, R, o = {}, def = {}, build = () => ({})) {
  const p = { ...def }, over = {};
  for (const [k, v] of Object.entries(o)) (GEO.has(k) ? p : over)[k] = v;
  const held = !!p.hold;
  p.dur = held ? Infinity : (p.dur ?? 0.6) * R.life;
  const built = build(p, held), L = {
    type: 'shape', ramp: S, glow: R.glow * (p.g ?? 1),
    ...(held ? { in: 3, out: 2.5, erode: 0.1, rampShift: 0 } : { erode: erodes(), rampShift: cools(p.dur) }),
    ...built, ...over, dur: p.dur,
  };
  L.kmul = R.k * (built.kmul ?? 1) * (over.kmul ?? 1);
  if (R.pale) L.rampShift = shiftBy(L.rampShift, R.pale);
  return L;
}
/** A shape of an art's own, written out whole (the cup, the card, the wheel), with its rank over it as any piece's. */
export const own = (S, R, o) => piece(S, R, o);

const mulCurve = (c, m) => (Array.isArray(c) ? c.map(([t, v]) => [t, v * m]) : (c ?? 1) * m);
/** A light piece with a soft ink copy drawn under it first (alpha-over, order 5, its pattern mostly smoothed, a little wider): on the noon
 *  sand added light clips to white and the ink is what keeps its shape and colour (NEW:additive-covers); on a dark ground the ink is lost
 *  in the dark and changes nothing. It erodes ahead of the light, so no dark is left lying where the light has gone. */
export function inked(L, k = 0.4, wide = 1.04) {
  const ink = { ...L, ramp: 'ink', add: 0, glow: 1, core: 0, mainK: 0.6, ...(L.mask ? { maskK: 0.6 } : {}), scale: mulCurve(L.scale, wide), kmul: (L.kmul ?? 1) * k, order: 5,
    erode: shiftBy(L.erode, 0.15), rampShift: shiftBy(L.rampShift, -0.1) }; // (eaten away ahead of its light, never left lying after it)
  return [ink, L];
}

/** A sprite layer: its count or rate by the rank's, its alpha by its opacity; y its height. */
export function sprites(R, def, o = {}) {
  const { y, ...over } = o;
  const L = { type: 'sprites', ...def, ...(y !== undefined ? { offset: [0, y, 0] } : {}), ...over };
  const n = (c) => Math.max(1, Math.round(c * R.n));
  if (L.rate) { delete L.count; L.rate *= R.n; } else if (L.count !== undefined) L.count = Array.isArray(L.count) ? L.count.map(n) : n(L.count);
  L.alpha = (L.alpha ?? 1) * Math.min(1, R.k * 1.15);
  return L;
}

/** The screen's weight an art earns (none below a King or a Major; a lamp on any), each inside the budgets (vfx.js BUDGETS): a lamp in
 *  its colour, a wash of it over the screen, a shake, the world held a beat. */
export function weight(R, { flash = 0, shake = 0, stop = 0, light = 0, range = 10, y = 1.2, at = 0, color = 'suit' } = {}) {
  const w = R.weight || 0, out = [];
  if (light) out.push({ type: 'light', at, color, k: light * (w || 0.6), range, dur: 0.6, up: y });
  if (!w) return out;
  if (flash) out.push({ type: 'flash', at, color, k: flash * w, dur: 0.35 });
  if (shake) out.push({ type: 'shake', at, k: shake * w });
  if (stop) out.push({ type: 'hitstop', at, dur: stop });
  return out;
}

// ==== every domain ==========================================================================================
/** PRIMARY (its heart): the white-hot core of the impact, gone in about 0.1 real s (six frames: one alone does not read at 480 lines). */
export const core = (R, o = {}) => piece('white', R, o, { s: 1, y: 1.1, dur: 0.12 }, (p) => ({
  form: 'sphere', main: 'cells', tile: [2, 2], scale: [[0, 0.14 * p.s], [1, 0.5 * p.s]], offset: [0, p.y, 0], rim: -0.6, glow: 2.6, erode: [[0, 0], [1, 1]], rampShift: 0, turn: 'random' }));
/** A ring on the ground thrown out from the middle, its outer edge brightest and a gradient behind (a landing's, a calm's, a ping's);
 *  inked under (a pair of layers). */
export const groundRing = (S, R, o = {}) => inked(piece(S, R, o, { r: 2, y: 0.04, dur: 0.55 }, (p, held) => ({
  form: 'ring', main: 'streaks', tile: [10, 1], scroll: [0, 1.4], mask: 'noise', maskTile: [3, 1], maskScroll: [0.08, 0],
  scale: held ? p.r : [[0, 0.22 * p.r], [1, p.r]], offset: [0, p.y, 0], edgeV: [0.6, 0.12], erode: held ? 0.1 : erodes(0.35), turn: 'random' })));
/** TERTIARY: a pale ring left lying at the reach, faint, eroding away through its noise. */
export const rimRing = (S, R, o = {}) => piece(S, R, o, { r: 3, y: 0.03, dur: 1.4, g: 0.45 }, (p) => ({
  form: 'ring', main: 'noise', tile: [6, 1], scroll: [0.03, 0.1], scale: p.r, offset: [0, p.y, 0], edgeV: [0.7, 0.2], at: 0.2,
  erode: [[0, 0.15], [0.3, 0.2], [1, 1]], rampShift: [[0, -0.1], [1, -0.4]], k: [[0, 0], [0.2, 0.4], [1, 0.4]], turn: 'random' }));
/** TERTIARY (or a calm's PRIMARY): a pool of light spreading on the ground, its ripples laid flat as it stills. */
export const pool = (S, R, o = {}) => piece(S, R, o, { r: 1.5, y: 0.03, dur: 1.2, g: 0.8 }, (p, held) => ({
  form: 'disc', main: 'ripple', tile: [3, 1], scroll: [0.02, 0.25], mask: 'noise', maskTile: [2, 1], maskScroll: [0.03, 0.05], scale: held ? p.r : [[0, 0.2 * p.r], [0.5, 0.9 * p.r], [1, p.r]],
  offset: [0, p.y, 0], edgeV: [0, 0.4], core: 0, erode: held ? 0.12 : [[0, 0.05], [0.5, 0.12], [1, 1]], rampShift: held ? -0.1 : [[0, 0.1], [0.3, -0.05], [1, -0.35]], turn: 'random' }));
/** A lamp that blooms and fades with the act (one of the few the light budget lends any effect). */
export const lamp = (R, o = {}) => ({ type: 'light', color: 'suit', k: 16 * R.k, range: 6, dur: 0.5, up: 1.1, ...o });

// ==== Ouranurgy: the sky's (called down, opened, turned) ======================================================
/** PRIMARY: the sky's column falling onto the ground: a band of streaks poured down, a noise mask against it, eroding from the top. */
export const skyColumn = (S, R, o = {}) => piece(S, R, o, { r: 0.6, h: 7, y: 0, dur: 0.9 }, (p, held) => ({
  form: 'band', main: 'noise', tile: [3, 2], scroll: [0, -1.6], mask: 'streaks', maskK: 0.6, maskTile: [6, 2], maskScroll: [0.02, -2.8], flow: 'noise', flowK: 0.04,
  scale: held ? p.r : [[0, 1.3 * p.r], [0.3, p.r], [1, 0.85 * p.r]], stretch: [1, held ? p.h / p.r : [[0, p.h / (1.3 * p.r)], [0.3, p.h / p.r], [1, p.h / (0.85 * p.r)]], 1],
  offset: [0, p.y, 0], edgeV: [0.02, 0.5], rim: -0.4, erode: held ? 0.12 : [[0, 0.05], [0.4, 0.08], [1, 1]] }));
/** PRIMARY: streaks of the sky dropped from above onto the spot, white cooling to the suit's. */
export const skyDrop = (R, o = {}) => sprites(R, { count: [5, 7], shape: 'streak', spawn: 'disc', r: 0.4, offset: [0, 7, 0], dir: 'up', speed: [-26, -20], size: [0.22, 0.32], sizeEnd: 0.08,
  life: [0.24, 0.3], stretch: 3.5, color: 'white', colorEnd: 'suit' }, o);
/** SECONDARY: the armillary: a ring of ticks laid flat round the body and one stood up facing the view, turning against each other. */
export const armillary = (S, R, o = {}) => [
  piece(S, R, o, { r: 1.2, y: 1.1, dur: 0.9 }, (p, held) => ({ form: 'ring', main: 'rays', tile: [16, 1], scroll: [0.2, 0], scale: held ? p.r : [[0, 0.6 * p.r], [0.3, p.r], [1, 1.05 * p.r]],
    offset: [0, p.y, 0], edgeV: [0.75, 0.1], spin: 1.4, erode: held ? 0.1 : growsIn(0.2, 0.55) })),
  piece(S, R, o, { r: 1.2, y: 1.1, dur: 0.9 }, (p, held) => ({ form: 'ring', face: 'camera', main: 'rays', tile: [12, 1], scroll: [-0.25, 0], scale: held ? 0.85 * p.r : [[0, 0.5 * p.r], [0.3, 0.85 * p.r], [1, 0.9 * p.r]],
    offset: [0, p.y, 0], edgeV: [0.8, 0.08], spin: -1, glow: R.glow * 0.8, erode: held ? 0.1 : growsIn(0.25, 0.55) })),
];
/** TERTIARY: star motes falling slow out of the sky over it. */
export const starFall = (R, o = {}) => sprites(R, { count: [16, 22], shape: 'sparkle', spawn: 'column', r: 1.2, height: 3, offset: [0, 1.5, 0], dir: 'up', speed: [-0.9, -0.4], size: [0.05, 0.11],
  sizeEnd: 0, life: [1.2, 2], drag: 0.6, color: 'white', colorEnd: 'suit', alpha: 0.9, twinkle: 5, at: 0.15 }, o);
/** TERTIARY: a cool mist settling where it fell (alpha-over, faint). */
export const mist = (R, o = {}) => sprites(R, { pool: 'alpha', count: [6, 9], shape: 'puff', spawn: 'disc', r: 0.8, offset: [0, 0.3, 0], dir: 'up', speed: [0.2, 0.6], size: [0.8, 1.2], sizeEnd: 2,
  life: [1.2, 1.8], drag: 1, color: 0xdfe8f0, alpha: 0.2, spin: [-0.5, 0.5], at: 0.12 }, o);

// ==== Manifestation: what was not, made ==================================================================
/** PRIMARY: spikes rising out of the ground, crystallising (erosion run backwards: they grow in), standing, then breaking up. */
export const crystal = (S, R, o = {}) => piece(S, R, o, { r: 1, h: 1, y: 0, dur: 0.8 }, (p, held) => ({
  form: 'spikes', main: 'cells', tile: [2, 1], scroll: [0, 0.3], mask: 'noise', maskTile: [2, 1], maskScroll: [0, 0.5],
  scale: p.r, stretch: [1, held ? p.h / p.r : [[0, 0.15 * p.h / p.r], [0.3, p.h / p.r], [1, p.h / p.r]], 1], offset: [0, p.y, 0], rim: 0.5, core: 0.7,
  erode: held ? 0.12 : growsIn(0.22, 0.6), turn: 'random' }));
/** PRIMARY: a dome bloomed up out of the ground where the thing is made: lit at its rim, grown, then eroding through its cells. */
export const bloomDome = (S, R, o = {}) => piece(S, R, o, { r: 0.8, h: 1, y: 0, dur: 0.7 }, (p) => ({
  form: 'dome', main: 'cells', tile: [3, 2], scroll: [0, 0.6], mask: 'noise', maskTile: [2, 1], maskScroll: [0.1, 0.4], scale: [[0, 0.3 * p.r], [0.3, p.r], [1, 1.15 * p.r]],
  stretch: [1, [[0, 0.4 * p.h], [0.3, p.h], [1, 0.9 * p.h]], 1], offset: [0, p.y, 0], rim: 0.7, core: 0.8, erode: [[0, 0], [0.35, 0.05], [1, 1]], turn: 'random' }));
/** SECONDARY: shards drawn inward to the made thing, then set. */
export const shardsIn = (R, o = {}) => sprites(R, { count: [12, 16], shape: 'shard', spawn: 'shell', r: 1.6, offset: [0, 0.8, 0], dir: 'in', speed: [3, 5], size: [0.1, 0.16], sizeEnd: 0.04,
  life: [0.3, 0.4], drag: 2, color: 'white', colorEnd: 'suit', spin: [-6, 6] }, o);
/** TERTIARY: dust settling round its foot (alpha-over). */
export const dust = (R, o = {}) => sprites(R, { pool: 'alpha', count: [8, 12], shape: 'puff', spawn: 'disc', r: 0.9, offset: [0, 0.15, 0], dir: 'out', lift: 0.5, speed: [0.6, 1.6], size: [0.35, 0.55],
  sizeEnd: 1.1, life: [0.8, 1.3], drag: 2.5, gravity: -0.2, color: 0xcbb8a4, alpha: 0.35, spin: [-1, 1] }, o);
/** TERTIARY: a few glowing grains left hanging, then falling. */
export const grains = (R, o = {}) => sprites(R, { count: [10, 14], shape: 'soft', spawn: 'disc', r: 0.8, offset: [0, 0.4, 0], dir: 'up', speed: [0.4, 1.4], size: [0.04, 0.08], sizeEnd: 0,
  life: [0.9, 1.5], drag: 1.2, gravity: 0.8, color: 'suit', alpha: 0.9, at: 0.1 }, o);
/** TERTIARY: embers rising off it, hot cooling to the suit's. */
export const embers = (R, o = {}) => sprites(R, { count: [10, 14], shape: 'soft', spawn: 'disc', r: 0.4, offset: [0, 0.3, 0], dir: 'cone', axis: 'up', cone: 35, speed: [1, 2.6], size: [0.05, 0.09],
  sizeEnd: 0, life: [0.6, 1.1], drag: 1, gravity: -0.6, color: 'white', colorEnd: 'suit', alpha: 1 }, o);
/** TERTIARY: smoke curling up, alpha-over, faint. */
export const smoke = (R, o = {}) => sprites(R, { pool: 'alpha', count: [4, 6], shape: 'puff', spawn: 'disc', r: 0.3, offset: [0, 0.3, 0], dir: 'up', speed: [0.4, 0.9], size: [0.3, 0.5], sizeEnd: 1.1,
  life: [1, 1.5], drag: 1, gravity: -0.3, color: 0x3a3230, alpha: 0.3, spin: [-1, 1] }, o);

// ==== Divination: seeing =========================================================================================
/** PRIMARY: the lens: a sonar's sweep racing out on the ground: its front a thin low wall of light (a line seen from any height), a faint
 *  trail lying on the ground behind it. */
export const lens = (S, R, o = {}) => [
  piece(S, R, o, { r: 6, h: 0.1, y: 0, dur: 0.8 }, (p, held) => ({
    form: 'band', main: 'noise', tile: [Math.max(6, Math.round(p.r)), 1], scroll: [0.05, 0.6], scale: held ? p.r : [[0, 0.1 * p.r], [1, p.r]],
    stretch: [1, held ? p.h / p.r : [[0, p.h / (0.1 * p.r)], [1, p.h / p.r]], 1], offset: [0, p.y, 0], edgeV: [0.1, 0.6], rim: -0.2, core: 0.5,
    erode: held ? 0.08 : [[0, 0], [0.6, 0.05], [1, 1]], turn: 'random' })),
  piece(S, R, o, { r: 6, y: 0.04, dur: 0.8, g: 0.6 }, (p, held) => ({
    form: 'ring', main: 'noise', tile: [8, 1], scroll: [0.05, 0.6], scale: held ? p.r : [[0, 0.1 * p.r], [1, p.r]], offset: [0, p.y, 0], edgeV: [0.95, 0.03], core: 0,
    rampShift: held ? -0.2 : [[0, 0], [1, -0.4]], erode: held ? 0.2 : [[0, 0.15], [0.5, 0.2], [1, 1]], kmul: 0.3, turn: 'random' })),
];
/** PRIMARY: an iris opening at the eyes, stood facing the view, its ticks turning. */
export const iris = (S, R, o = {}) => piece(S, R, o, { r: 0.45, y: 1.6, dur: 0.6 }, (p, held) => ({
  form: 'ring', face: 'camera', main: 'rays', tile: [18, 1], scroll: [0.08, 0], mask: 'noise', maskTile: [3, 1], maskScroll: [-0.1, 0],
  scale: held ? p.r : [[0, 0.1 * p.r], [0.35, p.r], [1, 1.1 * p.r]], offset: [0, p.y, 0], edgeV: [0.3, 0.3], spin: 0.6, erode: held ? 0.1 : [[0, 0.3], [0.2, 0.04], [0.65, 0.08], [1, 1]] }));
/** SECONDARY: scan lines climbing a band round the body. */
export const scan = (S, R, o = {}) => piece(S, R, o, { r: 0.55, h: 2, y: 0, dur: 0.7, g: 0.8 }, (p, held) => ({
  form: 'band', main: 'streaks', tile: [6, 3], scroll: [0, 1.6], mask: 'rays', maskTile: [8, 1], maskScroll: [0.1, 0], scale: p.r, stretch: [1, p.h / p.r, 1], offset: [0, p.y, 0],
  edgeV: [0.1, 0.5], rim: -0.4, erode: held ? 0.2 : [[0, 0.1], [0.4, 0.15], [1, 1]] }));
/** SECONDARY: star spots blinking out from the middle, one after another. */
export const blinkOut = (R, o = {}) => sprites(R, { count: [14, 18], shape: 'star4', spawn: 'disc', r: 3, offset: [0, 0.1, 0], dir: 'up', speed: [0, 0.3], size: [0.1, 0.18], sizeEnd: 0,
  life: [0.25, 0.4], delay: [0, 0.45], color: 'white', colorEnd: 'suit', alpha: 1 }, o);
/** TERTIARY: specks left hanging where it looked, slowly fading. */
export const specks = (R, o = {}) => sprites(R, { count: [14, 20], shape: 'sparkle', spawn: 'column', r: 2, height: 2, offset: [0, 0.2, 0], dir: 'sphere', speed: [0.05, 0.25], size: [0.04, 0.08],
  sizeEnd: 0, life: [1.4, 2.2], drag: 2, color: 'suit', alpha: 0.7, twinkle: 4, at: 0.2 }, o);

// ==== Psychokinesis: the push and the lift =========================================================================
/** PRIMARY: a wave wall thrown out along the heading, its front hot, low and widening as it goes, eroding from its top. */
export const waveWall = (S, R, o = {}) => piece(S, R, o, { r: 6, h: 1.6, w: 1, dur: 0.75 }, (p, held) => ({
  form: 'wave', main: 'noise', tile: [3, 1], scroll: [0, 1.1], mask: 'streaks', maskK: 0.6, maskTile: [5, 1], maskScroll: [0, 1.6], flow: 'noise', flowK: 0.06,
  scale: held ? p.r : [[0, 0.12 * p.r], [1, p.r]], stretch: [p.w, held ? p.h / p.r : [[0, (0.8 * p.h) / (0.12 * p.r)], [1, (0.6 * p.h) / p.r]], 1], core: 0.7,
  erode: held ? 0.12 : [[0, 0], [0.35, 0.05], [1, 1]] }));
/** PRIMARY: the shockwave ring thrown out along the ground: its front bright, its back dragging (a long soft inner edge); inked under. */
export const shock = (S, R, o = {}) => inked(piece(S, R, o, { r: 6, y: 0.05, dur: 0.6 }, (p) => ({
  form: 'ring', main: 'streaks', tile: [14, 1], scroll: [0, 2], mask: 'noise', maskTile: [4, 1], maskScroll: [0.1, 0.3], scale: [[0, 0.15 * p.r], [0.5, 0.8 * p.r], [1, p.r]],
  offset: [0, p.y, 0], edgeV: [0.8, 0.06], core: 0.7, coreAt: 0.82, erode: erodes(0.4), turn: 'random' })), 0.28);
/** PRIMARY: the shock's front stood up as a low wall racing out with it, warped by a flow (the distortion band). */
export const shockFront = (S, R, o = {}) => piece(S, R, o, { r: 6, h: 1.2, dur: 0.55 }, (p) => ({
  form: 'band', main: 'noise', tile: [10, 1], scroll: [0.1, 1], flow: 'noise', flowK: 0.06, flowScroll: [0, 0.8], scale: [[0, 0.15 * p.r], [0.5, 0.8 * p.r], [1, p.r]],
  stretch: [1, [[0, p.h / (0.15 * p.r)], [0.5, p.h / (0.8 * p.r)], [1, (0.4 * p.h) / p.r]], 1], edgeV: [0.05, 0.7], rim: -0.3, erode: erodes(0.3), turn: 'random' }));
/** SECONDARY: debris chips torn off the ground and thrown, turning, falling back (alpha-over). */
export const chips = (R, o = {}) => sprites(R, { pool: 'alpha', count: [10, 14], shape: 'chip', spawn: 'disc', r: 0.8, offset: [0, 0.1, 0], dir: 'out', lift: 1.2, speed: [3, 7], size: [0.08, 0.14],
  life: [0.5, 0.9], drag: 1, gravity: 9, floor: 'ground', color: 0x8a7a6a, alpha: 0.95, spin: [-8, 8] }, o);
/** SECONDARY: chips lifted off the ground and orbiting the body. */
export const orbitChips = (R, o = {}) => sprites(R, { pool: 'alpha', count: [8, 12], shape: 'chip', spawn: 'ring', r: 1, offset: [0, 0.2, 0], dir: 'swirl', lift: 0.6, speed: [1.5, 2.5], size: [0.07, 0.12],
  life: [0.8, 1.2], drag: 0.5, gravity: -0.3, color: 0x8a7a6a, alpha: 0.9, spin: [-5, 5] }, o);
/** TERTIARY: a dust curtain lifted where the front passed (alpha-over). */
export const dustCurtain = (R, o = {}) => sprites(R, { pool: 'alpha', count: [12, 16], shape: 'puff', spawn: 'ring', r: 3, offset: [0, 0.2, 0], dir: 'out', lift: 1.5, speed: [0.8, 2], size: [0.6, 0.9],
  sizeEnd: 1.8, life: [1, 1.6], drag: 2, gravity: -0.15, color: 0xcbb8a4, alpha: 0.32, spin: [-0.8, 0.8], at: 0.1 }, o);

// ==== Possession: reaching in ========================================================================================
/** PRIMARY: a tether of light reaching in from the caster's side (a beam laid back along the line, its far end fading into the air). */
export const tether = (S, R, o = {}) => piece(S, R, o, { r: 0.08, len: 3, y: 1.1, dur: 0.8 }, (p, held) => ({
  form: 'beam', face: 'heading', rot: Math.PI, main: 'noise', tile: [1, 3], scroll: [0, -1.6], mask: 'streaks', maskK: 0.5, maskTile: [2, 3], maskScroll: [0, -2.4], core: 0.6,
  scale: p.len, stretch: [(2 * p.r) / p.len, (2 * p.r) / p.len, held ? 1 : [[0, 0.2], [0.25, 1], [1, 1]]], offset: [0, p.y, 0], edgeV: [0.05, 0.55], glow: R.glow * 1.3,
  erode: held ? 0.08 : [[0, 0.1], [0.2, 0.04], [0.6, 0.08], [1, 1]] }));
/** PRIMARY: a spiral drawn inward round the one reached into, turning and closing. */
export const spiralIn = (S, R, o = {}) => piece(S, R, o, { r: 1.1, h: 2, y: 0, dur: 0.8 }, (p, held) => ({
  form: 'spiral', main: 'noise', tile: [4, 1], scroll: [-0.8, 0], scale: held ? p.r : [[0, 1.5 * p.r], [1, 0.45 * p.r]],
  stretch: [1, held ? p.h / p.r : [[0, p.h / (1.5 * p.r)], [1, p.h / (0.45 * p.r)]], 1], offset: [0, p.y, 0], spin: -2.6,
  erode: held ? [[0, 0.6], [0.3, 0.12], [0.7, 0.12], [1, 0.6]] : [[0, 0.4], [0.25, 0.08], [0.7, 0.1], [1, 1]] }));
/** SECONDARY: a shell closing over the one held: a sphere shrinking onto its body, lit at its rim. */
export const shellClose = (S, R, o = {}) => piece(S, R, o, { r: 0.9, y: 0.9, dur: 0.6 }, (p, held) => ({
  form: 'sphere', main: 'cells', tile: [4, 2], scroll: [0.05, 0.3], scale: held ? p.r : [[0, 2.2 * p.r], [0.5, p.r], [1, 0.95 * p.r]], offset: [0, p.y, 0], rim: 0.8, rimPow: 2.2,
  erode: held ? 0.15 : [[0, 0.2], [0.4, 0.06], [1, 1]] }));
/** SECONDARY: the collar on it: a hoop of light (a short band, so it reads from the side) tightening at its neck. */
export const collar = (S, R, o = {}) => piece(S, R, o, { r: 0.45, h: 0.12, y: 1.3, dur: 0.7 }, (p, held) => ({
  form: 'band', main: 'cells', tile: [10, 1], scroll: [0.15, 0], scale: held ? p.r : [[0, 2 * p.r], [0.35, p.r], [1, 0.95 * p.r]],
  stretch: [1, held ? p.h / p.r : [[0, p.h / (2 * p.r)], [0.35, p.h / p.r], [1, p.h / (0.95 * p.r)]], 1], offset: [0, p.y, 0], edgeV: [0.3, 0.3], rim: -0.2, spin: 1.2, core: 0.4,
  glow: R.glow * 1.3, erode: held ? 0.08 : growsIn(0.15, 0.7) }));
/** TERTIARY: a haze breathing round it, low on the ground. */
export const haze = (S, R, o = {}) => piece(S, R, o, { r: 1.4, y: 0.03, dur: 1.4, g: 0.6 }, (p, held) => ({
  form: 'disc', main: 'marble', tile: [2, 1], scroll: [0.04, 0.1], flow: 'noise', flowK: 0.05, scale: held ? p.r : [[0, 0.6 * p.r], [1, p.r]], offset: [0, p.y, 0], core: 0, edgeV: [0, 0.5], loop: 2.4,
  erode: held ? 0.15 : [[0, 0.2], [0.4, 0.25], [1, 1]], rampShift: held ? -0.1 : [[0, -0.05], [1, -0.35]], k: held ? [[0, 0.6], [0.5, 1], [1, 0.6]] : [[0, 0], [0.2, 0.7], [1, 0.7]], turn: 'random' }));
/** TERTIARY: motes drawn in to it from round about. */
export const motesIn = (R, o = {}) => sprites(R, { count: [14, 18], shape: 'soft', spawn: 'shell', r: 2.2, offset: [0, 1, 0], dir: 'in', speed: [1.8, 3], size: [0.05, 0.1], sizeEnd: 0.02,
  life: [0.6, 0.9], drag: 0.3, color: 'suit', alpha: 0.85, at: 0.05 }, o);
/** SECONDARY: motes running the line between the caster and the one reached (the caller's ctx.from -> ctx.to, at the chest). */
export const lineMotes = (R, o = {}) => sprites(R, { count: [16, 22], shape: 'streak', spawn: 'line', r: 0.08, dir: 'line', speed: [0.5, 1.5], size: [0.06, 0.1], sizeEnd: 0.02,
  life: [0.3, 0.6], stretch: 1.4, color: 'white', colorEnd: 'suit', alpha: 0.9 }, o);

// ==== Alteration: what is, turned =======================================================================================
/** PRIMARY: a band swept up the body, its top edge the brightest, its ramp running hot to cool across it. */
export const sweepUp = (S, R, o = {}) => piece(S, R, o, { r: 0.6, h: 2.1, y: 0, dur: 0.7 }, (p, held) => ({
  form: 'band', main: 'noise', tile: [4, 1], scroll: [0.1, 1.2], mask: 'streaks', maskTile: [6, 1], maskScroll: [0, 0.8], flow: 'noise', flowK: 0.05,
  scale: p.r, stretch: [1, held ? p.h / p.r : [[0, 0.05], [0.55, p.h / p.r], [1, (1.05 * p.h) / p.r]], 1], offset: [0, p.y, 0], edgeV: [0.75, 0.06], rim: -0.3, loop: 2,
  erode: held ? 0.15 : [[0, 0], [0.5, 0.05], [1, 1]], rampShift: held ? [[0, 0.05], [0.5, -0.1], [1, 0.05]] : [[0, 0.3], [0.15, 0.1], [0.55, -0.05], [1, -0.35]] }));
/** SECONDARY: two crescents turning round it, counter to each other, at two heights. */
export const crescents = (S, R, o = {}) => [
  piece(S, R, o, { r: 0.9, y: 1, dur: 0.8 }, (p, held) => ({ form: 'crescent', face: 'heading', main: 'noise', tile: [3, 1], scroll: [0.8, 0], scale: held ? p.r : [[0, 0.6 * p.r], [1, p.r]],
    offset: [0, p.y, 0], spin: 4, erode: held ? 0.1 : [[0, 0.3], [0.2, 0.05], [1, 1]] })),
  piece(S, R, o, { r: 0.9, y: 1, dur: 0.8 }, (p, held) => ({ form: 'crescent', face: 'heading', main: 'noise', tile: [3, 1], scroll: [-0.8, 0], scale: held ? 0.8 * p.r : [[0, 0.5 * p.r], [1, 0.8 * p.r]],
    offset: [0, p.y + 0.35, 0], rot: Math.PI, spin: -3.2, glow: R.glow * 0.8, erode: held ? 0.1 : [[0, 0.35], [0.25, 0.06], [1, 1]] })),
];
/** SECONDARY: flakes or petals turning colour as they fall (the suit's, then the film's). */
export const flakes = (R, o = {}) => sprites(R, { count: [12, 16], shape: 'petal', spawn: 'column', r: 0.9, height: 1.8, offset: [0, 0.4, 0], dir: 'sphere', speed: [0.3, 1], size: [0.08, 0.13],
  life: [0.9, 1.4], drag: 1.5, gravity: 1.2, color: 'suit', colorEnd: 'film', spin: [-3, 3], at: 0.1 }, o);
/** TERTIARY: a shimmer left where it passed: a flow over a faint band. */
export const shimmer = (S, R, o = {}) => piece(S, R, o, { r: 0.7, h: 2, y: 0, dur: 1.2, g: 0.4 }, (p, held) => ({
  form: 'band', main: 'noise', tile: [3, 2], scroll: [0.05, 0.3], flow: 'noise', flowK: 0.1, flowScroll: [0, 0.6], scale: p.r, stretch: [1, p.h / p.r, 1], offset: [0, p.y, 0], edgeV: [0.2, 0.5], rim: -0.5,
  erode: held ? 0.25 : [[0, 0.25], [0.3, 0.3], [1, 1]], rampShift: -0.2, k: held ? 0.5 : [[0, 0], [0.25, 0.45], [1, 0.45]], at: held ? 0 : 0.15 }));

// ==== Spellscription: written ================================================================================================
/** PRIMARY: a circle written on the ground: a ring of the running hand, its erosion run backwards so it is written in, then let go. */
export const writtenRing = (S, R, o = {}) => piece(S, R, o, { r: 2.5, y: 0.04, dur: 1 }, (p, held) => ({
  form: 'ring', main: 'script', tile: [Math.max(4, Math.round(p.r * 4)), 0.3], scroll: [0.04, 0], mask: 'noise', maskTile: [3, 1], maskScroll: [0.06, 0],
  scale: held ? p.r : [[0, 0.92 * p.r], [0.3, p.r], [1, 1.02 * p.r]], offset: [0, p.y, 0], edgeV: [0.25, 0.25], core: 0.35, spin: held ? 0.15 : 0.3, glow: R.glow * 1.25,
  erode: held ? 0.06 : growsIn(0.3, 0.7), turn: 'random' }));
/** PRIMARY: strokes written in the air: a crescent ribbon of the running hand swept across the front at chest height. */
export const strokes = (S, R, o = {}) => piece(S, R, o, { r: 1.2, y: 1.2, dur: 0.6 }, (p) => ({
  form: 'crescent', face: 'heading', main: 'script', tile: [4, 0.4], scroll: [0.6, 0], scale: [[0, 0.7 * p.r], [1, p.r]], offset: [0, p.y, 0], spin: 2.2,
  erode: [[0, 0.5], [0.2, 0.04], [0.6, 0.08], [1, 1]] }));
/** SECONDARY: a band of the running hand circling at chest height. */
export const scriptBand = (S, R, o = {}) => piece(S, R, o, { r: 0.75, h: 0.35, y: 1, dur: 0.9 }, (p, held) => ({
  form: 'band', main: 'script', tile: [Math.max(3, Math.round(p.r * 6)), 0.35], scroll: [0.08, 0], scale: p.r, stretch: [1, p.h / p.r, 1], offset: [0, p.y, 0], edgeV: [0.2, 0.2], rim: -0.3,
  core: 0.3, spin: -0.4, glow: R.glow * 1.3, erode: held ? 0.08 : growsIn(0.2, 0.65) }));
/** SECONDARY: a seal stamped: a disc of the Comb's cells pressed down hard and lifted. */
export const seal = (S, R, o = {}) => piece(S, R, o, { r: 0.8, y: 0.05, dur: 0.5 }, (p) => ({
  form: 'disc', main: 'cells', tile: [6, 2], scroll: [0, 0.05], mask: 'script', maskK: 0.6, maskTile: [3, 0.5], scale: [[0, 1.6 * p.r], [0.15, p.r], [1, 1.05 * p.r]], offset: [0, p.y, 0],
  edgeV: [0.2, 0.25], core: 0.6, erode: erodes(0.4) }));
/** TERTIARY: ink motes in the suit's dark, drifting down. */
export const inkMotes = (R, o = {}) => sprites(R, { count: [10, 14], shape: 'soft', spawn: 'column', r: 1, height: 1.6, offset: [0, 0.4, 0], dir: 'sphere', speed: [0.1, 0.4], size: [0.05, 0.1],
  sizeEnd: 0, life: [1, 1.6], drag: 1, gravity: 0.3, color: 'suit', colorEnd: 'ink', alpha: 0.8, at: 0.2 }, o);
