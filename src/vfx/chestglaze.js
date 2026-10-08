// ---------------------------------------------------------------------------------------
// THE CHEST'S GLAZE: what a chest's tier looks like as it charges, in place of a beam of colour per rarity (the genre's default: docs/ART.md,
// the placeholder audit; the owner's, R45). The chest is fired as it charges: its clay takes a glaze, and the glaze changes as the kiln
// climbs, one firing past the last, so how far it goes is how good the chest is:
//
//   0 .. 1   CELADON flows on: the clay goes jade and glassy (the common chest stops here)
//   1 .. 2   it CRAZES: a fine net opens in the celadon (guan's crackle, fired in on purpose; the fine chest)
//   2 .. 3   it turns RAKU: white, pulled from the kiln red-hot and smoked, the net wide and black (the rare chest), a copper flash in it
//   3 .. 4   KINTSUGI: gold floods the seams, a cell at a time, until every crack is gold and lit (epic part of the way, prismatic all of it)
//
// A chest's glaze is kept once fired (an opened chest keeps what it was). The prismatic chest is black glass, not clay: on it only the
// gold comes (`goldOnly`). The same Worley net as the Courier's kintsugi (courier/vessel/kintsugi.js), in the part's own space.
//
// Prior art: the firings themselves (celadon's reduction, guan's deliberate crazing, raku's post-firing smoke, kintsugi's lacquer and gold),
// and the colour tease of the gacha canon (Genshin's meteor, Fire Emblem Heroes' orbs) with the tell moved from a beam into the thing.
//
//   const U = dressChestGlaze(material, uniforms?, { goldOnly })   U.uGlaze.value = stage (0..4)   glazeAt(tier) -> its stage
//   chestGlazeUniforms(scale)   (the net's size: 1 a chest's; less for bigger work)   U.uCgCrack.value = 0..1: cracks still open, dark seams with
//   the crude's violet in them, on the cells the gold has not reached (the sloop's hull in a crossing: vfx/crossinglook.js; a chest leaves it 0)
// ---------------------------------------------------------------------------------------

/** How far a tier's chest is fired (0 common .. 4 prismatic). */
export const glazeAt = (tier) => 1 + 0.75 * tier;
export const chestGlazeUniforms = (scale = 1) => ({ uGlaze: { value: 0 }, uCgScale: { value: scale }, uCgCrack: { value: 0 } }); // (scale: the net's cells per metre against a chest's, for bigger work: the sloop's hull)

const HEAD = /* glsl */`
uniform float uGlaze; uniform float uCgScale; uniform float uCgCrack; varying vec3 vCgObj;
vec3 cgHash(vec3 p) { p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
vec2 cgEdge(vec3 p) { // (the distance to the nearest edge between cells, and the nearest cell's own number)
  vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; vec3 c1 = vec3(0.0);
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z)), r = g + cgHash(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; c1 = i + g; } else if (d < d2) d2 = d; }
  return vec2(sqrt(d2) - sqrt(d1), cgHash(c1 + 17.0).x); }`;

export function dressChestGlaze(m, uni = chestGlazeUniforms(), { goldOnly = false } = {}) {
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey?.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCgObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCgObj = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  // (colours in linear light, as the shader works: celadon #7fa88c, raku white #ede5d8, copper #d98c62, gold #f2b848)
  float cgS = uGlaze, cgFine = 0.0, cgBig = 0.0, cgGold = 0.0, cgCel = 0.0, cgCrack = 0.0;
  if (cgS > 0.0) {
    vec3 cgP = vCgObj * uCgScale; vec2 a = cgEdge(cgP * 9.0), b = cgEdge(cgP * 24.0);
    float px = length(fwidth(cgP)) * 24.0, keep = 1.0 - smoothstep(0.35, 0.8, px); // (the fine net goes before it can shimmer)
    ${goldOnly ? '' : `cgCel = smoothstep(0.0, 1.0, cgS);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.20, 0.40, 0.26), cgCel);                                   // celadon
    cgFine = smoothstep(1.0, 1.75, cgS) * (1.0 - smoothstep(0.0, 0.05, b.x)) * keep;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.08, 0.06), cgFine * (1.0 - smoothstep(2.0, 2.6, cgS)));  // its crazing
    float raku = smoothstep(1.9, 2.75, cgS);
    diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.85, 0.79, 0.69), vec3(0.69, 0.26, 0.12), step(0.82, a.y) * 0.6), raku); // raku white, a copper flash
    cgBig = raku * (1.0 - smoothstep(0.0, 0.07, a.x));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.01, 0.01), cgBig);                                   // the smoked net`}
    float gk = smoothstep(${goldOnly ? '2.6' : '2.9'}, 4.0, cgS);
    cgGold = step(a.y, gk * 1.02) * (1.0 - smoothstep(0.0, ${goldOnly ? '0.06' : '0.075'}, a.x));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.89, 0.48, 0.07), cgGold);                                   // kintsugi
    cgCrack = step(1.0 - uCgCrack, a.y) * (1.0 - smoothstep(0.0, 0.11, a.x)) * (1.0 - cgGold);                 // a crack still open (the ship's hull: its cells from the other end of the gold's)
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.006, 0.004, 0.008), cgCrack);
  }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(mix(roughnessFactor, 0.22, cgCel), 0.25, cgGold);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 0.7, cgGold);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.89, 0.48, 0.07) * cgGold * (0.25 + 0.5 * smoothstep(3.5, 4.0, cgS)) + vec3(0.42, 0.3, 0.75) * cgCrack * 0.6;');
  };
  m.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-cglaze${goldOnly ? 'g' : ''}`;
  m.needsUpdate = true;
  return uni;
}
