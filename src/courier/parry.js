// ---------------------------------------------------------------------------------------
// PARRY: the one rule for answering what comes at the Courier, shared by everything that can (the kick's foot, the cutlass's blade, and
// every tool's V: docs/plans/PARRY.md, courier/parries.js). Two things can be answered: a PROJECTILE in `game.projectiles` (coming in
// near the strike, fast enough, toward the Courier, and not marked `parry: false`) and a BLOW WINDING UP (`creatures.windup`: a
// creature's telegraphed strike, in reach). How it is answered is the tool's `how`:
//
//   return   sent back where they look, a little faster than it came, with a little help toward a target (the kick, the cutlass, the
//            brush's bat, which also paints it with the load's feeling)
//   turn     turned aside: back the way it came, a third as fast, and up (the cutlass's late guard, the Dreamvane's twirl)
//   soak     a Lachryma shot drunk into the Lachrymato Bottle, else the pool (the brush's mop); anything else is turned
//   gulp     a Lachryma shot swallowed into the pool (the Lockheart); anything else is turned
//   shatter  every shot within reach broken where it is (the Crucibelle's toll)
//   stagger  shot down, and its thrower stunned (the psygun's point-blank shot)
//   shutter  a blow winding up: a free Flash's worth of stun and more (the Veritome); a shot it only turns aside
//
// A blow winding up, answered any way, breaks off and stuns the striker a little (`stagger` and `shutter` more). Either way the
// Courier is untouchable for a beat and the world takes a breath; `move.parry` says the tool and the how.
//
// A projectile is either a rigid body (`{ body }`: a lobber's ball) or a plain one (`{ pos, vel }`: a jelly's glob); either may carry
// `parry` (default true), `lachryma` (what a soak or a gulp takes from it), `from` (its thrower) and `vanish()` (taken out of the world).
//
// Prior art: Zelda's shield-parry and the Deflect of Ocarina of Time's Mirror Shield (a timing window, a return), Sekiro's deflect
// against a block (the same contact, a smaller answer if the button was already down), Punch-Out's "it comes back", Cuphead's pink
// (the parryable marked, and a promise kept), Bloodborne's gun parry, Kirby's inhale.
//
//   answer(game, { tool, how, at, radius, paint }) -> 'shot' | 'blow' | null   (the window's one call)
//   deflect(game, { at, radius, speedMin, outMin, assist, iframes, tool, paint }) -> the projectile sent back, or null
//   guard(game, { at, radius, tool })                                           -> the projectile turned aside, or null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';

const _f = new THREE.Vector3(), _t = new THREE.Vector3(), _to = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3();
export const PARRY_HOWS = ['return', 'turn', 'soak', 'gulp', 'shatter', 'stagger', 'shutter'];

/** A projectile's place and velocity, whichever kind it is. */
const posOf = (pr, out) => (pr.body ? out.copy(pr.body.translation()) : out.copy(pr.pos));
const velOf = (pr, out) => (pr.body ? out.copy(pr.body.linvel()) : out.copy(pr.vel));
const setVel = (pr, v) => (pr.body ? pr.body.setLinvel(v, true) : pr.vel.copy(v));
const live = (pr) => !(pr.body && !pr.body.isValid?.()) && !pr.parried && !pr.blocked && pr.parry !== false;
function gone(game, pr) { if (pr.vanish) pr.vanish(); else game.projectiles?.delete(pr); }

/** The projectiles near `at`, fast enough, and coming toward the Courier (nearest first). */
/** A blow is answered only when it will land within this many real seconds (the window: the siblings' own rule, coop/fight.js). */
export const BLOW_WINDOW = 0.25;

function incoming(game, at, radius, speedMin, all = false) {
  const P = game.player, out = [];
  for (const pr of game.projectiles || []) {
    if (!live(pr)) continue;
    const t = posOf(pr, new THREE.Vector3()), v = velOf(pr, new THREE.Vector3()), sp = v.length();
    if (sp < speedMin) continue;
    const d = t.distanceTo(at); if (d > radius) continue;
    if ((v.x * (P.pos.x - t.x) + v.z * (P.pos.z - t.z)) <= 0) continue; // (coming toward us)
    out.push({ pr, t, v, sp, d });
  }
  out.sort((a, b) => a.d - b.d);
  return all ? out : out[0] || null;
}

/** The breath of a parry: untouchable a beat, the camera's jolt, the time held, the sound. */
function breath(game, at, iframes = 0.35) {
  const P = game.player;
  P.invuln = Math.max(P.invuln, iframes);
  P.shake = Math.max(P.shake, 0.3);
  P.fovPunch = Math.max(P.fovPunch || 0, 5);
  game.fx?.shockwave?.(at.clone(), 1.4);
  game.time?.pulse('parry', 0.05, 0.08, { release: 0.2 });
  sfx.parry();
}

/** Sent back where they look (with a little help toward a target near the line). */
function send(game, hit, { outMin = 12, assist = 0.45, paint = null } = {}) {
  const P = game.player, { pr, t, sp } = hit;
  const out = P.lookDir(_f), speed = Math.max(sp * 1.25, outMin);
  let v2 = _v.copy(out).multiplyScalar(speed);
  let bestA = assist;
  for (const m of game.movers?.list || []) {
    if (!m.target) continue;
    const to = _to.copy(m.cur.p).sub(_t.copy(t)), d = to.length();
    const a = Math.acos(THREE.MathUtils.clamp(to.clone().normalize().dot(out), -1, 1));
    if (a < bestA) { bestA = a; const flight = d / speed; v2 = to.clone().divideScalar(flight); v2.y += 0.5 * 9.81 * flight; }
  }
  setVel(pr, v2);
  pr.mark?.clear(); pr.mark = null; // (answered: no longer the parry's to answer)
  pr.parried = true; pr.reflected = true; pr.paint = paint;
}

/** Turned aside: back the way it came, a third as fast, and up. */
function turn(game, hit) {
  const { pr, v } = hit;
  setVel(pr, _v.set(-v.x * 0.33, Math.abs(v.y) * 0.2 + 2.5, -v.z * 0.33));
  pr.mark?.clear(); pr.mark = null;
  pr.blocked = true;
}

export function deflect(game, { at, radius = 2, speedMin = 4.5, outMin = 12, assist = 0.45, iframes = 0.35, tool = 'kick', paint = null } = {}) {
  const hit = incoming(game, at, radius, speedMin);
  if (!hit) return blow(game, { tool, how: 'return', at, radius }) ? true : null; // (no shot in reach: a blow in its window, answered as every tool answers one)
  send(game, hit, { outMin, assist, paint });
  breath(game, hit.t, iframes);
  game.events?.emit('move.parry', { speed: hit.sp, tool, how: 'return', what: 'shot', d: +hit.d.toFixed(2), reach: radius, by: 'courier' });
  return hit.pr;
}

export function guard(game, { at, radius = 1.7, tool = 'cutlass' } = {}) {
  const P = game.player;
  const hit = incoming(game, at, radius, 2);
  if (!hit) return null;
  turn(game, hit);
  P.shake = Math.max(P.shake, 0.15);
  game.fx?.impact?.(hit.t.clone(), new THREE.Vector3(0, 1, 0), { sparks: 6, dust: 0 });
  sfx.guardBlock?.();
  game.events?.emit('guard.block', { speed: hit.sp, tool, by: 'courier' });
  return hit.pr;
}

/** The window's answer for a tool: a projectile in reach answered the tool's way, else a blow winding up in reach broken off (the
 *  shutter looks for the blow first, and turns a shot aside: the promise, every outlined thing answered by every tool). */
export function answer(game, { tool, how, at, radius = 2, paint = null }) {
  if (how === 'shutter') return blow(game, { tool, how, at, radius }) || shot(game, { tool, how: 'turn', at, radius });
  return shot(game, { tool, how, at, radius, paint }) || blow(game, { tool, how, at, radius });
}

function shot(game, { tool, how, at, radius, paint }) {
  const hits = incoming(game, at, radius, 2, true);
  if (!hits.length) return null;
  const hit = hits[0], { pr } = hit;
  let did = how;
  if (how === 'return') send(game, hit, { paint });
  else if (how === 'soak' || how === 'gulp') {
    if (pr.lachryma > 0) { gone(game, pr); drink(game, how, pr.lachryma); } else { turn(game, hit); did = 'turn'; } // (not Lachryma: turned)
  } else if (how === 'shatter') { for (const h of hits) { gone(game, h.pr); game.fx?.impact?.(h.t.clone(), new THREE.Vector3(0, 1, 0), { sparks: 10, dust: 4 }); } }
  else if (how === 'stagger') {
    gone(game, pr); game.fx?.impact?.(hit.t.clone(), new THREE.Vector3(0, 1, 0), { sparks: 12, dust: 0 });
    if (pr.from?.alive) game.stun?.add(pr.from, 1, { by: 'courier', cause: 'parry' });
  } else turn(game, hit);
  breath(game, hit.t);
  game.events?.emit('move.parry', { speed: hit.sp, tool, how: did, what: 'shot', d: +hit.d.toFixed(2), reach: radius, by: 'courier' });
  return 'shot';
}

function blow(game, { tool, how, at, radius }) {
  const c = game.creatures?.windups(at, radius).find((x) => x.windup.t - 0.3 <= BLOW_WINDOW); // (only in its window: a press at a lunge's first frame answers nothing, TRAINING.md 6)
  if (!c) return null;
  const lead = +Math.max(0, c.windup.t - 0.3).toFixed(3); // (seconds before the strike: read before parried() unwinds it; domains.js weighs it)
  game.creatures.parried(c);
  game.stun?.add(c, how === 'shutter' ? 1.25 : how === 'stagger' ? 1 : 0.5, { by: 'courier', cause: 'parry' }); // (the shutter: a full flash's stun and more)
  if (how === 'shutter') { game.flash?.burst?.(); c.brain?.senses?.dazzle?.(1.4); }
  breath(game, c.center ? c.center(_p) : _p.copy(c.pos));
  game.events?.emit('move.parry', { tool, how, what: 'blow', kind: c.kind, lead, by: 'courier' });
  return 'blow';
}

/** What a soak or a gulp takes: into the Lachrymato Bottle (a soak, if one is worn), else the pool. */
function drink(game, how, n) {
  const load = how === 'soak' ? game.techs?.get('soulbrush')?.load : null;
  const kept = load?.fill?.(n) || 0;
  if (n - kept > 0) game.lachryma?.gain(n - kept, 'parry');
  sfx.gulp?.(0);
}
