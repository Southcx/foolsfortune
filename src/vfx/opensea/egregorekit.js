// ---------------------------------------------------------------------------------------
// AN EGREGORE'S BODY, ITS KIT AND ITS PROGRAM (the bodies: vfx/opensea/egregorebodies.js; the species: progress/opensea/safari.js
// EGREGORES, Dovina's). A safari Egregore is primitives and lofts baked into ONE geometry, swum on the GPU by ONE program for every
// species ('egregore-body', warmed at boot), each body its own uniforms. What each vertex carries:
//   color  its albedo (the Brine dress: a wet grey-blue hide over a pale belly; a koi's, an orca's, a ghost ship's own where its myth says)
//   aFx    x glow (its albedo given off as light: a spot, an eye, a corposant), y mark (the feeling's colour in the film's schiller:
//          fins, markings, a mane, the pearl line), z the body wave's weight (0 the head, 1 the tail), w where it is along the body
//          (z / L: -0.5 the tail .. 0.5 the head)
//   aFin   xyz a flutter's direction and reach, w its phase (+100: the second, slower channel: a head's sway, a dome's breathing). On a
//          habit's part (aShow 1) xyz is the root it grows out of instead
//   aShow  1 a habit's part (the island whale's spout, the kraken's ink): drawn only while the habit shows it (uShow), gathered to its root
// THE SWIM is the Weir fish's (vfx/fishlook.js) for a body that is not a fish: a travelling wave along the body, lateral for a fish's
// tail, vertical for a whale's fluke and for a sea serpent's humps (which break the surface and go under as the wave runs down it, the
// Loch Ness photographs' humps), its normal sheared to match; fins and limbs fluttering from their roots; and a bend of the whole body
// round a turn (`uBend`, its curvature), so a herd's turn is the body's. THE MARK is labradorite's flash (vfx/labradorite.js) in the
// feeling's colour: lit at a grazing look in broad bands that move with the eye, as the film moves on crude.
//
// Prior art: the Weir fish's look (vfx/fishlook.js: the swim in the vertex shader, a fin's flutter weighted from its root), the rail
// foes' kit (vfx/railfoes/kit.js: primitives baked into one geometry, their weights in the vertex) and their onBeforeCompile program
// with a cache key (vfx/railfoes/materials.js); a ship's and a body's lofting (stations along a keel, a section at each); Abzu's and
// Ecco's sea animals (a vertex wave from head to tail, a whale's fluke beating up and down); the shmup dissolve by cells (the ghost ship's).
//
//   const k = new EgregoreKit(L, { wave })   k.add(geo, { c, glow, mark, wave, fin, show, p, r, s })   k.build() -> { geo, tris }
//   loft(stations [[z, rx, ry, y]...], radial) -> BufferGeometry (+Z forward)   limb(points, r0, r1, segs, radial)   fin(pts [z, y], d)
//   flat(pts [x, z], d)   egregoreMaterial({ L, feel, wave, fin }) -> MeshStandardMaterial (userData.u its uniforms)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { slab } from '../railfoes/kit.js';
import { LAB_GLSL, mindTime } from '../labradorite.js';

const PI = Math.PI;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();
const val = (f, x, y, z, ny) => (typeof f === 'function' ? f(x, y, z, ny) : f);

/** A body of revolution along +Z: `stations` [z, rx, ry, y] from the tail to the head, an ellipse at each (its centre `y`), the ends
 *  closed; smooth (the ring has no seam). Sections between stations are eased (Catmull-Rom on each column). */
export function loft(stations, radial = 12, steps = 3) {
  const S = [];
  for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < steps; j++) {
    const t = j / steps, a = stations[Math.max(0, i - 1)], b = stations[i], c = stations[i + 1], d = stations[Math.min(stations.length - 1, i + 2)];
    S.push(b.map((_, k) => { const p0 = a[k], p1 = b[k], p2 = c[k], p3 = d[k]; return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t); }));
  }
  S.push(stations[stations.length - 1]);
  const pos = [], idx = [];
  pos.push(0, S[0][3], S[0][0]);
  for (const [z, rx, ry, y] of S) for (let j = 0; j < radial; j++) { const a = (j / radial) * PI * 2; pos.push(Math.cos(a) * Math.max(0.001, rx), y + Math.sin(a) * Math.max(0.001, ry), z); }
  const last = S[S.length - 1]; pos.push(0, last[3], last[0]);
  const ring = (i, j) => 1 + i * radial + (j % radial), end = 1 + S.length * radial;
  for (let j = 0; j < radial; j++) idx.push(0, ring(0, j + 1), ring(0, j));
  for (let i = 0; i < S.length - 1; i++) for (let j = 0; j < radial; j++) { const a = ring(i, j), b = ring(i, j + 1), c = ring(i + 1, j), d = ring(i + 1, j + 1); idx.push(a, b, d, a, d, c); }
  for (let j = 0; j < radial; j++) idx.push(end, ring(S.length - 1, j), ring(S.length - 1, j + 1));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** A tapering tube through points (an arm, a leg, a tail, a neck): radius r0 at the first point to r1 at the last. */
export function limb(points, r0, r1, segs = 12, radial = 7) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false), P = g.attributes.position.array, n = g.attributes.position.count;
  const per = radial + 1;
  for (let i = 0; i < n; i++) {
    const seg = Math.floor(i / per), t = seg / segs, c = curve.getPointAt(t), r = r0 + (r1 - r0) * t;
    _v.set(P[i * 3] - c.x, P[i * 3 + 1] - c.y, P[i * 3 + 2] - c.z).multiplyScalar(r);
    P[i * 3] = c.x + _v.x; P[i * 3 + 1] = c.y + _v.y; P[i * 3 + 2] = c.z + _v.z;
  }
  const tip = new THREE.SphereGeometry(Math.max(0.001, r1), radial, 4).translate(...points[points.length - 1]);
  const root = new THREE.SphereGeometry(Math.max(0.001, r0), radial, 4).translate(...points[0]);
  g.deleteAttribute('uv'); tip.deleteAttribute('uv'); root.deleteAttribute('uv');
  const out = mergeGeometries([g.toNonIndexed(), tip.toNonIndexed(), root.toNonIndexed()]);
  out.computeVertexNormals();
  return out;
}

/** A flat outline standing in the body's middle plane (points [z, y]), thickness along X: a dorsal fin, a fluke seen side-on, a sail. */
export const fin = (pts, d = 0.04) => slab(pts, d).rotateY(-PI / 2);
/** A flat outline lying in XZ (points [x, z]), thickness along Y: a pectoral fin, a fluke, a flipper. */
export const flat = (pts, d = 0.04) => slab(pts.map(([x, z]) => [x, -z]), d).rotateX(-PI / 2);

export class EgregoreKit {
  /** `L` the body's length in its own metres (aFx.w = z / L); `wave` the species' body-wave weight (x, y, z) -> 0..1, a piece's default. */
  constructor(L, { wave = 0 } = {}) { this.L = L; this.wave = wave; this.items = []; }

  /** One primitive: c a hex or (x, y, z, ny) -> hex in the body's frame; glow, mark, wave numbers or functions the same way; fin null,
   *  [dx, dy, dz, phase] or a function (x, y, z) -> that (phase +100: the slow channel); show 1 for a habit's part (fin then its root). */
  add(geo, { c = 0x4a5a66, glow = 0, mark = 0, wave = this.wave, fin: fl = null, show = 0, p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
    let G = geo.index ? geo.toNonIndexed() : geo.clone();
    if (G !== geo) geo.dispose();
    for (const k of Object.keys(G.attributes)) if (k !== 'position' && k !== 'normal') G.deleteAttribute(k);
    if (!G.attributes.normal) G.computeVertexNormals();
    _s.set(...(Array.isArray(s) ? s : [s, s, s]));
    G.applyMatrix4(_m.compose(_v.set(...p), _q.setFromEuler(_e.set(r[0], r[1], r[2], r[3] || 'XYZ')), _s));
    const n = G.attributes.position.count, P = G.attributes.position.array, N = G.attributes.normal.array;
    const col = new Float32Array(n * 3), fx = new Float32Array(n * 4), fn = new Float32Array(n * 4), sh = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], ny = N[i * 3 + 1];
      _c.setHex(val(c, x, y, z, ny)); col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
      fx[i * 4] = val(glow, x, y, z, ny); fx[i * 4 + 1] = val(mark, x, y, z, ny); fx[i * 4 + 2] = val(wave, x, y, z, ny); fx[i * 4 + 3] = THREE.MathUtils.clamp(z / this.L, -0.5, 0.5);
      const f = typeof fl === 'function' ? fl(x, y, z) : fl;
      if (f) { fn[i * 4] = f[0]; fn[i * 4 + 1] = f[1]; fn[i * 4 + 2] = f[2]; fn[i * 4 + 3] = f[3] || 0; }
      sh[i] = show;
    }
    G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    G.setAttribute('aFx', new THREE.BufferAttribute(fx, 4));
    G.setAttribute('aFin', new THREE.BufferAttribute(fn, 4));
    G.setAttribute('aShow', new THREE.BufferAttribute(sh, 1));
    this.items.push(G);
    return this;
  }

  /** A boulder (the island whale's rocks): an icosahedron welded and pushed in and out. */
  lump(r, rng, o = {}) {
    let g = new THREE.IcosahedronGeometry(r, 1); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
    const P = g.attributes.position.array;
    for (let i = 0; i < P.length; i += 3) { const k = 1 + 0.25 * (rng() * 2 - 1); P[i] *= k; P[i + 1] *= k; P[i + 2] *= k; }
    g.computeVertexNormals();
    return this.add(g, { r: [rng() * 6.28, rng() * 6.28, rng() * 6.28], ...o });
  }

  build() {
    const geo = mergeGeometries(this.items);
    for (const g of this.items) g.dispose();
    geo.computeBoundingSphere();
    return { geo, tris: geo.attributes.position.count / 3 };
  }
}

const VERT_PARS = /* glsl */`
attribute vec4 aFx;
attribute vec4 aFin;
attribute float aShow;
uniform float uT, uLen, uBend, uShow;
uniform vec4 uWave;   // x its height (the body's metres), y its phase (integrated on the CPU: the rate follows the speed), z waves a body length (radians), w the vertical share
uniform vec4 uFin;    // x the flutter's rate, y its size, z the slow channel's rate, w its size
varying vec2 vFx;
varying vec3 vObj;
vec3 egP;
`;
const VERT_NORMAL = /* glsl */`
#include <beginnormal_vertex>
{
  vec3 p = position;
  float ph = uWave.y - (0.5 - aFx.w) * uWave.z;
  vec3 D = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), uWave.w);
  float A = uWave.x * aFx.z;
  p += D * A * sin(ph);
  objectNormal.z -= A * cos(ph) * uWave.z / uLen * dot(objectNormal, D);   // (the normal sheared with the wave: J^-T n)
  if (aShow > 0.5) {                                                          // a habit's part, grown out of its root
    float g = uShow * (1.0 + 0.06 * sin(uT * 7.0 + p.y));
    p = aFin.xyz + (p - aFin.xyz) * g;
  } else {
    bool slow = aFin.w >= 99.0;
    float rate = slow ? uFin.z : uFin.x, amp = slow ? uFin.w : uFin.y;
    p += aFin.xyz * sin(uT * rate + aFin.w) * amp;
  }
  if (abs(uBend) > 1e-5) {                                                    // the body bent round its turn, its middle where it was
    float r = 1.0 / uBend, a = p.z * uBend, c = cos(a), s = sin(a), rx = r - p.x;
    p = vec3(r - rx * c, p.y, rx * s);
    objectNormal = vec3(c * objectNormal.x + s * objectNormal.z, objectNormal.y, -s * objectNormal.x + c * objectNormal.z);
  }
  egP = p; vFx = aFx.xy; vObj = position;
}
`;
const FRAG_PARS = /* glsl */`
uniform vec3 uFeel;
uniform float uGlow, uVanish, uLen, uT;
varying vec2 vFx;
varying vec3 vObj;
${LAB_GLSL}
`;
const FRAG_VANISH = /* glsl */`
#include <clipping_planes_fragment>
if (uVanish > 0.0) {                                                          // (the ghost ship's vanishing: cells of the body, fixed to it, so nothing crawls)
  vec3 cell = floor(vObj / (uLen * 0.025));
  float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  if (h < uVanish) discard;
}
`;
const FRAG_EMIT = /* glsl */`
#include <emissivemap_fragment>
{
  vec3 Vd = normalize(vViewPosition);
  float ndv = clamp(abs(dot(normal, Vd)), 0.0, 1.0), graze = pow(1.0 - ndv, 1.4);
  float ph = labPhase(vObj * (9.0 / uLen), Vd) + uT * 0.02;
  float band = smoothstep(0.2, 0.85, 0.5 + 0.5 * sin(ph * 12.566));
  vec3 mark = uFeel * (0.3 + 0.7 * band) * (0.55 + 0.9 * graze) + labradorite(ph) * graze * band * 0.55;
  totalEmissiveRadiance += vFx.y * mark * (0.5 + uGlow);
  totalEmissiveRadiance += diffuseColor.rgb * vFx.x * (1.0 + uGlow);
}
`;

/** One body's material: the shared 'egregore-body' program, its own uniforms. `feel` a THREE.Color (the feeling's), `wave`
 *  [height, waves a body length, vertical share], `fin` [rate, size, slow rate, slow size]. */
export function egregoreMaterial({ L = 1, feel = new THREE.Color(1, 1, 1), wave = [0, 0, 0], fin: f = [0, 0, 0, 0], roughness = 0.36 } = {}) {
  const u = {
    uT: { value: 0 }, uLen: { value: L }, uBend: { value: 0 }, uShow: { value: 0 }, uWave: { value: new THREE.Vector4(wave[0], 0, wave[1], wave[2]) },
    uFin: { value: new THREE.Vector4(...f) }, uFeel: { value: feel.clone() }, uGlow: { value: 0 }, uVanish: { value: 0 }, uMindT: mindTime,
  };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness: 0.04 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${VERT_PARS}`)
      .replace('#include <beginnormal_vertex>', VERT_NORMAL).replace('#include <begin_vertex>', 'vec3 transformed = egP;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${FRAG_PARS}`)
      .replace('#include <clipping_planes_fragment>', FRAG_VANISH).replace('#include <emissivemap_fragment>', FRAG_EMIT);
  };
  m.customProgramCacheKey = () => 'egregore-body';
  m.userData.u = u;
  return m;
}
