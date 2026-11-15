// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS BOT (docs/plans/WELL-BOARD.md 6): a seat played by rule, for the simulator (scripts/wellboard.mjs) and for
// the rivals at a board (the siblings' seats: boardsession.js). It reads only what a player's page shows (rules.js view: the
// readout's reach of each die), so what it proves about die choice is true for a person reading the same board.
//
// Its main judgement is which die to throw: each unspent die is worth the mean, over its faces, of the best space that face could
// land on (a fork is taken toward the better line), and the best die is thrown. A `plan` of 0 throws any die at random (the
// control: how much the choice is worth). Before the throw it uses an item where the item plainly helps (a kit on a crack, a pick
// at a shut door, a fresh cast with three dice spent). It buys the dearest item it can afford and still keep `thrift` cubes. In a
// duel it picks a stance by its `stance` weights. It leaves by the way up when its cracks reach its `nerve`, and blows the Wake
// Whistle one crack from the fall. A floor's outcome is not the kernel's: the bot stands in for play with `skill`, the chance it
// clears a floor, falling `deeper` a floor (a FOE's space at `foe` of that).
//
// Prior art: expectimax over one die (backgammon's pip counting, Can't Stop's "rule of 28"), the table engine's bots with a style
// (progress/casino/: a number or two, never a personality in code).
//
//   battleChance(style, seat, depth, kind) -> 0..1
//   boardBot(view, pending, r, style) -> move   STYLE (the defaults)   RIVAL_STYLES { sibling id: style }   worthOf(land, me, style)   worthOfReach(reach, me, style)
//   dieWorth(readout, sides, me)   clearChance(style, depth, foe?)
// ---------------------------------------------------------------------------------------
import { BOARD } from './layout.js';
import { battleBest, BATTLE, FOES } from './battle.js';

export const STYLE = { plan: 1, skill: 0.8, deeper: 0.04, foe: 0.85, nerve: 3, greed: 1, thrift: 10, stance: { strike: 1, feint: 1, guard: 1 } };

export const clearChance = (st, depth, foe = false) => Math.max(0.05, Math.min(0.99, (st.skill - st.deeper * depth) * (foe ? st.foe : 1)));

/** A battle's chance read from the hand: three rounds of the unspent dice's mean faces (and the Psygun's bonus) against the foe's
 *  health, measured against battle.js played by battleBest (WELL-BOARD.md 12's table). Bare hands when nothing is left. */
export function battleChance(st, me, depth, kind = 'fight') {
  let hand = BOARD.dice.filter((d) => !me.spent.includes(d)); while (hand.length < BATTLE.least) hand.push(BATTLE.bare);
  const power = hand.reduce((a, d) => a + (d + 1) / 2, 0) + 3, ratio = (3 * power) / FOES[kind](depth).hp;
  return Math.max(0.02, Math.min(0.98, (ratio - 0.95) / 0.75)) * Math.min(1, st.skill + 0.15) * (1 - 0.06 * me.cracks);
}
/** What landing on a space is worth: a piece of haul is 1 at tier 0 and more deeper; a crack costs more the nearer the fall. */
export function worthOf(land, me, st, bears = BOARD.bears) {
  const depth = +String(land.id).split('.')[0] || 0, piece = 1 + 0.5 * depth, crackCost = (1 + me.haul.length * 0.5) * (1.5 + me.cracks) / Math.max(1, bears - me.cracks);
  let v = 0;
  if (land.stray) { const p = battleChance(st, me, depth, 'stray'); return p * 0.6 - (1 - p) * crackCost; }
  if (land.snare != null) v -= 0.5;
  if (land.rival) v += me.haul.length ? -0.2 : 0.2; // (a duel is a coin toss: worth it with nothing to lose)
  switch (land.kind) {
    case 'fight': case 'genre': { if (land.cleared) return v; const p = land.kind === 'fight' ? battleChance(st, me, depth) : clearChance(st, depth); return v + st.greed * p * piece * (land.kind === 'genre' ? 1.5 : 1) - (1 - p) * crackCost; }
    case 'foe': { if (land.cleared) return v + 0.5; if (!land.open) return v; const p = battleChance(st, me, depth, 'foe'); return v + st.greed * p * piece * 3 - (1 - p) * crackCost; }
    case 'cache': return v + (land.taken ? 0 : piece);
    case 'spring': return v + (me.cracks ? crackCost * 0.8 : 0.3);
    case 'hazard': return v - (1 - (land.odds ?? 0.5)) * crackCost;
    case 'rest': return v + 0.25 * me.spent.length;
    case 'door': return v + (land.open ? 0.9 : 0.05);
    case 'shift': return v + 0.1 * (land.shift || 0);
    case 'item': return v + (me.items.length < BOARD.hold ? 0.7 : 0.3);
    case 'shop': return v + (me.items.length < BOARD.hold && me.cubes >= 25 ? 0.6 : 0.05);
    case 'arcana': return v + 0.25;
    default: return v;
  }
}

/** A die's worth from its reach: the mean over its faces of the best landing, and each face's own best (with the fork to take). */
export function worthOfReach(reach, me, st = STYLE, bears = BOARD.bears) {
  const at = {}; let sum = 0;
  for (const f of reach || []) { let b = -Infinity, via = null; for (const l of f.lands) { const v = worthOf(l, me, st, bears); if (v > b) { b = v; via = l.via; } } at[f.face] = { v: b, via }; sum += b; }
  return { mean: reach?.length ? sum / reach.length : -Infinity, at };
}
/** A die's worth as a throw: its reach, read with that die gone from the hand (a fight landed on is fought without it). */
export const dieWorth = (R, sides, me, st = STYLE, bears = BOARD.bears) => worthOfReach(R.dice.find((x) => x.sides === sides)?.reach, { ...me, spent: [...me.spent, sides] }, st, bears);

export function boardBot(view, P, r, style = {}) {
  const st = { ...STYLE, ...style }, me = view.seats[P.seat], R = view.readout, pick = (list) => list[Math.floor(r() * list.length)];
  if (P.kind === 'floor') return { id: r() < clearChance(st, P.depth, P.floor === 'foe') ? 'clear' : 'fail' };
  if (P.kind === 'battle') { const best = battleBest(P.battle); return r() < Math.min(1, st.skill + 0.1) ? best : pick(P.moves); } // (skill is how often the round is played well)
  if (P.kind === 'push') return P.moves.find((m) => m.seat != null) || P.moves[0];
  if (P.kind === 'fate' || P.kind === 'arcana') return P.moves[0];
  if (P.kind === 'duel') { const W = st.stance, tot = W.strike + W.feint + W.guard; let x = r() * tot; return P.moves.find((m) => (x -= W[m.stance]) < 0) || P.moves[0]; }
  if (P.kind === 'swap') return pick(P.moves);
  if (P.kind === 'shop') { const buys = P.moves.filter((m) => m.id === 'buy' && me.cubes - m.cost >= st.thrift).sort((a, b) => b.cost - a.cost); return buys[0] || P.moves.find((m) => m.id === 'pass'); }
  if (P.kind === 'fork' || P.kind === 'face') { // (the line, or the face, whose landing is worth most)
    if (r() >= st.plan) return pick(P.moves);
    let best = P.moves[0], bestV = -Infinity;
    for (const m of P.moves) { const v = Math.max(...m.lands.map((l) => worthOf(l, me, st, view.bears))); if (v > bestV) { bestV = v; best = m; } }
    return best;
  }
  if (P.kind === 'reroll') {
    if (r() >= st.plan) return P.moves[0];
    const W = worthOfReach(P.reach, me, st, view.bears);
    return { id: W.at[P.face].v < W.mean - 0.75 ? 'again' : 'keep' };
  }
  // the throw: the way out first, then an item that plainly helps, then the die
  const leave = P.moves.find((m) => m.id === 'leave'), whistle = P.moves.find((m) => m.id === 'whistle'), use = (id) => P.moves.find((m) => m.id === 'use' && m.item === id);
  if (leave && (me.haul.length || me.cubes > 20) && me.cracks >= st.nerve) return leave;
  if (me.cracks >= view.bears - 1 && use('kit')) return use('kit');
  if (whistle && me.haul.length >= 2 && me.cracks >= view.bears - 1) return whistle;
  if (st.plan > 0) {
    if (me.cracks >= 2 && use('kit')) return use('kit');
    const ward = P.moves.filter((m) => m.id === 'power' && m.power === 'ward').sort((a, b) => a.sides - b.sides)[0];
    if (ward && me.cracks >= 2 && me.spent.length <= 3) return ward; // (a small die for a turned crack, while there are dice to spare)
    if (R.at.kind === 'door' && R.keys === R.need - 1 && use('pick')) return use('pick');
    if (me.spent.length >= 4 && use('recast')) return use('recast');
    if (use('snare') && R.seats.length > 1 && ['fight', 'genre', 'cache'].includes(R.at.kind)) return use('snare');
    if (use('loaded') && me.spent.length <= 3) return use('loaded');
    if (use('twin') && R.keys >= R.need && R.at.kind !== 'door') return use('twin');
  }
  const dice = P.moves.filter((m) => m.id === 'throw'), retry = P.moves.find((m) => m.id === 'retry');
  if (retry && worthOf({ id: R.at.id, kind: R.at.kind, open: true }, me, st, view.bears) > 0) return retry;
  if (r() >= st.plan) return pick(dice);
  let best = dice[0], bestV = -Infinity;
  for (const m of dice) { const v = dieWorth(R, m.sides, me, st, view.bears).mean; if (v > bestV) { bestV = v; best = m; } }
  return best;
}

/** The siblings as rivals: how each plays the board (the session seats them: world/well/board/boardsession.js). A style is a tell:
 *  a rival's stance in a duel leans one way, and a player who watches learns it. */
export const RIVAL_STYLES = {
  petra: { plan: 1, skill: 0.85, nerve: 2, thrift: 20, stance: { strike: 1, feint: 1, guard: 2.2 } },
  dovina: { plan: 1, skill: 0.75, nerve: 4, greed: 1.5, thrift: 0, stance: { strike: 1, feint: 2.2, guard: 1 } },
  wanda: { plan: 0.7, skill: 0.8, nerve: 3, thrift: 10, stance: { strike: 2.2, feint: 1, guard: 1 } },
  calissa: { plan: 0.6, skill: 0.8, nerve: 3, thrift: 5, stance: { strike: 1, feint: 1, guard: 1 } },
  espada: { plan: 0.9, skill: 0.85, nerve: 3, thrift: 10, stance: { strike: 1.6, feint: 1.6, guard: 0.5 } },
};

