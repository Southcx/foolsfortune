// ---------------------------------------------------------------------------------------
// THE COLOUR WHEEL'S ONE COLOUR FUNCTION (docs/plans/SOUL-ALCHEMY.md 4.16): every colour at the spirit press is drawn by
// `wheelColour(h, s)`, so a soul bead dead on its tile is the tile's own colour and the match can vanish (the tiles and the seals'
// glaze, the soul bead, the ghost paths, the line blend's droplets, the lumps; next the hue ring's lights, the press's eye, the soul
// glow and the Pneuka Box's material icons). A colour is a place on the colour wheel: `h` the hue in degrees (the bearing on the bath),
// `s` the saturation 0 .. 1 (the distance out from the grey centre).
//
// Drawn perceptually, in Oklab (Ottosson 2020): the wheel's angle is an Oklab hue turned so that 0 sits at sRGB red; chroma follows
// saturation (CHROMA at the lip, about 0.11 at the tiles' 0.65: glazes, not neon), clipped to the screen's gamut by keeping lightness
// and hue; lightness is the grey centre's at nothing and leans lighter toward yellow and darker toward violet as saturation grows, so
// each hue carries its natural value (Munsell's point: equal steps on the wheel look equal). Measured on the seven tiles: neighbours
// 0.096 to 0.131 apart in Oklab (the HSL ring it replaces ran 0.112 to 0.326, yellow and green crowded); under deuteranopia
// (Machado 2009) Dexterity and Visualization fall to 0.028, which is why every tile also has its seal.
//
// Prior art: Björn Ottosson's Oklab (2020), Albert Munsell's A Color Notation (1905: hue, value and chroma kept apart), and the
// colour booth's neutral grey (the centre is a true grey, the same at every hue).
//
//   wheelColour(h, s, out?) -> THREE.Color (linear, as materials want)   wheelSRGB(h, s) -> [r, g, b] 0..1 sRGB (a canvas, the Box)
//   wheelOklab(h, s) -> [L, a, b] (unclipped)   oklabColour(L, a, b, out?, max?) -> THREE.Color, chroma clipped into the gamut (or under max)
//   GREY_L (the grey centre's lightness)   CHROMA (at the lip)   oklabDistance(c1, c2) (a THREE.Color pair: how far apart they look)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const GREY_L = 0.62; // (the grey centre's lightness: the bare clay, and every hue at saturation 0)
export const CHROMA = 0.17; // (Oklab chroma at the lip, saturation 1; the tiles' 0.65 is 0.11)
const LEAN = 0.16; // (lightness leans this much toward yellow, and as much away from it toward violet, at saturation 1)

const cbrt = Math.cbrt;
/** Linear sRGB -> Oklab. */
export function toOklab(r, g, b) {
  const l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
/** Oklab -> linear sRGB (unclamped). */
export function fromOklab(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const hueOf = (rgb) => { const [, a, b] = toOklab(...rgb); return Math.atan2(b, a); };
const RED = hueOf([1, 0, 0]), YELLOW = hueOf([1, 1, 0]); // (radians: 0.51 and 1.92)

/** A place on the colour wheel in Oklab, before the gamut: [L, a, b]. */
export function wheelOklab(h, s) {
  const sat = Math.max(0, Math.min(1, s)), H = (h * Math.PI) / 180 + RED;
  return [GREY_L + LEAN * sat * Math.cos(H - YELLOW), CHROMA * sat * Math.cos(H), CHROMA * sat * Math.sin(H)];
}
const inGamut = (c, max) => c[0] >= -1e-4 && c[0] <= max + 1e-4 && c[1] >= -1e-4 && c[1] <= max + 1e-4 && c[2] >= -1e-4 && c[2] <= max + 1e-4;
/** Oklab to linear sRGB, its chroma pulled in (lightness and hue kept) until it fits the screen (or no channel passes `max`). */
export function clipped(L, a, b, max = 1) {
  let rgb = fromOklab(L, a, b); if (inGamut(rgb, max)) return rgb;
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) { const k = (lo + hi) / 2; if (inGamut(fromOklab(L, a * k, b * k), max)) lo = k; else hi = k; }
  rgb = fromOklab(L, a * lo, b * lo); return rgb.map((v) => Math.max(0, Math.min(max, v)));
}
export function oklabColour(L, a, b, out = new THREE.Color(), max = 1) { const [r, g, bl] = clipped(L, a, b, max); return out.setRGB(r, g, bl, THREE.LinearSRGBColorSpace); }
/** THE colour of a place on the colour wheel, linear (as a material's colour or a shader's uniform wants it). */
export function wheelColour(h, s, out = new THREE.Color()) { const [L, a, b] = wheelOklab(h, s); return oklabColour(L, a, b, out); }
const enc = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
/** The same, sRGB-encoded 0..1 (a 2D canvas, a CSS colour). */
export function wheelSRGB(h, s) { const [L, a, b] = wheelOklab(h, s); return clipped(L, a, b).map(enc); }
/** How far apart two colours look (Oklab distance; about 0.02 to 0.05 reads as the same at the press's sizes). */
export function oklabDistance(c1, c2) { const p = toOklab(c1.r, c1.g, c1.b), q = toOklab(c2.r, c2.g, c2.b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
