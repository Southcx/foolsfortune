// ---------------------------------------------------------------------------------------
// THE LOCK'S DIRECTIONS (plain name; South, 2026-11-22: "while the lock is on, the movement keys strafe the target; wire existing moves to
// the direction held relative to the target, Zelda and DMC style"; docs/plans/SONDELASS-FEEL.md 14): with the cutlass drawn and
// `game.lock.active` (courier/lockon.js, read only), the movement keys held as a press lands are read against the target, not the camera:
// toward it, away from it, or round it. Unlocked, nothing here is asked and every press plays as it did (the core movement and the string
// are the gold standard).
//
//   LOCK_DIRECTIONS   what each button does by the way held (existing moves only):
//     lmb.toward   the Stinger (cutlass.js's own lunge, DMC's lock-on + forward + attack), paid as RMB's is; refused (the pool short,
//                  cooling) the press is the string's as before
//     lmb.away     the engine's own: S + LMB is the launcher already, and with the camera on the target S is away (DMC's High Time)
//     lmb.side     a side cut that steps round the target: the cutlass's `sideR` (the Slash, Sond_Combo1) with D, `sideL` (the Rising
//                  Slash, Sond_Combo2) with A, the Courier stepped along the circle about the target (SIDE.step m/s) as it cuts
//     rmb.*        the slot RMB plays (sondelassloadout.js: tapped, with W, with S) read from the lock's way: toward the forward slot,
//                  away the back slot, round it or none the tap's (and so the spin attack's hold, spinattack.js)
//   A press is taken from the free way only (nothing playing, or a warped move past its cancel frame); in a strike it is the string's.
//
// Prior art: Devil May Cry 3 and 5's lock-on commands (lock + forward + attack the Stinger, lock + back + attack High Time), Zelda:
// Ocarina of Time's Z-targeted side jumps and jump slash (the direction read against the target), Kingdom Hearts' lock-on finishers.
//
//   LOCK_DIRECTIONS   SIDE   lockWay(g, P, inp) -> { way: 'toward' | 'away' | 'side' | null, sign (+1 D's side, -1 A's), at (the target) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const LOCK_DIRECTIONS = {
  lmb: { toward: 'stinger', away: null, side: { right: 'sideR', left: 'sideL' } }, // (away: the engine's S + LMB launcher, untouched)
  rmb: { toward: 'forward', away: 'back', side: 'tap', none: 'tap' },
};
/** step: m/s along the circle about the target as a side cut begins; turn: the share of a key's push that must be toward or away (cos). */
export const SIDE = { step: 5.5, turn: 0.5 };
const _f = new THREE.Vector3(), _t = new THREE.Vector3(), _m = new THREE.Vector3();

/** The way the movement keys are held against the lock's target: null unlocked or with none held. */
export function lockWay(g, P, inp) {
  if (!g.lock?.active || !g.lock.point(_t)) return null;
  const fw = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0), rt = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
  if (!fw && !rt) return { way: null, sign: 0, at: _t };
  P.lookDir(_f); _f.y = 0; if (_f.lengthSq() < 1e-6) return { way: null, sign: 0, at: _t }; _f.normalize();
  _m.set(_f.x * fw - _f.z * rt, 0, _f.z * fw + _f.x * rt).normalize(); // (the camera's forward and right, the keys' push in the world)
  const tx = _t.x - P.pos.x, tz = _t.z - P.pos.z, d = Math.hypot(tx, tz) || 1, along = (_m.x * tx + _m.z * tz) / d, side = (_m.z * tx - _m.x * tz) / d; // (side > 0: to the target's right as they face it)
  if (along > SIDE.turn) return { way: 'toward', sign: 0, at: _t };
  if (along < -SIDE.turn) return { way: 'away', sign: 0, at: _t };
  return { way: 'side', sign: side > 0 ? 1 : -1, at: _t };
}
