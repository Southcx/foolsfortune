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

### 4. A spine for STORY's first hours (design now, build with Petra and Espada)

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
