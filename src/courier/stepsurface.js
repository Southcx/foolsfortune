// ---------------------------------------------------------------------------------------
// A STEP'S SURFACE (Wanda's ask, 2026-10-30; `move.step { surface, speed, by }`, heard by audio/moves.js STEP): what the Courier's foot
// lands on, read at each heel strike. The first that answers says it:
//   water         the foot under a liquid's surface (game.water: a pond, the Weir's pools, the Great Dunemaw's rim shallows)
//   paint, crude  the paint map's cell under the foot wet enough to show (world/ground/paintmap.js `at`)
//   grate         a grating's collider (game.rigging.grates: the rig wing's)
//   the thing     a thing underfoot by what it is made of (core/tags.js): crystal reads lachrymite, then wood, stone, metal, clay
//   the floor     the zone's own (render/zonemap.js ZONE_SOUND: the Throwing Room's planks, the Dunes' sand, the bazaar's mosaic), else clay
// One downward ray a step, at most twelve a real second (the sound bank's own limit): nothing is read between steps.
//
// Prior art: Source's surface properties (a material's footstep sounds, `$surfaceprop`), Unreal's physical materials, Unity's terrain
// footsteps by splat weight: the sound asks the ground what it is, and the ground never plays a sound of its own.
//
//   surfaceUnder(game, pos, collider?) -> one of STEP_SURFACES      stepSpeed(game) -> 0 (a walk) .. 1 (a sprint)
// ---------------------------------------------------------------------------------------
import { GROUPS } from '../core/physics.js';
import { hasTag } from '../core/tags.js';
import { T } from '../core/config.js';
import { zoneOf, ZONE_SOUND } from '../render/zonemap.js';

/** Every surface a step can be heard on (Wanda's list with her two additions, 2026-10-30). */
export const STEP_SURFACES = ['clay', 'stone', 'sand', 'wood', 'metal', 'grate', 'water', 'paint', 'crude', 'grass', 'lachrymite'];
/** What a thing is made of (its tag), as a surface: the first it carries. */
const MADE_OF = [['crystal', 'lachrymite'], ['wood', 'wood'], ['stone', 'stone'], ['metal', 'metal'], ['clay', 'clay']];
const DOWN = { x: 0, y: -1, z: 0 };

export function surfaceUnder(game, pos, collider) {
  const w = game.water?.at?.(pos.x, pos.y + 0.3, pos.z);
  if (w && pos.y < w.surface) return 'water';
  const paint = game.paintmap?.at?.(pos.x, pos.y, pos.z);
  if (paint) return paint.crude ? 'crude' : 'paint';
  const hit = game.physics?.raycast({ x: pos.x, y: pos.y + 0.15, z: pos.z }, DOWN, 0.5, collider, GROUPS.controllerQuery, (c) => !c.isSensor());
  if (hit) {
    if (game.rigging?.grates?.has?.(hit.collider.handle)) return 'grate';
    for (const [tag, surface] of MADE_OF) if (hasTag(hit.entity, tag)) return surface;
  }
  return ZONE_SOUND[zoneOf(pos)]?.floor ?? 'clay';
}

/** How hard the step lands, 0 a walk .. 1 a sprint, from the ground speed. */
export function stepSpeed(game) {
  const v = game.player?.vel, M = T.movement; if (!v) return 0.4;
  const h = Math.hypot(v.x, v.z), lo = M.crouchSpeed, hi = M.sprintSpeed;
  return Math.max(0, Math.min(1, (h - lo) / (hi - lo)));
}
