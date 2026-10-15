// ---------------------------------------------------------------------------------------
// ASTROLL: EVENT HORIZON (docs/plans/CASINO.md section 5; the owner's design doc): players against each other and the HOUSE. The dealer
// rolls a hidden handful of the standard set's dice and announces the ROUND TOTAL and how many dice made it (its PAR). Each player antes
// into the pot, then in turn rolls dice of their own set (any of the dice not yet rolled this round, at least one) and adds them to a
// running total: exactly the round total wins at once; over it busts; under it, the next player goes. A player out of dice, or who
// stands, waits. The first to hit the round total takes the pot, and the house adds a bonus by how well they read the dealer: with the
// same number of dice as par, three times the ante; with the very same dice, five times. Nobody hits: the house keeps the pot. The LAST
// seat has one free reroll of a roll, once a round (the owner's "benefits people who risk it on the guess"; it was the first's, which
// stacked it on going first: measured, +0.57 antes a round at four seats). The first seat turns round by round.
// Decided here where the doc was open (CASINO.md 5): each die of your set rolls once a round (the choice of which dice is the skill); the
// interference the doc names (swap, steal, reroll others' dice) waits for phase 2, as abilities.
//
// Prior art: blackjack (a total, the bust), golf's par (the dealer's count), Yahtzee's choice of what to roll, Cee-lo's house.
//
//   EVENT_HORIZON (the game: table.js's interface)   EH (the numbers)   horizonBot(view, pending, r, style?)
// ---------------------------------------------------------------------------------------
import { die, DND_SET } from './table.js';

/** The numbers: the ante, the dealer's handful (how many dice, weights for 1..4), the house's bonus by read (times the ante, on top of
 *  the pot): `hit` any exact total, `par` the dealer's count, `exact` the dealer's very dice. */
export const EH = { ante: 10, dealer: [0.15, 0.35, 0.35, 0.15], bonus: { hit: 1, par: 3, exact: 5 } }; // (the owner's 1x, 3x, 5x, paid by the house on top of the pot: measured, a solo bot's return is -0.12 antes a round; scripts/casino.mjs)

const key = (dice) => dice.slice().sort((a, b) => a - b).join(',');
function subsets(dice) { const out = []; for (let m = 1; m < 1 << dice.length; m++) { const s = []; for (let i = 0; i < dice.length; i++) if (m & (1 << i)) s.push(i); out.push(s); } return out; }

function dealerHand(r) {
  let u = r(), k = 1; for (let i = 0; i < EH.dealer.length; i++) { if (u < EH.dealer[i]) { k = i + 1; break; } u -= EH.dealer[i]; }
  const pool = DND_SET.slice(), dice = [];
  for (let i = 0; i < k; i++) dice.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return { dice, total: dice.reduce((a, s) => a + die(r, s), 0) };
}
function next(S) {
  for (let k = 1; k <= S.n; k++) { const q = (S.turn + k) % S.n; if (!S.out[q]) { S.turn = q; return queue(S); } }
  S.done = true; S.log.push({ house: S.pot }); S.houseNet += S.pot; S.pot = 0;
}
function queue(S) {
  const left = S.left[S.turn], moves = subsets(left).map((ix) => ({ dice: ix.map((i) => left[i]) }));
  moves.push({ stand: true });
  S.pending.push({ seat: S.turn, kind: 'roll', moves });
}

export const EVENT_HORIZON = {
  id: 'eventhorizon', seats: [1, 4],
  setup({ seats, r, opts = {} }) {
    const D = dealerHand(r), ante = opts.ante ?? EH.ante;
    const S = { n: seats, dealer: D, total: D.total, par: D.dice.length, ante, pot: ante * seats, net: Array(seats).fill(-ante), houseNet: 0, sums: Array(seats).fill(0), used: [...Array(seats)].map(() => []), left: [...Array(seats)].map(() => DND_SET.slice()), out: Array(seats).fill(false), reroll: true, turn: (opts.first ?? 0) % seats, pending: [], log: [], done: false };
    S.rerollSeat = (S.turn + seats - 1) % seats; // (the free reroll is the last seat's: going first was worth +0.57 antes a round with it too)
    queue(S);
    return S;
  },
  pending: (S) => S.pending[0] || null,
  apply(S, m, r) {
    const P = S.pending.shift(), p = P.seat;
    if (P.kind === 'reroll') { if (m.reroll) { S.sums[p] -= S.last.sum; S.reroll = false; const sum = S.last.dice.reduce((a, s) => a + die(r, s), 0); S.sums[p] += sum; S.last.sum = sum; S.log.push({ reroll: sum }); } return this.resolve(S, p); }
    if (m.stand) { S.out[p] = true; return next(S); }
    const sum = m.dice.reduce((a, s) => a + die(r, s), 0);
    for (const s of m.dice) S.left[p].splice(S.left[p].indexOf(s), 1);
    S.used[p].push(...m.dice); S.sums[p] += sum; S.last = { dice: m.dice, sum };
    S.log.push({ seat: p, roll: m.dice, sum, total: S.sums[p] });
    if (p === S.rerollSeat && S.reroll && S.sums[p] !== S.total) { S.pending.push({ seat: p, kind: 'reroll', moves: [{ reroll: true }, { reroll: false }] }); return; }
    this.resolve(S, p);
  },
  resolve(S, p) {
    if (S.sums[p] === S.total) {
      const par = S.used[p].length === S.par, exact = key(S.used[p]) === key(S.dealer.dice), bonus = (exact ? EH.bonus.exact : par ? EH.bonus.par : EH.bonus.hit) * S.ante;
      S.net[p] += S.pot + bonus; S.houseNet -= bonus; S.winner = p; S.read = exact ? 'exact' : par ? 'par' : 'hit'; S.log.push({ win: p, pot: S.pot, bonus, read: S.read }); S.pot = 0; S.done = true; return;
    }
    if (S.sums[p] > S.total || !S.left[p].length) S.out[p] = true;
    next(S);
  },
  result: (S) => (S.done ? { winner: S.winner ?? null, read: S.read ?? null, net: S.net.slice(), houseNet: S.houseNet, total: S.total, par: S.par } : null),
  view: (S, seat) => ({ seat, n: S.n, total: S.total, par: S.par, sums: S.sums, left: S.left, used: S.used, mine: S.left[seat], need: S.total - S.sums[seat], last: S.last }),
};

/** A bot: roll the handful whose average lands nearest what it needs without its top end overshooting much; a reroll when it went over or
 *  well short. `style.bold` (0..1) leans it to roll more at once. */
export function horizonBot(V, P, r, style = {}) {
  if (P.kind === 'reroll') return { reroll: V.sums[V.seat] > V.total || V.need > 6 };
  const need = V.need, bold = style.bold ?? 0.4;
  let best = P.moves[0], bs = -Infinity;
  for (const m of P.moves) {
    if (m.stand) continue;
    const mean = m.dice.reduce((a, s) => a + (s + 1) / 2, 0), lo = m.dice.length, hi = m.dice.reduce((a, s) => a + s, 0);
    if (lo > need) continue;
    const s = -Math.abs(need - mean * (0.85 + 0.3 * bold)) - (hi > need ? (hi - need) * (1 - bold) * 0.15 : 0) + (m.dice.length === V.par ? 0.5 : 0) + r() * 0.01;
    if (s > bs) { bs = s; best = m; }
  }
  return bs === -Infinity ? { stand: true } : best;
}
