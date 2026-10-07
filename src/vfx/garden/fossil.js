// ---------------------------------------------------------------------------------------
// A LACHRYMITE FOSSIL: a spirit that died long ago, turned to stone with Lachryma in its bones (the owner, 2026-10-07: the full build,
// Round 4; docs/plans/SPIRIT-GARDEN.md section 5: "Lachrymite fossils in the Dunes, found with the Dreamvane's pick, awakened in the
// Grove by the Crucibelle's song", Spectrobes Origins' way). It is a find in the sand first and a birth in the garden second.
//
//   THE NODULE   a lump of sandstone, rounded by the dunes, with the fossil showing in its broken face: Lachrymite, the crystal of
//                Lachryma, where the bones were (three shapes: a SPIRAL as an ammonite's, a FISH's spine and ribs, a CLAW)
//   BURIED      set({ buried }) sinks it into a mound of sand (0 dug clean .. 1 only a glint showing); the Dreamvane's pick finds it
//   AWAKENING   awaken(k): as the Crucibelle sings to it, its crystal answers: light pulsing out along the bones in time with the song
//                (beat()), cracks of light running through the stone as k rises
//   THE BIRTH   burst(): the stone breaks away in pieces and the light stands where it was (Petra's spirit there)
//
// Prior art: Spectrobes (fossils dug and woken by sound), the ammonites and fish of the Jurassic coast and opalised fossils (bone turned
// to gem), Pokemon's fossils, and the Okami brush's restoration of a sleeping guardian.
//
//   const F = new Fossil({ shape: 'spiral'|'fish'|'claw', feeling })   F.group (rests on its origin)   F.set({ buried })   F.awaken(k)
//   F.beat()   F.burst()   F.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../weather.js';

const CRYSTAL_F = /* glsl */`varying vec3 vN, vW, vP; uniform vec3 uC; uniform float uK, uBeat, uT;
void main() {
  vec3 V = normalize(cameraPosition - vW); float f = abs(dot(V, normalize(vN)));
  float run = 0.5 + 0.5 * sin(length(vP) * 18.0 - uT * 6.0);                                     // (light running out along the bones)
  vec3 c = uC * (0.25 + 0.5 * pow(1.0 - f, 2.0)) + uC * uK * (0.4 + 0.6 * run) * (0.6 + 0.8 * uBeat);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export class Fossil {
  constructor({ shape = 'spiral', feeling = 'wonder' } = {}) {
    this.group = new THREE.Group(); this.group.name = `fossil-${shape}`; this.t = 0; this.k = 0; this.beatK = 0; this.pieces = null;
    this.u = { uC: { value: new THREE.Color(COLOR[feeling] ?? COLOR.wonder) }, uK: { value: 0 }, uBeat: { value: 0 }, uT: { value: 0 } };
    this.crystal = new THREE.ShaderMaterial({ name: 'fossil-crystal', uniforms: this.u, fragmentShader: CRYSTAL_F,
      vertexShader: 'varying vec3 vN, vW, vP; void main() { vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }' });
    // the nodule: sandstone, cracking with light as it wakes
    this.su = { uK: { value: 0 }, uC: this.u.uC };
    this.stone = new THREE.MeshStandardMaterial({ name: 'fossil-stone', color: 0xc9a77a, roughness: 0.95, flatShading: true });
    this.stone.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.su);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFsP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFsP = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFsP; uniform float uK; uniform vec3 uC;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  { float cr = 1.0 - smoothstep(0.0, 0.03, abs(sin(vFsP.x * 9.0 + vFsP.y * 5.0) * 0.5 + sin(vFsP.z * 11.0 - vFsP.y * 7.0) * 0.5));
    totalEmissiveRadiance += uC * cr * smoothstep(0.3, 1.0, uK) * 1.4; }`);
    };
    this.stone.customProgramCacheKey = () => 'fossil-stone';
    const ng = new THREE.DodecahedronGeometry(0.5, 1); const P = ng.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const k = 1 + 0.12 * Math.sin(x * 7 + y * 5) * Math.sin(z * 6); P.setXYZ(i, x * k * 1.2, y * k * 0.75, z > 0.18 ? 0.18 + (z - 0.18) * 0.2 : z * k); } // (squat, its front broken flat where the fossil shows)
    ng.computeVertexNormals();
    this.nodule = new THREE.Mesh(ng, this.stone); this.nodule.position.y = 0.36; this.nodule.castShadow = true; this.group.add(this.nodule);
    // the bones, in Lachrymite, set in the broken face
    const bones = new THREE.Group(); bones.position.set(0, 0.36, 0.2); this.group.add(bones); this.bones = bones;
    if (shape === 'spiral') { const pts = []; for (let i = 0; i <= 60; i++) { const a = i * 0.21, r = 0.04 + i * 0.0052; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); } bones.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.03, 5), this.crystal)); }
    else if (shape === 'fish') { bones.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5).rotateZ(Math.PI / 2), this.crystal)); for (let i = 0; i < 8; i++) { const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26 - Math.abs(i - 3) * 0.03, 4), this.crystal); rib.position.x = -0.24 + i * 0.07; rib.rotation.z = 0.3; bones.add(rib); } const skull = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), this.crystal); skull.position.x = 0.36; bones.add(skull); }
    else { for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.32, 6), this.crystal); c.position.set(-0.12 + i * 0.12, 0.02 * i, 0); c.rotation.z = 0.5 - i * 0.25; bones.add(c); } const pad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), this.crystal); pad.position.y = -0.15; bones.add(pad); }
    // the mound it lies in, as found
    this.mound = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ name: 'fossil-mound', color: 0xd8b886, roughness: 1 }));
    this.mound.scale.y = 0.45; this.mound.visible = false; this.group.add(this.mound);
    this.buried = 0;
  }

  /** How buried it is: 0 dug clean .. 1 only a glint of its crystal showing through a mound of sand. */
  set({ buried = this.buried } = {}) { this.buried = THREE.MathUtils.clamp(buried, 0, 1); this.mound.visible = this.buried > 0.02; this.mound.scale.set(1, 0.45 * this.buried, 1); this.nodule.position.y = 0.36 - 0.25 * this.buried; this.bones.position.y = this.nodule.position.y; }
  /** The song's hold on it: 0 asleep .. 1 about to break. */
  awaken(k) { this.k = THREE.MathUtils.clamp(k, 0, 1); }
  /** A note of the song lands: the crystal pulses with it. */
  beat() { this.beatK = 1; }
  /** It breaks open: the stone falls away in pieces; the light stands where it was. */
  burst() {
    if (this.pieces) return; this.nodule.visible = false;
    this.pieces = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12 + (i % 3) * 0.04, 0), this.stone); const a = (i / 10) * Math.PI * 2; m.position.set(Math.cos(a) * 0.3, 0.36, Math.sin(a) * 0.3); this.group.add(m); return { m, v: new THREE.Vector3(Math.cos(a) * 2, 2.5 + (i % 3), Math.sin(a) * 2), w: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(8) }; });
    this.k = 1; this.burstT = 0;
  }

  update(raw = 1 / 60) {
    this.t += raw; this.u.uT.value = this.t; this.beatK = Math.max(0, this.beatK - raw * 4);
    this.u.uK.value = this.k; this.u.uBeat.value = this.beatK; this.su.uK.value = this.k;
    if (this.k > 0.2 && !this.pieces) this.nodule.rotation.z = (Math.random() - 0.5) * 0.03 * this.k; // (it trembles as it wakes)
    if (this.pieces) {
      this.burstT += raw;
      for (const p of this.pieces) { p.v.y -= 9 * raw; p.m.position.addScaledVector(p.v, raw); if (p.m.position.y < 0.05) { p.m.position.y = 0.05; p.v.multiplyScalar(0.4); p.v.y = Math.abs(p.v.y) * 0.3; } p.m.rotation.x += p.w.x * raw; p.m.rotation.y += p.w.y * raw; }
      const s = 1 + Math.min(1, this.burstT * 2) * 1.6; this.bones.scale.setScalar(s); this.bones.position.y = 0.36 + Math.min(1, this.burstT) * 0.4; // (the light rises where the stone was)
    }
  }

  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => o.geometry?.dispose?.()); this.crystal.dispose(); this.stone.dispose(); this.mound.material.dispose(); }
}
