// ---------------------------------------------------------------------------------------
// THE STANDOFF: the hands and forearms kept out of the Courier's torso, hips and thighs. The suite was captured on a slimmer body than the
// Courier's armour, so a hand laid on the chest, set on a hip or hung at the side goes into it (the pose audit, 2026-10-11: 41 emotes 1.3
// to 6.2 cm into a thigh or the hips, five 4 to 11.5 cm into the chest; the akimbo idle's hands 6.3 into the hips); and a blend or a
// tool's clip can carry a forearm across the chest. Every frame, after the pose and before what the hands hold is placed (character.js
// poseHands), each limb's own points (bodyproxies.js: its vertices, thinned) are tested against the body's proxies; the deepest is
// moved out onto the surface along the way out of it, the arm solved again to the wrist moved by as much (the hand's turn kept), the
// elbow carried out with it when it is the forearm that is in: the light IK of a hand put on a surface (CLAUDE.md), a few rounds, at
// most MAX_PUSH a frame. A hand that is holding on to something placed (the psygun, a wall, a ledge) is left where it is.
//
// Prior art: Mixamo's "Character Arm-Space" (the arms of a capture spread for a bulkier body), the self-collision pass of a pose
// correction (Unreal's Control Rig "collision" nodes, Final IK's body-aware reach: a limb pushed out of the body's capsules and the chain
// solved again), and casebook rule 194 (what lies past its proxy is cleared where it is drawn, by sliding, never by asking for room).
//
//   const so = new Standoff(ch, body)      so.apply(keep)    keep: { L, R } 0..1, how much of each hand stays where it is
//   so.pushed.L / so.pushed.R              (metres moved this frame, for a measure)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** What a hand and a forearm are kept out of; the margin past the surface (m); the most a hand is moved in a frame (m); rounds. */
export const STANDOFF = { parts: ['chest', 'spine', 'pelvis', 'thighL', 'thighR'], margin: 0.006, maxPush: 0.16, rounds: 4 };
const SIDES = ['L', 'R'], HAND = { L: 'handL', R: 'handR' }, FORE = { L: 'forearmL', R: 'forearmR' }, NO_KEEP = { L: 0, R: 0 }; // (named once: no string or array made a frame)
const _n = new THREE.Vector3(), _w = new THREE.Vector3(), _e = new THREE.Vector3(), _q = new THREE.Quaternion(), _hint = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();

export class Standoff {
  constructor(ch, body) {
    this.ch = ch; this.body = body; this.pts = { L: [], R: [] }; this.pushed = { L: 0, R: 0 };
  }

  apply(keep = NO_KEEP) {
    const ch = this.ch, body = this.body;
    for (let j = 0; j < 2; j++) {
      const s = SIDES[j];
      this.pushed[s] = 0;
      if ((keep[s] ?? 0) > 0.5) continue;
      const arm = ch.arm[s];
      for (let k = 0; k < STANDOFF.rounds; k++) {
        ch.root.updateMatrixWorld(true);
        body.place();
        const hand = body.limb(HAND[s], this.handPts ||= []), nh = hand.length, fp = body.limb(FORE[s], this.forePts ||= []);
        const pts = this.pts[s]; pts.length = 0;
        for (let i = 0; i < nh; i++) pts.push(hand[i]);
        for (let i = 0; i < fp.length; i++) pts.push(fp[i]);
        const hit = body.deepest(pts, STANDOFF.parts);
        if (!hit || hit.d < 0.002) break;
        // the way out: the proxy's own, leaning away from the body's middle when the point is on its axis
        ch.bones.spine.getWorldPosition(_c);
        _hint.subVectors(pts[hit.i], _c).setY(0);
        body.out(hit.proxy, pts[hit.i], _n, _hint);
        const push = Math.min(hit.d + STANDOFF.margin, STANDOFF.maxPush - this.pushed[s]);
        if (push <= 0.001) break;
        arm.hand.getWorldPosition(_w); arm.hand.getWorldQuaternion(_q); arm.fore.getWorldPosition(_e);
        // (a hand point: the wrist moved, the elbow half as far; a forearm point: both by the push, the forearm carried out whole)
        const fore = hit.i >= nh;
        _w.addScaledVector(_n, push);
        _e.addScaledVector(_n, fore ? push : push * 0.5);
        _e.addScaledVector(_d.copy(_e).sub(arm.upper.getWorldPosition(_c)).normalize(), 0.05); // (the elbow a little out along its upper arm, as moved)
        ch.reachHand(s, _w, _q, 1, 0, _e); // (reachHand reads them at once: character.js keeps its own copies)
        this.pushed[s] += push;
      }
    }
    ch.root.updateMatrixWorld(true);
  }
}
