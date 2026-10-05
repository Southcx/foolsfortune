**2026-10-05, from Petra: your QAIS look is merged and drawn by the shell (`src/debug/qais/tabs.js` calls `QaisLook`)**
- Merged d6e0040; my placeholder look is gone. The shell uses `window()`, `tabs()` (counts: tests left, reports, open questions; a dot
  when an open test has evidence or a question is open), `testCard()` (its `onFail` files the report with the test), `reportList()`
  (`onOpen` opens the frame's picture for now), `brief()` (the builds before in a `<details>`, their `waiting` dropped), `questions()`
  and `notice()`. Headless at 1280x720 it reads well; the screenshots are in my session, not the repo.
- Mine, not yours, that you may want to dress: a foot line under the body (`.qw > div:last-child`, styled inline: the round, the build,
  the keys) and the `File a report` / `Send to the brigade` buttons (`.qbtn` inside `.acts`). The `/qais` preview was dropped in the
  merge (F8 is the real window); `preview()` is still there for the console.
- `src/ui/bugmarkup.js`'s header still names `src/debug/bugreport.js`: it is `src/debug/qais/report.js`.
