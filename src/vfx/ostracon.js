// ---------------------------------------------------------------------------------------
// THE OSTRACA AND THE STELE: how the town that was's writing looks when it is dug up (the owner's direction, 2026-10-08; Espada's names
// and lore, LORE.md "Digging for words"; where they lie and what finding one does are Dovina's, progress/ostraca.js, and Petra builds the
// dig). The ware is Attic black-figure in the hand of the EYE CUP glaze (Calissa's decision): the town that was (Elpis, Espada's
// proposal) wrote on its pots, and its broken pots are the island's paper.
//
//   AN OSTRACON  a curved potsherd of red earthenware a hand across, broken from a painted pot: the pot's zones run across it and off
//                its broken edges (a tongue border, a frieze of figures on a groundline round the vessel with a palmette under each
//                handle, the black of its lower body), the word's PICTURE in the frieze (vfx/blackfigure.js), kept whole where the break
//                spares it; a word with no picture has the meander there instead. Below, the word's RUNE is a GRAFFITO, scratched into
//                the black after the firing: runes.js's own strokes (the glyph the Veritome draws), each a pale ragged scratch with a burr
//                where the point lifted. The black has flaked back to the red at the break, and its sheen is uneven, as brushed on
//   A STELE      an Attic grave stele in sandstone the Courier's height: a tapered shaft with its arrises rounded by the wind and a few
//                spalls, a cornice, and an ANTHEMION (a palmette finial) crowning it in silhouette; the frieze painted in the same hand
//                on the floor of a panel cut a finger deep under the crown; the town's runes cut in rows below, a faint guide line under
//                each row (the words it is given; with none, the face is bare until Espada's sentence lands); its foot in a bank of sand
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
// Themistocles's among them; graffiti on the feet of black-glazed cups, owners' marks cut after firing); Attic black-figure (Exekias;
// Kleitias's Francois Vase, zoned in friezes); the Attic grave stelae of the Kerameikos, crowned with anthemia; the Linear B tablets of
// Knossos and Pylos (a palace's lists in a script read long after); the Rosetta Stone (one text in two scripts: here a word beside its
// picture); La-Mulana's tablets, read with its glyph reader; Heaven's Vault's inscriptions (a language learned from what is found);
// Chants of Sennaar (a glossary deduced from pictures); Tunic (a script on one lattice, its manual found a page at a time).
//
//   const O = new Ostracon({ word, picture? })   O.group (rests on its origin)   O.set({ buried })   O.update(dt)   O.dispose()
//   O.arrive(t, from?)                           its arrival on the dig's clock: dug out of the sand, or fallen from `from` (world axes)
//   const S = new Stele({ words })               S.group (stands on its origin, its face to +z)   S.set({ buried })   S.update(dt)   S.dispose()
//   (words: the runes in rows, four to a row, or an array of rows; none, a bare face)
//   ostraconThing(word) -> { group, dispose }    the item in the Pneuka Box: a potsherd dug clean, its face to the eye (fossilThing's way)
//   sandstoneMaterial({ ashlar }) -> material    the stele's sandstone laid from the world: coursed ashlar (a wall), or plain (a monolith)
//   (picture: one of blackfigure.js's ids, 'drink' .. 'hush'; left out, the word's own from PICTURES; unknown, the meander)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { runeStrokes } from '../tools/veritome/mind/runes.js';
import { WARE, PICTURES, paintPicture, paintMeander, paintFrieze, paintTongues, paintPalmette, paintRosette } from './blackfigure.js';

// the potsherd (metres: across, up, thick, the pot's radius where it broke) and its face's canvas; the stele's shaft (across, high, deep),
// its cornice's height, its sandstone's tile (metres), its face's canvas and the frieze's panel on it (x, y, w, h)
const SW = 0.17, SH = 0.133, ST = 0.006, SR = 0.22;
const OW = 512, OH = 400;
const EW = 0.8, EH = 1.4, ED = 0.26, CH = 0.075, TW = 0.8, TH = 0.7;
const FW = 640, FH = 1120, FRIEZE = [46, 34, 548, 122];
const SAND = 0xd8b886;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();
const clamp = THREE.MathUtils.clamp;

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
function sheet(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---- the potsherd's face: a piece of a painted pot, its zones bent to the pot's curve and turned as it broke; the graffito; the wear
/** The rune as a graffito: each stroke a pale scratch in the black, ragged at its edges, tapering in where the point bit and leaving a burr where it lifted. */
function scratchRune(g, word, cx, cy, size, rnd) {
  const k = size / 8, w = size * 0.08;
  for (const [[x0, y0], [x1, y1]] of runeStrokes(word)) {
    const ax = cx + (x0 - 5) * k, ay = cy + (y0 - 5) * k, bx = cx + (x1 - 5) * k, by = cy + (y1 - 5) * k, len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, n = Math.max(6, Math.round(len / 2.5));
    const L = [], R = [];
    for (let i = 0; i <= n; i++) { const t = i / n, hw = w * 0.5 * Math.min(1, t * 7 + 0.15) * (0.7 + rnd() * 0.55), px = ax + (bx - ax) * t, py = ay + (by - ay) * t; L.push([px - uy * hw, py + ux * hw]); R.push([px + uy * hw, py - ux * hw]); }
    g.beginPath(); L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); for (let i = R.length - 1; i >= 0; i--) g.lineTo(...R[i]); g.closePath(); g.fillStyle = '#e4a174'; g.fill();
    g.beginPath(); g.moveTo(ax + ux * w, ay + uy * w); g.lineTo(bx - ux * w * 0.2, by - uy * w * 0.2); g.lineWidth = w * 0.26; g.lineCap = 'round'; g.strokeStyle = '#b5542f'; g.stroke();
    // the burr: the black pushed up and crumbled where the point lifted, and a crumb or two flung aside
    g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, r = w * (0.45 + rnd() * 0.45); g.lineTo(bx + ux * w * 0.35 + Math.cos(a) * r, by + uy * w * 0.35 + Math.sin(a) * r * 0.8); } g.closePath(); g.fillStyle = '#eab48c'; g.fill();
    for (let i = 0; i < 2; i++) { const s = rnd() > 0.5 ? 1 : -1, d = w * (0.9 + rnd() * 0.8); g.fillRect(bx + ux * w * (0.6 + rnd()) - uy * d * s, by + uy * w * (0.6 + rnd()) + ux * d * s, 1.3, 1.3); }
  }
}
function paintFace(word, picture, outline) {
  const rnd = seeded(`face:${word}`), ox = 64, oy = 60, PW = OW + 2 * ox, PH = OH + 2 * oy;
  // the pot, painted in its zones on a sheet wider than the face, so the break falls across them anywhere
  const P = sheet(PW, PH), p = P.getContext('2d');
  p.fillStyle = WARE.black; p.fillRect(0, 0, PW, PH);
  for (let y = 0; y < PH; y += 5) { p.fillStyle = `rgba(92, 54, 30, ${(0.02 + rnd() * 0.05).toFixed(3)})`; p.fillRect(0, y, PW, 2 + rnd() * 3); }
  const zt = oy + 44, zf = oy + 66, zg = oy + 236, sx = ox + 142, sw = 227;
  paintTongues(p, 0, zt, PW, zf - zt);
  p.fillStyle = WARE.clay; p.fillRect(0, zf, PW, zg - zf);
  if (paintPicture(p, picture, sx, zf, sw, zg - zf, [0, PW])) {
    // the frieze runs on round the pot past the word's picture: a palmette under each handle, rosettes in the empty ground
    const foot = zg - 5 * (sw / 72);
    paintPalmette(p, ox + 30, foot, 118); paintPalmette(p, ox + OW - 30, foot, 118);
    paintRosette(p, ox + 104, zf + 46, 8); paintRosette(p, ox + OW - 102, zf + 58, 8);
  } else paintMeander(p, 0, zf, PW, zg - zf);
  p.fillStyle = WARE.black; p.fillRect(0, zg, PW, PH - zg); p.fillStyle = WARE.clay; p.fillRect(0, zg + 9, PW, 2.5);
  // laid on the face bent to the curve of the pot's shoulder and turned as the potsherd broke from it
  const c = sheet(OW, OH), g = c.getContext('2d'), turn = (rnd() - 0.5) * 0.2, sag = 7 + rnd() * 7;
  g.fillStyle = WARE.black; g.fillRect(0, 0, OW, OH);
  g.save(); g.translate(OW / 2, OH / 2); g.rotate(turn);
  for (let x = 0; x < PW; x += 2) { const t = (x - PW / 2) / (PW / 2); g.drawImage(P, x, 0, 3, PH, x - PW / 2, -PH / 2 + sag * t * t, 3, PH); }
  g.restore();
  // the black's sheen uneven, thinner where the brush ran dry
  const gr = g.createRadialGradient(OW * (0.3 + rnd() * 0.4), OH * 0.8, 0, OW * 0.5, OH * 0.8, OW * 0.45); gr.addColorStop(0, 'rgba(118, 74, 44, 0.12)'); gr.addColorStop(1, 'rgba(118, 74, 44, 0)'); g.fillStyle = gr; g.fillRect(0, OH * 0.55, OW, OH * 0.45);
  scratchRune(g, word, OW / 2 - 6, 304, 92, rnd);
  // at the break the black has flaked back to the red in little scallops
  g.fillStyle = '#d27a4c';
  for (const [x, y] of outline) { if (rnd() > 0.32) continue; const X = (x / 2 + 0.5) * OW, Y = (0.5 - y / 2) * OH, r = 2 + rnd() * 5; g.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, rr = r * (0.6 + rnd() * 0.6); g.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
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
  g.userData.outline = outer;
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
  if (!F) { const geo = potsherdGeometry(word), tex = canvasTexture(paintFace(word, picture, geo.userData.outline)); F = { key, tex, mat: potsherdMaterial(tex), geo, n: 0 }; FACES.set(key, F); }
  F.n++; return F;
}
function letGo(F) { if (--F.n > 0) return; F.mat.dispose(); F.tex.dispose(); F.geo.dispose(); FACES.delete(F.key); }

// ---- the mound: a heap of sand that meets the ground without a line (a gaussian turned on a lathe), one shape and one sand for all
let MOUND = null;
function mound() {
  sandParts();
  const m = new THREE.Mesh(MOUND.geo, MOUND.mat); m.receiveShadow = true; return m;
}
function sandParts() {
  if (!MOUND) { const pts = []; for (let i = 0; i <= 14; i++) { const r = i / 14; pts.push(new THREE.Vector2(r, (Math.exp(-3 * r * r) - Math.exp(-3)) / (1 - Math.exp(-3)))); } pts.reverse(); MOUND = { geo: new THREE.LatheGeometry(pts, 28), mat: new THREE.MeshStandardMaterial({ name: 'ostracon-sand', color: SAND, roughness: 1 }) }; MOUND.mat.userData.shared = true; }
  return MOUND;
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
    const b = THREE.MathUtils.clamp(buried, 0, 1); if (b === this.buried && !this.fell) return; this.buried = b; this.fell = false;
    const tilt = 0.1 + 0.5 * b; this.body.rotation.set(-Math.PI / 2 + tilt, 0, 0); this.body.position.set(0, 0, 0); this.body.updateMatrix();
    let lo = Infinity; for (const p of this.F.geo.userData.rim) lo = Math.min(lo, _a.copy(p).applyMatrix4(this.body.matrix).y);
    this.body.position.y = -lo - 0.018 * b;
    this.mound.visible = b > 0.02; this.mound.scale.set(0.15 + 0.03 * b, 0.045 * b, 0.13 + 0.03 * b); this.mound.position.z = 0.012;
  }

  /** Its arrival as `t` runs 0 .. 1 (the dig's own clock): with no `from`, dug up out of the sand (buried 1 .. 0); with `from` (where it
   *  was set, from its resting place, in the world's axes: the wall it was plastered into, a pot's height), it falls from there, turning
   *  from upright, its face to the way it fell, to lying on its back. */
  arrive(t, from = null) {
    const k = clamp(t, 0, 1);
    if (!from) { this.set({ buried: 1 - k * k * (3 - 2 * k) }); return; }
    this.set({ buried: 0 }); if (k >= 1) return;
    const f = _b.copy(from).applyQuaternion(_q.copy(this.group.quaternion).invert()), u = 1 - k * k, rest = this.body.rotation.x, yaw = Math.atan2(-f.x, -f.z);
    this.body.position.addScaledVector(f, u); this.body.rotation.set(rest * (1 - u), yaw * u, 0.6 * u * u); this.fell = true;
  }

  update(dt = 1 / 60) { sunOf(this.group); this.sparkle.update(dt, THREE.MathUtils.smoothstep(this.buried, 0.3, 0.9), this.normal); }

  dispose() { this.group.parent?.remove(this.group); this.sparkle.dispose(); letGo(this.F); }
}

/** The Pneuka Box's item: a potsherd a hand across, dug clean, its painted face turned to the eye (pneuka/thingmodels.js buildThing). */
export function ostraconThing(word) {
  const O = new Ostracon({ word }); O.body.rotation.set(-0.28, 0.32, 0.04); O.body.position.set(0, 0, 0); O.group.remove(O.mound); // (no mound: the icon is framed on the potsherd alone)
  const group = new THREE.Group(); group.add(O.group); O.update(0);
  return { group, dispose: () => O.dispose() };
}

// ---- the stele: granular sandstone, the same on every side; its face the recessed frieze and the rows of runes
/** A soft cloud of tones over a tile, `cells` across, wrapping at its edges (the texel centres laid so the first column meets the last). */
function cloud(g, W, H, cells, rows, alpha, rnd, tones) {
  const s = sheet(cells + 1, rows + 1), q = s.getContext('2d'), v = Array.from({ length: cells * rows }, () => tones[Math.floor(rnd() * tones.length)]);
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cells; i++) { q.fillStyle = v[(j % rows) * cells + (i % cells)]; q.fillRect(i, j, 1, 1); }
  const sx = W / cells, sy = H / rows; g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(s, 0, 0, cells + 1, rows + 1, -sx / 2, -sy / 2, (cells + 1) * sx, (rows + 1) * sy); g.restore();
}
let TILE = null;
function sandstoneTile() {
  if (TILE) return TILE;
  const W = FW, H = FH / 2, c = sheet(W, H), g = c.getContext('2d'), rnd = seeded('sandstone'), tones = ['#d8bb8c', '#c4a172', '#a98458', '#8f6b45', '#b9925e', '#a4673c', '#e2c99e'];
  g.fillStyle = '#b48f62'; g.fillRect(0, 0, W, H);
  // value in clouds at five scales, the iron in it rusty here and leached pale there; the bedding only a faint smear along, never a line
  for (const [cells, rows, a] of [[3, 3, 0.4], [8, 7, 0.32], [20, 18, 0.24], [52, 46, 0.16], [130, 114, 0.12], [4, 40, 0.1]]) cloud(g, W, H, cells, rows, a, rnd, tones);
  // the grains: quartz bright, iron dark, a few pits with their lit lips
  for (let i = 0; i < 14000; i++) { const t = rnd(); g.fillStyle = t < 0.35 ? 'rgba(242, 224, 186, 0.42)' : t < 0.65 ? 'rgba(122, 90, 60, 0.35)' : t < 0.85 ? 'rgba(170, 128, 86, 0.4)' : 'rgba(208, 176, 130, 0.45)'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd(), 1 + rnd()); }
  for (let i = 0; i < 140; i++) { const x = rnd() * W, y = rnd() * H, r = 1.2 + rnd() * 3.2; g.fillStyle = 'rgba(232, 208, 164, 0.45)'; g.beginPath(); g.ellipse(x + 0.8, y + 1, r, r * 0.75, 0, 0, 6.2832); g.fill(); g.fillStyle = 'rgba(88, 64, 42, 0.5)'; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, 6.2832); g.fill(); }
  return (TILE = c);
}
let BODY = null;
function steleBody() { if (!BODY) { const t = canvasTexture(sandstoneTile(), true); BODY = { tex: t, mat: new THREE.MeshStandardMaterial({ name: 'stele-sandstone', map: t, roughness: 0.95 }) }; BODY.mat.userData.shared = true; } return BODY.mat; } // (shared: a parent that disposes what it holds, as the bowl does, leaves it)

// ---- the stele's sandstone laid as a wall: the town's isodomic ashlar (courses of one height, each block cut from the stone at its own
// place, its arrises worn, sand in the joints), or the plain stone for a monolith; laid from the world along the axis a face looks down
// (box mapping, as vfx/surfaces.js lays the workshop's), so any box of it takes the stone at one density with no UVs
const AW = 2.4, AH = 2.1, APX = 400; // (the ashlar's tile in metres, three courses of 0.7 m; texels a metre)
let ASHLAR = null;
function ashlarTile() {
  if (ASHLAR) return ASHLAR;
  const W = AW * APX, H = AH * APX, c = sheet(W, H), g = c.getContext('2d'), rnd = seeded('ashlar'), T = sandstoneTile();
  const half = sheet(TW * APX, TH * APX); half.getContext('2d').drawImage(T, 0, 0, half.width, half.height);
  const pat = g.createPattern(half, 'repeat'), CH2 = H / 3;
  for (let k = 0; k < 3; k++) {
    const y0 = k * CH2; let x = rnd() * W; const end = x + W;
    while (x < end - 1) {
      const len = Math.min(end - x, (1 + rnd() * 0.6) * APX), x0 = x; x += len;
      // (the block's own chances drawn once, so its two copies at a wrap agree)
      const ox = rnd() * half.width, oy = rnd() * half.height, tone = rnd(), ta = rnd(), chips = Array.from({ length: 4 }, () => [rnd(), 6 + rnd() * 14, Array.from({ length: 12 }, rnd)]);
      for (const sx of [x0 - W, x0]) { // (a block crossing the tile's edge is drawn on both sides of it, so the tile wraps)
        if (sx > W || sx + len < 0) continue;
        g.save(); g.beginPath(); g.rect(sx, y0, len, CH2); g.clip();
        pat.setTransform(new DOMMatrix().translate(x0 + ox, y0 + oy)); g.fillStyle = pat; g.fillRect(sx, y0, len, CH2);
        g.fillStyle = tone < 0.3 ? `rgba(236, 210, 166, ${0.1 + ta * 0.1})` : tone < 0.6 ? `rgba(120, 82, 50, ${0.08 + ta * 0.1})` : `rgba(170, 96, 52, ${0.06 + ta * 0.08})`; g.fillRect(sx, y0, len, CH2);
        // the face sand-blown paler toward its foot; its arrises worn: lit along the top and the left, shaded under and to the right
        let gr = g.createLinearGradient(0, y0, 0, y0 + CH2); gr.addColorStop(0, 'rgba(240, 220, 180, 0)'); gr.addColorStop(1, 'rgba(240, 220, 180, 0.12)'); g.fillStyle = gr; g.fillRect(sx, y0, len, CH2);
        g.fillStyle = 'rgba(240, 222, 184, 0.5)'; g.fillRect(sx, y0 + 2, len, 3); g.fillRect(sx + 2, y0, 2, CH2);
        g.fillStyle = 'rgba(78, 56, 36, 0.42)'; g.fillRect(sx, y0 + CH2 - 6, len, 4); g.fillRect(sx + len - 5, y0, 3, CH2);
        // a corner knocked off here and there
        [[sx, y0], [sx + len, y0], [sx, y0 + CH2], [sx + len, y0 + CH2]].forEach(([cx, cy], n) => { const [p, r, q] = chips[n]; if (p > 0.35) return; g.fillStyle = 'rgba(92, 66, 42, 0.55)'; g.beginPath(); g.moveTo(cx, cy); for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI * 2; g.lineTo(cx + Math.cos(a) * r * (0.6 + q[i] * 0.5), cy + Math.sin(a) * r * (0.6 + q[i + 6] * 0.5)); } g.fill(); });
        g.restore();
        // the joint: a dark hairline with sand lodged in it
        g.fillStyle = 'rgba(58, 40, 24, 0.85)'; g.fillRect(sx - 1.5, y0, 3, CH2);
      }
    }
    g.fillStyle = 'rgba(58, 40, 24, 0.85)'; g.fillRect(0, y0 - 1.5, W, 3);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(226, 200, 150, ${0.4 + rnd() * 0.4})`; g.fillRect(rnd() * W, y0 - 1.5 + rnd() * 3, 1 + rnd() * 2, 1.2); }
  }
  return (ASHLAR = c);
}
const STONE_VS = ['#include <common>', '#include <common>\nvarying vec3 vSandP;\nvarying vec3 vSandN;', '#include <begin_vertex>', '#include <begin_vertex>\nvSandP = (modelMatrix * vec4(transformed, 1.0)).xyz; vSandN = mat3(modelMatrix) * objectNormal;'];
const STONE_FS = `#include <common>
varying vec3 vSandP; varying vec3 vSandN; uniform sampler2D uSand; uniform vec2 uSandTile;
float sandHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float sandNoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sandHash(i), sandHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(sandHash(i + vec3(0.0, 1.0, 0.0)), sandHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(sandHash(i + vec3(0.0, 0.0, 1.0)), sandHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(sandHash(i + vec3(0.0, 1.0, 1.0)), sandHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`;
// (the face's own axis picks the plane; the gradients come from the world position, which runs on unbroken across an edge, so the mips do too)
const STONE_MAP = `{ vec3 an = abs(normalize(vSandN)), P = vSandP, PX = dFdx(P), PY = dFdy(P); vec2 suv, sgx, sgy;
  if (an.x >= an.y && an.x >= an.z) { suv = P.zy; sgx = PX.zy; sgy = PY.zy; } else if (an.y >= an.z) { suv = P.xz; sgx = PX.xz; sgy = PY.xz; } else { suv = P.xy; sgx = PX.xy; sgy = PY.xy; }
  vec3 sst = textureGrad(uSand, suv / uSandTile, sgx / uSandTile, sgy / uSandTile).rgb;
  diffuseColor.rgb *= sst * (0.9 + 0.2 * sandNoise(P * 0.45)); }`;
const STONES = {};
/** The stele's sandstone as a material for walls and slabs laid in the world: `ashlar` coursed blocks (the sealed room's walls), else the
 *  plain stone (a monolith: its door slab). Shared, one per kind, one program for both. */
export function sandstoneMaterial({ ashlar = false } = {}) {
  const key = ashlar ? 'ashlar' : 'plain'; if (STONES[key]) return STONES[key];
  const tex = ashlar ? canvasTexture(ashlarTile(), true) : (steleBody(), BODY.tex), tile = ashlar ? new THREE.Vector2(AW, AH) : new THREE.Vector2(TW, TH); // (the plain stone is the stele's own texture)
  const m = new THREE.MeshStandardMaterial({ name: `sandstone-${key}`, color: 0xffffff, roughness: 0.95 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSand = { value: tex }; sh.uniforms.uSandTile = { value: tile };
    sh.vertexShader = sh.vertexShader.replace(STONE_VS[0], STONE_VS[1]).replace(STONE_VS[2], STONE_VS[3]);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', STONE_FS).replace('#include <map_fragment>', `#include <map_fragment>\n${STONE_MAP}`);
  };
  m.customProgramCacheKey = () => 'sandstone-laid';
  m.userData.sandstone = tex; m.userData.shared = true;
  return (STONES[key] = m);
}

function cutRune(g, word, cx, cy, size, w, style) { const k = size / 8; g.beginPath(); for (const [[x0, y0], [x1, y1]] of runeStrokes(word)) { g.moveTo(cx + (x0 - 5) * k, cy + (y0 - 5) * k); g.lineTo(cx + (x1 - 5) * k, cy + (y1 - 5) * k); } g.lineWidth = w; g.strokeStyle = style; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
/** A rune cut in the sandstone: the groove's shaded wall, its floor, its lit wall (the light from above and to the left). */
function cutInSandstone(g, word, cx, cy, size, fade = 1) {
  const w = size * 0.11;
  cutRune(g, word, cx - w * 0.22, cy - w * 0.22, size, w * 1.15, `rgba(88, 62, 40, ${0.85 * fade})`);
  cutRune(g, word, cx, cy, size, w * 0.8, `rgba(128, 96, 64, ${0.9 * fade})`);
  cutRune(g, word, cx + w * 0.28, cy + w * 0.28, size, w * 0.32, `rgba(226, 202, 156, ${0.7 * fade})`);
}
function rowsOf(words, n) { const out = []; for (let i = 0; i < words.length; i += n) out.push(words.slice(i, i + n)); return out; }
function paintStele(words) {
  const c = sheet(FW, FH), g = c.getContext('2d'), rnd = seeded(`stele:${words.join(' ')}`), T = sandstoneTile(), [fx, fy, fw, fh] = FRIEZE;
  g.drawImage(T, 0, 0); g.drawImage(T, 0, FH / 2);
  // the frieze, on the floor of its panel, the paint flaked to the sandstone in patches; the panel's cut walls, shaded above and lit below
  paintFrieze(g, fx, fy, fw, fh);
  g.save(); g.beginPath(); for (let i = 0; i < 15; i++) { const x = fx + rnd() * fw, y = fy + rnd() * fh, r = 2.5 + rnd() * (i < 3 ? 11 : 5); g.moveTo(x + r, y); for (let a = 0.5; a < 6.3; a += 0.5) { const rr = r * (0.6 + rnd() * 0.5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.closePath(); }
  g.clip(); g.drawImage(T, 0, 0); g.restore();
  g.fillStyle = 'rgba(64, 44, 26, 0.5)'; g.fillRect(fx - 6, fy - 6, fw + 12, 6); g.fillRect(fx - 6, fy, 6, fh);
  g.fillStyle = 'rgba(236, 214, 172, 0.42)'; g.fillRect(fx - 6, fy + fh, fw + 12, 5); g.fillRect(fx + fw, fy, 5, fh);
  // the rows: each row's runes cut, a faint guide line the mason scored under them and nowhere else
  const list = Array.isArray(words[0]) ? words : rowsOf(words, 4), size = 70, pitch = 124, top = 250, gap = 52;
  list.forEach((row, r) => {
    const y = top + r * pitch; if (y > FH - 170 || !row.length) return;
    const wide = row.length * size + (row.length - 1) * gap, x0 = FW / 2 - wide / 2;
    g.fillStyle = 'rgba(96, 70, 46, 0.24)'; g.fillRect(x0 - 12, y + size / 2 + 15, wide + 24, 1.5);
    row.forEach((w, i) => cutInSandstone(g, w, x0 + size / 2 + i * (size + gap), y, size));
  });
  // age: sand-blown paler and smoother toward the ground, darker where the sand lies against it, its edges darker
  let gr = g.createLinearGradient(0, FH * 0.55, 0, FH * 0.8); gr.addColorStop(0, 'rgba(238, 216, 176, 0)'); gr.addColorStop(1, 'rgba(238, 216, 176, 0.26)'); g.fillStyle = gr; g.fillRect(0, FH * 0.55, FW, FH * 0.25);
  gr = g.createLinearGradient(0, FH * 0.8, 0, FH * 0.87); gr.addColorStop(0, 'rgba(238, 216, 176, 0.26)'); gr.addColorStop(0.35, 'rgba(110, 82, 54, 0)'); gr.addColorStop(1, 'rgba(100, 74, 48, 0.42)'); g.fillStyle = gr; g.fillRect(0, FH * 0.8, FW, FH * 0.2);
  for (const [x0, x1] of [[0, 40], [FW, FW - 40]]) { gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(96, 70, 46, 0.3)'); gr.addColorStop(1, 'rgba(96, 70, 46, 0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, 40, FH); }
  // a fissure wandering down from the top corner
  g.strokeStyle = 'rgba(70, 50, 32, 0.55)'; g.lineWidth = 2; g.beginPath(); let x = FW * 0.84, y = 0; g.moveTo(x, y); while (y < 300) { x += (rnd() - 0.55) * 14; y += 10 + rnd() * 14; g.lineTo(x, y); } g.stroke();
  return c;
}

/** Carves a box standing on y = 0: tapered, its arrises rounded by the wind (the top's too), its face recessed where asked, eaten in at its edges, spalled. */
function carve(g, { w, h, d, r, taper = [0, 0], amp = 1, spalls = [], recess = null, face = true }) {
  const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
  for (let i = 0; i < P.count; i++) {
    const x0 = P.getX(i), y0 = P.getY(i), z0 = P.getZ(i), nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
    if (Math.abs(nx) > 0.5) U.setXY(i, z0 / TW + 0.5, y0 / TH); else if (Math.abs(ny) > 0.5) U.setXY(i, x0 / TW + 0.5, z0 / TH + 0.5); else if (nz < -0.5) U.setXY(i, -x0 / TW + 0.5, y0 / TH); else if (!face) U.setXY(i, x0 / TW + 0.5, y0 / TH);
    const hy = y0 / h, ax = (w / 2) * (1 - taper[0] * hy), az = (d / 2) * (1 - taper[1] * hy);
    let x = x0 * (1 - taper[0] * hy), y = y0, z = z0 * (1 - taper[1] * hy);
    const cx = clamp(x, -ax + r, ax - r), cy = Math.min(y, h - r), cz = clamp(z, -az + r, az - r), ex = x - cx, ey = y - cy, ez = z - cz, el = Math.hypot(ex, ey, ez);
    if (el > 1e-6) { x = cx + (ex / el) * r; y = cy + (ey / el) * r; z = cz + (ez / el) * r; }
    if (recess && nz > 0.5) z -= recess(x0, y0);
    // (near an edge: where two faces meet, so the second nearest of the side, front-or-back and top planes is near too)
    const near = [ax - Math.abs(x), az - Math.abs(z), h - y].sort((p, q) => p - q), edge = Math.max(0, 1 - near[1] / 0.08);
    let e = ((noise3(x * 9, y * 9, z * 9) * 0.016 + noise3(x * 23, y * 23, z * 23) * 0.006) * (0.2 + 0.8 * edge) + Math.max(0, noise3(x * 4 + 7, y * 4, z * 4) - 0.68) * 0.12 * edge) * amp;
    for (const [sx, sy, sz, sr, sd] of spalls) { const q = Math.hypot(x - sx, y - sy, z - sz) / sr; if (q < 1) e += sd * (1 - q * q) ** 2; }
    const l = Math.hypot(x, z) || 1; x -= (x / l) * e; z -= (z / l) * e; if (hy > 0.97) y -= e * 0.6;
    P.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}
function steleGeometry() {
  // the frieze's panel cut a finger deep (its walls slope over one row of the mesh); spalls where the edges took knocks
  const recess = (x, y) => 0.014 * (1 - THREE.MathUtils.smoothstep(Math.abs(x), 0.334, 0.366)) * THREE.MathUtils.smoothstep(y, 1.196, 1.224) * (1 - THREE.MathUtils.smoothstep(y, 1.342, 1.37));
  const spalls = [[-0.38, 0.92, 0.12, 0.09, 0.035], [0.38, 1.02, 0.12, 0.07, 0.03], [0.39, 0.38, -0.12, 0.1, 0.04], [-0.39, 0.22, -0.12, 0.08, 0.03], [0.38, 0.6, 0.12, 0.06, 0.025], [-0.37, 1.38, 0.11, 0.05, 0.022]];
  return carve(new THREE.BoxGeometry(EW, EH, ED, 24, 48, 8).translate(0, EH / 2, 0), { w: EW, h: EH, d: ED, r: 0.045, taper: [0.05, 0.1], spalls, recess });
}
/** The crown: an anthemion, a palmette of nine lobes fanned over two volutes, cut out of the sandstone in silhouette. */
function anthemionGeometry() {
  const s = new THREE.Shape(), nL = 9, tmax = 1.22, R = (t) => (0.15 + 0.085 * Math.sqrt(Math.max(0, Math.sin(Math.PI * ((t * nL) % 1))))) * (0.86 + 0.14 * Math.cos((t - 0.5) * 2.4));
  s.moveTo(-0.2, 0); s.lineTo(0.2, 0);
  for (let i = 0; i <= 18; i++) { const a = -Math.PI / 2 + (i / 18) * Math.PI * 1.25; s.lineTo(0.22 + Math.cos(a) * 0.062, 0.075 + Math.sin(a) * 0.062); }
  for (let i = 0; i <= 90; i++) { const t = i / 90, th = tmax - 2 * tmax * t, r = R(t); s.lineTo(Math.sin(th) * r, 0.13 + Math.cos(th) * r); }
  for (let i = 0; i <= 18; i++) { const a = Math.PI / 4 + (i / 18) * Math.PI * 1.25; s.lineTo(-0.22 + Math.cos(a) * 0.062, 0.075 + Math.sin(a) * 0.062); }
  s.closePath();
  for (const x of [-0.22, 0.22]) { const hole = new THREE.Path(); hole.absarc(x, 0.075, 0.022, 0, Math.PI * 2, true); s.holes.push(hole); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.007, bevelSegments: 2, curveSegments: 8 });
  g.translate(0, 0, -0.04); g.computeBoundingBox(); return g;
}

let BANK = null;
function bankMaterial() { if (!BANK) { BANK = new THREE.MeshStandardMaterial({ name: 'stele-bank', color: 0xffffff, vertexColors: true, roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); BANK.userData.shared = true; } return BANK; } // (its thin edge fades out, so it lies on any floor: sand, or the cavern's stone)
/** Sand banked round a footprint (half sizes hx, hz): level against the stele, deeper on the windward front, falling away concave to nothing. */
function bankGeometry(hx, hz) {
  const g = new THREE.PlaneGeometry(1.8, 1.4, 60, 46).rotateX(-Math.PI / 2), P = g.attributes.position, col = [], sand = new THREE.Color(SAND);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), d = Math.hypot(Math.max(0, Math.abs(x) - hx), Math.max(0, Math.abs(z) - hz));
    const deep = (0.075 + 0.055 * THREE.MathUtils.smoothstep(z, -hz, hz)) * (0.8 + 0.4 * noise3(x * 6 + 3, 0.5, z * 6));
    P.setY(i, deep * Math.exp(-d / 0.2) * (1 - THREE.MathUtils.smoothstep(Math.max(Math.abs(x) / 0.9, Math.abs(z) / 0.7), 0.6, 1)));
    // (shaded in the hollow where it banks against the stele, so it reads as set in sand under any light)
    const k = 0.74 + 0.26 * THREE.MathUtils.smoothstep(d, 0, 0.14), a = THREE.MathUtils.smoothstep(P.getY(i), 0.002 + 0.006 * noise3(x * 9, 1.5, z * 9), 0.022);
    col.push(sand.r * k, sand.g * k, sand.b * k, a);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

export class Stele {
  constructor({ words = [] } = {}) {
    this.group = new THREE.Group(); this.group.name = 'stele';
    this.slab = new THREE.Group(); this.group.add(this.slab);
    this.faceTex = canvasTexture(paintStele(words.map((w) => (Array.isArray(w) ? w.map((x) => String(x).toUpperCase()) : String(w).toUpperCase()))));
    this.faceMat = new THREE.MeshStandardMaterial({ name: 'stele-face', map: this.faceTex, roughness: 0.93 });
    const body = steleBody();
    this.mesh = new THREE.Mesh(steleGeometry(), [body, body, body, body, this.faceMat, body]);
    this.cornice = new THREE.Mesh(carve(new THREE.BoxGeometry(0.84, CH, 0.3, 20, 3, 8).translate(0, CH / 2, 0), { w: 0.84, h: CH, d: 0.3, r: 0.022, amp: 0.6, face: false }), body); this.cornice.position.y = EH;
    this.crown = new THREE.Mesh(anthemionGeometry(), body); this.crown.position.y = EH + CH;
    for (const m of [this.mesh, this.cornice, this.crown]) { m.castShadow = m.receiveShadow = true; this.slab.add(m); }
    // its foot in a bank of sand; when it is buried, a dune heaped over it besides
    this.bank = new THREE.Mesh(bankGeometry(EW / 2 - 0.02, ED / 2 - 0.02), bankMaterial()); this.bank.receiveShadow = true; this.group.add(this.bank);
    this.heaps = [[0, 0, 1], [-0.28, -0.12, 0.55]].map(([x, z, k]) => { const m = mound(); m.position.set(x, 0, z); m.userData.k = k; this.group.add(m); return m; });
    this.sparkle = new Sparkle(0.15, seeded(words.join(' ') || 'stele')()); this.sparkle.mesh.position.set(0, EH - 0.06, ED / 2 * 0.9 + 0.006); this.slab.add(this.sparkle.mesh);
    this.normal = new THREE.Vector3(0, 0.25, 1).normalize();
    this.buried = -1; this.set({ buried: 0 });
  }

  /** How buried it is: 0 standing, its foot in a little bank of sand .. 1 sunk to the top of its frieze in a dune of sand, the crown above it. */
  set({ buried = this.buried } = {}) {
    const b = clamp(buried, 0, 1); if (b === this.buried) return; this.buried = b;
    this.slab.position.y = -0.08 - b * 0.94;
    for (const m of this.heaps) { const k = m.userData.k; m.visible = b > 0.02; m.scale.set((0.7 + 0.35 * b) * k, 0.26 * b * k, (0.55 + 0.3 * b) * k); }
  }

  update(dt = 1 / 60) { sunOf(this.group); this.sparkle.update(dt, THREE.MathUtils.smoothstep(this.buried, 0.3, 0.9), this.normal); }

  dispose() { this.group.parent?.remove(this.group); for (const m of [this.mesh, this.cornice, this.crown, this.bank]) m.geometry.dispose(); this.faceMat.dispose(); this.faceTex.dispose(); this.sparkle.dispose(); }
}
