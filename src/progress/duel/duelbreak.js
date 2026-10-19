// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL'S BREAK (docs/plans/PUZZLE-DUELS.md section 11; the genre's words, the owner, 2026-10-19; the owner: "a critical junk push
// causes the enemy figment's EmO to spike in a shower of Lachryma that you can quickly run around and absorb before swapping to Godhand
// mode to coup de grace them"). The fight under the puzzle: junk landed raises a side's EmO; a landing big enough, or EmO full, BREAKS it
// (code `duelBreak`, as the junk's own `break` and a guard break have the word). A break
// deepens its stun (dazed, stunned, out cold: STUN-DEPTH.md's three, each costing it action points, out cold its whole turn) and sheds
// Lachryma as ORBS onto the other side, where that side's Courier has one turn to run them into the pool. The pool pays the
// Courier's tools and the god hand's FINISHER, which ends the duel at once on a broken foe, cheaper the deeper it is down.
//
// Prior art: Puyo Puyo Tetris's Fever and Tetris 99's KO badges (a big send changes the state of the fight, not just the score),
// Final Fantasy XIII's stagger (a gauge that, filled, opens the foe to a finish), Sekiro's posture and its deathblow, Sonic's rings
// burst from a hit and gathered back in a hurry, .hack's data drain (the finisher is its board form).
//
//   DUEL_BREAK, FINISHER   onLanding(s, side, n) -> events   startTurn(s, side) -> { ap, event }   endOwnTurn(s, side) -> events   FINISHER_ACTION
// ---------------------------------------------------------------------------------------
import { piece } from './board.js';

export const DUEL_BREAK = {
  junk: 8,           // junk landed at once that breaks a side (a critical push)
  emoPerJunk: 0.05,  // EmO a junk landed adds (20 landed fill it); EmO full breaks a side too, and falls back to half
  emoDecay: 0.1,     // EmO lost at the end of a side's own turn
  turns: 2,          // a side's own turns a break's stun holds (a new break while down refreshes it and goes a depth deeper)
  apLost: [0, 1, 2, Infinity], // action points a side loses at each stun depth: none, dazed, stunned, out cold (its turn passes)
  orbsPer: 2,   // junk landed per orb shed (a landing of 8 sheds 4); at least 3, at most 12
  orb: 8,       // pool a orb gives when the Courier runs it
  showerReach: 6,    // cells from the Courier the orbs land within
  poolMax: 100,
};
/** The finisher (code `FINISHER`, a duel's; not `stun.finisher`): the god hand's finish on a broken foe, paid from the pool; dazed, stunned, out cold. */
export const FINISHER = { ap: 2, pool: [60, 40, 20] };

/** Junk has landed on a side: its EmO rises, and a big enough landing (or a full EmO) breaks it. */
export function onLanding(s, side, n) {
  const S = s.sides[side], events = [];
  S.emo = Math.min(1, (S.emo || 0) + n * DUEL_BREAK.emoPerJunk);
  const critical = n >= DUEL_BREAK.junk, full = S.emo >= 1;
  if (!critical && !full) return events;
  if (full) S.emo = 0.5;
  S.depth = Math.min(3, (S.depth || 0) + 1); S.stunLeft = DUEL_BREAK.turns;
  events.push({ type: 'duelBreak', side, depth: S.depth, cause: critical ? 'push' : 'emo', n }); // (`cause`, not `by`: the bus's `by` is who)
  events.push(...shower(s, 1 - side, Math.max(3, Math.min(12, Math.ceil(n / DUEL_BREAK.orbsPer)))));
  return events;
}

/** Orbs of Lachryma land at random empty cells of the side that broken the other, round its Courier where it has one (within
 *  DUEL_BREAK.showerReach cells: a run or two away), anywhere on the side if not. They float: no gravity moves them. */
function shower(s, side, n) {
  const b = s.board, at = s.sides[side].at, all = b.empty(side), events = [];
  const near = at ? all.filter(([x, y]) => Math.abs(x - at[0]) + Math.abs(y - at[1]) <= DUEL_BREAK.showerReach) : [];
  const cells = near.length >= n ? near : all;
  for (let i = 0; i < n && cells.length; i++) {
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], p = piece('orb', { side }); b.set(x, y, p); events.push({ type: 'orb', side, id: p.id, at: [x, y] });
  }
  return events;
}

/** A side's points at the start of its turn: its own, less its stun depth's loss and any stagger the other side's Delay left on it.
 *  Its `turn` event says what was lost and why, so the loss is never silent. */
export function startTurn(s, side) {
  const S = s.sides[side], stun = DUEL_BREAK.apLost[S.depth || 0], stagger = S.stagger || 0, ap = Math.max(0, S.ap - stun - stagger);
  S.stagger = 0;
  return { ap, event: { type: 'turn', side, ap, lost: S.ap - ap, depth: S.depth || 0, stagger } };
}

/** The end of a side's own turn: orbs left on its side fade (one turn to run them), its EmO settles, and its stun counts down. */
export function endOwnTurn(s, side) {
  const b = s.board, S = s.sides[side], events = [];
  b.each((p, x, y) => { if (p.kind === 'orb' && b.mine(side, x)) { b.set(x, y, null); events.push({ type: 'orb.fade', side, at: [x, y] }); } });
  S.emo = Math.max(0, (S.emo || 0) - DUEL_BREAK.emoDecay);
  if (S.depth && --S.stunLeft <= 0) { S.depth = 0; events.push({ type: 'duelBreak.end', side }); }
  return events;
}

/** The finisher de grâce (the god hand's): ends the duel on a broken foe, for the pool its depth asks. */
/** Only a side that may (`finisher`) has it: the data drain is the Courier's, and never touches the Courier (the owner), so a Figment's side
 *  has no finisher in play; a broken Courier only loses points. (The simulator gives both sides one, to measure it from either chair.) */
export const FINISHER_ACTION = { form: 'hand', cost: FINISHER.ap,
  legal: (s, side) => { const d = s.sides[1 - side].depth || 0; return !!s.sides[side].finisher && d > 0 && s.sides[side].pool >= FINISHER.pool[d - 1]; },
  apply: (s, side) => { const d = s.sides[1 - side].depth; s.sides[side].pool -= FINISHER.pool[d - 1]; s.winner = side;
    return [{ type: 'duel.finisher', side, depth: d, winner: side }]; } };
