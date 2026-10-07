// ---------------------------------------------------------------------------------------
// THE HURT: a blow taken, shown on the body over whatever it is doing; control never leaves the player. Every blow flinches the upper
// body (UAL Hit_Chest, `hitChest`). A big blow (k from HURT.big up: a lobber's ball, a jelly's lunge, a blast close by) also throws the
// torso and head back by Sond_HitReact's recoil, laid on as an additive delta from the clip's first frame, so it rides any stance, run
// or jump; from behind (the blow's direction against the body) the same delta reversed lurches them forward. The old knockback (UAL
// Hit_Knockback, flat on the back) is not used: it would lie the Courier down while the player is already moving them.
//
// Prior art: additive hit reacts over locomotion (Unreal's and Unity's additive layers; Gears of War's and Uncharted's directional
// flinches); the hit reacts of Monster Hunter, which never take the stick away for a light blow.
//
//   const hurt = new Hurt(ch)    hurt.flinch(k, dir)  (k 0..1; dir: the blow's world direction [x, y, z], optional)    hurt.pose(dt, base, yaw)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { additive } from './layers.js';

/** big: the k from which the recoil comes in (k = the impulse's speed / 10: a lobber's ball is 0.67); the recoil plays from `at` at 1x,
 *  in over `fadeIn`, out between outFrom and outTo (s); `gain` scales the clip's delta (its recoil is 58 degrees of pitch). */
export const HURT = { clip: 'Sond_HitReact', big: 0.6, at: 0.02, gain: 0.8, fadeIn: 0.04, outFrom: 0.3, outTo: 0.6 };
const RECOIL = { spine001: 0.7, spine002: 0.8, spine003: 0.9, spine004: 0.8, spine005: 0.7, head: 0.8 };

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Hurt {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.hitT = 9; this.hitW = 0; this.bigT = 9; this.bigW = 0; this.dir = null; this.back = false;
    this.mask = this.C.mask(RECOIL);
  }

  flinch(k = 1, dir = null) {
    this.hitT = 0; this.hitW = Math.min(1, 0.5 + 0.5 * k);
    if (k >= HURT.big) { this.bigT = 0; this.bigW = Math.min(1, k); this.dir = dir; this.back = null; }
  }

  pose(dt, base, yaw) {
    const C = this.C, ch = this.ch;
    if (this.hitT < 0.45 && C.clips.hitChest) {
      this.hitT += dt;
      const hw = this.hitW * (1 - smooth(0.22, 0.45, this.hitT)) * smooth(0, 0.04, this.hitT);
      // (hipW 0: an upper-body layer leaves the pelvis where it is, casebook rule 43; a crouched blow had lifted it 0.25 m for 0.3 s)
      if (hw > 0.001) C.blend(base, C.sample('hitChest', 0.05 + this.hitT * 0.75, ch.P.tmp, false), hw, ch.MASK_UPPER, 0);
    }
    if (this.bigT >= HURT.outTo || !C.clips[HURT.clip]) return;
    // (from behind: the blow pushes along the body's forward)
    if (this.back === null) this.back = !!this.dir && this.dir[0] * Math.sin(yaw) + this.dir[2] * Math.cos(yaw) > 0.3;
    this.bigT += dt;
    const w = this.bigW * HURT.gain * smooth(0, HURT.fadeIn, this.bigT) * (1 - smooth(HURT.outFrom, HURT.outTo, this.bigT));
    additive(C, base, HURT.clip, HURT.at + this.bigT, 0, w, this.mask, this.back);
  }
}
