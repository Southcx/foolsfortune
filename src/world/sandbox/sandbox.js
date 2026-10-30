// ---------------------------------------------------------------------------------------
// THE SANDBOX (South, 2026-10-30: "a room in the workshop kind of like the Siege, but as a little physics sandbox to test god powers ...
// Also a little area to practice kicking a physics enabled ball around. Dawn of Mana is a huge inspiration"; Dovina's rules,
// progress/sandbox.js, docs/plans/SANDBOX.md): the god hand's physics room, a plain lit hall off the Index (THE HAND group, beside the Siege)
// in a zone of its own (`sandbox`, far east of the workshop beside the Touchstone). Its floor is flat clay ground the god hand's matter
// can lie on (the island's matter is laid by rays down from the hand: godhand/islandmatter.js), its roof is high enough for the hand's
// cutaway to cut it away. In it:
//   three lecterns (F at each: the chevron through `game.interact`):  RACK lays out the yard's stock (crates, a tower of bricks, pots),
//     PEN calls three slip jellies into its ring of low posts (training bodies), GROUND puts the hand's matter back (world/sandbox/yard.js);
//   a pitch with a physics ball and a goal, to kick about (world/sandbox/pitch.js);
//   a door on the south wall back to the hub.
// A loose thing thrown or kicked here strikes what it meets (world/impacts.js, game.impacts). It is an area of its own (render/areas.js
// stage 2, as the Touchstone's): built when the camera comes to it, torn down whole after it leaves, with everything it laid in it. The
// look is a placeholder (clay walls, a sandy floor, a turf pitch): Calissa dresses it.
//
// Prior art: Dawn of Mana's Havok yard (the world's props as the weapon), Garry's Mod's sandbox (a room of props and a cleanup), Black &
// White's creature pen, Mario Strikers' pitch, keepy-uppy; and the Touchstone's and Raku's bazaar's own build (world/touchstone/, world/bazaar/:
// the same area, arrival, F wiring and teardown).
//
//   game.sandbox = new Sandbox(game)   .here   .arrive()   .leave()   .build()   .teardown()   .built   .update(dt)   .light()
//   .yard (rack, pen, ground)   .pitch (ball, reset)
//   events: sandbox.enter, sandbox.leave { by }   sandbox.rack { n, by }   sandbox.pen { n, by }   sandbox.ground { n, by }
//           sandbox.kick { by }   sandbox.juggle { n, by }   sandbox.goal { dist, by }   (the pitch's: world/sandbox/pitch.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { dress } from '../../vfx/surfaces.js';
import { addOutline, releaseOutlines } from '../../render/outline.js';
import { zoneOf } from '../../render/zonemap.js';
import { label } from '../basement/basement.js';
import { SANDBOX } from '../../progress/sandbox.js';
import { Yard, penPosts } from './yard.js';
import { Pitch } from './pitch.js';

/** The hall's air: a warm haze, light enough to read the pitch from the arrival (render: after the room's fog is graded each frame). */
export const AIR = { fog: 0x6f5f4c, density: 0.0045 };
const C = { floor: 0xcdb78a, wall: 0x9c5a3e, roof: 0x4a2a1e, lectern: 0x6b4a36, gold: 0xd9a441, door: 0x6b5a3a, band: 0x7a4430 };
const GAP = 4, DOOR_H = 5; // (the south wall's gap for the door, and its height, in metres)

export class Sandbox {
  constructor(game) { this.game = game; this.built = false; this.lamps = []; this.yard = new Yard(game); this.pitch = new Pitch(game); }

  /** The hall built (render/areas.js calls it as the camera comes to it): every box merged by colour in a group of its own, its colliders
   *  kept to be taken out again, six lamps of the light budget, the pen's posts, the pitch's walls and goal, the ball set on its spot. */
  build() {
    if (this.built) return;
    const g = this.game, S = SANDBOX, B = S.at, W = S.size, y = B.y, X = (x) => B.x + x, Z = (z) => B.z + z, phys = g.physics;
    const room = this.room = new THREE.Group(); room.name = 'sandbox'; room.userData.zone = 'sandbox';
    const geos = new Map(), cols = this.colliders = [], body = g.level?.fixedBody;
    const put = (geo, color, outline, plain) => { const k = `${color}_${outline}_${plain}`; if (!geos.has(k)) geos.set(k, { color, outline, plain, list: [] }); geos.get(k).list.push(geo.index ? geo.toNonIndexed() : geo); };
    const kit = this.kit = {
      box: (pos, size, color, { rotY = 0, collide = true, outline = true, plain = false } = {}) => {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)), geo = new THREE.BoxGeometry(...size);
        geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1))); put(geo, color, outline, plain);
        if (collide && phys && body) cols.push(phys.world.createCollider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setTranslation(...pos).setRotation(q).setCollisionGroups(GROUPS.static).setFriction(0.9), body));
      },
    };
    const box = kit.box, sx = W.w / 2 + 0.5, sz = W.d / 2 + 0.5;
    box([X(0), y - 0.5, Z(0)], [W.w + 2, 1, W.d + 2], C.floor, { outline: false }); // (the floor: its top is the ground the matter lies on)
    box([X(0), y + W.h + 0.5, Z(0)], [W.w + 2, 1, W.d + 2], C.roof, { outline: false }); // (the roof: the hand's cutaway cuts it away)
    for (const s of [-1, 1]) box([X(s * sx), y + W.h / 2, Z(0)], [1, W.h, W.d + 2], C.wall, { outline: false });
    box([X(0), y + W.h / 2, Z(-sz)], [W.w + 2, W.h, 1], C.wall, { outline: false });
    for (const s of [-1, 1]) box([X(s * (GAP / 2 + (W.w / 2 + 1 - GAP / 2) / 2)), y + W.h / 2, Z(sz)], [W.w / 2 + 1 - GAP / 2, W.h, 1], C.wall, { outline: false }); // (the south wall, a gap for the door)
    box([X(0), y + DOOR_H + (W.h - DOOR_H) / 2, Z(sz)], [GAP, W.h - DOOR_H, 1], C.wall, { outline: false });
    box([X(0), y + DOOR_H / 2, Z(sz + 0.4)], [GAP - 1, DOOR_H, 0.3], C.door); // (the door: F goes back to the hub)
    for (const s of [-1, 1]) box([X(s * (W.w / 2 - 0.03)), y + 4, Z(0)], [0.06, 0.5, W.d], C.band, { collide: false, outline: false }); // (a band along the long walls)
    for (const L of Object.values(S.lecterns)) { box([X(L.x), y + 0.5, Z(L.z)], [0.9, 1, 0.9], C.lectern); box([X(L.x), y + 1.02, Z(L.z)], [0.7, 0.04, 0.7], C.gold, { collide: false }); }
    penPosts(kit); this.pitch.build(kit);
    for (const { color, outline, plain, list } of geos.values()) {
      const merged = mergeGeometries(list.map((q) => { q.deleteAttribute('uv'); return q; }), false); for (const q of list) q.dispose();
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true }), m = new THREE.Mesh(merged, plain ? mat : dress(mat, color)); // (dressed with what its colour is made of: vfx/surfaces.js)
      m.receiveShadow = true; m.castShadow = color !== C.floor; if (outline) addOutline(m); room.add(m);
    }
    // signs on the floor before each lectern and over the three places (placeholder lettering: the basement's labels), plain names
    const sign = (text, x, z, o) => label(room, text, [X(x), y, Z(z)], o);
    for (const [id, L] of Object.entries(S.lecterns)) sign({ rack: 'RACK', pen: 'PEN', ground: 'GROUND' }[id], L.x, L.z + 1.1, { width: 2, sub: { rack: 'restock the yard', pen: 'call three jellies', ground: 'put the ground back' }[id] });
    sign('THE YARD', S.yard.x, S.yard.z + S.yard.d / 2 - 1, { width: 3.4 }); sign('THE PEN', S.pen.x, S.pen.z + S.pen.r + 1.2, { width: 2.6 });
    sign('THE PITCH', S.pitch.x, S.pitch.z + S.pitch.d / 2 - 1.5, { width: 3.4 });
    label(room, 'THE HUB', [X(0), y + 3.6, Z(sz + 0.23)], { width: 2.6, vertical: true, rotY: Math.PI }); // (on the door, facing into the hall)
    // six lamps of the light budget, adopted as built (render/lightbudget.js adoptIn)
    for (const [lx, lz] of [[-14, -8], [14, -8], [-14, 10], [14, 10], [0, 0], [0, -14]]) { const l = new THREE.PointLight(0xfff1dc, 26, 34, 1.4); l.position.set(X(lx), y + W.h - 2.5, Z(lz)); room.add(l); this.lamps.push(l); }
    g.lights?.adoptIn?.(room);
    g.scene.add(room);
    this.pitch.spawnBall();
    this.built = true;
  }

  /** The hall torn down whole (render/areas.js, a few real seconds after the camera and its neighbours leave): the ball, the stock and the
   *  jellies taken out first, the hand's matter let go, then the group, its geometry, its own materials and its colliders. */
  teardown() {
    if (!this.built) return;
    const g = this.game, phys = g.physics;
    this.pitch.clear(); this.yard.clear();
    if (this.room) {
      g.scene.remove(this.room); releaseOutlines(this.room);
      this.room.traverse((o) => { if (o.geometry && !o.userData.isOutline) o.geometry.dispose(); if (o.material && !o.userData.isOutline) for (const m of [].concat(o.material)) m.dispose(); }); // (the labels' textures are the basement's shared ones: kept)
    }
    for (const c of this.colliders || []) phys?.world?.removeCollider(c, false);
    this.room = null; this.colliders = []; this.lamps = []; this.kit = null; this.built = false;
  }

  /** Is the Courier in the hall (its zone)? */
  get here() { return zoneOf(this.game.player.pos) === 'sandbox'; }
  arrive() {
    const g = this.game, S = SANDBOX, A = S.arrive;
    g.player.killY = S.at.y - 60; g.course?.teleport(new THREE.Vector3(S.at.x + A.x, S.at.y + 0.05, S.at.z + A.z), A.yaw);
    g.events?.emit('sandbox.enter', { by: 'courier' });
  }
  leave() {
    const g = this.game, C2 = g.course;
    const home = () => C2?.teleport(C2.hubSpawn.v, C2.hubSpawn.yaw);
    g.seam?.cross(home) || home();
    g.events?.emit('sandbox.leave', { by: 'courier' });
  }

  /** F at a lectern or the door (wired on the first frame, as the Touchstone's: the chevron exists after boot). */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('sandbox', () => {
      if (!this.built || !this.here || g.dialogue?.open || g.god?.controlling) return null;
      const P = g.player.pos, S = SANDBOX; let best = null;
      const near = (ref, x, z, reach, h) => { const d = Math.hypot(P.x - (S.at.x + x), P.z - (S.at.z + z)); if (d < reach && (!best || d < best.d)) best = { pos: new THREE.Vector3(S.at.x + x, S.at.y + h, S.at.z + z), d, ref }; };
      for (const [id, L] of Object.entries(S.lecterns)) near(id, L.x, L.z, 1.6, 1.6);
      near('door', 0, S.size.d / 2 - 0.2, 2.4, 3);
      return best;
    });
  }

  /** A lectern used: its work done, said once as an event (the log's line is the tracking rule's, Dovina's). */
  use(id) {
    const g = this.game, n = id === 'rack' ? this.yard.rack() : id === 'pen' ? this.yard.pen() : id === 'ground' ? this.yard.ground() : null;
    if (n !== null) g.events?.emit(`sandbox.${id}`, { n, by: 'courier' });
    return n;
  }

  /** Its own air (after the room's fog is graded each frame, as the Touchstone's). */
  light() {
    const g = this.game, F = g.scene.fog; if (!F || zoneOf(g.camera.position) !== 'sandbox') return;
    F.color.setHex(AIR.fog); F.density = AIR.density;
  }

  update(dt) {
    this.wire();
    if (!this.built) return;
    const g = this.game, it = g.interact?.cur, P = g.player;
    if (it?.id === 'sandbox' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      if (it.ref === 'door') this.leave(); else this.use(it.ref);
    }
    this.pitch.update(dt);
  }
}
