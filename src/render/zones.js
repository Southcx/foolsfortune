// ---------------------------------------------------------------------------------------
// ZONES: the world is a handful of places a long way apart (the workshop and its basement near the origin, the circuits
// three kilometres out, the dunes and their oasis four hundred metres down), all in one scene. A zone is one of those places, told by position alone.
// Only the zone the camera is in, and the ones that can be seen from where it stands (the basement through the hole in the workshop's
// floor, and the other way), are drawn; everything else is taken out of the picture, and its lamps out of the light budget.
//
// This is the console's "room" or "stage": Kingdom Hearts and Final Fantasy X draw one area at a time and load the next at the door;
// here nothing needs loading, so a zone is simply switched off when it cannot be seen. Nothing in the game has to know: the static
// level is merged per zone (level.js), and every top-level object in the scene is placed in a zone by where it stands and hidden with
// it. A module that hides its own objects still can: hiding is combined (an object shows only if its owner and its zone both say so).
// Objects that follow the camera or are drawn in world space from the origin (particles, trails, ropes: `frustumCulled = false`), and
// anything marked `userData.zoneFree`, are never hidden by zone.
//
//   zoneOf(pos) -> 'workshop' | 'basement' | 'circuits' | 'dunes' | 'well' | null        (pure, for builders)
//   game.zones.update(dt)        game.zones.current        game.zones.visibleAt(pos)
//   obj.userData.maxDist = 30      (also hidden beyond that distance from the camera: labels, small signage)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

// the basement's hole in the workshop floor (basement.js HOLE), with a margin: from near it, each floor can see the other
const HOLE = { x0: 4.5, x1: 9, z0: -15.5, z1: -12.4 };
const HOLE_BOX = new THREE.Box3(new THREE.Vector3(HOLE.x0, -0.6, HOLE.z0), new THREE.Vector3(HOLE.x1, 0.2, HOLE.z1));
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4();
/** Can the camera see into the hole from where it is (in range, and the hole on screen)? */
const seesHole = (c, cam, range) => {
  if (Math.max(HOLE_BOX.distanceToPoint(c), 0) > range) return false;
  _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return _fr.setFromProjectionMatrix(_pm).intersectsBox(HOLE_BOX);
};

export const ZONES = [
  { id: 'workshop', test: (p) => p.y > -1.2 && p.y < 60 && Math.abs(p.x) < 40 && Math.abs(p.z) < 40, sees: (c, cam) => (seesHole(c, cam, 30) ? ['basement'] : []) },
  { id: 'basement', test: (p) => p.y <= -1.2 && p.y > -150 && p.x > -250 && p.x < 450 && p.z > -300 && p.z < 200, sees: (c, cam) => (seesHole(c, cam, 12) ? ['workshop'] : []) }, // (a hole in the ceiling: only from near under it)
  { id: 'circuits', test: (p) => p.x > 2800 && p.x < 3300 && p.z > -300 && p.z <= 380 && p.y > -120 && p.y < 120 },
  { id: 'dunes', test: (p) => p.x > 1000 && p.x < 3000 && p.z > -1000 && p.z < 1000 && p.y < -150 },
  // a Well's floor (world/well/dunemaw.js): built far west and deep, one floor at a time
  { id: 'well', test: (p) => p.x > -1450 && p.x < -1150 && p.z > -150 && p.z < 150 && p.y > -960 && p.y < -840 },
];
const BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

/** Which zone a point is in, or null (between places: in transit, or somewhere no zone claims). */
export function zoneOf(p) {
  for (const z of ZONES) if (z.test(p)) return z.id;
  return null;
}

const _c = new THREE.Vector3(), _s = new THREE.Sphere(), _b = new THREE.Box3();

export class Zones {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.visible = new Set(ZONES.map((z) => z.id)); // (everything, until the camera is somewhere)
    this.t = 0;
    this.enabled = true;
  }

  /** Is a point in a zone being drawn (or in no zone at all)? */
  visibleAt(p) { if (!this.enabled) return true; const z = zoneOf(p); return z === null || this.visible.has(z); }

  /** The zone a top-level object is in: its own tag, or where its bounds are centred, or where it stands. */
  place(o) {
    if (o.userData.zone !== undefined) return o.userData.zone;
    o.updateWorldMatrix(false, false); // (before the first frame is drawn, a matrix may not have been worked out yet)
    if (o.isMesh && o.geometry) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      _s.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (_s.radius > 600) return null; // (something that spans the world is in no one place)
      return zoneOf(_s.center);
    }
    // (a group standing at the origin is usually a holder for things placed in the world: judge it by what it holds)
    if (o.position.lengthSq() < 1e-8 && o.children.length) {
      _b.setFromObject(o);
      if (_b.isEmpty()) return null;
      _b.getBoundingSphere(_s);
      return _s.radius > 600 ? null : zoneOf(_s.center);
    }
    return zoneOf(o.getWorldPosition(_c));
  }

  /** Hiding by zone, combined with the owner's own `visible` (see the header). */
  static install(o) {
    if (o.userData.zoneInstalled) return;
    o.userData.zoneInstalled = true;
    let own = o.visible;
    o.zoneOff = false; o.parked = false;
    Object.defineProperty(o, 'visible', { configurable: true, get() { return own && !this.zoneOff && !this.parked; }, set(v) { own = v; } }); // (parked: drawn by a prop batch instead, render/propbatch.js)
  }

  update(dt) {
    const g = this.game, cam = g.camera.position;
    const cur = zoneOf(cam);
    const changed = cur !== this.current;
    this.current = cur;
    const vis = new Set();
    if (cur === null || !this.enabled) for (const z of ZONES) vis.add(z.id);
    else { vis.add(cur); for (const s of BY_ID[cur].sees?.(cam, g.camera) ?? []) vis.add(s); }
    const same = vis.size === this.visible.size && [...vis].every((z) => this.visible.has(z));
    this.visible = vis;
    // a pass over the scene: at once when the picture changes, a few times a second otherwise (things move between zones)
    this.t -= dt;
    if (!changed && same && this.t > 0) return;
    this.t = 0.25;
    for (const o of g.scene.children) {
      if (o.userData.zoneFree || o.isLight || o.isPoints || o.isSprite || o.frustumCulled === false && !o.userData.zone) { if (o.zoneOff) o.zoneOff = false; continue; }
      Zones.install(o);
      const z = this.place(o);
      // (things only worth drawing up close, such as the floor labels: `userData.maxDist`)
      const far = o.userData.maxDist ? o.getWorldPosition(_c).distanceTo(cam) > o.userData.maxDist : false;
      o.zoneOff = far || (z !== null && !vis.has(z));
    }
  }

  stats() { let off = 0, on = 0; for (const o of this.game.scene.children) if (o.userData.zoneInstalled) (o.zoneOff ? off++ : on++); return { current: this.current, visible: [...this.visible], hidden: off, shown: on }; }
}
