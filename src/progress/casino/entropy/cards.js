// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' CARDS (docs/plans/ENTROPY-TACTICS.md 8.1; GAPS G95): each seat's own deck, the same 56 Minor Arcana (four suits of ace
// to ten, page, knight, queen, king: ranks 1 to 14), the base material every player carves from (South, 2026-11-06). A NUMBER CARD (ace to
// ten) goes on a tile, its value added to the tile's shared sum (an ace 1 or 11, blackjack's); a COURT CARD (page to king) is played as a
// token, its rank its speed and strength (page 1 .. king 4), its suit what it does (rules.js). Version 1's poker groups are gone (8.8).
//
// Prior art: blackjack's card values (the ace soft or hard), Hearthstone's own-deck-each, the tarot's Minor Arcana as a playing-card deck.
//
// ATTUNED (version 2.1, 8.12): a number card of your class's own suit may be played at its value or one either side (1 to 11), so a deck
// carved toward your suit finds 21 more easily; the Fool, with no suit, has none.
//
//   SUITS ['cups','swords','pentacles','wands']   suitOf(c)   rankOf(c)   COURT   isCourt(c)   valuesOf(c, attuned) -> [v]   courtRank(c) -> 1..4
//   RANK_NAMES   nameOf(c)
// ---------------------------------------------------------------------------------------

/** The suits in the house's order (table.js SUIT_COLOURS: cups, swords, pentacles, wands). */
export const SUITS = ['cups', 'swords', 'pentacles', 'wands'];
export const suitOf = (c) => c & 3;
export const rankOf = (c) => (c >> 2) + 1;
export const COURT = 11; // (page and up)
export const isCourt = (c) => rankOf(c) >= COURT;
/** What a number card may add to a tile: an ace 1 or 11 (the player's choice as it is played), else its rank. */
export function valuesOf(c, attuned = false) {
  const base = rankOf(c) === 1 ? [1, 11] : [rankOf(c)];
  if (!attuned) return base;
  const out = new Set(); for (const v of base) for (const d of [-1, 0, 1]) if (v + d >= 1 && v + d <= 11) out.add(v + d);
  return [...out].sort((a, b) => a - b);
}
/** A court card's rank as a token: page 1, knight 2, queen 3, king 4 (S, 8.4). */
export const courtRank = (c) => rankOf(c) - COURT + 1;
export const RANK_NAMES = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Page', 'Knight', 'Queen', 'King'];
export const nameOf = (c) => `${RANK_NAMES[rankOf(c)]} of ${SUITS[suitOf(c)]}`;
