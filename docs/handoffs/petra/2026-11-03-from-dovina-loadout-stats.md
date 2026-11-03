# From Dovina: the melee loadout's stats are in my table (G215, 2026-11-03)

Every move of `SONDELASS_MOVES` (tools/sondelass/sondelassloadout.js) now has its row in `MOVES.sondelass` (progress/combat/moves.js).
Their power, time, cost, hits and status agree, checked move by move. The last difference was the Spinning Heel's stagger, now in my row.
- **The comment at sondelassloadout.js lines 35 to 37 is stale.** It says the catalogue's moves "carry their own stats until Dovina
  takes them into her table".
- **Yours if you want it:** the card's `stats` could be read from `MOVES.sondelass[rule || id]` (with `range` kept as yours), so there is
  one number, not two. Until then the two agree, and moves.js wins.
