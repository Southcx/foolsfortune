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
//   zoneOf(pos) -> 'throwingRoom' | 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | 'emocean' | 'margarite' | null        (pure, for builders: render/zonemap.js)
//   wholeOf(pos) -> the zone, or the one it is part of ('beach' is `partOf` 'dunes': one sand, one sky, walked between). Anything
//   asking "is this the same ground?" asks the whole; anything asking "what is drawn?" asks the zone.
//   game.zones.update(dt)        game.zones.current (what is drawn)   game.zones.whole (the ground: ask this for music, weather, a room's rules)   game.zones.visibleAt(pos)
//   game.zones.acoustic -> { zone, acoustic, wet? } (the space heard, render/zonemap.js ZONE_SOUND)   event zone.acoustic, on every change of zone
//   obj.userData.maxDist = 30      (also hidden beyond that distance from the camera: labels, small signage)
// SEEN THROUGH A DOORWAY (a portal: Quake's and Doom 3's, Unreal's precomputed visibility at its simplest): from inside the Throwing
// Room the workshop is seen only through its doorway, so of the workshop only what lies in the frustum from the camera through the
// opening is drawn, tested every frame (`PORTALS`; game.zones.portals = false draws all of it, as before). The Throwing Room's frame was
// 464 to 578 calls with the door in view (the budget 450; 2026-10-30), the whole workshop drawn behind a doorway 3 m wide.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ZONE_TESTS, ZONE_SOUND, zoneOf, wholeOf, nearShore } from './zonemap.js';

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

// the Throwing Room's doorway in the workshop's east wall (world/throwingroom/layout.js TR.door: z 1 to 4, 3.2 m high), the wall's depth and a margin
const DOOR_BOX = new THREE.Box3(new THREE.Vector3(9.8, 0, 0.8), new THREE.Vector3(10.8, 3.4, 4.2));
/** Can the camera see through the Throwing Room's doorway (in range, and the doorway on screen)? */
const seesDoor = (c, cam, range) => {
  if (Math.max(DOOR_BOX.distanceToPoint(c), 0) > range) return false;
  _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return _fr.setFromProjectionMatrix(_pm).intersectsBox(DOOR_BOX);
};

// what each zone can see from where the camera stands (the tests themselves are pure: render/zonemap.js)
// (each answer one of these lists, made once: the test runs every frame)
const SEEN = { none: [], basement: ['basement'], throwingRoom: ['throwingRoom'], both: ['basement', 'throwingRoom'], workshop: ['workshop'], dunes: ['dunes'], beach: ['beach'] };
const SEES = {
  workshop: (c, cam) => { const h = seesHole(c, cam, 30), d = seesDoor(c, cam, 40); return h ? (d ? SEEN.both : SEEN.basement) : d ? SEEN.throwingRoom : SEEN.none; },
  throwingRoom: (c, cam) => (seesDoor(c, cam, 40) ? SEEN.workshop : SEEN.none),
  basement: (c, cam) => (seesHole(c, cam, 12) ? SEEN.workshop : SEEN.none), // (a hole in the ceiling: only from near under it)
  beach: () => SEEN.dunes,
  dunes: (c) => (nearShore(c) ? SEEN.beach : SEEN.none),
};
export const ZONES = ZONE_TESTS.map((z) => ({ ...z, sees: SEES[z.id] }));

/** A zone seen from another only through an opening: the opening's face toward the camera's room (x), its span (z, y), widened by `pad`
 *  on every side so a thing just beside the frame, and the shadow it throws into view, is kept; within `near` of the face (or past it)
 *  the frustum is not trusted and the whole zone is drawn. */
const PORTALS = { throwingRoom: { to: 'workshop', x: 10.5, z0: 1, z1: 4, y0: 0, y1: 3.2, pad: 1.2, near: 0.35 } };
const _pq = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _pl = [0, 1, 2, 3, 4].map(() => new THREE.Plane());
const _pin = new THREE.Vector3(), _px = new THREE.Vector3(-1, 0, 0);
/** The portal's five planes from the camera at `c` (one through each edge of the opening, and the opening's own face), or null. */
function portalFrom(D, c) {
  if (c.x - D.x < D.near) return null;
  const x = D.x, a = D.z0 - D.pad, b = D.z1 + D.pad, lo = D.y0 - D.pad, hi = D.y1 + D.pad;
  _pq[0].set(x, lo, a); _pq[1].set(x, lo, b); _pq[2].set(x, hi, b); _pq[3].set(x, hi, a);
  _pin.set(x - 1, (lo + hi) / 2, (a + b) / 2); // (a point just through the opening: inside every plane)
  for (let i = 0; i < 4; i++) { const P = _pl[i].setFromCoplanarPoints(c, _pq[i], _pq[(i + 1) % 4]); if (P.distanceToPoint(_pin) < 0) P.negate(); }
  _pl[4].set(_px, x); // (through the opening's face: x at most its x)
  return D;
}
const BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export { zoneOf, wholeOf };

const _c = new THREE.Vector3(), _s = new THREE.Sphere(), _b = new THREE.Box3();

/** A root hidden by zone: off, and its subtree's matrices left as they are (the scene's pass composed every hidden object's each draw,
 *  80 to 84% of 5,300: up to 6 ms of the Dunes' draw, the deep clean's profile); shown again, brought up to date at once. A position
 *  asked for (getWorldPosition, a box) works its own matrices out, so nothing reads a stale one but the renderer, which draws none. */
const SKIP_MATRICES = function () {};
function setZoneOff(o, off) {
  if (o.zoneOff === off) return;
  o.zoneOff = off;
  if (off) o.updateMatrixWorld = SKIP_MATRICES;
  else { delete o.updateMatrixWorld; o.updateMatrixWorld(true); }
}

export class Zones {
  constructor(game) {
    this.game = game;
    this.current = null; this.whole = null; this.acoustic = null; // ({ zone, acoustic, wet? }: the space the camera is in, as last said)
    this.visible = new Set(ZONES.map((z) => z.id)); // (everything, until the camera is somewhere)
    this.t = 0;
    this.enabled = true;
    this.portals = true; this.beyond = []; // (what of the zone behind a doorway the last pass found: tested each frame against the portal)
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
      const at = (o.userData.zoneAt ||= { x: 0, y: 0, z: 0, g: null, zone: null }); // (kept and rewritten: a moving mesh is placed every pass)
      at.x = e[12]; at.y = e[13]; at.z = e[14]; at.g = o.geometry; at.zone = zone;
      return zone;
    }
    // (a group standing at the origin is usually a holder for things placed in the world: judge it by what it holds)
    if (o.position.lengthSq() < 1e-8 && o.children.length) {
      // (its box is every descendant's: worked out again at most once in HOLDER passes, not four times a second: it was most of the
      // pass's 2 to 3 ms headless, more on the owner's Firefox, R5's diagnostics v132)
      const c = o.userData.zoneHeld; if (c && !fresh && --c.left > 0) return c.z; // (fresh: the picture changed, worked out now)
      _b.setFromObject(o);
      const z = _b.isEmpty() ? null : (_b.getBoundingSphere(_s), _s.radius > 600 ? null : zoneOf(_s.center));
      const held = (o.userData.zoneHeld ||= { z: null, left: 0, s: null }); held.z = z; held.left = HOLDER; held.s = _b.isEmpty() ? null : (held.s || new THREE.Sphere()).copy(_s);
      return z;
    }
    return zoneOf(o.getWorldPosition(_c));
  }

  /** Is a top-level object within the portal's frustum (its world sphere against the five planes)? */
  inPortal(o) {
    const s = this.sphereOf(o); if (!s) return true;
    for (const P of _pl) if (P.distanceToPoint(s.center) < -s.radius) return false;
    return true;
  }
  /** A top-level object's world sphere: a mesh's from its geometry (an instanced one's from its instances), a holder's as the pass last
   *  worked it out, any other's from its box once, kept about where it stands (a rig or a prop that moves keeps its size); none for a
   *  thing three draws unculled. */
  sphereOf(o) {
    if (o.frustumCulled === false) return null; // (drawn wherever its shader puts it, a prop batch's or a world-space effect's: its bounds say nothing, so it is always drawn)
    if (o.isMesh) {
      o.updateWorldMatrix(false, false);
      if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); return _s.copy(o.boundingSphere).applyMatrix4(o.matrixWorld); }
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      return _s.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
    }
    const H = o.userData.zoneHeld; if (H) return H.s ? _s.copy(H.s) : null;
    let k = o.userData.portalAt; o.getWorldPosition(_c);
    if (!k) { _b.setFromObject(o); if (_b.isEmpty()) return null; _b.getBoundingSphere(_s); k = o.userData.portalAt = { dx: _s.center.x - _c.x, dy: _s.center.y - _c.y, dz: _s.center.z - _c.z, r: _s.radius }; }
    _s.center.set(_c.x + k.dx, _c.y + k.dy, _c.z + k.dz); _s.radius = k.r;
    return _s;
  }
  /** Between the passes: what of the zone behind the doorway the last pass found, shown or hidden by the portal this frame (all of it
   *  shown, once, when there is no portal now). */
  throughPortal(D, cam) {
    const B = this.beyond; if (!B.length) return;
    for (const o of B) { const far = o.userData.maxDist ? o.getWorldPosition(_c).distanceTo(cam) > o.userData.maxDist : false; setZoneOff(o, far || (D ? !this.inPortal(o) : false)); }
    if (!D) B.length = 0;
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
    if (changed && cur !== null) { // (the space heard: every change, the same kind again included, so the reverb is set afresh: Wanda's)
      const S = ZONE_SOUND[cur]; this.acoustic = { zone: cur, acoustic: S?.acoustic ?? 'room', ...(S?.wet != null ? { wet: S.wet } : {}) };
      g.events?.emit('zone.acoustic', this.acoustic);
    }
    const vis = (this.nextVisible ||= new Set()); vis.clear(); // (two sets turned over, never a new one a frame)
    if (cur === null || !this.enabled) for (const z of ZONES) vis.add(z.id);
    else { vis.add(cur); const sees = BY_ID[cur].sees?.(cam, g.camera); if (sees) for (const s of sees) vis.add(s); }
    let same = vis.size === this.visible.size;
    if (same) for (const z of vis) if (!this.visible.has(z)) { same = false; break; }
    this.nextVisible = this.visible; this.visible = vis;
    // a pass over the scene: at once when the picture changes, a few times a second otherwise (things move between zones)
    this.t -= dt;
    const P = this.portals && PORTALS[cur], D = P && vis.has(P.to) ? portalFrom(P, cam) : null; // (the doorway's frustum this frame, or none)
    if (!changed && same && this.t > 0) { this.throughPortal(D, cam); return; }
    this.t = 0.25;
    const beyond = this.beyond; beyond.length = 0;
    for (const o of g.scene.children) {
      if (o.userData.zoneFree || o.isLight || o.isPoints || o.isSprite || o.frustumCulled === false && !o.userData.zone) { if (o.zoneOff) setZoneOff(o, false); continue; }
      Zones.install(o);
      const z = this.place(o, changed || !same);
      // (things only worth drawing up close, such as the floor labels: `userData.maxDist`)
      const far = o.userData.maxDist ? o.getWorldPosition(_c).distanceTo(cam) > o.userData.maxDist : false;
      const off = far || (z !== null && !vis.has(z));
      if (!off && D && z === D.to) { beyond.push(o); setZoneOff(o, !this.inPortal(o)); continue; } // (behind the doorway: only what can be seen through it)
      setZoneOff(o, off);
    }
  }

  stats() { let off = 0, on = 0; for (const o of this.game.scene.children) if (o.userData.zoneInstalled) (o.zoneOff ? off++ : on++); return { current: this.current, visible: [...this.visible], hidden: off, shown: on }; }
}
