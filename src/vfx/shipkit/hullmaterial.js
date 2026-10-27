// ---------------------------------------------------------------------------------------
// THE SHIP'S HULL MATERIAL: the one material every ship of the Vessoul's is painted in (the sloop, frigate, tanker, destroyer and
// galleon), one program for all five (customProgramCacheKey 'ship-hull'). A standard material read from the mesher's vertex colours
// (shipkit/hullkit.js): the colour is the paint, the alpha a code (plain, a panelled plate, lit in its own colour, lit in the ship's
// feeling). On a panelled plate, the PANEL LINES: the plates' seams across the hull every `panel` metres, antialiased by their own
// footprint and faded out before they are smaller than a pixel (no crawl at 480 lines: CLAUDE.md, Feel and comfort). The SCARS ride
// those seams (the crossing's pressures, PASSAGE.md 14.1): `open` widens them dark with the crude's violet in them, `gilt` turns them
// gold, the one nod left to the old kintsugi.
// THE PLANKS (the owner, 2026-10-27: "flatter decks"): on a planked surface (code 0.125) the boards' seams, a deck's along the length and
// a side's strakes level, `plank` metres wide, a butt joint every 4.8 m staggered a board, and each board a little lighter or darker than
// its neighbour; antialiased and faded out as the panel lines are, and the scars ride its seams too.
// Always made transparent (opacity 1, depth written), the state the rail's hull is drawn in anyway (courier/ship/ship.js overShots), so
// the mooring, the open sea and the rail compile the one program, not an opaque and a transparent twin. Never `userData.shared`: the rail
// must still be free to order it after the shots. Its onBeforeCompile only recolours, so the Umbral's caustics may lie over it
// (`causticSafe`; vfx/umbral.js).
// Prior art: Gran Turismo 4's and Zone of the Enders 2's vertex-coloured mechs (a palette in the vertices, a glow in their alpha),
// Macross's panel-lined plates (Kawamori, who also drew the Outlaw Star), and the screen-space antialiased line (Inigo Quilez,
// "filterable procedurals"); the planks: a holystoned frigate's deck (the Constitution's, laid fore and aft, butts staggered by the
// shipwright's rule of three) and a carvel hull's strakes.
//
//   const m = hullMaterial({ env, panel, plank })   m.userData.u: { uFeel (the feeling's colour), uFeelK, uSelfK, uPanel, uPlank, uOpen, uGilt,
//   uPale (0..1: the light hull's bleached paint, shipkit/partlooks.js; 0 as built) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const HULL_KEY = 'ship-hull';

export function hullMaterial({ env = null, panel = 0.9, plank = 0.3, roughness = 0.5, metalness = 0.15 } = {}) {
  const u = { uFeel: { value: new THREE.Color(0xffc65c) }, uFeelK: { value: 1 }, uSelfK: { value: 1 }, uPanel: { value: panel }, uPlank: { value: plank }, uOpen: { value: 0 }, uGilt: { value: 0 }, uPale: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness, envMap: env, envMapIntensity: 0.35, transparent: true, depthWrite: true });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vShipP; varying vec3 vShipN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShipP = position; vShipN = objectNormal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uFeel; uniform float uFeelK, uSelfK, uPanel, uPlank, uOpen, uGilt, uPale; varying vec3 vShipP; varying vec3 vShipN;')
      .replace('#include <color_fragment>', `
  diffuseColor.rgb *= vColor.rgb; // (the alpha is the code, not a cut-out)
  float shipCode = vColor.a;
  float shipPanel = step(0.05, shipCode) * (1.0 - step(0.115, shipCode));
  float shipPlank = step(0.115, shipCode) * (1.0 - step(0.15, shipCode));
  float shipSelf = step(0.15, shipCode) * (1.0 - step(0.6, shipCode)) * clamp((shipCode - 0.2) / 0.4, 0.0, 1.0);
  float shipFeel = step(0.6, shipCode) * clamp((shipCode - 0.6) / 0.4, 0.0, 1.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.8, 0.7) * (0.72 + 0.4 * dot(vColor.rgb, vec3(0.333))), uPale * (1.0 - step(0.15, shipCode)) * 0.85); // (the light hull: its paint bleached to ash, the lit parts kept)
  float shipFw = fwidth(vShipP.z), shipD = abs(fract(vShipP.z / uPanel + 0.5) - 0.5) * uPanel, shipW = 0.012 + 0.045 * uOpen;
  float shipLine = shipPanel * (1.0 - smoothstep(shipW, shipW + shipFw * 1.2, shipD)) * (1.0 - smoothstep(uPanel * 0.08, uPanel * 0.25, shipFw));
  vec3 shipNa = abs(vShipN); float shipFlat = step(0.7, shipNa.y), shipFace = (1.0 - shipFlat) * step(shipNa.x, shipNa.z); // (a deck: boards along z; a side: strakes level; a face across the ship: boards along x)
  float shipU = mix(vShipP.y, vShipP.x, shipFlat), shipV = mix(vShipP.z, vShipP.x, shipFace);
  float shipPi = floor(shipU / uPlank), shipH = fract(sin(shipPi * 12.9898 + 1.7) * 43758.5453);
  float shipFu = fwidth(shipU), shipFv = fwidth(shipV), shipFade = shipPlank * (1.0 - smoothstep(uPlank * 0.08, uPlank * 0.3, shipFu));
  float shipDu = abs(fract(shipU / uPlank + 0.5) - 0.5) * uPlank, shipDv = abs(fract(shipV / 4.8 + shipH + 0.5) - 0.5) * 4.8;
  float shipSeam = max(1.0 - smoothstep(shipW, shipW + shipFu * 1.2, shipDu), (1.0 - smoothstep(shipW * 0.7, shipW * 0.7 + shipFv * 1.2, shipDv)) * (1.0 - smoothstep(0.3, 1.2, shipFv)));
  diffuseColor.rgb *= mix(1.0, 0.88 + 0.2 * shipH, shipFade); // (each board its own shade)
  shipLine = max(shipLine, shipSeam * shipFade * 0.75);
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
