// ---------------------------------------------------------------------------------------
// THE THROWING ROOM'S MEASURES: where its things stand, in the Workshop's frame (room.js builds it, drills.js measures from it).
//   TR.x0..x1, z0..z1, h   TR.door   TR.mark (the firing mark)   TR.wall (the spray wall's face and aim point)   TR.strawman   TR.console   TR.posts
//   TR.wing (the combat wing south of the room, through the arcade: docs/plans/COMBAT-LAB.md; its stations and their lecterns)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WALL } from '../../progress/combat/testroom.js';

/** The room's measures, in the Workshop's frame (metres; the Workshop's east wall is x 10 to 10.5). */
export const TR = {
  x0: 10.5, x1: 30.5, z0: -5.5, z1: 10.5, h: 6,
  door: { z0: 1, z1: 4, h: 3.2 },                    // (in the Workshop's east wall, between its columns at z 0 and 5)
  mark: new THREE.Vector3(15, 0, 2.5),               // (the firing mark: the drills are measured from here, facing +x down the lane)
  wall: { x: 15 + WALL.distance, z: 2.5, y: 1.8 },   // (the spray wall's face, WALL.distance from the mark; its aim point at y)
  strawman: new THREE.Vector3(16.25, 0, -12.75),       // (in the combat wing's sparring circle, its centre: TR.wing.circle)
  console: new THREE.Vector3(12.4, 0, -0.9),
  posts: [[18, 8.6, 1.1], [20, 9.2, 1.6], [22, 8.6, 1.25], [24, 9.2, 1.8], [26, 8.6, 1.0], [28, 9.2, 2.3], [29.4, 7.4, 2.1]], // (x, z, height)
};

/** The combat wing (docs/plans/COMBAT-LAB.md; the owner, 2026-10-10: "the ultimate test suite for combat actions"): a hall south of the
 *  room, through an arcade where its south wall stood, 9 m high for the juggle pen. Its floor is x 10.5 to 30.5, z -36 to -5.5; its walls
 *  stand outside that (west x 10.5 to 11 inside the footprint, since the Workshop's corner is beside it). Each station: its floor, its
 *  lectern [x, z] (turned so its reader looks across it at the station's `face`), and a debug chest [x, z, faceX, faceZ] where it has one. */
TR.wing = {
  x0: 10.5, x1: 30.5, z0: -36, z1: -5.5, h: 9, inner: 11,  // (inner: the west wall's face; the floor runs under the wall)
  arcade: { header: 3.6, piers: [[10.5, 12], [29, 30.5]] }, // (the old south wall cut to a header, its posts the columns between bays)
  circle: { x: 16.25, z: -12.75, r: 3.6, lectern: [12.4, -8.2], face: [16.25, -12.75], meter: { z: -11.8, len: 5, tiles: 20 } }, // (the frame meter crosswise between Strawman and the striker: behind it, its body hid the strip)
  mirror: { z: -13.6, len: 6, y0: 0.35, y1: 2.95 },      // (on the west wall beside the circle: a stand-in glass)
  telegraphFloor: { x0: 21.4, x1: 29.4, z0: -18.4, z1: -6.9, caster: [25.4, -16.2], mark: [25.4, -10.4], lectern: [29.85, -7.8], face: [25.4, -12.65] },
  statusBench: { x: 11.5, z0: -33.5, z1: -20.5, h: 0.75, n: 11, lectern: [14.6, -19.4], face: [11.5, -24] },
  jugglePen: { x0: 16.2, x1: 22.8, z0: -35.4, z1: -28.8, gate: [18.7, 20.3], lectern: [17.4, -27.6], face: [19.5, -32.1] },
  parryRange: { pitcher: [27, -35], marks: [[27, -31, 1], [27, -27, 2], [27, -23, 3], [24.26, -27.48, 2], [29.74, -27.48, 2]], lectern: [29.85, -21.6], face: [27, -35] },
  chests: { // (the debug chests, docs/plans/DEBUG-CHESTS.md: each a step aside from its station's lectern, facing it)
    'sparring.circle': [11.75, -9.7, 12.4, -8.2], 'status.bench': [13.0, -19.2, 14.6, -19.4],
    'juggle.pen': [21.7, -27.4, 19.5, -27.6], 'parry.range': [29.85, -20.0, 29.85, -21.6],
  },
};
