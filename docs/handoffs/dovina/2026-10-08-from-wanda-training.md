**2026-10-08, from Wanda (Audio): TRAINING.md section 5 for the music's systems, and the spirit press's sound.**

## 1. What each teaches, and the mechanic that does it

| system | the real skill | what teaches it now | what would teach it better |
|---|---|---|---|
| The crystals (with you) | relative pitch: unison first, then hearing a strike's distance and direction from its target | the reference (`crystal.ref`) is the sweet spot's own note; a strike sounds `pitchOff` scale degrees away, and near the target the two **beat** against each other (`R.beat`): the ear hears beating slow to nothing, the way a tuner tunes | the key moves with the crystal (`refNote = t.key + 12`), so the ear can't learn one absolute E. Later, a reference a third or fifth away from the target trains intervals, not only unison |
| The Crucibelle | the pentatonic, phrasing, call and response, keeping time | five notes, all inside the cue's scale (`game.music.scale()`), so there are no wrong notes (Orff Schulwerk's rule for children); the metronome is the bell's swing; songs are note patterns, so motifs live in muscle memory (Ocarina of Time) | a song should be recognised by its **contour** (up a step, down a third), so it still plays when the key changes: that teaches intervals as shapes |
| Busking, the rhythm mode | rhythm reading, sight-reading a lane, holding a groove under pressure | the charted note is the song's own lead: a miss leaves a hole in the tune, so the ear hears the mistake before the eye does (Rhythm Heaven); grades come from milliseconds (`judge.js`) | right as it stands |
| The ambience | listening to the world: telling a weather by ear, and a mood before it arrives | each weather has its own sound bed (drops and gusts drawn as they fall), so with the HUD off you can tell grief's rain from mirth's | **proposed (mine to build):** the bed starts mixing in the next weather a game hour before the spell turns, a portent you hear. It pairs with Divination's "reading the sky" |

## 2. Domain EXP: the event and its quality (0..1)

- **`crystal.strike`:** already in `domains.js` (Divination: sweet 1, else `near`). Keep it.
- **`song.play`** (the Crucibelle): quality is `fever` (0..1). Fever rises only with notes on the beat (+0.1 each, −0.18 off it), so it already measures time kept. It has no `by` yet; I'll add `by: 'courier'` if you route it.
- **`rhythm.score`:** quality is `accuracy` (0..1, the share of the chart earned). A full combo (`full`) belongs to an achievement, not to EXP.
- **`busk.suits`** (the song's feeling suits the weather): no quality of its own. Use it as a ×1.25 on that busk's `rhythm.score` EXP: reading the sky, then playing to it.
- **The ambience:** emits nothing that should pay. Listening is its own reward.

**Which domain:** pitch (the crystals) fits Divination, as it is. Timing has no domain (see 4). Until it gets one, my vote for `song.play` and `rhythm.score` is Spellscription. The Crucibelle's songs are transcription, a phrase written into the air and read back.

## 3. Knacks (names are Espada's; the achievement pairs are yours to price)

| knack | does | count (the patient) / feat (the skilled) |
|---|---|---|
| **Tuning Fork** (yours) | agreed as written | 300 struck / ten perfect in a row |
| **Slow Bell** | the metronome swings on every other beat (half time). Not "half as fast": it must stay on the music's grid, or it teaches the wrong time | 1,000 Crucibelle notes on the beat / fever held full for eight bars |
| **Guide Tone** | in the rhythm mode, the next charted note sounds softly one beat early (a call you answer) | 50 songs finished / one finished on full with accuracy ≥ 0.95 |

These are **not knacks**; they stay settings, open from the start: the rhythm offset (latency calibration), the lane keys, and the music's volume. They are about the player's hardware and body, not their skill.

## 4. Trained with no home yet

- **Time** (keeping a beat, subdividing, a groove under pressure). It runs through the Crucibelle, the rhythm mode, the rail's quantised lock tones and the parry's window. Focus seasoning takes a rhythm combo of 25, which is right for attention, but no domain grows from timing. If an eighth ever comes, it is this one. Until then, Spellscription (above).
- **Ear for timbre** (the ambience's weathers, a crystal's nature by its ring). This is fine left unrewarded.

## 5. The spirit press's sound: yes, and it's better than a fit, it's the same geometry

The colour wheel and the circle of fifths are both a circle of twelve where opposites are as far apart as they can get:

- **Hue → a note on the circle of fifths:** each 30° is one fifth (0° E, 30° B, 60° F#, ... going one way; 330° A the other).
- **A path is a melody:** as the drop crosses each 30° line, the bell rings the new note. A material's path is heard as a walk of
  fifths or fourths: a short path is a few notes; a long one wanders far from home.
- **Analogous colours are related keys:** neighbours on the wheel are a fifth apart, the most consonant step.
- **Complements are the tritone:** 180° is six fifths, E against A#. The complement greying the drop is heard as that tritone
  resolving down into the drone. The painter's rule (complements make grey) and the musician's (the tritone wants to resolve) are
  the same move.
- **Saturation → how much note there is over the drone:** grey at the centre is the drone alone (low E, the bath humming). As
  saturation grows, the drop's note rises out of it, brighter, with more overtones.
- **The swatches:** each attribute's hue is held as a soft chord. As the drop nears a swatch, the drop's note and the swatch's
  beat against each other, slowing to stillness at its heart: the crystals' tuning lesson again, by ear. A true firing is the
  swatch's chord struck whole (the Answer, `MOTIF.ANSWER`, from that note). A refusal is the ball not dropping, with a muted thunk
  and no note.
- **What it teaches unsaid:** the circle of fifths, key distance, and the tritone resolving, alongside the eye's colour theory.

I'll build it in `src/audio/` as soon as the press has events to hang it on. One hook is all it needs: `alchemy.step { hue, sat }`
as the drop crosses each 30° (or every frame and I'll quantise), plus `alchemy.fire { attribute, true }`. Whoever builds
`progress/alchemy.js` (Petra, per the plan) emits them.

Open: Espada's names for Slow Bell and Guide Tone; your prices on the achievement pairs; whether time gets a home.
