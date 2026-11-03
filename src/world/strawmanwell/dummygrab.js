// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S GRAB AND THROW (docs/plans/STRAWMANS-WELL.md 3.4; GAPS G250): in the Brawl, F at a straw dummy within reach lifts it over
// the Courier's head (the carry's idea, a dummy as the carried thing), F again throws it along the facing as a blow of GRAB.power (its
// percent added and its launch by the dummy's own rule, so a softened one flies off the stage and the KO is the Courier's); S held with the
// throw slams it down instead. Held, it cannot swipe; held longer than GRAB.hold real s it is set down. The chevron is the interact system's
// (the room's `spots`), so it has a touch path (USE). The held dummy's body is the dummies' (dummy.js: `c.held`).
//
// Prior art: Super Mario Bros. 2 (pick up a foe and throw it), Smash's grab and throw, Tomba!'s throw, Klonoa's grab.
//
//   const G = new DummyGrab(well)   G.spots() -> [{ ref: 'grab' | 'throw', pos, x }]   G.use(ref) -> bool   G.update(dt)   G.drop()   G.clear()
//   events: well.grab { stage, by }, well.throw { stage, slam, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GRAB } from '../../progress/strawmanwell.js';

const _v = new THREE.Vector3();

export class DummyGrab {
  constructor(well) { this.well = well; this.game = well.game; this.dummy = null; this.t = 0; }
  get P() { return this.game.player; }

  /** What F would do here: lift the nearest dummy in reach (the Brawl only), or throw the one held. */
  spots() {
    const P = this.P, W = this.well;
    if (W.stage?.id !== 'brawl') return [];
    if (this.dummy) return [{ ref: 'throw', pos: _v.set(P.pos.x, P.pos.y + P.height + 0.9, P.pos.z).clone(), x: P.pos.x }];
    const c = this.near(); return c ? [{ ref: 'grab', pos: c.head(), x: c.pos.x }] : [];
  }
  near() {
    const P = this.P; let best = null, bd = GRAB.reach;
    for (const c of this.well.dummies.list) {
      if (!c.alive || c.out > 0 || c.held) continue;
      const d = Math.hypot(c.pos.x - P.pos.x, (c.pos.y - P.pos.y) * 0.5);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  use(ref) {
    if (ref === 'grab') {
      const c = this.near(); if (!c) return true;
      this.dummy = c; this.t = 0; this.well.dummies.cancel(c);
      c.held = () => _v.set(this.P.renderPos.x, this.P.renderPos.y + this.P.height + 0.15, this.P.renderPos.z);
      this.game.events?.emit('well.grab', { stage: this.well.stage?.id ?? null, by: 'courier' });
      return true;
    }
    if (ref === 'throw') { this.throw(); return true; }
    return false;
  }

  throw() {
    const c = this.dummy, W = this.well, P = this.P; if (!c) return;
    const slam = !!W.frame.realInput?.isDown('KeyS'), dir = new THREE.Vector3(W.frame.face, 0, 0);
    this.release(c);
    c.pos.set(P.pos.x + W.frame.face * 0.8, P.pos.y + P.height * 0.8, P.pos.z);
    W.dummies.hurt(c, c.center(new THREE.Vector3()), dir, GRAB.power, 'throw', 'courier');
    if (slam) { c.vel.set(W.frame.face * 3, -GRAB.slam, 0); c.tumble = 0.3; }
    W.verb('grabThrow');
    this.game.events?.emit('well.throw', { stage: W.stage?.id ?? null, slam, by: 'courier' });
  }
  release(c) { c.held = null; if (c === this.dummy) this.dummy = null; }
  /** Set down where it is (the time ran out, the stage left). */
  drop() { if (this.dummy) { this.dummy.vel.set(0, 0, 0); this.release(this.dummy); } }

  update(dt) {
    if (!this.dummy) return;
    if (!this.dummy.alive || this.dummy.out > 0 || this.well.stage?.id !== 'brawl') { this.release(this.dummy); return; }
    if ((this.t += dt) > GRAB.hold) this.drop();
  }
  clear() { if (this.dummy) this.release(this.dummy); this.t = 0; }
}
