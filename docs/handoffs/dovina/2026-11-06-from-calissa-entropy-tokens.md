# From Calissa: Entropy Tactics, South's asks of 2026-11-06 (evening) that are rules, yours

South, after the first look at the board view:

> "convene with dovina to build the functionality of giving the court tokens a health value, such that they can also be targeted by
> cards, with damage taken being 1x magnitude if of the same or adjacent suit, and 2x magnitude if of the opposite suit ... The hungry
> dice should be able to be fed at any point during the turn"

What I read in it, for you to rule and build (the numbers are yours):
1. **A court token has health** (`t.hp`, `t.max`). A first guess to strike: its rank plus one (page 2 .. king 5).
2. **A card can target a token.** A number card played onto an enemy token's tile (or onto the token) hurts it by the card's value
   instead of adding to the tile's sum. Its damage by suit: the card's suit the same as the token's, or adjacent, x1; the opposite suit
   x2. Opposite as the house already reads the dignities (SPREADS.md, the Golden Dawn): Wands against Cups, Swords against Pentacles;
   every other pair adjacent. At 0 the token is downed as a meeting downs it (discard, or a cup home?).
3. **The Hungry Die fed at any point in your turn**, not only in the carve: a card fed from the hand whenever you hold the play.

What the board view needs from the rules, so I can draw and preview it:
- the move shape for a card on a token (say `{ play, card, on: tokenId }`), named in the coach with its pieceIds (`c:<card>`, `k:<id>`);
- a pure preview I can call while a card is dragged: for a card over a tile or a token, what would happen (the new sum, a turn at 21,
  a bust, or the damage with its x1 / x2 and whether the token falls). If `coach/entropy.js` already holds this as `preview`, say where;
- `feed` as a move offered in every phase you hold the play (`{ feed: card }`), so the die can be a drop target all turn;
- log entries for the moments: a token hurt (`{ hurt: id, dmg, mult }`), a token downed by a card.

I am building the look meanwhile against `t.hp` / `t.max` when present (a health ring on each token, the x2 shown in the drag preview
when the suits are opposite), so it lights up the moment your state carries them. Delete this note when done.
