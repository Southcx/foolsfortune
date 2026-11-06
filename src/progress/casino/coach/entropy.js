// ---------------------------------------------------------------------------------------
// THE COACH AT ENTROPY TACTICS' TABLE (coach/index.js; docs/plans/CASINO-CLARITY.md section 5, ENTROPY-TACTICS.md section 8; GAPS G97):
// version 2's choices said plainly: a card of your hand to play (a number card adds to a tile's sum, exactly 21 turns it yours; a court
// card is a token), then where it goes with what the sum becomes; the carve card by card (keep it, feed it to the Hungry Die for good, or
// discard it for a reshuffle); an empty deck's fatigue or reshuffle with their prices; the bomb's clash with its odds and what a count
// down would set off. Piece ids for the table view (Calissa's layout): a card `c:<id>`, a board tile `t:<x>.<z>`, a token `k:<id>`, the
// Grand Bomb `bomb`, a seat's Arcana `arcana:<seat>`, the Hungry Die `die:<seat>`. A number card on an enemy token (`{ on, v }`) says its
// damage and its x2 against a contrary suit; a card fed (`{ feed }`) is offered in every step you hold the play. The table view's drag asks
// `extra.preview(card, target)` (rules.js previewPlay) for what a card held over a tile or a token would do.
//
// Prior art: Into the Breach's shown outcomes, Slay the Spire's printed intents, Balatro's hand preview, a blackjack table's printed total,
// poker clients' priced buttons.
//
//   entropyCoach(ctx)   clashOdds(V, seat) -> { win, tiles, atk, sides }
// ---------------------------------------------------------------------------------------
import { nameOf, SUITS, isCourt, courtRank, rankOf } from '../entropy/cards.js';
import { ENTROPY_RULES as R, sidesOf, ownerAt, beside, speedOf, previewPlay } from '../entropy/rules.js';
import { maxHpOf } from '../entropy/tokens.js';
import { CLASSES, HEALTH } from '../entropy/classes.js';
import { seatsOf } from './seats.js';

const SUIT_DOES = ['Cups: at the far edge it mends your Arcana and goes back into your deck', 'Swords: it fights tokens it meets and at the far edge pushes the bomb', 'Pentacles: every tile it crosses turns yours, and it holds their back rank', 'Wands: at the far edge it strikes their Arcana'];
const whose = (seat, o) => (o === seat ? 'yours' : o < 0 ? 'nobody\'s' : 'theirs');
const where = (x, z) => `column ${x + 1}, row ${z + 1}`;
/** The push's odds on the roll now: the chance your roll plus your tokens beside the bomb beats their die plus theirs, and the tiles it then moves. */
export function clashOdds(V, seat) {
  const o = 1 - seat, atk = V.ctx.roll + R.push * beside(V, seat), sides = sidesOf(V.fed[o]), add = R.push * beside(V, o); let win = 0, tiles = 0;
  for (let d = 1; d <= sides; d++) { const def = d + add; if (atk > def) { win++; tiles += Math.max(1, Math.floor((atk - def) / sides)); } }
  return { win: win / sides, tiles: win ? tiles / win : 0, atk, sides };
}
const pct = (p) => `${Math.round(p * 100)}%`;
const SAY = {
  empty: 'Your deck is empty. Take fatigue (the draw stops), or shuffle your discard pile back in for a price.',
  play: 'Play cards: a number card adds to a tile\'s sum (exactly 21 turns the tile yours) or hurts one of their tokens. A court card becomes a token on your back rank. Feed the Hungry Die any time.',
  place: 'Choose where it goes.',
  carve: 'Carve your hand: keep a card for next turn, feed it to your Hungry Die (gone for good, the die grows), or discard it.',
};

export function entropyCoach({ T, S, seat, P, mine, R: result, V }) {
  const o = 1 - seat, C = CLASSES[V.cls[seat]], bombOwner = ownerAt(V, V.bomb.x, V.bomb.z);
  const goal = { text: 'Keep the tile under the Grand Bomb from being yours when its counter runs out, and keep your Arcana alive.', you: { value: V.hp[seat], of: HEALTH, label: 'health' }, best: { seat: o, value: V.hp[o] },
    label: 'Health', target: HEALTH, unit: 'health', perSeat: V.hp.map((v, q) => ({ seat: q, value: v })) };
  const centre = [{ label: 'Bomb counter', value: V.counter, big: true }, { label: 'The bomb\'s tile is', value: whose(seat, bombOwner) }, { label: 'Hungry Die', value: `d${sidesOf(V.fed[seat])}` }, { label: 'Bank', value: V.bank[seat] },
    { label: 'Deck', value: V.deckN[seat] }, { label: 'Discard', value: V.disc[seat].length }, { label: 'Fatigue', value: V.fatigue[seat] }];
  if (V.phase === 'bomb') centre.push({ label: 'Die rolled', value: V.ctx.roll, big: true });
  const moves = []; let say = null;
  if (mine) {
    for (const m of mine.moves) {
      if (m.feed != null) { moves.push({ move: m, label: `Feed the ${nameOf(m.feed)}`, what: 'To your Hungry Die, now: gone for good, your deck is thinner, your bank +1', preview: `Fed ${V.fed[seat] + 1}: a d${sidesOf(V.fed[seat] + 1)}`, tone: null, size: 'small', pieceIds: [`c:${m.feed}`, `die:${seat}`] }); continue; }
      if (mine.kind === 'empty') {
        if (m.fatigue) moves.push({ move: m, label: 'Take fatigue', what: 'No cards this turn past what you hold', preview: `You lose ${R.fatigue * (V.fatigue[seat] + 1)}`, tone: 'risk', size: 'big' });
        else moves.push({ move: m, label: 'Reshuffle', what: `Your discard pile (${V.disc[seat].length}) becomes your deck`, preview: `You lose ${R.reshuffle * (V.reshuffles[seat] + 1)}`, tone: 'risk', size: 'big' });
      } else if (mine.kind === 'play') {
        if (m.done) moves.push({ move: m, label: 'Done playing', what: 'On to the carve', tone: null, size: 'big' });
        else if (m.active) moves.push({ move: m, label: C.does.split(':')[0], what: `Costs ${C.cost} of your bank. ${C.does}`, tone: null, size: 'small' });
        else if (isCourt(m.card)) moves.push({ move: m, label: `Play the ${nameOf(m.card)} as a token`, what: `${SUIT_DOES[m.card & 3]}. Rank ${courtRank(m.card)}, health ${maxHpOf(courtRank(m.card))}`, tone: 'good', size: 'small', pieceIds: [`c:${m.card}`] });
        else moves.push({ move: m, label: `Play the ${nameOf(m.card)}`, what: rankOf(m.card) === 1 ? 'Adds 1 or 11 to a tile, or hurts a token by it' : `Adds ${rankOf(m.card)} to a tile, or hurts a token by it`, tone: null, size: 'small', pieceIds: [`c:${m.card}`] });
      } else if (mine.kind === 'place') {
        const c = mine.card;
        if (m.back) { moves.push({ move: m, label: 'Back', what: 'Choose another card', tone: null, size: 'small' }); continue; }
        if (m.on != null) {
          const h = previewPlay(V, seat, c, m), t = V.tokens.find((u) => u.id === m.on), ace = rankOf(c) === 1 ? ` as ${m.v}` : '', x2 = h.mult === 2 ? ` x2 (${SUITS[c & 3]} against ${SUITS[t.suit]})` : '';
          moves.push({ move: m, label: `Hit their ${SUITS[t.suit]} token${ace}: ${h.dmg}`, what: `${m.v}${x2}: ${h.falls ? 'it falls' : `its health ${t.hp} to ${h.hp} of ${t.max}`}`, preview: h.falls ? 'Downed to their discard pile' : null, tone: h.falls ? 'good' : null, size: h.falls ? 'big' : 'small', pieceIds: [`c:${c}`, `k:${m.on}`] });
          continue;
        }
        const [x, z] = m.at, id = [`c:${c}`, `t:${x}.${z}`];
        if (isCourt(c)) { const sp = speedOf(V, { owner: seat, suit: c & 3, speed: courtRank(c) }, R); moves.push({ move: m, label: `Token at ${where(x, z)}`, what: `Advances ${sp} a turn`, tone: 'good', size: 'small', pieceIds: id }); continue; }
        const T = V.tiles[z * R.size + x], sum = T.s + m.v, ace = rankOf(c) === 1 ? ` as ${m.v}` : '';
        if (sum === R.twentyOne) moves.push({ move: m, label: `${where(x, z)}${ace}: 21`, what: `The tile turns yours (it was ${whose(seat, T.o)})`, preview: V.bomb.x === x && V.bomb.z === z ? 'The bomb\'s tile turns yours' : 'Yours, its sum to 0', tone: T.o === seat ? null : 'good', size: 'big', pieceIds: id });
        else if (sum > R.twentyOne) moves.push({ move: m, label: `${where(x, z)}${ace}: bust`, what: `${T.s} + ${m.v} is over 21: the sum goes back to 0, the tile stays ${whose(seat, T.o)}`, tone: 'risk', size: 'small', pieceIds: id });
        else moves.push({ move: m, label: `${where(x, z)}${ace}: ${T.s} to ${sum}`, what: `${R.twentyOne - sum} more turns it, for whoever plays it (the sum is shared)`, tone: R.twentyOne - sum <= 11 ? 'risk' : null, size: 'small', pieceIds: id });
      } else if (mine.kind === 'carve') {
        const c = m.card, id = [`c:${c}`];
        if (m.to === 'keep') moves.push({ move: m, label: `Keep the ${nameOf(c)}`, what: 'Held for next turn: the other seat cannot see it', tone: null, size: 'small', pieceIds: id });
        else moves.push({ move: m, label: `Discard the ${nameOf(c)}`, what: 'Onto your discard pile: a reshuffle brings it back', tone: null, size: 'small', pieceIds: id });
      } else if (mine.kind === 'bomb') {
        const q = clashOdds(V, seat), left = V.counter - V.ctx.roll;
        if (m.push) moves.push({ move: m, label: 'Push the bomb', what: `Your ${V.ctx.roll}${beside(V, seat) ? ` plus ${beside(V, seat)}` : ''} against their d${q.sides}`, preview: q.win ? `${pct(q.win)} to move it about ${q.tiles.toFixed(1)} tiles toward them` : 'No chance on this roll', tone: q.win > 0.5 ? 'good' : 'risk', size: 'big', pieceIds: ['bomb'] });
        else if (m.count) moves.push({ move: m, label: 'Count it down', what: `The counter falls by ${V.ctx.roll}`, preview: left > 0 ? `${V.counter} to ${left}` : `It goes off on ${whose(seat, bombOwner)} tile`, tone: left > 0 ? null : bombOwner === o || (bombOwner < 0 && V.hp[seat] > V.hp[o]) ? 'good' : 'bad', size: 'big', pieceIds: ['bomb'] });
        else if (m.reroll) moves.push({ move: m, label: 'Roll again', what: `The Fool's passive: costs ${R.reroll}, once a turn, and the new roll stands`, tone: null, size: 'small' });
        else if (m.active) moves.push({ move: m, label: 'Lantern', what: `Costs ${C.cost} of your bank: the roll is ${R.lantern} higher`, tone: null, size: 'small' });
      }
    }
    say = mine.kind === 'bomb' ? `You rolled ${V.ctx.roll}. Push the bomb toward them, or count it down. Then your tokens advance.` : mine.kind === 'place' ? `Where does the ${nameOf(mine.card)} go?` : SAY[mine.kind];
  }
  const seats = seatsOf(T, S, (q) => ({ stats: [{ label: 'Health', value: V.hp[q], kind: 'lives', big: true }, { label: 'Die', value: `d${sidesOf(V.fed[q])}`, kind: 'count' }, { label: 'Bank', value: V.bank[q], kind: 'count' },
    { label: 'Deck', value: V.deckN[q], kind: 'count' }, { label: 'Discard', value: V.disc[q].length, kind: 'count' }, { label: 'Fatigue', value: V.fatigue[q], kind: 'count' },
    { label: 'Tiles', value: V.tiles.filter((t) => t.o === q).length, kind: 'count' }, { label: 'Tokens', value: V.tokens.filter((t) => t.owner === q).length, kind: 'count' }], badge: CLASSES[V.cls[q]].label }), P?.seat);
  if (result) {
    const W = { bomb: ': the bomb went off on their tile', 'bomb-neutral': ': the bomb went off on nobody\'s tile, and your health was higher', 'bomb-off': ': the bomb went off their board', strike: ': their Arcana fell to your tokens', fatigue: ': their Arcana fell to fatigue', reshuffle: ': their Arcana fell to a reshuffle' };
    say = result.winner == null ? 'A draw: the bomb went off on nobody\'s tile with your health equal.' : result.winner === seat ? `You win${W[result.how] || ''}.` : `${T.names[result.winner]} wins.`;
  }
  return { goal, turn: { say }, moves, seats, centre, extra: { board: { size: R.size, tiles: V.tiles, tokens: V.tokens, bomb: V.bomb, counter: V.counter }, hand: V.hand[seat].filter((c) => c >= 0), kept: V.kept[seat].filter((c) => c >= 0), picked: mine?.kind === 'place' ? mine.card : null, preview: (card, target) => previewPlay(V, seat, card, target),
    piles: [0, 1].map((q) => ({ deck: V.deckN[q], discard: V.disc[q].length, fed: V.fed[q], fatigue: V.fatigue[q], reshuffles: V.reshuffles[q] })), cls: V.cls, suits: SUITS, passive: C.passive, phase: V.phase } };
}
