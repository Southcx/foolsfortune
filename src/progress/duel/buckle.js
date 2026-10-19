// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL'S BUCKLE (docs/plans/PUZZLE-DUELS.md section 11; names Espada's, proposed: label Break, lore a buckle; the owner, 2026-10-19: "a critical junk push causes the enemy
// figment's EmO to spike in a shower of Lachryma that you can quickly run around and absorb before swapping to Godhand mode to coup de
// grace them"). The fight under the puzzle: junk landed raises a side's EmO; a landing big enough, or EmO full, BUCKLES it. A buckle
// deepens its stun (dazed, stunned, out cold: STUN-DEPTH.md's three, each costing it action points, out cold its whole turn) and sheds
// Lachryma as TEARDROPS (label Orb) onto the other side, where that side's Courier has one turn to glean them into the pool. The pool pays the
// Courier's tools and the god hand's COUP, which ends the duel at once on a buckled foe, cheaper the deeper it is down.
//
// Prior art: Puyo Puyo Tetris's Fever and Tetris 99's KO badges (a big send changes the state of the fight, not just the score),
// Final Fantasy XIII's stagger (a gauge that, filled, opens the foe to a finish), Sekiro's posture and its deathblow, Sonic's rings
// burst from a hit and gathered back in a hurry, .hack's data drain (the coup is its board form).
//
//   BUCKLE, COUP   onLanding(s, side, n) -> events   startTurn(s, side) -> { ap, event }   endOwnTurn(s, side) -> events   COUP_ACTION
// ---------------------------------------------------------------------------------------
import { piece } from './board.js';

export const BUCKLE = {
  junk: 8,           // junk landed at once that buckles a side (a critical push)
  emoPerJunk: 0.05,  // EmO a junk landed adds (20 landed fill it); EmO full buckles a side too, and falls back to half
  emoDecay: 0.1,     // EmO lost at the end of a side's own turn
  turns: 2,          // a side's own turns a buckle's stun holds (a new buckle while down refreshes it and goes a depth deeper)
  apLost: [0, 1, 2, Infinity], // action points a side loses at each stun depth: none, dazed, stunned, out cold (its turn passes)
  teardropsPer: 2,   // junk landed per teardrop shed (a landing of 8 sheds 4); at least 3, at most 12
  teardrop: 8,       // pool a teardrop gives when the Courier gleans it
  showerReach: 6,    // cells from the Courier the teardrops land within
  poolMax: 100,
};
/** The coup (label Finish): the god hand's finish on a buckled foe, paid from the pool; dazed, stunned, out cold. */
export const COUP = { ap: 2, pool: [60, 40, 20] };

/** Junk has landed on a side: its EmO rises, and a big enough landing (or a full EmO) buckles it. */
export function onLanding(s, side, n) {
  const S = s.sides[side], events = [];
  S.emo = Math.min(1, (S.emo || 0) + n * BUCKLE.emoPerJunk);
  const critical = n >= BUCKLE.junk, full = S.emo >= 1;
  if (!critical && !full) return events;
  if (full) S.emo = 0.5;
  S.depth = Math.min(3, (S.depth || 0) + 1); S.stunLeft = BUCKLE.turns;
  events.push({ type: 'buckle', side, depth: S.depth, cause: critical ? 'push' : 'emo', n }); // (`cause`, not `by`: the bus's `by` is who)
  events.push(...shower(s, 1 - side, Math.max(3, Math.min(12, Math.ceil(n / BUCKLE.teardropsPer)))));
  return events;
}

/** Teardrops of Lachryma land at random empty cells of the side that buckled the other, round its Courier where it has one (within
 *  BUCKLE.showerReach cells: a glean or two away), anywhere on the side if not. They float: no gravity moves them. */
function shower(s, side, n) {
  const b = s.board, at = s.sides[side].at, all = b.empty(side), events = [];
  const near = at ? all.filter(([x, y]) => Math.abs(x - at[0]) + Math.abs(y - at[1]) <= BUCKLE.showerReach) : [];
  const cells = near.length >= n ? near : all;
  for (let i = 0; i < n && cells.length; i++) {
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], p = piece('teardrop', { side }); b.set(x, y, p); events.push({ type: 'teardrop', side, id: p.id, at: [x, y] });
  }
  return events;
}

/** A side's points at the start of its turn: its own, less its stun depth's loss and any stagger the other side's toll left on it.
 *  Its `turn` event says what was lost and why, so the loss is never silent. */
export function startTurn(s, side) {
  const S = s.sides[side], stun = BUCKLE.apLost[S.depth || 0], stagger = S.stagger || 0, ap = Math.max(0, S.ap - stun - stagger);
  S.stagger = 0;
  return { ap, event: { type: 'turn', side, ap, lost: S.ap - ap, depth: S.depth || 0, stagger } };
}

/** The end of a side's own turn: teardrops left on its side fade (one turn to glean them), its EmO settles, and its stun counts down. */
export function endOwnTurn(s, side) {
  const b = s.board, S = s.sides[side], events = [];
  b.each((p, x, y) => { if (p.kind === 'teardrop' && b.mine(side, x)) { b.set(x, y, null); events.push({ type: 'teardrop.fade', side, at: [x, y] }); } });
  S.emo = Math.max(0, (S.emo || 0) - BUCKLE.emoDecay);
  if (S.depth && --S.stunLeft <= 0) { S.depth = 0; events.push({ type: 'buckle.end', side }); }
  return events;
}

/** The coup de grâce (the god hand's): ends the duel on a buckled foe, for the pool its depth asks. */
/** Only a side that may (`coup`) has it: the data drain is the Courier's, and never touches the Courier (the owner), so a Figment's side
 *  has no coup in play; a buckled Courier only loses points. (The simulator gives both sides one, to measure it from either chair.) */
export const COUP_ACTION = { form: 'hand', cost: COUP.ap,
  legal: (s, side) => { const d = s.sides[1 - side].depth || 0; return !!s.sides[side].coup && d > 0 && s.sides[side].pool >= COUP.pool[d - 1]; },
  apply: (s, side) => { const d = s.sides[1 - side].depth; s.sides[side].pool -= COUP.pool[d - 1]; s.winner = side;
    return [{ type: 'duel.coup', side, depth: d, winner: side }]; } };
