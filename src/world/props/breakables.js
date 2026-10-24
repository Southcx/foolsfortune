// ---------------------------------------------------------------------------------------
// BREAKABLES: the pots, urns and lanterns, and how they break. A pot is a lathe (profile by segments, lobes, twist and flame crests) in
// one of three clay bodies that break differently (stoneware in slabs, earthenware in shards, porcelain in slivers and dust). On a
// break its surface is resampled on a jittered grid and grouped into shards, each the convex hull of its outer and inner points (a mesh
// and an exact collider). Crack stages first; ember urns chain-explode; lanterns hang on ropes of sensor links on multibody joints. Who
// broke it is said (`by`), and only the Courier's count.
//
// This file is the class: the set of live pots (`items`) and what else it keeps (the shards, the chips with no body, the sliced pieces,
// the wrecks, the ropes, the loose props), the frame (`preStep`, `update`), the physics hooks (`onForce`: a hard knock breaks a pot;
// `onCollision`: shards clink), the blast (`explode`) and `clear`. Its other jobs are laid onto it as methods, a module each, split out
// to keep it under the module contract's 800 lines: potbuilding.js (spawn, reshape), potropes.js (the ropes lanterns hang on),
// potdamage.js (who did it, a blow's damage, the cracks), potslicing.js (a pot cut by a plane), potshards.js (shatter, the shards and
// the chips), potwrecks.js (what a break leaves, and mending), potrest.js (a pot at rest, in the prop batch); the materials they share
// are potmaterials.js.
//
// Prior art: Zelda's pots, Red Faction and Battlefield's destruction, Voronoi fracture done cheap (a jittered grid), Katamari's clutter.
//
//   const B = new Breakables(...)   B.spawn(...)   B.damage(...)   B.preStep()   B.update(dt)   B.mendWithin(at, r) -> n   PROFILES
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { ShardBatch } from '../../render/shardbatch.js';
import { PropBatch, InstancePool } from '../../render/propbatch.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
import { shardMat, glazeMat } from './potmaterials.js';
import { COURIER_CAUSES, FRAGILE, POT_DAMAGE } from './potdamage.js';
import { ropeGeo, ropeMat, POT_ROPES } from './potropes.js';
import { POT_BUILDING } from './potbuilding.js';
import { POT_SLICING } from './potslicing.js';
import { POT_SHARDS } from './potshards.js';
import { POT_WRECKS } from './potwrecks.js';
import { POT_REST } from './potrest.js';
const simRand = stream('world/props/breakables'); // (the simulation's chance: core/rng.js, the same twice; the breakables' one stream, drawn from by every part)

export { PROFILES } from './pottery.js';

const _v = new THREE.Vector3();

export class Breakables {
  constructor(scene, physics, fx, game) {
    this.scene = scene;
    this.physics = physics;
    this.fx = fx;
    this.game = game;
    this.items = new Set();
    this.batch = new PropBatch(scene); // (pots at rest, drawn together)
    this.ropeDraw = new InstancePool(scene, ropeGeo, ropeMat); // (every rope segment in one draw)
    this.shards = [];
    this.flyers = []; // the chips without bodies (spawnShard)
    // every loose shard in one draw per look (render/shardbatch.js): slots reserved once, filled when a pot breaks
    this.shardBatch = { earth: new ShardBatch(scene, shardMat, { slots: T.shatter.maxShards + T.shatter.maxFlyers, verts: 192 }), glass: new ShardBatch(scene, glazeMat, { slots: 160, verts: 192 }) };
    this.debris = new Set(); // non-breakable dynamic props (crates, bricks) for explosions
    this.ropes = new Set();
    this.slices = [];
    this.wrecks = []; // broken pots the clapperjars can rebuild (kintsugi)
    physics.forceHandlers.push((h1, h2) => this.onForce(h1, h2));
    physics.collisionHandlers.push((h1, h2) => this.onCollision(h1, h2));
  }

  // non-breakable dynamic prop (crate, brick) that still reacts to blasts
  addDebris(body, mesh) {
    const ent = { type: 'prop', body, mesh };
    this.debris.add(ent);
    return ent;
  }

  /** Take an intact pot away without breaking it (no shards, no side effects). */
  removeQuiet(ent) {
    if (!ent.alive || ent.rope) return;
    ent.alive = false;
    this.items.delete(ent); this.release(ent);
    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(ent.body);
    this.scene.remove(ent.mesh);
  }

  /** Radial blast: chain-breaks pots inside `breakFrac` of the radius, shoves the rest. */
  explode(center, { radius = T.explosion.radius, breakFrac = 0.75, velocity = T.explosion.velocity, fx = true, cause = 'explosion', who = null } = {}) {
    who = who || (COURIER_CAUSES.has(cause) ? 'courier' : 'environment');
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
        this.fx.after(T.explosion.chainDelay * (d / R) * 3 + simRand() * 0.03, () => this.shatter(ent, hp, dir, 1.4, cause, who));
      } else if (d < R) {
        this.push(ent.body, center, R, velocity);
        this.instigate(ent, who);
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
      if (ent.sleepAfter) { if (ent.stepped) { ent.sleepAfter = false; ent.body.sleep(); } else ent.stepped = true; } // (after its first step: see spawn)
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
    const frag = Math.min(e1?.type === 'breakable' ? FRAGILE[e1.crackStage || 0] : 1, e2?.type === 'breakable' ? FRAGILE[e2.crackStage || 0] : 1);
    if (rel < T.shatter.breakSpeed * frag) return;
    const massOf = (e) => (!e?.body || e.body.isFixed() ? Infinity : e.body.mass());
    for (const [e, v, o] of [[e1, v1, e2], [e2, v2, e1]]) {
      if (e?.type !== 'breakable' || !e.alive || e.def.target) continue;
      if (massOf(o) < 0.25 * e.body.mass()) continue; // light shards don't bust whole pots
      const dir = new THREE.Vector3(v.x, v.y, v.z);
      if (dir.lengthSq() < 0.01) dir.set(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z).multiplyScalar(e === e1 ? -1 : 1);
      const p = e.body.translation();
      const hp = new THREE.Vector3(p.x, p.y, p.z).addScaledVector(dir.clone().normalize(), e.size * 0.4);
      const who = this.instigatorOf(o) || this.instigatorOf(e); // (what hit it, and who set that going; or who set this going)
      this.fx.after(0, () => this.shatter(e, hp, dir.normalize().multiplyScalar(0.4), Math.min(1.2, rel / 8), 'impact', who));
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
    this.clock = (this.clock || 0) + dt;
    this.ropeDraw.update();
    for (const ent of this.debris) if (ent.owner?.dynamic) this.restProp(ent);
    for (const ent of this.items) {
      this.settle(ent, dt);
      this.rest(ent);
      if (ent.popIn !== undefined) {
        ent.popIn = Math.min(1, ent.popIn + dt * 4);
        const t = ent.popIn;
        ent.mesh.scale.setScalar(1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2)); // easeOutBack
        if (t >= 1) { ent.mesh.scale.setScalar(1); delete ent.popIn; }
      }
      // (fallen out of the world: well below where it was put. Not a fixed height: the dunes and their oasis are 400 m down)
      if (ent.mesh.position.y < ent.def.pos[1] - 40) this.shatter(ent, null, null, 0.1, 'fall');
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
    this.updateFlyers(dt);
    this.shardBatch.earth.update(); this.shardBatch.glass.update();
  }

  clear() {
    for (const r of [...this.ropes]) this.removeRope(r);
    for (const ent of this.items) {
      this.release(ent);
      this.physics.removeSynced(ent.sync);
      this.physics.removeBody(ent.body);
      this.scene.remove(ent.mesh);
    }
    this.items.clear();
    this.wrecks = [];
    for (const s of this.shards) this.removeShard(s);
    this.shards.length = 0;
    for (const f of this.flyers) f.sb.give(f.slot);
    this.flyers.length = 0;
    for (const sl of [...this.slices]) this.removeSlice(sl);
  }
}

// (the class's other jobs, one module each, laid on as methods: not enumerable, as the methods of a class body are)
for (const part of [POT_BUILDING, POT_ROPES, POT_DAMAGE, POT_SLICING, POT_SHARDS, POT_WRECKS, POT_REST]) {
  for (const key of Object.keys(part)) Object.defineProperty(Breakables.prototype, key, { value: part[key], writable: true, configurable: true });
}
