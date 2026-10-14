// ---------------------------------------------------------------------------------------
// THE GRIND: the Solar Skiff on a rail, and nothing else (the owner, 2026-10-13: no tool but the skiff; docs/plans/SKIFF-RACING.md
// section 7). The board lands or hops onto a rail within reach of its line and heading near it either way, and its keel fin locks to it
// (no button). On the rail it runs at the speed it came in with: downhill gains, uphill loses, the sail's wind along the rail pushes a
// little, and it drags a little. BALANCE, Tony Hawk's: a lean that drifts and grows the longer the grind, answered with A and D; lean
// past the edge and the board drops off that side and rides on (never a bail). Space lets go with a pop off the rail; the rail's end
// lets it go on its own. A grind of GRIND.trick metres or more is a trick (into the trick combo: combo.js). A curved rail throws the lean
// to the outside of its bend by the speed squared (A / D push the lean their own way: lean right, answer with A) (the owner: "racing is all about curves"): a fast grind round one is held into it.
// COASTER RAILS (world/raceway/coasterrail.js): a rail with `ups` (the way the board stands on it: banked, or round a loop's middle) and a
// `push` (a conduit's drive, m/s^2, through a loop): gravity acts along the rail's tangent in three dimensions, the board stands on the
// rail's up (skiff.js turns the whole unit to it), the conduit drives it round, and off a rail's end it flies on with the rail's own
// climb (a coaster's kicker). It locks only where the rail is upright (never onto a loop's side).
// Events: skiff.grind { by }, skiff.grind.end { metres, why: 'hop' | 'end' | 'fell' | 'stall', by }.
//
// Prior art: Tony Hawk's Pro Skater (the balance meter, a grind as a trick), Sonic Adventure 2's and Sonic Riders' rails (a lock on with
// no button, speed kept, downhill gains), Jet Set Radio (rails as a line through a level).
//
//   const G = new Grind(skiff)   G.on   G.tryLock(rails, pos, v, vy) -> bool   G.step(dt, input) -> { pos, vel, heading } | null (let go)
//   rails: [{ pts: [Vector3], cum: [m], len }]   (world points along each rail's top, and the length along it at each)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Reach to lock on (m across, m over the rail's top, m under it), the heading's cone (rad, either way along), the board's ride over the
 *  rail (m); the speed it never keeps under (m/s: it stalls off); gravity along the rail's slope (x g), drag (/s), the sail's push along
 *  it (m/s^2 at a full sail dead downwind); the balance's drift (/s, growing /s), A/D's answer (/s), a bend's throw (the lean a second
 *  for each m/s^2 of its pull, v^2 x its curvature), the pop off (m/s up); metres that make it a trick. */
export const GRIND = { reach: 1.4, over: 1.8, under: 0.5, cone: 0.62, ride: 0.55, stall: 3, gravity: 1, drag: 0.03, sail: 4,
  drift: 0.35, driftGrow: 0.06, answer: 1.8, bend: 0.04, bendMax: 0.6, pop: 9, trick: 12, relock: 0.6 };
// (relock: real seconds the rail just left will not take the board again: let go at its end, it locked again at once, every frame, and
// the board hung there (the owner, 2026-10-14))

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

export class Grind {
  constructor(skiff) { this.skiff = skiff; this.on = false; this.up = new THREE.Vector3(0, 1, 0); this.pushNow = 0; }

  /** Lock onto the nearest rail in reach whose line the travel runs along (either way), coming down or level onto it. */
  tryLock(rails, pos, v, vy) {
    if (this.on || !rails?.length || vy > 1.5) return false;
    const sp = Math.hypot(v.x, v.z); if (sp < GRIND.stall + 1) return false;
    let best = null;
    const now = this.skiff.rideT || 0;
    for (const R of rails) for (let i = 0; i < R.pts.length - 1; i++) {
      if (R === this.offR && now < this.offUntil) break;
      if (R.ups && R.ups[i].y < 0.8) continue; // (a loop's side, a steep bank: nothing to land on)
      const a = R.pts[i], b = R.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
      if (l2 < 0.01) continue;
      const u0 = ((pos.x - a.x) * dx + (pos.z - a.z) * dz) / l2;
      if ((i === 0 && u0 < 0) || (i === R.pts.length - 2 && u0 > 1)) continue; // (past the rail's ends: nothing to lock to)
      const u = Math.max(0, Math.min(1, u0)), px = a.x + dx * u, pz = a.z + dz * u, top = a.y + (b.y - a.y) * u;
      const d = Math.hypot(pos.x - px, pos.z - pz), up = pos.y - GRIND.ride - top;
      if (d > GRIND.reach || up > GRIND.over || up < -GRIND.under) continue;
      const l = Math.sqrt(l2), cos = (v.x * dx + v.z * dz) / (sp * l);
      if (Math.abs(cos) < Math.cos(GRIND.cone)) continue;
      if (!best || d < best.d) best = { R, s: R.cum[i] + l * u, d, dir: cos > 0 ? 1 : -1 };
    }
    if (!best) return false;
    Object.assign(this, { on: true, R: best.R, s: best.s, dir: best.dir, V: sp, lean: 0, t: 0, run: 0, seed: (best.s * 7.31) % 6.28 });
    this.skiff.game.events?.emit('skiff.grind', { by: 'courier' });
    return true;
  }

  /** A point on the rail at s, and the way it runs (the direction of travel, `_d`), its up (`this.up`) and its push (`this.pushNow`). */
  at(s, out = _a) {
    const R = this.R; let i = 0; while (i < R.pts.length - 2 && R.cum[i + 1] < s) i++;
    const a = R.pts[i], b = R.pts[i + 1], u = Math.max(0, Math.min(1, (s - R.cum[i]) / Math.max(1e-6, R.cum[i + 1] - R.cum[i])));
    out.copy(a).lerp(b, u); _d.copy(b).sub(a).normalize().multiplyScalar(this.dir);
    if (R.ups) this.up.copy(R.ups[i]).lerp(R.ups[i + 1], u).normalize(); else this.up.set(0, 1, 0);
    this.pushNow = R.push ? (R.push[i] || 0) : 0;
    return out;
  }

  /** One step on the rail: where the board is and how it moves, or null when it lets go (and why, in `this.why`). */
  step(dt, { steer = 0, hopUp = false, sailPush = 0 } = {}) {
    if (!this.on) return null;
    this.t += dt;
    this.at(this.s); const g = this.skiff.cfg.gravity;
    this.V += (-g * GRIND.gravity * _d.y + sailPush * GRIND.sail * Math.max(0, this.up.y) + this.pushNow - GRIND.drag * this.V) * dt; // (gravity along the rail's tangent: a loop's climb slows it, its fall speeds it; a conduit drives it)
    // the balance: a drift that wanders and grows with the grind, answered by A / D
    const drift = (Math.sin(this.t * 1.7 + this.seed) * 0.6 + Math.sin(this.t * 3.1 + this.seed * 2) * 0.4) * (this.R.coaster ? GRIND.drift * 0.5 : GRIND.drift + GRIND.driftGrow * this.t) * (this.style || 1); // (a coaster rail's drift never grows: it is ridden for its curves, not held for a count)
    // a bend throws the lean outward: the heading's turn over the next metre and a half of travel, times v^2 (a left turn's outside: right)
    const h0 = Math.atan2(_d.x, _d.z); this.at(Math.max(0, Math.min(this.R.len, this.s + this.dir * 1.5)), _a); const h1 = Math.atan2(_d.x, _d.z);
    const kappa = Math.atan2(Math.sin(h1 - h0), Math.cos(h1 - h0)) / 1.5;
    const held = this.pushNow > 0 || this.up.y < 0.7 || Math.hypot(_d.x, _d.z) < 0.5; // (in a loop, or steep: the conduit holds the keel, no balance to keep)
    if (!held) this.lean += (drift + Math.max(-GRIND.bendMax, Math.min(GRIND.bendMax, (kappa * this.V * this.V + g * (this.up.x * -_d.z + this.up.z * _d.x) / Math.max(0.3, this.up.y)) * GRIND.bend)) + steer * GRIND.answer * 0.5) * dt * 2; // (A / D push the lean their way, Tony Hawk's: lean right, press A; it was the other way, the owner's v198 "reversed") (the turn's pull less what the bank takes, g tan(bank): a banked curve rides itself, as on a coaster; capped: a kink where a loop rejoins is not a bend to be thrown off by)
    const step = this.V * dt; this.s += step * this.dir; this.run += step;
    const end = this.s <= 0 || this.s >= this.R.len;
    let why = hopUp ? 'hop' : end ? 'end' : Math.abs(this.lean) > 1 ? 'fell' : this.V < GRIND.stall ? 'stall' : null;
    const p = this.at(Math.max(0, Math.min(this.R.len, this.s)), _b).clone(); p.addScaledVector(this.up, GRIND.ride);
    const heading = Math.atan2(_d.x, _d.z), vel = new THREE.Vector3(_d.x, 0, _d.z).normalize().multiplyScalar(this.V);
    if (why) { this.on = false; this.why = why; this.offR = this.R; this.offUntil = (this.skiff.rideT || 0) + GRIND.relock; this.skiff.game.events?.emit('skiff.grind.end', { metres: +this.run.toFixed(1), why, by: 'courier' }); }
    if (why === 'fell') p.add(new THREE.Vector3(-vel.z, 0, vel.x).normalize().multiplyScalar(Math.sign(this.lean) * (GRIND.reach + 0.4))); // (off the side it leaned to, out of the lock's reach: (-vz, 0, vx) is the right, + lean is the right; it threw to the left, Calissa 2026-10-14)
    const flat = Math.hypot(_d.x, _d.z) || 1e-3, vel3 = vel.clone().multiplyScalar(Math.hypot(_d.x, _d.z) / flat); // (the horizontal share of the rail's speed)
    return { pos: p, vel: vel3, vy: why === 'hop' ? GRIND.pop + Math.max(0, this.V * _d.y) : why === 'fell' || why === 'stall' ? Math.min(0, this.V * _d.y) : this.V * _d.y, heading, lean: this.lean, done: !!why, metres: this.run, up: this.up, fwd: _d.clone() };
  }
}
