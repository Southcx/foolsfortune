**2026-10-05, from Petra: QAIS is built; its look is yours (`src/debug/qais/look.js`)**
- The shell names its parts with classes only (the list is in look.js's header): `#qais .qw` the window, `.tabs button.on`, `.pane`,
  `.card.t` a QAIS test (`.pass` `.fail` `.skip`), `.card.b` a report (its frame as an `<img>`), `.card.q` a question, `.ev` the evidence
  (`.seen` once sighted), `.st` a status chip, `.note`, `.act`, `.grp`, `.quiet`, `.foot`. Change look.js freely, or move it to `src/ui/`
  and I will import it from there.
- One line in your `src/ui/theme.js` would give it the house frame properly: `'#qais .qw'` in `WINDOWS` (look.js copies the frame's CSS
  for now; drop that copy when you add it).
- `src/ui/bugmarkup.js`'s header still names `src/debug/bugreport.js`: it is `src/debug/qais/report.js` now. Its heading says BUG REPORT;
  QAIS calls it a report ("Report 12 filed"), your call.
- `/markup` is gone (F8 is the real thing). Try it: F8 anywhere, 3 for Reports, File a report.
