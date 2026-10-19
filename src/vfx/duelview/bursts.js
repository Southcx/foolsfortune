// ---------------------------------------------------------------------------------------
// THE DUEL'S BURSTS (the duel's view: vfx/duelview.js): the small things thrown off a puzzle duel's board as its beats play: a cleared
// gem's shards in its colour, junk's grog chips falling, a blast's sparks, a orb's four sparks as it fades, the film's dots a run
// leaves, and the finisher's cubes spiralling up off the foe's half into the god hand (the data drain's STRIP, vfx/datadrain.js, laid on the
// board). One instanced mesh of little cubes, unlit (the data drain's cubes' program), in the board's own frame so they stand with it.
//
// Prior art: Puyo Puyo's pop (the bean bursting into bits of its colour), Tetris Effect's particles, .hack's data drain (a body
// stripped to cubes and drawn into the bracelet).
//
//   const B = new DuelBursts(parent)   B.burst(at, colour, n, { speed, size, life, fall, spread })   B.spiral(from, to, colour, delay)
//   B.update(dt)   B.clear()   (at, from, to: Vector3s in the board's frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { duelMaterials } from './pieces.js';
import { cubeGeometry } from './piecemodels.js';
import { DUEL_VIEW, hash, sm } from './layout.js';

const N = 640;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _c = new THREE.Color();

export class DuelBursts {
  constructor(parent) {
    const mesh = (this.mesh = new THREE.InstancedMesh(cubeGeometry(), duelMaterials().glow, N));
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0; mesh.name = 'duel-bursts';
    parent.add(mesh);
    this.parts = []; this.k = 0;
  }

  /** Shards out of a point (the board's frame): `fall` pulls them down (m/s²), `spread` their speed out of the face. */
  burst(at, colour, n = 5, { speed = 1.2, size = 0.035, life = 0.45, fall = 4, spread = 0.6 } = {}) {
    for (let i = 0; i < n && this.parts.length < N; i++) {
      const k = this.k++, a = (i / n) * Math.PI * 2 + hash(k, 1) * 0.8, sp = speed * (0.6 + 0.6 * hash(k, 2));
      this.parts.push({ p: at.clone(), v: new THREE.Vector3(Math.cos(a) * sp, Math.sin(a) * sp + 0.3 * speed, spread * (0.4 + hash(k, 3))), age: 0, life: life * (0.7 + 0.6 * hash(k, 4)),
        size: size * (0.7 + 0.6 * hash(k, 5)), col: new THREE.Color(colour), fall, spin: hash(k, 6) * 12 });
    }
  }

  /** A cube of `colour` lifting off `from` and spiralling into `to` (the finisher's strip), after `delay` real s. */
  spiral(from, to, colour, delay = 0, life = 0.35) {
    if (this.parts.length >= N) return;
    const k = this.k++;
    this.parts.push({ p: from.clone(), from: from.clone(), to, age: -delay, life, size: DUEL_VIEW.cs * 0.42, col: new THREE.Color(colour), spin: 4 + hash(k, 6) * 6, turn: hash(k, 7) * 6.28 });
  }

  clear() { this.parts.length = 0; this.mesh.count = 0; }

  update(dt) {
    const P = this.parts; let n = 0;
    for (let i = P.length - 1; i >= 0; i--) {
      const q = P[i]; q.age += dt;
      if (q.age >= q.life) { P.splice(i, 1); continue; }
      if (q.age < 0) continue;
      const u = q.age / q.life;
      if (q.to) { // (a spiral: along the line to the hand, wound round it, shrinking at the end)
        const e = sm(u), r = (1 - e) * 0.35, a = q.turn + e * 9;
        q.p.lerpVectors(q.from, q.to, e); q.p.x += Math.cos(a) * r; q.p.z += Math.sin(a) * r; q.p.y += Math.sin(Math.PI * e) * 0.4;
      } else { q.v.y -= q.fall * dt; q.p.addScaledVector(q.v, dt); }
      const s = q.size * (q.to ? 1 - 0.7 * u : 1 - u * u);
      _e.set(q.spin * q.age, q.spin * q.age * 0.7, 0); _q.setFromEuler(_e);
      this.mesh.setMatrixAt(n, _m.compose(q.p, _q, _s.setScalar(Math.max(1e-4, s))));
      this.mesh.setColorAt(n, _c.copy(q.col).multiplyScalar(1.4 - 0.6 * u));
      n++;
    }
    this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true;
  }
}
