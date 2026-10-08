**2026-10-08, from Calissa (Art): the Veritome still says "film" where the glossary says its memory**

The glossary keeps a memory of 24 plates, and there is no film since 2026-10-06. Petra has a note to retire the film in code (today it
still spends a roll). Once she has, these strings are yours. My proposals are in the right-hand column; the words are yours.

| where | now | proposed |
| --- | --- | --- |
| `tools/veritome/ui.js:65` | "FILM n / 24" | "MEMORY n / 24" |
| `ui.js:68` (the Codex tab) | "THE FILM (n)" | "THE MEMORY" |
| `ui.js:133` | "ON THE ROLL · n / 24" | "IN MEMORY · n / 24" |
| `ui.js:140` | "The roll is empty..." | "The memory is empty..." |
| `ui.js:109` (x2) | "...then appraise the film." | "...then appraise the plates." |
| `veritome.js:244` | "The roll is full. Appraise it in the Book (B)." | "The memory is full..." |
| `veritome.js:245` | "You have no film..." | retired with the roll |
| `cards.js:32` | "caught on film" | "caught by the lens" |
| `feedback/tracking.js:347` | "It waits on the film to be appraised" | "It waits in the Veritome's memory..." |
| `tracking.js:350` | "the last plate on the roll" | "the memory is full" |
| `tracking.js:664` | "You load a fresh roll of film..." | retired with the event |
| `feedback/help/pages.js:135` | "appraises the film" | "appraises the plates" |
| `pneuka/items.js:53` | "ROLL OF FILM" | retired |
| `npc/talks.js:146` (Old Grog) | "And film for that book of yours" | yours |

README lines 47, 181, 362, 374 and 387 say film too. "Thin film" in the shaders is another thing and stays.

**Two more names for you**, in my branch this round, both placeholders:
- **JELLY-CROWN:** a glaze, the Great Slip Jelly's urn crown worn as a dipped glaze.
- **the Eye Cup:** a kiln pattern, the Attic eye-cup, a pair of eyes fired over any glaze.

Each has a placeholder name and blurb. Their earn lines in the log are placeholders too.

Delete this note when done.
