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
| Ouranurgy (the rules of the space around you: displacement, and **time slowed or stopped**) | blink, the grapple's swing, the rail's stage; **blade mode's cuts, zandatsu, the reprogramming's stilled window, Celestial mode's canvas** (the owner, 2026-10-08; quality: what was done in the stilled time) | the Solar Skiff's tricks (quality: spins landed square); a lap circuit's medal |
| Manifestation | the god hand's manifest; **the wash** (slip laid on the world: Calissa) | the Soul Brush's paint laid (quality: coverage without waste); a feature placed in a good formation |
| Divination | crystals struck (pitch), photos (the plate's score once emitted, halved for a kind already held: Calissa), the survey (`map.surveyed`, the share newly charted: Petra), a Well charted, the reckoning, **a parry read from a blow's windup** (`move.parry`, quality the `lead`: the later in the window the better; Calissa, Petra) | reading the sky (a forecast that came true); **a creature's agate named at appraisal** (`appraise.mood { guessed, actual }`: 1 right, 0.5 one of its two feelings, 0.1 wrong: Espada) |
| Psychokinesis | the god hand's grab and throw; **the Throwing Room's drills** (`drill.end`, hits over shots; a tuned game earns nothing) | psygun hits on creatures (quality: chain, point-blank, a headshot) |
| Possession | the Lockheart's drain, reprogramming | a catch (quality: the struggle held through, the wheel's odds beaten); a spirit's bond raised |
| Alteration | the god hand's sunder, swell, wring; **terraforming strokes** (`garden.sculpt`, its `q` the water led where it pools: Petra to emit); **an inscription** (`brush.inscribe`: Calissa) | a crack mended; mopping a blot |
| Spellscription | sigils (`brush.glyph`, its `fit` once emitted: Calissa; `sigil.pop` no longer pays twice), macros | a Cogitomap copied; a realm's name written; `reprogram.run` (quality 1 when held first time and typed clean, else 0.4: needs `held`, `typos`, Espada); **time** (the owner: staying on tempo is transcribing actions to time): `song.play` (quality: its fever) and `rhythm.score` (quality: accuracy), both in `domains.js` now; a busk's tips x1.25 |

## 3. The knacks (names Espada's, 2026-10-08; achievements over the ledger)

| knack (toggle) | does | earned by (count, the patient's way / feat, the skilled way) | owner |
|---|---|---|---|
| Steady Hand | the psygun's aim drawn gently onto a target near the reticle | 2,000 drill targets hit / a drill's gold | Petra |
| Wide Bore | the psygun's shots a third wider | Psychokinesis 30 / a 25 chain | Petra |
| Thick Walls | the shield takes a tenth more before the clay | 200 cracks mended at the kiln / a Well run without a crack | Petra |
| Perfect Pitch | a crystal's target note sounds once more before you strike | 300 crystals struck / ten struck perfect in a row | Wanda |
| **Held Breath** (was Early Tell; Espada kept the name) | a blow's parry window a beat longer (0.25 to 0.40 real seconds), its glint with it | 500 parries / 50 clean parries (`lead` 0.25 or less) | Petra, Calissa |
| Rule of Thirds | the Veritome's frame shows its thirds (only after the score credits the thirds: today it rewards the centre) | 300 plates appraised / four four-star plates of four kinds | Calissa |
| Half Time | the metronome swings on every other beat (never slower: it stays on the music's grid, Wanda) | 1,000 notes on the beat / fever full for eight bars | Wanda |
| Guide Tone | the next charted note sounds a beat early | 50 songs played / a song at accuracy 0.95 or more | Wanda |
| Crib Sheet | the English gloss beside each neuralese word that is glossed (its reach grows by digging up ostraca: the owner, 2026-10-08) | 100 macros spoken / a five-Function macro held at the first try / six ostraca found (the explorer's way) | Espada, Petra |
| Two-Tone | both of an agate's colours shown on a creature's body | 300 agates seen / 20 named right in a row | Calissa, Espada |
| **Wet Ink** (Calissa's; Espada's name: the ink stays wet; "Slow Hand" collided with the hands) | Celestial mode waits longer after the last stroke (0.42 to 0.7 real seconds), so a two-stroke mark is not cut off | 100 marks misread (`brush.miss`: persistence through failure) / `bg3` | Calissa, Petra |
| **Ariadne's Thread** (Petra's; Espada's name) | Mind Mapping shows the way back to the last Shrine you rested at | 50 rooms charted / a Cogitomap drawn on a first run of the Great Dunemaw | Petra |

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
  script read), its seasoning to Focus (a rhythm combo of 25). **The owner's ruling (2026-10-08): no new domains, ever.** Time has two faces: **keeping it** (staying on tempo is transcribing actions to time) is Spellscription's; **bending it** (anything that slows or stops time: blade mode, zandatsu, reprogramming, Celestial mode) is Ouranurgy's, the domain of the rules of the space around you. A widening for it: `ouranurgy.still` (how long time stays slowed, x1.3 at 99).
- **Espada** (`2026-10-08-from-espada-training-words.md`, 1d71f21 on her branch): the knacks' names, Crib and Two-Tone, the agate guess
  at appraisal, the fading gloss; "knack" and "seasoning" kept. Emotional literacy's home: a mood read right seasons Charisma (added to
  `SEASONING` once `appraise.mood` exists).
- **The owner, 2026-10-08** (through Espada): the knacks' names approved; Crib is the **Crib Sheet**, and it glosses more for the one who
  explores: the ostraca (archaeology: Indiana Jones, Spelunky, La-Mulana). Where they lie, how many and what they count: `progress/ostraca.js`.
- **Calissa** (`2026-10-08-from-calissa-soul-alchemy-ux.md`, 12d0f33 on her branch): the plates, the sigils, the parry.
  - **Each system measures its quality and drops it before the event:** `photo.js` `score`, `gesture.js` `rec.score`, a windup's lead.
    The sources in `domains.js` now read each field when it is emitted and fall back until then: `photo.take { score, fresh }`,
    `brush.glyph { fit }`, `move.parry { lead }` (blows) and `{ d, reach }` (projectiles). Petra emits them.
  - **The Veritome teaches "centre it"**: `photo.js`'s `centre` term peaks dead centre and a subject on a third loses about 26 points of
    280. **Ruled:** a placement term (peaking at the four power points, 0.7 dead centre, lead room ahead of the facing) replaces it
    before Rule of Thirds ships, and a light term (the hour, front-lit) joins it. Petra's (`photo.js`), Calissa's brass tick on a third.
  - **Blows are parried by mashing:** `blow()` takes the first windup with no `eta` test and `answer` runs every frame of the press's
    window, so a press at the start of a 0.8 s lunge answers it. **Ruled:** a blow is answered only in its window (eta 0.25 s or less,
    as the siblings already do, `coop/fight.js`); the kick and the cutlass answer blows as every tool does (PARRY.md's promise; today
    they only deflect). Petra's (`parry.js`, `creatures.js`). And a **miss** is an outlined windup that runs out unanswered with the
    Courier in reach (`parry.missed`), so the feat's run can be kept (`parry.run.best`).
  - **Early Tell stacked on Perception's widening** (both draw a windup's mark out, and TRAINING forbids a knack on a widening): **Held
    Breath** (the window a beat longer) replaces it, above. Its name goes back to Espada and the owner.
  - **Trained, no home:** light reading (Divination, with the forecast: once the light term exists); candid observation (the bestiary's
    tiers); a cast avoided (Perception's seasoning, once `foe.dodge` exists); Willpower rewards being hit, where a parry streak is
    composure (kept: Willpower is the shield, and a parry seasons Perception).
- **Petra** (`docs/handoffs/dovina/2026-10-08-from-petra-training.md`): her rows are right; the events and their fields are confirmed
  (`drill.end`, `reprogram.run { q, misses, chars, secs, refused }`, `map.surveyed { gained }`), now in `domains.js`; `garden.sculpt`
  takes a `q` (the water held after the stroke against before, as a share; Petra's to emit); the parry's `lead` is hers to add. Her
  knack (the way back on the map) is in the table. **Patience** (angling) seasons Focus: a fish landed without the line breaking, once
  the landing says so (`fish.land { snapped }`).
- **Petra, built** (a564e9b, c4630c0): every field above is emitted; a blow is answered only inside `BLOW_WINDOW` (0.25 real seconds),
  so the parry's quality now runs 0.4 at the window's opening to 1 at the strike; `parry.missed` and `parry.run.best` are kept;
  `photo.js` credits the thirds (1 on a crossing, 0.7 dead centre); `garden.sculpt`'s `q` is the basins' volume after over before
  plus after (0.5 for a stroke that changed nothing). **Patience** seasons Focus on `angle.catch` (a snapped line loses the fish).
