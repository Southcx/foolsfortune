// ---------------------------------------------------------------------------------------
// TAP TO GO (docs/plans/MOBILE.md 8.2): the Pneuka Jar sent to a point on its planetoid. A phone held upright has no left thumb free for a
// stick, so in the Spirit Garden a tap on the ground with no art up (the art bar's WALK) sends the Jar there: it hops toward the point
// along the ground until it stands within TAP_GO.there of it, the way it hops for W A S D (the hop itself unchanged). Any key or stick
// push, the Jar picked up, or the Jar on another planetoid lets the target go. The rule is here; who sets the point is the touch
// driver's (Petra's), through `realm.goTo(point)`.
//
// Prior art: Animal Crossing Pocket Camp and Stardew Valley mobile (tap the ground to walk there); Diablo's click-to-move.
//
//   TAP_GO { there, giveUp }   goWish(J, T, out) -> out (a unit wish along the ground, or zero when there)   realm.goTo(point | null)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** there: metres from the point the Jar stops; giveUp: real seconds after which an unreached point is let go (a wall, a thorn ring). */
export const TAP_GO = { there: 0.8, giveUp: 12 };

const _u = new THREE.Vector3();
/** The Jar's wish toward its target `T` ({ planet, point, t }), along the ground of its planetoid; zero when there. */
export function goWish(J, T, out) {
  _u.copy(J.pos).sub(J.planet.c).normalize();
  out.copy(T.point).sub(J.pos); out.addScaledVector(_u, -out.dot(_u));
  return out.length() < TAP_GO.there ? out.set(0, 0, 0) : out.normalize();
}
