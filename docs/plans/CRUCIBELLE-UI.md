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

## 2. What it shows: built (Calissa, `src/vfx/crucibellehud.js`, 01268f8 on her branch; lines, no words, no numbers)

| mark | shows | as built |
|---|---|---|
| **The bell's mark** | where the pendulum hangs | on the wire compass's tape, at its centre |
| **The pendulum** (*not* the metronome: that is the fob on the bell) | the beat: the eighths, the tempo, the bar | hangs below the tape, swinging AMP x cos(pi x phase) on the bell's own `grid()`: each end lands on an eighth (measured: worst 2 ms off the music's grid at 75 bpm), easing into the ends. On the downbeat the rod and bob thicken and that end's mark stands taller: shape, never a flash |
| **The notches** | when a note counts as on the beat | a forked groove at each end, exactly the angle the bob sweeps inside the bell's window (plus or minus 0.085 real seconds): the notch is the window |
| **The neumes** (*not* sigils: those are the Soul Brush's) | which note you played, and whether it landed | each press draws its neume on the arc where the bob was: solid inside the notch, hollow outside; an octave up (RMB) doubles its line. Aikin's shape notes: root a **square**, 2 a **triangle**, 3 a **bowl**, 4 a **diamond**, 5 a **circle**, each in its degree's colour, distinct in greyscale at 13 px |
| **The motif** | the song being played | the last neumes trail along the tape as a phrase; when they make a song they gather into **that song's neume** (heads heighted by pitch, joined in one ligature: chant's compound neume) and are taken into the bell's mark; too dry to sing, they fall |
| **Fever** | how hot the bell runs | the bob is an ember trailing smoke that rises with fever; at the peak a ring of smoke travels round the tape once |
| **Silence** | no music playing | the bell's own 96, the line drawn fainter |

Shown while the Crucibelle is drawn, gone when it is stowed; never in the rhythm mode. A faint dark keyline under the lines at the
default contrast (additive lines vanish on the Dunes' noon sky).

## 3. Accessibility (the reason it exists)

- **Every beat the ear gets, the eye gets:** the downbeat, the eighths, the window, the hit and the miss, fever, a song taken. Nothing
  about playing the bell needs sound.
- **Half Time** (the knack, Wanda's rule; the name stays, the owner approved it): the ends land on quarters and a centre notch marks the
  off-eighth, never slower than the music's grid. Wired to `game.knacks?.halfTime`; the knack itself is built with the knacks.
- **Settings, not knacks** (owner's rule via Wanda): `visual.pendulumSize` and `visual.compassContrast`, from the start (built).
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
  - Export the bell's `WINDOW` (0.085 real seconds), which the pendulum mirrors today (Calissa).

## 6. Acceptance (each a check in the tools sweep)

1. With the Crucibelle drawn, the pendulum swings in step with `game.music`'s eighths, its ends within one frame of them; the downbeat
   tick heavier; stowed, it is gone.
2. A note on the beat lands solid inside the notch; off the beat, hollow outside it.
3. Five sigils, distinguishable in greyscale.
4. A song played draws its trail together and the song is cast.
5. With the sound muted, a sweep can play a song on the beat by reading only the pendulum (the accessibility test). Built: the tools
   sweep's `pendulum` part plays THE RALLY (1 3 5) off `game.crucibelleHud.read()` alone (Calissa measured 19/19 on her branch;
   on main once her branch lands). 1 to 4 were measured headless by Calissa.
