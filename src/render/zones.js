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
//   zoneOf(pos) -> 'testroom' | 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | 'emocean' | 'margarite' | null        (pure, for builders: render/zonemap.js)
//   wholeOf(pos) -> the zone, or the one it is part of ('beach' is `partOf` 'dunes': one sand, one sky, walked between). Anything
//   asking "is this the same ground?" asks the whole; anything asking "what is drawn?" asks the zone.
//   game.zones.update(dt)        game.zones.current (what is drawn)   game.zones.whole (the ground: ask this for music, weather, a room's rules)   game.zones.visibleAt(pos)
//   obj.userData.maxDist = 30      (also hidden beyond that distance from the camera: labels, small signage)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ZONE_TESTS, zoneOf, wholeOf, nearShore } from './zonemap.js';

// the basement's hole in the workshop floor (basement.js HOLE), with a margin: from near it, each floor can see the other
const HOLE = { x0: 4.5, x1: 9, z0: -15.5, z1: -12.4 };
const HOLE_BOX = new THREE.Box3(new THREE.Vector3(HOLE.x0, -0.6, HOLE.z0), new THREE.Vector3(HOLE.x1, 0.2, HOLE.z1));
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4();
const HOLDER = 8; // (passes a holder group keeps its zone, at four passes a real second: two seconds, unless the picture changes)
/** Can the camera see into the hole from where it is (in range, and the hole on screen)? */
const seesHole = (c, cam, range) => {
  if (Math.max(HOLE_BOX.distanceToPoint(c), 0) > range) return false;
  _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return _fr.setFromProjectionMatrix(_pm).intersectsBox(HOLE_BOX);
};

// the Throwing Room's doorway in the workshop's east wall (world/testroom/layout.js TR.door: z 1 to 4, 3.2 m high), the wall's depth and a margin
const DOOR_BOX = new THREE.Box3(new THREE.Vector3(9.8, 0, 0.8), new THREE.Vector3(10.8, 3.4, 4.2));
/** Can the camera see through the Throwing Room's doorway (in range, and the doorway on screen)? */
const seesDoor = (c, cam, range) => {
  if (Math.max(DOOR_BOX.distanceToPoint(c), 0) > range) return false;
  _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return _fr.setFromProjectionMatrix(_pm).intersectsBox(DOOR_BOX);
};

// what each zone can see from where the camera stands (the tests themselves are pure: render/zonemap.js)
const SEES = {
  workshop: (c, cam) => [...(seesHole(c, cam, 30) ? ['basement'] : []), ...(seesDoor(c, cam, 40) ? ['testroom'] : [])],
  testroom: (c, cam) => (seesDoor(c, cam, 40) ? ['workshop'] : []),
  basement: (c, cam) => (seesHole(c, cam, 12) ? ['workshop'] : []), // (a hole in the ceiling: only from near under it)
  beach: () => ['dunes'],
  dunes: (c) => (nearShore(c) ? ['beach'] : []),
};
export const ZONES = ZONE_TESTS.map((z) => ({ ...z, sees: SEES[z.id] }));
const BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export { zoneOf, wholeOf };

const _c = new THREE.Vector3(), _s = new THREE.Sphere(), _b = new THREE.Box3();

export class Zones {
  constructor(game) {
    this.game = game;
    this.current = null; this.whole = null;
    this.visible = new Set(ZONES.map((z) => z.id)); // (everything, until the camera is somewhere)
    this.t = 0;
    this.enabled = true;
  }

  /** Is a point in a zone being drawn (or in no zone at all)? */
  visibleAt(p) { if (!this.enabled) return true; const z = zoneOf(p); return z === null || this.visible.has(z); }

  /** The zone a top-level object is in: its own tag, or where its bounds are centred, or where it stands. */
  place(o, fresh = true) {
    if (o.userData.zone !== undefined) return o.userData.zone;
    o.updateWorldMatrix(false, false); // (before the first frame is drawn, a matrix may not have been worked out yet)
    if (o.isMesh && o.geometry) {
      const e = o.matrixWorld.elements, c = o.userData.zoneAt; // (a mesh that has not moved keeps its zone: most of the scene stands still)
      if (c && !fresh && c.x === e[12] && c.y === e[13] && c.z === e[14] && c.g === o.geometry) return c.zone;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      _s.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      const zone = _s.radius > 600 ? null : zoneOf(_s.center); // (something that spans the world is in no one place)
      o.userData.zoneAt = { x: e[12], y: e[13], z: e[14], g: o.geometry, zone };
      return zone;
    }
    // (a group standing at the origin is usually a holder for things placed in the world: judge it by what it holds)
    if (o.position.lengthSq() < 1e-8 && o.children.length) {
      // (its box is every descendant's: worked out again at most once in HOLDER passes, not four times a second: it was most of the
      // pass's 2 to 3 ms headless, more on the owner's Firefox, R5's diagnostics v132)
      const c = o.userData.zoneHeld; if (c && !fresh && --c.left > 0) return c.z; // (fresh: the picture changed, worked out now)
      _b.setFromObject(o);
      const z = _b.isEmpty() ? null : (_b.getBoundingSphere(_s), _s.radius > 600 ? null : zoneOf(_s.center));
      o.userData.zoneHeld = { z, left: HOLDER };
      return z;
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
    this.current = cur; this.whole = cur === null ? null : BY_ID[cur]?.partOf ?? cur;
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
      const z = this.place(o, changed || !same);
      // (things only worth drawing up close, such as the floor labels: `userData.maxDist`)
      const far = o.userData.maxDist ? o.getWorldPosition(_c).distanceTo(cam) > o.userData.maxDist : false;
      o.zoneOff = far || (z !== null && !vis.has(z));
    }
  }

  stats() { let off = 0, on = 0; for (const o of this.game.scene.children) if (o.userData.zoneInstalled) (o.zoneOff ? off++ : on++); return { current: this.current, visible: [...this.visible], hidden: off, shown: on }; }
}
