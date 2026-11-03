// ---------------------------------------------------------------------------------------
// ASTROLL: ENTROPY TACTICS (docs/plans/ENTROPY-TACTICS.md, the owner's two drafts merged; GAPS G95): two Major Arcana duel across a 7 x 7
// board with a Grand Bomb in the middle. A TURN: draw to five (the Hermit six), then PLAY one group of the hand (cards.js: a run or a flush
// summons a token, a pair or more casts, a court card enchants, the royal straight flush wins); keep up to two of the cards left and FEED
// the rest to the Hungry Die; ACT with each token once (a move or a strike; more actions cost 2^(n-1) of the bank); then ROLL the Hungry Die
// and PUSH the bomb toward the enemy or COUNT it down. The bomb goes off when its counter (20, down one every round) reaches 0, or is pushed
// off the board: whose zone it is in loses; in the neutral rank the higher health wins. An Arcana at 0 health loses.
// ZONES: three ranks each, the seat's own nearest its back edge, the fourth rank neutral (seat 0 rows 4 to 6, seat 1 rows 0 to 2).
// THE HUNGRY DIE: the only bank and the only roll (ET 3a). Cards fed fill the bank (it pays for extra actions and class actives) and,
// counted over the whole game, grow the die d4 > d6 > d8 > d10 > d12 > d20 (fed 0, 4, 9, 15, 22, 30).
// A PUSH is an open clash (ET 3f): your roll plus 1 for each of your tokens beside the bomb against the defender's roll (their own die)
// plus 1 for each of theirs; tiles = max(1, floor((attack - defence) / the defender's die)) when you win, none when you tie or lose.
// Decided here where ET section 5 is still open (the owner answered nothing yet: ET 6 is empty; each is a default for Dovina to rule, and
// each is data below): ONE bank (Q1 yes), the Royal Straight Flush an instant win (Q2 yes), the Fool, Chariot, Empress and Hermit (Q3), an
// adjacent token adds a flat +1 (Q4), the counter ticks one a round as well as by counting down (Q5 both), two players only (Q6).
// Tokens (suit > kind: cups healer, swords rogue, pentacles warrior, wands mage): warrior 3 health 2 strike, moves 1; rogue 2 / 1, moves 2,
// strikes and takes double in enemy ground; mage 2 / 2, cannot move, strikes two tiles in a line; healer 2 / 0, mends a token beside it by 2.
// A summon of n cards has n - 3 health more. A token strikes an adjacent enemy token, or the enemy Arcana from the enemy's back rank.
// A cast: a pair 2 to an enemy token, three of a kind 4 to the enemy Arcana, four 7. An enchantment: a court card matched to the token's
// suit +2 health +1 strike, any other +1 health.
// The second seat starts with a bank of 1 (measured: the first seat won 59%).
// Not built: deck cycling at half health, the classes' second and third actives and ultimates, three and four players (ET 5 to 6).
//
// Prior art: Duelyst (a general with health on a small board), Inscryption's scale as the clock, Into the Breach's shown threats, video
// poker's hand grammar, Fatelink's classes (the owner's draft). The table engine: table.js.
//
//   ENTROPY (the game: table.js's interface)   ENTROPY_RULES   zoneOf(z)   sidesOf(fed)   determinize(view, r)   CLASS_IDS (classes.js)
//   opts: { classes: [id, id], first }
// ---------------------------------------------------------------------------------------
import { shuffle, die, rngOf, DIE_STEPS } from '../table.js';
import { groupsOf, rankOf, suitOf, KIND_OF_SUIT, COURT } from './cards.js';
import { CLASSES, HEALTH } from './classes.js';

export const ENTROPY_RULES = {
  size: 7, counter: 20, hand: 5, keep: 2, feedAt: [0, 4, 9, 15, 22, 30], spell: { 2: 2, 3: 4, 4: 7 }, push: 1,
  tokens: { warrior: { hp: 3, atk: 2, mv: 1, rng: 1 }, rogue: { hp: 2, atk: 1, mv: 2, rng: 1 }, mage: { hp: 2, atk: 2, mv: 0, rng: 2 }, healer: { hp: 2, atk: 0, mv: 1, rng: 1, mend: 2 } },
};
const R = ENTROPY_RULES, N = R.size;
let rng = rngOf(1); // (the stream of the move being made: set by setup and apply, never kept in a state, so a state clones)
/** Whose zone a row is: 0 or 1; -1 the neutral rank. Seat 0 holds the high rows. */
export const zoneOf = (z) => (z <= 2 ? 1 : z === 3 ? -1 : 0);
export const sidesOf = (fed) => DIE_STEPS[Math.max(0, R.feedAt.filter((t) => fed >= t).length - 1)];
const dir = (p) => (p === 0 ? -1 : 1), back = (p) => (p === 0 ? 6 : 0), homeRows = (p) => (p === 0 ? [4, 5] : [2, 1]);
const actionCost = (n) => (n <= 1 ? 0 : 2 ** (n - 1)); // (the nth action of one token in a turn)
const tokAt = (S, x, z) => S.tokens.find((t) => t.x === x && t.z === z);
const tokById = (S, id) => S.tokens.find((t) => t.id === id);
const mine = (S, p) => S.tokens.filter((t) => t.owner === p);
const other = (p) => 1 - p;
const handSize = (S, p) => R.hand + (S.cls[p] === 'hermit' ? 1 : 0);

function draw(S, p, k, r) {
  for (let i = 0; i < k; i++) {
    if (!S.deck.length) { S.deck = shuffle(r, S.disc); S.disc = []; }
    if (!S.deck.length) return;
    S.hand[p].push(S.deck.pop());
  }
}
function lose(S, p, how) { if (!S.done) { S.done = true; S.winner = other(p); S.how = how; S.log.push({ over: S.winner, how }); } }
function checkHealth(S, by) {
  if (S.done) return;
  const a = S.hp[0] <= 0, b = S.hp[1] <= 0;
  if (a || b) lose(S, a && b ? by ?? 0 : a ? 0 : 1, 'health');
}
function detonate(S, by) {
  const zone = zoneOf(S.bomb.z); S.log.push({ boom: zone, by });
  if (zone >= 0) return lose(S, zone, 'bomb');
  if (S.hp[0] !== S.hp[1]) return lose(S, S.hp[0] < S.hp[1] ? 0 : 1, 'bomb-neutral');
  lose(S, by ?? 0, 'bomb-neutral'); // (a tie in the neutral rank: whoever set it off)
}
function hit(S, t, dmg, by) {
  if (t.kind === 'rogue' && zoneOf(t.z) === other(t.owner)) dmg *= 2;
  t.hp -= dmg; S.log.push({ hit: t.id, dmg, by });
  if (t.hp <= 0) { S.tokens.splice(S.tokens.indexOf(t), 1); S.log.push({ down: t.id, kind: t.kind, owner: t.owner }); }
}
const strength = (S, t) => {
  let d = t.atk + (S.ctx.boost && t.owner === S.cur ? 2 : 0);
  if (t.kind === 'rogue' && zoneOf(t.z) === other(t.owner)) d *= 2;
  return d;
};
const range = (S, t) => R.tokens[t.kind].mv + (S.cls[t.owner] === 'chariot' && R.tokens[t.kind].mv ? 1 : 0);

// ------------------------------------------------------------- the turn's steps
function beginTurn(S, p, r) {
  S.cur = p; S.ctx = { acted: {}, boost: 0, rerolled: false, cycled: false, lit: false, group: null, roll: 0 };
  if (p === S.first) { S.round++; if (S.round > 1) { S.counter--; if (S.counter <= 0) { detonate(S, null); return; } } }
  draw(S, p, Math.max(0, handSize(S, p) - S.hand[p].length), r); toPlay(S);
}
function toPlay(S) {
  const p = S.cur, hand = S.hand[p], moves = [{ feed: true }];
  const friends = mine(S, p).length, foes = mine(S, other(p)).length;
  for (const g of groupsOf(hand)) {
    if (g.type === 'enchant' && !friends) continue;
    if (g.type === 'cast' && g.n === 2 && !foes) continue;
    moves.push({ play: g.type, cards: g.cards, n: g.n, kind: g.kind, how: g.how, suit: g.suit });
  }
  const C = CLASSES[S.cls[p]];
  if (C.active === 'cycle' && !S.ctx.cycled && S.bank[p] >= C.cost) moves.push({ active: 'cycle' });
  S.phase = 'play'; S.pending = [{ seat: p, kind: 'play', moves }];
}
function discard(S, p, cards) { for (const c of cards) { S.hand[p].splice(S.hand[p].indexOf(c), 1); S.disc.push(c); } }
function playGroup(S, m, r) {
  const p = S.cur; S.ctx.group = m;
  discard(S, p, m.cards);
  if (m.play === 'royal') { S.log.push({ royal: p }); lose(S, other(p), 'royal'); return; }
  if (m.play === 'summon') {
    const tiles = []; for (const z of homeRows(p)) for (let x = 0; x < N; x++) if (!tokAt(S, x, z)) tiles.push({ place: [x, z] });
    if (tiles.length) { S.phase = 'place'; S.pending = [{ seat: p, kind: 'place', moves: tiles }]; return; }
    return afterEffect(S);
  }
  if (m.play === 'enchant') { S.phase = 'enchant'; S.pending = [{ seat: p, kind: 'enchant', moves: mine(S, p).map((t) => ({ on: t.id })) }]; return; }
  if (m.n === 2) { S.phase = 'cast'; S.pending = [{ seat: p, kind: 'cast', moves: mine(S, other(p)).map((t) => ({ on: t.id })) }]; return; }
  const d = R.spell[m.n]; S.hp[other(p)] -= d; S.log.push({ cast: p, n: m.n, dmg: d, arcana: true }); checkHealth(S, p); afterEffect(S);
}
function afterEffect(S) {
  if (S.done) return;
  const p = S.cur, left = S.hand[p].slice().sort((a, b) => rankOf(b) - rankOf(a) || b - a);
  if (!left.length) return toAct(S, true);
  const moves = []; for (let k = 0; k <= Math.min(R.keep, left.length); k++) moves.push({ keep: k });
  S.phase = 'keep'; S.pending = [{ seat: p, kind: 'keep', moves }];
}
function keepFeed(S, k) {
  const p = S.cur, sorted = S.hand[p].slice().sort((a, b) => rankOf(b) - rankOf(a) || b - a), keep = sorted.slice(0, k), fed = sorted.slice(k);
  S.hand[p] = keep; for (const c of fed) S.disc.push(c);
  S.bank[p] += fed.length; S.fed[p] += fed.length; if (fed.length) S.log.push({ feed: p, n: fed.length, die: sidesOf(S.fed[p]) });
  toAct(S, true);
}
function actMoves(S) {
  const p = S.cur, moves = [{ end: true }];
  for (const t of mine(S, p)) {
    const a = (S.ctx.acted[t.id] || 0) + 1; if (S.bank[p] < actionCost(a)) continue;
    const seen = new Set([`${t.x}.${t.z}`]), q = [[t.x, t.z, 0]], rng = range(S, t);
    while (q.length) {
      const [x, z, d] = q.shift(); if (d >= rng) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = `${nx}.${nz}`; if (nx < 0 || nz < 0 || nx >= N || nz >= N || seen.has(k) || tokAt(S, nx, nz)) continue; seen.add(k); q.push([nx, nz, d + 1]); moves.push({ move: t.id, to: [nx, nz] }); }
    }
    const reach = R.tokens[t.kind].rng;
    if (t.kind === 'healer') { for (const f of mine(S, p)) if (f !== t && f.hp < f.max && Math.abs(f.x - t.x) + Math.abs(f.z - t.z) === 1) moves.push({ mend: t.id, on: f.id }); continue; }
    for (const e of mine(S, other(p))) { const dx = Math.abs(e.x - t.x), dz = Math.abs(e.z - t.z); if ((dx + dz === 1) || (reach === 2 && ((dx === 0 && dz === 2) || (dz === 0 && dx === 2)))) moves.push({ strike: t.id, on: e.id }); }
    if (t.z === back(other(p)) && t.atk > 0) moves.push({ strike: t.id, arcana: true });
  }
  const C = CLASSES[S.cls[p]];
  if (S.bank[p] >= C.cost && ((C.active === 'charge' && !S.ctx.boost && mine(S, p).length) || (C.active === 'bloom' && S.hp[p] < HEALTH))) moves.push({ active: C.active });
  return moves;
}
function toAct(S) { const p = S.cur, moves = actMoves(S); if (moves.length === 1) return toBomb(S); S.phase = 'act'; S.pending = [{ seat: p, kind: 'act', moves }]; }
function spend(S, p, n) { S.bank[p] -= n; }
function pay(S, id) { const p = S.cur, a = (S.ctx.acted[id] = (S.ctx.acted[id] || 0) + 1); spend(S, p, actionCost(a)); }
function toBomb(S) { // (the roll is made as the bomb comes up: the die is public the moment it is)
  S.phase = 'bomb'; S.ctx.roll = die(rng, sidesOf(S.fed[S.cur]));
  S.pending = [{ seat: S.cur, kind: 'bomb', moves: bombMoves(S) }];
}
function bombMoves(S) {
  const p = S.cur, C = CLASSES[S.cls[p]], moves = [{ push: true }, { count: true }];
  if (S.cls[p] === 'fool' && !S.ctx.rerolled) moves.push({ reroll: true });
  if (C.active === 'lantern' && !S.ctx.lit && S.bank[p] >= C.cost) moves.push({ active: 'lantern' });
  return moves;
}
const beside = (S, p) => mine(S, p).filter((t) => Math.abs(t.x - S.bomb.x) + Math.abs(t.z - S.bomb.z) <= 1).length;
function endTurn(S, r) { if (!S.done) beginTurn(S, other(S.cur), r); }
function resolveBomb(S, m, r) {
  const p = S.cur, q = other(p), roll = S.ctx.roll;
  if (m.push) {
    const atk = roll + R.push * beside(S, p), dsides = sidesOf(S.fed[q]), def = die(r, dsides) + R.push * beside(S, q);
    const tiles = atk > def ? Math.max(1, Math.floor((atk - def) / dsides)) : 0;
    S.log.push({ push: p, atk, def, tiles });
    if (tiles) { S.bomb.z += dir(p) * tiles; if (S.bomb.z < 0 || S.bomb.z >= N) { S.bomb.z = Math.max(0, Math.min(N - 1, S.bomb.z)); S.log.push({ boom: p === 0 ? 1 : 0, by: p, off: true }); return lose(S, p === 0 ? 1 : 0, 'bomb-off'); } }
  } else { S.counter -= roll; S.log.push({ count: p, roll, counter: S.counter }); if (S.counter <= 0) return detonate(S, p); }
  endTurn(S, r);
}

export const ENTROPY = {
  id: 'entropy', seats: [2, 2],
  setup({ r, opts = {} }) {
    rng = r;
    const cls = opts.classes || ['fool', 'fool'], first = (opts.first ?? 0) % 2;
    const S = { n: 2, cls, hp: [HEALTH, HEALTH], hand: [[], []], deck: shuffle(r, [...Array(56).keys()]), disc: [], bank: [first === 0 ? 0 : 1, first === 1 ? 0 : 1], fed: [0, 0], tokens: [], nextTok: 1, bomb: { x: 3, z: 3 }, counter: R.counter, round: 0, first, cur: first, phase: 'play', ctx: null, pending: [], log: [], done: false, winner: null, how: null };
    beginTurn(S, first, r); return S;
  },
  pending: (S) => (S.done ? null : S.pending[0] || null),
  apply(S, m, r) {
    rng = r; const P = S.pending[0], p = P.seat;
    switch (P.kind) {
      case 'play':
        if (m.active === 'cycle') { spend(S, p, CLASSES.fool.cost); S.ctx.cycled = true; draw(S, p, 3, r); S.log.push({ cycle: p }); return toPlay(S); }
        if (m.feed) { S.log.push({ play: 'feed', seat: p }); return afterEffect(S); }
        return playGroup(S, m, r);
      case 'place': {
        const k = S.ctx.group, base = R.tokens[k.kind], bonus = k.n - 3 + (S.cls[p] === 'empress' ? 1 : 0), hp = base.hp + bonus;
        S.tokens.push({ id: S.nextTok++, owner: p, kind: k.kind, hp, max: hp, atk: base.atk, x: m.place[0], z: m.place[1] }); S.log.push({ summon: p, kind: k.kind, n: k.n, at: m.place }); return afterEffect(S);
      }
      case 'enchant': {
        const t = tokById(S, m.on), k = S.ctx.group, matched = KIND_OF_SUIT[k.suit] === t.kind;
        t.hp += matched ? 2 : 1; t.max += matched ? 2 : 1; if (matched) t.atk += 1; S.log.push({ enchant: p, kind: t.kind, matched }); return afterEffect(S);
      }
      case 'cast': { const t = tokById(S, m.on); S.log.push({ cast: p, n: 2, dmg: 2 }); hit(S, t, R.spell[2], p); return afterEffect(S); }
      case 'keep': return keepFeed(S, m.keep);
      case 'act':
        if (m.end) return toBomb(S);
        if (m.active) { const C = CLASSES[S.cls[p]]; spend(S, p, C.cost); if (m.active === 'charge') S.ctx.boost = 1; else S.hp[p] = Math.min(HEALTH, S.hp[p] + 5); S.log.push({ active: m.active, seat: p }); return toAct(S); }
        if (m.move != null) { const t = tokById(S, m.move); pay(S, t.id); t.x = m.to[0]; t.z = m.to[1]; }
        else if (m.mend != null) { const t = tokById(S, m.mend), f = tokById(S, m.on); pay(S, t.id); f.hp = Math.min(f.max, f.hp + R.tokens.healer.mend); S.log.push({ mend: f.id }); }
        else if (m.strike != null) { const t = tokById(S, m.strike); pay(S, t.id); if (m.arcana) { S.hp[other(p)] -= strength(S, t); S.log.push({ strike: t.id, arcana: true, dmg: strength(S, t) }); checkHealth(S, p); } else hit(S, tokById(S, m.on), strength(S, t), p); }
        return S.done ? undefined : toAct(S);
      case 'bomb':
        if (m.reroll) { S.ctx.rerolled = true; S.ctx.roll = die(r, sidesOf(S.fed[p])) + (S.ctx.lit ? 3 : 0); S.pending[0].moves = bombMoves(S); return; }
        if (m.active === 'lantern') { spend(S, p, CLASSES.hermit.cost); S.ctx.lit = true; S.ctx.roll += 3; S.pending[0].moves = bombMoves(S); return; }
        return resolveBomb(S, m, r);
    }
  },
  result: (S) => (S.done ? { winner: S.winner, how: S.how, scores: S.hp.slice(), chips: S.hp.slice(), hp: S.hp.slice(), rounds: S.round, counter: S.counter, classes: S.cls.slice() } : null),
  /** All a seat may know: the board, banks, the counter, its own hand; the other's cards are only a count, the deck a count. */
  view(S, seat) {
    const o = other(seat), v = { ...S, hand: S.hand.map((h, q) => (q === seat ? h.slice() : h.map(() => -1))), deck: [], deckN: S.deck.length, log: S.log.slice(-12), pending: S.pending[0]?.seat === seat ? S.pending : [], seat };
    const have = new Set([...S.hand[seat], ...S.disc]); v.unseen = [...Array(56).keys()].filter((c) => !have.has(c)); v.oppHeld = S.hand[o].length;
    v.tokens = S.tokens.map((t) => ({ ...t })); v.bomb = { ...S.bomb }; v.ctx = { ...S.ctx }; v.disc = S.disc.slice();
    return v;
  },
};

/** A full state from a seat's view: the unseen cards dealt to the other seat's hand and the deck at random (information-set search). */
export function determinize(V, r) {
  const S = structuredClone(V), o = other(V.seat), un = shuffle(r, V.unseen.slice());
  S.hand[o] = un.splice(0, V.hand[o].length); S.deck = un; S.log = []; S.unseen = undefined;
  return S;
}
