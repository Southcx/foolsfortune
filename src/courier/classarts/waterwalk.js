// ---------------------------------------------------------------------------------------
// WATER WALK'S TECH: the Knight of Cups' action (`wade`, progress/classarts.js) held in the body: while its time runs, liquid Lachryma
// under the feet bears them, and they walk and run on its surface at their own gait. The jet arts' skim run without the jets
// (courier/moves/jets.js: the same surface test and the same hold on the surface), so the core movement is untouched: switched off,
// or its time out, the swim takes them as before. Added before the swim, so the surface is chosen first.
//
// Prior art: Super Mario Sunshine's turbo skim (the house's Skim), Jesus Lizard runs in Rayman Legends, Dark Souls' water-walking ring's
// plain promise (the surface is a floor while it lasts).
//
//   new WaterWalk(techs)   .on(seconds)   .off()   .left (real seconds)   event move.waterwalk { by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../moves/techs.js';
import { T } from '../../core/config.js';

const _w = new THREE.Vector3();

export class WaterWalk extends Tech {
  constructor(mgr) { super(mgr, 'waterwalk'); this.overrides = 0; this.left = 0; this.wakeT = 0; }
  /** The art's own switch: never the tuning's, never the System's (it is a class's art, CLASS-ARTS.md). */
  usable() { return this.left > 0; }
  on(seconds) { this.left = Math.max(this.left, seconds); }
  off() { this.left = 0; }
  /** Liquid Lachryma a step under the feet, deep enough to swim in (the skim's own test, jets.js). */
  water() {
    const P = this.P, W = this.game.water?.at(P.pos.x, P.pos.y - 0.2, P.pos.z);
    return W && W.surface - P.pos.y > -0.4 && W.surface - P.pos.y < 0.9 && W.surface - W.bottom > 0.8 ? W : null;
  }
  canStart() { return this.left > 0 && !!this.water(); }
  start() { this.game.events?.emit('move.waterwalk', { by: 'courier' }); }
  update(dt) {
    const P = this.P, W = this.water();
    if (this.left <= 0 || !W) return false;
    const M = T.movement, speed = P.input?.isDown('ShiftLeft') ? M.sprintSpeed : M.walkSpeed;
    const wish = P.wishDir(_w);
    P.vel.x += (wish.x * speed - P.vel.x) * Math.min(1, 10 * dt);
    P.vel.z += (wish.z * speed - P.vel.z) * Math.min(1, 10 * dt);
    P.vel.y = (W.surface + 0.02 - P.pos.y) * 12; // (held on the surface, the skim's way)
    P.move(dt);
    this.wakeT -= dt;
    if (this.wakeT <= 0 && wish.lengthSq() > 0.01) { this.wakeT = 0.25; this.game.water.disturb?.(P.pos.x, P.pos.z, 0.5, 'wake', W.surface); }
    return true;
  }
  tick(dt) { if (this.left > 0) this.left = Math.max(0, this.left - dt); }
  label() { return 'WATER WALK'; }
}
