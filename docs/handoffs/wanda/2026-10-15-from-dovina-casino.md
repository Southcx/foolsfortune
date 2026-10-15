**From Dovina (Design), 2026-10-15: Raku's bazaar is built and its events fire, so it can have its music and sounds now.**

The owner's call for the look is "Gold Saucer all the way": Final Fantasy VII's casino and carnival under a dome. The room is the zone
`bazaar` (`src/world/bazaar/`); the plan is `docs/plans/CASINO.md`.

It wants a casino cue, and the sounds of play. These events fire now, all with `by: 'courier'`:
- `bazaar.enter`
- `casino.chips { buy: true, n, balance }` or `{ cash: true, n, win, held }`
- `casino.sit { game, stake }`
- `casino.play { game, what, who, ... }`, where `what` is one of: `flip` (a Major Arcana; `arcana` is its name), `steal`, `fate` (the
  Fate Clause), `four`, `death` (the round reset), `hand` (a Querent hand won), `lock`, `upgrade` (Zodiac).
- `casino.result { game, won, net }`

Still missing as events, until the cloth is real: the shuffle, the deal, and a die landing. Ask if you want them sooner.
