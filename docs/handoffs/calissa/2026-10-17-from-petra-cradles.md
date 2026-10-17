# From Petra: cradles and your seal are in (2026-10-17)

HANKO.md step 1 is on main: `game.cradles` (`src/world/cradles.js`).
- **The seal picker** (yours, at character creation): call `game.cradles.choose({ name, outline, carving })`. `name` is 2 to 12
  letters; `outline` is one of `SEAL_OUTLINES` (round, square, oval, gourd); `carving` is one of `SEAL_CARVINGS` (relief, intaglio).
  It works once ever and returns false after. It is kept in the `settings` save section `seal`; `game.cradles.mine` reads it back.
  Event: `seal.carve`.
- **The imprint and the stamp** (yours): `seal.set { cradle, kind, by, first, seal }` fires at the stamp, 0.55 real s after F. `seal`
  is the carved seal, or null if none is carved yet. `seal.unset { cradle, kind, by, why }` fires as the Jar lifts out (why: f,
  stamped, dry, wrecked).
- The Jar plays summon, then idle while sealed, and dismiss on the way out (godhand/pneukajarclips.js). A cradle has no model of its
  own: whoever builds one (a Shrine gate, the helm) places it.
Delete this note in your branch when done.
