// ---------------------------------------------------------------------------------------
// THE BUBBLE (S2 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a fresnel dome of glass, glaze or hard light. Stasis's
// and the Slow Field's sphere edge (51, 52: the time grade inside is S7's), the Holowall's hex wall in your glaze colour, cracking where
// struck (76), the Barrier's glass dome (77: the arcs over it are lightning's, S3). Clear in the middle and bright at its rim, as a soap
// bubble or a glass float is, with one of three faces on it:
//
//   'hex'      a GEODESIC hard-light shell: the cells are the Voronoi of a subdivided icosahedron's corners, so a sphere is hexagons with
//              the twelve pentagons a Goldberg polyhedron must have (Buckminster Fuller's domes), and a wall the same net laid flat
//   'crackle'  GUAN glaze's crackle: two nets of crazing, the coarse "iron wire" dark and the fine "golden thread" bright (the Song
//              dynasty's jinsi tiexian), the glaze shrinking more than the body as it cooled
//   'clear'    glass alone: the rim, and the thin film's colours
// Over any of them the THIN FILM (a soap bubble's interference colours, its film thickest at the bottom as it drains: Lachryma's oil
// film is the same physics, so it takes the oil film's colours, vfx/oxidation.js) and the Mind's schiller where a sphere is psychic
// (labradorite, vfx/labradorite.js). A blow on it (`hit`) sends a ring out from where it landed and brightens the cells there; `crack`
// (0..1) opens the crackle round the blows, the Holowall breaking.
//
// No crawl (CLAUDE.md): every line is at least a pixel and a half and its edge antialiased (fwidth); when the cells shrink under a few
// pixels the net fades to its mean, so a far dome is a soft glassy ball, never a moire.
//
// Prior art: Halo's bubble shield and Ratchet & Clank's Holoshield Glove (a hex skin of hard light that ripples where it is struck),
// Goldberg polyhedra and Fuller's geodesic domes, guan and ge ware crackle, the soap film's thin-film interference (Newton's rings).
//
//   const B = create({ shape, radius, width, height, cell, pattern, tint, rim, film, labradorite, fill, lines, k })   scene.add(B.object)
//     shape: 'sphere' | 'dome' (the upper half) | 'wall' (width x height, standing on its foot, facing +Z)
//   B.set({ ...the same but shape and cell, crack, pos })   B.hit(worldPoint)   B.update(dt)   B.dispose()
//   vfxLayer(game, handle, layer, color)   the effect library's `caster` layer: { shader: 'bubble', shape, radius, pattern, ... }
//   prewarm(scene) -> park()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ownUniforms, NOISE_GLSL, GROUND_Y } from './casterkit.js';
import { OXIDATION_GLSL } from '../oxidation.js';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';

const HITS = 4, HIT_LIFE = 1.2;
export const BUBBLE_PATTERNS = ['clear', 'hex', 'crackle'];

const VERT = /* glsl */`
attribute vec3 aA, aB, aC;
varying vec3 vL, vA, vB, vC, vN, vV, vW;
void main() {
  vL = position; vA = aA; vB = aB; vC = aC;
  vec4 w = modelMatrix * vec4(position, 1.0), mv = viewMatrix * w;
  vW = w.xyz; vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform float uK, uTime, uPattern, uFilm, uLab, uFill, uLines, uCrack, uSpacing, uCrackScale;
uniform vec3 uTint, uRim;
uniform vec4 uHits[${HITS}];
varying vec3 vL, vA, vB, vC, vN, vV, vW;
${NOISE_GLSL}
${OXIDATION_GLSL}
${LAB_GLSL}
// a net's line at e (0 on the line), its width w in e's units, faded to its mean where the cells are under a few pixels (px)
float netLine(float e, float w, float px) {
  float aa = max(fwidth(e), 1e-5), lw = max(w, aa * 1.5);
  float l = 1.0 - smoothstep(lw - aa, lw + aa, e);
  return mix(0.12, l, smoothstep(3.0, 6.0, px)); // (a net too fine to draw is its mean: a faint even glow)
}
// crazing: the edges of a 3D cell net (F2 - F1), 0 on a crack
float crackle(vec3 p) {
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), o = vec3(hash3(i + g), hash3(i + g + 17.3), hash3(i + g + 41.9));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
void main() {
  vec3 N = normalize(vN), V = normalize(vV), Vw = normalize(cameraPosition - vW);
  float facing = abs(dot(N, V)), fres = 1.0 - facing, rim = pow(fres, 2.5);
  float px = 1.0 / max(length(fwidth(vL)), 1e-5); // (pixels a local unit spans here)
  float lines = 0.0, near = 0.0, ripple = 0.0;
  // the blows: a ring out from each, and the cells near it lit
  for (int i = 0; i < ${HITS}; i++) {
    vec4 h = uHits[i]; if (h.w < 0.0 || h.w > ${HIT_LIFE.toFixed(1)}) continue;
    float d = distance(vL, h.xyz), life = 1.0 - h.w / ${HIT_LIFE.toFixed(1)};
    ripple += exp(-pow((d - h.w * 2.2 * uSpacing * 4.0) / (uSpacing * 0.9), 2.0)) * life * life;
    near = max(near, exp(-d / (uSpacing * 2.5)) * life);
  }
  vec3 col = uTint * (0.08 * uFill + 0.9 * rim);
  if (uPattern > 0.5 && uPattern < 1.5) { // the geodesic: which of the triangle's three corners is nearest, and how near the next
    vec3 d = vec3(distance(vL, vA), distance(vL, vB), distance(vL, vC));
    float d1 = min(d.x, min(d.y, d.z)), d3 = max(d.x, max(d.y, d.z)), d2 = d.x + d.y + d.z - d1 - d3;
    float e = d2 - d1;
    lines = netLine(e, uSpacing * 0.035, uSpacing * px);
    vec3 cell = d1 == d.x ? vA : d1 == d.y ? vB : vC;
    float breathe = 0.5 + 0.5 * sin(uTime * 1.3 + hash3(cell * 13.1) * 6.283); // (each cell breathes slowly on its own: never a flicker)
    col += uTint * (0.10 + 0.12 * breathe) * smoothstep(0.0, uSpacing * 0.3, e) * (0.4 + rim) * uFill; // (a tile's bevel)
  } else if (uPattern > 1.5) { // guan's crackle: the coarse dark net and the fine bright one
    float s = uCrackScale / uSpacing;
    float coarse = netLine(crackle(vL * s), 0.04, px / s), fine = netLine(crackle(vL * s * 2.7 + 3.1), 0.05, px / (s * 2.7));
    col = mix(col, col * 0.35, coarse * 0.6);
    lines = fine * 0.6;
  }
  // a blow's crack: the crackle opened round where it landed, the Holowall breaking
  float cr = uCrack * max(near * 1.5, 0.25 * uCrack);
  if (cr > 0.001) { float c = netLine(crackle(vL * 2.4 / uSpacing), 0.06, px * uSpacing / 2.4); col += vec3(1.0, 0.95, 0.85) * c * cr * 1.6; }
  lines *= uLines * (0.35 + 0.65 * rim + near * 1.5);
  col += mix(uTint * 1.6, uRim, 0.35) * lines;
  // the thin film: thickest at the foot as it drains, its colour walking with the angle
  float th = 0.5 - 0.25 * normalize(vL + 1e-4).y + 0.18 * fbm3(vL * 1.3 + vec3(0.0, uTime * 0.04, 0.0));
  col += oxFilm(th * 1.6 + fres * 0.7) * fres * uFilm * 0.9;
  // the Mind's schiller at a grazing look
  col = mix(col, labSoft(labPhase(vW, Vw)) * 1.3, uLab * rim * 0.8);
  col += uRim * rim * rim * 0.6 + uTint * ripple * 1.8 + uRim * near * lines;
  float a = clamp(0.06 * uFill + 0.75 * rim + 0.5 * lines + 0.6 * ripple + 0.6 * cr, 0.0, 1.0) * uK;
  if (!gl_FrontFacing) { col *= 0.55; a *= 0.6; } // (the far wall, seen through the near)
  gl_FragColor = vec4(col, a);
}`;

let MAT = null;
function material() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({
    name: 'caster-bubble', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uK: { value: 1 }, uTime: { value: 0 }, uPattern: { value: 1 }, uFilm: { value: 0.5 }, uLab: { value: 0 }, uFill: { value: 1 }, uLines: { value: 1 }, uCrack: { value: 0 }, uSpacing: { value: 0.1 }, uCrackScale: { value: 0.35 }, uTint: { value: new THREE.Color() }, uRim: { value: new THREE.Color() }, uHits: { value: Array.from({ length: HITS }, () => new THREE.Vector4(0, 0, 0, -1)) }, uMindT: mindTime },
  });
  return MAT;
}

// the nets: each triangle carries its three corners, so a fragment finds its cell (the nearest corner) without a search
const GEO = {};
function corners(g) {
  const p = g.attributes.position.array, n = p.length, A = new Float32Array(n), B = new Float32Array(n), C = new Float32Array(n);
  for (let t = 0; t < n; t += 9) for (let v = 0; v < 9; v += 3) for (let k = 0; k < 3; k++) { A[t + v + k] = p[t + k]; B[t + v + k] = p[t + 3 + k]; C[t + v + k] = p[t + 6 + k]; }
  g.setAttribute('aA', new THREE.BufferAttribute(A, 3)); g.setAttribute('aB', new THREE.BufferAttribute(B, 3)); g.setAttribute('aC', new THREE.BufferAttribute(C, 3));
  return g;
}
function sphereNet(detail, dome) {
  const key = `${dome ? 'dome' : 'sphere'}${detail}`;
  if (GEO[key]) return GEO[key];
  let g = new THREE.IcosahedronGeometry(1, detail); // (non-indexed: three corners a triangle)
  if (dome) { // (the triangles over the ground; the jagged foot is a geodesic dome's own, and the ground covers it)
    const p = g.attributes.position.array, keep = [];
    for (let t = 0; t < p.length; t += 9) if (p[t + 1] + p[t + 4] + p[t + 7] > -0.15) for (let k = 0; k < 9; k++) keep.push(p[t + k]);
    g.dispose(); g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal; for (let i = 0; i < P.count; i++) { const l = Math.hypot(P.getX(i), P.getY(i), P.getZ(i)); N.setXYZ(i, P.getX(i) / l, P.getY(i) / l, P.getZ(i) / l); } // (a sphere's own normals)
  }
  return (GEO[key] = corners(g));
}
function wallNet(w, h, s) {
  const key = `wall${w}x${h}@${s}`;
  if (GEO[key]) return GEO[key];
  const dy = s * Math.sqrt(3) / 2, cols = Math.ceil(w / s) + 1, rows = Math.ceil(h / dy) + 1, P = (c, r) => [-w / 2 + c * s + (r % 2 ? s / 2 : 0), r * dy, 0], out = [];
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { // (a triangular lattice: its Voronoi is hexagons)
    const a = P(c, r), b = P(c + 1, r), u = P(c, r + 1), v = P(c + 1, r + 1);
    if (r % 2 === 0) out.push(...a, ...b, ...u, ...b, ...v, ...u); else out.push(...a, ...b, ...v, ...a, ...v, ...u);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(out.length).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
  return (GEO[key] = corners(g));
}

const _l = new THREE.Vector3();

export class Bubble {
  constructor({ shape = 'sphere', radius = 2, width = 4, height = 2.4, cell = 0.35, pattern = 'hex', tint = 0x8fd0ff, rim = 0xffffff, film = 0.5, labradorite = 0, fill = 1, lines = 1, crack = 0, k = 1 } = {}) {
    this.shape = shape; this.radius = radius;
    let geo, spacing;
    if (shape === 'wall') { geo = wallNet(width, height, cell); spacing = cell; }
    else { const detail = THREE.MathUtils.clamp(Math.round(radius * 1.05 / cell) - 1, 1, 24); geo = sphereNet(detail, shape === 'dome'); spacing = 1.05 / (detail + 1); }
    this.hits = Array.from({ length: HITS }, () => new THREE.Vector4(0, 0, 0, -1)); this.nextHit = 0;
    this.u = { uK: { value: k }, uTime: { value: Math.random() * 30 }, uPattern: { value: Math.max(0, BUBBLE_PATTERNS.indexOf(pattern)) }, uFilm: { value: film }, uLab: { value: labradorite }, uFill: { value: fill }, uLines: { value: lines }, uCrack: { value: crack }, uSpacing: { value: spacing }, uCrackScale: { value: 0.35 }, uTint: { value: new THREE.Color(tint) }, uRim: { value: new THREE.Color(rim) }, uHits: { value: this.hits } };
    const mat = material();
    this.object = new THREE.Mesh(geo, mat);
    this.object.name = 'caster-bubble'; this.object.frustumCulled = false; this.object.renderOrder = 7; this.object.userData.moodExempt = true;
    if (shape !== 'wall') this.object.scale.setScalar(radius);
    ownUniforms(this.object, mat, this.u);
  }
  get k() { return this.u.uK.value; }
  set(p = {}) {
    const u = this.u;
    for (const [key, name] of [['k', 'uK'], ['film', 'uFilm'], ['labradorite', 'uLab'], ['fill', 'uFill'], ['lines', 'uLines'], ['crack', 'uCrack']]) if (p[key] !== undefined) u[name].value = p[key];
    if (p.pattern !== undefined) u.uPattern.value = Math.max(0, BUBBLE_PATTERNS.indexOf(p.pattern));
    if (p.tint !== undefined) u.uTint.value.set(p.tint);
    if (p.rim !== undefined) u.uRim.value.set(p.rim);
    if (p.radius !== undefined && this.shape !== 'wall') { this.radius = p.radius; this.object.scale.setScalar(p.radius); }
    if (p.pos) this.object.position.copy(p.pos);
    return this;
  }
  /** A blow landed at a point in the world: a ring goes out from it, and the cells there light (and crack, with `crack`). */
  hit(point) {
    this.object.updateMatrixWorld(); this.object.worldToLocal(_l.copy(point));
    this.hits[this.nextHit].set(_l.x, _l.y, _l.z, 0); this.nextHit = (this.nextHit + 1) % HITS;
    return this;
  }
  update(dt) {
    this.u.uTime.value = (this.u.uTime.value + dt) % 600; mindTick();
    for (const h of this.hits) if (h.w >= 0) h.w = h.w + dt > HIT_LIFE ? -1 : h.w + dt;
    this.object.visible = this.u.uK.value > 0.002;
  }
  dispose() { this.object.parent?.remove(this.object); this.object.onBeforeRender = () => {}; }
}
export const create = (opts) => new Bubble(opts);

/** The effect library's layer (vfx/vfx.js `caster`): a bubble at the effect's place, blown up over the layer's `grow` (real seconds). */
export function vfxLayer(game, h, L, color) {
  const B = new Bubble({ shape: L.shape, radius: (L.radius ?? 2) * (h.ctx.scale ?? 1), width: L.width, height: L.height, cell: L.cell, pattern: L.pattern, tint: color(L.tint ?? 'tint', h.ctx), rim: color(L.rim ?? 'white', h.ctx), film: L.film, labradorite: L.labradorite, fill: L.fill, k: 0 });
  game.scene.add(B.object);
  const r0 = B.radius, grow = L.grow ?? 0.25; // (it blows up from nothing over `grow` real seconds, overshooting a little, as a bubble does)
  return {
    group: B.object, effect: B,
    frame(h, t, k, raw) { const u = Math.min(1, h.t / grow), s = 1 + 0.08 * Math.sin(u * Math.PI) - Math.pow(1 - u, 3); B.set({ pos: h.pos, k, radius: B.shape === 'wall' ? undefined : r0 * Math.max(0.02, s) }); B.update(raw); },
    dispose: () => B.dispose(),
  };
}

export function prewarm(scene) {
  const B = new Bubble({ radius: 0.5 }); B.object.position.set(0, GROUND_Y, 0); scene.add(B.object);
  return () => B.dispose();
}
