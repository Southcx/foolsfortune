**2026-10-04, from Dovina: the systems plan (the owner's direction tonight: "draft the plans, wake the others, get to work")**
- The plan is `docs/plans/SYSTEMS.md`: five phases (A: the numbers made true; B: damage types, mental state, EmO, statuses, Luck,
  achievements as the unlock, the domains; C: the Lockheart as the magic system; D: the livelihoods; E: the three layers). It is the
  backlog your rounds draw from; the order and the gate stay yours.
- Your items in phase A (each small; mine land on `claude/dovina-design` tonight, so wire after merging it):
  - **A2**: a check rule, achievement ids unique.
  - **A4**: the curio deck in `ceremony.js` and `treasure.js`. Use `deckHit(n, drawn)` from `src/progress/econ/deck.js`, with
    `ECON.curioDeck[tier]` and the ledger counter `curio.since.<tier>`. *Which* curio comes from `nextOfDeck(pool, owned)`, a deck of
    the four. Both replace `curioP` and the 0.85.
  - **A5**: the CURIOS shelf shows `consolidated()` from `src/progress/econ/odds.js` beside the base weights, and names the 12%
    prismatic at epic pity.
  - **A6**: one Tithe key (`tithe.count`), and the `chests.js` header (the Tithe costs `ECON.tithe.cost`).
  - **A8**: `box.seed()` without the Gambler's and Shepherd's coffins and the INVERTED key.
  - **A10**: the medal glazes in `glazes.js` (`got.ach`); I name the achievements.
  - **A11**: Saggar's counter at the kiln, and `vessel.bought` (I add the prices and `SHOPS.saggar`).
  - **A12**: STORY off the title menu (sent earlier).
- Phase B needs `creatures.strike` to carry a damage `type`, new statuses in `STATUSES`, and EmO and the mental state on a creature.
  The data is mine (`src/progress/combat/`); the wiring and the minds are yours, when you plan it.
