// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' HAND GRAMMAR (docs/plans/ENTROPY-TACTICS.md section 1; GAPS G95): the 56 Minor Arcana (four suits of ace to ten, page,
// knight, queen, king: ranks 1 to 14) and what a hand may be turned into. "Poker hands are a spell grammar": a run or a flush SUMMONS a
// token (by its suit), a pair or more of a kind CASTS, a court card ENCHANTS, five of the top ranks in one suit is the ROYAL STRAIGHT FLUSH
// (an instant win, ET 3c), and a card left over is FED to the Hungry Die. Runs and flushes are the small ones (three cards and up: five-card
// ones come once in a hundred hands, measured), a bigger group a bigger result.
//
// Prior art: video poker's hand ranks, Fatelink's hand-to-power table (the owner's draft), Balatro (a poker hand as the thing you play).
//
//   SUITS ['cups','swords','pentacles','wands']   KIND_OF_SUIT   suitOf(c)   rankOf(c)   groupsOf(hand) -> [{ type, cards, n, kind? , key }]
//   type: 'summon' | 'cast' | 'enchant' | 'royal'
// ---------------------------------------------------------------------------------------

/** The suits in the house's order (table.js SUITS: cups, swords, pentacles, wands), each the token kind it summons. */
export const SUITS = ['cups', 'swords', 'pentacles', 'wands'];
export const KIND_OF_SUIT = ['healer', 'rogue', 'warrior', 'mage'];
export const suitOf = (c) => c & 3;
export const rankOf = (c) => (c >> 2) + 1;
export const COURT = 11; // (page and up)
export const RANK_NAMES = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Page', 'Knight', 'Queen', 'King'];
export const nameOf = (c) => `${RANK_NAMES[rankOf(c)]} of ${SUITS[suitOf(c)]}`;

/** Every group a hand may be played as (deduplicated). Order: royal, sets (bigger first), runs, flushes, courts. */
export function groupsOf(hand) {
  const out = [], seen = new Set(), add = (g) => { g.cards = g.cards.slice().sort((a, b) => a - b); g.key = `${g.type}:${g.cards.join('.')}`; if (!seen.has(g.key)) { seen.add(g.key); out.push(g); } };
  for (let s = 0; s < 4; s++) { const royal = [10, 11, 12, 13, 14].map((r) => hand.find((c) => suitOf(c) === s && rankOf(c) === r)); if (royal.every((c) => c != null)) add({ type: 'royal', cards: royal, n: 5 }); }
  const byRank = new Map(); for (const c of hand) { const r = rankOf(c); if (!byRank.has(r)) byRank.set(r, []); byRank.get(r).push(c); }
  for (const [, cs] of byRank) for (let k = Math.min(4, cs.length); k >= 2; k--) add({ type: 'cast', cards: cs.slice(0, k), n: k });
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) {
    let j = i; while (j + 1 < ranks.length && ranks[j + 1] === ranks[j] + 1) j++;
    for (let a = i; a <= j; a++) for (let b = a + 2; b <= Math.min(j, a + 4); b++) {
      const cards = []; for (let k = a; k <= b; k++) cards.push(byRank.get(ranks[k])[0]);
      add({ type: 'summon', cards, n: cards.length, kind: KIND_OF_SUIT[suitOf(cards[cards.length - 1])], how: 'run' });
    }
  }
  for (let s = 0; s < 4; s++) {
    const cs = hand.filter((c) => suitOf(c) === s).sort((a, b) => rankOf(b) - rankOf(a));
    for (let k = 3; k <= Math.min(5, cs.length); k++) add({ type: 'summon', cards: cs.slice(0, k), n: k, kind: KIND_OF_SUIT[s], how: 'flush' });
  }
  for (const c of hand) if (rankOf(c) >= COURT) add({ type: 'enchant', cards: [c], n: 1, suit: suitOf(c) });
  return out;
}
