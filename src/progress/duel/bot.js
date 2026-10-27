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
//   intentOf(state, side?) -> { actions, junk, cells, hits } (its next turn as the view draws it over the fog: PUZZLE-DUELS.md 18.2)
//   hintOf(state, side?, { sample, form }) -> { action, junk, cells } | null (the idle hint: one good move in the form you hold, 21.3)
// ---------------------------------------------------------------------------------------
import { hasTag } from './board.js';
import { act, endTurn, legalActions, cloneState, DUEL, ACTIONS } from './duel.js';
import { FINISHER } from './duelbreak.js';
import { fleeOdds } from './flee.js';

/** Actions always tried, never left to the sample: few, and each can change the fight (a form switch, the finisher). */
const ALWAYS = new Set(['form', 'finisher']);
const SKILL_TRIES = 16; // (cells tried for a ready skill each action point)
const ACT_FORM = Object.fromEntries(Object.entries(ACTIONS).map(([k, A]) => [k, A.form]).filter(([, f]) => f)); // (which form each action belongs to)
const W = { junk: 10, pairs: 0.5, room: 6, pending: 4, pool: 1.2, finisher: 60, stun: 25, stagger: 6, coffin: 3, orbs: 0, form: 3, skill: 4 };

/** How good the board is for a side: junk it has made this turn, same-colour neighbours (chains to come), its room, less what waits
 *  to land on it; and the fight under it (duelbreak.js): its pool (and a finisher in reach), the foe's stun and stagger, junk held in the coffin, orbs in reach. */
export function score(s, side) {
  const b = s.board, S = s.sides[side], F = s.sides[1 - side], w = { ...W, ...(s.rs.bot || {}) };
  if (s.winner === side) return 1e6;
  let pairs = 0, cells = 0, full = 0, orbs = 0;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!b.mine(side, x)) continue;
    cells++; const p = b.at(x, y); if (!p) continue;
    if (p.kind === 'orb') { orbs++; continue; } full++;
    if (!hasTag(p, 'matches')) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const q = b.at(x + dx, y + dy); if (q && b.mine(side, x + dx) && hasTag(q, 'matches') && q.colour === p.colour) pairs++; }
  }
  return S.sent * w.junk + pairs * w.pairs + (1 - full / Math.max(1, cells)) * w.room * 10 - Math.max(0, S.pending - S.sent) * w.pending
    + S.pool * w.pool + (F.depth && S.pool >= FINISHER.pool[F.depth - 1] ? w.finisher : 0) + (F.depth || 0) * w.stun + (F.stagger || 0) * w.stagger + (S.coffin || 0) * w.coffin
    + (S.forms.includes('courier') ? orbs * w.orbs : 0);
}

/** The side's best line of actions for its points now, found greedily on a copy (the duel itself is not changed). */
export function plan(s, side = s.toMove, { sample = s.rs.bot?.sample ?? 60 } = {}) { // (a Figment's own cleverness, rulesets.js)
  let c = cloneState(s); if (c.toMove !== side) { c.toMove = side; c.apLeft = DUEL.ap; } // (an intent: its next turn's plan)
  if (wantsToFlee(c, side)) return [{ kind: 'flee' }]; // (a roll is judged by its odds, never by a peek at its outcome)
  const out = [];
  while (c.apLeft > 0) {
    const lastForm = out.length && out[out.length - 1].kind === 'form'; // (never two switches in a row: a switch is for what it opens)
    const all = legalActions(c, side).filter((a) => a.kind !== 'flee' && !(lastForm && a.kind === 'form')), sure = all.filter((a) => ALWAYS.has(a.kind)), rest = all.filter((a) => !ALWAYS.has(a.kind) && a.kind !== 'skill');
    const skills = all.filter((a) => a.kind === 'skill'); for (let i = 0; i < SKILL_TRIES && skills.length; i++) sure.push(skills.splice(c.r.int(skills.length), 1)[0]); // (a ready skill is always weighed, as a person looks at a full meter: a few of its cells)
    const tries = [...sure]; while (tries.length < sample + sure.length && rest.length) tries.push(rest.splice(c.r.int(rest.length), 1)[0]);
    let best = null, bestScore = score(c, side), bestState = null; // (doing nothing is a choice)
    for (const a of tries) {
      const t = cloneState(c);
      if (!act(t, a)) continue;
      const v = a.kind === 'form' ? lookPast(t, side) - (s.rs.bot?.form ?? W.form) : a.kind === 'skill' ? lookPast(t, side, 12) + W.skill : score(t, side); // (a form switch is worth what it opens, less a little; a full skill is worth firing, and what it opens: Read's points)
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

/** A side's intent as the view draws it (PUZZLE-DUELS.md 18.2; Into the Breach): its plan for its next turn, tried on a copy, with the
 *  junk it would send, the cells it would clear on its own half (`cells`, drawn through Dread's fog: Divination sees intent, not ground)
 *  and the cells it would move or take (`hits`). A live forecast, redrawn after each of your actions, never a promise. */
export function intentOf(s, side = 1 - s.toMove, opts = {}) {
  const actions = plan(s, side, opts), c = cloneState(s); c.toMove = side; c.apLeft = DUEL.ap;
  const before = c.sides[side].sent, cells = [], hits = [];
  for (const a of actions) {
    const ev = act(c, a); if (!ev) break;
    for (const e of ev) {
      if (e.type === 'clear' && e.side === side) cells.push(e.at);
      if (e.side === side && (e.type === 'swap' || e.type === 'rotate' || e.type === 'drop')) hits.push(e.a || e.at);
      if (e.side === side && e.type === 'drag') hits.push(e.path[0]);
    }
  }
  return { actions, junk: c.sides[side].sent - before, cells, hits };
}

/** The idle hint (PUZZLE-DUELS.md 21.3; Candy Crush and Bejeweled show a move after a few idle seconds, Puzzle & Dragons' "skyfall"
 *  practice board): the action in the form you hold now that sends the most junk, tried on quiet copies (never the duel's own dice), ties
 *  to the bot's score; null when nothing clears. The view lights it after HINT.idle real s with no touch, and lets it go at the next. */
export const HINT = { idle: 6, sample: 40 };
export function hintOf(s, side = s.toMove, { sample = HINT.sample, form = s.sides[side].form } = {}) {
  const all = legalActions(s, side).filter((a) => !['form', 'flee', 'finisher'].includes(a.kind) && (ACT_FORM[a.kind] ?? form) === form);
  const r = cloneState(s).r; let best = null;
  for (let i = 0; i < sample && all.length; i++) {
    const a = all.splice(r.int(all.length), 1)[0], t = cloneState(s), before = t.sides[side].sent, ev = act(t, a); if (!ev) continue;
    const junk = t.sides[side].sent - before; if (junk <= 0) continue;
    const v = junk * 1000 + score(t, side); if (!best || v > best.v) best = { v, action: a, junk, cells: ev.filter((e) => e.type === 'clear' && e.side === side).map((e) => e.at) };
  }
  return best && { action: best.action, junk: best.junk, cells: best.cells };
}
