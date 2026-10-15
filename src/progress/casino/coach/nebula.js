// ---------------------------------------------------------------------------------------
// THE COACH AT NEBULA BLUFF'S TABLE (coach/index.js; docs/plans/CASINO-CLARITY.md section 5.5): your secret hand's worth, the claim on
// the table and who made it, and each choice with its price and its stake: a claim is honest or a bluff (and by how much), a call says
// the odds the claimant really holds it (from their count of dice: nebula.js `atLeast`; a tell is the reader's own to weigh), a fold
// says what it costs.
//
// Prior art: Perudo's and liar's dice's odds tables, the poker clients' action buttons with the price printed on them.
//
//   nebulaCoach(ctx)
// ---------------------------------------------------------------------------------------
import { atLeast, priceOf } from '../nebula.js';
import { seatsOf } from './seats.js';

const pct = (p) => (p >= 0.995 ? 'almost surely' : p < 0.005 ? 'almost never' : `${Math.round(p * 100)}%`);

export function nebulaCoach({ T, S, seat, P, mine, R, V }) {
  const lead = [...Array(V.n).keys()].filter((q) => q !== seat).reduce((b, q) => (b == null || V.counts[q] > V.counts[b] ? q : b), null);
  const goal = { text: 'Be the last player with dice. Lose dice by bluffing badly, by calling wrong, or by folding.', you: { value: V.counts[seat], of: 6, label: 'dice left' }, best: lead != null ? { seat: lead, value: V.counts[lead] } : null,
    label: 'Dice left', target: 6, unit: 'dice', perSeat: V.counts.map((v, q) => ({ seat: q, value: v })) };
  const centre = [{ label: 'Pot', value: `${V.pot} chips`, big: true }];
  if (V.claim != null) centre.push({ label: 'Claim', value: `${V.claim} by ${V.claimant === seat ? 'you' : T.names[V.claimant]}`, big: true }, { label: 'Raises', value: `${V.raises} of ${V.limit}` });
  if (V.worth != null) centre.push({ label: 'Your hand is worth', value: V.worth, big: true });
  const moves = []; let say = null;
  if (mine) {
    say = mine.kind === 'open' ? `Your hand is worth ${V.worth}. Say what it's worth: tell the truth, or bluff higher! Bigger claims cost more chips.`
      : `${T.names[V.claimant]} claims ${V.claim}. Your hand is worth ${V.worth}. Claim higher, call the bluff, or fold.`;
    for (const m of mine.moves) {
      if (m.claim != null) {
        const bluff = m.claim - V.worth;
        moves.push({ move: m, label: `Claim ${m.claim}`, what: `Costs ${priceOf(m.claim)} chips`, amount: priceOf(m.claim), preview: bluff > 0 ? `A bluff by ${bluff}` : 'True: your hand has it', bluff: bluff > 0, tone: bluff > 0 ? 'risk' : 'good', size: bluff > 0 ? 'small' : 'big', claim: m.claim });
      } else if (m.callout) {
        const holds = atLeast(V.counts[V.claimant], V.claim);
        moves.push({ move: m, label: `Call ${T.names[V.claimant]}'s bluff`, what: `Costs ${priceOf(V.claim)} chips. Wrong, and you lose 2 dice; right, they do`, amount: priceOf(V.claim),
          preview: `With ${V.counts[V.claimant]} dice, a hand that good comes up ${pct(holds)}${V.tell ? ' · and they just showed a tell' : ''}`, tone: holds < 0.4 || V.tell ? 'good' : 'risk', size: 'big', odds: { holds } });
      } else if (m.fold) moves.push({ move: m, label: 'Fold', what: 'Lose 1 die; what you paid stays in the pot', tone: 'bad', size: 'small' });
    }
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Dice', value: V.counts[q], kind: 'lives', big: true }, { label: 'Chips', value: V.chips[q], kind: 'money' }, { label: 'Paid this round', value: V.paid?.[q] ?? 0, kind: 'money' }],
    badge: !V.counts[q] ? 'Out' : V.inRound && !V.inRound[q] ? 'Folded' : q === V.claimant ? `Claims ${V.claim}` : null, tell: q === V.claimant && !!V.tell }), P?.seat);
  if (R) say = R.winner === seat ? 'You are the last with dice: you win!' : `${T.names[R.winner]} is the last with dice.`;
  return { goal, turn: { say }, moves, seats, centre, extra: { faces: V.faces, mine: V.mine } };
}
