// ---------------------------------------------------------------------------------------
// LOCK-ON: Z-targeting, for a mouse. One thing is held in the sights: a marker (brackets that close on it) sits on it, the camera
// swings to keep it in the middle of the screen, the body squares up to it, and every stroke and lunge goes toward it. The movement
// keys stay the camera's, so with the camera holding the target they are strafing around it: the circle-strafe that Zelda's Z-target
// is remembered for. The mouse is quieter while locked (a fifth of its usual sway); a hard flick of it, or the wheel, moves the lock
// to the next thing in that direction. Z or the middle button lets it go, and so does the thing dying, going out of reach, or a wall
// getting between for more than a moment.
//
// Prior art, and what was taken:
//  - The Legend of Zelda: Ocarina of Time and Twilight Princess: Z-targeting (the marker, the camera behind the shoulder framing the
//    target, strafing around it, a target switched by nudging the stick), the thing the whole game's melee is built to sit on.
//  - Dark Souls / The Witcher 3 on PC: the mouse flick that switches the lock, the camera doing the work, a lost target released.
//
//   game.lock.toggle()     game.lock.cycle(+1 | -1)     game.lock.target -> { type, ref } | null     game.lock.point(out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Reticle } from './angling/reticle.js';
import { GROUPS } from './physics.js';
import { sfx } from './audio.js';

const RANGE = 18, KEEP = 26, GOLD = 0xffd76a;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _e = new THREE.Vector3();

export class LockOn {
  constructor(game) {
    this.game = game;
    this.target = null;
    this.reticle = new Reticle(game.scene, { mind: true }); // (the Mind's: black labradorite, docs/LOOK.md)
    this.flickCool = 0; this.blocked = 0; this.losT = 0; this.t = 0;
    this.assist = true;
    game.player.lookScale = game.player.lookScale || { lock: 1, blade: 1 };
  }
  get active() { return !!this.target; }

  /** The middle of a thing (world). */
  pointOf(t, out) {
    if (t.type === 'clapper') return out.copy(t.ref.pos).setY(t.ref.pos.y + 0.35);
    if (t.type === 'creature') return t.ref.center(out); // (a creature: creatures.js)
    const b = t.ref.body.translation();
    return out.set(b.x, b.y + (t.ref.P?.height ?? 0.5) * 0.45, b.z);
  }
  point(out) { return this.target ? this.pointOf(this.target, out) : null; }
  /** Where the target is DRAWN this frame (between physics steps, as its model is): what the reticle and the camera follow, so
   *  neither steps at the physics rate against a smoothly drawn jar. */
  shownOf(t, out) {
    const a = this.game.alpha ?? 1;
    if (t.type === 'clapper') { const c = t.ref; out.lerpVectors(c.prevPos || c.pos, c.pos, a); return out.setY(out.y + (c.hop || 0) + 0.35); }
    if (t.type === 'creature') { const c = t.ref; out.lerpVectors(c.prevPos || c.pos, c.pos, a); return out.setY(out.y + (c.height ?? 1) * 0.55); }
    const m = t.ref.mesh;
    if (m) { m.updateMatrixWorld(); out.setFromMatrixPosition(m.matrixWorld); return out.setY(out.y + (t.ref.P?.height ?? 0.5) * 0.45); }
    return this.pointOf(t, out);
  }
  alive(t) { return !!t && t.ref.alive !== false && (t.type !== 'clapper' || !t.ref.ally); }

  /** Everything that could be locked to, near the Courier. */
  candidates() {
    const g = this.game, P = g.player, out = [], p = P.pos;
    for (const c of g.clappers?.list || []) if (c.alive && !c.ally && c.pos.distanceToSquared(p) < KEEP * KEEP) out.push({ type: 'clapper', ref: c });
    for (const c of g.creatures?.list || []) if (c.alive && c.pos.distanceToSquared(p) < KEEP * KEEP && Math.abs(c.pos.y - p.y) < 8) out.push({ type: 'creature', ref: c });
    for (const e of g.breakables?.items || []) {
      if (!e.alive || e.def?.trial || !e.body) continue;
      const t = e.body.translation();
      if ((t.x - p.x) ** 2 + (t.z - p.z) ** 2 > KEEP * KEEP || Math.abs(t.y - p.y) > 8) continue;
      out.push({ type: 'breakable', ref: e });
    }
    return out;
  }

  /** Is there a clear line from the eye to the point? */
  clear(pt) {
    const g = this.game, P = g.player;
    g.camera.getWorldPosition(_e);
    _b.copy(pt).sub(_e);
    const d = _b.length();
    if (d < 0.6) return true;
    const hit = g.physics.raycast(_e, _b.multiplyScalar(1 / d), d - 0.4, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    return !hit;
  }

  acquire() {
    const g = this.game;
    g.camera.getWorldPosition(_e); g.camera.getWorldDirection(_f);
    let best = null, bs = 1e9;
    for (const t of this.candidates()) {
      this.pointOf(t, _a);
      const d = _a.distanceTo(_e);
      if (d > RANGE || d < 0.5) continue;
      const dot = _b.copy(_a).sub(_e).multiplyScalar(1 / d).dot(_f);
      if (dot < 0.35) continue;
      const score = (1 - dot) * 2.4 + (d / RANGE) * 0.7 - (t.type === 'clapper' ? 0.25 : 0);
      if (score < bs && this.clear(_a)) { bs = score; best = t; }
    }
    if (!best) return false;
    this.set(best);
    return true;
  }

  set(t) {
    this.target = t; this.blocked = 0; this.losT = 0;
    this.reticle.flash = 1;
    sfx.lockOn?.(1);
    this.game.events?.emit('lock.on', { type: t.type });
  }

  release(why = 'let go') {
    if (!this.target) return;
    this.target = null;
    this.game.player.lookScale.lock = 1;
    this.game.events?.emit('lock.off', { why });
  }

  toggle() { if (this.target) this.release(); else this.acquire(); }

  /** Move the lock to the next thing to the right (+1) or left (-1) on the screen. */
  cycle(dir) {
    if (!this.target) return this.acquire();
    const g = this.game, cam = g.camera;
    this.pointOf(this.target, _a);
    const x0 = _b.copy(_a).project(cam).x;
    let best = null, bd = 1e9, wrapBest = null, wx = dir > 0 ? 1e9 : -1e9;
    for (const t of this.candidates()) {
      if (t.ref === this.target.ref) continue;
      this.pointOf(t, _a);
      if (_a.distanceTo(cam.position) > RANGE) continue;
      const v = _b.copy(_a).project(cam);
      if (v.z > 1 || Math.abs(v.y) > 1.1) continue;
      if (!this.clear(_a)) continue;
      const dx = (v.x - x0) * dir;
      if (dx > 0.02 && dx < bd) { bd = dx; best = t; }
      if (dir > 0 ? v.x < wx : v.x > wx) { wx = v.x; wrapBest = t; }
    }
    const next = best || wrapBest;
    if (next) { this.set(next); sfx.lockTick?.(); }
  }

  update(dt) {
    const g = this.game, P = g.player, inp = P.input;
    this.t += dt;
    this.flickCool -= dt;
    const t = this.target;
    if (!t) { this.reticle.hide(); this.reticle.update(dt, g.camera); P.lookScale.lock = 1; return; }
    if (!this.alive(t)) { this.release('gone'); this.reticle.update(dt, g.camera); return; }
    this.pointOf(t, _a);
    const dist = _a.distanceTo(P.pos);
    if (dist > KEEP || g.god?.controlling) { this.release('far'); this.reticle.update(dt, g.camera); return; }
    // a wall in the way for a moment is nothing; for more than one, the lock lets go
    this.losT -= dt;
    if (this.losT <= 0) { this.losT = 0.15; this.blocked = this.clear(_a) ? 0 : this.blocked + 0.15; if (this.blocked > 1.2) { this.release('lost'); this.reticle.update(dt, g.camera); return; } }
    // the camera does the work: it keeps the target in the middle, a little from above; the mouse is quiet
    this.shownOf(t, _a);
    if (this.assist) {
      const eye = _b.set(P.renderPos.x, P.renderPos.y + 1.3, P.renderPos.z);
      const to = _f.copy(_a).sub(eye);
      const yawT = Math.atan2(to.x, to.z), pitchT = THREE.MathUtils.clamp(Math.atan2(to.y, Math.hypot(to.x, to.z)) * 0.7 - 0.1, -0.5, 0.55);
      const k = 1 - Math.exp(-dt * 5.5);
      P.yaw += wrap(yawT - P.yaw) * k;
      P.pitch += (pitchT - P.pitch) * k * 0.7;
      P.lookScale.lock = 0.2;
    }
    // a hard flick moves the lock
    if (this.flickCool <= 0 && Math.abs(inp.dx) > 90 && P.lookScale.blade !== 0) { this.flickCool = 0.45; this.cycle(inp.dx > 0 ? 1 : -1); }
    if (inp.wheel && this.flickCool <= 0) { this.flickCool = 0.3; this.cycle(inp.wheel > 0 ? 1 : -1); }
    const r = t.type === 'clapper' ? 0.6 : t.type === 'creature' ? Math.max(0.6, (t.ref.radius ?? 0.5) * 1.6) : Math.max(0.5, (t.ref.P?.rMax ?? 0.3) * 2.2);
    this.reticle.set({ pos: _a, size: r, color: GOLD, icon: 'none', lock: 1, stam: 0 });
    this.reticle.update(dt, g.camera);
  }
}
