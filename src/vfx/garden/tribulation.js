// ---------------------------------------------------------------------------------------
// THE HEAVENLY KILN: the tribulation's sky over the Meditation Peak (the owner, 2026-10-07: the full build, Round 4; docs/plans/
// SPIRIT-GARDEN.md section 6: "the Jar on the peak's mat, lightning from a darkening sky, each strike outlined"; Espada's name: the
// tribulation is the Heavenly Kiln). A Firing is the soul refired, so the sky over the Peak becomes a kiln seen from inside its chamber:
//
//   THE OPENING  open(k): the sky darkens round the Peak and a vortex of cloud turns overhead, its eye glowing with a kiln's fire (deep
//                red to the white of the hottest firing as k rises); the garden's dome is darkened by the caller (GardenSky.set night)
//   A STRIKE     bolt(to, eta): the bolt's path is traced first, a faint flickering thread from the eye to where it will land (the read:
//                it can be dodged by a hop, or sent back by the hand's flick; the parry's outline is put on `B.mesh` by the caller), and
//                at eta it STRIKES: the bolt full and white, a flash, then it fades
//   THE CLOSING  open(0): the clouds thin and the fire dies back to the garden's sky
//
// Prior art: the heavenly tribulation of xianxia fiction (the clouds gathering over a cultivator breaking through, the lightning in
// waves), the anagama kiln's firebox and its colour of heat (red, orange, yellow, white: the potter's pyrometry by eye), Okami's
// celestial brush lightning, and the Zelda boss's telegraphed strike line.
//
//   THE RING     where it will land, a ring of the kiln's fire on the mat, closing from twice its size to its own as the strike nears
//                (Bayonetta's ring read before the blow); in the flick's window (`flick` seconds before) it burns gold; at the strike a
//                ring of white heat runs out over the mat and is gone
//
//   const K = new HeavenlyKiln({ height })   K.group (at the Peak's top, +Y up)   K.open(k)   const B = K.bolt(toWorld, eta, { r, flick, up })
//   K.update(rawDt)   (B.mesh: outline it; B.ring: its ring on the mat)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VORTEX_F = /* glsl */`varying vec2 vU; uniform float uK, uT;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
vec3 heat(float k) { return k < 0.33 ? mix(vec3(0.5, 0.04, 0.02), vec3(1.0, 0.35, 0.05), k / 0.33) : k < 0.66 ? mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.8, 0.3), (k - 0.33) / 0.33) : mix(vec3(1.0, 0.8, 0.3), vec3(1.0, 0.97, 0.9), (k - 0.66) / 0.34); }
void main() {
  vec2 p = vU * 2.0 - 1.0; float r = length(p), a = atan(p.y, p.x);
  float swirl = n(vec2(a * 3.0 + r * 6.0 - uT * 0.5, r * 4.0 - uT * 0.2)) * 0.6 + n(vec2(a * 7.0 + r * 12.0 - uT, r * 9.0)) * 0.4;
  vec3 cloud = mix(vec3(0.05, 0.04, 0.07), vec3(0.22, 0.18, 0.26), swirl);                         // (the storm's cloud, turning in)
  float eye = 1.0 - smoothstep(0.05, 0.35, r);
  vec3 c = mix(cloud, heat(uK) * (0.6 + 0.4 * swirl), eye * smoothstep(0.0, 0.2, uK));               // (the kiln's fire in its eye)
  float a2 = smoothstep(1.0, 0.6, r) * smoothstep(0.0, 0.15, uK);
  gl_FragColor = vec4(c, a2 * (0.75 + 0.25 * swirl));
}`;

export class HeavenlyKiln {
  constructor({ height = 40, radius = 60 } = {}) {
    this.group = new THREE.Group(); this.group.name = 'heavenly-kiln'; this.t = 0; this.k = 0; this.to = 0; this.H = height;
    this.u = { uK: { value: 0 }, uT: { value: 0 } };
    this.vortex = new THREE.Mesh(new THREE.CircleGeometry(radius, 48).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ name: 'kiln-vortex', uniforms: this.u, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: VORTEX_F }));
    this.vortex.position.y = height; this.vortex.visible = false; this.vortex.frustumCulled = false; this.group.add(this.vortex);
    this.bolts = [];
  }
  /** How far open the kiln is: 0 closed .. 1 the hottest firing (eased toward). */
  open(k) { this.to = THREE.MathUtils.clamp(k, 0, 1); }
  /** A bolt from the eye to `to` (world), striking in `eta` real seconds; returns { mesh, done } (the caller outlines `mesh`). */
  bolt(to, eta = 1.2, { r = 1.5, flick = 0.45, up = null } = {}) {
    const B = { to: to.clone(), eta, t: 0, mesh: new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xfff4e0, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })), done: false, seed: Math.random() * 100 };
    B.mesh.name = 'kiln-bolt'; B.mesh.frustumCulled = false; this.group.add(B.mesh); this.bolts.push(B); this.shape(B);
    // the ring on the mat where it will land, lying on the ground's own up there
    B.r = r; B.flick = flick; B.ringMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    B.ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2), B.ringMat); B.ring.name = 'kiln-ring'; B.ring.frustumCulled = false;
    this.group.worldToLocal(B.ring.position.copy(to)); if (up) B.ring.quaternion.setFromUnitVectors(_y, _c.copy(up).transformDirection(_m.copy(this.group.matrixWorld).invert()).normalize());
    B.ring.position.addScaledVector(B.ring.up.clone().applyQuaternion(B.ring.quaternion), 0.04); this.group.add(B.ring);
    return B;
  }
  shape(B) { // a jagged ribbon from the eye down to its mark (new each flicker)
    this.group.updateWorldMatrix(true, false); const from = this.group.localToWorld(_a.set(0, this.H, 0)), to = this.group.worldToLocal(_b.copy(B.to)), f0 = this.group.worldToLocal(from.clone());
    const N = 14, pos = [], idx = [], w = B.t >= B.eta ? 0.35 : 0.06;
    for (let i = 0; i <= N; i++) {
      const s = i / N, p = f0.clone().lerp(to, s), j = (i === 0 || i === N) ? 0 : 1; p.x += (rnd(B.seed + i + Math.floor(this.t * 20)) - 0.5) * 2.4 * j; p.z += (rnd(B.seed * 2 + i + Math.floor(this.t * 20)) - 0.5) * 2.4 * j;
      pos.push(p.x - w, p.y, p.z, p.x + w, p.y, p.z); if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    B.mesh.geometry.dispose(); B.mesh.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); B.mesh.geometry.setIndex(idx);
  }

  update(raw = 1 / 60) {
    this.t += raw; this.k += (this.to - this.k) * Math.min(1, raw * 1.2); this.u.uK.value = this.k; this.u.uT.value = this.t; this.vortex.visible = this.k > 0.01;
    for (const B of this.bolts) {
      B.t += raw; const struck = B.t >= B.eta;
      if (Math.floor(B.t * 20) !== B.flick) { B.flick = Math.floor(B.t * 20); this.shape(B); }
      const left = B.eta - B.t, inFlick = left <= B.flick && !struck; // (the ring closes on its mark; gold in the flick's window; at the strike, a ring of heat runs out)
      if (!struck) { B.ring.scale.setScalar(B.r * (1 + Math.max(0, left / B.eta))); B.ringMat.color.setHex(inFlick ? 0xffd76a : 0xff7a2a); B.ringMat.opacity = 0.35 + 0.5 * (1 - left / B.eta); }
      else { const s = (B.t - B.eta) / 0.35; B.ring.scale.setScalar(B.r * (1 + 2.5 * s)); B.ringMat.color.setHex(0xfff4e0); B.ringMat.opacity = Math.max(0, 0.9 * (1 - s)); }
      B.mesh.material.opacity = struck ? Math.max(0, 1 - (B.t - B.eta) / 0.35) : 0.12 + 0.18 * Math.random() * (B.t / B.eta); // (the trace flickers, then the strike, then gone)
      if (struck && B.t - B.eta > 0.35) { B.done = true; this.group.remove(B.mesh, B.ring); B.mesh.geometry.dispose(); B.mesh.material.dispose(); B.ring.geometry.dispose(); B.ringMat.dispose(); }
    }
    this.bolts = this.bolts.filter((B) => !B.done);
  }
  dispose() { this.group.parent?.remove(this.group); this.vortex.geometry.dispose(); this.vortex.material.dispose(); for (const B of this.bolts) { B.mesh.geometry.dispose(); B.mesh.material.dispose(); } }
}
function rnd(x) { return (Math.sin(x * 12.9898) * 43758.5453) % 1 + (Math.sin(x * 12.9898) * 43758.5453 < 0 ? 1 : 0); }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _m = new THREE.Matrix4();
