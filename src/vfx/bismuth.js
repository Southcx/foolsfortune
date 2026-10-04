// ---------------------------------------------------------------------------------------
// BISMUTH: how solid Lachryma looks. Condensed, it grows the way bismuth grows out of its own melt: a HOPPER crystal, its edges racing
// ahead of its faces, so each face is a stair of square terraces climbing in toward a sunken middle, and every terrace wears a thin
// oxide film that throws its own colour (gold, magenta, blue, green), so the steps of one cube never agree. Hard, jagged, metallic:
// never a rounded jelly.
//
// The shape is a few boxes merged (a base, then nested rims around nested sunken floors, and a spur off one corner): fewer triangles
// than the rounded box it replaces, and flat-shaded so each terrace is one colour. The film is walked by the face's own direction, so
// neighbouring steps flash different colours, and by a per-instance seed (`aSeed`), so no two cubes agree either.
//
// Prior art: the bismuth hopper crystal (grown in every school lab: stair-stepped square spirals, oxide iridescence from a few tens of
// nanometres of Bi2O3, thin-film interference), Minecraft's amethyst and Steven Universe's gems for the faceted, readable silhouette at
// a small size, and the oil-slick film already on the cubes (world/treasure/cubes.js oilMaterial: the same run of colours, harder).
//
//   const geo = hopperGeometry(size)          a hopper crystal about `size` across (centred, base at -size/2)
//   const { mat, uni } = bismuthMaterial({ env })   needs the geometry's `aSeed` instance attribute, like the oil
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A hopper crystal: a base, then square rims nested around sunken floors, stepping in; and a spur off one corner (a jag). */
export function hopperGeometry(size = 0.14) {
  const S = size, parts = [];
  const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); parts.push(g); };
  const rim = (outer, inner, h, y) => { // (a square ring: four bars)
    const t = (outer - inner) / 2, m = (outer + inner) / 4;
    box(outer, h, t, 0, y, m); box(outer, h, t, 0, y, -m); box(t, h, inner, m, y, 0); box(t, h, inner, -m, y, 0);
  };
  const base = S * 0.5;
  box(S, base, S, 0, -S / 2 + base / 2, 0);                                  // the body
  let y = -S / 2 + base, outer = S;
  for (const [k, h] of [[0.72, 0.28], [0.46, 0.22], [0.24, 0.16]]) {          // three terraces, each rim taller at the edge than its floor
    const inner = S * k;
    rim(outer, inner, S * h, y + (S * h) / 2);
    box(inner, S * h * 0.35, inner, 0, y + (S * h * 0.35) / 2, 0);            // the sunken floor inside it
    y += S * h * 0.35; outer = inner;
  }
  box(S * 0.42, S * 0.62, S * 0.42, S * 0.5, -S * 0.05, S * 0.42);           // a spur grown off one corner, standing proud of the top
  box(S * 0.3, S * 0.36, S * 0.3, -S * 0.56, -S * 0.2, -S * 0.36);           // and a smaller one off the other
  const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  geo.computeVertexNormals();
  return geo;
}

/** Bismuth: a dark silvery metal under an oxide film that changes colour face by face. One program for all of it. */
export function bismuthMaterial({ env = null, envIntensity = 0.32, uni = null } = {}) {
  uni = uni || { uFilm: { value: 1.25 }, uHue: { value: 0 } };
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x5e5468, metalness: 0.92, roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.12, flatShading: true,
    envMap: env, envMapIntensity: envIntensity, emissive: 0x2a1450, emissiveIntensity: 0.0,
  });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSeed;\nvarying float vSeed;\nvarying vec3 vObjN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeed = aSeed; vObjN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vSeed; varying vec3 vObjN; uniform float uFilm; uniform float uHue;
// bismuth's oxide: gold, magenta, blue, green and round again (thin-film interference, thickening as it goes)
vec3 oxide(float t) {
  t = fract(t) * 4.0;
  vec3 a = vec3(0.95, 0.75, 0.25), b = vec3(0.85, 0.20, 0.65), c = vec3(0.15, 0.40, 0.95), d = vec3(0.20, 0.85, 0.55);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t));
}`)
      // (the oxide colours the metal itself, so it colours what the metal reflects: rich and dark, never a glow over it; each face its own
      // film thickness, from its direction in the crystal, so neighbouring terraces disagree)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= mix(vec3(1.0), pow(oxide(dot(vObjN, vec3(0.37, 0.61, 0.23)) * 1.7 + vSeed + uHue), vec3(1.7)) * 2.4, clamp(uFilm, 0.0, 1.0)); // (raised to a power: saturated, as the real oxide is)`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ // (and a thin rim of the film at a glancing angle, a step on in the run)
  float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), fres = pow(1.0 - ndv, 3.0);
  totalEmissiveRadiance += oxide(dot(vObjN, vec3(0.37, 0.61, 0.23)) * 1.7 + vSeed + uHue + 0.35) * (0.04 + 0.45 * fres) * uFilm;
}`);
  };
  mat.customProgramCacheKey = () => 'bismuth';
  return { mat, uni };
}
