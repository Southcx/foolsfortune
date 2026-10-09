# The glossary: detail

This file holds the full definitions behind `docs/GLOSSARY.md`, which is the binding core (the short entries, the homonyms table and the retired-words table) and is the file imported into every session. Nothing here overrides the core: where the two seem to differ, the core wins and the difference is a bug to report. Every original entry is kept in full, one merged entry per term, grouped as the core is and sorted by term within each group. A core entry ending in "→ detail" has more here. Read this file only when a core entry is not enough; it is not imported.


## 1. The Courier, the Vessoul and the god hand

- **asking a sibling** (`@name words` on the chat line, `src/coop/answer.js`): a question a sibling answers in seconds, in its division's
  voice (`src/coop/personas.js`), drafted by Claude through the page's `sample`; its **answer** is a line and, when asked, an order.
  *Not:* a letter, nor the division itself.
- **brimming** (Espada's word): the push of overflow, a vessel full past its brim (twice a drink's: the owner, 2026-10-09); the log says "You are
  brimming." and "You settle." *Not:* "drunk", which never appears in player text.
- **the co-op meter** (`/usage`, `src/coop/usage.js`): what asking and letters spend of the owner's Claude usage over the last real hour,
  each stopped at a cap the owner sets (40 asks, 10 letters by default); a letter waits on one answer from each division at a time.
- **the Courier** (`player`: the body's physics, `src/courier/player.js`; `character`: the rig and its animation, `src/courier/character.js`): the one
  the player plays. Androgynous: "you" where the game speaks, "they" in docs and comments. *Not:* "the player" in anything the game says.
- **Couriers**: the Pneuka Jar in humanoid form; every player is one.
- **crack**: damage to the vessel, per region. It mends slowly on its own, or at once at the kiln (MEND). *Not:* a pot's cracks
  ("pot cracks", below).
- **glaze** (`src/courier/vessel/glazes.js`): a colour fired onto a region at the kiln. **FIRE** keeps a look, **MEND** refires the cracks. A rare glaze also has a **kiln pattern** (`vfx/finish.js`): the mark its firing leaves, drawn the way the real one forms (yohen's stars, oil spot's silver, hare's fur's streaks, crackle, kinrande's leaf, the eye, the dip).
  **The eye** (pattern 6, the EYE CUP glaze's: `vfx/eyecup.js`): Attic black-figure eyes **placed** on the parts of the vessel (the
  chest, the back, the hands, the thighs, and the mask's own painted eyes), never tiled. **The dip** (pattern 7, JELLY-CROWN's): where
  a dipped glaze stops, here in the urn crown's broken lip, the glaze thick along it; **kairagi** (the Ido bowls' word) the thick glaze
  crawled apart just above it, the slip showing between. *Not:* a dive into water (`waterfx`), the seam's dip to the dark.
- **God Arts** (`src/godhand/arts.js`): the god hand's five arts.
- **the god hand** (~, `src/godhand/godhand.js`): the mode where the Courier becomes a jar and you become a hand.
- **guest**: a person who joins your world over the published page's room (a co-op player). *Not:* a sibling.
- **the hand's clips** (`GodHandClips`, `HAND_MOVES`, `src/godhand/godhandclips.js`; the owner's `courier_godhand.blend`): the god hand's own
  32 actions played on its own mixer, which own every bone (nothing writes the fingers after them but `GODHAND_ROM`). A clip keeps the
  owner's name: spawn, idle, spiritFingers, grab, grabHold, release, pinch, pull, point, poke, flick, pat, slam, chop, punch, slap,
  backhand, block, scoop, beckon, shoo, wave, snap, crush, fistClench, count, fingerGun, thumbsUp, thumbsDown, okSign, peace, vanish.
  Where a name is another thing's too, it is qualified: **the hand's grab** (*not* `god.grab`, a thing held, nor GRAB, the garden's
  art), **the hand's pull** (*not* PULL, the stroke it plays under), **the hand's slam** (*not* the Soul Brush's slam nor the Great Slip
  Jelly's), **the hand's flick** (*not* the Soul Brush's flick of slip; it plays when a spirit is flicked), **the hand's point**, **the hand's release** (*not* a bound spirit's release, `spirit.release`).
  A **contact** (`HAND_CONTACTS`) is the frame a blow lands. *Not:* an emote (the Courier's), nor a gesture (a held tool's).
- **the jar** (code name `jar`; events `jar.hit`, `jar.shatter`, `jar.reforge`): the Pneuka Jar, the Courier's true form and the Prince's
  magnum opus; in the god hand the Courier settles back into it (`docs/LORE.md`). The Courier, the god hand and the jar are one
  entity, the player (the owner, R43): player text says "your Pneuka Jar" ("Your Pneuka Jar breaks."), never "the jar". It has integrity, it shatters, it is reforged. *Not:*
  the vessel, and not a costume.
- **the Jar's clips** (`PneukaJarClips`, `JAR_MOVES`, `src/godhand/pneukajarclips.js`; the owner's `courier_pneuka.blend`): the Pneuka Jar's
  own 17 actions on its own mixer: idle, summon, dismiss, hop, land, open, close, gulp, spit, startled, shake, happy, sad, curious,
  rummage, sleep, wake. They own its squash and its scale (on its `root` bone); nothing else scales it. **The Jar's hop** and **the Jar's
  land** are the garden's hop and landing as clips (*not* a hop of the Emocean); **the Jar's gulp** is the clip of a Figment swallowed
  (*not* the Lockheart's gulp, the parry, nor the gulp mount); **the Jar's wake** is the clip of waking from sleep (*not* a wake on water, nor the Wake Whistle). Its cracks are skinned to it and ride the clips (`vfx/crackskin.js`).
- **kintsugi** (`src/courier/vessel/kintsugi.js`): the net the cracks run along. Its gold shows on the body only while a crack mends, and is gone when the mend completes (R45).
- **letter** (`/letter name words`, `src/coop/letters.js`): words the owner sends from the game to a division's own session, which
  answers in a few real minutes through the store (`siblings/<name>`, `re`). *Not:* an answer (seconds, Claude in the page).
- **the party** (`game.party`, `src/coop/party.js`): the siblings called into your world (two at once; four players at most, guests
  included), and what you tell them (`/sib`: follow, hold, go, fight, back, warp: set down beside you at once). A sibling is **met** once where its craft lives
  (`src/coop/meeting.js`), then **called** or **dismissed** at any Shrine.
- **the pool** (`game.lachryma`, `src/courier/lachryma.js`): the Courier's store of Lachryma. It pays for shots, charges and arts, and it is the
  shield. "Lachryma" alone means the substance.
- **region**: one of the vessel's six hit regions (mask, torso, left and right arm, left and right leg), each with its own cracks.
- **a rig's clips** (`RigClips`, `src/courier/anim/rigclips.js`): what the two above are built on: a small rig's own actions on its own
  mixer, by named **moves**, each a loop, a once (going on to its `then`), or held (played **in** to a **hold** rocked back and forth,
  then **out**). *Not:* the Courier's clips (the suite, `courier/anim/animator.js`).
- **shatter / made whole** (`courier.shatter`, `courier.reform`, `src/courier/vessel/death.js`): the Courier's death, and being made whole again in
  the workshop. Player text says "made whole" (or "re-formed"), never "reform", which reads as politics; the event keeps its code name.
- **shield**: the pool paying for a blow before the clay does (35 Lachryma a full blow). It is not a separate bar.
- **sibling** (`game.party`, `src/coop/sibling.js`): another Courier in your world with a mind of its own, one for each division (Petra,
  Dovina, Wanda, Calissa, Espada; docs/plans/COOP.md C6). The same body and rig as the Courier, driven by its mind's keys, so it moves
  as the Courier moves. Its division's session may steer it between its beats. *Not:* a spirit (an ally creature), nor a guest.
  *Also, second copy in "The world":* **sibling** (`docs/plans/COOP.md`): one of the five divisions as a Courier in the owner's world (Dovina, Petra, Calissa, Wanda, Espada),
  with a mind, a temperament and a tool of its own; met once, then called or dismissed at a Shrine; steered by its division's session
  through the game's db. A **guest** is another person playing; the **party** is at most four. You **ask** a sibling (seconds) or send its division a **letter** (minutes). *Not:* a spirit (a bound Figment). They go out across the Emocean and resist excess Lachryma best.
- **the stones** (the kiln's STONES region, `Courier_Stones`; `src/progress/stones.js`, LORE.md "The stones"): where Lachryma enters the
  vessel, and so how the Courier takes it in: the pool's size, regen and costs, the magnet's **reach**, how **heady** a drink is (how far
  it pushes the Courier's mental state toward Prismatic), the **draught** it leaves, and where overflow goes. The Maker's Stones are the
  baseline; every other stone is a trade. One set at a time. *Not:* a stone in the world (say what it is), Strawman's or a cairn's.
- **vessel** (`game.vessel`, `game.vesselDamage`, `src/courier/vessel/`): the Courier's clay body and what is done to it: its glazes, its cracks,
  its shattering and reforming. *Not:* the god hand's jar.
- **the Vessoul** (the owner, 2026-10-04): the entity that stands for the player in the world, a soulspark from beyond. It takes several
  forms, all one being, which is why they share a design language: **the god hand**, **the Pneuka Jar**, **the Courier**, and, on the
  Emocean, **the ships**. The **Solar Skiff** is a limb of the Vessoul. *Not:* "the player" in player-facing text (the game says "you").
- **the Vessoul's paintings** (`src/vfx/vessoulpaint.js`): the owner's textures on the god hand and the Pneuka Jar, as the Courier's
  painted material (the painting as its colour and a share of its glow). The Jar's five gems are not painted: they are its core's light.
- **voice card** (`PERSONAS[id]`, `src/coop/personas.js`, Espada's): a sibling's voice written as form (sentence length, punctuation,
  the first word), a lexicon, what it notices, its moves, what it never says, and sample lines; composed into the brief a prompt carries.
  **drift** (`drift(line)`, `DRIFT`): the house voice's tells a line slides back to (an eager opener, the question said back, an offer
  to help, a hedge, a house word, a dash); banned for all five.

## 2. Lachryma, feelings, weather and money

- **agate** (Espada's word, after agateware: two clays wedged, never blended; `AGATES`, `agateOf` in `progress/weather.js`): two feelings
  felt at once, shown as one: the stronger is what a mind does or what falls from the sky, the weaker its colour. Named after
  Plutchik's dyads, in Espada's plain words (delight, hope, guilt, disappointment, awe, longing, worry, despair). Opposites never make an agate: they **cancel** (the
  mood is torn and weaker). A mind or a sky shows one feeling or one agate, never three (the owner: cycles of expansion and contraction).
- **the aim** (`ECON.perMinute` × 60): what ordinary play should earn in an hour (480 cubes). A source is judged as a multiple of it
  ("× aim"); nothing but luck should pay more than 1.5×.
- **amethyst**: a charm sold in Entropolis's overground that keeps a clear head (slows excess Lachryma).
- **aqua regia**: Margarite's refined lamp fuel, made from the crude the King buys; it dissolves gold.
- **bauble** (`game.baubles`): a gummy drop of Lachryma that refills the pool. Left lying, it oxidizes and sinks (the oxidation ramp,
  `src/vfx/oxidation.js`).
- **cask** (`cask.<grade>`): the unit of crude Lachryma ("a cask of crude grief"), carried in the Pneuka Box; a ship's **hold** is how many casks may cross; a sloop holds 8.
- **chest glaze** (`src/vfx/chestglaze.js`): how a chest shows its tier as it charges, in place of a beam: celadon, crazing, raku, kintsugi gold.
- **commission** (`commissionPay`): a hunt for a Figment by class (Guppy to Leviathan), the island's own thoughts kept in proportion
  (Seger, the Witness Cone). **bounty** (`bountyPay`): a hunt for a named Egregore (a creature of real human myth) or a Figment gone
  stray or aberrant, under the King's marque (Letty Marque). *Not:* the same thing.
  *Also, second copy in "The world":* **commission** (a Figment hunt by class, given by **Seger, the Witness Cone**) and **bounty** (a hunt for a named Egregore or a Figment gone stray or aberrant, given by **Letty Marque**,
  a Contractor of nacre from the King's island **Margarite**, and her Tulpa **Poll**): the island's own thoughts against no one's (`docs/LORE.md`, section 6).
- **converter**: a thing that takes one resource and gives another (the Tithe: cubes into chances; condensing: cards into cubes). Machinations' word.
- **crude** (`ECON.crude`): liquid Lachryma as a cargo, fossil feeling (`docs/LORE.md`, "Lachryma as crude"); graded by aspect,
  **wonder**, **mirth**, **desire**, **grief**, **dread**. Volatile, so it can **spill**; cubes cannot. *Not:* a bauble (the pool's drop).
- **crystal** (`src/world/dunes/crystals.js`): a Lachryma crystal formation in the Dunes, struck with the Dreamvane's pick and tuned by ear.
  What it gives: cubes, and sometimes a **crystal shard** (`mat.shard`, always so called) or a Possibilikey.
- **cube** (`game.cubes`, `src/world/treasure/cubes.js`): a Lachryma cube, the only currency. *Not:* a box in the level ("block").
- **the day's phases** (`phaseAt`, `lightAt`): night, dawn, daytime and dusk on the game clock (a game day is a real hour); at night
  Lachryma glows. *Not:* a game day (the calendar's unit).
- **deck** (of a drop): the shuffle bag a rare drop is drawn from: a 1-in-N item is certain within N tries. *Not:* a deck of the
  Veritome's cards (say "the Book").
- **draught** (`draughtOf`, `DRAUGHT`): the feeling of the Lachryma last drunk (the weather where it was drunk); a blow of that feeling's
  damage type builds its status faster; it fades over a real minute. *Not:* a drink of crude (a cask).
- **dupe**: a curio a chest gives that is already held to its card's limit; it is condensed into cubes instead (`ECON.dupe`). **Dupe
  protection** is the bias toward curios not yet held.
- **faucet / drain**: where cubes come into the world / leave it. **A minute of play** is the economy's unit (`docs/ECONOMY.md`).
- **the five feelings** (the aspects of Lachryma: wonder, mirth, desire, grief, dread; **desire** was "hunger" until 2026-10-05, and
  *hunger* is now only the folk's word for desire in excess, never an aspect). **Wherever a player sees them** (a menu, a log, a
  legend, a bestiary, a chart), **they are ordered most positive to most negative: Wonder, Mirth, Desire, Grief, Dread** (the owner,
  2026-10-05; `DISPLAY_ORDER` in `progress/weather.js`). Their order on the Law-Chaos line (mirth at Law .. dread at Chaos) is a
  different thing, for the systems, and never the order they are shown in.
- **fret** (code `fret`, `FRETS`, `fretAt`: `src/world/dunes/crystaltuning.js`; drawn by `src/vfx/crystalfrets.js`): one of a crystal's
  five note steps on its stave, foot to point, the same on every formation (each a fifth of nine tenths of its height; the fifth runs on
  to the point). Fret k sounds the Crucibelle's k-th note in the formation's key (the minor pentatonic, the root at the foot) and is
  drawn in that note's colour (`DEGREE_COLOR`: gold, rose, green, blue, violet), leaded dark between; a strike lights the fret it
  sounded. A crystal's **sweet spot** is one fret and a way round. The owner's "zones" of a crystal (2026-10-08). *Not:* a zone (a
  render zone), the band (Wanda's instruments), nor the chat line's `/fret` (an alias of the worried emote, `courier/emotes.js`).
- **Lachryma**: the substance of feeling and magic, condensed or liquid (`docs/LORE.md`, section 1: the Emocean is an atmosphere of it; cubes
  are it made solid). Always capitalised.
- **Lachrymite** (the owner, 2026-10-06): Lachryma in its solid form, whatever its shape: a cube is a coin of Lachrymite, a crystal is a
  formation of it, a crystal shard a piece of it. Always capitalised. *Not:* a new item or currency; "solid Lachryma" in prose is this.
- **livelihood**: a way of earning (mining, angling, hauling, a commission...) (`docs/ECONOMY.md`). *Not:* "vehicle" (the skiff is one),
  "a living".
- **mental state**, the Courier's (`game.courierMind`, `src/courier/mind.js`, kept with the pool; `COURIER_MIND`; the creatures' own five states, `progress/combat/mind.js`, one word for both): pushed
  up by Lachryma drunk, settled by quiet; Prismatic is power and fragility, Stoic the reverse. The player reads "your mental state".
  *Also, second sense in "Records and progression":* **mental state** (`src/progress/combat/mind.js`): how open a creature is to being moved: **Stoic**, **Resolved**, **Balanced**,
  **Fluid**, **Prismatic** (solid to liquid). *Not:* mood (`npc.mood`, the folk's), nor EmO.
- **pity** (`TITHE.pity`, `src/world/treasure/treasure.js`): a counter that turns a run of bad pulls into a certainty (a rare in every
  10 Tithe pulls, an epic in 40, a prismatic in 100). **Published odds** are the base weights; **consolidated odds** are the rates a
  player actually meets with pity counted (`docs/DESIGN.md`, section 7).
- **prestige** (of a look: `ECON.looks`): where a glaze, stone, hair or skin sits on the folk's clay ladder, Earthenware to the Prince's
  own; it sets the price (`docs/ECONOMY.md`, "The worth of a look").
- **profile** (`PLAY`, `scripts/economy.mjs`): one way of spending an hour (the fighter, the miner, the photographer, the angler, the
  treasury camper), simulated against the table. A **mixed profile** is two played together.
- **the Purser** (Espada's, the owner R57): the trader at Margarite's dock, the King's buyer, who buys crude, materials and Cogitomaps at a posted price, never haggled; the role is the name (`purserPrice` gives what a dock pays on any island).
- **signature** (`src/core/signatures.js`): where Lachryma is, and how strongly. Tools that sense or drink Lachryma ask here.
- **sink**: a drain the player chooses and that never fills (the glazes, later the Spirit Garden). **The long sink** is the one meant
  to take a committed player's surplus for weeks. *Not:* any drain (the Tithe is a drain, not a sink).
- **the stave** (`e.spires[0]`, `src/world/dunes/crystals.js`): a crystal formation's main spire, the one a strike is read on: it stands
  whole until the formation gives, and wears its frets. *Not:* the lesser spires round it (the blows knock those away).
- **weather** (`game.weather`, `src/progress/weather.js`): an island's mood, falling as Lachryma: one of the five **aspects** (wonder, mirth,
  desire, grief, dread) or **calm**, with a **strength**; a **spell** of it holds a block of game hours. Each feeds the damage type at its
  place on the Law-Chaos line, its fish, and its crude's price where it falls. **The forecast** is how far ahead it can be known (a
  Divination widening). Names of the weathers are placeholders for Espada's.
- **the wheel** (`docs/plans/WHEEL.md`): Plutchik's eight feelings, of which the five aspects are five; **Faith** (trust), **Gall**
  (disgust: rejection, from boredom to loathing) and **Fury** (anger) join later, as places (approved, 2026-10-05). Intensity **rings**
  are adjectives on a feeling's strength, never new names; the centre is Prismatic.
- **worth** (`worthOf`, `src/progress/shop/catalogue.js`): what a thing is worth in cubes, the base every price moves from. A shop's
  **list** price is worth × its markup; Raku's **floor** is the least he takes.

## 3. The tools and the moves

- **the belt** (`game.belt`, `src/tools/belt.js`): where tools are worn; anything that asks "is a tool out?" asks the belt.
  **draw / stow**: take a tool in hand / put it back.
- **blot** *(Espada's word for a stain of spilled crude, settled by Dovina 2026-10-08: the player reads "blot", the code keeps `stain`)* and **blotling** (the aberrant Figment a full-grown blot
  gives up).
- **a slick** (Espada's word, docs/plans/LACHRYMA-LOOP.md section 0; code `slick`; its look `game.slicks`, `src/vfx/slicks.js`, Calissa's,
  2026-10-09): crude thrown or welled up in a fight: the Great Slip Jelly's cast puddles (the Slick Trail's drops, the rings, the Decant,
  its slam), a spit glob landing, a burst jelly or broken clutch, a gusher's spill. Fresh it is black and glossy, the oil film only at its
  rim and at a grazing look; it **thins**, the film's bands coming up through it and their hue walking; it goes to a pale **sheen** and soaks
  away. What the mop and Clean take of it is the paint map's (`slick` cells, `world/ground/paintmap.js`): its look shrinks from the rim as
  they go. Drawn with the blots' program (`vfx/stains.js`, `uSlick`). *Not:* a blot (spilled, it stays and grows until mopped).
- **the oxidation ramp** (`OXIDATION`, `oxidationAt`, `src/vfx/oxidation.js`; Calissa's, 2026-10-09): how Lachryma left lying in the
  open turns, one clock for everything of it: a bauble is fresh cream (Lachryma just out of clay), turns to crude (near-black, the oil film
  on it) from 7 to 22 real seconds, and runs into the ground by 40.5; a slick enters at crude and runs on along its own life (thinned at
  0.3, sheen at 0.72, gone at 1). **The film** (`oxFilm`, `filmColour`, `FILM`): the oil film's colours walked round a loop (violet,
  teal, gold, magenta), thin-film interference read as Lachryma's own. **featTint** (`featTint(t)`): that film's hue shift as a feat of
  the Courier's power wears it: the blink's afterimage and streak, the slam's ring (and the brush's slam, which throws the same ring),
  the jets' thrust (laid over the brush's feeling), every shockwave (the library's `shock`). **The slip schiller** (`SLIP_SCHILLER`,
  `SLIP_SCHILLER_GLSL`, `src/vfx/labradorite.js`): the faint labradorite flash of the Lachryma under every slip body's clay, at a grazing
  look and where it runs wet (the slip jellies' melt): one uniform, shared, so it never makes a program. *Not:* the weather's look, the
  glitch.
- **the core movement**: walk, sprint, slide, jump, wallrun, mantle, dash, and the moves any humanoid has (swim, ladders, hanging,
  poles, grates, balance, carrying, pushing). The gold standard: nothing changes it.
- **the Crucibelle** (`src/tools/crucibelle/`, `src/tools/crucibelle/crucibelle.js`): five **notes**, the **toll**, the **toll string** (LMB
  pressed again in time: four tolls, the last brought down overhead and rung all round), **songs** (note patterns with effects),
  **fever**; the **mirage** (the Song of Seeming's decoy); the **metronome** (the beat shown on the bell itself: the brass fob below the
  hand, a swing, never a flash; the owner, 2026-10-06). *Not:* the pendulum (the same beat on the wire compass, below).
- **damage type** (`src/progress/combat/types.js`): what kind of force a blow is, lawful to chaotic: **Impact**, **Ego**, **Influence**,
  **Illusion**, **Delirium**. Each **builds** a status and **trumps** one other (a closed cycle). **Annihilation**: Impact on a target
  carrying Delirium's status, or the reverse, hits much harder. *Not:* an element.
- **the Dreamvane** (`src/tools/dreamvane/`, `src/tools/dreamvane/dreamvane.js`): **dowse** (the needle points at Lachryma), the **pick** (strikes
  crystals; the opener of its string, held for the heavy blow: `src/tools/dreamvane/pick.js`, with the **spin sweep**, the **vault** at a sprint and
  **the Dreamquake**, its special on R: the ground rung round them), the **fork** (a tuning fork, thrown), the **survey** (charts the ground around), **the vane** (the weather meter on the crook's head: it turns
  to the mood where you stand, the owner, 2026-10-06), and **reading the sky** (the dowse raised to the sky: the forecast).
- **emote** (`EMOTES`, `src/courier/emotes.js`; the tech `Emote`, `courier/moves/emote.js`; events `emote.start`, `emote.end`): the Courier's
  body language asked for on the chat line (/wave, /sit, /dance): a clip of the suite's social pack played **once**, a **loop** held until
  they move, or a **triple** (the suite's Enter, Loop and Exit: in, held, out). Each is in a **family** (greet, joy, anger, fear, sorrow,
  thought, pride, body, repose, dance, flirt, taunt), which is how `/emotes` lists them and what the folk feel at one; a **dance**, a
  **flirt** and a **taunt** are the emotes of those families. A **floor pose** (`floor`) is one held on the ground (sitting, kneeling,
  lying, the hover): its legs are the clip's. *Not:* a gesture (a held tool's own clip), nor a creature's emote clips (see the homonyms).
- **fitting** (`FITTINGS`, `src/pneuka/box.js`): what fits into a tool (a lure, an instrument, the Lockheart's keys), kept in the Pneuka
  Box. A tool never has an inventory of its own.
- **friendly fire** (`src/progress/combat/friendly.js`): a blow on an ally (another player's Courier, a division's clay folk form): a fifth
  of its damage, and statuses that land once and then meet **tolerance** (each one of a kind from allies needs twice the build-up and
  holds half as long; the third in 20 s is shrugged off). *Not:* the spirits (allied creatures), whom the Courier's blows pass through.
- **the hands** (`belt.hands`, `src/tools/belt.js`): Dexterity's widening as the belt gives it, what every tool's draw and stow is times.
- **hard landing** (`HARD`, `src/courier/anim/airborne.js`): how a landing from a fall past 9 m/s looks (a hand to the ground); only shown,
  control is back at once. *Not:* the roll (the Movement Art that takes a fall of 20 m and more).
- **idle break** (`IDLE`, `src/courier/anim/idlebreak.js`): a fidget played over the idle after a still spell with nothing in hand (a look
  round, a stretch, a shift and tap, in turn); any move ends it. *Not:* an emote (asked for by the player).
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
- **the kick** (the Movement Art `kick`, V with nothing in the hands; `src/courier/moves/kick.js`): the unarmed moveset on the combo
  engine (`tools/moveset.js`): V's string is the **jab**, the **cross**, the **haymaker** and the **roundhouse**; after a pause at the
  jab the **front kick** and the **shove**, at the cross the **leg sweep** (`sw`; its row in Dovina's table is `sweep`); S + V the
  **uppercut** (its launcher), V in the air the **ground pound**, V sprinting the **flying kick**. The first 0.26 s of every one is the
  parry. In the ledger `kick.hit` is a move that struck (with how many things it struck), `fist.hit` each blow. *Not:* the hook (the
  boxer's is the haymaker here: the hook is the Sondelass's); a sweep (Dovina's room test: the move is always the leg sweep).
- **kick-off**: a jump off something that holds the Courier facing it (a ladder, a ledge, a pole, the latch's wall, a grate wall), shown
  with the suite's wall jump. *Not:* the wall jump (the core's, off a wallrun).
- **a Lachrymato Bottle** (`BOTTLES`, `src/progress/brushload.js`; always so called, never "tank"): an aquarium-glass bottle of Lachryma
  worn against the Courier's upper back (its own place, not where tools are worn on the back), stoppered with an opaque topper; a
  reserve that feeds the pool below half and is what the paint mode spends and the mop mode fills. Glass: a broken shield can crack it,
  and what spills is a blot.
- **the Lockheart** (`src/tools/lockheart/`, `src/tools/lockheart/lockheart.js`): a **coffin** on a chain; its **heart** (which kind of coffin); **hoover**
  (LMB held: draws Lachryma in) and **channel** (the ultimate's pose, the hands joined before the coffin); the **flail** (LMB tapped: the
  coffin swung on its chain let out, three blows on the combo engine); a **Possibilikey** (always so called, never "key" alone) on its ring;
  a Possibilikey's **uses** (the openings it has been turned in: brass is spent at the first, any other **breaks** with a chance that
  rises with them, `keyBreaks`, the rule Dovina's `ECON.lockheart.keyWear`); a used one keeps its uses wherever it goes and never stacks
  with fresh ones (*not* "worn": to wear is to put a tool on the belt);
  the **wheel** of odds; **the Opening** (its ultimate: `src/tools/lockheart/ultimate.js`).
- **Movement Art** (`src/progress/skills.js`): a tech the System teaches; a **variant** is one of its versions.
- **the moveset** (`tools/moveset.js`, Calissa's; numbers `progress/combat/moves.js`, Dovina's): a tool's **string** (LMB, blow by blow),
  its **pause string** (LMB after a pause mid-string), its **charge** (LMB held), its **launcher** (S + LMB: the struck thing is
  `airborne`), its **air string** (LMB in the air, ending in a **plunge**), its **dash attack** (LMB while sprinting) and its **special**
  (a burst that costs Lachryma, unlocked by the tool's mastery). A string's last blow, its row's time spent and its strike past, may be
  cut short by a press into a new opener: the **recovery cut** (*not* a cancel: opposites cancel). A **bail** is being thrown off the
  Solar Skiff. *Not:* a combo (the
  club's chain, a rhythm combo). The Lockheart's is the Opening; no other tool has one yet.
- **outcome** (`OUTCOMES`, `src/tools/lockheart/table.js`): what can come out of a Lockheart (dud to slip nuke), drawn from its coffin's
  **table** of weights, bent by the Possibilikeys; **power** is how full the coffin was (1 to 2). The **jackpot** is the slip nuke.
- **the parry** (V; `courier/parry.js`, `docs/plans/PARRY.md`): the one button that answers a blow or a projectile in a short **window** at the
  press, in the way of the tool in hand (the owner, 2026-10-06): unarmed it is the **kick**, with the cutlass the **deflect** and then
  the **guard** (held). A **parryable** thing wears a Lachryma outline (Cuphead's pink); one
  without it cannot be parried. *Not:* the guard (the held block after the window).
  Each tool's answer (`courier/parries.js`, the table): the psygun's **stagger** (shot down, its thrower stunned), the Soul Brush's
  **bat** (returned, carrying the load's feeling) and **soak** (a Lachryma shot drunk into the Lachrymato Bottle), the Veritome's
  **shutter** (a blow winding up, stunned), the Dreamvane's **twirl** (turned aside; held after the window, it spins), the Crucibelle's
  **toll** (shattered within reach; wider on the beat), the Lockheart's **gulp** (a Lachryma shot swallowed into the pool). In code each
  is a `how`: `return`, `turn`, `soak`, `gulp`, `shatter`, `stagger`, `shutter`.
- **projectile** (code: an entry in `game.projectiles`): anything thrown that a parry can find: a rigid body (`{ body }`, a lobber's
  ball) or a plain one (`{ pos, vel }`, a jelly's glob); `parry: false` keeps it out of reach of every parry.
- **the psygun** (`game.weapon`, `src/tools/psygun/weapon.js`): the gun. A **shot** is one round fired (and only that: see "shot" below). A
  **charge** winds up a piercing beam. A **shell** is a caster shell (`Type-00`...), a special round loaded in a **chamber**.
  Its moves (`src/tools/psygun/gunmoves.js`): the **pistol whip** (LMB with a creature or a clapperjar close in front: a blow, not a
  shot), **fanning the hammer** (R: six shots off the hip, paid for at once) and the **flourish** (the gun spun round a finger before it
  is put away after a fight). *Not:* the Dreamvane's twirl (its parry).
- **reprogramming** (`src/tools/veritome/reprogram.js`, `src/tools/veritome/mind/`): rewriting a stunned creature's mind. A **macro** is a program, composed on a
  **lattice** of **Functions** on the Codex's **THE MIND** shelf, and spoken in **neuralese**.
- **shot**: a psygun shot, and only that. A scripted camera is a **camera shot** (`cinema.shot`); a photograph is a **plate**.
- **the skiff / Solar Skiffing** (`src/courier/skiff/`: the tech `Skiffing` in `skiff.js`, the boat `Skiff` in `boat.js`; code name `skiff`: the tech's id, `T.tech.skiff`, events `skiff.*`): the sand boat, and sailing it
  in the Dunes. *Retired:* "surfer".
- **the skiff's clips** (`Skiff_Summon` ... `Skiff_Bail` in `solarskiff.glb`, played by `courier/skiff/boatpose.js`): the skiff's own
  15 clips, each the **partner** of the rider's clip of the same name (authored together, the same frames): the boat plays its partner
  at the rider's time and weight, so the deck moves under the feet as the body does on it. The code's word is laid on after (the boom,
  the hoist from the sail's L, the belly, the pennant: `boat.js`). *Not:* the rider's clips (the Courier's suite, `rider.js`); "board"
  as a term (the overture's storyboard has it).
- **the skiff's model** (`src/assets/solarskiff.glb`, from the owner's `source_assets/Courier/courier_solarskiff.blend` and its painted
  hull, `courier_solarskiff_hull.png`, by `scripts/export_solarskiff.py`): the skiff as the owner built it, rigged (`Skiff_Rig`, 64
  bones): the **hull** (its carved prow with the eye, the **dome** at the stern), the two **oars** (shipped: nothing rows yet), the
  **doors** in the deck the mast rises through, the telescoping **mast** and its **finial**, the boom, the yard, the sail and the pennant
  (one cloth), the **engine** and its **fins** and **vents**; and two pieces of the Courier's Lachryma (`CourierEnergy`) hidden at a
  point until a clip opens them: the **flare** (out of the engine in the flare's clips) and the **sigil** (the ring of marks laid on
  the sand the boat rises out of in the summon). Parsed on the way into the Dunes (`Skiff.load`). *Not:* the sloop (the Emocean's
  ship, `vfx/sloop.js`), nor "ship" for any of it.
- **the Sondelass** (`src/tools/sondelass/`, `src/tools/sondelass/sondelass.js`): the blade with three **forms**: the **cutlass** (with **blade mode**,
  **zandatsu**, the **Stinger**, **guard**), the **rod** (angling: `src/tools/sondelass/angling/`), the **hook** (the grapnel; the **grapple** is what the
  Courier does on its line).
- **the Soul Brush** (`src/tools/soulbrush/`, `src/tools/soulbrush/soulbrush.js`): the **club** (combo, the **spin** after a pause, the **dive** at a
  sprint, the **slam**: the **air slam** let go in the air, the **ground slam** let go after landing), the **flick** of slip, **Celestial mode**
  (strokes drawn on the screen and read as **sigils**), and **inscriptions** (what a sigil writes onto a thing).
  **The load** (`tools/soulbrush/load.js`): the brush's mode, its saturation and the Lachryma it paints or mops; **the paint map**
  (`world/ground/paintmap.js`): the grid round the eye of where Lachryma lies on the ground (paint and stains), which the ground's
  shaders draw and the game asks; the **stains** themselves are kept in `world/ground/stains.js`.
- **stance** (`src/courier/anim/stances.js`): a held pose baked from clips (a tool's idle). *Not:* a form (the Sondelass's) or a mode (blade
  mode, Celestial mode).
- **tech** (code only: `Tech`, `src/courier/moves/techs.js`): anything that takes the Courier's body for a while: a movement tech, a tool's
  hold, a chest's opening, the kiln station, talking, the death, the Opening. In the game, a learned one is a **Movement Art**.
- **tool** (`src/tools/`, the belt and the held-tool base): one of the Courier's psychic tools, worn on the belt: the psygun, the
  Sondelass, the Soul Brush, the Veritome, the Dreamvane, the Crucibelle, the Lockheart. *Not:* a Node script (those are "scripts", in
  `tools/` until the restructure moves them to `scripts/`).
- **ultimate**: the category, a tool's cinematic signature move.
- **the Veritome** (`src/tools/veritome/`, `src/tools/veritome/veritome.js`): the book that is a camera. The **lens**; the **book bash** (LMB
  with the lens down: the book shut and swung, two blows on the combo engine); a **plate** is one photograph; its
  **memory** (`VeritomeMemory`, `MEMORY_PLATES`, `tools/veritome/memory.js`; a digital camera's: it holds 24 plates until they are
  appraised, never a consumable, and a full one is the shutter's one refusal; there is no film since 2026-10-06);
  the **darkroom** (where plates are appraised); the **date stamp** (the Veritome's clock: the game day and game hour in the lens's corner
  and on every plate, the owner, 2026-10-06); the **Flash** (dazzles and stuns; a photograph never does); **reprogramming**
  (below). Its pages: **the Book** (the bank: things kept as **cards**), the **Compendium** (appraised entries), the **bestiary** (facts per
  creature), the **Major Arcana** (twenty-two designated cards).
- **windup** (code: `creatures.windup(c, ...)`, `c.windup`): a creature's telegraphed blow, listed while it can be answered; a parry in
  its window breaks it off (`creatures.parried`). *Not:* an attack's own phase name (the jelly's `'wind'`), which is the body's.

## 4. Creatures and folk

- **Charybdis** (the owner, 2026-10-08; LORE.md, "The passage"): the Whale (class 3) of the maelstrom, after Homer's whirlpool that
  swallows the sea and spits it out: it rises out of the maelstrom (Astral) and dives back in (Umbral); one name for its five moods, its
  feeling the waypoint's weather ("Charybdis rises, in grief."). One Egregore in every maelstrom (Dovina's ruling). It is hurt only from
  the world it is in (Astral shots risen, Umbral dived); crossing the surface it is open to both, double: **the surface strike**
  (`CHARYBDIS`, `charybdisHurt`, `progress/rail/setpieces.js`). **the
  Drowned Light**: the graveyard's drowned lighthouse, the False Light's twin below. *Not:* the maelstrom (the leg, a place).
- **clapperjar** (code: `clapper`, `src/creatures/clappers.js`): the clapping pots, the folk's lowest tier (earthenware). The code's shorter
  word is accepted.
- **clutch** (`NURSERY`): a nest of slip jelly eggs in the slip, guarded, hatching **brood** (young jellies a third of the size), which
  the crowned FOE calls; broken, an egg may leave **slip roe** (a material). Clutches come back with the next game day's layout.
- **cogitohazard**: the umbrella word for Lachryma dangers in the environment and maliciously aligned Figments.
- **Contractor**, **Tulpa**: one who survives the open Emocean is a Contractor with a Tulpa (a thought-form authored with care).
- **creature** (`game.creatures`, `src/creatures/creatures.js`): a hurtable thing with a mind (a slip jelly, a spirit). A weapon calls
  `creatures.strike`.
- **the crown** (the Great Slip Jelly's: `FOE.crown`, `src/progress/combat/dunemaw.js`): the broken urn on its head, cracked in three
  stages by Impact, the slam or its own ram into stone, then burst off; under it, **the core**, its weak point. *Not:* a chest's tier.
- **EmO**, Emotional Output (`src/progress/combat/emo.js`): a Figment's agitation, 0 to 1; its Lachryma yield peaks in the optimal
  band, and it enrages past it.
- **enrage** (`enraged(emo)`, `src/progress/combat/emo.js`): a creature past the top of its EmO band (from `EMO.enrage`); it shows in its
  body (the temper), never in text.
- **Figment**: a thought-construct hewn from an Island of Ego's own psyche. **Egregore**: a thought-form spawned from the Emocean,
  authored by no one. Neither is good or evil by nature. **Which is which** (the owner, 2026-10-08): drawn from real human mythology, an Egregore
  (Charybdis, Old Nobody); made up, a Figment. A Figment at large is a **stray** (wandered from its island, still itself: the Cantor)
  or an **aberrant** (gone wrong: a blotling).
- **the folk** (code: `npc`, `src/npc/`): the clay people, all fragments of Kaolin Anagami, tiered earthenware (the clapperjars) < stoneware <
  porcelain < the Court. "The folk" in the game means the ones who speak (Saggar, Raku, Old Grog, Pip); only they speak in the dialogue
  box. Pronouns (R39): the Prince of Clay is "he"; every other folk is unisex by construction and goes by what the lore gives it (so far
  Mistress Saggar "she", Raku "he"; Grog and Pip unset: write around them). The Courier is always "they".
- **grain** (a creature's temperament: `docs/plans/TEMPERAMENT.md`; the data in `src/progress/combat/temperament.js`): who a mind is, five traits each between two poles:
  curious / wary, orderly / erratic, bold / shy, gentle / hostile, skittish / steady (ids: the five-factor model's OCEAN). It weights
  the mind and says which damage type a mind is weak to; it shows in movement and posture, never colour. *Not:* **temper** (the body
  showing its mental state, `vfx/temper.js`); *not* "personality" or "stats" in player text. Grain is climate, mood is weather.
- **the Lantern Wisp** (`src/assets/lantern_wisp.glb`, the owner's): a creature, and the baseline rig and animation suite every enemy
  gets (34 joints; its eighteen clips: idle, five floats, cast, hit, death, five mood loops, three emotes, a dance). The mood loops are
  a feeling's basic ring, the emotes its onset; its flame carries the strength. *Not:* the hue ring's lights (the spirit press's).
- **Magnus Ibrahim Manus** (the King; his island **Margarite**) and **Entra Polearis** (the Queen; her island **Entropolis**): two other
  Islands of Ego, and the Prince of Clay's parents (`docs/LORE.md` has the rest).
- **mind** (code: `Brain`, `src/creatures/ai/`): what a creature thinks with: senses, memory, drives, a utility reasoner. See the homonyms below.
- **the Pithos** (Espada's name, a proposal; the log's "the Great Slip Jelly"): what the folk call the Great Dunemaw's FOE, a Great Slip Jelly wearing the broken urn it grew in as a crown (**the urn crown**, `src/vfx/urncrown.js`; the lore copy says "the broken crude jar": a *pithos*, Pandora's jar); breaking the crown bares **the core**, its weak point.
- **the Prince of Clay**: Kaolin Anagami's main avatar, the most powerful of the folk. "He".
- **the ram**, **the slam**, **the reel**, **the slide** (the Great Slip Jelly's: `src/creatures/jelly/greatjelly.js`): its charge after
  a one-second scrape, aimed as the scrape begins (stone it hits cracks its own crown); its slam close in; the four seconds it reels
  when the crown bursts (every blow three times over); and, crown off, the sand sliding toward the pool it is in. It **sinks** into a
  pool and **surfaces** from another. *Not:* the Courier's slam (the Soul Brush's and the move's: the slam that cracks the crown).
- **slip jelly** (`src/creatures/jelly/`), **spirit** (`src/creatures/spirits.js`: an ally, called up), **mirage** (a decoy).
- **status** (`game.stun`, `creatures.status`): a condition on a creature (stun, halt, slow, sleep, calm, melt; and the four a damage type
  builds: **doubt** (Ego), **charm** (Influence), **blind** (Illusion), **confusion** (Delirium); Impact's is the stun). **build-up**
  (`creature.build[type]`): a type's meter toward its status. **annihilation**: Impact on a confused creature, or Delirium on a stunned one.
- **stimulus** (`game.ai.stimuli`): a sound, light or smell a creature can notice.
- **Strawman** (`STRAWMAN`, `src/vfx/strawman.js`; `docs/plans/STRAWMAN.md`; the owner's character and name): the Workshop's test dummy, a stitched sack doll on a post with a weighted ball foot, stitched by Pip; a creature that never falls and that the ledger never counts (`training`); infinitely durable, it cannot shatter and always stands back up. A **bout** is its blows until 4 real seconds pass without one, said in the log in one line. Named with no article ("Strawman rocks back up").

## 5. Places and the Wells

- **Anagami Island**: this Island of Ego, a 5 x 5 grid of chunks. **Kaolin Anagami** is the island, and the ego it is.
- **an arch** (`src/world/well/wellkit.js`): a doorway of the Great Dunemaw's floors, round-headed (4 m wide, its crown 5 m up), its
  ring and pilasters standing proud of both faces of the wall.
- **the basement**: below the workshop: the hub, the course, the movement lab, the lap circuits, the siege. *Not:* "the lab".
- **Cogitomap** (the item `cogitomap`): a map of one Well as it was when charted; since a Well changes over time, a Cogitomap is a ticket
  to a seeded run of it. Drawn on the way up when the run charted four fifths of the floors walked (the map's share of CHARTED ground,
  which a survey pulse gets and walking alone does not); it carries the Well, the seed, the day and its worth (`cogitomapWorth`).
  Copied by Spellscription; sold, traded, hauled (`docs/ECONOMY.md`, "The livelihoods").
- **the course**: the basement's loop of eight **stations** (checkpoints), with laps and splits.
- **the daylight** (`game.daylight`, `src/render/daylight.js`): the light on the open ground (the sun, the sky's light, the fog) by the game
  hour and the weather, so the lit world agrees with the sky's painting. *Not:* the day's phase (night, dawn, day, dusk), which it reads.
- **a drift tide** (`docs/plans/DUNEMAW.md`, phase 2): a sand slope in the Great Dunemaw rising and falling on the sim clock.
- **the Dunes** (code `dunes`): the sand sea, a region of Anagami Island, capitalised in player text like the Weir and the Well; **the oasis**
  at its heart, **the Weir** (its pools and pier), **the Weir's Well** (of liquid Lachryma), **the barrier** (the edge), **the ruins**
  (columns and obelisks: stone).
- **the Emocean**: the collective unconscious, a sea (an atmosphere) of pure Lachryma outside every island.
- **fill** (a Well's, 0..1): how much it has to give; each run draws on it and rest fills it again (`drawWell`), and what a run pays is
  scaled by it (`wellYield`). A Well at nothing is **dry**.
- **the flythrough** (`docs/plans/DUNEMAW.md`): the preview of a floor on arrival, the camera sweeping its path with the frame
  accumulation on; any key skips it.
- **FOE** (a Well's; Etrian Odyssey's word): the bigger creature that keeps a Well's last floor (for now a Great Slip Jelly, class 2). The
  run's pay counts the FOEs beaten (`wellPay`). *Not:* a creature's foe (whatever its mind is fighting: `c.foe`).
- **the Gnomon** (Espada's; `world/dunes/solar.js`; also `dunes.js`, the spire): the pale spire in the Dunes, the sundial's shadow-stick for the whole Dunes; it still keeps game hours. The Solar Skiffing trial is begun at its foot and races its shadow.
- **the great cavern** (`src/world/well/cavern.js`): the Great Dunemaw's last place, under its third floor's way down: **the bowl**
  (`src/world/well/bowl.js`, DUNEMAW-ARENA.md), where the crowned FOE broods. Its parts: **the ledge** (the way in, 6 m up; its two
  **slopes** are one way down), the **pillars** (six; a ram **cracks** one, a second **fells** it as a **log**, a third leaves **rubble**),
  the **stalactites** (eight, overhead; fallen, one lies on the floor as a ram target used once), the **slip pools** (W0 at the centre, W1
  to W4 round it), the **rim shallows** (slow to wade) and **the upper ring** (a gallery in the south wall). Its way up, the pale pool,
  forms only when the fight ends. *Not:* the Well's mouth (out on the sand).
- **the Great Dunemaw** (`game.well`, `src/world/well/dunemaw.js`; the owner's name): the Well in the Dunes, the slice's one Well. Its
  **mouth** is a dark turning pool ringed in stones out on the sand (a signature of kind `well`: the Dreamvane hears it); F there goes
  down. A Well has **floors** (three here), each laid out that **day** from `wellSeed` (`src/world/well/wellkit.js`); on every floor the
  **way up** (a pale pool: back out to the mouth with the haul) and, but on the last, the **way down** (a dark pool: deeper). A **run** is
  one trip down and back; shattered in it, the run's haul is lost. *Not:* the Weir's Well (the oasis's well of liquid Lachryma).
  Look (R57; `docs/plans/SLICE.md`, E1; not "the Swallow"): its **mouth** (`src/vfx/dunemaw.js`) is a spinning black pool of the Mind's labradorite in the sand; its floors are dressed from **the Great Dunemaw's kit** (`src/vfx/dunemawkit.js`: the bismuth wall, the glass floor over liquid Lachryma, the trim). Lore: the Well in Anagami's Dunes (the slice's Well). A Well, so it drifts. *Not:* the Weir's Well, which is a place.
- **the ground's drift**, **wade** (`player.drift`, `player.wade`): a place's pull on the Courier's feet (sand sliding, carried as a
  platform's move) and its drag on a walk (shallows), set by the place and put back when the Courier leaves it; the core movement is
  untouched when they are zero and one.
- **haul** (of a Well run): what the run found below, a material for each floor whose creatures are all down; it comes home only up
  the way up, with the run's pay (and a Cogitomap, if charted enough). *Not:* hauling (the livelihood of carrying goods across the Emocean).
- **the hub**: the basement's centre, where the Index stands ("back to the hub").
- **the Index** (`src/feedback/indexmenu.js`): the console at the hub: F, and pick a room.
- **an Island of Ego**: an island precipitated out of the Emocean where an identity is strong enough; its owner's Will holds it apart.
- **a lane** (`src/world/well/wellsand.js`): in a room of the Great Dunemaw, the band of flat sand from each doorway and pool to the
  room's middle (1.6 m to each side, the dunes and drifts beside it): the way through a room is level ground. *Not:* a path (the
  floor's guaranteed route of rooms, `layout.path`).
- **lap circuit** (`src/world/basement/circuits.js`): the Braid, the Mill Race, the Spindle.
- **layer** (`LAYERS`, `src/feedback/cartography.js`): one level of the map: the upper floor, the ground floor, the basement, the Dunes.
- **the Lip Stone**, **cast**, **wipe** (`docs/plans/DUNEMAW-EXTREME.md`; `world/well/raid.js`, `creatures/ai/timeline.js`): the Great Slip Jelly's fight is a scripted **timeline**
  of named **casts** (its **tankbuster**, **raidwide**, **adds**, **enrage**), in the style of an FFXIV extreme trial; one difficulty
  (the owner). The Lip Stone on the bowl's ledge is the fight's start: a **wipe** (a shatter in the fight) costs the attempt, not the
  run. **The pull** is the moment it wakes (the timeline's nought). **Sodden** (Espada's: Brine Soaked) doubles the next blow; the
  **sherds** are its four calves. *Not:* a Shrine; *not* "Extreme" as a mode (there is none).
- **the maw wipe** (`game.mawWipe`, `src/vfx/mawwipe.js`): the seam into a Well covered by the Dunemaw's own pool, opening from the
  middle of the view until it fills it, turning while the floor is built, then widening its eye onto the floor. No words.
- **the movement lab**: the basement's hall of five wings (the hands, the rigging, the techs, the clockwork mill...). Only as this room's
  name.
- **an ostracon** (plural **ostraca**; `src/progress/ostraca.js`, Espada's lore, LORE.md "Digging for words"): a potsherd carrying one
  neuralese word beside a picture of what it does; found once (16: the Dunes' dig, the Great Dunemaw's forgotten pots, the ruins' columns,
  the workshop's old walls), it glosses that word into the **Crib Sheet**. A **stele** (two: the ruins' sealed room, the great cavern's
  upper ring) carries three abstract words no ostracon does, and a sentence. *Not:* a shard (a broken pot's piece, or a crystal shard); *not*
  "ledger stone" (the ledger is the game's counts).
  *Also, second copy in "The world":* **ostracon** (plural **ostraca**; `OSTRACON_PICTURES`, `src/npc/neuralese.js`; Espada's, the owner's archaeology direction, 2026-10-08): a
  potsherd the town that was wrote on, one neuralese word beside a painted picture of what it does; dug up, it glosses that word on the
  **Crib Sheet** (the knack: each neuralese word's English beside it, `LEXICON`). **a stele** (`STELAE`, Dovina's `progress/ostraca.js`; Greek *stēlē*, a standing
  stone): one of two, three words each among a sentence, at the end of a harder path. *Not:* a sherd (the Pithos's calf), a plate (a Veritome photograph).
- **an ostracon's look** (`Ostracon`, `ostraconThing`, `src/vfx/ostracon.js`; Calissa's): an **ostracon** (plural **ostraca**, Espada's
  name: LORE.md "Digging for words"; where they lie is Dovina's, `progress/ostraca.js`) is a curved potsherd of red earthenware a hand
  across, broken from a painted pot of the town that was, in Attic **black-figure** (the EYE CUP glaze's hand). The pot's zones run across
  it and off its broken edges (a border of **tongues**, a frieze round the vessel with a **palmette** under each handle, **the black** of
  its lower body); in the frieze a **picture** of what the word does (`PICTURES`, `paintPicture`, `src/vfx/blackfigure.js`), kept whole,
  or the **meander** (the Greek key) for a word with none; on the black below, the word's **rune** as a **graffito**, scratched after the
  firing (`runeStrokes`, `tools/veritome/mind/runes.js`: the Veritome's own glyph). Its broken edges are the paler raw body. *Not:* a
  shard (the homonym), nor one of the sherds (the Great Slip Jelly's calves); *not* a plate (a photograph).
- **place** (`game.places`, `src/world/places.js`): a named spot anything can be sent to by id (`well.mouth`, `kiln`, `folk.<id>`):
  the agents, the trailer and the map read the one registry. A place is a point; *not* a room (an area the log names, which the
  `place.enter` event carries as `room`: an old homonym).
- **a plaster patch's look** (`PlasterPatch`, `src/vfx/plasterpatch.js`; the patch and its blow are Petra's, `world/ostraca.js`): the
  **skim**, newer plaster a shade off the workshop's old wall, the trowel's arcs in it, its rim feathered to the wall's colour and a
  **hairline crack** round it (always so called: a crack alone is the vessel's), so only a careful eye spots it; struck, it comes away in a few **flakes** of itself (they lie on the floor a
  few real seconds, then shrink away) and a puff of dust (`plaster.break`, `plaster.land` in the library), leaving the **scar**: the
  old wall bared, the skim's pale cut round it, and the hollow the ostracon was set in. *Not:* the plaster surface (`triplanar.js`'s
  texture, or `vfx/surfaces.js`'s pattern).
- **rock** (`src/world/well/rock.js`): the Great Dunemaw's walls and pillars drawn rough over their box colliders, a noise field
  pushing the skin up to 0.3 m sideways.
- **room**: a named place inside a layer, said by the log as you enter it (`place.enter` carries `room`); also what the Index sends you to.
- **a room's design** (`src/world/well/prefabs.js`): one of the Great Dunemaw's designed rooms (a prefab): the processional, the
  narrows, the stones, the cloister, the crossing, the gallery, the shrine, the pylon gate, the vestibule; and three halls: the
  hypostyle, the amphitheatre, the ruin. Drawn once for a shape of doorways and turned to fit; paced along the path (a way through,
  a fight, a breath). *Not:* a template (the word retired with the four R45 ones).
- **a sandfall** (the Great Dunemaw, `docs/plans/DUNEMAW.md`): a curtain of sand pouring from above; in the floors, a side passage's
  shifting door (open, then falling, on the sim clock; never closing on the Courier). Also the spout's falling skirt.
- **the sealed room** (`world/ostraca.js`): a stone room by the ruins in the Dunes whose door slab the Dreamvane's fork opens by
  ringing in it; inside, a stele. **a plaster patch** (the same): a cracked patch on the workshop's old walls that a blow knocks away,
  an ostracon behind it. **a forgotten pot**: a pot on a floor of the Great Dunemaw that holds an ostracon (the deck: `DUNEMAW_DECK`).
- **the shore** (`game.dunes.beach`, `src/world/dunes/beach.js`; its zone is `beach`, part of the dunes): due east of the oasis, where the
  Dunes run down to the Emocean, and nothing but the sea beyond. **the waterline**: where the sand meets the crude (`shoreAt(x, z)`, signed
  metres, negative at sea; `beach.shore`, as a line); the shore's wall stands a step out past it. **the jetty**: the plank walk out over
  the crude from the beach, where the sloop moors. *Not:* the Weir's pier (the oasis's), or the span (a bridge).
- **the shore's look** (`game.shore`, `src/vfx/shore.js`): what is seen where the Dunes meet the Emocean (Petra's beach): the crude sea
  in the shore's sector, the **swash** (the crude coming up the sand and drawing back, its oil film bright at the lip, never foam) and
  the **wet sand** behind it. The island's weather ends at the waterline.
- **a Shrine** (`docs/plans/SHRINES.md`; in the lore a roadside hokora, kiln-sized: Espada): a place in the world where you **rest** (the pool full), which is **where you are made whole**
  after a shatter (the last one you rested at), a **fast-travel** point (to any Shrine you have found), and the door into the Spirit
  Garden. None in the Wells. *Not:* a save point: the game keeps everything as it happens (`game.save`); *not* the Wells' dead-end
  room of the same shape (`prefabs.js` `shrine`, a breath, which keeps its code name). The first four (Espada): the **Bisque Shrine**
  (the workshop), the **Lamp Shrine** (the Dunemaw's lip), the **Float Shrine** (Old Grog's pier), the **Pearl Shrine** (Margarite's dock).
- **the siege** (`src/world/basement/siege.js`, `src/world/basement/raids.js`): the god hand's arena; raids happen there and nowhere else.
- **a slip geyser** (`world/dunes/geysers.js`, `vfx/slipgeyser.js`): a column of sand and slip erupting from the Dunes on a cycle; it launches the Courier.
- **the socket** (`src/world/well/prefabs.js`): what every room's design keeps clear so any two chain: a lane from each doorway to
  the room's middle (nothing within 2.2 m of its line) and the middle (2.5 m round). `npm run contracts` checks it.
- **the Solar Skiffing trial** (at the sundial in the Dunes: `SOLAR`): rings charged by the sun; a ring in shade is dark and does not
  count; closed at night. *Not:* solar skiffing itself (the skiff's sport).
- **sparkle** (`Sparkle`, `src/vfx/ostracon.js`): what shows of a buried ostracon or stele: the black catching the sun, worked out once a
  sparkle (never a pixel) and never smaller than a few lines, so it cannot crawl. *Not:* glints (the water's, or the shoal's).
- **the spout** (`DunemawSpout`, `src/vfx/dunemaw.js`): a column of sand pouring up and a **sandfall** spilling back round it; once
  the Great Dunemaw's landmark (withdrawn: the owner, 2026-10-06, the mouth is an antlion pit), now the look of a slip geyser.
- **a stele's look** (`Stele`, `src/vfx/ostracon.js`; the word is Dovina's glossary's for Espada's "ledger stone"): an Attic grave stele
  in sandstone the Courier's height, its foot in a bank of sand: a tapered shaft, rounded and spalled, a cornice, an **anthemion** (a
  palmette finial) crowning it; one painted **frieze** in the same black-figure hand on the floor of a recessed panel under the crown
  (`paintFrieze`: the town's folk and the slip jellies at work together); the town's runes cut in rows below, a faint guide line under
  each (the words it is given; with none, a bare face until Espada's sentence lands). *Not:* "ledger stone" (the ledger is the game's
  counts).
- **the stele's sandstone, laid** (`sandstoneMaterial`, `layStone`, `src/vfx/ostracon.js`): the stele's own stone on boxes, their UVs in
  metres along the axis each face looks down, so courses run on from box to box: **ashlar** (the town's isodomic courses, 0.7 m high, each block cut from the stone at its own place, sand in the
  joints: the sealed room's walls and roof) or **plain** (one monolith: the sealed room's door slab). *Not:* the ruins' columns (stone of
  their own), nor the surfaces (`render/triplanar.js`).
- **the three layers**: a **Well** (a dungeon), **the island** (action outside the Wells), **the Emocean** (travel between islands)
  (`docs/DESIGN.md`, section 11).
- **the Throwing Room** (a side room off the Workshop; `src/progress/combat/testroom.js`; Espada's name: a potter throws on the wheel, the Courier throws shots): where
  aim and recoil are measured, never earned: the Index, the **targets** (never "plates": a plate is a Veritome photograph), Strawman, the
  **spray wall** (clay that keeps every dent, so a recoil pattern is read from the wall) and the only pots that come back (they pay
  nothing). A **drill** is a run begun at the Index (Flick, Track, Spray, Recover); on a tuned game it is said and never recorded.
  Built in `src/world/testroom/`, through a door in the Workshop's east wall; the drills are measured from the **firing mark** (the ring on
  the floor, 10 m from the spray wall).
  *Not:* a trial (a minigame in its own room that pays), a playtest, the stress test.
- **the time trial** (`src/world/trial.js`): begun at the workshop's gong.
- **the twist** (`docs/plans/DUNEMAW.md`): the Great Dunemaw's rooms turned about the floor's centre, more the deeper (0, 7, 14
  degrees a cell on floors 1 to 3).
- **the Wake Whistle** (`whistle.wake`, `ECON.escape`; Espada's name, `docs/plans/SHRINES.md`): a small clay whistle that takes you out of
  a Well alive, to its mouth, with the haul and three quarters of the run's pay (Pokemon's Escape Rope, Psychonauts' Smelling Salts). It
  breaks when blown; one carried at a time. *Not:* "escape item" (the placeholder) in what the player reads.
- **warped artifact** (`FINDS.warped`): the one find a floor in a warped pocket, worth three; taking it **shifts the floor**.
- **the workshop**: the ground and upper floors: the kiln, the folk, the pots, the gong.
- **zone** (`src/render/zones.js`): a render zone, what is drawn from where the camera is. *Not:* the Zone of Influence, which is always
  named in full (or ZoI); *not* a crystal's note steps (the owner's "zones" on a crystal, 2026-10-08: say **fret**). A zone may be
  **part of** another (`partOf`): drawn on its own, but walked, lit and travelled as one with its **whole** (`wholeOf(pos)`): the beach
  is part of the dunes.
- **the zone map** (`src/render/zonemap.js`): the zones' bounds as pure numbers (`zoneOf`, `wholeOf`), for anything that asks where a
  point is without drawing: the weather's place, a Node script.
- **the Zone of Influence**: the ground the player has explored. Nothing more, for now.

## 6. The Spirit Garden, Soul Alchemy and the mycelium

- **a cascade** (`src/world/garden/cascades.js`; drawn by `src/vfx/garden/gardencascade.js`): water deep in a basin facing a linked
  planetoid spilling over to it, drawn as a ribbon of Lachryma along its arc with **spray** where it lands. *Not:* a sandfall (the
  Great Dunemaw's).
- **a garden tree** (`GardenTree`, `plantGrove`, `src/vfx/garden/gardentree.js`): a trunk of the garden's plum-dark bark, a few branches
  and a leaf canopy at their ends; the Mulberry Grove's eighteen spirit trees are a grove of them (two draws). *Not:* the cocoon tree (its
  own model, wearing a leaf canopy), nor Myggdrasil.
- **the garden's rain** (`rainOf`, `waterworks.rain()`; drawn by `src/vfx/garden/gardenrain.js`): your draught falling on every
  planetoid as hard as your mental state is liquid (Stoic dry .. Prismatic 0.9); drawn as streaks, each falling to its own planetoid's
  heart, a **drop's ring** where it lands (a ring opening on the ground or on the water: code `rings`), and the garden's sky greying.
  *Not:* the weather's streaks (the world's, `vfx/weather.js`); *not* a ripple (the water's own disturbance, `game.water.disturb`), nor
  **the ring** (the orbit's slots round the Dantian).
- **the garden's views** (`realm.camera`, `src/world/garden/gardencam.js`): **behind** the Jar (as it opens), **first person** (Z, the
  same setting as the world's), **overhead** (`: the god hand's view in the garden, straight down; W A S D moves the view, not the Jar).
  **The press view** (F at the Athanor's bath: `press`, SOUL-ALCHEMY.md 4.3): the spirit press's own framing, north locked to the press,
  left with F, Esc or W A S D; while it is open **the grey surround** (`GardenSky.surround`) eases the garden's sky, haze and fog to the
  grey of their own lightness (0.8 s in, 0.5 s out), the HUD steps out but for the log (`game.ui.want(id, on, { log })`), and the god
  hand is **half-dithered** over the bath (`HAND_FADE`, a screen door) so it never hides the soul bead. *Not:* the god hand's isometric
  view (the world's, `godhand/godhand.js`), which the garden never uses.
- **the garden's water** (`src/world/garden/water.js`, `waterworks.js`; drawn by `src/vfx/garden/gardenwater.js`): Lachryma running on a
  planetoid, a shallow-water simulation on its clay's grid that pools, spills, dries and **wears the ground** (erosion); each cell keeps
  its mix of the five feelings. A **spring** pours for good, a **drain** takes for good (the hand's WATER art sets both). A body in it
  **wades**, or **floats** when it is deeper than the body (`swim`). Drawn on the planetoid's own vertices in its feeling's colour; two
  feelings in it are an agate; opposites cancelled are **fair water** (milky, as nacre); the ground it leaves is **wet** (`aWet`: darker
  and glossier, drying over 20 real seconds). *Not:* the Dantian's lake (a look), the world's water (`game.water`).
- **the ground's materials** (`GROUND`, `src/progress/realm.js`; SPIRIT-GARDEN.md section 7): what the god hand paints a planetoid's
  ground with, one a phase: **moss** (wood, wonder), **ash** (fire, mirth), **loam** (earth, desire), **slate** (metal, grief), **silt**
  (water, dread). Free; a feature counts its ground in its formation. Drawn by `src/vfx/garden/gardengrounds.js` over the planetoid's
  skin (each in its phase's colours, its accent its feeling's), blended at their borders by height. *Not:* a material (Soul Alchemy's,
  pressed), the formation **stone** (a feature), or clay (the Courier's body; `world/garden/clay.js` is the planetoids' sculpted surface).
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
- **the keepsake pot's look** (`lekythos`, `src/vfx/garden/lekythos.js`): a white-ground **lekythos** (the Athenian funerary oil flask), in
  its spirit's colour: the spirit's **likeness** and its grave **stele** in **the white-ground hand** (`paintLikeness`, `paintStele`,
  `src/vfx/blackfigure.js`: the black-figure painter's figures outlined on a white ground and washed in a colour), a meander border and
  a ribbon (a **taenia**) in the colour. One painting is shared by every pot of one kind and colour (a feeling's canon colour when the
  pot keeps none), freed with its last pot (`lekythosShared`). *Not:* a glaze, the press's tiles.
- **the leaf canopy** (`LeafCanopy`, `canopyGeometry`, `src/vfx/garden/leafcanopy.js`; the owner, 2026-10-08): a tree's crown drawn from a
  few spheres whose every vertex is a **leaf** (a quad turned to the eye, swaying, lit by its sphere's normal, a clump from the **leaf
  atlas**: gingko, willow, round, mulberry, gill, cap), in labradorite edged and veined in gold. One program for every canopy; a canopy
  may take a **tint** (Myggdrasil's tincture: its flash leaned to a colour). *Not:* the plants (the green on the clay), a bed.
- **material** (`src/progress/econ/materials.js`): what Soul Alchemy presses, of a broad **kind** (eldritch, arcane, finery, mechanism,
  edge, art, provision), with a hue, a saturation and a **path** (the winding route it walks the Courier's colour). **The spirit press**
  (hopper, igniter, crucible): where materials are pressed. *Not:* "mats" in player text.
- **moonflower**: a Spirit Garden bed that opens only at night, by the game hour.
- **the mycelium** (`src/progress/mycelium.js`, Dovina's; `docs/plans/MYCELIUM.md`; Espada's names, proposed 2026-10-08, LORE.md "The mycelium": the strains are the **lichen** (graft), **koji** (ferment), the **inkcap** (print), the **oyster** (rot) and **witches' butter** (dissolve); the tree is **Myggdrasil**, its sap **the tincture**, its fruiting bodies **the caps** (named for the sephiroth, `CAPS`), its branches kept (`BRANCHES`)): the garden's fungi
  as transmutators. A thing's **colour signature** (`SIGNATURE`, `signatureOf`: its hue and saturation on Soul Alchemy's wheel: a
  material its own, a curio its blurb's, a fish its feeling's). A **spore bed**: a garden bed a **strain** has colonised (its fairy
  ring drawn round it; *not* the ring of bought planetoids, nor the hue ring); a strain works one **verb** by its feeling: **graft**
  (wonder: two curios into one, by a chart), **ferment** (mirth: a material's saturation up), **print** (desire: anything into a
  **spore print**, a material of exactly its colour, one straight pull), **rot** (grief: anything into materials of its colour, six
  tenths of its worth), **dissolve** (dread: saturation down). **The World Mushroom** (`TREE`; working name): the tree fed anything at
  its roots, its **sap** the colour of all it ate, its **girth** grown as its meals double, its ten **fruiting bodies** (the sephiroth)
  and twenty-two **branches** (hung with Major Arcana cards); it **fruits** at dawn, leaned by the game day's feeling (a **fair day**,
  a **prismatic day**). A **sporeling**: a fungal spirit the tree's crown gives, settling as a visitor. A **keepsake pot**: a released
  spirit fired at the Chimney into a pot that stays, standing in a ring at its foot (`progress/keepsakes.js`). **Myggdrasil's planetoid**
  (`world/garden/mycelium.js`): the seventh planetoid, given at Sinter (not bought, not on the ring), the tree on its crown, F at its roots.
  **The Grimoire of Echoes** (`feedback/codex/grimoire.js`): the Codex's page of the mycelium, what you have met only (the strains held,
  the grafts made, the tree, the branches, the pots). *Not:* a material's `path` (a branch is the tree's), a creature's mind.
- **Myggdrasil's look** (`WorldMushroom`, `src/vfx/garden/myggdrasil.js`, Calissa's; grown by its planetoid's look, `Planetoid.growMushroom`,
  and reading `game.myggdrasil` itself): the World Mushroom 48 m from its ground to its crown's top. **The stipe** (its trunk of pale
  clay, fibred, a gold **veil ring** under the crown) on **the roots** (buttresses running out over the ground, half sunk); between two of
  them **Myggdrasil's mouth** (`mouthWorld`: a cup of its clay lipped in gold, its floor a pool in the tincture's colour; where it is fed,
  and where the world's F stands; *not* the Jar's mouth, nor a Well's); above it **its face** (two round eyes with a glint, a smile, a
  blush: drawn, never carved). **The arms** carry the side caps (`CAP_SITES`: the Tree of Life's places, spiralling round the stipe); each
  cap is a leaf canopy, a dome of **scales** over a disc of **gills**, shut a **bud**, opening from its middle out by its slot's **gate**
  (`canopyOpen`; *not* the Dantian's gate), one at a time from the root up. **The branches' lights** (`BRANCH_PATHS`: the Golden Dawn's
  paths between the caps) run gold when a card is hung, a ghost before. **The mycelium's threads** run from the roots' ends over the
  ground to each spore bed on its planetoid (`threadsTo`; *not* Ariadne's thread, nor the press's thread). **Fruit** hangs on threads
  under the caps, glowing in the tincture's colour; **perches** (shelf brackets on the stipe) are where sporelings sit (`perchWorld`).
- **the plants** (the garden's: `src/world/garden/plants.js`; drawn by `src/vfx/garden/gardenplants.js`): green that spreads cell by
  cell over wet moss, loam and silt, and wilts elsewhere; seeded by a herb terrace and by moss painted. Drawn as a kind for each ground:
  **moss** cushions with fern sprigs, **herbs** on loam (a bloom at stage 3), **reeds** on silt. *Not:* a material planted in a bed
  (the beds grow materials); *not* the moss ground (the paint) or a herb terrace (a feature).
- **the press at the Athanor** (`GardenPress`, `realm.press`, `src/world/garden/press.js`; its look Calissa's, `src/vfx/alchemy/`, handed
  the station's calls by `pressbath.js`): the station on the Athanor's crown: the **bath** (the colour wheel, 5 m across, no numbers: a
  dish of still black Lachryma, moved from the drum's pool to the basin), the **basin** it lies in (`vfx/alchemy/basin.js`), its **grey
  centre** (a disc of bare clay 25 cm across, wheelColour's own grey), its three **throwing lines** (faint grooves a third out, on the
  tiles' circle and at the lip), its **kerb** (basalt, with each **attribute's seal** carved in it: the potter's chop, filled with the
  tile's glaze, `vfx/alchemy/seals.js`; *not* "glyph", the glyph pop's word), the **ware ring** (the Pneuka Box's materials laid out as
  **lumps** at their hues), the seven **tiles** (a swatch: its tile, its **spread**, the **spread's break** at its edge, **a tile's heart**,
  always in full; a **yohen star** on its face for each true firing), the **soul bead**, the **ghost path** and **ghost bead** ahead of
  it, the **line blend** a press leaves, and **the draught's current** (sheen drifting toward the draught's bearing, never a tint);
  the press 4.35 m north on **the press's footing** (a round of the basin's stone, level with the bath: `FOOTING`), the plate shrine in
  its own **hokora** on the east shoulder (`Hokora`, `src/vfx/garden/hokora.js`: a roadside hokora in small, its plate leant at the
  doors). **The press's look** (`PressLook`, `src/vfx/alchemy/presslook.js`) is everything the station shows, read from it each frame:
  **a firing's look** (`src/vfx/alchemy/firing.js`): the **hit-stop**, the **burning glass** (the eye's pinpoint on the bead), the
  **kiln heat** and the **crazing** it leaves on the tile, the tile shrinking a step; and **the refusals' look**: **the crawl** (the
  bead beaded up tight, bared clay round it; *not* the aliasing crawl), **a break's glint** (the nearest spread's break catching the
  light on the side facing the bead; always so qualified, *not* the water's glints or the shoal's), **the gutter** (the press's lantern
  going out in a thread of smoke); and after a true firing **the Jar's breath** (`jar.breath`: the Pneuka Jar's mouth breathing the soul colour). Its **formation** (`press.formation()`) is fire's, counting the Athanor's
  features, the ground under it and the water at it; a firing's fuel is divided by it (Dovina's ruling 3). *Not:* the plate shrine (its hokora). [The earlier copy of this entry said "its look a stand-in, `pressbath.js`", and was cut off mid-sentence at "counting the Athanor's"; its fuller text is above, its ending here.]
- **the press's marks** (`Marks`, `src/vfx/alchemy/marks.js`): the self-lit things on and round the bath (tiles, seals, droplets, paths,
  the beads, the lumps) as one instanced program, layered by instance order. *Not:* a world mark (a mark on a thing, carrying no words:
  these carry none either, but are the press's own).
- **the ring** (`ORBIT`, `src/world/garden/orbit.js`): the ten slots round the Dantian where a **bought planetoid** is set (the
  Moonflower Moon, the Koi Pond, the Drill Yard, the Bone Bed, in turn); bought at the shed, its **seed** is carried by the god hand
  into the open sky and let go there; each wears its own look (`src/vfx/garden/boughtplanetoids.js`). *Not:* the hue ring (the spirit
  press's), the upper ring (the bowl's gallery).
- **seasoning** (an attribute's: `docs/plans/SOUL-ALCHEMY.md`): 0 .. 100 filled by doing that attribute's thing anywhere (a parry seasons
  Perception, a crack mended Resilience); it widens the attribute's **swatch** (its target on the colour wheel) and firing spends it.
  A **true firing** is one inside **a tile's heart** (a quarter of the attribute's bare rank radius, which seasoning never widens): said, counted, kept as a yohen star. **One firing a press**: pressing cocks the lever, a firing lets it down. A material **pulls** the soul colour toward its own colour (Newton's centre of gravity), so a complement greys by itself. *Not:* a stage of a glaze, or a Firing.
- **Soul Alchemy** (`game.alchemy`, `src/progress/alchemy.js`): pressing materials at **the spirit press** walks the Courier's **soul colour**
  (a hue and a saturation on the colour wheel) along their paths; **firing** it while the colour sits in an **attribute**'s target raises that
  attribute a **rank**. Seven attributes (Willpower, Focus, Charisma, Perception, Dexterity, Visualization, Resilience), each widening
  the **vessel** as a domain widens the tools. *Not:* "stats"; Luck is apart.
- **the Spirit Garden** (`game.garden`, `src/progress/garden.js`; renamed from "the Shrine Garden" by the owner, 2026-10-06): the pocket
  dimension inside your Pneuka Jar, entered at a **Shrine**: the mastery dividend's **slots** (each worked by a **mastered** encounter:
  every achievement of its group done), the **beds** (a material planted grows more of its kind), and the upgrades (the long sink). The
  **Pneuka Box** is its shed: the one part of it reachable anywhere (P). *Not:* "Shrine Garden" (retired).
- **the spirit press**'s model (`SpiritPress`, `src/vfx/spiritpress.js`, after the owner's concept): a living shrine of root and leaf
  over a stone drum. The hopper is the crown's spiral mouth; the igniter is the platter's eye and the lever with its ball; the crucible
  is the hourglass in the pool. **the drum's pool**: the pool on the drum, the soul colour as a liquid, turning, brighter when fired (it
  was "the bath" until 2026-10-08: the bath is the press's basin now). **the root spout**: a root grown from the drum's front lip over
  the ware ring and the kerb to the bath's north lip (the tsukubai's kakei); **the thread**: the soul running from the eye's drop down
  through the hourglass and along the root into the bath while it presses. **the ball** (the lever's): up after a press, down at its
  stop after a firing; its **ember** warms in it while the bead is inside a spread. **the press's lantern** (never
  "the lantern" alone: the garden has stone lanterns): tall when your cubes cover a firing here, low when not. **the hue ring** (`HueRing`, `src/vfx/alchemy/huering.js`): seven lights circling the press, one per
  attribute at its hue; away from the press view the one the soul colour is inside comes close and burns; in it they **settle** into
  their seals (one at a time, clockwise from Willpower), **lift** over the tile whose spread the bead enters, **dive** into it at a
  firing, and go home. **soul glow**: the vessel's skin lit from inside in the soul colour, drawn by wheelColour's Oklab at one
  lightness for every hue: the soul's chroma at one strength once off grey, never its brightness (none while grey); brighter for a few
  real seconds after a true firing.
- **a sporeling's look** (`sporeling`, `src/vfx/garden/sporeling.js`): a cap for a head in its fruit's colour, spotted; labradorite
  gills edged in gold; a stem body with two eyes; hyphae for limbs; an idle sway, a waddle, a **hop** of its own (a squash, a stretch,
  feet tucked; *not* the Emocean's hop, nor the Jar's hop). Its mind is Petra's.
- **the strains' looks** (`strainBed`, `STRAIN_FUNGI`, `src/vfx/garden/strains.js`; the mycelium is Dovina's, `docs/plans/MYCELIUM.md`):
  a spore bed drawn as its strain's real fungus on what it grows on: the **lichen** (wonder: crusts, leafy **rosettes** and pixie cups on
  boulders and bark), **koji** (mirth: Aspergillus oryzae over rice in two cedar trays, a **koji-buta** each), the **inkcap** (desire:
  shaggy inkcaps on loam, dissolving into **ink** from the rim), the **oyster** (grief: shelves on a rotting log and a stump), **witches'
  butter** (dread: yellow-orange jelly on dead branches); in code a strain is its feeling, its fungus `lichen` .. `butter`. Its
  **growth** (0 inoculated .. 1 full) brings each part up from its foot. **Foxfire** (`foxfireColour`): what glows at night in the
  garden's fungi (the strains, a fairy ring's fruit, a sporeling's gills), the feeling's canon colour lifted to a glow's lightness, a
  slow breath and never a flicker; *not* a light (no lamp is lent). **A fairy ring**: round a spore bed, a narrow dead edge, a darker
  lusher **sward** outside it and the strain's own small growths on it; *not* the ring of bought planetoids, the hue ring, a ripple.
- **terraforming** (the hand's strokes on the clay, `src/world/garden/clay.js`): pull, press, smooth, **flatten** (to the height where
  the stroke began), carve, **roughen**; a stroke's **size** (Shift and the wheel); **undo** (Ctrl+Z, ten strokes).
- **a track** (the garden's: `src/world/garden/races.js`): a groove the hand carved in one stroke that closes on itself, 40 m or more;
  the spirits on its planetoid **race** a lap on it (Dovina's `RACE`). *Not:* a music track (the sound test's), the course.
- **wheelColour** (`src/vfx/wheelcolour.js`, SOUL-ALCHEMY.md 4.16): the one colour function of the colour wheel, in Oklab: every colour
  at the press is drawn by it (the tiles, the seals' glaze, the soul bead, the paths, the droplets, the lumps), so a bead and its tile
  are the same colour when they are the same place. **self-lit** (`selfLit`, `src/vfx/selflit.js`): a surface drawn with the frame's
  tone curve and grade undone, so it shows exactly the colour it was given; *not* emissive (it never glows past what it is).

## 7. The Emocean and the rail

- **the ambient geometry** (`RailGeometry`, `vfx/railgeometry.js`; Calissa's): the Mind's furniture the rail runs through, drawn in
  labradorite and wire: **rail rings** (`G.ring`: tori to thread, lit in the storm's gold when threaded), **folding lattices**
  (`G.lattice`: Miura-ori sheets that fold and open as the rail passes), **monoliths** (`G.monolith`: black labradorite slabs, 1 : 4 : 9,
  rising out of the crude) and **the folded sea** (`G.ceiling`: the crude's surface turned up over the horizon like a page, lying
  overhead). *Not:* the Solar Skiffing rings (`SolarRing`), the macro lattice (reprogramming's), a ceiling of a room.
- **the Astral form**, **the Umbral form**, **the surge** (`docs/plans/RAIL-OVERHAUL.md`; the owner's names, 2026-10-08): the ship above
  the Emocean and below it, Q to breach or dive (was polarity: a shot of your form's kind is absorbed, the other hurts; an **astral
  shot** bright, an **umbral shot** dark); the surge fills by absorbing and lets the full swarm of lances go on R, its price the chain.
  **A turn of the rail**: the four bars between two legs where the spline bends, dives or breaches into the next. *Not:* a seam (a
  change of place under cover).
- **a boss part** (`BossPart`, `BossParts`, `src/vfx/bossparts.js`; Calissa's, 2026-10-08): one piece of a leg's big object that the
  runtime hits and breaks on its own: **intact**, **damaged**, **broken**, or **sealed** (not to be hit yet: Ikaruga's covers); drawn in
  line and glow (the Mind's labradorite); its **telegraph anchor** (`telegraphAnchor`) is where the shrinking mark sits, and its
  **windup** is the part's own body telegraph. The False Light's: the **rigging** (four slings and the whole rig), six **gunports**,
  the **keel** (seen from below) and **the figurehead's lamp** (her core); Old Nobody's: eight **gills** (from below), six **teeth**
  (tusks, from above), the **eye** and the **throat**, and it **quickens** as its gills shut; the Drowned Light's: its **lamp** and six
  **windows**; Charybdis's: eight **baleen combs**, six **eyes** and the **throat** (below). *Not:* a zone's `partOf`; `rail.part` is
  the event that one was downed.
- **a continue** (`continueCost`, `voyage.continueRun`): the rail's arcade coin when the ship has borne all it can; priced by the way back
  to your last Shrine, doubling each time in one crossing; declined, the ship **breaks up** and you are made whole at that Shrine.
- **the crossing** (`progress/rail/crossing.js`, `docs/plans/RAIL.md`): a stage as it plays, 100 bars of the cue: its **acts** (launch,
  schools, pincer, darters, breather, the set piece, arrive), each held in a **view**, the camera's grammar: **chase** (Star Fox),
  **above** (Ikaruga), **side** (Einhander), **free** (Sin & Punishment), **astern** (looking back). A **swing** is the change of view:
  one bar, on a bar line, and nothing enters during it.
- **the crossing's look** (`CrossingLook`, `game.emocean.looks`, `src/vfx/crossinglook.js`; Calissa's): the storm looks laid on the crossing
  as it plays, read from the stage each frame: the storm warp's strength by the leg's phase, the waypoint's weather and a turn of the rail;
  the lift; the ambient geometry hung on the spline (**turn rings**, threaded through a turn of the rail on its heartline; **flank
  monoliths**, rising beside a fight leg); the wake left in the air along a turn's figure; **the surge's shell** (three great circles of
  light turning round the ship while the surge keeps it untouchable); and the trip's pressures on the ship: **the hull's scars** (`Sloop.scars`:
  the hull's open cracks, dark seams with the crude in them, carried leg to leg, turning to gold when caulked), **the bunker's bottle** (a
  Lachrymato Bottle on the sloop's deck, its level the fuel left), and **the current's streaks** (adrift: pale lines overtaking the ship).
  *Not:* the crossing (a stage as it plays, Petra's), the shell of a psygun (a caster shell).
- **the crude sea** (`src/vfx/crudesea.js`): the Emocean's surface where the ships sail, liquid Lachryma: black, its swells real, its
  current scrolled, its film in bands. **calm**: the swells laid down for the stage's breather.
- **the drawn surface**, **the lift** (`CrudeSea.lift`, `surfaceAt`; set by `vfx/crossinglook.js`): in the Umbral form the crude sea is
  DRAWN higher, over the fight and the eye, while the sea the logic rides (`heightAt`: the swells, the brig, the shoal's boil) stays
  where it is; a dive is the drawn surface sweeping up past the ship and the lens, a breach the same down. *Not:* a drift tide, the folded sea.
- **the Drowned Light** (`DrownedLight`, `src/vfx/drownedlighthouse.js`; the plan's name, Espada's to settle): the graveyard leg's peak, a
  lighthouse sunk to its gallery in the crude: its lamp **wakes** and sweeps, its windows burn, the reef, the **sunken hulls** below
  (the Umbral) and their **ghost ships** riding above (the Astral, pale and translucent). *Not:* the Lamp Shrine (at the Dunemaw's lip).
- **an encounter's film** (`EncounterFilm`, `game.encounterFilm`, `src/vfx/encounters/film.js`; its camera the sequence `sea.<encounter>`,
  `src/vfx/encounters/sequences.js`): an encounter at sea played as a short cinematic, two camera shots in about 5.6 real seconds (the
  arrival's four bars), before its choice is offered. **a tableau** (`buildTableau`, `src/vfx/encounters/tableaux.js`): what is out on
  the crude for it: the Dead Reckoners' ghost ships in fog, Letty's cutter the Last Word, the Cantor's light under the crude, Hap Lagan's
  raft and Bob, the Bourse at anchor, your double in silver, the drift bottle in its shaft of light; its **subject** is what the second
  camera shot closes on. *Not:* a set piece (a crossing's fight), a scene (three.js's), a sighting (the sea chart's mark of one unmet).
- **a figure** (`FIGURES`, `world/emocean/railpath.js`, Petra's): what a turn of the rail flies, the frame carrying everything that
  fights: a **weave** (out across the sea and back, banked), a **crest** (up over a rise and down), a **corkscrew** (rolled once about
  the line: the sea overhead at its middle), a **vertical loop** (code `verticalLoop`: pitched once round, over on its back). Each turns
  about **the heartline** (the ship's cruise line, `CRUISE` up the frame), never about the rail point. Through the legs the rail is
  straight and level, but for **the arena** (`arena`, `arenaCentre`): a maelstrom leg's peak, whole laps round the whirlpool, banked in,
  Charybdis held at its centre (`world/emocean/charybdis.js`, rising Astral and diving Umbral by turns of four bars). *Not:* a swell
  (the crude sea's), a loop (an emote held, or the thread's), a turn of the rail (the four bars), the maelstrom (the leg, a place).
- **the flock** (`creatures/ai/flock.js`): many bodies moving as one (Reynolds' boids), the AI part the shoal is made of. *Not:* a
  school (a wave's role).
- **a glint's spark** (`vfx/shoal.js`): how a glint is drawn far off, two triangles along its heading, never under 2 px; near, it is
  a fish; between, the fish shrinks into its spark. In the frenzy a striking glint's spark is drawn behind it as a **streak**.
  *Not:* the Vessoul's soulspark.
- **hop** (`hop()`, `src/progress/econ/emocean.js`): one crossing of the Emocean from one island to another, on the **node map** (one node
  an island, at its place on the Law-Chaos line). Its fuel is the price of a full **tank** (`hop().fuel`, the ship's `fill`), and it is sailed as one **stage**.
- **the hurtbox** (the ship's: `T.ship.hurt`, drawn by `vfx/railshots.js`): the sphere a foe's shot must touch to hit the ship, drawn in
  the hull as a pale core and a dark ring whose outer edge is its radius exactly. *Not:* a hit region (the vessel's six).
- **an Itano ribbon** (`vfx/itano.js`, after Ichiro Itano's missile barrages): the trail a lance leaves, the last 0.6 real seconds of
  where it flew, tapering, a hot spark at its head. *Not:* a weapon trail (`vfx/trail.js`, a blade's).
- **lane mark** (`lane.mark` in the library): Divination's mark on the Emocean's rail where a wave will come, up to 3 s ahead: a column
  of labradorite standing out of the crude, a whirl on the surface, rings on the beat of its approach (no words or numbers).
- **a laser's warning thread** (`RailShots.beam`, the shot field's): a laser's line before it burns, a thread of its kind's light a pixel
  and a half wide, never thinner; hot, the beam is a capsule of its kind as wide as what it hurts. *Not:* a lane mark, the wire compass.
- **leg** (`LEG`, `legsOf`, `progress/econ/emocean.js`): one set piece of a long crossing; a crossing has one to three (the owner,
  2026-10-07), a **breather** between two whose flotsam **mends** the ship.
- **a leg's schedule** (`schedule`, `LEGS`, `src/progress/rail/legs.js`, Dovina's): what a waypoint's leg throws at the ship bar by bar
  (its waves, its patterns and their throwers, lights to lock, its director's entrance), in its phases (open, build, peak, release),
  shaped by the waypoint (class, feeling, storm) and held to the pacing law (`idle`: no two bars with nothing in reach; `node
  scripts/legs.mjs`). **the leg runner** (`LegRunner`, `world/emocean/legrunner.js`) plays it; **the pattern player** (`PatternPlayer`,
  `world/emocean/patternplayer.js`) releases a pattern's shots from its thrower, turned onto the ship as they fire; **the shot field**
  (`ShotField`, `world/emocean/shotfield.js`) flies every foe's shot (400 at most) and says what a shot meeting the ship means (drunk,
  turned, sent home, taken). **a light** (`rail.light`): a thing adrift to lock for its pay, never firing (the calm's, the release's).
  **a thrower**: the foe (or fixed point, `AHEAD`) a pattern fires from; downed, its unfired volleys go with it. *Not:* the old
  `courier/ship/shots.js` (the ship's own gun and lances, kept).
- **a lighthouse lamp** (`LighthouseLamp`, `src/vfx/lighthouselamp.js`): a caged Fresnel lamp and the beam it sweeps, first a **warning
  line** (thin and pale, harmless) then **hot** (white-gold over a dark rim); the figurehead's lamp (with iron **shutters**) and the
  Drowned Light's. *Not:* a room (the log's word), a PointLight (`render/lights.js`).
- **the lock-on** (RMB held on the rail): the reticle paints up to eight targets; release fires a **lance** at each, together a
  **volley** (RayStorm). *Not:* the lock-on reticle on foot (the same word, the same idea: a target held).
- **Margarite's dock** (`world/emocean/margarite.js`, zone `margarite`): the King's island's quay and pier on the crude, its lamp
  tower, the Pearl Shrine, the Purser and Letty Marque; the **posted board** beside the Purser is the price (F at it: the Purser's
  counter). *Not:* Margarite (the island, of which the dock is all that is built).
- **the mooring** (`Mooring`, `game.mooring`, `src/vfx/mooring.js`): the hull chosen at the pier lying alongside its end at life size,
  its sails **furled** (a ship look's `set` at `FURL` or under, `furlRoll`, `vfx/sloop.js`: the canvas stowed, the main flaked and tied on
  the boom amidships, the jib rolled on its stay, each course on its yard; never a sail squashed flat); a mount's preview rides it.
  *Not:* the jetty (the plank walk), the pier's page.
- **a mount's preview** (`MountPreview`, `MOUNT_LOOK`, `src/vfx/mountpreview.js`; `game.mooring.preview(tool)`, called by the pier's
  page on the row hovered and on the mount last taken aboard; CLARITY.md section 6, Into the Breach's): what a mount does, drawn as a
  world mark on the crude round the moored hull, one at a time, gone when none is chosen or the Courier leaves the pier. At its size
  round the ship at sea (every hull flies at **a quarter of its size** at the rail, `AT_SEA`, so a range of 10 m there is 42 m round
  the moored hull), from **the nose** (`NOSE`, 0.9 m ahead of the ship's middle at the rail), each a shape (`MOUNT_LOOK[tool].shape`):
  the Blaster's **line of fire** (`fireLine`) and its two reticles; Absorb Spray's **fan** (`sprayFan`, arcs spraying out); the Bomb's
  **blast ring** (`blastRing`) and the beat's (faint, broken) with a shockwave going out; the Vacuum's **cone** (`drawCone`, arcs drawn
  in); the Snapshot's **viewfinder** (`viewfinder`: the camera's frame standing on the sea, its frustum faint); the Grapple's **grapnel
  line** (`grapnel`: to its range, two flukes at its end, the aim's arc faint); the Radar's **scan** (`radarScan`: range circles and a
  **scan line**, clockwise from above, once in four real seconds). Drawn in the rail mark's **wire** style (`STYLE.wire`, `vfx/railmark.js`): screen-space,
  the mount's colour (`MOUNT_LOOK`; the ship's feeling for the Blaster and Absorb Spray) with the Mind's schiller along its heart,
  lifted over the drawn crude and depth-tested (the jetty, the hull and the Courier hide it; the sand above the waterline covers it). The
  pier's page pauses the game, so the loop ticks the mooring under it (the preview fades in and moves while a mount is chosen), the page is
  **set aside** from the hull, and a page shut puts the preview back to the mount taken aboard (the pointer sends no leave).
  *Not:* the card's demo loop (CLARITY.md section 6, a loop beside a card), the lock-on reticle, a lane mark.
- **mount** (`MOUNTS`, `progress/rail/mounts.js`): a worn tool carried on the ship, as many as its hull's slots chosen at the pier (`slotsOf`: sloop 2, frigate 3, destroyer 2, tanker and galleon 1; the owner, 2026-10-08) (the wake brush, the toll, the
  gulp, the plate, the hook, the vane); the psygun is always the gun. *Not:* a ship part (the ships have none).
- **par**, **rank**, **medal**, **the tally** (`progress/rail/score.js`): par is an expert's median score for a set piece (measured,
  `scripts/rail.mjs`); a crossing's rank is its score against par (S, A, B, C, D); the medal is Star Fox's (passed, four in five
  downed); the tally is the crossing's last line in the log.
- **the pier** (`world/emocean/pier.js`): F at a jetty's end opens it, the node map as a list (where the fuel reaches, or why not) and
  the two **mounts** to take; choosing an island boards and casts off. Each island has one (Anagami's jetty, Margarite's dock), and a
  crossing makes port at the pier of the island it sails to.
- **plain shot**, **outlined shot** (`courier/ship/shots.js`): a foe's shot at sea. A plain one has a feeling (absorbed if it is the
  ship's, else it hurts; the roll turns it); an outlined one wears the parry mark and only the parry answers it, home to its thrower.
  Drawn (`vfx/railshots.js`, one instanced draw over everything): an **astral shot** a white-gold core with a dark rim, an **umbral
  shot** a black core with a pale rim, each a capsule from its **tail** to its **head** (the hit sphere's centre), the tail as long as it
  is fast; until the forms, a plain shot of the ship's home feeling is drawn astral and any other umbral.
- **polarity** (Q on the rail; to be the Astral and Umbral forms: RAIL-OVERHAUL.md): the ship's feeling, your draught or its opposite; a shot of the ship's feeling is **absorbed** (drunk:
  Lachryma to the pool) instead of hurting (Ikaruga).
- **the rail** (`world/emocean/stage.js`, `game.emocean`): the crossing as it is sailed, a straight line in a zone of its own (`emocean`)
  at the dunes' layer. Everything that fights is kept in **the rail's frame** (x across, y up, z along) about the **rail point**, which
  the **stage clock** moves (the cue as heard, else its own). The **ship** (`courier/ship/ship.js`) is the sloop at the rail, in a
  **box** about the rail point; the view's **plane** says which two of its three numbers WASD moves (screen, sea, wall). *Not:* a
  rail you grind or a rope (the Courier's moves).
- **reckoning** (`RECKON`, `reckonLead`): how much of a crossing the Courier has divined (Divination), 0 .. 1, for that day; it marks the
  waves' lanes ahead and opens the way to a node not yet found. *Not:* "course" (the basement's loop of stations).
- **the rutter's model** (`Rutter`, `rutterThing`, `src/vfx/rutter.js`): a small bound book in black-green morocco, its front board
  tooled in gilt with its own passage (the islands as gilt stamps, the waypoints sailed as studs, a blind wind rose under them); open,
  its spread is that game day's sea chart in ink, ruled in red, and the crossing's rank stamped in vermilion: **the rank's chop**.
- **the sea chart**, **the passage**, **a waypoint**, **a portent**, **the reckoning** (of the sea), **a rutter** (`docs/plans/PASSAGE.md`; the window `SeaChart`, `world/emocean/seachart.js`, from the pier's THE SEA CHART row; the item `rutter`;
  `src/progress/econ/passage.js`, Dovina's; the words Espada's, approved by the owner 2026-10-08): the sea chart is the constellation of waypoints laid
  between two islands at the pier (lanes that merge, never cross; a pure function of the route and the game day); the passage is the
  path you draft through it, a waypoint a column; a waypoint is one leg (its set piece, or a calm); a portent is what Divination shows
  of a waypoint, a shortlist of candidates that narrows as its confidence grows and fades with depth; the reckoning is the
  survey at the pier (the Dreamvane's dowse held over the sea chart: `voyage.reckon`); a rutter (item `rutter`) is a passage's map,
  made by sailing it to the end, sold or used that game day. *Not:* the course (the basement's), "forecast" (the weather's), a
  Cogitomap (a Well's), the node map (the islands).
- **the sea chart's look** (`SeaChartCanvas`, `drawSeaChart`, `src/ui/seachart/seachart.js`; the pixel art `src/ui/seachart/icons.js`;
  PASSAGE.md, Dovina's sea chart drawn): pixel art at 1x on the maker's ramp, scaled by whole numbers, over the crude with a
  portolan's rhumb lines and wind rose laid faint. A **waypoint icon** is its **silhouette** (its class's shape: a diamond for a threat,
  a ring for a haven, a radiant star for a boss; crisp whenever the class is known) and its **emblem** (its type's picture inside: the
  shoal's school of glints, the Wreckers' brig with the false light, the eyewall's bolt, the graveyard's grave-cross masts, the
  maelstrom's spiral, Old Nobody's flukes, a bounty's sight, a calm's half sun over level water, an encounter's lantern), both in
  **the line hand** (a pale labradorite, never a feeling's colour). **A waypoint's nimbus** (`drawNimbus`, `ui/seachart/nimbus.js`):
  its feeling shown round the icon, a glow in the feeling's colour with the weather's motif inside (wonder's motes, mirth's facets,
  desire's sand, grief's streaks, dread's smoke), from the silhouette tier up. A portent's **candidates** are overlaid a little apart,
  out of focus and faded by its confidence, one in front at a time. The sea chart's lanes are lines of light, the drafted ones
  gold-white, a squall's bent; the draught's trump runs along its lane as beads of the trumping feeling. The same drawing in ink
  (`look: 'ink'`) is a rutter's page. *Not:* the pier's window (`SeaChart`, `world/emocean/seachart.js`: the drafting and the reckoning; this is only
  its drawing), the map (Mind Mapping), a glyph (the glyph pop's), a sigil (the Soul Brush's), the
  weather's halo (wonder by day), an aura (a status's).
- **set piece** (`SET_PIECES`, `progress/rail/setpieces.js`): the crossing's second half, one of three: **the shoal** (a boid school of
  **glints**: its caller is **the Conductor**, the **bait ball** it rings the ship in, the **frenzy** of its strikes), **the Wreckers**
  (the pirates: Contractors under no letter; their brig **the False Light**: hull, rigging, gunports; **boarders** who take casks), and
  **Old Nobody** (the rogue Leviathan, an Egregore: rare, a deck; **driven off** or **felled**; then Letty's "WANTED: NOBODY"). The
  names are Espada's (`docs/LORE.md`, "The crossing's cast"). *Not:* an
  encounter (the Spirit Garden's: an achievement group mastered).
- **ship** (the Emocean's rail-shooter layer): the Vessoul's sailing form between Islands of Ego, classed by real nomenclature: **sloop**,
  **frigate**, **tanker**, **destroyer**, **galleon**. *Not:* the skiff.
- **the ship classes' looks** (`ShipClassLook`, `SHIP_FORMS`, `shipLook(id)`, `src/vfx/shipclasses.js`, Calissa's): the frigate, the
  destroyer, the galleon and the tanker drawn in the sloop's design language, **the hull class's silhouette rules** (a pot thrown and laid
  on its side, the foot its bow, its mouth astern glowing with the drive; kintsugi gold; the little Pneuka Jar for a figurehead; the
  skiff's green spars and red pennant; the Mind's line along the gunwale): the frigate a **meiping** in ash-glazed stoneware, its guns
  in rings down each side; the destroyer a **kinuta** celadon mallet vase, its long neck a submarine's tail, **the destroyer's fin** amidships
  and the vase's **phoenix ears** for tail fins; the galleon a **ginger jar** in blue-and-white, its **lid** the stern castle; the tanker
  an **onggi** riding low, **the hold's domes** (little lidded onggi) down its deck. Shown on the rail when that hull sails and at the
  pier (the mooring). *Not:* a ship part (the ships have none), a fin of Old Nobody's.
- **the shoal's silhouette** (`silhouetteTargets`, `vfx/shoalsilhouette.js`; the owner's plan, RAIL-OVERHAUL.md section 6): at the shoal
  leg's peak the school drawn up into one giant body, a Leviathan's profile (the class's great body, not Old Nobody), lit from within
  (`glow`); its **eye** (`SilhouetteEye`), a labradorite lens that opens, burns while it is locked and cracks as it is hurt, is the one
  place that breaks it. The player's words for both are Espada's (placeholders). *Not:* Old Nobody's shadow on the sea.
- **stage** (`STAGE`): the rail-shooter run of a hop, about two minutes, authored once; its waves are written by **role** (`school`,
  `darter`, `heavy`), and the route's **danger** (where it runs on the line, and how far) says which Figment class fills each role. A
  ship **bears** six hits before the stage is failed. *Not:* "shield" (the Courier's Lachryma pool), "level" (a domain's).
- **the storm warp** (`game.stormWarp`, `src/vfx/stormwarp.js`): the crossing caught in a psychic storm: the environment (the crude sea,
  the sky and its clouds, the ambient geometry, the big objects) bent in the vertex shader, never the danger (the shots, the hurtbox, the
  ship, the reticles, the HUD). Its parts: **the droop** (the world ahead falling away with distance), **the sway** (a slow drift by an
  angle), **the whorl** (the far world turned about the view's axis; *not* the twist, the Great Dunemaw's rooms); a big object is
  **seated** (drawn whole, shifted to where the storm draws the world at its place, by at most `STORM.seat`, 0.4 m, so its parts stay on
  their hurtboxes). Its strength (0..1) is a leg's **storm**, the waypoint's weather and the Courier's mental state (Prismatic warps the
  most), scaled by the setting `visual.warp`. *Not:* the weather (an island's mood); the glitch (a pulse).
- **the telegraph mark** (`vfx/telegraph.js`; Elemental Gearbolt's): a ring closing on a part about to act over its windup, the part's
  own ring waiting fainter where it closes, both gone at the act; the parry mark's line weight, never its meaning. *Not:* the parry
  mark ("answer this"), a lane mark (Divination's, on the sea), a windup (the creature's own listing).
- **the trip's pressures** (`src/progress/rail/trip.js`, Dovina's; PASSAGE.md section 14; the player's words Espada's, LORE.md "The
  trip's pressures"): **the hull** (the ship's `bears`, carried from leg to leg, mended only at a haven); **the bunker** (code `tank`:
  the fuel a ship carries, in **measures**; filling it is **bunkering**, at the pier and at a calm's buoy; *not* "tank", which is the
  tanker's and the Lachrymato Bottle's never-word); **burn** (the measures a waypoint costs: its type's times the ship's; *not* the hop's
  price, which is `fill`); **adrift** (short of every way on's burn: the current carries the ship, two to one straight on, its legs
  capped at a C); **heaving to** (code `campfire`, a calm's choice: **caulk the hull** (code `mend`, half the hull back) or **reckon
  the sea** (code `reckon`, the portents ahead a quarter sharper)); **high water** (code `best`: the best score on one route's sea
  chart for one game day, `voyage.bestOf`); **a waypoint's feeling** (its aspect, carried out to sea in an island's **plume**: shown as
  a nimbus round its portent's silhouette from the silhouette up (Calissa's; the halo is the weather's); it sets its foes' damage type and how its shots fall
  between the forms); **a following sea** (code `draughtTrump`: the draught a leg leaves trumping the next waypoint's foes); **a
  squall** (code `storm`, `STORM`: Slay the Spire's burning elite, where two plumes meet at a **front**: a threat waypoint a class
  stronger, always shown, never in a narrows). *Not:* the weather's storm (there is none: the eyewall is a leg), the vessel's cracks
  (the hull is the ship's), a chain (the ledger's or the rail's).
- **the Umbral** (`game.umbral`, `src/vfx/umbral.js`): the world below the Emocean's surface, where the ship's Umbral form fights: **the
  meniscus** (the crude sea seen from below, `CrudeSea.under`: a dark mirror of the deep past the critical angle, Snell's window of the
  air above inside it, the oil film's light leaking through, the bellies of things floating above as soft shadows), **the column** (the
  deep's black-violet fog, motes of Lachryma rising), the **caustics** thrown down onto what is under it (`causticsOn`: a caustic
  overlay; or through `warpMaterial`). **The surface crossing** (Q, a half-bar): the **splash ring** on the surface, a crown of crude,
  and the line of the surface wiped across the lens (the crown is the dive's, `vfx/waterfx.js`, thrown on the crude). *Not:* the crossing (a stage as it plays).
- **a vantage** (Old Nobody's, `vantage(name)`: `above`, `below`, `flank`, `ahead`; Charybdis's: `above`, `flank`, `below`): where a rail
  circling it sees a part best. *Not:* a station (a course station, the kiln station).
- **the whirlpool** (`Whirlpool`, `sea.whirlpool()`, `src/vfx/whirlpool.js`; Calissa's, 2026-10-08): the maelstrom's crude turning round
  **the whirlpool's heart** (`whirlHeart`: the point on the sea the arena's laps circle, where Charybdis is held; the arena's centre with
  the frame's bank taken out), drawn on the crude sea's own program (a disc of its material, `uDisc`) as a Rankine vortex: **the vortex's
  core** turning as one body (its surface a paraboloid), the slope round it falling as 1/r², the speed rising inward; the current's
  streaks and the oil film wound in toward its middle in two phases of a flow map (Portal 2's), its walls lit as Poe's were, a bow of the
  film's colours over its middle, leaning to the waypoint's feeling. It turns **the way the arena's ship laps** (`sense`, +1 or -1 from the
  arena's sign), Charybdis with it. It **swallows** (Charybdis dived: deep and fast, the crude pouring
  over its lip into its maw: **the pour**, a skirt hung from its inner edge) and **spits** (risen: shallow and slow, the bands streaming
  out round its sheath). The logic's sea has it too (`heightAt`). *Not:* the maelstrom (the leg, a waypoint's type), the whorl (the storm
  warp's), the ring (the orbit's), a ripple, the vortex's core as "the core" (the Great Slip Jelly's weak point).
- **Charybdis's look** (`CharybdisLook`, `src/vfx/charybdis.js`; Calissa's, 2026-10-08; drawn by `vfx/crossinglook.js`, held by Petra's
  `world/emocean/charybdis.js`): a whale's body stood on end in the crude with only its mouth at the top. **Its maw**: a round gape, **its
  lip** a rim of crude hide, **the gullet** inside rowed with labradorite teeth as a lamprey's, **the throat** (a boss part, `throat`:
  the gullet's light at its bottom in the feeling's colour, seen from above; it swells before it swallows) and eight **baleen combs**
  of five plates standing round the lip (`baleen.0`..`baleen.7`: from above and the side; they flare as their windup). Its six **eyes**
  under the lip (`eye.0`..`eye.5`: from the side, and from under the surface as it dives), each in a ring of labradorite **tubercles**
  (a humpback's knobs). **The throat pouch**: one side of its head ballooned and pleated as a lunging humpback's, its **throat pleats**
  wound down its neck; opposite, **its rostrum**, a ridge up to the lip with the tubercles in rows. **The sheath**: a column of crude
  whirling round its neck, where the whirlpool meets it when it spits. Below the crude, its chest, two humpback **flippers** and its
  flukes. Risen, it **leans** its maw toward the ship (about the lip's middle, so what is struck is where it is drawn). Its five moods: the
  feeling's colour in its eyes, its throat and the whirlpool's film, and in how it moves. *Not:* Old Nobody's throat or eye (another
  beast's parts of the same names: always "Charybdis's"), the Jar's mouth, a Well's mouth, the False Light's keel.
- **the veil** (`game.glitch.veil`, drawn in the glitch's pass): the storm warp's and the Umbral's share of the screen: the haze (the
  frame sampled through slow scrolling noise, toward the edges), the chromatic split at the edges, the storm's gold-white light, the
  Umbral's black-violet grade, and the line of the surface across the lens. What wears `keepTrue` (the danger) is never moved by it.
- **voyage** (`game.voyage`, `src/progress/voyage.js`): the Emocean hop's systems: where the Courier is on the node map, the crossing
  (fuel, the stage's result, making port), the reckoning kept, and the **manifest** (each cask's origin and price, first in, first out).
- **the wreck field** (`WreckField`, `src/vfx/wreckfield.js`): the False Light's debris on the crude when she goes down (planks, spars,
  casks, gratings, rags of canvas, her figurehead face down), with **the way through** it to chase along (`way(z)`). *Not:* a lane
  (the Dunemaw's, the note chart's).

## 8. Records and progression

- **the all-arts switch** (code `system.lendAll`, `setLendAll`; in the Codex's head): lends every art without learning it (on in DEBUG,
  off in STORY). Its label is ALL ARTS (ON / OFF). Nothing it lends is counted or announced. *Not:* "Lab mode".
- **build**: one published version of the game (v45...). Progress resets on every new build; settings are kept.
- **chain** (of events; `chain.<what>` in the ledger, `chain()` among the arts' goals): the same event n times, each within a set time of
  the last (`chain.blink2`: a blink within 0.9 s of a blink); it counts once and starts over. `chain.max` is the psygun's hit chain.
- **the Codex** (B, `src/feedback/codex/codex.js`): the System's book: arts, the ledger and records, the tools, the Veritome's shelf, curios.
- **counter / record / first** (`stats.inc`, `stats.hi` / `stats.lo`, `stats.first`): the ledger's three kinds of entry: a number that
  only goes up, a best with when and where it was set, and the play time something first happened. A **funnel** is the firsts read in
  order (play time at the first art, fish, chest...): how fast a new player meets the game.
- **the Crib Sheet** (a knack, the owner's name; `game.ostraca.gloss(word)`): the English gloss beside each neuralese word that is glossed, its reach grown only by
  digging; opened by 100 macros spoken, a five-Function macro held first time, or six ostraca found (`CRIB`).
- **day** (`today()`, `DAY_MS`, `src/core/calendar.js`): one game day, an hour of real time on the wall clock (DESIGN.md section 17),
  what everything that drifts daily keys on (a Well's layout, an island's demand, a route's reckoning). *Not:* a calendar day, or a day
  of play. Always written **game day** (the owner, 2026-10-05: no bare "day" or "hour").
- **the domains** (six and one; `progress/domains.js` the data, `game.psyche` the EXP earned in play, `progress/psyche.js`): the seven skills of the Courier's psyche, mostly felt in the god hand: Ouranurgy, Manifestation,
  Divination, Psychokinesis, Possession, Alteration, and **Spellscription** (transcribing a thing down: the Soul Brush's glyphs, the
  Veritome's macros; the beat: staying on tempo is transcribing actions to time). **Ouranurgy** is the rules of the space
  around you: displacement, and time slowed or stopped (blade mode, zandatsu, reprogramming, Celestial mode). No new domains, ever (the
  owner, 2026-10-08).
  *Retired:* Spellcasting.
- **game hour**: a twenty-fourth of a game day, 150 seconds of real time (2.5 real minutes); what the weather's spells, a bed's growth and
  a Well's refill are counted in. *Not:* an hour of play.
- **knack** (`docs/plans/TRAINING.md`; `game.knacks`, `KNACKS`, `src/progress/knacks.js`, `/knack`): a passive Art, a toggle, opened by an achievement like every Art: where an assist lives (Steady
  Hand, Wide Bore, Thick Walls, Perfect Pitch, Held Breath (was Early Tell, 2026-10-08: it stacked on Perception's widening), Rule of Thirds, Half Time, Guide Tone, the Crib Sheet, Two-Tone: Espada's names, the owner's approval; Wet Ink and Ariadne's Thread proposed). It is said once when the ledger opens it (`knack.open`), and is on until switched off. **The thread** (Ariadne's Thread's, `cartography.thread`): the way walked since the last Shrine rested at, a loop cut where it crosses itself, drawn on the map. *Not:* a widening (a domain's level does that), nor a Movement Art (a verb).
- **the ledger** (`src/progress/stats.js`): every count the game keeps. **achievement** (`src/progress/achievements.js`): a predicate over the ledger,
  never a flag.
- **the log** (`src/feedback/gamelog.js`, rules in `src/feedback/tracking.js`): the only text feedback; **the chat line** is its typing.
- **the loops**: what the player wants at three scales: **the moment** (seconds), **the session** (an evening), **the long run** (weeks)
  (`docs/DESIGN.md`, section 1).
- **Luck** (`src/progress/luck.js`): the surprise lived through (in bits), read from the ledger; it sways chance, never a skill.
- **mastery dividend**: the passive income an encounter pays once everything the ledger holds for it is complete.
- **real time** (**real second**, **real minute**, **real hour**): the wall clock, what rates "per hour of play" and cooldowns are
  counted in. A unit of time in a doc, commit or message always says which clock: **game** or **real**.
- **the System** (`src/progress/system.js`): the game's code made a voice (R39); it teaches the Movement Arts and keeps the save. Always
  capitalised.
  *Not:* a game system in general (say "a system" in lower case, or name it).
- **tier** (of an achievement): Easy to Grandmaster, worth 1 to 6 **points**; **type**: count, speed, perfection, mechanic, stamina,
  collection (OSRS). The points buy a **standing** (Sweeper to Fool's Fortune); some achievements give a **title** (FFXIV).
- **widening** (`WIDEN`, `game.psyche.widen(key)`, `progress/domains.js`): what a domain's level does in play: a multiplier of a tool's own
  range or a bonus to a count (reach, capacity, options), never accuracy; at level 1 the tool is exactly as it is without it.

## 9. What the game shows and sounds

- **the ambience** (`game.ambience`, `src/audio/ambience.js`): what the weather and the game hour sound like where the Courier stands, a
  generative **sound bed** per weather (drops and gusts drawn as they fall); it hands the mood and the night to the music. *Not:* the
  Spirit Garden's **beds** (where a material is planted).
- **the arranger** (`src/music/arranger.js`): what plays a score a bar ahead of the audio clock. **the band** (`src/music/band.js`): its instruments.
- **the art bible** (`docs/ART.md`, Calissa's): what each colour, material and shape means and why, the glaze catalogue, the **precepts** (what
  each kind of thing looks like; cited "precept N") and motion, and the effect meshes' pipeline. It holds what was LOOK.md. The placeholder
  audit (ours, placeholder, genre default) is a dated note: `docs/archive/2026-10-08-art-placeholder-audit.md`.
- **the black** (`WARE.black`, `src/vfx/blackfigure.js`): the black of black-figure, EYE CUP's 0x1c1410 (what museums call black gloss).
  *Not:* "gloss" (a gloss is the Crib Sheet's: the English beside a word), nor a glaze (fired onto the vessel at the kiln).
- **a busker's mat** (`src/world/busk.js`): where the rhythm mode is begun in the world, one on each pier (Old Grog's at the Weir,
  Margarite's dock): F on it with the Crucibelle worn plays a song for tips; walking off the pier ends it. **busking**: playing there.
  **the busking body** (`src/courier/moves/rhythmhold.js`): the Courier playing it, the Crucibelle kept in hand: a **gesture** on each judged
  press (the lane's note), the **jam** (a groove of the whole body) while a rhythm combo runs at ten or more, the fever's peak at every
  twenty-fifth note.
- **a choice card** (`ChoiceCard`, `choiceCard`, `cardList`, `src/ui/choicecard.js`; Calissa's look, docs/plans/CLARITY.md section 4): one
  choosable thing shown so its use reads in two seconds, its parts always in one order: the **icon** (the UI icons), the **label** (the
  row's `name`, big), **one line of effect** (`does`: its keywords marked, its numbers in colour), the **stat chips** (a small icon, a
  number and its unit: range m, angle °, energy, charges ×n, cooldown s, duration s; real seconds only, a table in bars turned to
  seconds first: `ui/mountcards.js`), the **key** ([1], [LMB], or the Passive keyword) and the **state** (equipped, ready, locked with its
  one **opening line**; the words placeholders for Espada's). Its **detail** (the lore name and the whole text) shows only on hover, on
  keyboard focus, or while the card is **held** (a press kept down). **Compare** (`compareTo(base)`): the card against what it would
  replace, an arrow on each chip that changes, solid for better and hollow for worse as well as green and red. **The slot row**
  (`slotRow`): a loadout's slots as a bar (Gradius), the one always fitted first, each slot with what fills it and the key that fires
  it. Every window may use it in place of the index's row (a glyph, a title, a grey sentence). *Not:* a card (the Veritome's), the
  Pneuka Box's 56 slots, the Spirit Garden's slots.
- **damage look** (`damage.<type>` in the library): the colour and motif a damage type adds to a hit effect, so a blow's type reads
  with the HUD hidden. **aura** (`aura.<status>`, `src/vfx/auras.js`): a status shown round the creature that has it. **temper**
  (`game.temper`, `src/vfx/temper.js`): a creature's body showing its mental state and its EmO (never text).
- **the data drain** (`game.dataDrain`, `src/vfx/datadrain.js`): a creature's data pulled out of it on a reprogramming, after .hack's:
  the **bracelet** of petals at the Courier's hand, the beam, the creature broken into polygons streaming in. It rewrites; it does
  not kill.
- **the dialogue box** (`src/npc/dialogue.js`): the one window of words in the world.
- **a page set aside** (`showPage(name, render, { aside: 'left' | 'right' })`, `src/feedback/indexmenu.js`; the review of Calissa's mount preview, 2026-10-08):
  an index-window page set in a column (340 px, its rooms one to a row) at one side of the screen, no veil over the rest, for a window whose
  choice is seen in the world beside it. The pier's is set to the side away from the moored hull (`game.mooring.side()`), so a mount hovered
  is seen on the hull while it is chosen. The window still pauses the game and takes its keys (F, Esc), and a click on the clear ground
  shuts it. *Not:* a page centred under the veil (the index's, a Shrine's), the dock (Margarite's quay; the word "dock" is a place's).
- **effect** (`game.vfx.play(name)`, `src/vfx/library.js`): a named VFX entry, played by name; its look is data. **particles**: the emitter
  pools under the effects (`src/vfx/particles.js`, to be folded into `src/vfx/`).
- **gesture** (`Gestures`, `src/tools/toolbody.js`): a held tool's own clip that is not a blow (a note's, the Flash's, the coffin opened),
  played once over its stance. *Not:* a shot (a psygun's) nor a move (a blow of the combo engine).
- **the glitch** (`game.glitch`, `src/vfx/glitch.js`): the data showing through at a big moment (a FOE showing itself, an ultimate, a
  shattering, a reprogramming): one screen pass in the glow (`post.screen`) that splits the colour, tears bands of rows, moshes blocks
  of the frame before, crushes colour to the code's cyan and magenta, drains toward a point, or cuts to a dark beat (**the drop-out**).
  Always set off by an event and short; the setting `visual.glitch` turns it off. *Not:* a bug's flicker (CLAUDE.md, aliasing crawl).
- **grade** (`src/music/rhythm/judge.js`): how near a press came to its note: perfect, great, good, miss. **accuracy**: the share of the
  chart's notes earned. **combo** (the rhythm mode's): a run of notes without a miss (see the homonyms).
- **the grey tint** (`greyTint`, `greyTexture`, `cloneTinted`, `src/vfx/greytint.js`): a painting in greys under its material's colour:
  the painting's **reference grey** (its body's own) is the colour exactly, a darker grey darkens it toward black, a lighter lifts it
  toward white, so any colour the game gives the thing (the kiln's heat, a raider's red, a turned jar's cream) reads as itself with
  the painting on it. The clapperjar wears it (the owner's grey texture, `source_assets/clapperjar_base.png`, reference 102 of 255).
  *Not:* a glaze (fired at the kiln), nor triplanar's 'detail' (light and shade only, no UVs).
- **ground marks** (`src/world/ground/groundmarks.js`): footprints and trails left on soft ground. With the **trail map**
  (`src/world/ground/trailmap.js`) and the skiff's **wake** (`src/world/ground/wake.js`).
- **the ground pack** (`src/assets/ground_pack.webp`, baked by `scripts/bake_ground.py` from `source_assets/vfx/Noise_Gradients/`): four
  of the owner's noise gradients as the four grey channels of one tileable texture, the heights the ground's materials are drawn from
  (R moss's cushions, G loam's rootlets, B slate's cleft, A silt's crazing; ash's come from the liquid pack's glowing cells). Fetched
  beside the bundle (never inlined in it) when the first planetoid is made. *Not:* the liquid pack, nor the surfaces
  (`render/triplanar.js`).
- **the liquid pack** (`src/assets/liquid_pack.webp`, baked by `scripts/bake_liquid.py` from `source_assets/liquid/`): the owner's
  noise photographs as one tileable texture (marbling, bubbles, sand ripples, veins) that every liquid is drawn with (`src/vfx/liquid.js`).
  **caustics** (`liqCaustics`, `causticTexture()` in `src/vfx/liquid.js`): the net of light on a pool's floor, a Voronoi cell texture
  drawn in two layers a little apart (white where they meet, split into colour where they part); **glints**: the water's sparkle
  where the sun catches it.
- **a keyword** (`KEYWORDS`, `keywordEl`, `keyworded`, `src/ui/keywords.js`; CLARITY.md section 5, Dovina's table, Espada's words): one
  of twelve genre words the UI explains on hover wherever it stands (Slay the Spire's): **Absorb**, **Parry**, **Bomb**, **Lock-on**,
  **Weak point**, **Stun**, **Energy**, **Cooldown**, **Charges**, **Hull**, **Fuel**, **Passive**. In text it is bold, in the window's
  gold, its icon before it; a hover or keyboard focus opens **its tip** (`#kwtip`: the icon, the word, what it means in one line). A new
  mechanic reuses one if it can; adding one is an entry here first. Each names in the UI a thing the glossary already has: Energy is
  the pool, Lock-on the lock-on, Hull the ship's hull (its `bears`), Fuel the bunker, Charges a mount's uses a crossing (*not* the
  homonym charge), Parry the parry. *Not:* a label (a thing's own genre word, `name`).
- **the Lockheart's cue** (`LOCK_CUES`, `src/music/lockheart.js`): the music under the Opening, one per mode, and its **landing**
  (`LOCK_LANDED`), the chord it cuts to when the wheel lands.
- **the map** (M): called **Mind Mapping** in the game (`src/feedback/cartography.js`).
- **mood layer** (`moodLayer`, `src/music/mood.js`): the weather heard in the music, a few quiet notes over each bar of the place's cue
  (its own root, second and fifth); the night **thins** every cue instead (`MusicPlayer.setNight`). A cue the weather must not touch is
  `moodless`. **the scale** (`game.music.scale()`): the five notes to play along in (the Crucibelle's), the cue's own, or the
  weather's mode when nothing plays.
- **neume** (`NEUMES`, `songNeume`, `src/vfx/crucibellehud.js`; the chant's word for a sign of notes written without a staff): a note of
  the Crucibelle written on the pendulum's arc where the bob was, by its shape, one a degree (Aikin's shape-note heads read from la:
  the root a square, the minor third a triangle, the fourth a bowl, the fifth a diamond, the minor seventh a circle); solid on the
  beat, hollow off it, its line doubled an octave up. **The motif** is the last notes' neumes along the tape; **a song's neume** is a
  song's notes joined in one ligature, taken into the bell's mark when it is cast. *Not:* a sigil (the Soul Brush's, read from a
  stroke in Celestial mode).
- **the night alive** (`game.nightSky`, `src/vfx/nightsky.js`; drawn in the dome, `src/vfx/sky.js`): what the night sky does: our own
  **stars** on **the wheel** (turning about their pole once a game day, twinkling slowly), now and then a **meteor**, and at the Shore
  **the Shore's aurora**: curtains low over the sea by night. *Not:* the weather's aurora (wonder by night, over the whole sky).
- **note chart** (`noteChart`, `src/music/rhythm/chart.js`): the notes the rhythm mode asks for, drawn from a score's lead; a **lane** is one
  of its ten keys (1 to 5 the low notes, 6 to 0 the high); the **backing** is the score with the charted notes taken out. *Not:* "chart"
  alone (that is the map's: see the homonyms).
- **the overhead map** (`src/vfx/overhead.js`): what stands over each spot round the eye (a roof, the ground), measured by rays from
  high above; what falls from the sky is never drawn under it.
- **the overture** (`src/music/overture.js`, Wanda's): the music the title opens with, "Fortune Favours the Fool". **the trailer**
  (`game.overture`, `src/cine/overture.js`): the in-engine cinematic cut to it, played on the title once a session (`/overture` plays it
  anywhere); its **board** (`docs/boards/OVERTURE.md`, as data in `src/cine/overture.board.js`) is its storyboard, a camera shot a line.
  A **still** (`src/ui/stills.js`): a frame of the trailer held as a sepia photograph on a stop-time hit (not a plate: nothing is taken).
  *Also, the music copy in "Music":* **the overture** (`OVERTURE`, `src/music/overture.js`): the title's opening cue, a hair-metal JRPG opening that hands on, on the bar line,
  into the title theme (a score's `then`). *Not:* "the opening" (that is the Lockheart's ultimate, the Opening).
- **the pause menu** (Esc): the help pages and the controls. *Retired:* "pause card".
- **the pendulum** (`CrucibelleHud`, `src/vfx/crucibellehud.js`; docs/plans/CRUCIBELLE-UI.md): the Crucibelle's beat for the eye, on the
  wire compass while the bell is in the hands: a line pendulum hung from the **bell's mark** on the tape's centre, its ends landing on
  the bell's eighths (the music's, or the bell's own 96 bpm, drawn fainter), heavier into each bar's downbeat; a **notch** at each end
  as wide as the bell's on-beat window; the bob an ember whose smoke rises with fever. Its size is a setting (`visual.pendulumSize`).
  *Not:* the metronome (the fob on the bell itself); never in the rhythm mode (its note chart).
- **the Pneuka Box** (P, `src/pneuka/`): the inventory (56 slots) and what is worn. With the Veritome out, **the bank** (the Book) opens
  beside it. *Not:* the Veritome; the Veritome is the bank, not the inventory.
- **rating** (`src/ui/rating.js`): the maker's word that pops over the rhythm mode's line on each judged press, from its grade, how near
  it came and the combo, worst to best: Miss!, OK..., Nice!, Great!, Excellent, Awesome, Perfect, Wow. **The set's rating**: one of the
  same words for a whole song played through, from its accuracy, said in the log at its end. *Not:* a grade (the judge's four).
- **the rhythm mode** (`game.rhythm`, `src/music/rhythm/rhythm.js`): a track played as a rhythm game on keys 1 to 0, begun from a stage in a
  room. *Not:* the field Crucibelle's playing (improvisation, on the beat or not).
- **the ribbon of light** (`ribbonLightMaterial`, `RIBBON_LOOK`, `src/vfx/ribbonlight.js`): the one shader program every flat strip of light
  draws with, its look a uniform: the spirit veins (and Myggdrasil's threads), the sculpt brush's ring, the incense thread, the data
  drain's beam. *Not:* a ribbon of the rail's marks (railmark.js's `ribbon` style: an Itano lance's trail).
- **a ripple**, **a wake** (`game.water.disturb`, `courier/moves/env.js`; drawn by `vfx/water.js`): a ring spreading on a water
  surface where something touched it; the V behind something moving on it.
- **the ripple tank** (`src/vfx/ripples.js`): the rings on water: a height field round the eye stepped by the wave equation, that every
  disturbance of a water surface (`game.water.disturb`) dents; the water's shader reads its slopes. **The wake** is its rings' V behind
  a swimmer. **The crown** (`src/vfx/waterfx.js`): a dive's splash, a rim of drops flung up and out round a column. **Drips**: the
  Courier dripping for a few real seconds after leaving the water.
- **score** (`src/music/*.js`): a piece of music written as data (sections of bars of events). **track**: a score as the sound test lists it
  (`TRACKS`, `src/music/soundtest.js`). **cue**: the score a place or a moment calls for (`src/music/choose.js`).
- **sequence** (`game.cine`, `src/cine/`): a cinematic as data (the Opening, a chest's opening).
- **a skirt**: what blends a thing into the ground where the two meet, so no hard line shows (the owner, R46: "meshes that interact
  with the ground need mesh skirts"). Two kinds: the level's, a strip hung a metre down the edge of a room's sand, drawn only, so no
  crack shows where two rooms' sand meet (`src/world/well/wellkit.js`, the terrain trick); and a model's, its **foot** band taking the
  ground's own texture, fading up (`foot` in `src/render/triplanar.js`). *Not:* the spout's falling skirt (a sandfall).
- **the stack** (`stackOf`, `railHeat`, `src/music/legs.js`): how many of a crossing leg's eight musical parts sound (pad and pulse,
  the groove, the bass, the arpeggio, the snare and shimmer, the theme, the choir, the boss's line): its phase's own, plus the **heat**
  every lock, down and boss part adds, cooling a quarter of a part a bar (Rez's layers). *Not:* a layer (the map's), the mood layer.
- **triplanar** (`src/render/triplanar.js`): a texture laid on a surface from the world, along the three axes, blended by which way
  the surface faces; no UVs. In 'detail' mode the texture brings only its light and shade, the colour stays the material's. The
  textures are **the surfaces** (Calissa's six CC0 sets, `src/assets/textures/`: sand, sand_packed, rock, clay_floor, plaster,
  stone_flags). *Not:* the level's dressing (`vfx/surfaces.js`: box mapping of procedural patterns by colour).
- **the UI icons** (`uiIcon`, `iconEl`, `ICON_IDS`, `src/ui/icons/`; Calissa's): the pixel art of the choice card and the keywords, 16 px
  (8 for a chip's), each a picture of what its thing DOES (a mount's at sea, never the tool ashore): the twelve keywords
  (`icons/keywordart.js`), the seven mounts (`icons/mountart.js`), the chips and the card's marks (`icons/chipart.js`: lock, check, the
  compare arrows). Drawn in **the icons' hand** (`icons/hand.js`): only the light shape is authored, on the pixel kit's twelve greys,
  bevelled from the top left, and the hand adds **the keyline** (a pixel of the darkest grey round it, so every icon has a light part and
  a dark part: casebook rule 105); recoloured by a palette (**gold** its own, **grey** a locked card, **better** and **worse** a compared
  arrow, **line** the sea chart's) and scaled by whole numbers. *Not:* the sea chart's icons (`ui/seachart/icons.js`), a glyph (the
  glyph pop's), the Pneuka Box's item icons (`pneuka/icons.js`).
- **the weather's look** (`game.weatherLook`, `src/vfx/weather.js`): how the emotional weather (`game.weather`, Dovina's) and the hour
  are drawn, each weather in its damage type's colour and motif: **streaks** (rain, or sand on the wanting wind) and **motes** (diamond
  dust, dust) wrapped round the eye in the world, never on the screen; the **halo** and **sun dogs** (wonder by day), the **aurora**
  (wonder by night), the **rainbow** (mirth), **far bolts** (dread: a bolt a long way off, held a beat and fading; never a flash). An **agate** sky's second feeling colours the sky, the
  clouds and what falls, and may raise its own mark; it never falls. Only
  an open place gets them. **the hour's grade** (`sky.grade`): the sky by the hour: the maker's dusk painting, the owner's day and night
  paintings blended in.
- **the wire compass** (`WireCompass`, `src/vfx/wirecompass.js`): the tape of ticks round the eye at the top of the view (the quarters as
  the sun's road), shown while the Dreamvane is worn or the Crucibelle is in the hands; the tools' own marks hang on it (the vane's,
  `vfx/vanehud.js`; the pendulum). **compass contrast** (`visual.compassContrast`, a setting): the tape and its marks fainter or brighter,
  the pendulum keylined in black, more as it rises.
- **world mark**: a mark that sits on a thing and carries no words: a glyph pop, the interact chevron, the lock-on reticle, the letterbox
  bars, the fish portrait.

## 10. Engine and process

- **the agent** (`game.agent`, `src/agent/agent.js`): the game as an AI player sees and drives it: `observe()` the state as data, `act()`
  an **intent** (goto, travel, face, use, interact, attack...) carried out through the same input the keyboard fills. *Not:* a creature's
  mind (a Brain, `docs/AI.md`).
- **the bridge** (`scripts/agent.mjs`): the game held open headless so a session plays it a call at a time from the shell (look, act, do,
  step). *Not:* the Weir's pier, or any bridge in the world (say the span).
- **the Brief** (QAIS's first tab): one build's changelog, a few plain lines per division and what each waits on from the owner.
- **bug report** (QAIS's Reports tab: `docs/plans/BUGREPORT.md`): the frame taken when F8 is pressed and marked up by the owner, a
  title, a kind and a severity, with the game's whole state attached by the machine (the save, the replay so far, the log, the last
  events, the F4 report); kept in the published build's store for every division to read. *Not:* the F4 report alone (one of its
  attachments).
- **the casebook** (`docs/CASEBOOK.md`): every bug fixed, with its cause and the rule it left; read its rules before building in the same
  area. *Not:* the log (the game's text), a report (QAIS's, the owner's), the ledger (the stats).
- **the checklist** (retired 2026-10-05, the page deleted): the QAIS tests' first home (`C12`); say "QAIS tests".
- **debug chest** (`DebugChest`, `DEBUG_KITS` in `src/debug/kits.js`; `docs/plans/DEBUG-CHESTS.md`): a crate in the magenta-and-black
  missing-texture checker left beside a feature sent for a test session, its **kit** (the items and cubes that feature's QAIS tests need)
  topped up at each F; nothing it gives is counted; place id `debug.<kit>`. Always "debug chest" in full. *Not:* a chest (the Tithe's,
  the world's, with tiers), the all-arts switch (it lends arts, not things).
- **event** (`game.events`): a message on the bus, named `domain.verb`; its payload never uses `name` or `t`, and an outcome carries `by`.
  An event is named for the ledger key it feeds where it feeds one (`move.jump` is emitted and `move.jump` counted; R42).
- **the kit** (the `kit` section): the Pneuka Box and the belt, kept as one, so they can never disagree about where a tool is. *Not:* the
  Lockheart's kit (say its coffins and keys).
- **the markup window** (`BugMarkup`, `src/ui/bugmarkup.js`): the bug report's window over the frozen frame (F8: QAIS's Reports
  tab, `src/debug/qais/report.js`): the frame at a whole-number scale, **marks** on a layer of their own (pen, arrow, ring, box; red or white;
  undo), a title, what happened, what should have, a kind and a severity.
- **module**: one file under `src/`. **division**: one of the five Claude sessions (Petra, Dovina, Wanda, Calissa, Espada). **round**: one
  cycle of work (R42...). **the gate**: Petra's review of every push to main (`docs/ARCHITECTURE.md`). **`npm run gate`**: the gate's machine steps in one command, with one report
  (`gate-report.txt`). **the contracts** (`npm run contracts`, `scripts/contracts.mjs`): what one division's service offers another, checked
  in the running game (names and shapes). **the lanes**: which division owns which files (CLAUDE.md, "Threads"); the gate lists a branch's
  changes outside its lane. **the handover**: what a division gives Petra with a branch (docs/ARCHITECTURE.md). **a handoff**: a note from
  one division to another, one file in `docs/handoffs/<reader>/` (docs/HANDOFFS.md).
- **playtest** (`npm run playtest -- <name>`, `scripts/playtest/`): a scenario an agent plays to its goals, with checks ("down the Well and
  back: the run pays, the haul comes home"). The stress test fuzzes; a playtest plays.
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
- **replay** (`game.replay`, `src/core/replay.js`; `/replay save`, `/replay load`, `/record`): a session kept so it plays again the same:
  a header (the build, the boot seed, the seed play began with, the save then, where the Courier stood) and the **frames**, each tick's
  dt and input. **exact** when it began at the start of play; begun by `/record` mid-session, the loose world comes back as it boots. A
  **deed** is a change made other than through the input (an agent's turn or travel), kept in the frames and done again on playback.
  The calendar (`core/calendar.js` `now()`, `today()`) is read through the replay too, so a replay watched tomorrow sees the day it was
  played; what pays while you are away reads `now()`, never `Date.now()`.
  *Not:* a chat command (`/replay` is one), a cinematic's playback (`cine/`).
- **rescue** (`courier.rescue`, `Player.guard()`): the body's safety net taking it out of a bad state (`nan`, `nudge`, `reset`, `clip`),
  counted by the stress test, never hidden. *Not:* the cutlass's guard (`guard.up`, `guard.block`).
- **rest bake**, **prop batch**, **light budget**, **present**: the render tricks (`src/render/`).
- **the save** (`game.save`, `src/core/save.js`): everything the game keeps in the browser. A **section** is what one system keeps (its id,
  scope, version; how to dump, load, reset, migrate and check it); a **scope** is one record written whole: **player** (progress that
  follows the Courier: the kit, the ledger, unlocks), **world** (progress of the place: the Wells, the shops, the ground) and **settings**
  (kept across builds). A **wipe** resets a scope (a new build wipes player and world; so does the Codex's RESET PROGRESS, and its
  EXPORT CODE is the whole save, `FFS2.`). An **adopted** key is one a module still writes
  itself, declared in the save so the wipe and the export know it. To **hold** the save is to borrow the game (the trailer): nothing is
  written, and on release every section is loaded again. *Not:* `save()` on a module (that now marks its section dirty).
- **seam** (`game.seam`, `src/render/seam.js`): a change of place made under a cover (dip to the dark, change, hold two drawn frames,
  come back); its look is a `kind` (a Well's: 'maw'). *Not:* a texture seam.
- **the seed** (`?seed=N`, `game.seed`): the number the session's chance is drawn from; the same seed and the same input play the same.
  A **stream** (`stream(name)`, `src/core/rng.js`) is one module's own draw from it, so one system drawing more never shifts another.
  *Not:* a Well's `wellSeed` (the day's layout) or a run's seed (its floors).
- **service**: a `game.*` object every module may ask (time, mood, cinema, cine, vfx, events, creatures, belt, cubes...).
- **a sweep** (`scripts/sweeps/<room>.mjs` on `harness.mjs`; all: `node scripts/sweeps/run.mjs`, the dev server up; Dovina's): one
  room entered, worked and left headless as a person would and as a careless one would, a screenshot at every step and a PASS/FAIL line
  a check; a defect once seen stays checked. **The garden sweep** (`garden.mjs`) was the first (`docs/plans/GARDEN-SWEEP.md`); the
  others are named for their room (`workshop`, `basement`, `dunes`, `dunemaw`, `emocean`, `tools`). *Not:* the stress test (it fuzzes
  the whole game), a playtest (it plays to a goal), the Soul Brush's mop, the kick's leg sweep, melee.js's `sweep` (what a swing struck).
- **tag** (`src/core/tags.js`): what a tool may do to a thing (sliceable, breakable, liftable, pushable, static) and what it is made of (clay,
  crystal, jelly, wood, stone, metal).
- **the tuning panel** (Tab, `src/debug/tuning.js`): live sliders and actions (set the room again, last checkpoint, the hub), laid out as
  Settings, Feel, Combat, World, Look and Sound, with a find box. A **setting** is the player's own preference (sensitivity, resolution,
  volume, how a charge fires: `SETTINGS` in `src/debug/tuned.js`); a **knob** is any other number there. A knob away from its default is
  **tuned**: marked on the panel, listed under Tuned with a reset, said in the log at the start of play (`tuning.tuned`), shown at the
  top of QAIS's Brief and carried on every report, so a tuned game is never mistaken for a bug. *Not:* a setting (never a warning).
- **the workbench** (`/workbench`, `src/workbench/`): the studio for effects, models and sequences.
