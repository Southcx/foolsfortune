// ---------------------------------------------------------------------------------------
// FINISHES: how each part of the Courier's vessel takes what the kiln lays on it (courier/vessel/glazes.js: every finish has a KIND, and
// each region takes one kind). Four dressers, each chained onto the part's own material (after what is already there: the first-person
// hide, the rim, the fade, the kintsugi), each driven by a few uniforms the vessel sets from the finish (vessel.js dress):
//
//   GLAZE   the armour, the trim, the mask: the glaze's own colour, with the maker's painting kept only as light and shade (its
//           luminance), so a pale glaze is pale on a dark-painted part (multiplied, every glaze read near black on the armour).
//   GEM     the stones: cut facets (the surface's direction stepped into planes, so the light breaks on it), a deep body, sparkle where
//           a facet catches the light, and FIRE (dispersion: a little spectrum at the glint); opal plays its colours, moonstone glows
//           blue under the surface (adularescence), star stones are left for later.
//   HAIR    a sheen band that slides along the hair as it turns (Kajiya-Kay's anisotropic highlight, cheaply: the band follows the
//           reflection's height), ombre from root to tip, and an optional oil-film sheen.
//   SKIN    the Lachryma of their body: its glow colour, a soft light from inside at the edges (fake subsurface: wrap and rim), and an
//           optional pearl or aurora sheen.
//
// Prior art: the gem shaders of Spyro (2018) and of every jewel-match game (faceted normals, sparkle, dispersion), Kajiya and Kay's hair
// highlight (1989) as most games after it fake it, the subsurface "wrap" lighting of skin since Half-Life 2, and real gemmology for the
// stones' optics (dispersion, play of colour, adularescence), so what the kiln sells is what such a stone does.
//
//   dressFinish(material, kind) -> uniforms (kept on material.userData.finish; set them, the shader reads them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const HEAD = `
varying vec3 vFinObj; varying vec3 vFinN;
uniform float uFinOn; uniform vec3 uFinA; uniform vec3 uFinB; uniform vec4 uFinP;
float finLuma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 finSpectrum(float t) { return clamp(abs(fract(t + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }`;

// per kind: what goes into the colour, and what into the light (uFinP: four numbers whose meaning is the kind's, below)
const COLOR = {
  // P.x: how much of the painting's light and shade to keep; P.y: its midpoint
  glaze: `if (uFinOn > 0.5) { float l = finLuma(diffuseColor.rgb); diffuseColor.rgb = uFinA * clamp(1.0 + (l - uFinP.y) * uFinP.x, 0.25, 1.6); }`,
  // A: the stone's colour; B: its second colour (opal's play, moonstone's glow); P.x: facets per unit; P.y: fire; P.z: play of colour; P.w: adularescence
  gem: `if (uFinOn > 0.5) { vec3 fN = normalize(floor(vFinN * uFinP.x + 0.5)); float ndvF = abs(dot(fN, normalize(vViewPosition)));
    diffuseColor.rgb = uFinA * (0.35 + 0.65 * ndvF); }`,
  // A: root colour; B: tip colour; P.x: ombre (0 none, 1 full); P.y: the hair's height range (root at 1, tip at 0, object units)
  hair: `if (uFinOn > 0.5) { float tip = clamp(1.0 - (vFinObj.y - uFinP.w) / max(0.001, uFinP.y), 0.0, 1.0);
    diffuseColor.rgb = mix(uFinA, mix(uFinA, uFinB, smoothstep(0.45, 0.95, tip)), uFinP.x); }`, // (a dip: one colour most of the way, turning near the ends)
  // A: the body's colour; B: its glow; P.x: inner light; P.y: rim; P.z: sheen (0 none, 1 pearl, 2 aurora)
  skin: `if (uFinOn > 0.5) { diffuseColor.rgb = uFinA; }`,
};
const LIGHT = {
  glaze: '',
  gem: `if (uFinOn > 0.5) {
    vec3 V = normalize(vViewPosition); vec3 fN = normalize(floor(vFinN * uFinP.x + 0.5));
    float h = fract(sin(dot(fN, vec3(12.9898, 78.233, 37.719))) * 43758.5453); // (a facet's own hash: which way it was cut)
    float glint = pow(max(0.0, dot(reflect(-V, fN), normalize(vec3(0.3, 0.8, 0.5)))), 24.0);
    totalEmissiveRadiance += uFinA * 0.18 + glint * (vec3(1.0) + finSpectrum(h + dot(V, fN)) * uFinP.y * 2.0) * 0.9;
    totalEmissiveRadiance += finSpectrum(h * 3.0 + dot(V, vFinN) * 1.5) * uFinP.z * 0.45;                    // opal: play of colour
    totalEmissiveRadiance += uFinB * uFinP.w * pow(1.0 - abs(dot(normalize(normal), V)), 2.0) * 0.9;          // moonstone: the blue glow
  }`,
  hair: `if (uFinOn > 0.5) {
    vec3 V = normalize(vViewPosition); vec3 R = reflect(-V, normalize(normal));
    float band = exp(-pow((R.y - 0.35) * 5.0, 2.0)) * max(0.0, normal.y * 0.5 + 0.5); // (the sheen band, riding the reflection's height)
    vec3 sheen = uFinP.z > 0.5 ? finSpectrum(R.y * 1.2 + vFinObj.y * 2.0) : mix(uFinA, vec3(1.0), 0.6);
    totalEmissiveRadiance += sheen * band * uFinP.z * 0.14 + mix(uFinA, vec3(1.0), 0.5) * band * (1.0 - min(1.0, uFinP.z)) * 0.18;
  }`,
  skin: `if (uFinOn > 0.5) {
    vec3 V = normalize(vViewPosition); float ndv = abs(dot(normalize(normal), V)), rim = pow(1.0 - ndv, 2.0);
    totalEmissiveRadiance += uFinB * (uFinP.x * 0.35 + rim * uFinP.y);
    if (uFinP.z > 1.5) totalEmissiveRadiance += finSpectrum(rim * 0.8 + vFinObj.y) * rim * 0.5;              // aurora
    else if (uFinP.z > 0.5) totalEmissiveRadiance += mix(vec3(1.0, 0.92, 0.95), vec3(0.85, 0.9, 1.0), rim) * rim * 0.35; // pearl
  }`,
};

export function dressFinish(m, kind) {
  if (m.userData.finish) return m.userData.finish;
  const u = { uFinOn: { value: 0 }, uFinA: { value: new THREE.Color(1, 1, 1) }, uFinB: { value: new THREE.Color(1, 1, 1) }, uFinP: { value: new THREE.Vector4(1, 0.3, 0, 0) } };
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey?.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFinObj; varying vec3 vFinN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFinObj = position; vFinN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${COLOR[kind] || ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${LIGHT[kind] || ''}`);
  };
  m.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-fin-${kind}`;
  m.needsUpdate = true;
  return (m.userData.finish = u);
}
