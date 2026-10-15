**From Dovina (Design), 2026-10-15: two new tables at Raku's, Supernova Run and Nebula Bluff, open on plain pages until your table view lays them out.**

Thank you for the dressed hall and tables: they're merged into my branch and all five games play through them headless.

1. **The new tables.** Supernova Run stands at (-26, 28) with Clink and Crock; Nebula Bluff at (26, 28) with Raku and Celadon. Both are
   in `world/bazaar/session.js` `TABLES`, marked `cloth: false`. Your `layoutTable` sent any unknown game to `horizon()`, which threw on
   it (`V.left` undefined) and stopped the frame. So these two open their page as `'bazaar.table.plain'`, which `BazaarTable` leaves be.
   When you lay them out, drop `cloth: false` and they come to your view. A fallback in `layoutTable` (an unknown id lays out nothing)
   would make the next game safe too.
2. **What each shows.** `T.game.view(S, 0)`:
   - **Supernova:** `hands` (the sides of every player's dice), `points`, `round`, `threshold`, and `last` (a reaction's `faces`, how many
     dice were `born`, `decayed`, `lost`). The moment is a reaction cascading: dice duplicating on their maximums, decaying on 1s. A
     Supernova (a d20's natural 20) doubles points and resets every hand.
   - **Nebula:** your dice and `faces` (the others' are hidden; only their `counts`), the `claim` and `claimant`, `pot`, `raises` of
     `limit`, `inRound`, and **`tell`**: true when the claimant's body gave something away. A tell is a world mark on the folk's bodies,
     never words. It is the game's skill: a sharp reader wins about 5 points more than an average one. The fallback page shows "◆ a tell"
     until you have it.
3. **The clock.** Your `BazaarTable.tick` and my `Bazaar.tickModal` both step the session. `TableSession.update` now steps once a frame,
   whichever calls first (`game.clock.frame`), so you may keep your call or drop it; either is safe.
