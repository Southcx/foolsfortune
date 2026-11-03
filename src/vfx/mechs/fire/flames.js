// ---------------------------------------------------------------------------------------
// A FLAME CARD (plain name; the city's fire's look, vfx/mechs/fire/): three crossed cards standing on a burning cell, drawn in one
// shared flame program as a cartoon's fire: a toon tongue (a fat foot licking up into two or three tips that split and rejoin) cut
// hard at its edge, three flat bands nested inside it (Fury's crimson rim, its orange body, a white-gold core) and a dark keyline
// round it, every colour read off Fury's own ramp (vfx/shapes/ramps.js 'fury': the city's fire is the same substance as every other
// Fury flame in the game), its shape boiled on twos (the noise stepped at 12 a real second, Spider-Verse's), its sway smooth. The
// edge is cut with its own derivative, so it never crawls. Charred fuel (aFlame.y) shrinks the core and the body toward the rim.
// Every card in the city is one instance of one InstancedMesh; its life is worked out in the shader from the clock (`FLAME_TIME`), so a
// frame costs one uniform, and the CPU writes an instance only when the burning set changes (set, then commit). Premultiplied over:
// the bands cover what is behind them, the keyline darkens it.
// Used for the city's cells (vfx/mechs/fire/index.js), the straw giant's seams (bodies.js) and the flamer's cone (flamer.js), each
// its own FlameCards, one material.
// Prior art: The Wind Waker's and Okami's fire (nested flat tongues, a keyline, a white core), Hades' (Supergiant: tongues boiled on
// twos), Spider-Verse's stepped animation, the crossed-card fire of every sixth-generation game (Ico's torches, Godzilla: Save the
// Earth's burning city), the toon flame of the Shadertoys (a noise-bent width profile cut by step), Far Cry 2's flame a fuel's size.
//
//   FLAME_TIME (the shared uniform: { value } real s)   flameMaterial()   flameGeometry()
//   const F = new FlameCards(parent, max, name)   F.set(i, x, y, z, w, h, yaw, seed, char)   F.setBasis(i, ax, ay, p, w, h, seed, char)
//   F.commit(n)   F.mesh   F.dispose()   FLAME_BANDS   furyHex(t) (Fury's ramp at t as hex)   FLAME_WIND (the shared wind, world m/s: a Vector3 to copy into)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { rampHex } from '../../shapes/ramps.js';

/** Where on Fury's ramp each band is read (vfx/shapes/ramps.js 'fury': 0.18 near its dark, 0.5 COLOR.fury, 0.72 its orange, 0.95 white-gold). */
export const FLAME_BANDS = { key: 0.16, rim: 0.6, body: 0.8, core: 0.95 };
/** Fury's ramp at t as hex (a sprite's colour), and as a colour. */
export const furyHex = (t) => rampHex('fury', {}, t);
const furyAt = (t) => new THREE.Color(furyHex(t));

export const FLAME_TIME = { value: 0 };
export const FLAME_WIND = { value: new THREE.Vector3(2.4, 0, 0.9) };

const VERT = /* glsl */`
attribute vec4 aFlame; // seed, char (0 fresh .. 1 charred), sway, -
uniform float uTime; uniform vec3 uWind;
varying vec2 vUv; varying vec2 vF;
void main() {
  vUv = uv; vF = aFlame.xy;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  float h = length((modelMatrix * instanceMatrix)[1].xyz), u = uv.y, s = aFlame.x * 6.2832;
  wp.xyz += uWind * (u * u) * h * 0.09 * aFlame.z;
  wp.x += sin(uTime * 3.1 + s + u * 4.0) * 0.07 * u * h * aFlame.z;
  wp.z += cos(uTime * 2.6 + s * 1.3 + u * 3.0) * 0.07 * u * h * aFlame.z;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */`
uniform float uTime; uniform vec3 uKey, uRim, uBody, uCore;
varying vec2 vUv; varying vec2 vF;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
// a nested tongue's signed width at (x, y): positive inside; s its scale (1 the rim, smaller the inner bands, shorter as they go in)
float tongue(float x, float y, float s, float n, float lick, float seed, float t) {
  float yy = y / s;
  float w = 0.74 * pow(max(0.0, 1.0 - yy), 0.55) * (0.82 + 0.36 * n) * s; // (a fat teardrop's belly)
  w *= 1.0 - 0.34 * smoothstep(0.38, 0.95, yy) * (0.5 + 0.5 * cos(x * (3.2 + 1.2 * seed) / s + lick)); // (its tips splitting and rejoining)
  w *= smoothstep(-0.04, 0.12, y);
  return w - abs(x);
}
void main() {
  float seed = vF.x, ch = vF.y;
  float t = floor(uTime * 12.0) / 12.0 + seed * 17.0; // (boiled on twos: the shape's noise stepped at 12 a real second)
  float y = vUv.y;
  float n = vnoise(vec2(vUv.x * 2.2 + seed * 9.0, y * 2.0 - t * 1.8));
  float bend = (vnoise(vec2(seed * 3.0 + y * 1.6, t * 1.1)) - 0.5) * 0.55 * y;
  float x = vUv.x * 2.0 - 1.0 + bend;
  float lick = t * 2.6 + seed * 6.2832;
  float s0 = tongue(x, y, 1.0, n, lick, seed, t);
  float s1 = tongue(x, y + 0.05, mix(0.84, 0.62, ch), n, lick + 0.6, seed, t) - 0.03;
  float s2 = tongue(x, y + 0.1, mix(0.62, 0.26, ch), n, lick + 1.3, seed, t) - 0.04;
  float aa = max(fwidth(s0), 1e-4);
  float cover = smoothstep(-aa, aa, s0);
  if (cover < 0.01) discard;
  float kw = 0.045 * (1.0 - 0.5 * y);
  vec3 c = uRim;
  c = mix(c, uBody, smoothstep(-aa, aa, s1));
  c = mix(c, uCore, smoothstep(-aa, aa, s2));
  c = mix(uKey, c, smoothstep(kw - aa, kw + aa, s0)); // (the keyline: the rim's own dark round the cut)
  c *= mix(1.0, 0.72, ch);
  gl_FragColor = vec4(c * cover, cover);
}`;

let _mat = null, _geo = null;
/** The one flame program (premultiplied over: its bands cover, the body and core pushed past 1 so the glow takes them). */
export function flameMaterial() {
  return (_mat ||= new THREE.ShaderMaterial({
    name: 'fire-flame', vertexShader: VERT, fragmentShader: FRAG, uniforms: { uTime: FLAME_TIME, uWind: FLAME_WIND,
      uKey: { value: furyAt(FLAME_BANDS.key) }, uRim: { value: furyAt(FLAME_BANDS.rim) }, uBody: { value: furyAt(FLAME_BANDS.body).multiplyScalar(1.35) }, uCore: { value: furyAt(FLAME_BANDS.core).multiplyScalar(1.9) } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
  }));
}
/** Three cards crossed at 60 degrees, a unit wide and tall, standing on y 0 (uv.y up the flame). */
export function flameGeometry() {
  if (_geo) return _geo;
  const pos = [], uv = [], idx = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI, c = Math.cos(a) * 0.5, s = Math.sin(a) * 0.5, v0 = pos.length / 3;
    pos.push(-c, 0, -s, c, 0, s, c, 1, s, -c, 1, -s); uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
  }
  _geo = new THREE.BufferGeometry();
  _geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); _geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); _geo.setIndex(idx);
  return _geo;
}

export class FlameCards {
  constructor(parent, max, name = 'fire.flames') {
    this.max = max;
    const geo = flameGeometry().clone(); // (its own copy: the cards' attribute is this set's)
    this.attr = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); geo.setAttribute('aFlame', this.attr);
    this.mesh = new THREE.InstancedMesh(geo, flameMaterial(), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.count = 0; this.mesh.name = name;
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 6; this.mesh.userData.moodExempt = true;
    parent.add(this.mesh);
  }
  /** Card i standing at x y z, w wide and h tall, turned yaw about the vertical. */
  set(i, x, y, z, w, h, yaw, seed, char = 0, sway = 1) {
    const m = this.mesh.instanceMatrix.array, o = i * 16, c = Math.cos(yaw), s = Math.sin(yaw);
    m[o] = c * w; m[o + 1] = 0; m[o + 2] = -s * w; m[o + 3] = 0; m[o + 4] = 0; m[o + 5] = h; m[o + 6] = 0; m[o + 7] = 0;
    m[o + 8] = s * w; m[o + 9] = 0; m[o + 10] = c * w; m[o + 11] = 0; m[o + 12] = x; m[o + 13] = y; m[o + 14] = z; m[o + 15] = 1;
    const a = this.attr.array, j = i * 4; a[j] = seed; a[j + 1] = char; a[j + 2] = sway; a[j + 3] = 0;
  }
  /** Card i with its height along `ay` (a unit vector) and its width across `ax` (unit, square to ay), its foot at p (arrays or vectors). */
  setBasis(i, ax, ay, p, w, h, seed, char = 0, sway = 0.3) {
    const m = this.mesh.instanceMatrix.array, o = i * 16;
    const zx = ax.y * ay.z - ax.z * ay.y, zy = ax.z * ay.x - ax.x * ay.z, zz = ax.x * ay.y - ax.y * ay.x;
    m[o] = ax.x * w; m[o + 1] = ax.y * w; m[o + 2] = ax.z * w; m[o + 3] = 0; m[o + 4] = ay.x * h; m[o + 5] = ay.y * h; m[o + 6] = ay.z * h; m[o + 7] = 0;
    m[o + 8] = zx * w; m[o + 9] = zy * w; m[o + 10] = zz * w; m[o + 11] = 0; m[o + 12] = p.x; m[o + 13] = p.y; m[o + 14] = p.z; m[o + 15] = 1;
    const a = this.attr.array, j = i * 4; a[j] = seed; a[j + 1] = char; a[j + 2] = sway; a[j + 3] = 0;
  }
  /** The first n cards drawn, their instances sent up once. */
  commit(n) {
    this.mesh.count = Math.min(n, this.max); this.mesh.visible = this.mesh.count > 0;
    if (!this.mesh.count) return;
    const M = this.mesh.instanceMatrix; M.clearUpdateRanges(); M.addUpdateRange(0, this.mesh.count * 16); M.needsUpdate = true;
    this.attr.clearUpdateRanges(); this.attr.addUpdateRange(0, this.mesh.count * 4); this.attr.needsUpdate = true;
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); }
}
