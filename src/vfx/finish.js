// ---------------------------------------------------------------------------------------
// FINISHES: how each part of the Courier's vessel takes what the kiln lays on it (courier/vessel/glazes.js: every finish has a KIND, and
// each region takes one kind). Four dressers, each chained onto the part's own material (after what is already there: the first-person
// hide, the rim, the fade, the kintsugi), each driven by a few uniforms the vessel sets from the finish (vessel.js dress):
//
//   GLAZE   the armour, the trim, the mask: the glaze's own colour, with the maker's painting kept only as light and shade (its
//           luminance), so a pale glaze is pale on a dark-painted part (multiplied, every glaze read near black on the armour); and the
//           rare glazes' kiln PATTERNS (below: stars, spots, streaks, crackle, leaf), so the eye sees what they cost.
//   GEM     the stones: cut facets (the surface's direction stepped into planes, so the light breaks on it), a deep body, sparkle where
//           a facet catches the light, and FIRE (dispersion: a little spectrum at the glint); opal plays its colours, moonstone glows
//           blue under the surface (adularescence), star stones are left for later.
//   HAIR    a sheen band that slides along the hair as it turns (Kajiya-Kay's anisotropic highlight, cheaply: the band follows the
//           reflection's height), ombre from root to tip, and an optional oil-film sheen.
//   SKIN    the Lachryma of their body: its glow colour, a soft light from inside at the edges (fake subsurface: wrap and rim), an
//           optional pearl or aurora sheen, and translucency (porcelain: warm light through the thin edges); and the SOUL COLOUR
//           (`uFinS`: rgb and strength, Soul Alchemy's, set by the vessel), on whatever skin is worn, the maker's own included.
//
// Prior art: the gem shaders of Spyro (2018) and of every jewel-match game (faceted normals, sparkle, dispersion), Kajiya and Kay's hair
// highlight (1989) as most games after it fake it, the subsurface "wrap" lighting of skin since Half-Life 2, and real gemmology for the
// stones' optics, Worley's cellular noise (1996) for spots and crazing, and the real glazes (yohen, oil spot, hare's fur, guan crackle,
// kinrande) for how each pattern forms (dispersion, play of colour, adularescence), so what the kiln sells is what such a stone does.
//
//   dressFinish(material, kind) -> uniforms (kept on material.userData.finish; set them, the shader reads them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const HEAD = `
varying vec3 vFinObj; varying vec3 vFinN;
uniform float uFinOn; uniform vec3 uFinA; uniform vec3 uFinB; uniform vec4 uFinP; uniform vec4 uFinS;
float finLuma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 finSpectrum(float t) { return clamp(abs(fract(t + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
vec3 finHash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float finNoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(finHash3(i).x, finHash3(i + vec3(1, 0, 0)).x, f.x), mix(finHash3(i + vec3(0, 1, 0)).x, finHash3(i + vec3(1, 1, 0)).x, f.x), f.y),
             mix(mix(finHash3(i + vec3(0, 0, 1)).x, finHash3(i + vec3(1, 0, 1)).x, f.x), mix(finHash3(i + vec3(0, 1, 1)).x, finHash3(i + vec3(1, 1, 1)).x, f.x), f.y), f.z); }
// cells (Worley): x the nearest seed's distance, y the next's, z the nearest cell's own random
vec3 finCells(vec3 p) { vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(x, y, z), h = finHash3(i + o); float d = length(o + h - f);
    if (d < d1) { d2 = d1; d1 = d; id = h.z; } else if (d < d2) d2 = d; }
  return vec3(d1, d2, id); }`;

// THE PATTERNS of the rare glazes (glazes.js `pattern`; uFinP.z which, uFinP.w the model's scale, uFinB the pattern's colour), in the
// part's own space, so they sit on the body as a glaze sits on a pot. Each is how the real one forms in the kiln:
//   1 STARS   yohen tenmoku: iron spots that crystallise out of the black, each ringed by a thin film that breaks the light blue
//   2 SPOTS   oil spot: iron bubbles that rise, burst and heal into silver blooms
//   3 STREAKS hare's fur: the glaze running down the pot, iron drawn into fine gold-brown hairs
//   4 CRACKLE guan, raku, ru: the glaze shrinking more than the clay as it cools; a net of crazing, stained dark (two sizes on guan)
//   5 LEAF    kinrande: gold leaf laid over the enamel in torn patches
const PATTERN = `
  float finPatM = 0.0, finPatR = 0.0, finPatS = 0.0, finPatH = 0.0; vec3 finPatE = vec3(0.0); // (S, H: a sheen for the light stage, and its hue)
  if (uFinOn > 0.5 && uFinP.z > 0.5) {
    vec3 q = vFinObj * uFinP.w; int pat = int(uFinP.z + 0.5);
    // (each fades as its cells shrink below a pixel or two, so a far body never shimmers with them: the house rule against flicker)
    float px = length(fwidth(q));
    if (pat == 1) {
      vec3 c = finCells(q * 56.0); float r = 0.16 + 0.18 * c.z, on = step(0.42, c.z) * (1.0 - smoothstep(0.012, 0.03, px));
      float core = (1.0 - smoothstep(r * 0.5, r * 0.7, c.x)) * on, halo = exp(-pow((c.x - r * 0.85) / (r * 0.28), 2.0)) * on;
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinA * 0.4 + vec3(0.07, 0.05, 0.03), core);
      finPatE = uFinB * halo * 0.4; finPatR = halo; finPatS = halo; finPatH = c.z;
    } else if (pat == 2) {
      vec3 c = finCells(q * 64.0); float r = 0.24 + 0.2 * c.z;
      float spot = (1.0 - smoothstep(r * 0.55, r, c.x)) * (1.0 - smoothstep(0.01, 0.025, px));
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinB, spot); finPatM = spot * 0.7; finPatR = spot;
      finPatE = uFinB * spot * 0.14;                                                                   // (silver catches what light there is)
    } else if (pat == 3) {
      float n = finNoise(vec3(q.x * 170.0, q.y * 5.0, q.z * 170.0)) * 0.7 + finNoise(vec3(q.x * 320.0, q.y * 9.0, q.z * 320.0)) * 0.3;
      float hair = smoothstep(0.52, 0.74, n) * (1.0 - smoothstep(0.004, 0.01, px));
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinB, hair * 0.8); finPatR = hair * 0.4; finPatE = uFinB * hair * 0.05;
    } else if (pat == 4) {
      vec3 w = q + (vec3(finNoise(q * 9.0), finNoise(q * 9.0 + 7.1), finNoise(q * 9.0 + 3.7)) - 0.5) * 0.02; // (crazing never runs straight)
      vec3 a = finCells(w * 16.0), b = finCells(w * 44.0);
      float big = (1.0 - smoothstep(0.0, 0.06, a.y - a.x)) * (1.0 - smoothstep(0.02, 0.05, px));
      float fine = (1.0 - smoothstep(0.0, 0.05, b.y - b.x)) * 0.6 * (1.0 - smoothstep(0.008, 0.02, px));
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinB, big); diffuseColor.rgb = mix(diffuseColor.rgb, mix(uFinB, uFinA, 0.5), fine); // (the fine net paler: guan's 'gold thread' beside its 'iron wire')
    } else if (pat == 5) {
      float n = finNoise(q * 11.0) * 0.65 + finNoise(q * 38.0) * 0.35;
      float leaf = smoothstep(0.55, 0.58, n);
      diffuseColor.rgb = mix(diffuseColor.rgb, uFinB, leaf); finPatM = leaf; finPatR = leaf;
      finPatE = uFinB * leaf * 0.18; finPatS = leaf;
    }
  }`;

// per kind: what goes into the colour, and what into the light (uFinP: four numbers whose meaning is the kind's, below)
const COLOR = {
  // P.x: how much of the painting's light and shade to keep; P.y: its midpoint
  glaze: `if (uFinOn > 0.5) { float l = finLuma(diffuseColor.rgb); diffuseColor.rgb = uFinA * clamp(1.0 + (l - uFinP.y) * uFinP.x, 0.25, 1.6); }` + PATTERN,
  // A: the stone's colour; B: its second colour (opal's play, moonstone's glow); P.x: facets per unit; P.y: fire; P.z: play of colour; P.w: adularescence
  gem: `if (uFinOn > 0.5) { vec3 fN = normalize(floor(vFinN * uFinP.x + 0.5)); float ndvF = abs(dot(fN, normalize(vViewPosition)));
    diffuseColor.rgb = uFinA * (0.35 + 0.65 * ndvF); }`,
  // A: root colour; B: tip colour; P.x: ombre (0 none, 1 full); P.y: the hair's height range (root at 1, tip at 0, object units)
  hair: `if (uFinOn > 0.5) { float tip = clamp(1.0 - (vFinObj.y - uFinP.w) / max(0.001, uFinP.y), 0.0, 1.0);
    diffuseColor.rgb = mix(uFinA, mix(uFinA, uFinB, smoothstep(0.45, 0.95, tip)), uFinP.x); }`, // (a dip: one colour most of the way, turning near the ends)
  // A: the body's colour; B: its glow; P.x: inner light; P.y: rim; P.z: sheen (0 none, 1 pearl, 2 aurora)
  skin: `if (uFinOn > 0.5) { diffuseColor.rgb = uFinA * (1.0 - 0.12 * uFinP.w); }`, // (P.w: translucency; a translucent body shows a little less of its face)
};
// per kind: the surface itself (after the maps: metal and gloss), where a pattern is metal (silver spots, gold leaf) or a glassier film
const SURFACE = {
  glaze: `metalnessFactor = mix(metalnessFactor, 0.9, finPatM); roughnessFactor = mix(roughnessFactor, 0.12, finPatR);`,
};
const LIGHT = {
  glaze: `totalEmissiveRadiance += finPatE;
    if (finPatS > 0.0) { float sl = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
      if (uFinP.z < 1.5) totalEmissiveRadiance += finSpectrum(0.5 + finPatH * 0.12 + sl * 0.25) * finPatS * 0.3;  // yohen's film: cyan to blue to violet as it turns
      else totalEmissiveRadiance += uFinB * finPatS * 0.35 * sl * sl; }                                           // leaf gold, lit at a slant`,
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
    totalEmissiveRadiance += vec3(1.0, 0.8, 0.6) * uFinP.w * (0.06 + pow(1.0 - ndv, 1.5) * 0.4);                 // translucency: warm light through the thin edges
  }
  if (uFinS.w > 0.0) { // the soul colour (Soul Alchemy): the Lachryma lit from inside in it, on any skin, the maker's own too; grey is none
    float ndvS = abs(dot(normalize(normal), normalize(vViewPosition)));
    totalEmissiveRadiance += uFinS.rgb * uFinS.w * (0.22 + 1.1 * pow(1.0 - ndvS, 2.0));
  }`,
};

export function dressFinish(m, kind) {
  if (m.userData.finish) return m.userData.finish;
  const u = { uFinOn: { value: 0 }, uFinA: { value: new THREE.Color(1, 1, 1) }, uFinB: { value: new THREE.Color(1, 1, 1) }, uFinP: { value: new THREE.Vector4(1, 0.3, 0, 0) }, uFinS: { value: new THREE.Vector4(0, 0, 0, 0) } };
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
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${SURFACE[kind] || ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${LIGHT[kind] || ''}`);
  };
  m.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-fin-${kind}`;
  m.needsUpdate = true;
  return (m.userData.finish = u);
}
