// ---------------------------------------------------------------------------------------
// THE CORE MOVEMENT'S KEY POSES, A TRIAL (KEY-POSES.md 7 items 3 and 4; Petra's round 3): the jump from its crouched spring to the land,
// the air dash and the turnaround drawn as held keys laid over the air's clips (anim/airborne.js) and the run, only while the setting
// `visual.keyPoses` is on and South has not yet ruled on it. Only what is shown changes: the core movement (player.js) decides every
// jump, dash and turn as before, and this reads its state (grounded, vy, dashT, the velocity's heading) to pick the key. Off, or with any
// other tech's pose weighted (a tool drawn, a blow, a swim), it stands down and the body plays exactly as before.
//   THE JUMP      takeoff (Air_JumpStart 3) 3 frames, rise (its 6) while climbing, peak (Air_JumpLoop 6) round the top, fall
//                 (Air_FallLoop 6) until the ground
//   THE LAND      after a real time in the air: the squash (Air_JumpLand 3) held 4 frames, then the recovery (its 12) 4; at a run's
//                 speed the squash 3 and no recovery, so the run is not stopped
//   THE AIR DASH  the lead (Air_AirDash 1) 2 frames, then the dash (its 6) held while the dash lasts
//   THE TURN      running at 3 m/s or more with the movement keys pushed more than 120 degrees off the way the body goes: the pivot (Loco_Turn180 6) 4
//                 frames and its way out (11) 4, the body's facing kept the game's (the clip's own turn taken off the pelvis)
// Each key is snapped into over 2 frames from what stood (an ease-out) and the layer fades in over 2 and out over 4; the pelvis's height
// is always the core's (hipW 0), so nothing here moves the capsule or the camera.
// Prior art: Guilty Gear Xrd's held key drawings over a 60 Hz game, Smash's jumpsquat and landing lag drawn as single poses, the
// animator's squash and stretch on a hop; Super Mario 64's skid turn (a pose held for the reversal).
//
//   techs.add(new KeyLocomotion(techs))   (passive; boot/tools.js)   KEY_LOCO (the keys, for the contact sheet)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { Tech } from '../moves/techs.js';

/** The stills (clip frames at 30 fps), each with its hold in 60 Hz frames where it is not held by the state. */
export const KEY_LOCO = {
  takeoff: { clip: 'Air_JumpStart', frame: 3, hold: 3 },
  rise: { clip: 'Air_JumpStart', frame: 6 },
  peak: { clip: 'Air_JumpLoop', frame: 6 },
  fall: { clip: 'Air_FallLoop', frame: 6 },
  land: { clip: 'Air_JumpLand', frame: 3, hold: 4 },
  recover: { clip: 'Air_JumpLand', frame: 12, hold: 4 },
  lead: { clip: 'Air_AirDash', frame: 1, hold: 2 },
  dash: { clip: 'Air_AirDash', frame: 6 },
  pivot: { clip: 'Loco_Turn180', frame: 6, hold: 4, turn: true },
  out: { clip: 'Loco_Turn180', frame: 11, hold: 4, turn: true },
};
const SNAP = 2, PEAK_VY = 1.5, LAND_AIR = 0.25, RUN = 4, TURN = { speed: 3, cos: -0.5 };
const FADE_IN = 30, FADE_OUT = 15; // (per s: about 2 and 4 frames at 60)
const _w = new THREE.Vector3();
const ease = (u) => 1 - (1 - u) * (1 - u);

export class KeyLocomotion extends Tech {
  constructor(mgr) {
    super(mgr, 'keyLocomotion');
    this.passive = true;
    this.key = null; this.f = 0; this.was = true; this.vyPrev = 0; this.dashPrev = 0; this.airMax = 0;
    this.turned = false; this.k = 0;
  }
  usable() { return !!T.visual.keyPoses; }
  get engaged() { return !!this.key; }

  /** Another tech's pose in the body (a tool drawn, a blow, a swim): this one stands down. */
  others() {
    const M = this.mgr; if (M.active) return true;
    for (const t of M.list) if (t !== this && t.w > 0.05) return true;
    return false;
  }

  set(name) { if (this.key !== name) { this.prev = this.key; this.key = name; this.f = 0; } }

  fixed(dt) {
    const P = this.P;
    if (!T.visual.keyPoses || this.others() || P.wallrun) { this.key = null; this.was = P.grounded; this.dashPrev = P.dashT; return; }
    this.f += dt * 60;
    const vy = P.vel.y, hs = Math.hypot(P.vel.x, P.vel.z), K = this.key, held = (n) => this.f >= (KEY_LOCO[n].hold || 0);
    if (!P.grounded) this.airMax = Math.max(this.airMax, P.airT);
    if (P.dashT > 0 && this.dashPrev <= 0) this.set('lead');
    else if (K === 'lead') { if (held('lead')) this.set('dash'); }
    else if (K === 'dash' && P.dashT > 0) { /* held while the dash lasts */ }
    else if (!P.grounded) {
      if (this.was && vy > 0.5) this.set('takeoff');
      else if (K === 'takeoff' && !held('takeoff')) { /* the spring */ }
      else if (vy > PEAK_VY) this.set('rise');
      else if (Math.abs(vy) <= PEAK_VY) this.set('peak');
      else this.set('fall');
    } else if (!this.was) { // (the ground met)
      this.set(this.airMax > LAND_AIR ? 'land' : null); this.fast = hs > RUN; this.airMax = 0;
    } else if (K === 'land') { if (this.f >= (this.fast ? 3 : KEY_LOCO.land.hold)) this.set(this.fast ? null : 'recover'); }
    else if (K === 'recover') { if (held('recover')) this.set(null); }
    else if (K === 'pivot') { if (held('pivot')) this.set('out'); }
    else if (K === 'out') { if (held('out')) this.set(null); }
    else this.set(null);
    // (the turnaround: running fast one way with the movement keys pushed the other, once a reversal)
    const W = P.wishDir(_w);
    const back = P.grounded && hs > TURN.speed && W.lengthSq() > 0.25 && (P.vel.x * W.x + P.vel.z * W.z) / (hs * Math.sqrt(W.lengthSq())) < TURN.cos;
    if (back && !this.turned && !this.key) this.set('pivot');
    this.turned = back;
    this.was = P.grounded; this.dashPrev = P.dashT;
  }

  tick(dt) { // (the layer's own weight: in fast, out a little slower; the manager's `w` only gates animate)
    const on = !!this.key && T.visual.keyPoses;
    this.k = THREE.MathUtils.clamp(this.k + (on ? FADE_IN : -FADE_OUT) * dt, 0, 1);
    if (!on && this.k <= 0) { this.cur = null; this.prevName = null; }
  }

  animate(ch, base, dt, s) {
    if (this.k <= 0 || !T.visual.keyPoses) return;
    const C = ch.clips;
    const name = this.key || this.cur; if (!name) return;
    this.cur = name;
    const K = KEY_LOCO[name], c = C.clips[K.clip]; if (!c) return;
    const A = (this.A ||= C.pose()), F = (this.F ||= C.pose());
    C.sample(K.clip, Math.min(c.n - 1, K.frame) / C.fps, A, false);
    if (K.turn) for (let i = 0; i < 4; i++) A.q[i] = base.q[i]; // (the clip's turn taken off: the body faces where the game turns it)
    // (the snap: from the last key's still into this one over SNAP frames)
    if (this.prevName !== name) { if (this.lastA) F.copy(this.lastA); this.snapF = this.lastA ? 0 : SNAP; this.prevName = name; }
    if (this.snapF < SNAP) { this.snapF += dt * 60; const B = (this.B ||= C.pose()).copy(F); C.blend(B, A, ease(Math.min(1, this.snapF / SNAP))); A.copy(B); }
    (this.lastA ||= C.pose()).copy(A);
    C.blend(base, A, this.k * this.w, null, 0);
  }
}
