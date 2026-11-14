// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS BOT (docs/plans/WELL-BOARD.md 6): a seat played by rule, for the simulator (scripts/wellboard.mjs) and for a
// sibling's seat when a board is shared. It reads only what a player's page shows (rules.js view: the readout's reach of each die),
// so what it proves about die choice is true for a person reading the same board.
//
// Its one judgement is which die to throw: each unspent die is worth the mean, over its faces, of the best space that face could
// land on (a fork is taken toward the better line), and the best die is thrown. A `plan` of 0 throws any die at random (the
// control: how much the choice is worth). It leaves by the way up when the cracks it carries reach its `nerve`, and blows the Wake
// Whistle one crack from the fall. A floor's outcome is not the kernel's: the bot stands in for play with `skill`, the chance it
// clears a floor, falling `deeper` a floor (a FOE's space at `foe` of that).
//
// Prior art: expectimax over one die (backgammon's pip counting, Can't Stop's "rule of 28"), the table engine's bots with a style
// (progress/casino/: a number or two, never a personality in code).
//
//   boardBot(view, pending, r, style) -> move   STYLE (the defaults)   worthOf(land, me, style)   worthOfReach(reach, me, style) -> { mean, at }   dieWorth(readout, sides, me)
// ---------------------------------------------------------------------------------------
import { BOARD } from './layout.js';

export const STYLE = { plan: 1, skill: 0.8, deeper: 0.04, foe: 0.85, nerve: 3, greed: 1 };

/** A floor's chance of a clear for this style at a depth (0-based). */
export const clearChance = (st, depth, foe = false) => Math.max(0.05, Math.min(0.99, (st.skill - st.deeper * depth) * (foe ? st.foe : 1)));

/** What landing on a space is worth: a piece of haul is 1 at tier 0 and more deeper; a crack costs more the nearer the fall. */
export function worthOf(land, me, st, bears = BOARD.bears) {
  const depth = +String(land.id).split('.')[0] || 0, piece = 1 + 0.5 * depth, crackCost = (1 + me.haul.length * 0.5) * (1.5 + me.cracks) / Math.max(1, bears - me.cracks);
  switch (land.kind) {
    case 'fight': case 'genre': { if (land.cleared) return 0; const p = clearChance(st, depth); return st.greed * p * piece * (land.kind === 'genre' ? 1.5 : 1) - (1 - p) * crackCost; }
    case 'foe': { if (land.cleared) return 0.5; if (!land.open) return 0; const p = clearChance(st, depth, true); return st.greed * p * piece * 3 - (1 - p) * crackCost; }
    case 'cache': return land.taken ? 0 : piece;
    case 'spring': return me.cracks ? crackCost * 0.8 : 0.3;
    case 'hazard': return -(1 - (land.odds ?? 0.5)) * crackCost;
    case 'rest': return 0.25 * me.spent.length;
    case 'door': return land.open ? 0.9 + 0.3 * me.haul.length * 0 : 0.05; // (open: the way down; shut: only the way up)
    case 'shift': return 0.1 * (land.shift || 0);
    default: return 0;
  }
}

export function boardBot(view, P, r, style = {}) {
  const st = { ...STYLE, ...style }, me = view.seats[P.seat], R = view.readout;
  if (P.kind === 'floor') return { id: r() < clearChance(st, P.depth, P.floor === 'foe') ? 'clear' : 'fail' };
  if (P.kind === 'fate') return P.moves[0];
  if (P.kind === 'fork') { // (the line whose landing is worth more)
    if (r() >= st.plan) return P.moves[Math.floor(r() * P.moves.length)];
    let best = P.moves[0], bestV = -Infinity;
    for (const m of P.moves) { const v = Math.max(...m.lands.map((l) => worthOf(l, me, st, view.bears))); if (v > bestV) { bestV = v; best = m; } }
    return best;
  }
  if (P.kind === 'reroll') { // (again, if this face lands clearly worse than the die's mean)
    if (r() >= st.plan) return P.moves[0];
    const W = worthOfReach(P.reach, me, st, view.bears);
    return { id: W.at[P.face].v < W.mean - 0.75 ? 'again' : 'keep' };
  }
  // the throw: the way out first
  const leave = P.moves.find((m) => m.id === 'leave'), whistle = P.moves.find((m) => m.id === 'whistle');
  if (leave && me.haul.length && me.cracks >= st.nerve) return leave;
  if (whistle && me.haul.length >= 2 && me.cracks >= view.bears - 1) return whistle;
  const dice = P.moves.filter((m) => m.id === 'throw'), retry = P.moves.find((m) => m.id === 'retry');
  if (retry && worthOf({ id: R.at.id, kind: R.at.kind, open: true }, me, st, view.bears) > 0) return retry;
  if (r() >= st.plan) return dice[Math.floor(r() * dice.length)];
  let best = dice[0], bestV = -Infinity;
  for (const m of dice) { const v = dieWorth(R, m.sides, me, st, view.bears).mean; if (v > bestV) { bestV = v; best = m; } }
  return best;
}

/** A die's worth from its reach: the mean over its faces of the best landing, and each face's own best (with the fork to take). */
export function worthOfReach(reach, me, st = STYLE, bears = BOARD.bears) {
  const at = {}; let sum = 0;
  for (const f of reach || []) { let b = -Infinity, via = null; for (const l of f.lands) { const v = worthOf(l, me, st, bears); if (v > b) { b = v; via = l.via; } } at[f.face] = { v: b, via }; sum += b; }
  return { mean: reach?.length ? sum / reach.length : -Infinity, at };
}
export const dieWorth = (R, sides, me, st = STYLE, bears = BOARD.bears) => worthOfReach(R.dice.find((x) => x.sides === sides)?.reach, me, st, bears);
