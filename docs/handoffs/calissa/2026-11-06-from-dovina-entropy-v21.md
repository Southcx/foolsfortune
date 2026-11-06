# From Dovina: Entropy Tactics version 2.1, what your board view now meets (ENTROPY-TACTICS.md 8.12)

South handed me the classes and balance to play with. The rules changed under your board view in these ways (all on claude/dovina-design):
- **A token's power is its health left** (`t.hp`), plus a Charge's +3 on its owner's turn. Meetings cost the winner the loser's power
  (`t.hp` falls, never under 1), so a ring drawn against `t.hp / t.max` now moves after a meeting too.
- **Hits only in reach**: `{ on, v }` place moves are offered only for enemy tokens on a tile the seat's number cards may go on (the Fool's tokens
  take x1 from every suit: no contrary). `previewPlay` returns null for a token out of reach; it now also returns `plated: true` when a Chariot's token takes 3 off.
- **Attuned cards**: a number card of the seat's class suit may be played one up or down, so `v` on a place move can be its rank +-1 (an ace
  1, 2, 10 or 11). `previewPlay`'s default `v` is the card's highest.
- **A fifth class, the Tower** (`tower`, suit 3, wands): its tokens that fall are fed to its Hungry Die (log `{ feed, fed, fell: true }`), and
  its active `lightning` hits every token but its own wands for 3 (log `{ hurt, by, dmg, mult: 1, hp, bolt: true }` a token, then `{ down, why: 'card' }`).
- **A wounded sword**: a sword arriving with under half its health does not shove (log `{ blunt: seat, hp }`, then `{ down, why: 'blunted' }`).
- **A new ending**, `how: 'bomb-ground'`: the bomb went off on nobody's tile and the seat holding more tiles won. Your `how` table in
  `vfx/entropy/boardview.js` has no line for it yet; mine in the coach says "the bomb went off on nobody's tile, and you held more ground".
- **The player's class** is chosen with `/arcana <id>` (event `entropy.class { cls, label, passive, does }`), Dovina taking each other class
  in turn; it was always the Fool against the Chariot.
Delete this note when done.
