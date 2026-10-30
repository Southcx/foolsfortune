// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S MATERIAL: the one program its whole body is drawn with (the roots and trunk, the corals, the fungi, the caps and the
// fruit), a standard material whose colour is its vertices' (./kit.js) and whose light is painted rather than hard:
//
//   THE WRAP     the sun's light wrapped a little past the terminator, so a root's turn is a soft gradient, never a hard line
//   THE RIM      a soft rim of sky round every form, cool on the shadow side and warm where the sun is (Ghibli's backgrounds edge
//                their forms in light), and the shade itself leaned cool, toward violet and teal, never grey
//   THROUGH      a cap's rim, a fan, a sponge's lip lit through when the sun is behind them (a part's `through`)
//   THE GLOW     each vertex's glow colour and amount (the gills, the polyps, the sponges' throats, the roots' mouth, the fruit): faint by
//                day, full by night (the garden's night, gardengrounds' uGNight), breathing slowly in a wave across the tree (a whole
//                number of breaths in the clock's hour: CASEBOOK rule 119); a coral's POLYPS are a speckle of light over its skin at
//                night, faded to their mean where a pixel holds several (no crawl at 480 lines)
//   THE TINCTURE its sap's colour (`tint`, eased by the tree) leans a part as far as its `tint` effect says: the caps' tops a little, the
//                gills more, the fruit and the mouth wholly
//
// One program: every tree's material is its own (its tincture), all share the key. No texture, no stock look.
//
// Prior art: Ghibli's painted forests (Kazuo Oga's soft value and cool shadow; Nausicaa's Sea of Corruption lit from within), wrap
// lighting (Valve's half-Lambert, Mitchell et al. 2006), the rim light of cel and painterly shaders (Arc System Works, Okami), the
// leaf canopy's light through (vfx/garden/leafcanopy.js), and real bioluminescent fungi and corals (Mycena's gills, coral polyps'
// fluorescence) for where the glow sits.
//
//   const M = myggdrasilMaterial()   M.userData.u.uMygTint.value (Color)   .uMygTintK.value (0..1)   MYG_KEY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUND_UNIFORMS } from '../gardengrounds.js';
import { MYGG } from './layout.js';

export const MYG_KEY = 'myggdrasil-body-1';
const BREATH = ((Math.PI * 2) * 343 / 3600).toFixed(7); // (343 whole breaths in the grounds' 3600 s clock: about one each 10.5 real s)

const VERT_DECL = /* glsl */`
attribute vec4 aGlow;
attribute vec4 aFx;
varying vec4 vMygGlow;
varying vec4 vMygFx;
varying vec3 vMygW;
`;
const FRAG_DECL = /* glsl */`
uniform float uGTime, uGNight, uMygTintK, uMygGlow;
uniform vec3 uMygTint;
varying vec4 vMygGlow;
varying vec4 vMygFx;
varying vec3 vMygW;
float mygHash(vec3 c) { return fract(sin(dot(c, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
// the polyps: a dot in each cell of a jittered lattice on the skin, their mean where a pixel covers several cells
float mygPolyps(vec3 p) {
  vec3 q = p * 2.2, c = floor(q), f = fract(q) - 0.5;
  vec3 j = vec3(mygHash(c), mygHash(c + 17.3), mygHash(c + 41.9)) - 0.5;
  float d = length(f - j * 0.45), w = length(fwidth(q));
  float dots = 1.0 - smoothstep(0.1, 0.2 + w * 0.5, d);
  return mix(dots, 0.12, smoothstep(0.25, 0.75, w));
}
`;
const FRAG_COLOUR = /* glsl */`
  float mygTk = vMygFx.x * uMygTintK;
  { float ly = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)), ty = max(dot(uMygTint, vec3(0.2126, 0.7152, 0.0722)), 0.02);
    diffuseColor.rgb = mix(diffuseColor.rgb, uMygTint * min(ly / ty, 3.0), mygTk * 0.5); } // (leaned to the tincture, its value kept)
`;
const FRAG_ROUGH = /* glsl */`
  roughnessFactor = max(0.18, vMygFx.w);
`;
const FRAG_GLOW = /* glsl */`
  {
    vec3 gc = mix(vMygGlow.rgb, uMygTint, mygTk); // (the glow leaned to the tincture as far as the part says)
    float breath = 0.84 + 0.16 * sin(uGTime * ${BREATH} + dot(vMygW, vec3(0.07, 0.045, 0.06))); // (a slow wave of breath across the tree)
    float pol = vMygFx.y > 0.0 ? mygPolyps(vMygW) * vMygFx.y : 0.0;
    float g = (vMygGlow.a + pol * uGNight * 0.9) * (0.14 + 0.86 * uGNight) * breath * uMygGlow;
    totalEmissiveRadiance += gc * g;
  }
`;
const FRAG_LIGHT = /* glsl */`
  {
    float ndv = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0), rim = pow(1.0 - ndv, 2.6);
    vec3 cool = vec3(0.52, 0.58, 0.86), lit = vec3(0.0);
    #if NUM_DIR_LIGHTS > 0
    {
      vec3 L = directionalLights[0].direction, sun = directionalLights[0].color;
      float nl = dot(geometryNormal, L), wrap = clamp((nl + 0.55) / 1.55, 0.0, 1.0) - clamp(nl, 0.0, 1.0); // (the half-Lambert's extra past the terminator)
      reflectedLight.indirectDiffuse += diffuseColor.rgb * sun * wrap * 0.3 * vec3(1.0, 0.82, 0.86);
      float back = pow(clamp(dot(-geometryViewDir, L), 0.0, 1.0), 3.0);
      reflectedLight.directDiffuse += sun * diffuseColor.rgb * back * vMygFx.z * (0.35 + 0.65 * rim) * 0.9; // (lit through)
      lit = mix(cool, sun * vec3(1.0, 0.86, 0.72), smoothstep(-0.2, 0.6, nl));
    }
    #else
    lit = cool;
    #endif
    reflectedLight.indirectDiffuse += diffuseColor.rgb * lit * rim * 0.55; // (the rim of sky)
    reflectedLight.indirectDiffuse *= vec3(0.94, 0.95, 1.1); // (the shade leaned cool)
  }
`;

/** A material for one tree (its own tincture; one program between every tree: MYG_KEY). */
export function myggdrasilMaterial() {
  const m = new THREE.MeshStandardMaterial({ name: 'myggdrasil-body', vertexColors: true, roughness: 0.85, metalness: 0 });
  const U = { uGTime: GROUND_UNIFORMS.uGTime, uGNight: GROUND_UNIFORMS.uGNight, uMygTint: { value: new THREE.Color(0xe8c878) }, uMygTintK: { value: 0 }, uMygGlow: { value: MYGG.glow } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    for (const a of ['#include <begin_vertex>', '#include <project_vertex>']) if (!sh.vertexShader.includes(a)) throw new Error(`myggdrasil: no ${a}`);
    for (const a of ['#include <color_fragment>', '#include <roughnessmap_fragment>', '#include <emissivemap_fragment>', '#include <lights_fragment_end>']) if (!sh.fragmentShader.includes(a)) throw new Error(`myggdrasil: no ${a}`);
    sh.vertexShader = VERT_DECL + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMygGlow = aGlow; vMygFx = aFx;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vMygW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAG_COLOUR}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${FRAG_ROUGH}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_GLOW}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${FRAG_LIGHT}`);
  };
  m.customProgramCacheKey = () => MYG_KEY;
  m.userData.u = U;
  return m;
}
