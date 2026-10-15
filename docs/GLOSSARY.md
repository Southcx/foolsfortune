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
- **vessel** (`game.vessel`, `src/courier/vessel/`) — the Courier's body, of its base material, and what is done to it: glazes, cracks, shattering,
  reforming. Its words hold for any material (`docs/plans/REGISTERS.md`). *Not:* the god hand's jar.
- **base material** (working name, Espada's and the owner's to name) — what the vessel is made of: clay first (Kaolin Anagami's format), others
  earned where other islands adapted it (a Glass Courier); your look, carried everywhere. *Not:* a material (Soul Alchemy's), a glaze.
- **crack** — damage to the vessel, per region (mask, torso, arms, legs), in the base material's way (clay cracks, glass crazes); it mends
  slowly or at once at a finishing station (on Anagami, the kiln: MEND). *Not:* a pot's cracks.
- **shatter / made whole** (`courier.shatter`, `courier.reform`, `src/courier/vessel/death.js`) — the Courier's death, and being made whole again
  in the workshop. Player text says "made whole" or "re-formed", never "reform".
- **glaze** (`src/courier/vessel/glazes.js`) — the vessel's coat, a colour fired onto a region at a finishing station (on Anagami, the kiln):
  FIRE keeps a look, MEND refires the cracks; a rare one also has a kiln pattern. Holds for any base material. *Not:* a material, nor a Firing. → detail
- **sibling** (`game.party`, `src/coop/sibling.js`) — one of the five divisions as a Courier in the owner's world, with its own mind and tool; met
  once, then called or dismissed at a Shrine. *Not:* a spirit, nor a guest. → detail
- **a sibling's shatter** (`game.siblingShatter`, `src/vfx/siblingshatter.js`; `sibling.reform`) — a sibling emptied by your blows breaking into
  shards of its glazes that lie a beat, then fly home and make it whole beside you, its joins gold. *Not:* the Courier's shatter. → detail
- **the party** (`game.party`, `src/coop/party.js`) — the siblings called into your world (two at once; four players at most, guests included),
  and what you tell them with `/sib`.
- **guest** — a person who joins your world over the published page's room (a co-op player). *Not:* a sibling.
- **voice card / drift** (`PERSONAS`, `drift()`, `src/coop/personas.js`) — a sibling's voice written as form and lexicon / the house voice's
  tells a line slides back to, banned for all five.
- **asking a sibling / letter** (`@name words`, `/letter name words`; `src/coop/answer.js`) — a question a sibling answers in seconds, in its
  division's voice / words sent to a division's own session, answered in minutes. *Not:* each other.
- **the god hand** (~, `src/godhand/godhand.js`) — the mode where the Courier becomes a jar and you become a hand.
- **a miracle / an epic miracle / the island's matter** (working names; `docs/plans/GODHAND.md`) — a feeling's weather the hand calls down by
  drawing its sign / one of seven great ones, one a domain, paid as a release from the vessel (SPINE.md 4) / the ZoI's layered ground the hand moves: the island's firm and loose layers (`GROUND`, `godhand/matter.js`; on Anagami, clay and sand), Lachryma, crude. *Not:* a God Art.
- **a creation** (`game.creations`, `src/godhand/creations.js`, voxels `godhand/voxels.js`) — voxel matter of the island's firm layer the hand raises
  with Sculpt (a pillar, an arch, a ramp), meshed smooth; it crumbles back into the island's matter over about a game day, unless Set. *Not:* Manifest's wall, the island's matter.
- **a god power / the ramp** (`GOD_POWERS`, `POWER_EVENTS`, `godhand/powers.js` / `RAMP`, `rampOf`, `progress/godpowers.js`) — one of the hand's arts,
  each a domain's, opened by its level / each power's numbers from where it opens to 99, Creative mode at the top (GODHAND.md 11). *Not:* a widening.
- **the bracelet / a charm** (working names, Espada's and the owner's; `docs/plans/BRACELET.md`) — the one ring the Vessoul wears in every form
  (the hand's wrist, the Pneuka Jar's choker, the Courier's wrist), its glow the hand's state / what sits in one of its seven domain
  sockets and bends that domain's powers. *Not:* a Possibilikey, a tool, the Lachryma ring.
- **dissonance / the Dissonance Level** (`game.rejection.dissonance`, `.level`; event `god.dissonance`; the owner's words, 2026-10-13) — how far an
  island knows it is being warped by the hand, climbing with each act and ebbing in quiet (as in cognitive dissonance) / its step, 0 to 5.
  *Not:* "heat", nor the mending.
- **rejection** (working name; `docs/plans/GODHAND.md` section 10) — the island's immune response at a Dissonance Level: the stronger
  Figments it sends; cooled by the mending and a Shrine. *Not:* the mending, a raid.
- **the jar** (`jar`, `jar.hit`) — the Pneuka Jar, the Courier's true form; Courier, god hand and jar are one entity. Player text says "your
  Pneuka Jar", never "the jar". *Not:* the vessel. → detail
- **the bracelet** (working name; `Bracelet`, `src/vfx/bracelet.js`; `docs/plans/BRACELET.md`) — one ring worn by the Vessoul in every form
  (the hand's wrist, the Pneuka Jar's choker, the Courier's wrist): seven domain sockets holding charms; its glow is the hand's
  state. *Not:* a tool, a Possibilikey, .hack's bracelet (the data drain plays on the Veritome).

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
- **the seven feelings** (`ASPECTS`, `DISPLAY_ORDER`, `src/progress/weather.js`) — the aspects of Lachryma, always shown most positive to most
  negative: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread. All seven start locked; each is learned at its awakening. *Not:* "hunger", "Faith" (cut). → detail
- **an awakening / a vantage** (`feeling.wake`, `progress/feelings.js`, its moment `feedback/awakening.js` / `VANTAGES`, `vantage.reach`,
  `src/world/vantages.js`; `docs/plans/FEELINGS-AWAKENING.md`) — the moment a feeling is learned (the verb: awaken to, never "wake", which
  is the Wake Whistle's, a ship's and a creature's), by an act that is that feeling (or drinking it in its weather on 5 occasions): its
  weather floods round you, one line in its own voice, the body's answer once free (`feeling.embody`) / a hand-placed lookout whose view
  awakens Wonder; player text says "vantage point". *Not:* a notice from the System.
- **a heavy look / the flood / a feeling's clip** (`LOOK[aspect].heavy`, `heavyOf`, `vfx/weather.js` / `game.awakeningLook`, `vfx/awakeninglook.js` /
  `FEELING_CLIPS`, `courier/anim/feelingclips.js`) — a weather's look at strength 1, its feeling's big gesture / that look breaking out round the
  Courier for about four real seconds at an awakening, indoors too / the Courier's body answering it (on `feeling.embody`). *Not:* a spell, an emote. → detail
- **agate** (`AGATES`, `agateOf`) — two feelings felt at once, shown as one: the stronger is what happens, the weaker its colour. Opposites cancel
  instead. → detail
- **weather** (`game.weather`, `src/progress/weather.js`) — an island's mood, falling as Lachryma: one of the five aspects or calm, with a
  strength; a spell holds a block of game hours. → detail
- **the day's phases** (`phaseAt`, `lightAt`) — night, dawn, daytime and dusk on the game clock. *Not:* a game day.
- **faucet / drain** — where cubes come into the world / leave it. **A minute of play** is the economy's unit (`docs/ECONOMY.md`).
- **the aim** (`ECON.perMinute`) — what ordinary play should earn in a real hour (480 cubes); a source is judged as a multiple of it.
- **sink** — a drain the player chooses and that never fills (the glazes, the Spirit Garden, base materials). *Not:* any drain (the Tithe is a drain, not a sink).
- **crude** (`ECON.crude`) — liquid Lachryma as a cargo, carrying no feeling, named for its **field** (`ECON.crude.fields`: Margarite, Dunemaw,
  Entropolis) as oil is Brent; refined, it takes a feeling again (wonder Lachryma); volatile, so it can spill. *Not:* a bauble, nor graded by feeling (the owner, 2026-10-11).
- **cask** (`cask.<field>`) — the unit of crude, carried in the Pneuka Box; a ship's hold is how many may cross (a sloop holds 8).
- **the Purser** (`purserPrice`) — the trader at Margarite's dock who buys crude, materials and Cogitomaps at a posted price, never haggled. The
  role is the name.
- **bounty** (`bountyPay`) — a hunt for a named Egregore or a stray or aberrant Figment, under the King's marque (Letty Marque). Commissions
  (Seger's hunts by class) were cut (the owner, 2026-10-09).
- **tool** (`src/tools/`) — one of the Courier's psychic tools, worn on the belt: the psygun, Sondelass, Soul Brush, Veritome, Dreamvane,
  Crucibelle, Lockheart. *Not:* a Node script.
- **the belt** (`game.belt`, `src/tools/belt.js`) — where tools are worn; "is a tool out?" asks here. **Draw / stow** take a tool in hand / put it
  back.
- **the prone holster** (`game.proneHolster`, `src/tools/proneholster.js`) — lying down puts the tool in the hands away through the belt and
  draws it again once up; no tool comes out on the belly. *Not:* a holster (where a tool is worn).
- **fitting** (`FITTINGS`, `src/pneuka/box.js`) — what fits into a tool (a lure, an instrument, the Lockheart's keys), kept in the Pneuka Box. A
  tool never has an inventory of its own.
- **the psygun** (`game.weapon`, `src/tools/psygun/weapon.js`) — the gun. A shot is one round; a charge winds up a piercing beam; a shell is a
  special round in a chamber. → detail
- **a caster shell / the Caster's toll** (`SHELL_TYPES`, `CASTER_SHELLS`; `docs/plans/CASTER-SHELLS.md`) — a shell, TYPE-00 to TYPE-99: a carrier, payloads and a
  field, in four tiers (I common .. IV the Caster's own) / what a tier IV costs: a cracked region of the vessel. *Not:* a shot, a mount.
- **the shell runner** (`ShellRunner`, `game.shells.runner`, `src/tools/psygun/shellrunner.js`) — what flies a caster shell from its row: its
  carrier, then its payloads (`shellpayloads.js`) where it lands; the plan's mechanics are its **parts** (`shellsplitchain.js`,
  `shelldeployables.js`, `shellbodies.js`, `shellspacetime.js`, `shellcastersown.js`). *Not:* the Shells class (the chambers and counts).
- **a shell's look** (`shellLook`, `SHELL_LOOKS`, `src/vfx/shelllooks.js`, a family's in `vfx/shelllooks/<family>.js`; effects
  `shell.<id>.<moment>`) — a caster shell's body, tail and marks at its moments (fly, touch, land, fire, set), asked by the shell runner
  by shell id. *Not:* the caster shaders (its parts).
- **the Sondelass** (`src/tools/sondelass/sondelass.js`) — the blade with three forms: the cutlass, the rod (angling), the hook (the grapnel). →
  detail
- **the Soul Brush** (`src/tools/soulbrush/soulbrush.js`) — the club, the flick, Celestial mode (sigils; **Celestial mode's mark**, the ensō
  held over a target a dot chose: `celestialMark`) and inscriptions; the tool of environmental Lachryma, in paint and mop modes. → detail
- **blot** (`stain`, `STAINS`, `src/world/ground/stains.js`) — spilled crude on the ground, of its field, in crude's oil film; left alone it
  grows, and a full-grown one gives up a blotling (an aberrant Figment, of the weather's feeling where it rises). *Not:* "stain" in player text. → detail
- **a slick** (`slick`, `game.slicks`, `src/vfx/slicks.js`) — crude thrown or welled up in a fight (a cast's puddle, a spit glob, a burst
  jelly, a gusher's spill): it oxidises and fades. *Not:* a blot (which stays and grows). → detail
- **the oxidation ramp / featTint / the slip schiller** (`OXIDATION`, `featTint`, `schillerInk`, `src/vfx/oxidation.js`; `SLIP_SCHILLER`, `vfx/labradorite.js`)
  — how Lachryma left in the open turns (the bauble's and a slick's one clock and oil film) / the film's hue shift every feat of the
  Courier's power wears (`schillerInk`: a mark's ink with the film flashing through it) / the Lachryma's faint flash under a slip body's clay. → detail
- **a Lachrymato Bottle** (`BOTTLES`, `src/progress/brushload.js`) — an aquarium-glass bottle worn at the upper back; a reserve that feeds the
  pool below half and is what paint spends and mop fills. *Not:* "tank", ever.
- **paint motif** (`PAINT_MOTIF`, `src/vfx/paintmotifs.js`) — the pattern a feeling's paint carries on the ground beside its colour (Wonder
  frost, Mirth dots, Desire ripples, Fury cracks, Gall curds, Grief streaks, Dread marbling); crude's is an oil film. *Not:* a kiln pattern. → detail
- **the paint reticle / the jet ring / the shine / the bottle's arc** (`PaintReticle`, `JetRing`, `CleanShine`, `src/vfx/brushmarks.js`;
  `BottleArc`, `src/vfx/bottlearc.js`) — where the stream lands and its spread; the hover's fuel or the rocket's gather at the feet; ground
  just cleaned; the bottle's fill beside the paint reticle (`game.paintReticle`). No words. *Not:* the lock-on reticle, the Lachryma ring. → detail
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
- **the paid cut** (working name, Espada's and the owner's to rule; `paidCut`, `move.cut`, `tools/moveset.js`) — a press in a blow's recovery,
  its strike past, that pays Lachryma for the next move at once. *Not:* a cancel, nor the free recovery cut. → detail
- **the melee loadout** (working name, Espada's and the owner's to rule; `SONDELASS_LOADOUT`, `SONDELASS_MOVES`, `sondelass/sondelassloadout.js`) —
  the Sondelass's moves the Courier has slotted: LMB's string of normals, RMB's specials (tapped, with W, with S). *Not:* the kit. → detail
- **the string row** (`CutlassStringRow`, `src/ui/cutlassstringrow.js`) — the melee loadout's string as pips at the bottom middle while the
  cutlass is drawn: the next LMB's lit gold, the pause string's row over it, the oil film's glint while the paid cut is open. *Not:* the slot
  row, Strawman's attack strings; its pause string's row is never "the fork" (the Dreamvane's). → detail
- **the hook's mark** (`HookMark`, `src/vfx/hookmark.js`) — the ring on the point the hook would bite, within its reach, while the hook form is
  in hand; brackets close on it for a catch. *Not:* the chevron, the lock-on reticle. → detail
- **a guard break** (`hit.guardBreak`, `breakGuard()`, `tools/moveset.js`) — a blow that opens a guard (Strawman's) for a beat and lands
  through it: the cutlass's Guard Break and Guard Crush. *Not:* the guard (V), nor the parry. → detail
- **the loadout editor** (`tools/sondelass/loadouteditor.js`; kept by `game.sondelassLoadout`, save section `sondelassLoadout`; what is open:
  `loadoutopen.js`) — where the melee loadout is chosen: its slot rows beside its moves as choice cards, at the sparring circle's lectern and on
  the Codex's SONDELASS shelf. *Not:* the lend panel, the Pneuka Box. → detail
- **shot** — a psygun shot, and only that. A scripted camera is a camera shot (`cinema.shot`); a photograph is a plate.
- **damage type** (`src/progress/combat/types.js`) — what kind of force a blow is: Impact, Ego, Influence, Illusion, Delirium; each builds a
  status and trumps one other. *Not:* an element. → detail
- **the parry** (V; `courier/parry.js`) — the one button that answers a blow or projectile in a short window, in the way of the tool in hand.
  *Not:* the guard (the held block). → detail
- **the kick** (`courier/moves/kick.js`) — the unarmed moveset, V with nothing in the hands; the first 0.26 s of every blow is the parry. *Not:* a
  hook (the Sondelass's) or a sweep. → detail
- **windup** (`creatures.windup`, `c.windup`) — a creature's telegraphed blow, listed while it can be answered; a parry in its window breaks it
  off. *Not:* an attack's own phase name.
- **Figment attack telegraph** (`figmentMarkOf`, `src/progress/combat/figmenttelegraphs.js`; drawn by `game.figmentTelegraphs`,
  `src/vfx/figmenttelegraph.js`; `docs/plans/FIGMENT-TELEGRAPHS.md`) — what Divination draws of a creature's windup in the third-person
  game, over the body's tell, saying more as it rises: where (the edge), when (the fill), what kind (the type's colour, the status glyph),
  how to answer (the answer glyph). Always named in full, or "Figment telegraph". *Not:* the rail's telegraph mark, the windup's
  animation, the parry mark. → detail
- **the rail's telegraph mark** (`TelegraphMarks`, `src/vfx/telegraph.js`) — on the rail, the ring closing on a boss's part about to act.
  *Not:* a Figment attack telegraph.
- **the core movement** — walk, sprint, slide, jump, wallrun, mantle, dash, and the humanoid moves (swim, ladders, hanging, poles, grates,
  balance, carrying, pushing). The gold standard: nothing changes it.
- **the prowl / the crawl** (`PROWL`, `src/courier/anim/prowl.js` / `CRAWL`, `s.crawl`, `src/courier/anim/crawl.js`) — the crouch on the move,
  low, its head held steady / on the belly under what the crouch cannot pass: prone, the third of C's cycle (`player.posture`: stand,
  crouch, prone; a 0.8 m capsule). *Not:* a tech, nor the wall latch's crawl along a wall.
- **the drawn run** (`stance:cutlassRun`, `stance:cutlassSprint`, `courier/anim/stances.js`; `drawnRun`, `tools/sondelass/sondelass.js`) — the run
  and the sprint with the cutlass in hand: the run's own body, the blade held low and back. *Not:* the dash slash, a tech.
- **the Paint Dive** (`courier/moves/slip.js` for now; `docs/plans/PAINT.md`) — C held in wet paint or crude: the Courier melts into it
  and swims, Splatoon's squid form. *Not:* the brush's dive, a dive into the water. *Retired:* "slip dive".
- **the paint map** (`game.paintmap`, `src/world/ground/paintmap.js`; `docs/plans/PAINT.md`) — the one store of Lachryma on surfaces: a
  feeling's paint or a field's crude, cell by cell, in charts (a floor, a box's face); everything that paints, mops, spills or dives
  asks and writes it. *Not:* the trail map (prints in sand), the map (M).
- **tech** (`Tech`, `src/courier/moves/techs.js`) — code only: anything that takes the Courier's body for a while. In the game, a learned one is a
  Movement Art.
- **Movement Art** (`src/progress/skills.js`) — a tech the System teaches; a variant is one of its versions.
- **emote** (`EMOTES`, `src/courier/emotes.js`) — the Courier's body language asked for on the chat line (/wave, /sit, /dance): a clip played
  once, looped, or as a triple. *Not:* a gesture, nor a creature's emote clips. → detail
- **the skiff / Solar Skiffing** (`src/courier/skiff/skiff.js`) — the sand boat, and sailing it in the Dunes. *Retired:* "surfer". *Not:* the
  sloop (the Emocean's ship). → detail
- **the carve / a late pop / a sun plate / the glide lip** (Espada's, 2026-10-13; a sun plate's UI label: Boost pad; `CARVE`, `POP`, `PLATE`, skiff.js; `docs/plans/SKIFF-RACING.md`)
  — Q or E held on the sand at speed (its side): the board slides and loads in three tiers, let go it runs out with a push (MK8's drift) / a hop
  let go just after leaving a crest, higher / a glyph on the Raceway's sand that gives a flare's push for free / the Raceway's lip whose
  air opens the glide by itself. *Not:* the club's combo, the hop, the flare, the Gnomon's rings.
- **the Raceway / a race / the solar start** (Espada's, 2026-10-13; `game.raceway`, `game.race`, `src/world/raceway/`) — the Solar Skiff's
  test circuit, of the Dunes' kit in a place of its own (x 5200), its line laid in `track.js` / three laps through eight gates against
  the clock, begun at the start's pillar / the sail run up full just after GO, a push off the line. *Not:* the Solar Skiffing trial
  (the Gnomon's rings), the course (the basement's).
- **a grind / a rail / a sun ring** (working names, Espada's; `Grind`, `courier/skiff/grind.js`; `railsrings.js`) — the skiff's keel fin locked to a
  rail, run with A / D's balance, no tool but the skiff / a ruin's lintel on the Raceway the keel locks to / the Gnomon's ring hung in the
  Raceway's air, flown through for a push. *Not:* the rail (the Emocean's crossing), a Solar Skiffing ring (the Gnomon's trial).
- **the grab's reach** (`GrabReach`, `GRIPS`, `src/courier/skiff/grabreach.js`) — a grab's hand on the skiff's gunwale while held: the front
  hand ahead of the front foot (nose), the back on the stern's lip (tail), both between the feet (double), over the ollie's crouch; a grind trick's too (the tail slide's hand to the stern, the nose grind's lean over the bow, the 50-50's arms out). *Not:* the
  grab's trick (skiff.js), the board's tweak, the carry's hold.

## 4. Creatures and folk

- **the cavern** (working name, Espada's to rule; `BRANCH`, `T.branch`, `world/raceway/cavern.js`) — the Raceway's alternate course: a branch
  off the line into a gorge under a roof of stone and back, its pads crystal veins (fed by Lachryma, not the sun). *Not:* a Well, the canyon.
- **the trick combo / a banked flare** (`SkiffCombo`, `skiff.combo`, `courier/skiff/combo.js`) — the skiff's tricks chained, each kind
  raising the multiplier, banked when the chain's link runs out on the sand, lost on a bail / a flare's worth of push it banks, spent
  whole by C (one stock, a push at once: a mushroom). *Not:* the club's combo, a rhythm combo, a ledger chain.
- **a grab / a perfect pop / a slope landing** (`skiff.grab`, `skiff.pop { perfect }`, `skiff.land.slope`) — LMB (the nose) or RMB (the
  tail) held in the air, let go before landing / a late pop let go in its first moment / landing square down a slope, the fall kept as speed.
- **the park / the hub** (`park()`, `PARK`, `world/raceway/park.js`) — the Raceway since round 4: one ground of several tracks, 2.6 km
  across / its middle, where the Index sets you down among the tracks' starts. *Not:* the basement's hub (the Index's).
- **the Gorge Run / the Coaster** (working names, Espada's; `tracks/gorge.js`, `tracks/coaster.js`) — the park's second and third tracks:
  canyons, cliffs and a crater's spiral / a lift to a mesa and a coaster rail down. *Not:* the canyon (the Sun Circuit's stretch).
- **a cut / a bridge / a bowl / a ford** (`cut`, `features.bridges`, `.bowls`, `.fords`) — a stretch of line laid between steep walls to
  the sand / a stretch built as a deck that another line passes under (`world/raceway/features.js`) / a stretch banked steeper than its
  bend / a stretch under water, skimmed. *Not:* the paid cut, the cutlass.
- **a coaster rail** (`coasterPath`, `world/raceway/coasterrail.js`) — a grind rail laid in three dimensions, with a loop and a helix, each
  point its up and push. *Not:* a rail (a ruin's lintel), the Emocean's rail.
- **an antlion pit / the antlion** (working names; `PARK.pits`, `raceway.pit`) — a cone at the sand's angle of repose whose sand flows to
  its middle / the maw at its bottom that takes a board. *Not:* a Well, a crater (no maw).
- **a rival / rubber banding / a takedown** (working names; `Rivals`, `RIVAL`, `world/raceway/rivals.js`) — a clapperjar on a mini skiff
  racing your race / a leader eased and a trailer pushed by its gap to you / a rival hit hard from the side and spun out, your push.
  *Not:* a creature's foe, a sibling.
- **a grind trick / the race board** (`skiff.grind.trick`; `race.openBoard`) — how the board lands on a rail sets its grind (along it a
  50-50, the plain grind; across it a boardslide, a trick), and LMB or RMB clicked twice on it a nose grind or a tail slide / the stone at the park's hub where a track is picked. *Not:* a grab, the Index.
- **a race's condition** (`conditionAt`, `world/raceway/conditions.js`) — the hour's light and the weather a race is run under (the sun
  plates' power, the sand's grip); each keeps its own best. *Not:* a status, the weather itself.
- **the board's rules** (`BoardRules`, `courier/skiff/boardrules.js`) — what the Solar Skiff answers to at the Raceway: the pool as its hull
  (empty, a hard knock **wrecks** it), **the scorch** (a flare held too long luffs the sail), **the manual** (W and S), **snaking**, **the
  shoulder** (Q / E twice), **aftertouch** (a bail steered), **a near miss**. *Not:* the sailing (skiff.js).
- **a vein lane / a gap / a buoy run** (`lanes`; `GAPS`, `world/raceway/gaps.js`; `BUOYS`, `buoys.js`) — a strip of Lachrymite beside a
  Raceway line that refills the pool / a named jump / buoys passed on their sides for **power**. *Not:* a crystal vein (the cavern's push).
- **a mode / its ruleset** (`MODES`, `world/raceway/modes.js`; `race.ruleset`) — what a run at the Raceway is: a race, a **hot lap**,
  **practice**, a **pot smash**, **the escape**, a **licence test** / the module adding its rules. *Not:* the board's rules, a trial.
- **a cup / the City Trial / a patch / the Stadium** (`cups.js`, `citytrial.js`) — three races for points / Kirby Air Ride's: the park
  roamed for patches that build the board, then one drawn event. *Not:* a chest tier, the Solar Skiffing trial.
- **the wager / the garage / a skiff part** (`progress/econ/wager.js`; `PARTS`, `progress/skiffparts.js`) — cubes staked on your own
  race at the house's odds / the race board's tab where a sail, keel and hull are chosen, each a trade. *Not:* the shell runner's parts.
- **a cap on the pool / a siphon** (`capOf`, `PoolCaps`, `progress/poolcaps.js` / working name, Espada's; `SIPHONS`,
  `world/raceway/siphons.js`) — a modifier lowering the pool's max from a source you can see (each cracked region of the vessel: 5%
  until mended) / an arch across a Raceway track that drinks the pool to a quarter as you pass under it, standing only in the Pit lane licence. *Not:* the shield, the regen.
- **the flyover / the restart / the rewind / the nemesis** (`flyover.js`, `rewind.js`, `rivals.js`) — the camera's cuts along the line
  before a race / Backspace tapped / Backspace held in practice / the rival that beat you last, quicker and clapping. *Not:* a camera shot's name.
- **Raku's Bazaar / a table** (Espada's, 2026-10-15; `docs/plans/CASINO.md`; `src/progress/casino/table.js`) — Raku's casino split off
  the Weir's Treasury, in the Gold Saucer's look / one game's place in it, and its engine: a rules module played by seats, bots and the
  simulator (`scripts/casino.mjs`); the room `game.bazaar` (`src/world/bazaar/`), a seat `TableSession`. *Not:* the Treasury, the Tithe, a chest.
- **the Treasury** (`TREASURY`, `buildTreasury`, `stockTreasury`, `src/world/treasury.js`) — five plinths (a chest of each tier), the Tithe's
  console and its dais, Raku beside it; a piece placed by an origin, in Raku's Bazaar since 2026-10-15 (it stood on the Weir's north beach).
  *Not:* the bazaar, the shop's RAKU'S TREASURY page.
- **Raku chips / a chip** (Espada's, 2026-10-15; `game.chips`, `src/progress/casino/chips.js`) — the bazaar's stake, bought from Raku for a cube each
  and cashed back, winnings capped a game day. *Not:* a cube, the clay knock's chips.
- **Querent / Astroll** (Querent: Espada's and the owner's, 2026-10-15; Astroll: the owner's; `casino/querent/`, `casino/zodiac.js`, `casino/eventhorizon.js`) — the owner's tarot game
  (melds, steals, the Fate Clause, Major Arcana flipped as boons) / the owner's dice games with a standard set (Zodiac, Event Horizon,
  Supernova Run, Nebula Bluff, ...). *Not:* the game's own title (Fool's Fortune), the Veritome's Major Arcana page.
- **a reaction / a Supernova / a tell** (`supernova.js`, `nebula.js`) — Supernova Run's turn of rolling every die until none shows a
  maximum or a 1 / its natural 20 on a d20: points doubled, every hand reset / a Nebula Bluff player's body giving away a bluff (a world
  mark). *Not:* a chain reaction elsewhere, the Supernova as a star.
- **the house deck / the dice set / Raku's chips** (`bazaarAtlas`, `src/vfx/bazaarfaces.js`; bodies and `PieceBatch`, `src/vfx/bazaarpieces.js`) — the bazaar's 78-card Tarot (a house card), the standard set glazed die by die (the attack die gold), the chips by colour (1 ivory, 5 cinnabar, 25 lapis): one atlas, one batch. *Not:* the title's cards, a Veritome card, a cube.
- **the table view** (`BazaarTable`, `game.bazaarTable`, `src/vfx/bazaartable.js`; `vfx/bazaarlayout.js`) — a seat at Raku's tables as its cloth under a camera's frame, the state laid out as house pieces, your choices clicked on them (the page set aside the fallback). *Not:* a table (the engine), the race board.
- **a tell's riffle** (`riffle`, `src/vfx/bazaarlayoutastroll.js`) — Nebula Bluff's tell at Raku's tables (`view.tell`) worn as a world mark: the claimant's top chip lifting and turning on its purse a beat, every couple of real seconds; no words. *Not:* the tell itself (Dovina's rule), a lit choice.
- **creature** (`game.creatures`, `src/creatures/creatures.js`) — a hurtable thing with a mind (a slip jelly, a spirit). A weapon calls
  `creatures.strike`.
- **mind** (`Brain`, `src/creatures/ai/`) — what a creature thinks with: senses, memory, drives, a utility reasoner. See the homonyms.
- **clapperjar** (`clapper`, `src/creatures/clappers.js`) — the clapping pots, the clay folk's lowest tier (earthenware). The code's shorter word is
  accepted.
- **slip jelly** (`src/creatures/jelly/`), **spirit** (`src/creatures/spirits.js`: an ally, called up), **mirage** (a decoy).
- **the Lantern Wisp** (`game.wisps`, `src/creatures/wisp/`) — the Dunes' second creature, on the owner's model and its clip suite: it
  hovers, keeps its distance and casts a ball of its flame the parry sends back. *Not:* a spirit, the Wisp's emote clips (its suite's).
- **a Figment's scatter** (`FigmentScatter`, `game.figmentScatter`, `src/vfx/figmentscatter.js`) — a Figment's or Egregore's death: two vertex-snap
  steps, a beat of its wire, then a pop of motes in its feeling's colour, into the air and the ground. *Not:* a sibling's shatter, the dissolve.
- **status** (`game.stun`, `creatures.status`) — a condition on a creature: stun, halt, slow, sleep, calm, melt, and the four a damage type builds
  (doubt, charm, blind, confusion). → detail
- **EmO**, Emotional Output (`src/progress/combat/emo.js`) — a Figment's agitation, 0 to 1; its Lachryma yield peaks in the optimal band.
- **grain** (`src/progress/combat/temperament.js`) — who a creature's mind is: five traits, each between two poles; it weights the mind and shows
  in movement. *Not:* temper, "personality" or "stats". → detail
- **the crown** (`FOE.crown`, `src/progress/combat/dunemaw.js`) — the broken urn on the Great Slip Jelly's head, cracked in stages then burst off;
  under it, the core, its weak point. *Not:* a chest's tier.
- **Strawman** (`STRAWMAN`, `src/vfx/strawman.js`) — the Workshop's test dummy, stitched by Pip: it never falls and the ledger never counts it.
  Named with no article. Its **attack strings** (`STRAWMAN_STRINGS`, `vfx/strawmanmoves.js`): its moves in a set order, picked at the
  sparring circle's lectern. *Not:* a tool's string (the moveset). → detail
- **the Pithos** — what the folk call the Great Slip Jelly, the Great Dunemaw's FOE, crowned with the broken urn it grew in; the log says "the
  Great Slip Jelly". → detail
- **the folk** (`npc`, `src/npc/`) — any island's people who speak. Anagami's are **the clay folk**, fragments of Kaolin Anagami, in their tiers:
  earthenware (clapperjars) < stoneware < porcelain < the Court. Other islands' folk are their own (Espada's). → detail
- **Figment / Egregore** — a Figment is a thought-construct of an island's own psyche (made up); an Egregore a thought-form of the Emocean (real
  human myth). One at large is a stray or an aberrant. → detail
- **the Prince of Clay** — Kaolin Anagami's main avatar, the most powerful of the folk. "He".
- **the King / the Queen** — Magnus Ibrahim Manus (his island Margarite) and Entra Polearis (hers Entropolis), the Prince of Clay's parents.
- **Contractor / Tulpa** — one who survives the open Emocean is a Contractor, with a Tulpa (a thought-form authored with care).
- **cogitohazard** — the umbrella word for Lachryma's dangers in the environment and maliciously aligned Figments.
- **aqua regia / amethyst** — Margarite's lamp fuel, refined from crude at the Stillhouse / Entropolis's charm for a clear head.
- **Charybdis** (`CHARYBDIS`, `world/emocean/charybdis.js`) — the Whale (class 3) Egregore of the maelstrom, rising Astral and diving Umbral; one
  in every maelstrom. *Not:* the maelstrom (the leg, a place). → detail
- **the whirlpool**, **Charybdis's look** (`vfx/whirlpool.js`, `vfx/charybdis.js`) — the maelstrom's crude turning round its heart, and
  the maw that rises out of it and dives back; its baleen combs, eyes and throat are boss parts. → detail

## 5. Places and the Wells

- **the Emocean** — the collective unconscious, a sea of pure Lachryma outside every island.
- **an Island of Ego** — an island precipitated out of the Emocean where an identity is strong enough; **Anagami Island** is this one, and
  **Kaolin Anagami** the ego it is.
- **layer** (`LAYERS`, `src/feedback/cartography.js`) — one level of the map: the upper floor, the ground floor, the basement, the Dunes, the Great
  Dunemaw; and places at the Dunes' height told apart by their render zone, not their height (the Raceway, Margarite's dock).
- **room** — a named place inside a layer, said by the log as you enter it (`place.enter` carries `room`); also what the Index sends you to.
- **place** (`game.places`, `src/world/places.js`) — a named spot anything can be sent to by id (`well.mouth`, `kiln`). A point, *not* a room.
- **zone** (`src/render/zones.js`) — a render zone: what is drawn from where the camera is. *Not:* the Zone of Influence, nor a crystal's fret. →
  detail
- **the Zone of Influence** — the ground the player has explored. Nothing more, for now. Always named in full (or ZoI).
- **the workshop** — the ground and upper floors: the kiln, the folk, the pots, the gong.
- **the basement** — below the workshop: the hub, the course, the movement lab, the lap circuits, the siege. *Not:* "the lab".
- **the hub** — the basement's centre, where the Index stands. **The Index** (`src/feedback/indexmenu.js`): the console there; F, and pick a room.
- **the Gate's hoops / the gate-out** (`GateRing`, `game.gateRing`, `src/vfx/gatering.js`) — three glazed hoops turning round a pale sphere over
  the Index / bands of light climbing the Courier as a room is chosen there, under the seam, and coming down over them on arrival. *Not:* a ring.
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
- **a mount's preview** (`MountPreview`, `game.mooring.preview(tool)`, `src/vfx/mountpreview.js`) — the mount hovered or chosen at the pier
  drawn on the crude round the moored hull at its size at sea (a fan, a cone, a blast ring, a grapnel line, a viewfinder, a radar's scan,
  a line of fire); no words.
  *Not:* the card's demo loop, the lock-on. → detail
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
  Its **STATUS shelf** (`codex/status.js`): the domains' levels and Soul Alchemy's ranks as two radar charts.
- **the DEBUG save / the STORY save** (`game.mode`; `docs/plans/DEBUG-MODE.md`) — the two separate records the title's choice picks; settings
  shared, nothing else crosses. DEBUG is STORY plus the lend panel, the commands, the debug chests and presets.
- **the lend panel** (`game.lend`, `src/progress/lend.js`) — DEBUG's switches, one a category (arts, knacks, moves, Shrines, Figment telegraphs, ...): a lent
  category answers yes at its gates without the ledger; never counted, never outside DEBUG. The all-arts switch (`system.lendAll`) is its
  arts row. Drawn by `src/ui/lendpanel.js` (the Codex's LENDS, QAIS's Lends); a lent art wears the hollow mark. *Not:* "Lab mode".
- **a preset** (`PRESETS`, `src/debug/presets.js`) — a moment of play as data (ledger counts, kit, cubes, lends, a place), loaded into the
  DEBUG save to start a test there. *Not:* a debug chest (items only), a replay.
- **the ledger** (`src/progress/stats.js`) — every count the game keeps. An **achievement** (`src/progress/achievements.js`) is a predicate over
  the ledger, never a flag.
- **the log** (`src/feedback/gamelog.js`, rules in `tracking.js`) — the only text feedback; **the chat line** is its typing.
- **the domains** (`src/progress/domains.js`, `game.psyche`) — the seven skills of the Courier's psyche: Ouranurgy, Manifestation, Divination,
  Psychokinesis, Possession, Alteration, Spellscription. No new domains, ever. *Retired:* Spellcasting. → detail
- **widening** (`RAMP.tools`, `widenOf`, `game.psyche.widen(key)`) — what a domain's level does to a tool in play: a multiplier of its range or a
  bonus to a count, on the ramp's curve; never accuracy, nor tempo (an attribute's); at level 1 the tool is as it is without.
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
- **a page set aside** (`showPage(..., { aside })`, `src/feedback/indexmenu.js`) — an index-window page in a column to one side with no veil, so
  the world beside it stays in view (the pier's, away from the moored hull). *Not:* a page centred under the veil, Margarite's dock.
- **world mark** — a mark that sits on a thing and carries no words: a glyph pop, the interact chevron, the lock-on reticle, the letterbox, the
  fish portrait.
- **the wire compass** (`WireCompass`, `src/vfx/wirecompass.js`) — the tape of ticks at the top of the view while the Dreamvane is worn or the
  Crucibelle is in the hands; the setting `visual.compassContrast`. → detail
- **a choice card** (`ChoiceCard`, `src/ui/choicecard.js`) — one choosable thing shown as its icon, label, one line, stat chips, key and
  state, its detail on hover; **compare** arrows on what would change; **the slot row** (`slotRow`) a loadout as a bar. *Not:* a card (the
  Veritome's). → detail
- **a keyword** (`KEYWORDS`, `src/ui/keywords.js`) — one of twelve genre words, bold with its icon and explained on hover: Absorb, Parry, Bomb,
  Lock-on, Weak point, Stun, Energy, Cooldown, Charges, Hull, Fuel, Passive; and the melee loadout's four effects, Stagger, Knockback, Launch,
  Guard break (placeholders for Espada's word). *Not:* a label. → detail
- **the UI icons** (`uiIcon`, `src/ui/icons/`) — the choice card's, the keywords' and the Soul Brush's radial's pixel art, a picture of what each
  thing does, in the icons' hand (a light shape keylined dark), palette-swapped. *Not:* the sea chart's icons. → detail
- **a domain's look** (`DOMAIN_LOOK`, `src/ui/domainlook.js`) — a domain's colour, sign and icon; never a feeling's colour. Anagami dresses it as a
  kiln-glaze tile; the identity is the colour and the sign.
- **the pendulum** (`CrucibelleHud`, `src/vfx/crucibellehud.js`) — the Crucibelle's beat for the eye, on the wire compass. *Not:* the metronome
  (the fob on the bell), nor in the rhythm mode. → detail
- **the lens's frame** (`VeritomeFrame`, `src/vfx/veritomeframe.js`) — four corners round what a plate would hold, in the third person while the
  Veritome is drawn and its lens down, set where the aim meets the world. *Not:* the viewfinder (the lens raised), the Snapshot's preview. → detail
- **the toll's reach** (`TollReach`, `game.tollReach`, `src/vfx/tollreach.js`) — the next toll's reach and cone on the ground round the Courier
  while the Crucibelle is in the hands, lit on the beat, a ring under each thing it would stagger. No words. *Not:* the toll's smoke ring. → detail
- **the Lockheart's gauge / the hoover's reach** (`LockheartMarks`, `src/vfx/lockheartmarks.js`) — while the Lockheart is drawn, a padlock beside
  the coffin filling with its load, a socket for each Possibilikey, its shackle up when it would open / the hoover's cone on the ground while it
  draws. *Not:* the wheel of odds, the Lachryma ring. → detail
- **the carry throw's mark** (`CarryThrowMark`, `src/vfx/carrythrowmark.js`) — where a carried thing thrown now would land, and its flight dashed;
  only while the carry holds it and nothing is drawn. *Not:* the crosshair (the psygun's), the god hand's throw. → detail
- **effect** (`game.vfx.play(name)`, `src/vfx/library.js`) — a named VFX entry, played by name; its look is data. **Particles**: the emitter pools
  under the effects.
- **the caster shaders** (`src/vfx/caster/`; the library's `caster` layer, `caster.*` effects; Dovina's plan's S1 to S10) — the looks the caster
  shells are built from, a module a look, each warmed at boot (S1 to S5: `vfx/caster/warmups1tos5.js`). *Not:* a shell, an effect.
- **heat haze** (`HeatHaze`, `vfx/caster/heathaze.js`) — the world bent through hot air in a volume (a flame's cone, a volcano's column, the
  Piercer's glass tube), read from the frame drawn so far (`sceneGrab`, `vfx/caster/casterkit.js`). *Not:* the storm warp's veil.
- **the bubble** (`Bubble`, `vfx/caster/bubble.js`) — a fresnel shell of glass or hard light: a geodesic hex net, guan crackle or clear,
  the thin film over it; rings out where struck. *Not:* the ult dome, the Shrine's.
- **a lightning arc** (`Lightning`, `vfx/caster/lightning.js`) — procedural lightning between two points, branching, regrown at a rate; one
  mesh a copy however many paths. *Not:* the carrier `bolt`, the weather's bolts, the Heavenly Kiln's.
- **a grown skin** (`FrostBisque`, `vfx/caster/frostbisque.js`) — a skin grown over a body from a hit: fired to bisque, frosted, or crazed
  dry. *Not:* a glaze, the vessel's cracks.
- **a portal / a rift** (`Portal`, `vfx/caster/portal.js`) — a linked pair of crude-rimmed eyes, each a window on the other's view / one
  alone on the ground, the Emocean turning below it. The god power Portal (Ouranurgy) opens a portal. *Not:* a seam, a Well's mouth.
- **damage look / aura / temper** (`damage.<type>`, `aura.<status>`, `game.temper`) — a damage type's colour and motif on a hit; a status shown
  round its creature; a creature's body showing its mental state (never text).
- **the weather's look** (`game.weatherLook`, `src/vfx/weather.js`) — how the weather and hour are drawn: streaks, motes, halo, aurora, rainbow,
  bolts, and each one's heavy look at strength 1; only an open place gets them. → detail
- **a room glaze / the room glaze atlas** (`ROOM_GLAZES`, `ROOM_SURFACES`, `src/vfx/roomglazes.js` / `glazeAtlas()`, `src/vfx/surfaces.js`) — a
  real glaze fired onto a room's built surface or its ware (the kilns' natural ash, the hub's salt-glazed brick, the gallery's majolica
  plinths) / the one texture they are drawn from. *Not:* a glaze (the Courier's, `GLAZES`), a material, a surface pattern (`SURFACE`). → detail
- **the Raceway's sandfall** (`RacewaySandfall`, `src/vfx/racewaysandfall.js`) — the sand pouring over the Raceway's lip and down its face: one curved
  scrolling sheet, a fainter one behind, dust at its foot. *Not:* a Great Dunemaw sandfall (a floor's door, `vfx/dunemaw.js`).
- **the Raceway's looks** (`RacewayLooks`, `game.racewayLooks`, `src/vfx/racewaylooks.js`) — the sun plates' glyphs, the start arch's
  countdown lamps, the gates' marks, the carve's sparks by tier and the ghost's hologram. *Not:* the Raceway (the track, Dovina's).
- **the rivals' look** (`RacewayRivals`, `src/vfx/racewayrivals.js`) — the race's three rivals dressed: a mini Solar Skiff, its sail in
  the rival's glaze, a clapperjar riding it that leans into bends, claps as it passes you and tumbles when taken down. *Not:* the rivals
  (Dovina's racers, `world/raceway/rivals.js`).
- **a clay knock / a big break / the pot plume** (`RACEWAY_KNOCK_EFFECTS`, `src/vfx/racewayknockeffects.js`) — a rival bumped (chips, dust, its
  jolt) / taken down (sparks, sherds, a hit-stop) / a pot smashed, grown with the board's speed. *Not:* a takedown (Dovina's rule), a pot burst.
- **the sibling riders** (`RacewaySiblingRiders`, `src/vfx/racewaysiblingriders.js`) — the Sibling roster's rivals in their own rigs on the
  Solar Skiff, riding the Courier's rider clips, their boards in their divisions' glazes. *Not:* the party's siblings, the rivals' look.
- **a hull glaze** (`glazeHull`, `src/vfx/hullglaze.js`; Dovina's `skiffGlaze`) — a glaze fired on the Solar Skiff's hull at the kiln (its
  HULL tab), at a firing's price, tinting the hull's painting. *Not:* a glaze on the vessel, a room glaze.
- **the edge strings** (`RacewayEdgeStrings`, `src/vfx/racewayedgestrings.js`) — beads of light on a thread along both edges of the Raceway's
  running surface, a bright run flowing the race's way just ahead of the board. *Not:* the sun plates' chevrons, the wire compass.
- **the combo's marks** (`SkiffComboMarks`, `src/vfx/skiffcombomarks.js`) — the trick combo worn on the Solar Skiff in the labradorite's play: the link
  ring closing as its clock runs out, the step pips (a stack of chevrons aft of the stern, bigger and warmer a step), the banked flares as three little suns standing over the stern, one popping out as C spends it. No words. *Not:* the Lachryma ring.
- **the skiff on water** (`SkiffWaterLook`, `game.waterFx.skiff`, `src/vfx/skiffwaterlook.js`) — the Solar Skiff skimming water: the splash on and off
  (in Lachryma's colour on Lachryma), the spray off the keel, its V in the ripple tank. *Not:* the wake (on sand, `world/ground/wake.js`).
- **the grind's balance mark** (`GrindBalanceMark`, `src/vfx/grindbalancemark.js`) — the grind's lean as a needle on an arc standing behind the
  Solar Skiff's stern while the keel grinds (and the manual's lean), warming to an ember toward the ends (Tony Hawk's arrow); on a coaster rail hung square to the view, screen-up. No words. *Not:* the balance (a core move).
- **the board's stakes look** (`SkiffBoardLooks`, `src/vfx/skiffboardlooks.js`; `skiff.stakes`, boat.js) — the board's rules worn on the Solar Skiff: the
  sail heating to an ember and luffing with smoke, the hull flashed and chipped by a hit and dulled and cracked as the pool falls, a wreck in
  shards that fly home gold, the manual's tail-up tilt. No words. *Not:* the board's rules (`boardrules.js`), a sibling's shatter.
- **the buoys' dress** (`RacewayBuoys`, `src/vfx/racewaybuoys.js`) — a buoy as Raceway kit: a glazed stone post, a red or yellow glazed float,
  chevrons and a gold vane pointing the side to pass; their power a row of chevrons aft on the board. *Not:* the buoys (Dovina's, `buoys.js`).
- **the cavern's look / a crystal vein** (`RacewayCavern`, `game.racewayCavern`, `src/vfx/racewaycavern.js`) — the Raceway's cavern dressed: its
  stone and ruin-slab roof with the dark baked in, Lachrymite clusters with their lamps, its edge strings; and a vein of Lachrymite in its
  floor, the cavern's push (`raceway.plates` with `vein`). *Not:* the cavern (Dovina's course), a sun plate, a Dunes crystal.
- **the park's dress** (`RacewayPark`, `game.racewayPark`, `src/vfx/racewaypark.js`) — the Raceway park's water (the pond's and the Well's own
  liquids), bridge decks, coaster rail (a lajvardina-glazed lintel) and its helix tower, and the antlion's maw, dressed over Dovina's
  placeholders. *Not:* the park (Dovina's ground and tracks, `world/raceway/park.js`), the cavern's look.
- **the Raceway's props** (`RacewayProps`, `game.racewayProps`, `src/vfx/racewayprops.js`) — Dovina's round six placeholders dressed: the vein
  lanes as Lachrymite in the sand (a pulsing glow, spires at the edges, a fretted stave at each end), the pot smash's pots as the workshop's
  pottery, the antlion chaser as the pits' maw ploughing up the road, the City Trial's patches as gems shaped by kind. *Not:* the modes (Dovina's).
- **the siphons' look** (`RacewaySiphons`, `game.racewaySiphons`, `src/vfx/racewaysiphons.js`) — a siphon dressed: a tarnished ruin arch, a
  mouth in its keystone with a vortex turning in it, Lachryma drawn up into it; at a drink, the pull off the board. *Not:* the siphons (Dovina's).
- **the bazaar hall's dress** (`BazaarHall`, `game.bazaarHall`, `src/vfx/bazaarhall.js`) — Raku's bazaar dressed as the Gold Saucer on clay: the dome, the mosaic, the stalls, the neon bands, the lanterns, the gate, the wheel of fortune, the carousel. *Not:* the bazaar (Dovina's room), a table's cloth.
- **the held stretch** (`drawHeld`, `src/ui/lachrimeter.js`) — the end of the Lachrimeter's tube a cap on the pool holds off, in its source's
  look (the cracks: dull crazed glass, the clay's cracks in it). *Not:* the reserve (a charge's, paler).
- **Dread's fog on the Raceway** (`RacewayFog`, `game.racewayFog`, `src/vfx/racewayfog.js`) — three low sheets of cloud in Dread's colours
  laid along the course while `raceway.condition.fog` is up. *Not:* the scene fog (`render/daylight.js`), the miasma's lenses.
- **the glitch** (`game.glitch`, `src/vfx/glitch.js`) — the data showing through at a big moment: one screen pass; always set off by an event and
  short; the setting `visual.glitch` turns it off. *Not:* a bug's flicker.
- **the crackle break** (working name, Espada's to rule; `CrackleBreak`, `src/vfx/crackbreak.js`) — a stunned Figment's glaze shell crazing and
  bursting (about 0.3 real s) just before the data drain takes it (.hack's Protect Break). *Not:* the bubble, a guard break, the vessel's cracks.
- **a data bug** (working name; `DataBugs`, `game.dataBugs`, `src/vfx/databug.js`) — an aberrant or stray Figment or a blotling drawn wrong on
  purpose: one still error (a limb off its socket, its skin slid, a magenta cast) and a dark aura; a drain mends it. Always "a data bug" in
  full. *Not:* a bug in the code, the corrupted body.
- **lensing / the time grade / the hologram / molten / the corrupted body** (caster shaders S6 to S10: `Lensing`, `TimeGrade`, `Hologram`,
  `Molten`, `Corrupted`, `src/vfx/caster/`) — the Caster's black hole bending the frame round its accretion ring / a sphere drained of colour,
  its grain frozen / a body of hard light, scanlined, slipping / a lava-lamp metaball crusting as it cools / one mesh torn in the glitch.
  The first two are **screen volumes** (`post.volumes`, `render/glow.js`): a pass drawn only while one is alive. *Not:* the glitch (the screen's).
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
- **the hinge repair** (`repairHinges`, `LimbHinges`, `src/courier/anim/hinges.js`) — knees and elbows squared to their hinge, in a clip as it is
  decoded and on the posed body after IK; the joints stay where they were. *Not:* the joint limits (`anim/rom.js`).
- **tag** (`src/core/tags.js`) — what a tool may do to a thing and what it is made of.
- **module / division / round / the gate** — a file under `src/`; one of the five Claude sessions (Petra, Dovina, Wanda, Calissa, Espada); one
  cycle of work (R42...); Petra's review of every push to main. → detail
- **seam** (`game.seam`, `src/render/seam.js`) — a change of place made under a cover (dip to the dark, change, come back). *Not:* a texture seam.
- **the save** (`game.save`, `src/core/save.js`) — everything the game keeps in the browser, in sections of scope player, world or settings; the
  progress is one mode's (DEBUG or STORY), the other's on its shelf.
  *Not:* `save()` on a module. → detail
- **the seed** (`?seed=N`, `game.seed`) — the number the session's chance is drawn from; a stream is one module's own draw. *Not:* a Well's
  `wellSeed`.
- **the agent** (`game.agent`, `src/agent/agent.js`) — the game as an AI player sees and drives it. *Not:* a creature's mind.
- **playtest** (`npm run playtest`) — a scenario an agent plays to its goals. The stress test fuzzes; a playtest plays.
- **a sweep** (`scripts/sweeps/<room>.mjs`) — one room entered, worked and left headless, a PASS/FAIL line a check. *Not:* the stress test, a
  playtest, the Soul Brush's mop, the kick's leg sweep.
- **the pose audit** (`scripts/poseaudit.mjs`, its manifest `scripts/poseaudit.states.js`) — the Courier's poses measured headless, state by state:
  a held tool or a limb through the body (cm), a joint past its range (degrees); a contact sheet of the worst frames. *Not:* a sweep, rom.js.
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
- **the Anim Lab** (`AnimLab`, `src/workbench/animstage.js`; `/workbench`, MODELS) — the Workbench's stage that plays a stance, a move, an emote or a
  clip on the game's own animation stack as a take, stepped and scrubbed front, side and top. *Not:* the movement lab, the pose audit. → detail

- **a label / a lore name** (`name` / `lore` on a data table; `docs/plans/CLARITY.md`) — what the UI calls a thing (a genre word: *Grapple*,
  *Bomb*) / the world's name for it (*the hook*, *the toll*). The UI shows only the label. *Not:* two things.

## 11. Homonyms we keep on purpose (always qualify them)
| word | its meanings | say |
| --- | --- | --- |
| mind | a creature's (`Brain`); THE MIND (the macro shelf); Mind Mapping (the map) | "a creature's mind", "THE MIND shelf", "the map" |
| charge | the psygun's beam; the Lockheart's fill; the Veritome's capture; a mount's charges (uses a crossing: the Charges keyword) | whose charge; "charges" (plural) is a mount's |
| key | a keyboard key; a Possibilikey | "Possibilikey", in full |
| station | a course station (checkpoint); the kiln station | "course station", "kiln station" |
| theme | the window colour (`ui/theme.js`); a piece of music | "window colour", "music theme" |
| card | a Veritome card; the tarot cards falling on the title; a choice card (the UI's: `ChoiceCard`); a card of the house deck (Raku's tables: `cardTpl`) | "card" is the Veritome's; the title's are scenery; "a choice card", "a house card" in full |
| shard | a broken pot's piece; the crystal shard (item) | "crystal shard" in full |
| tier | a chest's; an achievement's (Easy .. Grandmaster); a fish's (1 .. 5); the clay folk's (earthenware .. the Court); a Querent hand's (1 .. 3) | "chest tier", "achievement tier", "fish tier", "the clay folk's tiers", "a hand's tier" |
| rank | a Veritome card's (SS .. H); a Lockheart outcome's (0 dud .. 4 jackpot); the standing (Sweeper ..); an attribute's step (Soul Alchemy); a crossing's letter (S to D) | "card rank", "outcome rank", "standing", "an attribute's rank", "the crossing's rank" |
| chart | the map's (charting the ground, a Cogitomap); the rhythm mode's note chart | "chart" is the map's; "note chart" in full |
| chain | a run of one event (the ledger's `chain.<what>`); three downs of one feeling on the rail | "a chain of ...", "a feeling chain" |
| combo | the club's chain of blows; the rhythm mode's run of notes; the skiff's chain of tricks (`SkiffCombo`) | "the club's combo", "a rhythm combo", "the trick combo" |
| Well | the Weir's well of liquid Lachryma (a place); a Well, a pocket of distortion (a dungeon) | "the Weir's Well", "a Well" |
| place | a named spot things are sent to (`game.places`); where a weather falls (`placeOf`: an island or `well:<id>`) | "a place" is `game.places`'; "the weather's island" or "the Great Dunemaw's weather" |
| day | a game day (`today()`); the bright part of it (`phaseAt` 'day') | "game day"; "daytime" |
| calm | no weather (`aspect` null, the log's "fair"); the swells laid down for a stage's breather | "fair" for weather; "a calm" for the stage |
| hold | a ship's hold (casks); to hold the save; a rig's hold (a clip's stretch rocked while a move is held); a pot in both hands (`carry.js`, `carryHoldAt`) | "the ship's hold"; "hold the save"; "the clip's hold"; "the carry's hold" |
| move | a blow of the combo engine (`kick.hit`); a rig's move (`RigClips`: a named clip choice) | "a blow" or "the kick's move"; "a rig's move" |
| hop | a crossing of the Emocean (`hop()`); the Pneuka Jar's bounce in the garden (`JarHop`, clip `hop`) | "a hop" is the Emocean's; "the Jar's hop". A spirit's body is `s.body`, never `hop` |
| slam | the Soul Brush's (air, ground); the Great Slip Jelly's; the god hand's clip | "the brush's slam", "the Great Slip Jelly's slam", "the hand's slam" |
| gulp | the Lockheart's parry; a mount on the rail; the Pneuka Jar's clip | "the Lockheart's gulp", "the gulp mount", "the Jar's gulp" |
| kiln | the workshop's (the kiln station, `kilnUI`: Anagami's finishing station); the Heavenly Kiln (`Tribulation`, `world/garden/tribulation.js`: dressed by your base material, REGISTERS.md 11) | "the kiln" is the workshop's; "the Heavenly Kiln" in full |
| art | God Arts; Movement Arts; the god hand's garden strokes (`ARTS`, `garden.art`) | "a God Art", "a Movement Art", "the hand's stroke" |
| Jar | the Pneuka Jar (the Vessoul's form; in the garden `realm.jarBody`); the god hand's jar model (`god.jar`) | "the Pneuka Jar"; in code `jarBody` for the garden's body |
| emote | the Courier's (`EMOTES`); a creature's onset clip (the Lantern Wisp's three) | "an emote" is the Courier's; "the Wisp's emote clips" |
| dive | the Soul Brush's dash attack (`Brush_Dive`); a dive into the water (`waterfx`); the Paint Dive; the ledger's old `brush.slam.dive` | "the brush's dive"; "a dive into the water"; "the Paint Dive" in full |
| counter | the ledger's count (`L.inc`); the blow that answers a guard or parry (kind `counter`) | "a ledger counter"; "the counter" is the blow |
| eye | the EYE CUP kiln pattern (6); the camera's point of view; Old Nobody's; the shoal silhouette's (`SilhouetteEye`); Charybdis's six | "the eye" is the kiln pattern; "the camera's eye" or "round the view"; "Old Nobody's eye"; "the silhouette's eye"; "Charybdis's eyes" |
| wheel | Plutchik's wheel of feelings; the Lockheart's wheel of odds; the party's order wheel (T held); the colour wheel (Soul Alchemy's; in play, the bath) | "the wheel of feelings"; "the Lockheart's wheel"; "the order wheel"; "the colour wheel" |
| sigil | the Soul Brush's (strokes read in Celestial mode); the Solar Skiff's (the ring of marks on the sand) | "a sigil" is the brush's; "the skiff's sigil" in full |
| dome | the sky's (`vfx/sky.js`); the stern of the Solar Skiff's hull | "the sky's dome", "the skiff's dome" |
| lattice | reprogramming's lattice of Functions; the ambient geometry's folding lattice (`G.lattice`) | "the macro lattice"; "a folding lattice" |
| telegraph | a Figment attack telegraph (on foot: Divination's mark over a windup); the rail's telegraph mark (`vfx/telegraph.js`) | "a Figment attack telegraph" or "Figment telegraph"; "the rail's telegraph mark"; never "telegraph" bare |
| cancel | opposites cancel (two feelings: no agate); the blink cancel (a move let go at a blink, `Moveset.blinkCancel`) | "opposites cancel"; "the blink cancel" in full |
| glaze | the Courier's (`GLAZES`, fired at a finishing station); a room glaze (`ROOM_GLAZES`, on a room's built surface or ware); a hull glaze (the Solar Skiff's, `glazeHull`) | "a glaze" is the Courier's; "a room glaze", "a hull glaze" in full |
| ring | a Solar Skiffing ring (`SolarRing`); a rail ring (`G.ring`); the spirit press's hue ring; an intensity ring (the wheel of feelings); a lane mark's rings; the ring (the orbit's ten slots, `ORBIT`); the jet ring (`JetRing`, the jets' gauge at the feet) | "a Solar Skiffing ring", "a rail ring", "the hue ring", "an intensity ring", "the jet ring" |

## 12. Retired words
| retired | say instead | where it still is |
| --- | --- | --- |
| Shrine Garden | the Spirit Garden | (gone; kept: the owner's own word) |
| film, a roll of film (`mat.film`, `loadFilm`, `film.load`) | the Veritome's memory (`VeritomeMemory`) | `audio/cues.js`, `pneuka/thingmodels.js` |
| Lab mode | the all-arts switch (`lendAll`, `setLendAll`; label "ALL ARTS" for now) | `docs/DESIGN.md` |
| vessel (for the god hand's jar) | the jar | (`sfx.jarHit`, R42) |
| polarity (the ship's feeling on the rail) | the Astral and Umbral forms | `src/courier/ship/`, `world/emocean/` (29 uses; the check's list is Petra's) |
| slip (as a mechanic: wet slip, slip coverage, the slip field, the slip dive) | paint, crude, a slick; the Paint Dive (`docs/plans/PAINT.md`); "slip" stays in creature and move names (slip jelly, the slip schiller, slip geysers) | the Paint Dive's file and tech id (`courier/moves/slip.js`, `slip`); the ecology's offer id `slip` (the minds' data) |
| course (for moving between rooms) | rooms (`game.rooms`) | `game.course` (`src/world/basement/basement.js`) |
