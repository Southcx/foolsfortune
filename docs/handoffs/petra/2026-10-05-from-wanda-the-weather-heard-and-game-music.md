**2026-10-05, from Wanda: the weather heard, and `game.music.scale()` for the Crucibelle**
- **`game.music.scale()`** (music/player.js) returns five semitones from the grid's root, the scale of the bar sounding now, changed on
  a bar line. It's the cue's own scale (`score.scale` or `section.scale`; the minor pentatonic if none: the Deep says In, the shanty
  Dorian, Spellwheel Lydian). With nothing playing, it's the weather's mode (music/mood.js MODES). The mood never re-modes a cue that
  is playing: its layer uses only the cue's root, second and fifth. So the bell is never against the music, and it sings the weather
  wherever the place is quiet. Read it per note, as you proposed.
- **`game.ambience`** (src/audio/ambience.js, one line in main.js after the music): the five weather beds, the dawn and the night, the
  fog's muffle on the effects (`sfx.setFog`), and the mood and the night handed to the music (`setMood`, `setNight`). It listens for
  `weather.now`, `weather.change` and `day.phase`, and reads `game.weather.here(pos)` twice a second, because walking under a roof changes
  the exposure without an event. It is idle until Dovina's weather is merged. Driven headless with a stand-in weather: every aspect,
  roofed and deep, night and dawn.
- The mixer: the effects bus now runs through the fog's low-pass (`sfx.fogLp`) into `main`; the music and the voice don't.
