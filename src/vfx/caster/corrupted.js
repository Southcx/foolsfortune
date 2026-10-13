// ---------------------------------------------------------------------------------------
// THE CORRUPTED BODY (caster shader S10): the glitch (vfx/glitch.js) brought off the screen and onto one mesh, for shell 97 Corrupt
// (.hack's data drain: docs/plans/CASTER-SHELLS.md). The creature hit is drawn as broken data while its body and mind are scrambled,
// then deleted: its polygons torn apart in blocks of space, each block shoved its own way and the next a moment later; bands of it
// slid sideways as a torn signal's rows are; runs of it crushed to a few levels of colour leaning to the code's cyan or magenta,
// with a scanline through them; a wire of the code's cyan along the blocks' seams (Rez's data-space); its edges split red from blue;
// and at the end DRAIN pulls the blocks into a point (the bracelet's), and DROP takes the colour out. The same parts as the screen's
// glitch, by the same names, so a corrupted body and a torn screen read as one thing.
//
// It is a material put on the target's meshes (a skinned one too), their own materials given back on dispose; it keeps each mesh's
// colour and texture, so the body is still itself under the damage. No draw call beyond the meshes' own; one shared material (each
// body's numbers set as it is drawn).
//
// Comfort (glitch.js's terms, the WCAG 2.3.1 line): it steps, it does not glide, at 6 to 10 steps a real second, and it is always a
// pulse with an end (the shell's six seconds), never ambient. The setting `visual.glitch` off turns it down: the tear and the crush
// to a quarter, the stepping to once a real second, the drop-out gone. Its wire is drawn to its screen width (fwidth): no crawl.
//
// Prior art: .hack//Infection's Data Drain (CyberConnect2, 2002: the target broken into flickering blocks and pulled into the
// bracelet), the PS1's wobbling vertices (a position snapped to a grid), Rez's wireframe data-space, and vfx/glitch.js's own parts.
//
//   const c = create(game, { target, tear, crush, drain, drop, cell, at })   target: an Object3D whose meshes it wears; none: a stand-in
//   c.group (place it)   c.set({ tear, crush, drain, drop, cell })   c.at (Vector3: where DRAIN pulls to)   c.k = 0..1   c.update(dt)   c.dispose()
//   prewarm(game) -> park   (the boot's warm-up: its programs compiled, then park() takes the stand-ins away)
//   layer(game, L, ctx)   the effect library's `caster` layer (vfx/vfx.js): `{ type: 'caster', shader: 'corrupted' }`; ctx.target wears it
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';

const VERT = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
#include <uv_pars_vertex>
uniform float uSeed, uTear, uDrain, uCell; uniform vec3 uSide, uAt;
varying vec3 vW, vN; varying float vBand, vTorn;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main() {
  #include <uv_vertex>
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 w = modelMatrix * vec4(transformed, 1.0);
  // TEAR: the body in blocks of space, each block shoved its own way (only some, by the seed); and bands of rows slid sideways
  vec3 cell = floor(w.xyz / uCell);
  float hc = h3(cell + uSeed * 0.37), torn = step(1.0 - uTear * 0.5, hc);
  vec3 shove = (vec3(h3(cell + 1.3), h3(cell + 7.1), h3(cell + 3.9)) - 0.5) * uCell * 1.4;
  float band = floor(w.y / (uCell * 0.6)), hb = h1(vec2(band, floor(uSeed)));
  w.xyz += shove * torn * uTear + uSide * step(1.0 - uTear * 0.4, hb) * (hb - 0.5) * uTear * uCell * 2.2;
  // DRAIN: the blocks pulled toward the point, the near ones first, each at its own pace
  w.xyz = mix(w.xyz, uAt, clamp(uDrain * (0.55 + 0.9 * hc) - 0.1 * length(w.xyz - uAt) * (1.0 - uDrain), 0.0, 1.0));
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * objectNormal); vBand = band; vTorn = torn;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = /* glsl */`
#include <uv_pars_fragment>
uniform vec3 uColor, uLight; uniform sampler2D uMap; uniform bool uHasMap; uniform float uSeed, uCrush, uDrop, uCell, uK, uTear;
varying vec3 vW, vN; varying float vBand, vTorn;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 base = uColor;
  #ifdef USE_UV
  if (uHasMap) base *= texture2D(uMap, vUv).rgb;
  #endif
  vec3 n = normalize(vN), v = normalize(cameraPosition - vW); if (!gl_FrontFacing) n = -n;
  vec3 col = base * (0.32 + 0.68 * max(dot(n, normalize(uLight)), 0.0));
  // SPLIT: the edges seen side-on split red one way and blue the other (by band, as the tear goes)
  float rim = pow(1.0 - abs(dot(n, v)), 2.5), side = step(0.5, h1(vec2(vBand, floor(uSeed))));
  col += rim * mix(vec3(1.1, 0.15, 0.6), vec3(0.15, 0.9, 1.1), side) * (0.4 + 0.8 * uTear);
  // CRUSH: runs along the bands crushed to a few levels, leaning to the code's cyan or magenta, a scanline through them
  vec2 px = gl_FragCoord.xy, run = vec2(floor(px.x / (12.0 * (2.0 + floor(4.0 * h1(vec2(vBand, uSeed)))))), floor(px.y / 9.0));
  if (h1(run * 1.7 + floor(uSeed)) < uCrush * (0.25 + 0.6 * vTorn)) {
    float L = max(col.r, max(col.g, col.b)) + 1e-3;
    col = floor(col / L * 4.0 + 0.5) / 4.0 * L * mix(vec3(0.35, 1.25, 1.2), vec3(1.25, 0.35, 1.15), step(0.5, h1(run + 9.0)));
    col *= 0.7 + 0.3 * step(0.5, fract(px.y * 0.5));
  }
  // the wire: the code's cyan along the blocks' seams, drawn to its screen width
  vec3 g = abs(fract(vW / uCell + 0.5) - 0.5) / max(fwidth(vW / uCell), vec3(1e-4));
  float wire = 1.0 - smoothstep(0.0, 1.2, min(g.x, min(g.y, g.z)));
  col += vec3(0.2, 0.95, 1.0) * wire * uCrush * 0.9;
  // DROP: the colour drains and dims
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(l * 0.12), uDrop);
  gl_FragColor = vec4(col, 1.0);
}`;

let MAT = null, WHITE = null; // (one material for every corrupted body: each one's numbers set as it is drawn)
function material() {
  if (MAT) return MAT;
  WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); WHITE.needsUpdate = true;
  const u = { uColor: { value: new THREE.Color() }, uLight: { value: new THREE.Vector3(0.4, 0.8, 0.35) }, uMap: { value: WHITE }, uHasMap: { value: false },
    uSeed: { value: 0 }, uTear: { value: 0 }, uCrush: { value: 0 }, uDrain: { value: 0 }, uDrop: { value: 0 }, uCell: { value: 0.18 }, uK: { value: 1 },
    uSide: { value: new THREE.Vector3(1, 0, 0) }, uAt: { value: new THREE.Vector3() } };
  // (its shadow cast as a front-faced body casts it, `shadowSide` BackSide: the sun's depth program the slip jelly already uses, warm
  // at boot; left DoubleSide, the shadow pass wanted a double-sided depth program nothing else draws, compiled late at the first strike)
  MAT = new THREE.ShaderMaterial({ name: 'caster-corrupted', vertexShader: VERT, fragmentShader: FRAG, uniforms: u, side: THREE.DoubleSide, shadowSide: THREE.BackSide, fog: false });
  MAT.defines = { USE_UV: '' }; // (the mesh's own texture read through the uv chunks)
  return MAT;
}

export const CORRUPTED_DEFAULTS = { tear: 0.6, crush: 0.6, drain: 0, drop: 0, cell: 0.18 };
const _side = new THREE.Vector3();

export class Corrupted {
  constructor(game, o = {}) {
    this.game = game; this.k = o.k ?? 1; this.seed = 0; this.seedT = 0;
    this.p = { ...CORRUPTED_DEFAULTS };
    this.set(o);
    this.at = (o.at || new THREE.Vector3()).clone();
    this.group = new THREE.Group(); this.group.name = 'caster-corrupted';
    this.worn = [];
    const wear = (mesh) => {
      const m0 = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material, color = (m0?.color || new THREE.Color(0xb08a70)).clone(), map = m0?.map || null, was = mesh.onBeforeRender;
      mesh.onBeforeRender = (r, s, cam, geo, mat) => {
        const U = mat.uniforms; if (!U?.uCrush) return was?.call(mesh, r, s, cam, geo, mat);
        const down = T.visual.glitch === false ? 0.25 : 1, k = this.k;
        U.uColor.value.copy(color); U.uMap.value = map || WHITE; U.uHasMap.value = !!map && !!geo.attributes.uv;
        U.uSeed.value = this.seed; U.uTear.value = this.p.tear * k * down; U.uCrush.value = this.p.crush * k * down; U.uDrain.value = this.p.drain;
        U.uDrop.value = T.visual.glitch === false ? 0 : this.p.drop; U.uCell.value = this.p.cell; U.uAt.value.copy(this.at);
        U.uSide.value.copy(_side.setFromMatrixColumn(cam.matrixWorld, 0));
        mat.uniformsNeedUpdate = true;
      };
      this.worn.push({ mesh, mat: mesh.material, was });
      mesh.material = material();
    };
    if (o.target) o.target.traverse((m) => { if (m.isMesh) wear(m); });
    else { // (a stand-in: a clay body to corrupt)
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 3), new THREE.MeshStandardMaterial({ color: 0x9a7348 }));
      m.position.y = 0.6; this.stand = m; this.group.add(m); wear(m);
    }
    if (o.pos) this.group.position.copy(o.pos);
    if (!o.target) (o.parent || game.scene)?.add(this.group);
  }
  set(o = {}) { for (const k of Object.keys(CORRUPTED_DEFAULTS)) if (o[k] !== undefined) this.p[k] = o[k]; return this; }
  /** The seed steps 6 to 10 times a real second (glitch.js's stutter), once a second with the setting off. */
  update(dt) {
    if ((this.seedT -= dt) <= 0) { this.seed = (this.seed + 1 + Math.floor(Math.random() * 7)) % 997; this.seedT = T.visual.glitch === false ? 1 : 0.1 + Math.random() * 0.067; }
  }
  dispose() {
    for (const w of this.worn) { w.mesh.material = w.mat; w.mesh.onBeforeRender = w.was || (() => {}); }
    this.worn = [];
    if (this.stand) { this.stand.geometry.dispose(); this.stand.material.dispose?.(); }
    this.group.parent?.remove(this.group);
  }
}

/** A plane and a one-bone skinned plane wearing `mat`, parked under the world for the warm-up's compile (both programs: a body and a
 *  skinned body), and the function that takes them away again (the material stays: its programs live while it does). */
function parkPair(game, mat) {
  const g = () => new THREE.PlaneGeometry(0.1, 0.1), sg = g(), n = sg.attributes.position.count;
  sg.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4), 4));
  sg.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Float32Array.from({ length: n * 4 }, (_, i) => (i % 4 ? 0 : 1)), 4));
  const bone = new THREE.Bone(), sk = new THREE.SkinnedMesh(sg, mat); sk.add(bone); sk.bind(new THREE.Skeleton([bone]));
  const parts = [new THREE.Mesh(g(), mat), sk];
  for (const o of parts) { o.position.set(0, -50, 0); o.frustumCulled = false; o.userData.zoneFree = true; game.scene.add(o); }
  return () => { for (const o of parts) { o.parent?.remove(o); o.geometry.dispose(); } };
}

/** The boot's warm-up (main.js): the corrupted body's two programs compiled with the rest, never in play. */
export function prewarm(game) { return parkPair(game, material()); }

export const create = (game, opts) => new Corrupted(game, opts);

/** The effect library's `caster` layer: the effect's `ctx.target` corrupted for the effect's life (or a stand-in at its place);
 *  DRAIN rises over its last third toward `ctx.at` (the bracelet's point) or the place it was played. */
export function layer(game, L, ctx = {}) {
  const c = new Corrupted(game, { ...L, k: 0, target: ctx.target, at: ctx.at || ctx.pos });
  if (ctx.target) game.scene?.add(c.group);
  let age = 0; const dur = Math.max(0.1, L.dur || 6);
  return { group: c.group, u: { uTint: { value: new THREE.Color() } }, set: (k) => { c.k = Math.max(0, k); },
    update: (raw) => { age += raw; const u = age / dur; c.p.drain = L.drain ?? Math.max(0, (u - 0.66) / 0.34) ** 2; c.update(raw); }, dispose: () => c.dispose() };
}
