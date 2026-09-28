import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { RAPIER, GROUPS, G, groups } from './physics.js';
import { T, PALETTE } from './config.js';
import { addOutline } from './outline.js';
import { sfx } from './audio.js';
import { PROFILES, prepProfile, buildPotGeometry, hullPoints, fracturePieces, keyOf, MATERIALS, DECOR } from './pottery.js';
import { planeToLocal, splitConvexPoints, splitTriangles, capWall, toGeometry, uniquePoints } from './slicing.js';

export { PROFILES };

const potMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true });
const crackedMat = potMat.clone();
crackedMat.color.setScalar(0.78);
const shardMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true });
const glazeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05, flatShading: true });
const glyphMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow });
const ropeMat = new THREE.MeshStandardMaterial({ color: PALETTE.deep, roughness: 1 });
const ropeGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 5, 1);
const coreMat = new THREE.MeshBasicMaterial({ color: PALETTE.hot });
let haloTex = null;
function halo() {
  if (!haloTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,220,180,0.9)');
    grd.addColorStop(0.3, 'rgba(255,170,110,0.35)');
    grd.addColorStop(1, 'rgba(255,140,80,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  return new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
}

// rope links are contact-free sensors on their own layer
const ROPE_GROUPS = groups(16, 0);
const ROPE_SEGMENTS = 8;

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class Breakables {
  constructor(scene, physics, fx, game) {
    this.scene = scene;
    this.physics = physics;
    this.fx = fx;
    this.game = game;
    this.items = new Set();
    this.shards = [];
    this.debris = new Set(); // non-breakable dynamic props (crates, bricks) for explosions
    this.ropes = new Set();
    this.slices = [];
    physics.forceHandlers.push((h1, h2) => this.onForce(h1, h2));
    physics.collisionHandlers.push((h1, h2) => this.onCollision(h1, h2));
  }

  /**
   * def: { kind, pos:[x,y,z], scale, color, hp, mat, ember, lantern, target, facing:[x,y,z],
   *        hang:{anchor:[x,y,z]}, respawn }
   */
  spawn(def) {
    const kind = def.ember ? 'ember' : def.kind;
    const scale = def.scale ?? 1;
    const P = prepProfile(kind, scale, { mat: def.mat });
    const color = def.color ?? (def.ember ? PALETTE.dark : P.mat === 'porcelain' ? PALETTE.cream : PALETTE.pot);
    const mesh = new THREE.Mesh(buildPotGeometry(P, color), P.mat === 'porcelain' ? glazeMat : potMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh);
    if (def.ember) {
      for (const [y, s] of [[0.42, 1], [0.62, 0.93]]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(P.rMax * 1.01, P.rMax * 0.07, 3, P.segs), glyphMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = P.height * y;
        band.scale.setScalar(s);
        mesh.add(band);
      }
    }
    let extras = null;
    if (DECOR[kind]) {
      extras = DECOR[kind](P, color, def.variant || 0);
      for (const x of extras) { x.castShadow = true; addOutline(x); mesh.add(x); }
    }
    if (def.lantern) {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(P.rMax * 0.45, 0), coreMat);
      core.position.y = P.height * 0.45;
      const h = new THREE.Sprite(halo());
      h.scale.setScalar(P.height * 3.2);
      h.position.y = P.height * 0.5;
      h.renderOrder = 3;
      mesh.add(core, h);
    }
    this.scene.add(mesh);

    const rot = new THREE.Quaternion();
    if (def.facing) rot.setFromUnitVectors(UP, new THREE.Vector3(...def.facing).normalize());
    else if (def.yaw !== undefined) rot.setFromAxisAngle(UP, def.yaw);
    else if (!def.hang) rot.setFromAxisAngle(UP, Math.random() * Math.PI * 2);

    const fixed = !!def.target;
    const bd = (fixed ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
      .setTranslation(def.pos[0], def.pos[1], def.pos[2])
      .setRotation(rot)
      .setCanSleep(true);
    if (!fixed && !def.hang) bd.setSleeping(true);
    if (!fixed) bd.setAngularDamping(0.4).setLinearDamping(0.05);
    const body = this.physics.world.createRigidBody(bd);
    const cd = (RAPIER.ColliderDesc.convexHull(hullPoints(P)) || RAPIER.ColliderDesc.cylinder(P.height / 2, P.rMax))
      .setDensity(P.M.density)
      .setFriction(0.8)
      .setRestitution(0.1)
      .setCollisionGroups(GROUPS.prop)
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
    const col = this.physics.world.createCollider(cd, body);
    col.setContactForceEventThreshold(body.mass() * 45);

    const size = Math.max(P.fullHeight, P.rMax * 2);
    const ent = {
      type: 'breakable', def, kind, P, mesh, body, col, alive: true,
      hp: def.hp ?? PROFILES[kind].hp ?? 100,
      size, color: new THREE.Color(color), extras,
      prevVel: new THREE.Vector3(),
    };
    this.physics.register(col, ent);
    ent.sync = this.physics.addSynced(body, mesh);
    mesh.position.set(...def.pos);
    mesh.quaternion.copy(rot);

    if (def.hang) this.buildRope(ent, def.hang.anchor, P.fullHeight * 0.95);
    if (def.popIn) { mesh.scale.setScalar(0.01); ent.popIn = 0; }
    this.items.add(ent);
    return ent;
  }

  // ---- ropes: a chain of small bodies on reduced-coordinate (multibody) joints,
  // which stay perfectly stiff at any mass ratio, so no stretchy jitter.
  buildRope(ent, anchorPos, topY) {
    const w = this.physics.world;
    const a = new THREE.Vector3(...anchorPos);
    const potTop = new THREE.Vector3(...ent.def.pos).add(new THREE.Vector3(0, topY, 0));
    const len = a.y - potTop.y;
    const segLen = len / ROPE_SEGMENTS;
    const anchor = w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(a.x, a.y, a.z));
    const rope = { ent, anchor, segs: [], joints: [], segLen, cut: false };
    let prev = anchor, prevAnchor = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < ROPE_SEGMENTS; i++) {
      const y = a.y - segLen * (i + 0.5);
      const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(a.x, y, a.z)
        .setLinearDamping(0.12).setAngularDamping(0.6).setCanSleep(true));
      // Sensor links: raycasts still hit them (so you can shoot the rope) but they
      // make no contacts; contacts on multibody links produce NaNs in Rapier.
      const col = w.createCollider(RAPIER.ColliderDesc.capsule(segLen * 0.4, 0.05).setSensor(true).setDensity(0)
        .setCollisionGroups(ROPE_GROUPS), body);
      body.setAdditionalMassProperties(0.12, { x: 0, y: 0, z: 0 }, { x: 0.002, y: 0.0004, z: 0.002 }, { x: 0, y: 0, z: 0, w: 1 }, true);
      const j = w.createMultibodyJoint(RAPIER.JointData.spherical(prevAnchor, { x: 0, y: segLen / 2, z: 0 }), prev, body, true);
      const mesh = new THREE.Mesh(ropeGeo, ropeMat);
      mesh.scale.set(1, segLen * 1.05, 1);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.physics.markLink(body);
      const seg = { body, col, mesh, index: i };
      seg.sync = this.physics.addSynced(body, mesh);
      this.physics.register(col, { type: 'rope', rope, index: i });
      rope.segs.push(seg);
      rope.joints.push(j);
      prev = body;
      prevAnchor = { x: 0, y: -segLen / 2, z: 0 };
    }
    rope.joints.push(w.createMultibodyJoint(RAPIER.JointData.spherical(prevAnchor, { x: 0, y: topY, z: 0 }), prev, ent.body, true));
    this.physics.markLink(ent.body);
    ent.rope = rope;
    this.ropes.add(rope);
  }

  /** Cut the rope just below segment `index`; everything under it falls. */
  cutRope(rope, index, point, dir) {
    const j = rope.joints[index + 1];
    if (!j) return;
    try { this.physics.world.removeMultibodyJoint(j, true); } catch { /* already gone with the pot */ }
    rope.joints[index + 1] = null;
    rope.cut = true;
    const seg = rope.segs[index];
    if (!seg.gone) this.physics.kick(seg.body, _v.copy(dir).multiplyScalar(0.3));
    this.fx.impact(point, _v2.copy(dir).negate(), { color: PALETTE.pale, sparks: 3, dust: 2 });
    sfx.ropeSnap(this.game.listenerDistance(point));
    if (rope.ent.alive) rope.ent.body.wakeUp();
  }

  kickRope(rope, dir, power = 1) {
    const n = rope.segs.length;
    rope.segs.forEach((seg, i) => {
      if (seg.gone) return;
      const k = T.shatter.ropeKick * power * ((i + 1) / n) ** 1.5;
      this.physics.kick(seg.body, { x: dir.x * k, y: dir.y * k + k * 0.35, z: dir.z * k });
    });
  }

  removeRope(rope) {
    for (const s of rope.segs) {
      if (s.gone) continue;
      this.physics.removeSynced(s.sync);
      this.physics.removeBody(s.body);
      this.scene.remove(s.mesh);
    }
    this.physics.world.removeRigidBody(rope.anchor);
    this.ropes.delete(rope);
  }

  // non-breakable dynamic prop (crate, brick) that still reacts to blasts
  addDebris(body, mesh) {
    const ent = { type: 'prop', body, mesh };
    this.debris.add(ent);
    return ent;
  }

  damage(ent, amount, point, dir, power = 1, quiet = false) {
    if (!ent.alive) return false;
    ent.hp -= amount;
    if (ent.hp > 0 && quiet) { if (ent.hp < (PROFILES[ent.kind].hp ?? 100) * 0.5) ent.mesh.material = crackedMat; return false; }
    if (ent.hp > 0) {
      this.physics.kick(ent.body, _v.copy(dir).multiplyScalar(T.weapon.impulse), point);
      this.fx.impact(point, _v2.copy(dir).negate(), { color: PALETTE.pale, sparks: 3, dust: 8 });
      ent.mesh.material = crackedMat;
      sfx.thunk(ent.size, this.game.listenerDistance(point));
      return false;
    }
    this.shatter(ent, point, dir, power);
    return true;
  }

  // Remove the intact pot and replace it with physics shards (and dust).

  // ---- slicing -------------------------------------------------------------

  /** Remove an intact breakable and run its on-break side effects (not the shards). */
  retire(ent, cause, dir, point) {
    ent.alive = false;
    this.items.delete(ent);
    const t = ent.body.translation();
    const center = new THREE.Vector3(t.x, t.y + ent.P.height * 0.45, t.z);
    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(ent.body);
    this.scene.remove(ent.mesh);
    if (ent.rope) this.kickRope(ent.rope, dir || new THREE.Vector3(0, 1, 0), 1);
    this.game.onBroken(ent, cause);
    if (ent.marked) this.game.baubles?.spawn(center, T.lachryma.markedDrop);
    if (ent.def.lantern) { this.fx.embers(center, 30); this.game.baubles?.spawn(center, 1, { up: 1 }); }
    if (ent.def.ember) this.fx.after(cause === 'sliced' ? 0.35 : 0.03, () => this.explode(center));
    if (ent.def.respawn) this.fx.after(ent.def.respawn, () => this.spawn({ ...ent.def, popIn: true }));
    ent.extras?.forEach((x) => this.spawnConvexFromMesh(x, dir, ent.color));
    return center;
  }

  isSliceable(ent) {
    return ent && ((ent.type === 'breakable' && ent.alive) || ent.type === 'slice' || ent.type === 'shard' || (ent.type === 'prop' && ent.sliceable));
  }

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
      return this.spawnPiece(h, worldC, quat, v, new THREE.Vector3().randomDirection().multiplyScalar(2));
    }).filter(Boolean);
  }

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
  }

  /** A loose sliced piece: dynamic, sliceable again, crumbles when shot. */
  spawnPiece(h, pos, quat, vel, angVel) {
    const pts = uniquePoints(h.geometry);
    const flat = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { flat[i * 3] = p.x; flat[i * 3 + 1] = p.y; flat[i * 3 + 2] = p.z; });
    const cd = RAPIER.ColliderDesc.convexHull(flat);
    if (!cd) return null;
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
  }

  removeSlice(ent) {
    const i = this.slices.indexOf(ent);
    if (i >= 0) this.slices.splice(i, 1);
    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(ent.body);
    this.scene.remove(ent.mesh);
  }

  removeAny(ent) {
    if (ent.type === 'slice') return this.removeSlice(ent);
    if (ent.type === 'shard') {
      const i = this.shards.indexOf(ent);
      if (i >= 0) this.shards.splice(i, 1);
      return this.removeShard(ent);
    }
    if (ent.type === 'prop') { ent.owner?.removeProp(ent); }
  }

  /** A plain shot into a sliced piece: crumble it into a few convex chunks. */
  crumble(ent, point, dir) {
    const bt = ent.body.translation(), br = ent.body.rotation();
    const pos = new THREE.Vector3(bt.x, bt.y, bt.z), quat = new THREE.Quaternion(br.x, br.y, br.z, br.w);
    const inv = quat.clone().invert();
    let parts = [uniquePoints(ent.mesh.geometry)];
    const hitL = point.clone().sub(pos).applyQuaternion(inv);
    for (let k = 0; k < 2; k++) {
      const n = new THREE.Vector3().randomDirection();
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
      const v = dir.clone().multiplyScalar(2 + Math.random() * 2).add(wc.clone().sub(point).normalize().multiplyScalar(1.5));
      this.spawnPiece(h, wc, quat, v, new THREE.Vector3().randomDirection().multiplyScalar(8)).life = T.shatter.shardLife * 0.6;
    }
    this.fx.shatterBurst(pos, 0.6, dir, M);
    sfx.shatter(0.5, this.game.listenerDistance(pos), M.sound);
  }

  /** Decorative child mesh (sculpture arms etc.) becomes a falling convex chunk. */
  spawnConvexFromMesh(m, dir, color) {
    m.updateWorldMatrix(true, false);
    const pts = uniquePoints(m.geometry).map((p) => p.applyMatrix4(m.matrixWorld));
    const h = this.convexHalf(pts, { n: new THREE.Vector3(0, 1, 0), d: 1e9 }, color, MATERIALS.earthenware);
    if (!h) return;
    const v = (dir || new THREE.Vector3()).clone().multiplyScalar(2).add(new THREE.Vector3(0, 1.5, 0));
    this.spawnPiece(h, h.center.clone(), new THREE.Quaternion(), v, new THREE.Vector3().randomDirection().multiplyScalar(3));
  }

  shatter(ent, hitPoint, dir, power = 1, cause = 'shot') {
    if (!ent.alive) return;
    ent.alive = false;
    this.items.delete(ent);

    const body = ent.body;
    const bt = body.translation(), br = body.rotation();
    const bodyPos = new THREE.Vector3(bt.x, bt.y, bt.z);
    const bodyRot = new THREE.Quaternion(br.x, br.y, br.z, br.w);
    const lv = body.linvel(), av = body.angvel();
    const linVel = new THREE.Vector3(lv.x, lv.y, lv.z);
    const angVel = new THREE.Vector3(av.x, av.y, av.z);
    const P = ent.P;

    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(body);
    this.scene.remove(ent.mesh);

    const center = this.burst(P, ent.color, bodyPos, bodyRot, linVel, angVel, hitPoint, dir, power, ent.size);
    this.game.onBroken(ent, cause);

    // the rope loses its weight and takes the hit: whip the lower links along the shot
    if (ent.rope) this.kickRope(ent.rope, dir || new THREE.Vector3(0, 1, 0), power);

    if (ent.marked) this.game.baubles?.spawn(center, T.lachryma.markedDrop);
    ent.extras?.forEach((x) => this.spawnConvexFromMesh(x, dir, ent.color));
    if (ent.def.lantern) { this.fx.embers(center, 30); this.game.baubles?.spawn(center, 1, { up: 1 }); }
    if (ent.def.ember) this.fx.after(0.03, () => this.explode(center));
    if (ent.def.respawn) this.fx.after(ent.def.respawn, () => this.spawn({ ...ent.def, popIn: true }));
  }

  /** Turn a lathe body (at a transform) into shards + dust. Returns its centre. */
  burst(P, color, bodyPos, bodyRot, linVel, angVel, hitPoint, dir, power, size) {
    const M = P.M;
    const invRot = bodyRot.clone().invert();
    const center = new THREE.Vector3(0, P.height * 0.45, 0).applyQuaternion(bodyRot).add(bodyPos);
    const hitLocal = (hitPoint ? hitPoint.clone() : center.clone()).sub(bodyPos).applyQuaternion(invRot);
    const dirN = (dir ? dir.clone() : new THREE.Vector3(0, -1, 0)).normalize();

    // overloaded? merge into chunkier shards
    const load = this.shards.length / T.shatter.maxShards;
    const extra = T.shatter.maxChunk - 3 + (load > 0.5 ? 2 : 0) + (load > 0.8 ? 3 : 0);
    const pieces = fracturePieces(P, hitLocal, Math.max(0, extra));

    // porcelain: only a few slivers survive, the rest puffs into glittering dust
    if (pieces.length > M.keep) {
      pieces.sort(() => Math.random() - 0.5);
      const dust = pieces.splice(M.keep);
      const pts = dust.map((pc) => pc.points[0].clone().applyQuaternion(bodyRot).add(bodyPos));
      this.fx.glitter(pts, center, dirN, color);
    }
    const ctx = { bodyPos, bodyRot, linVel, angVel, center, hitPoint: hitPoint || center, dirN, power, color,
      fractureCol: new THREE.Color(M.fracture), M };
    for (const pc of pieces) this.spawnShard(pc, ctx);

    this.fx.shatterBurst(center, Math.max(0.5, size * 2), dirN, M);
    sfx.shatter(Math.max(0.4, size * 2.2), this.game.listenerDistance(center), M.sound);
    return center;
  }

  spawnShard(pc, ctx) {
    const { bodyPos, bodyRot, linVel, angVel, center, hitPoint, dirN, power, color, fractureCol, M } = ctx;
    const pts = pc.points;
    const c = new THREE.Vector3();
    for (const p of pts) c.add(p);
    c.divideScalar(pts.length);
    const local = pts.map((p) => p.clone().sub(c));
    let geo;
    try { geo = new ConvexGeometry(local); } catch { return; }
    if (!geo.attributes.position || geo.attributes.position.count < 4) return;
    // glazed/patterned outer skin vs fresh fracture surfaces
    const innerSet = new Set(pc.innerKeys);
    const pa = geo.attributes.position;
    const cols = new Float32Array(pa.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pa.count; i++) {
      const k = keyOf(pa.getX(i) + c.x, pa.getY(i) + c.y, pa.getZ(i) + c.z);
      if (innerSet.has(k)) tmp.copy(fractureCol);
      else tmp.copy(color).multiplyScalar(pc.colors.get(k) ?? 1);
      cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const flat = new Float32Array(local.length * 3);
    local.forEach((p, i) => { flat[i * 3] = p.x; flat[i * 3 + 1] = p.y; flat[i * 3 + 2] = p.z; });
    const cd = RAPIER.ColliderDesc.convexHull(flat);
    if (!cd) { geo.dispose(); return; }

    const worldC = c.clone().applyQuaternion(bodyRot).add(bodyPos);
    const r = worldC.clone().sub(bodyPos);
    const vel = linVel.clone().add(new THREE.Vector3().crossVectors(angVel, r));
    const radial = worldC.clone().sub(center);
    radial.divideScalar(radial.length() || 1);
    const nearHit = Math.max(0, 1 - worldC.distanceTo(hitPoint) / 0.6);
    const heavy = M.sound === 'stone' ? 0.75 : 1; // big stoneware slabs fly less
    vel.addScaledVector(radial, T.shatter.radialBurst * power * heavy * (0.6 + Math.random() * 0.8));
    vel.addScaledVector(dirN, T.shatter.bulletPush * power * heavy * (0.25 + nearHit) * (0.5 + Math.random()));
    vel.y += T.shatter.upBias * power * Math.random();

    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(worldC.x, worldC.y, worldC.z)
        .setRotation(bodyRot)
        .setLinvel(vel.x, vel.y, vel.z)
        .setAngvel(new THREE.Vector3().randomDirection().multiplyScalar(T.shatter.spin * power * heavy * Math.random()))
        .setCcdEnabled(pc.small)
        .setLinearDamping(0.1)
        .setAngularDamping(0.5),
    );
    const col = this.physics.world.createCollider(
      cd.setDensity(M.shardDensity).setFriction(0.7).setRestitution(0.2).setCollisionGroups(GROUPS.debris)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    const mesh = new THREE.Mesh(geo, M.sound === 'glass' ? glazeMat : shardMat);
    mesh.castShadow = true;
    if (T.shatter.shardOutlines) addOutline(mesh);
    mesh.position.copy(worldC);
    mesh.quaternion.copy(bodyRot);
    this.scene.add(mesh);
    const ent = { type: 'shard', body, mesh, age: 0, life: T.shatter.shardLife * (0.8 + Math.random() * 0.4), sound: M.sound, M, baseColor: color };
    ent.sync = this.physics.addSynced(body, mesh);
    this.physics.register(col, ent);
    this.shards.push(ent);
    while (this.shards.length > T.shatter.maxShards) this.removeShard(this.shards.shift());
  }

  removeShard(s) {
    this.physics.removeSynced(s.sync);
    this.physics.removeBody(s.body);
    this.scene.remove(s.mesh);
    s.mesh.geometry.dispose();
  }

  /** Radial blast: chain-breaks pots inside `breakFrac` of the radius, shoves the rest. */
  explode(center, { radius = T.explosion.radius, breakFrac = 0.75, velocity = T.explosion.velocity, fx = true, cause = 'explosion' } = {}) {
    const R = radius;
    if (fx) {
      this.fx.explosion(center, R);
      sfx.explosion(this.game.listenerDistance(center));
      this.game.onExplosion(center, R);
    }
    for (const ent of [...this.items]) {
      const p = ent.body.translation();
      const d = _v.set(p.x, p.y, p.z).distanceTo(center);
      if (d < R * breakFrac) {
        const dir = _v.clone().sub(center).normalize();
        const hp = _v.clone();
        this.fx.after(T.explosion.chainDelay * (d / R) * 3 + Math.random() * 0.03, () => this.shatter(ent, hp, dir, 1.4, cause));
      } else if (d < R) {
        this.push(ent.body, center, R, velocity);
      }
    }
    for (const s of this.shards) this.push(s.body, center, R, velocity);
    for (const s of this.slices) this.push(s.body, center, R, velocity);
    for (const d of this.debris) this.push(d.body, center, R, velocity);
    for (const r of this.ropes) for (const s of r.segs) if (!s.gone) this.push(s.body, center, R, velocity * 0.5);
    this.game.clappers?.blast(center, R);
  }

  push(body, center, R, velocity = T.explosion.velocity) {
    const p = body.translation();
    _v.set(p.x - center.x, p.y - center.y, p.z - center.z);
    const d = _v.length();
    if (d > R || d < 1e-3) return;
    const k = (1 - d / R) * velocity * body.mass();
    _v.divideScalar(d).multiplyScalar(k);
    _v.y += k * 0.35;
    this.physics.kick(body, _v);
  }

  // Record velocities before the physics step so impact breaks use pre-collision speed.
  preStep() {
    for (const ent of this.items) {
      if (ent.body.isSleeping()) { ent.prevVel.set(0, 0, 0); continue; }
      const v = ent.body.linvel();
      ent.prevVel.set(v.x, v.y, v.z);
    }
  }

  onForce(h1, h2) {
    const e1 = this.physics.byCollider.get(h1), e2 = this.physics.byCollider.get(h2);
    if (e1?.type !== 'breakable' && e2?.type !== 'breakable') return;
    const vel = (e) => e?.prevVel || (e?.body && !e.body.isFixed() ? e.body.linvel() : { x: 0, y: 0, z: 0 });
    const v1 = vel(e1), v2 = vel(e2);
    const rel = Math.hypot(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    if (rel < T.shatter.breakSpeed) return;
    const massOf = (e) => (!e?.body || e.body.isFixed() ? Infinity : e.body.mass());
    for (const [e, v, o] of [[e1, v1, e2], [e2, v2, e1]]) {
      if (e?.type !== 'breakable' || !e.alive || e.def.target) continue;
      if (massOf(o) < 0.25 * e.body.mass()) continue; // light shards don't bust whole pots
      const dir = new THREE.Vector3(v.x, v.y, v.z);
      if (dir.lengthSq() < 0.01) dir.set(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z).multiplyScalar(e === e1 ? -1 : 1);
      const p = e.body.translation();
      const hp = new THREE.Vector3(p.x, p.y, p.z).addScaledVector(dir.clone().normalize(), e.size * 0.4);
      this.fx.after(0, () => this.shatter(e, hp, dir.normalize().multiplyScalar(0.4), Math.min(1.2, rel / 8), 'impact'));
    }
  }

  onCollision(h1, h2) {
    for (const h of [h1, h2]) {
      const e = this.physics.byCollider.get(h);
      if (!e || (e.type !== 'shard' && e.type !== 'casing' && e.type !== 'slice')) continue;
      const v = e.body.linvel();
      const sp = Math.hypot(v.x, v.y, v.z);
      if (sp < 1.2) continue;
      const p = e.body.translation();
      const dist = this.game.listenerDistance(_v.set(p.x, p.y, p.z));
      if (e.type === 'shard' || e.type === 'slice') sfx.clink(sp, dist, e.sound);
      else sfx.casing(dist);
      return;
    }
  }

  update(dt) {
    for (const ent of this.items) {
      if (ent.popIn !== undefined) {
        ent.popIn = Math.min(1, ent.popIn + dt * 4);
        const t = ent.popIn;
        ent.mesh.scale.setScalar(1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2)); // easeOutBack
        if (t >= 1) { ent.mesh.scale.setScalar(1); delete ent.popIn; }
      }
      if (ent.mesh.position.y < -20) this.shatter(ent, null, null, 0.1);
    }
    for (const r of this.ropes) {
      if (!r.cut) continue;
      for (const seg of r.segs) {
        if (seg.gone || seg.body.translation().y > 0.05) continue;
        seg.gone = true; // severed pieces have no contacts, so tidy them up at the floor
        this.physics.removeSynced(seg.sync);
        this.physics.removeBody(seg.body);
        this.scene.remove(seg.mesh);
      }
    }
    for (let i = this.slices.length - 1; i >= 0; i--) {
      const sl = this.slices[i];
      sl.age += dt;
      const fade = sl.life - sl.age;
      if (fade < 0.6) {
        sl.mesh.scale.setScalar(Math.max(0.01, fade / 0.6));
        if (fade <= 0) this.removeSlice(sl);
      }
    }
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.age += dt;
      const fade = s.life - s.age;
      if (fade < 0.6) {
        s.mesh.scale.setScalar(Math.max(0.01, fade / 0.6));
        if (fade <= 0) { this.removeShard(s); this.shards.splice(i, 1); }
      }
    }
  }

  clear() {
    for (const r of [...this.ropes]) this.removeRope(r);
    for (const ent of this.items) {
      this.physics.removeSynced(ent.sync);
      this.physics.removeBody(ent.body);
      this.scene.remove(ent.mesh);
    }
    this.items.clear();
    for (const s of this.shards) this.removeShard(s);
    this.shards.length = 0;
    for (const sl of [...this.slices]) this.removeSlice(sl);
  }
}

function averageColor(mesh) {
  const c = mesh.geometry.attributes.color;
  if (!c) return mesh.material.color?.clone() || new THREE.Color(PALETTE.pot);
  const out = new THREE.Color(0, 0, 0);
  const n = Math.min(c.count, 60);
  for (let i = 0; i < n; i++) { out.r += c.getX(i); out.g += c.getY(i); out.b += c.getZ(i); }
  return out.multiplyScalar(1 / n);
}
