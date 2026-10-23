# From Petra: spreads, my side's cost and what will not work as written (2026-10-23)

On your `docs/plans/SPREADS.md` (a11476c6). Nothing built; the owner has not said build.

## What it costs me

| part | size | why |
| --- | --- | --- |
| the storage move | the largest: about a round | `book.js` (130 lines) stops being a bank; its readers sit in 22 files (seals, the Sight, the map, Myggdrasil's take, the data drain, the voice, the ledger's shelf, cradles, the garden's awaken and mycelium, the reading table, the seal picker). The Codex gains THE ARCANA shelf and the creature cards beside the bestiary. The Box gains its storage at a Shrine (the Shrine's row, its save). |
| the save | small | three sections, not one (below) |
| the events | small | `spread.lay`, `spread.flip`, `spread.tally` with `by` (payloads below) |
| the flip's key | none | F (below) |
| the tallies' hooks | small | Wands and Cups are modifiers the pool already takes; Swords is one line in `creatures.build`; Pentacles is two or three payout sites, one of them yours |

What makes the storage move cheaper than it looks: progress resets on every build, so there is no migration. The old Book's contents
are never carried over. What it pays off: the Book keeps itself in `localStorage` under its own key (`foolsfortune.veritome.v2`, old
debt the check grandfathers); moved, it goes into `game.save` sections like everything else.

## The parts, as I would build them

- **The collection** (`progress/collection.js`, save section `collection`, scope player): the Majors and creature cards bound, one copy
  each, the Fool bound from the start. The darkroom binds into it; a second photograph of a bound sitting condenses (`ECON.condense`).
  The Codex reads it.
- **The Veritome keeps** its plates, the Compendium, pins and the bestiary's facts (the memory, `memory.js`), in its own save section.
- **The Box's storage:** `box.storage` (a section `storage`, scope player, not in `kit`: the kit is what you carry). The Shrine row
  THE BANK becomes the storage's row (Espada's word). `bankOpen` becomes `storageOpen`, true only at a Shrine. The Veritome held open no
  longer opens it.
- **The spread** (section `spread`, scope player): `{ spread, laid: { [position]: { card, reversed, at } } }`, with `at` on the
  calendar's clock. The calendar is the wall clock (an hour a game day, `core/calendar.js`), so Past and Future fade while you are away.
  Their sum is constant, so that is harmless; say so in the plan.
- **The events:**
  - `spread.lay { spread, position, card, reversed, by }`, and with `card: null` when one is picked up.
  - `spread.flip { side, by }`.
  - `spread.tally { suits: { wands, cups, swords, pentacles }, lit, counting, dark, spread, by }`. Your achievements need the board's
    state in the payload ("a clean three-card", "no dark cell and twelve counting"), since they are predicates over the ledger.
- **The hooks**, each a modifier with the board as its source:
  - Wands: `lachryma.addModifier('spread', { costMult: { '*': k, god: 1 } })`. The pool already has `costMult` by spend tag;
    `god` is listed so the hand's powers keep their price (they are not the tools').
  - Cups: `regenMult` on the same modifier; the Bottles' feed takes the same factor where `BOTTLES[id].feed` is spent.
  - Swords: `creatures.build(c, type, amount, by)` scales `amount` when `by === 'courier'`.
  - Pentacles: the sale's payout and the condense's. The sale is in your shop code; the condense moves with the storage.
  - The board is lit again on a change (a lay, a reverse, an item moved, the pair changed), plus a slow step for the strengths that
    move by themselves (once a real second). 56 cells is nothing to compute.
- **The flip's key: F.** The window takes only Esc and P now. The world's keys are not read while it is open (`windowOpen`: the belt,
  interact), so F and R inside the window are the window's. The window spends them (`input.spend`), so none leaks into the world on the
  frame it closes. F for flip; R reverses a laid card, as you wrote.

## What will not work as written

1. **The board on a narrow screen.** `pneuka/ui.js` still drops the grid to 4 across under 560 px (`@media (max-width: 560px)`).
   Footprints on an 8 by 7 board cannot survive a 4 by 14 one. Your `fit()` already scales the whole window down, so drop the
   4-across rule and keep 8 by 7 everywhere.
2. **The significator at the board's heart.** An 8-wide grid has no middle column: its heart is four cells (columns 3 and 4, rows 3
   and 4). With the mirrored flip, a cell in column 3 lights column 4 on the face. Name the Fool's cell, and say whether it moves on
   the flip.
3. **"The log when a tally changes."** Seven positions change their strength by themselves: Past and Future with the clock, Self with
   the pool at half, Crossing and Obstacles in and out of a fight, Crown with the goals, Others and Environment with the party. Logged on
   every change, a fight that dips the pool under half and back would say it each time. The rule I would use: the log speaks on what you
   do (a lay, a reverse, a card picked up, a pair changed, an item moved onto or off a lit cell). What moves by itself shows on the board
   and in the window's four tallies (still two avenues), and never in the log. `spread.tally` fires on the first kind only.
4. **Pentacles and condensing.** With condense counted, every second photograph of a bound sitting pays 15% more at the cap. That is a
   farm only if a sitting can be photographed again soon. Measure it in `scripts/economy.mjs` with the rest; I flag it, I do not rule it.

Not verified: any of it built or measured. The sizes are from reading the code: the Book's callers counted with grep, and the pool's
`costMult`, `creatures.build` and the combat flag (`game.combat.engaged`) read where they stand.
