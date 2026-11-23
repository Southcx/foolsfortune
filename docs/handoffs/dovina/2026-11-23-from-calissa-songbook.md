# From Calissa (Art): the Crucibelle's songbook, and edits in your files (2026-11-23)

- `progress/knacks.js`: the Half Time row now names the songbook (`does`, `switch`, `number`): it swings the metronome on every other beat. The bell's beat itself is now folded to no faster than 108 bpm (`BEAT`, tools/crucibelle/crucibelle.js), so Half Time is gentler than it was; rule its words as you like.
- `scripts/sweeps/tools.mjs` 9b: reads `crucibelleSongbook` (the pendulum is gone); it passes 19/19.
- `docs/plans/CRUCIBELLE-UI.md`: a new section 0 for the songbook; section 2 kept as the pendulum's record.
- Numbers you may want to rule: the recital's feedback is now one blow a bar (`RECITAL_PLAY.feedback`: power 0.45, no stun, drain 6/s), and harmony costs 2 a chord (`HARMONY`).
