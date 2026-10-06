// ---------------------------------------------------------------------------------------
// A SOLAR RING: the Solar Skiffing trial's gate (docs/plans/DUNES.md; Dovina's rule: a ring is charged by the sun, and a ring in shade is
// dark and does not count). Read at speed from a skiff: LIT is a hoop of the sun's gold, its light running round it; DARK is ash-grey
// stone, dull; the NEXT ring lit pulses brighter (where to steer); PASSED flares once and fades.
//
// Prior art: Superman 64's rings and Pilotwings' hoops (the course drawn in the air), Sonic's rings as a line to follow, Mario Kart's
// boost hoops (light that says "through here"), and a sundial's own gold.
//
//   const R = new SolarRing({ radius })   scene.add(R.group)   R.set({ lit, next })   R.pass()   R.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class SolarRing {
  constructor({ radius = 2.6 } = {}) {
    this.u = { uT: { value: 0 }, uLit: { value: 1 }, uNext: { value: 0 }, uPass: { value: 0 } };
    const g = new THREE.TorusGeometry(radius, 0.2, 10, 48);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'solar-ring', uniforms: this.u,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vU; uniform float uT, uLit, uNext, uPass;
void main() {
  float run = 0.5 + 0.5 * sin(vU.x * 6.2832 * 3.0 - uT * 6.0); // (the light running round the hoop)
  vec3 ash = vec3(0.32, 0.31, 0.3) * (0.8 + 0.2 * run);
  vec3 gold = mix(vec3(1.0, 0.72, 0.22), vec3(1.0, 0.95, 0.7), run) * (1.4 + 1.2 * uNext * (0.5 + 0.5 * sin(uT * 8.0)) + 3.0 * uPass);
  gl_FragColor = vec4(mix(ash, gold, uLit), 1.0);
}` }));
    this.mesh.name = 'solar-ring';
    this.group = new THREE.Group(); this.group.add(this.mesh);
    this.lit = 1; this.k = 1; this.pT = 0;
  }
  /** lit: the sun is on it (it counts); next: it is the one to steer for. */
  set({ lit = this.lit, next = false } = {}) { this.lit = lit ? 1 : 0; this.u.uNext.value = next ? 1 : 0; }
  /** Passed through: a flare, then it dims to a gold outline and is done. */
  pass() { this.pT = 1; }
  update(raw = 1 / 60) {
    this.u.uT.value += raw;
    this.k += (this.lit - this.k) * (1 - Math.exp(-raw * 6)); this.u.uLit.value = this.k; // (a ring the shade crosses dims over a moment)
    if (this.pT > 0) { this.pT = Math.max(0, this.pT - raw * 1.5); this.u.uPass.value = this.pT; this.mesh.scale.setScalar(1 + 0.25 * (1 - this.pT)); }
  }
  dispose() { this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
