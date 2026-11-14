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
