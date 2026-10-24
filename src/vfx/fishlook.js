// ---------------------------------------------------------------------------------------
// A WEIR FISH'S LOOK: the one program every fish body is drawn with (tools/sondelass/angling/fishmesh.js builds the bodies). A body is one
// merged mesh at unit length, nose toward +X; its swim is done here, on the GPU, from a handful of uniforms, so a fish costs one draw and
// no vertex upload a frame. What the vertices carry (fishgeometry.js writes them):
//   aCol   rgba: the body's countershaded feeling colour, a fin's root-to-edge fade, the eye's pupil and iris
//   aFin   xyz: the way a vertex flutters and how far (0 at a fin's root), w: its phase (a long fin's wave runs down it)
//   aKind  x: 0 skin, 1 fin, 2 eye, 3 a light (the lantern's lure, the gulper's tail), 4 a crack (Fury's); y: how much scale pattern
// The swim is the old CPU sweep moved into the vertex shader (the body's z pushed by a travelling wave growing toward the tail, its
// normal sheared to match), so a curd or a crack on the skin swims with it for nothing. The skin is lit by a key that rides the camera
// (above and to the left of the view, as a portrait's key does), so the wet sheen and the eye's highlight show from wherever it is seen:
// held up to the camera, in the portrait, in the Pneuka Box's icon or under the Weir's surface.
//
// Prior art: Animal Crossing's catch held to the camera (a toy-bright body, one hard highlight in the eye); the wet look of a fresh-caught
// fish in photography (a Blinn highlight over a broad film of sheen, a fresnel rim); cycloid scales drawn procedurally as overlapping
// scallops, faded out where they would be finer than a pixel (fwidth: no crawl at 480 lines, CLAUDE.md's Feel); a fin's flutter as a
// vertex wave weighted from its root, as game foliage and flags are moved in the vertex shader (the ray's wings flap the same way).
//   const m = fishMaterial(feelColour)     one per fish (its uniforms its own), one program for all
//   m.userData.u.uPhase / uAmp / uWl / uCurl / uFinPhase / uFinAmp / uOpacity / uGlow / uCrack / uScaleN
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VERT = /* glsl */`
uniform float uPhase, uAmp, uWl, uCurl, uFinPhase, uFinAmp;
attribute vec4 aCol;
attribute vec4 aFin;
attribute vec2 aKind;
varying vec4 vCol;
varying vec3 vN, vV, vRest;
varying vec2 vKind;
#include <fog_pars_vertex>
float waveZ(float u) { return uAmp * sin(uPhase - u * uWl * 2.2) * (0.15 + u) + uCurl * u * u; }
void main() {
  vec3 p = position + aFin.xyz * sin(uFinPhase + aFin.w) * uFinAmp;
  float u = 0.5 - position.x;
  float d = (waveZ(u + 0.01) - waveZ(u - 0.01)) * 50.0; // (dz/du; dz/dx is its negative)
  p.z += waveZ(u);
  vec3 n = normalize(vec3(normal.x + d * normal.z, normal.y, normal.z));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * n); vV = mvPosition.xyz; vRest = position; vCol = aCol; vKind = aKind;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FRAG = /* glsl */`
uniform vec3 uRim;
uniform float uOpacity, uGlow, uCrack, uScaleN;
varying vec4 vCol;
varying vec3 vN, vV, vRest;
varying vec2 vKind;
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN), V = normalize(-vV);
  if (dot(N, V) < 0.0 && vKind.x > 0.5 && vKind.x < 1.5) N = -N; // (a fin seen edge-on past its plane)
  vec3 K = normalize(vec3(-0.35, 0.75, 0.6)); // (the key, riding the camera)
  vec3 col = vCol.rgb;
  float a = vCol.a;
  // scales: offset rows of scallops in the body's own (u, round) coordinates, gone where finer than a pixel
  if (vKind.y > 0.0) {
    vec2 q = vec2((0.5 - vRest.x) * uScaleN, atan(vRest.z, vRest.y) * uScaleN * 0.075);
    q.y += 0.5 * mod(floor(q.x), 2.0);
    vec2 f = fract(q) - vec2(0.15, 0.5);
    float r = length(f * vec2(1.0, 1.25));
    float fw = fwidth(q.x) + fwidth(q.y);
    float k = vKind.y * (1.0 - smoothstep(0.18, 0.5, fw));
    col *= 1.0 - k * (0.22 * smoothstep(0.38, 0.5, r) - 0.08 * (1.0 - smoothstep(0.0, 0.4, r)));
  }
  float dif = 0.42 + 0.58 * max(dot(N, K), 0.0);
  float ndv = max(dot(N, V), 0.0);
  vec3 H = normalize(K + V);
  float nh = max(dot(N, H), 0.0);
  float wet = pow(nh, 70.0) * 1.1 + pow(nh, 9.0) * 0.12;            // (the hard highlight and the broad film of wet over it)
  float rim = pow(1.0 - ndv, 3.0);
  vec3 lit = col * dif + uRim * rim * 0.45 + vec3(wet);
  if (vKind.x > 1.5 && vKind.x < 2.5) {                               // the eye: glassy, its catchlight fixed to the view so it always shows
    float cat = smoothstep(0.955, 0.975, dot(N, normalize(vec3(-0.45, 0.55, 0.7))));
    lit = col * (0.5 + 0.5 * dif) + vec3(pow(nh, 140.0) * 1.6 + cat * 1.4);
  } else if (vKind.x > 2.5 && vKind.x < 3.5) {                        // a light of its own
    lit = col * (1.6 + 0.8 * uGlow) + vec3(0.25 * rim);
  } else if (vKind.x > 3.5) {                                         // a crack's light, faded to nothing below a pixel
    lit = col * 1.8; a *= uCrack;
  } else if (vKind.x > 0.5) {                                         // a fin: thin, so the light comes through it
    lit = col * (0.55 + 0.45 * dif) + uRim * 0.25 * (1.0 - ndv) + vec3(wet * 0.5);
  }
  lit += col * uGlow * 0.3;
  gl_FragColor = vec4(lit, a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** One fish's material: the shared program, its own uniforms. `rim` is the feeling's colour (a THREE.Color, linear). */
export function fishMaterial(rim) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uPhase: { value: 0 }, uAmp: { value: 0.05 }, uWl: { value: 1 }, uCurl: { value: 0 }, uFinPhase: { value: 0 }, uFinAmp: { value: 1 },
    uRim: { value: new THREE.Color() }, uOpacity: { value: 1 }, uGlow: { value: 0 }, uCrack: { value: 0.9 }, uScaleN: { value: 30 },
  }]);
  u.uRim.value.copy(rim);
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, fog: true, transparent: true, depthWrite: true });
  m.userData.u = u;
  return m;
}
