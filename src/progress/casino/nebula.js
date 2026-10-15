// ---------------------------------------------------------------------------------------
// ASTROLL: NEBULA BLUFF (docs/plans/CASINO.md section 6; the owner's design doc): liar's dice on a hand's worth. Each player holds a set
// of six dice (d4, d6, d8, d10, d12, d20). Each round everyone rolls in secret; a hand's WORTH is its faces plus 10 for every die showing
// its maximum (6 .. 120). Then a round of bids, in turn from the round's starter:
//   CLAIM      the starter opens with a claim, "my hand is worth at least N", paying a tenth of N (rounded up) into the pot.
//   COUNTER    a raise: a higher claim about your own hand, paid the same way.
//   CALL OUT   pay the standing claim's price and say its claimant is bluffing. Their hand is shown: under the claim, the caller takes the
//              pot and the bluffer loses TWO dice; at or over it, the claimant takes the pot and the caller loses two.
//   FOLD       out of the round: what you paid stays in the pot, and you lose a die.
// A round's raises stop at a third of the dice still in play (12 at most); the claim that reaches that limit forces a REVEAL of every hand still in,
// the claimant's worth plus 10 for each other player still in (the owner's "bluff reversal"); the best worth takes the pot and every
// other revealed hand loses a die. A player left alone in a round takes the pot unshown. A lost die is drawn at random and never shown,
// so how many dice a player holds is known and which is not (the owner's "requires players to keep odds between hands"). The last player
// holding dice wins; a player with no dice, or no chips for the opening claim, is out. Chips are the table's: a purse in, what is left out.
// A bot leaks a TELL when it bluffs (its style's `leak`), and sometimes when it does not (`noise`): a world mark for the cloth's look
// (Calissa's), named in the view as `tell`.
// Decided here where the doc was open (the owner said go, 2026-10-15; CASINO.md 6 lists each): a claim's price is a tenth of it (the doc's
// "value equal to the bid" would pay 40 chips a raise); the dice lost are drawn at random; the reveal bonus counts the other players; the
// raise cap is a third of the doc's (measured: the full count almost never reached a reveal).
//
// Prior art: Perudo and liar's dice (claims, the challenge, a die lost), poker's showdown and raise cap, Red Dead's poker tells.
//
//   NEBULA (the game: table.js's interface)   NEBULA_RULES   worthOf(dice, faces)   nebulaBot(view, pending, r, style?)
// ---------------------------------------------------------------------------------------
import { die, rngOf } from './table.js';

/** The numbers: the set, the maximum's bonus, a claim's price (a tenth), the raise cap (the dice in play, 12 at most, divided by `capDiv`:
 *  at the doc's full count a reveal came in 0.1% of rounds, so the owner's bluff reversal never showed; a third makes it 11%), the reveal
 *  bonus, the claim steps offered, the starting purse, the lowest claim. */
export const NEBULA_RULES = { set: [4, 6, 8, 10, 12, 20], maxBonus: 10, price: 0.1, raiseCap: 12, capDiv: 3, revealBonus: 10, steps: [1, 2, 3, 5, 8, 13, 21], chips: 60, low: 6 };
const R = NEBULA_RULES;
export const priceOf = (claim) => Math.max(1, Math.ceil(claim * R.price));
/** A hand's worth: its faces plus the maximum's bonus for each die on its maximum. */
export const worthOf = (dice, faces) => faces.reduce((a, v, i) => a + v + (v === dice[i] ? R.maxBonus : 0), 0);

const inGame = (S) => [...Array(S.n).keys()].filter((q) => S.dice[q].length && !S.bust[q]);
const loseDice = (S, p, k, r) => { for (let i = 0; i < k && S.dice[p].length; i++) S.dice[p].splice(Math.floor(r() * S.dice[p].length), 1); };
const pay = (S, p, n) => { const a = Math.min(S.chips[p], n); S.chips[p] -= a; S.pot += a; S.paidRound[p] += a; return a; };

function startRound(S, r) {
  const live = inGame(S);
  if (live.length <= 1) return end(S);
  S.round++;
  S.faces = S.dice.map((d) => d.map((s) => die(r, s)));
  S.worth = S.dice.map((d, q) => worthOf(d, S.faces[q]));
  S.inRound = S.dice.map((d, q) => live.includes(q));
  S.paidRound = Array(S.n).fill(0); S.claim = null; S.claimant = null; S.raises = 0; S.tell = null;
  S.limit = Math.max(1, Math.ceil(Math.min(R.raiseCap, live.reduce((a, q) => a + S.dice[q].length, 0)) / R.capDiv));
  // the starter turns each round, among those still in the game
  let st = S.starter; for (let k = 0; k < S.n; k++) { const q = (S.starter + k) % S.n; if (live.includes(q)) { st = q; break; } }
  S.turn = st; S.starter = (st + 1) % S.n;
  if (S.chips[st] < priceOf(R.low)) { S.bust[st] = true; S.log.push({ bust: st }); return startRound(S, r); }
  S.pending.push({ seat: st, kind: 'open', moves: claims(S, st, R.low) });
}
function claims(S, p, from) {
  const out = [], seen = new Set(), base = from;
  for (const k of [0, ...R.steps]) { const c = base + k; if (c > 140 || seen.has(c)) continue; seen.add(c); if (priceOf(c) <= S.chips[p]) out.push({ claim: c }); }
  // round numbers near a player's own worth are offered too (the claim you would make honestly)
  const own = S.worth[p]; for (const c of [own, own - 5, own + 5]) if (c >= base && c <= 140 && !seen.has(c) && priceOf(c) <= S.chips[p]) { seen.add(c); out.push({ claim: c }); }
  return out.sort((a, b) => a.claim - b.claim);
}
function nextBidder(S) {
  for (let k = 1; k <= S.n; k++) { const q = (S.turn + k) % S.n; if (S.inRound[q] && q !== S.claimant) return q; }
  return null;
}
function queueBid(S) {
  const q = nextBidder(S), alone = S.inRound.filter(Boolean).length <= 1;
  if (q == null || alone) return win(S, S.claimant, 'alone');
  S.turn = q;
  const moves = claims(S, q, S.claim + 1);
  if (priceOf(S.claim) <= S.chips[q]) moves.push({ callout: true });
  moves.push({ fold: true });
  S.pending.push({ seat: q, kind: 'bid', moves });
}
function win(S, p, how, r) {
  S.chips[p] += S.pot; S.log.push({ win: p, pot: S.pot, how }); S.pot = 0; S.lastWin = p;
}
function end(S) {
  S.done = true; const live = inGame(S);
  let w = live[0] ?? 0; if (!live.length) for (let q = 0; q < S.n; q++) if (S.chips[q] > S.chips[w]) w = q;
  S.winner = w; S.log.push({ over: w });
}

export const NEBULA = {
  id: 'nebula', seats: [2, 6],
  setup({ seats, r, opts = {} }) {
    const chips = opts.chips ?? R.chips;
    const S = { n: seats, dice: [...Array(seats)].map(() => R.set.slice()), chips: Array(seats).fill(chips), bust: Array(seats).fill(false), pot: 0, round: 0, starter: (opts.first ?? 0) % seats, pending: [], log: [], done: false, bluffs: Array(seats).fill(0), caught: Array(seats).fill(0), styles: opts.styles || null };
    startRound(S, r);
    return S;
  },
  pending: (S) => S.pending[0] || null,
  apply(S, m, r) {
    const P = S.pending.shift(), p = P.seat;
    if (m.claim != null) {
      pay(S, p, priceOf(m.claim));
      const bluff = m.claim > S.worth[p]; if (bluff) S.bluffs[p]++;
      S.claim = m.claim; S.claimant = p; if (P.kind === 'bid') S.raises++;
      S.tell = S.styles?.[p] ? (bluff ? r() < (S.styles[p].leak ?? 0.5) : r() < (S.styles[p].noise ?? 0.1)) : false;
      S.log.push({ seat: p, claim: m.claim, tell: S.tell, raise: P.kind === 'bid' });
      if (S.raises >= S.limit) return this.reveal(S, r);
      return queueBid(S);
    }
    if (m.fold) { S.inRound[p] = false; loseDice(S, p, 1, r); S.log.push({ seat: p, fold: true }); if (S.inRound.filter(Boolean).length <= 1) { win(S, S.claimant, 'folds'); return startRound(S, r); } return queueBid(S); }
    if (m.callout) {
      pay(S, p, priceOf(S.claim));
      const k = S.claimant, bluff = S.worth[k] < S.claim;
      S.log.push({ seat: p, callout: k, claim: S.claim, worth: S.worth[k], bluff });
      if (bluff) { S.caught[k]++; loseDice(S, k, 2, r); win(S, p, 'callout'); } else { loseDice(S, p, 2, r); win(S, k, 'callout'); }
      return startRound(S, r);
    }
  },
  /** The raise cap reached: every hand still in shown, the claimant's with the bonus. */
  reveal(S, r) {
    const ins = [...Array(S.n).keys()].filter((q) => S.inRound[q]), k = S.claimant;
    const shown = ins.map((q) => ({ seat: q, worth: S.worth[q] + (q === k ? R.revealBonus * (ins.length - 1) : 0) }));
    let best = shown[0]; for (const x of shown) if (x.worth > best.worth || (x.worth === best.worth && x.seat === k)) best = x;
    S.log.push({ reveal: shown });
    for (const x of shown) if (x.seat !== best.seat) loseDice(S, x.seat, 1, r);
    win(S, best.seat, 'reveal');
    startRound(S, r);
  },
  result: (S) => (S.done ? { winner: S.winner, chips: S.chips.slice(), scores: S.chips.slice(), rounds: S.round, bluffs: S.bluffs.slice(), caught: S.caught.slice() } : null),
  view: (S, seat) => ({ seat, n: S.n, mine: S.dice[seat], faces: S.faces?.[seat], worth: S.worth?.[seat], counts: S.dice.map((d) => d.length), chips: S.chips, pot: S.pot, claim: S.claim, claimant: S.claimant, raises: S.raises, limit: S.limit, inRound: S.inRound, paid: S.paidRound, tell: S.claimant !== seat ? S.tell : null, round: S.round, last: S.log[S.log.length - 1] }),
};

// ---------------------------------------------------------------- the odds a bot keeps
/** What the table's folk assume of a tell: how often a bluff shows one, how often an honest claim does. */
const TELL = { leak: 0.6, noise: 0.1 };
/** A hand's worth by how many dice it holds (the dice lost at random): an empirical CDF, made once from its own seeded stream. */
let CDF = null;
function cdf() {
  if (CDF) return CDF;
  const r = rngOf(0x4e42), N = 6000; CDF = [];
  for (let k = 1; k <= R.set.length; k++) {
    const xs = [];
    for (let i = 0; i < N; i++) { const pool = R.set.slice(); while (pool.length > k) pool.splice(Math.floor(r() * pool.length), 1); xs.push(worthOf(pool, pool.map((s) => die(r, s)))); }
    CDF[k] = xs.sort((a, b) => a - b);
  }
  return CDF;
}
/** P(a hand of k dice is worth at least c). */
export function atLeast(k, c) { if (k <= 0) return 0; const xs = cdf()[k]; let lo = 0, hi = xs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (xs[m] < c) lo = m + 1; else hi = m; } return 1 - lo / xs.length; }

/** A bot. Opening: an honest claim a little under its worth, or (`style.bluff`) a bluff over it. Facing a claim: the chance the claimant
 *  holds it (its dice count's odds, weighed down by a tell it reads at `style.read`); it calls out below `style.doubt`, raises honestly
 *  when its own worth beats the claim, sometimes bluffs a raise, and otherwise folds. */
export function nebulaBot(V, P, r, style = {}) {
  const bluffRate = style.bluff ?? 0.25, read = style.read ?? 0.5, doubt = style.doubt ?? 0.3, w = V.worth;
  const pick = (target) => { const cs = P.moves.filter((m) => m.claim != null); if (!cs.length) return null; let b = cs[0]; for (const m of cs) if (Math.abs(m.claim - target) < Math.abs(b.claim - target)) b = m; return b; };
  if (P.kind === 'open') return pick(r() < bluffRate ? w + 6 + Math.floor(r() * 12) : Math.max(6, Math.floor(w * (0.7 + 0.2 * r())))) || P.moves[0];
  // the odds the claimant holds it: its dice count's prior, moved by what its body showed (a tell is `leak / noise` times likelier on a
  // bluff; none, `(1 - leak) / (1 - noise)`), trusted to the power of how well this bot reads (`read`: 0 blind, 1 a sharp eye)
  const k = V.claimant, holds = Math.min(0.98, Math.max(0.02, atLeast(V.counts[k], V.claim)));
  const lr = Math.pow(V.tell ? TELL.leak / TELL.noise : (1 - TELL.leak) / (1 - TELL.noise), read), bluffOdds = ((1 - holds) / holds) * lr;
  const p = 1 / (1 + bluffOdds);
  const call = P.moves.find((m) => m.callout), fold = P.moves.find((m) => m.fold);
  if (call && p < doubt) return call;
  if (w > V.claim) { const m = pick(Math.min(w, V.claim + 1 + Math.floor(r() * Math.max(1, (w - V.claim) * 0.6)))); if (m) return m; }
  if (r() < bluffRate * 0.6) { const m = pick(V.claim + 2 + Math.floor(r() * 6)); if (m) return m; }
  if (call && p < 0.5 && r() < 0.5) return call;
  return fold;
}
