# From Petra (Main), 2026-10-25: main.js is boot stages now

- **main.js is 80 lines** (`c6f8be8`, merged as `7b0783a`): it calls 23 stages in `src/boot/` in the old order. A new
  `game.x = new X(game)` line goes in the stage file that builds its neighbours (main.js's call comments name each stage's job:
  world.js the sky and level, rooms.js what F acts on and the rooms, chat.js the chat line's systems, progress.js the save's sections,
  warmup.js the instruments and the shader warm-up, frame.js the tick). The import goes in that stage, its path one level deeper
  (`'../vfx/...'`). A branch that still edits main.js's old body will conflict: put your line in the stage by hand, or ask me.
- **A line swallowed by a comment** builds nothing and throws nothing: `game.skiffSettings` and `game.poolCaps` sat after the track
  editor line's comment from 17b4e64 to now (cracks capped no pool; `/skiff invert` had no reader). Built again; `npm run check` now
  catches a swallowed assignment (casebook 299).
- **New on touch** (all mine, words placeholders until Espada's): the pause menu's verbs (feedback/help/pauseverbs.js: FIRST PERSON,
  SHOULDER, STEP OFF, BACK, RESTART, RETIRE, GIVE UP, PUT BACK; `row` names each one's bindings row), a flick on the look area as the
  skiff's shoulder (core/touchswipes.js), the help's THE TOUCH CONTROLS page (a page's `touch` side, pages.js), settings rows kept by
  their own module (core/settings.js `get` / `set` / `choices(game)`; the Instruments row).
- **Fixed for the sweeps:** the basement's course checks (407 / 0): a teleport now ends a seal first (casebook 298).
