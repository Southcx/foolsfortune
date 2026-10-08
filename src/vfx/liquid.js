// ---------------------------------------------------------------------------------------
// LIQUID: what every liquid in the game is drawn with, water and Lachryma alike (the owner, R58: "the water and Lachryma are going to be
// one of the most important visual elements in the game"). One texture and one shader chunk, so a pool, the crude sea, the shore's swash
// and whatever comes next all move the same way and catch the light the same way:
//
//   THE PACKS the owner's noise photographs, baked tileable by scripts/bake_liquid.py (src/assets/liquid_pack.webp, 512 px, four grey
//             channels): R the oil MARBLING (cells and veins), G the BUBBLES (rings and foam), B the SAND RIPPLES, A the marbling's
//             VEINS (its bright ridges: the film's veins); and a second pack from the owner's noise gradients
//             (liquid_pack2.webp: R a dense caustic net, G a finer one, B wind-streaked ripples, A soft glowing cells)
//   NORMALS   two layers of the marbling scrolled against each other at different scales and angles, their slope taken by finite
//             differences into a normal (Valve's and every water shader since: two crossing normal layers never repeat the same way
//             twice); `liqNormal(xz, scale, t, strength)`
//   CAUSTICS  a Voronoi cell texture (the owner's recipe, 2026-10-08), baked once at load (`causticTexture()`: 256 px, 8 by 8 cells,
//             tiling, mipmapped): the cells' borders (F2 - F1: where a wavy surface focuses the sun) as bright threads that swell into
//             knots where three cells meet, the borders bent by a warp so no cell is a polygon. Drawn in TWO LAYERS: the same net
//             twice, the second offset in hue, position, saturation and transparency, so where the two meet the line is white and where
//             they part its edges split into colour (the dispersion of a real caustic). The marbling, slow and low, bends the net as it
//             drifts (it writhes in place) and lays light and shade over it, so no net repeats evenly. Sampled with gradients from the
//             pixel's footprint (`px`, metres a pixel, from fwidth taken where every fragment runs), so a line thinner than a pixel
//             fades into its own mip average and never crawls at 480 lines; `liqCaustics(xz, scale, t, px)` -> rgb. Numbers: CAUSTICS
//   RIPPLES   the owner's wind-streaked ripples (pack 2) as the fine chop on water; `liqRipple(xz, scale, t, strength)`
//   GLOW      soft glowing cells (pack 2), light pooled inside Lachryma; `liqGlow(xz, scale, t)`
//   FOAM      the bubbles channel against a threshold that rises toward the shore and breathes, so foam is made of bubbles, not a band;
//             `liqFoam(xz, scale, t, amount)`
//   FILM      thin-film interference colours (an oil slick's), `liqFilm(t)`: Lachryma's own palette (the cubes', the crude's)
//   SPARKLE   a sun highlight on the perturbed normal (on water broad and soft, its size by a slow field of gloss: vfx/water.js), and
//             glints where the fine bubbles cross it: the water's sparkle moves at its own rate, and that is welcome (the owner, R58: the
//             old "no shimmer" line was about a bug in the sand, not about water)
//
// Prior art: (see the header of vfx/water.js, where the techniques are put together, and docs/ART.md, "Liquid"). The caustics: Worley's
// cellular texture (SIGGRAPH 1996; F2 - F1 for the borders, Inigo Quilez's "Voronoi edges"), the fake caustics of every stylised water
// since Wind Waker (a cell texture on the floor in two layers: Zucconi, "Rendering caustics", 2019) with the chromatic split of the
// RGB-offset trick (each colour a little apart), and Valve's flow-mapped water (Vlachos 2010) for the bend that makes the net writhe.
//
//   import { liquidUniforms, LIQUID_GLSL } from './liquid.js'   uniforms: { ...liquidUniforms() }   GLSL: LIQUID_GLSL
//   vec3 c = liqCaustics(floorXZ, 1.0, t, px);    (px = max(fwidth(floorXZ)): metres a pixel, taken where every fragment runs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import packB64 from '../assets/liquid_pack.webp?b64';
import pack2B64 from '../assets/liquid_pack2.webp?b64';

const _tex = {};
function pack(key, b64) {
  if (_tex[key]) return _tex[key];
  // (the fourth channel is data, not coverage: decoded as an ImageBitmap with premultiplyAlpha 'none', so a browser that premultiplies
  // an <img> on decode (WebKit) cannot zero the colour under the texels whose alpha is 0, more than half of them)
  const t = _tex[key] = new THREE.Texture();
  const L = new THREE.ImageBitmapLoader(); L.setOptions({ premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  L.load(`data:image/webp;base64,${b64}`, (bmp) => { t.image = bmp; t.needsUpdate = true; });
  t.flipY = false; // (an ImageBitmap is never flipped on upload; the noise tiles either way)
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace; // (data, not colour)
  t.anisotropy = 4;
  return t;
}
/** The first pack, loaded once and shared: repeat-wrapped, mipmapped (the far water reads as its average, never as noise). */
export function liquidTexture() { return pack('a', packB64); }
/** The second pack (the owner's noise gradients: caustic nets (unread since the Voronoi caustics), wind ripples, glowing cells). */
export function liquidTexture2() { return pack('b', pack2B64); }
/** The caustics' numbers (read into LIQUID_GLSL and the bake when they are built: tune and reload). The bake: `size` px, `cells` across
 *  it, `jitter` of a seed in its cell, `warp` (cells) bending the borders, `thread` and `knot` the line's half-width along an edge and
 *  where three cells meet (cells, of F2 - F1), `glow` the soft light inside a cell toward its rim. The draw: `bend` (cells) the marbling
 *  bends the net by, `drift` the net's slide (cells a second of the caller's clock); the two layers' `hue` (linear rgb: the first warm
 *  and near white, the second cool and more saturated) and `alpha` (their transparency), the second's `offset` from the first (cells),
 *  its `wander` about that; `wash` the darkest of the slow light and shade over both. */
export const CAUSTICS = {
  size: 256, cells: 8, jitter: 0.8, warp: 0.22, thread: 0.08, knot: 0.17, glow: 0.12,
  bend: 0.7, drift: [0.011, -0.007],
  hue: [[1.0, 0.84, 0.58], [0.4, 0.72, 1.0]], alpha: [0.8, 0.6], offset: [0.07, 0.05], wander: 0.03, wash: 0.3,
};
let _caus = null;
/** The Voronoi cell texture, baked once (a fixed seed: the same net every boot): one channel, tiling, mipmapped (the far floor reads as
 *  the net's average, never as noise). */
export function causticTexture() {
  if (_caus) return _caus;
  const { size: S, cells: C, jitter, warp, thread, knot, glow } = CAUSTICS, data = new Uint8Array(S * S), sx = new Float32Array(C * C), sy = new Float32Array(C * C);
  let h = 0x2545f491;
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  for (let i = 0; i < C * C; i++) { sx[i] = 0.5 + (rnd() - 0.5) * jitter; sy[i] = 0.5 + (rnd() - 0.5) * jitter; }
  const k = (2 * Math.PI) / C, ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u0 = (x + 0.5) / S * C, v0 = (y + 0.5) / S * C;
    const u = u0 + warp * (Math.sin(v0 * k * 2 + 1.3) + 0.5 * Math.sin((u0 + v0) * k * 3 + 0.4)); // (whole waves over the tile: it still tiles)
    const v = v0 + warp * (Math.sin(u0 * k * 2 + 2.1) + 0.5 * Math.sin((u0 - v0) * k * 3 + 2.7));
    const ci = Math.floor(u), cj = Math.floor(v);
    let f1 = 9, f2 = 9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj, n = (((j % C) + C) % C) * C + (((i % C) + C) % C);
      const d = Math.hypot(i + sx[n] - u, j + sy[n] - v);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    const w = thread + (knot - thread) * ss(0.38, 0.72, f1), e = f2 - f1;
    let l = 1 - ss(0, w, e); l *= l;
    data[y * S + x] = Math.round(255 * Math.min(1, l + glow * ss(0.3, 0.8, f1) ** 2));
  }
  const t = _caus = new THREE.DataTexture(data, S, S, THREE.RedFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 4; t.colorSpace = THREE.NoColorSpace; t.unpackAlignment = 1; t.needsUpdate = true;
  return t;
}
/** The packs and the caustics' cells, as the uniforms LIQUID_GLSL reads: spread them into a material's uniforms. */
export const liquidUniforms = () => ({ uLiq: { value: liquidTexture() }, uLiq2: { value: liquidTexture2() }, uLiqC: { value: causticTexture() } });

export const LIQUID_GLSL = /* glsl */`
uniform sampler2D uLiq, uLiq2, uLiqC;
const mat2 LIQ_ROT = mat2(0.8, -0.6, 0.6, 0.8);
vec4 liqTap(vec2 p) { return texture2D(uLiq, p); }
// the swell's height at a point: two marbling layers crossing
float liqHeight(vec2 xz, float scale, float t) {
  vec2 a = xz * scale + vec2(t * 0.021, t * 0.013), b = LIQ_ROT * (xz * scale * 1.73) + vec2(-t * 0.017, t * 0.026);
  return liqTap(a).r * 0.6 + liqTap(b).r * 0.4;
}
// its normal (y up), by the slope of the two layers
vec3 liqNormal(vec2 xz, float scale, float t, float strength) {
  float e = 0.75 / (512.0 * scale); // (about a texel and a half, in metres)
  float hx = liqHeight(xz + vec2(e, 0.0), scale, t) - liqHeight(xz - vec2(e, 0.0), scale, t);
  float hz = liqHeight(xz + vec2(0.0, e), scale, t) - liqHeight(xz - vec2(0.0, e), scale, t);
  return normalize(vec3(-hx * strength, 1.0, -hz * strength));
}
// THE CAUSTICS: the Voronoi cell texture in two layers (see the header; CAUSTICS in vfx/liquid.js holds the numbers). px: metres a
// pixel, so the taps take their mip from the footprint and not from derivatives (a caller may draw them inside a branch)
vec3 liqCaustics(vec2 xz, float scale, float t, float px) {
  vec2 p = xz * scale, g = vec2(px * scale * ${(1 / CAUSTICS.cells).toFixed(4)}, 0.0);
  vec2 mp = p * 0.083 + vec2(t * 0.011, -t * 0.008);
  vec4 m = textureGrad(uLiq, mp, g * 0.083 * ${CAUSTICS.cells.toFixed(1)}, g.yx * 0.083 * ${CAUSTICS.cells.toFixed(1)}); // (the marbling, slow and low: the bend and the wash)
  vec2 q = (p + (m.ra - 0.5) * ${CAUSTICS.bend.toFixed(3)} + vec2(t * ${CAUSTICS.drift[0].toFixed(4)}, t * ${CAUSTICS.drift[1].toFixed(4)})) * ${(1 / CAUSTICS.cells).toFixed(4)};
  vec2 o = (vec2(${CAUSTICS.offset[0].toFixed(3)}, ${CAUSTICS.offset[1].toFixed(3)}) + ${CAUSTICS.wander.toFixed(3)} * vec2(sin(t * 0.23), cos(t * 0.19))) * ${(1 / CAUSTICS.cells).toFixed(4)}; // (the second layer: the same net a little apart, wandering at its own pace)
  float a = textureGrad(uLiqC, q, g, g.yx).r, b = textureGrad(uLiqC, q + o, g, g.yx).r;
  float wash = mix(${CAUSTICS.wash.toFixed(2)}, 1.0, smoothstep(0.25, 0.75, m.r)); // (light and shade over the net, every dozen cells)
  return (vec3(${CAUSTICS.hue[0].map((v) => v.toFixed(3)).join(', ')}) * a * ${CAUSTICS.alpha[0].toFixed(2)} + vec3(${CAUSTICS.hue[1].map((v) => v.toFixed(3)).join(', ')}) * b * ${CAUSTICS.alpha[1].toFixed(2)}) * wash;
}
// the fine chop: the wind-streaked ripples, two layers crossing, as a normal
vec3 liqRipple(vec2 xz, float scale, float t, float strength) {
  float e = 0.75 / (512.0 * scale);
  vec2 d1 = vec2(t * 0.04, t * 0.011), d2 = vec2(-t * 0.027, t * 0.035);
  #define LIQ_RH(p) (texture2D(uLiq2, (p) * scale + d1).b * 0.6 + texture2D(uLiq2, LIQ_ROT * (p) * scale * 1.6 + d2).b * 0.4)
  float hx = LIQ_RH(xz + vec2(e, 0.0)) - LIQ_RH(xz - vec2(e, 0.0)), hz = LIQ_RH(xz + vec2(0.0, e)) - LIQ_RH(xz - vec2(0.0, e));
  #undef LIQ_RH
  return normalize(vec3(-hx * strength, 1.0, -hz * strength));
}
// light pooled inside: the soft glowing cells, drifting slowly
float liqGlow(vec2 xz, float scale, float t) { return texture2D(uLiq2, xz * scale + vec2(t * 0.008, -t * 0.006)).a; }
// foam made of bubbles: the bubbles channel over a threshold that falls as amount (0..1) rises
float liqFoam(vec2 xz, float scale, float t, float amount) {
  float g = liqTap(xz * scale + vec2(t * 0.012, -t * 0.009)).g * 0.65 + liqTap(LIQ_ROT * xz * scale * 2.1 + vec2(-t * 0.02, t * 0.015)).g * 0.35;
  float th = 1.02 - amount;
  return smoothstep(th - 0.06, th + 0.02, g);
}
// thin-film colours (an oil slick's): violet, teal, gold, magenta, round again
vec3 liqFilm(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
`;
