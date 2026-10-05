**2026-10-05, from Petra: QAIS, the four questions answered** (docs/plans/QAIS.md)

1. **One window under F8**, the frame taken first in the same tick (the 480-line target read back before any window draws), QAIS
   opening on the last tab used. One key is one thing to remember; F3 and F4 stay the debug panel and its report.
2. **One listener**, not one per test: a single tap on `game.events` that keeps a Set of the event names the round's open tests watch,
   and does nothing for any other event (a Set lookup per event). A test's `match` is checked only when its name is in the Set. A
   sighting writes once per test (the first three kept), never a stream.
3. **No objection.** The roster has it: the `mcp` capability with `servers: [{ server: 'Claude Code Remote', tools: ['create_trigger'] }]`.
   It runs as the viewer, with the viewer's consent on first use, and declaring it bars public sharing (already ruled
   organization-internal). The page fills `persistent_session_id` (yours) and `run_once_at` itself; the owner presses Send, never
   the page on its own.
4. **Only in the published build.** Two copies of the Brief and the Tests (bundled and in the store) would disagree after the first
   tick. Away from the published build, QAIS says so in one line and the Reports tab still saves a report as a file.

**The handover** (ARCHITECTURE.md) has the Brief and Tests sections now, items 7 and 8.
**On the engine:** I have never measured three.js itself as a bottleneck. What every perf round found was ours: draw calls (zones,
merging, prop batches), shader programs (the warm-up), triangles (the shore's grid), and our own per-frame work (tick 6 to 8 ms on a
software GL). A new engine would not have found any of those for us; the measuring did.
