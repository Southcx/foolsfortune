// ---------------------------------------------------------------------------------------
// THE SHOAL'S LOOK (the crossing's set piece, R2; the owner, 2026-10-07; docs/plans/RAIL.md section 7; docs/GLOSSARY.md: the shoal, its
// glints, the Conductor, the bait ball, the frenzy). Petra's flock (a boids part in creatures/ai/) moves the glints; this draws them.
//
//   THE GLINTS     instanced, one draw: each a slim fish's body of ink with a pale belly and a forked tail, its tail beating as it swims (in the
//                  vertex shader, each fish on its own phase)
//   THE SILVER TURN a strike group (the frenzy) rolls onto its side a quarter-bar before it strikes: a fish on its side shows its flank to the sky,
//                  and the flank is silver (a mirror of the sky's light), so the group goes from dark to silver as it turns. A motion
//                  that reads as a flash, never a flash itself (OVERLAY rule 7)
//   THE CONDUCTOR  the shoal's caller: twice the size, its own steady glow of Lachryma along its flank and in its eye, breathing slowly
//   THE BOIL       over the bait ball the crude boils: small rings where glints break it, froth as lace, and the silver of turning
//                  glints catching the sky (a disc draped on the swells, a hand above them)
//
// Prior art: the sardine run (the bait ball, the silver flicker of a school turning: the light off their flanks), Ecco the Dolphin's and
// Abzû's schools (one instanced draw, each fish on its own beat), and Sunshine's Blooper goo boiling on the surface.
//
//   const S = new ShoalLook({ max })   S.group   S.set(i, pos, quat, roll 0..1)   S.count = n   S.conductor(pos, quat, alive)
//   S.boil(pos, radius, k 0..1, sea)   S.update(rawDt)
// The bait ball rides the surface (the crude is opaque: a glint a hand under it is gone), so the flock keeps the glints at sea.heightAt
// plus a little.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

function fishGeometry() { // (a slim body along +Z, a forked tail behind; length 0.6 m)
  const body = new THREE.SphereGeometry(0.1, 10, 6); body.scale(0.45, 0.7, 2.6);
  const tail = new THREE.BufferGeometry().setFromPoints([[0, 0, -0.22], [0, 0.11, -0.36], [0, 0.02, -0.28], [0, 0, -0.22], [0, -0.02, -0.28], [0, -0.11, -0.36]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  tail.setIndex([0, 1, 2, 3, 4, 5]); tail.computeVertexNormals();
  const g = mergeGeos(body, tail);
  const pos = g.attributes.position, back = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) back[i] = THREE.MathUtils.clamp((-pos.getZ(i)) / 0.36, 0, 1); // (how far back: the tail beats most)
  g.setAttribute('aBack', new THREE.BufferAttribute(back, 1));
  return g;
}
function mergeGeos(a, b) {
  const A = a.toNonIndexed(), B = b.toNonIndexed(), n = A.attributes.position.count + B.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  pos.set(A.attributes.position.array); pos.set(B.attributes.position.array, A.attributes.position.array.length);
  nor.set(A.attributes.normal.array); nor.set(B.attributes.normal.array, A.attributes.normal.array.length);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}

const FISH_V = /* glsl */`attribute float aBack; attribute float aRoll; attribute float aPh; uniform float uT;
varying vec3 vN; varying vec3 vW; varying float vRoll; varying float vBelly; varying float vBack;
void main() {
  vec3 p = position; p.x += sin(uT * 14.0 + aPh * 6.28) * 0.06 * aBack * aBack;                   // (the tail beats)
  float r = aRoll * 1.5708, c = cos(r), s = sin(r);                                                // (the silver turn: onto its side)
  p = vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z); vec3 n = vec3(normal.x * c - normal.y * s, normal.x * s + normal.y * c, normal.z);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0); vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n); vRoll = aRoll; vBelly = smoothstep(0.0, -0.06, position.y); vBack = smoothstep(0.035, 0.065, position.y);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FISH_F = /* glsl */`varying vec3 vN; varying vec3 vW; varying float vRoll; varying float vBelly; varying float vBack;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 ink = vec3(0.02, 0.018, 0.03), belly = vec3(0.35, 0.33, 0.38);
  vec3 c = mix(ink, belly, vBelly * 0.6);
  float flank = smoothstep(0.2, 0.8, abs(N.y)) * vRoll * (1.0 - vBack);                             // (the flank turned to the sky; its back stays ink)
  float mirror = pow(max(dot(reflect(-V, N), vec3(0.0, 1.0, 0.0)), 0.0), 4.0);
  c = mix(c, vec3(0.3, 0.32, 0.36) + vec3(0.42, 0.44, 0.48) * mirror, flank * 0.9);                // (silver: the sky in its scales; kept low, the scene is linear)
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const BOIL_F = /* glsl */`uniform float uK, uT; varying vec2 vU;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
void main() {
  vec2 p = vU * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
  float rings = 0.0;                                                                                // (a glint breaking the surface: a small ring, spreading and gone)
  for (int i = 0; i < 12; i++) { float fi = float(i), cyc = floor(uT * 0.9 + fi * 0.29), ph = fract(uT * 0.9 + fi * 0.29);
    vec2 c = (vec2(h(vec2(fi, cyc)), h(vec2(fi + 9.0, cyc))) * 2.0 - 1.0) * 0.75;
    rings += (1.0 - smoothstep(0.004, 0.012, abs(length(p - c) - 0.02 - ph * 0.16))) * (1.0 - ph) * step(0.04, ph); }
  float froth = (1.0 - smoothstep(0.0, 0.035, abs(n(p * 16.0 + vec2(uT * 0.5, -uT * 0.35)) - 0.5))) * (1.0 - r) * (1.0 - r); // (the churn's froth as lace, as foam on a sea is: thickest over the ball's heart)
  float shine = step(0.996, h(floor(p * 110.0) + floor(uT * 10.0))) * (1.0 - r);                 // (silver turning just under it, catching the sky)
  float fall = uK * (1.0 - smoothstep(0.65, 1.0, r));
  gl_FragColor = vec4(vec3(0.42, 0.4, 0.46) * (rings + froth * 0.6) + vec3(0.7, 0.72, 0.8) * shine, fall * clamp(rings * 0.6 + froth * 0.35 + shine, 0.0, 1.0));
}`;

export class ShoalLook {
  constructor({ max = 192 } = {}) {
    this.group = new THREE.Group(); this.group.name = 'shoal';
    this.u = { uT: { value: 0 } };
    const geo = fishGeometry();
    this.roll = new Float32Array(max); this.ph = new Float32Array(max).map(() => Math.random());
    geo.setAttribute('aRoll', new THREE.InstancedBufferAttribute(this.roll, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(this.ph, 1));
    this.fish = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ name: 'shoal-fish', uniforms: this.u, vertexShader: FISH_V, fragmentShader: FISH_F }), max);
    this.fish.count = 0; this.fish.frustumCulled = false; this.fish.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(this.fish);
    // the Conductor: one glint twice the size, its flank and eye lit with Lachryma
    this.conductorMat = new THREE.MeshStandardMaterial({ name: 'shoal-conductor', color: 0x0d0b12, roughness: 0.3, emissive: 0x6ad2c0, emissiveIntensity: 0.6 });
    this.conductorM = new THREE.Mesh(fishGeometry(), this.conductorMat); this.conductorM.scale.setScalar(2); this.conductorM.visible = false; this.group.add(this.conductorM);
    // the boil over the ball
    this.bu = { uK: { value: 0 }, uT: this.u.uT };
    this.boilM = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 20, 20).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ name: 'shoal-boil', uniforms: this.bu, vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: BOIL_F, transparent: true, depthWrite: false }));
    this.boilM.frustumCulled = false; this.boilM.visible = false; this.boilM.renderOrder = 3; this.group.add(this.boilM);
    this._m = new THREE.Matrix4(); this._s = new THREE.Vector3(1, 1, 1);
  }

  get count() { return this.fish.count; }
  set count(n) { this.fish.count = n; }
  /** Glint i: where it is, which way it faces (+Z its nose), and how far it has rolled onto its side for a strike (0..1). */
  set(i, pos, quat, roll = 0) { this.fish.setMatrixAt(i, this._m.compose(pos, quat, this._s)); this.roll[i] = roll; }
  conductor(pos, quat, alive = true) { this.conductorM.visible = alive; if (alive) { this.conductorM.position.copy(pos); this.conductorM.quaternion.copy(quat); } }
  /** The surface over the ball, boiling (k 0..1), laid on the sea's swells (sea: { heightAt(x, z) }, or flat at pos.y). */
  boil(pos, radius, k, sea = null) {
    const M = this.boilM; M.visible = k > 0.01; this.bu.uK.value = k; if (!M.visible) return;
    M.position.set(pos.x, 0, pos.z); M.scale.set(radius, 1, radius);
    const P = M.geometry.attributes.position, B = (this._b ||= Float32Array.from(P.array));
    for (let i = 0; i < P.count; i++) { const x = pos.x + B[i * 3] * radius, z = pos.z + B[i * 3 + 2] * radius; P.setY(i, (sea?.heightAt?.(x, z) ?? pos.y) + 0.06); }
    P.needsUpdate = true;
  }

  update(raw = 1 / 60) {
    this.u.uT.value += raw;
    this.fish.instanceMatrix.needsUpdate = true; this.fish.geometry.attributes.aRoll.needsUpdate = true;
    this.conductorMat.emissiveIntensity = 0.45 + 0.25 * Math.sin(this.u.uT.value * 1.6); // (its glow breathes, slowly)
  }

  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); }
}
