// ---------------------------------------------------------------------------------------
// THE THROWING ROOM'S MEASURES: where its things stand, in the Workshop's frame (room.js builds it, drills.js measures from it).
//   TR.x0..x1, z0..z1, h   TR.door   TR.mark (the firing mark)   TR.wall (the spray wall's face and aim point)   TR.strawman   TR.console   TR.posts
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WALL } from '../../progress/combat/testroom.js';

/** The room's measures, in the Workshop's frame (metres; the Workshop's east wall is x 10 to 10.5). */
export const TR = {
  x0: 10.5, x1: 30.5, z0: -5.5, z1: 10.5, h: 6,
  door: { z0: 1, z1: 4, h: 3.2 },                    // (in the Workshop's east wall, between its columns at z 0 and 5)
  mark: new THREE.Vector3(15, 0, 2.5),               // (the firing mark: the drills are measured from here, facing +x down the lane)
  wall: { x: 15 + WALL.distance, z: 2.5, y: 1.8 },   // (the spray wall's face, WALL.distance from the mark; its aim point at y)
  strawman: new THREE.Vector3(20, 0, -3.4),
  console: new THREE.Vector3(12.4, 0, -0.9),
  posts: [[18, 8.6, 1.1], [20, 9.2, 1.6], [22, 8.6, 1.25], [24, 9.2, 1.8], [26, 8.6, 1.0], [28, 9.2, 2.3], [29.4, 7.4, 2.1]], // (x, z, height)
};
