# From Dovina: two new tables at Raku's Bazaar need a layout and a cloth (2026-11-03)

Two games are built (rules, bot, coach, how-to, simulator, and a plain fallback page in `world/bazaar/views.js`), and sit in
`session.js` TABLES: **Charity Gamble** (id `charity`, 5 seats, at x -44 z -8) and **Entropy Tactics** (id `entropy`, 2 seats, at x 44 z -8).
Neither has a layout registered (`registerLayout`, `vfx/bazaarlayout.js`), so the table view lays out nothing and the fallback page plays
them. Cloth ids `charity` and `entropy` fall back to the atlas's first cloth. Yours when you have a minute; piece ids are from the coach.

- **Charity Gamble** (`coach.extra`: `mine`, `said[seat]`, `line`, `last`, `hist`): the jar as a stack of chips in the middle (`centre`
  'The jar'); each seat's secret deposit as a lone chip under a cup before it (1 ivory, 5 cinnabar, 10 lapis: the house chips) that you see
  only for your own; each seat's *claim* as the same chip turned face up beside the cup once said; the line as a gold rail with the number;
  the reveal: all cups lift, the true chips drop in the jar, right bets glow. Moves are chips/buttons in the action bar (deposit 1/5/10, say
  1/5/10, over/under): `moves[].deposit`, `.say`, `.bet`. The seat plate shows each seat's lie rate (`stats` 'Lies').
- **Entropy Tactics** (`coach.extra`: `board { size 7, tokens [{id, owner, kind, hp, max, atk, x, z}], bomb {x, z}, counter }`, `hand` card ids,
  `phase`): a 7 x 7 board with seat 0 on rows 4 to 6 (your side, nearest), row 3 neutral, the Grand Bomb a d20 on its tile; tokens by suit
  (warrior pentacles, rogue swords, mage wands, healer cups); your five or six cards as the house deck (`c:<id>`: card id = (rank-1)*4 + suit,
  suit 0 cups, 1 swords, 2 pentacles, 3 wands, rank 1 ace .. 14 king, via `bazaarAtlas` card cells if you map them), the Hungry Die by each
  seat (`die:` label in the plate). Piece ids on `moves[].pieceIds`: `c:<card>`, `t:<x>.<z>` (a tile), `k:<token id>`, `bomb`, `arcana:<seat>`.
  A move that names a tile and a token (a move) wants a two-step pick: token, then tile. The ids and `selectable` (coach/index.js) work as for
  Zodiac's tiles. **G97 needs a tap-pick check at 896 x 414** for the 7 x 7 board (tiles ~ 44 px at the table view's scale).
The rules' words on the cloth stay yours to drop or keep: the coach's text is for the fallback page and the how-to.
Delete this note in your branch when done.
