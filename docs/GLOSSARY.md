# The glossary

One word, one meaning. A word in this file means only what it says here: in the code, the docs, the commits, the messages between
divisions, and when the owner asks for something. If a request uses a word in a way this file does not, the word is clarified before
anything is built. That is cheaper than building the wrong thing.

How it works:

1. **The code says what the game says.** An identifier uses the game's word (in its code form), or the code name given here. Where the
   two differ for a reason (`clapper` for the clapperjar), the entry says so.
2. **A new thing is named here first,** in the same commit that brings it, by the division that owns it. The words the player sees are
   Espada's (and the owner's); the code names are Petra's to approve at the gate.
3. **A homonym the game keeps on purpose is always qualified** (the list near the end).
4. **Retired words are refused** by `npm run check` and at Petra's review (the table at the end says what to say instead).

Entries: **term** (code name, where) is what it means. *Not:* what it must not be used for.

---

## The Courier

- **the Courier** (`player`: the body's physics, `src/courier/player.js`; `character`: the rig and its animation, `src/courier/character.js`): the one
  the player plays. Androgynous: "you" where the game speaks, "they" in docs and comments. *Not:* "the player" in anything the game says.
- **vessel** (`game.vessel`, `game.vesselDamage`, `src/courier/vessel/`): the Courier's clay body and what is done to it: its glazes, its cracks,
  its shattering and reforming. *Not:* the god hand's jar.
- **region**: one of the vessel's six hit regions (mask, torso, left and right arm, left and right leg), each with its own cracks.
- **crack**: damage to the vessel, per region. It mends slowly on its own, or at once at the kiln (MEND). *Not:* a pot's cracks
  ("pot cracks", below).
- **shield**: the pool paying for a blow before the clay does (35 Lachryma a full blow). It is not a separate bar.
- **shatter / made whole** (`courier.shatter`, `courier.reform`, `src/courier/vessel/death.js`): the Courier's death, and being made whole again in
  the workshop. Player text says "made whole" (or "re-formed"), never "reform", which reads as politics; the event keeps its code name.
- **glaze** (`src/courier/vessel/glazes.js`): a colour fired onto a region at the kiln. **FIRE** keeps a look, **MEND** refires the cracks.
- **kintsugi** (`src/courier/vessel/kintsugi.js`): the net the cracks run along. Its gold is not drawn on the body for now (R41).
- **the pool** (`game.lachryma`, `src/courier/lachryma.js`): the Courier's store of Lachryma. It pays for shots, charges and arts, and it is the
  shield. "Lachryma" alone means the substance.

## Lachryma and money

- **Lachryma**: the substance of feeling and magic, condensed or liquid (`docs/LORE.md`, section 1: the Emocean is an atmosphere of it; cubes
  are it made solid). Always capitalised.
- **bauble** (`game.baubles`): a gummy drop of Lachryma that refills the pool. Left lying, it oxidizes and sinks.
- **cube** (`game.cubes`, `src/world/treasure/cubes.js`): a Lachryma cube, the only currency. *Not:* a box in the level ("block").
- **crystal** (`src/world/dunes/crystals.js`): a Lachryma crystal formation in the Dunes, struck with the Dreamvane's pick and tuned by ear.
  What it gives: cubes, and sometimes a **crystal shard** (`mat.shard`, always so called) or a Possibilikey.
- **signature** (`src/core/signatures.js`): where Lachryma is, and how strongly. Tools that sense or drink Lachryma ask here.
- **faucet / drain**: where cubes come into the world / leave it. **A minute of play** is the economy's unit (`docs/ECONOMY.md`).
- **the aim** (`ECON.perMinute` × 60): what ordinary play should earn in an hour (480 cubes). A source is judged as a multiple of it
  ("× aim"); nothing but luck should pay more than 1.5×.
- **converter**: a thing that takes one resource and gives another (the Tithe: cubes into chances; condensing: cards into cubes; film:
  cubes into plates). Machinations' word.
- **profile** (`PLAY`, `scripts/economy.mjs`): one way of spending an hour (the fighter, the miner, the photographer, the angler, the
  treasury camper), simulated against the table. A **mixed profile** is two played together.
- **sink**: a drain the player chooses and that never fills (the glazes, later the Shrine Garden). **The long sink** is the one meant
  to take a committed player's surplus for weeks. *Not:* any drain (the Tithe is a drain, not a sink).
- **worth** (`worthOf`, `src/progress/shop/catalogue.js`): what a thing is worth in cubes, the base every price moves from. A shop's
  **list** price is worth × its markup; Raku's **floor** is the least he takes.
- **pity** (`TITHE.pity`, `src/world/treasure/treasure.js`): a counter that turns a run of bad pulls into a certainty (a rare in every
  10 Tithe pulls, an epic in 40, a prismatic in 100). **Published odds** are the base weights; **consolidated odds** are the rates a
  player actually meets with pity counted (`docs/DESIGN.md`, section 7).
- **dupe**: a curio a chest gives that is already held to its card's limit; it is condensed into cubes instead (`ECON.dupe`). **Dupe
  protection** is the bias toward curios not yet held.
- **outcome** (`OUTCOMES`, `src/tools/lockheart/table.js`): what can come out of a Lockheart (dud to slip nuke), drawn from its coffin's
  **table** of weights, bent by the Possibilikeys; **power** is how full the coffin was (1 to 2). The **jackpot** is the slip nuke.

## The tools

- **tool** (`src/tools/`, the belt and the held-tool base): one of the Courier's psychic tools, worn on the belt: the psygun, the
  Sondelass, the Soul Brush, the Veritome, the Dreamvane, the Crucibelle, the Lockheart. *Not:* a Node script (those are "scripts", in
  `tools/` until the restructure moves them to `scripts/`).
- **the belt** (`game.belt`, `src/tools/belt.js`): where tools are worn; anything that asks "is a tool out?" asks the belt.
  **draw / stow**: take a tool in hand / put it back.
- **fitting** (`FITTINGS`, `src/pneuka/box.js`): what fits into a tool (a lure, an instrument, the Lockheart's keys), kept in the Pneuka
  Box. A tool never has an inventory of its own.
- **the psygun** (`game.weapon`, `src/tools/psygun/weapon.js`): the gun. A **shot** is one round fired (and only that: see "shot" below). A
  **charge** winds up a piercing beam. A **shell** is a caster shell (`Type-00`...), a special round loaded in a **chamber**.
- **the Sondelass** (`src/tools/sondelass/`, `src/tools/sondelass/sondelass.js`): the blade with three **forms**: the **cutlass** (with **blade mode**,
  **zandatsu**, the **Stinger**, **guard**), the **rod** (angling: `src/tools/sondelass/angling/`), the **hook** (the grapnel; the **grapple** is what the
  Courier does on its line).
- **the Soul Brush** (`src/tools/soulbrush/`, `src/tools/soulbrush/soulbrush.js`): the **club** (combo, **slam**), the **flick** of slip, **Celestial mode**
  (strokes drawn on the screen and read as **sigils**), and **inscriptions** (what a sigil writes onto a thing).
- **the Veritome** (`src/tools/veritome/`, `src/tools/veritome/veritome.js`): the book that is a camera. The **lens**; a **plate** is one photograph; the
  **film**; the **darkroom** (where plates are appraised); the **Flash** (dazzles and stuns; a photograph never does); **reprogramming**
  (below). Its pages: **the Book** (the bank: things kept as **cards**), the **Compendium** (appraised entries), the **bestiary** (facts per
  creature), the **Major Arcana** (twenty-two designated cards).
- **reprogramming** (`src/tools/veritome/reprogram.js`, `src/tools/veritome/mind/`): rewriting a stunned creature's mind. A **macro** is a program, composed on a
  **lattice** of **Functions** on the Codex's **THE MIND** shelf, and spoken in **neuralese**.
- **the Dreamvane** (`src/tools/dreamvane/`, `src/tools/dreamvane/dreamvane.js`): **dowse** (the needle points at Lachryma), the **pick** (strikes
  crystals), the **fork** (a tuning fork, thrown), the **survey** (charts the ground around).
- **the Crucibelle** (`src/tools/crucibelle/`, `src/tools/crucibelle/crucibelle.js`): five **notes**, the **toll**, **songs** (note patterns with effects),
  **fever**; the **mirage** (the Song of Seeming's decoy).
- **the Lockheart** (`src/tools/lockheart/`, `src/tools/lockheart/lockheart.js`): a **coffin** on a chain; its **heart** (which kind of coffin); **hoover**
  (draws Lachryma in) and **channel** (the pose while it does); a **Possibilikey** (always so called, never "key" alone) on its ring;
  the **wheel** of odds; **the Opening** (its ultimate: `src/tools/lockheart/ultimate.js`).
- **ultimate**: the category, a tool's cinematic signature move. The Lockheart's is the Opening; no other tool has one yet.

## Moving

- **the core movement**: walk, sprint, slide, jump, wallrun, mantle, dash, and the moves any humanoid has (swim, ladders, hanging,
  poles, grates, balance, carrying, pushing). The gold standard: nothing changes it.
- **tech** (code only: `Tech`, `src/courier/moves/techs.js`): anything that takes the Courier's body for a while: a movement tech, a tool's
  hold, a chest's opening, the kiln station, talking, the death, the Opening. In the game, a learned one is a **Movement Art**.
- **Movement Art** (`src/progress/skills.js`): a tech the System teaches; a **variant** is one of its versions.
- **the skiff / Solar Skiffing** (`src/courier/skiff/`: the tech `Skiffing` in `skiff.js`, the boat `Skiff` in `boat.js`; code name `skiff`: the tech's id, `T.tech.skiff`, events `skiff.*`): the sand boat, and sailing it
  in the Dunes. *Retired:* "surfer".
- **stance** (`src/courier/anim/stances.js`): a held pose baked from clips (a tool's idle). *Not:* a form (the Sondelass's) or a mode (blade
  mode, Celestial mode).

## Places

- **layer** (`LAYERS`, `src/feedback/cartography.js`): one level of the map: the upper floor, the ground floor, the basement, the Dunes.
- **room**: a named place inside a layer, said by the log as you enter it (`place.enter` carries `room`); also what the Index sends you to.
- **zone** (`src/render/zones.js`): a render zone, what is drawn from where the camera is. *Not:* the Zone of Influence, which is always
  named in full (or ZoI).
- **the Zone of Influence**: the ground the player has explored. Nothing more, for now.
- **the workshop**: the ground and upper floors: the kiln, the folk, the pots, the gong.
- **the basement**: below the workshop: the hub, the course, the movement lab, the lap circuits, the siege. *Not:* "the lab".
- **the hub**: the basement's centre, where the Index stands ("back to the hub").
- **the Index** (`src/feedback/indexmenu.js`): the console at the hub: F, and pick a room.
- **the course**: the basement's loop of eight **stations** (checkpoints), with laps and splits.
- **the movement lab**: the basement's hall of five wings (the hands, the rigging, the techs, the clockwork mill...). Only as this room's
  name.
- **lap circuit** (`src/world/basement/circuits.js`): the Braid, the Mill Race, the Spindle.
- **the siege** (`src/world/basement/siege.js`, `src/world/basement/raids.js`): the god hand's arena; raids happen there and nowhere else.
- **the time trial** (`src/world/trial.js`): begun at the workshop's gong.
- **the Dunes** (code `dunes`): the sand sea, a region of Anagami Island, capitalised in player text like the Weir and the Well; **the oasis**
  at its heart, **the Weir** (its pools and pier), **the Weir's Well** (of liquid Lachryma), **the barrier** (the edge), **the ruins**
  (columns and obelisks: stone).

## Creatures and folk

- **creature** (`game.creatures`, `src/creatures/creatures.js`): a hurtable thing with a mind (a slip jelly, a spirit). A weapon calls
  `creatures.strike`.
- **clapperjar** (code: `clapper`, `src/creatures/clappers.js`): the clapping pots, the folk's lowest tier (earthenware). The code's shorter
  word is accepted.
- **slip jelly** (`src/creatures/jelly/`), **spirit** (`src/creatures/spirits.js`: an ally, called up), **mirage** (a decoy).
- **mind** (code: `Brain`, `src/creatures/ai/`): what a creature thinks with: senses, memory, drives, a utility reasoner. See the homonyms below.
- **status** (`game.stun`, `creatures.status`): a condition on a creature (stun, halt, slow, sleep, calm, melt).
- **stimulus** (`game.ai.stimuli`): a sound, light or smell a creature can notice.
- **damage type** (plan B1, Dovina's numbers): what a blow is made of, on the **Law–Chaos line**: **Impact** (lawful, physical), **Ego**
  (lawful, mental), **Influence** (neutral, social), **Illusion** (chaotic, perceptual), **Delirium** (chaotic, entropic). Code: `type`,
  lower case (`'impact'` ... `'delirium'`).
- **mental state** (plan B2): how solid a creature's mind is, Stoic, Resolved, Balanced, Fluid, Prismatic (a number from -2 to +2; the
  lore's solid to liquid). **Emotional Output** (EmO, plan B4): a creature's agitation, 0 to 1; past its band it **enrages**.
- **the folk** (code: `npc`, `src/npc/`): the clay people, all fragments of Kaolin Anagami, tiered earthenware (the clapperjars) < stoneware <
  porcelain < the Court. "The folk" in the game means the ones who speak (Saggar, Raku, Old Grog, Pip); only they speak in the dialogue
  box. Pronouns (R39): the Prince of Clay is "he"; every other folk is unisex by construction and goes by what the lore gives it (so far
  Mistress Saggar "she", Raku "he"; Grog and Pip unset: write around them). The Courier is always "they".

## Records and progression

- **the System** (`src/progress/system.js`): the game's code made a voice (R39); it teaches the Movement Arts and keeps the save. Always
  capitalised.
  *Not:* a game system in general (say "a system" in lower case, or name it).
- **the Codex** (B, `src/feedback/codex/codex.js`): the System's book: arts, the ledger and records, the tools, the Veritome's shelf, curios.
- **the all-arts switch** (code `system.lendAll`, `setLendAll`; in the Codex's head): lends every art without learning it (on in DEBUG,
  off in STORY). Its label is ALL ARTS (ON / OFF). Nothing it lends is counted or announced. *Not:* "Lab mode".
- **the ledger** (`src/progress/stats.js`): every count the game keeps. **achievement** (`src/progress/achievements.js`): a predicate over the ledger,
  never a flag.
- **the log** (`src/feedback/gamelog.js`, rules in `src/feedback/tracking.js`): the only text feedback; **the chat line** is its typing.
- **the domains** (six and one): the seven skills of the Courier's psyche, mostly felt in the god hand: Ouranurgy, Manifestation,
  Divination, Psychokinesis, Possession, Alteration, and **Spellscription** (transcribing a thing down: the Soul Brush's glyphs, the
  Veritome's macros). *Retired:* Spellcasting.
- **damage type** (`src/progress/combat/types.js`): what kind of force a blow is, lawful to chaotic: **Impact**, **Ego**, **Influence**,
  **Illusion**, **Delirium**. Each **builds** a status and **trumps** one other (a closed cycle). **Annihilation**: Impact on a target
  carrying Delirium's status, or the reverse, hits much harder. *Not:* an element.
- **mental state** (`src/progress/combat/mind.js`): how open a creature is to being moved: **Stoic**, **Resolved**, **Balanced**,
  **Fluid**, **Prismatic** (solid to liquid). *Not:* mood (`npc.mood`, the folk's), nor EmO.
- **EmO**, Emotional Output (`src/progress/combat/emo.js`): a Figment's agitation, 0 to 1; its Lachryma yield peaks in the optimal
  band, and it enrages past it.
- **Luck** (`src/progress/luck.js`): the surprise lived through (in bits), read from the ledger; it sways chance, never a skill.
- **material** (`src/progress/econ/materials.js`): what Soul Alchemy presses, of a broad **kind** (eldritch, arcane, finery, mechanism,
  edge, art, provision), with a hue, a saturation and a **path** (the winding route it walks the Courier's colour). **The spirit press**
  (hopper, igniter, crucible): where materials are pressed. *Not:* "mats" in player text.
- **prestige** (of a look: `ECON.looks`): where a glaze, stone, hair or skin sits on the folk's clay ladder, Earthenware to the Prince's
  own; it sets the price (`docs/ECONOMY.md`, "The worth of a look").
- **Cogitomap**: a map of one Well as it was when charted; since a Well changes over time, a Cogitomap is a ticket to a seeded run of it.
  Copied by Spellscription; sold, traded, hauled (`docs/ECONOMY.md`, "The livelihoods").
- **livelihood**: a way of earning (mining, angling, hauling, a commission...) (`docs/ECONOMY.md`). *Not:* "vehicle" (the skiff is one),
  "a living".
- **deck** (of a drop): the shuffle bag a rare drop is drawn from: a 1-in-N item is certain within N tries. *Not:* a deck of the
  Veritome's cards (say "the Book").
- **mastery dividend**: the passive income an encounter pays once everything the ledger holds for it is complete.
- **the three layers**: a **Well** (a dungeon), **the island** (action outside the Wells), **the Emocean** (travel between islands)
  (`docs/DESIGN.md`, section 11).
- **counter / record / first** (`stats.inc`, `stats.hi` / `stats.lo`, `stats.first`): the ledger's three kinds of entry: a number that
  only goes up, a best with when and where it was set, and the play time something first happened. A **funnel** is the firsts read in
  order (play time at the first art, fish, chest...): how fast a new player meets the game.
- **tier** (of an achievement): Easy to Grandmaster, worth 1 to 6 **points**; **type**: count, speed, perfection, mechanic, stamina,
  collection (OSRS). The points buy a **standing** (Sweeper to Fool's Fortune); some achievements give a **title** (FFXIV).
- **the loops**: what the player wants at three scales: **the moment** (seconds), **the session** (an evening), **the long run** (weeks)
  (`docs/DESIGN.md`, section 1).
- **build**: one published version of the game (v45...). Progress resets on every new build; settings are kept.

## The god hand

- **the god hand** (~, `src/godhand/godhand.js`): the mode where the Courier becomes a jar and you become a hand.
- **the jar** (code name `jar`; events `jar.hit`, `jar.shatter`, `jar.reforge`): the Pneuka Jar, the Courier's true form and the Prince's
  magnum opus; in the god hand the Courier settles back into it (`docs/LORE.md`). It has integrity, it shatters, it is reforged. *Not:*
  the vessel, and not a costume.
- **God Arts** (`src/godhand/arts.js`): the god hand's five arts.

## Windows

- **the pause menu** (Esc): the help pages and the controls. *Retired:* "pause card".
- **the Pneuka Box** (P, `src/pneuka/`): the inventory (28 slots) and what is worn. With the Veritome out, **the bank** (the Book) opens
  beside it. *Not:* the Veritome; the Veritome is the bank, not the inventory.
- **the map** (M): called **Mind Mapping** in the game (`src/feedback/cartography.js`).
- **the tuning panel** (Tab, `src/debug/tuning.js`): live sliders and actions (set the room again, last checkpoint, the hub).
- **the workbench** (`/workbench`, `src/workbench/`): the studio for effects, models and sequences.
- **the dialogue box** (`src/npc/dialogue.js`): the one window of words in the world.

## What the game shows

- **world mark**: a mark that sits on a thing and carries no words: a glyph pop, the interact chevron, the lock-on reticle, the letterbox
  bars, the fish portrait.
- **ground marks** (`src/world/ground/groundmarks.js`): footprints and trails left on soft ground. With the **trail map**
  (`src/world/ground/trailmap.js`) and the skiff's **wake** (`src/world/ground/wake.js`).
- **effect** (`game.vfx.play(name)`, `src/vfx/library.js`): a named VFX entry, played by name; its look is data. **particles**: the emitter
  pools under the effects (`src/vfx/particles.js`, to be folded into `src/vfx/`).
- **damage look** (`damage.<type>` in the library): the colour and motif a damage type adds to a hit effect, so a blow's type reads
  with the HUD hidden. **aura** (`aura.<status>`, `src/vfx/auras.js`): a status shown round the creature that has it. **temper**
  (`src/vfx/temper.js`): a creature's body showing its mental state and its EmO (never text).
- **sequence** (`game.cine`, `src/cine/`): a cinematic as data (the Opening, a chest's opening).
- **shot**: a psygun shot, and only that. A scripted camera is a **camera shot** (`cinema.shot`); a photograph is a **plate**.

## Engine and process words

- **event** (`game.events`): a message on the bus, named `domain.verb`; its payload never uses `name` or `t`, and an outcome carries `by`.
  An event is named for the ledger key it feeds where it feeds one (`move.jump` is emitted and `move.jump` counted; R42).
- **rescue** (`courier.rescue`, `Player.guard()`): the body's safety net taking it out of a bad state (`nan`, `nudge`, `reset`, `clip`),
  counted by the stress test, never hidden. *Not:* the cutlass's guard (`guard.up`, `guard.block`).
- **tag** (`src/core/tags.js`): what a tool may do to a thing (sliceable, breakable, liftable, pushable, static) and what it is made of (clay,
  crystal, jelly, wood, stone, metal).
- **service**: a `game.*` object every module may ask (time, mood, cinema, cine, vfx, events, creatures, belt, cubes...).
- **module**: one file under `src/`. **division**: one of the five Claude sessions (Petra, Dovina, Wanda, Calissa, Espada). **round**: one
  cycle of work (R42...). **the gate**: Petra's review of every push to main (`docs/ARCHITECTURE.md`).
- **rest bake**, **prop batch**, **light budget**, **present**: the render tricks (`src/render/`).

## The world (Espada's: `docs/LORE.md`, section 1)

- **the Emocean**: the collective unconscious, a sea (an atmosphere) of pure Lachryma outside every island.
- **an Island of Ego**: an island precipitated out of the Emocean where an identity is strong enough; its owner's Will holds it apart.
- **Anagami Island**: this Island of Ego, a 5 x 5 grid of chunks. **Kaolin Anagami** is the island, and the ego it is.
- **the Prince of Clay**: Kaolin Anagami's main avatar, the most powerful of the folk. "He".
- **Couriers**: the Pneuka Jar in humanoid form; every player is one. They go out across the Emocean and resist excess Lachryma best.
- **cogitohazard**: the umbrella word for Lachryma dangers in the environment and maliciously aligned Figments.
- **Figment**: a thought-construct hewn from an Island of Ego's own psyche. **Egregore**: a thought-form spawned from the Emocean,
  authored by no one. Neither is good or evil by nature.
- **Contractor**, **Tulpa**: one who survives the open Emocean is a Contractor with a Tulpa (a thought-form authored with care).

## Homonyms we keep on purpose (always qualify them)

| word | its meanings | say |
| --- | --- | --- |
| mind | a creature's (`Brain`); THE MIND (the macro shelf); Mind Mapping (the map) | "a creature's mind", "THE MIND shelf", "the map" |
| charge | the psygun's beam; the Lockheart's fill; the Veritome's capture | whose charge |
| key | a keyboard key; a Possibilikey | "Possibilikey", always in full |
| station | a course station (checkpoint); the kiln station | "course station", "kiln station" |
| theme | the window colour (`ui/theme.js`); a piece of music | "window colour", "music theme" |
| card | a Veritome card; the tarot cards falling on the title | "card" is the Veritome's; the title's are scenery |
| shard | a piece of a broken pot; a crystal shard (the item) | "crystal shard" in full |
| tier | a chest's (common .. prismatic); an achievement's (Easy .. Grandmaster); a fish's (1 .. 5); the folk's (earthenware .. the Court) | "chest tier", "achievement tier", "fish tier", "the folk's tiers" |
| rank | a Veritome card's (SS .. H); a Lockheart outcome's (0 dud .. 4 jackpot); the standing (Sweeper ..) | "card rank", "outcome rank", "standing" |
| Well | the Weir's well of liquid Lachryma (a place); a Well, a pocket of distortion (a dungeon, R40) | "the Weir's Well", "a Well" |

## Retired words

| retired | say instead | where it still is |
| --- | --- | --- |
| surfer, Solar Surfer | the skiff, Solar Skiffing | (gone; Wanda's `sfx.surfLoop` and Calissa's clip names `surf*` are theirs to rename) |
| Lab mode | the all-arts switch (code `lendAll`, `setLendAll`; its label, "ALL ARTS" for now, is Espada's) | `docs/DESIGN.md` |
| the lab (for the basement) | the basement (or the movement lab, the room) | (gone) |
| vessel (for the god hand's jar) | the jar | Wanda's `sfx.vesselHit` (to be `jarHit`) |
| pause card | the pause menu | (gone) |
| course (for moving between rooms) | rooms (`game.rooms`, after the split) | `game.course` (`src/world/basement/basement.js`: the course and the room teleports in one class) |
| /lab (the workbench's command) | /workbench | (gone) |
| torture test / bot | the stress test | (gone) |
