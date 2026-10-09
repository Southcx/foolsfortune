# DEBUG and STORY: two saves, one set of rules (the owner, 2026-10-09)

Kept by Dovina (what is gated, what lending means, the presets' contents); the save, the title and the wiring are Petra's; the panel's
look Calissa's; its words Espada's.

> "Since we're building everything into Debug mode for the foreseeable future, how should we split out the tracks of 'Story' type
> progression versus testing sessions where I want everything unlocked and accessible so I can properly test all interactions as I go
> through?" ... "we want DEBUG to be a really solid high-level testing environment."

**Prior art:**
- **Minecraft's worlds:** creative and survival are properties of a *world*, not of the player, and a world with cheats on is marked
  for good. Taken: a save per mode.
- **Bethesda's QASmoke and its console:** every item and every place on demand in a test cell. Taken: the commands and the debug chests
  (DEBUG-CHESTS.md).
- **Celeste's Assist Mode and Hades' God Mode:** per-feature switches, each on its own, honest about what they change. Taken: lending by
  category, not one switch.
- **Save states in emulators and the "chapter select" of every dev build:** jump to a moment without playing up to it. Taken: presets.
- **OSRS's retroactive achievements** (already our law): progress is a predicate over the ledger, so writing a ledger *is* writing
  progress. This is what makes presets cheap here.

## 1. What is true today (measured, 2026-10-09)

- **STORY is off the title** (`title/ui.js:76-77`); only DEBUG can be chosen. `game.mode` is not saved: it is set when the title is
  chosen and is undefined before that.
- **One save per browser** (`core/save.js`: `foolsfortune.save.player`, `.world`, `.settings`). DEBUG play and any future STORY play
  would write the same records.
- **The all-arts switch** (`system.lendAll`) is the only lend there is, and it lends only the Movement Arts and God Arts
  (`system.has`). It **defaults to on** for an empty or old save (`system.js:150`), and the Codex switch flips it in any mode.
- **Everything else is gated with no bypass:** the knacks, the moveset's unlocks (launcher, air string, dash, special), reprogramming's
  Functions, the Shrines found, the Spirit Garden's Firings (planetoids, features, Myggdrasil, the Heavenly Kiln), the Entropolis node,
  the galleon's and tanker's rutters, the kiln glazes, the God Arts' Zone of Influence tier.
- **Siblings** are all met in DEBUG (`party.may`); `/grant` and `/psygun` refuse outside DEBUG; the Weir's treasury refills in 30 s
  in DEBUG.
- **Ungated commands:** `/goto`, `/garden`, `/cavern`, `/opening`, `/spore bed`, `/tree dawn`, `/art`, `/crossing`, `/figure` work in any
  mode. **Debug chests** stand in any mode.
- **Found on the way (Petra's):** `vessel.bought` is read (`vessel.js:58`) but never written, so the shop glazes (amethyst, cobalt,
  majolica, salt) can't be bought.

## 2. The rule: a save per mode

- **The STORY save and the DEBUG save** are two separate records. Each has its own `player` and `world` scopes under its own key
  (`foolsfortune.story.save.*`, `foolsfortune.debug.save.*`). **Settings are shared** (one `foolsfortune.save.settings`).
- The title's choice picks the save **before** anything loads: `save.boot(BUILD, mode)`. `game.mode` is kept in the save's header, so a
  reload knows which save it is in.
- **Both reset on a new build** (CLAUDE.md). Presets (section 5) make that cheap for DEBUG. The lend panel's state is a **setting**
  (scope `settings`, under `debug.lend`), so your switches survive a build.
- **Nothing crosses.** A DEBUG achievement, count or item never reaches the STORY save. The Codex says which save you are in at the top
  of its records page ("DEBUG save" / "STORY save").
- **STORY comes back to the title,** last on the menu, as "STORY (coming later)" (Espada's words). In it nothing is lent, no command that grants or
  travels works, and no debug chest stands. Today it plays as the slice with story rules: the honest check that the slice can be
  played up to without help.

## 3. What DEBUG is

DEBUG is the STORY game with three things added. Nothing else differs:
1. **the lend panel** (section 4): what is unlocked without being earned;
2. **the commands and the debug chests** (all of section 1's, now refused outside DEBUG);
3. **presets** (section 5): jump to a moment.

**The ledger counts in DEBUG** as in STORY: achievements unlock, knacks open, firsts are logged. You need this to test the tracking
itself ("does drinking Gall open Acquired Taste?"). What stays uncounted is what was given:
- a lend never writes the ledger;
- a debug chest's gift is not counted (DEBUG-CHESTS.md 3);
- a preset's own writes are marked (section 5).

## 4. The lend panel

The all-arts switch becomes **the lend panel**: one switch per category, in the Codex and in QAIS. A lent category answers "yes" at every
gate in it, without the ledger. Switch a category off and it plays by STORY's rules inside the DEBUG save: **that is how an unlock path is
tested** (switch Feelings off, go and drink Gall, watch the slot open).

| category | `lend` id | what lending it opens (the gates, from the survey) |
|---|---|---|
| Movement Arts | `arts` | every art and variant (`system.has`: today's all-arts switch) |
| God Arts | `godArts` | God Arts 2 to 5, and the Zone of Influence tier they need (`arts.js` `owns`, `cartography.tierAt`) |
| Knacks | `knacks` | every knack opened (each still switched on or off by `/knack`: lending opens, it never forces one on) |
| Tool moves | `moves` | every moveset unlock (`moveset.js` `open`: launcher, air string, dash attack, pause branches, special) and the Crucibelle's fever peak |
| Functions | `functions` | every reprogramming Function known, and every neuralese word glossed (`functions.js` `known`, `ostraca.js`) |
| Shrines | `shrines` | every Shrine found for fast travel (`shrines.js` `found`) |
| Garden | `garden` | the Spirit Garden at its highest Firing for every gate that reads it (planetoids, features, Myggdrasil, the next Heavenly Kiln); never the attributes' ranks themselves |
| Sea | `sea` | the Entropolis node open; any ship sails without a rutter |
| Siblings | `siblings` | all five met (today's `party.may` in DEBUG) |
| Feelings | `feelings` | Gall and Fury known (the radial's slots open) |
| Glazes | `glazes` | every kiln look firable (`vessel.has`) |
| Codex | `codex` | every hidden achievement, bestiary row, curio, strain and song shown (the ??? lifted) |
| Figment Telegraphs | `figmentTelegraphs` | every step of Divination's Figment attack telegraph ladder (FIGMENT-TELEGRAPHS.md) |

**Defaults:** a new DEBUG save starts with **every category lent** (today's sandbox, and more). A STORY save has no panel.

**One way to ask:** `game.lend.has(id)`, from `src/progress/lend.js` (Dovina's: the table above as data, a settings section, `has`,
`set`, `all`). Each gate adds one clause: `|| game.lend?.has('<id>')`. `system.lendAll` becomes `lend.has('arts')`; the Codex's ALL ARTS
switch becomes the panel. `lend.has` is always false outside DEBUG, whatever the setting says.

**Marks:** a lent thing is never shown as earned. The Codex shows a lent art or knack with a hollow mark ("lent"), an earned one solid,
so you can see at a glance what you actually did.

## 5. Presets

A **preset** is a moment of play written as data: the ledger counts, the kit, the cubes, the lends, and where you stand. Choosing one
(on the title under DEBUG, in QAIS, or `/preset <id>`) wipes the DEBUG save's `player` and `world`, writes the preset, and drops you at its
place. Because achievements, knacks, moves, Firings and Functions are all predicates over the ledger, **writing the counts is the whole
of it**: no flag per system, and a preset written today stays right as systems are added (OSRS's retroactivity, again).

```js
PRESETS.dunemawBowl = {
  label: 'Before the Great Slip Jelly', for: 'the fight in the great bowl',
  at: 'well.bowl',                               // a place id
  ledger: { 'well.floor.3': 1, 'cut.hit': 500, 'kick.hit': 30 },  // counts: what this moment has done
  kit: [['psygun', 1], ['sondelass', 1], ['bottle.mid', 1]], cubes: 3000,
  lend: { arts: true, moves: false },            // the lends it sets (the rest keep your panel's)
};
```

- **A preset's writes are marked** (`first('debug.preset.<id>')`), and the Codex says "Preset: {label}" beside its records.
- **They live in `src/debug/presets.js`** (data, Dovina's), each naming what it is for, like a debug chest's kit. A QAIS test may name a
  preset (`preset: 'gardenFiring2'`); its "take me there" applies it.
- **The first five:**

| preset | where | what it is for |
|---|---|---|
| `fresh` | the workshop | nothing done, nothing lent: STORY's rules in the DEBUG save, for testing an unlock path from the start |
| `everything` | the workshop | every category lent, the whole kit, 10,000 cubes: today's DEBUG |
| `gardenFiring2` | the Dantian | the second Firing reached by ranks (Myggdrasil given), garden materials: the garden mid-game |
| `dunemawBowl` | the great bowl | three floors cleared, the cutlass and kick unlocks earned: the fight |
| `entropolisOpen` | the shore's jetty | the reckoning past 0.6, a rutter, a galleon's fuel: the long crossing |

Presets wait on the save split (section 2). Until then, the debug chests carry the items, and the lend panel the unlocks.

## 6. Who builds what, in order

1. **Petra:** the save per mode (`save.boot(BUILD, mode)`, the keys, the mode in the header); STORY back on the title; every command
   and debug chest refused outside DEBUG; the `lendAll` default fixed (off unless DEBUG). Also the shop glazes' `vessel.bought`.
2. **Dovina:** `src/progress/lend.js` (the table, the section, `has`); the glossary's entries. Done with this spec: the table in 4.
3. **Petra and each owner:** one `|| game.lend?.has(id)` clause at each gate in section 4's table (the survey lists every file and line;
   I'll hand each owner its lines).
4. **Calissa:** the lend panel in the Codex and QAIS (a switch a row, the hollow "lent" mark). **Espada:** its words.
5. **Dovina, then Petra:** `src/debug/presets.js` and its loader, the first five presets, the QAIS test's `preset` field.

## 7. Open

- Should STORY count toward anything shared later (a hiscore, co-op)? Not until there is a story; today it is only kept apart.
- A preset per QAIS round (the build's own "where to start")? Worth it once presets exist; the Brief could name one.

## Appendix: the gates, by category (surveyed 2026-10-09; one `|| game.lend?.has(id)` clause each)

| `lend` id | where the clause goes |
|---|---|
| `arts` | `progress/system.js:34` `has()` (replaces `lendAll`); `feedback/tracking.js:724` and `audio/voice/voice.js:117` read `lend.has('arts')` |
| `godArts` | `godhand/arts.js:83` `owns()`; the Zone of Influence tier at `arts.js:169,215`, `godhand.js:590` |
| `knacks` | `progress/knacks.js:41` `open()` (`on()` and `set()` follow it) |
| `moves` | `tools/moveset.js:84` `open()`; `tools/crucibelle/crucibelle.js:163` (fever peak) |
| `functions` | `tools/veritome/functions.js:79` `known()`; `progress/ostraca.js:230-238` (glossed) |
| `shrines` | `world/shrines.js:111-113,137` (`found`) |
| `garden` | `world/garden/orbit.js:62-63`, `world/garden/hand.js:226-228`, `world/garden/mycelium.js:83-84`, `world/garden/tribulation.js:39`, `world/garden/realm.js:429` (each reads the Firing: lent, the highest) |
| `sea` | `progress/econ/emocean.js:50`, `progress/voyage.js:95-104,206` (Entropolis); `progress/rail/ships.js:32`, `world/emocean/pier.js:79` (the rutter) |
| `siblings` | `coop/party.js:65` `may()`, `world/shrines.js:141` (replace `game.mode === 'debug'`) |
| `feelings` | the radial's locked slot (not built: it reads `feeling.known.<id>` or the lend) |
| `glazes` | `courier/vessel/vessel.js:53-60` `has()` |
| `codex` | `feedback/codex/ledger.js:116,225,246,273`, `feedback/codex/grimoire.js:43,60,67`, `tools/veritome/ui.js:86,101,163-175`, `tools/veritome/book.js:49`, `feedback/codex/codexpage.js:60` |

**DEBUG only (refused in STORY):** `/goto`, `/garden`, `/cavern`, `/opening`, `/spore bed`, `/tree dawn`, `/art` (`main.js:759-803`),
`/crossing`, `/figure` (`world/emocean/stage.js:173-174`), `/grant`, `/psygun` (already), the debug chests (`debug/debugchest.js`), the
Weir treasury's 30 s refill (`weir.js:133`, already).
