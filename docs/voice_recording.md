# Your voice in the game: a recording plan

A human voice laid with the synthesized one: the human gives breath and intent, the synth the System's even calm. Nothing is
recorded yet; this is what to record and what the game will do with it.

## What the game does with it

1. **Doubling:** your line and the formant voice (`audio/voice/speech/synth.js`) together, the synth stretched to your timing. For the
   fixed lines.
2. **A vocoder (build first):** your recording modulates the System's flat buzz (185 Hz, falling at the end): your words in its
   pitch (Kraftwerk, Daft Punk, GLaDOS).
3. **A word bank:** lines stitched from words, the synth filling any word not recorded (Half-Life's VOX).

The clay folk can take five sung vowels softly under their bells (`npc/clayese.js`).

## How to record

- WAV, 44.1 or 48 kHz, mono, dry (no reverb, compression, noise removal or EQ); peaks about -6 dB, never clipping.
- The deadest, quietest room (a closet of clothes); ten seconds of its silence as `room_tone.wav`.
- 15 to 30 cm from the microphone, a little off-axis; the same distance throughout.
- Each line three times, a second of silence between takes and at both ends; one file per line, named below.
- The System's delivery: calm, even, a little above your speaking pitch, falling at the end. Flat is right.

## What to record

- **The fixed lines:** `notice` Notice. · `warning` Warning. · `confirmed` Confirmed. · `achievement_acquired` · `title_acquired` ·
  `skill_acquired` · `god_art_acquired` · `variant_acquired` · `rank_risen` Your rank has risen. · `now_known_as` You are now known as
  a ... · `analysis_complete` · `analysis_progressed` · `card_bound` A rank S card has been bound. · `card_bound_ss` (double S) ·
  `box_full` The Pneuka Box is full. · `left_on_ground` ... has been left on the ground. · `lachryma_detected` Abnormal concentration
  of Lachryma detected. · `landed` ... has been landed.
- **The word bank** (each word alone, as if mid-sentence): notice, warning, confirmed, achievement, title, skill, art, god, variant,
  acquired, your, rank, has, have, been, risen, you, are, now, known, as, a, the, of, analysis, is, complete, progressed, card,
  bound, S, double, Pneuka, box, full, left, on, ground, abnormal, concentration, Lachryma, detected, landed, it, one to ten.
- **The names:** Fool's Fortune, Courier, Veritome, Lachryma, Pneuka, Saggar, Pip, Grog, Raku, Clapperjar, the Weir, the Dunes,
  the Siege.
- **The clay folk (optional):** a i u e o, each sung softly a second on E and on G; then spoken short and breathy.

## When they arrive

Into `src/assets/voice/`: trimmed and denoised against the room tone, levelled, aligned to the lexicon's phonemes, and a **voice
mix** switch beside VOICE in the Codex (synth / blend / yours). Credited as yours in the README.
