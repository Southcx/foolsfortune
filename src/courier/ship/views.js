// ---------------------------------------------------------------------------------------
// THE VIEWS: the crossing's five cameras, and the swing between them (docs/plans/RAIL.md sections 3 and 8; progress/rail/crossing.js
// says which view holds in which act). Each view is a camera rig over the rail, the PLANE the ship moves in under it, and how the gun
// aims in it. A SWING takes one bar, eased in and out, and the input plane turns at its midpoint; the ship keeps its world place, so
// nothing snaps and nothing surprises the thumbs.
//
//   chase   behind the ship, above it, following a share of its offset (Star Fox 64: the box the camera only half follows)
//   above   straight down the sea, the scroll toward the top of the screen (Ikaruga, Mushihime-sama: position is aim)
//   side    abeam, the scroll toward the right (Einhander, R-Type: the 2.5D duel)
//   free    behind and lower, a wider look; the reticle loose over the whole screen (Sin & Punishment: things come at the camera)
//   astern  ahead of the ship, looking back the way it came (Panzer Dragoon's look round)
//
// The rail's frame is F (along the crossing), R (the screen's right in the chase view), U (up). The ship's place in it is (x, y, z):
// across, up, along. Each plane moves two of those under WASD and pins the third (screen: x and y, z at the boost's place; sea: x and z
// at a cruise height; wall: z and y, x on the rail).
//
// Prior art: Star Fox 64's camera box, Einhander's mid-stage swing from side to behind, Ikaruga's vertical scroll, Sin & Punishment's
// free reticle, Panzer Dragoon's look back; the swing eased as Squirrel Eiserloh's "Juicing Your Cameras With Math" (GDC 2016) asks.
//
//   VIEW_RIGS[id]   rig(id, Q, ship, out) -> { pos, look }   blendRig(a, b, k, Q, ship, out)   planeOf(id)   axes(id) -> input mapping
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { VIEWS } from '../../progress/rail/crossing.js';

/** The rail's frame (a straight crossing along +Z: R is the chase view's screen right). */
export const F = new THREE.Vector3(0, 0, 1), R = new THREE.Vector3(-1, 0, 0), U = new THREE.Vector3(0, 1, 0);

/** The height the ship rests at over the rail (the sea plane holds it here): the rigs' heights are measured from it. */
export const CRUISE = 3;
/** Each view's camera, as offsets in the rail frame from the ship's rest (Q, CRUISE up), plus how much of the ship's own offset it
 *  follows. The side camera stands on the ship's right (+x), so the scroll runs toward the screen's right (Einhander, R-Type). */
export const VIEW_RIGS = {
  chase:  { cam: [0, 2.2, -7.5], look: [0, 1.0, 20], follow: 0.35, fov: 0 },
  above:  { cam: [0, 30, -9], look: [0, 0, 7], follow: 0.12, fov: -4 },
  side:   { cam: [24, 1.5, 3], look: [0, 0.5, 3], follow: 0.1, fov: -6 },
  free:   { cam: [0, 1.6, -10], look: [0, 1.2, 30], follow: 0.25, fov: 8 },
  astern: { cam: [0, 2.6, 9], look: [0, 0.6, -24], follow: 0.35, fov: 4 },
};

/** Which plane the ship moves in under a view. */
export const planeOf = (id) => VIEWS[id]?.plane || 'screen';

/** How the keys map onto the ship's (x, y, z) in a view: [axis for D-A, axis for W-S], each { k: 'x' | 'y' | 'z', s: sign }. */
export function axes(id) {
  switch (planeOf(id)) {
    case 'sea': return [{ k: 'x', s: 1 }, { k: 'z', s: 1 }]; // (from above: up the screen is ahead)
    case 'wall': return [{ k: 'z', s: 1 }, { k: 'y', s: 1 }]; // (abeam: right is ahead)
    default: return id === 'astern' ? [{ k: 'x', s: -1 }, { k: 'y', s: 1 }] : [{ k: 'x', s: 1 }, { k: 'y', s: 1 }]; // (astern, the screen is mirrored)
  }
}

/** A point in the rail frame, from Q. */
export const local = (Q, x, y, z, out) => out.copy(Q).addScaledVector(R, x).addScaledVector(U, y).addScaledVector(F, z);

/** One view's camera now: where it stands and what it looks at, following a share of the ship's offset (ship: { x, y, z }). */
export function rig(id, Q, ship, out = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 }) {
  const V = VIEW_RIGS[id] || VIEW_RIGS.chase, f = V.follow;
  const sx = ship.x * f, sy = CRUISE + (ship.y - CRUISE) * f, sz = ship.z * f;
  local(Q, V.cam[0] + sx, V.cam[1] + sy, V.cam[2] + sz, out.pos);
  local(Q, V.look[0] + sx, V.look[1] + sy, V.look[2] + sz, out.look);
  out.fov = V.fov;
  return out;
}

const _a = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 }, _b = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 };
/** Two views blended (a swing): k 0..1, eased in and out; the look is blended too, so the turn is one smooth arc. */
export function blendRig(a, b, k, Q, ship, out) {
  const e = k * k * (3 - 2 * k);
  rig(a, Q, ship, _a); rig(b, Q, ship, _b);
  out.pos.lerpVectors(_a.pos, _b.pos, e);
  out.look.lerpVectors(_a.look, _b.look, e);
  out.fov = _a.fov + (_b.fov - _a.fov) * e;
  return out;
}

/** Where the gun fires in a scroll view (above, side): along the crossing, from the ship. */
export const scrollAim = (out) => out.copy(F);
