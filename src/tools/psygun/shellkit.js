// ---------------------------------------------------------------------------------------
// THE SHELL PARTS' SMALL TOOLS: what more than one of the caster shells' mechanics needs (tools/psygun/shellrunner.js and the part
// modules beside it: shellsplitchain.js, shelldeployables.js, shellbodies.js, shellspacetime.js, shellcastersown.js). A direction in a
// cone, a creature's middle, whether it is a FOE (never removed outright: CASTER-SHELLS.md rule 4), whether it is in view, a blow from a
// round that passes through, moving the Courier as a shell would (Swap, Bookmark, a portal), hiding a creature a while (Rift, Leyline),
// an ally fighting for the Courier for a while (Brainwash, Marionette), and a projectile's place and velocity whatever its kind.
//
// Prior art: the gameplay-ability "task" helpers of Unreal's GAS (small verbs every ability shares), and the parry's own posOf/velOf
// (courier/parry.js), copied so the shells need not reach into it.
//
//   spreadDir(axis, deg)  centerOf(c, out)  isBoss(c)  graze(R, p, c, at, dir, power, again)  inView(g, c)  foesInView(g, max, range)
//   moveCourier(g, to, yaw?)  stash(g, c) / unstash(g, c, at)  fightFor(g, c, { dur, power, end })  projPos(pr, out)  projVel(pr, out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEG } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { foesNear } from './shellpayloads.js';
const simRand = stream('tools/psygun/shellkit'); // (the simulation's chance: core/rng.js, the same twice)

const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3();

/** A direction within `deg` of an axis (a cone's spread). */
export function spreadDir(axis, deg) {
  const a = simRand() * Math.PI * 2, r = Math.sqrt(simRand()) * Math.tan(deg * DEG * 0.5);
  const side = _v.crossVectors(axis, Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP).normalize().clone();
  const up = new THREE.Vector3().crossVectors(side, axis).normalize();
  return axis.clone().addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
}
/** The shell parts' own draw of chance (the same twice). */
export const shellRand = () => simRand();

/** A creature's middle. */
export const centerOf = (c, out = new THREE.Vector3()) => out.copy(c.pos).setY(c.pos.y + c.height * 0.5);
/** A FOE (a Well's keeper, a class over 0): never removed, swapped or hidden outright; a shell that would wrenches a stage instead. */
export const isBoss = (c) => (c?.cls ?? 0) > 0;

/** A blow from a round that passes through or caroms off a creature (not a landing), struck again only after `again` real seconds. */
export function graze(R, p, c, at, dir, power, again = 0.4) {
  p.struck.set(c, again);
  R.game.creatures.strike(c, at.clone(), dir.clone(), power, 'shot', 'courier', null, p.row.n.type || 'impact');
  R.game.hud?.hitmarker?.(!c.alive);
}

/** Is a creature on the screen and in sight of the camera (nothing static between)? */
export function inView(g, c, range = 60) {
  const cam = g.camera; if (!cam) return false;
  const m = centerOf(c, _v);
  cam.getWorldPosition(_w);
  const d = m.distanceTo(_w); if (d > range) return false;
  _n.copy(m).project(cam);
  if (_n.z > 1 || Math.abs(_n.x) > 0.95 || Math.abs(_n.y) > 0.95) return false;
  const dir = m.clone().sub(_w).normalize();
  const hit = g.physics.raycast(_w, dir, d - c.radius, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type);
  return !hit;
}
/** The foes in view, nearest the middle of the screen first (the lock-on's order). */
export function foesInView(g, max = 6, range = 60) {
  const cam = g.camera, P = g.player; if (!cam || !P) return [];
  const out = [];
  for (const c of foesNear(g, P.pos, range)) {
    if (!inView(g, c, range)) continue;
    _n.copy(centerOf(c, _v)).project(cam);
    out.push([Math.hypot(_n.x, _n.y), c]);
  }
  return out.sort((a, b) => a[0] - b[0]).slice(0, max).map((x) => x[1]);
}

/** The Courier set down somewhere else as a shell would (Swap, Bookmark, a portal): their speed kept unless `stop`. */
export function moveCourier(g, to, { yaw = null, stop = false } = {}) {
  const P = g.player; if (!P) return;
  P.pos.copy(to); P.prevPos.copy(to); P.renderPos.copy(to);
  if (stop) P.vel.set(0, 0, 0);
  if (yaw != null) { P.yaw = yaw; P.bodyYaw = yaw; }
  P.airPeak = to.y; P.airT = 0; P.wallrun = null; P.mantle = null;
  P.place?.();
  g.fx?.absorbSparkle?.(to.clone().setY(to.y + 1));
}

/** A creature taken out of the world a while (Rift, Leyline): not drawn, not solid, its body still. A FOE is never stashed. */
export function stash(g, c) {
  if (!c || isBoss(c) || c.stashed) return false;
  c.stashed = true; c.taking = true; if (c.root) c.root.visible = false; c.col?.setEnabled?.(false);
  g.creatures.apply(c, 'halt', 30, 1);
  return true;
}
/** Back into the world at `at` (falling, if it is above the ground). */
export function unstash(g, c, at) {
  if (!c?.stashed) return;
  c.stashed = false; c.taking = false; if (c.root) c.root.visible = true; if (c.alive) c.col?.setEnabled?.(true);
  g.creatures.clearStatus?.(c, 'halt');
  if (g.jellies && (c.kind === 'slipjelly' || c.kind === 'spirit')) { g.jellies.place(c, at); c.air = true; c.vy = 0; c.groundY = null; }
  else c.pos.copy(at);
}

/** A creature fighting for the Courier a while (Brainwash, Marionette): an ally (their blows pass through it), driven at the nearest
 *  foe and striking it, following them when there is none; `end` when its time is up or it falls. Jellies only (their `driven` hook). */
export function fightFor(g, c, { dur = 20, power = 1.5, until = null, end = null } = {}) {
  if (!c?.alive || isBoss(c)) return false;
  const was = { ally: c.ally, driven: c.driven }, P = g.player;
  c.ally = true; c.fighting = true;
  let cool = 0, left = dur, quiet = 0;
  g.creatures.apply(c, 'charm', dur, 1);
  c.driven = (dt) => {
    left -= dt; cool -= dt;
    const foe = foesNear(g, c.pos, 18).find((x) => x !== c);
    quiet = foe ? 0 : quiet + dt;
    if (left <= 0 || !c.alive || until?.(quiet)) { release(); return; }
    const to = foe ? foe.pos : P.pos, d = _v.subVectors(to, c.pos).setY(0), len = d.length();
    const speed = 2.6, reach = c.radius + (foe ? foe.radius : 2) + 0.3;
    c.want.copy(len > reach ? d.multiplyScalar(speed / Math.max(len, 1e-3)) : d.set(0, 0, 0));
    c.face = to;
    if (foe && len <= reach + 0.2 && cool <= 0) { cool = 1; g.creatures.strike(foe, centerOf(foe), _w.subVectors(foe.pos, c.pos).setY(0.2).normalize().clone(), power, 'blow', 'courier', c); c.deform?.kick?.(3, null, 0.2); }
  };
  const release = () => {
    if (!c.fighting) return;
    c.fighting = false; c.ally = was.ally; c.driven = was.driven;
    g.creatures.clearStatus?.(c, 'charm');
    end?.(c);
  };
  c.releaseFight = release;
  return true;
}

/** A projectile's place and velocity, whichever kind it is (a lobber's ball has a body; a jelly's glob a position and `v`). */
export const projPos = (pr, out) => (pr.body ? out.copy(pr.body.translation()) : out.copy(pr.pos ?? pr.m?.position ?? _v.set(0, -999, 0)));
export const projVel = (pr, out) => (pr.body ? out.copy(pr.body.linvel()) : out.copy(pr.vel ?? pr.v ?? _v.set(0, 0, 0)));
export const setProjVel = (pr, v) => { if (pr.body) pr.body.setLinvel(v, true); else (pr.vel ?? pr.v)?.copy(v); };
/** A projectile taken out of the air (caught, blocked). */
export const takeProj = (g, pr) => { pr.blocked = true; pr.mark?.clear?.(); if (pr.vanish) pr.vanish(); else g.projectiles?.delete(pr); };
