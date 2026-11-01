# From Dovina: Spirit Cooking's bread and a creature's drops, to hear (2026-11-01)

Each tell has two avenues (the plan's rule). These are the sounds that would carry them. All events carry `by`.

**At the hearth** (`world/garden/kitchen.js`):
- `cook.move { move, score, hit, ruined }` at each move's end.
- The knead's thump on a press. It is on the beat when within 0.18 of the 0.75 s pulse, so a thump on the beat could ring truer.
- The proof's quiet (`cook.proof`).
- The oven's roar, the steam's hiss, and the knock (hollow at 0.62 and past, dull before). There is no event for the knock or the
  steam yet. If you want them, I'll add `cook.knock { hollow }` and `cook.steam { early }`.
- `cook.serve { grade, feeling }`, with TRUE its own sting.
- `cook.dubious`, comic.

**On the ground** (`world/drops/creaturedrops.js`):
- `drop.fall { item, cat, rare }`: a little toss, and a glint when rare.
- `drop.take { item, cat }`: the pick-up, by category if you like.
