// ---------------------------------------------------------------------------------------
// LABRADORITE: how the Mind is drawn. Mental energy, focus, psychic technology, targeting: the black, iridescent, ultraviolet face of
// Lachryma. The owner's own shaders for it took labradorite as the main influence, and so does this: a stone that is near-black
// until it is turned, when a flash of colour (its schiller: light thrown back from thin layers inside it) comes up out of the dark,
// mostly blue and ultramarine, sometimes peacock-green, gold or copper, edged with violet. The colour is a function of WHERE a
// thing is and FROM WHERE it is seen, so it changes as the eye or the thing moves; on its own it only drifts, slowly and at a
// constant rate (CLAUDE.md: nothing shimmers at a variable rate).
//
// Two ways to wear it:
//   LINES and marks drawn over the world (wireframes, reticles, the chevron's edges): the schiller itself, softly rainbow and lit
//     from within, a pale ultraviolet when the colour is low, never a hard spectrum.
//   SURFACES (a marker's body, a dome, the Courier's filigree): ink, the near-black of Lachryma, with the schiller coming up through
//     it at a grazing angle (the stone turned to the light), in bands that move with the eye like oil on water.
//
// Prior art: labradorite and spectrolite (the "labradorescence" of lamellar feldspar: a dark body, a directional flash, blue first);
// the thin-film shaders of the oil slick and the soap bubble (a hue walked along a palette by the angle of view); Rez's and Vagrant
// Story's wireframes, which this is the colour of (docs/ART.md, precept 3: the Mind).
//
//   LAB_GLSL                          the shader chunk: labradorite(ph), labSoft(ph), labInk(ph, sheen), labPhase(worldPos, viewDir)
//   mindTime                          the shared drift uniform; mindTick() once a frame (idempotent: anyone may call it)
//   mindLineMaterial({ opacity, depthTest, bright })    for LineSegments / Line
//   mindFillMaterial({ opacity, depthTest, ink })       for the body of a mark (normal blending: ink with schiller at the rim)
//   SLIP_SCHILLER (one uniform every slip body shares: its strength)   SLIP_SCHILLER_GLSL (slipSchiller(p, n, viewDir, wet): include after
//     LAB_GLSL; the faint flash of the Lachryma in slip under its clay, at a grazing look, strongest where it runs wet: the owner,
//     2026-10-09, "All Slip is now a form of Lachryma"; the slip jellies' melt, creatures/jelly/deform.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The stone's flash, as a cyclic palette: the blues take three of its seven steps, as they do in the stone. (Written in sRGB, as a
 *  painter picks them, and taken to linear light for the frame, which is encoded on the way to the screen.) */
export const LAB_GLSL = /* glsl */`
vec3 labLin(vec3 c) { return pow(c, vec3(2.2)); }
const vec3 LAB_INK = vec3(0.0024, 0.0019, 0.0045); // (#0d0b13, in linear light)
vec3 labStop(int i) {
  if (i == 0) return vec3(0.40, 0.22, 0.82);   // violet (the ultraviolet edge)
  if (i == 1) return vec3(0.22, 0.30, 0.95);   // ultramarine
  if (i == 2) return vec3(0.14, 0.50, 0.98);   // labradorite blue
  if (i == 3) return vec3(0.10, 0.70, 0.86);   // peacock
  if (i == 4) return vec3(0.22, 0.78, 0.55);   // green
  if (i == 5) return vec3(0.92, 0.76, 0.32);   // gold
  return vec3(0.88, 0.46, 0.26);               // copper
}
vec3 labradorite(float ph) {
  float x = fract(ph) * 7.0;
  float i = floor(x), f = x - i;
  f = f * f * (3.0 - 2.0 * f);
  return labLin(mix(labStop(int(i)), labStop(int(mod(i + 1.0, 7.0))), f));
}
// softly rainbow: the flash leaned toward a pale ultraviolet, so a line reads as one colour that turns, not as a spectrum
vec3 labSoft(float ph) { return mix(labLin(vec3(0.60, 0.58, 0.98)), labradorite(ph), 0.62); }
// where on the palette a point is, seen from a direction: slow across space, quicker with the angle of view, and the slow drift
uniform float uMindT;
float labPhase(vec3 wp, vec3 viewDir) {
  return dot(wp, vec3(0.071, 0.103, 0.057)) + 0.42 * dot(viewDir, vec3(0.55, 0.62, -0.56)) + uMindT * 0.018;
}
// the stone's face: ink, and the schiller coming up through it with the sheen (0..1), in broad bands that follow the phase
vec3 labInk(float ph, float sheen) {
  float band = smoothstep(0.18, 0.82, 0.5 + 0.5 * sin(ph * 12.566));
  return mix(LAB_INK, labSoft(ph) * 1.1, clamp(sheen * (0.3 + 0.7 * band), 0.0, 0.78));
}
`;

export const mindTime = { value: 0 };
/** Set the drift (seconds, the page's clock by default). Every Mind element calls it in its update; calling it twice in a frame is
 *  the same as once. */
export function mindTick(t = performance.now() / 1000) { mindTime.value = t % 3600; }

const LINE_V = /* glsl */`
varying vec3 vW; varying vec3 vView;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vView = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const LINE_F = /* glsl */`
uniform float uOpacity, uBright;
varying vec3 vW; varying vec3 vView;
${LAB_GLSL}
void main() {
  gl_FragColor = vec4(labSoft(labPhase(vW, vView)) * uBright, uOpacity);
}`;

/** Lines of the Mind (wireframes, edges): additive, softly rainbow. */
export function mindLineMaterial({ opacity = 1, depthTest = false, bright = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: opacity }, uBright: { value: bright }, uMindT: mindTime },
    vertexShader: LINE_V, fragmentShader: LINE_F,
    transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending, fog: false,
  });
}

const FILL_V = /* glsl */`
varying vec3 vW; varying vec3 vView; varying vec3 vN;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vView = normalize(cameraPosition - w.xyz); vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FILL_F = /* glsl */`
uniform float uOpacity, uInk;
varying vec3 vW; varying vec3 vView; varying vec3 vN;
${LAB_GLSL}
void main() {
  vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  float ndv = abs(dot(n, normalize(vView)));
  float rim = pow(1.0 - ndv, 1.6);
  float ph = labPhase(vW, vView) + 0.25 * dot(n, vec3(0.3, 0.8, 0.5));
  vec3 c = mix(labSoft(ph), labInk(ph, 0.12 + 0.7 * rim), uInk);
  gl_FragColor = vec4(c, uOpacity * mix(0.55 + 0.45 * rim, 0.75 + 0.25 * rim, uInk));
}`;

/** The body of a Mind mark: ink with the schiller at the turn of it (normal blending), or with ink 0 a glassy glow. */
export function mindFillMaterial({ opacity = 0.5, depthTest = false, ink = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: opacity }, uInk: { value: ink }, uMindT: mindTime },
    vertexShader: FILL_V, fragmentShader: FILL_F,
    transparent: true, depthWrite: false, depthTest, side: THREE.DoubleSide, fog: false,
  });
}

/** How strongly the Lachryma shows under every slip body's clay (one uniform, shared: a material's program never changes with it). */
export const SLIP_SCHILLER = { value: 0.5 };
/** The Lachryma in slip: a faint schiller under the clay, at a grazing look (the stone turned), strongest where it runs wet. Uses
 *  LAB_GLSL (include that first). p: a point on the body (object space is fine: the flash turns with it), n and viewDir in one space. */
export const SLIP_SCHILLER_GLSL = /* glsl */`
uniform float uSlipSchiller;
vec3 slipSchiller(vec3 p, vec3 n, vec3 viewDir, float wet) {
  float ndv = clamp(abs(dot(n, viewDir)), 0.0, 1.0), graze = pow(1.0 - ndv, 1.2);
  float ph = labPhase(p, viewDir) + 0.3 * dot(n, vec3(0.3, 0.8, 0.5));
  float band = smoothstep(0.2, 0.85, 0.5 + 0.5 * sin(ph * 12.566));
  return labradorite(ph) * graze * (0.3 + 0.7 * band) * (0.25 + 0.75 * wet) * uSlipSchiller;
}
`;
