// ---------------------------------------------------------------------------------------
// THE VOXEL BATCH: every cube of debris in the crossing in one draw (docs/plans/RAIL-FLOW.md section 10, Dovina's; the owner, 2026-10-21:
// "voxel-based tech and boids to support the spectacle"). A foe downed bursts into its voxels (its body baked once to a voxel set:
// vfx/voxels/voxelize.js), thrown out from the hit's point, tumbling, and in the last fifth of its life shrinking into a Lachryma mote
// that glows out in its feeling's colour; a hit chips a few small cubes off where it lands. One InstancedMesh of a unit cube (12
// triangles) with its state per instance, written once at its birth into a ring buffer: where it starts, how fast, its birth and life,
// its size, colour and glow, its tumble, and the frame's carry (the rail's own motion, so debris travels with the fight in view). Every
// voxel moves in the vertex shader from its birth (ballistic, with drag and gravity, a tumble that slows with the drag): no CPU work a
// voxel a frame, so 12,000 cost one call. Solid chunks are opaque (an additive cube reads as a ghost); only the mote at the end glows.
//
// The look: smooth shading under one sun and a hemisphere read from the scene's own lights each frame (the mood's tints with them),
// the cube's edges lit in its own colour (a sixth-generation bevel without a bevel), a fresnel rim, the scene's fog. Kept true under the
// storm's veil (vfx/stormwarp.js keepTrue: it is the danger's world). The swarm's look (vfx/voxels/swarmlook.js) draws through the same
// program with its instances placed on the CPU: one program for both.
//
// Cost (ARCHITECTURE.md budgets): 1 draw call; 12 triangles a voxel, only up to the ring's high-water mark (144,000 at the cap); hidden
// when nothing is alive; one shader program, shared with the swarm's look.
//
// Prior art: Resogun's and Nex Machina's voxel deaths (Housemarque, 2013, 2017: every foe its cubes, thrown and glowing out), the GPU
// particle that is a closed-form function of its birth (the "stateless particle" of Lutz Latta's "Building a Million Particle
// System", GDC 2004), drag in closed form (v0 (1 - e^-kt) / k), the ring buffer of every particle pool, the shots' instanced field
// (vfx/railshots.js) and the refit sweep's kept-true look (vfx/refitsweep.js).
//
//   const V = new VoxelBatch(game, { capacity = 12000 })   V.build(scene)   V.update(rawDt) (once a frame)   V.parked() -> [mesh]   V.dispose()
//   V.burst({ set | object, key?, at?, quaternion?, scale?, dir?, carry?, power = 1, colour?, aspect?, life? }) -> voxels thrown
//       object: a Mesh or Group, baked on first use (voxelize, cached by `key`, else its name and its first geometry); its own world
//       place, turn and size unless `quaternion` / `scale` are given; set: a voxel set placed at `at`; at: the hit point they are thrown
//       out from (default the body's place); dir: the blow's way (they lean along it); carry: the frame's velocity (m/s, world);
//       power 0 (a crumble) .. 2 (a blast; a boss part's radius may pass 2, held at 3); colour: a tint over the body's own; aspect: a
//       feeling (progress/weather.js COLOR): its glowing voxels and every mote take its colour
//   V.chip(at, dir, n = 4, colour?, carry?)   a few small cubes knocked off where a hit lands (dir: the blow's way)
//   V.emit(x, y, z, vx, vy, vz, size, r, g, b, life, glow = 0, mote = null (THREE.Color), spin = 4, cx = 0, cy = 0, cz = 0) -> index
//   VOXEL_BATCH   the numbers: gravity, drag, the mote's size and colour, a burst's speeds and lives, a chip's
//   voxelMaterial({ rim, edge }) and voxelCube() (the shared program and geometry: the swarm's look's too)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { keepTrue } from '../stormwarp.js';
import { COLOR } from '../../progress/weather.js';
import { voxelize } from './voxelize.js';

export const VOXEL_BATCH = {
  capacity: 12000,
  gravity: 7.5, drag: 1.4,               // (m/s², 1/s: a chunk slows and falls, never floats away)
  mote: { size: 0.28, colour: [0.72, 0.95, 1.0] }, // (the mote's share of the voxel's size; Lachryma's pale light where no feeling is given)
  burst: { speed: [2.2, 7.5], along: 4.5, up: 1.6, life: [0.95, 1.7], spin: [2, 9], jitter: [0.85, 1.15] },
  chip: { speed: [2, 5], size: [0.06, 0.12], life: [0.4, 0.75], colour: 0xf2ead8 },
  rim: 0.35, edge: 0.55,                 // (the batch's fresnel rim and lit edges; the swarm's look asks for more)
};
const B = VOXEL_BATCH;

const VERT = /* glsl */`
attribute vec4 iOrigin; // xyz the world place at birth, w the birth (uTime's clock)
attribute vec4 iVel;    // xyz m/s at birth, w the life (real s; 0: held still, placed by instanceMatrix: the swarm's look)
attribute vec4 iCarry;  // xyz the frame's carry (m/s, undamped), w the size (m)
attribute vec4 iColor;  // rgb linear, w its glow 0..1
attribute vec4 iSpin;   // rgb the mote's colour, w the tumble's rate (rad/s)
uniform float uTime, uGravity, uDrag, uMote;
varying vec3 vN, vW, vLocal, vCol, vMoteCol;
varying float vGlow, vMote;
#include <fog_pars_vertex>
vec3 rotA(vec3 v, vec3 a, float t) { float c = cos(t), s = sin(t); return v * c + cross(a, v) * s + a * dot(a, v) * (1.0 - c); }
vec3 hash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
void main() {
  vec3 p = position, n = normal;
  vec4 w;
  vMote = 0.0;
  if (iVel.w > 0.0) {
    float age = uTime - iOrigin.w, k = age / iVel.w;
    if (k < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } // (not born, or gone: off the clip, culled)
    float e = (1.0 - exp(-uDrag * age)) / uDrag;
    vec3 c = iOrigin.xyz + iVel.xyz * e + iCarry.xyz * age;
    c.y -= uGravity * (age - e) / uDrag; // (gravity under the same drag: its terminal fall reached smoothly)
    vMote = smoothstep(0.8, 1.0, k);
    vec3 ax = normalize(hash3(iOrigin.xyz * 3.17 + iOrigin.w) - 0.5 + 1e-3);
    float ang = iSpin.w * e;
    p = rotA(p, ax, ang) * iCarry.w * mix(1.0, uMote, vMote) + c; n = rotA(n, ax, ang);
    w = modelMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * n);
  } else {
    w = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  }
  vW = w.xyz; vLocal = position; vCol = iColor.rgb; vGlow = iColor.w; vMoteCol = iSpin.rgb;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FRAG = /* glsl */`
uniform vec3 uSunDir, uSun, uSky, uGround;
uniform float uRim, uEdge;
varying vec3 vN, vW, vLocal, vCol, vMoteCol;
varying float vGlow, vMote;
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 lit = vCol * (mix(uGround, uSky, N.y * 0.5 + 0.5) + uSun * max(dot(N, uSunDir), 0.0));
  vec3 a = abs(vLocal); float mx = max(a.x, max(a.y, a.z)), mn = min(a.x, min(a.y, a.z)), mid = a.x + a.y + a.z - mx - mn;
  float edge = smoothstep(0.36, 0.5, mid);                        // (the second-nearest face: the cube's edge)
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  vec3 col = lit + vCol * (uEdge * edge + uRim * rim) + vCol * vGlow * 1.6;
  vec3 mote = vMoteCol * (1.6 + 1.4 * edge);
  gl_FragColor = vec4(mix(col, mote, vMote), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

let CUBE = null;
/** The unit cube (12 triangles), shared by the batch and the swarm's look. */
export const voxelCube = () => (CUBE ||= new THREE.BoxGeometry(1, 1, 1));
/** The voxels' material: one program for the batch and the swarm's look (their uniforms their own). */
export function voxelMaterial({ rim = B.rim, edge = B.edge } = {}) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uGravity: { value: B.gravity }, uDrag: { value: B.drag }, uMote: { value: B.mote.size },
    uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2).normalize() }, uSun: { value: new THREE.Color(1.6, 1.45, 1.3) },
    uSky: { value: new THREE.Color(0.55, 0.5, 0.6) }, uGround: { value: new THREE.Color(0.18, 0.12, 0.12) },
    uRim: { value: rim }, uEdge: { value: edge },
  }]);
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, fog: true });
  keepTrue(m, { opaque: true });
  m.userData.u = u;
  return m;
}
/** The scene's sun and sky into a voxel material's uniforms (the first directional and hemisphere lights found at build). */
export function lightVoxels(u, sun, hemi) {
  if (sun) { u.uSunDir.value.subVectors(sun.position, sun.target?.position || _o).normalize(); u.uSun.value.copy(sun.color).multiplyScalar(sun.intensity * 0.55); }
  if (hemi) { u.uSky.value.copy(hemi.color).multiplyScalar(hemi.intensity * 0.32); u.uGround.value.copy(hemi.groundColor).multiplyScalar(hemi.intensity * 0.32); }
}
/** The instance attributes the program reads (zeros: a held voxel, colour set by its owner). */
export function voxelAttributes(geo, n, dynamic = true) {
  const out = {};
  for (const k of ['iOrigin', 'iVel', 'iCarry', 'iColor', 'iSpin']) {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    if (dynamic) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(k, a); out[k] = a;
  }
  return out;
}
/** The lights a voxel material follows: the scene's first sun and hemisphere. */
export function findLights(scene) {
  let sun = null, hemi = null;
  scene?.traverse?.((o) => { if (!sun && o.isDirectionalLight) sun = o; if (!hemi && o.isHemisphereLight) hemi = o; });
  return { sun, hemi };
}

const _o = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _w = new THREE.Vector3();
const _d = new THREE.Vector3(), _hit = new THREE.Vector3(), _tint = new THREE.Color(), _feel = new THREE.Color(), _mote = new THREE.Color();
const lerp = (r, u) => r[0] + (r[1] - r[0]) * u;

export class VoxelBatch {
  constructor(game, { capacity = B.capacity } = {}) {
    this.game = game; this.cap = capacity; this.head = 0; this.written = 0; this.time = 0; this.until = -1;
    this.lo = Infinity; this.hi = -1;
  }
  build(scene) {
    const geo = voxelCube().clone();
    this.attr = voxelAttributes(geo, this.cap);
    for (let i = 0; i < this.cap; i++) this.attr.iOrigin.array[i * 4 + 3] = -1e9, this.attr.iVel.array[i * 4 + 3] = 1; // (all long dead)
    this.mat = voxelMaterial();
    this.mesh = new THREE.InstancedMesh(geo, this.mat, this.cap);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.userData.zoneFree = true; this.mesh.visible = false; this.mesh.renderOrder = 3;
    this.mesh.name = 'voxelBatch';
    this.lights = findLights(scene);
    scene.add(this.mesh);
    return this;
  }
  /** For the warm-up's compile: the mesh with one voxel alive, so the program is made at boot (casebook 17). */
  parked() {
    if (!this.mesh) return [];
    this.emit(0, -1e4, 0, 0, 0, 0, 0.1, 1, 1, 1, 0.5);
    this.flush(); this.mesh.visible = true;
    return [this.mesh];
  }

  /** One voxel into the ring (overwriting the oldest when it is full). */
  emit(x, y, z, vx, vy, vz, size, r, g, b, life, glow = 0, mote = null, spin = 4, cx = 0, cy = 0, cz = 0) {
    if (!this.attr) return -1;
    const i = this.head, k = i * 4, A = this.attr, m = mote || _mote.setRGB(...B.mote.colour);
    A.iOrigin.array.set([x, y, z, this.time], k); A.iVel.array.set([vx, vy, vz, life], k);
    A.iCarry.array.set([cx, cy, cz, size], k); A.iColor.array.set([r, g, b, glow], k); A.iSpin.array.set([m.r, m.g, m.b, spin], k);
    this.lo = Math.min(this.lo, i); this.hi = Math.max(this.hi, i);
    this.head = (i + 1) % this.cap;
    this.written = Math.min(this.cap, this.written + 1);
    this.until = Math.max(this.until, this.time + life);
    return i;
  }

  /** A body thrown apart into its voxels (see the header for the options). Returns how many were thrown. */
  burst({ set = null, object = null, key = null, at = null, quaternion = null, scale = null, dir = null, carry = null, power = 1, colour = null, aspect = null, life = null } = {}) {
    if (!this.attr) return 0;
    if (!set && object) {
      let g0 = null; object.traverse((o) => { if (!g0 && o.isMesh) g0 = o.geometry; });
      set = voxelize(object, { key: key ?? `${object.name}|${g0?.uuid ?? object.uuid}` });
    }
    if (!set?.count) return 0;
    if (object) { object.updateWorldMatrix(true, false); object.matrixWorld.decompose(_p, _q, _s); }
    else { _p.copy(at || _o.set(0, 0, 0)); _q.identity(); _s.set(1, 1, 1); }
    if (quaternion) _q.copy(quaternion);
    const sc = scale ?? _s.x, pw = Math.max(0, Math.min(3, power));
    _hit.copy(at || _p);
    const tint = colour != null ? _tint.set(colour) : null, feel = aspect && COLOR[aspect] != null ? _feel.setHex(COLOR[aspect]) : null;
    const mote = feel ? _mote.copy(feel) : _mote.setRGB(...B.mote.colour), U = B.burst, P = set.positions, C = set.colours;
    const speed = 0.35 + 0.65 * pw, cx = carry?.x || 0, cy = carry?.y || 0, cz = carry?.z || 0;
    for (let i = 0; i < set.count; i++) {
      _w.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).multiplyScalar(sc).applyQuaternion(_q).add(_p);
      _d.subVectors(_w, _hit); if (_d.lengthSq() < 1e-6) _d.set(Math.random() - 0.5, Math.random(), Math.random() - 0.5); _d.normalize();
      _d.multiplyScalar(lerp(U.speed, Math.random()) * speed);
      if (dir) _d.addScaledVector(dir, U.along * pw * Math.random());
      _d.y += U.up * Math.random() * speed;
      let r = C[i * 3], g = C[i * 3 + 1], b = C[i * 3 + 2]; const glow = set.glow ? set.glow[i] : 0;
      if (tint) { r = r * 0.5 + tint.r * 0.5; g = g * 0.5 + tint.g * 0.5; b = b * 0.5 + tint.b * 0.5; }
      if (feel && glow > 0.3) { r = feel.r; g = feel.g; b = feel.b; }
      const lf = (life ?? lerp(U.life, Math.random())) * (0.75 + 0.25 * Math.min(1, pw));
      this.emit(_w.x, _w.y, _w.z, _d.x, _d.y, _d.z, set.size * sc * lerp(U.jitter, Math.random()), r, g, b, lf, glow, mote, lerp(U.spin, Math.random()) * (0.4 + 0.6 * pw), cx, cy, cz);
    }
    return set.count;
  }

  /** A few small cubes knocked off where a hit lands, flying back against the blow's way. */
  chip(at, dir = null, n = 4, colour = null, carry = null) {
    const C = B.chip, c = _tint.set(colour ?? C.colour);
    for (let i = 0; i < n; i++) {
      _d.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(lerp(C.speed, Math.random()));
      if (dir) _d.addScaledVector(dir, -lerp(C.speed, Math.random()) * 0.6);
      _d.y += 1;
      this.emit(at.x, at.y, at.z, _d.x, _d.y, _d.z, lerp(C.size, Math.random()), c.r, c.g, c.b, lerp(C.life, Math.random()), 0.2, c, 10, carry?.x || 0, carry?.y || 0, carry?.z || 0);
    }
  }

  /** What was written this frame goes up (only its range). */
  flush() {
    if (this.hi < 0) return;
    for (const a of Object.values(this.attr)) {
      a.clearUpdateRanges();
      a.addUpdateRange(this.lo * 4, (this.hi - this.lo + 1) * 4); // (one range covers what was written, wrapped or not)
      a.needsUpdate = true;
    }
    this.lo = Infinity; this.hi = -1;
    this.mesh.count = this.written;
  }
  update(raw) {
    if (!this.mesh) return;
    this.time += raw;
    this.flush();
    const u = this.mat.userData.u; u.uTime.value = this.time;
    lightVoxels(u, this.lights.sun, this.lights.hemi);
    this.mesh.visible = this.time < this.until;
  }
  dispose() { this.mesh?.removeFromParent(); this.mesh?.geometry.dispose(); this.mat?.dispose(); this.mesh = null; this.attr = null; }
}
