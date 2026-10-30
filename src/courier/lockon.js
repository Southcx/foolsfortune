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
//   game.lock.add(ref)  .remove(ref)   a thing to lock to that no list here finds: a `training` body (Strawman, the status bench's
//   roly-polies: world/throwingroom/), added by the room that owns it; its lock is never counted (`lock.on { training }`)
// ON TOUCH (docs/plans/MOBILE.md 8.9: how a thumb aims, every phone action game's aim assist; a setting, `camera.lockAuto`, never a knack):
// with a tool drawn, the lock takes the nearest foe in front by itself (never a pot), every LOCK_AUTO.every real s while it holds none;
// let go by hand, it waits LOCK_AUTO.hold real s before it takes one again. A finger turning the view is aiming by hand: the lock takes
// nothing while it does and for LOCK_AUTO.quiet real s after, and a drag of LOCK_AUTO.away px on a held lock lets it go (look away to let
// go: the owner, 2026-10-26, "psygun aiming gets disrupted when automatic lock-on occurs, and there's no easy way to disengage").
// THE GUN ON THE LOCK: with the psygun drawn the camera is turned so the screen's middle (the crosshair, the shot's ray) is on the
// target, from the camera itself; turned from the Courier's eye, the over-the-shoulder camera held the target a shoulder's width left of
// the crosshair and the shots went right of it (the owner's phone, v297).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Reticle } from '../tools/sondelass/angling/reticle.js';
import { GROUPS } from '../core/physics.js';
import { sfx } from '../audio/sfx.js';
import { T } from '../core/config.js';

const RANGE = 18, KEEP = 26, GOLD = 0xffd76a;
/** every: real s between the touch lock's looks for a foe; hold: real s it waits after the lock was let go by hand. */
/** quiet: real s after a finger last turned the view before it may take one; away: px (of the view's turn, input.dx) a drag on a held
 *  lock runs up, fading at `fade` a real s, to let it go. */
export const LOCK_AUTO = { every: 0.3, hold: 3, quiet: 0.8, away: 90, fade: 4 };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _e = new THREE.Vector3(), _q = new THREE.Quaternion();

export class LockOn {
  constructor(game) {
    this.game = game;
    this.target = null;
    this.reticle = new Reticle(game.scene, { mind: true }); // (the Mind's: black labradorite, docs/ART.md precept 3)
    this.flickCool = 0; this.blocked = 0; this.losT = 0; this.t = 0; this.autoWait = 0; this.dragged = 0; // (dragged: the touch's look away, run up)
    this.assist = true;
    this.extra = new Set(); // (lock targets added by their owners: `add`)
    game.player.lookScale = game.player.lookScale || { lock: 1, blade: 1 };
  }
  get active() { return !!this.target; }

  /** The middle of a thing (world). */
  pointOf(t, out) {
    if (t.type === 'clapper') return out.copy(t.ref.pos).setY(t.ref.pos.y + 0.35);
    if (t.type === 'creature') return t.ref.lockPoint ? t.ref.lockPoint(out) : t.ref.center(out); // (a creature: creatures.js; its weak point, if it names one)
    const b = t.ref.body.translation();
    return out.set(b.x, b.y + (t.ref.P?.height ?? 0.5) * 0.45, b.z);
  }
  point(out) { return this.target ? this.pointOf(this.target, out) : null; }
  /** Where the target is DRAWN this frame (between physics steps, as its model is): what the reticle and the camera follow, so
   *  neither steps at the physics rate against a smoothly drawn jar. */
  shownOf(t, out) {
    const a = this.game.alpha ?? 1;
    if (t.type === 'clapper') { const c = t.ref; out.lerpVectors(c.prevPos || c.pos, c.pos, a); return out.setY(out.y + (c.hop || 0) + 0.35); }
    if (t.type === 'creature') { const c = t.ref; if (c.lockPoint) return c.lockPoint(out); out.lerpVectors(c.prevPos || c.pos, c.pos, a); return out.setY(out.y + (c.height ?? 1) * 0.55); } // (a weak point is drawn where its model is)
    const m = t.ref.mesh;
    if (m) { m.updateMatrixWorld(); out.setFromMatrixPosition(m.matrixWorld); return out.setY(out.y + (t.ref.P?.height ?? 0.5) * 0.45); }
    return this.pointOf(t, out);
  }
  /** A thing to lock to (a creature's contract: pos, center or lockPoint, radius, height, alive), added by its owner. */
  add(ref) { this.extra.add(ref); return ref; }
  remove(ref) { this.extra.delete(ref); if (this.target?.ref === ref) this.release('gone'); }
  alive(t) { return !!t && t.ref.alive !== false && (t.type !== 'clapper' || !t.ref.ally); }

  /** Everything that could be locked to, near the Courier. */
  candidates() {
    const g = this.game, P = g.player, out = [], p = P.pos;
    for (const c of g.clappers?.list || []) if (c.alive && !c.ally && c.pos.distanceToSquared(p) < KEEP * KEEP) out.push({ type: 'clapper', ref: c });
    for (const c of g.creatures?.list || []) if (c.alive && !c.training && c.pos.distanceToSquared(p) < KEEP * KEEP && Math.abs(c.pos.y - p.y) < 8) out.push({ type: 'creature', ref: c }); // (a training body comes through `add`, from its room)
    for (const c of this.extra) if (c.alive !== false && c.pos.distanceToSquared(p) < KEEP * KEEP && Math.abs(c.pos.y - p.y) < 8) out.push({ type: 'creature', ref: c });
    for (const e of g.breakables?.items || []) {
      if (!e.alive || e.def?.trial || !e.body) continue;
      const t = e.body.translation();
      if ((t.x - p.x) ** 2 + (t.z - p.z) ** 2 > KEEP * KEEP || Math.abs(t.y - p.y) > 8) continue;
      out.push({ type: 'breakable', ref: e });
    }
    return out;
  }

  /** Is there a clear line from the eye to the point? (The target's own collider is not in the way: a static body, Strawman's capsule,
   *  stood between the eye and its own middle and was never clear: casebook, 2026-10-11.) */
  clear(pt, ref = null) {
    const g = this.game, P = g.player;
    g.camera.getWorldPosition(_e);
    _b.copy(pt).sub(_e);
    const d = _b.length();
    if (d < 0.6) return true;
    const hit = g.physics.raycast(_e, _b.multiplyScalar(1 / d), d - 0.4, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic() && (!ref || g.physics.entityOf(c) !== ref));
    return !hit;
  }

  /** The best thing in front to lock to, locked (`foes`: creatures and clapperjars only, never a pot; `auto`: taken by the touch lock,
   *  not by you, so never counted). */
  acquire({ foes = false, auto = false } = {}) {
    const g = this.game;
    g.camera.getWorldPosition(_e); g.camera.getWorldDirection(_f);
    let best = null, bs = 1e9;
    for (const t of this.candidates()) {
      if (foes && t.type === 'breakable') continue;
      this.pointOf(t, _a);
      const d = _a.distanceTo(_e);
      if (d > RANGE || d < 0.5) continue;
      const dot = _b.copy(_a).sub(_e).multiplyScalar(1 / d).dot(_f);
      if (dot < 0.35) continue;
      const score = (1 - dot) * 2.4 + (d / RANGE) * 0.7 - (t.type === 'clapper' ? 0.25 : 0);
      if (score < bs && this.clear(_a, t.ref)) { bs = score; best = t; }
    }
    if (!best) return false;
    this.set(best, auto);
    return true;
  }

  /** The lock target drawn nearest a screen point (CSS px), within `px` of it and in clear sight, or null: a finger's double tap
   *  (core/touchdoubletap.js) names what it means where the lock's own pick would weigh the view's middle. */
  pickAt(x, y, px = 70) {
    const g = this.game, W = innerWidth, H = innerHeight; let best = null, bd = px;
    g.camera.getWorldPosition(_e);
    for (const t of this.candidates()) {
      this.shownOf(t, _a); if (_a.distanceTo(_e) > KEEP) continue;
      _b.copy(_a).project(g.camera); if (_b.z > 1) continue; // (behind the camera)
      const d = Math.hypot((_b.x * 0.5 + 0.5) * W - x, (0.5 - _b.y * 0.5) * H - y);
      if (d < bd && this.clear(this.pointOf(t, _f), t.ref)) { bd = d; best = t; }
    }
    return best;
  }

  set(t, auto = false) {
    this.target = t; this.blocked = 0; this.losT = 0;
    this.reticle.flash = 1;
    sfx.lockOn?.(1);
    this.game.events?.emit('lock.on', { type: t.type, ...(t.ref.training && { training: true }), ...(auto && { auto: true }) }); // (a training body's lock is never counted, nor the touch lock's own)
  }

  release(why = 'let go') {
    if (!this.target) return;
    this.target = null;
    if (why === 'let go') this.autoWait = LOCK_AUTO.hold; // (let go by hand: the touch lock waits before it takes another)
    this.game.player.lookScale.lock = 1;
    this.game.events?.emit('lock.off', { why });
  }

  toggle() { if (this.target) this.release(); else this.acquire(); }

  /** On touch, with a tool drawn and the setting on: a foe in front taken by itself, a look every LOCK_AUTO.every real s. */
  autoLock(dt) {
    const g = this.game;
    if ((this.autoWait -= dt) > 0) return;
    this.autoWait = LOCK_AUTO.every;
    if (g.input?.device !== 'touch' || !(T.camera.lockAuto ?? true) || !g.belt?.inHand || g.god?.controlling || g.cursorFree?.()) return;
    this.acquire({ foes: true, auto: true });
  }

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
      if (!this.clear(_a, t.ref)) continue;
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
    if (g.duel?.active || g.duel?.pending) { if (this.target) this.release('duel'); this.reticle.hide(); this.reticle.update(dt, g.camera); P.lookScale.lock = 1; return; } // (a puzzle duel is its own instance: nothing held into it, nothing taken in it; South, 2026-10-29)
    const t = this.target;
    const touch = g.input?.device === 'touch', turned = touch ? Math.hypot(inp.dx || 0, inp.dy || 0) : 0; // (a finger turning the view: aiming by hand)
    if (!t) {
      this.reticle.hide(); this.reticle.update(dt, g.camera); P.lookScale.lock = 1; this.dragged = 0;
      if (turned > 0) this.autoWait = Math.max(this.autoWait, LOCK_AUTO.quiet); // (never taken out from under an aim)
      this.autoLock(dt); return;
    }
    if (touch) { this.dragged = this.dragged * Math.exp(-dt * LOCK_AUTO.fade) + turned; if (this.dragged > LOCK_AUTO.away) { this.dragged = 0; this.release(); this.reticle.update(dt, g.camera); return; } } // (looked away: let go)
    if (!this.alive(t)) { this.release('gone'); this.reticle.update(dt, g.camera); return; }
    this.pointOf(t, _a);
    const dist = _a.distanceTo(P.pos);
    if (dist > KEEP || g.god?.controlling) { this.release('far'); this.reticle.update(dt, g.camera); return; }
    // a wall in the way for a moment is nothing; for more than one, the lock lets go
    this.losT -= dt;
    if (this.losT <= 0) { this.losT = 0.15; this.blocked = this.clear(_a, t.ref) ? 0 : this.blocked + 0.15; if (this.blocked > 1.2) { this.release('lost'); this.reticle.update(dt, g.camera); return; } }
    // the camera does the work: it keeps the target in the middle, a little from above; the mouse is quiet
    this.shownOf(t, _a);
    if (this.assist) {
      const gun = g.belt?.inHand?.id === 'psygun' && !P.fp; // (the gun on the lock: the crosshair on the target, from the camera)
      const eye = gun ? g.camera.getWorldPosition(_b) : _b.set(P.renderPos.x, P.renderPos.y + 1.3, P.renderPos.z);
      const to = _f.copy(_a).sub(eye);
      const yawTo = Math.atan2(to.x, to.z), pitchTo = Math.atan2(to.y, Math.hypot(to.x, to.z));
      if (gun) { // (the camera's own forward turned onto the target: whatever offsets the rig adds to the Courier's yaw and pitch)
        const f = _e.set(0, 0, -1).applyQuaternion(g.camera.getWorldQuaternion(_q));
        const k = 1 - Math.exp(-dt * 9);
        P.yaw += wrap(yawTo - Math.atan2(f.x, f.z)) * k;
        P.pitch = THREE.MathUtils.clamp(P.pitch + (pitchTo - Math.atan2(f.y, Math.hypot(f.x, f.z))) * k, -1.2, 1.2);
      } else {
        const pitchT = THREE.MathUtils.clamp(pitchTo * 0.7 - 0.1, -0.5, 0.55), k = 1 - Math.exp(-dt * 5.5);
        P.yaw += wrap(yawTo - P.yaw) * k;
        P.pitch += (pitchT - P.pitch) * k * 0.7;
      }
      P.lookScale.lock = 0.2;
    }
    // a hard flick moves the lock
    if (!touch && this.flickCool <= 0 && Math.abs(inp.dx) > 90 && P.lookScale.blade !== 0) { this.flickCool = 0.45; this.cycle(inp.dx > 0 ? 1 : -1); }
    if (inp.wheel && this.flickCool <= 0) { this.flickCool = 0.3; this.cycle(inp.wheel > 0 ? 1 : -1); }
    const r = t.type === 'clapper' ? 0.6 : t.type === 'creature' ? Math.max(0.6, (t.ref.radius ?? 0.5) * 1.6) : Math.max(0.5, (t.ref.P?.rMax ?? 0.3) * 2.2);
    this.reticle.set({ pos: _a, size: r, color: GOLD, icon: 'none', lock: 1, stam: 0 });
    this.reticle.update(dt, g.camera);
  }
}
