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
| Divination | crystals struck (pitch), photos, the survey, a Well charted, the reckoning | reading the sky (a forecast that came true); a parry read from a windup |
| Psychokinesis | the god hand's grab and throw | **psygun drills in the Throwing Room** (quality: the drill's score); psygun hits on creatures (quality: chain, point-blank, a headshot) |
| Possession | the Lockheart's drain, reprogramming | a catch (quality: the struggle held through, the wheel's odds beaten); a spirit's bond raised |
| Alteration | the god hand's sunder, swell, wring | terraforming strokes (quality: water led where it pools); a crack mended; mopping a blot |
| Spellscription | sigils, macros, a sigil's pop | a Cogitomap copied; a realm's name written; a long macro typed clean |

## 3. The knacks (proposed; achievements over the ledger, names Espada's)

| knack (toggle) | does | earned by (count, the patient's way / feat, the skilled way) |
|---|---|---|
| Steady Hand | the psygun's aim drawn gently onto a target near the reticle | 2,000 drill targets hit / a drill's gold |
| Wide Bore | the psygun's shots a third wider | Psychokinesis 30 / a 25 chain |
| Kiln-Hardened | the shield takes a tenth more before the clay | 200 cracks mended at the kiln / a Well run without a crack |
| Tuning Fork | a crystal's target note hums once more before you strike | 300 crystals struck / ten struck perfect in a row |
| Second Look | a creature's windup glows a beat earlier | 500 parries / 25 parries without a miss |
| Wide Lens | the Veritome's frame shows its thirds | 300 plates appraised / a four-star plate |
| Slow Bell | the metronome swings half as fast while you learn a song | 200 songs played / a song's full combo |

A knack never stacks with a widening for the same thing; every one shows as on or off in the Codex, and a run with knacks on still counts
for everything (Dark Souls' level 1 is a choice, not a separate game).

## 4. What each system teaches (the commandment)

| system | what the player learns without being told | its owner |
|---|---|---|
| The Dreamvane's crystals | relative pitch (the owner's) | Dovina, Wanda |
| Soul Alchemy | colour theory: hue, saturation, complements, the painter's eye | Dovina, Calissa |
| The Crucibelle, busking, the rhythm mode | rhythm, the pentatonic scale, improvising in a key | Wanda |
| The psygun and its drills | aim: flicking, tracking, recoil control | Petra |
| The Veritome's plates | composition: framing, the thirds, light | Calissa |
| Reprogramming | programming: sequence, condition, loop (the Functions are code) | Petra, Espada (neuralese) |
| Neuralese, the realm's names | a conlang's roots: words learned from use | Espada |
| The five feelings, agates, the wheel | emotional literacy: naming mixed feelings, opposites cancelling | Espada, Dovina |
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
