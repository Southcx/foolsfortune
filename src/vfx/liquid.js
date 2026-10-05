// ---------------------------------------------------------------------------------------
// LIQUID: what every liquid in the game is drawn with, water and Lachryma alike (the owner, R58: "the water and Lachryma are going to be
// one of the most important visual elements in the game"). One texture and one shader chunk, so a pool, the crude sea, the shore's swash
// and whatever comes next all move the same way and catch the light the same way:
//
//   THE PACK  the owner's noise photographs, baked tileable by scripts/bake_liquid.py (src/assets/liquid_pack.webp, 512 px, four grey
//             channels): R the oil MARBLING (cells and veins), G the BUBBLES (rings and foam), B the SAND RIPPLES, A the marbling's
//             VEINS (its bright ridges: caustics)
//   NORMALS   two layers of the marbling scrolled against each other at different scales and angles, their slope taken by finite
//             differences into a normal (Valve's and every water shader since: two crossing normal layers never repeat the same way
//             twice); `liqNormal(xz, scale, t, strength)`
//   CAUSTICS  the veins scrolled twice in different directions and added, so two nets of light cross and writhe and never slide as one
//             sheet (the classic min-of-two is for dense webs; these veins are sparse lines, so they are summed); `liqCaustic(xz, scale, t)`
//   FOAM      the bubbles channel against a threshold that rises toward the shore and breathes, so foam is made of bubbles, not a band;
//             `liqFoam(xz, scale, t, amount)`
//   FILM      thin-film interference colours (an oil slick's), `liqFilm(t)`: Lachryma's own palette (the cubes', the crude's)
//   SPARKLE   a sharp sun highlight on the perturbed normal, and glints where the fine bubbles cross it: the water's sparkle moves at its
//             own rate, and that is welcome (the owner, R58: the old "no shimmer" line was about a bug in the sand, not about water)
//
// Prior art: (see the header of vfx/water.js, where the techniques are put together, and docs/ART.md, "Liquid").
//
//   import { liquidTexture, LIQUID_GLSL } from './liquid.js'   uniforms: { uLiq: { value: liquidTexture() } }   GLSL: LIQUID_GLSL
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import packB64 from '../assets/liquid_pack.webp?b64';

let _tex = null;
/** The pack, loaded once and shared: repeat-wrapped, mipmapped (the far water reads as its average, never as noise). */
export function liquidTexture() {
  if (_tex) return _tex;
  _tex = new THREE.TextureLoader().load(`data:image/webp;base64,${packB64}`);
  _tex.wrapS = _tex.wrapT = THREE.RepeatWrapping;
  _tex.colorSpace = THREE.NoColorSpace; // (data, not colour)
  _tex.anisotropy = 4;
  return _tex;
}

export const LIQUID_GLSL = /* glsl */`
uniform sampler2D uLiq;
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
// a net of light (the veins twice, crossing: it writhes in place)
float liqCaustic(vec2 xz, float scale, float t) {
  float a = liqTap(xz * scale + vec2(t * 0.031, t * 0.012)).a, b = liqTap(LIQ_ROT * xz * scale * 1.31 + vec2(-t * 0.019, t * 0.027)).a;
  return smoothstep(0.12, 0.7, (a + b) * 0.75);
}
// foam made of bubbles: the bubbles channel over a threshold that falls as amount (0..1) rises
float liqFoam(vec2 xz, float scale, float t, float amount) {
  float g = liqTap(xz * scale + vec2(t * 0.012, -t * 0.009)).g * 0.65 + liqTap(LIQ_ROT * xz * scale * 2.1 + vec2(-t * 0.02, t * 0.015)).g * 0.35;
  float th = 1.02 - amount;
  return smoothstep(th - 0.06, th + 0.02, g);
}
// thin-film colours (an oil slick's): violet, teal, gold, magenta, round again
vec3 liqFilm(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
`;
