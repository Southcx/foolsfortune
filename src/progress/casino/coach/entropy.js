// ---------------------------------------------------------------------------------------
// THE COACH AT ENTROPY TACTICS' TABLE (coach/index.js; docs/plans/CASINO-CLARITY.md section 5; GAPS G97): the hand as what it can become
// (a run or flush summons, a pair or more casts, a court card enchants, the rest feeds the die), the board's places as choices, the bomb's
// clash with its odds. Piece ids for the table view (Calissa's layout): a card `c:<id>`, a board tile `t:<x>.<z>`, a token `k:<id>`, the
// Grand Bomb `bomb`, a seat's Arcana `arcana:<seat>`.
//
// Prior art: Into the Breach's shown outcomes, Slay the Spire's printed intents, Balatro's hand-type preview, poker clients' priced buttons.
//
//   entropyCoach(ctx)   clashOdds(V, seat) -> { win, tiles, atk, sides }
// ---------------------------------------------------------------------------------------
import { nameOf, SUITS } from '../entropy/cards.js';
import { ENTROPY_RULES as R, zoneOf, sidesOf } from '../entropy/rules.js';
import { CLASSES, HEALTH } from '../entropy/classes.js';
import { seatsOf } from './seats.js';

const KIND = { warrior: 'Warrior', rogue: 'Rogue', mage: 'Mage', healer: 'Healer' };
const zoneName = (seat, z) => { const zo = zoneOf(z); return zo === -1 ? 'the middle rank' : zo === seat ? 'your ground' : 'their ground'; };
const beside = (V, p) => V.tokens.filter((t) => t.owner === p && Math.abs(t.x - V.bomb.x) + Math.abs(t.z - V.bomb.z) <= 1).length;
/** The push's odds on the roll now: the chance your roll plus your tokens beside the bomb beats their die plus theirs, and the tiles it then moves. */
export function clashOdds(V, seat) {
  const o = 1 - seat, atk = V.ctx.roll + R.push * beside(V, seat), sides = sidesOf(V.fed[o]), add = R.push * beside(V, o); let win = 0, tiles = 0;
  for (let d = 1; d <= sides; d++) { const def = d + add; if (atk > def) { win++; tiles += Math.max(1, Math.floor((atk - def) / sides)); } }
  return { win: win / sides, tiles: win ? tiles / win : 0, atk, sides };
}
const pct = (p) => `${Math.round(p * 100)}%`;
const SAY = { play: 'Turn your hand into power: a run or flush of 3 or more summons, a pair or more casts, a court card enchants. Or feed it all to your die.', place: 'Choose where it stands.', enchant: 'Choose the token to enchant.', cast: 'Choose their token to hit.', keep: 'Keep up to two cards for next turn (they stay secret); the rest feed your die.', act: 'Move and strike with each token once; a second action by one token costs bank.' };

export function entropyCoach({ T, S, seat, P, mine, R: result, V }) {
  const o = 1 - seat, C = CLASSES[V.cls[seat]];
  const goal = { text: 'Keep the Grand Bomb off your ground and your Arcana alive. It goes off when its counter runs out: the ground it sits on loses.', you: { value: V.hp[seat], of: HEALTH, label: 'health' }, best: { seat: o, value: V.hp[o] },
    label: 'Health', target: HEALTH, unit: 'health', perSeat: V.hp.map((v, q) => ({ seat: q, value: v })) };
  const centre = [{ label: 'Bomb counter', value: V.counter, big: true }, { label: 'The bomb is on', value: zoneName(seat, V.bomb.z) }, { label: 'Hungry Die', value: `d${sidesOf(V.fed[seat])}` }, { label: 'Bank', value: V.bank[seat] }];
  if (V.phase === 'bomb') centre.push({ label: 'Die rolled', value: V.ctx.roll, big: true });
  const moves = []; let say = null;
  const ids = (m) => (m.cards || []).map((c) => `c:${c}`), tok = (id) => V.tokens.find((x) => x.id === id);
  if (mine) {
    for (const m of mine.moves) {
      if (mine.kind === 'play') {
        if (m.feed) moves.push({ move: m, label: 'Feed the whole hand', what: 'Every card fills your Hungry Die: more actions and a bigger die', preview: `Bank +${V.hand[seat].length}`, tone: null, size: 'small' });
        else if (m.active === 'cycle') moves.push({ move: m, label: 'Cycle', what: `Costs ${C.cost} of your bank: draw three more cards`, tone: null, size: 'small' });
        else if (m.play === 'royal') moves.push({ move: m, label: 'ROYAL STRAIGHT FLUSH', what: 'The Grand Bomb goes off on their ground: you win', preview: 'You win now', tone: 'good', size: 'big', pieceIds: ids(m) });
        else if (m.play === 'summon') { const b = R.tokens[m.kind]; moves.push({ move: m, label: `Summon a ${KIND[m.kind]}`, what: `${m.n} cards of ${m.how === 'run' ? 'a run' : 'one suit'}`, preview: `${b.hp + m.n - 3 + (V.cls[seat] === 'empress' ? 1 : 0)} health, ${b.atk} strike, ${b.mv ? `moves ${b.mv}` : 'cannot move'}`, tone: 'good', size: 'big', pieceIds: ids(m) }); }
        else if (m.play === 'cast') moves.push({ move: m, label: m.n === 2 ? 'Cast: 2 to a token' : `Cast: ${R.spell[m.n]} to their Arcana`, what: `${m.n} of a kind`, preview: m.n === 2 ? 'Choose their token next' : `They fall to ${V.hp[o] - R.spell[m.n]}`, tone: 'good', size: m.n > 2 ? 'big' : 'small', pieceIds: ids(m) });
        else if (m.play === 'enchant') moves.push({ move: m, label: `Enchant with the ${nameOf(m.cards[0])}`, what: 'A token of the same suit gains 2 health and a point of strike; any other 1 health', tone: 'good', size: 'small', pieceIds: ids(m) });
      } else if (mine.kind === 'place') moves.push({ move: m, label: `Place at column ${m.place[0] + 1}, row ${m.place[1] + 1}`, what: zoneName(seat, m.place[1]), tone: null, size: 'small', pieceIds: [`t:${m.place[0]}.${m.place[1]}`] });
      else if (mine.kind === 'enchant' || mine.kind === 'cast') { const t = tok(m.on); moves.push({ move: m, label: `${KIND[t.kind]} at column ${t.x + 1}, row ${t.z + 1}`, what: `${t.hp} health`, tone: mine.kind === 'cast' ? 'good' : null, size: 'small', pieceIds: [`k:${t.id}`] }); }
      else if (mine.kind === 'keep') moves.push({ move: m, label: m.keep ? `Keep the best ${m.keep}` : 'Keep none', what: m.keep ? 'Held for next turn: the other seat cannot see them' : 'All the rest feed the die', tone: null, size: 'small' });
      else if (mine.kind === 'act') {
        const cost = (id) => { const a = (V.ctx.acted[id] || 0) + 1; return a <= 1 ? 0 : 2 ** (a - 1); };
        if (m.end) moves.push({ move: m, label: 'End actions', what: 'On to the bomb', tone: null, size: 'big' });
        else if (m.move != null) moves.push({ move: m, label: `Move ${KIND[tok(m.move).kind]} to column ${m.to[0] + 1}, row ${m.to[1] + 1}`, what: cost(m.move) ? `Costs ${cost(m.move)} of your bank` : 'Free', tone: null, size: 'small', pieceIds: [`k:${m.move}`, `t:${m.to[0]}.${m.to[1]}`] });
        else if (m.mend != null) moves.push({ move: m, label: 'Mend a token', what: `Heal ${R.tokens.healer.mend}`, tone: 'good', size: 'small', pieceIds: [`k:${m.mend}`, `k:${m.on}`] });
        else if (m.strike != null) { const e = m.arcana ? null : tok(m.on); moves.push({ move: m, label: m.arcana ? 'Strike their Arcana' : `Strike their ${KIND[e.kind]}`, what: cost(m.strike) ? `Costs ${cost(m.strike)} of your bank` : 'Free', preview: m.arcana ? `They fall to ${V.hp[o] - tok(m.strike).atk}` : `${e.hp} health there`, tone: 'good', size: 'small', pieceIds: [`k:${m.strike}`, m.arcana ? `arcana:${o}` : `k:${m.on}`] }); }
        else if (m.active) moves.push({ move: m, label: C.does.split(':')[0], what: `Costs ${C.cost} of your bank. ${C.does}`, tone: null, size: 'small' });
      } else if (mine.kind === 'bomb') {
        const q = clashOdds(V, seat), left = V.counter - V.ctx.roll, zo = zoneOf(V.bomb.z);
        if (m.push) moves.push({ move: m, label: 'Push the bomb', what: `Your ${V.ctx.roll}${beside(V, seat) ? ` plus ${beside(V, seat)}` : ''} against their d${q.sides}`, preview: q.win ? `${pct(q.win)} to move it about ${q.tiles.toFixed(1)} tiles toward them` : 'No chance on this roll', tone: q.win > 0.5 ? 'good' : 'risk', size: 'big', pieceIds: ['bomb'] });
        else if (m.count) moves.push({ move: m, label: 'Count it down', what: `The counter falls by ${V.ctx.roll}`, preview: left > 0 ? `${V.counter} to ${left}` : `It goes off on ${zoneName(seat, V.bomb.z)}`, tone: left > 0 ? null : zo === o || (zo === -1 && V.hp[seat] > V.hp[o]) ? 'good' : 'bad', size: 'big', pieceIds: ['bomb'] });
        else if (m.reroll) moves.push({ move: m, label: 'Roll again', what: 'The Fool\'s passive: once a turn, and the new roll stands', tone: null, size: 'small' });
        else if (m.active) moves.push({ move: m, label: 'Lantern', what: `Costs ${C.cost} of your bank: the roll is 3 higher`, tone: null, size: 'small' });
      }
    }
    say = mine.kind === 'bomb' ? `You rolled ${V.ctx.roll}. Push the bomb toward them, or count it down.` : SAY[mine.kind];
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Health', value: V.hp[q], kind: 'lives', big: true }, { label: 'Die', value: `d${sidesOf(V.fed[q])}`, kind: 'count' }, { label: 'Bank', value: V.bank[q], kind: 'count' }, { label: 'Tokens', value: V.tokens.filter((t) => t.owner === q).length, kind: 'count' }], badge: CLASSES[V.cls[q]].label }), P?.seat);
  if (result) say = result.winner === seat ? `You win${result.how === 'royal' ? ' with a royal straight flush' : result.how.startsWith('bomb') ? ': the bomb went off on their side' : ': their Arcana fell'}.` : `${T.names[result.winner]} wins.`;
  return { goal, turn: { say }, moves, seats, centre, extra: { board: { size: R.size, tokens: V.tokens, bomb: V.bomb, counter: V.counter }, hand: V.hand[seat].filter((c) => c >= 0), cls: V.cls, suits: SUITS, passive: C.passive, phase: V.phase } };
}
