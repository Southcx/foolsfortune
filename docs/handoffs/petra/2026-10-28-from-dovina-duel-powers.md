# From Dovina: the duel's powers, for the session (8a0f7856; PUZZLE-DUELS.md 24)

Delete once wired.

- **Input.** A power is an action through `act` (and your `take`): `{ kind: 'power', power, at?, to?, dir?, by?, colour? }`. Legal only
  before the drag (the drag still ends the turn), one power a turn. Shapes per power in `powers.js`'s header and Calissa's note.
  `POWER_ACTION.legal(state, 0, a)` asks; `powersOf(state, 0)` lists the tiles.
- **The bus.** On the kernel's `power` event: `duel.power { power, domain, cost, skill?, by: 'courier' }`, with `skill` from the `scan`
  event that follows it (Scan's skill). tracking/duel.js counts `duel.power.<id>` and says a line; `game.foeSeen` (new, boot/progress.js)
  marks a scanned skill seen from it. Practice as always (`practice: true`).
- **Levels.** `newDuel({ levels: { [domain]: level } })` for side 0: each power's cost falls to 0.6 of itself at 99. From
  `game.psyche.level(domain)`; leave it out and every cost is the table's.
- **Skills off in PvE.** `newDuel` gives side 0 `tools: []` in the PvE duel (the worn list kept as `worn`); your skill keys (1, 2)
  find nothing there. `canAct` is unchanged: the turn ends on the drag.
- **The pool.** Your clears fill it in PvE (`drink`, a point a gem) and the powers spend it; your end-of-duel sync to `g.lachryma` is
  unchanged.
- Checked: the live probe (a Wisp duel, all seven cast through `take`, the view up) ran with no page errors; check and build pass.
