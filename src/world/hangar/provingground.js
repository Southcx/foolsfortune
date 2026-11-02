// ---------------------------------------------------------------------------------------
// THE PROVING GROUND (docs/plans/MECHS.md 5.2): the open yard at the mech's scale beside the hangar, where the lift sets the mech down.
// A placeholder of the house's boxes (Calissa dresses it: Giant Clank's toy city, Pacific Rim's night): a clay floor 360 m square with
// low walls round it, knee-high clay blocks to step round or jump onto, two sockets for the cable (their tops lit), the straw giant's
// spot, and a door in the west wall back to the hub (F). Built and taken down with the hangar's area (world/hangar/hangar.js).
//
// Prior art: the Sandbox's and Strawman's Well's builders (world/strawmanwell/stagekit.js, reused: every box merged by colour, its
// collider kept, the group torn down whole), Ratchet & Clank's Giant Clank arenas (a city as a toy table), Evangelion's power sockets.
//
//   const F = new ProvingGround(game)   F.build()   F.teardown()   F.group   F.built   F.offer(playerPos) -> an interact offer | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { StageKit } from '../strawmanwell/stagekit.js';
import { label } from '../basement/basement.js';
import { PROVING } from './layout.js';

const C = { floor: 0xc49a6c, wall: 0x9c5a3e, block: 0xb5764a, plinth: 0x5a4a3e, door: 0x6b5a3a, socket: 0x7fd8ff };
const DOOR = { w: 4, h: 5, reach: 3 }; // (the west wall's door: its width, height and F's reach, in metres)

export class ProvingGround {
  constructor(game) { this.game = game; this.built = false; this.group = null; this.kit = null; }

  build() {
    if (this.built) return;
    const g = this.game, A = PROVING.at, h = PROVING.half, W = PROVING.wall, y = A.y;
    const room = this.group = new THREE.Group(); room.name = 'provingground'; room.userData.zone = 'provingground';
    const K = this.kit = new StageKit(g, room), box = (p, s, c, o) => K.box(p, s, c, o);
    box([A.x, y - 0.5, A.z], [2 * h + 2, 1, 2 * h + 2], C.floor, { outline: false }); // (the floor: what the mech walks on, the paint map's ground)
    for (const s of [-1, 1]) box([A.x, y + W / 2, A.z + s * (h + 0.5)], [2 * h + 2, W, 1], C.wall, { outline: false });
    box([A.x + h + 0.5, y + W / 2, A.z], [1, W, 2 * h + 2], C.wall, { outline: false });
    const D = PROVING.door, dz = A.z + D.z, wx = A.x - h - 0.5; // (the west wall, with the door's gap)
    const north = dz - DOOR.w / 2 - (A.z - h - 1), south = A.z + h + 1 - (dz + DOOR.w / 2);
    box([wx, y + W / 2, A.z - h - 1 + north / 2], [1, W, north], C.wall, { outline: false });
    box([wx, y + W / 2, dz + DOOR.w / 2 + south / 2], [1, W, south], C.wall, { outline: false });
    box([wx - 0.4, y + DOOR.h / 2, dz], [0.3, DOOR.h, DOOR.w - 0.6], C.door);
    label(room, 'THE HUB', [wx + 0.2, y + 3.4, dz], { width: 2.6, vertical: true, rotY: Math.PI / 2 });
    for (const B of PROVING.blocks) box([A.x + B.x, y + PROVING.blockH / 2, A.z + B.z], [B.w, PROVING.blockH, B.d], C.block);
    // the sockets: a plinth each, its top lit (the cable's: F within reach of one while piloting)
    const glow = this.glow = new THREE.MeshStandardMaterial({ color: C.socket, emissive: new THREE.Color(C.socket), emissiveIntensity: 1.2, roughness: 0.6 });
    const cap = this.cap = new THREE.BoxGeometry(2.4, 0.3, 2.4);
    for (const s of PROVING.sockets) {
      box([A.x + s.x, y + 0.75, A.z + s.z], [3, 1.5, 3], C.plinth);
      const m = new THREE.Mesh(cap, glow); m.position.set(A.x + s.x, y + 1.6, A.z + s.z); K.add(m);
      label(room, 'SOCKET', [A.x + s.x, y, A.z + s.z + 2.6], { width: 3, sub: 'F to plug the cable' });
    }
    label(room, 'THE PROVING GROUND', [A.x + PROVING.launch.x, y, A.z + PROVING.launch.z + 12], { width: 8 });
    K.finish();
    g.scene.add(room);
    this.built = true;
  }

  teardown() {
    if (!this.built) return;
    this.kit?.dispose(); this.glow?.dispose(); this.cap?.dispose();
    this.group = null; this.kit = null; this.built = false;
  }

  /** F at the door back to the hub, from where the Courier stands. */
  offer(p) {
    const A = PROVING.at, D = PROVING.door, x = A.x - PROVING.half, z = A.z + D.z, d = Math.hypot(p.x - x, p.z - z);
    return d < DOOR.reach && Math.abs(p.y - A.y) < 3 ? { pos: new THREE.Vector3(x + 0.4, A.y + 3, z), d, ref: 'field.door' } : null;
  }
}
