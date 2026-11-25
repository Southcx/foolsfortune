# Fool's Fortune: the port handbook

Read this file first. It is the one thing an agent needs loaded to port this game to **Godot 4.7.2 with C# (.NET 10)**. Everything else
under `PORT/` is loaded only when a task needs it. Sizes are given so you can budget context.

| file | what it is | load it |
| --- | --- | --- |
| `PORT/README.md` (this) | the world, the architecture, every system in one paragraph, the Godot mapping, the port order | always |
| `PORT/briefs/01-courier.md` | the Courier's character controller: capsule, gaits, slide, jumps, wallrun, mantle, dash, techs, camera, animation | porting the Courier |
| `PORT/briefs/02-solar-skiff.md` | the Solar Skiff: sailing, carve, hop, grind, glide, combo, bail, surf and slope | porting the skiff |
| `PORT/briefs/03-godhand.md` | the god hand, its Pneuka Jar, the island's matter, god arts and powers, miracles, creations, rejection | porting the god hand |
| `PORT/briefs/04-spirit-garden.md` | the Spirit Garden: planetoids, the Jar's hop, the hand's strokes, clay, water, plants, plots, the press, seeds | porting the garden |
| `PORT/briefs/05-systems.md` | a short brief for every other system: tools, combat, creatures, duels, Raceway, Emocean, Wells, mechs, casino ... | porting one of those |
| `PORT/FILEMAP.md` (250 KB) | one line a source module (2,159), from its header, by folder | **grep it**, never load it whole |
| `PORT/EVENTS.md` (63 KB) | every event name on the bus (1,190), who emits it, who hears it | grep it |
| `PORT/data/` (1.8 MB JSON) | every data table exported as JSON (211 modules; 928 achievements); `data/INDEX.json` lists them | load the table you need |
| `docs/GLOSSARY.md` (400 KB) | the game's dictionary: one word, one meaning, with its code id and file | grep a term |
| `docs/LORE.md`, `docs/DESIGN.md` | the fiction and the design laws | when a name or a "why" matters |
| `docs/plans/*.md` | the design spec of each system as it was planned (some ahead of the build) | the system's own plan, when the brief is not enough |

The JavaScript under `src/` is the **reference implementation**. It still builds and runs (`npm install`, `npm run dev`, open the page;
`?seed=N` fixes chance). When a brief and the code disagree, the code is right. Every module opens with a header comment: what it is,
the prior art it took from, and its interface in one block. Read the header before the body.

---

## 1. The game in one page

**Fool's Fortune** is a third-person action-exploration game with a god-game mode, set inside a psyche. Desktop, mouse and keyboard.

- **The Courier** (the player character; androgynous, always "you" in game text, "they" in docs) is a clay vessel animated by a soul.
  The core movement (walk, sprint, slide, jump, double jump, wallrun, mantle, air dash, plus swim, ladders, poles and so on) is the
  game's gold standard: nothing changes it; every mode lays modifiers over it and takes them off.
- **Lachryma** is the substance of feeling: liquid or solid (a **cube** is the only currency). The Courier's **pool** of it pays for
  shots, dashes and arts and is their shield. It carries one of **seven feelings**: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread.
- **Anagami Island** is the one island built: a pottery **workshop** (the kiln, the folk), a **basement** (the hub with the **Index**,
  a console that sends you to every test room), and **the Dunes** (a sand sea: the oasis, the Weir, the Gnomon, ruins, crystals).
  **The Emocean** is the sea of Lachryma between islands, crossed as a rail shooter or sailed freely at **the open sea**.
- **Seven tools** on a belt (two worn, a main and a sub): the psygun, the Sondelass (cutlass, rod, grappling hook), the Soul Brush
  (paint, mop, Celestial mode), the Veritome (a book that is a camera), the Dreamvane (dowsing, a pick, a net), the Crucibelle (a bell
  played as an instrument), the Lockheart (a coffin on a chain).
- **The Solar Skiff**: a sand boat sailed in the Dunes and raced at **the Raceway** (a park of tracks with tricks, rails and a wave pool).
- **The god hand** (the ~ key): the Courier becomes the immobile **Pneuka Jar** and the player becomes a disembodied hand over an
  isometric view: a physics god game over the same rooms (throw things, sculpt the ground, call weather).
- **The Spirit Garden**: a small galaxy of planetoids inside your Pneuka Jar, entered at a Shrine. You are the Jar hopping round them
  (Super Mario Galaxy's gravity) and the hand over them at once: sculpt clay, lead water, plant, place features, raise spirits.
- Around these: creatures with utility-AI minds, **puzzle duels** (a match-three versus battle against an aberrant creature), a Well
  dungeon with a boss (**the Great Dunemaw**), mechs, a casino of tarot and dice games, a 2D test Well (Strawman's Well), cooking,
  achievements over a ledger, a lot of looks and sound. See section 5 for the full list.

Design laws that shaped every system (DESIGN.md 22): skill skips grind, grind closes the gap; arts are opened only by achievement; every
system teaches something real without saying so; **base change bad, modifiers good** (a mode never changes a base rule; it lays a
modifier with a visible source). The log is the only narration; world marks carry no words.

## 2. The architecture as it is

- **Stack:** three.js 0.170 (rendering), Rapier 0.21 (physics; a kinematic character controller), Vite (build). No framework. ES modules.
- **One composition root:** `src/main.js` runs boot stages in order (`src/boot/*.js`), each building onto one object, `game`:
  Save, Renderer, Services, World, Courier, Tools, Pneuka, GodHand, Rooms, Tuning, Course, Presentation, Creatures, Chat, Coop,
  Progress, ChatCommands, MechFeel, SaveKeeping, Debug, MoreChatCommands, Title, Warmup, Frame. Every system is a field of `game`
  (`game.player`, `game.belt`, `game.god`, `game.realm`, `game.creatures`, ...). Systems find one another through `game`, never by import of
  a singleton.
- **Folders** (lines of JS): `vfx` 119k (looks: effects, shaders, models drawn in code), `world` 44k (places and rooms), `progress` 28k
  (rules and data: pure, no three.js), `tools` 23k, `courier` 20k, `ui` 19k, `audio` 12k, `feedback` 8k (log, tracking, Codex, map),
  `music` 5.7k (scores as data, an arranger), `creatures` 5.6k, `godhand` 4.2k, `core` 3.3k, `render` 3.2k, `boot` 2.7k, `npc` 1.9k,
  `pneuka` 1.6k (inventory), `coop` 1.6k, `debug`, `workbench`, `agent`.
- **The import rule:** `progress/` (and `core/config.js`) import nothing from three.js or the DOM. That is why `PORT/data/` could be
  exported by plain Node. Port those first as C# data and pure functions; they are the rules.

### 2.1 The frame (`src/boot/frame.js`)

One `requestAnimationFrame` loop. A **fixed step of 1/60 s** with an accumulator (at most 4 steps a frame) and `game.alpha` for
interpolation. In order each frame:

1. Input sampled. Time scale applied (`game.time`: slow-motion and hit-stop; `game.rawDt` is real seconds). A modal window pauses play.
2. Mode: if the god hand controls (`god.controlling`) its update runs; else, unless the Courier is aboard something (the rail, the
   garden, a duel, the open sea, the track editor), the Courier's look, the belt and tool, and the body's update.
3. **The fixed loop**, per step: `movers.pre` (moving platforms) → `player.fixedUpdate` → `guard` (the rescue net) → `realm.fixed` →
   `party.fixed` → `physics.step` → `movers.post`.
4. **The phases** (`game.systems`, `core/systems.js`): `sim`, `minds`, `looks`, `world`, `fx`, `marks`, each a list of systems
   registered where they are built, ordered by `after:` names, each with a clock (dt or raw) and a `when` guard.
5. Camera, then `character.animate(dt, poseContext)` (the Courier's pose), effects, render zones, areas, the light budget, present.
6. `save.flush()`: every dirty save section written, once a frame.

### 2.2 The core services (`src/core/`)

| service | file | what it does | in Godot |
| --- | --- | --- | --- |
| events | `events.js` | `game.events.emit('domain.verb', payload)`; `on(name, fn)`, `'*'` wildcard; the bus adds `name` and `t`; last 300 kept | an autoload `EventBus` with a C# `event Action<string, Dictionary>` or typed signals per domain; keep the string names (EVENTS.md) |
| save | `save.js` | about 70 **sections**, each `{ scope: player|world|settings, version, dump, load, reset, migrate, check }`; a scope written whole; two shelves (DEBUG, STORY) | an autoload `SaveService`; each system registers an `ISaveSection`; JSON to `user://` |
| systems | `systems.js` | the phases above | `_PhysicsProcess` for the fixed loop, `_Process` for phases; or one autoload scheduler that calls registered `ISystem`s in phase order |
| input | `input.js`, `bindings.js`, `actions.js` | `isDown`, `wasPressed`, `axis`, `claim(owner, codes)` (a mode takes keys for itself); input actions with keys and pad buttons | the InputMap; a small `InputClaims` layer for `claim` |
| physics | `physics.js` | Rapier world, collision groups `GROUPS`, `register`/`entityOf` (collider to entity) | Godot physics (Jolt is the default in 4.4+); layers and masks for `GROUPS`; node metadata for `entityOf` |
| time | `time.js` | `slow(k, s)`, `pulse(frames)` hit-stop; the lowest scale wins | `Engine.TimeScale` plus a hit-stop stack |
| rng | `rng.js` | mulberry32, `stream(name)` one stream a module, `reseed(seed)` | a C# port of mulberry32 (same numbers, so seeded runs match) |
| calendar | `calendar.js` | one **game day** is one real hour; a **game hour** 150 real s; `today()` | an autoload clock |
| tags | `tags.js` | what a tool may do to a thing: `hasTag(thing, 'sliceable')` | Godot groups, or a `Tags` component |
| signatures | `signatures.js` | where Lachryma is and how strong (tools that sense it ask) | a spatial registry autoload |
| config | `config.js` → `PORT/data/core/config.json` | **all tuning**: `DEFAULTS.movement`, `camera`, `lachryma`, `god`, `tech.*` (one block a technique) ... `T` is the live copy | load the JSON into a `Tuning` resource at boot |

### 2.3 Feedback, records and the rule of events

- **The log** (`feedback/gamelog.js`) is the only narration. A feature emits an event and a rule in `feedback/tracking*.js` turns it
  into a log line and ledger counts. Outcome events carry `by`: `courier`, `clapperjar`, `creature` or `environment`.
- **The ledger** (`progress/stats.js`) is every count: counters (up only), records (best), firsts (play time). **Achievements**
  (`progress/achievements.js`, 928 of them in `PORT/data/progress/achievements.list.json`) are predicates over the ledger, never flags.
- Port this as: systems emit → a `Tracking` autoload listens and writes the ledger and the log → achievements are evaluated against the
  ledger. Keep the event names; they are the seams between systems.

### 2.4 Rendering and the look

The target is a sixth-generation console look (PS2): the scene drawn at 480 lines and upscaled bilinearly, smooth shading, one sun
shadow, a soft cel ramp, outline hulls, a bloom "PS2 glow", a colour grade (`render/present.js`, `render/glow.js`, `render/toon.js`).
186 files carry GLSL. In Godot: a SubViewport at 480 lines scaled up, a toon light function in a shared `.gdshaderinc`, an inverted-hull
outline pass, WorldEnvironment glow and a grade. Render **zones** (`render/zones.js`) decide what is drawn from where the camera is;
**areas** load and unload pieces of a layer; in Godot use scenes per area with background loading. Eight point lights at a time (the
light budget): in Godot that is a soft budget, not a hard limit.

Effects are data (`vfx/library/*.js`: named effects with layers); a list of all of them is `docs/VFX-CATALOGUE.md`. In Godot:
GPUParticles3D and small shader meshes, one scene per effect, played by name from an `Fx` autoload.

### 2.5 Assets

| what | where | for Godot |
| --- | --- | --- |
| the Courier's model | `src/assets/courier.glb` (its rig: 50 driven bones plus `spine005`, a second neck bone) | import the glb directly |
| the Courier's 386 animation clips | `source_assets/Courier/courier_anims_{move,melee,skiff,emotes,social}.glb` (baked into `src/assets/clips/*.bin` for the web) | import the **glbs**, not the bins; an AnimationLibrary each |
| the Solar Skiff, god hand, Pneuka Jar | `src/assets/solarskiff.glb`, `godhand.glb`, `pneuka.glb`; sources `source_assets/Courier/*.blend` | glb, or the .blend through Godot's Blender import |
| creatures | `src/assets/slipjelly.glb`, `lantern_wisp.glb`, `clapperjar.glb`; sources in `source_assets/` | glb |
| psyguns | `src/assets/psygun*.glb` | glb |
| textures, fonts, tarot, sky paintings | `src/assets/*` (webp, png) | import as is |
| Blender export scripts | `scripts/export_*.py` (what each glb was exported with) | reference for re-export |

Much of the world (the workshop, the Dunes' set dressing, effects, the garden's features) is **built in code** from primitives in
`world/` and `vfx/`. Those are rebuilt in Godot as scenes; the JS is the spec of sizes and placements.

Credits for free assets (UAL Standard animations, CMU mocap, CC0): `docs/CREDITS.md`.

## 3. Mapping to Godot 4.7 and C# (what I would do)

- **One autoload a core service** (EventBus, Save, Clock, Rng, Tuning, Tags, Signatures, Fx, Sfx, Log, Ledger). `game.X` in the JS
  becomes either an autoload or a node found by a typed service locator (`Game.Get<Belt>()`). Keep one `Game` autoload that holds
  references, as `game` does; it makes the port line by line traceable.
- **Data**: `PORT/data/**/*.json` loaded at boot into C# records (`System.Text.Json` with source generators). Do not hand-copy numbers.
  Where a JS module exports functions (listed under `code` in `data/INDEX.json`), port them as static C# methods beside the data.
- **The fixed step**: set Physics Ticks per Second to 60 and put every `fixed(dt)` / `fixedUpdate` in `_PhysicsProcess`. Interpolate
  visuals (Godot 4.3+ has physics interpolation; turn it on).
- **The Courier**: a `CharacterBody3D` with a capsule (radius 0.3, 1.7 m standing; four shapes: brief 01), driven by our own velocity code
  (brief 01). `MoveAndSlide` replaces Rapier's `computeColliderMovement`; set `FloorMaxAngle` 46°, `FloorSnapLength` 0.3, and do the
  0.4 m autostep by hand (a down-cast after a blocked move), as Godot has no autostep.
- **Techs** (the move modules that take the body for a while): a state machine of `Tech` nodes under the Courier, the same contract
  as `courier/moves/techs.js` (`CanStart`, `Step`, `OnLand`, `Animate`, `Camera`, `Passive`).
- **Animation**: an `AnimationTree` with a BlendTree: a gait blend space on one shared phase (idle, walk, jog, sprint), layers for crouch,
  slide, air, mantle; an upper-body layer for aim and the tool (a bone filter from `spine` up); one-shots for moves. Foot IK with
  `SkeletonModifier3D` (4.3+) or a `TwoBoneIK3D` per leg; joint limits are in `src/courier/anim/romdata.js` (export them).
- **Physics bodies the god hand throws**: `RigidBody3D`. The island's matter (a height field) is a `HeightMapShape3D` rebuilt for changed
  cells; creations (voxels) are a `ConcavePolygonShape3D` per chunk.
- **Shaders**: rewrite in Godot shading language. Don't transliterate the 186 GLSL files; port the looks of the four favoured systems first
  and use the JS shaders as the spec.
- **UI**: Control nodes with a custom theme ("never stock": every panel dressed in the island's dress, Clay on Anagami). The log is a
  RichTextLabel; System windows are Controls in a CanvasLayer.
- **Audio**: the sounds are synthesized in code (`audio/*.js`, Web Audio) and the music is scores as data played by an arranger
  (`music/arranger.js`). In Godot either render the synth sounds to .wav once from the browser, or port the synth to `AudioStreamGenerator`.
  Rendering them is cheaper. The scores (`music/*.js`) are note data and can be exported.
- **Drop**: touch and phone code (`ui/touch/`, `core/touch*.js`, `ui/hudlayout.js`'s phone layouts), the web loader and pack
  (`index.html`, `boot/entry.js`, `boot/box.js`, `scripts/pack.mjs`), `render/constantindex.js` (an iPhone workaround), the field report,
  the perf readout, QAIS (`debug/qais/`), the agent (`agent/`), co-op over the web page (`coop/`, unless you want co-op: then Godot's
  high-level multiplayer). The game is desktop only.

## 4. The port order (South's favourites first)

1. **Core services** (section 2.2) and the data loader. Then the Courier's controller and camera in a grey-box test room: brief 01.
   Acceptance: the movement test course (`world/basement/course.js`: eight stations) runs with times close to the JS build's.
2. **The Solar Skiff** on a dune height field: brief 02. It is a `Tech` of the Courier; it needs the controller, the wind and the sand's
   height and normal. Then the Raceway's track pieces (sun plates, rails, gates) as needed.
3. **The god hand and the Pneuka Jar**: brief 03. It needs the Courier (who becomes the Jar), RigidBody props, the matter height field.
4. **The Spirit Garden**: brief 04. It reuses the hand and the Jar on spherical planetoids.
5. Then, as South chooses: the tools (the Sondelass and the psygun first), creatures and their minds, the Dunes, the rest (brief 05).

## 5. Every system in one paragraph

Each line: what it is, where it lives, and its JSON data. "Brief 05" has a longer note on each.

**The Courier and the body**
- *Core movement* — `courier/player.js`, `courier/player/*` (capsule, ground, air, mantle, view, rescue). Data `core/config.json` `movement`. **Brief 01.**
- *Techs* — `courier/moves/*` (25: hover, rocket, skim, blink, slam, stomp, roll, swim, ladder, hang, latch, pole, grate, balance, carry,
  push, kick, the Paint Dive ...). Each its own `tech.<id>` tuning. **Brief 01.**
- *The rig* — `courier/character.js` and `courier/character/*` (clip mixing, foot and hand IK), `courier/anim/*` (layers, stances, joint
  limits `rom.js`, ragdoll, hinges). **Brief 01.**
- *The vessel* — `courier/vessel/*`: cracks per region (mask, torso, arms, legs), shatter and being made whole, glazes. Data `progress/combat/vessel.json`.
- *Mental state* — `courier/mind.js`: pushed up by Lachryma drunk, settled by quiet; overflow when the pool is pushed past full.
- *Class arts and domain arts* — `courier/classarts/*`, `courier/domainarts/*`; rules in `progress/classarts.js`, `progress/domainarts.js`.

**Tools** (`src/tools/`, the belt `tools/belt.js`, the shared moveset engine `tools/moveset.js`)
- *Psygun* — `tools/psygun/*`: six-chamber revolver; shots, a charged beam, caster shells (TYPE-00..99, `progress/combat/` data), variants.
- *Sondelass* — `tools/sondelass/*`: the cutlass (a combo engine with frame data, cancels, a melee loadout), the rod (angling: `angling/*`), the hook (grapple), the harpoon.
- *Soul Brush* — `tools/soulbrush/*`: paint and mop on the paint map (`world/ground/paintmap.js`), Celestial mode (signs drawn and read by `gesture.js`).
- *Veritome* — `tools/veritome/*`: a camera; plates (photos) scored; reprogramming a stunned creature with a macro.
- *Dreamvane* — `tools/dreamvane/*`: dowse, pick (crystals tuned by ear), fork, net, weather vane.
- *Crucibelle* — `tools/crucibelle/*`: five notes, the toll (a stagger cone), songs, a combat recital on a guitar.
- *Lockheart* — `tools/lockheart/*`: hoover, flail, a wheel of odds, Possibilikeys.
- *Pair specials* — `tools/pairspecials.js`: a main and a sub together make a Major Arcana card with its own move.

**Combat and creatures**
- *Damage types and statuses* — `progress/combat/types.js` (Impact, Ego, Influence, Illusion, Delirium; each builds a status), `creatures/stun.js` (stun depth 1..3).
- *Creatures* — `creatures/creatures.js` (registry, `strike`, hitlag), bodies `creatures/jelly/`, `wisp/`, `clappers.js`, `sentinel/`, `seaserpent/`.
- *Minds* — `creatures/ai/*` (senses, memory, drives, a utility reasoner, flock, timeline for scripted fights). Doc: `docs/AI.md`.
- *The parry and the kick* — `courier/parry.js`, `courier/moves/kick.js`.
- *Puzzle duels* — rules `progress/duel/*` (a 20x20 match-three versus board; the Line; junk; the PvE duel with foe skills); session `world/duel/*`; view `vfx/duelview/*`. Data `progress/duel/*.json`.

**Places**
- *The workshop, basement, hub, Index, course, siege* — `world/*`, `world/basement/*`, `feedback/indexmenu.js`.
- *The Dunes* — `world/dunes/*` (height field, wind, crystals, the Gnomon, areas), `world/ground/*` (wake, trail map, paint map, stains).
- *The Raceway* — `world/raceway/*` (park, tracks, rivals, modes, cups, traps, track editor, the wave pool `surf/`). Data `progress/traps.json`, `progress/skiff*.json`.
- *The Great Dunemaw* (a Well dungeon) — `world/well/*`, boss rules `progress/combat/dunemaw.js`; the Well's board (a board-game variant) `progress/wellboard/*`.
- *The blue hole* — `world/bluehole/*`: a dive zone with a sunken city.
- *Strawman's Well* — `world/strawmanwell/*`: 2D side-on stages and a platform fighter (Melee's rules, `progress/platformfighter.js`).
- *The Throwing Room, the Touchstone, the Sandbox, the hangar* — test and minigame rooms off the Index.
- *Shrines* — rest, fast travel, the garden's door.

**The Emocean**
- *The crossing (rail shooter)* — `world/emocean/*` (stage, waves, foes, bosses), rules `progress/rail/*`; the ship `courier/ship/*`. Data `progress/rail/*.json`.
- *The open sea* — `world/opensea/*`, rules `progress/opensea/*` (grid of squares, wind, islets, salvage, sea beasts, herds, safari).
- *The economy of trade* — `progress/econ/*` (crude, casks, hops, the Purser). Doc `docs/ECONOMY.md`.

**God hand and garden**
- *The god hand* — `godhand/*`, `boot/godhand.js`. **Brief 03.**
- *The Spirit Garden* — `world/garden/*`, rules `progress/realm.js`, `garden.js`, `harmony.js`, `seeds.js`, `decor.js`, `mycelium.js`, `cooking/*`. **Brief 04.**
- *Soul Alchemy* — `progress/alchemy.js`, the press `world/garden/press.js`: materials walk the soul colour on a colour wheel; firing raises an attribute.

**Progression**
- *Domains* — `progress/domains.js`, `domainladder.js`: seven skills 1..99 (Ouranurgy, Manifestation, Divination, Psychokinesis, Possession, Alteration, Spellscription); a widening per tool.
- *Achievements, knacks, Movement Arts, quests, goals, collection log, the Codex* — `progress/*`, `feedback/codex/*`.
- *Spreads and classes* — `progress/spreads.js`: Major Arcana laid in tarot spreads on the Pneuka Box's grid; your class read from suits.
- *The Pneuka Box* — `pneuka/*`: 56-slot inventory and the belt (`FITTINGS`: what fits into a tool).
- *Weather and the day* — `progress/weather.js` (an island's mood, one feeling at a strength), `vfx/weather.js` (its look), `vfx/sky.js`, `vfx/nightsky.js`.

**Other**
- *Mechs* — `progress/mechs/*`, `world/hangar/*`, `vfx/mechs/*`: a giant robot of nine parts, the toy adobe city with voxel destruction and fire, giants, a boxing ring.
- *Raku's Bazaar (casino)* — `progress/casino/*` (Querent tarot, Astroll dice games, Entropy Tactics), `world/bazaar/*`, `world/entropy/*`.
- *Cooking* — `progress/cooking/*`, `world/garden/hearth.js`, `vfx/cooking/*` (a soft-body dough).
- *Audio and music* — `audio/*` (synthesized sounds and ambience), `music/*` (scores as data, the arranger, the rhythm mode). Doc `docs/OST.md`.
- *The overlay* — the System's HUD over the world: the Sight (top-right instrument), the Lachrimeter (bottom-right thermometer of the pool), tags, System windows (`vfx/sight.js`, `vfx/lachrimetertube.js`, `ui/*`). Plan `docs/plans/OVERLAY.md`.
- *The folk and dialogue* — `npc/*` (lines are data, `npc/talks.js`); neuralese, the game's conlang (`docs/NEURALESE.md`).
- *Co-op and siblings* — `coop/*`: the five development "divisions" as AI companions in the world; guests over the web page.

## 6. Names

`docs/GLOSSARY.md` is the dictionary: every term once, with its code id and file. Use its words for C# types (`Courier`, `PneukaJar`,
`SolarSkiff`, `GodHand`, `SpiritGarden`, `Planetoid`), so a grep finds both sides. Words to keep straight:

- **the Courier** (the character) vs **the player** (the human). **the pool** (Lachryma held) vs **Lachryma** (the substance). **a cube** (currency) vs a block.
- **game day** (one real hour), **game hour** (150 real s), **real second**: every time unit names its clock.
- **the Pneuka Jar** (the Vessoul's jar form, in the god hand and the garden) vs **the vessel** (the Courier's clay body).
- **a tech** (code: a module that takes the body) vs **a Movement Art** (the same, learned, as the game calls it).
- **a zone** (render zone), **an area** (what loads together), **a room** (a named place), **a place** (a named spot).
- **the Spirit Garden** (the place) vs **the Inner Realm** (its code name, `game.realm`).

## 7. What is in this repository now

- `src/` the reference implementation (it builds: `npm install && npm run dev`).
- `src/assets/`, `source_assets/` models, clips, textures and their Blender sources.
- `PORT/` this handbook, the briefs, the data, the file map, the event catalogue. Regenerate the generated parts with
  `node scripts/port/export-data.mjs` and `node scripts/port/filemap.mjs`.
- `docs/` the glossary, lore, design, the AI doc, the economy, the OST notes, the art notes, and the system plans.
- Module headers cite docs that were cut in the sunset (`docs/handoffs/`, `docs/ARCHITECTURE.md`, `docs/CASEBOOK*.md`, `docs/wiki/`,
  images under `docs/plans/art/` and `docs/ref/`). They are in git history: `git show HEAD~1:<path>`.
- `scripts/` the Blender exporters (`export_*.py`), the clip and texture bakers (`bake_*`), the port scripts.

The last playable web build is v434, published at the artifact https://claude.ai/artifact/FjLfppJaKzUCZxoVBp9FE8 (play it to see how a
system should feel). Progress there resets with no new builds; it stays as the reference.
