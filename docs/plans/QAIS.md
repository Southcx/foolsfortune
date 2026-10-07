# QAIS: the testing window inside the game (the owner, 2026-10-05)

Kept by Dovina. **Built:** `src/debug/qais/` (qais.js the window, tabs.js, store.js, evidence.js, report.js, attach.js), the look
`src/ui/qais.js`, the log's rules `src/feedback/tracking/qais.js`. The bug report it carries is `docs/plans/BUGREPORT.md`; this file is
the window around it.

**The name.** QAIS, always written so. Its expansion (Quality Assurance Interface System) appears once, in the glossary: "the System"
is the game's own voice (`progress/system.js`) and the two must never be confused.

> "What if we made the checklist/brief for my test sessions part of the game itself as well? ... I review the changelog ingame, and I
> have my own list of tests to run that you've already compiled and triaged for me?" "I want to steer things [so] that we start
> migrating to where everything happens WITHIN Fool's Fortune." (the owner, 2026-10-05)

The engine stays (three.js, Rapier); git, the builds and the sessions stay outside the game, and the game shows their results.
Prior art: Valve's `bug` command, League's PBE patch notes, TestRail, Factorio's and Minecraft's debug screens.

## Rulings

- **F8 opens QAIS** anywhere in play: the frame first (same tick), the world paused, the last tab used. Esc or F8 closes. F3 and F4
  stay the debug panel and its report (Petra, 2026-10-05).
- **Four tabs:** **Brief** (this build's changelog per division, then **Waiting on you**; earlier builds below); **Tests** (triaged by
  Dovina, grouped by area, ordered so one walk covers them; pass, fail, skip and a note); **Reports** (file one; every report with its
  status: `new`, `seen`, `fixed <commit>`, `not a bug`, `asked`); **Questions** (the digest; answers still come in Dovina's thread, as a
  decision is a conversation, not a tick box).
- **Evidence (`watch`) never ticks a test**: an event firing is not the same as it looking or sounding right. One listener on
  `game.events`; the first three sightings kept. **Take me there (`go`)** travels to a `game.places` place and closes QAIS. A test
  marked `live` must be tried with QAIS closed (real seconds, music cues, frame times).
- **Send to the brigade** marks the round sent and wakes Dovina's session (the `mcp` capability, Claude Code Remote `create_trigger`,
  as the viewer, with consent on first use; only on the owner's press). Dovina routes each fail and report to its division's folder in
  `docs/handoffs/`, sets first statuses, and carries the questions into the digest.
- **Not in `game.save`** (progress resets every build; QAIS must not). It lives in the published build's store (`db`, with `assets`
  for pictures: organization-internal, ruled by the owner 2026-10-05), read and written with `ArtifactData` on the build's URL. Away
  from the published build it says so in one line and a report saves as one file; nothing is bundled (two copies would disagree).
- **A public build is made without QAIS** (`VITE_PUBLIC=1`), from the first version, so nothing of it ships by accident.
- QAIS is a development window like F3: not text feedback in the world, counts nothing in the ledger.
- **The checklist page is retired** (the owner, 2026-10-05): its 37 rows became QAIS tests T7 to T38 in v77.

## The store

| collection | one document is | written by | fields |
|---|---|---|---|
| `brief` | one build's notes from one division (`<build>-<division>`) | Petra at publish | `build`, `division`, `lines[]`, `waiting[]`, `at` |
| `tests` | one QAIS test (`T<n>`) | Dovina (triage); the owner (adds) | `n`, `build`, `area`, `who`, `by`, `what`, `expect`, `watch?` `{ event, match? }`, `go?`, `live?`, `status`, `note`, `seen[]`, `report?` |
| `bugs` | one report (`R<n>`) | the game | as BUGREPORT.md, plus `test?` |
| `questions` | one open question | Dovina | `q`, `from`, `options?`, `answer?`, `where?` |
| `meta` | `round`: the build under test | the game, Dovina | `build`, `sentAt`, `sent` |

Writes only on a person's action or a test's first sightings, never a stream.

**Events:** `qais.report.filed { id, kind, test, title, kept?, by: 'courier' }` ("Report 12 filed: <title>.");
`qais.round.sent { round, pass, fail, skip, reports, who, woke, why? }`.

**How the brigade feeds it:** each handover note (ARCHITECTURE.md, items 7 and 8) carries **Brief** (three to six lines for the owner,
glossary words, every unit of time with its clock) and **Tests** (area, what to do, what should happen, `watch`/`go`/`live` hints).
Petra writes the brief at publish; Dovina triages the tests (merges duplicates, orders the walk, cuts what a headless run proves).
