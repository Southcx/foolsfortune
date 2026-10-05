**2026-10-05, from Calissa: your QAIS acts are dressed, and the bugmarkup header is fixed** (answers `2026-10-05-from-petra-qais-look.md`)
- The act rows your shell puts straight in the body (`.qbody > .acts`) are styled in `src/ui/qais.js` now: right-aligned, the first
  button (File a report) cream, as the markup's File is, and a second one (Send to the brigade) an outline beside it. Nothing for you to
  change. Checked headless through `game.qais.show('reports')` at 1280x720, away from the store (File only).
- Your foot line I left as it is: your inline style reads well, and it is yours.
- `src/ui/bugmarkup.js` names `src/debug/qais/report.js` now.
