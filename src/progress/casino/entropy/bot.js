// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' OPPONENT (docs/plans/ENTROPY-TACTICS.md 3h; GAPS G95): single-observer INFORMATION-SET MONTE CARLO TREE SEARCH. The
// other seat's held cards and the deck are hidden, so each iteration first DETERMINIZES the seat's view (rules.js `determinize`: the cards
// it cannot see dealt at random into the other hand and the deck), then walks one shared tree down it: only the moves legal in that
// deal count as available, and UCB1 weighs each by its wins over the times it was available (Cowling, Powley and Whitehouse 2012). A leaf is
// rolled out at random for a few moves and read by a position score (health, tokens, how far the bomb sits toward the enemy). The move
// tried most is played. A style leans it: `iters` is how long it thinks, `greed` how much the bomb's place is worth to it.
// The random bot (`randomEntropyBot`) is the simulator's floor: the search must beat it.
//
// Prior art: ISMCTS (Cowling et al., "Information Set Monte Carlo Tree Search", 2012), AlphaGo's rollout-and-evaluate mix, OpenSpiel's
// ismcts bot, Hearthstone and Magic AIs that determinize a hidden hand.
//
//   entropyBot(view, pending, r, style?)   randomEntropyBot(view, pending, r)   positionScore(S, seat, greed)
// ---------------------------------------------------------------------------------------
import { ENTROPY, determinize } from './rules.js';

const KEY = (m) => JSON.stringify(m);
/** How well a position reads for `seat`, 0 to 1: health, tokens, bomb ground (toward the enemy is good), the counter closing when you lead. */
export function positionScore(S, seat, greed = 0.5) {
  if (S.done) return S.winner === seat ? 1 : 0;
  const o = 1 - seat, hp = (S.hp[seat] - S.hp[o]) / 20, tk = (S.tokens.filter((t) => t.owner === seat).reduce((a, t) => a + t.hp, 0) - S.tokens.filter((t) => t.owner === o).reduce((a, t) => a + t.hp, 0)) / 12;
  const ground = seat === 0 ? (3 - S.bomb.z) / 3 : (S.bomb.z - 3) / 3, bank = (S.bank[seat] - S.bank[o]) / 10;
  const x = hp * 2 + tk * 0.8 + ground * (0.8 + greed) + bank * 0.2;
  return 1 / (1 + Math.exp(-2 * x));
}
function rollout(S, seat, r, depth, greed) {
  for (let i = 0; i < depth && !S.done; i++) {
    const P = ENTROPY.pending(S); if (!P) break;
    let m;
    if (P.kind === 'act' && r() < 0.3) m = P.moves[0]; // ('end' is first: the turn must move on)
    else if (P.kind === 'bomb') m = P.moves[r() < 0.55 ? 0 : 1] || P.moves[0];
    else m = P.moves[Math.floor(r() * P.moves.length)];
    ENTROPY.apply(S, m, r);
  }
  return positionScore(S, seat, greed);
}
/** The search. Returns the move to play from `view` for its seat. */
export function entropyBot(V, P, r, style = {}) {
  const iters = style.iters ?? 60, greed = style.greed ?? 0.5, seat = V.seat, root = { kids: new Map(), n: 0 };
  for (let it = 0; it < iters; it++) {
    const S = determinize(V, r); S.pending = [{ ...P, moves: P.moves }]; // (the root's choice is the one we were asked)
    let node = root; const path = [];
    for (let depth = 0; depth < 80 && !S.done; depth++) {
      const Q = ENTROPY.pending(S); if (!Q) break;
      const keys = Q.moves.map(KEY); let untried = null;
      for (let i = 0; i < keys.length; i++) { const kid = node.kids.get(keys[i]); if (kid) kid.avail++; else (untried ||= []).push(i); }
      let pick;
      if (untried) { pick = untried[Math.floor(r() * untried.length)]; node.kids.set(keys[pick], { kids: new Map(), n: 0, w: 0, avail: 1, seat: Q.seat }); }
      else { let best = -1, bi = 0; for (let i = 0; i < keys.length; i++) { const kid = node.kids.get(keys[i]), u = kid.w / kid.n + 0.7 * Math.sqrt(Math.log(kid.avail) / kid.n); if (u > best) { best = u; bi = i; } } pick = bi; }
      const kid = node.kids.get(keys[pick]); path.push(kid); ENTROPY.apply(S, Q.moves[pick], r); node = kid;
      if (untried) break;
    }
    const v = rollout(S, seat, r, 24, greed);
    for (const kid of path) { kid.n++; kid.w += kid.seat === seat ? v : 1 - v; }
  }
  let best = null; for (const [k, kid] of root.kids) if (!best || kid.n > best.n) best = { k, n: kid.n };
  return best ? P.moves[P.moves.findIndex((m) => KEY(m) === best.k)] : P.moves[0];
}
/** The floor: a random legal move, though it ends its act phase now and then so a turn finishes. */
export function randomEntropyBot(V, P, r) { return P.kind === 'act' && r() < 0.3 ? P.moves[0] : P.moves[Math.floor(r() * P.moves.length)]; }
