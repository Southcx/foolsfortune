// ---------------------------------------------------------------------------------------
// THE CEL RAMP AND THE RIM: how light falls on things, in the manner of Level-5's PS2 games. Dark Cloud 2 and Rogue Galaxy drew their
// worlds with a soft toon ramp: a lit side that is evenly lit, a shadow side that is evenly in shadow, and between them a narrow,
// soft terminator (and a thin middle band where a curve turns away), with the fill (the sky, the bounce) left as it is so nothing goes
// black. Their characters wore a thin bright rim where they turn from the camera, which kept them reading against any ground.
//
// Here: every lit material's direct light (the sun, the lamps) goes through the ramp instead of the plain cosine, by one change to
// three.js's own lighting chunks (Standard and Lambert alike), so every material in the game takes it with no per-material code, and
// the custom shaders (the sand, the water) keep their own. The rim is a define a material opts into (the Courier, the clapperjars,
// the hand, the Veritome): a thin band at the silhouette in the Lachryma's thin-film colours, faint, emissive, so it reads in shadow too.
//
// Prior art: Dark Cloud 2 / Rogue Galaxy (Level-5's "cel" look: two-tone ramps with soft edges, a rim on characters), Wind Waker's
// two-tone light with its soft step, the trope compendium's art tab ("a soft toon ramp like Dark Cloud 2", "a thin Lachryma rim").
//
//   installToon(k, sheen)         once, before anything compiles (k: 0 = the plain cosine, 1 = the full ramp; T.visual.toon. sheen false:
//                                 a matte Standard surface, roughness 0.85 and over, skips the GGX specular per light; T.visual.matteSheen,
//                                 off on the Low and Minimum graphics tiers: Lambert's saving without swapping a material, render/graphics.js)
//   setToon(k, scene)             change it later (every lit material recompiles once)
//   addRim(material, k = 1)       a thin Lachryma rim on this material
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const ORIG = {
  physical: THREE.ShaderChunk.lights_physical_pars_fragment,
  lambert: THREE.ShaderChunk.lights_lambert_pars_fragment,
  emissive: THREE.ShaderChunk.emissivemap_fragment,
};
const LINE = 'vec3 irradiance = dotNL * directLight.color;';
const SPEC = 'reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );';
let K = 1, SHEEN = true;

// the ramp: a little light as soon as a face turns toward the light (the middle band), all of it past the terminator
const ramp = (k) => `
float toonRamp( const in float x ) {
	float t = 0.3 * smoothstep( 0.0, 0.14, x ) + 0.7 * smoothstep( 0.3, 0.48, x );
	return mix( x, t, ${k.toFixed(3)} );
}
`;

function patch(k) {
  K = k;
  for (const [key, name] of [['physical', 'lights_physical_pars_fragment'], ['lambert', 'lights_lambert_pars_fragment']]) {
    const src = ORIG[key];
    if (!src.includes(LINE)) { console.warn('toon: three.js lighting chunk changed; the ramp is off'); return; }
    let out = k > 0 ? ramp(k) + src.replace(LINE, 'vec3 irradiance = toonRamp( dotNL ) * directLight.color;') : src;
    if (!SHEEN && key === 'physical') { // (what Standard adds at roughness 0.85 and over is a faint broad sheen; one branch a draw, the same for a whole material)
      if (out.includes(SPEC)) out = out.replace(SPEC, `if ( material.roughness < 0.85 ) ${SPEC}`);
      else console.warn('toon: three.js physical chunk changed; the matte sheen stays');
    }
    THREE.ShaderChunk[name] = out;
  }
  // the rim: at the silhouette, thin, in the thin-film colours of Lachryma (they turn with the angle), added as emitted light
  THREE.ShaderChunk.emissivemap_fragment = `${ORIG.emissive}
#ifdef RIM
	{
		float fr = 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) );
		float band = smoothstep( 0.64, 0.86, fr );
		vec3 film = 0.55 + 0.45 * cos( 6.2832 * ( fr * 1.6 + vec3( 0.0, 0.33, 0.67 ) ) );
		totalEmissiveRadiance += band * mix( vec3( 1.0, 0.88, 0.74 ), film, 0.55 ) * RIM;
	}
#endif
`;
}

export function installToon(k = 1, sheen = true) { SHEEN = sheen; patch(k); }

export function setToon(k, scene) {
  if (Math.abs(k - K) < 1e-3) return;
  patch(k);
  scene?.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) if (m.isMeshStandardMaterial || m.isMeshLambertMaterial) m.needsUpdate = true;
  });
}

/** A thin Lachryma rim on a lit material (k scales its brightness). */
export function addRim(m, k = 1) {
  if (!m || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial)) return m;
  m.defines = { ...(m.defines || {}), RIM: (0.32 * k).toFixed(3) };
  m.needsUpdate = true;
  return m;
}
