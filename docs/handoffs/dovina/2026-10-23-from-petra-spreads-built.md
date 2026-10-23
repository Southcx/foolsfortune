# From Petra: spreads, my parts 1, 2, 3 and 5 built (2026-10-23)

On `claude/fps-third-person-demo-8zp2kx`: 8f2b9e2 (the storage move) and f5f90f3 (the laid spread, its events and the tallies' hooks).
The reading view (part 4) is next.

## For your window (pneuka/ui.js, pneuka/loadout.js)

- **The laid spread:** `game.laidSpread` (`progress/laidspread.js`).
  - `.spread`, `.laid` (`{ [position]: { card, reversed, at } }`), `.under`, `.hand` (bound Majors not laid, not the Fool, not the pair's).
  - `.choose(id)`, `.lay(position, card, reversed)`, `.pick(position)`, `.reverse(position)`, `.flip(under)`.
  - Read `.cells` (the face's 56 from your `light()`), `.sums`, `.counted`, `.effect(suit)`.
  - Recounted at once after an act, else every half real second. Your stand-in can go.
  - **The flip key is F**, in the window. The world's keys are not read while it is open (`windowOpen`). Spend it (`input.spend`), and
    call `.flip()`.
- **The gate on spreads is yours.** `choose(id)` takes any spread. Check your opening achievements (SPREADS.md 5.5) before you call it.
- **The storage** replaces the bank (`pneuka/box.js`):
  - `box.storage` (`[{ id, n, uses?, data? }]`), `box.storageOpen` (only from a Shrine's STORAGE row, while the window is open).
  - `box.store(slot)`, `box.storeAll()`, `box.withdraw(i)` (index into `box.storage`), `box.stored(id)`.
  - Any thing stores now, not only a thing with a card.
  - Your pane still reads `box.book`, which is gone, so it shows its header only. `box.bankOpen` and `box.openBank()` stay as the
    storage's old names until your pane moves. The `it.card` test in `actions()` only lets curios store; drop it. The glossary retires
    "the bank".

## Rules that changed, yours to confirm

1. **Myggdrasil's branches:** `hang(arcana)` needs the card bound and no longer takes it (a card is bound once). Tell me if a branch
   should cost something else instead.
2. **The Fool is bound from the start,** with no `card.get` for it. An achievement counting `card.got.arcana.fool` can no longer be
   reached.
3. **`light()` reads one `ctx.since`** for every fading or growing position. I pass the Past's (or the Future's), plus
   `ctx.sinceOf(positionId)` for when `light()` asks per position, so a Past and a Future laid apart fade on their own clocks.
4. **The Pentacles hook is one factor in your shop:** `offer()` in `progress/shop/shops.js` gets `(this.game.laidSpread?.worthK ?? 1)`.
   It stays under the shelf's ask less a cube. Your handoff named this hook as mine; move it if you'd rather.

## The ledger, for the spreads' feats

- `spread.counting.<spread>` is a best: the most cells counting.
- `spread.full.<spread>` counts the times every lit cell counted ("a clean three-card").
- `spread.undark.<spread>` is the best counting with no cell dark ("no dark cell and twelve counting").
- Also counted: `spread.lay`, `spread.crack`, `spread.complete.<spread>`.

## Not verified

- Any of it by hand.
- The numbers. They are yours and stand as `TALLY` drafts.
