// ---------------------------------------------------------------------------------------
// THE SKIFF'S RIDER: how the Courier stands, works and falls on the Solar Skiff, from the Courier's own suite (skiff.glb's Skiff_*,
// the owner's, 2026-10-07: its rider clips are the authored ones remade, the same stance, the same deck and the same sheet, so they drop
// into the skiff's frame as they are: +Z out over the starboard side, +X the bow). The tech (skiff.js) says what the board does; this
// says what the body does with it.
//
//   RIDING    Skiff_RideIdle, Skiff_RideCruise by speed; Skiff_RideTurnL / TurnR by the steer (the heel side and the toe side: the
//             board's own roll is halved so the two leans do not stack); Skiff_Unfurl played by how far the sail is up as it is hoisted,
//             Skiff_Furl by how far it is down as it is lowered (the brake); the flare's three clips by its edges (Skiff_BoostStart,
//             the tuck held in Skiff_BoostLoop, Skiff_BoostEnd)
//   THE OLLIE Skiff_Ollie cut in three: its crouch played by the hop's charge, its pop and rise as the hop leaves, its peak held while
//             airborne (a crest, a geyser), its landing played when the board lands. Its own lift is taken off the hips (the feet stay on
//             the deck: the hop's physics carries the body, casebook rule 19)
//   THE GLIDE Space held in the air: the suite's Air_Glide over the upper body (arms out as wings), by `glide` (0..1, skiff.js's
//             wings); the boat's half of Skiff_Glide is the oars swung out (boat.js SKIFF_GLIDE)
//   PHASES    Skiff_Summon, Skiff_Mount, Skiff_Dismount, Skiff_Recall, Skiff_Bail (then the UAL get-up from the sand): the whole body
//
// Prior art: SSX's and Jet Set Radio's board stances (a carve as a held lean, a grab as a held air pose), Tony Hawk's ollie cut into
// crouch, pop, air and land, and Wind Waker's sail hoisted hand over hand.
//
//   const R = new Rider(ch)   R.ride(base, w, s, dt)   (s: { t, speed, steer, L, hoistDir, furling, flaring, charge, air, popT, landT, glide })
//   R.phase(base, clip, t, w)   R.lift(clip, t)  the clip's feet above their first frame's (m)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const damp = THREE.MathUtils.damp, smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const OLLIE = { crouch: 0.23, pop: 0.27, peak: 0.45, land: 0.73 }; // (Skiff_Ollie's moments, clip seconds: frames 8, 9, 14, 23)
const GLIDE = { clip: 'Air_Glide', w: 0.85 }; // (the glide's upper body: the suite's glide (courier/moves/jets.js's hover wears it too), short of all of it so the stance shows through)
const lifts = new Map();

export class Rider {
  constructor(ch) {
    this.ch = ch; const C = ch.clips;
    this.A = C.pose(); this.B = C.pose();
    this.turnW = 0; this.furlW = 0; this.unfurlW = 0; this.boostW = 0; this.ollieW = 0;
    this.boost = 'none'; this.boostT = 0; this.lastFlare = false;
  }

  /** How far the clip's lower foot is above where it was at the first frame, at time t (m): measured once, by posing the clip. */
  lift(clip, t) {
    let L = lifts.get(clip);
    const ch = this.ch, C = ch.clips, c = C.clips[clip];
    if (!c) return 0;
    if (!L) {
      const B = ch.bones, root = ch.root, save = { p: root.position.clone(), q: root.quaternion.clone() }, p = C.pose(), v = new THREE.Vector3();
      root.position.set(0, 0, 0); root.quaternion.identity();
      L = new Float32Array(c.n);
      for (let f = 0; f < c.n; f++) {
        ch.applyPose(C.sample(clip, f / C.fps, p, false)); root.updateMatrixWorld(true);
        L[f] = Math.min(B.footL.getWorldPosition(v).y, B.footR.getWorldPosition(v).y);
      }
      const y0 = L[0]; for (let f = 0; f < c.n; f++) L[f] -= y0;
      root.position.copy(save.p); root.quaternion.copy(save.q); root.updateMatrixWorld(true);
      lifts.set(clip, L);
    }
    const x = THREE.MathUtils.clamp(t * C.fps, 0, c.n - 1), i = Math.floor(x), j = Math.min(c.n - 1, i + 1);
    return L[i] + (L[j] - L[i]) * (x - i);
  }

  /** The ride: the stance, the carve, the sail's work, the flare and the ollie, blended into `base` by w. */
  ride(base, w, s, dt) {
    const C = this.ch.clips, A = this.A, B = this.B;
    C.sample('Skiff_RideIdle', s.t, A, true);
    C.blend(A, C.sample('Skiff_RideCruise', s.t, B, true), smooth(1.5, 14, s.speed));
    // the carve: a held lean, toe side to the right (D: toward where they face), heel side to the left
    this.turnW = damp(this.turnW, Math.abs(s.steer) * smooth(1, 8, s.speed), 8, dt);
    if (this.turnW > 0.01) C.blend(A, C.sample(s.steer > 0 ? 'Skiff_RideTurnR' : 'Skiff_RideTurnL', s.t, B, true), this.turnW);
    // the sail's work: hoisted hand over hand (played by how far up it is), let down and hauled in (by how far down)
    this.unfurlW = damp(this.unfurlW, s.hoistDir > 0 && s.L < 0.999 ? 1 : 0, 10, dt);
    this.furlW = damp(this.furlW, s.furling ? 1 : 0, 10, dt);
    if (this.unfurlW > 0.01) C.blend(A, C.sample('Skiff_Unfurl', s.L * 0.96, B, false), this.unfurlW);
    if (this.furlW > 0.01) C.blend(A, C.sample('Skiff_Furl', (1 - s.L) * 0.96, B, false), this.furlW);
    // the flare: its start, the tuck held, its end
    if (s.flaring && !this.lastFlare) { this.boost = 'start'; this.boostT = 0; }
    if (!s.flaring && this.lastFlare && this.boost !== 'none') { this.boost = 'end'; this.boostT = 0; }
    this.lastFlare = s.flaring; this.boostT += dt;
    if (this.boost === 'start' && this.boostT >= 0.36) { this.boost = 'loop'; this.boostT = 0; }
    if (this.boost === 'end' && this.boostT >= 0.46) this.boost = 'none';
    this.boostW = damp(this.boostW, this.boost === 'none' ? 0 : 1, 12, dt);
    if (this.boostW > 0.01) {
      const clip = this.boost === 'start' ? 'Skiff_BoostStart' : this.boost === 'end' ? 'Skiff_BoostEnd' : this.boost === 'loop' ? 'Skiff_BoostLoop' : 'Skiff_BoostEnd';
      C.blend(A, C.sample(clip, this.boost === 'none' ? 0.46 : this.boostT, B, this.boost === 'loop'), this.boostW);
    }
    // the ollie: crouch on the charge, pop and rise as it leaves, its peak held in the air, its landing when it lands
    let ot = -1;
    if (s.landT != null && s.landT < 0.44) ot = OLLIE.land + s.landT;
    else if (s.air) ot = s.popT != null ? Math.min(OLLIE.peak, OLLIE.pop + s.popT * 0.9) : OLLIE.peak;
    else if (s.charge > 0.01) ot = OLLIE.crouch * Math.min(1, s.charge);
    this.ollieW = damp(this.ollieW, ot >= 0 ? 1 : 0, ot >= 0 ? 18 : 6, dt);
    if (ot >= 0) this.ot = ot;
    if (this.ollieW > 0.01) {
      C.sample('Skiff_Ollie', this.ot, B, false);
      B.p[1] -= this.lift('Skiff_Ollie', this.ot); // (the feet stay on the deck: the hop lifts the body, not the clip)
      C.blend(A, B, this.ollieW);
    }
    // the glide (Skiff_Glide's body): the suite's Air_Glide, arms out as wings and leaning into the air, over the upper body only; the
    // ollie's held peak keeps the legs, so the feet stay on the deck (casebook rule 19). The rider faces over the side, so the arms
    // spread along the board, fore and aft, as a board rider's do on a wave, while the oars spread over the sides (boat.js SKIFF_GLIDE)
    if ((s.glide || 0) > 0.01 && C.clips[GLIDE.clip]) {
      C.sample(GLIDE.clip, s.t, B, true);
      C.blend(A, B, s.glide * GLIDE.w, this.ch.MASK_UPPER, 0);
    }
    C.blend(base, A, w);
  }

  /** A phase's clip over the whole body (its travel kept: the tech moves the Courier to where it ends). */
  phase(base, clip, t, w) {
    const C = this.ch.clips;
    if (!C.clips[clip] || w <= 0.001) return;
    C.blend(base, C.sample(clip, t, this.B, false), w);
  }
}
