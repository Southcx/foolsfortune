// ---------------------------------------------------------------------------------------
// ASTROLL: CHARITY GAMBLE (docs/plans/CASINO.md section 6; GAPS G27; the owner's Astroll set: "hidden deposits, over / under", four to
// six seats). Every round, in secret, each seat drops a chip of 1, 5 or 10 into the charity jar. Each then SAYS which denomination they
// dropped (a public claim, and the bluff: it costs nothing to lie), and bets OVER or UNDER the LINE on what the jar now holds (bets are
// hidden until the reveal). The deposits are shown; a bet that was right shares the jar, a bet that was wrong or landed on the line gets
// nothing, and when nobody was right the jar carries over to the next round. Charity keeps a tenth of every jar that is paid out.
// The line is what the jar holds on average: 5⅓ a seat (the three denominations' mean), rounded. Eight rounds; the most chips wins.
// WHY IT PLAYS: a right bet shares the jar, so a seat wants to be right ALONE: the claims are information the others use and a seat that
// is believed can be steered (a liar's "10" moves bets over). A deposit also costs, and goes into a jar a right bet takes back.
// Decided here where the doc was open (measured by scripts/casino.mjs): the line is rounded 5⅓ x seats, not a house roll; the claims
// come before the bets; the bets are hidden, the claims public; a tie on the line pays no one; a seat with no chips sits out.
//
// Prior art: Perudo's and poker's hidden hand with a public claim (a bluff costs nothing to say), the Keynesian beauty contest and
// parimutuel betting (the fewer who are right, the more each gets), over/under lines, the Nebula Bluff module beside it.
//
//   CHARITY (the game: table.js's interface)   CHARITY_RULES   lineOf(n)   charityBot(view, pending, r, style?)
// ---------------------------------------------------------------------------------------

/** The numbers: the denominations, the purse, the rounds, charity's cut of a paid jar, the seats. */
export const CHARITY_RULES = { denoms: [1, 5, 10], chips: 40, rounds: 8, cut: 0.1, mean: 16 / 3 };
const R = CHARITY_RULES;
/** The line for n seats: what n deposits hold on average, rounded. */
export const lineOf = (n) => Math.round(R.mean * n);

const live = (S) => [...Array(S.n).keys()].filter((q) => S.chips[q] >= 1);
function order(S, from) { const out = []; for (let k = 0; k < S.n; k++) { const q = (from + k) % S.n; if (S.alive.includes(q)) out.push(q); } return out; }

function startRound(S) {
  S.round++; S.alive = live(S);
  if (S.round > R.rounds || S.alive.length < 2) { S.done = true; return; }
  S.dep = Array(S.n).fill(0); S.said = Array(S.n).fill(null); S.bet = Array(S.n).fill(null);
  S.todo = [...order(S, S.starter).map((q) => ({ seat: q, kind: 'deposit' })), ...order(S, S.starter).map((q) => ({ seat: q, kind: 'say' })), ...order(S, S.starter).map((q) => ({ seat: q, kind: 'bet' }))];
  S.starter = (S.starter + 1) % S.n; ask(S);
}
function ask(S) {
  const t = S.todo[0]; if (!t) return resolve(S);
  const moves = t.kind === 'deposit' ? R.denoms.filter((d) => d <= S.chips[t.seat]).map((d) => ({ deposit: d })) : t.kind === 'say' ? R.denoms.map((d) => ({ say: d })) : [{ bet: 'over' }, { bet: 'under' }];
  S.pending = [{ seat: t.seat, kind: t.kind, moves }];
}
function resolve(S) {
  S.pending = []; const line = lineOf(S.alive.length), total = S.dep.reduce((a, b) => a + b, 0), pot = S.jar;
  const right = S.alive.filter((q) => (S.bet[q] === 'over' && total > line) || (S.bet[q] === 'under' && total < line));
  const entry = { deposits: S.alive.map((q) => ({ seat: q, deposit: S.dep[q], said: S.said[q], bet: S.bet[q], right: right.includes(q) })), total, line, pot, winners: right.slice() };
  for (const q of S.alive) { S.lies[q] += S.said[q] !== S.dep[q] ? 1 : 0; S.wins[q] += right.includes(q) ? 1 : 0; }
  if (right.length) {
    const gift = Math.floor(pot * R.cut), share = Math.floor((pot - gift) / right.length);
    for (const q of right) S.chips[q] += share;
    S.charity += gift; S.jar = pot - gift - share * right.length; Object.assign(entry, { share, gift, carry: S.jar });
  } else entry.carry = pot;
  S.hist.push({ deps: S.dep.slice(), said: S.said.slice(), bets: S.bet.slice(), alive: S.alive.slice(), total, line });
  S.log.push(entry); startRound(S);
}

export const CHARITY = {
  id: 'charity', seats: [4, 6],
  setup({ seats, opts = {} }) {
    const S = { n: seats, chips: Array(seats).fill(opts.chips ?? R.chips), jar: 0, round: 0, starter: (opts.first ?? 0) % seats, charity: 0, lies: Array(seats).fill(0), wins: Array(seats).fill(0), hist: [], log: [], pending: [], todo: [], alive: [], done: false };
    startRound(S); return S;
  },
  pending: (S) => S.pending[0] || null,
  apply(S, m) {
    const t = S.todo.shift(), p = t.seat;
    if (m.deposit != null) { S.dep[p] = m.deposit; S.chips[p] -= m.deposit; S.jar += m.deposit; }
    else if (m.say != null) { S.said[p] = m.say; S.log.push({ seat: p, said: m.say }); }
    else S.bet[p] = m.bet;
    ask(S);
  },
  result(S) {
    if (!S.done) return null;
    let w = 0; for (let q = 1; q < S.n; q++) if (S.chips[q] > S.chips[w]) w = q;
    return { winner: w, chips: S.chips.slice(), scores: S.chips.slice(), rounds: Math.min(S.round - 1, R.rounds), charity: S.charity, lies: S.lies.slice(), wins: S.wins.slice(), jar: S.jar };
  },
  /** All a seat may know: its own deposit, everyone's claims, the shown rounds; never another's deposit or bet before the reveal. */
  view: (S, seat) => ({ seat, n: S.n, round: S.round, rounds: R.rounds, line: lineOf(S.alive.length || S.n), chips: S.chips, jar: S.jar, mine: S.dep?.[seat] || 0, said: S.said, bet: S.bet?.[seat] ?? null, alive: S.alive, hist: S.hist, charity: S.charity, last: S.log[S.log.length - 1] }),
};

// ---------------------------------------------------------------- the bot
/** How often each seat has lied, read off the shown rounds: Laplace-smoothed, and the more a seat `count`s the more it trusts its own read
 *  (a low count falls back on the table's prior 0.35). */
export function lieRates(V, count = 0.5) {
  const out = [];
  for (let q = 0; q < V.n; q++) { let lies = 0, seen = 0; for (const h of V.hist) if (h.alive.includes(q)) { seen++; if (h.said[q] !== h.deps[q]) lies++; } const read = (lies + 1) / (seen + 2); out.push(0.35 + (read - 0.35) * Math.min(1, count * (seen / 3))); }
  return out;
}
/** What the jar will hold by one seat's reckoning: its own deposit, each other's claim trusted by their lie rate (else the mean), and the
 *  spread of the unknown (three denominations 1, 5, 10 have a sd of 3.6 each). */
export function estimateJar(V, count = 0.5) {
  const rates = lieRates(V, count); let est = V.mine, others = 0;
  for (const q of V.alive) if (q !== V.seat) { est += (1 - rates[q]) * (V.said[q] ?? R.mean) + rates[q] * R.mean; others++; }
  return { est, sd: Math.sqrt(Math.max(1, others)) * 3.6 };
}
/** A bot. Depositing: a mix by `nerve` (high: larger). Saying: the truth, or (`lie`) another denomination. Betting: the jar it expects (its own
 *  deposit, each other's claim trusted by their lie rate and otherwise the mean) against the line, with noise in proportion to how little it
 *  `count`s. */
export function charityBot(V, P, r, style = {}) {
  const lie = style.lie ?? 0.25, nerve = style.nerve ?? 0.5, count = style.count ?? 0.5, pick = (f) => P.moves.find(f) || P.moves[0];
  if (P.kind === 'deposit') { const big = r() < nerve * 0.6, small = r() < 0.2 * (1 - nerve); const d = big ? 10 : small ? 1 : 5; return pick((m) => m.deposit === d); }
  if (P.kind === 'say') { if (r() < lie) { const o = P.moves.filter((m) => m.say !== V.mine); return o[Math.floor(r() * o.length)] || P.moves[0]; } return pick((m) => m.say === V.mine); }
  const { est, sd } = estimateJar(V, count), z = (est - V.line) / sd;
  const over = z + (r() - 0.5) * (1.2 - count) > 0;
  return pick((m) => m.bet === (over ? 'over' : 'under'));
}
