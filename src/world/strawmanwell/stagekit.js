// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S STAGE KIT: how a stage of the Well is built and taken down (docs/plans/STRAWMANS-WELL.md 2, 3). The Sandbox's builder
// (world/sandbox/sandbox.js), lane-local: a stage's boxes are given in its own metres (x along the run from the lane's start, y up from
// its floor), standing through the plane `DEPTH` m deep; every box merged by colour into one mesh a colour for the whole room, its
// collider on the level's fixed body and kept to be taken out; the lamps plain PointLights the light budget adopts; the signs the
// basement's labels. A box may stand behind the plane (`dz`), be tilted about the depth axis (`rotZ`, a slope), or be a thing of its
// own (`own`: a mesh not merged, for a door that slides, a spool that changes colour), and the kit hands back what it made.
// The look is a placeholder (burlap tan, spool wood, pin steel): Calissa dresses the toy theatre.
//
// Prior art: the Sandbox's and the Touchstone's builders (merge by colour, colliders kept, a group torn down whole); the level's
// `box` and `mergeStatic` (world/level.js).
//
//   const K = new StageKit(game, room)   const S = K.lane(lane)   S.box(x0, x1, y0, y1, color, { dz, d, rotZ, rotY, collide, outline, own, hidden })
//     -> { collider, mesh? }   S.at(x, y, dz?) -> Vector3   S.label(text, x, y, { sub, width, dz })   S.lamp(x, y)   S.add(obj)   S.group
//   K.show(laneId)   K.add(obj, laneId?)   K.collider(desc)   K.finish()   K.dispose()   COLOR (the placeholder palette)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { dress } from '../../vfx/surfaces.js';
import { addOutline, releaseOutlines } from '../../render/outline.js';
import { label } from '../basement/basement.js';
import { AT } from './layout.js';

/** The placeholders: Pip's sewing kit at giant scale, plainly (Calissa's look comes over it). */
export const COLOR = {
  boards: 0xc8a878, flat: 0x7a5a3c, wing: 0x8a6a48, spool: 0x9a6a3e, pin: 0x9aa4ad, thread: 0xe8dcc0, door: 0x5a3e28, gold: 0xd9a441,
  thin: 0xe6cfa0, ice: 0xbfe6f0, goo: 0x5e6b2a, spring: 0xd04a3a, slope: 0xb8946a, used: 0x6b5a3a, mark: 0xb85a3a, felt: 0x4a6a5a,
};
/** How deep a stage's boxes stand through the plane (m), and where its back flat stands behind it. */
export const DEPTH = 3, BACK = 2.2;

export class StageKit {
  constructor(game, room) { this.game = game; this.room = room; this.geos = new Map(); this.groups = new Map(); this.colliders = []; this.owned = []; this.lamps = []; }

  /** A stage's lane builder: its boxes in lane metres, in a group of the lane's own (`show` draws one lane at a time: the others stand
   *  behind its back flat, in the frustum but never seen). */
  lane(L) {
    const K = this, X = (x) => AT.x + x, Y = (y) => AT.y + y;
    if (!this.groups.has(L.id)) { const gr = new THREE.Group(); gr.name = `strawmanwell.${L.id}`; gr.userData.zone = 'strawmanwell'; this.room.add(gr); this.groups.set(L.id, gr); }
    const into = this.groups.get(L.id);
    return {
      lane: L, z: L.z, group: into,
      at: (x, y, dz = 0) => new THREE.Vector3(X(x), Y(y), L.z + dz),
      box: (x0, x1, y0, y1, color, o = {}) => K.box([X((x0 + x1) / 2), Y((y0 + y1) / 2), L.z + (o.dz ?? 0)], [Math.abs(x1 - x0), Math.abs(y1 - y0), o.d ?? DEPTH], color, { ...o, lane: L.id }),
      label: (text, x, y, { sub = null, width = 2.4, dz = DEPTH / 2 + 0.03 } = {}) => label(into, text, [X(x), Y(y), L.z + dz], { width, sub, vertical: true }),
      lamp: (x, y, k = 1) => K.lamp(X(x), Y(y), L.z + 3, k, into),
      add: (obj) => K.add(obj, L.id),
    };
  }
  /** Only this lane's group drawn (null: all of them). */
  show(id) { for (const [k, gr] of this.groups) gr.visible = id == null || k === id; }

  /** One box: merged by colour (or its own mesh, `own`), with a collider unless `collide: false`. Returns { collider, mesh }. */
  box(pos, size, color, { rotZ = 0, rotY = 0, collide = true, outline = true, own = false, hidden = false, friction = 0.9, lane = null } = {}) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, rotZ, 'YXZ')), geo = hidden ? null : new THREE.BoxGeometry(...size);
    let mesh = null;
    if (hidden) { /* (a body only: an invisible wall) */ } else if (own) {
      mesh = new THREE.Mesh(geo, this.mat(color)); mesh.position.set(...pos); mesh.quaternion.copy(q);
      mesh.castShadow = mesh.receiveShadow = true; if (outline) addOutline(mesh); this.add(mesh, lane);
    } else {
      geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1)));
      const k = `${lane}_${color}_${outline}`; if (!this.geos.has(k)) this.geos.set(k, { lane, color, outline, list: [] });
      this.geos.get(k).list.push(geo.index ? geo.toNonIndexed() : geo);
    }
    const collider = collide ? this.collider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setTranslation(...pos).setRotation(q).setFriction(friction)) : null;
    return { collider, mesh };
  }
  /** A collider on the level's fixed body, static, kept to be taken out. */
  collider(desc) {
    const phys = this.game.physics, body = this.game.level?.fixedBody; if (!phys || !body) return null;
    const c = phys.world.createCollider(desc.setCollisionGroups(GROUPS.static), body); this.colliders.push(c); return c;
  }
  /** A thing of the room's own (a model, a sign), taken down with it. */
  add(obj, lane = null) { (this.groups.get(lane) || this.room).add(obj); this.owned.push(obj); return obj; }
  lamp(x, y, z, k = 1, into = this.room) { const l = new THREE.PointLight(0xffe8c8, 24 * k, 30, 1.4); l.position.set(x, y, z); into.add(l); this.lamps.push(l); return l; }
  mat(color) { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: color === COLOR.pin ? 0.4 : 0, flatShading: true }); return m; }

  /** The merged boxes laid in (once, after every stage is built), dressed with what their colour is made of (vfx/surfaces.js). */
  finish() {
    const g = this.game;
    for (const { lane, color, outline, list } of this.geos.values()) {
      const merged = mergeGeometries(list.map((q) => { q.deleteAttribute('uv'); return q; }), false); for (const q of list) q.dispose();
      const mat = this.mat(color), m = new THREE.Mesh(merged, g.paintmap?.patch(dress(mat, color)) ?? dress(mat, color));
      m.receiveShadow = true; m.castShadow = true; if (outline) addOutline(m); (this.groups.get(lane) || this.room).add(m);
    }
    this.geos.clear();
    g.lights?.adoptIn?.(this.room);
  }

  /** Everything taken down: the room's group, its geometry and its own materials (the labels' textures are the basement's shared ones),
   *  every collider. */
  dispose() {
    const g = this.game;
    if (this.room) {
      g.scene.remove(this.room); releaseOutlines(this.room);
      this.room.traverse((o) => { if (o.geometry && !o.userData.isOutline) o.geometry.dispose(); if (o.material && !o.userData.isOutline && !o.userData.sharedMat) for (const m of [].concat(o.material)) m.dispose(); });
    }
    for (const c of this.colliders) { try { if (c) g.physics?.world?.removeCollider(c, false); } catch { /* (already gone with its body) */ } }
    this.colliders = []; this.owned = []; this.lamps = []; this.geos.clear(); this.groups.clear();
  }
}
