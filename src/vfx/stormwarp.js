// ---------------------------------------------------------------------------------------
// THE STORM WARP: the crossing caught in a psychic storm (the owner, 2026-10-08: "have the scene and environment bend and distort with
// shaders like you're caught in a psychic storm"; docs/plans/RAIL-OVERHAUL.md section 5, research/RAIL-PATTERNS.md section 5). The
// storm bends the world, never the danger: the crude sea, the sky and its clouds, the ambient geometry and the big objects opt in
// (`warpMaterial`); the shots, the hurtbox, the ship, the reticles and the HUD never do, so a player reads them true.
//
//   THE BEND    in the vertex shader, after the projection, on the clip position (so one function serves a standard material and the
//               sky's own ShaderMaterials alike): the world ahead DROOPS away with distance (curved near, an even lean past ~90 m, so
//               the far sea never folds back), SWAYS by an angle (the same size on the screen near and far; its phase is the screen's
//               own place and the log of the depth, so the horizon never crowds a wave into a few pixels), and WHORLS about the view's
//               axis, the far world turned against the near (the sea folding into a tube, at the top of the storm). Nothing within
//               5 m moves; all of it grows to its full size by 60 m. Only x and y of the clip position change, so the depth is the
//               depth: no fighting, no hole in the shadow. The shadow map is drawn from the unbent world and every receiver looks its
//               shadow up by its unbent world place, so caster and receiver agree without a bent depth material.
//   THE VEIL    the screen's part, drawn in the glitch's own pass (vfx/glitch.js `veil`: one program for both): the frame sampled at
//               UVs displaced by scrolling low-frequency noise (a heat haze, slowed to a storm's), masked toward the middle (where the
//               ship flies) and away from anything marked `keepTrue` (the danger writes 0 to the frame's alpha: the veil neither moves
//               it nor smears it into its neighbours); a chromatic split growing to the edges; a gold-white light at the edges.
//   STRENGTH    one number, 0..1, from one call: the leg's STORM, the waypoint's WEATHER (a strong mood adds a little even in a calm
//               leg) and the Courier's MENTAL STATE (Prismatic warps the most, Stoic the least: courier/mind.js), eased over a real
//               second, scaled by the setting `visual.warp` (0..1). Outside the rail's zone it falls to nothing (render/zonemap.js),
//               unless `anywhere` (a workbench stage).
// Low frequency only (CLAUDE.md: no aliasing crawl): the slowest drift a real second can carry, measured as frame-to-frame change.
//
// Prior art: the curved worlds of Animal Crossing and Subway Surfers (vertices bent in view space by distance), Inception's folded
// street, Rez's Area 5 and Child of Eden's warped tunnels, Codrops' "Animated Heat Distortion Effects with WebGL" (Lucas Bebber, 2016:
// the frame sampled through scrolling noise, masked), a lens's lateral chromatic aberration (red and blue apart, worst at the edges).
//
//   game.stormWarp = new StormWarp(game)   .set({ storm, weather, mind, anywhere })   .update(rawDt, camera) (each frame)   .k (applied)
//   .quiet()                     every shared uniform and the veil at nothing (the workbench opening: its stages set their own)
//   warpMaterial(mat)            a material of the environment bends (and takes the Umbral's caustics: vfx/umbral.js): build time, before the warm-up
//   deepMaterial(mat)            the same program, never bent: the caustics only (the ship, a foe)
//   warpObject(root, { shader })  a big object: SEATED by default (drawn as one rigid thing where the storm draws the world at its place,
//                                by at most STORM.seat metres, so its parts stay on their hurtboxes; no new program), or every
//                                material bent (`shader: true`: curved like the sea, programs counted)
//   keepTrue(mat)                the danger: the veil leaves it where it is drawn (its blend writes 0 to the frame's alpha; free on a
//                                transparent material, the shots' and the reticles' kind; an opaque one only with `opaque: true`, a program)
//   .bend(worldPos, camera, out), bendPoint(...)   where a point of the environment is DRAWN now (anchor a muzzle or a burst to what is seen)
//   weather: a number 0..1, or { aspect, strength } (progress/weather.js weatherAt); mind: -2..2, a state name, or omitted (the Courier's)
//   STORM_U, STORM_GLSL   the bend's shared uniforms and chunk;   DEEP_U, DEEP_GLSL   the Umbral's caustics (vfx/umbral.js writes DEEP_U)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { zoneOf } from '../render/zonemap.js';
import { STATES } from '../progress/combat/mind.js';
import { COLOR } from '../progress/weather.js';

/** THE UMBRAL'S CAUSTICS (vfx/umbral.js): the net of light the surface throws down onto anything under it, put into every standard
 *  material that comes through here: two slow Voronoi webs crossing (the threads F2 - F1), strongest just under the surface, gone by
 *  ~12 m down and beyond 45 m from the eye. Their uniforms are shared by every material dressed with them; the Umbral writes them. */
export const DEEP_U = { uDeepOn: { value: 0 }, uDeepY: { value: 0 }, uDeepT: { value: 0 }, uDeepLight: { value: new THREE.Color(1.0, 0.82, 0.55) } };
export const DEEP_GLSL = /* glsl */`
uniform float uDeepOn, uDeepY, uDeepT; uniform vec3 uDeepLight;
vec2 deepH2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float deepNet(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p); float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = 0.5 + 0.42 * sin(t + 6.2831 * deepH2(i + g));
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return 1.0 - smoothstep(0.02, 0.24, f2 - f1);
}
vec3 deepCaustics(vec3 w, vec3 nV) {
  if (uDeepOn <= 0.001) return vec3(0.0);
  float depth = uDeepY - w.y, under = smoothstep(-0.3, 0.5, depth);
  float up = 0.3 + 0.7 * clamp(dot(nV, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)), 0.0, 1.0);
  float near = 1.0 - smoothstep(20.0, 45.0, distance(w, cameraPosition));
  float c = deepNet(w.xz * 0.7, uDeepT * 0.7) * 0.65 + deepNet(w.xz * 1.1 + 3.7, uDeepT * 0.9) * 0.35;
  return uDeepLight * (c * 0.9 + 0.08) * under * up * near * exp(-max(depth, 0.0) / 12.0) * uDeepOn;
}`;

/** The bend's shared uniforms: one set for every warped material, written once a frame. */
export const STORM_U = { uStormBend: { value: 0 }, uStormSway: { value: 0 }, uStormWhorl: { value: 0 }, uStormT: { value: 0 } };
/** At strength 1: the droop's lean (radians), the sway's swing (radians), the whorl's turn (radians), the veil's haze and split; and the
 *  most a SEATED object is ever moved (metres: under half of the smallest part's radius, 0.85 m, the False Light's gunports: what a part
 *  is drawn off its hurtbox, which the logic places where it is, never where the storm draws it). */
export const STORM = { bend: 0.1, sway: 0.028, whorl: 0.18, haze: 1, split: 1, ease: 1.2, seat: 0.4 }; // (at 1, the storm wall: the far world turned 10 degrees at most, 3 degrees a real second at most; past that the horizon swims)
/** The Courier's mental state's weight on the storm, Stoic to Prismatic. */
const MIND_K = [0.65, 0.82, 1, 1.18, 1.36];
const GOLD_WHITE = new THREE.Color(1.0, 0.92, 0.74);

export const STORM_GLSL = /* glsl */`
uniform float uStormBend, uStormSway, uStormWhorl, uStormT, uStormOn;
vec4 stormClip(vec4 c) {
  float d = c.w;                                                      // (a perspective camera's w is the depth ahead, in metres)
  if (uStormOn < 0.5 || d < 5.0) return c;
  float P0 = projectionMatrix[0][0], P1 = projectionMatrix[1][1];
  vec2 mv = vec2(c.x / P0, c.y / P1), s = c.xy / d;                   // (the view-space place across and up, and the screen's)
  float grow = smoothstep(5.0, 60.0, d), ld = log(1.0 + min(d, 300.0) / 12.0);
  vec2 off = vec2(0.0, -uStormBend * d * smoothstep(5.0, 90.0, d));   // (the droop: an angle that saturates, curved near)
  float p1 = s.y * 1.9 + s.x * 0.6 + 1.2 * ld + uStormT * 0.8, p2 = s.x * 1.5 - s.y * 0.8 + 0.9 * ld + uStormT * 0.63 + 1.7;
  off += uStormSway * d * grow * vec2(0.6 * sin(p1), sin(p2));        // (the sway: an angle, so the same size near and far)
  float a = uStormWhorl * smoothstep(15.0, 220.0, d), ca = cos(a), sa = sin(a);
  off += vec2(mv.x * (ca - 1.0) - mv.y * sa, mv.x * sa + mv.y * (ca - 1.0)); // (the whorl: the far world turned about the view's axis)
  return vec4(c.x + P0 * off.x, c.y + P1 * off.y, c.zw);
}`;

/** The one opt-in: the bend on the clip position (and, where the material has the standard pieces, the Umbral's caustics). One code
 *  for every material that comes through here, bent or not (`uStormOn` is the material's own), so a warped material and a deep one of
 *  the same kind share a program. Chained after any onBeforeCompile the material has; its key carries the old one. */
function storm(mat, bend) {
  if (!mat) return mat;
  if (mat.userData.storm) { mat.userData.storm.value = bend ? 1 : 0; return mat; } // (already through here: only whether it bends changes)
  const on = (mat.userData.storm = { value: bend ? 1 : 0 });
  const prev = mat.onBeforeCompile, own = mat.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey;
  const prevKey = own ? mat.customProgramCacheKey.bind(mat) : null, prevText = prev.toString(); // (the default key IS the old code's text: taken now, before the wrap, or every wrapped material shares the wrapper's)
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    Object.assign(sh.uniforms, STORM_U, DEEP_U, { uStormOn: on });
    let v = sh.vertexShader, f = sh.fragmentShader;
    if (v.includes('#include <project_vertex>')) {
      v = v.replace('#include <common>', `#include <common>\n${STORM_GLSL}\nvarying vec3 vDeepW;`)
        .replace('#include <project_vertex>', `#include <project_vertex>
{ vec4 dw = vec4(transformed, 1.0);
#ifdef USE_BATCHING
  dw = batchingMatrix * dw;
#endif
#ifdef USE_INSTANCING
  dw = instanceMatrix * dw;
#endif
  vDeepW = (modelMatrix * dw).xyz; }
gl_Position = stormClip(gl_Position);`);
      if (f.includes('#include <emissivemap_fragment>')) {
        f = f.replace('#include <common>', `#include <common>\n${DEEP_GLSL}\nvarying vec3 vDeepW;`)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += deepCaustics(vDeepW, normal) * diffuseColor.rgb;');
      }
    } else { // (a ShaderMaterial of its own, the sky's: the bend at the end of its main, on whatever it left in gl_Position)
      const end = v.lastIndexOf('}');
      v = `${STORM_GLSL}\n${v.slice(0, end)}  gl_Position = stormClip(gl_Position);\n${v.slice(end)}`;
    }
    sh.vertexShader = v; sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => `${prevKey ? prevKey() : prevText}|storm1`;
  mat.needsUpdate = true;
  return mat;
}
export const warpMaterial = (mat) => storm(mat, true);
export const deepMaterial = (mat) => storm(mat, false);
/** A big object bends with the world. By default it is SEATED: drawn as one rigid thing shifted to where the storm draws the world at
 *  its place (its meshes' matrices moved for the draw and put back after it: no new program, its parts true to each other, and the
 *  logic that reads them between draws reads them unbent; never moved more than `STORM.seat`, so a drawn part always lies on its hurtbox, and
 *  the shift as last drawn is `root.userData.seatOff`). `shader: true` bends every material instead (curved like the sea; free for
 *  a material whose program is its own, a new program for a plain one shared with the rest of the game: count them). Outlines ride
 *  with their meshes either way. */
export function warpObject(root, { shader = false } = {}) {
  if (!root) return root;
  if (shader) {
    root.traverse((o) => { if (o.isMesh && !o.userData.isOutline) for (const m of [].concat(o.material)) if (m && !m.isSpriteMaterial) storm(m, true); });
    return root;
  }
  const seat = { root, frame: -1, cam: null, off: new THREE.Vector3() };
  root.userData.seatOff = seat.off; // (the shift as it was last drawn: what a part's hurtbox may follow, in the runtime's own time)
  root.traverse((o) => {
    if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite) || o.userData.seated) return;
    o.userData.seated = true;
    const before = o.onBeforeRender, after = o.onAfterRender, keep = new THREE.Matrix4();
    o.onBeforeRender = function (r, s, cam, ...rest) {
      if (seat.frame !== r.info.render.frame || seat.cam !== cam) { seat.frame = r.info.render.frame; seat.cam = cam; root.getWorldPosition(_sp); bendPoint(_sp, cam, _sq); seat.off.subVectors(_sq, _sp); if (seat.off.lengthSq() > STORM.seat * STORM.seat) seat.off.setLength(STORM.seat); }
      keep.copy(this.matrixWorld); this.userData.seatKeep = keep;
      const e = this.matrixWorld.elements; e[12] += seat.off.x; e[13] += seat.off.y; e[14] += seat.off.z;
      before.call(this, r, s, cam, ...rest);
    };
    o.onAfterRender = function (...a) { after.call(this, ...a); if (this.userData.seatKeep) { this.matrixWorld.copy(this.userData.seatKeep); this.userData.seatKeep = null; } };
  });
  return root;
}
const _sp = new THREE.Vector3(), _sq = new THREE.Vector3();

/** The danger stays true under the veil: its blend writes 0 to the frame's alpha (the scene's buffer is otherwise 1 everywhere), and the
 *  veil reads that as "leave this pixel where it is drawn". Free on a transparent material (the colour blends as before: normal or
 *  additive). An opaque one is left alone unless `opaque: true`, which costs it a program (three.js compiles OPAQUE materials apart);
 *  an opaque thing near the middle of the frame (the ship) is left to the veil's own middle, where it hardly reaches. */
export function keepTrue(mat, { opaque = false } = {}) {
  if (!mat || mat.userData.keepTrue || (!mat.transparent && !opaque)) return mat;
  const add = mat.blending === THREE.AdditiveBlending, see = mat.transparent;
  mat.blending = THREE.CustomBlending;
  mat.blendEquation = mat.blendEquationAlpha = THREE.AddEquation;
  mat.blendSrc = see || add ? THREE.SrcAlphaFactor : THREE.OneFactor;
  mat.blendDst = add ? THREE.OneFactor : see ? THREE.OneMinusSrcAlphaFactor : THREE.ZeroFactor;
  mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = see ? THREE.OneMinusSrcAlphaFactor : THREE.ZeroFactor; // (a soft edge keeps a share of what was there)
  mat.userData.keepTrue = true;
  return mat;
}

const _v = new THREE.Vector4(), _w = new THREE.Vector3();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class StormWarp {
  constructor(game) {
    this.game = game;
    this.target = { storm: 0, weather: 0, aspect: null, mind: null };
    this.k = 0; this.t = 0; this.anywhere = false;
    this.tint = GOLD_WHITE.clone();
  }

  /** The storm's three sources (each kept until it is set again). */
  set({ storm, weather, mind, anywhere } = {}) {
    const S = this.target;
    if (storm !== undefined) S.storm = THREE.MathUtils.clamp(+storm || 0, 0, 1);
    if (weather !== undefined) {
      if (weather && typeof weather === 'object') { S.weather = THREE.MathUtils.clamp(weather.aspect ? +weather.strength || 0 : 0, 0, 1); S.aspect = weather.aspect || null; }
      else { S.weather = THREE.MathUtils.clamp(+weather || 0, 0, 1); S.aspect = null; }
    }
    if (mind !== undefined) S.mind = mind;
    if (anywhere !== undefined) this.anywhere = !!anywhere;
  }

  /** The mental state as a number on the creatures' scale (-2 Stoic .. +2 Prismatic): given, named, or the Courier's own. */
  mindOf() {
    const m = this.target.mind;
    if (typeof m === 'number') return m;
    if (typeof m === 'string') { const i = STATES.findIndex((x) => x.name === m || x.id === m.toLowerCase()); return i < 0 ? 0 : i - 2; } // (STATES holds objects: a name is found by its `name`, never by indexOf)
    return this.game.courierMind?.mind ?? 0;
  }

  /** The strength the sources ask for, before the easing and the setting. */
  wanted() {
    const S = this.target, m = THREE.MathUtils.clamp(this.mindOf(), -2, 2), i = Math.floor(m + 2), f = m + 2 - i;
    const mk = MIND_K[i] + (MIND_K[Math.min(4, i + 1)] - MIND_K[i]) * f;
    return THREE.MathUtils.clamp((S.storm + 0.25 * S.weather * (1 - S.storm)) * mk, 0, 1);
  }

  /** Each frame: the strength eased, the bend's uniforms written, and the veil's share handed to the glitch's pass. */
  update(raw = 1 / 60, camera = this.game.camera) {
    this.t += raw;
    const here = this.anywhere || (camera && zoneOf(camera.position) === 'emocean');
    const want = here ? this.wanted() * THREE.MathUtils.clamp(T.visual.warp ?? 1, 0, 1) : 0;
    this.k = here ? THREE.MathUtils.damp(this.k, want, STORM.ease, raw) : 0; // (out of the rail at once: nothing leaks into the dunes)
    if (this.k < 1e-3 && want === 0) this.k = 0;
    const k = this.k, t = this.t, U = STORM_U;
    U.uStormBend.value = STORM.bend * k * (1 + 0.25 * Math.sin(t * 0.37));
    U.uStormSway.value = STORM.sway * k;
    U.uStormWhorl.value = STORM.whorl * k * Math.sin(t * 0.29);
    U.uStormT.value = t;
    // the veil: haze and split by the strength; its light gold-white, leaning to the waypoint's weather
    const V = this.game.glitch?.veil; if (!V) return;
    V.haze = STORM.haze * k; V.split = STORM.split * k; V.t = t;
    this.tint.copy(GOLD_WHITE); if (this.target.aspect && COLOR[this.target.aspect] != null) this.tint.lerp(_c.setHex(COLOR[this.target.aspect]), 0.25 * this.target.weather);
    V.light.copy(this.tint);
  }

  /** Every shared uniform and the veil at nothing, at once: for a scene the rail's loop does not run (the workbench opening; casebook
   *  rule 15, a module-wide uniform is everyone's). The game's next frame writes them again. */
  quiet() {
    this.k = 0; for (const u of Object.values(STORM_U)) u.value = 0; DEEP_U.uDeepOn.value = 0;
    const V = this.game.glitch?.veil; if (V) { V.haze = 0; V.split = 0; V.below = 0; V.line = -1; }
  }

  /** Where a point of the environment is drawn now (the shader's bend, on the CPU): for anchoring something true to what is seen. */
  bend(p, camera = this.game.camera, out = new THREE.Vector3()) { return bendPoint(p, camera, out); }
}

/** The shader's bend on the CPU (STORM_U as last written): where a world point of the environment is drawn through `camera`. */
export function bendPoint(p, camera, out = new THREE.Vector3()) {
  out.copy(p); const U = STORM_U;
  if (!camera || (U.uStormBend.value === 0 && U.uStormSway.value === 0 && U.uStormWhorl.value === 0)) return out;
  const mv = _w.copy(p).applyMatrix4(camera.matrixWorldInverse), d = -mv.z;
  if (d < 5) return out;
  _v.set(mv.x, mv.y, mv.z, 1).applyMatrix4(camera.projectionMatrix);
  const sx = _v.x / _v.w, sy = _v.y / _v.w, grow = smooth(5, 60, d), ld = Math.log(1 + Math.min(d, 300) / 12), T0 = U.uStormT.value;
  let ox = 0, oy = -U.uStormBend.value * d * smooth(5, 90, d);
  const p1 = sy * 1.9 + sx * 0.6 + 1.2 * ld + T0 * 0.8, p2 = sx * 1.5 - sy * 0.8 + 0.9 * ld + T0 * 0.63 + 1.7;
  ox += U.uStormSway.value * d * grow * 0.6 * Math.sin(p1); oy += U.uStormSway.value * d * grow * Math.sin(p2);
  const a = U.uStormWhorl.value * smooth(15, 220, d), ca = Math.cos(a), sa = Math.sin(a);
  ox += mv.x * (ca - 1) - mv.y * sa; oy += mv.x * sa + mv.y * (ca - 1);
  mv.x += ox; mv.y += oy;
  return out.copy(mv).applyMatrix4(camera.matrixWorld);
}
const _c = new THREE.Color();
