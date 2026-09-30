// ---------------------------------------------------------------------------------------
// WATER: the surface of a pool, in the manner of the sixth generation's water (PS2 and its contemporaries), and beside it the liquid
// that Lachryma is when it has not been condensed into cubes.
//
// THE WATER is a flat, translucent, cel-banded plane. Its colour is not a texture but a handful of flat bands chosen by DEPTH (each pool
// gives its own floor: a depth per vertex), pale turquoise over the shelf, teal in the middle, a deep marine blue in the trench, each band
// with a hard edge and nothing between; over it, the reflection of the painted sky (the user's own skybox: `sky.texture`) sampled by the
// reflected view ray and posterised to five steps, stronger at a grazing angle (Fresnel); a toon glint (a hard-edged highlight, two
// levels) where a wave faces the sun; and foam: a white band where the water meets the floor, and on the crest of a wave, its width
// riding the wave itself. All the motion is geometry (a few sines lift the plane; the normal is taken from their slope), so a wave is a
// thing that actually moves and nothing in the picture scrolls or flickers (the comfort rule).
//
// LIQUID LACHRYMA (kind 'lachryma') is the same plane made heavy: near-black, waves slow and long and rounded (viscous), no foam, a dark
// reflection of the same sky, and over it the oil-slick film of the cubes' own material (cubes.js), turned by the angle of view and the
// slope of the swell, so that it looks like what the cubes were before they were condensed. The Weir's Well is filled with it.
//
// Prior art: Final Fantasy X's and X-2's water (flat translucent turquoise, banded, foam at the shore, a painted sky in it), Skies of
// Arcadia's and Kingdom Hearts' sea, Wind Waker's sea (the toon glint, the banding), and the oil-slick colours of thin films (the same
// palette as the cubes). Depth-tinted water from a per-vertex depth is the standard trick of the era: no depth buffer is read.
//
//   const w = makeWaterMaterial(sky, 'water' | 'lachryma');   w.uniforms.uTime.value = t;
//   waterGeometry(volume)   -> a plane with `aDepth` (metres to the floor; 0 at the edge) for the volume { x0, x1, z0, z1, surface, bottom, depthAt? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VERT = `
#include <common>
#include <fog_pars_vertex>
attribute float aDepth;
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uSpeed;
varying vec3 vW; varying float vDepth; varying float vH; varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float f = uFreq, t = uTime * uSpeed;
  float a1 = wp.x * 1.3 * f + t * 1.5, a2 = wp.z * 1.7 * f - t * 1.2, a3 = (wp.x + wp.z) * 0.8 * f + t * 0.9;
  float calm = smoothstep(0.0, 0.7, aDepth);            // (the water lies still against the shore)
  float h = uAmp * (0.5 * sin(a1) + 0.4 * sin(a2) + 0.3 * sin(a3)) * calm;
  float dx = uAmp * calm * (0.5 * 1.3 * f * cos(a1) + 0.3 * 0.8 * f * cos(a3));
  float dz = uAmp * calm * (0.4 * 1.7 * f * cos(a2) + 0.3 * 0.8 * f * cos(a3));
  wp.y += h;
  vN = normalize(vec3(-dx * 1.6, 1.0, -dz * 1.6));
  vW = wp.xyz; vDepth = aDepth; vH = h / max(uAmp, 1e-4);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = `
#include <common>
#include <fog_pars_fragment>
uniform sampler2D uSky; uniform vec3 uSun; uniform float uMaxDepth;
varying vec3 vW; varying float vDepth; varying float vH; varying vec3 vN;
//SKYGLSL
vec3 band(float d) {                                     // flat bands by depth: no blend between them but a hair of smoothing
  vec3 c0 = vec3(0.42, 0.92, 0.80), c1 = vec3(0.12, 0.64, 0.66), c2 = vec3(0.05, 0.36, 0.55), c3 = vec3(0.03, 0.16, 0.38);
  float s = 0.03;
  vec3 c = c0;
  c = mix(c, c1, smoothstep(0.55 - s, 0.55 + s, d));
  c = mix(c, c2, smoothstep(1.6 - s, 1.6 + s, d));
  c = mix(c, c3, smoothstep(3.4 - s, 3.4 + s, d));
  return c;
}
vec3 oilFilm(float t) {
  t = fract(t) * 4.0;
  vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t));
}
void main() {
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  bool under = !gl_FrontFacing;
  if (under) { N = -N; }
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 4.0);
  vec3 R = reflect(-V, N); R.y = abs(R.y) * 0.85 + 0.15;
  vec3 sky = texture2D(uSky, skyUv(normalize(R))).rgb;
  sky = floor(sky * 5.0 + 0.5) / 5.0;                   // (five steps of sky)
  vec3 col; float alpha;
#ifdef LACHRYMA
  float film = fract(fres * 0.9 + N.x * 0.5 + N.z * 0.35 + vH * 0.15 + 0.1);
  float g = fres * fres;
  col = vec3(0.008, 0.006, 0.014) + oilFilm(film) * (0.035 + 0.75 * g) + sky * (0.02 + 0.3 * g);
  float s = dot(reflect(-normalize(uSun), N), V);
  col += vec3(1.0, 0.9, 0.8) * (smoothstep(0.93, 0.985, s) * 0.7);
  float rim = 1.0 - smoothstep(0.0, 0.3, vDepth);        // (a meniscus, iridescent, where it meets the stone)
  col += oilFilm(film + 0.3) * rim * 0.5;
  alpha = 0.95;
#else
  col = band(vDepth);
  col = mix(col, sky, clamp(fres * 0.55 + 0.02, 0.0, 0.38));
  float s = dot(reflect(-normalize(uSun), N), V);       // the glint: hard-edged, two levels
  col += vec3(1.0, 0.97, 0.88) * (step(0.985, s) * 0.8 + step(0.955, s) * 0.25);
  float shore = 1.0 - smoothstep(0.0, 0.5, vDepth);
  float foam = step(0.5, shore + vH * 0.18) + step(0.985, vH) * 0.7;   // (foam rides the wave: the shore band breathes with it, and the crests take a little)
  col = mix(col, vec3(0.97, 0.99, 0.98), clamp(foam, 0.0, 1.0));
  alpha = mix(0.5, 0.86, smoothstep(0.3, 3.0, vDepth)) + fres * 0.12 + foam * 0.35;
#endif
  if (under) { col *= 0.55; alpha = 0.55; }
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export function makeWaterMaterial(sky, kind = 'water') {
  const lach = kind === 'lachryma';
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uSky: { value: sky?.texture ?? null }, uSun: { value: new THREE.Vector3(0.35, 0.9, -0.25) },
    uAmp: { value: lach ? 0.05 : 0.035 }, uFreq: { value: lach ? 0.55 : 1.0 }, uSpeed: { value: lach ? 0.32 : 1.0 }, uMaxDepth: { value: 6 },
  }]);
  return new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG.replace('//SKYGLSL', sky?.GLSL ?? ''),
    defines: lach ? { LACHRYMA: 1 } : {}, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
  });
}

/** A plane over the volume, four vertices to the metre, each with the depth of the floor under it (0 at the edge, so the shore reads). */
export function waterGeometry(v) {
  const w = v.x1 - v.x0, d = v.z1 - v.z0, nx = Math.ceil(w * 4), nz = Math.ceil(d * 4);
  const g = new THREE.PlaneGeometry(w, d, nx, nz);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, depth = new Float32Array(pos.count), full = Math.max(0.2, v.surface - v.bottom);
  const cx = (v.x0 + v.x1) / 2, cz = (v.z0 + v.z1) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
    const edge = Math.min(x - v.x0, v.x1 - x, z - v.z0, v.z1 - z);      // (how far from the rim)
    const floor = v.depthAt ? v.depthAt(x, z) : full;
    depth[i] = Math.max(0, Math.min(floor, edge * 0.9));
  }
  g.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  return g;
}
