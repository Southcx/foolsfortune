// ---------------------------------------------------------------------------------------
// FROST AND BISQUE (S4 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a skin that GROWS over a body from where it was hit,
// a dissolve's mask run the other way (the front comes on instead of eating away). One shader, three skins, each a real thing as it
// really happens:
//
//   'bisque'   the Bisque shell (27): the body FIRED where it stands. The front is the kiln's heat, a band of red heat going to orange and
//              white at its leading edge; behind it the clay cools to bisque, the pale salmon of once-fired red earthenware (the first
//              firing, about 950 degrees, before any glaze), matte, its iron speckled through it. A terracotta statue for five seconds
//   'frost'    the cold: hoarfrost feathering out from the hit in fern-like fingers (dendrites: a crystal grows fastest at its tips),
//              thin and blue-grey at the front, thick white rime behind it, a few still glints in it (each fixed to its place on the body:
//              they turn with the eye, never twinkle on their own)
//   'craze'    Weather Away (56): the clay drying and crazing. A pale dry front, and behind it the crazing's net opening, its lines widening
//              and darkening as it shrinks, the surface lifting at the cells' edges
//
// It draws as a second skin over the body (the body's own geometry, pushed out a hair along its normals; on a skinned body bound to its
// own bones, so it moves with it): the copy's one mesh, the body's material untouched. Where the skin has not reached, it draws nothing.
// Lit by one sun and a sky (its own small light, as the effects are: `sun` sets which way), matte, smooth-shaded at 480 lines; every net
// fades to its mean under a few pixels.
//
// Prior art: Breath of the Wild's and God of War's freeze (frost creeping over a body from the hit), Ratchet & Clank's Morph-o-Ray and
// Up Your Arsenal's Freeze mod; dissolve shaders' noise-thresholded masks (Unity's and Unreal's material dissolve), here grown from a point;
// the kiln's colour temperature (red heat to white heat: the potter's cone and pyrometric colours), hoarfrost's dendrites, and crazing
// (the glaze and body shrinking unequally as they cool: what guan ware makes beautiful, the bisque shell makes fatal).
//
//   const F = create({ target, mode, origin, spread, k })   (target: a Mesh or SkinnedMesh; origin: the hit, in the world)
//   F.set({ grow (0..1, how far it has spread), mode, origin, k, sun })   F.update(dt)   F.dispose()
//   vfxLayer(game, handle, layer, color)   the effect library's `caster` layer: { shader: 'frostbisque', mode, spread (s) } on the
//                                          context's `target`, from its place
//   prewarm(scene) -> park()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ownUniforms, NOISE_GLSL, GROUND_Y } from './casterkit.js';

export const SKIN_MODES = ['bisque', 'frost', 'craze'];

const VERT = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
uniform float uInflate;
varying vec3 vO, vN, vW, vV;
void main() {
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vO = position; // (the place on the body, before any bone moved it: the front and the nets are fixed to the body)
  transformed += normalize(objectNormal) * uInflate;
  vec4 w = modelMatrix * vec4(transformed, 1.0), mv = viewMatrix * w;
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * objectNormal); vV = cameraPosition - w.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform float uK, uGrow, uMode, uTime, uScale, uReach;
uniform vec3 uOrigin, uSun, uSunCol, uSky;
varying vec3 vO, vN, vW, vV;
${NOISE_GLSL}
float cells(vec3 p) { // (F2 - F1 of a cell net: 0 on an edge)
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), o = vec3(hash3(i + g), hash3(i + g + 17.3), hash3(i + g + 41.9));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
float net(float e, float w, float px) { float aa = max(fwidth(e), 1e-5), lw = max(w, aa * 1.5); return mix(0.1, 1.0 - smoothstep(lw - aa, lw + aa, e), smoothstep(3.0, 6.0, px)); }
void main() {
  vec3 p = vO * uScale; // (in the body's own units, scaled to about a metre)
  float px = 1.0 / max(length(fwidth(p)), 1e-5);
  // the front: how far the skin has spread from the hit, raggedly (frost in fingers, the heat and the drying in a wavering line)
  float dist = distance(vO, uOrigin) * uScale;
  float rag = uMode > 0.5 && uMode < 1.5 ? (1.0 - abs(fbm3(p * 3.1))) * 0.55 + 0.25 * fbm3(p * 7.3) : 0.3 * fbm3(p * 2.3);
  float front = uGrow * uReach - (dist + rag * 0.6);
  if (front < 0.0) discard; // (not reached yet)
  float aa = max(fwidth(front), 1e-4), edge = smoothstep(0.0, aa * 1.5, front); // (the front, antialiased)
  vec3 N = normalize(vN), V = normalize(vV), L = normalize(uSun);
  float lam = max(dot(N, L), 0.0), hemi = 0.5 + 0.5 * N.y;
  vec3 col; float alpha = 1.0;
  if (uMode < 0.5) { // BISQUE: red heat at the front cooling to once-fired earthenware
    vec3 bisque = vec3(0.80, 0.45, 0.31) * (0.92 + 0.08 * fbm3(p * 9.0)); // (pale salmon terracotta)
    bisque *= 1.0 - 0.35 * smoothstep(0.55, 0.85, hash3(floor(p * 60.0))) * smoothstep(3.0, 6.0, px / 60.0); // (iron speckle, gone under a pixel)
    col = bisque * (uSunCol * lam * 0.85 + uSky * hemi * 0.45);
    float heat = exp(-front * 6.0); // (the band just behind the front)
    vec3 kiln = mix(vec3(0.9, 0.12, 0.02), mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.92, 0.7), smoothstep(0.55, 1.0, heat)), smoothstep(0.15, 0.6, heat));
    col += kiln * heat * 3.0;
  } else if (uMode < 1.5) { // FROST: thin blue-grey at the front, thick white rime behind, still glints
    float thick = smoothstep(0.0, 0.5, front);
    vec3 rime = mix(vec3(0.55, 0.68, 0.80), vec3(0.93, 0.96, 1.0), thick);
    float feather = 0.85 + 0.15 * fbm3(p * 14.0); // (the rime's grain, soft)
    col = rime * feather * (uSunCol * lam * 0.75 + uSky * hemi * 0.7) + vec3(0.35, 0.5, 0.65) * pow(1.0 - abs(dot(N, V)), 3.0) * 0.6;
    vec3 gp = floor(p * 22.0); float g = step(0.985, hash3(gp)) * smoothstep(3.0, 6.0, px / 22.0); // (a glint fixed to its place on the body)
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 24.0);
    col += vec3(1.0) * g * (0.4 + 3.0 * spec) * thick;
    alpha = mix(0.55, 1.0, thick); // (frost's first breath is thin: the body shows through)
  } else { // CRAZE: dried pale, the net opening and darkening behind the front
    float dry = smoothstep(0.0, 0.3, front), open = smoothstep(0.1, 1.2, front);
    vec3 clay = vec3(0.78, 0.66, 0.54) * (0.9 + 0.1 * fbm3(p * 6.0));
    float e = cells(p * 4.0), line = net(e, mix(0.01, 0.08, open), px / 4.0);
    float lift = smoothstep(0.0, 0.25, e) * open; // (each cell's middle lifts as it curls: its edge lies lower in shade)
    col = clay * (uSunCol * lam * (0.8 + 0.2 * lift) + uSky * hemi * 0.5);
    col = mix(col, vec3(0.12, 0.08, 0.06), line * open);
    alpha = dry;
  }
  gl_FragColor = vec4(col, alpha * edge * uK);
}`;

const MAT = {};
function material(skinned) {
  const key = skinned ? 'skinned' : 'rigid';
  return (MAT[key] ||= new THREE.ShaderMaterial({
    name: `caster-frostbisque${skinned ? '-skinned' : ''}`, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: true, fog: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    uniforms: { uK: { value: 1 }, uGrow: { value: 0 }, uMode: { value: 0 }, uTime: { value: 0 }, uScale: { value: 1 }, uReach: { value: 2 }, uInflate: { value: 0.004 }, uOrigin: { value: new THREE.Vector3() }, uSun: { value: new THREE.Vector3(0.4, 0.85, 0.35) }, uSunCol: { value: new THREE.Color(1.25, 1.12, 0.98) }, uSky: { value: new THREE.Color(0.55, 0.6, 0.72) } },
  }));
}

export class FrostBisque {
  constructor({ target, mode = 'bisque', origin = null, k = 1, grow = 0, sun = null } = {}) {
    if (!target?.geometry) throw new Error('frostbisque: a target mesh to grow over');
    this.target = target;
    const geo = target.geometry;
    geo.boundingSphere || geo.computeBoundingSphere();
    const R = Math.max(1e-3, geo.boundingSphere.radius);
    const skinned = !!target.isSkinnedMesh, mat = material(skinned);
    this.u = { uK: { value: k }, uGrow: { value: grow }, uMode: { value: Math.max(0, SKIN_MODES.indexOf(mode)) }, uTime: { value: 0 }, uScale: { value: 1 / R }, uReach: { value: 2.4 }, uInflate: { value: R * 0.008 }, uOrigin: { value: new THREE.Vector3() }, uSun: { value: new THREE.Vector3(0.4, 0.85, 0.35) }, uSunCol: { value: new THREE.Color(1.25, 1.12, 0.98) }, uSky: { value: new THREE.Color(0.55, 0.6, 0.72) } };
    this.object = skinned ? new THREE.SkinnedMesh(geo, mat) : new THREE.Mesh(geo, mat);
    if (skinned) this.object.bind(target.skeleton, target.bindMatrix);
    this.object.name = 'caster-frostbisque'; this.object.frustumCulled = false; this.object.renderOrder = 6; this.object.castShadow = false; this.object.userData.moodExempt = true;
    target.add(this.object); // (in the body's own frame: it moves, turns and bends with it)
    ownUniforms(this.object, mat, this.u);
    this.set({ origin: origin || target.getWorldPosition(new THREE.Vector3()), sun });
  }
  get k() { return this.u.uK.value; }
  set(p = {}) {
    const u = this.u;
    if (p.k !== undefined) u.uK.value = p.k;
    if (p.grow !== undefined) u.uGrow.value = THREE.MathUtils.clamp(p.grow, 0, 1);
    if (p.mode !== undefined) u.uMode.value = Math.max(0, SKIN_MODES.indexOf(p.mode));
    if (p.origin) { this.target.updateMatrixWorld(); this.target.worldToLocal(u.uOrigin.value.copy(p.origin)); } // (the hit, on the body: in the bind pose for a skinned one, near enough)
    if (p.sun) { if (p.sun.isDirectionalLight) u.uSun.value.subVectors(p.sun.position, p.sun.target.position).normalize(); else u.uSun.value.copy(p.sun).normalize(); }
    return this;
  }
  update(dt) { this.u.uTime.value = (this.u.uTime.value + dt) % 600; this.object.visible = this.u.uK.value > 0.002 && this.u.uGrow.value > 0; }
  dispose() { this.object.parent?.remove(this.object); this.object.onBeforeRender = () => {}; }
}
export const create = (opts) => new FrostBisque(opts);

/** The effect library's layer (vfx/vfx.js `caster`): over the context's `target` from the effect's place, spreading over `spread` real
 *  seconds, held as long as the effect lives, then fading by its `k`. Nothing without a target. */
export function vfxLayer(game, h, L) {
  const target = h.ctx.target?.isMesh ? h.ctx.target : null;
  if (!target) return null;
  const F = new FrostBisque({ target, mode: L.mode ?? 'bisque', origin: h.pos, k: 0, sun: game.sun });
  const spread = L.spread ?? 1.2;
  return {
    group: F.object, effect: F,
    frame(h, t, k, raw) { F.set({ k, grow: 1 - Math.pow(1 - Math.min(1, h.t / spread), 2) }); F.update(raw); },
    dispose: () => F.dispose(),
  };
}

export function prewarm(scene) {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  body.position.set(0, GROUND_Y, 0); scene.add(body);
  const F = new FrostBisque({ target: body, grow: 0.5 }); F.update(0);
  return () => { F.dispose(); body.parent?.remove(body); body.geometry.dispose(); };
}
