// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS' KIT: the pieces the 21 pair specials' looks are built from (vfx/library/pairspecials/; the specials' rules are
// Dovina's, progress/toolpairs.js PAIR_SPECIALS; their runtime Petra's, tools/pairspecials.js). A pair's special is the sub tool's lent
// verb fed through the main's (TOOLS-TOGETHER.md 8), so its look is the two tools' own look languages BRAIDED: the main's grammar is the
// hero (PRIMARY: what happened), the sub's rides it (SECONDARY: what it was fed with), and both leave their dust (TERTIARY). Each tool's
// grammar in the house, one block a tool below:
//   the psygun       the shot: a muzzle's cone of fire, the round's line (a tracer of streaks), a four-point star where it struck
//   the Sondelass    the hook and the blade: two claws closing on what they bite, the line lit with steel, the cutlass's flat arc
//   the Crucibelle   the toll: a thin hoop of sound stood facing the view and thrown out, its hoop on the ground, smoke rings rising
//   the Veritome     the Flash and the plate: a burst of rays facing the view, the shutter's iris closing, specks left hanging
//   the Soul Brush   ink and paint: a stroke of sumi (alpha-over), a splash of the feeling's paint in its motif, the enso's circle
//   the Dreamvane    the dowse and the fork: the sonar's sweep, the fork's spun arc, the fork's ringing (a small hoop pulsing)
//   the Lockheart    the coffin and its chain: a shell of ink closing on the mouth with a lit rim, chain links (thin rings) on a line
// COLOUR: each tool's suit (progress/spreads.js TOOL_SUIT: the psygun and the Crucibelle Wands, the Sondelass and the Veritome Swords,
// the Soul Brush and the Lockheart Cups, the Dreamvane Pentacles), a shape's ramp by its name and a sprite's by the same row ('ramp:cups',
// vfx/vfx.js color()), so an effect carries its own two colours whoever plays it. Where a pair's two tools share a suit (III, IV, XI) the sub takes
// its tool's ACCENT instead: the Crucibelle's bell gold, the Veritome's Flash white, the Soul Brush's paint (the caller's feeling).
// WEIGHT: a special is a big moment, so its act is a King's (classarts/kit.js RANK.king: the brightest, more of everything, earned screen
// weight inside the budgets), and what it holds is calm enough to stand beside play (HOLD: softer, fewer, slower).
// The law of docs/plans/art/VFX-LIBRARY.md 1 is in every piece (the class arts' kit's defaults: gradient edges, scrolling past 0.2 s,
// erosion through the pattern, the ramp cooling, a white core about 0.1 s), and every one-shot shape that starts hot starts eroded
// (casebook rule 351: `fx` lifts its erosion to 0.22 for the hot tenth of a second). A data module: the class arts' kit's pieces, re-exported.
//
// Prior art: the class arts' kit's (Riot's tiers and ladder, Leroy's hit frame); Zelda: Tears of the Kingdom's fuse (two things read as
// one, each still itself); NieR: Automata's pod programs fired through the blade's swing (the sub's look riding the main's); Chrono Cross's
// innate colours (Square, 1999: a tool's colour carried on all it does); Okami's brush techniques (the ink stroke laid over the world).
//
//   pairSides(n) -> { A, B, main, sub } (A the main's colour, B the sub's: { r ramp, c sprite colour })   K   HOLD   fx(...layers) -> { layers }
//   RIM (a ring's form that reads at any size)   RING_OUT RING_LOOP (a ring's erosion, thrown out or held a loop)
//   psygun: muzzle tracer shotStar       Sondelass: bite steelLine bladeArc      Crucibelle: tollRing tollGround tollSmoke
//   Veritome: flashBurst shutter         Soul Brush: inkStroke paintSplash paintDrops enso      Dreamvane: forkArc forkRing
//   Lockheart: coffinGulp chainLinks
// ---------------------------------------------------------------------------------------
import { RANK, piece, sprites, inked } from '../classarts/kit.js';
import { TOOL_SUIT } from '../../../progress/spreads.js';
import { specialVerbs } from '../../../progress/toolpairs.js';

export {
  RANK, piece, own, sprites, weight, core, groundRing, rimRing, pool, lamp, inked, growsIn, skyColumn, skyDrop, armillary, starFall, mist,
  crystal, bloomDome, shardsIn, dust, grains, embers, smoke, lens, iris, scan, blinkOut, specks, waveWall, shock, shockFront, chips, orbitChips,
  dustCurtain, tether, spiralIn, shellClose, collar, haze, motesIn, lineMotes, sweepUp, crescents, flakes, shimmer, writtenRing, strokes,
  scriptBand, seal, inkMotes,
} from '../classarts/kit.js';

/** A special's act: a King's weight. */
export const K = RANK.king;
/** What a special holds (a mark on a creature, a channel): calm beside play, softer and fewer than its act. */
export const HOLD = { k: 0.7, glow: 1.8, n: 0.8, life: 1 };

/** A tool's own second colour, for a pair whose two tools share a suit: the bell's gold, the Flash's white, the paint's feeling. */
const ACCENT = {
  psygun: { r: 'ember', c: 'ember' }, crucibelle: { r: 'gold', c: 'gold' }, sondelass: { r: 'white', c: 'white' }, veritome: { r: 'white', c: 'white' },
  soulbrush: { r: 'feeling', c: 'feeling' }, lockheart: { r: 'film', c: 'film' }, dreamvane: { r: 'gold', c: 'gold' },
};
const side = (suit) => ({ r: suit, c: `ramp:${suit}` });
/** A pair's two colours: A the main tool's suit, B the sub's (or the sub tool's accent where the two share a suit). */
export function pairSides(n) {
  const v = specialVerbs(n), main = v.main[0], sub = v.sub[0], a = TOOL_SUIT[main], b = TOOL_SUIT[sub];
  return { A: side(a), B: a === b ? ACCENT[sub] : side(b), main, sub };
}

const at0 = (c) => (Array.isArray(c) ? c[0][1] : c ?? 0);
const valueAt = (c, t) => {
  if (!Array.isArray(c)) return c ?? 0;
  for (let i = 1; i < c.length; i++) if (t <= c[i][0]) { const [t0, v0] = c[i - 1], [t1, v1] = c[i]; return v0 + ((v1 - v0) * (t - t0)) / Math.max(1e-6, t1 - t0); }
  return c[c.length - 1][1];
};
/** Casebook rule 351: a one-shot shape that starts hot (its rampShift above 0) starts eroded, so its faded edges are cut, not lit at a
 *  third of full out to the mesh's edge; the erosion is lifted to 0.22 for the hot tenth of a second, then its own curve. */
function hotSafe(L) {
  if (L?.type !== 'shape' || L.dur === Infinity || !(at0(L.rampShift) > 0.05) || at0(L.erode) >= 0.2) return L;
  const hot = Math.min(0.45, 0.1 / Math.max(0.12, L.dur ?? 0.6)), e = L.erode ?? [[0, 0], [0.5, 0.06], [1, 1]];
  const tail = Array.isArray(e) ? e.filter(([t]) => t > hot) : [[1, e]];
  return { ...L, erode: [[0, 0.22], [hot, valueAt(e, hot)], ...tail] };
}
/** An effect from its pieces (each a layer or a list of them), every one-shot shape made hot-safe. */
export const fx = (...parts) => ({ layers: parts.flat(2).filter(Boolean).map(hotSafe) });

// ==== the psygun: the shot ===================================================================================================
/** PRIMARY: the muzzle's cone of fire thrown along the shot from the hand (its axis the shot's), white at its heart, gone in a breath. */
export const muzzle = (S, R, o = {}) => piece(S, R, o, { r: 0.2, len: 0.9, y: 1.3, dur: 0.16 }, (p) => ({
  form: 'cone', face: 'dir', main: 'rays', tile: [8, 1], scroll: [0, 3], scale: p.r, stretch: [1, [[0, (0.4 * p.len) / p.r], [1, p.len / p.r]], 1], offset: [0, p.y, 0],
  edgeV: [0.05, 0.45], rim: -0.4, core: 0.9, coreAt: 0.2, erode: [[0, 0.24], [0.3, 0.1], [1, 1]] }));
/** SECONDARY: the round's line: streaks laid along it from the muzzle to where it went (the caller's from -> to), white cooling to `c`. */
export const tracer = (R, c, o = {}) => sprites(R, { count: [10, 14], shape: 'streak', spawn: 'line', r: 0.03, dir: 'line', speed: [1, 3], size: [0.07, 0.11], sizeEnd: 0.02,
  life: [0.12, 0.24], stretch: 4, color: 'white', colorEnd: c, alpha: 1 }, o);
/** PRIMARY: the round's star where it struck: a four-point star and a thin ring thrown out, white cooling to `c`. */
export const shotStar = (R, c, o = {}) => [
  { type: 'sprites', count: 1, shape: 'star4', size: 1, sizeEnd: 0.1, life: 0.18, color: 'white', colorEnd: c, powerCount: false, offset: [0, o.y ?? 1, 0] },
  { type: 'sprites', count: 1, shape: 'ringthin', size: 0.2, sizeEnd: 1.5, life: 0.28, color: c, rot: 0, powerCount: false, offset: [0, o.y ?? 1, 0] },
];

// ==== the Sondelass: the hook and the blade =================================================================================
/** PRIMARY: the hook's bite: two claws (crescents stood up along the line, one above and one below) closing on the point and set. */
export const bite = (S, R, o = {}) => [Math.PI / 2, -Math.PI / 2].map((rot) => piece(S, R, o, { r: 0.5, y: 1, dur: 0.36 }, (p) => ({
  form: 'crescent', face: 'dir', rot, main: 'streaks', tile: [3, 1], scroll: [1.6, 0], scale: [[0, 1.9 * p.r], [0.35, p.r], [1, 0.9 * p.r]], offset: [0, p.y, 0],
  core: 0.7, coreAt: 0.3, erode: [[0, 0.3], [0.3, 0.05], [0.6, 0.1], [1, 1]] })));
/** SECONDARY: the line lit: steel streaks run along it (the caller's from -> to). */
export const steelLine = (R, c, o = {}) => sprites(R, { count: [16, 22], shape: 'streak', spawn: 'line', r: 0.05, dir: 'line', speed: [0.5, 1.6], size: [0.05, 0.09], sizeEnd: 0.02,
  life: [0.3, 0.55], stretch: 1.6, color: 'white', colorEnd: c, alpha: 0.9 }, o);
/** PRIMARY: the cutlass's arc: a ribbon of the swing stood up (a wave thinned, so it faces a camera behind or beside, never edge-on) and
 *  swept round at the waist, its edge hot. */
export const bladeArc = (S, R, o = {}) => piece(S, R, o, { r: 1.4, h: 0.22, y: 1, dur: 0.32 }, (p) => ({
  form: 'wave', main: 'streaks', mainK: 0.6, tile: [4, 1], scroll: [2.4, 0], mask: 'noise', maskK: 0.4, maskTile: [3, 1], scale: [[0, 0.7 * p.r], [1, p.r]], stretch: [1, p.h / p.r, 1],
  offset: [0, p.y - p.h / 2, 0], edgeV: [0.25, 0.25], glow: R.glow * 1.3, spin: 7, rot: -1, core: 0.8, coreAt: 0.75, erode: [[0, 0.3], [0.15, 0.05], [0.5, 0.08], [1, 1]] }));

// ==== the Crucibelle: the toll ===============================================================================================
export const RING_OUT = [[0, 0.24], [0.1, 0.04], [0.6, 0.1], [1, 1]], RING_LOOP = [[0, 0.3], [0.12, 0.06], [0.55, 0.12], [1, 1]];
/** A ring stood facing the view or laid down whose bright edge reads at 480 lines at any size: the ring's band softened to its outer rim
 *  (a hoop is a line a 22nd of its radius: under a line at half a metre). */
export const RIM = { form: 'ring', edgeV: [0.75, 0.12] };
/** PRIMARY: the toll's ring of sound: a ring stood facing the view, its rim bright, thrown out from the bell and thinning as it goes
 *  (held: one a `loop`, the beat). */
export const tollRing = (S, R, o = {}) => piece(S, R, o, { r: 2, y: 1.2, dur: 0.5 }, (p, held) => ({
  ...RIM, face: 'camera', main: 'noise', tile: [8, 1], scroll: [0.4, 0], scale: [[0, 0.15 * p.r], [1, p.r]], offset: [0, p.y, 0],
  core: 0.4, coreAt: 0.5, loop: 0.6, erode: held ? RING_LOOP : RING_OUT, ...(held ? { k: [[0, 0], [0.1, 1], [1, 1]] } : {}) }));
/** SECONDARY: the toll on the ground: a ring's bright rim running out along it to the toll's reach (a hoop's line from 3 m out, a band
 *  that broad would cover the ground), inked under (held: one a `loop`). */
export const tollGround = (S, R, o = {}) => inked(piece(S, R, o, { r: 4, y: 0.04, dur: 0.6 }, (p, held) => ({
  ...(p.r >= 3 ? { form: 'hoop', edgeV: [0.1, 0.1] } : { ...RIM, edgeV: [0.85, 0.1] }), main: 'noise', tile: [10, 1], scroll: [0.3, 0], scale: [[0, 0.12 * p.r], [1, p.r]], offset: [0, p.y, 0], core: 0.5, coreAt: 0.4,
  loop: 0.6, erode: held ? RING_LOOP : RING_OUT, ...(held ? { k: [[0, 0], [0.1, 1], [1, 1]] } : {}), turn: 'random' })), 0.35);
/** TERTIARY: the toll's smoke rings: thin rings drifting up off the bell and widening. */
export const tollSmoke = (R, c, o = {}) => sprites(R, { count: [3, 4], shape: 'ringthin', dir: 'up', speed: [0.4, 0.9], size: [0.2, 0.3], sizeEnd: [0.8, 1.2], life: [0.6, 0.9],
  delay: [0, 0.2], color: c, alpha: 0.7, rot: 0 }, { y: 1.3, ...o });

// ==== the Veritome: the Flash and the plate =================================================================================
/** PRIMARY: the Flash: a burst of rays stood facing the view, white-hot for a breath, then its colour, eroding outward. */
export const flashBurst = (S, R, o = {}) => piece(S, R, o, { r: 1.1, y: 1.3, dur: 0.32 }, (p) => ({
  form: 'disc', face: 'camera', main: 'rays', tile: [14, 1], scroll: [0.1, 1.4], scale: [[0, 0.3 * p.r], [0.2, p.r], [1, 1.2 * p.r]], offset: [0, p.y, 0], edgeV: [0, 0.65],
  core: 0.9, coreAt: 0.4, erode: [[0, 0.24], [0.15, 0.05], [1, 1]] }));
/** SECONDARY: the shutter: the lens's iris of blades stood facing the view, closing on its point (the plate taken). */
export const shutter = (S, R, o = {}) => piece(S, R, o, { r: 0.7, y: 1.3, dur: 0.4 }, (p) => ({
  form: 'ring', face: 'camera', main: 'rays', tile: [9, 1], scroll: [0.3, 0], mask: 'noise', maskTile: [3, 1], maskScroll: [-0.1, 0], scale: [[0, 1.6 * p.r], [0.45, 0.55 * p.r], [1, 0.4 * p.r]],
  offset: [0, p.y, 0], edgeV: [0.3, 0.3], spin: -2.4, core: 0.5, erode: [[0, 0.3], [0.2, 0.04], [0.6, 0.08], [1, 1]] }));

// ==== the Soul Brush: ink and paint ========================================================================================
/** PRIMARY (or a light's ground): a stroke of sumi swept across the front (alpha-over ink, its bristles' streaks). */
export const inkStroke = (R, o = {}) => piece('ink', R, o, { r: 1.3, y: 1, dur: 0.6 }, (p) => ({
  form: 'crescent', face: 'heading', add: 0, glow: 1, main: 'streaks', tile: [3, 1], scroll: [1.2, 0], mask: 'noise', maskK: 0.6, maskTile: [2, 1], scale: [[0, 0.8 * p.r], [1, p.r]],
  offset: [0, p.y, 0], spin: 4, rot: -0.8, edgeV: [0.35, 0.2], core: 0, rampShift: [[0, 0], [1, -0.2]], kmul: 0.75, erode: [[0, 0.25], [0.2, 0.06], [0.55, 0.1], [1, 1]] }));
/** PRIMARY: a splash of the feeling's paint on the ground, in its motif (the caller's ctx.feeling), growing out and eroding; inked under. */
export const paintSplash = (R, o = {}) => inked(piece('feeling', R, o, { r: 1.2, y: 0.04, dur: 0.9 }, (p) => ({
  form: 'disc', main: 'motif', mainK: 0.55, tile: [2, 1], scroll: [0.02, 0.2], mask: 'noise', maskK: 0.7, maskTile: [3, 1], flow: 'noise', flowK: 0.05, scale: [[0, 0.3 * p.r], [0.25, p.r], [1, 1.08 * p.r]],
  offset: [0, p.y, 0], edgeV: [0, 0.45], core: 0.4, erode: [[0, 0.25], [0.12, 0.06], [0.55, 0.12], [1, 1]], turn: 'random' })), 0.4);
/** SECONDARY: drops of the paint thrown up and falling back to the ground (the caller's feeling). */
export const paintDrops = (R, o = {}) => sprites(R, { count: [10, 14], shape: 'drip', spawn: 'disc', r: 0.3, dir: 'cone', axis: 'up', cone: 50, speed: [2, 4.5], size: [0.06, 0.11],
  sizeEnd: 0.04, life: [0.5, 0.8], gravity: 9, drag: 0.4, floor: 'ground', color: 'feeling', alpha: 1 }, { y: 0.2, ...o });
/** PRIMARY: the enso: a circle written round on the ground with one stroke, its tail tapering (written in, then let go): the brush's light
 *  (S) over its sumi (the ink copy under it), so it reads on the noon sand and in the dark alike. */
export const enso = (S, R, o = {}) => inked(piece(S, R, o, { r: 2, y: 0.05, dur: 1.2 }, (p) => ({
  form: 'ring', main: 'noise', tile: [6, 1], scroll: [0.3, 0], mask: 'noise', maskK: 0.5, maskTile: [3, 1], scale: p.r, offset: [0, p.y, 0], edgeV: [0.3, 0.25], edgeU: [0.02, 0.3],
  core: 0.3, erode: [[0, 0.95], [0.25, 0.05], [0.7, 0.1], [1, 1]], turn: 'random' })), 0.6, 1.02);

// ==== the Dreamvane: the dowse and the fork ================================================================================
/** PRIMARY: the fork thrown: its spun arc over the shoulder, a ribbon stood up (its tines' stripes) turning fast round the hand. */
export const forkArc = (S, R, o = {}) => piece(S, R, o, { r: 0.8, h: 0.3, y: 1.5, dur: 0.35 }, (p) => ({
  form: 'wave', main: 'rays', mainK: 0.6, tile: [6, 1], scroll: [2.4, 0], mask: 'noise', maskK: 0.4, maskTile: [2, 1], glow: R.glow * 1.3, scale: [[0, 0.5 * p.r], [1, p.r]], stretch: [1, p.h / p.r, 1],
  offset: [0, p.y - p.h / 2, 0], edgeV: [0.3, 0.3], spin: 14, rot: -1.2, core: 0.7, erode: [[0, 0.3], [0.2, 0.05], [0.55, 0.1], [1, 1]] }));
/** SECONDARY: the fork ringing: a small hoop stood facing the view, pulsing out from the tines (held: one a `loop`, its tone). */
export const forkRing = (S, R, o = {}) => tollRing(S, R, { r: 0.6, y: 0, dur: 0.35, loop: 0.32, ...o });

// ==== the Lockheart: the coffin and its chain ==============================================================================
/** PRIMARY: the coffin's gulp: a shell of ink closing on its mouth (alpha-over) and a lit rim closing over it (S). */
export const coffinGulp = (S, R, o = {}) => [
  piece('ink', R, o, { r: 0.6, y: 1.2, dur: 0.45 }, (p) => ({ form: 'sphere', add: 0, glow: 1, main: 'marble', tile: [3, 2], scroll: [0.1, 0.4], scale: [[0, 1.8 * p.r], [0.6, 0.45 * p.r], [1, 0.2 * p.r]],
    offset: [0, p.y, 0], rim: -0.5, core: 0, kmul: 0.7, rampShift: 0, erode: [[0, 0.3], [0.5, 0.1], [1, 1]] })),
  piece(S, R, o, { r: 0.6, y: 1.2, dur: 0.45 }, (p) => ({ form: 'sphere', main: 'cells', tile: [4, 2], scroll: [0.05, -0.6], scale: [[0, 1.9 * p.r], [0.6, 0.5 * p.r], [1, 0.25 * p.r]],
    offset: [0, p.y, 0], rim: 0.85, rimPow: 2.2, core: 0.6, erode: [[0, 0.3], [0.4, 0.06], [1, 1]] })),
];
/** SECONDARY: the chain: its links (thin rings) laid along a line (the caller's from -> to), a glint each. */
export const chainLinks = (R, c, o = {}) => sprites(R, { count: [14, 18], shape: 'ringthin', spawn: 'line', r: 0.02, dir: 'line', speed: [0, 0.2], size: [0.12, 0.16], sizeEnd: 0.1,
  life: [0.35, 0.55], color: 'white', colorEnd: c, alpha: 1, spin: [-3, 3] }, o);
