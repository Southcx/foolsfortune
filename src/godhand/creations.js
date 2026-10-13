// ---------------------------------------------------------------------------------------
// THE HAND'S CREATIONS, AT RUN TIME (docs/plans/GODHAND.md sections 7 and 8; the voxels: godhand/voxels.js). Draws each voxel chunk as
// one mesh and collides it as one trimesh, remeshing only the chunks a stamp or the mending touched, a few a frame inside a time budget
// (`CREATIONS.budgetMs`) so a sculpt never hitches. The mending takes a creation back from the outside in over about a game day, and the
// volume it loses is poured back into the island's matter as clay where it stood (godhand/islandmatter.js): nothing is made or lost.
// Placeholder look: one clay material, smooth shaded (Calissa's to dress: fired, glazed, crazed as it crumbles).
//
// Prior art: Lysenko's chunked surface nets (remesh the touched chunk only); Minecraft's and Teardown's chunk-dirty queues; From Dust.
//
//   game.creations = new Creations(game)   .raise(shape, a, b, opts) -> { volume }   .update(dt)   .clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../core/physics.js';
import { VoxelGrid, SHAPES, VOXEL } from './voxels.js';

/** `budgetMs` real ms of remeshing a frame; `life` real seconds a 1 m thick wall stands (a game day); `mendEvery` real seconds between
 *  the mending's steps. The ebb a step follows from them: a 1 m wall's middle stands 0.25 above the surface (half its thickness over
 *  the voxels' 2 m ramp). */
export const CREATIONS = { budgetMs: 1.5, life: 3600, mendEvery: 30 };
const TRI_FLAGS = RAPIER.TriMeshFlags?.FIX_INTERNAL_EDGES ?? 0;

export class Creations {
  constructor(game) {
    this.game = game;
    this.grid = new VoxelGrid();
    this.parts = new Map(); // chunk key -> { mesh, body }
    this.queue = new Set();
    this.mendT = 0;
    this.mat = new THREE.MeshStandardMaterial({ color: 0xa8673f, roughness: 0.85 });
    this.firedMat = new THREE.MeshStandardMaterial({ color: 0x6e3a22, roughness: 0.55 }); // (fired: darker, a little glossy; Calissa's to dress)
    this.t = 0;
    // a creation fired for good (Fire at 99, GODHAND.md 11) is kept, as its chunks' densities in runs; the rest is the mending's
    game.save?.section('creations', { scope: 'world', version: 1,
      dump: () => [...this.grid.chunks.values()].filter((c) => c.forever).map((c) => this.grid.pack(c.k)),
      load: (d) => { for (const p of Array.isArray(d) ? d : []) { const c = this.grid.unpack(p); c.forever = true; } for (const k of this.grid.takeDirty()) this.queue.add(k); },
      reset: () => {} });
    this.group = new THREE.Group(); this.group.name = 'god-creations';
    game.scene.add(this.group);
  }

  /** Raise a shape (SHAPES: pillar, arch, ramp) between two ground points. Returns the volume it added (m³). */
  raise(shape, a, b, opts) {
    const S = SHAPES[shape]; if (!S) return { volume: 0 };
    const { sdf, box } = shape === 'pillar' ? S(a, opts) : S(a, b, opts);
    const r = this.grid.stamp(sdf, box);
    for (const k of this.grid.takeDirty()) this.queue.add(k);
    return r;
  }

  update(dt) {
    if (!this.grid.chunks.size && !this.queue.size && !this.parts.size) return;
    this.mendT += dt; this.t += dt;
    if (this.mendT >= CREATIONS.mendEvery) {
      const dk = (0.25 / CREATIONS.life) * this.mendT; this.mendT = 0;
      for (const { k, lost } of this.grid.ebb(dk, (c) => c.forever || (c.firedUntil ?? 0) > this.t)) this.giveBack(k, lost);
      for (const k of this.grid.takeDirty()) this.queue.add(k);
    }
    if (!this.queue.size) return;
    const t0 = performance.now();
    for (const k of this.queue) {
      this.queue.delete(k);
      this.remesh(k);
      if (performance.now() - t0 > CREATIONS.budgetMs) break;
    }
  }

  /** What crumbled goes back to the island as clay, at the chunk's foot. */
  giveBack(k, lost) {
    const F = this.game.matter?.field, [cx, , cz] = k.split(',').map(Number), w = VOXEL.n * VOXEL.size;
    const x = (cx + 0.5) * w, z = (cz + 0.5) * w;
    if (F?.contains?.(x, z)) F.pour(x, z, w * 0.5, lost, { kind: 'clay' });
  }

  remesh(k) {
    const g = this.game, W = g.physics.world, old = this.parts.get(k);
    if (old) { this.group.remove(old.mesh); old.mesh.geometry.dispose(); try { W.removeRigidBody(old.body); } catch { /* gone */ } this.parts.delete(k); }
    const m = this.grid.mesh(k); if (!m) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
    geo.setIndex(new THREE.BufferAttribute(m.idx, 1));
    geo.computeVertexNormals(); geo.computeBoundingSphere();
    const C = this.grid.chunks.get(k), mesh = new THREE.Mesh(geo, C && (C.forever || (C.firedUntil ?? 0) > this.t) ? this.firedMat : this.mat);
    mesh.castShadow = mesh.receiveShadow = true;
    this.group.add(mesh);
    const body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    W.createCollider(RAPIER.ColliderDesc.trimesh(m.pos, m.idx, TRI_FLAGS).setFriction(0.9).setCollisionGroups(GROUPS.static), body);
    this.parts.set(k, { mesh, body });
  }

  /** Fire the creation within r of a point: its chunks stand `secs` real seconds before the mending touches them, or for good (kept in
   *  the save). Returns how many chunks took the fire. */
  fire(at, r, secs, forever = false, dry = false) {
    const w = VOXEL.n * VOXEL.size; let n = 0;
    for (const c of this.grid.chunks.values()) {
      const x = (c.cx + 0.5) * w, y = (c.cy + 0.5) * w, z = (c.cz + 0.5) * w;
      if (Math.hypot(x - at.x, y - at.y, z - at.z) > r + w * 0.87 || c.vol <= 0) continue;
      if (dry) { n++; continue; }
      if (forever) c.forever = true; else c.firedUntil = Math.max(c.firedUntil ?? 0, this.t + secs);
      this.queue.add(c.k); n++;
    }
    if (forever && n && !dry) this.game.save?.dirty('creations');
    return n;
  }

  /** Everything gone at once (a new world; nothing is given back). */
  clear() {
    this.grid.chunks.clear();
    for (const k of [...this.parts.keys()]) this.remesh(k);
    this.queue.clear();
  }

  get volume() { let v = 0; for (const c of this.grid.chunks.values()) v += c.vol; return v; }
}
