// ---------------------------------------------------------------------------------------
// THE COACH AT CHARITY GAMBLE'S TABLE (coach/index.js; docs/plans/CASINO-CLARITY.md section 5): your secret deposit, the line, what each
// seat has SAID and how often each has lied (read off the shown rounds: the table's history is public, so a liar can be known), and for
// each choice what it costs and what it tells: a deposit says what it costs and which way it leans the jar, a claim says whether it is
// true, a bet says the jar you expect (your deposit and the others' claims, weighed by their record) against the line.
//
// Prior art: parimutuel boards (the odds shown beside each bet), poker clients' action buttons with the price printed on them.
//
//   charityCoach(ctx)
// ---------------------------------------------------------------------------------------
import { estimateJar, lieRates } from '../charity.js';
import { seatsOf } from './seats.js';

export function charityCoach({ T, S, seat, P, mine, R, V }) {
  const lead = [...Array(V.n).keys()].filter((q) => q !== seat).reduce((b, q) => (b == null || V.chips[q] > V.chips[b] ? q : b), null);
  const goal = { text: `After ${V.rounds} rounds, have the most chips. A right bet shares the jar, so be right when few others are.`, you: { value: V.chips[seat], of: null, label: 'chips' }, best: lead != null ? { seat: lead, value: V.chips[lead] } : null,
    label: 'Chips', target: null, unit: 'chips', perSeat: V.chips.map((v, q) => ({ seat: q, value: v })) };
  const rates = lieRates(V, 1), kind = P?.kind;
  const centre = [{ label: 'Round', value: `${V.round} of ${V.rounds}`, big: false }, { label: 'The line', value: V.line, big: true }, { label: 'The jar', value: `${V.jar} chips` }];
  if (V.mine) centre.push({ label: 'Your deposit', value: V.mine });
  const moves = []; let say = null;
  if (mine) {
    const est = estimateJar(V, 1);
    if (kind === 'deposit') {
      say = 'Drop a chip in the charity jar in secret: 1, 5 or 10. No one else can see it.';
      for (const m of mine.moves) moves.push({ move: m, label: `Drop ${m.deposit}`, what: `Costs ${m.deposit} chips; it goes in the jar`, preview: m.deposit === 10 ? 'Leans the jar over the line' : m.deposit === 1 ? 'Leans the jar under the line' : 'Leans neither way', tone: null, size: 'big', deposit: m.deposit });
    } else if (kind === 'say') {
      say = `You dropped ${V.mine}. Now say what you dropped: the truth, or a lie.`;
      for (const m of mine.moves) { const lie = m.say !== V.mine; moves.push({ move: m, label: `Say "${m.say}"`, what: lie ? 'A lie: it may push others to bet wrong' : 'True', preview: lie ? 'A bluff' : 'Honest', tone: lie ? 'risk' : 'good', size: lie ? 'small' : 'big', say: m.say }); }
    } else {
      say = `The line is ${V.line}. Bet whether the jar holds more or less. By your reckoning it holds about ${est.est.toFixed(0)}.`;
      for (const m of mine.moves) {
        const lean = m.bet === 'over' ? est.est - V.line : V.line - est.est;
        moves.push({ move: m, label: m.bet === 'over' ? `Over ${V.line}` : `Under ${V.line}`, what: 'Right: share the jar. Wrong, or on the line: nothing', preview: `You expect about ${est.est.toFixed(0)}: ${lean > 1 ? 'this looks right' : lean < -1 ? 'this looks wrong' : 'close'}`, tone: lean > 1 ? 'good' : lean < -1 ? 'bad' : 'risk', size: 'big', bet: m.bet });
      }
    }
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Chips', value: V.chips[q], kind: 'money', big: true }, { label: 'Said', value: V.said?.[q] ?? '·', kind: 'count' }, { label: 'Lies', value: V.hist.length ? `${Math.round(rates[q] * 100)}%` : '·', kind: 'count' }],
    badge: !V.alive.includes(q) ? 'Out' : V.said?.[q] != null ? `Says ${V.said[q]}` : null }), P?.seat);
  if (R) say = R.winner === seat ? 'You finish with the most chips: you win!' : `${T.names[R.winner]} finishes with the most chips.`;
  return { goal, turn: { say }, moves, seats, centre, extra: { mine: V.mine, said: V.said, line: V.line, last: V.last, hist: V.hist } };
}
