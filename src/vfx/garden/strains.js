// ---------------------------------------------------------------------------------------
// THE FIVE STRAINS, DRAWN: a spore bed colonised by its strain (docs/plans/MYCELIUM.md sections 3 and 4; the owner, 2026-10-08: "I love the
// strain functions being grounded in reality"). Each strain is drawn as the real fungus whose behaviour its verb is, on what that fungus
// really grows on; the rules are Dovina's (progress/mycelium.js STRAINS, keyed by feeling), the beds' places Petra's, the names Espada's.
//
//   wonder  GRAFT     the LICHEN: two lives become a third. Crusts on boulders and bark, leafy rosettes of lobes, pixie cups (Cladonia)
//                     on the fallen branch; grey-green ripening to the feeling's colour
//   mirth   FERMENT   KOJI (Aspergillus oryzae) over steamed rice in two cedar trays (the koji-buta of a koji room): a soft fuzz,
//                     white where young, green-gold where it sporulates; the rice showing through
//   desire  PRINT     the INKCAP (Coprinus comatus, the shaggy mane): tall white shaggy bells on a mound of loam, the old ones
//                     dissolving into black ink from the rim up, drips hanging and a pool of ink at the foot (the ink was once ink)
//   grief   ROT       the OYSTER (Pleurotus ostreatus): pale overlapping shelves on a rotting log and a stump, the gills running
//                     down their short stems (the oyster eats oil spills: it cleans the crude)
//   dread   DISSOLVE  WITCHES' BUTTER (Tremella mesenterica): bright yellow-orange jelly folds on dead branches, wet and brainlike
//
//   FOXFIRE  at night every strain glows (bioluminescence) in its feeling's canon colour (progress/weather.js COLOR, its lightness lifted
//            to a glow's: dread's green would be too dark to see), the mushrooms brightest, the crusts and the substrate's colonies less,
//            the ink and the wood not at all. Low and steady: a slow breath, about nine real seconds a cycle (the real fungi's glow
//            rises and falls with a circadian clock, never a flicker), each patch on its own phase
//   THE FAIRY RING  round every bed: a sward of darker, lusher ground just outside a narrow straw-dead edge (the mycelium's two rings),
//            and on it the strain's own small growths (pixie cups, koji colonies, fairy inkcaps, oyster pins, jelly buttons), which at
//            night trace the ring in light
//   GROWTH   0 (inoculated: the substrate bare) to 1 (the colony full): every part is born at its own growth, scaled up from its foot
//            in the vertex shader (no rebuild): the white mycelium first, then the mushrooms from the middle out, the ring filling round
//
// One program for all five (a standard material with a vertex shader for the growth and a few lines of fragment for the foxfire, the
// gills' labradorite whisper and the koji's velvet), one draw a bed (its parts merged), no shadow cast (the growth would not reach a
// depth pass), the shapes chunky enough not to crawl at 480 lines (nothing thinner than a couple of centimetres stands proud).
//
// Prior art, as a museum label: the lichens of field guides (Parmelia's grey-green lobes, Xanthoria's rosettes, Cladonia's pixie cups,
// crustose Lecanora on rock); koji growing on rice in cedar trays in a koji muro (Japanese sake and miso brewing); Coprinus comatus's
// autodigestion; Pleurotus on hardwood and Paul Stamets's mycoremediation of oil; Tremella mesenterica on dead gorse and oak;
// bioluminescent fungi (Panellus stipticus, Armillaria's foxfire, Neonothopanus gardneri's circadian glow, Oliveira et al. 2015); the
// fairy ring's rings (Shantz and Piemeisel 1917: the grass killed and the grass stimulated); Hollow Knight's Fungal Wastes and Avatar's
// (2009) glowing forest floor for how a night of fungi reads in a game.
//
//   const B = strainBed(strain, { radius, growth, night, seed, curve })   B.group (stands on its origin, +Y up)   B.set({ growth, night })
//   B.update(rawDt)   B.dispose()   B.feeling   B.fungus   B.tris
//   (strain: a feeling, 'wonder' .. 'dread', or its fungus, 'lichen' .. 'butter'; radius: the bed's, metres (the ring stands a little
//    outside it); curve: the radius of the planetoid it stands on, so the ring follows the ground down; 0 for flat ground)
//   STRAIN_FUNGI[feeling] -> the fungus   foxfireColour(feeling) -> THREE.Color   STRAIN_LOOK (the numbers)   strainsParked() (warm-up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';

export const STRAIN_FUNGI = { wonder: 'lichen', mirth: 'koji', desire: 'inkcap', grief: 'oyster', dread: 'butter' };
const FEELING_OF = { lichen: 'wonder', koji: 'mirth', inkcap: 'desire', oyster: 'grief', butter: 'dread', witchesButter: 'dread' };
/** The numbers: the bed's radius (m), the ring's distance outside it, the foxfire's strength and its lightness (least, most), the breath (rad/s). */
export const STRAIN_LOOK = { radius: 1.2, ring: 0.22, glow: 0.55, light: [0.5, 0.62], breath: 0.7 };
const BREATH_WRAP = ((Math.PI * 2) / STRAIN_LOOK.breath) * 400; // (the clock's wrap: 400 whole breaths, about a real hour)

/** A feeling's foxfire: its canon colour, its lightness lifted into a glow's (linear, as a material wants). */
export function foxfireColour(feeling) {
  const c = new THREE.Color(COLOR[feeling] ?? COLOR.wonder), hsl = c.getHSL({});
  return c.setHSL(hsl.h, Math.max(0.55, hsl.s), THREE.MathUtils.clamp(hsl.l, ...STRAIN_LOOK.light)).multiplyScalar(STRAIN_LOOK.glow);
}

// ---- the one material (each bed its own, one program between them: rule 28)
const KEY = 'garden-strains-1';
const VERT_DECL = /* glsl */`
attribute vec4 aFx;
attribute vec3 aRoot;
uniform float uGrowth;
varying vec4 vFx;
varying float vPh;
varying vec3 vWp;
`;
const VERT_GROW = /* glsl */`
  {
    float gk = smoothstep(aFx.x, aFx.x + 0.14, uGrowth); // (born at its growth, scaled up from its foot)
    transformed = aRoot + (transformed - aRoot) * gk;
    vFx = aFx;
    vPh = fract(sin(dot(floor(aRoot.xz * 4.0), vec2(12.9898, 78.233))) * 43758.5453); // (the breath's phase by quarter-metre patch: a mound whose roots differ at every vertex must not boil)
  }
`;
const FRAG_DECL = /* glsl */`
uniform float uNight;
uniform float uT;
uniform vec3 uFox;
varying vec4 vFx;
varying float vPh;
varying vec3 vWp;
${LAB_GLSL}
`;
const FRAG_LIGHT = /* glsl */`
  {
    float ndv = abs(dot(normal, normalize(vViewPosition)));
    float rim = 1.0 - ndv;
    if (vFx.w > 0.0) { // (the gills' labradorite whisper: ink with its schiller at the turn)
      float ph = labPhase(vWp, normalize(cameraPosition - vWp));
      diffuseColor.rgb = mix(diffuseColor.rgb, labInk(ph, 0.3 + 0.7 * rim), vFx.w * (0.3 + 0.7 * rim));
    } else if (vFx.w < 0.0) { // (a velvet: the koji's fuzz catching the light at the turn)
      diffuseColor.rgb = mix(diffuseColor.rgb, min(diffuseColor.rgb * 1.3 + 0.08, vec3(1.0)), -vFx.w * pow(rim, 1.4));
    }
    float breath = 0.8 + 0.2 * sin(uT * ${STRAIN_LOOK.breath.toFixed(2)} + vPh * 6.2832); // (a slow breath, never a flicker)
    totalEmissiveRadiance += uFox * vFx.y * uNight * breath;
  }
`;
function strainMaterial(feeling) {
  const m = new THREE.MeshStandardMaterial({ name: 'garden-strains', vertexColors: true, roughness: 0.85, metalness: 0 });
  const U = { uGrowth: { value: 1 }, uNight: { value: 0 }, uT: { value: 0 }, uFox: { value: foxfireColour(feeling) }, uMindT: mindTime };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_GROW}`)
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = vFx.z;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_LIGHT}`);
  };
  m.customProgramCacheKey = () => KEY;
  m.userData.u = U;
  return m;
}

// ---- chance and noise (seeded: a bed of a seed is the same bed every time)
function rng(seed) { let a = (seed * 2654435761) >>> 0 || 7; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function h3(i, j, k) { const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); }
function noise3(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = x - X, v = y - Y, w = z - Z, s = (t) => t * t * (3 - 2 * t), su = s(u), sv = s(v), sw = s(w), l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h3(X, Y, Z), h3(X + 1, Y, Z), su), l(h3(X, Y + 1, Z), h3(X + 1, Y + 1, Z), su), sv), l(l(h3(X, Y, Z + 1), h3(X + 1, Y, Z + 1), su), l(h3(X, Y + 1, Z + 1), h3(X + 1, Y + 1, Z + 1), su), sv), sw);
}
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(k, 0, 1)).getHex();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _v = new THREE.Vector3(), _l = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color(), _nm = new THREE.Matrix3();
/** A placement: where, turned (Euler, radians), scaled. */
function at(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { return new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V(sx, sy, sz)); }
/** A placement standing a thing's +Y on a normal at a point. */
function onNormal(p, n, yaw = 0, s = 1) { const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n.clone().normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw)); return new THREE.Matrix4().compose(p, q, V(s, s, s)); }

// ---- a bed's parts, merged into one geometry: each vertex with its colour, its birth, glow, roughness, sheen and foot
class BedParts {
  constructor() { this.P = []; this.N = []; this.C = []; this.F = []; this.R = []; this.I = []; this.keep = []; this.groundAt = () => 0; } // (keep: where the strain stands, [x, z, r]; groundAt: its ground's height)
  /** Add a geometry under a placement. o: { color: hex | (local, world, normal) => hex | [hex, glow?, sheen?], birth: n | (world) => n,
   *  glow, rough, sheen, root: Vector3 | (world) => Vector3 (the foot it grows from; the placement's origin if not said) }. */
  add(geo, m, o = {}) {
    const pos = geo.attributes.position, nor = geo.attributes.normal, base = this.P.length / 3;
    _nm.getNormalMatrix(m); const flip = m.determinant() < 0, rootFn = typeof o.root === 'function' ? o.root : null, root0 = rootFn ? null : o.root ?? V(0, 0, 0).applyMatrix4(m);
    for (let i = 0; i < pos.count; i++) {
      _l.fromBufferAttribute(pos, i); _v.copy(_l).applyMatrix4(m); _n.fromBufferAttribute(nor, i).applyMatrix3(_nm).normalize();
      let col = o.color ?? 0xffffff, glow = o.glow ?? 0, sheen = o.sheen ?? 0;
      if (typeof col === 'function') { const r = col(_l, _v, _n); if (Array.isArray(r)) { col = r[0]; if (r[1] != null) glow = r[1]; if (r[2] != null) sheen = r[2]; } else col = r; }
      _c.set(col);
      const birth = typeof o.birth === 'function' ? o.birth(_v) : o.birth ?? -1, root = rootFn ? rootFn(_v) : root0;
      this.P.push(_v.x, _v.y, _v.z); this.N.push(_n.x, _n.y, _n.z); this.C.push(_c.r, _c.g, _c.b);
      this.F.push(birth, glow, o.rough ?? 0.85, sheen); this.R.push(root.x, root.y, root.z);
    }
    const tri = (a, b, c) => (flip ? this.I.push(base + a, base + c, base + b) : this.I.push(base + a, base + b, base + c));
    if (geo.index) for (let i = 0; i < geo.index.count; i += 3) tri(geo.index.getX(i), geo.index.getX(i + 1), geo.index.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
    geo.dispose();
  }
  /** The merged geometry, let down where the ground curves away (a planetoid of radius `curve`: rule 64). */
  done(curve = 0) {
    if (curve > 0) { const k = 1 / (2 * curve); for (const A of [this.P, this.R]) for (let i = 0; i < A.length; i += 3) A[i + 1] -= (A[i] * A[i] + A[i + 2] * A[i + 2]) * k; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.F, 4));
    g.setAttribute('aRoot', new THREE.Float32BufferAttribute(this.R, 3)); g.setIndex(this.I); g.computeBoundingSphere();
    return g;
  }
}

/** A grid sheet: fn(u, v) -> Vector3 for u, v in 0..1; wound so its mean normal faces `face`. */
function sheet(nu, nv, fn, face = V(0, 1, 0)) {
  const P = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); P.push(p.x, p.y, p.z); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  const n = g.attributes.normal; let s = 0; for (let i = 0; i < n.count; i++) s += n.getX(i) * face.x + n.getY(i) * face.y + n.getZ(i) * face.z;
  if (s < 0) { for (let i = 0; i < I.length; i += 3) [I[i + 1], I[i + 2]] = [I[i + 2], I[i + 1]]; g.setIndex(I); g.computeVertexNormals(); }
  return g;
}
/** A lathe from (r, y) pairs. */
const lathe = (pts, seg = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)), seg);
/** A lumpy boulder: a sphere pushed out by noise, squat, sunk; returns its geometry and its surface (a point and normal for a direction). */
function boulderShape(R, seed, squat = 0.62, bottom = -Infinity) {
  const rad = (d) => R * (0.86 + 0.32 * noise3(d.x * 1.7 + seed, d.y * 1.7, d.z * 1.7 - seed));
  const g = new THREE.SphereGeometry(1, 18, 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i).normalize(); const r = rad(_v); p.setXYZ(i, _v.x * r, Math.max(bottom, _v.y * r * squat), _v.z * r); } // (cut flat just under the ground: nothing deep below it)
  g.computeVertexNormals();
  return { geo: g, surf: (d) => { d = d.clone().normalize(); const r = rad(d); return { p: V(d.x * r, d.y * r * squat, d.z * r), n: V(d.x, d.y / squat, d.z).normalize() }; } };
}

// ---- the parts every bed shares: the white mycelium creeping, and the fairy ring
/** A few patches of white mycelium on the bed's ground (K.groundAt), clear of what the strain stands there (K.keep: [x, z, r]). */
function mycelialMats(K, R, rnd) {
  for (let i = 0; i < 3; i++) {
    let cx = 0, cz = 0, r = 0.06 + rnd() * 0.06;
    for (let n = 0; n < 12; n++) { const a = rnd() * Math.PI * 2, d = R * (0.25 + rnd() * 0.65); cx = Math.cos(a) * d; cz = Math.sin(a) * d; if (!K.keep.some(([x, z, kr]) => Math.hypot(cx - x, cz - z) < kr + r)) break; r *= 0.85; }
    const sd = rnd() * 50, g = new THREE.RingGeometry(0.001, 1, 20, 3).rotateX(-Math.PI / 2), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = p.getZ(k), q = Math.atan2(z, x), e = 0.55 + 0.45 * noise3(Math.cos(q) * 2 + sd, Math.sin(q) * 2, sd), X = x * r * e, Z = z * r * e; p.setXYZ(k, X, K.groundAt(cx + X, cz + Z) + 0.016 + 0.004 * noise3(x * 9, sd, z * 9), Z); }
    g.computeVertexNormals();
    K.add(g, at(cx, 0, cz), { color: (l) => mix(0x9c9484, 0xbab2a0, noise3(l.x * 30, sd, l.z * 30)), glow: 0.16, birth: i * 0.03, root: V(cx, K.groundAt(cx, cz) + 0.016, cz), rough: 0.95 });
  }
}
function fairyRing(K, Rr, feeling, rnd) {
  // the sward: dead straw on its inside edge, the lush dark ground outside it; its edges wander and sink under the ground (rule 86)
  const sd = rnd() * 40, W = 0.46, r0 = Rr - 0.2;
  const wob = (q) => [0.07 * noise3(Math.cos(q) * 3 + sd, Math.sin(q) * 3, 1), 0.1 * noise3(Math.cos(q) * 3 - sd, Math.sin(q) * 3, 2)];
  const lift = (t) => (t <= 0 || t >= 1 ? -0.02 : -0.016 + 0.04 * Math.sin(Math.PI * t) ** 0.5), tuft = (x, z) => noise3(x * 11, sd, z * 11);
  /** The sward's height at a point (what a growth on it stands in). */
  const swardY = (x, z) => { const q = Math.atan2(z, x), [w0, w1] = wob(q); return lift((Math.hypot(x, z) - r0 - w0) / (W - w0 - w1)) + 0.01 * tuft(x, z); };
  const sward = new THREE.RingGeometry(r0, r0 + W, 96, 4).rotateX(-Math.PI / 2), p = sward.attributes.position, col = [];
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), z = p.getZ(k), q = Math.atan2(z, x), t = (Math.hypot(x, z) - r0) / W, [w0, w1] = wob(q), rr = r0 + w0 + t * (W - w0 - w1), X = Math.cos(q) * rr, Z = Math.sin(q) * rr, tf = tuft(X, Z);
    p.setXYZ(k, X, lift(t) + 0.01 * tf, Z);
    col.push(mix(mix(0x536a52, 0x72896a, tf), mix(0x8e7e56, 0xa8986a, tf), 1 - THREE.MathUtils.smoothstep(t, 0.14, 0.26))); // (a darker, lusher moss and straw, not black: on the garden's pale ground a black ring reads as a hoop)
  }
  sward.computeVertexNormals();
  let ci = 0; // (the sward rises out of the ground as the ring grows, each vertex from under itself)
  K.add(sward, at(0, 0, 0), { color: () => col[ci++], birth: 0.12, rough: 0.95, root: (w) => V(w.x, -0.04, w.z) });
  // the strain's own small growths round it, standing in the sward, filling the ring round as it grows
  const N = Math.round((Math.PI * 2 * Rr) / 0.125);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.05, r = Rr + (rnd() - 0.5) * 0.1, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 1 + rnd() * 0.7;
    ringGrowth(K, feeling, x, swardY(x, z) - 0.008, z, s, 0.3 + 0.55 * ((i / N + rnd() * 0.08) % 1), rnd);
  }
}
function ringGrowth(K, feeling, x, y, z, s, birth, rnd) {
  const yaw = rnd() * 6.28, foot = V(x, y, z), F = feeling;
  if (F === 'wonder') K.add(lathe([[0.008, 0], [0.008, 0.035], [0.026, 0.064], [0.02, 0.066], [0, 0.054]], 6), at(x, y, z, (rnd() - 0.5) * 0.3, yaw, 0, s * 1.2), { color: (l) => mix(0x9aa888, LICHEN_TIP, l.y / 0.06), glow: 0.7, birth, root: foot });
  else if (F === 'mirth') K.add(new THREE.SphereGeometry(0.045, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), at(x, y, z, 0, yaw, 0, s, s * 0.75, s), { color: (l) => mix(0xb0b04e, 0xf0ecd8, Math.hypot(l.x, l.z) / 0.045), glow: 0.7, sheen: -0.8, birth, root: foot });
  else if (F === 'desire') { K.add(new THREE.CylinderGeometry(0.007, 0.009, 0.07, 4, 1, true), at(x, y + 0.035 * s, z, 0, 0, 0, s), { color: 0xf0ebe0, glow: 0.4, birth, root: foot }); K.add(lathe([[0.03, 0], [0.026, 0.018], [0.016, 0.03], [0, 0.034]], 6), at(x, y + 0.062 * s, z, (rnd() - 0.5) * 0.3, yaw, 0, s), { color: (l) => mix(0x6a6470, 0xe6e0d6, l.y / 0.02), glow: 0.7, birth, root: foot }); }
  else if (F === 'grief') K.add(lathe([[0.01, 0], [0.012, 0.028], [0.03, 0.038], [0.022, 0.048], [0, 0.05]], 6), at(x, y, z, 0.25, yaw, 0, s), { color: (l) => mix(0x4a4640, 0x7e776a, l.y / 0.05), glow: 0.7, birth, root: foot });
  else K.add(jellyBlob(0.038 * s, rnd() * 30, 7, 4), at(x, y + 0.016, z, 0, yaw, 0), { color: (l, w, n) => butterColour(n, l), glow: 0.8, rough: 0.22, birth, root: foot });
}

// ---- wonder: the lichen
const LICHEN_GREY = 0x5e6c4e, LICHEN_TIP = COLOR.wonder;
const lichenCol = (k) => mix(LICHEN_GREY, LICHEN_TIP, k);
function lichen(K, R, rnd) {
  const boulders = [[-0.28, -0.12, 0.42], [0.42, 0.18, 0.28], [0.06, -0.62 * R / 1.2, 0.18]];
  for (const [x, z, r] of boulders) {
    K.keep.push([x, z, r * 1.1]);
    const sd = rnd() * 50, sink = r * 0.18, S = boulderShape(r, sd, 0.62, sink - 0.03);
    K.add(S.geo, at(x, -sink, z, 0, rnd() * 6, 0), { color: (l, w, n) => {
      const patch = noise3(l.x * 6 + sd, l.y * 6, l.z * 6), k = noise3(l.x * 3 - sd, l.y * 3, l.z * 3), up = THREE.MathUtils.clamp(n.y + 0.4, 0, 1);
      if (patch > 0.7 - 0.12 * up) return [k > 0.6 ? mix(0x8a9466, LICHEN_TIP, (k - 0.6) * 2.5) : mix(0x6e7c58, 0x86926c, k), 0.3];
      return mix(0x2c2b2c, 0x45423f, noise3(l.x * 14, l.y * 14 + sd, l.z * 14));
    }, rough: 0.92 });
    // leafy rosettes on its upper face, each a ring of lobes curling up at their tips
    for (let i = 0; i < 4 + Math.floor(r * 10); i++) {
      const d = V(rnd() - 0.5, 0.45 + rnd() * 0.6, rnd() - 0.5), s = S.surf(d), p = s.p.add(V(x, -sink, z)), birth = 0.08 + rnd() * 0.5, k = 0.3 + rnd() * 0.7;
      rosette(K, onNormal(p, s.n, rnd() * 6), 0.05 + rnd() * 0.045, k, birth, rnd, p);
    }
    for (let i = 0; i < 3; i++) { const d = V(rnd() - 0.5, 0.8, rnd() - 0.5), s = S.surf(d), p = s.p.add(V(x, -sink, z)); pixieCup(K, p, 0.9 + rnd() * 0.5, 0.2 + rnd() * 0.5, rnd); }
  }
  // the fallen branch, crusted and cupped
  const len = 1.15 * R / 1.2, br = new THREE.CylinderGeometry(0.07, 0.085, len, 12, 8, false).rotateZ(Math.PI / 2), bp = br.attributes.position, sd = rnd() * 9;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), q = Math.atan2(z, y), e = 1 + 0.08 * noise3(x * 3 + sd, Math.cos(q) * 2, Math.sin(q) * 2) + 0.05 * Math.abs(Math.sin(q * 7 + x * 2)); bp.setXYZ(i, x, y * e, z * e); }
  br.computeVertexNormals();
  const bx = 0.12, bz = 0.46 * R / 1.2, byaw = 0.35;
  for (const t of [-0.4, 0, 0.4]) K.keep.push([bx + Math.cos(byaw) * t * len, bz - Math.sin(byaw) * t * len, 0.16]);
  K.add(br, at(bx, 0.06, bz, 0, byaw, 0.04), { color: (l) => { const n = noise3(l.x * 5 + sd, l.y * 9, l.z * 9); if (l.y > -0.01 && n > 0.58) return [mix(0x6e7c58, 0x8a9466, noise3(l.x * 2, sd, l.z)), 0.3]; return mix(0x3e3228, 0x6a5848, noise3(l.x * 2, l.y * 30, l.z * 30)); }, rough: 0.95 });
  for (let i = 0; i < 7; i++) { const t = (rnd() - 0.5) * len * 0.85, ang = (rnd() - 0.5) * 1.2, p = V(t, Math.cos(ang) * 0.08, Math.sin(ang) * 0.08).applyAxisAngle(V(0, 1, 0), byaw).add(V(bx, 0.06, bz)); pixieCup(K, p, 0.8 + rnd() * 0.6, 0.15 + rnd() * 0.6, rnd); }
}
function rosette(K, m, size, k, birth, rnd, foot) {
  const n = 6 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4, L = size * (0.75 + rnd() * 0.45), W = L * 0.7;
    const lobe = sheet(3, 3, (u, v) => { const w = (v - 0.5) * W * Math.sin(Math.PI * Math.min(1, u * 1.1)) ** 0.5 * (1 + 0.22 * Math.sin((v - 0.5) * 14) * u * u); return V(u * L, 0.002 + 0.35 * L * u * u * u + 0.18 * L * (v - 0.5) ** 2, w).applyAxisAngle(V(0, 1, 0), a); });
    K.add(lobe, m, { color: (l) => [mix(lichenCol(k * 0.35), lichenCol(k), Math.hypot(l.x, l.z) / L), 0.8], birth: birth + i * 0.01, root: foot, rough: 0.8 });
  }
}
function pixieCup(K, p, s, birth, rnd) {
  K.add(lathe([[0.007, 0], [0.006, 0.03], [0.012, 0.046], [0.024, 0.06], [0.026, 0.066], [0.019, 0.066], [0, 0.054]], 7), at(p.x, p.y - 0.004, p.z, (rnd() - 0.5) * 0.3, rnd() * 6, (rnd() - 0.5) * 0.3, s * 1.3), { color: (l) => [mix(0x9aa888, LICHEN_TIP, (l.y - 0.04) / 0.027), l.y > 0.05 ? 1 : 0.5], birth, root: p.clone() });
}

// ---- mirth: koji on rice in cedar trays
function koji(K, R, rnd) {
  const sc = R / 1.2;
  for (const [x, z, yaw, w, d] of [[-0.2 * sc, -0.12 * sc, 0.22, 0.98 * sc, 0.62 * sc], [0.42 * sc, 0.5 * sc, -0.42, 0.7 * sc, 0.44 * sc]]) {
    const T = at(x, 0, z, 0, yaw, 0), wall = 0.022, hgt = 0.1, sd = rnd() * 30;
    K.keep.push([x, z, Math.hypot(w, d) / 2 + 0.04]);
    const cedar = (l) => mix(0xb88a5c, 0xd4ac7e, noise3(l.x * 2 + sd, l.y * 40, l.z * 40) * 0.8 + 0.2 * noise3(l.x * 30, sd, 0));
    const box = (bw, bh, bd, bx, by, bz) => K.add(new THREE.BoxGeometry(bw, bh, bd, Math.ceil(bw * 6), 1, Math.ceil(bd * 6)), new THREE.Matrix4().multiplyMatrices(T, at(bx, by, bz)), { color: cedar, rough: 0.8 });
    box(w, 0.018, d, 0, 0.009, 0); box(w, hgt, wall, 0, hgt / 2, d / 2 - wall / 2); box(w, hgt, wall, 0, hgt / 2, -d / 2 + wall / 2); box(wall, hgt, d - 2 * wall, w / 2 - wall / 2, hgt / 2, 0); box(wall, hgt, d - 2 * wall, -w / 2 + wall / 2, hgt / 2, 0);
    // the rice heaped in it, the fuzz over it: white where young, green-gold where it sporulates
    const iw = w - 2 * wall - 0.004, id = d - 2 * wall - 0.004;
    const height = (u, v) => 0.04 + 0.045 * Math.sin(Math.PI * u) ** 0.7 * Math.sin(Math.PI * v) ** 0.7 + 0.01 * noise3(u * 9 + sd, v * 9, 0);
    const mound = (lift, n) => sheet(Math.ceil(iw * n), Math.ceil(id * n), (u, v) => V((u - 0.5) * iw, height(u, v) + lift, (v - 0.5) * id));
    const spore = (l) => noise3(l.x * 7 + sd, l.z * 7, 3) * 0.7 + 0.3 * noise3(l.x * 20, l.z * 20, sd);
    K.add(mound(0, 30), T, { color: (l) => mix(0xe8e0cc, 0xf6f2e6, noise3(l.x * 90, sd, l.z * 90)), rough: 0.6 }); // (the steamed rice, there from the start)
    // the koji over it, rising out of the rice in patches as it grows: white where young, green-gold where it sporulates
    K.add(mound(0.008, 24), T, { color: (l) => { const s = spore(l); return [s > 0.55 ? mix(0xe6e2b0, 0xb4b24c, (s - 0.55) * 4) : mix(0xeeeadc, 0xf8f6ee, s * 2), 0.75, -0.9]; },
      birth: (w) => 0.02 + 0.5 * noise3(w.x * 5 + sd, w.z * 5, 7), root: (w) => w.clone().add(V(0, -0.016, 0)), rough: 0.98 });
    // rice at the surface, and cottony puffs where the koji has run thickest
    for (let i = 0; i < 80 * sc; i++) {
      const u = 0.06 + rnd() * 0.88, v = 0.06 + rnd() * 0.88, lx = (u - 0.5) * iw, lz = (v - 0.5) * id, p = V(lx, height(u, v) + 0.006, lz).applyMatrix4(T);
      K.add(new THREE.OctahedronGeometry(1, 0), at(p.x, p.y, p.z, rnd() * 3, rnd() * 6, rnd() * 3, 0.006, 0.005, 0.012), { color: mix(0xefe9d6, 0xfaf7ee, rnd()), glow: 0.4, rough: 0.6 });
    }
    for (let i = 0; i < 26 * sc; i++) {
      const u = 0.1 + rnd() * 0.8, v = 0.1 + rnd() * 0.8, lx = (u - 0.5) * iw, lz = (v - 0.5) * id, p = V(lx, height(u, v), lz).applyMatrix4(T), r = 0.02 + rnd() * 0.025, s = spore(V(lx, 0, lz));
      K.add(new THREE.SphereGeometry(r, 7, 4), at(p.x, p.y, p.z, 0, rnd() * 6, 0, 1, 0.6, 1), { color: s > 0.5 ? 0xc8c66a : 0xf4f2e6, glow: 0.9, sheen: -1, birth: 0.15 + rnd() * 0.6, root: p, rough: 1 });
    }
  }
}

// ---- desire: the shaggy inkcap
function inkcap(K, R, rnd) {
  const sc = R / 1.2, sd = rnd() * 20, R0 = 0.78 * sc, edge = (q) => 0.8 + 0.25 * noise3(Math.cos(q) * 2 + sd, Math.sin(q) * 2, 0);
  /** The loam's height at a point: a low mound, its edge wandering and sinking under the ground (rule 86). */
  const soilAt = (x, z) => { const e = edge(Math.atan2(z, x)), px = x / e, pz = z / e, r = Math.hypot(px, pz) / R0; return 0.05 * (1 - r * r) - 0.012 + 0.012 * noise3(px * 8, sd, pz * 8); };
  const soil = new THREE.RingGeometry(0.001, R0, 36, 5).rotateX(-Math.PI / 2), sp = soil.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i), e = edge(Math.atan2(z, x)); sp.setXYZ(i, x * e, soilAt(x * e, z * e), z * e); }
  soil.computeVertexNormals();
  K.add(soil, at(0, 0, 0), { color: (l) => mix(0x2c2018, 0x4a3628, noise3(l.x * 12, sd, l.z * 12)), rough: 1 });
  K.groundAt = (x, z) => Math.max(0, soilAt(x, z));
  const soilY = (x, z) => soilAt(x, z) - 0.006;
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a = i * 2.4 + rnd() * 0.6, d = (0.1 + 0.48 * Math.sqrt((i + 0.5) / N)) * sc, x = Math.cos(a) * d, z = Math.sin(a) * d, y0 = soilY(x, z);
    const stage = i % 3 === 0 ? 'young' : i % 3 === 1 ? 'bell' : 'old', s = 0.85 + rnd() * 0.4, birth = 0.05 + 0.6 * (d / (0.6 * sc)) + rnd() * 0.08;
    oneInkcap(K, V(x, y0, z), stage, s, birth, rnd);
  }
}
/** The shaggy scales' rows, staggered by turns round the cap (0 or 1). */
const scaleRow = (q) => ((Math.floor((q / Math.PI) * 7) % 2) + 2) % 2;
function oneInkcap(K, foot, stage, s, birth, rnd) {
  const Hc = (stage === 'young' ? 0.2 : 0.17) * s, rc = (stage === 'young' ? 0.05 : 0.06) * s, stemH = (stage === 'young' ? 0.06 : stage === 'bell' ? 0.16 : 0.24) * s, tilt = (rnd() - 0.5) * 0.25, yaw = rnd() * 6.28;
  const T = at(foot.x, foot.y, foot.z, tilt, yaw, (rnd() - 0.5) * 0.2);
  // the stem, a bulb at its foot and the ring partway up
  K.add(lathe([[0.02 * s, 0], [0.026 * s, 0.012 * s], [0.018 * s, 0.03 * s], [0.016 * s, stemH + 0.02 * s], [0.001, stemH + 0.03 * s]], 10), T, { color: 0xf2eee6, glow: 0.5, birth, root: foot });
  if (stage !== 'old') K.add(new THREE.TorusGeometry(0.02 * s, 0.004 * s, 4, 12).rotateX(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(T, at(0, stemH * 0.45, 0)), { color: 0xe8e2d6, glow: 0.4, birth, root: foot });
  // the cap: a shaggy bell, its rim (from the bottom) going to ink as it ages
  const prof = stage === 'young' ? [[rc * 0.86, 0], [rc, 0.12], [rc * 1.02, 0.5], [rc * 0.92, 0.78], [rc * 0.6, 0.94], [0, 1]]
    : stage === 'bell' ? [[rc * 1.25, 0], [rc * 1.08, 0.18], [rc * 0.98, 0.5], [rc * 0.86, 0.78], [rc * 0.55, 0.94], [0, 1]]
      : [[rc * 1.4, 0.34], [rc * 1.15, 0.34], [rc * 0.96, 0.55], [rc * 0.8, 0.8], [rc * 0.5, 0.94], [0, 1]];
  const ink = stage === 'young' ? -0.1 : stage === 'bell' ? 0.24 : 0.62, y0 = stage === 'old' ? 0.34 : 0;
  const cap = lathe(prof.map(([r, y]) => [r, y * Hc]), 16), cp = cap.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), q = Math.atan2(z, x), v = y / Hc, sc = (v * 12 + scaleRow(q) * 0.5) % 1, e = v < 0.9 ? 1 + 0.09 * sc * (1 - v) : 1; cp.setXYZ(i, x * e, y, z * e); }
  cap.computeVertexNormals();
  const capAt = new THREE.Matrix4().multiplyMatrices(T, at(0, stemH - (stage === 'old' ? y0 * Hc : 0) - 0.012 * s, 0));
  K.add(cap, capAt, { color: (l) => {
    const v = l.y / Hc, sc = (v * 12 + scaleRow(Math.atan2(l.z, l.x)) * 0.5) % 1;
    if (v < ink) return [0x16121a, 0];
    if (v < ink + 0.1) return [mix(0x16121a, 0x8a7c88, (v - ink) / 0.1), 0.2];
    if (v > 0.86) return [0xbc9c78, 0.7];
    return [sc > 0.72 ? 0xcdb89c : 0xf6f2ea, sc > 0.72 ? 0.7 : 1];
  }, birth: birth + 0.04, root: foot, rough: 0.8 });
  if (stage !== 'young') { // (the gills inside the open bell, going black)
    const inner = lathe(prof.filter(([, y]) => y < 0.7).map(([r, y]) => [r * 0.9, y * Hc + 0.004]), 16), I = inner.index.array.slice(); for (let i = 0; i < I.length; i += 3) [I[i + 1], I[i + 2]] = [I[i + 2], I[i + 1]]; inner.setIndex([...I]); inner.computeVertexNormals();
    K.add(inner, capAt, { color: (l) => (l.y / Hc < ink + 0.2 ? 0x141016 : 0x7a6a72), glow: 0, birth: birth + 0.04, root: foot, rough: 0.5 });
    const drips = stage === 'old' ? 4 : 2;
    for (let i = 0; i < drips; i++) { const q = rnd() * 6.28, r = prof[0][0] * 0.98, dy = prof[0][1] * Hc; K.add(new THREE.SphereGeometry(0.008 * s, 6, 5), new THREE.Matrix4().multiplyMatrices(capAt, at(Math.cos(q) * r, dy - 0.012 * s, Math.sin(q) * r, 0, 0, 0, 1, 2.4, 1)), { color: 0x0e0b10, rough: 0.12, birth: birth + 0.1, root: foot }); }
  }
  if (stage === 'old') K.add(new THREE.CircleGeometry(0.05 * s, 12).rotateX(-Math.PI / 2), at(foot.x + 0.02, foot.y + 0.008, foot.z - 0.01, 0, 0, 0, 1.2, 1, 0.9), { color: 0x0c0a0e, rough: 0.08, birth: birth + 0.2, root: foot });
}

// ---- grief: the oyster on rotting wood
function oyster(K, R, rnd) {
  const sc = R / 1.2, sd = rnd() * 20, bark = (l) => mix(0x3c3028, 0x6a5a4a, noise3(l.x * 4 + sd, l.y * 28, l.z * 28) * 0.7 + 0.3 * noise3(l.x * 40, l.y * 3, sd));
  const wood = (r, rr) => mix(0x5a4430, 0xb09070, Math.min(1, rr / r) * 0.6 + 0.4 * (0.5 + 0.5 * Math.sin((rr / r) * 22)));
  // the log, lying, its bark ridged, its ends showing the rotted rings
  const L = 1.3 * sc, lr = 0.2, logYaw = 0.28, lx = -0.1 * sc, lz = 0.05;
  const log = new THREE.CylinderGeometry(lr, lr * 1.05, L, 18, 8, true).rotateZ(Math.PI / 2), lp = log.attributes.position;
  for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i), z = lp.getZ(i), q = Math.atan2(z, y), e = 1 + 0.06 * noise3(x * 2 + sd, Math.cos(q) * 2, Math.sin(q) * 2) + 0.035 * Math.abs(Math.sin(q * 9)); lp.setXYZ(i, x, y * e, z * e); }
  log.computeVertexNormals();
  const LT = at(lx, lr * 0.82, lz, 0, logYaw, 0);
  for (const t of [-0.45, -0.15, 0.15, 0.45]) K.keep.push([lx + Math.cos(logYaw) * t * L, lz - Math.sin(logYaw) * t * L, lr + 0.12]);
  K.keep.push([0.42 * sc, -0.42 * sc, 0.3]);
  K.add(log, LT, { color: bark, rough: 0.95 });
  for (const sgn of [-1, 1]) { const end = new THREE.RingGeometry(0.001, lr * 1.04, 18, 5).rotateY(sgn * Math.PI / 2); K.add(end, new THREE.Matrix4().multiplyMatrices(LT, at(sgn * L / 2, 0, 0)), { color: (l) => wood(lr, Math.hypot(l.y, l.z)), rough: 0.95 }); }
  // the stump, its top broken
  const sx = 0.42 * sc, sz = -0.42 * sc, sr = 0.17, sh = 0.36;
  const st = new THREE.CylinderGeometry(sr, sr * 1.15, sh, 16, 4, true), spp = st.attributes.position;
  for (let i = 0; i < spp.count; i++) { const x = spp.getX(i), y = spp.getY(i), z = spp.getZ(i), q = Math.atan2(z, x); spp.setXYZ(i, x * (1 + 0.05 * Math.abs(Math.sin(q * 8))), y > 0 ? y + 0.06 * noise3(Math.cos(q) * 3, Math.sin(q) * 3, sd) : y, z * (1 + 0.05 * Math.abs(Math.sin(q * 8)))); }
  st.computeVertexNormals();
  K.add(st, at(sx, sh / 2 - 0.02, sz), { color: bark, rough: 0.95 });
  const top = new THREE.RingGeometry(0.001, sr, 16, 4).rotateX(-Math.PI / 2), tp = top.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i), q = Math.atan2(z, x); tp.setY(i, 0.04 + 0.05 * noise3(Math.cos(q) * 3, Math.sin(q) * 3, sd) * Math.hypot(x, z) / sr - 0.015 * (1 - Math.hypot(x, z) / sr)); }
  top.computeVertexNormals(); K.add(top, at(sx, sh - 0.02 - 0.03, sz), { color: (l) => wood(sr, Math.hypot(l.x, l.z)), rough: 0.95 });
  // the shelves, in overlapping clusters on the log's side and the stump's
  const clusters = [[LT, -0.28, 0.12, 4], [LT, 0.2, 0.22, 4], [LT, 0.05, 2.95, 3], [null, 0, 0.9, 4], [null, 0, 2.4, 3]];
  clusters.forEach(([T, t, ang, n], ci) => {
    for (let i = 0; i < n; i++) {
      let p, dir;
      if (T) { const q = ang + (rnd() - 0.5) * 0.3, h = (i - n / 2) * 0.06; p = V(t * L + (rnd() - 0.5) * 0.12, Math.sin(q) * lr * 0.98 + h, Math.cos(q) * lr * 0.98).applyMatrix4(T); dir = V(0, 0, Math.cos(q) >= 0 ? 1 : -1).applyAxisAngle(V(0, 1, 0), logYaw); } // (out from the log's side, level)
      else { const q = ang + (rnd() - 0.5) * 0.5; p = V(sx + Math.cos(q) * sr * 1.02, 0.08 + i * 0.07, sz + Math.sin(q) * sr * 1.02); dir = V(Math.cos(q), 0, Math.sin(q)); }
      shelf(K, p, dir, (0.12 + rnd() * 0.07) * (1 - i * 0.08), 0.1 + 0.12 * ci + i * 0.05 + rnd() * 0.05, rnd);
    }
  });
}
function shelf(K, p, dir, Rc, birth, rnd) {
  const span = 0.85 + rnd() * 0.35, up = 0.28 + rnd() * 0.2, wav = rnd() * 6, base = Math.atan2(dir.z, dir.x);
  const pt = (u, v, under) => {
    const q = base + (v - 0.5) * 2 * span, r = Rc * (0.12 + 0.88 * u) * (1 + 0.07 * Math.sin((v - 0.5) * 10 + wav) * u), roll = u > 0.82 ? ((u - 0.82) / 0.18) ** 2 * 0.22 * Rc : 0;
    const y = r * up + Rc * 0.22 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - roll - (under ? Rc * (0.12 + 0.16 * (1 - u)) + 0.008 * Math.abs(Math.sin((v - 0.5) * 2 * span * 14)) * u : 0);
    return V(p.x + Math.cos(q) * r, p.y + y, p.z + Math.sin(q) * r);
  };
  K.add(sheet(6, 10, (u, v) => pt(u, v, false)), new THREE.Matrix4(), { color: (l) => [mix(0x34312e, 0x6a645a, Math.min(1, l.distanceTo(p) / Rc * 1.2)), 0.75], birth, root: p, rough: 0.8 });
  K.add(sheet(6, 10, (u, v) => pt(u, v, true), V(0, -1, 0)), new THREE.Matrix4(), { color: 0xc8bca2, glow: 1, sheen: 0.32, birth, root: p, rough: 0.7 });
}

// ---- dread: witches' butter on dead branches
const butterColour = (n, l) => { const k = noise3(l.x * 60, l.y * 60, l.z * 60); return mix(0xd06a08, 0xffcc30, 0.35 + 0.65 * k); };
function jellyBlob(r, sd, ws = 14, hs = 10) {
  const g = new THREE.SphereGeometry(1, ws, hs), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i).normalize(); const f = Math.abs(noise3(_v.x * 2.6 + sd, _v.y * 2.6, _v.z * 2.6) - 0.5) * 2, e = r * (0.7 + 0.42 * (1 - f) ** 2); p.setXYZ(i, _v.x * e, Math.max(-0.2 * r, _v.y * e * 0.7), _v.z * e); }
  g.computeVertexNormals(); return g;
}
function butter(K, R, rnd) {
  const sc = R / 1.2, bark = (l) => { const n = noise3(l.x * 9, l.y * 30, l.z * 30); return n > 0.68 ? 0xb0a48c : mix(0x4e463e, 0x7a7064, n); };
  const sticks = [[-0.5, -0.2, 0.5, 0.25, 0.042], [-0.4, 0.35, 0.55, -0.3, 0.036], [0.1, -0.55, 0.3, 0.55, 0.03], [-0.15, 0.05, 0.6, 0.12, 0.05]];
  const spots = [];
  sticks.forEach(([x0, z0, x1, z1, r], k) => {
    const a = V(x0 * sc, r * 0.8, z0 * sc), b = V(x1 * sc, r * 0.8 + k * 0.012, z1 * sc), m = a.clone().lerp(b, 0.5).add(V((rnd() - 0.5) * 0.12, 0.03, (rnd() - 0.5) * 0.12));
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    K.add(new THREE.TubeGeometry(curve, 10, r, 7, true), new THREE.Matrix4(), { color: bark, rough: 0.95 });
    for (let i = 0; i < 4; i++) { const t = 0.12 + rnd() * 0.76, p = curve.getPoint(t), tan = curve.getTangent(t), side = V(-tan.z, 0, tan.x).normalize().multiplyScalar(rnd() > 0.5 ? 1 : -1); spots.push([p.add(side.multiplyScalar(r * 0.5)).add(V(0, r * 0.55, 0)), r]); }
  });
  const stub = new THREE.CylinderGeometry(0.045, 0.06, 0.34, 9, 3, false); K.add(stub, at(0.42 * sc, 0.16, -0.2 * sc, 0.12, 0, -0.1), { color: bark, rough: 0.95 });
  spots.push([V(0.43 * sc, 0.22, -0.15 * sc), 0.06], [V(0.39 * sc, 0.1, -0.24 * sc), 0.06]);
  spots.forEach(([p, r], i) => K.add(jellyBlob((0.06 + rnd() * 0.06) * (r > 0.04 ? 1.15 : 1), rnd() * 40), at(p.x, p.y, p.z, (rnd() - 0.5) * 0.4, rnd() * 6, (rnd() - 0.5) * 0.4), { color: (l, w, n) => butterColour(n, l), glow: 1, rough: 0.2, birth: 0.08 + (i / spots.length) * 0.6 + rnd() * 0.06, root: p.clone() }));
}

const BUILD = { wonder: lichen, mirth: koji, desire: inkcap, grief: oyster, dread: butter };

/** A spore bed colonised by a strain. */
export function strainBed(strain = 'wonder', { radius = STRAIN_LOOK.radius, growth = 1, night = 0, seed = 1, curve = 0 } = {}) {
  const feeling = BUILD[strain] ? strain : FEELING_OF[strain] ?? 'wonder', rnd = rng(seed * 31 + Object.keys(BUILD).indexOf(feeling));
  const K = new BedParts();
  BUILD[feeling](K, radius, rnd); mycelialMats(K, radius, rnd); fairyRing(K, radius + STRAIN_LOOK.ring, feeling, rnd);
  const geo = K.done(curve), mat = strainMaterial(feeling), U = mat.userData.u;
  const mesh = new THREE.Mesh(geo, mat); mesh.name = `strain-bed-${STRAIN_FUNGI[feeling]}`; mesh.receiveShadow = true; mesh.castShadow = false;
  const group = new THREE.Group(); group.name = 'spore-bed'; group.add(mesh);
  let gone = false;
  const B = {
    group, mesh, feeling, fungus: STRAIN_FUNGI[feeling], tris: geo.index.count / 3,
    /** growth: 0 inoculated .. 1 the colony full; night: 0 day .. 1 night (the garden's), the foxfire's strength. */
    set({ growth: gw = U.uGrowth.value, night: nt = U.uNight.value } = {}) { U.uGrowth.value = THREE.MathUtils.clamp(Number.isFinite(gw) ? gw : U.uGrowth.value, 0, 1); U.uNight.value = THREE.MathUtils.clamp(Number.isFinite(nt) ? nt : U.uNight.value, 0, 1); },
    update(raw = 1 / 60) { U.uT.value = (U.uT.value + (raw > 0 ? raw : 0)) % BREATH_WRAP; mindTick(); }, // (a whole number of breaths, so the wrap is not seen; a bad step is none)
    dispose() { if (gone) return; gone = true; group.parent?.remove(group); geo.dispose(); mat.dispose(); },
  };
  B.set({ growth, night });
  return B;
}

let PARKED = null;
/** A small bed of the strains' material for the warm-up (the program the garden will draw; never disposed). */
export function strainsParked() {
  if (PARKED) return PARKED;
  const B = strainBed('dread', { radius: 0.3 }); PARKED = B.mesh; PARKED.name = 'strain-bed-parked'; PARKED.material.userData.shared = true;
  return PARKED;
}
