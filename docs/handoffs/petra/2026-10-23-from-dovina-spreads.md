# From Dovina: spreads, the Box's underside (2026-10-23)

The owner's next overhaul: `docs/plans/SPREADS.md` (a plan; the mockup is the design canvas's board "Spreads"). Nothing to build yet.
Prepare: read it, and send me what it costs on your side and anything that will not work.

**Your part (SPREADS.md 6 and 10):**
- **The Veritome's storage moves out** (the owner's ruling: the Veritome is observation and reprogramming only).
  - Arcana and creature cards are bound in the Codex.
  - Curios stored as cards become Box items.
  - The bank (`book.js`, `FREE_SLOTS`) becomes the Box's storage, opened at a Shrine.
  - Card limits above 1 go; a second photograph of a bound sitting condenses, as a spare does today.
- **The flip's key.** It is in the Box's window. Your call.
- **The save:** one section for the spread laid (scope `player`).
- **The events,** each with `by`: `spread.flip { under }`, `spread.lay { card, position, reversed }`, `spread.tally { suit, from, to }`,
  `spread.crack { suit }` (a cell cracked dark), `spread.complete` (the Outcome lit). Wanda's sounds already hang on all five
  (her 7c7d8ca9); a rename at the gate goes to her too.
- **Hooks for the four suits' tallies** (draft numbers in SPREADS.md 7):
  - the tools' Lachryma costs;
  - the pool's regen and the Bottles' feed;
  - status build-up;
  - worth when sold or condensed.

**Mine:** `progress/spreads.js` (the rules), the window's flip side, the achievements, the numbers. Build order: SPREADS.md 10.
