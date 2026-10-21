// ---------------------------------------------------------------------------------------
// THE SWARM'S LOOK: the voxel boid swarm of the crossing (docs/plans/RAIL-FLOW.md sections 2 and 10) drawn as one shape of little
// creatures: each boid a tiny authored body of 2 to 8 cubes (a fry, or a mote-moth), facing its way, its tail wagging (or its wings
// beating), banking into its turns, coloured by the waypoint's feeling (progress/weather.js COLOR) with a brightened rim and lit edges
// so 48 of them read as one bright shape against the dark crude sea. Petra's runtime flies the flock (creatures/ai/flock.js) and hands
// the boids here once a frame in the rail's frame; a boid downed bursts into the voxel batch (vfx/voxels/voxelbatch.js) in its cubes.
//
// Cost: 1 draw call (one InstancedMesh, up to 48 boids x 8 cubes: 384 instances, 4,608 triangles), placed on the CPU (384 matrices a
// frame); the voxel batch's program, so no program of its own. Kept true under the storm's veil (it is the danger).
//
// Prior art: Reynolds' boids (1987) and the sardine run's bait ball; Resogun's swarms of voxel fry (Housemarque) and Rez's flocks of
// wire birds; Abzu's fish schools (one shape a school, a bright rim against the deep); a Minecraft mob's cubes for a body read at 48 px.
//
//   const S = new SwarmLook(game, { batch? (default game.voxels), kind = 'fry', max = 48, scale = 1 })   S.build(scene)   S.parked()
//   S.set(boids, frame?, dt?)   once a frame: boids [{ pos: Vector3 (rail-local), vel: Vector3, alive }], frame the rail's
//                               { toWorld(local, out), dirWorld(v, out) } (world/emocean/stage.js `rail`; omitted: the world's own)
//   S.down(i, { carry?, power? })   boid i bursts into the voxel batch (its cubes, thrown along its way)
//   S.setAspect(aspect)   S.setKind('fry' | 'moth')   S.dispose()
//   SWARM_BODIES   the bodies as data: a cell (m) and cubes [x, y, z (cells, +Z forward), size (cells), part]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';
import { voxelCube, voxelMaterial, voxelAttributes, findLights, lightVoxels } from './voxelbatch.js';

/** The bodies: part 'body' (the feeling's colour), 'head' (paler), 'tail' / 'wing' (they move, and glow), 'fin' (darker). */
export const SWARM_BODIES = {
  fry: { cell: 0.16, cubes: [
    [0, 0.05, 1.05, 0.95, 'head'], [0, 0, 0, 1.2, 'body'], [0, 0.65, -0.05, 0.55, 'fin'], [0, -0.02, -1.0, 0.9, 'body'],
    [0, 0, -1.85, 0.75, 'tail'], [-0.85, -0.3, 0.35, 0.55, 'fin'], [0.85, -0.3, 0.35, 0.55, 'fin'],
  ] },
  moth: { cell: 0.15, cubes: [
    [0, 0, 0.85, 0.75, 'head'], [0, 0, 0, 1.0, 'body'], [0, 0, -0.85, 0.65, 'tail'],
    [-1.0, 0, 0.1, 0.9, 'wing'], [-1.85, 0, -0.25, 0.7, 'wing'], [1.0, 0, 0.1, 0.9, 'wing'], [1.85, 0, -0.25, 0.7, 'wing'],
  ] },
};
export const SWARM_LOOK = { rim: 1.5, edge: 0.9, wag: [11, 0.55], flap: [16, 0.9], bank: 0.25, glow: { tail: 0.85, wing: 0.55, head: 0.2, body: 0.12, fin: 0 } };
const L = SWARM_LOOK;

const IDENTITY = { toWorld: (l, out) => out.copy(l), dirWorld: (v, out) => out.copy(v) };
const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _o = new THREE.Vector3();
const _m = new THREE.Matrix4(), _c = new THREE.Color(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _feel = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export class SwarmLook {
  constructor(game, { batch = null, kind = 'fry', max = 48, scale = 1 } = {}) {
    this.game = game; this.batchOf = batch; this.max = max; this.scale = scale; this.kind = kind in SWARM_BODIES ? kind : 'fry';
    this.per = 8; this.aspect = 'wonder'; this.time = 0; this.n = 0;
    this.fwd = new Float32Array(max * 3); this.roll = new Float32Array(max); this.vel = new Float32Array(max * 3);
  }
  get batch() { return this.batchOf || this.game?.voxels || null; }
  build(scene) {
    const n = this.max * this.per, geo = voxelCube().clone();
    this.attr = voxelAttributes(geo, n, false);
    this.mat = voxelMaterial({ rim: L.rim, edge: L.edge });
    this.mesh = new THREE.InstancedMesh(geo, this.mat, n);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.userData.zoneFree = true; this.mesh.visible = false; this.mesh.renderOrder = 3;
    this.mesh.name = 'swarmLook';
    this.lights = findLights(scene);
    this.paint();
    scene.add(this.mesh);
    return this;
  }
  /** For the warm-up's compile: one boid shown far under the world (the program is the batch's: this only readies its buffers). */
  parked() {
    if (!this.mesh) return [];
    for (let j = 0; j < this.per; j++) this.mesh.setMatrixAt(j, _m.makeTranslation(0, -1e4, j));
    this.mesh.count = this.per; this.mesh.visible = true; this.mesh.instanceMatrix.needsUpdate = true;
    return [this.mesh];
  }
  setAspect(aspect) { if (aspect && aspect !== this.aspect) { this.aspect = aspect; this.paint(); } }
  setKind(kind) { if (SWARM_BODIES[kind] && kind !== this.kind) { this.kind = kind; this.paint(); } }

  /** Each cube's colour and glow from the feeling and the body's parts (written once a change, never a frame). */
  paint() {
    if (!this.attr) return;
    const base = _c.setHex(COLOR[this.aspect] ?? 0xd0c0a0), cubes = SWARM_BODIES[this.kind].cubes, C = this.attr.iColor.array, M = this.attr.iSpin.array;
    for (let i = 0; i < this.max; i++) for (let j = 0; j < this.per; j++) {
      const q = cubes[j], k = (i * this.per + j) * 4, part = q ? q[4] : 'body';
      const s = part === 'head' ? 1.25 : part === 'fin' ? 0.55 : part === 'tail' || part === 'wing' ? 1.15 : 1;
      const lift = part === 'head' ? 0.18 : 0;
      C[k] = base.r * s + lift; C[k + 1] = base.g * s + lift; C[k + 2] = base.b * s + lift; C[k + 3] = L.glow[part] ?? 0;
      M[k] = base.r; M[k + 1] = base.g; M[k + 2] = base.b; M[k + 3] = 0;
    }
    this.attr.iColor.needsUpdate = true; this.attr.iSpin.needsUpdate = true;
  }

  /** Once a frame: every boid placed (rail-local to the world through `frame`), facing its way, banked into its turn. */
  set(boids, frame = IDENTITY, dt = 1 / 60) {
    if (!this.mesh) return;
    this.time += dt;
    const body = SWARM_BODIES[this.kind], cubes = body.cubes, cell = body.cell * this.scale, n = Math.min(this.max, boids.length);
    const moving = this.kind === 'moth' ? L.flap : L.wag;
    for (let i = 0; i < n; i++) {
      const b = boids[i], base = i * this.per;
      if (!b?.alive) { for (let j = 0; j < this.per; j++) this.mesh.setMatrixAt(base + j, ZERO); continue; }
      frame.toWorld(b.pos, _p); frame.dirWorld(b.vel, _f);
      this.vel[i * 3] = _f.x; this.vel[i * 3 + 1] = _f.y; this.vel[i * 3 + 2] = _f.z;
      if (_f.lengthSq() < 1e-8) _f.set(0, 0, 1); _f.normalize();
      // the bank: the turn since the last frame (its forward then and now, across the world's up), eased
      _o.set(this.fwd[i * 3], this.fwd[i * 3 + 1], this.fwd[i * 3 + 2]);
      const turn = _o.lengthSq() > 0 ? _v.crossVectors(_o, _f).dot(_up) / Math.max(dt, 1e-3) : 0;
      this.roll[i] += (THREE.MathUtils.clamp(-turn * L.bank, -0.9, 0.9) - this.roll[i]) * Math.min(1, dt * 6);
      this.fwd[i * 3] = _f.x; this.fwd[i * 3 + 1] = _f.y; this.fwd[i * 3 + 2] = _f.z;
      _r.crossVectors(_up, _f); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0); _r.normalize();
      _u.crossVectors(_f, _r);
      const cr = Math.cos(this.roll[i]), sr = Math.sin(this.roll[i]);
      _w.copy(_r).multiplyScalar(cr).addScaledVector(_u, sr); _u.multiplyScalar(cr).addScaledVector(_r, -sr); _r.copy(_w);
      const ph = this.time * moving[0] + i * 1.7;
      for (let j = 0; j < this.per; j++) {
        const q = cubes[j];
        if (!q) { this.mesh.setMatrixAt(base + j, ZERO); continue; }
        let x = q[0], y = q[1], z = q[2];
        if (q[4] === 'tail') x += Math.sin(ph) * moving[1];
        if (q[4] === 'wing') { const a = Math.sin(ph) * moving[1] * (Math.abs(x) > 1.5 ? 1.4 : 1); y += Math.sin(a) * Math.abs(x); x *= Math.cos(a); }
        const s = q[3] * cell;
        _m.makeBasis(_w.copy(_r).multiplyScalar(s), _v.copy(_u).multiplyScalar(s), _o.copy(_f).multiplyScalar(s));
        _m.setPosition(_p.x + (_r.x * x + _u.x * y + _f.x * z) * cell, _p.y + (_r.y * x + _u.y * y + _f.y * z) * cell, _p.z + (_r.z * x + _u.z * y + _f.z * z) * cell);
        this.mesh.setMatrixAt(base + j, _m);
      }
    }
    this.n = n;
    this.mesh.count = n * this.per; this.mesh.visible = n > 0; this.mesh.instanceMatrix.needsUpdate = true;
    lightVoxels(this.mat.userData.u, this.lights.sun, this.lights.hemi);
  }

  /** Boid i bursts into the voxel batch: its cubes where they are drawn, thrown out along its way, motes of its feeling. */
  down(i, { carry = null, power = 1 } = {}) {
    const V = this.batch; if (!this.mesh || i < 0 || i >= this.n) return 0;
    const C = this.attr.iColor.array, feel = _feel.setHex(COLOR[this.aspect] ?? 0xd0c0a0);
    let k = 0;
    for (let j = 0; j < this.per; j++) {
      const at = (i * this.per + j);
      this.mesh.getMatrixAt(at, _m);
      const s = _w.setFromMatrixColumn(_m, 0).length(); if (s < 1e-6) continue;
      _p.setFromMatrixPosition(_m);
      _v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar((1.5 + Math.random() * 3) * power);
      _v.x += this.vel[i * 3] * 0.45; _v.y += this.vel[i * 3 + 1] * 0.45; _v.z += this.vel[i * 3 + 2] * 0.45;
      V?.emit(_p.x, _p.y, _p.z, _v.x, _v.y, _v.z, s * 0.9, C[at * 4], C[at * 4 + 1], C[at * 4 + 2], 0.6 + Math.random() * 0.45, C[at * 4 + 3], feel, 6 + Math.random() * 6, carry?.x || 0, carry?.y || 0, carry?.z || 0);
      this.mesh.setMatrixAt(at, ZERO); k++;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    return k;
  }
  dispose() { this.mesh?.removeFromParent(); this.mesh?.geometry.dispose(); this.mat?.dispose(); this.mesh = null; this.attr = null; }
}
