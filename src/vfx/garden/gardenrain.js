// ---------------------------------------------------------------------------------------
// THE GARDEN'S RAIN, DRAWN (docs/plans/SPIRIT-GARDEN.md section 7, items 20 and 29: rain inside the Jar). Your draught falls on every
// planetoid as hard as your mental state is liquid (progress/realm.js rainOf, read by world/garden/waterworks.js `rain()`); the world's
// weather look falls along the world's down and has no say in here, so the garden's rain is its own:
//
//   THE STREAKS  instanced quads, each a drop falling toward the heart of a planetoid (each has its own down), most of them on the one
//                the eye is over, the rest on the visible faces of the others as far as GARDEN_RAIN.far; each is respawned on the CPU
//                when it lands, its landing radius asked of the ground and the water there (planet.radiusAt, planet.waterAt), so no
//                streak's head is ever under the ground
//   THE RINGS    where a drop lands: a ring opening on the ground or on the water's surface and fading in under half a real second
//   THE COLOUR   the draught's feeling in the canon colours (progress/weather.js COLOR), drawn toward the sky's pale so a thin streak
//                still reads, and glowing a little by night (at night Lachryma glows)
//   THE SKY      the garden's sky greys under it (vfx/garden/gardensky.js `set({ rain })`)
// One material for the streaks and the rings (one program; rainParked for the warm-up).
//
// Prior art: every particle rain that respawns drops at the camera (Rain World's, The Witness's, Breath of the Wild's streaks and
// splash rings), Super Mario Galaxy's per-planetoid gravity (each drop falls to its own heart), and the rings of vfx/weather.js here.
//
//   const R = new GardenRain({ sky })   group.add(R.group)   R.set({ amount: 0..1, feeling })   R.update(raw, camera, planets, near)
//   R.force(amount, feeling) (tests: held until R.force(null))   R.clear()   R.heads() -> [{ planet, dir, r }]   R.live
//   rainParked() -> a mesh for the warm-up   GARDEN_RAIN (data: tune live)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';
import { stream } from '../../core/rng.js';

/** The rain's numbers: `most` streaks at full rain, `rings` in the pool; metres (`fall` the height a drop starts over the ground, `len`
 *  a streak's length, `width`, `arc` how far round the near planetoid it falls, `far` the farthest planetoid rained on); m/s `speed`;
 *  `near` the share on the planetoid under the eye; a ring's `size` (metres) and `life` (real seconds); `tint` how far a streak's
 *  pale goes toward its feeling's colour. */
export const GARDEN_RAIN = { most: 1200, rings: 360, fall: [5, 13], len: 1.0, width: 0.03, speed: [10, 13], arc: 20, far: 140, near: 0.85, size: [0.25, 0.45], life: 0.42, tint: 0.7 };

let MAT = null;
const U = { uRTime: { value: 0 }, uRColor: { value: new THREE.Color(1, 1, 1) }, uRAmt: { value: 0 } };
const VERT = /* glsl */`
attribute vec2 aQ;
attribute float aKind;
attribute vec4 iA;
attribute vec4 iB;
attribute vec4 iC;
uniform float uRTime;
varying vec2 vQ;
varying float vKind;
varying float vFade;
#include <common>
#include <fog_pars_vertex>
void main() {
  vQ = aQ; vKind = aKind; vFade = 0.0;
  vec3 wp = vec3(0.0);
  if (aKind < 0.5) {
    // a streak: iA = (heart, t0), iB = (down's opposite, speed), iC = (r0, rl, len, -): its head falls from r0, never under rl
    float r = max(iC.y, iC.x - iB.w * (uRTime - iA.w));
    vec3 d = iB.xyz, head = iA.xyz + d * r, tail = iA.xyz + d * min(iC.x, r + iC.z);
    vec3 p = mix(head, tail, aQ.y), toEye = normalize(cameraPosition - p), side = normalize(cross(d, toEye));
    float live = step(iC.y + 0.001, r) * step(0.0, iC.x);
    wp = p + side * aQ.x * ${GARDEN_RAIN.width.toFixed(4)} * live;
    if (live < 0.5) wp = head;
    vFade = live * smoothstep(0.0, 0.2, uRTime - iA.w) * (1.0 - aQ.y * 0.85) * smoothstep(1.2, 3.5, distance(p, cameraPosition)); // (never a streak across the lens)
  } else {
    // a ring: iA = (where it landed, t0), iB = (up there, -), iC = (size, life, -, -)
    float age = (uRTime - iA.w) / iC.y, on = step(0.0, age) * step(age, 1.0);
    vec3 n = normalize(iB.xyz), t = normalize(abs(n.y) < 0.95 ? cross(n, vec3(0.0, 1.0, 0.0)) : cross(n, vec3(1.0, 0.0, 0.0))), b = cross(n, t);
    float s = iC.x * (0.25 + 0.75 * sqrt(clamp(age, 0.0, 1.0))) * on;
    wp = iA.xyz + (t * aQ.x + b * aQ.y) * s;
    vFade = on * (1.0 - age);
  }
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = /* glsl */`
uniform vec3 uRColor;
uniform float uGNight;
varying vec2 vQ;
varying float vKind;
varying float vFade;
#include <common>
#include <fog_pars_fragment>
void main() {
  float a;
  if (vKind < 0.5) a = (1.0 - abs(vQ.x)) * 0.65;
  else { float r = length(vQ), w = fwidth(r) + 0.04; a = smoothstep(0.8 - w, 0.86, r) * (1.0 - smoothstep(0.94, 0.98 + w, r)) * 0.85; }
  a *= vFade;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uRColor * (1.0 + 0.6 * uGNight), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** The one material the streaks and rings are drawn with (made on first need; shared, never disposed). */
export function rainMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({ name: 'garden-rain', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]) });
  Object.assign(MAT.uniforms, U, { uGNight: GROUND_UNIFORMS.uGNight }); // (shared as they are: merge would copy them)
  MAT.userData.shared = true;
  return MAT;
}

/** A quad of the kind (0 a streak: x across, y head to tail; 1 a ring: x, y over the square), as an instanced geometry of `n`. */
function quads(kind, n) {
  const g = new THREE.InstancedBufferGeometry();
  const q = kind ? [-1, -1, 1, -1, -1, 1, 1, 1] : [-1, 0, 1, 0, -1, 1, 1, 1];
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); // (unread: the vertex shader places each corner)
  g.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(q), 2));
  g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(4).fill(kind), 1));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  for (const k of ['iA', 'iB', 'iC']) { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); }
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  return g;
}

/** A small mesh of the rain's material for the warm-up (parked hidden; never disposed). */
export function rainParked() { const m = new THREE.Mesh(quads(0, 1), rainMaterial()); m.name = 'garden-rain-parked'; m.frustumCulled = false; return m; }

export class GardenRain {
  constructor({ sky = null } = {}) {
    const G = GARDEN_RAIN; this.sky = sky; this.rand = stream('vfx/garden/gardenrain');
    this.group = new THREE.Group(); this.group.name = 'garden-rain';
    this.sg = quads(0, G.most); this.rg = quads(1, G.rings);
    this.streaks = new THREE.Mesh(this.sg, rainMaterial()); this.rings = new THREE.Mesh(this.rg, rainMaterial());
    for (const m of [this.streaks, this.rings]) { m.frustumCulled = false; m.renderOrder = 3; this.group.add(m); }
    this.streaks.name = 'garden-rain-streaks'; this.rings.name = 'garden-rain-rings';
    this.end = new Float64Array(G.most).fill(-1); this.who = new Array(G.most).fill(null); this.ring = 0; this.t = 0;
    this.amount = 0; this.feeling = 'wonder'; this.forced = null; this.live = 0; this.greyed = -1;
    this.clear();
  }

  /** How hard it rains (0..1) and in what feeling (the draught's: waterworks.feeling()). */
  set({ amount = 0, feeling = 'wonder' } = {}) { if (this.forced) return; this.amount = THREE.MathUtils.clamp(amount, 0, 1); this.feeling = feeling || 'wonder'; }
  /** Held to these values whatever `set` says (the tests); force(null) lets go. */
  force(amount, feeling = 'wonder') { this.forced = amount == null ? null : { amount, feeling }; if (this.forced) { this.amount = amount; this.feeling = feeling; } }

  /** Every streak and ring gone (on leaving the garden: CASEBOOK rule 15), the sky clear of it. */
  clear() {
    this.end.fill(-1); this.who.fill(null); this.live = 0;
    for (const g of [this.sg, this.rg]) { g.attributes.iC.array.fill(-1); g.attributes.iA.array.fill(0); for (const k of ['iA', 'iB', 'iC']) g.attributes[k].needsUpdate = true; }
    if (this.sky?.set && this.greyed !== 0) { this.sky.set({ rain: 0 }); this.greyed = 0; }
    this.group.visible = false;
  }

  /** Where each falling streak's head is now (the tests: never under its planetoid's ground). */
  heads() {
    const out = [], A = this.sg.attributes.iA.array, B = this.sg.attributes.iB.array, C = this.sg.attributes.iC.array;
    for (let i = 0; i < this.end.length; i++) { if (this.end[i] <= this.t || !this.who[i]) continue; const r = Math.max(C[i * 4 + 1], C[i * 4] - B[i * 4 + 3] * (this.t - A[i * 4 + 3])); out.push({ planet: this.who[i], dir: new THREE.Vector3(B[i * 4], B[i * 4 + 1], B[i * 4 + 2]), r }); }
    return out;
  }

  /** A frame: drops that landed leave a ring and fall again (as many as the rain asks), the colour and the sky follow. `near` is the
   *  planetoid under the eye (the Jar's), else the nearest. */
  update(raw, camera, planets, near = null) {
    const G = GARDEN_RAIN; this.t += raw; U.uRTime.value = this.t;
    if (this.forced) { this.amount = this.forced.amount; this.feeling = this.forced.feeling; }
    const col = new THREE.Color(COLOR[this.feeling] ?? 0xffffff); U.uRColor.value.setRGB(0.86, 0.9, 1).lerp(col, G.tint);
    if (this.sky?.set && Math.abs(this.greyed - this.amount) > 0.01) { this.greyed = this.amount; this.sky.set({ rain: this.amount }); }
    const want = Math.round(G.most * this.amount), eye = camera?.position;
    this.group.visible = want > 0 || this.live > 0;
    if (!this.group.visible || !eye || !planets?.length) return;
    near ||= planets.reduce((b, P) => (P.c.distanceTo(eye) - P.r < b.c.distanceTo(eye) - b.r ? P : b), planets[0]);
    const others = planets.filter((P) => P !== near && P.look?.group?.visible !== false && P.c.distanceTo(eye) < G.far);
    const sA = this.sg.attributes.iA, sB = this.sg.attributes.iB, sC = this.sg.attributes.iC;
    let live = 0, moved = false;
    for (let i = 0; i < G.most; i++) {
      if (this.end[i] > this.t) { live++; continue; }
      if (this.who[i]) { this.splash(i); this.who[i] = null; sC.array[i * 4] = -1; moved = true; } // (landed: a ring where it fell)
      if (live >= want || i >= want) continue;
      this.spawn(i, near, others, eye, this.end[i] < 0); live++; moved = true;
    }
    this.live = live;
    if (moved) for (const a of [sA, sB, sC]) a.needsUpdate = true;
  }

  /** Drop i set falling on a planetoid: the near one mostly, round the point under the eye; else a visible face of another. `fresh`
   *  drops (the rain beginning) start part way down, so it does not arrive in one sheet. */
  spawn(i, near, others, eye, fresh) {
    const G = GARDEN_RAIN, r = this.rand, P = others.length && r() > G.near ? others[Math.floor(r() * others.length)] : near;
    const sub = _a.copy(eye).sub(P.c).normalize(), t1 = _b.set(0, 1, 0).cross(sub); if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0); t1.normalize(); const t2 = _c.copy(sub).cross(t1);
    const spread = P === near ? Math.min(G.arc / P.r, 1.4) : 1.2, ang = Math.sqrt(r()) * spread, th = r() * Math.PI * 2;
    const d = _d.copy(sub).multiplyScalar(Math.cos(ang)).addScaledVector(t1, Math.sin(ang) * Math.cos(th)).addScaledVector(t2, Math.sin(ang) * Math.sin(th)).normalize();
    const rl = (P.radiusAt ? P.radiusAt(d) : P.r) + (P.waterAt ? P.waterAt(d) : 0), h = G.fall[0] + r() * (G.fall[1] - G.fall[0]), v = G.speed[0] + r() * (G.speed[1] - G.speed[0]);
    const life = h / v, t0 = this.t - (fresh ? r() * life : 0);
    const A = this.sg.attributes.iA.array, B = this.sg.attributes.iB.array, C = this.sg.attributes.iC.array;
    A[i * 4] = P.c.x; A[i * 4 + 1] = P.c.y; A[i * 4 + 2] = P.c.z; A[i * 4 + 3] = t0;
    B[i * 4] = d.x; B[i * 4 + 1] = d.y; B[i * 4 + 2] = d.z; B[i * 4 + 3] = v;
    C[i * 4] = rl + h; C[i * 4 + 1] = rl; C[i * 4 + 2] = G.len; C[i * 4 + 3] = 0;
    this.end[i] = t0 + life; this.who[i] = P;
  }

  /** The ring where drop i landed (the pool reused in turn). */
  splash(i) {
    const G = GARDEN_RAIN, k = this.ring = (this.ring + 1) % G.rings, sA = this.sg.attributes.iA.array, sB = this.sg.attributes.iB.array, sC = this.sg.attributes.iC.array;
    const A = this.rg.attributes.iA, B = this.rg.attributes.iB, C = this.rg.attributes.iC, rl = sC[i * 4 + 1] + 0.03;
    A.array[k * 4] = sA[i * 4] + sB[i * 4] * rl; A.array[k * 4 + 1] = sA[i * 4 + 1] + sB[i * 4 + 1] * rl; A.array[k * 4 + 2] = sA[i * 4 + 2] + sB[i * 4 + 2] * rl; A.array[k * 4 + 3] = this.t;
    B.array[k * 4] = sB[i * 4]; B.array[k * 4 + 1] = sB[i * 4 + 1]; B.array[k * 4 + 2] = sB[i * 4 + 2];
    C.array[k * 4] = G.size[0] + this.rand() * (G.size[1] - G.size[0]); C.array[k * 4 + 1] = G.life;
    A.needsUpdate = B.needsUpdate = C.needsUpdate = true;
  }
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
