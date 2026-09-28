import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { T } from './config.js';

export { RAPIER };

// Collision layers (membership << 16 | filter)
export const G = { STATIC: 1, PLAYER: 2, PROP: 4, DEBRIS: 8, SWIRL: 64 };
export const groups = (member, filter) => (member << 16) | filter;
export const GROUPS = {
  static: groups(G.STATIC, 0xffff),
  player: groups(G.PLAYER, G.STATIC | G.PROP | G.DEBRIS),
  prop: groups(G.PROP, 0xffff),
  debris: groups(G.DEBRIS, G.STATIC | G.PROP | G.DEBRIS | G.PLAYER),
  // debris caught in a gravity well: no debris-debris contacts (a packed, orbiting ball of
  // shards is otherwise the most expensive thing the solver ever sees)
  swirl: groups(G.SWIRL, G.STATIC | G.PROP),
  // what the character controller treats as solid (debris gets shoved, not stood on)
  controllerQuery: groups(0xffff, G.STATIC | G.PROP),
};

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

export class Physics {
  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -T.physics.gravity, z: 0 });
    this.dt = 1 / 60;
    this.events = new RAPIER.EventQueue(true);
    this.synced = new Set(); // { body, mesh }
    this.byCollider = new Map(); // collider handle -> entity
    this.forceHandlers = [];
    this.links = new Set(); // bodies that are multibody links (ropes, hung pots)
    this.pendingForces = [];
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

  markLink(body) { this.links.add(body.handle); }

  /**
   * Impulse that also works on multibody links: Rapier recomputes a link's
   * velocity from its joint coordinates, so a raw impulse on a rope segment is
   * silently lost. Links get the equivalent force for one physics step instead.
   */
  kick(body, imp, point) {
    if (this.links.has(body.handle)) {
      this.pendingForces.push({ body, f: { x: imp.x / this.dt, y: imp.y / this.dt, z: imp.z / this.dt } });
      body.wakeUp();
    } else if (point) body.applyImpulseAtPoint(imp, point, true);
    else body.applyImpulse(imp, true);
  }

  removeBody(body) {
    this.links.delete(body.handle);
    for (let i = 0; i < body.numColliders(); i++) this.byCollider.delete(body.collider(i).handle);
    this.world.removeRigidBody(body);
  }

  step(dt) {
    this.world.timestep = dt;
    const forces = this.pendingForces;
    this.pendingForces = [];
    for (const pf of forces) if (pf.body.isValid()) pf.body.addForce(pf.f, true);
    this.world.step(this.events);
    for (const pf of forces) if (pf.body.isValid()) pf.body.resetForces(false);
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
  raycast(origin, dir, maxDist, excludeCollider, filterGroups, predicate) {
    const ray = new RAPIER.Ray(origin, dir);
    const hit = this.world.castRayAndGetNormal(ray, maxDist, true, undefined, filterGroups, excludeCollider, undefined, predicate);
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
