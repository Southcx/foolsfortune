// ---------------------------------------------------------------------------------------
// A SHAPE'S RAMPS: the gradients a shape layer (vfx/shapes/layer.js) reads its colour AND its alpha from, one row each of one small
// texture (256 x 32, RGBA, filtered). A layer's value (its pattern times its mask and edges) is the row's x: the low end is clear, so the
// faint parts of a shape fade out by the ramp's own alpha (gradient transparency), and the high end is the hot colour; the layer's
// `rampShift` slides the read down the row over its life, so it cools as it dies (white-hot to its colour to dark) and goes clear.
//
// One row a thing a caller may name: the seven feelings (anchored on progress/weather.js COLOR, each with its own character), the seven
// domains (their glazes, ui/domainlook.js), the four suits (vfx/readingview.js SUIT_LOOK) and the wild card (the film), and the
// neutrals: the film (Lachryma's oil film, vfx/oxidation.js FILM), gold, ember, white (white-hot to clear), ink (dark, for an alpha-over
// shape: smoke, Dread) and tint (white to clear, coloured by the layer's tint). A layer may name its row through its caller's context
// ('feeling', 'domain', 'suit'), so ONE effect is skinned by whoever plays it: a class art's burst in its domain's glaze, a shell's in
// its feeling. Stops are written as a painter picks them (sRGB hex); the program takes them to linear light (vfx/shapes/program.js).
//
// Gall's row keeps its feeling's violet (COLOR.gall: the feelings own their hues, CLAUDE.md and the glossary) at its heart, with the
// olive and bile of its character at its two ends, as the shells' Gall cloud already pairs olive with lilac (vfx/library/feelings/gall.js 'shell.gall.land').
//
// Prior art: the gradient-map ("colour over value") of Riot's and Blizzard's effects (League of Legends' VFX style guide; Diablo III's
// and Overwatch's ramps: one greyscale texture, coloured and faded by a lookup), Simon Trümpler's breakdowns of the same; Unreal's
// curve atlas (many gradients as rows of one texture, a row picked by a parameter).
//
//   rampTexture()            the LUT (made once)        RAMP_ROWS   RAMPS (name -> row)   RAMP_STOPS (name -> [[t, hex, alpha], ...])
//   rampRow(name, ctx)       a row index: 'feeling' -> ctx.feeling, 'domain' -> ctx.domain, 'suit' -> ctx.suit (unknown: 'tint')
//   rampV(row)               the row's v in the LUT (its texel's centre)
//   rampHex(name, ctx, t)    a row's colour at t (0.7 by default) as hex: a sprite's colour in the same family (vfx.js color())
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';
import { DOMAIN_LOOK } from '../../ui/domainlook.js';
import { SUIT_LOOK } from '../readingview.js';
import { FILM } from '../oxidation.js';

const hex = (css) => parseInt(String(css).replace('#', ''), 16);
/** The film's four colours (linear light) as a painter's hex. */
const film = FILM.map(([r, g, b]) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace).getHex(THREE.SRGBColorSpace));
const D = (id, k) => hex(DOMAIN_LOOK[id].colours[k]);

/** Each row's stops: [t, hex (sRGB), alpha]. The low end clear, the high end hot. */
export const RAMP_STOPS = {
  // the feelings
  wonder: [[0, 0x062a33, 0], [0.28, 0x0e6a78, 0.4], [0.58, COLOR.wonder, 0.85], [0.82, 0x9ff2ff, 1], [1, 0xffffff, 1]],
  mirth: [[0, 0x4a2a00, 0], [0.3, 0xb8700a, 0.42], [0.6, COLOR.mirth, 0.85], [0.84, 0xfff0c0, 1], [1, 0xfffaf0, 1]],
  desire: [[0, 0x3a0418, 0], [0.3, 0x8a1838, 0.42], [0.55, 0xe8506a, 0.8], [0.72, COLOR.desire, 0.95], [0.88, 0xffb898, 1], [1, 0xffeee2, 1]],
  fury: [[0, 0x1a0002, 0], [0.26, 0x5a0008, 0.5], [0.5, COLOR.fury, 0.88], [0.72, 0xff5a10, 1], [0.9, 0xffc060, 1], [1, 0xffffff, 1]],
  gall: [[0, 0x1a1c08, 0], [0.28, 0x4e5a22, 0.45], [0.55, COLOR.gall, 0.85], [0.8, 0xc0a8ec, 1], [1, 0xeef0a8, 1]],
  grief: [[0, 0x0a1230, 0], [0.3, 0x2a3a78, 0.45], [0.6, COLOR.grief, 0.85], [0.85, 0xc4cee2, 1], [1, 0xeef0f4, 1]],
  dread: [[0, 0x020403, 0], [0.35, 0x0a120c, 0.6], [0.65, 0x1f3a28, 0.88], [0.86, COLOR.dread, 0.96], [1, 0x7aa088, 1]], // (mostly dark: for alpha-over, add: 0)
  // the domains, their glazes
  ouranurgy: [[0, 0x0e2a26, 0], [0.32, 0x4a7a70, 0.45], [0.64, D('ouranurgy', 'body'), 0.88], [0.86, 0xd8eee6, 1], [1, 0xffffff, 1]],
  manifestation: [[0, 0x3a1808, 0], [0.3, 0xa04a1e, 0.45], [0.55, D('manifestation', 'accent'), 0.82], [0.8, D('manifestation', 'body'), 1], [1, 0xfff8ee, 1]],
  divination: [[0, 0x0a080c, 0], [0.38, D('divination', 'body'), 0.6], [0.62, D('divination', 'edge'), 0.88], [0.84, D('divination', 'accent'), 1], [1, 0xf2f0ff, 1]],
  psychokinesis: [[0, 0x200404, 0], [0.34, 0x5a0e0e, 0.5], [0.62, D('psychokinesis', 'body'), 0.88], [0.86, 0xd88a7a, 1], [1, 0xf6e0d8, 1]],
  possession: [[0, 0x140a1e, 0], [0.3, D('possession', 'accent'), 0.5], [0.6, D('possession', 'body'), 0.88], [0.85, 0xbcc8e8, 1], [1, 0xeef2fa, 1]],
  alteration: [[0, 0x10142a, 0], [0.3, D('alteration', 'accent'), 0.5], [0.52, 0x7a3a7a, 0.75], [0.72, D('alteration', 'body'), 0.95], [0.9, 0xe88a7a, 1], [1, 0xffe6dc, 1]],
  spellscription: [[0, 0x0a1430, 0], [0.34, 0x1a3478, 0.55], [0.6, D('spellscription', 'body'), 0.9], [0.84, 0x8aa4dc, 1], [1, D('spellscription', 'ground'), 1]],
  // the suits, and the wild card
  wands: [[0, 0x2a0800, 0], [0.34, 0xa83010, 0.5], [0.62, SUIT_LOOK.wands, 0.9], [0.85, 0xffc080, 1], [1, 0xfff4e0, 1]],
  cups: [[0, 0x04202e, 0], [0.34, 0x1a6488, 0.5], [0.62, SUIT_LOOK.cups, 0.9], [0.85, 0xa8e0f4, 1], [1, 0xf0fbff, 1]],
  swords: [[0, 0x10142a, 0], [0.34, 0x5a6490, 0.5], [0.66, SUIT_LOOK.swords, 0.9], [1, 0xffffff, 1]],
  pentacles: [[0, 0x2a1a00, 0], [0.34, 0x8a6418, 0.5], [0.62, SUIT_LOOK.pentacles, 0.9], [0.85, 0xfff0b0, 1], [1, 0xfffbea, 1]],
  wild: [[0, 0x17111f, 0], [0.22, film[0], 0.45], [0.42, film[1], 0.75], [0.62, film[2], 0.95], [0.8, film[3], 1], [1, 0xfff6ff, 1]],
  // the neutrals
  film: [[0, 0x17111f, 0], [0.25, film[0], 0.5], [0.48, film[1], 0.8], [0.7, film[2], 1], [0.86, film[3], 1], [1, 0xfff0ff, 1]],
  gold: [[0, 0x2a1800, 0], [0.34, 0x8a5a10, 0.5], [0.64, 0xffd76a, 0.9], [0.86, 0xfff0c0, 1], [1, 0xffffff, 1]],
  ember: [[0, 0x1a0400, 0], [0.3, 0x6a1804, 0.5], [0.6, 0xff9a5c, 0.9], [0.84, 0xffd0a0, 1], [1, 0xfff6e8, 1]],
  white: [[0, 0xffffff, 0], [0.5, 0xffffff, 0.6], [1, 0xffffff, 1]],
  ink: [[0, 0x140c1e, 0], [0.4, 0x1a1420, 0.45], [0.75, 0x0e0a12, 0.8], [1, 0x050308, 0.95]],
  tint: [[0, 0xffffff, 0], [0.35, 0xffffff, 0.4], [0.7, 0xffffff, 0.85], [1, 0xffffff, 1]],
};
export const RAMP_ROWS = 32;
/** Each row's index in the LUT. */
export const RAMPS = Object.fromEntries(Object.keys(RAMP_STOPS).map((k, i) => [k, i]));
const W = 256;

/** A row's colour and alpha at t, as sRGB bytes (linear between stops, in sRGB: a painter's gradient). */
function sample(stops, t, out) {
  let i = 1; while (i < stops.length - 1 && stops[i][0] < t) i++;
  const [t0, c0, a0] = stops[i - 1], [t1, c1, a1] = stops[i], k = Math.min(1, Math.max(0, (t - t0) / Math.max(1e-6, t1 - t0)));
  for (let c = 0; c < 3; c++) { const s = 16 - c * 8, x = (c0 >> s) & 255, y = (c1 >> s) & 255; out[c] = x + (y - x) * k; }
  out[3] = (a0 + (a1 - a0) * k) * 255;
  return out;
}

let _lut = null;
/** The LUT: one row a ramp, made once and shared by every shape layer. */
export function rampTexture() {
  if (_lut) return _lut;
  const data = new Uint8Array(W * RAMP_ROWS * 4), px = [0, 0, 0, 0];
  for (const [name, row] of Object.entries(RAMPS)) for (let x = 0; x < W; x++) {
    sample(RAMP_STOPS[name], x / (W - 1), px);
    for (let c = 0; c < 4; c++) data[(row * W + x) * 4 + c] = Math.round(px[c]);
  }
  const t = new THREE.DataTexture(data, W, RAMP_ROWS, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.NoColorSpace; t.name = 'shape-ramps'; t.needsUpdate = true;
  return (_lut = t);
}

/** Which row a layer's `ramp` names, its caller's context resolving 'feeling', 'domain' and 'suit'; an unknown name is the tint row. */
export function rampRow(name, ctx = {}) {
  const n = name === 'feeling' ? ctx.feeling ?? ctx.aspect : name === 'domain' ? ctx.domain : name === 'suit' ? ctx.suit : name;
  return RAMPS[n] ?? RAMPS.tint;
}
/** A row's v in the LUT: its texel's centre, so the filter never mixes two rows. */
export const rampV = (row) => (row + 0.5) / RAMP_ROWS;

const _px = [0, 0, 0, 0];
/** A row's colour at t as hex (a sprite in the same family as the shape it rides with: vfx.js color(), 'feeling' / 'domain' / 'suit'). */
export function rampHex(name, ctx = {}, t = 0.7) {
  const row = rampRow(name, ctx), key = Object.keys(RAMPS)[row];
  if (key === 'tint') return null;
  const p = sample(RAMP_STOPS[key], t, _px);
  return (Math.round(p[0]) << 16) | (Math.round(p[1]) << 8) | Math.round(p[2]);
}
