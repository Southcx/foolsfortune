// ---------------------------------------------------------------------------------------
// THE LACHRYMATO BOTTLE (placeholder model; the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4.6): the Soul Brush's reserve
// of Lachryma, worn on the upper back in a place of its own. An aquarium of a bottle: a rounded block of clear glass, thick at the
// edges, an opaque glazed stopper with a brass collar on top, and the Lachryma inside, sloshing.
//
//   THE GLASS     clear, faintly green at its thick edges (where light travels through more of it), a sharp highlight
//   THE LACHRYMA  ink with its oil film (liquid.js's colours); its surface is a plane through the fill level that TILTS against what the
//                 Courier's body does (a spring: lag, overshoot, settle) and ripples a little while it moves; seen from above, the
//                 surface is the film
//   THE SIZES     small, medium, large (40, 80, 120 Lachryma held): the same bottle, larger
//   CRACKED       a broken shield cracks it: a star of pale cracks across the face (the spill itself is a stain: vfx/stains.js)
//
// Prior art: the potion bottles of every RPG's belt (Dark Souls' Estus flask, Bloodborne's vials), the Splatoon ink tank on the
// player's back (a gauge you read off the body: how full it is, in the tank itself), and the liquid-in-glass trick of game shaders (the
// liquid is a mesh cut by a plane whose normal springs with the bottle's motion; its back faces painted as the surface).
//
//   const B = new LachrymatoBottle({ size })   B.group   B.set({ fill: 0..1, crack: bool })   B.update(rawDt, accelWorld?)
//   B.mount(character)  (on the upper back: the spine's top bone, clear of the tools worn across the back)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BOTTLE_SHAPES = { small: { w: 0.15, h: 0.19, d: 0.075 }, medium: { w: 0.18, h: 0.24, d: 0.085 }, large: { w: 0.21, h: 0.3, d: 0.095 } }; // (metres; what each holds is BOTTLES', progress/brushload.js)

const LIQ_V = /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main() { vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LIQ_F = /* glsl */`uniform vec3 uPlane; uniform float uLevel, uT, uWave; varying vec3 vP; varying vec3 vN; varying vec3 vW;
vec3 film(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
void main() {
  float wave = uWave * sin(vP.x * 60.0 + uT * 9.0) * sin(vP.z * 50.0 - uT * 7.0);
  if (dot(vP, uPlane) > uLevel + wave) discard;                          // (above the surface: empty glass)
  vec3 V = normalize(cameraPosition - vW);
  if (!gl_FrontFacing) {                                                  // (a back face seen through the cut: the surface, from above)
    float f = vP.x * 9.0 + vP.z * 7.0 + uT * 0.05;
    gl_FragColor = vec4(vec3(0.006, 0.005, 0.01) + film(f) * 0.12, 1.0);
  } else {
    float ndv = abs(dot(normalize(vN), V)), rim = pow(1.0 - ndv, 2.0);
    gl_FragColor = vec4(vec3(0.004, 0.003, 0.007) + film(rim * 1.3 + vP.y * 4.0 + uT * 0.04) * (0.015 + 0.3 * rim * rim), 1.0); // (ink; its film only at the turn)
  }
  #include <colorspace_fragment>
}`;

const GLASS_F = /* glsl */`uniform float uCrack; varying vec3 vP; varying vec3 vN; varying vec3 vW;
float crack(vec2 p) { // (a star of cracks from a point on the face: a few jagged rays)
  float a = atan(p.y, p.x), r = length(p), c = 0.0;
  for (int i = 0; i < 7; i++) { float ai = float(i) * 0.897 + 0.3; float d = abs(sin(a - ai + 0.15 * sin(r * 70.0 + float(i)))) * r; c = max(c, (1.0 - smoothstep(0.0012, 0.0035, d)) * (1.0 - smoothstep(0.03, 0.11 - 0.012 * float(i), r))); }
  return c;
}
void main() {
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float ndv = abs(dot(N, V)), edge = pow(1.0 - ndv, 3.0);
  vec3 L = normalize(vec3(0.35, 0.9, 0.3)), H = normalize(L + V);
  float sp = pow(max(dot(N, H), 0.0), 120.0);
  vec3 c = mix(vec3(0.85, 0.95, 0.92), vec3(0.55, 0.8, 0.7), edge);       // (clear, greener where the light crosses more glass)
  float a = 0.025 + 0.6 * edge + sp;                                        // (the scene is linear: a little glass goes a long way)
  float k = uCrack > 0.5 ? crack(vP.xy - vec2(0.02, 0.03)) : 0.0;
  gl_FragColor = vec4(c + sp + k, clamp(a + k * 0.8, 0.0, 1.0));
  #include <colorspace_fragment>
}`;

export class LachrymatoBottle {
  constructor({ size = 'medium' } = {}) {
    const S = (this.spec = BOTTLE_SHAPES[size] || BOTTLE_SHAPES.medium), { w, h, d } = S;
    this.group = new THREE.Group(); this.group.name = `lachrymato-${size}`;
    // the Lachryma: a rounded block a little inside the glass, cut by its surface
    this.u = { uPlane: { value: new THREE.Vector3(0, 1, 0) }, uLevel: { value: 0 }, uT: { value: 0 }, uWave: { value: 0 } };
    const liq = new THREE.Mesh(new RoundedBoxGeometry(w - 0.014, h - 0.014, d - 0.014, 3, 0.02), new THREE.ShaderMaterial({ name: 'bottle-lachryma', uniforms: this.u, vertexShader: LIQ_V, fragmentShader: LIQ_F, side: THREE.DoubleSide }));
    liq.position.y = h / 2; this.group.add(liq); this.liq = liq;
    // the glass
    this.gu = { uCrack: { value: 0 } };
    const glass = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.026), new THREE.ShaderMaterial({ name: 'bottle-glass', uniforms: this.gu, vertexShader: LIQ_V, fragmentShader: GLASS_F, transparent: true, depthWrite: false }));
    glass.position.y = h / 2; glass.renderOrder = 3; this.group.add(glass);
    // the stopper: a brass collar, a glazed cap, a knob
    const brass = new THREE.MeshStandardMaterial({ name: 'bottle-brass', color: 0xc8963c, metalness: 0.85, roughness: 0.35 });
    const glaze = new THREE.MeshStandardMaterial({ name: 'bottle-cap', color: 0x2f5a62, roughness: 0.3 }); // (a celadon-teal glaze, the potters')
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.2, w * 0.24, 0.025, 16), brass); neck.position.y = h + 0.012; this.group.add(neck);
    const cap = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0], [w * 0.26, 0], [w * 0.28, 0.02], [w * 0.22, 0.045], [w * 0.1, 0.055], [0.001, 0.058]].map(([r, y]) => new THREE.Vector2(r, y)), 18), glaze);
    cap.position.y = h + 0.024; this.group.add(cap);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(w * 0.07, 10, 8), brass); knob.position.y = h + 0.086; this.group.add(knob);
    // the slosh: the surface's tilt (x, z, in the bottle's frame) on a spring
    this.tilt = new THREE.Vector2(); this.tv = new THREE.Vector2(); this.fill = 1; this.t = 0;
    this.set({ fill: 1 });
  }

  /** How full (0..1 of what it holds) and whether it is cracked. */
  set({ fill = this.fill, crack = this.crack } = {}) {
    this.fill = THREE.MathUtils.clamp(fill, 0, 1); this.crack = !!crack;
    this.gu.uCrack.value = this.crack ? 1 : 0;
    const h = this.spec.h - 0.014; this.u.uLevel.value = -h / 2 + h * (0.04 + 0.92 * this.fill) + (this.fill <= 0 ? -1 : 0);
  }

  /** accelWorld: the body's acceleration (m/s^2); the surface leans away from it, and swings back. */
  update(raw = 1 / 60, accelWorld = null) {
    this.t += raw; this.u.uT.value = this.t;
    let ax = 0, az = 0;
    if (accelWorld) {
      _q.copy(this.group.getWorldQuaternion(_q)).invert(); _a.copy(accelWorld).applyQuaternion(_q);
      ax = _a.x; az = _a.z;
    }
    // a damped spring toward the lean the acceleration asks (a little under the angle the push makes)
    const k = 60, c = 5.5, s = 0.035;
    this.tv.x += (-(k) * this.tilt.x - c * this.tv.x - ax * s * k) * raw; this.tv.y += (-(k) * this.tilt.y - c * this.tv.y - az * s * k) * raw;
    this.tilt.x += this.tv.x * raw; this.tilt.y += this.tv.y * raw;
    this.tilt.clampLength(0, 0.6);
    this.u.uPlane.value.set(this.tilt.x, 1, this.tilt.y).normalize();
    this.u.uWave.value = Math.min(0.004, this.tv.length() * 0.0015);
  }

  /** Worn on the upper back: on the spine's top bone, close against it, between the shoulder blades and above the tools worn there. */
  mount(character, { offset = new THREE.Vector3(0, -0.08, -0.11), tilt = -0.12 } = {}) {
    const b = character?.bones?.spine003 || character?.bones?.spine002; if (!b) return false;
    b.add(this.group); this.group.position.copy(offset); this.group.rotation.set(tilt, 0, 0);
    return true;
  }

  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); }
}
const _q = new THREE.Quaternion(), _a = new THREE.Vector3();
