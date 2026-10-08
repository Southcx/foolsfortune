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
- **the stones** (the kiln's STONES region, `Courier_Stones`; `src/progress/stones.js`, LORE.md "The stones"): where Lachryma enters the
  vessel, and so how the Courier takes it in: the pool's size, regen and costs, the magnet's **reach**, how **heady** a drink is (how far
  it pushes the Courier's mental state toward Prismatic), the **draught** it leaves, and where overflow goes. The Maker's Stones are the
  baseline; every other stone is a trade. One set at a time. *Not:* a stone in the world (say what it is), Strawman's or a cairn's.
- **draught** (`draughtOf`, `DRAUGHT`): the feeling of the Lachryma last drunk (the weather where it was drunk); a blow of that feeling's
  damage type builds its status faster; it fades over a real minute. *Not:* a drink of crude (a cask).
- **mental state**, the Courier's (`COURIER_MIND`; the creatures' own five states, `progress/combat/mind.js`, one word for both): pushed
  up by Lachryma drunk, settled by quiet; Prismatic is power and fragility, Stoic the reverse. The player reads "your mental state".
- **brimming** (Espada's word): the push of overflow, a vessel full past its brim (four times a drink's); the log says "You are
  brimming." and "You settle." *Not:* "drunk", which never appears in player text.

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
- **the crossing** (`progress/rail/crossing.js`, `docs/plans/RAIL.md`): a stage as it plays, 100 bars of the cue: its **acts** (launch,
  schools, pincer, darters, breather, the set piece, arrive), each held in a **view**, the camera's grammar: **chase** (Star Fox),
  **above** (Ikaruga), **side** (Einhander), **free** (Sin & Punishment), **astern** (looking back). A **swing** is the change of view:
  one bar, on a bar line, and nothing enters during it.
- **the rail** (`world/emocean/stage.js`, `game.emocean`): the crossing as it is sailed, a straight line in a zone of its own (`emocean`)
  at the dunes' layer. Everything that fights is kept in **the rail's frame** (x across, y up, z along) about the **rail point**, which
  the **stage clock** moves (the cue as heard, else its own). The **ship** (`courier/ship/ship.js`) is the sloop at the rail, in a
  **box** about the rail point; the view's **plane** says which two of its three numbers WASD moves (screen, sea, wall). *Not:* a
  rail you grind or a rope (the Courier's moves).
- **plain shot**, **outlined shot** (`courier/ship/shots.js`): a foe's shot at sea. A plain one has a feeling (absorbed if it is the
  ship's, else it hurts; the roll turns it); an outlined one wears the parry mark and only the parry answers it, home to its thrower.
- **the pier** (`world/emocean/pier.js`): F at a jetty's end opens it, the node map as a list (where the fuel reaches, or why not) and
  the two **mounts** to take; choosing an island boards and casts off. Each island has one (Anagami's jetty, Margarite's dock), and a
  crossing makes port at the pier of the island it sails to.
- **Margarite's dock** (`world/emocean/margarite.js`, zone `margarite`): the King's island's quay and pier on the crude, its lamp
  tower, the Pearl Shrine, the Purser and Letty Marque; the **posted board** beside the Purser is the price (F at it: the Purser's
  counter). *Not:* Margarite (the island, of which the dock is all that is built).
- **the flock** (`creatures/ai/flock.js`): many bodies moving as one (Reynolds' boids), the AI part the shoal is made of. *Not:* a
  school (a wave's role).
- **set piece** (`SET_PIECES`, `progress/rail/setpieces.js`): the crossing's second half, one of three: **the shoal** (a boid school of
  **glints**: its caller is **the Conductor**, the **bait ball** it rings the ship in, the **frenzy** of its strikes), **the Wreckers**
  (the pirates: Contractors under no letter; their brig **the False Light**: hull, rigging, gunports; **boarders** who take casks), and
  **Old Nobody** (the rogue Leviathan, an Egregore: rare, a deck; **driven off** or **felled**; then Letty's "WANTED: NOBODY"). The
  names are Espada's (`docs/LORE.md`, "The crossing's cast"). *Not:* an
  encounter (the Spirit Garden's: an achievement group mastered).
- **leg** (`LEG`, `legsOf`, `progress/econ/emocean.js`): one set piece of a long crossing; a crossing has one to three (the owner,
  2026-10-07), a **breather** between two whose flotsam **mends** the ship.
- **a continue** (`continueCost`, `voyage.continueRun`): the rail's arcade coin when the ship has borne all it can; priced by the way back
  to your last Shrine, doubling each time in one crossing; declined, the ship **breaks up** and you are made whole at that Shrine.
- **polarity** (Q on the rail): the ship's feeling, your draught or its opposite; a shot of the ship's feeling is **absorbed** (drunk:
  Lachryma to the pool) instead of hurting (Ikaruga).
- **the lock-on** (RMB held on the rail): the reticle paints up to eight targets; release fires a **lance** at each, together a
  **volley** (RayStorm). *Not:* the lock-on reticle on foot (the same word, the same idea: a target held).
- **mount** (`MOUNTS`, `progress/rail/mounts.js`): a worn tool carried on the ship, two chosen at the pier (the wake brush, the toll, the
  gulp, the plate, the hook, the vane); the psygun is always the gun. *Not:* a ship part (the ships have none).
- **par**, **rank**, **medal**, **the tally** (`progress/rail/score.js`): par is an expert's median score for a set piece (measured,
  `scripts/rail.mjs`); a crossing's rank is its score against par (S, A, B, C, D); the medal is Star Fox's (passed, four in five
  downed); the tally is the crossing's last line in the log.
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
- **the day's phases** (`phaseAt`, `lightAt`): night, dawn, daytime and dusk on the game clock (a game day is a real hour); at night
  Lachryma glows. *Not:* a game day (the calendar's unit).
- **friendly fire** (`src/progress/combat/friendly.js`): a blow on an ally (another player's Courier, a division's clay folk form): a fifth
  of its damage, and statuses that land once and then meet **tolerance** (each one of a kind from allies needs twice the build-up and
  holds half as long; the third in 20 s is shrugged off). *Not:* the spirits (allied creatures), whom the Courier's blows pass through.
- **the Spirit Garden** (`game.garden`, `src/progress/garden.js`; renamed from "the Shrine Garden" by the owner, 2026-10-06): the pocket
  dimension inside your Pneuka Jar, entered at a **Shrine**: the mastery dividend's **slots** (each worked by a **mastered** encounter:
  every achievement of its group done), the **beds** (a material planted grows more of its kind), and the upgrades (the long sink). The
  **Pneuka Box** is its shed: the one part of it reachable anywhere (P). *Not:* "Shrine Garden" (retired).
- **a Shrine** (`docs/plans/SHRINES.md`; in the lore a roadside hokora, kiln-sized: Espada): a place in the world where you **rest** (the pool full), which is **where you are made whole**
  after a shatter (the last one you rested at), a **fast-travel** point (to any Shrine you have found), and the door into the Spirit
  Garden. None in the Wells. *Not:* a save point: the game keeps everything as it happens (`game.save`); *not* the Wells' dead-end
  room of the same shape (`prefabs.js` `shrine`, a breath, which keeps its code name). The first four (Espada): the **Bisque Shrine**
  (the workshop), the **Lamp Shrine** (the Dunemaw's lip), the **Float Shrine** (Old Grog's pier), the **Pearl Shrine** (Margarite's dock).
- **the Wake Whistle** (`whistle.wake`, `ECON.escape`; Espada's name, `docs/plans/SHRINES.md`): a small clay whistle that takes you out of
  a Well alive, to its mouth, with the haul and three quarters of the run's pay (Pokemon's Escape Rope, Psychonauts' Smelling Salts). It
  breaks when blown; one carried at a time. *Not:* "escape item" (the placeholder) in what the player reads.
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
- **sibling** (`game.party`, `src/coop/sibling.js`): another Courier in your world with a mind of its own, one for each division (Petra,
  Dovina, Wanda, Calissa, Espada; docs/plans/COOP.md C6). The same body and rig as the Courier, driven by its mind's keys, so it moves
  as the Courier moves. Its division's session may steer it between its beats. *Not:* a spirit (an ally creature), nor a guest.
- **the party** (`game.party`, `src/coop/party.js`): the siblings called into your world (two at once; four players at most, guests
  included), and what you tell them (`/sib`: follow, hold, go, fight, back, warp: set down beside you at once). A sibling is **met** once where its craft lives
  (`src/coop/meeting.js`), then **called** or **dismissed** at any Shrine.
- **guest**: a person who joins your world over the published page's room (a co-op player). *Not:* a sibling.
- **asking a sibling** (`@name words` on the chat line, `src/coop/answer.js`): a question a sibling answers in seconds, in its division's
  voice (`src/coop/personas.js`), drafted by Claude through the page's `sample`; its **answer** is a line and, when asked, an order.
  *Not:* a letter, nor the division itself.
- **voice card** (`PERSONAS[id]`, `src/coop/personas.js`, Espada's): a sibling's voice written as form (sentence length, punctuation,
  the first word), a lexicon, what it notices, its moves, what it never says, and sample lines; composed into the brief a prompt carries.
  **drift** (`drift(line)`, `DRIFT`): the house voice's tells a line slides back to (an eager opener, the question said back, an offer
  to help, a hedge, a house word, a dash); banned for all five.
- **letter** (`/letter name words`, `src/coop/letters.js`): words the owner sends from the game to a division's own session, which
  answers in a few real minutes through the store (`siblings/<name>`, `re`). *Not:* an answer (seconds, Claude in the page).
- **the co-op meter** (`/usage`, `src/coop/usage.js`): what asking and letters spend of the owner's Claude usage over the last real hour,
  each stopped at a cap the owner sets (40 asks, 10 letters by default); a letter waits on one answer from each division at a time.
- **the pool** (`game.lachryma`, `src/courier/lachryma.js`): the Courier's store of Lachryma. It pays for shots, charges and arts, and it is the
  shield. "Lachryma" alone means the substance.

## Lachryma and money

- **Lachryma**: the substance of feeling and magic, condensed or liquid (`docs/LORE.md`, section 1: the Emocean is an atmosphere of it; cubes
  are it made solid). Always capitalised.
- **Lachrymite** (the owner, 2026-10-06): Lachryma in its solid form, whatever its shape: a cube is a coin of Lachrymite, a crystal is a
  formation of it, a crystal shard a piece of it. Always capitalised. *Not:* a new item or currency; "solid Lachryma" in prose is this.
- **bauble** (`game.baubles`): a gummy drop of Lachryma that refills the pool. Left lying, it oxidizes and sinks.
- **cube** (`game.cubes`, `src/world/treasure/cubes.js`): a Lachryma cube, the only currency. *Not:* a box in the level ("block").
- **crystal** (`src/world/dunes/crystals.js`): a Lachryma crystal formation in the Dunes, struck with the Dreamvane's pick and tuned by ear.
  What it gives: cubes, and sometimes a **crystal shard** (`mat.shard`, always so called) or a Possibilikey.
- **signature** (`src/core/signatures.js`): where Lachryma is, and how strongly. Tools that sense or drink Lachryma ask here.
- **faucet / drain**: where cubes come into the world / leave it. **A minute of play** is the economy's unit (`docs/ECONOMY.md`).
- **the aim** (`ECON.perMinute` × 60): what ordinary play should earn in an hour (480 cubes). A source is judged as a multiple of it
  ("× aim"); nothing but luck should pay more than 1.5×.
- **converter**: a thing that takes one resource and gives another (the Tithe: cubes into chances; condensing: cards into cubes). Machinations' word.
- **profile** (`PLAY`, `scripts/economy.mjs`): one way of spending an hour (the fighter, the miner, the photographer, the angler, the
  treasury camper), simulated against the table. A **mixed profile** is two played together.
- **sink**: a drain the player chooses and that never fills (the glazes, later the Spirit Garden). **The long sink** is the one meant
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
  Its moves (`src/tools/psygun/gunmoves.js`): the **pistol whip** (LMB with a creature or a clapperjar close in front: a blow, not a
  shot), **fanning the hammer** (R: six shots off the hip, paid for at once) and the **flourish** (the gun spun round a finger before it
  is put away after a fight). *Not:* the Dreamvane's twirl (its parry).
- **the Sondelass** (`src/tools/sondelass/`, `src/tools/sondelass/sondelass.js`): the blade with three **forms**: the **cutlass** (with **blade mode**,
  **zandatsu**, the **Stinger**, **guard**), the **rod** (angling: `src/tools/sondelass/angling/`), the **hook** (the grapnel; the **grapple** is what the
  Courier does on its line).
- **the Soul Brush** (`src/tools/soulbrush/`, `src/tools/soulbrush/soulbrush.js`): the **club** (combo, the **spin** after a pause, the **dive** at a
  sprint, the **slam**: the **air slam** let go in the air, the **ground slam** let go after landing), the **flick** of slip, **Celestial mode**
  (strokes drawn on the screen and read as **sigils**), and **inscriptions** (what a sigil writes onto a thing).
  **The load** (`tools/soulbrush/load.js`): the brush's mode, its saturation and the Lachryma it paints or mops; **the paint map**
  (`world/ground/paintmap.js`): the grid round the eye of where Lachryma lies on the ground (paint and stains), which the ground's
  shaders draw and the game asks; the **stains** themselves are kept in `world/ground/stains.js`.
- **the jet arts** (`courier/moves/jets.js`): three opt-in Movement Arts on the Soul Brush's load, after Sunshine's nozzles, off until
  switched on with the chat line's `/art`: **hover** (in the air, jumps spent, hold Space), **rocket** (crouched and still, hold Space),
  **skim** (run into water at a sprint, Shift held: run on the surface).
  Settled by the owner, 2026-10-06 (`src/progress/brushload.js`, `docs/plans/SUNSHINE-SYSTEMS.md`): the Soul Brush is the tool of
  **environmental** Lachryma (the Lockheart's is Lachryma drained from creatures). Two **modes**, picked with 1 and 2 while it is out
  (as the Sondelass's forms): **paint** (spray Lachryma out) and **mop** (drink environmental Lachryma in). **saturate**: hold LMB and
  the bristles fill for as long as the psygun takes to charge fully, then the brush sprays (paint) or drinks (mop); a press shorter than
  the psygun's tap window is the club, whatever is held. A **blot** (Espada's word: a stain and an inkblot; code ids `stain`, `STAINS`)
  is spilled crude on the ground (graded by its feeling, as a cask of crude is): left alone it grows a stage a game day, and a
  full-grown one gives up a **blotling** (an aberrant Figment by class). *Not:* "stain" in what the player reads.
- **a Lachrymato Bottle** (`BOTTLES`, `src/progress/brushload.js`; always so called, never "tank"): an aquarium-glass bottle of Lachryma
  worn against the Courier's upper back (its own place, not where tools are worn on the back), stoppered with an opaque topper; a
  reserve that feeds the pool below half and is what the paint mode spends and the mop mode fills. Glass: a broken shield can crack it,
  and what spills is a blot.
- **a ripple**, **a wake** (`game.water.disturb`, `courier/moves/env.js`; drawn by `vfx/water.js`): a ring spreading on a water
  surface where something touched it; the V behind something moving on it.
- **the Veritome** (`src/tools/veritome/`, `src/tools/veritome/veritome.js`): the book that is a camera. The **lens**; the **book bash** (LMB
  with the lens down: the book shut and swung, two blows on the combo engine); a **plate** is one photograph; its
  **memory** (a digital camera's: it holds 24 plates until they are appraised, never a consumable; there is no film since 2026-10-06);
  the **darkroom** (where plates are appraised); the **date stamp** (the Veritome's clock: the game day and game hour in the lens's corner
  and on every plate, the owner, 2026-10-06); the **Flash** (dazzles and stuns; a photograph never does); **reprogramming**
  (below). Its pages: **the Book** (the bank: things kept as **cards**), the **Compendium** (appraised entries), the **bestiary** (facts per
  creature), the **Major Arcana** (twenty-two designated cards).
- **reprogramming** (`src/tools/veritome/reprogram.js`, `src/tools/veritome/mind/`): rewriting a stunned creature's mind. A **macro** is a program, composed on a
  **lattice** of **Functions** on the Codex's **THE MIND** shelf, and spoken in **neuralese**.
- **the Dreamvane** (`src/tools/dreamvane/`, `src/tools/dreamvane/dreamvane.js`): **dowse** (the needle points at Lachryma), the **pick** (strikes
  crystals; the opener of its string, held for the heavy blow: `src/tools/dreamvane/pick.js`, with the **spin sweep**, the **vault** at a sprint and
  **the Dreamquake**, its special on R: the ground rung round them), the **fork** (a tuning fork, thrown), the **survey** (charts the ground around), **the vane** (the weather meter on the crook's head: it turns
  to the mood where you stand, the owner, 2026-10-06), and **reading the sky** (the dowse raised to the sky: the forecast).
- **the Crucibelle** (`src/tools/crucibelle/`, `src/tools/crucibelle/crucibelle.js`): five **notes**, the **toll**, the **toll string** (LMB
  pressed again in time: four tolls, the last brought down overhead and rung all round), **songs** (note patterns with effects),
  **fever**; the **mirage** (the Song of Seeming's decoy); the **metronome** (the beat shown on the bell itself: a swing, never a flash; the owner,
  2026-10-06).
- **the Lockheart** (`src/tools/lockheart/`, `src/tools/lockheart/lockheart.js`): a **coffin** on a chain; its **heart** (which kind of coffin); **hoover**
  (LMB held: draws Lachryma in) and **channel** (the ultimate's pose, the hands joined before the coffin); the **flail** (LMB tapped: the
  coffin swung on its chain let out, three blows on the combo engine); a **Possibilikey** (always so called, never "key" alone) on its ring;
  a Possibilikey's **uses** (the openings it has been turned in: brass is spent at the first, any other **breaks** with a chance that
  rises with them, `keyBreaks`, the rule Dovina's `ECON.lockheart.keyWear`); a used one keeps its uses wherever it goes and never stacks
  with fresh ones (*not* "worn": to wear is to put a tool on the belt);
  the **wheel** of odds; **the Opening** (its ultimate: `src/tools/lockheart/ultimate.js`).
- **ultimate**: the category, a tool's cinematic signature move.
- **the moveset** (`tools/moveset.js`, Calissa's; numbers `progress/combat/moves.js`, Dovina's): a tool's **string** (LMB, blow by blow),
  its **pause string** (LMB after a pause mid-string), its **charge** (LMB held), its **launcher** (S + LMB: the struck thing is
  `airborne`), its **air string** (LMB in the air, ending in a **plunge**), its **dash attack** (LMB while sprinting) and its **special**
  (a burst that costs Lachryma, unlocked by the tool's mastery). A string's last blow, its row's time spent and its strike past, may be
  cut short by a press into a new opener: the **recovery cut** (*not* a cancel: opposites cancel). A **bail** is being thrown off the
  Solar Skiff. *Not:* a combo (the
  club's chain, a rhythm combo). The Lockheart's is the Opening; no other tool has one yet.

## Moving

- **the core movement**: walk, sprint, slide, jump, wallrun, mantle, dash, and the moves any humanoid has (swim, ladders, hanging,
  poles, grates, balance, carrying, pushing). The gold standard: nothing changes it.
- **idle break** (`IDLE`, `src/courier/anim/idlebreak.js`): a fidget played over the idle after a still spell with nothing in hand (a look
  round, a stretch, a shift and tap, in turn); any move ends it. *Not:* an emote (asked for by the player).
- **hard landing** (`HARD`, `src/courier/anim/airborne.js`): how a landing from a fall past 9 m/s looks (a hand to the ground); only shown,
  control is back at once. *Not:* the roll (the Movement Art that takes a fall of 20 m and more).
- **kick-off**: a jump off something that holds the Courier facing it (a ladder, a ledge, a pole, the latch's wall, a grate wall), shown
  with the suite's wall jump. *Not:* the wall jump (the core's, off a wallrun).
- **tech** (code only: `Tech`, `src/courier/moves/techs.js`): anything that takes the Courier's body for a while: a movement tech, a tool's
  hold, a chest's opening, the kiln station, talking, the death, the Opening. In the game, a learned one is a **Movement Art**.
- **Movement Art** (`src/progress/skills.js`): a tech the System teaches; a **variant** is one of its versions.
- **the parry** (V; `courier/parry.js`, `docs/plans/PARRY.md`): the one button that answers a blow or a projectile in a short **window** at the
  press, in the way of the tool in hand (the owner, 2026-10-06): unarmed it is the **kick**, with the cutlass the **deflect** and then
  the **guard** (held). A **parryable** thing wears a Lachryma outline (Cuphead's pink); one
  without it cannot be parried. *Not:* the guard (the held block after the window).
  Each tool's answer (`courier/parries.js`, the table): the psygun's **stagger** (shot down, its thrower stunned), the Soul Brush's
  **bat** (returned, carrying the load's feeling) and **soak** (a Lachryma shot drunk into the Lachrymato Bottle), the Veritome's
  **shutter** (a blow winding up, stunned), the Dreamvane's **twirl** (turned aside; held after the window, it spins), the Crucibelle's
  **toll** (shattered within reach; wider on the beat), the Lockheart's **gulp** (a Lachryma shot swallowed into the pool). In code each
  is a `how`: `return`, `turn`, `soak`, `gulp`, `shatter`, `stagger`, `shutter`.
- **the kick** (the Movement Art `kick`, V with nothing in the hands; `src/courier/moves/kick.js`): the unarmed moveset on the combo
  engine (`tools/moveset.js`): V's string is the **jab**, the **cross**, the **haymaker** and the **roundhouse**; after a pause at the
  jab the **front kick** and the **shove**, at the cross the **leg sweep** (`sw`; its row in Dovina's table is `sweep`); S + V the
  **uppercut** (its launcher), V in the air the **ground pound**, V sprinting the **flying kick**. The first 0.26 s of every one is the
  parry. In the ledger `kick.hit` is a move that struck (with how many things it struck), `fist.hit` each blow. *Not:* the hook (the
  boxer's is the haymaker here: the hook is the Sondelass's); a sweep (Dovina's room test: the move is always the leg sweep).
- **windup** (code: `creatures.windup(c, ...)`, `c.windup`): a creature's telegraphed blow, listed while it can be answered; a parry in
  its window breaks it off (`creatures.parried`). *Not:* an attack's own phase name (the jelly's `'wind'`), which is the body's.
- **projectile** (code: an entry in `game.projectiles`): anything thrown that a parry can find: a rigid body (`{ body }`, a lobber's
  ball) or a plain one (`{ pos, vel }`, a jelly's glob); `parry: false` keeps it out of reach of every parry.
- **the skiff / Solar Skiffing** (`src/courier/skiff/`: the tech `Skiffing` in `skiff.js`, the boat `Skiff` in `boat.js`; code name `skiff`: the tech's id, `T.tech.skiff`, events `skiff.*`): the sand boat, and sailing it
  in the Dunes. *Retired:* "surfer".
- **stance** (`src/courier/anim/stances.js`): a held pose baked from clips (a tool's idle). *Not:* a form (the Sondelass's) or a mode (blade
  mode, Celestial mode).
- **emote** (`EMOTES`, `src/courier/emotes.js`; the tech `Emote`, `courier/moves/emote.js`; events `emote.start`, `emote.end`): the Courier's
  body language asked for on the chat line (/wave, /sit, /dance): a clip of the suite's social pack played **once**, a **loop** held until
  they move, or a **triple** (the suite's Enter, Loop and Exit: in, held, out). Each is in a **family** (greet, joy, anger, fear, sorrow,
  thought, pride, body, repose, dance, flirt, taunt), which is how `/emotes` lists them and what the folk feel at one; a **dance**, a
  **flirt** and a **taunt** are the emotes of those families. A **floor pose** (`floor`) is one held on the ground (sitting, kneeling,
  lying, the hover): its legs are the clip's. *Not:* a gesture (a held tool's own clip), nor a creature's emote clips (see the homonyms).

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
- **the crown** (the Great Slip Jelly's: `FOE.crown`, `src/progress/combat/dunemaw.js`): the broken urn on its head, cracked in three
  stages by Impact, the slam or its own ram into stone, then burst off; under it, **the core**, its weak point. *Not:* a chest's tier.
- **clutch** (`NURSERY`): a nest of slip jelly eggs in the slip, guarded, hatching **brood** (young jellies a third of the size), which
  the crowned FOE calls; broken, an egg may leave **slip roe** (a material). Clutches come back with the next game day's layout.
- **warped artifact** (`FINDS.warped`): the one find a floor in a warped pocket, worth three; taking it **shifts the floor**.
- **the Throwing Room** (a side room off the Workshop; `src/progress/combat/testroom.js`; Espada's name: a potter throws on the wheel, the Courier throws shots): where
  aim and recoil are measured, never earned: the Index, the **targets** (never "plates": a plate is a Veritome photograph), Strawman, the
  **spray wall** (clay that keeps every dent, so a recoil pattern is read from the wall) and the only pots that come back (they pay
  nothing). A **drill** is a run begun at the Index (Flick, Track, Spray, Recover); on a tuned game it is said and never recorded.
  Built in `src/world/testroom/`, through a door in the Workshop's east wall; the drills are measured from the **firing mark** (the ring on
  the floor, 10 m from the spray wall).
  *Not:* a trial (a minigame in its own room that pays), a playtest, the stress test.
- **Strawman** (the Workshop's test dummy: `STRAWMAN`): a creature that never falls and that the ledger never counts (`training`); a
  **bout** is its blows until 4 real seconds pass without one, said in the log in one line.
- **the Solar Skiffing trial** (at the sundial in the Dunes: `SOLAR`): rings charged by the sun; a ring in shade is dark and does not
  count; closed at night. *Not:* solar skiffing itself (the skiff's sport).

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
- **the great cavern** (`src/world/well/cavern.js`): the Great Dunemaw's last place, under its third floor's way down: **the bowl**
  (`src/world/well/bowl.js`, DUNEMAW-ARENA.md), where the crowned FOE broods. Its parts: **the ledge** (the way in, 6 m up; its two
  **slopes** are one way down), the **pillars** (six; a ram **cracks** one, a second **fells** it as a **log**, a third leaves **rubble**),
  the **stalactites** (eight, overhead; fallen, one lies on the floor as a ram target used once), the **slip pools** (W0 at the centre, W1
  to W4 round it), the **rim shallows** (slow to wade) and **the upper ring** (a gallery in the south wall). Its way up, the pale pool,
  forms only when the fight ends. *Not:* the Well's mouth (out on the sand).
- **the ram**, **the slam**, **the reel**, **the slide** (the Great Slip Jelly's: `src/creatures/jelly/greatjelly.js`): its charge after
  a one-second scrape, aimed as the scrape begins (stone it hits cracks its own crown); its slam close in; the four seconds it reels
  when the crown bursts (every blow three times over); and, crown off, the sand sliding toward the pool it is in. It **sinks** into a
  pool and **surfaces** from another. *Not:* the Courier's slam (the Soul Brush's and the move's: the slam that cracks the crown).
- **the ground's drift**, **wade** (`player.drift`, `player.wade`): a place's pull on the Courier's feet (sand sliding, carried as a
  platform's move) and its drag on a walk (shallows), set by the place and put back when the Courier leaves it; the core movement is
  untouched when they are zero and one.
- **the Lip Stone**, **cast**, **wipe** (`docs/plans/DUNEMAW-EXTREME.md`; `world/well/raid.js`, `creatures/ai/timeline.js`): the Great Slip Jelly's fight is a scripted **timeline**
  of named **casts** (its **tankbuster**, **raidwide**, **adds**, **enrage**), in the style of an FFXIV extreme trial; one difficulty
  (the owner). The Lip Stone on the bowl's ledge is the fight's start: a **wipe** (a shatter in the fight) costs the attempt, not the
  run. **The pull** is the moment it wakes (the timeline's nought). **Sodden** (Espada's: Brine Soaked) doubles the next blow; the
  **sherds** are its four calves. *Not:* a Shrine; *not* "Extreme" as a mode (there is none).
- **Inner Realm** (`docs/plans/SPIRIT-GARDEN.md`; `game.realm`, `src/world/garden/`): a player's own Spirit Garden by the name they give it (Espada offers
  names in her conlang). In the garden you are **the Pneuka Jar**, hopping round its **planetoids**, and **the god hand** over them
  (sculpting, placing, tending, binding). Its spirits are **bound** until you **release** them. A **Firing** (the owner,
  2026-10-07) is a tier of cultivation, read from the attributes' ranks and crossed by the **tribulation** (the first Firing, the
  second, and on: no ceiling; Espada's names for the first six: Candling, Sinter, Lustre, Salt, Reduction, Anagama; the tribulation is
  **the Heavenly Kiln**). A Figment is **caught** by the Lockheart (its summoning coffin, the catch wheel) or by the god hand in
  battle (held over the Jar's mouth through its **struggle**), and then bound. *Not:* caught by the Veritome (it reprograms).
  The bound wait in the Jar (`game.bound`, `src/creatures/bound.js`) until the garden opens; the hand's catch is `src/godhand/catch.js`.
  **The planetoids** (Espada's names, `src/npc/realmnames.js` `PLANETOIDS`): **the Dantian** (the heart: the way in, the lake, the
  shed), **the Herb Terraces** (the beds), **the Athanor** (the furnace: the press and the firing), **the Pavilions of Echoes** (the
  slots), **the Mulberry Grove** (the spirits and the cocoon tree), **the Chimney** (the peak of the Heavenly Kiln); bought later, the
  Moonflower Moon, the Koi Pond, the Drill Yard, the Bone Bed. A realm's offered name is two neuralese words (`name(seed)`, `gloss`).
  Entered at a Shrine (`realm.enter`): six planetoids over the world's north (`place.js`, zone `garden`), each a sphere with gravity to
  its heart; a **planetoid body** (`planetbody.js`, Galaxy's gravity) is what stands and hops on one, the Jar's and each spirit's. A
  **launch lotus** flies the Jar to a neighbour in two real seconds. *Not:* "hopper" (the press's mouth), "island" (the bowl's rubble).
- **the ground's materials** (`GROUND`, `src/progress/realm.js`; SPIRIT-GARDEN.md section 7): what the god hand paints a planetoid's
  ground with, one a phase: **moss** (wood, wonder), **ash** (fire, mirth), **loam** (earth, desire), **slate** (metal, grief), **silt**
  (water, dread). Free; a feature counts its ground in its formation. *Not:* a material (Soul Alchemy's, pressed), the formation
  **stone** (a feature), or clay (the Courier's body; `world/garden/clay.js` is the planetoids' sculpted surface).
- **the garden's views** (`realm.camera`, `src/world/garden/gardencam.js`): **behind** the Jar (as it opens), **first person** (Z, the
  same setting as the world's), **overhead** (`: the god hand's view in the garden, straight down; W A S D moves the view, not the Jar).
  *Not:* the god hand's isometric view (the world's, `godhand/godhand.js`), which the garden never uses.
- **terraforming** (the hand's strokes on the clay, `src/world/garden/clay.js`): pull, press, smooth, **flatten** (to the height where
  the stroke began), carve, **roughen**; a stroke's **size** (Shift and the wheel); **undo** (Ctrl+Z, ten strokes).
- **the garden's water** (`src/world/garden/water.js`, `waterworks.js`; drawn by a stand-in, `watermesh.js`): Lachryma running on a
  planetoid, a shallow-water simulation on its clay's grid that pools, spills, dries and **wears the ground** (erosion); each cell keeps
  its mix of the five feelings. A **spring** pours for good, a **drain** takes for good (the hand's WATER art sets both). A body in it
  **wades**, or **floats** when it is deeper than the body (`swim`). *Not:* the Dantian's lake (a look), the world's water (`game.water`).
- **a track** (the garden's: `src/world/garden/races.js`): a groove the hand carved in one stroke that closes on itself, 40 m or more;
  the spirits on its planetoid **race** a lap on it (Dovina's `RACE`). *Not:* a music track (the sound test's), the course.
- **the ring** (`ORBIT`, `src/world/garden/orbit.js`): the ten slots round the Dantian where a **bought planetoid** is set (the
  Moonflower Moon, the Koi Pond, the Drill Yard, the Bone Bed, in turn); bought at the shed, its **seed** is carried by the god hand
  into the open sky and let go there. *Not:* the hue ring (the spirit press's), the upper ring (the bowl's gallery).
- **a cascade** (`src/world/garden/cascades.js`): water deep in a basin facing a linked planetoid spilling over to it. *Not:* a
  sandfall (the Great Dunemaw's).
- **the plants** (the garden's: `src/world/garden/plants.js`): green that spreads cell by cell over wet moss, loam and silt, and wilts
  elsewhere; seeded by a herb terrace and by moss painted. *Not:* a material planted in a bed (the beds grow materials).
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
- **the hand's clips** (`GodHandClips`, `HAND_MOVES`, `src/godhand/godhandclips.js`; the owner's `courier_godhand.blend`): the god hand's own
  32 actions played on its own mixer, which own every bone (nothing writes the fingers after them but `GODHAND_ROM`). A clip keeps the
  owner's name: spawn, idle, spiritFingers, grab, grabHold, release, pinch, pull, point, poke, flick, pat, slam, chop, punch, slap,
  backhand, block, scoop, beckon, shoo, wave, snap, crush, fistClench, count, fingerGun, thumbsUp, thumbsDown, okSign, peace, vanish.
  Where a name is another thing's too, it is qualified: **the hand's grab** (*not* `god.grab`, a thing held, nor GRAB, the garden's
  art), **the hand's pull** (*not* PULL, the stroke it plays under), **the hand's slam** (*not* the Soul Brush's slam nor the Great Slip
  Jelly's), **the hand's flick** (*not* the Soul Brush's flick of slip; it plays when a spirit is flicked), **the hand's point**, **the hand's release** (*not* a bound spirit's release, `spirit.release`).
  A **contact** (`HAND_CONTACTS`) is the frame a blow lands. *Not:* an emote (the Courier's), nor a gesture (a held tool's).
- **the Jar's clips** (`PneukaJarClips`, `JAR_MOVES`, `src/godhand/pneukajarclips.js`; the owner's `courier_pneuka.blend`): the Pneuka Jar's
  own 17 actions on its own mixer: idle, summon, dismiss, hop, land, open, close, gulp, spit, startled, shake, happy, sad, curious,
  rummage, sleep, wake. They own its squash and its scale (on its `root` bone); nothing else scales it. **The Jar's hop** and **the Jar's
  land** are the garden's hop and landing as clips (*not* a hop of the Emocean); **the Jar's gulp** is the clip of a Figment swallowed
  (*not* the Lockheart's gulp, the parry, nor the gulp mount); **the Jar's wake** is the clip of waking from sleep (*not* a wake on water, nor the Wake Whistle). Its cracks are skinned to it and ride the clips (`vfx/crackskin.js`).
- **a rig's clips** (`RigClips`, `src/courier/anim/rigclips.js`): what the two above are built on: a small rig's own actions on its own
  mixer, by named **moves**, each a loop, a once (going on to its `then`), or held (played **in** to a **hold** rocked back and forth,
  then **out**). *Not:* the Courier's clips (the suite, `courier/anim/animator.js`).
- **the Vessoul's paintings** (`src/vfx/vessoulpaint.js`): the owner's textures on the god hand and the Pneuka Jar, as the Courier's
  painted material (the painting as its colour and a share of its glow). The Jar's five gems are not painted: they are its core's light.

## Windows

- **the pause menu** (Esc): the help pages and the controls. *Retired:* "pause card".
- **the Pneuka Box** (P, `src/pneuka/`): the inventory (56 slots) and what is worn. With the Veritome out, **the bank** (the Book) opens
  beside it. *Not:* the Veritome; the Veritome is the bank, not the inventory.
- **the map** (M): called **Mind Mapping** in the game (`src/feedback/cartography.js`).
- **the tuning panel** (Tab, `src/debug/tuning.js`): live sliders and actions (set the room again, last checkpoint, the hub), laid out as
  Settings, Feel, Combat, World, Look and Sound, with a find box. A **setting** is the player's own preference (sensitivity, resolution,
  volume, how a charge fires: `SETTINGS` in `src/debug/tuned.js`); a **knob** is any other number there. A knob away from its default is
  **tuned**: marked on the panel, listed under Tuned with a reset, said in the log at the start of play (`tuning.tuned`), shown at the
  top of QAIS's Brief and carried on every report, so a tuned game is never mistaken for a bug. *Not:* a setting (never a warning).
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
- **the ripple tank** (`src/vfx/ripples.js`): the rings on water: a height field round the eye stepped by the wave equation, that every
  disturbance of a water surface (`game.water.disturb`) dents; the water's shader reads its slopes. **The wake** is its rings' V behind
  a swimmer. **The crown** (`src/vfx/waterfx.js`): a dive's splash, a rim of drops flung up and out round a column. **Drips**: the
  Courier dripping for a few real seconds after leaving the water.
- **the night alive** (`game.nightSky`, `src/vfx/nightsky.js`; drawn in the dome, `src/vfx/sky.js`): what the night sky does: our own
  **stars** on **the wheel** (turning about their pole once a game day, twinkling slowly), now and then a **meteor**, and at the Shore
  **the Shore's aurora**: curtains low over the sea by night. *Not:* the weather's aurora (wonder by night, over the whole sky).
- **the overhead map** (`src/vfx/overhead.js`): what stands over each spot round the eye (a roof, the ground), measured by rays from
  high above; what falls from the sky is never drawn under it.
- **the weather's look** (`game.weatherLook`, `src/vfx/weather.js`): how the emotional weather (`game.weather`, Dovina's) and the hour
  are drawn, each weather in its damage type's colour and motif: **streaks** (rain, or sand on the wanting wind) and **motes** (diamond
  dust, dust) wrapped round the eye in the world, never on the screen; the **halo** and **sun dogs** (wonder by day), the **aurora**
  (wonder by night), the **rainbow** (mirth), **far bolts** (dread: a bolt a long way off, held a beat and fading; never a flash). An **agate** sky's second feeling colours the sky, the
  clouds and what falls, and may raise its own mark; it never falls. Only
  an open place gets them. **the hour's grade** (`sky.grade`): the sky by the hour: the maker's dusk painting, the owner's day and night
  paintings blended in.
- **the glitch** (`game.glitch`, `src/vfx/glitch.js`): the data showing through at a big moment (a FOE showing itself, an ultimate, a
  shattering, a reprogramming): one screen pass in the glow (`post.screen`) that splits the colour, tears bands of rows, moshes blocks
  of the frame before, crushes colour to the code's cyan and magenta, drains toward a point, or cuts to a dark beat (**the drop-out**).
  Always set off by an event and short; the setting `visual.glitch` turns it off. *Not:* a bug's flicker (CLAUDE.md, aliasing crawl).
- **the data drain** (`game.dataDrain`, `src/vfx/datadrain.js`): a creature's data pulled out of it on a reprogramming, after .hack's:
  the **bracelet** of petals at the Courier's hand, the beam, the creature broken into polygons streaming in. It rewrites; it does
  not kill.
- **the spout** (`DunemawSpout`, `src/vfx/dunemaw.js`): a column of sand pouring up and a **sandfall** spilling back round it; once
  the Great Dunemaw's landmark (withdrawn: the owner, 2026-10-06, the mouth is an antlion pit), now the look of a slip geyser.
- **a sandfall** (the Great Dunemaw, `docs/plans/DUNEMAW.md`): a curtain of sand pouring from above; in the floors, a side passage's
  shifting door (open, then falling, on the sim clock; never closing on the Courier). Also the spout's falling skirt.
- **a lane** (`src/world/well/wellsand.js`): in a room of the Great Dunemaw, the band of flat sand from each doorway and pool to the
  room's middle (1.6 m to each side, the dunes and drifts beside it): the way through a room is level ground. *Not:* a path (the
  floor's guaranteed route of rooms, `layout.path`).
- **a room's design** (`src/world/well/prefabs.js`): one of the Great Dunemaw's designed rooms (a prefab): the processional, the
  narrows, the stones, the cloister, the crossing, the gallery, the shrine, the pylon gate, the vestibule; and three halls: the
  hypostyle, the amphitheatre, the ruin. Drawn once for a shape of doorways and turned to fit; paced along the path (a way through,
  a fight, a breath). *Not:* a template (the word retired with the four R45 ones).
- **the socket** (`src/world/well/prefabs.js`): what every room's design keeps clear so any two chain: a lane from each doorway to
  the room's middle (nothing within 2.2 m of its line) and the middle (2.5 m round). `npm run contracts` checks it.
- **an arch** (`src/world/well/wellkit.js`): a doorway of the Great Dunemaw's floors, round-headed (4 m wide, its crown 5 m up), its
  ring and pilasters standing proud of both faces of the wall.
- **a skirt**: what blends a thing into the ground where the two meet, so no hard line shows (the owner, R46: "meshes that interact
  with the ground need mesh skirts"). Two kinds: the level's, a strip hung a metre down the edge of a room's sand, drawn only, so no
  crack shows where two rooms' sand meet (`src/world/well/wellkit.js`, the terrain trick); and a model's, its **foot** band taking the
  ground's own texture, fading up (`foot` in `src/render/triplanar.js`). *Not:* the spout's falling skirt (a sandfall).
- **triplanar** (`src/render/triplanar.js`): a texture laid on a surface from the world, along the three axes, blended by which way
  the surface faces; no UVs. In 'detail' mode the texture brings only its light and shade, the colour stays the material's. The
  textures are **the surfaces** (Calissa's six CC0 sets, `src/assets/textures/`: sand, sand_packed, rock, clay_floor, plaster,
  stone_flags). *Not:* the level's dressing (`vfx/surfaces.js`: box mapping of procedural patterns by colour).
- **rock** (`src/world/well/rock.js`): the Great Dunemaw's walls and pillars drawn rough over their box colliders, a noise field
  pushing the skin up to 0.3 m sideways.
- **a drift tide** (`docs/plans/DUNEMAW.md`, phase 2): a sand slope in the Great Dunemaw rising and falling on the sim clock.
- **the twist** (`docs/plans/DUNEMAW.md`): the Great Dunemaw's rooms turned about the floor's centre, more the deeper (0, 7, 14
  degrees a cell on floors 1 to 3).
- **the flythrough** (`docs/plans/DUNEMAW.md`): the preview of a floor on arrival, the camera sweeping its path with the frame
  accumulation on; any key skips it.
- **Strawman** (`src/vfx/strawman.js`; `docs/plans/STRAWMAN.md`; the owner's character and name): the Workshop's test dummy, a
  stitched sack doll on a post with a weighted ball foot; infinitely durable. Named with no article ("Strawman rocks back up").
- **the Pithos** (Espada's name, a proposal; the log's "the Great Slip Jelly"): the Great Dunemaw's FOE, a Great Slip Jelly wearing
  the broken urn it grew in as a crown (**the urn crown**, `src/vfx/urncrown.js`); breaking the crown bares **the core**, its weak point.
- **the Gnomon** (Espada's; `world/dunes/solar.js`): the pale spire in the Dunes, the sundial's shadow-stick; the Solar Skiffing trial
  is begun at its foot.
- **a slip geyser** (`world/dunes/geysers.js`, `vfx/slipgeyser.js`): a column of sand and slip erupting from the Dunes on a cycle; it launches the Courier.
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
- **the markup window** (`BugMarkup`, `src/ui/bugmarkup.js`): the bug report's window over the frozen frame (F8: QAIS's Reports
  tab, `src/debug/qais/report.js`): the frame at a whole-number scale, **marks** on a layer of their own (pen, arrow, ring, box; red or white;
  undo), a title, what happened, what should have, a kind and a severity.
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
  cycle of work (R42...). **the gate**: Petra's review of every push to main (`docs/ARCHITECTURE.md`). **`npm run gate`**: the gate's machine steps in one command, with one report
  (`gate-report.txt`). **the contracts** (`npm run contracts`, `scripts/contracts.mjs`): what one division's service offers another, checked
  in the running game (names and shapes). **the lanes**: which division owns which files (CLAUDE.md, "Threads"); the gate lists a branch's
  changes outside its lane. **the handover**: what a division gives Petra with a branch (docs/ARCHITECTURE.md). **a handoff**: a note from
  one division to another, one file in `docs/handoffs/<reader>/` (docs/HANDOFFS.md).
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
- **a sweep** (`scripts/sweeps/<room>.mjs` on `harness.mjs`; all: `node scripts/sweeps/run.mjs`, the dev server up; Dovina's): one
  room entered, worked and left headless as a person would and as a careless one would, a screenshot at every step and a PASS/FAIL line
  a check; a defect once seen stays checked. **The garden sweep** (`garden.mjs`) was the first (`docs/plans/GARDEN-SWEEP.md`); the
  others are named for their room (`workshop`, `basement`, `dunes`, `dunemaw`, `emocean`, `tools`). *Not:* the stress test (it fuzzes
  the whole game), a playtest (it plays to a goal), the Soul Brush's mop, the kick's leg sweep, melee.js's `sweep` (what a swing struck).
- **replay** (`game.replay`, `src/core/replay.js`; `/replay save`, `/replay load`, `/record`): a session kept so it plays again the same:
  a header (the build, the boot seed, the seed play began with, the save then, where the Courier stood) and the **frames**, each tick's
  dt and input. **exact** when it began at the start of play; begun by `/record` mid-session, the loose world comes back as it boots. A
  **deed** is a change made other than through the input (an agent's turn or travel), kept in the frames and done again on playback.
  The calendar (`core/calendar.js` `now()`, `today()`) is read through the replay too, so a replay watched tomorrow sees the day it was
  played; what pays while you are away reads `now()`, never `Date.now()`.
  *Not:* a chat command (`/replay` is one), a cinematic's playback (`cine/`).
- **the casebook** (`docs/CASEBOOK.md`): every bug fixed, with its cause and the rule it left; read its rules before building in the same
  area. *Not:* the log (the game's text), a report (QAIS's, the owner's), the ledger (the stats).
- **QAIS** (F8, `game.qais`, `src/debug/qais/`: `docs/plans/QAIS.md`; Quality Assurance Interface System, spelled out here only, never elsewhere: *not*
  the System, the game's voice): the development window in the game where the owner tests a build: its **Brief**, its **QAIS tests**,
  its **reports** and the open **questions**, kept in the published build's store. Always "QAIS". *Not:* the F3 panel, the stress test.
  **the round** (`meta/round` in the build's store: `{ build: 'v77', buildId, sent, sentAt }`): the build under test, written by Petra at
  publish with its Brief; the tests and the reports name it (`build`, `round`). **Send to the brigade**: the round marked sent and
  Dovina's session woken through the owner's Claude Code Remote connector. **a report's number** (`bugs/R<n>`, "Report 12"). **the
  stand line** (`/goto x y z yaw`): where the owner stood, pasted into the chat to stand there again (`/goto <place>` too).
- **QAIS test** (`tests/T<n>` in the build's store): one thing for the owner to try in a **test session** (the owner playing the build
  by hand): what to do, what should happen, its build, pass, fail or skip and a note; it may watch for its **evidence** (an event) and
  offer **take me there** (a place). Always "QAIS test" in full. *Not:* a playtest (an agent's scenario), the stress test, an item (the
  Pneuka Box's), a trial (a minigame).
- **the Brief** (QAIS's first tab): one build's changelog, a few plain lines per division and what each waits on from the owner.
- **the checklist** (retired 2026-10-05, the page deleted): the QAIS tests' first home (`C12`); say "QAIS tests".
- **bug report** (QAIS's Reports tab: `docs/plans/BUGREPORT.md`): the frame taken when F8 is pressed and marked up by the owner, a
  title, a kind and a severity, with the game's whole state attached by the machine (the save, the replay so far, the log, the last
  events, the F4 report); kept in the published build's store for every division to read. *Not:* the F4 report alone (one of its
  attachments).
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
  Spirit Garden's **beds** (where a material is planted).
- **mood layer** (`moodLayer`, `src/music/mood.js`): the weather heard in the music, a few quiet notes over each bar of the place's cue
  (its own root, second and fifth); the night **thins** every cue instead (`MusicPlayer.setNight`). A cue the weather must not touch is
  `moodless`. **the scale** (`game.music.scale()`): the five notes to play along in (the Crucibelle's), the cue's own, or the
  weather's mode when nothing plays.
- **a busker's mat** (`src/world/busk.js`): where the rhythm mode is begun in the world, one on each pier (Old Grog's at the Weir,
  Margarite's dock): F on it with the Crucibelle worn plays a song for tips; walking off the pier ends it. **busking**: playing there.
  **the busking body** (`src/courier/moves/rhythmhold.js`): the Courier playing it, the Crucibelle kept in hand: a **gesture** on each judged
  press (the lane's note), the **jam** (a groove of the whole body) while a rhythm combo runs at ten or more, the fever's peak at every
  twenty-fifth note.
- **gesture** (`Gestures`, `src/tools/toolbody.js`): a held tool's own clip that is not a blow (a note's, the Flash's, the coffin opened),
  played once over its stance. *Not:* a shot (a psygun's) nor a move (a blow of the combo engine).
- **the rhythm mode** (`game.rhythm`, `src/music/rhythm/rhythm.js`): a track played as a rhythm game on keys 1 to 0, begun from a stage in a
  room. *Not:* the field Crucibelle's playing (improvisation, on the beat or not).
- **note chart** (`noteChart`, `src/music/rhythm/chart.js`): the notes the rhythm mode asks for, drawn from a score's lead; a **lane** is one
  of its ten keys (1 to 5 the low notes, 6 to 0 the high); the **backing** is the score with the charted notes taken out. *Not:* "chart"
  alone (that is the map's: see the homonyms).
- **grade** (`src/music/rhythm/judge.js`): how near a press came to its note: perfect, great, good, miss. **accuracy**: the share of the
  chart's notes earned. **combo** (the rhythm mode's): a run of notes without a miss (see the homonyms).
- **rating** (`src/ui/rating.js`): the maker's word that pops over the rhythm mode's line on each judged press, from its grade, how near
  it came and the combo, worst to best: Miss!, OK..., Nice!, Great!, Excellent, Awesome, Perfect, Wow. **The set's rating**: one of the
  same words for a whole song played through, from its accuracy, said in the log at its end. *Not:* a grade (the judge's four).

## The world (Espada's: `docs/LORE.md`, section 1)

- **the Emocean**: the collective unconscious, a sea (an atmosphere) of pure Lachryma outside every island.
- **an Island of Ego**: an island precipitated out of the Emocean where an identity is strong enough; its owner's Will holds it apart.
- **Anagami Island**: this Island of Ego, a 5 x 5 grid of chunks. **Kaolin Anagami** is the island, and the ego it is.
- **the Prince of Clay**: Kaolin Anagami's main avatar, the most powerful of the folk. "He".
- **Couriers**: the Pneuka Jar in humanoid form; every player is one.
- **sibling** (`docs/plans/COOP.md`): one of the five divisions as a Courier in the owner's world (Dovina, Petra, Calissa, Wanda, Espada),
  with a mind, a temperament and a tool of its own; met once, then called or dismissed at a Shrine; steered by its division's session
  through the game's db. A **guest** is another person playing; the **party** is at most four. You **ask** a sibling (seconds) or send its division a **letter** (minutes). *Not:* a spirit (a bound Figment). They go out across the Emocean and resist excess Lachryma best.
- **cogitohazard**: the umbrella word for Lachryma dangers in the environment and maliciously aligned Figments.
- **Figment**: a thought-construct hewn from an Island of Ego's own psyche. **Egregore**: a thought-form spawned from the Emocean,
  authored by no one. Neither is good or evil by nature.
- **commission** (a Figment hunt by class, given by **Seger, the Witness Cone**) and **bounty** (a hunt for a named stray, an Egregore or an aberrant Figment, given by **Letty Marque**,
  a Contractor of nacre from the King's island **Margarite**, and her Tulpa **Poll**): the island's own thoughts against no one's (`docs/LORE.md`, section 6).
- **Magnus Ibrahim Manus** (the King; his island **Margarite**) and **Entra Polearis** (the Queen; her island **Entropolis**): two other
  Islands of Ego, and the Prince of Clay's parents (`docs/LORE.md` has the rest).
- **Contractor**, **Tulpa**: one who survives the open Emocean is a Contractor with a Tulpa (a thought-form authored with care).
- **the Great Dunemaw**: the Well in Anagami's Dunes (the slice's Well). A Well, so it drifts. *Not:* the Weir's Well, which is a place.
- **blot** *(Espada's proposal for the player's word for a stain of spilled crude)* and **blotling** (the aberrant Figment a full-grown blot
  gives up): pending Dovina's rename; until then the glossary's "stain" holds.
- **the Purser**: the King's buyer at Margarite's dock (crude, materials, Cogitomaps), at a posted price, never haggled. The role is
  the name.
- **cask**: the unit of crude ("a cask of crude grief"); a sloop holds 8.
- **the Pithos**: what the folk call the Great Slip Jelly, crowned with the broken crude jar it grew in (a *pithos*, Pandora's jar). The
  log says "the Great Slip Jelly".
- **the Gnomon**: the pale spire in the Dunes (`dunes.js`, the spire), a sundial's shadow-stick for the whole Dunes; it still keeps game
  hours. The Solar Skiffing trial races its shadow.
- **Strawman**: the Workshop's test dummy, stitched by Pip; it cannot shatter and always stands back up. A name, so no article.
- **aqua regia**: Margarite's refined lamp fuel, made from the crude the King buys; it dissolves gold.
- **amethyst**: a charm sold in Entropolis's overground that keeps a clear head (slows excess Lachryma).
- **moonflower**: a Spirit Garden bed that opens only at night, by the game hour.

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
| rank | an attribute's step (Soul Alchemy); a crossing's letter (S to D, the rail) | "an attribute's rank", "the crossing's rank" |
| chain | a run of one event (the ledger's `chain.<what>`); three downs of one feeling on the rail (Ikaruga's) | "a chain of ...", "a feeling chain" |
| combo | the club's chain of blows (the Soul Brush); the rhythm mode's run of notes | "the club's combo", "a rhythm combo" |
| Well | the Weir's well of liquid Lachryma (a place); a Well, a pocket of distortion (a dungeon) | "the Weir's Well", "a Well" |
| place | a named spot things are sent to (`game.places`); where a weather falls (`placeOf`: an island, or a Well, `well:<id>`; the weather events' `island` field carries it) | "a place" is `game.places`'; "the weather's island" or "the Great Dunemaw's weather" |
| day | a game day (the calendar, `today()`); the bright part of it (`phaseAt` 'day', between dawn and dusk) | "game day"; "daytime" |
| calm | no weather (`aspect` null, the log's "fair"); the Emocean's swells laid down for a stage's breather | "fair" for the weather; "a calm" for the stage |
| hold | a ship's hold (how many casks may cross); to hold the save; a rig's hold (the stretch of a clip rocked back and forth while a move is held: `RigClips`, `hold: [18, 32]`) | "the ship's hold"; "hold the save"; "the clip's hold" |
| move | a blow of the combo engine (the moveset, `kick.hit`); a rig's move (`RigClips`: a named clip choice, the hand's `snap`, the Jar's `hop`; its `release()` lets a held one go on) | "a blow" or "the kick's move"; "a rig's move" |
| hop | a crossing of the Emocean (`hop()`, the node map); the Pneuka Jar's bounce in the Spirit Garden (`JarHop`, `PlanetBody.hop`, and its clip `hop`) | "a hop" is the Emocean's; "the Jar's hop" in full. A spirit's body is `s.body`, never `hop` |
| slam | the Soul Brush's (the air slam, the ground slam); the Great Slip Jelly's; the god hand's clip (the flat palm brought down) | "the brush's slam", "the Great Slip Jelly's slam", "the hand's slam" |
| gulp | the Lockheart's parry (a Lachryma shot swallowed); a mount on the rail; the Pneuka Jar's clip (a Figment swallowed) | "the Lockheart's gulp", "the gulp mount", "the Jar's gulp" |
| kiln | the workshop's kiln (the kiln station, `kilnUI`); the Heavenly Kiln (the tribulation at the Chimney: `Tribulation`, `world/garden/tribulation.js`, `realm.tribulation`) | "the kiln" is the workshop's; "the Heavenly Kiln" in full |
| art | God Arts; Movement Arts; the god hand's strokes in the garden (`ARTS`, `garden.art`) | "a God Art", "a Movement Art", "the hand's stroke" |
| Jar | the Pneuka Jar (the Vessoul's form; in the garden, its body `realm.jarBody`, a `PlanetBody`); the god hand's jar model (`god.jar`) | "the Pneuka Jar"; in code, `jarBody` for the garden's body |
| emote | the Courier's (`EMOTES`: a chat command and its clips); a creature's onset clip (the Lantern Wisp's three) | "an emote" is the Courier's; "the Wisp's emote clips" |
| dive | the Soul Brush's dash attack (move `dive`, `Brush_Dive`); a dive into water or wet slip (`waterfx`'s `dive`); the ledger's old `brush.slam.dive` (the air slam) | "the brush's dive"; "a dive into the water" |
| counter | the ledger's count (`L.inc`, "counter / record / first"); the blow that answers a guard or a parry (the cutlass's from its guard, the Dreamvane's after its twirl: kind `counter`) | "a ledger counter"; "the counter" is the blow |
| wheel | Plutchik's wheel of feelings (`docs/plans/WHEEL.md`); the Lockheart's wheel of odds; the party's order wheel (T held: Come, Go, Help, Wait; `feedback/wheel.js`) | "the wheel of feelings"; "the Lockheart's wheel"; "the order wheel" |

## Retired words

| retired | say instead | where it still is |
| --- | --- | --- |
| Shrine Garden | the Spirit Garden (the owner, 2026-10-06) | (gone; kept: the owner's own word) |
| Lab mode | the all-arts switch (code `lendAll`, `setLendAll`; its label, "ALL ARTS" for now, is Espada's) | `docs/DESIGN.md` |
| vessel (for the god hand's jar) | the jar | (`sfx.jarHit`, R42) |
| course (for moving between rooms) | rooms (`game.rooms`, after the split) | `game.course` (`src/world/basement/basement.js`: the course and the room teleports in one class) |
