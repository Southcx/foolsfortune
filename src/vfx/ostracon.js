// ---------------------------------------------------------------------------------------
// THE OSTRACA AND THE STELE: how the town that was's writing looks when it is dug up (the owner's direction, 2026-10-08; Espada's names
// and lore, LORE.md "Digging for words"; where they lie and what finding one does are Dovina's, progress/ostraca.js, and Petra builds the
// dig). The ware is Attic black-figure in the hand of the EYE CUP glaze (Calissa's decision): the town that was (Elpis, Espada's
// proposal) wrote on its pots, and its broken pots are the island's paper.
//
//   AN OSTRACON  a curved potsherd of red earthenware a hand across, broken from a pot's belly, its broken edges the paler raw body. Its
//                outer face is the black: the word's RUNE scratched through to the red (runes.js's own strokes, drawn as lines at any
//                size, so it is the glyph the Veritome draws), and beside it a panel left in the red with a black-figure PICTURE of what
//                the word does (vfx/blackfigure.js); a word with no picture has the meander there instead
//   A STELE      an eroded sandstone slab the Courier's height, sand heaped at its foot. The town's runes are cut in rows (the words
//                it is given; until Espada's sentence lands, ruled rows rubbed blank), and along its top runs one painted frieze in the
//                same hand: the town's folk and the slip jellies at work together
//   BURIED       set({ buried }) sinks either into a mound of sand (0 dug clean .. 1 only a corner showing), as fossil.js does. What shows
//                SPARKLES: the black catching the sun, slow, swelling and fading with the sun's angle and the eye's. It is worked out
//                once a sparkle (not a pixel), and drawn never smaller than a few lines, so it cannot crawl
//
// One canvas a word, shared by every ostracon of that word; one program for every ostracon (a standard material taught a potsherd's
// three faces: the painted face, the inside with its throwing lines, the raw edge; the black smooth, the clay rough). The words are the
// glossary's: a potsherd (the sherds are the Great Slip Jelly's calves), the black (a gloss is the Crib Sheet's), a stele (Espada's
// "ledger stone" in Dovina's glossary: the ledger is the game's counts), a sparkle (glints are the water's).
//
// Prior art, as a museum label: the ostraca of Athens (the Agora's voting potsherds, names scratched through the black to the red,
// Themistocles's among them); Attic black-figure (Exekias; Kleitias's Francois Vase); the Linear B tablets of Knossos and Pylos (a
// palace's lists in a script read long after); the Rosetta Stone (one text in two scripts: here a word beside its picture); La-Mulana's
// tablets, read with its glyph reader; Heaven's Vault's inscriptions (a language learned from what is found); Chants of Sennaar (a
// glossary deduced from pictures); Tunic (a script on one lattice, its manual found a page at a time).
//
//   const O = new Ostracon({ word, picture? })   O.group (rests on its origin)   O.set({ buried })   O.update(dt)   O.dispose()
//   const S = new Stele({ words })               S.group (stands on its origin, its face to +z)   S.set({ buried })   S.update(dt)   S.dispose()
//   (words: the runes in rows, four to a row, or an array of rows; none, the rows ruled and rubbed blank)
//   ostraconThing(word) -> { group, dispose }    the item in the Pneuka Box: a potsherd dug clean, its face to the eye (fossilThing's way)
//   (picture: one of blackfigure.js's ids, 'drink' .. 'hush'; left out, the word's own from PICTURES; unknown, the meander)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { runeStrokes } from '../tools/veritome/mind/runes.js';
import { WARE, PICTURES, paintPicture, paintMeander, paintFrieze } from './blackfigure.js';

// the potsherd (metres: across, up, thick, the pot's radius where it broke); its face's canvas; the stele (across, high, deep; its
// sandstone's tile in metres); the stele's face's canvas
const SW = 0.18, SH = 0.1125, ST = 0.006, SR = 0.22;
const OW = 512, OH = 320;
const EW = 0.8, EH = 1.75, ED = 0.26, TW = 0.8, TH = 0.875;
const FW = 640, FH = 1400;
const SAND = 0xd8b886;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();

// ---- chance from the word, so a word's potsherd breaks the same way every time
function seeded(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function noise3(x, y, z) {
  const h = (i, j, k) => { const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = x - X, v = y - Y, w = z - Z, s = (t) => t * t * (3 - 2 * t), su = s(u), sv = s(v), sw = s(w);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(X, Y, Z), h(X + 1, Y, Z), su), l(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), su), sv), l(l(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), su), l(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), su), sv), sw);
}
const linear = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
function canvasTexture(c, repeat = false) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

// ---- the potsherd's face: the black, the rune scratched through it, the panel left in the red with its picture
function cutRune(g, word, cx, cy, size, w, style) { const k = size / 8; g.beginPath(); for (const [[x0, y0], [x1, y1]] of runeStrokes(word)) { g.moveTo(cx + (x0 - 5) * k, cy + (y0 - 5) * k); g.lineTo(cx + (x1 - 5) * k, cy + (y1 - 5) * k); } g.lineWidth = w; g.strokeStyle = style; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function paintFace(word, picture) {
  const c = document.createElement('canvas'); c.width = OW; c.height = OH; const g = c.getContext('2d'), rnd = seeded(`face:${word}`);
  g.fillStyle = WARE.black; g.fillRect(0, 0, OW, OH);
  // the black is brushed on the turning pot: faint bands of it thinner and browner
  for (let y = 0; y < OH; y += 6) { g.fillStyle = `rgba(90, 52, 30, ${(0.03 + rnd() * 0.05).toFixed(3)})`; g.fillRect(0, y, OW, 3 + rnd() * 3); }
  // two lines left in the red below the picture, as the potter's wheel turned
  g.fillStyle = WARE.clay; g.fillRect(0, 282, OW, 2.5); g.fillRect(0, 289, OW, 1.5);
  // the rune: a wide scratch in the red, its fresh middle paler
  cutRune(g, word, 112, 160, 120, 11, WARE.clay); cutRune(g, word, 112, 160, 120, 4, '#dc8a5c');
  // the panel, with a line left in the red round it
  g.strokeStyle = WARE.clay; g.lineWidth = 2; g.strokeRect(183, 51, 286, 218);
  g.fillStyle = WARE.clay; g.fillRect(190, 58, 272, 204);
  if (!paintPicture(g, picture, 190, 58, 272, 204)) paintMeander(g, 190, 58, 272, 204);
  // age: a few flecks of the black lost from the red, and of the red from the black
  for (let i = 0; i < 40; i++) { const x = rnd() * OW, y = rnd() * OH, r = 0.6 + rnd() * 1.6, inPanel = x > 190 && x < 462 && y > 58 && y < 262; g.fillStyle = inPanel ? 'rgba(200,100,58,0.55)' : 'rgba(200,100,58,0.35)'; g.beginPath(); g.ellipse(x, y, r * 1.5, r, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}

// ---- the potsherd's shape: a superellipse broken inward at a dozen points, each break near straight; curved as the pot's belly was
function potsherdGeometry(word) {
  const rnd = seeded(`potsherd:${word}`), N = 9, K = 5, base = [], e = 2 / 3;
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.45, c = Math.cos(a), s = Math.sin(a), rr = 0.9 + rnd() * 0.22; base.push([Math.sign(c) * Math.abs(c) ** e * rr, Math.sign(s) * Math.abs(s) ** e * rr]); }
  const rim = [];
  for (let i = 0; i < N; i++) { const p = base[i], q = base[(i + 1) % N], bow = (rnd() - 0.5) * 0.05, nx = q[1] - p[1], ny = -(q[0] - p[0]); for (let k = 0; k < K; k++) { const t = k / K, b = Math.sin(t * Math.PI) * bow; rim.push([p[0] + (q[0] - p[0]) * t + nx * b, p[1] + (q[1] - p[1]) * t + ny * b]); } }
  const n = rim.length, inner = [], outer = [];
  for (let j = 0; j < n; j++) {
    const a = j / n * Math.PI * 2, slant = 1 + 0.035 * Math.sin(a * 3 + rnd() * 0.4) - 0.01, chip = Math.max(0, Math.sin(a * 5 + 1.3) - 0.55) * 0.07;
    inner.push([rim[j][0] * slant, rim[j][1] * slant]); outer.push([rim[j][0] * (1 - chip), rim[j][1] * (1 - chip)]);
  }
  const at = ([x, y], depth) => { const u = x * SW / 2, v = y * SH / 2, th = u / SR, r = SR - 1.5 * v * v - depth; return [Math.sin(th) * r, v, Math.cos(th) * r - SR, x / 2 + 0.5, y / 2 + 0.5]; };
  const pos = [], uv = [], face = [], idx = [], RINGS = 6;
  const disc = (ring, depth, f, flip) => {
    const c0 = pos.length / 3; const p0 = at([0, 0], depth); pos.push(p0[0], p0[1], p0[2]); uv.push(p0[3], p0[4]); face.push(f);
    for (let k = 1; k <= RINGS; k++) for (let j = 0; j < n; j++) { const p = at([ring[j][0] * k / RINGS, ring[j][1] * k / RINGS], depth); pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); face.push(f); }
    const V = (k, j) => (k === 0 ? c0 : c0 + 1 + (k - 1) * n + (j % n));
    const tri = (a, b, c) => (flip ? idx.push(a, c, b) : idx.push(a, b, c));
    for (let j = 0; j < n; j++) { tri(V(0, 0), V(1, j), V(1, j + 1)); for (let k = 1; k < RINGS; k++) { tri(V(k, j), V(k + 1, j), V(k + 1, j + 1)); tri(V(k, j), V(k + 1, j + 1), V(k, j + 1)); } }
  };
  disc(outer, 0, 0, false); disc(inner, ST, 1, true);
  for (let j = 0; j < n; j++) {
    const o0 = at(outer[j], 0), o1 = at(outer[(j + 1) % n], 0), i0 = at(inner[j], ST), i1 = at(inner[(j + 1) % n], ST), b = pos.length / 3;
    for (const p of [o0, i0, i1, o1]) { pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); face.push(2); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aFace', new THREE.Float32BufferAttribute(face, 1));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  g.userData.rim = [...outer.map((p) => at(p, 0)), ...inner.map((p) => at(p, ST))].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return g;
}

// ---- one program for every potsherd: the face's texture, the inside's throwing lines, the raw edge; the black smooth, the clay rough
function potsherdMaterial(tex) {
  const m = new THREE.MeshStandardMaterial({ name: 'ostracon', map: tex, roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFace;\nvarying float vFace;\nvarying vec3 vPotsherd;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFace = aFace; vPotsherd = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFace;\nvarying vec3 vPotsherd;')
      .replace('#include <map_fragment>', `#include <map_fragment>
float potsherdLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
if (vFace > 1.5) { diffuseColor.rgb = ${linear(0xe3ad84)} * (0.9 + 0.1 * sin(vPotsherd.x * 70.0 + vPotsherd.y * 90.0)); potsherdLum = 1.0; }
else if (vFace > 0.5) { float ph = vPotsherd.y * 260.0, aa = 1.0 - smoothstep(0.5, 1.5, fwidth(ph)); diffuseColor.rgb = ${linear(0xb75a35)} * (1.0 - 0.08 * aa * (0.5 + 0.5 * sin(ph))); potsherdLum = 1.0; }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.26, 0.88, smoothstep(0.012, 0.05, potsherdLum));');
  };
  m.customProgramCacheKey = () => 'ostracon';
  return m;
}

const FACES = new Map();
function faceFor(word, picture) {
  const key = `${word}|${picture}`; let F = FACES.get(key);
  if (!F) { const tex = canvasTexture(paintFace(word, picture)); F = { key, tex, mat: potsherdMaterial(tex), geo: potsherdGeometry(word), n: 0 }; FACES.set(key, F); }
  F.n++; return F;
}
function letGo(F) { if (--F.n > 0) return; F.mat.dispose(); F.tex.dispose(); F.geo.dispose(); FACES.delete(F.key); }

// ---- the mound: a heap of sand that meets the ground without a line (a gaussian turned on a lathe), one shape and one sand for all
let MOUND = null;
function mound() {
  if (!MOUND) { const pts = []; for (let i = 0; i <= 14; i++) { const r = i / 14; pts.push(new THREE.Vector2(r, (Math.exp(-3 * r * r) - Math.exp(-3)) / (1 - Math.exp(-3)))); } pts.reverse(); MOUND = { geo: new THREE.LatheGeometry(pts, 28), mat: new THREE.MeshStandardMaterial({ name: 'ostracon-sand', color: SAND, roughness: 1 }) }; }
  const m = new THREE.Mesh(MOUND.geo, MOUND.mat); m.receiveShadow = true; return m;
}

// ---- the sparkle: the black catching the sun, once a sparkle (in the vertex shader), a soft star never smaller than a few lines
const SUN = { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() };
const SUNS = new WeakMap();
function sunOf(obj) {
  let root = obj; while (root.parent) root = root.parent;
  if (!root.isScene) return;
  let S = SUNS.get(root);
  if (!S || (S.light && !S.light.parent) || (!S.light && ++S.miss > 240)) { S = { light: null, miss: 0 }; root.traverse((o) => { if (o.isDirectionalLight && (!S.light || (o.castShadow && !S.light.castShadow))) S.light = o; }); SUNS.set(root, S); }
  if (S.light) SUN.value.copy(S.light.getWorldPosition(_a)).sub(S.light.target.getWorldPosition(_b)).normalize();
}
let QUAD = null;
const SPARKLE_VS = `
uniform vec3 uSun; uniform vec3 uN; uniform float uT, uPh, uK, uSize;
varying vec2 vUv; varying float vI;
void main() {
  vUv = uv;
  vec3 c = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 V = normalize(cameraPosition - c), L = normalize(uSun);
  vec3 n = normalize(uN + 0.32 * vec3(sin(uT * 0.53 + uPh), 0.0, cos(uT * 0.41 + uPh * 1.3)));
  float s = smoothstep(0.5, 1.0, dot(n, normalize(L + V))), tw = 0.5 + 0.5 * sin(uT * 1.1 + uPh * 2.0), d = length(cameraPosition - c);
  vI = uK * (0.2 + 0.8 * s * s) * (0.35 + 0.65 * tw * tw) * smoothstep(0.0, 0.2, L.y) * (1.0 - smoothstep(30.0, 45.0, d));
  vec4 mv = viewMatrix * vec4(c, 1.0);
  float sz = max(uSize, 0.045 * -mv.z / projectionMatrix[1][1]) * (0.6 + 0.4 * vI / max(uK, 0.001));
  mv.xy += position.xy * sz; mv.z += 0.06;
  gl_Position = projectionMatrix * mv;
}`;
const SPARKLE_FS = `
uniform vec3 uColor; varying vec2 vUv; varying float vI;
void main() {
  vec2 p = vUv * 2.0 - 1.0; float r = length(p);
  float a = (exp(-r * r * 14.0) + 0.55 * (exp(-abs(p.x) * 9.0 - abs(p.y) * 2.4) + exp(-abs(p.y) * 9.0 - abs(p.x) * 2.4))) * (1.0 - smoothstep(0.7, 1.0, r)) * vI;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * 1.8, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
class Sparkle {
  constructor(size, seed) {
    if (!QUAD) { QUAD = new THREE.PlaneGeometry(1, 1); QUAD.boundingBox = new THREE.Box3(new THREE.Vector3(-0.005, -0.005, -0.005), new THREE.Vector3(0.005, 0.005, 0.005)); QUAD.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.01); }
    this.u = { uSun: SUN, uN: { value: new THREE.Vector3(0, 1, 0) }, uT: { value: 0 }, uPh: { value: seed * 6.2832 }, uK: { value: 0 }, uSize: { value: size }, uColor: { value: new THREE.Color(0xfff0d4) } };
    this.mesh = new THREE.Mesh(QUAD, new THREE.ShaderMaterial({ name: 'ostracon-sparkle', uniforms: this.u, vertexShader: SPARKLE_VS, fragmentShader: SPARKLE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 3;
  }
  /** k: how much it may show (0 none); n: the face's normal there, in the local frame of what it sits on. */
  update(dt, k, n) { this.u.uT.value += dt; this.u.uK.value = k; this.mesh.visible = k > 0.001; this.mesh.parent?.getWorldQuaternion(_q); this.u.uN.value.copy(n).applyQuaternion(_q).normalize(); }
  dispose() { this.mesh.material.dispose(); }
}

export class Ostracon {
  constructor({ word = '', picture } = {}) {
    this.word = String(word).toUpperCase(); this.picture = picture ?? PICTURES[this.word] ?? 'meander';
    this.group = new THREE.Group(); this.group.name = `ostracon-${this.word}`;
    this.F = faceFor(this.word, this.picture);
    this.body = new THREE.Mesh(this.F.geo, this.F.mat); this.body.castShadow = true; this.group.add(this.body);
    this.mound = mound(); this.mound.visible = false; this.group.add(this.mound);
    this.sparkle = new Sparkle(0.09, seeded(this.word)()); this.sparkle.mesh.position.set(0, SH * 0.44, 0.012); this.body.add(this.sparkle.mesh);
    this.normal = new THREE.Vector3(0, 0.3, 1).normalize();
    this.buried = -1; this.set({ buried: 0 });
  }

  /** How buried it is: 0 dug clean, lying face up on the ground .. 1 only its raised corner showing out of a mound of sand. */
  set({ buried = this.buried } = {}) {
    const b = THREE.MathUtils.clamp(buried, 0, 1); if (b === this.buried) return; this.buried = b;
    const tilt = 0.1 + 0.5 * b; this.body.rotation.set(-Math.PI / 2 + tilt, 0, 0); this.body.position.set(0, 0, 0); this.body.updateMatrix();
    let lo = Infinity; for (const p of this.F.geo.userData.rim) lo = Math.min(lo, _a.copy(p).applyMatrix4(this.body.matrix).y);
    this.body.position.y = -lo - 0.018 * b;
    this.mound.visible = b > 0.02; this.mound.scale.set(0.15 + 0.03 * b, 0.045 * b, 0.13 + 0.03 * b); this.mound.position.z = 0.012;
  }

  update(dt = 1 / 60) { sunOf(this.group); this.sparkle.update(dt, THREE.MathUtils.smoothstep(this.buried, 0.3, 0.9), this.normal); }

  dispose() { this.group.parent?.remove(this.group); this.sparkle.dispose(); letGo(this.F); }
}

/** The Pneuka Box's item: a potsherd a hand across, dug clean, its painted face turned to the eye (pneuka/thingmodels.js buildThing). */
export function ostraconThing(word) {
  const O = new Ostracon({ word }); O.body.rotation.set(-0.28, 0.32, 0.04); O.body.position.set(0, 0, 0);
  const group = new THREE.Group(); group.add(O.group); O.update(0);
  return { group, dispose: () => O.dispose() };
}

// ---- the stele: sandstone, its bedding the same on every side; its face the frieze and the rows of runes
let TILE = null;
function sandstoneTile() {
  if (TILE) return TILE;
  const c = document.createElement('canvas'), W = FW, H = Math.round(FH / 2); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = seeded('sandstone');
  g.fillStyle = '#b48f62'; g.fillRect(0, 0, W, H);
  // the bedding: bands laid down by old water, wavy, wrapping top to bottom and side to side
  for (let i = 0; i < 18; i++) {
    const y = (i / 18) * H, h = 10 + rnd() * 26, light = rnd() > 0.5, a = 0.05 + rnd() * 0.08, ph = rnd() * 6.28, amp = 2 + rnd() * 5;
    g.fillStyle = light ? `rgba(226, 196, 150, ${a})` : `rgba(150, 112, 74, ${a})`;
    for (const off of [-H, 0, H]) { g.beginPath(); g.moveTo(0, y + off); for (let x = 0; x <= W; x += 16) g.lineTo(x, y + off + Math.sin((x / W) * 6.2832 * 2 + ph) * amp); for (let x = W; x >= 0; x -= 16) g.lineTo(x, y + off + h + Math.sin((x / W) * 6.2832 * 2 + ph + 0.6) * amp); g.closePath(); g.fill(); }
  }
  // iron in it: soft rusty clouds, and paler leached ones, wrapped so the tile repeats with no join
  for (let i = 0; i < 16; i++) {
    const x = rnd() * W, y = rnd() * H, r = 40 + rnd() * 120, rust = i % 3 !== 0;
    for (const [ox, oy] of [[0, 0], [-W, 0], [W, 0], [0, -H], [0, H]]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, rust ? 'rgba(150, 92, 52, 0.16)' : 'rgba(226, 204, 160, 0.16)'); gr.addColorStop(1, 'rgba(150, 92, 52, 0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); }
  }
  for (let i = 0; i < 5000; i++) { const t = rnd(); g.fillStyle = t < 0.4 ? 'rgba(236, 214, 170, 0.35)' : t < 0.75 ? 'rgba(140, 106, 72, 0.3)' : 'rgba(176, 138, 96, 0.35)'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 1.5, 1 + rnd() * 1.5); }
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, r = 1.5 + rnd() * 3.5; g.fillStyle = 'rgba(232, 206, 160, 0.4)'; g.beginPath(); g.ellipse(x + 0.8, y + 1, r, r * 0.7, 0, 0, 6.2832); g.fill(); g.fillStyle = 'rgba(96, 70, 46, 0.45)'; g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, 6.2832); g.fill(); }
  return (TILE = c);
}
let BODY = null;
function steleBody() { if (!BODY) { const t = canvasTexture(sandstoneTile(), true); BODY = { tex: t, mat: new THREE.MeshStandardMaterial({ name: 'stele-sandstone', map: t, roughness: 0.94 }) }; } return BODY.mat; }

/** A rune cut in the sandstone: the groove's shaded wall, its floor, its lit wall (the light from above and to the left). */
function cutInSandstone(g, word, cx, cy, size, fade = 1) {
  const w = size * 0.11;
  cutRune(g, word, cx - w * 0.22, cy - w * 0.22, size, w * 1.15, `rgba(92, 66, 42, ${0.85 * fade})`);
  cutRune(g, word, cx, cy, size, w * 0.8, `rgba(132, 100, 68, ${0.9 * fade})`);
  cutRune(g, word, cx + w * 0.28, cy + w * 0.28, size, w * 0.32, `rgba(228, 204, 158, ${0.7 * fade})`);
}
function paintStele(words) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d'), rnd = seeded(`stele:${words.join(' ')}`), T = sandstoneTile();
  g.drawImage(T, 0, 0); g.drawImage(T, 0, FH / 2);
  // the frieze along its top, the paint flaked away in patches to the sandstone
  paintFrieze(g, 32, 66, 576, 150);
  g.save(); g.beginPath(); for (let i = 0; i < 15; i++) { const x = 32 + rnd() * 576, y = 66 + rnd() * 150, r = 2.5 + rnd() * (i < 3 ? 12 : 5); g.moveTo(x + r, y); for (let a = 0.5; a < 6.3; a += 0.5) { const rr = r * (0.6 + rnd() * 0.5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.closePath(); }
  g.clip(); g.drawImage(T, 0, 0); g.restore();
  g.strokeStyle = 'rgba(92, 66, 42, 0.6)'; g.lineWidth = 3; g.strokeRect(26, 60, 588, 162);
  // the rows: ruled lines cut first, then the runes, each row centred, wide apart so a word reads as one; rows with no words rubbed blank
  const list = Array.isArray(words[0]) ? words : rowsOf(words, 4), size = 72, pitch = 128, top = 310;
  for (let r = 0; r < 7; r++) {
    const y = top + r * pitch, row = list[r] || [], fade = 1 - 0.35 * Math.max(0, (y - 900) / 300);
    g.fillStyle = `rgba(100, 74, 48, ${0.35 * fade})`; g.fillRect(40, y + size / 2 + 20, FW - 80, 2.5); g.fillStyle = `rgba(232, 208, 164, ${0.3 * fade})`; g.fillRect(40, y + size / 2 + 22.5, FW - 80, 1.5);
    const gap = 54, wide = row.length * size + (row.length - 1) * gap;
    row.forEach((w, i) => cutInSandstone(g, w, FW / 2 - wide / 2 + size / 2 + i * (size + gap), y, size, fade));
  }
  // age: sand-blown pale and smooth near the ground, darker at the foot where the sand lies, the edges darker
  let gr = g.createLinearGradient(0, FH * 0.7, 0, FH); gr.addColorStop(0, 'rgba(238, 216, 176, 0)'); gr.addColorStop(1, 'rgba(238, 216, 176, 0.32)'); g.fillStyle = gr; g.fillRect(0, FH * 0.7, FW, FH * 0.3);
  gr = g.createLinearGradient(0, FH * 0.92, 0, FH); gr.addColorStop(0, 'rgba(110, 82, 54, 0)'); gr.addColorStop(1, 'rgba(110, 82, 54, 0.4)'); g.fillStyle = gr; g.fillRect(0, FH * 0.92, FW, FH * 0.08);
  for (const [x0, x1] of [[0, 40], [FW, FW - 40]]) { gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(96, 70, 46, 0.32)'); gr.addColorStop(1, 'rgba(96, 70, 46, 0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, 40, FH); }
  // a fissure wandering down from the top corner
  g.strokeStyle = 'rgba(70, 50, 32, 0.6)'; g.lineWidth = 2; g.beginPath(); let x = FW * 0.83, y = 0; g.moveTo(x, y); while (y < 330) { x += (rnd() - 0.55) * 14; y += 10 + rnd() * 14; g.lineTo(x, y); } g.stroke();
  return c;
}
function rowsOf(words, n) { const out = []; for (let i = 0; i < words.length; i += n) out.push(words.slice(i, i + n)); return out; }

function steleGeometry() {
  const g = new THREE.BoxGeometry(EW, EH, ED, 12, 28, 4); g.translate(0, EH / 2, 0);
  const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, hw = EW / 2, hd = ED / 2, r = 0.03;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i); const nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
    if (Math.abs(nx) > 0.5) U.setXY(i, z / TW + 0.5, y / TH); else if (Math.abs(ny) > 0.5) U.setXY(i, x / TW + 0.5, z / TH + 0.5); else if (nz < -0.5) U.setXY(i, -x / TW + 0.5, y / TH);
    const hy = y / EH, ax = hw * (1 - 0.06 * hy), az = hd * (1 - 0.12 * hy);
    x *= 1 - 0.06 * hy; z *= 1 - 0.12 * hy;
    // the vertical edges rounded by the wind
    const cx = THREE.MathUtils.clamp(x, -ax + r, ax - r), cz = THREE.MathUtils.clamp(z, -az + r, az - r), dx = x - cx, dz = z - cz, dl = Math.hypot(dx, dz);
    if (dl > 1e-6) { x = cx + (dx / dl) * r; z = cz + (dz / dl) * r; }
    // the top: a gentle arch, its front and back edges rounded by the wind
    const drop = 0.07 * (x / hw) ** 2; y -= drop * THREE.MathUtils.smoothstep(hy, 0.7, 1);
    const cy = Math.min(y, EH - drop - r), tz = THREE.MathUtils.clamp(z, -az + r, az - r), ey = y - cy, ez = z - tz, el = Math.hypot(ey, ez);
    if (ey > 1e-6 && el > 1e-6) { y = cy + (ey / el) * r; z = tz + (ez / el) * r; }
    // erosion: the sandstone eaten in toward its heart, most at the edges and corners, a chip or two
    // (an edge is where two faces meet: near it when the second nearest of the side, front-or-back and top planes is near too)
    const near = [ax - Math.abs(x), az - Math.abs(z), EH - y].sort((p, q) => p - q), edge = Math.max(0, 1 - near[1] / 0.08), d =(noise3(x * 9, y * 9, z * 9) * 0.02 + noise3(x * 23, y * 23, z * 23) * 0.007) * (0.25 + 0.75 * edge) + Math.max(0, noise3(x * 4 + 7, y * 4, z * 4) - 0.66) * 0.2 * edge;
    const l = Math.hypot(x, z) || 1; x -= (x / l) * d; z -= (z / l) * d; if (hy > 0.97) y -= d * 0.8;
    P.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

export class Stele {
  constructor({ words = [] } = {}) {
    this.group = new THREE.Group(); this.group.name = 'stele';
    this.slab = new THREE.Group(); this.group.add(this.slab);
    this.faceTex = canvasTexture(paintStele(words.map((w) => (Array.isArray(w) ? w.map((x) => String(x).toUpperCase()) : String(w).toUpperCase()))));
    this.faceMat = new THREE.MeshStandardMaterial({ name: 'stele-face', map: this.faceTex, roughness: 0.92 });
    const body = steleBody();
    this.mesh = new THREE.Mesh(steleGeometry(), [body, body, body, body, this.faceMat, body]); this.mesh.castShadow = this.mesh.receiveShadow = true; this.slab.add(this.mesh);
    // sand heaped at its foot (more on the windward side), more when it is buried
    this.heaps = [[0.05, 0.1, 1], [-0.32, -0.12, 0.6]].map(([x, z, k]) => { const m = mound(); m.position.set(x, 0, z); m.userData.k = k; this.group.add(m); return m; });
    this.sparkle = new Sparkle(0.15, seeded(words.join(' ') || 'stele')()); this.sparkle.mesh.position.set(0, EH - 0.07, ED / 2 * 0.88 + 0.02); this.slab.add(this.sparkle.mesh);
    this.normal = new THREE.Vector3(0, 0.25, 1).normalize();
    this.buried = -1; this.set({ buried: 0 });
  }

  /** How buried it is: 0 standing clear (a little sand at its foot) .. 1 sunk to its frieze in a dune of sand. */
  set({ buried = this.buried } = {}) {
    const b = THREE.MathUtils.clamp(buried, 0, 1); if (b === this.buried) return; this.buried = b;
    this.slab.position.y = -b * (EH - 0.36);
    for (const m of this.heaps) { const k = m.userData.k; m.scale.set((0.72 + 0.35 * b) * k, (0.18 + 0.06 * b) * k, (0.42 + 0.35 * b) * k); }
  }

  update(dt = 1 / 60) { sunOf(this.group); this.sparkle.update(dt, THREE.MathUtils.smoothstep(this.buried, 0.3, 0.9), this.normal); }

  dispose() { this.group.parent?.remove(this.group); this.mesh.geometry.dispose(); this.faceMat.dispose(); this.faceTex.dispose(); this.sparkle.dispose(); }
}
