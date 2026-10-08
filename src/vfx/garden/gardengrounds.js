// ---------------------------------------------------------------------------------------
// THE GARDEN'S GROUNDS: the five grounds the god hand paints on a planetoid's clay, drawn (docs/plans/SPIRIT-GARDEN.md section 7, item
// 6; GROUND in progress/realm.js, one a phase; the owner: "Go ahead with your terraforming looks work"). A patch on the planetoid's own
// MeshStandardMaterial (onBeforeCompile), so its light, shadow and fog stay three.js's and every planetoid shares one program:
//
//   WHERE        the mesh carries each ground's share a vertex (aGroundA: moss, ash, loam; aGroundB: slate, silt; bare is the rest:
//                vfx/garden/planetoidmesh.js), bilinear over the clay's cells
//   THE HEIGHTS  each ground's own height from THE GROUND PACK (src/assets/ground_pack.webp, scripts/bake_ground.py: the owner's noise
//                gradients, R moss cushions, G loam's rootlets, B slate's cleft, A silt's crazing) and ash's from the liquid pack's glowing
//                cells (liquid_pack2.webp A), laid triplanar in the planetoid's own space and blended by the surface's normal in that
//                space (so a hill's flank takes it as its crown does, and nothing keys on the world's up: render/triplanar.js's top
//                blend would), at two scales (every 2 m, and every 5.4 m turned, so no repeat reads across a planetoid)
//   THE BORDERS  height-blended: where two grounds meet, the one standing higher there shows (a moss cushion over the loam, the loam in
//                the moss's hollows), so a painted edge is crisp and ragged, never a smear across a cell
//   THE PALETTE  each ground in its phase's own colours, a ramp from its hollows to its tops, with its roughness and metalness, and an
//                accent in its feeling's canon colour (progress/weather.js COLOR):
//                  moss  (wood, wonder)   celadon cushions; dew glints of wonder on their tops, a faint glow there at night
//                  ash   (fire, mirth)    pale warm ash over embers of mirth breathing in the cracks (0.2 Hz, slow: never a flicker)
//                  loam  (earth, desire)  ochre loess felted with rootlets; warm flecks of desire in it
//                  slate (metal, grief)   silver-blue cleft stone, metalness 0.3, a sheen of grief where it turns from the eye
//                  silt  (water, dread)   blue-black and glossy, crazed into mud polygons, a gleam of dread in the cracks
//                The glints fade out past 40 m, where their texels are smaller than a pixel (no aliasing crawl: CLAUDE.md)
//   THE WET      where the garden's water lies or lay (aWet, written by vfx/garden/gardenwater.js): the ground darker and glossier,
//                drying over 20 real seconds, and under shallow water the liquid pack's caustics (vfx/liquid.js liqCaustic) laid on it,
//                fading out as the water deepens past 1.5 m
//
// Prior art: height-based blending of terrain layers (Andrey Mishkinis, "Advanced Terrain Texture Splatting", 2013; Unreal's
// HeightLerp), triplanar mapping (GPU Gems 3 ch. 1; Ben Golus 2017; render/triplanar.js here), the five phases' colours of the wuxing
// (wood green, fire red-gold, earth ochre, metal white-silver, water black-blue) and the celadon, ash and tenmoku glazes of the kiln, and
// From Dust's painted grounds that read at a glance from above.
//
//   groundMaterial(material) -> material (patched once; shares GROUND_UNIFORMS)   groundTick(rawDt)   GROUND_PALETTE (data: tune live)
//   groundPackTexture() -> THREE.Texture (fetched on first ask)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUND } from '../../progress/realm.js';
import { COLOR, phaseAt } from '../../progress/weather.js';
import { liquidTexture2, liquidUniforms, LIQUID_GLSL } from '../liquid.js';

/** The five grounds' look (colours as hex, sRGB): a ramp from `lo` (its hollows) to `hi` (its tops) over its height between `ramp`'s two
 *  edges; `rough`, `metal`; its height drawn from the ground pack's channels at two scales (`fine`, every 2 m, and `coarse`, every 5.4 m
 *  and turned: weights of R moss, G loam, B slate, A silt) and the glowing cells (`glow`: [weight, offset]); its accent in its feeling's
 *  colour, by how much of each: `glint` (on its tops, near), `ember` (in the glowing cells' veins, breathing at `breath` Hz), `night` (its
 *  tops glowing at night), `crack` (its lowest hollows), `sheen` (where it turns from the eye), and `dark` (its cracks darkened). */
export const GROUND_PALETTE = {
  moss: { lo: 0x2f5f4c, hi: 0x86c49e, ramp: [0.1, 1.0], rough: 0.95, metal: 0, fine: [-0.5, 0, 0, 0], coarse: [-0.4, 0, 0, 0], glow: [0, 0.98], accent: { glint: 0.9, night: 0.18 } }, // (the cushions are the noise's round holes, turned up)
  ash: { lo: 0x8c8178, hi: 0xece4d8, ramp: [0.15, 0.8], rough: 0.97, metal: 0, fine: [0, 0, 0, 0], coarse: [0.25, 0, 0, 0], glow: [-0.85, 0.8], accent: { ember: 1.2, breath: 0.2 }, dark: 0.8 },
  loam: { lo: 0x7a5532, hi: 0xd2a86a, ramp: [0.2, 0.95], rough: 0.9, metal: 0, fine: [0, 0.32, 0, 0], coarse: [0.55, 0, 0, 0], glow: [0, 0], accent: { glint: 0.55 } },
  slate: { lo: 0x3e4859, hi: 0xb8c4d4, ramp: [0.2, 0.95], rough: 0.42, metal: 0.3, fine: [0, 0, 0.45, 0], coarse: [0, 0, 0.6, 0], glow: [0, 0], accent: { sheen: 0.4 } },
  silt: { lo: 0x0e1218, hi: 0x4a566a, ramp: [0.15, 0.8], rough: 0.28, metal: 0, fine: [0, 0, 0, 0.45], coarse: [0, 0, 0, 0.6], glow: [0, 0], accent: { crack: 0.5 }, dark: 0.9 },
};
const FEELING = Object.fromEntries(Object.entries(GROUND).map(([k, g]) => [k, g.feeling]));
const ORDER = Object.keys(GROUND); // (the slots, in the clay's order: a cell keeps its ground's index here plus one, world/garden/clay.js)
const SHAPE = { scale: 0.5, coarse: 0.185, glowScale: 0.31, depth: 0.07, fadeNear: 16, fadeFar: 40 }; // (the pack every 2 m and every 5.4 m, the cells every 3.2; the blend's depth; the glints' fade, m)

let packTex = null;
/** The ground pack: four grey channels of data, repeat-wrapped and mipmapped, fetched beside the bundle (never inlined: no string kept in the heap) the first time it is asked for (the first planetoid made). */
export function groundPackTexture() {
  if (packTex) return packTex;
  const t = packTex = new THREE.Texture();
  t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; // (an ImageBitmap is never flipped; the noise tiles either way)
  if (typeof window !== 'undefined') {
    // (the fourth channel is data: decoded with premultiplyAlpha 'none', as vfx/liquid.js decodes its packs, so no texel's colour is lost under a zero alpha)
    const L = new THREE.ImageBitmapLoader(); L.setOptions({ premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    L.load(new URL('../../assets/ground_pack.webp', import.meta.url).href, (bmp) => { t.image = bmp; t.needsUpdate = true; }, undefined, (e) => console.warn('gardengrounds: the ground pack did not load', e));
  }
  return t;
}

const lin = (hex) => new THREE.Color().setHex(hex); // (sRGB in, the renderer's linear working colour out)
/** What every patched planetoid reads (shared: one set of numbers for all of them; tune GROUND_PALETTE and call applyPalette()). */
export const GROUND_UNIFORMS = {
  uGPack: { value: null }, uGCells: { value: null },
  uGShape: { value: new THREE.Vector4(SHAPE.scale, SHAPE.coarse, SHAPE.glowScale, SHAPE.depth) }, uGFade: { value: new THREE.Vector2(SHAPE.fadeNear, SHAPE.fadeFar) },
  uGTime: { value: 0 }, uGNight: { value: 0 },
  uGLo: { value: ORDER.map(() => new THREE.Color()) }, uGHi: { value: ORDER.map(() => new THREE.Color()) }, uGAcc: { value: ORDER.map(() => new THREE.Color()) },
  uGTex: { value: ORDER.map(() => new THREE.Vector4()) }, uGTexC: { value: ORDER.map(() => new THREE.Vector4()) }, uGMat: { value: ORDER.map(() => new THREE.Vector4()) },
  uGAmt: { value: ORDER.map(() => new THREE.Vector4()) }, uGAmt2: { value: ORDER.map(() => new THREE.Vector4()) }, uGRamp: { value: ORDER.map(() => new THREE.Vector2()) },
};
let applied = false;
/** GROUND_PALETTE into the uniforms (at the first patch, and again after a live change). */
export function applyPalette() {
  const U = GROUND_UNIFORMS;
  ORDER.forEach((k, i) => {
    const P = GROUND_PALETTE[k], A = P.accent || {};
    U.uGLo.value[i].copy(lin(P.lo)); U.uGHi.value[i].copy(lin(P.hi)); U.uGAcc.value[i].copy(lin(COLOR[FEELING[k]] ?? 0xffffff));
    U.uGTex.value[i].fromArray(P.fine); U.uGTexC.value[i].fromArray(P.coarse);
    U.uGMat.value[i].set(P.rough, P.metal, P.glow[0], P.glow[1]);
    U.uGAmt.value[i].set(A.glint || 0, A.ember || 0, A.night || 0, A.crack || 0);
    U.uGAmt2.value[i].set(A.sheen || 0, A.breath || 0, P.dark || 0, 0);
    U.uGRamp.value[i].set(P.ramp[0], P.ramp[1]);
  });
  applied = true;
}

const VERT_DECL = /* glsl */`
attribute vec3 aGroundA;
attribute vec2 aGroundB;
attribute vec2 aWet;
varying vec2 vGW;
varying vec3 vGA;
varying vec2 vGB;
varying vec3 vGp;
varying vec3 vGn;
varying float vGv;
`;
const VERT_BODY = /* glsl */`
  vGA = aGroundA; vGB = aGroundB; vGp = transformed; vGn = objectNormal; vGW = aWet;
  { vec3 q = position * 0.11; vGv = 0.5 + 0.5 * sin(q.x * 2.3 + q.y * 1.7) * sin(q.y * 2.9 - q.z * 1.3) * sin(q.z * 2.1 + q.x * 2.7); } // (a slow variation over tens of metres: the grounds' tone and the embers' phase)
`;
const FRAG_DECL = /* glsl */`
varying vec2 vGW;
varying vec3 vGA;
varying vec2 vGB;
varying vec3 vGp;
varying vec3 vGn;
varying float vGv;
uniform sampler2D uGPack, uGCells;
uniform vec4 uGShape;
uniform vec2 uGFade;
uniform float uGTime, uGNight;
uniform vec3 uGLo[5], uGHi[5], uGAcc[5];
uniform vec4 uGTex[5], uGTexC[5], uGMat[5], uGAmt[5], uGAmt2[5];
uniform vec2 uGRamp[5];
`;
// (after the vertex colours: the bare ground is the planetoid's own colour, the painted grounds lie over it)
const FRAG_COLOUR = /* glsl */`
  float gB[5]; float gCover = 0.0, gRough = 0.0, gMetal = 0.0; vec3 gGlow = vec3(0.0);
  {
    vec3 gn = normalize(vGn), gw = pow(abs(gn), vec3(4.0)); gw /= gw.x + gw.y + gw.z + 1e-5;
    vec3 gp = vGp * uGShape.x, gc = mat3(0.8, 0.0, -0.6, 0.0, 1.0, 0.0, 0.6, 0.0, 0.8) * vGp * uGShape.y + 0.5, gq = vGp * uGShape.z + vec3(0.37, 0.11, 0.73);
    vec4 T = texture2D(uGPack, gp.zy) * gw.x + texture2D(uGPack, gp.xz) * gw.y + texture2D(uGPack, gp.xy) * gw.z;
    vec4 Tc = texture2D(uGPack, gc.zy) * gw.x + texture2D(uGPack, gc.xz) * gw.y + texture2D(uGPack, gc.xy) * gw.z; // (the coarse sample, turned: no repeat reads across a planetoid)
    float E = texture2D(uGCells, gq.zy).a * gw.x + texture2D(uGCells, gq.xz).a * gw.y + texture2D(uGCells, gq.xy).a * gw.z;
    float w[5]; w[0] = vGA.x; w[1] = vGA.y; w[2] = vGA.z; w[3] = vGB.x; w[4] = vGB.y;
    float h[5], s[5];
    float bare = max(0.0, 1.0 - (w[0] + w[1] + w[2] + w[3] + w[4])), sBare = bare * (0.75 + 0.5 * Tc.r), m = sBare;
    for (int k = 0; k < 5; k++) { h[k] = clamp(dot(T, uGTex[k]) + dot(Tc, uGTexC[k]) + E * uGMat[k].z + uGMat[k].w, 0.0, 1.0); s[k] = w[k] * (0.5 + h[k]); m = max(m, s[k]); }
    m -= uGShape.w; // (the blend's depth: what stands within it of the highest shows too, so a border is crisp but never aliased)
    float bb = max(sBare - m, 0.0), sum = bb;
    for (int k = 0; k < 5; k++) { gB[k] = max(s[k] - m, 0.0); sum += gB[k]; }
    sum = max(sum, 1e-5); bb /= sum; gCover = 1.0 - bb;
    float near = 1.0 - smoothstep(uGFade.x, uGFade.y, length(vViewPosition)), fw = fwidth(E) + 0.02;
    float vein = smoothstep(0.5 - fw, 0.85 + fw, E), spark = smoothstep(0.55 - fw, 0.8 + fw, E);
    vec3 gCol = vec3(0.0);
    for (int k = 0; k < 5; k++) {
      gB[k] /= sum;
      float t = smoothstep(uGRamp[k].x, uGRamp[k].y, h[k]);
      vec3 c = mix(uGLo[k], uGHi[k], t) * (0.9 + 0.2 * vGv);
      c *= mix(1.0, smoothstep(0.02, 0.24, h[k]), uGAmt2[k].z); // (its cracks darkened: silt's mud polygons)
      gCol += c * gB[k]; gRough += uGMat[k].x * gB[k]; gMetal += uGMat[k].y * gB[k];
      float breath = uGAmt2[k].y > 0.0 ? 0.6 + 0.4 * sin(6.2832 * uGAmt2[k].y * uGTime + vGv * 9.0) : 1.0;
      float glint = smoothstep(0.72, 0.92, h[k]) * spark * near, peak = smoothstep(0.55, 1.0, h[k]), crack = 1.0 - smoothstep(0.04, 0.2, h[k]);
      vec4 A = uGAmt[k];
      gGlow += uGAcc[k] * gB[k] * (A.x * glint * (0.35 + 0.65 * (1.0 - uGNight)) + A.y * vein * breath * (0.45 + 0.55 * uGNight) + A.z * peak * uGNight + A.w * crack * (0.15 + 0.85 * uGNight) * near);
    }
    diffuseColor.rgb = diffuseColor.rgb * (0.95 + 0.1 * Tc.r) * bb + gCol; // (the bare skin keeps its colour, a breath of the coarse cushions in it so a painted patch sits in it)
    diffuseColor.rgb *= 1.0 - 0.38 * vGW.x; // (wet ground darkens: the water fills its pores)
  }
`;
const FRAG_SURFACE = /* glsl */`
  roughnessFactor = mix(roughnessFactor * (1.0 - gCover) + gRough, 0.16, 0.85 * vGW.x); // (wet ground goes glossy)
  metalnessFactor = metalnessFactor * (1.0 - gCover) + gMetal;
`;
const FRAG_GLOW = /* glsl */`
  { float fres = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.0);
    for (int k = 0; k < 5; k++) gGlow += uGAcc[k] * gB[k] * uGAmt2[k].x * fres;
    if (vGW.y > 0.002) { // (under the water: its caustics on the floor, the light it gathers, strongest in the shallows)
      float d = vGW.y * 1.5, gk = smoothstep(0.06, 0.35, d) * (1.0 - smoothstep(0.7, 1.8, d)); // (caustics need water to focus in: none under a film)
      vec3 gn = normalize(vGn), gw = pow(abs(gn), vec3(4.0)); gw /= gw.x + gw.y + gw.z + 1e-5;
      float t = uGTime * 0.6, c = 0.0;
      if (gw.x > 0.05) c += liqCaustic(vGp.zy, 0.32, t) * gw.x;
      if (gw.y > 0.05) c += liqCaustic(vGp.xz, 0.32, t) * gw.y;
      if (gw.z > 0.05) c += liqCaustic(vGp.xy, 0.32, t) * gw.z;
      gGlow += vec3(1.0, 0.97, 0.88) * c * gk * 0.24 * (0.35 + 0.65 * (1.0 - uGNight)); }
    totalEmissiveRadiance += gGlow; }
`;
const KEY = 'garden-grounds-2';

/** Patch a planetoid's MeshStandardMaterial (vertex colours on) with the five grounds. Mutates and returns it; every one patched shares a
 *  program (one cache key) and one set of uniforms. */
let LIQ = null; // (the liquid packs, for the caustics under the water: shared by every planetoid)
export function groundMaterial(material) {
  if (!applied) applyPalette();
  LIQ ||= liquidUniforms();
  GROUND_UNIFORMS.uGPack.value = groundPackTexture(); GROUND_UNIFORMS.uGCells.value = liquidTexture2();
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, GROUND_UNIFORMS, LIQ);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
    sh.fragmentShader = FRAG_DECL + LIQUID_GLSL + sh.fragmentShader
      .replace('#include <alphamap_fragment>', `${FRAG_COLOUR}\n#include <alphamap_fragment>`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${FRAG_SURFACE}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_GLOW}`);
  };
  material.customProgramCacheKey = () => KEY;
  material.userData.grounds = GROUND_UNIFORMS;
  material.needsUpdate = true;
  return material;
}

let night = null;
/** The grounds' clock: the embers' breath and the night's glow (the game hour's phase, eased as the garden's sky eases it). Once a frame. */
export function groundTick(raw = 1 / 60) {
  const U = GROUND_UNIFORMS, ph = phaseAt(), want = ph === 'night' ? 1 : ph === 'dusk' || ph === 'dawn' ? 0.45 : 0; // (realm.light's own reading of the hour)
  night = night === null ? want : night + (want - night) * (1 - Math.exp(-raw * 0.5));
  U.uGNight.value = night; U.uGTime.value = (U.uGTime.value + raw) % 3600;
}
