// ---------------------------------------------------------------------------------------
// ASTROLL: ZODIAC (docs/plans/CASINO.md section 4; the owner's design doc): Shut the Box as a duel for a pot. Each player has twelve
// tiles, 1 to 12. A turn rolls two six-sided SEALING DICE and one ATTACK DIE (it starts as a d4). The sealing dice shut your own tiles:
// take their sum or their product, and shut open tiles that add up to exactly it (as many as you like, nothing left over). The attack die
// reopens an opponent's shut tiles adding up to exactly its value (a locked tile cannot be reopened); with no such tiles, that opponent
// pays its value into the pot instead. With neither a seal nor an attack, a DEAD ROLL: the attack die is rolled again and you pay it.
// DOUBLES (any two of the three dice alike) give a choice of LOCK (an ability token on one of your shut tiles from the doubled face up to
// the pair's sum: it cannot be reopened, nor that number locked by anyone else, and it carries an ability), UPGRADE (your attack die a
// step: d4, d6, d8, d10, d12, d20) or PAY (the attack die rolled again, an opponent pays it). TRIPLES take all three in order. A locked
// tile's ABILITY fires when your sealing dice ADD to its number (never the product): reroll the sealing dice, downgrade an opponent's
// attack die, take your attack die's value back out of the pot, or scramble an opponent's shut tiles. The first to shut all twelve takes
// the pot. Each player antes into it at the start.
// Decided here where the doc was open (CASINO.md 4 lists each): the doubled face's lock range is face .. face x 2 for a pair made with
// the attack die too; the scramble keeps how many tiles are shut and draws which at random; a dead roll's reroll is paid by the roller.
//
// Prior art: Shut the Box (the tiles, the exact sums), Inscryption's scale for the tug of a duel, backgammon's doubles as a bonus.
//
//   ZODIAC (the game: table.js's interface)   ZODIAC_RULES (the numbers)   zodiacBot(view, pending, r, style?)
// ---------------------------------------------------------------------------------------
import { die, stepDie, subsetsSumming, shuffle } from './table.js';

/** The numbers: tiles, ante, starting chips, the attack die's first size, ability tokens, the abilities, a game's turn cap. */
export const ZODIAC_RULES = { tiles: 12, ante: 5, chips: 100, attack: 4, tokens: 3, abilities: ['reroll', 'downgrade', 'refund', 'scramble'], cap: 400 };
const R = ZODIAC_RULES;

const open = (S, p) => S.tiles[p].map((t, i) => (t ? null : i + 1)).filter(Boolean);
const shutUnlocked = (S, p) => S.tiles[p].map((t, i) => (t && !S.locked[p][i] ? i + 1 : null)).filter(Boolean);
const pay = (S, p, amount) => { const a = Math.min(S.chips[p], Math.max(0, amount)); S.chips[p] -= a; S.pot += a; S.paid[p] += a; return a; };
const others = (S) => [...Array(S.n).keys()].filter((q) => q !== S.turn);

function rollTurn(S, r) {
  S.dice = { a: die(r, 6), b: die(r, 6), atk: die(r, S.attack[S.turn]) };
  S.log.push({ roll: { ...S.dice, sides: S.attack[S.turn], seat: S.turn } });
  // a locked tile's ability fires when the sealing dice add to its number
  const sum = S.dice.a + S.dice.b, ab = S.locked[S.turn][sum - 1];
  if (ab && sum <= R.tiles) {
    if (ab === 'reroll') S.pending.push({ seat: S.turn, kind: 'ability.reroll', moves: [{ reroll: true }, { reroll: false }] });
    else if (ab === 'refund') { const back = Math.min(S.pot, S.paid[S.turn], S.dice.atk); S.pot -= back; S.chips[S.turn] += back; S.paid[S.turn] -= back; S.log.push({ ability: 'refund', back }); }
    else S.pending.push({ seat: S.turn, kind: `ability.${ab}`, moves: others(S).map((q) => ({ target: q })) });
  }
  queueSeal(S);
}
function queueSeal(S) {
  const o = open(S, S.turn), { a, b } = S.dice, moves = [];
  for (const [by, v] of [['sum', a + b], ['product', a * b]]) for (const ix of subsetsSumming(o, v)) moves.push({ by, tiles: ix.map((i) => o[i]) });
  S.sealed = moves.length > 0;
  S.pending.push({ seat: S.turn, kind: 'seal', moves: moves.length ? moves : [{ none: true }] });
}
function queueAttack(S) {
  const v = S.dice.atk, moves = [];
  for (const q of others(S)) { const sh = shutUnlocked(S, q); for (const ix of subsetsSumming(sh, v)) moves.push({ target: q, tiles: ix.map((i) => sh[i]) }); }
  if (moves.length) { S.pending.push({ seat: S.turn, kind: 'attack', moves }); return; }
  if (!S.sealed) { const v2 = die(S.rng, S.attack[S.turn]); pay(S, S.turn, v2); S.log.push({ deadroll: v2 }); afterAttack(S); return; } // (a dead roll: rebound, the roller pays)
  S.pending.push({ seat: S.turn, kind: 'attack', moves: others(S).map((q) => ({ target: q, pay: v })) });
}
function lockable(S) {
  const { a, b, atk } = S.dice, faces = [];
  if (a === b) faces.push(a); if (a === atk && atk <= 6) faces.push(a); if (b === atk && atk <= 6 && b !== a) faces.push(b);
  const taken = new Set(); for (let q = 0; q < S.n; q++) S.locked[q].forEach((x, i) => { if (x) taken.add(i + 1); });
  const out = new Set();
  for (const f of faces) for (let t = f; t <= Math.min(R.tiles, f * 2); t++) if (S.tiles[S.turn][t - 1] && !S.locked[S.turn][t - 1] && !taken.has(t)) out.add(t);
  return [...out];
}
function queueLup(S) {
  const { a, b, atk } = S.dice, triple = a === b && b === atk, double = a === b || a === atk || b === atk;
  if (!double) { endTurn(S); return; }
  const lock = S.tokens[S.turn] > 0 ? lockable(S).flatMap((t) => R.abilities.map((ab) => ({ lock: t, ability: ab }))) : [];
  const up = S.attack[S.turn] < 20 ? [{ upgrade: true }] : [], payM = others(S).map((q) => ({ pay: q }));
  if (triple) { // (all three, in order)
    S.lupAll = true;
    if (lock.length) S.pending.push({ seat: S.turn, kind: 'lup.lock', moves: lock });
    if (up.length) S.pending.push({ seat: S.turn, kind: 'lup.upgrade', moves: up });
    S.pending.push({ seat: S.turn, kind: 'lup.pay', moves: payM });
    S.pending.push({ seat: S.turn, kind: 'end', moves: [{ end: true }] });
  } else S.pending.push({ seat: S.turn, kind: 'lup', moves: [...lock, ...up, ...payM] });
}
function afterAttack(S) { if (won(S)) return; queueLup(S); }
const won = (S) => { const p = S.tiles.findIndex((t) => t.every(Boolean)); if (p >= 0 && S.winner == null) { S.winner = p; S.chips[p] += S.pot; S.log.push({ win: p, pot: S.pot }); S.pot = 0; } return S.winner != null; };
function endTurn(S) { S.turns++; S.turn = (S.turn + 1) % S.n; S.lupAll = false; rollTurn(S, S.rng); }

export const ZODIAC = {
  id: 'zodiac', seats: [2, 4],
  setup({ seats, r, opts = {} }) {
    const S = { n: seats, tiles: [], locked: [], tokens: [], attack: [], chips: [], paid: [], pot: 0, turn: 0, turns: 0, pending: [], log: [], winner: null, rng: r };
    for (let p = 0; p < seats; p++) { S.tiles.push(Array(R.tiles).fill(false)); S.locked.push(Array(R.tiles).fill(null)); S.tokens.push(R.tokens); S.attack.push(opts.attack ?? R.attack); S.chips.push(opts.chips ?? R.chips); S.paid.push(0); }
    for (let p = 0; p < seats; p++) pay(S, p, opts.ante ?? R.ante);
    S.turn = (opts.first ?? 0) % seats; // (the first seat turns game by game at a table: the first roller wins 53.6% of duels)
    rollTurn(S, r);
    return S;
  },
  pending: (S) => S.pending[0] || null,
  apply(S, m, r) {
    const P = S.pending.shift(), me = S.turn;
    switch (P.kind) {
      case 'ability.reroll': if (m.reroll) { S.dice.a = die(r, 6); S.dice.b = die(r, 6); S.pending = S.pending.filter((x) => x.kind !== 'seal'); queueSeal(S); } break;
      case 'ability.downgrade': S.attack[m.target] = stepDie(S.attack[m.target], -1); S.log.push({ ability: 'downgrade', target: m.target }); break;
      case 'ability.scramble': { const t = S.tiles[m.target], k = t.filter((x, i) => x && !S.locked[m.target][i]).length, free = t.map((x, i) => i).filter((i) => !S.locked[m.target][i]); free.forEach((i) => { t[i] = false; }); shuffle(r, free).slice(0, k).forEach((i) => { t[i] = true; }); S.log.push({ ability: 'scramble', target: m.target }); break; }
      case 'seal': if (!m.none) { for (const t of m.tiles) S.tiles[me][t - 1] = true; S.log.push({ seal: m.tiles, by: m.by }); } if (!won(S)) queueAttack(S); break;
      case 'attack':
        if (m.pay != null) { pay(S, m.target, m.pay); S.log.push({ attackPay: m.target, amount: m.pay }); }
        else { for (const t of m.tiles) S.tiles[m.target][t - 1] = false; S.log.push({ reopen: m.tiles, target: m.target }); }
        afterAttack(S); break;
      case 'lup': case 'lup.lock': case 'lup.upgrade': case 'lup.pay':
        if (m.lock) { S.locked[me][m.lock - 1] = m.ability; S.tokens[me]--; S.log.push({ lock: m.lock, ability: m.ability }); }
        else if (m.upgrade) { S.attack[me] = stepDie(S.attack[me], 1); S.log.push({ upgrade: S.attack[me] }); }
        else if (m.pay != null) { const v = die(r, S.attack[me]); pay(S, m.pay, v); S.log.push({ lupPay: m.pay, amount: v }); }
        if (!S.lupAll && !won(S)) endTurn(S); break;
      case 'end': if (!won(S)) endTurn(S); break;
    }
    if (S.turns >= R.cap && S.winner == null) S.stalled = true;
  },
  result: (S) => (S.winner != null ? { winner: S.winner, chips: S.chips.slice(), turns: S.turns } : S.stalled ? { winner: null, stalled: true, turns: S.turns, chips: S.chips.slice() } : null),
  view: (S, seat) => ({ seat, n: S.n, tiles: S.tiles, locked: S.locked, attack: S.attack, chips: S.chips, pot: S.pot, dice: S.dice, tokens: S.tokens }),
};

/** A bot: shut the most (and the highest) it can; reopen the leader's highest; upgrade first, then lock high tiles. `style.greed` (0..1)
 *  leans it toward making the leader pay rather than locking. */
export function zodiacBot(V, P, r, style = {}) {
  const shutCount = (q) => V.tiles[q].filter(Boolean).length, score = (m) => {
    if (P.kind === 'seal') return m.none ? -1 : m.tiles.reduce((a, t) => a + t, 0) * 10 - m.tiles.length;
    if (P.kind === 'attack') return (shutCount(m.target) * 100) + (m.tiles ? m.tiles.length * 10 + Math.max(...m.tiles) : 0);
    if (P.kind.startsWith('ability')) return m.reroll === false ? 0 : m.reroll ? (V.dice.a + V.dice.b < 7 ? 1 : -1) : shutCount(m.target);
    if (m.upgrade) return 50; if (m.lock) return 30 + m.lock + (m.ability === 'scramble' ? 3 : m.ability === 'downgrade' ? 2 : 0); if (m.pay != null) return 20 * (style.greed ?? 0.3) + shutCount(m.pay);
    return 0;
  };
  let best = P.moves[0], bs = -Infinity; for (const m of P.moves) { const s = score(m) + r() * 0.01; if (s > bs) { bs = s; best = m; } }
  return best;
}
