# The Great Slip Jelly, overhauled: an extreme trial (the owner, 2026-10-07)

Kept by Dovina. A spec for the owner's cut. **Petra builds the fight and the room, Calissa the looks and telegraphs, Wanda the music,
Espada the names.** Units: real seconds (the fight's clock), plain blows (power 1: a slip jelly bursts at 8), metres.

> "The Great Slip Jelly was supposed to be like a raid boss, on the level of an FFXIV extreme trial. I ran through the well and was
> both laughing and so disappointed when I finished slapping around a slipjelly slightly bigger than the others and the log
> notification popped up that I had defeated the 'great' slipjelly. Is stuff getting lost in translation on the way to Petra? I
> didn't see any egg broods or any of the drop items you had mentioned."

## 0. What went wrong (measured, not guessed)

1. **Nothing of the Dunemaw's systems was built.**
   - The crown, the ram, the nursery, the finds and the arena are data in `src/progress/combat/dunemaw.js`, with log rules in
     `tracking/dunemaw.js`.
   - **No game code reads the data, and no game code emits their events.** `node scripts/unbuilt.mjs` (new, this round) lists all
     seven: `foe.crack`, `foe.break`, `foe.end`, `clutch.break`, `find.take`, `floor.shift`, `trial.solar`.
   - The handoffs (`docs/handoffs/petra/2026-10-06-from-dovina-dunemaw-systems.md` and `-the-arena.md`) are still unread in Petra's
     folder. Every round since, newer requests went ahead of them, and nobody, Dovina included, checked that the work landed.
   - The FOE in the game is a slip jelly of class 2: 8 × 3 = 24 health, 1.6 times the size (`creatures/jelly/slipjelly.js`). That is
     what the owner slapped.
2. **The spec itself aimed too low.** DUNEMAW-SYSTEMS.md gave the FOE 48 health, "six slip jellies' worth": a mini-boss, not a raid
   boss. This document replaces its section 1.
3. **The fix to the process** (Dovina's, from now on):
   - `scripts/unbuilt.mjs` runs every round; what it lists goes in the round's report to the owner.
   - Every spec ends in an **acceptance list** the owner can tick, which becomes QAIS tests.
   - A handoff not built within two rounds goes to the owner's digest, so the owner sees the queue.

## 1. The target: what "extreme" means here

FFXIV's extreme trials, translated to one player with the Courier's tools:

| FFXIV's extreme | here |
|---|---|
| a **scripted timeline**: the same mechanics in the same order every pull, learned by wiping | the fight is a timeline of named casts (section 3); the timings never change, only the targets |
| the **cast bar** names the attack before it lands | the log says the cast's name as it begins ("The Great Slip Jelly readies Brine Cascade."); its windup carries the outline where it can be parried (PARRY.md) |
| extremes hide the ground markers that normal mode shows | Normal draws every area on the floor in labradorite (OVERLAY.md: line shows what you know); Extreme draws none: you read the cast and the body |
| tank, healer, damage | solo: the **tankbuster** is a parry or a roll; the **healer check** is your pool (raidwides take a set share of it; baubles and guard timing keep you up); the **damage check** is the enrage |
| **phases and transitions** that remake the arena | four phases; the arena changes at each (section 3) |
| **adds** that must die before they reach the boss | the brood (DUNEMAW-SYSTEMS.md's nursery), now a mechanic |
| a **hard enrage** | at 9:30 the Dunemaw swallows the arena |
| **totems** traded for gear, a rare **mount** drop | crown shards traded at Raku's for looks; a rare drop (section 5) |

**Length:**
- An expert clear takes about **8:00**, against a hard enrage at **9:30**: about 15% slack, the margin FFXIV leaves at the item level a
  fight is tuned for.
- A first clear is meant to take **an evening of pulls** (10 to 30).

## 2. Two difficulties

- **Normal:** the run's FOE, as the Well has it today.
  - Every area is drawn on the floor; the timeline runs at three quarters speed.
  - There is no enrage, and the health is a third.
  - It is the version every player meets, and its pay is the run's (DUNEMAW-SYSTEMS.md's two endings).
- **Extreme:** the full fight.
  - It is begun at the **Lip Stone** on the bowl's ledge (a trial is begun in its own room: CLAUDE.md), offered once you have reached
    the bowl.
  - **A wipe costs the attempt only** (the run below is not lost): an extreme is learned by wiping, and losing a forty-minute run per
    wipe would make it unlearnable. The Lip Stone is not a Shrine (no respawn point in a Well, the owner's rule). It is the trial's own
    start, as a gong is the drills'.
  - Its pay is its own (section 5).

## 3. The timeline (Extreme; times in real seconds from the pull)

**Health: 840 plain blows**, placeholder. It is sized as seven minutes of a good player's sustained damage (about 2 plain blows a real
second, to be measured with Strawman's bout line, `strawman.bout`), so that a good player meets the enrage and an expert clears with a
minute to spare. **It is measured before it is final.**

### Phase 1: the Crown (100% to 65%, 0:00 to about 2:40)

The crown cracks to its own rams into pillars (DUNEMAW-SYSTEMS.md, kept). Until it breaks, the body takes a quarter.

| time | cast | read | answer | if missed |
|---|---|---|---|---|
| 0:08 | **Crown Bash** (tankbuster) | it rears and lunges at you; the windup outlined | parry (V) or roll | 60% of your pool and **Brine Soaked** (the next hit doubled, 20 s) |
| 0:20 | **Brine Line** (the ram) | it scrapes, then charges where you stand | stand before a pillar and step aside: it cracks its own crown | a hit; a ram into open floor cracks nothing |
| 0:35 | **Gelid Rings** (out, then in) | ripples rise round it: a ring of slip at its feet, then one far out | out of the first, then back in | a hit each, and slowed 3 s |
| 0:50 | **Ooze Rain** (baited puddles) | three drops follow you, a second apart | lead them to the rim; each leaves a puddle that stays 60 s | puddles in the middle cost you the floor for the rest of the phase |
| 1:05 | **Brine Line** ×2 | two charges, the second from where the first ended | two pillars | as above |
| 1:30 | **Crown Glare** (gaze) | the crown's eye opens over a bar | look away, or **through the Veritome**: the lens turns its gaze back and it is stunned 4 s | stunned 3 s yourself |
| … | the cycle repeats, faster | | | |

The **Crown Break** (all three stages cracked): it reels 4 real seconds, every blow ×3 (kept).

### Transition: the Clutch Wakes (65%, about 30 s; the boss cannot be touched)

- It sinks into the dish. **The Slip Nova**, a raidwide, takes 40% of your pool, unavoidable. Guard (V held) at the flash to take
  half.
- **Brood:** the eight clutches round the rim (DUNEMAW-ARENA.md) hatch in pairs, at 2 a clutch still whole. Each brood that reaches
  the dish **heals it 2%** and grows a crown plate back.
- **The nursery's choice becomes a mechanic.** Every clutch broken before the pull is two brood it cannot call.
- **The arena changes:** the rim shallows flood with slip (slow), and fallen pillars become islands.

### Phase 2: Bare (65% to 30%, about 3:10 to 6:30)

The core is exposed and moves: the core takes ×2, the body ×0.5.

| cast | read | answer |
|---|---|---|
| **Sinking Sands** | the floor slides toward it at 0.8 m/s, then 1.5 | stand on islands (rubble, fallen pillars) |
| **Submerge** and **Surface Slam** | it sinks for 3 s; the slip rings 1.2 s before it surfaces under you | move off the rings |
| **Brine Cascade** (cone) | it turns to face you, and the cone is outlined in Normal only | get behind it |
| **Crown Bash** | as in phase 1, now followed at once by **Gelid Rings**, in or out (the order told by which way its crown tilts) | parry, then read the tilt |
| **Brood Call** | two brood from each clutch still whole | kill them before they reach it |

### Phase 3: Calving (30% to 0%, 6:30 to the end)

- **Calving:** it splits into **four calves**, one a quadrant, sharing its health. Kill all four within 30 s or they re-merge and heal
  10%. This is the damage check. A calf left alive is the commonest wipe, as an add left up is in FFXIV.
- After the re-merge (or the kill), it is whole and small, and casts everything faster: Crown Bash, Brine Line, Ooze Rain, Gelid Rings,
  Brood Call.
- **The Slip Nova** at 15%: as before, 40% of the pool.
- **The Overflow** (its desperation, 5%): the whole floor is slip, and only the islands hold. Every remaining clutch hatches at once.

### The enrage: at 9:30, The Dunemaw Swallows

The Well's mouth closes over the bowl. You are swallowed; the attempt ends.

## 4. Reading the fight (the overlay, the log, the sound)

- **The cast:** the log says its name as it begins; the body shows its windup; parryable windups wear the Lachryma outline
  (PARRY.md).
- **Normal** draws every area in labradorite on the floor; **Extreme** draws none (FFXIV's extreme convention).
- **Wanda's cue** marks every phase on a bar (Thunder Force's musical boss): the transition's breath, the Calving's turn, the
  Overflow's last section.
- **The pool's band** (the battle ring) is the healer check: the raidwides take a set share, so you can see whether you will survive
  the next one.

## 5. What it pays

**Normal (the run's FOE): as DUNEMAW-SYSTEMS.md specified, and none of it is built yet:**
- the two endings (burst or reprogram);
- the crown shard;
- the brood's slip roe;
- the finds.

**Extreme:**
- **A crown shard of the extreme kind, every clear** (FFXIV's totem), up to one a game day (the Dunemaw turns over daily). Raku trades
  them: four for the **Jelly-crown glaze** (a court-tier look), six for a **slip jelly to ride** in the Dunes (a mount; Calissa's).
- **A rare drop:** a deck of 12, certain by the twelfth clear. It is the **Crown of the Dunemaw**, a curio of the highest tier, and the
  achievement's title.
- **First clear:** a title, and the achievements below.
- **No cubes beyond Normal's:** the Extreme's pay is looks and standing, so the economy is not bent by the hardest content (DESIGN.md:
  nothing but luck pays more than 1.5× the aim).

**Achievements, under THE WELLS** (when built):
- clear Extreme;
- clear it without being hit by a tankbuster;
- clear it with every clutch broken before the pull;
- clear it with the enrage more than a minute away;
- turn its gaze back with the Veritome.

## 6. Acceptance (the owner ticks these; each becomes a QAIS test)

1. Reaching the bowl's ledge shows the FOE before the fight (the reveal); clutches stand round the rim with eggs, and jellies guard
   them.
2. Breaking a clutch before the pull leaves fewer brood in the transition; the log counts it.
3. In Normal, the crown cracks when it rams a pillar; a pillar cracks, then falls; the crown breaks in three rams.
4. The log names every cast as it begins; Crown Bash can be parried.
5. At 65% it sinks, the Slip Nova lands, and the brood hatch and heal it if they reach it.
6. At 30% it calves into four; leaving one alive for 30 s heals it.
7. In Extreme, the enrage swallows the arena at 9:30; a wipe returns you to the Lip Stone, the run below kept.
8. Finds, slip roe and the crown shard come home in the haul.

## 7. Who builds what, in gates

**The process rule for every gate:** `node scripts/unbuilt.mjs` must list nothing of the gate's events before the gate is called done.

| gate | builds | who |
|---|---|---|
| **D1: what was specified and never built** | the bowl (DUNEMAW-ARENA.md), the crowned FOE's phase 1 and bare phase, the nursery and its brood, the finds, the two endings | Petra; looks Calissa (the urn crown and the finds' looks exist: `vfx/urncrown.js`, `vfx/finds.js`) |
| **D2: the timeline** | a **timeline runner**, a new part in `creatures/ai/` built once (a scripted fight is not utility reasoning: FFXIV's bosses are timelines). Each cast is a windup, an area and an effect; Normal and Extreme from one script | Petra; the casts' numbers mine (a data module, `progress/combat/extreme.js`, when the owner cuts this) |
| **D3: Extreme** | the Lip Stone, the wipe and retry, the enrage, Calving, the Overflow, the pay | Petra; Calissa's telegraphs; Wanda's phases; Espada's cast names |

## 8. Open for the owner

1. **A wipe in Extreme costs the attempt, not the run** (the Lip Stone is the trial's own start, not a Shrine). Agree?
2. **Normal stays the run's FOE**, with the run's risk. Extreme is optional, its pay looks and standing, not cubes. Agree?
3. **Health is a placeholder** until Strawman measures a good player's sustained damage. Do you want to set the target clear time
   yourself (8 minutes here), or should I hold it to FFXIV's 8 to 10?
