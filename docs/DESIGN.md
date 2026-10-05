# The design bible

What play is worth and where it leads: the loops at each scale, what every tool, place and creature is for in them, the progression,
the economy, the ledger and the achievements, and an honest audit of where they stand. Kept by Dovina (Game Design Systems). The
economy's own map and numbers are in `docs/ECONOMY.md` and are not repeated here; the lore is `docs/LORE.md`; how the creatures think
is `docs/AI.md`. Numbers quoted are from the code as of R41 (commit `44e7c58`), measured where it says so.

Every number in a system file answers to a reason. Where one does not yet, this page says so (section 7).

## Contents

1. The player's goal at each scale
2. What each thing is for
3. Progression
4. The economy, in brief
5. The ledger and the achievements
6. Prior art this design stands on
7. The audit: what works, what is missing, what contradicts, what has no reason
8. The proposal for the next rounds

---

## 1. The player's goal at each scale

A systems designer asks what the player wants in the next thirty seconds, in this session, and over the weeks. Each answer should be
something the player can name, and each scale should feed the one above it. Here is what the game offers at each scale today, and
what it should offer.

### The moment (seconds to a minute)

**What it is now.** The core movement is the gold standard and the heart of the game: sprint, slide, wallrun, mantle and dash, and
the Movement Arts on top of them. Every tool is a verb with a feel of its own:
- a shot, a charge, a caster shell;
- a cutlass combo, a cast and its fight;
- a brush stroke;
- a photograph held in the capture circle;
- a strike on a crystal that sounds sharp, flat or pure;
- a note on the beat;
- a hoover, and an opening.

**What it rewards.** Each verb has a readable outcome in the world: a pot shatters, a jar is clapped, a fish bites, a formation rings
true. The log writes the sentence.

**Verdict.** Strong. This is the layer the project has spent forty rounds on, and it shows.

### The session (ten minutes to an hour)

What it is now: a sandbox of rooms, each with its own small loop.
- **The Weir:**
  - fish and sell the catch to Old Grog;
  - open the treasury chests as they come back;
  - pay the Tithe.
- **The dunes:**
  - mine the formations by ear;
  - burst jellies;
  - skiff.
- **The workshop:**
  - break pots;
  - run the gong trial;
  - fire a look at the kiln.
- **The basement:**
  - the movement lab's stations, where the arts are learned;
  - three lap circuits;
  - THE COURSE;
  - THE SIEGE.

What a session has no answer to yet: "what am I working toward tonight?" There are many small loops and nothing yet ties them into a
session's goal. Some pieces exist:
- an art's progress bar in the Codex;
- a curio missing from the shelf;
- a glaze not yet earned;
- a medal not yet gold.

None of them is put in front of the player. In STORY (the all-arts switch off) the arts are learned by doing, but every tool, room and shop is open
from the first minute, so the session has breadth and no direction.

### The long run (days and weeks)

What it is now:
- the achievements: 366 entries, six tiers, about 950 points, and a standing from Sweeper to Fool's Fortune;
- the collections: twenty curios, 54 cards in the Book, the bestiary's facts, twelve glazes;
- the circuits' medals and records;
- the variants of every art.

The long sink (the Internal Shrine Garden) is planned, not built. **Progress resets on every build** (`src/core/progress.js`). While the
game is being made, the long run can be designed and measured (the ledger timestamps every first) but not lived.

---

## 2. What each thing is for

A thing earns its place by feeding a loop. The tables below say which loop each feeds and what it takes in and gives out. "Faucet"
means cubes into the world, "drain" cubes out, and "converter" one resource into another (Machinations' terms, `docs/ECONOMY.md`).

### The tools (the belt: seven tools, five places to wear them)

| Tool | The moment | The session | Takes | Gives |
|---|---|---|---|---|
| **Psygun** (X) | shoot, charge, load caster shells | break pots, clap jars, burst jellies | Lachryma (shot 4, charge 24); shells from reliquaries | baubles (Lachryma), jelly cubes, the break ledger |
| **Sondelass** (Q) | cutlass, rod, grapnel; zandatsu on the stunned | angling at the Weir; the zandatsu harvest | Lachryma (cast 10, stinger 6, blade 4/s) | fish (sold: a faucet), cores (cubes) |
| **Soul Brush** (G) | the club, the slide, drawings, sigils | traversal and puzzle; befriending jars | Lachryma, ink | mended pots, friendly jars |
| **Veritome** (J) | the lens, the Flash, reprogramming | the photographer's round; the darkroom | film (a converter: cubes to plates) | cards (the collection), bestiary facts, glazes, cubes by condensing |
| **Dreamvane** (K) | dowse, pick, fork, survey | the miner's round in the dunes | Lachryma (survey 12) | crystal cubes (the biggest faucet), shards, Possibilikeys, the map |
| **Crucibelle** (U) | notes on the beat, songs | support in a fight; reveals veiled crystal | Lachryma (8 to 24 a song) | sleep, decoys, spirits, sight |
| **Lockheart** (I) | hoover, open: the ultimate | the gamble at the end of a fight | Lachryma overflow, a Possibilikey | anything from a dud to a slip nuke (table: `src/tools/lockheart/table.js`) |
| **God hand** (~, not on the belt) | the God Arts | THE SIEGE | Lachryma | defence of the vessel |

**Lachryma** is the moment's resource: a pool of 100 that regenerates at 3.5/s after 2.2 s, and the shield. **Cubes** are the
session's resource. The two meet in only two places: the Lockheart (Lachryma in, cubes or chests out) and the crystals (a strike
gives both). That split is good design and should be kept. It is FFXIV's MP against gil, or Zelda's magic meter against rupees: the
moment's meter refills, so the player spends it freely, and the session's purse does not.

### The places

| Place | Its loop | Pays |
|---|---|---|
| The workshop | pots, jars, the gong trial, the kiln | baubles; the trial pays a medal and a record only |
| The basement hub, the lab, THE COURSE | learning the arts at their stations | arts and variants; records |
| The lap circuits (Braid, Mill Race, Spindle) | mastery by time | medals, records, achievements; no cubes |
| THE SIEGE | the god hand's defence | shells and a little mending per wave; no cubes |
| The dunes | mining by ear, jellies, skiffing | the miner's cubes, shards, keys; jelly cubes |
| The Weir | angling, the treasury, the Tithe, both shops | fish to sell, chests, curios; the main drains |

### The creatures

- **Clapperjars** are the fodder and a source of Lachryma: 6 baubles each, and they grow fatter on baubles left lying.
- **Slip jellies** are the only thinking opponents. They are where the fighter earns (6 cubes a burst, 3 a core) and where the
  stun, the Flash, zandatsu and reprogramming are learned.
- **Fish** are the angler's living, in ten species over five tiers.
- **Spirits** are allies from the Call song and the Lockheart.

The bestiary turns each of them into a collection as well (Pokémon Snap, Monster Hunter's notes).

### The folk

- **Raku** runs the treasury and is the main drain. He sells keys and coffins at 1.45× worth, and he haggles.
- **Old Grog** is the angler's market: he buys fish and sells film and lures at their worth.
- **Saggar** keeps the kiln, which is a station, not a shop yet.
- **Pip** is in the hub and has no shop yet.

---

## 3. Progression

The game has **no experience points and no levels**, and that is a decision worth keeping. Everything is learned by doing (Tony Hawk's
goal lists, Breath of the Wild's discovery, OSRS's quest-locked unlocks), and power grows sideways, not up: the Lachryma pool never
grows (`maxBonus` exists and nothing uses it).

**The System's arts** (`src/progress/skills.js`) are eight Movement Arts and five God Arts. Each has one to three variants, and each is
earned by a goal over the event bus:
- `count`: do it n times;
- `feat`: do the hard thing once;
- `sum`: add up a distance or a time;
- `chain`: a then b, quickly.

The goals teach. Blink comes to those who air-dash; Sunder to those who slice pots. A variant only overlays its art's tuning, so the
core movement is never touched. The all-arts switch (`system.lendAll`: every art lent, nothing counted) is on in DEBUG and off in STORY.

**The tools** are not a progression yet. A new Courier wears five and carries the other two in the box from the first minute
(`src/main.js`, the seed in `src/pneuka/box.js`). The **Pneuka Box** (28 slots, stacks to 99) and the **Book** (54 cards, 20 free slots) are
capacity, not progression: nothing grows them.

**The kiln and the glazes.** There are twelve glazes:
- three from the start;
- nine given by achievements (retroactive, as they should be);
- up to eight learned from photographs.

Firing a look costs 16 cubes, and mending cracks up to 12. Buying a glaze (planned at about 15 minutes' play) is not built.

**Chests.** There are five tiers, from three sources:
- the Weir's treasury plinths, which shut again for 4 minutes (common) up to 2 h 40 (prismatic);
- the Tithe (48 cubes a pull: published odds and three pity counters);
- a few one-off chests (the hub, the dunes, the legendary fish, the Lockheart's CHEST).

Twenty curios hang off them, four to a tier.

**The Lockheart.** Fill it with Lachryma (the overflow, hoovering, a shard), put up to four Possibilikeys on its ring, and open it.
Three coffins give three tables, and seven keys bend the odds. It is the game's gacha made a weapon, and the one place where luck
reaches the moment.

**The standing.** Achievement points buy a rank, from Sweeper (0) up to Fool's Fortune (340), with titles as rewards (FFXIV).

---

## 4. The economy, in brief

`docs/ECONOMY.md` has the map, the profiles, the R38 rebalance and its reasons; `src/progress/econ/table.js` has every number. In short:
- **The unit is a minute of ordinary play:** 8 cubes, so the aim is 480 an hour. Every price is named in minutes.
- **No activity should pay more than 1.5× the aim**, except luck.
- **The faucets:** jellies, crystals, chests, dupes, condensing, selling to the folk, and the Lockheart's CUBES outcome.
- **The drains:**
  - the Tithe;
  - the shops;
  - the kiln (firing and mending);
  - later, the Shrine Garden (the long sink: OSRS's Construction, FFXIV's housing).
- **The measuring tools:**
  - the F3 panel's `econ` line, which reads the ledger;
  - `node scripts/economy.mjs`, which simulates the table;
  - `/grant`, in DEBUG.

`node scripts/economy.mjs` today:

| profile | cubes/h | × aim |
|---|---:|---:|
| fighter | 608 | 1.27 |
| miner | 834 | **1.74** |
| photographer (after film) | 310 | 0.65 |
| angler | 475 | 0.99 |
| treasury camper | 586 | 1.22 |

The Tithe returns 78% of what it takes, in cubes.

---

## 5. The ledger and the achievements

**The ledger** (`src/progress/stats.js`) follows OSRS and FFXIV. It keeps:
- counters that only go up, kept for the lifetime and for the session;
- records, each with when and where it was set;
- firsts, timestamped in play time;
- `done` for the achievements.

`src/feedback/tracking.js` turns about 260 kinds of event into counts and log lines. This is the game's best piece of systems architecture: every
question about play can be answered from it, and the achievements are retroactive by construction.

**The achievements** (`src/progress/achievements.js`):
- 366 entries in 14 categories;
- by tier: 67 Easy, 108 Medium, 100 Hard, 50 Elite, 28 Master, 4 Grandmaster (counted from the source);
- six types: count, speed, perfection, mechanic, stamina, collection;
- hidden entries, titles, and a standing.

Every ledger key an achievement reads is fed somewhere (checked: each key or its prefix is incremented in `src/`). They are
placeholders until STORY exists, and they reset with every build.

---

## 6. Prior art this design stands on

What is already taken, and from where (the module headers have the detail):
- **OSRS:**
  - the inventory and the bank kept apart;
  - shops with stock and restock;
  - the collection log;
  - the achievement tiers and types;
  - hiscores;
  - the money-making guide as a profile table.
- **FFXIV:** achievement categories and titles; glamour and housing as the sinks a player chooses; MP and gil kept apart.
- **Machinations** (Dormans and Adams): sources, drains and converters.
- **The gacha:** published odds, pity counters, dupe protection (Genshin, Fire Emblem Heroes).
- **Slay the Spire and Balatro:** modifiers stacked in order on one roll (the Possibilikeys).
- **Pokémon Snap, Fatal Frame, Dark Cloud 2:** the camera as a collection and a source of ideas.
- **Tony Hawk and Breath of the Wild:** skills learned by doing.

What this page adds, for the proposals in section 8:
- **Consolidated odds** (China's 2017 loot-box disclosure rule, and Genshin's published "consolidated probability" that counts pity):
  publish the rate a player will actually see, not the base weight.
- **Collection curves** (OSRS's collection-log design and Hearthstone's duplicate protection): a set should take longer to finish
  the rarer it is.
- **The tool-gated spine** (Zelda's item per dungeon, Metroid's gates, OSRS's quest unlocks): what the session is for, early on.
- **Funnel metrics from firsts**: what live games measure as "time to first X" (the drop-off funnel). The ledger's timestamped firsts
  are that funnel already.
- **OSRS's birdhouse and farming runs:** timed passive income, designed as an add-on to other play, and counted as such.
- **Mario Kart's cups and Tony Hawk's gaps list:** mastery rewarded in standing and cosmetics, never in currency that can be farmed.

---

## 7. The audit

### What works

- **One table, one unit.** Every price is named in minutes of play, in one file, with a simulator and a live panel reading the same
  numbers. Most games reach this only after their economy has broken once. This one has broken once (R38) and been fixed.
- **The ledger as the single source of truth.** Retroactive achievements, glazes earned from achievements (and so retroactive too),
  a timestamped first for everything, and the F3 economy line, all read from one place.
- **Lachryma and cubes kept apart.** The moment's meter and the session's purse are two resources with one converter between them.
- **Skills learned by doing, with goals that teach.** No XP. Variants that only overlay tuning, so the gold standard is safe.
- **Luck with an honest face.** The odds are published, pity is shown as lamps, the near miss is staged, and dupes are protected
  (85% of curio draws go to what you lack).

### What is broken (bugs in Dovina's files)

*Phase A (`docs/plans/SYSTEMS.md`) fixes 1 to 3, the Gambler's Lockheart, and the curio curve; the simulator prints each before and after.*

1. **Six achievement ids are used twice.** `fl1`, `fl2` and `fl3` are each both a fall record (MOVEMENT) and a Reprogramming entry
   (BATTLE); `sp1`, `sp2` and `sp3` are each both a speed record and a counter at the shops. `ledger.done` is keyed by id, so
   whichever completes first completes its twin silently.
   - Reaching 16 m/s marks *Fishmonger* done and grants **tenmoku**, which is meant for selling fish.
   - Reaching 22 m/s grants **raku**, which is meant for haggling Raku down.

   The fix is a rename, plus a uniqueness check the stress test can run.
2. **The published odds are not the odds.** The Codex shows 0.5% prismatic and 10.5% rare. Measured over a million pulls with pity,
   the rates are:

   | tier | common | fine | rare | epic | prismatic |
   |---|---:|---:|---:|---:|---:|
   | measured rate | 56.5% | 24.5% | 13.8% | 3.8% | 1.3% |

   One rule is not published at all: the epic pity has a 12% chance of a prismatic. The player is treated better than they are told,
   but the published table should be the true one.
3. **The Tithe is counted twice.** `tithe.pulls` (in `src/world/treasure/chests.js`) and `tithe.count` (in `src/feedback/tracking.js`) count the same pull. The
   CURIOS shelf reads one and the achievements read the other.

### What contradicts

- **The Gambler's Lockheart is not a gamble.**
  - The INVERTED key sets each weight to `hi + lo − w`. On a two-outcome table that is a swap, so dud 99 / nuke 1 becomes
    **dud 1 / nuke 99**.
  - The starting kit already holds the Gambler's coffin and an Inverted key (`box.seed`), so a new Courier's first opening can be a
    slip nuke at no cost.
  - After that, a nuke costs one Inverted key from Raku: 70 cubes, about nine minutes' play.
  - The EVEN key gives 50%. On the plain coffin, INVERTED raises the nuke to 27%.

  The fiction ("Almost always nothing. Almost.") and the numbers disagree.
- **The curio collection runs backwards.** Common chests carry a curio 6% of the time, so the four common curios take longer to
  complete than the rare ones. Measured through the Tithe, with dupe protection, median pulls to complete each set:

  | set | median pulls |
  |---|---:|
  | common | 118 |
  | fine | 99 |
  | rare | **68** |
  | epic | 133 |
  | prismatic | 321 |

  All twenty take a median 323 pulls, about 10 hours of play net of what comes back. The cheapest set to complete should not be the
  third tier.
- **Faucets in the same place stack.** The treasury's plinths stand at the Weir, beside the angler's water.
  - Fishing (475/h) plus opening the plinths as they come back (586/h) is about **1,060 an hour, 2.2× the aim**.
  - That is more than the miner, and the profiles never add the two together.

  OSRS designs this on purpose (the birdhouse run): the simulator should count it as a mixed profile and the table should decide
  whether 2.2× is meant.
- **The miner earns 1.74× the aim**, over the 1.5× cap ECONOMY.md sets, with ear-tuning that assumes a 40% find rate on dense
  formations. This is either a measured skill premium (then say so) or a rate to bring down.
- **The mastery rooms pay nothing but standing.** The trial, the Course, the circuits and the Siege give medals and records only.
  - That is right for currency: a mastery reward in cubes becomes a farm.
  - But nothing, not even a glaze or a title, says a gold medal mattered.
- **Small ones.**
  - The `src/world/treasure/chests.js` header still says the Tithe costs 25.
  - The `src/tools/lockheart/table.js` header says three keys; it is four.
  - The fish rank G is never used.
  - Lockheart chests are never cleared away.
  - `card.drift` from time is a dead branch in `src/feedback/tracking.js`.
  - The achievements write their own log lines (`achievements.js announce`) rather than through a rule in `tracking.js`, and the
    `achievement` event carries no `by`.

### What is missing

- **A session goal, and STORY.** STORY plays the DEBUG sandbox with the arts locked. Every tool, room and shop is open from the first
  minute, so nothing yet says what tonight is for.
- **The long sink.** The Shrine Garden, and the shop way to a glaze. Today the steady drains are keys (consumed at each opening), the
  Tithe, film and the kiln. Raku's whole shelf empties for about 1,320 cubes (2¾ hours' play) and restocks.
- **Measurement of pace.** Nobody has measured how long a new player takes to earn their first art, first fish, first curio or first
  gold medal. The ledger's firsts already hold the answer; nothing reads it out.

### Numbers with no reason yet

None of these is necessarily wrong. Each needs a sentence saying why it is what it is, or a measurement that sets it.
- The 12% prismatic at epic pity.
- The 85% bias toward unowned curios.
- The 42% near-miss rate and its 25% second step.
- The curio chances (6 / 16 / 40 / 80 / 100%).
- The chest cube ranges.
- The condense ladder below SS.
- The 1.6 in the Lockheart's chest tier.
- The coffins' fills (40 / 30 / 50).
- The keys' prices relative to what they change.
- The standing thresholds: Fool's Fortune at 340 of about 950 points.

---

## 8. The proposal for the next rounds

These are the five changes that would most improve the game as a game, in the order I would do them. None is made yet: the owner
chooses.

**Ruled (the owner, 2026-10-04):** 1, 2, 3 and 5 go ahead, in that order. 4 is on hold with STORY itself: STORY is taken off the title
menu until further notice, while the tools' identities are settled (below). No content push until then.

### 1. Make the numbers true (one round, small)

**The change.**
- Rename the six duplicate achievement ids, and add a check, run by the stress test, that ids are unique.
- Publish the consolidated Tithe odds, pity counted, in the Codex.
- Count the Tithe in one ledger key.
- Fix the stale headers.
- Extend `scripts/economy.mjs` with four new sections:
  - mixed profiles (angler plus treasury, miner plus jellies);
  - the Lockheart's expected value per opening, by coffin and keys;
  - the curio completion curve;
  - the achievement points by tier.

**Why.** A designer cannot tune what the tools misreport. The tenmoku and raku glazes are being handed out for the wrong deeds today.

**How it is measured.** The simulator prints every number quoted in section 7, so each later change shows a before and an after.

### 2. Balance the Lockheart's luck (one round)

**The change.**
- INVERTED and EVEN cannot lift a jackpot above a ceiling (say 25%). Alternatively, the Gambler's coffin is *warded*: its odds
  cannot be turned, only LOADED.
- The Gambler's and Shepherd's coffins leave the starting kit, to be bought or found.
- The keys are priced by what they change: a key worth more nukes costs more.

**Why.** The Lockheart is the game's ultimate and its gacha. A jackpot that a starting key buys at 99% stops being a jackpot. Balatro
and Slay the Spire let modifiers stack, but they price the strong combinations by rarity, not by a shop shelf.

**How it is measured.** The Lockheart section of the simulator gives nukes per hour of play and cubes-equivalent per opening for
each coffin and key set. The aim is a jackpot that comes to a committed player about once a session, not once a key.

### 3. Turn the curio curve the right way up (half a round)

**The change.** Set the curio chances so that a set takes longer to finish the rarer it is. For example, aim for a median of about 20
pulls for the commons, 40 for fine, 80 for rare, 150 for epic and 300 for prismatic. Then name the 85% dupe bias as a deliberate
rule, or replace it with a **spark** (Genshin's Epitomized Path, FEH's spark): a missing curio of your choice after N dupes in a tier.

**Why.** A collection is the long run's backbone (OSRS's collection log). Its first slots should fill in the first hour and its last
ones should be the story the player tells.

**How it is measured.** The curio curve section of the simulator, and the ledger's `curio.` firsts in play.

### 4. A spine for STORY's first hours (on hold, with STORY)

**The change.** A first-session ladder the player can name at each step.
- **The belt fills.** The Courier starts with the psygun and the Veritome. Each other tool is given by one of the folk for a task in
  their room:
  - Grog gives the Sondelass;
  - Saggar gives the Soul Brush, at the kiln;
  - Raku gives the Lockheart, at the Tithe;
  - Pip gives the Dreamvane, in the hub;
  - the Crucibelle comes later.
  
  This is Zelda's item per dungeon and OSRS's quest unlocks.
- **The arts are learned in STORY as now.** The Codex shows "next" first.
- **Each room is opened by what it needs.** The dunes open once the Dreamvane is had; the Weir's Tithe once the first chest is
  opened.

Petra owns the rooms and the tools, and Espada the words. This proposal is the order and the reasons, and it is a document first.

**Why.** Today a new Courier has seven tools and six rooms at once and no reason to pick one. A spine gives the session its goal and
lets each tool be learned alone, the way the owner already tests a tool with every other one taken off.

**How it is measured.** A **funnel** read from the ledger's firsts: play time at the first art, first fish, first sale, first chest,
first Tithe, first opening and first medal. It goes on the F3 panel beside the econ line and in F4's report. The aim is a new thing
every five to ten minutes in the first hour, with no gap longer than fifteen.

### 5. Mastery that is worth something, never in cubes (half a round)

**The change.** Gold on a circuit or the trial, a full Siege and a Course record each earn a **glaze or a title**, predicates over the
ledger as the glazes already are. The kiln's shop glazes (about 15 minutes' play each, as ECONOMY.md planned) become the cube sink
beside them. The two are kept apart: what is bought is never what is earned.

**Why.** Mastery rooms must not become farms (no cubes), but a medal with no consequence reads as a medal no one asked for. Mario
Kart's cups and Tony Hawk's gaps list reward mastery with standing and looks. FFXIV keeps bought glamour and earned glamour apart.

**How it is measured.** The ledger's medal firsts against the session count (do players come back for gold?), and the kiln's
`cube.use.kiln` share of the drains on the F3 line.

---

*Later, once STORY has its spine: the Shrine Garden as the long sink (OSRS's Construction, FFXIV's housing, Animal Crossing's home
rating), priced so that a committed player's surplus goes there for weeks.*

---

## 9. The pillar: every tool teaches a real skill (in discussion)

The owner's thesis (2026-10-04): Fool's Fortune distils every genre, and each Lachryma tool teaches a skill that works outside the game.
It is not a treadmill that only takes time. The Dreamvane is the model: a strike is judged against a reference tone, so mining by ear
trains relative pitch. The rule this page holds every tool to is: **the skill is the verb**. The player gets better at the game by
getting better at the real thing, and no number may do the skill for them. Prior art: *Rhythm Heaven* and *The Typing of the Dead* (the
skill is the game), *Brain Age* and Gran Turismo's licences (a measured skill as the score). The cautionary tale is the "brain-training"
genre, whose transfer claims did not hold up (the FTC's 2016 ruling on Lumosity). So the game teaches by play, and never says it is
teaching.

| Tool | The skill | Status |
|---|---|---|
| Psygun | aim; dynamic visual acuity | ruled |
| Veritome | typing (reprogramming), reading behaviour, patience for the shot | ruled |
| Dreamvane | relative pitch; with the Veritome, spatial mapping (cartography) | ruled |
| Crucibelle | tempo and melody: ten notes, 1–5 the lower register and 6–0 the upper, in the pentatonic of the music playing; every note has a colour as well as a sound. No chords (keyboard rollover). | ruled |
| Sondelass | the platformer's movement tech: timing and momentum (the line's tension, the grapple's swing, the parry window) | ruled |
| Soul Brush | shapes | ruled |
| Lockheart | odds and expected value | ruled |

**The Lockheart becomes the magic system (ruled in outline, 2026-10-04).** The coffin worn sets its mode:
- **Casting**: the wheel of outcomes as it is now.
- **Summoning**: catch a critically stunned Figment. Catching is a third choice on a stunned creature, beside zandatsu and reprogramming.
  The wheel moves to the catch: the catch rate is the wheel, set by how cleanly the creature was stunned, and Possibilikeys augment it.
  A key burned on a summon's release adds an effect. With several Figments inside, which one comes out is a gamble.
- **Conversion**: liquid Lachryma (baubles) into solid (cubes); the keys set the risk and the yield.

**Achievements are the main way skills are unlocked** (the owner's standing rule). Cosmetics are rewards for achievements, in quantity
(the owner hunts glamour; FFXIV, GW2).

**Soul Alchemy** (in the Shrine Garden) carries colour theory: fodder materials and curios have a hue and a saturation, and a spirit
press (hopper, igniter, crucible: the owner's concept art) presses them to change the Courier's characteristics.

**Still to define:** five damage types; a full suite of emotional statuses and what each does; the six (+1) domains, mostly for the
god hand. The RPG layer (abilities, numbers) is not decided. The constraint it must meet: a number may widen what the player can do,
never do the skill for them.

---

## 10. Mined from the design document v0.1 (the owner's, given 2026-10-04)

The v0.1 document describes a different game: real-time grid tactics, with a party of Contractors run by FFXII-style Gambits, a Ship
for a hub and Bounties. Its systems are mined here; its combat model is not. Each item is marked **keep** (fits as written), **adapt**
(fits once changed to this game), **hold** (later, or the owner's call) or **cut** (contradicts a rule of this game).

**Damage and states**
- **Five damage types on a Law–Chaos line** (keep): Impact (lawful, physical), Ego (lawful, mental), Influence (neutral, social),
  Illusion (chaotic, perceptual), Delirium (chaotic, entropic). Two strong ideas come with them:
  - **Annihilation**: Impact and Delirium, the two ends, amplify each other on a target already afflicted by the other.
  - **The status a type builds**: enough of one type applies its status (Impact: stun, slow, armour break; Ego: doubt, pacified;
    Influence: charm or taunt, misdirect; Illusion: blind, phantom pain; Delirium: confusion, reality tear).

  *Adapt*: in an action game the type must be read off the tool in hand, so each tool deals a type (a proposal to settle). Two
  repairs are needed:
  - The trump list is lopsided: nothing beats Impact or Delirium, and Ego loses to two types. It is to be made a closed cycle.
  - "Delirium scales with all attributes plus Luck" fits the Lockheart.
- **Mental state, Stoic → Resolved → Balanced → Fluid → Prismatic** (keep): how open a creature is to statuses (and to buffs). It is
  the lore's solid–liquid motif as a number, and it already names the chest tier. It is the base for the emotional statuses.
- **Emotional Output (EmO)** (keep, central): a Figment's agitation rises as it is fought. Its Lachryma yield peaks in an optimal band;
  past the band it enrages, and Soothe lowers it. This is the bridge to catching and conversion: catch or harvest in the band.

**Progression**
- **The six (+1) domains** (ruled, 2026-10-04): Ouranurgy (displacement), Manifestation, Divination, Psychokinesis, Possession and
  Alteration, and **Spellscription** as the +1. Spellscription is the newer name for Spellcasting: transcribing a thing down, so it
  covers the Soul Brush's glyphs and the Veritome's macros. The god hand's arts already map onto them: Telekinesis to Psychokinesis,
  Manifest to Manifestation, Swell and Wring to Alteration, the survey to Divination.
- **Skill levels to 99 by EXP, and "The World" at all seven maxed** (adapt): OSRS levels, in line with the Fool's Journey. *Adapt to
  the pillar*: EXP comes from doing the skill well (a clean strike, a perfect pitch, a typed macro), so practice and competence drive
  the level together.
- **Achievements unlock specialised abilities, passives, spells, cosmetics, titles and lore** (keep): the owner's standing rule,
  written here first.
- **Spell mastery by use, at 10 / 50 / 200 / 500 casts** (keep): the arts' variants already do this.
- **Luck rises from statistically unlikely events, good or bad** (keep): a ledger predicate over rare outcomes (a prismatic, a near
  miss, a critical, a Lockheart jackpot), so it is retroactive like the achievements. It sways chance only, never a skill.
- **Soul Alchemy: eight attributes** (Willpower, Focus, Charisma, Perception, Dexterity, Visualization, Resilience; Luck apart),
  raised by pressing materials at the Shrine (adapt):
  - Each material has a primary gain and side effects as trade-offs, and hidden combinations go into a "Grimoire of Echoes".
  - *Adapt*: the materials' hue and saturation (the owner's spirit press) carry the colour theory.
  - *Cut*: any attribute that does a skill for the player ("Perception: accuracy of ranged abilities" is aim assist).

**World**
- **Figment classes, by sea**: Guppy, Barracuda, Marlin, Whale, Leviathan (keep).
- **Traits as tags revealed by reading** (keep): Armored, Pack Hunter, Volatile Demise. This is the Veritome's bestiary.
- **Wells as dungeons with Etrian Odyssey cartography** (keep): the Dreamvane and Veritome mapping skill has its stage. Shortcuts are
  opened on later runs, and FOEs patrol (strong Figments to avoid or take on).
- **Overflow converts to crystallised Lachryma at 20%, up to 50% with progression** (adapt): today the overflow goes to the Lockheart
  at ×0.8. This rate is the Lockheart's conversion mode.
- **Defeat costs a share of the cubes** (hold): today "nothing is lost but the place".

**Later layers (not cut: they are the game's other layers, section 11)**
- Contractors (twenty classes, one per Major Arcana; Gambits; affinity; permadeath; LLM personalities).
- The Ship, Bounties, Psychic Storms (the Astral Ocean is the Emocean now).
- The grid and the Metronome's beats: a Well's tactical layer, never the core movement's (the gold standard).

**Cut**
- The post-battle report screen and level-up notifications: the log is the only text feedback.

**Of note**
- The seven Psy-Tool families map onto today's tools: Psyguns, the Psygun; Psycasters, the Sondelass; Dreamcatcher staves, the Dreamvane;
  Tomes, the Veritome; Bells, the Crucibelle; Paintbrushes, the Soul Brush. Clocks have no tool: the Lockheart took their place.

---

## 11. The three layers (ruled, 2026-10-04)

Fool's Fortune is built in three layers of depth, each a genre, and the game is the weave between them:

1. **Wells**: spontaneous dungeons on an Island of Ego. Exploration, cartography, and the tactical layer.
2. **The island**: action combat outside the Wells (the game as it stands).
3. **The Emocean**: travel between Islands of Ego, as node and stage-based rail-shooter combat (FTL's map, KH2's gummy ship).

No player is asked to play one genre all the time; every player plays each some of the time. Prior art for one character across many
activities: OSRS, FFXIV, Palworld, Aniimo. The repository is the vertical slice of all three.

**The rule for the seams** (what decides whether the weave holds): one Courier, one purse, one ledger and one set of seven tools across
all three layers. Each layer may add verbs, but none may have its own currency, levels or gear. KH2's gummy ship is the warning: its
separate parts, building and progression are why players skipped it.

---

## 12. Rulings of 2026-10-04 (the digest)

1. **The Lockheart's keys**: the conversion keys are cheaper (LOADED and ECHO 6 minutes), and **a fancy key is reused**, breaking after each
   opening with a chance that rises with use (`ECON.lockheart.keyWear`: 20%, then 15 points more each time; it lasts about 2.7 openings,
   never more than seven). Brass is spent. Conversion now pays over a key's life when the coffin is brimming, not when it is merely full.
2. **The Vessoul** is the player's entity in the world. Its forms are the god hand, the Pneuka Jar, the Courier and, on the Emocean, the
   ships (sloop, frigate, tanker, destroyer, galleon); the Solar Skiff is one of its limbs (GLOSSARY).
3. **Kintsugi**: gold where a crack mends, dissipating fully as the mend completes; a very subtle sizzle as it mends (Wanda's, if she
   likes).
4. **Espada's cast** for commissions and bounties stands (Seger the Witness Cone; Letty Marque and her Tulpa Poll, "she"); the details
   are Espada's to write.
5. **The STE100 trim** of the UI text comes after the systems plan.
6. **The chests' beams** become a glaze that changes as the chest charges (Calissa's), touching Petra's ceremony.

## 13. Rulings of 2026-10-04, evening (R57: the slice)

- **Jellies for now** in the Emocean's stage; the Egregore's body and mind after the slice.
- **The Purser buys Cogitomaps**, dearest on Margarite (Law wants its minds charted), cheapest on the island whose Well it maps (it
  knows its own mind). The map is what makes the first hop pay, and only a good map pays the trip: skill decides (`purserPrice`).
- **Divination charts the course between the Islands of Ego** (the owner's steer). Taken from FTL's long-range scanners, Sunless Sea's
  zee charted by sailing it, and dead reckoning: a route's **reckoning** (0 .. 1, of a day) marks each wave's lane ahead on the rail and,
  after the slice, opens the way to a node not yet found (Entropolis). Knowledge, never numbers: the reckoning shows where the
  wave comes from, and the gun and the dodge stay the player's. `src/progress/econ/emocean.js`.
- **The music is the stage's clock:** every stage runs its cue's 150 s; a tempo per ship (Wanda's `stageCue`) waits for a second ship.

## 14. Co-op and the divisions in the game (the owner, 2026-10-05; after the slice)

- **Slice first, co-op after.** The divisions get an interface templated on the Courier's (Petra's), and each a bespoke clay folk form
  with abilities suited to its role and persona (the owner's; not to be argued on balance). Designs come after the slice.
- **Friendly fire is on**: a fifth of the damage; statuses land on allies, and tolerance rises fast (`combat/friendly.js`: x2 build-up
  and half the hold for the second, immune to the third within 20 s). Taken from Monster Hunter's status tolerance and WoW's
  diminishing returns.

## 15. Widening: what a level does (the owner, 2026-10-05: "lock it in for now")

A domain's level widens what the domain can do: reach, capacity, options, never accuracy (section 10). Fifteen knobs, each read by the
tool it names as a multiplier of the tool's own number or a bonus to a count, linear in the level for now (`WIDEN`, `widenAt` in
`progress/domains.js`; `game.psyche.widen(key)`; the table prints in `node scripts/combat.mjs`). Level 1 is the tool exactly as it is,
so the core movement and every tool's feel are untouched until a level is earned. Two of them tie systems together on purpose:
`divination.reckon` (Divination charts the course: the reckoning marks the rail further ahead) and `spellscription.copy` (Spellscription
duplicates good maps: a Cogitomap transcribed is another sale to the Purser). And levels feed the unlocks for free: an art's achievement
is a predicate, so "this art at Divination 20" is one line in `achievements.js`. The system will grow.

## 16. The Shrine Garden and Soul Alchemy (the owner, 2026-10-05: "the boat first, then the Spirit Garden and Soul Alchemy")

The garden inside the vessel is where play already done well keeps paying, and where what the Wells give becomes who the Courier is.
Two systems, one place (Petra's: E3; the press is Calissa's to draw). Built as rules and modules first (Dovina), so the place only has
to call them.

**One line between the two progressions, so they never overlap.** The **domains** widen the **tools** (what the Courier does; earned by
doing it: section 15). The **attributes** widen the **vessel** (what the Courier is: capacity, toughness, standing; earned at the spirit
press). Neither ever does a skill for the player.

**Soul Alchemy** (`src/progress/alchemy.js`; prior art: Potion Craft's map, the owner's v0.1 attributes, Atelier's synthesis, a
painter's colour wheel):
- The Courier has a **soul colour** (a hue and a saturation on the wheel; it starts grey, at the centre). Pressing materials at the
  spirit press walks it along each material's winding **path** in the order they go into the hopper (`materials.js press()`): the
  order is the skill, as in Potion Craft.
- Each of the seven **attributes** sits at its own place on the wheel (its hue, at a saturation). **Firing** the press (the igniter)
  while the soul colour is inside an attribute's target raises that attribute one rank, spends **refined Lachryma** (cubes: the long
  sink) and leaves the colour where it is. The target narrows with every rank (navigation must get finer: the skill is the verb).
- The seven, after v0.1 (Luck stays apart: `luck.js`), each widening the vessel: **Willpower** (the shield's pool), **Focus** (how long
  the statuses you build hold), **Charisma** (what the folk pay and ask: prices, the haggle), **Perception** (how far ahead a creature's
  intent shows), **Dexterity** (drawing and stowing a tool), **Visualization** (the canvas the Soul Brush and the hand work on),
  **Resilience** (the clay's mending, and the hits a ship bears on the Emocean: one attribute across two layers).
- The soul colour is also a look: the vessel's glow takes it (Calissa's), so alchemy is dress-up as well as growth.

**The Shrine Garden** (`src/progress/garden.js`; prior art: OSRS's Kingdom of Miscellania and herb runs, Palworld's base, Stardew's
farm, FFXIV's housing as the long sink):
- **Dividend slots** (`ECON.dividend`): an encounter is **mastered** when every achievement in its group is done (a predicate over the
  ledger, so it is retroactive); a mastered encounter set in a slot pays 5% of its hourly rate by hand, real time, filling for 8 hours
  and waiting to be collected. Three slots to start.
- **Beds** (foraging): a material planted grows more of its kind over real hours (a herb run). What the Wells give is the seed stock.
- **Upgrades** (the long sink): more slots, more beds, each dearer than the last, paid in cubes.
- Later: caught Figments (the Lockheart's summoning) work the slots and beds, Palworld's way.

## 17. Time: one game day is one hour (the owner, 2026-10-05)

Real days cannot be taste-tested: nobody can try a Well's drift, a market's swing or a garden's harvest in an afternoon. So the game keeps
its own calendar, on a conventional game scale.

**The scale.** One game day is one real hour: a game hour is 2.5 real minutes, a game minute 2.5 real seconds. (Prior art: Minecraft's
20-minute day, Stardew Valley's 7 seconds a game minute, Majora's Mask's three days; and Animal Crossing for what this is not.)

**The clock runs on the wall clock, scaled**, not only while playing: what pays or grows while you are away (the garden) still does,
and a return after a night away finds many days gone by. It is one clock for everything (`core/calendar.js`: `now()`, `today()`), and a
replay pins it (`setClock`), so a replay sees the days it saw. Nothing reads `Date.now()` for game time.

**What is a game day, and what is not.** Two kinds of number, never mixed:
- **The calendar** (drift, ripening, caps, ages) is in **game time**: a Well's layout and an island's demand turn over each game day; a
  route's reckoning is of a game day; a Cogitomap halves in worth each game day; a bed ripens in game hours; the dividend's cap is a
  game day.
- **Rates of income** (`ECON.perMinute`, the aim of 480 cubes an hour) stay per **hour of play**: the economy is measured against the
  player's time, never the calendar's.

**What it lets us test in one sitting:** the Dunemaw changes shape every hour; the islands' prices swing over three to seven hours (the
demand wave's period, `ECON.island.periodDays`); a Cogitomap is worth half after an hour; a bed ripens in 15 minutes (6 game hours); a
dividend slot fills in an hour (1 game day).

**What it invites (later, the others'):** a day and night that follow the game clock (Calissa's sky), the music by the hour (Wanda's),
the folk's routines (Petra's), and the slice's achievements that ask for "seven days" mean seven hours.

## 18. Emotional weather (the owner, 2026-10-05; the plan: docs/plans/WEATHER.md)

Weather is an island's mood falling as Lachryma: the five aspects (mirth, wonder, hunger, grief, dread) and calm. It resonates because
the game already speaks in those fives: each weather feeds the damage type at its place on the Law-Chaos line (mirth Impact .. dread
Delirium), sways every creature's mental state, draws its fish, makes its crude plentiful (cheap) where it falls, changes the Emocean's
danger and the reckoning's reach, and feeds a ruminating Well. It is a pure function of the island and the game hour, so it is the same
for everyone and in a replay, and it can be forecast: how far ahead is a Divination widening. Margarite leans to mirth and Entropolis to
dread; a dread fog over the King's island is rare (under 1% of hours) and a hidden achievement. The weather changes what pays and what is
easy, never a skill. Day and night run on the same clock; at night Lachryma's signatures read further.

## 19. Rulings of 2026-10-05, the weather round

- **The five feelings are shown most positive to most negative: Wonder, Mirth, Hunger, Grief, Dread**, wherever a player sees them
  (GLOSSARY; `DISPLAY_ORDER`). The Law-Chaos order (mirth .. dread) stays the systems' and is never the shown order.
- **Wells come in radically different types**: a Well's genre is free, "action combat" (the Dunemaw) beside, say, "a JRPG board game".
  One Courier, one purse, one ledger and the same seven tools still hold in every type: what changes is how a mind is worked through.
  Part of the Wells' deep dive after the slice (SLICE.md).
- **Weather is asked by place** (Petra's input): an island, or a Well with its own mood, with an exposure (open, roofed: the mood without
  the rain, deep: the Well's own); the open Emocean has no mood. Each weather wears its damage type's colour and motif (Calissa's input:
  wonder is diamond dust and halos by day, the aurora by night); the hour sets the music's density and the mood its colour (Wanda's).
- **Hunger stays in the middle of the line** ("pretty neutral"); a rename to **Desire** is being weighed with Espada.
- **The Crucibelle's notes follow the weather** (Wanda's five scales: "responding to emotional barometric pressure"): approved.
- **A beach** on the Dunes' edge shows what an Island of Ego is: nothing but Emocean to the horizon. The weather ends at the waterline
  (the open sea has no mood), and the slice's pier would leave from it. **Entering a Well** gets its seam covered: a wordless descent
  through the maw, held until the floor is ready (Calissa's look, Petra's timing).

