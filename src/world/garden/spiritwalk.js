// ---------------------------------------------------------------------------------------
// THE SPIRITS' WALK: where a bound spirit heads on its planetoid, from its routine (docs/plans/GARDEN-COZY.md C1; the rule is
// progress/spiritlife.js routineOf; built by Dovina on Petra's hand-over, 2026-10-22). Each time a spirit picks a new step, it keeps its
// routine as often as its grain allows (`stay`): it walks toward the nearest of its place on the planetoid it stands on (a placed pond, a
// lantern, a spirit house, a planter or a bed, the cocoon tree) and idles there once arrived. Otherwise, or when its planetoid has no such
// place, it wanders as it always did (still a third of the time, otherwise a random step). It never crosses to another planetoid: a routine
// is lived where the spirit is. The draws are the realm's own seeded stream, so a run walks the same twice.
//
// Prior art: Harvest Moon: A Wonderful Life's villagers on their schedules, Animal Crossing's residents keeping their haunts by hour and
// weather, the Chao Garden's wandering Chao.
//
//   walkWish(realm, s, rnd, out) -> out (the spirit's wish: a world direction, length 0 .. WALK.speed)   WALK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { routineOf } from '../../progress/spiritlife.js';
import { phaseAt } from '../../progress/weather.js';

/** The walk's numbers: its pace (the old wander's), how near counts as arrived (metres), the share of idle steps when wandering. */
export const WALK = { speed: 0.7, there: 1.6, idle: 0.35, rain: 0.1 };
/** A place in the routine, as what stands in the garden: a placed feature by its id, or a site's fixed thing by its kind. */
const STANDS = { pond: { feature: 'pond' }, lantern: { feature: 'lantern' }, spiritHouse: { feature: 'spiritHouse' }, terrace: { feature: 'terrace', site: 'bed' }, tree: { site: 'cocoon' } };
const _d = new THREE.Vector3(), _u = new THREE.Vector3();

/** The nearest of a routine's place on a planetoid, or null. */
function nearestPlace(realm, P, place, from) {
  const S = STANDS[place]; if (!S) return null;
  let best = null, bd = Infinity;
  const look = (pos) => { const d = pos.distanceToSquared(from); if (d < bd) { bd = d; best = pos; } };
  if (S.feature) for (const p of realm.plots?.plots || []) if (p.planet === P && p.placed?.feature === S.feature && p.pos) look(p.pos);
  if (S.site) for (const f of realm.site?.features || []) if (f.planet === P && f.kind === S.site && f.pos) look(f.pos);
  return best;
}

/** A spirit's next step: toward its routine's place, or a wander. */
export function walkWish(realm, s, rnd, out) {
  const e = s.e || {}, sheet = e.sp || {}, grain = e.traits || {}, P = s.body?.planet, pos = s.body?.pos;
  const { place, stay } = routineOf(sheet, grain, { phase: phaseAt(), raining: (realm.waterworks?.rain?.() || 0) > WALK.rain });
  const target = P && pos && place !== 'free' && rnd() < stay ? nearestPlace(realm, P, place, pos) : null;
  if (target) {
    _u.copy(pos).sub(P.c).normalize(); _d.copy(target).sub(pos); _d.addScaledVector(_u, -_d.dot(_u));
    return _d.length() < WALK.there ? out.set(0, 0, 0) : out.copy(_d.normalize().multiplyScalar(WALK.speed));
  }
  if (rnd() < WALK.idle) return out.set(0, 0, 0);
  return out.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(WALK.speed);
}
