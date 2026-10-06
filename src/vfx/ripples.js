// ---------------------------------------------------------------------------------------
// THE RIPPLE TANK: rings on water where something touches it (the owner, R46: "simple ripples and water wake trails when The Courier is
// swimming"; docs/plans/SUNSHINE.md phase 1). A small height field round the eye, stepped by the wave equation on the GPU, that every
// disturbance of a water surface (`game.water.disturb`: a stroke, a dive, a climb out, the wake) knocks a dent into; the water's shader
// reads its slopes into the surface's normal and glitter and whitens the steepest crests (vfx/water.js). A swimmer faster than the
// rings leaves a V behind, as a boat does: the wake is the rings' own Mach cone, not a drawn line.
//
//   THE FIELD   128 by 128 cells of 0.2 m (25.6 m) round the eye, world-anchored (the window steps a cell at a time, and the field is
//               read across the step, so nothing swims); R the height now, G the height a step ago
//   THE STEP    h' = (2h - h_prev + c^2 laplacian(h)) * damping (the nine-point laplacian, so the rings are round), 60 steps a real
//               second, at most 3 a frame; c sets the rings' speed: about 1.8 m/s on water (a swimmer at 4.5 m/s leaves a V of about 24
//               degrees, near the 19.5 of a boat's), about 1 m/s on Lachryma (it is viscous), chosen by the water nearest the eye
//   A DENT      a disturbance is a soft dent (a gaussian), its size and depth by its kind and strength
//
// Prior art: Hugo Elias's "2D water" (the ripple tank's two-buffer wave step), Super Mario Sunshine's rings round Mario and the
// Blooper's wake, Wind Waker's wake behind the boat, and the ripple render targets of the seventh generation (Uncharted's and
// Crysis's interactive water: a camera-centred height field stamped by what touches it).
//
//   const T = new RippleTank(renderer)   T.disturb(d)   T.update(rawDt, cameraPos, { lachryma })   RIPPLE_U (the water's uniforms)
//   RIPPLE_GLSL: ripSlope(xz) -> vec3(dh/dx, dh/dz, h)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const N = 128, CELL = 0.2, SIZE = N * CELL, HZ = 60, MAX_SPLATS = 12;
// a disturbance's dent: its radius (metres) and its depth, by kind (scaled by its strength)
const DENT = { dive: [0.6, 0.42], land: [0.5, 0.3], drop: [0.3, 0.2], fish: [0.35, 0.22], stroke: [0.35, 0.22], wake: [0.3, 0.16] };

/** The water's side: the tank's uniforms (shared by every water material) and the read. */
export const RIPPLE_U = { uRip: { value: null }, uRipO: { value: new THREE.Vector4(0, 0, SIZE, 0) } };
export const RIPPLE_GLSL = /* glsl */`
uniform sampler2D uRip; uniform vec4 uRipO; // (the field; its window's corner xz, its size in metres, on)
vec3 ripSlope(vec2 xz) {
  if (uRipO.w < 0.5) return vec3(0.0);
  vec2 u = (xz - uRipO.xy) / uRipO.z;
  if (u.x < 0.0 || u.y < 0.0 || u.x > 1.0 || u.y > 1.0) return vec3(0.0);
  float e = ${(1 / N).toFixed(6)}, edge = smoothstep(0.0, 0.08, min(min(u.x, u.y), min(1.0 - u.x, 1.0 - u.y)));
  float hx = texture2D(uRip, u + vec2(e, 0.0)).r - texture2D(uRip, u - vec2(e, 0.0)).r;
  float hz = texture2D(uRip, u + vec2(0.0, e)).r - texture2D(uRip, u - vec2(0.0, e)).r;
  return vec3(hx, hz, texture2D(uRip, u).r) * edge;
}`;

const SIM_V = 'varying vec2 vU; void main() { vU = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const SIM_F = /* glsl */`
uniform sampler2D uState; uniform vec2 uShift; uniform float uC2, uDamp; uniform vec4 uSplat[${MAX_SPLATS}]; uniform int uNS;
varying vec2 vU;
float at(vec2 u) { return (u.x < 0.0 || u.y < 0.0 || u.x > 1.0 || u.y > 1.0) ? 0.0 : texture2D(uState, u).r; }
void main() {
  vec2 u = vU + uShift, e = vec2(${(1 / N).toFixed(6)}, 0.0);
  vec4 s = (u.x < 0.0 || u.y < 0.0 || u.x > 1.0 || u.y > 1.0) ? vec4(0.0) : texture2D(uState, u);
  vec2 f = vec2(e.x, e.x), g = vec2(e.x, -e.x);
  float lap = (4.0 * (at(u + e.xy) + at(u - e.xy) + at(u + e.yx) + at(u - e.yx)) + at(u + f) + at(u - f) + at(u + g) + at(u - g) - 20.0 * s.r) / 6.0; // (the nine-point stencil: round rings, not diamonds)
  float h = (2.0 * s.r - s.g + uC2 * lap) * uDamp;
  for (int i = 0; i < ${MAX_SPLATS}; i++) {
    if (i >= uNS) break;
    vec4 p = uSplat[i]; vec2 d = (vU - p.xy) / p.z;
    h -= p.w * exp(-dot(d, d));                       // (a dent where it was touched: it springs back as a ring)
  }
  gl_FragColor = vec4(clamp(h, -4.0, 4.0), s.r, 0.0, 1.0);
}`;

export class RippleTank {
  constructor(renderer) {
    this.r = renderer;
    const rt = () => new THREE.WebGLRenderTarget(N, N, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false });
    this.rts = [rt(), rt()]; this.i = 0;
    this.u = { uState: { value: null }, uShift: { value: new THREE.Vector2() }, uC2: { value: 0.0625 }, uDamp: { value: 0.988 },
      uSplat: { value: Array.from({ length: MAX_SPLATS }, () => new THREE.Vector4()) }, uNS: { value: 0 } };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ name: 'ripple-step', uniforms: this.u, vertexShader: SIM_V, fragmentShader: SIM_F, depthTest: false, depthWrite: false }));
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.ox = null; this.oz = null; this.acc = 0; this.queue = []; this.live = 0; this.cleared = false;
    RIPPLE_U.uRip.value = this.rts[0].texture;
  }

  /** A disturbance ({ x, z, s, kind }): a dent knocked into the field at the next step. */
  disturb(d) { if (this.queue.length < 32) this.queue.push(d); this.live = 6; } // (the field runs for 6 real seconds after the last touch)

  update(raw, cam, { lachryma = false } = {}) {
    if (this.live <= 0) { RIPPLE_U.uRipO.value.w = 0; this.queue.length = 0; this.cleared = false; return; } // (still water: nothing stepped, nothing read; cleared before it runs again)
    this.live -= raw;
    if (!this.cleared) { this.clear(); this.cleared = true; }
    // the window, a cell at a time round the eye
    const ox = Math.floor(cam.x / CELL) * CELL - SIZE / 2, oz = Math.floor(cam.z / CELL) * CELL - SIZE / 2;
    if (this.ox === null) { this.ox = ox; this.oz = oz; }
    this.u.uC2.value = lachryma ? 0.0064 : 0.0225; this.u.uDamp.value = lachryma ? 0.994 : 0.992; // (c 0.08 or 0.15 cells a step: 1 or 1.8 m/s)
    this.acc = Math.min(this.acc + raw, 3 / HZ);
    let first = true;
    while (this.acc >= 1 / HZ) {
      this.acc -= 1 / HZ;
      this.u.uShift.value.set(first ? (ox - this.ox) / SIZE : 0, first ? (oz - this.oz) / SIZE : 0);
      if (first) { this.ox = ox; this.oz = oz; }
      const n = first ? Math.min(MAX_SPLATS, this.queue.length) : 0;
      for (let k = 0; k < n; k++) {
        const d = this.queue.shift(), [rad, depth] = DENT[d.kind] || DENT.stroke;
        this.u.uSplat.value[k].set((d.x - this.ox) / SIZE, (d.z - this.oz) / SIZE, rad / SIZE, depth * (0.4 + 0.6 * (d.s ?? 0.5)));
      }
      this.u.uNS.value = n; first = false;
      this.step();
    }
    RIPPLE_U.uRipO.value.set(this.ox, this.oz, SIZE, 1);
  }

  step() {
    const src = this.rts[this.i], dst = this.rts[1 - this.i], prev = this.r.getRenderTarget();
    this.u.uState.value = src.texture;
    this.r.setRenderTarget(dst); this.r.render(this.scene, this.cam); this.r.setRenderTarget(prev);
    this.i = 1 - this.i; RIPPLE_U.uRip.value = dst.texture;
  }

  clear() {
    const prev = this.r.getRenderTarget(), col = this.r.getClearColor(new THREE.Color()), a = this.r.getClearAlpha();
    this.r.setClearColor(0x000000, 0);
    for (const t of this.rts) { this.r.setRenderTarget(t); this.r.clear(true, false, false); }
    this.r.setClearColor(col, a); this.r.setRenderTarget(prev);
  }

  dispose() { for (const t of this.rts) t.dispose(); this.quad.geometry.dispose(); this.quad.material.dispose(); }
}
