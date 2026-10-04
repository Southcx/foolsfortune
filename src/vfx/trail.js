// ---------------------------------------------------------------------------------------
// WEAPON TRAILS: the ribbon a blade leaves in the air. Every frame the two ends of whatever is swinging (the blade's base and its
// tip, or a hand and a fist) are pushed as one sample; the samples age out, and the ribbon between them is drawn additive, hot at
// the tip and fading toward the base and with age. Built as a spline through the last few samples, so a fast arc is a curve and
// not a fan of flat quads.
//
// Prior art: the sword trails of every action game from Soul Calibur on (a ribbon between two sockets, sampled per frame, faded by
// age), and Devil May Cry / Metal Gear Rising's brighter, longer trail on the strokes that matter. One class, many colours: the
// cutlass, the stinger, the grapnel in flight and blade mode's cut all use it.
//
//   const t = new Trail(scene, { life: 0.3, color: 0xfff1dc, tip: 0xffd07a, k: 1 })   (k: its strength)
//   t.push(base, tip)   every frame it is swinging          t.gap()   the swing ended (the next push starts a new ribbon)
//   t.update(dt)        every frame
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const SUB = 3; // spline subdivisions between samples
const cr = (p0, p1, p2, p3, t, out) => { // Catmull-Rom, centripetal enough at this scale
  const t2 = t * t, t3 = t2 * t;
  return out.set(
    0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3));
};

export class Trail {
  constructor(scene, { life = 0.3, max = 40, color = 0xfff1dc, tip = 0xffd07a, core = 1, fade = 1.6, k = 1 } = {}) {
    this.life = life; this.max = max;
    this.s = []; // { a, b, age, brk }
    this.brk = true;
    const nv = max * SUB * 2 + 8;
    this.pos = new Float32Array(nv * 3); this.uv = new Float32Array(nv * 2); this.age = new Float32Array(nv);
    this.idx = new Uint16Array(nv * 3);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('age', new THREE.BufferAttribute(this.age, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setIndex(new THREE.BufferAttribute(this.idx, 1).setUsage(THREE.DynamicDrawUsage));
    this.uni = { uBase: { value: new THREE.Color(color) }, uTip: { value: new THREE.Color(tip) }, uCore: { value: core }, uFade: { value: fade }, uK: { value: k } };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: 'attribute float age; varying vec2 vUv; varying float vAge; void main() { vUv = uv; vAge = age; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uBase, uTip; uniform float uCore, uFade, uK; varying vec2 vUv; varying float vAge;
        void main() {
          float a = pow(max(0.0, 1.0 - vAge), uFade) * mix(0.12, 1.0, pow(vUv.y, 1.4));
          vec3 c = mix(uBase, uTip, vUv.y) * (1.0 + uCore * pow(vUv.y, 6.0) * (1.0 - vAge));
          gl_FragColor = vec4(c, a * uK);
        }`,
    });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 7;
    scene.add(this.mesh);
    this.mesh.visible = false;
  }

  setColors(base, tip) { this.uni.uBase.value.set(base); this.uni.uTip.value.set(tip); }

  push(a, b) {
    const L = this.s[this.s.length - 1]; // (a blade held still, in a hitstop, adds nothing: identical samples would flood the ribbon)
    if (L && !this.brk && L.a.distanceToSquared(a) < 1e-6 && L.b.distanceToSquared(b) < 1e-6) return;
    this.s.push({ a: a.clone(), b: b.clone(), age: 0, brk: this.brk });
    this.brk = false;
    if (this.s.length > this.max) this.s.shift();
  }
  gap() { this.brk = true; }
  clear() { this.s.length = 0; this.brk = true; this.mesh.visible = false; }

  update(dt) {
    const S = this.s;
    for (const q of S) q.age += dt;
    while (S.length && S[0].age >= this.life) S.shift();
    // (the samples in runs: a `brk` starts a new ribbon)
    const runs = [];
    for (const q of S) { if (q.brk || !runs.length) runs.push([]); runs[runs.length - 1].push(q); }
    let v = 0, ix = 0;
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    const put = (a, b, age) => {
      if (v + 2 > this.pos.length / 3) return false;
      this.pos[v * 3] = a.x; this.pos[v * 3 + 1] = a.y; this.pos[v * 3 + 2] = a.z; this.uv[v * 2] = 0; this.uv[v * 2 + 1] = 0; this.age[v] = age;
      v++;
      this.pos[v * 3] = b.x; this.pos[v * 3 + 1] = b.y; this.pos[v * 3 + 2] = b.z; this.uv[v * 2] = 0; this.uv[v * 2 + 1] = 1; this.age[v] = age;
      v++;
      return true;
    };
    for (const R of runs) {
      if (R.length < 2) continue;
      const first = v;
      for (let i = 0; i < R.length - 1; i++) {
        const p0 = R[Math.max(0, i - 1)], p1 = R[i], p2 = R[i + 1], p3 = R[Math.min(R.length - 1, i + 2)];
        for (let k = 0; k < SUB; k++) {
          const t = k / SUB;
          cr(p0.a, p1.a, p2.a, p3.a, t, tmpA); cr(p0.b, p1.b, p2.b, p3.b, t, tmpB);
          put(tmpA, tmpB, Math.min(1, (p1.age + (p2.age - p1.age) * t) / this.life));
        }
      }
      const last = R[R.length - 1];
      put(last.a, last.b, Math.min(1, last.age / this.life));
      for (let n = first; n + 3 < v; n += 2) { this.idx[ix++] = n; this.idx[ix++] = n + 1; this.idx[ix++] = n + 2; this.idx[ix++] = n + 1; this.idx[ix++] = n + 3; this.idx[ix++] = n + 2; }
    }
    this.geo.setDrawRange(0, ix);
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.uv.needsUpdate = true; this.geo.attributes.age.needsUpdate = true;
    this.geo.index.needsUpdate = true;
    this.mesh.visible = ix > 0;
  }
}
