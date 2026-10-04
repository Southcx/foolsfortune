import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';

// Roll: an evasive maneuver. Press Sprint while crouched (C held, or the crouch left standing)
// and you roll the way you're steering (or the way you face): a short low dash with invulnerability frames at the start of it (`player.invuln`, ready for
// when there's damage to dodge). The same roll happens on its own out of a fall of 20 m or more: the
// fall is turned into forward speed and the landing is mitigated (`mitigated` on the event;
// fall damage, when it exists, reads it). Jump out of the back half of a roll to keep the speed.
// It never takes over a slide (the core owns those) or a slam's landing.
export class Roll extends Tech {
  constructor(mgr) {
    super(mgr, 'roll');
    this.overrides = 1;
    this.blendIn = 25;
    this.pending = 0; // a hard landing to roll out of
    this.cool = 0;
  }

  tick(dt) { this.cool -= dt; }

  onLand(fallSpeed) {
    const P = this.P, c = this.cfg, M = T.movement;
    // (only a real fall: 20 m or more of it. Anything less lands like any landing, so the flow isn't broken)
    if (this.mgr.active || P.lastDrop < c.minDrop) return;
    // (C held and fast: the core's landing slide has it)
    if ((P.input.isDown('KeyC') || P.peekLatch('KeyC')) && Math.hypot(P.vel.x, P.vel.z) > M.slideMinSpeed) return;
    this.pending = fallSpeed;
  }

  canStart() {
    const P = this.P;
    if (P.mantle || P.freeze) return false;
    if (this.pending) {
      const ok = P.grounded;
      this.fall = this.pending;
      this.pending = 0;
      if (ok) { this.code = null; return true; }
      return false;
    }
    if (P.peekLatch('Dodge')) {
      P.latch('Dodge');
      if (this.cool > 0 || P.sliding || !P.crouching) return false;
      this.fall = 0;
      this.code = true;
      return true;
    }
    return false;
  }

  start() {
    const P = this.P, c = this.cfg;
    P.endCore();
    P.latch('KeyC');
    P.slideBuf = 0;
    const hs = Math.hypot(P.vel.x, P.vel.z);
        let dir;
    if (this.code) {
      const wish = P.wishDir();
      dir = wish.lengthSq() > 0.01 ? wish.normalize() : new THREE.Vector3(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    } else {
      // out of a fall: the way you were going, or the way you're steering, or the way you face
      const wish = P.wishDir();
      dir = hs > 1 ? new THREE.Vector3(P.vel.x, 0, P.vel.z).normalize() : wish.lengthSq() > 0.01 ? wish.normalize() : new THREE.Vector3(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    }
    this.dir = dir.setY(0).normalize();
    this.speed = this.code ? Math.max(c.speed, hs * 0.6) : Math.max(hs, c.speed + Math.max(0, this.fall - 24) * c.speedPerFall);
    P.setLow(true);
    P.bodyYaw = Math.atan2(this.dir.x, this.dir.z); // roll the way you're going
    P.invuln = Math.max(P.invuln, c.iframes);
    P.shake = Math.max(P.shake, 0.15);
    sfx.roll();
    this.cool = c.cooldown;
    this.dust(P.pos);
    this.game.events?.emit('dodge', { dir: this.code || 'landing', fall: this.fall, mitigated: this.fall > 0 });
  }

  update(dt) {
    const P = this.P, c = this.cfg, M = T.movement;
    const k = this.t / c.time;
    // a roll-jump out of the back half
    if (k > 0.55 && P.latch('Space')) {
      P.vel.set(this.dir.x * this.speed, M.jumpVelocity, this.dir.z * this.speed);
      P.grounded = false;
      return false;
    }
    // fast at first, easing off
    const sp = this.speed * (1 - 0.35 * k * k);
    P.vel.set(this.dir.x * sp, P.grounded ? 0 : P.vel.y - M.gravity * dt, this.dir.z * sp);
    P.move(dt);
    P.bodyYaw = Math.atan2(this.dir.x, this.dir.z);
    if (k >= 1) return false;
    return true;
  }

  end() {
    const P = this.P;
    if (P.canStand()) P.setLow(false);
  }

  dust(at) {
    const fx = this.game.fx;
    if (!fx) return;
    const col = new THREE.Color(0xf3c9a8);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      fx.alpha.emit({ pos: at.clone().add(new THREE.Vector3(Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25)), vel: new THREE.Vector3(Math.cos(a) * 1.4 - this.dir.x * 2, 0.5, Math.sin(a) * 1.4 - this.dir.z * 2), life: 0.4, size: 0.08, sizeEnd: 0.32, color: col, alpha: 0.3, drag: 5 });
    }
  }

  animate(ch, base) {
    const c = this.cfg;
    const k = THREE.MathUtils.clamp(this.t / c.time, 0, 1);
    const p = ch.clips.sample('roll', THREE.MathUtils.lerp(c.clipFrom, c.clipTo, this.active ? k : 1), ch.P.tmp, false);
    ch.clips.blend(base, p, this.w);
  }

  faceYaw() { return Math.atan2(this.dir.x, this.dir.z); }

  label() { return 'ROLL'; }
}
