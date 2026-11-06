// ---------------------------------------------------------------------------------------
// ASTROLL: ENTROPY TACTICS, VERSION 2 (docs/plans/ENTROPY-TACTICS.md section 8, South 2026-11-06: "a 'deck-carving' srpg where everyone
// starts with the same base material (a tarot deck)"; GAPS G95): two Major Arcana on a 7 x 7 board of TILES, each with an OWNER (seat 0,
// seat 1, or nobody: -1) and a SUM (0 to 21), and the Grand Bomb on the middle tile. Each seat has its OWN DECK of the 56 Minor Arcana.
// A TURN: DRAW up to five (an empty deck: take FATIGUE, 1 then 2 then 3 for the game, or RESHUFFLE the discard pile back in, 2 then 4
// then 6); PLAY any number of cards, each a card picked (`play`) then its place (`place`, or back): a NUMBER card on a tile you own or
// beside one (or beside a token of yours), its value added to the
// tile's shared sum (exactly 21 FLIPS the tile to the player who made it, its sum to 0; over 21 BUSTS, the sum to 0, the owner kept), a
// COURT card as a TOKEN on a back-rank tile of yours; CARVE the rest card by card: keep up to two (the Hermit three), FEED the others to the
// Hungry Die (gone for good: the die grows d4 > d6 > d8 > d10 > d12 > d20 at 0, 4, 9, 15, 22, 30 fed, the bank +1) or DISCARD them (a
// reshuffle brings them back); ROLL the Hungry Die and PUSH the bomb (version 1's open clash) or COUNT its counter down; then every token of
// yours ADVANCES its speed in tiles along its column toward the far edge (tokens.js).
// THE BOMB goes off at counter 0 (30, down one a round and by every count): whoever owns the tile under it loses; nobody's tile, the higher
// health wins, an equal health a draw. Pushed off past a back rank, that rank's player loses. An Arcana at 0 health loses.
// Kept from version 1 (section 8 does not change them): the Hungry Die, its bank and the push clash, the counter, the classes' actives,
// the Fool's re-roll for 1, the second seat's opening bank of 2. Gone (8.8): the poker groups, the enchantments, the royal straight flush.
// Choices where section 8 is silent (each a line below or in tokens.js): fatigue and the reshuffle once a turn's draw, the draw then
// stopping on fatigue (Hearthstone's is a card a time: at five a turn that is 15 in one draw); a number card may go on the bomb's tile and
// on a tile a token stands on; a court card only on a back-rank tile you still own; the Hungry Die's fed cards stay hidden (version 1).
//
// Prior art: blackjack (21 exactly, the bust, the soft ace), Hearthstone's fatigue, Dominion's deck as the thing you build (carving is its
// trashing), Othello's and Go's ground turned by placement, Duelyst (a general with health on a small board), Into the Breach's shown
// threats. The table engine: table.js.
//
//   ENTROPY (the game: table.js's interface)   ENTROPY_RULES   startOwner(z)   sidesOf(fed)   legalTiles(S, p)   placeMoves(S, p, card)
//   determinize(view, r)   cloneState(S)   ownerAt(S, x, z)   tokAt(S, x, z)   beside(S, p)   strengthOf(S, t)   speedOf(S, t, R)
//   pending kinds: empty { fatigue | reshuffle }, play { card | done | active }, place { at, v? | back }, carve { card, to: keep | feed |
//   discard }, bomb { push | count | reroll | active }   opts: { classes: [id, id], first }
//   result: { winner (null a draw), how: bomb | bomb-neutral | bomb-off | draw | strike | fatigue | reshuffle, hp, rounds, stats }
// ---------------------------------------------------------------------------------------
import { shuffle, die, rngOf, DIE_STEPS } from '../table.js';
import { SUITS, suitOf, isCourt, valuesOf, courtRank } from './cards.js';
import { CLASSES, HEALTH } from './classes.js';
import { advanceTokens, strengthOf, speedOf } from './tokens.js';

export const ENTROPY_RULES = {
  size: 7, // (7 x 7 tiles: the board of version 1, 8.1)
  bomb: [3, 3], // (the Grand Bomb starts on the middle tile, 8.1)
  counter: 30, // (the counter: 30, down one a round and by every count; 30 since 2026-11-06, a game at 20 ran 7 rounds)
  hand: 5, // (draw up to five a turn, 8.2)
  keep: 2, hermitKeep: 3, // (cards kept between turns: two, the Hermit three, 8.2.3)
  twentyOne: 21, // (exactly this flips a tile; past it busts, 8.3)
  feedAt: [0, 4, 9, 15, 22, 30], // (cards fed for each step of the Hungry Die, d4 .. d20, 8.2.3)
  reroll: 1, // (the Fool's re-roll costs 1: free, the Fool won 67%, 2026-11-06)
  second: 2, // (the second seat opens with a bank of 2: at 1 the first seat still won 62%, 2026-11-06)
  push: 1, // (a token beside the bomb adds 1 to its side's roll in a clash, version 1's Q4 default)
  suitStep: 1, // (a class's own suit's tokens advance one tile further, 8.7)
  chariotStep: 1, // (the Chariot's passive, kept from version 1: every token one tile further)
  empressRank: 1, // (the Empress's passive in version 2: tokens she places one rank stronger, never faster)
  charge: 2, bloom: 5, lantern: 3, cycle: 3, // (the actives as in version 1: +2 strength, mend 5, roll +3, draw 3)
  swordPush: 1, // (a sword token at the far edge pushes the bomb one tile toward them, 8.4)
  fatigue: 1, // (fatigue's step: 1, then 2, then 3, the count kept for the game, 8.6)
  reshuffle: 2, // (the reshuffle's step: 2, then 4, then 6, 8.6)
};
const R = ENTROPY_RULES, N = R.size;
let rng = rngOf(1); // (the stream of the move being made: set by setup and apply, never kept in a state, so a state clones)
/** Who owns a row at the start: seat 0 its back rank (row 6), seat 1 row 0, nobody the five rows between (8.1). */
export const startOwner = (z) => (z === N - 1 ? 0 : z === 0 ? 1 : -1);
export const sidesOf = (fed) => DIE_STEPS[Math.max(0, R.feedAt.filter((t) => fed >= t).length - 1)];
export const back = (p) => (p === 0 ? N - 1 : 0);
export const dir = (p) => (p === 0 ? -1 : 1);
export const other = (p) => 1 - p;
const at = (x, z) => z * N + x;
export const ownerAt = (S, x, z) => S.tiles[at(x, z)].o;
export const tokAt = (S, x, z) => S.tokens.find((t) => t.x === x && t.z === z);
const mine = (S, p) => S.tokens.filter((t) => t.owner === p);
const keepSize = (S, p) => (S.cls[p] === 'hermit' ? R.hermitKeep : R.keep);
const isBomb = (S, x, z) => S.bomb.x === x && S.bomb.z === z;
const AT = [...Array(N * N).keys()].map((i) => Object.freeze([i % N, (i / N) | 0])); // (a tile's [x, z], one array a tile shared by every move: the search makes thousands)

/** The tiles a number card of seat `p` may go on: its own, and any beside its own or beside one of its tokens (8.3). Indices z * 7 + x. */
export function legalTiles(S, p) {
  const ok = new Uint8Array(N * N), T = S.tiles;
  const near = (x, z) => { ok[z * N + x] = 1; if (x > 0) ok[z * N + x - 1] = 1; if (x < N - 1) ok[z * N + x + 1] = 1; if (z > 0) ok[(z - 1) * N + x] = 1; if (z < N - 1) ok[(z + 1) * N + x] = 1; };
  for (let i = 0; i < N * N; i++) if (T[i].o === p) near(i % N, (i / N) | 0);
  for (const t of S.tokens) if (t.owner === p) near(t.x, t.z);
  const out = []; for (let i = 0; i < N * N; i++) if (ok[i]) out.push(i); return out;
}
/** Has seat `p` anywhere at all for a number card (a tile of its own or a token)? */
const anyGround = (S, p) => S.tiles.some((t) => t.o === p) || S.tokens.some((t) => t.owner === p);

export function lose(S, p, how) { if (!S.done) { S.done = true; S.winner = other(p); S.how = how; S.log.push({ over: S.winner, how }); } }
function drawn(S, how) { if (!S.done) { S.done = true; S.winner = null; S.how = how; S.log.push({ over: -1, how }); } }
/** Health lost by seat `p` (a strike, fatigue, a reshuffle): 0 loses, by that cause. */
export function hurt(S, p, n, how) { S.hp[p] -= n; if (S.hp[p] <= 0) lose(S, p, how); }
function detonate(S, by) {
  const o = ownerAt(S, S.bomb.x, S.bomb.z); S.log.push({ boom: o, by });
  if (o >= 0) return lose(S, o, 'bomb');
  if (S.hp[0] !== S.hp[1]) return lose(S, S.hp[0] < S.hp[1] ? 0 : 1, 'bomb-neutral');
  drawn(S, 'draw'); // (nobody's tile, equal health: a draw, 8.5)
}
/** The bomb moved `tiles` toward seat `p`'s far edge: past a back rank, that rank's player loses (8.5). */
export function moveBomb(S, p, tiles) {
  S.bomb.z += dir(p) * tiles;
  if (S.bomb.z < 0 || S.bomb.z >= N) { S.bomb.z = Math.max(0, Math.min(N - 1, S.bomb.z)); S.log.push({ boom: other(p), by: p, off: true }); lose(S, other(p), 'bomb-off'); }
}

// ------------------------------------------------------------- the turn's steps
function beginTurn(S, p, r) {
  S.cur = p; S.ctx = { boost: 0, rerolled: false, cycled: false, lit: false, roll: 0, emptied: false, card: null };
  if (p === S.first) { S.round++; if (S.round > 1) { S.counter--; if (S.counter <= 0) { detonate(S, null); return; } } }
  drawStep(S, r);
}
/** Draw up to five. An empty deck asks once a turn: fatigue (the draw stops) or a reshuffle (the draw goes on); no discard, fatigue. */
function drawStep(S, r) {
  const p = S.cur;
  while (S.hand[p].length < R.hand) {
    if (!S.deck[p].length) {
      if (S.ctx.emptied) break;
      if (!S.disc[p].length) { takeFatigue(S, p); if (S.done) return; break; }
      S.phase = 'empty'; S.pending = [{ seat: p, kind: 'empty', moves: [{ fatigue: true }, { reshuffle: true }] }]; return;
    }
    S.hand[p].push(S.deck[p].pop());
  }
  toPlay(S);
}
function takeFatigue(S, p) { S.ctx.emptied = true; S.fatigue[p]++; const n = R.fatigue * S.fatigue[p]; S.stats.fatigue++; S.log.push({ fatigue: p, n }); hurt(S, p, n, 'fatigue'); }
function takeReshuffle(S, p, r) {
  S.ctx.emptied = true; S.reshuffles[p]++; const n = R.reshuffle * S.reshuffles[p]; S.stats.reshuffles++;
  S.deck[p] = shuffle(r, S.disc[p]); S.disc[p] = []; S.log.push({ reshuffle: p, n, cards: S.deck[p].length }); hurt(S, p, n, 'reshuffle');
}
function backTiles(S, p) { const z = back(p), out = []; for (let x = 0; x < N; x++) if (ownerAt(S, x, z) === p && !tokAt(S, x, z) && !isBomb(S, x, z)) out.push(at(x, z)); return out; }
/** The play step: a card of the hand that has somewhere to go (then `placeMoves` for it), ending the step, and the class's play actives. */
function playMoves(S) {
  const p = S.cur, hand = S.hand[p], moves = [];
  let tiles = null, backs = null;
  for (const c of hand) {
    if (isCourt(c)) { if ((backs ??= backTiles(S, p).length)) moves.push({ card: c }); }
    else if ((tiles ??= anyGround(S, p))) moves.push({ card: c });
  }
  const C = CLASSES[S.cls[p]];
  if (S.bank[p] >= C.cost) {
    if (C.active === 'cycle' && !S.ctx.cycled && S.deck[p].length) moves.push({ active: 'cycle' });
    if (C.active === 'charge' && !S.ctx.boost && mine(S, p).length) moves.push({ active: 'charge' });
    if (C.active === 'bloom' && S.hp[p] < HEALTH) moves.push({ active: 'bloom' });
  }
  if (moves.length) moves.unshift({ done: true });
  return moves;
}
/** Where the picked card may go: a court card on a free back-rank tile of yours; a number card on any legal tile, an ace as 1 or 11; or back. */
export function placeMoves(S, p, c) {
  const moves = [{ back: true }];
  if (isCourt(c)) { for (const i of backTiles(S, p)) moves.push({ at: AT[i] }); return moves; }
  const vs = valuesOf(c); for (const i of legalTiles(S, p)) for (const v of vs) moves.push({ at: AT[i], v });
  return moves;
}
function toPlay(S) { const moves = playMoves(S); if (!moves.length) return toCarve(S); S.phase = 'play'; S.ctx.card = null; S.pending = [{ seat: S.cur, kind: 'play', moves }]; }
function toPlace(S, c) { S.phase = 'place'; S.ctx.card = c; S.pending = [{ seat: S.cur, kind: 'place', card: c, moves: placeMoves(S, S.cur, c) }]; }
function playNumber(S, c, m) {
  const p = S.cur, T = S.tiles[at(m.at[0], m.at[1])];
  S.hand[p].splice(S.hand[p].indexOf(c), 1); S.disc[p].push(c);
  const was = T.s; T.s += m.v;
  if (T.s === R.twentyOne) { const from = T.o; T.o = p; T.s = 0; S.stats.flips++; S.log.push({ turned: p, at: m.at, from, card: c }); }
  else if (T.s > R.twentyOne) { T.s = 0; S.stats.busts++; S.log.push({ bust: p, at: m.at, was, card: c }); }
  else S.log.push({ add: p, at: m.at, v: m.v, sum: T.s, card: c });
}
function playCourt(S, c, m) {
  const p = S.cur; S.hand[p].splice(S.hand[p].indexOf(c), 1);
  const t = { id: S.nextTok++, owner: p, card: c, suit: suitOf(c), rank: courtRank(c) + (S.cls[p] === 'empress' ? R.empressRank : 0), speed: courtRank(c), x: m.at[0], z: m.at[1] };
  S.tokens.push(t); S.log.push({ summon: p, kind: `token of ${SUITS[t.suit]}`, suit: t.suit, rank: t.rank, at: m.at, card: c });
}
function toCarve(S) {
  const p = S.cur; if (!S.hand[p].length) return finishCarve(S);
  const room = S.kept[p].length < keepSize(S, p), moves = [];
  for (const c of S.hand[p]) { if (room) moves.push({ card: c, to: 'keep' }); moves.push({ card: c, to: 'feed' }, { card: c, to: 'discard' }); }
  S.phase = 'carve'; S.pending = [{ seat: p, kind: 'carve', moves }];
}
function carve(S, m) {
  const p = S.cur; S.hand[p].splice(S.hand[p].indexOf(m.card), 1);
  if (m.to === 'keep') S.kept[p].push(m.card);
  else if (m.to === 'feed') { S.fedCards[p].push(m.card); S.fed[p]++; S.bank[p]++; S.log.push({ feed: p, die: sidesOf(S.fed[p]), fed: S.fed[p] }); } // (which card is never said: the munch history is hidden)
  else { S.disc[p].push(m.card); S.log.push({ discard: p, card: m.card }); }
  toCarve(S);
}
function finishCarve(S) { const p = S.cur; S.hand[p] = S.kept[p]; S.kept[p] = []; toBomb(S); }
function toBomb(S) { // (the roll is made as the bomb comes up: the die is public the moment it is)
  S.phase = 'bomb'; S.ctx.roll = die(rng, sidesOf(S.fed[S.cur]));
  S.pending = [{ seat: S.cur, kind: 'bomb', moves: bombMoves(S) }];
}
function bombMoves(S) {
  const p = S.cur, C = CLASSES[S.cls[p]], moves = [{ push: true }, { count: true }];
  if (S.cls[p] === 'fool' && !S.ctx.rerolled && S.bank[p] >= R.reroll) moves.push({ reroll: true });
  if (C.active === 'lantern' && !S.ctx.lit && S.bank[p] >= C.cost) moves.push({ active: 'lantern' });
  return moves;
}
export const beside = (S, p) => mine(S, p).filter((t) => Math.abs(t.x - S.bomb.x) + Math.abs(t.z - S.bomb.z) <= 1).length;
function resolveBomb(S, m, r) {
  const p = S.cur, q = other(p), roll = S.ctx.roll;
  if (m.push) {
    const atk = roll + R.push * beside(S, p), dsides = sidesOf(S.fed[q]), def = die(r, dsides) + R.push * beside(S, q);
    const tiles = atk > def ? Math.max(1, Math.floor((atk - def) / dsides)) : 0;
    S.log.push({ push: p, atk, def, tiles });
    if (tiles) moveBomb(S, p, tiles);
  } else { S.counter -= roll; S.log.push({ count: p, roll, counter: S.counter }); if (S.counter <= 0) detonate(S, p); }
  if (S.done) return;
  advanceTokens(S, p, r, TOKEN_KIT);
  if (!S.done) beginTurn(S, other(p), r);
}

const TOKEN_KIT = { R, lose, hurt, moveBomb }; // (what tokens.js needs of the kernel, handed in so the two never import each other)

export const ENTROPY = {
  id: 'entropy', seats: [2, 2],
  setup({ r, opts = {} }) {
    rng = r;
    const cls = opts.classes || ['fool', 'fool'], first = (opts.first ?? 0) % 2;
    const tiles = []; for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) tiles.push({ o: startOwner(z), s: 0 });
    const S = { n: 2, cls, hp: [HEALTH, HEALTH], hand: [[], []], kept: [[], []], deck: [shuffle(r, [...Array(56).keys()]), shuffle(r, [...Array(56).keys()])], disc: [[], []], fedCards: [[], []],
      bank: [first === 0 ? 0 : R.second, first === 1 ? 0 : R.second], fed: [0, 0], fatigue: [0, 0], reshuffles: [0, 0], tiles, tokens: [], nextTok: 1,
      bomb: { x: R.bomb[0], z: R.bomb[1] }, counter: R.counter, round: 0, first, cur: first, phase: 'play', ctx: null, pending: [], log: [], done: false, winner: null, how: null,
      stats: { flips: 0, busts: 0, fatigue: 0, reshuffles: 0 } };
    beginTurn(S, first, r); return S;
  },
  pending: (S) => (S.done ? null : S.pending[0] || null),
  apply(S, m, r) {
    rng = r; const P = S.pending[0], p = P.seat;
    switch (P.kind) {
      case 'empty':
        if (m.reshuffle) { takeReshuffle(S, p, r); if (S.done) return; return drawStep(S, r); }
        takeFatigue(S, p); if (S.done) return; return toPlay(S);
      case 'play':
        if (m.done) return toCarve(S);
        if (m.active) {
          const C = CLASSES[S.cls[p]]; S.bank[p] -= C.cost; S.log.push({ active: m.active, seat: p });
          if (m.active === 'cycle') { S.ctx.cycled = true; for (let i = 0; i < R.cycle && S.deck[p].length; i++) S.hand[p].push(S.deck[p].pop()); }
          else if (m.active === 'charge') S.ctx.boost = R.charge;
          else if (m.active === 'bloom') S.hp[p] = Math.min(HEALTH, S.hp[p] + R.bloom);
          return toPlay(S);
        }
        return toPlace(S, m.card);
      case 'place':
        if (!m.back) { if (isCourt(P.card)) playCourt(S, P.card, m); else playNumber(S, P.card, m); }
        return toPlay(S);
      case 'carve': return carve(S, m);
      case 'bomb':
        if (m.reroll) { S.bank[p] -= R.reroll; S.ctx.rerolled = true; S.ctx.roll = die(r, sidesOf(S.fed[p])) + (S.ctx.lit ? R.lantern : 0); S.pending[0].moves = bombMoves(S); return; }
        if (m.active === 'lantern') { S.bank[p] -= CLASSES.hermit.cost; S.ctx.lit = true; S.ctx.roll += R.lantern; S.pending[0].moves = bombMoves(S); return; }
        return resolveBomb(S, m, r);
    }
  },
  result: (S) => (S.done ? { winner: S.winner, how: S.how, scores: S.hp.slice(), chips: S.hp.slice(), hp: S.hp.slice(), rounds: S.round, counter: S.counter, classes: S.cls.slice(), stats: { ...S.stats } } : null),
  /** All a seat may know: the board, banks, the counter, the discard piles, its own hand, kept cards, fed cards and its deck's contents (not
   *  its order); the other's hand, kept and fed cards and both decks' order are hidden (`unseen`: the other seat's cards it cannot place). */
  view(S, seat) {
    const o = other(seat), mask = (a) => a.map(() => -1);
    const v = { ...S, hand: [0, 1].map((q) => (q === seat ? S.hand[q].slice() : mask(S.hand[q]))), kept: [0, 1].map((q) => (q === seat ? S.kept[q].slice() : mask(S.kept[q]))),
      deck: [0, 1].map((q) => (q === seat ? S.deck[q].slice().sort((a, b) => a - b) : [])), deckN: S.deck.map((d) => d.length),
      fedCards: [0, 1].map((q) => (q === seat ? S.fedCards[q].slice() : [])), disc: S.disc.map((d) => d.slice()), log: S.log.slice(-12), pending: S.pending[0]?.seat === seat ? S.pending : [], seat };
    const shown = new Set([...S.disc[o], ...S.tokens.filter((t) => t.owner === o).map((t) => t.card)]); v.unseen = [...Array(56).keys()].filter((c) => !shown.has(c));
    v.tiles = S.tiles.map((t) => ({ ...t })); v.tokens = S.tokens.map((t) => ({ ...t })); v.bomb = { ...S.bomb }; v.ctx = { ...S.ctx }; v.stats = { ...S.stats };
    v.oppHeld = S.hand[o].length + S.kept[o].length;
    return v;
  },
};

/** A deep copy of a state or a view, by hand (structuredClone was a quarter of the search's time); a pending's moves are shared, never changed. */
export function cloneState(V) {
  const two = (a) => [a[0].slice(), a[1].slice()];
  return { ...V, cls: V.cls.slice(), hp: V.hp.slice(), hand: two(V.hand), kept: two(V.kept), deck: two(V.deck), disc: two(V.disc), fedCards: two(V.fedCards), bank: V.bank.slice(), fed: V.fed.slice(),
    fatigue: V.fatigue.slice(), reshuffles: V.reshuffles.slice(), tiles: V.tiles.map((t) => ({ o: t.o, s: t.s })), tokens: V.tokens.map((t) => ({ ...t })), bomb: { ...V.bomb }, ctx: V.ctx && { ...V.ctx },
    pending: V.pending.map((P) => ({ ...P })), log: V.log.slice(), stats: { ...V.stats } };
}
/** A full state from a seat's view: the other seat's unseen cards dealt at random into its hand, kept cards, deck and fed cards, and this
 *  seat's own deck shuffled (information-set search: neither deck's order is known). */
export function determinize(V, r) {
  const S = cloneState(V), seat = V.seat, o = other(seat), un = shuffle(r, V.unseen.slice());
  S.deck[seat] = shuffle(r, S.deck[seat]);
  S.hand[o] = un.splice(0, V.hand[o].length); S.kept[o] = un.splice(0, V.kept[o].length); S.deck[o] = un.splice(0, V.deckN[o]); S.fedCards[o] = un;
  S.log = []; S.unseen = undefined; S.deckN = undefined; S.oppHeld = undefined;
  return S;
}
export { strengthOf, speedOf };
