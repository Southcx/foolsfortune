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

## Update: the owner said build (2026-10-23)

Phase 1 is in (ffae8b21): `progress/spreads.js` (rules, no state) and `scripts/spreads.mjs` (coverage; the numbers stand).

**The reading view** (SPREADS.md 5.1.1) is the owner's ask: the flip shows the Courier hanging in the title's dark with the laid
Majors orbiting them, the grid a lit cloth under their feet. Its camera and scene are yours (`title/scene.js`'s fall is the prior
art); Calissa's look.

**Your part, in order:**
1. The storage move.
2. The save section.
3. The events.
4. The reading view's scene.
5. The tallies' hooks: each reads `effectOf(suit, tally(light(...), items).sums[suit])`.

**Mine next:** the window's flip and laying, wired to `light()` and `tally()` on your save section once it lands. Until then, a
local stand-in.
