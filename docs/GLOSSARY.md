# The glossary

One word, one meaning: in code, docs, commits, messages and requests. A request that misuses a word is clarified first. Full definitions: `docs/GLOSSARY-DETAIL.md` (not imported).

1. **The code says what the game says.** Identifiers use the game's word, or the code name given here.
2. **A new thing is named here first,** in the same commit, by its owning division (player words: Espada and the owner; code names: Petra at the gate).
3. **A homonym kept on purpose is always qualified** (table below).
4. **Retired words are refused** by `npm run check` and at review (table at the end).

Entry: **term** (`code`, `path`) — meaning. *Not:* the confusion it prevents. "→ detail": more in the detail file.

## 1. The Courier, the Vessoul and the god hand

- **the Courier** (`player`, `character`; `src/courier/player.js`) — the one the player plays. Androgynous: "you" where the game speaks, "they" in
  docs and comments. *Not:* "the player" in anything the game says. → detail
- **the Vessoul** — the soulspark that stands for the player in the world, one being in several forms: the god hand, the Pneuka Jar, the Courier,
  and on the Emocean the ships. *Not:* "the player" in player text.
- **the stones** (`src/progress/stones.js`) — where Lachryma enters the vessel: the pool's size, regen and costs, the magnet's reach, overflow;
  one set at a time. *Not:* a stone in the world. → detail
- **brimming** — the push of overflow, a vessel full past its brim; the log says "You are brimming." *Not:* "drunk", which never appears in player
  text.
- **the pool** (`game.lachryma`, `src/courier/lachryma.js`) — the Courier's store of Lachryma; it pays for shots, charges and arts, and it is the
  shield. "Lachryma" alone means the substance.
- **vessel** (`game.vessel`, `src/courier/vessel/`) — the Courier's clay body and what is done to it: glazes, cracks, shattering, reforming.
  *Not:* the god hand's jar.
- **crack** — damage to the vessel, per region (mask, torso, arms, legs); it mends slowly or at once at the kiln (MEND). *Not:* a pot's cracks.
- **shatter / made whole** (`courier.shatter`, `courier.reform`, `src/courier/vessel/death.js`) — the Courier's death, and being made whole again
  in the workshop. Player text says "made whole" or "re-formed", never "reform".
- **glaze** (`src/courier/vessel/glazes.js`) — a colour fired onto a region at the kiln: FIRE keeps a look, MEND refires the cracks; a rare one
  also has a kiln pattern. *Not:* a material, nor a Firing. → detail
- **sibling** (`game.party`, `src/coop/sibling.js`) — one of the five divisions as a Courier in the owner's world, with its own mind and tool; met
  once, then called or dismissed at a Shrine. *Not:* a spirit, nor a guest. → detail
- **the party** (`game.party`, `src/coop/party.js`) — the siblings called into your world (two at once; four players at most, guests included),
  and what you tell them with `/sib`.
- **guest** — a person who joins your world over the published page's room (a co-op player). *Not:* a sibling.
- **voice card / drift** (`PERSONAS`, `drift()`, `src/coop/personas.js`) — a sibling's voice written as form and lexicon / the house voice's
  tells a line slides back to, banned for all five.
- **asking a sibling / letter** (`@name words`, `/letter name words`; `src/coop/answer.js`) — a question a sibling answers in seconds, in its
  division's voice / words sent to a division's own session, answered in minutes. *Not:* each other.
- **the god hand** (~, `src/godhand/godhand.js`) — the mode where the Courier becomes a jar and you become a hand.
- **the jar** (`jar`, `jar.hit`) — the Pneuka Jar, the Courier's true form; Courier, god hand and jar are one entity. Player text says "your
  Pneuka Jar", never "the jar". *Not:* the vessel. → detail

## 2. Lachryma, feelings, weather and money

- **Lachryma** — the substance of feeling and magic, condensed or liquid. Always capitalised.
- **Lachrymite** — Lachryma in its solid form, whatever its shape: a cube is a coin of it, a crystal a formation, a shard a piece. *Not:* a new
  item or currency.
- **cube** (`game.cubes`, `src/world/treasure/cubes.js`) — a Lachryma cube, the only currency. *Not:* a box in the level ("block").
- **worth** (`worthOf`, `src/progress/shop/catalogue.js`) — what a thing is worth in cubes, the base every price moves from. → detail
- **pity** (`TITHE.pity`) — a counter that turns a run of bad chest pulls into a sure thing (a rare every 10, an epic every 40). → detail
- **crystal** (`src/world/dunes/crystals.js`) — a Lachryma crystal formation in the Dunes, struck with the Dreamvane's pick and tuned by ear;
  gives cubes, sometimes a crystal shard or a Possibilikey. → detail
- **fret** (`FRETS`, `fretAt`, `src/world/dunes/crystaltuning.js`) — one of a crystal's five note steps up its stave, each in its note's colour; a
  crystal's sweet spot is one fret. *Not:* a zone, nor the `/fret` emote. → detail
- **signature** (`src/core/signatures.js`) — where Lachryma is, and how strongly; tools that sense or drink Lachryma ask here.
- **draught** (`draughtOf`, `DRAUGHT`) — the feeling of the Lachryma last drunk; a blow of that damage type builds its status faster; fades over a
  real minute. *Not:* a drink of crude (a cask).
- **mental state** (`game.courierMind`, `src/courier/mind.js`; creatures': `progress/combat/mind.js`) — the Courier's: pushed up by Lachryma
  drunk, settled by quiet. A creature's: Stoic to Prismatic. *Not:* mood (`npc.mood`), nor EmO. → detail
- **the five feelings** (`DISPLAY_ORDER`, `src/progress/weather.js`) — the aspects of Lachryma, always shown most positive to most negative:
  Wonder, Mirth, Desire, Grief, Dread. *Not:* "hunger" (never an aspect). → detail
- **agate** (`AGATES`, `agateOf`) — two feelings felt at once, shown as one: the stronger is what happens, the weaker its colour. Opposites cancel
  instead. → detail
- **weather** (`game.weather`, `src/progress/weather.js`) — an island's mood, falling as Lachryma: one of the five aspects or calm, with a
  strength; a spell holds a block of game hours. → detail
- **the day's phases** (`phaseAt`, `lightAt`) — night, dawn, daytime and dusk on the game clock. *Not:* a game day.
- **faucet / drain** — where cubes come into the world / leave it. **A minute of play** is the economy's unit (`docs/ECONOMY.md`).
- **the aim** (`ECON.perMinute`) — what ordinary play should earn in a real hour (480 cubes); a source is judged as a multiple of it.
- **sink** — a drain the player chooses and that never fills (the glazes, the Spirit Garden). *Not:* any drain (the Tithe is a drain, not a sink).
- **crude** (`ECON.crude`) — liquid Lachryma as a cargo, graded by aspect; volatile, so it can spill. *Not:* a bauble.
- **cask** (`cask.<grade>`) — the unit of crude, carried in the Pneuka Box; a ship's hold is how many may cross (a sloop holds 8).
- **the Purser** (`purserPrice`) — the trader at Margarite's dock who buys crude, materials and Cogitomaps at a posted price, never haggled. The
  role is the name.
- **commission / bounty** (`commissionPay`, `bountyPay`) — a commission is a hunt for a Figment by class (Seger); a bounty a hunt for a named
  Egregore or a stray or aberrant Figment (Letty Marque). *Not:* the same thing.

## 3. The tools and the moves

- **tool** (`src/tools/`) — one of the Courier's psychic tools, worn on the belt: the psygun, Sondelass, Soul Brush, Veritome, Dreamvane,
  Crucibelle, Lockheart. *Not:* a Node script.
- **the belt** (`game.belt`, `src/tools/belt.js`) — where tools are worn; "is a tool out?" asks here. **Draw / stow** take a tool in hand / put it
  back.
- **fitting** (`FITTINGS`, `src/pneuka/box.js`) — what fits into a tool (a lure, an instrument, the Lockheart's keys), kept in the Pneuka Box. A
  tool never has an inventory of its own.
- **the psygun** (`game.weapon`, `src/tools/psygun/weapon.js`) — the gun. A shot is one round; a charge winds up a piercing beam; a shell is a
  special round in a chamber. → detail
- **the Sondelass** (`src/tools/sondelass/sondelass.js`) — the blade with three forms: the cutlass, the rod (angling), the hook (the grapnel). →
  detail
- **the Soul Brush** (`src/tools/soulbrush/soulbrush.js`) — the club, the flick, Celestial mode (sigils) and inscriptions; the tool of
  environmental Lachryma, in paint and mop modes. → detail
- **blot** (`stain`, `STAINS`, `src/world/ground/stains.js`) — spilled crude on the ground, graded by feeling; left alone it grows, and a
  full-grown one gives up a blotling (an aberrant Figment). *Not:* "stain" in player text. → detail
- **a Lachrymato Bottle** (`BOTTLES`, `src/progress/brushload.js`) — an aquarium-glass bottle worn at the upper back; a reserve that feeds the
  pool below half and is what paint spends and mop fills. *Not:* "tank", ever.
- **the Veritome** (`src/tools/veritome/veritome.js`) — the book that is a camera; a plate is one photograph; its pages are the Book, the
  Compendium, the bestiary, the Major Arcana. *Not:* the inventory. → detail
- **reprogramming** (`src/tools/veritome/reprogram.js`) — rewriting a stunned creature's mind with a macro composed on a lattice of Functions (THE
  MIND shelf) and spoken in neuralese.
- **the Dreamvane** (`src/tools/dreamvane/dreamvane.js`) — dowse, the pick, the fork, the survey, the vane (the weather meter) and reading the
  sky. → detail
- **the Crucibelle** (`src/tools/crucibelle/crucibelle.js`) — five notes, the toll, songs, fever, the mirage, the metronome. *Not:* the pendulum
  (the beat on the wire compass). → detail
- **the Lockheart** (`src/tools/lockheart/lockheart.js`) — a coffin on a chain: hoover, channel, the flail, the wheel of odds, the Opening. A
  Possibilikey is always so called, never "key". → detail
- **the moveset** (`tools/moveset.js`) — a tool's string, pause string, charge, launcher, air string, dash attack and special. The recovery cut is
  not a cancel. *Not:* a combo. → detail
- **shot** — a psygun shot, and only that. A scripted camera is a camera shot (`cinema.shot`); a photograph is a plate.
- **damage type** (`src/progress/combat/types.js`) — what kind of force a blow is: Impact, Ego, Influence, Illusion, Delirium; each builds a
  status and trumps one other. *Not:* an element. → detail
- **the parry** (V; `courier/parry.js`) — the one button that answers a blow or projectile in a short window, in the way of the tool in hand.
  *Not:* the guard (the held block). → detail
- **the kick** (`courier/moves/kick.js`) — the unarmed moveset, V with nothing in the hands; the first 0.26 s of every blow is the parry. *Not:* a
  hook (the Sondelass's) or a sweep. → detail
- **windup** (`creatures.windup`, `c.windup`) — a creature's telegraphed blow, listed while it can be answered; a parry in its window breaks it
  off. *Not:* an attack's own phase name.
- **the core movement** — walk, sprint, slide, jump, wallrun, mantle, dash, and the humanoid moves (swim, ladders, hanging, poles, grates,
  balance, carrying, pushing). The gold standard: nothing changes it.
- **tech** (`Tech`, `src/courier/moves/techs.js`) — code only: anything that takes the Courier's body for a while. In the game, a learned one is a
  Movement Art.
- **Movement Art** (`src/progress/skills.js`) — a tech the System teaches; a variant is one of its versions.
- **emote** (`EMOTES`, `src/courier/emotes.js`) — the Courier's body language asked for on the chat line (/wave, /sit, /dance): a clip played
  once, looped, or as a triple. *Not:* a gesture, nor a creature's emote clips. → detail
- **the skiff / Solar Skiffing** (`src/courier/skiff/skiff.js`) — the sand boat, and sailing it in the Dunes. *Retired:* "surfer". *Not:* the
  sloop (the Emocean's ship). → detail

## 4. Creatures and folk

- **creature** (`game.creatures`, `src/creatures/creatures.js`) — a hurtable thing with a mind (a slip jelly, a spirit). A weapon calls
  `creatures.strike`.
- **mind** (`Brain`, `src/creatures/ai/`) — what a creature thinks with: senses, memory, drives, a utility reasoner. See the homonyms.
- **clapperjar** (`clapper`, `src/creatures/clappers.js`) — the clapping pots, the folk's lowest tier (earthenware). The code's shorter word is
  accepted.
- **slip jelly** (`src/creatures/jelly/`), **spirit** (`src/creatures/spirits.js`: an ally, called up), **mirage** (a decoy).
- **status** (`game.stun`, `creatures.status`) — a condition on a creature: stun, halt, slow, sleep, calm, melt, and the four a damage type builds
  (doubt, charm, blind, confusion). → detail
- **EmO**, Emotional Output (`src/progress/combat/emo.js`) — a Figment's agitation, 0 to 1; its Lachryma yield peaks in the optimal band.
- **grain** (`src/progress/combat/temperament.js`) — who a creature's mind is: five traits, each between two poles; it weights the mind and shows
  in movement. *Not:* temper, "personality" or "stats". → detail
- **the crown** (`FOE.crown`, `src/progress/combat/dunemaw.js`) — the broken urn on the Great Slip Jelly's head, cracked in stages then burst off;
  under it, the core, its weak point. *Not:* a chest's tier.
- **Strawman** (`STRAWMAN`, `src/vfx/strawman.js`) — the Workshop's test dummy, stitched by Pip: it never falls and the ledger never counts it.
  Named with no article. → detail
- **the Pithos** — what the folk call the Great Slip Jelly, the Great Dunemaw's FOE, crowned with the broken urn it grew in; the log says "the
  Great Slip Jelly". → detail
- **the folk** (`npc`, `src/npc/`) — the clay people, fragments of Kaolin Anagami: earthenware (clapperjars) < stoneware < porcelain < the Court.
  In the game "the folk" are the ones who speak. → detail
- **Figment / Egregore** — a Figment is a thought-construct of an island's own psyche (made up); an Egregore a thought-form of the Emocean (real
  human myth). One at large is a stray or an aberrant. → detail
- **the Prince of Clay** — Kaolin Anagami's main avatar, the most powerful of the folk. "He".
- **the King / the Queen** — Magnus Ibrahim Manus (his island Margarite) and Entra Polearis (hers Entropolis), the Prince of Clay's parents.
- **Contractor / Tulpa** — one who survives the open Emocean is a Contractor, with a Tulpa (a thought-form authored with care).
- **cogitohazard** — the umbrella word for Lachryma's dangers in the environment and maliciously aligned Figments.
- **aqua regia / amethyst** — Margarite's lamp fuel, refined from crude / Entropolis's charm for a clear head.
- **Charybdis** (`CHARYBDIS`, `world/emocean/charybdis.js`) — the Whale (class 3) Egregore of the maelstrom, rising Astral and diving Umbral; one
  in every maelstrom. *Not:* the maelstrom (the leg, a place). → detail

## 5. Places and the Wells

- **the Emocean** — the collective unconscious, a sea of pure Lachryma outside every island.
- **an Island of Ego** — an island precipitated out of the Emocean where an identity is strong enough; **Anagami Island** is this one, and
  **Kaolin Anagami** the ego it is.
- **layer** (`LAYERS`, `src/feedback/cartography.js`) — one level of the map: the upper floor, the ground floor, the basement, the Dunes.
- **room** — a named place inside a layer, said by the log as you enter it (`place.enter` carries `room`); also what the Index sends you to.
- **place** (`game.places`, `src/world/places.js`) — a named spot anything can be sent to by id (`well.mouth`, `kiln`). A point, *not* a room.
- **zone** (`src/render/zones.js`) — a render zone: what is drawn from where the camera is. *Not:* the Zone of Influence, nor a crystal's fret. →
  detail
- **the Zone of Influence** — the ground the player has explored. Nothing more, for now. Always named in full (or ZoI).
- **the workshop** — the ground and upper floors: the kiln, the folk, the pots, the gong.
- **the basement** — below the workshop: the hub, the course, the movement lab, the lap circuits, the siege. *Not:* "the lab".
- **the hub** — the basement's centre, where the Index stands. **The Index** (`src/feedback/indexmenu.js`): the console there; F, and pick a room.
- **the course** — the basement's loop of eight stations (checkpoints), with laps and splits.
- **the siege** (`src/world/basement/siege.js`) — the god hand's arena; raids happen there and nowhere else.
- **the Dunes** (`dunes`) — the sand sea, a region of Anagami Island, capitalised in player text; the oasis, the Weir (pools and pier), the Weir's
  Well, the barrier, the ruins. → detail
- **the shore** (`game.dunes.beach`, `src/world/dunes/beach.js`) — due east of the oasis, where the Dunes run down to the Emocean: the waterline
  and the jetty. *Not:* the Weir's pier, or "the bridge" (say the span). → detail
- **the Throwing Room** (`src/progress/combat/testroom.js`) — a side room off the Workshop where aim and recoil are measured, never earned:
  targets, Strawman, the spray wall, the drills. *Not:* a trial, a playtest, the stress test. → detail
- **the Gnomon** (`world/dunes/solar.js`) — the pale spire in the Dunes, the sundial's shadow-stick for the whole Dunes; it keeps game hours, and
  the Solar Skiffing trial is begun at its foot.
- **the Great Dunemaw** (`game.well`, `src/world/well/dunemaw.js`) — the Well in Anagami's Dunes, the slice's one: a mouth on the sand (F goes
  down), three floors laid out each game day. *Not:* the Weir's Well. → detail
- **haul** — what a Well run found below, a material for each floor whose creatures are all down; it comes home only up the way up. *Not:* hauling
  (carrying goods across the Emocean).
- **FOE** — the bigger creature that keeps a Well's last floor (for now a Great Slip Jelly, class 2). *Not:* a creature's foe (`c.foe`).
- **Cogitomap** (`cogitomap`) — a map of one Well as charted; since a Well changes, a ticket to a seeded run of it. Copied by Spellscription;
  sold, traded, hauled. → detail
- **the three layers** — a Well (a dungeon), the island (action outside the Wells), the Emocean (travel between islands).
- **a Shrine** (`docs/plans/SHRINES.md`) — a place where you rest (the pool full), are made whole after a shatter, fast-travel to, and enter the
  Spirit Garden. None in the Wells. *Not:* a save point. → detail
- **an ostracon** (pl. ostraca; `src/progress/ostraca.js`) — a potsherd with one neuralese word and a picture of what it does; found once, it
  glosses that word. *Not:* a shard, a plate. → detail

- **a stele / the Crib Sheet** (`progress/ostraca.js`, `/knack`) — a standing stone with three neuralese words in a sentence / the knack that
  glosses neuralese beside each word.
- **the Wake Whistle** (`whistle.wake`) — a clay whistle that takes you out of a Well alive, with your haul; it breaks when blown. → detail

## 6. The Spirit Garden, Soul Alchemy and the mycelium

- **the Spirit Garden** (`game.garden`, `src/progress/garden.js`) — the pocket dimension in your Pneuka Jar, entered at a Shrine: slots, beds and
  upgrades. The **Pneuka Box** is its shed (P). *Not:* "Shrine Garden". → detail
- **Inner Realm** (`game.realm`, `src/world/garden/`) — a player's own Spirit Garden: you are the Pneuka Jar hopping round its planetoids, and the
  god hand over them; spirits are bound until released. → detail
- **the ring** (`ORBIT`, `src/world/garden/orbit.js`) — the ten slots round the Dantian where a bought planetoid is set. *Not:* the hue ring, nor
  the upper ring.
- **Soul Alchemy** (`game.alchemy`, `src/progress/alchemy.js`) — pressing materials walks the Courier's soul colour on the colour wheel; firing it
  inside an attribute's target raises that attribute a rank. Seven attributes. *Not:* "stats". → detail
- **seasoning** (an attribute's; `docs/plans/SOUL-ALCHEMY.md`) — 0..100, filled by doing that attribute's thing; it widens the attribute's swatch
  and firing spends it. A true firing is inside a tile's heart. *Not:* a glaze's stage. → detail
- **material** (`src/progress/econ/materials.js`) — what Soul Alchemy presses, of a broad kind, with a hue, saturation and path. *Not:* "mats" in
  player text.
- **the press at the Athanor** (`GardenPress`, `realm.press`, `src/world/garden/press.js`) — the station on the Athanor's crown: the bath (the
  colour wheel), ware ring, seven tiles, soul bead. *Not:* the plate shrine. → detail
- **wheelColour** (`src/vfx/wheelcolour.js`) — the one colour function of the colour wheel, in Oklab; a bead and its tile are the same colour when
  they are the same place.
- **the mycelium** (`src/progress/mycelium.js`) — the garden's fungi as transmutators: five strains (lichen, koji, inkcap, oyster, witches'
  butter) each work one verb; the tree is Myggdrasil. *Not:* a material's `path`. → detail
- **the tincture / the caps** (`TREE`, `CAPS`) — Myggdrasil's sap (the colour of all it ate) / its ten fruiting bodies. **moonflower**: a bed
  that opens only at night.

## 7. The Emocean and the rail

- **ship** — the Vessoul's sailing form between Islands of Ego: sloop, frigate, tanker, destroyer, galleon. *Not:* the skiff.
- **hop** (`hop()`, `src/progress/econ/emocean.js`) — one crossing of the Emocean from island to island on the node map, fuelled by a full tank
  and sailed as one stage.
- **stage** (`STAGE`) — the rail-shooter run of a hop, about two minutes, authored once; a ship bears six hits before it fails. *Not:* "shield",
  "level". → detail
- **the crossing** (`progress/rail/crossing.js`) — a stage as it plays, 100 bars of the cue, in acts held in a view (chase, above, side, free,
  astern); a swing is the change of view. → detail
- **the rail** (`world/emocean/stage.js`, `game.emocean`) — the crossing as it is sailed: a straight line in a zone of its own, everything that
  fights kept in the rail's frame. *Not:* a rail you grind. → detail
- **plain shot / outlined shot** (`courier/ship/shots.js`) — a foe's shot at sea: a plain one is absorbed or hurts; an outlined one wears the
  parry mark and only the parry answers it.
- **the pier** (`world/emocean/pier.js`) — F at a jetty's end: the node map as a list and the two mounts to take; choosing an island casts off. →
  detail
- **Margarite's dock** (`world/emocean/margarite.js`) — the King's island's quay: the lamp tower, the Pearl Shrine, the Purser, Letty Marque.
  *Not:* Margarite (the island).
- **set piece** (`SET_PIECES`, `progress/rail/setpieces.js`) — a crossing's second half, one of three: the shoal, the Wreckers (the False Light),
  Old Nobody. *Not:* an encounter. → detail
- **leg** (`LEG`, `legsOf`) — one set piece of a long crossing (one to three); a breather between two mends the ship.
- **the flock** (`creatures/ai/flock.js`) — many bodies moving as one (Reynolds' boids), the AI part the shoal is made of. *Not:* a school (a
  wave's role).
- **the lock-on** (RMB held on the rail) — the reticle marks up to eight targets; release fires a lance at each. *Not:* the lock-on on foot. → detail
- **the hurtbox** (`T.ship.hurt`, drawn by `vfx/railshots.js`) — the sphere a foe's shot must touch to hit the ship, drawn in the hull as a pale
  core and a dark ring. *Not:* a hit region (the vessel's six).
- **the storm warp** (`game.stormWarp`, `src/vfx/stormwarp.js`) — the crossing caught in a psychic storm: the world bent, never the danger;
  scaled by the setting `visual.warp`. *Not:* the weather, the glitch. → detail
- **the Astral form / the Umbral form / the surge** (`docs/plans/RAIL-OVERHAUL.md`) — the ship above and below the Emocean (Q; was polarity); the
  surge lets the swarm of lances go on R. *Not:* a seam. → detail
- **mount** (`MOUNTS`, `progress/rail/mounts.js`) — a worn tool carried on the ship, as many as its hull's slots; the psygun is always the gun.
  *Not:* a ship part. → detail
- **par / rank / medal / the tally** (`progress/rail/score.js`) — par an expert's median for a set piece; the crossing's rank its score against
  par (S to D); the medal; the tally, the last log line.
- **reckoning** (`RECKON`, `reckonLead`) — how much of a crossing the Courier has divined (Divination), 0..1 for that day. *Not:* "course" (the
  basement's).
- **the sea chart / the passage / a waypoint / a portent / a rutter** (`src/progress/econ/passage.js`) — waypoints laid between two islands, the
  path drafted through them, one leg, Divination's view of one, a passage's map. *Not:* a Cogitomap. → detail
- **the trip's pressures** (`src/progress/rail/trip.js`) — the hull, the bunker, burn, adrift, heaving to, high water, a waypoint's feeling, a
  following sea, a squall. *Not:* the vessel's cracks. → detail
- **the plume / a front** — an island's weather running out to sea / where two plumes meet and a squall forms.
- **the Drowned Light** — the graveyard leg's drowned lighthouse, the False Light's twin below.
- **the encounters at sea** (`ENCOUNTERS`, `progress/rail/encounters.js`) — the Dead Reckoners, the Last Word (Letty's cutter), the Cantor, Hap
  Lagan and Bob, the Bourse, the Glass, a drift bottle. One not yet met is a **Sighting**. *Not:* an encounter of the Spirit Garden. → detail
- **the Umbral** (`game.umbral`, `src/vfx/umbral.js`) — the world below the Emocean's surface, where the ship's Umbral form fights. *Not:* the
  crossing. → detail

## 8. Records and progression

- **the System** (`src/progress/system.js`) — the game's code made a voice; it teaches the Movement Arts and keeps the save. Always capitalised.
  *Not:* a game system in general.
- **the Codex** (B, `src/feedback/codex/codex.js`) — the System's book: arts, the ledger and records, the tools, the Veritome's shelf, curios.
- **the all-arts switch** (`system.lendAll`) — lends every art without learning it (on in DEBUG, off in STORY); nothing it lends is counted. Label
  ALL ARTS. *Not:* "Lab mode".
- **the ledger** (`src/progress/stats.js`) — every count the game keeps. An **achievement** (`src/progress/achievements.js`) is a predicate over
  the ledger, never a flag.
- **the log** (`src/feedback/gamelog.js`, rules in `tracking.js`) — the only text feedback; **the chat line** is its typing.
- **the domains** (`src/progress/domains.js`, `game.psyche`) — the seven skills of the Courier's psyche: Ouranurgy, Manifestation, Divination,
  Psychokinesis, Possession, Alteration, Spellscription. No new domains, ever. *Retired:* Spellcasting. → detail
- **widening** (`WIDEN`, `game.psyche.widen(key)`) — what a domain's level does in play: a multiplier of a tool's range or a bonus to a count,
  never accuracy; at level 1 the tool is as it is without.
- **knack** (`game.knacks`, `src/progress/knacks.js`, `/knack`) — a passive Art, a toggle, opened by an achievement, where an assist lives; on
  until switched off. *Not:* a widening, nor a Movement Art. → detail
- **Luck** (`src/progress/luck.js`) — the surprise lived through (in bits), read from the ledger; it sways chance, never a skill.
- **day** (`today()`, `src/core/calendar.js`) — one game day, an hour of real time; always written **game day**, no bare "day". *Not:* a calendar
  day.
- **game hour** — a twenty-fourth of a game day, 150 real seconds. *Not:* an hour of play.
- **real time** (real second, minute, hour) — the wall clock; a unit of time always says which clock, game or real.
- **counter / record / first** (`stats.inc`, `stats.hi` / `stats.lo`, `stats.first`) — the ledger's three kinds of entry: a number that only goes
  up, a best, and the play time something first happened.
- **chain** (`chain.<what>`) — the same event n times, each within a set time of the last; it counts once and starts over. See the homonyms.
- **tier** (of an achievement) — Easy to Grandmaster, worth 1 to 6 points; the points buy a standing; some give a title. See the homonyms. →
  detail
- **build** — one published version of the game (v45...). Progress resets on every new build; settings are kept.

## 9. What the game shows and sounds

- **the pause menu** (Esc) — the help pages and the controls. *Retired:* "pause card".
- **the Pneuka Box** (P, `src/pneuka/`) — the inventory (56 slots) and what is worn; with the Veritome out, the bank (the Book) opens beside it.
  *Not:* the Veritome.
- **the map** (M) — called Mind Mapping in the game (`src/feedback/cartography.js`).
- **the dialogue box** (`src/npc/dialogue.js`) — the one window of words in the world.
- **world mark** — a mark that sits on a thing and carries no words: a glyph pop, the interact chevron, the lock-on reticle, the letterbox, the
  fish portrait.
- **the wire compass** (`WireCompass`, `src/vfx/wirecompass.js`) — the tape of ticks at the top of the view while the Dreamvane is worn or the
  Crucibelle is in the hands; the setting `visual.compassContrast`. → detail
- **the pendulum** (`CrucibelleHud`, `src/vfx/crucibellehud.js`) — the Crucibelle's beat for the eye, on the wire compass. *Not:* the metronome
  (the fob on the bell), nor in the rhythm mode. → detail
- **effect** (`game.vfx.play(name)`, `src/vfx/library.js`) — a named VFX entry, played by name; its look is data. **Particles**: the emitter pools
  under the effects.
- **damage look / aura / temper** (`damage.<type>`, `aura.<status>`, `game.temper`) — a damage type's colour and motif on a hit; a status shown
  round its creature; a creature's body showing its mental state (never text).
- **the weather's look** (`game.weatherLook`, `src/vfx/weather.js`) — how the weather and hour are drawn: streaks, motes, halo, aurora, rainbow,
  far bolts; only an open place gets them. → detail
- **the glitch** (`game.glitch`, `src/vfx/glitch.js`) — the data showing through at a big moment: one screen pass; always set off by an event and
  short; the setting `visual.glitch` turns it off. *Not:* a bug's flicker.
- **the overture** (`OVERTURE`, `src/music/overture.js`) — the title's opening cue, "Fortune Favours the Fool", handing on into the title theme;
  **the trailer** (`game.overture`) is the cinematic cut to it. *Not:* "the opening" (the Lockheart's). → detail
- **score** (`src/music/*.js`) — a piece of music written as data. **Track**: a score as the sound test lists it. **Cue**: the score a place or
  moment calls for (`src/music/choose.js`).
- **the ambience** (`game.ambience`, `src/audio/ambience.js`) — what the weather and game hour sound like where the Courier stands. *Not:* the
  Spirit Garden's beds.
- **gesture** (`Gestures`, `src/tools/toolbody.js`) — a held tool's own clip that is not a blow, played once over its stance. *Not:* a shot, nor a
  move.
- **the rhythm mode** (`game.rhythm`, `src/music/rhythm/rhythm.js`) — a track played as a rhythm game on keys 1 to 0, begun from a stage in a
  room. *Not:* the Crucibelle's field playing.
- **note chart** (`noteChart`, `src/music/rhythm/chart.js`) — the notes the rhythm mode asks for, drawn from a score's lead; a lane is one of its
  ten keys. *Not:* "chart" alone (the map's).
- **grade / rating** (`src/music/rhythm/judge.js`, `src/ui/rating.js`) — grade is how near a press came (perfect, great, good, miss); rating is
  the maker's word over the line, from Miss! to Wow. *Not:* the same thing.
- **the arranger** (`src/music/arranger.js`) — plays a score a bar ahead of the audio clock, moving between sections on the bar line.
  **The band** (`src/music/band.js`): its instruments.
- **the stack** (`stackOf`, `railHeat`, `src/music/legs.js`) — how many of a crossing leg's eight musical parts sound: its phase's own plus the
  **heat** each lock, down and boss part adds (Rez's layers). *Not:* a layer (the map's), the mood layer.
- **mood layer** (`moodLayer`, `src/music/mood.js`) — the weather heard as a few quiet notes over a cue; the night **thins** every cue. **The
  scale** (`game.music.scale()`): the five notes the Crucibelle plays along in.
- **busking** (`src/world/busk.js`) — the rhythm mode played for tips on **a busker's mat** at a pier. **The busking body**
  (`courier/moves/rhythmhold.js`): the Courier playing it (a gesture a press, the jam at a combo of 10).
- **the Lockheart's cue** (`LOCK_CUES`, `src/music/lockheart.js`) — the music under the Opening, a mode each, and its **landing** when the wheel
  lands. *Not:* the Opening itself.

## 10. Engine and process

- **event** (`game.events`) — a message on the bus, named `domain.verb`; its payload never uses `name` or `t`, and an outcome carries `by`.
- **rescue** (`courier.rescue`, `Player.guard()`) — the body's safety net taking it out of a bad state, counted by the stress test, never hidden.
  *Not:* the cutlass's guard.
- **tag** (`src/core/tags.js`) — what a tool may do to a thing and what it is made of.
- **module / division / round / the gate** — a file under `src/`; one of the five Claude sessions (Petra, Dovina, Wanda, Calissa, Espada); one
  cycle of work (R42...); Petra's review of every push to main. → detail
- **seam** (`game.seam`, `src/render/seam.js`) — a change of place made under a cover (dip to the dark, change, come back). *Not:* a texture seam.
- **the save** (`game.save`, `src/core/save.js`) — everything the game keeps in the browser, in sections of scope player, world or settings.
  *Not:* `save()` on a module. → detail
- **the seed** (`?seed=N`, `game.seed`) — the number the session's chance is drawn from; a stream is one module's own draw. *Not:* a Well's
  `wellSeed`.
- **the agent** (`game.agent`, `src/agent/agent.js`) — the game as an AI player sees and drives it. *Not:* a creature's mind.
- **playtest** (`npm run playtest`) — a scenario an agent plays to its goals. The stress test fuzzes; a playtest plays.
- **a sweep** (`scripts/sweeps/<room>.mjs`) — one room entered, worked and left headless, a PASS/FAIL line a check. *Not:* the stress test, a
  playtest, the Soul Brush's mop, the kick's leg sweep.
- **replay** (`game.replay`, `src/core/replay.js`) — a session kept so it plays again the same: a header and the frames. *Not:* a chat command. →
  detail
- **the casebook** (`docs/CASEBOOK.md`) — every bug fixed, with its cause and the rule it left. *Not:* the log, a report, the ledger.
- **QAIS** (F8, `game.qais`, `src/debug/qais/`) — the development window where the owner tests a build: the Brief, QAIS tests, reports, questions.
  Always "QAIS". *Not:* the System, the F3 panel. → detail
- **QAIS test** (`tests/T<n>`) — one thing for the owner to try in a test session. Always "QAIS test" in full. *Not:* a playtest, the stress test,
  a trial.
- **debug chest** (`DebugChest`, `src/debug/kits.js`) — a crate in the magenta-and-black checker beside a feature sent for testing, its kit topped
  up at each F; nothing it gives is counted. *Not:* a chest, the all-arts switch.
- **the kit** (the `kit` section) — the Pneuka Box and the belt, kept as one. *Not:* the Lockheart's kit.
- **the tuning panel** (Tab, `src/debug/tuning.js`) — live sliders and actions. A **setting** is the player's own preference; a **knob** is any
  other number; a knob off its default is tuned. → detail

- **a choice card** (`ChoiceCard`, `src/ui/choicecard.js`; Calissa's) — CLARITY's card: one choosable thing shown as icon, label, one line,
  stat chips, key and state. Code and docs only. *Not:* a Veritome card.
- **a label / a lore name** (`name` / `lore` on a data table; `docs/plans/CLARITY.md`) — what the UI calls a thing (a genre word: *Grapple*,
  *Bomb*) / the world's name for it (*the hook*, *the toll*). The UI shows only the label. *Not:* two things.

## 11. Homonyms we keep on purpose (always qualify them)
| word | its meanings | say |
| --- | --- | --- |
| mind | a creature's (`Brain`); THE MIND (the macro shelf); Mind Mapping (the map) | "a creature's mind", "THE MIND shelf", "the map" |
| charge | the psygun's beam; the Lockheart's fill; the Veritome's capture | whose charge |
| key | a keyboard key; a Possibilikey | "Possibilikey", in full |
| station | a course station (checkpoint); the kiln station | "course station", "kiln station" |
| theme | the window colour (`ui/theme.js`); a piece of music | "window colour", "music theme" |
| card | a Veritome card; the tarot cards falling on the title; a choice card (CLARITY's, the UI's) | "card" is the Veritome's; the title's are scenery; "a choice card" in full |
| shard | a broken pot's piece; the crystal shard (item) | "crystal shard" in full |
| tier | a chest's; an achievement's (Easy .. Grandmaster); a fish's (1 .. 5); the folk's (earthenware .. the Court) | "chest tier", "achievement tier", "fish tier", "the folk's tiers" |
| rank | a Veritome card's (SS .. H); a Lockheart outcome's (0 dud .. 4 jackpot); the standing (Sweeper ..); an attribute's step (Soul Alchemy); a crossing's letter (S to D) | "card rank", "outcome rank", "standing", "an attribute's rank", "the crossing's rank" |
| chart | the map's (charting the ground, a Cogitomap); the rhythm mode's note chart | "chart" is the map's; "note chart" in full |
| chain | a run of one event (the ledger's `chain.<what>`); three downs of one feeling on the rail | "a chain of ...", "a feeling chain" |
| combo | the club's chain of blows; the rhythm mode's run of notes | "the club's combo", "a rhythm combo" |
| Well | the Weir's well of liquid Lachryma (a place); a Well, a pocket of distortion (a dungeon) | "the Weir's Well", "a Well" |
| place | a named spot things are sent to (`game.places`); where a weather falls (`placeOf`: an island or `well:<id>`) | "a place" is `game.places`'; "the weather's island" or "the Great Dunemaw's weather" |
| day | a game day (`today()`); the bright part of it (`phaseAt` 'day') | "game day"; "daytime" |
| calm | no weather (`aspect` null, the log's "fair"); the swells laid down for a stage's breather | "fair" for weather; "a calm" for the stage |
| hold | a ship's hold (casks); to hold the save; a rig's hold (a clip's stretch rocked while a move is held) | "the ship's hold"; "hold the save"; "the clip's hold" |
| move | a blow of the combo engine (`kick.hit`); a rig's move (`RigClips`: a named clip choice) | "a blow" or "the kick's move"; "a rig's move" |
| hop | a crossing of the Emocean (`hop()`); the Pneuka Jar's bounce in the garden (`JarHop`, clip `hop`); a sporeling's bounce | "a hop" is the Emocean's; "the Jar's hop", "a sporeling's hop". A spirit's body is `s.body`, never `hop` |
| slam | the Soul Brush's (air, ground); the Great Slip Jelly's; the god hand's clip | "the brush's slam", "the Great Slip Jelly's slam", "the hand's slam" |
| gulp | the Lockheart's parry; a mount on the rail; the Pneuka Jar's clip | "the Lockheart's gulp", "the gulp mount", "the Jar's gulp" |
| kiln | the workshop's (the kiln station, `kilnUI`); the Heavenly Kiln (`Tribulation`, `world/garden/tribulation.js`) | "the kiln" is the workshop's; "the Heavenly Kiln" in full |
| art | God Arts; Movement Arts; the god hand's garden strokes (`ARTS`, `garden.art`) | "a God Art", "a Movement Art", "the hand's stroke" |
| Jar | the Pneuka Jar (the Vessoul's form; in the garden `realm.jarBody`); the god hand's jar model (`god.jar`) | "the Pneuka Jar"; in code `jarBody` for the garden's body |
| emote | the Courier's (`EMOTES`); a creature's onset clip (the Lantern Wisp's three) | "an emote" is the Courier's; "the Wisp's emote clips" |
| dive | the Soul Brush's dash attack (`Brush_Dive`); a dive into water or wet slip (`waterfx`); the ledger's old `brush.slam.dive` | "the brush's dive"; "a dive into the water" |
| counter | the ledger's count (`L.inc`); the blow that answers a guard or parry (kind `counter`) | "a ledger counter"; "the counter" is the blow |
| eye | the EYE CUP kiln pattern (6); the camera's point of view; Old Nobody's; the shoal silhouette's (`SilhouetteEye`) | "the eye" is the kiln pattern; "the camera's eye" or "round the view"; "Old Nobody's eye"; "the silhouette's eye" |
| wheel | Plutchik's wheel of feelings; the Lockheart's wheel of odds; the party's order wheel (T held); the colour wheel (Soul Alchemy's; in play, the bath) | "the wheel of feelings"; "the Lockheart's wheel"; "the order wheel"; "the colour wheel" |
| sigil | the Soul Brush's (strokes read in Celestial mode); the Solar Skiff's (the ring of marks on the sand) | "a sigil" is the brush's; "the skiff's sigil" in full |
| dome | the sky's (`vfx/sky.js`); the stern of the Solar Skiff's hull | "the sky's dome", "the skiff's dome" |
| lattice | reprogramming's lattice of Functions; the ambient geometry's folding lattice (`G.lattice`) | "the macro lattice"; "a folding lattice" |
| ring | a Solar Skiffing ring (`SolarRing`); a rail ring (`G.ring`); the spirit press's hue ring; an intensity ring (the wheel of feelings); a lane mark's rings; the ring (the orbit's ten slots, `ORBIT`) | "a Solar Skiffing ring", "a rail ring", "the hue ring", "an intensity ring" |

## 12. Retired words
| retired | say instead | where it still is |
| --- | --- | --- |
| Shrine Garden | the Spirit Garden | (gone; kept: the owner's own word) |
| film, a roll of film (`mat.film`, `loadFilm`, `film.load`) | the Veritome's memory (`VeritomeMemory`) | `audio/cues.js`, `pneuka/thingmodels.js` |
| Lab mode | the all-arts switch (`lendAll`, `setLendAll`; label "ALL ARTS" for now) | `docs/DESIGN.md` |
| vessel (for the god hand's jar) | the jar | (`sfx.jarHit`, R42) |
| polarity (the ship's feeling on the rail) | the Astral and Umbral forms | `src/courier/ship/`, `world/emocean/` (29 uses; the check's list is Petra's) |
| course (for moving between rooms) | rooms (`game.rooms`) | `game.course` (`src/world/basement/basement.js`) |
