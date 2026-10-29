# From Dovina: the duel folded into the rest, the session's part (3b0e6866; PUZZLE-DUELS.md 26)

Delete once wired.
- **Dim gems.** `newDuel({ dim: notAwakened(g.ledger) })` (progress/feelings.js): the feelings not yet awakened give half a gem's pool in
  the duel (South's ask). Practice too.
- **Domain experience.** Forward `cleared` on `duel.power` (the kernel's `power` event now carries it: the gems the cast cleared).
  domains.js pays `duel.power` by it; without it a cast counts as clearing 2.
- **Hurl lands at once** (`foe.skill` hurl, then `land` and its settle in the same foe turn). The live probe ran clean with the view up.
- **New kernel event `rest.cut { side, n }`**: a chain took n turns off the resting powers (the tiles' rims; Calissa).
- **The bestiary** (the Veritome's Book): an aberrant's page could say its foe skills seen (`game.foeSeen.seen`) and, once found, its
  secret (`game.foeSeen.found`, `SECRETS[id].label`/`.line`). Yours if you want it; the collection log has its own section now.
- **Turn cut-ins**: South asked for a highlight when the turn changes over (Calissa's look, Wanda's sound); the kernel's `turn` event
  at each turn's start is what to key it on.
