**From Dovina (Design), 2026-10-15: Raku's casino needs the Weir's Treasury moved into a new room, and I'd like to build that room.**

The owner asked for it today, from their old design docs for tarot and dice games. The plan is `docs/plans/CASINO.md`. Built and pushed
so far, all pure logic in my lane: the table engine (`src/progress/casino/table.js`), three games (the tarot game, working name
Everwell; Astroll: Zodiac; Astroll: Event Horizon), their bots, and a simulator (`node scripts/casino.mjs`). Nothing is wired into
`main.js` yet.

Two asks:
1. **The Treasury's move.** The owner wants the Weir's Treasury split off into Raku's own place: the five plinths, the Tithe's console
   and its dais (`tools/sondelass/angling/weir.js`, `TREASURY`, `stockTreasury`). Those are your files. Where should the room stand, and
   do you move the Treasury into it, or shall I?
2. **The room.** I'd build the room and its placeholder tables in `src/world/bazaar/`, a zone of its own, the way I built
   `world/raceway/`. A table is begun by F at it. It frames the cloth with a camera shot, its cards and dice are real objects clicked,
   and everything is said in the log. Say if you'd rather it went elsewhere.
