# From Calissa (Art): hull paintings and skiff sets, for the catalogue

The owner, 2026-10-24: "what about the base skiff texture, do you have alternate designs for that? I feel like some of these cosmetics
should be designed as a full set." The looks are built; owning them is yours. Three asks.

## 1. A paint kind `hull` (a hull painting)

Six alternates of the owner's hull painting, painted on its own UV islands with its linework kept (`src/vfx/skiffhulls.js`
`SKIFF_HULLS`, `scripts/skiffpaint/hulls.py`, assets `src/assets/skiff_hull_<id>.webp`, loaded on first want). The look reads
`game.skiffPaint.worn.hull` and falls back to the owner's when `PAINT` has no `hull` kind or the id is unknown. Please add:

- `hull: [{ id: 'own', label: 'The hull as painted' }, { id: 'urushi' }, { id: 'driftwood' }, { id: 'celadon' }, { id: 'teak' }, { id: 'obsidian' }, { id: 'festival' }]`
  (labels and lines: take `SKIFF_HULLS[id].label` / `.line`, or your own; Espada's to rename once settled).
- The owner's stays first and free. How the six open and what they cost is yours. A suggestion: a firing's price, like a dye (it is a
  repaint), each opened by play near its craft (teak: a cup won; driftwood: a stretch of open sea; celadon: Wonder awakened; obsidian:
  Dread awakened; urushi: a rare glaze worn; festival: a festival or a busking night). A hull glaze still tints whichever is worn.

## 2. Skiff sets (`src/vfx/skiffsets.js` `SKIFF_SETS`)

Six sets, each one look across every slot: hull painting, dye, pattern, cut, trail, ribbon, pennant, length, wrap, card back.
Kintsugi, Driftwood, Celadon, Matsuri, Racing, Obsidian. Each slot is a list tried in order: the set's own piece first (the ids the
other builders are adding this round: patterns `kintsugi`, `seigaiha`, `checker`, `starchart`; cuts `junk`, `lateen`, `crabclaw`;
trails `ink`, `frost`, `petals`, `embers`, `starlight`; ribbons `comet`, `helix`, `suits`; pennants `swallowtail`, `prayer`, `carp`;
wraps `kintsugi`, `pinstripe`, `flames`, `roundel`; card backs `cups`, `wands`, `pentacles`, `swords`, `clay`, `nacre`, `glass`,
`brine`), then the nearest piece that exists now. A slot whose kind `PAINT` lacks is skipped. Kinds I assumed: `cut`, `wrap`, `back`
(the card back), `hull`. If yours are named otherwise, tell me and I change the table's keys; nothing else moves.

The proposal, for you to rule:

- **A set completes a collection.** Owning every piece of a set counts once in the ledger (`skiff.set.<id>`, a counter); an
  achievement per set and one for all six (a collection tier, as the glazes have).
- **Owning every piece opens the set's whole look as one choice.** A row `set` (or a SET button on the PAINT tab) that puts every
  slot on at once and is shown as one card (the set's label, line and the pieces it holds). Worn whole, a change of any slot takes the
  set off that slot only.
- **A suggested open per set**, each its craft's own feat: Kintsugi, mend every cracked region at the kiln in one game day; Driftwood,
  sail 20 squares of the open sea; Celadon, awaken to Wonder and take gold on any track in Wonder's weather; Matsuri, bank a trick combo
  of 10 during a festival hour (or busk a night); Racing, win both cups; Obsidian, finish a race at night in Dread's weather. A count
  way for each (pieces owned), as the design laws ask.
- A dye's firing price applies when a set is put on and its dye changes (the setter already does this).

## 3. Smaller

- `/skiffset <id>` (DEBUG) puts each slot on through `skiffPaint.choose`, so its `skiff.paint` events count in the DEBUG save's ledger
  (`skiff.paint.<kind>`) like any choice. If a tester's set should count nothing, `choose(kind, id, { by: 'debug' })` or a quiet flag
  would let me pass it. Until `hull` is a kind, the command wears the hull painting as the race board's preview does.
- The command says what it wore with an event, `skiff.set { set, label, worn, skipped, refused }`, and a log line in
  `feedback/tracking/race.js` (one line added there; it counts nothing).

Verified: the six paintings load and wear on the board (the sheet: `docs/plans/art/skiff-hulls-and-sets.jpg`). Not verified: any
open or price (none exist yet), the other builders' ids (applied only where they exist in git when merged).
