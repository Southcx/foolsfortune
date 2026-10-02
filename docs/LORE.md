# Fool's Fortune: the series bible

Who lives in this world, where things are, what has happened, what things are called, and how it all sounds. Espada (Lore) keeps
this page. Other divisions read it before writing words a player will see, and ask Espada (through the owner) for anything it does
not answer yet.

This first edition only **gathers what the game already says**. It adds no new canon. Every entry is marked with how firm it is:

- **Canon**: said *in the world*, in words a player reads or hears: the folk's lines (`src/npc/talks.js`), the log
  (`src/tracking.js`), the System's voice (`src/system/voice.js`), the Veritome's pages (arcana lore and hints, bestiary facts),
  examine lines and blurbs (curios, lures, tools, fish).
- **Design**: said only in the maker's notes (README, `docs/OST.md`, module header comments). It is intent, not yet something the
  player has been told, and is easier to change.
- **Open**: there is a hole or a clash here that the owner should decide (see the last two sections).

Sources are given in brackets so any line can be checked.

---

## 1. Tone and voice (as the existing text writes it)

These are habits the text already has. Writers in every division should keep them until the owner says otherwise.

- **British spelling**: colour, favourite, grey. [throughout]
- **Plain, wry, understated.** Funny by being flat about strange things, never by winking: "It does up nothing. It has been on a
  great many coats." (Barnacle Button); "Nobody has asked whether it enjoys it." (clapperjar, dancing). Sadness is said quietly:
  "Now there's me, and the fish, and the wind." (Grog).
- **Short sentences with one turn in them.** A plain statement, then a twist: "A lamp made of what the sea had finished with."
- **The log is a combat log**: second person for the Courier's own deeds ("You shatter the pot."), third person for everyone
  else's ("The slip jelly bursts."), FFXI-style, one sentence an event. A name and a colon for speech ("Mistress Saggar : ..."). [tracking.js, CLAUDE.md]
- **The System speaks in a flat, helpful, isekai voice**: "Notice. Achievement acquired: ...", "Warning. Abnormal concentration of
  Lachryma detected." It never jokes. [voice.js]
- **The Courier's own writing** (the Arcana pages, "in the Courier's hand") is first person, reflective, a little dry: "Every journey
  in this book begins with a step off something. The jars take it without looking; so, it seems, did I." [arcana.js]
- **The folk** show feeling with their bodies and with markup in their lines (`{shake}`, `{slow}`, `{burst}`), never with stage
  directions in the words. [talks.js, folk.js]
- **Vocabulary pools** the text keeps drawing from:
  - *the potter's trade*: slip, bisque, glaze, throw / dry / fire, kiln, saggar, raku, tenmoku, celadon, oxblood, kintsugi, crackle;
  - *the sea and the tide*: tides, piers, bosuns, barnacles, gulls, whelks, ammonites, sea-glass (the curios are almost all of the
    sea, in a desert);
  - *the tarot* (the Major Arcana, the Fool);
  - *the number five* (the music's rule of five, the five aspects, five chest tiers, five plinths, five Arcana kinds for The World). [OST.md, species.js, treasure.js, arcana.js]
- **Names of things are compound and concrete**: clapperjar, slip jelly, Sondelass, Veritome, Soul Brush, Dreamvane, Crucibelle,
  Lockheart, Pneuka Box. Fish are named for a feeling plus a thing: Pale Regret, Tin Mirth, Lantern Dread, Mother Hush.

## 2. Places

| Place | What is known | Status |
| --- | --- | --- |
| **The workshop** | Mistress Saggar's workshop, by the kiln. Full of pots that "grow back". The Courier's home ground. | Canon [talks.js]; "home" is Design [OST.md] |
| **The kiln** | Feminine ("her belly"). "Everything in this workshop came out of her belly, one way or another." Makes clapperjars when "too full of Lachryma". "The kiln is where the jars come from." It is the tallest thing (the Tower card). | Canon [talks.js, arcana.js] |
| **The gallery** | The workshop's upper floor. | Design (map name only) [main.js] |
| **The basement / the hub** | Below the workshop: the movement lab and the hub with the index console. Pip hides here ("She sent me down for glaze"). Rooms off it: THE COURSE, THE SPINDLE, THE BRAID, THE MILL RACE, THE MOVEMENT LAB, THE SIEGE. | Canon (Pip) / Design (room names) |
| **The Siege** | An arena south of the lab where clapperjars raid the god hand's vessel. | Canon [bestiary.js] / Design |
| **The dunes** | "Far below the workshop": a sand sea a kilometre across, low gold sun, half-buried ruins, a pale spire with a beam of light, high dunes on the horizon, an invisible edge. "Not many come this far into the dunes." | Canon (Grog) / Design (layout) [README] |
| **The Spire** | A pale spire in the dunes with a beam of light to sail toward. Nothing is said about it in the world. | Design |
| **The Weir** | The oasis at the heart of the dunes: a pond of four terraces, a pier, the Well, the Tally stone, palms, a pergola with the tide lamp, the Tithe on the north beach. Grog: "I've fished this pool since it was a puddle. Since before the sand came. Since before the Weir was a weir." | Canon [talks.js] / Design [README] |
| **The Well** | A 9.5 m stone well of liquid Lachryma at the Weir. "The well goes further down than the dunes go up." The Drowned Lachryma rises to it at the top of the tide; "Something vast turns over in the Well." | Canon [arcana.js, tracking.js] |
| **The Tally** | A stone "where every catch is counted". "The tally does not forget a fish." | Canon [arcana.js] |
| **The treasury / the Tithe** | Raku is "treasurer of the Weir". Feed the console 25 cubes "and the treasury sends down a sealed chest". | Canon [talks.js] |
| **The town that was** | "There was a town here once. Jars and jugs and big round-bellied pots, all talking at once." Gone now. | Canon (Grog) [talks.js] |

**The sky.** "The sky here is painted, and it is still the sky." (The Star); "The oasis shows a sky the dunes do not have." (The
Moon); the Astral Astrolabe "reads a sky that is not above this room, and is not wrong about it." Taken together, the text already
hints that the world is *indoors*, or under something, with a painted sky. Canon as hints only; see the open questions.

## 3. People

### The Courier
- The player character. **She / her** everywhere. [all sources]
- Wears a **mask** (the lure is "a ghost of her mask"). [README, angling] Design
- Carries **psychic tools** on a belt (seven in all, four made: the Psygun, the Sondelass, the Soul Brush, the Veritome; and the
  Dreamvane, the Crucibelle, the Lockheart have examine lines). Canon [pneuka/items.js]
- Has an innate storage, the **Pneuka Box**. Canon (the System names it) [voice.js]
- Can turn into a **Pneuka jar**, an immobile vessel, while "you" become a disembodied hand (the god hand). Design / log ("You take the hand.", "You return to the Courier.") [godmode.js, tracking.js]
- Is **the Fool**: "so, it seems, did I" (step off something) [arcana.js]; the Fool's Step is her motif [OST.md]; the top standing is
  "Fool's Fortune" and the Arcana title is "the Fool Who Read the World". Canon by implication.
- Saggar on where she came from: "Even you, I shouldn't wonder. *Don't ask me how.*" (out of the kiln's belly). Canon, as a hint.
- Whom she couriers for, and what, is not said anywhere. **Open.**

### The clay folk (`src/npc/`)
All four are "clapperjars grown up and glazed", with a hat that says what they do (Design: folk.js, README). In the world they are
fired clay: "The clay forgets things, when it's fired twice." (Grog). Each speaks Clayese, bells and lid-clinks tuned to a scale of
their own [clayese.js].

| Folk | Title | Body | Voice | Temper | What they say about themselves and the world |
| --- | --- | --- | --- | --- | --- |
| **Mistress Saggar** | keeper of the kiln | celadon, an oxblood headscarf | West: the hexachord | calm; warm, proud, shouts about pots | Keeps the kiln; calls the clapperjars "my little ones"; had an "old master" who called Lachryma "the tears of the world"; afraid of prismatic chests. |
| **Pip** | apprentice potter | raw bisque ("not glazed yet, like its courage"), a cap | East: the Yo pentatonic | fear | Saggar's apprentice; hides from the clapperjars; "I want to be a potter. Potters aren't supposed to be afraid of pots." |
| **Old Grog** | angler of the Weir | tenmoku, a straw hat | East: the In pentatonic | sad; slow, kind | Has fished the pool since before the sand came; remembers the town; has seen something "bigger than the pier" in the water; "Maybe the town's coming back." |
| **Raku** | treasurer of the Weir | crackled white raku, copper lustre, a fez | West: the soft hexachord | sly; vain | Runs the Tithe for "a small fee"; loves cubes, hates prismatic chests; was "pulled out of the kiln red-hot and dropped in sawdust... It hurt a lot, actually." |

The folk are named after the potter's trade: a *saggar* is the clay box that shields a pot in the kiln, *grog* is fired clay crushed
and worked back into new clay (apt for one "fired twice"), *raku* is the firing Raku describes. Pip is the exception. (Observation,
not canon: is Pip meant to be a clay word too?)

### The old master
Saggar's teacher, who named Lachryma "the tears of the world". Nothing else is known. Canon (one line).

### Characters named only in the music
None beyond the four folk and the Courier. OST.md gives each folk a theme and the Courier hers.

## 4. Creatures

| Creature | What is known | Status |
| --- | --- | --- |
| **Clapperjar** | "A little clay figment with a lid for a mouth, full of Lachryma. They come out of the kiln warm and never quite cool." Clap at the Courier and run, steal and swallow baubles, nap, dance, mend cracked pots and wrecks with gold (kintsugi), cower behind pots. "They come back, mind. Clay always comes back." Some come out of the kiln as **raiders** (crimson) after the god hand's vessel; a jar the god hand has turned guards against them. | Canon [bestiary.js, talks.js] |
| **Slip jelly** | "A mind jelly: an egg of sloppy wet sand over a skirt of four toes, always melting... Something thinks in its middle." Lives in the dunes past the Weir; drinks, rests in palm shade, forages Lachryma, fishes, huddles, plays, mourns its burst kin and "remember[s] who did it". Its mind can be opened and written to. | Canon [bestiary.js] |
| **The fish of the Weir** | Ten "entities", each answering to an aspect (dread, wonder, grief, hunger, mirth): Pale Regret, Tin Mirth, Bellows Carp, Widow's Thread, Quiet Comet, Wonder Ray, Hollow Hunger, Lantern Dread, Mother Hush (she), **the Drowned Lachryma** ("What the workshop weeps, all in one place, given a shape it did not ask for. It has been waiting for someone with a mind worth borrowing."). | Canon [species.js] |

**Neuralese** is "the language a mind is written in": invented words of one or two syllables (SIVA to drink, LUNO to rest, STIL to
be still), learned by seeing a mind do the thing. Canon (the log and the Codex use it) [mind/functions.js].

## 5. Things and forces

### Lachryma
- Canon: "the tears of the world" (Saggar's master); "Black as a kiln at midnight, and every colour at once when the light finds it";
  "It isn't ours, you know. We only borrow it. The System counts every drop."; "what the workshop weeps" (clapperjars, the Drowned
  Lachryma); "The tide brings it up from somewhere deep" (Grog); it is in the oasis water ("That's the Lachryma in it").
- Too much in one place: the kiln makes clapperjars [Saggar]; chests go prismatic [Saggar, Raku]; the System warns of an "abnormal
  concentration" [voice.js].
- Forms: **baubles** (fresh, cream-coloured, oxidizing through amber to black), **liquid** (black, oil-film sheen: the Well),
  **cubes** (condensed; the currency). Design for the colours [README]; cubes are Canon.
- It is also what the Courier's mind spends: the Psygun "fires what the mind can spare" [tools examine]; the log speaks of
  absorbing and running out of lachryma. Canon.
- The Courier "absorbs" it; things that are taken apart "come undone into Lachryma". Canon [tracking.js].

### The System
- In the world it is known by name to the folk ("The System counts every drop"). Canon.
- It speaks rarely, flatly, beginning "Notice." or "Warning."; it grants skills, arts, titles and ranks ("You are now known as a
  Potter"), analyses creatures, and names the Pneuka Box. Canon [voice.js, achievements.js].
- Skills are "learned by doing", never bought. Design [README].
- What the System *is* (a god, a machine, the kiln, the world's bookkeeper) is not said. **Open.**

### The kiln and clay
- Clay comes back: "They grow back. Everything in here grows back." "Clay always comes back. That's the whole trouble with clay."
  Canon [talks.js]. Broken pots and jars return; mended pots are "worth more than [they were]" (the Magician). Canon.

### The tools
| Tool | Examine (Canon) | More (Design) |
| --- | --- | --- |
| The Psygun | "A hand-cannon that fires what the mind can spare." | its special rounds are *shells* (Cleave, Push, Well, Mark, Bomb, Bank, Seek, Slip, Groove, Anchor, Hatch), refilled at *reliquaries* |
| The Sondelass | "A telescoping thing of brass and line: cutlass, rod or grapnel." | psychic fishing: the *sounding*, the *aspect*, the lure as her mind projected |
| The Soul Brush | "A great brush for writing on the world in slip." | the Celestial Brush (time stops, the world becomes paper); writes properties, "alters things rather than hurting them" |
| The Veritome | "A book that sees what is true, with a lens in its spine." | Veritas + tome; "reads the world, it does not rewrite it"; the Book of cards (Greed Island ranks SS to H) |
| The Dreamvane | "A dowsing crook that leans toward Lachryma, with a tuning fork in its heel." | not built |
| The Crucibelle | "A smoking bell that takes what is played into it and makes it more." | not built |
| The Lockheart | "A little coffin on a chain that drinks the Lachryma you cannot hold." | not built |

### The god hand and God Arts
"You take the hand." The Courier becomes a Pneuka jar (the *vessel*); a hand works the world from above with **God Arts**
(telekinesis, sunder, swell, wring, manifest), only on ground she has explored. The vessel can be shattered and is "reforged" with
gold seams. The bestiary calls it "the god hand's vessel". Canon (log, bestiary) / Design (the rest).

### Treasure
- Chests in five tiers: common, fine, rare, epic, **prismatic** (black glass, oil film: Lachryma's own look). Canon.
- **Curios**: twenty, found in chests, almost all of the sea: Whistling Whelk, Sailor's Salt-Shaker, Knotted Keepsake, Barnacle
  Button, Glass Gull, Current Compass, Brass Bosun's Bell, Sea-glass Sconce, Pier Pearl, Astral Astrolabe, Ammonite Almanac ("keeps
  the tides of a sea that went away"), Anchor Amulet, Gilded Gull-Skull, Reed Regalia, Hourglass of High Tide, Storm in a Stoppered
  Jar, Lachryma Lodestone, Oil-Slick Orb, Blacklight Bloom, Kaleidoscope Koi. Canon [treasure.js].
- **Lures**: Clay Bob, Black Eye, Star Fly, Tear Bead ("Fired from the clay of a broken jar that someone kept anyway."), Ember
  Spoon, Tin Chime. Canon [lures.js].

### Standings and titles
Standings, "named in the manner of the studio's own trade": Sweeper, Apprentice, Journeyman, Potter, Master Potter, Kiln Warden,
Fool's Fortune. Canon (the log and the System say them) [achievements.js].

### The two languages (East and West)
Design only, from the music: "The two languages (the two worlds of the game)": the EAST (Japanese pentatonics: shakuhachi, koto,
taiko, the folk's bells) and the WEST (Guido's hexachords: strings, brass, harmonica, piano, guitar), meeting on five shared notes.
Pip and Grog speak East; Saggar and Raku speak West. [OST.md, clayese.js] What the two worlds *are* is not said. **Open.**

## 6. Names and spellings (the glossary)

| Write | Not | Note |
| --- | --- | --- |
| Lachryma (capital L in prose) | Lacrima, Lachrima | the log lowercases it in "You absorb 12 lachryma." (see contradictions) |
| Lachrimeter | | the HUD gauge; spelled with an *i*, unlike Lachryma (see contradictions) |
| clapperjar (one word, lower case) | clapper jar | |
| slip jelly, slip jellies | | |
| the Courier | | capital C; she |
| Mistress Saggar / Saggar; Pip; Old Grog / Grog; Raku | | |
| the Weir, the Well, the Tally, the Tithe, the Spire, the Siege | | capitalised as places |
| the System | | capital S |
| the Veritome, the Book, the Codex, the Compendium | | |
| the Pneuka Box, a Pneuka jar | | |
| the Sondelass, the Soul Brush, the Psygun, the Dreamvane, the Crucibelle, the Lockheart | | the belt's tools take "the" |
| God Arts, Movement Arts | | |
| neuralese (lower case) | | its words in capitals: SIVA, LUNO, STIL |
| the Drowned Lachryma | | |

## 7. Contradictions found

Ranked by how much they matter.

1. **What "the workshop" is.** In places it is one room, Saggar's, with the dunes "far below the workshop". Elsewhere it is the
   whole world: clapperjars are full of "what the workshop weeps"; the Drowned Lachryma, caught in the dunes, leaves "the workshop
   a little quieter"; the bestiary describes "the creatures of the workshop" (including the dunes' jellies); the Arcana are "truths
   of the workshop". The curios likewise speak of "the room" (a sky "not above this room", a koi that "swims in the air of the room
   it was found in"). Either the world *is* a workshop (a studio, a room, with a painted sky), or the word is being used loosely.
2. **Where Lachryma comes from.** Four answers that may or may not be one: the tears of the world (Saggar's master); what the
   workshop weeps (bestiary, Drowned Lachryma); brought up by the tide "from somewhere deep" (Grog); what the mind can spare (the
   Psygun, the log's MP). And it "isn't ours... we only borrow it", which raises whose it is.
3. **Folk pronouns.** The OST gives Pip and Raku "his"; `people.js` gives Pip "its courage"; `folk.js` and the README call every
   folk "it". The talks avoid pronouns for the folk. Saggar is "Mistress", Mother Hush is "she", the kiln is "her".
4. **Are the folk grown-up clapperjars?** The maker's notes say so (folk.js, README). In the world Saggar calls clapperjars
   "figments" the kiln makes and "my little ones"; Pip is frightened of them; no folk says they were once one. If it is true it is a
   big reveal, and it should be decided before anyone writes a line that touches it.
5. **Prismatic chests.** Saggar says chests go prismatic "when there's too much [Lachryma] in one place", and the System's warning
   agrees; but at the Tithe a prismatic chest is a 0.5% roll on a sealed chest. Reconcilable (the roll *is* a concentration), but
   the text should be told which.
6. **The colour of Lachryma.** Saggar: "Black as a kiln at midnight". The baubles that the Courier sees most are cream, darkening to
   black only as they oxidize. Not a real clash once explained, but no line in the world explains it.
7. **Spelling.** *Lachryma* everywhere, but the HUD gauge is the *Lachrimeter*. And the log writes "lachryma" lower case where every
   other line capitalises it. (Strings are mine to fix; I have not changed them until the owner rules.)
8. **The Drowned Lachryma's sex.** The blurb says "it"; the hidden achievement's title is "Drowned King".
9. **Clapperjars' return.** Pip speaks of jars "sent back to the kiln"; the log and the zandatsu have them "come undone into
   Lachryma". Both can be true (Lachryma back to the kiln, and out again), but it is not said.

## 8. Open questions for the owner

The ones that block the most writing come first.

1. **What is the world?** Is it literally a workshop, a room (or a kiln, or a jar) with a painted sky and a sea that went away under
   the sand; or an ordinary world where "the workshop" is just Saggar's place? (Contradiction 1, the Star and the Moon, the curios.)
2. **Who is the Courier?** Where does she come from (Saggar hints: out of the kiln), what does she carry and for whom, why the mask,
   and why is she "the Fool"? Is she clay?
3. **What is Lachryma, and whose is it?** One substance with one origin (the world's tears), or several things sharing a name? Who
   is it borrowed from, and what does the Tithe pay into?
4. **What is the System?** An in-world power the folk know and fear a little, an isekai interface, the kiln's own mind, something
   else? Does anyone talk *to* it?
5. **Who is the god hand?** The player, the Courier's own mind outside her body, a god of the workshop? Is the Pneuka jar her true
   form?
6. **The two worlds of East and West.** The music names them as the game's two worlds. Are they places (two lands, or the workshop
   and the dunes), peoples (folk of the East and the West), or only a musical idea?
7. **The town that was, and the sand.** What happened to Grog's town, and when did the sand come? Is the sea of the curios the same
   sea that the dunes buried?
8. **The folk as grown clapperjars**: canon, a secret to reveal later, or only how the model is built?
9. **Folk pronouns**: he / she / they / it? (Pending a ruling, I write around them, as the talks do.)
10. **The Spire** with its beam of light: is it a destination with a meaning, and may the folk speak of it?
11. **Pip's name**: chosen for a reason (a clay word, a seed, a small thing) or just a good apprentice's name?
12. **Saggar's old master**: someone to build on, or a passing line?
13. **The Tarot and the five**: is the Major Arcana an in-world tradition the folk know, or the Courier's private way of reading the
    world? Does anyone besides the music care about the number five?

## 9. Where the words live (for writers)

| Words | File | Owner of the code |
| --- | --- | --- |
| The folk's lines | `src/npc/talks.js` | Espada |
| The folk's names, titles, glazes | `src/npc/people.js` | Petra (strings: Espada) |
| The log's phrasing | `src/tracking.js` | Petra (strings: Espada) |
| The System's lines | `src/system/voice.js` | Wanda (strings: Espada) |
| Arcana names, hints, lore | `src/veritome/arcana.js` | Petra (strings: Espada) |
| Bestiary blurbs and facts | `src/veritome/bestiary.js` | Petra (strings: Espada) |
| Fish names and blurbs, aspects | `src/angling/species.js` | Petra (strings: Espada) |
| Curios and chest tiers | `src/treasure.js` | Petra (strings: Espada) |
| Lures | `src/angling/lures.js` | Petra (strings: Espada) |
| Tool examines | `src/pneuka/items.js` | Petra (strings: Espada) |
| Achievements, standings, titles | `src/achievements.js` | Petra (strings: Espada) |
| Neuralese words | `src/mind/functions.js` | Petra (strings: Espada) |
| Character themes | `docs/OST.md` | Wanda |
