import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { T } from './config.js';

export { RAPIER };

// Collision layers (membership << 16 | filter)
export const G = { STATIC: 1, PLAYER: 2, PROP: 4, DEBRIS: 8 };
export const groups = (member, filter) => (member << 16) | filter;
export const GROUPS = {
  static: groups(G.STATIC, 0xffff),
  player: groups(G.PLAYER, G.STATIC | G.PROP | G.DEBRIS),
  prop: groups(G.PROP, 0xffff),
  debris: groups(G.DEBRIS, G.STATIC | G.PROP | G.DEBRIS | G.PLAYER),
  // what the character controller treats as solid (debris gets shoved, not stood on)
  controllerQuery: groups(0xffff, G.STATIC | G.PROP),
};

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

export class Physics {
  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -T.physics.gravity, z: 0 });
    this.events = new RAPIER.EventQueue(true);
    this.synced = new Set(); // { body, mesh }
    this.byCollider = new Map(); // collider handle -> entity
    this.forceHandlers = [];
    this.collisionHandlers = [];
  }

  setGravity(g) { this.world.gravity = { x: 0, y: -g, z: 0 }; }

  register(collider, entity) { this.byCollider.set(collider.handle, entity); }
  entityOf(collider) { return collider ? this.byCollider.get(collider.handle) : undefined; }

  addSynced(body, mesh) {
    const s = { body, mesh };
    this.synced.add(s);
    return s;
  }

  removeSynced(s) { this.synced.delete(s); }

  removeBody(body) {
    for (let i = 0; i < body.numColliders(); i++) this.byCollider.delete(body.collider(i).handle);
    this.world.removeRigidBody(body);
  }

  step(dt) {
    this.world.timestep = dt;
    this.world.step(this.events);
    this.events.drainContactForceEvents((e) => {
      for (const h of this.forceHandlers) h(e.collider1(), e.collider2(), e.maxForceMagnitude(), e);
    });
    this.events.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      for (const h of this.collisionHandlers) h(h1, h2);
    });
  }

  sync() {
    for (const s of this.synced) {
      const t = s.body.translation();
      const r = s.body.rotation();
      s.mesh.position.set(t.x, t.y, t.z);
      s.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  /** Ray query returning { collider, point, normal, distance, entity } or null. */
  raycast(origin, dir, maxDist, excludeCollider, filterGroups) {
    const ray = new RAPIER.Ray(origin, dir);
    const hit = this.world.castRayAndGetNormal(ray, maxDist, true, undefined, filterGroups, excludeCollider);
    if (!hit) return null;
    const d = hit.timeOfImpact;
    return {
      collider: hit.collider,
      distance: d,
      point: new THREE.Vector3(origin.x + dir.x * d, origin.y + dir.y * d, origin.z + dir.z * d),
      normal: new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
      entity: this.entityOf(hit.collider),
    };
  }

  static toVec(v) { return _v.set(v.x, v.y, v.z); }
  static toQuat(r) { return _q.set(r.x, r.y, r.z, r.w); }
}
