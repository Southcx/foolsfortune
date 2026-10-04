# Your voice in the game: a recording plan

Yes, it would be cool. A synthesized voice and a human one laid together is an old and good sound: the human gives breath, grain and
the small unevenness that makes a word sound *meant*; the synth gives the even, uncanny calm that makes the System the System. Neither
alone is as interesting as the two. This page is what to record, how, and what the game will do with it.

## What the game can do with a recording (three ways, from simplest)

1. **Doubling.** Your recording of a whole line plays with the formant voice (`audio/voice/speech/synth.js`) saying the same line at the
   same time, the synth a little quieter, both through the same chorus and hall. The formant voice is stretched to your timing (each
   word lined up with yours), so the two speak as one. Best for the fixed lines: "Notice.", "Warning.", "Achievement acquired."
2. **The System wearing your voice (a vocoder).** Your recording is the *modulator*, the formant voice's glottis (a buzz at the
   System's even pitch, 185 Hz, falling at the end) is the *carrier*: the result is your words, your mouth, said in the System's flat
   pitch and timbre, then mixed with a little of you dry and a little of the synth. This is the most "physical meets digital" of the
   three and the one I would build first. (Prior art: the vocoders of Kraftwerk and of Daft Punk; Portal's GLaDOS, a real actor
   pitch-flattened and stepped by machine.)
3. **A word bank.** Each word the System uses is recorded once, and lines are put together from words, with the formant voice filling
   in any word you did not record (a creature's name, a new skill). This is Half-Life's VOX announcer ("Attention. Biohazard
   detected.") and every train station's: it means new lines cost nothing to record, at the price of a slightly stitched sound, which
   suits a System.

The clay folk could take some of you too: five vowels (a, i, u, e, o: five) sung softly on E and on G, mixed a little under their
bells and clinks (`npc/clayese.js`), so they sound like clay that once heard a person.

## How to record

- **Format:** WAV, 48 kHz or 44.1 kHz, 24-bit (16 is fine), mono. No MP3.
- **Room:** the quietest and *deadest* room you have: a closet of clothes is a famous vocal booth. No fans, fridge or computer hum if
  you can help it. Record ten seconds of the room's silence as well (`room_tone.wav`): it lets the noise be removed cleanly.
- **Microphone:** whatever you have; a phone's is acceptable. A hand's width to a forearm away (15 to 30 cm), a little off to the side
  of your mouth so the P's and B's do not pop. Keep the same distance for the whole session.
- **Level:** the loudest word should peak around -6 dB, never clipping. Leave the recording dry: no reverb, no compression, no noise
  removal, no EQ. The game adds its own treatment.
- **Takes:** say each line **three times**, a beat of silence (about one second) between takes, and one second of silence at the
  start and end of each file.
- **Delivery (the System):** calm, even, unhurried, a little above your usual speaking pitch, as if reading a notice to a room; keep
  the pitch level and let it **fall at the end** of each sentence. Do not act it. Flat is right.
- **Names:** one file per line, named by the list below (`notice.wav`, `achievement_acquired.wav`...). Take your time; it is roughly
  fifteen minutes of recording.

## What to record

### A. The System's fixed lines (for doubling and the vocoder)

| File | Line |
| --- | --- |
| `notice` | Notice. |
| `warning` | Warning. |
| `confirmed` | Confirmed. |
| `achievement_acquired` | Achievement acquired. |
| `title_acquired` | Title acquired. |
| `skill_acquired` | Skill acquired. |
| `god_art_acquired` | God art acquired. |
| `variant_acquired` | Variant acquired. |
| `rank_risen` | Your rank has risen. |
| `now_known_as` | You are now known as a ... (stop before the name) |
| `analysis_complete` | Analysis complete. |
| `analysis_progressed` | Analysis has progressed. |
| `card_bound` | A rank S card has been bound. |
| `card_bound_ss` | A rank double S card has been bound. |
| `box_full` | The Pneuka Box is full. |
| `left_on_ground` | ... has been left on the ground. |
| `lachryma_detected` | Abnormal concentration of Lachryma detected. |
| `landed` | ... has been landed. |

### B. The word bank (each word alone, said as if in the middle of a sentence)

notice, warning, confirmed, achievement, title, skill, art, god, variant, acquired, your, rank, has, have, been, risen, you, are,
now, known, as, a, the, of, analysis, is, complete, progressed, card, bound, S, double, Pneuka, box, full, left, on, ground,
abnormal, concentration, Lachryma, detected, landed, it, and the numbers one to ten.

### C. The game's names (said once each, plainly)

Fool's Fortune, Courier, Veritome, Lachryma, Pneuka, Saggar, Pip, Grog, Raku, Clapperjar, the Weir, the Dunes, the Siege.

### D. For the clay folk (optional)

The five vowels **a i u e o**, each sung softly for about a second, once on an E and once on a G (any octave that is comfortable; hum
the note first). Then the same five, spoken short and breathy, as if surprised.

## What happens when you send them

Drop the files in the repo under `src/assets/voice/` (or send them here). The game will: trim and denoise them against the room tone,
level them, line the formant voice up with each one (a forced alignment against the lexicon's phonemes), and add a **voice mix**
switch to the Codex beside VOICE (synth / blend / yours). Recordings go into the build only as compressed audio, and the README's
credits will name them as yours.
