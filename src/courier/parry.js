// ---------------------------------------------------------------------------------------
// PARRY: the one rule for turning a projectile away, shared by everything that can (the kick's foot, the cutlass's blade). A thing
// coming in near the strike, fast enough, and toward the Courier is sent back where they are looking, a little faster than it came, with
// a little help toward a target near the line (so that a good parry is a good shot); they are untouchable for a beat; the world takes a
// breath. `guard` is its slower sibling: a projectile met by a raised blade that was not raised in time is only turned aside.
//
// Prior art: Zelda's shield-parry and the Deflect of Ocarina of Time's Mirror Shield (a timing window, a return), Sekiro's deflect
// against a block (the same contact, a smaller answer if the button was already down), and Punch-Out's "it comes back".
//
//   deflect(game, { at, radius, speedMin, outMin, assist, iframes, by })      -> the projectile turned, or null
//   guard(game, { at, radius, by })                                          -> the projectile turned aside, or null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';

const _f = new THREE.Vector3(), _t = new THREE.Vector3(), _to = new THREE.Vector3();

/** A projectile near `at`, fast enough, and coming toward the Courier. */
function incoming(game, at, radius, speedMin) {
  const P = game.player;
  for (const pr of game.projectiles || []) {
    const b = pr.body;
    if (!b?.isValid?.() || pr.parried || pr.blocked) continue;
    const t = b.translation(), v = b.linvel();
    const sp = Math.hypot(v.x, v.y, v.z);
    if (sp < speedMin) continue;
    if (Math.hypot(t.x - at.x, t.y - at.y, t.z - at.z) > radius) continue;
    if ((v.x * (P.pos.x - t.x) + v.z * (P.pos.z - t.z)) <= 0) continue; // (coming toward us)
    return { pr, b, t, v, sp };
  }
  return null;
}

export function deflect(game, { at, radius = 2, speedMin = 4.5, outMin = 12, assist = 0.45, iframes = 0.35, by = 'kick' } = {}) {
  const P = game.player;
  const hit = incoming(game, at, radius, speedMin);
  if (!hit) return null;
  const { pr, b, t, sp } = hit;
  const out = P.lookDir(_f);
  const speed = Math.max(sp * 1.25, outMin);
  let v2 = out.clone().multiplyScalar(speed);
  // (a little help: a target close to where you're looking gets the ball, dropping with gravity taken into account)
  const from = _t.set(t.x, t.y, t.z);
  let bestA = assist;
  for (const m of game.movers?.list || []) {
    if (!m.target) continue;
    const to = _to.copy(m.cur.p).sub(from), d = to.length();
    const a = Math.acos(THREE.MathUtils.clamp(to.clone().normalize().dot(out), -1, 1));
    if (a < bestA) { bestA = a; const flight = d / speed; v2 = to.clone().divideScalar(flight); v2.y += 0.5 * 9.81 * flight; }
  }
  b.setLinvel(v2, true);
  pr.parried = true; pr.reflected = true;
  P.invuln = Math.max(P.invuln, iframes);
  P.shake = Math.max(P.shake, 0.3);
  P.fovPunch = Math.max(P.fovPunch || 0, 5);
  game.fx?.shockwave?.(new THREE.Vector3(t.x, t.y, t.z), 1.4);
  game.time?.pulse('parry', 0.05, 0.08, { release: 0.2 }); // (a breath)
  sfx.parry();
  game.events?.emit('move.parry', { speed: sp, by });
  return pr;
}

export function guard(game, { at, radius = 1.7, by = 'blade' } = {}) {
  const P = game.player;
  const hit = incoming(game, at, radius, 2);
  if (!hit) return null;
  const { pr, b, t, v, sp } = hit;
  // turned aside: sent back the way it came, a third as fast, and up
  b.setLinvel({ x: -v.x * 0.33, y: Math.abs(v.y) * 0.2 + 2.5, z: -v.z * 0.33 }, true);
  pr.blocked = true;
  P.shake = Math.max(P.shake, 0.15);
  game.fx?.impact?.(new THREE.Vector3(t.x, t.y, t.z), new THREE.Vector3(0, 1, 0), { sparks: 6, dust: 0 });
  sfx.guardBlock?.();
  game.events?.emit('guard.block', { speed: sp, by });
  return pr;
}
