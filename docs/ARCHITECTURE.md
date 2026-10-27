# Architecture

How the game's code is laid out, the rules every module keeps, and how a change gets onto main. Petra owns this file and enforces it at
the gate; any division may propose a change to it (a question to Petra, or a note in `docs/handoffs/petra/`). The words are in
`docs/GLOSSARY.md`; this file is the structure.

## Principles

1. **One way to do a thing.** A second system for something the game already does (a second effects system, a second inventory, a
   second log) is a fork, and forks rot. Extend the one there is, or replace it in one move.
2. **Services, not reaching in.** A module asks another domain through its service on `game` (`game.creatures.strike`,
   `game.vfx.play`, `game.cubes.earn`, `game.events.emit`), not by importing the other domain's internals and poking them.
3. **Data over code.** Tables, looks, sequences, odds, prices and lines are data (`progress/econ/table.js`, `vfx/library.js`,
   `cine/sequences.js`, `npc/talks.js`); code says when, data says what. A data module imports nothing that touches three.js, so a Node
   script can read it as the game does.
4. **Small interfaces.** A module does one job and says how to use it in its header. If it takes a paragraph to say what a module is,
   it is two modules.
5. **The folder is the owner.** The layout below follows the five lanes (CLAUDE.md, Threads), so who owns a file can be read off its path.
6. **Measured, not assumed.** A change that may cost frames is measured (`npm run perf`) before it lands.

## Layout

Since the restructure (R42, Phase 1 below) the `src/` root holds `main.js` alone. The move map at the end of this file says where each
file came from.

```
src/
  main.js        the composition root: builds the services, registers the techs, runs the frame        (Petra)
  boot/          the boot stages in order (the save .. the frame); entry.js: the box room or the game  (Petra)
  core/          services every module may use, and nothing of the game itself                         (Petra)
  courier/       the Courier: body, animation, moves (techs), vessel, the pool, the skiff, the ship      (Petra)
  tools/         the belt, the held-tool base, and one folder per tool                                  (Petra; shared parts)
  world/         places and the things in them: workshop, basement, dunes, props, treasure, ground marks, the Emocean's crossing (Petra)
  creatures/     creatures, their minds (ai/), statuses, clapperjars, spirits                           (Petra)
  progress/      the System, the ledger, achievements, the economy, the shops                           (Dovina; shops' code Petra's)
  feedback/      the log and its rules, the chat line, the HUD, the Codex, the map, the Index, help      (Petra; strings Espada's)
  godhand/       the god hand and its arts                                                              (Petra)
  npc/           the folk and their dialogue                                                            (Petra; lines Espada's)
  render/        how the game draws: zones, the light budget, the 480-line present                      (Petra)
  vfx/  ui/      what the game draws: effects, windows, the sky                                         (Calissa)
  audio/ music/  what the game sounds like, and the System's voice                                     (Wanda)
  cine/          sequences (cinematics as data)                                                         (Calissa)
  title/         the title screen                                                                       (Petra; art, cue, words theirs)
  workbench/     the studio                                                                             (Calissa)
  debug/         the diagnostics overlay, the tuning panel, replays, QAIS (qais/: F8, the owner's testing window)  (Petra; QAIS's look Calissa's)
  agent/         the game as an AI player sees and drives it (observe, act: docs/plans/COOP.md)         (Petra)
  coop/          the party: siblings (Couriers with minds, the divisions'), their answers (sample) and letters (sessions), guests over
                 the page's room (COOP.md)  (Petra)
  assets/        models, textures, fonts, clips                                                         (Calissa)
scripts/         Node scripts: the gate's checks, the stress test, the playtests, bakes and exports
docs/            the bibles: GLOSSARY, ARCHITECTURE, DESIGN, LORE, ART, VFX, AI, ECONOMY, OST, HANDOFFS
```

## Imports

- `core/` imports nothing from the rest of `src/` (three.js and Rapier only).
- A data module (a table) imports no module that touches three.js.
- Nothing imports a tracking rule: `feedback/` listens to the bus; it is never called.
- Across domains, prefer the service on `game` to an import. An import of another domain's module is fine for its **exported
  interface** (a class to construct in `main.js`, a pure helper, a table); never to reach its private state.
- No import cycles between domains. (`npm run check` will report them once it learns cycles; until then, the review does.)
- three.js is pinned (0.170.0) and never edited in `node_modules`. A bug or a slow path in it is shimmed in one place,
  `render/threefixes.js` (imported first in `main.js`), each shim with what it stands in for and the code it names, deleted when three
  is upgraded past it. A material drawn by two kinds of mesh at once gets a view of it for the second kind (`render/materialview.js`).

## The module contract

Every module under `src/`:

1. **Starts with a header comment**: what it is (in the glossary's words), the prior art it took from and where, and its interface as a
   few lines of usage (`const x = new X(game)   x.do(a)   x.done`). The modules that have one already are the model.
2. **Does one job** and stays under **800 lines**. Past that, it is split by job, not by line count.
3. **Uses the glossary's names**, in code and in comments.
4. **Has no side effects at import time.** It is built by `main.js` (or by its owner), and it registers itself with the services it needs.
5. **Speaks through events** when something happened that others may care about, and through `log.say` only for a refusal at the point
   of use (with a `throttle`). Celebrations are tracking rules (CLAUDE.md, Feedback).

## Names

| what | form | examples |
| --- | --- | --- |
| a file | lower case, one or two words run together, the glossary's word | `groundmarks.js`, `lightbudget.js` |
| a class | PascalCase, the glossary's word | `VesselDamage`, `PropBatch` |
| a service | `game.<noun>`, lower camel case | `game.vfx`, `game.cubes`, `game.belt` |
| an event | `domain.verb` (or `domain.thing.verb`): the domain is a glossary noun | `courier.shatter`, `jar.shatter`, `crystal.strike` |
| an event payload | plain keys; an outcome carries `by`; never `name` or `t` | `{ by: 'courier', dur: 1.2 }` |
| a ledger key | mirrors its event: `domain.thing[.qualifier]` | `grapple.swing.time`, `photo.stars.3` |
| a tag | a lower-case adjective or material | `sliceable`, `clay` |
| an effect | `kind.subject[.variant]` | `hit.slash.clay.kill`, `swing.cutlass` |
| a sequence | `owner.event` | `lockheart.opening`, `chest.open` |
| a chat command | one lower-case word, no alias that keeps a retired word alive | `/workbench`, `/vfx` |
| stored settings | `foolsfortune.<area>.v<N>` | `foolsfortune.help.page` |

## Hubs

Three files every division touches, so three files kept short:

- **`main.js`** builds the services and registers the techs. It is the composition root, not a place for features. A feature lives in
  its own module and is constructed here in one line. (Phase 2 splits its boot into stages.)
- **`tracking.js`** installs the log's rules and keeps what they share (the break chain, the record notes, the per-frame sampler); the rules
  are one file per domain under `feedback/tracking/`, called in order from `tracking/rules.js`, so a division adds a rule in its own
  domain's file.
- **`config.js`** holds the tuning numbers of feel (movement, combat timings). Petra's; the core movement is the gold standard.

## The save

Everything the game keeps goes through `game.save` (`src/core/save.js`). A system that keeps something registers a **section** in its
constructor (`save.section(id, { scope, version, dump, load, reset, migrate, check })`; `load` runs at once with what was kept, or `reset`
with nothing) and calls `save.dirty(id)` when it changes; `main.js` flushes once a frame, writing each changed **scope** whole. State that
must agree is one section (the box and the belt are the `kit`). What must hold after loading is the section's `check` (every tool
somewhere). Scopes: `player` and `world` are progress (wiped on a new build: `save.boot`), `settings` is kept. Something that borrows the
game holds the save and releases it (`save.hold('overture')` ... `save.release('overture')`: every section reloaded). `save.export()`
gives the whole of it as one text (a backup, a bug report). Keys a module still writes itself are **adopted** (declared in `ADOPTED`)
until their owner moves them into a section; the check's `save.storage` rule fails any new `localStorage` outside `save.js`.
(`player` and `world` are apart for co-op: a player's sections travel with them; the host owns the world's.)

## Budgets

What a frame may cost. `npm run perf` measures them; the gate holds every push to them and to the last published build's numbers
(`scripts/perf-baseline.json`).

| measure | budget | tolerance against the last build |
| --- | --- | --- |
| draw calls a frame (every pass) | 450: the owner's RTX 3060 Ti on Firefox (which reports it as a GTX 980: Firefox buckets the GPU name) spends about 26 µs a call on the CPU (177 calls, 4.68 ms, 2026-10-12), so 450 is about 12 ms of a 16.7 ms frame with the tick beside it; merge, batch and instance rather than raise it | +8% |
| triangles a frame | 1,000,000 (the owner, 2026-10-12: "get a lil crazy with the level geometry"; at 480 lines the GPU idled at 88k, the frame on vsync with 4 ms of CPU; was 350,000) | +8% |
| shader programs alive | 216 (212 to 216, 2026-10-27: the open sea's looks, named by the census in scripts/perf.mjs BUDGET; 202 to 212, 2026-10-25, on Calissa's reasons): one shared program a look, every one compiled in the warm-up; raised only by a commit that names the looks and the reason (196 to 200, 2026-10-19: board v11's duel view and domains' clash, the aberrant wipe, the Soul Brush's desk, all warm at boot; 192 to 196, 2026-10-18: the overlay's pieces; 191 to 192, 2026-10-13: the bracelet's merged body, which cut its draw calls from ~17 to 2 a form; 189 to 191, 2026-10-13: the bracelet's glazes, charms, flash and aura, warm at boot; 192 to 189, 2026-10-13: Calissa folded three; the last raise: the ten heavy shells' looks (ground rings, scorch, debris, the mega meteor) and the Lantern Wisp's, warm at boot, 184 to 192, 2026-10-13; before it, the caster shells' looks parked warm at boot, 177 to 184, 2026-10-12; before it, the caster shaders S1 to S10, heat haze, bubbles, lightning, frost and bisque, the rift, lensing, the time grade, the hologram, molten, the corrupted body, 164 to 177, 2026-10-12) | +6% |
| JS heap, the built game | 320 MB (the owner, 2026-10-21): what a player's page holds, `dist/` under vite preview after the workshop, the Dunes and a Dunemaw hall, gc'd; 293 MB at v258 (331 before the prop batches started small: render/propbatch.js) | +12% |
| JS heap, the dev server | 600 MB (the owner, 2026-10-21; was 500): the same route on the dev server, which also holds every module's source text and source map, so it grows with the code; the built game's is the one a player feels. Earlier raises are in `scripts/perf.mjs` | +12% |
| tick and draw time (software renderer, relative) | none | +25% |
| a module | 800 lines | the baseline only falls |


## Areas (built on entry, disposed on exit)

Ruled by Petra, 2026-10-25, on the owner's ask (through Calissa: FFXII's zone transitions and loading screens are fine; revisitable
chunks over an empty open world; the XR the floor). What an area is for play is Dovina's (`docs/plans/AREAS.md`); this is the engine.

**Measured first** (the built game at High, 2026-10-25, geometry buffers and texture pixels by render zone, all resident at once): the
basement 10 MB of geometry and 116 MB of textures (128 sign labels at 512 x 160, about 56 MB; the duel's flee canvas at 2048 x 2304
with its 1024 x 1152 glow, about 31 MB, parked there by the warm-up); the workshop 33 + 17; the Dunes 8 + 15; nothing in any one place
(sky, terrain, the Courier) 12 + 10; the bazaar 11 + 3. The JS heap at boot is 73 MB and moves under 4 MB when a place is disposed:
what a phone's tab pays is the buffers and the textures, which the JS heap does not count. So the memory is in the basement and the
workshop, not the Dunes: the Dunes' split is for play and for density, and the first area to dispose is the basement.

**The unit.** An area is content, not code: a module keeps its code loaded (a few KB) and builds what it draws and collides with on
entry, and disposes it on exit (geometry, textures, its own materials, its colliders, its lamps' slots). A program goes when its last
material does. No dynamic import per area: the pack and the iOS loader (index.html, `scripts/pack.mjs`) stay as they are, every file
unpacked once; what an area frees is what it built.
- **Built, 2026-10-25 (v277):** `register(id, { zones, near, build(game), teardown(game) })`: an area given both is built when the
  camera is in it or beside it (`ensureAt(zone)`, called by `course.teleport` before a move, builds where a teleport lands) and torn down
  a GRACE (3 real s) away; one without stays built and is evicted (GPU) and, on a phone, **dehydrated** (its geometry's arrays packed
  into a Blob, put back on approach: measured identical, triangle for triangle). Each area's owner converts its own module to `build` /
  `teardown`; the module stays alive and answers nothing while torn down.
- `game.areas` (the plan's first form): `register(id, { build(game) -> handle, dispose(handle), doors })`, `enter(id, door)`, `current`; the
  build runs under the seam, the old area disposed first, then the new one built, then its programs compiled (`renderer.compileAsync`)
  before the cover lifts.
- **The transition is the seam** (`render/seam.js`, `seam.cross(fn, { kind: 'area' })`): a kind with a wipe of its own crosses under it
  (`game.areaWipe`, Calissa's: the Gate's hoops, the name in the System's type, the card of where you go). The seam already holds the
  cover until the new place's first frame is drawn.
- **Resident always:** the Courier and the belt, the overlay, the shared programs (the finish, the liquid, particles, the toon ramp),
  the save and every system's state. An area holds drawing and physics only (Dovina's A1); a system catches up from the clock on entry
  (A4, `area.enter { id, from, away, by }`).
- **No look assumes another area is loaded** (Calissa's rule, adopted). A warm-up parks only resident looks; an area's own looks are
  compiled at its entry, behind the cover.
- **Budgets per area:** `npm run perf` measures one area at a time with the others unbuilt; the heap budget becomes the resident set
  plus the largest area. A run of the whole route is kept for the gate's history until every place is an area.

**Stage 1, built (2026-10-25): eviction** (`render/areas.js`). Each built-at-boot place is registered as an area of render zones with
its neighbours; out of an area and its neighbours for 3 real s (at once while the seam covers the view), its geometry and textures that
nothing outside it draws are disposed in one pass over the scene (40 real ms headless for seven areas), and uploaded again on entry
before the first frame (a baked canvas draws itself again: the bazaar's house atlas about 3 real s headless, under the cover). The end
of the warm-up lets go of every area not beside the camera. Measured (the built game, estimated GPU bytes): standing in the Dunes, about
101 MB let go (the bazaar 35, the workshop 30, the basement 29, the Throwing Room 4, Margarite and the circuits 1 each); in the workshop
at boot, about 50 MB. The warm-up's peak is unchanged: stage 2 (building on entry) is what lowers it.

**Order, by what each frees:** the basement (126 MB), the bazaar, Margarite and the crossing (built at boot, parked hidden), the Dunes
as Dovina's five, then the workshop's rooms. The garden, a Dunemaw floor and the Raceway park already build on entry: they are moved
onto `game.areas` as they are.

## The gate

Every push to main goes through it. A division's round is not done until its branch passes the first three on its own.

1. **It builds** (`npm run build`).
2. **`npm run check` passes**: no broken import, no orphan module, no event against the bus's rules, no new log celebration, no new
   module without a header or over budget, no retired word, no "he" or "she" for the Courier. Legacy debt is in
   `scripts/check-baseline.json`; the check fails only on new debt, and the baseline only falls.
3. **The stress test is no worse** (`npm run stress`, seeds 1 and 2).
4. **`npm run perf` is within the budgets and tolerances**, or the reason is written down and accepted.
5. **The contracts hold** (`npm run contracts`): every service one division offers another still has the names and shapes its readers
   count on (`scripts/contracts.mjs`; a branch that starts reading another's service adds its line there).
6. **Petra reads the diff**: nothing another file calls has gone missing; no other division's work is overwritten; it fits (the contract,
   the names, a shared part where one exists or should); it reads well. Then Petra drives the changed part headless.

**`npm run gate`** runs all of it in order with its own dev server (check, build, stress 1 and 2, the Well playtest, the replay test, the QAIS test, the
contracts, perf) and adds **the lanes**: the files the branch changed outside its division's lane (CLAUDE.md, "Threads"), a warning the
handover explains. It reports **the unbuilt** too (`node scripts/unbuilt.mjs`, Dovina's, R1 of the full build): every event a log rule
hears that nothing in the game emits, a feature specified and never wired. A report, never a failure; `docs/plans/BUILD.md` says which
round each belongs to, and a round is done when none of its own is listed. It writes `gate-report.txt`, the summary a handover pastes. `npm run gate -- --quick` (check, build, stress 1, the
contracts) is for between commits. perf also names what it does not gate but Petra reads: the shader programs compiled after the
warm-up (each a hitch the first time it is drawn) and the big things no zone hides.

What fails goes back to its division with the reason and the fix. Petra does not edit another division's files to make a merge pass.

### The handover (what a division does before it says "ready": it says first what it did to the others)

1. **Main merged in, and the head frozen.** Merge the latest default branch, settle every conflict yourself,
   push, and name the head SHA in the note. Do not push to the branch again until Petra has answered; a fix after review is a new head
   and a new note.
2. **The gate run by you, numbers pasted.** `npm run gate`, and paste the summary from `gate-report.txt`; for each perf line that moved,
   say why.
   perf and stress hold the calendar at a calm game noon (`?clock=`); run `CLOCK=now` too if your work changes with the hour.
3. **What you touched outside your lane**, file by file (a hub edit in main.js counts), and why.
4. **What you added that others meet**: new `game.*` services and who reads them, events and their payloads, save sections, glossary
   words, chat commands, new shader programs, anything made lazily on first need (it compiles mid-play unless the warm-up makes it).
5. **What you read from another branch not yet on main** (a contract: `game.weather`, `game.mawWipe`): name the producer and the head
   you tested against.
6. **Rules are the owner's.** A change to CLAUDE.md or to this file is named in the note with where the owner said it; Petra asks the
   owner before it lands.
7. **Brief** (for QAIS, `docs/plans/QAIS.md`): three to six lines for the owner, in the glossary's words, every unit of time with its
   clock: what changed for the player and what to try. Petra copies it into the build's brief at publish.
8. **Tests** (for QAIS): each one an area, what to do and what should happen, with `watch` (the event that is evidence), `go` (a
   `game.places` id) and `live` (try it with QAIS closed) where they fit. Dovina triages them into the round.

## Open restructuring

The old particles folded into the VFX system, Calissa's; the in-game words
the glossary retires, Espada's.
