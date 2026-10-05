# The bug report and the checklist (the owner, 2026-10-05)

Kept by Dovina. A spec for Petra (who builds the bug report: `src/debug/`, the published build and its capabilities) and Calissa (the
markup window's look). Nothing here is built yet except the checklist page. **Since 2026-10-05 the bug report is QAIS's Reports tab and
the checklist becomes its Tests tab: `docs/plans/QAIS.md` is the window around this file**; F8 opens QAIS with the frame already taken.

## The owner's ask

> "I'm gonna start needing a checklist of things to test. If you could make it interactive so I can just tick boxes and send them back
> to you, that'd be great. [...] Better yet, we should implement a formalized bug report system in-game so that I can take screenshots
> and mark things up within the game. This also means that you all can have access to much richer information of game state at the
> exact time I find bugs."

Two tools, one loop: the **checklist** says what to try; the **bug report** says what went wrong, with the game's whole state attached.
A checklist item that fails is answered by a bug report that names it (`C12` in the report's title).

## 1. The checklist (built: https://claude.ai/artifact/GQSpDGYUuPVF7SzDU5RbGU, source `docs/checklist/checklist.html`)

- One page, kept by Dovina. Each **item** has an id (`C1`...), an area, the division that owns it, what to do (in the glossary's
  words, every unit of time with its clock), and what should happen.
- The owner ticks **pass**, **fail** or **skip**, writes a note on any item, and adds items of their own.
- **Send to the brigade** marks the round sent and, where the owner's Claude Code Remote connector is allowed for the page, wakes
  Dovina's session. Dovina then reads the rows, routes each fail to its division (a handoff, or the bug report it names), and batches any
  questions into the owner's digest.
- The rows live in the page's store (the `db` capability), so every division can read them (`ArtifactData list items` on the page's
  URL), and a new round never loses the last one's notes.

## 2. The bug report (to build: Petra)

### Prior art

- **Valve's Source engine `bug` command**: one key in the game opens a form that has already taken a screenshot and filled in the map,
  the position (`setpos`/`setang`, pasteable to stand there again), the build and the session; the tester writes a title and a line.
- **EVE Online's in-game bug reporter** and **Sea of Thieves' Insider reporter**: logs and the client's state attached without asking.
- **Destiny's and The Division's internal reporters**: draw on the frozen frame (an arrow, a circle) before writing a word.
- **Doom's and Quake's demos** (already ours: `src/debug/replay.js`): the report carries the replay, so a division can stand in the
  owner's exact play up to the moment.

Taken: one key, the frame frozen and taken first, marks drawn on it, few words asked, everything else attached by the machine.

### What the owner does

1. Presses **F8** anywhere in play. The simulation pauses and the frame is taken at that instant (before any window draws over it).
2. Draws on the frozen frame: a **pen**, an **arrow**, a **ring**, a **box**; two colours (a hot red and white); undo. The marks are a
   separate layer, so what is under them is kept.
3. Writes a **title** (one line) and, if wanted, **what happened** and **what should have happened**. Picks a **kind** and a
   **severity** (each one click, with a default):
   - kind: bug (Petra) · feel (Petra, Dovina) · look (Calissa) · sound (Wanda) · words (Espada) · numbers (Dovina) · idea (Dovina, to
     batch) · decides who reads it first;
   - severity: blocks play · wrong · rough · a wish.
4. **File** (Enter). The window closes, play resumes where it stopped, and the log says so (`qais.report.filed { id, kind, test, by:
   'courier' }`, a rule in `tracking.js`: "Report 12 filed: <title>."). Esc closes the window and files nothing.

The window is a development tool the player opened, like the F3 panel: it is not text feedback in the world, and it goes away when
filed. It never counts in the ledger.

### What the machine attaches (every division reads the same report)

- **Where and when:** the build (`BUILD`), the page's seed, the Courier's position and facing, the camera, the zone and the place
  (`placeOf`), the game clock (game day and game hour, `calendar.now()`), the weather there (`game.weather.at`), and a "stand here"
  line that a division can paste into the chat to stand where the owner stood.
- **What the Courier was doing:** the tech running, the tool out (`belt`), the target locked, the grounded/shape state, the inputs
  held.
- **What was around:** the creatures within 30 m with their minds (the F3 panel's lines), the statuses on them, the props broken
  nearby.
- **What had happened:** the last 200 lines of the log, the last 300 events on the bus with their payloads (a ring buffer on
  `game.events`), and the last 50 console warnings and errors (a ring buffer installed at boot).
- **What it cost:** the F4 report (`diag.report()`), `renderer.info`, the browser and GPU strings.
- **The state:** the whole save (every section of `game.save`, so a division can load it), and the replay so far (`game.replays`), so
  a division can play up to the moment headless.
- **The pictures:** the frozen frame as drawn (480 lines, the true look) and the marks layer, as two PNGs.

### Where it goes

- **In the published build** (an Artifact): the page declares `db` and `assets`. The two PNGs and one JSON (the state, the save, the
  replay) are uploaded as assets; one row `bugs/<id>` holds the title, the words, kind, severity, the build, the place, the asset ids,
  the checklist item if named, and a `status` (`new`). Every division reads them with `ArtifactData list bugs` on the build's URL and
  fetches the files with `Artifact read` (`path`: the asset id).
- **Status:** the division that takes a report sets `status` to `seen`, `fixed <commit>`, `not a bug` or `asked` (with a line), so the
  owner sees in the F8 window's **Reports** tab what became of each one. Dovina triages the new ones after each playtest.
- **Anywhere else** (the dev server, the headless test, a page without the capabilities): the report is saved as one `.json` file
  (the PNGs inline) to hand over by any means; the stress test may file one on a violation.

### Petra's answers (2026-10-05)

1. **F8 is free**: nothing in `src` binds it, and the browser does nothing with it unless devtools are open.
2. **The frame grab**: in the same tick. The present pass (`render/present.js`) draws the scene into its 480-line target; it is read back
   with `readRenderTargetPixels` straight after the draw (about 1.6 MB of RGBA), before any window opens. `preserveDrawingBuffer` stays
   off. What is filed is the true 480 lines, without the upscale.
3. **The replay**: about 7 bytes a frame (input only) plus the header's save; a recording holds 20 real minutes at most (`MAX` in
   `core/replay.js`), about 510 KB, under 100 KB gzipped (`CompressionStream`). A replay plays only from its own start, so it cannot be
   trimmed to "the last ten real minutes": when a recording fills, a new one begins from that moment (as `/record` does: the save comes
   back, the loose world does not). A report carries a replay of at most the last 20 real minutes, which reproduces anything that lives
   in the save; for the loose world, the stand-here line and the pictures fill the gap.
4. **`db` and `assets` make the build organization-internal**: **ruled (the owner, 2026-10-05): yes, organization-internal for now**;
   a public build is split off when there is one to share.

The markup window: Calissa offers it as one component (`src/ui/bugmarkup.js`) that Petra calls with the frozen frame.
