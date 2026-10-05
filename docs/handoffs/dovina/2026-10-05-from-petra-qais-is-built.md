**2026-10-05, from Petra: QAIS is built (F8); the store's shape as it is, and what is yours to fill**
- Built to `docs/plans/QAIS.md`: `src/debug/qais/` (qais.js the window, tabs.js the four tabs, store.js, evidence.js, report.js,
  attach.js), drawn in Calissa's look (`src/ui/qais.js`). `npm run qais` drives it headless (away from the store, and over a stand-in store); the gate runs it.
- **The round** is `meta/round`: `{ build: 'v77', buildId: '<the build id, BUILD>', sent, sentAt }`. I write it at each publish with the
  Brief (`brief/<v>-<Division>`: `build, division, lines[], waiting[], at`). The window shows the tests and reports whose `build` / `round`
  is the round's `build` (the version label, `v77`), not the build id.
- Division names are lower case in the store (`petra`, `dovina`, ...: the look puts each one's suit beside it).
- **A QAIS test** (`tests/T<n>`): `n, build ('v77'), area, who, by, what, expect, watch? { event, match? }, go?, live?, status
  ('open' | 'pass' | 'fail' | 'skip'), note, seen[], report?`, and `order` if you want an order other than `n`. `match` is plain fields
  the payload must equal (`{ ok: true }`, `{ who: 'saggar' }`). `go` is a place id (`game.places`: `kiln`, `well.mouth`, ...;
  `game.places.all()` in the console lists them; `/goto <id>` tries one). `seen` entries are `{ at (real ms), gameT, gist }`, three at most.
- **A report** is `bugs/R<n>`: `n, title, happened, should, kind, severity, build (the id), round ('v77'), zone, place, stand ('/goto x y z
  yaw'), test, status ('new'), statusLine, filedAt, by (the viewer's id), frame / marks / state (asset ids) and frameUrl / marksUrl`.
  A division sets `status` to `seen`, `fixed <commit>`, `not a bug` or `asked`, a line in `statusLine`, and `taken` (the
  division's name, lower case) if it wants the slip to say who took it (Calissa's look reads it; your field to keep or drop).
- **Questions**: `questions/<id>`: `q, from, options?, answer?, where?`.
- **Send to the brigade** writes `meta/round.sent` and makes a one-off Routine into your session (`create_trigger` through the owner's
  Claude Code Remote connector, a minute and a half ahead), its prompt opening "From the owner, through QAIS:" with the counts.
- Yours: the round's tests (copy the checklist's rows in as `tests/T<n>` for the round, then the checklist page can be retired with
  the owner's word), the questions, and reading each sent round. I seeded v77 with the Brief and five QAIS tests for QAIS itself.
