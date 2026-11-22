// ---------------------------------------------------------------------------------------
// THE BLUE HOLE (plain name; South, 2026-11-22: "turn The Weir into a proper Blue Hole + Cenote + Dave the Diver fishing
// extravaganza module"): a cenote open to the sky that falls through a throat into a blue hole's bell, 62 m to its floor, reached
// from the Weir's Well (F at its rim: the Well goes down further than it shows) and from the Index. A zone of its own (`bluehole`),
// built on entry and torn down whole after (render/areas.js stage 2), as the Entropy room is.
//   - The shaft (world/bluehole/shaft.js): warped walls, drawn and collided as one trimesh. A stone dock at the water on its south
//     side, where you arrive; the door home stands on it (F).
//   - The water: a probe on the game's water (courier/moves/env.js), the whole shaft deep, so the swim (courier/moves/swim.js) takes
//     you at the surface and down: C dives, you swim where you look, Space rises.
//   - The rod: the shaft's top 12 m are a pool of the Weir's (angling/weir.js POOLS's shape, pushed onto `game.weir.pools` while
//     built), so the Sondelass's rod casts, the fish come, bite, fight and land here as at the Weir; its species the deep ones.
//   - The air: under the water the fog closes in blue by depth, cyan at the surface to ink at the floor (light()).
// Its look is Calissa's to take further (vfx/bluehole/: the psychedelic kelp, the coral on the walls, the light shafts, the schools):
// it is built with the room and handed the shaft.
//
// Prior art: Dave the Diver (a blue hole dived by day and fished from its dock), Deep Dive Dubai (South's reference: a dive pool sunk
// as a shaft), the Great Blue Hole and Dean's Blue Hole, the Yucatan's cenotes; the Entropy room (world/entropy/entropyroom.js: the
// same build, teardown, arrival and F wiring).
//
//   BLUE_HOLE (where it stands; its dock, door, arrival)   BLUE_POOL (the rod's pool)   inBlueHole(p)
//   game.blueHole = new BlueHole(game)   .here   .built   .arrive()   .leave()   .build()   .teardown()   .depth (m under the surface, the camera's)
//   .update(dt)   .light()   events bluehole.enter, bluehole.leave, bluehole.depth { m } (each new 10 m reached, by: 'courier')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { zoneOf as zoneAt } from '../../render/zonemap.js';
import { shaftMesh, wallAt, CLIFF, FLOOR } from './shaft.js';
import { BlueHoleLook } from '../../vfx/bluehole/look.js';
import { DUNE, WELL } from '../dunes/dunes.js';

/** Where it stands (empty space north-east, at the rooms' height: nothing else is drawn from it), and its pieces (local metres, the
 *  water's surface y 0; south is +z). */
export const BLUE_HOLE = {
  x: 1500, y: 200, z: 3000, killDrop: FLOOR + 30,
  dock: { z0: 4.6, z1: 14, x: 3.4, top: 0.45 }, door: { x: 0, z: 10.2 }, arrive: { x: 0, z: 6.2, yaw: Math.PI },
};
/** The rod's pool: the shaft's top 12 m, a square inside the undercut (the fish keep to it; angling/fish.js pickWaypoint). */
export const BLUE_POOL = {
  id: 'bluehole', name: 'THE BLUE HOLE', x0: BLUE_HOLE.x - 7, x1: BLUE_HOLE.x + 7, z0: BLUE_HOLE.z - 7.5, z1: BLUE_HOLE.z + 6.2,
  surface: BLUE_HOLE.y, bottom: BLUE_HOLE.y - 12, maxDepth: 12, depthAt: () => 12,
  species: ['regret', 'thread', 'gall', 'wonder', 'hunger', 'dread', 'hush'], cap: 9,
};
/** The air under the water: [depth m, fog colour, density], eased between (abyssal-garden's absorption: cyan into deep blue). */
export const DEEP_AIR = [[0, 0x1a7aa8, 0.065], [12, 0x115084, 0.07], [30, 0x0a2e62, 0.07], [62, 0x040a22, 0.085]];
const AIR_TOP = { fog: 0x9cc8c0, density: 0.006 };
/** The Weir's Well's rim, where F takes you down to it (world metres). */
const WELL_AT = { x: DUNE.x + (WELL.x0 + WELL.x1) / 2, y: DUNE.y + WELL.surface, z: DUNE.z + (WELL.z0 + WELL.z1) / 2 };

/** Whether a point is in the blue hole's zone (render/zonemap.js asks this). */
export function inBlueHole(p) { const B = BLUE_HOLE; return Math.abs(p.x - B.x) < 120 && Math.abs(p.z - B.z) < 120 && p.y > B.y - FLOOR - 40 && p.y < B.y + 80; }

const _c = new THREE.Color(), _c2 = new THREE.Color();

export class BlueHole {
  constructor(game) { this.game = game; this.built = false; this.depth = 0; this.reached = 0; this.lamps = []; }

  build() {
    if (this.built) return;
    const g = this.game, B = BLUE_HOLE, phys = g.physics, body = g.level?.fixedBody;
    const room = this.room = new THREE.Group(); room.name = 'bluehole'; room.userData.zone = 'bluehole';
    room.position.set(B.x, B.y, B.z);
    this.colliders = [];
    const add = (desc) => { if (phys && body) this.colliders.push(phys.world.createCollider(desc.setCollisionGroups(GROUPS.static).setFriction(0.9), body)); };
    // the shaft: drawn by the look, collided here (world metres)
    const S = this.shaft = shaftMesh();
    const wpos = new Float32Array(S.pos.length); for (let k = 0; k < S.pos.length; k += 3) { wpos[k] = S.pos[k] + B.x; wpos[k + 1] = S.pos[k + 1] + B.y; wpos[k + 2] = S.pos[k + 2] + B.z; }
    add(RAPIER.ColliderDesc.trimesh(wpos, S.idx, RAPIER.TriMeshFlags?.FIX_INTERNAL_EDGES ?? 0));
    // the dock: a stone ledge at the water on the south wall, running back into the rock (its back hidden by the wall)
    const D = B.dock, dz = (D.z0 + D.z1) / 2, dh = 1.6;
    add(RAPIER.ColliderDesc.cuboid(D.x, dh / 2, (D.z1 - D.z0) / 2).setTranslation(B.x, B.y + D.top - dh / 2, B.z + dz));
    // the water: the whole shaft, as a probe (a box could not hold a round hole); the rod's pool on the Weir's list
    this.unprobe = g.water?.probe((x, y, z) => {
      if (y !== null && (y > B.y + 0.5 || y < B.y - FLOOR - 0.5)) return null;
      const dx = x - B.x, dz2 = z - B.z, r = Math.hypot(dx, dz2);
      if (r > 26) return null;
      if (y !== null && r > wallAt(Math.atan2(dz2, dx), Math.min(B.y, y) - B.y) + 0.6) return null;
      return this.vol;
    });
    this.vol = { surface: B.y, bottom: B.y - FLOOR, kind: 'water', x0: B.x - 26, x1: B.x + 26, z0: B.z - 26, z1: B.z + 26 };
    const W = g.weir;
    if (W && !W.pools.some((p) => p.id === BLUE_POOL.id)) { this.pool = { ...BLUE_POOL, fish: [] }; W.pools.push(this.pool); }
    // the look (Calissa's to take on: vfx/bluehole/)
    this.look = new BlueHoleLook(g, room, S, { dock: D, door: B.door });
    g.lights?.adoptIn?.(room);
    g.scene.add(room);
    this.built = true;
  }

  teardown() {
    if (!this.built) return;
    const g = this.game, phys = g.physics, W = g.weir;
    this.unprobe?.(); this.unprobe = null;
    if (W && this.pool) { for (const f of [...this.pool.fish]) W.remove(f); W.pools = W.pools.filter((p) => p !== this.pool); this.pool = null; }
    this.look?.dispose(); this.look = null;
    if (this.room) g.scene.remove(this.room);
    for (const c of this.colliders || []) phys?.world?.removeCollider(c, false);
    this.room = null; this.colliders = []; this.shaft = null; this.built = false;
  }

  get here() { return zoneAt(this.game.player.pos) === 'bluehole'; }

  arrive() {
    const g = this.game, B = BLUE_HOLE;
    g.player.killY = B.y - B.killDrop;
    g.course?.teleport(new THREE.Vector3(B.x + B.arrive.x, B.y + B.dock.top + 0.05, B.z + B.arrive.z), B.arrive.yaw);
    this.reached = 0;
    g.events?.emit('bluehole.enter', { by: 'courier' });
  }

  /** Back up the Well to the Weir, beside its rim. */
  leave() {
    const g = this.game, C = g.course;
    const home = () => {
      g.player.killY = (g.dunes?.center?.y ?? DUNE.y) - 90;
      const x = WELL_AT.x, z = DUNE.z + WELL.z0 - 2.6, y = g.dunes?.heightAt ? g.dunes.heightAt(x, z) : WELL_AT.y + 1;
      C?.teleport(new THREE.Vector3(x, y + 0.05, z), Math.PI);
    };
    g.seam?.cross(home, { to: 'weir' }) || home();
    g.events?.emit('bluehole.leave', { by: 'courier' });
  }

  /** Down from the Weir's Well. */
  enter() { const g = this.game, go = () => this.arrive(); g.seam?.cross(go, { to: 'bluehole', name: 'The Blue Hole' }) || go(); }

  /** F at the Weir's Well's rim (down) and at the dock's door (home), wired on the first frame (the chevron exists after boot). */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('bluehole', () => {
      if (g.dialogue?.open || g.god?.controlling || g.weir?.hooks?.lure?.()?.active) return null;
      const P = g.player.pos, B = BLUE_HOLE;
      if (this.built && this.here) {
        const d = Math.hypot(P.x - (B.x + B.door.x), P.z - (B.z + B.door.z));
        return d < 2.4 && Math.abs(P.y - B.y) < 2 ? { pos: new THREE.Vector3(B.x + B.door.x, B.y + 3, B.z + B.door.z + 0.3), d, ref: 'door' } : null;
      }
      const dx = Math.max(0, Math.abs(P.x - WELL_AT.x) - (WELL.x1 - WELL.x0) / 2), dz = Math.max(0, Math.abs(P.z - WELL_AT.z) - (WELL.z1 - WELL.z0) / 2);
      const d = Math.hypot(dx, dz);
      return d < 1.6 && Math.abs(P.y - WELL_AT.y) < 3 ? { pos: new THREE.Vector3(WELL_AT.x, WELL_AT.y + 1.2, WELL_AT.z), d, ref: 'well' } : null;
    });
  }

  /** Its own air, after the room's fog is graded each frame: open over the water, closing in by depth under it. */
  light() {
    const g = this.game, F = g.scene.fog, cam = g.camera.position; if (!F || zoneAt(cam) !== 'bluehole') return;
    const d = BLUE_HOLE.y - cam.y;
    if (d <= 0) { F.color.setHex(AIR_TOP.fog); F.density = AIR_TOP.density; return; }
    let i = 0; while (i < DEEP_AIR.length - 2 && d > DEEP_AIR[i + 1][0]) i++;
    const [d0, c0, k0] = DEEP_AIR[i], [d1, c1, k1] = DEEP_AIR[i + 1], t = Math.min(1, Math.max(0, (d - d0) / (d1 - d0)));
    F.color.copy(_c.setHex(c0).lerp(_c2.setHex(c1), t)); F.density = k0 + (k1 - k0) * t;
    if (g.scene.background?.isColor) g.scene.background.copy(F.color);
  }

  update(dt) {
    this.wire();
    const g = this.game, it = g.interact?.cur, P = g.player;
    if (it?.id === 'bluehole' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      if (it.ref === 'door') this.leave(); else this.enter();
    }
    if (!this.built) return;
    this.depth = Math.max(0, BLUE_HOLE.y - g.camera.position.y);
    const pd = BLUE_HOLE.y - P.pos.y, step = Math.floor(pd / 10) * 10;
    if (this.here && step > this.reached) { this.reached = step; g.events?.emit('bluehole.depth', { m: step, by: 'courier' }); }
    this.look?.update(g.rawDt ?? dt, this.depth);
  }
}
