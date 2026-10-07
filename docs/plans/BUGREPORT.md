# The bug report (the owner, 2026-10-05)

Kept by Dovina. **Built:** QAIS's Reports tab (`docs/plans/QAIS.md` is the window around it): filing `src/debug/qais/report.js`, the
attachments `src/debug/qais/attach.js`, the markup window `src/ui/bugmarkup.js` (Calissa's). The checklist page is retired (the owner,
2026-10-05): its rows are QAIS tests T7 to T38 in v77.

## The owner's ask (2026-10-05)

> "...we should implement a formalized bug report system in-game so that I can take screenshots and mark things up within the game.
> This also means that you all can have access to much richer information of game state at the exact time I find bugs."

Prior art: Valve's `bug` command, EVE Online, Sea of Thieves, Destiny, Doom's demos: one key, the frame first, marks, few words.

## What the owner does

1. **F8**: the world pauses and the frame is taken at that instant, before any window draws over it.
2. Marks the frozen frame (pen, arrow, ring, box; red or white; undo), a layer of its own over the untouched frame.
3. A **title**, optionally **what happened** and **what should have happened**; a **kind** and a **severity**, one click each:
   - kind decides who reads it first: bug (Petra), feel (Petra, Dovina), look (Calissa), sound (Wanda), words (Espada), numbers
     (Dovina), idea (Dovina, to batch);
   - severity: blocks play, wrong, rough, a wish.
4. **File** (Enter): play resumes; the bus says `qais.report.filed { id, kind, test, by: 'courier' }`. Esc files nothing.

## What the machine attaches (every division reads the same report)

- **Where and when:** build, seed, position and facing, camera, zone and place, game day and game hour, the weather there, and a
  "stand here" line to paste into the chat.
- **What the Courier was doing:** the tech, the tool out, the lock-on target, grounded/shape state, inputs held.
- **What was around:** creatures within 30 m with their minds and statuses; props broken nearby.
- **What had happened:** the last 200 log lines, the last 300 bus events with payloads, the last 50 console warnings and errors.
- **What it cost:** the F4 report, `renderer.info`, the browser and GPU strings.
- **The state:** the whole save and the replay so far, so a division can play up to the moment headless.
- **The pictures:** the frame as drawn (480 lines, the true look) and the marks, as two PNGs.

## Where it goes

- **Published build:** two PNG assets and one JSON asset; one row `bugs/R<n>` (words, kind, severity, build, place, asset ids, the
  QAIS test if filed from one, `status: 'new'`), read with `ArtifactData list bugs`, files with `Artifact read` (`path`: the asset id).
- **Status:** the division that takes a report sets `seen`, `fixed <commit>`, `not a bug` or `asked` (with a line). Dovina triages the
  new ones after each playtest.
- **Anywhere else** (dev server, headless): one `.json` file, PNGs inline; the stress test may file one on a violation.

## Petra's answers and the rulings (2026-10-05)

- **The frame grab** reads the 480-line present target back with `readRenderTargetPixels` straight after the draw (about 1.6 MB of
  RGBA; `preserveDrawingBuffer` stays off): the true 480 lines, without the upscale.
- **The replay**: about 7 bytes a frame plus the header's save; at most 20 real minutes a recording (`MAX` in `core/replay.js`, under
  100 KB gzipped). It cannot be trimmed (it plays only from its start); for the loose world, the stand-here line and pictures fill in.
- **`db` and `assets` make the build organization-internal: ruled by the owner, yes, for now**; a public build is split off later.
