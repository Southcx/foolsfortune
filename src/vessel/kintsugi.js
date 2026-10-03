// ---------------------------------------------------------------------------------------
// KINTSUGI: gold in the seams of the vessel. A pot that has been broken and mended with lacquer and gold is worth more than it was, and
// so is the Courier: their achievements are their mendings. Their armour and their mask carry a net of fine cracks over their whole surface,
// laid out in their body's own space (the bind pose: the seams ride with them as they move, never swim), and each crack is filled with gold
// once enough has been earned. The more they have done, the more of the net is gold (vessel.js gives the share). Nothing moves or
// flickers in it: a seam is there or it is not.
//
// The cracks are a cellular pattern (Worley's: the distance to the nearest point less the distance to the next, small along the edges
// between cells), each cell lit by a hash of its own, so that the gold arrives a cell at a time and in no order. The gold is half a
// metal in the shading (metalness up, roughness down) and a little lit from within, so it reads as gold in a dim room and in the sun.
//
// Prior art: kintsugi itself (urushi lacquer dusted with gold, the repair shown, not hidden), Steven Worley's "A Cellular Texture
// Basis Function" (1996) for the crack net, and the gold-veined pots of this game's clapperjars, which go back to the kiln mended.
//
// The same net carries a blow's CRACKS (vessel/damage.js): other cells of it, per hit region (`uDmg`, one value for each of the six
// regions, read through each vertex's `aRegion`), dark lacquer with a thread of Lachryma at the heart of the line; they mend away cell by
// cell. A crack that mends is drawn on a line the gold may one day fill.
//
//   addKintsugi(material, uniforms)    uniforms = kintsugiUniforms()  ({ uKin: share 0..1, uKinScale, uDmg: Float32Array(6) })
// ---------------------------------------------------------------------------------------
export const kintsugiUniforms = () => ({ uKin: { value: 0 }, uKinScale: { value: 11 }, uDmg: { value: new Float32Array(6) } });

const FRAG_HEAD = /* glsl */`
uniform float uKin; uniform float uKinScale; uniform float uDmg[6]; varying vec3 vKin; varying float vRegion;
vec3 kinHash(vec3 p) { p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
// the distance to the nearest edge between cells, and the nearest cell's own number
float kinEdge(vec3 p, out float id) {
  vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; vec3 c1 = vec3(0.0);
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z)), r = g + kinHash(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; c1 = i + g; } else if (d < d2) d2 = d;
  }
  id = kinHash(c1 + 17.0).x;
  return sqrt(d2) - sqrt(d1);
}`;

export function addKintsugi(m, uni) {
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey?.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKin; attribute float aRegion; varying float vRegion;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKin = position; vRegion = aRegion;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float kinId; float kinE = kinEdge(vKin * uKinScale, kinId);
  float kSeam = uKin > 0.0 ? (1.0 - smoothstep(0.022, 0.05, kinE)) * step(kinId, uKin) : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.70, 0.27), kSeam);
  // a blow's cracks (vessel/damage.js): the same net, other cells, dark lacquer with Lachryma at the heart of the line, as wide as the
  // region is hurt; they mend cell by cell as it heals
  float dK = uDmg[int(clamp(vRegion + 0.5, 0.0, 5.0))];
  float dOn = dK > 0.0 ? step(fract(kinId * 7.31 + 0.13), dK) : 0.0;
  float dSeam = dOn * (1.0 - smoothstep(0.02 + 0.03 * dK, 0.05 + 0.05 * dK, kinE)) * (1.0 - kSeam);
  float dCore = dOn * (1.0 - smoothstep(0.0, 0.02, kinE)) * (1.0 - kSeam);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.03, 0.05), dSeam);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.28, kSeam);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 0.55, kSeam);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.93, 0.70, 0.27) * 0.32 * kSeam + vec3(0.62, 0.4, 1.0) * 0.9 * dCore * dK;');
  };
  m.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-kin`;
  m.needsUpdate = true;
  return m;
}
