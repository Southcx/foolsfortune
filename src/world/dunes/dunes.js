// ---------------------------------------------------------------------------------------
// THE DUNES: a layer far below the workshop, a sand sea in the manner of Journey: long
// sweeping dunes with sharp crests and steep lee faces, glinting sand, a low gold sun in a
// teal-to-rose sky, half-buried ruins and a pale spire in the distance to sail toward, and at
// its heart an oasis: a pond on a flat of packed sand, with the Weir built round it
// (tools/sondelass/angling/weir.js). It is crossed on the Solar Skiff (courier/skiff/skiff.js), a sail-board that
// catches the wind: Solar Skiffing. Nothing walls it in: the sand runs on to high dunes on the
// horizon, and the edge is an invisible barrier (barrier.js) that shows itself only where you
// touch it. A layer of cloud drifts downwind across the painted sky (vfx/clouds.js).
//
// The ground is one height function (heightAt) that the mesh, the collider, the board's hover
// and the particles all read, so they can never disagree. It is drawn in chunks with levels of
// detail (render/terrain.js), one draw call, sampled every 2.5 m inside the barrier. It lies at ORIGIN, well away from the
// lab's rooms (in x and z as well as in y) so nothing there can trigger on it.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { openSea } from '../../render/zonemap.js';
import { TrailMap, TRAIL_GLSL } from '../ground/trailmap.js';
import { SandMarks, SAND } from '../ground/groundmarks.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T, PALETTE } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';
import { ChunkTerrain } from '../../render/terrain.js';
import { triplanar, surfaceTexture } from '../../render/triplanar.js';
import { mergeStatic } from '../../render/merge.js';
import { CloudLayer } from '../../vfx/clouds.js';
import { Barrier } from './barrier.js';
import { Beach, beachBlend, farMask, inSector, SHORE, JETTY } from './beach.js';
import { PropBatch } from '../../render/propbatch.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tag, register } from '../../core/tags.js';
import { MATERIALS } from '../props/pottery.js';

export const DUNE = { x: 2000, y: -420, z: 0, half: 520, step: 2.5, outer: 900, layerBelow: -150 };
const WIND_AT = 0.55; // (radians) the way the wind blows toward, on average
/** The edge of the world down here: an invisible wall round the sand at this radius (see Barrier). */
export const BARRIER = 480;

// THE OASIS: the middle of the sea is a flat of packed sand round a pond, and the Weir (tools/sondelass/angling/weir.js) is built on it. All in the
// dunes' local frame (metres from the centre, heights above the layer's floor). The pond and the well are cut into the height field
// itself, so the sand, the board's hover and the swimming all agree about where the water is.
// (the pond three times the area it was, the owner R46: radii 22 by 15 to 38 by 26, the oasis's flat 64 to 80 m and the well out past
// the east shore with it; the Weir's buildings stand round the bigger water: tools/sondelass/angling/weir.js)
export const OASIS = { x: 0, z: 0, y: 12, flat: 80, blend: 70 };
export const POND = { x: 0, z: 6, rx: 38, rz: 26, surface: OASIS.y - 0.45 };
export const WELL = { x0: 47.5, x1: 56.5, z0: 1, z1: 11, surface: OASIS.y - 0.5, depth: 9.5 };

// (an integer hash: the noise below is sampled a few hundred thousand times when the field is built)
const hash = (x, z) => { let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  const u = smooth(fx), v = smooth(fz);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, oct = 3) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); a *= 0.5; f *= 2.03; } return s; } // 0..~0.87
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** A dune's long section: a gentle windward rise and a sharp crest over a steep lee, 0..1. */
function duneProfile(f) {
  const c = 0.74;
  if (f < c) { const t = f / c; return Math.pow(t, 1.25) * (0.92 + 0.08 * t); }
  const t = (f - c) / (1 - c);
  return 1 - smooth(Math.min(1, t * 1.05));
}

/** The pond's shape: 1 on its shore, less inside (an ellipse with a wandering edge). */
function pondQ(x, z) {
  const dx = (x - POND.x) / POND.rx, dz = (z - POND.z) / POND.rz, a = Math.atan2(dz, dx);
  return Math.hypot(dx, dz) * (1 + 0.06 * Math.sin(3 * a + 1) + 0.04 * Math.sin(5 * a + 2.2));
}
/** How deep the pond is at local x, z (metres below its surface; <= 0 on dry ground). Four terraces: the species keep to them. */
export function pondDepth(x, z) {
  const q = pondQ(x, z);
  if (q >= 1) return -(q - 1) * 2.4;
  const S = (a, b) => sstep(a, b, 1 - q) ; // (0 at the shore side, 1 past it)
  return 0.55 * S(0, 0.08) + 1.45 * S(0.26, 0.32) + 2.2 * S(0.48, 0.54) + 1.8 * S(0.7, 0.75);
}
const inWell = (x, z, m = 0) => x > WELL.x0 - m && x < WELL.x1 + m && z > WELL.z0 - m && z < WELL.z1 + m;

/** The oasis ground (packed sand round the pond, the pond's bed, the well's shaft) at local x, z. */
function oasisGround(x, z) {
  if (inWell(x, z, 1.2)) return WELL.surface - WELL.depth - 1.5; // (the shaft is built in stone: the sand is dug out from under it)
  const r = Math.hypot(x - OASIS.x, z - OASIS.z);
  const lap = (fbm(x * 0.05 + 40, z * 0.05, 2) - 0.43) * 0.8 * sstep(OASIS.flat - 30, OASIS.flat, r); // (it ripples a little toward the edge)
  return Math.min(OASIS.y + lap, POND.surface - pondDepth(x, z));
}

/** Local ground height (metres above the layer's floor) at local x, z (origin at the centre). */
export function localHeight(x, z) {
  const wx = Math.cos(WIND_AT), wz = Math.sin(WIND_AT);
  const px = x + (fbm(x * 0.004 + 11, z * 0.004, 3) - 0.43) * 130;
  const pz = z + (fbm(x * 0.004, z * 0.004 + 37, 3) - 0.43) * 130;
  const s = (px * wx + pz * wz) / 112 + (fbm(px * 0.006 + 3, pz * 0.006 + 9, 3) - 0.43) * 3.4;
  const amp = 6 + 13 * fbm(px * 0.0032 + 5, pz * 0.0032 - 2, 2);
  const r0 = Math.hypot(x - OASIS.x, z - OASIS.z);
  const calm = 0.38 + 0.62 * sstep(OASIS.flat, OASIS.flat + 90, r0); // (gentler dunes round the oasis)
  let h = duneProfile(s - Math.floor(s)) * amp * calm;
  const s2 = (px * -wz + pz * wx) / 46 + (fbm(px * 0.011, pz * 0.011, 2) - 0.43) * 2.4;
  h += duneProfile(s2 - Math.floor(s2)) * 2.4 * sstep(0.35, 0.65, fbm(px * 0.005 + 20, pz * 0.005, 2)) * calm;
  h += (fbm(px * 0.0022, pz * 0.0022 + 7, 3) - 0.43) * 22;
  // (no wall of mountains any more: the sea runs on past the barrier, and far off, out of reach, it rises into high dunes that close
  // the horizon)
  const far = sstep(BARRIER + 90, DUNE.outer, Math.hypot(x, z)) * farMask(x, z); // (parted due east: the shore, beach.js)
  h += far * far * 90;
  h += 14;
  h = beachBlend(x, z, h); // (the dunes run down to the Emocean in the shore's sector: beach.js)
  const w = 1 - sstep(OASIS.flat, OASIS.flat + OASIS.blend, r0);
  return w > 0 ? h + (oasisGround(x, z) - h) * w : h;
}

export class Dunes {
  constructor(game, lights) {
    this.game = game;
    this.lights = lights; // { sun, hemi, amb }
    this.mix = 0; // 0 workshop light .. 1 dune light
    this.t = 0;
    this.wind = { dir: new THREE.Vector2(Math.cos(WIND_AT), Math.sin(WIND_AT)), speed: 8, gust: 1 };
    this.trail = new TrailMap(game.renderer, { size: 96, res: 512, life: 26 });
    this.marks = new SandMarks(game, this.trail, SAND);
    this.buildTerrain();
    this.buildSky();
    this.buildRuins();
    this.barrier = new Barrier(game, { center: new THREE.Vector3(DUNE.x, 0, DUNE.z), radius: BARRIER, y0: DUNE.y - 20, y1: DUNE.y + 260,
      gap: (a) => inSector(Math.cos(a), Math.sin(a)) }); // (open on the shore: its own wall stands a step into the crude, beach.js)
    this.beach = new Beach(game, { center: new THREE.Vector3(DUNE.x, DUNE.y, DUNE.z), heightAt: (x, z) => this.heightAt(x, z), barrier: BARRIER });
    this.setVisible(false);
    // the values the workshop is lit with (blended back to when you leave)
    const sc = game.scene;
    this.home = { bg: sc.background.clone(), fog: sc.fog.color.clone(), fogD: sc.fog.density, hemiSky: lights.hemi.color.clone(), hemiGnd: lights.hemi.groundColor.clone(), hemiI: lights.hemi.intensity, ambI: lights.amb.intensity, sunC: lights.sun.color.clone(), sunI: lights.sun.intensity };
    this.away = { bg: game.sky.horizon.clone(), fog: new THREE.Color(0xe6a47c).lerp(game.sky.horizon, 0.7), fogD: 0.0042, // (the far haze is the painting's own horizon)
       hemiSky: new THREE.Color(0xffd7a8), hemiGnd: new THREE.Color(0x9a4a4c), hemiI: 1.9, ambI: 0.25, sunC: new THREE.Color(0xffc98a), sunI: 3.4 };
    this.sunDir = new THREE.Vector3(-0.55, 0.3, -0.78).normalize();
  }

  get center() { return new THREE.Vector3(DUNE.x, DUNE.y, DUNE.z); }
  /** Is the player down here? */
  get active() {
    const p = this.game.player.pos, lx = p.x - DUNE.x, lz = p.z - DUNE.z, r = Math.hypot(lx, lz);
    return (r < BARRIER + 40 || (r < SHORE.r + JETTY.out + 20 && inSector(lx, lz, 0.05))) && p.y < DUNE.layerBelow; // (the ring, and the shore beyond its gap)
  }

  /** World height of the sand at world x, z. */
  heightAt(x, z) { return DUNE.y + localHeight(x - DUNE.x, z - DUNE.z); }

  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 0.7;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z), hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
  }

  /** Where you arrive: the oasis's south shore, at the foot of the pier, looking out over the water (yaw 0: north). */
  spawnPoint() {
    const x = DUNE.x + OASIS.x - 3, z = DUNE.z + POND.z - POND.rz - 7;
    return new THREE.Vector3(x, this.heightAt(x, z) + 0.05, z);
  }
  /** The height a board rides at: the sand, or the water where there is water over it (the skiff skims the pond). */
  rideHeight(x, z) {
    const h = this.heightAt(x, z), lx = x - DUNE.x, lz = z - DUNE.z;
    if (Math.abs(lx - POND.x) < POND.rx * 1.3 && Math.abs(lz - POND.z) < POND.rz * 1.3 && pondDepth(lx, lz) > 0) return Math.max(h, DUNE.y + POND.surface);
    if (lx > WELL.x0 && lx < WELL.x1 && lz > WELL.z0 && lz < WELL.z1) return Math.max(h, DUNE.y + WELL.surface);
    return h;
  }

  // ------------------------------------------------------------------ terrain
  buildTerrain() {
    const g = this.game;
    this.uniforms = { uTime: { value: 0 }, uWind: { value: new THREE.Vector2(Math.cos(WIND_AT), Math.sin(WIND_AT)) }, uSun: { value: new THREE.Vector3(-0.55, 0.3, -0.78).normalize() },
      uOasis: { value: new THREE.Vector4(DUNE.x + OASIS.x, DUNE.z + OASIS.z, OASIS.flat, DUNE.y + POND.surface) },
      uGlow: { value: 1 } }; // (the glints and the rim follow the sun: at night the sand does not shine, Calissa's R46 note)
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8b070, roughness: 0.92, metalness: 0 });
    const U = this.uniforms;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, this.trail.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nvarying vec3 vWN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * normal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vWP; varying vec3 vWN;
uniform float uTime, uGlow; uniform vec2 uWind; uniform vec3 uSun; uniform vec4 uOasis;
${TRAIL_GLSL}
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n21(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 nW = normalize(vWN);
  float lee = clamp(-dot(nW.xz, uWind) * 1.6, 0.0, 1.0);          // faces away from the wind: the steep side
  float sunl = clamp(dot(nW, uSun), 0.0, 1.0);
  vec3 lit = vec3(1.0, 0.82, 0.57), mid = vec3(0.94, 0.67, 0.49), shade = vec3(0.76, 0.47, 0.43);   // (a narrower range than it was)
  vec3 c = mix(mid, lit, smoothstep(0.35, 0.95, sunl));
  c = mix(c, shade, lee * 0.5 * (1.0 - smoothstep(0.5, 1.0, sunl)));
  vec2 p = vWP.xz;
  float dist = length(vViewPosition);
  float g = n21(p * 0.045) * 0.5 + n21(p * 0.3) * 0.5;               // slow patches of colour
  c *= 0.95 + 0.1 * g;
  // extra layers, each a little multiplied in: broad damp patches, mid-scale mottling, and a fine grain that fades with distance
  float dampP = smoothstep(0.45, 0.72, n21(p * 0.055 + 7.0));
  c = mix(c, c * vec3(0.93, 0.88, 0.87), dampP * 0.55);
  float mott = n21(p * 1.7) * 0.6 + n21(p * 0.55 + 3.0) * 0.4;
  c *= 0.95 + 0.1 * mott;
  float grain = h21(floor(p * 15.0));
  c *= 1.0 + (grain - 0.5) * 0.06 * (1.0 - smoothstep(10.0, 38.0, dist));
  // the oasis: sand darkened by the water at the shore, the bed under it, and grass in patches on the flat round it
  float ro = length(p - uOasis.xy), above = vWP.y - uOasis.w;
  float wet = (1.0 - smoothstep(0.1, 0.9, above)) * (1.0 - smoothstep(uOasis.z * 0.8, uOasis.z, ro));
  c = mix(c, c * vec3(0.62, 0.52, 0.48), wet * 0.8);
  float grass = (1.0 - smoothstep(uOasis.z * 0.55, uOasis.z * 0.95, ro)) * smoothstep(0.18, 0.4, above) * smoothstep(0.85, 0.96, nW.y);
  grass *= smoothstep(0.42, 0.56, n21(p * 0.08 + 5.0) * 0.65 + n21(p * 0.35) * 0.35 + (1.0 - smoothstep(0.0, 20.0, ro - 26.0)) * 0.3);
  vec3 gc = mix(vec3(0.42, 0.5, 0.24), vec3(0.58, 0.6, 0.3), n21(p * 0.7));
  c = mix(c, gc, grass * 0.85);
  diffuseColor.rgb = c;
}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  // wind ripples, running across the wind: the bands' width and their wander are both modulated, and they are softer
  vec2 wd = uWind; vec2 pd = vec2(-wd.y, wd.x);
  vec2 q = vWP.xz;
  float along = dot(q, wd), across = dot(q, pd);
  float warp = n21(q * 0.4) * 2.4 + n21(q * 0.11) * 6.0 + n21(q * 0.03 + 9.0) * 12.0;   // wander: a slow, large meander on top of the small one
  float width = (n21(q * 0.05 + 21.0) - 0.5) * 1.5;                                        // thickness: a bias that fattens some bands and thins others
  float ph = along * 2.2 + warp + 0.7 * sin(across * 0.09 + n21(q * 0.2) * 4.0);
  float rip = clamp(cos(ph) + width, -1.0, 1.0) * (0.10 + 0.06 * n21(q * 0.9));
  // a second, fainter set across the first, only in patches
  float rip2 = cos(across * 3.6 + n21(q * 0.7) * 3.0) * 0.045 * smoothstep(0.42, 0.75, n21(q * 0.09 + 13.0));
  float tr2 = trailAt(vWP.xz);
  rip *= 1.0 - 0.85 * smoothstep(0.0, 0.5, tr2);                      // the ripples are smoothed out along a path
  vec3 gw = vec3(wd.x, 0.0, wd.y) * rip + vec3(pd.x, 0.0, pd.y) * rip2;
  vec2 tg = trailGrad(vWP.xz);                                        // and its edges catch the light
  gw += vec3(-tg.x, 0.0, -tg.y) * 1.3;
  normal = normalize(normal + (viewMatrix * vec4(gw, 0.0)).xyz);
}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  // glints: a few grains that catch the light, fixed in the world
  vec2 cell = floor(vWP.xz * 9.0);
  float r = h21(cell);
  float sp = step(0.9965, r) * 0.7;                                   // (still: no flicker, no time, no view term)
  float rim = pow(1.0 - clamp(dot(normalize(vViewPosition), normalize(vNormal)), 0.0, 1.0), 3.0);
  totalEmissiveRadiance += vec3(1.0, 0.86, 0.6) * (sp * 2.2 + rim * 0.16) * uGlow;
}`);
    };
    // the sand's grain from the world (render/triplanar.js: Calissa's CC0 sand on the tops, packed sand on the steep lee faces), over
    // the colour above: the texture's own light and shade, the palette the shader's
    triplanar(mat, { side: surfaceTexture('sand_packed'), top: surfaceTexture('sand'), scale: 0.25, strength: 0.8 });
    g.paintmap?.patch(mat); // (the paint and the Shore's stains on it: world/ground/paintmap.js)
    // the field: chunks with levels of detail (render/terrain.js), sampled once from the one height function
    const TR = (this.chunks = new ChunkTerrain({ height: localHeight, half: DUNE.half, step: DUNE.step, chunk: 32, outer: DUNE.outer, outerStep: 20, material: mat }));
    const mesh = TR.mesh;
    mesh.position.set(DUNE.x, DUNE.y, DUNE.z);
    mesh.receiveShadow = true;
    g.scene.add(mesh);
    this.terrain = mesh;
    // the collider: a height field of the same samples, at the same place (the ring beyond the barrier needs none)
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(DUNE.x, DUNE.y, DUNE.z));
    const cd = RAPIER.ColliderDesc.heightfield(TR.n - 1, TR.n - 1, TR.heights, { x: DUNE.half * 2, y: 1, z: DUNE.half * 2 }).setFriction(0.9).setCollisionGroups(GROUPS.static);
    g.physics.world.createCollider(cd, body);
    this.body = body;
  }

  // ------------------------------------------------------------------ sky
  buildSky() {
    const g = this.game;
    // the painting the game's maker drew (sky.js), with the sun laid over it
    const dome = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), g.sky.domeMaterial(new THREE.Vector3(-0.55, 0.3, -0.78)));
    dome.frustumCulled = false; dome.renderOrder = -10;
    g.scene.add(dome);
    this.sky = dome;
    // and the one thing in it that moves: a layer of cloud going downwind (vfx/clouds.js)
    this.clouds = new CloudLayer(g.scene, { sun: new THREE.Vector3(-0.55, 0.3, -0.78) });
  }

  // ------------------------------------------------------------------ ruins and the spire
  buildRuins() {
    const g = this.game, S = g.scene;
    this.group = new THREE.Group();
    S.add(this.group);
    const clay = new THREE.MeshStandardMaterial({ color: 0xd9906a, roughness: 0.9, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x8a4a3a, roughness: 0.9, flatShading: true });
    const glow = new THREE.MeshBasicMaterial({ color: 0xffd696 });
    const W = g.physics.world;
    const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const solid = (mesh, halfExtents, pos, quat) => {
      mesh.castShadow = mesh.receiveShadow = true;
      addOutline(mesh);
      mesh.position.copy(pos); mesh.quaternion.copy(quat);
      this.group.add(mesh);
      const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(quat));
      W.createCollider(RAPIER.ColliderDesc.cuboid(...halfExtents).setCollisionGroups(GROUPS.static).setFriction(0.9), b);
    };
    // the obelisks and the broken columns are STATIC SLICEABLE props (tags.js): one mesh each, in one batch (render/propbatch.js) so
    // they draw as one, with a fixed collider; the Cleave or a blade takes one out of the batch and cuts it into loose pieces
    this.batch = new PropBatch(S);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true });
    const painted = (geo, color) => { const g2 = geo.index ? geo.toNonIndexed() : geo; const c = new THREE.Color(color), n = g2.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g2.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g2.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g2.deleteAttribute(k); return g2; };
    const sliceable = (geo, halfExtents, pos, quat, baseColor, collider = null) => {
      const mesh = new THREE.Mesh(geo, stoneMat);
      mesh.castShadow = mesh.receiveShadow = true;
      addOutline(mesh);
      mesh.position.copy(pos); mesh.quaternion.copy(quat);
      S.add(mesh);
      const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(quat));
      const col = W.createCollider((collider || RAPIER.ColliderDesc.cuboid(...halfExtents)).setCollisionGroups(GROUPS.static).setFriction(0.9), b);
      const ent = tag({ type: 'prop', body: b, mesh, owner: this, baseColor: new THREE.Color(baseColor), M: MATERIALS.stoneware, kind: 'ruin' }, 'sliceable', 'static', 'stone');
      g.physics.register(col, ent);
      register(ent);
      mesh.updateMatrixWorld();
      ent.parked = this.batch.park(mesh, 'dunes');
      return ent;
    };
    const UPV = new THREE.Vector3(0, 1, 0);
    const place = (rx, rz) => { const x = DUNE.x + rx, z = DUNE.z + rz; return new THREE.Vector3(x, this.heightAt(x, z), z); };
    // (twice the sea: twice as far out, four times the ground, so about twice as many of each; none on the oasis, none past the barrier)
    const R0 = OASIS.flat + 40, R1 = BARRIER - 25;
    // obelisks with a glowing band, standing or leaning, sunk into the sand
    for (let i = 0; i < 30; i++) {
      const a = rnd() * Math.PI * 2, r = R0 + rnd() * (R1 - R0);
      const p = place(Math.cos(a) * r, Math.sin(a) * r);
      const h = 7 + rnd() * 12, w = 1.3 + rnd() * 1.0;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.28, rnd() * 6.28, (rnd() - 0.5) * 0.28));
      // (one geometry: the shaft, its glowing band and its cap, painted in vertex colours, so a cut goes through all of it)
      const band = painted(new THREE.BoxGeometry(w * 1.02, 0.25, w * 1.02).translate(0, h * 0.22, 0), 0xffd696);
      const cap = painted(new THREE.ConeGeometry(w * 0.72, w * 1.1, 4).rotateY(Math.PI / 4).translate(0, h / 2 + w * 0.5, 0), 0x8a4a3a);
      const geo = mergeGeometries([painted(new THREE.BoxGeometry(w, h, w), 0xd9906a), band, cap]);
      const c = p.clone().addScaledVector(UPV.clone().applyQuaternion(q), h / 2 - 2.2);
      sliceable(geo, [w / 2, h / 2, w / 2], c, q, 0xd9906a);
    }
    // arches: two pillars and a lintel
    for (let i = 0; i < 13; i++) {
      const a = rnd() * Math.PI * 2, r = R0 + 10 + rnd() * (R1 - R0 - 10);
      const p = place(Math.cos(a) * r, Math.sin(a) * r), yaw = rnd() * 6.28;
      const gap = 5 + rnd() * 3, h = 7 + rnd() * 3, w = 1.6;
      const q = new THREE.Quaternion().setFromAxisAngle(UPV, yaw);
      const side = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      for (const sgn of [-1, 1]) {
        const pp = p.clone().addScaledVector(side, sgn * gap / 2);
        pp.y = this.heightAt(pp.x, pp.z);
        solid(new THREE.Mesh(new THREE.BoxGeometry(w, h + 2, w), clay), [w / 2, (h + 2) / 2, w / 2], pp.clone().setY(pp.y + h / 2 - 1), q);
      }
      const my = Math.max(this.heightAt(p.x + side.x * gap / 2, p.z + side.z * gap / 2), this.heightAt(p.x - side.x * gap / 2, p.z - side.z * gap / 2));
      solid(new THREE.Mesh(new THREE.BoxGeometry(gap + w * 1.6, 1.3, w * 1.2), dark), [(gap + w * 1.6) / 2, 0.65, w * 0.6], new THREE.Vector3(p.x, my + h - 0.6, p.z), q);
    }
    // broken columns half sunk in the sand
    this.columns = []; // (each broken column's foot on the sand: the ruins' ostraca lean there, world/ostraca.js)
    for (let i = 0; i < 48; i++) {
      const a = rnd() * Math.PI * 2, r = R0 - 20 + rnd() * (R1 - R0 + 20);
      const p = place(Math.cos(a) * r, Math.sin(a) * r); this.columns.push(p.clone());
      const h = 2.5 + rnd() * 4.5, w = 0.9 + rnd() * 0.7;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.9, rnd() * 6.28, (rnd() - 0.5) * 0.9));
      const c = p.clone().addScaledVector(UPV.clone().applyQuaternion(q), h / 2 - 1.0);
      const col = rnd() < 0.5 ? 0xd9906a : 0x8a4a3a;
      sliceable(painted(new THREE.CylinderGeometry(w * 0.8, w, h, 8), col), null, c, q, col, RAPIER.ColliderDesc.cylinder(h / 2, w * 0.9));
    }
    // the spire: a pale needle far off, with a beam of light, to sail toward
    const sp = place(-300, -270); this.gnomon = sp.clone(); // (the Gnomon (Espada's): the Solar Skiffing trial begins at its foot, world/dunes/solar.js)
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(3, 16, 150, 6), new THREE.MeshStandardMaterial({ color: 0xf6d9b8, roughness: 0.8, flatShading: true }));
    spire.position.set(sp.x, sp.y + 65, sp.z);
    spire.castShadow = true;
    addOutline(spire);
    this.group.add(spire);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 6, 700, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe3b0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.set(sp.x, sp.y + 400, sp.z);
    this.group.add(beam);
    this.beam = beam;
    const sb = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(sp.x, sp.y + 65, sp.z));
    W.createCollider(RAPIER.ColliderDesc.cylinder(75, 9).setCollisionGroups(GROUPS.static), sb);
    this.spire = sp;
    // the ruins never move: their parts are baked into one mesh per look (render/merge.js): a dozen draws for the whole sea
    this.group.updateMatrixWorld(true);
    for (const m of [...this.group.children]) for (const k of [...m.children]) if (!k.userData.isOutline) { this.group.attach(k); if (!k.material.isMeshBasicMaterial) addOutline(k); }
    this.beam.name = 'beam'; // (kept apart: its light breathes)
    mergeStatic(this.group);
  }

  /** A ruin taken apart (breakables.js removeAny): out of the batch, out of the world. */
  /** A gust: the wind swings round to blow toward `dir` (Vector2, x/z) for `dur` seconds, stronger, then back (the Galestorm). */
  gust(dir, dur = 10) { this.gustA = Math.atan2(dir.y, dir.x); this.gustDur = dur; this.gustT = dur; }

  removeProp(e) {
    if (e.parked) { this.batch.unpark(e.parked); e.parked = null; }
    this.game.scene.remove(e.mesh);
    this.game.physics.removeBody(e.body);
  }

  setVisible(v) {
    this.terrain.visible = this.sky.visible = this.group.visible = this.clouds.visible = v;
  }

  // ------------------------------------------------------------------ per frame
  /** The workshop's sun as it was before the Dunes took it: its frame, its place and its aim. */
  giveSunBack() {
    const L = this.lights, sh = L.sun.shadow.camera, s = this.saved;
    sh.left = s.l; sh.right = s.r; sh.top = s.t; sh.bottom = s.b; sh.near = s.n; sh.far = s.f; sh.updateProjectionMatrix();
    L.sun.position.copy(s.pos); L.sun.target.position.copy(s.at); L.sun.target.updateMatrixWorld();
    this.shadowed = false;
  }

  update(dt) {
    const g = this.game, cam = g.camera, L = this.lights;
    this.t += dt;
    // where the camera is decides the light
    const inside = (Math.hypot(cam.position.x - DUNE.x, cam.position.z - DUNE.z) < DUNE.outer && cam.position.y < DUNE.layerBelow) || !!g.emocean?.stage.active || openSea(cam.position); // (a crossing and a far dock are under the same sky: world/emocean/)
    this.mix = THREE.MathUtils.damp(this.mix, inside ? 1 : 0, 3, dt);
    // (the open sea is drawn further than a room: the camera's far plane opens out down here, and the fog closes it)
    const far = THREE.MathUtils.lerp(200, 420, this.mix);
    if (Math.abs(cam.far - far) > 1) { cam.far = far; cam.updateProjectionMatrix(); }
    // (the workshop's sun given back the moment the camera leaves, its place and aim with its frame: kept, it lit the Throwing Room from
    // the Dunes' low angle and followed the Courier in 4 m snaps while the light faded: the owner's R13)
    if (!inside && this.shadowed) this.giveSunBack();
    if (this.mix < 0.002) {
      this.mix = 0; if (this.terrain.visible) this.setVisible(false);
      return;
    }
    if (!this.terrain.visible) this.setVisible(true);
    // the wind wanders
    let dirA = WIND_AT + Math.sin(this.t * 0.02) * 0.08; // (a steady wind, as at sea: it is shown, not guessed at)
    // (a gust called up by the Soul Brush's Galestorm: the wind swings round to it, holds, and swings back)
    let gk = 0;
    if (this.gustT > 0) {
      this.gustT -= dt;
      gk = Math.min(1, (this.gustDur - this.gustT) / 1.2, this.gustT / 2.5);
      gk = gk * gk * (3 - 2 * gk);
      let d = this.gustA - dirA; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      dirA += d * gk;
    }
    this.wind.dir.set(Math.cos(dirA), Math.sin(dirA));
    this.wind.gust = (1 + 0.08 * Math.sin(this.t * 0.25)) * (1 + 0.5 * gk);
    this.wind.speed = 8 * this.wind.gust;
    this.uniforms.uTime.value = this.t;
    this.sky.position.copy(cam.position);
    this.clouds.update(dt, cam.position, this.wind.dir, this.wind.speed);
    this.chunks.update(cam.position.x - DUNE.x, cam.position.z - DUNE.z);
    if (this.active) this.barrier.update(dt);
    this.beam.material.opacity = 0.13 + 0.05 * Math.sin(this.t * 0.7);
    // the light: a low gold sun, its shadow following the player
    const k = this.mix, A = this.away, H = this.home, sc = g.scene;
    sc.background.copy(H.bg).lerp(A.bg, k);
    sc.fog.color.copy(H.fog).lerp(A.fog, k);
    sc.fog.density = THREE.MathUtils.lerp(H.fogD, A.fogD, k);
    L.hemi.color.copy(H.hemiSky).lerp(A.hemiSky, k);
    L.hemi.groundColor.copy(H.hemiGnd).lerp(A.hemiGnd, k);
    L.hemi.intensity = THREE.MathUtils.lerp(H.hemiI, A.hemiI, k);
    L.amb.intensity = THREE.MathUtils.lerp(H.ambI, A.ambI, k);
    L.sun.color.copy(H.sunC).lerp(A.sunC, k);
    const P = g.player.renderPos;
    if (inside) {
      const sh = L.sun.shadow.camera;
      if (!this.shadowed) { this.saved = { l: sh.left, r: sh.right, t: sh.top, b: sh.bottom, n: sh.near, f: sh.far, pos: L.sun.position.clone(), at: L.sun.target.position.clone() }; this.shadowed = true; sh.left = sh.bottom = -32; sh.right = sh.top = 32; sh.near = 1; sh.far = 120; sh.updateProjectionMatrix(); }
      const cx = Math.round(P.x / 4) * 4, cz = Math.round(P.z / 4) * 4;
      L.sun.position.set(cx + this.sunDir.x * 50, P.y + this.sunDir.y * 50 + 12, cz + this.sunDir.z * 50);
      L.sun.target.position.set(cx, P.y, cz);
      L.sun.target.updateMatrixWorld();
    }
    // (the caller sets sun.intensity from `under`: see main.js; here the dune value is offered)
    this.sunIntensity = A.sunI;
    this.uniforms.uGlow.value = THREE.MathUtils.clamp(L.sun.intensity / A.sunI, 0, 1); // (last frame's sun, after the hour and the weather)
    // what has passed over the sand: the fading path, and the spray
    this.marks.update(dt, this.active);
    this.trail.update(dt, P.x, P.z);
  }
}
