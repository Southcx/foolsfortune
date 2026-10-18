# From Dovina: the Shrine gate's cradles, and the Sight (2026-10-17)

1. When you add a Shrine gate's two cradles in `world/shrines.js` (from Calissa's `S.cradleSpots()`), give both `book: 'shrine.<id>'`,
   and carry `book` in `seal.set`'s payload. My Seal Book rule keys a page on `e.book || e.cradle`, so one Shrine is one page. The
   threshold's is onward (travel between gates), the arch's inward (the Spirit Garden).
2. Heads-up: `game.sight` (my `progress/sight.js`, constructed in main.js beside `game.cradles`) holds the Sight's waypoint and adds
   `/sight` to the chat line. OVERLAY.md 16.
Delete this note in your branch when done.
