// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S STAGES, THE FIGHTING AND THE WORKING ONES: The Brawl (docs/plans/STRAWMANS-WELL.md 3.4, Subspace Emissary's stage, the
// underscored one) and The Machine (3.7), built from the stage kit (stagekit.js) in their lanes' metres, their foes the straw dummies
// (dummy.js) and their parts the Machine's (machine.js). The Brawl is an arena of boards with three soft ledges over it (Battlefield's), open
// at both ends: a dummy thrown past a blast line (PERCENT.blast m beyond the arena's edge, marked by a pin standing there) is out; three
// out and the goal's flag is raised. The Machine is a run of contraptions, one a stretch.
//
// Prior art: Super Smash Bros.' Battlefield (a floor and three soft ledges, the blast zones off its ends), Subspace Emissary's stages;
// LittleBigPlanet's and Super Mario Maker's contraption courses.
//
//   buildBrawl(well, S) -> { goal, door, checks, arena, flag }   buildMachine(well, S) -> { goal, door, checks }   BRAWL (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR, DEPTH, BACK } from './stagekit.js';
import { AT } from './layout.js';
import { PERCENT } from '../../progress/strawmanwell.js';
import { scaffold, goalFlag } from './stages.js';

/** The arena (m along the lane), its ledges, where the dummies stand, and how many must be out before the flag is raised. */
export const BRAWL = { x0: 14, x1: 44, ledges: [[18, 22, 2.6], [36, 40, 2.6], [27, 31, 4.9]], spawns: [24, 30, 36], kos: 3 };
const FLOOR = -4;
const sign = (S, text, x, y, sub = null) => S.label(text, x, y, { dz: -BACK + 0.13, width: 2.6, sub });
const floor = (S, x0, x1, top = 0, color = COLOR.boards) => S.box(x0, x1, top + FLOOR, top, color);

export function buildBrawl(well, S) {
  const B = BRAWL, X = (x) => AT.x + x, Y = (y) => AT.y + y, len = S.lane.len;
  scaffold(S, len, { ends: false });
  S.box(B.x0, B.x1, -3, 0, COLOR.boards);
  for (const [a, b, top] of B.ledges) { const { collider } = S.box(a, b, top - 0.25, top, COLOR.thin, { d: DEPTH - 0.6 }); well.mech.thin(collider, X(a), X(b), Y(top)); } // (soft ledges: jumped up through, dropped through)
  for (const x of [B.x0 - PERCENT.blast, B.x1 + PERCENT.blast]) S.box(x - 0.08, x + 0.08, -8, 16, COLOR.mark, { collide: false, dz: -BACK + 0.3, d: 0.05 }); // (the blast lines' pins)
  sign(S, 'THE BRAWL', 29, 8.6, 'knock three dummies past the pins');
  const arena = { x0: X(B.x0), x1: X(B.x1), top: Y(0), z: S.z, stage: 'brawl', into: S.group };
  const flag = goalFlag(S, 41, 0); flag.post.visible = flag.flag.visible = false;
  return { goal: [41, 0], door: [42.6, 0], checks: [[18, 0]], arena, flag, spawns: B.spawns.map((x) => new THREE.Vector3(X(x), Y(0), S.z)) };
}

export function buildMachine(well, S) {
  const M = well.machine, len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y;
  scaffold(S, len);
  // a crate to push to a ledge too tall to jump
  floor(S, -1, 9); M.crate(S.at(4.5, 0), 0.9); sign(S, 'PUSH', 4.5, 5.6, 'walk the crate to the ledge, climb it');
  S.box(9, 14, FLOOR, 4, COLOR.boards);
  // the key, up on that ledge, for the lock near the end
  const key = S.box(11.3, 11.7, 4.5, 4.9, COLOR.gold, { collide: false, own: true, d: 0.4 }); sign(S, 'KEY', 11.5, 7, 'take it to its lock');
  // a seesaw
  floor(S, 14, 23); S.box(18.7, 19.3, 0, 0.5, COLOR.pin);
  M.seesaw(S.at(19, 0.62), 6, S.group); sign(S, 'SEESAW', 19, 4.6);
  // a conveyor against you
  M.belt(S.at(26, -0.2), [6, 0.4, DEPTH], -2.4); sign(S, 'CONVEYOR', 26, 4.6);
  floor(S, 29, 32);
  // a pit: a moving platform, then two crumbling floors
  M.shuttle(S.at(33.6, -0.2), [2.6, 0.4, DEPTH], [5.2, 0, 0], { move: 3, dwell: 0.8 }); sign(S, 'MOVING PLATFORM', 36.5, 5.2);
  for (const [a, b] of [[41.4, 43.2], [44, 45.8]]) {
    const r = S.box(a, b, -0.4, 0, COLOR.used, { own: true });
    M.crumble({ mesh: r.mesh, collider: r.collider, x0: X(a), x1: X(b), top: Y(0) });
  }
  sign(S, 'CRUMBLING', 43.6, 5.2, 'do not stand still');
  // a switch and its timed door, the lock's door, a cannon on a beat before the goal
  floor(S, 46.5, len + 1);
  const pad = S.box(48.4, 49.6, 0, 0.12, COLOR.spring, { own: true, d: 1.4 });
  const doorA = S.box(52, 52.6, 0, 9, COLOR.door, { own: true });
  M.switch({ x0: X(48.4), x1: X(49.6), top: Y(0.12), mesh: pad.mesh, y0: pad.mesh.position.y }, { mesh: doorA.mesh, collider: doorA.collider }); sign(S, 'SWITCH', 49, 5.2, 'it holds the door a moment');
  const doorB = S.box(57, 57.6, 0, 9, COLOR.gold, { own: true }); sign(S, 'LOCK', 55.5, 5.2);
  M.key(key.mesh, { mesh: doorB.mesh, collider: doorB.collider });
  S.box(64.6, 66, 0, 1.6, COLOR.pin); M.cannon(S.at(64.4, 1.0), -1, 6, S.group); sign(S, 'CANNON', 64, 5.2, 'jump the balls');
  goalFlag(S, 62.4, 0);
  return { goal: [62.4, 0], door: [60.6, 0], checks: [[2, 0], [10, 4], [15, 0], [30, 0], [47, 0], [54, 0]] };
}
