// ---------------------------------------------------------------------------------------
// A CLEAR SHOT: a scripted camera (the death, the Lockheart's opening) is set where it looks best, and the room may be in the way. Ask
// here with what it looks at and where it wants to be: if a wall, a floor or anything fixed lies between, the camera comes in to just
// short of it, so a shot never shows the inside of a wall. Loose things (pots, crates) and sensors do not count.
//
// Prior art: the third-person camera's spring arm (Unreal's: pulled in to the first hit along the line to the target), applied to a
// cinematic shot as Ocarina of Time's cutscene cameras were nudged out of geometry.
//
//   clearShot(game, target, want, out = want, margin = 0.25) -> out
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _d = new THREE.Vector3();
export function clearShot(game, target, want, out = want, margin = 0.25) {
  const ph = game.physics;
  _d.subVectors(want, target);
  const len = _d.length();
  if (!ph || len < 0.05) return out.copy(want);
  _d.divideScalar(len);
  const hit = ph.raycast(target, _d, len, game.player?.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
  if (!hit) return out.copy(want);
  return out.copy(target).addScaledVector(_d, Math.max(0.3, hit.distance - margin));
}
