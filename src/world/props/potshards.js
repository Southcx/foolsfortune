// ---------------------------------------------------------------------------------------
// POT SHARDS: how a pot breaks. `shatter` takes the intact pot out of the world and says whose doing it was (`by`; only the Courier's
// count); `burst` resamples its surface on a jittered grid and groups it into shards, each the convex hull of its outer and inner points
// (`spawnShard`: a mesh and an exact collider, drawn by the shard batch, or, when small, a chip with no body that flies, bounces and
// settles on the floor found under it: `updateFlyers`); stoneware breaks in slabs, earthenware in shards, porcelain in a few slivers
// and glittering dust. `removeShard` takes one out of the world. What a break leaves behind is potwrecks.js's.
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
// Prior art: Red Faction and Battlefield's destruction, Voronoi fracture done cheap (a jittered grid); the debris particle of every
// engine since Red Faction, for the chips: only the pieces big enough to matter are simulated.
//
//   POT_SHARDS: shatter(ent, hitPoint, dir, power, cause, who)   burst(P, color, bodyPos, bodyRot, linVel, angVel, hitPoint, dir, power, size) -> centre
//               spawnShard(piece, ctx)   removeShard(shard)   updateFlyers(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';
import { sfx } from '../../audio/sfx.js';
import { fracturePieces, keyOf } from './pottery.js';
import { safeHullPoints } from '../../tools/slicing.js';
import { stream, randDir } from '../../core/rng.js';
import { shardMat, glazeMat } from './potmaterials.js';

/** A broken pot's share of debris on this machine: the tier's `debris`, and a phone's 0.25 whatever its tier (the owner, 2026-10-25:
 *  bigger sherds and fewer of them on a mobile client; PS1-style, the pieces that matter simulated and the rest let go). */
export const debrisK = (game) => Math.min(T.visual.debris ?? 1, game?.graphics?.machine?.mobile ? 0.25 : 1);
/** The shard and chip caps at that share. */
export const debrisCaps = (game) => { const k = debrisK(game); return { shards: Math.max(24, Math.round(T.shatter.maxShards * k)), flyers: Math.max(32, Math.round(T.shatter.maxFlyers * k)), k }; };
import { COURIER_CAUSES } from './potdamage.js';
const simRand = stream('world/props/breakables'); // (the simulation's chance: core/rng.js, the same twice; the breakables' one stream, drawn from by every part)

const _down = new THREE.Vector3(0, -1, 0), _fq = new THREE.Quaternion(), _fa = new THREE.Vector3();

export const POT_SHARDS = {
  // Remove the intact pot and replace it with physics shards (and dust).
  shatter(ent, hitPoint, dir, power = 1, cause = 'shot', who = null) {
    if (!ent.alive) return;
    ent.alive = false;
    who = who || (COURIER_CAUSES.has(cause) ? 'courier' : this.instigatorOf(ent) || 'environment');
    ent.by = who;
    this.items.delete(ent); this.release(ent);

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
    this.game.onBroken(ent, cause, who);

    // the rope loses its weight and takes the hit: whip the lower links along the shot
    if (ent.rope) this.kickRope(ent.rope, dir || new THREE.Vector3(0, 1, 0), power);

    if (ent.marked) this.game.baubles?.spawn(center, T.lachryma.markedDrop);
    this.onGone(ent, bodyPos);
    ent.extras?.forEach((x) => this.spawnConvexFromMesh(x, dir, ent.color));
    if (ent.def.lantern) { this.fx.embers(center, 30); this.game.baubles?.spawn(center, 1, { up: 1 }); }
    if (ent.def.baubles) this.game.baubles?.spawn(center, ent.def.baubles); // (the Throwing Room's pots: Lachryma to keep firing, nothing else)
    if (ent.def.slip) this.game.shells?.spill(center, dir || new THREE.Vector3(0, -1, 0));
    if (ent.def.ember || ent.ember) this.fx.after(0.03, () => this.explode(center, { who }));
    if (ent.def.respawn) this.fx.after(ent.def.respawn, () => this.spawn({ ...ent.def, popIn: true }));
  },

  /** Turn a lathe body (at a transform) into shards + dust. Returns its centre. */
  burst(P, color, bodyPos, bodyRot, linVel, angVel, hitPoint, dir, power, size) {
    const M = P.M;
    const invRot = bodyRot.clone().invert();
    const center = new THREE.Vector3(0, P.height * 0.45, 0).applyQuaternion(bodyRot).add(bodyPos);
    const hitLocal = (hitPoint ? hitPoint.clone() : center.clone()).sub(bodyPos).applyQuaternion(invRot);
    const dirN = (dir ? dir.clone() : new THREE.Vector3(0, -1, 0)).normalize();

    // overloaded? merge into chunkier shards
    const cap = debrisCaps(this.game), load = this.shards.length / cap.shards;
    const extra = T.shatter.maxChunk - 3 + (load > 0.5 ? 2 : 0) + (load > 0.8 ? 3 : 0);
    const pieces = fracturePieces(P, hitLocal, Math.max(0, extra), 1 / Math.sqrt(cap.k)); // (below 1, a coarser grid: at 0.25, sherds 4x the area)

    // porcelain: only a few slivers survive, the rest puffs into glittering dust
    if (pieces.length > M.keep) {
      pieces.sort(() => simRand() - 0.5);
      const dust = pieces.splice(M.keep);
      const pts = dust.map((pc) => pc.points[0].clone().applyQuaternion(bodyRot).add(bodyPos));
      this.fx.glitter(pts, center, dirN, color);
    }
    const ctx = { bodyPos, bodyRot, linVel, angVel, center, hitPoint: hitPoint || center, dirN, power, color,
      fractureCol: new THREE.Color(M.fracture), M };
    for (const pc of pieces) this.spawnShard(pc, ctx);

    this.fx.shatterBurst(center, Math.max(0.5, size * 2), dirN, M);
    sfx.shatter(Math.max(0.4, size * 2.2), this.game.listenerDistance(center), M.sound);
    this.game.ai?.stimuli.emit('noise', center, { radius: 10 + size * 8, strength: 0.8 }); // (a pot breaking is heard: creatures/ai/stimuli.js)
    return center;
  },

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

    const worldC = c.clone().applyQuaternion(bodyRot).add(bodyPos);
    const r = worldC.clone().sub(bodyPos);
    const vel = linVel.clone().add(new THREE.Vector3().crossVectors(angVel, r));
    const radial = worldC.clone().sub(center);
    radial.divideScalar(radial.length() || 1);
    const nearHit = Math.max(0, 1 - worldC.distanceTo(hitPoint) / 0.6);
    const heavy = M.sound === 'stone' ? 0.75 : 1; // big stoneware slabs fly less
    vel.addScaledVector(radial, T.shatter.radialBurst * power * heavy * (0.6 + simRand() * 0.8));
    vel.addScaledVector(dirN, T.shatter.bulletPush * power * heavy * (0.25 + nearHit) * (0.5 + simRand()));
    vel.y += T.shatter.upBias * power * simRand();

    // a small chip has no body: it flies, bounces and settles on the floor found under it, drawn in the shard batch (the debris
    // particle of every engine since Red Faction: only the pieces big enough to matter are simulated)
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    if (geo.boundingSphere.radius < T.shatter.flyR && !T.shatter.shardOutlines) {
      const sb = this.shardBatch[M.sound === 'glass' ? 'glass' : 'earth'];
      const proxy = new THREE.Object3D(); proxy.position.copy(worldC); proxy.quaternion.copy(bodyRot);
      const slot = sb.take(geo, proxy);
      geo.dispose();
      if (slot == null) return;
      const down = this.physics.raycast(worldC, _down, 6, undefined, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic());
      const spin = randDir(simRand, new THREE.Vector3()).multiplyScalar(T.shatter.spin * power * heavy * simRand());
      this.flyers.push({ mesh: proxy, sb, slot, vel, spin, r: geo.boundingSphere.radius, floor: down ? down.point.y : worldC.y - 6, age: 0, life: T.shatter.shardLife * Math.sqrt(debrisK(this.game)) * 0.6 * (0.8 + simRand() * 0.4), rest: false });
      while (this.flyers.length > debrisCaps(this.game).flyers) { const f = this.flyers.shift(); f.sb.give(f.slot); }
      return;
    }
    const flat = safeHullPoints(local, 0.004);
    const cd = flat && RAPIER.ColliderDesc.convexHull(flat);
    if (!cd) { geo.dispose(); return; }

    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(worldC.x, worldC.y, worldC.z)
        .setRotation(bodyRot)
        .setLinvel(vel.x, vel.y, vel.z)
        .setAngvel(randDir(simRand, new THREE.Vector3()).multiplyScalar(T.shatter.spin * power * heavy * simRand()))
        .setCcdEnabled(pc.small)
        .setLinearDamping(0.1)
        .setAngularDamping(0.5),
    );
    const col = this.physics.world.createCollider(
      cd.setDensity(M.shardDensity).setFriction(0.7).setRestitution(0.2).setCollisionGroups(GROUPS.debris)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    // drawn by the shard batch (its `mesh` a stand-in the body moves); a piece too big for a slot is a mesh of its own
    const sb = this.shardBatch[M.sound === 'glass' ? 'glass' : 'earth'];
    let mesh = new THREE.Object3D();
    mesh.position.copy(worldC); mesh.quaternion.copy(bodyRot);
    const slot = T.shatter.shardOutlines ? null : sb.take(geo, mesh);
    if (slot == null) {
      mesh = new THREE.Mesh(geo, M.sound === 'glass' ? glazeMat : shardMat);
      mesh.castShadow = true;
      if (T.shatter.shardOutlines) addOutline(mesh);
      mesh.position.copy(worldC);
      mesh.quaternion.copy(bodyRot);
      this.scene.add(mesh);
    } else geo.dispose(); // (its data is in the batch now)
    const ent = { type: 'shard', body, mesh, slot, sb: slot == null ? null : sb, age: 0, life: T.shatter.shardLife * Math.sqrt(debrisK(this.game)) * (0.8 + simRand() * 0.4), sound: M.sound, M, baseColor: color };
    ent.sync = this.physics.addSynced(body, mesh);
    this.physics.register(col, ent);
    this.shards.push(ent);
    while (this.shards.length > debrisCaps(this.game).shards) this.removeShard(this.shards.shift());
  },

  removeShard(s) {
    this.physics.removeSynced(s.sync);
    this.physics.removeBody(s.body);
    if (s.sb) { s.sb.give(s.slot); s.sb = null; return; }
    this.scene.remove(s.mesh);
    s.mesh.geometry?.dispose();
  },

  /** The chips with no body: gravity, a bounce on the floor under them, a tumble that dies away, a shrink at the end. */
  updateFlyers(dt) {
    const g = T.physics.gravity, q = _fq;
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i], m = f.mesh;
      f.age += dt;
      const fade = f.life - f.age;
      if (fade <= 0) { f.sb.give(f.slot); this.flyers.splice(i, 1); continue; }
      if (!f.rest) {
        f.vel.y -= g * dt;
        m.position.addScaledVector(f.vel, dt);
        const sp = f.spin.length();
        if (sp > 1e-3) { q.setFromAxisAngle(_fa.copy(f.spin).divideScalar(sp), sp * dt); m.quaternion.premultiply(q); }
        const fl = f.floor + f.r * 0.45;
        if (m.position.y < fl) {
          m.position.y = fl;
          if (f.vel.y < -0.6) { f.vel.y *= -0.3; f.vel.x *= 0.55; f.vel.z *= 0.55; f.spin.multiplyScalar(0.5); }
          else { f.rest = true; }
        }
        if (m.position.y < f.floor - 1) f.age = f.life; // (fell past where it should have landed: off a ledge, gone)
      }
      if (fade < 0.6) m.scale.setScalar(Math.max(0.01, fade / 0.6));
    }
  },
};
