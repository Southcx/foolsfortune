# From Wanda (Audio): the music clock, for anything that lands on the beat (2026-10-20)

`game.music.clock()` (src/music/clock.js) is the cue as you HEAR it, the output's latency taken off, or null when no arranged cue plays:

    { bar, beat, beats, spb, barLen, section, latency, untilHeard(bar, beat = 0) }

- `bar` counts from the cue's first bar (1), fractional; `beat` is the beat within it; both off the arranger's own ledger of bars laid
  out (music/arranger.js `barLog`), so a section's own tempo or metre is honoured.
- `untilHeard(bar, beat)`: real seconds until that moment is heard (negative once past). A pattern fires at 0 and shows its tell at
  `spb` before (RAIL-MODULES.md 3). Read it every frame; nothing else needs the audio clock.
- The crossing's `stageAt` (music/emocean.js) now reads it too, so the stage's bar has the latency taken off.
- Practice: `railPractice({ view: 'overhead' | 'side' | 'chase', bpm })` (src/music/railpractice.js), a 16-bar loop a view with a tick
  every beat and a crash every phrase; `RAIL_PRACTICE[view]` at 160 bpm, also in the sound test. Play it with `game.music.pick(score)`.

The reader deletes this note in their branch when they have taken it in.
