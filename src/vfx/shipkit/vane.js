// ---------------------------------------------------------------------------------------
// THE SAIL'S MATERIAL: the one sail program of the game ('sloop-sail'), shared by every ship's vanes and by every other sail drawn with
// it (Letty's cutter, vfx/encounters/tableaux.js). A grid between a sail's edges, its belly filled by the vertex shader (fullest a third
// back and low: a real sail's draft) and a flutter. Two ways to wear it, one program:
//   CANVAS  (the default, as it always was) opaque cream, the belly pushed along the mesh's +x, the lotus in gold where uLotus has it
//   VANE    (`{ vane: true }`: the ships at sea, RAIL-SHIPS-SCIFI.md 2.2 and 2.5, "light is the sail") a LIGHT-CLOTH: a translucent fill
//           in the class's colour, a bright edge all round (the Light Hawk Wings' rim), the belly pushed along each vertex's own normal
//           (shipkit/rig.js turns it to the belly's side), the lotus kept solid gold on the vanes whose uv has it (a vane's uv.x moved by
//           2 has none: the sloop's main and the galleon's main course carry the owner's wife's lotus, circle_lotus)
// Prior art: Jurai's Light Hawk Wings (light as a sail), the Dorgenark's literal sails in space, Skies of Arcadia's sail-like fins; the
// sail's own draft and flutter from vfx/sloop.js (where it was first written).
//
//   sailMaterial(lotus, { vane, fill, edge, fillA }) -> MeshStandardMaterial   m.userData.u: { uFill, uSide, uLotus, uT, uEdge, uEdgeCol, uFillA, uBellyN }
//   FURL (the sail, 0 furled .. 1 full, at or under which a ship's canvas is stowed: the mooring's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { matteMaterial } from '../matte.js';

/** The sail (0 furled .. 1 full) at or under which a ship's canvas is furled (`set`; the mooring passes 0, the workbench's moored
 *  hulls 0.15); every sail over it is drawn hoisted that far. */
export const FURL = 0.15;
const SAIL = 0xf6e6c8;

export function sailMaterial(lotus, { vane = false, fill = SAIL, edge = 0xffffff, fillA = 0.38 } = {}) {
  const u = { uFill: { value: 0.6 }, uSide: { value: 1 }, uLotus: { value: lotus }, uT: { value: 0 },
    uEdge: { value: vane ? 1 : 0 }, uEdgeCol: { value: new THREE.Color(edge) }, uFillA: { value: vane ? fillA : 1 }, uBellyN: { value: vane ? 1 : 0 } };
  const m = matteMaterial({ color: vane ? fill : SAIL, side: THREE.DoubleSide, forceSinglePass: true, transparent: vane, depthWrite: !vane }); // (Lambert: matte, no metal, no env, cloth whose patch never reads roughness; half the GLSL of Standard and 0.5 to 0.7 of its cost a lit pixel, vfx/matte.js; the program audit, 2026-10-25)
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uFill, uSide, uT, uBellyN; varying vec2 vSailUv;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vSailUv = uv;
float belly = sin(uv.x * 3.14159) * sin(uv.y * 3.14159 * 0.92 + 0.12); // (fullest a third of the way back, low: a real sail's draft)
vec3 sailWay = uBellyN > 0.5 ? normalize(objectNormal) : vec3(1.0, 0.0, 0.0);
transformed += sailWay * (uSide * uFill * belly * 0.55);
transformed.x += sin(uT * 3.0 + uv.y * 4.0) * 0.012 * uv.x;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uLotus; uniform float uEdge, uFillA; uniform vec3 uEdgeCol; varying vec2 vSailUv;')
      .replace('#include <color_fragment>', `#include <color_fragment>
float sailLotus = 0.0;
{ vec2 q = (vSailUv - vec2(0.42, 0.5)) / vec2(0.62, 0.5) + 0.5; sailLotus = all(greaterThan(q, vec2(0.0))) && all(lessThan(q, vec2(1.0))) ? texture2D(uLotus, q).a : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.89, 0.6, 0.18), sailLotus * 0.85); }
vec2 sailEu = vec2(vSailUv.x > 1.5 ? vSailUv.x - 2.0 : vSailUv.x, vSailUv.y);
float sailE = min(min(sailEu.x, 1.0 - sailEu.x), min(sailEu.y, 1.0 - sailEu.y));
float sailEdge = (1.0 - smoothstep(0.02, 0.05 + fwidth(sailE) * 1.5, sailE)) * uEdge;
diffuseColor.a *= mix(1.0, max(max(uFillA, sailEdge), sailLotus * 0.9), uEdge);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += uEdgeCol * (sailEdge * 1.4 + uEdge * 0.14) + vec3(0.89, 0.6, 0.18) * sailLotus * uEdge * 0.35;`);
  };
  m.customProgramCacheKey = () => 'sloop-sail';
  m.userData.u = u;
  return m;
}
