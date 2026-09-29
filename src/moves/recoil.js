import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';

// Recoil jump (a Movement Art): the gun kicks, and in the air that kick is real. Shoot down (steeper than about 20 degrees) and
// you're pushed up, and back the way the barrel points. Three shots' worth a jump (a charged
// shot is worth two), and it comes back when you land. What it costs is what a shot costs:
// Lachryma. Air jumps and dashes still work on top of it.
export class Recoil extends Tech {
  constructor(mgr) {
    super(mgr, 'recoil');
    this.passive = true;
    this.left = this.cfg.charges;
    this.off = this.game.events?.on('shot', (e) => this.onShot(e));
  }

  get engaged() { return false; }

  fixed() {
    if (this.P.grounded || this.P.wallrun) this.left = this.cfg.charges;
  }

  onShot(e) {
    const P = this.P, c = this.cfg;
    if (!this.usable() || P.grounded || P.freeze || this.mgr.active || P.mantle || P.airT < 0.05) return;
    const cost = e.charged ? 2 : 1;
    if (this.left < cost) return;
    // (the harder you shoot down, the more you get)
    const down = -e.dir.y;
    if (down < c.minDown) return; // (only shots aimed down count: level shots leave your jump alone)
    this.left -= cost;
    const kick = e.charged ? c.chargedKick : c.kick;
    const push = e.dir.clone().multiplyScalar(-kick);
    push.x *= c.horizontal; push.z *= c.horizontal;
    if (P.vel.y < 0) P.vel.y *= 0.2; // (a fall is caught first)
    P.impulse(push, 'recoil');
    P.jumpFx?.(0.4);
    P.fovPunch = Math.max(P.fovPunch || 0, 4);
    sfx.airJump();
    this.game.events?.emit('recoil.jump', { up: push.y, charged: !!e.charged });
  }
}
