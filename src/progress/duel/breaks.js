// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL'S BREAK (docs/plans/PUZZLE-DUELS.md section 11; the owner, 2026-10-19: "a critical junk push causes the enemy
// figment's EmO to spike in a shower of Lachryma that you can quickly run around and absorb before swapping to Godhand mode to coup de
// grace them"). The fight under the puzzle: junk landed raises a side's EmO; a landing big enough, or EmO full, BREAKS it. A break
// deepens its stun (dazed, stunned, out cold: STUN-DEPTH.md's three, each costing it action points, out cold its whole turn) and sheds
// Lachryma as MOTES onto the other side, where that side's Courier has one turn to run them up into the pool. The pool pays the
// Courier's tools and the god hand's COUP, which ends the duel at once on a broken foe, cheaper the deeper it is down.
//
// Prior art: Puyo Puyo Tetris's Fever and Tetris 99's KO badges (a big send changes the state of the fight, not just the score),
// Final Fantasy XIII's stagger (a gauge that, filled, opens the foe to a finish), Sekiro's posture and its deathblow, Sonic's rings
// burst from a hit and gathered back in a hurry, .hack's data drain (the coup is its board form).
//
//   BREAK, COUP   onLanding(s, side, n) -> events   startTurn(s, side) -> apLeft   endOwnTurn(s, side) -> events   COUP_ACTION
// ---------------------------------------------------------------------------------------
import { piece } from './board.js';

export const BREAK = {
  junk: 8,           // junk landed at once that breaks a side (a critical push)
  emoPerJunk: 0.05,  // EmO a junk landed adds (20 landed fill it); EmO full breaks a side too, and falls back to half
  emoDecay: 0.1,     // EmO lost at the end of a side's own turn
  turns: 2,          // a side's own turns a break's stun holds (a new break while down refreshes it and goes a depth deeper)
  apLost: [0, 1, 2, Infinity], // action points a side loses at each stun depth: none, dazed, stunned, out cold (its turn passes)
  motesPer: 2,       // junk landed per mote shed (a landing of 8 sheds 4); at least 3, at most 12
  mote: 8,           // pool a mote gives when the Courier runs over it
  showerReach: 6,    // cells from the Courier the motes land within
  poolMax: 100,
};
/** The coup: the god hand's finish on a broken foe, paid from the pool; dazed, stunned, out cold. */
export const COUP = { ap: 2, pool: [60, 40, 20] };

/** Junk has landed on a side: its EmO rises, and a big enough landing (or a full EmO) breaks it. */
export function onLanding(s, side, n) {
  const S = s.sides[side], events = [];
  S.emo = Math.min(1, (S.emo || 0) + n * BREAK.emoPerJunk);
  const critical = n >= BREAK.junk, full = S.emo >= 1;
  if (!critical && !full) return events;
  if (full) S.emo = 0.5;
  S.depth = Math.min(3, (S.depth || 0) + 1); S.stunLeft = BREAK.turns;
  events.push({ type: 'break', side, depth: S.depth, by: critical ? 'push' : 'emo', n });
  events.push(...shower(s, 1 - side, Math.max(3, Math.min(12, Math.ceil(n / BREAK.motesPer)))));
  return events;
}

/** Motes of Lachryma land at random empty cells of the side that broke the other, round its Courier where it has one (within
 *  BREAK.showerReach cells: a run or two away), anywhere on the side if not. They float: no gravity moves them. */
function shower(s, side, n) {
  const b = s.board, at = s.sides[side].at, all = b.empty(side), events = [];
  const near = at ? all.filter(([x, y]) => Math.abs(x - at[0]) + Math.abs(y - at[1]) <= BREAK.showerReach) : [];
  const cells = near.length >= n ? near : all;
  for (let i = 0; i < n && cells.length; i++) {
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], p = piece('mote', { side }); b.set(x, y, p); events.push({ type: 'mote', side, id: p.id, at: [x, y] });
  }
  return events;
}

/** A side's points at the start of its turn: its own, less its stun depth's loss and any stagger the other side's toll left on it. */
export function startTurn(s, side) {
  const S = s.sides[side], lost = BREAK.apLost[S.depth || 0] + (S.stagger || 0);
  S.stagger = 0;
  return Math.max(0, S.ap - lost);
}

/** The end of a side's own turn: motes left on its side fade (one turn to run them), its EmO settles, and its stun counts down. */
export function endOwnTurn(s, side) {
  const b = s.board, S = s.sides[side], events = [];
  b.each((p, x, y) => { if (p.kind === 'mote' && b.mine(side, x)) { b.set(x, y, null); events.push({ type: 'mote.fade', side, at: [x, y] }); } });
  S.emo = Math.max(0, (S.emo || 0) - BREAK.emoDecay);
  if (S.depth && --S.stunLeft <= 0) { S.depth = 0; events.push({ type: 'break.end', side }); }
  return events;
}

/** The coup de grâce (the god hand's): ends the duel on a broken foe, for the pool its depth asks. */
export const COUP_ACTION = { form: 'hand', cost: COUP.ap,
  legal: (s, side) => { const d = s.sides[1 - side].depth || 0; return d > 0 && s.sides[side].pool >= COUP.pool[d - 1]; },
  apply: (s, side) => { const d = s.sides[1 - side].depth; s.sides[side].pool -= COUP.pool[d - 1]; s.winner = side;
    return [{ type: 'duel.coup', side, depth: d, winner: side }]; } };
