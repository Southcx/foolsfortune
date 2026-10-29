// ---------------------------------------------------------------------------------------
// THE SHAPE PROGRAM: the one shader every shape layer is drawn with (vfx/shapes/layer.js), whatever its effect shape, pattern, ramp or
// blend: every difference between two layers is a uniform's value, never a #define or a mode (the program audit, 2026-10-25: one
// program for a family of looks, compiled once on the loading screen and kept). What it does to a fragment, in order:
//
//   FLOW     the main pattern's UVs pushed about by a flow pattern of its own tile and scroll (uFlowK: heat shimmer, a liquid's wobble)
//   MAIN     a pattern (one channel of one of the three pattern textures: vfx/shapes/textures.js) tiled and scrolled over the shape's UVs
//            (a positive scroll runs the pattern toward +u and +v: round, and out or up, the shape)
//            uMainK how far it cuts in (1 all of it, 0 a solid shape), so a thin pattern can ride on a body
//   MASK     a second pattern, tiled and scrolled on its own, multiplied in (uMaskK as uMainK: 0 no mask)
//   EDGES    the shape's own soft ends in v and u (uEdgeV, uEdgeU: the share faded at each end), and its baked vertex alpha
//   RIM      a fresnel on its facing: uRim > 0 lights a shell at its silhouette (a dome, a sphere), uRim < 0 softens a volume there
//            instead (a beam, a pillar), uRimPow its tightness
//   EROSION  value = main x mask x edges x rim; it is cut by a threshold that rises over the layer's life (uErode 0 whole, 1 gone, uSoft
//            the cut's softness), so the shape breaks up through its pattern as it dies, never only fades
//   RAMP     colour and alpha read from a row of the ramp LUT (vfx/shapes/ramps.js) at value + uRampShift: the low values clear (gradient
//            transparency), the high ones hot; the shift slides down the row as it dies, so it cools
//   CORE     values over uCoreAt pushed toward white by uCore: a hot heart
//   OUT      tinted (uTint), lifted for the bloom (uGlow, HDR), faded by uK (past 1 it brightens: a tier ladder's glow); premultiplied, so ONE blend state serves both kinds: uAdd 1
//            is pure additive light, uAdd 0 alpha-over (smoke, ink, Dread's dark shapes), between them a mix
//
// The patterns' clock is the game's real clock, shared (vfx/labradorite.js mindTime, which the shape layers tick), plus a per-play
// offset (uSeed) so two of one effect never stamp the same; a scroll's offset is kept to its fraction (the patterns repeat every tile),
// so an hour of the clock never costs the UVs their precision. Every uniform is a scalar or a vector, read at no computed index (the
// iPhone's: render/constantindex.js), and the text keeps to GLSL ES 1.0's words (three.js compiles it as 3.0 for WebGL2).
//
// Prior art: the "uber" effect shader of Riot's and Blizzard's VFX teams and Simon Trümpler's breakdowns of it (a scrolling main
// texture times a scrolling mask, a UV distortion pass, a gradient map, alpha erosion by a rising threshold, a fresnel); Unreal's
// dynamic material parameters for the per-use numbers; the premultiplied-alpha blend that lets one state be both additive and over
// (Tom Forsyth, "Premultiplied alpha", 2006; Shawn Hargreaves' note on the same: rgb added, alpha the cover).
//
//   SHAPE_V   SHAPE_F   shapeUniforms(over) -> the uniforms with their defaults   makeShapeMaterial(uniforms) -> ShaderMaterial
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindTime } from '../labradorite.js';
import { patternTextures } from './textures.js';
import { rampTexture, rampV, RAMPS } from './ramps.js';

export const SHAPE_V = /* glsl */`
attribute vec4 color;
varying vec2 vUv; varying vec4 vCol; varying vec3 vN; varying vec3 vV;
void main() {
  vUv = uv; vCol = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal; vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

export const SHAPE_F = /* glsl */`
uniform sampler2D uMainMap, uMaskMap, uFlowMap, uRamp;
uniform vec4 uMainCh, uMaskCh, uFlowCh;
uniform vec2 uTileMain, uScrollMain, uTileMask, uScrollMask, uTileFlow, uScrollFlow, uSeed, uEdgeV, uEdgeU;
uniform float uTime, uMainK, uMaskK, uFlowK, uErode, uSoft, uRampRow, uRampShift, uRim, uRimPow, uCore, uCoreAt, uK, uGlow, uAdd;
uniform vec3 uTint;
varying vec2 vUv; varying vec4 vCol; varying vec3 vN; varying vec3 vV;

float ends(float x, vec2 w) {
  float a = w.x > 0.0 ? clamp(x / w.x, 0.0, 1.0) : 1.0;
  float b = w.y > 0.0 ? clamp((1.0 - x) / w.y, 0.0, 1.0) : 1.0;
  return a * a * (3.0 - 2.0 * a) * b * b * (3.0 - 2.0 * b);
}

void main() {
  vec2 pm = vUv * uTileMain - fract(uScrollMain * uTime) + uSeed;
  if (uFlowK > 0.0) {
    vec2 pf = vUv * uTileFlow - fract(uScrollFlow * uTime) + uSeed.yx;
    vec2 f = vec2(dot(texture2D(uFlowMap, pf), uFlowCh), dot(texture2D(uFlowMap, pf + vec2(0.37, 0.61)), uFlowCh)) - 0.5;
    pm += f * uFlowK;
  }
  float body = mix(1.0, dot(texture2D(uMainMap, pm), uMainCh), uMainK);
  float mask = mix(1.0, dot(texture2D(uMaskMap, vUv * uTileMask - fract(uScrollMask * uTime) + uSeed * 1.618), uMaskCh), uMaskK);
  float value = body * mask * ends(vUv.y, uEdgeV) * ends(vUv.x, uEdgeU) * vCol.a;

  float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uRimPow);
  float rim = uRim > 0.0 ? fr * 1.5 : 1.0 - fr;
  value = clamp(value * mix(1.0, rim, abs(uRim)), 0.0, 1.0);

  float lo = uErode * (1.0 + 2.0 * uSoft) - 2.0 * uSoft;
  float cut = smoothstep(lo, lo + 2.0 * uSoft + 0.0001, value);

  vec4 r = texture2D(uRamp, vec2(clamp(value + uRampShift, 0.0, 1.0) * 0.99609375 + 0.001953125, uRampRow));
  vec3 col = pow(r.rgb, vec3(2.2)) * vCol.rgb * uTint;
  col = mix(col, vec3(1.0), clamp(uCore * smoothstep(uCoreAt, 1.0, value), 0.0, 1.0));
  float a = clamp(r.a * cut * min(uK, 1.0), 0.0, 1.0);
  if (a < 0.002) discard;
  gl_FragColor = vec4(col * uGlow * max(uK, 1.0) * a, a * (1.0 - uAdd));
}`;

/** The program's uniforms, each with its default (a ring of noise in the tint ramp, additive), and the caller's over them. */
export function shapeUniforms(over = {}) {
  const [A] = patternTextures(), v2 = (x, y) => ({ value: new THREE.Vector2(x, y) }), ch = () => ({ value: new THREE.Vector4(1, 0, 0, 0) });
  return {
    uMainMap: { value: A }, uMaskMap: { value: A }, uFlowMap: { value: A }, uRamp: { value: rampTexture() },
    uMainCh: ch(), uMaskCh: ch(), uFlowCh: ch(),
    uTileMain: v2(1, 1), uScrollMain: v2(0, 0), uTileMask: v2(1, 1), uScrollMask: v2(0, 0), uTileFlow: v2(1, 1), uScrollFlow: v2(0, 0),
    uSeed: v2(0, 0), uEdgeV: v2(0, 0), uEdgeU: v2(0, 0),
    uTime: mindTime, uMainK: { value: 1 }, uMaskK: { value: 0 }, uFlowK: { value: 0 }, uErode: { value: 0 }, uSoft: { value: 0.12 },
    uRampRow: { value: rampV(RAMPS.tint) }, uRampShift: { value: 0 }, uRim: { value: 0 }, uRimPow: { value: 2.5 },
    uCore: { value: 0.6 }, uCoreAt: { value: 0.8 }, uK: { value: 0 }, uGlow: { value: 1.5 }, uAdd: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) },
    ...over,
  };
}

/** The one material every shape layer is: the same state for every use (premultiplied, both sides, no depth write, no fog), so its program
 *  is one; a caller sets only uniforms (and depthTest, a state, for one seen through walls). */
export function makeShapeMaterial(uniforms = shapeUniforms()) {
  return new THREE.ShaderMaterial({
    name: 'vfx-shape', uniforms, vertexShader: SHAPE_V, fragmentShader: SHAPE_F,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
}
