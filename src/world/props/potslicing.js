// ---------------------------------------------------------------------------------------
// POT SLICING: a pot, or a loose piece, cut by a plane. `slice(ent, plane, dir)` halves a pot, a sliced piece or a loose prop (a crate)
// into pieces of their own, each a dynamic body that can be cut again and fades after a while (`spawnPiece`, `removeSlice`); the cut pot
// is `retire`d (its on-break side effects, but no shards); a plain shot into a piece `crumble`s it into a few convex chunks; a pot's
// decoration (sculpture arms and the like) that falls off with it becomes a chunk too (`spawnConvexFromMesh`). `removeAny` takes a sliced
// piece, a shard or a loose prop out of the world. The planes come from the Sondelass's blade, the slicer shell and the god art Sunder;
// the plane cutting itself is tools/slicing.js.
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
//   POT_SLICING: isSliceable(ent) -> bool   slice(ent, { n, d }, dir) -> [pieces] | null   crumble(piece, point, dir)   removeAny(ent)
//                retire(ent, cause, dir, point) -> centre   convexHalf(points, plane, baseColor, M)   spawnPiece(h, pos, quat, vel, angVel)
//                removeSlice(piece)   spawnConvexFromMesh(mesh, dir, color)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T, PALETTE } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';
import { sfx } from '../../audio/sfx.js';
import { MATERIALS } from './pottery.js';
import { hasTag, unregister } from '../../core/tags.js';
import { planeToLocal, splitConvexPoints, splitTriangles, capWall, toGeometry, uniquePoints, safeHullPoints } from '../../tools/slicing.js';
import { stream, randDir } from '../../core/rng.js';
import { shardMat } from './potmaterials.js';
const simRand = stream('world/props/breakables'); // (the simulation's chance: core/rng.js, the same twice; the breakables' one stream, drawn from by every part)

export const POT_SLICING = {
  /** Remove an intact breakable and run its on-break side effects (not the shards). */
  retire(ent, cause, dir, point) {
    ent.alive = false;
    this.items.delete(ent); this.release(ent);
    const t = ent.body.translation();
    const center = new THREE.Vector3(t.x, t.y + ent.P.height * 0.45, t.z);
    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(ent.body);
    this.scene.remove(ent.mesh);
    if (ent.rope) this.kickRope(ent.rope, dir || new THREE.Vector3(0, 1, 0), 1);
    this.game.onBroken(ent, cause, 'courier'); // (only a blade slices)
    if (ent.marked) this.game.baubles?.spawn(center, T.lachryma.markedDrop);
    this.onGone(ent, new THREE.Vector3(t.x, t.y, t.z));
    if (ent.def.lantern) { this.fx.embers(center, 30); this.game.baubles?.spawn(center, 1, { up: 1 }); }
    if (ent.def.baubles) this.game.baubles?.spawn(center, ent.def.baubles); // (the Throwing Room's pots: Lachryma to keep firing, nothing else)
    if (ent.def.slip) this.game.shells?.spill(center, dir || new THREE.Vector3(0, -1, 0), cause === 'sliced' ? 0.6 : 1);
    if (ent.def.ember || ent.ember) this.fx.after(cause === 'sliced' ? 0.35 : 0.03, () => this.explode(center, { who: 'courier' }));
    if (ent.def.respawn) this.fx.after(ent.def.respawn, () => this.spawn({ ...ent.def, popIn: true }));
    ent.extras?.forEach((x) => this.spawnConvexFromMesh(x, dir, ent.color));
    return center;
  },

  /** Can a blade cut it (tags.js: 'sliceable'), and is it still there to cut? */
  isSliceable(ent) {
    if (!ent || !hasTag(ent, 'sliceable') || ent.type === 'clapper') return false;
    return ent.type === 'breakable' ? ent.alive : !!ent.body?.isValid?.() && !!ent.mesh;
  },

  /** Cut `ent` with a world-space plane. Returns the new pieces, or null. */
  slice(ent, plane, dir) {
    if (!this.isSliceable(ent)) return null;
    const bt = ent.body.translation(), br = ent.body.rotation();
    const pos = new THREE.Vector3(bt.x, bt.y, bt.z), quat = new THREE.Quaternion(br.x, br.y, br.z, br.w);
    const lv = ent.body.linvel();
    const vel = new THREE.Vector3(lv.x, lv.y, lv.z);
    const local = planeToLocal(plane, pos, quat);
    const nWorld = plane.n;
    let halves;
    if (ent.type === 'breakable' || (ent.type === 'slice' && ent.kind === 'mesh')) {
      const isPot = ent.type === 'breakable';
      const axis = isPot ? new THREE.Vector3() : ent.axis;
      const th = isPot ? ent.P.th : ent.th;
      const M = isPot ? ent.P.M : ent.M;
      const sides = splitTriangles(ent.mesh.geometry, local);
      if (sides.a.pos.length < 9 || sides.b.pos.length < 9) return null;
      const frac = new THREE.Color(M.fracture);
      capWall(sides.a, axis, th, frac);
      capWall(sides.b, axis, th, frac);
      halves = [sides.a, sides.b].map((sd) => {
        const { geometry, center } = toGeometry(sd);
        return { geometry, center, kind: 'mesh', axis: axis.clone().sub(center), th, M };
      });
      if (isPot) this.retire(ent, 'sliced', dir, pos);
      else this.removeSlice(ent);
    } else {
      const pts = uniquePoints(ent.mesh.geometry);
      const { a, b } = splitConvexPoints(pts, local);
      if (a.length < 4 || b.length < 4) return null;
      const base = ent.baseColor || averageColor(ent.mesh);
      const M = ent.M || MATERIALS.earthenware;
      halves = [a, b].map((ps) => this.convexHalf(ps, local, base, M));
      if (halves.some((h) => !h)) return null;
      this.removeAny(ent);
    }
    const sign = [1, -1];
    return halves.map((h, i) => {
      const worldC = h.center.clone().applyQuaternion(quat).add(pos);
      const v = vel.clone().addScaledVector(nWorld, sign[i] * T.shells.slicer.separate).addScaledVector(dir, T.shells.slicer.carry);
      return this.spawnPiece(h, worldC, quat, v, randDir(simRand, new THREE.Vector3()).multiplyScalar(2));
    }).filter(Boolean);
  },

  convexHalf(points, plane, baseColor, M) {
    const c = new THREE.Vector3();
    for (const p of points) c.add(p);
    c.divideScalar(points.length);
    const local = points.map((p) => p.clone().sub(c));
    let geometry;
    try { geometry = new ConvexGeometry(local); } catch { return null; }
    if (!geometry.attributes.position || geometry.attributes.position.count < 4) return null;
    const pa = geometry.attributes.position;
    const cols = new Float32Array(pa.count * 3);
    const frac = new THREE.Color(M.fracture), tmp = new THREE.Color();
    for (let i = 0; i < pa.count; i++) {
      const d = plane.n.x * (pa.getX(i) + c.x) + plane.n.y * (pa.getY(i) + c.y) + plane.n.z * (pa.getZ(i) + c.z) - plane.d;
      tmp.copy(Math.abs(d) < 1e-3 ? frac : baseColor);
      cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return { geometry, center: c, kind: 'convex', M, baseColor };
  },

  /** A loose sliced piece: dynamic, sliceable again, crumbles when shot. */
  spawnPiece(h, pos, quat, vel, angVel) {
    const flat = safeHullPoints(uniquePoints(h.geometry));
    const cd = flat && RAPIER.ColliderDesc.convexHull(flat);
    if (!cd) { h.geometry.dispose(); return null; }
    const w = this.physics.world;
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setRotation(quat)
      .setLinvel(vel.x, vel.y, vel.z).setAngvel(angVel).setLinearDamping(0.1).setAngularDamping(0.4).setCcdEnabled(true));
    const col = w.createCollider(cd.setDensity(h.kind === 'mesh' ? h.M.density * 1.5 : h.M.shardDensity).setFriction(0.75).setRestitution(0.15)
      .setCollisionGroups(GROUPS.prop).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    const mesh = new THREE.Mesh(h.geometry, shardMat);
    mesh.castShadow = true;
    addOutline(mesh);
    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    this.scene.add(mesh);
    const ent = { type: 'slice', kind: h.kind, body, mesh, axis: h.axis, th: h.th, M: h.M, baseColor: h.baseColor,
      age: 0, life: T.shells.slicer.pieceLife, sound: h.M.sound };
    ent.sync = this.physics.addSynced(body, mesh);
    this.physics.register(col, ent);
    this.slices.push(ent);
    while (this.slices.length > T.shells.slicer.maxPieces) this.removeSlice(this.slices[0]);
    return ent;
  },

  removeSlice(ent) {
    const i = this.slices.indexOf(ent);
    if (i >= 0) this.slices.splice(i, 1);
    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(ent.body);
    this.scene.remove(ent.mesh);
  },

  removeAny(ent) {
    if (ent.type === 'slice') return this.removeSlice(ent);
    if (ent.type === 'shard') {
      const i = this.shards.indexOf(ent);
      if (i >= 0) this.shards.splice(i, 1);
      return this.removeShard(ent);
    }
    if (ent.type === 'prop') { unregister(ent); ent.owner?.removeProp(ent); }
  },

  /** A plain shot into a sliced piece: crumble it into a few convex chunks. */
  crumble(ent, point, dir) {
    const bt = ent.body.translation(), br = ent.body.rotation();
    const pos = new THREE.Vector3(bt.x, bt.y, bt.z), quat = new THREE.Quaternion(br.x, br.y, br.z, br.w);
    const inv = quat.clone().invert();
    let parts = [uniquePoints(ent.mesh.geometry)];
    const hitL = point.clone().sub(pos).applyQuaternion(inv);
    for (let k = 0; k < 2; k++) {
      const n = randDir(simRand, new THREE.Vector3());
      const pl = { n, d: n.dot(hitL) };
      parts = parts.flatMap((ps) => { const { a, b } = splitConvexPoints(ps, pl); return [a, b].filter((x) => x.length >= 4); });
    }
    const base = ent.baseColor || averageColor(ent.mesh);
    const M = ent.M || MATERIALS.earthenware;
    this.removeAny(ent);
    for (const ps of parts) {
      const h = this.convexHalf(ps, { n: new THREE.Vector3(0, 1, 0), d: 1e9 }, base, M);
      if (!h) continue;
      const wc = h.center.clone().applyQuaternion(quat).add(pos);
      const v = dir.clone().multiplyScalar(2 + simRand() * 2).add(wc.clone().sub(point).normalize().multiplyScalar(1.5));
      const piece = this.spawnPiece(h, wc, quat, v, randDir(simRand, new THREE.Vector3()).multiplyScalar(8));
      if (piece) piece.life = T.shatter.shardLife * 0.6;
    }
    this.fx.shatterBurst(pos, 0.6, dir, M);
    sfx.shatter(0.5, this.game.listenerDistance(pos), M.sound);
  },

  /** Decorative child mesh (sculpture arms etc.) becomes a falling convex chunk. */
  spawnConvexFromMesh(m, dir, color) {
    m.updateWorldMatrix(true, false);
    const pts = uniquePoints(m.geometry).map((p) => p.applyMatrix4(m.matrixWorld));
    const h = this.convexHalf(pts, { n: new THREE.Vector3(0, 1, 0), d: 1e9 }, color, MATERIALS.earthenware);
    if (!h) return;
    const v = (dir || new THREE.Vector3()).clone().multiplyScalar(2).add(new THREE.Vector3(0, 1.5, 0));
    this.spawnPiece(h, h.center.clone(), new THREE.Quaternion(), v, randDir(simRand, new THREE.Vector3()).multiplyScalar(3));
  },
};

function averageColor(mesh) {
  const c = mesh.geometry.attributes.color;
  if (!c) return mesh.material.color?.clone() || new THREE.Color(PALETTE.pot);
  const out = new THREE.Color(0, 0, 0);
  const n = Math.min(c.count, 60);
  for (let i = 0; i < n; i++) { out.r += c.getX(i); out.g += c.getY(i); out.b += c.getZ(i); }
  return out.multiplyScalar(1 / n);
}
