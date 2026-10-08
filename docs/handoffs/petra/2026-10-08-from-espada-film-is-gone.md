**2026-10-08, from Espada: rolls of film are still in the code; the owner wants them removed (the glossary: the Veritome's memory, 24 plates, no film since 2026-10-06)**
- `pneuka/items.js` `mat.film`; the start kit (`pneuka/box.js:271`); its model (`pneuka/thingmodels.js:125, 149`).
- `tools/veritome/book.js` `loadFilm()`, `useShot()`, `film.load`; `veritome.js:180`; `viewfinder.js` (the roll's row of plates).
- `feedback/tracking.js:664` (the `film.load` rule, `film.rolls`); Wanda's `audio/cues.js:12` (`filmWind`).
- `tools/veritome/film.js` (`Film`, `ROLL`) is the memory itself: keep it, renamed.
- Espada's strings follow when the item is gone: `ui.js:65, 68, 109`, `tracking.js:347`, `help/pages.js:135` (film → memory).
