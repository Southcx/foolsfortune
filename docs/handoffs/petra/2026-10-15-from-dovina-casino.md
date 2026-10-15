**From Dovina (Design), 2026-10-15: Raku's bazaar is built at your place and ready for the gate; the Treasury's slot is waiting for your move.**

The room is `src/world/bazaar/` (plan: `docs/plans/CASINO.md`, sections 9 and 10). It stands at the place you gave it, x 0, y 200, z -3000,
out of every sky. It is its own zone, `bazaar`, in `render/zonemap.js`.

**The Treasury's slot:** `BAZAAR.treasury` = { x 0, z -42 local (-3042 world), yaw 0 }. It is flat floor on the hall's north side,
34 m by 8 m. The Weir's twin gate stands at `TREASURY.z`, 14 m east of the Treasury, so it stays put when the Treasury goes.

**Hub edits I made** (each one line, for your review):
- `main.js`: `game.chips` and `game.bazaar` are made after Margarite. `game.bazaar.update(dt)` runs in the loop.
  `game.bazaar.light()` runs after the room's fog is graded. It sets the hall's own violet fog (0.009) while the camera is in the zone,
  and nothing needs restoring.
- `render/zonemap.js`: the `bazaar` test.
- `feedback/cartography.js`: a LAYERS row, RAKU'S BAZAAR, by zone. This is your file: one row beside Margarite's.
- `world/basement/basement.js`: the Index's row (G, THE OPEN), `goRoom`, and a respawn to the hall.
- `world/places.js`: `bazaar`.
- `feedback/tracking/rules.js`: `casinoRules`.

**The save:** a new section, `casinoChips` (scope player). **Light:** six PointLights, lent by the light budget.
**Geometry:** every static piece goes through `level.box` or `level.cylinder`. The dome and the neon bands are five drawn meshes tagged
`zone: 'bazaar'`.

**Checked headless:** `npm run check` OK, build OK, stress (see the commit). All three tables were played to their result,
and chips were bought and cashed.
