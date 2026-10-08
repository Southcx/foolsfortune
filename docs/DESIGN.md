# The design bible

What play is worth and where it leads: the loops, what each thing is for, the progression, the ledger and the achievements, the
audit, and the owner's rulings. Kept by Dovina (Game Design Systems). The economy's map and numbers are `docs/ECONOMY.md`; the lore is
`docs/LORE.md`; how the creatures think is `docs/AI.md`. Every number in a system file answers to a reason; where one does not yet,
section 7 says so. Section numbers are cited by code: keep them stable.

---

## 1. The player's goal at each scale

- **The moment (real seconds to a real minute): strong.** The core movement (sprint, slide, wallrun, mantle, dash, the Movement Arts)
  is the gold standard. Every tool is a verb with a readable outcome in the world (a pot shatters, a fish bites, a formation rings
  true), and the log writes the sentence.
- **The session (ten minutes to an hour of play): breadth, no direction.** A sandbox of rooms, each with a small loop: the Weir
  (fish, the treasury, the Tithe), the dunes (mining by ear, jellies, the skiff), the workshop (pots, the gong trial, the kiln), the
  basement (the movement lab, three lap circuits, THE COURSE, THE SIEGE). Nothing yet answers "what am I working toward tonight?":
  an art's progress, a missing curio, an unearned glaze, a medal not yet gold all exist, and none is put in front of the player.
- **The long run (game days and real weeks):** the achievements (366 entries, six tiers, about 950 points, a standing from Sweeper to
  Fool's Fortune), the collections (twenty curios, 54 cards in the Book, the bestiary, the glazes), medals and records, the arts'
  variants. **Progress resets on every build** (`src/core/progress.js`), so the long run can be measured (the ledger timestamps every
  first) but not lived.

---

## 2. What each thing is for

"Faucet" is cubes into the world, "drain" cubes out, "converter" one resource into another (Machinations; `docs/ECONOMY.md`).

### The tools (the belt: seven tools, five places to wear them)

| Tool | The moment | The session | Takes | Gives |
|---|---|---|---|---|
| **Psygun** (X) | shoot, charge, caster shells | pots, jars, jellies | Lachryma (shot 4, charge 24); shells | baubles, jelly cubes |
| **Sondelass** (Q) | cutlass, rod, grapnel; zandatsu | angling; the zandatsu harvest | Lachryma (cast 10, stinger 6, blade 4 a real second) | fish (sold), cores |
| **Soul Brush** (G) | club, slide, drawings, sigils | traversal, puzzles, befriending jars | Lachryma, ink | mended pots, friendly jars |
| **Veritome** (J) | lens, the Flash, reprogramming | the photographer's round | none (a digital camera) | cards, bestiary facts, glazes, cubes by condensing |
| **Dreamvane** (K) | dowse, pick, fork, survey | mining in the dunes | Lachryma (survey 12) | crystal cubes, shards, Possibilikeys, the map |
| **Crucibelle** (U) | notes on the beat, songs | support; reveals veiled crystal | Lachryma (8 to 24 a song) | sleep, decoys, spirits, sight |
| **Lockheart** (I) | hoover, open: the ultimate | the gamble after a fight | Lachryma overflow, a Possibilikey | a dud to a slip nuke (`src/tools/lockheart/table.js`) |
| **God hand** (~, off the belt) | the God Arts | THE SIEGE | Lachryma | the vessel's defence |

**Lachryma** is the moment's resource (a pool of 100, regenerating 3.5 a real second after 2.2 real seconds; also the shield).
**Cubes** are the session's. They meet only at the Lockheart and the crystals. Keep the split (FFXIV's MP against gil).

### The places

| Place | Its loop | Pays |
|---|---|---|
| The workshop | pots, jars, the gong trial, the kiln | baubles; the trial a medal and a record |
| The basement hub, the lab, THE COURSE | learning the arts | arts, variants, records |
| The lap circuits (Braid, Mill Race, Spindle) | mastery by time | medals, records, achievements; no cubes |
| THE SIEGE | the god hand's defence | shells and a little mending a wave; no cubes |
| The dunes | mining by ear, jellies, skiffing | the miner's cubes, shards, keys; jelly cubes |
| The Weir | angling, the treasury, the Tithe, both shops | fish, chests, curios; the main drains |

### The creatures and the folk

- **Clapperjars**: fodder, 6 baubles each. **Slip jellies**: the only thinking opponents (6 cubes a burst, 3 a core); where the stun,
  the Flash, zandatsu and reprogramming are learned. **Fish**: ten species over five tiers. **Spirits**: allies. The bestiary makes
  each a collection.
- **Raku**: the treasury, the main drain; sells keys and coffins at 1.45x worth, and haggles. **Old Grog**: buys fish, sells lures at
  worth. **Saggar**: the kiln. **Pip**: the hub, no shop yet.

---

## 3. Progression

- **The laws of progression are section 22** (the owner, 2026-10-08): skill skips grind, grind closes the gap, Arts only by achievement.
- **No experience points for the arts and no growing Lachryma pool**: everything is learned by doing (Tony Hawk's goals, OSRS's
  quest-locked unlocks), and power grows sideways, not up (`maxBonus` exists, unused). The Firings follow this: they open places, not numbers. The domains'
  levels (section 10, 15) widen, never do the skill.
- **The System's arts** (`src/progress/skills.js`): eight Movement Arts and five God Arts, one to three variants each, earned by goals
  over the event bus (`count`, `feat`, `sum`, `chain`). The goals teach (Blink to those who air-dash). A variant only overlays tuning,
  so the core movement is never touched. `system.lendAll` lends every art and counts nothing (on in DEBUG, off in STORY).
- **The tools** are not a progression yet: five worn and two in the box from the first minute (`box.seed`). The **Pneuka Box** (28
  slots, stacks of 99) and the **Book** (54 cards, 20 free slots) are capacity; nothing grows them.
- **The kiln**: glazes from the start, from achievements (retroactive) and from photographs; firing a look costs 16 cubes, mending up
  to 12. Prices of bought looks: ECONOMY.md, "The worth of a look".
- **Chests**: five tiers from the treasury plinths (shut again for 4 real minutes, common, up to 2 h 40 real minutes, prismatic), the
  Tithe (48 cubes a pull, published odds, three pity counters) and one-off chests. Twenty curios, four to a tier.
- **The Lockheart**: fill it with Lachryma, put up to four Possibilikeys on its ring, open it; three coffins, seven keys. The game's
  gacha made a weapon, the one place luck reaches the moment.
- **The standing**: achievement points buy a rank, Sweeper (0) to Fool's Fortune (340), with titles (FFXIV).

---

## 4. The economy, in brief

`docs/ECONOMY.md` has the map, the profiles and the reasons; `src/progress/econ/table.js` (`ECON`) has every number.
- The unit is a minute of play: 8 cubes, so the aim is 480 cubes an hour of play. Every price is named in minutes.
- No activity pays more than 1.5x the aim, except luck.
- Measured by the F3 panel's `econ` line (reads the ledger), `node scripts/economy.mjs` (simulates the table), `/grant` (DEBUG).

---

## 5. The ledger and the achievements

- **The ledger** (`src/progress/stats.js`, after OSRS and FFXIV): counters that only rise (lifetime and session), records with when
  and where, firsts timestamped in play time, and `done` for the achievements. `src/feedback/tracking.js` turns about 260 kinds of
  event into counts and log lines: every question about play is answered from it, and achievements are retroactive by construction.
- **The achievements** (`src/progress/achievements.js`): 366 entries in 14 categories; 67 Easy, 108 Medium, 100 Hard, 50 Elite, 28
  Master, 4 Grandmaster; six types (count, speed, perfection, mechanic, stamina, collection); hidden entries, titles, a standing.
  Every ledger key an achievement reads is fed in `src/`. Placeholders until STORY; reset with every build.

---

## 6. Prior art

OSRS (bank, shops with restock, collection log, achievement tiers, hiscores, the money-making guide, birdhouse and farming runs);
FFXIV (achievement categories, titles, glamour and housing as chosen sinks); Machinations (Dormans and Adams); gacha practice (Genshin,
Fire Emblem Heroes: published and consolidated odds, pity, sparks, dupe protection; China's 2017 disclosure rule); Slay the Spire and
Balatro (stacked modifiers); Pokemon Snap, Fatal Frame, Dark Cloud 2 (the camera); Tony Hawk and Breath of the Wild (learning by doing);
Zelda, Metroid and OSRS quests (the tool-gated spine); Mario Kart's cups and Tony Hawk's gaps (mastery rewarded in standing, never
currency); live games' "time to first X" funnel. Module headers carry the detail.

---

## 7. The audit

### What works
- One table, one unit, a simulator and a live panel reading the same numbers.
- The ledger as the single source of truth (retroactive achievements and glazes, a first for everything).
- Lachryma and cubes kept apart; skills learned by doing, with no XP for the arts.
- Luck with an honest face: published odds, pity shown as lamps, a staged near miss, every item-giving chance a deck (ECONOMY.md rule 5).

### Fixed by Phase A (`docs/plans/SYSTEMS.md`)
The duplicate achievement ids, the Tithe counted twice (now `tithe.count` only), the published odds (consolidated), the Gambler's
Lockheart (`ECON.lockheart.jackpotCap` 0.25; coffins and INVERTED out of the starting kit), and the curio curve (`ECON.curioDeck`).

### Still open
- **Faucets in the same place stack.** Fishing (475 cubes an hour) plus the treasury plinths beside it (586) is about 1,060 an hour,
  2.2x the aim. Count it as a mixed profile and decide whether 2x is meant (OSRS's birdhouse run does this on purpose).
- **The miner earns 1.74x the aim**, over the 1.5x cap, on an assumed 40% sweet-spot rate on dense formations: a measured skill
  premium (say so) or a rate to bring down.
- **Small ones**: fish rank G is never used; Lockheart chests are never cleared away; `card.drift` from time is a dead branch in
  `tracking.js`; the achievements write their own log lines (`achievements.js announce`) instead of a rule in `tracking.js`, and the
  `achievement` event carries no `by`.

### What is missing
- **A session goal, and STORY** (on hold: section 8).
- **Measurement of pace**: time to first art, fish, curio, gold medal. The ledger's firsts hold it; nothing reads it out.

### Numbers with no reason yet
Each needs a sentence or a measurement: the 12% prismatic at epic pity; the 42% near-miss rate and its 25% second step; the chest cube
ranges; the condense ladder below SS; the 1.6 in the Lockheart's chest tier; the coffins' fills (40 / 30 / 50); the keys' prices
against what they change; the standing thresholds (Fool's Fortune at 340 of about 950 points).

---

## 8. The proposals

**Ruled (the owner, 2026-10-04):** 1, 2, 3 and 5 go ahead, in that order (Phase A). 4 is on hold with STORY: **STORY is off the title
menu until further notice**, while the tools' identities are settled. No content push until then.

### 1. Make the numbers true
Unique achievement ids (checked), consolidated Tithe odds in the Codex, one Tithe key, true headers, and the simulator's mixed
profiles, Lockheart value per opening, curio curve and points by tier.

### 2. Balance the Lockheart's luck
A jackpot ceiling (25%); the Gambler's and Shepherd's coffins out of the starting kit, so **a first opening is never a bought
jackpot**; keys priced by what they change. Aim: a jackpot about once a session for a committed player, not once a key.

### 3. Turn the curio curve the right way up
A set takes longer to finish the rarer it is: medians of about 20 / 40 / 80 / 150 / 300 Tithe pulls, common to prismatic.

### 4. A spine for STORY's first hours (on hold, with STORY)
The belt fills from the folk, one tool per task in their room (Grog the Sondelass, Saggar the Soul Brush, Raku the Lockheart, Pip the
Dreamvane, the Crucibelle later); each room opened by what it needs. Measured by a funnel from the ledger's firsts: a new thing every
five to ten minutes of play in the first hour, no gap over fifteen.

### 5. Mastery that is worth something, never in cubes
Gold on a circuit or the trial, a full Siege and a Course record each earn a **glaze or a title** (predicates over the ledger). The
kiln's bought glazes are the cube sink beside them; **what is bought is never what is earned**. Measured by medal firsts against
sessions, and `cube.use.kiln` on the F3 line.

---

## 9. The pillar: every tool teaches a real skill (the owner, 2026-10-04)

**The skill is the verb**: the player gets better at the game by getting better at the real thing, and no number may do the skill for
them. The game teaches by play and never says it is teaching (prior art: Rhythm Heaven, The Typing of the Dead, Brain Age, Gran
Turismo's licences; the warning: the FTC's 2016 Lumosity ruling). **Luck sways chance only, never a skill.**

| Tool | The skill (all ruled) |
|---|---|
| Psygun | aim; dynamic visual acuity |
| Veritome | typing (reprogramming), reading behaviour, patience for the shot |
| Dreamvane | relative pitch; with the Veritome, spatial mapping |
| Crucibelle | tempo and melody: ten notes (1-5 low, 6-0 high) in the pentatonic of the music playing, each with a colour; no chords (keyboard rollover) |
| Sondelass | the platformer's timing and momentum (line tension, the grapple's swing, the parry window) |
| Soul Brush | shapes |
| Lockheart | odds and expected value |

**The Lockheart is the magic system (ruled in outline, 2026-10-04).** The coffin worn sets its mode: **casting** (the wheel of
outcomes); **summoning** (catch a critically stunned Figment, a third choice beside zandatsu and reprogramming; the catch rate is the
wheel, set by how cleanly it was stunned, and keys augment it); **conversion** (baubles into cubes; the keys set risk and yield).

**Achievements are the main way skills are unlocked**, and cosmetics are their rewards, in quantity (the owner's standing rule).

---

## 10. Mined from the owner's design document v0.1 (given 2026-10-04)

v0.1 describes a grid-tactics game; its systems are mined, its combat model is not. **Keep**, **adapt**, **hold** or **cut**:

- **Five damage types on a Law-Chaos line** (keep; `src/progress/combat/types.js`): Impact (lawful, physical), Ego (lawful, mental),
  Influence (neutral, social), Illusion (chaotic, perceptual), Delirium (chaotic, entropic). **Annihilation**: Impact and Delirium
  amplify each other on a target afflicted by the other. Enough of one type applies its status (Impact: stun, slow, armour break; Ego:
  doubt, pacified; Influence: charm or taunt, misdirect; Illusion: blind, phantom pain; Delirium: confusion, reality tear). *Adapt*:
  each tool deals a type; the trump list is to become a closed cycle.
- **Mental state, Stoic, Resolved, Balanced, Fluid, Prismatic** (keep): how open a creature is to statuses and buffs.
- **Emotional Output (EmO)** (keep, central): a Figment's agitation rises as it is fought; its Lachryma yield peaks in a band, past
  which it enrages; Soothe lowers it. Catch or harvest in the band.
- **The six (+1) domains** (ruled, 2026-10-04; `src/progress/domains.js`, `src/progress/psyche.js`): Ouranurgy (displacement),
  Manifestation, Divination, Psychokinesis, Possession, Alteration, and **Spellscription** as the +1 (transcribing: the Soul Brush's
  glyphs, the Veritome's macros).
- **Skill levels to 99 by EXP, "The World" at all seven maxed** (adapt): EXP comes from doing the skill well, so competence drives the
  level.
- **Achievements unlock abilities, passives, spells, cosmetics, titles and lore** (keep). **Spell mastery at 10 / 50 / 200 / 500
  casts** (keep: the arts' variants). **Luck rises from statistically unlikely events** (keep: a retroactive ledger predicate;
  `src/progress/luck.js`).
- **Soul Alchemy's attributes** (adapt: section 16). *Cut*: any attribute that does a skill ("Perception: accuracy" is aim assist).
- **Figment classes**: Guppy, Barracuda, Marlin, Whale, Leviathan (keep). **Traits revealed by reading** (keep: the bestiary).
  **Wells as dungeons with Etrian Odyssey cartography**, shortcuts and FOEs (keep).
- **Overflow converted at 20%, up to 50%** (adapt: the Lockheart's conversion mode). **Defeat costs a share of the cubes** (hold).
- **Later layers**: Contractors, the Ship, Bounties, Psychic Storms (the Emocean now), the grid inside a Well, never the core movement.
- **Cut**: the post-battle report screen and level-up notifications (the log is the only text feedback).

---

## 11. The three layers (ruled, 2026-10-04)

1. **Wells**: dungeons on an Island of Ego (exploration, cartography, the tactical layer).
2. **The island**: action combat (the game as it stands).
3. **The Emocean**: travel between islands, a node map and rail-shooter stages (FTL, KH2's gummy ship).

**The rule for the seams**: one Courier, one purse, one ledger, one set of seven tools across all three. A layer may add verbs, never
its own currency, levels or gear (KH2's gummy ship is the warning). The Emocean pays at the price at the other end.

---

## 12. Rulings of 2026-10-04

1. **The Lockheart's keys**: LOADED and ECHO cost 6 minutes of play; **a fancy key is reused**, breaking after each opening at a
   chance that rises with use (`ECON.lockheart.keyWear`: 20%, then 15 points more; about 2.7 openings, never more than seven). Brass
   is spent.
2. **The Vessoul** is the player's entity: the god hand, the Pneuka Jar, the Courier and the Emocean's ships; the Solar Skiff is a
   limb (GLOSSARY).
3. **Kintsugi**: gold where a crack mends, gone as the mend completes; a subtle sizzle (Wanda's).
4. **Espada's cast** for commissions and bounties stands (Seger the Witness Cone; Letty Marque and her Tulpa Poll).
5. **The STE100 trim** of the UI text comes after the systems plan.
6. **The chests' beams** become a glaze that changes as the chest charges (Calissa's).

## 13. Rulings of 2026-10-04, evening (the slice)

- **Jellies for now** in the Emocean's stage; the Egregore after the slice.
- **The Purser buys Cogitomaps**: dearest on Margarite, cheapest on the island whose Well it maps; only a good map pays the trip
  (`purserPrice`).
- **Divination charts the course**: a route's **reckoning** (0 to 1, of a game day) marks each wave's lane ahead on the rail and later
  opens unfound nodes. Knowledge, never numbers (`src/progress/econ/emocean.js`).
- **The music is the stage's clock**: every stage runs its cue's 150 real seconds.

## 14. Co-op (the owner, 2026-10-05; after the slice)

- Slice first, co-op after: each division gets a clay folk form with abilities suited to its role (the owner's; not argued on balance).
- **Friendly fire is on**: a fifth of the damage; statuses land on allies with fast-rising tolerance (`combat/friendly.js`: x2 build-up
  and half the hold the second time, immune the third within 20 real seconds; Monster Hunter, WoW's diminishing returns).

## 15. Widening: what a level does (the owner, 2026-10-05: "lock it in for now")

A domain's level widens reach, capacity and options, **never accuracy**. Fifteen knobs, linear in the level, each read by its tool
(`WIDEN`, `widenAt` in `progress/domains.js`; `game.psyche.widen(key)`; printed by `node scripts/combat.mjs`). Level 1 is the tool
exactly as it is. `divination.reckon` lengthens the reckoning; `spellscription.copy` duplicates good Cogitomaps.

## 16. The Spirit Garden and Soul Alchemy (the owner, 2026-10-05)

One line between the progressions: the **domains** widen the **tools** (what the Courier does); the **attributes** widen the **vessel**
(what the Courier is). Neither does a skill for the player.

**Soul Alchemy** (`src/progress/alchemy.js`, `materials.js press()`; Potion Craft's map, Atelier): the Courier's **soul colour** (hue
and saturation, starting grey) walks each material's **path** in the order pressed; the order is the skill. **Firing** inside an
attribute's target raises it one rank and spends cubes (the long sink); targets narrow with each rank. The seven: **Willpower** (the
shield's pool), **Focus** (how long built statuses hold), **Charisma** (prices, the haggle), **Perception** (how far ahead intent
shows), **Dexterity** (drawing and stowing), **Visualization** (the Soul Brush's canvas), **Resilience** (mending; a ship's hits). Luck
stays apart. The vessel's glow takes the soul colour.

**The Spirit Garden** (`src/progress/garden.js`; OSRS's Miscellania and herb runs, Palworld, FFXIV housing):
- **Dividend slots** (`ECON.dividend`): a mastered encounter (every achievement in its group done) in a slot pays 5% of its rate an
  hour of play, filling for 8 game days (8 real hours), then waits. Three slots to start.
- **Beds**: a material planted grows more of its kind in 6 game hours (15 real minutes).
- **Upgrades**: more slots and beds, each dearer, in cubes. Later, caught Figments work them.

## 17. Time: one game day is one real hour (the owner, 2026-10-05; settled)

A game day must be tasted in a sitting. `DAY_MS` = 3,600,000 (`core/calendar.js`): a game hour is 2.5 real minutes, a game minute 2.5
real seconds. The clock runs on the wall clock, scaled, so the garden grows while you are away; one clock for everything (`now()`,
`today()`), pinned in a replay (`setClock`). Nothing reads `Date.now()` for game time.

**Two kinds of number, never mixed:** the calendar (a Well's drift, ripening, caps, demand) is in game time; rates of income
(`ECON.perMinute`) are per hour of play. "Seven days" in an achievement means seven game days.

## 18. Emotional weather (the owner, 2026-10-05; docs/plans/WEATHER.md)

An island's mood falling as Lachryma: mirth, wonder, desire, grief, dread, and calm. Each feeds its damage type, sways mental states,
draws its fish, makes its crude cheap where it falls, changes the Emocean's danger and the reckoning's reach, and feeds a ruminating
Well. A pure function of the island and the game hour (same for everyone, replayable, forecastable by Divination). Margarite leans to
mirth, Entropolis to dread; a dread fog over the King's island (under 1% of game hours) is a hidden achievement. It changes what pays,
never a skill.

## 19. Rulings of 2026-10-05, the weather round

- **Shown order: Wonder, Mirth, Desire, Grief, Dread** (`DISPLAY_ORDER`); the Law-Chaos order (mirth to dread) is the systems' only.
- **Wells come in radically different genres**; one Courier, one purse, one ledger, the same seven tools in every one.
- **Weather is asked by place** with an exposure (open, roofed, deep); the open Emocean has no mood.
- **Hunger is renamed Desire**: neutral, Influence's. *Hunger* is a folk word now. Its crude: crude desire.
- **The Crucibelle's notes follow the weather** (Wanda's five scales): approved.
- **A beach** on the Dunes' edge; the weather ends at the waterline. **Entering a Well**: a wordless descent through the maw.
- **Cycles of expansion and contraction**: the world grows, the player's load does not; every expansion is followed by a contraction
  pass (docs/plans/WHEEL.md). The baseline creature suite is the Lantern Wisp's 18 clips.
- **The wheel is approved** (docs/plans/WHEEL.md): one feeling or one **agate**; Plutchik's hues; Faith, Gall and Fury after the
  slice; about one weather game hour in eight is an agate.

## 20. The stones: how a Courier takes Lachryma in (the owner, 2026-10-06; LORE.md "The stones")

The stones are the vessel's **intake**; every stone trades a gain for a loss (Dark Souls' rings, Path of Exile's keystones). One set
at a time. The table is `src/progress/stones.js`.

| knob | what it is | wired |
|---|---|---|
| **pool** | size, regen, costs (`LachrymaPool` modifiers) | yes (main.js) |
| **reach** | the bauble magnet's radius | Petra (`courier/lachryma.js`) |
| **heady** | how far a drink pushes your mental state toward Prismatic (x1.5 power, x2 fragility; brimming four times as far) | Petra |
| **tint** | how strongly the place's feeling comes in: the **draught**, building its status up to x1.5 | Petra |
| **gulp** | a cap on the take a real second | Petra |
| **overflow** | the Lockheart's share, or bled off | Petra |

| Stone | Gain | Cost |
|---|---|---|
| Amethyst | sober: heady x0.4, tint x0.5, gulp 25 a real second, overflow bled | slower regen, shorter reach |
| Citrine | a tenth of what is drunk kept as cubes | 15 less to hold |
| Moonstone | regen and reach x1.3 at night | x0.85 and x0.9 by day |
| Onyx | no tint, all overflow to the Lockheart | slower, shorter |
| Emerald | reach x1.5, tint x2 | heady x1.3 |
| Sapphire | costs x0.85 | regen x0.8 |
| Ruby | 30 more to hold | costs x1.15, heady x1.25 |
| Diamond | an agate's two feelings both drunk | heady x2 |
| Opal | each drink a chance by Luck: a tenth doubled | a tenth lost |

## 21. The crossing: the Emocean as a rail shooter (the owner, 2026-10-07; docs/plans/RAIL.md)

A hundred bars of Wanda's Crude Sea: the first half teaches one idea an act (the gun and lock-on, polarity, the parry), the second is
one **set piece** (the shoal, the pirates, the rogue Leviathan), with camera grammars from Star Fox, Ikaruga, Einhander and Sin &
Punishment.
- **Pays no cubes** (section 11). Its reward is a rank against a measured par and a medal; its stakes the cargo (pirates take casks:
  measured -1.4 to +2 casks); the Leviathan is a deck, certain within 14 crossings on the Margarite run.
- The ship mounts two of your tools (the Crucibelle the bomb, the Veritome photographs the Leviathan); polarity is your draught; the
  parry is V.
- `node scripts/rail.mjs` plays it against three players: novices clear the common set piece three times in five, good players
  always, an expert fells the Leviathan about one time in four. Par and the medal line are re-measured from the ledger once played.

---

## 22. The laws of progression, and the commandment (the owner, 2026-10-08)

> "High skill skips grind, but long grind closes the gap in skill... Arts are unlocked by achievement and achievement only... persistence
> and perseverance ARE skills of their own." "Game systems should endeavor as much as practicable to teach the user something...
> without them actively recognizing they're learning."

1. **Skill skips grind; grind closes the gap.** Every source of growth pays more for doing it well (the domains' quality weight, the
   press's true firing) and still pays for doing it at all (every act's EXP, the press's seasoning). A skilled player gets there early;
   a persistent one gets there. Neither is locked out.
2. **Arts only by achievement.** A Movement Art, a God Art or a **knack** (a passive Art, a toggle) is opened by an achievement over the
   ledger and nothing else. Each Art worth having gets two: one of count (the patient's way) and one of feat (the skilled way).
3. **Accessibility is earned, optional and honest.** An assist (aim drawn to a target, a wider shot, a slower metronome) is a knack:
   opened by practice, switched on or off at will, and counted the same either way. This refines section 9's "no number may do the
   skill for them": none may be forced on them, and none may gate the skill.
4. **The seven domains are all there will ever be** (the owner, 2026-10-08): a new skill finds its home in one of them (time, the
   beat, is Spellscription's: staying on tempo is transcribing actions to time).
5. **Every system teaches something real, unannounced** (section 9's pillar, from the tools to every system): the mechanic itself is
   the lesson (pitch from tuning crystals, the painter's eye from the press), never a tutorial or a factoid.

The map of which system trains what, and the knacks: `docs/plans/TRAINING.md`. Soul Alchemy as the first system built to all four:
`docs/plans/SOUL-ALCHEMY.md`.
