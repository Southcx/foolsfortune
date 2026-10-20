// ---------------------------------------------------------------------------------------
// THE SHIP'S HULL MATERIAL: the one material every ship of the Vessoul's is painted in (the sloop, frigate, tanker, destroyer and
// galleon), one program for all five (customProgramCacheKey 'ship-hull'). A standard material read from the mesher's vertex colours
// (shipkit/hullkit.js): the colour is the paint, the alpha a code (plain, a panelled plate, lit in its own colour, lit in the ship's
// feeling). On a panelled plate, the PANEL LINES: the plates' seams across the hull every `panel` metres, antialiased by their own
// footprint and faded out before they are smaller than a pixel (no crawl at 480 lines: CLAUDE.md, Feel and comfort). The SCARS ride
// those seams (the crossing's pressures, PASSAGE.md 14.1): `open` widens them dark with the crude's violet in them, `gilt` turns them
// gold, the one nod left to the old kintsugi.
// Always made transparent (opacity 1, depth written), the state the rail's hull is drawn in anyway (courier/ship/ship.js overShots), so
// the mooring, the open sea and the rail compile the one program, not an opaque and a transparent twin. Never `userData.shared`: the rail
// must still be free to order it after the shots. Its onBeforeCompile only recolours, so the Umbral's caustics may lie over it
// (`causticSafe`; vfx/umbral.js).
// Prior art: Gran Turismo 4's and Zone of the Enders 2's vertex-coloured mechs (a palette in the vertices, a glow in their alpha),
// Macross's panel-lined plates (Kawamori, who also drew the Outlaw Star), and the screen-space antialiased line (Inigo Quilez,
// "filterable procedurals").
//
//   const m = hullMaterial({ env, panel })   m.userData.u: { uFeel (the feeling's colour), uFeelK, uSelfK, uPanel, uOpen, uGilt }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const HULL_KEY = 'ship-hull';

export function hullMaterial({ env = null, panel = 0.9, roughness = 0.5, metalness = 0.15 } = {}) {
  const u = { uFeel: { value: new THREE.Color(0xffc65c) }, uFeelK: { value: 1 }, uSelfK: { value: 1 }, uPanel: { value: panel }, uOpen: { value: 0 }, uGilt: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness, envMap: env, envMapIntensity: 0.35, transparent: true, depthWrite: true });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vShipP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShipP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uFeel; uniform float uFeelK, uSelfK, uPanel, uOpen, uGilt; varying vec3 vShipP;')
      .replace('#include <color_fragment>', `
  diffuseColor.rgb *= vColor.rgb; // (the alpha is the code, not a cut-out)
  float shipCode = vColor.a;
  float shipPanel = step(0.05, shipCode) * (1.0 - step(0.15, shipCode));
  float shipSelf = step(0.15, shipCode) * (1.0 - step(0.6, shipCode)) * clamp((shipCode - 0.2) / 0.4, 0.0, 1.0);
  float shipFeel = step(0.6, shipCode) * clamp((shipCode - 0.6) / 0.4, 0.0, 1.0);
  float shipFw = fwidth(vShipP.z), shipD = abs(fract(vShipP.z / uPanel + 0.5) - 0.5) * uPanel, shipW = 0.012 + 0.045 * uOpen;
  float shipLine = shipPanel * (1.0 - smoothstep(shipW, shipW + shipFw * 1.2, shipD)) * (1.0 - smoothstep(uPanel * 0.08, uPanel * 0.25, shipFw));
  vec3 shipInk = mix(mix(vec3(0.06, 0.06, 0.08), vec3(0.2, 0.04, 0.28), uOpen), vec3(0.95, 0.72, 0.26), uGilt);
  diffuseColor.rgb = mix(diffuseColor.rgb, shipInk, shipLine * 0.8);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += vColor.rgb * shipSelf * 1.6 * uSelfK + uFeel * shipFeel * uFeelK * 1.8
    + shipLine * (vec3(0.95, 0.7, 0.25) * uGilt * 0.5 + vec3(0.45, 0.08, 0.65) * uOpen * 0.4);`);
  };
  m.customProgramCacheKey = () => HULL_KEY;
  m.userData.u = u; m.userData.causticSafe = true;
  return m;
}
