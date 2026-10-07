// ---------------------------------------------------------------------------------------
// A SIBLING'S FOLLOW: how a sibling keeps with the one it follows, by pressing the Courier's own keys (W, Shift, Space) on a virtual
// keyboard, so it moves exactly as the Courier moves (CLAUDE.md: the core movement is the gold standard; nothing here touches it).
// Each sibling has a slot beside its leader (to the sides and a little behind, never in the camera's line: COOP.md, within 6 m); it
// walks to it, sprints when far, jumps when the leader is above it or when it is stuck against something, and double-jumps if the first
// was not enough. Too far behind (a teleport, another room, a long fall), it is set down in its slot at once, as a party member is in
// Kingdom Hearts and Ocarina's Navi: the party never gets lost. Steering is the creatures' (`creatures/ai/steer.js`: arrive, separate,
// avoid), blended. The orders (Dovina's rulings, COOP.md): follow and free (the slot), guard (a near slot), hold (where it stood),
// go (to a point, then stay), scout (ahead of the leader), back (follow, warped at once if far), engage (closing on a foe: coop/fight.js).
// Every goal has a give-up (casebook rule 32): a sibling that has stopped closing on it (pressed against a wall, sliding along one,
// circling a pillar: `noProgress` seconds without gaining half a metre) is set down at it, or beside the leader; one told to go or hold
// that cannot be set down there gives up and says so (`onStuck('warp' | 'gave-up')`, coop/sibling.js).
//
// Prior art: Kingdom Hearts' party (Donald and Goofy keep a slot beside Sora and warp back when left behind), the follower AI of
// Banjo-Tooie's and The Last of Us's companions (a slot, a catch-up, never in the way), Reynolds' steering behaviours.
//
//   const F = new Follow(body, keys, { slot, of })   F.think(dt, { leader, others, probe, order, to })   F.stuck, F.since (seconds)   F.onStuck
//   order: 'follow' | 'free' | 'guard' | 'hold' | 'go' (to: a point) | 'scout' | 'back' | 'engage' (to: where to stand to strike)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { arrive, separate, avoid, blend } from '../creatures/ai/steer.js';
import { T } from '../core/config.js';
import { GROUPS } from '../core/physics.js';

const KEEP = { r: 3.2, row: 1.8, guard: 2, scout: 10, side: 1.4, back: 0.45, slowR: 3, sprintAt: 6, idle: 0.35, catchUp: 28, catchUpY: 9, backWarp: 12, stuckJump: 0.35, stuckWarp: 3, noProgress: 6, progress: 0.5 };
const STAY = new Set(['hold', 'go']); // (orders that stand where told: never warped to the leader)
const _goal = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();

export class Follow {
  /** body: the sibling's Player; keys: its VirtualKeys; slot: its place in the arc (0..of-1). */
  constructor(body, keys, { slot = 0, of = 1 } = {}) {
    this.body = body; this.keys = keys; this.slot = slot; this.of = of;
    this.stuck = 0; this.jumped = 0; this.holdAt = null; this.lastLeader = null;
    this.best = Infinity; this.since = 0; this.goalAt = new THREE.Vector3(Infinity, 0, 0); this.onStuck = null; // (progress on the goal: its best distance, the seconds since it gained)
  }

  /** Where this sibling's slot is: beside the leader as it faces, right then left, a little behind, out of the camera's line. */
  slotOf(leader, out = _goal, r0 = KEEP.r) {
    const side = this.slot % 2 ? -1 : 1, row = Math.floor(this.slot / 2);
    const a = leader.bodyYaw + side * (KEEP.side + KEEP.back * row), r = r0 + row * KEEP.row;
    return out.set(leader.pos.x + Math.sin(a) * r, leader.pos.y, leader.pos.z + Math.cos(a) * r);
  }

  think(dt, { leader, others = [], probe = null, order = 'follow', to = null }) {
    const B = this.body, K = this.keys;
    if (order === 'hold') { if (!this.holdAt) this.holdAt = B.pos.clone(); _goal.copy(this.holdAt); }
    else if ((order === 'go' || order === 'engage') && to) { this.holdAt = null; _goal.copy(to); } // (engage: closing on a foe, coop/fight.js: still warped back if you go far)
    else if (order === 'scout') { this.holdAt = null; _goal.set(leader.pos.x + Math.sin(leader.bodyYaw) * KEEP.scout, leader.pos.y, leader.pos.z + Math.cos(leader.bodyYaw) * KEEP.scout); }
    else { this.holdAt = null; this.slotOf(leader, _goal, order === 'guard' ? KEEP.guard : KEEP.r); }
    // left far behind (a teleport, a fall, another room): set down in the slot
    const jumpedAway = this.lastLeader && this.lastLeader.distanceTo(leader.pos) > 12;
    this.lastLeader = (this.lastLeader || new THREE.Vector3()).copy(leader.pos);
    const dx = _goal.x - B.pos.x, dz = _goal.z - B.pos.z, d = Math.hypot(dx, dz), dy = leader.pos.y - B.pos.y;
    const lead = Math.hypot(leader.pos.x - B.pos.x, leader.pos.z - B.pos.z);
    // progress: a goal it has stopped closing on is as stuck as a wall it presses on
    if (_goal.distanceTo(this.goalAt) > 2) { this.goalAt.copy(_goal); this.best = d; this.since = 0; }
    else if (d < this.best - KEEP.progress) { this.best = d; this.since = 0; }
    else this.since = d > 1 ? this.since + dt : 0;
    const lost = this.stuck > KEEP.stuckWarp || this.since > KEEP.noProgress;
    if (!STAY.has(order) && (jumpedAway || lead > KEEP.catchUp || Math.abs(dy) > KEEP.catchUpY || lost || (order === 'back' && lead > KEEP.backWarp))) { this.warp(leader); return; }
    if (STAY.has(order) && lost) { const g = _b.copy(_goal); this.onStuck?.(this.warpTo(g) ? 'warp' : 'gave-up'); return; } // (told to stand somewhere it cannot walk to: set down there, or give up)
    // the way to go: arrive at the slot, out of the others' way, round what is in front
    arrive(_a, B.pos, _goal, d > KEEP.sprintAt ? T.movement.sprintSpeed : T.movement.walkSpeed, KEEP.slowR);
    separate(_b, B.pos, others, 1.2);
    if (probe) avoid(_c, B.pos, _a, probe, 1.5); else _c.set(0, 0, 0);
    blend(_v, [[_a, 1], [_b, 1.5], [_c, 1.2]], T.movement.sprintSpeed);
    const speed = Math.hypot(_v.x, _v.z), going = speed > KEEP.idle && d > 0.6;
    K.hold('KeyW', going); K.hold('ShiftLeft', going && d > KEEP.sprintAt);
    if (going) B.yaw = Math.atan2(_v.x, _v.z);
    // stuck: pressing on and not moving
    const moving = Math.hypot(B.vel.x, B.vel.z) > 0.6;
    this.stuck = going && !moving ? this.stuck + dt : Math.max(0, this.stuck - dt * 2);
    // a jump: the leader is above and near, or it is stuck; once more in the air if the first was not enough
    this.jumped = Math.max(0, this.jumped - dt);
    const wantUp = going && ((dy > 0.8 && d < KEEP.sprintAt) || this.stuck > KEEP.stuckJump);
    if (wantUp && this.jumped <= 0 && (B.grounded || (B.airJumps > 0 && B.airT > 0.1 && B.vel.y < 1))) { K.tap('Space'); this.jumped = 0.3; }
  }

  /** Set down at a point, on the ground found under it; false (and nothing moved) when there is no ground there. */
  warpTo(at) {
    const B = this.body, hit = B.physics.raycast({ x: at.x, y: at.y + 3, z: at.z }, { x: 0, y: -1, z: 0 }, 8, B.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    this.stuck = 0; this.since = 0; this.best = Infinity; this.keys.release();
    if (!hit || hit.normal.y < 0.6) return false;
    B.pos.set(at.x, hit.point.y, at.z); B.prevPos.copy(B.pos); B.renderPos.copy(B.pos); B.vel.set(0, 0, 0); B.place(); B.markSafe();
    return true;
  }

  /** Set down in the slot (found on the ground under it, or beside the leader if there is none). */
  warp(leader) {
    const B = this.body, g = this.slotOf(leader, _goal), hit = B.physics.raycast({ x: g.x, y: leader.pos.y + 2, z: g.z }, { x: 0, y: -1, z: 0 }, 6, B.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    B.pos.copy(hit && hit.normal.y > 0.6 ? _a.set(g.x, hit.point.y, g.z) : leader.pos);
    B.prevPos.copy(B.pos); B.renderPos.copy(B.pos); B.vel.set(0, 0, 0); B.place(); B.markSafe();
    this.stuck = 0; this.since = 0; this.best = Infinity; this.keys.release();
  }
}
