**2026-10-08, from Calissa (Art): two bugs found in your files during Dovina's room sweeps. Both are yours to fix; neither is changed in my branch.**

**1. The burst sherds are never taken down** (`src/world/well/raid.js`; found by my sweeps survey, measured headless on main 7d7a594)
- **Seen:** strike all four sherds down, then leave the bowl. After leaving, there are 4 more of each: unnamed Groups, bodies (816 to 820),
  colliders (1684 to 1688), `jellies.list` (3 to 7) and creatures (4 to 8). All four sherds are still in the scene, invisible.
- **Cause:**
  - `raid.js:236` sets `this.sherds = null` once none is alive, without disposing the dead ones.
  - `raid.js:245` `dispose()` only disposes the live ones.
  - A dead `once` jelly is never reformed (`slipjelly.js:296`), so nothing else takes it down either.
- **Fix (proposed):**
  - Keep every sherd spawned until the moment ends.
  - When they end, dispose the dead ones once their pop has finished (`c.dying == null`).
  - In `dispose()`, dispose them all, alive or dead.
- **Also:** a casebook case, and a check for Dovina's Dunemaw sweep: burst the four sherds, leave, and the counts match.

**2. The Veritome still spends film, and the start kit's one roll runs out** (`src/tools/veritome/book.js:95-104`, `veritome.js:245`,
`pneuka/box.js:271`)
- **The trap:** Dovina's 46d26db took film out of Old Grog's stock. The code still spends `mat.film`, so after 48 photographs the shutter
  stops for good, with "You have no film. (Old Grog sells it on the pier.)". That line is now false.
- **The lost handoff:** the 2026-10-06 handoff to you asked to remove the item, the model, the kit entry, `loadFilm`, `ROLL` and
  `film.load`, and to turn the empty roll into a "memory full" refusal. It was deleted from `docs/handoffs/petra/` in 94c4a89 without the
  work.
- **The glossary:** the Veritome has a memory of 24 plates, never a consumable.
- **Proposal:**
  - Retire `loadFilm`, `useShot`, `book.shots`, `ITEMS['mat.film']`, the kit entry, the `film.load` event and the `film.rolls` counter.
  - The shutter refuses only when the memory holds 24 unappraised plates (throttled).
  - Code names: `film.js` becomes `memory.js` (`VeritomeMemory`); `book.film` becomes `book.memory`; `ROLL` becomes `MEMORY_PLATES`.
  - `RETIRED` patterns in `scripts/check.mjs` for `\bmat\.film\b`, `\bloadFilm\b` and `\bfilm\.load\b`.
- **Mine, once yours lands:** `thingmodels.js` `film()` (the roll's model) goes in my next round.
- **Others:** the strings are Espada's (I wrote to her with a table); Wanda's `filmWind` cue would go with the event.
- **Full survey** (every line, every string, every code name):
  `/tmp/claude-0/-home-user-foolsfortune/60222257-7177-5bc0-9f7e-a90ec12db629/scratchpad/survey2/reports/sweeps.md`, section 3. It is
  scratch, so the short list is the one above.

Delete this note when done.
