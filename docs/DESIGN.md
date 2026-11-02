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
  basement (the movement lab, three lap circuits, THE COURSE, THE SIEGE). "What am I working toward tonight?" is answered since
  2026-10-21 by **the goals** (`progress/goals.js`, `/goals`): three of the achievements a game day, laid from the ledger (the nearest
  to done, one in a category not met yesterday, a Hard-or-harder stretch; a new save's are Easy first steps), each its achievement's own
  progress and reward, never a new task or a payment (Hades' Fated List, Animal Crossing's Nook Miles+, Steam's "nearly there"). A
  window for them is Calissa's; until then the log reads them on asking.
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

Moved (G56, 2026-11-02): the damage types, mental state, EmO, Figment classes, overflow and the cuts to `docs/plans/SYSTEMS.md`; the seven
domains, levels, achievements and Luck to `docs/plans/DOMAINS.md`; the attributes to `docs/plans/SOUL-ALCHEMY.md`. Each is under "Rulings
carried from DESIGN.md (section 10)".

---

## 11. The three layers (ruled, 2026-10-04)

Moved (G56, 2026-11-02) to `docs/plans/SLICE.md`, "Rulings carried from DESIGN.md (sections 11 and 13)".

---

## 12. Rulings of 2026-10-04

Moved (G56, 2026-11-02): items 1, 3, 4 and 6 to `docs/plans/SYSTEMS.md`; item 2 (the Vessoul) to `docs/plans/SUBSTRATE.md`; item 5 (the
STE100 trim) to `docs/plans/CLARITY.md`. Each is under "Rulings carried from DESIGN.md (section 12...)".

## 13. Rulings of 2026-10-04, evening (the slice)

Moved (G56, 2026-11-02): the slice's rulings to `docs/plans/SLICE.md` (sections 11 and 13); the music ruling to `docs/plans/RAIL.md`
(sections 13 and 21).

## 14. Co-op (the owner, 2026-10-05; after the slice)

Moved (G56, 2026-11-02) to `docs/plans/COOP.md`, "Rulings carried from DESIGN.md (section 14)".

## 15. Widening: what a level does (the owner, 2026-10-05: "lock it in for now")

Moved (G56, 2026-11-02) to `docs/plans/DOMAINS.md`, "Rulings carried from DESIGN.md (sections 10 and 15)".

## 16. The Spirit Garden and Soul Alchemy (the owner, 2026-10-05)

Moved (G56, 2026-11-02): Soul Alchemy and the attributes to `docs/plans/SOUL-ALCHEMY.md`; the Spirit Garden's slots, beds and upgrades to
`docs/plans/SPIRIT-GARDEN.md`. Each is under "Rulings carried from DESIGN.md (section 16...)".

## 17. Time: one game day is one real hour (the owner, 2026-10-05; settled)

Moved (G56, 2026-11-02) to `docs/ECONOMY.md`, "Rulings carried from DESIGN.md (section 17...)".

## 18. Emotional weather (the owner, 2026-10-05; docs/plans/WEATHER.md)

Moved (G56, 2026-11-02) to `docs/plans/WEATHER.md`, "Rulings carried from DESIGN.md (sections 18 and 19...)".

## 19. Rulings of 2026-10-05, the weather round

Moved (G56, 2026-11-02): to `docs/plans/WEATHER.md` (shown order, place, Desire, the Crucibelle), `docs/plans/ENDGAME.md` (Wells as every
genre), `docs/plans/DUNES.md` (the beach, entering a Well) and `docs/plans/WHEEL.md` (expansion and contraction, the wheel).

## 20. The stones: how a Courier takes Lachryma in (the owner, 2026-10-06; LORE.md "The stones")

Moved (G56, 2026-11-02) to `docs/plans/DICE.md`, "Rulings carried from DESIGN.md (section 20...)", with the table of the stones.

## 21. The crossing: the Emocean as a rail shooter (the owner, 2026-10-07; docs/plans/RAIL.md)

Moved (G56, 2026-11-02) to `docs/plans/RAIL.md`, "Rulings carried from DESIGN.md (sections 13 and 21)".

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
4. **The seven domains are all there will ever be** (the owner, 2026-10-08): a new skill finds its home in one of them. Time has two homes: keeping it (the beat, tempo) is Spellscription's, transcribing
   actions to time; bending it (anything that slows or stops time: blade mode, zandatsu, reprogramming, Celestial mode) is Ouranurgy's,
   the domain of the rules of the space around you.
5. **Every system teaches something real, unannounced** (section 9's pillar, from the tools to every system): the mechanic itself is
   the lesson (pitch from tuning crystals, the painter's eye from the press), never a tutorial or a factoid.
6. **Base change bad, modifiers good** (the owner, 2026-10-15: "removing elements or having them behave differently depending on game
   mode doesn't feel right"). The game's modules draw from one substrate: the pool is the same pool on foot, on the skiff and in a race;
   the vessel is the same vessel. So no mode and no module changes a base rule (round 6 held the pool's regen during a race; it was
   undone). A change comes as a MODIFIER with a SOURCE in the world: a hazard (a siphon, a miasma that stops the regen while you are
   in it), a weather, the vessel's cracks (a cracked region caps 5% of the pool's max until it mends: `progress/poolcaps.js`), a part
   you chose. You can see it coming, know what does it, and leave it or mend it. The UI shows where it bites: a capped pool shows the
   part held off, and by what. Setting up a test (a drill starting full) is not a rule; the DEBUG lend panel is exempt (a test tool).

The map of which system trains what, and the knacks: `docs/plans/TRAINING.md`. Soul Alchemy as the first system built to all four:
`docs/plans/SOUL-ALCHEMY.md`.

## 23. Figment attack telegraphs: the body first, Divination second (the owner, 2026-10-09; docs/plans/FIGMENT-TELEGRAPHS.md)

- **Always named in full** (the owner): a *Figment attack telegraph* is the third-person game's; the rail shooter's telegraph mark
  (`vfx/telegraph.js`) is another thing, and the two are never called by one bare word.

- **Every windup is readable from the creature's animation alone.** A Figment attack telegraph is never needed; a creature that needs one is a bug.
- **Figment attack telegraphs belong to Divination,** drawn in Lachryma's colours, on a ladder of fidelity: at Divination 2 the edge (where), 8
  the fill landing on the strike frame (when), 20 the damage type's colour and the status glyph (what kind), 35 the answer glyph (how
  to answer). **Perception** sets how early a mark shows; Divination how much it says.
- **A vocabulary of shapes** (circle, ring, cone, line, lunge, baited, floor, gaze, arena, adds, tracked, left) and of **answers**
  (out, in, sidestep, behind, look away, guard, parry, bait, kill first, high ground): one shape, one answer glyph, no words.
- **Reading is how Divination grows:** a windup that would have caught the Courier and did not is Divination's exp. Skill skips grind.
- Taken from FFXIV (the shapes, head markers that carry the answer), WildStar (the fill as the clock), WoW 11.1 (a crisp edge, a tinted
  inside), Monster Hunter (the body is the tell, and the answer is the opening), and the accessibility guidelines (never colour alone).
  Seeing Figment attack telegraphs as a levelled sense is ours.

## 24. Solar Skiffing as a racer (the owner, 2026-10-13; docs/plans/SKIFF-RACING.md)

The skiff took from the racers what fits a sail. From MK8: the carve (a drift loading in three tiers), glider lips, the rocket start
(here the solar start, a pump timed to GO), and time trials with a ghost. From Sonic Riders: tricks refill the boost (a spin landed square
gives Lachryma). From SSX: the late pop. From MK8 and F-Zero: boost pads (here sun plates). The glide flies as a hang glider: W dives,
S flares, Q and E bank, A and D spin. A bail now has one rule: something stopped you head-on, or the board landed pointing away from its
travel. The Raceway is the test circuit, built of the Dunes' kit, with the sandfall drop the owner asked for. Grind rails come next, on
the skiff alone (no other tool: the owner); rivals and slipstream are skipped for now; items and rubber banding are left out on purpose.

Round three (SKIFF-RACING.md 9) made the lap a set of choices and the tricks a currency of speed. From SSX Tricky and Tony Hawk's: the
trick combo (tricks chained, a variety multiplier, banked into free flares, lost on a bail), which replaces the Lachryma a trick gave: the
pool stays the shield's, tricks pay in speed. From SSX: grabs (the mouse buttons, free on the board) and side ramps. From Crash Team
Racing: reserves (pushes stack their time). From Kirby Air Ride: the slope landing (the fall kept as speed down a slope, a real lesson in
transitions). The hour and the weather change the race (the sun plates are solar and die at night; rain wets the sand, which is fast and
slick, as land sailors race the wet beach), and each condition keeps its own best. The cavern is a branch through a roofed gorge whose
pads run on Lachryma: the night's line. Every source still pays for doing it at all (a plain lap finishes; a trick of one kind banks) and
pays more for doing it well (the multiplier, the perfect pop) (section 22's law).

Round four (SKIFF-RACING.md 10) made the Raceway a park, the one place every racing mechanic is tested, in layers: the Sun Circuit
(learn the board), the Gorge Run (read lines and hazards: a blind crest, cliffs, a slot canyon, a spiral down a crater round an antlion
pit, a crossover, a ford), the Coaster (grind as a line: a 3D rail with drops, a banked turn, a loop and a helix), and free ground (a
half-pipe, a pit). What a height field cannot do is done another way: bridges for crossovers, coaster rails for loops. The lessons under
it are real: the antlion's pit stands at the sand's angle of repose; a banked turn takes g tan(bank) of its own pull; a coaster's lift
is the price of its fall. The tools that let the design be seen headless (a map from above, an autopilot with a trace) are part of it.

Round six (SKIFF-RACING.md 12) gave the board stakes and the park its modes. The keystone is F-Zero's: the pool is the hull. A bump, a
wall, a hard landing and a bail each drain it, the flare spends it; it is the Courier's own pool with its own regen, untouched (the owner: "the
literal same pool": the elegance is that every module draws from the one substrate; a mode never gives the pool rules of its own), and a vein lane beside the line refills it ten times faster, so a lap is a budget of Lachryma spent on speed or
kept as health, the same choice the ARPG asks of the shield (the owner's "chef's kiss").
Around it, each skill verb from the genre that made it: Excitebike's overheat (the scorch), Tony Hawk's manual and gaps, Mario Kart Wii's
snaking, F-Zero GX's side attack, Burnout's near misses and aftertouch, Wave Race 64's buoys (power raised by keeping the line, lost by
missing one). The rivals got minds of their own (a blocker, a rail hog, a gambler, a clean racer) and a grudge (the nemesis), and the
siblings race as the hard field. One race engine runs every mode (a race, a hot lap, practice with a rewind, a pot smash, the escape, the
licences), and above it the cups, Kirby Air Ride's City Trial and a wager whose odds are the ledger's read of you, so getting better beats
the house until it learns (section 22's law, as an economy). The garage's parts are trades opened by achievements, never upgrades.

## 25. Areas: the world as rooms of a walk (the owner, 2026-10-25, through Calissa; docs/plans/AREAS.md, a plan)

The owner chose FFXII's zones over an open world: dense areas a minute or two across, each built on entry and disposed on exit, with a
short transition at an edge you can see, and the iPhone XR as the floor. From FFXII: the unit, the seen edge, one condition per area
that changes what it holds (the Giza Plains' seasons), the rare game met only under a condition, and creatures that stay behind at an
edge. From Monster Hunter: the numbered map of small, dense zones. From Spyro and Banjo-Kazooie: a checklist of N of M with the total
always shown. From Xenoblade and Ys VIII: blank slots until found, and a region charted whole as an achievement (never cubes). From
Animal Crossing: the clock runs while you are away, and an area is caught up on entry, so nothing ticks unloaded. The rule that keeps
"dispose" from turning into "forget": an area holds only drawing and physics, and every state that lasts belongs to its system and the
save. The Dunes become five areas round the Weir; the open sea and the Raceway park each stay one, since a sail and a lap must not be
cut.

## 26. Tools that bend the rules; a sea with weather in it (South, 2026-10-27, through Calissa; PUZZLE-DUELS.md 17.4 and 18, OPEN-SEA.md 14)

- **A puzzle duel's board is its Figment's**, one board on every device (a duel is the same game on the desk and the phone): the
  Lantern Wisp's 14 x 14, measured to be as long and as winnable as the 20's with chains as deep, its cells 1.4x as big.
- **The tools bend the clearing** (South: "utilize the lachryma tools to help dictate how the tile clearing mechanics work"), each
  a modifier with its source on the board, never a new base rule: the psygun's Shoot pops a touching group (SameGame), the Soul Brush's
  Paint repaints one colour within 4 cells (Columns' magic jewel, as a class; the whole half measured at a median 19 junk a stroke and
  refused), the Crucibelle's Tune lets one colour clear at 3 for a turn (the crystals' frets: a note is a colour), the Veritome's Read
  lifts Dread's fog. Measured by the swing of one move against the hand's best swap.
- **The first duel is a lesson** (Ikaruga's prologue, Into the Breach's tutorial island): the foe's first turn idle, six verbs asked one
  at a time and done by doing them, nothing locked. **The foe's intent is shown** (Into the Breach), drawn through the fog.
- **The open sea has wind** (a real polar diagram; Wind Waker, Sea of Thieves, Pirates!): the point of sail decides the way and the fuel
  (the engine burns what the sail does not carry), so a heading is a decision and the points of sail are the lesson. Gusts to chase,
  rips to ride. The base burn was raised so a sailor who ignores the wind pays as before: skill skips grind.
- **The sea is worth sailing for:** salvage at wrecks (one crate a game day once a wreck is emptied, the charted sea's small faucet),
  the ship's parts as trades (the skiff garage's rule), beasts with one signature each whose answer is a tool (the myth is the
  mechanic: the umibozu's bottomless ladle), the mounts given arcs so where the ship lies is the fight (Sea of Thieves' broadsides),
  and a drift bottle's note that teaches dead reckoning from a written bearing (Sea of Thieves' riddles).

## 27. The genre's folds (South, 2026-10-27: "Poke around the modules, see what's there to improve ... determine what else we can fold in")

Three research passes over the prior art (the versus puzzle and tactics games; the sea, safari and hunting games; the games that tie
many activities into one progression) ranked what to fold in by fun per build effort. Built the same night:
- **The collection log** (Old School RuneScape, Yakuza 0): every module's finds as slots read from the ledger; a COLLECTIONS shelf;
  four achievements over it. COLLECTION-LOG.md.
- **The first today** (FFXIV's roulette bonus): a minute of play once a module a game day, no streak.
- **The puzzle duel** (Into the Breach, Puzzle Quest, Persona, Puyo): undo within the turn, an action point back for a big play, pool
  from chains, the all clear, margin time, a Figment's weakness (the opposite feeling). PUZZLE-DUELS.md 19.
- **The open sea** (New Pokemon Snap, Sunless Sea, DREDGE): habits as research, the docks' demand, the night a class wilder. OPEN-SEA.md 15.
Refused, as the laws already say: streaks and wall-clock gates, a second currency, missables, power from checklists, unbounded luck.
Ranked next: bundles that restore the Workshop (Stardew, Dark Cloud 2's Georama), photo to invention (Dark Cloud 2), a stakes ladder
per module (Hades' heat, Balatro's stakes), clue fog and power gems in the duel, parts from beasts and square completion at sea.
Built after: clue fog (PUZZLE-DUELS.md 19.3), the forge (a beast's part from its carves, OPEN-SEA.md 15.4), a square completed
(OPEN-SEA.md 15.5).

## 28. The endgame first, then every curve (South, 2026-10-31; docs/plans/ENDGAME.md, a plan)

STORY is a test bench for now; the curve is set backwards from the top. The summit is every track at its cap, and the domains' The World
is the long pole (2,100 hours at middling play, kept as a lifetime goal: South, 2026-10-31). The top opens three games rather than
ending one: Wells deeper and stranger, seeded by the game day; floors you author and share (Mario Maker's); and real co-op. The Wells are
the genre engine: a run is a board of spaces moved across on your own dice (Mario Party's board, Fool's Fortune's title), each space a
genre floor (a sidescroller first) that modifies the camera and the play space, never the core movement (NieR: Automata's genre shifts,
Undertale's, WarioWare's). The top is playable now as the lend panel's THE SUMMIT row (every domain at 99, every attribute
at rank 10, the palm die a d20; the ledger untouched).

## 29. Quests: someone's trouble, fixed in steps; and the recap (South, 2026-10-31; docs/plans/QUESTS.md)

A quest is for someone (Psychonauts: their trouble said plainly up front), found in the world (Tomba!'s events, with a jingle and a
splash at its start and end), and kept in a journal by state, red, yellow, green, with only the next step written (RuneScape's diary,
which never spoils past it). Its steps are predicates over the ledger, never flags; only the play time each was first seen done is
written, which the recap reads. Done quests give quest points. The recap (Xenoblade's "The Story So Far") says, on coming back, what
the last session got done, each quest's next step, and the game day's open goals. A quest's start and end get a splash and a jingle, the one
pop-up besides a title's (South, 2026-10-31). The System says all of it in a strategy guide's
voice, plain and casual (CLARITY.md 14). The first quest is Strawman's, through Strawman's Well.

## 30. Stealth: a safari of Figments (South, 2026-11-01; docs/plans/STEALTH.md)

The minds already see in a cone, fill an awareness from a glimpse to certainty and hear stimuli (Thief's guards). Stealth is the
Courier's side of that, as modifiers with sources you can see:
- **How visible you are:** your posture, your pace (stillness hides best), the hour's light, a veiling weather.
- **How loud you are:** your footsteps by the ground under them (sand quiet, metal loud), with rain covering them.
- **The watcher's rhythm:** a Figment's head down at its business, then up to scan, in bouts of its own. Deer stalking's rule: move
  while it is down.
- **Caution after a fright:** the Metal Gear phase.

It teaches fieldcraft without saying so. It is the first step of the Veritome as a safari (New Pokemon Snap's): a Figment photographed
unaware is worth half again, and the overhaul that follows rates a plate's behaviour apart from its framing.

## 31. Spirit Cooking: the hand and the clock (South, 2026-11-01; docs/plans/SPIRIT-COOKING.md, a plan)

Soul Alchemy is the eye's craft (Potion Craft's map). Spirit Cooking is the hand's and the clock's:
- **A dish** is two to four real techniques, graded on average (Cooking Mama).
- **Each move** is held near its heart in a band that practice widens, Soul Alchemy's swatch rule. Some examples:
  - sear when the surface is dry;
  - take sugar at the soft ball by the cold-water test;
  - never boil the kombu.
- **The tells** are the interface, never a thermometer.
- **What a dish serves:** a held draught that bends the next presses, and seasoning for Focus, Dexterity and Perception.
- **Clay is the kitchen:** pots from the kiln, their walls a heat you chose, a new donabe sealed with porridge.
- **A feeling's taste is what it feels like to eat** (South, 2026-11-01): Wonder cool and fizzy, Mirth sweet, Desire rich, Fury
  chilli, Gall bitter (the poison alarm), Grief salt and the onion's tears, Dread sour (the spoilage warning).
- **The hearth is in the Spirit Garden**, where the slice-of-life activities live.
- **Failure is comedy** and goes to the World Mushroom.

## 32. One Vessoul: one pool, one vessel, the mind, one clock (2026-11-01; docs/plans/SUBSTRATE.md)

South: "a small number of core parameters (like the lachryma pool), and then modify them contextually." The Vessoul is one being in
every form (hand, Jar, Courier, ship), so it has one well and one body, and every shelled thing in the world takes blows the same way.
The four substrates:
- **the pool:** ammo for what is special (a plain shot draws on the Lachryma round it), shield, fuel, boost, every cost;
- **the vessel:** health as cracks in any shelled body (the Courier, a ship, the Jar, a pot, a Figment's glaze shell), broken by a
  blow's `shatter`;
- **the mind:** afflictions, then mental state and EmO, then feelings, then behaviour;
- **the clock:** the game day and its hours.

The five damage types are how force meets a hybrid physical-psychic body: Impact cracks the vessel, and the four psychic types afflict
the mind. Feelings are downstream of both (South, 2026-11-01). A body's constitution, what it is made of, sets which type bites it
(`progress/combat/constitution.js`). The vessel's one rule is `progress/combat/vessel.js`, measured by `scripts/substrate.mjs`.

The seven Domains each answer one question every interaction asks (DOMAINS.md): when and where, in what form, what is known, with how
much force, whose, of which kind, under which rule. Anything can be done at a price (South, 2026-11-01: "The sky is the limit, anything
can be justifiable for an appropriate cost"): seven prices, from the clock to overreach (a power cast short of pool, doubled, its
shortfall cracked from the vessel) to aberrance (a creature whose rules you rewrite goes aberrant and is met by a duel). Two domains
raised together give one of 21 pairings, a move that asks both questions at once. A domain grows by shu-ha-ri (keep the form 1 to 14, break it
from 15, leave it from 60): each rung above the widening is an art opened by the domain's level or by its feat, the first relations at 15
(DOMAINS.md 16, 17), worn under the psyche's notches (Hollow Knight's budget, each switchable), an action sharing the art key's slot.

## 33. Mechs: the Jar drives a giant (South, 2026-11-02; docs/plans/MECHS.md)

South: "Giant robots. Pilotable. They should have a cradle for the Pneuka Jar to screw into ... Neon Genesis Evangelion mixed with armored
core, mixed with the giant robot sections from Ratchet and clank." And the ruling with it: **what rides is the Pneuka Jar, sealed in a
cradle or set in a saddle; the Courier rides only the Solar Skiff.** The Courier is the body that walks and holds the tools; the Jar is the
soul that drives other bodies (section 32: one Vessoul).

- **Taken:** Evangelion's entry plug (the cradle, screwed home), sync ratio (output and feedback both scale with it), the umbilical cable
  and its five minutes, the AT Field neutralised at close range, the berserk. Armored Core's assembly (nine slots, each part a trade of
  mass, load and power; four leg types) and AC6's stagger. Giant Clank's scale and its short, loud moveset.
- **Its lesson:** mass and power. a = F / m, p = m v, P = E / t, the pendulum's stride (T = 2π √(2L / 3g)) and Froude's walking limit, all
  felt in the frame's handling and never said. Sync rises when you walk with the stride, so the pendulum is the skill.
- **Its law:** a mech is its own body (a cradle of kind `body`), so the core movement is never touched. Its damage is the vessel's one rule
  (FORMS `mech`); its barrier is the pool's shield; its battery backs onto the pool.
- **Cross-module from the start:** sync's ceiling is your mental state (cook before a launch); a giant felled feeds Psychokinesis, sync
  feeds Possession; in the world (v2) its steps are the loudest noise on the island, its stomps are warp marks (sentinels come), Fury's
  lightning fills its battery, and what it throws is an Impact blow at its mass.
