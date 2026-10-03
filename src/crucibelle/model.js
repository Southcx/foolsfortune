// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S BODY: a bell of dark bronze that is also a lantern and a censer (the concept art): held up by the ring at its crown
// like a torch, its mouth open upward, smoke coming out of it. Round its shoulder, FIVE VENTS, one for each note of the scale, that
// light in the note's colour when it is played (crucibelle/songs.js DEGREE_COLOR); inside, an ember whose light is the FEVER. A clapper
// hangs in it on a chain and swings when it is tolled.
// Modelled in the held-tool frame (tools/grip.js): +X up through the bell from the hand at its crown ring; metres.
//
//   const m = new CrucibelleModel()   m.group   m.lightVent(i, k)   m.setFever(k)   m.setSwing(a)   m.mouthWorld(out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../outline.js';
import { DEGREE_COLOR } from './songs.js';

export class CrucibelleModel {
  constructor() {
    const g = (this.group = new THREE.Group());
    const bronze = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, metalness: 0.65, roughness: 0.35, flatShading: true });
    const brass = new THREE.MeshStandardMaterial({ color: 0xd9b048, metalness: 0.6, roughness: 0.3, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.9, flatShading: true });
    // the ring they hold it by (round the hand), the stem, the crown
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 5, 12), brass); ring.rotation.y = Math.PI / 2; g.add(ring);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6), brass); stem.rotation.z = -Math.PI / 2; stem.position.x = 0.09; g.add(stem);
    // the bell: a lathe of a bell's profile, its mouth toward +X
    const prof = [[0.0, 0.0], [0.035, 0.0], [0.05, 0.02], [0.058, 0.06], [0.062, 0.11], [0.075, 0.15], [0.092, 0.175], [0.088, 0.182], [0.07, 0.17], [0.05, 0.13], [0.046, 0.06], [0.03, 0.02], [0, 0.02]];
    const bellGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 10);
    bellGeo.rotateZ(-Math.PI / 2); bellGeo.translate(0.13, 0, 0);
    const bell = new THREE.Mesh(bellGeo, bronze); g.add(bell);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 5, 14), brass); lip.rotation.y = Math.PI / 2; lip.position.x = 0.305; g.add(lip);
    // the five vents round the shoulder (each its note's colour, dark until played)
    this.vents = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const m = new THREE.MeshBasicMaterial({ color: 0x1a0f0a });
      const v = new THREE.Mesh(new THREE.CircleGeometry(0.011, 6), m);
      v.position.set(0.215, Math.cos(a) * 0.064, Math.sin(a) * 0.064);
      v.lookAt(v.position.clone().add(new THREE.Vector3(0.2, Math.cos(a), Math.sin(a))));
      g.add(v); this.vents.push({ m, k: 0, color: new THREE.Color(DEGREE_COLOR[i]) });
    }
    // the ember inside (the fever's light), and the clapper on its chain
    this.emberMat = new THREE.MeshBasicMaterial({ color: 0xff9a4a, transparent: true, opacity: 0.85 });
    this.ember = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), this.emberMat); this.ember.position.x = 0.24; g.add(this.ember);
    this.clapper = new THREE.Group(); this.clapper.position.x = 0.15; g.add(this.clapper);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 4), brass); chain.rotation.z = -Math.PI / 2; chain.position.x = 0.045; this.clapper.add(chain);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), dark); ball.position.x = 0.1; this.clapper.add(ball);
    for (const o of [bell, lip]) addOutline(o);
    this.fever = 0;
  }
  /** A vent lit (k 0..1): its note's colour, fading back to dark. */
  lightVent(i, k = 1) { const v = this.vents[i]; if (v) v.k = Math.max(v.k, k); }
  setFever(k) { this.fever = k; this.emberMat.color.setRGB(1, 0.45 + 0.4 * k, 0.2 + 0.6 * k); this.ember.scale.setScalar(0.6 + 0.9 * k); }
  setSwing(a) { this.clapper.rotation.z = a; }
  update(dt) {
    for (const v of this.vents) { v.k = Math.max(0, v.k - dt * 2.2); v.m.color.setRGB(0.1, 0.06, 0.04).lerp(v.color, v.k); }
  }
  mouthWorld(out = new THREE.Vector3()) { return out.set(0.3, 0, 0).applyMatrix4(this.group.matrixWorld); }
  ventWorld(i, out = new THREE.Vector3()) { const a = (i / 5) * Math.PI * 2; return out.set(0.22, Math.cos(a) * 0.07, Math.sin(a) * 0.07).applyMatrix4(this.group.matrixWorld); }
}
