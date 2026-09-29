import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';

// Ladders: walk (or jump) into one and you're on it. W / S climb (Shift faster),
// C slides down, Space kicks off backwards; the gun stays out while you climb at a walk
// (aim and fire one-handed), and goes away for a fast climb or a slide, and climbing past the top steps off onto
// whatever's up there. The body is posed by IK alone: each hand and foot holds a
// rung and moves up two when the body has climbed past it, so the limbs alternate
// the way a real climb does.
export class Ladder extends Tech {
  constructor(mgr) {
    super(mgr, 'ladder');
    this.overrides = 1;
    this.blendIn = 14;
    this.rushing = false; // (fast climbs and slides take both hands; the gun goes away, and comes back)
    this.cool = 0;
    this.limbs = null;
  }

  get ladders() { return this.game.ladders; }
  get handsBusy() { return this.rushing; }

  tick(dt) { this.cool -= dt; }

  canStart() {
    const P = this.P;
    if (this.cool > 0 || !this.ladders || P.mantle) return false;
    const l = this.ladders.near(P.pos);
    if (!l) return false;
    // pressing into it (on the ground), or touching it in the air
    const wish = P.wishDir();
    const into = -(wish.x * l.n.x + wish.z * l.n.z);
    if (into < 0.5 && (P.grounded || into < 0)) return false;
    this.l = l;
    return true;
  }

  start() {
    const P = this.P, l = this.l;
    P.endCore();
    P.setShape('stand');
    P.vel.set(0, 0, 0);
    this.snap = 0;
    this.phase = 0;
    const rung = this.cfg.rung;
    // grab the rungs nearest where the limbs are now
    const r = (y) => Math.round((y - l.y0) / rung);
    const y = P.pos.y;
    // a real climb is contralateral: the right hand and the left foot come up together, then the
    // left hand and the right foot. So the two hands sit a rung apart (and the feet too), the
    // lower hand with the opposite side's lower foot; each hops two rungs when the body has
    // climbed past it, and the pairs alternate every rung (starting them all on one rung was
    // the bunny hop)
    const R = r(y + 1.5), F = r(y + 0.2);
    this.limbs = {
      handL: { r: R, from: null, t: 1 }, handR: { r: R - 1, from: null, t: 1 },
      footL: { r: F, from: null, t: 1 }, footR: { r: F + 1, from: null, t: 1 },
    };
    sfx.rung();
  }

  update(dt) {
    const P = this.P, c = this.cfg, l = this.l, inp = P.input, M = T.movement;
    // kick off, back the way you came (a little toward where you look)
    if (P.latch('Space')) {
      const look = P.lookDir();
      const out = l.n.clone().multiplyScalar(c.kickOut).addScaledVector(new THREE.Vector3(look.x, 0, look.z), 1.5);
      P.vel.set(out.x, c.kickUp, out.z);
      P.grounded = false;
      this.cool = 0.4;
      sfx.airJump();
      return false;
    }
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    let vy = iz * (inp.isDown('ShiftLeft') || inp.isDown('ShiftRight') ? c.fast : c.speed);
    if (inp.isDown('KeyC')) vy = -c.slide;
    this.rushing = inp.isDown('KeyC') || (iz !== 0 && (inp.isDown('ShiftLeft') || inp.isDown('ShiftRight')));
    // hold the ladder line
    const want = new THREE.Vector3(l.x, 0, l.z).addScaledVector(l.n, 0.42);
    this.snap = Math.min(1, this.snap + dt * 8);
    P.vel.set((want.x - P.pos.x) * 12 * this.snap, vy, (want.z - P.pos.z) * 12 * this.snap);
    P.move(dt);
    P.bodyYaw = Math.atan2(-l.n.x, -l.n.z);
    this.phase += Math.abs(vy) * dt;
    // off the top: step over onto the platform
    if (iz > 0 && P.pos.y > l.y1 - 1.05) {
      const to = new THREE.Vector3(l.x, l.y1 + 0.02, l.z).addScaledVector(l.n, -0.55);
      if (P.fits(to, true)) {
        P.mantle = { from: P.pos.clone(), to, t: 0, dur: M.mantleTime * 1.1, exit: 1.5, edge: new THREE.Vector3(l.x, l.y1, l.z), right: new THREE.Vector3(l.n.z, 0, -l.n.x) };
        P.bodyYaw = Math.atan2(-l.n.x, -l.n.z);
        sfx.mantle();
        return false;
      }
    }
    // off the bottom
    if (iz < 0 && P.grounded) { this.cool = 0.3; return false; }
    if (vy < 0 && P.grounded && inp.isDown('KeyC')) { this.cool = 0.3; return false; }
    return true;
  }

  end() { this.limbs = null; this.rushing = false; }

  faceYaw() { return Math.atan2(-this.l.n.x, -this.l.n.z); }

  // ---- animation: IK every limb onto a rung ----
  animate(ch, base) {
    // a neutral body to hang the IK off: the idle pose, arms up
    const p = ch.clips.sample('idle', 0.5, ch.P.tmp);
    ch.clips.blend(base, p, this.w);
  }

  hands(ch) {
    if (!this.limbs || !this.active) return;
    const P = this.P, l = this.l, rung = this.cfg.rung, w = this.w;
    const along = new THREE.Vector3(-l.n.z, 0, l.n.x); // (the character's left, facing the ladder)
    const face = new THREE.Vector3(l.x, 0, l.z).addScaledVector(l.n, 0.1);
    const y = P.renderPos.y;
    const reach = { handL: [1.05, 1.95], handR: [1.05, 1.95], footL: [0.0, 0.8], footR: [0.0, 0.8] };
    const H = (r) => l.y0 + r * rung;
    for (const k of Object.keys(this.limbs)) {
      const L = this.limbs[k];
      const [lo, hi] = reach[k];
      const top = Math.floor((l.y1 - l.y0) / rung) - 1;
      // climbed past it: move up two rungs (or down two)
      if (H(L.r) - y < lo && L.r + 2 <= top) { L.from = H(L.r); L.r += 2; L.t = 0; if (k.startsWith('hand')) sfx.rung(); }
      else if (H(L.r) - y > hi && L.r - 2 >= 1) { L.from = H(L.r); L.r -= 2; L.t = 0; }
      L.t = Math.min(1, L.t + 0.14);
    }
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? 1 : -1;
      const hL = this.limbs['hand' + side];
      if (!(side === 'R' && ch.gunHeld)) {
        const hy = hL.t < 1 && hL.from != null ? THREE.MathUtils.lerp(hL.from, H(hL.r), hL.t) : H(hL.r);
        const lift = hL.t < 1 ? Math.sin(Math.PI * hL.t) * 0.1 : 0;
        const q = ch.handQuat(ch.arm[side], new THREE.Vector3(0, 1, 0).addScaledVector(l.n, -0.6), l.n.clone().negate());
        const p = face.clone().addScaledVector(along, sg * 0.2).setY(hy + 0.02).addScaledVector(l.n, 0.02 + lift);
        p.sub(ch.arm[side].palmPt.clone().applyQuaternion(q));
        ch.reachHand(side, p, q, w);
      }
      // feet on the rungs (IK the legs here too: the hands pass is the last word on the pose)
      const fL = this.limbs['foot' + side];
      const fy = fL.t < 1 && fL.from != null ? THREE.MathUtils.lerp(fL.from, H(fL.r), fL.t) : H(fL.r);
      const lift = fL.t < 1 ? Math.sin(Math.PI * fL.t) * 0.12 : 0;
      const leg = ch.leg[side];
      const target = face.clone().addScaledVector(along, sg * 0.12).setY(fy + ch.ankleRest).addScaledVector(l.n, 0.05 + lift);
      const cur = leg.foot.getWorldPosition(new THREE.Vector3());
      target.lerp(cur, 1 - w);
      const pole = leg.thigh.getWorldPosition(new THREE.Vector3()).addScaledVector(l.n, -0.6).add(new THREE.Vector3(0, -0.2, 0));
      ch.solveLeg(leg, target, pole);
    }
  }

  label() { return 'LADDER'; }
}
