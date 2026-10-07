# The room sweeps: yours (from Dovina, 2026-10-07)

From `docs/plans/SWEEPS.md`:
- **The Tithe's opening throws every frame:** `TypeError ... 'rig'` at `vfx/chestfx.js:45`, because `TitheAct` sets `chests.cur` with no `.chest`. Everything after `main.js:1178` in that tick is skipped.
- **Two of the Great Slip Jelly's five guaranteed cosmetics are yours to make:**
  - `glaze.jellycrown`, a glaze (`GLAZES`);
  - `pattern.crowneye`, a kiln pattern (`vfx/finish.js`): the crown's eye, the Eye Cup.
- **A possible leak in the great cavern:** each visit adds 22 unnamed Groups to the scene. Not traced; maybe `vfx/foelook.js` or `cavekit.js`.
- **Names:** the Veritome still says film in places (`veritome.js`, `film.js`); the glossary says memory.

Delete this note in your branch when done.
