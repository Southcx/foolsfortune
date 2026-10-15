// ---------------------------------------------------------------------------------------
// THE COACH AT QUERENT'S TABLE (coach/index.js; docs/plans/CASINO-CLARITY.md section 5.1): the tarot game said plainly. The goal (three
// groups of three: a SET is three of a number, a RUN three numbers in a row, colours never matter), the round and the scores; what to do
// now in one line; each choice with what it does and what it would bring (a steal that wins the round, a throw that keeps you one card
// from winning, the hand's score before you take it); your hand's groups found for you (Mahjong Soul's and the Riichi trainers' waits);
// each seat's arcana, steals left and Fate Clause.
//
// Prior art: Riichi trainers' "waits" (how many cards would finish the hand after each discard), Balatro's hand name shown as cards are
// chosen, Slay the Spire's keyword lines on a card (each Major Arcana's `does`).
//
//   querentCoach({ T, S, seat, P, mine, R, V })   shapeOf(hand) -> { groups, pairs, loose }   waitsAfter(hand, quads, drop) -> count
// ---------------------------------------------------------------------------------------
import { isWin, SUITS } from '../querent/score.js';
import { scoreIfWon, QUERENT_RULES } from '../querent/rules.js';
import { ARCANA } from '../querent/arcana.js';
import { seatsOf } from './seats.js';

const RANK_NAME = [null, 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Page', 'Knight', 'Queen', 'King'];
const SUIT_NAME = ['Cups', 'Swords', 'Pentacles', 'Wands'];
export const cardLabel = (c) => (c ? `${RANK_NAME[c.r]} of ${SUIT_NAME[c.s]}` : 'a face-down card');
const fmt = (n) => Math.round(n).toLocaleString('en-GB');

/** The hand's groups as a player would see them: complete melds (sets and runs), then pairs that want a third, then the loose cards; by
 *  index into the hand. The split with the most complete groups, then the most pairs. */
export function shapeOf(hand) {
  const idx = hand.map((c, i) => i).sort((a, b) => hand[a].r - hand[b].r || hand[a].s - hand[b].s);
  let best = { groups: [], pairs: [], loose: idx.slice(), score: -1 };
  const go = (rest, groups, pairs, loose) => {
    if (!rest.length) { const sc = groups.length * 10 + pairs.length; if (sc > best.score) best = { groups: groups.map((g) => g.slice()), pairs: pairs.map((p) => p.slice()), loose: loose.slice(), score: sc }; return; }
    const [f, ...tail] = rest, rf = hand[f].r;
    const same = tail.filter((i) => hand[i].r === rf), up1 = tail.find((i) => hand[i].r === rf + 1), up2 = tail.find((i) => hand[i].r === rf + 2);
    if (same.length >= 2) { groups.push([f, same[0], same[1]]); go(tail.filter((i) => i !== same[0] && i !== same[1]), groups, pairs, loose); groups.pop(); }
    if (up1 != null && up2 != null) { groups.push([f, up1, up2]); go(tail.filter((i) => i !== up1 && i !== up2), groups, pairs, loose); groups.pop(); }
    for (const o of [same[0], up1, up2]) if (o != null) { pairs.push([f, o]); go(tail.filter((i) => i !== o), groups, pairs, loose); pairs.pop(); }
    loose.push(f); go(tail, groups, pairs, loose); loose.pop();
  };
  if (hand.length <= 10) go(idx, [], [], []);
  return { groups: best.groups, pairs: best.pairs, loose: best.loose };
}
/** The table view's id for each card of a hand (vfx/bazaarlayout.js `h:<rank>.<suit>#<nth>`: the nth of that face, counted in hand order). */
export function handIds(hand) { const seen = {}; return hand.map((c) => { const k = `${c.r}.${c.s}`; seen[k] = (seen[k] ?? -1) + 1; return `h:${k}#${seen[k]}`; }); }
/** How many different cards would finish the hand once `drop` (an index) is thrown back: the more, the better the throw. */
export function waitsAfter(hand, quads, drop) {
  const rest = hand.filter((_, i) => i !== drop); let n = 0;
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 14; r++) if (isWin([...rest, { r, s }], quads)) n++;
  return n;
}

export function querentCoach({ T, S, seat, P, mine, R, V }) {
  const me = S.players[seat], hand = V.hand, quads = V.quads || [];
  const lead = V.scores.reduce((b, v, q) => (v > V.scores[b] ? q : b), 0);
  const goal = { text: 'Make 3 groups of 3 cards: 3 of the same number (7 7 7) or 3 in a row (4 5 6). Colours don\'t matter.', you: { value: V.scores[seat], label: 'points' }, best: { seat: lead, value: V.scores[lead] }, round: { value: Math.min(V.round + 1, QUERENT_RULES.rounds), of: QUERENT_RULES.rounds },
    label: 'Points', unit: 'points', perSeat: V.scores.map((v, q) => ({ seat: q, value: v })), groups: { value: 0, of: 3 } };
  const shape = shapeOf(hand); goal.groups.value = shape.groups.length;
  const hid = handIds(hand); // (the table view's ids for the hand's cards: `h:<rank>.<suit>#<nth>`, nth in hand order)
  const extra = { shape, seatSuit: SUITS[V.seatSuit], fate: V.fate, arcana: (V.mine || []).map((id) => ({ id, name: ARCANA[id].name, does: ARCANA[id].does })) };
  const centre = [{ label: 'Round', value: `${goal.round.value} of ${goal.round.of}`, big: true }, { label: 'Your seat suit', value: SUIT_NAME[V.seatSuit] }];
  const moves = [];
  let say = null;
  if (mine) {
    switch (mine.kind) {
      case 'acquire': {
        say = 'Take a card: draw from your pile, or steal the card someone just threw away (a steal gives them a Major Arcana).';
        for (const m of mine.moves) {
          if (m.draw) { moves.push({ move: m, label: 'Draw a card', what: 'The top of your own pile: a surprise', tone: null, size: 'big', pieceIds: ['deck'] }); continue; }
          const top = V.tops[m.steal], won = top && !top.hidden ? scoreIfWon(S, seat, 'steal', [...hand, top]) : null;
          moves.push({ move: m, label: `Steal the ${cardLabel(top)} from ${T.names[m.steal]}`, what: `${T.names[m.steal]} flips a Major Arcana: a power-up for them`,
            preview: won ? `Wins the round for ${fmt(won.value)}!` : null, tone: won ? 'good' : 'risk', size: won ? 'big' : 'small', pieceIds: [`top:${m.steal}`] });
        }
        break;
      }
      case 'discard': {
        say = me.fate ? 'Your hand is locked by the Fate Clause: throw back the card you just took.' : 'Throw one card back. Keep the cards that make groups.';
        for (const m of mine.moves) {
          const c = hand[m.discard], w = waitsAfter(hand, quads, m.discard), inGroup = shape.groups.some((g) => g.includes(m.discard));
          moves.push({ move: m, label: `Throw back the ${cardLabel(c)}`, what: inGroup ? 'Breaks one of your groups' : 'Not in a group',
            preview: w ? `Then ${w} different card${w === 1 ? '' : 's'} would win` : null, tone: inGroup ? 'bad' : w ? 'good' : null, size: 'small', card: m.discard, waits: w, pieceIds: [hid[m.discard]] });
        }
        break;
      }
      case 'win': {
        const via = mine.moves.find((m) => m.win)?.via, sc = scoreIfWon(S, seat, via);
        say = 'Your 9 cards make 3 groups: you can win the round!';
        extra.score = sc;
        for (const m of mine.moves) moves.push(m.win ? { move: m, label: 'Win the round!', what: sc ? sc.notes[0] : '', preview: sc ? `${fmt(sc.value)} points` : null, tone: 'good', size: 'big' }
          : { move: m, label: 'Not yet', what: 'Throw a card back and hope for a bigger hand', tone: 'risk', size: 'small' });
        break;
      }
      case 'fate':
        say = 'You are one card from winning. Declare the Fate Clause? Win on your very next turn for a big bonus, but your hand locks.';
        for (const m of mine.moves) moves.push(m.fate ? { move: m, label: `Fate Clause: I'll win by ${m.fate === 'draw' ? 'drawing' : 'stealing'}`, what: 'You flip a Major Arcana now; your turn ends; your hand locks',
          preview: m.fate === 'draw' ? 'Win next turn by drawing: score x4' : 'Win next turn by stealing: +2', tone: 'risk', size: 'big' } : { move: m, label: 'Not now', what: 'Play your turn as usual', tone: null, size: 'small' });
        break;
      case 'fool': say = 'The Fool: pick which Major Arcana it becomes.'; for (const m of mine.moves) moves.push({ move: m, label: ARCANA[m.arcana].name, what: ARCANA[m.arcana].does, tone: null, size: 'small', pieceIds: [`fool:${m.arcana}`] }); break;
      case 'hierophant': say = 'The Hierophant: name a number. Each card of it in your winning hand scores +1.'; for (const m of mine.moves) moves.push({ move: m, label: RANK_NAME[m.rank], what: `${hand.filter((c) => c.r === m.rank).length} in your hand now`, tone: null, size: 'small', pieceIds: [`rank:${m.rank}`] }); break;
      case 'hermit': say = 'The Hermit: look at your next nine cards and choose which goes on top.'; for (const m of mine.moves) if (m.top.length <= 1) moves.push({ move: m, label: m.top.length ? `${cardLabel(V.peek?.[m.top[0]])} on top` : 'Keep the order', what: '', tone: null, size: 'small' }); break;
      case 'wheel': say = 'The Wheel of Fortune: pick cards to throw back, and draw as many new ones.'; extra.select = { kind: 'cards', max: 8 }; for (const m of mine.moves) moves.push({ move: m, label: m.throw.length ? `Swap ${m.throw.length}: ${m.throw.map((i) => cardLabel(hand[i])).join(', ')}` : 'Swap none', what: '', tone: null, size: 'small', cards: m.throw, pieceIds: m.throw.map((i) => hid[i]) }); break;
      default: { // (the arcana that choose a player: the Lovers, the Sun, Judgement)
        const A = { lovers: ARCANA[6], sun: ARCANA[19], judgment: ARCANA[20] }[mine.kind];
        say = A ? `${A.name}: choose a player. ${A.does}` : 'Choose.';
        for (const m of mine.moves) moves.push({ move: m, label: T.names[m.target] ?? '?', what: '', tone: null, size: 'small' });
      }
    }
  }
  const seats = seatsOf(T, S, (q) => {
    const Q = V.players[q], Pq = S.players[q];
    return { stats: [{ label: 'Points', value: fmt(V.scores[q]), kind: 'score', big: true }, { label: 'Arcana', value: Q.arcana, kind: 'count' }, { label: 'Steals left', value: Math.max(0, (Pq.stealsMax ?? 2) - Q.stole), kind: 'count' }], flipped: (Q.flipped || []).map((id) => ({ id, name: ARCANA[id].name, does: ARCANA[id].does })),
      badge: Pq.fate ? `Fate Clause (${Pq.fate.by})` : null, top: V.tops[q] ? (V.tops[q].hidden ? 'face down' : cardLabel(V.tops[q])) : null };
  }, P?.seat);
  if (R) { const w = R.winner; say = w === seat ? `You win the table with ${fmt(R.scores[seat])}!` : `${T.names[w]} wins the table with ${fmt(R.scores[w])}.`; }
  return { goal, turn: { say }, moves, seats, centre, extra };
}
