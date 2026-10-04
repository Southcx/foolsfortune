// ---------------------------------------------------------------------------------------
// PROP BATCH: props at rest drawn together. A pot is a mesh of its own (with its own geometry: its colour is baked into it) and an
// inverted-hull outline: two draw calls, and two more for its shadow. The workshop alone has three hundred of them. But almost all of
// them, almost all of the time, are standing still with their bodies asleep.
//
// So a prop at rest is PARKED: its geometry is copied into one BatchedMesh per material (and one for the outlines), an instance takes
// its place at its exact transform, and its own mesh is hidden. The moment anything happens to it (its body wakes, it is carried, it is
// cracked, scaled, re-coloured, broken) it is unparked: the instance goes, the mesh comes back, and nothing else in the game needs to
// know. Parking is invisible by construction: the batch draws the same geometry with the same material in the same place.
//
// Prior art: static batching of "sleeping" physics props as Unity and Source do it (batch until disturbed, then hand the object back to
// the dynamic path), and three.js's BatchedMesh (WEBGL_multi_draw: many geometries, one draw call, per-instance culling).
//
//   const pb = new PropBatch(game.scene);   const h = pb.park(mesh, zone);   pb.unpark(h);   pb.forget(mesh)
//   (the parked mesh is hidden through the same combined `visible` that zones use: render/zones.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OUTLINE_MAT } from './outline.js';
import { Zones } from './zones.js';

const gver = (g) => { let v = 0; for (const k in g.attributes) v += g.attributes[k].version; return v; };
/** A view of a geometry with only some of its attributes (shared, not copied): the batch stores only what its shader reads. */
const slim = (g, keep) => { const v = new THREE.BufferGeometry(); for (const k of keep) if (g.attributes[k]) v.setAttribute(k, g.attributes[k]); if (g.index) v.setIndex(g.index); return v; };
const MAIN = (g) => Object.keys(g.attributes).filter((k) => k !== 'smoothNormal'); // (the outline's own normal: not the prop's)
const OUTL = ['position', 'smoothNormal'];
const sig = (g) => Object.keys(g.attributes).sort().join(',') + (g.index ? '|i' : '');

export class PropBatch {
  constructor(scene, { maxInstances = 128, maxVertices = 65536 } = {}) {
    this.scene = scene;
    this.maxInstances = maxInstances; this.maxVertices = maxVertices;
    this.batches = new Map(); // key -> { mesh, outline }
    this.enabled = true;
  }

  batchFor(material, geo, zone, outline) {
    const key = `${material.uuid}|${sig(geo)}|${zone}|${outline ? 'o' : ''}`;
    let b = this.batches.get(key);
    if (!b) {
      const mk = (mat) => {
        const m = new THREE.BatchedMesh(this.maxInstances, this.maxVertices, this.maxVertices, mat);
        m.frustumCulled = false; m.perObjectFrustumCulled = true; m.sortObjects = false;
        m.userData.zone = zone; m.userData.propBatch = true;
        this.scene.add(m);
        return m;
      };
      b = { mesh: mk(material), outline: outline ? mk(OUTLINE_MAT) : null, geos: new Map(), ogeos: new Map() };
      b.mesh.castShadow = true; b.mesh.receiveShadow = true;
      this.batches.set(key, b);
    }
    return b;
  }

  /** The geometry's slot in a batched mesh (added once, reused while the geometry is unchanged); the batch grows when it is full. */
  geoId(mesh, map, src, view) {
    const ver = gver(src);
    let e = map.get(src.uuid);
    if (e && e.ver !== ver) { mesh.deleteGeometry(e.id); map.delete(src.uuid); e = null; }
    if (!e) {
      let id = -1;
      for (let tries = 0; tries < 5 && id < 0; tries++) {
        try { id = mesh.addGeometry(view); } catch {
          if (tries === 0) mesh.optimize();
          else { const n = view.getAttribute('position').count; const v = Math.ceil(Math.max(mesh._maxVertexCount * 1.5, mesh._nextVertexStart + n * 4)); mesh.setGeometrySize(v, v); }
        }
      }
      if (id < 0) return -1;
      e = { id, ver }; map.set(src.uuid, e);
    }
    return e.id;
  }

  /** A new instance of a geometry, growing the instance count when it is full. */
  instance(mesh, gid, matrix) {
    if (mesh._availableInstanceIds.length === 0 && mesh._instanceInfo.length >= mesh._maxInstanceCount) mesh.setInstanceCount(mesh._maxInstanceCount * 2);
    const id = mesh.addInstance(gid);
    mesh.setMatrixAt(id, matrix);
    return id;
  }

  /** Put a mesh (and its outline child, if it has one) into the batch at its current transform. Returns a handle, or null. */
  park(obj, zone = null) {
    if (!this.enabled) return null;
    const outlineChild = obj.children.find((c) => c.userData.isOutline) || null;
    const src = obj.geometry, main = slim(src, MAIN(src));
    const b = this.batchFor(obj.material, main, zone, !!outlineChild);
    obj.updateMatrixWorld();
    const g = this.geoId(b.mesh, b.geos, src, main);
    if (g < 0) return null;
    let og = -1;
    if (b.outline) { og = this.geoId(b.outline, b.ogeos, src, slim(src, OUTL)); if (og < 0) return null; }
    let id, oid = -1;
    try { id = this.instance(b.mesh, g, obj.matrixWorld); } catch { return null; }
    if (b.outline) { try { oid = this.instance(b.outline, og, obj.matrixWorld); } catch { b.mesh.deleteInstance(id); return null; } }
    Zones.install(obj);
    obj.parked = true;
    return { b, id, oid, obj, p: obj.position.clone(), q: obj.quaternion.clone(), s: obj.scale.clone(), mat: obj.material, geo: obj.geometry, ver: gver(obj.geometry), kids: obj.children.length };
  }

  unpark(h) {
    if (!h) return;
    h.b.mesh.deleteInstance(h.id);
    if (h.oid >= 0) h.b.outline.deleteInstance(h.oid);
    h.obj.parked = false;
  }

  /** Has anything about the mesh changed since it was parked (moved, scaled, re-materialed, given a child such as a crack)? */
  stale(h) {
    const o = h.obj;
    return o.material !== h.mat || o.geometry !== h.geo || gver(o.geometry) !== h.ver || o.children.length !== h.kids || !o.position.equals(h.p) || !o.quaternion.equals(h.q) || !o.scale.equals(h.s) || !o.parent;
  }

  /** The geometry will not be seen again (the prop is gone): free its space in the batches. */
  forget(geo) {
    for (const b of this.batches.values()) {
      const e = b.geos.get(geo.uuid), o = b.ogeos.get(geo.uuid);
      if (e) { b.mesh.deleteGeometry(e.id); b.geos.delete(geo.uuid); }
      if (o) { b.outline.deleteGeometry(o.id); b.ogeos.delete(geo.uuid); }
    }
  }

  stats() { let n = 0; for (const b of this.batches.values()) n += b.mesh._instanceInfo?.filter((x) => x.active).length ?? 0; return { batches: this.batches.size, parked: n }; }
}

/**
 * Many moving copies of one mesh (the segments of every hanging rope), drawn as one InstancedMesh. Each copy stays a real mesh that its
 * owner moves (physics sync) and removes as before; the pool hides it and copies its transform into an instance each frame.
 *
 *   const pool = new InstancePool(scene, geometry, material);   pool.add(mesh);   pool.update()   (after the meshes have moved)
 */
export class InstancePool {
  constructor(scene, geometry, material, { max = 1024, castShadow = true } = {}) {
    this.mesh = new THREE.InstancedMesh(geometry, material, max);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = castShadow;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.userData.zoneFree = true;
    scene.add(this.mesh);
    this.members = new Set();
  }
  add(m) { Zones.install(m); m.parked = true; this.members.add(m); }
  update() {
    let n = 0;
    const max = this.mesh.instanceMatrix.count;
    for (const m of this.members) {
      if (!m.parent) { this.members.delete(m); continue; } // (taken out of the scene by its owner)
      if (m.zoneOff || n >= max) continue;
      m.updateMatrix();
      this.mesh.setMatrixAt(n++, m.matrix);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
