// ---------------------------------------------------------------------------------------
// THE BOWL: the Great Slip Jelly's arena's ground and pools (the owner, 2026-10-07: the full build, Round 1; docs/plans/DUNEMAW-ARENA.md,
// "Calissa: the bowl's sand (the dish's slide shown in the ground's own streaks) ... the pools' ripple before a surfacing"). Petra builds
// the dish (4 degrees down to the centre), the rim shallows and the pools; this is how they read.
//
//   THE SAND     the dish's sand (the ambientCG sand the dunes use, laid in world space) with streaks in it, combed toward the pool the
//                FOE is in, as sand that runs downhill is combed: at rest they lie still and faint; as the slide runs (phase 2) they
//                stream toward the pool at the slide's own speed and darken, so the ground itself says which way it is going
//                (Journey's sliding sand; an antlion's pit, read at a glance)
//   THE RING     1.2 sim seconds before the FOE surfaces in a pool (Wanda's ring), the slip there rings: rings rising from its middle,
//                quicker and brighter as the moment comes, a glow welling up from under it, bubbles; then the surfacing's splash
//
// Prior art: Journey's sand slides (streaks that run), the antlion's pit, Ocarina's King Dodongo pit (the hazard read from the floor),
// Monster Hunter's Jyuratodus (the mud that tells where it will rise), and the stone dropped in a still pool.
//
//   bowlSand({ scale })   (a material: its uniforms on .userData.u; set u.uPool (world xz), u.uSlide (m/s, 0 at rest))   bowlSandTick(mat, rawDt)
//   const R = new PoolRing({ radius, fx, ground })   R.group (on the pool's surface; ground(x, z): the slope under it, as DunemawMouth's)   R.ring(k 0..1)   R.surface()   R.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { surfaceTexture } from '../render/triplanar.js';
import { LAB_GLSL, mindTime } from './labradorite.js';
import { froude } from './cavekit.js';
import { layOnGround } from './dunemaw.js';

/** The dish's sand, combed toward the pool the slide runs to. */
export function bowlSand({ scale = 0.25 } = {}) {
  const u = { uT: { value: 0 }, uPool: { value: new THREE.Vector2() }, uSlide: { value: 0 }, uPhase: { value: 0 }, uScale: { value: scale }, uSand: { value: surfaceTexture('sand') } };
  const m = new THREE.MeshStandardMaterial({ name: 'bowl-sand', color: 0xffffff, roughness: 0.95 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBwW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvBwW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vBwW; uniform float uT, uSlide, uPhase, uScale; uniform vec2 uPool; uniform sampler2D uSand;
float bwH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float bwN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(bwH(i), bwH(i + vec2(1, 0)), f.x), mix(bwH(i + vec2(0, 1)), bwH(i + 1.0), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec3 sand = texture2D(uSand, vBwW.xz * uScale).rgb;
  vec2 d = vBwW.xz - uPool; float r = length(d) + 1e-3; vec2 dir = d / r;
  // the comb: streaks along the lines to the pool (noise over the direction, so no seam where an angle would wrap), carried inward at
  // the slide's speed (uPhase: metres slid)
  float along = r + uPhase;
  float s1 = bwN(dir * 22.0 + vec2(along * 0.1, -along * 0.07)), s2 = bwN(dir * 60.0 + 3.1 + vec2(-along * 0.25, along * 0.18));
  float streak = smoothstep(0.55, 0.8, s1 * 0.65 + s2 * 0.35);
  float run = clamp(uSlide / 1.5, 0.0, 1.0);                                                      // (still and faint at rest; deep when it runs)
  float near = 1.0 - smoothstep(4.0, 26.0, r);                                                      // (the combing is strongest near the pool)
  diffuseColor.rgb = sand * (1.0 - streak * (0.12 + 0.3 * run) * (0.4 + 0.6 * near)) * (1.0 + 0.08 * (1.0 - streak) * run); }`);
  };
  m.customProgramCacheKey = () => 'bowl-sand';
  m.userData.u = u;
  return m;
}
/** Per frame: the slide carries the comb toward the pool. */
export function bowlSandTick(mat, raw) { const u = mat.userData.u; u.uT.value += raw; u.uPhase.value += raw * u.uSlide.value; }

const RING_F = /* glsl */`uniform float uK, uT; varying vec2 vU;
${LAB_GLSL}
void main() {
  vec2 p = vU * 2.0 - 1.0; float r = length(p), a = atan(p.y, p.x); if (r > 1.0) discard;
  float f = 1.5 + 4.5 * uK;                                                                           // (the rings come quicker as it nears)
  float ph = fract(r * 3.0 - uT * f * 0.5), ring = (1.0 - smoothstep(0.0, 0.07, abs(ph - 0.5))) * (0.6 + 0.4 * sin(a * 5.0 + uT * 2.0 + r * 4.0)); // (thin crests, broken as a liquid's are: never a painted target)
  float well = (1.0 - smoothstep(0.0, 0.55, r)) * uK * uK;                                            // (the glow welling up from under it)
  vec3 lab = labradorite(r * 0.6 + uMindT * 0.1);
  vec3 c = vec3(0.75, 0.68, 0.6) * ring * (0.3 + 0.5 * uK) + lab * well * 0.9;
  float al = (ring * (0.15 + 0.35 * uK) + well * 0.8) * (1.0 - smoothstep(0.75, 1.0, r)) * smoothstep(0.0, 0.08, uK);
  gl_FragColor = vec4(c, al);
}`;

export class PoolRing {
  constructor({ radius = 2, fx = null, ground = null } = {}) {
    this.fx = fx; this.radius = radius; this.k = 0; this.t = 0; this.bub = 0; this.grow = Math.max(1, radius / 2); // (drawn for a 2 m pool: a bigger one's slip is thrown as big things move, Froude scaling, cavekit.js)
    this.ground = ground || (() => 0); // (the slope under it: the ring and its bubbles lie on it, as the pool's mouth does)
    this.u = { uK: { value: 0 }, uT: { value: 0 }, uMindT: mindTime };
    this.group = new THREE.Group(); this.group.name = 'pool-ring';
    const seg = ground ? 12 : 1;
    this.disc = new THREE.Mesh(layOnGround(new THREE.PlaneGeometry(radius * 2.2, radius * 2.2, seg, seg).rotateX(-Math.PI / 2), ground), new THREE.ShaderMaterial({ name: 'pool-ring', uniforms: this.u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: RING_F }));
    this.disc.position.y = 0.03; this.disc.renderOrder = 2; this.group.add(this.disc);
  }
  /** How near the surfacing is: 0 nothing .. 1 the moment (Petra eases it over the 1.2 s). */
  ring(k) { this.k = THREE.MathUtils.clamp(k, 0, 1); }
  /** It comes up: a splash of slip and a last bright ring. */
  surface() {
    this.k = 0; const fx = this.fx; if (!fx?.alpha) return; this.group.updateMatrixWorld(true); const c = this.group.getWorldPosition(_p).clone();
    for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * this.radius * 0.8, x = Math.cos(a) * r, z = Math.sin(a) * r; fx.alpha.emit(froude({ pos: c.clone().add(_q.set(x, 0.1 + this.ground(x, z), z)), vel: new THREE.Vector3(Math.cos(a) * 3, 5 + Math.random() * 6, Math.sin(a) * 3), life: 1.3, size: 0.18, sizeEnd: 0.08, color: new THREE.Color(i % 4 ? 0x8a6440 : 0xb59be6), alpha: 0.95, drag: 0.4, gravity: 12 }, this.grow)); }
  }
  update(raw = 1 / 60) {
    this.t += raw; this.u.uT.value = this.t; this.u.uK.value = this.k; this.disc.visible = this.k > 0.005;
    const fx = this.fx; if (!fx?.alpha || this.k < 0.05) return;
    this.bub += raw * (2 + 14 * this.k) * this.grow; // (bubbles breaking the slip, faster as it comes)
    this.group.updateMatrixWorld(true);
    while (this.bub >= 1) { this.bub -= 1; const a = Math.random() * Math.PI * 2, r = Math.random() * this.radius * 0.7, x = Math.cos(a) * r, z = Math.sin(a) * r, at = this.group.localToWorld(_p.set(x, 0.05 + this.ground(x, z), z));
      fx.alpha.emit(froude({ pos: at.clone(), vel: new THREE.Vector3(0, 0.6 + Math.random(), 0), life: 0.35, size: 0.1 + 0.15 * this.k, sizeEnd: 0.02, color: new THREE.Color(0xc9b8e8), alpha: 0.7, drag: 2, gravity: 2 }, this.grow)); }
  }
  dispose() { this.group.parent?.remove(this.group); this.disc.geometry.dispose(); this.disc.material.dispose(); }
}
const _p = new THREE.Vector3(), _q = new THREE.Vector3();
