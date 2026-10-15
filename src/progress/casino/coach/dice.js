// ---------------------------------------------------------------------------------------
// THE COACH AT THE DICE TABLES (coach/index.js; docs/plans/CASINO-CLARITY.md sections 5.2 and 5.3): Zodiac and Event Horizon said
// plainly. Zodiac: shut your twelve tiles first; your two dice shut tiles that add up to their sum OR their product, your gold attack die
// reopens the other's; each choice says which tiles it shuts and how many are left. Event Horizon: hit the house's number exactly; each
// handful of dice says, before you throw it, its chance to land exactly and its chance to go over (the sums' exact odds, worked out).
//
// Prior art: Shut the Box's tiles, a craps table's printed odds, the poker clients' pot odds and Monster Train's preview of the result.
//
//   zodiacCoach(ctx)   horizonCoach(ctx)   sumOdds(dice) -> [p(sum)]
// ---------------------------------------------------------------------------------------
import { seatsOf } from './seats.js';
import { stepDie } from '../table.js';

const pct = (p) => (p >= 0.995 ? '100%' : p < 0.005 && p > 0 ? 'under 1%' : `${Math.round(p * 100)}%`);
const ABILITY = { reroll: 'roll your two dice again', downgrade: "shrink someone's attack die", refund: 'take chips back from the pot', scramble: "shuffle someone's shut tiles" };

// ---------------------------------------------------------------- Zodiac
export function zodiacCoach({ T, S, seat, P, mine, R, V }) {
  const shut = (q) => V.tiles[q].filter(Boolean).length, d = V.dice || {}, foe = T.seats === 2 ? 1 - seat : null;
  const lead = [...Array(V.n).keys()].filter((q) => q !== seat).reduce((b, q) => (b == null || shut(q) > shut(b) ? q : b), null);
  const goal = { text: 'Shut all 12 of your tiles before anyone else.', you: { value: shut(seat), of: 12, label: 'tiles shut' }, best: lead != null ? { seat: lead, value: shut(lead) } : null };
  const centre = [{ label: 'Pot', value: `${V.pot} chips`, big: true }];
  if (d.a) centre.push({ label: 'Dice', value: `${d.a} and ${d.b}`, big: true }, { label: 'Attack die', value: `d${V.attack[S.turn]}: ${d.atk}` });
  const moves = []; let say = null;
  if (mine) {
    const k = mine.kind;
    if (k === 'seal') {
      say = mine.moves[0]?.none ? `You rolled ${d.a} and ${d.b}: no tiles add up to ${d.a + d.b} or ${d.a * d.b}, so nothing shuts this turn.`
        : `You rolled ${d.a} and ${d.b}. Shut tiles that add up to ${d.a + d.b} (${d.a} + ${d.b}) or ${d.a * d.b} (${d.a} × ${d.b}).`;
      for (const m of mine.moves) {
        if (m.none) { moves.push({ move: m, label: 'Nothing to shut', what: 'On to your attack', tone: null, size: 'big' }); continue; }
        const left = 12 - shut(seat) - m.tiles.length;
        moves.push({ move: m, label: `Shut ${m.tiles.join(' + ')}`, what: m.by === 'sum' ? `adds up to ${d.a + d.b}` : `adds up to ${d.a * d.b} (the dice multiplied)`, preview: left ? `${left} left to shut` : 'That shuts them all: you win!', tone: left ? null : 'good', size: 'small', tiles: m.tiles });
      }
    } else if (k === 'attack') {
      const pay = mine.moves[0]?.pay != null;
      say = pay ? `Your attack die rolled ${d.atk}: nothing to reopen, so someone pays ${d.atk} chips into the pot.` : `Your gold attack die rolled ${d.atk}: reopen shut tiles of someone else's that add up to ${d.atk}.`;
      for (const m of mine.moves) moves.push(m.pay != null ? { move: m, label: `${T.names[m.target]} pays ${m.pay}`, what: 'into the pot (the winner takes it)', tone: 'good', size: 'big' }
        : { move: m, label: `Reopen ${T.names[m.target]}'s ${m.tiles.join(' + ')}`, what: `${T.names[m.target]} has to shut ${m.tiles.length === 1 ? 'it' : 'them'} again`, preview: `${T.names[m.target]}: ${shut(m.target) - m.tiles.length} shut after this`, tone: 'good', size: 'small', target: m.target, tiles: m.tiles });
    } else if (k.startsWith('lup')) {
      say = 'Doubles! Pick a prize.';
      for (const m of mine.moves) {
        if (m.lock) moves.push({ move: m, label: `Lock tile ${m.lock}: ${m.ability}`, what: `It can never be reopened. When your dice add up to ${m.lock}, you may ${ABILITY[m.ability]}.`, tone: 'good', size: 'small' });
        else if (m.upgrade) moves.push({ move: m, label: `Bigger attack die: d${V.attack[seat]} → d${stepDie(V.attack[seat], 1)}`, what: 'Bigger rolls reopen more tiles', tone: 'good', size: 'big' });
        else if (m.pay != null) moves.push({ move: m, label: `Make ${T.names[m.pay]} pay`, what: 'Roll your attack die: they pay that many chips into the pot', tone: 'good', size: 'small' });
        else if (m.end) moves.push({ move: m, label: 'Done', what: '', tone: null, size: 'small' });
      }
    } else if (k === 'ability.reroll') {
      say = `Your locked tile's power: roll your two dice again?`;
      for (const m of mine.moves) moves.push({ move: m, label: m.reroll ? 'Roll again' : `Keep ${d.a} and ${d.b}`, what: '', tone: m.reroll ? 'risk' : null, size: 'big' });
    } else if (k.startsWith('ability.')) {
      const ab = k.slice(8); say = `Your locked tile's power: ${ABILITY[ab]}. Pick who.`;
      for (const m of mine.moves) moves.push({ move: m, label: T.names[m.target], what: `${shut(m.target)} tiles shut`, tone: 'good', size: 'small' });
    } else if (k === 'end') { say = 'Done.'; for (const m of mine.moves) moves.push({ move: m, label: 'Done', what: '', tone: null, size: 'big' }); }
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Shut', value: `${shut(q)} / 12`, big: true }, { label: 'Attack die', value: `d${V.attack[q]}` }, { label: 'Locks left', value: V.tokens[q] }, { label: 'Chips', value: V.chips[q] }],
    tiles: V.tiles[q].map((t, i) => ({ n: i + 1, shut: !!t, locked: V.locked[q][i] || null })) }), P?.seat);
  if (R) say = R.winner === seat ? `You shut all 12! The pot is yours.` : R.winner != null ? `${T.names[R.winner]} shut all 12 first.` : 'The game ran too long: a draw.';
  return { goal, turn: { say }, moves, seats, centre, extra: { foe } };
}

// ---------------------------------------------------------------- Event Horizon
/** The exact odds of every sum a handful of dice can throw: p[s]. */
export function sumOdds(dice) {
  let p = [1];
  for (const s of dice) { const q = Array(p.length + s).fill(0); for (let a = 0; a < p.length; a++) if (p[a]) for (let f = 1; f <= s; f++) q[a + f] += p[a] / s; p = q; }
  return p;
}
export function horizonCoach({ T, S, seat, P, mine, R, V }) {
  const need = V.total - V.sums[seat];
  const lead = [...Array(V.n).keys()].reduce((b, q) => (V.sums[q] > V.sums[b] && V.sums[q] <= V.total ? q : b), 0);
  const goal = { text: `Roll your dice to add up to exactly ${V.total}. Go over and you're out.`, you: { value: V.sums[seat], of: V.total, label: 'so far' }, best: { seat: lead, value: V.sums[lead] } };
  const centre = [{ label: 'Target', value: V.total, big: true }, { label: 'The house used', value: `${V.par} ${V.par === 1 ? 'die' : 'dice'}` }, { label: 'Pot', value: `${S.pot} chips` }];
  const moves = []; let say = null;
  if (mine) {
    if (mine.kind === 'reroll') {
      say = `You rolled ${V.last?.sum}. You may roll that again once, free.`;
      for (const m of mine.moves) moves.push({ move: m, label: m.reroll ? 'Roll it again (free, once)' : 'Keep it', what: '', tone: m.reroll ? 'risk' : null, size: 'big' });
    } else {
      say = `You need ${need} more. Pick dice to throw: land on exactly ${need} to win. Each die is used once a round.`;
      for (const m of mine.moves) {
        if (m.stand) { moves.push({ move: m, label: 'Stop here', what: `Stay at ${V.sums[seat]} and roll no more this round`, tone: null, size: 'big' }); continue; }
        const p = sumOdds(m.dice), hit = p[need] || 0, over = p.slice(need + 1).reduce((a, b) => a + b, 0), all = V.used[seat].length + m.dice.length;
        moves.push({ move: m, label: m.dice.map((s) => `d${s}`).join(' + '), what: all === V.par ? `Same number of dice as the house: a hit pays ×3` : '',
          preview: `Hit exactly: ${pct(hit)} · Go over: ${pct(over)}`, tone: over > 0.5 ? 'bad' : hit > 0.15 ? 'good' : 'risk', size: 'small', dice: m.dice, odds: { hit, over } });
      }
      say += moves.length > 12 ? ' Pick the dice, then throw.' : '';
    }
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Total', value: V.sums[q], big: true }, { label: 'Needs', value: Math.max(0, V.total - V.sums[q]) }, { label: 'Dice left', value: V.left[q].map((s) => `d${s}`).join(' ') || 'none' }],
    badge: V.sums[q] > V.total ? 'Over: out' : V.sums[q] === V.total ? 'Hit!' : null }), P?.seat);
  if (R) say = R.winner === seat ? `Exactly ${V.total}: you win${R.read === 'exact' ? ' with the house\'s very dice (×5)' : R.read === 'par' ? ' with the house\'s count of dice (×3)' : ''}!` : R.winner != null ? `${T.names[R.winner]} hit ${V.total}.` : 'Nobody hit it: the house keeps the pot.';
  return { goal, turn: { say }, moves, seats, centre, extra: { select: mine && mine.kind !== 'reroll' ? { kind: 'dice', from: V.mine } : null, need } };
}
