// ---------------------------------------------------------------------------------------
// THE SCULPT BRUSH: the god hand's clay on a planetoid (the owner, 2026-10-07: "terraform the microplanets, and literally let you reshape
// your inner world like clay"; docs/plans/SPIRIT-GARDEN.md section 4; Planetoid.sculpt moves the surface, Petra's art drives it). How the
// brush reads before and while it works:
//
//   THE REACH    a soft ring laid on the surface under the hand, as wide as the brush, curved to the planetoid: warm (the clay's own
//                terracotta) to raise, cool (the Lachryma's teal) to dig, pale to smooth
//   THE WORK     while it works the ring pulses, and crumbs of clay fly from its rim (raising: up and in; digging: out of the hollow)
//
// Prior art: Populous's and From Dust's terraforming cursor (a footprint on the land), Spore's and Dreams' sculpt brushes (the falloff
// shown as a soft ring), and the potter's hands at the wheel (clay thrown off as it is worked).
//
//   const B = new SculptBrush({ fx })   scene.add(B.group)   B.at(planetoid, dirLocal, size, mode: 'raise'|'dig'|'smooth')   B.work(on)   B.hide()   B.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const MODE = { raise: 0xd8875a, dig: 0x5ec8c0, smooth: 0xf2ead8 };
const N = 48;

export class SculptBrush {
  constructor({ fx = null } = {}) {
    this.fx = fx; this.t = 0; this.working = false; this.acc = 0;
    this.group = new THREE.Group(); this.group.name = 'sculpt-brush'; this.group.visible = false;
    const pos = new Float32Array((N + 1) * 2 * 3), uv = [], idx = [];
    for (let i = 0; i <= N; i++) { uv.push(i / N, 0, i / N, 1); if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); this.geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); this.geo.setIndex(idx);
    this.u = { uC: { value: new THREE.Color() }, uA: { value: 0.6 } };
    this.ring = new THREE.Mesh(this.geo, new THREE.ShaderMaterial({ name: 'sculpt-ring', uniforms: this.u, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vU; uniform vec3 uC; uniform float uA; void main() { float a = 1.0 - abs(vU.y * 2.0 - 1.0); gl_FragColor = vec4(uC * 0.6, a * a * uA); }' }));
    this.ring.frustumCulled = false; this.group.add(this.ring);
    this.mode = 'raise'; this.size = 3;
  }

  /** Where the brush is: on `planetoid` (a vfx/garden/planetoid.js Planetoid), at `dir` from its heart (local), `size` metres, its mode. */
  at(planetoid, dir, size = 3, mode = 'raise') {
    this.pl = planetoid; this.dir = dir.clone().normalize(); this.size = size; this.mode = mode; this.group.visible = true;
    this.u.uC.value.setHex(MODE[mode] ?? MODE.raise);
    // the ring: points round the brush's edge, each set on the surface (so it follows the clay's own shape)
    const P = this.geo.attributes.position, up = this.dir, side = _s.crossVectors(up, Math.abs(up.y) > 0.9 ? _x : _y).normalize(), fwd = _f.crossVectors(side, up), R = planetoid.R, ang = size / R;
    planetoid.group.updateWorldMatrix(true, false);
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      for (const [j, w] of [[0, 0.82], [1, 1.0]]) {
        const d = _d.copy(up).multiplyScalar(Math.cos(ang * w)).addScaledVector(side, Math.sin(ang * w) * Math.cos(a)).addScaledVector(fwd, Math.sin(ang * w) * Math.sin(a)).normalize();
        const p = d.multiplyScalar(planetoid.surface(d) + 0.06).applyMatrix4(planetoid.group.matrixWorld);
        P.setXYZ(i * 2 + j, p.x, p.y, p.z);
      }
    }
    P.needsUpdate = true;
  }
  work(on) { this.working = on; }
  hide() { this.group.visible = false; this.working = false; }

  update(raw = 1 / 60) {
    this.t += raw; this.u.uA.value = this.working ? 0.55 + 0.35 * Math.sin(this.t * 10) : 0.45;
    const fx = this.fx; if (!fx?.alpha || !this.working || !this.pl) return;
    this.acc += raw * 18;
    while (this.acc >= 1) {
      this.acc -= 1; const P = this.geo.attributes.position, i = Math.floor(Math.random() * N) * 2 + 1, at = new THREE.Vector3(P.getX(i), P.getY(i), P.getZ(i));
      const ctr = this.pl.group.getWorldPosition(_c), up = at.clone().sub(ctr).normalize(), toC = this.dir.clone().transformDirection(this.pl.group.matrixWorld).multiplyScalar(this.pl.R).add(ctr).sub(at).normalize();
      const v = up.multiplyScalar(1.5 + Math.random() * 1.5).addScaledVector(toC, this.mode === 'dig' ? -1.5 : 1.2);
      fx.alpha.emit({ pos: at, vel: v, life: 0.7, size: 0.12, sizeEnd: 0.08, color: new THREE.Color(this.mode === 'dig' ? 0x8a6a4a : 0xc98a5a), alpha: 1, drag: 0.5, gravity: 0 }); // (no world gravity on a planetoid: the crumbs just fly and fade)
    }
  }
  dispose() { this.group.parent?.remove(this.group); this.geo.dispose(); this.ring.material.dispose(); }
}
const _s = new THREE.Vector3(), _f = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3(), _x = new THREE.Vector3(1, 0, 0), _y = new THREE.Vector3(0, 1, 0);
