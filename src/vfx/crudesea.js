// ---------------------------------------------------------------------------------------
// THE CRUDE SEA: the surface of the Emocean where the ships sail (docs/plans/SLICE.md, E4; docs/GLOSSARY.md: crude, the Emocean). Crude is
// liquid Lachryma, fossil feeling (docs/LORE.md): so the sea is Lachryma's liquid state as the art bible has it (docs/ART.md, section 3),
// near-black with the oil film's sheen, heavy and slow, never water-blue.
//
//   THE SWELLS  real movement (CLAUDE.md: motion from things actually moving): four Gerstner waves displace the surface in the vertex
//               shader, long and low as oil moves, and the same sum is on the CPU (`heightAt`) so a ship rides exactly what is drawn
//   THE CURRENT a slow scrolled pattern of darker and lighter streaks along the current's way: the honest way to show a sheet of oil
//               drifting (CLAUDE.md allows a scrolled texture where it is that)
//   THE FILM    the oil film's colours where the surface turns from the eye (a fresnel, low in frequency, so it rolls with the swells and
//               never shimmers); stronger in the calm
//   THE LIQUID  close up, the shared liquid library (vfx/liquid.js): the owner's marbling crossing itself as the surface's slopes, and the
//               oil film in its cells and veins (the Well's own look); far off, the current's bands
//   THE CALM    `calm` (0..1) lays the swells down and lets the film bloom: the stage's breather (0.50 to 0.62 of it) is the sea's and the
//               sky's to carry
// The grid follows the camera in whole cells, and the waves are in the world's own space, so nothing swims under the eye; the swells'
// height fades with distance before the grid's cells could alias them.
//
// Prior art: Tessendorf and the Gerstner wave sum of every game ocean since (GPU Gems 1, ch. 1: "Effective Water Simulation from
// Physical Models"), Wind Waker's sea (cel bands, a few big shapes, a horizon that holds), the oil-slick thin-film colours already on
// Lachryma (world/treasure/cubes.js oilMaterial), and Sunless Sea's black zee for the mood of a dark, sentient ocean.
//
//   const sea = new CrudeSea({ env })   scene.add(sea.mesh)   sea.update(t, camera.position)   sea.set({ calm, swell, film, current })
//   (swell 0.38 by default: about a metre and a half crest to trough, a sloop's sea)
//   sea.heightAt(x, z, t) -> y   (for a ship: its bob and its pitch)   sea.dispose()
//   sea.lift (metres: the drawn surface raised over the fight, the Umbral form's)   sea.surfaceAt(x, z, t) -> y (the drawn surface)
//   new CrudeSea({ geometry, y })   a surface of its own shape, laid in world xz (a shore's sector): it does not follow the eye
//   sea.clipSector({ center, angle, half, r0 })   only the sector of a shore is sea (the shore, vfx/shore.js): elsewhere it is not drawn
//   sea.under(on)   the eye is under the surface (vfx/umbral.js asks): the same mesh, its winding turned to face down, drawn as THE
//                   MENISCUS (a dark mirror of the deep past the critical angle, Snell's window of the air above inside it, the film's
//                   light leaking through); no second mesh, no second program
//   sea.silhouettes([{ obj, r, len }])   the bellies of things floating above, as soft shadows on the meniscus (up to six)
// It bends with the storm (vfx/stormwarp.js warpMaterial): the sea is the storm's first canvas.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { liquidUniforms, LIQUID_GLSL } from './liquid.js';
import { warpMaterial } from './stormwarp.js';

const _s = new THREE.Vector3();

const N = 4;
// the waves: direction (radians), wavelength (m), steepness, speed scale (long, low swells, a cross-sea, and a short chop on top)
const WAVES = [[0.2, 38, 0.32, 1], [1.1, 23, 0.26, 1], [-0.7, 14, 0.18, 1.1], [2.4, 7, 0.12, 1.2]];
const G = 9.8;

export class CrudeSea {
  constructor({ env = null, size = 900, cells = 180, y = 0, geometry = null } = {}) {
    this.y = y; this.lift = 0; this.cell = size / cells; this.t = 0; this.fixed = !!geometry; // (a geometry of its own, laid in world xz: it stays put; lift: the Umbral form's, below)
    this.k = { calm: 0, swell: 0.38, film: 1, current: new THREE.Vector2(1, 0.25).normalize() };
    let geo = geometry;
    if (!geo) { geo = new THREE.PlaneGeometry(size, size, cells, cells); geo.rotateX(-Math.PI / 2); }
    const u = this.u = {
      uT: { value: 0 }, uAmp: { value: 0.38 }, uFilm: { value: 1 }, uCalm: { value: 0 },
      uCur: { value: this.k.current.clone() },
      ...liquidUniforms(),
      uClip: { value: new THREE.Vector4(0, 0, 0, -1) }, uClipA: { value: new THREE.Vector2(0, 7) }, // (center xz, r0, on; angle, half)
      uUnder: { value: 0 }, uAbove: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) }, // (the meniscus: on; the floating things' bellies, x z r half-length)
      uDeepC: { value: new THREE.Color(0x140a22) }, uLight: { value: new THREE.Color(1.0, 0.9, 0.7) }, // (the deep's colour, the storm's light above)
      uW: { value: WAVES.map(([a, L, q, s]) => new THREE.Vector4(Math.cos(a), Math.sin(a), (2 * Math.PI) / L, q)) },
      uC: { value: WAVES.map(([, L, , s]) => Math.sqrt(G * ((2 * Math.PI) / L)) * s * 0.55) }, // (dispersion: long waves travel faster; slowed, it is oil)
    };
    const m = this.mat = new THREE.MeshStandardMaterial({ name: 'crude-sea', color: 0x07050b, roughness: 0.5, metalness: 0.12, envMap: env, envMapIntensity: 0.35 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
uniform float uT, uAmp, uCalm; uniform vec4 uW[${N}]; uniform float uC[${N}]; varying vec3 vSeaW; varying float vSeaH;
vec3 seaGerstner(vec2 p, out vec3 n) {
  vec3 d = vec3(0.0); vec3 nn = vec3(0.0, 1.0, 0.0);
  float amp = uAmp * (1.0 - 0.85 * uCalm);
  for (int i = 0; i < ${N}; i++) {
    vec2 D = uW[i].xy; float k = uW[i].z, q = uW[i].w, A = q / k * amp;
    float f = k * dot(D, p) - uC[i] * uT; float c = cos(f), s = sin(f);
    d += vec3(D.x * A * c * q, A * s, D.y * A * c * q);
    nn += vec3(-D.x * k * A * c, -q * k * A * s, -D.y * k * A * c);
  }
  n = normalize(nn); return d;
}`)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
vec3 seaN; vec4 seaWp = modelMatrix * vec4(position, 1.0);
float seaFar = 1.0 - smoothstep(140.0, 380.0, length(seaWp.xz - cameraPosition.xz)); // (the swells lie down before the cells could alias them)
vec3 seaD = seaGerstner(seaWp.xz, seaN) * seaFar;
objectNormal = normalize(mix(vec3(0.0, 1.0, 0.0), seaN, seaFar));`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
transformed += seaD; vSeaW = seaWp.xyz + seaD; vSeaH = seaD.y;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uT, uFilm, uCalm, uUnder; uniform vec2 uCur; uniform vec4 uClip; uniform vec2 uClipA; uniform vec4 uAbove[6]; uniform vec3 uDeepC, uLight; varying vec3 vSeaW; varying float vSeaH;
float seaHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float seaNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(seaHash(i), seaHash(i + vec2(1, 0)), f.x), mix(seaHash(i + vec2(0, 1)), seaHash(i + vec2(1, 1)), f.x), f.y); }
vec3 seaFilm(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
${LIQUID_GLSL}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
if (uClip.w > 0.0) { vec2 cd = vSeaW.xz - uClip.xy; float ca = atan(cd.y, cd.x) - uClipA.x; ca = abs(atan(sin(ca), cos(ca)));
  if (ca > uClipA.y || length(cd) < uClip.z) discard; } // (a shore's sea: its sector only, from the sand out)
// the current: streaks drawn along the drift, scrolled (two scales, so it never reads as one repeating sheet)
vec2 seaC = vec2(dot(vSeaW.xz, uCur), dot(vSeaW.xz, vec2(-uCur.y, uCur.x)));
float seaStreak = seaNoise(vec2(seaC.x * 0.025 - uT * 0.05, seaC.y * 0.1)) * 0.6 + seaNoise(vec2(seaC.x * 0.06 - uT * 0.11, seaC.y * 0.24)) * 0.4; // (streaks four times as long as wide: elongated more, they ran to the horizon as spokes)
diffuseColor.rgb *= 0.7 + 0.6 * seaStreak;
diffuseColor.rgb += vec3(0.05, 0.03, 0.02) * smoothstep(0.2, 1.2, vSeaH); // (the crests a shade warmer: crude is amber where it is thin)`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
// the liquid's own slopes on the swell (vfx/liquid.js: the owner's marbling, two layers crossing, slow as crude is), close up only
float seaNear = 1.0 - smoothstep(30.0, 160.0, length(vSeaW.xz - cameraPosition.xz));
{ vec3 pn = liqNormal(vSeaW.xz, 0.045, uT * 0.4, 1.3 * seaNear); normal = normalize(normal + (viewMatrix * vec4(pn.x, 0.0, pn.z, 0.0)).xyz); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 V = normalize(vViewPosition); float fres = pow(1.0 - clamp(abs(dot(normalize(normal), V)), 0.0, 1.0), 3.0);
  // the oil film: in the current's bands far off, and close up in the marbling's cells and veins (the Well's own look)
  float cells = liqHeight(vSeaW.xz, 0.045, uT * 0.4), veins = liqTap(vSeaW.xz * 0.045 + vec2(uT * 0.4 * 0.021, uT * 0.4 * 0.013)).a;
  float band = smoothstep(0.42, 0.78, seaStreak), vein = pow(veins, 1.8) * seaNear;
  float film = (0.2 + 0.8 * fres) * uFilm * (0.4 + 0.6 * uCalm) * max(band, vein);
  totalEmissiveRadiance += seaFilm(0.15 + fres * 0.6 + seaStreak * 0.3 + cells * 0.8 + vSeaH * 0.1) * film * 0.12; }`)
        .replace('#include <opaque_fragment>', `#include <opaque_fragment>
if (uUnder > 0.5) { // THE MENISCUS: the surface seen from below (its winding turned: vfx/umbral.js)
  vec3 Vv = normalize(vViewPosition), Nu = normalize(normal), I = -Vv;
  float cosI = clamp(dot(I, Nu), 0.0, 1.0);
  float win = smoothstep(0.6, 0.74, cosI); // (Snell's window: within ~48 degrees of straight up the air shows; past it, a mirror of the deep)
  vec3 Rt = refract(I, -Nu, 1.33), wd = inverseTransformDirection(dot(Rt, Rt) > 0.0 ? Rt : I, viewMatrix);
  vec3 air = uLight * (0.55 + 0.45 * smoothstep(0.0, 0.9, wd.y));
  #ifdef ENVMAP_TYPE_CUBE_UV
    air = mix(air, textureCubeUV(envMap, envMapRotation * wd, 0.3).rgb * 1.5, 0.55);
  #endif
  float shade = 1.0; // (what floats above: its belly a soft dark on the light)
  for (int i = 0; i < 6; i++) { vec4 a = uAbove[i]; if (a.z <= 0.0) continue; vec2 q = vSeaW.xz - a.xy; q.y = max(abs(q.y) - a.w, 0.0); shade *= 1.0 - 0.8 * exp(-dot(q, q) / (a.z * a.z)); }
  float cl = liqHeight(vSeaW.xz, 0.045, uT * 0.4);
  vec3 leak = seaFilm(0.2 + cl * 0.8 + seaStreak * 0.3 + vSeaH * 0.1) * (0.03 + 0.09 * smoothstep(0.42, 0.78, seaStreak)) + uLight * 0.06 * smoothstep(0.35, 1.0, seaStreak);
  vec3 mirror = uDeepC * (0.7 + 0.6 * seaStreak);
  gl_FragColor.rgb = mix(mirror + leak * shade, air * shade * (0.75 + 0.5 * seaStreak), win);
}`);
    };
    m.customProgramCacheKey = () => 'crude-sea-4';
    warpMaterial(m); // (the storm bends the sea: vfx/stormwarp.js; its key carries this one)
    this.mesh = new THREE.Mesh(geo, m);
    this.mesh.position.y = y; this.mesh.frustumCulled = false; this.mesh.receiveShadow = true;
  }

  /** Calm (0..1: the breather), swell (a multiplier), film (the sheen's strength), current (a direction in the xz plane). */
  set({ calm, swell, film, current } = {}) {
    if (calm !== undefined) this.k.calm = calm;
    if (swell !== undefined) this.k.swell = swell;
    if (film !== undefined) this.k.film = film;
    if (current) this.k.current.copy(current).normalize();
    this.u.uCalm.value = this.k.calm; this.u.uAmp.value = this.k.swell; this.u.uFilm.value = this.k.film; this.u.uCur.value.copy(this.k.current);
  }

  /** The eye is under the surface (or back above it): the winding turned to face it, and the meniscus's look on. */
  under(on) {
    const g = this.mesh.geometry;
    if (on && !this.idxDown && g.index) { const a = g.index.array, b = new a.constructor(a.length); for (let i = 0; i < a.length; i += 3) { b[i] = a[i]; b[i + 1] = a[i + 2]; b[i + 2] = a[i + 1]; } this.idxUp = g.index; this.idxDown = new THREE.BufferAttribute(b, 1); }
    if (this.idxDown) g.setIndex(on ? this.idxDown : this.idxUp);
    this.u.uUnder.value = on ? 1 : 0;
  }

  /** The bellies of things above, as soft shadows on the meniscus: [{ obj, r, len }] (a capsule along the rail, about the thing's place). */
  silhouettes(list = []) {
    const A = this.u.uAbove.value;
    for (let i = 0; i < 6; i++) { const h = list[i], o = h?.obj; if (o && o.visible !== false) { o.getWorldPosition(_s); A[i].set(_s.x, _s.z, h.r || 3, h.len || 0); } else A[i].set(0, 0, 0, 0); }
  }

  /** Only a shore's sector is sea: the bearing within `half` of `angle` from `center` (xz), and further out than `r0`. */
  clipSector({ center, angle = 0, half = Math.PI, r0 = 0 }) { this.u.uClip.value.set(center.x, center.z, r0, 1); this.u.uClipA.value.set(angle, half); }

  /** Per frame: the time, and the grid kept under the camera in whole cells (the waves are the world's: nothing swims). */
  update(t, camPos) {
    this.t = t; this.u.uT.value = t;
    if (camPos && !this.fixed) this.mesh.position.set(Math.round(camPos.x / this.cell) * this.cell, this.y + this.lift, Math.round(camPos.z / this.cell) * this.cell);
  }

  /** Where the surface is DRAWN at a point: the height the logic rides (`heightAt`) plus the lift, the drawn surface raised over the
   *  fight while the ship is in the Umbral form (vfx/crossinglook.js), so the eye and the ship are under it with nothing in the fight
   *  moved. What asks where the eye is against the surface (the meniscus, the splash, the caustics: vfx/umbral.js) asks here. */
  surfaceAt(x, z, t = this.t) { return this.heightAt(x, z, t) + this.lift; }

  /** The surface's height at a point (the same sum as the shader's, near the eye): what a ship rides. */
  heightAt(x, z, t = this.t) {
    const amp = this.k.swell * (1 - 0.85 * this.k.calm);
    let y = 0;
    for (let i = 0; i < N; i++) {
      const [a, L, q] = WAVES[i], k = (2 * Math.PI) / L, A = (q / k) * amp, c = this.u.uC.value[i];
      y += A * Math.sin(k * (Math.cos(a) * x + Math.sin(a) * z) - c * t);
    }
    return this.y + y;
  }

  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
