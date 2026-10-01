// ---------------------------------------------------------------------------------------
// PHOTOGRAPHS: what a shutter of the Veritome makes of the view. Every subject in the frame (subjects.js) is found, checked for being
// seen (not behind a wall), and scored the way Pokémon Snap scores a photograph: SIZE (how much of the frame it fills: a subject is best
// at a third to two thirds of the frame's height), POSE (what it is doing: a clapperjar in the air, dancing, mending), TECHNIQUE (how
// near the middle it is, and whether it faces the lens) and a bonus for more than one of the same kind. The best subject's score sets
// the stars (one to four). Two kinds of photograph have no subject: the open sky, and the sun.
//
// Prior art: Pokémon Snap (size, pose and technique, the same-species bonus, the report after each shot), Dead Rising's PP for a
// photograph by its genre, and Fatal Frame's camera, whose shot is better the nearer and the more centred the subject is.
//
//   scorePhoto(game, camera) -> { subjects: [...], best, stars, kinds, sky, sun }     (best: { kind, ref, score, stars, states })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SUBJECTS } from './subjects.js';

const POSE = { air: 60, dance: 50, mend: 40, nap: 30, stunned: 20, greed: 20, raider: 30, celebrate: 30, heavy: 30, light: 30, still: 30, bounce: 30, ember: 30, gold: 20 };
const _v = new THREE.Vector3(), _f = new THREE.Vector3();

export const starsOf = (score) => (score >= 230 ? 4 : score >= 170 ? 3 : score >= 110 ? 2 : 1);

export function scorePhoto(game, camera, { maxDist = 45 } = {}) {
  camera.updateMatrixWorld();
  const eye = camera.getWorldPosition(new THREE.Vector3()), fwd = camera.getWorldDirection(new THREE.Vector3());
  const tanH = Math.tan((camera.fov * Math.PI) / 360);
  const P = game.player;
  const out = [];
  for (const [kind, S] of Object.entries(SUBJECTS)) {
    let list;
    try { list = S.find(game); } catch { list = []; }
    for (const s of list) {
      _v.copy(s.pos).sub(eye);
      const z = _v.dot(fwd);
      if (z < 0.4 || z > maxDist) continue;
      const ndc = s.pos.clone().project(camera);
      if (Math.abs(ndc.x) > 0.95 || Math.abs(ndc.y) > 0.95) continue;
      // seen: nothing solid between the lens and it (or what is between is the thing itself)
      const d = _v.length();
      const hit = game.physics.raycast(eye, _f.copy(_v).divideScalar(d), d, P.collider, undefined, (c) => !c.isSensor());
      if (hit && hit.distance < d - s.r * 1.3 && hit.entity !== s.ref) continue;
      const frac = s.r / (z * tanH); // (its height as a share of the frame's)
      const size = frac < 0.33 ? frac / 0.33 : frac > 0.85 ? Math.max(0.3, 1 - (frac - 0.85) * 2) : 1;
      const centre = 1 - Math.min(1, Math.hypot(ndc.x, ndc.y) / 0.9);
      const facing = s.facing ? Math.max(0, s.facing.dot(_f.copy(eye).sub(s.pos).setY(0).normalize())) : 0.5;
      let pose = 0;
      for (const st of s.states) pose = Math.max(pose, POSE[st] || 0);
      if (s.from === 'below' && fwd.y < 0.2) pose -= 60; // (a tower is taken from its foot, looking up)
      out.push({ kind, ref: s.ref, states: s.states, size, centre, facing, pose, z, frac, ndc: { x: ndc.x, y: ndc.y }, score: 0 });
    }
  }
  const counts = {};
  for (const s of out) counts[s.kind] = (counts[s.kind] || 0) + 1;
  for (const s of out) {
    s.score = Math.round(100 * s.size + 50 * s.centre + 50 * s.facing + s.pose + Math.min(60, 20 * (counts[s.kind] - 1)));
    s.stars = starsOf(s.score);
  }
  out.sort((a, b) => b.score - a.score);
  // the subjectless photographs: the open sky (looking up, nothing in the way), the sun (in the dunes, the lens on it)
  const skyHit = game.physics.raycast(eye, fwd, 80, P.collider, undefined, (c) => !c.isSensor());
  const sky = !out.length && fwd.y > 0.45 && !skyHit;
  const sunDir = game.dunes?.sunDir;
  const sun = !!(game.dunes?.active && sunDir && fwd.dot(sunDir) > Math.cos((18 * Math.PI) / 180) && !skyHit);
  return { subjects: out, best: out[0] || null, stars: out[0]?.stars || (sky || sun ? 3 : 0), kinds: Object.keys(counts).length, counts, sky, sun, eye: eye.clone(), fwd: fwd.clone() };
}

/** Does a photograph satisfy a card's sitting? (arcana.js) The sitting must be what the photograph is OF: one of its main subjects
 *  (scored near the best in the frame), not something caught at the edge; the World wants five kinds, each photographed well. */
export function sits(report, sitting) {
  if (sitting.sky) return report.sky;
  if (sitting.sun) return report.sun;
  const top = report.best?.score ?? 0;
  if (sitting.kinds) return new Set(report.subjects.filter((s) => s.stars >= 2).map((s) => s.kind)).size >= sitting.kinds;
  const of = report.subjects.filter((s) => s.kind === sitting.subject && (!sitting.state || s.states.has(sitting.state)) && s.score >= top * 0.8 && s.stars >= (sitting.stars || 1));
  return of.length >= (sitting.n || 1);
}
