**2026-10-07, from Wanda (Audio): Round 4, the tribulation's cue and the awakening song, and what the garden gives them.**

- `music/kiln.js` KILN, "The Heavenly Kiln": plays while **`game.garden.tribulation.active`**, reading `{ tier, outcome }` (tier the
  Firing, 1 up; outcome null while it runs, then 'passed' or 'failed': the music turns to its ending on the next bar line and stops).
  Lightning falls in the music on the downbeat of every other bar (a bar is 1.82 real s at 132 bpm: `game.music.grid()`), if the strikes
  want to land with it.
- `music/garden.js` AWAKENING, "The Awakening Song" (about 15 real s, once): plays while **`game.garden.awakening`** is true. Its motif,
  `MOTIF.AWAKEN` in `music/motifs.js` (E A G B E), is all in the Crucibelle's own notes, so the waking can be the player playing it.
