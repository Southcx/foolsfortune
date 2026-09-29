import * as THREE from 'three';
import { TrailMap, TRAIL_GLSL } from './trailmap.js';
import { SandMarks, SAND } from './marks.js';
import { RAPIER, GROUPS } from './physics.js';
import { T, PALETTE } from './config.js';
import { addOutline } from './outline.js';

// ---------------------------------------------------------------------------------------
// THE DUNES: a layer far below the workshop, a sand sea in the manner of Journey: long
// sweeping dunes with sharp crests and steep lee faces, glinting sand, a low gold sun in a
// teal-to-rose sky, half-buried ruins and a pale spire in the distance to sail toward. It is
// crossed on the Solar Surfer (moves/surfer.js), a sail-board that catches the wind.
//
// The ground is one height function (heightAt) that the mesh, the collider, the board's hover
// and the particles all read, so they can never disagree. It lies at ORIGIN, well away from the
// lab's rooms (in x and z as well as in y) so nothing there can trigger on it.
// ---------------------------------------------------------------------------------------
export const DUNE = { x: 2000, y: -420, z: 0, size: 640, res: 321, layerBelow: -150 };
const HALF = DUNE.size / 2;
const WIND_AT = 0.55; // (radians) the way the wind blows toward, on average

const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
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

/** Local ground height (metres above the layer's floor) at local x, z (origin at the centre). */
export function localHeight(x, z) {
  const wx = Math.cos(WIND_AT), wz = Math.sin(WIND_AT);
  const px = x + (fbm(x * 0.004 + 11, z * 0.004, 3) - 0.43) * 130;
  const pz = z + (fbm(x * 0.004, z * 0.004 + 37, 3) - 0.43) * 130;
  const s = (px * wx + pz * wz) / 112 + (fbm(px * 0.006 + 3, pz * 0.006 + 9, 3) - 0.43) * 3.4;
  const amp = 6 + 13 * fbm(px * 0.0032 + 5, pz * 0.0032 - 2, 2);
  const r0 = Math.hypot(x, z);
  const calm = 0.38 + 0.62 * sstep(14, 70, r0); // (a gentler basin where you arrive)
  let h = duneProfile(s - Math.floor(s)) * amp * calm;
  const s2 = (px * -wz + pz * wx) / 46 + (fbm(px * 0.011, pz * 0.011, 2) - 0.43) * 2.4;
  h += duneProfile(s2 - Math.floor(s2)) * 2.4 * sstep(0.35, 0.65, fbm(px * 0.005 + 20, pz * 0.005, 2)) * calm;
  h += (fbm(px * 0.0022, pz * 0.0022 + 7, 3) - 0.43) * 22;
  const edge = sstep(215, 305, Math.hypot(x, z)); // a bowl of mountains round the sea
  h += edge * edge * 150 + edge * 30;
  return h + 14;
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
    this.setVisible(false);
    // the values the workshop is lit with (blended back to when you leave)
    const sc = game.scene;
    this.home = { bg: sc.background.clone(), fog: sc.fog.color.clone(), fogD: sc.fog.density, hemiSky: lights.hemi.color.clone(), hemiGnd: lights.hemi.groundColor.clone(), hemiI: lights.hemi.intensity, ambI: lights.amb.intensity, sunC: lights.sun.color.clone(), sunI: lights.sun.intensity };
    this.away = { bg: new THREE.Color(0xf0b98a), fog: new THREE.Color(0xe6a47c), fogD: 0.0042, hemiSky: new THREE.Color(0xffd7a8), hemiGnd: new THREE.Color(0x9a4a4c), hemiI: 1.9, ambI: 0.25, sunC: new THREE.Color(0xffc98a), sunI: 3.4 };
    this.sunDir = new THREE.Vector3(-0.55, 0.3, -0.78).normalize();
  }

  get center() { return new THREE.Vector3(DUNE.x, DUNE.y, DUNE.z); }
  /** Is the player down here? */
  get active() { const p = this.game.player.pos; return Math.abs(p.x - DUNE.x) < 340 && Math.abs(p.z - DUNE.z) < 340 && p.y < DUNE.layerBelow; }

  /** World height of the sand at world x, z. */
  heightAt(x, z) { return DUNE.y + localHeight(x - DUNE.x, z - DUNE.z); }

  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 0.7;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z), hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
  }

  spawnPoint() {
    const x = DUNE.x + 6, z = DUNE.z + 4;
    return new THREE.Vector3(x, this.heightAt(x, z) + 1.6, z);
  }

  // ------------------------------------------------------------------ terrain
  buildTerrain() {
    const g = this.game, N = DUNE.res, step = DUNE.size / (N - 1);
    const heights = new Float32Array(N * N);
    const pos = new Float32Array(N * N * 3), nor = new Float32Array(N * N * 3);
    let hmin = 1e9;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -HALF + i * step, z = -HALF + j * step;
      const y = localHeight(x, z);
      hmin = Math.min(hmin, y);
      pos[(j * N + i) * 3] = x; pos[(j * N + i) * 3 + 1] = y; pos[(j * N + i) * 3 + 2] = z;
      heights[i * N + j] = y; // (column-major: rows run along x)
    }
    // normals from the height field itself
    const hAt = (i, j) => pos[(Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))) * 3 + 1];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const nx = hAt(i - 1, j) - hAt(i + 1, j), nz = hAt(i, j - 1) - hAt(i, j + 1), ny = 2 * step;
      const l = Math.hypot(nx, ny, nz);
      const o = (j * N + i) * 3;
      nor[o] = nx / l; nor[o + 1] = ny / l; nor[o + 2] = nz / l;
    }
    const idx = new Uint32Array((N - 1) * (N - 1) * 6);
    let k = 0;
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
      const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 0), DUNE.size);
    geo.boundingBox = new THREE.Box3(new THREE.Vector3(-HALF, -10, -HALF), new THREE.Vector3(HALF, 240, HALF));
    this.uniforms = { uTime: { value: 0 }, uWind: { value: new THREE.Vector2(Math.cos(WIND_AT), Math.sin(WIND_AT)) }, uSun: { value: new THREE.Vector3(-0.55, 0.3, -0.78).normalize() } };
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
uniform float uTime; uniform vec2 uWind; uniform vec3 uSun;
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
  totalEmissiveRadiance += vec3(1.0, 0.86, 0.6) * (sp * 2.2 + rim * 0.16);
}`);
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(DUNE.x, DUNE.y, DUNE.z);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    g.scene.add(mesh);
    this.terrain = mesh;
    // the collider: a height field, at the same place
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(DUNE.x, DUNE.y, DUNE.z));
    const cd = RAPIER.ColliderDesc.heightfield(N - 1, N - 1, heights, { x: DUNE.size, y: 1, z: DUNE.size }).setFriction(0.9).setCollisionGroups(GROUPS.static);
    g.physics.world.createCollider(cd, body);
    this.body = body;
  }

  // ------------------------------------------------------------------ sky
  buildSky() {
    const g = this.game;
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: new THREE.Vector3(-0.55, 0.3, -0.78).normalize() }, uTime: { value: 0 } },
      vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uSun; uniform float uTime;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n21(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 d = normalize(vD);
  float h = d.y;
  vec3 hor = vec3(1.0, 0.72, 0.50), low = vec3(0.93, 0.50, 0.44), mid = vec3(0.42, 0.42, 0.58), top = vec3(0.10, 0.20, 0.36);
  vec3 c = mix(hor, low, smoothstep(0.0, 0.12, h));
  c = mix(c, mid, smoothstep(0.08, 0.42, h));
  c = mix(c, top, smoothstep(0.35, 0.95, h));
  float sd = max(dot(d, normalize(uSun)), 0.0);
  c += vec3(1.0, 0.82, 0.5) * (pow(sd, 900.0) * 6.0 + pow(sd, 40.0) * 0.55 + pow(sd, 6.0) * 0.28);
  // long streaks of cloud
  vec2 cp = d.xz / (0.25 + max(h, 0.0) + 0.3) * 2.4;
  float cl = smoothstep(0.55, 0.9, n21(vec2(cp.x * 0.7 + uTime * 0.01, cp.y * 3.5)) * n21(cp * 1.7 + 4.0) * 1.9) * smoothstep(0.0, 0.25, h) * (1.0 - smoothstep(0.5, 0.8, h));
  c = mix(c, vec3(1.0, 0.75, 0.62), cl * 0.55);
  // stars, high up
  float st = step(0.9982, h21(floor(d.xz / (0.004 + 0.0) * 0.6 + d.y * 300.0))) * smoothstep(0.5, 0.9, h);
  c += vec3(st) * 0.7;
  // below the horizon: haze
  c = mix(c, vec3(0.93, 0.62, 0.48), smoothstep(0.0, -0.25, h));
  gl_FragColor = vec4(c, 1.0);
}`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), mat);
    dome.frustumCulled = false; dome.renderOrder = -10;
    g.scene.add(dome);
    this.sky = dome;
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
    const UPV = new THREE.Vector3(0, 1, 0);
    const place = (rx, rz) => { const x = DUNE.x + rx, z = DUNE.z + rz; return new THREE.Vector3(x, this.heightAt(x, z), z); };
    // obelisks with a glowing band, standing or leaning, sunk into the sand
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = 45 + rnd() * 170;
      const p = place(Math.cos(a) * r, Math.sin(a) * r);
      const h = 7 + rnd() * 12, w = 1.3 + rnd() * 1.0;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.28, rnd() * 6.28, (rnd() - 0.5) * 0.28));
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), clay);
      const band = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.25, w * 1.02), glow);
      band.position.y = h * 0.22;
      m.add(band);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, w * 1.1, 4), dark);
      cap.position.y = h / 2 + w * 0.5; cap.rotation.y = Math.PI / 4;
      m.add(cap);
      const c = p.clone().addScaledVector(UPV.clone().applyQuaternion(q), h / 2 - 2.2);
      solid(m, [w / 2, h / 2, w / 2], c, q);
    }
    // arches: two pillars and a lintel
    for (let i = 0; i < 7; i++) {
      const a = rnd() * Math.PI * 2, r = 60 + rnd() * 150;
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
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2, r = 25 + rnd() * 215;
      const p = place(Math.cos(a) * r, Math.sin(a) * r);
      const h = 2.5 + rnd() * 4.5, w = 0.9 + rnd() * 0.7;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.9, rnd() * 6.28, (rnd() - 0.5) * 0.9));
      const c = p.clone().addScaledVector(UPV.clone().applyQuaternion(q), h / 2 - 1.0);
      solid(new THREE.Mesh(new THREE.CylinderGeometry(w * 0.8, w, h, 8), rnd() < 0.5 ? clay : dark), [w * 0.8, h / 2, w * 0.8], c, q);
    }
    // the spire: a pale needle far off, with a beam of light, to sail toward
    const sp = place(-215, -195);
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
  }

  setVisible(v) {
    this.terrain.visible = this.sky.visible = this.group.visible = v;
  }

  // ------------------------------------------------------------------ per frame
  update(dt) {
    const g = this.game, cam = g.camera, L = this.lights;
    this.t += dt;
    // where the camera is decides the light
    const inside = Math.abs(cam.position.x - DUNE.x) < 400 && Math.abs(cam.position.z - DUNE.z) < 400;
    this.mix = THREE.MathUtils.damp(this.mix, inside ? 1 : 0, 3, dt);
    if (this.mix < 0.002) {
      this.mix = 0; if (this.terrain.visible) this.setVisible(false);
      if (this.shadowed) { const sh = L.sun.shadow.camera, s = this.saved; sh.left = s.l; sh.right = s.r; sh.top = s.t; sh.bottom = s.b; sh.near = s.n; sh.far = s.f; sh.updateProjectionMatrix(); this.shadowed = false; }
      return;
    }
    if (!this.terrain.visible) this.setVisible(true);
    // the wind wanders
    const dirA = WIND_AT + Math.sin(this.t * 0.02) * 0.08; // (a steady wind, as at sea: it is shown, not guessed at)
    this.wind.dir.set(Math.cos(dirA), Math.sin(dirA));
    this.wind.gust = 1 + 0.08 * Math.sin(this.t * 0.25);
    this.wind.speed = 8 * this.wind.gust;
    this.uniforms.uTime.value = this.t;
    this.sky.position.copy(cam.position);
    this.sky.material.uniforms.uTime.value = this.t;
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
    const cx = Math.round(P.x / 4) * 4, cz = Math.round(P.z / 4) * 4;
    L.sun.position.set(cx + this.sunDir.x * 50, P.y + this.sunDir.y * 50 + 12, cz + this.sunDir.z * 50);
    const sh = L.sun.shadow.camera;
    if (!this.shadowed) { this.saved = { l: sh.left, r: sh.right, t: sh.top, b: sh.bottom, n: sh.near, f: sh.far }; this.shadowed = true; sh.left = sh.bottom = -32; sh.right = sh.top = 32; sh.near = 1; sh.far = 120; sh.updateProjectionMatrix(); }
    L.sun.target.position.set(cx, P.y, cz);
    L.sun.target.updateMatrixWorld();
    // (the caller sets sun.intensity from `under`: see main.js; here the dune value is offered)
    this.sunIntensity = A.sunI;
    // what has passed over the sand: the fading path, and the spray
    this.marks.update(dt, this.active);
    this.trail.update(dt, P.x, P.z);
  }
}
