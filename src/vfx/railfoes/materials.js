// ---------------------------------------------------------------------------------------
// THE RAIL FOES' TWO PROGRAMS (vfx/railfoes.js): the body, one MeshStandardMaterial program for every rail foe's body (vertex colour,
// the glow weights of kit.js lit by the foe's feeling and its tell, the hit's flicker and shake, the death's break, burst or sink), and
// the halo, one additive program for every muzzle's, lantern's and lure's glow (camera-facing quads), the escort's tether and its
// shield bubble. A foe owns a material of each (its state is its uniforms) and they share the program: `customProgramCacheKey`.
//
// The per-foe state is a vec4 a unit (tell k, hit, death, reveal; four units: the body, and a gunship's two guns and core, picked by
// the vertex's `unit`), so a part is hit and downed in the same draw as its hull. A later instanced swap (the school, the mines) reads
// the body's one vec4 from an instanced attribute instead (`iState`, under USE_INSTANCING: written here already, so the swap is a
// mesh, not a shader).
//
// Prior art: the bracelet's merged body (vfx/bracelet.js: glow weights in the vertex, one program), three.js's onBeforeCompile with a
// cache key (vfx/bismuth.js, cavekit.js), the shmup's hit flicker in place of a white flash (Molinari, RAIL-FOES-ARCHETYPES.md 4.2), a
// mesh exploding by its faces in the vertex shader (the classic "explode" geometry-shader demo, done per primitive group here).
//
// A forged seal (vertex fx.w 2: wreckers.js cradle) flickers in a stutter of a livid red, apart from the steady ember.
//
// A unit that is a part (a gunship's guns, its core once open) is lined in GOLD while it can be hit (a rim in the rail's world marks'
// gold, 0xffd36a, brighter in a hit's flicker) and CRAZES as it is hurt (`uParts[unit]`: x hurt 0..1, y the line): the cell net of
// vfx/partcraze.js drawn in this same program (no second skin, no second draw), its cracks lit gold from within near the end (the
// boss parts' look: docs/plans/RAIL-FLOW.md section 4).
//
//   bodyMaterial({ flex, death }) -> MeshStandardMaterial (userData.u: its uniforms)   haloMaterial() -> ShaderMaterial (userData.u)
//   DEATH { break, sink, burst } (the styles)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** A death's look: burst speed (m/s-ish over the death), drop, shrink, tumble, sink (the whole), pitch (the whole), flash. */
export const DEATH = {
  break: [1.4, 2.2, 0.35, 2.4, 0.6, 0.35, 0.9], // (the Wreckers: planks and iron flying, falling, the hull going down)
  sink:  [0.35, 0.4, 0.15, 0.5, 2.2, 0.9, 0.5], // (the Egregores: the beast pitching nose-down and gone under)
  burst: [3.2, 0.3, 1.0, 3.0, 0, 0, 1.6],      // (the strays, the mine, the carrier: a pop of glaze and light)
};

const BODY_VERT_PARS = /* glsl */`
attribute vec4 fx;
attribute vec4 part;
uniform float uTime;
uniform vec4 uFlex;   // xyz the flex's direction, w its size
uniform vec2 uWave;   // the flex's rate, and its wavenumber along the body
uniform vec4 uDeathA; // burst, drop, shrink, tumble
uniform vec3 uDeathB; // sink, pitch, flash
attribute vec2 unit;  // which unit (0 the body; a gunship's guns and core), its slide
uniform float uOpen;  // the gunship's shutters, 0 shut .. 1 open
#ifdef USE_INSTANCING
attribute vec4 iState;
#define FOE_STATE iState
#define FOE_PART vec2(0.0)
#else
uniform vec4 uStates[4]; // a unit's tell k, hit, death, reveal
uniform vec2 uParts[4];  // a unit's hurt (0..1: its crazing) and its gold line (0 none .. 1 lined: it can be hit)
#define FOE_STATE uStates[int(unit.x + 0.5)]
#define FOE_PART uParts[int(unit.x + 0.5)]
#endif
varying vec4 vFx;
varying vec4 vState;
varying float vSeed;
varying vec2 vPart;
varying vec3 vObj;
`;
const BODY_VERT = /* glsl */`
vFx = fx; vState = FOE_STATE; vSeed = part.x * 3.1 + part.z * 1.7; vPart = FOE_PART; vObj = position;
transformed += uFlex.xyz * (sin(uTime * uWave.x - position.z * uWave.y) * part.w * uFlex.w);
transformed.x += sin(uTime * 90.0) * FOE_STATE.y * 0.03 + unit.y * uOpen * 0.5;
transformed.y += abs(unit.y) * uOpen * 0.06;
float dd = FOE_STATE.z;
if (dd > 0.0) {
  vec3 c = part.xyz;
  float h = fract(sin(dot(c, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  vec3 dir = normalize(c + vec3(0.001, 0.25, 0.0));
  vec3 loc = (transformed - c) * (1.0 - uDeathA.z * dd);
  vec3 ax = normalize(vec3(h - 0.5, 0.6, fract(h * 7.0) - 0.5));
  float a = uDeathA.w * dd * (h + 0.5), ca = cos(a), sa = sin(a);
  loc = loc * ca + cross(ax, loc) * sa + ax * dot(ax, loc) * (1.0 - ca);
  transformed = c + loc + dir * uDeathA.x * dd * (0.6 + h) - vec3(0.0, uDeathA.y * dd * dd, 0.0);
  float p = uDeathB.y * dd, cp = cos(p), sp = sin(p);
  transformed.yz = vec2(transformed.y * cp + transformed.z * sp, -transformed.y * sp + transformed.z * cp);
  transformed.y -= uDeathB.x * dd * dd;
  if (dd > 0.999) transformed = vec3(0.0); // (a downed part: gone)
}
`;
const BODY_FRAG_PARS = /* glsl */`
uniform float uTime;
uniform vec3 uAspect;
uniform vec3 uDeathB;
varying vec4 vFx;
varying vec4 vState;
varying float vSeed;
varying vec2 vPart;
varying vec3 vObj;
float foeHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float foeCells(vec3 p) { // (F2 - F1 of a cell net, 0 on an edge: vfx/partcraze.js's net, in the body's program)
  vec3 i = floor(p), f = fract(p); float f1 = 9.0, f2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), o = vec3(foeHash(i + g), foeHash(i + g + 17.3), foeHash(i + g + 41.9));
    float d = length(g + o - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return f2 - f1;
}
`;
const BODY_FRAG = /* glsl */`
{
  vec4 S = vState;
  float k = S.x, hit = S.y, d = S.z;
  float pulse = 0.85 + 0.15 * sin(uTime * 3.0 + vSeed);
  float tellGlow = 0.12 + 3.2 * k * k * (1.0 + 0.35 * step(0.92, k) * sin(uTime * 40.0));
  vec3 em = uAspect * (vFx.x * 0.9 * pulse + vFx.y * tellGlow);
  em += vec3(1.0, 0.8, 0.42) * vFx.z * S.w * (2.2 + 0.6 * sin(uTime * 8.0));
  if (vFx.w > 1.5) { // (a forged seal: a livid, wrong red in a stutter, never steady: the counterfeit showing)
    float n = fract(sin(floor(uTime * 11.0 + vSeed * 3.0) * 12.9898) * 43758.5453);
    em += vec3(0.95, 0.06, 0.26) * (0.25 + 1.6 * n * n);
  } else em += vec3(0.85, 0.16, 0.05) * vFx.w * (0.55 + 0.25 * sin(uTime * 5.0 + vSeed * 9.0));
  float flick = step(0.5, fract(uTime * 20.0)) * hit;
  em += diffuseColor.rgb * flick * 2.2;
  em += uAspect * uDeathB.z * smoothstep(0.0, 0.06, d) * (1.0 - d) * (1.0 - d) * 2.0;
  em *= 1.0 - 0.7 * d * d;
  // a part's gold line (its rim, while it can be hit) and its crazing (the cracks opening with its hurt, lit gold from within near the end)
  vec3 foeGold = vec3(1.0, 0.651, 0.141); // (0xffd36a in linear light: the rail's world marks' gold)
  if (vPart.y > 0.0 && d <= 0.0) {
    float ndv = abs(dot(normal, normalize(vViewPosition)));
    totalEmissiveRadiance += foeGold * vPart.y * smoothstep(0.5, 0.85, 1.0 - ndv) * (1.6 + 2.0 * hit);
  }
  if (vPart.x > 0.0 && d <= 0.0) {
    float hk = vPart.x; vec3 cp = vObj * 4.0; // (cells about a quarter metre: hairlines over a plate, never lacework, as vfx/partcraze.js)
    float cpx = 1.0 / max(length(fwidth(cp)), 1e-5), seen = smoothstep(2.5, 5.0, cpx);
    float e = foeCells(cp), aa = max(fwidth(e), 1e-5), w = max(mix(0.006, 0.04, hk), aa * 1.2);
    float crack = (1.0 - smoothstep(w - aa, w + aa, e)) * seen, sh = (1.0 - smoothstep(w * 2.6 - aa, w * 2.6 + aa, e)) * seen - crack;
    float lit = smoothstep(0.62, 0.95, hk);
    diffuseColor.rgb *= 1.0 - 0.45 * max(sh, 0.0) - 0.5 * crack * (1.0 - lit);
    totalEmissiveRadiance += crack * mix(vec3(0.62, 0.46, 0.26) * 0.18, foeGold * 3.0, lit) + foeGold * 0.12 * smoothstep(0.7, 1.0, hk);
  }
}
`;

const bodyCompile = (sh, mat) => {
  Object.assign(sh.uniforms, mat.userData.u);
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + BODY_VERT_PARS).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + BODY_VERT);
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + BODY_FRAG_PARS)
    .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - 0.55 * vState.z;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + BODY_FRAG);
};

/** A foe's body material (one program for them all). flex { dir, amp, rate, wave }, death a DEATH key. */
export function bodyMaterial({ flex = null, death = 'break', roughness = 0.62, metalness = 0.15 } = {}) {
  const D = DEATH[death] || DEATH.break, f = flex || {};
  const u = {
    uTime: { value: 0 }, uAspect: { value: new THREE.Color(1, 1, 1) }, uStates: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uParts: { value: [0, 1, 2, 3].map(() => new THREE.Vector2()) }, uOpen: { value: 0 },
    uFlex: { value: new THREE.Vector4(...(f.dir || [0, 1, 0]), f.amp || 0) }, uWave: { value: new THREE.Vector2(f.rate || 6, f.wave || 2) },
    uDeathA: { value: new THREE.Vector4(D[0], D[1], D[2], D[3]) }, uDeathB: { value: new THREE.Vector3(D[4], D[5], D[6]) },
  };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness });
  m.userData.u = u;
  m.onBeforeCompile = (sh) => bodyCompile(sh, m);
  m.customProgramCacheKey = () => 'railfoe-body';
  return m;
}

const HALO_VERT = /* glsl */`
attribute vec4 hc;  // the centre (local) and the half-width
attribute vec3 hk;  // mode (0 a billboard, 1 a mesh, 2 a fresnel shell), channel (kit.js HALO_CH), unit
uniform vec4 uStates[4];
uniform float uTime;
varying vec2 vUv;
varying float vI;
varying float vCh;
varying float vMode;
varying float vZ;
void main() {
  vec4 S = uStates[int(hk.z + 0.5)];
  float k = S.x, d = S.z, ch = hk.y;
  vCh = ch; vMode = hk.x; vZ = position.z;
  float I = 0.0, grow = 1.0;
  if (ch < 0.5) { I = 0.08 + 1.7 * k * k * (1.0 + 0.4 * step(0.92, k) * sin(uTime * 40.0)); grow = 0.3 + 0.9 * k; }
  else if (ch < 1.5) { I = 0.55 + 0.1 * sin(uTime * 3.0 + hc.x * 5.0); }
  else if (ch < 2.5) { I = S.w * (1.3 + 0.3 * sin(uTime * 8.0)); grow = 0.4 + 0.8 * S.w; }
  else if (ch < 3.5) { I = 0.45 + 0.2 * sin(uTime * 6.0 + hc.z * 4.0); }
  else { I = 0.7; }
  I += S.y * 0.6;
  I *= 1.0 - d;
  vI = I;
  vec4 mv;
  if (hk.x < 0.5) {
    float s = length(modelMatrix[0].xyz);
    mv = modelViewMatrix * vec4(hc.xyz, 1.0);
    mv.xy += position.xy * hc.w * s * grow;
    vUv = position.xy;
  } else {
    mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vUv = vec2(hk.x > 1.5 ? 1.0 - abs(dot(n, normalize(-mv.xyz))) : 0.0, 0.0);
  }
  gl_Position = projectionMatrix * mv;
}
`;
const HALO_FRAG = /* glsl */`
uniform vec3 uAspect;
uniform float uTime;
varying vec2 vUv;
varying float vI;
varying float vCh;
varying float vMode;
varying float vZ;
void main() {
  float a;
  if (vMode < 0.5) { float r = length(vUv); a = pow(max(0.0, 1.0 - r), 2.2); }
  else if (vMode < 1.5) { a = 0.55 + 0.45 * step(0.5, fract(vZ * 6.0 - uTime * 3.0)); }
  else { a = pow(vUv.x, 2.5) * 0.9 + 0.04; }
  vec3 col = vCh > 1.5 && vCh < 2.5 ? vec3(1.0, 0.8, 0.42) : vCh > 2.5 && vCh < 3.5 ? vec3(0.95, 0.22, 0.06) : uAspect;
  gl_FragColor = vec4(col * vI * a, 1.0);
}
`;

/** A foe's halo material (one program for them all): additive, unlit, no depth write. */
export function haloMaterial() {
  const u = { uTime: { value: 0 }, uAspect: { value: new THREE.Color(1, 1, 1) }, uStates: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  m.userData.u = u;
  return m;
}
