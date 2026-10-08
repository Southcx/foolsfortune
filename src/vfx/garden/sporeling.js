// ---------------------------------------------------------------------------------------
// A SPORELING, DRAWN: a small fungal spirit Myggdrasil's crown now and then holds, who hops down and settles in the garden
// (docs/plans/MYCELIUM.md section 5; Dovina's handoff "Myggdrasil's look"; the owner, of the spirits: "so cute"). A Figment the garden
// made. This is its look and its motions only: where it goes and why is Petra's (its mind, its planetoid body).
//
//   THE BODY   a cap for a head (a domed cap in its fruit's colour, spotted cream like the fly agaric that grows under the world tree's
//              birch), its gills under it in labradorite edged in gold (the garden's one look), a chubby stem for a body with two big
//              dark eyes and a blush, little hyphae for arms and feet, frayed at their ends
//   THE GLOW   foxfire in its colour, strongest in the gills: faint by day, a soft breath at night (never a flicker)
//   THE MOTION an idle sway (the stem bending from its foot, the cap lagging it), the arms drifting, a blink now and then; a waddle
//              while it walks (moving 0..1); and a HOP: a crouch, a stretch as it leaves the ground, its feet tucked and its arms up in
//              the air, a squash on landing. hop(0) gives the squash and stretch alone, for a body already moved through the air by
//              its planetoid body (world/garden/planetbody.js)
// One program for every sporeling: one merged mesh each (one draw), its parts bent by the vertex shader on a few uniforms, so a
// sporeling costs a draw and nothing per frame but its uniforms. No shadow cast (the depth pass would not bend with it).
//
// Prior art: the fly agaric of folk art and Siberian lore (the mushroom under the world tree), the mushroom folk of Super Mario's
// Toads, Paper Mario and Kirby's Cappies, Pikmin's flowers and Ori's Moki for a small body read by its silhouette and a bounce,
// the squash and stretch of Disney's twelve principles (Thomas and Johnston, The Illusion of Life), bioluminescent Mycena's
// glowing gills.
//
//   const S = sporeling({ colour, size?, seed? })   S.group (stands on its origin, +Y up, its face to +z)   S.update(rawDt)   S.dispose()
//   S.set({ colour, night, moving, sway })   S.hop(height = 0.25)   S.airborne (true while a hop is in the air)
//   (colour: a hex, a THREE.Color, a CSS colour or Soul Alchemy's { h, s }: its fruit's)   sporelingParked() (warm-up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';
import { wheelColour } from '../wheelcolour.js';

/** The numbers: its height (m), the glow by day and by night, the sway's reach (m at the cap), the hop's phases (real seconds). */
export const SPORELING = { height: 0.33, glowDay: 0.12, glowNight: 1, sway: 0.028, crouch: 0.12, launch: 0.07, air: 0.42, land: 0.2 };
const PART = { stem: 0, cap: 1, armL: 2, armR: 3, legL: 4, legR: 5, eyes: 6 }; // (its own left and right: facing +z, its left is +x)

const KEY = 'garden-sporeling-1';
const VERT_DECL = /* glsl */`
attribute vec4 aSp;
attribute vec3 aPivot;
uniform vec4 uPose;
uniform vec4 uLimb;
uniform vec3 uCap;
uniform float uSquash;
uniform float uBlink;
varying float vGlow;
varying float vSheen;
varying vec3 vWp;
mat3 spRx(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 spRz(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
mat3 spTurn(int part) {
  if (part == 2) return spRz(uLimb.x);
  if (part == 3) return spRz(-uLimb.y);
  if (part == 4) return spRx(uLimb.z);
  if (part == 5) return spRx(uLimb.w);
  if (part == 1) return spRx(uPose.z) * spRz(uPose.w);
  return mat3(1.0);
}
`;
const NORMAL_BODY = /* glsl */`
  objectNormal = spTurn(int(aSp.x + 0.5)) * objectNormal;
`;
const VERT_BODY = /* glsl */`
  {
    int part = int(aSp.x + 0.5);
    vec3 p = transformed;
    p = aPivot + spTurn(part) * (p - aPivot);
    if (part == 6) p.y = aPivot.y + (p.y - aPivot.y) * (1.0 - 0.88 * uBlink); // (a blink: the eyes shut to a line)
    float k = clamp(p.y / ${(SPORELING.height * 0.62).toFixed(3)}, 0.0, 1.7);
    p.xz += uPose.xy * k * k; // (the stem bends from its foot, the cap carried with it)
    p.y *= 1.0 - uSquash; p.xz *= 1.0 + 0.5 * uSquash; // (squash and stretch, its volume kept)
    transformed = p;
    vGlow = aSp.z; vSheen = aSp.w;
  }
`;
const COLOR_VERT = /* glsl */`
  #if defined( USE_COLOR )
    vColor = mix(vec3(color), vec3(color) * uCap, aSp.y);
  #endif
`;
const FRAG_DECL = /* glsl */`
uniform vec3 uCap;
uniform float uGlow;
uniform float uT;
varying float vGlow;
varying float vSheen;
varying vec3 vWp;
${LAB_GLSL}
`;
const FRAG_LIGHT = /* glsl */`
  {
    float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
    if (vSheen > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, labInk(labPhase(vWp, normalize(cameraPosition - vWp)), 0.35 + 0.65 * rim), vSheen);
    float breath = 0.82 + 0.18 * sin(uT * 0.9);
    totalEmissiveRadiance += uCap * vGlow * uGlow * breath;
  }
`;
function sporelingMaterial(colour) {
  const m = new THREE.MeshStandardMaterial({ name: 'garden-sporeling', vertexColors: true, roughness: 0.62, metalness: 0 });
  const U = { uPose: { value: new THREE.Vector4() }, uLimb: { value: new THREE.Vector4() }, uCap: { value: colour }, uSquash: { value: 0 }, uBlink: { value: 0 }, uGlow: { value: SPORELING.glowDay }, uT: { value: 0 }, uMindT: mindTime };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${NORMAL_BODY}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`).replace('#include <color_vertex>', COLOR_VERT)
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_LIGHT}`);
  };
  m.customProgramCacheKey = () => KEY;
  m.userData.u = U;
  return m;
}

function toColour(c) {
  if (c && typeof c === 'object' && 'h' in c && 's' in c) return wheelColour(c.h, c.s);
  if (c && c.isColor) return c.clone();
  return new THREE.Color(c ?? 0xd8584a);
}
function rng(seed) { let a = (seed * 2654435761) >>> 0 || 3; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color(), _nm = new THREE.Matrix3(), _cap = new THREE.Vector2();

/** The body's parts merged, each vertex with its part, how much it takes the cap's colour, its glow, its gills' sheen, and its joint. */
function bodyGeometry(size, rnd) {
  const P = [], N = [], C = [], S = [], Q = [], I = [];
  const add = (geo, m, { part, color, tint = 0, glow = 0, sheen = 0, pivot = V(0, 0, 0) }) => {
    const pos = geo.attributes.position, nor = geo.attributes.normal, base = P.length / 3; _nm.getNormalMatrix(m);
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i); const ly = _v.y; _v.applyMatrix4(m); _n.fromBufferAttribute(nor, i).applyMatrix3(_nm).normalize();
      _c.set(typeof color === 'function' ? color(ly, _v) : color);
      P.push(_v.x * size, _v.y * size, _v.z * size); N.push(_n.x, _n.y, _n.z); C.push(_c.r, _c.g, _c.b); S.push(part, tint, glow, sheen); Q.push(pivot.x * size, pivot.y * size, pivot.z * size);
    }
    const idx = geo.index ? Array.from(geo.index.array) : Array.from({ length: pos.count }, (_, i) => i); for (const k of idx) I.push(base + k);
    geo.dispose();
  };
  const at = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)), seg);
  const H = SPORELING.height / 0.322; // (the drawing below is 0.322 tall)
  const S0 = (k) => k * H;
  // the stem: chubby, cream, a hint of the cap's colour toward its foot
  add(lathe([[0.001, 0.04], [0.05, 0.044], [0.063, 0.078], [0.06, 0.13], [0.05, 0.18], [0.044, 0.205], [0.001, 0.21]].map(([r, y]) => [S0(r), S0(y)]), 16), new THREE.Matrix4(),
    { part: PART.stem, color: (y) => new THREE.Color(0xf1e6d2).lerp(new THREE.Color(0xe2cdb0), Math.max(0, 1 - y / S0(0.1)) * 0.6).getHex(), glow: 0.22 });
  // the cap: a dome in its colour (lighter at the crown), spotted cream; its gills under it, the gold at its edge
  const capP = V(0, S0(0.19), 0);
  add(lathe([[0.132, 0.19], [0.137, 0.203], [0.127, 0.25], [0.1, 0.29], [0.058, 0.315], [0.001, 0.322]].map(([r, y]) => [S0(r), S0(y)]), 22), new THREE.Matrix4(),
    { part: PART.cap, tint: 1, color: (y) => new THREE.Color(0xffffff).lerp(new THREE.Color(0xc8c0c0), Math.max(0, 1 - (y - S0(0.19)) / S0(0.12))).getHex(), glow: 0.32, pivot: capP });
  const gills = new THREE.RingGeometry(S0(0.04), S0(0.13), 28, 3).rotateX(Math.PI / 2), gp = gills.attributes.position;
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i), q = Math.atan2(z, x), r = Math.hypot(x, z); gp.setY(i, -S0(0.006) * Math.abs(Math.sin(q * 14)) * (r / S0(0.13)) - S0(0.01) * (1 - r / S0(0.13))); }
  gills.computeVertexNormals();
  add(gills, at(0, S0(0.191), 0), { part: PART.cap, color: 0x2a2440, glow: 1, sheen: 0.85, pivot: capP });
  add(new THREE.TorusGeometry(S0(0.132), S0(0.0055), 5, 28).rotateX(Math.PI / 2), at(0, S0(0.192), 0), { part: PART.cap, color: 0xd8a83a, glow: 0.5, pivot: capP });
  const CAP = [[0.137, 0.203], [0.127, 0.25], [0.1, 0.29], [0.058, 0.315], [0.001, 0.322]], capR = (y) => { for (let i = 1; i < CAP.length; i++) if (y <= CAP[i][1]) { const k = (y - CAP[i - 1][1]) / (CAP[i][1] - CAP[i - 1][1]); return CAP[i - 1][0] + (CAP[i][0] - CAP[i - 1][0]) * k; } return 0; };
  for (let i = 0; i < 7; i++) { // (the spots stand on the cap's skin: its radius at their height, a hair proud)
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.6, y = 0.215 + ((i * 3) % 7) / 7 * 0.085, r0 = capR(y), dy = (capR(y - 0.004) - capR(y + 0.004)) / 0.008, r = S0(0.011 + rnd() * 0.01);
    const n = V(Math.cos(a), dy, Math.sin(a)).normalize(), p = V(Math.cos(a) * S0(r0), S0(y), Math.sin(a) * S0(r0)).addScaledVector(n, S0(0.001));
    add(new THREE.SphereGeometry(1, 8, 5), new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n), V(r, r * 0.35, r)), { part: PART.cap, color: 0xfff1dc, glow: 0.6, pivot: capP });
  }
  // the face: two big dark eyes with a catchlight each, a blush under each in the cap's colour
  for (const s of [-1, 1]) {
    const e = V(s * S0(0.024), S0(0.132), S0(0.054));
    add(new THREE.SphereGeometry(1, 10, 8), at(e.x, e.y, e.z, 0, 0, 0, S0(0.013), S0(0.018), S0(0.008)), { part: PART.eyes, color: 0x120e16, pivot: e });
    add(new THREE.SphereGeometry(1, 6, 4), at(e.x + S0(0.005), e.y + S0(0.007), e.z + S0(0.007), 0, 0, 0, S0(0.0042)), { part: PART.eyes, color: 0xffffff, glow: 0.3, pivot: e });
    add(new THREE.SphereGeometry(1, 8, 5), at(s * S0(0.042), S0(0.112), S0(0.05), 0, s * 0.6, 0, S0(0.012), S0(0.007), S0(0.004)), { part: PART.stem, color: 0xffd8d0, tint: 0.6 });
  }
  // the arms: hyphae from the shoulders, frayed at their ends
  for (const s of [-1, 1]) {
    const sh = V(s * S0(0.054), S0(0.142), 0), end = V(s * S0(0.105), S0(0.088), S0(0.012));
    const curve = new THREE.QuadraticBezierCurve3(sh.clone().add(V(-s * S0(0.01), 0, 0)), V(s * S0(0.09), S0(0.13), S0(0.006)), end);
    add(new THREE.TubeGeometry(curve, 6, S0(0.011), 6, false), new THREE.Matrix4(), { part: s > 0 ? PART.armL : PART.armR, color: 0xece0cc, glow: 0.35, pivot: sh });
    for (let k = -1; k <= 1; k++) add(new THREE.ConeGeometry(S0(0.006), S0(0.024), 4), at(end.x + s * S0(0.006), end.y - S0(0.008), end.z + k * S0(0.007), k * 0.5, 0, s * 2.4 + k * 0.3), { part: s > 0 ? PART.armL : PART.armR, color: 0xf4ead8, glow: 0.5, pivot: sh });
  }
  // the feet: stubby hyphae, splayed into three toes
  for (const s of [-1, 1]) {
    const hip = V(s * S0(0.028), S0(0.05), 0);
    add(new THREE.CylinderGeometry(S0(0.016), S0(0.012), S0(0.042), 7), at(hip.x, S0(0.026), 0), { part: s > 0 ? PART.legL : PART.legR, color: 0xe8dac4, glow: 0.3, pivot: hip });
    for (let k = -1; k <= 1; k++) add(new THREE.ConeGeometry(S0(0.007), S0(0.03), 4), at(hip.x + k * S0(0.009), S0(0.005), S0(0.01), 1.45, k * 0.55, 0), { part: s > 0 ? PART.legL : PART.legR, color: 0xf2e6d2, glow: 0.4, pivot: hip });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aSp', new THREE.Float32BufferAttribute(S, 4)); g.setAttribute('aPivot', new THREE.Float32BufferAttribute(Q, 3)); g.setIndex(I);
  g.computeBoundingSphere(); g.boundingSphere.radius += 0.15 * size; // (room for the sway and the hop's stretch)
  return g;
}

/** A sporeling. */
export function sporeling({ colour = 0xd8584a, size = 1, seed = 1 } = {}) {
  const rnd = rng(seed), mat = sporelingMaterial(toColour(colour)), U = mat.userData.u, geo = bodyGeometry(size, rnd);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'sporeling-body'; mesh.castShadow = false; mesh.receiveShadow = true;
  const body = new THREE.Group(); body.add(mesh); const group = new THREE.Group(); group.name = 'sporeling'; group.add(body);
  const st = { t: rnd() * 10, ph: rnd() * 6.28, night: 0, moving: 0, sway: 1, blinkAt: 1 + rnd() * 3, blink: -1, hop: -1, hopH: 0, lean: new THREE.Vector2(), cap: new THREE.Vector2() };
  let gone = false;
  const S = {
    group, mesh,
    get airborne() { return st.hop >= SPORELING.crouch + SPORELING.launch && st.hop < SPORELING.crouch + SPORELING.launch + SPORELING.air; },
    /** colour: its fruit's; night: 0 day .. 1 night; moving: 0 still .. 1 walking (a waddle); sway: the idle's strength. */
    set({ colour: c, night = st.night, moving = st.moving, sway = st.sway } = {}) { if (c != null) U.uCap.value.copy(toColour(c)); st.night = night; st.moving = moving; st.sway = sway; },
    /** A hop of `height` metres (0: the squash and stretch alone, the body carried by something else). */
    hop(height = 0.25) { if (st.hop >= 0 && st.hop < SPORELING.crouch + SPORELING.launch + SPORELING.air) return; st.hop = 0; st.hopH = height * size; },
    update(raw = 1 / 60) {
      const L = SPORELING, dt = Math.min(raw, 0.1); st.t += dt; const t = st.t + st.ph, sw = L.sway * size * st.sway, mv = st.moving;
      // the idle sway and the waddle, the cap lagging the stem
      st.lean.set(Math.sin(t * 1.1) * 0.6 + Math.sin(t * 12) * 0.5 * mv, Math.sin(t * 0.83 + 1) * 0.4).multiplyScalar(sw);
      st.cap.lerp(_cap.set(-st.lean.y * 7 + 0.05 * Math.sin(t * 1.7), st.lean.x * 7), Math.min(1, dt * 6));
      let squash = 0.03 * Math.sin(t * 2.2) * st.sway, armL = 0.3 + 0.14 * Math.sin(t * 1.7), armR = 0.3 + 0.14 * Math.sin(t * 1.9 + 1), legL = Math.sin(t * 12) * 0.55 * mv, legR = -legL, lift = 0;
      if (st.hop >= 0) {
        st.hop += dt; const h = st.hop, a = L.crouch, b = a + L.launch, c = b + L.air, d = c + L.land;
        if (h < a) squash = 0.28 * Math.sin((h / a) * Math.PI * 0.5);
        else if (h < b) squash = 0.28 - 0.46 * ((h - a) / L.launch);
        else if (h < c) { const u = (h - b) / L.air; lift = 4 * st.hopH * u * (1 - u); squash = -0.18 * (1 - u) - 0.02; legL = legR = -0.7 * Math.sin(Math.PI * u); armL = armR = 0.3 + 1.0 * Math.sin(Math.PI * u); }
        else if (h < d) { const u = (h - c) / L.land; squash = 0.3 * Math.exp(-u * 3) * Math.cos(u * 5); }
        else st.hop = -1;
      }
      // a blink now and then
      st.blinkAt -= dt; if (st.blinkAt <= 0) { st.blink = 0; st.blinkAt = 2.5 + rnd() * 3; }
      let bl = 0; if (st.blink >= 0) { st.blink += dt; bl = Math.sin(Math.min(1, st.blink / 0.16) * Math.PI); if (st.blink > 0.16) st.blink = -1; }
      U.uPose.value.set(st.lean.x, st.lean.y, st.cap.x, st.cap.y); U.uLimb.value.set(armL, armR, legL, legR); U.uSquash.value = squash; U.uBlink.value = bl;
      U.uGlow.value = L.glowDay + (L.glowNight - L.glowDay) * st.night; U.uT.value = st.t % 3600; body.position.y = lift; mindTick();
    },
    dispose() { if (gone) return; gone = true; group.parent?.remove(group); geo.dispose(); mat.dispose(); },
  };
  return S;
}

let PARKED = null;
/** A sporeling of the shared material for the warm-up (the program the garden will draw; never disposed). */
export function sporelingParked() {
  if (PARKED) return PARKED;
  PARKED = sporeling({ size: 0.3 }).mesh; PARKED.name = 'sporeling-parked'; PARKED.material.userData.shared = true;
  return PARKED;
}
