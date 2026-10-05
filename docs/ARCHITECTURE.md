# Architecture

How the game's code is laid out, the rules every module keeps, and how a change gets onto main. Petra owns this file and enforces it at
the gate; any division may propose a change to it (a question to Petra, or a note in `docs/HANDOFFS.md`). The words are in
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
  core/          services every module may use, and nothing of the game itself                         (Petra)
  courier/       the Courier: body, animation, moves (techs), vessel, the pool, the skiff               (Petra)
  tools/         the belt, the held-tool base, and one folder per tool                                  (Petra; shared parts)
  world/         places and the things in them: workshop, basement, dunes, props, treasure, ground marks (Petra)
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
  debug/         the diagnostics overlay and the tuning panel                                           (Petra)
  agent/         the game as an AI player sees and drives it (observe, act: docs/plans/COOP.md)         (Petra)
  assets/        models, textures, fonts, clips                                                         (Calissa)
scripts/         Node scripts: the gate's checks, the stress test, the playtests, bakes and exports (was tools/)
docs/            the bibles: GLOSSARY, ARCHITECTURE, DESIGN, LORE, LOOK, VFX, AI, ECONOMY, OST, HANDOFFS
```

## Imports

- `core/` imports nothing from the rest of `src/` (three.js and Rapier only).
- A data module (a table) imports no module that touches three.js.
- Nothing imports a tracking rule: `feedback/` listens to the bus; it is never called.
- Across domains, prefer the service on `game` to an import. An import of another domain's module is fine for its **exported
  interface** (a class to construct in `main.js`, a pure helper, a table); never to reach its private state.
- No import cycles between domains. (`npm run check` will report them once it learns cycles; until then, the review does.)

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
- **`tracking.js`** holds the log's rules. (Phase 2 splits it into one rules file per domain under `feedback/tracking/`, so a division
  adds a rule in its own domain's file.)
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
| draw calls a frame (every pass) | 450 | +8% |
| triangles a frame | 350,000 | +8% |
| shader programs alive | 120 | +6% |
| JS heap | 320 MB | +12% |
| tick and draw time (software renderer, relative) | none | +25% |
| a module | 800 lines | the baseline only falls |

At v45: workshop 354 calls and 172k triangles, dunes 284 calls and 282k triangles, 95 to 98 programs, 235 MB.

## The gate

Every push to main goes through it. A division's round is not done until its branch passes the first three on its own.

1. **It builds** (`npm run build`).
2. **`npm run check` passes**: no broken import, no orphan module, no event against the bus's rules, no new log celebration, no new
   module without a header or over budget, no retired word, no "he" or "she" for the Courier. Legacy debt is in
   `scripts/check-baseline.json`; the check fails only on new debt, and the baseline only falls.
3. **The stress test is no worse** (`npm run stress`, seeds 1 and 2).
4. **`npm run perf` is within the budgets and tolerances**, or the reason is written down and accepted.
5. **Petra reads the diff**: nothing another file calls has gone missing; no other division's work is overwritten; it fits (the contract,
   the names, a shared part where one exists or should); it reads well. Then Petra drives the changed part headless.

What fails goes back to its division with the reason and the fix. Petra does not edit another division's files to make a merge pass.

### The handover (R44: what a division does before it says "ready")

What cost the R43 review the most time was finding out, after the fact, what a branch had done to the others. A handover says it first:

1. **Main merged in, and the head frozen.** Merge the latest default branch, settle every conflict yourself (HANDOFFS.md included),
   push, and name the head SHA in the note. Do not push to the branch again until Petra has answered; a fix after review is a new head
   and a new note.
2. **The gate run by you, numbers pasted.** `npm run check`, `npm run build`, `npm run stress` (seeds 1 and 2), `npm run playtest --
   well`, `npm run replaytest`, and `npm run perf` against main's baseline: paste the perf lines that moved and say why each moved.
   perf and stress hold the calendar at a calm game noon (`?clock=`); run `CLOCK=now` too if your work changes with the hour.
3. **What you touched outside your lane**, file by file (a hub edit in main.js counts), and why.
4. **What you added that others meet**: new `game.*` services and who reads them, events and their payloads, save sections, glossary
   words, chat commands, new shader programs, anything made lazily on first need (it compiles mid-play unless the warm-up makes it).
5. **What you read from another branch not yet on main** (a contract: `game.weather`, `game.mawWipe`): name the producer and the head
   you tested against.
6. **Rules are the owner's.** A change to CLAUDE.md or to this file is named in the note with where the owner said it; Petra asks the
   owner before it lands.

## The migration

**Phase 0 (R42, done):** this file, the glossary, `npm run check` with its baseline, `npm run perf` with its baseline.

**Phase 1 (R42, the quiet round, done):** every division pushed what it had and stopped; Petra merged everything and made the move
below (201 files, 625 imports and 715 path mentions rewritten by script; the build, the check, the stress test, perf and a headless drive
before it landed), rewrote the README as a manual, and published. The renames that rode with it:

- the god hand's jar: `vessel` → `jar` in `godmode.js`, events `vessel.hit` / `vessel.shatter` / `vessel.reforge` → `jar.*`, their ledger
  keys and the log's lines
- the skiff: `surfer` → `skiff` (the tech's id, `T.tech.surfer`, events `surf.*`, their ledger keys, the log's class and the
  achievements' category); the tech's class `Surfer` → `Skiffing` (the boat is `Skiff`)
- the all-arts switch: `system.lab` / `setLab` → `lendAll` / `setLendAll` (not `allArts`: `ALL_ARTS` is the list of arts); the map's
  layer "THE LAB" → "THE BASEMENT"; the workbench's command `/lab` → `/workbench`; "pause card" → the pause menu
- `marks.js` → `groundmarks.js`, `cracks.js` → `potcracks.js`, `timescale.js` → `time.js`, `godmode.js` → `godhand.js`,
  `godarts.js` → `arts.js`, `fx.js` → `vfx/particles.js`
- `tools/` (Node) → `scripts/`; `npm run stress`, `check`, `perf` keep their names

**Phase 2 (each in its own lane, the rounds after):** `tracking.js` split by domain and `main.js` split into boot stages (Petra); the
course and the room teleports split into `world/basement/course.js` and `world/rooms.js` (Petra); the old particles folded into the VFX
system so there is one (Calissa); the in-game words the glossary retires (Espada). Done: `audio.js` split into `audio/` (Wanda, R37); the
undotted events renamed, each for the ledger key it feeds (Petra with Dovina; the rule is under **event** in `docs/GLOSSARY.md`, the rules that hear them in `tracking.js`).

## The move map (Phase 1, a record: old paths on the left)

| from | to |
| --- | --- |
| `config.js`, `events.js`, `input.js`, `physics.js`, `mood.js`, `tags.js`, `signatures.js`, `progress.js`, `restart.js`, `shotclear.js`, `combat.js` | `core/` |
| `timescale.js` | `core/time.js` |
| `player.js`, `character.js`, `interact.js`, `lockon.js`, `parry.js`, `emotes.js`, `lachryma.js` | `courier/` |
| `animator.js`, `anims.js`, `authored.js`, `authoring.js`, `rom.js`, `romdata.js`, `anim/stances.js` | `courier/anim/` |
| `moves/*` (the techs, without the tools' and the skiff's) | `courier/moves/` |
| `moves/surfer.js`, `skiff.js`, `surfclips.js` | `courier/skiff/skiff.js`, `boat.js`, `clips.js` |
| `vessel/` | `courier/vessel/` |
| `tools/*` | `tools/` (unchanged) |
| `combat/melee.js`, `slicing.js` | `tools/melee.js`, `tools/slicing.js` |
| `weapon.js`, `shells.js`, `casters.js`, `specials.js`, `psygun/kinds.js` | `tools/psygun/` |
| `sondelass/`, `moves/sondelass.js`, `moves/grapple.js`, `angling/` | `tools/sondelass/` (angling as `tools/sondelass/angling/`) |
| `brush/`, `moves/soulbrush.js` | `tools/soulbrush/` |
| `veritome/`, `moves/veritome.js`, `mind/` | `tools/veritome/` (`mind/` as `tools/veritome/mind/`) |
| `dreamvane/`, `moves/dreamvane.js` | `tools/dreamvane/` |
| `crucibelle/`, `moves/crucibelle.js` | `tools/crucibelle/` |
| `lockheart/`, `moves/lockheart.js` | `tools/lockheart/` |
| `level.js`, `trial.js` | `world/` |
| `basement.js`, `techlab.js`, `riglab.js`, `mill.js`, `circuits.js`, `circuitrooms.js`, `siege.js`, `raids.js` | `world/basement/` (`techlab.js` → `techwing.js`, `riglab.js` → `rigwing.js`) |
| `dunes.js`, `barrier.js`, `lachryma/crystals.js`, `lachryma/tuning.js` | `world/dunes/` (`tuning.js` → `crystaltuning.js`) |
| `breakables.js`, `pottery.js`, `cracks.js`, `movers.js`, `poles.js` | `world/props/` (`cracks.js` → `potcracks.js`) |
| `trailmap.js`, `marks.js`, `wake.js` | `world/ground/` (`marks.js` → `groundmarks.js`) |
| `chests.js`, `chestmodel.js`, `ceremony.js`, `treasure.js`, `curiomodel.js`, `cubes.js` | `world/treasure/` |
| `creatures.js`, `stun.js`, `clappers.js`, `lobber.js`, `spirits.js`, `jelly/`, `ai/` | `creatures/` |
| `achievements.js`, `stats.js`, `system/system.js`, `system/skills.js`, `econ/`, `shop/` | `progress/` |
| `gamelog.js`, `tracking.js`, `chat.js`, `hud.js`, `hideui.js`, `cartography.js`, `indexmenu.js`, `help/` | `feedback/` |
| `system/codex.js`, `system/ledgerui.js` | `feedback/codex/codex.js`, `feedback/codex/ledger.js` |
| `godmode.js`, `godarts.js` | `godhand/godhand.js`, `godhand/arts.js` |
| `outline.js` | `render/` |
| `fx.js`, `sky.js` | `vfx/particles.js`, `vfx/sky.js` |
| `audio.js`, `system/voice.js`, `system/speech/` | `audio/sfx.js`, `audio/voice/voice.js`, `audio/voice/speech/` |
| `tuning.js`, `debug/diag.js` | `debug/` |
| `npc/`, `render/`, `vfx/`, `ui/`, `music/`, `cine/`, `title/`, `workbench/`, `assets/` | unchanged |
| `tools/` (the Node scripts) | `scripts/` |
