// ---------------------------------------------------------------------------------------
// THE RESCUE (part of courier/player.js): the net under everything else, `guard`, after each fixed step. Numbers gone bad (the position
// or velocity not finite) put the body back at the last place it stood clear; a velocity past 90 m/s is cut; a body left inside level
// geometry by a platform or a tech is nudged out the shortest way after a few steps, and failing that put back at the last clear place.
// It should never fire: the stress test counts every rescue (the move's own `clip` repair is ground.js's). It emits courier.rescue
// (kind nan, nudge or reset), through the Player's `ev`.
//
// Prior art: the stuck checks of Quake's and Source's player movement (small offsets tried in turn, then the last good spot).
//
//   guard(P)      (P: the Player, whose guard() calls it after each fixed step: main.js)
// ---------------------------------------------------------------------------------------

/**
 * The net under everything else, after each fixed step: numbers gone bad, a platform or a
 * tech that left us inside a wall. Nudge out the shortest way; failing that, back to the last
 * place we stood clear. (It should never fire; the stress test says whether it does.)
 */
export function guard(P) {
  if (P.mantle || P.freeze) return;
  const finite = Number.isFinite(P.pos.x + P.pos.y + P.pos.z + P.vel.x + P.vel.y + P.vel.z);
  if (!finite) {
    P.pos.copy(P.safe.pos); P.vel.set(0, 0, 0); P.techs?.stop(); P.place();
    P.ev('courier.rescue', { kind: 'nan' });
    return;
  }
  if (P.vel.lengthSq() > 90 * 90) P.vel.setLength(90);
  if (!P.embedded()) {
    P.wedged = 0;
    P.safe.t += 1 / 60;
    if (P.grounded && !P.platform && P.safe.t > 0.4) { P.safe.pos.copy(P.pos); P.safe.shape = P.shape; P.safe.t = 0; }
    return;
  }
  if (++P.wedged < 4) return;
  const at = P.pos.clone();
  const tries = [[0, 0.1, 0], [0, 0.25, 0], [0.15, 0, 0], [-0.15, 0, 0], [0, 0, 0.15], [0, 0, -0.15], [0, 0.5, 0], [0.3, 0, 0], [-0.3, 0, 0], [0, 0, 0.3], [0, 0, -0.3], [0, 1, 0]];
  for (const [x, y, z] of tries) {
    P.pos.set(at.x + x, at.y + y, at.z + z);
    if (!P.embedded()) { P.place(); P.wedged = 0; P.ev('courier.rescue', { kind: 'nudge' }); return; }
  }
  P.pos.copy(P.safe.pos);
  P.vel.set(0, 0, 0);
  P.techs?.stop(); // (set down somewhere else: nothing held, a ladder, a ledge, the kiln, comes along to haul them back)
  P.setShape(P.safe.shape || 'stand');
  P.platform = null;
  P.place();
  P.wedged = 0;
  P.ev('courier.rescue', { kind: 'reset' });
}
