# The Crucibelle on the compass: its UI and the visual metronome (the owner, 2026-10-08)

Kept by Dovina (what it must show and why); the look is Calissa's (`src/vfx/`, beside `vanehud.js`), hers to rewrite. Wanda's grid
(`music/player.js`) is the clock it reads.

> "Design a UI for the Crucibelle that matches the vibes of the UI for the Dreamvane... we need a visual metronome (covers
> accessibility for people with hearing difficulty)."

## 1. Why

The Crucibelle is played by ear: notes on the beat build fever, songs are motifs in time. Today the beat is shown only by the brass fob
swinging on the bell (`tools/crucibelle/model.js`): true to the rule (a swing, never a flash), but small, at the hip and often off
screen. A player who cannot hear the music cannot play the bell. The Dreamvane already has the answer's grammar: **the vane on the
compass** (`vfx/vanehud.js`): line-drawn, wordless, numberless marks hung on the wire compass's tape, in the colour of what the tool
is doing. The Crucibelle gets its own, **the bell on the compass**, in the same hand.

## 2. What it shows (one look with the vane's: lines, no words, no numbers)

| mark | shows | how (the grammar) |
|---|---|---|
| **The pendulum** | the beat: the music's eighths, the tempo, the bar | a line pendulum hung from the tape's centre, swinging so each end lands on an eighth (as the fob does, as a real metronome does); a heavier tick at the bar's downbeat. It moves; it never flashes |
| **The window** | when a note counts as on the beat | a short notch at each end of the swing's arc, as wide as the on-beat window; the arc between is plain line |
| **The notes** | which of the five you played, and whether it landed | a note pressed draws its sigil at the arc where the bob was: inside the notch it lands solid and bright, outside it hollow. Five sigils, one a note, each its own shape and colour (shape first, so a colour-blind player reads them); an octave up (RMB) doubles the sigil's line |
| **The motif** | the song being played | the last notes' sigils trail behind the bob along the tape like a phrase; when they make a song, the trail draws together into that song's own sigil and is taken into the bell (the song cast) |
| **Fever** | how hot the bell runs | the bob is an ember: its glow and a thin line of smoke above it rise with fever; at the peak the smoke rings out once round the tape |
| **Silence** | no music playing | the pendulum keeps the bell's own time (96) and its line is drawn fainter: still playable, honestly marked |

Shown while the Crucibelle is drawn, gone when it is stowed (as the vane's); never in the rhythm mode, which has its own note chart.

## 3. Accessibility (the reason it exists)

- **Every beat the ear gets, the eye gets:** the downbeat, the eighths, the window, the hit and the miss, fever, a song taken. Nothing
  about playing the bell needs sound.
- **Half Time** (the knack, Wanda's rule): the pendulum swings on every other beat, never slower, so it stays on the music's grid.
- **Settings, not knacks** (owner's rule via Wanda): the pendulum's size and the tape's contrast are settings, from the start.
- **No flash, ever** (the owner's, 2026-10-06): motion carries the beat; a landed note brightens, it does not blink.

## 4. What it teaches (the commandment)

**Subdivision and the bar.** Watching a pendulum swing eighths while the downbeat ticks heavier, the player learns to feel two to a beat
and four beats to a bar, and the window teaches how early or late "on the beat" can be. The motif trail is a phrase written out in time,
read left to right: the first sight of notation, without a staff. Keeping it is Spellscription's (transcribing actions to time, the
owner's ruling).

## 5. What it reads (Wanda's measure of main, 2026-10-08)

- **The clock: the bell's own `grid()`** (`tools/crucibelle/crucibelle.js:99`), never `game.music.grid()`: with no music the bell keeps
  its own 96 and the music's grid is null, which is exactly when a player practises. `spb` is seconds a **beat**, `t0` a bar line on the
  audio clock; the pendulum's phase is `(now - t0) / (spb / 2)` (half-beats), as the fob's at line 281.
- **The fever's level: the bell's `fever` (0 .. 1), read every frame**: it changes on every note and decays between them, so no event
  carries it.
- **Events** (Petra's file, `src/tools/`; the fields to add):
  - `crucibelle.note`: today `{ degree, onBeat }`. Add `note: degree, octave: high ? 1 : 0, by: 'courier'` (the octave is known at
    `note(d, high)`, line 140), keeping `degree` until the trackers move off it.
  - `song.play { song, fever, power, instrument, n }`: add `by: 'courier'`.
  - `crucibelle.fever` fires only at the peak (fever reaches 1 on a beat, once until it cools): it **is** the fever's peak.

## 6. Acceptance (each a check in the tools sweep)

1. With the Crucibelle drawn, the pendulum swings in step with `game.music`'s eighths, its ends within one frame of them; the downbeat
   tick heavier; stowed, it is gone.
2. A note on the beat lands solid inside the notch; off the beat, hollow outside it.
3. Five sigils, distinguishable in greyscale.
4. A song played draws its trail together and the song is cast.
5. With the sound muted, a sweep can play a song on the beat by reading only the pendulum (the accessibility test).
