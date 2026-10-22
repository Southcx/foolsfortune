// ---------------------------------------------------------------------------------------
// THE GARDEN'S SMALL LIFE, DRAWN (docs/plans/GARDEN-COZY.md section 2.6 lever 5 and H3: "small life that ignores you"). The comfort of a
// cozy place is partly that something else is living in it and does not mind you; so none of these ever flees, turns to or avoids the Jar:
//
//   BEES         fuzzy gold bodies with a flicker of wings, working a flower in loops and figure-eights, then on to the next (by day)
//   BUTTERFLIES  two flapping wings and a thin body, meandering in soft arcs, the wings coloured from the season's flowers (mood.flowers)
//   DRAGONFLIES  darting, hovering, darting again, low over water (a dug pond, the Dantian's lake): none where there is no water
//   FIREFLIES    soft green-gold glows near the ground at dusk and in the night, each blinking on its own slow rhythm; drawn brighter than
//                1 so they read through the garden's glow
//   MOTHS        pale and erratic, round the stone lanterns set out (else round a spot of ground) at night; they come as the briar rises,
//                in the bees' place (the mood already trades the two)
//   THE POOL     at most 96 bodies in ONE InstancedMesh (one draw call, one program), a kind to each slot (20 bees, 16 butterflies, 8
//                dragonflies, 36 fireflies, 16 moths); how many of each is out is the garden mood's (gardenmood.js: bees, butterflies,
//                dragonflies, fireflies, moths, each 0..1), a body fading in and out (and shrinking, so it never pops)
//   THE PLACE    on the planetoid nearest the camera, within LIFE.reach (20 m) of the eye, stood on its own up (a planetoid's ground is
//                a sphere: planet.radiusAt, the water on it planet.waterAt); a body that falls out of reach fades and is born again
//                near the eye. Bees and butterflies are drawn to planted cells (the plants' grids), dragonflies to water
//   THE MOTION   on the CPU, a loop over the live bodies with nothing allocated: each holds an anchor on the sphere that steps to a new
//                one now and then, and a small loop round it by kind; its heading is where it is going. The wings flap in the vertex
//                shader (a rate and a sweep to each kind), the fireflies' glows turn to face the camera there too
//
// Prior art: Animal Crossing's bugs (a few chunky, readable lives that go on about their business), Ghibli's fireflies (Grave of the
// Fireflies, Totoro's night garden: a few slow green-gold lights), Okami's restored fields (life returning as the land is tended), and
// Breath of the Wild's butterflies and dragonflies placed round the eye and recycled as it moves.
//
//   const L = new GardenLife(realm)   L.update(raw, camera)   L.dispose()   L.live (bodies out)   L.counts (a kind's bodies out)
//   lifeParked() -> a mesh for the warm-up   LIFE (data)   KINDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';

/** The pool's numbers: bodies of each kind (the slots, 96 in all), metres `reach` (none farther from the eye) and `grow` (a far body drawn
 *  larger by this much a metre so it still reads), real seconds `fade`, and a kind's size `S`, `speed` (m/s of its anchor stepping) and `hold`
 *  (real seconds on an anchor). */
export const KINDS = ['bee', 'butterfly', 'dragonfly', 'firefly', 'moth'];
export const LIFE = {
  slots: [20, 16, 8, 36, 16], reach: 20, grow: 0.04, fade: 1.2,
  size: [0.12, 0.24, 0.2, 0.4, 0.2], speed: [1.4, 0.8, 6.5, 0.4, 0.9], hold: [[4, 8], [2, 4.5], [0.5, 1.8], [4, 9], [3, 7]],
  step: [3.5, 4.5, 5, 3, 3], // (metres an anchor steps to the next)
  light: [0.4, 0.4, 0.5, 1, 0.8], // (the least share of the day's light a kind is drawn in: fireflies glow, moths stay pale)
};
const N = LIFE.slots.reduce((a, b) => a + b, 0), FIRST = []; { let s = 0; for (const n of LIFE.slots) { FIRST.push(s); s += n; } }
const FLOWERS_DEFAULT = [new THREE.Color(0xffd04a), new THREE.Color(0xff8a5a), new THREE.Color(0x7ab8ff), new THREE.Color(0xffffff)];
const FALLBACK = { bees: 0.6, butterflies: 0.5, dragonflies: 0.4, fireflies: 0, moths: 0, day: 1, briar: 0, flowers: FLOWERS_DEFAULT };

// ---- the one material (wings, bodies and glows by `aPart`, the kind in `aLife.x`)
const VERT = `
attribute float aPart; attribute vec4 aLife; attribute vec3 aCol; attribute vec3 aWing;
uniform float uLT;
varying float vPart; varying float vKind; varying float vA; varying float vZ; varying vec2 vLUv; varying vec3 vC;
const vec3 KB[5] = vec3[5](vec3(0.5, 0.45, 0.95), vec3(0.09, 0.09, 0.8), vec3(0.07, 0.07, 1.4), vec3(0.12, 0.12, 0.12), vec3(0.22, 0.2, 0.7));
const vec4 KW[5] = vec4[5](vec4(0.9, 0.55, 17.0, 0.8), vec4(1.5, 1.2, 3.6, 1.0), vec4(2.2, 0.35, 24.0, 0.12), vec4(0.0, 0.0, 0.0, 0.0), vec4(1.6, 0.9, 9.0, 0.9));
const float KR[5] = float[5](0.5, 0.4, 0.0, 0.0, 0.3);
`;
const VERT_BODY = `
int lk = int(aLife.x + 0.5);
vPart = aPart; vKind = aLife.x; vA = aLife.z; vLUv = uv; vZ = position.z; vC = aCol;
vec3 pp = position;
if (aPart > 1.5) { pp = position * (lk == 3 ? 1.0 : 0.0); }
else if (abs(aPart) < 0.5) { pp = position * KB[lk]; }
else {
  vec4 w = KW[lk]; float hz = w.z * (1.0 + 0.25 * sin(uLT * 3.1 + aLife.y * 9.0));
  float a = KR[lk] + w.w * sin(uLT * hz * 6.2832 + aLife.y * 6.2832);
  pp = vec3(position.x * w.x, 0.0, position.z * w.y); pp.y = abs(pp.x) * sin(a); pp.x *= cos(a); vC = aWing;
}
transformed = pp;
`;
const PROJ = `
vec4 mvPosition;
if (aPart > 1.5) { vec4 ctr = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float s = length(instanceMatrix[0].xyz); mvPosition = ctr + vec4(transformed.xy * s, 0.0, 0.0); }
else mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
gl_Position = projectionMatrix * mvPosition;
`;
const FRAG_DECL = `
varying float vPart; varying float vKind; varying float vA; varying float vZ; varying vec2 vLUv; varying vec3 vC;
const float KA[5] = float[5](0.5, 0.95, 0.45, 0.0, 0.9);
`;
const FRAG_BODY = `
{
  int lk = int(vKind + 0.5); vec3 col = vC; float al = vA;
  if (vPart > 1.5) { vec2 q = vLUv * 2.0 - 1.0; float d = dot(q, q); al *= exp(-d * 4.5) * (1.0 - smoothstep(0.8, 1.0, d)); }
  else if (abs(vPart) < 0.5) { if (lk == 0) col *= mix(1.0, 0.32, step(0.0, sin(vZ * 9.0))); }
  else { float m = length((vLUv - vec2(0.45, 0.5)) / vec2(0.58, 0.5)); if (m > 1.0) discard; col *= 1.0 - 0.4 * smoothstep(0.55, 1.0, m); al *= KA[lk]; }
  if (al < 0.01) discard;
  diffuseColor = vec4(col, al);
}
`;
const U = { uLT: { value: 0 } };
let MAT = null;
function lifeMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.MeshBasicMaterial({ name: 'garden-life', transparent: true, depthWrite: false, side: THREE.DoubleSide });
  MAT.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VERT + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`).replace('#include <project_vertex>', PROJ);
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace('#include <color_fragment>', FRAG_BODY);
  };
  MAT.customProgramCacheKey = () => 'garden-life-1';
  MAT.userData.shared = true; MAT.userData.noMerge = true;
  return MAT;
}

/** The one geometry: a pointed body, a right wing, a left wing and a glow quad (all four kinds' parts; a kind's shader scales away what
 *  it does not wear). */
function lifeGeo(n) {
  const P = [], I = [], UV = [], PART = [];
  const v = (x, y, z, u, w, part) => { P.push(x, y, z); UV.push(u, w); PART.push(part); return P.length / 3 - 1; };
  const o = [v(0, 0, 1, 0, 0, 0), v(0, 0, -1, 0, 0, 0), v(1, 0, 0, 0, 0, 0), v(-1, 0, 0, 0, 0, 0), v(0, 1, 0, 0, 0, 0), v(0, -1, 0, 0, 0, 0)];
  for (const [a, b] of [[2, 4], [4, 3], [3, 5], [5, 2]]) { I.push(o[0], o[a], o[b], o[1], o[b], o[a]); }
  for (const s of [1, -1]) { const a = v(0, 0, -0.5, 0, 0, s), b = v(s, 0, -0.5, 1, 0, s), c = v(s, 0, 0.5, 1, 1, s), d = v(0, 0, 0.5, 0, 1, s); I.push(a, b, c, a, c, d); }
  { const a = v(-0.5, -0.5, 0, 0, 0, 2), b = v(0.5, -0.5, 0, 1, 0, 2), c = v(0.5, 0.5, 0, 1, 1, 2), d = v(-0.5, 0.5, 0, 0, 1, 2); I.push(a, b, c, a, c, d); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(PART, 1)); g.setIndex(I);
  g.setAttribute('aLife', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aWing', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.instanceCount = n;
  return g;
}
function lifeMesh(n) {
  const m = new THREE.InstancedMesh(lifeGeo(n), lifeMaterial(), n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.renderOrder = 4; return m;
}

/** A small mesh of the life's material for the warm-up (one body, hidden by the realm; the program the garden draws; never disposed). */
export function lifeParked() {
  const m = lifeMesh(1); m.setMatrixAt(0, new THREE.Matrix4()); m.geometry.attributes.aLife.array.set([3, 0, 1, 0]); m.geometry.attributes.aCol.array.set([0.7, 1, 0.4]);
  m.name = 'garden-life-parked'; return m;
}

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _a = new THREE.Vector3(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3(), _p = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0), _col = new THREE.Color();
const MAX_LAMPS = 16;

export class GardenLife {
  constructor(realm) {
    this.R = realm; this.rand = stream('vfx/garden/gardenlife'); this.t = 0;
    this.mesh = lifeMesh(N); this.mesh.name = 'garden-life'; realm.site.group.add(this.mesh);
    // per body: planet index, anchor and target (unit directions), height over the ground, fade, wait (real s), state flags, position, heading
    this.pl = new Int8Array(N).fill(-1); this.anc = new Float32Array(N * 3); this.tgt = new Float32Array(N * 3); this.h0 = new Float32Array(N);
    this.fade = new Float32Array(N); this.wait = new Float32Array(N); this.alive = new Uint8Array(N); this.leaving = new Uint8Array(N);
    this.lamp = new Int8Array(N).fill(-1); this.retry = new Float32Array(N);
    this.pos = new Float32Array(N * 3); this.upv = new Float32Array(N * 3); this.fwd = new Float32Array(N * 3); this.seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) { for (let k = 0; k < 4; k++) this.seed[i * 4 + k] = this.rand(); this.fwd[i * 3 + 2] = 1; }
    this.lamps = new Float32Array(MAX_LAMPS * 4); this.nLamps = 0; this.lampT = 0; // (x, y, z of a lit lantern, its planet index)
    this.counts = [0, 0, 0, 0, 0]; this.live = 0;
  }

  /** A frame: raw real seconds, the camera. Bodies fade in and out toward how many the mood asks, move and are written to the instances. */
  update(raw, camera) {
    const R = this.R, planets = R.site.planets, eye = camera?.position; this.mesh.visible = false;
    if (!eye || !planets?.length || !R.active) return;
    const dt = Math.min(0.1, Math.max(0, raw || 0)), M = R.game.gardenMood?.now || FALLBACK;
    this.t += dt; U.uLT.value = this.t;
    // the planetoid nearest the eye (by its surface)
    let np = -1, bd = Infinity; planets.forEach((P, i) => { if (P.look?.group?.visible === false) return; const d = P.c.distanceTo(eye) - P.r; if (d < bd) { bd = d; np = i; } });
    if (np < 0 || bd > LIFE.reach * 2) { this.live = 0; return; }
    this.mesh.visible = true;
    if ((this.lampT -= dt) <= 0) this.scanLamps(planets);
    const want = [M.bees * 20, M.butterflies * 16, M.dragonflies * 8, M.fireflies * 36, Math.min(1, M.moths) * 16];
    const flowers = M.flowers?.length ? M.flowers : FLOWERS_DEFAULT, day = M.day ?? 1, dark = 1 - Math.min(1, (M.briar ?? 0) * 0.35);
    const L = this.mesh.geometry.attributes, aL = L.aLife.array, aC = L.aCol.array, aW = L.aWing.array, X = this.mesh.instanceMatrix.array, reach2 = LIFE.reach ** 2;
    let live = 0; this.counts.fill(0);
    for (let kind = 0; kind < 5; kind++) {
      const n = LIFE.slots[kind], on = Math.round(want[kind]), S = LIFE.size[kind];
      for (let j = 0; j < n; j++) {
        const i = FIRST[kind] + j, s = this.seed, sd = i * 4;
        // fade toward being out (wanted, and not leaving) or away
        const out = j < on && !this.leaving[i], f = this.fade[i] = Math.min(1, Math.max(0, this.fade[i] + (out ? dt : -dt) / LIFE.fade));
        if (!this.alive[i]) {
          if (!out || (this.retry[i] -= dt) > 0) { this.write(i, X, aL, 0); continue; }
          if (!this.spawn(i, kind, planets, np, eye)) { this.retry[i] = 1 + this.rand(); this.write(i, X, aL, 0); continue; }
        }
        const P = planets[this.pl[i]]; if (!P) { this.alive[i] = 0; continue; }
        this.move(i, kind, P, dt);
        const px = this.pos[i * 3], py = this.pos[i * 3 + 1], pz = this.pos[i * 3 + 2], dx = px - eye.x, dy = py - eye.y, dz = pz - eye.z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > reach2 || P.look?.group?.visible === false) this.leaving[i] = 1; // (out of reach: fades, then is born again near the eye)
        if (f <= 0 && this.leaving[i]) { this.alive[i] = 0; this.leaving[i] = 0; this.write(i, X, aL, 0); continue; }
        // the look: size, alpha, colours
        const ph = s[sd + 1], dist = Math.sqrt(d2), size = S * (1 + LIFE.grow * dist) * (0.85 + 0.3 * s[sd + 2]) * f;
        const lit = Math.max(LIFE.light[kind], day) * dark;
        let alpha = f;
        if (kind === 3) { // a firefly's slow blink: its own rhythm, dark between
          const g = sm(0.1, 0.95, Math.sin((this.t / (2.6 + 3 * s[sd + 3]) + ph) * 6.2832)), br = 1 + 2.4 * g;
          alpha = f * (0.1 + 0.9 * g); _col.setRGB(0.7 * br, 1 * br, 0.32 * br); aC[i * 3] = _col.r; aC[i * 3 + 1] = _col.g; aC[i * 3 + 2] = _col.b;
          aW[i * 3] = aW[i * 3 + 1] = aW[i * 3 + 2] = 0;
        } else {
          if (kind === 0) { aC[i * 3] = 1 * lit; aC[i * 3 + 1] = 0.72 * lit; aC[i * 3 + 2] = 0.16 * lit; aW[i * 3] = 0.9 * lit; aW[i * 3 + 1] = 0.95 * lit; aW[i * 3 + 2] = 1 * lit; }
          else if (kind === 1) { const c = flowers[Math.floor(s[sd] * 977) % flowers.length]; aC[i * 3] = 0.2 * lit; aC[i * 3 + 1] = 0.13 * lit; aC[i * 3 + 2] = 0.1 * lit; aW[i * 3] = c.r * lit; aW[i * 3 + 1] = c.g * lit; aW[i * 3 + 2] = c.b * lit; }
          else if (kind === 2) { aC[i * 3] = 0.18 * lit; aC[i * 3 + 1] = 0.68 * lit; aC[i * 3 + 2] = 0.82 * lit; aW[i * 3] = 0.85 * lit; aW[i * 3 + 1] = 0.95 * lit; aW[i * 3 + 2] = 1 * lit; }
          else { aC[i * 3] = 0.66 * lit; aC[i * 3 + 1] = 0.64 * lit; aC[i * 3 + 2] = 0.62 * lit; aW[i * 3] = 0.8 * lit; aW[i * 3 + 1] = 0.79 * lit; aW[i * 3 + 2] = 0.76 * lit; }
        }
        aL[i * 4] = kind; aL[i * 4 + 1] = ph; aL[i * 4 + 2] = alpha; aL[i * 4 + 3] = 0;
        this.matrix(i, X, size);
        live++; this.counts[kind]++;
      }
    }
    this.live = live;
    L.aLife.needsUpdate = L.aCol.needsUpdate = L.aWing.needsUpdate = true; this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Body i unseen: a degenerate matrix and no alpha. */
  write(i, X, aL) { X.fill(0, i * 16, i * 16 + 16); aL[i * 4 + 2] = 0; }

  /** The lit stone lanterns the moths go round: set out in the garden (the plots), in world space. */
  scanLamps(planets) {
    this.lampT = 1; let n = 0; const plots = this.R.plots?.plots || [];
    for (const p of plots) {
      if (n >= MAX_LAMPS) break; if (p.placed?.feature !== 'lantern' || !p.group) continue;
      p.group.getWorldPosition(_p); const pi = planets.indexOf(p.planet); if (pi < 0) continue;
      this.lamps[n * 4] = _p.x; this.lamps[n * 4 + 1] = _p.y; this.lamps[n * 4 + 2] = _p.z; this.lamps[n * 4 + 3] = pi; n++;
    }
    this.nLamps = n;
  }

  /** A random direction on planet P within `arc` metres of the unit direction `from` (written to out). */
  near(P, from, arc, out) {
    const r = this.rand; _t1.crossVectors(from, _up); if (_t1.lengthSq() < 1e-6) _t1.set(1, 0, 0); _t1.normalize(); _t2.crossVectors(from, _t1);
    const ang = Math.sqrt(r()) * arc / P.r, th = r() * 6.2832, ca = Math.cos(ang), sa = Math.sin(ang);
    return out.copy(from).multiplyScalar(ca).addScaledVector(_t1, sa * Math.cos(th)).addScaledVector(_t2, sa * Math.sin(th)).normalize();
  }
  waterIn(P, d) { return (P.waterAt ? P.waterAt(d) : 0) > 0.08 || d.y > (P.look?.lakeCos ?? 2); }
  /** A direction for body i of `kind` near `from`: a planted cell for bees and butterflies, water for dragonflies, dry ground for the rest. */
  pick(i, kind, P, from, arc, out) {
    const clay = this.R.clays?.[P.id], grid = this.R.plants?.grids?.[P.id], tries = kind === 2 ? 10 : kind < 2 ? 6 : 3;
    for (let k = 0; k < tries; k++) {
      this.near(P, from, arc, out); const wet = this.waterIn(P, out);
      if (kind === 2) { if (wet) return true; continue; }
      if (wet) continue;
      if (kind < 2 && grid && clay && !(grid[clay.cellOf(out)] > 0)) { if (k < tries - 1) continue; }
      return true;
    }
    return kind !== 2;
  }

  /** Body i born: near the eye on the nearest planetoid; false when the place has nothing for its kind (a dragonfly with no water). */
  spawn(i, kind, planets, np, eye) {
    const P = planets[np], r = this.rand, A = this.anc, T = this.tgt;
    _e.copy(eye).sub(P.c).normalize();
    if (kind === 4 && this.nLamps) { // a moth: round a lantern within reach, else round a spot
      for (let k = 0; k < this.nLamps; k++) {
        const q = (Math.floor(r() * this.nLamps) + k) % this.nLamps; if (this.lamps[q * 4 + 3] !== np) continue;
        _p.set(this.lamps[q * 4], this.lamps[q * 4 + 1], this.lamps[q * 4 + 2]); if (_p.distanceToSquared(eye) > (LIFE.reach + 6) ** 2) continue;
        _d.copy(_p).sub(P.c); const len = _d.length(); _d.divideScalar(len);
        this.lamp[i] = q; A[i * 3] = T[i * 3] = _d.x; A[i * 3 + 1] = T[i * 3 + 1] = _d.y; A[i * 3 + 2] = T[i * 3 + 2] = _d.z; this.h0[i] = Math.max(0.5, len - P.radiusAt(_d)) + 0.1;
        return this.born(i, kind, np);
      }
    }
    this.lamp[i] = -1;
    if (!this.pick(i, kind, P, _e, Math.min(LIFE.reach - 2, 18), _d)) return false;
    A[i * 3] = T[i * 3] = _d.x; A[i * 3 + 1] = T[i * 3 + 1] = _d.y; A[i * 3 + 2] = T[i * 3 + 2] = _d.z;
    this.h0[i] = [0.5, 0.9, 0.7, 0.35, 1.3][kind];
    return this.born(i, kind, np);
  }
  born(i, kind, np) {
    this.pl[i] = np; this.alive[i] = 1; this.leaving[i] = 0; this.fade[i] = 0; this.retry[i] = 0;
    const h = LIFE.hold[kind]; this.wait[i] = h[0] + this.rand() * (h[1] - h[0]);
    this.pos[i * 3] = Infinity; // (no heading yet from the last position)
    return true;
  }

  /** Step body i: its anchor toward its target, a new target when it has waited; its position and heading. */
  move(i, kind, P, dt) {
    const A = this.anc, T = this.tgt, s = this.seed, sd = i * 4, t = this.t, ph = s[sd + 1] * 6.2832, rr = s[sd];
    _a.set(A[i * 3], A[i * 3 + 1], A[i * 3 + 2]); _d.set(T[i * 3], T[i * 3 + 1], T[i * 3 + 2]);
    const dot = Math.min(1, _a.dot(_d)), ang = Math.acos(dot), rem = ang * P.r;
    if (rem > 0.02) {
      let sp = LIFE.speed[kind]; if (kind === 2) sp = Math.max(1.5, sp * Math.min(1, rem / 1.5)); // (a dragonfly darts and brakes)
      const k = Math.min(1, (sp * dt) / rem); _a.lerp(_d, k).normalize(); A[i * 3] = _a.x; A[i * 3 + 1] = _a.y; A[i * 3 + 2] = _a.z;
    } else if (this.lamp[i] < 0 || kind !== 4) {
      this.wait[i] -= dt;
      if (this.wait[i] <= 0) { // on to the next flower, water or patch of ground
        const h = LIFE.hold[kind]; this.wait[i] = h[0] + this.rand() * (h[1] - h[0]);
        if (this.pick(i, kind, P, _a, LIFE.step[kind], _e)) { T[i * 3] = _e.x; T[i * 3 + 1] = _e.y; T[i * 3 + 2] = _e.z; }
      }
    }
    // the ground (or the water) under it, and the loop it flies round the anchor
    let ground = P.radiusAt ? P.radiusAt(_a) : P.r;
    if (kind === 2) { ground += Math.max(0, P.waterAt ? P.waterAt(_a) : 0); if (_a.y > (P.look?.lakeCos ?? 2)) ground = Math.max(ground, P.r * 1.004); }
    const w = 1.3 + rr * 0.8; let ox = 0, oz = 0, oh = 0, tt = t * w + ph;
    if (kind === 0) { const R = 0.45 + 0.5 * rr; ox = R * Math.sin(tt); oz = R * 0.6 * Math.sin(2 * tt); oh = 0.3 + 0.12 * Math.sin(3 * tt); } // (a figure-eight over the bloom)
    else if (kind === 1) { tt = t * (0.6 + 0.3 * rr) + ph; ox = 1.4 * Math.sin(tt) + 0.5 * Math.sin(1.9 * tt); oz = 1.1 * Math.cos(0.8 * tt); oh = 0.7 * Math.sin(1.3 * tt) + 0.2 * Math.sin(5.3 * tt); }
    else if (kind === 2) { ox = 0.04 * Math.sin(37 * t + ph); oz = 0.04 * Math.cos(31 * t + ph); oh = 0.06 * Math.sin(2.3 * t + ph); } // (a hover's tremble)
    else if (kind === 3) { tt = t * (0.35 + 0.2 * rr) + ph; ox = 0.9 * Math.sin(tt); oz = 0.9 * Math.sin(0.74 * tt + 1); oh = 0.45 * Math.sin(0.6 * t + ph); }
    else { const R = (this.lamp[i] >= 0 ? 0.55 : 0.9) + 0.5 * rr; tt = t * (2.4 + rr) + ph; ox = R * (Math.sin(tt) + 0.4 * Math.sin(3.7 * tt + 1)); oz = R * (Math.cos(0.8 * tt) + 0.4 * Math.sin(4.3 * tt)); oh = 0.3 * Math.sin(2.1 * tt) + 0.2 * Math.sin(6.7 * tt); } // (erratic, round its lamp)
    _t1.crossVectors(_a, _up); if (_t1.lengthSq() < 1e-6) _t1.set(1, 0, 0); _t1.normalize(); _t2.crossVectors(_a, _t1);
    const h = Math.max(0.2, this.h0[i] + oh), r = ground + h, o = i * 3, F = this.fwd;
    const x = P.c.x + _a.x * r + _t1.x * ox + _t2.x * oz, y = P.c.y + _a.y * r + _t1.y * ox + _t2.y * oz, z = P.c.z + _a.z * r + _t1.z * ox + _t2.z * oz;
    // the heading is where it is going (kept when it hovers); eased, then laid along the planet's tangent
    if (this.pos[o] !== Infinity && dt > 0) {
      let vx = (x - this.pos[o]) / dt, vy = (y - this.pos[o + 1]) / dt, vz = (z - this.pos[o + 2]) / dt; const up = vx * _a.x + vy * _a.y + vz * _a.z; vx -= _a.x * up; vy -= _a.y * up; vz -= _a.z * up;
      const l = Math.hypot(vx, vy, vz); if (l > 0.08) { const k = Math.min(1, dt * (kind === 2 ? 14 : 6)) / l; F[o] += (vx - F[o] * l) * k; F[o + 1] += (vy - F[o + 1] * l) * k; F[o + 2] += (vz - F[o + 2] * l) * k; }
    }
    const up = F[o] * _a.x + F[o + 1] * _a.y + F[o + 2] * _a.z; F[o] -= _a.x * up; F[o + 1] -= _a.y * up; F[o + 2] -= _a.z * up;
    let fl = Math.hypot(F[o], F[o + 1], F[o + 2]); if (fl < 1e-4) { F[o] = _t2.x; F[o + 1] = _t2.y; F[o + 2] = _t2.z; fl = 1; } F[o] /= fl; F[o + 1] /= fl; F[o + 2] /= fl;
    this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
    this.upv[o] = _a.x; this.upv[o + 1] = _a.y; this.upv[o + 2] = _a.z;
  }

  /** Body i's matrix: right, up, forward (the planet's up, its heading), each scaled by `s`, then the position. */
  matrix(i, X, s) {
    const o = i * 3, F = this.fwd, U_ = this.upv, p = i * 16;
    const ux = U_[o], uy = U_[o + 1], uz = U_[o + 2], fx = F[o], fy = F[o + 1], fz = F[o + 2];
    X[p] = (uy * fz - uz * fy) * s; X[p + 1] = (uz * fx - ux * fz) * s; X[p + 2] = (ux * fy - uy * fx) * s; X[p + 3] = 0;
    X[p + 4] = ux * s; X[p + 5] = uy * s; X[p + 6] = uz * s; X[p + 7] = 0;
    X[p + 8] = fx * s; X[p + 9] = fy * s; X[p + 10] = fz * s; X[p + 11] = 0;
    X[p + 12] = this.pos[o]; X[p + 13] = this.pos[o + 1]; X[p + 14] = this.pos[o + 2]; X[p + 15] = 1;
  }

  /** Taken down with the realm (the material is shared and stays). */
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); }
}
