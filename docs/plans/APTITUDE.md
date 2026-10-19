# Aptitude: the game as a benchmark of the one who plays it (a plan; working names)

Kept by Dovina (the measures, the evidence, the numbers). Names are Espada's and the owner's; the window is Calissa's; each mechanic's
owner emits its moments. **A plan: the order of work is in section 9, and nothing is built yet.**

> "I want to continue pushing towards designing a game that serves as a human benchmark as well, testing my own cognitive skills and
> aptitude across a wide spectrum. Big Brain Academy is cool but if I'm gonna eat my brain training veggies I want them slathered in
> butter and sautéed. To be tested and taught without ever noticing it. The thought kernel has always been 'If I was isekai'd into a
> world of cognition made magic, how would I fare?'" (the owner, 2026-10-18)
>
> "The 'you versus yourself' is a critical line... but also realize there are absolute values in the ability to execute a given task.
> Both are valuable metrics." (the owner, 2026-10-18)

## 0. The idea in one line

**The isekai status window, made true.** The System reads you as you read a creature: it starts at ??? and decrypts, aptitude by
aptitude, as your play gives it evidence. The numbers are measured from what you did, not from what you said about yourself.

## 1. The rules

1. **Stealth assessment.** No quiz and no test screen. Every aptitude is read from a mechanic played for its own sake. The mechanic is
   the lesson and the test (DESIGN.md 22: every system teaches something real without saying so).
2. **Two numbers for each aptitude, both kept:**
   - **the absolute**: in the task's own unit (milliseconds, cents of pitch, items held, d′, moves over the fewest). These are true for
     anyone.
   - **the relative**: you against yourself (your first reading, your best, your recent median, your rate of learning).
   - Never a percentile, a rank against others, or a single IQ-like score.
3. **No claim beyond the measure.** The game reports what you did, in its unit. It never claims to diagnose, treat or improve anything.
4. **Learning is data.** You get better at what you repeat (the power law of practice), so a reading taken once measures little. The
   learning curve is kept and shown: where you started, how fast you rose, where you level off.
5. **A measure needs fixed conditions.** A number compared across time must be taken the same way each time: the same seed, the same
   setup, the same rules. So there are two kinds of reading:
   - **a passive reading**, from ordinary play, with its conditions logged. It is noisy, plentiful and relative only.
   - **a standard trial**, a fixed variant of a mechanic, begun in its room like every trial (CLAUDE.md, Scope). It is clean and gives
     the absolutes.
6. **A measure never changes a mechanic.** A standard trial is its own variant with a visible source (the design laws: base change
   bad, modifiers good). Ordinary play is never bent to measure it.
7. **Only you.** The readings are yours and private: no one else sees them unless you allow it (the owner, 2026-10-16). An agent's
   play never counts. Nor does anything done under a lend, a preset or a debug chest (the DEBUG save).

## 2. How the professionals have done it (and what each gives)

- **Stealth assessment and evidence-centred design** (Valerie Shute; Robert Mislevy). Name the ability, name the evidence (what a
  player who has it does), score the evidence inside play. *Physics Playground* measured qualitative physics as players drew ramps,
  levers, pendulums and springboards to guide a ball, with no test anywhere. Taken: the whole method, and the god hand's puzzles
  (section 5).
- **Sea Hero Quest** (Hugo Spiers' group at UCL, with Deutsche Telekom; Coutrot et al., 2018). A boat game about navigating by memory;
  millions of players made it the largest dataset of human navigation, validated against navigation in real streets. Taken: fixed
  levels as the standard trial, and navigation as an aptitude (the Wells, the Sight).
- **NeuroRacer to EndeavorRx** (Gazzaley's lab; Anguera et al., *Nature*, 2013). Driving while answering signs measures multitasking
  cost. Taken: a measure is a task done under load, against the same task done alone.
- **The Cambridge Brain Sciences battery** (Hampshire, Highfield, Parkin and Owen, 2012). Twelve classic tasks played online by tens of
  thousands of people; they factor into reasoning, short-term memory and verbal ability. Taken: no one test is "intelligence"; a
  profile of several is honest.
- **The Human Benchmark site.** Reaction time, the chimp test, number and verbal memory, aim: absolute units and your own history.
  Taken: the absolute number is legible and fun on its own.
- **Psychophysics** (the transformed up-down staircase, Levitt 1971; signal detection theory, Green and Swets). A threshold (the
  smallest pitch step you hear, the smallest colour step you see) is found by stepping difficulty to your edge; d′ separates seeing from
  guessing. Taken: crystal tuning and the press are already staircases waiting to be read.
- **Item response theory, and Elo for puzzles** (chess puzzle ratings, language apps). A puzzle's difficulty and a player's skill are
  rated from the same attempts. Taken: puzzles rated by play, not by our guess.
- **The map of abilities: Cattell-Horn-Carroll** (fluid reasoning, comprehension-knowledge, working memory, processing speed,
  visual-spatial, auditory, long-term retrieval, reaction time, quantitative). Taken: as the checklist of what is covered and what is not.
- **Big Brain Academy** (the owner's vegetables): every task a toy, one at a time. What it lacks, and we add, is the world: the task is
  a thing you were doing anyway.

## 3. The aptitudes, their lab tasks, and where Fool's Fortune already has them

| aptitude (CHC) | the lab task | absolute unit | already in the game | status |
|---|---|---|---|---|
| reaction time (Gt) | simple and choice reaction time | ms | the parry window; the first stun noticed (STUN-DEPTH.md) | events exist |
| inhibition | Go/No-Go, the stop-signal task | d′, % false alarms | the rail: plain shots are shot, outlined shots only parried | events exist |
| tracking (Gv) | multiple object tracking (Pylyshyn) | items tracked | the lock-on's eight targets | events exist |
| visual search (Gs) | visual search (Treisman) | ms per item | the Veritome: finding a subject; the scan's ??? | partly |
| navigation (Gv, Glr) | Sea Hero Quest, wayfinding | path over the shortest, % | a Well's floors (new each game day), the Sight, the map | events exist |
| pitch (Ga) | pitch discrimination threshold | cents | tuning a crystal to its fret by ear | events exist |
| timing (Ga, Gt) | synchronised tapping | ms asynchrony, its spread | the rhythm mode, busking, the Crucibelle's beat | events exist |
| colour (Gv) | colour discrimination | ΔE in Oklab | the press at the Athanor: firing inside a tile | events exist |
| planning (Gf) | Tower of London | moves over the fewest | the macro lattice (fitting Functions into a path) | events exist |
| risk | BART (pump until it may pop), the Iowa Gambling Task | expected value kept, % | the Lockheart's wheel, Raku's tables, the wager | events exist |
| reading others | Reading the Mind in the Eyes | % | Nebula Bluff's tells | events exist |
| model-based planning | Daw's two-step task (2011) | the model-based weight | Luck (the surprise lived through, in bits) | partly |
| explore or exploit | the horizon bandit task (Wilson et al., 2014) | % exploring when it pays | where to dig, which crystal, which table | a gap |
| language learning (Glr) | artificial grammar learning | words learned per hour | neuralese, the ostraca, the stele | events exist |
| category learning | category learning | facts per kind | familiarity, the bestiary | events exist |
| qualitative physics | *Physics Playground* | solved, matter over par | **the god hand** (section 5) | to build |
| mental rotation (Gv) | Shepard and Metzler | ms per degree | the puzzle fights (section 6) | to build |
| working memory (Gwm) | the Corsi blocks, the n-back | span (items) | none yet (a call and answer in the rhythm mode would be one) | a gap |
| task switching | the Wisconsin card sort, switch cost | ms of switch cost | the finisher's choice after a stun, once stun depth is built (STUN-DEPTH.md) | a gap |

Most of the evidence is already on the bus. The first work is reading it, not building anything new.

## 4. How a reading is taken (the data)

- A mechanic's owner emits its moment as it does today (a parry, a shot at sea, a crystal tuned). Dovina's tracking rules turn the
  events into **samples**: `{ aptitude, value, unit, conditions, at }`.
- **An aptitude module** (not built) keeps the samples: a short history per aptitude, and per standard trial its own. It derives:
  - the first reading, the best, and the recent median;
  - the spread (consistency);
  - the learning rate (a power-law fit over the attempts).
- The ledger keeps counts and records (`aptitude.<id>.n`, a record of the best), so an achievement can read them, as every achievement
  does.
- A sample is dropped when its conditions say it does not count: an agent driving, a lend, a preset, a debug chest, a paused clock.

## 5. The god hand as the physics playground (the owner, 2026-10-18)

The hand already moves the island's matter: Sculpt raises creations (a pillar, an arch, a ramp), loose matter slumps, and Lachryma and
crude flow (`godhand/matter.js`, `creations.js`). That is a physics sandbox. A puzzle gives it a goal:
- **A goal**: bring something that rolls or flows (a bauble, a pot, a stream of Lachryma) to a mark, using only what the hand can do.
- **Each level aims at one idea** (*Physics Playground*'s evidence model): slope and gravity, momentum, flow and pooling, balance.
- **What is read:**
  - solved or not;
  - the time to the first solution;
  - the matter moved against the level's par (efficiency);
  - the attempts before success (persistence);
  - which kinds of solution you found across the levels (flexibility).
- **Prior art:** *From Dust* (routing water and lava by moving the ground), *Physics Playground*, *The Incredible Machine*, *Poly
  Bridge*.
- **Its room** is the Touchstone (section 10; raids keep the siege).

## 6. The puzzle fights (the owner's next module, to be discussed)

Turn-based fights with the aberrant Figments, with Sokoban, Magical Drop and falling-block puzzles in them. Each fills a gap in
section 3:
- **Sokoban** is planning (moves over the fewest, as the Tower of London scores it).
- **Falling blocks** is mental rotation and speed.
- **Magical Drop** is visual search and speed under pressure.
- **The turn order** is decision-making.

The design waits for the owner's talk; this section only marks where it would plug in.

## 7. How it is shown

- **The System reads you as you read a creature** (OVERLAY.md 17). An aptitude with too few samples reads ??? in the running hand. It
  decrypts to its absolute number after five readings, and shows its curve after twenty.
- **Where**: the Codex's STATUS shelf, beside the domains and the attributes, and as a System window summoned before the Courier (the
  isekai status sheet). The look is Calissa's.
- **What it is called** (Espada, 2026-10-18, proposed): **an aptitude** is one measured ability; the window is **the Assay**,
  and a standard trial is **an assay** (an assay tests a metal's true content; it is the same word as *essay*, a trial). It is neither an attribute (Soul Alchemy's seven) nor
  a domain (the seven skills of the psyche): those count what you practised, and this measures how you did it.

## 8. How we would know a reading means something

- **The same person, across game days**: a reading that swings wildly between days with no practice in between is noise. It is
  dropped or redesigned.
- **Against the lab task**: a QAIS test where the owner plays the standard lab version (a reaction-time box, the Corsi blocks, a
  pitch staircase), compared over several sessions with what the game read.
- **Against a known player**: a bot with a set reaction delay and a set error rate plays the trial headless. The reading must give its
  settings back. This tests the measuring, not a person; no bot's play is ever kept as a reading.

## 9. Order of work

1. **The passive readings from events that already exist**: reaction time, inhibition, pitch, timing, colour, tracking, risk.
   - To build: the aptitude module and its tracking rules (Dovina).
   - The save section is Petra's to approve.
2. **The bot check** (section 8) for each reading in step 1 (Dovina, on the agent).
3. **The window**: names (Espada), look (Calissa).
4. **The standard trials, one at a time.** First the rail's Go/No-Go (d′), then the crystal's pitch threshold (cents), the press's colour
   threshold (ΔE), and the rhythm mode's asynchrony (ms).
5. **The Touchstone**, then the god hand's puzzles in it (section 5).
6. **The puzzle fights** (section 6), with the owner's module.

## 10. Ruled (the owner, 2026-10-18)

1. **The record does not survive a new build.** It resets with the rest of the progress ("too much is changing every week"). It is a
   save section of scope `player`.
2. **An agent's play never counts** (rule 7).
3. **The Assay has a room of its own: the Touchstone** (Espada's name, proposed). The standard trials and the god hand's puzzles
   are begun there.
   - A touchstone is the black stone a goldsmith streaks gold across to tell its purity: dark stone where what you do leaves a streak
     (Calissa's to dress).
   - Why the System keeps it: everywhere else, what you do is mixed with the weather, the creatures, the hour and luck. The Touchstone
     is the one room with nothing else in it, so the streak is only yours. Those are the fixed conditions (rule 5).
   - Its place in the Index's list is next.
4. **A standard trial is announced as one** ("sometimes it's good to know you're being tested"). The passive readings stay silent,
   and the window shows what the System saw.
