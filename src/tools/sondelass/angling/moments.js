// ---------------------------------------------------------------------------------------
// THE LINE'S MOMENTS (docs/plans/ANGLING.md 3): three beats of the fight told by the instrument itself, the rod and the line.
//
//   THE HOOK SET  HOOK.frames frames of hit-stop (game.time.pulse), the line drawn dead straight for HOOK.straight real s (slack told
//                 0: line.js), and the rod snapped to a load (HOOK.load's bend) that the fight's own tension then takes over.
//   THE LEAP      at its apex, LEAP.hold real s held (a time pulse): the fish hangs over the water; bowed, the line hangs slack under it,
//                 not, it strains (the fight's bow: angler.js bowK).
//   THE SNAP      the line whips loose: its free end flies back at the rod and falls, drawn as a rope with all its slack for WHIP.life
//                 real s; the rod springs up past straight and settles (a damped spring from the load it had); then a beat of silence
//                 (the music ducked SNAP.hush real s: music/player.js duck). No jingle.
// None of it says a word: the log's lines are tracking/angling.js's on angle.hookset and angle.escape.
//
// Prior art: Vlambeer's hit-stop ("the art of screenshake") and fighting games' hit-lag for the strike; Sega Bass Fishing's rod as the
// whole readout (it loads on the set and springs back on the break); Twilight Princess's leap hung at its top; real monofilament, which
// recoils toward the rod when it parts.
//
//   const m = new LineMoments(angler)   m.hookSet()   m.leap(fight)   m.snap(from)   m.update(dt)   m.bend() (radians, added)
//   m.slack() -> 0 | null (told to the line)   m.drawWhip(line, tip, o) -> true while the whip is drawn
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { rodBend } from './rodhands.js';

/** The hook set: frames of hit-stop (at 60 Hz) and its scale, the straight line's real s, the load the rod snaps to (a tension). */
export const HOOK = { frames: 4, scale: 0.02, release: 0.08, straight: 0.3, load: 0.7 };
/** The leap's apex: real s held, its scale; the airborne height (0..1) under which it is not an apex. */
export const LEAP = { hold: 0.25, scale: 0.06, release: 0.12, min: 0.6 };
/** The snap: the whip's life (real s), the free end's recoil speed (m/s, at most), the rod's spring (rate, hz), the music's silence. */
export const WHIP = { life: 0.6, recoil: 13, spring: 5.5, hz: 2.6 };
export const SNAP = { hush: 0.9, to: 0.06 };
const G = 9.81;

export class LineMoments {
  constructor(angler) {
    this.a = angler; this.game = angler.game;
    this.straightT = 0; this.spring = null; this.whip = null; this.airPrev = 0; this.rising = false;
  }

  hookSet() {
    const g = this.game;
    g.time.pulse('hookset', HOOK.scale, HOOK.frames / 60, { release: HOOK.release });
    this.straightT = HOOK.straight;
    this.a.bendX = rodBend(HOOK.load); // (the rod loads at once; the fight's tension eases it from there: angler.js update)
  }

  /** Each frame of the fight: the leap's top found as its height turns over, and held there. */
  leap(F) {
    const air = F.seg?.air ? F.airborne : 0, rising = air > this.airPrev;
    if (this.rising && !rising && this.airPrev >= LEAP.min) this.game.time.pulse('leap', LEAP.scale, LEAP.hold, { release: LEAP.release });
    this.rising = rising; this.airPrev = air;
  }

  /** The line parts at `from` (the fish's mouth): its end recoils at the rod, the rod springs up, and the music rests. */
  snap(from) {
    const a = this.a;
    a.tool.model.group.updateMatrixWorld(true);
    const tip = a.tool.tip(new THREE.Vector3());
    const v = tip.clone().sub(from), d = v.length();
    v.multiplyScalar(Math.min(WHIP.recoil, d * 2.2) / Math.max(0.01, d)); v.y += 3;
    this.whip = { t: 0, end: from.clone(), vel: v, len: d };
    this.spring = { t: 0, b0: a.bendX + (a.shudder || 0) };
    a.bendX = 0;
    this.game.music?.duck?.(SNAP.hush, SNAP.to);
  }

  update(dt) {
    this.straightT = Math.max(0, this.straightT - dt);
    if (this.spring && (this.spring.t += dt) > 2) this.spring = null;
    const W = this.whip;
    if (W) {
      W.t += dt;
      W.vel.y -= G * dt; W.vel.multiplyScalar(Math.exp(-dt * 1.5));
      W.end.addScaledVector(W.vel, dt);
      if (W.t > WHIP.life) { this.whip = null; this.a.line.hide(); }
    }
  }

  /** The rod's spring after a snap (radians, on top of its bend): from the load it had, up past straight, and settling. */
  bend() {
    const S = this.spring; if (!S) return 0;
    return S.b0 * Math.exp(-S.t * WHIP.spring) * Math.cos(S.t * WHIP.hz * Math.PI * 2);
  }
  /** Told to the line: straight (0) just after the hook set, else nothing (the line's own). */
  slack() { return this.straightT > 0 ? 0 : null; }

  /** The whip, drawn while it lasts: the line from the tip to its free end with all its slack, limp. */
  drawWhip(line, tip, o) {
    const W = this.whip; if (!W) return false;
    o.tension = 0; o.fish = null; o.slack = W.len * (0.25 + 0.5 * Math.min(1, W.t / WHIP.life));
    line.set(tip, W.end, o);
    return true;
  }
}
