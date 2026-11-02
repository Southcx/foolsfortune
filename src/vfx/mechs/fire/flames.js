// ---------------------------------------------------------------------------------------
// A FLAME CARD (plain name; the city's fire's look, vfx/mechs/fire/): three crossed cards standing on a burning cell, drawn in one
// shared flame program: two octaves of scrolled value noise eat a tongue's edge as it rises, its heat read down a gradient from a
// white-hot core through orange and ember to a soot tip, the whole leaning with the wind and swaying on its own seed. Every card in
// the city is one instance of one InstancedMesh; its life is worked out in the shader from the clock (`FLAME_TIME`), so a frame costs
// one uniform, and the CPU writes an instance only when the burning set changes (set, then commit). Premultiplied: the flame adds
// light (order free), its soot darkens what is behind it.
// Used for the city's cells (vfx/mechs/fire/index.js), the straw giant's seams (bodies.js) and the flamer's cone (flamer.js), each
// its own FlameCards, one material.
// Prior art: the crossed-card fire of every sixth-generation game (Ico's torches, Shadow of the Colossus's braziers, Godzilla: Save
// the Earth's burning city), the scrolled-noise flame shader (Inigo Quilez's value noise, the "fire" Shadertoys), Far Cry 2's
// flame a fuel's size.
//
//   FLAME_TIME (the shared uniform: { value } real s)   flameMaterial()   flameGeometry()
//   const F = new FlameCards(parent, max, name)   F.set(i, x, y, z, w, h, yaw, seed, char)   F.setBasis(i, ax, ay, p, w, h, seed, char)
//   F.commit(n)   F.mesh   F.dispose()   FLAME_WIND (the shared wind, world m/s: a Vector3 to copy into)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

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
uniform float uTime;
varying vec2 vUv; varying vec2 vF;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { return 0.6 * vnoise(p) + 0.3 * vnoise(p * 2.1 + 3.7) + 0.1 * vnoise(p * 4.3 - 1.3); }
void main() {
  float x = vUv.x * 2.0 - 1.0, y = vUv.y, t = uTime * 1.7 + vF.x * 17.0;
  float n = fbm(vec2(vUv.x * 2.6 + vF.x * 9.0, y * 2.2 - t));
  float n2 = fbm(vec2(vUv.x * 5.0 - vF.x * 5.0, y * 4.2 - t * 1.6));
  float w = (0.2 + 0.8 * (1.0 - y)) * (0.62 + 0.62 * n);
  float d = abs(x + (n2 - 0.5) * 0.7 * y);
  float body = (1.0 - smoothstep(w * 0.45, w, d)) * smoothstep(0.0, 0.1, y);
  float heat = clamp(body * (1.25 - y * (1.35 - 0.7 * n)) * 1.5, 0.0, 1.0);
  vec3 c = mix(vec3(0.45, 0.05, 0.01), vec3(1.0, 0.34, 0.05), smoothstep(0.1, 0.45, heat));
  c = mix(c, vec3(1.0, 0.72, 0.24), smoothstep(0.45, 0.78, heat));
  c = mix(c, vec3(1.0, 0.9, 0.7), smoothstep(0.9, 1.0, heat));
  float ch = vF.y, light = smoothstep(0.04, 0.3, heat) * (1.0 + 1.6 * smoothstep(0.35, 1.0, heat)) * mix(1.0, 0.5, ch);
  float soot = body * (1.0 - smoothstep(0.0, 0.35, heat)) * smoothstep(0.35, 0.95, y) * (0.55 + 0.35 * ch);
  float a = body * light;
  if (a + soot < 0.01) discard;
  gl_FragColor = vec4(c * a, soot);
}`;

let _mat = null, _geo = null;
/** The one flame program (premultiplied: rgb added, alpha the soot's cover). */
export function flameMaterial() {
  return (_mat ||= new THREE.ShaderMaterial({
    name: 'fire-flame', vertexShader: VERT, fragmentShader: FRAG, uniforms: { uTime: FLAME_TIME, uWind: FLAME_WIND },
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
