// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL'S BOT (docs/plans/PUZZLE-DUELS.md sections 3 and 6): a greedy planner. For each action point it tries a sample of the
// legal actions on a copy of the duel and keeps the best by a score (junk made, then matches set up, then room kept); stopping early
// is one of its choices. The same plan, made before its turn, is its INTENT: what the view draws on its pieces so you can plan round it.
// A Figment's ruleset may weight the score (`rs.bot`), so each aberrant plays like its feeling.
//
// Prior art: Into the Breach (the foe's next move shown, and kept to unless the board changed under it), the greedy one-ply bots of
// Puyo and Tetris AIs (score a placement by what it clears and what it leaves).
//
//   plan(state, side?, { sample }) -> actions   play(state, { sample }) -> events (acts its turn and ends it)   score(state, side) -> number
// ---------------------------------------------------------------------------------------
import { hasTag } from './board.js';
import { act, endTurn, legalActions, cloneState, DUEL } from './duel.js';

const W = { junk: 10, pairs: 0.5, room: 6, pending: 4 };

/** How good the board is for a side: junk it has made this turn, same-colour neighbours (chains to come), its room, less what waits
 *  to land on it. */
export function score(s, side) {
  const b = s.board, S = s.sides[side], w = { ...W, ...(s.rs.bot || {}) };
  let pairs = 0, cells = 0, full = 0;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!b.mine(side, x)) continue;
    cells++; const p = b.at(x, y); if (!p) continue; full++;
    if (!hasTag(p, 'matches')) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const q = b.at(x + dx, y + dy); if (q && b.mine(side, x + dx) && hasTag(q, 'matches') && q.colour === p.colour) pairs++; }
  }
  return S.sent * w.junk + pairs * w.pairs + (1 - full / Math.max(1, cells)) * w.room * 10 - Math.max(0, S.pending - S.sent) * w.pending;
}

/** The side's best line of actions for its points now, found greedily on a copy (the duel itself is not changed). */
export function plan(s, side = s.toMove, { sample = 60 } = {}) {
  let c = cloneState(s); if (c.toMove !== side) { c.toMove = side; c.apLeft = DUEL.ap; } // (an intent: its next turn's plan)
  const out = [];
  while (c.apLeft > 0) {
    const all = legalActions(c, side);
    let best = null, bestScore = score(c, side), bestState = null; // (doing nothing is a choice)
    for (let i = 0; i < sample && all.length; i++) {
      const a = all.splice(c.r.int(all.length), 1)[0], t = cloneState(c);
      if (!act(t, a)) continue;
      const v = score(t, side); if (v > bestScore) { best = a; bestScore = v; bestState = t; }
    }
    if (!best) break;
    out.push(best); c = bestState;
  }
  return out;
}

/** The bot plays the side to move: its plan, replanned from wherever an action is refused, then the turn ends. */
export function play(s, opts = {}) {
  const events = [], side = s.toMove;
  for (let guard = 0; guard < 8 && s.apLeft > 0 && s.winner === null; guard++) {
    const p = plan(s, side, opts); if (!p.length) break;
    let ok = 0; for (const a of p) { const ev = act(s, a); if (!ev) break; events.push(...ev); ok++; }
    if (ok === p.length) break;
  }
  if (s.winner === null) events.push(...endTurn(s));
  return events;
}
