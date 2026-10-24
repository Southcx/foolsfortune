// ---------------------------------------------------------------------------------------
// THE GROUND AND THE STEP (part of courier/player.js): the controller's move each fixed step, and what the body asks of the ground it is
// on. `move` runs Rapier's character controller on the velocity (tipped onto the ground's plane on a slope), tries again a move the
// controller returned as nothing, takes from the velocity only what the walls actually took away, lands (the fall, the sound, the techs
// and the movers told), lets the capsule rise no higher over a crest, carries the body with the platform under it and with the ground's
// drift, and respawns it below the world's floor. What it asks: the moving platform under the feet, the walls the last move touched, the
// colliders right under the feet, the floor below a point, the ground's normal. `critters` is what a clapperjar underfoot meets: bowled
// over by a slide or a dash, jostled by a walk (the shove `move` applies). It emits move.land, mover.leave and courier.rescue (kind
// clip), through the Player's `ev`.
//
// Prior art: Rapier's kinematic character controller (autostep, snap to ground, the slope limits), as courier/player.js.
//
//   move(P, dt)   moverUnder(P)   wallHits(P)   underfoot(P)   floorBelow(P, x, z, yTop)   groundNormal(P)   critters(P, hv)
//   (P: the Player, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T, DEG } from '../../core/config.js';
import { RADIUS } from './capsule.js';

const UP = new THREE.Vector3(0, 1, 0);
const UNDERFOOT = new RAPIER.Ball(RADIUS * 0.9);
const QF = RAPIER.QueryFilterFlags;
const hlen = (v) => Math.hypot(v.x, v.z);

/**
 * Run the controller, then keep only the velocity walls actually took away. A moving
 * platform's carry is added after the controller has done its work: the platform is a
 * rigid frame, so the move made against it (at its current pose) is carried along with
 * it whole. (Feeding the carry to the controller as part of the move made it return
 * anything from nothing to double, on and off, on a turning platform.)
 */
export function move(P, dt) {
  const want = { x: P.vel.x * dt + P.shove.x, y: P.vel.y * dt, z: P.vel.z * dt + P.shove.z };
  P.shove.set(0, 0, 0);
  // on a slope, the move goes along the ground, not into it: tipped onto the ground's plane. Handed a level move, the controller
  // climbed a ramp in uneven jumps (6 to 59 mm a frame where 38 was due, its climb and autostep taking turns) and the body shook
  // with them (Petra measured it on a Dunemaw ramp at a run, R46). Level ground (n straight up) leaves the move exactly as it was.
  if (P.grounded && P.vel.y === 0) {
    const n = P.groundNormal();
    if (n.y < 0.9995 && n.y > Math.cos(T.movement.maxSlope * DEG)) want.y -= // (up to the controller's own climb limit)
       (n.x * want.x + n.z * want.z) / n.y;
  }
  const opts = [QF.EXCLUDE_SENSORS, GROUPS.controllerQuery];
  P.ctrl.computeColliderMovement(P.collider, want, ...opts);
  let mv = P.ctrl.computedMovement();
  const walls = P.wallHits();
  // Rapier's controller occasionally returns zero motion for a capsule resting in
  // its contact margin on flat ground (that was the periodic walking hitch). If only
  // the floor "blocked" us, retry the move flat.
  const wantH = Math.hypot(want.x, want.z);
  let gotH = Math.hypot(mv.x, mv.z);
  if (wantH > 1e-4 && gotH < wantH * 0.5) {
    const first = { ...mv }, firstAir = !P.ctrl.computedGrounded();
    // (flat first; then a hair upward, for a capsule that has come to rest a few millionths inside
    // its margin - on a surface that just stopped moving, say - where only an upward
    // component gets it going, and the hair is taken back off afterwards; last, a few centimetres,
    // for a capsule resting on the rounded edge of a platform that is moving: the edge's normal
    // leans outward, so a step onto the platform reads as a step into it (the lift hitch). That
    // rise is kept, not taken off (it could sink the capsule into a lip), and the floor snap
    // sets them down again next frame.)
    for (const lift of [0, 0.006, 0.04]) {
      P.ctrl.computeColliderMovement(P.collider, { x: want.x, y: Math.max(0, want.y) + lift, z: want.z }, ...opts);
      mv = P.ctrl.computedMovement();
      gotH = Math.hypot(mv.x, mv.z);
      if (gotH >= wantH * 0.5) { if (lift && lift < 0.01) mv = { x: mv.x, y: Math.min(mv.y, Math.max(0, want.y)), z: mv.z }; break; }
    }
    // (in the air the retry's flat move must not eat the fall: pressed into a wall while dropping
    // along it, the body used to hang there with its speed climbing)
    if (firstAir && want.y < 0) mv = { x: mv.x, y: first.y, z: mv.z };
  }
  P.stuck = wantH > 1e-4 && gotH < wantH * 0.15 ? (P.stuck || 0) + 1 : 0;
  const wasGrounded = P.grounded;
  P.grounded = P.ctrl.computedGrounded();
  // the controller sometimes drops "grounded" for a frame (the frame the capsule goes
  // low, for one): still on the floor if it's right under the feet and we're not rising
  if (!P.grounded && wasGrounded && want.y <= 0) {
    const gy = P.floorBelow(P.pos.x + mv.x, P.pos.z + mv.z, P.pos.y + mv.y + 0.3);
    if (gy !== null && P.pos.y + mv.y - gy < 0.06) P.grounded = true;
  }
  if (P.vel.y > 0 && mv.y < want.y * 0.5) P.vel.y = 0; // bonk
  const fallSpeed = -P.vel.y;
  if (P.grounded && !wasGrounded) {
    P.landT = 0.15;
    if (fallSpeed > 3) { P.landed = fallSpeed; P.sfx.land(fallSpeed); }
    if (P.wallrun) P.endWallrun(false);
    const under = P.underfoot();
    P.lastDrop = Math.max(0, P.airPeak - P.pos.y); // (the whole fall, from the top of the jump)
    if (P.techs) P.techs.onLand(fallSpeed, under);
    P.game?.movers?.onLand(fallSpeed, under, P.lastDrop);
    if (fallSpeed > 3 || P.airT > 0.25) {
      P.ev('move.land', { fall: fallSpeed, drop: P.lastDrop, air: P.airT, speed: hlen(P.vel), onMover: !!P.platform });
      P.airPeak = P.pos.y;
    }
  }
  if (P.grounded && P.vel.y < 0) P.vel.y = 0;
  // walls remove only the velocity pointing into them (a glancing hit keeps its speed)
  // (only if the wall actually stopped us: a lip the controller stepped over costs nothing)
  for (const n of walls) {
    const blocked = (mv.x * n.x + mv.z * n.z) - (want.x * n.x + want.z * n.z) > 1e-4;
    const d = P.vel.x * n.x + P.vel.z * n.z;
    if (blocked && d < 0) { P.vel.x -= n.x * d; P.vel.z -= n.z * d; }
  }
  if (walls.length && P.stuck > 1) { P.vel.x = mv.x / dt; P.vel.z = mv.z / dt; } // really wedged in a corner

  // over a convex crest (the top of a ramp) the controller lifts the capsule a few cm
  // for a frame: a hop in a slide. Grounded feet don't rise where the floor ahead is lower.
  if (P.grounded && wasGrounded && mv.y > 0.002 && want.y <= 0) {
    const gy = P.floorBelow(P.pos.x + mv.x, P.pos.z + mv.z, P.pos.y + 0.3);
    const mh = Math.hypot(mv.x, mv.z) || 1;
    // (probed under the capsule's leading edge too: the controller reacts to the crest
    // before the capsule's centre gets there)
    const ahead = P.floorBelow(P.pos.x + mv.x + (mv.x / mh) * RADIUS, P.pos.z + mv.z + (mv.z / mh) * RADIUS, P.pos.y + 0.3);
    const here = gy !== null ? P.floorBelow(P.pos.x, P.pos.z, P.pos.y + 0.3) : null;
    // the floor falls away ahead (a crest): nothing to rise onto. Elsewhere the controller
    // still gets to hold its usual 2 cm skin above the floor.
    const lower = (y) => y !== null && here !== null && y < here - 0.003;
    if (lower(ahead) || lower(gy)) mv.y = 0;
    else if (gy !== null && gy < P.pos.y + 0.01) mv.y = Math.max(0, Math.min(mv.y, gy + 0.02 - P.pos.y));
  }
  const px = P.pos.x, py = P.pos.y, pz = P.pos.z;
  P.pos.x += mv.x; P.pos.y += mv.y; P.pos.z += mv.z;
  // (a long move - a blink's metre a step - can graze the underside or edge of something and
  // leave the capsule inside it; the controller isn't asked twice. Keep the last clear spot.)
  if ((Math.abs(mv.x) + Math.abs(mv.z) + Math.abs(mv.y)) > 0.004 && P.embedded()) {
    const hx = P.pos.x, hy = P.pos.y, hz = P.pos.z;
    P.pos.set(px, py, pz);
    if (!P.embedded()) {
      // creep toward where the controller wanted us, as far as it stays clear
      for (const k of [0.75, 0.5, 0.25, 0.1]) {
        P.pos.set(px + (hx - px) * k, py + (hy - py) * k, pz + (hz - pz) * k);
        if (!P.embedded()) break;
        P.pos.set(px, py, pz);
      }
      P.ev('courier.rescue', { kind: 'clip' });
    } else P.pos.set(hx, hy, hz); // (already inside before: leave it to guard())
  }

  // the platform under us (judged with it still at its current pose) carries the whole move
  const under = P.grounded ? P.moverUnder() : null;
  const ride = under || P.platform;
  if (ride) {
    ride.displacement(P.pos, P.carry);
    P.pos.add(P.carry);
    // (the carry isn't swept: a platform can take us into a wall or a ceiling; then we stay put
    // and the platform goes on without us)
    if (P.carry.lengthSq() > 1e-8 && P.embedded()) { P.pos.sub(P.carry); P.carry.set(0, 0, 0); }
    P.groundVel.copy(P.carry).multiplyScalar(1 / dt);
    if (!under) {
      // stepped, jumped or was thrown off: it keeps its velocity
      P.vel.add(P.groundVel);
      P.ev('mover.leave', { speed: P.groundVel.length() });
    }
  }
  P.platform = under;
  // the ground's drift (sand sliding: world/well/bowl.js), carried as a platform's move is, and swept no more than one is
  if (P.grounded && P.drift.lengthSq() > 1e-6) {
    const dx = P.drift.x * dt, dy = P.drift.y * dt, dz = P.drift.z * dt; // (y: down a slope, the way the sand goes)
    P.pos.x += dx; P.pos.y += dy; P.pos.z += dz;
    if (P.embedded()) { P.pos.x -= dx; P.pos.y -= dy; P.pos.z -= dz; }
  }
  if (P.pos.y < P.killY) P.respawn();
  P.body.setNextKinematicTranslation({ x: P.pos.x, y: P.pos.y, z: P.pos.z });
}

/** The moving platform we're standing on, or null. */
export function moverUnder(P) {
  const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 0.15, z: P.pos.z }, { x: 0, y: -1, z: 0 }, 0.6, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
  if (hit) return hit.entity?.type === 'mover' ? hit.entity.mover : null;
  // (over an edge: the capsule can still be resting on it)
  for (const c of P.underfoot()) {
    const e = P.physics.entityOf(c);
    if (e?.type === 'mover') return e.mover;
  }
  return null;
}

/** Horizontal normals of the steep things the last move touched. */
export function wallHits(P) {
  const out = [];
  for (let i = 0; i < P.ctrl.numComputedCollisions(); i++) {
    const c = P.ctrl.computedCollision(i);
    const n = c.normal1;
    if (Math.abs(n.y) > 0.7) continue;
    const l = Math.hypot(n.x, n.z);
    if (l > 1e-3) out.push({ x: n.x / l, z: n.z / l });
  }
  return out;
}

/** Colliders right under the feet (what we're standing on; a jar's rim counts). */
export function underfoot(P) {
  const out = [];
  // (reaching a little below the feet: the controller calls it a landing within its snap distance)
  P.physics.world.intersectionsWithShape({ x: P.pos.x, y: P.pos.y - 0.08, z: P.pos.z }, { x: 0, y: 0, z: 0, w: 1 }, UNDERFOOT,
    (c) => { out.push(c); return true; }, QF.EXCLUDE_SENSORS, GROUPS.controllerQuery, P.collider);
  return out;
}

export function floorBelow(P, x, z, yTop) {
  const hit = P.physics.raycast({ x, y: yTop, z }, { x: 0, y: -1, z: 0 }, 0.6, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
  return hit ? hit.point.y : null;
}

export function groundNormal(P) {
  const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 0.15, z: P.pos.z }, { x: 0, y: -1, z: 0 }, 0.5, P.collider, GROUPS.controllerQuery);
  return hit ? hit.normal : UP;
}

// ---- critters ----------------------------------------------------------------
export function critters(P, hv) {
  const cl = P.game?.clappers;
  if (!cl) return;
  const M = T.movement;
  const bowl = P.sliding || P.dashT > 0;
  for (const c of cl.list) {
    if (!c.alive) continue;
    const dx = P.pos.x - c.pos.x, dz = P.pos.z - c.pos.z;
    const d = Math.hypot(dx, dz);
    const reach = RADIUS + 0.26 * T.clappers.scale;
    if (d > reach + 0.15 || Math.abs(c.pos.y - P.pos.y) > 1) continue;
    if (bowl && c.state !== 'knocked' && d < reach + 0.15) { cl.knock(c, hv.clone().multiplyScalar(0.9).setY(4)); continue; }
    if (d >= reach) continue;
    // they're small: overlap mostly moves them, and only nudges you
    const k = (reach - d) / Math.max(d, 1e-3);
    P.shove.x += dx * k * M.critterPush;
    P.shove.z += dz * k * M.critterPush;
    cl.bump?.(c, -dx * k * (1 - M.critterPush), -dz * k * (1 - M.critterPush));
  }
}
