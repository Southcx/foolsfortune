# SOLID: what Petra would change from scratch, and the refactor to get there (2026-11-01)

**Asked:** South, 2026-11-01: "if you were to build this project from scratch, what would you change, and then refactor the codebase
to employ those SOLID principles."

**The answer in one line.** Keep the parts that hold (the event bus, data over code, the ledger, the rules / runtime / look split
between divisions, the module contract). Change the one thing they all lean on: **`game`, a bag of 438 services every module reaches
into**. From scratch, each module would get only the services it uses, the frame would run systems that register themselves, and
callers would ask a thing what it can do instead of checking what it is.

## 1. Measured (main at a55338d, 1821 modules, 265 486 lines)

| measure | count | what it says | principle |
|---|---|---|---|
| distinct `game.X` read anywhere | 438 | one object holds every service: a service locator | D, I |
| services hung on it with `new` | 317 | built in 20 boot files, in an order nothing checks | D |
| modules reading `game` | 830 of 1821 | almost half depend on all 438, to use a few | I |
| `game.x?.` optional chains | 5600 (and 4052 plain) | a module cannot know whether a service exists yet | D, L |
| `update(` / `tick(` calls in the frame's tick (`boot/frame.js`) | 225 (240 before slice 1) | every new system edits the frame: about 200 hand-ordered lines, several on one line | S, O |
| a tool named by id outside its own folder (`=== 'psygun'`) | 140 | callers branch on which tool, so an eighth tool edits 140 places | O, L |
| a creature's kind switched on outside `creatures/` | 25 | the same, against the house's own rule (ask `hasTag`) | O |
| modules near the 800-line budget (over 700) | 14 | the contract holds, just | S |

What already holds, and stays:
- **The event bus** (`domain.verb`, tracking rules that listen and are never called).
- **Data over code**: tables, looks and odds as data a Node script reads.
- **The rules / runtime / look split**: Dovina's rules, Petra's runtime, Calissa's look, Wanda's sound, all meeting on events.
- **One way to do a thing**, and the gate's ratchet: `npm run check` fails on new debt only.

## 2. What I would change from scratch

1. **Dependencies declared, not reached for (D, I).** A service is defined with what it needs, `define('creatures', { needs:
   ['events', 'physics', 'tags'], make })`, and the container builds them in the order the needs give. A module is handed those
   services, not `game`. Boot order is computed, so a service that must exist always exists, and `?.` is left for what is truly
   optional.
2. **A Null Object for what is built late (L).** A room built on entry (the open sea, the garden) stands as a quiet stand-in until it
   is built. It has the same interface and does nothing, so a caller never asks "is it there?". This removes most of the 5600 `?.`.
3. **A scheduler in phases (S, O).** The frame runs named phases (input, sim, minds, world, camera, anim, props, looks, late). A system
   joins a phase where it is built and leaves it when it is taken down. The frame holds the phases' order and nothing else.
4. **A mode stack (S, O).** Today the frame reads `godOn`, `aboard`, `worldAsleep`, `modalOpen()` and `overlayUp()` in its own ifs.
   From scratch, a mode (the god hand, a crossing, the garden, a duel, a window) is pushed on a stack, and it says which phases run
   under it and who owns the camera and the keys (the input claim, `input.claim`, is already this, for the keys).
5. **Capabilities, not identity (O, L, I).**
   - **Tools:** every tool implements the parts of one interface it has: `aim`, `lend`, `fighterKit`, `duelMoves`, `mount`, `skin`,
     `parryAnswer`. A caller asks `belt.main.can('lend')`, never `main === 'veritome'`.
   - **Creatures:** a creature says what it is through tags and its own handlers (`hasTag(c, 'lends')`, `c.lendVerb`); Borrow a Verb
     already works this way.
6. **A feature is one manifest (O, S).** A feature's folder exports `install(container)`, which hands back its systems, tracking rules,
   save sections, chat commands and debug chest. Boot reads the manifests instead of each feature being wired by hand across five boot
   files.

## 3. The refactor, in slices

Each slice is one push: it changes no behaviour (the stress test and the room's sweep before and after), it lowers a ratchet in
`npm run check`, and the ratchet then stops new debt of that kind for every division.

| slice | what | ratchet | owner |
|---|---|---|---|
| **1 (built, v385)** | `core/systems.js`; the frame's `looks` phase; 15 dressers (the open sea's, the garden's, the Jar's plate) moved to registration where they are built | `solid.frame-update` 225, `solid.tool-switch` 140, `solid.kind-switch` 25 (adopted) | Petra |
| **2a (built)** | the `marks` phase: the world's dressers (the Dunes, the Raceway's ten looks, the jelly mount, the World shells) and each tool's marks (the hook's, the Lockheart's reach, the throw, the lob, the flare), the bracelet and the Pneuka Jar's look: 20 systems registered where built | `solid.frame-update` 225 → 205 | Petra |
| **2b (built)** | the compass and its two tools' marks as one system, the lens's frame, the toll's reach and a chest's opening: built once at the warm-up (no `||=` construction in the frame), registered in `marks`; the frame imports five fewer modules | `solid.frame-update` 205 → 199 | Petra |
| 2c | the scheduler learns order constraints (`after: 'name'`, Bevy's `.after()`), then the frame's long line of rooms and progress services (the Well, its targets and look; the Raceway and the race; the pier and its mooring; the quests, the splash and the recap; about 45) moves into a `world` phase with their order declared by each, not by the line | `solid.frame-update` | Petra |
| 2 | the frame's remaining updates into phases (input, sim, minds, world, camera, anim, props, late), order kept phase by phase, one phase a push | `solid.frame-update` toward 0 | Petra |
| 3 | the mode stack: `godOn`, `aboard`, `worldAsleep` and the modal checks become modes that gate phases | the frame's own ifs | Petra |
| 4 | the container: the core services (events, physics, save, log, creatures, vfx, input, camera) declared with their needs; Null Objects for rooms built late; `?.` removed on what is guaranteed | a new `solid.optional-service` on the guaranteed services | Petra (core), then each division in its files |
| 5 | tool capabilities: the interface on `tools/heldtool.js`; the belt and the 140 sites ask it | `solid.tool-switch` | Petra (tools/, boot), Calissa (vfx/ and ui/ sites), Dovina (progress/ sites) |
| 6 | creature kinds to tags: the 25 sites | `solid.kind-switch` | each file's owner |
| 7 | feature manifests, one feature at a time, starting with the newest (Strawman's Well, the open sea) | the boot files' line count | Petra, with each feature's divisions |

**Rules from today, for every division:** a new per-frame thing joins a phase (`game.systems.add`) where it is built and never adds
a line to `boot/frame.js`. A new branch on a tool's id or a creature's kind fails the check. Ask the tool or the tags instead.

## 4. What this costs and what it is worth

Nothing a player sees changes. Each slice is measured with `npm run perf` and must cost nothing in the frame. A system called through
the scheduler is one closure call more than a direct call, about 0.1 µs; at 241 systems that is under 0.03 ms a frame. What it is
worth: a new feature lands by adding files, not by editing the frame, the boot files and 140 switches; and the five divisions stop
colliding in the same three hub files.
