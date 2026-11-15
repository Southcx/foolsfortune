# From a sixth session (a free hand, South's ask of 2026-11-14): the Well's board, drafted

South asked for the Wells' board game designed and drafted, on `claude/brave-faraday-gjppx6`, for you to check over later. It is a
draft in DEBUG and counts nothing. The plan is `docs/plans/WELL-BOARD.md`; section 9 there says what is each of yours.

- **What is new:** `src/progress/wellboard/` (layout, rules, bot, pay), `src/world/well/board/` (the session, its page), `src/vfx/wellboard/` (the 3D view),
  `src/feedback/tracking/wellboard.js`, `scripts/wellboard.mjs` (the simulator), `scripts/wellboard-shot.mjs`, two glossary entries.
- **Hub edits:** `boot/chatcommands.js` (one import, one line: `game.wellBoard`), `feedback/tracking/rules.js` (one import, one call).
- **Others meet:** the service `game.wellBoard` (`open`, `take`, `floor`, `readout`), the chat command `/board` (DEBUG), the events
  `board.open`, `.throw`, `.land`, `.haul`, `.crack`, `.mend`, `.door`, `.out`. No save section, no shader program, no ledger key.
- **The look (South's second ask, the same day):** the board in 3D, `src/vfx/wellboard/` (WELL-BOARD.md 10): a scene of its own
  in place of the world, your Pneuka Jar the piece. Two shader programs of its own, compiled on the first `/board`, not at the
  warm-up, and not in the perf baseline. One more hub edit: the draw's line in `boot/frame.js` (both draws).
- **Nothing of the Great Dunemaw was touched** (its fight is in flux).
- **Run:** `npm run check` OK, `npm run build` OK. The stress test, perf and the full gate were not run: nothing here touches the
  core movement, physics, the save or a shared service.
- **Try:** DEBUG, `/board`. Pick a die (its reach rings the spaces it could land on), throw it. A floor asks how it went: a stand-in.

## 2026-11-15: South's third and fourth asks (the board game's own; the dice do three things)

- **The board game's own** (WELL-BOARD.md 11): three of the siblings as rivals (bots, each a style), a purse, items, a shop, Arcana
  spaces, duels, snares, a stray a ring, standings with bonus awards. **The dice do three things** (WELL-BOARD.md 12, Dicey
  Dungeon's): a die is a move, a power's price (Ward, Push, Transmute), or a blow in a battle fought with the dice you kept.
- **New files:** `src/progress/wellboard/items.js`, `battle.js`. Rewritten: `rules.js`, `bot.js`, `pay.js`, the session, the page,
  the view. New events: `board.item`, `.power`, `.arcana`, `.battle`, `.duel`, `.warded`. Two more glossary entries.
- **The HUD steps out while the board is up** (`game.ui.want('wellboard')`), so the log is not seen until it closes; the page says
  the turn. Petra: say if the log should stay (`{ log: true }` covers the board's bottom left).
- **Dovina:** section 6 is re-measured; alone it pays 1.16x the aim (`PAY.share` 0.85 is the knob). The battle's numbers
  (`BATTLE`, `FOES`, `GEAR`) and nine duels a game (`BOARD.duelRest`) are yours to rule.
- **Calissa:** a rival's Jar wears `lookOf(sibling)`; a battle in 3D is words over the Jar, not a staged fight; the Arcana card is
  a canvas stand-in (`cardSprite`), not the house deck's.
- **Espada:** every label and line in `items.js` and `battle.js` is a placeholder; the six slots borrow the tools' names.
- **Try:** DEBUG, `/board` (three rivals), `/board solo`, `/board endless`. Land on a Fight with the d20 still in hand, then again
  with it spent.

