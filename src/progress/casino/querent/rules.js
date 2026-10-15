// ---------------------------------------------------------------------------------------
// QUERENT, THE TAROT GAME (Espada's name, the owner's yes, 2026-10-15; docs/plans/CASINO.md section 3): two to four
// players, each with a Tarot deck of their own split into its Minor Arcana (the draw pile, 56) and its Major Arcana (a pile of 22 trumps
// flipped as boons). Four rounds; the highest score wins. A round deals eight; on your turn you take a ninth (a DRAW from your pile, or a
// STEAL of the top of an opponent's discards: twice a round at most, once a turn, and the robbed player flips a Major Arcana), then win
// with three melds or throw one back. A FATE CLAUSE (declared at your turn's start, one card from winning) names how you will win (by draw
// or by steal: the other is barred), flips an arcana and ends that turn; your hand is then locked (Riichi's rule: what you take, you
// throw back unless it wins). Four of a kind is set aside at once as one set, an arcana flipped and a card drawn to replace it (in the
// first deal, HEAVEN'S BLESSING: two flips). Drawing the very card you stole earlier throws it away and the robbed player flips again.
// Each round's SEAT SUIT turns round the table (Cups, Swords, Pentacles, Wands). Fewer than four at the table: everyone opens a round with
// one arcana flipped. Death resets a round (it is not counted); the next opens with two each.
// Decided here where the doc was open (CASINO.md 3 lists each): the Fate Clause locks the hand; a robbed card goes home to the robbed
// player under Justice; a round with no winner by `cap` turns is void (Mahjong's exhaustive draw); the first seat turns each round.
//
// Prior art: Riichi Mahjong (the draw and discard, calling a discard, riichi, the seat wind, the exhaustive draw, the kong's
// replacement draw), gin rummy's melds, the Tarot's two arcana.
//
//   QUERENT (the game: table.js's interface)   QUERENT_RULES (the numbers)   tenpai(hand, quads)   scoreIfWon(S, p, via, cards?)
// ---------------------------------------------------------------------------------------
import { shuffle } from '../table.js';
import { isWin, best } from './score.js';
import { flip, answer } from './arcana.js';

/** The numbers: rounds, the deal, steals a round, turns a round before it is void, opening flips at a short table, after Death. */
export const QUERENT_RULES = { rounds: 4, deal: 8, steals: 2, cap: 40, shortTable: 1, afterDeath: 2 };
const E = QUERENT_RULES;

const deck = (owner) => { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 14; r++) d.push({ r, s, from: owner }); return d; };
const face = (c) => `${c.r}.${c.s}`;
/** One card from winning: some card would finish the hand. */
export function tenpai(hand, quads = []) { for (let s = 0; s < 4; s++) for (let r = 1; r <= 14; r++) if (isWin([...hand, { r, s }], quads)) return true; return false; }

function startRound(S, why) {
  const death = why === 'death'; S.deathLast = death; if (!death && S.played) { S.round++; S.start = (S.start + 1) % S.n; }
  S.played = true; S.queue.length = 0; S.turnCount = 0; S.steals = 0; S.winner = null;
  if (S.round >= E.rounds) { S.over = true; return; }
  S.players.forEach((P, p) => Object.assign(P, { deck: shuffle(S.rng, deck(p)), majors: shuffle(S.rng, [...Array(22).keys()]), discards: [], hand: [], quads: [], arcana: [], stole: 0, stealsMax: E.steals, fate: null, turns: 0, lover: null, hierophant: null, tower: false, moon: false, sees: null, judged: false, judgedTarget: null, stolenFaces: [], seatSuit: (p + S.round) % 4 }));
  for (const P of S.players) while (P.hand.length < E.deal) P.hand.push(P.deck.shift());
  const opening = death ? E.afterDeath : S.n < 4 ? E.shortTable : 0;
  S.players.forEach((P, p) => { for (let k = 0; k < opening; k++) S.queue.push({ internal: (S2) => flip(S2, p, 'opening') }); });
  S.players.forEach((P, p) => S.queue.push({ internal: (S2) => quads(S2, p, true) }));
  S.turn = S.start; S.queue.push({ internal: beginTurn });
  S.log.push({ round: S.round, why: why || 'deal' });
}
/** Fours set aside as sets: each an arcana flipped and a card drawn to replace it (two flips at the deal: Heaven's blessing). */
function quads(S, p, dealt) {
  const P = S.players[p], counts = {}; for (const c of P.hand) counts[c.r] = (counts[c.r] || 0) + 1;
  const r = Object.keys(counts).map(Number).find((k) => counts[k] >= 4); if (r == null) return false;
  let n = 0; P.hand = P.hand.filter((c) => !(c.r === r && n++ < 4)); P.quads.push(r);
  S.log.push({ quad: r, seat: p, blessing: dealt });
  for (let k = 0; k < (dealt ? 2 : 1); k++) flip(S, p, dealt ? 'blessing' : 'four');
  if (draw(S, p, true) !== 'void') S.queue.push({ internal: (S2) => quads(S2, p, dealt) });
  return true;
}
/** A card from your own pile (its discards shuffled back in when it runs dry). 'void' when there is nothing at all to draw. */
function draw(S, p, replacement) {
  const P = S.players[p];
  if (!P.deck.length) { P.deck = shuffle(S.rng, P.discards.map((x) => x.card)); P.discards = []; if (!P.deck.length) return 'void'; }
  const c = P.deck.shift();
  if (!replacement && P.stolenFaces.includes(face(c))) { // (the card you stole, drawn again: thrown away, and the one you robbed flips again)
    P.discards.push({ card: c, hidden: P.moon }); const from = P.stolenFrom[face(c)]; S.log.push({ redraw: face(c), seat: p, robbed: from });
    flip(S, from, 'redraw'); return 'thrown';
  }
  P.hand.push(c); P.last = c; return 'drawn';
}

function beginTurn(S) {
  const P = S.players[S.turn]; P.turns++; S.turnCount++;
  if (S.turnCount > E.cap * S.n) { S.log.push({ void: S.round }); startRound(S); return; }
  if (!P.fate && tenpai(P.hand, P.quads)) S.queue.push({ seat: S.turn, kind: 'fate', moves: [{ fate: null }, { fate: 'draw' }, ...(canSteal(S, S.turn).length ? [{ fate: 'steal' }] : [])] });
  else S.queue.push({ internal: queueAcquire });
}
function canSteal(S, p) {
  const P = S.players[p]; if (P.stole >= P.stealsMax || P.judged || P.fate?.by === 'draw') return [];
  return S.players.map((_, q) => q).filter((q) => q !== p && q !== P.lover && S.players[q].lover !== p && S.players[q].discards.length);
}
function queueAcquire(S) {
  const p = S.turn, P = S.players[p], moves = [];
  if (P.fate?.by !== 'steal') moves.push({ draw: true });
  for (const q of canSteal(S, p)) moves.push({ steal: q });
  if (!moves.length) moves.push({ draw: true }); // (a steal-bound clause with nothing to steal: it draws, but cannot win by it)
  S.queue.push({ seat: p, kind: 'acquire', moves });
}
function afterAcquire(S, p, via) {
  if (S.restarting) return;
  const P = S.players[p];
  S.queue.push({ internal: (S2) => { quads(S2, p, false); } });
  S.queue.push({ internal: (S2) => {
    const allowed = !P.fate || P.fate.by === via;
    if (allowed && isWin(P.hand, P.quads)) S2.queue.push({ seat: p, kind: 'win', moves: [{ win: true, via }, { win: false }] });
    else queueDiscard(S2, p);
  } });
}
function queueDiscard(S, p) { S.queue.push({ seat: p, kind: 'discard', lazy: discardMoves }); }
/** A discard's choices, made when it is asked (an arcana between may have changed the hand): any card not stolen; a declared hand
 *  throws back what it took. */
export function discardMoves(S, p) {
  const P = S.players[p], free = P.hand.map((c, i) => i).filter((i) => !P.hand[i].stolen);
  const lockedTo = P.fate && P.last && !P.last.stolen ? [P.hand.indexOf(P.last)].filter((i) => i >= 0) : null;
  const ix = lockedTo?.length ? lockedTo : free.length ? free : P.hand.map((c, i) => i);
  return ix.map((i) => ({ discard: i }));
}
function endTurn(S) { S.turn = (S.turn + 1) % S.n; S.queue.push({ internal: beginTurn }); }

/** The round's facts a winning hand is scored against (score.js `best`). */
function ctxOf(S, p, via) {
  const P = S.players[p], L = P.lover != null ? S.players[P.lover] : null;
  const arcana = [...new Set([...P.arcana, ...(L ? L.arcana : [])])], board = S.players.flatMap((Q) => Q.arcana);
  return { seatSuit: P.seatSuit, stole: P.stole, steals: S.steals, stealsLeft: S.players.reduce((a, Q) => a + Math.max(0, Q.stealsMax - Q.stole), 0),
    fate: P.fate ? { ...P.fate, by: via } : null, nextTurn: !!P.fate && P.turns === P.fate.turn + 1, firstDraw: P.turns === 1 && !P.fate, arcana, board,
    hierophant: P.hierophant, judged: P.judgedTarget != null ? S.players[P.judgedTarget].stole : 0, tower: P.tower };
}
/** What a hand would score if it won now (the coach's preview: coach/querent.js); null if it is no win. */
export function scoreIfWon(S, p, via, cards = S.players[p].hand) { const P = S.players[p]; return isWin(cards, P.quads) ? best({ cards, quads: P.quads }, ctxOf(S, p, via)) : null; }
function win(S, p, via) {
  const P = S.players[p], sc = best({ cards: P.hand, quads: P.quads }, ctxOf(S, p, via));
  S.scores[p] += sc.value; S.winner = p; S.log.push({ win: p, via, value: sc.value, tier: sc.tier, notes: sc.notes, steps: sc.steps });
  S.wins.push({ round: S.round, seat: p, value: sc.value, tier: sc.tier, notes: sc.notes, arcana: P.arcana.length, turns: S.turnCount });
  startRound(S);
}

/** Leading internal steps run until a decision is first in the queue (or the game is over). */
function drain(S) {
  let guard = 0; while (!S.over && S.queue[0]?.internal && guard++ < 1000) { const st = S.queue.shift(); S.restarting = false; st.internal(S); }
  const D = S.queue[0]; if (D?.lazy) { D.moves = D.lazy(S, D.seat); delete D.lazy; } // (a choice built as it is asked)
}

export const QUERENT = {
  id: 'querent', seats: [2, 4],
  setup({ seats, r, opts = {} }) {
    const S = { n: seats, round: 0, start: 0, turn: 0, players: [...Array(seats)].map(() => ({ stolenFrom: {} })), queue: [], log: [], rng: r, scores: Array(seats).fill(0), wins: [], over: false, played: false };
    S.restart = (why) => { S.restarting = true; S.log.push({ death: S.round }); startRound(S, why); };
    startRound(S); drain(S);
    return S;
  },
  pending: (S) => (S.over ? null : S.queue[0] || null),
  apply(S, m) {
    const D = S.queue.shift(), p = D.seat, P = S.players[p];
    switch (D.kind) {
      case 'fate':
        if (!m.fate) S.queue.push({ internal: queueAcquire });
        else { P.fate = { by: m.fate, turn: P.turns, first: P.turns === 1 }; S.log.push({ fate: m.fate, seat: p }); flip(S, p, 'fate'); if (P.fate.first) flip(S, p, 'fate.first'); S.queue.push({ internal: endTurn }); }
        break;
      case 'acquire':
        if (m.steal != null) {
          const Q = S.players[m.steal], top = Q.discards.pop(), c = top.card;
          c.stolen = true; c.from = m.steal; P.hand.push(c); P.last = c; P.stole++; S.steals++; P.stolenFaces.push(face(c)); P.stolenFrom[face(c)] = m.steal;
          S.log.push({ steal: face(c), seat: p, from: m.steal });
          flip(S, m.steal, 'robbed'); // (the robbed player's arcana resolves first)
          S.queue.push({ internal: (S2) => afterAcquire(S2, p, 'steal') });
        } else {
          const got = draw(S, p, false);
          if (got === 'void') { S.log.push({ void: S.round }); startRound(S); break; }
          if (got === 'thrown') S.queue.push({ internal: endTurn }); else S.queue.push({ internal: (S2) => afterAcquire(S2, p, 'draw') });
        }
        break;
      case 'win': if (m.win) win(S, p, m.via); else queueDiscard(S, p); break;
      case 'discard': { const [c] = P.hand.splice(m.discard, 1); P.discards.push({ card: c, hidden: P.moon }); if (!D.returned) S.queue.push({ internal: endTurn }); break; }
      default: answer(S, p, D.kind, m); break; // (an arcana's choice)
    }
    drain(S);
  },
  result: (S) => (S.over ? { scores: S.scores.slice(), wins: S.wins, winner: S.scores.indexOf(Math.max(...S.scores)) } : null),
  view: (S, seat) => {
    const P = S.players[seat];
    return { seat, n: S.n, round: S.round, hand: P.hand, quads: P.quads, arcana: P.arcana, seatSuit: P.seatSuit, fate: P.fate, stole: P.stole,
      tops: S.players.map((Q) => { const t = Q.discards[Q.discards.length - 1]; return t ? (t.hidden ? { hidden: true } : t.card) : null; }),
      players: S.players.map((Q, q) => ({ arcana: Q.arcana.length, flipped: Q.arcana.slice(), stole: Q.stole, handSize: Q.hand.length, hand: P.sees === q ? Q.hand : null })), scores: S.scores, // (the Major Arcana are flipped face up: everyone sees which)
      peek: S.queue[0]?.kind === 'hermit' && S.queue[0].seat === seat ? P.deck.slice(0, 9) : null, mine: P.arcana }; // (the Hermit's nine are seen by the one who flipped it)
  },
};
