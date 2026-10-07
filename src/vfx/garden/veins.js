// ---------------------------------------------------------------------------------------
// SPIRIT VEINS: the rivers of light between the garden's planetoids (the owner, 2026-10-07; docs/plans/SPIRIT-GARDEN.md section 3: "spirit
// veins glowing between the planetoids like rivers of light"). In xianxia a spirit vein is the qi running under a sect's mountains; here
// they are the Lachryma running between the worlds of your inner garden, so they show what joins what, and they flow.
//
//   A VEIN   a soft ribbon of light hung between two planetoids, sagging as a rope of water would, its light running along it in slow
//            pulses (toward `b`), brightest at its heart; `set({ k })` its strength (a vein the hand has fed or a formation it serves)
//
// Prior art: the dragon veins (longmai) of feng shui and the spirit veins of cultivation fiction, Super Mario Galaxy's star bits and
// pull-star paths between planets, and Dual Hearts' bridges of light.
//
//   const V = new SpiritVein(a, b, { color, sag })   scene.add(V.mesh)   V.set({ k })   V.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VEIN_V = /* glsl */`varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const VEIN_F = /* glsl */`varying vec2 vU; uniform float uT, uK; uniform vec3 uC;
void main() {
  float across = 1.0 - abs(vU.y * 2.0 - 1.0), core = pow(across, 3.0);
  float pulse = 0.5 + 0.5 * sin(vU.x * 40.0 - uT * 2.2), pulse2 = 0.5 + 0.5 * sin(vU.x * 13.0 - uT * 0.9 + 1.3);
  float ends = smoothstep(0.0, 0.06, vU.x) * smoothstep(1.0, 0.94, vU.x);
  float a = ends * (core * (0.45 + 0.4 * pulse * pulse2) + across * 0.12) * uK;
  gl_FragColor = vec4(uC * (0.5 + 0.8 * core), a * 0.6);                // (low and soft: the scene is linear)
}`;

export class SpiritVein {
  constructor(a, b, { color = 0x9ae8d8, sag = 0.18, width = 2.4 } = {}) {
    this.u = { uT: { value: 0 }, uK: { value: 1 }, uC: { value: new THREE.Color(color) } };
    const mid = a.clone().lerp(b, 0.5); mid.y -= a.distanceTo(b) * sag;
    const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
    // a ribbon, twisted to stay broad to the eye from most ways (two crossed strips)
    const N = 48, pos = [], uv = [], idx = [];
    for (const tw of [0, Math.PI / 2]) {
      const o = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const t = i / N, p = curve.getPoint(t), tan = curve.getTangent(t), side = _s.crossVectors(tan, _up).normalize().applyAxisAngle(tan, tw).multiplyScalar(width * 0.5);
        pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z); uv.push(t, 0, t, 1);
        if (i < N) { const k = o + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'spirit-vein', uniforms: this.u, vertexShader: VEIN_V, fragmentShader: VEIN_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.mesh.name = 'spirit-vein'; this.curve = curve;
  }
  set({ k = this.u.uK.value } = {}) { this.u.uK.value = k; }
  update(raw = 1 / 60) { this.u.uT.value += raw; }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
const _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
