// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' COURT TOKENS (docs/plans/ENTROPY-TACTICS.md 8.4, 8.11, 8.12; South 2026-11-06: "different suits and ranks have different
// token actions", and the evening's "giving the court tokens a health value, such that they can also be targeted by cards, with damage taken
// being 1x magnitude if of the same or adjacent suit, and 2x magnitude if of the opposite suit"). At the end of a seat's turn every token of
// its ADVANCES its speed in tiles straight along its column toward the far edge (its rank, page 1 .. king 4, one more for its class's suit,
// one more for the Chariot), front ones first so a column moves together; it never enters the bomb's tile nor a friend's: it waits behind.
// HEALTH IS THE TOKEN (version 2.1, 8.12): a token's `hp` of `max` (three a rank, page 3 .. king 12; the Empress's +1 rank, +3) is what it
// fights, strikes, shoves and mends with, so every hit on it weakens all it will do:
// - its POWER is its health left, and a Charge's +3 on its owner's turn; the Tower's LIGHTNING takes 3 off every token but its own wands;
// - a NUMBER CARD played on an enemy token hurts it by its value (an ace 1 or 11), x2 when its suit is the token's CONTRARY (the Golden Dawn's
//   dignities, SPREADS.md 4: Wands against Cups, Swords against Pentacles), x1 for the same suit or an adjacent one (the Fool's tokens, of no suit, have no contrary: x1 always), only a
//   token in your REACH (on a tile a number card of yours may go on: ground held forward is reach); the Chariot's tokens are plated (3 off every hit, never under 1). At 0 it is downed to its owner's discard pile (the Tower's fed to its Hungry Die);
// - two tokens MEETING: the greater power goes on and loses the lesser's power from its health (never under 1; the Chariot's lose none), the
//   lesser is discarded (or fed, the Tower's); a sword wins a tie against any other suit, two swords tied break each other, two others tied
//   both stop this turn;
// - at the far edge: WANDS strike their Arcana for their power, then are discarded; SWORDS push the Grand Bomb one tile toward them, but only
//   when they arrive with at least half their health (a wounded sword is discarded without the shove), then are discarded; CUPS mend your
//   Arcana by half their power, rounded up, and go back into your deck, shuffled in; PENTACLES turn every tile they enter yours (the sum to 0)
//   and stay on their back rank, holding it.
//
// Prior art: Plants vs. Zombies' and Hearthstone Battlegrounds' units marching down a lane, chess's pawns (a column, a far rank reached),
// Stratego's rank against rank, Clash Royale's and Auto Chess's attrition (a winner keeps only what the fight left it), Magic's damage that
// stays on a creature all turn.
//
//   advanceTokens(S, p, r, K: { R, lose, hurt, moveBomb })   strengthOf(S, t) (its power)   speedOf(S, t, R)   TOKEN   maxHpOf(rank)
//   contrary(a, b)   multOf(cardSuit, tokenSuit) -> 1 | 2   hitOf(S, p, t, card, v)   hitToken(S, p, t, card, v) -> { dmg, mult, hp, falls }
//   zapAll(S, p, n) (the Tower's Lightning)
// ---------------------------------------------------------------------------------------
import { CLASSES, HEALTH } from './classes.js';

const SWORDS = 1, PENTACLES = 2, WANDS = 3, CUPS = 0; // (the suits' indices: cards.js SUITS)
export const TOKEN = {
  hp: 3, // (health a rank: page 3 .. king 12, so a ten of the contrary suit downs a queen or less and a same-suit ten a knight)
  plating: 3, // (the Chariot's tokens take 3 less from a card or a bolt, never under 1, and win a meeting unscathed: at 2 it won 35%)
  cupMend: 0.5, // (a cup mends half its power: a full king of cups is 6, so mending can never out-run two wands)
  shoveAt: 0.5, // (a sword shoves the bomb only with at least half its health left: hit it to stop the shove)
};
export const TOKEN_HP = TOKEN.hp;
export const maxHpOf = (rank) => TOKEN.hp * rank;
/** Contrary suits (cups 0 with wands 3, swords 1 with pentacles 2): the index pairs summing to 3. */
export const contrary = (a, b) => a + b === 3;
export const multOf = (cardSuit, tokenSuit) => (contrary(cardSuit, tokenSuit) ? 2 : 1);
/** A number card `card` played as `v` on token `t`: the damage, its multiplier, the health left and whether it falls (pure: the preview's). */
export function hitOf(S, p, t, card, v) {
  const mult = S.cls[t.owner] === 'fool' ? 1 : multOf(card & 3, t.suit), plated = S.cls[t.owner] === 'chariot';
  const dmg = plated ? Math.max(1, v * mult - TOKEN.plating) : v * mult, hp = Math.max(0, t.hp - dmg);
  return { dmg, mult, plated, hp, falls: hp <= 0 };
}
/** The same hit made on the state by seat `p`: the health taken, the log told, the token downed at 0. */
export function hitToken(S, p, t, card, v) {
  const h = hitOf(S, p, t, card, v); t.hp = h.hp; S.stats.hits++; if (h.falls) S.stats.downs++;
  S.log.push({ hurt: t.id, owner: t.owner, by: p, dmg: h.dmg, mult: h.mult, hp: h.hp, card });
  if (h.falls) discard(S, t, 'card');
  return h;
}
/** A token's power, what it fights, strikes, shoves and mends with: its health left, and a Charge's this turn. */
export const strengthOf = (S, t) => t.hp + (S.ctx?.boost && t.owner === S.cur ? S.ctx.boost : 0);
/** How many tiles it advances a turn: its court rank, one more in its class's suit, one more for the Chariot. */
export const speedOf = (S, t, R) => t.speed + (CLASSES[S.cls[t.owner]].suit === t.suit ? R.suitStep : 0) + (S.cls[t.owner] === 'chariot' ? R.chariotStep : 0);

function off(S, t, why) { // (a token leaving the board: a cup goes home into the deck, every other card to its discard pile)
  S.tokens.splice(S.tokens.indexOf(t), 1);
  S.log.push({ down: t.id, owner: t.owner, kind: t.suit, why });
  return t.card;
}
/** A token leaving to its owner's discard pile; the Tower's that FALL (to a card, a meeting, Lightning) are fed to its Hungry Die instead. */
function discard(S, t, why) {
  const c = off(S, t, why), q = t.owner;
  if (S.cls[q] === 'tower' && (why === 'beaten' || why === 'card')) { S.fedCards[q].push(c); S.fed[q]++; S.bank[q]++; S.log.push({ feed: q, fed: S.fed[q], fell: true }); }
  else S.disc[q].push(c);
}
/** Lightning's bolt, or any hit that is not a card's: `n` to every token (the Chariot's plating takes 2 off, never under 1). */
export function zapAll(S, p, n) {
  for (const t of S.tokens.slice()) {
    if (S.cls[p] === 'tower' && t.owner === p && t.suit === WANDS) continue; // (the bolt spares the Tower's own wands)
    const dmg = S.cls[t.owner] === 'chariot' ? Math.max(1, n - TOKEN.plating) : n; t.hp = Math.max(0, t.hp - dmg); S.stats.hits++;
    S.log.push({ hurt: t.id, owner: t.owner, by: p, dmg, mult: 1, hp: t.hp, bolt: true });
    if (t.hp <= 0) { S.stats.downs++; discard(S, t, 'card'); }
  }
}

export function advanceTokens(S, p, r, K) {
  const N = K.R.size, step = p === 0 ? -1 : 1, far = p === 0 ? 0 : N - 1, q = 1 - p;
  const order = S.tokens.filter((t) => t.owner === p && t.z !== far).sort((a, b) => Math.abs(far - a.z) - Math.abs(far - b.z));
  for (const t of order) {
    if (!S.tokens.includes(t)) continue;
    for (let k = speedOf(S, t, K.R); k > 0 && !S.done; k--) {
      const nz = t.z + step;
      if (S.bomb.x === t.x && S.bomb.z === nz) break; // (it waits behind the bomb)
      const there = S.tokens.find((u) => u.x === t.x && u.z === nz);
      if (there) {
        if (there.owner === p) break; // (behind a friend)
        const a = strengthOf(S, t), b = strengthOf(S, there), sa = t.suit === SWORDS, sb = there.suit === SWORDS;
        S.log.push({ meet: t.id, with: there.id, a, b });
        const scar = (w, n) => { if (S.cls[w.owner] !== 'chariot') w.hp = Math.max(1, w.hp - n); }; // (the Chariot's winners keep their health)
        if (a > b || (a === b && sa && !sb)) { scar(t, b); discard(S, there, 'beaten'); }
        else if (b > a || (a === b && sb && !sa)) { scar(there, a); discard(S, t, 'beaten'); break; }
        else if (sa && sb) { discard(S, there, 'beaten'); discard(S, t, 'beaten'); break; }
        else break; // (an equal pair, neither a sword: both stop this turn)
      }
      t.z = nz;
      if (t.suit === PENTACLES) { const T = S.tiles[nz * N + t.x]; if (T.o !== p) S.log.push({ claim: p, at: [t.x, nz], from: T.o }); T.o = p; T.s = 0; }
      if (nz !== far) continue;
      const s = strengthOf(S, t);
      if (t.suit === WANDS) { S.stats.strikes++; S.stats.struck += s; S.log.push({ strike: p, dmg: s }); discard(S, t, 'struck'); K.hurt(S, q, s, 'strike'); }
      else if (t.suit === SWORDS) {
        if (t.hp >= t.max * TOKEN.shoveAt) { S.log.push({ shove: p }); discard(S, t, 'shoved'); K.moveBomb(S, p, K.R.swordPush, 'shove'); }
        else { S.stats.blunted++; S.log.push({ blunt: p, hp: t.hp }); discard(S, t, 'blunted'); } // (a wounded sword: no shove)
      }
      else if (t.suit === CUPS) { const n = Math.ceil(s * TOKEN.cupMend); S.stats.mends += n; S.hp[p] = Math.min(HEALTH, S.hp[p] + n); S.log.push({ mend: p, n }); const c = off(S, t, 'home'), d = S.deck[p]; d.splice(Math.floor(r() * (d.length + 1)), 0, c); }
      else S.log.push({ hold: p, at: [t.x, nz] }); // (a pentacle stays on their back rank)
      break;
    }
  }
}
