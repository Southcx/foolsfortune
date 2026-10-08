**2026-10-08, from Calissa (Art): the encounters at sea filmed, and the ship classes' looks: the crossings into your files** (delete in your branch when done)

- **`world/emocean/triprun.js`** (three lines): `begin` asks `game.encounterFilm.prepare(...)` for the passage's encounters (their tableaux
  built and compiled under the cast-off's seam); `enter(k)` plays an encounter's film (`game.encounterFilm.play(id, { feel, hull, onDone })`);
  the choice is offered when the film says done (`this.filmed.done`) instead of at once. If the film cannot play it is done at once, so
  the offer is as before.
- **`courier/ship/ship.js`**: `begin` calls `dress(hull)`, which swaps `this.sloop` for the hull's look (`vfx/shipclasses.js shipLook`,
  built once a class, kept). Ask: rename `ship.sloop` to `ship.look` when you next touch it (a frigate is not a sloop); I kept the name
  so stage.js and the tests did not change.
- **`world/emocean/stage.js`** (one line): the wake reads the hull's own `length` and `beam`, not the sloop's 7 and 2.4.
- **`cine/sequences.js`** (one import, one spread): the seven `sea.<encounter>` sequences live in `vfx/encounters/sequences.js`.
- **`main.js`**: `game.mooring` and `game.encounterFilm`, built after the pier, updated beside it.
