// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' OPPONENT (docs/plans/ENTROPY-TACTICS.md 3h, 8; GAPS G95): single-observer INFORMATION-SET MONTE CARLO TREE SEARCH. The
// other seat's hand, kept and fed cards and both decks' order are hidden, so each iteration first DETERMINIZES the seat's view (rules.js
// `determinize`: the other seat's unseen cards dealt at random into its hand, kept cards, deck and fed cards, and the seat's own deck
// shuffled), then walks one shared tree down it: only the moves legal in that deal count as available, and UCB1 weighs each by its wins
// over the times it was available (Cowling, Powley and Whitehouse 2012). Version 2's play is a card picked, then its place (a number card
// may go on dozens of tiles), so at a place the tree and the rollout see a SHORTLIST (`considered`): the places a quick read ranks best
// (`placeScore`: a 21 that flips their tile or the bomb's, a build the rest of the hand can finish to 21 this turn, a court token, a bust
// that saves a tile, a hit that downs a token near your edge: `tokenScore`), never back nor a feed; a carve is decided for the
// hand's first card only (the rest follow, so the tree has no orderings of one choice). A leaf is rolled out by the same read for a few moves and scored
// by the position (health, the bomb's tile and row, tiles held, tokens, decks left). The move tried most is played. A style leans it:
// `iters` is how long it thinks, `greed` how much the bomb's place is worth to it.
// The random bot (`randomEntropyBot`) is the simulator's floor: the search must beat it.
//
// Prior art: ISMCTS (Cowling et al., "Information Set Monte Carlo Tree Search", 2012), AlphaGo's rollout-and-evaluate mix and its policy
// prior (here a hand-written one), progressive widening's idea of searching only the likely moves, OpenSpiel's ismcts bot, Hearthstone and
// Magic AIs that determinize a hidden hand.
//
//   entropyBot(view, pending, r, style?)   randomEntropyBot(view, pending, r)   positionScore(S, seat, greed)   placeScore(S, p, card, m)
// ---------------------------------------------------------------------------------------
import { ENTROPY, ENTROPY_RULES as R, determinize, ownerAt, sidesOf, legalTiles } from './rules.js';
import { rankOf, isCourt, valuesOf } from './cards.js';
import { hitOf } from './tokens.js';
import { CLASSES, HEALTH } from './classes.js';

const KEY = (m) => JSON.stringify(m);
const SHORT = 9; // (plays kept for the search beside ending the step: enough for the few that matter in a hand of five)
/** How well a position reads for `seat`, 0 to 1: health, the bomb's tile (theirs is good, yours is bad, more as the counter falls) and
 *  row, tiles held, tokens on the board, the decks left (an empty deck is fatigue coming), the bank. */
export function positionScore(S, seat, greed = 0.5) {
  if (S.done) return S.winner === seat ? 1 : S.winner == null ? 0.5 : 0;
  const o = 1 - seat, N = R.size, hp = (S.hp[seat] - S.hp[o]) / HEALTH, bo = ownerAt(S, S.bomb.x, S.bomb.z), late = 1 - Math.max(0, S.counter) / R.counter;
  let held = 0; for (const T of S.tiles) held += T.o === seat ? 1 : T.o === o ? -1 : 0;
  let tk = 0; for (const t of S.tokens) tk += (t.owner === seat ? 1 : -1) * t.rank;
  const row = seat === 0 ? (3 - S.bomb.z) / 3 : (S.bomb.z - 3) / 3, dk = (Math.min(10, S.deck[seat].length) - Math.min(10, S.deck[o].length)) / 10;
  const x = hp * 2 + (bo === o ? 1 : bo === seat ? -1 : 0) * (0.6 + 1.6 * late) * (0.6 + greed) + row * (0.4 + greed) + (held / N) * 0.6 + tk * 0.08 + dk * 0.3 + (S.bank[seat] - S.bank[o]) * 0.02;
  return 1 / (1 + Math.exp(-2 * x));
}
/** A number card's read on a tile (owner `o`, sum `s`) for seat `p`: value `v`, the hand's other sums `reach`, on the bomb or beside it. */
function numScore(p, o, s, v, reach, bomb, near) {
  const sum = s + v;
  if (sum === 21) return o === p ? -4 : 6 + (o === 1 - p ? 3 : 1) + (bomb ? 8 : 0) + (near ? 1 : 0);
  if (sum > 21) return s >= 10 && o !== -1 ? (o === p ? 2 : -1) + (bomb ? 3 : 0) : -4;
  if (o === p) return -3; // (building your own tile only arms theirs)
  const gap = 21 - sum;
  if (reach & (1 << gap)) return 4 + (o === 1 - p ? 2 : 0) + (bomb ? 6 : 0) + (near ? 0.5 : 0) - v * 0.02; // (the rest of the hand can finish it this turn)
  return (gap > 11 ? 0.4 : gap === 11 ? -0.5 : -1.5) + (bomb ? 0.6 : 0) - v * 0.05;
}
/** A number card's hit on enemy token `t` for seat `p` (value `v`): downing it is worth its rank and more the nearer it stands to your back
 *  rank (a wand there strikes, a sword shoves the bomb); a hit that leaves it standing is a small chip, worth it only when it nearly falls. */
function tokenScore(p, t, c, v) {
  const h = hitOf(t, c, v), near = 1 - Math.abs((p === 0 ? R.size - 1 : 0) - t.z) / (R.size - 1);
  return h.falls ? 2 + t.rank * 0.9 + near * 3 - (h.dmg - t.hp) * 0.08 : -1.5 + (1 - h.hp / t.max) * 2 + near;
}
const courtScore = (S, p, c, x) => 2 + 0.6 * (rankOf(c) - 10) + (CLASSES[S.cls[p]].suit === (c & 3) ? 1 : 0) - (x === S.bomb.x ? 1.5 : 0);
/** A quick read of card `c` placed by seat `p` at `m` ({ at, v }) (higher is better; ending the step is 0): the bot's prior over its widest
 *  choice. A 21 that flips their tile or the bomb's is best, then a build the rest of the hand finishes this turn; a court token is good;
 *  a bust is good only to save a tile they were building. */
export function placeScore(S, p, c, m, reach = reachOf(S.hand[p], c)) {
  const x = m.at?.[0], z = m.at?.[1];
  if (isCourt(c)) return courtScore(S, p, c, x);
  if (m.on != null) { const t = S.tokens.find((u) => u.id === m.on); return t ? tokenScore(p, t, c, m.v) : -9; }
  const T = S.tiles[z * R.size + x], dx = Math.abs(S.bomb.x - x) + Math.abs(S.bomb.z - z);
  return numScore(p, T.o, T.s, m.v, reach, dx === 0, dx === 1);
}
/** The sums the hand's other number cards can make together this turn (a bit a sum, 0 to 21; an ace 1 or 11): what a 21 needs after a build. */
export function reachOf(hand, c) {
  let reach = 1; for (const d of hand) { if (d === c || isCourt(d)) continue; let next = reach; for (const v of valuesOf(d)) next |= reach << v; reach = next & 0x3fffff; }
  return reach & ~1; // (a sum of nothing finishes nothing)
}
/** The best place for card `c` and its read, found without making the moves (the rollout's card pick, the play step's prior); `out`, if
 *  given, takes the place ({ at, v }). */
function bestPlace(S, p, c, tiles, out) {
  let best = -9; const N = R.size;
  if (isCourt(c)) { const z = p === 0 ? N - 1 : 0; for (let x = 0; x < N; x++) { if (ownerAt(S, x, z) !== p || S.tokens.some((t) => t.x === x && t.z === z) || (S.bomb.x === x && S.bomb.z === z)) continue; const sc = courtScore(S, p, c, x); if (sc > best) { best = sc; if (out) { out.at = [x, z]; out.v = undefined; } } } return best; }
  const reach = reachOf(S.hand[p], c), lo = rankOf(c), hi = lo === 1 ? 11 : lo, bx = S.bomb.x, bz = S.bomb.z;
  for (const i of tiles) {
    const T = S.tiles[i], x = i % N, z = (i / N) | 0, d = Math.abs(bx - x) + Math.abs(bz - z);
    for (let v = lo; v <= hi; v += 10) { const sc = numScore(p, T.o, T.s, v, reach, d === 0, d === 1); if (sc > best) { best = sc; if (out) { out.at = [x, z]; out.v = v; out.on = undefined; } } }
  }
  for (const t of S.tokens) { if (t.owner === p) continue; const sc = tokenScore(p, t, c, hi); if (sc > best) { best = sc; if (out) { out.at = undefined; out.on = t.id; out.v = hi; } } }
  return best;
}
const activeScore = (S, p, a) => (a === 'bloom' ? (S.hp[p] <= HEALTH - 5 ? 3 : -1) : a === 'cycle' ? (S.deck[p].length > 8 ? 1 : -1) : 1);
const squash = (x) => 1 / (1 + Math.exp(-x / 2));
/** The moves the search looks at, each with its prior (0 to 1, the quick read): every move but at a place (a shortlist, never back) and a
 *  carve (the hand's first card only). The tree expands the likeliest untried move first and leans its choice toward it (PUCT's bias). */
function considered(S, P) {
  const p = P.seat;
  if (P.kind === 'carve') {
    const c = P.moves[0].card ?? P.moves[0].feed, keepIt = isCourt(c) || rankOf(c) >= 8, small = sidesOf(S.fed[p]) < 12, moves = P.moves.filter((m) => m.card === c || m.feed === c);
    return { moves, prior: moves.map((m) => (m.to === 'keep' ? (keepIt ? 0.7 : 0.35) : m.feed != null ? (small ? 0.6 : 0.4) : 0.45)) };
  }
  if (P.kind === 'play') {
    let tiles = null;
    return { moves: P.moves, prior: P.moves.map((m) => squash(m.done ? 0 : m.feed != null ? -1.5 : m.active ? activeScore(S, p, m.active) : bestPlace(S, p, m.card, isCourt(m.card) ? null : (tiles ??= legalTiles(S, p))))) };
  }
  if (P.kind === 'place') {
    const reach = reachOf(S.hand[p], P.card), all = P.moves.filter((m) => !m.back && m.feed == null).map((m) => [placeScore(S, p, P.card, m, reach), m]).sort((a, b) => b[0] - a[0]).slice(0, SHORT);
    return { moves: all.map((x) => x[1]), prior: all.map((x) => squash(x[0])) };
  }
  return { moves: P.moves, prior: P.moves.map((m) => (m.feed != null ? 0.2 : 0.5)) };
}
/** The rollout's hand: the card whose best place reads well (else end the step), its best place, a carve by the card (a court or a high
 *  card kept, a low one fed while the die is small). */
function rolloutMove(S, P, r) {
  if (P.kind === 'play') { // (the card and its place chosen together, the place carried to the next step; one read a rank, two sevens read alike)
    let best = P.moves[0], bs = 0.2, tiles = null; const byRank = new Map(), spot = {};
    for (const m of P.moves) {
      if (m.done || m.feed != null) continue;
      let read; if (m.active) read = { s: activeScore(S, P.seat, m.active) }; else { const k = rankOf(m.card); read = byRank.get(k); if (!read) { const o = {}; read = { s: bestPlace(S, P.seat, m.card, isCourt(m.card) ? null : (tiles ??= legalTiles(S, P.seat)), o), o }; byRank.set(k, read); } }
      const sc = read.s + r() * 0.8; if (sc > bs) { bs = sc; best = m; spot.o = read.o; }
    }
    S.ctx.aim = best.card != null ? spot.o : null; return best;
  }
  if (P.kind === 'place') {
    const aim = S.ctx.aim;
    if (aim?.on != null) { const m = P.moves.find((x) => x.on === aim.on && x.v === aim.v); if (m) return m; }
    if (aim?.at) { const m = P.moves.find((x) => x.at && x.at[0] === aim.at[0] && x.at[1] === aim.at[1] && (x.v ?? 0) === (aim.v ?? 0)); if (m) return m; }
    let best = P.moves[0], bs = -99; const reach = reachOf(S.hand[P.seat], P.card); for (const m of P.moves) { if (m.back || m.feed != null) continue; const s = placeScore(S, P.seat, P.card, m, reach) + r() * 0.5; if (s > bs) { bs = s; best = m; } } return best;
  }
  if (P.kind === 'carve') {
    const c = P.moves[0].card ?? P.moves[0].feed, can = (to) => P.moves.find((m) => (to === 'feed' ? m.feed === c : m.card === c && m.to === to)), k = can('keep');
    if (k && (isCourt(c) || rankOf(c) >= 8) && r() < 0.7) return k;
    return (r() < (sidesOf(S.fed[P.seat]) < 12 ? 0.6 : 0.3) ? can('feed') : can('discard')) || P.moves[0];
  }
  if (P.kind === 'bomb') return P.moves[r() < 0.55 ? 0 : 1] || P.moves[0];
  return P.moves[Math.floor(r() * P.moves.length)];
}
function rollout(S, seat, r, depth, greed) {
  for (let i = 0; i < depth && !S.done; i++) { const P = ENTROPY.pending(S); if (!P) break; ENTROPY.apply(S, rolloutMove(S, P, r), r); }
  return positionScore(S, seat, greed);
}
/** The search. Returns the move to play from `view` for its seat. */
export function entropyBot(V, P, r, style = {}) {
  const iters = style.iters ?? 60, greed = style.greed ?? 0.5, seat = V.seat, root = { kids: new Map(), n: 0 };
  for (let it = 0; it < iters; it++) {
    const S = determinize(V, r); S.pending = [{ ...P, moves: P.moves }]; // (the root's choice is the one we were asked)
    let node = root; const path = [];
    for (let depth = 0; depth < 60 && !S.done; depth++) {
      const Q = ENTROPY.pending(S); if (!Q) break;
      const { moves, prior } = considered(S, Q), keys = moves.map(KEY); let untried = null;
      for (let i = 0; i < keys.length; i++) { const kid = node.kids.get(keys[i]); if (kid) kid.avail++; else (untried ||= []).push(i); }
      let pick;
      if (untried) { let bp = -1; for (const i of untried) { const q = prior[i] + r() * 0.1; if (q > bp) { bp = q; pick = i; } } node.kids.set(keys[pick], { kids: new Map(), n: 0, w: 0, avail: 1, seat: Q.seat, prior: prior[pick] }); }
      else { let best = -1, bi = 0; for (let i = 0; i < keys.length; i++) { const kid = node.kids.get(keys[i]), u = kid.w / kid.n + 0.7 * Math.sqrt(Math.log(kid.avail) / kid.n) + 0.6 * prior[i] / (1 + kid.n); if (u > best) { best = u; bi = i; } } pick = bi; }
      const kid = node.kids.get(keys[pick]); path.push(kid); ENTROPY.apply(S, moves[pick], r); node = kid;
      if (untried) break;
    }
    const v = rollout(S, seat, r, 24, greed);
    for (const kid of path) { kid.n++; kid.w += kid.seat === seat ? v : 1 - v; }
  }
  let best = null; for (const [k, kid] of root.kids) if (!best || kid.n + kid.prior * 0.5 > best.n) best = { k, n: kid.n + kid.prior * 0.5 }; // (most tried; the prior breaks a tie)
  return best ? P.moves[P.moves.findIndex((m) => KEY(m) === best.k)] : P.moves[0];
}
/** The floor: a random legal move, though it ends its play step now and then so a turn finishes, and never takes a pick back. */
export function randomEntropyBot(V, P, r) { if (P.kind === 'play' && r() < 0.3) return P.moves[0]; const ms = P.kind === 'place' && P.moves.length > 1 ? P.moves.filter((m) => !m.back && m.feed == null) : P.moves; if (!ms.length) return P.moves[0]; return ms[Math.floor(r() * ms.length)]; }
