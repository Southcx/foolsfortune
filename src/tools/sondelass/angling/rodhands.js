// ---------------------------------------------------------------------------------------
// THE ROD'S HANDS: what the keys do to the rod (docs/plans/ANGLING.md 1, "the hands are the rod"), and how far the rod bends under
// its load (2, "the rod bends with the load"). Rooted once a fish bites, the movement keys are the rod's tip:
//
//   A / D  swings left / right (side pressure)          S  pulls back; held BRACE_HOLD real s, it braces too
//   W      drops (a bow)                                LMB reels · RMB gives line · Shift + LMB cranks (fight.js CRANK)
//   S, then W + LMB: the pump (fight.js PUMP)
//
// Before a bite, Shift + LMB is the fast retrieve (FAST_RETRIEVE x the reel's REEL_SPEED). The rod owns the keys only while a fish is
// on (Angler.locksMove, read by the core through the Sondelass's moveLock); landed, lost or cut, they are the body's again, untouched:
// nothing here writes to the body. What happens is told on the bus: angle.brace, angle.crank, angle.retrieve.fast (by: 'courier').
//
// The bend: straight at no load, about 30 degrees in the sweet band, about 70 and shuddering at the snap's edge (1.0), as Sega Bass
// Fishing's rod, the whole readout; the angle is the model's total along its sections (model.js setBend).
//
//   const h = new RodHands(emit)   h.fight(dt, inp, reel) -> { lean, haul, ease, brace, crank }   h.retrieve(reeling, inp) -> m/s
//   h.reset()   rodBend(tension, time) -> radians
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** S held this long (real s) braces as well as hauling. */
export const BRACE_HOLD = 0.3;
/** The plain retrieve (m/s), and Shift's multiple of it before a bite (Dovina's: 10.8 m/s). */
export const REEL_SPEED = 3.6, FAST_RETRIEVE = 3;
/** The rod's bend (degrees, its total): in the band (at BEND.bandT) and at the snap's edge (1.0); its shudder from shudderT. */
export const BEND = { band: 30, bandT: 0.56, edge: 70, max: 76, shudderT: 0.85, shudder: 4, hz: 23 };

const shift = (inp) => inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
const sm = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** How far the rod bends (radians, its total) under a tension of 0..1.3, shuddering near the snap at time `t` (real s). */
export function rodBend(T, t = 0) {
  const x = Math.max(0, T);
  const deg = x <= BEND.bandT ? BEND.band * sm(0, 1, x / BEND.bandT) ** 0.8 : Math.min(BEND.max, BEND.band + (BEND.edge - BEND.band) * (x - BEND.bandT) / (1 - BEND.bandT));
  const shudder = sm(BEND.shudderT, 1, x) * BEND.shudder * (Math.sin(t * BEND.hz * 6.283) * 0.7 + Math.sin(t * BEND.hz * 1.7 * 6.283) * 0.3);
  return THREE.MathUtils.degToRad(deg + shudder);
}

export class RodHands {
  constructor(emit) { this.emit = emit; this.reset(); }
  reset() { this.sT = 0; this.bracing = false; this.cranking = false; this.fast = false; }

  /** The keys as the rod's, a fish on. */
  fight(dt, inp, reel) {
    const kd = (c) => inp.isDown(c);
    const haul = kd('KeyS');
    this.sT = haul ? this.sT + dt : 0;
    const brace = this.sT >= BRACE_HOLD;
    if (brace && !this.bracing) this.emit('angle.brace', { by: 'courier' });
    this.bracing = brace;
    const crank = !!reel && shift(inp);
    if (crank && !this.cranking) this.emit('angle.crank', { by: 'courier' });
    this.cranking = crank;
    return { lean: (kd('KeyD') ? 1 : 0) - (kd('KeyA') ? 1 : 0), haul, ease: kd('KeyW'), brace, crank };
  }

  /** The retrieve's speed (m/s) before a bite: Shift with LMB is the fast one. */
  retrieve(reeling, inp) {
    const fast = !!reeling && shift(inp);
    if (fast && !this.fast) this.emit('angle.retrieve.fast', { by: 'courier' });
    this.fast = fast;
    return REEL_SPEED * (fast ? FAST_RETRIEVE : 1);
  }
}
