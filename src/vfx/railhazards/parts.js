// ---------------------------------------------------------------------------------------
// A HAZARD'S LOOK, ITS PARTS: the geometry and the one new program the crossing's hazards are drawn from (vfx/railhazards.js; Dovina's
// docs/plans/RAIL-STANDARDS.md section 4). Built once each, at boot, and instanced.
//
//   archGeometry(A)     the arch's stone: two piers, their imposts, and a ring of voussoirs (A.stones, the keystone proud of the rest),
//                       each block its own box with its own 0..1 uv, so the Mind's slab program (vfx/railgeometry.js) draws its thin
//                       glowing edge round every block: the joints of a ruin's masonry in the monolith's black labradorite
//   archRimGeometry(A)  the arch's lit thread: a fine tube along both edges of the intrados (up a pier, round, down the other), the gold
//                       a lit arch wears where it can be threaded
//   crackGeometry()     a crack star a metre round in the XY plane (normal +Z): seven jagged runs with offshoots, tapering
//   crudeGlassMaterial() the gate's wall: crude cast as glass (the one new program): ink with the stone's schiller, the oil film at a
//                       grazing look (world/treasure/cubes.js oilMaterial's run of colours), crude streaking slowly down it, faint panes
//                       every 2 m and its outline in pale teal, wet at the waterline; a hit crazes it hot (a Voronoi crackle, cooling).
//                       Per instance: aLit (risen 0..1), aSeed, aFlash (a hit, 0..1). Its vertex ends in three's project_vertex, so
//                       the storm's deepMaterial / keepTrue take it unchanged (vfx/stormwarp.js)
//
// Prior art: the voussoir arch (a ring of wedge stones locked by its keystone, Roman and after); the Mind's slab and its edge glow
// (vfx/railgeometry.js); the oil film of a crude slick (vfx/oxidation.js, cubes.js); Worley's cellular noise (1996) for the crazing; the
// fwidth-wide line of every anti-aliased grid shader, faded to its average where finer than a few pixels (no aliasing crawl).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAB_GLSL, mindTime } from '../labradorite.js';

/** The arch's stone, its origin on the crude under the middle of the opening; the opening in the XY plane (flown through along Z). */
export function archGeometry(A) {
  const R = A.span / 2, S = A.spring, D = A.depth, parts = [];
  for (const sx of [-1, 1]) {
    const pier = new THREE.BoxGeometry(A.pier, S - A.foot, D); pier.translate(sx * (R + A.pier / 2), (S + A.foot) / 2, 0); parts.push(pier);
    const impost = new THREE.BoxGeometry(A.pier + 0.5, 0.45, D + 0.4); impost.translate(sx * (R + A.pier / 2), S - 0.22, 0); parts.push(impost);
  }
  const n = A.stones, gap = 0.035; // (the joints: a hair of angle between blocks)
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (1 - i / n) - gap, a1 = Math.PI * (1 - (i + 1) / n) + gap, key = i === (n - 1) / 2;
    const out = key ? A.ring + 0.4 : A.ring, deep = key ? D + 0.3 : D;
    const g = new THREE.BoxGeometry(1, 1, 1), p = g.attributes.position;
    for (let v = 0; v < p.count; v++) { // (the unit box bent into a wedge: x along the ring, y out from it)
      const a = a0 + (a1 - a0) * (p.getX(v) + 0.5), r = R + out * (p.getY(v) + 0.5);
      p.setXYZ(v, Math.cos(a) * r, S + Math.sin(a) * r, p.getZ(v) * deep);
    }
    g.computeVertexNormals(); parts.push(g);
  }
  const geo = mergeGeometries(parts); parts.forEach((g) => g.dispose());
  return geo;
}

/** The intrados as a curve: up the left pier from the crude, round the half circle, down the right. */
class Intrados extends THREE.Curve {
  constructor(r, spring, foot, z) { super(); this.r = r; this.s = spring; this.f = foot; this.z = z; }
  getPoint(t, out = new THREE.Vector3()) {
    const leg = this.s - this.f, arc = Math.PI * this.r, d = t * (2 * leg + arc);
    if (d < leg) return out.set(-this.r, this.f + d, this.z);
    if (d < leg + arc) { const a = Math.PI - (d - leg) / this.r; return out.set(Math.cos(a) * this.r, this.s + Math.sin(a) * this.r, this.z); }
    return out.set(this.r, this.s - (d - leg - arc), this.z);
  }
}
/** The lit thread: a fine tube on both edges of the opening (its two faces), from just under the crude. */
export function archRimGeometry(A) {
  const R = A.span / 2 - 0.02, z = A.depth / 2 + 0.01;
  const a = new THREE.TubeGeometry(new Intrados(R, A.spring, -0.6, -z), 32, 0.16, 4, false), b = new THREE.TubeGeometry(new Intrados(R, A.spring, -0.6, z), 32, 0.16, 4, false); // (0.16 m: the gold reads as a line at the chase's distance, the sheet's 0.1 did not)
  for (const g of [a, b]) { g.deleteAttribute('uv'); g.deleteAttribute('normal'); }
  const geo = mergeGeometries([a, b]); a.dispose(); b.dispose();
  return geo;
}

/** A crack star a metre round, flat in XY, facing +Z: seven jagged runs from the blow's point, each with an offshoot (fixed: the same
 *  star every time, turned by its instance). */
export function crackGeometry() {
  const pos = []; let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const seg = (ax, ay, bx, by, w0, w1) => {
    const l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l;
    pos.push(ax + nx * w0, ay + ny * w0, 0, ax - nx * w0, ay - ny * w0, 0, bx + nx * w1, by + ny * w1, 0);
    pos.push(ax - nx * w0, ay - ny * w0, 0, bx - nx * w1, by - ny * w1, 0, bx + nx * w1, by + ny * w1, 0);
  };
  for (let i = 0; i < 7; i++) {
    let a = (i / 7) * Math.PI * 2 + (rnd() - 0.5) * 0.5, x = 0, y = 0, w = 0.07;
    for (let k = 0; k < 4; k++) {
      const len = 0.18 + rnd() * 0.12; a += (rnd() - 0.5) * 0.8;
      const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; seg(x, y, nx, ny, w, w * 0.72);
      if (k === 1) { const b = a + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.4); seg(nx, ny, nx + Math.cos(b) * 0.22, ny + Math.sin(b) * 0.22, w * 0.6, 0.004); }
      x = nx; y = ny; w *= 0.72;
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// ---------------------------------------------------------------- the crude-glass program
const GLASS_V = /* glsl */`attribute float aLit; attribute float aSeed; attribute float aFlash;
varying vec3 vW; varying vec3 vView; varying vec2 vUv; varying vec3 vNw; varying float vLit; varying float vSeed; varying float vFlash; varying vec3 vP;
void main() {
  vec3 transformed = position;
  vUv = uv; vLit = aLit; vSeed = aSeed; vFlash = aFlash;
  vP = position * vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); // (the piece's own metres: its panes and streaks never swim as the rail carries it)
  vec4 w = modelMatrix * instanceMatrix * vec4(transformed, 1.0); vW = w.xyz; vView = cameraPosition - w.xyz;
  vNw = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  #include <project_vertex>
}`;
const GLASS_F = /* glsl */`uniform float uT, uSeaY; uniform vec3 uEdge, uHot;
varying vec3 vW; varying vec3 vView; varying vec2 vUv; varying vec3 vNw; varying float vLit; varying float vSeed; varying float vFlash; varying vec3 vP;
${LAB_GLSL}
vec3 oilFilm(float t) { // (the slick's own run: violet, teal, gold, magenta, and round again; world/treasure/cubes.js)
  t = fract(t) * 4.0;
  vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t));
}
float gHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gLines(float u, float n, float w) {
  float g = u * n, fw = max(fwidth(g), 1e-5), d = abs(fract(g - 0.5) - 0.5) / fw;
  float l = 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d);
  return mix(clamp(w * fw, 0.0, 1.0) * 0.8, l, 1.0 - smoothstep(0.2, 0.45, fw));
}
float gCrackle(vec2 p) { // (Worley's F2 - F1: the cells' borders, a pixel or two wide)
  vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), r = g + vec2(gHash(i + g), gHash(i + g + 17.3)) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  float e = sqrt(d2) - sqrt(d1);
  return 1.0 - smoothstep(0.0, 0.04 + fwidth(e) * 1.5, e);
}
void main() {
  vec3 V = normalize(vView), N = normalize(vNw) * (gl_FrontFacing ? 1.0 : -1.0);
  float ndv = abs(dot(N, V)), fres = pow(1.0 - ndv, 2.2), ph = labPhase(vP, V) + vSeed * 0.3;
  vec3 c = labInk(ph, 0.1 + 0.45 * fres);                                                      // crude in glass: ink, the schiller under it
  c += oilFilm(fres * 0.8 + vP.y * 0.03 + ph * 0.4 + vSeed) * (0.03 + 0.6 * fres * fres);      // the oil film at a grazing look
  float u = fract(vP.x / 1.6 + vSeed * 7.0) - 0.5, col = floor(vP.x / 1.6 + vSeed * 7.0);
  float run = fract(gHash(vec2(col, vSeed)) + vP.y * 0.05 + uT * (0.05 + 0.05 * gHash(vec2(col, 3.0))));
  float streak = exp(-u * u * 16.0) * smoothstep(0.55, 0.95, run) * 0.6;                      // crude running slowly down it
  c = mix(c, LAB_INK * 0.4, streak * 0.7) + oilFilm(run + ph) * streak * 0.06;
  float pane = max(gLines(vP.x, 0.5, 1.5), gLines(vP.y, 0.5, 1.5)) * 0.35;                    // cast in panes, 2 m
  vec2 e = min(vUv, 1.0 - vUv) / max(fwidth(vUv), vec2(1e-5));
  float edge = 1.0 - smoothstep(0.6, 1.8, min(e.x, e.y));                                     // its outline
  c += uEdge * (pane * 0.45 + edge * 1.3);
  float h = vW.y - uSeaY, wet = (1.0 - smoothstep(0.0, 1.2 + 6.0 * (1.0 - vLit), h)) * step(-0.5, h);
  c = mix(c, c * 0.5 + oilFilm(ph + uT * 0.05) * 0.05, wet);                                  // wet at the waterline
  float a = 0.5 + 0.35 * fres + edge * 0.4 + pane * 0.2 + streak * 0.25;
  if (vFlash > 0.01) { float cr = gCrackle(vP.xy * 0.55 + vSeed * 13.0); c += uHot * cr * 1.6 * vFlash; a = max(a, cr * vFlash * 0.6); } // a hit: crazed hot in hairlines, cooling (no wash: the first look's whole pane of orange was louder than the blow)
  gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
  #include <colorspace_fragment>
}`;

/** The gate's crude-glass (one program). `T` is its clock ({ value }), advanced by its owner. */
export function crudeGlassMaterial({ T = { value: 0 }, edge = 0x9fe8de, hot = 0xff9a4a, seaY = 0 } = {}) {
  return new THREE.ShaderMaterial({
    name: 'rail-hazard-crude-glass',
    uniforms: { uT: T, uSeaY: { value: seaY }, uEdge: { value: new THREE.Color(edge).multiplyScalar(0.6) }, uHot: { value: new THREE.Color(hot) }, uMindT: mindTime },
    vertexShader: GLASS_V, fragmentShader: GLASS_F,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false,
  });
}
/** An InstancedMesh of the crude-glass, with its three per-instance numbers (risen, seed, a hit's flash). */
export function crudeGlassMesh(geometry, material, max) {
  const lit = new Float32Array(max), seed = new Float32Array(max).map(() => Math.random()), flash = new Float32Array(max);
  geometry.setAttribute('aLit', new THREE.InstancedBufferAttribute(lit, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
  geometry.setAttribute('aFlash', new THREE.InstancedBufferAttribute(flash, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.InstancedMesh(geometry, material, max); m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.userData.lit = lit; m.userData.flash = flash; m.userData.zoneFree = true;
  return m;
}
