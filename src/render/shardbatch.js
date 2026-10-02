// ---------------------------------------------------------------------------------------
// SHARD BATCH: every loose shard of every broken pot, drawn in one draw call per look (and one for the shadow), however many there are.
//
// A pot breaks into a dozen convex shards, each its own shape; a few broken pots and there were hundreds of meshes on the floor, each a
// draw, a shadow draw and a fresh GPU buffer made in the frame it broke (the hitch when the pottery starts going). Now the shards live
// in a BatchedMesh with a fixed number of SLOTS, each slot's room reserved once at load: a new shard is copied into a free slot (a write
// into a buffer that already exists, nothing allocated), its rigid body moves a plain Object3D that is never drawn, and once a frame
// the slots take their matrices from those. A shard that would not fit a slot (a big chunk of an urn) is drawn as its own mesh, as
// before. Everything else about a shard (its body, its life, its fade, what it sounds like) is unchanged: `ent.mesh` is still there to
// move and scale, it is only not what is drawn.
//
// Prior art: the debris pools of the action games (Red Faction, Battlefield's destruction: pieces from a fixed budget, the oldest
// recycled), and three.js's BatchedMesh (multi-draw: many geometries, one draw), which is what the GPU-driven pipelines of this decade
// do for their debris.
//
//   const sb = new ShardBatch(scene, material, { slots: 650, verts: 192 })
//   const h = sb.take(geometry, proxy)  (null if it does not fit: draw it yourself)   sb.give(h)   sb.update()  (once a frame, after sync)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _m = new THREE.Matrix4();

export class ShardBatch {
  constructor(scene, material, { slots = 650, verts = 192 } = {}) {
    this.slots = slots; this.verts = verts;
    this.mesh = new THREE.BatchedMesh(slots, slots * verts, 0, material);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.perObjectFrustumCulled = true;
    this.mesh.sortObjects = false;
    this.mesh.name = 'shards';
    this.mesh.frustumCulled = false; // (its own bounds would be the whole world: each slot is culled on its own)
    scene.add(this.mesh);
    // the slots: an empty triangle in each, reserving its room, and an instance of it, hidden
    const blank = new THREE.BufferGeometry();
    blank.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    blank.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    blank.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    blank.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.001);
    this.free = [];
    this.live = new Map(); // slot -> proxy
    this.geo = []; this.inst = [];
    for (let i = 0; i < slots; i++) {
      const gid = this.mesh.addGeometry(blank, verts);
      const iid = this.mesh.addInstance(gid);
      this.mesh.setVisibleAt(iid, false);
      this.geo.push(gid); this.inst.push(iid);
      this.free.push(slots - 1 - i);
    }
  }

  /** A free slot for this geometry (non-indexed: position, normal, color), moved by `proxy`; or null. */
  take(geometry, proxy) {
    if (!this.free.length || geometry.index || geometry.attributes.position.count > this.verts) return null;
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    const slot = this.free.pop();
    this.mesh.setGeometryAt(this.geo[slot], geometry);
    this.mesh.setVisibleAt(this.inst[slot], true);
    this.live.set(slot, proxy);
    proxy.updateMatrix(); this.mesh.setMatrixAt(this.inst[slot], proxy.matrix);
    return slot;
  }

  /** The slot back (the shard is gone). */
  give(slot) {
    if (slot == null || !this.live.has(slot)) return;
    this.live.delete(slot);
    this.mesh.setVisibleAt(this.inst[slot], false);
    this.free.push(slot);
  }

  /** Each slot to where its shard is (and its size: a shard shrinks away at the end of its life). */
  update() {
    for (const [slot, p] of this.live) {
      p.updateMatrix();
      this.mesh.setMatrixAt(this.inst[slot], p.matrix);
    }
  }

  stats() { return { slots: this.slots, live: this.live.size }; }
}
