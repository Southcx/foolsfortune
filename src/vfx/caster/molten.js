// ---------------------------------------------------------------------------------------
// MOLTEN (caster shader S9): a lava-lamp metaball with a crust, for the Firebox's shells (22 Meteor, 23 Lava Lamp, 29 Volcano, 30 Slag
// Rain: docs/plans/CASTER-SHELLS.md). Molten clay: blobs that rise, swell, pinch off and merge as wax does in a lava lamp, glowing
// from gold-white to a deep orange, and a crust of fired clay that forms over them as they cool: dark plates with the heat showing in
// the cracks between, the plates closing up as `crust` rises (a meteor's pool cooling, a glob crusting as it slows). Teaches, without
// saying so, how lava cools: a skin first, plates, the glow last in the seams.
//
// It is one mesh: a sphere that bounds the blobs, its back faces drawn, and inside it the surface found by marching each ray against
// the blobs' smooth union (a signed distance; smooth-min). It writes its own depth (so it sits in the world, things passing through it),
// and its edge is softened by coverage (alpha to coverage on the glow's 4x target) where a ray only grazes it, so the silhouette does
// not stair-step. Lit by a light of its own (the sun's direction, settable) with its glow above white, so the bloom takes it. One
// shared material for every molten thing: each one's blobs are set as it is drawn.
//
// Comfort (CLAUDE.md, no aliasing crawl): the crack lines are drawn to their screen width (fwidth); the crust drifts slowly; the blobs
// move smoothly (a blob is never born or killed in a frame: its radius eases).
//
// Prior art: Blinn's blobby objects (1982) and Wyvill's soft objects, Inigo Quilez's smooth minimum and his sphere-tracing of signed
// distances, the lava lamp shaders after them; pahoehoe's crust and its glowing cracks (the Hawaiian flows), and Worley's cellular
// noise (1996) for the plates.
//
//   const m = create(game, { size, heat, crust, blobs, speed, soft, mode: 'lamp' | 'glob', light })   (size: the bounding radius, m)
//   m.group (place it)   m.set({ ... })   m.k = 0..1 (its blobs grow from nothing, or shrink to it)   m.update(dt)   m.dispose()
//   prewarm(game) -> park   (the boot's warm-up: its program compiled, then park() takes the stand-in away)
//   layer(game, L, ctx)   the effect library's `caster` layer (vfx/vfx.js): `{ type: 'caster', shader: 'molten', size, crust, ... }`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const N = 8;
const VERT = /* glsl */`
varying vec3 vObj;
void main() { vObj = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */`
#define N ${N}
uniform mat4 projectionMatrix, modelViewMatrix; // (the vertex stage's own, read here for the depth written)
uniform vec4 uBall[N]; uniform int uCount; uniform vec3 uCamObj, uLight, uHot, uWarm, uCrustCol; uniform float uR, uSoft, uHeat, uCrust, uT, uPix;
varying vec3 vObj;
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float map(vec3 p) { float d = 1e5; for (int i = 0; i < N; i++) { if (i >= uCount) break; d = smin(d, length(p - uBall[i].xyz) - uBall[i].w, uSoft); } return d; }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// the plates: the gap between the nearest two cell centres (Worley's F2 - F1), small along a crack
float plates(vec3 p) {
  vec3 i = floor(p), f = fract(p); float f1 = 8.0, f2 = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z)), o = vec3(hash3(i + g), hash3(i + g + 17.0), hash3(i + g + 41.0));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
void main() {
  vec3 rd = normalize(vObj - uCamObj);
  float b = dot(uCamObj, rd), c = dot(uCamObj, uCamObj) - uR * uR, D = b * b - c;
  if (D < 0.0) discard;
  float s = sqrt(D), t = max(-b - s, 0.0), t1 = -b + s, minD = 1e5, tMin = t; bool hit = false;
  for (int i = 0; i < 56; i++) {
    float d = map(uCamObj + rd * t);
    if (d < minD) { minD = d; tMin = t; }
    if (d < 0.0015 * uR) { hit = true; break; }
    t += max(d * 0.85, 0.002 * uR);
    if (t > t1) break;
  }
  float cov = hit ? 1.0 : 1.0 - smoothstep(0.0, uPix * tMin * 1.5, minD); // (a grazing ray: partly covered, so the edge is soft)
  if (cov < 0.02) discard;
  vec3 p = uCamObj + rd * (hit ? t : tMin);
  vec2 e = vec2(0.002 * uR, -0.002 * uR);
  vec3 n = normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
  // the crust: where the slow noise is under the crust amount, plates of fired clay; the heat in the cracks between them
  vec3 q = p / uR * 2.2 + vec3(0.0, -uT * 0.06, uT * 0.02);
  float nz = 0.65 * vn3(q * 1.3) + 0.35 * vn3(q * 2.9);
  float formed = smoothstep(-0.06, 0.06, uCrust * 1.25 - 0.1 - nz);
  float gap = plates(q * 1.4 + nz * 0.8), cw = mix(0.32, 0.05, uCrust), fw = fwidth(gap);
  float crack = 1.0 - smoothstep(cw * 0.4 - fw, cw + fw, gap);
  float glow = (1.0 - formed) + formed * crack * 0.85;
  vec3 v = -rd, l = normalize(uLight);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float swirl = vn3(q * 3.1 + vec3(uT * 0.15, 0.0, 0.0)); // (the melt's own slow churn of hotter and cooler)
  float hk = clamp(uHeat * (0.1 + 0.9 * swirl * swirl) - fres * 0.5, 0.0, 1.0);
  vec3 hot = mix(uWarm, uHot, hk * hk) * (0.35 + 0.95 * uHeat); // (gold-white only in the hottest churn; orange at the rim)
  vec3 rock = uCrustCol * (0.22 + 0.78 * max(dot(n, l), 0.0)) + uCrustCol * fres * 0.6;
  vec3 col = mix(rock, hot, glow);
  gl_FragColor = vec4(col, cov);
  vec4 cp = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_FragDepth = clamp(cp.z / cp.w * 0.5 + 0.5, 0.0, 1.0);
}`;

let MAT = null, GEO = null; // (one material and one bounding sphere for every molten thing)
function material() {
  if (MAT) return MAT;
  const u = { uBall: { value: Array.from({ length: N }, () => new THREE.Vector4()) }, uCount: { value: 0 }, uCamObj: { value: new THREE.Vector3() }, uLight: { value: new THREE.Vector3(0.4, 0.8, 0.3) },
    uHot: { value: new THREE.Color(0xfff0b0) }, uWarm: { value: new THREE.Color(0xe0400c) }, uCrustCol: { value: new THREE.Color(0x2e1d16) },
    uR: { value: 1 }, uSoft: { value: 0.3 }, uHeat: { value: 1 }, uCrust: { value: 0 }, uT: { value: 0 }, uPix: { value: 0.003 } };
  MAT = new THREE.ShaderMaterial({ name: 'caster-molten', vertexShader: VERT, fragmentShader: FRAG, uniforms: u, side: THREE.BackSide, alphaToCoverage: true, fog: false });
  return MAT;
}

export const MOLTEN_DEFAULTS = { size: 0.6, heat: 0.85, crust: 0.25, blobs: 6, speed: 1, soft: 0.35, mode: 'lamp', light: [0.4, 0.8, 0.3] };
const _c = new THREE.Vector3(), _db = new THREE.Vector2();

export class Molten {
  constructor(game, o = {}) {
    this.game = game; this.k = o.k ?? 1; this.t = Math.random() * 20;
    this.p = { ...MOLTEN_DEFAULTS };
    this.set(o);
    this.balls = Array.from({ length: N }, (_, i) => ({ v: new THREE.Vector4(), r: 0, ph: i * 2.39 + Math.random(), per: 7 + ((i * 3.7) % 5), wob: 0.6 + (i % 3) * 0.3 }));
    this.mesh = new THREE.Mesh(GEO ||= new THREE.IcosahedronGeometry(1, 2), material());
    this.mesh.frustumCulled = true; this.mesh.castShadow = false;
    this.mesh.onBeforeRender = (r, s, cam, geo, mat) => {
      const U = mat.uniforms;
      for (let i = 0; i < N; i++) U.uBall.value[i].copy(this.balls[i].v);
      U.uCount.value = N; U.uR.value = 1; U.uSoft.value = this.p.soft; U.uHeat.value = this.p.heat; U.uCrust.value = this.p.crust; U.uT.value = this.t;
      U.uLight.value.fromArray(this.p.light).normalize();
      U.uCamObj.value.copy(this.mesh.worldToLocal(cam.getWorldPosition(_c)));
      r.getDrawingBufferSize(_db);
      U.uPix.value = 2 * Math.tan(THREE.MathUtils.degToRad((cam.fov || 50) / 2)) / Math.max(1, _db.y); // (a pixel's size at a unit of distance: the same in the sphere's own units, its scale cancels)
      mat.uniformsNeedUpdate = true;
    };
    this.group = new THREE.Group(); this.group.name = 'caster-molten'; this.group.add(this.mesh);
    if (o.pos) this.group.position.copy(o.pos);
    (o.parent || game.scene)?.add(this.group);
    this.update(0);
  }
  set(o = {}) { for (const k of Object.keys(MOLTEN_DEFAULTS)) if (o[k] !== undefined) this.p[k] = o[k]; this.mesh?.scale.setScalar(this.p.size); return this; }
  /** The blobs, in the bounding sphere's own units (radius 1): a lamp's rise and fall, or a glob's wobble; each eased in or out. */
  update(dt) {
    this.t += dt * this.p.speed;
    const want = Math.max(1, Math.min(N, Math.round(this.p.blobs))), t = this.t, glob = this.p.mode === 'glob';
    this.balls.forEach((B, i) => {
      const live = i < want ? 1 : 0;
      B.r += (live - B.r) * Math.min(1, dt * 3 + (dt === 0 ? 1 : 0));
      const k = B.r * this.k;
      if (glob) { // a glob: one body, the rest swelling out of it and back
        if (i === 0) { B.v.set(0, 0, 0, 0.5 * k); return; }
        const a = B.ph + t * 0.7 * B.wob, e = 0.28 + 0.12 * Math.sin(t * 1.3 + B.ph);
        B.v.set(Math.cos(a) * e, Math.sin(t * 0.9 + B.ph * 2) * e * 0.8, Math.sin(a) * e, (0.2 + 0.08 * Math.sin(t * 1.7 + i)) * k);
        return;
      }
      if (i === 0) { B.v.set(0, -0.62, 0, 0.36 * k); return; } // (the pool at the bottom: the wax gathers there)
      if (i === 1) { B.v.set(0, 0.66, 0, 0.22 * k); return; } // (and the cap at the top)
      // a lamp's blob: up slowly, swelling, then down again, wandering a little (the period its own)
      const u = (t / B.per + B.ph) % 1, y = -Math.cos(u * Math.PI * 2) * 0.48;
      const rad = (0.17 + 0.08 * Math.sin(u * Math.PI * 2 + 1.2)) * k;
      B.v.set(Math.sin(t * 0.31 * B.wob + B.ph) * 0.16, y, Math.cos(t * 0.27 * B.wob + B.ph * 1.7) * 0.16, rad);
    });
  }
  dispose() { this.group.parent?.remove(this.group); }
}

/** The boot's warm-up (main.js): the one program compiled with the rest, never in play. */
export function prewarm(game) {
  const m = new THREE.Mesh(GEO ||= new THREE.IcosahedronGeometry(1, 2), material());
  m.position.set(0, -50, 0); m.frustumCulled = false; m.userData.zoneFree = true; game.scene.add(m);
  return () => m.parent?.remove(m);
}

export const create = (game, opts) => new Molten(game, opts);

/** The effect library's `caster` layer: a molten glob at the effect's place, crusting over its life; its size the scale. */
export function layer(game, L) {
  const m = new Molten(game, { mode: 'glob', ...L, k: 0 }), c0 = L.crust ?? 0, c1 = L.crustEnd ?? c0;
  let age = 0;
  return { group: m.group, u: { uTint: { value: new THREE.Color() } }, set: (k) => { m.k = Math.max(0, k); },
    update: (raw) => { age += raw; m.p.crust = c0 + (c1 - c0) * Math.min(1, age / Math.max(0.1, L.dur || 4)); m.update(raw); }, dispose: () => m.dispose() };
}
