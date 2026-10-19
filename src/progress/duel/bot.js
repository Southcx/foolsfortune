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
import { COUP } from './buckle.js';
import { fleeOdds } from './flee.js';

/** Actions always tried, never left to the sample: few, and each can change the fight (a form switch, the coup). */
const ALWAYS = new Set(['form', 'coup']);
const W = { junk: 10, pairs: 0.5, room: 6, pending: 4, pool: 1.2, coup: 60, stun: 25, stagger: 6, coffin: 3, teardrops: 0, form: 3 };

/** How good the board is for a side: junk it has made this turn, same-colour neighbours (chains to come), its room, less what waits
 *  to land on it; and the fight under it (buckle.js): its pool (and a coup in reach), the foe's stun and stagger, junk held in the coffin, teardrops in reach. */
export function score(s, side) {
  const b = s.board, S = s.sides[side], F = s.sides[1 - side], w = { ...W, ...(s.rs.bot || {}) };
  if (s.winner === side) return 1e6;
  let pairs = 0, cells = 0, full = 0, teardrops = 0;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!b.mine(side, x)) continue;
    cells++; const p = b.at(x, y); if (!p) continue;
    if (p.kind === 'teardrop') { teardrops++; continue; } full++;
    if (!hasTag(p, 'matches')) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const q = b.at(x + dx, y + dy); if (q && b.mine(side, x + dx) && hasTag(q, 'matches') && q.colour === p.colour) pairs++; }
  }
  return S.sent * w.junk + pairs * w.pairs + (1 - full / Math.max(1, cells)) * w.room * 10 - Math.max(0, S.pending - S.sent) * w.pending
    + S.pool * w.pool + (F.depth && S.pool >= COUP.pool[F.depth - 1] ? w.coup : 0) + (F.depth || 0) * w.stun + (F.stagger || 0) * w.stagger + (S.coffin || 0) * w.coffin
    + (S.forms.includes('courier') ? teardrops * w.teardrops : 0);
}

/** The side's best line of actions for its points now, found greedily on a copy (the duel itself is not changed). */
export function plan(s, side = s.toMove, { sample = 60 } = {}) {
  let c = cloneState(s); if (c.toMove !== side) { c.toMove = side; c.apLeft = DUEL.ap; } // (an intent: its next turn's plan)
  if (wantsToFlee(c, side)) return [{ kind: 'flee' }]; // (a roll is judged by its odds, never by a peek at its outcome)
  const out = [];
  while (c.apLeft > 0) {
    const lastForm = out.length && out[out.length - 1].kind === 'form'; // (never two switches in a row: a switch is for what it opens)
    const all = legalActions(c, side).filter((a) => a.kind !== 'flee' && !(lastForm && a.kind === 'form')), sure = all.filter((a) => ALWAYS.has(a.kind)), rest = all.filter((a) => !ALWAYS.has(a.kind));
    const tries = [...sure]; while (tries.length < sample + sure.length && rest.length) tries.push(rest.splice(c.r.int(rest.length), 1)[0]);
    let best = null, bestScore = score(c, side), bestState = null; // (doing nothing is a choice)
    for (const a of tries) {
      const t = cloneState(c);
      if (!act(t, a)) continue;
      const v = a.kind === 'form' ? lookPast(t, side) - (s.rs.bot?.form ?? W.form) : score(t, side); // (a form switch is worth what it opens, less a little)
      if (v > bestScore) { best = a; bestScore = v; bestState = t; }
    }
    if (!best) break;
    out.push(best); c = bestState;
  }
  return out;
}

/** A bot runs when it is losing and the odds are fair: the Line 4 or more columns against it (or junk waiting that would push it so),
 *  and the flee at 40% or better. (The flee is never sampled with the rest: a clone's roll would let the bot see the die before it fell.) */
function wantsToFlee(c, side) {
  const S = c.sides[side], b = c.board; if (!S.flee || c.apLeft < 3) return false;
  const lost = (side === 0 ? b.w / 2 - b.line : b.line - b.w / 2) + S.pending / 3;
  return lost >= 4 && fleeOdds(c, side).chance >= 0.4;
}

/** The best a side could reach with one more action from here (what a form switch is worth). */
function lookPast(t, side, sample = 60) {
  let best = score(t, side); if (t.apLeft <= 0) return best;
  const all = legalActions(t, side).filter((a) => a.kind !== 'form' && a.kind !== 'flee');
  for (let i = 0; i < sample && all.length; i++) { const a = all.splice(t.r.int(all.length), 1)[0], u = cloneState(t); if (act(u, a)) best = Math.max(best, score(u, side)); }
  return best;
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
