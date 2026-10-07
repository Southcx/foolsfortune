// ---------------------------------------------------------------------------------------
// WAKE: what a fast hull leaves on a soft surface, drawn the way The Wind Waker draws the King of Red
// Lions' passage: crisp white bubbles thrown off the bow, a pair of thin white lines running back
// from the bow's flanks and opening into a V, and a paler band between them that thins and fades
// behind the boat. (Wind Waker's sea-parting effect is a pair of textured meshes, one a side, that
// scale up and scroll; here the band is real geometry laid down where the boat went and left to fade
// by age, with no scrolling anywhere, and the bubbles are a particle pool.)
//
//   const wake = new Wake(scene, fx, { color: 0xfff4de });
//   wake.update(dt, { bow, fwd, right, speed, air, glow, ground: (x, z) => y, floor })
//   wake.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
const simRand = stream('world/ground/wake'); // (the simulation's chance: core/rng.js, the same twice)

const N = 72;          // samples kept
const SPACING = 0.32;  // metres between samples
const LIFE = 2.6;      // seconds a mark lasts at full speed

export class Wake {
  constructor(scene, fx, { color = 0xfff4de } = {}) {
    this.fx = fx;
    this.color = new THREE.Color(color);
    this.s = []; // { x, z, y, age, f: forward x, z }
    this.last = null;
    this.acc = 0;
    // three strips in one geometry: the pale band, the left line, the right line
    const verts = N * 2 * 3;
    this.pos = new Float32Array(verts * 3);
    this.col = new Float32Array(verts * 4);
    const idx = [];
    for (let strip = 0; strip < 3; strip++) for (let i = 0; i < N - 1; i++) {
      const a = strip * N * 2 + i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.g = g;
  }

  clear() { this.s.length = 0; this.last = null; this.acc = 0; this.mesh.visible = false; }

  update(dt, { bow, fwd, right, speed, air, glow = 0, ground, floor }) {
    // age and drop
    for (const p of this.s) p.age += dt;
    while (this.s.length && this.s[0].age > LIFE) this.s.shift();
    const k = Math.min(1, speed / 14); // how much boat there is
    // lay down a sample every SPACING metres of bow travel (not while airborne: the line breaks there)
    if (this.last && !air) {
      const d = Math.hypot(bow.x - this.last.x, bow.z - this.last.z);
      if (d > 6) this.last = null;
      else if (d >= SPACING && k > 0.08) {
        this.s.push({ x: bow.x, z: bow.z, y: ground(bow.x, bow.z), age: 0, fx: fwd.x, fz: fwd.z, k, brk: false });
        this.last = { x: bow.x, z: bow.z };
      }
    } else if (!this.last || air) {
      if (air && this.s.length && !this.s[this.s.length - 1].brk) this.s[this.s.length - 1].brk = true;
      this.last = { x: bow.x, z: bow.z };
    }
    this.build(right);
    // bubbles off the bow: crisp white discs, thrown out and up, more the faster
    if (!air && k > 0.06) {
      this.acc += dt * (14 + 70 * k * k) * (1 + glow * 0.6);
      const gy = ground(bow.x, bow.z);
      while (this.acc >= 1) {
        this.acc -= 1;
        const side = simRand() < 0.5 ? -1 : 1;
        const out = 1.2 + simRand() * 2.6 * (0.5 + k);
        const p = new THREE.Vector3(bow.x + right.x * side * 0.3, gy + 0.12 + simRand() * 0.25, bow.z + right.z * side * 0.3);
        const v = new THREE.Vector3(right.x * side * out - fwd.x * speed * 0.16, 1.8 + simRand() * 2.4 * (0.5 + k), right.z * side * out - fwd.z * speed * 0.16);
        this.fx.foam.emit({ pos: p, vel: v, life: 0.45 + simRand() * 0.45, size: 0.07 + simRand() * 0.14 * (0.6 + k), sizeEnd: 0.05, color: this.color, alpha: 0.95, drag: 1.2, gravity: 11, floor: gy });
      }
    }
  }

  build(right) {
    const n = this.s.length;
    const P = this.pos, C = this.col, c = this.color;
    let used = 0;
    if (n < 2) { this.mesh.visible = false; this.g.setDrawRange(0, 0); return; }
    this.mesh.visible = true;
    for (let i = 0; i < N; i++) {
      const p = this.s[Math.min(i, n - 1)];
      const live = i < n;
      const t = live ? p.age / LIFE : 1;
      const spread = 0.34 + 1.05 * Math.pow(t, 0.75) * (0.4 + 0.6 * p.k); // the V opens as it ages
      const fade = live ? (1 - t) * (1 - t) * p.k : 0;
      const lx = -p.fz, lz = p.fx; // (to the left of that sample's heading)
      const y = p.y + 0.05;
      const w = { band: 0.5 * spread, line: 0.032 + 0.025 * t };
      for (let strip = 0; strip < 3; strip++) {
        const base = (strip * N + i) * 2;
        let cx = 0, hw = 0, a = 0;
        if (strip === 0) { hw = w.band; a = 0.34 * fade; }
        else { cx = (strip === 1 ? 1 : -1) * spread; hw = w.line; a = 0.95 * fade; }
        // a break in the line (the boat left the ground here): make the strip degenerate
        if (p.brk) a = 0;
        for (let e = 0; e < 2; e++) {
          const off = cx + (e ? hw : -hw);
          const o = (base + e) * 3;
          P[o] = p.x + lx * off; P[o + 1] = y; P[o + 2] = p.z + lz * off;
          const oc = (base + e) * 4;
          C[oc] = c.r; C[oc + 1] = c.g; C[oc + 2] = c.b; C[oc + 3] = a;
        }
      }
    }
    this.g.attributes.position.needsUpdate = true;
    this.g.attributes.color.needsUpdate = true;
    // (the index buffer is fixed; unused samples repeat the last one, so they collapse to nothing)
    this.g.setDrawRange(0, (N - 1) * 6 * 3);
    void used; void right;
  }
}
