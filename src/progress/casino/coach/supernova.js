// ---------------------------------------------------------------------------------------
// THE COACH AT SUPERNOVA RUN'S TABLE (coach/index.js; docs/plans/CASINO-CLARITY.md section 5.4): roll your dice for points, or change
// them. Each choice says what it does and, for a reaction, what it tends to bring: the reaction run a few hundred times on your hand
// (supernova.js `reactHand`, its own seeded stream) for the points you can expect, the chance of a Supernova, the chance of losing dice.
//
// Prior art: Balatro's hand-type preview (what a play is before you make it), a craps table's printed odds, Machi Koro's dice as an engine.
//
//   supernovaCoach(ctx)   reactionOdds(hand) -> { points, nova, shrink, grow }
// ---------------------------------------------------------------------------------------
import { reactHand, SUPERNOVA_RULES } from '../supernova.js';
import { rngOf } from '../table.js';
import { seatsOf } from './seats.js';

const pct = (p) => (p < 0.005 && p > 0 ? 'under 1%' : `${Math.round(p * 100)}%`);
const dice = (h) => h.map((s) => `d${s}`).join(' ') || 'no dice';
const memo = new Map();
const after = (hand, out, add) => { const h = hand.slice(); for (const s of out) h.splice(h.indexOf(s), 1); return [...h, ...add].sort((a, b) => a - b); };
/** A reaction's odds on this hand: mean points, the chance of a Supernova, of ending with fewer dice, of ending with more. */
export function reactionOdds(hand) {
  const key = hand.join(','); if (memo.has(key)) return memo.get(key);
  const r = rngOf(0x5a1e), N = 400; let pts = 0, nova = 0, shrink = 0, grow = 0;
  for (let i = 0; i < N; i++) { const x = reactHand(hand, r); pts += x.points; if (x.nova) nova++; if (x.hand.length < hand.length) shrink++; if (x.hand.length > hand.length) grow++; }
  const out = { points: Math.round(pts / N), nova: nova / N, shrink: shrink / N, grow: grow / N };
  if (memo.size > 200) memo.clear(); memo.set(key, out);
  return out;
}

export function supernovaCoach({ T, S, seat, P, mine, R, V }) {
  const lead = [...Array(V.n).keys()].filter((q) => q !== seat).reduce((b, q) => (b == null || V.points[q] > V.points[b] ? q : b), null);
  const goal = { text: `First to ${V.threshold} points wins. A d20 that rolls 20 is a SUPERNOVA: your points double.`, you: { value: V.points[seat], of: V.threshold, label: 'points' }, best: lead != null ? { seat: lead, value: V.points[lead] } : null,
    label: 'Points', target: V.threshold, unit: 'points', perSeat: V.points.map((v, q) => ({ seat: q, value: v })) };
  const centre = [{ label: 'Round', value: V.round, big: false }, { label: 'To win', value: V.threshold, big: true }];
  const moves = []; let say = null;
  if (mine) {
    say = 'Roll all your dice for points, or change them: fuse two into a bigger one, or split one into two.';
    for (const m of mine.moves) {
      if (m.react) {
        const o = reactionOdds(V.mine);
        moves.push({ move: m, label: `Roll all ${V.mine.length} dice`, what: 'A die on its top number makes a copy; a 1 makes it shrink',
          preview: `About ${o.points} points${o.nova ? ` · Supernova ${pct(o.nova)}` : ''}${o.shrink > 0.2 ? ` · lose a die ${pct(o.shrink)}` : ''}`, tone: o.nova ? 'good' : null, size: 'big', odds: o });
      } else if (m.fuse) {
        moves.push({ move: m, label: `Fuse ${dice(m.fuse)} → d${m.into}`, what: m.into === 20 ? 'A d20! Each time it rolls 20: SUPERNOVA' : 'One bigger die: bigger rolls, and a step toward a d20',
          preview: `Your dice after: ${dice(after(V.mine, m.fuse, [m.into]))}`,
          tone: m.into === 20 ? 'good' : null, size: m.into === 20 ? 'big' : 'small' });
      } else if (m.split != null) {
        moves.push({ move: m, label: `Split d${m.split} → ${dice(m.into)}`, what: 'More dice: more chances to make copies', preview: `Your dice after: ${dice(after(V.mine, [m.split], m.into))}`, tone: null, size: 'small' });
      }
    }
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Points', value: V.points[q], kind: 'score', big: true }, { label: 'Dice', value: dice(V.hands[q]), kind: 'lives' }], badge: V.hands[q].includes(20) ? 'Has a d20' : null, hand: V.hands[q] }), P?.seat);
  if (R) say = R.winner === seat ? `You reach ${R.points[seat]}: you win!` : `${T.names[R.winner]} wins with ${R.points[R.winner]}.`;
  return { goal, turn: { say }, moves, seats, centre, extra: { last: V.last, rules: SUPERNOVA_RULES } };
}
