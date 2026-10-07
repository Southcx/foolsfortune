// ---------------------------------------------------------------------------------------
// THE GRAPPLE: what the Courier does on the end of the Sondelass's line once the grapnel has bitten into something solid (the line,
// its length and the reel are the hook's: tools/sondelass/hookshot.js; this is the body). It replaces the old Zip, which took the Courier to
// the anchor at a constant speed and had nothing more to say. Now they are a weight on a rope of a length they control.
//
//   hold LMB   reel in: the rope shortens (faster the longer it is held) and they are drawn to the anchor. Let go and they hang.
//   hold RMB   pay out: the rope lengthens.       tap RMB   let go of the line.
//   A W S D    pump: steer the swing (air control, in the direction of the keys).
//   Space      jump off, in the air: the momentum is kept, with a hop.
//   They land, and the rope goes slack: it pays itself out as they walk (a leash the length of the walk) and pulls tight again
//   the moment their feet leave the ground: a jump from the ground under an anchor is a swing.
//
// Prior art, and what was taken:
//  - Worms' Ninja Rope: the rope's LENGTH is the control (shorten, lengthen), the swing is a pendulum you pump, jump lets go.
//  - Spider-Man (PS4) and Just Cause: the release keeps the speed and adds a hop; shortening the rope on the way up the arc flings
//    you (angular momentum: the tangential speed grows as the radius shrinks, so reeling in mid-swing speeds the swing up).
//  - Attack on Titan's ODM gear and Tarzan: the swing is a pendulum on a taut line, hanging when it stops.
// The body is a point mass at their chest on a rope: gravity and the pump move it, and if it would go farther from the anchor than the
// rope is long it is put back on the sphere and the speed away from the anchor is taken out (position-based, so a wall they hit
// takes the speed it takes). While they are on the ground with slack in the line the core movement runs as normal and this tech is idle.
// The hang and the swing are the CC0 hang-from-a-bar clip (the zipline's), leaned into the speed; the free hand closes on the line.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../../courier/moves/techs.js';
import { T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';

const UP = new THREE.Vector3(0, 1, 0);
const _c = new THREE.Vector3(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _w = new THREE.Vector3(), _p = new THREE.Vector3();
const CHEST = 0.9;

export class Grapple extends Tech {
  constructor(mgr) {
    super(mgr, 'grapple');
    this.overrides = 1;
    this.blendIn = 9;
    this.hangK = 0; // how hung (slow, taut) rather than swinging, 0..1
    this.speedK = 0;
    this.swingT = 0; this.peak = 0; this.dist0 = 0; this.reelT = 0;
    this.lean = 0;
  }
  get enabled() { return true; } // (the hook's, never on its own)
  get cfg() { return T.tech.grapple || { reelMax: 26, reelAccel: 70, pump: 9, drag: 0.05, stop: 1.6, maxSpeed: 34 }; }
  get hook() { return this.mgr.get('sondelass')?.hookshot; }
  get att() { const a = this.hook?.att; return a && a.mode === 'anchor' ? a : null; }
  get handsBusy() { return false; }
  get stance() { return false; }
  label() { return this.hook?.reeling ? 'REEL' : this.hangK > 0.6 ? 'HANG' : 'SWING'; }

  canStart() {
    const h = this.hook, a = this.att;
    if (!a || !h) return false;
    return !this.P.grounded || h.reeling; // (on the ground with the line slack, the core movement carries on)
  }

  chest(out) { return out.set(this.P.pos.x, this.P.pos.y + CHEST, this.P.pos.z); }

  start() {
    const P = this.P, h = this.hook, a = this.att;
    P.endCore();
    if (P.grounded) { P.grounded = false; P.vel.y = Math.max(P.vel.y, 2.6); } // (reeling from the floor: off it)
    this.swingT = 0; this.peak = 0; this.reelT = 0; this.lean = 0;
    this.dist0 = this.chest(_c).distanceTo(a.point);
    this.game.events?.emit('zip.start', { dist: this.dist0 });
    this.game.events?.emit('grapple.swing', { phase: 'start', len: h.L });
  }

  update(dt) {
    const P = this.P, h = this.hook, a = this.att, C = this.cfg, M = T.movement;
    if (!a || !h) return false;
    const c = this.chest(_c);
    const A = a.point;
    const to = _n.subVectors(A, c), dist = to.length();
    const dir = to.multiplyScalar(1 / Math.max(1e-6, dist));
    // arrival: reeling brought them to the anchor
    if (h.reeling && dist < C.stop) return this.arrive(dir);
    // let go: a jump in the air
    if (!P.grounded && P.latch('Space')) return this.jumpOff();
    const v = _v.copy(P.vel);
    // gravity and a little air drag
    v.y -= M.gravity * dt;
    v.multiplyScalar(1 - C.drag * dt);
    // pump: the keys steer the swing (across the rope's sphere: the constraint takes out what it must)
    const wish = P.wishDir();
    if (wish.lengthSq() > 0.01) v.addScaledVector(wish, C.pump * dt);
    // reel: shorten the rope; the tangential speed grows as the radius shrinks (angular momentum)
    const L0 = h.L;
    const Ln = h.L;
    const rel = c.clone().sub(A), r0 = rel.length() || 1;
    rel.multiplyScalar(1 / r0);
    if (h.reeling) {
      const vr = v.dot(rel);
      _t.copy(v).addScaledVector(rel, -vr); // (tangential)
      // (only on a real swing: reeling straight in from rest is a constant pull, not a spiral)
      const k = _t.length() > 3 ? THREE.MathUtils.clamp(r0 / Math.max(0.6, r0 - h.reelV * dt), 1, 1.03) : 1;
      v.copy(rel).multiplyScalar(vr).addScaledVector(_t, k);
      this.reelT += dt;
    }
    void L0; void Ln;
    v.clampLength(0, C.maxSpeed);
    // the rope: keep the chest inside the sphere of its length about the anchor (position-based)
    const p0 = c, p1 = _p.copy(c).addScaledVector(v, dt);
    const d1 = _t.subVectors(p1, A), len = d1.length();
    if (len > h.L) {
      p1.copy(A).addScaledVector(d1, h.L / len);
      v.copy(p1).sub(p0).multiplyScalar(1 / dt).clampLength(0, C.maxSpeed); // (the correction is a velocity too: a reel under a wide swing could throw them past the cap)
    }
    P.vel.copy(v);
    P.move(dt);
    // where they actually is now (a wall may have stopped them short): still inside the rope?
    this.chest(_c);
    const fix = _t.subVectors(_c, A), fl = fix.length();
    // (pulled back in only where they fit: an anchor low on the floor ahead would otherwise draw them down through it)
    if (fl > h.L + 0.08) {
      _p.copy(P.pos).addScaledVector(fix, -(fl - h.L) / fl);
      if (P.fits?.(_p, P.shape) ?? true) { P.pos.copy(_p); P.body?.setNextKinematicTranslation?.(P.pos); }
    }
    // facing and the pose
    const sp = P.vel.length();
    this.peak = Math.max(this.peak, sp);
    this.swingT += dt;
    _w.copy(P.vel).setY(0);
    if (_w.lengthSq() > 4) P.bodyYaw = Math.atan2(_w.x, _w.z);
    else P.bodyYaw = Math.atan2(dir.x, dir.z);
    const taut = fl > h.L - 0.25;
    this.hangK = THREE.MathUtils.damp(this.hangK, taut && sp < 3.2 ? 1 : 0, 6, dt);
    this.speedK = THREE.MathUtils.damp(this.speedK, Math.min(1, sp / 16), 6, dt);
    if (sp > 6) sfx.zipWhine?.(Math.min(1, sp / 26) * 0.6);
    // they land with the line slack (or not reeling): the core takes over
    if (P.grounded && !h.reeling && P.vel.y <= 0.5) return false;
    return true;
  }

  /** Reeled all the way in. */
  arrive(dir) {
    const P = this.P, h = this.hook, a = this.att;
    P.vel.multiplyScalar(0.4);
    P.vel.y = Math.max(P.vel.y, 3.5);
    if (Math.abs(a.normal.y) < 0.4) P.tryMantle?.(0.2, 0);
    this.game.events?.emit('zip.end', { how: 'arrive', dur: this.t });
    h.release('arrive');
    void dir;
    return false;
  }

  /** Space in the air: off the line with the speed, and a hop. Above the core's speed cap they are flung: carried by momentum until they land. */
  jumpOff() {
    const P = this.P, h = this.hook;
    const v = P.vel.clone().multiplyScalar(1.06);
    v.y = Math.max(v.y + 2.2, v.y < 0 ? 3.2 : v.y);
    P.jumpHeldLast = true; P.jumpBuf = 0; // (the core must not read this press as a jump of its own)
    this.game.events?.emit('zip.end', { how: 'cancel', dur: this.t });
    h.release('jump');
    const launch = this.mgr.get('launch');
    if (launch && Math.hypot(v.x, v.z) > 11) {
      const peak = Math.hypot(v.x, v.z);
      this.game.events?.emit('grapple.fling', { speed: peak });
      launch.go(v, { time: 4, until: 'ground', steer: 5, drag: 0.02, jumpExit: true, tag: 'fling' });
    } else P.vel.copy(v);
    return false;
  }

  end() {
    // (ended by anything: a landing with slack keeps the line; anything else that took the step has cut it)
    const h = this.hook, act = this.mgr.active;
    if (h?.att && act && act !== this) h.release('taken');
    this.game.events?.emit('grapple.swing', { phase: 'end', dur: this.swingT, peak: this.peak }); // (`dur`, not `t`: the bus stamps its own t over a payload's)
    this.hangK = 0;
  }

  onLand() {}

  faceYaw() { return null; }

  // ---- the pose
  animate(ch, base, dt) {
    const C = ch.clips;
    if (!this.att) return;
    // both hands on the line: the hang clip, held; swinging fast it is only partly there (the body leans instead)
    const idle = C.sample('hangBar', ch.time, ch.P.tmp);
    C.blend(base, idle, this.w * (0.55 + 0.45 * this.hangK));
  }

  afterPose(ch) {
    if (!this.att || this.w < 0.02) return;
    // the legs stream out behind a swing, and the body leans into it
    const P = this.P, k = this.speedK * this.w * (1 - 0.6 * this.hangK);
    if (k < 0.02) return;
    _w.copy(P.vel).setY(0);
    if (_w.lengthSq() < 1) return;
    _w.normalize();
    const left = _t.set(_w.z, 0, -_w.x); // (perpendicular to travel)
    for (const b of ['thighL', 'thighR']) if (ch.bones[b]) ch.rotW(ch.bones[b], left, 0.55 * k);
    for (const [b, f] of [['spine001', 0.5], ['spine002', 0.5]]) if (ch.bones[b]) ch.rotW(ch.bones[b], left, -0.14 * k * f);
    ch.root.updateMatrixWorld(true);
  }
}
