# The build: everything the owner has asked for, in rounds (the owner, 2026-10-07: "Plan out the full build for all that we've
discussed, wake up the sisters to get it built")

Kept by Dovina. One page that says what is built, what is not, and who builds what in which round, so nothing is lost in a queue again.
**The rule of every round:** a round is done when its gates pass, and `node scripts/unbuilt.mjs` lists none of the round's events (Petra
reports it in the gate). A handoff not built within two rounds goes to the owner's digest.

## 1. Where everything stands (measured 2026-10-07 on main, v94)

| what | spec | built? |
|---|---|---|
| the Soul Brush's load, the Lachrymato Bottles, blots, paint and mop | SUNSHINE-SYSTEMS.md | **built** |
| V as the parry per tool, the outline | PARRY.md | **built** |
| the Veritome's clock, the Dreamvane's vane and forecast, the metronome | OVERLAY.md | **built** |
| Shrines, the Wake Whistle, the Spirit Garden's name | SHRINES.md | **built** (the Pearl Shrine with Margarite's dock, v94) |
| the crossing: views, set pieces, long crossings, the continue, mounts | RAIL.md | **built** (v94) |
| **the Great Slip Jelly**: the bowl, the crown, the nursery, the finds, the endings | DUNEMAW-SYSTEMS.md, DUNEMAW-ARENA.md | **not built** (seven events unemitted) |
| **the Great Slip Jelly as a raid fight**: the timeline, phases, the Lip Stone | DUNEMAW-EXTREME.md | **not built** |
| **the Solar Skiffing trial** | DUNEMAW-SYSTEMS.md section 4 | **not built** (`trial.solar` unemitted) |
| **the catch** (the Lockheart's summoning coffin; the god hand in battle) | SYSTEMS.md C2; SPIRIT-GARDEN.md 5a | **not built** (`catchOdds` read by nothing) |
| **busking** | SYSTEMS.md D5 | **built, unreachable**: the rhythm mode, its charts and its pay exist; nothing in the world begins it (only `/rhythm`) |
| **the Spirit Garden as a place** | SPIRIT-GARDEN.md | **not built** |

## 2. The rounds

Every division works in parallel within a round; Petra merges at the round's end.

### Round 1: what was promised and never built, and what the garden stands on

| division | builds |
|---|---|
| **Petra** | **D1, the Great Slip Jelly as specified:** the bowl (DUNEMAW-ARENA.md), the crowned FOE (crown cracked by its rams into pillars, the reel, the bare phase), the nursery (clutches, eggs, guards, brood), the finds, the two endings. **The catch:** the Lockheart's summoning coffin (catch wheel at `catchOdds`), and the god hand's catch in battle (grab a stunned Figment, hold it over the Jar's mouth through its struggle); both emit `spirit.bind`, and the bound wait in the Jar. **Busking reachable:** a busker's mat on each pier (Old Grog's, Margarite's dock); F at it with the Crucibelle worn begins the rhythm mode (a trial begun in its own room) |
| **Calissa** | the bowl's dressing (pillars that crack then fall, stalactites, rim shallows); clutches and eggs, the brood; the crown's three crack stages (her urn crown exists); the catch's looks (the coffin's catch, the Figment's struggle over the Jar's mouth); the busker's mat |
| **Wanda** | the Great Slip Jelly's fight cue in phases (the crown, the clutch waking, bare, calving, the overflow, the enrage), each transition on a cast; the catch's sting |
| **Espada** | the casts' names (Crown Bash, Brine Line, Gelid Rings, Ooze Rain, Crown Glare, the Slip Nova, Calving, the Overflow, The Dunemaw Swallows: placeholders, hers to improve); the Firings' words; the Inner Realm's name generator in her conlang; spirit kinds' names |
| **Dovina** | the fight as data (`progress/combat/greatjelly.js`: the timeline of casts with their windups, areas, effects and times); the spirits as data (`progress/garden/spirits.js`: stats, feeding, bond, alignment, forms, merging); the Firings (a ledger predicate); the catch's struggle times; the log's rules and the achievements (the fight's drops by achievement); a gardener profile in `scripts/economy.mjs` |

### Round 2: the raid fight, and the garden's ground

| division | builds |
|---|---|
| **Petra** | **D2:** the timeline runner (a part in `creatures/ai/`, built once: a scripted fight is a timeline) reading `greatjelly.js`. **D3:** the whole fight: the Lip Stone and the retry, the transition, Calving, the Overflow, the enrage, the drops by achievement. **G1:** the garden's planetoids (the Dantian, the Terraces, the Furnace, the Pavilions, the Grove, the Peak); the Jar's own controller with Galaxy gravity; the god hand over the garden; launch lotuses; the door from the Shrines and the shed; the beds, the Furnace and the slots moved onto their planetoids; the bound hop out into the Grove |
| **Calissa** | the fight's windups (no floor markers: the body is the telegraph), the calves, the overflow; the garden's look (Dual Hearts: soft light, clouds, spirit veins), the planetoids, the Jar hopping |
| **Wanda** | the garden's cue (the inner world, by the day's phase and your draught) |
| **Espada** | the garden's planetoids' names; the first-entry naming of the Inner Realm |
| **Dovina** | the casts' numbers measured against Strawman (a good player's sustained damage sets the health); the garden's economy measured |

### Round 3: the god game

| division | builds |
|---|---|
| **Petra** | **G2:** sculpting the planetoids (the hand's clay on a sphere, within a band of the radius), leading water, plots and placement, the Wu Xing formation bonuses. **G3:** spirits raised: feeding, drills, pet and flick, bond, forms, their work, one out with you |
| **Calissa** | features (pavilions, terraces, lanterns, spirit houses, formation stones), the sculpt brush's look, spirits' 15 forms a kind (placeholders first) |
| **Wanda** | the spirits' voices (Chao-like), the sculpt's sound |
| **Dovina** | the features' catalogue and costs, the formation numbers, the spirits' growth curves |

### Round 4: awakening, visitors, merging, the Firings

| division | builds |
|---|---|
| **Petra** | **G4:** plates awakened at the Furnace's shrine, Lachrymite fossils dug in the Dunes and awakened by the Crucibelle's song, wild visitors drawn by what the garden offers (the ecology's offers), merging in the cocoon tree. **G5:** the Firings and the tribulation at the Peak. **The Solar Skiffing trial.** |
| **Calissa** | the cocoon tree, fossils, the tribulation's sky |
| **Wanda** | the tribulation's cue, the awakening song |
| **Dovina** | visitors' wants, merging's inheritance, the tribulation's pace |

## 2a. Dovina's Round 1 part: done (this commit)

- `src/progress/combat/greatjelly.js`: the fight as a script: thirteen casts (windup, area, effect, answer), five phases looping
  faster each time, the enrage at 570 real seconds, health 840 (a placeholder for Strawman's measure), and the cosmetics guaranteed by
  achievement (`DROPS`, `dropsFor`).
- `src/progress/spirits.js`: five stats, feeding by what the game drops, alignment by the hand, fifteen forms a kind, merging, the
  Firings (a ledger predicate with no ceiling), the god hand's catch (a second of struggle a class).
- **The log's rules and counts:** `foe.cast` (the cast named as it begins), `foe.wipe`, the drops, `spirit.*`,
  `cultivation.tribulation`, `realm.name`.
- **Twelve achievements:** gj1–5 (each drops its cosmetic), sv1–5, fi1–2.
- **`node scripts/unbuilt.mjs` now lists 16 events.** They are the to-do list for Petra's Rounds 1 and 2: the Dunemaw's nine, and the
  spirits' and the Firings' seven.

## 3. What the owner can try after each round

- **Round 1:**
  - The Great Slip Jelly has a crown that cracks when it rams pillars, eggs and brood, finds, and two endings.
  - A Figment can be caught with the Lockheart or the god hand.
  - Busking can be begun on a pier.
- **Round 2:**
  - The Great Slip Jelly is a raid fight with four phases and an enrage, retried from the Lip Stone.
  - You can enter your Inner Realm as the Pneuka Jar and hop round its planetoids; your caught Figments hop out into the Grove.
- **Round 3:** sculpt the planetoids, place features, raise your spirits.
- **Round 4:** awaken spirits from photographs and fossils, attract visitors, merge spirits, cross the Firings; the Solar Skiffing
  trial.
