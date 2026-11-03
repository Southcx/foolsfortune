// ---------------------------------------------------------------------------------------
// THE MECH'S SKATE (plain name; South, 2026-11-02: "Since we're going along with Armored Core design philosophy, skating around with
// the boosters ... will be the main method of movement"): the movement kit the pilot (world/hangar/mechpilot.js, Petra's) asks each
// frame, kept apart so its numbers are one table. With the booster lit on the ground the frame glides on its feet as on skates:
//   THE SKATE      lit by a quick boost (or an assault boost let go), held while a way is pushed and the battery holds; the booster
//                  burns SKATE.share of its thrust, so the skate's top is that share of Dovina's boost top (thrust over the air's drag:
//                  frame.js) and its draw that share of her `fire`; pushed, the velocity carves toward the way (its heading turned at
//                  the feel's carve rate, its speed kept: an edge biting, never a slide), let go, it glides on the air's drag alone
//                  (her τ = m / C); a way pushed against the glide (past SKATE.pivotA) is a pivot: the frame skids round, braking hard
//   THE FACING     skating, the frame faces where the camera looks (Armored Core's: strafe and back quick boosts read as such); walking,
//                  it faces the way it walks, as before
//   THE WALK       stays for no booster (an overweight frame: boostTop 0) or an empty battery
//   THE FEEL KNOB  MECH_FEEL.k, 0 (the kaiju: weighty, slow turns, long recovery, a big shake, a lazy camera) to 1 (the arcade: snappy
//                  accel, near-instant turns, short recovery); default 0.65, Armored Core 6's place, heavy at rest and snappy in a boost.
//                  Each a modifier over Dovina's numbers (rules.js, frame.js), never a change to them: turn rate, accel response, the
//                  carve, the quick boost's recovery and cooldown, how much of the old motion a quick boost cancels, the camera's ease,
//                  its kick and its shake. `/mechfeel <0..1>`, kept in the settings (section `mechFeel`)
//   THE POSE       anim(p): one object a frame for the body's animator (vfx/mechs/anim/animator.js): the skate's share, the carve's
//                  lean into the curve (the centripetal acceleration over g) and the boost's pitch, the moments as counters (a quick
//                  boost and its direction in the body, a landing and its weight, a pivot and its side, a hop), the boosters' exhaust
//   EVENTS         mech.skate { k } (the skate's speed over its top, every SKATE.say real s while it skates), mech.land { k } (a
//                  landing's weight), mech.turn { k, pivot } (a pivot, or a carve past SKATE.turnRate); all `by: 'courier'`
// Prior art: Armored Core 6's ground boost, quick boost and assault boost (and its stance: heavy at rest, snappy in a boost), Titanfall's
// titans, a speed skater's carve (the edge bites, the speed is kept), a skid turn; the feel knob as a designer's single dial (Nintendo's
// "game feel" tuning, Steve Swink, Game Feel, 2009).
//
//   MECH_FEEL   feelOf(k)   SKATE   const K = new MechSkate(game)   K.drive(p, { wx, wz, moving, out, legK, loadK, dt }) -> { on, want, rate }
//   K.canQuick()   K.quick(p, dx, dz) -> lock (real s)   K.light()   K.landed(p, vy)   K.anim(p) -> anim   K.camera(p, dt) -> { ease, fov, back, shake }
//   installMechFeel(game) (`/mechfeel`, the settings section)   p: the pilot ({ vel {x,z}, yaw, camYaw, grounded, vy, assault, boostT, gait, speed, stats, battery, kneel })
// ---------------------------------------------------------------------------------------
import { G as GRAV, QB } from '../../progress/mechs/frame.js';

/** The feel knob (0 the kaiju .. 1 the arcade). */
export const MECH_FEEL = { k: 0.65 };
/** The pilot's turn rate today (rad a real s; mechpilot.js PILOT.turn, tank 2), the base the feel multiplies. */
export const TURN = { base: 1.4, tank: 2 };
/** What the knob does, each a modifier over the base: the skate's turn (x TURN), the walk's turn, the skate's accel (x thrust / mass),
 *  the carve (rad/s), the quick boost's lock (x QB.t) and its cooldown (x the lock), the share of the old motion against a quick boost
 *  it cancels, the camera's ease (s^-1), its shake (x), its kick on a quick boost and pull on the assault (degrees), its pull back on
 *  the assault (x the arm), the lean's gain and its ease, the landing's hold (x). */
export function feelOf(k = MECH_FEEL.k) {
  k = Math.max(0, Math.min(1, k));
  return {
    k, turn: 0.55 * 5.5 ** k, walkTurn: 0.75 + 0.5 * k, accel: 0.45 * 4.4 ** k, carve: 0.6 + 3.4 * k ** 1.2,
    recov: 1.7 * 0.22 ** k, cool: 0.7, cancel: 0.85 * k, camEase: 4 + 12 * k, shake: 1.8 - 1.2 * k,
    fovQB: 4 + 6 * k, fovAssault: 3 + 3 * k, backAssault: 0.25 - 0.1 * k, lean: 1.25 - 0.45 * k, leanEase: 3 + 7 * k, hold: 1.6 - 1.1 * k,
  };
}
/** The skate's numbers: the share of the booster's thrust it burns (its top that share of the boost top), the share it idles at
 *  gliding, how long a frame below its walk with no way pushed glides before it stands (real s), the pivot's angle (rad) and the
 *  speed under which it is a plain turn (m/s) and its brake (x the accel), a landing's full weight (m/s down), how often mech.skate is
 *  said (real s), a carve's rate that says mech.turn (rad/s), the lean's and the pitch's caps (rad). */
export const SKATE = { share: 0.45, idle: 0.1, off: 0.7, pivotA: 2.2, pivotV: 6, skid: 2.4, landV: 14, say: 0.5, turnRate: 1.2, leanMax: 0.34, pitchMax: 0.22 };

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class MechSkate {
  constructor(game = null) { this.game = game; this.reset(); }
  get F() { if (this.fk !== MECH_FEEL.k) { this.fk = MECH_FEEL.k; this.f = feelOf(this.fk); } return this.f; }
  reset() {
    this.on = false; this.active = false; this.offT = 0; this.coolT = 0; this.lock = 0; this.sayT = 0; this.turnSaid = 0; this.wasGrounded = true;
    this.lv = { x: 0, z: 0 }; this.leanX = 0; this.pitch = 0; this.wish = { x: 0, z: 0, m: 0 }; this.pivoting = false; this.fov = 0; this.back = 0;
    this.qbId = 0; this.qbF = 0; this.qbL = 0; this.landId = 0; this.landK = 0; this.pivotId = 0; this.pivotSide = 1; this.hopId = 0;
    this.A = this.A || {};
  }
  emit(name, o) { o.by = 'courier'; this.game?.events?.emit(name, o); }
  /** Can the booster light the skate: a frame not overweight (Dovina's boostTop), with battery or pool left. */
  can(p) { const S = p.stats; return S.boostTop > 0 && (p.battery ?? 1) > 0 && !(p.broken?.('legs')); }

  /** A frame of the drive (called by the pilot once its wish is known, before its own walk): the skate's velocity written into
   *  p.vel while it skates, and the facing the pilot turns toward (`want`, a yaw or null) at `rate` (rad/s). */
  drive(p, { wx = 0, wz = 0, moving = false, out = 1, legK = 1, loadK = 1, dt = 0 } = {}) {
    const S = p.stats, F = this.F, v = p.vel, sp = Math.hypot(v.x, v.z);
    this.coolT -= dt; this.wish.x = wx; this.wish.z = wz; this.wish.m = moving ? Math.min(1, Math.hypot(wx, wz)) : 0;
    if (!this.can(p)) this.on = false;
    if (this.on && !moving && sp < S.walkTop) { if ((this.offT += dt) > SKATE.off) this.on = false; } else this.offT = 0;
    if (!this.wasGrounded && p.grounded) this.wasGrounded = true;
    if (this.wasGrounded && !p.grounded) { this.wasGrounded = false; if (this.on && (p.vy ?? 0) > 0) this.hopId++; } // (a jump while skating: the boost hop)
    this.active = this.on && p.grounded && !p.assault;
    this.leanStep(p, dt);
    const tankK = S.legType === 'tank' ? TURN.tank / TURN.base : 1;
    if (!this.active) { this.pivoting = false; return { on: false, want: null, rate: TURN.base * tankK * F.walkTurn }; }
    // the skate's facing: the camera's (Armored Core's), turned at the feel's rate
    const res = { on: true, want: p.camYaw ?? p.yaw, rate: TURN.base * tankK * F.turn };
    // the skate's push and the carve (a quick boost's lock carries its own velocity)
    if (p.boostT > 0) return res;
    const m = S.mass + (p.heldMass || 0), top = S.boostTop * SKATE.share * out * legK * loadK, aMax = ((S.thrust * SKATE.share * out) / m) * F.accel;
    if (moving && this.wish.m > 0.05) {
      const ux = wx / this.wish.m, uz = wz / this.wish.m;
      let s = sp, h = sp > 0.5 ? Math.atan2(v.x, v.z) : Math.atan2(ux, uz);
      const d = wrap(Math.atan2(ux, uz) - h);
      if (Math.abs(d) > SKATE.pivotA && sp > SKATE.pivotV) { // (a way pushed against the glide: the skid round)
        if (!this.pivoting) { this.pivoting = true; this.pivotId++; this.pivotSide = d > 0 ? 1 : -1; this.emit('mech.turn', { k: +(sp / Math.max(1, top)).toFixed(2), pivot: true }); }
        s = Math.max(0, s - aMax * SKATE.skid * dt);
      } else {
        if (this.pivoting && sp < SKATE.pivotV) h = Math.atan2(ux, uz);
        this.pivoting = false;
        const turn = Math.sign(d) * Math.min(Math.abs(d), F.carve * dt); h += turn;
        const want = top * this.wish.m; s += Math.max(-aMax * dt * 0.5, Math.min(aMax * dt, want - s));
        if (Math.abs(turn) / Math.max(dt, 1e-6) > SKATE.turnRate && s > top * 0.5 && (this.turnSaid -= dt) <= 0) { this.turnSaid = 1; this.emit('mech.turn', { k: +(s / Math.max(1, top)).toFixed(2), pivot: false }); }
      }
      v.x = Math.sin(h) * s; v.z = Math.cos(h) * s;
      p.spend?.(S.fire * SKATE.share * dt); // (the booster's share of its fire: Dovina's energy, paid as spent)
    } else {
      const g = Math.exp(-dt / Math.max(0.5, S.tau || 1)); v.x *= g; v.z *= g; // (gliding: the air's drag alone, her τ)
      p.spend?.(S.fire * SKATE.idle * dt);
    }
    if ((this.sayT -= dt) <= 0) { this.sayT = SKATE.say; this.emit('mech.skate', { k: +(Math.hypot(v.x, v.z) / Math.max(1, top)).toFixed(2) }); }
    return res;
  }
  /** The lean into the curve and the pitch of the push, from the frame's acceleration in its body (+X left, +Z front). */
  leanStep(p, dt) {
    const v = p.vel, F = this.F; if (!(dt > 0)) return;
    const ax = (v.x - this.lv.x) / dt, az = (v.z - this.lv.z) / dt; this.lv.x = v.x; this.lv.z = v.z;
    const c = Math.cos(p.yaw), s = Math.sin(p.yaw), left = ax * c - az * s, fwd = ax * s + az * c, on = p.grounded ? 1 : 0.4;
    const L = Math.max(-SKATE.leanMax, Math.min(SKATE.leanMax, Math.atan(left / GRAV) * F.lean * on)), P = Math.max(-SKATE.pitchMax, Math.min(SKATE.pitchMax, Math.atan(fwd / GRAV) * 0.7 * on));
    const e = 1 - Math.exp(-dt * F.leanEase); this.leanX += (L - this.leanX) * e; this.pitch += (P - this.pitch) * e;
  }
  /** A quick boost may fire again (its cooldown, the feel's). */
  canQuick() { return this.coolT <= 0; }
  /** A quick boost along (dx, dz) (world, unit), called before the pilot adds Dovina's Δv: the share of the motion against it the
   *  feel cancels, the skate lit, the lurch said to the body; returns the lock (real s) the pilot holds its velocity for (its boostT). */
  quick(p, dx, dz) {
    const F = this.F, v = p.vel, along = v.x * dx + v.z * dz;
    if (along < 0) { v.x -= dx * along * F.cancel; v.z -= dz * along * F.cancel; }
    this.on = true; this.lock = QB.t * F.recov; this.coolT = this.lock * F.cool; this.qbId++; this.fov = Math.max(this.fov, F.fovQB);
    const c = Math.cos(p.yaw), s = Math.sin(p.yaw); this.qbL = dx * c - dz * s; this.qbF = dx * s + dz * c;
    return this.lock;
  }
  /** The skate lit with no quick boost (an assault boost let go). */
  light() { this.on = true; }
  /** Landed (the pilot's move(), its fall speed `vy` m/s down): the squash's weight said, the cradle shaken by it. */
  landed(p, vy) {
    const k = Math.min(1, Math.abs(vy) / SKATE.landV); if (k < 0.08) return k;
    this.landId++; this.landK = k; this.emit('mech.land', { k: +k.toFixed(2) });
    p.shake = Math.max(p.shake || 0, Math.min(1, k * 0.6 * this.F.shake));
    return k;
  }
  /** The body's animator's input this frame (one object, refilled). */
  anim(p) {
    const A = this.A, S = p.stats, F = this.F, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
    A.feel = F.k; A.recov = QB.t * F.recov; A.hold = F.hold; A.skate = this.active || (this.on && !p.grounded) ? 1 : 0; A.assault = !!p.assault;
    A.grounded = !!p.grounded; A.vy = p.vy || 0; A.gait = p.gait || 0; A.speed = p.speed ?? Math.hypot(p.vel.x, p.vel.z);
    A.walk = !A.skate && S.step > 0 ? Math.min(1, A.speed / Math.max(1, S.walkTop)) * (p.grounded ? 1 : 0.2) : 0;
    A.leanX = this.leanX; A.pitch = this.pitch; A.qbId = this.qbId; A.qbF = this.qbF; A.qbL = this.qbL; A.landId = this.landId; A.landK = this.landK;
    A.pivotId = this.pivotId; A.pivotSide = this.pivotSide; A.hopId = this.hopId;
    // the exhaust, against the thrust (the body's frame): the assault straight back, a quick boost against its way, a rise or a hop down, the skate against the way pushed
    let tx = 0, ty = 0, tz = 0, k = 0;
    if (p.assault) { tz = 1; k = 1; }
    else if (p.boostT > 0 && this.lock > 0) { tx = this.qbL; tz = this.qbF; k = 0.35 + 0.65 * Math.min(1, p.boostT / this.lock); }
    else if (!p.grounded && (p.vy || 0) > 0.5 && this.on) { ty = 1; k = 0.8; }
    else if (this.active) { const w = this.wish; if (w.m > 0.05) { tx = (w.x * c - w.z * s) / w.m; tz = (w.x * s + w.z * c) / w.m; k = SKATE.share; } else { tz = 1; k = SKATE.idle; } }
    const l = Math.hypot(tx, ty + 0.35, tz) || 1; // (a little lift in every thrust: the bells never point flat at the ground behind)
    A.boostX = -tx / l; A.boostY = -(ty + 0.35) / l; A.boostZ = -tz / l; A.boostK = k;
    return A;
  }
  /** The camera's modifiers this frame: its ease, the quick boost's kick and the assault's pull (degrees of FOV), the arm's pull
   *  back (x its length), the shake's multiplier. */
  camera(p, dt) {
    const F = this.F; this.fov *= Math.exp(-dt * 5); const back = p.assault ? F.backAssault : 0; this.back += (back - this.back) * Math.min(1, dt * 3);
    this.cam ||= {}; this.cam.ease = F.camEase; this.cam.fov = this.fov + (p.assault ? F.fovAssault : 0); this.cam.back = 1 + this.back; this.cam.shake = F.shake;
    return this.cam;
  }
}

/** `/mechfeel <0..1>` and the knob kept with the settings. */
export function installMechFeel(game) {
  game.save?.section?.('mechFeel', { scope: 'settings', version: 1, dump: () => ({ k: MECH_FEEL.k }), load: (s) => { if (Number.isFinite(s?.k)) MECH_FEEL.k = Math.max(0, Math.min(1, s.k)); }, reset: () => { MECH_FEEL.k = 0.65; } });
  game.chat?.add?.('mechfeel', { help: 'the mech\'s feel: /mechfeel <0..1> (0 the kaiju, 1 the arcade; 0.65 the default)', run: ([v]) => {
    const k = Number(v); if (!Number.isFinite(k)) { game.log?.say?.('info', `Mech feel ${MECH_FEEL.k.toFixed(2)} (0 heavy, 1 snappy).`); return; }
    MECH_FEEL.k = Math.max(0, Math.min(1, k)); game.save?.dirty?.('mechFeel'); game.events?.emit('mech.feel', { k: MECH_FEEL.k, by: 'courier' });
  } });
}
