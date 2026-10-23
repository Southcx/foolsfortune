# The glossary

One word, one meaning: in code, docs, commits, messages and requests. A request that misuses a word is clarified first. Full definitions: `docs/GLOSSARY-DETAIL.md` (not imported).

1. **The code says what the game says.** Identifiers use the game's word, or the code name given here.
2. **A new thing is named here first,** in the same commit, by its owning division (player words: Espada and the owner; code names: Petra at the gate). Until the owner calls it finalized, its name is the genre's or plain English (CLAUDE.md, "Plain names until settled").
3. **A homonym kept on purpose is always qualified** (table below).
4. **Retired words are refused** by `npm run check` and at review (table at the end).

Entry: **term** (`code`, `path`) — meaning. *Not:* the confusion it prevents. "→ detail": more in the detail file.

## 1. The Courier, the Vessoul and the god hand

- **the Courier** (`player`, `character`; `src/courier/player.js`) — the one the player plays. Androgynous: "you" where the game speaks, "they" in
  docs and comments. *Not:* "the player" in anything the game says. → detail
- **the Vessoul** — the soulspark that stands for the player in the world, one being in several forms: the god hand, the Pneuka Jar, the Courier,
  and on the Emocean the ships. *Not:* "the player" in player text.
- **the stones / the Pneuka stones** (`src/progress/stones.js`; the owner, 2026-10-23: one thing; `docs/plans/DICE.md`) — where Lachryma enters
  the vessel and a release leaves it: the pool's size, regen and costs, the magnet's reach, overflow; one set at a time, its mineral its
  trade; seven dice of solid Lachryma, the standard set (each die its solid's suit), and the chance rolled for you is thrown on them.
  **The palm die** (`PalmDie`, `game.palmDie`, `src/progress/dice.js`): the stones in the god hand's form, one die in its palm that
  condenses the overflow past the Lockheart into cubes, capped a game day by its size, and grows d4 to d20 on what it condensed. *Not:* a stone in the world,
  Raku's dice set (the house's). → detail
- **overflow** (code `mind.brim`; "brimming" until 2026-10-19) — the pool pushed past full; the log says "Your pool overflows." *Not:* "drunk", which never appears in player
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
- **a guest's Pneuka Jar / a sibling's line** (plain names; `GuestJars`, `game.guestJars`, `src/vfx/garden/guestjars.js` / `speakerLine`, `src/ui/siblingline.js`) — a guest visiting your Spirit Garden drawn as the owner's Jar fired in their body glaze, its light in their trim / a line a sibling says in the log, its head in its division's colour after its suit's mark. *Not:* your Pneuka Jar, the guest's Courier (in the world), a sibling's voice card.
- **the chatroom** (the owner's word; `Chatroom`, `game.chatroom`, `src/coop/chatroom.js`; COOP.md C7, C8) — the one conversation of the five divisions'
  sessions and the owner, kept in the build's store (`chat`) and said in the log in the writer's colour: `/say`, `/chat`, `@name`. *Not:* the published
  page's `room` (who has it open now: presence), a room (a place).
- **voice card / drift** (`PERSONAS`, `drift()`, `src/coop/personas.js`) — a sibling's voice written as form and lexicon / the house voice's
  tells a line slides back to, banned for all five.
- **asking a sibling / letter** (`@name words`, `/letter name words`; `src/coop/answer.js`) — a question a sibling answers in seconds, in its
  division's voice / words sent to a division's own session, answered in minutes. *Not:* each other.
- **the god hand** (~, `src/godhand/godhand.js`) — the mode where the Courier becomes a jar and you become a hand.
- **a miracle / an epic miracle / the island's matter** (working names; `docs/plans/GODHAND.md`) — a feeling's weather the hand calls down by
  drawing its sign / one of seven great ones, one a domain, paid as a release from the vessel (SPINE.md 4) / the explored area's layered ground the hand moves: the island's firm and loose layers (`GROUND`, `godhand/matter.js`; on Anagami, clay and sand), Lachryma, crude. *Not:* a God Art.
- **a creation** (`game.creations`, `src/godhand/creations.js`, voxels `godhand/voxels.js`) — voxel matter of the island's firm layer the hand raises
  with Sculpt (a pillar, an arch, a ramp), meshed smooth; it crumbles back into the island's matter over about a game day, unless Set. *Not:* Manifest's wall, the island's matter.
- **the matter's look** (plain name; `matterMaterial`, `lumpyBall`, `src/vfx/godhand/matterlook.js`) — the island's matter, the held ball and the hand's creations drawn in one program, by island: the layers from the room glaze atlas (Anagami's clay mottled damp and specked, its sand grained, a lip where it thins onto the authored ground), its Lachryma the house's liquid (`liquidDepth`, vfx/water.js), a creation greenware until Set, then fired (flashing, ash, the ash's glaze), crazing as the mending eats it. *Not:* the island's matter (`godhand/matter.js`), a glaze, a room glaze, a part's crazing.
- **a god power / the ramp** (`GOD_POWERS`, `POWER_EVENTS`, `godhand/powers.js` / `RAMP`, `rampOf`, `progress/godpowers.js`) — one of the hand's arts,
  each a domain's, opened by its level / each power's numbers from where it opens to 99, Creative mode at the top (GODHAND.md 11). *Not:* a widening.
- **a god power's mark / the ward's wall / the totem's band** (plain names; `GodhandLooks`, `game.godhandLooks`, `src/vfx/godhand/godhandlooks.js`; `circleMark`, `wardWall`, `totemLook`, `slabLook`, `strataFrame`, `vfx/godhand/marks.js`) — a god power's circle on the ground in its domain's colour, draped over the island's matter (the System's ring, the ward's written circle with its heptagram, a miracle's, the muster's hatch), and its other looks (the held slab's layers, Strata's frame, Course's run, Read's arrowheads) / the curtain of strokes standing on a ward's circle / the bands round a totem's pillar in the feeling it holds. *Not:* a world mark's glyph, the Shrine's.
- **the Portal power's eyes / the muster's crew** (plain names; `portalPair`, `vfx/godhand/portalpair.js` / `musterCrew`, `vfx/godhand/crew.js`) — the caster shells' Portal stood at each end of a Portal power's drag, linked, facing the hand, its pass ring under it / Muster's workers as clapperjars hatched out of the ground, each carrying a lump of the matter. *Not:* a rift, the Portal shell / the clapperjars (creatures).
- **a miracle's fall / the drawn sign's ink** (plain names; `MiracleFall`, `vfx/godhand/miraclefall.js` / `GodSign`, `vfx/godhand/godsign.js`) — a miracle's weather falling over its circle at the heavy look (the weather's own pieces in a column its radius), Storm's bolts as the caster's lightning, an epic's sky / the miracle's sign written in the Soul Brush's ink straight over the world, taking in the feeling's colour or running. *Not:* the weather, the flood / the Celestial paper, a sigil.
- **the palm die's look** (plain name; `PalmDieLook`, `game.palmDieLook`, `src/vfx/godhand/palmdie.js`) — the palm die (Dovina's `game.palmDie`, `progress/dice.js`) sat in the god hand's palm hole: its solid by size (d4 a tetrahedron .. d20 an icosahedron) cut in the worn stones' mineral, turning; a glint at `palm.condense`, swelling, cracking along its facets and re-cut as the next solid at `palm.grow`. No words. *Not:* the palm die (the rule), the flee's d20.
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
- **a vantage's frame** (`VantageFrames`, `game.vantageFrames`, `src/vfx/vantageframes.js`) — a vantage built as a lookout: its stand (a stone let into the spot, Wonder's ring inlaid, lit until reached) and the gate the view is seen through; where the stand is hidden from where it is first wanted, its **sightline** (`SIGHTLINES`): a Lachrymite drop hung off the edge into the view below, its halo breathing and glinting in Wonder's colour (a world mark). *Not:* the vantage (the spot, `world/vantages.js`), the lens's frame.
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
- **the belt** (`game.belt`, `src/tools/belt.js`) — the two tools worn (`belt.main`, `belt.sub`; `equip`, `mayEquip`, `pair`), the other five on the
  loadout's shelf; "is a tool out?" asks here. **Draw / stow** (X) take the main in hand / put it back; **lend** (R; each tool's `lend()`, `tools/lend.js`) the sub's verb, from where it hangs.
- **the main / the sub / a pair's card** (plain names, the owner's rulings 2026-10-22 and 23; `PAIRS`, `pairOf`, `SUB_GIFTS`, `src/progress/toolpairs.js`;
  TOOLS-TOGETHER.md 8) — the tool worn in hand with all its verbs / the second tool worn, lending the main one verb on R and one passive / the
  Major Arcana card (I to XXI; the Fool is you) a main and sub make together, its special opened by an achievement. *Not:* a Veritome card, a house card.
- **the prone holster** (`game.proneHolster`, `src/tools/proneholster.js`) — lying down puts the tool in the hands away through the belt and
  draws it again once up; no tool comes out on the belly. *Not:* a holster (where a tool is worn).
- **fitting** (`FITTINGS`, `src/pneuka/box.js`) — what fits into a tool (a lure, an instrument, the Lockheart's keys), kept in the Pneuka Box. A
  tool never has an inventory of its own.
- **the psygun** (`game.weapon`, `src/tools/psygun/weapon.js`) — the gun. A shot is one round; a charge winds up a piercing beam; a shell is a
  special round in a chamber. → detail
- **a psygun's variant / the cylinder** (the owner's names, 2026-10-18; `PSYGUNS`, `tools/psygun/kinds.js`; OVERLAY.md 18) — by chamber count: THE PSYGUN (6), the Bombardier (1), the Carbine (3), the Pentagun (5), the Pepperbox (7: six round a heart) / the chambers drawn as a revolver's cylinder, its shape its count, turned by the wheel (`PsygunCylinder`, `game.psygunCylinder`, `src/vfx/psyguncylinder.js`; a variant's model: `PsygunModels`, `src/vfx/psygunmodels.js`, `scripts/export_psyguns.py`; as a thing in the Pneuka Box, kind `psygun`, its id the kind's, worn by `box.carryPsygun`). *Not:* a caster shell, a mount.
- **a variant's play** (working names, Espada's: the quick taps, the flare, the scope, the full draw, a dart, the pentacle, the slug, both barrels; `VariantPlay`, `weapon.play`, `src/tools/psygun/variantplay.js`; numbers kinds.js `play`; OVERLAY.md 19) — how a psygun's variant fights beyond its chamber count. *Not:* a shell, a widening, fanning the hammer (Q for now, `FAN_KEY`, `gunmoves.js`: the table's "fan the hammer" is the quick taps).
- **the psygun's reticle / the scope's lens ring** (working names, Espada's to rule; `PsygunReticle`, `game.psygunReticle`, `src/vfx/psygunreticle.js` / `PsygunScope`, `game.psygunScope`, `src/vfx/psygunscope.js`; OVERLAY.md 19) — the crosshair, one a variant (THE PSYGUN's ticks and six pips, the Bombardier's ring and chevron, the Carbine's T, the Pentagun's five points, the Pepperbox's spread ring) / the Carbine's raised scope: its brass housing, glass, reticle, the breath's arc and the full draw's ring. *Not:* the lock-on reticle, the paint reticle, the lens's frame.
- **the lob's arc mark / a flare's reveal outline** (working names; `LobArcMark`, `src/vfx/lobarcmark.js` / `FlareReveal`, `src/vfx/flarereveal.js`) — the Bombardier's lobbed shell previewed: its dotted arc and its landing ring at the shell's area there / the outline in the flare's ember round a creature it revealed (`c.revealed`), seen through walls while it holds (its tag shows as at the lock-on). World marks: no words. *Not:* the carry throw's mark, the MARK shell's rim, a tag.
- **the spiritual link** (the owner's words, 2026-10-18; `SpiritualLink`, `game.spiritualLink`, `src/vfx/spirituallink.js`) — the thread of the film from the Lachrimeter's bulb to the tool UI in hand: a spend runs down it as a bead, a dry click slackens it. *Not:* the link ring (the trick combo's), the tube's feed.
- **the Sondelass's guard / the lure ring** (working names, Espada's to rule; `SondelassGuard`, `game.sondelassGuard`, `src/vfx/sondelassguard.js`) — the Sondelass's own UI: its guard with three windows, the form in hand growing out of it (the cutlass's string on its edge) / the seven feelings round the lure in the rod form, turned by the wheel or MMB held. Always "the Sondelass's guard" in full. *Not:* the guard (the held block).
- **a caster shell / the Caster's toll** (`SHELL_TYPES`, `CASTER_SHELLS`; `docs/plans/CASTER-SHELLS.md`) — a shell, TYPE-00 to TYPE-99: a carrier, payloads and a
  field, in four tiers (I common .. IV the Caster's own) / what a tier IV costs: a cracked region of the vessel. *Not:* a shot, a mount.
- **the shell runner** (`ShellRunner`, `game.shells.runner`, `src/tools/psygun/shellrunner.js`) — what flies a caster shell from its row: its
  carrier, then its payloads (`shellpayloads.js`) where it lands; the plan's mechanics are its **parts** (`shellsplitchain.js`,
  `shelldeployables.js`, `shellbodies.js`, `shellspacetime.js`, `shellcastersown.js`). *Not:* the Shells class (the chambers and counts).
- **a shell's look** (`shellLook`, `SHELL_LOOKS`, `src/vfx/shelllooks.js`, a family's in `vfx/shelllooks/<family>.js`; effects
  `shell.<id>.<moment>`) — a caster shell's body, tail and marks at its moments (fly, touch, land, fire, set), asked by the shell runner
  by shell id. *Not:* the caster shaders (its parts).
- **the Sondelass** (`src/tools/sondelass/sondelass.js`) — the blade with three forms: the cutlass, the rod (angling), the hook (the grappling hook in player text; its achievements, Grapple). →
  detail
- **the Soul Brush** (`src/tools/soulbrush/soulbrush.js`) — the club, the flick, Celestial mode (sigils; **Celestial mode's mark**, a
  target a dot chose, its ring turned vermilion and your seal stamped by it over the paper: Celestial mode's targets) and inscriptions; the tool of environmental Lachryma, in paint and mop modes. → detail
- **the Soul Brush's desk** (working name, Espada's to rule; `SoulBrushDesk`, `game.soulBrushDesk`, `src/vfx/soulbrushdesk.js`) — the Soul Brush's own UI by the Lachrimeter: a brush rest of seven glazed peaks and a trough (CLEAN), the brush lying in the pick's saddle, the hanging scroll of the club's string, Celestial mode's handscroll, the plate. *Not:* the Soul Brush, the paint reticle, the Bottle's arc.
- **Celestial mode's targets** (plain name; `CelestialTargets`, `game.celestialTargets`, `src/vfx/celestialtargets.js`; TOOLS-TOGETHER.md 9) — what a dot can mark while the paper is up, shown clear of it: the sepia parted round each in a soft hole, a sumi ring brushed round it; marked, the ring vermilion and your seal pressed beside it. The list is the brush's. *Not:* Celestial mode's mark (`celestialMark`, the world glyph it replaces), the paint reticle.
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
- **the Veritome** (`src/tools/veritome/veritome.js`) — the book that is a camera, for observation and reprogramming only (the owner, 2026-10-23);
  a plate is one photograph; what it knows is the Book (`book.js`: the memory, the Compendium, the bestiary's facts). It keeps no cards and
  no things. *Not:* the inventory, the collection. → detail
- **the collection** (`game.collection`, `src/progress/collection.js`; save section `collection`) — the cards bound, the 22 Major Arcana and the
  creature cards, each once (the Fool from the start); a second photograph of one bound condenses into cubes. Shown on the Codex's THE ARCANA
  shelf (`codex/arcana.js`) and in the bestiary. *Not:* the Veritome, the Box's storage.
- **a Veritome / its sight** (working names; `docs/plans/VERITOMES.md`, a plan) — one variant of the book, worn as a whole (as a Lockheart's coffin) / what it sees with the lens raised, a convenience never a key. *Not:* a fitting, a lens item.
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
  hand ahead of the front foot (nose), the back on the stern's lip (tail), both between the feet (double), over the ollie's crouch; a grind trick's too (the tail slide's hand to the stern, the nose grind's lean over the bow, the 50-50's arms out, the boardslide's stance: astride the rail with the board, arms out, the head turned down the rail). *Not:* the
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
- **the table HUD / a seat plate / the goal bar / the turn banner** (`TableHud`, `src/ui/tablehud.js`; `seatPlate`, `ui/seatplate.js`;
  `goalBar`, `ui/goalbar.js`; wired by `TableClarity`, `vfx/tableclarity.js`) — the table view's words over its cloth: a seat's name and numbers in its seat
  colour and shape (the acting one in the film) / one bar toward the goal, a track a seat / YOUR TURN and the coach's line. Always "seat plate" in
  full. *Not:* a plate (the Veritome's photograph), the game's own HUD (hidden while seated).
- **a seat colour / the table marks** (`SEAT_LOOK`, `src/vfx/seatlook.js`, from `SEAT_COLOURS`; `TableMarks`, `src/vfx/tablemarks.js`) — one of the
  eight board-game colours with its shape (you Red, Raku Black), only on rims, tokens and seat plates / on the cloth: the turn ring at the acting
  seat, seat rims, the film rim on legal pieces, the chosen piece lifted. *Not:* a suit's colour (card faces only).
- **the action bar / a table tip** (`actionBar`, `src/ui/tablebuttons.js`; `tableTip`, `ui/tabletip.js`) — the choices with no piece on the cloth
  as buttons (amount, preview in its tone ✔ ⚠ ✖, the suggestion in gold, keys 1 to 9) / a piece's hover card. *Not:* a choice card, the slot row.
- **the score ceremony** (`ScoreCeremony`, `src/ui/scoreceremony.js`; `RollingNumber`, `ui/rollnum.js`; `Reel`, `ui/reel.js`) — the count-up drawn:
  the hand's name, BASE × MULT rolling, the reasons flying in, the total slammed down, the film on a top tier (Balatro's). *Not:* the count-up (the
  coach's steps it plays).
- **the coach / a how-to / practice / the count-up** (`coach()`, `src/progress/casino/coach/`; `HOWTO`, `progress/casino/howto.js`;
  `session.play(true)`; `docs/plans/CASINO-CLARITY.md`) — a table's every moment said plainly for a view (the goal, the turn's one line,
  each choice with what it brings, the house's suggestion) / a game taught in a few steps, on first sitting and on asking / a game for no
  chips that counts nothing / a big number counted up in its parts (Querent's base, its bonuses, its multipliers). *Not:* a QAIS test,
  the System's teaching.
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
- **stun depth: dazed / stunned / out cold** (working names, Espada's; `stun.depth(t)` 1..3, `T.stun`, `src/creatures/stun.js`; `docs/plans/STUN-DEPTH.md`) — how far down a stunned thing is, deepened by stunning it again while down, one star a depth. *Not:* a status of its own.
- **EmO**, Emotional Output (`src/progress/combat/emo.js`; on screen **Agitation**, the owner 2026-10-20; EmO stays in the Codex) — a Figment's agitation, 0 to 1; its Lachryma yield peaks in the optimal band.
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
- **a puzzle duel / the Line / junk / a duel ruleset** (the genre's words, the owner, 2026-10-19: no lore names; `newDuel`, `src/progress/duel/`;
  `RULESETS`, `rulesetOf`; `docs/plans/PUZZLE-DUELS.md`) — an aberrant Figment's fight as a turn-based versus puzzle on a 20 × 20 board / the
  column boundary between the sides, your zone of control and the score, pushed a column a 3 junk landed (9 at most at once) / what a clear
  sends across / the rules one Figment brings. Its words: a **match** (three in a line, `rs.match`), a piece's **kick**, the Courier's **run**
  (up to four cells), a **break** (`duelBreak`, `duelbreak.js`: a side's EmO broken by a big push, its stun a depth deeper), an **orb**
  (Lachryma a break sheds for the Courier to run up), the **finisher** (`FINISHER`: the god hand's end on a broken foe, paid from the pool),
  **the drip** (the pieces each side is given at the start of its turn), **Flee** (`flee.js`, `fleeOdds`: a saving throw out, a d20 against
  15, 3 AP, kept only by a failed try), the tools' moves **Shoot, Grab, Drill, Paint, Delay, Hold, Send**; Dread's **fog** and **embers** (`dread.js`: a
  half hidden but for its lantern / junk that burns 3 of your turns, then cools into a gem). *Not:* a table (Raku's), the rail, a trial, a mote (the scatter's), the scene fog, Dread's fog on the Raceway.
- **a duel's session / the duel's foes** (`DuelSession`, `game.duel`, `src/world/duel/duelsession.js` / `DuelFoes`, `game.duelFoes`, `world/duel/duelfoes.js`) — a puzzle duel played where its aberrant was met: a pocket nothing outside enters (`pocket`: every other creature held, shots in flight gone, no outside blow lands), the seam (kind `aberrant`), the board between you, your turns and its bot's, its end / which Figments go wrong, and **the pull** (`pull`, 0..1: filled by nearness to an aberrant, 4 m and 1.5 real s, drained beyond 6 m) that opens one; an aberrant takes no blow in the world (any aberrant; a Lantern Wisp that drinks a blot at night, `wisp.drink`; the test one by the Weir). *Not:* the kernel (`progress/duel/`), the view (`game.duelView`, Calissa's).
- **the duel's view / the tsuitate** (working names; `DuelView`, `game.duelView`, `src/vfx/duelview.js`, its parts `src/vfx/duelview/`) — a puzzle duel's board stood in the world as a standing screen of Lachrymite 20 x 20 in Anagami's clay frame, broadside between the Courier and the foe, playing the kernel's events; its pieces instanced, its figurines the bodies. *Not:* the duel (Dovina's rules), its session (Petra's), a table (Raku's).
- **the domains' clash** (working name, Espada's to rule; `DomainClash`, `src/vfx/duelview/domains.js`) — a puzzle duel's backdrop: each side's ground unfolding round the arena (the Courier's the film over Lachryma's deep, the foe's its feeling's heavy look), meeting in a seam on the Line's plane that slides with it. Always in full. *Not:* the domains (the psyche's seven), the weather.
- **the flee's look** (working name; `DuelFlee`, `src/vfx/duelview/flee.js`) — a puzzle duel's flee on the tsuitate: the odds plate on its frame (FLEE 30%, published as the reliquary's break chances), your own d20 (Raku's dice set's body in the mineral of the stones you wear: the stones are your dice) thrown before the board with its reasons counted in against 15, and on fleeing the clash folding with no winner and the tsuitate folded away. *Not:* the flee (Dovina's rule, `progress/duel/flee.js`), the score ceremony.
- **an ember's crazing** (`drawCrazing`, `src/vfx/duelview/crazing.js`) — a cooling ember's coal crazing (the iron wire, then the golden thread) before it turns into its gem. *Not:* the crackle break, the vessel's cracks, a grown skin.
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
- **zone** (`src/render/zones.js`) — a render zone: what is drawn from where the camera is. *Not:* the explored area, the Zone of Influence, nor a crystal's fret. →
  detail
- **the explored area / the Zone of Influence** (the owner, 2026-10-20) — the ground the player has explored, as the map shows it ("explored area" on screen) / a puzzle duel's side of the Line: your zone of control, where effects can reach from either side ("influence", not control); the duel's word once duels are called final. Always named in full (or ZoI).
- **the workshop** — the ground and upper floors: the kiln, the folk, the pots, the gong.
- **the basement** — below the workshop: the hub, the course, the movement lab, the lap circuits, the siege. *Not:* "the lab".
- **the hub** — the basement's centre, where the Index stands. **The Index** (`src/feedback/indexmenu.js`): the console there; F, and pick a room.
- **a Well's danger mark** (plain name; `dangerPips`, `src/ui/dangerpips.js`) — its FOE's class as vermilion pips before a Well's row at the Index (the Great Dunemaw: two); a world mark that warns and never gates. *Not:* a stun's stars, the Dissonance arc.
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
- **the garden's mood** (`GardenMood`, `game.gardenMood`, `moodAt`, `src/vfx/garden/gardenmood.js`) — the one table every Inner Realm look reads: the game hour's light (a golden key on a cool fill, a golden hour, lamps at dusk), the season's palette (`seasonOf`) and the briar's grade (`game.harmony.briarK`), eased together. *Not:* harmony (Dovina's gauge), the weather, mental state.
- **the garden's small life** (`GardenLife`, `realm.life`, `src/vfx/garden/gardenlife.js`) — bees and butterflies over the beds by day, dragonflies over water, fireflies at dusk, moths at night and in the briar, numbered by the garden's mood; they ignore the Pneuka Jar. *Not:* spirits, visitors, a creature.
- **a decor piece's look / a bramble / the lake lotuses** (`decorGeometry`, `src/vfx/garden/decorpieces.js` and `decorpieces/`; `thornClumps`, `vfx/garden/thornlook.js`; `LakeLotuses`, `game.lakeLotuses`, `vfx/garden/lotuses.js`) — the model drawn for one of Dovina's 47 decor pieces, its body tinted by the set and the tint, its lamps lit at dusk / a thorn patch's arching hooked canes in olive and rust / the garden's rating as up to five lotuses opening on the Dantian's lake, a world mark. *Not:* the decor (Dovina's catalogue, `progress/decor.js`), thorns (her rule), the rating.
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
- **harmony / thorns / bloom** (plain names until the owner rules; `game.harmony`, `src/progress/harmony.js`; `docs/plans/GARDEN-COZY.md` A)
  — how calm (1) or overgrown (0) a planetoid of the Spirit Garden is, resting at 0.5, raised by tending and lowered by what you carry
  in and spirits left waiting / what grows at a cause's place below 0.35, pruned by the hand for a briar cutting / a planetoid over
  0.75 flowering. Always "a planetoid's harmony" or "the garden's harmony". *Not:* music's harmony, the Dissonance Level, the weather.
- **decor / the shed's storage / the garden's rating / a lake lotus** (plain names; `DECOR`, `game.decor`, `src/progress/decor.js`; GARDEN-COZY.md D)
  — a piece placed in the Spirit Garden for its looks, of a set / where a piece bought or given waits until placed, and goes back to
  when picked up / the garden's decor scored by variety region by region, never shown as a number / one of the five on the Dantian's
  lake that open with the rating, always "lake lotus". *Not:* a feature (a plot's working thing), a launch lotus (flings the Jar).
- **a spirit's routine / a wish / the digest** (plain names; `routineOf`, `game.spiritLife`, `src/progress/spiritlife.js`; GARDEN-COZY.md C) —
  where a bound spirit likes to be by the day's phase and the rain, kept as its grain allows (walked to: `walkWish`, `world/garden/spiritwalk.js`) / the one thing a spirit that trusts you
  (bond 30) asks for at a time, never expiring / the morning's lines on the first visit of a game day. **The farewell** (`FAREWELL`): a matured spirit at full bond asking once to go home; let go, it leaves its statue (a keepsake piece, never sold). *Not:* a goal, a bounty, a desire (the feeling).
- **the decor grid / the decor layer / a thorn patch** (`decorgrid.js`; `DecorLayer`, `game.decorLayer`; `ThornPatches`, `game.thornPatches`,
  `src/world/garden/thornpatches.js`) — a planetoid's cube-sphere of about-a-metre cells a garden piece stands on (half-cell steps,
  15-degree turns) / the pieces drawn and placed by the hand in PLACE turned to decor (R), keeping the Jar and the spirits out of the
  bigger ones / a planetoid's thorns drawn round their cause, slowing the Jar's hop through them, pruned by GRAB. Plain names: the
  garden is in flux. *Not:* the clay's grid (latitude by longitude), a plot, a feature.
- **a season** (`seasonOf`, `src/progress/seasons.js`) — spring, summer, autumn or winter in the Spirit Garden, 7 game days each.
  *Not:* the weather, the day's phases.
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
- **the pier** (`world/emocean/pier.js`) — F at a jetty's end seals you into the moored hull's helm (`pier.helm`, a body cradle), and its page opens: the node map as a list and the two mounts to take; choosing an island casts off. →
  detail
- **Margarite's dock** (`world/emocean/margarite.js`) — the King's island's quay: the lamp tower, the Pearl Shrine, the Purser, Letty Marque.
  *Not:* Margarite (the island).
- **set piece** (`SET_PIECES`, `progress/rail/setpieces.js`) — a crossing's second half, one of three: the shoal, the Wreckers (the False Light),
  Old Nobody. *Not:* an encounter. → detail
- **leg** (`LEG`, `legsOf`) — one set piece of a long crossing (one to three); a breather between two mends the ship.
- **the flock** (`creatures/ai/flock.js`) — many bodies moving as one (Reynolds' boids), the AI part the shoal is made of. *Not:* a school (a
  wave's role).
- **the lock-on** (RMB held on the rail) — the reticle marks up to eight targets; release fires a lance at each. *Not:* the lock-on on foot. → detail
- **the crossing's foes** (plain genre names; RAIL-MODULES.md 6, a roster, the four marked built) — school (built), swooper, darter (built), rammer, sniper, ambusher, turret, mine-layer (its mine a shot that is a foe), escort (the shield escort), carrier (built), sweeper (the laser sweeper), heavy (built), gunship, blocker, spawner (a hatch of schools), grappler (the boarder, anywhere); one shape and one answer each. *Not:* a creature on foot, an Egregore of the open sea.
- **the stream / a queue / the floor / a flourish** (plain names; `cycle`, `FLOORS`, `flow`, `deadBeats`, `FLOURISH`, `progress/rail/legs.js`; `docs/plans/RAIL-FLOW.md`) — how a leg feeds its foes: a phase's waves come in turn, each bar the latest it waits / those waves, laid round and round by a `cycle` / the fewest foes in frame a phase allows, the next queued waves pulled forward to the next beat, enough to fill it, when fewer live / lights to lock flown through a swing so the turn is shot through. *Not:* a formation, the pacing law (retired with `idle`).
- **a swarm / the boss law** (plain names; ROSTER `swarm`, `progress/rail/showcase.js`, flown by `Swarm`, `world/emocean/swarm.js`; `BOSS`, `progress/rail/setpieces.js`) — a voxel boid flock of 24 to 48 one-hit bodies poured through the frame as one shape (a river, a ribbon, a bloom), the lock-on's feast / a boss leaves only beaten, its cue held until it falls, its parts each owning an attack and moving it to its next phase, quickening past three real minutes. *Not:* the shoal (the set piece, though made the same way), a flock (the AI part).
- **the boss hold** (`BossHold`, `HOLD`, `src/world/emocean/bosshold.js`) — the boss law in play: a leg's peak lengthened a phrase (8 bars) at a time while its boss stands, the phrase before laid again in the gap (a third denser past `BOSS.enrage`), the layout and rail relaid; `stage.boss` says it for the music. *Not:* an encounter's hold (the cue's choice), the ship's hold (casks).
- **a foe's move** (plain name; `foeMove`, `world/emocean/foemoves.js`; the row's `moves`, Dovina's) — how a foe of the crossing's roster moves in the frame of the view it entered in, in place of its formation's path: arc, dash, charge, hold, overtake, fixed, cross, tether, drift, swing. *Not:* a formation (`PATHS`, many in one shape), a pattern, the core movement.
- **a foe's mechanic / a glance** (plain names; `FOE_MECHANICS`, `world/emocean/foemechanics.js` / `waves.glance`, event `rail.glance`) — what a foe of the crossing's roster does beyond its path and its patterns: the escort's shield on its gunship, the gunship's guns before its core, the blocker's weak point held open by a Flash or a Bomb, the spawner's hatch (a wave laid `from` it), the grappler's latch and drag / a blow turned aside by one (the resist mark where it struck). *Not:* a set piece's parts, a pattern, the parry.
- **a carrier** (plain name; `rail.carrier`, `CARRIER_AT`, `progress/rail/legs.js`, `world/emocean/legrunner.js`; RAIL-MODULES.md 1) — a placeholder body that brings a crossing's pattern where no foe of its role is in frame: it flies in from the view's far edge over the windup, holds while it fires, and leaves; shot down, its volleys go with it. *Not:* a thrower of its own kind (a school, a darter), a ship.
- **the showcase crossing** (`SHOWCASE`, `showcasePassage`, `showLeg`, `progress/rail/showcase.js`; `stage.sailShowcase`, `stage.showcase`, events `showcase.*`) — a DEBUG-only crossing from the pier's SHOWCASE row and back to it: five short legs (`show.*`: each foe of the roster alone in each view, the forms and the roll), each sailed in its own hull, the pool kept full, the ship mended when it can bear no more, nothing counted; the owner's one run to test what is new. *Not:* a practice leg (one module, 16 bars), a drafted passage, a trial, a QAIS test.
- **a rail foe's body / its tell / a forged seal** (plain names; `railFoeBody`, `RAIL_FOE_ROLES`, `src/vfx/railfoes.js`, its parts `src/vfx/railfoes/`) — what a foe of the crossing looks like, one a role of Dovina's roster (the Wreckers' craft, the Egregores, the strays, the carrier's Lachrymite lantern), its named muzzles and parts / the glow that grows over k 0..1 before it fires (a lens heating, a lure brightening, a clam opening) / the counterfeit seal in every Wreckers' cradle, a livid cracked red in a stutter, never the window colour or gold. *Not:* a foe's runtime (`world/emocean/waves.js`), the rail's telegraph mark, your seal.
- **the ship kit / the mast fold / the ship's core** (plain names; `src/vfx/shipkit/`, `ShipLook`; `fold(u)`, `set({ form, roll })`, `FoldDrive`, `shipkit/rig.js`; `writeCore`, `shipkit/core.js`) — what the five ships' looks are built from (one hull mesh and one rig mesh in the hull's material, vanes of light in the sail's) / the masts stowing, 0 out .. 1 stowed, for the Umbral form on a hull that dives and through every barrel roll / the helm's cradle set in the deck as a cockpit, Lachrymite round it lit in the ship's feeling, a canopy of ribs over it. *Not:* the Astral and Umbral forms, the cradle's look.
- **the refit sweep** (`RefitSweep`, `src/vfx/refitsweep.js`, owned by `vfx/crossinglook.js`) — the showcase crossing's hull swap covered: a hoop of light and its plane passing the new hull bow to stern in 0.7 real s on `showcase.hull`. *Not:* the gate-out (the Courier's), the mast fold.
- **the edge mark / the off-frame arrow / the mine burst** (plain names; `RailFoeMarks`, `game.edgeMark` (`game.ambushMark` the same), `src/vfx/railfoemarks.js`, owned by `vfx/crossinglook.js`) — where a wave will come in, a bar before it enters (an ambusher's for its wait), held at the frame's edge: two gold chevrons pointing in, a ring round them running out over its wait, a throb a beat; a swarm's wider, a boss's largest in ember (a world mark, no words) / a foe in play or a shot closing from outside the view: an arrowhead on the frame's edge pointing out at it, gold for a foe, white-hot for shots / a mine going off on `rail.mine`: a flash and a shock ring in the plane its ring of shots flies in. *Not:* the rail's telegraph mark, a foe's tell, the mine's body breaking up (railfoes.js).
- **the voxel batch / the swarm's look** (`VoxelBatch`, `game.voxels`, `src/vfx/voxels/voxelbatch.js`, its sets `voxelize`, `vfx/voxels/voxelize.js`, found by `voxelsNow`, `vfx/voxels/now.js` / `SwarmLook`, `game.swarmLook`, `src/vfx/voxels/swarmlook.js`; installed by `vfx/voxels/index.js`, owned by `vfx/crossinglook.js`) — every cube of debris in the crossing in one draw: a rail foe downed thrown apart into its voxels (baked from its own mesh at boot), a hit's chips, a boss part come off, each moving from its birth in the shader, tumbling, and in its last fifth shrinking into a mote of its feeling's light / the voxel boid swarm drawn: each boid a little body of cubes (a fry or a mote-moth) facing its way, its tail wagging, in the waypoint's feeling with a bright rim; a boid downed bursts into the batch. *Not:* the god hand's voxels (`godhand/voxels.js`, a creation's matter), the swarm (Petra's runtime and flock), a Figment's scatter.
- **a part's gold line / its crazing** (plain names; `BossPart.wire`, `.hurt(k)`, `src/vfx/bossparts.js`; `PartCraze`, `src/vfx/partcraze.js`; a gunship's guns: `body.hurt(part, k)`, `railfoes/materials.js`) — the gold (0xffd36a) a boss part's or a rail foe's part's edges wear while it can be hit, dark while sealed, gone when broken (thrown off into the voxel batch) / the crackle net opening over it as it is hurt (k = 1 - hp / hpMax), hairlines in ochre, its cracks lit gold near the end. *Not:* the vessel's cracks, a grown skin, the crackle break, an ember's crazing.
- **the rail readout / the results window / the Brine frame** (plain names; `RailReadout`, `game.railReadout`, `src/ui/railreadout.js` / `RailResults`, `game.railResults`, `src/ui/railresults.js` / `brineFrame`, `src/ui/brineframe.js`) — the crossing's score seen while it is made, at the rail's top-left corner: the score rolling, the chain's three pips in the feeling counted with its multiplier x1.25 .. x3 falling to nothing on a break, the surge's gauge, the hull's pips, the leg's downs over its medal's mark, gold when reached / the System window at a trip's end: a row a leg ticked in on the sixteenth, the tally, the score ceremony's count-up, the trip's rank and medal; any key skips, then closes / a System window in the Emocean's dress (a tarred glaze in the window colour, a salt crust, a rope band, the labradorite keylines). *Not:* the Lachrimeter, the log, a toast, the score ceremony (which it plays), Brine itself (an island's dress).
- **a hazard's look** (plain name; `RailHazards`, `game.railHazards`, `src/vfx/railhazards.js`, its parts `src/vfx/railhazards/`) — a crossing hazard as drawn, placed by Petra's runtime in the rail's frame: the pillar (the monolith's slab risen out of the crude into a lane), the arch (a ruin's arch of that stone, a gold thread round its opening while it can be threaded, dim once passed, flashing on a through), the gate (a wall of crude-glass across the frame, one gap rimmed in gold); a hit's crack star and chips; its edge mark, kind 'hazard', its ring pale teal. *Not:* the hazards (Dovina's data, `legs.js` HAZARDS; Petra's runtime), a monolith of the ambient geometry, a rail ring.
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
  *Not:* a mount's views, the lock-on. → detail
- **a mount's views** (plain names; `mountViews`, `src/ui/mountviews.js`, its loops and drawing `ui/mountviews/`) — on a mount's choice card at the pier, what it does shown three ways in one loop of four real seconds, in sync: TOP (its reach on the water), SIDE (a side-on shmup box, the card's own), CHASE (behind and above the ship, down the lane); a timeline of the loop's events with its playhead, and a live count. *Not:* a mount's preview (the one on the water at the pier), the crossing's side act.
- **par / rank / medal / the tally** (`progress/rail/score.js`; a leg's `legPar`, `legMedal`, `legResult`, a trip's `tripResult`, `progress/rail/par.js`) — par the expert's expected score on the very leg sailed (the stream played by three players); a leg's rank its score against par (S to D), the trip's its legs' weighed by their bars; the medal a count of downs a leg (Star Fox 64's), the trip's every fighting leg's; the tally, the last log line. *Not:* the chain.
- **a hazard / the ring run / the lesson / practice** (plain names; `HAZARDS`, `RING_RUN`, `LESSON`, `lessonOf`, `practiceOf`, `progress/rail/legs.js`; set, met and paid by `Hazards`, `src/world/emocean/hazards.js`; practice sailed by `stage.sailPractice`; `docs/plans/RAIL-STANDARDS.md`) — a pillar, arch or gate in one lane of the frame's three where the view looks down the scroll (a scrape a hit; every arch of a leg threaded, a find) / every ring of a turn threaded, a hit mended / a leg's first sailing, its open's foes met one kind at a time, alone / a leg sailed once, sailed again from the pier at a strength you pick, nothing counted. *Not:* a set piece's parts, the showcase crossing (DEBUG's), a QAIS test.
- **the practice cards** (`practiceCards`, `src/ui/practicecards.js`) — the pier's PRACTICE row as choice cards, a leg's type each: its strip (its phases at their lengths in bars, each in its view, the peak in gold) and its strength as four pips that sail at once. *Not:* practice (the rule, `practiceOf`), a mount's views.
- **reckoning** (`RECKON`, `reckonLead`) — how much of a crossing the Courier has divined (Divination), 0..1 for that day. *Not:* "course" (the
  basement's).
- **the sea chart / the route / a waypoint / a forecast / a route map** (code `passage`, `portent`, `rutter`; `src/progress/econ/passage.js`; plain since
  2026-10-19: SCOUT ROUTE, RESET ROUTE, SET SAIL) — waypoints laid between two islands, the path planned through them, one leg, Divination's view of one, a route's map. *Not:* a Cogitomap. → detail
- **the trip's pressures** (`src/progress/rail/trip.js`) — the hull, the bunker, burn, adrift, heaving to, high water, a waypoint's feeling, a
  following sea, a squall. *Not:* the vessel's cracks. → detail
- **the plume / a front** — an island's weather running out to sea / where two plumes meet and a squall forms.
- **the Drowned Light** — the graveyard leg's drowned lighthouse, the False Light's twin below.
- **the encounters at sea** (`ENCOUNTERS`, `progress/rail/encounters.js`) — the Dead Reckoners, the Last Word (Letty's cutter), the Cantor, Hap
  Lagan and Bob, the Bourse, the Glass, a drift bottle. One not yet met is a **Sighting**. *Not:* an encounter of the Spirit Garden. → detail
- **the Umbral** (`game.umbral`, `src/vfx/umbral.js`) — the world below the Emocean's surface, where the ship's Umbral form fights. *Not:* the
  crossing. → detail
- **the open sea / a square / an islet (Islet of Ego)** (plain names, the owner's "Islets of Ego", 2026-10-20; rules `src/progress/opensea/`, the room `game.opensea`, `src/world/opensea/`, the free helm `Helm`, `helm.js`; `docs/plans/OPEN-SEA.md`) — the Emocean off the lanes, sailed at a free helm, a safari / one cell of its 9 x 7 grid (`seaGrid`), its column the law, its row how far off the lanes / a small island off the lanes the Courier can moor beside and walk, one secret each (`isletOf`). *Not:* a planetoid (the Spirit Garden's), an Island of Ego, the crossing.
- **an islet's look** (`SeaLooks`, `game.seaLooks`, `src/vfx/opensea/isletlooks.js`, its kits `vfx/opensea/isletkits/`) — an islet dressed over its placeholder: its kit's mound, the one or two things on it and its secret's shape, one vertex-coloured mesh an islet, its walkable top the collider's. *Not:* the islet itself (Dovina's rule, `isletOf`), its placeholder (`seaprops.js`).
- **the islet puzzles' looks / the dig's moment** (plain names; `PuzzleLooks`, `game.puzzleLooks`, `src/vfx/opensea/puzzlelooks.js`, its shapes `puzzlekit.js`, effects `sea.dig`, `sea.dig.find`) — the islet puzzles' pieces dressed over their placeholders: a pair's carving, the line-up's stone and arcs, the echo stones and their sockets, a dug cache's opened chest / a cache dug: sand thrown up, the chest rising out of its hole and its lid opening on a find's glint. *Not:* the puzzles (Dovina's rules, `isletpuzzles.js`), their pieces (`puzzlepieces.js`).
- **the squall line's look** (plain name; `SquallLine`, `game.squallLine`, `src/vfx/opensea/squallline.js`) — an open-sea front (`frontAt`) drawn: a dark wall of rain and cloud standing on the water along its band, a shelf cloud ahead of its leading edge; inside it, the long rain round the eye and the storm's veil (`stormWarp.set({ veil })`). *Not:* the front (Dovina's rule), the storm warp's bend, the weather's look, the plume.
- **an Egregore's placeholder body** (plain name; `egregoreBody`, `EGREGORE_FEEL`, `game.makeEgregore`, `src/vfx/opensea/egregorebodies.js`) — one safari species drawn simply: its silhouette in the Brine hide, spots in a placeholder feeling's colour, scaled to its size, still. *Not:* the species (`EGREGORES`, Dovina's), a rail foe's body, the sea serpent's body.
- **a discovery / doubt / a fix** (`discoveries.js`, `seatrip.js`) — a thing found off the lanes, reported once at a dock for its tier's fee / how many squares you may be off your reckoning (dead reckoning) / clearing it, by a charted landmark in sight or the sky read with the Dreamvane. *Not:* a Sighting (an encounter not yet met), a rutter.
- **an islet puzzle: a pair / a line-up / an echo / a buried cache** (plain names; `isletpuzzles.js`, the world's `PuzzlePieces`, `world/opensea/puzzlepieces.js`; OPEN-SEA.md 12) — two islets carved alike (seen both: a find) / arcs over the water that close into one ring from a spot (a fix and the squares round charted) / a stone that sings a phrase and its twin that listens for it on the Crucibelle / treasure in an islet's sand that only the Dreamvane's dowse finds, dug once. *Not:* a chest (in plain sight), a Cogitomap, a puzzle duel.
- **a herd / the migrations** (plain names; `herdsOf`, `herdFee`, `MIGRATION`, `src/progress/opensea/migrations.js`; OPEN-SEA.md 13) — one species of Egregore gathered in one square of the open sea for a game day, posted on the dock's board and paid once when photographed / the game day's herds, the same for everyone at sea that day. *Not:* the flock (the AI part), a swarm (the rail's), a sighting (an encounter not yet met).
- **a disposition / the sea serpent** (`EGREGORES`, `safari.js`; `SEA_SERPENT`, `seaserpent.js`) — what an Egregore does when the ship comes near: passive, wary, territorial or hostile (Monster Hunter's) / the open sea's first hostile one, Marlin class, the vertical slice's test. *Not:* grain (a mind's traits), mental state.
- **the sea serpents / a sea serpent's mind** (`SeaSerpents`, `game.seaSerpents`, `src/creatures/seaserpent/seaserpent.js` / `seaSerpentMind`, `seaserpent/mind.js`) — the open sea's hunters as creatures: a head steered on the drawn sea, its four moves windups on the water, its body (`SeaSerpentBody`) driven and struck where it is drawn / its wants and actions from `creatures/ai/`, watching the hull (the Brain's `sees`). *Not:* `SEA_SERPENT` (Dovina's numbers), the sea serpent's body (Calissa's look).
- **the fight at the helm / a lair** (`SeaFight`, `game.seaFight`, `src/world/opensea/seafight.js`) — what fights on the open sea: the ship's gun on LMB (aimed with the camera, the height found for you), V sending the outlined spit back, the hull's hits (the ship's `bears`; broken, towed to the lane; mended at a dock), the coil's hold on the helm (`helm.mods`) / a square a sea serpent keeps. *Not:* the rail's shots, the ship's hold (casks).
- **the sea serpent's body** (`SeaSerpentBody`, `src/vfx/opensea/seaserpentbody.js`) — the sea serpent drawn: a chain of joints laid follow-the-leader on the head's path, humps arched through the surface by `rise`, one hide swept over it in the Brine dress, the head and jaw with their gold line while up; driven by its mind. *Not:* its mind (Petra's, `creatures/ai/`), `SEA_SERPENT` (Dovina's numbers).
- **the fight at the helm's look / the hull at sea** (plain names; `SeaFightLook`, `game.seaFightLook`, `src/vfx/opensea/seafightlook.js` / `SeaHull`, `game.seaHull`, `src/ui/seahull.js`) — the open sea's fight drawn in the rail's hand: the gun's needles, the spit's glob as the rail's outlined shot (sent back, the Courier's), a muzzle's flash, a hit's sparks, a splash where one falls short / the hits the ship can still bear as the rail readout's pips, top-left while sailing and hurt or hunted. *Not:* the fight (Petra's, `world/opensea/seafight.js`), the rail readout.

## 8. Records and progression

- **the System** (`src/progress/system.js`) — the game's code made a voice; it teaches the Movement Arts and keeps the save. Always capitalised.
  *Not:* a game system in general.
- **the Codex** (B, `src/feedback/codex/codex.js`) — the System's book: arts, the ledger and records, the tools, THE ARCANA (the collection's
  Majors), the Veritome's shelf, curios.
  Its **STATUS shelf** (`codex/status.js`): the domains' levels and Soul Alchemy's ranks as two radar charts.
- **the DEBUG save / the STORY save** (`game.mode`; `docs/plans/DEBUG-MODE.md`) — the two separate records the title's choice picks; settings
  shared, nothing else crosses. DEBUG is STORY plus the lend panel, the commands, the debug chests and presets.
- **the lend panel** (`game.lend`, `src/progress/lend.js`) — DEBUG's switches, one a category (arts, knacks, moves, Shrines, Figment telegraphs, ...): a lent
  category answers yes at its gates without the ledger; never counted, never outside DEBUG. The all-arts switch (`system.lendAll`) is its
  arts row. Drawn by `src/ui/lendpanel.js` (the Codex's LENDS, QAIS's Lends); a lent art wears the hollow mark. *Not:* "Lab mode".
- **a preset** (a plan, not built; `docs/plans/DEBUG-MODE.md`) — a moment of play as data (ledger counts, kit, cubes, lends, a place), loaded into the
  DEBUG save to start a test there. *Not:* a debug chest (items only), a replay.
- **the ledger** (`src/progress/stats.js`) — every count the game keeps. An **achievement** (`src/progress/achievements.js`) is a predicate over
  the ledger, never a flag.
- **the log** (`src/feedback/gamelog.js`, rules in `tracking.js`) — the only narration (what happened); **the chat line** is its typing.
- **the domains** (`src/progress/domains.js`, `game.psyche`) — the seven skills of the Courier's psyche: Ouranurgy, Manifestation, Divination,
  Psychokinesis, Possession, Alteration, Spellscription. No new domains, ever. *Retired:* Spellcasting. → detail
- **widening** (`RAMP.tools`, `widenOf`, `game.psyche.widen(key)`) — what a domain's level does to a tool in play: a multiplier of its range or a
  bonus to a count, on the ramp's curve; never accuracy, nor tempo (an attribute's); at level 1 the tool is as it is without.
- **knack** (`game.knacks`, `src/progress/knacks.js`, `/knack`) — a passive Art, a toggle, opened by an achievement, where an assist lives; on
  until switched off. *Not:* a widening, nor a Movement Art. → detail
- **an aptitude** (working name, Espada's and the owner's; `docs/plans/APTITUDE.md`, a plan) — an ability the System measures from how you play, in its own unit and against yourself. *Not:* an attribute (Soul Alchemy's), a domain.
- **Luck** (`src/progress/luck.js`) — the surprise lived through (in bits), read from the ledger; it sways chance, never a skill.
- **day** (`today()`, `src/core/calendar.js`) — one game day, an hour of real time; always written **game day**, no bare "day". *Not:* a calendar
  day.
- **game hour** — a twenty-fourth of a game day, 150 real seconds. *Not:* an hour of play.
- **real time** (real second, minute, hour) — the wall clock; a unit of time always says which clock, game or real.
- **the goals** (plain name until the owner rules; `Goals`, `game.goals`, `pickGoals`, `src/progress/goals.js`; `/goals`; save section `goals`) — three achievements the System lays each game day for the session to work toward: the nearest done, one elsewhere, a stretch (a new save's, Easy first steps); **the first path** (`FIRST`; `docs/plans/FIRST-HOUR.md`): a new STORY save's goals as ten steps walked outward from where you wake, a step done replaced by the next (`goal.next`); pointers only, the achievement its own reward (Hades' Fated List, Nook Miles+). *Not:* a QAIS test, a bounty, the Sight's waypoint.
- **counter / record / first** (`stats.inc`, `stats.hi` / `stats.lo`, `stats.first`) — the ledger's three kinds of entry: a number that only goes
  up, a best, and the play time something first happened.
- **chain** (`chain.<what>`) — the same event n times, each within a set time of the last; it counts once and starts over. See the homonyms.
- **tier** (of an achievement) — Easy to Grandmaster, worth 1 to 6 points; the points buy a standing; some give a title. See the homonyms. →
  detail
- **build** — one published version of the game (v45...). Progress resets on every new build; settings are kept.

## 9. What the game shows and sounds

- **the pause menu** (Esc) — the help pages and the controls. *Retired:* "pause card".
- **the Pneuka Box** (P, `src/pneuka/`) — the inventory (56 slots) and what is worn; at a Shrine's STORAGE row, its storage opens beside it.
  *Not:* the Veritome.
- **the Box's storage** (`box.storage`, `storageOpen`, `openStorage`, `src/pneuka/box.js`; save section `storage`) — the Pneuka Box's long-term
  store, opened only at a Shrine: any thing, stacked by kind, up to 56 stacks. *Not:* the shed's storage (the Spirit Garden's decor), the bank
  (retired).
- **the reading table** (plain name; `ReadingTable`, `game.readingTable`, `src/ui/readingtable.js`) — the Pneuka Box's loadout drawn as a tarot reading: the main tool's card upright, the sub's crossed over it, the pair's Major Arcana beside them (face down until opened), the shelf's tools as a hand to pick or drag, a swap's preview, and your seal pressed over a refused swap. It draws what it is handed (`draw(state)`) and sends back hover, pick and drop. *Not:* the window (Dovina's `pneuka/ui.js`), the loadout's rules, a table (Raku's).
- **a spread / a spread's position / the spread board** (plain names; tarot's own words; `SPREADS`, `light`, `tally`, `src/progress/spreads.js`; measured by `scripts/spreads.mjs`; `docs/plans/SPREADS.md`) — Major Arcana laid in a tarot layout (the three-card, the Horseshoe, the Celtic Cross), opened by achievement / one place in it, its rule its meaning (the Past fades, the Challenge counts only in a fight; the Crown position, never bare "the crown") / the Pneuka Box's underside, the same 8 by 7 grid, shown by its flip, mirrored. *Not:* the reading table (the loadout), a table (Raku's).
- **the laid spread** (plain name; `LaidSpread`, `game.laidSpread`, `src/progress/laidspread.js`; save section `spread`; tracking `tracking/spreads.js`) — the
  one spread you have laid: which spread, a card in each position (reversed or not, when laid), your pair's card in the Present; it lights the
  board, counts the four tallies over the Box's cells and makes them modifiers (the pool's `costMult` and `regenMult`, `cupsK`, `swordsK`,
  `worthK`); it tells `spread.lay`, `spread.flip` (F in the window), `spread.tally`, `spread.crack`, `spread.complete`. *Not:* the rules
  (`progress/spreads.js`, Dovina's), the window's flip side.
- **the underside** (plain name; `Underside`, `src/pneuka/underside.js`) — the Pneuka Box turned over (F) in its window, drawing the laid spread: the spreads' tabs (open by achievement, SPREADS.md 5.5), the cloth, the positions, the hand, the tallies. *Not:* the laid spread (its state, Petra's), the reading table (the loadout), the reading view (round the Courier).
- **the reading view** (plain name; `ReadingView`, `game.readingView`, `src/vfx/readingview.js`; SPREADS.md 5.1.1) — the Box flipped, in the title's dark: the laid Major Arcana orbiting the Courier in the spread's own geometry (the Celtic Cross's cross at their heart, its staff beside them), each edged in its suit's colour; the 8 x 7 grid as a lit cloth under their feet (the underside, seen from above: a suit's glow, a wild cell's film, a dark cell's crack); the hand fanned below (off: the window's bar is the hand); behind them the class's card (the laid spread's court, the Fool before any), large and faint in its suit's colour, turning over when the class changes. Petra's scene and camera, Dovina's rules (`progress/spreads.js`). *Not:* the reading table (the Box's loadout), a spread (the rules).
- **the reading view's scene** (plain name; `ReadingScene`, `game.readingScene`, `src/render/readingscene.js`) — the dark the reading view is drawn in, in place of the world while the Box is turned over: the title's Courier borrowed and hung as in the fall, the camera rising through the cloth and orbited round them on the arrow keys for a shot (`orbit`), and the view's picks made from it (`pickAt`). *Not:* the reading view (its look, Calissa's), the title's scene.
- **the underside's dress** (plain name; `installUndersideLook`, `UNDERSIDE_LOOK`, `src/ui/undersidelook.js`) — the Pneuka Box's flip side (Dovina's page, `pneuka/underside.js`, its `us-*` classes) in the Clay dress and the reading view's suit colours: the spreads as glazed tiles, the cloth as plum velvet with gold thread, a dark cell burned through with a scorched crack, the Fool's gold disc, a laid place as the house deck's stock (reversed edged vermilion), the hand fanned and the held card haloed, the tallies as glazed bars. *Not:* the page (Dovina's), the reading view (the 3D one).
- **a card's footprint / a lit cell / an item's suit / friendly and contrary suits / a wild card** (plain names; SPREADS.md) — the cells a laid Major lights on the Box's face, its size its card rank / a cell under a footprint, empowering an item of its suit / the suit an item takes by its kind (Wands, Cups, Swords, Pentacles) / the Golden Dawn's dignities: Wands and Cups, Swords and Pentacles cancel, all else adds / a planet card, lighting any suit at 0.75. *Not:* a zone (a render zone), a field (crude's), a patch (the City Trial's).
- **a class / the day's card / the season's suit** (plain names: tarot's and the genre's; `classOf`, `CLASS`, `ZODIAC`; `dayCard`, `DAY_CARD`; `SEASON_SUIT`, `src/progress/spreads.js`; CLASSES.md, SPREADS.md 11) — what your suits' tallies read as: the Fool (none held), a court card (one suit, Page to King by depth), a zodiac Major (two: the element and its modality), the World (all four, balanced); Golden Sun's classes / the one Major Arcana card a game day, the same for everyone, whose strength doubles where it is laid / the suit the season favours (Pentacles spring, Cups summer, Wands autumn, Swords winter), its points x1.25. *Not:* a house card (Raku's tables), a card rank, the Spirit Garden's season itself.
- **the map** (M, `src/feedback/cartography.js`) — on screen **Map** (the owner, 2026-10-20); Mind Mapping stays in the world and the Codex.
- **the dialogue box** (`src/npc/dialogue.js`) — the one window of words in the world.
- **a page set aside** (`showPage(..., { aside })`, `src/feedback/indexmenu.js`) — an index-window page in a column to one side with no veil, so
  the world beside it stays in view (the pier's, away from the moored hull). *Not:* a page centred under the veil, Margarite's dock.
- **the overlay** (working name, Espada's and the owner's; `docs/plans/OVERLAY.md`) — the System's sight laid over the world: the ring, tags,
  System windows, the Book, the title placard; words and numbers in the System's type, saying what is, never what happened. *Not:* the log.
- **a tag / a System window / the title placard** (working names; OVERLAY.md 8; a creature's tag: an ofuda slip, `CreatureTags`, `src/vfx/creaturetags.js`;
  the placard: `TitlePlacard`, `src/vfx/titleplacard.js`) — a readout pinned to its thing in the world / a sheet summoned into the air before
  the Courier (the isekai status window) / the one pop-up, a Jōmon clay placard handed down for an achievement that awards a title. A creature's
  tag shows only at the lock-on and in the Veritome's raised lens (`visual.creatureTags`: scan, lockon, off; `visual.creatureTagsMinimal`). *Not:* a
  world mark (no words), the dialogue box (the folk's).
- **the overlay's scene** (`OverlayScene`, `game.overlayScene`, `src/render/overlayscene.js`) — the overlay's own 3D layer: meshes in CSS
  pixels, anchored to the view or a DOM element, lit by its own light, drawn into the canvas after the glow and the grade (OVERLAY.md 15.2). *Not:* the world's scene, the HTML HUD over it.
- **the Sight / its waypoint** (`game.sight`, `src/progress/sight.js`; the instrument Calissa's; OVERLAY.md 16) — the instrument top-right: compass,
  barometer and clock in one / what its needle points to, calibrated to a place or creature you know, or home; it spins when uncalibrated (Jack Sparrow's compass). *Not:* the wire compass, the map.
- **the Sight's calibrate button** (plain name; `calibrateButton`, `installCalibrateButtons`, `src/ui/calibratebutton.js`) — a TRACK button set beside a thing you could want (a Veritome plate's creature, a charted room on the map) that calibrates the Sight to it (`game.sight.calibrate`), TRACKING and lit gold while it is the waypoint, pressed again to stop; a refusal said where pressed. *Not:* the Sight, its waypoint, `/sight`.
- **familiarity** (working name, Espada's and the owner's; `familiarityOf`, `src/progress/familiarity.js`; OVERLAY.md 13) — how well the
  Courier knows a kind of creature, 0 UNKNOWN to 4 UNDERSTOOD, from photographs or downs: what its tag and a blow's readout may show. *Not:* the bestiary's understanding (one of its two avenues).
- **a line's read: plain / latent / scrambled** (`readTag`, `readKind`, `src/tools/veritome/creaturetag.js`; OVERLAY.md 17) — how a tag's line or a
  bestiary fact reads: known / held by a plate in the Veritome's memory, not yet appraised / not known (its running hand churning); a tag's **habit** is its line naming what the creature is doing now. *Not:* a status.
- **neuralese / a root** (`docs/NEURALESE.md`; `ROOTS`, `src/npc/neuraleseroots.js`; `cellsOf`, `npc/neuralesespelling.js`) — the language minds are
  told in, Toki Pona's way (LOGA-NUSA, mind-speech) / one of its 127 words, meaning built by joining them head first. *Not:* a Function (a macro's step).
- **the neuralese script / the Comb** (working names; OVERLAY.md 15.5, a plan; LORE.md) — neuralese written in our own featural glyphs in a
  Thai-and-Tamil hand (Goetic seals, chip traces), decipherable / its stamp script on hex cells: a barcode etched on things, a hanko,
  the Pneuka Jar's seal face. Drawn: the running hand (`runningHand`, `src/ui/runninghand.js`, from `cellsOf`), the seal face (`drawSealFace`, `src/vfx/sealface.js`). *Not:* the katakana placeholder, the Latin capitals in code, real Thai or Tamil letters.
- **a cradle / sealing / an imprint / the Seal Book** (ruled 2026-10-17; "cradle" ruled by the owner 2026-10-19, the other names Espada's, parked; `game.cradles`, tag `cradle`, `src/world/cradles.js`; your seal: save section `seal`, `cradles.mine`; `docs/plans/HANKO.md`) — a receptacle in a machine, gate or ship /
  the Courier folding into the Pneuka Jar and setting its seal in one, so the thing runs as you / what a seal leaves / the Codex shelf of
  imprints given and cradles' seals received (a goshuinchō). *Not:* a slot, a socket (the bracelet's), a print (the trail map's).
- **the seal picker / the imprint's look** (`SealPicker`, `src/ui/sealpicker.js`; `SealImprints`, `src/vfx/sealimprint.js`) — your seal chosen once at
  the title, as a ceremony, shown on a cradle and in the Seal Book before you confirm / the imprint burned into a cradle at `seal.set`, dim after.
  *Not:* the cradles (`world/cradles.js`).
- **the cradle's look / a helm cradle** (`CradleLook`, `src/vfx/cradlelook.js`; `helmCradles`, `vfx/sloop.js`, `vfx/shipclasses.js`) — a cradle's body as built (the octagonal clay well, its gold collar and four tines, lit in the window colour while sealed), shared by the Shrine's threshold and every ship / the one (the galleon's two) at a ship's helm, where a crossing is sealed into. *Not:* the cradles (`world/cradles.js`), the imprint's look.
- **the Sight / the Lachrimeter's tube** (working name, Espada's to rule; the look `game.sightLook`, `src/vfx/sight.js`, the waypoint Dovina's `game.sight`, `progress/sight.js` / `LachrimeterTube`, `src/vfx/lachrimetertube.js`)
  — the instrument top-right (a needle to the waypoint you know of, the weather's liquid, a wadokei hour ring, the Dissonance arc, the place
  plate) / the Lachrimeter as a thermometer bottom-right (the bulb and column the pool, the held stretch, the expansion chamber, the Bottles'
  valve; **the Blink's pearls**, a glass pearl a charge on a brass rail beside the column, in combat only, `vfx/lachrimeter/blinkpearls.js`;
  **the cube plate**, the cubes' balance in a Nixie window on the plinth, `vfx/lachrimeter/cubeplate.js`). *Not:* the overlay (the System's
  sight at large), the wire compass, the Dreamvane's vane, the LACHRYMA panel (retired 2026-10-18).
- **an island's dress** (Espada's, ruled 2026-10-16; OVERLAY.md 15.4) — the overlay's material on an island: Clay (Anagami), Nacre
  (Margarite), Glass (Entropolis), Brine (the Emocean); changed at the seam on arrival. *Not:* the window colour (the player's).
- **an aptitude / the Assay** ("the Assay" ruled by the owner, 2026-10-19; `docs/plans/APTITUDE.md`) — one ability the System measures from how you play (an
  absolute in its unit and you against yourself) / its window of them all, ??? until play gives evidence. *Not:* an attribute (Soul Alchemy's), a domain.
- **the goals window** (`GoalsWindow`, `game.goalsWindow`, `src/ui/goalswindow.js`) — the game day's three goals (Dovina's `game.goals`) as a System window at the view's left edge in the Clay dress: a row a goal, its slot (Close, Elsewhere, Stretch, First step), name, words, tier, a bar to `frac`, `cur` of `goal`, a gold check when done; on `/goals` and a beat at `goals.set` and `goal.done`. *Not:* the goals (Dovina's rule, `progress/goals.js`), the goal bar (Raku's tables').
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
- **the UI icons** (`uiIcon`, `src/ui/icons/`) — the choice card's, the keywords' and the reading table's fittings' (`fit.<kind>`) and the god hand's arts' (`godart.<art id>`, `ui/icons/artart.js`) pixel art, a picture of what each
  thing does, in the icons' hand (a light shape keylined dark), palette-swapped. *Not:* the sea chart's icons. → detail
- **a domain's look** (`DOMAIN_LOOK`, `src/ui/domainlook.js`) — a domain's colour, sign and icon; never a feeling's colour. Anagami dresses it as a
  kiln-glaze tile; the identity is the colour and the sign.
- **the pendulum** (`CrucibelleHud`, `src/vfx/crucibellehud.js`) — the Crucibelle's beat for the eye, on the wire compass. *Not:* the metronome
  (the fob on the bell), nor in the rhythm mode. → detail
- **the lens's frame** (`VeritomeFrame`, `src/vfx/veritomeframe.js`) — four corners round what a plate would hold, in the third person while the
  Veritome is drawn and its lens down, set where the aim meets the world. *Not:* the viewfinder (the lens raised), the Snapshot's preview. → detail
- **the toll's reach** (`TollReach`, `game.tollReach`, `src/vfx/tollreach.js`) — the next toll's reach and cone on the ground round the Courier
  while the Crucibelle is in the hands, lit on the beat, a ring under each thing it would stagger. No words. *Not:* the toll's smoke ring. → detail
- **the Lockheart's reliquary / the hoover's reach** (working name, Espada's to rule; `LockheartReliquary`, `game.lockheartReliquary`, `src/vfx/lockheartreliquary.js` /
  `LockheartReach`, `game.lockheartReach`, `src/vfx/lockheartreach.js`) — the Lockheart's own UI by the Lachrimeter: the coffin on its chain (its fill
  to twice its measure, the padlock, the Possibilikeys and their break chances, the flail's string, the wheel of odds held and spun) / the hoover's
  cone on the ground while it draws. *Not:* the wheel of odds in the world (`tools/lockheart/wheel.js`), the Lachryma ring. → detail
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
- **the held stretch** (`LachrimeterTube`, `src/vfx/lachrimetertube.js`) — the top of the Lachrimeter's tube's bore a cap on the pool holds off,
  in its source's look (the cracks: crazed glass, the clay's cracks in it, a cracked clay seal at the cap line). *Not:* the pale stretch (a charge's).
- **Dread's fog on the Raceway** (`RacewayFog`, `game.racewayFog`, `src/vfx/racewayfog.js`) — three low sheets of cloud in Dread's colours
  laid along the course while `raceway.condition.fog` is up. *Not:* the scene fog (`render/daylight.js`), the miasma's lenses.
- **vertex painting** (a trial, off by default; `VertexPaint`, `game.vertexPaint`, `src/vfx/vertexpaint.js`; `/vertexpaint`) — a zone's mood lamps baked into its static geometry's vertices (light, shadow and AO), the lamps then off the light budget. *Not:* the paint map, a feeling's paint, a glaze.
- **graphics / a graphics tier / dynamic resolution** (`T.visual.graphics`, `GRAPHICS_TIERS`, `game.graphics`, `src/render/graphics.js`) — the one quality setting: auto (read from the machine at boot), High, Low, Minimum, or Custom once a knob it owns is moved by hand / one row of those knobs (lines, MSAA, light slots, the shadow's size, filter and rate, the glow, the outline hulls' reach) / the lines stepped down while the frame keeps missing the display's refresh, and back up, never below the tier's floor. *Not:* the resolution setting alone, the light budget.
- **the glitch** (`game.glitch`, `src/vfx/glitch.js`) — the data showing through at a big moment: one screen pass; always set off by an event and
  short; the setting `visual.glitch` turns it off. *Not:* a bug's flicker.
- **the crackle break** (working name, Espada's to rule; `CrackleBreak`, `src/vfx/crackbreak.js`) — a stunned Figment's glaze shell crazing and
  bursting (about 0.3 real s) just before the data drain takes it (.hack's Protect Break). *Not:* the bubble, a guard break, the vessel's cracks.
- **the aberrant encounter's wipe** (`AberrantWipe`, `game.aberrantWipe`, `src/vfx/aberrantwipe.js`) — the battle transition into a puzzle duel with an aberrant: the frame caught and drawn toward it, its data bug showing, the held frame crazing, then shattering along the Line. *Not:* the maw wipe, the glitch, the crackle break.
- **the pull's edge** (`AberrantWipe.edgeK`, `src/vfx/aberrantwipe.js`; `/pull`) — the pull toward an aberrant (`game.duelFoes.pull`) worn as a chromatic aberration creeping in from the view's edges, the middle always clean, before its wipe. *Not:* the wipe, the glitch, the pull itself (Petra's).
- **the aberrant inversion** (`AberrantInversion`, `src/vfx/aberrantinvert.js`) — an aberrant Figment drawn in its colours inverted while it lives, on copies of its materials, a placeholder for its own look. *Not:* a data bug, the cast.
- **the blob shadow** (`BlobShadow`, `game.blobShadow`, `src/vfx/blobshadow.js`) — the soft dark disc straight down under the Courier on whatever is below, smaller and fainter with height, beside the sun's shadow. *Not:* the sun's shadow, the aura's stain.
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
- **a lend gesture** (plain name; `LendGesture`, `LEND_GESTURES`, `src/courier/anim/lendgesture.js`) — the Courier's upper body (or one arm) doing the sub tool's lent verb on R (`tool.lend`) over the main's stance, the run or the air, a stretch of an existing clip; never the legs or the pelvis. *Not:* a gesture (a held tool's own clip), an emote.
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
- **the System's interface** (working name; `docs/plans/AGENT-INTERFACE.md`, a plan) — the game as any agent reaches it: readouts as data (what
  the overlay draws), intents, time, resources; a protocol (MCP today) is a skin over it. *Not:* the agent (its first client).
- **playtest** (`npm run playtest`) — a scenario an agent plays to its goals. The stress test fuzzes; a playtest plays.
- **a sweep** (`scripts/sweeps/<room>.mjs`) — one room entered, worked and left headless, a PASS/FAIL line a check. *Not:* the stress test, a
  playtest, the Soul Brush's mop, the kick's leg sweep.
- **the pose audit** (`scripts/poseaudit.mjs`, its manifest `scripts/poseaudit.states.js`) — the Courier's poses measured headless, state by state:
  a held tool or a limb through the body (cm), a joint past its range (degrees); a contact sheet of the worst frames. *Not:* a sweep, rom.js.
- **replay** (`game.replay`, `src/core/replay.js`) — a session kept so it plays again the same: a header and the frames. *Not:* a chat command. →
  detail
- **the casebook** (`docs/CASEBOOK.md`, its cases `docs/CASEBOOK-CASES.md`) — every bug fixed, with its cause and the rule it left. *Not:* the log, a report, the ledger.
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
| chain | a run of one event (the ledger's `chain.<what>`); three downs of one feeling on the rail, each three a level of the crossing's multiplier (to eight, x3); a puzzle duel's settle passes that clear (`chain` event, its `step`) | "a chain of ...", "a feeling chain", "a duel's chain" |
| combo | the club's chain of blows; the rhythm mode's run of notes; the skiff's chain of tricks (`SkiffCombo`) | "the club's combo", "a rhythm combo", "the trick combo" |
| Well | the Weir's well of liquid Lachryma (a place); a Well, a pocket of distortion (a dungeon) | "the Weir's Well", "a Well" |
| place | a named spot things are sent to (`game.places`); where a weather falls (`placeOf`: an island or `well:<id>`) | "a place" is `game.places`'; "the weather's island" or "the Great Dunemaw's weather" |
| day | a game day (`today()`); the bright part of it (`phaseAt` 'day') | "game day"; "daytime" |
| calm | no weather (`aspect` null, the log's "fair"); the swells laid down for a stage's breather | "fair" for weather; "a calm" for the stage |
| hold | a ship's hold (casks); to hold the save; a rig's hold (a clip's stretch rocked while a move is held); a pot in both hands (`carry.js`, `carryHoldAt`); a puzzle duel's Hold (the Lockheart's move, junk into the coffin); the boss hold (a peak held until its boss falls, `bosshold.js`) | "the ship's hold"; "hold the save"; "the clip's hold"; "the carry's hold"; "a duel's Hold"; "the boss hold" |
| break | a puzzle duel's break (`duelBreak`: a side's EmO broken); junk broken beside a clear (the duel's `break` event); a guard break; the crackle break | "a duel's break"; "junk broken"; "a guard break"; "the crackle break", always in full |
| kick | the kick (the unarmed moveset, `courier/moves/kick.js`); a piece's kick on a puzzle duel's board (Bomberman's) | "the kick" is the moveset's; "a piece's kick" |
| finisher | a stun's finisher (`stun.finisher`); a puzzle duel's finisher (`FINISHER`, the god hand's end on a broken foe) | "a stun's finisher"; "a duel's finisher" |
| run | a match's old name (retired: say match); the Courier's run on a duel's board; the running gait (the core movement) | "a duel's run"; "the run" is the gait's |
| grab | the skiff's grab (a trick); a puzzle duel's Grab (the Sondelass's move) | "a grab" is the skiff's; "a duel's Grab" |
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
| guard | the held block (V); the Sondelass's guard (its UI, `SondelassGuard`) | "the guard" is the block; "the Sondelass's guard" in full |
| glaze | the Courier's (`GLAZES`, fired at a finishing station); a room glaze (`ROOM_GLAZES`, on a room's built surface or ware); a hull glaze (the Solar Skiff's, `glazeHull`) | "a glaze" is the Courier's; "a room glaze", "a hull glaze" in full |
| seal | your seal (the Pneuka Jar's base, HANKO.md); an attribute's seal (the potter's chop on the press's kerb); a sealed room (the stele's) | "your seal"; "an attribute's seal"; "a sealed room" |
| suit | a division's (Petra pentacles, Wanda wands, Calissa cups, Espada swords); a house card's (Raku's tables); an item's (the spread board's, SPREADS.md) | "a division's suit", "a house card's suit", "an item's suit" |
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
| title toast | the title placard (the owner, 2026-10-17) | (gone) |
| course (for moving between rooms) | rooms (`game.rooms`) | `game.course` (`src/world/basement/basement.js`) |
| the Lockheart's gauge (`LockheartMarks`, the padlock and sockets beside the coffin) | the Lockheart's reliquary (the owner, 2026-10-19: retired with board v10) | `docs/plans/MELEE-LOADOUT.md`, `docs/plans/REGISTERS.md` |
| the string row (`CutlassStringRow`, the cutlass's pips at the bottom middle) | the Sondelass's guard, its blade's notches (the owner, 2026-10-18: retired with the old HUD) | (gone) |
| the Soul Brush's radial (the wheel on 1 held, `paintradial`; its icons `paint.<pick>`, `ui/icons/paintart.js`) | the Soul Brush's desk; the quick pick (1 held) (the owner, 2026-10-19: retired with board v11) | `tools/soulbrush/radial.js` (`PaintRadial`, the ring's mechanics: Petra's name) |
| the bank (the Veritome's Book as storage; the Shrine's THE BANK row; `bankOpen`, `openBank`) | the Box's storage (`box.storage`, `storageOpen`, `openStorage`; the Shrine's STORAGE row) (the owner, 2026-10-23: the Veritome is observation only) | `pneuka/ui.js` (its pane's name, Dovina's) |
