# Training: how the Courier grows, and what the player learns doing it (the owner, 2026-10-08)

Kept by Dovina; each division owns its rows (section 5 asks). The laws are DESIGN.md section 22.

> "High skill skips grind, but long grind closes the gap in skill... Arts are unlocked by achievement and achievement only... persistence
> and perseverance ARE skills of their own. It's like doing Soul lvl 1 runs in Dark Souls. Doable, but difficult."
> "Game systems should endeavor as much as practicable to teach the user something... without them actively recognizing they're learning."

## 1. The three tracks, and how each obeys the laws

| track | what grows | how it grows | skill skips grind | grind closes the gap |
|---|---|---|---|---|
| **Domains** (seven, 1 to 99) | what the psyche can do: reach, radius, count (`WIDEN`) | EXP from doing the domain's things (`domains.js` SOURCES) | each act's EXP is weighted by its quality: a masterful act 5x, a rote one 0.4x | every act still gives EXP; 99 is reachable by anyone (about 2,100 real hours rote, 400 masterful) |
| **Attributes** (seven, 10 ranks) | what the vessel is: pool, holds, draw speed, mending (SOUL-ALCHEMY.md section 6) | fired at the spirit press | a true firing into a bare swatch, at half the cubes | seasoning from doing each attribute's thing widens its swatch two and a half times |
| **Arts** (Movement Arts, God Arts, **knacks**) | a new verb, or an assist you may switch on | **achievements only**, over the ledger | an achievement of feat (a chain, a time, a perfect run) opens it early | an achievement of count (a thousand swings) opens the same Art for the patient |

A **knack** (new: a passive Art, a toggle) is where accessibility lives: an assist earned by practice and switched on or off at will,
never needed and never forced. The number that would do the skill for you is opt-in and earned; the skill itself is never gated by it.

## 2. The domains: where each is trained (existing sources, and proposed)

| domain | trained by now (`domains.js`) | proposed (the owning division confirms the quality measure) |
|---|---|---|
| Ouranurgy | blink, the grapple's swing, the rail's stage | the Solar Skiff's tricks (quality: spins landed square); a lap circuit's medal |
| Manifestation | the god hand's manifest | the Soul Brush's paint laid (quality: coverage without waste); a feature placed in a good formation |
| Divination | crystals struck (pitch), photos, the survey, a Well charted, the reckoning | reading the sky (a forecast that came true); a parry read from a windup; **a creature's agate named at appraisal** (`appraise.mood { guessed, actual }`: 1 right, 0.5 one of its two feelings, 0.1 wrong: Espada) |
| Psychokinesis | the god hand's grab and throw | **psygun drills in the Throwing Room** (quality: the drill's score); psygun hits on creatures (quality: chain, point-blank, a headshot) |
| Possession | the Lockheart's drain, reprogramming | a catch (quality: the struggle held through, the wheel's odds beaten); a spirit's bond raised |
| Alteration | the god hand's sunder, swell, wring | terraforming strokes (quality: water led where it pools); a crack mended; mopping a blot |
| Spellscription | sigils, macros, a sigil's pop | a Cogitomap copied; a realm's name written; `reprogram.run` (quality 1 when held first time and typed clean, else 0.4: needs `held`, `typos`, Espada); **time** (the owner: staying on tempo is transcribing actions to time): `song.play` (quality: its fever) and `rhythm.score` (quality: accuracy), a busk's tips x1.25 |

## 3. The knacks (names Espada's, 2026-10-08; achievements over the ledger)

| knack (toggle) | does | earned by (count, the patient's way / feat, the skilled way) | owner |
|---|---|---|---|
| Steady Hand | the psygun's aim drawn gently onto a target near the reticle | 2,000 drill targets hit / a drill's gold | Petra |
| Wide Bore | the psygun's shots a third wider | Psychokinesis 30 / a 25 chain | Petra |
| Thick Walls | the shield takes a tenth more before the clay | 200 cracks mended at the kiln / a Well run without a crack | Petra |
| Perfect Pitch | a crystal's target note sounds once more before you strike | 300 crystals struck / ten struck perfect in a row | Wanda |
| Early Tell | a creature's windup glows a beat earlier | 500 parries / 25 parries without a miss | Petra, Calissa |
| Rule of Thirds | the Veritome's frame shows its thirds | 300 plates appraised / a four-star plate | Calissa |
| Half Time | the metronome swings on every other beat (never slower: it stays on the music's grid, Wanda) | 1,000 notes on the beat / fever full for eight bars | Wanda |
| Guide Tone | the next charted note sounds a beat early | 50 songs played / a song at accuracy 0.95 or more | Wanda |
| Crib Sheet | the English gloss beside each neuralese word that is glossed (its reach grows by digging up ostraca: the owner, 2026-10-08) | 100 macros spoken / a five-Function macro held at the first try / six ostraca found (the explorer's way) | Espada, Petra |
| Two-Tone | both of an agate's colours shown on a creature's body | 300 agates seen / 20 named right in a row | Calissa, Espada |

Calibration, key bindings and volume stay **settings**, never knacks (Wanda): what makes the game playable at all is never earned.

## 4. What each system teaches (the commandment)

| system | what the player learns without being told | its owner |
|---|---|---|
| The Dreamvane's crystals | relative pitch (the owner's): the reference is the sweet spot's own note, and the two beat near it, as a tuner tunes | Dovina, Wanda |
| Soul Alchemy | colour theory: hue, saturation, complements, the painter's eye | Dovina, Calissa |
| The Crucibelle, busking, the rhythm mode | rhythm; the pentatonic with no wrong notes (Orff); intervals as shapes (a song known by its contour); a miss leaves a hole in the tune | Wanda |
| The ambience | telling a weather by ear: the bed mixes in the next weather a game hour before a spell turns, a portent you hear | Wanda |
| The psygun and its drills | aim: flicking, tracking, recoil control | Petra |
| The Veritome's plates | composition: framing, the thirds, light | Calissa |
| Reprogramming | programming: sequence, condition, loop (the Functions are code) | Petra, Espada (neuralese) |
| Neuralese, the realm's names | a conlang's roots, compounding and modifier order, from use; taught by a fading gloss ("SIVA-LON (drink, long)" three times, then "SIVA-LON" alone) | Espada |
| The five feelings, agates, the wheel | emotional granularity (Lisa Feldman Barrett's term): naming mixed feelings; taught by the Veritome asking at appraisal which agate a creature was in; reading a mood right seasons Charisma | Espada, Dovina |
| Celestial mode's sigils | brush strokes and their order | Calissa |
| The garden's water and ground | watersheds and erosion: water goes where the land sends it | Petra |
| The formation (Wu Xing) | systems thinking: cycles that feed and check | Dovina |
| Crude, hauling, the Purser | supply and demand, arbitrage, risk against reward | Dovina |
| The Lockheart, the Tithe | probability: published odds, expected value, pity | Dovina |
| The forecast | reading a probabilistic forecast | Dovina |
| Mind Mapping | spatial memory and orientation | Petra |
| The parry, the rail | reading telegraphs, timing under pressure | Petra, Calissa |
| Angling | patience; managing tension | Petra |

## 5. Asked of every division (each answers for its rows; one reply)

1. For each system you own: is the real skill in section 4 right, and what in its design teaches it (the mechanic that does the
   teaching, not a tutorial)? Where it does not yet, what would?
2. For section 2: the event your system emits that should earn EXP, and how that event already measures quality (0 .. 1).
3. For section 3: a knack your system should offer (the assist a struggling player would want), and the achievement pair that opens it.
4. Anything a system of yours trains that has no home in the domains or attributes.

## 6. The answers (2026-10-08)

- **Wanda** (`docs/handoffs/dovina/2026-10-08-from-wanda-training.md` on her branch): folded in above. **Time (the beat) has no home**:
  it runs through the bell, the rhythm mode, the rail and the parry. Ruled for now: its EXP goes to Spellscription (a note chart is a
  script read), its seasoning to Focus (a rhythm combo of 25). **The owner's ruling (2026-10-08): no new domains, ever.** Staying on tempo is transcribing actions to time, so time is Spellscription's.
- **Espada** (`2026-10-08-from-espada-training-words.md`, 1d71f21 on her branch): the knacks' names, Crib and Two-Tone, the agate guess
  at appraisal, the fading gloss; "knack" and "seasoning" kept. Emotional literacy's home: a mood read right seasons Charisma (added to
  `SEASONING` once `appraise.mood` exists).
- **The owner, 2026-10-08** (through Espada): the knacks' names approved; Crib is the **Crib Sheet**, and it glosses more for the one who
  explores: the ostraca (archaeology: Indiana Jones, Spelunky, La-Mulana). Where they lie, how many and what they count: `progress/ostraca.js`.
- **Calissa**, **Petra**: awaited.
