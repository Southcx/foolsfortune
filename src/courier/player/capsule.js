// ---------------------------------------------------------------------------------------
// THE COURIER'S CAPSULE AND POSTURE (part of courier/player.js): the capsule the body stands in, in the four shapes it takes (standing
// 1.7 m, low 1.35 m for the crouch and the slide, the blob 0.7 m a tech squeezes through gaps in, prone 0.8 m on the belly), whether one
// fits with the feet at a point (`fits`, `canStand`), whether the body is inside level geometry (`embedded`: the question the rescue and
// the move ask; `embeddedBy`: by what, for the stress test's report), and the posture C chose: stand, crouch or prone, the shape
// following where it fits, getting down onto the belly and up from it taking the crawl's enter and exit clips' time. On the belly the
// body reaches past the capsule (anim/crawl.js CRAWL.outline), so `crawlReach` takes out of a move whatever of it goes into a wall the
// body would meet before the capsule does. It emits move.posture, through the Player's `ev`.
//
// Prior art: Rapier's kinematic character controller (the capsule it moves) and Fauerby's collide-and-slide (Improved Collision
// Detection and Response, 2003), here on the body's outline for the crawl; both as courier/player.js.
//
//   HALF  RADIUS  HALVES (the half heights by shape)   setShape(P, kind)   canStand(P)   fits(P, p, low)   embedded(P)   embeddedBy(P)
//   setPosture(P, to)   cyclePosture(P, locked)   crawlReach(P, hv)     (P: the Player, which has a method of each name that calls these)
// ---------------------------------------------------------------------------------------
import { RAPIER, GROUPS } from '../../core/physics.js';
import { T } from '../../core/config.js';
import { CRAWL } from '../anim/crawl.js';

const _crRay = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), notSensor = (c) => !c.isSensor(); // (the crawl's reach probe: crawlReach)
export const HALF = 0.55, RADIUS = 0.3; // standing capsule: 1.7 m tall
const LOW_HALF = 0.375; // crouched / sliding: 1.35 m (the posed body, hair included, fits under 1.5 m)
const BLOB_HALF = 0.05; // slip form (a tech): 0.7 m, through gaps nothing else fits
const PRONE_HALF = 0.13; // flat on the belly: 0.8 m (the belly crawl's posed top 0.74 m, hair included: courier/anim/crawl.js)
export const HALVES = { stand: HALF, low: LOW_HALF, blob: BLOB_HALF, prone: PRONE_HALF };
const STAND_SHAPE = new RAPIER.Capsule(HALF, RADIUS - 0.02);
const LOW_SHAPE = new RAPIER.Capsule(LOW_HALF, RADIUS - 0.03);
const BLOB_SHAPE = new RAPIER.Capsule(BLOB_HALF, RADIUS - 0.03);
const PRONE_SHAPE = new RAPIER.Capsule(PRONE_HALF, RADIUS - 0.03);
const SHAPES = { stand: STAND_SHAPE, low: LOW_SHAPE, blob: BLOB_SHAPE, prone: PRONE_SHAPE };
// "is the body actually inside something?": the shapes shrunk enough that skin and float noise never count
const EMBED = { stand: new RAPIER.Capsule(HALF - 0.05, RADIUS - 0.08), low: new RAPIER.Capsule(LOW_HALF - 0.05, RADIUS - 0.08), blob: new RAPIER.Capsule(0.001, RADIUS - 0.08), prone: new RAPIER.Capsule(Math.max(0.001, PRONE_HALF - 0.05), RADIUS - 0.08) };
const QF = RAPIER.QueryFilterFlags;
// getting down onto the belly (s): Loco_CrawlEnter's 0.67 from standing, from its 0.2 out of the crouch (CRAWL.enterFrom); getting up is
// the exit clip's, to the crouch or to standing (CRAWL.exitTo). The body is held still while it plays and keeps the prone shape rising.
const PRONE_DOWN = { stand: 0.67, crouch: 0.67 - CRAWL.enterFrom.crouch };
/** How far the body on the belly reaches from the capsule's axis along a direction `a` from its facing (radians): the crawl's outline
 *  (anim/crawl.js CRAWL.outline, the farthest vertex every 15 degrees, left and right alike) as half-planes, the distance to their
 *  boundary along the ray. The capsule is upright and RADIUS round, so the body stands out past it by this less RADIUS. */
const CRAWL_REACH = (() => {
  const O = CRAWL.outline, n = (O.length - 1) * 2, steps = 72, out = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2; let r = 9;
    for (let k = 0; k < n; k++) { const t = (k / n) * Math.PI * 2, c = Math.sin(a) * Math.sin(t) + Math.cos(a) * Math.cos(t); if (c > 0.1) r = Math.min(r, O[Math.min(k, n - k)] / c); }
    out[i] = r;
  }
  return (a) => out[((Math.round((a / (Math.PI * 2)) * steps) % steps) + steps) % steps];
})();

export function setShape(P, kind) {
  if (kind === P.shape) return;
  P.shape = kind;
  P.low = kind !== 'stand';
  const half = HALVES[kind];
  P.collider.setHalfHeight(half);
  P.collider.setTranslationWrtParent({ x: 0, y: half + RADIUS, z: 0 });
  // CROSSING (Calissa, 2026-10-11, the crouch jump): Rapier moves a parented collider to its new offset only in world.step, so the
  // controller asked in this step judged the new capsule from the old one's centre: grown in the air the step after a jump from the
  // crouch toggle, it sat 0.175 m low, in the floor, read as grounded, and the jump ended 0.20 m up (casebook 199)
  P.collider.setTranslation({ x: P.pos.x, y: P.pos.y + half + RADIUS, z: P.pos.z });
}

export function canStand(P) { return P.fits(P.pos, false); }

/** On the belly, the body reaches past the capsule (0.95 m ahead of its axis, 1.23 m behind: CRAWL_REACH), so against a wall the head
 *  has met the capsule would crawl on and the crawl's clearance slide the body back, the clip cycling in place (Calissa's prone note).
 *  A ray along the move just over the step height (a step the capsule climbs is never a wall to it), as long as the body reaches
 *  that way: a wall inside it takes the move into it away,
 *  and the move along it is kept. A collide-and-slide on the body's outline instead of the capsule's (Fauerby's, 2003). */
export function crawlReach(P, hv) {
  const sp = Math.hypot(hv.x, hv.z); if (sp < 1e-3 || !P.physics) return;
  const dx = hv.x / sp, dz = hv.z / sp, reach = CRAWL_REACH(Math.atan2(dx, dz) - P.bodyYaw);
  const R = _crRay, W = P.physics.world; if (!W || !Number.isFinite(P.pos.x + P.pos.y + P.pos.z)) return;
  R.origin.x = P.pos.x; R.origin.y = P.pos.y + T.movement.stepHeight + 0.02; R.origin.z = P.pos.z; R.dir.x = dx; R.dir.y = 0; R.dir.z = dz; // (a kept ray: nothing made a frame)
  const hit = W.castRayAndGetNormal(R, reach + CRAWL.margin, true, undefined, GROUPS.controllerQuery, P.collider, undefined, notSensor);
  if (!hit) return;
  const n = hit.normal, nl = Math.hypot(n.x, n.z); if (nl < 0.5) return; // (a slope or a ceiling: the capsule's own business)
  const nx = n.x / nl, nz = n.z / nl, into = hv.x * nx + hv.z * nz;
  if (into < 0) { hv.x -= into * nx; hv.z -= into * nz; }
}

/** The posture C chose: stand, crouch or prone (the shape follows where it fits). Getting down onto the belly and up from it takes the
 *  crawl's enter and exit clips' time, the body held still meanwhile. */
export function setPosture(P, to) {
  const from = P.posture;
  if (to === from) return;
  P.posture = to;
  if (to === 'prone') P.postureT = from === 'crouch' ? PRONE_DOWN.crouch : PRONE_DOWN.stand;
  else if (from === 'prone') P.postureT = to === 'stand' ? CRAWL.exitTo.stand : CRAWL.exitTo.crouch;
  P.ev('move.posture', { from, to });
}

/** C on the ground: stand to crouch to prone to stand (as far up as there is room). In a fight on the line, the crouch is the brace:
 *  stand and crouch only. */
export function cyclePosture(P, locked) {
  const p = P.posture;
  if (p === 'stand') P.setPosture('crouch');
  else if (p === 'crouch') P.setPosture(locked ? (P.canStand() ? 'stand' : 'crouch') : 'prone');
  else P.setPosture(P.canStand() ? 'stand' : P.fits(P.pos, 'low') ? 'crouch' : 'prone');
}

/** Would the capsule (standing, low or blob) fit with its feet at p? Loose props don't count. */
export function fits(P, p, low) {
  const kind = low === true ? 'low' : low === false || low === undefined ? 'stand' : low;
  const half = HALVES[kind];
  return !P.physics.world.intersectionWithShape(
    { x: p.x, y: p.y + half + RADIUS + 0.03, z: p.z }, { x: 0, y: 0, z: 0, w: 1 }, SHAPES[kind],
    QF.EXCLUDE_SENSORS | QF.EXCLUDE_DYNAMIC, GROUPS.controllerQuery, P.collider);
}

/** What the body is inside (for the stress test's report). */
export function embeddedBy(P) {
  const half = HALVES[P.shape], out = [];
  P.physics.world.intersectionsWithShape({ x: P.pos.x, y: P.pos.y + half + RADIUS, z: P.pos.z }, { x: 0, y: 0, z: 0, w: 1 },
    EMBED[P.shape], (c) => { const t = c.translation(), e = P.physics.entityOf(c); out.push({ ent: e?.type || 'static', at: [t.x, t.y, t.z].map((v) => +v.toFixed(2)), half: c.halfExtents?.() ? [c.halfExtents().x, c.halfExtents().y, c.halfExtents().z].map((v) => +v.toFixed(2)) : null }); return true; },
    QF.EXCLUDE_SENSORS | QF.EXCLUDE_DYNAMIC, GROUPS.controllerQuery, P.collider);
  return out;
}

/** Is the body inside level geometry (not merely touching it)? */
export function embedded(P) {
  const half = HALVES[P.shape];
  return !!P.physics.world.intersectionWithShape({ x: P.pos.x, y: P.pos.y + half + RADIUS, z: P.pos.z }, { x: 0, y: 0, z: 0, w: 1 },
    EMBED[P.shape], QF.EXCLUDE_SENSORS | QF.EXCLUDE_DYNAMIC, GROUPS.controllerQuery, P.collider);
}
