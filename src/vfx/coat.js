// ---------------------------------------------------------------------------------------
// COATED: a thing caught in a spill of Lachryma, coated in it (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4.7: a folk
// in a spill, and the Soul Brush's mop cleaning them). The coat runs DOWN them from the top in uneven drips, ink with its oil film and a
// wet gloss, the feeling's colour where it thins at its edge; as the mop drinks it the coat draws back up off them and is gone. It is
// laid on the thing's own material (one folk, one material: npc/folk.js), so it costs nothing while it is clean.
//
// Prior art: Super Mario Sunshine's goop-covered Piantas (a coat of paint on a villager that the hose washes off: the plea and the
// clean-up are the quest), Splatoon's ink on a player, and the drip of a dipped glaze (a pot dipped to the shoulder: the glaze runs
// down in tongues and thins at its edge).
//
//   const C = coat(material, { height, feeling })   C.set(k: 0..1, the coat's reach down from the top)   (k 0: the material as it was)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from './weather.js';

export function coat(material, { height = 1.2, feeling = 'grief' } = {}) {
  if (material.userData.coat) return material.userData.coat;
  const u = { uCoat: { value: 0 }, uCoatH: { value: height }, uCoatG: { value: new THREE.Color(COLOR[feeling] ?? COLOR.grief) } };
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vCoatP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoatP = vec3(modelMatrix * vec4(transformed, 1.0)) - vec3(modelMatrix[3]);');
    sh.fragmentShader = 'varying vec3 vCoatP; uniform float uCoat, uCoatH; uniform vec3 uCoatG;\n' + sh.fragmentShader
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  float coatK = 0.0;
  if (uCoat > 0.001) {
    float a = atan(vCoatP.z, vCoatP.x);
    float drip = 0.14 * pow(abs(sin(a * 3.0 + 1.3)) * abs(sin(a * 7.0)), 2.0) * uCoatH;  // (tongues running down further here and there)
    float line = uCoatH * (1.0 - uCoat) - drip;                                         // (the coat's lower edge, from the top down)
    coatK = smoothstep(line - 0.02, line + 0.02, vCoatP.y);
    roughnessFactor = mix(roughnessFactor, 0.12, coatK);                                  // (wet: glossy)
  }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  if (uCoat > 0.001) {
    float a2 = atan(vCoatP.z, vCoatP.x);
    float drip2 = 0.14 * pow(abs(sin(a2 * 3.0 + 1.3)) * abs(sin(a2 * 7.0)), 2.0) * uCoatH, line2 = uCoatH * (1.0 - uCoat) - drip2;
    float k2 = smoothstep(line2 - 0.02, line2 + 0.02, vCoatP.y), thin = k2 * (1.0 - smoothstep(line2, line2 + 0.07, vCoatP.y));
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (vCoatP.y * 3.0 + a2 * 0.3 + vec3(0.0, 0.33, 0.67)));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.01, 0.018) + film * 0.012, k2);  // (ink, its film faint in it)
    diffuseColor.rgb = mix(diffuseColor.rgb, uCoatG * 0.45, thin * 0.7);                      // (the feeling, where it thins at its edge)
  }`);
  };
  material.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-coat`;
  material.needsUpdate = true;
  const C = { u, set(k) { u.uCoat.value = THREE.MathUtils.clamp(k, 0, 1); }, feeling(f) { u.uCoatG.value.setHex(COLOR[f] ?? COLOR.grief); } };
  return (material.userData.coat = C);
}
