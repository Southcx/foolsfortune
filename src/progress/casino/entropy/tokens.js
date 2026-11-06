// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' COURT TOKENS ADVANCING (docs/plans/ENTROPY-TACTICS.md 8.4, South 2026-11-06: "different suits and ranks have different
// token actions"): at the end of a seat's turn every token of its ADVANCES its speed in tiles straight along its column toward the far edge
// (its rank, page 1 .. king 4, one more for its class's suit, one more for the Chariot), front ones first so a column moves together. Its
// SUIT is what it does: WANDS strike their Arcana for its strength at the far edge, then are discarded; PENTACLES turn every tile they
// enter yours (the sum to 0) and stay on their back rank, holding it; SWORDS fight an enemy token met on the way (the stronger wins, a sword
// winning a tie) and at the far edge push the Grand Bomb one tile toward them, then are discarded; CUPS mend your Arcana by their strength
// at the far edge and go back into your deck, shuffled in. Two tokens meeting where neither is a sword: the stronger goes on, the weaker
// is discarded, an equal pair both stop. A token never enters the bomb's tile, nor a friend's: it waits behind.
// Choices where 8.4 is silent: STRENGTH is the rank plus the Empress's +1 and a Charge's +2 (it is what fights, strikes and mends; speed is
// the rank alone); two swords of equal strength break each other (both discarded: an equal pair that stops would block the column for
// good); a token that wins a meeting it walked into goes on into the tile.
//
// HEALTH (South, 2026-11-06, evening: "giving the court tokens a health value, such that they can also be targeted by cards, with damage
// taken being 1x magnitude if of the same or adjacent suit, and 2x magnitude if of the opposite suit"): a token has `hp` of `max`, three a
// rank (page 3 .. king 12; the Empress's +1 rank, +3). A number card played ON an enemy token hurts it by its value (an ace 1 or 11)
// instead of adding to a tile, x2 when its suit is the token's CONTRARY (the Golden Dawn's dignities, SPREADS.md 4: Wands against Cups,
// Swords against Pentacles), x1 for the same suit or an adjacent one. At 0 it is downed to its owner's discard pile (a cup does not go
// home). Choices South left open: any enemy token anywhere may be hit (a king of wands crosses the board in two turns, out of reach of
// the tiles beside your ground); a meeting still goes by strength (health is what cards take); strength stays the rank, never the health
// left.
//
// Prior art: Plants vs. Zombies' and Hearthstone Battlegrounds' units marching down a lane, chess's pawns (a column, a far rank reached),
// Stratego's rank against rank (the higher takes the lower, an equal pair both lost).
//
//   advanceTokens(S, p, r, K: { R, lose, hurt, moveBomb })   strengthOf(S, t)   speedOf(S, t, R)   TOKEN_HP   maxHpOf(rank)
//   contrary(a, b)   multOf(cardSuit, tokenSuit) -> 1 | 2   hitToken(S, p, t, card, v) -> { dmg, mult, hp, falls }
// ---------------------------------------------------------------------------------------
import { CLASSES, HEALTH } from './classes.js';

const SWORDS = 1, PENTACLES = 2, WANDS = 3, CUPS = 0; // (the suits' indices: cards.js SUITS)
export const TOKEN_HP = 3; // (health a rank: page 3 .. king 12, so a ten of the contrary suit downs a queen or less and a same-suit ten a knight)
export const maxHpOf = (rank) => TOKEN_HP * rank;
/** Contrary suits (cups 0 with wands 3, swords 1 with pentacles 2): the index pairs summing to 3. */
export const contrary = (a, b) => a + b === 3;
export const multOf = (cardSuit, tokenSuit) => (contrary(cardSuit, tokenSuit) ? 2 : 1);
/** A number card `card` played as `v` on token `t`: the damage, its multiplier, the health left and whether it falls (pure: the preview's). */
export function hitOf(t, card, v) { const mult = multOf(card & 3, t.suit), dmg = v * mult, hp = Math.max(0, t.hp - dmg); return { dmg, mult, hp, falls: hp <= 0 }; }
/** The same hit made on the state by seat `p`: the health taken, the log told, the token downed at 0. */
export function hitToken(S, p, t, card, v) {
  const h = hitOf(t, card, v); t.hp = h.hp;
  S.log.push({ hurt: t.id, owner: t.owner, by: p, dmg: h.dmg, mult: h.mult, hp: h.hp, card });
  if (h.falls) discard(S, t, 'card');
  return h;
}
/** What a token fights, strikes and mends with: its rank (the Empress's one more), and a Charge's two this turn. */
export const strengthOf = (S, t) => t.rank + (S.ctx?.boost && t.owner === S.cur ? S.ctx.boost : 0);
/** How many tiles it advances a turn: its court rank, one more in its class's suit, one more for the Chariot. */
export const speedOf = (S, t, R) => t.speed + (CLASSES[S.cls[t.owner]].suit === t.suit ? R.suitStep : 0) + (S.cls[t.owner] === 'chariot' ? R.chariotStep : 0);

function off(S, t, why) { // (a token leaving the board: a cup goes home into the deck, every other card to its discard pile)
  S.tokens.splice(S.tokens.indexOf(t), 1);
  S.log.push({ down: t.id, owner: t.owner, kind: t.suit, why });
  return t.card;
}
const discard = (S, t, why) => S.disc[t.owner].push(off(S, t, why));

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
        if (a > b || (a === b && sa && !sb)) discard(S, there, 'beaten');
        else if (b > a || (a === b && sb && !sa)) { discard(S, t, 'beaten'); break; }
        else if (sa && sb) { discard(S, there, 'beaten'); discard(S, t, 'beaten'); break; }
        else break; // (an equal pair, neither a sword: both stop this turn)
      }
      t.z = nz;
      if (t.suit === PENTACLES) { const T = S.tiles[nz * N + t.x]; if (T.o !== p) S.log.push({ claim: p, at: [t.x, nz], from: T.o }); T.o = p; T.s = 0; }
      if (nz !== far) continue;
      const s = strengthOf(S, t);
      if (t.suit === WANDS) { S.log.push({ strike: p, dmg: s }); discard(S, t, 'struck'); K.hurt(S, q, s, 'strike'); }
      else if (t.suit === SWORDS) { S.log.push({ shove: p }); discard(S, t, 'shoved'); K.moveBomb(S, p, K.R.swordPush); }
      else if (t.suit === CUPS) { S.hp[p] = Math.min(HEALTH, S.hp[p] + s); S.log.push({ mend: p, n: s }); const c = off(S, t, 'home'), d = S.deck[p]; d.splice(Math.floor(r() * (d.length + 1)), 0, c); }
      else S.log.push({ hold: p, at: [t.x, nz] }); // (a pentacle stays on their back rank)
      break;
    }
  }
}
