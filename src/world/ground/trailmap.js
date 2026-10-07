// ---------------------------------------------------------------------------------------
// TRAIL MAP: a small, fading, top-down record of where things have passed, kept in a texture
// that follows a focus point. Surfaces sample it to show a path: sand darkens and grooves,
// snow packs, grass lies down, water wakes.
//
// Prior art, and what was taken from it:
//  - Journey (thatgamecompany, "Sand Rendering in Journey", GDC/SIGGRAPH 2012): footprints and
//    trails are not decals or geometry, they are written into a ripple height/normal layer of the
//    sand, and the wind slowly smooths them away. So here: one channel of "disturbed", faded
//    over time, read back as a shading + normal term (no UV scrolling anywhere).
//  - Deformable snow / sand in Horizon Zero Dawn, Assassin's Creed III, God of War (render-to-
//    texture "trail maps" around the camera, ping-ponged, stamped by the things that touch the
//    ground): a fixed-size window that is re-centred on the player in whole texels so the stored
//    marks never swim, with the old contents shifted across.
//  - Decal footprints (e.g. the UE4 write-ups) were the alternative: rejected, since overlapping
//    decals stack up badly and each one is an object to manage.
//
// Use:
//   const trail = new TrailMap(renderer, { size: 96, res: 512, life: 24 });
//   trail.stamp(ax, az, bx, bz, radius, strength)    // any time before update: a capsule
//   trail.update(dt, focusX, focusZ)                 // once a frame
//   trail.uniforms                                   // { uTrail, uTrailCenter, uTrailSize, uTrailTexel } for a material
//   TRAIL_GLSL                                       // the GLSL that reads it (see below)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const MAX = 24; // segments per frame

const vs = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const fs = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uOld;
uniform vec2 uShift;      // texels' worth of window motion, in uv
uniform float uDecay;     // multiplier this frame
uniform float uSink;      // subtracted this frame (so marks reach zero)
uniform vec2 uOrigin;     // world x, z of the window's lower-left corner
uniform float uSize;      // metres across
uniform int uCount;
uniform vec4 uSeg[${MAX}];  // a.xz, b.xz
uniform vec2 uPar[${MAX}];  // radius, strength
void main() {
  vec2 uvOld = vUv + uShift;
  float old = (uvOld.x < 0.0 || uvOld.x > 1.0 || uvOld.y < 0.0 || uvOld.y > 1.0) ? 0.0 : texture2D(uOld, uvOld).r;
  float v = max(0.0, old * uDecay - uSink);
  vec2 w = uOrigin + vUv * uSize;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec2 a = uSeg[i].xy, b = uSeg[i].zw, ab = b - a;
    float l2 = dot(ab, ab);
    float t = l2 > 1e-6 ? clamp(dot(w - a, ab) / l2, 0.0, 1.0) : 0.0;
    float d = length(w - (a + ab * t));
    float r = uPar[i].x;
    float m = uPar[i].y * (1.0 - smoothstep(r * 0.55, r, d));
    v = max(v, m);
  }
  gl_FragColor = vec4(v, 0.0, 0.0, 1.0);
}`;

export class TrailMap {
  constructor(renderer, { size = 96, res = 512, life = 24 } = {}) {
    this.renderer = renderer;
    this.size = size; this.res = res; this.life = life;
    this.texel = size / res;
    const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
    this.rt = [new THREE.WebGLRenderTarget(res, res, opts), new THREE.WebGLRenderTarget(res, res, opts)];
    this.cur = 0;
    this.origin = new THREE.Vector2(1e9, 1e9); // (lower-left corner in world x, z; snapped to texels)
    this.segs = [];
    this.uniforms = {
      uTrail: { value: this.rt[0].texture },
      uTrailCenter: { value: new THREE.Vector2() },
      uTrailSize: { value: size },
      uTrailTexel: { value: 1 / res },
    };
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vs, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: {
        uOld: { value: null }, uShift: { value: new THREE.Vector2() }, uDecay: { value: 1 }, uSink: { value: 0 },
        uOrigin: { value: new THREE.Vector2() }, uSize: { value: size }, uCount: { value: 0 },
        uSeg: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) },
        uPar: { value: Array.from({ length: MAX }, () => new THREE.Vector2()) },
      },
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    this.quad = new THREE.Mesh(g, this.mat);
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.clear();
  }

  /** Forget everything (a teleport, leaving the layer). */
  clear() {
    const r = this.renderer, prev = r.getRenderTarget();
    const col = new THREE.Color(); r.getClearColor(col); const a = r.getClearAlpha();
    r.setClearColor(0x000000, 1);
    for (const t of this.rt) { r.setRenderTarget(t); r.clear(true, false, false); }
    r.setRenderTarget(prev); r.setClearColor(col, a);
    this.origin.set(1e9, 1e9);
    this.segs.length = 0;
  }

  /** A capsule from a to b (world x, z) of the given radius, at strength 0..1. */
  stamp(ax, az, bx, bz, radius, strength = 1) {
    if (this.segs.length < MAX) this.segs.push([ax, az, bx, bz, radius, strength]);
  }

  update(dt, fx, fz) {
    const T = this.size, tex = this.texel;
    // the window, snapped to whole texels so nothing swims
    const ox = Math.round((fx - T / 2) / tex) * tex, oz = Math.round((fz - T / 2) / tex) * tex;
    let sx = 0, sz = 0;
    if (Math.abs(this.origin.x) > 1e8 || Math.abs(ox - this.origin.x) > T * 0.9 || Math.abs(oz - this.origin.y) > T * 0.9) { this.clearOnly(); }
    else { sx = (ox - this.origin.x) / T; sz = (oz - this.origin.y) / T; }
    const M = this.mat.uniforms;
    M.uOld.value = this.rt[this.cur].texture;
    M.uShift.value.set(sx, sz);
    M.uDecay.value = Math.exp(-dt * 1.5 / this.life);
    M.uSink.value = dt * 0.35 / this.life;
    M.uOrigin.value.set(ox, oz);
    const n = this.segs.length;
    M.uCount.value = n;
    for (let i = 0; i < n; i++) {
      const s = this.segs[i];
      M.uSeg.value[i].set(s[0], s[1], s[2], s[3]);
      M.uPar.value[i].set(s[4], s[5]);
    }
    this.segs.length = 0;
    const r = this.renderer, prev = r.getRenderTarget(), prevClip = r.clippingPlanes, prevAuto = r.autoClear;
    const next = 1 - this.cur;
    r.clippingPlanes = []; r.autoClear = false;
    r.setRenderTarget(this.rt[next]);
    r.render(this.scene, this.cam);
    r.setRenderTarget(prev); r.clippingPlanes = prevClip; r.autoClear = prevAuto;
    this.cur = next;
    this.origin.set(ox, oz);
    this.uniforms.uTrail.value = this.rt[next].texture;
    this.uniforms.uTrailCenter.value.set(ox, oz); // (the lower-left corner; named for the material's use)
  }

  clearOnly() {
    const r = this.renderer, prev = r.getRenderTarget();
    r.setClearColor(0x000000, 1);
    for (const t of this.rt) { r.setRenderTarget(t); r.clear(true, false, false); }
    r.setRenderTarget(prev);
  }

  dispose() { for (const t of this.rt) t.dispose(); this.mat.dispose(); }
}

/** GLSL to read a trail map in a material: trail(worldXZ) -> 0..1, trailGrad(worldXZ) -> the slope of it (a vec2 in world x, z). */
export const TRAIL_GLSL = `
uniform sampler2D uTrail; uniform vec2 uTrailCenter; uniform float uTrailSize; uniform float uTrailTexel;
float trailAt(vec2 w) {
  vec2 uv = (w - uTrailCenter) / uTrailSize;
  vec2 e = smoothstep(0.0, 0.06, uv) * (1.0 - smoothstep(0.94, 1.0, uv));
  return texture2D(uTrail, uv).r * e.x * e.y;
}
vec2 trailGrad(vec2 w) {
  float d = uTrailTexel * uTrailSize * 1.5;
  return vec2(trailAt(w + vec2(d, 0.0)) - trailAt(w - vec2(d, 0.0)), trailAt(w + vec2(0.0, d)) - trailAt(w - vec2(0.0, d))) / (2.0 * d);
}`;
