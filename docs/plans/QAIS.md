# QAIS: the testing window inside the game (the owner, 2026-10-05)

Kept by Dovina. A spec for Petra (who builds it: `src/debug/qais/`, the published build and its capabilities) and Calissa (its look,
and the markup component `src/ui/bugmarkup.js`). The bug report it carries is specified in full in `docs/plans/BUGREPORT.md`; this file
is the window around it. Nothing here is built yet.

**The name.** QAIS, always written so. Its expansion (Quality Assurance Interface System) appears once, in the glossary, and nowhere
else: "the System" is the game's own voice (`progress/system.js`), and the two must never be confused.

## The owner's ask

> "What if we made the checklist/brief for my test sessions part of the game itself as well? Like rather than each of you giving me
> updates in these threads, I review the changelog ingame, and I have my own list of tests to run that you've already compiled and
> triaged for me? It could be an expansion of the bug reporting module."
>
> "I want to steer things [so] that we start migrating to where everything happens WITHIN Fool's Fortune. Make it a one-stop shop with
> all the tooling we need to keep the engine purring and expanding into the future."

So QAIS is where the brigade's tooling meets the owner: what changed, what to try, what went wrong and what became of it, read and
done in the build itself. The engine stays as it is (three.js, Rapier: Dovina's reply to the owner, 2026-10-05); git, the builds and
the sessions stay outside the game, and the game shows their results.

## Prior art

- **Valve's Source `bug` command, EVE Online's and Sea of Thieves' in-game reporters** (BUGREPORT.md): one key, the state attached.
- **In-client patch notes** (League of Legends' PBE client, Warframe's and Path of Exile's in-game notes): the changes read where they
  are tried, per build.
- **Test-case managers** (TestRail and its kind): a case is steps, an expected result, a build, a status and a note; a run is the cases
  for one build, triaged before a tester sees them.
- **Our own ledger and achievements**: a predicate over what happened. A QAIS test can watch for its evidence the same way, but only
  as evidence: the owner judges.
- **Factorio's and Minecraft's debug screens** (our F3): development tooling that lives in the game and is switched off for release.

Taken: one window per build, its notes, its triaged tests and its reports together; the machine gathers evidence and state, the
person judges.

## The window

**F8 opens QAIS** anywhere in play. The frame is taken first (BUGREPORT.md: the 480-line target read back in the same tick), the
simulation pauses, and QAIS opens on the tab last used. Esc closes it and play resumes where it stopped. Four tabs:

1. **Brief**: this build's changelog. A heading per division, a few lines each in plain words (what changed for the player, what to
   try), then **Waiting on you**: what each division needs from the owner. The builds before it are a list below, newest first.
2. **Tests**: the owner's QAIS tests for this build, triaged by Dovina (grouped by area, ordered so one walk covers them). Each shows
   what to do and what should happen, its build, who wrote it, three buttons (pass, fail, skip) and a note. Two helpers:
   - **Evidence** (`watch`): a test may name the event it expects (`weather.change`, `npc.say` from Saggar...). While the test is open
     in the round, the game listens; when the event fires, the test shows "seen" with the real time and the payload's gist. It never
     ticks itself: an event firing is not the same as it looking or sounding right.
   - **Take me there** (`go`): a test may name a place (`game.places`: `well.mouth`, `folk.grog`...); the button travels there as the
     Index does, and closes QAIS.
   A test marked `live` must be tried with QAIS closed (anything that counts real seconds, music cues, frame times): it says so.
3. **Reports**: **File a report** uses the frame taken when F8 was pressed: the markup, a title, kind and severity (BUGREPORT.md). A
   report filed from a test's **Fail** carries that test's id. Below: every report on this build with its status (`new`, `seen`,
   `fixed <commit>`, `not a bug`, `asked`) and who took it.
4. **Questions**: the digest, the divisions' open questions for the owner, read here. Answers still come in Dovina's thread (a
   decision is a conversation, not a tick box); an answered question shows the answer and where it was given.

**Send to the brigade** (on Tests and Reports): marks the round sent and wakes Dovina's session, who reads the round, routes each fail
and report to its division, and answers in the owner's thread.

QAIS is a development window the player opened, like F3: it is not text feedback in the world. It counts nothing in the ledger. The
log says one line only, when a report is filed (`qais.report.filed { id, kind, test, by: 'courier' }`, a rule in `tracking.js`:
"Report 12 filed: <title>.").

## The data (the published build's store)

QAIS keeps nothing in `game.save` (progress is reset with every build; QAIS must not be). It lives in the published build's own store
(the `db` capability, with `assets` for the pictures: organization-internal, ruled by the owner 2026-10-05), which survives every
republish to the same URL. Every division reads and writes it with `ArtifactData` on the build's URL.

| collection | one document is | written by | fields |
|---|---|---|---|
| `brief` | one build's notes from one division (`<build>-<division>`) | Petra at publish, from the handover notes | `build`, `division`, `lines[]`, `waiting[]`, `at` |
| `tests` | one QAIS test (`T<n>`) | Dovina (triage); the owner (adds) | `n`, `build`, `area`, `who`, `by`, `what`, `expect`, `watch?` `{ event, match? }`, `go?`, `live?`, `status`, `note`, `seen[]`, `report?` |
| `bugs` | one report (BUGREPORT.md) | the game | as BUGREPORT.md, plus `test?` |
| `questions` | one open question | Dovina | `q`, `from`, `options?`, `answer?`, `where?` |
| `meta` | `round`: the build under test, when it was sent | the game, Dovina | `build`, `sentAt`, `sent` |

Writes are few and only on a person's action (a tick, a note's pause, a report) or a test's first sighting of its evidence (one write a
test, never a stream). A test's `seen` keeps the first three sightings.

**Away from the published build** (the dev server, the headless runs): `use("db")` is null, so QAIS says in one line that it lives in
the published build, and the Reports tab still saves a report as one file (BUGREPORT.md). Nothing is bundled (two copies would disagree
after the first tick: Petra). The headless runs never open it.

**A public build** (later, when there is one to share) is built without QAIS: one switch at build time (`import.meta.env`), from the
first version, so nothing of it ships by accident.

## How the brigade feeds it

- **The handover note** ("The handover", ARCHITECTURE.md) gains two short sections: **Brief** (three to six lines for the owner, in
  the glossary's words, every unit of time with its clock) and **Tests** (each: area, what to do, what should happen, and the
  `watch`/`go`/`live` hints where they fit). Petra writes the brief at publish; Dovina triages the tests into the round (merges the
  duplicates, orders the walk, cuts what a headless run already proves).
- **After a round is sent**, Dovina reads it, writes each fail to its division's folder in `docs/handoffs/`, sets the reports' first
  status, and carries the questions into the digest.
- **The checklist page** is retired (the owner, 2026-10-05): its 37 rows are QAIS tests T7 to T38 in v77, and the page is deleted.

## Who does what

- **Petra:** `src/debug/qais/` (the window's shell, the store, the evidence watch on `game.events`, take me there through
  `game.places`, the frame and the attachments of BUGREPORT.md), the build's capabilities (`db`, `assets`, and the Claude Code Remote
  connector for **Send to the brigade**), the build switch, and the brief at publish.
- **Calissa:** the look of QAIS (the tabs, a test's card, the evidence mark, the report list) and the markup component.
- **Dovina:** this data shape, the triage and the tests, the questions, and reading each sent round.
- **Every division:** the Brief and Tests sections of its handover note.

## Petra's answers (2026-10-05)

1. **One window under F8**, the frame taken first in the same tick, QAIS opening on the last tab used; F3 and F4 stay the debug panel
   and its report.
2. **One listener**: a single tap on `game.events` holding a Set of the event names the round's open tests watch; a test's `match` is
   checked only when its name is in the Set; a sighting writes once per test (the first three kept).
3. **The connector**: the `mcp` capability with `servers: [{ server: 'Claude Code Remote', tools: ['create_trigger'] }]`, as the viewer,
   with the viewer's consent on first use; the page fills `persistent_session_id` and `run_once_at`; Send only on the owner's press.
4. **Only in the published build** (above).

The handover (ARCHITECTURE.md) carries the Brief and Tests sections (items 7 and 8). Petra builds QAIS on the owner's word in her thread.
