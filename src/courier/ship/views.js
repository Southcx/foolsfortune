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
//   VIEW_RIGS[id]   rig(id, Q | rail, ship, out) -> { pos, look }   blendRig(a, b, k, Q, ship, out)   planeOf(id)   axes(id) -> input mapping
//   reachOf(id, aspect, fov) -> { x, y, z } (the ship's reach in a view, sized from its camera)
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
const _l = new THREE.Vector3();
export const local = (Q, x, y, z, out) => (Q.toWorld ? Q.toWorld(_l.set(x, y, z), out) : out.copy(Q).addScaledVector(R, x).addScaledVector(U, y).addScaledVector(F, z)); // (Q: the rail itself, its frame turned, or a bare point on a straight one)

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

/** How far the ship may go in a view's plane and stay inside `reach` of the screen (1 is its edge; 0.84 is the frame less an 8% margin,
 *  RAIL-MODULES.md 1.1), with that view's camera at rest following its share of the ship: { x, y, z } as [lo, hi] in the rail frame for
 *  the axes the plane moves (y: only its top; the sea's surface is its floor), null for the axis it pins. Searched rather than solved,
 *  since the camera follows the ship: each way stepped out by halving (20 steps), once a view, aspect and fov (cached). The old box was
 *  one box for every view, 7 m whatever the camera's distance: the ship reached a fifth of the screen in the above view (the owner's
 *  "limited range of motion"; Calissa's measure, docs/plans/research/RAIL-BUGS-MEASURED.md). Prior art: Ikaruga's and every vertical
 *  shmup's playfield, the screen itself; Star Fox 64's box the camera only half follows. */
const REACHES = new Map(), _cam = new THREE.PerspectiveCamera(), _o0 = new THREE.Vector3(), _p = new THREE.Vector3(), _rg = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0 };
const MOVES = { screen: [['x', -1], ['x', 1], ['y', 1]], sea: [['x', -1], ['x', 1], ['z', -1], ['z', 1]], wall: [['z', -1], ['z', 1], ['y', 1]] };
export function reachOf(id, aspect, fov = 70, reach = 0.84) {
  const key = `${id}|${aspect.toFixed(3)}|${fov}|${reach}`;
  if (REACHES.has(key)) return REACHES.get(key);
  const V = VIEW_RIGS[id] || VIEW_RIGS.chase, rest = { x: 0, y: CRUISE, z: 0 }, out = { x: null, y: null, z: null };
  _cam.fov = fov + V.fov; _cam.aspect = aspect; _cam.near = 0.1; _cam.far = 2000; _cam.updateProjectionMatrix();
  const inside = (s) => { // (the ship at s, the camera rigged for it: is it on the screen within reach?)
    rig(id, _o0, s, _rg); _cam.position.copy(_rg.pos); _cam.up.copy(U); _cam.lookAt(_rg.look); _cam.updateMatrixWorld();
    local(_o0, s.x, s.y, s.z, _p).project(_cam);
    return _p.z < 1 && Math.abs(_p.x) <= reach && Math.abs(_p.y) <= reach;
  };
  const moves = MOVES[planeOf(id)] || MOVES.screen;
  for (let pass = 0; pass < 2; pass++) for (const [k, sgn] of moves) { // (the second pass at the other axis's ends: a corner stays inside too)
    const other = moves.find(([j]) => j !== k)[0], ends = pass && out[other] ? out[other] : [rest[other]];
    const ok = (m) => ends.every((e) => inside({ ...rest, [other]: e, [k]: rest[k] + sgn * m }));
    let lo = 0, hi = pass ? Math.abs((out[k]?.[sgn < 0 ? 0 : 1] ?? rest[k]) - rest[k]) : 160;
    if (!ok(0)) hi = 0;
    for (let i = 0; i < 20 && hi > 0; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    if (pass && hi > 0 && ok(hi)) lo = hi;
    const r = (out[k] ||= [rest[k], rest[k]]); r[sgn < 0 ? 0 : 1] = rest[k] + sgn * lo;
  }
  REACHES.set(key, out);
  return out;
}
