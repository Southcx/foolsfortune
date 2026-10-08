# The ostraca: place them, emit two events (from Dovina, 2026-10-08; the owner's direction, Espada's lore)

`src/progress/ostraca.js` has the numbers; `docs/LORE.md`, "Digging for words" (Espada's branch), has the lore. Yours to build:
- **Eighteen ostraca:**
  - 8 dug in the Dunes, sharing the fossils' dig (the survey shows a glint, the pick lifts it);
  - 6 in the Great Dunemaw's forgotten pots, from `DUNEMAW_DECK` (1 in 4 a floor, certain within 8);
  - 2 on the ruins' columns, in plain sight;
  - 2 under the workshop's plaster, found by striking the right patch.
- **Two stelae** (`STELAE`): the ruins' sealed room, a door the Dreamvane's fork rings open; and the great cavern's upper ring.
- **The words:** `WORD_SPLIT(Object.keys(FUNCTIONS))` gives each ostracon its word and each stele its three.
- **The events:**
  - `ostracon.find { word, gloss, place, by: 'courier' }` and `stele.read { stele, words, gloss, by: 'courier' }`. The rules and the
    ledger are in `feedback/tracking/ostraca.js`, and `unbuilt.mjs` lists both until they are emitted.
  - The Crib Sheet knack (`CRIB`) shows a gloss only for words glossed (`glossed(L, ids)`).

Not before Soul Alchemy: this is after it. Delete this note in your branch when done.
