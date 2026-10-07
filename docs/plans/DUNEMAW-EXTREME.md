# The Great Slip Jelly, overhauled: a raid boss in the style of an extreme trial (the owner, 2026-10-07)

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
| extremes hide the ground markers | the floor shows only what persists (a puddle, the slip); an attack is read from its cast and its body, never from a marker drawn for it |
| tank, healer, damage | solo: the **tankbuster** is a parry or a roll; the **healer check** is your pool (raidwides take a set share of it; baubles and guard timing keep you up); the **damage check** is the enrage |
| **phases and transitions** that remake the arena | four phases; the arena changes at each (section 3) |
| **adds** that must die before they reach the boss | the brood (DUNEMAW-SYSTEMS.md's nursery), now a mechanic |
| a **hard enrage** | at 9:30 the Dunemaw swallows the arena |
| loot | **no tokens, no second currency** (the owner): a cosmetic drops from the boss, guaranteed, when its achievement's criteria are met in the fight (section 5) |

**Length:**
- An expert clear takes about **8:00**, against a hard enrage at **9:30**: about 15% slack, the margin FFXIV leaves at the item level a
  fight is tuned for.
- A first clear is meant to take **an evening of pulls** (10 to 30).

## 2. One fight (the owner, 2026-10-07)

- **There is one difficulty.** "Extreme" was the owner's word for the *style* of fight, not a mode. Content is not padded with tiers;
  an easier or a harder fight is a new fight.
- **It is the run's FOE.** It keeps the last floor's bowl, its pay is the run's, and its two endings (burst or reprogram,
  DUNEMAW-SYSTEMS.md) stand.
- **A wipe costs the attempt, not the run** (the owner: yes).
  - On reaching the bowl's ledge, the **Lip Stone** marks the fight's start.
  - A shatter in the fight makes you whole at the Lip Stone with the run kept: the floors, the haul, the clutches you broke.
  - The Lip Stone is not a Shrine (no respawn point in a Well, the owner's rule). It is the fight's own start, as a gong is a drill's.
  - The Wake Whistle still takes you out with the haul.

## 3. The timeline (times in real seconds from the pull)

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
| **Brine Cascade** (cone) | it turns to face you, its maw swelling for a bar | get behind it |
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
- **No floor markers** for attacks (FFXIV's extreme convention, the style the owner asked for). Only what persists is drawn: puddles,
  the slip, the brood's paths.
- **Wanda's cue** marks every phase on a bar (Thunder Force's musical boss): the transition's breath, the Calving's turn, the
  Overflow's last section.
- **The pool's band** (the battle ring) is the healer check: the raidwides take a set share, so you can see whether you will survive
  the next one.

## 5. What it pays (the owner, 2026-10-07: "Lachrymite cubes are the one and only currency... achievements and skill dictating
your progression and cosmetics")

**The run's pay:** as DUNEMAW-SYSTEMS.md specified, and none of it is built yet:
- the two endings (burst: the FOE's pay in cubes now; reprogram: half now and its brood for the Spirit Garden);
- the brood's slip roe and the finds (materials for the garden's beds and features);
- no crown shard (withdrawn: no item that exists only to be traded).

**Cosmetics, guaranteed by skill:** when an achievement's criteria are met **in the fight**, the boss drops its cosmetic directly,
every time. There are no tokens, no trades and no odds.

| achievement (met in the fight) | what drops |
|---|---|
| beat it | the **Jelly-crown glaze** (a court-tier look for the Courier's glaze regions) |
| beat it without being hit by a Crown Bash | the **Crown of the Dunemaw**, a curio of the highest tier (the Book's rarest) |
| beat it with every clutch broken before the pull | a **slip jelly to ride** in the Dunes (Calissa's) |
| beat it with the enrage more than a minute away | a **title** |
| turn its gaze back with the Veritome | a **kiln pattern** of the crown's eye for any glaze |

These are achievements in THE WELLS (predicates over the ledger, so they are retroactive). The fight emits what they read (`foe.end`
with its conditions met), and the drop is the boss's.

## 6. Acceptance (the owner ticks these; each becomes a QAIS test)

1. Reaching the bowl's ledge shows the FOE before the fight (the reveal) and the Lip Stone; clutches stand round the rim with eggs,
   and jellies guard them.
2. Breaking a clutch before the pull leaves fewer brood in the transition; the log counts it.
3. The crown cracks when it rams a pillar; a pillar cracks, then falls; the crown breaks in three rams.
4. The log names every cast as it begins; Crown Bash can be parried.
5. At 65% it sinks, the Slip Nova lands, and the brood hatch and heal it if they reach it.
6. At 30% it calves into four; leaving one alive for 30 s heals it.
7. The enrage swallows the arena at 9:30; a wipe returns you to the Lip Stone with the run kept.
8. Finds and slip roe come home in the haul; meeting an achievement's criteria in the fight drops its cosmetic, every time.

## 7. Who builds what, in gates

**The process rule for every gate:** `node scripts/unbuilt.mjs` must list nothing of the gate's events before the gate is called done.

| gate | builds | who |
|---|---|---|
| **D1: what was specified and never built** | the bowl (DUNEMAW-ARENA.md); the crowned FOE's phase 1 and bare phase; the nursery and its brood; the finds; the two endings | Petra; looks Calissa (the urn crown and the finds' looks exist: `vfx/urncrown.js`, `vfx/finds.js`) |
| **D2: the timeline** | a **timeline runner**, a new part in `creatures/ai/` built once (a scripted fight is not utility reasoning: FFXIV's bosses are timelines). Each cast is a windup, an area and an effect, and the script is data | Petra; the casts' numbers mine (`progress/combat/greatjelly.js`, when the owner cuts this) |
| **D3: the whole fight** | the Lip Stone and the retry, the transition, Calving, the Overflow, the enrage, the drops by achievement | Petra; Calissa's windups; Wanda's phases; Espada's cast names |

## 7a. The casts' names (Espada, 2026-10-07; `docs/LORE.md`; in `greatjelly.js` NAMES)

Each name is a jar's part or a potter's step, and each also tells you what to do:

| placeholder | name |
|---|---|
| Crown Bash | Lidfall |
| Brine Line | Shoulder Charge |
| Gelid Rings | Throwing Rings |
| Ooze Rain | Slip Trail |
| Crown Glare | Eye Cup (the Greek eye-cup that stares evil back; the Veritome turns it) |
| the Clutch Wakes | Unstopped |
| the Slip Nova | Blowout |
| Brood Call | Broodwake |
| Sinking Sands | Centring |
| Submerge, Surface Slam | Slake, Wedge |
| Brine Cascade | Decant |
| Calving, the calves | Sherds ("the sherds mend" when they re-merge) |
| Brine Soaked | Sodden |
| The Overflow, The Dunemaw Swallows | unchanged |

**Events for the log** (rules in `tracking/dunemaw.js`):
- `foe.cast { cast }` (the cast's id, e.g. `crownBash`): the log says "The Great Slip Jelly readies Lidfall."
- `foe.moment { what }`, one of `crack`, `mirror`, `sink`, `feed`, `sherds`, `mend`, `sodden`, `dry`, `swallowed`: Espada's lines.

## 8. Settled by the owner (2026-10-07)

- **A wipe costs the attempt**, not the run.
- **One difficulty.**
- **No currency but cubes.** Cosmetics drop by achievement, guaranteed.
- **About 8 minutes** against a 9:30 enrage. Health is a placeholder until Strawman measures a good player's sustained damage.
