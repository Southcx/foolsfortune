// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE DEPTH (docs/plans/STRAWMANS-WELL.md 3.14): three lanes deep, hopped between at marked spots, W back and S forward
// (Tomba!, Klonoa, Virtual Boy Mario Clash). The stage is four beats, each shown safe first:
//   1. a gold mark on the front lane's boards and the middle lane's behind it: W hops back, round a pit in the front lane
//   2. the middle lane's pit, gone round by the back lane: W back, S forward again
//   3. a cannon on the middle lane's far wall, its balls rolling along that lane only: hop forward out of its way, back before the
//      front lane's pits
//   4. the climb: the back lane's steps up to a ledge, then forward lane by lane to the goal on the front lane's high ledge
// The hop is the plane eased to the other lane's depth with a small lift (depthlanes.js); the core movement is untouched. A hop spot
// never stands within 3 m of the stage's door (W at a door opens it: strawmanwell.js). The camera keeps its seat in front of the front
// lane, so every lane is seen at once. A fall is the stage's own retry, back to a checkpoint in its own lane.
// Placeholder looks (gold plates for the marks, a thread between them); the words are Espada's.
//
// Prior art: Tomba! 2's crossing points (an arrow on the path, Up to cross), Klonoa's paths, Mario Clash's two planes; the Machine's
// cannon (machine.js) as a ball that keeps to one lane.
//
//   default export: a stage module (stagemods.js's contract)   DEPTH_LANES (dz of each lane)   DEPTH (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { SIDE_CAM } from '../wellframe.js';
import { goalFlag } from '../stages.js';
import { PlaneShift, StageRetry, sideLook } from './depthlanes.js';

/** The lanes' depths (m from the stage's plane, front to back). */
export const DEPTH_LANES = [0, -3.6, -7.2];
/** Its numbers: a spot's reach (m along the run, and of height), the cannon's beat (real s), its balls' speed (m/s), radius (m), knock
 *  (m/s), and how far behind the front lane the camera sits (m more than the frame's own seat, so the back lane stays in view). */
export const DEPTH = { reach: 0.9, tall: 0.6, every: 2.2, speed: 5.5, r: 0.32, knock: 6, seat: 3.6 };

// the boards: [x0, x1, top, lane]
const FLOORS = [
  [-1, 16, 0, 0], [30, 37, 0, 0], [40, 45, 0, 0], [48, 56, 0, 0], [68, 80, 2.8, 0],
  [5, 18, 0, 1], [23, 54, 0, 1], [62, 72, 2.8, 1],
  [14, 27, 0, 2], [44, 57, 0, 2], [57, 60, 1.4, 2], [60, 68, 2.8, 2],
];
// the hop spots: [x, top, lane, lane] (adjacent lanes, both boards there at that height), and the signs at the first of each
const SPOTS = [[10, 0, 0, 1], [15.5, 0, 1, 2], [25, 0, 2, 1], [32, 0, 1, 0], [35.5, 0, 0, 1], [41.5, 0, 1, 0], [44, 0, 0, 1], [46.5, 0, 1, 2], [65, 2.8, 2, 1], [70, 2.8, 1, 0]];
// the checkpoints: [x, top, lane]
const CHECKS = [[2, 0, 0], [12, 0, 1], [26, 0, 1], [33, 0, 0], [47.5, 0, 2], [61, 2.8, 2], [71, 2.8, 0]];
const CANNON_AT = [53.6, 1.0, 1], CANNON_TO = 31.6;

export default {
  id: 'depth',
  build(well, S) {
    const len = S.lane.len, z = (k) => DEPTH_LANES[k];
    // the scaffold, deep enough for three lanes: the back flat behind the back lane, the ends across all three, the unseen front
    S.box(-16, len + 16, -14, 24, COLOR.flat, { dz: z(2) - 2.4, d: 0.2, outline: false });
    for (const x of [-0.6, len + 0.6]) S.box(x - 0.6, x + 0.6, -6, 14, COLOR.wing, { dz: z(1), d: 12, outline: false });
    S.box(-16, len + 16, -14, 24, 0, { dz: 1.6, d: 0.2, hidden: true });
    S.box(-16, len + 16, -16, -14, 0, { dz: z(1), d: 12, hidden: true });
    for (const k of [1, 3, 5]) S.lamp((len * k) / 6, 7.5);
    for (const [x0, x1, top, k] of FLOORS) S.box(x0, x1, top - 4, top, k === 0 ? COLOR.boards : k === 1 ? COLOR.slope : COLOR.spool, { dz: z(k) });
    // the marks: a gold plate on each lane's boards and a thread across between them
    for (const [x, top, a, b] of SPOTS) {
      for (const k of [a, b]) S.box(x - 0.45, x + 0.45, top, top + 0.04, COLOR.gold, { dz: z(k), d: 1.4, collide: false });
      S.box(x - 0.04, x + 0.04, top + 0.03, top + 0.07, COLOR.thread, { dz: (z(a) + z(b)) / 2, d: Math.abs(z(a) - z(b)), collide: false, outline: false });
    }
    const sign = (t, x, y, sub) => S.label(t, x, y, { dz: z(2) - 2.27, width: 2.6, sub });
    sign('THE DEPTH', 4, 4.6, 'three lanes deep'); sign('W: HOP BACK', 10, 3.4, 'at a gold mark'); sign('S: HOP FORWARD', 25, 3.4, 'at a gold mark');
    sign('CANNON', 47, 4.4, 'its balls keep to their lane'); sign('THE CLIMB', 60, 6.4, 'back, up, then forward');
    // the cannon on the middle lane's far wall
    S.box(54, 55, 0, 3, COLOR.pin, { dz: z(1) });
    goalFlag(S, 75, 2.8);
    const st = { goal: [75, 2.8], door: [78, 2.8], checks: CHECKS.map(([x, y]) => [x, y]), noRetry: true, ready: () => this.lane === 0 };
    this.S = S; this.balls = []; this.cd = 1; this.lane = 0; this.check = 0;
    this.shift = new PlaneShift(well); this.retry = new StageRetry(well, 'depth');
    return st;
  },
  enter(well) { this.lane = 0; this.check = 0; this.shift.cancel(); this.retry.cancel(); this.clearBalls(); this.cd = 1; },
  leave() { this.shift?.cancel(); this.retry?.cancel(); this.clearBalls(); },
  pre(well, dt) { if (well.stage?.id === 'depth') this.shift.pre(dt); },

  update(well, dt) {
    if (well.stage?.id !== 'depth' || !this.S) return;
    const P = well.game.player, R = well.frame.realInput, L = this.S.lane, ax = P.pos.x - AT.x, ay = P.pos.y - AT.y;
    this.retry.update(dt);
    if (this.retry.busy) return;
    // a hop: W back, S forward, standing on a mark whose other lane lies that way
    if (R && !this.shift.busy) {
      const back = R.wasPressed('KeyW'), fwd = R.wasPressed('KeyS');
      if (back || fwd) for (const [x, top, a, b] of SPOTS) {
        if (Math.abs(ax - x) > DEPTH.reach || Math.abs(ay - top) > DEPTH.tall) continue;
        const other = this.lane === a ? b : this.lane === b ? a : -1; if (other < 0) continue;
        if ((back && other > this.lane) || (fwd && other < this.lane)) {
          this.lane = other; this.shift.to(L.z + DEPTH_LANES[other]); well.verb('lanes');
          break;
        }
      }
    }
    // checkpoints, in the lane they stand in
    if (P.grounded) CHECKS.forEach(([x, y, k], i) => { if (i > this.check && k === this.lane && ax >= x - 0.5 && Math.abs(ay - y) < 1.5) this.check = i; });
    if (ay < -6) this.fallBack(well, 'fall');
    this.balls_(well, dt);
  },

  fallBack(well, cause) {
    const L = this.S.lane, [x, y, k] = CHECKS[this.check];
    this.shift.cancel(); this.lane = k;
    this.retry.fall([x, y, L.z + DEPTH_LANES[k]], cause);
  },

  /** The cannon's balls, rolling along the middle lane only: one that meets you knocks you back (a hit). */
  balls_(well, dt) {
    const g = well.game, P = g.player, S = this.S, z = S.lane.z + DEPTH_LANES[CANNON_AT[2]];
    if ((this.cd -= dt) <= 0) {
      this.cd = DEPTH.every;
      const m = new THREE.Mesh(new THREE.SphereGeometry(DEPTH.r, 12, 8), new THREE.MeshStandardMaterial({ color: COLOR.pin, metalness: 0.5, roughness: 0.4 }));
      m.position.set(AT.x + CANNON_AT[0], AT.y + CANNON_AT[1], z); S.group.add(m); this.balls.push(m);
    }
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const m = this.balls[i]; m.position.x -= DEPTH.speed * dt; m.rotation.z += DEPTH.speed * dt / DEPTH.r;
      let gone = m.position.x < AT.x + CANNON_TO;
      if (!gone && Math.abs(P.pos.z - z) < 0.5 && Math.abs(P.pos.x - m.position.x) < 0.6 && Math.abs(P.pos.y + 0.8 - m.position.y) < 1.0 && !(P.invuln > 0)) {
        P.impulse(new THREE.Vector3(-DEPTH.knock, 3, 0), 'cannon'); well.hit(); gone = true;
      }
      if (gone) { m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); this.balls.splice(i, 1); }
    }
  },
  clearBalls() { for (const m of this.balls || []) { m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); } this.balls = []; },

  /** The seat kept in front of the front lane, whichever lane the plane is in: all three are seen. */
  camera(well) {
    const F = well.frame; if (!F.on || !F.spec || well.game.god?.controlling || !this.S) return;
    sideLook(well, F.cam.x, F.cam.y, F.spec.z, this.S.lane.z + SIDE_CAM.dist + DEPTH.seat);
  },
  clear() { this.clearBalls(); this.S = null; },
};
