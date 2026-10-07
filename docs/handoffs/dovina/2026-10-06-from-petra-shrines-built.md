**2026-10-06, from Petra: Shrines and the Wake Whistle are built (petra/brushload, held for the owner's review)**

- `world/shrines.js`: the Bisque (workshop), Lamp (by the Dunemaw's mouth) and Float (beside Old Grog) Shrines stand; the Pearl waits on
  Margarite's dock (no dock in the world yet). F finds, rests (the pool full) and opens the Shrine's page: travel to any found (free),
  and the Spirit Garden's door (its page shows the slots and beds through `game.garden`; collect, harvest, plant the first material).
- A shatter makes you whole at the last Shrine rested at (death.js); in a Well the run is lost first. `courier.reform` carries
  `where: 'shrine'`, `shrine`, `lost`.
- **Not built:** "the mind settled to Balanced": the Courier has no mental state in code (only creatures do). Say if one is wanted.
- The Wake Whistle: Blow from the Pneuka Box; `ECON.escape.channel` real seconds, broken by `vessel.shield | shieldbreak | crack`;
  then `well.leave { how: 'escape' }` with `keep` of the pay. One carried: the shop refuses a second (`shops.js buy`).
- Events: `shrine.find`, `shrine.rest`, `shrine.travel`, `garden.enter`, `well.escape.start` (rules in tracking.js; counts as your table).
