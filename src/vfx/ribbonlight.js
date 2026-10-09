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
// and, being flat looks of the same settings drawn on a quad's uv, the Soul Brush's world marks (vfx/brushmarks.js), with uP (a vec4)
// for their numbers:
//   reticle  the paint reticle: a point where the stream lands and a ring for its spread, keylined (uC, uK, uP ring, point, width)
//   jetring  the jet ring at the feet: the hover's fuel, the rocket's gather, in the Lachryma ring's language (uP fill, low, burst, start)
//   shine    ground just cleaned: a ring going out with glints, or a twinkle over it (uC, uK, uP age, kind, seed)
//
// Blending, side and depth are the material's own and do not split the program (the vein and the band add, the smoke and the beam
// blend); fog, both sides and transparency must stay the same for all of them, or the program splits again.
//
// Prior art: the "uber-shader" of every engine that keeps its program count down (one source, the variant chosen by a uniform where a
// define would compile a program each), and the earlier diet's pond and Weir's Well (vfx/water.js: the kind a uniform, not a define).
//
//   ribbonLightMaterial(look, uniforms, { blending, name, fog, toneMapped }) -> a ShaderMaterial on the one program
//   (look: 'vein' | 'band' | 'smoke' | 'beam' | 'reticle' | 'jetring' | 'shine'; uniforms: { uT?, uK?, uC?, uP? } of the caller's own,
//   kept by reference; uRibbon is added, and uMindT, the Mind's drift: vfx/labradorite.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';

export const RIBBON_LOOK = { vein: 0, band: 1, smoke: 2, beam: 3, reticle: 4, jetring: 5, shine: 6 };

const V = /* glsl */`varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const F = /* glsl */`varying vec2 vU; uniform float uT, uK, uRibbon; uniform vec3 uC; uniform vec4 uP;
${LAB_GLSL}
float rlEdge(float d, float fw) { return 1.0 - smoothstep(-0.5 * fw, 0.5 * fw, d); } // (inside a signed distance, antialiased by the pixel)
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
  } else if (uRibbon < 3.5) {
    float across = 1.0 - abs(vU.x - 0.5) * 2.0, core = pow(across, 6.0), edge = pow(across, 1.5);
    float stripe = step(0.55, fract(vU.y * 14.0 + uT * 6.0)); // (running toward the bracelet)
    vec3 c = mix(vec3(1.0, 0.25, 0.82), vec3(0.27, 0.94, 1.0), smoothstep(0.2, 0.7, across)) * (0.55 + 0.45 * stripe) + vec3(core);
    c = mix(vec3(0.05, 0.0, 0.1), c, smoothstep(0.0, 0.25, across)); // (a dark edge, so the beam reads on the bright sand)
    gl_FragColor = vec4(c, uK * smoothstep(0.0, 0.08, across));
  } else if (uRibbon < 4.5) {
    // THE PAINT RETICLE (vfx/brushmarks.js): a point where the stream lands, a ring for its spread with four ticks (the far one longer,
    // down the throw), the feeling's colour lifted light, keylined dark; the spread's disc faintly tinted. uP: ring, point, line width
    // (quad units: the quad's half-size is 1)
    vec2 p = vU * 2.0 - 1.0; float r = length(p), fw = max(fwidth(r), 1e-4);
    vec3 lit = uC + (1.0 - uC) * clamp(0.12 - dot(uC, vec3(0.2126, 0.7152, 0.0722)), 0.0, 0.12); // (the feeling's own colour; only the darkest lifted a little)
    vec3 ink = vec3(0.012, 0.009, 0.018);
    float w = max(uP.z, 1.3 * fw), kl = max(0.6 * uP.z, 1.1 * fw);
    float ang = atan(p.y, p.x), q = mod(ang + 0.7853982, 1.5707963) - 0.7853982;
    float tl = (abs(ang - 1.5707963) < 0.7853982 ? 0.36 : 0.22) * uP.x;
    float dRing = abs(r - uP.x) - 0.5 * w;
    float dTick = max(max(abs(sin(q)) * r - 0.5 * w, (uP.x - tl) - r), r - uP.x);
    float d = min(min(dRing, dTick), r - uP.y);
    float body = rlEdge(d, fw), outline = rlEdge(d - kl, fw), spread = rlEdge(r - uP.x, fw) * 0.1;
    float hot = rlEdge(r - uP.y * 0.38, fw) * 0.85;
    vec3 c = mix(mix(lit, ink, outline), lit, body);
    gl_FragColor = vec4(mix(c, vec3(1.0), hot), max(max(spread, outline * 0.9), body) * uK);
  } else if (uRibbon < 5.5) {
    // THE JET RING (vfx/brushmarks.js): the hover's fuel draining, the rocket's gather filling, at the feet, in the Lachryma ring's
    // language (vfx/hudring.js): a dark track in eight segments between two fine lines of the Mind, the filled part light, a bright head.
    // uP: the share of the turn filled, the low pulse (0..1), the burst when the rocket is full (0..1), the start angle; uT a clock
    vec2 p = vU * 2.0 - 1.0; float r = length(p), fw = max(fwidth(r), 1e-4);
    float a = mod(atan(p.y, p.x) - uP.w + 6.2831853, 6.2831853) / 6.2831853;
    float fa = fwidth(a); if (fa > 0.5) fa = fwidth(fract(a + 0.5)); fa = max(fa, 1e-4);
    float track = rlEdge(0.635 - r, fw) * rlEdge(r - 0.825, fw), band = rlEdge(0.665 - r, fw) * rlEdge(r - 0.795, fw);
    float filled = 1.0 - smoothstep(uP.x - fa, uP.x + fa, a);
    float seg = (0.5 - abs(fract(a * 8.0) - 0.5)) / 8.0, gw = max(0.0035, fa), gap = 1.0 - smoothstep(gw, gw + fa, seg);
    vec3 lit = mix(labLin(vec3(0.82, 0.88, 1.0)), labSoft(a * 0.7 + uMindT * 0.02), 0.7) * 1.25 * (1.0 - uP.y * (0.45 + 0.45 * sin(uT * 9.0)));
    vec3 c = mix(LAB_INK * 3.0, lit, band * filled * (1.0 - gap));
    float al = track * 0.85 + band * filled * (1.0 - gap) * 0.15;
    float frame = max(1.0 - smoothstep(0.4 * fw, 1.6 * fw, abs(r - 0.65)), 1.0 - smoothstep(0.4 * fw, 1.6 * fw, abs(r - 0.81)));
    c = mix(c, labSoft(a + 0.3), frame * 0.85); al = max(al, frame * 0.85);
    float head = (1.0 - smoothstep(0.0, 0.03, abs(a - uP.x))) * band * step(0.002, uP.x) * step(uP.x, 0.998);
    c = mix(c, vec3(1.0), head * 0.85);
    float pop = uP.z > 0.0 ? (1.0 - smoothstep(fw, 3.0 * fw + 0.03, abs(r - (0.81 + 0.17 * uP.z)))) * (1.0 - uP.z) : 0.0;
    c = mix(c, lit * 1.3, pop); al = max(al, pop);
    gl_FragColor = vec4(c, al * uK);
  } else {
    // THE SHINE (vfx/brushmarks.js): ground just cleaned. uP.y 0: laid on the ground, a ring going out and a few glints, each once;
    // 1: a twinkle standing over it, a four-pointed star keylined dark. uP: age (0..1), kind, a seed
    vec2 p = vU * 2.0 - 1.0; float r = length(p), fw = max(fwidth(r), 1e-4), t = uP.x;
    if (uP.y < 0.5) {
      float R = 0.3 + 0.62 * (1.0 - pow(1.0 - t, 3.0)), w = 0.025 + 0.035 * (1.0 - t);
      float ring = rlEdge(abs(r - R) - w, fw) * (1.0 - t), shade = rlEdge(abs(r - R + 2.0 * w) - w, fw) * (1.0 - t) * 0.6;
      vec2 g = p * 3.0 + uP.z * 7.0, cell = floor(g), f = fract(g) - 0.5;
      float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453), tw = sin(clamp((t - h * 0.55) / 0.35, 0.0, 1.0) * 3.14159);
      float glint = step(0.62, h) * rlEdge(r - R, fw) * tw * rlEdge(min(abs(f.x) + abs(f.y) * 7.0, abs(f.y) + abs(f.x) * 7.0) - 0.2, max(fwidth(f.x), 1e-3));
      vec3 c = mix(vec3(0.01, 0.03, 0.04), uC, max(ring, glint));
      gl_FragColor = vec4(mix(c, vec3(1.0), glint * 0.7), max(max(ring, glint), shade) * uK);
    } else {
      float s = sin(3.14159 * clamp(t * 1.25, 0.0, 1.0)), an = uP.z * 6.2832 + t * 0.9, cs = cos(an), sn = sin(an);
      vec2 q = abs(mat2(cs, -sn, sn, cs) * p) / max(s, 0.05);
      float d = min(q.x / 0.95 + q.y / 0.13, q.y / 0.95 + q.x / 0.13) - 1.0, core = length(q) - 0.2;
      float dd = min(d * 0.12, core) * s, f2 = max(fwidth(dd), 1e-4);
      float body = rlEdge(dd, f2), outline = rlEdge(dd - max(0.035 * s, 1.2 * f2), f2);
      vec3 c = mix(vec3(0.02, 0.02, 0.04), mix(uC, vec3(1.0), rlEdge(core * s, f2)), body);
      gl_FragColor = vec4(c, max(body, outline * 0.8) * uK * (1.0 - smoothstep(0.75, 1.0, t)));
    }
  }
}`;

/** A material on the ribbons' one program: `look` picks the look, `u` are the caller's uniforms (kept by reference: the caller writes
 *  them), the rest the material's own settings (none of which splits the program). */
export function ribbonLightMaterial(look, u = {}, { blending = THREE.NormalBlending, name = `ribbon-${look}`, fog = false, toneMapped = true } = {}) {
  if (!(look in RIBBON_LOOK)) throw new Error(`ribbonLightMaterial: no look '${look}'`);
  const uniforms = Object.assign({ uT: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Color(1, 1, 1) }, uP: { value: new THREE.Vector4() }, uMindT: mindTime }, u, { uRibbon: { value: RIBBON_LOOK[look] } });
  return new THREE.ShaderMaterial({ name, uniforms, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending, fog, toneMapped });
}
