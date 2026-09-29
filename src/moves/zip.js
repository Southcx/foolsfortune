import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';

// The line's other end: drawn to what the Sondelass's grapnel has bitten into. Started by the hook form (never on its own):
// a constant speed toward the anchor (Zelda's Hookshot: quick to full speed, no drift), an early hop out of it on jump (the
// momentum is kept), and a let-go at the anchor with a small lift, or a mantle if the anchor is the edge of a ledge. It owns
// the step while it runs and nothing else about the body: the air animation plays as it would in a jump.
const _v = new THREE.Vector3(), _d = new THREE.Vector3();

export class Zip extends Tech {
  constructor(mgr) {
    super(mgr, 'zip');
    this.overrides = 0;
    this.anchor = new THREE.Vector3();
    this.normal = new THREE.Vector3(0, 1, 0);
    this.line = null;
  }
  get enabled() { return true; }
  canStart() { return false; }

  go(anchor, normal) {
    this.anchor.copy(anchor);
    this.normal.copy(normal);
    this.mgr.begin(this);
  }

  start() {
    const P = this.P;
    P.endCore();
    this.speed = Math.max(9, Math.hypot(P.vel.x, P.vel.z) * 0.8);
    this.prev = P.pos.clone();
    this.stuck = 0;
    this.dist0 = _v.copy(this.anchor).sub(P.pos).length();
    P.grounded = false;
    this.game.events?.emit('zip.start', { dist: this.dist0 });
  }

  update(dt) {
    const P = this.P, c = T.tech.zip || { speed: 27, accel: 90, stop: 1.5 };
    const to = _d.copy(this.anchor).sub(_v.set(P.pos.x, P.pos.y + 0.9, P.pos.z));
    const dist = to.length();
    if (dist < c.stop) return this.finish(false);
    if (P.latch('Space')) return this.finish(true);
    this.speed = Math.min(c.speed, this.speed + c.accel * dt);
    to.multiplyScalar(1 / Math.max(1e-6, dist));
    P.vel.copy(to).multiplyScalar(Math.min(this.speed, dist / dt));
    P.grounded = false;
    P.move(dt);
    P.bodyYaw = Math.atan2(to.x, to.z);
    sfx.zipWhine(this.speed / c.speed);
    // snagged on something on the way
    const moved = P.pos.distanceTo(this.prev);
    this.prev.copy(P.pos);
    this.stuck = moved < this.speed * dt * 0.25 ? this.stuck + dt : 0;
    if (this.stuck > 0.2) return this.finish(true);
    return true;
  }

  finish(cancelled) {
    const P = this.P;
    this.exit = cancelled ? 'cancel' : 'arrive';
    this.game.events?.emit('zip.end', { how: this.exit, dur: this.t });
    if (cancelled) { P.vel.multiplyScalar(0.85); P.vel.y = Math.max(P.vel.y, P.latchedJump ? 0 : 5.5); }
    else {
      // let go at the anchor: a small lift, and a mantle if it was a ledge's lip
      P.vel.multiplyScalar(0.4);
      P.vel.y = Math.max(P.vel.y, 3.5);
      if (Math.abs(this.normal.y) < 0.4) P.tryMantle?.(0.2, 0);
    }
    return false;
  }

  faceYaw() { return null; }
  label() { return 'HOOK'; }
}
