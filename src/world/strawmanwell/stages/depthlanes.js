// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE DEPTH'S LANES: the plane moved in depth (docs/plans/STRAWMANS-WELL.md 3.14), and the two small parts every
// wave 3 stage that keeps its own retry shares. The frame (wellframe.js) holds the body to `frame.spec.z` after each fixed step; a
// stage that moves the plane writes that number, eased over a hop, and the frame does the rest: the core movement is never touched.
//   PlaneShift   the plane eased from one depth to another over HOP.t real s with a little lift (Tomba!'s and Klonoa's lane hop); the
//                Wall's way into a painting is the same shift (wall.js)
//   StageRetry   a stage's own fall (the room's is off: `noRetry`): said as well.pit.death, the body put back at a checkpoint that knows its
//                depth after PIT.retry real s (Super Meat Boy's), never a shatter
//   sideLook     the side camera set by hand (a stage's `camera` hook: the Depth's seat kept in front of every lane, the Chase's scroll)
//
// Prior art: Tomba! 2's and Klonoa's lanes (a hop between paths at marked spots), Virtual Boy Mario Clash's two planes; Super Meat Boy's
// instant retry; the frame's own camera (wellframe.js SIDE_CAM).
//
//   const H = new PlaneShift(well)   H.to(z, { lift })   H.pre(dt)   H.busy   const R = new StageRetry(well, id)   R.fall([x, y, z], cause, after)
//   R.update(dt)   R.busy   sideLook(well, x, y, zPlane, zCam)   HOP
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PIT } from '../../../progress/strawmanwell.js';
import { AT } from '../layout.js';
import { SIDE_CAM } from '../wellframe.js';

/** A hop between depths: its time (real s, a jump's rise) and its lift (m/s up given at its start, a small hop). */
export const HOP = { t: 0.3, lift: 4.2 };
const _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0), _look = new THREE.Vector3();
const ease = (u) => u * u * (3 - 2 * u);

export class PlaneShift {
  constructor(well) { this.well = well; this.hop = null; }
  get busy() { return !!this.hop; }
  /** Ease the plane to world depth `z` (from where it is). */
  to(z, { lift = HOP.lift, t = HOP.t } = {}) {
    const F = this.well.frame, P = this.well.game.player; if (!F.spec) return;
    this.hop = { from: F.spec.z, to: z, t: 0, T: t };
    if (lift > 0) { P.vel.y = Math.max(P.vel.y, lift); P.grounded = false; }
  }
  /** Beside the fixed step (the stage's `pre`): the plane's depth this step. */
  pre(dt) {
    const H = this.hop, F = this.well.frame; if (!H || !F.spec) return;
    H.t += dt; const u = Math.min(1, H.t / H.T);
    F.spec.z = H.from + (H.to - H.from) * ease(u);
    if (u >= 1) this.hop = null;
  }
  cancel() { this.hop = null; }
}

export class StageRetry {
  constructor(well, id) { this.well = well; this.id = id; this.t = 0; this.at = null; this.after = null; }
  get busy() { return this.t > 0; }
  /** A fall (or a catch, a spike): said, and the body put back at [x, y, z] (lane x and y, world z) after the retry's time. */
  fall(at, cause = 'fall', after = null) {
    if (this.t > 0) return;
    this.t = PIT.retry; this.at = at; this.after = after;
    this.well.game.events?.emit('well.pit.death', { stage: this.id, cause, by: 'courier' });
  }
  update(dt) {
    if (this.t <= 0 || (this.t -= dt) > 0) return;
    const W = this.well, P = W.game.player, [x, y, z] = this.at;
    if (W.frame.spec) W.frame.spec.z = z;
    P.moveTo(new THREE.Vector3(AT.x + x, AT.y + y + 0.05, z), new THREE.Vector3()); W.frame.face = 1; this.t = 0;
    const a = this.after; this.after = null; a?.();
  }
  cancel() { this.t = 0; this.after = null; }
}

/** The side camera set by hand at (x, y), `zCam` its depth, looking square at the plane `zPlane` (the frame's own look, wellframe.js). */
export function sideLook(well, x, y, zPlane, zCam) {
  const cam = well.game.camera;
  cam.position.set(x, y, zCam);
  _look.set(x, y - SIDE_CAM.look, zPlane);
  _m.lookAt(cam.position, _look, _up); cam.quaternion.setFromRotationMatrix(_m);
  cam.updateMatrixWorld();
}
/** Half the view's width (m) on the plane `dist` m from the camera. */
export function halfWidth(well, dist = SIDE_CAM.dist) {
  const cam = well.game.camera; return Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist * (cam.aspect || 16 / 9);
}
