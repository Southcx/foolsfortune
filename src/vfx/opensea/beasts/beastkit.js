// ---------------------------------------------------------------------------------------
// THE SEA BEASTS' FIGHT KIT (docs/plans/OPEN-SEA.md section 14.3; the beasts: progress/opensea/seabeasts.js SEA_BEASTS, Dovina's): what
// the open sea's fighting Egregores' bodies share past the sea serpent's (vfx/opensea/seaserpentbody.js), so each beast is its own
// module and small (beasts/akhlut.js, beasts/umibozu.js):
//   THE PROGRAM  the safari's one program (egregorekit.js egregoreMaterial: the Brine dress, the swim on the GPU, the film's schiller in
//                the feeling's colour) taken whole and given what a fight needs, under its own cache key ('egregore-beast'): a vertex's
//                PART (aPart: 0 the body, 1 the weak point, 2 a limb), and for each part the rail's fight looks (vfx/railfoes/
//                materials.js): the hit's flicker, the GOLD LINE (0xffd36a) on its rim while it can be hit, the CRAZING (partcraze.js's
//                cell net) opening as it is hurt, lit gold near the end; a squint (the weak point's vertices drawn toward a height:
//                the umibozu's eyes flinching); and a HIDE (uHide: x a sheet of sea water sliding down the body and its limbs in
//                rivulets, the only gloss on a matte skin, roughness dropped and the albedo darkened along them; y the weak point's own
//                glow tinted gold by its gold line: the umibozu's eyes brightening to it). All 0 by default: one program for all.
//   THE SHAPES   a safari species' own geometry (egregoreshapes.js, egregoreshapes2.js: the same build, never a second akhlut), with
//                what the fight adds built in the same kit, and each vertex's part written by a rule over where it is.
//   THE WATER    a body breaking the surface or going back through it says so on the water's service (`game.water.disturb`: a
//                strength 0..1, never a size), at several points across a big body (crossings()).
//   THE RING     a landing ring, a world mark on the water in a feeling's colour (no words): a rim and a ripple running inward,
//                tightening as its windup runs out (the akhlut's breach).
//
// Prior art: the safari's bodies (egregorebodies.js, egregorekit.js) and the rail foes' fight program (railfoes/materials.js: a part's
// gold line and crazing in the body's own draw, no second skin); Sea of Thieves' Megalodon and Kraken (one body read by the water it
// breaks); Monster Hunter's leviathans (Lagiacrus, Plesioth: a weak point that glows while it can be struck).
//
//   beastGeometry(shape, col, { extra(k), partOf(x, y, z, show, item) -> 0..3, seed }) -> { geo, tris }   (item: which k.add, in order)
//   beastMaterial(shape, col, { roughness, craze }) -> material   (userData.u: the egregore uniforms and uBeast[4] (x hurt, y gold line,
//   z flash), uSquint (x a height, y how shut), uCraze, uHide (x wet, y the weak point's glow to gold))
//   setPart(u, i, hurt, line, flash)   crossings(game, pts, radii, state, dt, seaY, { budget })   landRing(colour) -> { mesh, set(at, r, k, on) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { EgregoreKit, egregoreMaterial } from '../egregorekit.js';
import { seeded } from '../../../core/rng.js';

/** A shape's geometry with the fight's parts written into it (aPart). */
export function beastGeometry(S, col, { extra = null, partOf = () => 0, seed = 1 } = {}) {
  const k = new EgregoreKit(S.L, { wave: S.waveW || 0 });
  if (S.build) S.build(k, col, seeded(seed));
  extra?.(k, col);
  const ends = []; let acc = 0; for (const g of k.items) ends.push((acc += g.attributes.position.count));
  const b = k.build(), P = b.geo.attributes.position.array, sh = b.geo.attributes.aShow.array, n = sh.length, part = new Float32Array(n);
  for (let i = 0, it = 0; i < n; i++) { while (it < ends.length - 1 && i >= ends[it]) it++; part[i] = partOf(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], sh[i], it); }
  b.geo.setAttribute('aPart', new THREE.BufferAttribute(part, 1));
  b.geo.boundingSphere.radius += S.L * 0.3; // (a habit's part grown out and the carriage's bend: never culled while some of it shows)
  return b;
}

const VERT_PARS = /* glsl */`
attribute float aPart;
uniform vec2 uSquint;
varying float vBPart;
`;
const VERT = /* glsl */`
vec3 transformed = egP;
vBPart = aPart;
if (aPart > 0.5 && aPart < 1.5 && uSquint.y > 0.0) transformed.y = uSquint.x + (transformed.y - uSquint.x) * (1.0 - 0.85 * uSquint.y);
`;
const FRAG_PARS = /* glsl */`
uniform vec4 uBeast[4];
uniform float uCraze;
uniform vec4 uHide;
varying float vBPart;
float bHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float bCells(vec3 p) {
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), o = vec3(bHash(i + g), bHash(i + g + 17.3), bHash(i + g + 41.9));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
`;
const FRAG = /* glsl */`
#include <emissivemap_fragment>
{
  vec4 BP = uBeast[int(vBPart + 0.5)];
  float flick = step(0.5, fract(uT * 20.0)) * BP.z;
  totalEmissiveRadiance += diffuseColor.rgb * flick * 2.2 + vec3(0.9, 0.85, 0.8) * flick * 0.12;
  vec3 gold = vec3(1.0, 0.651, 0.141);
  if (BP.y > 0.0) {
    float ndv = abs(dot(normal, normalize(vViewPosition)));
    totalEmissiveRadiance += gold * BP.y * smoothstep(0.5, 0.85, 1.0 - ndv) * (1.6 + 2.0 * BP.z);
  }
  if (BP.x > 0.0) {
    float hk = BP.x; vec3 cp = vObj * uCraze;
    float cpx = 1.0 / max(length(fwidth(cp)), 1e-5), seen = smoothstep(2.5, 5.0, cpx);
    float e = bCells(cp), aa = max(fwidth(e), 1e-5), w = max(mix(0.006, 0.04, hk), aa * 1.2);
    float crack = (1.0 - smoothstep(w - aa, w + aa, e)) * seen, sh = (1.0 - smoothstep(w * 2.6 - aa, w * 2.6 + aa, e)) * seen - crack;
    float lit = smoothstep(0.62, 0.95, hk);
    diffuseColor.rgb *= 1.0 - 0.45 * max(sh, 0.0) - 0.5 * crack * (1.0 - lit);
    totalEmissiveRadiance += crack * mix(vec3(0.62, 0.46, 0.26) * 0.18, gold * 3.0, lit) + gold * 0.12 * smoothstep(0.7, 1.0, hk);
  }
  if (uHide.y > 0.0 && abs(vBPart - 1.0) < 0.5) totalEmissiveRadiance += gold * vFx.x * BP.y * uHide.y;
  if (uHide.x > 0.0 && abs(vBPart - 1.0) > 0.5) {
    float a = atan(vObj.x, vObj.z), col = a * 23.0 + sin(a * 7.0 + vObj.y * 0.35) * 1.6 + sin(a * 3.0 - vObj.y * 0.2) * 2.4;
    float s = 0.5 + 0.5 * sin(col), aw = fwidth(s) + 1e-4, rill = smoothstep(0.88 - aw, 0.98 + aw, s);
    rill *= vBPart < 0.5 ? smoothstep(0.8, 2.2, length(vObj.xz)) : 1.0; // (none where the rills would meet at a crown)
    float id = floor(col / 6.2831853 + 0.5), fl = fract(vObj.y * 0.22 + uT * 0.16 + fract(sin(id * 12.9898) * 43758.5453));
    float sheet = smoothstep(0.0, 0.1, fl) * (1.0 - smoothstep(0.1, 0.9, fl));
    float broad = smoothstep(0.6, 1.0, 0.5 + 0.5 * sin(vObj.y * 0.45 + uT * 0.6 + a * 3.0));
    float wet = clamp(rill * (0.15 + 0.85 * sheet) + 0.12 * broad, 0.0, 1.0) * uHide.x;
    roughnessFactor = mix(roughnessFactor, 0.36, wet);
    diffuseColor.rgb *= 1.0 - 0.25 * wet;
  }
}
`;

/** The safari's program with the fight's parts (see the header); one program for every beast. */
export function beastMaterial(S, col, { roughness = 0.36, craze = 4 } = {}) {
  const m = egregoreMaterial({ L: S.L, feel: new THREE.Color(col), wave: S.wave || [0, 0, 0], fin: S.fin || [0, 0, 0, 0], roughness }), base = m.onBeforeCompile, u = m.userData.u;
  Object.assign(u, { uBeast: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uSquint: { value: new THREE.Vector2() }, uCraze: { value: craze }, uHide: { value: new THREE.Vector4() } });
  m.side = THREE.DoubleSide;
  m.onBeforeCompile = (sh, r) => {
    base(sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${VERT_PARS}`).replace('vec3 transformed = egP;', VERT);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${FRAG_PARS}`).replace('#include <emissivemap_fragment>', FRAG);
  };
  m.customProgramCacheKey = () => 'egregore-beast';
  return m;
}

/** A part's fight state: its hurt (0..1, the crazing), its gold line (0..1) and its flash (0..1). */
export function setPart(u, i, hurt, line, flash) { const v = u.uBeast.value[i]; v.x = hurt; v.y = line; v.z = flash; }

/** Where a body's points break the surface or go back through it, a disturbance (three across a broad one), as the serpent's water. */
export function crossings(game, pts, radii, st, dt, seaY, { budget = 14, wide = 4 } = {}) {
  const W = game.water; if (!W?.disturb) return;
  st.above ||= new Uint8Array(pts.length); st.t ||= new Float32Array(pts.length); st.n = Math.max(0, (st.n || 0) - dt * 8);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], r = radii[i], up = p.y + r * 0.6 > seaY && p.y - r < seaY + 1.5 ? 1 : 0;
    st.t[i] = Math.max(0, st.t[i] - dt);
    if (up !== st.above[i] && st.t[i] <= 0 && st.n < budget) {
      const n = r > wide ? 1 : 0;
      for (let q = -n; q <= n; q++) W.disturb(p.x + q * r * 0.7, p.z + q * r * 0.4, Math.min(1, 0.3 + r / 10), up ? 'dive' : 'wake', seaY);
      st.t[i] = 0.5; st.n += 1 + 2 * n;
    }
    st.above[i] = up;
  }
}

/** A ring of disturbances round a point (a crash, a rise): `n` on the rim, one strong in the middle. */
export function splashRing(game, x, z, r, n, k, seaY, kind = 'dive') {
  const W = game.water; if (!W?.disturb) return;
  W.disturb(x, z, Math.min(1, k), kind, seaY);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; W.disturb(x + Math.cos(a) * r, z + Math.sin(a) * r, Math.min(1, k * 0.8), kind, seaY); }
}

const RING_VERT = /* glsl */`
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = /* glsl */`
uniform vec3 uCol;
uniform float uK, uT, uOn;
varying vec2 vP;
void main() {
  float r = length(vP);
  if (r > 1.0) discard;
  float aa = fwidth(r) * 1.5;
  float rim = smoothstep(0.9 - aa, 0.93, r) * (1.0 - smoothstep(0.985, 1.0, r));
  float run = fract(r * 3.0 + uT * (0.6 + 1.6 * uK));
  float ripple = smoothstep(0.0, 0.08, run) * (1.0 - smoothstep(0.08, 0.3, run)) * smoothstep(0.15, 0.6, r) * (0.25 + 0.5 * uK);
  float beat = 0.75 + 0.25 * sin(uT * (5.0 + 14.0 * uK));
  float a = (rim * (0.8 + 0.8 * uK) * beat + ripple + 0.05 + 0.1 * uK) * uOn;
  gl_FragColor = vec4(uCol * a, 1.0);
}`;

/** The landing ring (a world mark: no words): `set(at, r, k, on)` its centre on the water, radius (m), how near (0..1) and its show. */
export function landRing(colour) {
  const u = { uCol: { value: new THREE.Color(colour).multiplyScalar(1.6) }, uK: { value: 0 }, uT: { value: 0 }, uOn: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); // (its xy the disc's coordinates for the shader, laid flat by the turn)
  mesh.rotation.x = -Math.PI / 2; mesh.visible = false; mesh.renderOrder = 3; mesh.userData.zone = 'opensea'; mesh.frustumCulled = false;
  return {
    mesh, u,
    set(at, r, k, on, t) { mesh.visible = on > 0.01; if (!mesh.visible) return; mesh.position.copy(at); mesh.scale.set(r, r, 1); u.uK.value = k; u.uOn.value = on; u.uT.value = t; },
    dispose() { mesh.removeFromParent(); mesh.geometry.dispose(); mat.dispose(); },
  };
}
