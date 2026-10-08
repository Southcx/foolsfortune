// ---------------------------------------------------------------------------------------
// THE RIBBON OF LIGHT: one shader program for every flat strip of light the game lays down as a ribbon (its uv's x along it, its y
// across it, or the other way round for the beam): the spirit veins and Myggdrasil's threads and branches (vfx/garden/veins.js), the
// sculpt brush's ring (vfx/garden/sculptbrush.js), the incense smoke's thread (vfx/garden/features.js) and the data drain's beam
// (vfx/datadrain.js). Each was a ShaderMaterial of its own with the same vertex shader and the same settings (transparent, both sides,
// no depth written), so each was a program of its own; the look is now a uniform (`uRibbon`), the code of every look is kept as it was,
// and the five draw with one program (CLAUDE.md, Performance: casebook rule 5, "a shader program is a cost"; the program diet's method).
//
//   vein     the light running along in slow pulses, brightest at the heart (uT, uK strength, uC colour)
//   band     a soft band across, its colour at six tenths (uC, uK alpha: the sculpt ring)
//   smoke    fading up its length and in from its foot (uC colour, uK alpha times 0.35: the incense thread)
//   beam     across its x, stripes running down its y, magenta to cyan with a white core and a dark edge (uT, uK alpha: the data drain)
//
// Blending, side and depth are the material's own and do not split the program (the vein and the band add, the smoke and the beam
// blend); fog, both sides and transparency must stay the same for all of them, or the program splits again.
//
// Prior art: the "uber-shader" of every engine that keeps its program count down (one source, the variant chosen by a uniform where a
// define would compile a program each), and the earlier diet's pond and Weir's Well (vfx/water.js: the kind a uniform, not a define).
//
//   ribbonLightMaterial(look, uniforms, { blending, name, fog, toneMapped }) -> a ShaderMaterial on the one program
//   (look: 'vein' | 'band' | 'smoke' | 'beam'; uniforms: { uT?, uK?, uC? } of the caller's own, kept by reference; uRibbon is added)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const RIBBON_LOOK = { vein: 0, band: 1, smoke: 2, beam: 3 };

const V = /* glsl */`varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const F = /* glsl */`varying vec2 vU; uniform float uT, uK, uRibbon; uniform vec3 uC;
void main() {
  if (uRibbon < 0.5) {
    float across = 1.0 - abs(vU.y * 2.0 - 1.0), core = pow(across, 3.0);
    float pulse = 0.5 + 0.5 * sin(vU.x * 40.0 - uT * 2.2), pulse2 = 0.5 + 0.5 * sin(vU.x * 13.0 - uT * 0.9 + 1.3);
    float ends = smoothstep(0.0, 0.06, vU.x) * smoothstep(1.0, 0.94, vU.x);
    float a = ends * (core * (0.45 + 0.4 * pulse * pulse2) + across * 0.12) * uK;
    gl_FragColor = vec4(uC * (0.5 + 0.8 * core), a * 0.6);                // (low and soft: the scene is linear)
  } else if (uRibbon < 1.5) {
    float a = 1.0 - abs(vU.y * 2.0 - 1.0); gl_FragColor = vec4(uC * 0.6, a * a * uK);
  } else if (uRibbon < 2.5) {
    float a = (1.0 - abs(vU.y * 2.0 - 1.0)) * (1.0 - vU.x) * smoothstep(0.0, 0.1, vU.x); gl_FragColor = vec4(uC, a * 0.35 * uK);
  } else {
    float across = 1.0 - abs(vU.x - 0.5) * 2.0, core = pow(across, 6.0), edge = pow(across, 1.5);
    float stripe = step(0.55, fract(vU.y * 14.0 + uT * 6.0)); // (running toward the bracelet)
    vec3 c = mix(vec3(1.0, 0.25, 0.82), vec3(0.27, 0.94, 1.0), smoothstep(0.2, 0.7, across)) * (0.55 + 0.45 * stripe) + vec3(core);
    c = mix(vec3(0.05, 0.0, 0.1), c, smoothstep(0.0, 0.25, across)); // (a dark edge, so the beam reads on the bright sand)
    gl_FragColor = vec4(c, uK * smoothstep(0.0, 0.08, across));
  }
}`;

/** A material on the ribbons' one program: `look` picks the look, `u` are the caller's uniforms (kept by reference: the caller writes
 *  them), the rest the material's own settings (none of which splits the program). */
export function ribbonLightMaterial(look, u = {}, { blending = THREE.NormalBlending, name = `ribbon-${look}`, fog = false, toneMapped = true } = {}) {
  if (!(look in RIBBON_LOOK)) throw new Error(`ribbonLightMaterial: no look '${look}'`);
  const uniforms = Object.assign({ uT: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Color(1, 1, 1) } }, u, { uRibbon: { value: RIBBON_LOOK[look] } });
  return new THREE.ShaderMaterial({ name, uniforms, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending, fog, toneMapped });
}
