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

- **the Vessoul** (the owner, 2026-10-04): the entity that stands for the player in the world, a soulspark from beyond. It takes several
  forms, all one being, which is why they share a design language: **the god hand**, **the Pneuka Jar**, **the Courier**, and, on the
  Emocean, **the ships**. The **Solar Skiff** is a limb of the Vessoul. *Not:* "the player" in player-facing text (the game says "you").
- **ship** (the Emocean's rail-shooter layer): the Vessoul's sailing form between Islands of Ego, classed by real nomenclature: **sloop**,
  **frigate**, **tanker**, **destroyer**, **galleon**. *Not:* the skiff.
- **hop** (`hop()`, `src/progress/econ/emocean.js`): one crossing of the Emocean from one island to another, on the **node map** (one node
  an island, at its place on the Law-Chaos line). It costs fuel (the ship's **burn** times the distance) and is sailed as one **stage**.
- **stage** (`STAGE`): the rail-shooter run of a hop, about two minutes, authored once; its waves are written by **role** (`school`,
  `darter`, `heavy`), and the route's **danger** (where it runs on the line, and how far) says which Figment class fills each role. A
  ship **bears** six hits before the stage is failed. *Not:* "shield" (the Courier's Lachryma pool), "level" (a domain's).
- **widening** (`WIDEN`, `game.psyche.widen(key)`, `progress/domains.js`): what a domain's level does in play: a multiplier of a tool's own
  range or a bonus to a count (reach, capacity, options), never accuracy; at level 1 the tool is exactly as it is without it.
- **the five feelings** (the aspects of Lachryma: wonder, mirth, desire, grief, dread; **desire** was "hunger" until 2026-10-05, and
  *hunger* is now only the folk's word for desire in excess, never an aspect). **Wherever a player sees them** (a menu, a log, a
  legend, a bestiary, a chart), **they are ordered most positive to most negative: Wonder, Mirth, Desire, Grief, Dread** (the owner,
  2026-10-05; `DISPLAY_ORDER` in `progress/weather.js`). Their order on the Law-Chaos line (mirth at Law .. dread at Chaos) is a
  different thing, for the systems, and never the order they are shown in.
- **agate** (Espada's word, after agateware: two clays wedged, never blended; `AGATES`, `agateOf` in `progress/weather.js`): two feelings
  felt at once, shown as one: the stronger is what a mind does or what falls from the sky, the weaker its colour. Named after
  Plutchik's dyads, in Espada's plain words (delight, hope, guilt, disappointment, awe, longing, worry, despair). Opposites never make an agate: they **cancel** (the
  mood is torn and weaker). A mind or a sky shows one feeling or one agate, never three (the owner: cycles of expansion and contraction).
- **the wheel** (`docs/plans/WHEEL.md`): Plutchik's eight feelings, of which the five aspects are five; **Faith** (trust), **Gall**
  (disgust: rejection, from boredom to loathing) and **Fury** (anger) join later, as places (approved, 2026-10-05). Intensity **rings**
  are adjectives on a feeling's strength, never new names; the centre is Prismatic.
- **grain** (a creature's temperament: `docs/plans/TEMPERAMENT.md`; the data in `src/progress/combat/temperament.js`): who a mind is, five traits each between two poles:
  curious / wary, orderly / erratic, bold / shy, gentle / hostile, skittish / steady (ids: the five-factor model's OCEAN). It weights
  the mind and says which damage type a mind is weak to; it shows in movement and posture, never colour. *Not:* **temper** (the body
  showing its mental state, `vfx/temper.js`); *not* "personality" or "stats" in player text. Grain is climate, mood is weather.
- **weather** (`game.weather`, `src/progress/weather.js`): an island's mood, falling as Lachryma: one of the five **aspects** (wonder, mirth,
  desire, grief, dread) or **calm**, with a **strength**; a **spell** of it holds a block of game hours. Each feeds the damage type at its
  place on the Law-Chaos line, its fish, and its crude's price where it falls. **The forecast** is how far ahead it can be known (a
  Divination widening). Names of the weathers are placeholders for Espada's.
- **the day** (`phaseAt`, `lightAt`): night, dawn, day and dusk on the game clock (a game day is a real hour); at night Lachryma glows.
- **friendly fire** (`src/progress/combat/friendly.js`): a blow on an ally (another player's Courier, a division's clay folk form): a fifth
  of its damage, and statuses that land once and then meet **tolerance** (each one of a kind from allies needs twice the build-up and
  holds half as long; the third in 20 s is shrugged off). *Not:* the spirits (allied creatures), whom the Courier's blows pass through.
- **the Shrine Garden** (`game.garden`, `src/progress/garden.js`): the pocket inside the vessel: the mastery dividend's **slots** (each worked
  by a **mastered** encounter: every achievement of its group done), the **beds** (a material planted grows more of its kind), and the
  upgrades (the long sink). *Not:* "Spirit Garden" (the owner's word for it in passing, 2026-10-05: the same place, unless ruled otherwise).
- **Soul Alchemy** (`game.alchemy`, `src/progress/alchemy.js`): pressing materials at **the spirit press** walks the Courier's **soul colour**
  (a hue and a saturation on the wheel) along their paths; **firing** it while the colour sits in an **attribute**'s target raises that
  attribute a **rank**. Seven attributes (Willpower, Focus, Charisma, Perception, Dexterity, Visualization, Resilience), each widening
  the **vessel** as a domain widens the tools. *Not:* "stats"; Luck is apart.
- **voyage** (`game.voyage`, `src/progress/voyage.js`): the Emocean hop's systems: where the Courier is on the node map, the crossing
  (fuel, the stage's result, making port), the reckoning kept, and the **manifest** (each cask's origin and price, first in, first out).
- **cask** (`cask.<grade>`): the unit of crude Lachryma, carried in the Pneuka Box; a ship's **hold** is how many casks may cross.
- **reckoning** (`RECKON`, `reckonLead`): how much of a crossing the Courier has divined (Divination), 0 .. 1, for that day; it marks the
  waves' lanes ahead and opens the way to a node not yet found. *Not:* "course" (the basement's loop of stations).
- **the Purser** (Espada's, the owner R57): the trader at Margarite's dock, who buys crude, materials and Cogitomaps; the role is the name
  (`purserPrice` gives what a dock pays on any island).
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
- **glaze** (`src/courier/vessel/glazes.js`): a colour fired onto a region at the kiln. **FIRE** keeps a look, **MEND** refires the cracks. A rare glaze also has a **kiln pattern** (`vfx/finish.js`): the mark its firing leaves, drawn the way the real one forms (yohen's stars, oil spot's silver, hare's fur's streaks, crackle, kinrande's leaf).
- **kintsugi** (`src/courier/vessel/kintsugi.js`): the net the cracks run along. Its gold shows on the body only while a crack mends, and is gone when the mend completes (R45).
- **chest glaze** (`src/vfx/chestglaze.js`): how a chest shows its tier as it charges, in place of a beam: celadon, crazing, raku, kintsugi gold.
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
  a Possibilikey's **uses** (the openings it has been turned in: brass is spent at the first, any other **breaks** with a chance that
  rises with them, `keyBreaks`, the rule Dovina's `ECON.lockheart.keyWear`); a used one keeps its uses wherever it goes and never stacks
  with fresh ones (*not* "worn": to wear is to put a tool on the belt);
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
- **place** (`game.places`, `src/world/places.js`): a named spot anything can be sent to by id (`well.mouth`, `kiln`, `folk.<id>`):
  the agents, the trailer and the map read the one registry. A place is a point; *not* a room (an area the log names, which the
  `place.enter` event carries as `room`: an old homonym).
- **zone** (`src/render/zones.js`): a render zone, what is drawn from where the camera is. *Not:* the Zone of Influence, which is always
  named in full (or ZoI). A zone may be **part of** another (`partOf`): drawn on its own, but walked, lit and travelled as one with its
  **whole** (`wholeOf(pos)`): the beach is part of the dunes.
- **the zone map** (`src/render/zonemap.js`): the zones' bounds as pure numbers (`zoneOf`, `wholeOf`), for anything that asks where a
  point is without drawing: the weather's place, a Node script.
- **the daylight** (`game.daylight`, `src/render/daylight.js`): the light on the open ground (the sun, the sky's light, the fog) by the game
  hour and the weather, so the lit world agrees with the sky's painting. *Not:* the day's phase (night, dawn, day, dusk), which it reads.
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
- **the shore** (`game.dunes.beach`, `src/world/dunes/beach.js`; its zone is `beach`, part of the dunes): due east of the oasis, where the
  Dunes run down to the Emocean, and nothing but the sea beyond. **the waterline**: where the sand meets the crude (`shoreAt(x, z)`, signed
  metres, negative at sea; `beach.shore`, as a line); the shore's wall stands a step out past it. **the jetty**: the plank walk out over
  the crude from the beach, where the sloop moors. *Not:* the Weir's pier (the oasis's), or the span (a bridge).

## Creatures and folk

- **the Great Dunemaw** (the owner's name, R57; not "the Swallow"): the Well in Anagami's Dunes (`docs/plans/SLICE.md`, E1). Its **mouth** (`src/vfx/dunemaw.js`) is a
  spinning black pool of the Mind's labradorite in the sand; its floors are dressed from **the Great Dunemaw's kit** (`src/vfx/dunemawkit.js`:
  the bismuth wall, the glass floor over liquid Lachryma, the trim).
- **creature** (`game.creatures`, `src/creatures/creatures.js`): a hurtable thing with a mind (a slip jelly, a spirit). A weapon calls
  `creatures.strike`.
- **clapperjar** (code: `clapper`, `src/creatures/clappers.js`): the clapping pots, the folk's lowest tier (earthenware). The code's shorter
  word is accepted.
- **slip jelly** (`src/creatures/jelly/`), **spirit** (`src/creatures/spirits.js`: an ally, called up), **mirage** (a decoy).
- **mind** (code: `Brain`, `src/creatures/ai/`): what a creature thinks with: senses, memory, drives, a utility reasoner. See the homonyms below.
- **status** (`game.stun`, `creatures.status`): a condition on a creature (stun, halt, slow, sleep, calm, melt; and the four a damage type
  builds: **doubt** (Ego), **charm** (Influence), **blind** (Illusion), **confusion** (Delirium); Impact's is the stun). **build-up**
  (`creature.build[type]`): a type's meter toward its status. **annihilation**: Impact on a confused creature, or Delirium on a stunned one.
- **stimulus** (`game.ai.stimuli`): a sound, light or smell a creature can notice.
- **enrage** (`enraged(emo)`, `src/progress/combat/emo.js`): a creature past the top of its EmO band (from `EMO.enrage`); it shows in its
  body (the temper), never in text.
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
- **the domains** (six and one; `progress/domains.js` the data, `game.psyche` the EXP earned in play, `progress/psyche.js`): the seven skills of the Courier's psyche, mostly felt in the god hand: Ouranurgy, Manifestation,
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
- **crude** (`ECON.crude`): liquid Lachryma as a cargo, fossil feeling (`docs/LORE.md`, "Lachryma as crude"); graded by aspect,
  **wonder**, **mirth**, **desire**, **grief**, **dread**. Volatile, so it can **spill**; cubes cannot. *Not:* a bauble (the pool's drop).
- **commission** (`commissionPay`): a hunt for a Figment by class (Guppy to Leviathan), the island's own thoughts kept in proportion
  (Seger, the Witness Cone). **bounty** (`bountyPay`): a hunt for a named stray, an Egregore or a Figment gone aberrant, under the
  King's marque (Letty Marque). *Not:* the same thing.
- **the Great Dunemaw** (`game.well`, `src/world/well/dunemaw.js`; the owner's name): the Well in the Dunes, the slice's one Well. Its
  **mouth** is a dark turning pool ringed in stones out on the sand (a signature of kind `well`: the Dreamvane hears it); F there goes
  down. A Well has **floors** (three here), each laid out that **day** from `wellSeed` (`src/world/well/wellkit.js`); on every floor the
  **way up** (a pale pool: back out to the mouth with the haul) and, but on the last, the **way down** (a dark pool: deeper). A **run** is
  one trip down and back; shattered in it, the run's haul is lost. *Not:* the Weir's Well (the oasis's well of liquid Lachryma).
- **haul** (of a Well run): what the run found below, a material for each floor whose creatures are all down; it comes home only up
  the way up, with the run's pay (and a Cogitomap, if charted enough). *Not:* hauling (the livelihood of carrying goods across the Emocean).
- **FOE** (a Well's; Etrian Odyssey's word): the bigger creature that keeps a Well's last floor (for now a Great Slip Jelly, class 2). The
  run's pay counts the FOEs beaten (`wellPay`). *Not:* a creature's foe (whatever its mind is fighting: `c.foe`).
- **fill** (a Well's, 0..1): how much it has to give; each run draws on it and rest fills it again (`drawWell`), and what a run pays is
  scaled by it (`wellYield`). A Well at nothing is **dry**.
- **day** (`today()`, `DAY_MS`, `src/core/calendar.js`): one game day, an hour of real time on the wall clock (DESIGN.md section 17),
  what everything that drifts daily keys on (a Well's layout, an island's demand, a route's reckoning). *Not:* a calendar day, or a day
  of play. Always written **game day** (the owner, 2026-10-05: no bare "day" or "hour").
- **game hour**: a twenty-fourth of a game day, 150 seconds of real time (2.5 real minutes); what the weather's spells, a bed's growth and
  a Well's refill are counted in. *Not:* an hour of play.
- **real time** (**real second**, **real minute**, **real hour**): the wall clock, what rates "per hour of play" and cooldowns are
  counted in. A unit of time in a doc, commit or message always says which clock: **game** or **real**.
- **Cogitomap** (the item `cogitomap`): a map of one Well as it was when charted; since a Well changes over time, a Cogitomap is a ticket
  to a seeded run of it. Drawn on the way up when the run charted four fifths of the floors walked (the map's share of CHARTED ground,
  which a survey pulse gets and walking alone does not); it carries the Well, the seed, the day and its worth (`cogitomapWorth`).
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
- **chain** (of events; `chain.<what>` in the ledger, `chain()` among the arts' goals): the same event n times, each within a set time of
  the last (`chain.blink2`: a blink within 0.9 s of a blink); it counts once and starts over. `chain.max` is the psygun's hit chain.
- **tier** (of an achievement): Easy to Grandmaster, worth 1 to 6 **points**; **type**: count, speed, perfection, mechanic, stamina,
  collection (OSRS). The points buy a **standing** (Sweeper to Fool's Fortune); some achievements give a **title** (FFXIV).
- **the loops**: what the player wants at three scales: **the moment** (seconds), **the session** (an evening), **the long run** (weeks)
  (`docs/DESIGN.md`, section 1).
- **build**: one published version of the game (v45...). Progress resets on every new build; settings are kept.

## The god hand

- **the god hand** (~, `src/godhand/godhand.js`): the mode where the Courier becomes a jar and you become a hand.
- **the jar** (code name `jar`; events `jar.hit`, `jar.shatter`, `jar.reforge`): the Pneuka Jar, the Courier's true form and the Prince's
  magnum opus; in the god hand the Courier settles back into it (`docs/LORE.md`). The Courier, the god hand and the jar are one
  entity, the player (the owner, R43): player text says "your Pneuka Jar" ("Your Pneuka Jar breaks."), never "the jar". It has integrity, it shatters, it is reforged. *Not:*
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
- **the art bible** (`docs/ART.md`, Calissa's): what each colour, material and shape means and why, the glaze catalogue, and the placeholder
  audit (ours, placeholder, genre default).
- **damage look** (`damage.<type>` in the library): the colour and motif a damage type adds to a hit effect, so a blow's type reads
  with the HUD hidden. **aura** (`aura.<status>`, `src/vfx/auras.js`): a status shown round the creature that has it. **temper**
  (`game.temper`, `src/vfx/temper.js`): a creature's body showing its mental state and its EmO (never text).
- **sequence** (`game.cine`, `src/cine/`): a cinematic as data (the Opening, a chest's opening).
- **lane mark** (`lane.mark` in the library): Divination's mark on the Emocean's rail where a wave will come, up to 3 s ahead: a column
  of labradorite standing out of the crude, a whirl on the surface, rings on the beat of its approach (no words or numbers).
- **the crude sea** (`src/vfx/crudesea.js`): the Emocean's surface where the ships sail, liquid Lachryma: black, its swells real, its
  current scrolled, its film in bands. **calm**: the swells laid down for the stage's breather.
- **the spirit press**'s model (`SpiritPress`, `src/vfx/spiritpress.js`, after the owner's concept): a living shrine of root and leaf
  over a stone drum. The hopper is the crown's spiral mouth; the igniter is the platter's eye and the lever with its ball; the crucible
  is the hourglass in the pool. **the bath**: the pool on the drum, the soul colour as a liquid, turning, brighter when fired. **the hue
  ring**: seven lights circling the press, one per attribute at its hue; the one the soul colour is inside comes close and burns.
  **soul glow**: the vessel's skin lit from inside in the soul colour, as strong as it is saturated (none while grey).
- **the weather's look** (`game.weatherLook`, `src/vfx/weather.js`): how the emotional weather (`game.weather`, Dovina's) and the hour
  are drawn, each weather in its damage type's colour and motif: **streaks** (rain, or sand on the wanting wind) and **motes** (diamond
  dust, dust) wrapped round the eye in the world, never on the screen; the **halo** and **sun dogs** (wonder by day), the **aurora**
  (wonder by night), the **rainbow** (mirth), **far bolts** (dread: a bolt a long way off, held a beat and fading; never a flash). An **agate** sky's second feeling colours the sky, the
  clouds and what falls, and may raise its own mark; it never falls. Only
  an open place gets them. **the hour's grade** (`sky.grade`): the sky by the hour: the maker's dusk painting, the owner's day and night
  paintings blended in.
- **the maw wipe** (`game.mawWipe`, `src/vfx/mawwipe.js`): the seam into a Well covered by the Dunemaw's own pool, opening from the
  middle of the view until it fills it, turning while the floor is built, then widening its eye onto the floor. No words.
- **the Lantern Wisp** (`src/assets/lantern_wisp.glb`, the owner's): a creature, and the baseline rig and animation suite every enemy
  gets (34 joints; its eighteen clips: idle, five floats, cast, hit, death, five mood loops, three emotes, a dance). The mood loops are
  a feeling's basic ring, the emotes its onset; its flame carries the strength. *Not:* the hue ring's lights (the spirit press's).
- **the shore's look** (`game.shore`, `src/vfx/shore.js`): what is seen where the Dunes meet the Emocean (Petra's beach): the crude sea
  in the shore's sector, the **swash** (the crude coming up the sand and drawing back, its oil film bright at the lip, never foam) and
  the **wet sand** behind it. The island's weather ends at the waterline.
- **the liquid pack** (`src/assets/liquid_pack.webp`, baked by `scripts/bake_liquid.py` from `source_assets/liquid/`): the owner's
  noise photographs as one tileable texture (marbling, bubbles, sand ripples, veins) that every liquid is drawn with (`src/vfx/liquid.js`).
  **caustics**: the net of light on a pool's floor; **glints**: the water's sparkle where the sun catches it.
- **the markup window** (`BugMarkup`, `src/ui/bugmarkup.js`): the bug report's window over the frozen frame (F8, Petra's
  `src/debug/bugreport.js`): the frame at a whole-number scale, **marks** on a layer of their own (pen, arrow, ring, box; red or white;
  undo), a title, what happened, what should have, a kind and a severity. `/markup` previews it over the current frame.
- **the overture** (`src/music/overture.js`, Wanda's): the music the title opens with, "Fortune Favours the Fool". **the trailer**
  (`game.overture`, `src/cine/overture.js`): the in-engine cinematic cut to it, played on the title once a session (`/overture` plays it
  anywhere); its **board** (`docs/boards/OVERTURE.md`, as data in `src/cine/overture.board.js`) is its storyboard, a camera shot a line.
  A **still** (`src/ui/stills.js`): a frame of the trailer held as a sepia photograph on a stop-time hit (not a plate: nothing is taken).
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
- **seam** (`game.seam`, `src/render/seam.js`): a change of place made under a cover (dip to the dark, change, hold two drawn frames,
  come back); its look is a `kind` (a Well's: 'maw'). *Not:* a texture seam.
- **the save** (`game.save`, `src/core/save.js`): everything the game keeps in the browser. A **section** is what one system keeps (its id,
  scope, version; how to dump, load, reset, migrate and check it); a **scope** is one record written whole: **player** (progress that
  follows the Courier: the kit, the ledger, unlocks), **world** (progress of the place: the Wells, the shops, the ground) and **settings**
  (kept across builds). A **wipe** resets a scope (a new build wipes player and world; so does the Codex's RESET PROGRESS, and its
  EXPORT CODE is the whole save, `FFS2.`). An **adopted** key is one a module still writes
  itself, declared in the save so the wipe and the export know it. To **hold** the save is to borrow the game (the trailer): nothing is
  written, and on release every section is loaded again. *Not:* `save()` on a module (that now marks its section dirty).
- **the seed** (`?seed=N`, `game.seed`): the number the session's chance is drawn from; the same seed and the same input play the same.
  A **stream** (`stream(name)`, `src/core/rng.js`) is one module's own draw from it, so one system drawing more never shifts another.
  *Not:* a Well's `wellSeed` (the day's layout) or a run's seed (its floors).
- **the agent** (`game.agent`, `src/agent/agent.js`): the game as an AI player sees and drives it: `observe()` the state as data, `act()`
  an **intent** (goto, travel, face, use, interact, attack...) carried out through the same input the keyboard fills. *Not:* a creature's
  mind (a Brain, `docs/AI.md`).
- **playtest** (`npm run playtest -- <name>`, `scripts/playtest/`): a scenario an agent plays to its goals, with checks ("down the Well and
  back: the run pays, the haul comes home"). The stress test fuzzes; a playtest plays.
- **replay** (`game.replay`, `src/core/replay.js`; `/replay save`, `/replay load`, `/record`): a session kept so it plays again the same:
  a header (the build, the boot seed, the seed play began with, the save then, where the Courier stood) and the **frames**, each tick's
  dt and input. **exact** when it began at the start of play; begun by `/record` mid-session, the loose world comes back as it boots. A
  **deed** is a change made other than through the input (an agent's turn or travel), kept in the frames and done again on playback.
  The calendar (`core/calendar.js` `now()`, `today()`) is read through the replay too, so a replay watched tomorrow sees the day it was
  played; what pays while you are away reads `now()`, never `Date.now()`.
  *Not:* a chat command (`/replay` is one), a cinematic's playback (`cine/`).
- **the checklist** (an Artifact page kept by Dovina, `docs/plans/BUGREPORT.md`): the items the owner tries in a **test session** (the
  owner playing the build by hand), each with an id (`C12`), what to do and what should happen; the owner ticks pass, fail or skip,
  notes it and sends the round back. *Not:* a playtest (an agent's scenario), the stress test.
- **bug report** (F8, to be built: `docs/plans/BUGREPORT.md`): the frame frozen and marked up by the owner, a title, a kind and a
  severity, with the game's whole state attached by the machine (the save, the replay so far, the log, the last events, the F4 report);
  kept in the published build's store for every division to read. *Not:* the F4 report alone (one of its attachments).
- **the bridge** (`scripts/agent.mjs`): the game held open headless so a session plays it a call at a time from the shell (look, act, do,
  step). *Not:* the Weir's pier, or any bridge in the world (say the span).
- **the kit** (the `kit` section): the Pneuka Box and the belt, kept as one, so they can never disagree about where a tool is. *Not:* the
  Lockheart's kit (say its coffins and keys).

## Music (Wanda's: `src/music/`, `docs/OST.md`)

- **score** (`src/music/*.js`): a piece of music written as data (sections of bars of events). **track**: a score as the sound test lists it
  (`TRACKS`, `src/music/soundtest.js`). **cue**: the score a place or a moment calls for (`src/music/choose.js`).
- **the arranger** (`src/music/arranger.js`): what plays a score a bar ahead of the audio clock. **the band** (`src/music/band.js`): its instruments.
- **the overture** (`OVERTURE`, `src/music/overture.js`): the title's opening cue, a hair-metal JRPG opening that hands on, on the bar line,
  into the title theme (a score's `then`). *Not:* "the opening" (that is the Lockheart's ultimate, the Opening).
- **the Lockheart's cue** (`LOCK_CUES`, `src/music/lockheart.js`): the music under the Opening, one per mode, and its **landing**
  (`LOCK_LANDED`), the chord it cuts to when the wheel lands.
- **the ambience** (`game.ambience`, `src/audio/ambience.js`): what the weather and the game hour sound like where the Courier stands, a
  generative **sound bed** per weather (drops and gusts drawn as they fall); it hands the mood and the night to the music. *Not:* the
  Shrine Garden's **beds** (where a material is planted).
- **mood layer** (`moodLayer`, `src/music/mood.js`): the weather heard in the music, a few quiet notes over each bar of the place's cue
  (its own root, second and fifth); the night **thins** every cue instead (`MusicPlayer.setNight`). A cue the weather must not touch is
  `moodless`. **the scale** (`game.music.scale()`): the five notes to play along in (the Crucibelle's), the cue's own, or the
  weather's mode when nothing plays.
- **the rhythm mode** (`game.rhythm`, `src/music/rhythm/rhythm.js`): a track played as a rhythm game on keys 1 to 0, begun from a stage in a
  room. *Not:* the field Crucibelle's playing (improvisation, on the beat or not).
- **note chart** (`noteChart`, `src/music/rhythm/chart.js`): the notes the rhythm mode asks for, drawn from a score's lead; a **lane** is one
  of its ten keys (1 to 5 the low notes, 6 to 0 the high); the **backing** is the score with the charted notes taken out. *Not:* "chart"
  alone (that is the map's: see the homonyms).
- **grade** (`src/music/rhythm/judge.js`): how near a press came to its note: perfect, great, good, miss. **accuracy**: the share of the
  chart's notes earned. **combo** (the rhythm mode's): a run of notes without a miss (see the homonyms).

## The world (Espada's: `docs/LORE.md`, section 1)

- **the Emocean**: the collective unconscious, a sea (an atmosphere) of pure Lachryma outside every island.
- **an Island of Ego**: an island precipitated out of the Emocean where an identity is strong enough; its owner's Will holds it apart.
- **Anagami Island**: this Island of Ego, a 5 x 5 grid of chunks. **Kaolin Anagami** is the island, and the ego it is.
- **the Prince of Clay**: Kaolin Anagami's main avatar, the most powerful of the folk. "He".
- **Couriers**: the Pneuka Jar in humanoid form; every player is one. They go out across the Emocean and resist excess Lachryma best.
- **cogitohazard**: the umbrella word for Lachryma dangers in the environment and maliciously aligned Figments.
- **Figment**: a thought-construct hewn from an Island of Ego's own psyche. **Egregore**: a thought-form spawned from the Emocean,
  authored by no one. Neither is good or evil by nature.
- **you**: the Vessoul (the Courier section), in every form one being. Player text says "you", and "your Pneuka Jar" for the body.
- **commission** (a Figment hunt by class, given by **Seger, the Witness Cone**) and **bounty** (a hunt for a named stray, an Egregore or an aberrant Figment, given by **Letty Marque**,
  a Contractor of nacre from the King's island **Margarite**, and her Tulpa **Poll**): the island's own thoughts against no one's (`docs/LORE.md`, section 6).
- **Magnus Ibrahim Manus** (the King: pure Law; his island **Margarite**, a lighthouse on a cosmic whale) and **Entra Polearis** (the
  Queen: chaos, every feeling pegged high, its core desire (hunger is desire in excess); her island **Entropolis**, a blacklight metroplex of rave culture, flashy hedonism overground and twisted decay underground): two other Islands of Ego, and the
  Prince of Clay's parents. Margarite's lighthouse keeps the Leviathan-class Egregores at bay, and burns crude to do it.
- **Contractor**, **Tulpa**: one who survives the open Emocean is a Contractor with a Tulpa (a thought-form authored with care).
- **the Great Dunemaw**: the Well in Anagami's Dunes (the slice's Well). A Well, so it drifts. *Not:* the Weir's Well, which is a place.
- **the Purser**: the King's buyer at Margarite's dock (crude, materials, Cogitomaps), at a posted price, never haggled. The role is
  the name.
- **cask**: the unit of crude ("a cask of crude grief"); a sloop holds 8.

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
| chart | the map's (charting the ground, a Cogitomap); the rhythm mode's note chart | "chart" is the map's; "note chart" in full |
| combo | the club's chain of blows (the Soul Brush); the rhythm mode's run of notes | "the club's combo", "a rhythm combo" |
| Well | the Weir's well of liquid Lachryma (a place); a Well, a pocket of distortion (a dungeon, R40) | "the Weir's Well", "a Well" |

## Retired words

| retired | say instead | where it still is |
| --- | --- | --- |
| surfer, Solar Surfer | the skiff, Solar Skiffing | (gone: `sfx.skiffLoop` and the `skiff*` clips, R42) |
| Lab mode | the all-arts switch (code `lendAll`, `setLendAll`; its label, "ALL ARTS" for now, is Espada's) | `docs/DESIGN.md` |
| the lab (for the basement) | the basement (or the movement lab, the room) | (gone) |
| vessel (for the god hand's jar) | the jar | (`sfx.jarHit`, R42) |
| pause card | the pause menu | (gone) |
| course (for moving between rooms) | rooms (`game.rooms`, after the split) | `game.course` (`src/world/basement/basement.js`: the course and the room teleports in one class) |
| /lab (the workbench's command) | /workbench | (gone) |
| torture test / bot | the stress test | (gone) |
