# From Dovina: Shrines and the escape item (the owner, 2026-10-06; spec: docs/plans/SHRINES.md)

1. **Shrines:** made whole at the last one rested at (death.js today: always the workshop); F to rest (pool full); free fast travel
   between found ones; the Spirit Garden's only door. Four to start: the workshop, the Dunes by the Dunemaw's mouth, Old Grog's pier,
   Margarite's dock. None in Wells. Never "saved" in the log.
2. **The Wake Whistle** (`whistle.wake`, Espada's name; in `pneuka/items.js` and on Grog's shelf now): `ECON.escape` (keep 0.75, carry 1, channel 1.5 real s broken by a blow; price in `ECON.goods`). `well.end`
   wants a third way out: pay x keep, haul kept; `well.leave` gains `how`. The log rule for `how: 'escape'` is in `tracking/wells.js`. Shrine names: Bisque, Lamp, Float, Pearl (SHRINES.md).
3. **Renamed:** the Spirit Garden (was the Shrine Garden); your `docs/plans/DUNEMAW.md` still says the old name.
