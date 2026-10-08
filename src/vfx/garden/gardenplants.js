// ---------------------------------------------------------------------------------------
// THE GARDEN'S PLANTS, DRAWN (the glossary: the plants; docs/plans/SPIRIT-GARDEN.md section 7, items 15 and 29). Petra's rule keeps a
// stage a cell (0 bare .. 3 full) on each planetoid's clay grid (world/garden/plants.js); this dresses it, a kind for each ground the
// green spreads on:
//
//   THE KINDS    moss   cushions of jade with two fern sprigs (wood, wonder)
//                herb   a rosette of leaves on loam, and at stage 3 a bloom in desire's colour (earth, desire)
//                reed   blades on silt, one carrying a cattail (water, dread)
//                Green left on ground it cannot spread on (ash, slate, bare clay) is drawn as moss, browning as it wilts
//   THE PLACING  one InstancedMesh a kind for the whole garden (three draws), in world space; each planted cell holds as many as its
//                area asks (PLANT_LOOK.density a square metre, so the cells' crowding toward the poles never shows), jittered in it by a
//                hash (no rows), stood on the clay's ground there (planet.radiusAt) and on its normal (a cushion lies on the slope; a
//                herb or a reed leans most of the way to the sky), let down by the slope under its foot (CASEBOOK rule 64), never under
//                a lake's cap (the Dantian's, the Koi Pond's: the look's `lakeCos`)
//   THE CAP      PLANT_LOOK.cap in all, filled nearest the eye first, and only within PLANT_LOOK.near of it: past ~20 m each one
//                shrinks away in the vertex shader, and the ground's own green carries the colour (vfx/garden/gardengrounds.js)
//   THE MOTION   a slow sway along the planetoid's tangent, more at the tip than the foot (the vertex shader, its phase by hash)
//   WHEN         placed again when the green changes, when the clay under a planetoid with green on it changes (a stroke, erosion:
//                never a tuft left floating), or when the eye has moved PLANT_LOOK.move; at most every PLANT_LOOK.every real seconds, the
//                debt kept until it is paid (CASEBOOK rule 69)
// One material for every kind (one program; plantsParked for the warm-up).
//
// Prior art: GPU-instanced grass and foliage scattered by a density map (Ghost of Tsushima's grass, Breath of the Wild's, Horizon's
// placement by density), Animal Crossing's and Viva Pinata's chunky toy-like plants, the up-turned normals of stylised grass (lit like
// the ground it grows from), and the wuxing's phases for which ground grows what.
//
//   const L = new GardenPlants(realm)   L.update(dirtyIds, grids)   L.placed (instances drawn)   L.check() -> { n, floating, worst }
//   plantsParked() -> a mesh for the warm-up   PLANT_LOOK (data)   PLANT_KINDS (the kinds' colours and sizes: data)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { NX, NY, CELL_DIRS } from '../../world/garden/clay.js';
import { COLOR } from '../../progress/weather.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';

/** The placing's numbers: `cap` instances in all, metres `near` (none farther) and `fade` (shrinking away between), `move` (the eye
 *  moved this far: placed again), real seconds `every` (the most often it is placed). */
export const PLANT_LOOK = { cap: 2400, near: 24, fade: [17, 23], move: 6, every: 0.1 };
/** The kinds: their colours (foot, tip, accent), size and `density` (a square metre); the ground index (the clay's, GROUNDS' order plus
 *  one) that grows each. */
export const PLANT_KINDS = {
  moss: { ground: 1, foot: 0x2c6a48, tip: 0x78c088, fern: 0x4c9a5c, size: 1, density: 2.2 },
  herb: { ground: 3, foot: 0x467e34, tip: 0x92c85e, bloom: COLOR.desire, size: 1, density: 1.5 },
  reed: { ground: 5, foot: 0x5d7a5e, tip: 0xd2d89c, head: 0x6a4a3a, size: 1, density: 1.8 },
};
const KINDS = Object.keys(PLANT_KINDS), BY_GROUND = [0, 0, 0, 1, 0, 2]; // (moss, ash, loam, slate, silt: ash and slate and bare draw wilting moss)
const STAGE = [0, 0.45, 0.72, 1];

let MAT = null;
const VERT_DECL = /* glsl */`
attribute float aBloom;
uniform float uGTime;
uniform vec2 uPFade;
`;
const VERT_BODY = /* glsl */`
  {
    #ifdef USE_INSTANCING_COLOR
      vec3 pd = instanceColor; // (r: the sway's phase, g: in bloom, b: wilting)
    #else
      vec3 pd = vec3(0.0, 1.0, 0.0);
    #endif
    #ifdef USE_INSTANCING
      vec3 root = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    #else
      vec3 root = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    #endif
    float s = 1.0 - smoothstep(uPFade.x, uPFade.y, distance(root, cameraPosition)); // (shrunk away with distance: the ground's green carries it)
    float h = max(position.y, 0.0), ph = pd.r * 6.2832, t = uGTime;
    transformed.xz += vec2(sin(t * 1.3 + ph), cos(t * 1.07 + ph * 1.3)) * 0.07 * h * h; // (the sway, along the tangent: more at the tip)
    transformed *= s * mix(1.0, step(0.5, pd.g), aBloom); // (a bloom only in bloom)
  }
`;
const COLOR_VERT = /* glsl */`
  #if defined( USE_COLOR )
    vColor = vec3(color);
    #ifdef USE_INSTANCING_COLOR
      vColor = mix(vColor, vec3(0.78, 0.7, 0.5) * (0.7 + 0.3 * vColor.g), instanceColor.b * 0.75); // (wilting: dried to straw)
    #endif
  #endif
`;
const KEY = 'garden-plants-1';

/** The one material the plants are drawn with (made on first need; shared, never disposed). */
export function plantMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.MeshStandardMaterial({ name: 'garden-plants', vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });
  const U = { uGTime: GROUND_UNIFORMS.uGTime, uPFade: { value: new THREE.Vector2(...PLANT_LOOK.fade) } };
  MAT.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <color_vertex>', COLOR_VERT).replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n  normal = normalize(vNormal);'); // (both faces of a blade lit by its up-turned normal: never flipped to the ground's side)
  };
  MAT.customProgramCacheKey = () => KEY;
  MAT.userData.shared = true; MAT.userData.noMerge = true;
  return MAT;
}

// ---- the kinds' geometry (local: y up, the foot at the origin), with colours, and normals turned up as stylised grass's are
function builder() {
  const P = [], N = [], C = [], B = [], c = new THREE.Color(), up = new THREE.Vector3();
  return {
    tri(a, b, d, cols, bloom = 0, ny = 0.8) { // (normals: the face's, pulled toward up by ny, so a blade is lit like the ground)
      const e1 = new THREE.Vector3().subVectors(b, a), e2 = new THREE.Vector3().subVectors(d, a), n = e1.cross(e2).normalize();
      if (n.y < 0) { n.negate(); [b, d] = [d, b]; } n.lerp(up.set(0, 1, 0), ny).normalize(); // (wound to face up: its front is the side the sun sees)
      for (const [p, k] of [[a, cols[0]], [b, cols[1]], [d, cols[2]]]) { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); c.setHex(k); C.push(c.r, c.g, c.b); B.push(bloom); }
    },
    done() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aBloom', new THREE.Float32BufferAttribute(B, 1));
      g.computeBoundingSphere(); return g;
    },
  };
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** A blade or a leaf: from the foot, bent over by `lean`, `w` wide, in `segs` segments to a point. */
function blade(b, yaw, h, w, lean, segs, foot, tip, base = V(0, 0, 0)) {
  const dir = V(Math.sin(yaw), 0, Math.cos(yaw)), side = V(dir.z, 0, -dir.x), pts = [];
  for (let s = 0; s <= segs; s++) { const f = s / segs, ww = w * (1 - f) * (s === segs ? 0 : 1); const p = base.clone().addScaledVector(dir, lean * f * f * h).setY(base.y + h * f * (1 - 0.25 * lean * f)); pts.push([p.clone().addScaledVector(side, -ww / 2), p.clone().addScaledVector(side, ww / 2), f]); }
  const col = (f) => new THREE.Color(foot).lerp(new THREE.Color(tip), f).getHex();
  for (let s = 0; s < segs; s++) {
    const [a0, a1, f0] = pts[s], [b0, b1, f1] = pts[s + 1];
    b.tri(a0, a1, b0, [col(f0), col(f0), col(f1)]);
    if (s < segs - 1) b.tri(a1, b1, b0, [col(f0), col(f1), col(f1)]);
  }
}
function mossGeo() {
  const K = PLANT_KINDS.moss, b = builder(), n = 7, r = 0.3, h = 0.16;
  const ring = (y, rr) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 1 - 0.18 * ((i * 3) % 4) / 3; return V(Math.cos(a) * rr * k, y * (0.85 + 0.3 * k), Math.sin(a) * rr * k); }); // (lumpy: no two cushions read as one tile)
  const r0 = ring(0, r), r1 = ring(h * 0.7, r * 0.7), top = V(0, h, 0), mid = new THREE.Color(K.foot).lerp(new THREE.Color(K.tip), 0.55).getHex();
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; b.tri(r0[i], r0[j], r1[i], [K.foot, K.foot, mid], 0, 0.6); b.tri(r0[j], r1[j], r1[i], [K.foot, mid, mid], 0, 0.6); b.tri(r1[i], r1[j], top, [mid, mid, K.tip], 0, 0.6); }
  blade(b, 0.6, 0.38, 0.09, 0.7, 2, K.fern, K.tip, V(0.08, h * 0.6, 0.02)); blade(b, 3.4, 0.32, 0.08, 0.8, 2, K.fern, K.tip, V(-0.06, h * 0.6, -0.04));
  return b.done();
}
function herbGeo() {
  const K = PLANT_KINDS.herb, b = builder();
  for (let i = 0; i < 5; i++) blade(b, (i / 5) * Math.PI * 2 + 0.4, 0.34 + 0.06 * (i % 2), 0.13, 0.9, 2, K.foot, K.tip);
  blade(b, 0, 0.48, 0.03, 0.1, 1, K.foot, K.tip);
  const top = V(0.005, 0.48, 0), petal = new THREE.Color(K.bloom).lerp(new THREE.Color(0xfff2e8), 0.2).getHex(), eye = 0xfff0b0;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2, a2 = a + 0.62; b.tri(top, V(top.x + Math.cos(a) * 0.1, top.y + 0.025, Math.sin(a) * 0.1), V(top.x + Math.cos(a2) * 0.1, top.y + 0.025, Math.sin(a2) * 0.1), [eye, petal, petal], 1, 0.5); }
  return b.done();
}
function reedGeo() {
  const K = PLANT_KINDS.reed, b = builder();
  for (let i = 0; i < 5; i++) blade(b, (i / 5) * Math.PI * 2 + 0.2, 0.75 + 0.15 * (i % 2), 0.06, 0.35, 3, K.foot, K.tip);
  const s = V(0.02, 0.78, 0.01), t = V(0.02, 1.0, 0.01);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2, a2 = a + (Math.PI * 2) / 3, o = (x) => V(s.x + Math.cos(x) * 0.022, 0, s.z + Math.sin(x) * 0.022); const p0 = o(a).setY(s.y), p1 = o(a2).setY(s.y), q0 = o(a).setY(t.y), q1 = o(a2).setY(t.y); b.tri(p0, p1, q0, [K.head, K.head, K.head], 0, 0.2); b.tri(p1, q1, q0, [K.head, K.head, K.head], 0, 0.2); }
  blade(b, 1.3, 0.78, 0.012, 0, 1, K.foot, K.foot);
  return b.done();
}

/** A small mesh of the plants' material for the warm-up (instanced, with its colours: the program the garden draws; never disposed). */
export function plantsParked() {
  const m = new THREE.InstancedMesh(herbGeo(), plantMaterial(), 1); m.setMatrixAt(0, new THREE.Matrix4()); m.setColorAt(0, new THREE.Color(0.5, 1, 0));
  m.name = 'garden-plants-parked'; m.frustumCulled = false; return m;
}

export class GardenPlants {
  constructor(realm) {
    this.R = realm; this.group = new THREE.Group(); this.group.name = 'garden-plants'; realm.site.group.add(this.group);
    const cap = PLANT_LOOK.cap; this.meshes = [];
    for (const [k, make] of [['moss', mossGeo], ['herb', herbGeo], ['reed', reedGeo]]) {
      const m = new THREE.InstancedMesh(make(), plantMaterial(), cap); m.name = `garden-plants-${k}`; m.count = 0; m.frustumCulled = false; m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, _col.setRGB(0, 0, 0)); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
      this.meshes.push(m); this.group.add(m);
    }
    this.seenV = {}; this.owed = true; this.wait = 0; this.eye = new THREE.Vector3(Infinity, 0, 0); this.placed = 0; this.ms = 0;
    this.instP = new Array(cap * 3); this.instD = new Float32Array(cap * 9); this.instR = new Float32Array(cap * 3); this.counts = [0, 0, 0];
    this.cand = new Float64Array(NX * NY * 2); this.order = [];
  }

  /** A frame (from Petra's plants.update): placed again when anything under it changed, at most every PLANT_LOOK.every real seconds. */
  update(dirty = null, grids = this.R.plants?.grids || {}) {
    const g = this.R.game, eye = g.camera?.position, dt = g.rawDt ?? 1 / 60; this.grids = grids;
    if (dirty?.size) this.owed = true;
    for (const P of this.R.site.planets) { const v = this.R.clays[P.id]?.version; if (grids[P.id] && v !== this.seenV[P.id]) { this.seenV[P.id] = v; this.owed = true; } }
    if (eye && this.eye.distanceToSquared(eye) > PLANT_LOOK.move ** 2) this.owed = true;
    this.wait -= dt;
    if (!this.owed || this.wait > 0 || !eye) return; // (owed stays set: paid on the next frame that may)
    this.place(eye); this.owed = false; this.wait = PLANT_LOOK.every;
  }

  /** Every planted cell within reach of the eye, nearest first, filled to the cap. */
  place(eye) {
    const t0 = performance.now(), L = PLANT_LOOK, near2 = L.near ** 2, planets = this.R.site.planets, cand = this.cand; let nc = 0;
    this.eye.copy(eye);
    planets.forEach((P, pi) => {
      const G = this.grids[P.id], clay = this.R.clays[P.id], lakeCos = P.look?.lakeCos ?? 2; if (!G || !clay || P.look?.group?.visible === false || P.c.distanceTo(eye) - (P.rMax || P.r * 2) > L.near) return;
      for (let k = 0; k < NX * NY; k++) {
        if (!G[k] || CELL_DIRS[k * 3 + 1] > lakeCos) continue; // (none under a lake's cap: the Dantian's, the Koi Pond's)
        const r = clay.base[k] + clay.h[k], x = P.c.x + CELL_DIRS[k * 3] * r - eye.x, y = P.c.y + CELL_DIRS[k * 3 + 1] * r - eye.y, z = P.c.z + CELL_DIRS[k * 3 + 2] * r - eye.z, d2 = x * x + y * y + z * z;
        if (d2 > near2 || nc >= cand.length / 2) continue;
        cand[nc * 2] = d2; cand[nc * 2 + 1] = pi * 65536 + k; nc++;
      }
    });
    const ord = this.order; ord.length = nc; for (let i = 0; i < nc; i++) ord[i] = i; ord.sort((a, b) => cand[a * 2] - cand[b * 2]);
    const counts = this.counts; counts.fill(0); let total = 0;
    for (let q = 0; q < nc && total < L.cap; q++) {
      const code = cand[ord[q] * 2 + 1], P = planets[Math.floor(code / 65536)], k = code % 65536, G = this.grids[P.id], clay = this.R.clays[P.id];
      const j = (k / NX) | 0, i = k - j * NX, lat = ((j + 0.5) / NY - 0.5) * Math.PI, dy = (P.r * Math.PI) / NY, area = Math.max(dy * 0.2, (P.r * Math.cos(lat) * Math.PI * 2) / NX) * dy;
      const gi = clay.ground[k], kind = BY_GROUND[gi] ?? 0, wilting = !(gi === 1 || gi === 3 || gi === 5), n = Math.floor(area * PLANT_KINDS[KINDS[kind]].density + hash(k, P.r, 0));
      for (let m = 0; m < n && total < L.cap; m++, total++) {
        const lon = ((i + hash(k, m, 1) - 0.5) / NX) * Math.PI * 2, la = ((j + 0.5 + hash(k, m, 2) - 0.5) / NY - 0.5) * Math.PI;
        _d.set(Math.cos(la) * Math.sin(lon), Math.sin(la), Math.cos(la) * Math.cos(lon));
        // the ground there and its normal (by the slope either way: 0.3 m east and north)
        const rg = P.radiusAt(_d), e = 0.3 / P.r;
        _e.set(_d.z, 0, -_d.x); if (_e.lengthSq() < 1e-8) _e.set(1, 0, 0); _e.normalize(); _n.crossVectors(_d, _e);
        const he = P.radiusAt(_t.copy(_d).addScaledVector(_e, e).normalize()) - rg, hn = P.radiusAt(_t.copy(_d).addScaledVector(_n, e).normalize()) - rg;
        _up.copy(_d).addScaledVector(_e, -he / 0.3).addScaledVector(_n, -hn / 0.3).normalize(); // (the ground's normal)
        const slope = Math.min(1.5, Math.sqrt(he * he + hn * hn) / 0.3), stage = STAGE[Math.min(3, G[k])], s = stage * (0.8 + 0.4 * hash(k, m, 3)) * PLANT_KINDS[KINDS[kind]].size;
        const foot = kind === 0 ? 0.24 : 0.08, sink = 0.025 + foot * s * slope; // (let down by the slope under its foot: rule 64)
        if (kind !== 0) _up.lerp(_d, 0.75).normalize(); // (a herb or a reed leans most of the way to the sky)
        _p.copy(P.c).addScaledVector(_d, rg - sink);
        _q.setFromUnitVectors(Y, _up).multiply(_q2.setFromAxisAngle(Y, hash(k, m, 4) * Math.PI * 2));
        const M = this.meshes[kind], c = counts[kind]++;
        M.setMatrixAt(c, _m.compose(_p, _q, _s.setScalar(Math.max(1e-3, s))));
        M.setColorAt(c, _col.setRGB(hash(k, m, 5), kind === 1 && G[k] >= 3 ? 1 : 0, wilting ? 1 : 0));
        const slot = kind * L.cap + c; this.instP[slot] = P; this.instD.set([_d.x, _d.y, _d.z], slot * 3); this.instR[slot] = rg - sink;
      }
    }
    this.meshes.forEach((M, i) => { M.count = counts[i]; M.instanceMatrix.clearUpdateRanges(); M.instanceColor.clearUpdateRanges(); M.instanceMatrix.needsUpdate = true; M.instanceColor.needsUpdate = true; if (counts[i]) { M.instanceMatrix.addUpdateRange(0, counts[i] * 16); M.instanceColor.addUpdateRange(0, counts[i] * 3); } });
    this.placed = total; this.ms = +(performance.now() - t0).toFixed(2);
  }

  /** Every plant drawn against the ground it stands on now: how many float over it (by more than 2 cm), and the worst. */
  check() {
    let n = 0, floating = 0, worst = -Infinity;
    for (let kind = 0; kind < 3; kind++) for (let c = 0; c < this.counts[kind]; c++) {
      const slot = kind * PLANT_LOOK.cap + c, P = this.instP[slot]; if (!P) continue; n++;
      const off = this.instR[slot] - P.radiusAt(_d.fromArray(this.instD, slot * 3)); if (off > 0.02) floating++; if (off > worst) worst = off;
    }
    return { n, floating, worst: +worst.toFixed(3) };
  }
}

/** A number in 0..1 from a cell, an index and a channel (a hash: the same every time, no rows). */
function hash(k, m, ch) { const s = Math.sin(k * 12.9898 + m * 78.233 + ch * 37.719) * 43758.5453; return s - Math.floor(s); }
const Y = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _e = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _up = new THREE.Vector3(), _p = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _col = new THREE.Color();
