// ---------------------------------------------------------------------------------------
// THE AIR (part of courier/player.js): what the core movement does off the ground when no tech has the body. The wall run: a wall probed
// for at either side and ahead of the body in the air, taken when the speed along it is enough and the ground is out of reach (never
// in water), run along at a speed it gains toward the wall run's own while gravity comes back slowly, ended by a lost wall, the time
// limit, the forward key let go or water, with a push off the wall; and the wall jump from it. And the puffs a jump (`jumpFx`, asked by
// the techs too) and a dash (`dashFx`) leave on the air. The jump and the dash themselves are decided in the fixed step
// (courier/player.js), which calls these. It emits wallrun.start and wallrun.end, through the Player's `ev`.
//
// Prior art: Titanfall's wallrun (as courier/player.js).
//
//   probeWall(P, dir, len)   inWater(P)   tryWallrun(P, hv)   stepWallrun(P, dt, hv, iz)   endWallrun(P, push)   wallJump(P, hv, wishDir)
//   dashFx(P, dir)   jumpFx(P, k)        (P: the Player, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../../core/physics.js';
import { T } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { RADIUS } from './capsule.js';

const simRand = stream('courier/player'); // (the simulation's chance: core/rng.js, the same twice; the Player's one stream, whichever part asks)
const hlen = (v) => Math.hypot(v.x, v.z);

// ---- wallrun -------------------------------------------------------------------
export function probeWall(P, dir, len) {
  const solid = (c) => !c.isSensor() && !c.parent()?.isDynamic();
  const hit = P.physics.raycast({ x: P.pos.x, y: P.pos.y + 1.0, z: P.pos.z }, dir, len, P.collider, GROUPS.controllerQuery, solid);
  return hit && Math.abs(hit.normal.y) < 0.25 ? hit : null;
}

/** In the water or at its surface (feet no more than a hand above it): nothing to run on. */
export function inWater(P) {
  const v = P.game?.water?.at(P.pos.x, P.pos.y + 0.9, P.pos.z);
  return !!v && P.pos.y < v.surface + 0.25;
}

export function tryWallrun(P, hv) {
  const M = T.movement;
  if (P.inWater()) return; // (no wallrunning underwater or at the surface)
  if (hlen(hv) < M.wallrunMinSpeed * 0.6) return;
  // too close to the ground to bother
  if (P.physics.raycast({ x: P.pos.x, y: P.pos.y + 0.1, z: P.pos.z }, { x: 0, y: -1, z: 0 }, M.wallrunMinHeight, P.collider, GROUPS.controllerQuery)) return;
  const r = P.right(new THREE.Vector3()), f = P.forward(new THREE.Vector3());
  const reach = RADIUS + T.movement.wallrunReach;
  const probes = [[r, 1, reach], [r.clone().negate(), -1, reach],
    [r.clone().add(f).normalize(), 1, reach + 0.2], [r.clone().negate().add(f).normalize(), -1, reach + 0.2]];
  for (const [dir, side, len] of probes) {
    const hit = P.probeWall(dir, len);
    if (!hit) continue;
    const n = new THREE.Vector3(hit.normal.x, 0, hit.normal.z).normalize();
    if (hit.collider.handle === P.lastWall && P.wallCd > -0.35) continue; // same wall again: needs a moment
    const along = hv.clone().addScaledVector(n, -hv.dot(n));
    if (along.length() < M.wallrunMinSpeed * 0.6 || hv.dot(n) > 1) continue;
    P.wallrun = { n, side, t: 0, lost: 0, dist: 0, handle: hit.collider.handle, dir: along.normalize() };
    P.ev('wallrun.start', { side, speed: along.length() });
    P.airJumps = M.airJumps;
    P.dashCharges = M.dashCharges;
    P.sliding = false;
    P.dashT = 0;
    P.vel.y = THREE.MathUtils.clamp(P.vel.y, M.wallrunStartUp, M.wallrunStartUp * 1.6);
    P.sfx.wallTouch?.();
    return;
  }
}

export function stepWallrun(P, dt, hv, iz) {
  const M = T.movement, w = P.wallrun;
  w.t += dt;
  const hit = P.probeWall(w.n.clone().negate(), RADIUS + T.movement.wallrunReach + 0.2);
  if (hit) { w.n.set(hit.normal.x, 0, hit.normal.z).normalize(); w.lost = 0; } else w.lost += dt;
  // run along the wall, speeding up toward wallrunSpeed
  const along = hv.clone().addScaledVector(w.n, -hv.dot(w.n));
  if (along.lengthSq() > 0.01) w.dir.copy(along).normalize();
  else w.dir.addScaledVector(w.n, -w.dir.dot(w.n)).normalize();
  let sp = along.length();
  if (sp < M.wallrunSpeed) sp = Math.min(M.wallrunSpeed, sp + M.wallrunAccel * dt);
  hv.copy(w.dir).multiplyScalar(sp).addScaledVector(w.n, -1.2); // hug the wall
  w.dist += sp * dt;
  // gravity comes back in slowly
  const g = w.t < M.wallrunHold ? M.gravity * 0.3 : M.wallrunGravity;
  P.vel.y = Math.max(-M.wallrunMaxFall, P.vel.y - g * dt);
  if (w.lost > 0.08 || w.t > M.wallrunMaxTime || iz <= 0 || P.inWater()) P.endWallrun(true);
}

export function endWallrun(P, push) {
  const w = P.wallrun;
  if (!w) return;
  if (push) { P.vel.x += w.n.x * 1.2; P.vel.z += w.n.z * 1.2; }
  P.ev('wallrun.end', { dur: w.t, dist: w.dist, side: w.side });
  P.lastWall = w.handle;
  P.wallCd = 0.2;
  P.wallrun = null;
}

export function wallJump(P, hv, wishDir) {
  const M = T.movement, w = P.wallrun;
  const along = hv.clone().addScaledVector(w.n, -hv.dot(w.n));
  hv.copy(along).multiplyScalar(M.wallJumpKeep).addScaledVector(w.n, M.wallJumpOut);
  if (wishDir.lengthSq() > 0.01) hv.addScaledVector(wishDir.clone().normalize(), 1.5);
  P.vel.y = M.wallJumpUp;
  P.endWallrun(false);
  P.wallCd = 0.25;
  P.jumpFx(0.4);
  P.sfx.airJump();
}

// ---- fx ------------------------------------------------------------------------
export function dashFx(P, dir) {
  const fx = P.game?.fx;
  if (!fx) return;
  const c = new THREE.Color(0xf3c9a8);
  for (let i = 0; i < 18; i++) {
    const p = P.pos.clone().add(new THREE.Vector3((simRand() - 0.5) * 0.5, 0.3 + simRand() * 1.2, (simRand() - 0.5) * 0.5));
    fx.alpha.emit({ pos: p, vel: dir.clone().multiplyScalar(-2 - simRand() * 3), life: 0.35 + simRand() * 0.2, size: 0.1, sizeEnd: 0.4, color: c, alpha: 0.3, drag: 4 });
  }
}

export function jumpFx(P, k = 1) {
  const fx = P.game?.fx;
  if (!fx) return;
  const c = new THREE.Color(0xf3c9a8);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    fx.alpha.emit({ pos: P.pos.clone().setY(P.pos.y + 0.1), vel: new THREE.Vector3(Math.cos(a) * 2.5, -0.5, Math.sin(a) * 2.5).multiplyScalar(k), life: 0.4, size: 0.08, sizeEnd: 0.35, color: c, alpha: 0.3 * k, drag: 5 });
  }
}
