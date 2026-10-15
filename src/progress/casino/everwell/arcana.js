// ---------------------------------------------------------------------------------------
// EVERWELL'S MAJOR ARCANA (working name, Espada's to rule; docs/plans/CASINO.md section 3.5): the 22 trumps each player keeps in a pile of
// their own. A flip turns the top of your own pile; it is yours and in play for the round (a boon: the owner, 2026-10-15, "flipping is
// meant to be a boon most of the time, which is why stealing gives your opponent a flipped Major Arcana"), save where the card says
// otherwise (Death resets the round for everyone; the Lovers pool your arcana with another's). An arcana's effect resolves before
// whatever set off its flip (the owner's resolve order). The scoring ones are read at a win (score.js); this keeps the ones that act now.
//
// Prior art: the Tarot's Major Arcana and their meanings (each effect is its card's reading: the Hermit looks ahead, the Wheel turns,
// Justice returns what was taken, the Tower falls), Riichi Mahjong's dora (a turned tile that pays the hand).
//
//   ARCANA [{ id, name, does }]   flip(S, p)   (rules.js calls it; it queues the flipper's choices as decisions)
// ---------------------------------------------------------------------------------------
import { shuffle } from '../table.js';

/** The 22, in their numbers. `does` is the one line a card shows (CLARITY.md: a genre word's job is Espada's; these are the owner's). */
export const ARCANA = [
  { id: 0, name: 'The Fool', does: 'Choose any Major Arcana: it is that one.' },
  { id: 1, name: 'The Magician', does: '+2 for each Ace in your winning hand.' },
  { id: 2, name: 'The High Priestess', does: 'Nothing can reveal your hand.' },
  { id: 3, name: 'The Empress', does: '+2 for each Queen in your winning hand.' },
  { id: 4, name: 'The Emperor', does: '+2 for each King in your winning hand.' },
  { id: 5, name: 'The Hierophant', does: 'Name a rank: +1 for each card of it in your winning hand.' },
  { id: 6, name: 'The Lovers', does: 'Link with a player: neither steals from the other, and your arcana count for both.' },
  { id: 7, name: 'The Chariot', does: '+2 for each Knight in your winning hand.' },
  { id: 8, name: 'Strength', does: 'x2, and +1 for each other Strength on the table.' },
  { id: 9, name: 'The Hermit', does: 'Look at your next nine cards; put any on top, the rest beneath.' },
  { id: 10, name: 'The Wheel of Fortune', does: 'Throw back up to eight cards and draw as many.' },
  { id: 11, name: 'Justice', does: 'Every stolen card goes home; its owner takes it back as if drawn.' },
  { id: 12, name: 'The Hanged Man', does: 'Your discards become your draw pile, and your draw pile your discards.' },
  { id: 13, name: 'Death', does: 'The round starts again; next round everyone begins with two arcana.' },
  { id: 14, name: 'Temperance', does: '+1 for each steal no one used this round.' },
  { id: 15, name: 'The Devil', does: '+1 for each steal made this round, and one more steal for you.' },
  { id: 16, name: 'The Tower', does: 'Your hand goes back into your deck; draw eight new. +4 if you win this round.' },
  { id: 17, name: 'The Stars', does: 'Your discards shuffle back into your deck.' },
  { id: 18, name: 'The Moon', does: 'Your discards are face down from now on.' },
  { id: 19, name: 'The Sun', does: 'Choose a player: their hand is shown to you.' },
  { id: 20, name: 'Judgment', does: 'Choose a player: they cannot steal; +2 for each card they stole.' },
  { id: 21, name: 'The World', does: '+1 for each different arcana on the table.' },
];

/** The flipper's pile turned: the card is in play for them, and what it does now is done or asked. */
export function flip(S, p, why) {
  const P = S.players[p]; if (!P.majors.length) return;
  const id = P.majors.shift();
  S.log.push({ flip: id, seat: p, why });
  enact(S, p, id);
}
/** What an arcana does as it comes into play (a Fool's choice comes back through here). */
export function enact(S, p, id) {
  const P = S.players[p], others = S.players.map((_, q) => q).filter((q) => q !== p);
  P.arcana.push(id);
  const ask = (kind, moves) => S.queue.push({ seat: p, kind, moves });
  switch (id) {
    case 0: P.arcana.pop(); ask('fool', ARCANA.filter((a) => a.id !== 0 && a.id !== 13).map((a) => ({ arcana: a.id }))); break; // (Death is never chosen: the Fool is a boon)
    case 5: ask('hierophant', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((r) => ({ rank: r }))); break;
    case 6: ask('lovers', others.map((q) => ({ target: q }))); break;
    case 9: { const n = Math.min(9, P.deck.length); ask('hermit', [{ top: [] }, ...[...Array(n).keys()].flatMap((i) => [{ top: [i] }, ...[...Array(n).keys()].filter((j) => j > i).map((j) => ({ top: [i, j] }))])]); break; }
    case 10: S.queue.push({ seat: p, kind: 'wheel', lazy: (S2, q) => { const H = S2.players[q].hand, free = H.map((c, i) => i).filter((i) => !H[i].stolen).slice(0, 10), moves = [{ throw: [] }]; for (let m = 1; m < 1 << free.length; m++) { const ix = free.filter((_, k) => m & (1 << k)); if (ix.length <= 8) moves.push({ throw: ix }); } return moves; } }); break;
    case 11: S.queue.push({ internal: (S2) => justice(S2) }); break;
    case 12: { const d = P.deck; P.deck = P.discards.map((x) => x.card); P.discards = d.map((card) => ({ card })); shuffle(S.rng, P.deck); break; }
    case 13: if (S.deathLast) { S.log.push({ death: 'spent' }); break; } S.queue.length = 0; S.queue.push({ internal: (S2) => S2.restart('death') }); break;
    case 15: P.stealsMax += 1; break;
    case 16: { const keep = P.hand.filter((c) => c.stolen); P.deck.push(...P.hand.filter((c) => !c.stolen)); shuffle(S.rng, P.deck); P.hand = keep; while (P.hand.length < 8 && P.deck.length) P.hand.push(P.deck.shift()); P.tower = true; break; }
    case 17: P.deck.push(...P.discards.map((x) => x.card)); P.discards = []; shuffle(S.rng, P.deck); break;
    case 18: P.moon = true; break;
    case 19: ask('sun', others.map((q) => ({ target: q }))); break;
    case 20: if (P.stole) break; ask('judgment', others.map((q) => ({ target: q }))); break;
    default: break; // (1, 2, 3, 4, 7, 8, 14, 21: read at a win)
  }
}
/** The arcana's choices answered. */
export function answer(S, p, kind, m) {
  const P = S.players[p];
  if (kind === 'fool') return enact(S, p, m.arcana);
  if (kind === 'hierophant') P.hierophant = m.rank;
  if (kind === 'lovers') { P.lover = m.target; S.players[m.target].lover = p; }
  if (kind === 'hermit') { const n = Math.min(9, P.deck.length), look = P.deck.splice(0, n), top = m.top.map((i) => look[i]), rest = look.filter((_, i) => !m.top.includes(i)); P.deck.unshift(...top); P.deck.push(...rest); }
  if (kind === 'wheel') { const out = m.throw.slice().sort((a, b) => b - a).map((i) => P.hand.splice(i, 1)[0]); P.deck.push(...out); shuffle(S.rng, P.deck); for (let k = 0; k < out.length && P.deck.length; k++) P.hand.push(P.deck.shift()); }
  if (kind === 'sun') { if (!S.players[m.target].arcana.includes(2)) P.sees = m.target; }
  if (kind === 'judgment') { S.players[m.target].judged = true; P.judgedTarget = m.target; }
}
/** Justice: every stolen card goes home; the thief draws to make up the hand, the owner throws one back as if drawn. */
function justice(S) {
  S.players.forEach((P, q) => {
    for (const c of P.hand.filter((x) => x.stolen)) {
      P.hand.splice(P.hand.indexOf(c), 1); if (P.deck.length) P.hand.push(P.deck.shift());
      const O = S.players[c.from]; delete c.stolen; O.hand.push(c);
      S.queue.push({ seat: c.from, kind: 'discard', lazy: (S2, q2) => S2.players[q2].hand.map((x, i) => ({ discard: i })).filter((mv) => !S2.players[q2].hand[mv.discard].stolen), returned: true });
      S.log.push({ justice: q, to: c.from });
    }
  });
}
