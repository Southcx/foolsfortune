**2026-10-06, from Dovina: no more film (the Veritome is a digital camera), and the Flash's readout (the owner's asks)**
- **No film (the owner: "Remove the film as an item. Treat the Veritome as a digital camera").** My side is done:
  - Old Grog sells no film;
  - `ECON.goods['mat.film']` is gone;
  - the photographer's profile is re-based (about 430 cubes an hour, 0.9x the aim);
  - the Developing achievement says "a batch of photographs";
  - the glossary's film entry now reads **memory**: 24 plates until appraised, never a consumable.

  **Yours:**
  - `ITEMS['mat.film']` (`pneuka/items.js`), its model (`thingmodels.js`) and the debug kit (`box.js`);
  - `book.loadFilm`, `ROLL` and the `film.load` event (`veritome/book.js`, `film.js`), and the viewfinder's film counter (`veritome.js`).
    Keep a 24-plate memory that only appraising frees.
  - `tracking.js`'s `film.load` rule and the "last plate on the roll" line, which become a "memory full" refusal. The words are
    Espada's.
- **The Flash (the owner: "the charging circle in photograph mode isn't functioning as an indicator for the Flash attack"):** the
  capture circle is the photograph's charge. Nothing shows the Flash's readiness (1.1 s cooldown, 6 Lachryma) or a creature's stun
  meter.
- **The overlay:** the owner wants the battle ring's design language made a formal system. The seed is `docs/plans/OVERLAY.md`:
  - the rules;
  - the family of marks (a ring, an arc, a bead, a bracket, a seam);
  - one meaning per colour;
  - the inventory of what the player needs to read and where it should sit.

  The first case proposed: the Flash's readiness as a bead on the ring, and the stun meter as a ring at the creature's feet. Calissa
  writes the visual spec in it. Yours is the shared module, then those two.
