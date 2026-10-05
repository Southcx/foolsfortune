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
//   CAUSTICS  the owner's dense caustic net (pack 2) scrolled twice in different directions and summed (Zucconi takes the minimum of a net
//             drawn dark-on-light; these are light-on-dark, so summed: two nets that writhe in place, the finer net over them); `liqCaustic`
//   RIPPLES   the owner's wind-streaked ripples (pack 2) as the fine chop on water; `liqRipple(xz, scale, t, strength)`
//   GLOW      soft glowing cells (pack 2), light pooled inside Lachryma; `liqGlow(xz, scale, t)`
//   FOAM      the bubbles channel against a threshold that rises toward the shore and breathes, so foam is made of bubbles, not a band;
//             `liqFoam(xz, scale, t, amount)`
//   FILM      thin-film interference colours (an oil slick's), `liqFilm(t)`: Lachryma's own palette (the cubes', the crude's)
//   SPARKLE   a sharp sun highlight on the perturbed normal, and glints where the fine bubbles cross it: the water's sparkle moves at its
//             own rate, and that is welcome (the owner, R58: the old "no shimmer" line was about a bug in the sand, not about water)
//
// Prior art: (see the header of vfx/water.js, where the techniques are put together, and docs/ART.md, "Liquid").
//
//   import { liquidUniforms, LIQUID_GLSL } from './liquid.js'   uniforms: { ...liquidUniforms() }   GLSL: LIQUID_GLSL
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
/** The second pack (the owner's noise gradients: caustic nets, wind ripples, glowing cells). */
export function liquidTexture2() { return pack('b', pack2B64); }
/** Both, as the uniforms LIQUID_GLSL reads: spread them into a material's uniforms. */
export const liquidUniforms = () => ({ uLiq: { value: liquidTexture() }, uLiq2: { value: liquidTexture2() } });

export const LIQUID_GLSL = /* glsl */`
uniform sampler2D uLiq, uLiq2;
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
// a net of light: the dense net twice, minimum-ed (it writhes in place), the finer net over it
float liqCaustic(vec2 xz, float scale, float t) {
  float a = texture2D(uLiq2, xz * scale + vec2(t * 0.031, t * 0.012)).r, b = texture2D(uLiq2, LIQ_ROT * xz * scale * 1.31 + vec2(-t * 0.019, t * 0.027)).r;
  float f = texture2D(uLiq2, xz * scale * 2.3 + vec2(t * 0.013, -t * 0.021)).g;
  return smoothstep(0.42, 0.85, (a + b) * 0.62) + smoothstep(0.7, 0.95, f) * 0.2; // (bright lines on a dark ground: summed, both nets show and their crossings flare)
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
